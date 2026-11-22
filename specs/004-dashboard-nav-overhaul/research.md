# Research: Dashboard de métricas, navegación lateral y flujo de ventas dedicado

Investigación Phase 0. No quedaron NEEDS CLARIFICATION: el stack está fijado por el repo y las dudas de UX ya se resolvieron en la sesión de clarificación de la spec.

## D1. Componente de sidebar: ¿vendorizar de nuevo o reutilizar?

- **Decision**: Reutilizar `portal/src/components/ui/sidebar.tsx` (ya vendorizado) y adaptar `app-sidebar.tsx` + `nav-main.tsx` de la plantilla (`plantilla/src/app/(main)/dashboard/_components/sidebar/`).
- **Rationale**: El sidebar completo ya existe en el portal: `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, variantes `sidebar`/`floating`/`inset`, colapso `offcanvas`/`icon`/`none`, y modo móvil que renderiza un `Sheet` (drawer) automáticamente vía `useIsMobile`. La plantilla muestra el patrón exacto de layout: `SidebarProvider` envolviendo `AppSidebar` + `SidebarInset` con header compacto y `SidebarTrigger`.
- **Alternatives considered**: (a) Mantener menú superior + bottom nav — rechazado, es lo que la spec pide cambiar. (b) Construir sidebar propio — rechazado por simplicidad y por la regla de usar la plantilla. (c) Vendorizar componentes nuevos de shadcn — innecesario, todo está.

## D2. Fuente única de secciones de navegación

- **Decision**: `portal/src/navigation/sidebar/sidebar-items.ts` queda como única fuente (grupos "Secciones" y "Sistema" ya incluyen las 8 rutas; se agrega un tercer grupo "Acciones" con el atajo "Nueva venta" → `/dashboard/ventas/nueva`, exigido por FR-006 — también queda disponible en el buscador). Se eliminan `secciones.ts`, `nav-header.tsx` y `bottom-nav/`.
- **Rationale**: `sidebar-items.ts` ya existe y ya alimenta `search-dialog.tsx`; hoy la config está duplicada en `secciones.ts` (6 ítems, sin Reportes ni Respaldo). Unificar elimina duplicación y garantiza que drawer móvil, sidebar y buscador muestren lo mismo (SC-003).
- **Alternatives considered**: conservar `secciones.ts` y alimentar el sidebar desde ahí — rechazado: `sidebar-items.ts` es la estructura que esperan `nav-main` y el buscador de la plantilla.
- **Nota**: `search-dialog.tsx` ya consume `sidebarItems`; no requiere cambios.

## D3. Cálculo de métricas: ¿SQL nuevo o agregación en dominio?

- **Decision**: Una sola consulta `ventaRepo.listar({ desde: inicioAño, hasta: ahora })` y toda la agregación en un módulo nuevo `src/lib/domain/metricas.ts` (puro): rangos de período y series (hora/día/mes).
- **Rationale**: Respeta la arquitectura en capas y hace la lógica testeable con `node:test` (límites de día, semana que inicia en lunes, cambio de mes/año). Volumen de datos pequeño: traer las ventas del año es barato y permite computar los 4 períodos en una sola carga de página.
- **Alternatives considered**: (a) `GROUP BY` en SQL por período — más SQL y menos testeable; se necesitarían 4 consultas o una consulta compleja. (b) Server Action por cambio de período — más lento y complejo; SC-001 exige < 2 s.

## D4. Cambio de período sin recarga (FR-003)

- **Decision**: Server Component calcula las métricas de los 4 períodos y las pasa a un Client Component (`panel-metricas.tsx`) con `Tabs` (`Hoy | Semana | Mes | Año`) que alterna en estado local. Cero red al cambiar.
- **Rationale**: Es la opción más simple que cumple FR-003 ("sin recargar la aplicación") y SC-001 (< 2 s): el cambio es instantáneo porque los datos ya están en cliente.
- **Alternatives considered**: `?periodo=` en searchParams con navegación — implica re-render de servidor por cambio; innecesario dado el volumen.

## D5. Zona horaria y definición de semana

- **Decision**: Fechas en milisegundos como ya se hace (`ventas.fecha`); los rangos se calculan con la zona horaria local del servidor (`new Date(...)` con componentes locales, mismo patrón que `page.tsx` actual). Semana inicia en lunes (convención Colombia, confirmado en spec).
- **Rationale**: Consistencia con el código existente; la app es local de un solo usuario en Colombia.
- **Edge cases cubiertos**: venta a las 23:59 cuenta en "Hoy"; año nuevo sin ventas → estado vacío; semana que cruza mes/año (el lunes anterior pertenece a la semana en curso aunque caiga en el mes/año anterior — documentado en data-model.md; la agregación de "Semana" puede incluir ventas de diciembre del año anterior, por lo que la consulta debe traer un margen: desde el lunes de la semana en curso o inicio de año, lo que sea menor).

## D6. Flujo de venta multi-ítem

- **Decision**: `ventas/nueva/page.tsx` (server) carga `productoRepo.listar()` completo y lo pasa al client `pos-venta.tsx` (búsqueda por nombre en cliente, carrito en estado local, total acumulado). `?producto=` precarga el ítem con cantidad 1. `registrarVenta` pasa de `(productoId, cantidad)` a `(items: { producto_id, cantidad }[])`; `ventaRepo.crear` acepta `items[]` e inserta N filas en `venta_items`; la transacción valida stock por ítem y descuenta.
- **Rationale**: La tabla `venta_items` ya soporta múltiples ítems y `eliminarVenta` ya repone stock iterando ítems — multi-ítem funciona sin migración. Búsqueda en cliente sobre el listado completo es lo más simple para un inventario pequeño y da respuesta instantánea; `productoRepo.listar({texto})` queda disponible si creciera.
- **Alternatives considered**: (a) Búsqueda por searchParams/server — recarga por tecla, peor UX de POS. (b) Mantener `registrarVenta(productoId, cantidad)` y agregar una acción paralela multi-ítem — duplica lógica; un solo llamador existente, la migración es trivial. (c) Zustand para el carrito — estado local basta (cero alcance fantasma).
- **Consolidación**: agregar el mismo producto dos veces suma cantidad en el ítem existente y valida contra stock (edge case de la spec).

## D7. Otros accesos de "nueva venta" y auditoría de flujos

- **Decision**: Todos los accesos apuntan a `/dashboard/ventas/nueva` sin parámetros: acceso rápido del panel (ya apunta ahí — hoy cae en el redirect roto), nuevo botón en `ventas/page.tsx` (hoy no existe; el texto vacío "Registra una venta desde el detalle de un producto" se corrige), y la entrada "Nueva venta" en el sidebar como grupo "Acciones" (requerida por FR-006). El atajo desde `inventario/[id]` mantiene `?producto=id`.
- **Rationale**: FR-006 exige que todos los accesos abran la pantalla dedicada; la pantalla de ventas debe ofrecer entrada propia (FR-005/FR-006 menciona "pantalla de ventas" como origen).
- **Auditoría**: `FabPedido` → `/dashboard/pedidos/nuevo` (correcto, se conserva aunque se revisará su posición con el nuevo layout); accesos rápidos del panel → rutas propias de cada módulo (correctos); `search-dialog` → `sidebarItems` (correcto). Único salto de módulo encontrado: `ventas/nueva` sin param → inventario (el bug reportado).

## D8. Animaciones (FR-012)

- **Decision**: Solo las provistas: transiciones CSS del sidebar vendorizado (colapso `icon`/`offcanvas`, sheet móvil con slide), `transition-colors` existentes en nav/tarjetas, `ViewTransition` no requerido.
- **Rationale**: La spec lo limita explícitamente a "los efectos y animaciones que la plantilla ya trae"; crear un sistema de animación violaría simplicidad y la regla de no agregar dependencias.

## D9. Preferencias de sidebar

- **Decision**: `sidebar_variant` y `sidebar_collapsible` ya existen en `preferences-config.ts` y `layout-controls.tsx`, persistidas en cookie; el layout las lee vía `getPreference` server action (igual que la plantilla). El estado abierto/cerrado se persiste con la cookie `sidebar_state` que el propio componente maneja.
- **Rationale**: Infraestructura ya presente; solo falta conectar el layout al patrón de la plantilla.
