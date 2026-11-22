import type { PeriodoId, PeriodoMetricas, PuntoSerie, VentaConItems } from "./tipos.ts";

const ETIQUETAS_PERIODO: Record<PeriodoId, string> = {
  hoy: "Hoy",
  semana: "Semana",
  mes: "Mes",
  anio: "Año",
};

const DIAS_SEMANA = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

const formatoHora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", hour12: true });

export function rangoPeriodo(periodo: PeriodoId, referencia: Date): { desde: number; hasta: number } {
  const y = referencia.getFullYear();
  const m = referencia.getMonth();
  const d = referencia.getDate();
  switch (periodo) {
    case "hoy":
      return { desde: new Date(y, m, d).getTime(), hasta: new Date(y, m, d + 1).getTime() };
    case "semana": {
      const diasDesdeElunes = (referencia.getDay() + 6) % 7;
      return {
        desde: new Date(y, m, d - diasDesdeElunes).getTime(),
        hasta: new Date(y, m, d - diasDesdeElunes + 7).getTime(),
      };
    }
    case "mes":
      return { desde: new Date(y, m, 1).getTime(), hasta: new Date(y, m + 1, 1).getTime() };
    case "anio":
      return { desde: new Date(y, 0, 1).getTime(), hasta: new Date(y + 1, 0, 1).getTime() };
  }
}

function indiceBucket(fecha: Date, periodo: PeriodoId): number {
  switch (periodo) {
    case "hoy":
      return fecha.getHours();
    case "semana":
      return (fecha.getDay() + 6) % 7;
    case "mes":
      return fecha.getDate() - 1;
    case "anio":
      return fecha.getMonth();
  }
}

function crearSerie(periodo: PeriodoId, desde: Date, hasta: Date): PuntoSerie[] {
  switch (periodo) {
    case "hoy":
      return Array.from({ length: 24 }, (_, h) => ({
        etiqueta: formatoHora.format(new Date(2000, 0, 1, h)),
        total: 0,
      }));
    case "semana":
      return Array.from({ length: 7 }, (_, i) => {
        const dia = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i);
        return { etiqueta: `${DIAS_SEMANA[i]} ${dia.getDate()}`, total: 0 };
      });
    case "mes": {
      const diasEnMes = new Date(hasta.getFullYear(), hasta.getMonth(), 0).getDate();
      return Array.from({ length: diasEnMes }, (_, i) => ({ etiqueta: String(i + 1), total: 0 }));
    }
    case "anio":
      return MESES.map((etiqueta) => ({ etiqueta, total: 0 }));
  }
}

export function agregarVentas(ventas: VentaConItems[], periodo: PeriodoId, referencia: Date): PeriodoMetricas {
  const { desde, hasta } = rangoPeriodo(periodo, referencia);
  const serie = crearSerie(periodo, new Date(desde), new Date(hasta));
  let totalVendido = 0;
  let numeroVentas = 0;

  for (const venta of ventas) {
    const fecha = Number(venta.fecha); // la columna bigint llega como string desde postgres.js
    if (!(fecha >= desde) || fecha >= hasta) continue;
    serie[indiceBucket(new Date(fecha), periodo)].total += venta.total;
    totalVendido += venta.total;
    numeroVentas += 1;
  }

  return { id: periodo, etiqueta: ETIQUETAS_PERIODO[periodo], totalVendido, numeroVentas, serie };
}
