"use client";

import { useTransition } from "react";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ajustarStock } from "@/server/services/productos";

export function ControlesStock({ productoId, stock }: { productoId: number; stock: number }) {
  const [pendiente, startTransition] = useTransition();

  const ajustar = (delta: number) => {
    startTransition(async () => {
      const resultado = await ajustarStock(productoId, delta);
      if (!resultado.ok) toast.add({ title: resultado.mensaje, type: "error" });
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={pendiente || stock <= 0}
        aria-label="Restar una unidad"
        onClick={() => ajustar(-1)}
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-10 text-center text-lg font-semibold tabular-nums">{stock}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={pendiente}
        aria-label="Sumar una unidad"
        onClick={() => ajustar(1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
