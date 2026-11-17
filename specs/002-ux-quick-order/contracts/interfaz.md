# Contrato: Interfaz (pedido rápido, navegación, panel, etiquetas)

## Botón flotante "Nuevo pedido" — `fab-pedido.tsx`

- Visible en todas las pantallas dentro de `(main)/dashboard/*`, **excepto**
  `/dashboard/pedidos/nuevo`.
- Un toque/clic lleva a `/dashboard/pedidos/nuevo` (FR-006, FR-007).
- Posición `fixed` esquina inferior derecha, por encima de la barra inferior;
  objetivo táctil ≥ 48 px; `aria-label="Nuevo pedido"` (FR-008).
- Icono: `Plus` de lucide-react; estilo con tokens semánticos (`bg-primary`,
  `text-primary-foreground`).

## Navegación adaptativa

- **< lg**: barra inferior existente (`bottom-nav`), inalterada en estructura;
  se agrega "Panel" como primera sección.
- **≥ lg**: navegación horizontal dentro del header (`nav-header.tsx`),
  mismas secciones y estado activo por `usePathname`; la barra inferior se
  oculta (`lg:hidden`).
- Secciones: Panel, Inventario, Favoritos, Alertas, Pedidos, Ventas (+ Respaldo
  y Reportes según su lugar actual).
- Regla global: ningún scroll horizontal entre 360 px y 1920 px (SC-004).

## Panel principal — `/dashboard`

Server Component que muestra:

| Bloque | Fuente | Contenido |
|--------|--------|-----------|
| Ventas del día | `ventaRepo.listar({desde, hasta})` | total en COP + número de ventas |
| Pedidos pendientes | `pedidoRepo.listar({entregado: false})` | conteo + enlace a Pedidos |
| Alertas | `productoRepo.listarAgotados()`, `listarVencimientos()` | conteos + enlace a Alertas |
| Accesos rápidos | — | botones a Nuevo pedido (FR-013), Nueva venta, Inventario, Pedidos |

- Se retira el redirect `/dashboard → /dashboard/inventario` de
  `next.config.mjs` y `(external)/page.tsx` apunta a `/dashboard` (hoy apunta a
  la ruta inexistente `/dashboard/default`).
- Tras `entrar`, el usuario aterriza aquí.

## Etiqueta de ítem de pedido — `etiquetaItemProducto(producto)`

Función pura en `src/lib/domain/pedidos.ts` (con tests en `pedidos.test.ts`):

| Caso | Etiqueta |
|------|----------|
| nombre + variante | `"Comida gato — Pollo 500g"` |
| nombre + peso_kg sin variante | `"Comida gato — 2 kg"` |
| nombre + mascota ≠ UNISEX (sin variante/peso) | `"Comida gato — Gato"` |
| solo nombre | `"Comida gato"` |
| nombre vacío/ausente | `"Producto sin nombre"` |

- El `id` del producto y cualquier código interno **nunca** son el dato
  principal mostrado (FR-004, FR-005).
- Aplica a ítems de catálogo al crearse el pedido; ítems personalizados usan el
  texto libre del usuario. El mismo texto de respaldo aplica en la vista si un
  ítem antiguo viniera sin nombre.

## Feedback y textos

- Toda acción mantiene retroalimentación visible: botón `disabled`/estado
  `pending` durante la transición + `toast` de éxito/error (FR-016).
- Todos los textos nuevos en español de Colombia; se corrigen los strings en
  inglés del `SearchDialog` y `lang="en"` → `es` (FR-018).
