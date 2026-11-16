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
import { abrirDb, aObjeto, aObjetos } from "@/server/db";

interface FiltroProductos {
  texto?: string;
  mascota?: Mascota;
  categoria?: Categoria;
}

const CONSULTA_LISTADO = `SELECT p.*, (
  SELECT ruta_archivo FROM fotos_producto f WHERE f.producto_id = p.id ORDER BY f.orden, f.id LIMIT 1
) AS foto_principal FROM productos p`;

export const productoRepo = {
  listar(filtro: FiltroProductos = {}): ProductoListado[] {
    const condiciones: string[] = [];
    const params: (string | number)[] = [];

    if (filtro.texto?.trim()) {
      condiciones.push("p.nombre LIKE ? COLLATE NOCASE");
      params.push(`%${filtro.texto.trim()}%`);
    }
    if (filtro.mascota) {
      condiciones.push("p.mascota = ?");
      params.push(filtro.mascota);
    }
    if (filtro.categoria) {
      condiciones.push("p.categoria = ?");
      params.push(filtro.categoria);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
    const filas = abrirDb()
      .prepare(`${CONSULTA_LISTADO} ${where} ORDER BY p.nombre COLLATE NOCASE`)
      .all(...params);
    return aObjetos<ProductoListado>(filas);
  },

  obtener(id: number): ProductoConFotos | null {
    const db = abrirDb();
    const producto = aObjeto<Producto>(db.prepare("SELECT * FROM productos WHERE id = ?").get(id));
    if (!producto) return null;
    const fotos = aObjetos<FotoProducto>(
      db.prepare("SELECT * FROM fotos_producto WHERE producto_id = ? ORDER BY orden, id").all(id),
    );
    return { ...producto, fotos };
  },

  crear(data: NuevoProducto): number {
    const resultado = abrirDb()
      .prepare(
        `INSERT INTO productos (nombre, descripcion, precio_venta, precio_compra, cantidad_stock, stock_minimo,
          mascota, categoria, fecha_vencimiento, peso_kg, variante, nota_advertencia, fecha_actualizacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.nombre,
        data.descripcion ?? "",
        data.precio_venta,
        data.precio_compra ?? 0,
        data.cantidad_stock ?? 0,
        data.stock_minimo ?? 3,
        data.mascota ?? "UNISEX",
        data.categoria ?? "ACCESORIOS",
        data.fecha_vencimiento ?? null,
        data.peso_kg ?? null,
        data.variante ?? null,
        data.nota_advertencia ?? null,
        Date.now(),
      );
    return Number(resultado.lastInsertRowid);
  },

  actualizar(id: number, data: DatosProducto): void {
    abrirDb()
      .prepare(
        `UPDATE productos SET nombre = ?, descripcion = ?, precio_venta = ?, precio_compra = ?,
          cantidad_stock = ?, stock_minimo = ?, mascota = ?, categoria = ?, fecha_vencimiento = ?,
          peso_kg = ?, variante = ?, nota_advertencia = ?, fecha_actualizacion = ?
         WHERE id = ?`,
      )
      .run(
        data.nombre,
        data.descripcion ?? "",
        data.precio_venta,
        data.precio_compra,
        data.cantidad_stock,
        data.stock_minimo,
        data.mascota,
        data.categoria,
        data.fecha_vencimiento ?? null,
        data.peso_kg ?? null,
        data.variante ?? null,
        data.nota_advertencia ?? null,
        Date.now(),
        id,
      );
  },

  ajustarStock(id: number, delta: number): void {
    abrirDb()
      .prepare("UPDATE productos SET cantidad_stock = MAX(0, cantidad_stock + ?), fecha_actualizacion = ? WHERE id = ?")
      .run(delta, Date.now(), id);
  },

  eliminar(id: number): void {
    abrirDb().prepare("DELETE FROM productos WHERE id = ?").run(id);
  },

  marcarFavorito(id: number, es: boolean): void {
    abrirDb()
      .prepare("UPDATE productos SET es_favorito = ?, fecha_actualizacion = ? WHERE id = ?")
      .run(es ? 1 : 0, Date.now(), id);
  },

  marcarPedidoProveedor(id: number, pedir: boolean, nota?: string): void {
    abrirDb()
      .prepare("UPDATE productos SET pedir_al_proveedor = ?, nota_pedido = ?, fecha_actualizacion = ? WHERE id = ?")
      .run(pedir ? 1 : 0, pedir ? (nota ?? null) : null, Date.now(), id);
  },

  listarPedidoProveedor(): ProductoListado[] {
    return aObjetos<ProductoListado>(
      abrirDb().prepare(`${CONSULTA_LISTADO} WHERE p.pedir_al_proveedor = 1 ORDER BY p.nombre COLLATE NOCASE`).all(),
    );
  },

  listarVencimientos(): ProductoListado[] {
    return aObjetos<ProductoListado>(
      abrirDb()
        .prepare(`${CONSULTA_LISTADO} WHERE p.fecha_vencimiento IS NOT NULL ORDER BY p.fecha_vencimiento ASC`)
        .all(),
    );
  },

  listarAgotados(): ProductoListado[] {
    return aObjetos<ProductoListado>(
      abrirDb().prepare(`${CONSULTA_LISTADO} WHERE p.cantidad_stock <= 0 ORDER BY p.nombre COLLATE NOCASE`).all(),
    );
  },

  listarFavoritos(): ProductoListado[] {
    return aObjetos<ProductoListado>(
      abrirDb().prepare(`${CONSULTA_LISTADO} WHERE p.es_favorito = 1 ORDER BY p.nombre COLLATE NOCASE`).all(),
    );
  },

  listarTodos(): Producto[] {
    return aObjetos<Producto>(abrirDb().prepare("SELECT * FROM productos ORDER BY nombre COLLATE NOCASE").all());
  },

  hayProductos(): boolean {
    const fila = abrirDb().prepare("SELECT COUNT(*) AS total FROM productos").get() as { total: number };
    return fila.total > 0;
  },
};
