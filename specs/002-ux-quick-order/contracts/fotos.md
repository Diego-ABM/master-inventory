# Contrato: Fotos de producto

## Carga (cliente → servidor)

### Compresión en dispositivo — `src/lib/imagen.ts`

`comprimirFoto(archivo: File): Promise<File>`

| Entrada | Salida |
|---------|--------|
| File `image/png`, `image/jpeg`, `image/webp` decodificable | `File` WebP, lado máximo 1600 px, calidad ~0.8, nombre `<base>.webp` |
| Tipo no admitido (p. ej. HEIC `image/heic`) | rechaza con mensaje "Formato de imagen no admitido. Usa JPG, PNG o WebP." |
| Archivo no decodificable (corrupto) | rechaza con mensaje "No se pudo leer la imagen; el archivo parece estar dañado." |

La imagen nunca se rechaza por peso del original (FR-019): el tamaño se
controla comprimiendo.

### Server Action — `agregarFoto(productoId: number, formData: FormData)`

Sin cambios de firma. Comportamiento:

- `foto` ausente → `{ ok: false, mensaje: "No se recibió ningún archivo." }`
- Extensión fuera de `.png/.jpg/.jpeg/.webp` →
  `{ ok: false, mensaje: "Solo se permiten imágenes png, jpg, jpeg o webp." }`
- 5 fotos ya registradas → `{ ok: false, mensaje: "El producto ya tiene el máximo de 5 fotos." }`
- Éxito → inserta en `fotos_producto` (BYTEA + mime), fija
  `ruta_archivo = /api/fotos/{id}{ext}`, retorna `{ ok: true, data: { id } }`
- Cualquier otra falla → `{ ok: false, mensaje: "No se pudo agregar la foto." }`
  + log ERROR. **Nunca propaga excepción al cliente** (FR-001, FR-002).

### `next.config.mjs`

```js
experimental: { serverActions: { bodySizeLimit: "4mb" } }
```

Margen sobre el tope de 1 MB por defecto; la compresión mantiene los cuerpos
muy por debajo.

## Servido — `GET /api/fotos/[name]`

Sin cambios: `Content-Type` por mime guardado o extensión;
`Cache-Control: public, max-age=31536000, immutable` (FR-020). La ruta queda
protegida por el gate de acceso (ver `acceso.md`).
