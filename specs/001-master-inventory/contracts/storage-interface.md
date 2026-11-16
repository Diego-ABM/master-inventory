# Contrato — Interfaz de almacenamiento (repositorios)

Costura de desacoplamiento exigida por la constitución ("arquitectura desacoplada"): la única capa que emite SQL es `src/server/repositories/`. Servicios y UI consumen estas firmas; el motor (`node:sqlite` hoy) puede cambiarse sin tocar dominio ni UI.

**Convenciones**: todas las funciones son síncronas (`DatabaseSync`); los tipos de entrada/salida son los del dominio (`src/lib/domain/tipos.ts`), no filas crudas. Las operaciones multi-escritura las ejecutan los **servicios** dentro de una transacción explícita (`db.transaccion(fn)`); los repositorios ofrecen primitivas atómicas.

## `db` (`src/server/db/`)

```ts
abrirDb(): DatabaseSync                      // singleton; crea data/ + esquema si no existe
transaccion<T>(fn: () => T): T               // BEGIN IMMEDIATE / COMMIT / ROLLBACK
ejecutarInit(): void                         // esquema + limpieza logs>90d + chequeo de seed
```

## `productoRepo`

```ts
listar(filtro: { texto?: string; mascota?: Mascota; categoria?: Categoria }): Producto[]
obtener(id: number): ProductoConFotos | null
crear(data: NuevoProducto): number                       // retorna id; aplica defaults de spec
actualizar(id: number, data: DatosProducto): void        // pone fecha_actualizacion
ajustarStock(id: number, delta: number): void            // +/- manual (FR-002)
eliminar(id: number): void                               // CASCADE fotos; ítems pendientes los retira el servicio
marcarFavorito(id: number, es: boolean): void
marcarPedidoProveedor(id: number, pedir: boolean, nota?: string): void
listarPedidoProveedor(): Producto[]                      // pedir_al_proveedor = 1
listarVencimientos(): Producto[]                         // fecha_vencimiento NOT NULL, orden ASC
listarAgotados(): Producto[]                             // cantidad_stock <= 0
hayProductos(): boolean                                  // para el chequeo de seed
```

## `fotoRepo`

```ts
agregar(productoId: number, ruta: string, orden: number): number   // falla si ya hay 5
quitar(fotoId: number): void
contarPorProducto(productoId: number): number
```

## `ventaRepo`

```ts
crear(venta: { fecha: number; total: number }, item: NuevoVentaItem): number
listar(rango?: { desde: number; hasta: number }): VentaConItems[]
eliminar(id: number): VentaConItems | null               // retorna lo eliminado (servicio repone stock)
unidadesPorProducto(desde: number, hasta: number): { nombre: string; unidades: number }[]
```

## `pedidoRepo`

```ts
crear(pedido: NuevoPedido, items: NuevoPedidoItem[]): number
listar(filtro?: { entregado?: boolean; pagado?: boolean }): PedidoConItems[]
cambiarEntregado(id: number, entregado: boolean): void   // el descuento único lo orquesta el servicio
cambiarPagado(id: number, pagado: boolean): void
eliminar(id: number): void                               // servicio valida entregado=0 (CL12)
retirarItemsDeProducto(productoId: number): number[]     // pedidos pendientes afectados (CL7)
unidadesPagadasPorProducto(desde: number, hasta: number): { nombre: string; unidades: number }[]
```

## `logRepo`

```ts
registrar(nivel: NivelLog, modulo: string, mensaje: string, excepcion?: string): void
listar(limite?: number): LogEntry[]
limpiarAntiguos(antesDeEpoch: number): number            // n.º borrados (>90 días al iniciar)
limpiarTodo(): void
```

## `metaRepo`

```ts
leer(clave: string): string | null                       // 'semilla_cargada', 'version_esquema'
escribir(clave: string, valor: string): void
```

## `respaldoRepo` (soporte a FR-015)

```ts
exportarTodo(): DatosRespaldo                            // volcado de tablas de negocio (sin logs)
reemplazarTodo(datos: DatosRespaldo): void               // dentro de transacción del servicio
```

**Errores**: los repositorios propagan excepciones de SQLite; los servicios las convierten en mensajes en español para el usuario y registran `ERROR` en `logs` con la excepción.
