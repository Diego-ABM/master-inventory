"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { normalizarNumero } from "@/lib/domain/moneda";
import { CATEGORIAS, type DatosProducto, MASCOTAS } from "@/lib/domain/tipos";
import { transaccion } from "@/server/db";
import { fotoRepo } from "@/server/repositories/fotos";
import { logRepo } from "@/server/repositories/logs";
import { pedidoRepo } from "@/server/repositories/pedidos";
import { productoRepo } from "@/server/repositories/productos";

import path from "node:path";

const MODULO = "productos";
const EXTENSIONES_FOTO = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MIME_FOTO: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; mensaje: string };

function fallo(mensaje: string, error?: unknown): Resultado<never> {
  if (error) logRepo.registrarSeguro("ERROR", MODULO, mensaje, String(error));
  return { ok: false, mensaje };
}

const esquemaProducto = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  descripcion: z.string().optional().default(""),
  precio_venta: z.number().int().min(0),
  precio_compra: z.number().int().min(0).optional().default(0),
  cantidad_stock: z.number().int().min(0).optional().default(0),
  stock_minimo: z.number().int().min(0).optional().default(3),
  mascota: z.enum(MASCOTAS).optional().default("UNISEX"),
  categoria: z.enum(CATEGORIAS).optional().default("ACCESORIOS"),
  fecha_vencimiento: z.number().int().nullable().optional(),
  peso_kg: z.number().nullable().optional(),
  variante: z.string().nullable().optional(),
  nota_advertencia: z.string().nullable().optional(),
});

function revalidarInventario() {
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/favoritos");
  revalidatePath("/dashboard/alertas");
  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard/reportes");
}

export async function crearProducto(entrada: unknown): Promise<Resultado<{ id: number }>> {
  const datos = esquemaProducto.safeParse(entrada);
  if (!datos.success) return fallo(datos.error.issues[0]?.message ?? "Datos no válidos.");
  try {
    const id = await transaccion((db) => productoRepo.crear(datos.data, db));
    await logRepo.registrar("INFO", MODULO, `Producto creado: ${datos.data.nombre} (id ${id}).`);
    revalidarInventario();
    return { ok: true, data: { id } };
  } catch (error) {
    return fallo("No se pudo crear el producto.", error);
  }
}

export async function actualizarProducto(id: number, entrada: unknown): Promise<Resultado> {
  const datos = esquemaProducto.safeParse(entrada);
  if (!datos.success) return fallo(datos.error.issues[0]?.message ?? "Datos no válidos.");
  try {
    await transaccion((db) => productoRepo.actualizar(id, datos.data as DatosProducto, db));
    await logRepo.registrar("INFO", MODULO, `Producto ${id} actualizado.`);
    revalidarInventario();
    return { ok: true };
  } catch (error) {
    return fallo("No se pudo actualizar el producto.", error);
  }
}

export async function eliminarProducto(id: number): Promise<Resultado<{ pedidosAfectados: number[] }>> {
  try {
    const resultado = await transaccion(async (db) => {
      const producto = await productoRepo.obtener(id, db);
      if (!producto) throw new Error("El producto no existe.");

      const pedidosAfectados = await pedidoRepo.retirarItemsDeProducto(id, db);
      await productoRepo.eliminar(id, db);
      return { pedidosAfectados, nombre: producto.nombre };
    });

    await logRepo.registrar(
      "INFO",
      MODULO,
      `Producto eliminado: ${resultado.nombre}. Pedidos pendientes afectados: ${resultado.pedidosAfectados.length}.`,
    );
    revalidarInventario();
    revalidatePath("/dashboard/ventas");
    return { ok: true, data: { pedidosAfectados: resultado.pedidosAfectados } };
  } catch (error) {
    return fallo("No se pudo eliminar el producto.", error);
  }
}

export async function ajustarStock(id: number, delta: number): Promise<Resultado> {
  const ajuste = normalizarNumero(delta);
  if (ajuste === 0) return fallo("El ajuste debe ser distinto de cero.");
  try {
    await transaccion((db) => productoRepo.ajustarStock(id, ajuste, db));
    revalidarInventario();
    return { ok: true };
  } catch (error) {
    return fallo("No se pudo ajustar el stock.", error);
  }
}

export async function marcarFavorito(id: number, es: boolean): Promise<Resultado> {
  try {
    await transaccion((db) => productoRepo.marcarFavorito(id, es, db));
    revalidarInventario();
    return { ok: true };
  } catch (error) {
    return fallo("No se pudo actualizar el favorito.", error);
  }
}

export async function marcarPedidoProveedor(id: number, pedir: boolean, nota?: string): Promise<Resultado> {
  try {
    await transaccion((db) => productoRepo.marcarPedidoProveedor(id, pedir, nota, db));
    revalidarInventario();
    revalidatePath("/dashboard/reportes");
    return { ok: true };
  } catch (error) {
    return fallo("No se pudo actualizar el marcado al proveedor.", error);
  }
}

export async function agregarFoto(productoId: number, formData: FormData): Promise<Resultado<{ id: number }>> {
  const archivo = formData.get("foto");
  if (!(archivo instanceof File)) return fallo("No se recibió ningún archivo.");
  const ext = path.extname(archivo.name).toLowerCase();
  if (!EXTENSIONES_FOTO.has(ext)) return fallo("Solo se permiten imágenes png, jpg, jpeg o webp.");

  try {
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const mime = archivo.type || MIME_FOTO[ext];
    const fotoId = await transaccion(async (db) => {
      const orden = await fotoRepo.contarPorProducto(productoId, db);
      const id = await fotoRepo.agregar(productoId, "/api/fotos/pendiente", orden, bytes, mime, db);
      await fotoRepo.actualizarRuta(id, `/api/fotos/${id}${ext}`, db);
      return id;
    });
    await logRepo.registrar("INFO", MODULO, `Foto agregada al producto ${productoId}.`);
    revalidarInventario();
    return { ok: true, data: { id: fotoId } };
  } catch (error) {
    if (error instanceof Error && error.message.includes("5 fotos")) {
      return fallo("El producto ya tiene el máximo de 5 fotos.");
    }
    return fallo("No se pudo agregar la foto.", error);
  }
}

export async function quitarFoto(fotoId: number): Promise<Resultado> {
  try {
    await transaccion(async (db) => {
      const foto = await fotoRepo.obtener(fotoId, db);
      if (!foto) throw new Error("La foto no existe.");
      await fotoRepo.quitar(fotoId, db);
    });
    revalidarInventario();
    return { ok: true };
  } catch (error) {
    return fallo("No se pudo quitar la foto.", error);
  }
}
