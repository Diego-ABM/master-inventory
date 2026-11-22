import { cuentaEnReportes } from "./pedidos.ts";
import type { PedidoConItems, Producto, VentaConItems } from "./tipos.ts";

export interface Periodo {
  anual: boolean;
  anio: number;
  mes?: number; // 1-12, solo cuando anual = false
}

export interface RangoPeriodo {
  desde: number;
  hasta: number;
}

export interface ResultadoReporte {
  gananciaBruta: number;
  gananciaNeta: number;
  capitalEnStock: number;
  inversionPendiente: number;
  rotacion: { nombre: string; unidades: number }[];
}

export function rangoPeriodo(periodo: Periodo): RangoPeriodo {
  if (periodo.anual) {
    return {
      desde: new Date(periodo.anio, 0, 1).getTime(),
      hasta: new Date(periodo.anio + 1, 0, 1).getTime(),
    };
  }
  const mes = (periodo.mes ?? 1) - 1;
  return {
    desde: new Date(periodo.anio, mes, 1).getTime(),
    hasta: new Date(periodo.anio, mes + 1, 1).getTime(),
  };
}

export function calcularReporte(
  ventas: VentaConItems[],
  pedidos: PedidoConItems[],
  productos: Producto[],
  marcados: Producto[],
): ResultadoReporte {
  const pedidosQueCuentan = pedidos.filter(cuentaEnReportes);

  const gananciaBruta =
    ventas.reduce((acc, v) => acc + v.total, 0) + pedidosQueCuentan.reduce((acc, p) => acc + p.total, 0);

  const margen = (cantidad: number, ventaPrecio: number, compra: number) => cantidad * (ventaPrecio - compra);
  const gananciaNeta =
    ventas.reduce(
      (acc, v) => acc + v.items.reduce((a, i) => a + margen(i.cantidad, i.precio_venta, i.precio_compra), 0),
      0,
    ) +
    pedidosQueCuentan.reduce(
      (acc, p) => acc + p.items.reduce((a, i) => a + margen(i.cantidad, i.precio_unitario, i.precio_compra), 0),
      0,
    );

  const capitalEnStock = productos.reduce((acc, p) => acc + p.cantidad_stock * p.precio_compra, 0);
  const inversionPendiente = marcados.reduce((acc, p) => acc + p.stock_minimo * p.precio_compra, 0);

  const unidades = new Map<string, number>();
  for (const v of ventas) {
    for (const i of v.items) unidades.set(i.nombre_producto, (unidades.get(i.nombre_producto) ?? 0) + i.cantidad);
  }
  for (const p of pedidosQueCuentan) {
    for (const i of p.items) unidades.set(i.nombre_producto, (unidades.get(i.nombre_producto) ?? 0) + i.cantidad);
  }
  const rotacion = [...unidades.entries()]
    .map(([nombre, u]) => ({ nombre, unidades: u }))
    .sort((a, b) => b.unidades - a.unidades || a.nombre.localeCompare(b.nombre, "es"));

  return { gananciaBruta, gananciaNeta, capitalEnStock, inversionPendiente, rotacion };
}
