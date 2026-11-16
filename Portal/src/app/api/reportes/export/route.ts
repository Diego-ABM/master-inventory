import { NextResponse } from "next/server";

import { generarReporteTxt, nombreArchivoReporte } from "@/lib/domain/reporte-txt";
import { obtenerReporte, periodoDesdeParametros } from "@/server/services/reportes";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const periodo = periodoDesdeParametros({
    periodo: searchParams.get("periodo") ?? undefined,
    anual: searchParams.get("anual") ?? undefined,
  });
  if (!periodo) {
    return NextResponse.json(
      { error: "Periodo no válido. Usa ?periodo=AAAA-MM o ?periodo=AAAA&anual=1." },
      { status: 400 },
    );
  }

  const reporte = obtenerReporte(periodo);
  const txt = generarReporteTxt(periodo, reporte, Date.now());

  return new Response(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivoReporte(periodo)}"`,
    },
  });
}
