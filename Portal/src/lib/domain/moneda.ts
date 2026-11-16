const formateador = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearCOP(valor: number): string {
  return formateador.format(Number.isFinite(valor) ? Math.round(valor) : 0);
}

export function normalizarNumero(entrada: unknown, opciones: { permitirNegativo?: boolean } = {}): number {
  const permitirNegativo = opciones.permitirNegativo ?? true;
  let valor: number;

  if (typeof entrada === "number") {
    valor = entrada;
  } else if (typeof entrada === "string") {
    const limpio = entrada
      .trim()
      .replace(/[^\d,.-]/g, "")
      .replace(/[.\s]/g, "")
      .replace(",", ".");
    valor = limpio === "" || limpio === "-" ? 0 : Number.parseFloat(limpio);
  } else {
    valor = 0;
  }

  if (!Number.isFinite(valor)) return 0;
  const redondeado = Math.round(valor);
  return permitirNegativo ? redondeado : Math.max(0, redondeado);
}
