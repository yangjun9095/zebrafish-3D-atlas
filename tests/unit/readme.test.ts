// The README's factual claims about the repository, checked against the repository (H6, C-15,
// M-04). The record counts drifted once already: the README said 215 records while the data
// held 221. These checks read the numbers from src/data/structures/ and fail when the prose and
// the data disagree. They also hold the two disclosure sentences in place and keep the internal
// hosting notes out of the public file.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const structuresDir = join(repoRoot, 'src/data/structures')

/** One line of prose out of a file that wraps its sentences: newlines and runs of spaces go. */
function flatten(text: string): string {
  return text.replace(/\s+/g, ' ')
}

const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
const readmeFlat = flatten(readme)
const about = flatten(readFileSync(join(repoRoot, 'src/ui/About.tsx'), 'utf8'))

interface RecordCounts {
  total: number
  withGeometry: number
  groupNodes: number
}

/** What src/data/structures/*.json actually holds right now. */
function countRecords(): RecordCounts {
  const counts: RecordCounts = { total: 0, withGeometry: 0, groupNodes: 0 }
  for (const file of readdirSync(structuresDir).filter((name) => name.endsWith('.json'))) {
    const records = JSON.parse(readFileSync(join(structuresDir, file), 'utf8')) as Array<{ geometry?: unknown }>
    for (const record of records) {
      // A group node carries geometry: null (spec 3.4); a drawn structure carries an object.
      counts.total += 1
      if (record.geometry === null || record.geometry === undefined) counts.groupNodes += 1
      else counts.withGeometry += 1
    }
  }
  return counts
}

/** The sentence the README top and the About sheet both carry, as one line. */
const DISCLOSURE = 'AI coding agents (Claude Code)'
const NON_ENDORSEMENT =
  'It is not a CZ Biohub product, and neither CZ Biohub nor ZFIN has reviewed or endorsed it.'

describe('README record counts', () => {
  it('quotes the counts src/data/structures/ holds', () => {
    const { total, withGeometry, groupNodes } = countRecords()
    expect(total).toBe(withGeometry + groupNodes)
    expect(readmeFlat).toContain(
      `${total} anatomy records in 15 systems (${withGeometry} drawn structures and ${groupNodes} group nodes)`,
    )
    expect(readmeFlat).toContain(`not only the ${total} modeled records`)
    expect(readmeFlat).toContain(`the ${total} ZFA ids`)
  })

  it('carries no count from an earlier version of the data', () => {
    const { total, withGeometry, groupNodes } = countRecords()
    const phrases: Array<[string, number]> = [
      ['anatomy records', total],
      ['drawn structures', withGeometry],
      ['group nodes', groupNodes],
    ]
    for (const [phrase, live] of phrases) {
      const written = [...readmeFlat.matchAll(new RegExp(`(\\d+) ${phrase}`, 'g'))].map((m) => Number(m[1]))
      expect(written.length).toBeGreaterThan(0)
      for (const value of written) expect(value).toBe(live)
    }
  })
})

describe('README disclosure', () => {
  it('names the build method above the fold', () => {
    expect(readmeFlat).toContain(DISCLOSURE)
    // Above the fold: inside the first 2000 characters, before the feature list.
    expect(readmeFlat.indexOf(DISCLOSURE)).toBeLessThan(readmeFlat.indexOf('## Features'))
  })

  it('carries the non-endorsement sentence', () => {
    expect(readmeFlat).toContain(NON_ENDORSEMENT)
    expect(readmeFlat).toContain('personal project by a scientist at Chan Zuckerberg Biohub San Francisco')
  })

  it('does not claim institutional support', () => {
    expect(readmeFlat).not.toContain('supported this work')
  })

  it('says the same two things in the About sheet', () => {
    expect(about).toContain(DISCLOSURE)
    expect(about).toContain(NON_ENDORSEMENT)
  })
})

describe('README hosting notes', () => {
  it('has no "Hosting (to revisit)" heading', () => {
    expect(readme).not.toContain('Hosting (to revisit)')
  })

  it('names no private artifact link and no account plan tier', () => {
    for (const internal of ['claude.ai', 'claude.site', 'Claude artifact', 'private link', 'plan tier']) {
      expect(readmeFlat).not.toContain(internal)
    }
  })

  it('points "Try it" at the hosted viewer and at the releases page', () => {
    expect(readmeFlat).toContain('**Try it:** open the hosted viewer at <https://zebrafish-3-d-atlas.vercel.app/>')
    expect(readmeFlat).toContain('https://github.com/yangjun9095/zebrafish-3D-atlas/releases')
  })

  it('no longer says that the viewer has no hosted page', () => {
    for (const stale of ['no hosted page yet', 'There is no hosted URL yet']) {
      expect(readmeFlat).not.toContain(stale)
    }
  })
})

/**
 * The MIT terms from "Permission is hereby granted" to the end, as one line. The text is written
 * out here, so an edit to LICENSE cannot also change what this test expects.
 */
const MIT_TERMS = [
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and',
  'associated documentation files (the "Software"), to deal in the Software without restriction,',
  'including without limitation the rights to use, copy, modify, merge, publish, distribute,',
  'sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is',
  'furnished to do so, subject to the following conditions:',
  'The above copyright notice and this permission notice shall be included in all copies or',
  'substantial portions of the Software.',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT',
  'NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND',
  'NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,',
  'DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
].join(' ')

describe('licence files', () => {
  it('LICENSE holds the MIT text and nothing else', () => {
    // GitHub compares the whole file with the MIT template. A scope note of four lines once stood
    // above the title, and GitHub then reported the licence as "Other". LICENSE-DATA and the
    // README carry that note now.
    const lines = readFileSync(join(repoRoot, 'LICENSE'), 'utf8').split('\n')
    expect(lines[0]).toBe('MIT License')
    expect(lines[1]).toBe('')
    expect(lines[2]).toMatch(/^Copyright \(c\) 2026 \S/)
    expect(lines[3]).toBe('')
    expect(flatten(lines.slice(4).join('\n')).trim()).toBe(MIT_TERMS)
  })

  it('LICENSE-DATA and the README state what the MIT licence does not cover', () => {
    const data = flatten(readFileSync(join(repoRoot, 'LICENSE-DATA'), 'utf8'))
    expect(data).toContain(
      'The MIT licence in `LICENSE` covers the source code of this repository. It does not cover the data files listed here.',
    )
    expect(readmeFlat).toContain(
      'Code: MIT ([`LICENSE`](LICENSE)). Data derived from ZFIN is CC BY 4.0 and the ontology files are CC BY 3.0',
    )
  })

  it('LICENSE-DATA states both ZFIN licences and the modification', () => {
    const data = flatten(readFileSync(join(repoRoot, 'LICENSE-DATA'), 'utf8'))
    expect(data).toContain('CC BY 4.0')
    expect(data).toContain('CC BY 3.0')
    expect(data).toContain('data/zfin/zfa.obo')
    expect(data).toContain('`src/data/vocabulary.json` keeps the first sentence of each definition')
  })

  it('CITATION.cff states the build method in its message', () => {
    const citation = flatten(readFileSync(join(repoRoot, 'CITATION.cff'), 'utf8'))
    expect(citation).toContain('AI coding agents (Claude Code)')
    expect(citation).toContain('no independent anatomist has reviewed it')
  })
})
