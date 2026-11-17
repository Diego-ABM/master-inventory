# AGENTS.md — master-inventory

Contexto técnico del proyecto. **Actualiza este archivo cuando el stack cambie** (nueva dependencia, nueva forma de persistencia, nueva capa de arquitectura, cambio de runtime o package manager).

## Qué es

App web local de un solo usuario: inventario y ventas de una tienda de mascotas. Réplica de la app Android MrKlaus. Todo en español de Colombia y COP. Sin login, sin nube.

Desarrollo por specs (Spec Kit): cada feature vive en `specs/<NNN>-<nombre>/` con `spec.md`, `plan.md`, `tasks.md`. Constitución del proyecto en `.specify/memory/constitution.md`.

## Estructura del repo

- `Portal/` — la aplicación. Todo el trabajo ocurre aquí. Tiene su propio `AGENTS.md` con convenciones de UI (léalo antes de tocar pantallas).
- `Started/` — plantilla original intacta, solo referencia. NO modificar.
- `specs/` — especificaciones por feature.

## Stack (Portal/)

- Next.js 16 (App Router) + React 19 + TypeScript estricto
- Tailwind CSS v4 + shadcn/ui estilo `base-nova` (Base UI)
- Zustand, React Hook Form + Zod, lucide-react, date-fns, recharts
- Biome (lint/format: doble comilla, punto y coma, 2 espacios, 120 cols)
- pnpm + Node 26
- Persistencia: Postgres de Supabase vía `postgres` (postgres.js). Sin ORM. Conexión en `src/server/db/index.ts` con `STORAGE_POSTGRES_URL` (local: `.env.local` o `vercel env pull`); deploy en Vercel.
- Tests: `node --test` sobre `src/lib/domain/*.test.ts`

**Regla: no agregar dependencias** salvo que una spec lo exija explícitamente.

## Datos

- BD: Postgres (Supabase). Esquema y conexión en `src/server/db/index.ts`
- Fotos: guardadas en la tabla `fotos_producto` (binario + mime), servidas por `GET /api/fotos/[name]`; imágenes del catálogo inicial en `Portal/public/seed/images/`
- Seed inicial: `Portal/seed/productos_seed.json`
- Respaldo: un JSON único con fotos en base64 (`GET/POST /api/respaldo`); restauración = reemplazo total con confirmación
- Reporte exportable: `.txt` (`GET /api/reportes/export`)

## Arquitectura (capas, en un solo sentido)

```
src/lib/domain/        Lógica pura, sin I/O (stock, precios, totales, reportes) — testeable con node:test
src/server/db/         Conexión y esquema SQLite
src/server/repositories/  ÚNICA capa que escribe SQL, por entidad
src/server/services/   Casos de uso (venta, pedido, seed, respaldo, logs, reportes)
src/server/server-actions.ts  Server Actions llamadas desde la UI
src/app/               UI. Rutas en (main)/dashboard/{inventario,favoritos,alertas,pedidos,ventas,reportes,respaldo}
```

Co-ubicación por pantalla: `<screen>/_components/` y `<screen>/_data/`. Detalles en `Portal/AGENTS.md`.

## Comandos (en Portal/)

```bash
pnpm install && pnpm dev
pnpm build / lint / format / check / check:fix
node --test 'src/lib/domain/*.test.ts'   # tests de dominio
```
