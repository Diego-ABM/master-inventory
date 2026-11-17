# Implementation Plan: Pulido de accesibilidad y UI

**Branch**: `003-a11y-ui-polish` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-a11y-ui-polish/spec.md`

## Summary

Aplicar los hallazgos de la auditoría de Web Interface Guidelines sobre las pantallas
operativas existentes, sin rediseñar flujos ni agregar pantallas. Trabajo agrupado en
tres frentes alineados a las user stories:

1. **Accesibilidad (P1)**: nombres accesibles en español en todos los controles
   solo-ícono, asociación etiqueta↔control en formularios, enlace "saltar al
   contenido" en el layout del dashboard.
2. **Área segura táctil (P2)**: `viewportFit: "cover"` + padding con
   `env(safe-area-inset-*)` en navegación inferior y FAB; `touch-action: manipulation`
   para eliminar el retardo de doble-toque sin bloquear el zoom.
3. **Acabado (P3)**: traducir a español el panel de preferencias y el theme-switcher,
   `tabular-nums` en cifras comparativas, convención "…" en placeholders de ejemplo,
   espacio reservado en imágenes, unificar estados vacíos sobre el componente `Empty`
   existente, aviso nativo al cerrar/recargar con cambios sin guardar (producto y
   pedido nuevo) y `theme-color` que sigue la preferencia de tema de la app.

## Technical Context

**Language/Version**: TypeScript estricto, Node 26

**Primary Dependencies**: Next.js 16.4.6 (App Router) + React 19.3.1, Tailwind CSS v4,
shadcn/ui estilo `base-nova` (Base UI), Zustand, React Hook Form + Zod, lucide-react

**Storage**: N/A — la spec no introduce ni modifica datos

**Testing**: Verificación manual en navegador (lector de pantalla / inspector de
accesibilidad, emulación de safe-area en DevTools). No hay infra de tests de UI;
`node --test` solo aplica a `src/lib/domain` y esta feature no toca dominio.

**Target Platform**: Web app (uso principal desde celular con notch; deploy en Vercel)

**Project Type**: web-application (Next.js App Router, single project en `Portal/`)

**Performance Goals**: Sin nuevas metas; se exige 0 desplazamiento de contenido al
cargar imágenes (SC-005) y respuesta táctil sin retardo de doble-toque (FR-005).

**Constraints**: Sin dependencias nuevas (regla del repo). Correcciones limitadas a
pantallas existentes. Componentes de `src/components/ui/` y `src/components/calendar/`
no se modifican — la personalización se hace donde se usan.

**Scale/Scope**: ~8 pantallas del dashboard + layout compartido; ~20 archivos tocados,
todos bajo `Portal/src/app/` y `Portal/src/app/globals.css`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Resultado |
|-----------|-----------|-----------|
| I. Simplicidad | Solo atributos/clases/meta sobre componentes existentes; se reutiliza `Empty` y `ThemeBootScript`/`PreferencesStoreProvider` en lugar de crear abstracciones nuevas | PASS |
| II. Español de Colombia y COP | La feature exige traducir las cadenas restantes en inglés (panel de preferencias, theme-switcher) | PASS |
| III. Cero alcance fantasma | Cada cambio se mapea a un FR-001…012 o a un escenario de aceptación; la decisión clarificada de NO interceptar navegación interna limita el alcance | PASS |
| IV. Verificable por no técnico | Todos los SC se comprueban en el navegador; la emulación de safe-area en DevTools está explícitamente aceptada en Assumptions | PASS |
| V. Datos mínimos | No se piden ni almacenan datos nuevos | PASS |
| Crecimiento sin romper | Cambios aditivos (atributos, clases, metas); el único cambio de comportamiento (aviso de cambios sin guardar) está declarado en la spec con su alcance acotado | PASS |
| Arquitectura desacoplada | Todo el trabajo es capa UI (`src/app`, `globals.css`); no se toca dominio, repositorios ni servicios | PASS |
| Plantilla del proyecto | Se reutilizan `Empty`, `Button`, tokens de tema, presets y la estructura de preferencias existente | PASS |

**Post-Phase-1 re-check**: PASS — el diseño no introduce dependencias, entidades ni
cambios de comportamiento no declarados. Ver sección Complexity Tracking (vacía).

## Project Structure

### Documentation (this feature)

```text
specs/003-a11y-ui-polish/
├── plan.md              # Este archivo
├── spec.md              # Especificación con Clarifications (sesión 2026-11-16)
├── checklists/
│   └── requirements.md  # Checklist de calidad (16/16)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (sin entidades nuevas)
├── quickstart.md        # Phase 1 output (guía de validación)
└── tasks.md             # Phase 2 output (/speckit-tasks — NO creado aquí)
```

`contracts/` — **no se genera**: la feature no expone interfaces externas ni nuevos
endpoints; todo es ajuste de UI interna.

### Source Code (repository root)

```text
Portal/src/
├── app/
│   ├── layout.tsx                          # export const viewport (viewportFit + themeColor)
│   ├── globals.css                         # touch-action, utilidades safe-area, tabular-nums
│   └── (main)/dashboard/
│       ├── layout.tsx                      # skip link + id="contenido" en <main>
│       ├── page.tsx                        # estados vacíos → componente Empty
│       ├── _components/
│       │   ├── bottom-nav/bottom-nav.tsx   # env(safe-area-inset-*)
│       │   ├── fab-pedido.tsx              # env(safe-area-inset-*)
│       │   ├── tarjeta-producto.tsx        # verificar espacio reservado de imagen
│       │   ├── nav-header.tsx              # auditoría de nombres accesibles
│       │   └── header/
│       │       ├── layout-controls.tsx     # aria-label + traducción al español
│       │       ├── theme-switcher.tsx      # aria-label en español
│       │       └── search-dialog.tsx       # nombre accesible del campo de búsqueda
│       ├── inventario/
│       │   ├── _components/
│       │   │   ├── formulario-producto.tsx # labels Mascota/Categoría + beforeunload
│       │   │   └── filtros-inventario.tsx  # auditoría nombres accesibles
│       │   └── [id]/_components/
│       │       ├── galeria-fotos.tsx       # verificar espacio reservado
│       │       ├── controles-stock.tsx     # auditoría nombres accesibles
│       │       └── marcado-proveedor.tsx   # auditoría nombres accesibles
│       ├── pedidos/
│       │   ├── _components/
│       │   │   ├── tarjeta-pedido.tsx      # aria-label botón eliminar
│       │   │   └── lista-proveedor.tsx     # auditoría nombres accesibles
│       │   └── nuevo/_components/
│       │       └── formulario-pedido.tsx   # labels asociadas + X con nombre + beforeunload
│       ├── ventas/_components/
│       │   └── boton-eliminar-venta.tsx    # aria-label
│       └── reportes/_components/
│           └── controles-reporte.tsx       # auditoría nombres accesibles
├── scripts/theme-boot.tsx                  # theme-color inicial según modo resuelto
└── stores/preferences/                     # hook de actualización de theme-color al cambiar tema
```

**Structure Decision**: Todo el trabajo vive en la app `Portal/` siguiendo la
co-ubicación existente (`<screen>/_components/`); los únicos puntos transversales son
`app/layout.tsx` (viewport/themeColor), `globals.css` (utilidades) y el mecanismo de
preferencias (`theme-boot` + `preferences-store`) para el theme-color dinámico. No se
crean directorios nuevos.

## Complexity Tracking

> Sin violaciones de la constitución que justificar.
