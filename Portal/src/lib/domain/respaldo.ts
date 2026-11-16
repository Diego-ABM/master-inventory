import { z } from "zod";

export const VERSION_RESPALDO = 1;

const CLAVES_TABLAS = [
  "productos",
  "fotos_producto",
  "ventas",
  "venta_items",
  "pedidos_clientes",
  "pedido_cliente_items",
  "meta",
] as const;

const fila = z.record(z.string(), z.unknown());

export const esquemaRespaldo = z
  .object({
    version: z.number().int().min(1),
    exportadoEn: z.number(),
    tablas: z.object({
      productos: z.array(fila),
      fotos_producto: z.array(fila),
      ventas: z.array(fila),
      venta_items: z.array(fila),
      pedidos_clientes: z.array(fila),
      pedido_cliente_items: z.array(fila),
      meta: z.array(fila),
    }),
    fotos: z.record(z.string(), z.string()),
  })
  .superRefine((datos, ctx) => {
    const rutas = new Set(
      datos.tablas.fotos_producto.map((f) => f.ruta_archivo).filter((r): r is string => typeof r === "string"),
    );
    for (const ruta of rutas) {
      if (!(ruta in datos.fotos)) {
        ctx.addIssue({ code: "custom", message: `Falta el contenido de la foto ${ruta}.` });
      }
    }
  });

export type DatosRespaldo = z.infer<typeof esquemaRespaldo>;
export type ClaveTabla = (typeof CLAVES_TABLAS)[number];
export { CLAVES_TABLAS };

export function validarRespaldo(json: unknown): { ok: true; datos: DatosRespaldo } | { ok: false; mensaje: string } {
  const resultado = esquemaRespaldo.safeParse(json);
  if (!resultado.success) {
    const detalle = resultado.error.issues[0];
    const ruta = detalle?.path.join(".") ?? "";
    return {
      ok: false,
      mensaje: `El archivo no es un respaldo válido${ruta ? ` (${ruta}: ${detalle.message})` : ""}.`,
    };
  }
  return { ok: true, datos: resultado.data };
}
