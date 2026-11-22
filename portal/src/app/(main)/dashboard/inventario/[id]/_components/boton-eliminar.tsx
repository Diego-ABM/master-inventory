"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { eliminarProducto } from "@/server/services/productos";

export function BotonEliminarProducto({ productoId, nombre }: { productoId: number; nombre: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const eliminar = () => {
    startTransition(async () => {
      const resultado = await eliminarProducto(productoId);
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      const afectados = resultado.data?.pedidosAfectados ?? [];
      toast.add({
        title:
          afectados.length > 0
            ? `Producto eliminado. Se retiró de ${afectados.length} pedido(s) pendiente(s); si alguno quedó sin ítems, elimínalo.`
            : "Producto eliminado.",
        type: "success",
      });
      router.push("/dashboard/inventario");
    });
  };

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2 className="size-4" /> Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar “{nombre}”. Se quitará de los pedidos pendientes y sus fotos dejarán de existir. El historial
            de ventas conserva su nombre y precios. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button variant="destructive" disabled={pendiente} onClick={eliminar}>
            Eliminar definitivamente
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
