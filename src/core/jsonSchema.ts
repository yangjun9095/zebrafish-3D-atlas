// JSON Schema (draft 2020-12) for the six root schemas (DM-05). The zod module is the source;
// scripts/validate-data.ts --emit-schema writes these objects to docs/schema/<name>.json.
import { z } from 'zod'
import { ATLAS_FILE_NAMES, ROOT_SCHEMAS } from './schema.ts'
import type { AtlasFileName } from './schema.ts'

export type JsonSchemaObject = Record<string, unknown>

const TITLES: Record<AtlasFileName, string> = {
  systems: 'systems.json: the 15 canonical systems (D5)',
  stages: 'stages.json: stages, periods, events, growth table, time axis (D6, D7)',
  structures: 'structures.json: structure records with procedural geometry (D3, D5)',
  body: 'body.json: body model keyframes (BG-24)',
  handoffs: 'handoffs.json: topology handoffs (D9, BG-48)',
  kits: 'kits.json: starter slide kits (UI-45)',
}

/** The JSON Schema of one data file, as the file is written (defaults optional). */
export function jsonSchemaFor(name: AtlasFileName): JsonSchemaObject {
  const schema = z.toJSONSchema(ROOT_SCHEMAS[name], {
    target: 'draft-2020-12',
    io: 'input',
    reused: 'ref',
    unrepresentable: 'any',
  }) as JsonSchemaObject
  return { $id: `https://zebrafish-3d-atlas/schema/${name}.json`, title: TITLES[name], ...schema }
}

/** Every root schema keyed by file name; the writer serialises each with two-space indent. */
export function allJsonSchemas(): Record<AtlasFileName, JsonSchemaObject> {
  const out = {} as Record<AtlasFileName, JsonSchemaObject>
  for (const name of ATLAS_FILE_NAMES) out[name] = jsonSchemaFor(name)
  return out
}

/** Stable text form, so a committed file and a fresh emit compare byte for byte (QP-15). */
export function jsonSchemaText(name: AtlasFileName): string {
  return JSON.stringify(jsonSchemaFor(name), null, 2) + '\n'
}
