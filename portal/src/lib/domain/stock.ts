import type { Producto } from "./tipos.ts";

export function validarCantidad(cantidad: number, stockDisponible: number): boolean {
  return Number.isInteger(cantidad) && cantidad > 0 && cantidad <= stockDisponible;
}

export function esStockBajo(producto: Pick<Producto, "cantidad_stock" | "stock_minimo">): boolean {
  return producto.cantidad_stock <= producto.stock_minimo;
}

export function estaAgotado(producto: Pick<Producto, "cantidad_stock">): boolean {
  return producto.cantidad_stock <= 0;
}
