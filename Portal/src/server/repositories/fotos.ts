import type { FotoProducto } from "@/lib/domain/tipos";
import { abrirDb, aObjeto } from "@/server/db";

export const fotoRepo = {
  agregar(productoId: number, ruta: string, orden: number): number {
    const db = abrirDb();
    const actual = fotoRepo.contarPorProducto(productoId);
    if (actual >= 5) {
      throw new Error("El producto ya tiene el máximo de 5 fotos.");
    }
    const resultado = db
      .prepare("INSERT INTO fotos_producto (producto_id, ruta_archivo, orden) VALUES (?, ?, ?)")
      .run(productoId, ruta, orden);
    return Number(resultado.lastInsertRowid);
  },

  obtener(fotoId: number): FotoProducto | null {
    return aObjeto<FotoProducto>(abrirDb().prepare("SELECT * FROM fotos_producto WHERE id = ?").get(fotoId));
  },

  quitar(fotoId: number): void {
    abrirDb().prepare("DELETE FROM fotos_producto WHERE id = ?").run(fotoId);
  },

  actualizarRuta(fotoId: number, ruta: string): void {
    abrirDb().prepare("UPDATE fotos_producto SET ruta_archivo = ? WHERE id = ?").run(ruta, fotoId);
  },

  contarPorProducto(productoId: number): number {
    const fila = abrirDb()
      .prepare("SELECT COUNT(*) AS total FROM fotos_producto WHERE producto_id = ?")
      .get(productoId) as { total: number };
    return fila.total;
  },
};
