import { NextResponse } from "next/server";

import { fotoRepo } from "@/server/repositories/fotos";

import path from "node:path";

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

  const foto = await fotoRepo.obtenerDatosPorRuta(`/api/fotos/${name}`);
  if (!foto) {
    return NextResponse.json({ error: "Foto no encontrada." }, { status: 404 });
  }

  const contentType = foto.mime ?? TIPOS[path.extname(name).toLowerCase()] ?? "application/octet-stream";
  return new Response(new Uint8Array(foto.datos), {
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
