// StructureRecord (spec 3.2.5).
import { z } from 'zod'
import { GeometrySpec } from './geometry.ts'
import { Hex, Hpf, SystemId, ZfaId, ZfsId } from './shared.ts'

export const Laterality = z.enum(['midline', 'paired', 'left', 'right'])
export type Laterality = z.infer<typeof Laterality>
export const ParentRelation = z.enum(['part_of', 'is_a', 'develops_from', 'grouping', 'root'])
export type ParentRelation = z.infer<typeof ParentRelation>

/** Reference measurements, shown on the info card. */
export const SizeRow = z.strictObject({
  hpf: Hpf,
  stageLabel: z.string().min(1),
  /** lengths in mm: length, width, diameter, thickness, volumeMm3 */
  dimsMm: z.record(z.string(), z.number()),
  /** counts: count, countPerSide, cells, tiers, lines, archesPerSide */
  counts: z.record(z.string(), z.number()),
  /** angles: keys ending in Deg */
  anglesDeg: z.record(z.string(), z.number()),
  source: z.string().min(1),
  note: z.string().optional(),
  estimate: z.boolean().default(false),
  /** SL of the measured specimen when known */
  basisSL: z.number().positive().nullable().default(null),
})
export type SizeRow = z.infer<typeof SizeRow>

export const StructureEvent = z.strictObject({
  hpf: Hpf,
  text: z.string().min(1),
  source: z.string().optional(),
  /** true when the hour is read from a ZFA stage bin (DM-37) */
  estimate: z.boolean().default(false),
})
export type StructureEvent = z.infer<typeof StructureEvent>

/** ZFIN terms that name this record during a window. */
export const AliasLink = z.strictObject({
  zfaId: ZfaId,
  name: z.string().min(1),
  fromHpf: Hpf,
  toHpf: Hpf,
})
export type AliasLink = z.infer<typeof AliasLink>

export const ColorOverride = z.strictObject({
  dark: Hex,
  light: Hex,
  opacity: z.number().min(0).max(1).optional(),
})

export const StructureRecord = z.strictObject({
  id: ZfaId,
  /** equals the ZFIN label */
  name: z.string().min(1),
  synonyms: z.array(z.string()),
  system: SystemId,
  alsoIn: z.array(SystemId).default([]),
  /** resolves in anatomy_item.txt */
  zfaParent: ZfaId.nullable(),
  /** resolves in structures.json; null only for the root */
  uiParent: ZfaId.nullable(),
  /** relation between id and zfaParent */
  parentRelation: ParentRelation,
  definition: z.string(),
  zfinStartStage: ZfsId,
  zfinEndStage: ZfsId,
  startHpf: Hpf,
  endHpf: Hpf,
  visibleFromHpf: Hpf,
  modelEndHpf: Hpf,
  /** required when a window differs from ZFIN */
  overrideNote: z.string().nullable(),
  fadeInHpf: z.number().min(0),
  fadeOutHpf: z.number().min(0),
  laterality: Laterality,
  /** false: selectable from the tree and search only (AR-34) */
  pickable: z.boolean().default(true),
  /** drawn only while the sex toggle matches (DM-32) */
  sexSpecific: z.enum(['female', 'male']).nullable().default(null),
  aliasChain: z.array(AliasLink).default([]),
  events: z.array(StructureEvent),
  sizes: z.array(SizeRow),
  colorOverride: ColorOverride.nullable(),
  sources: z.array(z.string().min(1)).min(1),
  /** null for a group node */
  geometry: GeometrySpec.nullable(),
})
export type StructureRecord = z.infer<typeof StructureRecord>
/** The fields of a structure record as written in the JSON file, before defaults apply. */
export type StructureRecordInput = z.input<typeof StructureRecord>

export const StructuresFile = z.array(StructureRecord)
export type StructuresFile = z.infer<typeof StructuresFile>
