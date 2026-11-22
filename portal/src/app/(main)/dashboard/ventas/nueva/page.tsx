import { productoRepo } from "@/server/repositories/productos";

import { PosVenta } from "./_components/pos-venta";

export const dynamic = "force-dynamic";

export default async function PaginaNuevaVenta({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, productos] = await Promise.all([searchParams, productoRepo.listar()]);

  const productoId = Number(params.producto);
  const productoPrecargado =
    Number.isInteger(productoId) && productoId > 0 ? (productos.find((p) => p.id === productoId) ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nueva venta</h1>
      <PosVenta productos={productos} productoPrecargado={productoPrecargado} />
    </div>
  );
}
