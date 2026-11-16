import { cargarSemilla } from "@/data/seed";
import { transaccion } from "@/server/db";
import { fotoRepo } from "@/server/repositories/fotos";
import { logRepo } from "@/server/repositories/logs";
import { metaRepo } from "@/server/repositories/meta";
import { productoRepo } from "@/server/repositories/productos";

export function cargarSemillaInicial(): void {
  if (metaRepo.leer("semilla_cargada") === "1" || productoRepo.hayProductos()) return;

  transaccion(() => {
    if (productoRepo.hayProductos()) return;
    const productos = cargarSemilla();
    for (const item of productos) {
      const variante = item.tipoArena ? [item.variante, item.tipoArena].filter(Boolean).join(" · ") : item.variante;
      const id = productoRepo.crear({
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
      });
      item.fotos.forEach((archivo, orden) => {
        fotoRepo.agregar(id, `/seed/images/${archivo}`, orden);
      });
    }
    metaRepo.escribir("semilla_cargada", "1");
  });

  logRepo.registrar("INFO", "seed", "Catálogo inicial cargado.");
}
