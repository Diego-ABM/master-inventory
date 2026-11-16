import { calcularTotalVenta } from "./ventas.ts";
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
