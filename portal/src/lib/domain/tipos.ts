export const MASCOTAS = ["PERRO", "GATO", "HAMSTER", "UNISEX"] as const;
export type Mascota = (typeof MASCOTAS)[number];

export const CATEGORIAS = ["LIMPIEZA_ASEO", "ACCESORIOS", "JUGUETES", "SNACKS"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ETIQUETAS_MASCOTA: Record<Mascota, string> = {
  PERRO: "Perro",
  GATO: "Gato",
  HAMSTER: "Hámster",
  UNISEX: "Unisex",
};

export const ETIQUETAS_CATEGORIA: Record<Categoria, string> = {
  LIMPIEZA_ASEO: "Limpieza y aseo",
  ACCESORIOS: "Accesorios",
  JUGUETES: "Juguetes",
  SNACKS: "Snacks",
};

export const NIVELES_LOG = ["INFO", "WARN", "ERROR"] as const;
export type NivelLog = (typeof NIVELES_LOG)[number];

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  precio_compra: number;
  cantidad_stock: number;
  stock_minimo: number;
  mascota: Mascota;
  categoria: Categoria;
  fecha_vencimiento: number | null;
  peso_kg: number | null;
  variante: string | null;
  nota_advertencia: string | null;
  es_favorito: 0 | 1;
  pedir_al_proveedor: 0 | 1;
  nota_pedido: string | null;
  fecha_actualizacion: number;
}

export interface FotoProducto {
  id: number;
  producto_id: number;
  ruta_archivo: string;
  orden: number;
}

export type ProductoConFotos = Producto & { fotos: FotoProducto[] };

export type ProductoListado = Producto & { foto_principal: string | null };

export interface NuevoProducto {
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  precio_compra?: number;
  cantidad_stock?: number;
  stock_minimo?: number;
  mascota?: Mascota;
  categoria?: Categoria;
  fecha_vencimiento?: number | null;
  peso_kg?: number | null;
  variante?: string | null;
  nota_advertencia?: string | null;
}

export interface DatosProducto extends NuevoProducto {
  precio_compra: number;
  cantidad_stock: number;
  stock_minimo: number;
  mascota: Mascota;
  categoria: Categoria;
}

export interface Venta {
  id: number;
  fecha: number;
  total: number;
}

export interface VentaItem {
  id: number;
  venta_id: number;
  producto_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_compra: number;
  precio_venta: number;
}

export type VentaConItems = Venta & { items: VentaItem[] };

export interface NuevoVentaItem {
  producto_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_compra: number;
  precio_venta: number;
}

export interface ItemVentaInput {
  producto_id: number;
  cantidad: number;
}

export type PeriodoId = "hoy" | "semana" | "mes" | "anio";

export interface PuntoSerie {
  etiqueta: string;
  total: number;
}

export interface PeriodoMetricas {
  id: PeriodoId;
  etiqueta: string;
  totalVendido: number;
  numeroVentas: number;
  serie: PuntoSerie[];
}

export interface PedidoCliente {
  id: number;
  nombre_cliente: string;
  contacto: string | null;
  fecha_pedido: number;
  entregado: 0 | 1;
  pagado: 0 | 1;
  stock_descontado: 0 | 1;
  total: number;
}

export interface PedidoItem {
  id: number;
  pedido_id: number;
  producto_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_compra: number;
  precio_unitario: number;
}

export type PedidoConItems = PedidoCliente & { items: PedidoItem[] };

export interface NuevoPedido {
  nombre_cliente: string;
  contacto?: string | null;
  fecha_pedido: number;
  total: number;
}

export interface NuevoPedidoItem {
  producto_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_compra: number;
  precio_unitario: number;
}

export interface LogEntry {
  id: number;
  timestamp: number;
  nivel: NivelLog;
  modulo: string;
  mensaje: string;
  excepcion: string | null;
}
