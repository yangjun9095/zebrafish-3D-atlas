// Licensing surface (L-02, L-03, L-04, L-06, L-11): the generated third-party notices, the gate
// that keeps them fresh, and the three licence statements the audit asked for.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectNotices, renderNotices } from '../../scripts/build-notices.ts'
import { ALLOWED_LICENSES, EMBEDDED_ATTRIBUTION_ID, EMBEDDED_NOTICES_ID, NOTICES_FILE, attribution } from '../../src/core/attribution.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const noticesPath = join(repoRoot, 'public', NOTICES_FILE)
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>
  scripts: Record<string, string>
}

/**
 * The names in the production closure, read straight from the hoisted node_modules tree. It is a
 * second implementation of the walk in scripts/build-notices.ts, so the test fails when either
 * one drifts.
 */
function productionDependencyNames(): string[] {
  const names = new Set<string>()
  const queue = Object.keys(packageJson.dependencies)
  while (queue.length > 0) {
    const name = queue.shift() as string
    if (names.has(name)) continue
    const file = join(repoRoot, 'node_modules', name, 'package.json')
    if (!existsSync(file)) continue
    names.add(name)
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as { dependencies?: Record<string, string> }
    for (const dep of Object.keys(pkg.dependencies ?? {})) queue.push(dep)
  }
  return [...names].sort()
}

describe('third-party notices', () => {
  it('the generated file is in public/', () => {
    expect(existsSync(noticesPath)).toBe(true)
    expect(readFileSync(noticesPath, 'utf8').length).toBeGreaterThan(1000)
  })

  it('lists every production dependency with its version and licence', () => {
    const text = readFileSync(noticesPath, 'utf8')
    const notices = collectNotices(repoRoot)
    const missing = productionDependencyNames().filter((name) => !notices.some((n) => n.name === name))
    expect(missing).toEqual([])
    for (const n of notices) {
      expect(text).toContain(`${n.name} ${n.version}`)
      expect(n.license).not.toBe('not declared')
    }
    expect(notices.some((n) => n.name === 'three' && n.text.includes('three.js authors'))).toBe(true)
    expect(notices.some((n) => n.name === 'react' && n.text.includes('Permission is hereby granted'))).toBe(true)
  })

  it('records webgl-constants, which declares no licence field, as MIT from its LICENSE file', () => {
    const webgl = collectNotices(repoRoot).find((n) => n.name === 'webgl-constants')
    expect(webgl?.license).toBe('MIT')
    expect(webgl?.text).toContain('MIT License')
  })

  it('is up to date, which is what npm run notices -- --check reports', () => {
    expect(readFileSync(noticesPath, 'utf8')).toBe(renderNotices(collectNotices(repoRoot)))
  })

  it('the gate runs the notices check beside the attribution check', () => {
    expect(packageJson.scripts.notices).toBe('node scripts/build-notices.ts')
    expect(packageJson.scripts.gate).toContain('npm run attribution -- --check')
    expect(packageJson.scripts.gate).toContain('npm run notices -- --check')
  })
})

describe('attribution statements', () => {
  it('the ZFIN block names the Wiley-Liss permission and its limit (L-03)', () => {
    const text = attribution.zfin.text
    expect(text).toContain('Wiley-Liss')
    expect(text).toContain('not part of the ZFIN CC BY 4.0 grant')
    expect(text).toContain('states them in its own words')
  })

  it('the Kimmel citation names the fields the atlas reads (L-03)', () => {
    const kimmel = attribution.citations.find((c) => c.key === 'Kimmel1995')
    expect(kimmel?.use).toBe('stage times, embryo lengths and head-trunk angles read through the ZFIN staging pages')
  })

  it('the ontology block states how the atlas modifies the definitions on both paths (L-04)', () => {
    expect(attribution.ontology.text).toContain('removes the HTML markup, then keeps the first sentence of each definition')
    expect(attribution.ontology.text).toContain('cut at the last sentence end that fits')
    expect(attribution.ontology.text).toContain('221 record definitions')
    expect(attribution.ontology.text).toContain('Two of them are reworded')
    expect(attribution.ontology.text).toContain('ZFA:0000031')
    expect(attribution.ontology.text).toContain('ZFA:0009288')
  })

  it('every licence it states is on the one allow-list (L-11)', () => {
    for (const license of [attribution.zfin.license, attribution.ontology.license]) {
      expect(ALLOWED_LICENSES as readonly string[]).toContain(license)
    }
  })

  it('public/ATTRIBUTION.md carries the same statements and points at the notices', () => {
    const md = readFileSync(join(repoRoot, 'public/ATTRIBUTION.md'), 'utf8')
    expect(md).toContain('Wiley-Liss')
    expect(md).toContain('removes the HTML markup, then keeps the first sentence of each definition')
    expect(md).toContain('Two of them are reworded')
    expect(md).toContain(NOTICES_FILE)
  })

  it('scripts/bundle.ts embeds both files under the ids the UI reads (L-06)', () => {
    const bundle = readFileSync(join(repoRoot, 'scripts/bundle.ts'), 'utf8')
    expect(bundle).toContain('EMBEDDED_ATTRIBUTION_ID')
    expect(bundle).toContain('EMBEDDED_NOTICES_ID')
    expect(bundle).toContain('<script type="text/plain" id="${id}">')
    expect(EMBEDDED_ATTRIBUTION_ID).not.toBe(EMBEDDED_NOTICES_ID)
  })
})
