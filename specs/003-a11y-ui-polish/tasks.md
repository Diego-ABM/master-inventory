# Tasks: Pulido de accesibilidad y UI

**Input**: Design documents from `/specs/003-a11y-ui-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No hay tests automatizados de UI en el proyecto (`node --test` solo cubre `src/lib/domain`, que esta feature no toca). La verificación es manual en navegador según `quickstart.md`.

**Organization**: Tasks agrupados por user story para implementación y verificación independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias de tareas incompletas)
- **[Story]**: User story a la que pertenece (US1, US2, US3)
- Todos los paths son relativos a `portal/` salvo indicación contraria

## Path Conventions

- App Next.js en `portal/` (single project)
- Componentes co-ubicados: `src/app/(main)/dashboard/<screen>/_components/`
- Puntos transversales: `src/app/layout.tsx`, `src/app/globals.css`, `src/scripts/theme-boot.tsx`, `src/stores/preferences/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar línea base limpia antes de tocar UI

- [X] T001 Ejecutar `pnpm check` en `portal/` y confirmar lint/format limpio como línea base
- [X] T002 [P] Revisar `portal/package.json` y confirmar que la feature no requiere dependencias nuevas (regla del repo: no agregar dependencias)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura transversal que US2 y US3 necesitan antes de su implementación

**⚠️ CRITICAL**: Sin `viewportFit: "cover"`, `env(safe-area-inset-*)` vale siempre 0 (US2 bloqueada). El meta `theme-color` estático es la primera capa de FR-012 (US3).

- [X] T003 Agregar `export const viewport: Viewport` en `portal/src/app/layout.tsx` con `viewportFit: "cover"` y `themeColor` como array con `media: "(prefers-color-scheme: light)"` / `"(prefers-color-scheme: dark)"` apuntando al fondo claro y oscuro (capa estática de FR-012 para el primer pintado, antes del boot script)
- [X] T004 [P] Agregar `touch-action: manipulation` sobre `html`/`body` en `portal/src/app/globals.css` (elimina el retardo de doble-toque sin deshabilitar el zoom — NO usar `userScalable: false`)

**Checkpoint**: `env(safe-area-inset-*)` ya reporta valores reales; la respuesta táctil ya es inmediata en toda la app.

---

## Phase 3: User Story 1 - Operación completa sin mirar ni adivinar botones (Priority: P1) 🎯 MVP

**Goal**: Todo control interactivo tiene nombre accesible en español, toda etiqueta de formulario está asociada a su control, y existe enlace "saltar al contenido" como primer destino de Tab.

**Independent Test**: Recorrer cada pantalla con el inspector de accesibilidad (o lector de pantalla) y verificar que ningún control se anuncia como "botón" genérico; tabular desde la carga y comprobar que el primer destino es "Saltar al contenido principal" (quickstart.md, Escenario 1).

### Implementation for User Story 1

- [X] T005 [P] [US1] Agregar `aria-label="Preferencias de visualización"` al trigger del `Popover` (icono `Settings`) en `portal/src/app/(main)/dashboard/_components/header/layout-controls.tsx`
- [X] T006 [P] [US1] Traducir a español el `aria-label` existente (en inglés) del botón de tema en `portal/src/app/(main)/dashboard/_components/header/theme-switcher.tsx`
- [X] T007 [P] [US1] Agregar `aria-label="Eliminar venta"` al botón `Trash2` en `portal/src/app/(main)/dashboard/ventas/_components/boton-eliminar-venta.tsx`
- [X] T008 [P] [US1] Agregar `aria-label="Eliminar pedido"` al botón `Trash2` en `portal/src/app/(main)/dashboard/pedidos/_components/tarjeta-pedido.tsx`
- [X] T009 [P] [US1] Agregar `aria-label="Buscar"` al `CommandInput` (hoy solo tiene placeholder) en `portal/src/app/(main)/dashboard/_components/header/search-dialog.tsx`
- [X] T010 [US1] Agregar `aria-label="Quitar ítem"` (con nombre del producto si es trivial) al botón `X` de cada ítem agregado en `portal/src/app/(main)/dashboard/pedidos/nuevo/_components/formulario-pedido.tsx`
- [X] T011 [US1] Asociar las etiquetas a sus controles en `portal/src/app/(main)/dashboard/pedidos/nuevo/_components/formulario-pedido.tsx`: `htmlFor`/`id` en inputs nativos y `aria-labelledby` en los `Select` de Base UI (que renderizan botón y no aceptan `htmlFor`), cubriendo "Producto del catálogo", "Cantidad" (×2), "Ítem personalizado" y "Precio" — mismo patrón ya usado con `htmlFor="cliente"` en el archivo
- [X] T012 [P] [US1] Asociar las etiquetas "Mascota" y "Categoría" a sus `Select` vía `aria-labelledby` en `portal/src/app/(main)/dashboard/inventario/_components/formulario-producto.tsx`
- [X] T013 [P] [US1] Agregar enlace `<a href="#contenido">Saltar al contenido principal</a>` como primer elemento del shell con clase "oculto hasta foco" (`sr-only` + `focus:not-sr-only` + posición fija visible al enfocar), y `id="contenido"` + `tabIndex={-1}` en el `<main>` de `portal/src/app/(main)/dashboard/layout.tsx`
- [X] T014 [US1] Auditar todos los botones `size="icon"` restantes y agregar `aria-label` en español donde falte (verificar `aria-hidden` en el ícono lucide para no duplicar anuncio): `boton-favorito`, `nav-header.tsx`, `inventario/[id]/_components/controles-stock.tsx`, `inventario/[id]/_components/marcado-proveedor.tsx`, `pedidos/_components/lista-proveedor.tsx`, `reportes/_components/controles-reporte.tsx`, `inventario/_components/filtros-inventario.tsx` — SC-001 exige 100%
- [X] T015 [US1] Verificación manual del Escenario 1 de `quickstart.md`: Tab inicial → skip link; árbol a11y sin "botón" genérico; cada etiqueta visible activa su control al pulsarla

**Checkpoint**: User Story 1 completa — 0 controles sin nombre accesible, etiquetas asociadas, skip link funcional (SC-001, SC-003).

---

## Phase 4: User Story 2 - Controles al alcance del dedo en celular con notch (Priority: P2)

**Goal**: La navegación inferior y el FAB respetan `env(safe-area-inset-*)` en vertical y horizontal; el contenido scrolleable no queda tapado al fondo.

**Independent Test**: Emular dispositivo con notch en DevTools (safe-area forzada) y verificar que los controles fijos quedan completamente visibles y accionables en ambas orientaciones (quickstart.md, Escenario 2).

### Implementation for User Story 2

- [X] T016 [US2] Agregar padding de área segura en `portal/src/app/(main)/dashboard/_components/bottom-nav/bottom-nav.tsx`: `pb-[env(safe-area-inset-bottom)]` en el `<nav>` y `pl-[env(safe-area-inset-left)]` / `pr-[env(safe-area-inset-right)]` para horizontal
- [X] T017 [P] [US2] Reemplazar `bottom-20` por `bottom-[calc(5rem+env(safe-area-inset-bottom))]` (y la variante `lg` correspondiente) en `portal/src/app/(main)/dashboard/_components/fab-pedido.tsx`
- [X] T018 [US2] Ajustar el `pb-20` del `<main>` en `portal/src/app/(main)/dashboard/layout.tsx` para incluir el inset inferior (p. ej. `pb-[calc(5rem+env(safe-area-inset-bottom))]`) y que el contenido no quede tapado al hacer scroll hasta el final
- [X] T019 [US2] Verificación manual del Escenario 2 de `quickstart.md`: controles visibles en vertical y horizontal con notch emulado, toque único sin retardo, zoom por pellizco funcional

**Checkpoint**: User Stories 1 y 2 funcionan independientemente — 0 controles tapados por áreas inseguras (SC-002).

---

## Phase 5: User Story 3 - Idioma, formato y acabado consistentes (Priority: P3)

**Goal**: Panel de preferencias 100% en español, cifras con ancho uniforme, convención "…" en placeholders de ejemplo, imágenes con espacio reservado, estados vacíos unificados sobre `Empty`, aviso nativo de cambios sin guardar (producto y pedido nuevo), y `theme-color` que sigue la preferencia de tema de la app.

**Independent Test**: Recorrer todas las pantallas verificando idioma, alineación de cifras, placeholders y estabilidad de layout; cerrar/recargar con cambios sin guardar en los formularios cubiertos y comprobar el aviso nativo; alternar tema y verificar el meta (quickstart.md, Escenarios 3–5).

### Implementation for User Story 3

- [X] T020 [P] [US3] Traducir todas las cadenas visibles y `aria-label`s restantes en `portal/src/app/(main)/dashboard/_components/header/layout-controls.tsx`: "Preferences", "Customize…", "Theme Preset", placeholder "Preset" → "Selecciona un preset…", "Select font" → "Selecciona una fuente…", y cualquier otra etiqueta del panel (FR-006, SC-004)
- [X] T021 [P] [US3] Agregar clase `tabular-nums` a los precios de la rejilla en `portal/src/app/(main)/dashboard/_components/tarjeta-producto.tsx`
- [X] T022 [US3] Agregar clase `tabular-nums` a las cifras de las filas del pedido (precio/cantidad/subtotal por ítem) en `portal/src/app/(main)/dashboard/pedidos/nuevo/_components/formulario-pedido.tsx`
- [X] T023 [P] [US3] Auditar todos los `placeholder=` bajo `portal/src/app/` y aplicar la convención FR-008: los que sugieren/ejemplifican terminan en "…" (p. ej. "Selecciona un producto" → "Selecciona un producto…"); los de nota de estado ("Opcional") o ejemplo numérico literal ("20000", "0") NO llevan "…"
- [X] T024 [P] [US3] Auditar todos los puntos de render de imágenes de producto bajo `portal/src/app/` (detalle de producto, favoritos, cualquier `<img>` fuera de `tarjeta-producto.tsx` y `galeria-fotos.tsx` que ya usan `aspect-square` + `bg-muted`) y envolver en contenedor de proporción fija donde falte — NO migrar a `next/image`
- [X] T025 [US3] Reemplazar los estados vacíos sueltos ("Aún no hay ventas registradas hoy.", "Sin alertas: …") por el componente `Empty`/`EmptyHeader`/`EmptyTitle`/`EmptyDescription` de `@/components/ui/empty`, y agregar `tabular-nums` a las cifras comparables del panel, en `portal/src/app/(main)/dashboard/page.tsx`
- [X] T026 [P] [US3] Agregar `useEffect` con listener `beforeunload` (con `e.preventDefault()`) en `portal/src/app/(main)/dashboard/inventario/_components/formulario-producto.tsx`, activo solo cuando `formState.isDirty` de RHF es true — tras `reset()`/guardado exitoso queda limpio y no advierte
- [X] T027 [US3] Agregar `useEffect` con listener `beforeunload` en `portal/src/app/(main)/dashboard/pedidos/nuevo/_components/formulario-pedido.tsx`, activo solo cuando `cliente !== "" || contacto !== "" || items.length > 0`; limpiar el estado antes de `router.push` tras `crearPedido` exitoso para que no advierta al salir
- [X] T028 [P] [US3] En `portal/src/scripts/theme-boot.tsx`, tras resolver el modo inicial, escribir el `<meta name="theme-color">` con el fondo resuelto leído de `getComputedStyle(document.documentElement).getPropertyValue("--background")`
- [X] T029 [P] [US3] En `portal/src/stores/preferences/preferences-provider.tsx`, suscribirse a cambios de `theme_mode` y `theme_preset` (donde ya se suscriben a `theme_mode`) y actualizar el `<meta name="theme-color">` con el `--background` computado — cubre override manual, modo sistema y cambio de preset sin recargar
- [X] T030 [US3] Verificación manual de los Escenarios 3–5 de `quickstart.md`: panel en español, cifras alineadas, placeholders con "…", sin desplazamiento al cargar imágenes, estados vacíos uniformes, aviso nativo en los 3 formularios cubiertos (y ausente en venta/acceso/intacto/tras guardar/navegación interna), meta `theme-color` actualizado al cambiar modo y preset

**Checkpoint**: Las tres user stories funcionan — acabado consistente y protección de cambios (SC-004, SC-005, SC-006, FR-012).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final transversal

- [X] T031 Ejecutar `pnpm check` en `portal/` y corregir cualquier hallazgo de lint/format introducido
- [X] T032 Ejecutar `pnpm build` en `portal/` y confirmar build exitoso sin warnings nuevos
- [X] T033 Pasada completa de validación según `quickstart.md` (Escenarios 1–5) como aceptación final contra SC-001…SC-006

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — **BLOQUEA a US2** (sin `viewportFit: "cover"` los insets valen 0). No bloquea estrictamente a US1, pero conviene hacerla primero por ser transversal y pequeña
- **User Stories (Phase 3+)**: US1 puede empezar sin Foundational; US2 requiere T003 (y T004 para el retardo táctil); US3 requiere T003 para la capa estática de theme-color
- **Polish (Phase 6)**: Depende de todas las user stories completadas

### User Story Dependencies

- **User Story 1 (P1)**: Sin dependencias de otras stories — solo atributos/etiquetas sobre componentes existentes
- **User Story 2 (P2)**: Depende de T003/T004 (Foundational). T018 toca el mismo archivo que T013 (US1) — secuencial si se hacen en paralelo
- **User Story 3 (P3)**: Depende de T003 (meta estático ya existe para actualizarlo dinámicamente). T020/T028/T029 comparten archivo con T005 (US1) — secuencial si se hacen en paralelo

### Within Each User Story

- `aria-label`s puntuales (T005–T009) en paralelo entre sí; T010 antes/junto a T011 por compartir archivo
- En US3: T022 antes de T027 (mismo archivo `formulario-pedido.tsx`); el resto de tareas [P] son independientes
- Verificación manual al final de cada fase (T015, T019, T030)

### Parallel Opportunities

- T002, T004 corren en paralelo con cualquier otra cosa
- T005–T009 + T012 + T013: 7 archivos distintos, todas en paralelo
- T020, T021, T023, T024, T026, T028, T029: 7 archivos distintos, todas en paralelo
- US1 y US3 comparten `layout-controls.tsx` (T005 vs T020) — hacer T020 después de T005 si se trabaja en paralelo

---

## Parallel Example: User Story 1

```bash
# Lanzar los aria-label puntuales juntos (archivos distintos):
Task: "aria-label Preferencias de visualización en header/layout-controls.tsx"
Task: "Traducir aria-label en header/theme-switcher.tsx"
Task: "aria-label Eliminar venta en boton-eliminar-venta.tsx"
Task: "aria-label Eliminar pedido en tarjeta-pedido.tsx"
Task: "aria-label Buscar en header/search-dialog.tsx"

# Y en paralelo las asociaciones de etiquetas y el skip link:
Task: "aria-labelledby Mascota/Categoría en formulario-producto.tsx"
Task: "Skip link + id=contenido en dashboard/layout.tsx"
```

---

## Parallel Example: User Story 3

```bash
# Acabado independiente por archivo:
Task: "Traducir panel en header/layout-controls.tsx"
Task: "tabular-nums en tarjeta-producto.tsx"
Task: "Auditoría de placeholders en portal/src/app/"
Task: "Auditoría de contenedores de imagen en portal/src/app/"
Task: "beforeunload en formulario-producto.tsx"
Task: "theme-color en theme-boot.tsx"
Task: "theme-color en preferences-provider.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (línea base)
2. Complete Phase 2: Foundational (viewport + touch-action)
3. Complete Phase 3: User Story 1 — nombres accesibles, etiquetas, skip link
4. **STOP and VALIDATE**: Escenario 1 de quickstart.md con inspector de accesibilidad
5. Entregable: hallazgo de mayor riesgo de la auditoría resuelto

### Incremental Delivery

1. Setup + Foundational → base transversal lista
2. US1 → validar con inspector/lector de pantalla → entregable de accesibilidad
3. US2 → validar con emulación de safe-area → entregable móvil
4. US3 → validar Escenarios 3–5 → acabado completo
5. Cada story es aditiva (atributos, clases, metas) y no rompe las anteriores

### Notas de alcance (de Clarifications y Research)

- El aviso de cambios sin guardar cubre SOLO cerrar/recargar pestaña (`beforeunload`); la navegación interna NO se intercepta
- Venta y acceso (formularios de un campo) NO muestran aviso
- No se migra a `next/image`; se extiende el patrón `aspect-square` + `bg-muted` existente
- Componentes de `src/components/ui/` y `src/components/calendar/` NO se modifican — la personalización se hace donde se usan
- `theme-color` lee `--background` computado (no se hardcodean colores por preset)
