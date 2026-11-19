// User-authored target patterns over the existing modeled ZFA hierarchy (D18).
// Colors are display colors, not calibrated spectra or enhancer predictions.
import { z } from 'zod'
import { hasMeshAt } from './presence.ts'
import type { Sex } from './presence.ts'
import type { AtlasData, StructureRecord } from './schema.ts'

/**
 * The reporter table. `hex` is a legible display color, not the color of `emissionNm`, and
 * `emissionNm` is the published emission peak of the protein. The viewer draws one color per
 * reporter and adds the colors of two reporters on one structure. It does not model the spectral
 * overlap of two peaks, so EGFP at 507 nm and mVenus at 528 nm combine as freely as any other pair.
 * iRFP670's peak sits in the near infrared, past visible red; its `hex` shows it as a magenta
 * pseudocolour, the convention microscopy software uses to display that channel. The eight hex
 * values are spaced in CIELAB so every pair reads apart on the FLUORESCENCE_BACKGROUND color.
 */
export const REPORTERS = {
  mtagbfp2: { name: 'mTagBFP2', hex: '#6384FF', emissionNm: 454 },
  mturquoise2: { name: 'mTurquoise2', hex: '#40DFFF', emissionNm: 474 },
  egfp: { name: 'EGFP', hex: '#39F579', emissionNm: 507 },
  mvenus: { name: 'mVenus', hex: '#FFF04A', emissionNm: 528 },
  mko2: { name: 'mKO2', hex: '#FFB020', emissionNm: 565 },
  mscarlet: { name: 'mScarlet', hex: '#FF6A2A', emissionNm: 594 },
  mcherry: { name: 'mCherry', hex: '#FF3B5C', emissionNm: 610 },
  irfp670: { name: 'iRFP670', hex: '#D65CFF', emissionNm: 670 },
} as const

type ReporterKey = keyof typeof REPORTERS
/** The reporter ids, read from REPORTERS, so the table and the schema cannot drift apart. */
export const REPORTER_IDS = Object.keys(REPORTERS) as [ReporterKey, ...ReporterKey[]]
export const ReporterId = z.enum(REPORTER_IDS)
export type ReporterId = z.infer<typeof ReporterId>

export const MAX_FLUORESCENCE_RULES = 24
/** The longest `fp` token this app reads. src/core/urlState.ts caps the URL key at the same number. */
export const MAX_FLUORESCENCE_TOKEN_CHARS = 16000
export const FLUORESCENCE_BACKGROUND = '#060C14'
/**
 * The whole-organism skin record (DM-31). A target list holds its descendants and never the record
 * itself: an emissive skin draws an opaque shell over every interior structure, and the x-ray
 * slider then controls nothing the reader can see.
 */
export const SKIN_RECORD_ID = 'ZFA:0001094'

let ruleSeq = 0
/**
 * A rule id for the rule editor. `crypto.randomUUID` is undefined on a plain-http host and
 * `npm run dev:lan` serves plain http, so this follows newKitId in src/state/slices/mode.ts: the
 * clock, a counter and four random characters. The result matches the FluorescenceRule id pattern.
 */
export function newRuleId(): string {
  ruleSeq += 1
  return `r_${Date.now().toString(36)}${ruleSeq.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

const hpf = z.number().min(0).max(4320)
export const FluorescenceRule = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,48}$/),
  targetId: z.string().regex(/^ZFA:\d{7}$/),
  includeParts: z.boolean().default(true),
  fromHpf: hpf,
  toHpf: hpf,
  reporter: ReporterId,
  enabled: z.boolean().default(true),
}).refine((r) => r.fromHpf <= r.toHpf, { message: 'End time must be at or after start time' })
export type FluorescenceRule = z.infer<typeof FluorescenceRule>
export const FluorescenceConfig = z.object({
  version: z.literal(1),
  enabled: z.boolean(),
  channel: z.enum(['all', ...ReporterId.options]),
  context: z.number().int().min(0).max(100),
  rules: z.array(FluorescenceRule).max(MAX_FLUORESCENCE_RULES),
}).refine((c) => new Set(c.rules.map((r) => r.id)).size === c.rules.length, { message: 'Rule IDs must be unique' })
export type FluorescenceConfig = z.infer<typeof FluorescenceConfig>
export function emptyFluorescence(): FluorescenceConfig {
  return { version: 1, enabled: false, channel: 'all', context: 24, rules: [] }
}

/** Snapshots use the same hundredth-hour precision as links. Ranges are inclusive. */
export function ruleActiveAt(rule: FluorescenceRule, t: number): boolean {
  const time = Math.round(t * 100) / 100
  return rule.enabled && time >= rule.fromHpf && time <= rule.toHpf
}

interface Hierarchy {
  /** uiParent id to its children, built once per atlas. */
  children: Map<string, StructureRecord[]>
  /** target id to its resolved list, for includeParts. */
  targets: Map<string, StructureRecord[]>
}
const hierarchyCache = new WeakMap<AtlasData, Hierarchy>()

function hierarchyOf(data: AtlasData): Hierarchy {
  const cached = hierarchyCache.get(data)
  if (cached) return cached
  const children = new Map<string, StructureRecord[]>()
  for (const record of data.structures) {
    if (!record.uiParent) continue
    const siblings = children.get(record.uiParent)
    if (siblings) siblings.push(record)
    else children.set(record.uiParent, [record])
  }
  const entry: Hierarchy = { children, targets: new Map() }
  hierarchyCache.set(data, entry)
  return entry
}

/** Only descendants of the chosen modeled term; never guess an ancestor or another cell type. */
export function fluorescenceTargets(data: AtlasData, targetId: string, includeParts: boolean): StructureRecord[] {
  const root = data.structuresById.get(targetId)
  if (!root) return []
  const drawable = (r: StructureRecord): boolean => Boolean(r.geometry) && r.id !== SKIN_RECORD_ID
  if (!includeParts) return drawable(root) ? [root] : []
  const { children, targets: cache } = hierarchyOf(data)
  const cached = cache.get(targetId)
  if (cached) return cached
  const queue = [root]
  // The validator forbids a cycle in uiParent, but a hand-written data set is cheap to guard against.
  const seen = new Set<string>()
  const targets: StructureRecord[] = []
  while (queue.length) {
    const record = queue.shift()!
    if (seen.has(record.id)) continue
    seen.add(record.id)
    if (drawable(record)) targets.push(record)
    const kids = children.get(record.id)
    if (kids) queue.push(...kids)
  }
  cache.set(targetId, targets)
  return targets
}

export type FluorescenceSignals = ReadonlyMap<string, readonly ReporterId[]>

interface SignalMemo {
  data: AtlasData
  config: FluorescenceConfig
  tick: number
  sex: Sex
  signals: FluorescenceSignals
}
let signalMemo: SignalMemo | null = null

/**
 * Union within a reporter: duplicate rules never manufacture extra brightness.
 *
 * The visual pass calls this on every frame with the same atlas, the same config object and the
 * same time, so the last answer is kept and returned again on a repeat call. The key is the
 * identity of `config`, which every writer replaces rather than mutates, plus the hundredth-hour
 * tick that ruleActiveAt already rounds to, plus the sex.
 */
export function resolveFluorescence(data: AtlasData, config: FluorescenceConfig, t: number, sex: Sex = 'female'): FluorescenceSignals {
  const tick = Math.round(t * 100)
  const memo = signalMemo
  if (memo && memo.data === data && memo.config === config && memo.tick === tick && memo.sex === sex) return memo.signals
  const signals = new Map<string, ReporterId[]>()
  if (config.enabled) {
    for (const rule of config.rules) {
      if (!ruleActiveAt(rule, t) || (config.channel !== 'all' && config.channel !== rule.reporter)) continue
      for (const record of fluorescenceTargets(data, rule.targetId, rule.includeParts)) {
        if (!hasMeshAt(record, t, { sex })) continue
        const channels = signals.get(record.id) ?? []
        if (!channels.includes(rule.reporter)) channels.push(rule.reporter)
        signals.set(record.id, channels)
      }
    }
  }
  signalMemo = { data, config, tick, sex, signals }
  return signals
}

/** Three named organs. The skin record is not among them, for the reason SKIN_RECORD_ID gives. */
export function exampleFluorescence(): FluorescenceConfig {
  return { ...emptyFluorescence(), enabled: true, rules: [
    { id: 'heart', targetId: 'ZFA:0000114', includeParts: true, fromHpf: 24, toHpf: 72, reporter: 'egfp', enabled: true },
    { id: 'liver', targetId: 'ZFA:0000123', includeParts: true, fromHpf: 48, toHpf: 120, reporter: 'mcherry', enabled: true },
    { id: 'spinal-cord', targetId: 'ZFA:0000075', includeParts: true, fromHpf: 24, toHpf: 120, reporter: 'egfp', enabled: true },
  ] }
}
