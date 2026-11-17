import type { ReactNode } from "react";

import { cn } from "cn";

import { APP_CONFIG } from "@/config/app-config";

import { BotonSalir } from "./_components/boton-salir";
import { BottomNav } from "./_components/bottom-nav/bottom-nav";
import { FabPedido } from "./_components/fab-pedido";
import { LayoutControls } from "./_components/header/layout-controls";
import { SearchDialog } from "./_components/header/search-dialog";
import { ThemeSwitcher } from "./_components/header/theme-switcher";
import { NavHeader } from "./_components/nav-header";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="bg-background text-foreground ring-ring/50 sr-only rounded-md px-4 py-2 text-sm shadow-md outline-none focus:not-sr-only focus:mx-4 focus:mt-2 focus:w-fit focus:ring-2"
      >
        Saltar al contenido principal
      </a>
      <header
        className={cn(
          "flex h-12 shrink-0 items-center border-b",
          "[html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-sm font-semibold">{APP_CONFIG.name}</span>
            <SearchDialog />
            <NavHeader />
          </div>
          <div className="flex items-center gap-2">
            <LayoutControls />
            <ThemeSwitcher />
            <BotonSalir />
          </div>
        </div>
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6">{children}</div>
      </main>
      <BottomNav />
      <FabPedido />
    </div>
  );
}
