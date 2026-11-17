import Link from "next/link";

import { Bell, Package, Plus, ReceiptText, ShoppingBag, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domain/moneda";
import { diasRestantes, semaforo } from "@/lib/domain/vencimiento";
import { pedidoRepo } from "@/server/repositories/pedidos";
import { productoRepo } from "@/server/repositories/productos";
import { ventaRepo } from "@/server/repositories/ventas";

export const dynamic = "force-dynamic";

const DIA_MS = 24 * 60 * 60 * 1000;

const ACCESOS_RAPIDOS = [
  { href: "/dashboard/pedidos/nuevo", etiqueta: "Nuevo pedido", icono: Plus },
  { href: "/dashboard/ventas/nueva", etiqueta: "Nueva venta", icono: ShoppingCart },
  { href: "/dashboard/inventario", etiqueta: "Inventario", icono: Package },
  { href: "/dashboard/pedidos", etiqueta: "Pedidos", icono: ShoppingBag },
] as const;

function TarjetaResumen({
  titulo,
  valor,
  detalle,
  href,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:bg-muted/50 h-full transition-colors">
        <CardHeader className="pb-1">
          <CardTitle className="text-muted-foreground text-sm font-medium">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0.5">
          <p className="text-2xl font-semibold">{valor}</p>
          <p className="text-muted-foreground text-xs">{detalle}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function PaginaPanel() {
  const ahora = Date.now();
  const fecha = new Date(ahora);
  const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();

  const [ventasHoy, pedidosPendientes, agotados, vencimientos] = await Promise.all([
    ventaRepo.listar({ desde: inicioDia, hasta: inicioDia + DIA_MS }),
    pedidoRepo.listar({ entregado: false }),
    productoRepo.listarAgotados(),
    productoRepo.listarVencimientos(),
  ]);

  const totalHoy = ventasHoy.reduce((total, venta) => total + venta.total, 0);
  const proximosVencer = vencimientos.filter(
    (p) => p.fecha_vencimiento != null && semaforo(diasRestantes(p.fecha_vencimiento, ahora)) !== "verde",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Panel</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaResumen
          titulo="Ventas del día"
          valor={formatearCOP(totalHoy)}
          detalle={`${ventasHoy.length} venta(s) hoy`}
          href="/dashboard/ventas"
        />
        <TarjetaResumen
          titulo="Pedidos pendientes"
          valor={String(pedidosPendientes.length)}
          detalle="Pedidos por entregar"
          href="/dashboard/pedidos"
        />
        <TarjetaResumen
          titulo="Productos agotados"
          valor={String(agotados.length)}
          detalle="Con stock en cero"
          href="/dashboard/alertas"
        />
        <TarjetaResumen
          titulo="Vencimientos"
          valor={String(proximosVencer)}
          detalle="Vencidos o próximos a vencer"
          href="/dashboard/alertas"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACCESOS_RAPIDOS.map(({ href, etiqueta, icono: Icono }) => (
            <Button key={href} variant="outline" render={<Link href={href} />} className="h-auto flex-col gap-2 py-4">
              <Icono className="size-5" />
              <span>{etiqueta}</span>
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-medium">
          <ReceiptText className="size-4" aria-hidden /> Ventas de hoy
        </h2>
        {ventasHoy.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aún no hay ventas registradas hoy.</p>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-1 p-3">
              {ventasHoy.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span className="truncate">
                    {venta.items.map((i) => `${i.cantidad} × ${i.nombre_producto}`).join(", ")}
                  </span>
                  <span className="whitespace-nowrap">{formatearCOP(venta.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-medium">
          <Bell className="size-4" aria-hidden /> Alertas
        </h2>
        {agotados.length === 0 && proximosVencer === 0 ? (
          <p className="text-muted-foreground text-sm">Sin alertas: el stock y los vencimientos están al día.</p>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-1 p-3 text-sm">
              {agotados.length > 0 && (
                <p>
                  {agotados.length} producto(s) agotado(s).{" "}
                  <Link href="/dashboard/alertas" className="text-primary underline">
                    Ver alertas
                  </Link>
                </p>
              )}
              {proximosVencer > 0 && (
                <p>
                  {proximosVencer} producto(s) vencido(s) o próximo(s) a vencer.{" "}
                  <Link href="/dashboard/alertas" className="text-primary underline">
                    Ver alertas
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
