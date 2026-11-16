import { calcularReporte, rangoPeriodo } from "./reportes.ts";
import type { PedidoConItems, Producto, VentaConItems } from "./tipos.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const producto = (extra: Partial<Producto>): Producto => ({
  id: 1,
  nombre: "P",
  descripcion: "",
  precio_venta: 0,
  precio_compra: 0,
  cantidad_stock: 0,
  stock_minimo: 0,
  mascota: "UNISEX",
  categoria: "ACCESORIOS",
  fecha_vencimiento: null,
  peso_kg: null,
  variante: null,
  nota_advertencia: null,
  es_favorito: 0,
  pedir_al_proveedor: 0,
  nota_pedido: null,
  fecha_actualizacion: 0,
  ...extra,
});

const venta = (total: number, items: VentaConItems["items"]): VentaConItems => ({
  id: 1,
  fecha: 0,
  total,
  items,
});

const ventaItem = (cantidad: number, compra: number, ventaPrecio: number, nombre = "P"): VentaConItems["items"][0] => ({
  id: 1,
  venta_id: 1,
  producto_id: 1,
  nombre_producto: nombre,
  cantidad,
  precio_compra: compra,
  precio_venta: ventaPrecio,
});

const pedido = (extra: Partial<PedidoConItems>): PedidoConItems => ({
  id: 1,
  nombre_cliente: "C",
  contacto: null,
  fecha_pedido: 0,
  entregado: 0,
  pagado: 0,
  stock_descontado: 0,
  total: 0,
  items: [],
  ...extra,
});

describe("rangoPeriodo", () => {
  it("devuelve el mes natural en epoch ms", () => {
    const { desde, hasta } = rangoPeriodo({ anual: false, anio: 2026, mes: 11 });
    assert.equal(new Date(desde).getMonth(), 10);
    assert.equal(new Date(hasta).getMonth(), 11);
    assert.equal(new Date(desde).getDate(), 1);
    assert.equal(new Date(hasta).getDate(), 1);
  });

  it("devuelve los 12 meses del año en modo anual", () => {
    const { desde, hasta } = rangoPeriodo({ anual: true, anio: 2026 });
    assert.equal(new Date(desde).getFullYear(), 2026);
    assert.equal(new Date(hasta).getFullYear(), 2027);
    assert.equal(new Date(desde).getMonth(), 0);
    assert.equal(new Date(hasta).getMonth(), 0);
  });
});

describe("calcularReporte", () => {
  it("calcula los cinco indicadores con datos mezclados", () => {
    const ventas = [
      venta(60000, [ventaItem(3, 14000, 20000)]), // neta ventas: 3×6000 = 18000
      venta(20000, [ventaItem(1, 5000, 20000, "Q")]), // neta: 15000
    ];
    const pedidos = [
      pedido({
        entregado: 1,
        pagado: 1,
        total: 100000,
        items: [
          {
            id: 1,
            pedido_id: 1,
            producto_id: 1,
            nombre_producto: "P",
            cantidad: 2,
            precio_compra: 14000,
            precio_unitario: 20000,
          },
          {
            id: 2,
            pedido_id: 1,
            producto_id: null,
            nombre_producto: "Libre",
            cantidad: 3,
            precio_compra: 0,
            precio_unitario: 20000,
          },
        ],
      }),
      // No cuenta: entregado pero pago pendiente.
      pedido({ entregado: 1, pagado: 0, total: 999000, items: [] }),
    ];
    const productos = [
      producto({ cantidad_stock: 10, precio_compra: 14000 }), // capital 140000
      producto({ cantidad_stock: 0, precio_compra: 9000 }),
    ];
    const marcados = [producto({ stock_minimo: 3, precio_compra: 14000 })]; // inversión 42000

    const r = calcularReporte(ventas, pedidos, productos, marcados);
    assert.equal(r.gananciaBruta, 180000);
    assert.equal(r.gananciaNeta, 18000 + 15000 + 2 * 6000 + 3 * 20000);
    assert.equal(r.capitalEnStock, 140000);
    assert.equal(r.inversionPendiente, 42000);
  });

  it("unifica la rotación de ventas y pedidos pagados, descendente", () => {
    const ventas = [venta(1, [ventaItem(2, 0, 1, "A"), ventaItem(5, 0, 1, "B")])];
    const pedidos = [
      pedido({
        entregado: 1,
        pagado: 1,
        items: [
          {
            id: 1,
            pedido_id: 1,
            producto_id: null,
            nombre_producto: "A",
            cantidad: 4,
            precio_compra: 0,
            precio_unitario: 1,
          },
        ],
      }),
    ];
    const r = calcularReporte(ventas, pedidos, [], []);
    assert.deepEqual(r.rotacion, [
      { nombre: "A", unidades: 6 },
      { nombre: "B", unidades: 5 },
    ]);
  });

  it("periodo vacío devuelve ceros y rotación vacía", () => {
    const r = calcularReporte([], [], [producto({ cantidad_stock: 5, precio_compra: 1000 })], []);
    assert.equal(r.gananciaBruta, 0);
    assert.equal(r.gananciaNeta, 0);
    assert.equal(r.capitalEnStock, 5000);
    assert.equal(r.inversionPendiente, 0);
    assert.deepEqual(r.rotacion, []);
  });
});
