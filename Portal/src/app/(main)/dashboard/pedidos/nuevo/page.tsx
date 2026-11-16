import { productoRepo } from "@/server/repositories/productos";

import { FormularioPedido } from "./_components/formulario-pedido";

export const dynamic = "force-dynamic";

export default function PaginaNuevoPedido() {
  const productos = productoRepo
    .listarTodos()
    .map((p) => ({ id: p.id, nombre: p.nombre, precio_venta: p.precio_venta, cantidad_stock: p.cantidad_stock }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nuevo pedido</h1>
      <FormularioPedido productos={productos} />
    </div>
  );
}
