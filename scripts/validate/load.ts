import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
import type { Report } from './report.ts'
import type { AtlasFiles, FileKey } from './types.ts'
import { FILE_KEYS } from './types.ts'

export type LoadedFiles = {
  raw: Partial<Record<FileKey, unknown>>
  paths: Partial<Record<FileKey, string>>
  /** The JSON files read for a key that resolved to a directory. */
  files: Partial<Record<FileKey, string[]>>
}

/**
 * Read order inside a split directory, the order of the matching all.ts: the group nodes,
 * then the D5 systems. Files outside the list follow in name order.
 */
const SPLIT_ORDER: Partial<Record<FileKey, string[]>> = {
  structures: [
    'groups', 'early_embryo', 'axial', 'nervous', 'sensory', 'cardiovascular', 'hematopoietic_immune',
    'respiratory', 'digestive', 'excretory', 'endocrine', 'reproductive', 'skeletal', 'muscular', 'fins',
    'integument_pigment',
  ],
}

const isDir = (p: string): boolean => existsSync(p) && statSync(p).isDirectory()
const isFile = (p: string): boolean => existsSync(p) && statSync(p).isFile()

/**
 * Resolves each data key to a directory of JSON arrays or to one file. Candidates in order:
 * `<dataDir>/<name>/`, `<dataDir>/<name>.json`, `<dataDir>/<name>.fixture.json`, then
 * `<fallbackDir>/<name>/` and `<fallbackDir>/<name>.json`. The fixture directory holds only
 * the structures file; structures and handoffs are directories under src/data.
 */
export function resolveDataFiles(dataDir: string, fallbackDir: string): Partial<Record<FileKey, string>> {
  const paths: Partial<Record<FileKey, string>> = {}
  for (const key of FILE_KEYS) {
    const candidates: Array<[string, (p: string) => boolean]> = [
      [join(dataDir, key), isDir],
      [join(dataDir, `${key}.json`), isFile],
      [join(dataDir, `${key}.fixture.json`), isFile],
      [join(fallbackDir, key), isDir],
      [join(fallbackDir, `${key}.json`), isFile],
    ]
    const found = candidates.find(([p, test]) => test(p))
    if (found) paths[key] = found[0]
  }
  return paths
}

/** The JSON files of a split directory in read order. */
export function splitFiles(dir: string, key: FileKey): string[] {
  const names = readdirSync(dir).filter((n) => n.endsWith('.json')).sort()
  const first = (SPLIT_ORDER[key] ?? []).map((n) => `${n}.json`).filter((n) => names.includes(n))
  const rest = names.filter((n) => !first.includes(n))
  return [...first, ...rest].map((n) => join(dir, n))
}

function parseJsonFile(path: string, key: FileKey, report: Report): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown
  } catch (e) {
    report.error('E001', key, '', `cannot parse ${path}: ${(e as Error).message}`)
    return undefined
  }
}

/** Reads the JSON files; a missing or unparsable file, or a split file that is not an array, is an E001 finding. */
export function readDataFiles(paths: Partial<Record<FileKey, string>>, report: Report): LoadedFiles {
  const raw: Partial<Record<FileKey, unknown>> = {}
  const files: Partial<Record<FileKey, string[]>> = {}
  for (const key of FILE_KEYS) {
    const path = paths[key]
    if (!path) {
      report.error('E001', key, '', `${key}.json not found`)
      continue
    }
    if (!isDir(path)) {
      const value = parseJsonFile(path, key, report)
      if (value !== undefined) raw[key] = value
      continue
    }
    const parts = splitFiles(path, key)
    files[key] = parts
    if (parts.length === 0) {
      report.error('E001', key, '', `${path} holds no JSON files`)
      continue
    }
    const rows: unknown[] = []
    let ok = true
    for (const part of parts) {
      const value = parseJsonFile(part, key, report)
      if (value === undefined) ok = false
      else if (!Array.isArray(value)) {
        report.error('E001', key, '', `${part} is not a JSON array`)
        ok = false
      } else rows.push(...(value as unknown[]))
    }
    if (ok) raw[key] = rows
  }
  return { raw, paths, files }
}

type ZodLike = { safeParse: (x: unknown) => z.ZodSafeParseResult<unknown> }

/** Named export of the record schema per file, used when the module has no ROOT_SCHEMAS map. */
const ROOT_SCHEMA: Record<FileKey, { name: string; array: boolean }> = {
  systems: { name: 'SystemRecord', array: true },
  stages: { name: 'StagesFile', array: false },
  structures: { name: 'StructureRecord', array: true },
  handoffs: { name: 'HandoffRecord', array: true },
  body: { name: 'BodyFile', array: false },
}

/** The file-level schema: `ROOT_SCHEMAS[key]` of src/core/schema.ts, else the named record schema wrapped in an array. */
function rootSchemaFor(schema: SchemaModule, key: FileKey): ZodLike | null {
  const roots = schema.ROOT_SCHEMAS
  if (typeof roots === 'object' && roots !== null) {
    const fileSchema = (roots as Record<string, unknown>)[key]
    if (isZodLike(fileSchema)) return fileSchema
  }
  const record = schema[ROOT_SCHEMA[key].name]
  if (!isZodLike(record)) return null
  return ROOT_SCHEMA[key].array ? z.array(record as z.ZodType) : record
}

export type SchemaModule = Record<string, unknown>

/** Imports src/core/schema.ts by file URL, so a missing module is a finding and not a crash. */
export async function importSchema(repoRoot: string, report: Report): Promise<SchemaModule | null> {
  const path = resolve(repoRoot, 'src/core/schema.ts')
  if (!existsSync(path)) {
    report.error('E001', 'schema', '', `${path} not found; zod parse skipped`)
    return null
  }
  try {
    return (await import(pathToFileURL(path).href)) as SchemaModule
  } catch (e) {
    report.error('E001', 'schema', '', `cannot import src/core/schema.ts: ${(e as Error).message}`)
    return null
  }
}

function isZodLike(x: unknown): x is ZodLike {
  return typeof x === 'object' && x !== null && typeof (x as ZodLike).safeParse === 'function'
}

/** Runs the root schema of each file (E001) and returns the parsed data with defaults applied. */
export function parseWithSchema(schema: SchemaModule | null, loaded: LoadedFiles, report: Report): Partial<AtlasFiles> {
  const out: Partial<Record<FileKey, unknown>> = {}
  for (const key of FILE_KEYS) {
    const raw = loaded.raw[key]
    if (raw === undefined) continue
    out[key] = raw
    if (!schema) continue
    const parser = rootSchemaFor(schema, key)
    if (!parser) {
      report.error('E001', key, '', `schema export ${ROOT_SCHEMA[key].name} is missing in src/core/schema.ts`)
      continue
    }
    const result = parser.safeParse(raw)
    if (result.success) {
      out[key] = result.data
      continue
    }
    for (const issue of result.error.issues.slice(0, 50)) {
      report.error('E001', key, issue.path.map(String).join('.'), issue.message)
    }
    if (result.error.issues.length > 50) {
      report.error('E001', key, '', `${result.error.issues.length - 50} more schema issues not shown`)
    }
  }
  return out as Partial<AtlasFiles>
}

/**
 * Writes the JSON Schema of each root schema to `<dir>/<file>.json` (DM-05). Uses
 * `jsonSchemaText` of src/core/jsonSchema.ts when that module exists, so the committed
 * files match the QP-15 test byte for byte; otherwise `z.toJSONSchema()` of the root.
 */
export async function emitJsonSchemas(
  schema: SchemaModule,
  repoRoot: string,
  dir: string,
  writeFile: (path: string, text: string) => void,
): Promise<string[]> {
  const helperPath = resolve(repoRoot, 'src/core/jsonSchema.ts')
  let textFor: ((name: string) => string) | null = null
  if (existsSync(helperPath)) {
    const helper = (await import(pathToFileURL(helperPath).href)) as { jsonSchemaText?: (name: string) => string }
    if (typeof helper.jsonSchemaText === 'function') textFor = helper.jsonSchemaText
  }
  const names = Array.isArray(schema.ATLAS_FILE_NAMES) ? (schema.ATLAS_FILE_NAMES as string[]) : [...FILE_KEYS]
  const written: string[] = []
  for (const name of names) {
    let text: string | null = null
    if (textFor) text = textFor(name)
    else {
      const root = rootSchemaFor(schema, name as FileKey)
      if (root) text = `${JSON.stringify(z.toJSONSchema(root as z.ZodType), null, 2)}\n`
    }
    if (text === null) continue
    const path = join(dir, `${name}.json`)
    writeFile(path, text)
    written.push(path)
  }
  return written
}
