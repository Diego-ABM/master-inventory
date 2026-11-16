import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domain/moneda";
import { esStockBajo } from "@/lib/domain/stock";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_MASCOTA } from "@/lib/domain/tipos";
import { diasRestantes, semaforo } from "@/lib/domain/vencimiento";
import { productoRepo } from "@/server/repositories/productos";

import { BotonFavorito } from "../../_components/boton-favorito";
import { BotonEliminarProducto } from "./_components/boton-eliminar";
import { ControlesStock } from "./_components/controles-stock";
import { GaleriaFotos } from "./_components/galeria-fotos";
import { MarcadoProveedor } from "./_components/marcado-proveedor";

export const dynamic = "force-dynamic";

const COLORES_SEMAFORO = {
  rojo: "destructive",
  naranja: "secondary",
  verde: "outline",
} as const;

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{etiqueta}</span>
      <span className="text-sm">{valor}</span>
    </div>
  );
}

export default async function PaginaDetalleProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await productoRepo.obtener(Number(id));
  if (!producto) notFound();

  const ahora = Date.now();
  const dias = producto.fecha_vencimiento != null ? diasRestantes(producto.fecha_vencimiento, ahora) : null;
  const color = semaforo(dias);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{producto.nombre}</h1>
          <BotonFavorito productoId={producto.id} esFavorito={producto.es_favorito === 1} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/dashboard/inventario/${producto.id}/editar`} />}>
            <Pencil className="size-4" /> Editar
          </Button>
          <BotonEliminarProducto productoId={producto.id} nombre={producto.nombre} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <GaleriaFotos productoId={producto.id} fotos={producto.fotos} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Dato etiqueta="Precio de venta" valor={formatearCOP(producto.precio_venta)} />
              <Dato etiqueta="Precio de compra" valor={formatearCOP(producto.precio_compra)} />
              <Dato etiqueta="Mascota" valor={ETIQUETAS_MASCOTA[producto.mascota]} />
              <Dato etiqueta="Categoría" valor={ETIQUETAS_CATEGORIA[producto.categoria]} />
              <Dato etiqueta="Peso" valor={producto.peso_kg != null ? `${producto.peso_kg} kg` : "No aplica"} />
              <Dato etiqueta="Variante" valor={producto.variante ?? "No aplica"} />
              {producto.descripcion && (
                <div className="col-span-2">
                  <Dato etiqueta="Descripción" valor={producto.descripcion} />
                </div>
              )}
              {producto.nota_advertencia && (
                <div className="col-span-2">
                  <Dato etiqueta="Nota de advertencia" valor={producto.nota_advertencia} />
                </div>
              )}
              {color && dias != null && (
                <div className="col-span-2">
                  <Dato
                    etiqueta="Vencimiento"
                    valor={
                      <Badge variant={COLORES_SEMAFORO[color]}>
                        {dias < 0 ? `Venció hace ${-dias} día(s)` : `Vence en ${dias} día(s)`}
                      </Badge>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <ControlesStock productoId={producto.id} stock={producto.cantidad_stock} />
                <div className="flex flex-col items-end gap-1">
                  {esStockBajo(producto) && <Badge variant="destructive">Stock Bajo</Badge>}
                  <span className="text-muted-foreground text-xs">Mínimo: {producto.stock_minimo}</span>
                </div>
              </div>
              <Button render={<Link href={`/dashboard/ventas/nueva?producto=${producto.id}`} />}>
                <ShoppingCart className="size-4" /> Registrar venta
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedido al proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <MarcadoProveedor
                productoId={producto.id}
                marcado={producto.pedir_al_proveedor === 1}
                notaInicial={producto.nota_pedido}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
