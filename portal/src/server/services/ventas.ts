"use server";

import { revalidatePath } from "next/cache";

import { validarCantidad } from "@/lib/domain/stock";
import type { ItemVentaInput, NuevoVentaItem } from "@/lib/domain/tipos";
import { calcularTotalVentaMulti } from "@/lib/domain/ventas";
import { transaccion } from "@/server/db";
import { logRepo } from "@/server/repositories/logs";
import { productoRepo } from "@/server/repositories/productos";
import { ventaRepo } from "@/server/repositories/ventas";

const MODULO = "ventas";

type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; mensaje: string };

function fallo(mensaje: string, error?: unknown): Resultado<never> {
  if (error) logRepo.registrarSeguro("ERROR", MODULO, mensaje, String(error));
  return { ok: false, mensaje };
}

export async function registrarVenta(items: ItemVentaInput[]): Promise<Resultado<{ id: number }>> {
  if (!Array.isArray(items) || items.length === 0) return fallo("Agrega al menos un producto a la venta.");
  for (const item of items) {
    if (!Number.isInteger(item.producto_id) || item.producto_id <= 0) return fallo("El producto no es válido.");
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0)
      return fallo("La cantidad debe ser un entero mayor que cero.");
  }

  const consolidados = new Map<number, number>();
  for (const item of items) {
    consolidados.set(item.producto_id, (consolidados.get(item.producto_id) ?? 0) + item.cantidad);
  }

  try {
    const { id, numItems } = await transaccion(async (db) => {
      const itemsVenta: NuevoVentaItem[] = [];
      for (const [productoId, cantidad] of consolidados) {
        const producto = await productoRepo.obtener(productoId, db);
        if (!producto) throw new Error("PRODUCTO_NO_EXISTE");
        if (!validarCantidad(cantidad, producto.cantidad_stock))
          throw new Error(`CANTIDAD_INVALIDA:${producto.nombre}`);
        await productoRepo.ajustarStock(productoId, -cantidad, db);
        itemsVenta.push({
          producto_id: producto.id,
          nombre_producto: producto.nombre,
          cantidad,
          precio_compra: producto.precio_compra,
          precio_venta: producto.precio_venta,
        });
      }
      const id = await ventaRepo.crear(
        { fecha: Date.now(), total: calcularTotalVentaMulti(itemsVenta) },
        itemsVenta,
        db,
      );
      return { id, numItems: itemsVenta.length };
    });
    await logRepo.registrar("INFO", MODULO, `Venta ${id} registrada (${numItems} ítem(s)).`);
    revalidatePath("/dashboard/ventas");
    revalidatePath("/dashboard/inventario");
    revalidatePath("/dashboard/favoritos");
    revalidatePath("/dashboard/reportes");
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCTO_NO_EXISTE") return fallo("El producto no existe.");
    if (error instanceof Error && error.message.startsWith("CANTIDAD_INVALIDA:"))
      return fallo(
        `La cantidad debe ser mayor que cero y no puede superar el stock disponible (${error.message.slice(18)}).`,
      );
    return fallo("No se pudo registrar la venta.", error);
  }
}

export async function eliminarVenta(id: number): Promise<Resultado> {
  try {
    await transaccion(async (db) => {
      const eliminada = await ventaRepo.eliminar(id, db);
      if (!eliminada) throw new Error("VENTA_NO_EXISTE");
      for (const item of eliminada.items) {
        if (item.producto_id != null && (await productoRepo.obtener(item.producto_id, db))) {
          await productoRepo.ajustarStock(item.producto_id, item.cantidad, db);
        }
      }
    });
    await logRepo.registrar("INFO", MODULO, `Venta ${id} eliminada; stock repuesto.`);
    revalidatePath("/dashboard/ventas");
    revalidatePath("/dashboard/inventario");
    revalidatePath("/dashboard/favoritos");
    revalidatePath("/dashboard/reportes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "VENTA_NO_EXISTE") return fallo("La venta no existe.");
    return fallo("No se pudo eliminar la venta.", error);
  }
}
