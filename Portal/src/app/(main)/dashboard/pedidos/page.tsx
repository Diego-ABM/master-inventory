import Link from "next/link";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pedidoRepo } from "@/server/repositories/pedidos";
import { productoRepo } from "@/server/repositories/productos";

import { ListaProveedor } from "./_components/lista-proveedor";
import { TarjetaPedido } from "./_components/tarjeta-pedido";

export const dynamic = "force-dynamic";

export default function PaginaPedidos() {
  const pedidos = pedidoRepo.listar();
  const marcados = productoRepo.listarPedidoProveedor();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pedidos</h1>
        <Button render={<Link href="/dashboard/pedidos/nuevo" />}>
          <Plus className="size-4" /> Nuevo pedido
        </Button>
      </div>

      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">Pedidos de clientes</TabsTrigger>
          <TabsTrigger value="proveedor">Para el proveedor</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-4">
          {pedidos.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No hay pedidos registrados</EmptyTitle>
                <EmptyDescription>Crea un pedido con el botón “Nuevo pedido”.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pedidos.map((pedido) => (
                <TarjetaPedido key={pedido.id} pedido={pedido} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="proveedor" className="mt-4">
          {marcados.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No hay productos marcados</EmptyTitle>
                <EmptyDescription>
                  Marca productos “para el próximo pedido” desde su detalle en Inventario.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ListaProveedor productos={marcados} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
