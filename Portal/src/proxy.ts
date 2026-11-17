import { type NextRequest, NextResponse } from "next/server";

import { verificarTokenSesion } from "@/lib/sesion";

export async function proxy(request: NextRequest) {
  const valida = await verificarTokenSesion(request.cookies.get("mi_sesion")?.value ?? "");
  const esAcceso = request.nextUrl.pathname === "/acceso";

  if (valida && esAcceso) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!valida && !esAcceso) {
    return NextResponse.redirect(new URL("/acceso", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|icon|apple-icon|favicon.ico).*)"],
};
