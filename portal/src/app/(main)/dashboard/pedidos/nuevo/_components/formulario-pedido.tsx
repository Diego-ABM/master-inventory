"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { formatearCOP, normalizarNumero } from "@/lib/domain/moneda";
import { crearPedido } from "@/server/services/pedidos";

interface ProductoOpcion {
  id: number;
  nombre: string;
  precio_venta: number;
  cantidad_stock: number;
}

interface ItemPedido {
  clave: number;
  producto_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
}

export function FormularioPedido({ productos }: { productos: ProductoOpcion[] }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [cliente, setCliente] = useState("");
  const [contacto, setContacto] = useState("");
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [productoSel, setProductoSel] = useState("");
  const [cantidadSel, setCantidadSel] = useState("1");
  const [nombreLibre, setNombreLibre] = useState("");
  const [precioLibre, setPrecioLibre] = useState("");
  const [cantidadLibre, setCantidadLibre] = useState("1");
  const siguienteClave = useRef(1);

  const total = items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);
  const hayCambios = cliente !== "" || contacto !== "" || items.length > 0;

  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayCambios]);

  const agregarCatalogo = () => {
    const producto = productos.find((p) => String(p.id) === productoSel);
    const cantidad = normalizarNumero(cantidadSel, { permitirNegativo: false });
    if (!producto || cantidad <= 0) return;
    if (cantidad > producto.cantidad_stock) {
      toast.add({ title: `Solo hay ${producto.cantidad_stock} unidad(es) de ${producto.nombre}.`, type: "error" });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        clave: siguienteClave.current++,
        producto_id: producto.id,
        nombre_producto: producto.nombre,
        cantidad,
        precio_unitario: producto.precio_venta,
      },
    ]);
    setProductoSel("");
    setCantidadSel("1");
  };

  const agregarLibre = () => {
    const nombre = nombreLibre.trim();
    const cantidad = normalizarNumero(cantidadLibre, { permitirNegativo: false });
    const precio = normalizarNumero(precioLibre, { permitirNegativo: false });
    if (!nombre || cantidad <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        clave: siguienteClave.current++,
        producto_id: null,
        nombre_producto: nombre,
        cantidad,
        precio_unitario: precio,
      },
    ]);
    setNombreLibre("");
    setPrecioLibre("");
    setCantidadLibre("1");
  };

  const quitar = (indice: number) => setItems((prev) => prev.filter((_, i) => i !== indice));

  const confirmar = () => {
    if (!cliente.trim()) {
      toast.add({ title: "El nombre del cliente es obligatorio.", type: "error" });
      return;
    }
    if (items.length === 0) {
      toast.add({ title: "El pedido necesita al menos un ítem.", type: "error" });
      return;
    }
    startTransition(async () => {
      const resultado = await crearPedido({
        nombre_cliente: cliente.trim(),
        contacto: contacto.trim(),
        items: items.map((i) => ({
          producto_id: i.producto_id,
          nombre_producto: i.nombre_producto,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
        })),
      });
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      toast.add({ title: "Pedido creado.", type: "success" });
      setCliente("");
      setContacto("");
      setItems([]);
      router.push("/dashboard/pedidos");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente">Nombre del cliente *</Label>
            <Input id="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contacto">Contacto</Label>
            <Input id="contacto" value={contacto} onChange={(e) => setContacto(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ítems del pedido</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label id="label-producto-catalogo">Producto del catálogo</Label>
              <Select value={productoSel} onValueChange={(v) => setProductoSel(v ?? "")}>
                <SelectTrigger aria-labelledby="label-producto-catalogo">
                  <SelectValue placeholder="Selecciona un producto…" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre} — {formatearCOP(p.precio_venta)} (stock {p.cantidad_stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-24 flex-col gap-1.5">
              <Label htmlFor="cantidad-catalogo">Cantidad</Label>
              <Input
                id="cantidad-catalogo"
                inputMode="numeric"
                value={cantidadSel}
                onChange={(e) => setCantidadSel(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" onClick={agregarCatalogo}>
              <Plus className="size-4" /> Agregar
            </Button>
          </div>

          <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="item-personalizado">Ítem personalizado</Label>
              <Input
                id="item-personalizado"
                value={nombreLibre}
                onChange={(e) => setNombreLibre(e.target.value)}
                placeholder="Descripción libre…"
              />
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <Label htmlFor="precio-libre">Precio</Label>
              <Input
                id="precio-libre"
                inputMode="numeric"
                value={precioLibre}
                onChange={(e) => setPrecioLibre(e.target.value)}
              />
            </div>
            <div className="flex w-24 flex-col gap-1.5">
              <Label htmlFor="cantidad-libre">Cantidad</Label>
              <Input
                id="cantidad-libre"
                inputMode="numeric"
                value={cantidadLibre}
                onChange={(e) => setCantidadLibre(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" onClick={agregarLibre}>
              <Plus className="size-4" /> Agregar
            </Button>
          </div>

          {items.length > 0 && (
            <ul className="flex flex-col gap-1 border-t pt-3">
              {items.map((item, i) => (
                <li key={item.clave} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate tabular-nums">
                    {item.cantidad} × {item.nombre_producto || "Producto sin nombre"}
                    {item.producto_id == null && (
                      <span className="text-muted-foreground text-xs"> (personalizado)</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="whitespace-nowrap tabular-nums">
                      {formatearCOP(item.cantidad * item.precio_unitario)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      aria-label={`Quitar ${item.nombre_producto || "ítem"}`}
                      onClick={() => quitar(i)}
                    >
                      <X className="size-3" aria-hidden />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-right text-lg font-semibold tabular-nums">Total: {formatearCOP(total)}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button disabled={pendiente} onClick={confirmar}>
          Crear pedido
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
