import { notFound } from "next/navigation";

import { productoRepo } from "@/server/repositories/productos";

import { FormularioProducto } from "../../_components/formulario-producto";

export const dynamic = "force-dynamic";

export default async function PaginaEditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await productoRepo.obtener(Number(id));
  if (!producto) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar producto</h1>
      <FormularioProducto producto={producto} />
    </div>
  );
}
