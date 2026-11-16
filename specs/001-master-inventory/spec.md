# Feature Specification: Master Inventory — Sistema de inventario y ventas

**Feature Branch**: `[001-master-inventory]`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: Especificación funcional ("qué", no "cómo") del sistema de inventario y ventas, derivada de las funciones existentes en la app MrKlaus. Alcance definido por el usuario: solo las funciones que ya existen en MrKlaus, sin login ni multiusuario. Borrador fuente: `/mnt/B/Proyectos/spec_master-inventory.md`.

## Clarifications

### Session 2026-11-16

- Q: ¿Qué pasa si intento eliminar un pedido de cliente que ya fue entregado? → A: No se puede eliminar: al marcarse Entregado el pedido queda congelado; la eliminación solo aplica a pedidos pendientes (la modificación de pedidos ya creados sigue fuera de alcance).
- Q: ¿Qué muestra la sección "Mis Favoritos"? → A: Ambas cosas: primero los productos marcados como favoritos y, debajo, un ranking de los más vendidos (por unidades vendidas, el mismo criterio de rotación de los reportes).
- Q: ¿Qué pasa si restauro un respaldo en un sistema que ya tiene datos? → A: Restaurar reemplaza todo: tras confirmación explícita, los datos actuales se descartan y el sistema queda exactamente como en el respaldo.
- Q: ¿Pueden existir dos productos con el mismo nombre? → A: Sí, el nombre no es único; los productos con el mismo nombre se distinguen por su variante, peso, mascota y demás datos.
- Q: Si el precio de un producto cambia después de crear un pedido, ¿el total del pedido se actualiza? → A: No: el precio de cada ítem del catálogo se congela al crear el pedido; cambiar el precio del producto no altera pedidos ya creados.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### User Story 1 - Gestionar el inventario sin papel (Priority: P1)

Como dueño del negocio, creo, consulto, edito y elimino productos con fotos, precios, stock, mascota y categoría; los busco por nombre y los filtro por mascota y categoría a la vez; y ajusto el stock manualmente (+/−) para corregir diferencias entre lo físico y lo registrado. En el primer arranque, si no hay datos, el catálogo inicial de la tienda (76 productos, 69 con foto —algunas compartidas— y 7 sin foto) ya está cargado para empezar a trabajar de inmediato.

**Why this priority**: Es el núcleo del negocio: sin inventario al día no funciona ninguna otra función (ventas, alertas, pedidos, reportes dependen del catálogo y su stock).

**Independent Test**: Se puede probar de punta a punta creando un producto con solo nombre y precio, viéndolo en el inventario, buscándolo, filtrándolo, ajustando su stock y eliminándolo con confirmación. Entrega valor por sí sola: el inventario deja de estar en papel.

**Acceptance Scenarios**:

1. **Given** el sistema recién iniciado con el catálogo cargado, **When** abro el inventario, **Then** veo los productos con foto, precio, chips de mascota/categoría/peso y corazón de favorito.
2. **Given** el inventario, **When** creo un producto digitando solo nombre y precio de venta, **Then** se guarda (stock 0, stock mínimo 3 por defecto) y aparece en la lista.
3. **Given** un producto en el inventario, **When** entro a su detalle y toco +/− stock, **Then** el valor cambia en pantalla sin recargar.
4. **Given** productos de varias mascotas y categorías, **When** busco por nombre y filtro por mascota y categoría a la vez, **Then** solo quedan los que cumplen ambas condiciones; si no hay resultados, se me lo dice claramente y no aparece una pantalla en blanco.
5. **Given** un producto existente, **When** intento agregar una 6ª foto, **Then** el sistema no lo permite (máximo 5).
6. **Given** un producto existente, **When** lo elimino y confirmo, **Then** desaparece del inventario, sus fotos dejan de existir y sus pedidos pendientes pierden ese ítem con un aviso (ver CL7).

---

### User Story 2 - Registrar ventas que descuentan stock y congelan precios (Priority: P1)

Como dueño del negocio, registro una venta desde el producto vendido indicando la cantidad; el sistema descuenta el stock solo, guarda fecha/hora, total, y el nombre y los precios congelados al momento de la venta; y mantengo un historial consultable.

**Why this priority**: Vender es la operación diaria principal; el descuento automático y el precio congelado son lo que hace confiables las ganancias del negocio.

**Independent Test**: Se puede probar registrando una venta de N unidades de un producto y verificando stock, historial e inmutabilidad del precio tras editar el producto. Entrega valor por sí sola: constancia de ventas sin cuaderno.

**Acceptance Scenarios**:

1. **Given** un producto con stock 10, **When** registro una venta de 3 unidades, **Then** el stock queda en 7 y la venta aparece en el historial con fecha, ítem y total.
2. **Given** una venta ya registrada, **When** edito el precio del producto, **Then** el historial y las ganancias siguen mostrando el precio congelado de la venta.
3. **Given** un producto con stock 2, **When** intento registrar una venta de 3 (o de 0 o negativa), **Then** el sistema lo bloquea y no permite continuar.
4. **Given** una venta registrada por error, **When** la elimino y confirmo, **Then** el stock se devuelve automáticamente y la venta deja de contar en los reportes del periodo (ver CL11).

---

### User Story 3 - Tomar pedidos de clientes (Priority: P2)

Como dueño del negocio, tomo pedidos de clientes con nombre (obligatorio), contacto (opcional) y uno o más ítems (producto del catálogo con cantidad y precio, o producto personalizado con texto libre). El total se calcula solo y cada pedido tiene estados entregado/pendiente y pagado/pago pendiente.

**Why this priority**: Los pedidos son ventas diferidas que hoy se pierden por teléfono o papel; dependen del inventario (P1) pero no de favoritos ni alertas.

**Independent Test**: Se puede probar creando un pedido con productos del catálogo y uno personalizado, cambiando sus estados y verificando el descuento de stock al primer "Entregado". Entrega valor por sí sola: ningún pedido se olvida.

**Acceptance Scenarios**:

1. **Given** un cliente al teléfono, **When** creo un pedido con 5 "Comida enlatada" y una "Torta personalizada para gato", **Then** el pedido guarda nombre, ítems y total calculado (cantidad × precio de cada ítem).
2. **Given** un pedido pendiente de 5 "Comida enlatada", **When** lo marco Entregado por primera vez, **Then** el stock baja en 5; si lo desmarco o lo marco de nuevo, el stock no se repone ni vuelve a bajar (corrección manual con +/−, con aviso al desmarcar).
3. **Given** un pedido solo con productos personalizados, **When** lo marco Entregado, **Then** no cambia ningún stock del inventario.
4. **Given** un pedido entregado con pago pendiente, **When** consulto los reportes del periodo, **Then** no suma a ganancia bruta, ganancia neta ni rotación hasta marcarlo Pagado.
5. **Given** un pedido pendiente ya creado, **When** edito el precio de venta de ese producto en el catálogo, **Then** el total del pedido no cambia (los precios de los ítems quedaron congelados al crearlo).

---

### User Story 4 - Preparar el próximo pedido al proveedor (Priority: P2)

Como dueño del negocio, marco productos "para próximo pedido" con una nota libre, los veo listados, edito la nota y los desmarco; así tengo lista la próxima compra y sé cuánto me va a costar (inversión pendiente).

**Why this priority**: Es la memoria del reabastecimiento; es simple e independiente, pero alimenta el indicador de inversión pendiente de los reportes.

**Independent Test**: Se puede probando marcar 2 productos con nota, verlos listados, editar la nota, desmarcarlos y verificar que el indicador refleje solo los marcados. Entrega valor por sí sola: lista de compras sin papel.

**Nota de dependencia**: el indicador "Inversión Pendiente" se visualiza en la pantalla de reportes (User Story 7); sin ella, este criterio se verifica solo vía la lista de marcados.

**Acceptance Scenarios**:

1. **Given** un producto en su detalle, **When** lo marco "para próximo pedido" con nota, **Then** aparece en la lista de marcados y la Inversión Pendiente refleja su stock mínimo × precio de compra.
2. **Given** un producto marcado, **When** edito la nota o lo desmarco, **Then** el cambio se refleja de inmediato en la lista y en el indicador.

---

### User Story 5 - Alertas de vencimientos y agotados (Priority: P2)

Como dueño del negocio, veo una pantalla de alertas con vencimientos (ordenados del más próximo al más lejano, con semáforo de colores) y agotados (stock ≤ 0); las tarjetas de producto avisan "Stock Bajo" cuando stock ≤ stock mínimo.

**Why this priority**: Evita perder mercancía por vencimiento y ventas por desabasto; se alimenta solo del catálogo (P1), sin depender de ventas ni pedidos.

**Independent Test**: Se puede probando crear un producto que vence en 12 días (rojo), uno que vence en 45 (naranja), uno sin vencimiento (no aparece) y uno con stock 0. Entrega valor por sí sola: aviso temprano de riesgos.

**Acceptance Scenarios**:

1. **Given** productos con fechas de vencimiento variadas, **When** abro Alertas, **Then** los vencimientos están ordenados del más próximo al más lejano, en rojo (≤30 días), naranja (31–60) o verde (>60).
2. **Given** un producto con stock 0, **When** abro Alertas, **Then** aparece en "Agotados"; un producto sin fecha de vencimiento no aparece en vencimientos.
3. **Given** un producto con stock igual o menor a su stock mínimo, **When** veo su tarjeta en cualquier lista, **Then** muestra el aviso "Stock Bajo".

---

### User Story 6 - Favoritos de un clic (Priority: P3)

Como dueño del negocio, marco o desmarco favoritos desde cualquier tarjeta o el detalle, y accedo a una sección "Mis Favoritos" que muestra mis productos marcados y, debajo, un ranking de los más vendidos.

**Why this priority**: Conveniencia pura; el inventario funciona sin ella y es trivialmente independiente.

**Independent Test**: Se puede probando marcar 2 favoritos desde la tarjeta y el detalle y verificando la sección propia. Entrega valor por sí sola: acceso rápido.

**Nota de dependencia**: el ranking de más vendidos consume ventas (User Story 2) y pedidos entregados y pagados (User Story 3); con cero ventas registradas solo se verifica el mensaje de sección vacía.

**Acceptance Scenarios**:

1. **Given** productos en el inventario, **When** marco dos como favoritos (uno desde la tarjeta, otro desde el detalle), **Then** ambos aparecen en "Mis Favoritos"; al desmarcarlos, desaparecen de la sección.
2. **Given** ventas registradas en el sistema, **When** abro "Mis Favoritos", **Then** debajo de mis marcados aparece el ranking de los más vendidos ordenado por unidades vendidas; si no hay ventas, el ranking muestra su mensaje de sección vacía.

---

### User Story 7 - Reportes financieros del periodo (Priority: P3)

Como dueño del negocio, veo reportes por mes o por año (navegables al periodo anterior/siguiente) con ganancia bruta, ganancia neta, capital en stock, inversión pendiente y ranking de rotación (unidades vendidas, de mayor a menor); y puedo exportar el reporte visible a un archivo para guardarlo, imprimirlo o compartirlo.

**Why this priority**: Responde "¿gano o pierdo dinero?"; necesita que existan ventas y pedidos (P1–P2) para tener sentido, por eso va después.

**Independent Test**: Se puede probando con ventas y pedidos de ejemplo de un mes: verificar cada indicador contra el cálculo manual y exportar el archivo. Entrega valor por sí sola: visibilidad financiera mensual.

**Acceptance Scenarios**:

1. **Given** ventas directas y pedidos entregados y pagados del periodo, **When** abro el reporte del mes, **Then** la ganancia bruta es la suma de totales de ambos orígenes; la ganancia neta es la suma de cantidad × (precio de venta − precio de compra) de ambos orígenes.
2. **Given** productos en stock, **When** abro el reporte, **Then** el capital en stock es la suma de stock × precio de compra de todos los productos, y la inversión pendiente es la suma de stock mínimo × precio de compra de los marcados "para próximo pedido".
3. **Given** productos vendidos en cantidades distintas, **When** veo el ranking de rotación, **Then** está ordenado de mayor a menor por unidades vendidas (unificando ventas directas y pedidos entregados y pagados).
4. **Given** el reporte de un periodo visible, **When** lo exporto, **Then** se genera un archivo con encabezado, periodo, resumen financiero y top de rotación.
5. **Given** un periodo sin movimientos, **When** lo consulto, **Then** los indicadores muestran 0 y aparece el mensaje "no hay registros en este periodo".

---

### User Story 8 - Respaldo y seguridad de los datos (Priority: P3)

Como dueño del negocio, exporto todos mis datos a un archivo de respaldo y los restauro importando ese archivo (el sistema se reinicia tras restaurar); el sistema me informa el resultado de cada operación.

**Why this priority**: Es la póliza de seguro de todo lo anterior; no agrega valor diario pero protege contra pérdida total.

**Independent Test**: Se puede probando exportar, luego importar el archivo en un sistema limpio y verificar que productos, ventas y pedidos quedan igual. Entrega valor por sí sola: tranquilidad ante imprevistos.

**Acceptance Scenarios**:

1. **Given** productos, ventas y pedidos registrados, **When** exporto el respaldo y lo importo en un sistema limpio, **Then** recupero todo tal como estaba.
2. **Given** un archivo que no es un respaldo válido o está dañado, **When** intento importarlo, **Then** el sistema informa el error y no pierde los datos actuales.
3. **Given** un sistema con datos actuales y un respaldo válido, **When** intento restaurarlo, **Then** el sistema me pide confirmar que se reemplazará todo; si confirmo, tras reiniciar solo quedan los datos del respaldo.

---

### User Story 9 - Registros internos (logs) (Priority: P3)

Como dueño del negocio, veo los registros internos del sistema (fecha, nivel INFO/WARN/ERROR, módulo, mensaje y, si aplica, el error) y limpio los antiguos; los de más de 90 días se limpian automáticamente al iniciar.

**Why this priority**: Es una herramienta de diagnóstico para "¿qué pasó si algo falla?"; nada de la operación diaria depende de ella.

**Independent Test**: Se puede probando abrir la pantalla de logs, ver las entradas con sus niveles y limpiar los antiguos. Entrega valor por sí sola: transparencia interna.

**Acceptance Scenarios**:

1. **Given** el sistema en uso, **When** abro los logs, **Then** veo las entradas con fecha, nivel, módulo y mensaje.
2. **Given** logs de más de 90 días, **When** el sistema inicia, **Then** se limpian automáticamente sin borrar ningún dato de negocio.

---

### Edge Cases

- **CL1**. ¿Qué pasa si intento vender o pedir más unidades de las que hay en stock? → El sistema lo bloquea (no permite cantidades superiores al stock disponible ni cantidades ≤ 0).
- **CL2**. ¿Qué pasa si desmarco como "entregado" un pedido de cliente que ya descontó stock? → El stock no se restaura; la regla es "se descuenta una sola vez". El sistema muestra un aviso recordando que la corrección se hace a mano con los botones +/− del detalle del producto. *(Decisión tomada: opción A, corrección manual; no hay reversión automática.)*
- **CL3**. ¿Qué pasa si importo un archivo que no es un respaldo válido o está dañado? → El sistema informa el error y no pierde los datos actuales.
- **CL4**. ¿Qué pasa si abro el sistema por primera vez y el catálogo falla al cargar? → No se bloquea el uso: puedo crear productos manualmente y no se intenta recargar el catálogo sobre datos existentes.
- **CL5**. ¿Qué pasa si consulto reportes de un periodo sin movimientos? → Se muestran los indicadores en 0 y el mensaje de "no hay registros en este periodo".
- **CL6**. ¿Qué pasa si un pedido solo tiene productos personalizados? → No afecta inventario; sí puede sumar al dinero cuando esté entregado y pagado.
- **CL7**. ¿Qué pasa si elimino un producto que tiene fotos, favorito, ventas o pedidos asociados? → Las fotos se borran con él; el historial de ventas conserva el nombre y precios congelados de lo ya vendido. Si el producto figura en pedidos pendientes (no entregados), el sistema avisa y retira ese ítem de dichos pedidos; el pedido queda con los demás ítems, o vacío (y entonces se sugiere eliminarlo) si era el único. *(Decisión tomada: opción A.)*
- **CL8**. ¿Qué pasa si un producto tiene fecha de vencimiento en el pasado? → Sus días restantes son negativos y se muestra en rojo en las alertas.
- **CL9**. ¿Qué pasa si la moneda o los precios se digitan con errores (texto, vacío)? → El sistema los trata como 0 y no se rompe.
- **CL10**. ¿Qué pasa si paso mucho tiempo sin usar el sistema? → Los logs antiguos (>90 días) se limpian automáticamente, pero los datos de negocio nunca se borran solos.
- **CL11**. ¿Qué pasa si elimino una venta registrada por error? → Con confirmación, la venta se elimina, su stock se devuelve automáticamente al producto y deja de contar en los reportes del periodo. Si el producto ya fue eliminado, no hay stock que reponer: la venta solo se borra del historial. El precio congelado de esa venta desaparece con ella. *(Decisión tomada: opción A.)*
- **CL12**. ¿Qué pasa si intento eliminar un pedido ya entregado? → El sistema lo bloquea: al marcarse Entregado el pedido queda congelado y no se puede eliminar (ni modificar); solo los pedidos pendientes se pueden eliminar. *(Decisión tomada: el dueño confirma que eliminar un pedido entregado no tiene sentido.)*

## Requirements *(mandatory)*

### Functional Requirements

**Productos e inventario**

- **FR-001**: El sistema MUST permitir crear, consultar, editar y eliminar productos. Cada producto tiene: nombre, descripción, precio de venta, precio de compra (costo), cantidad en stock, stock mínimo, mascota (Perro, Gato, Hámster, Unisex), categoría (Limpieza y aseo, Accesorios, Juguetes, Snacks), fecha de vencimiento (opcional, con opción "No aplica"), peso en kg (opcional), variante (opcional), nota de advertencia (opcional), bandera de favorito, fotos (máximo 5) y fecha de última actualización. La eliminación pide confirmación y no se puede deshacer.
- **FR-002**: El sistema MUST mostrar una vista de detalle con fotos, precios, datos del producto, estado de vencimiento con semáforo, marcación de pedido al proveedor, ajuste manual de stock (+/−) y el acceso directo para registrar una venta.
- **FR-003**: El sistema MUST permitir buscar productos por nombre y filtrar por mascota y categoría a la vez, con estados de carga, lista vacía y error.
- **FR-004**: El sistema MUST permitir marcar/desmarcar favoritos desde cualquier tarjeta de producto y desde el detalle, y tener una sección "Mis Favoritos". Esa sección muestra primero los productos marcados como favoritos y, debajo, un ranking de los más vendidos (por unidades vendidas, el mismo criterio de rotación de los reportes); si no hay ventas, el ranking muestra su mensaje de sección vacía.
- **FR-005**: Al eliminar un producto, el sistema MUST retirar sus ítems de los pedidos pendientes (no entregados) con aviso al dueño; si el pedido queda sin ítems, se sugiere eliminarlo. El historial de ventas conserva el nombre y precios congelados de lo ya vendido.

**Ventas**

- **FR-006**: El sistema MUST permitir registrar una venta de un producto indicando la cantidad; la venta guarda la fecha/hora, el total, y por cada ítem el nombre y los precios del producto congelados al momento de la venta. Al confirmar, el stock se descuenta automáticamente.
- **FR-007**: El sistema MUST mantener un historial de ventas consultable, donde los precios quedan congelados aunque el producto se edite después.
- **FR-008**: El sistema MUST permitir eliminar una venta con confirmación; al eliminarla, el stock vendido se devuelve automáticamente al producto y la venta deja de contar en los reportes del periodo.

**Pedidos de clientes**

- **FR-009**: El sistema MUST permitir crear pedidos con nombre de cliente (obligatorio), contacto (opcional) y uno o más ítems (producto del catálogo con cantidad y precio, o producto personalizado con texto libre). El total se calcula con la suma de precio por cantidad de sus ítems. El precio de cada ítem del catálogo se congela al crear el pedido: cambiar el precio del producto después no altera pedidos ya creados. Cada pedido tiene estados: pendiente/entregado y pagado/pago pendiente. Solo los pedidos pendientes se pueden eliminar; un pedido entregado queda congelado y ya no se puede eliminar ni modificar.
- **FR-010**: El sistema MUST descontar el stock de los ítems del catálogo una sola vez, cuando el pedido se marca como entregado por primera vez; desmarcarlo no devuelve el stock (corrección manual con aviso).

**Pedidos al proveedor**

- **FR-011**: El sistema MUST permitir marcar un producto como "para próximo pedido" con una nota libre, ver los productos marcados, editar la nota y desmarcarlos.

**Alertas**

- **FR-012**: El sistema MUST tener una pantalla de alertas con dos secciones: vencimientos (todos los productos con fecha de vencimiento, ordenados por fecha) y agotados (stock ≤ 0). Las tarjetas de producto MUST mostrar aviso de "Stock Bajo" cuando el stock está en el mínimo o menos.

**Reportes y exportación**

- **FR-013**: El sistema MUST mostrar reportes por periodo (mensual o anual, navegables entre meses/años) con: ganancia bruta, ganancia neta (utilidad real), capital invertido en stock actual, inversión pendiente del próximo pedido, y ranking de rotación de productos (unidades vendidas, de mayor a menor). La rotación y las ganancias unifican las ventas directas y los pedidos de clientes entregados y pagados del periodo.
- **FR-014**: El sistema MUST permitir descargar el reporte del periodo visible (resumen financiero + top de rotación) como archivo de texto.

**Datos y operación**

- **FR-015**: El sistema MUST permitir exportar todos los datos a un archivo y restaurarlos importando ese archivo (la aplicación se reinicia tras restaurar). Restaurar reemplaza todos los datos actuales —tras confirmación explícita del dueño— y el sistema queda exactamente como en el respaldo; no se mezclan datos. Debe informar el resultado de cada operación.
- **FR-016**: El sistema MUST guardar registros internos (fecha, nivel INFO/WARN/ERROR, módulo, mensaje y, si aplica, el error) y ofrecer una pantalla para verlos y limpiar los antiguos.
- **FR-017**: En el primer arranque (solo si no hay datos), el sistema MUST cargar automáticamente el catálogo de productos de la tienda (con sus fotos) y nunca sobrescribir los datos del usuario.
- **FR-018**: El sistema MUST organizar el acceso en 5 secciones principales (Inventario, Favoritos, Alertas, Pedidos, Ventas) más un área de respaldo/seguridad, y mostrar mensajes de sección vacía en todas las listas ("no hay registros", "no hay alertas", etc.).

### Key Entities *(include if feature involves data)*

- **Producto**: artículo del inventario; tiene nombre (único dato obligatorio junto con el precio de venta; puede repetirse entre productos, que se distinguen por variante, peso, mascota y demás datos), precios de compra y venta, stock y stock mínimo, mascota, categoría, vencimiento opcional, peso, variante, advertencia, favorito y hasta 5 fotos.
- **Venta**: transacción de un producto; congela nombre, precio de venta y costo del producto al momento de venderse; tiene fecha/hora, cantidad y total. Al eliminarse, devuelve el stock.
- **Pedido de cliente**: venta diferida de un cliente; tiene nombre (obligatorio), contacto opcional, ítems de catálogo (con cantidad y precio, congelado al crear el pedido) o personalizados (texto libre), total calculado, y estados entregado/pendiente y pagado/pago pendiente. Los ítems personalizados no se vinculan al inventario.
- **Marcado para pedido a proveedor**: marca por producto con nota libre; alimenta la inversión pendiente.
- **Log**: registro interno con fecha, nivel, módulo, mensaje y error opcional; se limpia automáticamente a los 90 días.
- **Respaldo**: archivo con todos los datos (productos, ventas, pedidos, marcados, configuración) para exportar e importar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un dueño no técnico puede crear un producto con nombre, precio y foto en menos de 2 minutos, sin ayuda.
- **SC-002**: Buscar y filtrar un producto entre los 76 del catálogo inicial toma menos de 10 segundos.
- **SC-003**: Registrar una venta completa (abrir producto, indicar cantidad, confirmar) toma menos de 30 segundos, y el stock del producto queda exactamente N unidades menor.
- **SC-004**: En un mes de prueba con ventas y pedidos de ejemplo, la ganancia bruta, la ganancia neta, el capital en stock y la inversión pendiente del reporte coinciden exactamente con el cálculo manual hecho con las reglas de negocio (tolerancia 0).
- **SC-005**: El 100 % de los productos con vencimiento en 30 días o menos aparecen en rojo en la pantalla de Alertas, sin omisiones.
- **SC-006**: Tras exportar un respaldo e importarlo en un sistema limpio, el 100 % de productos, ventas y pedidos se recuperan sin pérdida ni alteración.
- **SC-007**: Ningún dato de negocio (productos, ventas, pedidos) se borra solo: solo los logs mayores a 90 días se limpian automáticamente, y los datos actuales solo se reemplazan si el dueño restaura un respaldo con confirmación explícita.
- **SC-008**: Un dueño no técnico puede completar el flujo completo "buscar producto → ver detalle → vender" sin capacitación, usando solo lo que ve en pantalla.

## Assumptions

- El sistema es local y de un solo usuario, sin cuentas ni inicio de sesión (explícito en el alcance).
- Todo el producto está en español de Colombia y la moneda es el peso colombiano (COP) con su formato local (constitución, principio II).
- Al crear un producto, el stock mínimo inicia en 3 por defecto; el dueño puede cambiarlo.
- Un producto se puede guardar solo con nombre y precio de venta; los demás datos son opcionales y los números inválidos se toman como 0.
- Si un producto del catálogo inicial no trae precio de compra, se estima como el 70 % del precio de venta.
- Los reportes mensuales se organizan por calendario (mes natural); el modo anual agrega los 12 meses del año.
- El archivo de exportación de reportes es texto plano (CSV/PDF quedan fuera de alcance para esta versión).
- La navegación usa una barra inferior de 5 secciones con lenguaje visual único en todas las pantallas.
- Dependencia de datos: el catálogo inicial de la tienda (76 productos, 69 con foto —algunas compartidas— y 7 sin foto) está disponible para la carga del primer arranque (US1, FR-017).
- Los pedidos al proveedor son solo un marcador por producto con nota; el flujo formal con estados queda fuera de alcance.

## Fuera de alcance

Esta spec cubre solo las funciones que ya existen en MrKlaus. Quedan fuera (ideas para otras specs):

- IA para crear productos tomando una foto, precios y pagos por código QR, e integración con plataformas de pago.
- Inicio de sesión, registro de usuarios y base de datos en la nube (Supabase): el sistema es local y de un solo usuario.
- Respaldo en la nube con Google (hoy es solo un botón "próximamente").
- Exportación de reportes en CSV/PDF (solo texto plano).
- Flujo formal de pedidos al proveedor con estados (hoy es solo un marcador por producto con nota).
- Edición de precio/cantidad de los ítems de un pedido ya creado, campo de nota del pedido y fecha de entrega estimada capturable.
- Ventas de varios productos en una sola transacción (hoy una venta es de un producto).
- Versión móvil u otras plataformas.
