// Client-only: downscale + JPEG-compress an image File to a small data URL so
// bill photo evidence stays lightweight (~100-250KB) in the DB and under the
// server-action body limit. Robust to large photos, EXIF rotation and (where
// the browser can decode it) HEIC — throws a clear error otherwise.

async function loadImage(file: File): Promise<{ draw: CanvasImageSource; w: number; h: number; done: () => void }> {
  // createImageBitmap is the most reliable path: decodes large files without a
  // huge data-URL round-trip and honours EXIF orientation (fixes sideways
  // iPhone photos). It also decodes HEIC on browsers that support it (Safari).
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as any);
      return { draw: bmp, w: bmp.width, h: bmp.height, done: () => bmp.close?.() };
    } catch { /* fall through to <img> */ }
  }
  const dataUrl: string = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("อ่านไฟล์ไม่ได้"));
    fr.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("รูปนี้เปิดไม่ได้ (ลองไฟล์ JPG/PNG)"));
    im.src = dataUrl;
  });
  return { draw: img, w: img.naturalWidth || img.width, h: img.naturalHeight || img.height, done: () => {} };
}

export async function compressImage(file: File, maxEdge = 1280, quality = 0.6): Promise<string> {
  const { draw, w, h, done } = await loadImage(file);
  try {
    const longest = Math.max(w, h) || 1;
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.max(1, Math.round(w * scale));
    const height = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("อุปกรณ์นี้ย่อรูปไม่ได้");
    ctx.drawImage(draw, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", quality);
    if (!out.startsWith("data:image/")) throw new Error("แปลงรูปไม่สำเร็จ");
    return out;
  } finally {
    done();
  }
}
