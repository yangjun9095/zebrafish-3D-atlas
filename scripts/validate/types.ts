// Structural types for the five data files, as spec section 3.2 defines them.
// The zod schemas in src/core/schema.ts are the source; these types let the
// rules read parsed JSON without importing the viewer code.

export type Level = 'E' | 'W'

export type Finding = {
  level: Level
  code: string
  file: string
  id: string
  message: string
}

export type Keyframe = { hpf: number; sizeRefSl?: number } & Record<string, unknown>

export type Geometry = {
  kind: string
  builder?: string
  keyframes: Keyframe[]
  geometryEndHpf?: number
  handoffOut?: string
  boundsMarginMm?: number
  sourceId?: string
  part?: string
} & Record<string, unknown>

export type SizeRow = {
  hpf: number
  stageLabel: string
  dimsMm: Record<string, number>
  counts: Record<string, number>
  anglesDeg: Record<string, number>
  source: string
  note?: string
  estimate?: boolean
}

export type AliasLink = { zfaId: string; name: string; fromHpf: number; toHpf: number }

export type StructureRecord = {
  id: string
  name: string
  synonyms: string[]
  system: string
  alsoIn?: string[]
  zfaParent: string | null
  uiParent: string | null
  parentRelation: 'part_of' | 'is_a' | 'develops_from' | 'grouping' | 'root'
  definition: string
  zfinStartStage: string
  zfinEndStage: string
  startHpf: number
  endHpf: number
  visibleFromHpf: number
  modelEndHpf: number
  overrideNote: string | null
  fadeInHpf: number
  fadeOutHpf: number
  laterality: string
  pickable?: boolean
  sexSpecific?: 'female' | 'male' | null
  aliasChain?: AliasLink[]
  events: { hpf: number; text: string }[]
  sizes: SizeRow[]
  colorOverride: { dark: string; light: string; opacity?: number } | null
  sources: string[]
  geometry: Geometry | null
}

export type SystemRecord = {
  id: string
  displayName: string
  zfaRoots: string[]
  paletteSlot: string
  color: { dark: string; light: string }
  icon: string
  order: number
}

export type StageRecord = {
  zfs: string
  zdb: string
  name: string
  shortLabel: string
  period: string
  startHpf: number
  endHpf: number
  headline: boolean
}

export type PeriodRecord = { id: string; zfs: string | null; startHpf: number; endHpf: number }

export type EventRecord = {
  id: string
  hpf: number
  label: string
  canonical?: boolean
  slMm?: number | null
  hpfIsEstimate?: boolean
}

export type GrowthPoint = {
  hpf: number
  lengthMm: number
  measure: 'EL' | 'TL' | 'SL'
  standardLengthMm: number | null
}

export type TimeAxis = {
  domainHpf: [number, number]
  segments: { id: string; label: string; startHpf: number; endHpf: number; share: number }[]
  headlineTicks: { hpf: number; label: string; zfs: string | null }[]
}

export type StagesFile = {
  meta: { zfaRelease: string; temperatureC: number; generated: string }
  stages: StageRecord[]
  periods: PeriodRecord[]
  events: EventRecord[]
  growth: GrowthPoint[]
  timeAxis: TimeAxis
}

export type HandoffWindow = { startHpf: number; endHpf: number } | { startSl: number; endSl: number }

export type HandoffRecord = {
  id: string
  from: string[]
  to: string[]
  window: HandoffWindow
  perSegment?: { delayHpf: number; lengthHpf: number }
  driver: string
  seed: string
  withinRecord?: boolean
  note: string
}

export type BodyKeyframe = {
  hpf: number
  stage: string
  regime: string
  bodyLengthMm: number
  axisLengthMm: number | null
  spine: [number, number, number][]
  profile: { u: number; hD: number; hV: number; hW: number }[]
} & Record<string, unknown>

export type BodyFile = { generatedBy: string; keyframes: BodyKeyframe[] }

export type AtlasFiles = {
  systems: SystemRecord[]
  stages: StagesFile
  structures: StructureRecord[]
  handoffs: HandoffRecord[]
  body: BodyFile
}

export type FileKey = keyof AtlasFiles

export const FILE_KEYS: FileKey[] = ['systems', 'stages', 'structures', 'handoffs', 'body']

export const ROOT_ID = 'ZFA:0001094'
export const UNKNOWN_STAGE = 'ZFS:0000000'
export const AXIS_END_HPF = 4320
