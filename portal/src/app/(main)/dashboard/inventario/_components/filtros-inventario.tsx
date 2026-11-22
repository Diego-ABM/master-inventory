"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIAS,
  type Categoria,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_MASCOTA,
  MASCOTAS,
  type Mascota,
} from "@/lib/domain/tipos";

const TODAS = "__todas__";

export function FiltrosInventario() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [texto, setTexto] = useState(searchParams.get("texto") ?? "");

  const aplicar = (cambios: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const textoRef = useRef(texto);
  useEffect(() => {
    textoRef.current = texto;
    const id = setTimeout(() => {
      const valor = textoRef.current.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (valor) params.set("texto", valor);
      else params.delete("texto");
      router.replace(`${pathname}?${params.toString()}`);
    }, 250);
    return () => clearTimeout(id);
  }, [texto, pathname, router, searchParams]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por nombre…"
        className="sm:max-w-xs"
        aria-label="Buscar producto"
      />
      <Select
        value={searchParams.get("mascota") ?? TODAS}
        onValueChange={(v) => aplicar({ mascota: v === TODAS ? null : v })}
      >
        <SelectTrigger className="sm:w-40" aria-label="Filtrar por mascota">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas las mascotas</SelectItem>
          {MASCOTAS.map((m: Mascota) => (
            <SelectItem key={m} value={m}>
              {ETIQUETAS_MASCOTA[m]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("categoria") ?? TODAS}
        onValueChange={(v) => aplicar({ categoria: v === TODAS ? null : v })}
      >
        <SelectTrigger className="sm:w-44" aria-label="Filtrar por categoría">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas las categorías</SelectItem>
          {CATEGORIAS.map((c: Categoria) => (
            <SelectItem key={c} value={c}>
              {ETIQUETAS_CATEGORIA[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
