// One frame of the dissect follow (D17): the per-system spread of phase 1 and the inventory
// grid of phase 2, written onto the dissect group of every mounted structure.
//
// Two caches sit in front of the work, and both build their key before they walk the handles.
// The layout cache (which system a structure belongs to, and its cell in that system's lattice)
// turns over when a build lands or a structure is hidden; the grid cache adds the time and the
// body length, and is filled only above 60 percent. Without them an orbit drag at 100 percent
// paid about 3200 corner transforms per frame.
import type { Group } from 'three'
import type { BodyFrame } from '../core/bodyModel.ts'
import {
  DISSECT_DIRECTIONS, DISSECT_SPREAD_END, INVENTORY_GAP, INVENTORY_MARGIN, dampTowards,
  dissectLayout, inventoryMix, loneSpread, packInventory, setDissectOffset, spreadLanes,
  spreadOffset, staggerAt,
} from '../core/dissect.ts'
import type { InventoryItem, SystemSpread, Vec2, Vec3 } from '../core/dissect.ts'
import type { SystemId } from '../core/schema.ts'
import { readAtlas } from '../state/store.ts'
import { handleBox } from './dissectFit.ts'
import type { HandleBox } from './dissectFit.ts'
import { getRuntime } from './runtime.ts'
import type { StructureHandle, ViewerRuntime } from './runtime.ts'

/** A handle that draws in the inventory grid: it has a build, and it is not the body. */
function inInventory(handle: StructureHandle): boolean {
  return handle.bounds !== null && !handle.isSkin && handle.record.geometry?.kind !== 'bodyDriven'
}

/** Posterior end of the body and its mid height, in millimetres: where the grid starts. */
function bodyEdge(frame: BodyFrame): { maxX: number; midY: number } {
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const s of frame.stations) {
    const reach = Math.max(s.hD, s.hV, s.hW)
    maxX = Math.max(maxX, s.p[0] + reach)
    minY = Math.min(minY, s.p[1] - s.hV)
    maxY = Math.max(maxY, s.p[1] + s.hD)
  }
  for (const sphere of [frame.yolk?.ball, frame.chorion]) {
    if (!sphere) continue
    maxX = Math.max(maxX, sphere.centre[0] + sphere.radiusMm)
    minY = Math.min(minY, sphere.centre[1] - sphere.radiusMm)
    maxY = Math.max(maxY, sphere.centre[1] + sphere.radiusMm)
  }
  return { maxX: Number.isFinite(maxX) ? maxX : 0, midY: (minY + maxY) / 2 }
}

interface Layout {
  key: string
  /** Where each system gathers, fanned apart from the systems that share its bearing. */
  spreads: Map<string, SystemSpread>
  /** The lattice cell of each structure inside its own system. */
  stagger: Map<string, Vec2>
  /** Drawable, not hidden, in system-then-id order: the grid takes its cells from this list. */
  drawable: string[]
}

interface Grid {
  key: string
  cells: Map<string, { cell: Vec3; box: HandleBox }>
  order: string[]
}

const EMPTY_LAYOUT: Layout = { key: '', spreads: new Map(), stagger: new Map(), drawable: [] }
const EMPTY_GRID: Grid = { key: '', cells: new Map(), order: [] }
let layout: Layout = EMPTY_LAYOUT
let grid: Grid = EMPTY_GRID
/** False until the driver has drawn one frame; the first frame jumps to the store value. */
let primed = false
/**
 * Whether the grid was last packed in the horizontal plane. An orbit drag turns the preset into
 * 'free', and re-packing the grid mid-drag would jump every cell, so the plane is held until the
 * viewer lands on a preset again.
 */
let horizontalGrid = false

export function resetDissectFrame(): void {
  layout = EMPTY_LAYOUT
  grid = EMPTY_GRID
  primed = false
  horizontalGrid = false
}

function directionOf(rt: ViewerRuntime, system: SystemId): Vec2 {
  return rt.data?.systemsById.get(system)?.dissectDirection ?? DISSECT_DIRECTIONS[system] ?? [0, 1]
}

function orderOf(rt: ViewerRuntime, system: SystemId): number {
  return rt.data?.systemsById.get(system)?.order ?? 99
}

/** Rail order of the system a mounted structure belongs to. */
function orderAt(rt: ViewerRuntime, id: string): number {
  const system = rt.handles.get(id)?.record.system
  return system ? orderOf(rt, system) : 99
}

/** The systems in rail order, with the direction each one owns (systems.json, D17). */
function systemDirections(rt: ViewerRuntime): { id: string; direction: Vec2 }[] {
  const rows = rt.data?.systems ?? []
  return [...rows].sort((a, b) => a.order - b.order).map((s) => ({ id: s.id, direction: directionOf(rt, s.id) }))
}

/**
 * The per-system spread and the per-structure lattice cell. A hidden structure takes no cell, so
 * hiding a system closes the lattice and the grid up rather than leaving a hole in them.
 */
function layoutFor(rt: ViewerRuntime, key: string, hidden: (h: StructureHandle) => boolean): Layout {
  if (key === layout.key) return layout
  const bySystem = new Map<string, string[]>()
  const drawable: string[] = []
  for (const handle of rt.handles.values()) {
    if (!inInventory(handle) || hidden(handle)) continue
    drawable.push(handle.id)
    const list = bySystem.get(handle.record.system)
    if (list) list.push(handle.id)
    else bySystem.set(handle.record.system, [handle.id])
  }
  drawable.sort((a, b) => {
    const oa = orderAt(rt, a)
    const ob = orderAt(rt, b)
    return oa !== ob ? oa - ob : a < b ? -1 : a > b ? 1 : 0
  })
  const stagger = new Map<string, Vec2>()
  for (const ids of bySystem.values()) {
    ids.sort()
    for (let i = 0; i < ids.length; i++) stagger.set(ids[i], staggerAt(i, ids.length))
  }
  layout = { key, spreads: spreadLanes(systemDirections(rt)), stagger, drawable }
  return layout
}

/**
 * The inventory grid. `horizontal` packs it in the plane the dorsal and ventral presets look
 * across, so the grid never collapses to a line of dots when the camera looks down its own
 * plane; every other preset keeps the lateral plane of D17.
 */
function gridFor(rt: ViewerRuntime, key: string, frame: BodyFrame, bodyLengthMm: number, horizontal: boolean): Grid {
  if (key === grid.key) return grid
  const items: InventoryItem[] = []
  const boxes = new Map<string, HandleBox>()
  for (const id of layout.drawable) {
    const handle = rt.handles.get(id)
    if (!handle) continue
    const box = handleBox(handle)
    if (!box) continue
    boxes.set(id, box)
    items.push({
      id,
      order: orderOf(rt, handle.record.system),
      widthMm: box.widthMm,
      heightMm: horizontal ? box.depthMm : box.heightMm,
    })
  }
  const edge = bodyEdge(frame)
  const cells = packInventory(items, {
    startXMm: edge.maxX + INVENTORY_MARGIN * bodyLengthMm,
    centreYMm: horizontal ? 0 : edge.midY,
    gapMm: INVENTORY_GAP * bodyLengthMm,
  })
  const placed = new Map<string, { cell: Vec3; box: HandleBox }>()
  const order: string[] = []
  for (const c of cells) {
    const box = boxes.get(c.id)
    if (!box) continue
    placed.set(c.id, { cell: horizontal ? [c.x, edge.midY, c.y] : [c.x, c.y, 0], box })
    order.push(c.id)
  }
  grid = { key, cells: placed, order }
  return grid
}

const ZERO_STAGGER: Vec2 = [0, 0]
/** Shared empty reading order: Labels.tsx caches its rank map on the array identity. */
const NO_ORDER: string[] = []

/**
 * Damps the drawn value toward the slider, then writes the offset of every mounted structure.
 * Phase 1 is the spread; phase 2 mixes it into the grid.
 */
export function dissectFrame(groups: Map<string, Group>, dt: number, invalidate: () => void): void {
  const s = readAtlas()
  const target = s.dissect
  const previous = dissectLayout.value
  // A link that names a dissect value opens on it: the first frame after a mount does not animate.
  const value = primed ? dampTowards(previous, target, dt) : target
  primed = true
  dissectLayout.value = value
  if (value !== target) invalidate()
  if (value === 0 && previous === 0 && dissectLayout.offsets.size === 0) return
  const rt = getRuntime()
  const frame = rt.bodyModel ? rt.bodyModel(s.time) : null
  if (!frame) return
  const bodyLengthMm = frame.bodyLengthMm > 0 ? frame.bodyLengthMm : frame.axisLengthMm
  const hiddenSystems: readonly string[] = s.hiddenSystems
  const hiddenStructures: readonly string[] = s.hiddenStructures
  const hidden = (h: StructureHandle): boolean =>
    hiddenStructures.includes(h.record.id) || hiddenSystems.includes(h.record.system)
  const layoutKey = `${rt.buildVersion}|${rt.handles.size}|${hiddenSystems.join('~')}|${hiddenStructures.join('~')}`
  const plan = layoutFor(rt, layoutKey, hidden)
  const mix = inventoryMix(value)
  if (s.viewPreset !== 'free') horizontalGrid = s.viewPreset === 'dorsal' || s.viewPreset === 'ventral'
  const horizontal = horizontalGrid
  const cells = mix > 0
    ? gridFor(rt, `${layoutKey}|${frame.hpf}|${bodyLengthMm.toFixed(4)}|${horizontal ? 'h' : 'l'}`, frame, bodyLengthMm, horizontal).cells
    : null
  dissectLayout.order = mix > 0 ? grid.order : NO_ORDER
  const phase1 = Math.min(value, DISSECT_SPREAD_END)
  for (const [id, group] of groups) {
    const handle = rt.handles.get(id)
    if (!handle) continue
    // The skin is the body outline: it stays where the body is, and Body.tsx fades it instead.
    // A hidden structure draws nothing, so it stays in the body and frees its cell.
    if (handle.isSkin || hidden(handle)) {
      group.position.set(0, 0, 0)
      dissectLayout.offsets.delete(id)
      continue
    }
    const spread = plan.spreads.get(handle.record.system) ?? loneSpread(directionOf(rt, handle.record.system))
    const offset = spreadOffset(spread, plan.stagger.get(id) ?? ZERO_STAGGER, bodyLengthMm, phase1)
    const placed = cells?.get(id)
    if (placed) {
      // The offset moves the box centre onto the cell centre, so the cell holds the structure.
      const c = placed.box.centre
      offset[0] += (placed.cell[0] - c[0] - offset[0]) * mix
      offset[1] += (placed.cell[1] - c[1] - offset[1]) * mix
      offset[2] += (placed.cell[2] - c[2] - offset[2]) * mix
    }
    group.position.set(offset[0], offset[1], offset[2])
    if (value === 0) dissectLayout.offsets.delete(id)
    else setDissectOffset(id, offset[0], offset[1], offset[2])
  }
  // A structure that unmounted keeps no entry: the fit and the label anchors read this map.
  if (dissectLayout.offsets.size > groups.size) {
    for (const id of dissectLayout.offsets.keys()) if (!groups.has(id)) dissectLayout.offsets.delete(id)
  }
}
