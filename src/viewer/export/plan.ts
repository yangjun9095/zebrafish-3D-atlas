// Export planning (AR-52, AR-53, AR-56, AR-57): pure functions with no three or DOM import,
// so the unit tests can check sizes, tiles, file names and overlay colours in node.

export type ExportFrame = 'viewport' | '16:9' | '4:3' | '1:1'
export type ExportScale = 1 | 2 | 4
export type ExportFixedSize = '1920x1080' | '3840x2160'
/** The overlay ink: `auto` is dark on a transparent export and the theme ink otherwise. */
export type OverlayColour = 'auto' | 'dark' | 'light'

export interface ExportOptions {
  frame?: ExportFrame
  scale?: ExportScale
  /** A fixed slide size; 16:9 only. Wins over `scale` when set. */
  fixedSize?: ExportFixedSize
  transparent?: boolean
  overlayColour?: OverlayColour
  includeSelectionOutline?: boolean
  includeLabels?: boolean
  includeScaleBar?: boolean
  includeReadout?: boolean
  includeLegend?: boolean
}

export const EXPORT_FRAMES: readonly ExportFrame[] = ['viewport', '16:9', '4:3', '1:1']
export const EXPORT_SCALES: readonly ExportScale[] = [1, 2, 4]
export const EXPORT_FIXED_SIZES: readonly ExportFixedSize[] = ['1920x1080', '3840x2160']
/** Longest edge of an export (AR-52). */
export const MAX_EDGE_PX = 8192
/** Output tile edge (AR-53), and the smaller edge for a phone or a small MAX_TEXTURE_SIZE. */
export const TILE_EDGE_PX = 2048
export const TILE_EDGE_SMALL_PX = 1024
/** Each tile renders at this multiple of its output size and is box-filtered down (AR-53). */
export const SUPERSAMPLE = 2

export interface CanvasSize { width: number; height: number }

export interface OutputSize {
  width: number
  height: number
  /** Overlay scale: output px per CSS px of the framed canvas region (AR-56). */
  scale: number
  /** "2x" for a scaled export, "1920x1080" for a fixed size (AR-57). */
  token: string
  /** True when the longest edge exceeds MAX_EDGE_PX; the dialog disables the option. */
  overCap: boolean
}

export const FRAME_ASPECT: Record<Exclude<ExportFrame, 'viewport'>, number> = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1 }

/** The largest rectangle of `frame`'s aspect inside the canvas, in CSS px; the canvas itself for `viewport`. */
export function frameBox(frame: ExportFrame, canvas: CanvasSize): CanvasSize {
  const w = Math.max(1, canvas.width)
  const h = Math.max(1, canvas.height)
  if (frame === 'viewport') return { width: w, height: h }
  const aspect = FRAME_ASPECT[frame]
  if (w / h > aspect) return { width: h * aspect, height: h }
  return { width: w, height: w / aspect }
}

export function parseFixedSize(size: ExportFixedSize): CanvasSize {
  const [w, h] = size.split('x').map(Number)
  return { width: w, height: h }
}

/** Output size for the dialog and the pipeline (AR-52). */
export function outputSize(opts: Pick<ExportOptions, 'frame' | 'scale' | 'fixedSize'>, canvas: CanvasSize): OutputSize {
  const frame = opts.frame ?? 'viewport'
  if (opts.fixedSize) {
    const fixed = parseFixedSize(opts.fixedSize)
    const box = frameBox('16:9', canvas)
    return { ...fixed, scale: fixed.height / box.height, token: opts.fixedSize, overCap: Math.max(fixed.width, fixed.height) > MAX_EDGE_PX }
  }
  const scale = opts.scale ?? 2
  const box = frameBox(frame, canvas)
  const width = Math.max(1, Math.round(box.width * scale))
  const height = Math.max(1, Math.round(box.height * scale))
  return { width, height, scale, token: `${scale}x`, overCap: Math.max(width, height) > MAX_EDGE_PX }
}

/** Tile edge of AR-53: 1024 on a phone or when the render size (twice the tile) would exceed the GPU limits. */
export function tileEdge(limits: { maxTextureSize: number; maxRenderbufferSize: number; phone: boolean }): number {
  const cap = Math.min(limits.maxTextureSize, limits.maxRenderbufferSize)
  if (limits.phone || cap < TILE_EDGE_PX * SUPERSAMPLE) return Math.min(TILE_EDGE_SMALL_PX, Math.floor(cap / SUPERSAMPLE))
  return TILE_EDGE_PX
}

export interface Tile { x: number; y: number; width: number; height: number }

/** Row-major tiles that cover width by height with at most `edge` px per side. */
export function planTiles(width: number, height: number, edge: number): Tile[] {
  const tiles: Tile[] = []
  for (let y = 0; y < height; y += edge) {
    for (let x = 0; x < width; x += edge) {
      tiles.push({ x, y, width: Math.min(edge, width - x), height: Math.min(edge, height - y) })
    }
  }
  return tiles
}

/** Lower-case ASCII slug of a structure name for the file name. */
export function slug(name: string): string {
  const s = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return s.length > 0 ? s : 'structure'
}

export interface FileNameInput {
  /** The readout time without spaces: "24hpf" (format.ts, formatTimeForFileName). */
  time: string
  /** Preset name, or "free" for a manual camera. */
  view: string
  /** Names of the selected structures, in selection order. */
  selectionNames: readonly string[]
  sizeToken: string
}

/** `zfatlas_<time>_<view>_<selection-or-all>_<size>.png` (AR-57, UX-EX-04). */
export function exportFileName(input: FileNameInput): string {
  const first = input.selectionNames[0]
  const sel = first === undefined ? 'all' : input.selectionNames.length > 1 ? `${slug(first)}+${input.selectionNames.length - 1}` : slug(first)
  return `zfatlas_${input.time}_${input.view}_${sel}_${input.sizeToken}.png`
}

export interface OverlayPalette {
  /** Text and line colour. */
  ink: string
  /** The 2 px halo colour, opposite to the ink. */
  halo: string
  /** Chip background. */
  chip: string
  /** The palette theme whose colours read on the ink: swatches and the focus ring. */
  swatchTheme: 'dark' | 'light'
}

const DARK_INK: OverlayPalette = { ink: '#1B1F24', halo: '#F5F6F7', chip: '#FFFFFF', swatchTheme: 'light' }
const LIGHT_INK: OverlayPalette = { ink: '#E7EAEE', halo: '#0E1116', chip: '#161B22', swatchTheme: 'dark' }

/** AR-56: auto is dark ink on a transparent export and the theme ink otherwise. */
export function overlayPalette(colour: OverlayColour, transparent: boolean, theme: 'dark' | 'light'): OverlayPalette {
  if (colour === 'dark') return DARK_INK
  if (colour === 'light') return LIGHT_INK
  if (transparent) return DARK_INK
  return theme === 'dark' ? LIGHT_INK : DARK_INK
}

const NICE_MM = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50] as const

export interface ScaleBarChoice { mm: number; px: number; label: string }

/** The longest 1-2-5 length whose bar fits `maxPx`; null when no length fits. */
export function scaleBarFor(pxPerMm: number, maxPx: number): ScaleBarChoice | null {
  if (!Number.isFinite(pxPerMm) || pxPerMm <= 0) return null
  let best: ScaleBarChoice | null = null
  for (const mm of NICE_MM) {
    const px = mm * pxPerMm
    if (px > maxPx) break
    best = { mm, px, label: mm < 1 ? `${Math.round(mm * 1000)} µm` : `${mm} mm` }
  }
  return best
}

/** Copies bottom-up RGBA rows of a tile into a top-down image buffer of `imageWidth` px. */
export function blitTile(image: Uint8ClampedArray, imageWidth: number, tile: Tile, rows: Uint8Array): void {
  const stride = tile.width * 4
  for (let j = 0; j < tile.height; j++) {
    const srcRow = tile.height - 1 - j
    const src = rows.subarray(srcRow * stride, srcRow * stride + stride)
    image.set(src, ((tile.y + j) * imageWidth + tile.x) * 4)
  }
}
