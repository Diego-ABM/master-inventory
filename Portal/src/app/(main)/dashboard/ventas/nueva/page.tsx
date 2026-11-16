import { notFound, redirect } from "next/navigation";

import { productoRepo } from "@/server/repositories/productos";

import { FormularioVenta } from "./_components/formulario-venta";

export const dynamic = "force-dynamic";

export default async function PaginaNuevaVenta({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const productoId = Number(params.producto);
  if (!Number.isInteger(productoId) || productoId <= 0) redirect("/dashboard/inventario");
  const producto = await productoRepo.obtener(productoId);
  if (!producto) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Registrar venta</h1>
      <FormularioVenta producto={producto} />
    </div>
  );
}
