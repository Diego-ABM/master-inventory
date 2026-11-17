"use client";

import { useState, useTransition } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { formatearCOP } from "@/lib/domain/moneda";
import type { PedidoConItems } from "@/lib/domain/tipos";
import { cambiarEntregado, cambiarPagado, eliminarPedido } from "@/server/services/pedidos";

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

export function TarjetaPedido({ pedido }: { pedido: PedidoConItems }) {
  const [pendiente, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const entregado = pedido.entregado === 1;
  const pagado = pedido.pagado === 1;

  const toggleEntregado = (valor: boolean) => {
    startTransition(async () => {
      const resultado = await cambiarEntregado(pedido.id, valor);
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      const aviso = resultado.data?.aviso;
      if (aviso) toast.add({ title: aviso, type: "warning" });
    });
  };

  const togglePagado = (valor: boolean) => {
    startTransition(async () => {
      const resultado = await cambiarPagado(pedido.id, valor);
      if (!resultado.ok) toast.add({ title: resultado.mensaje, type: "error" });
    });
  };

  const eliminar = () => {
    startTransition(async () => {
      const resultado = await eliminarPedido(pedido.id);
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      setConfirmando(false);
      toast.add({ title: "Pedido eliminado.", type: "success" });
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">{pedido.nombre_cliente}</span>
            {pedido.contacto && <span className="text-muted-foreground text-xs">{pedido.contacto}</span>}
            <span className="text-muted-foreground text-xs">{formatoFecha.format(pedido.fecha_pedido)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Badge variant={entregado ? "default" : "secondary"}>{entregado ? "Entregado" : "Pendiente"}</Badge>
            <Badge variant={pagado ? "default" : "outline"}>{pagado ? "Pagado" : "Pago pendiente"}</Badge>
          </div>
        </div>

        <ul className="text-muted-foreground flex flex-col gap-0.5 text-sm">
          {pedido.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="truncate">
                {item.cantidad} × {item.nombre_producto || "Producto sin nombre"}
                {item.producto_id == null && <span className="text-xs"> (personalizado)</span>}
              </span>
              <span className="whitespace-nowrap">{formatearCOP(item.cantidad * item.precio_unitario)}</span>
            </li>
          ))}
        </ul>
        <p className="text-right text-sm font-semibold">Total: {formatearCOP(pedido.total)}</p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`entregado-${pedido.id}`}
                checked={entregado}
                disabled={pendiente}
                onCheckedChange={(v) => toggleEntregado(v === true)}
              />
              <Label htmlFor={`entregado-${pedido.id}`}>Entregado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`pagado-${pedido.id}`}
                checked={pagado}
                disabled={pendiente}
                onCheckedChange={(v) => togglePagado(v === true)}
              />
              <Label htmlFor={`pagado-${pedido.id}`}>Pagado</Label>
            </div>
          </div>
          {!entregado && (
            <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
              <AlertDialogTrigger
                render={<Button variant="ghost" size="icon" className="size-8" />}
                aria-label={`Eliminar pedido de ${pedido.nombre_cliente}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar pedido</AlertDialogTitle>
                  <AlertDialogDescription>
                    El pedido de {pedido.nombre_cliente} se eliminará definitivamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Button variant="destructive" disabled={pendiente} onClick={eliminar}>
                    Eliminar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
