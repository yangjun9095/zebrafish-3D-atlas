// Selection outline bands for the export overlay (AR-35, AR-56): from a coverage mask of the
// selected meshes, a chamfer distance transform gives the distance of every outside pixel to the
// silhouette, and the two-tone rule turns it into bands: `--bg` at 0 to 1 px, `--focus` at 1 to
// 3 px, `--bg` again at 3 to 4 px, all times the export scale. Pure typed-array code.

export const BAND_NONE = 0
export const BAND_BG = 1
export const BAND_FOCUS = 2

/** Chamfer 3-4 distance (in thirds of a pixel) from every pixel to the nearest set mask pixel. */
export function chamferDistance(mask: Uint8Array, width: number, height: number): Int32Array {
  const INF = 1 << 28
  const d = new Int32Array(width * height)
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? 0 : INF
  const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= width || y >= height ? INF : d[y * width + x])
  // Forward pass: neighbours above and to the left.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (d[i] === 0) continue
      let best = d[i]
      best = Math.min(best, at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4)
      d[i] = best
    }
  }
  // Backward pass: neighbours below and to the right.
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x
      if (d[i] === 0) continue
      let best = d[i]
      best = Math.min(best, at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4)
      d[i] = best
    }
  }
  return d
}

/** Band code per pixel: BAND_BG, BAND_FOCUS or BAND_NONE, for a silhouette mask at `scale` px per CSS px. */
export function outlineBands(mask: Uint8Array, width: number, height: number, scale: number): Uint8Array {
  const bands = new Uint8Array(width * height)
  if (!mask.some((v) => v > 0)) return bands
  const dist = chamferDistance(mask, width, height)
  const bgOuter = 4 * scale * 3
  const focusOuter = 3 * scale * 3
  const focusInner = 1 * scale * 3
  for (let i = 0; i < bands.length; i++) {
    const d = dist[i]
    if (d === 0 || d > bgOuter) continue
    bands[i] = d > focusInner && d <= focusOuter ? BAND_FOCUS : BAND_BG
  }
  return bands
}

export interface Rgb { r: number; g: number; b: number }

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Writes the bands as straight-alpha RGBA pixels. */
export function paintBands(bands: Uint8Array, rgba: Uint8ClampedArray, bg: Rgb, focus: Rgb): void {
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i]
    if (band === BAND_NONE) continue
    const c = band === BAND_FOCUS ? focus : bg
    const o = i * 4
    rgba[o] = c.r
    rgba[o + 1] = c.g
    rgba[o + 2] = c.b
    rgba[o + 3] = 255
  }
}
