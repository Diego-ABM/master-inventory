import { NextResponse } from "next/server";

import { DIRECTORIO_FOTOS } from "@/server/db";

import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const TIPOS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    return NextResponse.json({ error: "Nombre de archivo no válido." }, { status: 400 });
  }

  const ext = path.extname(name).toLowerCase();
  const contentType = TIPOS[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Tipo de archivo no permitido." }, { status: 400 });
  }

  const ruta = path.join(DIRECTORIO_FOTOS, name);
  if (!ruta.startsWith(DIRECTORIO_FOTOS + path.sep) || !existsSync(ruta)) {
    return NextResponse.json({ error: "Foto no encontrada." }, { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(ruta)) as ReadableStream;
  return new Response(stream, { headers: { "Content-Type": contentType } });
}
