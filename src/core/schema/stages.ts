// stages.json schemas: stages, periods, events, growth, time axis (spec 3.2.2, D6, D7).
import { z } from 'zod'
import { Hex, Hpf, Url, ZfsId } from './shared.ts'

export const PERIOD_IDS = [
  'zygote',
  'cleavage',
  'blastula',
  'gastrula',
  'segmentation',
  'pharyngula',
  'hatching',
  'larval',
  'juvenile',
  'adult',
] as const
export const PeriodId = z.enum(PERIOD_IDS)
export type PeriodId = z.infer<typeof PeriodId>

export const LengthMeasure = z.enum(['EL', 'TL', 'SL'])
/** A growth row also states ED, the egg diameter of the rows before the embryonic axis (review B10). */
export const RowLengthMeasure = z.enum(['ED', 'EL', 'TL', 'SL'])
export type LengthMeasure = z.infer<typeof LengthMeasure>

/**
 * The ZFIN stage table has 44 named stages (ZFS:0000001 to ZFS:0000044) plus the
 * ZFS:0000000 Unknown row, which stages.json excludes. D7 states 43; the file has 44.
 */
export const NAMED_STAGE_COUNT = 44

export const StageRecord = z.strictObject({
  zfs: ZfsId,
  zdb: z.string().regex(/^ZDB-STAGE-\d{6}-\d+$/),
  /** ZFIN label, for example "Pharyngula:Prim-15". */
  name: z.string().min(1),
  /** "prim-15" */
  shortLabel: z.string().min(1),
  period: PeriodId,
  startHpf: Hpf,
  endHpf: Hpf,
  dpfLabel: z.string(),
  landmarks: z.array(z.string()),
  lengthMm: z
    .strictObject({
      value: z.number().positive(),
      measure: LengthMeasure,
      source: Url,
    })
    .nullable(),
  headline: z.boolean(),
  sources: z.array(Url).min(1),
})
export type StageRecord = z.infer<typeof StageRecord>

export const PeriodRecord = z.strictObject({
  id: PeriodId,
  /** null for zygote (no ZFS period term); the other ids exist in zfa.obo only (E003). */
  zfs: ZfsId.nullable(),
  displayName: z.string().min(1),
  /** Abbreviated label for a narrow band (UX-TL-05): Zyg, Clv, Bla, ... */
  abbrev: z.string().min(1).max(4),
  /** Period ramp colour (spec 5.2.3, research 07 section 4.4). */
  color: Hex,
  startHpf: Hpf,
  endHpf: Hpf,
  note: z.string().optional(),
})
export type PeriodRecord = z.infer<typeof PeriodRecord>

export const EventRecord = z.strictObject({
  id: z.string().regex(/^ev-[a-z0-9-]+$/),
  hpf: Hpf,
  label: z.string().min(1),
  description: z.string(),
  source: Url,
  /** true when the source defines the event by SL. */
  hpfIsEstimate: z.boolean().default(false),
  slMm: z.number().positive().nullable().default(null),
  /** true for every D8 row. */
  canonical: z.boolean().default(false),
})
export type EventRecord = z.infer<typeof EventRecord>

export const GrowthPoint = z.strictObject({
  hpf: Hpf,
  lengthMm: z.number().positive(),
  /** EL: Kimmel embryo length, egg diameter to 10 hpf; TL: total length, 1.2 x SL from 1080 hpf. */
  measure: LengthMeasure,
  /** What lengthMm measures, review B10: ED before the embryonic axis, then EL, then TL. */
  lengthMeasure: RowLengthMeasure.optional(),
  /** null before 72 hpf; derived, see DM-18. */
  standardLengthMm: z.number().positive().nullable(),
  source: z.string().min(1),
  estimate: z.boolean(),
})
export type GrowthPoint = z.infer<typeof GrowthPoint>

export const TimeAxisSegment = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  startHpf: Hpf,
  endHpf: Hpf,
  /** D7: 0.18, 0.12, 0.22, 0.10, 0.16, 0.14, 0.08 */
  share: z.number().min(0).max(1),
})
export type TimeAxisSegment = z.infer<typeof TimeAxisSegment>

export const HeadlineTick = z.strictObject({
  hpf: Hpf,
  label: z.string().min(1),
  /** null for 180 dpf. */
  zfs: ZfsId.nullable(),
})
export type HeadlineTick = z.infer<typeof HeadlineTick>

export const TimeAxis = z.strictObject({
  domainHpf: z.tuple([z.literal(0), z.literal(4320)]),
  segments: z.array(TimeAxisSegment).length(7),
  headlineTicks: z.array(HeadlineTick).length(18),
  minTickGapPx: z.literal(8),
  playbackTrackSeconds: z.literal(60),
})
export type TimeAxis = z.infer<typeof TimeAxis>

export const StagesFile = z.strictObject({
  meta: z.strictObject({
    /** "2026-07-16" from the zfa.obo header. */
    zfaRelease: z.string(),
    temperatureC: z.literal(28.5),
    generated: z.string(),
    notes: z.array(z.string()).default([]),
  }),
  stages: z.array(StageRecord).length(NAMED_STAGE_COUNT),
  periods: z.array(PeriodRecord).length(10),
  events: z.array(EventRecord),
  growth: z.array(GrowthPoint).min(2),
  timeAxis: TimeAxis,
})
export type StagesFile = z.infer<typeof StagesFile>
