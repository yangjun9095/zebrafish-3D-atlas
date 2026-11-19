// Generates src/data/body.json (spec 4.2, 4.3; D8 as revised). Run with
// `node scripts/gen-body.ts` to write the file or `--check` to compare the
// regenerated table with the checked-in one. The pure parts are exported so
// that tests/unit/bodyModel.test.ts can assert the enclosure constraint.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  PROFILE_U, cellCountAt, createBodyModel, regimeAt, somiteCountAt,
  type BodyFile, type BodyFrame, type BodyKeyframe, type ProfileStation,
} from '../src/core/bodyModel.ts'
import { bodyLengthAtFrom, slAtFrom, type GrowthPoint } from '../src/core/growth.ts'
import { EXTENSION_AXIS_INSET_MM } from '../src/core/primitives/buildStructure.ts'
import { degToRad, lerp, madd, smoothstep, type Vec3 } from '../src/core/primitives/vec3.ts'
import { enclosingSphere, monotoneCubic } from '../src/core/spine.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
export const BODY_JSON_PATH = path.resolve(here, '../src/data/body.json')
const STAGES_JSON_PATH = path.resolve(here, '../src/data/stages.json')

export const CHORION_RADIUS_MM = 0.6
/** Last keyframe that carries a chorion (D8 revised: dechorionated after 30 hpf). */
export const CHORION_LAST_HPF = 30
export const CONTROL_POINT_COUNT = 17
/** The blastodisc top stays this far above the yolk apex, so the cap never sinks into the sphere (BG-11; phase 1 review R1). */
export const CAP_CLEARANCE_MM = 0.03
/** The ventral skin runs this far below the yolk extension axis line it envelops (BG-18; phase 1 review R3). */
export const YOLK_ENVELOPE_MARGIN_MM = 0.01
/**
 * From 72 hpf the yolk remnant sits in the gut region: its top lies this fraction of the
 * template ventral half-height below the spine, under the notochord and the dorsal vessels
 * (research 05 section 7, "yolk still visible under the gut"; the runtime wraps the skin
 * around it). Before 72 hpf the ball hangs with its top 0.03 mm inside the template skin (BG-18).
 */
export const GUT_TOP_FRACTION = 0.5
/**
 * From 120 hpf the remnant is drawn inside the belly (review R01: Kimmel Day 5 "yolk nearly
 * exhausted", a smooth ventral contour): its bottom stays this far inside the template skin
 * and its top this far below the spine, and it keeps the gut line only when it fits nowhere else.
 */
export const REMNANT_SKIN_CLEARANCE_MM = 0.005
export const REMNANT_SPINE_CLEARANCE_MM = 0.055
export const REMNANT_INSIDE_HPF = 120
/** Template tip row as fractions of the u = 0.1 row: a wedge snout with a slightly superior mouth (research 05 section 13). */
export const SNOUT_TIP = { hD: 0.42, hV: 0.28, hW: 0.33 } as const
const SEED_U = 0.4
const FINE = 1600

// ---------------------------------------------------------------------------
// Growth table (spec 4.4). stages.json owns it (D6); this copy is the source
// series for the generator and the fallback for tests before WP-02 merges.
// ---------------------------------------------------------------------------
const ZFIN = 'ZFIN staging index page (research 05 section 5.1)'
const K95 = 'Kimmel 1995 Table 1 (research 05 section 5.1)'
const g = (hpf: number, lengthMm: number, measure: 'EL' | 'TL', sl: number | null, source: string, estimate = false): GrowthPoint =>
  ({ hpf, lengthMm, measure, standardLengthMm: sl, source, estimate })
export const GROWTH_FALLBACK: GrowthPoint[] = [
  g(0, 0.7, 'EL', null, 'egg diameter, ZFIN zygote page (research 05 section 2)'),
  g(0.75, 0.7, 'EL', null, 'egg diameter'), g(2.25, 0.7, 'EL', null, 'egg diameter'), g(3.33, 0.7, 'EL', null, 'egg diameter'),
  g(4.33, 0.7, 'EL', null, 'egg diameter'), g(5.25, 0.7, 'EL', null, 'egg diameter'), g(6, 0.7, 'EL', null, 'egg diameter'),
  g(8, 0.7, 'EL', null, 'egg diameter'), g(9, 0.7, 'EL', null, 'egg diameter'), g(10, 0.7, 'EL', null, 'egg diameter'),
  g(12, 0.8, 'EL', null, 'Kimmel, same as the zygote (research 05 section 5.1)'),
  g(14, 0.85, 'EL', null, 'estimate between 0.8 and 0.9', true),
  g(16, 0.9, 'EL', null, K95), g(18, 1.2, 'EL', null, 'estimate between 0.9 and 1.4', true),
  g(19, 1.4, 'EL', null, K95), g(22, 1.6, 'EL', null, K95), g(24, 1.9, 'EL', null, K95), g(30, 2.5, 'EL', null, K95),
  g(36, 2.7, 'EL', null, K95), g(42, 2.9, 'EL', null, K95), g(48, 3.1, 'EL', null, K95), g(60, 3.3, 'EL', null, K95),
  g(72, 3.5, 'TL', 3.25, `${ZFIN}; SL derived`), g(96, 3.7, 'TL', 3.4, `${ZFIN}; SL derived`),
  g(120, 3.9, 'TL', 3.6, `${ZFIN}; T25 mean 3.90 mm; SL derived`), g(168, 4.5, 'TL', 4.1, `${ZFIN}; SL derived`),
  g(336, 6.2, 'TL', 5.3, `${ZFIN}; SL derived`), g(504, 7.8, 'TL', 6.5, `${ZFIN}; SL derived`),
  g(720, 10.0, 'TL', 8.2, `${ZFIN}; SL derived`),
  g(1080, 14.4, 'TL', 12.0, 'Singleman and Holtzman 2014 juvenile threshold (D6); TL = 1.2 x SL'),
  g(2160, 21.6, 'TL', 18.0, 'Singleman and Holtzman 2014 adult threshold (D6); TL = 1.2 x SL'),
  g(4320, 30.0, 'TL', 25.0, 'Singleman and Holtzman 2014 180 dpf value (D6); TL = 1.2 x SL'),
]

/** Growth table from stages.json when it exists, else the fallback copy. */
export function loadGrowth(): { growth: GrowthPoint[]; fromStages: boolean } {
  if (fs.existsSync(STAGES_JSON_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(STAGES_JSON_PATH, 'utf8')) as { growth?: GrowthPoint[] }
    if (Array.isArray(parsed.growth) && parsed.growth.length >= 2) return { growth: parsed.growth, fromStages: true }
  }
  return { growth: GROWTH_FALLBACK, fromStages: false }
}

// ---------------------------------------------------------------------------
// Sourced series
// ---------------------------------------------------------------------------
interface EarlyRow { hpf: number; stage: string; cells: number | null; capA: number | null; capH: number | null; shell: number | null; f: number; ry: number; dome: number }
const EARLY: EarlyRow[] = [
  { hpf: 0, stage: '1-cell', cells: 1, capA: 0.30, capH: 0.20, shell: null, f: 0, ry: 0.35, dome: 0 },
  { hpf: 0.75, stage: '2-cell', cells: 2, capA: 0.29, capH: 0.21, shell: null, f: 0, ry: 0.35, dome: 0 },
  { hpf: 2.25, stage: '128-cell', cells: 128, capA: 0.26, capH: 0.27, shell: null, f: 0, ry: 0.35, dome: 0 },
  { hpf: 3.33, stage: 'high', cells: 2048, capA: 0.25, capH: 0.30, shell: null, f: 0, ry: 0.35, dome: 0 },
  { hpf: 4.33, stage: 'dome', cells: 4096, capA: 0.33, capH: 0.10, shell: 0.10, f: 0.20, ry: 0.35, dome: 0.05 },
  { hpf: 5.25, stage: '50%-epiboly', cells: null, capA: null, capH: null, shell: 0.055, f: 0.50, ry: 0.34, dome: 0 },
  { hpf: 6, stage: 'shield', cells: null, capA: null, capH: null, shell: 0.05, f: 0.50, ry: 0.33, dome: 0 },
  { hpf: 8, stage: '75%-epiboly', cells: null, capA: null, capH: null, shell: 0.045, f: 0.75, ry: 0.33, dome: 0 },
  { hpf: 9, stage: '90%-epiboly', cells: null, capA: null, capH: null, shell: 0.04, f: 0.90, ry: 0.325, dome: 0 },
]

interface WrapRow { hpf: number; stage: string; ry: number; c: number; wrapDeg: number; tailDeg: number; lengthMm: number | null; shell: number | null }
// BG-14 with the D8 revision: the free tail of 18 and 19 hpf curls around the
// yolk so that the whole embryo stays inside the 0.60 mm chorion.
const WRAP: WrapRow[] = [
  { hpf: 10, stage: 'bud', ry: 0.325, c: 1, wrapDeg: 180, tailDeg: 0, lengthMm: null, shell: 0.035 },
  { hpf: 12, stage: '5-9 somites', ry: 0.31, c: 1, wrapDeg: 204, tailDeg: 0, lengthMm: null, shell: null },
  { hpf: 14, stage: '10-13 somites', ry: 0.30, c: 1, wrapDeg: 225, tailDeg: 0, lengthMm: null, shell: null },
  { hpf: 16, stage: '14-19 somites', ry: 0.30, c: 1, wrapDeg: 240, tailDeg: 0, lengthMm: null, shell: null },
  { hpf: 18, stage: '14-19 somites', ry: 0.295, c: 0.7, wrapDeg: 0, tailDeg: 70, lengthMm: 1.66, shell: null },
  { hpf: 19, stage: '20-25 somites', ry: 0.29, c: 0.5, wrapDeg: 0, tailDeg: 125, lengthMm: 1.80, shell: null },
]

interface PostureRow { hpf: number; stage: string; lengthMm: number; hta: number; curlDeg: number | null; uniform: boolean; tailDeg: number }
// BG-16/BG-17 with the D8 revision. To 24 hpf the whole body from the snout
// base is one uniform planar curl of `curlDeg` around the yolk (the chorion
// posture; the HTA value is the sourced Kimmel reading, not a construction
// input). At 30 hpf the Kimmel head bend applies and trunk plus tail curl by
// `curlDeg`. From 36 hpf the Kimmel posture applies (`tailDeg`).
const POSTURE: PostureRow[] = [
  { hpf: 22, stage: '26+ somites', lengthMm: 1.95, hta: 125, curlDeg: 275, uniform: true, tailDeg: 0 },
  { hpf: 24, stage: 'prim-5', lengthMm: 2.05, hta: 120, curlDeg: 280, uniform: true, tailDeg: 0 },
  { hpf: 30, stage: 'prim-15', lengthMm: 2.45, hta: 95, curlDeg: 250, uniform: false, tailDeg: 0 },
  { hpf: 36, stage: 'prim-25', lengthMm: 2.65, hta: 75, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 42, stage: 'high-pec', lengthMm: 2.80, hta: 55, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 48, stage: 'long-pec', lengthMm: 2.90, hta: 45, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 60, stage: 'pec-fin', lengthMm: 3.10, hta: 35, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 72, stage: 'protruding-mouth', lengthMm: 3.25, hta: 25, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 96, stage: 'day 4', lengthMm: 3.40, hta: 22, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 120, stage: 'day 5', lengthMm: 3.60, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 168, stage: 'day 7', lengthMm: 4.10, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 336, stage: 'day 14', lengthMm: 5.30, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 504, stage: 'day 21', lengthMm: 6.50, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 720, stage: 'day 30', lengthMm: 8.20, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 1080, stage: 'day 45', lengthMm: 12.0, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 2160, stage: 'day 90', lengthMm: 18.0, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
  { hpf: 4320, stage: 'day 180', lengthMm: 25.0, hta: 20, curlDeg: null, uniform: false, tailDeg: 0 },
]

// Yolk series (BG-18, section 4.3.5): ball radius R, extension ratio k, radii.
interface YolkRow { hpf: number; r: number; k: number | null; r0: number; r1: number }
const YOLK: YolkRow[] = [
  { hpf: 10, r: 0.325, k: null, r0: 0, r1: 0 }, { hpf: 12, r: 0.31, k: null, r0: 0, r1: 0 },
  { hpf: 14, r: 0.300, k: null, r0: 0, r1: 0 }, { hpf: 16, r: 0.300, k: 0.42, r0: 0.110, r1: 0.080 },
  { hpf: 18, r: 0.295, k: 0.51, r0: 0.110, r1: 0.078 }, { hpf: 19, r: 0.290, k: 0.60, r0: 0.110, r1: 0.077 },
  { hpf: 22, r: 0.280, k: 0.90, r0: 0.110, r1: 0.073 }, { hpf: 24, r: 0.275, k: 1.00, r0: 0.100, r1: 0.071 },
  { hpf: 30, r: 0.260, k: 1.10, r0: 0.090, r1: 0.064 }, { hpf: 36, r: 0.240, k: 1.35, r0: 0.080, r1: 0.057 },
  { hpf: 42, r: 0.230, k: 1.50, r0: 0.070, r1: 0.050 }, { hpf: 48, r: 0.220, k: 1.48, r0: 0.070, r1: 0.020 },
  { hpf: 60, r: 0.200, k: 1.30, r0: 0.050, r1: 0.015 }, { hpf: 72, r: 0.175, k: 1.14, r0: 0.040, r1: 0.010 },
  // Review R01: the Day 4 remnant is a low bulge (Kimmel: "yolk extension nearly empty") and the
  // Day 5 remnant sits inside the belly; the radii shrink from 0.15 and 0.125 to 0.10 and 0.06.
  { hpf: 96, r: 0.100, k: 1.17, r0: 0.025, r1: 0.010 }, { hpf: 120, r: 0.060, k: 0.6, r0: 0, r1: 0 },
  { hpf: 168, r: 0, k: null, r0: 0, r1: 0 },
]
// Vent position (BG-18, section 4.3.5). To 48 hpf the vent is the extension
// end; the coiled keyframes (22, 24 hpf) carry the sourced vent instead and
// derive the ball station from it, because the ball sits at the coil centre.
const VENT_U: [number, number][] = [[22, 0.77], [24, 0.76], [60, 0.60], [72, 0.61], [96, 0.61], [120, 0.62], [168, 0.62], [336, 0.61], [504, 0.60]]

// Profiles (section 4.3.4) for the wrapped axis, hD/hV/hW per station.
type Prof9 = [number, number, number][]
const P_EARLY: Prof9 = [[0.03, 0.03, 0.03], [0.08, 0.03, 0.10], [0.06, 0.03, 0.11], [0.05, 0.03, 0.12], [0.05, 0.03, 0.12], [0.05, 0.03, 0.12], [0.05, 0.03, 0.12], [0.04, 0.03, 0.10], [0.05, 0.05, 0.05]]
const P_WRAP: Record<number, Prof9> = {
  12: [[0.03, 0.03, 0.03], [0.11, 0.04, 0.12], [0.08, 0.04, 0.12], [0.07, 0.04, 0.11], [0.07, 0.04, 0.11], [0.07, 0.04, 0.11], [0.07, 0.04, 0.11], [0.06, 0.03, 0.10], [0.05, 0.05, 0.05]],
  14: [[0.03, 0.03, 0.03], [0.14, 0.06, 0.14], [0.10, 0.05, 0.12], [0.08, 0.05, 0.11], [0.08, 0.05, 0.11], [0.08, 0.05, 0.11], [0.08, 0.05, 0.11], [0.07, 0.04, 0.09], [0.05, 0.05, 0.05]],
  16: [[0.03, 0.03, 0.03], [0.16, 0.08, 0.16], [0.12, 0.07, 0.12], [0.10, 0.06, 0.10], [0.10, 0.06, 0.10], [0.10, 0.06, 0.10], [0.10, 0.06, 0.10], [0.09, 0.05, 0.09], [0.05, 0.05, 0.05]],
  18: [[0.03, 0.03, 0.03], [0.17, 0.09, 0.17], [0.14, 0.08, 0.13], [0.11, 0.07, 0.10], [0.11, 0.07, 0.10], [0.11, 0.07, 0.10], [0.11, 0.07, 0.10], [0.10, 0.06, 0.09], [0.05, 0.05, 0.05]],
  19: [[0.03, 0.03, 0.03], [0.18, 0.10, 0.18], [0.14, 0.08, 0.13], [0.12, 0.07, 0.10], [0.12, 0.07, 0.10], [0.12, 0.07, 0.10], [0.12, 0.07, 0.10], [0.10, 0.06, 0.09], [0.05, 0.05, 0.05]],
}

// Outline templates of research 05 section 16.4 at ap 0, 0.1, ..., 1.0,
// keyed by axis length (SL from 72 hpf). BG-20 scales and blends them.
interface Template { lengthMm: number; rows: [number, number, number][]; deepenPosterior: number }
const TEMPLATES: Template[] = [
  { lengthMm: 2.05, deepenPosterior: 1, rows: [[0.05, 0.05, 0.05], [0.18, 0.16, 0.18], [0.20, 0.15, 0.17], [0.14, 0.10, 0.10], [0.12, 0.09, 0.08], [0.11, 0.08, 0.07], [0.10, 0.08, 0.06], [0.09, 0.07, 0.05], [0.08, 0.06, 0.04], [0.06, 0.05, 0.03], [0.02, 0.02, 0.01]] },
  { lengthMm: 2.90, deepenPosterior: 1, rows: [[0.06, 0.06, 0.06], [0.22, 0.20, 0.22], [0.24, 0.18, 0.20], [0.16, 0.12, 0.11], [0.14, 0.11, 0.09], [0.13, 0.10, 0.08], [0.12, 0.10, 0.07], [0.11, 0.09, 0.06], [0.09, 0.08, 0.05], [0.07, 0.06, 0.03], [0.02, 0.02, 0.01]] },
  { lengthMm: 3.25, deepenPosterior: 1, rows: [[0.08, 0.08, 0.07], [0.24, 0.22, 0.24], [0.26, 0.20, 0.21], [0.17, 0.14, 0.12], [0.15, 0.13, 0.10], [0.14, 0.11, 0.09], [0.13, 0.10, 0.07], [0.12, 0.09, 0.06], [0.10, 0.08, 0.05], [0.07, 0.06, 0.03], [0.02, 0.02, 0.01]] },
  { lengthMm: 3.60, deepenPosterior: 1, rows: [[0.10, 0.10, 0.08], [0.26, 0.24, 0.26], [0.28, 0.22, 0.22], [0.19, 0.16, 0.13], [0.17, 0.15, 0.12], [0.16, 0.13, 0.10], [0.15, 0.11, 0.08], [0.13, 0.10, 0.07], [0.11, 0.08, 0.05], [0.08, 0.06, 0.03], [0.02, 0.02, 0.01]] },
  // Row 0 of every template is replaced by SNOUT_TIP times row 1 in templateProfile: a convex wedge to a
  // tip that sits above the mid-line (phase 1 review R13 set 0.45 of row 1; the research 05 tip values
  // were 0.15, 0.25 and 0.6 for the three larger templates).
  { lengthMm: 6.20, deepenPosterior: 1, rows: [[0.20, 0.18, 0.18], [0.45, 0.40, 0.40], [0.50, 0.42, 0.38], [0.42, 0.40, 0.30], [0.38, 0.36, 0.26], [0.34, 0.30, 0.22], [0.30, 0.21, 0.18], [0.25, 0.17, 0.14], [0.20, 0.14, 0.10], [0.15, 0.11, 0.06], [0.05, 0.05, 0.02]] },
  { lengthMm: 10.0, deepenPosterior: 1.15, rows: [[0.36, 0.34, 0.29], [0.80, 0.75, 0.65], [0.95, 0.85, 0.65], [0.95, 0.90, 0.60], [0.90, 0.85, 0.55], [0.85, 0.72, 0.48], [0.75, 0.55, 0.40], [0.60, 0.42, 0.30], [0.45, 0.35, 0.22], [0.35, 0.30, 0.14], [0.10, 0.10, 0.05]] },
  { lengthMm: 28.0, deepenPosterior: 1.15, rows: [[1.08, 0.99, 0.72], [2.4, 2.2, 1.6], [3.0, 2.8, 1.8], [3.3, 3.2, 1.8], [3.3, 3.1, 1.7], [3.1, 2.6, 1.5], [2.6, 2.0, 1.2], [2.0, 1.6, 0.9], [1.5, 1.3, 0.7], [1.2, 1.1, 0.5], [0.4, 0.4, 0.2]] },
]

// ---------------------------------------------------------------------------
// Pose construction. A pose is a dense sampling of the spine over u in [0, 1].
// ---------------------------------------------------------------------------
interface Pose { xy: [number, number][]; yolkCentre: [number, number] | null }
const fineU = (i: number): number => i / FINE

/** Integrate a heading that turns clockwise (ventrally) by `turnDeg` over each piece. */
function integrateHeading(pieces: [number, number, number][], lengthMm: number): [number, number][] {
  const xy: [number, number][] = [[0, 0]]
  let psi = 0
  const du = 1 / FINE
  for (let i = 1; i <= FINE; i++) {
    const um = (i - 0.5) * du
    let rate = 0
    for (const [u0, u1, turn] of pieces) if (um >= u0 && um < u1) rate = -degToRad(turn) / (u1 - u0)
    psi += rate * du
    const prev = xy[i - 1]!
    xy.push([prev[0] + Math.cos(psi) * lengthMm * du, prev[1] + Math.sin(psi) * lengthMm * du])
  }
  return xy
}

/** Rotate and translate so that the point at SEED_U is the origin and its tangent is +x. */
function alignToBodyFrame(xy: [number, number][]): [number, number][] {
  const k = Math.round(SEED_U * FINE)
  const a = xy[k - 1]!
  const b = xy[k + 1]!
  const ang = -Math.atan2(b[1] - a[1], b[0] - a[0])
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  const o = xy[k]!
  return xy.map(([x, y]) => [(x - o[0]) * c - (y - o[1]) * s, (x - o[0]) * s + (y - o[1]) * c])
}

/** BG-16 head and snout pieces plus a curl (D8 revised) or the Kimmel tail. */
function posturePose(row: PostureRow): Pose {
  const beta = Math.max(0, row.hta - 20)
  const pieces: [number, number, number][] = []
  if (row.curlDeg !== null && row.uniform) pieces.push([0.06, 1.0, row.curlDeg])
  else if (row.curlDeg !== null) pieces.push([0.06, 0.32, beta], [0.32, 1.0, row.curlDeg])
  else pieces.push([0.06, 0.32, beta], [0.7, 1.0, row.tailDeg])
  return { xy: alignToBodyFrame(integrateHeading(pieces, row.lengthMm)), yolkCentre: null }
}

/** BG-12: presumptive axis, an arc on the dorsal meridian in the yolk frame. */
function presumptivePose(radius: number, extentDeg: number): Pose {
  const th = degToRad(extentDeg)
  const xy: [number, number][] = []
  for (let i = 0; i <= FINE; i++) xy.push([radius * Math.sin(fineU(i) * th), radius * Math.cos(fineU(i) * th)])
  return { xy, yolkCentre: [0, 0] }
}

/** BG-14 and BG-22: the wrapped axis in the yolk frame, then the partial rigid motion. */
function wrappedPose(row: WrapRow, hVtrunk: number): { pose: Pose; lengthMm: number; wrapDeg: number } {
  const rs = row.ry + hVtrunk - 0.03
  const lengthMm = row.lengthMm ?? degToRad(row.wrapDeg) * rs
  const omega = (row.c * lengthMm) / rs
  const freeLen = (1 - row.c) * lengthMm
  const tailTurn = degToRad(row.tailDeg)
  const xy: [number, number][] = []
  for (let i = 0; i <= FINE; i++) {
    const s = fineU(i) * lengthMm
    if (s <= row.c * lengthMm + 1e-12) {
      const phi = s / rs
      xy.push([rs * Math.sin(phi), rs * Math.cos(phi)])
    } else {
      const sigma = s - row.c * lengthMm
      const start: [number, number] = [rs * Math.sin(omega), rs * Math.cos(omega)]
      const heading0 = -omega
      if (tailTurn < 1e-9) {
        xy.push([start[0] + Math.cos(heading0) * sigma, start[1] + Math.sin(heading0) * sigma])
      } else {
        const rc = freeLen / tailTurn
        const turned = (tailTurn * sigma) / freeLen
        // Clockwise arc: centre on the right-hand side of the heading.
        const cx = start[0] + Math.sin(heading0) * rc
        const cy = start[1] - Math.cos(heading0) * rc
        const a0 = Math.atan2(start[1] - cy, start[0] - cx)
        xy.push([cx + rc * Math.cos(a0 - turned), cy + rc * Math.sin(a0 - turned)])
      }
    }
  }
  // Partial rigid motion toward the body-fixed frame (BG-22).
  const blend = smoothstep((row.hpf - 10) / 12)
  const k = Math.round(SEED_U * FINE)
  const phi04 = Math.min(fineU(k) * lengthMm, row.c * lengthMm) / rs
  const ang = blend * phi04
  const c = Math.cos(ang)
  const sn = Math.sin(ang)
  const rot = (p: [number, number]): [number, number] => [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]
  const seed = rot(xy[k]!)
  const shift: [number, number] = [-blend * seed[0], -blend * seed[1]]
  const moved = xy.map((p) => { const r = rot(p); return [r[0] + shift[0], r[1] + shift[1]] as [number, number] })
  return { pose: { xy: moved, yolkCentre: [shift[0], shift[1]] }, lengthMm, wrapDeg: (omega * 180) / Math.PI }
}

function poseAt(pose: Pose, u: number): { p: [number, number]; t: [number, number]; n: [number, number] } {
  const x = Math.min(FINE, Math.max(0, u * FINE))
  const i = Math.min(FINE - 1, Math.floor(x))
  const f = x - i
  const a = pose.xy[i]!
  const b = pose.xy[i + 1]!
  const tx = b[0] - a[0]
  const ty = b[1] - a[1]
  const tl = Math.hypot(tx, ty) || 1
  const t: [number, number] = [tx / tl, ty / tl]
  // Dorsal normal: the left-hand normal of a heading that turns clockwise ventrally.
  return { p: [lerp(a[0], b[0], f), lerp(a[1], b[1], f)], t, n: [-t[1], t[0]] }
}

const controlPoints = (pose: Pose): [number, number, number][] => {
  const out: [number, number, number][] = []
  for (let i = 0; i < CONTROL_POINT_COUNT; i++) {
    const u = i / (CONTROL_POINT_COUNT - 1)
    const { p } = poseAt(pose, u)
    out.push([round4(u), round4(p[0]), round4(p[1])])
  }
  return out
}
const round4 = (x: number): number => Math.round(x * 1e4) / 1e4 + 0
const round3 = (x: number): number => Math.round(x * 1e3) / 1e3 + 0

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
const toStations = (rows: Prof9): ProfileStation[] => rows.map((r, i) => ({ u: PROFILE_U[i]!, hD: r[0], hV: r[1], hW: r[2], exponent: 2 }))

function haa(sl: number): number { return sl > 18 ? (3.82 * sl) / 18 : (sl - 4.4) / 3.56 }

/** BG-20: bracket the templates by length, scale by the power laws, blend, set the snout tip, then fit HAA. */
function templateProfile(lengthMm: number): ProfileStation[] {
  const scaled = (tpl: Template): [number, number, number][] => tpl.rows.map((r, i) => {
    const deep = i >= 5 ? tpl.deepenPosterior : 1
    const k = lengthMm / tpl.lengthMm
    return [r[0] * Math.pow(k, 0.9) * deep, r[1] * Math.pow(k, 0.9) * deep, r[2] * Math.pow(k, 0.8)]
  })
  let rows: [number, number, number][]
  if (lengthMm <= TEMPLATES[0]!.lengthMm) rows = scaled(TEMPLATES[0]!)
  else if (lengthMm >= TEMPLATES[TEMPLATES.length - 1]!.lengthMm) rows = scaled(TEMPLATES[TEMPLATES.length - 1]!)
  else {
    let j = 0
    while (TEMPLATES[j + 1]!.lengthMm < lengthMm) j++
    const a = TEMPLATES[j]!
    const b = TEMPLATES[j + 1]!
    const s = (lengthMm - a.lengthMm) / (b.lengthMm - a.lengthMm)
    const ra = scaled(a)
    const rb = scaled(b)
    rows = ra.map((r, i) => [lerp(r[0], rb[i]![0], s), lerp(r[1], rb[i]![1], s), lerp(r[2], rb[i]![2], s)])
  }
  const r1 = rows[1]!
  rows[0] = [SNOUT_TIP.hD * r1[0], SNOUT_TIP.hV * r1[1], SNOUT_TIP.hW * r1[2]]
  if (lengthMm >= 6) {
    const gFit = haa(lengthMm) / (rows[6]![0] + rows[6]![1])
    rows = rows.map((r) => [r[0] * gFit, r[1] * gFit, r[2]])
  }
  const xs = rows.map((_, i) => i / 10)
  const pick = (c: 0 | 1 | 2): number[] => monotoneCubic(xs, rows.map((r) => r[c]), [...PROFILE_U])
  const hD = pick(0)
  const hV = pick(1)
  const hW = pick(2)
  return PROFILE_U.map((u, i) => ({ u, hD: round4(hD[i]!), hV: round4(hV[i]!), hW: round4(hW[i]!), exponent: 2 }))
}

const profileValue = (profile: ProfileStation[], key: 'hD' | 'hV' | 'hW', u: number): number =>
  monotoneCubic(profile.map((p) => p.u), profile.map((p) => p[key]), [u])[0]!

/**
 * BG-18 with the phase 1 review R3: the ventral profile envelops the yolk. Over the ball's
 * u span the skin reaches the ball's equator line of the hanging rule (`beltLine`, the phase 1
 * value, so no anatomy record placed against phase 1 moves out of the skin); over the
 * extension it reaches the extension axis line hV + r(u); both plus the margin. Each station
 * takes the deepest line in its half-cell, so the 9-station cubic never cuts through the yolk
 * between stations. The ball's lower half is wrapped at runtime by the body model
 * (wrapStationsAroundBall), because the 128 stations can follow its circle and the 9-station
 * cubic cannot. The ball envelope applies to the straightened postures only: in the coiled
 * postures the ball fills the coil and the trunk's ventral side already faces it.
 */
function envelopeProfile(
  profile: ProfileStation[],
  lengthMm: number,
  ball: BodyKeyframe['yolkBall'],
  beltLine: number,
  ext: BodyKeyframe['yolkExtension'],
): ProfileStation[] {
  const lineAt = (u: number): number => {
    let d = -Infinity
    if (ball && Math.abs(u - ball.u) * lengthMm <= ball.radiusMm) d = Math.max(d, beltLine)
    if (ext && u >= ext.u0 && u <= ext.u1) {
      const s = (u - ext.u0) / Math.max(1e-9, ext.u1 - ext.u0)
      d = Math.max(d, profileValue(profile, 'hV', u) + lerp(ext.r0Mm, ext.r1Mm, s))
    }
    return d
  }
  return profile.map((p, i) => {
    const lo = i > 0 ? (profile[i - 1]!.u + p.u) / 2 : p.u
    const hi = i < profile.length - 1 ? (p.u + profile[i + 1]!.u) / 2 : p.u
    let line = -Infinity
    for (let u = lo; u <= hi + 1e-9; u += 0.005) line = Math.max(line, lineAt(Math.min(1, u)))
    if (line === -Infinity) return p
    return { ...p, hV: round4(Math.max(p.hV, line + YOLK_ENVELOPE_MARGIN_MM)) }
  })
}

/** BG-11 cap with the top held above the yolk apex (R1): height at least Ry - baseY + clearance. */
function capOf(row: EarlyRow): BodyKeyframe['cap'] {
  if (row.capA === null || row.capH === null) return null
  const a = Math.min(row.capA, row.ry)
  const baseY = Math.sqrt(Math.max(0, row.ry * row.ry - a * a))
  return { baseRadiusMm: row.capA, heightMm: round4(Math.max(row.capH, row.ry - baseY + CAP_CLEARANCE_MM)) }
}

// ---------------------------------------------------------------------------
// Yolk placement (BG-18)
// ---------------------------------------------------------------------------
function yolkRow(hpf: number): YolkRow | null {
  return YOLK.find((r) => r.hpf === hpf) ?? null
}

/** BG-18 hanging depth: the ball's top 0.03 mm inside the template skin. Also the belt line of the profile envelope. */
function hangingDepth(profile: ProfileStation[], u: number, radius: number): number {
  return profileValue(profile, 'hV', u) + radius - 0.03
}

/**
 * Ball depth below the spine: hanging to 60 hpf, in the gut region from 72 hpf (GUT_TOP_FRACTION),
 * and from REMNANT_INSIDE_HPF resting on the template belly from inside when it fits (R01).
 */
function ballDepth(profile: ProfileStation[], u: number, radius: number, hpf: number): number {
  if (hpf < 72) return hangingDepth(profile, u, radius)
  const hV = profileValue(profile, 'hV', u)
  const gutTop = GUT_TOP_FRACTION * hV + radius
  if (hpf < REMNANT_INSIDE_HPF) return gutTop
  const inside = hV - radius - REMNANT_SKIN_CLEARANCE_MM
  return Math.min(gutTop, Math.max(inside, radius + REMNANT_SPINE_CLEARANCE_MM))
}

/** Clearance rule (BG-18): the first u >= 0.30 whose hanging ball clears every head station. */
function ballU(pose: Pose, profile: ProfileStation[], radius: number): number {
  for (let u = 0.3; u <= 0.7; u += 0.005) {
    const st = poseAt(pose, u)
    const depth = hangingDepth(profile, u, radius)
    const cx = st.p[0] - st.n[0] * depth
    const cy = st.p[1] - st.n[1] * depth
    let ok = true
    for (let uh = 0; uh < 0.32; uh += 0.01) {
      const h = poseAt(pose, uh)
      const need = radius + 0.6 * profileValue(profile, 'hV', uh)
      if (Math.hypot(h.p[0] - cx, h.p[1] - cy) < need) { ok = false; break }
    }
    if (ok) return round3(u)
  }
  return 0.7
}

// ---------------------------------------------------------------------------
// Keyframe assembly
// ---------------------------------------------------------------------------
const SOURCES_EARLY = ['research 05 sections 2, 3 and 16.2 (estimates)', 'spec BG-11 to BG-13']
const SOURCES_WRAP = ['research 05 sections 4, 7, 15 and 16.3 (estimates)', 'spec BG-14, BG-15, BG-22', 'D8 revised: 0.60 mm enclosure to 30 hpf']
const SOURCES_POSTURE = ['research 05 sections 5, 7, 8, 15, 16.4 to 16.6', 'spec BG-16 to BG-21', 'D8 head-trunk angle series and 0.60 mm enclosure to 30 hpf']

function base(hpf: number, stage: string, growth: GrowthPoint[]): Pick<BodyKeyframe, 'hpf' | 'stage' | 'regime' | 'bodyLengthMm' | 'slMm' | 'somiteCount' | 'cellCount' | 'yolkDomeMm' | 'estimate'> {
  return {
    hpf, stage, regime: regimeAt(hpf), bodyLengthMm: bodyLengthAtFrom(growth, hpf), slMm: slAtFrom(growth, hpf),
    somiteCount: somiteCountAt(hpf), cellCount: cellCountAt(hpf), yolkDomeMm: 0, estimate: [],
  }
}

function earlyKeyframe(row: EarlyRow, growth: GrowthPoint[]): BodyKeyframe {
  const half = (row.capH ?? row.shell ?? 0) / 2
  const radius = row.ry + half
  const thetaM = row.f > 0 ? Math.acos(1 - 2 * row.f) : 0
  const thetaCap = row.capA !== null ? Math.asin(Math.min(1, row.capA / row.ry)) : 0
  const extentDeg = Math.max((thetaM * 180) / Math.PI, (thetaCap * 180) / Math.PI, 30)
  const pose = presumptivePose(radius, extentDeg)
  return {
    ...base(row.hpf, row.stage, growth),
    axisLengthMm: null, headTrunkAngleDeg: null, notochordFlexionDeg: 0, ventU: 0.77, epibolyFraction: row.f,
    cap: capOf(row),
    shellThicknessMm: row.shell, yolkRadiusMm: row.ry, yolkDomeMm: row.dome,
    yolkBall: { u: SEED_U, depthMm: round4(radius), radiusMm: row.ry },
    yolkExtension: null,
    chorion: { centre: [0, 0, 0], radiusMm: CHORION_RADIUS_MM },
    spine: controlPoints(pose),
    profile: toStations(P_EARLY),
    estimate: ['cap', 'shellThicknessMm', 'yolkRadiusMm', 'profile', 'chorion'],
    sources: SOURCES_EARLY,
  }
}

function wrapKeyframe(row: WrapRow, growth: GrowthPoint[]): BodyKeyframe {
  const profile = toStations(row.hpf === 10 ? P_EARLY : P_WRAP[row.hpf]!)
  const { pose, lengthMm } = wrappedPose(row, profile[4]!.hV)
  const y = yolkRow(row.hpf)!
  const rs = row.ry + profile[4]!.hV - 0.03
  let ext: BodyKeyframe['yolkExtension'] = null
  if (y.k !== null) {
    const u0 = SEED_U + y.r / lengthMm
    ext = { u0: round3(u0), u1: round3(u0 + (y.k * 2 * y.r) / lengthMm), r0Mm: y.r0, r1Mm: y.r1 }
  }
  return {
    ...base(row.hpf, row.stage, growth),
    axisLengthMm: round3(lengthMm), headTrunkAngleDeg: null, notochordFlexionDeg: 0, ventU: 0.77, epibolyFraction: 1,
    cap: null, shellThicknessMm: row.shell, yolkRadiusMm: y.r,
    yolkBall: { u: SEED_U, depthMm: round4(rs), radiusMm: y.r },
    yolkExtension: ext,
    chorion: { centre: [0, 0, 0], radiusMm: CHORION_RADIUS_MM },
    spine: controlPoints(pose),
    profile: envelopeProfile(profile, lengthMm, null, 0, ext),
    estimate: ['axisLengthMm', 'yolkBall', 'yolkExtension', 'profile', 'chorion'],
    sources: SOURCES_WRAP,
  }
}

/**
 * Pericardial bulge (review R05): from 36 to 60 hpf the pericardial sac fills the ventral head
 * between the eye and the yolk (Kimmel 1995 Prim-25 to Pec-fin), so the ventral half-height at
 * u 0.1 (and the snout tip, to keep the SNOUT_TIP ratio) rises by up to PERICARDIUM_HV_GAIN;
 * the gain ramps in over 30 to 36 hpf (the 30 hpf curl and its chorion enclosure are untouched)
 * and out over 60 to 72 hpf.
 */
export const PERICARDIUM_HV_GAIN = 0.4
export function pericardiumGain(hpf: number): number {
  if (hpf <= 30 || hpf >= 72) return 0
  const w = hpf < 36 ? (hpf - 30) / 6 : hpf <= 60 ? 1 : (72 - hpf) / 12
  return PERICARDIUM_HV_GAIN * w
}

function pericardialProfile(profile: ProfileStation[], hpf: number): ProfileStation[] {
  const gain = pericardiumGain(hpf)
  if (gain <= 0) return profile
  // The snout tip scales with station 0.1 so the wedge ratio of SNOUT_TIP holds.
  return profile.map((p) => (p.u <= 0.1 + 1e-9 ? { ...p, hV: round4(p.hV * (1 + gain)) } : p))
}

function postureKeyframe(row: PostureRow, growth: GrowthPoint[]): BodyKeyframe {
  const pose = posturePose(row)
  const profile = pericardialProfile(templateProfile(row.lengthMm), row.hpf)
  const y = yolkRow(row.hpf)
  const sl = slAtFrom(growth, row.hpf)
  let ball: BodyKeyframe['yolkBall'] = null
  let ext: BodyKeyframe['yolkExtension'] = null
  let beltLine = 0
  let ventU = VENT_U.find(([h]) => h === row.hpf)?.[1] ?? null
  if (y) {
    let uc = y.r > 0 ? ballU(pose, profile, y.r) : 0.3
    let depth = ballDepth(profile, uc, y.r, row.hpf)
    // The belt line is the phase 1 hanging value to 72 hpf (records were placed against it); from
    // 96 hpf it is the remnant's own bottom, so the belly follows the smaller ball (R01).
    beltLine = row.hpf >= 96 ? depth + y.r : hangingDepth(profile, uc, y.r)
    if (row.uniform && row.curlDeg !== null && y.k !== null && ventU !== null) {
      // Coiled posture: the ball fills the coil, so its centre is the coil
      // centre and the ball station follows from the sourced vent.
      uc = round3(ventU - (y.r + y.k * 2 * y.r) / row.lengthMm)
      depth = Math.max(depth, (0.94 * row.lengthMm) / degToRad(row.curlDeg))
    }
    ball = { u: uc, depthMm: round4(depth), radiusMm: y.r }
    if (y.k !== null) {
      const u0 = uc + y.r / row.lengthMm
      const u1 = u0 + (y.k * 2 * y.r) / row.lengthMm
      ext = { u0: round3(u0), u1: round3(u1), r0Mm: y.r0, r1Mm: y.r1 }
      if (ventU === null) ventU = round3(u1)
    }
  }
  const flexion = sl === null ? 0 : Math.min(45, Math.max(0, ((sl - 4.5) / 2) * 45))
  return {
    ...base(row.hpf, row.stage, growth),
    axisLengthMm: row.lengthMm, headTrunkAngleDeg: row.hta, notochordFlexionDeg: round3(flexion),
    ventU: ventU ?? 0.6, epibolyFraction: 1, cap: null, shellThicknessMm: null,
    yolkRadiusMm: y ? y.r : null, yolkBall: ball, yolkExtension: ext,
    chorion: row.hpf <= CHORION_LAST_HPF ? { centre: [0, 0, 0], radiusMm: CHORION_RADIUS_MM } : null,
    spine: controlPoints(pose),
    profile: envelopeProfile(profile, row.lengthMm, row.curlDeg === null ? ball : null, beltLine, ext),
    estimate: ['profile', 'yolkBall', 'yolkExtension', 'chorion', row.curlDeg !== null ? 'spine (curl angle)' : 'spine (tail curl)'],
    sources: SOURCES_POSTURE,
  }
}

/** Points and radii of the skin, yolk ball and yolk extension of one frame. */
export function enclosureOf(frame: BodyFrame): { centre: Vec3; radius: number } {
  const pts: Vec3[] = []
  const radii: number[] = []
  for (const s of frame.stations) {
    pts.push(madd(s.p, s.n, s.hD), madd(s.p, s.n, -s.hV), madd(s.p, s.b, s.hW), madd(s.p, s.b, -s.hW))
    radii.push(0, 0, 0, 0)
  }
  if (frame.yolk?.ball) { pts.push(frame.yolk.ball.centre); radii.push(frame.yolk.ball.radiusMm) }
  const ext = frame.yolk?.extension
  if (ext) {
    for (let i = 0; i <= 16; i++) {
      const u = lerp(ext.u0, ext.u1, i / 16)
      const r = lerp(ext.r0Mm, ext.r1Mm, i / 16)
      const f = frame.frameAt(Math.min(1, u))
      pts.push(madd(f.p, f.n, -(f.hV - EXTENSION_AXIS_INSET_MM)))
      radii.push(r)
    }
  }
  return enclosingSphere(pts, radii)
}

/** Build the 32 keyframes; the chorion centre is the enclosing centre of each early frame. */
export function generateBodyFile(growth: GrowthPoint[]): BodyFile {
  const keyframes: BodyKeyframe[] = [
    ...EARLY.map((r) => earlyKeyframe(r, growth)),
    ...WRAP.map((r) => wrapKeyframe(r, growth)),
    ...POSTURE.map((r) => postureKeyframe(r, growth)),
  ]
  const vent22 = keyframes.find((k) => k.hpf === 22)!.ventU
  for (const k of keyframes) if (k.hpf < 22) k.ventU = vent22
  const model = createBodyModel({ generatedBy: 'scripts/gen-body.ts', keyframes }, growth)
  for (const k of keyframes) {
    if (!k.chorion || k.hpf <= 10) continue
    const { centre } = enclosureOf(model(k.hpf))
    k.chorion = { centre: [round4(centre[0]), round4(centre[1]), 0], radiusMm: CHORION_RADIUS_MM }
  }
  return { generatedBy: 'scripts/gen-body.ts', keyframes }
}

/** Largest enclosing radius over the keyframes at or before 30 hpf, for the D8 assertion. */
export function enclosureReport(file: BodyFile, growth: GrowthPoint[]): { hpf: number; radius: number }[] {
  const model = createBodyModel(file, growth)
  return file.keyframes.filter((k) => k.hpf <= CHORION_LAST_HPF).map((k) => ({ hpf: k.hpf, radius: enclosureOf(model(k.hpf)).radius }))
}

function main(): void {
  const check = process.argv.includes('--check')
  const { growth, fromStages } = loadGrowth()
  const file = generateBodyFile(growth)
  const report = enclosureReport(file, growth)
  const worst = report.reduce((m, r) => (r.radius > m.radius ? r : m), report[0]!)
  const text = JSON.stringify(file, null, 1) + '\n'
  console.log(`growth table: ${fromStages ? 'src/data/stages.json' : 'built-in fallback'}; keyframes: ${file.keyframes.length}`)
  for (const r of report) console.log(`  enclosure ${String(r.hpf).padStart(5)} hpf: ${r.radius.toFixed(3)} mm`)
  if (worst.radius > CHORION_RADIUS_MM + 1e-6) {
    console.error(`enclosure constraint failed at ${worst.hpf} hpf: ${worst.radius.toFixed(3)} mm > ${CHORION_RADIUS_MM}`)
    process.exit(1)
  }
  if (check) {
    const current = fs.existsSync(BODY_JSON_PATH) ? fs.readFileSync(BODY_JSON_PATH, 'utf8') : ''
    if (current !== text) { console.error('body.json differs from the generator output'); process.exit(1) }
    console.log('body.json matches the generator output')
    return
  }
  fs.mkdirSync(path.dirname(BODY_JSON_PATH), { recursive: true })
  fs.writeFileSync(BODY_JSON_PATH, text)
  console.log(`wrote ${path.relative(process.cwd(), BODY_JSON_PATH)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
