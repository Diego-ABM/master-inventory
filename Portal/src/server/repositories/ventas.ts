import type { NuevoVentaItem, VentaConItems, VentaItem } from "@/lib/domain/tipos";
import { abrirDb, aObjeto, aObjetos } from "@/server/db";

export const ventaRepo = {
  crear(venta: { fecha: number; total: number }, item: NuevoVentaItem): number {
    const db = abrirDb();
    const resultado = db.prepare("INSERT INTO ventas (fecha, total) VALUES (?, ?)").run(venta.fecha, venta.total);
    const ventaId = Number(resultado.lastInsertRowid);
    db.prepare(
      `INSERT INTO venta_items (venta_id, producto_id, nombre_producto, cantidad, precio_compra, precio_venta)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(ventaId, item.producto_id, item.nombre_producto, item.cantidad, item.precio_compra, item.precio_venta);
    return ventaId;
  },

  listar(rango?: { desde: number; hasta: number }): VentaConItems[] {
    const db = abrirDb();
    const ventas = rango
      ? aObjetos<Omit<VentaConItems, "items">>(
          db
            .prepare("SELECT * FROM ventas WHERE fecha >= ? AND fecha < ? ORDER BY fecha DESC")
            .all(rango.desde, rango.hasta),
        )
      : aObjetos<Omit<VentaConItems, "items">>(db.prepare("SELECT * FROM ventas ORDER BY fecha DESC").all());

    const stmtItems = db.prepare("SELECT * FROM venta_items WHERE venta_id = ? ORDER BY id");
    return ventas.map((v) => ({ ...v, items: aObjetos<VentaItem>(stmtItems.all(v.id)) }));
  },

  eliminar(id: number): VentaConItems | null {
    const db = abrirDb();
    const venta = aObjeto<Omit<VentaConItems, "items">>(db.prepare("SELECT * FROM ventas WHERE id = ?").get(id));
    if (!venta) return null;
    const items = aObjetos<VentaItem>(db.prepare("SELECT * FROM venta_items WHERE venta_id = ?").all(id));
    db.prepare("DELETE FROM ventas WHERE id = ?").run(id);
    return { ...venta, items };
  },

  unidadesPorProducto(desde: number, hasta: number): { nombre: string; unidades: number }[] {
    return aObjetos<{ nombre: string; unidades: number }>(
      abrirDb()
        .prepare(
          `SELECT vi.nombre_producto AS nombre, SUM(vi.cantidad) AS unidades
           FROM venta_items vi JOIN ventas v ON v.id = vi.venta_id
           WHERE v.fecha >= ? AND v.fecha < ?
           GROUP BY vi.nombre_producto ORDER BY unidades DESC`,
        )
        .all(desde, hasta),
    );
  },
};
