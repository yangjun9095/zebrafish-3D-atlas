// Label placement (AR-37, UX-VS-19): a greedy pass over the label chips in priority order. Each
// chip takes the first free slot above or below its anchor; a chip that finds no slot is dropped.
// Pure arithmetic in CSS px, so the unit tests run it without a DOM; Labels.tsx feeds it the
// projected anchors and the measured chip sizes once per frame.

export interface LabelAnchor {
  id: string
  /** Projected anchor in CSS px. */
  x: number
  y: number
  /** Measured chip size in CSS px. */
  width: number
  height: number
}

export interface LabelPlacement {
  id: string
  /** Top-left corner of the chip in CSS px. */
  x: number
  y: number
  /** True when the chip sits away from its default stem, so a leader line is drawn to the anchor. */
  displaced: boolean
}

export interface Rect { x: number; y: number; w: number; h: number }

/** Gap between the anchor and the chip edge at the default slot. */
export const LABEL_STEM_PX = 18
/** Gap between two stacked chips and between a chip and the viewport edge. */
export const LABEL_GAP_PX = 4
/** Slots tried per label: the default stem, then alternating farther above and below (eight chips can share one anchor). */
export const LABEL_SLOTS = 9

export const rectsOverlap = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** The vertical offsets tried in order: -stem, +stem, -stem-row, +stem+row, ... (negative is above). */
export function slotOffsets(height: number, slots = LABEL_SLOTS): number[] {
  const row = height + LABEL_GAP_PX
  const out: number[] = []
  for (let k = 0; out.length < slots; k++) {
    out.push(-(LABEL_STEM_PX + k * row))
    if (out.length < slots) out.push(LABEL_STEM_PX + k * row)
  }
  return out
}

/**
 * Places the chips in the given order. A chip is centred on its anchor and clamped inside the
 * viewport; its vertical slot is the first of slotOffsets whose rectangle overlaps no placed chip
 * and lies inside the viewport. Anchors outside the viewport are dropped.
 */
export function placeLabels(anchors: readonly LabelAnchor[], viewport: { width: number; height: number }): LabelPlacement[] {
  const placed: Rect[] = []
  const out: LabelPlacement[] = []
  for (const a of anchors) {
    if (!Number.isFinite(a.x) || !Number.isFinite(a.y)) continue
    if (a.x < 0 || a.y < 0 || a.x > viewport.width || a.y > viewport.height) continue
    const w = Math.max(1, a.width)
    const h = Math.max(1, a.height)
    const x = Math.min(Math.max(a.x - w / 2, LABEL_GAP_PX), Math.max(LABEL_GAP_PX, viewport.width - w - LABEL_GAP_PX))
    let hit: LabelPlacement | null = null
    for (const [i, dy] of slotOffsets(h).entries()) {
      const y = dy < 0 ? a.y + dy - h : a.y + dy
      if (y < LABEL_GAP_PX || y + h > viewport.height - LABEL_GAP_PX) continue
      const r = { x, y, w, h }
      if (placed.some((q) => rectsOverlap(q, r))) continue
      placed.push(r)
      hit = { id: a.id, x, y, displaced: i > 0 || Math.abs(x + w / 2 - a.x) > 1 }
      break
    }
    if (hit) out.push(hit)
  }
  return out
}
