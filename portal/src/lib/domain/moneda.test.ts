import { formatearCOP, normalizarNumero } from "./moneda.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("formatearCOP", () => {
  it("formatea pesos enteros en es-CO sin decimales", () => {
    const resultado = formatearCOP(20000);
    assert.match(resultado, /\$/);
    assert.match(resultado, /20[.\s]?000/);
    assert.equal(resultado.includes(","), false);
  });

  it("formatea cero y valores grandes", () => {
    assert.match(formatearCOP(0), /\$/);
    assert.match(formatearCOP(1_500_000), /1[.\s]?500[.\s]?000/);
  });
});

describe("normalizarNumero", () => {
  it("convierte texto numérico a entero", () => {
    assert.equal(normalizarNumero("20000"), 20000);
    assert.equal(normalizarNumero("5"), 5);
  });

  it("normaliza entradas inválidas o vacías a 0 sin lanzar error", () => {
    assert.equal(normalizarNumero(""), 0);
    assert.equal(normalizarNumero("   "), 0);
    assert.equal(normalizarNumero("abc"), 0);
    assert.equal(normalizarNumero(null), 0);
    assert.equal(normalizarNumero(undefined), 0);
    assert.equal(normalizarNumero(Number.NaN), 0);
  });

  it("acepta números directamente y redondea decimales", () => {
    assert.equal(normalizarNumero(12345), 12345);
    assert.equal(normalizarNumero(10.7), 11);
    assert.equal(normalizarNumero(-4), -4);
  });

  it("rechaza negativos cuando se exige no negativo", () => {
    assert.equal(normalizarNumero(-4, { permitirNegativo: false }), 0);
    assert.equal(normalizarNumero("-100", { permitirNegativo: false }), 0);
  });
});
