// QP-17 and AR-04: import extensions and erasable syntax across src, tests and scripts;
// JSON import attributes; no react, three or DOM in src/core.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function tsFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...tsFiles(p))
    else if (/\.(ts|tsx|mts)$/.test(name) && !name.endsWith('.d.ts')) out.push(p)
  }
  return out
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^;'"]*?from\s*['"]([^'"]+)['"]([^\n;]*)/g
const DYNAMIC_RE = /import\(\s*['"]([^'"]+)['"]\s*\)/g

function imports(src: string): Array<{ spec: string; tail: string }> {
  const out: Array<{ spec: string; tail: string }> = []
  for (const m of src.matchAll(IMPORT_RE)) out.push({ spec: m[1], tail: m[2] })
  for (const m of src.matchAll(DYNAMIC_RE)) out.push({ spec: m[1], tail: '' })
  return out
}

const files = [...tsFiles('src'), ...tsFiles('scripts'), ...tsFiles('tests')]

describe('files under src, scripts and tests', () => {
  it('exist for this package', () => {
    expect(files.some((f) => f.endsWith('schema.ts'))).toBe(true)
    expect(files.some((f) => f.includes('src/viewer/'))).toBe(true)
  })
  it.each(files)('%s uses .ts, .tsx, .json or .css relative imports with the JSON attribute (QP-03)', (file) => {
    const src = readFileSync(file, 'utf8')
    for (const { spec, tail } of imports(src)) {
      if (!spec.startsWith('.')) continue
      expect(spec, `${file}: ${spec}`).toMatch(/\.(ts|tsx|json|css)$/)
      if (spec.endsWith('.json')) expect(tail, `${file}: ${spec}`).toMatch(/with\s*\{\s*type:\s*['"]json['"]\s*\}/)
    }
  })
  it.each(files)('%s uses only erasable syntax (no enum, namespace, parameter properties)', (file) => {
    const src = readFileSync(file, 'utf8')
    expect(src, file).not.toMatch(/^\s*(export\s+)?(declare\s+)?(const\s+)?enum\s+\w/m)
    expect(src, file).not.toMatch(/^\s*(export\s+)?(declare\s+)?namespace\s+\w/m)
    expect(src, file).not.toMatch(/constructor\s*\([^)]*\b(public|private|protected|readonly)\s+\w+/)
  })
})

const coreFiles = tsFiles('src/core')
const BANNED = ['react', 'react-dom', 'three', '@react-three/', 'zustand']

describe('src/core imports no react, three or DOM (AR-04)', () => {
  it.each(coreFiles)('%s', (file) => {
    const src = readFileSync(file, 'utf8')
    const allowThree = file.endsWith('primitives/toBufferGeometry.ts')
    for (const { spec } of imports(src)) {
      for (const banned of BANNED) {
        const hit = spec === banned || spec.startsWith(banned + '/') || spec.startsWith(banned)
        if (banned === 'three' && allowThree) continue
        expect(hit, `${file} imports ${spec}`).toBe(false)
      }
    }
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(code, file).not.toMatch(/\b(document|window|navigator|localStorage|sessionStorage|requestAnimationFrame)\b\s*[.([]/)
    expect(code, file).not.toMatch(/\bHTML\w*Element\b/)
  })
  const JSON_IMPORTERS = ['src/data/index.ts', 'src/data/structures/all.ts', 'src/data/handoffs/all.ts']
  it('src/data/index.ts and the two all.ts modules are the only modules that import JSON', () => {
    for (const file of [...coreFiles, ...tsFiles('src/data')]) {
      const src = readFileSync(file, 'utf8')
      const jsonImports = imports(src).filter((i) => i.spec.endsWith('.json'))
      if (JSON_IMPORTERS.some((p) => file.endsWith(p))) expect(jsonImports.length, file).toBeGreaterThan(0)
      else expect(jsonImports, file).toEqual([])
    }
  })
})
