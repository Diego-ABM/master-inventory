import { diasRestantes, semaforo } from "./vencimiento.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const DIA_MS = 24 * 60 * 60 * 1000;
const REFERENCIA = Date.UTC(2026, 10, 16); // 16-nov-2026

describe("diasRestantes", () => {
  it("calcula los días que faltan contra la fecha de referencia", () => {
    assert.equal(diasRestantes(REFERENCIA + 30 * DIA_MS, REFERENCIA), 30);
    assert.equal(diasRestantes(REFERENCIA + 45 * DIA_MS, REFERENCIA), 45);
  });

  it("devuelve negativos para fechas pasadas", () => {
    assert.equal(diasRestantes(REFERENCIA - 5 * DIA_MS, REFERENCIA), -5);
  });

  it("devuelve 0 cuando vence el mismo día", () => {
    assert.equal(diasRestantes(REFERENCIA, REFERENCIA), 0);
  });
});

describe("semaforo", () => {
  it("rojo para 30 días o menos, incluidas fechas pasadas", () => {
    assert.equal(semaforo(30), "rojo");
    assert.equal(semaforo(0), "rojo");
    assert.equal(semaforo(-12), "rojo");
  });

  it("naranja entre 31 y 60 días", () => {
    assert.equal(semaforo(31), "naranja");
    assert.equal(semaforo(60), "naranja");
  });

  it("verde para más de 60 días", () => {
    assert.equal(semaforo(61), "verde");
    assert.equal(semaforo(365), "verde");
  });

  it("null cuando no hay fecha de vencimiento", () => {
    assert.equal(semaforo(null), null);
  });
});
