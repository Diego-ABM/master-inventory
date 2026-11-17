"use client";

import { useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { normalizarNumero } from "@/lib/domain/moneda";
import {
  CATEGORIAS,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_MASCOTA,
  MASCOTAS,
  type ProductoConFotos,
} from "@/lib/domain/tipos";
import { comprimirFoto } from "@/lib/imagen";
import { actualizarProducto, agregarFoto, crearProducto } from "@/server/services/productos";

const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  descripcion: z.string(),
  precio_venta: z.string(),
  precio_compra: z.string(),
  cantidad_stock: z.string(),
  stock_minimo: z.string(),
  mascota: z.enum(MASCOTAS),
  categoria: z.enum(CATEGORIAS),
  fecha_vencimiento: z.string(),
  peso_kg: z.string(),
  variante: z.string(),
  nota_advertencia: z.string(),
});

type Valores = z.infer<typeof esquema>;

function aEpoch(fecha: string): number | null {
  if (!fecha) return null;
  const ms = Date.parse(`${fecha}T00:00:00`);
  return Number.isNaN(ms) ? null : ms;
}

function aFechaInput(epoch: number | null): string {
  if (epoch == null) return "";
  const d = new Date(epoch);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function FormularioProducto({ producto }: { producto?: ProductoConFotos }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [fotos, setFotos] = useState<File[]>([]);
  const editar = producto != null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: producto?.nombre ?? "",
      descripcion: producto?.descripcion ?? "",
      precio_venta: producto ? String(producto.precio_venta) : "",
      precio_compra: producto ? String(producto.precio_compra) : "",
      cantidad_stock: producto ? String(producto.cantidad_stock) : "",
      stock_minimo: producto ? String(producto.stock_minimo) : "",
      mascota: producto?.mascota ?? "UNISEX",
      categoria: producto?.categoria ?? "ACCESORIOS",
      fecha_vencimiento: aFechaInput(producto?.fecha_vencimiento ?? null),
      peso_kg: producto?.peso_kg != null ? String(producto.peso_kg) : "",
      variante: producto?.variante ?? "",
      nota_advertencia: producto?.nota_advertencia ?? "",
    },
  });

  useEffect(() => {
    if (!isDirty) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [isDirty]);

  const enviar = handleSubmit((valores) => {
    const datos = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      precio_venta: normalizarNumero(valores.precio_venta, { permitirNegativo: false }),
      precio_compra: normalizarNumero(valores.precio_compra, { permitirNegativo: false }),
      cantidad_stock: normalizarNumero(valores.cantidad_stock, { permitirNegativo: false }),
      stock_minimo: normalizarNumero(valores.stock_minimo, { permitirNegativo: false }),
      mascota: valores.mascota,
      categoria: valores.categoria,
      fecha_vencimiento: aEpoch(valores.fecha_vencimiento),
      peso_kg: valores.peso_kg.trim() === "" ? null : Number.parseFloat(valores.peso_kg.replace(",", ".")) || 0,
      variante: valores.variante.trim() || null,
      nota_advertencia: valores.nota_advertencia.trim() || null,
    };

    startTransition(async () => {
      if (editar) {
        const resultado = await actualizarProducto(producto.id, datos);
        if (!resultado.ok) {
          toast.add({ title: resultado.mensaje, type: "error" });
          return;
        }
        toast.add({ title: "Producto actualizado.", type: "success" });
        router.push(`/dashboard/inventario/${producto.id}`);
        return;
      }

      const resultado = await crearProducto(datos);
      if (!resultado.ok) {
        toast.add({ title: resultado.mensaje, type: "error" });
        return;
      }
      const id = resultado.data?.id ?? 0;
      let fallaron = 0;
      for (const archivo of fotos.slice(0, 5)) {
        const formData = new FormData();
        formData.set("foto", archivo);
        const r = await agregarFoto(id, formData);
        if (!r.ok) fallaron += 1;
      }
      toast.add({
        title: fallaron > 0 ? `Producto creado; ${fallaron} foto(s) no se pudieron subir.` : "Producto creado.",
        type: fallaron > 0 ? "warning" : "success",
      });
      router.push(`/dashboard/inventario/${id}`);
    });
  });

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...register("nombre")} aria-invalid={!!errors.nombre} />
            {errors.nombre && <p className="text-destructive text-xs">{errors.nombre.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="precio_venta">Precio de venta (COP) *</Label>
            <Input id="precio_venta" inputMode="numeric" placeholder="20000" {...register("precio_venta")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="precio_compra">Precio de compra (COP)</Label>
            <Input id="precio_compra" inputMode="numeric" placeholder="0" {...register("precio_compra")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cantidad_stock">Cantidad en stock</Label>
            <Input id="cantidad_stock" inputMode="numeric" placeholder="0" {...register("cantidad_stock")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock_minimo">Stock mínimo</Label>
            <Input id="stock_minimo" inputMode="numeric" placeholder="3" {...register("stock_minimo")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label id="label-mascota">Mascota</Label>
            <Select value={watch("mascota")} onValueChange={(v) => setValue("mascota", v as Valores["mascota"])}>
              <SelectTrigger aria-labelledby="label-mascota">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MASCOTAS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {ETIQUETAS_MASCOTA[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label id="label-categoria">Categoría</Label>
            <Select value={watch("categoria")} onValueChange={(v) => setValue("categoria", v as Valores["categoria"])}>
              <SelectTrigger aria-labelledby="label-categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {ETIQUETAS_CATEGORIA[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fecha_vencimiento">Fecha de vencimiento</Label>
            <Input id="fecha_vencimiento" type="date" {...register("fecha_vencimiento")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="peso_kg">Peso (kg)</Label>
            <Input id="peso_kg" inputMode="decimal" placeholder="Opcional" {...register("peso_kg")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="variante">Variante</Label>
            <Input id="variante" placeholder="Sabor, talla, tipo…" {...register("variante")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nota_advertencia">Nota de advertencia</Label>
            <Input id="nota_advertencia" placeholder="Opcional" {...register("nota_advertencia")} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={3} {...register("descripcion")} />
          </div>

          {!editar && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fotos">Fotos (máximo 5)</Label>
              <Input
                id="fotos"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={async (e) => {
                  const seleccionados = Array.from(e.target.files ?? []).slice(0, 5);
                  e.target.value = "";
                  const listos: File[] = [];
                  for (const archivo of seleccionados) {
                    try {
                      listos.push(await comprimirFoto(archivo));
                    } catch (error) {
                      toast.add({
                        title: error instanceof Error ? error.message : "No se pudo leer la imagen.",
                        type: "error",
                      });
                    }
                  }
                  setFotos(listos);
                }}
              />
              {fotos.length > 0 && (
                <p className="text-muted-foreground text-xs">{fotos.length} foto(s) seleccionada(s).</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente}>
          {editar ? "Guardar cambios" : "Crear producto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
