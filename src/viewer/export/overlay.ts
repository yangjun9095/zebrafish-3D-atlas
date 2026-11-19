// Export overlay (AR-56, UXR-07): a 2D canvas of W by H with the readout chip, the scale bar,
// the legend, the label chips and the selection outline bands. Text and lines carry an opaque
// 2 px halo (times the export scale) in the colour opposite to the ink, so they read on a white
// and on a black slide. Sizes are the theme tokens times the export scale.
import { hexToRgb, paintBands } from './outlineMask.ts'
import type { OverlayPalette } from './plan.ts'

export type Canvas2D = OffscreenCanvas | HTMLCanvasElement
type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D

export const FONT_SANS = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/**
 * The credit line every export carries (L-07, release checklist step 14). It names the atlas, what
 * the render is, and the licence of the data it is built from, so a slide that leaves the app
 * keeps its attribution and its caveat (review C-08). Keep the text factual: it states a source,
 * a limit and a licence, nothing more.
 */
export const EXPORT_CREDIT = 'Zebrafish 3D Atlas | Schematic model. Most sizes are estimates. | data: ZFIN CC BY 4.0'

/**
 * The sentence a reporter preview export carries before the credit (review item 13). A dark frame
 * with emissive green and red reads as a micrograph, so the line names the author of the pattern.
 */
export const REPORTER_PREVIEW_CREDIT = 'Schematic reporter preview | pattern defined by the user, not imaging data'

let creditEnabled = true

/** The export dialog's "Include credit" switch writes here. On by default. */
export function setExportCredit(on: boolean): void {
  creditEnabled = on
}

export function exportCreditEnabled(): boolean {
  return creditEnabled
}

/**
 * The credit line to draw. The prefix always draws, the atlas credit only while the dialog switch
 * is on, so a preview export states who wrote the pattern even with the credit switched off.
 */
export function creditText(prefix: string | null | undefined, enabled: boolean = creditEnabled): string | null {
  if (!enabled) return prefix ?? null
  return prefix ? `${prefix} | ${EXPORT_CREDIT}` : EXPORT_CREDIT
}

export interface OverlayLabel {
  /** Anchor in output px: the projected structure centre. */
  x: number
  y: number
  text: string
  swatch: string
}

export interface LegendRow { name: string; swatch: string }

export interface OverlayInput {
  width: number
  height: number
  scale: number
  palette: OverlayPalette
  readout: string | null
  scaleBar: { px: number; label: string } | null
  legend: readonly LegendRow[]
  /** Priority order; a chip that overlaps an earlier one is skipped (AR-37). */
  labels: readonly OverlayLabel[]
  outline: { bands: Uint8Array; focusHex: string } | null
  /** Projected body bounds in output px; the legend takes the corner that overlaps them least. */
  bodyBox?: Rect | null
  /** Drawn before the atlas credit, and on its own when the dialog's credit switch is off. */
  creditPrefix?: string | null
}

export function createCanvas(width: number, height: number): Canvas2D {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return c
}

function context(canvas: Canvas2D): Ctx2D {
  const ctx = canvas.getContext('2d') as Ctx2D | null
  if (!ctx) throw new Error('2D canvas is unavailable')
  return ctx
}

export interface Rect { x: number; y: number; w: number; h: number }

const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const overlapArea = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

/**
 * The corner for a box of `w` by `h`: top right first, then the other corners; the one whose box
 * overlaps the body and the placed chips least wins (ties keep the earlier corner).
 */
export function legendCorner(size: { width: number; height: number }, w: number, h: number, margin: number, body: Rect | null, placed: readonly Rect[]): Rect {
  const corners: Rect[] = [
    { x: size.width - margin - w, y: margin, w, h },
    { x: margin, y: margin, w, h },
    { x: size.width - margin - w, y: size.height - margin - h, w, h },
    { x: margin, y: size.height - margin - h, w, h },
  ]
  let best = corners[0]
  let bestCost = Infinity
  for (const c of corners) {
    const cost = (body ? overlapArea(c, body) : 0) + placed.reduce((sum, q) => sum + overlapArea(c, q), 0)
    if (cost < bestCost) {
      best = c
      bestCost = cost
    }
  }
  return best
}

function haloText(ctx: Ctx2D, text: string, x: number, y: number, p: OverlayPalette, scale: number): void {
  ctx.lineJoin = 'round'
  ctx.lineWidth = 4 * scale
  ctx.strokeStyle = p.halo
  ctx.strokeText(text, x, y)
  ctx.fillStyle = p.ink
  ctx.fillText(text, x, y)
}

function haloStroke(ctx: Ctx2D, path: () => void, width: number, p: OverlayPalette, scale: number, ink = p.ink): void {
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = p.halo
  ctx.lineWidth = width + 4 * scale
  ctx.beginPath()
  path()
  ctx.stroke()
  ctx.strokeStyle = ink
  ctx.lineWidth = width
  ctx.beginPath()
  path()
  ctx.stroke()
}

function roundRect(ctx: Ctx2D, r: Rect, radius: number): void {
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h, radius)
}

/** A chip: rounded rect in the chip colour with a faint ink border and, optionally, a swatch dot. */
function drawChip(ctx: Ctx2D, r: Rect, text: string, swatch: string | null, p: OverlayPalette, scale: number, fontPx: number): void {
  roundRect(ctx, r, 6 * scale)
  ctx.fillStyle = p.chip
  ctx.globalAlpha = 0.92
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.lineWidth = 1 * scale
  ctx.strokeStyle = p.ink
  ctx.globalAlpha = 0.35
  ctx.stroke()
  ctx.globalAlpha = 1
  let tx = r.x + 8 * scale
  if (swatch) {
    ctx.beginPath()
    ctx.arc(tx + 4 * scale, r.y + r.h / 2, 4 * scale, 0, Math.PI * 2)
    ctx.fillStyle = swatch
    ctx.fill()
    tx += 14 * scale
  }
  ctx.font = `500 ${fontPx}px ${FONT_SANS}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = p.ink
  ctx.fillText(text, tx, r.y + r.h / 2 + 0.5 * scale)
}

function chipWidth(ctx: Ctx2D, text: string, swatch: boolean, scale: number, fontPx: number): number {
  ctx.font = `500 ${fontPx}px ${FONT_SANS}`
  return ctx.measureText(text).width + 16 * scale + (swatch ? 14 * scale : 0)
}

export function drawOverlay(input: OverlayInput): Canvas2D {
  const { width, height, scale, palette: p } = input
  const canvas = createCanvas(width, height)
  const ctx = context(canvas)
  const margin = 16 * scale
  const placed: Rect[] = []

  if (input.outline) {
    const layer = createCanvas(width, height)
    const lctx = context(layer)
    const data = lctx.createImageData(width, height)
    paintBands(input.outline.bands, data.data, hexToRgb(p.halo), hexToRgb(input.outline.focusHex))
    lctx.putImageData(data, 0, 0)
    ctx.drawImage(layer, 0, 0)
  }

  const credit = creditText(input.creditPrefix)
  if (credit) {
    const fontPx = 11 * scale
    ctx.font = `500 ${fontPx}px ${FONT_SANS}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    haloText(ctx, credit, margin, margin, p, scale)
    placed.push({ x: margin - 2 * scale, y: margin - 2 * scale, w: ctx.measureText(credit).width + 4 * scale, h: fontPx * 1.4 + 4 * scale })
  }

  if (input.readout) {
    const fontPx = 13 * scale
    const w = chipWidth(ctx, input.readout, false, scale, fontPx)
    const h = 28 * scale
    const r = { x: margin, y: height - margin - h, w, h }
    drawChip(ctx, r, input.readout, null, p, scale, fontPx)
    placed.push(r)
  }

  if (input.scaleBar) {
    const bar = input.scaleBar
    const thick = 2 * scale
    const cap = 6 * scale
    const x1 = width - margin
    const x0 = x1 - bar.px
    const y = height - margin - thick / 2
    haloStroke(ctx, () => {
      ctx.moveTo(x0, y)
      ctx.lineTo(x1, y)
      ctx.moveTo(x0 + thick / 2, y - cap)
      ctx.lineTo(x0 + thick / 2, y)
      ctx.moveTo(x1 - thick / 2, y - cap)
      ctx.lineTo(x1 - thick / 2, y)
    }, thick, p, scale)
    ctx.font = `600 ${11 * scale}px ${FONT_SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    haloText(ctx, bar.label, (x0 + x1) / 2, y - cap - 4 * scale, p, scale)
    placed.push({ x: x0 - 4 * scale, y: y - cap - 20 * scale, w: bar.px + 8 * scale, h: cap + 24 * scale })
  }

  if (input.legend.length > 0) {
    const fontPx = 12 * scale
    const row = 20 * scale
    ctx.font = `500 ${fontPx}px ${FONT_SANS}`
    let maxW = 0
    for (const item of input.legend) maxW = Math.max(maxW, ctx.measureText(item.name).width)
    const w = maxW + 30 * scale
    const h = input.legend.length * row + 8 * scale
    const r = legendCorner({ width, height }, w, h, margin, input.bodyBox ?? null, placed)
    roundRect(ctx, r, 6 * scale)
    ctx.fillStyle = p.chip
    ctx.globalAlpha = 0.92
    ctx.fill()
    ctx.globalAlpha = 1
    input.legend.forEach((item, i) => {
      const cy = r.y + 4 * scale + row * i + row / 2
      ctx.beginPath()
      ctx.arc(r.x + 12 * scale, cy, 5 * scale, 0, Math.PI * 2)
      ctx.fillStyle = item.swatch
      ctx.fill()
      ctx.font = `500 ${fontPx}px ${FONT_SANS}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = p.ink
      ctx.fillText(item.name, r.x + 22 * scale, cy + 0.5 * scale)
    })
    placed.push(r)
  }

  const fontPx = 12 * scale
  const chipH = 22 * scale
  const leader = 18 * scale
  for (const label of input.labels) {
    if (!Number.isFinite(label.x) || !Number.isFinite(label.y)) continue
    const w = chipWidth(ctx, label.text, true, scale, fontPx)
    let x = label.x - w / 2
    x = Math.min(Math.max(x, margin / 2), width - margin / 2 - w)
    const y = label.y - leader - chipH
    const r = { x, y: Math.max(margin / 2, y), w, h: chipH }
    if (placed.some((q) => overlaps(q, r))) continue
    placed.push(r)
    haloStroke(ctx, () => {
      ctx.moveTo(label.x, label.y)
      ctx.lineTo(label.x, r.y + r.h)
    }, 1 * scale, p, scale)
    ctx.beginPath()
    ctx.arc(label.x, label.y, 4 * scale, 0, Math.PI * 2)
    ctx.fillStyle = p.halo
    ctx.fill()
    ctx.beginPath()
    ctx.arc(label.x, label.y, 2.5 * scale, 0, Math.PI * 2)
    ctx.fillStyle = label.swatch
    ctx.fill()
    drawChip(ctx, r, label.text, label.swatch, p, scale, fontPx)
  }
  return canvas
}

/**
 * The final image: the theme background (null for a transparent export), the straight-alpha WebGL
 * bytes drawn over it, and the overlay on top (AR-55, AR-56). The bytes pass through a second canvas
 * because putImageData replaces pixels and would erase the fill.
 */
export function composeImage(rgba: Uint8ClampedArray<ArrayBuffer>, width: number, height: number, overlay: Canvas2D | null, background: string | null = null): Canvas2D {
  const canvas = createCanvas(width, height)
  const ctx = context(canvas)
  const layer = createCanvas(width, height)
  context(layer).putImageData(new ImageData(rgba, width, height), 0, 0)
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(layer, 0, 0)
  if (overlay) ctx.drawImage(overlay, 0, 0)
  return canvas
}
