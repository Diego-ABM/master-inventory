"use client";

import { useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Minus, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { formatearCOP } from "@/lib/domain/moneda";
import type { ProductoListado } from "@/lib/domain/tipos";
import { registrarVenta } from "@/server/services/ventas";

interface ItemCarrito {
  producto_id: number;
  nombre_producto: string;
  precio_venta: number;
  cantidad: number;
  stock_disponible: number;
}

export function PosVenta({
  productos,
  productoPrecargado,
}: {
  productos: ProductoListado[];
  productoPrecargado?: ProductoListado | null;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>(() =>
    productoPrecargado && productoPrecargado.cantidad_stock > 0
      ? [
          {
            producto_id: productoPrecargado.id,
            nombre_producto: productoPrecargado.nombre,
            precio_venta: productoPrecargado.precio_venta,
            cantidad: 1,
            stock_disponible: productoPrecargado.cantidad_stock,
          },
        ]
      : [],
  );
  const [pendiente, startTransition] = useTransition();

  const consulta = texto.trim().toLowerCase();
  const resultados = useMemo(() => {
    if (consulta === "") return [];
    return productos.filter((p) => p.nombre.toLowerCase().includes(consulta)).slice(0, 8);
  }, [productos, consulta]);

  const agregar = (producto: ProductoListado) => {
    setCarrito((actual) => {
      const existente = actual.find((i) => i.producto_id === producto.id);
      if (existente) {
        return actual.map((i) =>
          i.producto_id === producto.id ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock_disponible) } : i,
        );
      }
      return [
        ...actual,
        {
          producto_id: producto.id,
          nombre_producto: producto.nombre,
          precio_venta: producto.precio_venta,
          cantidad: 1,
          stock_disponible: producto.cantidad_stock,
        },
      ];
    });
    setTexto("");
  };

  const cambiarCantidad = (productoId: number, delta: number) => {
    setCarrito((actual) =>
      actual.map((i) =>
        i.producto_id === productoId
          ? { ...i, cantidad: Math.min(Math.max(i.cantidad + delta, 1), i.stock_disponible) }
          : i,
      ),
    );
  };

  const quitar = (productoId: number) => {
    setCarrito((actual) => actual.filter((i) => i.producto_id !== productoId));
  };

  const cantidadEnCarrito = (productoId: number) => carrito.find((i) => i.producto_id === productoId)?.cantidad ?? 0;
  const total = carrito.reduce((t, i) => t + i.cantidad * i.precio_venta, 0);

  const confirmar = () => {
    startTransition(async () => {
      const resultado = await registrarVenta(
        carrito.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      );
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      toast.add({ title: "Venta registrada.", type: "success" });
      router.push("/dashboard/ventas");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar producto por nombre…"
              className="pl-8"
              aria-label="Buscar producto"
              autoFocus
            />
          </div>
          {consulta !== "" && resultados.length === 0 && (
            <p className="text-muted-foreground px-1 py-2 text-sm">
              No hay productos que coincidan con “{texto.trim()}”.
            </p>
          )}
          {resultados.length > 0 && (
            <ul className="divide-border divide-y">
              {resultados.map((producto) => {
                const agotado = producto.cantidad_stock <= 0;
                const alcanzoStock = cantidadEnCarrito(producto.id) >= producto.cantidad_stock;
                return (
                  <li key={producto.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{producto.nombre}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatearCOP(producto.precio_venta)}
                        {agotado ? " · Agotado" : ` · Stock: ${producto.cantidad_stock}`}
                      </span>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={agotado || alcanzoStock}
                      onClick={() => agregar(producto)}
                      aria-label={`Agregar ${producto.nombre}`}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {carrito.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>El carrito está vacío</EmptyTitle>
            <EmptyDescription>Busca un producto y agrégalo a la venta.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent className="flex flex-col p-4">
            <ul className="divide-border divide-y">
              {carrito.map((item) => (
                <li key={item.producto_id} className="flex items-center justify-between gap-2 py-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{item.nombre_producto}</span>
                    <span className="text-muted-foreground text-xs">{formatearCOP(item.precio_venta)} c/u</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        disabled={item.cantidad <= 1}
                        onClick={() => cambiarCantidad(item.producto_id, -1)}
                        aria-label={`Quitar una unidad de ${item.nombre_producto}`}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-7 text-center text-sm tabular-nums">{item.cantidad}</span>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        disabled={item.cantidad >= item.stock_disponible}
                        onClick={() => cambiarCantidad(item.producto_id, 1)}
                        aria-label={`Agregar una unidad de ${item.nombre_producto}`}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <span className="w-20 text-right text-sm font-medium whitespace-nowrap tabular-nums">
                      {formatearCOP(item.cantidad * item.precio_venta)}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => quitar(item.producto_id)}
                      aria-label={`Quitar ${item.nombre_producto} de la venta`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatearCOP(total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button disabled={pendiente || carrito.length === 0} onClick={confirmar}>
          Confirmar venta
        </Button>
        <Button variant="outline" disabled={pendiente} onClick={() => router.push("/dashboard/ventas")}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
