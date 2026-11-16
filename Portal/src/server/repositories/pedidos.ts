import type { NuevoPedido, NuevoPedidoItem, PedidoCliente, PedidoConItems, PedidoItem } from "@/lib/domain/tipos";
import { abrirDb, aObjeto, aObjetos } from "@/server/db";

interface FiltroPedidos {
  entregado?: boolean;
  pagado?: boolean;
}

export const pedidoRepo = {
  crear(pedido: NuevoPedido, items: NuevoPedidoItem[]): number {
    const db = abrirDb();
    const resultado = db
      .prepare("INSERT INTO pedidos_clientes (nombre_cliente, contacto, fecha_pedido, total) VALUES (?, ?, ?, ?)")
      .run(pedido.nombre_cliente, pedido.contacto ?? null, pedido.fecha_pedido, pedido.total);
    const pedidoId = Number(resultado.lastInsertRowid);
    const stmt = db.prepare(
      `INSERT INTO pedido_cliente_items (pedido_id, producto_id, nombre_producto, cantidad, precio_compra, precio_unitario)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    for (const item of items) {
      stmt.run(
        pedidoId,
        item.producto_id,
        item.nombre_producto,
        item.cantidad,
        item.precio_compra,
        item.precio_unitario,
      );
    }
    return pedidoId;
  },

  obtener(id: number): PedidoConItems | null {
    const db = abrirDb();
    const pedido = aObjeto<PedidoCliente>(db.prepare("SELECT * FROM pedidos_clientes WHERE id = ?").get(id));
    if (!pedido) return null;
    const items = aObjetos<PedidoItem>(
      db.prepare("SELECT * FROM pedido_cliente_items WHERE pedido_id = ? ORDER BY id").all(id),
    );
    return { ...pedido, items };
  },

  listar(filtro: FiltroPedidos = {}): PedidoConItems[] {
    const db = abrirDb();
    const condiciones: string[] = [];
    const params: number[] = [];
    if (filtro.entregado !== undefined) {
      condiciones.push("entregado = ?");
      params.push(filtro.entregado ? 1 : 0);
    }
    if (filtro.pagado !== undefined) {
      condiciones.push("pagado = ?");
      params.push(filtro.pagado ? 1 : 0);
    }
    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
    const pedidos = aObjetos<PedidoCliente>(
      db.prepare(`SELECT * FROM pedidos_clientes ${where} ORDER BY fecha_pedido DESC`).all(...params),
    );
    const stmtItems = db.prepare("SELECT * FROM pedido_cliente_items WHERE pedido_id = ? ORDER BY id");
    return pedidos.map((p) => ({ ...p, items: aObjetos<PedidoItem>(stmtItems.all(p.id)) }));
  },

  cambiarEntregado(id: number, entregado: boolean, stockDescontado: boolean): void {
    abrirDb()
      .prepare("UPDATE pedidos_clientes SET entregado = ?, stock_descontado = ? WHERE id = ?")
      .run(entregado ? 1 : 0, stockDescontado ? 1 : 0, id);
  },

  cambiarPagado(id: number, pagado: boolean): void {
    abrirDb()
      .prepare("UPDATE pedidos_clientes SET pagado = ? WHERE id = ?")
      .run(pagado ? 1 : 0, id);
  },

  eliminar(id: number): void {
    abrirDb().prepare("DELETE FROM pedidos_clientes WHERE id = ?").run(id);
  },

  retirarItemsDeProducto(productoId: number): number[] {
    const db = abrirDb();
    const afectados = aObjetos<{ pedido_id: number }>(
      db
        .prepare(
          `SELECT DISTINCT pci.pedido_id AS pedido_id
           FROM pedido_cliente_items pci
           JOIN pedidos_clientes p ON p.id = pci.pedido_id
           WHERE pci.producto_id = ? AND p.entregado = 0`,
        )
        .all(productoId),
    );

    db.prepare(
      `DELETE FROM pedido_cliente_items
       WHERE producto_id = ?
         AND pedido_id IN (SELECT id FROM pedidos_clientes WHERE entregado = 0)`,
    ).run(productoId);

    for (const { pedido_id } of afectados) {
      db.prepare(
        `UPDATE pedidos_clientes SET total = COALESCE((
           SELECT SUM(cantidad * precio_unitario) FROM pedido_cliente_items WHERE pedido_id = ?
         ), 0) WHERE id = ?`,
      ).run(pedido_id, pedido_id);
    }

    return afectados.map((f) => f.pedido_id);
  },

  listarEntregadosPagados(desde: number, hasta: number): PedidoConItems[] {
    const db = abrirDb();
    const pedidos = aObjetos<PedidoCliente>(
      db
        .prepare(
          "SELECT * FROM pedidos_clientes WHERE entregado = 1 AND pagado = 1 AND fecha_pedido >= ? AND fecha_pedido < ? ORDER BY fecha_pedido",
        )
        .all(desde, hasta),
    );
    const stmtItems = db.prepare("SELECT * FROM pedido_cliente_items WHERE pedido_id = ? ORDER BY id");
    return pedidos.map((p) => ({ ...p, items: aObjetos<PedidoItem>(stmtItems.all(p.id)) }));
  },

  unidadesPagadasPorProducto(desde: number, hasta: number): { nombre: string; unidades: number }[] {
    return aObjetos<{ nombre: string; unidades: number }>(
      abrirDb()
        .prepare(
          `SELECT pci.nombre_producto AS nombre, SUM(pci.cantidad) AS unidades
           FROM pedido_cliente_items pci
           JOIN pedidos_clientes p ON p.id = pci.pedido_id
           WHERE p.entregado = 1 AND p.pagado = 1 AND p.fecha_pedido >= ? AND p.fecha_pedido < ?
           GROUP BY pci.nombre_producto ORDER BY unidades DESC`,
        )
        .all(desde, hasta),
    );
  },
};
