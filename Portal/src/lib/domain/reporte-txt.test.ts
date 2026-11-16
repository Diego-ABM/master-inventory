import { generarReporteTxt, nombreArchivoReporte } from "./reporte-txt.ts";
import type { ResultadoReporte } from "./reportes.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const REPORTE: ResultadoReporte = {
  gananciaBruta: 180000,
  gananciaNeta: 95000,
  capitalEnStock: 140000,
  inversionPendiente: 42000,
  rotacion: [
    { nombre: "Arena", unidades: 6 },
    { nombre: "Snack", unidades: 5 },
  ],
};

describe("generarReporteTxt", () => {
  it("genera la estructura del contrato para un periodo mensual", () => {
    const txt = generarReporteTxt({ anual: false, anio: 2026, mes: 11 }, REPORTE, Date.UTC(2026, 10, 16, 15, 30));
    const lineas = txt.split("\n");
    assert.equal(lineas[0], "========================================");
    assert.equal(lineas[1], "MASTER INVENTORY — REPORTE MENSUAL");
    assert.equal(lineas[2], "Periodo: Noviembre 2026");
    assert.match(lineas[3], /^Generado: 16\/11\/2026 /);
    assert.equal(lineas[4], "========================================");
    assert.equal(lineas[6], "RESUMEN FINANCIERO");
    assert.match(txt, /Ganancia bruta:\s+\$\s*180\.000/);
    assert.match(txt, /Ganancia neta:\s+\$\s*95\.000/);
    assert.match(txt, /Capital en stock:\s+\$\s*140\.000/);
    assert.match(txt, /Inversión pendiente:\s+\$\s*42\.000/);
    assert.match(txt, /TOP DE ROTACIÓN \(unidades vendidas\)/);
    assert.match(txt, / 1\. Arena — 6 uds\./);
    assert.match(txt, / 2\. Snack — 5 uds\./);
  });

  it("marca el reporte como ANUAL con el año como periodo", () => {
    const txt = generarReporteTxt({ anual: true, anio: 2026 }, REPORTE, Date.UTC(2026, 0, 2));
    assert.match(txt, /REPORTE ANUAL/);
    assert.match(txt, /Periodo: Año 2026/);
  });

  it("periodo sin registros muestra ceros y la línea de vacío", () => {
    const vacio: ResultadoReporte = {
      gananciaBruta: 0,
      gananciaNeta: 0,
      capitalEnStock: 0,
      inversionPendiente: 0,
      rotacion: [],
    };
    const txt = generarReporteTxt({ anual: false, anio: 2026, mes: 11 }, vacio, Date.UTC(2026, 10, 16));
    assert.match(txt, /No hay registros en este periodo\./);
    assert.doesNotMatch(txt, /TOP DE ROTACIÓN/);
    assert.match(txt, /Ganancia bruta:\s+\$\s*0/);
  });
});

describe("nombreArchivoReporte", () => {
  it("nombra reporte-<periodo>.txt", () => {
    assert.equal(nombreArchivoReporte({ anual: false, anio: 2026, mes: 11 }), "reporte-2026-11.txt");
    assert.equal(nombreArchivoReporte({ anual: true, anio: 2026 }), "reporte-2026.txt");
  });
});
