import type { Categoria, Mascota } from "@/lib/domain/tipos";

import { readFileSync } from "node:fs";
import path from "node:path";

export interface ProductoSeed {
  nombre: string;
  descripcion: string;
  precio: number;
  cantidadStock: number;
  stockMinimo: number;
  mascota: Mascota;
  categoria: Categoria;
  variante: string | null;
  nota: string | null;
  fotos: string[];
  pesoKg?: number;
  tipoArena?: string | null;
  fechaVencimiento?: number | null;
}

const RUTA_SEED = path.join(process.cwd(), "seed", "productos_seed.json");

export function cargarSemilla(): ProductoSeed[] {
  const crudo = readFileSync(RUTA_SEED, "utf8");
  return JSON.parse(crudo) as ProductoSeed[];
}
