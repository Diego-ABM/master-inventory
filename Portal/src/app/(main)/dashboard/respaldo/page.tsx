import Link from "next/link";

import { Download, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { logRepo } from "@/server/repositories/logs";

import { ImportarRespaldo } from "./_components/importar-respaldo";
import { TablaLogs } from "./_components/tabla-logs";

export const dynamic = "force-dynamic";

export default function PaginaRespaldo() {
  const logs = logRepo.listar(200);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Respaldo y seguridad</h1>

      <Card>
        <CardHeader>
          <CardTitle>Respaldo de datos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Exporta todos los datos (productos, fotos, ventas, pedidos y marcados) a un solo archivo JSON, o restaura un
            respaldo previo reemplazando todo el contenido actual.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button render={<a href="/api/respaldo" download />}>
              <Download className="size-4" /> Exportar respaldo
            </Button>
            <ImportarRespaldo />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reportes</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" render={<Link href="/dashboard/reportes" />}>
            <ScrollText className="size-4" /> Ir a reportes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros internos</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No hay registros</EmptyTitle>
                <EmptyDescription>Los eventos internos de la aplicación aparecerán aquí.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <TablaLogs entradas={logs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
