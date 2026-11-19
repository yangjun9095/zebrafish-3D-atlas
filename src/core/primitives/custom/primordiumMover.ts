// Posterior lateral line primordium (BG-40): a flattened teardrop that sits
// at u(t) on the horizontal myoseptum. Local frame; a sweep along local x
// with the teardrop radius profile. The leading (posterior, +x) end is blunt
// and the trailing (anterior) end tapers, as in the migrating primordium.
// Vertices as a tube with round caps: (rows + 1)(radial + 1) + 8 (radial + 1);
// 221 interactive, 357 final. The parameter shape is the record form of
// schema/customParams.ts: every length is a Size, deposits follow BG-40.
import type { BodyFrame } from '../../bodyModel.ts'
import { createWriter, finish, localAxes, placementOf } from '../mesh.ts'
import { sweepTube, sweepVertexCount, type SweepRow } from '../sweep.ts'
import { countsFor } from '../tessellation.ts'
import { sizeMm, type GeometryOut, type Placement, type PrimitiveBuilder, type Size } from '../types.ts'

export interface PrimordiumDeposits {
  /** A neuromast is left behind every this many somites (5 to 7 in the 03b draft). */
  countSomitesPerDeposit: number
  neuromastDiameterMm: Size
}

export interface PrimordiumMoverParams {
  /** u per keyframe on the horizontal myoseptum (v 0, w near +-1). */
  placement: Placement
  /** Along u. */
  lengthMm: Size
  /** Along w: the thin mediolateral dimension. */
  widthMm: Size
  /** Along v: the dorsoventral extent on the myoseptum. */
  heightMm: Size
  /** Migration speed, about 0.1 mm per hour from 20 hpf; for the info card. */
  speedMmPerHour?: number
  deposits?: PrimordiumDeposits
}

/** Teardrop radius factor along x in [-1, 1]: blunt at +x (the posterior, leading end). */
export const teardrop = (x: number): number => Math.sqrt(Math.max(0, 1 - x * x)) * (1 + 0.3 * x)

/**
 * Neuromasts deposited after the primordium has travelled `travelledU` (in u) along a
 * body whose somites are `somiteLengthU` long: one every `countSomitesPerDeposit`
 * somites (BG-40). The value is fractional, for the segmentArray count rule (BG-42).
 */
export function depositedCount(travelledU: number, somiteLengthU: number, countSomitesPerDeposit: number): number {
  const step = somiteLengthU * countSomitesPerDeposit
  if (!(step > 0) || !(travelledU > 0)) return 0
  return travelledU / step
}

export const primordiumMover: PrimitiveBuilder<PrimordiumMoverParams> = {
  kind: 'primordiumMover',
  localFrame: true,
  vertexCount(lod) { const c = countsFor('primordiumMover', lod); return sweepVertexCount(c.rows, c.radial, 'round') },
  build(params, frame: BodyFrame, lod): GeometryOut {
    const { rows, radial } = countsFor('primordiumMover', lod)
    const u = params.placement.u
    const hl = Math.max(0.004, sizeMm(params.lengthMm, frame, u) / 2)
    const hh = Math.max(0.004, sizeMm(params.heightMm, frame, u) / 2)
    const hw = Math.max(0.004, sizeMm(params.widthMm, frame, u) / 2)
    const sweep: SweepRow[] = []
    for (let i = 0; i <= rows; i++) {
      const x = -1 + (2 * i) / rows
      const k = Math.max(0.02, teardrop(x * 0.98))
      sweep.push({ p: [x * hl, 0, 0], t: [1, 0, 0], n: [0, 1, 0], b: [0, 0, -1], aD: hh * k, aV: hh * k, bw: hw * k, exponent: 2 })
    }
    const { out, stats } = sweepTube(sweep, radial, 'round', createWriter())
    return finish(out, { placement: placementOf(localAxes(frame, params.placement)), sweep: stats })
  },
}
