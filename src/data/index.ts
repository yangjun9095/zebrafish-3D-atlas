// The only module that imports the atlas JSON (AR-06). Everything else takes data as arguments.
// body.json is written by scripts/gen-body.ts. The structure and handoff records live in one
// file per system under structures/ and handoffs/; their all.ts modules concatenate them.
import bodyJson from './body.json' with { type: 'json' }
import { handoffsRaw } from './handoffs/all.ts'
import kitsJson from './kits.json' with { type: 'json' }
import stagesJson from './stages.json' with { type: 'json' }
import { structuresRaw } from './structures/all.ts'
import systemsJson from './systems.json' with { type: 'json' }
import { AtlasDataError, parseAtlasData } from '../core/schema.ts'
import type { AtlasData, AtlasParseResult, AtlasRaw } from '../core/schema.ts'
import { buildVocabulary } from '../core/vocabulary.ts'
import type { Vocabulary } from '../core/vocabulary.ts'
import { parseVocabularyFile } from '../core/vocabularySchema.ts'

export type { AtlasData, AtlasParseError, AtlasParseResult } from '../core/schema.ts'
export { AtlasDataError } from '../core/schema.ts'
export type { Vocabulary, VocabularyTerm } from '../core/vocabulary.ts'

/** The unparsed files, for scripts and tests that want the raw form. */
export const rawAtlas: AtlasRaw = {
  systems: systemsJson,
  stages: stagesJson,
  structures: structuresRaw,
  body: bodyJson,
  handoffs: handoffsRaw,
  kits: kitsJson,
}

/** Parses the six files once and returns the result union (AR-66). */
export function loadAtlasResult(): AtlasParseResult {
  return parseAtlasData(rawAtlas)
}

let cached: AtlasData | null = null

/** Parsed atlas data; throws AtlasDataError with file, path and message when a file fails. */
export function loadAtlas(): AtlasData {
  if (cached) return cached
  const result = loadAtlasResult()
  if (!result.ok) throw new AtlasDataError(result.error)
  cached = result.data
  return cached
}

let vocabulary: Promise<Vocabulary> | null = null

/**
 * The full ZFA vocabulary of D17, in its own chunk (the `vocabulary` group of vite.config.ts).
 * The dynamic import keeps the 750 kB file out of the first download and out of the atlas-data
 * chunk; the search field asks for it when the user first types. The promise is cached, so a
 * second call costs nothing. Rejects with an Error naming the first bad field.
 */
export function loadVocabulary(): Promise<Vocabulary> {
  vocabulary ??= import('./vocabulary.json', { with: { type: 'json' } }).then((module) => {
    const result = parseVocabularyFile(module.default)
    if (!result.ok) throw new Error(`vocabulary.json:${result.error.path}: ${result.error.message}`)
    return buildVocabulary(result.file)
  })
  return vocabulary
}
