// Placement and per-primitive parameter shapes (spec 3.2.3, 4.5, 4.6).
// Every numeric leaf name follows the unit suffix rule of DM-35 (src/core/paramUnits.ts).
// No leaf carries a zod default: a keyframe lists only what changes (BG-41), and a
// default inside a partial would overwrite an inherited value. PARAM_DEFAULTS in
// paramUnits.ts holds the documented defaults; the builder applies them after the merge.
import { z } from 'zod'
import { Mm, ZfaId } from './shared.ts'

/** v and w: -1 ventral or left surface, +1 dorsal or right surface. */
export const Signed = z.number().min(-1).max(1)
/** 0 snout, 1 notochord end; above 1.0 only in the fins system (E012). */
export const U = z.number().min(0).max(1.25)
/** Floor of a tube radius and a sheet edge (BG-31). */
export const Mm4 = z.number().min(0.004)

/** A *Mm leaf holds a Size; the fraction form skips the SL rescale (DM-17). */
export const Size = z.union([
  Mm,
  z.strictObject({ value: Mm, unit: z.enum(['mm', 'bodyHeightFraction']) }),
])
export type Size = z.infer<typeof Size>

export const Placement = z.strictObject({
  u: U,
  v: Signed,
  w: Signed,
  yawDeg: z.number().optional(),
  pitchDeg: z.number().optional(),
  rollDeg: z.number().optional(),
  /** paired: draw at +w and at -w (default false). */
  mirror: z.boolean().optional(),
})
export type Placement = z.infer<typeof Placement>
export const PlacementPartial = Placement.partial()

const Radii3 = z.tuple([Size, Size, Size])

// Primitive kinds --------------------------------------------------------------

export const EllipsoidParams = z.strictObject({
  placement: Placement,
  /** along u, v, w */
  radiiMm: Radii3,
})
export const EllipsoidPartial = z.strictObject({
  placement: PlacementPartial.optional(),
  radiiMm: Radii3.optional(),
})

/** Exponents above 2 give an infinite Barr normal at the poles (BG-29). */
const Exponent = z.number().min(0.3).max(2.0)
export const SuperellipsoidParams = EllipsoidParams.extend({ e1: Exponent, e2: Exponent })
export const SuperellipsoidPartial = EllipsoidPartial.extend({
  e1: Exponent.optional(),
  e2: Exponent.optional(),
})

export const TubePath = z.union([
  z.strictObject({ type: z.literal('spine'), uStart: U, uEnd: U, v: Signed, w: Signed }),
  z.strictObject({ type: z.literal('spline'), points: z.array(Placement).min(2) }),
])
export const TubeRadius = z.union([
  Size,
  z.strictObject({ r0Mm: Size, r1Mm: Size }),
  z.literal('body'),
])
export const TubeCaps = z.enum(['none', 'round', 'flat'])
export const TubeParams = z.strictObject({
  path: TubePath,
  radiusMm: TubeRadius,
  /** v radius divided by w radius (default 1). */
  ellipticity: z.number().positive(),
  /** default 'round' */
  caps: TubeCaps,
  /** notochord: the taper starts here */
  taperFromU: U.optional(),
  /** notochord: dorsal bend of the posterior part (default 0) */
  flexionDeg: z.number().min(0).max(45),
  flexionFromU: U.optional(),
  /** drives a material stripe, not the geometry (default false) */
  segmented: z.boolean(),
})
export const TubePartial = TubeParams.partial()

export const LatheParams = z.strictObject({
  placement: Placement,
  /** [radius, height along the local y axis], both mm */
  profileMm: z.array(z.tuple([Mm, z.number()])).min(6).max(10),
  /** default 360 */
  phiLengthDeg: z.number().min(1).max(360),
})
export const LathePartial = LatheParams.partial().extend({ placement: PlacementPartial.optional() })

export const SheetBase = z.strictObject({
  uStart: U,
  uEnd: U,
  side: z.enum(['dorsal', 'ventral', 'lateral']),
  w: Signed,
})
/** closed 2D spline as [chord, span] in mm */
const Outline = z.array(z.tuple([z.number(), z.number()])).min(3)
export const SheetParams = z.strictObject({
  base: SheetBase,
  outlineMm: Outline,
  thicknessBaseMm: Mm,
  thicknessEdgeMm: Mm4,
  /** default 0 */
  rakeDeg: z.number(),
})
export const SheetPartial = SheetParams.partial().extend({ base: SheetBase.partial().optional() })

export const ShellParams = z.strictObject({
  centre: Placement,
  innerRadiusMm: Mm,
  thicknessMm: Mm,
  /** coverage from the animal pole */
  polarDeg: z.number().min(0).max(180),
  /** default 360 */
  azimuthDeg: z.number().min(1).max(360),
})
export const ShellPartial = ShellParams.partial().extend({ centre: PlacementPartial.optional() })

/** The yolk and the chorion: parameters come from the body frame (DM-31). */
/** Parts drawn from the body frame (DM-31, BG-11, BG-13, BG-33): yolk, chorion, blastodisc cap, blastoderm shell. */
export const BodyDrivenPart = z.enum(['yolk', 'chorion', 'blastodisc', 'blastoderm'])

/** A part of another record's builder (BG-34, BG-36) or of the yolk (DM-31). */
export const DerivedParams = z.strictObject({
  sourceId: ZfaId,
  /** atrium, ventricle, bulbus, sinusVenosus, lens, retina, rpe, ball, extension */
  part: z.string().min(1),
})
