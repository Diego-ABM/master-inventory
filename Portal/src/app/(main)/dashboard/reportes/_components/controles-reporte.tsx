"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ChevronLeft, ChevronRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ControlesReporte({
  vista,
  anio,
  mes,
  etiqueta,
}: {
  vista: "mensual" | "anual";
  anio: number;
  mes: number;
  etiqueta: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navegar = (nuevaVista: string, nuevoAnio: number, nuevoMes: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("vista", nuevaVista);
    params.set("anio", String(nuevoAnio));
    params.set("mes", String(nuevoMes));
    router.replace(`?${params.toString()}`);
  };

  const mover = (delta: number) => {
    if (vista === "anual") {
      navegar(vista, anio + delta, mes);
      return;
    }
    const total = anio * 12 + (mes - 1) + delta;
    navegar(vista, Math.floor(total / 12), (total % 12) + 1);
  };

  const hrefExportar =
    vista === "anual"
      ? `/api/reportes/export?periodo=${anio}&anual=1`
      : `/api/reportes/export?periodo=${anio}-${String(mes).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Periodo anterior" onClick={() => mover(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-36 text-center text-sm font-medium">{etiqueta}</span>
        <Button variant="outline" size="icon" aria-label="Periodo siguiente" onClick={() => mover(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <ToggleGroup
          value={[vista]}
          onValueChange={([seleccion]) => {
            if (seleccion === "mensual" || seleccion === "anual") navegar(seleccion, anio, mes);
          }}
        >
          <ToggleGroupItem value="mensual">Mensual</ToggleGroupItem>
          <ToggleGroupItem value="anual">Anual</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" render={<a href={hrefExportar} download />}>
          <Download className="size-4" /> Exportar .txt
        </Button>
      </div>
    </div>
  );
}
