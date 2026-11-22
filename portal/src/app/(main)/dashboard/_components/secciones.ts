import { Bell, Heart, LayoutDashboard, Package, ReceiptText, ShoppingBag } from "lucide-react";

export const SECCIONES = [
  { href: "/dashboard", etiqueta: "Panel", icono: LayoutDashboard },
  { href: "/dashboard/inventario", etiqueta: "Inventario", icono: Package },
  { href: "/dashboard/favoritos", etiqueta: "Favoritos", icono: Heart },
  { href: "/dashboard/alertas", etiqueta: "Alertas", icono: Bell },
  { href: "/dashboard/pedidos", etiqueta: "Pedidos", icono: ShoppingBag },
  { href: "/dashboard/ventas", etiqueta: "Ventas", icono: ReceiptText },
] as const;
