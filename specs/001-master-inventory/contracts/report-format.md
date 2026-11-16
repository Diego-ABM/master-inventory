# Contrato — Formato del reporte exportable (FR-014)

Archivo de texto plano `.txt` UTF-8 generado por la capa de dominio (`src/lib/domain/reporte-txt.ts`) y descargado desde la pantalla de reportes. Nombre sugerido: `reporte-<periodo>.txt` (ej. `reporte-2026-11.txt`, `reporte-2026.txt`).

## Estructura

```text
========================================
MASTER INVENTORY — REPORTE <MENSUAL|ANUAL>
Periodo: <Noviembre 2026 | Año 2026>
Generado: <dd/mm/aaaa hh:mm>
========================================

RESUMEN FINANCIERO
------------------
Ganancia bruta:      $ <valor COP>
Ganancia neta:       $ <valor COP>
Capital en stock:    $ <valor COP>
Inversión pendiente: $ <valor COP>

TOP DE ROTACIÓN (unidades vendidas)
-----------------------------------
 1. <nombre producto> — <N> uds.
 2. ...
```

- Periodo **sin movimientos**: indicadores en `$ 0` y línea `No hay registros en este periodo.` en lugar del ranking (CL5).
- Moneda: mismo formato `es-CO`/COP de la app (`$ 20.000`).
- Reglas de cálculo (ver data-model.md): bruta = Σ totales de ventas + pedidos entregados y pagados del periodo; neta = Σ cantidad × (precio_venta − precio_compra) congelados; capital en stock = Σ stock × precio_compra actual; inversión pendiente = Σ stock_minimo × precio_compra de los marcados a proveedor; rotación = unidades vendidas unificando ambos orígenes, orden descendente.
