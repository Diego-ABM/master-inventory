"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Plus } from "lucide-react";

export function FabPedido() {
  const pathname = usePathname();
  if (pathname === "/dashboard/pedidos/nuevo") return null;

  return (
    <Link
      href="/dashboard/pedidos/nuevo"
      aria-label="Nuevo pedido"
      className="bg-primary text-primary-foreground hover:bg-primary/90 fixed right-4 bottom-20 z-[60] flex size-14 items-center justify-center rounded-full shadow-lg transition-colors lg:right-6 lg:bottom-6"
    >
      <Plus className="size-6" aria-hidden />
    </Link>
  );
}
