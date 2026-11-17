# Quickstart: Pulido de accesibilidad y UI

Guía de validación end-to-end. No hay tests automatizados de UI: cada escenario
se comprueba usando la app (Constitución IV).

## Prerequisitos

```bash
cd Portal
pnpm install && pnpm dev   # http://localhost:3000
```

Herramientas: navegador con DevTools (emulación de dispositivo + safe-area,
inspector de accesibilidad del árbol a11y). Lector de pantalla opcional
(VoiceOver en macOS/iOS, NVDA en Windows) — el inspector basta para verificar
nombres accesibles.

## Escenario 1 — Operación por teclado y lector de pantalla (US1, SC-001/SC-003)

1. Carga `/dashboard`. Pulsa **Tab** una vez → aparece el enlace "Saltar al
   contenido principal"; **Enter** → el foco salta al área principal.
2. En el inspector de accesibilidad (o lector de pantalla), verifica nombre en
   español para: botón de tema (header), botón de preferencias (header), campo
   de búsqueda del diálogo (`Ctrl+K` o icono lupa), papelera de una tarjeta de
   pedido (`/dashboard/pedidos`), papelera de una venta (`/dashboard/ventas`),
   botón `X` de un ítem en `/dashboard/pedidos/nuevo`.
3. `/dashboard/pedidos/nuevo`: cada etiqueta visible ("Producto del catálogo",
   "Ítem personalizado", "Precio", "Cantidad" ×2) activa/expande su control al
   pulsarla; igual "Mascota" y "Categoría" en `/dashboard/inventario/nuevo`.

**Esperado**: 0 controles anunciados como "botón" genérico; 0 etiquetas
huérfanas (SC-001, SC-003).

## Escenario 2 — Área segura y respuesta táctil (US2, SC-002)

1. DevTools → emular iPhone con notch (o "device toolbar" + safe-area forzada).
2. En vertical: la barra inferior y el FAB "+" quedan por encima del indicador
   de inicio, sin solaparse ni tapar contenido al hacer scroll al fondo.
3. En horizontal: los controles fijos no quedan bloqueados por los insets
   laterales.
4. Toca cualquier botón/enlace una vez → responde de inmediato, sin espera de
   doble-toque. El zoom por pellizco sigue funcionando.

**Esperado**: 0 controles tapados (SC-002); sin retardo táctil.

## Escenario 3 — Acabado consistente (US3, SC-004/SC-005)

1. Abre el panel de preferencias del header → todas las etiquetas en español;
   el `aria-label` del botón de tema también (SC-004).
2. Compara precios en la rejilla de inventario y totales del panel: las cifras
   se alinean en columna (ancho numérico uniforme).
3. Revisa placeholders: los que sugieren un ejemplo terminan en "…".
4. Recarga una pantalla con fotos de producto con red lenta (throttling):
   el contenido no salta al llegar las imágenes (SC-005).
5. Panel del dashboard sin datos (ventas del día / alertas en cero): usa el
   mismo estilo de estado vacío que el resto de secciones.

## Escenario 4 — Cambios sin guardar (US3, SC-006)

1. `/dashboard/inventario/nuevo`: escribe un nombre y **cierra la pestaña** o
   recarga → el navegador muestra su aviso nativo de cambios sin guardar.
2. Repite con `/dashboard/inventario/[id]/editar` tras modificar un campo, y
   con `/dashboard/pedidos/nuevo` tras agregar un ítem.
3. Guarda el formulario correctamente → al salir después NO aparece aviso.
4. Formulario intacto (sin tocar) → cerrar/recargar no avisa.
5. `/dashboard/ventas/nueva` y `/acceso`: con valor en el campo, cerrar no
   avisa (son triviales, por diseño).
6. Navegar con el menú lateral con cambios → NO avisa (alcance aceptado, ver
   Assumptions en spec.md).

**Esperado**: aviso nativo en 100% de los intentos de cerrar/recargar con
cambios en los formularios cubiertos (SC-006).

## Escenario 5 — theme-color (US3, FR-012)

1. Con tema claro: inspecciona `<meta name="theme-color">` → coincide con el
   fondo claro de la app.
2. Pulsa el botón de tema del header hasta modo oscuro → el meta se actualiza
   al fondo oscuro sin recargar.
3. Cambia el preset de tema en el panel de preferencias → el meta sigue al
   fondo del preset activo.
4. En Android/PWA o barra del navegador, el chrome del sistema toma ese color.

## Verificación de regresión

```bash
cd Portal
pnpm check   # lint + format (Biome)
pnpm build   # typecheck + build de producción
```

**Esperado**: `check` limpio según las reglas existentes; `build` exitoso sin
warnings nuevos de accesibilidad ni de Next.
