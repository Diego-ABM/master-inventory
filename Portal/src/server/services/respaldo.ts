import { type DatosRespaldo, VERSION_RESPALDO, validarRespaldo } from "@/lib/domain/respaldo";
import { transaccion } from "@/server/db";
import { logRepo } from "@/server/repositories/logs";
import { respaldoRepo } from "@/server/repositories/respaldo";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const MODULO = "respaldo";
const DIRECTORIO_PUBLICO = path.join(process.cwd(), "public");

function nombreArchivoRespaldo(fecha: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `master-inventory-respaldo-${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}.json`;
}

export async function exportarRespaldo(): Promise<{ json: string; nombre: string }> {
  const { tablas } = await respaldoRepo.exportarTodo();
  const enDb = new Map((await respaldoRepo.listarFotosConDatos()).map((f) => [f.ruta_archivo, f.datos]));
  const fotos: Record<string, string> = {};

  for (const fila of tablas.fotos_producto) {
    const ruta = fila.ruta_archivo;
    if (typeof ruta !== "string" || ruta in fotos) continue;

    const datos = enDb.get(ruta);
    if (datos) {
      fotos[ruta] = Buffer.from(datos).toString("base64");
      continue;
    }

    // Fotos del catálogo: solo accesibles por filesystem en ejecución local.
    if (ruta.startsWith("/seed/images/")) {
      const fisica = path.join(DIRECTORIO_PUBLICO, "seed", "images", path.basename(ruta));
      if (existsSync(/* turbopackIgnore: true */ fisica)) {
        fotos[ruta] = readFileSync(/* turbopackIgnore: true */ fisica).toString("base64");
        continue;
      }
    }

    fotos[ruta] = "";
    await logRepo.registrar("WARN", MODULO, `La foto ${ruta} no tiene bytes disponibles; se exporta vacía.`);
  }

  const respaldo: DatosRespaldo = { version: VERSION_RESPALDO, exportadoEn: Date.now(), tablas, fotos };
  await logRepo.registrar("INFO", MODULO, "Respaldo exportado.");
  return { json: JSON.stringify(respaldo), nombre: nombreArchivoRespaldo(new Date()) };
}

export async function importarRespaldo(contenido: string): Promise<{ ok: true } | { ok: false; mensaje: string }> {
  let json: unknown;
  try {
    json = JSON.parse(contenido);
  } catch {
    return { ok: false, mensaje: "El archivo no contiene JSON válido." };
  }

  const validacion = validarRespaldo(json);
  if (!validacion.ok) return { ok: false, mensaje: validacion.mensaje };
  if (validacion.datos.version > VERSION_RESPALDO) {
    return { ok: false, mensaje: "El respaldo es de una versión más reciente que esta aplicación." };
  }

  try {
    await transaccion(async (db) => {
      await respaldoRepo.reemplazarTodo(validacion.datos, db);
      for (const [ruta, base64] of Object.entries(validacion.datos.fotos)) {
        if (!ruta.startsWith("/api/fotos/") || !base64) continue;
        await respaldoRepo.guardarDatosFoto(ruta, Buffer.from(base64, "base64"), db);
      }
    });

    await logRepo.registrar("INFO", MODULO, "Respaldo restaurado con éxito.");
    return { ok: true };
  } catch (error) {
    await logRepo.registrar("ERROR", MODULO, "Falló la restauración del respaldo.", String(error));
    return { ok: false, mensaje: "No se pudo restaurar el respaldo." };
  }
}
