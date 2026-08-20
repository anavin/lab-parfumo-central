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

/** Approx. decoded byte size of a data: URL from its base64 payload length. */
function dataUrlBytes(u: string): number {
  const i = u.indexOf(",");
  const b64 = i >= 0 ? u.slice(i + 1) : u;
  return Math.floor((b64.length * 3) / 4);
}

// Downscale + JPEG-compress to a TARGET size so every stored slip is bounded
// (keeps the DB small and read-egress low long-term) while staying readable:
// quality starts high and only steps down as far as needed to hit `targetKB`;
// if a very detailed photo still won't fit at the floor quality, the dimensions
// are shrunk and it retries (fewer pixels beats a mushy low-quality JPEG for
// text/numbers on a slip). Every attach path calls this, so tuning here tunes all.
export async function compressImage(
  file: File, maxEdge = 1280, quality = 0.7, targetKB = 160,
): Promise<string> {
  const { draw, w, h, done } = await loadImage(file);
  try {
    const target = targetKB * 1024;
    let edge = maxEdge;
    let out = "";
    for (let pass = 0; pass < 3; pass++) {
      const longest = Math.max(w, h) || 1;
      const scale = longest > edge ? edge / longest : 1;
      const width = Math.max(1, Math.round(w * scale));
      const height = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("อุปกรณ์นี้ย่อรูปไม่ได้");
      ctx.drawImage(draw, 0, 0, width, height);
      // step quality down (0.7 → 0.4) only until the size target is met
      let q = quality;
      out = canvas.toDataURL("image/jpeg", q);
      while (dataUrlBytes(out) > target && q > 0.4) {
        q = Math.max(0.4, q - 0.08);
        out = canvas.toDataURL("image/jpeg", q);
      }
      if (dataUrlBytes(out) <= target) break;   // fits — done
      edge = Math.round(edge * 0.8);            // still too big → fewer pixels, retry
    }
    if (!out.startsWith("data:image/")) throw new Error("แปลงรูปไม่สำเร็จ");
    return out;
  } finally {
    done();
  }
}
