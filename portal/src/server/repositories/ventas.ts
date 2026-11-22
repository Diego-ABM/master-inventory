import type { NuevoVentaItem, VentaConItems, VentaItem } from "@/lib/domain/tipos";
import { abrirDb, aObjeto, aObjetos, type Sql } from "@/server/db";

export const ventaRepo = {
  async crear(venta: { fecha: number; total: number }, items: NuevoVentaItem[], sql?: Sql): Promise<number> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`
      INSERT INTO ventas (fecha, total) VALUES (${venta.fecha}, ${venta.total}) RETURNING id`;
    const ventaId = Number(fila.id);
    for (const item of items) {
      await db`
        INSERT INTO venta_items (venta_id, producto_id, nombre_producto, cantidad, precio_compra, precio_venta)
        VALUES (${ventaId}, ${item.producto_id}, ${item.nombre_producto}, ${item.cantidad},
          ${item.precio_compra}, ${item.precio_venta})`;
    }
    return ventaId;
  },

  async listar(rango?: { desde: number; hasta: number }, sql?: Sql): Promise<VentaConItems[]> {
    const db = sql ?? (await abrirDb());
    const ventas = rango
      ? aObjetos<Omit<VentaConItems, "items">>(
          await db`SELECT * FROM ventas WHERE fecha >= ${rango.desde} AND fecha < ${rango.hasta} ORDER BY fecha DESC`,
        )
      : aObjetos<Omit<VentaConItems, "items">>(await db`SELECT * FROM ventas ORDER BY fecha DESC`);

    return Promise.all(
      ventas.map(async (v) => ({
        ...v,
        items: aObjetos<VentaItem>(await db`SELECT * FROM venta_items WHERE venta_id = ${v.id} ORDER BY id`),
      })),
    );
  },

  async eliminar(id: number, sql?: Sql): Promise<VentaConItems | null> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`SELECT * FROM ventas WHERE id = ${id}`;
    const venta = aObjeto<Omit<VentaConItems, "items">>(fila);
    if (!venta) return null;
    const items = aObjetos<VentaItem>(await db`SELECT * FROM venta_items WHERE venta_id = ${id}`);
    await db`DELETE FROM ventas WHERE id = ${id}`;
    return { ...venta, items };
  },

  async unidadesPorProducto(desde: number, hasta: number, sql?: Sql): Promise<{ nombre: string; unidades: number }[]> {
    const db = sql ?? (await abrirDb());
    const filas = await db`
      SELECT vi.nombre_producto AS nombre, SUM(vi.cantidad) AS unidades
      FROM venta_items vi JOIN ventas v ON v.id = vi.venta_id
      WHERE v.fecha >= ${desde} AND v.fecha < ${hasta}
      GROUP BY vi.nombre_producto ORDER BY unidades DESC`;
    return filas.map((f) => ({ nombre: f.nombre as string, unidades: Number(f.unidades) }));
  },
};
