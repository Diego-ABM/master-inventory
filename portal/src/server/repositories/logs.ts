import type { LogEntry, NivelLog } from "@/lib/domain/tipos";
import { abrirDb, aObjetos, type Sql } from "@/server/db";

export const logRepo = {
  async registrar(nivel: NivelLog, modulo: string, mensaje: string, excepcion?: string, sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`
      INSERT INTO logs ("timestamp", nivel, modulo, mensaje, excepcion)
      VALUES (${Date.now()}, ${nivel}, ${modulo}, ${mensaje}, ${excepcion ?? null})`;
  },

  // Nunca propaga errores: un fallo al loguear no debe romper la operación real.
  registrarSeguro(nivel: NivelLog, modulo: string, mensaje: string, excepcion?: string, sql?: Sql): void {
    logRepo.registrar(nivel, modulo, mensaje, excepcion, sql).catch((error) => {
      console.error("No se pudo escribir el log:", error);
    });
  },

  async listar(limite = 200, sql?: Sql): Promise<LogEntry[]> {
    const db = sql ?? (await abrirDb());
    return aObjetos<LogEntry>(await db`SELECT * FROM logs ORDER BY "timestamp" DESC LIMIT ${limite}`);
  },

  async limpiarAntiguos(antesDeEpoch: number, sql?: Sql): Promise<number> {
    const db = sql ?? (await abrirDb());
    const resultado = await db`DELETE FROM logs WHERE "timestamp" < ${antesDeEpoch}`;
    return resultado.count;
  },

  async limpiarTodo(sql?: Sql): Promise<void> {
    const db = sql ?? (await abrirDb());
    await db`DELETE FROM logs`;
  },
};
