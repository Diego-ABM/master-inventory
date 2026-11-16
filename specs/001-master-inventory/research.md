# Research — Master Inventory

Resolución de todas las incógnitas del Technical Context. Fuentes: plantilla `Portal/` (Studio Admin, Next.js 16), app de referencia MrKlaus (`/mnt/B/Proyectos/MrKlaus`, Kotlin/Room), entorno local (Node v26.13.1, pnpm 12.21.0) y spec `spec.md`.

## D1. ¿En qué directorio se construye la app?

- **Decisión**: `Portal/`. `Started/` queda intacto como copia de referencia de la plantilla.
- **Rationale**: el hook `.husky/pre-commit` hace `cd Portal` y ejecuta `generate:presets` + `lint-staged`: el proyecto activo es `Portal/`. Además `Portal/` ya difiere de `Started/` en tener código de auth (`src/proxy.ts`, `src/config/auth-config.ts`, `src/server/auth-actions.ts`), que habrá que retirar.
- **Alternativas consideradas**: construir en `Started/` (variante sin auth, `proxy.disabled.ts`) — rechazada porque rompe el hook pre-commit existente y duplicaría el proyecto; crear una raíz nueva — rechazada por la condición constitucional "plantilla del proyecto".

## D2. Limpieza de la plantilla (auth y pantallas demo)

- **Decisión**: eliminar de `Portal/`: `src/proxy.ts`, `src/config/auth-config.ts`, `src/server/auth-actions.ts`, `src/app/(main)/auth/**`, `src/data/users.ts` y las rutas demo no usadas (`chat`, `mail`, dashboards de ejemplo `(legacy)`, `default`, `crm`, `finance`, `analytics`, `productivity`, `ecommerce`, `academy`, `logistics`, `infrastructure`, `file-manager`, `patient-monitoring`, etc.). Se conserva el shell del dashboard, `src/components/ui/**`, `src/components/calendar` (sin tocar por AGENTS.md), `src/lib/**`, hooks, estilos y presets.
- **Rationale**: la spec dice explícitamente "sin login ni multiusuario" y el alcance cubre solo las funciones de MrKlaus. Dejar auth/pantallas demo sería alcance fantasma (principio III).
- **Alternativas consideradas**: deshabilitar auth manteniendo el código — rechazado: código muerto contradice "cero alcance fantasma" y "simplicidad".

## D3. Mecanismo de persistencia

- **Decisión**: `node:sqlite` (`DatabaseSync`) sobre un único archivo `Portal/data/master-inventory.db`. Esquema creado por SQL de bootstrap en `src/server/db/` con `PRAGMA journal_mode=WAL`, `foreign_keys=ON`. Todo acceso concentrado en repositorios (`src/server/repositories/`); los servicios y la UI nunca emiten SQL.
- **Rationale**: Node 26.13.1 trae `node:sqlite` sin flag — cero dependencias nuevas (constitución I + AGENTS.md). SQLite en archivo único hace trivial el respaldo (leer todas las tablas) y cumple "local, un solo usuario". `DatabaseSync` es síncrono: combina de forma natural con Server Components y Server Actions (sin async innecesario). Las transacciones (`BEGIN IMMEDIATE`/`COMMIT`) garantizan la atomicidad de "venta + descuento de stock" y "restauración total".
- **Alternativas consideradas**:
  - `better-sqlite3` — dependencia nativa que compila con node-gyp; innecesaria existiendo `node:sqlite`.
  - Prisma/Drizzle + SQLite — ORM con build step y dependencias pesadas; sobredimensionado para 8 tablas.
  - IndexedDB/localStorage en cliente — complica SSR, fotos y respaldo; los datos del dueño quedarían atados al perfil del navegador.
  - JSON plano como base de datos — sin atomicidad ni consultas; riesgo de corrupción en escrituras concurrentes.

## D4. Almacenamiento y servicio de fotos

- **Decisión**: dos orígenes unificados bajo `fotos_producto.ruta_archivo` (string de ruta pública):
  1. **Catálogo inicial**: `Portal/public/seed/images/*.png` — se sirven estáticamente como `/seed/images/<archivo>`; las filas seed apuntan a esa ruta. No requiere copia en runtime.
  2. **Fotos del dueño**: `Portal/data/fotos/<nombre>` — servidas por route handler `GET /api/fotos/[name]` que hace streaming con `Content-Type` por extensión. Al subir: validar tipo (png/jpg/jpeg/webp), renombrar a `<fotoId>.<ext>` para evitar colisiones y path traversal.
  3. El borrado de foto o de producto elimina el archivo en `data/fotos/` (las de `public/seed/` solo se "borran" como referencia; el PNG de seed es dato del repo).
- **Rationale**: `public/seed/` permite no duplicar 22 MB en runtime; `data/fotos/` mantiene juntos los datos del dueño (db + fotos) para el respaldo y para gitignorear `data/`. Un route handler propio evita exponer `data/` como público.
- **Alternativas consideradas**: todo bajo `public/` — expone datos del dueño como estáticos del build y mezcla runtime con repo; fotos como BLOB en SQLite — funciona, pero complica el render en `<img>` y el respaldo (igual hay que serializarlas); `next/image` con loader local — no aporta valor real con imágenes locales estáticas y añade fricción.

## D5. Catálogo inicial (FR-017)

- **Decisión**: copiar `productos_seed.json` (76 ítems) a `Portal/seed/` y las 62 imágenes a `Portal/public/seed/images/` (datos del producto, van al repo). En el arranque del servidor, un init de `src/server/services/seed.ts` corre una sola vez: si `SELECT COUNT(*) FROM productos = 0` y `meta.semilla_cargada` no está marcada → inserta productos con sus fotos (`/seed/images/<archivo>`) en una transacción y marca `semilla_cargada`. Si la carga falla → se registra WARN en logs, no se reintenta sobre datos existentes y la app sigue usable (CL4). `precio_compra` ausente → 70 % del `precio` de venta (Assumptions).
- **Rationale**: igual que MrKlaus (`SeedDataLoader` + `assets/seed`), pero en servidor: el flag en tabla `meta` evita cualquier recarga; la verificación "solo si está vacío" es atómica en una transacción.
- **Alternativas consideradas**: seed al primer render de una página — no determinista y depende de qué pantalla abra el dueño; migración de framework — añade tooling sin necesidad (una sola carga inicial).

## D6. Formato del archivo de respaldo (FR-015)

- **Decisión**: un solo archivo JSON `master-inventory-respaldo-<fecha>.json` con `version`, `exportadoEn`, `tablas` (productos, fotos referenciadas, ventas, venta_items, pedidos_clientes, pedido_cliente_items, meta) y `fotos: { "<ruta>": "<base64>" }` para todas las imágenes referenciadas (seed y subidas). Importación: validar estructura con **Zod** antes de tocar nada → si falla, error al usuario y datos intactos (CL3). Si es válido y el dueño confirma → transacción que borra todas las tablas de negocio, reinserta, reescribe `data/fotos/` y confirma; luego la UI se reinicia (reload a inventario). Logs NO se respaldan ni se restauran.
- **Rationale**: JSON único es el formato más simple de generar, validar y diagnosticar; Zod ya es dependencia del proyecto. ~22 MB de fotos → ~30 MB de base64: aceptable para uso local ocasional.
- **Alternativas consideradas**: `.zip` (db + carpeta de fotos) — no hay zip en stdlib de Node; agregar `archiver`/`jszip` rompe la regla de cero dependencias nuevas por un beneficio marginal; exportar el `.db` crudo + carpeta — dos artefactos que el dueño debe conservar juntos y sin validación de compatibilidad.

## D7. Reporte exportable (FR-014)

- **Decisión**: archivo de texto plano `.txt` (UTF-8, CRLF no requerido) generado por `src/lib/domain/reporte-txt.ts` (puro) y descargado via Server Action/route handler. Contenido: encabezado con nombre del negocio, periodo, fecha de generación, resumen financiero (ganancia bruta, ganancia neta, capital en stock, inversión pendiente) y top de rotación. Formato exacto en `contracts/report-format.md`.
- **Rationale**: la spec limita el alcance a texto plano ("CSV/PDF quedan fuera"). Mantener el renderer en dominio puro lo hace testeable con `node:test`.
- **Alternativas consideradas**: CSV — fuera de alcance explícito; PDF — fuera de alcance y requeriría dependencia nueva.

## D8. Dinero y fechas

- **Decisión**: dinero en **pesos enteros** (`INTEGER` en SQLite, `number` en TS). Toda entrada inválida se normaliza a 0 en dominio (CL9). Formato en pantalla/reportes: `Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })` centralizado en `src/lib/domain/moneda.ts`. Fechas/horas: epoch ms (`INTEGER`) en BD, igual que MrKlaus; conversión a fecha local para mostrar (es-CO) y para el semáforo de vencimientos (días restantes calculados en dominio puro contra una fecha de referencia inyectada — testeable).
- **Rationale**: COP no usa centavos en la operación de la tienda; enteros eliminan errores de coma flotante en los totales (SC-004 exige coincidencia exacta, tolerancia 0).
- **Alternativas consideradas**: `REAL`/centavos — el primero introduce error de redondeo; los centavos son ruido sin caso de uso; `date-fns` para todo el manejo de fechas — ya está disponible si se necesita, pero epoch ms + `Intl` basta.

## D9. Pruebas

- **Decisión**: `node --test` sobre `src/lib/domain/**/*.test.ts` (Node 26 ejecuta `.ts` por type-stripping nativo; sin dependencias). Cobertura mínima: reglas de stock (bloqueo ≤0 y >stock, deducción única en pedido entregado), congelamiento de precios en totales, semáforo de vencimientos, cálculos del reporte (bruta, neta, capital, inversión, rotación unificada) y generador del `.txt`. La UI se valida manualmente con `quickstart.md`.
- **Rationale**: la plantilla no trae framework de pruebas y la constitución pide simplicidad; `node:test` da verificación repetible de la aritmética de mayor riesgo (SC-004) sin agregar nada.
- **Alternativas consideradas**: Vitest — excelente pero dependencia nueva; solo verificación manual — no protege la lógica financiera ante regresiones.

## D10. Integración UI ↔ servidor

- **Decisión**: Server Components leen via servicios/repositorios directamente; mutaciones via **Server Actions** (`"use server"`) en `src/server/services/` llamadas desde Client Components con `useTransition`/form actions; tras cada mutación, `revalidatePath` de las secciones afectadas. Route handlers solo donde haga falta entregar/recibir archivos: `GET /api/fotos/[name]`, `GET|POST /api/respaldo`, y (si resulta más simple) `GET /api/reportes/export`.
- **Rationale**: es el patrón nativo del App Router y de la plantilla (ya usa `src/server/*-actions.ts`); evita una capa REST inventada sin necesidad.
- **Alternativas consideradas**: API REST completa + fetch en cliente — más capas para una app local de un usuario; tRPC — dependencia y boilerplate innecesarios.

## D11. Navegación: barra inferior vs sidebar de la plantilla

- **Decisión**: barra inferior con las 5 secciones (Inventario, Favoritos, Alertas, Pedidos, Ventas) + acceso a Respaldo/Logs, implementada como componente del dashboard con tokens de tema de la plantilla. En pantallas anchas puede presentarse como barra inferior fija centrada o rail lateral según encaje visual; la decisión fina es de implementación, el requisito (FR-018) es la misma jerarquía y lenguaje visual en todas las pantallas.
- **Rationale**: FR-018 y el Assumption de navegación vienen directos de MrKlaus (app móvil); es requisito escrito, no preferencia.
- **Alternativas consideradas**: sidebar de la plantilla — incumple FR-018 tal como está redactado.

## D12. "La aplicación se reinicia tras restaurar" (FR-015)

- **Decisión**: tras una restauración exitosa, el cliente recarga a `/` (inventario) con `window.location.reload()`/redirect; el estado en memoria (Zustand/preferences de UI) se mantiene — solo los datos de negocio cambian. Además el init del arranque corre la limpieza de logs >90 días y el chequeo de seed (que no hará nada tras restaurar porque `meta` viaja en el respaldo).
- **Rationale**: cumple el efecto observable del requisito (el sistema queda "como recién abierto" con los datos del respaldo) sin orquestar un restart de proceso Node.
- **Alternativas consideradas**: reiniciar el proceso `next` — complejo y frágil para ganancia nula.

## Resultado

No quedan **NEEDS CLARIFICATION**. Todas las decisiones usan dependencias ya presentes o módulos nativos de Node 26; el único artefacto externo a copiar es el seed de MrKlaus (`productos_seed.json` + `seed_images/` → `Portal/seed/` y `Portal/public/seed/images/`).
