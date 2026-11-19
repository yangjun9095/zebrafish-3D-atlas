// Data validation (D13, spec 3.8 and 6.3).
//
//   node scripts/validate-data.ts [--data <dir>] [--zfin <dir>] [--json <path>] [--strict] [--lenient-handoffs] [--emit-schema]
//
// Prints one line per finding as `<code> <file>:<id>: <text>`, then
// `validate: <n> records, <e> errors, <w> warnings`, and exits 1 when e > 0.
// The structure and handoff records are directories of JSON arrays (src/data/structures/,
// src/data/handoffs/). `--data <dir>` accepts a directory, one file or a fixture per key and
// falls back to src/data: `--data tests/fixtures` reads structures.fixture.json there and
// the other files from src/data. Rules that need WP-03's builders (E029, E036, W007)
// run when src/core/bodyModel.ts and src/core/primitives/buildStructure.ts exist.
// A handoff id that is not a record is the E021 error of spec 3.8 (the D9 records are
// complete since phase 2). `--lenient-handoffs` restores the phase 1 warning W011 for a
// data directory that is still being filled; `--strict-handoffs` is accepted and is the default.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { emitJsonSchemas, importSchema, parseWithSchema, readDataFiles, resolveDataFiles } from './validate/load.ts'
import { createReport, formatFinding } from './validate/report.ts'
import { checkBody } from './validate/rulesBody.ts'
import { checkBuilds } from './validate/rulesBuild.ts'
import { checkDerivedSources, checkHandoffs, resolveHandoffs, seededIds } from './validate/rulesHandoffs.ts'
import { checkKeyframes } from './validate/rulesKeyframes.ts'
import { checkStages, checkSystems } from './validate/rulesStages.ts'
import { checkCanonicalWindows, checkIdentity, indexRecords } from './validate/rulesStructures.ts'
import type { AtlasFiles } from './validate/types.ts'
import { FILE_KEYS } from './validate/types.ts'
import { loadZfin, missingZfinFiles } from './validate/zfin.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

type Options = { data: string; zfin: string; json: string | null; strict: boolean; strictHandoffs: boolean; emitSchema: boolean }

function parseArgs(argv: string[]): Options {
  const opts: Options = { data: 'src/data', zfin: 'data/zfin', json: null, strict: false, strictHandoffs: true, emitSchema: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--data') opts.data = argv[++i] ?? opts.data
    else if (a === '--zfin') opts.zfin = argv[++i] ?? opts.zfin
    else if (a === '--json') opts.json = argv[++i] ?? null
    else if (a === '--strict') opts.strict = true
    else if (a === '--strict-handoffs') opts.strictHandoffs = true
    else if (a === '--lenient-handoffs') opts.strictHandoffs = false
    else if (a === '--emit-schema') opts.emitSchema = true
    else if (a === '--help' || a === '-h') {
      console.log('usage: node scripts/validate-data.ts [--data <dir>] [--zfin <dir>] [--json <path>] [--strict] [--lenient-handoffs] [--emit-schema]')
      process.exit(0)
    } else {
      console.error(`unknown argument ${a}`)
      process.exit(2)
    }
  }
  return opts
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2))
  const report = createReport()
  const notices: string[] = []

  const zfinDir = resolve(repoRoot, opts.zfin)
  const missing = missingZfinFiles(zfinDir)
  if (missing.length > 0) {
    report.error('E001', 'zfin', '', `missing ${missing.join(', ')} under ${zfinDir}`)
    return finish(report, opts, 0, notices)
  }
  const zfin = loadZfin(zfinDir)

  const paths = resolveDataFiles(resolve(repoRoot, opts.data), resolve(repoRoot, 'src/data'))
  const loaded = readDataFiles(paths, report)
  for (const key of FILE_KEYS) {
    const path = paths[key]
    if (!path) continue
    const files = loaded.files[key]
    notices.push(files ? `${key}: ${path} (${files.length} files)` : `${key}: ${path}`)
  }
  const schema = await importSchema(repoRoot, report)
  const data = parseWithSchema(schema, loaded, report)

  if (opts.emitSchema && schema) {
    const dir = resolve(repoRoot, 'docs/schema')
    mkdirSync(dir, { recursive: true })
    for (const p of await emitJsonSchemas(schema, repoRoot, dir, writeFileSync)) notices.push(`wrote ${p}`)
  }

  if (FILE_KEYS.some((k) => data[k] === undefined)) return finish(report, opts, 0, notices)
  const atlas = data as AtlasFiles

  checkSystems(atlas.systems, zfin, report)
  checkStages(atlas.stages, zfin, report)
  checkBody(atlas.body, atlas.stages.growth, report)

  const records = indexRecords(atlas.structures, report)
  checkIdentity(records, atlas.systems, zfin, report)
  checkCanonicalWindows(records, report)
  const handoffs = resolveHandoffs(atlas, report)
  checkKeyframes(records, atlas.stages.timeAxis, seededIds(handoffs), report)
  checkHandoffs(handoffs, records, zfin, report, { strictHandoffs: opts.strictHandoffs })
  checkDerivedSources(records, report)
  notices.push(...(await checkBuilds(atlas, repoRoot, report)))

  return finish(report, opts, atlas.structures.length, notices)
}

function finish(report: ReturnType<typeof createReport>, opts: Options, records: number, notices: string[]): number {
  if (opts.strict) for (const f of report.findings) f.level = 'E'
  for (const f of report.findings) console.log(formatFinding(f))
  for (const n of notices) console.log(`note: ${n}`)
  const errors = report.count('E')
  const warnings = report.count('W')
  console.log(`validate: ${records} records, ${errors} errors, ${warnings} warnings`)
  if (opts.json) {
    const path = resolve(repoRoot, opts.json)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, `${JSON.stringify(report.findings, null, 2)}\n`)
  }
  return errors > 0 ? 1 : 0
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(`validate: crashed: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`)
    process.exit(1)
  },
)
