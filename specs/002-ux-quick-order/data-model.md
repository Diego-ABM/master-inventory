# Data Model — Estabilidad, pedido rápido y experiencia de uso

Fecha: 2026-11-16 · Feature: `002-ux-quick-order`

**Sin cambios de esquema.** La feature reusa las tablas existentes; lo único
"nuevo" es la clave del negocio, que vive en una variable de entorno, y la
sesión, que vive en una cookie firmada por hash. Ninguno toca Postgres.

## Entidades existentes (reusadas, sin migración)

### Producto (`productos`)

Campos relevantes para esta feature: `nombre` (fuente de la etiqueta del ítem),
`variante`, `peso_kg`, `mascota` (desambiguadores FR-005), `cantidad_stock`,
`stock_minimo` (alertas del panel), `fecha_vencimiento` (alertas del panel).

### FotoProducto (`fotos_producto`)

`datos BYTEA` + `mime TEXT` + `ruta_archivo TEXT` (servida por
`GET /api/fotos/[name]`). Lo que cambia es **el tamaño de lo que se inserta**:
el cliente comprime a WebP ≤ 1600 px / calidad ~80% antes de subir, así que
`datos` recibe siempre archivos livianos. Máximo 5 fotos por producto (regla ya
implementada en `fotoRepo.agregar`).

### PedidoCliente (`pedidos_clientes`) y PedidoItem (`pedido_cliente_items`)

El ítem guarda `nombre_producto` como snapshot legible. Regla nueva de
escritura (sin columna nueva): al crear un ítem de catálogo el servidor guarda
`etiquetaItemProducto(producto)` = `nombre` + desambiguador (`variante` →
`peso_kg` → `mascota` ≠ UNISEX, en ese orden, solo con datos presentes); nunca
`id` ni códigos internos. Ítems personalizados (`producto_id = null`) conservan
el texto libre del usuario. Lectura: si `nombre_producto` viniera vacío, la
vista muestra "Producto sin nombre".

### Venta (`ventas`, `venta_items`)

Solo lectura para el panel: `ventaRepo.listar({desde, hasta})` da las ventas
del día.

### Log (`logs`) y Meta (`meta`)

Sin cambios. Se registran eventos de acceso (entrada fallida/exitosa, salida)
con `logRepo` como en los demás módulos.

## Entidades nuevas (fuera de la base de datos)

### ClaveNegocio — variable de entorno `CLAVE_ACCESO`

- Única credencial compartida del negocio; no hay usuarios ni roles.
- Se define en `.env.local` (desarrollo) y en las variables del proyecto en
  Vercel (producción). Documentada en `.env.example`.
- Nunca se persiste en BD ni se expone al cliente; solo el servidor la lee.
- Si no está configurada, cualquier intento de entrada falla con mensaje claro.

### SesionAcceso — cookie httpOnly `mi_sesion`

| Campo | Valor |
|-------|-------|
| Nombre | `mi_sesion` |
| Valor | `sha256("sesion:" + CLAVE_ACCESO)` en hex (Web Crypto) |
| `httpOnly` | sí |
| `sameSite` | `lax` |
| `secure` | sí en producción |
| `max-age` | 30 días (2 592 000 s) |
| `path` | `/` |

- Verificación: el proxy recalcula el hash y compara; coincidencia exacta.
- Sin estado en servidor: cambiar `CLAVE_ACCESO` invalida todas las sesiones.
- "Salir" borra la cookie (`max-age=0`) y exige clave en el próximo acceso.

## Reglas de validación relevantes

| Regla | Origen | Dónde se aplica |
|-------|--------|-----------------|
| Foto: png/jpg/jpeg/webp solamente | FR-002, FR-003 | Cliente (`accept`, tipo) + servidor (extensión/mime) |
| Foto: ≤1600 px, calidad ~80% en el dispositivo | FR-019 | `src/lib/imagen.ts` antes del upload |
| Foto: máx. 5 por producto | existente | `fotoRepo.agregar` |
| Ítem: etiqueta = nombre + variante, nunca código | FR-004, FR-005 | `etiquetaItemProducto` en `src/lib/domain/pedidos.ts` |
| Ítem: cantidad entera > 0 y ≤ stock (ítems de catálogo) | existente | `validarCantidad` en el servicio de pedidos |
| Pedido: ≥ 1 ítem, nombre de cliente obligatorio | existente | `esquemaPedido` (zod) |
| Sesión: cookie válida obligatoria en todas las rutas excepto `/acceso` y assets | FR-011 | `src/proxy.ts` |

## Transiciones de estado

- **Sesión**: sin sesión → (clave correcta) → sesión activa 30 días →
  ("Salir" o expiración o cambio de `CLAVE_ACCESO`) → sin sesión.
- **Pedido**: sin cambios (pendiente → entregado/pagado, ya existente).
- **Foto**: pendiente de subir → comprimida en dispositivo → validada →
  persistida en `fotos_producto` con `ruta_archivo` `/api/fotos/{id}{ext}`.
