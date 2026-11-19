// The pure half of the movie tooling: the candidate rows, the capture hour picks, the CIELAB
// distance of the reporter palette, the contact-sheet order and the README tables. Nothing here
// starts a browser, runs ffmpeg or touches a file.
import { describe, expect, it } from 'vitest'
import { REPORTERS } from '../../src/core/fluorescence.ts'
import { buildCandidates, recordWindow, slugOf } from '../../scripts/movies/selection/candidates.ts'
import type { RecordInput } from '../../scripts/movies/selection/candidates.ts'
import {
  DEFAULT_HOUR_GRID, darkCandidates, emissiveHex, parseCandidateFile, pickHours, planCaptures, recheckHours,
  shotFileName,
} from '../../scripts/movies/selection/capture.ts'
import type { CaptureRow } from '../../scripts/movies/selection/capture.ts'
import { deltaE76, hexToLab, palettePairs } from '../../scripts/movies/palette-distance.ts'
import { colourSeriesPanels, drawtextEscape, sheetFilter, xstackLayout } from '../../scripts/movies/contact-sheet.ts'
import { greenSlotLabel, movieRow, movieTable, readmeLines, splitSeries } from '../../scripts/movies/write-readme.ts'
import { parseTissues } from '../../scripts/movies/render-all.ts'
import type { ManifestEntry } from '../../scripts/movies/render-all.ts'

/** Two records in the shape src/data/structures/ holds, and one part of the second. */
const PLACEHOLDER_RECORDS: RecordInput[] = [
  { id: 'ZFA:0000135', name: 'notochord', system: 'axial', visibleFromHpf: 10, modelEndHpf: 4320, endHpf: 4320 },
  { id: 'ZFA:0000114', name: "Kupffer's heart", system: 'cardiovascular', visibleFromHpf: 19, modelEndHpf: 4320, endHpf: 17520 },
  { id: 'ZFA:0000011', name: 'atrium', system: 'cardiovascular', uiParent: 'ZFA:0000114', visibleFromHpf: 22, modelEndHpf: 4320 },
  { id: 'ZFA:0001175', name: 'blastodisc', system: 'early_embryo', visibleFromHpf: 0, modelEndHpf: 4.66 },
]

describe('candidate rows', () => {
  it('keeps the records whose window meets the range', () => {
    const rows = buildCandidates(PLACEHOLDER_RECORDS, { fromHpf: 6, toHpf: 48 })
    expect(rows.map((r) => r.slug)).toEqual(['notochord', 'kupffers-heart', 'atrium'])
  })

  it('carries the ZFA id as the target and as the record', () => {
    const [notochord] = buildCandidates(PLACEHOLDER_RECORDS, { fromHpf: 0, toHpf: 48 })
    expect(notochord.targetId).toBe('ZFA:0000135')
    expect(notochord.recordId).toBe('ZFA:0000135')
    expect(notochord.fromHpf).toBe(10)
    expect(notochord.toHpf).toBe(4320)
  })

  it('sets includeParts on a record another record names as its uiParent', () => {
    const rows = buildCandidates(PLACEHOLDER_RECORDS, { fromHpf: 0, toHpf: 48 })
    const parts = new Map(rows.map((r) => [r.slug, r.includeParts]))
    expect(parts.get('kupffers-heart')).toBe(true)
    expect(parts.get('notochord')).toBe(false)
    expect(parts.get('atrium')).toBe(false)
  })

  it('lists a group as a row of its own kind with includeParts on', () => {
    const brain: RecordInput = { id: 'ZFA:0000008', group: true, name: 'brain', system: 'nervous', visibleFromHpf: 14, modelEndHpf: 4320 }
    const rows = buildCandidates([...PLACEHOLDER_RECORDS, brain], { fromHpf: 0, toHpf: 48 })
    const row = rows.find((r) => r.slug === 'brain')
    expect(row).toMatchObject({ kind: 'group', includeParts: true, targetId: 'ZFA:0000008', fromHpf: 14 })
    expect(rows.find((r) => r.slug === 'notochord')?.kind).toBe('record')
  })

  it('keeps only the systems asked for', () => {
    const rows = buildCandidates(PLACEHOLDER_RECORDS, { fromHpf: 0, toHpf: 48, systems: ['axial'] })
    expect(rows.map((r) => r.slug)).toEqual(['notochord'])
  })

  it('reads the window from modelEndHpf, then endHpf', () => {
    expect(recordWindow({ id: 'a', visibleFromHpf: 3, modelEndHpf: 144, endHpf: 720 })).toEqual({ fromHpf: 3, toHpf: 144 })
    expect(recordWindow({ id: 'a', visibleFromHpf: 3, endHpf: 720 })).toEqual({ fromHpf: 3, toHpf: 720 })
    expect(recordWindow({ id: 'a', endHpf: 720 })).toBeNull()
  })

  it('makes a slug a tissue list accepts', () => {
    expect(slugOf("Kupffer's vesicle")).toBe('kupffers-vesicle')
    expect(slugOf('Intermediate cell mass of mesoderm')).toBe('intermediate-cell-mass-of-mesoderm')
    expect(slugOf('pharyngeal arch 3-7')).toBe('pharyngeal-arch-3-7')
    expect(slugOf('notochord')).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/)
  })
})

describe('capture hours', () => {
  it('prefers 24 and 48 and adds the first hour of the window', () => {
    expect(pickHours(10, 4320)).toEqual([12, 24, 48])
    expect(pickHours(0, 4320)).toEqual([3, 24, 48])
  })

  it('adds one middle hour when neither 24 nor 48 is inside the window', () => {
    expect(pickHours(4.66, 10)).toEqual([6, 7])
    expect(pickHours(0, 4.66)).toEqual([3])
  })

  it('never picks an hour outside the window or the range', () => {
    expect(pickHours(19, 4320, DEFAULT_HOUR_GRID, 36)).toEqual([24, 27])
    expect(pickHours(60, 4320)).toEqual([])
    expect(pickHours(10, 4320, [24, 48])).toEqual([24, 48])
  })

  it('shoots a dark candidate again at its onset and a few hours after', () => {
    expect(recheckHours({ fromHpf: 24, toHpf: 4320 }, [24, 48])).toEqual([27, 30])
    expect(recheckHours({ fromHpf: 14, toHpf: 4320 }, [16, 24, 48])).toEqual([14, 17, 20])
    expect(recheckHours({ fromHpf: 4.66, toHpf: 10 }, [6, 7, 9])).toEqual([4.66, 7.66])
    expect(recheckHours({ fromHpf: 24, toHpf: 4320 }, [24, 48], 48, [])).toEqual([])
  })

  it('groups the sweep by hour and keeps the candidates of --only', () => {
    const rows = buildCandidates(PLACEHOLDER_RECORDS, { fromHpf: 0, toHpf: 48 })
    const jobs = planCaptures(rows, { grid: [24, 48], rangeEnd: 48, only: ['notochord', 'kupffers-heart'] })
    expect(jobs.map((job) => job.t)).toEqual([24, 48])
    expect(jobs[0].candidates.map((c) => c.slug)).toEqual(['notochord', 'kupffers-heart'])
  })

  it('shoots a candidate with no grid hour inside its window at the range end', () => {
    const rows: Parameters<typeof planCaptures>[0] = [
      { slug: 'late', targetId: 'ZFA:0000001', recordId: 'ZFA:0000001', name: 'late', system: 'axial', kind: 'record', includeParts: false, fromHpf: 46, toHpf: 47 },
    ]
    expect(planCaptures(rows, { grid: [24, 48], rangeEnd: 48 })).toEqual([{ t: 48, candidates: rows }])
  })

  it('names one file per candidate and hour, with no dot', () => {
    expect(shotFileName('notochord', 48)).toBe('notochord_t48.png')
    expect(shotFileName('enveloping-layer', 4.66)).toBe('enveloping-layer_t4p66.png')
  })

  it('reads a candidates file as an object or as a bare array', () => {
    const rows = buildCandidates(PLACEHOLDER_RECORDS, { fromHpf: 0, toHpf: 48 })
    expect(parseCandidateFile({ toHpf: 48, candidates: rows }).rangeEnd).toBe(48)
    expect(parseCandidateFile(rows).candidates).toHaveLength(rows.length)
    expect(() => parseCandidateFile({})).toThrow(/no candidate array/)
  })

  it('finds the candidates that lit nothing at their first hour', () => {
    const row = (slug: string, t: number, litCount: number): CaptureRow => ({
      slug, targetId: 'ZFA:0000135', includeParts: false, fromHpf: 10, t, view: 'lat', ready: true,
      litCount, lit: [], file: `${slug}_t${t}.png`,
    })
    expect(darkCandidates([row('a', 24, 0), row('a', 48, 3), row('b', 24, 2)])).toEqual(['a'])
  })

  it('looks for the emissive hex of the reporter it lights', () => {
    expect(emissiveHex('egfp')).toBe('39f579')
  })
})

describe('reporter palette distance', () => {
  it('measures black to white as 100', () => {
    // The sRGB matrix and the D65 white point of the conversion leave white 4e-6 above 100.
    expect(deltaE76(hexToLab('#000000'), hexToLab('#FFFFFF'))).toBeCloseTo(100, 4)
  })

  it('puts a colour at the lightness and the hue CIELAB gives it', () => {
    const [l, a, b] = hexToLab('#FFFFFF')
    expect(l).toBeCloseTo(100, 4)
    expect(a).toBeCloseTo(0, 4)
    expect(b).toBeCloseTo(0, 4)
    expect(hexToLab(REPORTERS.egfp.hex)[1]).toBeLessThan(0)
  })

  it('keeps every pair of the current palette above 30', () => {
    const pairs = palettePairs()
    expect(pairs).toHaveLength(28)
    expect(pairs[0].distance).toBeGreaterThan(30)
    for (let i = 1; i < pairs.length; i++) expect(pairs[i].distance).toBeGreaterThanOrEqual(pairs[i - 1].distance)
  })
})

/** The manifest entries of a colour series, in the shape render-all.ts writes. */
function entry(movie: string, tissue: string, label: string, reporter: string): ManifestEntry {
  return {
    movie, tissue, label, targetId: 'ZFA:0000135', system: 'axial', why: null,
    reporter: reporter as ManifestEntry['reporter'],
    reporterName: REPORTERS[reporter as ManifestEntry['reporter']].name,
    frames: 600, fps: 30, seconds: 20, width: 1920, height: 1080,
    fromHpf: 0, toHpf: 48, litFromHpf: 10, litToHpf: 48, secondsPerFrame: 1.8,
    bytes: 2_340_000, sha256: 'a'.repeat(64),
  }
}

const PLACEHOLDER_TISSUES: unknown = [
  { slug: 'myotome', label: 'Myotome', targetId: 'ZFA:0001056', includeParts: false, fromHpf: 10.33, toHpf: 48, system: 'muscular', distinctRank: 1 },
  { slug: 'notochord', label: 'Notochord', targetId: 'ZFA:0000135', includeParts: false, fromHpf: 10, toHpf: 48, system: 'axial', distinctRank: 2 },
]

describe('contact sheet order', () => {
  it('takes the colour entries in palette order and the ranked tissue at the EGFP slot', () => {
    const entries = [
      entry('notochord_EGFP.mp4', 'notochord', 'Notochord', 'egfp'),
      entry('myotome_EGFP.mp4', 'myotome', 'Myotome', 'egfp'),
      entry('myotome_mCherry.mp4', 'myotome', 'Myotome', 'mcherry'),
      entry('notochord_mVenus.mp4', 'notochord', 'Notochord', 'mvenus'),
    ]
    // The palette's second slot is EGFP, so it takes the EGFP movie of the tissue ranked second
    // and leaves the EGFP movie of the tissue ranked first alone. mVenus is not in this palette.
    const panels = colourSeriesPanels(entries, parseTissues(PLACEHOLDER_TISSUES, 'placeholder'), ['mcherry', 'egfp'])
    expect(panels).toEqual([
      { movie: 'myotome_mCherry.mp4', label: 'Myotome, mCherry' },
      { movie: 'notochord_EGFP.mp4', label: 'Notochord, EGFP' },
    ])
  })

  it('leaves out a palette slot the manifest has no movie for', () => {
    const entries = [entry('myotome_mCherry.mp4', 'myotome', 'Myotome', 'mcherry')]
    const panels = colourSeriesPanels(entries, parseTissues(PLACEHOLDER_TISSUES, 'placeholder'), ['mcherry', 'mko2'])
    expect(panels).toHaveLength(1)
  })

  it('tiles four to a row', () => {
    expect(xstackLayout(4)).toBe('0_0|w0_0|w0+w1_0|w0+w1+w2_0')
    expect(xstackLayout(8)).toBe('0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0')
    expect(xstackLayout(2, 1)).toBe('0_0|0_h0')
  })

  it('draws the label only when a font is given', () => {
    const panels = [{ movie: 'a.mp4', label: 'Myotome, mCherry' }, { movie: 'b.mp4', label: 'Eye, mKO2' }]
    expect(sheetFilter(panels, null)).toBe('[0:v]scale=960:-1[t0];[1:v]scale=960:-1[t1];[t0][t1]xstack=inputs=2:layout=0_0|w0_0')
    expect(sheetFilter(panels, '/f.ttf')).toContain("drawtext=fontfile=/f.ttf:text='Myotome, mCherry'")
  })

  it('escapes a quote in a label', () => {
    expect(drawtextEscape("Kupffer's vesicle, EGFP")).toBe("Kupffer'\\''s vesicle, EGFP")
  })
})

describe('movies README', () => {
  const files = [
    { file: 'myotome_EGFP.mp4', bytes: 3_080_000, entry: entry('myotome_EGFP.mp4', 'myotome', 'Myotome', 'egfp') },
    { file: 'myotome_mCherry.mp4', bytes: 2_910_000, entry: entry('myotome_mCherry.mp4', 'myotome', 'Myotome', 'mcherry') },
    { file: 'wildtype_brightfield.mp4', bytes: 3_100_000 },
    { file: 'stray.mp4', bytes: 1_000 },
  ]

  it('writes one row per movie, with the lit window and the size', () => {
    expect(movieRow(files[0])).toBe('| `myotome_EGFP.mp4` | Myotome | ZFA:0000135 | EGFP | 10 to 48 | 3.08 |')
    expect(movieRow(files[2])).toBe('| `wildtype_brightfield.mp4` | | | | | 3.10 |')
    expect(movieTable([files[0]])).toEqual([
      '| File | Tissue | ZFA id | Reporter | Lit window (hpf) | MB |',
      '|---|---|---|---|---|---|',
      '| `myotome_EGFP.mp4` | Myotome | ZFA:0000135 | EGFP | 10 to 48 | 3.08 |',
    ])
  })

  it('splits the files into the series the README carries', () => {
    const series = splitSeries(files)
    expect(series.egfp.map((row) => row.file)).toEqual(['myotome_EGFP.mp4'])
    expect(series.colour.map((row) => row.file)).toEqual(['myotome_mCherry.mp4'])
    expect(series.wildtype.map((row) => row.file)).toEqual(['wildtype_brightfield.mp4'])
    expect(series.other.map((row) => row.file)).toEqual(['stray.mp4'])
  })

  it('carries the date, the file count, the green-slot tissue and the extras it was given', () => {
    const facts = { date: '2026-09-14', greenSlot: 'Median fin fold', extras: ['SHA256SUMS', 'superseded', 'notes.txt'] }
    const lines = readmeLines(splitSeries(files), facts)
    expect(lines[1]).toContain('Rendered on 2026-09-14')
    expect(lines.some((line) => line.startsWith('| Files | 1 EGFP, 1 colour series, 1 wild-type |'))).toBe(true)
    expect(lines.some((line) => line.startsWith('## Series 2: the 2 most distinct tissues'))).toBe(true)
    expect(lines.join('\n')).toContain('The green slot is the median fin fold, whose EGFP movie is in series 1')
    expect(lines.some((line) => line.startsWith('| `SHA256SUMS` |'))).toBe(true)
    expect(lines.some((line) => line.startsWith('| `superseded/` |'))).toBe(true)
    expect(lines.some((line) => line.includes('notes.txt'))).toBe(false)
    expect(lines.some((line) => line.includes('passed on'))).toBe(false)
  })

  it('names the ranked tissue whose palette slot is EGFP', () => {
    const tissues = parseTissues([
      { slug: 'heart', label: 'Heart', targetId: 'ZFA:0000114', fromHpf: 19, toHpf: 48, system: 'cardiovascular', distinctRank: 1 },
      { slug: 'notochord', label: 'Notochord', targetId: 'ZFA:0000135', fromHpf: 10, toHpf: 48, system: 'axial', distinctRank: 2 },
    ], 'placeholder')
    expect(greenSlotLabel(tissues, ['mcherry', 'egfp'])).toBe('Notochord')
    expect(greenSlotLabel(tissues, ['mcherry', 'mko2'])).toBeNull()
    expect(greenSlotLabel(tissues, ['mcherry', 'mko2', 'egfp'])).toBeNull()
  })

  it('leaves the green-slot sentence and the extras table out when it has neither', () => {
    const lines = readmeLines(splitSeries(files), { date: '2026-09-14', greenSlot: null, extras: [] })
    expect(lines.join('\n')).not.toContain('The green slot')
    expect(lines.some((line) => line.startsWith('## Other files here'))).toBe(false)
  })
})
