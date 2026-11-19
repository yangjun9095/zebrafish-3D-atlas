// Keyframe, geometry parameter and size-row rules for structures.json:
// E010 to E012, E019, E020, E030, E035, W001, W002, W004 to W009 (spec 3.8).

import { segmentIndex } from './growth.ts'
import type { Report } from './report.ts'
import { num } from './report.ts'
import type { StructureRecord, TimeAxis } from './types.ts'
import {
  PLACED_BUILDERS, REQUIRED_PARAMS, arrayLengths, deepMerge, isObj, keyframeParams, staticParams, visitCoords,
} from './walk.ts'
import type { Obj } from './walk.ts'

/** The 76 `dims_um` keys of the five anatomy drafts (spec 3.5.1), before camel-casing. */
const DRAFT_SIZE_KEYS = [
  'anteriorDiameter', 'anterior_length', 'arcDeg', 'arc_height', 'arch_height', 'arch_length', 'arch_width',
  'arches_per_side', 'asteriscusLength', 'atrial_diameter', 'ballDiameter', 'ballHeight', 'cellDiameter',
  'cell_diameter', 'cells', 'channel_diameter', 'chevronDeg', 'cilia', 'ciliumLength', 'cluster_length', 'count',
  'count_per_arch', 'count_per_side', 'coverageFraction', 'depth', 'diameter', 'duct_diameter',
  'extensionDiameter', 'extensionLength', 'filament_length', 'filaments', 'filaments_per_arch', 'grooveDepth',
  'hairCells', 'headTrunkAngleDeg', 'height', 'heightBase', 'heightCaudal', 'heightDorsal', 'heightMax',
  'heightTip', 'heightVentral', 'lapillusLength', 'leaflet_length', 'length', 'lengthTail', 'lines',
  'loopDiameter', 'lumen', 'neuromastCount', 'outerDiameter', 'posteriorDiameter', 'posterior_length',
  'projectionLength', 'region_length', 'ringDiameter', 'ringNuclei', 'ring_diameter', 'sagittaLength',
  'segmentLength', 'spacing', 'spacing_um', 'standardLength', 'thickness', 'thickness_max', 'thickness_min',
  'tiers', 'total_length', 'trunkHeight', 'trunkWidth', 'tubeDiameter', 'ventricular_diameter', 'volume_um3',
  'wall', 'wallThickness', 'width',
]

const camel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())

/** Size keys that W008 accepts: the draft keys camel-cased, plus the volume conversion. */
export const SIZE_KEY_ALLOWLIST = new Set([
  ...DRAFT_SIZE_KEYS.map(camel), ...DRAFT_SIZE_KEYS.map((k) => camel(k).replace(/Um$/, '')), 'volumeMm3',
])

export function checkKeyframes(
  records: Map<string, StructureRecord>,
  axis: TimeAxis,
  seeded: Set<string>,
  report: Report,
): void {
  for (const r of records.values()) {
    checkSizes(r, report)
    if (!r.geometry) continue
    const g = r.geometry as Obj & { keyframes: Obj[] }
    const kfs = g.keyframes ?? []
    const file = 'structures'

    for (let i = 0; i < kfs.length; i++) {
      const hpf = kfs[i].hpf as number
      if (i > 0 && hpf <= (kfs[i - 1].hpf as number)) report.error('E010', file, r.id, `keyframe ${i} at ${num(hpf)} hpf is not after keyframe ${i - 1}`)
      if (hpf < r.visibleFromHpf - 1e-9 || hpf > r.modelEndHpf + 1e-9) {
        report.error('E011', file, r.id, `keyframe at ${num(hpf)} hpf lies outside [${num(r.visibleFromHpf)}, ${num(r.modelEndHpf)}]`)
      }
      const hasRef = typeof kfs[i].sizeRefSl === 'number'
      if (hpf >= 72 && !hasRef) report.error('E019', file, r.id, `keyframe at ${num(hpf)} hpf has no sizeRefSl`)
      if (hpf < 72 && hasRef) report.error('E019', file, r.id, `keyframe at ${num(hpf)} hpf carries sizeRefSl before 72 hpf`)
      if (i > 0) {
        const a = kfs[i - 1].hpf as number
        if (segmentIndex(axis, hpf) - segmentIndex(axis, a) >= 2) report.warn('W004', file, r.id, `no keyframe between ${num(a)} and ${num(hpf)} hpf`)
      }
    }
    if (kfs.length > 0 && (kfs[0].hpf as number) !== r.visibleFromHpf && !seeded.has(r.id)) {
      report.warn('W001', file, r.id, `first keyframe at ${num(kfs[0].hpf as number)} hpf, visibleFromHpf is ${num(r.visibleFromHpf)}`)
    }
    const span = (g.geometryEndHpf as number | undefined ?? r.modelEndHpf) - r.visibleFromHpf
    if (span > 24 && kfs.length < 2) report.warn('W006', file, r.id, `one keyframe over ${num(span)} h`)

    const maxU = r.system === 'fins' ? 1.25 : 1
    const statics = staticParams(g)
    checkCoords(r.id, statics, maxU, 'static', report)
    for (const kf of kfs) checkCoords(r.id, keyframeParams(kf), maxU, `${num(kf.hpf as number)} hpf`, report)
    checkRequired(r, g, statics, kfs, report)
    checkArrays(r.id, statics, kfs, report)
  }
  checkGroups(records, report)
}

/** E012: every body coordinate lies in range. */
function checkCoords(id: string, params: Obj, maxU: number, where: string, report: Report): void {
  visitCoords(
    params,
    '',
    ({ path, key, value }) => {
      const isU = key === 'u' || key === 'uStart' || key === 'uEnd'
      const lo = isU ? 0 : -1
      const hi = isU ? maxU : 1
      if (value < lo || value > hi) report.error('E012', 'structures', id, `${key} ${num(value)} outside [${lo}, ${hi}] at ${path || key} (${where})`)
    },
    (path, uStart, uEnd) => {
      if (uStart > uEnd) report.error('E012', 'structures', id, `uStart ${num(uStart)} is after uEnd ${num(uEnd)} at ${path || 'root'} (${where})`)
    },
  )
}

/** E030: the static block plus the first keyframe cover the required parameters of the kind. */
function checkRequired(r: StructureRecord, g: Obj, statics: Obj, kfs: Obj[], report: Report): void {
  const first = kfs.length > 0 ? keyframeParams(kfs[0]) : {}
  const merged = deepMerge(statics, first) as Obj
  const kind = String(g.kind)
  let required: string[] = []
  if (kind === 'custom') {
    if (typeof g.builder !== 'string') report.error('E030', 'structures', r.id, 'parameter builder is missing at the first keyframe')
    else if (PLACED_BUILDERS.has(g.builder)) required = ['placement']
  } else if (kind in REQUIRED_PARAMS) {
    required = REQUIRED_PARAMS[kind]
  } else {
    report.error('E030', 'structures', r.id, `unknown geometry kind ${kind}`)
  }
  for (const name of required) {
    if (merged[name] === undefined) report.error('E030', 'structures', r.id, `parameter ${name} is missing at the first keyframe`)
  }
  for (const name of ['placement', 'centre']) {
    const p = merged[name]
    if (!isObj(p)) continue
    for (const axis of ['u', 'v', 'w']) {
      if (typeof p[axis] !== 'number') report.error('E030', 'structures', r.id, `parameter ${name}.${axis} is missing at the first keyframe`)
    }
  }
}

/** E035: every array parameter keeps its length across keyframes. */
function checkArrays(id: string, statics: Obj, kfs: Obj[], report: Report): void {
  const seen = new Map<string, { n: number; at: string }>()
  for (const [path, n] of arrayLengths(statics)) seen.set(path, { n, at: 'static' })
  for (const kf of kfs) {
    const at = `${num(kf.hpf as number)} hpf`
    for (const [path, n] of arrayLengths(keyframeParams(kf))) {
      const prev = seen.get(path)
      if (prev && prev.n !== n) report.error('E035', 'structures', id, `${path} has ${prev.n} elements at ${prev.at} and ${n} at ${at}`)
      else if (!prev) seen.set(path, { n, at })
    }
  }
}

/** E020, W005, W008: size rows. */
function checkSizes(r: StructureRecord, report: Report): void {
  for (const row of r.sizes ?? []) {
    if (!row.source || row.source.trim().length === 0) report.error('E020', 'structures', r.id, `size row at ${num(row.hpf)} hpf has no source`)
    if (row.hpf < r.visibleFromHpf || row.hpf > r.modelEndHpf) {
      report.warn('W005', 'structures', r.id, `size row at ${num(row.hpf)} hpf lies outside [${num(r.visibleFromHpf)}, ${num(r.modelEndHpf)}]`)
    }
    const keys = [...Object.keys(row.dimsMm ?? {}), ...Object.keys(row.counts ?? {}), ...Object.keys(row.anglesDeg ?? {})]
    for (const key of keys) if (!SIZE_KEY_ALLOWLIST.has(key)) report.warn('W008', 'structures', r.id, `size key ${key} is not in the allowlist`)
  }
}

/** W002, W009: group nodes have children and contain their descendants' windows. */
function checkGroups(records: Map<string, StructureRecord>, report: Report): void {
  const children = new Map<string, StructureRecord[]>()
  for (const r of records.values()) {
    if (!r.uiParent) continue
    const list = children.get(r.uiParent) ?? []
    list.push(r)
    children.set(r.uiParent, list)
  }
  for (const r of records.values()) {
    if (r.geometry) continue
    const kids = children.get(r.id) ?? []
    if (kids.length === 0) report.warn('W002', 'structures', r.id, 'group node has no children')
    const stack = [...kids]
    const visited = new Set<string>()
    while (stack.length > 0) {
      const c = stack.pop() as StructureRecord
      if (visited.has(c.id)) continue
      visited.add(c.id)
      if (c.visibleFromHpf < r.visibleFromHpf - 1e-9 || c.modelEndHpf > r.modelEndHpf + 1e-9) {
        report.warn('W009', 'structures', r.id, `child ${c.id} [${num(c.visibleFromHpf)}, ${num(c.modelEndHpf)}] lies outside [${num(r.visibleFromHpf)}, ${num(r.modelEndHpf)}]`)
      }
      for (const gc of children.get(c.id) ?? []) stack.push(gc)
    }
  }
}
