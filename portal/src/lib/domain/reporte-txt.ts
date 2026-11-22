import { formatearCOP } from "./moneda.ts";
import type { Periodo, ResultadoReporte } from "./reportes.ts";

const SEPARADOR = "========================================";

const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long" });

function formatoGenerado(epoch: number): string {
  const d = new Date(epoch);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function etiquetaPeriodo(periodo: Periodo): string {
  if (periodo.anual) return `Año ${periodo.anio}`;
  return `${capitalizar(formatoMes.format(new Date(periodo.anio, (periodo.mes ?? 1) - 1, 1)))} ${periodo.anio}`;
}

export function nombreArchivoReporte(periodo: Periodo): string {
  if (periodo.anual) return `reporte-${periodo.anio}.txt`;
  return `reporte-${periodo.anio}-${String(periodo.mes ?? 1).padStart(2, "0")}.txt`;
}

export function generarReporteTxt(periodo: Periodo, reporte: ResultadoReporte, generadoEn: number): string {
  const lineas: string[] = [
    SEPARADOR,
    `MASTER INVENTORY — REPORTE ${periodo.anual ? "ANUAL" : "MENSUAL"}`,
    `Periodo: ${etiquetaPeriodo(periodo)}`,
    `Generado: ${formatoGenerado(generadoEn)}`,
    SEPARADOR,
    "",
    "RESUMEN FINANCIERO",
    "------------------",
    `Ganancia bruta:      ${formatearCOP(reporte.gananciaBruta)}`,
    `Ganancia neta:       ${formatearCOP(reporte.gananciaNeta)}`,
    `Capital en stock:    ${formatearCOP(reporte.capitalEnStock)}`,
    `Inversión pendiente: ${formatearCOP(reporte.inversionPendiente)}`,
    "",
  ];

  if (reporte.rotacion.length === 0) {
    lineas.push("No hay registros en este periodo.");
  } else {
    lineas.push("TOP DE ROTACIÓN (unidades vendidas)", "-----------------------------------");
    reporte.rotacion.forEach((item, i) => {
      lineas.push(`${String(i + 1).padStart(2, " ")}. ${item.nombre} — ${item.unidades} uds.`);
    });
  }

  return `${lineas.join("\n")}\n`;
}
