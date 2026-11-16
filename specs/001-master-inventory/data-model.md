# Data Model — Master Inventory

Modelo de persistencia en SQLite (`node:sqlite`, archivo `data/master-inventory.db`). Espeja las entidades de MrKlaus (Room) ajustadas a la spec. Todos los importes en **pesos enteros** (`INTEGER`); fechas en **epoch ms** (`INTEGER`); booleanos como `0/1`. `PRAGMA foreign_keys = ON`.

## Entidades

### `productos`

Artículo del inventario (FR-001, FR-002, FR-011).

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `nombre` | TEXT NOT NULL | Obligatorio; **no único** (productos homónimos se distinguen por variante/peso/mascota — CL de spec) |
| `descripcion` | TEXT NOT NULL DEFAULT '' | |
| `precio_venta` | INTEGER NOT NULL | Obligatorio; entrada inválida → 0 (CL9) |
| `precio_compra` | INTEGER NOT NULL DEFAULT 0 | Costo; si el seed no lo trae → 70 % de `precio_venta` |
| `cantidad_stock` | INTEGER NOT NULL DEFAULT 0 | Nunca < 0 por reglas de negocio |
| `stock_minimo` | INTEGER NOT NULL DEFAULT 3 | Default 3 al crear |
| `mascota` | TEXT NOT NULL DEFAULT 'UNISEX' | Enum: `PERRO`, `GATO`, `HAMSTER`, `UNISEX` |
| `categoria` | TEXT NOT NULL DEFAULT 'ACCESORIOS' | Enum: `LIMPIEZA_ASEO`, `ACCESORIOS`, `JUGUETES`, `SNACKS` |
| `fecha_vencimiento` | INTEGER NULL | NULL = "No aplica"; puede estar en el pasado (CL8) |
| `peso_kg` | REAL NULL | Opcional |
| `variante` | TEXT NULL | Opcional (ej. sabor, talla; incluye lo que MrKlaus llamaba `tipo_arena`) |
| `nota_advertencia` | TEXT NULL | Opcional |
| `es_favorito` | INTEGER NOT NULL DEFAULT 0 | Corazón en tarjetas/detalle (FR-004) |
| `pedir_al_proveedor` | INTEGER NOT NULL DEFAULT 0 | Marcado "para próximo pedido" (FR-011) |
| `nota_pedido` | TEXT NULL | Nota libre del marcado a proveedor |
| `fecha_actualizacion` | INTEGER NOT NULL | Se actualiza en cada escritura |

Reglas derivadas (dominio, no columnas):
- **Stock Bajo**: `cantidad_stock <= stock_minimo` → aviso en tarjetas (FR-012).
- **Agotado**: `cantidad_stock <= 0` → sección "Agotados" de Alertas.
- **Semáforo de vencimiento** (días restantes vs. fecha de referencia): `≤ 30` → rojo; `31–60` → naranja; `> 60` → verde; `fecha_vencimiento IS NULL` → no aparece (FR-012, CL8).

### `fotos_producto`

Hasta 5 fotos por producto (FR-001).

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `producto_id` | INTEGER NOT NULL → `productos(id)` ON DELETE CASCADE | |
| `ruta_archivo` | TEXT NOT NULL | `/seed/images/<archivo>` (catálogo) o `/api/fotos/<archivo>` (subidas) |
| `orden` | INTEGER NOT NULL DEFAULT 0 | Orden de exhibición |

Validación: `COUNT(fotos del producto) < 5` para agregar; al borrar fila/producto se elimina el archivo físico si vive en `data/fotos/` (CL7).

### `ventas`

Transacción de venta directa de **un** producto (FR-006–FR-008; las ventas multi-producto están fuera de alcance).

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `fecha` | INTEGER NOT NULL | Fecha/hora del registro |
| `total` | INTEGER NOT NULL | `cantidad × precio_venta` del ítem (congelado) |

### `venta_items`

Un ítem por venta (la tabla existe para no perder la separación encabezado/detalle de MrKlaus y facilitar reportes).

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `venta_id` | INTEGER NOT NULL → `ventas(id)` ON DELETE CASCADE | |
| `producto_id` | INTEGER NULL → `productos(id)` ON DELETE SET NULL | NULL si el producto fue eliminado; el historial sobrevive por los datos congelados (CL7) |
| `nombre_producto` | TEXT NOT NULL | **Congelado** al vender |
| `cantidad` | INTEGER NOT NULL | `1 ≤ cantidad ≤ stock disponible` al registrar (CL1) |
| `precio_compra` | INTEGER NOT NULL | **Congelado** al vender |
| `precio_venta` | INTEGER NOT NULL | **Congelado** al vender |

Reglas de negocio:
- Registrar venta (transacción): validar cantidad → `productos.cantidad_stock -= cantidad` → insertar venta + ítem con datos congelados.
- Eliminar venta (transacción, con confirmación — CL11): devolver `cantidad` al stock si `producto_id` aún existe → borrar venta (los reportes la dejan de contar).

### `pedidos_clientes`

Venta diferida (FR-009, FR-010).

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `nombre_cliente` | TEXT NOT NULL | Obligatorio |
| `contacto` | TEXT NULL | Opcional |
| `fecha_pedido` | INTEGER NOT NULL | |
| `entregado` | INTEGER NOT NULL DEFAULT 0 | Estado entrega |
| `pagado` | INTEGER NOT NULL DEFAULT 0 | Estado pago |
| `stock_descontado` | INTEGER NOT NULL DEFAULT 0 | Candado de "descuento una sola vez" (FR-010) |
| `total` | INTEGER NOT NULL | `Σ(cantidad × precio_unitario)` de ítems |

Reglas de negocio:
- **Estados**: `pendiente/entregado` × `pago pendiente/pagado` (banderas independientes).
- Marcar `entregado` **por primera vez** (`stock_descontado = 0`, transacción): para cada ítem con `producto_id` → `productos.cantidad_stock -= cantidad`; luego `stock_descontado = 1`. Ítems personalizados no afectan stock (CL6).
- Desmarcar `entregado`: permitido, **no repone** stock; el sistema avisa que la corrección es manual con +/− (CL2). Re-marcar no vuelve a descontar (candado).
- Solo pedidos **pendientes** (`entregado = 0`) se pueden eliminar; entregado queda congelado: ni eliminar ni modificar (CL12).
- En reportes solo cuentan pedidos `entregado = 1 AND pagado = 1` del periodo (FR-013, US3.4).

### `pedido_cliente_items`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `pedido_id` | INTEGER NOT NULL → `pedidos_clientes(id)` ON DELETE CASCADE | |
| `producto_id` | INTEGER NULL → `productos(id)` ON DELETE SET NULL | NULL = ítem personalizado o producto eliminado |
| `nombre_producto` | TEXT NOT NULL | Nombre del catálogo (congelado al crear el pedido) o texto libre del personalizado |
| `cantidad` | INTEGER NOT NULL | > 0; en ítems de catálogo ≤ stock disponible al crear el pedido (CL1) |
| `precio_compra` | INTEGER NOT NULL DEFAULT 0 | Congelado al crear el pedido (0 en personalizados) |
| `precio_unitario` | INTEGER NOT NULL | Congelado al crear el pedido |

Regla asociada (CL7): al eliminar un producto, sus ítems se retiran de pedidos **pendientes** (borrado de la fila del ítem, no SET NULL — el aviso al dueño lista los pedidos afectados; si un pedido queda sin ítems se sugiere eliminarlo).

### `logs`

Registros internos (FR-016).

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `timestamp` | INTEGER NOT NULL | |
| `nivel` | TEXT NOT NULL | `INFO`, `WARN`, `ERROR` |
| `modulo` | TEXT NOT NULL | Tag del módulo origen |
| `mensaje` | TEXT NOT NULL | |
| `excepcion` | TEXT NULL | Detalle del error si aplica |

Limpieza automática al iniciar: `DELETE WHERE timestamp < ahora - 90 días` (CL10). Limpieza manual desde la pantalla. Los logs **no** entran al respaldo.

### `meta`

Configuración interna clave-valor.

| Campo | Tipo | Reglas |
|---|---|---|
| `clave` | TEXT PK | `semilla_cargada`, `version_esquema` |
| `valor` | TEXT NOT NULL | |

## Relaciones

```text
productos 1───* fotos_producto        (CASCADE)
productos 1───* venta_items           (SET NULL al borrar producto)
productos 1───* pedido_cliente_items  (SET NULL al borrar producto)
ventas 1───* venta_items              (CASCADE)
pedidos_clientes 1───* pedido_cliente_items (CASCADE)
```

## Transiciones de estado relevantes

```text
Pedido de cliente:
  pendiente ──[marcar Entregado, 1ª vez]──▶ entregado (stock_descontado=1, stock-=Σcatálogo)
  entregado ──[desmarcar]──▶ pendiente    (stock NO se repone; aviso de corrección manual)
  entregado: congelado (no editable, no eliminable)         — CL12
  cualquier estado: pagado ⟷ pago pendiente (independiente)

Venta:
  registrada ──[eliminar + confirmar]──▶ eliminada (stock += cantidad si producto existe) — CL11

Producto:
  activo ──[eliminar + confirmar]──▶ eliminado
    · fotos físicas en data/fotos borradas
    · venta_items conservan datos congelados (producto_id → NULL)
    · ítems en pedidos pendientes retirados con aviso; pedido vacío → sugerir eliminar — CL7
```

## Reglas de validación consolidadas (dominio)

- Crear producto exige solo `nombre` y `precio_venta`; resto opcional o con default (stock 0, mínimo 3, UNISEX, ACCESORIOS).
- Cantidades de venta/pedido: enteros `> 0` y `≤ stock` del producto (CL1).
- Máximo 5 fotos por producto.
- `nombre_cliente` obligatorio en pedido; pedido exige `≥ 1` ítem.
- Entrada numérica inválida/vacía → 0, nunca error de parseo visible (CL9).
- Precios/totales siempre desde datos congelados del ítem (ventas y pedidos), nunca desde el producto actual (CL de precios).
