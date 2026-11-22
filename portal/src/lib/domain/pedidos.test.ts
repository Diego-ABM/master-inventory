import {
  calcularTotalPedido,
  cuentaEnReportes,
  debeDescontarStock,
  etiquetaItemProducto,
  puedeEliminarse,
} from "./pedidos.ts";
import type { PedidoCliente, Producto } from "./tipos.ts";
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

const productoBase: Producto = {
  id: 7,
  nombre: "Comida gato",
  descripcion: "",
  precio_venta: 20000,
  precio_compra: 12000,
  cantidad_stock: 10,
  stock_minimo: 3,
  mascota: "GATO",
  categoria: "SNACKS",
  fecha_vencimiento: null,
  peso_kg: null,
  variante: null,
  nota_advertencia: null,
  es_favorito: 0,
  pedir_al_proveedor: 0,
  nota_pedido: null,
  fecha_actualizacion: 0,
};

describe("etiquetaItemProducto", () => {
  it("usa nombre y variante cuando hay variante", () => {
    assert.equal(etiquetaItemProducto({ ...productoBase, variante: "Pollo 500g" }), "Comida gato — Pollo 500g");
  });

  it("usa el peso cuando no hay variante", () => {
    assert.equal(etiquetaItemProducto({ ...productoBase, peso_kg: 2, mascota: "UNISEX" }), "Comida gato — 2 kg");
  });

  it("usa la mascota cuando no hay variante ni peso y no es UNISEX", () => {
    assert.equal(etiquetaItemProducto(productoBase), "Comida gato — Gato");
  });

  it("usa solo el nombre cuando no hay desambiguador", () => {
    assert.equal(etiquetaItemProducto({ ...productoBase, mascota: "UNISEX" }), "Comida gato");
  });

  it("cae en texto de respaldo cuando el nombre está vacío", () => {
    assert.equal(etiquetaItemProducto({ ...productoBase, nombre: "" }), "Producto sin nombre");
    assert.equal(etiquetaItemProducto({ ...productoBase, nombre: "   " }), "Producto sin nombre");
  });

  it("nunca incluye el id ni códigos internos", () => {
    const etiqueta = etiquetaItemProducto({ ...productoBase, id: 42 });
    assert.equal(etiqueta.includes("42"), false);
  });
});
