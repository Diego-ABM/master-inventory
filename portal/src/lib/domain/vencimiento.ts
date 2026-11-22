const DIA_MS = 24 * 60 * 60 * 1000;

export type ColorSemaforo = "rojo" | "naranja" | "verde";

export function diasRestantes(fechaVencimiento: number, referencia: number): number {
  const inicioDia = (epoch: number) => {
    const fecha = new Date(epoch);
    return Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  };
  return Math.round((inicioDia(fechaVencimiento) - inicioDia(referencia)) / DIA_MS);
}

export function semaforo(dias: number | null): ColorSemaforo | null {
  if (dias === null) return null;
  if (dias <= 30) return "rojo";
  if (dias <= 60) return "naranja";
  return "verde";
}
