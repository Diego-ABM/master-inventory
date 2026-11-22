"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

import { SECCIONES } from "./secciones";

export function NavHeader() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones principales" className="hidden lg:flex lg:items-center lg:gap-1">
      {SECCIONES.map(({ href, etiqueta, icono: Icono }) => {
        const activa = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activa ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icono className="size-4" aria-hidden />
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
