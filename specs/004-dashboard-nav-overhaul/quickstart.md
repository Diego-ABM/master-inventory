# Quickstart: validación de la feature

Guía de verificación end-to-end usando la app. Detalles de datos en [data-model.md](./data-model.md) y contratos en [contracts/](./contracts/).

## Prerequisitos

```bash
cd portal
pnpm install
# STORAGE_POSTGRES_URL configurado (.env.local o `vercel env pull`)
pnpm dev
```

La app queda en `http://localhost:3000` → `/dashboard`.

## Checks automatizados

```bash
cd portal
node --test 'src/lib/domain/*.test.ts'   # incluye metricas.test.ts nuevo
pnpm check                              # lint + format (Biome)
pnpm build                              # typecheck + compilación
```

Resultado esperado: tests de dominio en verde (rangos de período, agregación por hora/día/mes, total multi-ítem), sin errores de Biome ni de TypeScript.

## Escenario 1 — Métricas por período (US1)

1. Registra 2–3 ventas hoy (ver escenario 2) y, si es posible, usa datos de días anteriores ya existentes.
2. Abre `/dashboard`: verás tarjetas de resumen y la sección de métricas con tabs **Hoy | Semana | Mes | Año**.
3. En **Hoy**: total vendido hoy en COP, número de ventas y gráfica por hora.
4. Cambia a **Semana**: el total incluye toda la semana en curso y la gráfica muestra lun–dom. El cambio es instantáneo, sin recarga.
5. **Mes** muestra la tendencia por día; **Año** por mes.
6. En un período sin ventas, aparece el estado vacío en español (no gráfica rota ni errores).

## Escenario 2 — Venta dedicada (US2)

1. Desde el panel toca **Nueva venta** → se abre la pantalla de venta (POS), no el inventario.
2. Escribe parte del nombre de un producto en el buscador → aparece; agrégalo con cantidad 2.
3. Busca un segundo producto y agrégalo → el carrito muestra ambos ítems y el total acumulado en COP.
4. Intenta poner una cantidad mayor al stock → se bloquea/avisa en español.
5. Confirma → toast de éxito y vuelves a `/dashboard/ventas` con la venta listada (total e ítems); el stock bajó en inventario.
6. Repite desde el botón **Nueva venta** del listado de ventas y desde el menú lateral → mismo POS.
7. Desde `inventario/[id]` toca **Vender** → el POS abre con ese producto ya en el carrito (cantidad 1).
8. Abre el POS, agrega un ítem y toca **Cancelar** → sales sin venta registrada y el stock intacto.

## Escenario 3 — Navegación lateral (US3)

1. En pantalla ancha: el menú está a la izquierda con las 8 secciones; no hay menú horizontal en el header.
2. Navega entre secciones → la activa queda marcada; las 8 son alcanzables.
3. Colapsa la barra (trigger o preferencia) → queda en íconos y el contenido gana espacio; vuelve a expandir.
4. En pantalla angosta (DevTools móvil): no hay barra inferior; el botón del header abre el drawer con las 8 secciones; al elegir una se cierra.
5. En una ventana nueva la app recuerda si el sidebar estaba colapsado.

## Escenario 4 — Logo a inicio (US4)

1. Estando en Reportes (o cualquier sección), toca el nombre/logo **Master Inventory** en la barra lateral → llegas a `/dashboard`.
2. Con teclado: enfoca el logo (foco visible) y pulsa Enter → mismo resultado.

## Escenario 5 — Animaciones (US5)

1. Colapsa/expande el sidebar → transición suave, sin saltos.
2. Navega entre secciones → el estado activo cambia con transición limpia en hover/activo.
3. Repite en tema oscuro (ThemeSwitcher) → animaciones y estados correctos en ambos temas.

## Regresión rápida (FR-013 / SC-006)

- Pedidos: FAB **+** abre `pedidos/nuevo` y el flujo completo funciona.
- Inventario: crear/editar producto, fotos y favoritos sin cambios.
- Alertas, reportes (export `.txt`) y respaldo (export/import JSON) funcionan igual que antes.
