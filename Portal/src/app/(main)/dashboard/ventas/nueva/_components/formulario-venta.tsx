"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { formatearCOP, normalizarNumero } from "@/lib/domain/moneda";
import type { ProductoConFotos } from "@/lib/domain/tipos";
import { registrarVenta } from "@/server/services/ventas";

export function FormularioVenta({ producto }: { producto: ProductoConFotos }) {
  const router = useRouter();
  const [cantidadTexto, setCantidadTexto] = useState("1");
  const [pendiente, startTransition] = useTransition();

  const cantidad = normalizarNumero(cantidadTexto, { permitirNegativo: false });
  const esValida = cantidad > 0 && cantidad <= producto.cantidad_stock;
  const total = esValida ? cantidad * producto.precio_venta : 0;

  const confirmar = () => {
    startTransition(async () => {
      const resultado = await registrarVenta(producto.id, cantidad);
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      toast.add({ title: "Venta registrada.", type: "success" });
      router.push("/dashboard/ventas");
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{producto.nombre}</span>
          <span className="text-muted-foreground text-xs">
            Precio: {formatearCOP(producto.precio_venta)} · Stock disponible: {producto.cantidad_stock}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            inputMode="numeric"
            value={cantidadTexto}
            onChange={(e) => setCantidadTexto(e.target.value)}
            aria-invalid={!esValida}
          />
          {!esValida && (
            <p className="text-destructive text-xs">
              La cantidad debe ser mayor que cero y no puede superar el stock disponible.
            </p>
          )}
        </div>
        <p className="text-lg font-semibold">Total: {formatearCOP(total)}</p>
        <div className="flex gap-2">
          <Button disabled={pendiente || !esValida} onClick={confirmar}>
            Confirmar venta
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
