// Growth table access (D6, BG-26, BG-43). The table is linear in hpf, so
// SL(t) is monotone and invertible. Pure forms take the table as an
// argument; the short forms of the shared API (6.8.1) read the table that
// `configureGrowth` registered once at load.

export interface GrowthPoint {
  hpf: number
  lengthMm: number
  measure: 'EL' | 'TL' | 'SL'
  standardLengthMm: number | null
  source: string
  estimate: boolean
}

export const SL_START_HPF = 72

function sorted(table: readonly GrowthPoint[]): GrowthPoint[] {
  return [...table].sort((a, b) => a.hpf - b.hpf)
}

/** Linear interpolation of `pick(row)` over hpf; rows where pick is null are skipped. */
function interpolateColumn(table: readonly GrowthPoint[], hpf: number, pick: (g: GrowthPoint) => number | null): number | null {
  const rows = sorted(table).filter((g) => pick(g) !== null && Number.isFinite(pick(g)))
  if (rows.length === 0 || !Number.isFinite(hpf)) return null
  if (hpf < rows[0]!.hpf) return null
  if (hpf >= rows[rows.length - 1]!.hpf) return pick(rows[rows.length - 1]!)
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i]!
    const b = rows[i + 1]!
    if (hpf >= a.hpf && hpf <= b.hpf) {
      const span = b.hpf - a.hpf
      const s = span > 0 ? (hpf - a.hpf) / span : 0
      const va = pick(a) as number
      const vb = pick(b) as number
      return va + (vb - va) * s
    }
  }
  return null
}

/** Body length (egg diameter, EL or TL) at hpf; clamps to the table ends. */
export function bodyLengthAtFrom(table: readonly GrowthPoint[], hpf: number): number {
  const rows = sorted(table)
  if (rows.length === 0) throw new Error('growth table is empty')
  if (hpf <= rows[0]!.hpf) return rows[0]!.lengthMm
  return interpolateColumn(rows, hpf, (g) => g.lengthMm) ?? rows[rows.length - 1]!.lengthMm
}

/** Standard length at hpf; null before the first row that carries an SL (72 hpf). */
export function slAtFrom(table: readonly GrowthPoint[], hpf: number): number | null {
  return interpolateColumn(table, hpf, (g) => g.standardLengthMm)
}

/**
 * `SL(max(hpf, 72)) / sizeRefSl` (BG-43). Returns 1 when the table carries
 * no SL or the reference is not a positive number, so a caller never
 * receives NaN or Infinity.
 */
export function slScaleFrom(table: readonly GrowthPoint[], hpf: number, sizeRefSl: number): number {
  if (!Number.isFinite(sizeRefSl) || sizeRefSl <= 0) return 1
  const sl = slAtFrom(table, Math.max(hpf, SL_START_HPF))
  if (sl === null || !Number.isFinite(sl)) return 1
  return sl / sizeRefSl
}

/** Inverse of slAt: the hpf at which the table reaches `sl`; null outside the SL range. */
export function hpfAtSlFrom(table: readonly GrowthPoint[], sl: number): number | null {
  const rows = sorted(table).filter((g) => g.standardLengthMm !== null)
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i]!.standardLengthMm as number
    const b = rows[i + 1]!.standardLengthMm as number
    if (sl >= a && sl <= b) {
      const s = b > a ? (sl - a) / (b - a) : 0
      return rows[i]!.hpf + (rows[i + 1]!.hpf - rows[i]!.hpf) * s
    }
  }
  return null
}

let registered: GrowthPoint[] | null = null

/** Register the growth table of stages.json once at load (AR-06). */
export function configureGrowth(table: readonly GrowthPoint[]): void {
  registered = sorted(table)
}

function table(): GrowthPoint[] {
  if (!registered) throw new Error('growth table not configured: call configureGrowth(stages.growth) first')
  return registered
}

export const bodyLengthAt = (hpf: number): number => bodyLengthAtFrom(table(), hpf)
export const slAt = (hpf: number): number | null => slAtFrom(table(), hpf)
export const slScale = (hpf: number, sizeRefSl: number): number => slScaleFrom(table(), hpf, sizeRefSl)
export const hpfAtSl = (sl: number): number | null => hpfAtSlFrom(table(), sl)
