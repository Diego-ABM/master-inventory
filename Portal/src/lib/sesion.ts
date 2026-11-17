const PREFIJO = "sesion:";

export async function tokenSesion(): Promise<string | null> {
  const clave = process.env.CLAVE_ACCESO;
  if (!clave) return null;
  const datos = new TextEncoder().encode(PREFIJO + clave);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verificarTokenSesion(valor: string): Promise<boolean> {
  const esperado = await tokenSesion();
  if (!esperado || !valor || esperado.length !== valor.length) return false;
  let diferencia = 0;
  for (let i = 0; i < esperado.length; i++) {
    diferencia |= esperado.charCodeAt(i) ^ valor.charCodeAt(i);
  }
  return diferencia === 0;
}
