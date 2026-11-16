import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const DIRECTORIO_DATA = path.join(process.cwd(), "data");
export const DIRECTORIO_FOTOS = path.join(DIRECTORIO_DATA, "fotos");
const RUTA_DB = path.join(DIRECTORIO_DATA, "master-inventory.db");

const NOVENTA_DIAS_MS = 90 * 24 * 60 * 60 * 1000;

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio_venta INTEGER NOT NULL,
  precio_compra INTEGER NOT NULL DEFAULT 0,
  cantidad_stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 3,
  mascota TEXT NOT NULL DEFAULT 'UNISEX',
  categoria TEXT NOT NULL DEFAULT 'ACCESORIOS',
  fecha_vencimiento INTEGER,
  peso_kg REAL,
  variante TEXT,
  nota_advertencia TEXT,
  es_favorito INTEGER NOT NULL DEFAULT 0,
  pedir_al_proveedor INTEGER NOT NULL DEFAULT 0,
  nota_pedido TEXT,
  fecha_actualizacion INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fotos_producto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  ruta_archivo TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha INTEGER NOT NULL,
  total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS venta_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  nombre_producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_compra INTEGER NOT NULL,
  precio_venta INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos_clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_cliente TEXT NOT NULL,
  contacto TEXT,
  fecha_pedido INTEGER NOT NULL,
  entregado INTEGER NOT NULL DEFAULT 0,
  pagado INTEGER NOT NULL DEFAULT 0,
  stock_descontado INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pedido_cliente_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL REFERENCES pedidos_clientes(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  nombre_producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_compra INTEGER NOT NULL DEFAULT 0,
  precio_unitario INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  nivel TEXT NOT NULL,
  modulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  excepcion TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
`;

let instancia: DatabaseSync | null = null;

export function abrirDb(): DatabaseSync {
  if (instancia) return instancia;
  mkdirSync(DIRECTORIO_FOTOS, { recursive: true });
  const db = new DatabaseSync(RUTA_DB);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(ESQUEMA);
  instancia = db;
  return db;
}

export function transaccion<T>(fn: () => T): T {
  const db = abrirDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const resultado = fn();
    db.exec("COMMIT");
    return resultado;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function ejecutarInit(): void {
  const db = abrirDb();
  db.prepare("DELETE FROM logs WHERE timestamp < ?").run(Date.now() - NOVENTA_DIAS_MS);
}

// node:sqlite devuelve filas con prototipo nulo; los Client Components de React
// solo aceptan objetos planos, así que las copiamos al salir del repositorio.
export function aObjetos<T>(filas: unknown): T[] {
  return (filas as Record<string, unknown>[]).map((f) => ({ ...f }) as T);
}

export function aObjeto<T>(fila: unknown): T | null {
  return fila == null ? null : ({ ...(fila as Record<string, unknown>) } as T);
}
