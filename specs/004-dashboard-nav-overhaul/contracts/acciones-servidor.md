# Contrato: Server Actions de ventas

Archivo: `portal/src/server/services/ventas.ts`. Patrón existente: `"use server"`, retorno `Resultado<T> = { ok: true; data?: T } | { ok: false; mensaje: string }`, mensajes en español.

## registrarVenta — firma nueva

```ts
interface ItemVentaInput {
  producto_id: number;  // entero > 0
  cantidad: number;     // entero > 0
}

registrarVenta(items: ItemVentaInput[]): Promise<Resultado<{ id: number }>>
```

**Cambio**: antes `(productoId: number, cantidad: number)`. Único llamador actual: `formulario-venta.tsx`, que se reemplaza por el POS. No hay compatibilidad hacia atrás (app interna, un solo consumidor).

### Comportamiento

| Caso | Resultado |
|------|-----------|
| `items` vacío o no array | `{ ok: false, mensaje: "Agrega al menos un producto a la venta." }` |
| `producto_id`/`cantidad` inválidos | `{ ok: false }` con mensaje claro en español |
| Producto inexistente | `{ ok: false, mensaje: "El producto no existe." }` |
| Cantidad > stock (por ítem) | `{ ok: false, mensaje: "La cantidad debe ser mayor que cero y no puede superar el stock disponible." }` (puede incluir el nombre del producto) |
| Éxito | `{ ok: true, data: { id } }`; toast en UI + navegación al listado |

### Garantías (dentro de `transaccion`)

1. Cada ítem lee el producto desde la BD (precio y stock reales, no los del cliente).
2. `cantidad ≤ cantidad_stock` por ítem; si el mismo `producto_id` llega duplicado, las cantidades se suman antes de validar.
3. Descuento de stock por ítem (`productoRepo.ajustarStock(-cantidad)`).
4. Una sola fila en `ventas` con `total = Σ cantidad × precio_venta(BD)` y N filas en `venta_items` con precios congelados.
5. Todo o nada: cualquier fallo revierte la transacción.
6. `revalidatePath` de `/dashboard/ventas`, `/dashboard/inventario`, `/dashboard/favoritos`, `/dashboard/reportes`, `/dashboard` (nuevo: el panel ahora muestra métricas).
7. Log `INFO` en `logs` con id de venta y número de ítems.

## eliminarVenta — sin cambios de firma

`eliminarVenta(id: number): Promise<Resultado>` — ya repone stock iterando `items`, funciona igual con multi-ítem.

## getPreference — sin cambios

`getPreference("sidebar_variant" | "sidebar_collapsible")` ya existe en `server-actions.ts`; el nuevo layout la usa como en la plantilla.
