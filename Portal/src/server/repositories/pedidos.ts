import type { NuevoPedido, NuevoPedidoItem, PedidoCliente, PedidoConItems, PedidoItem } from "@/lib/domain/tipos";
import { abrirDb, aObjeto, aObjetos, type Sql } from "@/server/db";

interface FiltroPedidos {
  entregado?: boolean;
  pagado?: boolean;
}

export const pedidoRepo = {
  async crear(pedido: NuevoPedido, items: NuevoPedidoItem[], sql?: Sql): Promise<number> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`
      INSERT INTO pedidos_clientes (nombre_cliente, contacto, fecha_pedido, total)
      VALUES (${pedido.nombre_cliente}, ${pedido.contacto ?? null}, ${pedido.fecha_pedido}, ${pedido.total})
      RETURNING id`;
    const pedidoId = Number(fila.id);
    for (const item of items) {
      await db`
        INSERT INTO pedido_cliente_items (pedido_id, producto_id, nombre_producto, cantidad, precio_compra, precio_unitario)
        VALUES (${pedidoId}, ${item.producto_id}, ${item.nombre_producto}, ${item.cantidad},
          ${item.precio_compra}, ${item.precio_unitario})`;
    }
    return pedidoId;
  },

  async obtener(id: number, sql?: Sql): Promise<PedidoConItems | null> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`SELECT * FROM pedidos_clientes WHERE id = ${id}`;
    const pedido = aObjeto<PedidoCliente>(fila);
    if (!pedido) return null;
    const filasItems = await db`SELECT * FROM pedido_cliente_items WHERE pedido_id = ${id} ORDER BY id`;
    return { ...pedido, items: aObjetos<PedidoItem>(filasItems) };
  },

  async listar(filtro: FiltroPedidos = {}, sql?: Sql): Promise<PedidoConItems[]> {
    const db = sql ?? (await abrirDb());
    const condiciones: string[] = [];
    const params: number[] = [];
    if (filtro.entregado !== undefined) {
      params.push(filtro.entregado ? 1 : 0);
      condiciones.push(`entregado = $${params.length}`);
    }
    if (filtro.pagado !== undefined) {
      params.push(filtro.pagado ? 1 : 0);
      condiciones.push(`pagado = $${params.length}`);
    }
    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
    const pedidos = aObjetos<PedidoCliente>(
      await db.unsafe(`SELECT * FROM pedidos_clientes ${where} ORDER BY fecha_pedido DESC`, params),
    );
    return Promise.all(
      pedidos.map(async (p) => ({
        ...p,
        items: aObjetos<PedidoItem>(await db`SELECT * FROM pedido_cliente_items WHERE pedido_id = ${p.id} ORDER BY id`),
      })),
    );
  },

  async cambiarEntregado(id: number, entregado: boolean, stockDescontado: boolean, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`
      UPDATE pedidos_clientes SET entregado = ${entregado ? 1 : 0}, stock_descontado = ${stockDescontado ? 1 : 0}
      WHERE id = ${id}`;
  },

  async cambiarPagado(id: number, pagado: boolean, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`UPDATE pedidos_clientes SET pagado = ${pagado ? 1 : 0} WHERE id = ${id}`;
  },

  async eliminar(id: number, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`DELETE FROM pedidos_clientes WHERE id = ${id}`;
  },

  async retirarItemsDeProducto(productoId: number, sql?: Sql): Promise<number[]> {
    const db = sql ?? (await abrirDb());
    const afectados = aObjetos<{ pedido_id: number }>(
      await db`
      SELECT DISTINCT pci.pedido_id AS pedido_id
      FROM pedido_cliente_items pci
      JOIN pedidos_clientes p ON p.id = pci.pedido_id
      WHERE pci.producto_id = ${productoId} AND p.entregado = 0`,
    );

    await db`
      DELETE FROM pedido_cliente_items
      WHERE producto_id = ${productoId}
        AND pedido_id IN (SELECT id FROM pedidos_clientes WHERE entregado = 0)`;

    for (const { pedido_id } of afectados) {
      await db`
        UPDATE pedidos_clientes SET total = COALESCE((
          SELECT SUM(cantidad * precio_unitario) FROM pedido_cliente_items WHERE pedido_id = ${pedido_id}
        ), 0) WHERE id = ${pedido_id}`;
    }

    return afectados.map((f) => f.pedido_id);
  },

  async listarEntregadosPagados(desde: number, hasta: number, sql?: Sql): Promise<PedidoConItems[]> {
    const db = sql ?? (await abrirDb());
    const pedidos = aObjetos<PedidoCliente>(
      await db`
      SELECT * FROM pedidos_clientes
      WHERE entregado = 1 AND pagado = 1 AND fecha_pedido >= ${desde} AND fecha_pedido < ${hasta}
      ORDER BY fecha_pedido`,
    );
    return Promise.all(
      pedidos.map(async (p) => ({
        ...p,
        items: aObjetos<PedidoItem>(await db`SELECT * FROM pedido_cliente_items WHERE pedido_id = ${p.id} ORDER BY id`),
      })),
    );
  },

  async unidadesPagadasPorProducto(
    desde: number,
    hasta: number,
    sql?: Sql,
  ): Promise<{ nombre: string; unidades: number }[]> {
    const db = sql ?? (await abrirDb());
    const filas = await db`
      SELECT pci.nombre_producto AS nombre, SUM(pci.cantidad) AS unidades
      FROM pedido_cliente_items pci
      JOIN pedidos_clientes p ON p.id = pci.pedido_id
      WHERE p.entregado = 1 AND p.pagado = 1 AND p.fecha_pedido >= ${desde} AND p.fecha_pedido < ${hasta}
      GROUP BY pci.nombre_producto ORDER BY unidades DESC`;
    return filas.map((f) => ({ nombre: f.nombre as string, unidades: Number(f.unidades) }));
  },
};
