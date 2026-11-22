import { esStockBajo, estaAgotado, validarCantidad } from "./stock.ts";
import type { Producto } from "./tipos.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const productoBase: Producto = {
  id: 1,
  nombre: "Prueba",
  descripcion: "",
  precio_venta: 1000,
  precio_compra: 700,
  cantidad_stock: 10,
  stock_minimo: 3,
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
};

describe("validarCantidad", () => {
  it("acepta cantidades enteras entre 1 y el stock disponible", () => {
    assert.equal(validarCantidad(1, 10), true);
    assert.equal(validarCantidad(10, 10), true);
    assert.equal(validarCantidad(5, 10), true);
  });

  it("rechaza 0, negativos y cantidades mayores al stock", () => {
    assert.equal(validarCantidad(0, 10), false);
    assert.equal(validarCantidad(-3, 10), false);
    assert.equal(validarCantidad(11, 10), false);
    assert.equal(validarCantidad(1, 0), false);
  });

  it("rechaza valores no enteros o no numéricos", () => {
    assert.equal(validarCantidad(1.5, 10), false);
    assert.equal(validarCantidad(Number.NaN, 10), false);
  });
});

describe("esStockBajo", () => {
  it("es verdadero cuando cantidad_stock <= stock_minimo", () => {
    assert.equal(esStockBajo({ ...productoBase, cantidad_stock: 3, stock_minimo: 3 }), true);
    assert.equal(esStockBajo({ ...productoBase, cantidad_stock: 2, stock_minimo: 3 }), true);
    assert.equal(esStockBajo({ ...productoBase, cantidad_stock: 0, stock_minimo: 3 }), true);
  });

  it("es falso cuando el stock supera el mínimo", () => {
    assert.equal(esStockBajo({ ...productoBase, cantidad_stock: 4, stock_minimo: 3 }), false);
  });
});

describe("estaAgotado", () => {
  it("es verdadero cuando cantidad_stock <= 0", () => {
    assert.equal(estaAgotado({ ...productoBase, cantidad_stock: 0 }), true);
    assert.equal(estaAgotado({ ...productoBase, cantidad_stock: 1 }), false);
  });
});
