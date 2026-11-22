import { esquemaRespaldo, validarRespaldo } from "./respaldo.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const respaldoValido = {
  version: 1,
  exportadoEn: 1763318400000,
  tablas: {
    productos: [
      {
        id: 1,
        nombre: "Arena",
        descripcion: "",
        precio_venta: 20000,
        precio_compra: 14000,
        cantidad_stock: 0,
        stock_minimo: 3,
        mascota: "GATO",
        categoria: "LIMPIEZA_ASEO",
        fecha_vencimiento: null,
        peso_kg: null,
        variante: null,
        nota_advertencia: null,
        es_favorito: 0,
        pedir_al_proveedor: 0,
        nota_pedido: null,
        fecha_actualizacion: 1763318400000,
      },
    ],
    fotos_producto: [{ id: 1, producto_id: 1, ruta_archivo: "/api/fotos/7.png", orden: 0 }],
    ventas: [],
    venta_items: [],
    pedidos_clientes: [],
    pedido_cliente_items: [],
    meta: [{ clave: "semilla_cargada", valor: "1" }],
  },
  fotos: { "/api/fotos/7.png": "aGVsbG8=" },
};

describe("validarRespaldo", () => {
  it("acepta un respaldo bien formado", () => {
    const resultado = validarRespaldo(respaldoValido);
    assert.equal(resultado.ok, true);
  });

  it("rechaza versiones no enteras o menores que 1", () => {
    assert.equal(validarRespaldo({ ...respaldoValido, version: 0 }).ok, false);
    assert.equal(validarRespaldo({ ...respaldoValido, version: "1" }).ok, false);
  });

  it("exige todas las claves de tablas", () => {
    const incompleto = { ...respaldoValido, tablas: { ...respaldoValido.tablas } };
    delete (incompleto.tablas as Record<string, unknown>).ventas;
    assert.equal(validarRespaldo(incompleto).ok, false);
  });

  it("exige que fotos cubra todas las rutas referenciadas", () => {
    const sinFoto = { ...respaldoValido, fotos: {} };
    assert.equal(validarRespaldo(sinFoto).ok, false);
  });

  it("acepta rutas de fotos no referenciadas en la tabla", () => {
    const extra = { ...respaldoValido, fotos: { ...respaldoValido.fotos, "/seed/images/x.png": "eA==" } };
    assert.equal(validarRespaldo(extra).ok, true);
  });

  it("rechaza estructuras totalmente ajenas", () => {
    assert.equal(validarRespaldo(null).ok, false);
    assert.equal(validarRespaldo({}).ok, false);
    assert.equal(validarRespaldo("texto").ok, false);
    assert.equal(validarRespaldo({ ...respaldoValido, tablas: { ...respaldoValido.tablas, logs: [] } }).ok, true);
  });
});

describe("esquemaRespaldo", () => {
  it("define los tipos exportables", () => {
    const parsed = esquemaRespaldo.safeParse(respaldoValido);
    assert.equal(parsed.success, true);
  });
});
