import { ETIQUETAS_MASCOTA, type NuevoPedidoItem, type PedidoCliente, type Producto } from "./tipos.ts";

export function calcularTotalPedido(items: NuevoPedidoItem[]): number {
  return items.reduce((total, item) => {
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new Error("La cantidad de cada ítem debe ser un entero mayor que cero.");
    }
    return total + item.cantidad * item.precio_unitario;
  }, 0);
}

type Banderas = Pick<PedidoCliente, "entregado" | "pagado" | "stock_descontado">;

export function debeDescontarStock(pedido: Banderas): boolean {
  return pedido.entregado === 1 && pedido.stock_descontado === 0;
}

export function cuentaEnReportes(pedido: Pick<PedidoCliente, "entregado" | "pagado">): boolean {
  return pedido.entregado === 1 && pedido.pagado === 1;
}

export function puedeEliminarse(pedido: Pick<PedidoCliente, "entregado">): boolean {
  return pedido.entregado === 0;
}

export function etiquetaItemProducto(producto: Producto): string {
  const nombre = producto.nombre.trim();
  if (!nombre) return "Producto sin nombre";

  const variante = producto.variante?.trim();
  if (variante) return `${nombre} — ${variante}`;
  if (producto.peso_kg != null) return `${nombre} — ${producto.peso_kg} kg`;
  if (producto.mascota !== "UNISEX") return `${nombre} — ${ETIQUETAS_MASCOTA[producto.mascota]}`;
  return nombre;
}
