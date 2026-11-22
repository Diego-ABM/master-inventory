import Link from "next/link";

import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { formatearCOP } from "@/lib/domain/moneda";
import { ventaRepo } from "@/server/repositories/ventas";

import { BotonEliminarVenta } from "./_components/boton-eliminar-venta";

export const dynamic = "force-dynamic";

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

export default async function PaginaVentas() {
  const ventas = await ventaRepo.listar();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Ventas</h1>
        <Button render={<Link href="/dashboard/ventas/nueva" />} nativeButton={false}>
          <ShoppingCart className="size-4" />
          Nueva venta
        </Button>
      </div>
      {ventas.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No hay ventas registradas</EmptyTitle>
            <EmptyDescription>Registra una venta desde el botón Nueva venta.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {ventas.map((venta) => (
            <Card key={venta.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs">{formatoFecha.format(venta.fecha)}</span>
                  <span className="truncate text-sm font-medium">
                    {venta.items.map((i) => `${i.cantidad} × ${i.nombre_producto}`).join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold whitespace-nowrap">{formatearCOP(venta.total)}</span>
                  <BotonEliminarVenta ventaId={venta.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
