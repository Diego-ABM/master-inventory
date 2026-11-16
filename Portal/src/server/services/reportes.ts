import { calcularReporte, type Periodo, type ResultadoReporte, rangoPeriodo } from "@/lib/domain/reportes";
import { pedidoRepo } from "@/server/repositories/pedidos";
import { productoRepo } from "@/server/repositories/productos";
import { ventaRepo } from "@/server/repositories/ventas";

export async function obtenerReporte(periodo: Periodo): Promise<ResultadoReporte> {
  const { desde, hasta } = rangoPeriodo(periodo);
  const ventas = await ventaRepo.listar({ desde, hasta });
  const pedidos = await pedidoRepo.listarEntregadosPagados(desde, hasta);
  const productos = await productoRepo.listarTodos();
  const marcados = await productoRepo.listarPedidoProveedor();
  return calcularReporte(ventas, pedidos, productos, marcados);
}

export function periodoDesdeParametros(params: { periodo?: string; anual?: string }): Periodo | null {
  const periodo = params.periodo ?? "";
  if (params.anual === "1") {
    const anio = Number(periodo);
    return Number.isInteger(anio) && anio > 0 ? { anual: true, anio } : null;
  }
  const match = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (!match) return null;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  return mes >= 1 && mes <= 12 ? { anual: false, anio, mes } : null;
}
