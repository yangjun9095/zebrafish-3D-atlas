// Presence and fade (D3, BG-44, DM-36): opacity 0 to 1 and scale 0.7 to 1.0 over the fade windows.
import type { StageRecord } from './schema.ts'
import { AXIS_END_HPF } from './timeAxis.ts'

/** The record fields that presence reads; a fixture or a store row can pass a subset. */
export interface PresenceRecord {
  visibleFromHpf: number
  modelEndHpf: number
  fadeInHpf: number
  fadeOutHpf: number
  sexSpecific?: 'female' | 'male' | null
}

export type PresencePhase = 'before' | 'fadeIn' | 'full' | 'fadeOut' | 'after' | 'hiddenBySex'

export interface Presence {
  /** true when the fade opacity is above 0 (BG-44) */
  present: boolean
  /** material opacity, 0 to 1 */
  opacity: number
  /** scale about the centroid, 0.7 to 1.0 */
  scale: number
  /** alias of opacity for callers that read the spec name */
  fade: number
  /** material.transparent is true only inside a fade window */
  transparent: boolean
  phase: PresencePhase
}

/** The sex toggle of D9: female or male picks one gonad record; both draws every sex-specific record. */
export type Sex = 'female' | 'male' | 'both'

export interface PresenceOptions {
  /** the sex toggle; a sexSpecific record is drawn only while it matches, and always for 'both' (DM-32) */
  sex?: Sex
}

export const FADE_SCALE_MIN = 0.7

const ABSENT: Omit<Presence, 'phase'> = { present: false, opacity: 0, scale: FADE_SCALE_MIN, fade: 0, transparent: false }

/**
 * Presence of a record at hpf. The window is [visibleFromHpf, modelEndHpf], inclusive at
 * both ends. A record with fadeOutHpf 0 keeps opacity 1 up to and including modelEndHpf, so
 * a record clamped to the axis end (DM-36) never fades at 180 dpf. A record with
 * fadeInHpf 0 is fully visible at visibleFromHpf.
 */
export function presenceAt(record: PresenceRecord, hpf: number, opts: PresenceOptions = {}): Presence {
  if (record.sexSpecific && opts.sex && opts.sex !== 'both' && record.sexSpecific !== opts.sex) return { ...ABSENT, phase: 'hiddenBySex' }
  if (hpf < record.visibleFromHpf) return { ...ABSENT, phase: 'before' }
  if (hpf > record.modelEndHpf) return { ...ABSENT, phase: 'after' }

  let opacity = 1
  let phase: PresencePhase = 'full'
  if (record.fadeInHpf > 0 && hpf < record.visibleFromHpf + record.fadeInHpf) {
    opacity = (hpf - record.visibleFromHpf) / record.fadeInHpf
    phase = 'fadeIn'
  }
  if (record.fadeOutHpf > 0 && hpf > record.modelEndHpf - record.fadeOutHpf) {
    const out = (record.modelEndHpf - hpf) / record.fadeOutHpf
    if (out < opacity) {
      opacity = out
      phase = 'fadeOut'
    }
  }
  opacity = Math.min(Math.max(opacity, 0), 1)
  return {
    present: opacity > 0,
    opacity,
    scale: FADE_SCALE_MIN + (1 - FADE_SCALE_MIN) * opacity,
    fade: opacity,
    transparent: phase === 'fadeIn' || phase === 'fadeOut',
    phase,
  }
}

/** Sorted ids of the records present at hpf; the store caches this list (AR-74). */
export function presentIds<T extends PresenceRecord & { id: string }>(
  records: readonly T[],
  hpf: number,
  opts: PresenceOptions = {},
): string[] {
  const out: string[] = []
  for (const r of records) if (presenceAt(r, hpf, opts).present) out.push(r.id)
  return out.sort()
}

/** The first fully visible time, the target of "Jump to first appearance" (UI-20). */
export function firstFullyVisibleHpf(record: PresenceRecord): number {
  return Math.min(record.visibleFromHpf + record.fadeInHpf, record.modelEndHpf)
}

/** The last fully visible time; the stage that contains it is the UI-22 jump target of an ended record. */
export function lastFullyVisibleHpf(record: PresenceRecord): number {
  return Math.max(record.modelEndHpf - record.fadeOutHpf, firstFullyVisibleHpf(record))
}

/** True while the record has a mesh: present, geometry not null, and before geometryEndHpf. */
export function hasMeshAt(
  record: PresenceRecord & { geometry: { geometryEndHpf?: number } | null },
  hpf: number,
  opts: PresenceOptions = {},
): boolean {
  if (record.geometry === null) return false
  if (record.geometry.geometryEndHpf !== undefined && hpf > record.geometry.geometryEndHpf) return false
  return presenceAt(record, hpf, opts).present
}

// Defaults (DM-22, DM-36) --------------------------------------------------------------

export const DEFAULT_FADE_FRACTION = 0.05

/** The stage whose window contains hpf: `start <= hpf < end` at a window start, `start < hpf <= end` at a window end. */
export function stageContaining(stages: readonly StageRecord[], hpf: number, edge: 'start' | 'end'): StageRecord | null {
  for (const s of stages) {
    if (edge === 'start' ? s.startHpf <= hpf && hpf < s.endHpf : s.startHpf < hpf && hpf <= s.endHpf) return s
  }
  return null
}

export interface FadeWindowInput {
  startHpf: number
  endHpf: number
  visibleFromHpf: number
  modelEndHpf: number
}

/**
 * Default fades: 5 percent of the stage that contains the window edge (D3, DM-22), with the
 * stage cut at the axis end. The axis end is a clamp, not an end: fadeOutHpf is 0 when endHpf exceeds the axis end and
 * modelEndHpf equals it, and fadeInHpf is 0 when visibleFromHpf is 0 (DM-36).
 */
export function defaultFades(
  input: FadeWindowInput,
  stages: readonly StageRecord[],
  axisEndHpf = AXIS_END_HPF,
): { fadeInHpf: number; fadeOutHpf: number } {
  const startStage = stageContaining(stages, input.visibleFromHpf, 'start')
  const endStage = stageContaining(stages, input.modelEndHpf, 'end')
  // The adult stage runs to 17520 hpf in ZFS; on the axis it ends at 4320 (BG-44: 108 h at 2160).
  const duration = (s: StageRecord) => Math.min(s.endHpf, axisEndHpf) - s.startHpf
  let fadeInHpf = startStage ? DEFAULT_FADE_FRACTION * duration(startStage) : 0
  let fadeOutHpf = endStage ? DEFAULT_FADE_FRACTION * duration(endStage) : 0
  if (input.visibleFromHpf <= 0) fadeInHpf = 0
  if (input.endHpf > axisEndHpf && input.modelEndHpf >= axisEndHpf) fadeOutHpf = 0
  const span = input.modelEndHpf - input.visibleFromHpf
  if (fadeInHpf + fadeOutHpf > span) {
    const k = span / (fadeInHpf + fadeOutHpf)
    fadeInHpf *= k
    fadeOutHpf *= k
  }
  return { fadeInHpf, fadeOutHpf }
}
