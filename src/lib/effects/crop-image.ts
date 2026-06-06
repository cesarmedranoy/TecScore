/**
 * Helpers para recortar imagen subida por el usuario.
 *
 * Resultado: data URL JPEG cuadrado, listo para usar como avatar.
 * El círculo lo aplica el CSS, no la imagen.
 *
 * Tamaño objetivo: 256×256 JPEG q=0.85 → ~25-40KB base64.
 * Eso entra cómodo en un item de DynamoDB (límite 400KB total).
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Recorta `src` según `pixelCrop` y devuelve un data URL JPEG.
 * Tamaño de salida fijo a `outputSize × outputSize` (default 256).
 */
export async function getCroppedDataUrl(
  src: string,
  pixelCrop: PixelCrop,
  outputSize = 256,
): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto del canvas");

  // Fondo blanco por si el crop sale fuera de los bounds
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Lee un File como data URL para feed a react-easy-crop. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
