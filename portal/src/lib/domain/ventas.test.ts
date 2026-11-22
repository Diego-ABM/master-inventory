import { calcularTotalVenta, calcularTotalVentaMulti } from "./ventas.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("calcularTotalVenta", () => {
  it("calcula cantidad × precio_venta con los datos congelados del ítem", () => {
    const item = { producto_id: 1, nombre_producto: "Arena", cantidad: 3, precio_compra: 7000, precio_venta: 20000 };
    assert.equal(calcularTotalVenta(item), 60000);
  });

  it("usa el precio congelado aunque el precio actual del producto cambie", () => {
    // El ítem guarda el precio del momento de la venta; el cálculo nunca consulta el producto.
    const item = { producto_id: 1, nombre_producto: "Arena", cantidad: 2, precio_compra: 7000, precio_venta: 15000 };
    assert.equal(calcularTotalVenta(item), 30000);
  });

  it("lanza error con cantidad inválida", () => {
    const base = { producto_id: 1, nombre_producto: "X", precio_compra: 0, precio_venta: 100 };
    assert.throws(() => calcularTotalVenta({ ...base, cantidad: 0 }));
    assert.throws(() => calcularTotalVenta({ ...base, cantidad: -2 }));
    assert.throws(() => calcularTotalVenta({ ...base, cantidad: 1.5 }));
  });
});

describe("calcularTotalVentaMulti", () => {
  const item = (cantidad: number, precio_venta: number) => ({
    producto_id: 1,
    nombre_producto: "X",
    cantidad,
    precio_compra: 0,
    precio_venta,
  });

  it("suma cantidad × precio_venta de todos los ítems", () => {
    assert.equal(calcularTotalVentaMulti([item(2, 15000), item(3, 8000), item(1, 5000)]), 59000);
  });

  it("funciona con un solo ítem", () => {
    assert.equal(calcularTotalVentaMulti([item(4, 2500)]), 10000);
  });

  it("lanza error si algún ítem tiene cantidad inválida", () => {
    assert.throws(() => calcularTotalVentaMulti([item(1, 100), item(0, 200)]));
    assert.throws(() => calcularTotalVentaMulti([item(-1, 100)]));
    assert.throws(() => calcularTotalVentaMulti([item(2.5, 100)]));
  });

  it("lanza error con la lista vacía", () => {
    assert.throws(() => calcularTotalVentaMulti([]));
  });
});
