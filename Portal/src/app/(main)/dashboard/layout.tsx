import type { ReactNode } from "react";

import { cn } from "cn";

import { APP_CONFIG } from "@/config/app-config";

import { BottomNav } from "./_components/bottom-nav/bottom-nav";
import { LayoutControls } from "./_components/header/layout-controls";
import { SearchDialog } from "./_components/header/search-dialog";
import { ThemeSwitcher } from "./_components/header/theme-switcher";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cn(
          "flex h-12 shrink-0 items-center border-b",
          "[html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{APP_CONFIG.name}</span>
            <SearchDialog />
          </div>
          <div className="flex items-center gap-2">
            <LayoutControls />
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden pb-20">
        <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
