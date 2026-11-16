export const AUTH_CONFIG = {
  /**
   * Credenciales de acceso. Son de demostración: antes de llevar esto a
   * producción, muévelas a variables de entorno (p. ej. AUTH_USERNAME / AUTH_PASSWORD)
   * y valida contra un backend real.
   */
  demoCredentials: {
    username: "admin",
    password: "1234",
  },
  /** Cookie httpOnly que marca la sesión iniciada. */
  sessionCookieName: "auth_session",
} as const;
