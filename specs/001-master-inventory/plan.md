# Implementation Plan: Master Inventory — Sistema de inventario y ventas

**Branch**: `001-master-inventory` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-master-inventory/spec.md`

## Summary

Sistema local de un solo usuario para una tienda de mascotas: inventario con fotos, ventas con precios congelados, pedidos de clientes, marcados para pedido al proveedor, alertas de vencimiento/agotados, favoritos, reportes financieros del periodo, respaldo/restauración total de datos y logs internos. Replica las funciones existentes de la app Android MrKlaus sobre la plantilla web del proyecto.

Enfoque técnico: aplicación **Next.js 16 (App Router) + React 19 + TypeScript estricto** dentro de `Portal/` (la plantilla Studio Admin ya presente en el repo; `Started/` queda intacta como referencia). Persistencia local con **`node:sqlite` (DatabaseSync)** —módulo nativo de Node 26, cero dependencias nuevas— en un archivo `data/master-inventory.db`, más fotos en disco (`public/seed/` para el catálogo inicial y `data/fotos/` para las subidas por el dueño). Lógica de negocio pura en `src/lib/domain/` (sin I/O, probable con `node:test`), acceso a datos en `src/server/db/` (repositorios), orquestación en `src/server/services/` y Server Actions para las mutaciones desde la UI. Respaldo = un solo archivo JSON con las fotos embebidas en base64; reporte exportable = archivo de texto plano `.txt`. Todo en español de Colombia y COP.

## Technical Context

**Language/Version**: TypeScript estricto (TS 6.x), Next.js 16, React 19 — los fijados por la plantilla `Portal/`

**Primary Dependencies**: Tailwind CSS v4, shadcn/ui estilo base-nova (Base UI), Zod, React Hook Form, Zustand, lucide-react, date-fns, recharts — todas ya en `Portal/package.json`. **No se agregan dependencias nuevas.**

**Storage**: `node:sqlite` (`DatabaseSync`, nativo en Node 26.13.1) → `Portal/data/master-inventory.db`. Fotos: `Portal/public/seed/images/` (catálogo inicial) y `Portal/data/fotos/` (subidas, servidas por route handler `/api/fotos/[name]`). Respaldo: archivo JSON único con fotos en base64.

**Testing**: `node --test` (runner nativo de Node, type-stripping incluido) sobre `src/lib/domain/**/*.test.ts` para la lógica financiera y de stock (SC-004 exige tolerancia 0). Verificación de UI manual según `quickstart.md` (constitución, principio IV). La plantilla no trae framework de pruebas.

**Target Platform**: App web local de un solo usuario (PC del dueño), servida con `next dev`/`next start` en Node ≥ 22.5 (dev: Node 26). Navegador moderno. Sin login, sin nube, offline-capable por naturaleza.

**Project Type**: web-app (single project, App Router) sobre plantilla existente.

**Performance Goals**: búsqueda/filtrado instantáneo sobre ~76–500 productos (SC-002: <10 s incluyendo la interacción humana); cualquier pantalla operativa <1 s en hardware modesto.

**Constraints**: offline/local; ningún dato de negocio se borra solo (solo logs >90 días, FR-016/SC-007); restauración solo con confirmación explícita y reemplazo total (FR-015); UI y documentos 100 % español Colombia + COP (constitución II); cero dependencias nuevas salvo necesidad justificada (constitución I + AGENTS.md "avoid unnecessary dependencies").

**Scale/Scope**: 1 usuario; catálogo inicial 76 productos con fotos (22 MB de PNG); históricos de ventas/pedidos en el orden de miles de filas; 5 secciones principales + respaldo/logs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / condición | Evaluación | Resultado |
|---|---|---|
| **I. Simplicidad ante todo** | `node:sqlite` nativo y `node:test` evitan ORM, drivers nativos compilados y frameworks de test: es la opción más simple que cumple la spec. Capa de dominio pura separada (requerida por "arquitectura desacoplada"), sin abstracciones extra. | PASS |
| **II. Español de Colombia y COP** | UI, mensajes, reporte `.txt` y formato de moneda (`Intl.NumberFormat` `es-CO`/COP) en español. Dinero almacenado como pesos enteros (INTEGER). | PASS |
| **III. Cero alcance fantasma** | Solo las 8 historias de la spec. Limpieza de la plantilla (auth, pantallas demo) no es alcance nuevo: es retirar lo que la spec excluye ("sin login ni multiusuario"). | PASS |
| **IV. Verificable por persona no técnica** | `quickstart.md` define escenarios ejecutables en la app (abrir X, ingresar Y, ver Z). Los `node:test` solo cubren aritmética interna; los SC se validan en pantalla. | PASS |
| **V. Datos del usuario con respeto** | Sin cuentas ni secretos; solo los datos de negocio de la spec. | PASS |
| **Crecimiento sin romper** | Feature inicial sobre plantilla; la limpieza de auth/demo se declara aquí como cambio de comportamiento justificado por la spec (fuera de alcance: login). | PASS |
| **Arquitectura desacoplada** | `src/lib/domain/` (reglas puras) / `src/server/db`+`repositories` (almacenamiento) / `src/server/services` (orquestación) / `src/app` (UI) / `report-format` (texto plano, sin PDF). Cambiar SQLite o el formato de reporte no toca dominio ni UI. | PASS |
| **Plantilla del proyecto** | Se construye dentro de `Portal/` reusando shell, componentes `src/components/ui`, tokens de tema y convenciones de co-ubicación de AGENTS.md. `Started/` no se toca. La barra inferior de 5 secciones (FR-018) es requisito de spec y se implementa con tokens/componentes de la plantilla. | PASS |

**Gate inicial: PASS — sin violaciones que justificar.**

**Re-chequeo post-diseño (Phase 1): PASS.** El diseño generado (`research.md`, `data-model.md`, `contracts/`, `quickstart.md`) mantiene las condiciones: dominio puro desacoplado de UI/almacenamiento/reporte; cero dependencias nuevas; cada artefacto responde a FRs de la spec (incluida la tabla `venta_items`, que preserva la separación encabezado/detalle del sistema de origen sin agregar funcionalidad); todos los escenarios del quickstart son verificables en pantalla por una persona no técnica; interfaz y contratos en español Colombia + COP.

## Project Structure

### Documentation (this feature)

```text
specs/001-master-inventory/
├── plan.md              # Este archivo
├── research.md          # Phase 0 output — decisiones técnicas
├── data-model.md        # Phase 1 output — entidades y reglas
├── contracts/           # Phase 1 output — contratos de interfaz
│   ├── storage-interface.md
│   ├── backup-format.md
│   ├── report-format.md
│   └── routes.md
└── quickstart.md        # Phase 1 output — guía de validación
```

### Source Code (repository root)

```text
Portal/                                  # App sobre la plantilla (package manager: pnpm)
├── public/
│   └── seed/images/                     # 62 PNG del catálogo inicial (copiados de MrKlaus assets)
├── data/                                # Runtime, gitignored — datos del dueño
│   ├── master-inventory.db              # SQLite (node:sqlite)
│   └── fotos/                           # Fotos subidas por el dueño
├── seed/
│   └── productos_seed.json              # Catálogo inicial (76 productos, copiado de MrKlaus)
└── src/
    ├── lib/
    │   └── domain/                      # LÓGICA PURA (sin I/O): tipos, enums,
    │       ├── *.ts                     #   reglas de stock, precios congelados,
    │       └── *.test.ts                #   semáforo, totales, reportes + node:test
    ├── server/
    │   ├── db/                          # node:sqlite: conexión, esquema, migración inicial
    │   ├── repositories/                # Acceso a datos por entidad (única capa que toca SQL)
    │   └── services/                    # Orquestación: registrar venta, entregar pedido,
    │                                    #   seed primer arranque, respaldo, logs, reportes
    ├── data/seed.ts                     # Tipado/carga del JSON de catálogo (si aplica)
    ├── app/
    │   ├── api/fotos/[name]/route.ts    # Sirve data/fotos/* (fotos del dueño)
    │   ├── api/respaldo/route.ts        # Export (GET) / import (POST) del respaldo JSON
    │   └── (main)/dashboard/
    │       ├── inventario/              # Lista + detalle + form de producto
    │       ├── favoritos/               # Mis Favoritos (marcados + ranking más vendidos)
    │       ├── alertas/                 # Vencimientos (semáforo) + agotados
    │       ├── pedidos/                 # Pedidos de clientes + marcados a proveedor
    │       ├── ventas/                  # Historial de ventas
    │       ├── reportes/                # Reporte mensual/anual + exportar .txt
    │       ├── respaldo/                # Exportar/importar respaldo + logs
    │       └── _components/bottom-nav   # Barra inferior de 5 secciones (FR-018)
    └── navigation/                      # Config de navegación actualizada a las 5 secciones

# Limpieza de plantilla (justificada por la spec — "sin login ni multiusuario",
# fuera de alcance: pantallas demo de la plantilla):
#   eliminar src/proxy.ts, src/config/auth-config.ts, src/server/auth-actions.ts,
#   src/app/(main)/auth/**, src/data/users.ts y rutas demo no usadas (chat, mail,
#   dashboards de ejemplo). Started/ NO se modifica (referencia intacta).
```

**Structure Decision**: proyecto único dentro de `Portal/` siguiendo la convención de co-ubicación de AGENTS.md (`dashboard/<screen>/_components`, `_data`). La costura de desacoplamiento exigida por la constitución es: `domain` (puro, testeable con `node:test`) → `repositories` (SQL) → `services` (casos de uso) → `app` (UI + Server Actions). Cambios a esta convención: ninguno; solo se agregan `src/lib/domain/`, `src/server/db|repositories|services/` y `data/` + `seed/` como artefactos de runtime/datos.

## Complexity Tracking

Sin violaciones de la constitución que justificar. La decisión con más peso —`node:sqlite` en lugar de una dependencia externa— se documenta en `research.md`.
