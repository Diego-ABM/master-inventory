import type { Categoria, Mascota } from "@/lib/domain/tipos";

import productosSeed from "../../seed/productos_seed.json";

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

export function cargarSemilla(): ProductoSeed[] {
  return productosSeed as ProductoSeed[];
}
