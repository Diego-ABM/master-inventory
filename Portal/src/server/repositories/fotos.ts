import type { FotoProducto } from "@/lib/domain/tipos";
import { abrirDb, aObjeto, type Sql } from "@/server/db";

export const fotoRepo = {
  async agregar(
    productoId: number,
    ruta: string,
    orden: number,
    datos: Uint8Array | null = null,
    mime: string | null = null,
    sql?: Sql,
  ): Promise<number> {
    const db = sql ?? (await abrirDb());
    const actual = await fotoRepo.contarPorProducto(productoId, db);
    if (actual >= 5) {
      throw new Error("El producto ya tiene el máximo de 5 fotos.");
    }
    const [fila] = await db`
      INSERT INTO fotos_producto (producto_id, ruta_archivo, orden, datos, mime)
      VALUES (${productoId}, ${ruta}, ${orden}, ${datos}, ${mime})
      RETURNING id`;
    return Number(fila.id);
  },

  async obtener(fotoId: number, sql?: Sql): Promise<FotoProducto | null> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`
      SELECT id, producto_id, ruta_archivo, orden FROM fotos_producto WHERE id = ${fotoId}`;
    return aObjeto<FotoProducto>(fila);
  },

  async obtenerDatosPorRuta(ruta: string): Promise<{ datos: Uint8Array; mime: string | null } | null> {
    const db = await abrirDb();
    const [fila] = await db`SELECT datos, mime FROM fotos_producto WHERE ruta_archivo = ${ruta}`;
    if (!fila?.datos) return null;
    return { datos: fila.datos as Uint8Array, mime: fila.mime as string | null };
  },

  async quitar(fotoId: number, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`DELETE FROM fotos_producto WHERE id = ${fotoId}`;
  },

  async actualizarRuta(fotoId: number, ruta: string, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`UPDATE fotos_producto SET ruta_archivo = ${ruta} WHERE id = ${fotoId}`;
  },

  async contarPorProducto(productoId: number, sql?: Sql): Promise<number> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`SELECT COUNT(*) AS total FROM fotos_producto WHERE producto_id = ${productoId}`;
    return Number(fila.total);
  },
};
