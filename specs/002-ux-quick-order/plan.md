# Implementation Plan: Estabilidad, pedido rápido y experiencia de uso

**Branch**: `002-ux-quick-order` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ux-quick-order/spec.md`

## Summary

Seis historias sobre la app existente (Next.js 16 + Postgres en Supabase):

1. **Bug fotos**: las cargas de fotos de celular (5–15 MB) superan el límite de 1 MB de las Server Actions y tumban el flujo. Se comprime la foto en el dispositivo (Canvas, ~1600px, calidad ~80%, WebP) antes de subirla y se sube `serverActions.bodySizeLimit` a 4 MB como margen. La validación de formato se mantiene en servidor; HEIC y archivos no decodificables se rechazan con mensaje claro.
2. **Bug nombre en pedidos**: la etiqueta del ítem se construye en el servidor a partir del producto (`nombre` + desambiguador de variante/peso/mascota), de modo que el cliente nunca dicta la etiqueta y ningún identificador interno aparece como dato principal; nombre vacío cae a "Producto sin nombre".
3. **Pedido rápido**: botón flotante "+" en el layout del dashboard que lleva directo a `/dashboard/pedidos/nuevo`.
4. **Responsive**: una sola UI adaptable — barra inferior en pantallas angostas, navegación horizontal en el header en pantallas anchas; rejillas ya usan breakpoints `sm`/`lg`.
5. **Login + panel**: clave única del negocio por variable de entorno (`CLAVE_ACCESO`), gate en `src/proxy.ts` (convención de Next 16), cookie firmada por hash de 30 días, página `/acceso` y opción "Salir". Tras entrar, `/dashboard` muestra un panel con ventas del día, pedidos pendientes, alertas de stock y accesos rápidos.
6. **Visual**: tokens semánticos existentes, feedback ya presente vía toasts; se corrigen textos en inglés (`lang="en"`, diálogo de búsqueda) y el redirect roto de `/`.

## Technical Context

**Language/Version**: TypeScript estricto, Node 26, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Tailwind CSS v4 + shadcn/ui `base-nova` (Base UI), Zustand, React Hook Form + Zod, lucide-react, date-fns, recharts, `postgres` (postgres.js), tw-animate-css. **No se agregan dependencias** (regla del proyecto): la compresión de imágenes usa Canvas/`createImageBitmap` del navegador y la sesión usa Web Crypto.

**Storage**: Postgres (Supabase) vía `postgres.js`, conexión en `src/server/db/index.ts` (`STORAGE_POSTGRES_URL`). Fotos en `fotos_producto.datos` (BYTEA) servidas por `GET /api/fotos/[name]`. La sesión de acceso **no usa tabla**: cookie httpOnly cuyo valor es un hash derivado de la clave.

**Testing**: `node --test 'src/lib/domain/*.test.ts'` (lógica pura). Verificación manual guiada por `quickstart.md` para UI.

**Target Platform**: app web (Vercel en producción, `pnpm dev` en local).

**Project Type**: web-application (proyecto único, `portal/`).

**Performance Goals**: fotos subidas siempre < ~1 MB tras compresión en dispositivo; fotos servidas con `Cache-Control: public, max-age=31536000, immutable`.

**Constraints**: español de Colombia y COP en todo texto/moneda; sin multiusuario; clave solo por variable de entorno; solución más simple que cumpla la spec.

**Scale/Scope**: 8 pantallas de dashboard + página de acceso + panel; ~6 server actions nuevas/ajustadas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|-----------|------------|
| I. Simplicidad | ✅ Sin dependencias nuevas, sin tablas nuevas, sin abstracciones extra: Canvas API, Web Crypto, `proxy.ts`, un componente FAB, un panel que reusa repos existentes. |
| II. Español/COP | ✅ Todos los textos nuevos en es-CO; la corrección de strings en inglés existentes es parte de la feature. |
| III. Cero alcance fantasma | ✅ Cada cambio responde a un FR de la spec; no hay extras. |
| IV. Verificable | ✅ Todos los criterios se comprueban usando la app (ver `quickstart.md`). |
| V. Datos con respeto | ✅ Solo se pide la clave del negocio; ningún secreto va al código (variable de entorno). |
| Crecimiento sin romper | ✅ No se altera el comportamiento existente salvo lo declarado en la spec (etiqueta de ítems, gate de acceso). |
| Arquitectura desacoplada | ✅ La etiqueta del ítem y la compresión viven en `src/lib/domain`/`src/lib` (lógica pura y testeable); repos/services intactos en sus capas. |
| Plantilla del proyecto | ✅ Se reusan componentes ui/, tokens de tema, layout y toasts existentes. |

**Resultado**: PASS, sin violaciones que justificar.

*Re-check post-diseño (Phase 1)*: el diseño confirma el pase — cero
dependencias nuevas, cero tablas nuevas, lógica pura en `src/lib/`, toda la UI
sobre la plantilla existente. Ningún requisito fuera de la spec.

## Project Structure

### Documentation (this feature)

```text
specs/002-ux-quick-order/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── acceso.md
│   ├── fotos.md
│   └── interfaz.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
portal/src/
├── proxy.ts                             # NUEVO: gate de acceso (cookie de sesión)
├── lib/
│   ├── imagen.ts                        # NUEVO: compresión de foto en dispositivo (Canvas)
│   ├── sesion.ts                        # NUEVO: hash/verificación del token de sesión (Web Crypto)
│   └── domain/
│       ├── pedidos.ts                   # etiquetaItemProducto() (nombre + variante)
│       └── pedidos.test.ts              # tests de la etiqueta
├── server/
│   ├── services/
│   │   ├── acceso.ts                    # NUEVO: entrar(clave) / salir() — server actions
│   │   ├── pedidos.ts                   # usa etiquetaItemProducto al crear ítems
│   │   └── productos.ts                 # validación de fotos endurecida (mime+ext)
│   └── repositories/                    # sin cambios (schema intacto)
├── app/
│   ├── (external)/page.tsx              # redirect corregido a /dashboard
│   ├── acceso/page.tsx                  # NUEVO: pantalla de login (fuera del shell)
│   ├── acceso/_components/formulario-acceso.tsx
│   ├── (main)/dashboard/
│   │   ├── page.tsx                     # Panel principal (resumen del día + accesos rápidos)
│   │   ├── layout.tsx                   # FAB "+" + nav adaptativa (bottom en móvil, header en PC)
│   │   └── _components/
│   │       ├── fab-pedido.tsx           # NUEVO: botón flotante "+"
│   │       ├── nav-header.tsx           # NUEVO: navegación horizontal ≥lg
│   │       ├── header/search-dialog.tsx # textos a es-CO
│   │       └── boton-salir.tsx          # NUEVO: opción "Salir"
│   ├── api/fotos/[name]/route.ts        # ya sirve con cache inmutable (sin cambios)
│   └── layout.tsx                       # lang="es"
└── next.config.mjs                      # experimental.serverActions.bodySizeLimit: "4mb"
```

**Structure Decision**: co-ubicación por pantalla según `portal/AGENTS.md`; lógica pura en `src/lib/`; ningún archivo fuera de `portal/`.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
