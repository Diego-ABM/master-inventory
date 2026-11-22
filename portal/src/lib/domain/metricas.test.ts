import { agregarVentas, rangoPeriodo } from "./metricas.ts";
import type { VentaConItems } from "./tipos.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

function ventaEn(fecha: Date, total: number): VentaConItems {
  return { id: 1, fecha: fecha.getTime(), total, items: [] };
}

describe("rangoPeriodo", () => {
  it("hoy cubre de 00:00 a 24:00 en hora local", () => {
    const ref = new Date(2026, 10, 18, 15, 42);
    const { desde, hasta } = rangoPeriodo("hoy", ref);
    assert.equal(desde, new Date(2026, 10, 18, 0, 0, 0, 0).getTime());
    assert.equal(hasta, new Date(2026, 10, 19, 0, 0, 0, 0).getTime());
  });

  it("semana inicia en lunes y termina el domingo", () => {
    // Miércoles 18 nov 2026 → lunes 16 nov → domingo 22 nov.
    const ref = new Date(2026, 10, 18, 9, 0);
    const { desde, hasta } = rangoPeriodo("semana", ref);
    assert.equal(desde, new Date(2026, 10, 16, 0, 0, 0, 0).getTime());
    assert.equal(hasta, new Date(2026, 10, 23, 0, 0, 0, 0).getTime());
  });

  it("semana: el domingo pertenece a la semana que inició el lunes anterior", () => {
    const ref = new Date(2026, 10, 22, 20, 0); // domingo
    const { desde } = rangoPeriodo("semana", ref);
    assert.equal(desde, new Date(2026, 10, 16, 0, 0, 0, 0).getTime());
  });

  it("semana puede iniciar en el mes/año anterior", () => {
    // Viernes 1 ene 2027 → su semana inicia el lunes 28 dic 2026.
    const ref = new Date(2027, 0, 1, 10, 0);
    const { desde, hasta } = rangoPeriodo("semana", ref);
    assert.equal(desde, new Date(2026, 11, 28, 0, 0, 0, 0).getTime());
    assert.equal(hasta, new Date(2027, 0, 4, 0, 0, 0, 0).getTime());
  });

  it("mes cubre del día 1 al primer día del mes siguiente", () => {
    const ref = new Date(2026, 10, 18, 12, 0);
    const { desde, hasta } = rangoPeriodo("mes", ref);
    assert.equal(desde, new Date(2026, 10, 1, 0, 0, 0, 0).getTime());
    assert.equal(hasta, new Date(2026, 11, 1, 0, 0, 0, 0).getTime());
  });

  it("mes respeta meses cortos (febrero)", () => {
    const ref = new Date(2026, 1, 15, 12, 0);
    const { desde, hasta } = rangoPeriodo("mes", ref);
    assert.equal(desde, new Date(2026, 1, 1, 0, 0, 0, 0).getTime());
    assert.equal(hasta, new Date(2026, 2, 1, 0, 0, 0, 0).getTime());
  });

  it("año cubre del 1 de enero al 1 de enero siguiente", () => {
    const ref = new Date(2026, 10, 18, 12, 0);
    const { desde, hasta } = rangoPeriodo("anio", ref);
    assert.equal(desde, new Date(2026, 0, 1, 0, 0, 0, 0).getTime());
    assert.equal(hasta, new Date(2027, 0, 1, 0, 0, 0, 0).getTime());
  });
});

describe("agregarVentas", () => {
  const ref = new Date(2026, 10, 18, 15, 0); // miércoles 18 nov 2026

  it("hoy agrega por hora (24 buckets) e ignora otros días", () => {
    const ventas = [
      ventaEn(new Date(2026, 10, 18, 8, 15), 10000),
      ventaEn(new Date(2026, 10, 18, 8, 50), 5000),
      ventaEn(new Date(2026, 10, 18, 20, 5), 30000),
      ventaEn(new Date(2026, 10, 17, 8, 15), 99999), // ayer: fuera
      ventaEn(new Date(2026, 10, 19, 0, 0), 88888), // mañana 00:00: fuera
    ];
    const m = agregarVentas(ventas, "hoy", ref);
    assert.equal(m.serie.length, 24);
    assert.equal(m.serie[8].total, 15000);
    assert.equal(m.serie[20].total, 30000);
    assert.equal(m.serie[0].total, 0);
    assert.equal(m.totalVendido, 45000);
    assert.equal(m.numeroVentas, 3);
  });

  it("semana agrega por día lun–dom (7 buckets)", () => {
    const ventas = [
      ventaEn(new Date(2026, 10, 16, 10, 0), 7000), // lunes
      ventaEn(new Date(2026, 10, 18, 10, 0), 8000), // miércoles (ref)
      ventaEn(new Date(2026, 10, 22, 23, 59), 9000), // domingo
      ventaEn(new Date(2026, 10, 15, 23, 59), 9999), // domingo anterior: fuera
    ];
    const m = agregarVentas(ventas, "semana", ref);
    assert.equal(m.serie.length, 7);
    assert.equal(m.serie[0].total, 7000);
    assert.equal(m.serie[2].total, 8000);
    assert.equal(m.serie[6].total, 9000);
    assert.equal(m.numeroVentas, 3);
    assert.equal(m.totalVendido, 24000);
    assert.equal(m.serie[0].etiqueta, "lun 16");
    assert.equal(m.serie[6].etiqueta, "dom 22");
  });

  it("mes agrega por día del mes", () => {
    const ventas = [
      ventaEn(new Date(2026, 10, 3, 10, 0), 12000),
      ventaEn(new Date(2026, 10, 30, 23, 30), 2000),
      ventaEn(new Date(2026, 9, 31, 23, 59), 5555), // octubre: fuera
    ];
    const m = agregarVentas(ventas, "mes", ref);
    assert.equal(m.serie.length, 30); // noviembre
    assert.equal(m.serie[2].etiqueta, "3");
    assert.equal(m.serie[2].total, 12000);
    assert.equal(m.serie[29].total, 2000);
    assert.equal(m.numeroVentas, 2);
    assert.equal(m.totalVendido, 14000);
  });

  it("año agrega por mes (12 buckets)", () => {
    const ventas = [
      ventaEn(new Date(2026, 0, 15, 10, 0), 4000),
      ventaEn(new Date(2026, 10, 18, 10, 0), 6000),
      ventaEn(new Date(2025, 11, 31, 23, 59), 7777), // año anterior: fuera
    ];
    const m = agregarVentas(ventas, "anio", ref);
    assert.equal(m.serie.length, 12);
    assert.equal(m.serie[0].etiqueta, "ene");
    assert.equal(m.serie[0].total, 4000);
    assert.equal(m.serie[10].total, 6000);
    assert.equal(m.numeroVentas, 2);
    assert.equal(m.totalVendido, 10000);
  });

  it("período sin ventas produce buckets en cero", () => {
    for (const periodo of ["hoy", "semana", "mes", "anio"] as const) {
      const m = agregarVentas([], periodo, ref);
      assert.equal(m.totalVendido, 0);
      assert.equal(m.numeroVentas, 0);
      assert.ok(m.serie.every((p) => p.total === 0));
    }
  });

  it("devuelve id y etiqueta del período en español", () => {
    assert.equal(agregarVentas([], "hoy", ref).etiqueta, "Hoy");
    assert.equal(agregarVentas([], "semana", ref).etiqueta, "Semana");
    assert.equal(agregarVentas([], "mes", ref).etiqueta, "Mes");
    assert.equal(agregarVentas([], "anio", ref).etiqueta, "Año");
    assert.equal(agregarVentas([], "anio", ref).id, "anio");
  });
});
