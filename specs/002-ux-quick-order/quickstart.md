# Quickstart — validación de la feature

Guía para comprobar, usando la app, que cada historia de `spec.md` funciona de
punta a punta. No requiere leer código.

## Prerrequisitos

```bash
cd portal
cp .env.example .env.local   # si no existe
# En .env.local definir:
#   STORAGE_POSTGRES_URL="postgres://..."   (Supabase)
#   CLAVE_ACCESO="una-clave-de-prueba"
pnpm install
pnpm dev                     # http://localhost:3000
```

## Escenario 1 — Fotos sin caídas (US-1, SC-001)

1. Entrar con la clave → Inventario → cualquier producto → "Agregar foto".
2. Subir una foto tomada con celular (5–15 MB, JPG). **Esperado**: la foto se
   guarda, aparece en la galería y la app sigue funcionando.
3. Repetir con fotos en 10–20 productos distintos. **Esperado**: 0 caídas.
4. Intentar subir un `.heic` o un archivo de texto renombrado a `.jpg`.
   **Esperado**: mensaje claro en español ("formato no admitido" / "no se pudo
   leer la imagen"), sin caída, y el producto queda intacto.
5. Recargar la página del producto. **Esperado**: las fotos cargan desde caché
   del navegador (DevTools → Network → `200 (from disk cache)` o similar).

## Escenario 2 — Pedido en un toque (US-2, SC-002, SC-005)

1. Con la app abierta en Inventario (o cualquier pantalla del dashboard),
   tocar el botón flotante "+". **Esperado**: llega directo al formulario de
   nuevo pedido — 1 solo toque desde abrir la app.
2. Registrar un pedido de 3 ítems cronometrado. **Esperado**: menos de 60
   segundos, sin rodeos.
3. Repetir desde la lista de Pedidos y desde el Panel. **Esperado**: mismo
   resultado.
4. En `/dashboard/pedidos/nuevo` **esperado**: el FAB no estorba (no se
   muestra sobre el propio formulario).

## Escenario 3 — Nombre y variante en ítems (US-3, SC-003)

1. Crear un pedido añadiendo un producto del catálogo. **Esperado**: el ítem
   muestra el nombre del producto, no un código.
2. Crear (o usar) dos productos con el mismo nombre y distinta variante
   (p. ej. dos "Comida gato" con variantes distintas) y añadirlos al pedido.
   **Esperado**: cada ítem los distingue por la variante/peso/mascota.
3. Abrir un pedido ya creado. **Esperado**: todos los ítems con nombre; si
   alguno antiguo no tuviera nombre, muestra "Producto sin nombre".

## Escenario 4 — Celular y computador (US-4, SC-004)

1. DevTools → vista de dispositivo ~360 px: recorrer Panel, Inventario,
   Pedidos, Ventas, Alertas. **Esperado**: legible, botones alcanzables, cero
   scroll horizontal; navegación inferior presente.
2. Ventana ~1920 px: mismas pantallas. **Esperado**: el contenido usa el ancho
   (rejillas de varias columnas), navegación en el header, sin scroll
   horizontal.
3. Completar el registro de un pedido en ambos tamaños. **Esperado**: flujo
   completo y cómodo en los dos.

## Escenario 5 — Login y panel (US-5)

1. En ventana de incógnito, abrir la app. **Esperado**: pantalla de acceso;
   sin clave no se ve ningún dato (probar también una URL directa como
   `/dashboard/pedidos` y `/api/fotos/1.png`).
2. Ingresar una clave incorrecta. **Esperado**: "La clave no es correcta.",
   sin revelar datos.
3. Ingresar la clave correcta. **Esperado**: panel con ventas del día, pedidos
   pendientes, alertas de stock y accesos rápidos (incluido "Nuevo pedido").
4. Cerrar y reabrir el navegador antes de 30 días. **Esperado**: entra directo
   al panel.
5. Usar "Salir". **Esperado**: vuelve a la pantalla de acceso y la cookie
   queda borrada (siguiente visita exige clave).

## Escenario 6 — Polish y español (US-6, SC-006)

1. Guardar/tocar acciones en varias pantallas. **Esperado**: feedback visible
   inmediato (botón deshabilitado + toast).
2. Abrir el buscador del header. **Esperado**: textos en español.
3. Recorrer pantallas. **Esperado**: misma paleta/estilo, transiciones suaves,
   todo en español de Colombia y montos en `$ …​ COP` con formato local.

## Tests de dominio (opcional, técnico)

```bash
cd portal
node --test 'src/lib/domain/*.test.ts'   # incluye tests de etiquetaItemProducto
pnpm check                             # biome lint+format
pnpm build                             # compilación limpia
```
