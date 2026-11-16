# Quickstart — Guía de validación de Master Inventory

Escenarios ejecutables para comprobar la funcionalidad de punta a punta usando solo la aplicación (constitución, principio IV). Cada escenario referencia las historias de `spec.md` y los contratos de `contracts/`.

## Prerrequisitos

- Node ≥ 22.5 (desarrollo: Node 26) y pnpm.
- Dependencias instaladas: `cd Portal && pnpm install`.
- Semilla disponible: `Portal/seed/productos_seed.json` (76 ítems) + `Portal/public/seed/images/` (62 PNG) — copiados desde MrKlaus `app/src/main/assets/`.
- Arranque: `cd Portal && pnpm dev` → abrir `http://localhost:3000`.
- Datos en `Portal/data/` (`master-inventory.db` + `fotos/`). Para "sistema limpio": borrar `data/` antes de arrancar.

## Escenarios de validación

### V1 — Primer arranque y catálogo inicial (US1, FR-017, SC-002)

1. Con `data/` vacío, arrancar la app y abrir **Inventario**.
2. Se ven los 76 productos del catálogo con foto, precio y chips; no pidió digitar nada.
3. Buscar "arena" y filtrar por mascota Gato + categoría Limpieza y aseo a la vez → solo coincidencias; hacerlo en < 10 s.
4. Reiniciar la app → el catálogo no se duplica ni borra nada.

### V2 — CRUD de producto (US1, FR-001–FR-003, SC-001)

1. Crear producto solo con nombre y precio → aparece en la lista (stock 0, mínimo 3).
2. Abrir su detalle, subir 5 fotos; intentar una 6.ª → bloqueado.
3. Ajustar stock con +/− → cambia en pantalla.
4. Editar nombre/variante → persiste tras recargar.
5. Eliminar con confirmación → desaparece (y sus fotos dejan de servirse).

### V3 — Venta con stock y precio congelado (US2, FR-006–FR-008, SC-003)

1. Producto con stock 10 → registrar venta de 3 → stock queda en 7, venta en **Ventas** con fecha, ítem y total.
2. Editar el precio del producto → la venta y los reportes siguen con el precio anterior.
3. Intentar vender más que el stock, 0 o negativo → bloqueado.
4. Eliminar la venta con confirmación → stock repone 3 y deja de contar en reportes.

### V4 — Pedido de cliente y descuento único (US3, FR-009, FR-010)

1. Crear pedido: cliente (obligatorio), 5 unidades de un producto de catálogo + un ítem personalizado → total = Σ cantidad × precio.
2. Marcar **Entregado** → stock del ítem de catálogo baja 5; el personalizado no mueve nada.
3. Desmarcar Entregado → aviso de corrección manual; el stock **no** se repone. Re-marcar → no vuelve a descontar.
4. Editar el precio del producto en catálogo → el total del pedido no cambia.
5. Pedido entregado y pago pendiente → no suma a reportes hasta marcar **Pagado**.
6. Intentar eliminar el pedido entregado → bloqueado; uno pendiente sí se elimina.

### V5 — Marcados a proveedor (US4, FR-011)

1. Marcar un producto "para próximo pedido" con nota → aparece en la lista de marcados; la Inversión Pendiente del reporte suma `stock_minimo × precio_compra`.
2. Editar la nota / desmarcar → la lista y el indicador se actualizan de inmediato.

### V6 — Alertas (US5, FR-012, SC-005)

1. Crear productos que venzan en 12 días (rojo), 45 (naranja), 90 (verde), uno sin fecha (ausente) y uno con stock 0.
2. **Alertas** muestra vencimientos del más próximo al más lejano con el color correcto; el de stock 0 aparece en Agotados.
3. Un producto con `stock ≤ stock_minimo` muestra "Stock Bajo" en su tarjeta en cualquier lista.

### V7 — Favoritos y ranking (US6, FR-004)

1. Marcar dos favoritos (uno desde tarjeta, otro desde detalle) → ambos en **Mis Favoritos**; desmarcar → salen.
2. Con ventas registradas → debajo aparece el ranking por unidades vendidas; sin ventas → mensaje de sección vacía.

### V8 — Reportes y exportación (US7, FR-013, FR-014, SC-004)

1. Con ventas y pedidos entregados+pagados de ejemplo del mes: verificar ganancia bruta, neta, capital en stock e inversión pendiente contra el cálculo manual (tolerancia 0).
2. Ranking de rotación ordenado de mayor a menor unificando ambos orígenes.
3. Navegar al mes anterior/siguiente y al modo anual.
4. Exportar → descarga `.txt` con encabezado, periodo, resumen y top (ver `contracts/report-format.md`).
5. Periodo sin movimientos → indicadores en 0 y mensaje "no hay registros en este periodo".

### V9 — Respaldo y restauración (US8, FR-015, SC-006, SC-007)

1. Con datos registrados, **Respaldo** → exportar → descarga el JSON (ver `contracts/backup-format.md`).
2. En sistema limpio (borrar `data/`), importar el archivo → tras la recarga todo queda igual: productos con fotos, ventas, pedidos, marcados.
3. Importar un archivo dañado/inválido → error informado y datos actuales intactos.
4. En sistema con datos, restaurar respaldo válido → pide confirmación explícita; al confirmar, reemplaza todo (sin mezclar).

### V10 — Logs (US9, FR-016, CL10)

1. Pantalla de logs muestra entradas con fecha, nivel (INFO/WARN/ERROR), módulo y mensaje.
2. Botón de limpieza elimina registros antiguos; en arranque, los > 90 días se limpian solos sin tocar datos de negocio.

### V11 — Eliminación de producto con referencias (CL7)

1. Producto vendido antes y presente en un pedido pendiente → eliminarlo con confirmación.
2. El historial de ventas conserva nombre y precios congelados; el pedido pendiente pierde ese ítem con aviso; si queda vacío, se sugiere eliminar el pedido.

## Verificación técnica (opcional, para quien desarrolla)

```bash
cd Portal
node --test src/lib/domain/**/*.test.ts   # lógica pura: stock, precios, semáforo, reportes
pnpm check                              # Biome lint/format
pnpm build                              # build de Next.js
```
