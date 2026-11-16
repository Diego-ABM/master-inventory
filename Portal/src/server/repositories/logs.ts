import type { LogEntry, NivelLog } from "@/lib/domain/tipos";
import { abrirDb, aObjetos } from "@/server/db";

export const logRepo = {
  registrar(nivel: NivelLog, modulo: string, mensaje: string, excepcion?: string): void {
    abrirDb()
      .prepare("INSERT INTO logs (timestamp, nivel, modulo, mensaje, excepcion) VALUES (?, ?, ?, ?, ?)")
      .run(Date.now(), nivel, modulo, mensaje, excepcion ?? null);
  },

  listar(limite = 200): LogEntry[] {
    return aObjetos<LogEntry>(abrirDb().prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?").all(limite));
  },

  limpiarAntiguos(antesDeEpoch: number): number {
    const resultado = abrirDb().prepare("DELETE FROM logs WHERE timestamp < ?").run(antesDeEpoch);
    return Number(resultado.changes);
  },

  limpiarTodo(): void {
    abrirDb().exec("DELETE FROM logs");
  },
};
