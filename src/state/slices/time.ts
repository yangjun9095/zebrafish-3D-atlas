// Time slice: the clock, playback, snap, units, and the derived fields of AR-74.
import { nextPeriod, nextStage, prevPeriod, prevStage } from '../../core/timeAxis.ts'
import { firstFullyVisibleHpf } from '../../core/presence.ts'
import type { Get, Set, StoreDeps, TimeActions, TimeState, Units, ZfaId } from './types.ts'
import { DEFAULT_TEMPERATURE_C, DEFAULT_TIME_HPF, SPEEDS, TIME_MAX_HPF } from './types.ts'

const UNIT_CYCLE: readonly Units[] = ['hpf', 'dpf', 'auto']

export function clampTime(t: number): number {
  if (!Number.isFinite(t)) return DEFAULT_TIME_HPF
  return Math.min(Math.max(t, 0), TIME_MAX_HPF)
}

export function sameIds(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** The derived fields for time t. Returns only the fields whose value differs from the stored one. */
export function deriveTime(get: Get, deps: StoreDeps, t: number): Partial<TimeState> {
  const { data, sex, stageIndex, presentIds } = get()
  const patch: Partial<TimeState> = {}
  if (!data) return patch
  const stages = data.stages.stages
  const si = stages.length > 0 ? deps.stageIndexAt(stages, t) : -1
  if (si !== stageIndex) patch.stageIndex = si
  const ids = deps.presentIds(data.structures, t, { sex }) as ZfaId[]
  if (!sameIds(ids, presentIds)) patch.presentIds = ids
  return patch
}

/** Recomputes the derived fields at the current time and writes them only on change. */
export function refreshDerived(set: Set, get: Get, deps: StoreDeps): void {
  const patch = deriveTime(get, deps, get().time)
  if (Object.keys(patch).length > 0) set(patch)
}

export function createTimeSlice(set: Set, get: Get, deps: StoreDeps): TimeState & TimeActions {
  return {
    time: DEFAULT_TIME_HPF,
    playing: false,
    speed: 1,
    snap: false,
    units: 'auto',
    temperatureC: DEFAULT_TEMPERATURE_C,
    stageIndex: -1,
    presentIds: [],
    playStartHpf: null,

    setTime(t) {
      const time = clampTime(t)
      const state = get()
      const patch = deriveTime(get, deps, time)
      const atEnd = state.playing && time >= TIME_MAX_HPF
      if (time === state.time && Object.keys(patch).length === 0 && !atEnd) return
      set({ time, tessellation: 'interactive', ...patch, ...(atEnd ? { playing: false } : {}) })
    },
    stepStage(dir) {
      const { data, time } = get()
      if (!data) return
      const target = dir > 0 ? nextStage(data.stages.stages, time) : prevStage(data.stages.stages, time)
      if (target !== null) get().setTime(target)
    },
    stepPeriod(dir) {
      const { data, time } = get()
      if (!data) return
      const target = dir > 0 ? nextPeriod(data.stages.periods, time) : prevPeriod(data.stages.periods, time)
      if (target !== null) get().setTime(target)
    },
    nudgeTime(dir) {
      const { time } = get()
      const hourly = dir > 0 ? time < 72 : time <= 72
      get().setTime(time + dir * (hourly ? 1 : 24))
    },
    play() {
      let { time } = get()
      if (time >= TIME_MAX_HPF) {
        time = get().playStartHpf ?? 0
        get().setTime(time)
      }
      set({ playing: true, playStartHpf: time })
    },
    pause() {
      if (get().playing) set({ playing: false })
    },
    togglePlay() {
      if (get().playing) get().pause()
      else get().play()
    },
    setSpeed(s) {
      if (SPEEDS.includes(s) && s !== get().speed) set({ speed: s })
    },
    stepSpeed(dir) {
      const i = SPEEDS.indexOf(get().speed)
      get().setSpeed(SPEEDS[Math.min(Math.max(i + dir, 0), SPEEDS.length - 1)])
    },
    toggleSnap() {
      set({ snap: !get().snap })
    },
    setUnits(u) {
      if (u !== get().units) set({ units: u })
    },
    cycleUnits() {
      const i = UNIT_CYCLE.indexOf(get().units)
      set({ units: UNIT_CYCLE[(i + 1) % UNIT_CYCLE.length] })
    },
    setTemperature(c) {
      if (!Number.isFinite(c)) return
      const temperatureC = Math.min(Math.max(c, 24), 33)
      if (temperatureC !== get().temperatureC) set({ temperatureC })
    },
    jumpToAppearance(id) {
      const { data, snap } = get()
      const record = data?.structuresById.get(id)
      if (!record || !data) return
      let target = firstFullyVisibleHpf(record)
      if (snap && data.stages.stages.length > 0) {
        const stage = data.stages.stages[deps.stageIndexAt(data.stages.stages, target)]
        if (stage && stage.startHpf >= target) target = stage.startHpf
      }
      get().setTime(target)
    },
  }
}
