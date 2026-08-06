// Client-only: downscale + JPEG-compress an image File to a small data URL so
// bill photo evidence stays lightweight (~100-250KB) in the DB and under the
// server-action body limit.
export async function compressImage(file: File, maxEdge = 1280, quality = 0.6): Promise<string> {
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
  let { width, height } = img;
  const longest = Math.max(width, height) || 1;
  if (longest > maxEdge) {
    const s = maxEdge / longest;
    width = Math.round(width * s);
    height = Math.round(height * s);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
