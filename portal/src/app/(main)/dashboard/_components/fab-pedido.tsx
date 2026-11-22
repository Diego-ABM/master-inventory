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
      className="bg-primary text-primary-foreground hover:bg-primary/90 fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] flex size-14 items-center justify-center rounded-full shadow-lg transition-colors lg:right-[calc(1.5rem+env(safe-area-inset-right))] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      <Plus className="size-6" aria-hidden />
    </Link>
  );
}
