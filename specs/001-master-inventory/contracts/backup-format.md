# Contrato — Formato del archivo de respaldo (FR-015)

Archivo único JSON, UTF-8, nombre sugerido `master-inventory-respaldo-AAAAMMDD.json`. Es el contrato de intercambio entre versiones de la app: exportar en una versión N e importar en N (o posterior compatible con `version` ≤ N).

## Esquema

```json
{
  "version": 1,
  "exportadoEn": 1763318400000,
  "tablas": {
    "productos": [
      {
        "id": 1, "nombre": "Cepillo vaporizador", "descripcion": "...",
        "precio_venta": 20000, "precio_compra": 14000,
        "cantidad_stock": 0, "stock_minimo": 3,
        "mascota": "PERRO", "categoria": "LIMPIEZA_ASEO",
        "fecha_vencimiento": null, "peso_kg": null, "variante": null,
        "nota_advertencia": null, "es_favorito": 0,
        "pedir_al_proveedor": 0, "nota_pedido": null,
        "fecha_actualizacion": 1763318400000
      }
    ],
    "fotos_producto": [
      { "id": 1, "producto_id": 1, "ruta_archivo": "/seed/images/Cepillo_vaporizador.png", "orden": 0 }
    ],
    "ventas": [ { "id": 1, "fecha": 1763318400000, "total": 60000 } ],
    "venta_items": [
      { "id": 1, "venta_id": 1, "producto_id": 1, "nombre_producto": "Cepillo vaporizador",
        "cantidad": 3, "precio_compra": 14000, "precio_venta": 20000 }
    ],
    "pedidos_clientes": [
      { "id": 1, "nombre_cliente": "Ana", "contacto": "3001234567",
        "fecha_pedido": 1763318400000, "entregado": 0, "pagado": 0,
        "stock_descontado": 0, "total": 105000 }
    ],
    "pedido_cliente_items": [
      { "id": 1, "pedido_id": 1, "producto_id": 1, "nombre_producto": "Cepillo vaporizador",
        "cantidad": 5, "precio_compra": 14000, "precio_unitario": 20000 }
    ],
    "meta": [ { "clave": "semilla_cargada", "valor": "1" } ]
  },
  "fotos": {
    "/seed/images/Cepillo_vaporizador.png": "<base64>",
    "/api/fotos/f3.png": "<base64>"
  }
}
```

## Reglas del contrato

- `version` entero ≥ 1. Importador: si `version` es mayor que la soportada → rechazar con mensaje.
- Todas las claves de `tablas` son obligatorias (pueden ser arreglos vacíos); `fotos` mapea `ruta_archivo` → contenido base64 y debe cubrir **todas** las rutas referenciadas en `fotos_producto`.
- `logs` **no** se exportan ni se restauran.
- Validación previa con Zod (estructura, tipos, referencias mínimas); si falla → error al usuario y **ningún dato actual se toca** (CL3).
- Tras confirmación explícita, la restauración **reemplaza todo** en una transacción: borra tablas de negocio, reinserta ids tal cual, reescribe `data/fotos/` con los decodificados (las rutas `/seed/images/*` no requieren escritura: ya están en el repo). Luego la app se "reinicia" a inventario (recarga de cliente).
- Importes en pesos enteros; fechas en epoch ms; booleanos `0/1` — igual que el modelo.
