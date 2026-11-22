# Research: Pulido de accesibilidad y UI

Todas las decisiones se tomaron inspeccionando el código real en `portal/src` y las
docs empaquetadas de Next 16.4.6 (`node_modules/next/dist/docs/`). No quedan
`NEEDS CLARIFICATION`.

## D1 — Nombres accesibles en controles solo-ícono (FR-001)

**Decision**: Agregar `aria-label` en español a cada botón solo-ícono (Base UI/shadcn
propaga el atributo al elemento nativo). Inventario detectado:

- `header/theme-switcher.tsx` — tiene `aria-label` **en inglés** → traducir.
- `header/layout-controls.tsx` — trigger del `Popover` (icono `Settings`) sin nombre → `aria-label="Preferencias de visualización"`.
- `ventas/_components/boton-eliminar-venta.tsx` — `Trash2` sin nombre → `aria-label="Eliminar venta"`.
- `pedidos/_components/tarjeta-pedido.tsx` — `Trash2` sin nombre → `aria-label="Eliminar pedido"`.
- `pedidos/nuevo/_components/formulario-pedido.tsx` — botón `X` por ítem → `aria-label="Quitar ítem"` (o con nombre del producto si es trivial).
- `header/search-dialog.tsx` — `CommandInput` solo con placeholder → `aria-label="Buscar"`.
- Auditoría final sobre los demás `size="icon"`: `boton-favorito`, `nav-header`,
  `controles-stock`, `marcado-proveedor`, `lista-proveedor`, `controles-reporte`,
  `filtros-inventario` (algunos ya pueden tener nombre; verificar, SC-001 exige 100%).

**Rationale**: `aria-label` es lo mínimo; los íconos lucide ya llevan `aria-hidden`
en varios sitios — conviene marcar `aria-hidden` el ícono donde falte para no
duplicar anuncio.

**Alternatives considered**: texto visualmente oculto (`sr-only`) dentro del botón —
equivalente, pero `aria-label` es una línea y no altera layout; texto con tooltip —
no aporta nombre accesible por sí solo.

## D2 — Asociación etiqueta ↔ control (FR-002)

**Decision**: Completar pares `htmlFor`/`id` en inputs nativos y `aria-labelledby`
donde el control no es un `<input>` (Selects de Base UI renderizan botón):

- `formulario-pedido.tsx`: `Label` sin `htmlFor` en "Producto del catálogo",
  "Cantidad" (×2), "Ítem personalizado", "Precio" → asociar cada una a su
  `Select`/Input.
- `formulario-producto.tsx`: `Label` "Mascota" y "Categoría" sin `htmlFor` →
  asociar al trigger del `Select` vía `aria-labelledby` (el Select de Base UI no
  acepta `htmlFor`).

**Rationale**: es el patrón ya usado en el mismo archivo (ej. `htmlFor="cliente"`),
así que no introduce convención nueva.

**Alternatives considered**: envolver el control dentro del `<Label>` — rompe el
layout actual (grillas de dos columnas).

## D3 — Enlace "saltar al contenido" (FR-003)

**Decision**: En `(main)/dashboard/layout.tsx`, primer elemento del shell:
`<a href="#contenido">` con clase utilitaria "oculto hasta foco"
(`sr-only` + `focus:not-sr-only` + posición fija visible al enfocar), y
`id="contenido"` en el `<main>`.

**Rationale**: un solo punto en el layout cubre las ~8 pantallas del dashboard; no
hay routing ni estado involucrado.

**Alternatives considered**: skip link por página — duplicación innecesaria.
Patrón `tabIndex={-1}` en `<main>` para que reciba foco al activar el enlace —
se incluye porque un `<main>` no es enfocable por defecto.

## D4 — Área segura en controles fijos (FR-004)

**Decision**:

1. En `app/layout.tsx`: `export const viewport: Viewport = { viewportFit: "cover", … }`
   (confirmado en `next/dist/lib/metadata/types/extra-types.d.ts:52` —
   sin `viewport-fit=cover`, `env(safe-area-inset-*)` siempre vale 0).
2. `bottom-nav.tsx`: `pb-[env(safe-area-inset-bottom)]` en el `<nav>` y respetar
   laterales (`pl/pr env(safe-area-inset-left/right)`) para horizontal.
3. `fab-pedido.tsx`: reemplazar `bottom-20` por
   `bottom-[calc(5rem+env(safe-area-inset-bottom))]` (y variante lg).
4. Ajustar el `pb-20` del `<main>` para que incluya el inset inferior y el
   contenido no quede tapado al hacer scroll hasta el final.

**Rationale**: valores arbitrarios de Tailwind v4 soportan `env()` directamente;
no hace falta CSS custom.

**Alternatives considered**: utilidades `pb-safe`/`pr-safe` — Tailwind v4 las trae
pero con sintaxis distinta según versión; valores arbitrarios son explícitos y
funcionan igual.

## D5 — Retardo de doble-toque (FR-005)

**Decision**: `touch-action: manipulation` sobre `html`/`body` en `globals.css`.

**Rationale**: elimina el retardo de ~300ms de doble-toque en todos los
interactivos sin deshabilitar el zoom del usuario (`user-scalable=no` sería en sí
mismo un fallo de accesibilidad). Una sola regla cubre toda la app.

**Alternatives considered**: `userScalable: false` en viewport — rechazado por
accesibilidad (impide zoom). Por-componente — innecesario, la regla hereda.

## D6 — Traducción del panel de preferencias (FR-006)

**Decision**: Traducir las cadenas visibles y `aria-label`s en
`layout-controls.tsx` ("Preferences", "Customize…", "Theme Preset",
placeholders "Preset"/"Select font", y cualquier otra etiqueta del panel) y el
`aria-label` de `theme-switcher.tsx`.

**Rationale**: son las únicas cadenas en inglés detectadas; el resto de la app ya
está en español.

**Alternatives considered**: — (no aplica, es mandatorio por FR-006/SC-004).

## D7 — Alineación numérica (FR-007)

**Decision**: Clase `tabular-nums` de Tailwind (`font-variant-numeric`) en los
elementos que muestran precios/totales comparables: rejilla de productos
(`tarjeta-producto`), filas del pedido nuevo (`formulario-pedido`), y cifras del
panel (`dashboard/page.tsx`).

**Rationale**: una clase, sin JS ni componentes nuevos.

**Alternatives considered**: fuente monoespaciada para números — cambia la
apariencia; `tabular-nums` mantiene la fuente y solo uniforma el ancho.

## D8 — Convención de placeholders (FR-008)

**Decision**: los placeholders que sugieren/ejemplifican terminan en "…";
los que son nota de estado ("Opcional") o ejemplo numérico literal ("20000", "0")
no llevan "…". Aplicar a: "Selecciona un producto" → "…", "Select font" →
traducir + "…", y auditar el resto de `placeholder=` ya listado.

**Rationale**: interpretación literal de FR-008 ("cuando dan un ejemplo") sin
generar texto raro en campos numéricos.

**Alternatives considered**: "…" en absolutamente todos — produciría
placeholders como "20000…" que sugieren entrada incompleta.

## D9 — Espacio reservado en imágenes (FR-009)

**Decision**: verificar que todo `<img>` viva dentro de un contenedor con
proporción fija. `tarjeta-producto.tsx` y `galeria-fotos.tsx` ya usan
`aspect-square` + `bg-muted` → auditoría sobre el resto de puntos de render
(detalle de producto, favoritos) y agregar proporción fija donde falte. No se
migra a `next/image` en esta feature.

**Rationale**: el patrón correcto ya existe en la app; es extenderlo, no inventar.
`next/image` cambiaría la estrategia de servir `/api/fotos/[name]` y es más
trabajo del que el hallazgo exige.

**Alternatives considered**: `next/image` con `width`/`height` — descartado por
simplicidad (Constitución I) y porque requiere conocer dimensiones o `fill` con
contenedor igual de fijo.

## D10 — Estados vacíos uniformes (FR-010)

**Decision**: reutilizar `@/components/ui/empty` (`Empty`, `EmptyHeader`,
`EmptyTitle`, `EmptyDescription`) en `dashboard/page.tsx`, que hoy usa `<p>` sueltos
("Aún no hay ventas registradas hoy.", "Sin alertas: …"). El resto de pantallas
(ventas, pedidos, inventario, alertas, favoritos, reportes) ya lo usan.

**Rationale**: el componente compartido ya existe y está adoptado; esto es la
última pantalla no migrada.

**Alternatives considered**: crear componente propio del dashboard — violaría la
regla de plantilla/simplicidad.

## D11 — Aviso de cambios sin guardar (FR-011)

**Decision**: hook `useEffect` por formulario que registra `beforeunload` solo
cuando hay cambios:

- `formulario-producto.tsx`: condición = `formState.isDirty` de RHF (ya existe
  `useForm`); tras `reset()`/guardado exitoso queda limpio y no advierte.
- `formulario-pedido.tsx`: condición = `cliente`/`contacto`/`items` no vacíos
  (estado local); limpiar antes de `router.push` tras crear el pedido.
- `e.preventDefault()` en el handler para disparar el diálogo nativo.

Alcance confirmado en Clarifications: solo cerrar/recargar pestaña; la navegación
interna NO se intercepta (documentado en Assumptions). Venta y acceso excluidos.

**Rationale**: `beforeunload` es el único mecanismo que cubre cierre/recarga; es
una docena de líneas por formulario, sin dependencias ni routing hacks.

**Alternatives considered**: interceptar navegación interna con diálogo propio —
descartado explícitamente por el usuario (opción A) por complejidad en App Router.

## D12 — theme-color siguiendo la preferencia de la app (FR-012)

**Decision**: dos capas:

1. **Estática** — `export const viewport: Viewport` en `app/layout.tsx` con
   `themeColor` par claro/oscuro vía `prefers-color-scheme` (sintaxis soportada
   en Next 16: `themeColor: [{ media: "…", color: "…" }]`) para el primer
   pintado antes del boot script.
2. **Dinámica** — actualizar el `<meta name="theme-color">` al color de fondo
   resuelto: en `theme-boot.tsx` tras resolver el modo inicial y en
   `preferences-provider.tsx` (donde ya se suscriben a cambios de `theme_mode`)
   para cubrir override manual **y presets**. La lectura del color usa
   `getComputedStyle(document.documentElement).getPropertyValue("--background")`
   para que coincida con el fondo real incluso al cambiar de preset.

**Rationale**: la respuesta aclarada exige seguir la preferencia de la app
(override manual + sistema); un meta estático con media query solo cubre el
sistema, así que la capa dinámica es obligatoria. Leer `--background` computado
evita duplicar valores por preset.

**Alternatives considered**: solo media query `prefers-color-scheme` — no cubre
el override manual (opción B, rechazada). Hardcodear un color por modo — se
desincroniza con los presets de tema.

## Riesgos / notas

- `beforeunload` no se dispara en iOS Safari al navegar con gestos en algunos
  casos; es la aproximación estándar aceptada (alcance ya acotado).
- La auditoría "100% de controles con nombre" (SC-001) exige un pase final sobre
  todos los `size="icon"`, no solo los listados.
- `touch-action: manipulation` global puede interferir con gestos de doble-tap
  en componentes interactivos ricos (ninguno presente: no hay mapas/canvas).
