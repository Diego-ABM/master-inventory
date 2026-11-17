"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { calcularTotalPedido, debeDescontarStock, etiquetaItemProducto, puedeEliminarse } from "@/lib/domain/pedidos";
import { validarCantidad } from "@/lib/domain/stock";
import { transaccion } from "@/server/db";
import { logRepo } from "@/server/repositories/logs";
import { pedidoRepo } from "@/server/repositories/pedidos";
import { productoRepo } from "@/server/repositories/productos";

const MODULO = "pedidos";

type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; mensaje: string };

function fallo(mensaje: string, error?: unknown): Resultado<never> {
  if (error) logRepo.registrarSeguro("ERROR", MODULO, mensaje, String(error));
  return { ok: false, mensaje };
}

const esquemaItem = z.object({
  producto_id: z.number().int().positive().nullable(),
  nombre_producto: z.string().trim().min(1),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().int().min(0).optional(),
});

const esquemaPedido = z.object({
  nombre_cliente: z.string().trim().min(1, "El nombre del cliente es obligatorio."),
  contacto: z.string().trim().optional(),
  items: z.array(esquemaItem).min(1, "El pedido necesita al menos un ítem."),
});

function revalidar() {
  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/favoritos");
  revalidatePath("/dashboard/reportes");
}

export async function crearPedido(entrada: unknown): Promise<Resultado<{ id: number }>> {
  const datos = esquemaPedido.safeParse(entrada);
  if (!datos.success) return fallo(datos.error.issues[0]?.message ?? "Datos no válidos.");

  try {
    const id = await transaccion(async (db) => {
      const items = await Promise.all(
        datos.data.items.map(async (item) => {
          if (item.producto_id == null) {
            return { ...item, precio_compra: 0, precio_unitario: item.precio_unitario ?? 0 };
          }
          const producto = await productoRepo.obtener(item.producto_id, db);
          if (!producto) throw new Error("PRODUCTO_NO_EXISTE");
          if (!validarCantidad(item.cantidad, producto.cantidad_stock)) throw new Error("CANTIDAD_INVALIDA");
          return {
            producto_id: producto.id,
            nombre_producto: etiquetaItemProducto(producto),
            cantidad: item.cantidad,
            precio_compra: producto.precio_compra,
            precio_unitario: producto.precio_venta,
          };
        }),
      );
      return pedidoRepo.crear(
        {
          nombre_cliente: datos.data.nombre_cliente,
          contacto: datos.data.contacto || null,
          fecha_pedido: Date.now(),
          total: calcularTotalPedido(items),
        },
        items,
        db,
      );
    });
    await logRepo.registrar("INFO", MODULO, `Pedido ${id} creado para ${datos.data.nombre_cliente}.`);
    revalidar();
    return { ok: true, data: { id } };
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCTO_NO_EXISTE")
      return fallo("Uno de los productos del pedido ya no existe.");
    if (error instanceof Error && error.message === "CANTIDAD_INVALIDA")
      return fallo("La cantidad de un ítem supera el stock disponible.");
    return fallo("No se pudo crear el pedido.", error);
  }
}

export async function cambiarEntregado(id: number, entregado: boolean): Promise<Resultado<{ aviso?: string }>> {
  try {
    const aviso = await transaccion(async (db) => {
      const pedido = await pedidoRepo.obtener(id, db);
      if (!pedido) throw new Error("PEDIDO_NO_EXISTE");
      let mensaje: string | undefined;

      if (entregado && debeDescontarStock({ ...pedido, entregado: 1 })) {
        for (const item of pedido.items) {
          if (item.producto_id == null) continue;
          const producto = await productoRepo.obtener(item.producto_id, db);
          if (producto) await productoRepo.ajustarStock(item.producto_id, -item.cantidad, db);
        }
        await pedidoRepo.cambiarEntregado(id, true, true, db);
      } else {
        if (!entregado && pedido.stock_descontado === 1) {
          mensaje = "El stock no se repone automáticamente; corrígelo de forma manual con +/− si hace falta.";
        }
        await pedidoRepo.cambiarEntregado(id, entregado, pedido.stock_descontado === 1, db);
      }
      return mensaje;
    });
    await logRepo.registrar("INFO", MODULO, `Pedido ${id} ${entregado ? "entregado" : "marcado pendiente"}.`);
    revalidar();
    return { ok: true, data: { aviso } };
  } catch (error) {
    if (error instanceof Error && error.message === "PEDIDO_NO_EXISTE") return fallo("El pedido no existe.");
    return fallo("No se pudo actualizar el pedido.", error);
  }
}

export async function cambiarPagado(id: number, pagado: boolean): Promise<Resultado> {
  try {
    await transaccion(async (db) => {
      const pedido = await pedidoRepo.obtener(id, db);
      if (!pedido) throw new Error("PEDIDO_NO_EXISTE");
      await pedidoRepo.cambiarPagado(id, pagado, db);
    });
    await logRepo.registrar("INFO", MODULO, `Pedido ${id} ${pagado ? "pagado" : "pago pendiente"}.`);
    revalidar();
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "PEDIDO_NO_EXISTE") return fallo("El pedido no existe.");
    return fallo("No se pudo actualizar el pedido.", error);
  }
}

export async function eliminarPedido(id: number): Promise<Resultado> {
  try {
    await transaccion(async (db) => {
      const pedido = await pedidoRepo.obtener(id, db);
      if (!pedido) throw new Error("PEDIDO_NO_EXISTE");
      if (!puedeEliminarse(pedido)) throw new Error("PEDIDO_ENTREGADO");
      await pedidoRepo.eliminar(id, db);
    });
    await logRepo.registrar("INFO", MODULO, `Pedido ${id} eliminado.`);
    revalidar();
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "PEDIDO_NO_EXISTE") return fallo("El pedido no existe.");
    if (error instanceof Error && error.message === "PEDIDO_ENTREGADO")
      return fallo("Un pedido entregado no se puede eliminar.");
    return fallo("No se pudo eliminar el pedido.", error);
  }
}
