// GeometrySpec: static parameters plus keyframes per primitive kind (spec 3.2.4).
import { z } from 'zod'
import { Hpf, Mm } from './shared.ts'
import {
  EarVesiclePartial,
  EyeCupPartial,
  FinSheetPartial,
  GutLoopPartial,
  HeartLoopPartial,
  PrimordiumMoverPartial,
  SomiteChevronPartial,
} from './customParams.ts'
import {
  BodyDrivenPart,
  DerivedParams,
  EllipsoidPartial,
  LathePartial,
  SheetPartial,
  ShellPartial,
  SuperellipsoidPartial,
  TubePartial,
} from './params.ts'
import { SegmentArrayPartial } from './segmentArray.ts'

export const PRIMITIVE_KINDS = [
  'ellipsoid',
  'superellipsoid',
  'tube',
  'lathe',
  'segmentArray',
  'sheet',
  'shell',
  'bodyDriven',
  'custom',
  'derived',
] as const
export const PrimitiveKind = z.enum(PRIMITIVE_KINDS)
export type PrimitiveKind = z.infer<typeof PrimitiveKind>

export const LodHint = z.enum(['low', 'medium', 'high'])

/**
 * Builds one geometry schema. `fixed` is required on the static block (the builder
 * literal of a custom kind, the part of a body-driven kind). `partial` is the per-leaf
 * partial parameter shape: it appears once as the static block and once per keyframe.
 */
function geometryOf<K extends string, S extends z.ZodRawShape, F extends z.ZodRawShape>(
  kind: K,
  partial: S,
  fixed: F,
) {
  return z.strictObject({
    kind: z.literal(kind),
    ...fixed,
    ...partial,
    keyframes: z
      .array(
        z.strictObject({
          hpf: Hpf,
          /** required at or after 72 hpf (DM-14) */
          sizeRefSl: z.number().positive().optional(),
          ...partial,
        }),
      )
      .min(1),
    /** the mesh ends here; the record continues as a group node */
    geometryEndHpf: Hpf.optional(),
    /** the handoff id that consumes this geometry */
    handoffOut: z.string().optional(),
    lodHint: LodHint.default('medium'),
    /** allowed protrusion beyond the body box for W007 */
    boundsMarginMm: Mm.optional(),
    /** parameter names that are estimates */
    estimate: z.array(z.string()).default([]),
    sources: z.array(z.string().min(1)).min(1),
  })
}

export const EllipsoidGeometry = geometryOf('ellipsoid', EllipsoidPartial.shape, {})
export const SuperellipsoidGeometry = geometryOf('superellipsoid', SuperellipsoidPartial.shape, {})
export const TubeGeometry = geometryOf('tube', TubePartial.shape, {})
export const LatheGeometry = geometryOf('lathe', LathePartial.shape, {})
export const SegmentArrayGeometry = geometryOf('segmentArray', SegmentArrayPartial.shape, {})
export const SheetGeometry = geometryOf('sheet', SheetPartial.shape, {})
export const ShellGeometry = geometryOf('shell', ShellPartial.shape, {})
export const BodyDrivenGeometry = geometryOf('bodyDriven', {}, { part: BodyDrivenPart })
export const DerivedGeometry = geometryOf('derived', {}, DerivedParams.shape)

export const HeartLoopGeometry = geometryOf('custom', HeartLoopPartial.shape, { builder: z.literal('heartLoop') })
export const GutLoopGeometry = geometryOf('custom', GutLoopPartial.shape, { builder: z.literal('gutLoop') })
export const EyeCupGeometry = geometryOf('custom', EyeCupPartial.shape, { builder: z.literal('eyeCup') })
export const EarVesicleGeometry = geometryOf('custom', EarVesiclePartial.shape, { builder: z.literal('earVesicle') })
export const SomiteChevronGeometry = geometryOf('custom', SomiteChevronPartial.shape, {
  builder: z.literal('somiteChevron'),
})
export const FinSheetGeometry = geometryOf('custom', FinSheetPartial.shape, { builder: z.literal('finSheet') })
export const PrimordiumMoverGeometry = geometryOf('custom', PrimordiumMoverPartial.shape, {
  builder: z.literal('primordiumMover'),
})

/** One member per builder, discriminated by `builder`. */
export const CustomGeometry = z.discriminatedUnion('builder', [
  HeartLoopGeometry,
  GutLoopGeometry,
  EyeCupGeometry,
  EarVesicleGeometry,
  SomiteChevronGeometry,
  FinSheetGeometry,
  PrimordiumMoverGeometry,
])
export type CustomGeometry = z.infer<typeof CustomGeometry>

/** Discriminated on `kind`; the `custom` member is itself discriminated on `builder`. */
export const GeometrySpec = z.discriminatedUnion('kind', [
  EllipsoidGeometry,
  SuperellipsoidGeometry,
  TubeGeometry,
  LatheGeometry,
  SegmentArrayGeometry,
  SheetGeometry,
  ShellGeometry,
  BodyDrivenGeometry,
  DerivedGeometry,
  CustomGeometry,
])
export type GeometrySpec = z.infer<typeof GeometrySpec>
export type GeometryKeyframe = GeometrySpec['keyframes'][number]
