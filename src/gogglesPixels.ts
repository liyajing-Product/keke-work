export const W = 1920;
export const H = 1230;
export type PreparedView = { base: ImageData; lens: Uint8Array };
export function preparePixels(base: ImageData): PreparedView {
  const lens = new Uint8Array(W * H);
  for (let i = 0; i < lens.length; i++) {
    const p = i * 4;
    const r = base.data[p]; const g = base.data[p + 1]; const b = base.data[p + 2]; const a = base.data[p + 3];
    if (a > 20 && r > 90 && r - g > 10 && r - b > 8) lens[i] = 1;
  }
  const outside = new Uint8Array(lens.length);
  const queue = new Int32Array(lens.length);
  let head = 0; let tail = 0;
  const visit = (i: number) => { if (!lens[i] && !outside[i]) { outside[i] = 1; queue[tail++] = i; } };
  for (let x = 0; x < W; x++) { visit(x); visit((H - 1) * W + x); }
  for (let y = 1; y < H - 1; y++) { visit(y * W); visit(y * W + W - 1); }
  while (head < tail) {
    const i = queue[head++]; const x = i % W;
    if (x > 0) visit(i - 1);
    if (x < W - 1) visit(i + 1);
    if (i >= W) visit(i - W);
    if (i < W * (H - 1)) visit(i + W);
  }
  for (let i = 0; i < lens.length; i++) if (!outside[i] && base.data[i * 4 + 3]) lens[i] = 1;
  return { base, lens };
}

function colourHsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min;
  const l = (max + min) / 2;
  const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  const h = !delta ? 0 : max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return { h, s, l };
}

export function paintPixels(view: PreparedView, hex: string, original: boolean) {
  const body = new ImageData(new Uint8ClampedArray(view.base.data), W, H);
  const lens = new ImageData(W, H);
  const target = colourHsl(hex);
  const xRatio = 1 - Math.abs(target.h % 2 - 1);
  const rgb = target.h < 1 ? [1, xRatio, 0] : target.h < 2 ? [xRatio, 1, 0] : target.h < 3 ? [0, 1, xRatio] : target.h < 4 ? [0, xRatio, 1] : target.h < 5 ? [xRatio, 0, 1] : [1, 0, xRatio];
  for (let i = 0; i < view.lens.length; i++) {
    if (!view.lens[i]) continue;
    const p = i * 4;
    const r = view.base.data[p]; const g = view.base.data[p + 1]; const b = view.base.data[p + 2];
    let nr = r; let ng = g; let nb = b;
    if (!original) {
      const luminance = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
      const l = Math.min(0.97, Math.max(0.025, luminance * (0.35 + target.l) + target.l * 0.1));
      const c = (1 - Math.abs(2 * l - 1)) * target.s;
      const m = l - c / 2;
      nr = (rgb[0] * c + m) * 255; ng = (rgb[1] * c + m) * 255; nb = (rgb[2] * c + m) * 255;
    }
    lens.data[p] = nr; lens.data[p + 1] = ng; lens.data[p + 2] = nb; lens.data[p + 3] = view.base.data[p + 3];
    body.data[p + 3] = 0;
  }
  return { body, lens };
}

