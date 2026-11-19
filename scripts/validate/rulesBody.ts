// E031: body.json keyframe checks (BG-25), and the comparison against a fresh
// run of scripts/gen-body.ts with the growth table of the stages file.

import { generateBodyFile } from '../gen-body.ts'
import type { GrowthPoint as CoreGrowthPoint } from '../../src/core/growth.ts'
import type { Report } from './report.ts'
import { num } from './report.ts'
import type { BodyFile, GrowthPoint } from './types.ts'

/** The nine profile stations of section 4.3.4 are fixed by count; the u values come from the file. */
export const PROFILE_STATIONS = 9

export function checkBody(body: BodyFile, growth: GrowthPoint[], report: Report): void {
  const file = 'body'
  const kfs = body.keyframes ?? []
  if (kfs.length === 0) {
    report.error('E031', file, '', 'no keyframes')
    return
  }
  let prevHpf = -1
  let prevAxis: number | null = null
  let prevLength: number | null = null
  for (const k of kfs) {
    const id = num(k.hpf)
    if (k.hpf <= prevHpf) report.error('E031', file, id, `hpf ${id} is not after ${num(prevHpf)}`)
    prevHpf = k.hpf

    const spine = k.spine ?? []
    if (spine.length < 7) report.error('E031', file, id, `spine has ${spine.length} control points, expected at least 7`)
    for (let i = 0; i < spine.length; i++) {
      const u = spine[i][0]
      if (i === 0 && u !== 0) report.error('E031', file, id, `spine[0].u is ${num(u)}, expected 0`)
      if (i === spine.length - 1 && u !== 1) report.error('E031', file, id, `last spine u is ${num(u)}, expected 1`)
      if (i > 0 && u <= spine[i - 1][0]) report.error('E031', file, id, `spine u ${num(u)} at index ${i} is not ascending`)
      if (!spine[i].every(Number.isFinite)) report.error('E031', file, id, `spine point ${i} is not finite`)
    }

    const profile = k.profile ?? []
    if (profile.length !== PROFILE_STATIONS) report.error('E031', file, id, `profile has ${profile.length} stations, expected ${PROFILE_STATIONS}`)
    for (const [i, p] of profile.entries()) {
      if (!(p.hD > 0 && p.hV > 0 && p.hW > 0)) report.error('E031', file, id, `profile station ${i} (u ${num(p.u)}) has a non-positive half-size`)
      if (i > 0 && p.u <= profile[i - 1].u) report.error('E031', file, id, `profile u ${num(p.u)} at station ${i} is not ascending`)
    }

    if (k.hpf >= 10) {
      if (prevLength !== null && k.bodyLengthMm < prevLength) report.error('E031', file, id, `bodyLengthMm falls from ${num(prevLength)} to ${num(k.bodyLengthMm)}`)
      if (k.axisLengthMm === null) report.error('E031', file, id, 'axisLengthMm is null after 10 hpf')
      else if (prevAxis !== null && k.axisLengthMm < prevAxis) report.error('E031', file, id, `axisLengthMm falls from ${num(prevAxis)} to ${num(k.axisLengthMm)}`)
      prevLength = k.bodyLengthMm
      prevAxis = k.axisLengthMm
    }
  }
  checkGenerated(body, growth, report)
}

/** E031 (BG-25): the checked-in file equals the generator output for the same growth table. */
function checkGenerated(body: BodyFile, growth: GrowthPoint[], report: Report): void {
  let generated: unknown
  try {
    generated = JSON.parse(JSON.stringify(generateBodyFile(growth as unknown as CoreGrowthPoint[])))
  } catch (e) {
    report.error('E031', 'body', '', `scripts/gen-body.ts threw: ${(e as Error).message}`)
    return
  }
  const gen = generated as { keyframes?: { hpf: number }[] }
  const genFrames = gen.keyframes ?? []
  if (genFrames.length !== body.keyframes.length) {
    report.error('E031', 'body', '', `has ${body.keyframes.length} keyframes, scripts/gen-body.ts writes ${genFrames.length}`)
  }
  const n = Math.min(genFrames.length, body.keyframes.length)
  for (let i = 0; i < n; i++) {
    const diff = firstDifference(body.keyframes[i], genFrames[i], `keyframes[${i}]`)
    if (diff) report.error('E031', 'body', num(body.keyframes[i].hpf), `differs from scripts/gen-body.ts at ${diff}`)
  }
  const top = firstDifference(body.generatedBy, (generated as { generatedBy?: unknown }).generatedBy, 'generatedBy')
  if (top) report.error('E031', 'body', '', `differs from scripts/gen-body.ts at ${top}`)
}

/** Dotted path of the first leaf where `a` and `b` differ; null when equal. */
export function firstDifference(a: unknown, b: unknown, path: string): string | null {
  if (a === b) return null
  if (typeof a === 'number' && typeof b === 'number') return Number.isNaN(a) && Number.isNaN(b) ? null : path
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return path
    if (a.length !== b.length) return `${path}.length`
    for (let i = 0; i < a.length; i++) {
      const d = firstDifference(a[i], b[i], `${path}[${i}]`)
      if (d) return d
    }
    return null
  }
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) {
      const d = firstDifference((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`)
      if (d) return d
    }
    return null
  }
  return path
}
