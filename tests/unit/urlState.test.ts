// QP-14: URL state round trip, per-key fallback, clamping and unknown ids.
import { describe, expect, it } from 'vitest'
import {
  TIME_CLAMPED_WARNING, URL_DEFAULTS, UrlState, camParam, hideParam, parseCam, parseSec, parseUrl, secParam, selIds, selParam, serializeUrl,
} from '../../src/core/urlState.ts'

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]
const id7 = (r: () => number) => String(Math.floor(r() * 9_000_000) + 1_000_000)

function randomState(r: () => number): UrlState {
  const state: UrlState = { ...URL_DEFAULTS }
  state.t = Number((r() * 4320).toFixed(2))
  if (r() < 0.6) state.sel = Array.from({ length: 1 + Math.floor(r() * 4) }, () => id7(r)).join(',')
  if (r() < 0.4) state.term = id7(r)
  state.v = pick(r, ['lat', 'dor', 'ven', 'ant', 'pos', 'tq'])
  if (r() < 0.4) {
    state.cam = Array.from({ length: 6 }, () => (r() * 20 - 10).toFixed(3))
      .map((s) => (s === '-0.000' ? '0.000' : s))
      .join(',')
  }
  if (r() < 0.5) state.hide = [pick(r, ['nervous', 'fins', 'axial']), id7(r)].slice(0, 1 + Math.floor(r() * 2)).join(',')
  state.xr = Math.floor(r() * 101)
  state.x = Math.floor(r() * 101)
  if (r() < 0.4) state.sec = `${pick(r, ['sag', 'fro', 'tra'])}:${(r() * 2 - 1).toFixed(2).replace('-0.00', '0.00')}${r() < 0.5 ? ':f' : ''}`
  state.iso = r() < 0.5 ? 1 : 0
  state.theme = pick(r, ['dark', 'light'])
  state.u = pick(r, ['hpf', 'dpf', 'auto'])
  if (r() < 0.5) state.snap = r() < 0.5 ? 1 : 0
  if (r() < 0.5) state.labels = r() < 0.5 ? 1 : 0
  state.temp = pick(r, [24, 25, 28.5, 30, 33])
  state.sex = pick(r, ['f', 'm'])
  state.embed = r() < 0.3 ? 1 : 0
  state.present = r() < 0.3 ? 1 : 0
  state.pin = r() < 0.3 ? 1 : 0
  state.ps = pick(r, ['1', '1.5', '2'])
  if (r() < 0.3) state.kit = `kit_${Math.floor(r() * 1000)}`
  return state
}

describe('defaults', () => {
  it('serialises the default state to an empty string', () => {
    expect(serializeUrl(URL_DEFAULTS)).toBe('')
    expect(parseUrl('').state).toEqual(URL_DEFAULTS)
    expect(parseUrl('?').warnings).toEqual([])
  })
  it('has the AR-45 defaults', () => {
    expect(URL_DEFAULTS.t).toBe(24)
    expect(URL_DEFAULTS.v).toBe('lat')
    expect(URL_DEFAULTS.xr).toBe(60)
    expect(URL_DEFAULTS.u).toBe('auto')
    expect(URL_DEFAULTS.temp).toBe(28.5)
    expect(URL_DEFAULTS.sex).toBe('f')
    expect(URL_DEFAULTS.ps).toBe('1')
    expect(URL_DEFAULTS.sel).toBeUndefined()
    expect(URL_DEFAULTS.theme).toBeUndefined()
  })
})

describe('round trip', () => {
  it('parse(serialize(state)) deep-equals state and serialize is canonical, over 200 seeded states', () => {
    const r = rng(20260906)
    for (let i = 0; i < 200; i++) {
      const state = randomState(r)
      const s = serializeUrl(state)
      const back = parseUrl(s)
      expect(back.warnings).toEqual([])
      expect(back.state).toEqual(state)
      expect(serializeUrl(back.state)).toBe(s)
      expect(s).not.toMatch(/ZFA:|\s/)
    }
  })
  it('rounds t to 2 decimals and cam to 3', () => {
    const s = serializeUrl({ ...URL_DEFAULTS, t: 24.567, cam: '1,2,3,4,5,-0.00004' })
    expect(s).toBe('t=24.57&cam=1.000,2.000,3.000,4.000,5.000,0.000')
  })
})

describe('per-key fallback (AR-46)', () => {
  it('falls back per key and keeps the valid keys', () => {
    const { state, warnings } = parseUrl('?t=abc&v=xx&xr=500&sel=12&theme=dark&u=dpf&ps=3')
    expect(state.t).toBe(24)
    expect(state.v).toBe('lat')
    expect(state.xr).toBe(60)
    expect(state.sel).toBeUndefined()
    expect(state.ps).toBe('1')
    expect(state.theme).toBe('dark')
    expect(state.u).toBe('dpf')
    expect(warnings).toHaveLength(5)
    expect(warnings[0]).toMatch(/^t:/)
  })
  it('clamps t and warns', () => {
    const high = parseUrl('t=9999')
    expect(high.state.t).toBe(4320)
    expect(high.warnings).toEqual([TIME_CLAMPED_WARNING])
    const low = parseUrl('t=-5')
    expect(low.state.t).toBe(0)
    expect(low.warnings).toEqual([TIME_CLAMPED_WARNING])
    expect(parseUrl('t=4320').warnings).toEqual([])
  })
  it('ignores unknown parameters', () => {
    const { state, warnings } = parseUrl('foo=1&bar=baz&t=30')
    expect(state.t).toBe(30)
    expect(warnings).toEqual([])
  })
  it('drops unknown structure ids and hide tokens with a warning (AR-47)', () => {
    const res = parseUrl('sel=0000114,9999999&hide=nervous,bogus,0000135', {
      structureIds: ['ZFA:0000114', 'ZFA:0000135'],
      systemIds: ['nervous', 'fins'],
    })
    expect(res.state.sel).toBe('0000114')
    expect(res.state.hide).toBe('nervous,0000135')
    expect(res.warnings).toContain('Structure ZFA:9999999 is not in this atlas')
    expect(res.warnings.some((w) => w.includes('bogus'))).toBe(true)
    const none = parseUrl('sel=9999999', { structureIds: ['ZFA:0000114'] })
    expect(none.state.sel).toBeUndefined()
  })
  it('rejects a sel list above 12 ids', () => {
    const sel = Array.from({ length: 13 }, (_, i) => String(1000000 + i)).join(',')
    const res = parseUrl(`sel=${sel}`)
    expect(res.state.sel).toBeUndefined()
    expect(res.warnings).toHaveLength(1)
  })
})

describe('the kit parameter (SEC-02)', () => {
  it('carries the token as an opaque string and caps it at 2 KB', () => {
    const token = 'eyJpZCI6ImsxIn0'
    expect(parseUrl(`kit=${token}`).state.kit).toBe(token)
    expect(parseUrl(`kit=${'a'.repeat(2048)}`).state.kit).toHaveLength(2048)
    const long = parseUrl(`kit=${'a'.repeat(2049)}`)
    expect(long.state.kit).toBeUndefined()
    expect(long.warnings).toHaveLength(1)
    expect(long.warnings[0]).toMatch(/^kit:/)
  })

  it('leaves the crafted payload of the audit to decodeKit', () => {
    // {"id":"k1","bookmarks":[{"cam":{"position":1,"target":2}}]}: a base64url string like any
    // other at this layer. src/state/slices/url.ts validates the JSON inside it.
    const crafted = 'eyJpZCI6ImsxIiwiYm9va21hcmtzIjpbeyJjYW0iOnsicG9zaXRpb24iOjEsInRhcmdldCI6Mn19XX0'
    const res = parseUrl(`kit=${crafted}`)
    expect(res.state.kit).toBe(crafted)
    expect(res.warnings).toEqual([])
  })
})

describe('helpers', () => {
  it('converts sel ids', () => {
    expect(selParam(['ZFA:0000114', 'ZFA:0000471'])).toBe('0000114,0000471')
    expect(selIds('0000114,0000471')).toEqual(['ZFA:0000114', 'ZFA:0000471'])
    expect(selParam([])).toBeUndefined()
  })
  it('caps sel at 12 ids but never hide', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `ZFA:${String(1000000 + i)}`)
    expect(selParam(ids)?.split(',')).toHaveLength(12)
    const hide = hideParam(['nervous', 'axial', ...ids])
    expect(hide?.split(',')).toHaveLength(22)
    expect(hide?.startsWith('nervous,axial,1000000')).toBe(true)
    expect(UrlState.shape.hide.safeParse(hide).success).toBe(true)
    expect(hideParam([])).toBeUndefined()
  })
  it('round-trips cam and sec', () => {
    const cam = { position: [1.5, -2, 3] as [number, number, number], target: [0, 0.25, 0] as [number, number, number] }
    expect(parseCam(camParam(cam))).toEqual(cam)
    expect(parseCam(undefined)).toBeNull()
    const sec = { axis: 'frontal' as const, position: -0.25, flip: true }
    expect(secParam(sec)).toBe('fro:-0.25:f')
    expect(parseSec(secParam(sec))).toEqual(sec)
    expect(UrlState.shape.sec.safeParse('sag:1.00').success).toBe(true)
    expect(UrlState.shape.sec.safeParse('sag:1.50').success).toBe(false)
  })
})
