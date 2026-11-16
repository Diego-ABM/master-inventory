import Link from "next/link";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { CATEGORIAS, type Categoria, MASCOTAS, type Mascota, type ProductoListado } from "@/lib/domain/tipos";
import { productoRepo } from "@/server/repositories/productos";

import { TarjetaProducto } from "../_components/tarjeta-producto";
import { FiltrosInventario } from "./_components/filtros-inventario";

export const dynamic = "force-dynamic";

export default async function PaginaInventario({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const texto = typeof params.texto === "string" ? params.texto : undefined;
  const mascota = MASCOTAS.includes(params.mascota as Mascota) ? (params.mascota as Mascota) : undefined;
  const categoria = CATEGORIAS.includes(params.categoria as Categoria) ? (params.categoria as Categoria) : undefined;

  let productos: ProductoListado[];
  let errorCarga = false;
  try {
    productos = productoRepo.listar({ texto, mascota, categoria });
  } catch {
    productos = [];
    errorCarga = true;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Inventario</h1>
        <Button render={<Link href="/dashboard/inventario/nuevo" />}>
          <Plus className="size-4" /> Nuevo producto
        </Button>
      </div>
      <FiltrosInventario />
      {errorCarga && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No se pudo cargar el inventario</EmptyTitle>
            <EmptyDescription>Revisa los registros internos en la sección de Respaldo.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {!errorCarga && productos.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No hay productos para mostrar</EmptyTitle>
            <EmptyDescription>Ajusta la búsqueda o los filtros, o crea un producto nuevo.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {!errorCarga && productos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {productos.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  );
}
