import Link from "next/link";

import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { diasRestantes, semaforo } from "@/lib/domain/vencimiento";
import { productoRepo } from "@/server/repositories/productos";

import { TarjetaProducto } from "../_components/tarjeta-producto";

export const dynamic = "force-dynamic";

const ESTILOS_SEMAFORO = {
  rojo: "border-destructive/60 bg-destructive/10",
  naranja: "border-orange-500/60 bg-orange-500/10",
  verde: "border-green-600/60 bg-green-600/10",
} as const;

const ETIQUETAS_SEMAFORO = { rojo: "Urgente", naranja: "Próximo", verde: "Vigente" } as const;

export default async function PaginaAlertas() {
  const [vencimientos, agotados] = await Promise.all([
    productoRepo.listarVencimientos(),
    productoRepo.listarAgotados(),
  ]);
  const ahora = Date.now();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Alertas</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Vencimientos</h2>
        {vencimientos.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No hay vencimientos próximos</EmptyTitle>
              <EmptyDescription>Los productos con fecha de vencimiento aparecerán aquí.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {vencimientos.map((producto) => {
              const dias = diasRestantes(producto.fecha_vencimiento as number, ahora);
              const color = semaforo(dias) ?? "verde";
              return (
                <Card key={producto.id} className={cn("border-l-4", ESTILOS_SEMAFORO[color])}>
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <Link
                      href={`/dashboard/inventario/${producto.id}`}
                      className="min-w-0 truncate text-sm font-medium hover:underline"
                    >
                      {producto.nombre}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge variant={color === "rojo" ? "destructive" : "outline"}>{ETIQUETAS_SEMAFORO[color]}</Badge>
                      <span className="text-sm whitespace-nowrap">
                        {dias < 0 ? `Venció hace ${-dias} día(s)` : `${dias} día(s)`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Agotados</h2>
        {agotados.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No hay productos agotados</EmptyTitle>
              <EmptyDescription>Los productos con stock en cero aparecerán aquí.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {agotados.map((producto) => (
              <TarjetaProducto key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
