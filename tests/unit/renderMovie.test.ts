// The pure half of the movie pipeline: the frame schedule, the camera interpolation, the URL and
// file-name forms, the ffmpeg arguments, and the job plan of scripts/movies/render-all.ts. Nothing
// here starts a browser, a preview server or ffmpeg.
import { describe, expect, it } from 'vitest'
import { REPORTERS } from '../../src/core/fluorescence.ts'
import { decodeFluorescence } from '../../src/state/slices/url.ts'
import {
  CAMERA_KEY_HPF, DEFAULT_CREDIT, encodeFpToken, ffmpegArgs, fluorescenceConfigFor, frameCount, frameFileName,
  frameTimes, keyframeHpf, monotoneSpline, movieFileName, movieUrl, parseArgs, parseReporter, poseTrack, reporterIds,
  roundTo, splineAt,
} from '../../scripts/render-movie.ts'
import type { CameraKey, Vec3 } from '../../scripts/render-movie.ts'
import {
  DEFAULT_PALETTE_IDS, baseReporter, defaultPalette, litWindow, mergeManifest, parsePalette, parseTissues, plan,
  rankedTissues, selectJobs, assembleManifest,
} from '../../scripts/movies/render-all.ts'
import type { ManifestEntry, Tissue } from '../../scripts/movies/render-all.ts'

/** Two entries in the shape scripts/movies/tissues.json holds, so this test needs no data file. */
const PLACEHOLDER_TISSUES: unknown = [
  { slug: 'notochord', label: 'Notochord', targetId: 'ZFA:0000135', includeParts: false, fromHpf: 10, toHpf: 48, system: 'axial', distinctRank: 2 },
  { slug: 'heart', label: 'Heart', targetId: 'ZFA:0000114', includeParts: true, fromHpf: 19, toHpf: 48, system: 'cardiovascular', distinctRank: 1 },
]

const tissues = (): Tissue[] => parseTissues(PLACEHOLDER_TISSUES, 'placeholder')

describe('frame schedule', () => {
  it('turns 20 seconds at 30 fps into 600 frames', () => {
    expect(frameCount(20, 30)).toBe(600)
    expect(frameCount(2, 10)).toBe(20)
    expect(frameCount(0.01, 1)).toBe(1)
  })

  it('advances the time linearly with both ends included', () => {
    const times = frameTimes(0, 48, 600)
    expect(times).toHaveLength(600)
    expect(times[0]).toBe(0)
    expect(times[599]).toBe(48)
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1])
    expect(times[299]).toBeCloseTo((48 * 299) / 599, 2)
  })

  it('keeps one frame at the start of the span for a one-frame movie', () => {
    expect(frameTimes(19, 48, 1)).toEqual([19])
  })

  it('numbers the files so ffmpeg reads them in order', () => {
    expect(frameFileName(0)).toBe('frame-000001.png')
    expect(frameFileName(599)).toBe('frame-000600.png')
    const names = [0, 1, 2, 10, 599].map(frameFileName)
    expect([...names].sort()).toEqual(names)
  })

  it('rounds a time to the thousandth of an hour the body model memoises on', () => {
    expect(roundTo(1 / 3, 3)).toBe(0.333)
    expect(frameTimes(0, 48, 600).every((t) => Number(t.toFixed(3)) === t)).toBe(true)
  })
})

describe('camera keyframes', () => {
  it('measures the fit at the listed hours inside the span, both ends included', () => {
    expect(keyframeHpf(0, 48)).toEqual([...CAMERA_KEY_HPF])
    expect(keyframeHpf(19, 48)).toEqual([19, 24, 30, 36, 42, 48])
    expect(keyframeHpf(0, 6)).toEqual([0, 6])
    expect(keyframeHpf(20, 21)).toEqual([20, 21])
  })
})

describe('monotone cubic interpolation', () => {
  it('passes through every knot', () => {
    const xs = [0, 6, 10, 16, 24, 48]
    const ys = [0.6, 0.8, 1.4, 2.1, 2.9, 4.2]
    const spline = monotoneSpline(xs, ys)
    xs.forEach((x, i) => expect(splineAt(spline, x)).toBeCloseTo(ys[i], 12))
  })

  it('never overshoots a monotone series', () => {
    const xs = [0, 6, 10, 16, 19, 24, 30, 36, 42, 48]
    const ys = [0.7, 0.72, 0.75, 1.9, 2.4, 2.6, 2.9, 3.2, 3.5, 3.8]
    const spline = monotoneSpline(xs, ys)
    let previous = -Infinity
    for (let t = 0; t <= 48; t += 0.05) {
      const v = splineAt(spline, t)
      expect(v).toBeGreaterThanOrEqual(ys[0] - 1e-9)
      expect(v).toBeLessThanOrEqual(ys[ys.length - 1] + 1e-9)
      expect(v).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = v
    }
  })

  it('holds a constant series flat and holds the end value outside the knots', () => {
    const spline = monotoneSpline([0, 10, 20], [5, 5, 5])
    expect(splineAt(spline, 3)).toBe(5)
    expect(splineAt(spline, -4)).toBe(5)
    expect(splineAt(spline, 99)).toBe(5)
  })

  it('takes a single knot and refuses knots that do not increase', () => {
    expect(splineAt(monotoneSpline([7], [3]), 40)).toBe(3)
    expect(() => monotoneSpline([0, 0], [1, 2])).toThrow(/increase/)
    expect(() => monotoneSpline([0, 1], [1])).toThrow(/length/)
  })
})

describe('camera pose track', () => {
  /** A lateral rig: the camera sits on -z, the target walks along +x and the distance grows. */
  const keys: CameraKey[] = [
    { hpf: 0, position: [0.1, 0, -2], target: [0.1, 0, 0] },
    { hpf: 24, position: [0.9, 0.05, -6], target: [0.9, 0.05, 0] },
    { hpf: 48, position: [1.6, 0.1, -11], target: [1.6, 0.1, 0] },
  ]

  it('returns the measured pose at every key', () => {
    const track = poseTrack(keys)
    for (const key of keys) {
      const pose = track.at(key.hpf)
      pose.position.forEach((v, i) => expect(v).toBeCloseTo(key.position[i], 9))
      pose.target.forEach((v, i) => expect(v).toBeCloseTo(key.target[i], 9))
    }
  })

  it('keeps the view direction between the keys instead of drifting', () => {
    const track = poseTrack(keys)
    for (let t = 0; t <= 48; t += 0.5) {
      const pose = track.at(t)
      const d: Vec3 = [pose.position[0] - pose.target[0], pose.position[1] - pose.target[1], pose.position[2] - pose.target[2]]
      const len = Math.hypot(d[0], d[1], d[2])
      expect(d[0] / len).toBeCloseTo(0, 9)
      expect(d[1] / len).toBeCloseTo(0, 9)
      expect(d[2] / len).toBeCloseTo(-1, 9)
    }
  })

  it('moves the target and the distance without a jump between frames', () => {
    const track = poseTrack(keys)
    const times = frameTimes(0, 48, 600)
    let previousStep = 0
    for (let i = 1; i < times.length; i++) {
      const a = track.at(times[i - 1])
      const b = track.at(times[i])
      const step = Math.hypot(b.position[0] - a.position[0], b.position[1] - a.position[1], b.position[2] - a.position[2])
      // No frame moves the camera more than a tenth of the whole travel, and no step is more
      // than four times its predecessor: a refit jump shows up as both.
      expect(step).toBeLessThan(0.9)
      if (i > 1) expect(step).toBeLessThan(previousStep * 4 + 1e-6)
      previousStep = step
    }
  })

  it('takes a single key and refuses an empty list', () => {
    const track = poseTrack([keys[0]])
    expect(track.at(31).position).toEqual(keys[0].position)
    expect(() => poseTrack([])).toThrow(/at least one key/)
  })
})

describe('reporters and file names', () => {
  it('names the movie after the slug and the reporter display name', () => {
    expect(movieFileName('notochord', parseReporter('egfp')!)).toBe('notochord_EGFP.mp4')
    expect(movieFileName('heart', parseReporter('mcherry')!)).toBe('heart_mCherry.mp4')
  })

  it('validates a reporter id against the reporter table at run time', () => {
    expect(parseReporter('EGFP')).toBe('egfp')
    expect(parseReporter('not-a-reporter')).toBeNull()
    expect(reporterIds()).toEqual(Object.keys(REPORTERS))
    for (const id of reporterIds()) expect(parseReporter(id)).toBe(id)
  })
})

describe('the preview configuration in the URL', () => {
  const config = () => fluorescenceConfigFor({
    targetId: 'ZFA:0000114',
    reporter: parseReporter('egfp')!,
    includeParts: true,
    litFromHpf: 19,
    litToHpf: 48,
    context: 24,
  })

  it('writes one enabled rule over one target on the app default context', () => {
    const c = config()
    expect(c).toMatchObject({ version: 1, enabled: true, channel: 'all', context: 24 })
    expect(c.rules).toEqual([
      { id: 'movie', targetId: 'ZFA:0000114', includeParts: true, fromHpf: 19, toHpf: 48, reporter: 'egfp', enabled: true },
    ])
  })

  it('round-trips through the fp token the app reads', () => {
    const token = encodeFpToken(config())
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeFluorescence(token)).toEqual(config())
  })

  it('asks for the lateral view, the dark theme, the embed layout and no labels', () => {
    const params = new URLSearchParams(movieUrl({ token: 'abc', hpf: 19 }).slice(2))
    expect(Object.fromEntries(params)).toEqual({
      t: '19', v: 'lat', theme: 'dark', embed: '1', lab: '1', labels: '0', fp: 'abc',
    })
  })

  it('writes no rule for the wild-type movie and keeps the preview on, so the context alone is drawn', () => {
    const c = fluorescenceConfigFor({
      targetId: 'ZFA:0000135', reporter: parseReporter('egfp')!, includeParts: false,
      litFromHpf: 0, litToHpf: 48, context: 100, wildtype: true,
    })
    expect(c).toMatchObject({ version: 1, enabled: true, channel: 'all', context: 100, rules: [] })
    expect(decodeFluorescence(encodeFpToken(c))).toEqual(c)
  })
})

describe('ffmpeg arguments', () => {
  it('carry the H.264 settings of the movie spec', () => {
    const args = ffmpegArgs({ framesDir: '/frames', fps: 30, out: '/out/notochord_EGFP.mp4' })
    expect(args.join(' ')).toContain('-framerate 30')
    expect(args.join(' ')).toContain('-i /frames/frame-%06d.png')
    expect(args.join(' ')).toContain('-c:v libx264')
    expect(args.join(' ')).toContain('-crf 18')
    expect(args.join(' ')).toContain('-pix_fmt yuv420p')
    expect(args.join(' ')).toContain('-movflags +faststart')
    expect(args[args.length - 1]).toBe('/out/notochord_EGFP.mp4')
  })

  it('takes another quality factor', () => {
    expect(ffmpegArgs({ framesDir: '/f', fps: 10, out: '/o.mp4', crf: 23 }).join(' ')).toContain('-crf 23')
  })

  it('negates the frames only when asked, after the input and before the codec', () => {
    expect(ffmpegArgs({ framesDir: '/f', fps: 30, out: '/o.mp4' })).not.toContain('-vf')
    const args = ffmpegArgs({ framesDir: '/f', fps: 30, out: '/o.mp4', invert: true })
    const vf = args.indexOf('-vf')
    expect(args[vf + 1]).toBe('negate')
    expect(vf).toBeGreaterThan(args.indexOf('-i'))
    expect(vf).toBeLessThan(args.indexOf('-c:v'))
  })
})

describe('the command line', () => {
  it('fills the target and the slug for a wild-type movie and leaves both off otherwise', () => {
    const o = parseArgs(['--wildtype', '--invert', '--context', '100', '--name', 'wildtype_brightfield.mp4'])
    expect(o).toMatchObject({
      wildtype: true, invert: true, context: 100, slug: 'wildtype', targetId: 'ZFA:0000135',
      name: 'wildtype_brightfield.mp4', reporter: 'egfp',
    })
    const plain = parseArgs(['--target', 'ZFA:0000114', '--slug', 'heart', '--reporter', 'mcherry'])
    expect(plain).toMatchObject({ wildtype: false, invert: false, name: null, slug: 'heart', reporter: 'mcherry' })
  })

  it('keeps the defaults of the movie spec', () => {
    const o = parseArgs(['--target', 'ZFA:0000135', '--slug', 'notochord'])
    expect(o).toMatchObject({
      fromHpf: 0, toHpf: 48, litFromHpf: 0, litToHpf: 48, seconds: 20, fps: 30, width: 1920, height: 1080,
      context: 24, crf: 18, includeParts: false, keepFrames: false, credit: DEFAULT_CREDIT,
    })
  })
})

describe('the credit line', () => {
  it('names the model and the licence of the data', () => {
    expect(DEFAULT_CREDIT).toBe('Schematic model | data: ZFIN CC BY 4.0')
  })
})

describe('the tissue list', () => {
  it('reads the fields a tissue entry carries', () => {
    expect(tissues()[1]).toEqual({
      slug: 'heart', label: 'Heart', targetId: 'ZFA:0000114', includeParts: true,
      fromHpf: 19, toHpf: 48, system: 'cardiovascular', distinctRank: 1, why: null,
    })
  })

  it('takes the bare array and the { version, tissues } wrapper, and keeps the why line', () => {
    const rows = PLACEHOLDER_TISSUES as Record<string, unknown>[]
    const wrapped = parseTissues({ version: 1, tissues: [{ ...rows[1], why: 'A beating tube.' }] }, 'list')
    expect(wrapped).toHaveLength(1)
    expect(wrapped[0].slug).toBe('heart')
    expect(wrapped[0].why).toBe('A beating tube.')
  })

  it('names the entry and the field that is wrong', () => {
    expect(() => parseTissues({}, 'list')).toThrow(/array of tissue entries/)
    expect(() => parseTissues([{ slug: 'Heart' }], 'list')).toThrow(/list\[0\].*slug/s)
    expect(() => parseTissues([{ slug: 'heart', label: 'Heart', targetId: '114' }], 'list')).toThrow(/targetId/)
    expect(() => parseTissues([{ slug: 'heart', label: 'Heart', targetId: 'ZFA:0000114', system: 'x', fromHpf: 'soon' }], 'list')).toThrow(/fromHpf/)
  })

  it('treats a missing includeParts as true and a missing rank as unranked', () => {
    const parsed = parseTissues([{ slug: 'skin', label: 'Skin', targetId: 'ZFA:0000368', fromHpf: 0, toHpf: 48, system: 'integument_pigment' }], 'list')
    expect(parsed[0].includeParts).toBe(true)
    expect(parsed[0].distinctRank).toBeNull()
  })
})

describe('the job plan', () => {
  it('renders every tissue in the base reporter, then the ranked ones in the palette order', () => {
    const jobs = plan(tissues(), parsePalette(['mcherry', 'mko2']))
    expect(jobs.map((j) => j.file)).toEqual([
      'notochord_EGFP.mp4', 'heart_EGFP.mp4', 'heart_mCherry.mp4', 'notochord_mKO2.mp4',
    ])
    expect(jobs[2].tissue.slug).toBe('heart')
    expect(jobs[3].reporter).toBe('mko2')
  })

  it('keeps the palette colour of a ranked tissue when --only asks for that tissue alone', () => {
    const palette = parsePalette(['mcherry', 'mko2'])
    // notochord is rank 2: mKO2 in the full plan, and still mKO2 when it is the only tissue asked for.
    expect(selectJobs(tissues(), palette, ['notochord']).map((j) => j.file)).toEqual(['notochord_EGFP.mp4', 'notochord_mKO2.mp4'])
    expect(selectJobs(tissues(), palette, ['heart', 'notochord']).map((j) => j.file)).toEqual(plan(tissues(), palette).map((j) => j.file))
    expect(selectJobs(tissues(), palette, null)).toEqual(plan(tissues(), palette))
    expect(selectJobs(tissues(), palette, ['skin'])).toEqual([])
  })

  it('never plans the same output twice when a rank maps back to the base reporter', () => {
    const jobs = plan(tissues(), parsePalette(['egfp', 'mcherry']))
    expect(jobs.map((j) => j.file)).toEqual(['notochord_EGFP.mp4', 'heart_EGFP.mp4', 'notochord_mCherry.mp4'])
  })

  it('ranks by distinctRank and ignores an unranked tissue', () => {
    const list = [...tissues(), parseTissues([{ slug: 'skin', label: 'Skin', targetId: 'ZFA:0000368', fromHpf: 0, toHpf: 48, system: 'integument_pigment', distinctRank: null }], 'x')[0]]
    expect(rankedTissues(list, 8).map((t) => t.slug)).toEqual(['heart', 'notochord'])
    expect(rankedTissues(list, 1).map((t) => t.slug)).toEqual(['heart'])
  })

  it('keeps the default palette to reporters this build carries', () => {
    const ids = defaultPalette()
    expect(ids.length).toBeGreaterThan(0)
    expect(ids.length).toBeLessThanOrEqual(DEFAULT_PALETTE_IDS.length)
    for (const id of ids) expect(REPORTERS[id]).toBeDefined()
    expect(reporterIds()).toContain(baseReporter())
  })

  it('refuses a palette file with an id this build does not carry', () => {
    expect(() => parsePalette(['egfp', 'gfp-classic'])).toThrow(/gfp-classic/)
    expect(() => parsePalette('egfp')).toThrow(/array of reporter ids/)
  })
})

describe('the lit window of a job', () => {
  it('holds the tissue window inside the movie span', () => {
    const heart = tissues()[1]
    expect(litWindow(heart, 0, 48)).toEqual({ litFromHpf: 19, litToHpf: 48 })
    expect(litWindow(heart, 24, 48)).toEqual({ litFromHpf: 24, litToHpf: 48 })
    expect(litWindow(heart, 0, 12)).toEqual({ litFromHpf: 12, litToHpf: 12 })
  })
})

describe('the manifest', () => {
  const entry = (movie: string, bytes: number): ManifestEntry => ({ movie, bytes } as unknown as ManifestEntry)

  it('keeps an earlier run and replaces an entry the new run wrote again', () => {
    const merged = mergeManifest([entry('a_EGFP.mp4', 1), entry('b_EGFP.mp4', 2)], [entry('b_EGFP.mp4', 9)])
    expect(merged.map((e) => [e.movie, e.bytes])).toEqual([['a_EGFP.mp4', 1], ['b_EGFP.mp4', 9]])
  })

  it('assembles the entry files over the previous manifest and drops a movie that is gone', () => {
    const previous = [entry('a_EGFP.mp4', 1), entry('old_mCherry.mp4', 2)]
    const files = [entry('a_EGFP.mp4', 5), entry('c_mKO2.mp4', 3)]
    const present = (movie: string) => movie !== 'old_mCherry.mp4'
    expect(assembleManifest(previous, files, present).map((e) => [e.movie, e.bytes])).toEqual([['a_EGFP.mp4', 5], ['c_mKO2.mp4', 3]])
    expect(assembleManifest([], [], present)).toEqual([])
  })
})
