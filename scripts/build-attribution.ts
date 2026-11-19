// Writes public/ATTRIBUTION.md from the attribution constant (DM-04, D14).
//
//   node scripts/build-attribution.ts [--check]
//
// Reads `attribution` and the licence allow-list from src/core/attribution.ts, so the
// script and the app state one set of licences (L-11).
// Every `license` field must be on the allow-list, and the ZFIN entries must
// state both CC BY 3.0 (ontology files) and CC BY 4.0 (database content).
// `--check` exits 1 when the committed file differs from the generated text.
//
// PLANNED_SOURCES below is owned by this script (WP-H3), not by
// src/core/attribution.ts: it lists a future real-data source that ships in
// no version yet, so it never joins the licence check or the shipped
// `sources` list, and it renders under its own "not yet used" section
// regardless of what src/core/attribution.ts states.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALLOWED_LICENSES, NOTICES_FILE, attribution } from '../src/core/attribution.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = resolve(repoRoot, 'public/ATTRIBUTION.md')

const REQUIRED_ZFIN_LICENCES = ['CC BY 3.0', 'CC BY 4.0']

type Source = { holder: string; license: string; licenseUrl: string; text: string; footer?: string }
type Citation = { key: string; text: string; doi?: string; use?: string }
/** The shape this script reads out of `attribution`; the module's own type is the source of truth. */
type Attribution = {
  zfaRelease?: string
  citations?: readonly Citation[]
  notes?: readonly string[]
  readonly [key: string]: unknown
}

/**
 * A source for the future real-data layer (docs/research/08-zebrahub-imaging-data.md), not
 * used by any shipped structure or mesh yet. Add the matching text block from that research
 * file's section 8 to this list, and move the citation into `Attribution.citations`, on the day
 * a Zebrahub-derived mesh actually ships.
 */
const PLANNED_SOURCES: Citation[] = [
  {
    key: 'Lange2024',
    text:
      'Lange M, Granados A, VijayKumar S, Bragantini J, Ancheta S, Kim YJ, et al. A multimodal ' +
      'zebrafish developmental atlas reveals the state-transition dynamics of late-vertebrate ' +
      'pluripotent axial progenitors. Cell 2024;187(23):6742-6759.e17.',
    doi: '10.1016/j.cell.2024.09.047',
    use:
      'Not yet used. Zebrahub light-sheet imaging (Royer group, Chan Zuckerberg Biohub San ' +
      'Francisco), version of record CC BY 4.0. A future real-data layer would derive body-outline ' +
      'meshes for the gastrula and segmentation stages from the ZMNS001 time-lapse; no such mesh ' +
      'ships in this version.',
  },
]

function isSource(x: unknown): x is Source {
  return typeof x === 'object' && x !== null && typeof (x as Source).license === 'string' && typeof (x as Source).holder === 'string'
}

/** Every object with `holder` and `license`, in declaration order. */
function sourcesOf(a: Attribution): Source[] {
  return Object.values(a).filter(isSource)
}

function checkLicences(sources: Source[]): string[] {
  const problems: string[] = []
  for (const s of sources) {
    if (!ALLOWED_LICENSES.some((ok) => s.license === ok)) problems.push(`licence "${s.license}" of "${s.holder}" is not in the allow-list ${ALLOWED_LICENSES.join(', ')}`)
  }
  const zfin = sources.filter((s) => /zfin|zebrafish/i.test(s.holder))
  for (const need of REQUIRED_ZFIN_LICENCES) {
    if (!zfin.some((s) => s.license === need)) problems.push(`D14 requires a ZFIN entry with licence ${need}`)
  }
  return problems
}

export function renderMarkdown(a: Attribution): string {
  const lines: string[] = ['# Attribution', '']
  lines.push('This atlas is a schematic, procedural model. Its anatomy terms and stage table come from the sources below.', '')
  lines.push('## Data sources', '')
  for (const s of sourcesOf(a)) {
    lines.push(`### ${s.holder}`, '', `Licence: [${s.license}](${s.licenseUrl})`, '', s.text, '')
  }
  if (a.zfaRelease) lines.push(`ZFA and ZFS release: ${a.zfaRelease}.`, '')
  const citations = a.citations ?? []
  if (citations.length > 0) {
    lines.push('## Literature', '')
    for (const c of citations) {
      const doi = c.doi ? ` https://doi.org/${c.doi}` : ''
      const use = c.use ? ` Used for: ${c.use}.` : ''
      lines.push(`- ${c.text}${doi}${use}`)
    }
    lines.push('')
  }
  const notes = a.notes ?? []
  if (notes.length > 0) {
    lines.push('## Notes', '')
    for (const n of notes) lines.push(`- ${n}`)
    lines.push('')
  }
  if (PLANNED_SOURCES.length > 0) {
    lines.push('## Planned data (not yet used)', '')
    for (const c of PLANNED_SOURCES) {
      const doi = c.doi ? ` https://doi.org/${c.doi}` : ''
      const use = c.use ? ` ${c.use}` : ''
      lines.push(`- ${c.text}${doi}${use}`)
    }
    lines.push('')
  }
  lines.push('## Code', '', 'The application code is MIT licensed; see LICENSE in the repository.', '')
  lines.push(`The atlas bundles third-party packages. Their licences and notices are in \`${NOTICES_FILE}\`, beside this file in the built site.`, '')
  return lines.join('\n')
}

async function main(): Promise<number> {
  const check = process.argv.includes('--check')
  const data: Attribution = attribution
  const origin = 'src/core/attribution.ts'
  const problems = checkLicences(sourcesOf(data))
  for (const p of problems) console.error(`attribution: ${p}`)
  if (problems.length > 0) return 1
  const text = renderMarkdown(data)
  if (check) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : ''
    if (current !== text) {
      console.error(`attribution: ${outPath} is out of date; run node scripts/build-attribution.ts`)
      return 1
    }
    console.log(`attribution: ${outPath} is up to date (${origin})`)
    return 0
  }
  writeFileSync(outPath, text)
  console.log(`attribution: wrote ${outPath} from ${origin} (${sourcesOf(data).length} sources)`)
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`attribution: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
