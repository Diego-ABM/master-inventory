"use client";

import { useTransition } from "react";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { salir } from "@/server/services/acceso";

export function BotonSalir() {
  const [pendiente, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Salir"
      title="Salir"
      disabled={pendiente}
      onClick={() => startTransition(async () => salir())}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
