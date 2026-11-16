// Proxy (antes "middleware"): se ejecuta antes de completar cada petición.
// Protege el dashboard exigiendo sesión y evita volver al login estando autenticado.
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_CONFIG } from "@/config/auth-config";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(AUTH_CONFIG.sessionCookieName)?.value);

  // Sin sesión: cualquier ruta del dashboard redirige al login.
  if (!hasSession && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/v1/login", req.url));
  }

  // Con sesión: no tiene sentido mostrar el login de nuevo.
  if (hasSession && pathname === "/auth/v1/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
