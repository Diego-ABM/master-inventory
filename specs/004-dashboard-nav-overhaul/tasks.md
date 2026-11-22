# Tasks: Dashboard de métricas, navegación lateral y flujo de ventas dedicado

**Input**: Design documents from `/specs/004-dashboard-nav-overhaul/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen tareas de tests de dominio (`node --test`) porque el proyecto ya usa esa convención para `src/lib/domain/*.test.ts` y la lógica nueva (períodos, totales multi-ítem) es pura y testeable.

**Organization**: Tasks agrupadas por user story (US1–US5 de spec.md) para implementación y verificación independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias)
- **[Story]**: User story de spec.md (US1–US5)
- Rutas relativas a `portal/` salvo indicación

---

## Phase 1: Setup

**Purpose**: Confirmar punto de partida verde antes de tocar código.

- [X] T001 Verificar baseline en `portal/`: `pnpm install`, `node --test 'src/lib/domain/*.test.ts'` y `pnpm check` deben pasar limpios antes de empezar

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos compartidos que usan US1 (métricas) y US2 (POS).

- [X] T002 Agregar en `src/lib/domain/tipos.ts` los tipos `ItemVentaInput` (`{ producto_id: number; cantidad: number }`, ambos enteros > 0), `PeriodoId` (`"hoy" | "semana" | "mes" | "anio"`), `PuntoSerie` (`{ etiqueta: string; total: number }`) y `PeriodoMetricas` (`{ id: PeriodoId; etiqueta: string; totalVendido: number; numeroVentas: number; serie: PuntoSerie[] }`) según `data-model.md`. Distinción: `ItemVentaInput` = entrada del cliente (solo id + cantidad); `NuevoVentaItem` (ya existente) = ítem enriquecido en servidor con datos de BD (nombre y precios congelados)

**Checkpoint**: Tipos disponibles — US1 y US2 pueden iniciar.

---

## Phase 3: User Story 1 - Ver métricas de ventas por período (Priority: P1) 🎯 MVP

**Goal**: El panel muestra total vendido (COP), número de ventas y gráfica de tendencia para Hoy, Semana (inicia lunes), Mes y Año, con cambio de período instantáneo en cliente y estado vacío en español.

**Independent Test**: Registrar ventas en días distintos, abrir `/dashboard` y alternar los 4 períodos verificando totales y gráfica (quickstart escenario 1). Funciona con el layout actual, sin depender del sidebar.

### Tests for User Story 1

- [X] T003 [US1] Escribir tests que FALLEN en `src/lib/domain/metricas.test.ts`: `rangoPeriodo` para hoy (00:00–24:00 local), semana iniciando en lunes (incluye caso semana que cruza mes/año), mes y año; `agregarVentas` con buckets por hora (hoy), por día lun–dom (semana), por día del mes (mes), por mes (año); ventas fuera de rango ignoradas; período sin ventas → buckets en 0. Ejecutar `node --test 'src/lib/domain/metricas.test.ts'` y confirmar fallo

### Implementation for User Story 1

- [X] T004 [US1] Implementar `src/lib/domain/metricas.ts`: `rangoPeriodo(periodo, referencia)` y `agregarVentas(ventas, periodo, referencia)` puros, sin I/O, según `data-model.md` (etiquetas es-CO: horas, "lun"–"dom", día del mes, "ene"–"dic") hasta pasar T003
- [X] T005 [US1] Crear Client Component `src/app/(main)/dashboard/_components/panel-metricas.tsx`: recibe las 4 `PeriodoMetricas`, `Tabs` Hoy/Semana/Mes/Año en estado local (sin red), gráfica de barras o área con `src/components/ui/chart.tsx` (recharts ya instalado), totales con `formatearCOP`, `Empty` en español cuando `numeroVentas === 0`
- [X] T006 [US1] Actualizar `src/app/(main)/dashboard/page.tsx`: una sola consulta `ventaRepo.listar({ desde, hasta })` con `desde` = el menor entre inicio del año y el lunes de la semana en curso (margen por semana que cruza año, ver research D5), computar los 4 períodos con `agregarVentas` y renderizar `PanelMetricas` conservando tarjetas de resumen, accesos rápidos, ventas de hoy y alertas
- [X] T007 [US1] Validar US1 con quickstart escenario 1: los 4 períodos cambian sin recarga, datos correctos, vacío en español, `node --test` y `pnpm check` verdes

**Checkpoint**: US1 funcional y testeable de forma independiente.

---

## Phase 4: User Story 2 - Registrar una venta con flujo propio POS (Priority: P1)

**Goal**: `/dashboard/ventas/nueva` abre siempre una pantalla POS de carrito multi-producto (buscar, agregar con cantidad, total acumulado, confirmar en una sola venta); `?producto=id` opcional precarga el ítem; nunca redirige a inventario.

**Independent Test**: Tocar "Nueva venta" desde panel/listado → se abre el POS (no inventario), buscar 2 productos, ajustar cantidades, confirmar → venta en el listado con sus ítems y stock descontado (quickstart escenario 2). Testeable con el layout actual.

### Tests for User Story 2

- [X] T008 [P] [US2] Escribir tests que FALLEN en `src/lib/domain/ventas.test.ts` agregando casos multi-ítem: total = Σ `cantidad × precio_venta` sobre `NuevoVentaItem[]`, ítem con `cantidad` no entera o ≤ 0 lanza error, lista vacía lanza error

### Implementation for User Story 2

- [X] T009 [US2] Extender `src/lib/domain/ventas.ts` con `calcularTotalVentaMulti(items: NuevoVentaItem[])`: valida cada `cantidad` (entero > 0) y retorna la suma; conservar `calcularTotalVenta` si aún se usa. Pasar T008
- [X] T010 [US2] Cambiar `ventaRepo.crear` en `src/server/repositories/ventas.ts` para recibir `items: NuevoVentaItem[]` e insertar una fila por ítem en `venta_items` dentro de la transacción del llamador
- [X] T011 [US2] Reescribir `registrarVenta` en `src/server/services/ventas.ts` con firma `registrarVenta(items: ItemVentaInput[])` según `contracts/acciones-servidor.md`: rechaza lista vacía, consolida `producto_id` duplicados sumando cantidades, valida stock por producto leído de BD dentro de `transaccion`, descuenta stock por ítem, precios congelados del catálogo, `revalidatePath` incluye `/dashboard`, log `INFO` con id y nº de ítems
- [X] T012 [US2] Crear `src/app/(main)/dashboard/ventas/nueva/_components/pos-venta.tsx` (Client Component): recibe `ProductoListado[]` y `productoPrecargado` opcional; buscador por nombre filtrando en cliente; carrito `ItemCarrito[]` que consolida el mismo producto sumando cantidad, tope `stock_disponible`, quitar ítem, total acumulado con `formatearCOP`; botón Confirmar deshabilitado con carrito vacío; al confirmar llama `registrarVenta(items)` → toast éxito + `router.push("/dashboard/ventas")`, error → toast con el mensaje; botón Cancelar sale sin registrar
- [X] T013 [US2] Reescribir `src/app/(main)/dashboard/ventas/nueva/page.tsx`: `force-dynamic`, carga `productoRepo.listar()`, lee `?producto=`; si es id entero > 0 y existe, lo pasa como precargado (cantidad 1); si el id es inválido o no existe, abre el POS normal (sin `notFound` ni redirect a inventario); eliminar `formulario-venta.tsx`
- [X] T014 [US2] Actualizar `src/app/(main)/dashboard/ventas/page.tsx`: agregar botón/enlace "Nueva venta" → `/dashboard/ventas/nueva` en el encabezado, y corregir el `EmptyDescription` a algo como "Registra una venta desde el botón Nueva venta."
- [X] T015 [US2] Validar US2 con quickstart escenario 2: accesos desde panel y listado abren POS, multi-ítem con total correcto, stock bloqueado con mensaje claro, cancelar sin efectos, `?producto=` precarga, `node --test` y `pnpm check` verdes

**Checkpoint**: US2 funcional; vender ya no pasa por inventario.

---

## Phase 5: User Story 3 - Menú lateral izquierdo estilo portal administrativo (Priority: P2)

**Goal**: En pantalla ancha el menú vive en una barra lateral izquierda colapsable con sección activa marcada; en pantalla angosta es un drawer abierto por un botón; la barra inferior desaparece. Las 8 secciones alcanzables en ambos casos.

**Independent Test**: Pantalla ancha → sidebar a la izquierda con las 8 secciones, activa marcada, colapsa/expande. Pantalla angosta → sin barra inferior, trigger abre el drawer, se cierra al navegar (quickstart escenario 3).

### Implementation for User Story 3

- [X] T016 [US3] Crear `src/app/(main)/dashboard/_components/sidebar/app-sidebar.tsx` adaptado de `plantilla/src/app/(main)/dashboard/_components/sidebar/app-sidebar.tsx`: `Sidebar` con `SidebarHeader` (logo + nombre, ver US4), `SidebarContent` con `NavMain`, lee `sidebar_variant`/`sidebar_collapsible` de `usePreferencesStore` igual que la plantilla; sin `SupportCard`/`NavUser` (no aplican); opcional `SidebarFooter` mínimo si aporta (p. ej. versión)
- [X] T017 [US3] Crear `src/app/(main)/dashboard/_components/sidebar/nav-main.tsx` adaptado de la plantilla (`nav-main.tsx`): grupos e ítems desde `sidebarItems`, `isActive` por `usePathname`, estados activo/hover del componente; se puede simplificar (los ítems actuales no tienen `subItems`, pero mantener el soporte del tipo por consistencia)
- [X] T018 [US3] Reescribir `src/app/(main)/dashboard/layout.tsx` siguiendo `plantilla/src/app/(main)/dashboard/layout.tsx`: `SidebarProvider` (con `defaultOpen` desde cookie `sidebar_state` y `--sidebar-width` como la plantilla), `AppSidebar`, `SidebarInset` con header (`SidebarTrigger` + `Separator` + `SearchDialog` a la izquierda; `LayoutControls` + `ThemeSwitcher` + `BotonSalir` a la derecha), `<main id="contenido">` con el skip-link conservado y padding sin el espacio de la barra inferior (`pb-[calc(5rem+...)]` → padding normal), conservar `FabPedido`
- [X] T019 [US3] Eliminar `src/app/(main)/dashboard/_components/nav-header.tsx`, `src/app/(main)/dashboard/_components/bottom-nav/` y `src/app/(main)/dashboard/_components/secciones.ts` — después de T018, ya que el layout vigente los importa hasta que el nuevo aterrice — y verificar que no quedan imports (el buscador ya usa `sidebarItems`)
- [X] T028 [P] [US3] Agregar a `src/navigation/sidebar/sidebar-items.ts` un grupo `"Acciones"` con el ítem `Nueva venta` → `/dashboard/ventas/nueva` (ícono `ShoppingCart`, FR-006): queda disponible en el sidebar, el drawer móvil y el `search-dialog` que ya consume `sidebarItems`; `NavMain` marca activo por match exacto (`path === item.url`), sin colisión con "Ventas"
- [X] T020 [US3] Validar US3 con quickstart escenario 3: 8 secciones alcanzables en desktop y drawer móvil, colapso con íconos, activa marcada, sin barra inferior, atajo "Nueva venta" del menú abre el POS, `pnpm check` verde

**Checkpoint**: Navegación lateral operativa en ambos tamaños.

---

## Phase 6: User Story 4 - Volver al inicio tocando el nombre de la app (Priority: P2)

**Goal**: El nombre/logo "Master Inventory" es enlace a `/dashboard` desde cualquier pantalla, con comportamiento de enlace accesible.

**Independent Test**: Desde Reportes (u otra sección), clic en el nombre/logo → llega a `/dashboard`; con teclado, foco visible + Enter → mismo resultado (quickstart escenario 4). Depende de T016 (sidebar).

### Implementation for User Story 4

- [X] T021 [US4] En `src/app/(main)/dashboard/_components/sidebar/app-sidebar.tsx`, hacer que `SidebarHeader` renderice `SidebarMenuButton` con `render={<Link href="/dashboard" />}`, `AppLogo` + `APP_CONFIG.name` (patrón de la plantilla), asegurando foco visible y `aria` correctos
- [X] T022 [US4] Validar US4 con quickstart escenario 4 desde varias secciones y con teclado

**Checkpoint**: Logo siempre lleva a inicio.

---

## Phase 7: User Story 5 - Navegación fluida con animaciones de la plantilla (Priority: P3)

**Goal**: Colapso/expansión del sidebar, drawer móvil, estados hover/activo y transiciones se ven suaves y consistentes en tema claro y oscuro, usando solo lo provisto por la plantilla.

**Independent Test**: Colapsar/expandir el sidebar y navegar entre secciones en ambos temas observando transiciones limpias sin saltos (quickstart escenario 5). Depende de T016–T018.

### Implementation for User Story 5

- [X] T023 [US5] Revisar y aplicar las transiciones de la plantilla en `src/app/(main)/dashboard/_components/sidebar/` y `src/app/(main)/dashboard/layout.tsx`: clases `transition-*` del componente `ui/sidebar.tsx` (colapso, gap, width), `duration-200 ease-linear` en `SidebarMenuButton` como en `nav-main` de la plantilla, `transition-colors` en ítems; sin librerías ni sistemas de animación nuevos
- [X] T024 [US5] Validar US5 con quickstart escenario 5 en tema claro y oscuro (ThemeSwitcher)

**Checkpoint**: Navegación con acabado fluido y profesional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Auditoría de flujos, i18n/formato y verificación integral (FR-013, FR-014, SC-006).

- [X] T025 [P] Auditar accesos entre módulos (FR-013): revisar `src/app/(main)/dashboard/_components/fab-pedido.tsx` (posición frente al nuevo layout), accesos rápidos de `src/app/(main)/dashboard/page.tsx`, botón "Vender" de `src/app/(main)/dashboard/inventario/[id]/page.tsx` y `src/app/(main)/dashboard/_components/header/search-dialog.tsx`; corregir cualquier salto de módulo análogo al de ventas
- [X] T026 [P] Revisar que todo texto nuevo esté en español de Colombia y montos con `formatearCOP` (FR-014): etiquetas de período, estados vacíos, títulos del POS, mensajes de error del servicio
- [X] T027 Ejecutar validación integral de `quickstart.md` (escenarios 1–5 + regresión) junto con `node --test 'src/lib/domain/*.test.ts'`, `pnpm check` y `pnpm build` en `portal/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de T001 — bloquea US1 y US2.
- **User Stories**: US1 (P1) y US2 (P1) son independientes entre sí y con el layout actual; pueden correr en cualquier orden o en paralelo. US3 (P2) es independiente de US1/US2 (toca `layout.tsx` y componentes nuevos, no páginas). US4 depende de US3 (T016). US5 depende de US3.
- **Polish (Phase 8)**: depende de todas las historias incluidas.

### User Story Dependencies

- **US1 (P1)**: tras Phase 2. Sin dependencias de otras historias.
- **US2 (P1)**: tras Phase 2. Sin dependencias de otras historias.
- **US3 (P2)**: tras Phase 1 (no necesita los tipos de Phase 2). Bloquea US4 y US5.
- **US4 (P2)**: requiere T016 (header del sidebar).
- **US5 (P3)**: requiere T016–T018 (sidebar + layout).

### Within Each User Story

- Tests de dominio (donde aplican) primero y deben fallar; luego dominio → repositorio → servicio → UI.
- Story completa y validada antes de pasar a la siguiente en entrega incremental.

### Parallel Opportunities

- T002 es el único bloqueante compartido de US1/US2.
- US1 y US2 enteras pueden ir en paralelo (archivos disjuntos salvo `tipos.ts`, ya resuelto en Phase 2).
- US3 puede ir en paralelo con US1/US2 (toca `layout.tsx`, `page.tsx` solo en US1 — resolver `page.tsx` de US1 antes o coordinar si se paraleliza, ya que US3 no toca `page.tsx`).
- T019 corre después de T018 (los archivos a eliminar siguen importados por el layout vigente hasta que el nuevo aterrice); T028 [P] puede hacerse en cualquier punto de la fase.
- T025 y T026 [P] en paralelo en Polish.

---

## Parallel Example: User Stories 1 y 2

```bash
# Tras Phase 2, lanzar en paralelo:
Task: "T003+T004: tests e implementación de src/lib/domain/metricas.ts"   # US1
Task: "T008+T009: tests e implementación multi-ítem de src/lib/domain/ventas.ts"  # US2
```

## Parallel Example: User Story 3

```bash
# Componentes de sidebar (archivos distintos, se crean juntos):
Task: "app-sidebar.tsx en _components/sidebar/"   # T016
Task: "nav-main.tsx en _components/sidebar/"      # T017
# luego T018 (layout) integra ambos, y T019 borra los componentes viejos.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (baseline) → Phase 2 (tipos) → Phase 3 (US1 métricas).
2. **STOP y validar**: quickstart escenario 1 + tests de dominio.
3. El dueño ya puede medir hoy/semana/mes/año — valor inmediato.

### Incremental Delivery

1. US1 (métricas) → validar → demo.
2. US2 (POS) → validar → el bug de navegación de ventas queda resuelto.
3. US3 (sidebar) + US4 (logo) + US5 (animaciones) → rediseño de navegación completo.
4. Phase 8: auditoría y regresión integral.

### Orden sugerido

P1 juntas (US1, US2 en cualquier orden) → US3 → US4 → US5 → Polish. US3 puede adelantarse en paralelo si se quiere el rediseño antes.

---

## Notes

- [P] = archivos distintos, sin dependencias entre tareas.
- No hay migraciones de BD ni dependencias nuevas (constitución).
- `registrarVenta` cambia firma; su único llamador (`formulario-venta.tsx`) se elimina en T013.
- Commit después de cada tarea o grupo lógico (convención `feat:`/`fix:`/`refactor:`).
