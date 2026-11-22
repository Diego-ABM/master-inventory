import { ejecutarInit as initDb } from "@/server/db";
import { logRepo } from "@/server/repositories/logs";
import { cargarSemillaInicial } from "@/server/services/seed";

export async function ejecutarInit(): Promise<void> {
  try {
    await initDb();
  } catch (error) {
    console.error("No se pudo inicializar la base de datos:", error);
    return;
  }

  try {
    await cargarSemillaInicial();
  } catch (error) {
    logRepo.registrarSeguro("WARN", "init", "La carga del catálogo inicial falló; la app sigue usable.", String(error));
  }
}
