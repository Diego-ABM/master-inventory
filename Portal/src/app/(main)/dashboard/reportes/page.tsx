import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { formatearCOP } from "@/lib/domain/moneda";
import type { Periodo } from "@/lib/domain/reportes";
import { obtenerReporte } from "@/server/services/reportes";

import { ControlesReporte } from "./_components/controles-reporte";

export const dynamic = "force-dynamic";

const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long" });

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function TarjetaIndicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-muted-foreground text-sm font-medium">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{formatearCOP(valor)}</p>
      </CardContent>
    </Card>
  );
}

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ahora = new Date();
  const vista = params.vista === "anual" ? "anual" : "mensual";
  const anio =
    Number.isInteger(Number(params.anio)) && Number(params.anio) > 0 ? Number(params.anio) : ahora.getFullYear();
  const mesParam = Number(params.mes);
  const mes = Number.isInteger(mesParam) && mesParam >= 1 && mesParam <= 12 ? mesParam : ahora.getMonth() + 1;

  const periodo: Periodo = vista === "anual" ? { anual: true, anio } : { anual: false, anio, mes };
  const reporte = await obtenerReporte(periodo);
  const etiqueta =
    vista === "anual" ? `Año ${anio}` : `${capitalizar(formatoMes.format(new Date(anio, mes - 1, 1)))} ${anio}`;
  const hayRegistros = reporte.rotacion.length > 0 || reporte.gananciaBruta > 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Reportes</h1>
      <ControlesReporte vista={vista} anio={anio} mes={mes} etiqueta={etiqueta} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaIndicador titulo="Ganancia bruta" valor={reporte.gananciaBruta} />
        <TarjetaIndicador titulo="Ganancia neta" valor={reporte.gananciaNeta} />
        <TarjetaIndicador titulo="Capital en stock" valor={reporte.capitalEnStock} />
        <TarjetaIndicador titulo="Inversión pendiente" valor={reporte.inversionPendiente} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Rotación del periodo</h2>
        {!hayRegistros ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No hay registros en este periodo</EmptyTitle>
              <EmptyDescription>Las ventas y los pedidos entregados y pagados aparecerán aquí.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-1 p-3">
              {reporte.rotacion.map((item, i) => (
                <div key={item.nombre} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span className="truncate">
                    {i + 1}. {item.nombre}
                  </span>
                  <span className="text-muted-foreground whitespace-nowrap">{item.unidades} uds.</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
