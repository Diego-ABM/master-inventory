"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { marcarPedidoProveedor } from "@/server/services/productos";

export function MarcadoProveedor({
  productoId,
  marcado,
  notaInicial,
}: {
  productoId: number;
  marcado: boolean;
  notaInicial: string | null;
}) {
  const [nota, setNota] = useState(notaInicial ?? "");
  const [pendiente, startTransition] = useTransition();

  const guardar = (pedir: boolean) => {
    startTransition(async () => {
      const resultado = await marcarPedidoProveedor(productoId, pedir, nota.trim() || undefined);
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      toast.add({
        title: pedir ? "Marcado para el próximo pedido al proveedor." : "Marcado retirado.",
        type: "success",
      });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="pedir-proveedor"
          checked={marcado}
          disabled={pendiente}
          onCheckedChange={(checked) => guardar(checked === true)}
        />
        <Label htmlFor="pedir-proveedor">Pedir en el próximo pedido al proveedor</Label>
      </div>
      {marcado && (
        <div className="flex flex-col gap-2">
          <Textarea
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota para el pedido (opcional)…"
            aria-label="Nota del pedido al proveedor"
          />
          <Button type="button" variant="outline" size="sm" disabled={pendiente} onClick={() => guardar(true)}>
            Guardar nota
          </Button>
        </div>
      )}
    </div>
  );
}
