import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domain/moneda";
import { esStockBajo } from "@/lib/domain/stock";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_MASCOTA, type ProductoListado } from "@/lib/domain/tipos";

import { BotonFavorito } from "./boton-favorito";

export function TarjetaProducto({ producto }: { producto: ProductoListado }) {
  return (
    <Card className="relative overflow-hidden py-0">
      <Link href={`/dashboard/inventario/${producto.id}`} className="block">
        <div className="bg-muted flex aspect-square items-center justify-center overflow-hidden">
          {producto.foto_principal ? (
            // biome-ignore lint/performance/noImgElement: fotos locales del catálogo; next/image no aporta aquí
            <img
              src={producto.foto_principal}
              alt={producto.nombre}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-muted-foreground text-sm">Sin foto</span>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/inventario/${producto.id}`}
            className="line-clamp-2 text-sm leading-tight font-medium hover:underline"
          >
            {producto.nombre}
          </Link>
          <BotonFavorito productoId={producto.id} esFavorito={producto.es_favorito === 1} />
        </div>
        <p className="text-base font-semibold">{formatearCOP(producto.precio_venta)}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{ETIQUETAS_MASCOTA[producto.mascota]}</Badge>
          <Badge variant="outline">{ETIQUETAS_CATEGORIA[producto.categoria]}</Badge>
          {producto.peso_kg != null && <Badge variant="outline">{producto.peso_kg} kg</Badge>}
        </div>
        {esStockBajo(producto) && <Badge variant="destructive">Stock Bajo</Badge>}
      </CardContent>
    </Card>
  );
}
