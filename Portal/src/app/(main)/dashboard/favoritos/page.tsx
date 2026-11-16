import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { pedidoRepo } from "@/server/repositories/pedidos";
import { productoRepo } from "@/server/repositories/productos";
import { ventaRepo } from "@/server/repositories/ventas";

import { TarjetaProducto } from "../_components/tarjeta-producto";

export const dynamic = "force-dynamic";

export default function PaginaFavoritos() {
  const favoritos = productoRepo.listarFavoritos();

  const unidades = new Map<string, number>();
  const desde = 0;
  const hasta = Number.MAX_SAFE_INTEGER;
  for (const { nombre, unidades: u } of [
    ...ventaRepo.unidadesPorProducto(desde, hasta),
    ...pedidoRepo.unidadesPagadasPorProducto(desde, hasta),
  ]) {
    unidades.set(nombre, (unidades.get(nombre) ?? 0) + u);
  }
  const ranking = [...unidades.entries()]
    .map(([nombre, u]) => ({ nombre, unidades: u }))
    .sort((a, b) => b.unidades - a.unidades);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Mis Favoritos</h1>

      {favoritos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No tienes favoritos</EmptyTitle>
            <EmptyDescription>Marca productos con el corazón en el inventario o en su detalle.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favoritos.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} />
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Más vendidos</h2>
        {ranking.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Aún no hay ventas registradas</EmptyTitle>
              <EmptyDescription>El ranking de unidades vendidas aparecerá aquí.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-1 p-3">
              {ranking.map((item, i) => (
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
