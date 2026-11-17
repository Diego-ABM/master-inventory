---

description: "Task list for feature implementation"
---

# Tasks: Estabilidad, pedido rápido y experiencia de uso

**Input**: Design documents from `/specs/002-ux-quick-order/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Solo se incluyen tests para `etiquetaItemProducto` (dominio puro), porque `plan.md` los prevé explícitamente y el proyecto testea `src/lib/domain/*.test.ts` con `node --test`. El resto se verifica manualmente con `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Todo el código vive dentro de `Portal/` (proyecto único Next.js 16). Las rutas de las tareas son relativas a `Portal/` salvo que se indique lo contrario.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparación mínima del entorno; sin este paso la verificación manual posterior fallaría una vez que exista el gate de acceso.

- [X] T001 Documentar la variable `CLAVE_ACCESO` en `Portal/.env.example` (comentario en español explicando que es la clave única del negocio, requerida, y que se define también en las variables del proyecto en Vercel) y agregarla al `.env.local` local con un valor de prueba.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pieza compartida que consumen la navegación de US4, el panel de US5 y la barra inferior existente.

**⚠️ CRITICAL**: Bloquea US4 y US5 (consumen `secciones.ts`). US1, US2 y US3 no dependen de esta fase y pueden empezar de inmediato.

- [X] T002 Extraer el arreglo de secciones (href, etiqueta, icono) de `Portal/src/app/(main)/dashboard/_components/bottom-nav/bottom-nav.tsx` a un módulo compartido `Portal/src/app/(main)/dashboard/_components/secciones.ts` y actualizar `bottom-nav.tsx` para importarlo (sin cambiar secciones ni estilos todavía; el enlace a Respaldo se queda como está).

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Subir fotos de productos sin que se caiga el servicio (Priority: P1) 🎯 MVP

**Goal**: La foto se comprime en el dispositivo (WebP, ≤1600px, calidad ~0.8) antes de subir, el servidor valida y nunca tumba el servicio; formatos no admitidos o archivos corruptos reciben mensaje claro en español.

**Independent Test**: Crear/editar un producto, cargar una foto JPG de celular de 5–15 MB y verificar que se guarda y la app sigue operativa; cargar un `.heic` o un archivo corrupto y verificar que solo aparece el mensaje de error. Repetir 10–20 cargas sin caída (quickstart Escenario 1).

### Implementation for User Story 1

- [X] T003 [US1] Crear `Portal/src/lib/imagen.ts` (solo cliente) con `comprimirFoto(archivo: File): Promise<File>`: decodifica con `createImageBitmap`/`Image` + `<canvas>`, redimensiona a 1600 px de lado máximo, exporta `canvas.toBlob("image/webp", 0.8)` y devuelve un `File` `.webp`; si el tipo no es `image/png`/`image/jpeg`/`image/webp` rechaza con "Formato de imagen no admitido. Usa JPG, PNG o WebP." y si el archivo no se puede decodificar rechaza con "No se pudo leer la imagen; el archivo parece estar dañado." (contrato `contracts/fotos.md`; nunca se rechaza por peso del original, FR-019).
- [X] T004 [P] [US1] Agregar `experimental: { serverActions: { bodySizeLimit: "4mb" } }` en `Portal/next.config.mjs` como margen sobre el tope de 1 MB de las Server Actions.
- [X] T005 [P] [US1] Integrar `comprimirFoto` en `Portal/src/app/(main)/dashboard/inventario/[id]/_components/galeria-fotos.tsx`: comprimir el `File` antes de armar el `FormData` de `agregarFoto`; si `comprimirFoto` rechaza, mostrar su mensaje vía toast y no llamar a la acción.
- [X] T006 [P] [US1] Integrar `comprimirFoto` en `Portal/src/app/(main)/dashboard/inventario/_components/formulario-producto.tsx`: comprimir cada `File` del estado `fotos` al seleccionarlo/antes de subirlo, con el mismo manejo de error vía toast.
- [X] T007 [P] [US1] Endurecer `agregarFoto` en `Portal/src/server/services/productos.ts` según `contracts/fotos.md`: `foto` ausente → "No se recibió ningún archivo."; extensión fuera de `.png/.jpg/.jpeg/.webp` → "Solo se permiten imágenes png, jpg, jpeg o webp."; máximo alcanzado → "El producto ya tiene el máximo de 5 fotos."; cualquier otra falla → "No se pudo agregar la foto." + log ERROR. Nunca propagar excepción al cliente (FR-001, FR-002).

**Checkpoint**: User Story 1 funcional — cargas de fotos estables y verificable de forma independiente

---

## Phase 4: User Story 2 - Registrar un pedido en un toque desde cualquier parte (Priority: P1)

**Goal**: Botón flotante "+" visible en todas las pantallas del dashboard que lleva directo a `/dashboard/pedidos/nuevo` en un solo toque.

**Independent Test**: Abrir la app en Inventario, tocar el FAB "+" y llegar directo al formulario de nuevo pedido; registrar un pedido de 3 ítems en menos de 60 segundos; repetir desde Pedidos y el Panel (quickstart Escenario 2).

### Implementation for User Story 2

- [X] T008 [US2] Crear `Portal/src/app/(main)/dashboard/_components/fab-pedido.tsx` (Client Component): `Link` a `/dashboard/pedidos/nuevo` con icono `Plus` de lucide-react, `aria-label="Nuevo pedido"`, posición `fixed` esquina inferior derecha por encima de la barra inferior, objetivo táctil ≥ 48 px, tokens `bg-primary`/`text-primary-foreground`; se oculta cuando `usePathname()` es `/dashboard/pedidos/nuevo` (contrato `contracts/interfaz.md`).
- [X] T009 [US2] Montar `<FabPedido />` dentro del layout en `Portal/src/app/(main)/dashboard/layout.tsx` (después de `<BottomNav />`), de modo que aparezca en todas las pantallas del dashboard.

**Checkpoint**: User Story 2 funcional — un pedido se inicia con un toque desde cualquier pantalla

---

## Phase 5: User Story 3 - Ver el nombre del producto en el pedido, no el código (Priority: P2)

**Goal**: La etiqueta del ítem se construye en el servidor con `etiquetaItemProducto(producto)` = nombre + desambiguador (variante → peso_kg → mascota ≠ UNISEX); nunca `id` ni códigos internos; nombre vacío cae a "Producto sin nombre".

**Independent Test**: Crear un pedido con productos del catálogo y verificar que cada ítem muestra el nombre; crear dos productos con el mismo nombre y distinta variante y verificar que los ítems los distinguen (quickstart Escenario 3).

### Tests for User Story 3 (solicitados por plan.md para lógica de dominio) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [US3] Agregar tests de `etiquetaItemProducto` en `Portal/src/lib/domain/pedidos.test.ts` cubriendo la tabla de `contracts/interfaz.md`: nombre+variante → `"Comida gato — Pollo 500g"`; peso sin variante → `"Comida gato — 2 kg"`; mascota ≠ UNISEX sin variante/peso → `"Comida gato — Gato"`; solo nombre → `"Comida gato"`; nombre vacío → `"Producto sin nombre"`.

### Implementation for User Story 3

- [X] T011 [US3] Implementar `etiquetaItemProducto(producto: Producto): string` en `Portal/src/lib/domain/pedidos.ts`: base `producto.nombre` (o `"Producto sin nombre"` si vacío) + desambiguador en orden `variante` → `peso_kg` (p. ej. "2 kg") → `mascota` distinta de UNISEX, solo con datos presentes; nunca `id` ni códigos internos (FR-004, FR-005). Hacer pasar los tests de T010.
- [X] T012 [US3] En `Portal/src/server/services/pedidos.ts`, al crear ítems de catálogo en `crearPedido`, guardar `nombre_producto = etiquetaItemProducto(producto)` en lugar de `producto.nombre` directo; los ítems personalizados (`producto_id = null`) conservan el texto libre del usuario.
- [X] T013 [US3] Asegurar en las vistas de ítems (`Portal/src/app/(main)/dashboard/pedidos/_components/tarjeta-pedido.tsx` y `Portal/src/app/(main)/dashboard/pedidos/nuevo/_components/formulario-pedido.tsx`) que cuando `nombre_producto` venga vacío se muestre "Producto sin nombre" como respaldo — agregar el respaldo si falta — y que ningún identificador interno aparezca como dato principal.

**Checkpoint**: User Stories 1–3 funcionales — los pedidos se leen con nombres, sin ambigüedad

---

## Phase 6: User Story 4 - Usar la app cómodamente en celular y en computador (Priority: P2)

**Goal**: Una sola UI adaptable: barra inferior en pantallas angostas, navegación horizontal en el header en pantallas anchas (≥ `lg`), cero scroll horizontal entre 360 px y 1920 px.

**Independent Test**: En DevTools a ~360 px recorrer Panel, Inventario, Pedidos, Ventas, Alertas (barra inferior, legible, sin scroll horizontal); a ~1920 px las mismas pantallas con navegación en el header y contenido que aprovecha el ancho; completar el registro de un pedido en ambos tamaños (quickstart Escenario 4).

### Implementation for User Story 4

- [X] T014 [P] [US4] Crear `Portal/src/app/(main)/dashboard/_components/nav-header.tsx` (Client Component): navegación horizontal con las mismas secciones de `secciones.ts`, estado activo por `usePathname`, visible solo en `lg:` (`hidden lg:flex`), textos en español.
- [X] T015 [P] [US4] Actualizar `Portal/src/app/(main)/dashboard/_components/bottom-nav/bottom-nav.tsx` para agregar la clase `lg:hidden` al `<nav>` (queda oculto en pantallas anchas donde gobierna `nav-header`).
- [X] T016 [US4] En `Portal/src/app/(main)/dashboard/layout.tsx`, montar `<NavHeader />` dentro del header (junto al nombre de la app, antes de los controles) y ajustar el `pb-20` del `<main>` para que solo aplique cuando la barra inferior es visible (`pb-20 lg:pb-6`).
- [X] T017 [US4] Auditoría responsive 360 px → 1920 px de las pantallas principales (`inventario`, `pedidos`, `pedidos/nuevo`, `ventas`, `ventas/nueva`, `alertas`, `favoritos`, `reportes`, `respaldo` bajo `Portal/src/app/(main)/dashboard/`): corregir cualquier scroll horizontal, rejillas que no aprovechen el ancho o controles inalcanzables, solo dentro de los archivos de cada pantalla. Sospechosos conocidos a revisar primero: tablas/listados de `ventas` y `pedidos`, `tarjeta-producto.tsx`, y los gráficos de recharts en `reportes` (FR-009, FR-010, SC-004).

**Checkpoint**: User Story 4 funcional — la app es usable de punta a punta en celular y computador

---

## Phase 7: User Story 5 - Entrar con login y aterrizar en un panel principal (Priority: P3)

**Goal**: Gate de acceso con clave única del negocio (`CLAVE_ACCESO`), sesión de 30 días vía cookie firmada por hash, opción "Salir", y panel principal con resumen del día y accesos rápidos.

**Independent Test**: En incógnito, abrir la app y verificar que aparece la pantalla de acceso y que una URL directa (`/dashboard/pedidos`, `/api/fotos/...`) también se bloquea; clave incorrecta → mensaje genérico; clave correcta → panel con ventas del día, pedidos pendientes, alertas y accesos rápidos; "Salir" exige clave de nuevo (quickstart Escenario 5).

### Implementation for User Story 5

- [X] T018 [US5] Crear `Portal/src/lib/sesion.ts`: `tokenSesion()` que devuelve el hex de `sha256("sesion:" + process.env.CLAVE_ACCESO)` usando Web Crypto (`crypto.subtle`, disponible en proxy y Node) y `verificarTokenSesion(valor: string)` que compara en tiempo casi constante; si `CLAVE_ACCESO` no está definida, la verificación siempre falla (falla cerrada).
- [X] T019 [US5] Crear `Portal/src/proxy.ts` (convención de Next 16, NO `middleware.ts`): verifica la cookie `mi_sesion` en cada request; sin cookie válida → redirect a `/acceso` (aplica también a Server Actions y `/api/*`); con cookie válida y request a `/acceso` → redirect a `/dashboard`. `matcher` excluye `/acceso`, `/_next/*`, `/icon`, `/apple-icon`, `favicon.ico` (contrato `contracts/acceso.md`).
- [X] T020 [P] [US5] Crear `Portal/src/server/services/acceso.ts` con server actions `entrar(clave)` y `salir()` según `contracts/acceso.md`: `CLAVE_ACCESO` indefinida → `{ ok: false, mensaje: "El acceso no está configurado. Define la clave del negocio en el servidor." }`; clave incorrecta → `{ ok: false, mensaje: "La clave no es correcta." }` + log WARN; correcta → setea cookie `mi_sesion` (`httpOnly`, `sameSite: "lax"`, `secure` en producción, `path: "/"`, `max-age: 2592000`) y `redirect("/dashboard")` + log INFO. `salir()` borra la cookie (`max-age=0`) y `redirect("/acceso")`.
- [X] T021 [US5] Exportar `entrar` y `salir` en `Portal/src/server/server-actions.ts` siguiendo el patrón de re-exportación existente.
- [X] T022 [P] [US5] Crear `Portal/src/app/acceso/page.tsx` (fuera del grupo `(main)`, sin header/bottom-nav/FAB) y `Portal/src/app/acceso/_components/formulario-acceso.tsx` (Client Component): campo de clave `type="password"`, botón "Entrar" con estado `pending`, muestra el `mensaje` del resultado de `entrar`; todo el texto en español de Colombia.
- [X] T023 [P] [US5] Crear `Portal/src/app/(main)/dashboard/_components/boton-salir.tsx` (Client Component, llama a `salir()`) y montarlo en el header de `Portal/src/app/(main)/dashboard/layout.tsx` junto a `ThemeSwitcher`.
- [X] T024 [P] [US5] Convertir `Portal/src/app/(main)/dashboard/page.tsx` en panel Server Component (reemplaza el `redirect` actual): ventas del día con `ventaRepo.listar({ desde, hasta })` del día y `formatearCOP` para el total; pedidos pendientes con `pedidoRepo.listar({ entregado: false })`; alertas con `productoRepo.listarAgotados()` + `listarVencimientos()` (conteos con enlace a `/dashboard/alertas`); accesos rápidos a Nuevo pedido, Nueva venta, Inventario y Pedidos (contrato `contracts/interfaz.md`, FR-012, FR-013).
- [X] T025 [US5] Retirar el redirect `/dashboard → /dashboard/inventario` de `Portal/next.config.mjs` y corregir `Portal/src/app/(external)/page.tsx` para que haga `redirect("/dashboard")` en lugar de la ruta inexistente `/dashboard/default`.
- [X] T026 [P] [US5] Agregar "Panel" como primera sección en `Portal/src/navigation/sidebar/sidebar-items.ts` con icono `LayoutDashboard` de lucide-react, y como primera entrada de `SECCIONES` en `Portal/src/app/(main)/dashboard/_components/secciones.ts` apuntando a `/dashboard`.

**Checkpoint**: User Story 5 funcional — acceso protegido y panorama del negocio al entrar

---

## Phase 8: User Story 6 - Una interfaz más vistosa y flujos que no marean (Priority: P3)

**Goal**: Corrección de textos en inglés que violan el principio II, feedback visible en toda acción y flujos frecuentes en 3 pantallas o menos — todo dentro de la plantilla existente.

**Independent Test**: Recorrer las pantallas verificando consistencia visual y textos en español; guardar/tocar acciones y confirmar feedback inmediato (botón `disabled`/`pending` + toast); ejecutar registrar pedido, registrar venta y crear producto contando pantallas (quickstart Escenario 6).

### Implementation for User Story 6

- [X] T027 [P] [US6] Cambiar `lang="en"` a `lang="es"` en `Portal/src/app/layout.tsx`.
- [X] T028 [P] [US6] Traducir a español de Colombia los strings en inglés de `Portal/src/app/(main)/dashboard/_components/header/search-dialog.tsx` ("Search" → "Buscar", placeholder, "No results found." → "Sin resultados." y cualquier otro texto visible en inglés).
- [X] T029 [US6] Verificar y completar el feedback visible (estado `disabled`/`pending` del botón durante la transición + `toast` de éxito/error) en los formularios frecuentes: `Portal/src/app/(main)/dashboard/pedidos/nuevo/_components/formulario-pedido.tsx`, `Portal/src/app/(main)/dashboard/ventas/nueva/_components/formulario-venta.tsx` y `Portal/src/app/(main)/dashboard/inventario/_components/formulario-producto.tsx` (FR-016).
- [X] T030 [US6] Verificar que registrar pedido, registrar venta y crear producto se completan en 3 pantallas o menos desde su punto de entrada (FR-017); ajustar solo el flujo que exceda el límite. En el mismo recorrido, verificar la consistencia de paleta y estilo entre pantallas (FR-015): solo tokens semánticos del tema, sin colores fuera de la plantilla; corregir cualquier componente que use valores arbitrarios.

**Checkpoint**: Todas las historias funcionales — app vistosa, en español y con flujos directos

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verificación transversal antes de cerrar la feature.

- [X] T031 Ejecutar `node --test 'src/lib/domain/*.test.ts'` en `Portal/` — todos los tests pasan (incluye los de `etiquetaItemProducto`).
- [X] T032 Ejecutar `pnpm check` (biome lint+format) y `pnpm build` en `Portal/` — sin errores ni warnings nuevos.
- [X] T033 Recorrer los escenarios 1–6 de `specs/002-ux-quick-order/quickstart.md` en la app corriendo y confirmar cada resultado "Esperado" (incluye 20 cargas de fotos sin caída, pedido < 60 s, sin scroll horizontal 360–1920 px, login/salida).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar de inmediato.
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las historias (T002 extrae `SECCIONES` que consumen US4 y US5).
- **User Stories (Phase 3–8)**: Todas dependen de Foundational; entre sí son independientes y pueden ir en orden de prioridad o en paralelo.
- **Polish (Phase 9)**: Depende de las historias deseadas estando completas.

### User Story Dependencies

- **US1 (P1) Fotos**: Sin dependencias de otras historias.
- **US2 (P1) FAB**: Sin dependencias de otras historias.
- **US3 (P2) Etiqueta de ítem**: Sin dependencias de otras historias.
- **US4 (P2) Responsive**: Depende de T002 (`secciones.ts`); ninguna otra historia.
- **US5 (P3) Login + panel**: Depende de T002 (`secciones.ts`, para agregar "Panel") y conviene que T008/T009 (FAB) ya existan para que el acceso rápido del panel y el FAB convivan; no obstante es testeable por sí sola.
- **US6 (P3) Visual/español**: Independiente; conviene dejarla al final porque toca pantallas de las demás historias.

### Within Each User Story

- US1: `imagen.ts` (T003) antes de las integraciones de cliente (T005, T006); T004 y T007 son independientes.
- US3: test primero (T010, debe fallar) → dominio (T011) → servicio (T012) → vistas (T013).
- US5: helper de sesión (T018) antes del proxy (T019) y las acciones (T020); página y botón tras las acciones; panel (T024) antes de retirar el redirect (T025).

### Parallel Opportunities

- T004, T005, T006 y T007 pueden correr en paralelo una vez listo T003 (archivos distintos).
- T014 y T015 en paralelo (archivos distintos); T016 cierra la integración.
- T020, T022 (formulario de acceso puede crearse contra el contrato), T023 y T024 tocan archivos distintos.
- T027 y T028 en paralelo.

---

## Parallel Example: User Story 1

```bash
# Tras T003 (imagen.ts), lanzar juntas:
Task: "Agregar bodySizeLimit 4mb en Portal/next.config.mjs"
Task: "Integrar comprimirFoto en galeria-fotos.tsx"
Task: "Integrar comprimirFoto en formulario-producto.tsx"
Task: "Endurecer agregarFoto en src/server/services/productos.ts"
```

## Parallel Example: User Story 5

```bash
# Tras T018 (sesion.ts), lanzar juntas:
Task: "Crear src/proxy.ts con el gate de acceso"
Task: "Crear src/server/services/acceso.ts con entrar/salir"

# Tras T021, lanzar juntas:
Task: "Crear página /acceso y formulario-acceso.tsx"
Task: "Crear boton-salir.tsx y montarlo en el header"
Task: "Convertir dashboard/page.tsx en panel Server Component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (fotos estables)
4. **STOP and VALIDATE**: cargar 10–20 fotos sin caída (quickstart Escenario 1)
5. Deploy/demo si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. + US1 (fotos) → estabilidad del catálogo (MVP!)
3. + US2 (FAB) → pedido en un toque
4. + US3 (nombres) → pedidos legibles
5. + US4 (responsive) → usable en PC y celular
6. + US5 (login + panel) → acceso protegido con resumen
7. + US6 (polish) → experiencia consistente

### Parallel Team Strategy

1. Setup + Foundational juntos (son mínimos).
2. Luego en paralelo: US1/US2/US3 independientes; US4 y US5 tras `secciones.ts`; US6 al final para no pisar pantallas ajenas.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (US3)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Todos los textos nuevos en español de Colombia y montos en COP (constitución II); sin dependencias nuevas (regla del proyecto)
