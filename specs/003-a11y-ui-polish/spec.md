# Feature Specification: Pulido de accesibilidad y UI

**Feature Branch**: `003-a11y-ui-polish`

**Created**: 2026-02-14

**Status**: Draft

**Input**: User description: "en base a las recomendaciones crea la especificación para la mejora" (hallazgos de la auditoría de la app contra las Web Interface Guidelines)

## Clarifications

### Session 2026-11-16

- Q: ¿El aviso de cambios sin guardar debe aplicar solo al formulario de producto o también a otros formularios con estado editable? → A: Producto (crear/editar) y pedido nuevo — donde hay trabajo acumulado real; venta (un campo) y acceso quedan fuera por triviales.
- Q: ¿El aviso debe cubrir también la navegación interna de la app, o solo cerrar/recargar la pestaña? → A: Solo cerrar/recargar pestaña con `beforeunload` nativo; la navegación interna (menú lateral, atrás) no se intercepta — alcance mínimo por simplicidad.
- Q: ¿El theme-color debe ser fijo, seguir el sistema, o seguir la preferencia de tema de la app? → A: Seguir la preferencia de tema de la app (claro/oscuro, incluido el override manual y el modo sistema), igual que el tema visual actual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operación completa sin mirar ni adivinar botones (Priority: P1)

La dueña (o cualquier persona que use lector de pantalla o navegue solo con teclado) puede operar el dashboard completo: cada botón que solo muestra un ícono se anuncia con un nombre descriptivo en español, cada campo de formulario tiene su etiqueta asociada, y se puede saltar directo al contenido principal sin recorrer toda la navegación con Tab.

**Why this priority**: Hay 4+ botones solo-ícono sin nombre accesible (eliminar pedido, eliminar venta, quitar ítem de un pedido nuevo, panel de preferencias del layout) y varios campos del formulario de pedido nuevo con etiqueta visual no asociada. Sin nombre accesible, un lector de pantalla anuncia "botón" a secas y la acción de eliminar queda irreconocible — es el hallazgo de mayor riesgo real de la auditoría.

**Independent Test**: Recorrer cada pantalla con lector de pantalla (o inspector de accesibilidad del navegador) y verificar que todo control interactivo tiene nombre accesible; tabular desde la carga y comprobar que el primer destino útil es un enlace de "saltar al contenido".

**Acceptance Scenarios**:

1. **Given** una tarjeta de pedido o de venta, **When** el foco llega al botón de papelera, **Then** el lector de pantalla anuncia una acción descriptiva (p. ej. "Eliminar pedido") y no "botón" genérico.
2. **Given** el formulario de pedido nuevo, **When** se inspeccionan los campos "Ítem personalizado", "Precio" y "Cantidad" (libre y catálogo), **Then** cada etiqueta visible está asociada a su control.
3. **Given** cualquier pantalla del dashboard recién cargada, **When** se pulsa Tab por primera vez, **Then** aparece un enlace de "saltar al contenido principal" que lleva el foco al área principal.
4. **Given** el botón solo-ícono de preferencias del encabezado y el botón "X" de cada ítem agregado al pedido, **When** reciben foco, **Then** se anuncian con un nombre descriptivo.
5. **Given** el buscador del encabezado, **When** se abre el diálogo, **Then** el campo de búsqueda tiene un nombre accesible, no solo un placeholder.

---

### User Story 2 - Controles al alcance del dedo en celular con notch (Priority: P2)

En celulares con notch o indicador de inicio (iPhone y similares), la barra de navegación inferior y el botón flotante "+" respetan el área segura inferior: ningún control toca la zona del gesto del sistema ni queda medio tapado, y los toques responden de inmediato sin el retardo de doble-toque.

**Why this priority**: La app se usa principalmente desde el celular (pedidos que llegan de improvisto). Hoy la barra inferior y el FAB no compensan el área segura, así que en dispositivos con notch pueden quedar parcialmente tapados o demasiado pegados al borde del gesto de sistema.

**Independent Test**: Abrir la app en un dispositivo o emulador con notch (o con "safe area" forzada en DevTools) y verificar que la navegación inferior y el FAB quedan completamente visibles y accionables, en vertical y en horizontal.

**Acceptance Scenarios**:

1. **Given** un dispositivo con notch en vertical, **When** se muestra cualquier pantalla del dashboard, **Then** la navegación inferior y el FAB quedan por encima del área insegura sin solaparse con el indicador de inicio.
2. **Given** el mismo dispositivo en horizontal, **When** se muestra el dashboard, **Then** los controles fijos inferiores no quedan bloqueados por las áreas inseguras laterales o inferiores.
3. **Given** cualquier botón o enlace de la app en pantalla táctil, **When** se toca una vez, **Then** responde sin el retardo de espera de doble-toque.

---

### User Story 3 - Idioma, formato y acabado consistentes (Priority: P3)

Toda la interfaz visible está en español, los números comparativos (precios, totales) se alinean para leerse de un vistazo, los textos de ayuda de los campos siguen la misma convención, las imágenes no empujan el contenido al cargar, los estados vacíos se ven iguales en todas las secciones, y los formularios avisan antes de perder cambios sin guardar.

**Why this priority**: Son detalles de acabado — no bloquean operación pero erosionan la percepción de calidad y causan molestias reales (textos en inglés en el panel de preferencias, precios desalineados, perder un producto a medio diligenciar por un toque accidental).

**Independent Test**: Recorrer todas las pantallas y controles verificando idioma, convenciones de texto, alineación de cifras y comportamiento de imágenes; salir del formulario de producto con cambios sin guardar y comprobar el aviso.

**Acceptance Scenarios**:

1. **Given** el panel de preferencias del encabezado, **When** se abre, **Then** todas sus etiquetas y nombres accesibles están en español.
2. **Given** la rejilla de productos o el panel con cifras comparables, **When** se muestran precios, **Then** las cifras usan ancho numérico uniforme para alinearse.
3. **Given** cualquier campo con texto de ayuda, **When** se muestra, **Then** el texto sigue la convención de puntos suspensivos ("…").
4. **Given** una pantalla que carga imágenes de producto, **When** las imágenes llegan, **Then** el contenido no se desplaza (espacio reservado previamente).
5. **Given** el panel del dashboard u otra sección sin datos, **When** está vacía, **Then** muestra el mismo estilo de estado vacío que el resto de la app.
6. **Given** un formulario cubierto (producto en crear/editar, o pedido nuevo) con cambios sin guardar, **When** se intenta cerrar o recargar la pestaña, **Then** el navegador muestra su aviso nativo de cambios pendientes.
7. **Given** la app instalada o vista en la barra del sistema/navegador, **When** se renderiza con tema claro u oscuro (según la preferencia activa), **Then** el color de tema declarado coincide con el fondo activo de la app.

---

### Edge Cases

- Nombres de producto muy largos no rompen la navegación inferior ni el header (ya cubierto en 002; verificar que siga así).
- Dispositivos con notch en horizontal: áreas inseguras laterales no tapan los controles fijos.
- Un botón de papelera no debe anunciarse de forma ambigua ("botón") cuando hay varios en la misma lista.
- El aviso de cambios sin guardar no debe interrumpir el guardado normal ni aparecer cuando el formulario está intacto o ya se guardó.
- Los formularios triviales de un solo campo (registrar venta, acceso) NO muestran el aviso aunque el campo tenga valor: avisar ahí sería ruido, no protección.
- El aviso solo cubre cerrar/recargar la pestaña; la navegación interna de la app (menú lateral, botón atrás) NO se intercepta en esta versión.
- El enlace "saltar al contenido" solo es visible al recibir foco, no estorbando la UI normal.
- Al cambiar el tema desde el panel de preferencias, el color de tema declarado se actualiza al fondo correspondiente (no queda desfasado con el tema activo).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todo control interactivo que no muestra texto visible DEBE tener un nombre accesible descriptivo en español (botones de eliminar en tarjetas de pedido y venta, quitar ítem en pedido nuevo, preferencias de layout, y cualquier otro solo-ícono).
- **FR-002**: Toda etiqueta visual de campo DEBE estar asociada a su control ("Ítem personalizado", "Precio", "Cantidad" libre y de catálogo en pedido nuevo; selects de mascota/categoría en producto; campo del buscador).
- **FR-003**: La aplicación DEBE ofrecer un enlace de "saltar al contenido principal" como primer destino de foco por teclado, visible solo al enfocarse.
- **FR-004**: Los controles fijos inferiores (navegación inferior y botón flotante) DEBEN respetar el área segura del dispositivo en vertical y horizontal.
- **FR-005**: Los elementos interactivos DEBEN responder al toque sin el retardo de detección de doble-toque en pantallas táctiles.
- **FR-006**: Toda cadena de texto visible al usuario DEBE estar en español, incluido el panel de preferencias del encabezado y sus nombres accesibles.
- **FR-007**: Las cifras comparativas (precios en rejilla, totales del panel) DEBEN usar ancho numérico uniforme.
- **FR-008**: Los textos de ayuda de campos (placeholders) DEBEN seguir la convención de terminar en "…" cuando dan un ejemplo.
- **FR-009**: Las imágenes DEBEN reservar su espacio antes de cargar, sin desplazar contenido visible.
- **FR-010**: Los estados vacíos DEBEN presentarse con el mismo componente/estilo en todas las secciones (incluido el panel del dashboard).
- **FR-011**: Los formularios con trabajo acumulado —producto (crear y editar) y pedido nuevo— DEBEN advertir antes de perder cambios sin guardar al cerrar o recargar la pestaña (aviso nativo del navegador); no deben advertir tras guardar ni sin cambios. La navegación interna de la app no se intercepta. Los formularios triviales de un campo (venta, acceso) no requieren aviso.
- **FR-012**: La app DEBE declarar un color de tema para la UI del navegador/sistema que coincida con el fondo activo, siguiendo la misma preferencia de tema que la app (claro/oscuro, incluido el modo sistema y el override manual).

### Key Entities

Ninguna — no introduce ni modifica datos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de los controles interactivos de la app tienen nombre accesible (0 hallazgos al re-auditar contra las Web Interface Guidelines).
- **SC-002**: En un dispositivo con notch, 0 controles quedan tapados por áreas inseguras del sistema en vertical ni horizontal.
- **SC-003**: Un usuario de teclado alcanza el contenido principal en 1 pulsación de Tab más Enter desde la carga de cualquier pantalla.
- **SC-004**: 0 cadenas visibles en inglés en las pantallas operativas y controles del dashboard.
- **SC-005**: 0 desplazamientos de contenido visibles al cargar imágenes de producto (layout estable).
- **SC-006**: El usuario nunca pierde datos acumulados al cerrar o recargar la pestaña en los formularios cubiertos (producto, pedido nuevo): aviso nativo mostrado en 100% de los intentos con cambios sin guardar.

## Assumptions

- Los hallazgos provienen de la auditoría de feb-2026 sobre la rama `002-ux-quick-order`; la referencia de reglas son las Web Interface Guidelines (skill `web-design-guidelines` del repo).
- La corrección se limita a las pantallas operativas existentes; no se rediseñan flujos ni se agregan pantallas nuevas.
- El panel de preferencias del encabezado (plantilla) se traduce a español, pero su contenido/tema se mantiene igual.
- No se virtualizan listas: los volúmenes actuales de ventas/pedidos no lo justifican (queda como observación futura).
- Las pruebas de área segura pueden hacerse con emulación de safe-area en DevTools; no se requiere hardware físico con notch.
- Se acepta que salir del formulario con navegación interna (menú lateral, atrás) no advierte: el alcance se limita al aviso nativo del navegador por simplicidad; puede revisarse en una versión futura.
- La app sigue siendo de un solo usuario; no se evalúan criterios de i18n más allá del español de Colombia.
