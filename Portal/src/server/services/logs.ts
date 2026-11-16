"use server";

import { revalidatePath } from "next/cache";

import { logRepo } from "@/server/repositories/logs";

const NOVENTA_DIAS_MS = 90 * 24 * 60 * 60 * 1000;

export async function limpiarLogs(): Promise<{ ok: true; borrados: number } | { ok: false; mensaje: string }> {
  try {
    const borrados = await logRepo.limpiarAntiguos(Date.now() - NOVENTA_DIAS_MS);
    await logRepo.registrar("INFO", "logs", `Limpieza manual: ${borrados} registro(s) antiguo(s) eliminado(s).`);
    revalidatePath("/dashboard/respaldo");
    return { ok: true, borrados };
  } catch {
    return { ok: false, mensaje: "No se pudieron limpiar los registros." };
  }
}
