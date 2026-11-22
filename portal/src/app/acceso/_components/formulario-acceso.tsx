"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_CONFIG } from "@/config/app-config";
import { entrar } from "@/server/services/acceso";

export function FormularioAcceso() {
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [pendiente, startTransition] = useTransition();

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje("");
    startTransition(async () => {
      const resultado = await entrar(clave);
      if (!resultado.ok) setMensaje(resultado.mensaje);
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{APP_CONFIG.name}</CardTitle>
        <CardDescription>Ingresa la clave del negocio para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clave">Clave del negocio</Label>
            <Input
              id="clave"
              type="password"
              autoComplete="current-password"
              required
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </div>
          {mensaje && (
            <p className="text-destructive text-sm" role="alert">
              {mensaje}
            </p>
          )}
          <Button type="submit" disabled={pendiente}>
            {pendiente ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
