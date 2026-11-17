"use client";

import { useRef, useTransition } from "react";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { FotoProducto } from "@/lib/domain/tipos";
import { comprimirFoto } from "@/lib/imagen";
import { agregarFoto, quitarFoto } from "@/server/services/productos";

export function GaleriaFotos({ productoId, fotos }: { productoId: number; fotos: FotoProducto[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendiente, startTransition] = useTransition();
  const puedeAgregar = fotos.length < 5;

  const subir = (archivo: File) => {
    startTransition(async () => {
      let foto: File;
      try {
        foto = await comprimirFoto(archivo);
      } catch (error) {
        toast.add({ title: error instanceof Error ? error.message : "No se pudo leer la imagen.", type: "error" });
        return;
      }
      const formData = new FormData();
      formData.set("foto", foto);
      const resultado = await agregarFoto(productoId, formData);
      if (!resultado.ok) toast.add({ title: resultado.mensaje, type: "error" });
    });
  };

  const quitar = (fotoId: number) => {
    startTransition(async () => {
      const resultado = await quitarFoto(fotoId);
      if (!resultado.ok) toast.add({ title: resultado.mensaje, type: "error" });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {fotos.map((foto) => (
          <div key={foto.id} className="bg-muted group relative aspect-square overflow-hidden rounded-md">
            {/* biome-ignore lint/performance/noImgElement: fotos locales del usuario; next/image no aporta aquí */}
            <img src={foto.ruta_archivo} alt="Foto del producto" className="size-full object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 size-6 opacity-80"
              disabled={pendiente}
              aria-label="Quitar foto"
              onClick={() => quitar(foto.id)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
        {puedeAgregar && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => inputRef.current?.click()}
            className="border-muted-foreground/40 text-muted-foreground hover:bg-muted flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs"
          >
            <Plus className="size-5" />
            Agregar foto
          </button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{fotos.length} de 5 fotos.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) subir(archivo);
          e.target.value = "";
        }}
      />
    </div>
  );
}
