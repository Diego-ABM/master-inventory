# Feature Specification: Estabilidad, pedido rápido y experiencia de uso

**Feature Branch**: `[002-ux-quick-order]`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "En base a los requerimientos crea la especificación para que podamos cubrir todos estos puntos": (1) bug — la app se cae al cargar una foto; (2) bug — al añadir un producto a un pedido aparece el código del producto en lugar del nombre; (3) botón flotante "+" como acceso rápido para registrar pedidos de inmediato, porque los pedidos llegan de improvisto mientras el catálogo se carga con calma; (4) login y dashboard; (5) colores, efectos y mejoras visuales; (6) versión para PC y versión para móvil; (7) flujos más simples e intuitivos.

## Clarifications

### Session 2026-11-16

- Q: ¿Qué modelo de acceso para el login? → A: **Clave única del negocio**: una sola contraseña/PIN compartida; no hay multiusuario ni roles.
- Q: ¿Qué muestra el panel principal? → A: **Resumen + accesos rápidos**: ventas del día, pedidos pendientes, alertas de stock y botones rápidos a las secciones.
- Q: ¿"Versión PC y versión móvil" cómo se logra? → A: **Una sola interfaz adaptable**: la misma app se reorganiza según el tamaño de pantalla; no hay aplicaciones ni diseños separados por dispositivo.
- Q: ¿Cómo se establece la clave única del negocio para entrar a la app? → A: **Variable de entorno**: la clave se fija en configuración al desplegar (Vercel) y en `.env.local` en local; no se crea ni se cambia desde la app.
- Q: ¿Cuánto tiempo dura el acceso una vez ingresada la clave? → A: **Recordar el dispositivo 30 días**: tras entrar no se vuelve a pedir la clave en ese dispositivo; existe una opción "Salir" que cierra sesión.
- Q: ¿Cómo se controla el tamaño de las fotos de producto para que no tumben el servicio? → A: **Compresión en el dispositivo** antes de subir (redimensión a ~1600px, calidad ~80%): una foto de 10–15 MB baja a unos cientos de KB; solo se rechazan archivos corruptos o de formato no admitido. Las fotos servidas quedan en **caché del navegador** vía cabeceras HTTP (sin servicios extra como Redis).
- Q: Si el celular entrega la foto en formato HEIC (por defecto en iPhone), ¿qué debe hacer la app? → A: **Rechazar con mensaje**: solo JPG/PNG/WebP; un HEIC recibe el mensaje claro de formato no admitido (FR-002).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Subir fotos de productos sin que se caiga el servicio (Priority: P1)

Como dueño del negocio, cuando agrego o edito un producto y le cargo una foto, la aplicación guarda la foto y sigue funcionando con normalidad; si la foto no se puede procesar, me avisa con un mensaje claro en vez de caerse.

**Why this priority**: Es un fallo crítico que interrumpe el trabajo: cada carga de foto tira el servicio y obliga a reiniciar. Sin estabilidad no tiene sentido mejorar lo demás.

**Independent Test**: Se puede probar de punta a punta creando un producto, cargándole una foto válida y verificando que la app sigue operativa y la foto queda guardada; y cargando un archivo problemático para verificar que solo aparece un mensaje de error claro. Entrega valor por sí sola: el catálogo con fotos se puede cargar sin miedo a perder el trabajo.

**Acceptance Scenarios**:

1. **Given** un producto en creación o edición, **When** le cargo una foto válida (formato común de celular), **Then** la foto se guarda, se muestra en el producto y el servicio sigue funcionando sin reiniciarse.
2. **Given** el servicio corriendo, **When** cargo 10 fotos seguidas en productos distintos, **Then** el servicio no se cae en ninguna carga.
3. **Given** un archivo que no se puede procesar (formato no admitido o demasiado pesado), **When** intento cargarlo como foto, **Then** veo un mensaje claro en español explicando el problema y el servicio sigue operativo.
4. **Given** una carga de foto que falla por cualquier motivo, **When** vuelvo al inventario, **Then** no se perdió ningún dato del producto ni del catálogo.

---

### User Story 2 - Registrar un pedido en un toque desde cualquier parte (Priority: P1)

Como dueño del negocio, cuando me llega un pedido de improvisto (llamada, cliente en el local), abro la app y toco un botón flotante "+" visible desde las pantallas principales que me lleva directo a registrar el pedido, sin navegar menús.

**Why this priority**: Los pedidos son la operación urgente del día a día: llegan sin aviso y hay que tomarlos rápido. El catálogo se carga con calma y anticipación; el pedido no espera. Hoy hay que ir a Pedidos → Crear pedido, pasos de más cuando el cliente espera.

**Independent Test**: Se puede probar abriendo la app, tocando el botón "+" desde el inventario y desde la lista de pedidos, y completando un pedido de 3 ítems cronometrado. Entrega valor por sí sola: ningún pedido se pierde por lentitud de la app.

**Acceptance Scenarios**:

1. **Given** la app abierta en cualquier pantalla principal (inventario, pedidos, panel), **When** toco el botón flotante "+", **Then** llego directo al formulario de nuevo pedido.
2. **Given** la app recién abierta, **When** miro la pantalla inicial, **Then** el acceso a "nuevo pedido" está a un toque de distancia, visible sin buscar en menús.
3. **Given** un cliente dictando su pedido por teléfono, **When** uso el botón "+" y registro el pedido, **Then** completo el registro sin que el flujo me haga dar rodeos.

---

### User Story 3 - Ver el nombre del producto en el pedido, no el código (Priority: P2)

Como dueño del negocio, cuando añado un producto del catálogo a un pedido, veo el nombre del producto (lo que yo reconozco) en cada ítem del pedido, no un código interno.

**Why this priority**: Es un defecto visible que confunde al operar: el código no le dice nada al dueño ni al cliente. No bloquea el pedido, pero genera desconfianza y errores de lectura.

**Independent Test**: Se puede probar creando un pedido con productos del catálogo y verificando que cada ítem muestra el nombre del producto. Entrega valor por sí sola: los pedidos se leen y se confirman sin ambigüedad.

**Acceptance Scenarios**:

1. **Given** un pedido nuevo, **When** añado "Comida enlatada para gato" del catálogo, **Then** el ítem del pedido muestra "Comida enlatada para gato" como identificación principal.
2. **Given** un pedido ya creado con varios ítems, **When** abro su detalle, **Then** cada ítem muestra el nombre del producto; el código puede aparecer solo como dato secundario o no aparecer.
3. **Given** dos productos con el mismo nombre pero distinta variante, **When** los añado a un pedido, **Then** cada ítem los distingue por sus datos de variante, no por un código interno.

---

### User Story 4 - Usar la app cómodamente en celular y en computador (Priority: P2)

Como dueña del negocio, uso la app desde el celular en el día a día y desde el computador cuando trabajo en el escritorio; en ambos casos las pantallas se adaptan: textos legibles, botones alcanzables y sin scroll horizontal.

**Why this priority**: La operación real es mayormente desde el celular, pero el trabajo de escritorio (cargar catálogo, revisar reportes) se hace más cómodo en PC. Hoy solo existe una experiencia pensada para móvil.

**Independent Test**: Se puede probar abriendo la app en una pantalla de celular (~360px) y en una de computador (~1920px) y ejecutando el flujo completo de registrar un pedido en ambas. Entrega valor por sí sola: la app sirve en el dispositivo que haya a la mano.

**Acceptance Scenarios**:

1. **Given** una pantalla de celular, **When** navego por las pantallas principales, **Then** todo es legible y alcanzable con una mano, sin scroll horizontal.
2. **Given** una pantalla de computador, **When** navego por las mismas pantallas, **Then** el contenido aprovecha el ancho disponible en vez de quedar estirado o apretado en una franja.
3. **Given** el flujo de registrar un pedido, **When** lo ejecuto en celular y en computador, **Then** es igual de completo y cómodo en ambos.

---

### User Story 5 - Entrar con login y aterrizar en un panel principal (Priority: P3)

Como dueño del negocio, la app me pide una clave de acceso al entrar para que nadie más vea mis datos, y después de entrar caigo en un panel principal que me muestra un resumen útil del negocio.

**Why this priority**: El login protege los datos del negocio y el panel da contexto al abrir, pero la urgencia operativa (pedido rápido) y la estabilidad (fotos) van primero.

**Independent Test**: Se puede probar abriendo la app, ingresando la clave y verificando que aparece el panel con el resumen. Entrega valor por sí sola: acceso protegido y panorama del negocio al entrar.

**Acceptance Scenarios**:

1. **Given** la app cerrada, **When** la abro, **Then** primero aparece la pantalla de acceso; sin la clave no se puede ver ni modificar ningún dato.
2. **Given** la clave correcta, **When** la ingreso, **Then** caigo en el panel principal con el resumen del negocio: ventas del día, pedidos pendientes, alertas de stock y botones rápidos a las secciones (incluido "nuevo pedido").
3. **Given** una clave incorrecta, **When** intento entrar, **Then** el acceso se rechaza con un mensaje claro y sin revelar datos.

**Nota de alcance**: la spec anterior (001) excluía explícitamente login y multiusuario. Esta historia introduce login con **clave única del negocio** (una sola clave compartida, sin usuarios ni roles).

---

### User Story 6 - Una interfaz más vistosa y flujos que no marean (Priority: P3)

Como dueño del negocio, la app se ve mejor (paleta de colores consistente, efectos y transiciones suaves, retroalimentación visual al tocar y guardar) y los flujos frecuentes se hacen en menos pasos y de forma más intuitiva.

**Why this priority**: Mejora la confianza y el agrado de usar la app, pero es polish: no bloquea ninguna operación.

**Independent Test**: Se puede probar recorriendo las pantallas principales verificando consistencia visual y ejecutando las tareas frecuentes contando toques. Entrega valor por sí sola: la app da gusto usarla y nadie se pierde.

**Acceptance Scenarios**:

1. **Given** las pantallas principales, **When** las recorro, **Then** comparten una paleta de colores y un estilo consistentes.
2. **Given** una acción como guardar o tocar un botón, **When** la ejecuto, **Then** hay una retroalimentación visible (animación, cambio de estado o mensaje) que me confirma que la acción se registró.
3. **Given** las tareas frecuentes (registrar pedido, registrar venta, crear producto), **When** las ejecuto, **Then** cada una se completa en 3 pantallas o menos desde su punto de entrada.

---

### Edge Cases

- ¿Qué pasa si se sube una foto mientras hay mala conexión o el archivo está corrupto? → Debe mostrar un mensaje claro y conservar el producto sin la foto, nunca tumbar el servicio.
- ¿Qué pasa si el botón "+" se toca sin productos en el catálogo? → El pedido debe poder armarse igual con productos personalizados (texto libre), ya soportados por el sistema.
- ¿Qué pasa si un producto no tiene nombre definido o su nombre está vacío? → El pedido muestra un texto de respaldo legible (por ejemplo "Producto sin nombre"), nunca el código interno como dato principal.
- ¿Qué pasa en pantallas muy pequeñas (celular viejo) o muy grandes? → El diseño se adapta dentro del rango razonable de dispositivos; fuera de él, degrada con elegancia (scroll vertical permitido, nunca horizontal).
- ¿Qué pasa si se cierra la app a mitad de registrar un pedido rápido? → El pedido a medias no se guarda (no se crean pedidos basura); al reabrir solo se pide la clave si la sesión de 30 días venció o se usó "Salir".

## Requirements *(mandatory)*

### Functional Requirements

**Estabilidad de fotos (bug)**

- **FR-001**: Al cargar una foto a un producto, el sistema MUST guardarla y seguir operativo; ningún caso de carga puede tumbar el servicio.
- **FR-002**: El sistema MUST rechazar con un mensaje claro en español los archivos que no pueda procesar (formato no admitido o archivo corrupto), sin interrumpir el servicio ni perder datos del producto.
- **FR-003**: El sistema MUST aceptar los formatos de foto comunes de celular (JPG, PNG, WebP) y fotos tomadas con la cámara del dispositivo; formatos fuera de esa lista (por ejemplo HEIC) se rechazan con el mensaje de FR-002.
- **FR-019**: Antes de subirla, la foto MUST reducirse en el dispositivo (~1600px de lado máximo, calidad ~80%) para que las cargas siempre sean livianas; el tamaño del archivo original nunca es motivo de rechazo.
- **FR-020**: Las fotos servidas MUST entregarse con caché del navegador (cabeceras HTTP de larga duración) para no repetir lecturas de la base de datos en cada vista.

**Nombre en pedidos (bug)**

- **FR-004**: Cada ítem de un pedido MUST mostrar como identificación principal el nombre del producto; el código interno nunca puede ser el dato principal mostrado.
- **FR-005**: Cuando dos productos comparten nombre, el ítem MUST distinguirlos por sus datos de variante (peso, mascota u otros datos del producto), no por un código interno.

**Pedido rápido**

- **FR-006**: Las pantallas principales MUST incluir un botón flotante "+" que abra directamente el formulario de nuevo pedido.
- **FR-007**: Desde abrir la app hasta llegar al formulario de nuevo pedido MUST bastar un solo toque.
- **FR-008**: El botón flotante MUST ser visible y alcanzable con el pulgar en pantalla de celular, sin tapar contenido esencial.

**Responsive (PC y móvil)**

- **FR-009**: Todas las pantallas MUST ser usables en celular y en computador: legibles, sin scroll horizontal y con controles alcanzables. Se logra con **una sola interfaz que se adapta sola según el tamaño de pantalla** (no aplicaciones ni diseños separados por dispositivo).
- **FR-010**: Los flujos completos (pedido, venta, producto) MUST poder ejecutarse de punta a punta en ambos tamaños de pantalla.

**Login y panel**

- **FR-011**: El acceso a la app MUST requerir autenticación con la **clave única del negocio**; sin clave válida no se pueden ver ni modificar datos. No hay multiusuario ni roles. La clave se define por **variable de entorno** (despliegue y `.env.local`); no existe pantalla para crearla ni cambiarla desde la app.
- **FR-012**: Tras el acceso, el sistema MUST mostrar un panel principal con resumen del día (ventas del día, pedidos pendientes, alertas de stock) y accesos rápidos a las secciones.
- **FR-013**: El acceso rápido de pedido (FR-006) MUST estar disponible también desde el panel principal.
- **FR-014**: Tras ingresar la clave correcta, el sistema MUST recordar el dispositivo durante 30 días sin volver a pedir la clave; MUST existir una opción "Salir" que cierre la sesión y exija la clave de nuevo en el próximo acceso.

**Visual y flujos**

- **FR-015**: La app MUST usar una paleta de colores y estilo consistentes en todas sus pantallas, dentro de la plantilla del proyecto.
- **FR-016**: Toda acción del usuario MUST tener retroalimentación visible inmediata (estado del botón, animación o mensaje de confirmación).
- **FR-017**: Las tareas frecuentes (registrar pedido, registrar venta, crear producto) MUST completarse en 3 pantallas o menos desde su punto de entrada.
- **FR-018**: Todo lo nuevo MUST estar en español de Colombia y los valores monetarios en COP con formato local (por la constitución del proyecto).

### Key Entities

- **Producto** (existente): se le cargan fotos; su **nombre** es lo que se muestra en los ítems de pedido.
- **Pedido** (existente): sus ítems muestran nombre de producto como dato principal; se crea desde el acceso rápido "+".
- **Clave del negocio** (nueva): credencial única de acceso a la app; una sola clave compartida, sin usuarios ni roles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cargar 20 fotos seguidas en productos distintos sin que el servicio se caiga una sola vez (0 caídas en 20 cargas).
- **SC-002**: Desde la app abierta, registrar un pedido de 3 ítems toma menos de 60 segundos y máximo 1 toque para llegar al formulario.
- **SC-003**: El 100% de los ítems de pedido muestran el nombre del producto; ningún pedido nuevo muestra el código interno como dato principal.
- **SC-004**: Todas las pantallas principales son usables sin scroll horizontal en pantallas desde 360px (celular) hasta 1920px (computador) de ancho.
- **SC-005**: Una persona que nunca usó la app completa "registrar un pedido" en su primer intento sin ayuda.
- **SC-006**: El 100% de los textos nuevos están en español de Colombia y los valores monetarios se muestran en COP.

## Assumptions

- El servicio se cae por un defecto técnico de la carga de fotos que se corregirá en la implementación; la spec solo exige el comportamiento observable: ninguna carga puede tumbar el servicio.
- Las fotos de celular llegan en formatos comunes (JPG, PNG, WebP); su peso se controla comprimiéndolas en el dispositivo antes de subirlas, por lo que no hay límite de tamaño que rechace al usuario.
- El botón flotante "+" es un acceso rápido al mismo flujo de pedido existente, no un flujo nuevo de pedido simplificado; la simplificación de pasos se cubre en FR-017.
- La app sigue siendo de uso local del negocio; el login es una sola clave compartida del negocio definida en una variable de entorno, sin gestión de usuarios ni recuperación de clave en esta versión (si se olvida, se restablece por vía técnica cambiando la variable).
- Las mejoras visuales se hacen dentro de la plantilla y estructura existentes del proyecto (constitución), sin introducir un sistema de diseño paralelo.
