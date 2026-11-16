# Contrato — Rutas y superficie de la aplicación

La app no expone una API pública; su superficie externa son las rutas de pantalla (App Router), los endpoints de archivos y las Server Actions. Todo el texto visible en español de Colombia.

## Secciones (barra inferior — FR-018)

| Ruta | Sección | Contenido |
|---|---|---|
| `/dashboard/inventario` | Inventario | Grid de tarjetas (foto, precio, chips mascota/categoría/peso, corazón, "Stock Bajo"), búsqueda por nombre + filtro mascota y categoría simultáneos, estados carga/vacío/error (FR-003) |
| `/dashboard/inventario/nuevo` | Inventario | Formulario de producto (solo nombre + precio obligatorios) |
| `/dashboard/inventario/[id]` | Inventario | Detalle: fotos, precios, datos, semáforo de vencimiento, marcado a proveedor, +/− stock, acceso a vender (FR-002) |
| `/dashboard/inventario/[id]/editar` | Inventario | Edición de producto |
| `/dashboard/favoritos` | Favoritos | Productos marcados + ranking de más vendidos debajo (FR-004) |
| `/dashboard/alertas` | Alertas | Vencimientos ordenados por cercanía con semáforo + Agotados (FR-012) |
| `/dashboard/pedidos` | Pedidos | Pedidos de clientes con badges de estado; pestaña/lista de marcados "para próximo pedido" con notas (FR-009, FR-011) |
| `/dashboard/pedidos/nuevo` | Pedidos | Crear pedido: cliente, contacto, ítems de catálogo o personalizados, total calculado |
| `/dashboard/ventas` | Ventas | Historial con fecha, ítem y total; eliminar con confirmación (FR-007, FR-008) |
| `/dashboard/ventas/nueva?producto=<id>` | Ventas | Registrar venta desde detalle de producto (FR-006) |
| `/dashboard/reportes` | Reportes* | Periodo mensual/anual navegable + exportar `.txt` (FR-013, FR-014) |
| `/dashboard/respaldo` | Respaldo* | Exportar/importar respaldo con confirmación + pantalla de logs (FR-015, FR-016) |

\* Reportes y Respaldo no están en la barra de 5: ambos se acceden desde el área de respaldo/seguridad (`/dashboard/respaldo` enlaza a `/dashboard/reportes`), manteniendo las 5 secciones del FR-018.

## Endpoints de archivos (route handlers)

| Endpoint | Método | Contrato |
|---|---|---|
| `/api/fotos/[name]` | GET | Sirve `data/fotos/<name>` con `Content-Type` por extensión; 404 si no existe; rechaza path traversal |
| `/api/respaldo` | GET | Descarga el JSON de respaldo (ver `backup-format.md`) |
| `/api/respaldo` | POST | Recibe archivo, valida con Zod; si es válido reemplaza todo y responde éxito (cliente recarga) |
| `/api/reportes/export` | GET | Descarga el `.txt` del periodo indicado por query (`?periodo=2026-11` o `?periodo=2026&anual=1`) |

## Server Actions (`src/server/services/`, `"use server"`)

Mutaciones invocadas desde la UI; cada una valida con Zod, ejecuta en transacción, registra en `logs` y llama `revalidatePath` de las secciones afectadas. Nombres orientativos:

```ts
crearProducto(data) · actualizarProducto(id, data) · eliminarProducto(id)
ajustarStock(id, delta) · marcarFavorito(id, es) · marcarPedidoProveedor(id, pedir, nota)
agregarFoto(productoId, file) · quitarFoto(fotoId)
registrarVenta(productoId, cantidad) · eliminarVenta(id)
crearPedido(data) · cambiarEntregado(id, v) · cambiarPagado(id, v) · eliminarPedido(id)
exportarRespaldo() · importarRespaldo(file) · limpiarLogs()
```

Las acciones devuelven `{ ok: true, data? }` o `{ ok: false, mensaje }` en español; nunca exponen trazas al usuario (van a `logs`).
