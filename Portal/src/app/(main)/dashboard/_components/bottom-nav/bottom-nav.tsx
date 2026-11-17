"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";
import { DatabaseBackup } from "lucide-react";

import { SECCIONES } from "../secciones";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones principales"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-stretch justify-between px-2">
        <div className="flex flex-1 items-stretch justify-around">
          {SECCIONES.map(({ href, etiqueta, icono: Icono }) => {
            const activa = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium",
                  activa ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icono className="size-5" aria-hidden />
                <span className="truncate">{etiqueta}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-stretch border-l">
          <Link
            href="/dashboard/respaldo"
            aria-current={pathname.startsWith("/dashboard/respaldo") ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 px-2.5 text-xs font-medium",
              pathname.startsWith("/dashboard/respaldo")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <DatabaseBackup className="size-5" aria-hidden />
            <span className="truncate">Respaldo</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
