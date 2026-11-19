// The inventory grid of D17 phase 2: a shelf pack over the structures' own world boxes.
// src/core/dissect.ts re-exports this module, so callers import one name.
//
// Pure TypeScript: no react, three or DOM import (AR-04).

export interface InventoryItem {
  id: string
  /** System order (D5), then the id, decides the reading order of the grid. */
  order: number
  /** Extent of the structure's own world box in the grid plane, in millimetres. */
  widthMm: number
  heightMm: number
}

export interface InventoryOptions {
  /** Left edge of the grid, in millimetres: the posterior end of the body plus a margin. */
  startXMm: number
  /** The grid is centred on this height. */
  centreYMm: number
  zMm?: number
  gapMm: number
  aspect?: number
}

export interface InventoryCell {
  id: string
  /** Centre of the cell, in millimetres. */
  x: number
  y: number
  z: number
  widthMm: number
  heightMm: number
}

/** Gap between two inventory cells, in body lengths. */
export const INVENTORY_GAP = 0.03
/** Gap between the body and the first inventory column, in body lengths. */
export const INVENTORY_MARGIN = 0.12
/**
 * Width over height the shelf packer aims for. The camera's free rectangle is about 1.56 times
 * as wide as it is tall once the fill fractions of fit.ts are applied, and a shelf packer over
 * cells of many sizes lands well short of its target, so the target is set above the frame:
 * measured at 4320 hpf, a target of 1.5 packs 61 by 69 mm and a target of 2.8 packs 82 by 54,
 * which puts the camera 22 percent nearer and every part in the grid that much larger.
 */
export const INVENTORY_ASPECT = 2.8

function byOrderThenId(a: InventoryItem, b: InventoryItem): number {
  if (a.order !== b.order) return a.order - b.order
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * Shelf packing (D17): cells run left to right along +x, a full shelf starts a new row below,
 * and the block is centred on `centreYMm`. A cell is the structure's own world box in the grid
 * plane plus the gap, so nothing in the grid touches its neighbour. The box, not the bounding
 * sphere: the notochord is half a body long and a tenth of a body thick, and a square cell
 * around its sphere would leave the grid mostly empty.
 */
export function packInventory(items: readonly InventoryItem[], opts: InventoryOptions): InventoryCell[] {
  if (items.length === 0) return []
  const gap = Math.max(opts.gapMm, 1e-6)
  const sized = [...items].sort(byOrderThenId).map((i) => ({
    id: i.id,
    w: Math.max(i.widthMm, gap) + gap,
    h: Math.max(i.heightMm, gap) + gap,
  }))
  let area = 0
  let widest = 0
  for (const c of sized) {
    area += c.w * c.h
    widest = Math.max(widest, c.w)
  }
  const width = Math.max(widest, Math.sqrt(area * (opts.aspect ?? INVENTORY_ASPECT)))
  const placed: { id: string; cx: number; cy: number; w: number; h: number }[] = []
  let x = 0
  let top = 0
  let shelf = 0
  for (const c of sized) {
    if (x > 0 && x + c.w > width) {
      top -= shelf
      x = 0
      shelf = 0
    }
    placed.push({ id: c.id, cx: x + c.w / 2, cy: top - c.h / 2, w: c.w, h: c.h })
    x += c.w
    shelf = Math.max(shelf, c.h)
  }
  const height = shelf - top
  const z = opts.zMm ?? 0
  return placed.map((p) => ({
    id: p.id,
    x: opts.startXMm + p.cx,
    y: opts.centreYMm + height / 2 + p.cy,
    z,
    widthMm: p.w,
    heightMm: p.h,
  }))
}

/** Bounding box of a packed grid, in millimetres, or null when it is empty. */
export function inventoryBounds(cells: readonly InventoryCell[]): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (cells.length === 0) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const c of cells) {
    minX = Math.min(minX, c.x - c.widthMm / 2)
    maxX = Math.max(maxX, c.x + c.widthMm / 2)
    minY = Math.min(minY, c.y - c.heightMm / 2)
    maxY = Math.max(maxY, c.y + c.heightMm / 2)
  }
  return { minX, maxX, minY, maxY }
}
