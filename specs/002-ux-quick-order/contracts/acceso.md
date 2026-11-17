# Contrato: Acceso (login con clave única)

## Configuración

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `CLAVE_ACCESO` | env var (servidor) | Clave única del negocio. Requerida; si falta, toda entrada se rechaza con "El acceso no está configurado." Se documenta en `.env.example`. |

## Gate de rutas — `src/proxy.ts`

- Corre en todas las rutas excepto: `/acceso`, `/_next/*`, `/icon`, `/apple-icon`, `favicon.ico`.
- Sin cookie `mi_sesion` válida:
  - Navegación a página → redirect `302` a `/acceso`.
  - POST de Server Action o `/api/*` → se niega el acceso (redirect a `/acceso`; la UI lleva al login).
- Con cookie válida y request a `/acceso` → redirect a `/dashboard`.

## Server Actions — `src/server/services/acceso.ts`

### `entrar(clave: string): Promise<Resultado>`

| Caso | Resultado |
|------|-----------|
| `CLAVE_ACCESO` no definida | `{ ok: false, mensaje: "El acceso no está configurado. Define la clave del negocio en el servidor." }` |
| `clave` no coincide | `{ ok: false, mensaje: "La clave no es correcta." }` (genérico, sin revelar datos) + log WARN |
| `clave` coincide | setea cookie `mi_sesion` y `redirect("/dashboard")` + log INFO |

### `salir(): Promise<void>`

Borra la cookie (`max-age=0`) y `redirect("/acceso")`.

## Cookie `mi_sesion`

`httpOnly`, `sameSite=lax`, `secure` en producción, `path=/`, `max-age=2592000`
(30 días). Valor: hex de `sha256("sesion:" + CLAVE_ACCESO)` (Web Crypto,
`crypto.subtle`, compartido por `src/lib/sesion.ts`).

## Pantalla `/acceso`

- Fuera del grupo `(main)`: sin header, sin bottom-nav, sin FAB.
- Un campo de clave (`type="password"`), botón "Entrar", mensaje de error del
  resultado de `entrar`.
- Todo el texto en español de Colombia.
