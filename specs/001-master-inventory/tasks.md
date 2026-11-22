---

description: "Task list for feature implementation"
---

# Tasks: Master Inventory — Sistema de inventario y ventas

**Input**: Design documents from `/specs/001-master-inventory/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Incluidos SOLO donde el plan los exige: `node --test` sobre `src/lib/domain/**/*.test.ts` para reglas de stock, precios congelados, semáforo, cálculos de reportes y generador `.txt` (research.md D9, SC-004 tolerancia 0). La UI se valida manualmente con `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: dentro de `portal/` (App Router). `plantilla/` NO se modifica.
- Dominio puro: `portal/src/lib/domain/` · Repositorios (única capa SQL): `portal/src/server/repositories/` · Servicios/Server Actions: `portal/src/server/services/` · Pantallas: `portal/src/app/(main)/dashboard/<seccion>/`
- Datos runtime (gitignored): `portal/data/` · Semilla: `portal/seed/` + `portal/public/seed/images/`
- Cero dependencias nuevas; Node 26 (`node:sqlite`, `node --test`); español Colombia + COP en toda la UI.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto sobre la plantilla y datos base

- [X] T001 Copiar `productos_seed.json` (76 ítems) a `portal/seed/productos_seed.json` y las 62 imágenes a `portal/public/seed/images/` desde `/mnt/B/Proyectos/MrKlaus/app/src/main/assets/` (`seed/` y `seed_images/`)
- [X] T002 [P] Crear el directorio de runtime `portal/data/fotos/` y agregar `data/` a `portal/.gitignore` (o `.gitignore` raíz si aplica)
- [X] T003 [P] Eliminar el auth de la plantilla per research D2: `portal/src/proxy.ts`, `portal/src/config/auth-config.ts`, `portal/src/server/auth-actions.ts`, `portal/src/app/(main)/auth/**`, `portal/src/data/users.ts` (la spec excluye login)
- [X] T004 [P] Eliminar rutas demo no usadas de `portal/src/app/(main)/dashboard/` per research D2 (chat, mail, dashboards de ejemplo `(legacy)`, `default`, `crm`, `finance`, `analytics`, `productivity`, `ecommerce`, `academy`, `logistics`, `infrastructure`, `file-manager`, `patient-monitoring`, `kanban`, `tasks`, `users`, `roles`, `profile`, `products`, `invoice`, `calendar`, `coming-soon` si no se reutilizan); conservar shell, `src/components/ui/**`, `src/components/calendar`, hooks, estilos y presets
- [X] T005 [P] Crear `portal/src/data/seed.ts` con tipado TypeScript del JSON de catálogo (76 productos) y función de carga que lee `portal/seed/productos_seed.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Núcleo de infraestructura que DEBE completarse antes de cualquier historia de usuario

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests de dominio (escribir primero, deben FALLAR antes de implementar)

- [X] T006 [P] Crear tests `portal/src/lib/domain/stock.test.ts` para reglas de stock: cantidad entera `> 0` y `≤ stock disponible` (CL1), `stockBajo` cuando `cantidad_stock <= stock_minimo`, `agotado` cuando `cantidad_stock <= 0` (node:test)
- [X] T007 [P] Crear tests `portal/src/lib/domain/vencimiento.test.ts` para semáforo: `≤ 30` días → rojo, `31–60` → naranja, `> 60` → verde, `fecha_vencimiento NULL` → no aparece, fecha pasada → días negativos en rojo (CL8); días calculados contra fecha de referencia inyectada
- [X] T008 [P] Crear tests `portal/src/lib/domain/moneda.test.ts` para formato `Intl.NumberFormat("es-CO", currency:"COP", maximumFractionDigits:0)` y normalización de entrada inválida/vacía → 0 (CL9)

### Implementación de dominio e infraestructura

- [X] T009 Crear `portal/src/lib/domain/tipos.ts` con enums `Mascota` (`PERRO`, `GATO`, `HAMSTER`, `UNISEX`), `Categoria` (`LIMPIEZA_ASEO`, `ACCESORIOS`, `JUGUETES`, `SNACKS`), `NivelLog` (`INFO`, `WARN`, `ERROR`) y tipos de entidades del data-model (importes enteros, fechas epoch ms, booleanos 0/1)
- [X] T010 [P] Implementar `portal/src/lib/domain/moneda.ts`: `formatearCOP(valor)` y `normalizarNumero(entrada)` (texto/vacío → 0, nunca error de parseo — CL9) hasta pasar T008
- [X] T011 [P] Implementar `portal/src/lib/domain/vencimiento.ts`: `diasRestantes(fecha_vencimiento, referencia)` y `semaforo(dias)` → `'rojo'|'naranja'|'verde'|null` hasta pasar T007
- [X] T012 [P] Implementar `portal/src/lib/domain/stock.ts`: `validarCantidad(cantidad, stock)`, `esStockBajo(producto)`, `estaAgotado(producto)` hasta pasar T006
- [X] T013 Crear `portal/src/server/db/index.ts` con `abrirDb()` singleton (`node:sqlite` DatabaseSync, `PRAGMA journal_mode=WAL`, `PRAGMA foreign_keys=ON`, crea `portal/data/` si no existe), esquema de bootstrap de las 8 tablas (`productos`, `fotos_producto`, `ventas`, `venta_items`, `pedidos_clientes`, `pedido_cliente_items`, `logs`, `meta` con FKs CASCADE/SET NULL per data-model.md), `transaccion<T>(fn)` (BEGIN IMMEDIATE/COMMIT/ROLLBACK) y `ejecutarInit()` (esquema + `DELETE FROM logs WHERE timestamp < ahora - 90 días` — CL10)
- [X] T014 [P] Crear `portal/src/server/repositories/logs.ts` (`logRepo`): `registrar(nivel, modulo, mensaje, excepcion?)`, `listar(limite?)`, `limpiarAntiguos(antesDeEpoch)`, `limpiarTodo()` per contracts/storage-interface.md
- [X] T015 [P] Crear `portal/src/server/repositories/meta.ts` (`metaRepo`): `leer(clave)` / `escribir(clave, valor)` para `semilla_cargada` y `version_esquema`
- [X] T016 Conectar `ejecutarInit()` al arranque del servidor (instrumentation hook `register()` en `portal/src/instrumentation.ts` de Next.js — corre una sola vez al arrancar el servidor, fuera del ciclo de render)
- [X] T017 Crear la barra inferior de 5 secciones (Inventario, Favoritos, Alertas, Pedidos, Ventas) + acceso a Respaldo/Reportes desde el área de respaldo/seguridad (`/dashboard/respaldo` enlaza a `/dashboard/reportes`) en `portal/src/app/(main)/dashboard/_components/bottom-nav/` (FR-018, tokens de tema de la plantilla), actualizar `portal/src/navigation/sidebar/sidebar-items.ts` y el layout del dashboard para usarla; la ruta `/dashboard` redirige a `/dashboard/inventario`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Gestionar el inventario sin papel (Priority: P1) 🎯 MVP

**Goal**: CRUD completo de productos con fotos (máx 5), búsqueda + filtro por mascota y categoría simultáneos, ajuste manual de stock +/−, y catálogo inicial de 76 productos cargado en el primer arranque

**Independent Test**: Quickstart V1 + V2: con `data/` vacío arrancar la app, ver los 76 productos con foto/precio/chips; crear un producto solo con nombre y precio (stock 0, mínimo 3); buscar "arena" + filtrar Gato y Limpieza y aseo; ajustar stock con +/−; subir 5 fotos e intentar una 6.ª (bloqueado); eliminar con confirmación

### Implementación for User Story 1

- [X] T018 [P] [US1] Crear `portal/src/server/repositories/productos.ts` (`productoRepo`) con el contrato completo de contracts/storage-interface.md: `listar(filtro {texto?, mascota?, categoria?})` (búsqueda por nombre + ambos filtros a la vez), `obtener(id)` con fotos, `crear(data)` aplicando defaults (stock 0, `stock_minimo` 3, `UNISEX`, `ACCESORIOS`), `actualizar` (pone `fecha_actualizacion`), `ajustarStock(id, delta)`, `eliminar(id)` (CASCADE fotos), `marcarFavorito`, `marcarPedidoProveedor`, `listarPedidoProveedor`, `listarVencimientos` (fecha_vencimiento NOT NULL orden ASC), `listarAgotados` (stock ≤ 0), `hayProductos()`
- [X] T019 [P] [US1] Crear `portal/src/server/repositories/fotos.ts` (`fotoRepo`): `agregar(productoId, ruta, orden)` que falla si el producto ya tiene 5 fotos, `quitar(fotoId)`, `contarPorProducto(productoId)`
- [X] T020 [P] [US1] Crear `portal/src/server/repositories/pedidos.ts` con `retirarItemsDeProducto(productoId): number[]` que borra las filas de `pedido_cliente_items` de pedidos pendientes (`entregado = 0`) y retorna los ids de pedidos afectados (CL7)
- [X] T021 [P] [US1] Crear `portal/src/server/services/seed.ts`: si `hayProductos()` es falso y `meta.semilla_cargada` no está marcada → inserta los 76 productos con sus fotos (`/seed/images/<archivo>`) en una transacción y marca `semilla_cargada`; `precio_compra` ausente → 70 % de `precio_venta`; si falla → WARN en logs y la app sigue usable sin reintentar (CL4, FR-017); invocar desde `ejecutarInit()`
- [X] T022 [P] [US1] Crear `portal/src/app/api/fotos/[name]/route.ts`: GET sirve `portal/data/fotos/<name>` con `Content-Type` por extensión, 404 si no existe, rechaza path traversal
- [X] T023 [US1] Crear `portal/src/server/services/productos.ts` con Server Actions (`"use server"`): `crearProducto`, `actualizarProducto`, `eliminarProducto`, `ajustarStock`, `agregarFoto`, `quitarFoto`; validación Zod, transacciones, logs y `revalidatePath`; `eliminarProducto` borra archivos físicos de `data/fotos/` (las rutas `/seed/images/*` solo pierden la referencia), retira ítems de pedidos pendientes via `retirarItemsDeProducto` y reporta los pedidos afectados en el aviso; si algún pedido queda sin ítems, el aviso sugiere eliminarlo (CL7); subida valida png/jpg/jpeg/webp y renombra a `<fotoId>.<ext>`
- [X] T024 [P] [US1] Crear tarjeta de producto compartida en `portal/src/app/(main)/dashboard/_components/` (foto, precio COP, chips mascota/categoría/peso, corazón de favorito, aviso "Stock Bajo" cuando `stock ≤ stock_minimo`)
- [X] T025 [US1] Crear lista de inventario en `portal/src/app/(main)/dashboard/inventario/page.tsx` + `_components/` (grid de tarjetas, búsqueda por nombre + filtro mascota y categoría simultáneos, estados de carga/vacío/error con mensaje claro — FR-003)
- [X] T026 [P] [US1] Crear formulario de producto `portal/src/app/(main)/dashboard/inventario/nuevo/page.tsx` + `_components/` (React Hook Form + Zod; obligatorios solo nombre y precio de venta; resto opcional con defaults; números inválidos → 0; soporte de fotos hasta 5)
- [X] T027 [P] [US1] Crear edición `portal/src/app/(main)/dashboard/inventario/[id]/editar/page.tsx` reutilizando el formulario de T026
- [X] T028 [US1] Crear detalle `portal/src/app/(main)/dashboard/inventario/[id]/page.tsx` + `_components/` (galería con agregar/quitar foto hasta 5, precios, todos los datos, semáforo de vencimiento, corazón, marcado "para próximo pedido" con nota, botones +/− de stock que actualizan en pantalla sin recargar, botón que enlaza a `/dashboard/ventas/nueva?producto=<id>` — FR-002)

**Checkpoint**: User Story 1 completa y verificable por sí sola (V1+V2 de quickstart.md)

---

## Phase 4: User Story 2 - Registrar ventas que descuentan stock y congelan precios (Priority: P1)

**Goal**: Registrar venta de un producto por cantidad con descuento automático de stock y datos congelados; historial consultable; eliminar venta repone el stock

**Independent Test**: Quickstart V3: producto con stock 10 → venta de 3 → stock 7 y venta en el historial con fecha, ítem y total; editar el precio del producto no cambia la venta; venta > stock / 0 / negativa bloqueada; eliminar venta repone stock

### Tests for User Story 2 (dominio, escribir primero — deben FALLAR)

- [X] T029 [P] [US2] Crear tests `portal/src/lib/domain/ventas.test.ts`: `total = cantidad × precio_venta` calculado con datos congelados del ítem (nunca del producto actual) y validación de cantidad per CL1

### Implementación for User Story 2

- [X] T030 [P] [US2] Implementar `portal/src/lib/domain/ventas.ts`: `calcularTotalVenta(item)` con precios congelados y validación de cantidad `1 ≤ n ≤ stock` hasta pasar T029
- [X] T031 [P] [US2] Crear `portal/src/server/repositories/ventas.ts` (`ventaRepo`): `crear(venta, item)` (inserta `ventas` + `venta_items` con nombre/precios congelados), `listar(rango {desde, hasta}?)`, `eliminar(id)` retornando lo eliminado, `unidadesPorProducto(desde, hasta)` per storage-interface.md
- [X] T032 [US2] Crear `portal/src/server/services/ventas.ts` con Server Actions: `registrarVenta(productoId, cantidad)` en transacción (validar cantidad → `cantidad_stock -= cantidad` → insertar venta + ítem congelado) y `eliminarVenta(id)` en transacción (reponer `cantidad` al stock solo si `producto_id` aún existe → borrar; la venta deja de contar en reportes — CL11); logs + `revalidatePath`
- [X] T033 [P] [US2] Crear historial `portal/src/app/(main)/dashboard/ventas/page.tsx` + `_components/` (fecha/hora, ítem con datos congelados, total COP; eliminar con confirmación explícita; mensaje de sección vacía)
- [X] T034 [US2] Crear `portal/src/app/(main)/dashboard/ventas/nueva/page.tsx?producto=<id>` + `_components/` (cantidad, confirmación, bloqueo de cantidad > stock o ≤ 0 con mensaje en español; accesible desde el detalle de producto)

**Checkpoint**: User Stories 1 AND 2 funcionan de forma independiente (V1–V3 de quickstart.md)

---

## Phase 5: User Story 3 - Tomar pedidos de clientes (Priority: P2)

**Goal**: Pedidos con cliente obligatorio, contacto opcional, ítems de catálogo (precio congelado al crear) o personalizados (texto libre), total calculado, estados entregado/pendiente y pagado/pago pendiente, descuento de stock una sola vez al primer "Entregado"; solo pendientes eliminables

**Independent Test**: Quickstart V4: crear pedido con 5 unidades de catálogo + ítem personalizado → total correcto; marcar Entregado → stock −5 solo la primera vez; desmarcar no repone (aviso de corrección manual); pedido solo personalizado no mueve stock; entregado con pago pendiente no suma a reportes; pedido entregado no se puede eliminar

### Tests for User Story 3 (dominio, escribir primero — deben FALLAR)

- [X] T035 [P] [US3] Crear tests `portal/src/lib/domain/pedidos.test.ts`: total = `Σ(cantidad × precio_unitario)` con precios congelados; descuento una sola vez (`stock_descontado` como candado); elegibilidad a reportes `entregado = 1 AND pagado = 1`; pedido entregado congelado (no eliminable/modificable — CL12)

### Implementación for User Story 3

- [X] T036 [P] [US3] Implementar `portal/src/lib/domain/pedidos.ts`: `calcularTotalPedido(items)`, `debeDescontarStock(pedido)` (`entregado && !stock_descontado`), `cuentaEnReportes(pedido)` (`entregado && pagado`), `puedeEliminarse(pedido)` (`!entregado`) hasta pasar T035
- [X] T037 [US3] Extender `portal/src/server/repositories/pedidos.ts` con el `pedidoRepo` completo per storage-interface.md: `crear(pedido, items)` (congela nombre/`precio_compra`/`precio_unitario`; `producto_id` NULL en personalizados; valida `cantidad ≤ stock` en ítems de catálogo), `listar(filtro {entregado?, pagado?}?)`, `cambiarEntregado`, `cambiarPagado`, `eliminar`, `unidadesPagadasPorProducto(desde, hasta)` (solo `entregado = 1 AND pagado = 1`)
- [X] T038 [US3] Crear `portal/src/server/services/pedidos.ts` con Server Actions: `crearPedido` (cliente obligatorio, ≥ 1 ítem, transacción), `cambiarEntregado` (primera vez: transacción que descuenta stock de ítems de catálogo y pone `stock_descontado = 1`; desmarcar permitido sin reponer stock, devolviendo aviso de corrección manual — CL2; re-marcar no descuenta), `cambiarPagado`, `eliminarPedido` (solo `entregado = 0`, bloqueado con mensaje si entregado — CL12); logs + `revalidatePath`
- [X] T039 [P] [US3] Crear lista `portal/src/app/(main)/dashboard/pedidos/page.tsx` + `_components/` (badges de estado entregado/pendiente y pagado/pago pendiente, toggles con aviso de corrección manual al desmarcar entregado, eliminar solo pendientes con confirmación, mensaje de sección vacía)
- [X] T040 [US3] Crear `portal/src/app/(main)/dashboard/pedidos/nuevo/page.tsx` + `_components/` (nombre de cliente obligatorio, contacto opcional, agregar ítems de catálogo con cantidad o ítems personalizados de texto libre, total calculado en pantalla)

**Checkpoint**: User Stories 1–3 verificables de forma independiente (V1–V4 de quickstart.md)

---

## Phase 6: User Story 4 - Preparar el próximo pedido al proveedor (Priority: P2)

**Goal**: Marcar productos "para próximo pedido" con nota libre, verlos listados, editar la nota y desmarcarlos; la lista alimenta la inversión pendiente de reportes

**Independent Test**: Quickstart V5: marcar un producto con nota → aparece en la lista de marcados e Inversión Pendiente refleja `stock_minimo × precio_compra`; editar nota o desmarcar → la lista y el indicador se actualizan de inmediato

### Implementación for User Story 4

- [X] T041 [US4] Crear la lista de marcados "para próximo pedido" dentro de la sección Pedidos en `portal/src/app/(main)/dashboard/pedidos/_components/` (pestaña o bloque): productos con `pedir_al_proveedor = 1` via `listarPedidoProveedor()`, mostrando nota editable y acción de desmarcar (reutiliza `marcarPedidoProveedor` de `services/productos.ts`); mensaje de sección vacía
- [X] T042 [US4] Agregar Server Action de edición de nota del marcado a proveedor en `portal/src/server/services/productos.ts` (`marcarPedidoProveedor(id, pedir, nota)` ya acepta nota; exponer edición con `revalidatePath` de pedidos y reportes)

**Checkpoint**: La lista de marcados funciona de forma independiente; el control en el detalle (T028) ya existe

---

## Phase 7: User Story 5 - Alertas de vencimientos y agotados (Priority: P2)

**Goal**: Pantalla de alertas con vencimientos ordenados del más próximo al más lejano con semáforo de colores y agotados (stock ≤ 0)

**Independent Test**: Quickstart V6: producto que vence en 12 días (rojo), 45 (naranja), 90 (verde), uno sin fecha (ausente) y uno con stock 0; verificar orden, colores y sección Agotados; "Stock Bajo" en tarjetas (ya cubierto por T024)

### Implementación for User Story 5

- [X] T043 [P] [US5] Crear `portal/src/app/(main)/dashboard/alertas/page.tsx` + `_components/`: sección Vencimientos via `listarVencimientos()` (orden ASC por fecha, tarjeta con color del semáforo de `domain/vencimiento.ts` y días restantes — rojo si pasada — CL8) y sección Agotados via `listarAgotados()` (stock ≤ 0); mensajes de sección vacía por bloque (FR-012); y confirmar el aviso "Stock Bajo" (stock ≤ stock_minimo) en la tarjeta compartida en todas las listas donde aparece (inventario, favoritos, alertas)

**Checkpoint**: Alertas verificable de forma independiente (V6 de quickstart.md; SC-005: 100 % de vencimientos ≤30 días en rojo)

---

## Phase 8: User Story 6 - Favoritos de un clic (Priority: P3)

**Goal**: Marcar/desmarcar favoritos desde tarjeta o detalle, y sección "Mis Favoritos" con los marcados y, debajo, ranking de más vendidos por unidades vendidas

**Independent Test**: Quickstart V7: marcar dos favoritos (uno desde tarjeta, otro desde detalle) → ambos en la sección; desmarcar → salen; con ventas registradas → ranking por unidades debajo; sin ventas → mensaje de sección vacía

### Implementación for User Story 6

- [X] T045 [US6] Crear `portal/src/app/(main)/dashboard/favoritos/page.tsx` + `_components/`: lista de productos con `es_favorito = 1` (reutiliza tarjeta compartida) y debajo el ranking de más vendidos por unidades vendidas unificando `ventaRepo.unidadesPorProducto` + `pedidoRepo.unidadesPagadasPorProducto` (mismo criterio de rotación de reportes — FR-004); mensajes de sección vacía en ambos bloques
- [X] T046 [US6] Agregar Server Action `marcarFavorito(id, es)` en `portal/src/server/services/productos.ts` (repo ya soporta el flag) y cablear el corazón de la tarjeta compartida y del detalle a la acción con `revalidatePath`

**Checkpoint**: Favoritos verificable de forma independiente (V7 de quickstart.md)

---

## Phase 9: User Story 7 - Reportes financieros del periodo (Priority: P3)

**Goal**: Reportes mensual/anual navegables con ganancia bruta, ganancia neta, capital en stock, inversión pendiente y ranking de rotación unificado; exportar el periodo visible a `.txt`

**Independent Test**: Quickstart V8: con ventas y pedidos entregados+pagados del mes, cada indicador coincide exactamente con el cálculo manual (SC-004, tolerancia 0); navegar mes anterior/siguiente y modo anual; exportar descarga `.txt` per contracts/report-format.md; periodo vacío → indicadores en 0 y mensaje

### Tests for User Story 7 (dominio, escribir primero — deben FALLAR)

- [X] T047 [P] [US7] Crear tests `portal/src/lib/domain/reportes.test.ts`: bruta = Σ totales de ventas + pedidos `entregado AND pagado` del periodo; neta = Σ `cantidad × (precio_venta − precio_compra)` congelados; capital = Σ `stock × precio_compra`; inversión pendiente = Σ `stock_minimo × precio_compra` de marcados; rotación unificada descendente; periodo vacío → ceros
- [X] T048 [P] [US7] Crear tests `portal/src/lib/domain/reporte-txt.test.ts` contra el formato exacto de contracts/report-format.md (encabezado, periodo mensual/anual, resumen financiero en COP, top de rotación, línea "No hay registros en este periodo." cuando aplica)

### Implementación for User Story 7

- [X] T049 [US7] Implementar `portal/src/lib/domain/reportes.ts`: `rangoPeriodo(mes|año, referencia)` (epoch ms, mes natural / 12 meses) y `calcularReporte(ventas, pedidos, productos, marcados)` con las cinco reglas de cálculo hasta pasar T047
- [X] T050 [P] [US7] Implementar `portal/src/lib/domain/reporte-txt.ts`: generador del `.txt` UTF-8 con la estructura exacta del contrato (nombre `reporte-<periodo>.txt`) hasta pasar T048
- [X] T051 [US7] Crear `portal/src/server/services/reportes.ts`: obtiene datos del periodo desde los repositorios (ventas del rango, pedidos `entregado AND pagado` del rango, todos los productos, marcados a proveedor) y llama `calcularReporte`
- [X] T052 [P] [US7] Crear `portal/src/app/api/reportes/export/route.ts`: GET `?periodo=2026-11` o `?periodo=2026&anual=1` descarga el `.txt` generado por `reporte-txt.ts`
- [X] T053 [US7] Crear `portal/src/app/(main)/dashboard/reportes/page.tsx` + `_components/` (toggle mensual/anual, navegación periodo anterior/siguiente, tarjetas de ganancia bruta/neta/capital en stock/inversión pendiente en COP, tabla de rotación descendente, botón exportar `.txt`, estado "no hay registros en este periodo" con indicadores en 0 — CL5)

**Checkpoint**: Reportes verificable de forma independiente (V8 de quickstart.md; SC-004 tolerancia 0)

---

## Phase 10: User Story 8 - Respaldo y seguridad de los datos (Priority: P3)

**Goal**: Exportar todos los datos a un JSON único con fotos en base64 y restaurarlo con confirmación reemplazando todo; archivo inválido informado sin tocar datos; la app se recarga tras restaurar

**Independent Test**: Quickstart V9: exportar → importar en sistema limpio (`data/` borrado) → todo igual incluidas fotos; archivo dañado → error y datos intactos; restaurar con datos existentes → pide confirmación y reemplaza todo sin mezclar

### Tests for User Story 8 (dominio, escribir primero — deben FALLAR)

- [X] T054 [P] [US8] Crear tests `portal/src/lib/domain/respaldo.test.ts` para el esquema Zod del respaldo: `version` entero ≥ 1, todas las claves de `tablas` obligatorias (arreglos posiblemente vacíos), `fotos` cubre todas las `ruta_archivo` de `fotos_producto`, `logs` ausente; un archivo inválido falla la validación (CL3)

### Implementación for User Story 8

- [X] T055 [US8] Implementar `portal/src/lib/domain/respaldo.ts`: esquema Zod `DatosRespaldo` per contracts/backup-format.md (`version`, `exportadoEn`, `tablas` completas, `fotos` ruta→base64) y `validarRespaldo(json)` hasta pasar T054
- [X] T056 [P] [US8] Crear `portal/src/server/repositories/respaldo.ts` (`respaldoRepo`): `exportarTodo()` (volcado de tablas de negocio sin `logs`) y `reemplazarTodo(datos)` (borra tablas de negocio y reinserta ids tal cual — invocado dentro de transacción del servicio)
- [X] T057 [US8] Crear `portal/src/server/services/respaldo.ts`: `exportarRespaldo()` (lee tablas + codifica todas las fotos referenciadas a base64 incluyendo `/seed/images/*` y `/api/fotos/*`, nombre `master-inventory-respaldo-AAAAMMDD.json`) e `importarRespaldo(file)` (valida con Zod ANTES de tocar nada; `version` mayor que la soportada → rechazo; confirmado → transacción `reemplazarTodo` + reescribe `data/fotos/` con los decodificados; resultado informado al usuario; logs de la operación)
- [X] T058 [P] [US8] Crear `portal/src/app/api/respaldo/route.ts`: GET descarga el JSON de respaldo; POST recibe el archivo, invoca `importarRespaldo` y responde éxito/error en español
- [X] T059 [US8] Crear `portal/src/app/(main)/dashboard/respaldo/page.tsx` + `_components/` (botón exportar con descarga, importar con selector de archivo y confirmación explícita "se reemplazará todo", mensajes de resultado; tras éxito el cliente recarga a inventario (equivale al "reinicio" de FR-015 per research D12))

**Checkpoint**: Respaldo verificable de forma independiente (V9 de quickstart.md; SC-006: 100 % de datos recuperados; SC-007)

---

## Phase 11: User Story 9 - Registros internos (logs) (Priority: P3)

**Goal**: Pantalla de logs con fecha, nivel INFO/WARN/ERROR, módulo, mensaje y error opcional; limpieza manual; los > 90 días se limpian solos al iniciar (ya cubierto por T013/T016)

**Independent Test**: Quickstart V10: abrir la pantalla y ver entradas con fecha, nivel, módulo y mensaje; botón de limpieza borra los antiguos; en arranque los > 90 días se limpian sin tocar datos de negocio

### Implementación for User Story 9

- [X] T060 [P] [US9] Crear Server Actions de logs en `portal/src/server/services/logs.ts`: `limpiarLogs()` (llama `logRepo.limpiarAntiguos(ahora - 90 días)` — la spec pide "limpiar los antiguos"; registra la operación, `revalidatePath`)
- [X] T061 [US9] Crear la pantalla de logs dentro de la sección de respaldo/seguridad en `portal/src/app/(main)/dashboard/respaldo/_components/` (o subruta `respaldo/logs/`): tabla/lista de entradas `logRepo.listar()` con fecha, nivel con distinción visual INFO/WARN/ERROR, módulo, mensaje y detalle de excepción; botón limpiar con confirmación; mensaje de sección vacía (FR-016)

**Checkpoint**: Todas las historias verificables de forma independiente (V1–V11 de quickstart.md)

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a múltiples historias

- [X] T062 [P] Ejecutar `node --test src/lib/domain/**/*.test.ts` en `portal/` y confirmar verde toda la lógica pura
- [X] T063 [P] Ejecutar `pnpm check` (Biome) y `pnpm build` en `portal/` y corregir lo que falle
- [X] T064 Auditoría de español Colombia + COP en todas las pantallas, mensajes de error y el `.txt` exportado (constitución II): formato `$ 20.000` via `formatearCOP` sin excepciones
- [X] T065 [P] Auditoría de mensajes de sección vacía en todas las listas (FR-018): inventario sin resultados, ventas, pedidos, marcados, favoritos, ranking, alertas, reportes, logs
- [X] T066 Ejecutar la validación completa de `quickstart.md` (escenarios V1–V11) con `data/` vacío y con datos, documentando cualquier fallo
- [X] T067 Verificar regla "cero dependencias nuevas" en `portal/package.json` y que `plantilla/` no fue modificado (`git status`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — reutiliza `validarCantidad` del dominio; independiente
- **User Story 3 (P2)**: Can start after Foundational — extiende `repositories/pedidos.ts` creado en US1 (T020) y usa reglas de stock; funcionalmente independiente (el candado `stock_descontado` ya está en el esquema)
- **User Story 4 (P2)**: Can start after US1 (el control de marcado y `marcarPedidoProveedor` viven en el detalle/servicio de producto); su indicador de inversión se visualiza en US7
- **User Story 5 (P2)**: Can start after Foundational — solo lee `productos`; independiente
- **User Story 6 (P3)**: Can start after US1 — el ranking de más vendidos unifica ventas (US2) y pedidos pagados (US3); funciona con los orígenes ya implementados
- **User Story 7 (P3)**: Can start after US2 + US3 + US4 (necesita sus fuentes de datos para los cálculos); es el consumidor de todos los indicadores
- **User Story 8 (P3)**: Can start after Foundational — cubre todas las tablas ya creadas en el esquema; independiente de las UIs
- **User Story 9 (P3)**: Can start after Foundational — la auto-limpieza >90d ya quedó en `ejecutarInit`; solo agrega UI y acción manual

### Within Each User Story

- Tests de dominio (si aplica) MUST be written and FAIL before implementation
- Modelos/repositorios antes que servicios
- Servicios antes que pantallas
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002–T005)
- All Foundational tasks marked [P] can run in parallel (tests T006–T008, dominio T010–T012, repos T014–T015)
- Once Foundational completes: US1, US2, US5 pueden avanzar en paralelo (US2 reutiliza reglas de stock ya escritas)
- Repos `productos` (T018), `fotos` (T019), `pedidos` parcial (T020), seed (T021) y route de fotos (T022) en paralelo dentro de US1
- Pantallas de una misma historia marcadas [P] (form nuevo vs. lista vs. detalle) en paralelo

---

## Parallel Example: User Story 1

```bash
# Lanzar en paralelo los repositorios y artefactos sin dependencias entre sí:
Task: "Crear portal/src/server/repositories/productos.ts (productoRepo completo)"
Task: "Crear portal/src/server/repositories/fotos.ts (fotoRepo)"
Task: "Crear portal/src/server/repositories/pedidos.ts con retirarItemsDeProducto"
Task: "Crear portal/src/server/services/seed.ts (carga del catálogo)"
Task: "Crear portal/src/app/api/fotos/[name]/route.ts"

# Luego el servicio (depende de los repos):
Task: "Crear portal/src/server/services/productos.ts (Server Actions + CL7)"

# Finalmente las pantallas en paralelo:
Task: "Lista de inventario en dashboard/inventario/page.tsx"
Task: "Formulario nuevo producto en dashboard/inventario/nuevo/page.tsx"
Task: "Detalle de producto en dashboard/inventario/[id]/page.tsx"
```

## Parallel Example: User Story 7

```bash
# Tests primero (en paralelo):
Task: "Tests de reportes.test.ts (cálculos SC-004)"
Task: "Tests de reporte-txt.test.ts (formato del contrato)"

# Dominio en paralelo:
Task: "Implementar domain/reportes.ts"
Task: "Implementar domain/reporte-txt.ts"

# Luego servicio, route de export y pantalla.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: ejecutar V1+V2 de quickstart.md (catálogo cargado + CRUD + búsqueda/filtros + fotos + stock)
5. Deploy/demo if ready — el inventario deja de estar en papel

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → V1+V2 → Deploy/Demo (MVP!)
3. Add User Story 2 → V3 → Deploy/Demo (ventas con stock y precios congelados)
4. Add User Story 3 → V4 → Deploy/Demo (pedidos)
5. Add US4/US5 → V5+V6 → Deploy/Demo
6. Add US6–US9 → V7–V11 → cada una agrega valor sin romper las anteriores

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 → User Story 4
   - Developer B: User Story 2 → User Story 3 → User Story 7
   - Developer C: User Story 5 → User Story 6 → User Stories 8/9
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable via quickstart.md
- Verify domain tests fail before implementing each módulo puro
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- `repositories/pedidos.ts` se crea en US1 (T020, solo `retirarItemsDeProducto` para CL7) y se EXTIENDE en US3 (T037) — único archivo compartido entre historias; coordinar si se trabaja en paralelo
