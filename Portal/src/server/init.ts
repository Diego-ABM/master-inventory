import { ejecutarInit as initDb } from "@/server/db";
import { logRepo } from "@/server/repositories/logs";
import { cargarSemillaInicial } from "@/server/services/seed";

export function ejecutarInit(): void {
  try {
    initDb();
  } catch (error) {
    console.error("No se pudo inicializar la base de datos:", error);
    return;
  }

  try {
    cargarSemillaInicial();
  } catch (error) {
    logRepo.registrar("WARN", "init", "La carga del catálogo inicial falló; la app sigue usable.", String(error));
  }
}
