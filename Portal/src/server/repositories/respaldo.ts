import type { DatosRespaldo } from "@/lib/domain/respaldo";
import { abrirDb } from "@/server/db";

type Fila = Record<string, unknown>;

function columnasComunes(db: ReturnType<typeof abrirDb>, tabla: string, filas: Fila[]): string[] {
  const columnasDb = (db.prepare(`PRAGMA table_info(${tabla})`).all() as unknown as { name: string }[]).map(
    (c) => c.name,
  );
  const usadas = new Set<string>();
  for (const fila of filas) {
    for (const clave of Object.keys(fila)) {
      if (columnasDb.includes(clave)) usadas.add(clave);
    }
  }
  return [...usadas];
}

export const respaldoRepo = {
  exportarTodo(): Omit<DatosRespaldo, "version" | "exportadoEn" | "fotos"> {
    const db = abrirDb();
    const tablas = {
      productos: db.prepare("SELECT * FROM productos").all() as unknown as Fila[],
      fotos_producto: db.prepare("SELECT * FROM fotos_producto").all() as unknown as Fila[],
      ventas: db.prepare("SELECT * FROM ventas").all() as unknown as Fila[],
      venta_items: db.prepare("SELECT * FROM venta_items").all() as unknown as Fila[],
      pedidos_clientes: db.prepare("SELECT * FROM pedidos_clientes").all() as unknown as Fila[],
      pedido_cliente_items: db.prepare("SELECT * FROM pedido_cliente_items").all() as unknown as Fila[],
      meta: db.prepare("SELECT * FROM meta").all() as unknown as Fila[],
    };
    return { tablas };
  },

  // Debe invocarse dentro de la transacción del servicio.
  reemplazarTodo(datos: DatosRespaldo): void {
    const db = abrirDb();
    // Orden inverso a las FKs.
    db.exec(
      "DELETE FROM pedido_cliente_items; DELETE FROM pedidos_clientes; DELETE FROM venta_items; DELETE FROM ventas; DELETE FROM fotos_producto; DELETE FROM productos; DELETE FROM meta;",
    );

    const tablasOrdenadas = [
      "productos",
      "fotos_producto",
      "ventas",
      "venta_items",
      "pedidos_clientes",
      "pedido_cliente_items",
      "meta",
    ] as const;

    for (const tabla of tablasOrdenadas) {
      const filas = datos.tablas[tabla] as Fila[];
      if (filas.length === 0) continue;
      const columnas = columnasComunes(db, tabla, filas);
      if (columnas.length === 0) continue;
      const stmt = db.prepare(
        `INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES (${columnas.map(() => "?").join(", ")})`,
      );
      for (const fila of filas) {
        stmt.run(
          ...columnas.map((c) => {
            const valor = fila[c];
            if (typeof valor === "boolean") return valor ? 1 : 0;
            if (typeof valor === "string" || typeof valor === "number") return valor;
            return valor == null ? null : String(valor);
          }),
        );
      }
    }
  },
};
