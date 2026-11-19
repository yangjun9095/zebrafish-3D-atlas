// segmentArray parameters (spec 3.2.3, BG-32): a template repeated along u.
import { z } from 'zod'
import { SomiteChevronPartial } from './customParams.ts'
import { EllipsoidPartial, PlacementPartial, SheetPartial, SuperellipsoidPartial, TubePartial, U } from './params.ts'

// Segment arrays ----------------------------------------------------------------

/** The template placement gives v and w; the array sets u. Keyframe form: per-leaf partial. */
export const SegmentTemplatePartial = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ellipsoid'), ...EllipsoidPartial.shape }),
  z.strictObject({ kind: z.literal('superellipsoid'), ...SuperellipsoidPartial.shape }),
  z.strictObject({ kind: z.literal('tube'), ...TubePartial.shape }),
  z.strictObject({ kind: z.literal('sheet'), ...SheetPartial.shape }),
  z.strictObject({ kind: z.literal('custom'), builder: z.literal('somiteChevron'), placement: PlacementPartial.optional(), ...SomiteChevronPartial.shape }),
])
export const SegmentPerIndex = z
  .strictObject({ scale: z.number().positive(), offsetV: z.number(), chevronDeg: z.number() })
  .partial()
export const SegmentArrayParams = z.strictObject({
  template: SegmentTemplatePartial,
  uStart: U,
  uEnd: U,
  /** interpolation type count (BG-42) */
  count: z.number().min(0),
  /** default false */
  mirror: z.boolean(),
  perIndex: SegmentPerIndex.optional(),
})
export const SegmentArrayPartial = SegmentArrayParams.partial()
