"use server";

import { cookies } from "next/headers";

import { AUTH_CONFIG } from "@/config/auth-config";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

export async function login(username: string, password: string, remember = false): Promise<{ ok: boolean }> {
  const isValid =
    username.trim() === AUTH_CONFIG.demoCredentials.username && password === AUTH_CONFIG.demoCredentials.password;

  if (!isValid) {
    return { ok: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.sessionCookieName, username.trim(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Sin "remember": cookie de sesión (se borra al cerrar el navegador).
    ...(remember ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
  });

  return { ok: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CONFIG.sessionCookieName);
}
