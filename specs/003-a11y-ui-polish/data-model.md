# Data Model: Pulido de accesibilidad y UI

## Entidades de dominio

**Ninguna.** La spec lo declara explícitamente ("Key Entities: Ninguna — no
introduce ni modifica datos"): no hay cambios en el esquema Postgres, en
repositorios, ni en la capa de dominio.

## Estado de UI relevante (no persistido)

Solo para referencia de implementación; nada de esto llega a la base de datos.

### Formulario de producto — flag de cambios

| Campo | Tipo | Fuente |
|-------|------|--------|
| `isDirty` | boolean derivado | `formState.isDirty` de `useForm` (ya existe) |

- Se usa para activar/desactivar el aviso nativo al cerrar/recargar (FR-011).
- `reset()` tras guardado exitoso lo devuelve a `false` → no advierte.

### Formulario de pedido nuevo — estado de borrador

| Campo | Tipo | Fuente |
|-------|------|--------|
| `cliente`, `contacto` | string | `useState` local |
| `items` | `ItemPedido[]` | `useState` local |

- "Con cambios" = `cliente !== "" || contacto !== "" || items.length > 0`.
- Tras `crearPedido` exitoso se limpia antes de navegar → no advierte (FR-011).

### Preferencia de tema — modo resuelto

| Campo | Tipo | Fuente |
|-------|------|--------|
| `theme_mode` | `"light" \| "dark" \| "system"` | `PreferencesStore` (cookie, ya existente) |
| `resolvedThemeMode` | `"light" \| "dark"` | derivado en provider + `theme-boot` |
| `theme_preset` | preset key | `PreferencesStore` (afecta el fondo → theme-color) |

- El theme-color declarado (FR-012) se deriva de `resolvedThemeMode` + preset:
  se lee `--background` computado, no se almacena nada nuevo.

## Reglas de validación / transiciones

- Flag de cambios `false → true`: al editar cualquier campo del formulario.
- Flag de cambios `true → false`: al guardar con éxito (`reset`/limpieza) — el
  aviso NO debe dispararse después (Edge Case).
- `theme_mode` cambia por ciclo del `ThemeSwitcher` o panel de preferencias → el
  meta theme-color se actualiza sin recargar (Edge Case).
