# Feature Specification: Dashboard de métricas, navegación lateral y flujo de ventas dedicado

**Feature Branch**: `[004-dashboard-nav-overhaul]`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "quiero integrar un dashboard de la plantilla para ver metricas de las ventas, por dia como esta actualmente, semanal mensual y anual, tambien quiero que el nombre de master inventory al dar click me muestre la pantalla de inicio, tambien quiero unas mejoras como la navegacion y flujo de las ventas, por jemeplo si quiero agendar un pedido rapido, el boton hace lo que necesita esto esta bien, pero el de ventas me lleva a inventario, como si hubiera seleccionado la opcion de catalogos o productos, por lo que quiero que tengamos un flujo especial para las ventas, separar la responsabilidad de cada modulo, el de este y otros que tambien pueden estar mal implementados. tambien quiero pasar el menu en la parte superior a la parte izquierda, como un protal adminsitrativo tradicional, y em gustaria aprovechar al maximo las animacions y efectos que ya de la palntailla, en terminos de navegacion, para que se vea una navegacion fluida, limpia y profecional, para esto ten en cuenta la plantilla, si tienes alguna duda hasmela saber"

## Clarifications

### Session 2026-11-21

- Q: ¿Cómo debe ser la pantalla dedicada de venta? → A: **Carrito multi-producto (tipo POS)**: buscar, agregar varios productos con cantidades y confirmar todo en una sola venta.
- Q: ¿Qué patrón de navegación en pantallas pequeñas? → A: **Menú lateral desplegable (drawer) de la plantilla**, oculto tras un botón; reemplaza la barra inferior actual.
- Q: ¿Qué granularidad tiene la gráfica de tendencia por período? → A: Hoy: por hora. Semana: por día. Mes: por día. Año: por mes.
- Q: ¿El precio de cada producto en la venta es fijo o ajustable? → A: **Precio fijo del catálogo**; el ítem de venta guarda el precio aplicado en el momento de la venta.
- Q: ¿A dónde lleva el atajo "vender" desde el detalle de un producto? → A: Abre la pantalla POS con ese producto ya agregado al carrito (cantidad 1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver métricas de ventas por período (Priority: P1)

Como dueño del negocio, cuando abro el panel principal veo las métricas de mis ventas —total vendido, número de ventas y la tendencia en una gráfica— y puedo cambiar entre los períodos: hoy (como está actualmente), esta semana, este mes y este año, con una gráfica que muestra la tendencia del período elegido.

**Why this priority**: Es el valor central del pedido: hoy solo se ven las ventas del día como lista plana, sin forma de saber cómo va la semana, el mes o el año. Las métricas por período son la herramienta para entender el negocio.

**Independent Test**: Se puede probar registrando ventas en días distintos, abriendo el panel y alternando entre los cuatro períodos para verificar que los totales y la gráfica cambian correctamente. Entrega valor por sí sola: aunque nada más cambiara, el dueño ya puede medir su negocio.

**Acceptance Scenarios**:

1. **Given** el panel principal abierto, **When** selecciono "Hoy", **Then** veo el total vendido hoy, el número de ventas de hoy y la gráfica del día.
2. **Given** ventas registradas en días anteriores de la misma semana, **When** selecciono "Semana", **Then** el total incluye las ventas de toda la semana en curso y la gráfica muestra la tendencia por día.
3. **Given** ventas del mes y del año en curso, **When** selecciono "Mes" y luego "Año", **Then** cada período muestra sus propios totales, cantidades y gráfica de tendencia, sin mezclar datos entre períodos.
4. **Given** un período sin ventas (por ejemplo, un año nuevo sin registros), **When** selecciono ese período, **Then** veo un estado vacío claro en español, no una pantalla rota ni cifras confusas.

---

### User Story 2 - Registrar una venta con un flujo propio, sin pasar por el inventario (Priority: P1)

Como dueño del negocio, cuando toco "Nueva venta" (desde el panel, el menú o el listado de ventas) llego a una pantalla de venta dedicada donde busco y elijo los productos ahí mismo, defino cantidades y confirmo; la app nunca me manda al inventario "como si hubiera elegido catálogo" ni me obliga a salir del flujo de venta para completarla.

**Why this priority**: Es el fallo de navegación que el usuario señala explícitamente: el acceso de venta hoy redirige al inventario, mezclando responsabilidades entre módulos. Registrar ventas es la operación más frecuente del negocio y merece un flujo propio como el que ya tienen los pedidos.

**Independent Test**: Se puede probar tocando "Nueva venta" desde el acceso rápido del panel y desde la pantalla de ventas, verificando que se abre la pantalla de venta (no el inventario), eligiendo un producto buscándolo por nombre, confirmando y viendo la venta en el listado. Entrega valor por sí sola: vender deja de ser un rodeo.

**Acceptance Scenarios**:

1. **Given** cualquier acceso de "nueva venta" (panel, menú, pantalla de ventas), **When** lo toco, **Then** se abre la pantalla dedicada de registro de venta, no el inventario.
2. **Given** la pantalla de venta abierta, **When** busco productos por su nombre, **Then** puedo agregar varios productos distintos a la misma venta, cada uno con su cantidad, viendo el total acumulado antes de confirmar.
3. **Given** una venta con varios productos confirmada, **When** vuelvo al listado de ventas, **Then** la venta aparece registrada con su total y sus ítems.
4. **Given** un producto sin stock o una cantidad superior al disponible, **When** intento agregarlo o confirmarlo, **Then** la app me avisa claramente y no permite confirmar esa cantidad.
5. **Given** una venta en curso con productos agregados, **When** decido cancelarla, **Then** salgo del flujo sin registrar la venta y sin descontar stock.

---

### User Story 3 - Navegar con menú lateral izquierdo estilo portal administrativo (Priority: P2)

Como dueño del negocio, cuando uso la app en el computador veo el menú de secciones en una barra lateral a la izquierda —como un portal administrativo tradicional— con la sección activa marcada; la barra puede colapsarse para dar más espacio al contenido, y en pantallas pequeñas la navegación se adapta sin perder acceso a ninguna sección.

**Why this priority**: Es el cambio de estructura visual pedido: hoy el menú vive en la barra superior (escritorio) y en una barra inferior (móvil). La barra lateral es el patrón de la plantilla y el formato que el usuario espera de un portal administrativo.

**Independent Test**: Se puede probar abriendo la app en pantalla ancha y verificando que el menú está a la izquierda con todas las secciones (Panel, Inventario, Favoritos, Alertas, Pedidos, Ventas, Reportes, Respaldo), que la activa se marca y que se puede colapsar/expandir; y en pantalla angosta verificando que el menú se abre como panel desplegable (drawer) desde un botón visible y que todas las secciones siguen alcanzables.

**Acceptance Scenarios**:

1. **Given** la app en pantalla ancha, **When** la abro, **Then** el menú de secciones aparece en una barra lateral a la izquierda, no en la barra superior.
2. **Given** la barra lateral visible, **When** navego entre secciones, **Then** la sección activa queda marcada y puedo llegar a todas las secciones existentes.
3. **Given** la barra lateral desplegada, **When** la colapso, **Then** el contenido gana espacio y la barra queda reducida (íconos) pudiendo expandirse de nuevo.
4. **Given** la app en pantalla pequeña, **When** toco el botón de menú, **Then** se despliega el menú lateral de la plantilla con todas las secciones, y se cierra al elegir una sección o al descartarlo.
5. **Given** la app en pantalla pequeña, **When** reviso la pantalla, **Then** ya no aparece la barra inferior fija de secciones.

---

### User Story 4 - Volver al inicio tocando el nombre de la app (Priority: P2)

Como dueño del negocio, cuando toco el nombre "Master Inventory" (o el logo) en cualquier pantalla, la app me lleva a la pantalla de inicio (el panel), como en cualquier portal.

**Why this priority**: Pequeño pero universal: es el comportamiento esperado de cualquier portal administrativo y hoy el nombre es texto muerto. Acompaña al rediseño de navegación.

**Independent Test**: Se puede probar estando en cualquier sección (por ejemplo, Reportes), tocando el nombre de la app y verificando que se llega al panel de inicio.

**Acceptance Scenarios**:

1. **Given** cualquier pantalla de la app, **When** toco el nombre/logo de "Master Inventory", **Then** llego a la pantalla de inicio.
2. **Given** el nombre de la app, **When** paso el cursor o lo enfoco con teclado, **Then** se comporta como un enlace (puntero, foco visible, activable con Enter).

---

### User Story 5 - Navegación fluida con las animaciones de la plantilla (Priority: P3)

Como dueño del negocio, cuando me muevo entre secciones o interactúo con el menú, las transiciones se ven fluidas, limpias y profesionales, aprovechando los efectos y animaciones que la plantilla ya trae (transiciones del menú lateral, estados hover/activo, transiciones de vista).

**Why this priority**: Es el acabado pedido ("navegación fluida, limpia y profesional"). No cambia funcionalidad pero sí la percepción de calidad; va después de que la estructura correcta esté en pie.

**Independent Test**: Se puede probar navegando entre varias secciones, colapsando y expandiendo la barra lateral y observando que las transiciones son suaves y consistentes con la plantilla, sin saltos ni parpadeos.

**Acceptance Scenarios**:

1. **Given** la barra lateral, **When** la colapso o expando, **Then** la barra pasa de mostrar etiquetas e íconos a solo íconos (o a ocultarse) con una transición animada, no con un corte instantáneo.
2. **Given** cualquier sección, **When** navego a otra, **Then** el ítem activo del menú cambia a la sección nueva con una transición de color suave y la sección anterior deja de estar marcada.
3. **Given** el tema claro u oscuro activo, **When** navego, **Then** las animaciones y estados se ven correctamente en ambos temas.

---

### Edge Cases

- ¿Qué pasa con los límites de período? Una venta hecha a las 23:59 cuenta en "Hoy"; al cambiar de día pasa a la semana/mes/año. La semana se define según la convención local (documentar en plan: lunes como inicio, estándar en Colombia).
- ¿Qué pasa cuando no hay ventas en un período? Se muestra estado vacío claro en español, no gráficas vacías ni errores.
- ¿Qué pasa si el usuario intenta vender más de lo que hay en stock? Se bloquea con mensaje claro (comportamiento ya existente que se mantiene).
- ¿Qué pasa si se abre la pantalla de nueva venta sin elegir producto aún? Se muestra el buscador/selector, no una redirección ni un error.
- ¿Qué pasa si se agrega el mismo producto dos veces a la venta? Se consolida en un solo ítem sumando la cantidad, validando el total contra el stock.
- ¿Qué pasa si se quita un producto del carrito o se vacía por completo? El total se recalcula y confirmar queda bloqueado hasta agregar al menos un ítem.
- ¿Qué pasa en pantallas muy angostas? La navegación lateral se adapta (colapsada/desplegable) sin ocultar secciones.
- Otros flujos con responsabilidad mezclada: durante la implementación se revisan accesos y redirecciones de los demás módulos (pedidos, inventario, favoritos, alertas) y se corrige cualquier salto de módulo equivalente al del flujo de ventas, siguiendo el mismo criterio de separación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar en el panel principal métricas de ventas para cuatro períodos seleccionables: hoy, semana en curso, mes en curso y año en curso.
- **FR-002**: El sistema MUST mostrar, por período, al menos: total vendido en COP, número de ventas y una gráfica de tendencia del período. La gráfica agrega las ventas por hora en "Hoy", por día en "Semana" y "Mes", y por mes en "Año".
- **FR-003**: El sistema MUST permitir cambiar de período sin recargar la aplicación ni perder el contexto del panel.
- **FR-004**: El sistema MUST mostrar un estado vacío claro en español cuando un período no tenga ventas.
- **FR-005**: El sistema MUST ofrecer una pantalla dedicada de registro de venta tipo carrito/POS: búsqueda de productos por nombre, agregar varios productos con su cantidad, ver el total acumulado y confirmar la venta en un solo registro, sin redirigir al inventario. El precio de cada ítem es el del catálogo en el momento de la venta (no editable en el flujo de venta) y queda registrado en la venta.
- **FR-006**: Todos los accesos de "nueva venta" (acceso rápido del panel, pantalla de ventas, menú) MUST abrir la pantalla dedicada de venta. El atajo "vender" desde el detalle de un producto en inventario abre esa misma pantalla con el producto ya agregado al carrito (cantidad 1).
- **FR-007**: El sistema MUST impedir confirmar una venta con cantidad cero, superior al stock disponible o sin productos agregados, con mensaje claro en español.
- **FR-008**: El sistema MUST presentar el menú de secciones en una barra lateral a la izquierda en pantallas anchas, con indicador de sección activa.
- **FR-009**: La barra lateral MUST poder colapsarse y expandirse, conservando acceso a todas las secciones.
- **FR-010**: En pantallas pequeñas el sistema MUST mostrar el menú lateral como panel desplegable (drawer) activado por un botón visible, con acceso a todas las secciones; la barra inferior fija de secciones se elimina.
- **FR-011**: El nombre/logo de la aplicación MUST actuar como enlace a la pantalla de inicio desde cualquier sección.
- **FR-012**: El sistema MUST aplicar las transiciones y efectos de navegación provistos por la plantilla (colapso del menú lateral, estados activo/hover, transiciones entre secciones) de forma consistente en temas claro y oscuro.
- **FR-013**: Los demás accesos y flujos existentes (pedido rápido, pedidos, inventario, favoritos, alertas, reportes, respaldo) MUST seguir funcionando sin regresiones; cualquier salto de módulo análogo al del flujo de ventas que se detecte se corrige bajo el mismo criterio de separación de responsabilidades.
- **FR-014**: Todo texto nuevo (etiquetas de período, estados vacíos, títulos, mensajes) MUST estar en español de Colombia y los valores monetarios en formato COP.

### Key Entities *(include if feature involves data)*

- **Venta**: registro con fecha, total en COP e ítems (cantidad × producto × precio aplicado del catálogo en el momento de la venta). Es la fuente de todas las métricas; los períodos se calculan sobre su fecha.
- **Métrica de período**: agregado derivado de las ventas (total vendido, número de ventas, serie temporal para la gráfica) para un período dado; no se persiste, se calcula.
- **Sección de navegación**: entrada del menú lateral (etiqueta, ícono, destino, grupo); ya existe como configuración de navegación en el proyecto.
- **Producto**: se consulta desde la pantalla de venta para buscar, mostrar precio y validar stock; su edición/administración sigue siendo responsabilidad del inventario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El dueño puede ver el total vendido de la semana, el mes o el año en máximo 2 toques/clics desde el panel, y el cambio de período se refleja en menos de 2 segundos.
- **SC-002**: Registrar una venta completa (abrir el flujo, elegir producto, confirmar) toma máximo 4 acciones y nunca pasa por la pantalla de inventario.
- **SC-003**: El 100% de las secciones son alcanzables desde la barra lateral en pantalla ancha y desde la navegación móvil en pantalla angosta.
- **SC-004**: Desde cualquier pantalla, volver al inicio tocando el nombre de la app funciona en el 100% de los casos probados.
- **SC-005**: Una persona no técnica puede verificar cada criterio usando solo la aplicación: abrir el panel, cambiar períodos, registrar una venta, colapsar el menú y navegar entre secciones.
- **SC-006**: Ninguna funcionalidad existente (pedidos, inventario, favoritos, alertas, reportes, respaldo, fotos) presenta regresiones tras el cambio de navegación.

## Assumptions

- Las métricas se calculan sobre la fecha de cada venta registrada; la semana inicia en lunes (convención de Colombia) salvo que se indique lo contrario en el plan.
- El dashboard de métricas se integra en el panel principal existente (como sección con selector de período), no como pantalla separada, salvo que la clarificación indique otra ubicación.
- El alcance mínimo de métricas es: total vendido (COP), número de ventas y gráfica de tendencia; comparativas con períodos anteriores o exportación de métricas quedan fuera de esta spec.
- El flujo de ventas dedicado reutiliza las reglas de negocio existentes (stock, precios, totales) y se extiende a ventas multi-ítem; no cambia cómo se calcula el total ni cómo se descuenta el stock.
- Se conserva el acceso directo "vender desde el detalle de un producto" en inventario como atajo opcional, que ahora abre la pantalla POS con ese producto ya agregado al carrito; ya no es el único camino ni el destino del acceso "nueva venta".
- Las animaciones se limitan a las provistas por la plantilla y sus componentes; no se crean librerías ni sistemas de animación nuevos.
- La auditoría de "otros flujos mal implementados" se limita a redirecciones/accesos de navegación entre módulos; no incluye rediseño funcional de otros módulos.
