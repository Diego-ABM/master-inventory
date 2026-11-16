import type {
  Categoria,
  DatosProducto,
  FotoProducto,
  Mascota,
  NuevoProducto,
  Producto,
  ProductoConFotos,
  ProductoListado,
} from "@/lib/domain/tipos";
import { abrirDb, aObjeto, aObjetos, type Sql } from "@/server/db";

interface FiltroProductos {
  texto?: string;
  mascota?: Mascota;
  categoria?: Categoria;
}

const CONSULTA_LISTADO = `SELECT p.*, (
  SELECT ruta_archivo FROM fotos_producto f WHERE f.producto_id = p.id ORDER BY f.orden, f.id LIMIT 1
) AS foto_principal FROM productos p`;

const ORDEN_NOMBRE = "ORDER BY LOWER(p.nombre)";

export const productoRepo = {
  async listar(filtro: FiltroProductos = {}, sql?: Sql): Promise<ProductoListado[]> {
    const db = sql ?? (await abrirDb());
    const condiciones: string[] = [];
    const params: (string | number)[] = [];

    if (filtro.texto?.trim()) {
      params.push(`%${filtro.texto.trim()}%`);
      condiciones.push(`p.nombre ILIKE $${params.length}`);
    }
    if (filtro.mascota) {
      params.push(filtro.mascota);
      condiciones.push(`p.mascota = $${params.length}`);
    }
    if (filtro.categoria) {
      params.push(filtro.categoria);
      condiciones.push(`p.categoria = $${params.length}`);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
    const filas = await db.unsafe(`${CONSULTA_LISTADO} ${where} ${ORDEN_NOMBRE}`, params);
    return aObjetos<ProductoListado>(filas);
  },

  async obtener(id: number, sql?: Sql): Promise<ProductoConFotos | null> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`SELECT * FROM productos WHERE id = ${id}`;
    const producto = aObjeto<Producto>(fila);
    if (!producto) return null;
    const filasFotos = await db`
      SELECT id, producto_id, ruta_archivo, orden FROM fotos_producto
      WHERE producto_id = ${id} ORDER BY orden, id`;
    return { ...producto, fotos: aObjetos<FotoProducto>(filasFotos) };
  },

  async crear(data: NuevoProducto, sql?: Sql): Promise<number> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`
      INSERT INTO productos (nombre, descripcion, precio_venta, precio_compra, cantidad_stock, stock_minimo,
        mascota, categoria, fecha_vencimiento, peso_kg, variante, nota_advertencia, fecha_actualizacion)
      VALUES (${data.nombre}, ${data.descripcion ?? ""}, ${data.precio_venta}, ${data.precio_compra ?? 0},
        ${data.cantidad_stock ?? 0}, ${data.stock_minimo ?? 3}, ${data.mascota ?? "UNISEX"},
        ${data.categoria ?? "ACCESORIOS"}, ${data.fecha_vencimiento ?? null}, ${data.peso_kg ?? null},
        ${data.variante ?? null}, ${data.nota_advertencia ?? null}, ${Date.now()})
      RETURNING id`;
    return Number(fila.id);
  },

  async actualizar(id: number, data: DatosProducto, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`
      UPDATE productos SET nombre = ${data.nombre}, descripcion = ${data.descripcion ?? ""},
        precio_venta = ${data.precio_venta}, precio_compra = ${data.precio_compra},
        cantidad_stock = ${data.cantidad_stock}, stock_minimo = ${data.stock_minimo},
        mascota = ${data.mascota}, categoria = ${data.categoria},
        fecha_vencimiento = ${data.fecha_vencimiento ?? null}, peso_kg = ${data.peso_kg ?? null},
        variante = ${data.variante ?? null}, nota_advertencia = ${data.nota_advertencia ?? null},
        fecha_actualizacion = ${Date.now()}
      WHERE id = ${id}`;
  },

  async ajustarStock(id: number, delta: number, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`
      UPDATE productos SET cantidad_stock = GREATEST(0, cantidad_stock + ${delta}),
        fecha_actualizacion = ${Date.now()}
      WHERE id = ${id}`;
  },

  async eliminar(id: number, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`DELETE FROM productos WHERE id = ${id}`;
  },

  async marcarFavorito(id: number, es: boolean, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`
      UPDATE productos SET es_favorito = ${es ? 1 : 0}, fecha_actualizacion = ${Date.now()}
      WHERE id = ${id}`;
  },

  async marcarPedidoProveedor(id: number, pedir: boolean, nota?: string, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`
      UPDATE productos SET pedir_al_proveedor = ${pedir ? 1 : 0}, nota_pedido = ${pedir ? (nota ?? null) : null},
        fecha_actualizacion = ${Date.now()}
      WHERE id = ${id}`;
  },

  async listarPedidoProveedor(sql?: Sql): Promise<ProductoListado[]> {
    const db = sql ?? (await abrirDb());
    return aObjetos<ProductoListado>(
      await db.unsafe(`${CONSULTA_LISTADO} WHERE p.pedir_al_proveedor = 1 ${ORDEN_NOMBRE}`),
    );
  },

  async listarVencimientos(sql?: Sql): Promise<ProductoListado[]> {
    const db = sql ?? (await abrirDb());
    return aObjetos<ProductoListado>(
      await db.unsafe(`${CONSULTA_LISTADO} WHERE p.fecha_vencimiento IS NOT NULL ORDER BY p.fecha_vencimiento ASC`),
    );
  },

  async listarAgotados(sql?: Sql): Promise<ProductoListado[]> {
    const db = sql ?? (await abrirDb());
    return aObjetos<ProductoListado>(
      await db.unsafe(`${CONSULTA_LISTADO} WHERE p.cantidad_stock <= 0 ${ORDEN_NOMBRE}`),
    );
  },

  async listarFavoritos(sql?: Sql): Promise<ProductoListado[]> {
    const db = sql ?? (await abrirDb());
    return aObjetos<ProductoListado>(await db.unsafe(`${CONSULTA_LISTADO} WHERE p.es_favorito = 1 ${ORDEN_NOMBRE}`));
  },

  async listarTodos(sql?: Sql): Promise<Producto[]> {
    const db = sql ?? (await abrirDb());
    return aObjetos<Producto>(await db`SELECT * FROM productos ORDER BY LOWER(nombre)`);
  },

  async hayProductos(sql?: Sql): Promise<boolean> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`SELECT COUNT(*) AS total FROM productos`;
    return Number(fila.total) > 0;
  },
};
