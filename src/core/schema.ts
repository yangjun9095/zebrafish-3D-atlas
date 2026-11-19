// Entry point of the data schema: re-exports every record schema and parses the atlas files.
// Spec 3.2; AR-66 for the error shape. Core modules take data as arguments (AR-06).
import { z } from 'zod'
import { applyHandoffFallback } from './handoffFallback.ts'
import { BodyFile, HandoffsFile, KitsFile } from './schema/body.ts'
import { StagesFile } from './schema/stages.ts'
import { StructuresFile } from './schema/structure.ts'
import type { StructureRecord } from './schema/structure.ts'
import { SystemsFile } from './schema/shared.ts'
import type { SystemId, SystemRecord } from './schema/shared.ts'
import type { HandoffRecord, KitRecord } from './schema/body.ts'
import type { BodyFile as BodyFileT } from './schema/body.ts'
import type { StagesFile as StagesFileT } from './schema/stages.ts'

export * from './schema/shared.ts'
export * from './schema/stages.ts'
export * from './schema/params.ts'
export * from './schema/customParams.ts'
export * from './schema/segmentArray.ts'
export * from './schema/geometry.ts'
export * from './schema/structure.ts'
export * from './schema/body.ts'

export const ATLAS_FILE_NAMES = ['systems', 'stages', 'structures', 'body', 'handoffs', 'kits'] as const
export type AtlasFileName = (typeof ATLAS_FILE_NAMES)[number]

/** The root schema of each data file under src/data/. */
export const ROOT_SCHEMAS = {
  systems: SystemsFile,
  stages: StagesFile,
  structures: StructuresFile,
  body: BodyFile,
  handoffs: HandoffsFile,
  kits: KitsFile,
} as const

export interface AtlasIssue {
  /** Dotted path with array indices, for example "structures[3].geometry.keyframes[0].hpf". */
  path: string
  message: string
}

export interface AtlasParseError {
  file: AtlasFileName
  issues: AtlasIssue[]
}

/** Thrown by loaders that cannot return a result union. */
export class AtlasDataError extends Error {
  readonly file: AtlasFileName
  readonly issues: AtlasIssue[]
  constructor(error: AtlasParseError) {
    super(formatParseError(error))
    this.name = 'AtlasDataError'
    this.file = error.file
    this.issues = error.issues
  }
}

export interface AtlasRaw {
  systems: unknown
  stages: unknown
  structures: unknown
  body: unknown
  handoffs: unknown
  kits?: unknown
}

export interface AtlasData {
  systems: SystemRecord[]
  stages: StagesFileT
  structures: StructureRecord[]
  body: BodyFileT
  handoffs: HandoffRecord[]
  kits: KitRecord[]
  structuresById: Map<string, StructureRecord>
  systemsById: Map<SystemId, SystemRecord>
  /** Unresolved cross references. The validator turns them into E-rules; the app shows none. */
  warnings: string[]
  /** Records whose handoff retirement is deferred because no target record draws yet (handoffFallback.ts). */
  fallbackNotes: string[]
}

export type AtlasParseResult = { ok: true; data: AtlasData } | { ok: false; error: AtlasParseError }

export function formatIssuePath(path: ReadonlyArray<PropertyKey>): string {
  let out = ''
  for (const seg of path) {
    if (typeof seg === 'number') out += `[${seg}]`
    else out += out ? `.${String(seg)}` : String(seg)
  }
  return out
}

export function formatParseError(error: AtlasParseError): string {
  const head = `Could not parse ${error.file}.json`
  const lines = error.issues.slice(0, 3).map((i) => `  ${error.file}:${i.path || '<root>'}: ${i.message}`)
  return [head, ...lines].join('\n')
}

/** Parses one data file with its root schema. Issues carry the file name and the path. */
export function parseFile<N extends AtlasFileName>(
  file: N,
  raw: unknown,
): { ok: true; value: z.infer<(typeof ROOT_SCHEMAS)[N]> } | { ok: false; error: AtlasParseError } {
  const schema = ROOT_SCHEMAS[file]
  const result = schema.safeParse(raw)
  if (result.success) return { ok: true, value: result.data as z.infer<(typeof ROOT_SCHEMAS)[N]> }
  return {
    ok: false,
    error: {
      file,
      issues: result.error.issues.map((i) => ({ path: formatIssuePath(i.path), message: i.message })),
    },
  }
}

/**
 * Runs the six root schemas and builds the id maps. Unresolved references (uiParent,
 * handoff ids, derived sources) are warnings, because phase 1 ships a partial seed;
 * a duplicate id or a system that is not in systems.json is an error. A handoff whose
 * targets are not records yet keeps its source drawn (applyHandoffFallback).
 */
export function parseAtlasData(raw: AtlasRaw): AtlasParseResult {
  const systems = parseFile('systems', raw.systems)
  if (!systems.ok) return systems
  const stages = parseFile('stages', raw.stages)
  if (!stages.ok) return stages
  const structures = parseFile('structures', raw.structures)
  if (!structures.ok) return structures
  const body = parseFile('body', raw.body)
  if (!body.ok) return body
  const handoffs = parseFile('handoffs', raw.handoffs)
  if (!handoffs.ok) return handoffs
  const kits = parseFile('kits', raw.kits ?? [])
  if (!kits.ok) return kits

  const systemsById = new Map<SystemId, SystemRecord>()
  for (const s of systems.value) systemsById.set(s.id, s)

  const issues: AtlasIssue[] = []
  const seen = new Set<string>()
  structures.value.forEach((r, i) => {
    if (seen.has(r.id)) issues.push({ path: `[${i}].id`, message: `${r.id} appears more than once` })
    seen.add(r.id)
    if (!systemsById.has(r.system)) {
      issues.push({ path: `[${i}].system`, message: `${r.system} is not in systems.json` })
    }
  })
  if (issues.length > 0) return { ok: false, error: { file: 'structures', issues } }

  const fallback = applyHandoffFallback(structures.value, handoffs.value)
  const structuresById = new Map<string, StructureRecord>(fallback.structures.map((r) => [r.id, r]))
  const warnings = crossReferenceWarnings(fallback.structures, handoffs.value, structuresById)
  return {
    ok: true,
    data: {
      systems: systems.value,
      stages: stages.value,
      structures: fallback.structures,
      body: body.value,
      handoffs: handoffs.value,
      kits: kits.value,
      structuresById,
      systemsById,
      warnings,
      fallbackNotes: fallback.notes,
    },
  }
}

function crossReferenceWarnings(
  structures: StructureRecord[],
  handoffs: HandoffRecord[],
  byId: Map<string, StructureRecord>,
): string[] {
  const out: string[] = []
  for (const r of structures) {
    if (r.uiParent !== null && !byId.has(r.uiParent)) out.push(`structures:${r.id}: uiParent ${r.uiParent} is not a record`)
    if (r.geometry?.kind === 'derived' && !byId.has(r.geometry.sourceId)) {
      out.push(`structures:${r.id}: derived sourceId ${r.geometry.sourceId} is not a record`)
    }
  }
  for (const h of handoffs) {
    for (const id of [...h.from, ...h.to, h.driver]) {
      if (!byId.has(id)) out.push(`handoffs:${h.id}: ${id} is not a record`)
    }
  }
  return out
}
