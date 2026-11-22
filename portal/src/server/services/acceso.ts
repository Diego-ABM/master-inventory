"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { tokenSesion } from "@/lib/sesion";
import { logRepo } from "@/server/repositories/logs";

const MODULO = "acceso";
const COOKIE_SESION = "mi_sesion";
const TREINTA_DIAS = 30 * 24 * 60 * 60;

type Resultado = { ok: true } | { ok: false; mensaje: string };

export async function entrar(clave: string): Promise<Resultado> {
  const claveEsperada = process.env.CLAVE_ACCESO;
  if (!claveEsperada) {
    return { ok: false, mensaje: "El acceso no está configurado. Define la clave del negocio en el servidor." };
  }
  if (clave !== claveEsperada) {
    logRepo.registrarSeguro("WARN", MODULO, "Intento de acceso con clave incorrecta.");
    return { ok: false, mensaje: "La clave no es correcta." };
  }

  const token = await tokenSesion();
  if (!token) return { ok: false, mensaje: "La clave no es correcta." };
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TREINTA_DIAS,
  });
  logRepo.registrarSeguro("INFO", MODULO, "Acceso concedido.");
  redirect("/dashboard");
}

export async function salir(): Promise<void> {
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, "", { path: "/", maxAge: 0 });
  logRepo.registrarSeguro("INFO", MODULO, "Sesión cerrada.");
  redirect("/acceso");
}
