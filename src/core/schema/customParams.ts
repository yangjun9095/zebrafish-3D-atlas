// Custom builder parameter shapes (spec 4.6, BG-34 to BG-40). Same rules as params.ts:
// suffix rule of DM-35, no zod defaults, one full shape and one per-leaf partial per builder.
import { z } from 'zod'
import { Mm } from './shared.ts'
import { Mm4, Placement, PlacementPartial, SheetBase, Signed, Size } from './params.ts'

const Frac01 = z.number().min(0).max(1)
/** closed 2D spline as [chord, span] in mm */
const Outline = z.array(z.tuple([z.number(), z.number()])).min(3)

// Custom builders (spec 4.6) ---------------------------------------------------

const SegRange = { s0: Frac01, s1: Frac01 }
const HeartSegSv = z.strictObject({ ...SegRange, rMm: Size })
const HeartSegAtrium = z.strictObject({ ...SegRange, rMm: Size, rAcrossMm: Size })
const HeartSegAv = z.strictObject({ ...SegRange, rMm: Size })
/** exponent 0.7 boxy larva, 1.0 round adult */
const HeartSegVentricle = z.strictObject({ ...SegRange, rMm: Size, rAcrossMm: Size, exponent: z.number().positive() })
/** pear, tilt 30 to 35 anterior-dorsal */
const HeartSegBulbus = z.strictObject({ ...SegRange, rBaseMm: Size, rNeckMm: Size, tiltDeg: z.number() })
export const HeartSegments = z.strictObject({
  sinusVenosus: HeartSegSv,
  atrium: HeartSegAtrium,
  avCanal: HeartSegAv,
  ventricle: HeartSegVentricle,
  bulbus: HeartSegBulbus,
})
export const HeartSegmentsPartial = z.strictObject({
  sinusVenosus: HeartSegSv.partial().optional(),
  atrium: HeartSegAtrium.partial().optional(),
  avCanal: HeartSegAv.partial().optional(),
  ventricle: HeartSegVentricle.partial().optional(),
  bulbus: HeartSegBulbus.partial().optional(),
})
const AtriumOffset = z.strictObject({ v: Signed, w: Signed })
export const HeartStage = z.enum(['cone', 'tube', 'C', 'S', 'chambers'])

/** BG-34 */
export const HeartLoopParams = z.strictObject({
  /** venous pole anchor, u 0.16 to 0.27, v about -0.7 */
  placement: Placement,
  /** step type; drives the info-card alias only */
  stage: HeartStage,
  coneBaseRadiusMm: Size,
  coneHeightMm: Size,
  /** straight length venous pole to arterial pole */
  tubeLengthMm: Size,
  /** yaw of the tube from +x toward the left, 15 at 24 hpf */
  headingDeg: z.number(),
  /** turn at the atrioventricular canal: 0 straight, 90 C, 130 to 140 S */
  bendDeg: z.number().min(0).max(180),
  /** dextral twist of the ventricle limb, 0 to 30 */
  twistDeg: z.number(),
  segments: HeartSegments,
  /** atrium left-dorsal at 48 hpf (w -0.3), posterior-dorsal from 120 hpf */
  atriumOffset: AtriumOffset,
})
export const HeartLoopPartial = HeartLoopParams.partial().extend({
  placement: PlacementPartial.optional(),
  segments: HeartSegmentsPartial.optional(),
  atriumOffset: AtriumOffset.partial().optional(),
})

const GutSeg = z.strictObject({ ...SegRange, rMm: Size })
export const GutSegments = z.strictObject({
  esophagus: GutSeg,
  intestinalBulb: GutSeg,
  midIntestine: GutSeg,
  posteriorIntestine: GutSeg,
})
const GutSegmentsPartial = z.strictObject({
  esophagus: GutSeg.partial().optional(),
  intestinalBulb: GutSeg.partial().optional(),
  midIntestine: GutSeg.partial().optional(),
  posteriorIntestine: GutSeg.partial().optional(),
})
/** A named face on the gut surface; the liver, pancreas and gall bladder attach here. */
export const GutAttachment = z.strictObject({ name: z.string().min(1), ...SegRange, thetaDeg: z.number() })

/** BG-35 */
export const GutLoopParams = z.strictObject({
  /** from the mouth record to the vent (ventU) */
  path: z.array(Placement).min(2),
  segments: GutSegments,
  /** the bulb sits to the left in the larva */
  bulbOffsetW: Signed,
  /** 0 in the larva, 1 from 504 hpf, 3 in the adult */
  countLoops: z.number().min(0),
  attachments: z.array(GutAttachment),
})
export const GutLoopPartial = GutLoopParams.partial().extend({ segments: GutSegmentsPartial.optional() })

export const EyeStage = z.enum(['vesicle', 'cup', 'eye'])
/** BG-36 */
export const EyeCupParams = z.strictObject({
  /** u 0.10, w +-0.8 */
  placement: Placement,
  outerDiameterMm: Size,
  depthMm: Size,
  stage: EyeStage,
  /** choroid fissure width; closes by 48 hpf */
  fissureDeg: z.number().min(0).max(180),
  lensDiameterMm: Size,
  /** 0 to 0.4 of the lens radius beyond the cup rim */
  lensProtrusionFraction: z.number().min(0).max(0.4),
  rpeThicknessMm: Size,
  retinaThicknessMm: Size,
})
export const EyeCupPartial = EyeCupParams.partial().extend({ placement: PlacementPartial.optional() })

const Otolith = z.strictObject({ diameterMm: Size, pole: z.enum(['anterior', 'posterior']) })
const Canals = z.strictObject({ loopDiameterMm: Size, tubeDiameterMm: Size, present: z.boolean() })
/** BG-37 */
export const EarVesicleParams = z.strictObject({
  placement: Placement,
  lengthMm: Size,
  widthMm: Size,
  heightMm: Size,
  wallMm: Size,
  otoliths: z.array(Otolith),
  /** 0 to 1; the projections grow from 45 to 72 hpf */
  pillarLengthFraction: Frac01,
  /** three orthogonal tori on the dorsal vestibule */
  canals: Canals,
})
export const EarVesiclePartial = EarVesicleParams.partial().extend({
  placement: PlacementPartial.optional(),
  canals: Canals.partial().optional(),
})

/** BG-38: the template of the somite and myotome arrays. */
export const SomiteChevronParams = z.strictObject({
  lengthMm: Size,
  widthMm: Size,
  /** body height fraction, 1.0 for myotomes */
  heightFraction: z.number().positive(),
  /** 0 cuboid at formation, 40 for segments 8 to 15 by 26 hpf */
  chevronDeg: z.number(),
  /** 0 in the larva, 1 for the adult W-shape */
  wFoldFraction: Frac01,
  /** apex position along the segment as a fraction of its length; the apex points anteriorly */
  apexOffsetFraction: Frac01,
})
export const SomiteChevronPartial = SomiteChevronParams.partial()

const FinRays = z.strictObject({ count: z.number().min(0), lengthFraction: Frac01, thicknessMm: Size })
/** BG-39: a sheet with fin-specific parameters. */
export const FinSheetParams = z.strictObject({
  base: SheetBase,
  outlineMm: Outline,
  thicknessBaseMm: Mm,
  thicknessEdgeMm: Mm4,
  /** the pectoral fin swings from lateral at 30 hpf to posterior at 60 hpf */
  rakeDeg: z.number(),
  /** tapered rods from the base to the margin; no rays before 4.9 mm SL */
  rays: FinRays,
  /** caudal fin only, 0 to 0.05 SL from 6.4 mm SL */
  forkDepthFraction: z.number().min(0).max(0.2),
  lobes: z.enum(['one', 'two']),
})
export const FinSheetPartial = FinSheetParams.partial().extend({
  base: SheetBase.partial().optional(),
  rays: FinRays.partial().optional(),
})

const Deposits = z.strictObject({ countSomitesPerDeposit: z.number().int().positive(), neuromastDiameterMm: Size })
/** BG-40 */
export const PrimordiumMoverParams = z.strictObject({
  /** at u(t) on the horizontal myoseptum (v 0, w +-1); the keyframes give u */
  placement: Placement,
  lengthMm: Size,
  widthMm: Size,
  heightMm: Size,
  speedMmPerHour: z.number().min(0),
  deposits: Deposits,
})
export const PrimordiumMoverPartial = PrimordiumMoverParams.partial().extend({
  placement: PlacementPartial.optional(),
  deposits: Deposits.partial().optional(),
})

export const CUSTOM_BUILDERS = [
  'heartLoop',
  'gutLoop',
  'eyeCup',
  'earVesicle',
  'somiteChevron',
  'finSheet',
  'primordiumMover',
] as const
export const CustomBuilder = z.enum(CUSTOM_BUILDERS)
export type CustomBuilder = z.infer<typeof CustomBuilder>

