# Data Model: Dashboard de métricas, navegación lateral y flujo de ventas dedicado

Sin cambios de esquema. Se documentan las entidades existentes que la feature toca y las nuevas estructuras derivadas/en memoria.

## Entidades persistidas (esquema existente, sin migración)

### Venta (`ventas`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | integer PK | |
| `fecha` | bigint (ms epoch) | Fuente de todas las métricas; los períodos se calculan sobre ella en hora local. |
| `total` | integer (COP) | Suma de `cantidad × precio_venta` de sus ítems. |

### VentaItem (`venta_items`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | integer PK | |
| `venta_id` | FK → ventas | ON DELETE cascade (comportamiento actual al eliminar venta). |
| `producto_id` | FK → productos, nullable | |
| `nombre_producto` | text | Congelado al momento de la venta. |
| `cantidad` | integer | Entero > 0, ≤ stock disponible al confirmar. |
| `precio_compra` | integer | Congelado del catálogo. |
| `precio_venta` | integer | Congelado del catálogo (precio fijo, no editable en POS). |

**Cambio de comportamiento (no de esquema)**: una venta ahora admite N ítems. `venta_items` ya lo soporta; `eliminarVenta` ya repone stock iterando `items`.

### Producto (`productos`) — solo lectura desde el POS

Se usa `productoRepo.listar()` para buscar por nombre, mostrar `precio_venta` y validar `cantidad_stock`. Su administración sigue en inventario.

## Estructuras derivadas (no persistidas)

### PeriodoMetricas (calculada en `src/lib/domain/metricas.ts`)

```ts
type PeriodoId = "hoy" | "semana" | "mes" | "anio";

interface PeriodoMetricas {
  id: PeriodoId;
  etiqueta: string;           // "Hoy" | "Semana" | "Mes" | "Año"
  totalVendido: number;       // COP
  numeroVentas: number;
  serie: PuntoSerie[];        // para la gráfica
}

interface PuntoSerie {
  etiqueta: string;           // "8 a. m.", "lun 17", "3", "ene" (es-CO)
  total: number;              // COP agregado del bucket
}
```

Funciones de dominio (firmas guía, nombres finales en implementación):

- `rangoPeriodo(periodo: PeriodoId, referencia: Date): { desde: number; hasta: number }`
  - `hoy`: 00:00 local → 24:00.
  - `semana`: lunes 00:00 de la semana en curso → domingo 24:00 (puede iniciar en el mes/año anterior).
  - `mes`: día 1 00:00 → fin de mes.
  - `anio`: 1 ene 00:00 → 31 dic 24:00.
- `agregarVentas(ventas: VentaConItems[], periodo: PeriodoId, referencia: Date): PeriodoMetricas`
  - Granularidad de `serie`: `hoy` → por hora (24 buckets); `semana` → por día lun–dom (7); `mes` → por día del mes; `anio` → por mes (12).
  - Ventas fuera del rango se ignoran; rango sin ventas → `serie` con buckets en 0 y la UI muestra estado vacío.

Reglas de validación heredadas: `calcularTotalVenta` exige cantidad entera > 0; `validarCantidad` exige ≤ stock.

### ItemCarrito (estado de cliente, POS)

```ts
interface ItemCarrito {
  producto_id: number;
  nombre_producto: string;
  precio_venta: number;   // precio del catálogo al agregarlo; el servidor lo re-lee al confirmar
  cantidad: number;
  stock_disponible: number; // para validar en cliente antes de confirmar
}
```

Reglas: el mismo producto suma cantidad en el ítem existente (no duplica fila); cantidad nunca excede `stock_disponible`; confirmar bloqueado con carrito vacío. El servidor re-valida todo en la transacción (la fuente de verdad es la BD).

### SeccionNav (config, `src/navigation/sidebar/sidebar-items.ts`)

Ya existe: `NavGroup[]` con `{ id, label?, items: NavMainItem[] }` donde cada item tiene `{ id, title, url, icon }`. Fuente única para sidebar, drawer móvil y buscador. Sin cambios de estructura; se conservan los dos grupos existentes ("Secciones", "Sistema") y se agrega un tercer grupo "Acciones" con el ítem "Nueva venta" → `/dashboard/ventas/nueva` (acceso exigido por FR-006).

## Máquina de estado del flujo de venta (POS)

```
[buscando] --agregar producto--> [carrito con N ítems]
[carrito]  --cambiar cantidad/quitar--> [carrito]   (consolida duplicados, valida stock)
[carrito]  --confirmar--> server action: valida items, stock, inserta venta + items, descuenta stock
            --ok--> toast + redirect /dashboard/ventas
            --error--> toast en español, carrito intacto
[cualquiera] --cancelar--> sale del flujo, sin venta ni descuento de stock
```
