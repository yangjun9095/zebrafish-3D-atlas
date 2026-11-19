// The readout strings of src/core/format.ts: the length measure that travels with the number
// (review B09, B10), the standard length beside it, and the growth table that states them.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  MEASURE_NAMES, formatLength, formatLengthWithMeasure, formatReadout, lengthAt, measureOf,
} from '../../src/core/format.ts'
import type { GrowthPoint } from '../../src/core/schema.ts'

/** A growth row; `lengthMeasure` is the field stages.json states and `measure` the older one. */
function row(hpf: number, lengthMm: number, measure: string, opts: { sl?: number | null; lengthMeasure?: string } = {}): GrowthPoint {
  const base = { hpf, lengthMm, measure, standardLengthMm: opts.sl ?? null, source: 'test', estimate: false }
  return (opts.lengthMeasure === undefined ? base : { ...base, lengthMeasure: opts.lengthMeasure }) as unknown as GrowthPoint
}

const table: GrowthPoint[] = [
  row(0, 0.7, 'EL', { lengthMeasure: 'ED' }),
  row(24, 1.9, 'EL', { lengthMeasure: 'EL' }),
  row(2160, 21.6, 'TL', { sl: 18, lengthMeasure: 'TL' }),
  row(4320, 30, 'TL', { sl: 25, lengthMeasure: 'TL' }),
]

describe('the length measure', () => {
  it('reads lengthMeasure when the row states it and falls back to measure when it does not', () => {
    expect(measureOf(table[0])).toBe('ED')
    expect(measureOf(row(0, 0.7, 'EL'))).toBe('EL')
    expect(measureOf(row(0, 0.7, 'EL', { lengthMeasure: 'nonsense' }))).toBe('EL')
    expect(MEASURE_NAMES.ED).toBe('egg diameter')
  })

  it('names the measure beside the number, with the standard length where the row gives both', () => {
    expect(formatLengthWithMeasure(lengthAt(table, 4320))).toBe('30.0 mm TL (25.0 mm SL)')
    expect(formatLengthWithMeasure(lengthAt(table, 0))).toBe('0.7 mm ED')
    expect(formatLengthWithMeasure(lengthAt(table, 24))).toBe('1.9 mm EL')
    expect(formatLengthWithMeasure(null)).toBeNull()
  })

  it('interpolates the standard length with the length and marks the value as interpolated', () => {
    const read = lengthAt(table, 3240)
    expect(read?.interpolated).toBe(true)
    expect(read?.valueMm).toBeCloseTo(25.8, 5)
    expect(read?.standardLengthMm).toBeCloseTo(21.5, 5)
    expect(formatLength(read)).toBe('25.8 mm~')
    expect(formatLengthWithMeasure(read)).toBe('25.8 mm~ TL (21.5 mm SL)')
  })

  it('carries the measure into the readout the export overlay draws', () => {
    expect(formatReadout({ hpf: 4320, stageShortLabel: 'adult', length: lengthAt(table, 4320), units: 'dpf' })).toBe(
      '180 dpf | Adult | 30.0 mm TL (25.0 mm SL)',
    )
    expect(formatReadout({ hpf: 24, stageShortLabel: 'prim-5', length: null })).toBe('24 hpf | Prim-5')
  })
})

describe('the shipped growth table', () => {
  const growth = (JSON.parse(readFileSync('src/data/stages.json', 'utf8')) as { growth: GrowthPoint[] }).growth
  /** The rows state `lengthMeasure` from the stages.json pass that separates the egg rows (B10). */
  const statesMeasure = growth.some((g) => 'lengthMeasure' in g)

  it('gives every row a measure and reads the egg rows as an egg diameter once the table states one', () => {
    for (const g of growth) expect(['ED', 'EL', 'TL', 'SL'], `${g.hpf} hpf`).toContain(measureOf(g))
    expect(measureOf(growth[0])).toBe(statesMeasure ? 'ED' : 'EL')
    expect(formatLengthWithMeasure(lengthAt(growth, 4320))).toBe('30.0 mm TL (25.0 mm SL)')
  })
})
