"use client";

import { useTransition } from "react";

import { cn } from "cn";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { marcarFavorito } from "@/server/services/productos";

export function BotonFavorito({ productoId, esFavorito }: { productoId: number; esFavorito: boolean }) {
  const [pendiente, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      disabled={pendiente}
      aria-label={esFavorito ? "Quitar de favoritos" : "Marcar como favorito"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          const resultado = await marcarFavorito(productoId, !esFavorito);
          if (!resultado.ok) toast.add({ title: resultado.mensaje, type: "error" });
        });
      }}
    >
      <Heart className={cn("size-4", esFavorito && "fill-destructive text-destructive")} />
    </Button>
  );
}
