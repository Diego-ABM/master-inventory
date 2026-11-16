import { abrirDb, aObjeto } from "@/server/db";

export const metaRepo = {
  leer(clave: string): string | null {
    const fila = aObjeto<{ valor: string }>(abrirDb().prepare("SELECT valor FROM meta WHERE clave = ?").get(clave));
    return fila?.valor ?? null;
  },

  escribir(clave: string, valor: string): void {
    abrirDb()
      .prepare("INSERT INTO meta (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor")
      .run(clave, valor);
  },
};
