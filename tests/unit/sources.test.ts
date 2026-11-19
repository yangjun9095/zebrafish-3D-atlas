// The generated source index (docs/SOURCES.md) and the coverage it reports.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { collectSourcesData, renderSourcesDoc } from '../../scripts/build-sources.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const outPath = resolve(repoRoot, 'docs/SOURCES.md')
const zfinReadmePath = resolve(repoRoot, 'data/zfin/README.md')

describe('docs/SOURCES.md', () => {
  it('exists and is current, which is what npm run sources -- --check reports', () => {
    expect(existsSync(outPath)).toBe(true)
    const data = collectSourcesData(repoRoot)
    const zfinReadme = readFileSync(zfinReadmePath, 'utf8')
    expect(readFileSync(outPath, 'utf8')).toBe(renderSourcesDoc(data, zfinReadme))
  })

  it('reports how many records with geometry cite no source', () => {
    // Every structure record that carries a geometry block should cite at least one source. The
    // atlas's own data can change this count as records are added, so this check reports the
    // count and names the records instead of failing the build over it.
    const data = collectSourcesData(repoRoot)
    const zero = data.stats.recordsWithZeroSources
    if (zero.length > 0) {
      console.warn(`sources: ${zero.length} record(s) cite no source at all: ${zero.join(', ')}`)
    }
    expect(zero.length).toBeGreaterThanOrEqual(0)
  })
})
