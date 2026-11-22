# Implementation Plan: Dashboard de métricas, navegación lateral y flujo de ventas dedicado

**Branch**: `004-dashboard-nav-overhaul` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-dashboard-nav-overhaul/spec.md`

## Summary

Cuatro bloques de trabajo sobre la app existente en `portal/`:

1. **Métricas por período en el panel**: nuevo módulo de dominio `metricas.ts` que calcula rangos (hoy, semana desde lunes, mes, año) y agrega series temporales (hora/día/mes). La página del panel trae las ventas del año en curso en una sola consulta y un Client Component con tabs cambia de período sin red, con gráfica recharts (`src/components/ui/chart.tsx`).
2. **Flujo de venta dedicado (POS)**: `ventas/nueva` deja de exigir `?producto=` (hoy redirige a inventario, el bug reportado) y pasa a ser una pantalla de carrito multi-ítem: buscador de productos, cantidades, total acumulado y confirmación. `registrarVenta` se extiende a lista de ítems con validación de stock por ítem dentro de la transacción. El atajo `?producto=` precarga el ítem (cantidad 1).
3. **Navegación lateral**: el layout adopta el patrón de la plantilla (`SidebarProvider` + `AppSidebar` + `SidebarInset` + `SidebarTrigger`) usando el componente `ui/sidebar.tsx` ya vendorizado y la config `sidebar-items.ts` que ya existe y alimenta el buscador, a la que se le agrega un grupo "Acciones" con el atajo "Nueva venta" → `/dashboard/ventas/nueva` (FR-006). Se eliminan `NavHeader`, `BottomNav` y `secciones.ts`; en móvil el sidebar actúa como drawer (Sheet) vía `SidebarTrigger`.
4. **Logo como enlace a inicio y animaciones de plantilla**: el nombre/logo en el header del sidebar enlaza a `/dashboard`; colapso, drawer móvil, estados activo/hover y transiciones vienen del componente sidebar ya vendorizado, sin librerías nuevas.

No hay cambios de esquema: `venta_items` ya soporta N ítems por venta.

## Technical Context

**Language/Version**: TypeScript estricto, Node 26, Next.js 16 (App Router) + React 19

**Primary Dependencies**: Tailwind CSS v4 + shadcn/ui estilo `base-nova` (Base UI) — `src/components/ui/sidebar.tsx`, `chart.tsx`, `tabs.tsx`, `empty.tsx` ya vendorizados; recharts ^3.8.0; lucide-react; Zustand (preferencias `sidebar_variant`/`sidebar_collapsible` ya existen); `postgres` (postgres.js)

**Storage**: Postgres de Supabase vía `postgres` (`src/server/db/index.ts`, `STORAGE_POSTGRES_URL`). Tablas `ventas` y `venta_items` existentes; sin migraciones.

**Testing**: `node --test 'src/lib/domain/*.test.ts'` — nuevo `metricas.test.ts` para rangos de período y agregación.

**Target Platform**: App web local de un solo usuario (desktop + móvil), deploy en Vercel.

**Project Type**: web-app (Next.js monolítico, Server Actions + Server Components).

**Performance Goals**: cambio de período < 2 s (SC-001) — se resuelve computando los 4 períodos en una sola carga y alternando en cliente.

**Constraints**: sin dependencias nuevas (constitución + AGENTS.md); todo en español de Colombia y COP; arquitectura en capas unidireccional (`domain` → `repositories` → `services` → UI); navegación debe funcionar en pantalla ancha y angosta sin perder secciones.

**Scale/Scope**: ~8 secciones de navegación, 1 pantalla nueva (POS), 1 layout reescrito, 1 módulo de dominio nuevo, inventario pequeño (decenas/cientos de productos y ventas).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|-----------|------------|
| I. Simplicidad | PASS — se reutiliza el sidebar ya vendorizado, `sidebar-items.ts` existente y `ventaRepo.listar` para métricas; sin abstracciones ni deps nuevas. |
| II. Español y COP | PASS — todos los textos nuevos en es-CO, montos con `formatearCOP`. |
| III. Cero alcance fantasma | PASS — solo lo escrito en spec: métricas, POS, sidebar, logo-link, animaciones de plantilla, auditoría de accesos. |
| IV. Verificable no técnico | PASS — criterios comprobables usando la app (ver quickstart.md). |
| V. Datos con respeto | PASS — no se piden datos nuevos ni secretos. |
| Crecimiento sin romper | PASS — `registrarVenta` cambia su firma pero tiene un único llamador (el formulario que se reemplaza); el resto de flujos no se toca. |
| Arquitectura desacoplada | PASS — lógica de períodos/agregación en `domain` pura y testeable; SQL solo en `ventaRepo`; caso de uso en `services`. |
| Plantilla del proyecto | PASS — se adopta el patrón de sidebar de la propia plantilla (`plantilla/.../app-sidebar.tsx`, `nav-main.tsx`). |

Sin violaciones. Complexity Tracking no aplica.

*Re-evaluado tras el diseño (Phase 1): el diseño mantiene el cumplimiento — métricas puras en `domain`, cero dependencias nuevas, una sola fuente de secciones, y `contracts/` solo formaliza la firma ya existente del patrón `Resultado`.*

## Project Structure

### Documentation (this feature)

```text
specs/004-dashboard-nav-overhaul/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created here)
```

### Source Code (repository root)

```text
portal/src/
├── lib/domain/
│   ├── metricas.ts            # NUEVO: rangos de período + agregación de series (puro, node:test)
│   ├── metricas.test.ts       # NUEVO
│   └── ventas.ts              # EXTENDER: total multi-ítem
├── server/
│   ├── repositories/ventas.ts # EXTENDER: crear() acepta items[]
│   └── services/ventas.ts     # EXTENDER: registrarVenta(items[]) multi-ítem
├── app/(main)/dashboard/
│   ├── layout.tsx             # REESCRITO: SidebarProvider + SidebarInset + trigger
│   ├── page.tsx               # EXTENDIDO: sección de métricas por período
│   ├── _components/
│   │   ├── sidebar/           # NUEVO: app-sidebar.tsx, nav-main.tsx (adaptados de plantilla)
│   │   ├── panel-metricas.tsx # NUEVO: client, tabs de período + gráfica
│   │   └── (eliminados: nav-header.tsx, bottom-nav/, secciones.ts)
│   └── ventas/
│       ├── page.tsx           # botón "Nueva venta" + texto vacío corregido
│       └── nueva/
│           ├── page.tsx       # REESCRITO: carga productos + precarga ?producto=
│           └── _components/
│               └── pos-venta.tsx  # NUEVO client: búsqueda + carrito + confirmar
└── navigation/sidebar/sidebar-items.ts  # fuente única de secciones (EXTENDIDA: + grupo "Acciones" con "Nueva venta")
```

**Structure Decision**: app Next.js única en `portal/` con co-ubicación por pantalla según `portal/AGENTS.md`. El sidebar se implementa adaptando los componentes de la plantilla (`plantilla/src/app/(main)/dashboard/_components/sidebar/`) sobre el `ui/sidebar.tsx` ya presente. La lógica de métricas vive en `src/lib/domain/` respetando las capas.

## Complexity Tracking

> Sin violaciones de constitución que justificar.
