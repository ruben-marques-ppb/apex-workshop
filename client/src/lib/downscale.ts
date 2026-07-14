const MAX_EDGE = 1280;

/** Downscale an image file to <= MAX_EDGE on the longest side, JPEG quality 0.85. */
export async function downscaleImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/jpeg',
      0.85,
    );
  });
}
