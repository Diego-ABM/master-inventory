import type { DatosRespaldo } from "@/lib/domain/respaldo";
import { abrirDb, type Sql, sincronizarSecuencias } from "@/server/db";

type Fila = Record<string, unknown>;

async function columnasComunes(db: Sql, tabla: string, filas: Fila[]): Promise<string[]> {
  const columnasDb = (
    await db<{ name: string }[]>`
      SELECT column_name AS name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tabla}`
  ).map((c) => c.name);
  const usadas = new Set<string>();
  for (const fila of filas) {
    for (const clave of Object.keys(fila)) {
      if (columnasDb.includes(clave) && clave !== "datos") usadas.add(clave);
    }
  }
  return [...usadas];
}

export const respaldoRepo = {
  async exportarTodo(sql?: Sql): Promise<Omit<DatosRespaldo, "version" | "exportadoEn" | "fotos">> {
    const db = sql ?? (await abrirDb());
    const tablas = {
      productos: (await db`SELECT * FROM productos`) as unknown as Fila[],
      // "datos" (BYTEA) no viaja dentro de tablas: va en el mapa fotos en base64.
      fotos_producto: (await db`
        SELECT id, producto_id, ruta_archivo, orden, mime FROM fotos_producto`) as unknown as Fila[],
      ventas: (await db`SELECT * FROM ventas`) as unknown as Fila[],
      venta_items: (await db`SELECT * FROM venta_items`) as unknown as Fila[],
      pedidos_clientes: (await db`SELECT * FROM pedidos_clientes`) as unknown as Fila[],
      pedido_cliente_items: (await db`SELECT * FROM pedido_cliente_items`) as unknown as Fila[],
      meta: (await db`SELECT * FROM meta`) as unknown as Fila[],
    };
    return { tablas };
  },

  async listarFotosConDatos(sql?: Sql): Promise<{ ruta_archivo: string; datos: Uint8Array }[]> {
    const db = sql ?? (await abrirDb());
    const filas = await db`
      SELECT ruta_archivo, datos FROM fotos_producto WHERE datos IS NOT NULL`;
    return filas.map((f) => ({ ruta_archivo: f.ruta_archivo as string, datos: f.datos as Uint8Array }));
  },

  async guardarDatosFoto(ruta: string, datos: Uint8Array, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`UPDATE fotos_producto SET datos = ${datos} WHERE ruta_archivo = ${ruta}`;
  },

  // Debe invocarse dentro de la transacción del servicio.
  async reemplazarTodo(datos: DatosRespaldo, sql: Sql): Promise<void> {
    // Orden inverso a las FKs.
    await sql`
      DELETE FROM pedido_cliente_items;
      DELETE FROM pedidos_clientes;
      DELETE FROM venta_items;
      DELETE FROM ventas;
      DELETE FROM fotos_producto;
      DELETE FROM productos;
      DELETE FROM meta`.simple();

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
      const columnas = await columnasComunes(sql, tabla, filas);
      if (columnas.length === 0) continue;
      const listaColumnas = columnas.join(", ");
      const marcadores = columnas.map((_, i) => `$${i + 1}`).join(", ");
      for (const fila of filas) {
        const valores = columnas.map((c) => {
          const valor = fila[c];
          if (typeof valor === "boolean") return valor ? 1 : 0;
          if (typeof valor === "string" || typeof valor === "number") return valor;
          return valor == null ? null : String(valor);
        });
        await sql.unsafe(`INSERT INTO ${tabla} (${listaColumnas}) VALUES (${marcadores})`, valores);
      }
    }

    await sincronizarSecuencias(sql);
  },
};
