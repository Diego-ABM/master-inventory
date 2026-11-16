import { calcularTotalPedido, cuentaEnReportes, debeDescontarStock, puedeEliminarse } from "./pedidos.ts";
import type { PedidoCliente } from "./tipos.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const pedidoBase: PedidoCliente = {
  id: 1,
  nombre_cliente: "Ana",
  contacto: null,
  fecha_pedido: 0,
  entregado: 0,
  pagado: 0,
  stock_descontado: 0,
  total: 0,
};

describe("calcularTotalPedido", () => {
  it("suma cantidad × precio_unitario con precios congelados", () => {
    const items = [
      { producto_id: 1, nombre_producto: "A", cantidad: 5, precio_compra: 7000, precio_unitario: 20000 },
      { producto_id: null, nombre_producto: "Personalizado", cantidad: 2, precio_compra: 0, precio_unitario: 5000 },
    ];
    assert.equal(calcularTotalPedido(items), 110000);
  });

  it("lanza error con cantidad inválida", () => {
    assert.throws(() =>
      calcularTotalPedido([
        { producto_id: 1, nombre_producto: "A", cantidad: 0, precio_compra: 0, precio_unitario: 1 },
      ]),
    );
  });
});

describe("debeDescontarStock", () => {
  it("solo cuando se marca entregado y aún no se descontó", () => {
    assert.equal(debeDescontarStock({ ...pedidoBase, entregado: 1, stock_descontado: 0 }), true);
    assert.equal(debeDescontarStock({ ...pedidoBase, entregado: 1, stock_descontado: 1 }), false);
    assert.equal(debeDescontarStock({ ...pedidoBase, entregado: 0, stock_descontado: 0 }), false);
  });
});

describe("cuentaEnReportes", () => {
  it("solo cuenta pedidos entregados y pagados", () => {
    assert.equal(cuentaEnReportes({ ...pedidoBase, entregado: 1, pagado: 1 }), true);
    assert.equal(cuentaEnReportes({ ...pedidoBase, entregado: 1, pagado: 0 }), false);
    assert.equal(cuentaEnReportes({ ...pedidoBase, entregado: 0, pagado: 1 }), false);
  });
});

describe("puedeEliminarse", () => {
  it("solo pedidos pendientes se pueden eliminar", () => {
    assert.equal(puedeEliminarse({ ...pedidoBase, entregado: 0 }), true);
    assert.equal(puedeEliminarse({ ...pedidoBase, entregado: 1 }), false);
  });
});
