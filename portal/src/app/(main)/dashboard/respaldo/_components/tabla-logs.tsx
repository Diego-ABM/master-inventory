"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { LogEntry, NivelLog } from "@/lib/domain/tipos";
import { limpiarLogs } from "@/server/services/logs";

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "medium" });

const VARIANTE_NIVEL: Record<NivelLog, "outline" | "secondary" | "destructive"> = {
  INFO: "outline",
  WARN: "secondary",
  ERROR: "destructive",
};

export function TablaLogs({ entradas }: { entradas: LogEntry[] }) {
  const [pendiente, startTransition] = useTransition();

  const limpiar = () => {
    startTransition(async () => {
      const resultado = await limpiarLogs();
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      toast.add({ title: `${resultado.borrados} registro(s) antiguo(s) eliminado(s).`, type: "success" });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled={pendiente} onClick={limpiar}>
          Limpiar registros antiguos
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        {entradas.map((log) => (
          <div key={log.id} className="flex items-start gap-2 border-b py-2 text-sm last:border-b-0">
            <Badge variant={VARIANTE_NIVEL[log.nivel]}>{log.nivel}</Badge>
            <div className="flex min-w-0 flex-col">
              <span className="text-muted-foreground text-xs">
                {formatoFecha.format(log.timestamp)} · {log.modulo}
              </span>
              <span>{log.mensaje}</span>
              {log.excepcion && <span className="text-destructive text-xs break-all">{log.excepcion}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
