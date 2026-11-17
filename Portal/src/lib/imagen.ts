const TIPOS_ADMITIDOS = new Set(["image/png", "image/jpeg", "image/webp"]);
const LADO_MAXIMO = 1600;
const CALIDAD_WEBP = 0.8;

export async function comprimirFoto(archivo: File): Promise<File> {
  if (!TIPOS_ADMITIDOS.has(archivo.type)) {
    throw new Error("Formato de imagen no admitido. Usa JPG, PNG o WebP.");
  }

  try {
    const bitmap = await createImageBitmap(archivo);
    try {
      const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
      const ancho = Math.max(1, Math.round(bitmap.width * escala));
      const alto = Math.max(1, Math.round(bitmap.height * escala));

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D no disponible");
      ctx.drawImage(bitmap, 0, 0, ancho, alto);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", CALIDAD_WEBP));
      if (!blob) throw new Error("No se pudo exportar la imagen");

      const base = archivo.name.replace(/\.[^.]+$/, "") || "foto";
      return new File([blob], `${base}.webp`, { type: "image/webp" });
    } finally {
      bitmap.close();
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Formato")) throw error;
    throw new Error("No se pudo leer la imagen; el archivo parece estar dañado.");
  }
}
