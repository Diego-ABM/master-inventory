import { type DatosRespaldo, VERSION_RESPALDO, validarRespaldo } from "@/lib/domain/respaldo";
import { DIRECTORIO_FOTOS, transaccion } from "@/server/db";
import { logRepo } from "@/server/repositories/logs";
import { respaldoRepo } from "@/server/repositories/respaldo";

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const MODULO = "respaldo";
const DIRECTORIO_PUBLICO = path.join(process.cwd(), "public");
const EXTENSIONES_FOTO = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function nombreArchivoRespaldo(fecha: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `master-inventory-respaldo-${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}.json`;
}

function rutaFisica(rutaPublica: string): string | null {
  if (rutaPublica.startsWith("/seed/images/")) {
    return path.join(DIRECTORIO_PUBLICO, "seed", "images", path.basename(rutaPublica));
  }
  if (rutaPublica.startsWith("/api/fotos/")) {
    return path.join(DIRECTORIO_FOTOS, path.basename(rutaPublica));
  }
  return null;
}

export function exportarRespaldo(): { json: string; nombre: string } {
  const { tablas } = respaldoRepo.exportarTodo();
  const fotos: Record<string, string> = {};

  for (const fila of tablas.fotos_producto) {
    const ruta = fila.ruta_archivo;
    if (typeof ruta !== "string" || ruta in fotos) continue;
    const fisica = rutaFisica(ruta);
    if (fisica && existsSync(/* turbopackIgnore: true */ fisica)) {
      fotos[ruta] = readFileSync(/* turbopackIgnore: true */ fisica).toString("base64");
    } else {
      fotos[ruta] = "";
      logRepo.registrar("WARN", MODULO, `La foto ${ruta} no existe en disco; se exporta vacía.`);
    }
  }

  const respaldo: DatosRespaldo = { version: VERSION_RESPALDO, exportadoEn: Date.now(), tablas, fotos };
  logRepo.registrar("INFO", MODULO, "Respaldo exportado.");
  return { json: JSON.stringify(respaldo), nombre: nombreArchivoRespaldo(new Date()) };
}

export function importarRespaldo(contenido: string): { ok: true } | { ok: false; mensaje: string } {
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
    transaccion(() => respaldoRepo.reemplazarTodo(validacion.datos));

    mkdirSync(DIRECTORIO_FOTOS, { recursive: true });
    for (const archivo of readdirSync(DIRECTORIO_FOTOS)) {
      if (EXTENSIONES_FOTO.has(path.extname(archivo).toLowerCase())) {
        unlinkSync(path.join(DIRECTORIO_FOTOS, archivo));
      }
    }
    for (const [ruta, base64] of Object.entries(validacion.datos.fotos)) {
      if (!ruta.startsWith("/api/fotos/")) continue;
      writeFileSync(path.join(DIRECTORIO_FOTOS, path.basename(ruta)), Buffer.from(base64, "base64"));
    }

    logRepo.registrar("INFO", MODULO, "Respaldo restaurado con éxito.");
    return { ok: true };
  } catch (error) {
    logRepo.registrar("ERROR", MODULO, "Falló la restauración del respaldo.", String(error));
    return { ok: false, mensaje: "No se pudo restaurar el respaldo." };
  }
}
