// Writes public/THIRD-PARTY-NOTICES.txt from the production dependency closure (L-02).
//
//   node scripts/build-notices.ts [--check]
//
// MIT, ISC, BSD and Apache-2.0 all ask for the copyright notice and the permission
// notice in every copy. The bundler strips the comments, so the notices ship in this
// file instead. The walk starts at the `dependencies` block of package.json and follows
// the `dependencies` block of each package it reaches, in node resolution order, so a
// nested install of a second version gets its own entry.
//
// `--check` exits 1 when the committed file differs from the generated text.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = resolve(repoRoot, 'public/THIRD-PARTY-NOTICES.txt')

/** LICENSE, LICENCE, LICENSE.md, LICENSE.txt, COPYING, NOTICE, in that order of preference. */
const NOTICE_FILE = /^(licen[cs]e|copying|notice)(\.(md|txt))?$/i

/**
 * Packages whose package.json declares no `license` field. webgl-constants 1.1.1 arrives
 * through detect-gpu and ships the MIT text in its LICENSE file (L-09).
 */
const LICENSE_BY_HAND: Record<string, string> = { 'webgl-constants': 'MIT' }

/** Read, but not run: the research note quotes it, and no line of it ships (L-05). */
const QUOTED_ONLY = [
  'human-atlas (https://github.com/ashemag/human-atlas)',
  'Licence: MIT, copyright 2026 ashemag',
  '',
  'docs/research/01-human-atlas-reference.md quotes short passages of this source while it',
  'describes the layout that the atlas answers to. No human-atlas code is in this repository',
  'and none ships in the product.',
].join('\n')

const RULE = '='.repeat(80)
const THIN_RULE = '-'.repeat(80)

export interface Notice {
  name: string
  version: string
  license: string
  /** Path of the notice file, relative to the repository root, or null when the package ships none. */
  file: string | null
  text: string
}

interface PackageJson {
  name?: string
  version?: string
  license?: string | { type?: string }
  licenses?: { type?: string }[]
  dependencies?: Record<string, string>
}

function readPackageJson(dir: string): PackageJson | null {
  const file = join(dir, 'package.json')
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8')) as PackageJson
}

/** node resolution: node_modules of the importer first, then of each directory above it. */
function resolvePackageDir(fromDir: string, name: string, root: string): string | null {
  let dir = fromDir
  for (;;) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return candidate
    if (dir === root) return null
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function licenseOf(name: string, pkg: PackageJson): string {
  const declared = typeof pkg.license === 'string' ? pkg.license : pkg.license?.type
  if (declared) return declared
  const legacy = pkg.licenses?.[0]?.type
  if (legacy) return legacy
  return LICENSE_BY_HAND[name] ?? 'not declared'
}

/** The notice file of a package, by the preference order of NOTICE_FILE. */
function noticeFileOf(dir: string): string | null {
  const names = readdirSync(dir).filter((n) => NOTICE_FILE.test(n))
  if (names.length === 0) return null
  const rank = (n: string) => (/^licen[cs]e$/i.test(n) ? 0 : /^licen[cs]e\./i.test(n) ? 1 : /^copying/i.test(n) ? 2 : 3)
  names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  return join(dir, names[0] as string)
}

/** Every package the `dependencies` blocks reach, one entry per name and version. */
export function collectNotices(root: string = repoRoot): Notice[] {
  const rootPkg = readPackageJson(root)
  if (!rootPkg) throw new Error(`no package.json in ${root}`)
  const found = new Map<string, Notice>()
  const queue: { name: string; fromDir: string }[] = Object.keys(rootPkg.dependencies ?? {}).map((name) => ({ name, fromDir: root }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const item = queue.shift() as { name: string; fromDir: string }
    const dir = resolvePackageDir(item.fromDir, item.name, root)
    if (dir === null) {
      console.warn(`notices: ${item.name} is not installed; run npm install`)
      continue
    }
    if (visited.has(dir)) continue
    visited.add(dir)
    const pkg = readPackageJson(dir)
    if (!pkg) continue
    const version = pkg.version ?? '0.0.0'
    const file = noticeFileOf(dir)
    found.set(`${item.name}@${version}`, {
      name: item.name,
      version,
      license: licenseOf(item.name, pkg),
      file: file === null ? null : relative(root, file).split(sep).join('/'),
      text: file === null ? '' : readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trimEnd(),
    })
    for (const dep of Object.keys(pkg.dependencies ?? {})) queue.push({ name: dep, fromDir: dir })
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
}

export function renderNotices(notices: Notice[]): string {
  const lines: string[] = [
    'Third-party notices for the Zebrafish 3D Atlas',
    RULE,
    '',
    'The atlas bundles the packages listed below. Each entry names the package, the version,',
    'the licence and the notice text the package ships. The application code itself is MIT',
    'licensed; see LICENSE. Data sources and their licences are in ATTRIBUTION.md.',
    '',
    'scripts/build-notices.ts writes this file from the production dependency closure of',
    'package.json. Run `npm run notices` after a dependency change. `npm run gate` fails when',
    'this file is out of date.',
    '',
    `Packages: ${notices.length}.`,
    '',
  ]
  for (const n of notices) {
    lines.push(RULE, `${n.name} ${n.version}`, `Licence: ${n.license}`)
    lines.push(n.file === null ? 'Notice: the package ships no licence file; the licence above comes from its package.json.' : `Notice: ${n.file}`)
    lines.push(THIN_RULE, '')
    if (n.text !== '') lines.push(n.text, '')
  }
  lines.push(RULE, 'Read while building the atlas, not used in it', THIN_RULE, '', QUOTED_ONLY, '')
  return lines.join('\n')
}

async function main(): Promise<number> {
  const check = process.argv.includes('--check')
  const notices = collectNotices()
  const undeclared = notices.filter((n) => n.license === 'not declared')
  for (const n of undeclared) console.warn(`notices: ${n.name} ${n.version} declares no licence`)
  const text = renderNotices(notices)
  if (check) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : ''
    if (current !== text) {
      console.error(`notices: ${outPath} is out of date; run node scripts/build-notices.ts`)
      return 1
    }
    console.log(`notices: ${outPath} is up to date (${notices.length} packages)`)
    return 0
  }
  writeFileSync(outPath, text)
  console.log(`notices: wrote ${outPath} (${notices.length} packages)`)
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`notices: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
