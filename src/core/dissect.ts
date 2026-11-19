// Dissect layout (D17): where each structure sits at a slider value from 0 to 100.
//
// Phase 1 (0 to 60): a structure slides away from the spine along the direction its system
// owns in the lateral plane (systems.json `dissectDirection`, the table below as the
// fallback). Systems whose directions point the same way are fanned apart into lanes, and the
// structures of one system take the cells of a small lattice, so no two siblings and no two
// systems land on one another.
//
// Phase 2 (60 to 100): the structure glides from its phase 1 offset into a shelf-packed
// inventory grid on the posterior side of the body, sorted by system order then id, with a
// cell from its bounding box (src/core/dissectPack.ts). The body itself never moves.
//
// Pure TypeScript: no react, three or DOM import (AR-04). The viewer owns the frame loop and
// writes the result into `dissectLayout`, which Labels.tsx reads for its anchors.
export {
  INVENTORY_ASPECT, INVENTORY_GAP, INVENTORY_MARGIN, inventoryBounds, packInventory,
} from './dissectPack.ts'
export type { InventoryCell, InventoryItem, InventoryOptions } from './dissectPack.ts'

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

export const DISSECT_MIN = 0
export const DISSECT_MAX = 100
/** End of phase 1: the systems have separated. Above this the inventory grid takes over. */
export const DISSECT_SPREAD_END = 60
/** The steps the D key walks; Shift+D walks them backwards. */
export const DISSECT_STEPS: readonly number[] = [0, 30, 60, 100]
/** Time constant of the damped follow, in milliseconds (D17: smooth over 200 ms). */
export const DISSECT_TAU_MS = 200

/**
 * Fallback direction per system, `[posterior, dorsal]` in the lateral plane (D4 axes: +x
 * posterior, +y dorsal). The length of the vector scales the distance, so the axial system,
 * which stays near the spine, is short. systems.json overrides every row.
 */
export const DISSECT_DIRECTIONS: Readonly<Record<string, Vec2>> = {
  early_embryo: [-1, 0.2],
  axial: [0, 0.3],
  nervous: [0, 1],
  sensory: [-0.6, 0.8],
  cardiovascular: [-0.5, -0.9],
  hematopoietic_immune: [-0.9, -0.4],
  respiratory: [-0.8, -0.6],
  digestive: [0, -1],
  excretory: [0.5, -0.9],
  endocrine: [-0.3, -1],
  reproductive: [0.6, -0.8],
  skeletal: [0.7, 0.7],
  muscular: [0.9, 0.4],
  fins: [1, 0],
  integument_pigment: [0.9, -0.5],
}

/** Spread at 60 percent, in direction units, before the frame scale (D17). */
export const SPREAD_BODY_LENGTHS = 0.9
/**
 * Anisotropic gain on the spread, in body lengths per direction unit. The fish is long and
 * thin, so a system that moves dorsally travels further than one that moves posteriorly. The
 * camera refits to the dissect box (src/viewer/dissectFit.ts), so the exploded fish no longer
 * has to stay inside the frame the body was fitted to and the gain buys real separation: at
 * 4320 hpf a dorsal system now clears the spine by about a third of a body length.
 */
export const SPREAD_FRAME_SCALE: Vec2 = [0.22, 0.30]
/**
 * Two systems count as pointing the same way when their directions are inside this angle. Five
 * of the fifteen point into the ventral quadrant, and without the lanes they pile into one
 * cluster next to the yolk at exactly the slider values a presenter stops on.
 */
export const LANE_ANGLE_DEG = 45
/**
 * How much further out each lane sits, as a share of the base spread. The step is radial, along
 * the system's own bearing, so a system fanned into a later lane keeps the direction systems.json
 * gave it (D17: nervous dorsal, digestive ventral) and only travels further.
 */
export const LANE_RADIUS_STEP = 0.55
/** Closest two system centres sit at 60 percent, in body lengths, on the shipped directions. */
export const MIN_SYSTEM_GAP = 0.12
/** Lattice pitch of the structures inside one system, in direction units. */
export const STAGGER_PITCH = 0.35

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export function clampDissect(value: number): number {
  if (!Number.isFinite(value)) return DISSECT_MIN
  return Math.min(Math.max(Math.round(value), DISSECT_MIN), DISSECT_MAX)
}

/** The next step of DISSECT_STEPS in `dir`, wrapping at both ends (the D key). */
export function nextDissectStep(value: number, dir: 1 | -1): number {
  const steps = DISSECT_STEPS
  if (dir > 0) {
    for (const s of steps) if (s > value) return s
    return steps[0]
  }
  for (let i = steps.length - 1; i >= 0; i--) if (steps[i] < value) return steps[i]
  return steps[steps.length - 1]
}

/** The unit direction of a system, or `[0, 1]` when the vector is zero. */
export function unitOf(direction: Vec2): Vec2 {
  const len = Math.hypot(direction[0], direction[1])
  return len < 1e-9 ? [0, 1] : [direction[0] / len, direction[1] / len]
}

/**
 * The lattice cell of one structure inside its system, `[along, perpendicular]` in direction
 * units. The lattice is square and centred, so two siblings are never closer than the pitch and
 * a system of one structure takes no offset at all.
 */
export function staggerAt(index: number, count: number): Vec2 {
  if (count <= 1 || index < 0) return [0, 0]
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)))
  const rows = Math.ceil(count / cols)
  const row = Math.floor(index / cols)
  const col = index % cols
  return [(row - (rows - 1) / 2) * STAGGER_PITCH, (col - (cols - 1) / 2) * STAGGER_PITCH]
}

/** Where one system's structures gather at 60 percent, before the per-structure lattice. */
export interface SystemSpread {
  /** Centre of the system's patch, in direction units. */
  anchor: Vec2
  /** Unit direction the lattice runs along. */
  unit: Vec2
  /** Position among the systems that share a bearing; 0 for the first, and for a system alone. */
  lane: number
}

/**
 * The phase 1 anchor of every system. A system takes the first lane that no system pointing its
 * way already holds, and each lane sits LANE_RADIUS_STEP further out along the same bearing, so
 * the ventral systems stack outward instead of on top of one another. `systems` is walked in rail
 * order, so the lanes are stable.
 */
export function spreadLanes(systems: readonly { id: string; direction: Vec2 }[]): Map<string, SystemSpread> {
  const cos = Math.cos((LANE_ANGLE_DEG * Math.PI) / 180)
  const placed: { unit: Vec2; lane: number }[] = []
  const out = new Map<string, SystemSpread>()
  for (const system of systems) {
    const unit = unitOf(system.direction)
    const taken = new Set<number>()
    for (const p of placed) if (unit[0] * p.unit[0] + unit[1] * p.unit[1] >= cos) taken.add(p.lane)
    let lane = 0
    while (taken.has(lane)) lane++
    placed.push({ unit, lane })
    const k = SPREAD_BODY_LENGTHS * (1 + LANE_RADIUS_STEP * lane)
    out.set(system.id, { anchor: [system.direction[0] * k, system.direction[1] * k], unit, lane })
  }
  return out
}

/** The spread of a system with no neighbour of its own bearing: the plain direction. */
export function loneSpread(direction: Vec2): SystemSpread {
  return { anchor: [direction[0] * SPREAD_BODY_LENGTHS, direction[1] * SPREAD_BODY_LENGTHS], unit: unitOf(direction), lane: 0 }
}

/**
 * The phase 1 offset of one structure, in millimetres. `value` is clamped to the phase 1 range,
 * so a caller may pass the raw slider value.
 */
export function spreadOffset(spread: SystemSpread, stagger: Vec2, bodyLengthMm: number, value: number): Vec3 {
  const f = clamp01(value / DISSECT_SPREAD_END)
  if (f <= 0 || bodyLengthMm <= 0) return [0, 0, 0]
  const [ux, uy] = spread.unit
  const [along, perp] = stagger
  const x = spread.anchor[0] + ux * along - uy * perp
  const y = spread.anchor[1] + uy * along + ux * perp
  const k = bodyLengthMm * f
  return [x * SPREAD_FRAME_SCALE[0] * k, y * SPREAD_FRAME_SCALE[1] * k, 0]
}

export function smoothstep01(x: number): number {
  const k = clamp01(x)
  return k * k * (3 - 2 * k)
}

/** Share of the inventory grid at a slider value: 0 through phase 1, 1 at 100 percent. */
export function inventoryMix(value: number): number {
  if (value <= DISSECT_SPREAD_END) return 0
  return smoothstep01((value - DISSECT_SPREAD_END) / (DISSECT_MAX - DISSECT_SPREAD_END))
}

export function mix3(a: Vec3, b: Vec3, k: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

/**
 * One damped step toward `target` over a frame of `dtSeconds`, with the 200 ms time constant of
 * D17. Snaps when the remaining distance falls under `epsilon`, so the follow ends.
 */
export function dampTowards(current: number, target: number, dtSeconds: number, tauMs = DISSECT_TAU_MS, epsilon = 0.02): number {
  const dt = Math.min(Math.max(dtSeconds, 0), 0.1)
  const gap = target - current
  if (Math.abs(gap) <= epsilon || dt <= 0) return target
  return current + gap * (1 - Math.exp((-dt * 1000) / tauMs))
}

/** Skin opacity factor: gone by the end of phase 1 (D17). */
export function skinDissectFade(value: number): number {
  return 1 - clamp01(value / DISSECT_SPREAD_END)
}

/**
 * Yolk and chorion opacity factor. They are body-driven, so they never leave the body frame;
 * a quarter of their opacity stays so the inventory keeps a visible anchor where the fish is.
 */
export function bodyPartDissectFade(value: number): number {
  return 1 - 0.75 * clamp01(value / DISSECT_SPREAD_END)
}

/**
 * The offsets the viewer drew last, keyed by structure id, with the animated slider value
 * behind them and the reading order of the inventory grid. Structures.tsx writes it once per
 * frame; Labels.tsx reads it so a chip follows its structure out of the body and the grid takes
 * its chips in reading order. Nothing else writes here.
 */
export interface DissectLayout {
  value: number
  offsets: Map<string, Vec3>
  /** Ids in grid reading order, or empty below 60 percent. */
  order: string[]
}

export const dissectLayout: DissectLayout = { value: 0, offsets: new Map(), order: [] }

const ZERO: Vec3 = [0, 0, 0]

export function dissectOffsetOf(id: string): Vec3 {
  return dissectLayout.offsets.get(id) ?? ZERO
}

/** Writes an offset without allocating a tuple per structure per frame. */
export function setDissectOffset(id: string, x: number, y: number, z: number): void {
  const held = dissectLayout.offsets.get(id)
  if (held) {
    held[0] = x
    held[1] = y
    held[2] = z
    return
  }
  dissectLayout.offsets.set(id, [x, y, z])
}

/** Clears the module layout when the viewer unmounts, so a remount starts from the body. */
export function resetDissectLayout(): void {
  dissectLayout.value = 0
  dissectLayout.offsets.clear()
  dissectLayout.order = []
}
