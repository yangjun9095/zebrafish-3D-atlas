// Helpers that walk geometry parameter objects: deep merge, body coordinate
// visits, and array-length collection. Shared by the keyframe rules.

export type Obj = Record<string, unknown>

export function isObj(x: unknown): x is Obj {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/** Static parameters of a geometry: every key except the bookkeeping fields. */
const NON_PARAM_KEYS = new Set([
  'kind', 'builder', 'keyframes', 'geometryEndHpf', 'handoffOut', 'lodHint',
  'boundsMarginMm', 'estimate', 'sources',
])

export function staticParams(geometry: Obj): Obj {
  const out: Obj = {}
  for (const [k, v] of Object.entries(geometry)) if (!NON_PARAM_KEYS.has(k)) out[k] = v
  return out
}

export function keyframeParams(keyframe: Obj): Obj {
  const out: Obj = {}
  for (const [k, v] of Object.entries(keyframe)) if (k !== 'hpf' && k !== 'sizeRefSl') out[k] = v
  return out
}

/** Merges `patch` into `base` per leaf; an array replaces the whole array (BG-41). */
export function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isObj(base) || !isObj(patch)) return patch === undefined ? base : patch
  const out: Obj = { ...base }
  for (const [k, v] of Object.entries(patch)) out[k] = k in out ? deepMerge(out[k], v) : v
  return out
}

export type CoordVisit = { path: string; key: 'u' | 'v' | 'w' | 'uStart' | 'uEnd'; value: number }

/** Visits every body coordinate leaf (E012) and every `uStart <= uEnd` pair. */
export function visitCoords(
  value: unknown,
  path: string,
  onLeaf: (visit: CoordVisit) => void,
  onRange: (path: string, uStart: number, uEnd: number) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => visitCoords(item, `${path}[${i}]`, onLeaf, onRange))
    return
  }
  if (!isObj(value)) return
  for (const key of ['u', 'v', 'w', 'uStart', 'uEnd'] as const) {
    const n = value[key]
    if (typeof n === 'number') onLeaf({ path: path ? `${path}.${key}` : key, key, value: n })
  }
  if (typeof value.uStart === 'number' && typeof value.uEnd === 'number') {
    onRange(path, value.uStart, value.uEnd)
  }
  for (const [k, v] of Object.entries(value)) {
    if (isObj(v) || Array.isArray(v)) visitCoords(v, path ? `${path}.${k}` : k, onLeaf, onRange)
  }
}

const ARRAY_PARAM_KEYS = new Set(['outlineMm', 'profileMm', 'points', 'radiiMm'])

/** Collects `path -> length` for every array parameter that E035 compares. */
export function arrayLengths(value: unknown, path = '', out = new Map<string, number>()): Map<string, number> {
  if (!isObj(value)) return out
  for (const [k, v] of Object.entries(value)) {
    const p = path ? `${path}.${k}` : k
    if (Array.isArray(v)) {
      if (ARRAY_PARAM_KEYS.has(k) || p.startsWith('segments')) out.set(p, v.length)
    } else if (isObj(v)) {
      arrayLengths(v, p, out)
    }
  }
  return out
}

/** Required top-level parameters per geometry kind (spec 3.2.3, E030). */
export const REQUIRED_PARAMS: Record<string, string[]> = {
  ellipsoid: ['placement', 'radiiMm'],
  superellipsoid: ['placement', 'radiiMm', 'e1', 'e2'],
  tube: ['path', 'radiusMm'],
  lathe: ['placement', 'profileMm'],
  sheet: ['base', 'outlineMm', 'thicknessBaseMm', 'thicknessEdgeMm'],
  shell: ['centre', 'innerRadiusMm', 'thicknessMm', 'polarDeg'],
  segmentArray: ['template', 'uStart', 'uEnd', 'count'],
  bodyDriven: ['part'],
  derived: ['sourceId', 'part'],
}

/** Custom builders whose static block carries a placement (spec 3.2.3). */
export const PLACED_BUILDERS = new Set(['heartLoop', 'eyeCup', 'earVesicle', 'primordiumMover'])
