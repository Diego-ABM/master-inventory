import { abrirDb, aObjeto, type Sql } from "@/server/db";

export const metaRepo = {
  async leer(clave: string, sql?: Sql): Promise<string | null> {
    const db = sql ?? (await abrirDb());
    const [fila] = await db`SELECT valor FROM meta WHERE clave = ${clave}`;
    return aObjeto<{ valor: string }>(fila)?.valor ?? null;
  },

  async escribir(clave: string, valor: string, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`
      INSERT INTO meta (clave, valor) VALUES (${clave}, ${valor})
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`;
  },
};
