import { cargarSemilla } from "@/data/seed";
import { transaccion } from "@/server/db";
import { fotoRepo } from "@/server/repositories/fotos";
import { logRepo } from "@/server/repositories/logs";
import { metaRepo } from "@/server/repositories/meta";
import { productoRepo } from "@/server/repositories/productos";

export async function cargarSemillaInicial(): Promise<void> {
  const yaCargada = (await metaRepo.leer("semilla_cargada")) === "1" || (await productoRepo.hayProductos());
  if (yaCargada) return;

  await transaccion(async (db) => {
    if (await productoRepo.hayProductos(db)) return;
    const productos = cargarSemilla();
    for (const item of productos) {
      const variante = item.tipoArena ? [item.variante, item.tipoArena].filter(Boolean).join(" · ") : item.variante;
      const id = await productoRepo.crear(
        {
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio_venta: item.precio,
          precio_compra: Math.round(item.precio * 0.7),
          cantidad_stock: item.cantidadStock,
          stock_minimo: item.stockMinimo,
          mascota: item.mascota,
          categoria: item.categoria,
          fecha_vencimiento: item.fechaVencimiento ?? null,
          peso_kg: item.pesoKg ?? null,
          variante,
          nota_advertencia: item.nota,
        },
        db,
      );
      for (const [orden, archivo] of item.fotos.entries()) {
        await fotoRepo.agregar(id, `/seed/images/${archivo}`, orden, null, null, db);
      }
    }
    await metaRepo.escribir("semilla_cargada", "1", db);
  });

  await logRepo.registrar("INFO", "seed", "Catálogo inicial cargado.");
}
