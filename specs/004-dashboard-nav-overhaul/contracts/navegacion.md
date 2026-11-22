# Contrato: Navegación y rutas

## Mapa de secciones (fuente: `src/navigation/sidebar/sidebar-items.ts`)

| Sección | Ruta | Grupo |
|---------|------|-------|
| Panel | `/dashboard` | Secciones |
| Inventario | `/dashboard/inventario` | Secciones |
| Favoritos | `/dashboard/favoritos` | Secciones |
| Alertas | `/dashboard/alertas` | Secciones |
| Pedidos | `/dashboard/pedidos` | Secciones |
| Ventas | `/dashboard/ventas` | Secciones |
| Reportes | `/dashboard/reportes` | Sistema |
| Respaldo | `/dashboard/respaldo` | Sistema |
| Nueva venta (acción) | `/dashboard/ventas/nueva` | Acciones (nuevo grupo, FR-006) |

## Rutas nuevas o modificadas

| Ruta | Cambio |
|------|--------|
| `/dashboard/ventas/nueva` | Antes: exigía `?producto=id` y redirigía a `/dashboard/inventario` sin él (bug). Ahora: pantalla POS siempre accesible; `?producto=id` opcional precarga el ítem con cantidad 1; `?producto=` con id inexistente se ignora y abre el POS normal. |

## Contrato de comportamiento del shell

1. **Pantalla ancha (`lg+`)**: barra lateral izquierda con todas las secciones, sección activa marcada (`isActive`), colapsable a íconos según preferencia `sidebar_collapsible` (`icon`/`offcanvas`; la opción `none` no se expone en `LayoutControls`, así el sidebar siempre puede colapsarse — FR-009) y variante `sidebar_variant`.
2. **Pantalla angosta**: sin barra fija; `SidebarTrigger` en el header abre el sidebar como drawer (Sheet); se cierra al navegar a una sección o al descartarlo. La `BottomNav` y su padding compensatorio (`pb-[calc(5rem+...)]` en `main`) se eliminan.
3. **Marca**: el logo/nombre "Master Inventory" en el header del sidebar es `Link` a `/dashboard` (focus visible, activable con teclado) desde cualquier pantalla.
4. **Header**: se conserva compacto — `SidebarTrigger`, `SearchDialog`, `LayoutControls`, `ThemeSwitcher`, `BotonSalir`. Desaparece el `NavHeader` horizontal.
5. **Persistencia**: cookie `sidebar_state` (abierto/colapsado) la maneja el componente; variantes vía preferencias existentes.
6. **Accesos "nueva venta"**: panel (acceso rápido), `ventas` (botón), sidebar/menú — todos a `/dashboard/ventas/nueva` → POS. Ningún acceso de venta termina en `/dashboard/inventario`.
7. **Sin regresiones**: `pedidos/nuevo` (FAB y acceso), `inventario/[id]` (vender → POS con precarga), buscador del header — siguen funcionando.
