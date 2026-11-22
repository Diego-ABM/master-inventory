"use client";

import { useRef, useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function ImportarRespaldo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [pendiente, startTransition] = useTransition();

  const restaurar = () => {
    if (!archivo) return;
    const formData = new FormData();
    formData.set("archivo", archivo);
    startTransition(async () => {
      const respuesta = await fetch("/api/respaldo", { method: "POST", body: formData });
      const cuerpo = (await respuesta.json()) as { mensaje?: string; error?: string };
      if (!respuesta.ok) {
        toast.add({ title: cuerpo.error ?? "No se pudo restaurar el respaldo.", type: "error" });
        setArchivo(null);
        return;
      }
      toast.add({ title: "Respaldo restaurado. Recargando…", type: "success" });
      window.location.href = "/dashboard/inventario";
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={pendiente}>
        Seleccionar archivo de respaldo…
      </Button>

      <AlertDialog open={archivo != null} onOpenChange={(v) => !v && setArchivo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar respaldo</AlertDialogTitle>
            <AlertDialogDescription>
              Se reemplazará <strong>todo</strong> el contenido actual (productos, fotos, ventas, pedidos y marcados)
              con el archivo “{archivo?.name}”. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={pendiente} onClick={restaurar}>
              Reemplazar todo
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
