// QP-16: every numeric leaf of the geometry schema has a unit class; conversions of spec 3.5.
import { describe, expect, it } from 'vitest'
import { jsonSchemaFor } from '../../src/core/jsonSchema.ts'
import {
  apFractionToU,
  classifyParam,
  dvKeywordToV,
  GEOMETRY_META_KEYS,
  isRescaledLength,
  KEYFRAME_META_KEYS,
  lateralityFrom,
  mmToUm,
  umToMm,
} from '../../src/core/paramUnits.ts'

type Json = Record<string, unknown>

/** Walks a JSON Schema from `start` and returns every numeric leaf with its property path. Follows the local $refs of `root`. */
function numericLeaves(root: Json, start: Json): Array<{ path: string[]; names: string[] }> {
  const defs = (root.$defs ?? {}) as Record<string, Json>
  const out: Array<{ path: string[]; names: string[] }> = []
  const visit = (node: Json, path: string[], names: string[]) => {
    if (typeof node.$ref === 'string') {
      const key = node.$ref.replace('#/$defs/', '')
      if (defs[key]) visit(defs[key], path, names)
      return
    }
    const types = Array.isArray(node.type) ? (node.type as string[]) : node.type ? [node.type as string] : []
    if (types.includes('number') || types.includes('integer')) out.push({ path, names })
    if (node.properties) {
      for (const [k, v] of Object.entries(node.properties as Record<string, Json>)) visit(v, [...path, k], [...names, k])
    }
    for (const key of ['items', 'additionalProperties']) {
      if (node[key] && typeof node[key] === 'object') visit(node[key] as Json, [...path, '[]'], names)
    }
    if (Array.isArray(node.prefixItems)) node.prefixItems.forEach((p, i) => visit(p as Json, [...path, `[${i}]`], names))
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
      if (Array.isArray(node[key])) (node[key] as Json[]).forEach((o) => visit(o, path, names))
    }
  }
  visit(start, [], [])
  return out
}

describe('classifyParam', () => {
  it('classifies the DM-35 classes', () => {
    expect(classifyParam('radiiMm')).toBe('length')
    expect(classifyParam('r0Mm')).toBe('length')
    expect(classifyParam('speedMmPerHour')).toBe('length')
    expect(classifyParam('bendDeg')).toBe('angle')
    expect(classifyParam('count')).toBe('count')
    expect(classifyParam('countLoops')).toBe('count')
    for (const n of ['u', 'v', 'w', 's0', 's1', 'e1', 'e2', 'ellipticity', 'exponent', 'heightFraction', 'taperFromU', 'offsetV', 'bulbOffsetW', 'uStart', 'uEnd'])
      expect(classifyParam(n), n).toBe('dimensionless')
    expect(classifyParam('length')).toBeNull()
    expect(classifyParam('hpf')).toBeNull()
  })
  it('rescales lengths except the body-height-fraction form', () => {
    expect(isRescaledLength('rMm', 0.05)).toBe(true)
    expect(isRescaledLength('rMm', { value: 0.5, unit: 'bodyHeightFraction' })).toBe(false)
    expect(isRescaledLength('rMm', { value: 0.5, unit: 'mm' })).toBe(true)
    expect(isRescaledLength('bendDeg', 30)).toBe(false)
  })
})

describe('every numeric geometry leaf has a class (QP-16)', () => {
  const structures = jsonSchemaFor('structures')
  const items = structures.items as Json
  const geometry = (items.properties as Record<string, Json>).geometry
  const leaves = numericLeaves(structures, geometry)
  it('walks a non-trivial schema', () => {
    expect(leaves.length).toBeGreaterThan(100)
  })
  it('classifies each leaf by its name or the nearest named ancestor', () => {
    const unclassified: string[] = []
    for (const leaf of leaves) {
      const names = leaf.names.filter((n) => !GEOMETRY_META_KEYS.has(n) && !KEYFRAME_META_KEYS.has(n) && n !== 'template')
      if (names.length === 0) continue // hpf, sizeRefSl, boundsMarginMm and the geometry block itself
      const own = names[names.length - 1]
      let cls = classifyParam(own)
      if (cls === null && own === 'value') cls = classifyParam(names[names.length - 2] ?? '')
      if (cls === null) unclassified.push(leaf.path.join('.'))
    }
    expect(unclassified, unclassified.join('\n')).toEqual([])
  })
})

describe('conversions (spec 3.5)', () => {
  it('converts micrometres and millimetres', () => {
    expect(umToMm(45)).toBeCloseTo(0.045, 12)
    expect(mmToUm(1.2)).toBeCloseTo(1200, 9)
  })
  it('converts apFraction to u with the source length over the axis length', () => {
    expect(apFractionToU(0.5, 1.9, 2.05)).toBeCloseTo(0.4634, 3)
    expect(apFractionToU(1.0, 3.1, 2.9)).toBe(1)
    expect(apFractionToU(1.0, 3.1, 2.9, { fins: true })).toBeCloseTo(1.069, 3)
    expect(apFractionToU(1.3, 1, 1, { fins: true })).toBe(1.25)
    expect(() => apFractionToU(0.5, 1, 0)).toThrow(RangeError)
  })
  it('maps dorsoventral keywords and laterality phrases', () => {
    expect(dvKeywordToV('dorsal midline, above the notochord')).toBe(0.6)
    expect(dvKeywordToV('ventral to the body axis')).toBe(-0.6)
    expect(dvKeywordToV('spine')).toBe(0)
    expect(dvKeywordToV('at the dorsal surface')).toBe(1)
    expect(dvKeywordToV('somewhere')).toBeNull()
    expect(lateralityFrom('paired')).toEqual({ laterality: 'paired', mirror: true })
    expect(lateralityFrom('Bilateral pair')).toEqual({ laterality: 'paired', mirror: true })
    expect(lateralityFrom('left-ventral')).toEqual({ laterality: 'left', mirror: false })
    expect(lateralityFrom('fused')).toEqual({ laterality: 'midline', mirror: false })
  })
})
