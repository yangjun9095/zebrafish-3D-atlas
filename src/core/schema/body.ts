// BodyKeyframe and BodyFile (spec 4.3.1, BG-24), HandoffRecord (4.8, BG-48), KitRecord (5.12).
import { z } from 'zod'
import { ZfaId } from './shared.ts'

const Vec3 = z.tuple([z.number(), z.number(), z.number()])

export const BodyRegime = z.enum(['R0', 'R1', 'R2', 'R3', 'R4'])
export type BodyRegime = z.infer<typeof BodyRegime>

export const BodyKeyframe = z.strictObject({
  hpf: z.number().min(0).max(4320),
  /** ZFS short label, informational */
  stage: z.string(),
  regime: BodyRegime,
  /** growth table value (D6) */
  bodyLengthMm: z.number().positive(),
  /** null before 72 hpf */
  slMm: z.number().positive().nullable(),
  /** null before 10 hpf */
  axisLengthMm: z.number().positive().nullable(),
  headTrunkAngleDeg: z.number().nullable(),
  notochordFlexionDeg: z.number().min(0).max(45),
  ventU: z.number().min(0).max(1),
  epibolyFraction: z.number().min(0).max(1),
  somiteCount: z.number().int().min(0).max(34),
  cellCount: z.number().int().nullable(),
  cap: z.strictObject({ baseRadiusMm: z.number(), heightMm: z.number() }).nullable(),
  shellThicknessMm: z.number().nullable(),
  /** R0 to R2 sphere; equals ball radius from 14 hpf */
  yolkRadiusMm: z.number().nullable(),
  yolkDomeMm: z.number().default(0),
  yolkBall: z.strictObject({ u: z.number(), depthMm: z.number(), radiusMm: z.number() }).nullable(),
  yolkExtension: z
    .strictObject({ u0: z.number(), u1: z.number(), r0Mm: z.number(), r1Mm: z.number() })
    .nullable(),
  chorion: z.strictObject({ centre: Vec3, radiusMm: z.number() }).nullable(),
  /** [u, x, y] in mm, u ascending, z = 0 */
  spine: z.array(Vec3).min(7),
  profile: z
    .array(
      z.strictObject({
        u: z.number(),
        hD: z.number(),
        hV: z.number(),
        hW: z.number(),
        exponent: z.number().default(2),
      }),
    )
    .length(9),
  /** names of fields that are estimates */
  estimate: z.array(z.string()).default([]),
  sources: z.array(z.string()),
})
export type BodyKeyframe = z.infer<typeof BodyKeyframe>

export const BodyFile = z.strictObject({
  generatedBy: z.string(),
  keyframes: z.array(BodyKeyframe).min(24),
})
export type BodyFile = z.infer<typeof BodyFile>

// Handoffs ----------------------------------------------------------------------

export const HandoffWindow = z.union([
  z.strictObject({ startHpf: z.number().min(0), endHpf: z.number().min(0) }),
  /** resolved through the growth table at load */
  z.strictObject({ startSl: z.number().positive(), endSl: z.number().positive() }),
])
export type HandoffWindow = z.infer<typeof HandoffWindow>

export const HandoffSeed = z.enum(['copyPlacement', 'subRange', 'outlineSegment', 'sexToggle'])
export type HandoffSeed = z.infer<typeof HandoffSeed>

export const HandoffRecord = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+$/),
  from: z.array(ZfaId).min(1),
  to: z.array(ZfaId).min(1),
  window: HandoffWindow,
  perSegment: z.strictObject({ delayHpf: z.number().min(0), lengthHpf: z.number().positive() }).optional(),
  /** the structure whose geometry seeds the targets */
  driver: ZfaId,
  seed: HandoffSeed,
  /** true when source and target share one record */
  withinRecord: z.boolean().default(false),
  note: z.string(),
})
export type HandoffRecord = z.infer<typeof HandoffRecord>
export const HandoffsFile = z.array(HandoffRecord)
export type HandoffsFile = z.infer<typeof HandoffsFile>

// Slide kits ---------------------------------------------------------------------

export const VIEW_PRESETS = ['lateral', 'dorsal', 'ventral', 'anterior', 'posterior', 'threeQuarter'] as const
export const ViewPreset = z.enum(VIEW_PRESETS)
export type ViewPreset = z.infer<typeof ViewPreset>

export const CameraPose = z.strictObject({ position: Vec3, target: Vec3 })
export type CameraPose = z.infer<typeof CameraPose>

export const SectionState = z.strictObject({
  axis: z.enum(['sagittal', 'frontal', 'transverse']).nullable(),
  position: z.number().min(-1).max(1),
  flip: z.boolean(),
})
export type SectionState = z.infer<typeof SectionState>

/** One bookmark of a slide kit (spec 2.4 Bookmark, 5.12). A null `cam` uses `view`. */
export const Bookmark = z.strictObject({
  name: z.string().min(1),
  t: z.number().min(0).max(4320),
  view: ViewPreset.default('lateral'),
  cam: CameraPose.nullable().default(null),
  sel: z.array(ZfaId).max(12).default([]),
  hide: z.array(z.string().min(1)).default([]),
  xr: z.number().int().min(0).max(100).default(60),
  sec: SectionState.default({ axis: null, position: 0, flip: false }),
  iso: z.boolean().default(false),
  labels: z.boolean().default(false),
  notes: z.string().default(''),
})
export type Bookmark = z.infer<typeof Bookmark>

export const KitRecord = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
  name: z.string().min(1),
  description: z.string().default(''),
  bookmarks: z.array(Bookmark).min(1),
})
export type KitRecord = z.infer<typeof KitRecord>
export const KitsFile = z.array(KitRecord)
export type KitsFile = z.infer<typeof KitsFile>
