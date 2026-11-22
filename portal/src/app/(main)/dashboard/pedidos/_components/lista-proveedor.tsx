"use client";

import { useState, useTransition } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { ProductoListado } from "@/lib/domain/tipos";
import { marcarPedidoProveedor } from "@/server/services/productos";

function ItemProveedor({ producto }: { producto: ProductoListado }) {
  const [nota, setNota] = useState(producto.nota_pedido ?? "");
  const [pendiente, startTransition] = useTransition();

  const guardar = (pedir: boolean) => {
    startTransition(async () => {
      const resultado = await marcarPedidoProveedor(producto.id, pedir, nota.trim() || undefined);
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      if (!pedir) toast.add({ title: "Producto desmarcado.", type: "success" });
      else toast.add({ title: "Nota guardada.", type: "success" });
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/dashboard/inventario/${producto.id}`} className="truncate text-sm font-medium hover:underline">
            {producto.nombre}
          </Link>
          <Button variant="ghost" size="sm" disabled={pendiente} onClick={() => guardar(false)}>
            Desmarcar
          </Button>
        </div>
        <Textarea
          rows={2}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota para el pedido (opcional)…"
          aria-label={`Nota del pedido para ${producto.nombre}`}
        />
        <Button variant="outline" size="sm" disabled={pendiente} onClick={() => guardar(true)}>
          Guardar nota
        </Button>
      </CardContent>
    </Card>
  );
}

export function ListaProveedor({ productos }: { productos: ProductoListado[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {productos.map((p) => (
        <ItemProveedor key={p.id} producto={p} />
      ))}
    </div>
  );
}
