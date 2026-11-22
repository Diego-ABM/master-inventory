import type { NuevoVentaItem } from "./tipos.ts";

export function calcularTotalVenta(item: Pick<NuevoVentaItem, "cantidad" | "precio_venta">): number {
  if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero mayor que cero.");
  }
  return item.cantidad * item.precio_venta;
}

export function calcularTotalVentaMulti(items: Pick<NuevoVentaItem, "cantidad" | "precio_venta">[]): number {
  if (items.length === 0) {
    throw new Error("La venta debe tener al menos un ítem.");
  }
  return items.reduce((total, item) => total + calcularTotalVenta(item), 0);
}
