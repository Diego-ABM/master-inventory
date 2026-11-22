# Research — Estabilidad, pedido rápido y experiencia de uso

Fecha: 2026-11-16 · Feature: `002-ux-quick-order`

Todas las decisiones se tomaron inspeccionando el código real en `portal/` y la
documentación local de Next 16 (`node_modules/next/dist/docs/`). No quedan
"NEEDS CLARIFICATION": la spec ya resolvió modelo de acceso, duración de sesión,
formatos de foto y estrategia responsive.

## 1. Causa raíz de la caída al cargar fotos

**Hallazgo**: `agregarFoto(productoId, formData)` es una Server Action que recibe
el archivo crudo del navegador (`src/server/services/productos.ts`). Las Server
Actions tienen un límite de cuerpo de **1 MB por defecto** (docs de Next:
"Action requests are capped at 1MB by default"). Una foto de celular de 5–15 MB
supera el tope y la acción falla antes de llegar a la validación de extensión.

**Decisión**: comprimir en el dispositivo antes de subir.

- `src/lib/imagen.ts` (solo cliente): `createImageBitmap`/`Image` + `<canvas>` →
  redimensión a 1600 px de lado máximo → `canvas.toBlob("image/webp", 0.8)` →
  `File` nuevo (`.webp`). Una foto de 10–15 MB termina en unos cientos de KB.
- Se aplica en los dos puntos de carga existentes: `galeria-fotos.tsx`
  (detalle de producto) y `formulario-producto.tsx` (alta de producto).
- `experimental.serverActions.bodySizeLimit: "4mb"` en `next.config.mjs` como
  margen de seguridad, no como mecanismo principal.
- Validación en servidor intacta: extensión + mime permitidos
  (png/jpg/jpeg/webp). Si el navegador no puede decodificar el archivo
  (corrupto) o el formato no está admitido (HEIC), se muestra el mensaje en
  español de FR-002 y nada se guarda.
- Servido ya cumple FR-020: `GET /api/fotos/[name]` devuelve
  `Cache-Control: public, max-age=31536000, immutable`.

**Alternativas consideradas**:

- *Solo subir el límite del body*: rechazada — uploads de 15 MB siguen siendo
  pesados, inflan la columna BYTEA y empeoran respaldo/exportación.
- *Redimensionar en servidor con `sharp`*: rechazada — dependencia nativa nueva
  (prohibido por regla del proyecto) y la spec fijó compresión en dispositivo.
- *Subir por route handler `/api/fotos` en vez de Server Action*: rechazada —
  más código para el mismo resultado; igual hace falta comprimir.

## 2. Nombre (no código) en ítems de pedido

**Hallazgo**: `nombre_producto` se persiste por ítem y todas las vistas lo
muestran (`tarjeta-pedido`, `formulario-pedido`, listado de ventas). El hueco
real: para ítems de catálogo el cliente envía `nombre_producto` en el payload de
`crearPedido`, y aunque el servicio lo reemplaza por `producto.nombre`, la
etiqueta mostrada depende de datos del cliente y no incluye datos de variante —
dos productos con el mismo nombre quedan indistinguibles (FR-005), y un nombre
vacío/identificador no tiene respaldo legible (edge case de la spec).

**Decisión**: la etiqueta del ítem se construye **en el servidor** con una
función de dominio pura y testeable:

```ts
// src/lib/domain/pedidos.ts
etiquetaItemProducto(producto: Producto): string
```

- Base: `producto.nombre` (o `"Producto sin nombre"` si viniera vacío).
- Desambiguador, en orden: `variante`, `peso_kg` (p. ej. "2 kg"), `mascota`
  distinta de UNISEX → se anteponen entre paréntesis o con " — " solo si hay
  datos (nunca el `id` ni códigos internos).
- El servicio de pedidos guarda esa etiqueta en `nombre_producto`; las vistas
  siguen mostrando el campo tal cual, con el mismo texto de respaldo si viniera
  vacío. No hace falta cambio de esquema ni migración de datos.

**Alternativas consideradas**:

- *Columna nueva `etiqueta_item` o join en cada lectura*: rechazada —
  `nombre_producto` ya existe y es el lugar natural del snapshot del nombre.
- *Resolver la etiqueta en el cliente*: rechazada — es justo el acoplamiento
  que permite que identificadores internos lleguen a la vista.

## 3. Botón flotante "+" de pedido rápido

**Decisión**: `fab-pedido.tsx`, Client Component montado en
`(main)/dashboard/layout.tsx`.

- `Link` a `/dashboard/pedidos/nuevo` (un toque desde cualquier pantalla,
  FR-007) con icono `Plus` de lucide-react y etiqueta accesible "Nuevo pedido".
- `fixed` abajo a la derecha por encima de la barra inferior (z-index mayor),
  tamaño ≥ 48 px para el pulgar (FR-008); no oculta contenido esencial: el
  `main` ya tiene `pb-20` de respiro y el botón ocupa la esquina libre.
- Se oculta en `/dashboard/pedidos/nuevo` (ya se está registrando un pedido)
  leyendo `usePathname()`. En `/acceso` no aplica porque esa ruta queda fuera
  del layout del dashboard.

**Alternativas consideradas**: menú FAB expandible (más acciones) — rechazado,
la spec pide un acceso directo único, sin rodeos.

## 4. Login con clave única + sesión de 30 días

**Decisión**:

- **Variable de entorno `CLAVE_ACCESO`** (documentada en `.env.example`). Sin
  pantalla de configuración (FR-011). Si falta la variable, el acceso se
  rechaza con mensaje claro ("el acceso no está configurado") — falla cerrada,
  nunca abierta.
- **`src/proxy.ts`**: convención de Next 16 (`middleware.ts` está deprecado y
  renombrado a `proxy`). Verifica la cookie en cada request y redirige a
  `/acceso` si falta o no coincide. El `matcher` excluye `_next/static`,
  `_next/image`, `icon`, `apple-icon` y la propia `/acceso`; todo lo demás —
  páginas, Server Actions (POST a la ruta), `/api/fotos`, `/api/respaldo`,
  `/api/reportes/export` — queda protegido ("sin clave no se ve ni modifica
  nada", escenario 1 de US-5).
- **Cookie `mi_sesion`**: `httpOnly`, `sameSite: "lax"`, `secure` en producción,
  `max-age` = 30 días (FR-014). Valor = `sha256("sesion:" + CLAVE_ACCESO)` en
  hex, calculado con **Web Crypto** (`crypto.subtle`), disponible tanto en el
  runtime de proxy como en Node — no requiere tabla ni estado en servidor, y
  cambiar la clave invalida todas las sesiones. Helper puro en
  `src/lib/sesion.ts`.
- **Server actions** `entrar(clave)` / `salir()` en
  `src/server/services/acceso.ts`: comparación del hash en tiempo casi
  constante, set/borrado de cookie, `redirect("/dashboard")` al entrar.
- **Página `/acceso`**: fuera del grupo `(main)` (sin shell de dashboard),
  formulario mínimo con la clave, mensaje de error genérico sin revelar datos.
- **"Salir"**: `boton-salir.tsx` en el header junto a `ThemeSwitcher`; borra la
  cookie y redirige a `/acceso`.
- **Redirect raíz**: `(external)/page.tsx` hoy apunta a `/dashboard/default`
  (ruta inexistente → `[...not-found]`); se corrige a `/dashboard`, y el proxy
  lleva a `/acceso` cuando no hay sesión.

**Alternativas consideradas**:

- *Token aleatorio persistido en tabla `meta`*: rechazada — exige DB dentro del
  proxy (no hay `postgres.js` en ese runtime) y agrega estado innecesario.
- *Sesión JWT con librería*: rechazada — dependencia nueva prohibida.
- *Gate por layout en vez de proxy*: rechazada — los layouts no interceptan
  Server Actions ni route handlers; dejaría las mutaciones abiertas.

## 5. Panel principal (`/dashboard`)

**Decisión**: `dashboard/page.tsx` pasa de `redirect("/dashboard/inventario")`
a un panel server-side que reusa los repositorios existentes — sin queries
nuevas:

- Ventas del día: `ventaRepo.listar({ desde, hasta })` con el rango del día y
  `formatearCOP` para el total.
- Pedidos pendientes: `pedidoRepo.listar({ entregado: false })` → conteo.
- Alertas de stock: `productoRepo.listarAgotados()` +
  `listarVencimientos()` → conteos con enlaces a `/dashboard/alertas`.
- Accesos rápidos (FR-013): botones a Nuevo pedido, Nueva venta, Inventario,
  Pedidos.
- `next.config.mjs` conserva el redirect `/dashboard → /dashboard/inventario`
  solo si el panel vive en `/dashboard/panel`; **decisión tomada**: el panel es
  la propia `/dashboard` (raíz del área), así que ese redirect se retira y la
  entrada post-login cae directo al panel.
- Navegación: se agrega "Panel" como primera sección en `sidebar-items.ts` y en
  la `SECCIONES` de la navegación.

## 6. Una sola interfaz adaptable (PC y móvil)

**Decisión**: conservar la navegación inferior en pantallas angostas y mostrar
navegación horizontal dentro del header en pantallas anchas (`lg:`), compartiendo
el mismo arreglo de secciones — un solo código, dos presentaciones (FR-009).
El contenido ya se centra con `max-w-screen-2xl` y las rejillas ya usan
`sm:`/`lg:`; el trabajo es de auditoría pantalla por pantalla (360 px →
1920 px, sin scroll horizontal) más que de reescritura.

**Alternativas consideradas**: activar el sidebar completo de la plantilla
(`src/components/ui/sidebar.tsx`) en desktop — rechazada: más superficie de
código para el mismo requisito; se deja anotado como opción futura.

## 7. Consistencia visual y español

**Decisión**: solo tokens semánticos y la animación ya disponible
(`tw-animate-css`); el feedback ya existe vía `toast` en todas las acciones —
se completa donde falte (estados `disabled`/`pending` de botones). Se corrigen
textos en inglés que violan el principio II: `lang="en"` → `es` en el root
layout, y los strings del `SearchDialog` ("Search", "No results found.",
placeholders). No se introduce sistema de diseño paralelo.
