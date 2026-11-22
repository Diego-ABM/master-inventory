import { NextResponse } from "next/server";

import { exportarRespaldo, importarRespaldo } from "@/server/services/respaldo";

export async function GET() {
  try {
    const { json, nombre } = await exportarRespaldo();
    return new Response(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombre}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo generar el respaldo." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const archivo = formData.get("archivo");
    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }
    const contenido = await archivo.text();
    const resultado = await importarRespaldo(contenido);
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.mensaje }, { status: 400 });
    }
    return NextResponse.json({ ok: true, mensaje: "Respaldo restaurado con éxito." });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar el archivo." }, { status: 500 });
  }
}
