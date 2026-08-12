/**
 * Minimal Code 39 encoder. Returns vector bars (in "module" units) so the PDF
 * can render a real, scannable barcode with react-pdf <Rect>s — no canvas / DOM
 * needed on the server. Matches the "*ORDERNO*" style used by the Excel sheet.
 */

// pattern: 9 elements per char → b s b s b s b s b, each 'n'(narrow) | 'w'(wide)
const PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn",
  "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
  "8": "wnnwnnwnn", "9": "nnwwnnwnn",
  A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn",
  F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn",
  P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
  U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", $: "nwnwnwnnn",
  "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn",
};

const NARROW = 1;
const WIDE = 3;

export type Bar = { x: number; w: number };
export type Barcode = { bars: Bar[]; totalModules: number };

/** Encode a string as Code 39 vector bars. Unsupported chars are dropped. */
export function code39(input: string): Barcode {
  const clean = (input || "").toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, "");
  const text = `*${clean}*`;
  const bars: Bar[] = [];
  let x = 0;
  for (let ci = 0; ci < text.length; ci++) {
    const pat = PATTERNS[text[ci]] ?? PATTERNS["-"];
    for (let i = 0; i < pat.length; i++) {
      const w = pat[i] === "w" ? WIDE : NARROW;
      const isBar = i % 2 === 0;
      if (isBar) bars.push({ x, w });
      x += w;
    }
    // inter-character narrow gap
    x += NARROW;
  }
  return { bars, totalModules: x };
}
