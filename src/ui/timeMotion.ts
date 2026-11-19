// Time motion for the timeline bar: the playback loop (UX-TL-17, D7), the 200 ms glide
// (UX-TL-16, UX-TL-21), the transient time subscription (AR-17, AR-74) and the time key table.
import { useEffect, useMemo } from 'react'
import { advance } from '../core/playback.ts'
import {
  AXIS_ANCHORS, AXIS_END_HPF, anchorsFromSegments, hpfToTrack, nextPeriod, nextStage, prevPeriod, prevStage, trackToHpf,
} from '../core/timeAxis.ts'
import type { AxisAnchor } from '../core/timeAxis.ts'
import { readAtlas, subscribeAtlas, useAtlas } from '../state/store.ts'
import type { KeyBinding } from './hooks/useKeyboard.ts'

export const GLIDE_MS = 200
/** Steps that arrive faster than 3 per second cut instead of gliding (UX-TL-21). */
const FAST_STEP_MS = 333

/** The D7 anchors from stages.json when the data is loaded, else the built-in table. */
export function useAxisAnchors(): readonly AxisAnchor[] {
  const data = useAtlas((s) => s.data)
  return useMemo(() => {
    if (!data) return AXIS_ANCHORS
    try {
      return anchorsFromSegments(data.stages.timeAxis.segments)
    } catch {
      return AXIS_ANCHORS
    }
  }, [data])
}

let glideRaf = 0
let lastStepAt = -Infinity

export function cancelGlide(): void {
  if (glideRaf) cancelAnimationFrame(glideRaf)
  glideRaf = 0
}

export interface GlideOptions {
  anchors?: readonly AxisAnchor[]
  reducedMotion?: boolean
  instant?: boolean
}

/**
 * Moves t to `target` over 200 ms in track distance with an ease-out curve. Cuts when the
 * caller asks, under reduced motion, while playback runs, or when steps arrive faster than
 * 3 per second. The last frame writes `target` exactly.
 */
export function glideTo(target: number, opts: GlideOptions = {}): void {
  cancelGlide()
  const state = readAtlas()
  const now = performance.now()
  const fast = now - lastStepAt < FAST_STEP_MS
  lastStepAt = now
  if (opts.instant || opts.reducedMotion || fast || state.playing) {
    state.setTime(target)
    return
  }
  const anchors = opts.anchors ?? AXIS_ANCHORS
  const f0 = hpfToTrack(state.time, anchors)
  const f1 = hpfToTrack(target, anchors)
  if (Math.abs(f1 - f0) < 1e-6) {
    state.setTime(target)
    return
  }
  const start = now
  const tick = (t: number) => {
    const p = Math.min((t - start) / GLIDE_MS, 1)
    if (p >= 1) {
      glideRaf = 0
      readAtlas().setTime(target)
      return
    }
    const eased = 1 - (1 - p) ** 3
    readAtlas().setTime(trackToHpf(f0 + (f1 - f0) * eased, anchors))
    glideRaf = requestAnimationFrame(tick)
  }
  glideRaf = requestAnimationFrame(tick)
}

/**
 * Runs the playback loop while `playing` is true and the viewer is not the driver. AR-15 names
 * the viewer's Clock as the one frame-rate writer; this loop runs only while `webgl` is not
 * 'ok' (the probe has not finished, or the context is lost), so time never has two writers.
 * Each frame advances the track fraction by speed / 60 per second and converts back with
 * trackToHpf; setTime stops playback at 4320 hpf.
 */
export function usePlaybackLoop(anchors: readonly AxisAnchor[]): void {
  const playing = useAtlas((s) => s.playing)
  const viewerDrives = useAtlas((s) => s.webgl === 'ok')
  useEffect(() => {
    if (!playing || viewerDrives) return
    cancelGlide()
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const s = readAtlas()
      if (!s.playing) return
      const dt = Math.min(Math.max(now - last, 0) / 1000, 0.1)
      last = now
      const next = advance(s.time, s.speed, dt, anchors)
      s.setTime(next.hpf)
      if (!next.ended) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, viewerDrives, anchors])
}

/** Calls `fn` with the current time now and on every change, outside React render (AR-17). */
export function useTransientTime(fn: (t: number) => void): void {
  useEffect(() => {
    fn(readAtlas().time)
    return subscribeAtlas((s) => s.time, fn)
  }, [fn])
}

/** The key table of 5.2.10 and 5.9.1 for time. Reads the store at key time. */
export function timeKeyBindings(anchors: readonly AxisAnchor[], reducedMotion: boolean): KeyBinding[] {
  const glide = (t: number | null) => {
    if (t !== null) glideTo(t, { anchors, reducedMotion })
  }
  const stage = (dir: -1 | 1) => {
    const s = readAtlas()
    if (!s.data) return
    glide(dir > 0 ? nextStage(s.data.stages.stages, s.time) : prevStage(s.data.stages.stages, s.time))
  }
  const period = (dir: -1 | 1) => {
    const s = readAtlas()
    if (!s.data) return
    glide(dir > 0 ? nextPeriod(s.data.stages.periods, s.time) : prevPeriod(s.data.stages.periods, s.time))
  }
  const withKit = () => {
    const s = readAtlas()
    return s.presentation && s.kit !== null
  }
  const adultStart = () => {
    const stages = readAtlas().data?.stages.stages
    return stages && stages.length > 0 ? stages[stages.length - 1].startHpf : 2160
  }
  return [
    { code: 'Space', run: () => readAtlas().togglePlay() },
    // With a kit loaded in presentation mode the arrows step bookmarks and Shift+Arrow steps stages (UI-33).
    { code: 'ArrowRight', when: withKit, run: () => readAtlas().stepBookmark(1) },
    { code: 'ArrowLeft', when: withKit, run: () => readAtlas().stepBookmark(-1) },
    { code: 'ArrowRight', shift: true, when: withKit, run: () => stage(1) },
    { code: 'ArrowLeft', shift: true, when: withKit, run: () => stage(-1) },
    { code: 'ArrowRight', run: () => stage(1) },
    { code: 'ArrowLeft', run: () => stage(-1) },
    { code: 'ArrowRight', shift: true, run: () => readAtlas().nudgeTime(1) },
    { code: 'ArrowLeft', shift: true, run: () => readAtlas().nudgeTime(-1) },
    { code: 'Home', run: () => glide(0) },
    { code: 'End', run: () => glide(adultStart()) },
    { code: 'End', shift: true, run: () => glide(AXIS_END_HPF) },
    // Presenter remotes send PageUp and PageDown: stage steps in presentation mode, periods elsewhere (UX-TL-21).
    { code: 'PageDown', when: () => readAtlas().presentation, run: () => stage(1) },
    { code: 'PageUp', when: () => readAtlas().presentation, run: () => stage(-1) },
    { code: 'PageDown', shift: true, when: () => readAtlas().presentation, run: () => period(1) },
    { code: 'PageUp', shift: true, when: () => readAtlas().presentation, run: () => period(-1) },
    { code: 'PageDown', run: () => period(1) },
    { code: 'PageUp', run: () => period(-1) },
    { code: 'BracketLeft', run: () => readAtlas().stepSpeed(-1) },
    { code: 'BracketRight', run: () => readAtlas().stepSpeed(1) },
    { code: 'KeyS', run: () => readAtlas().toggleSnap() },
    { code: 'KeyU', run: () => readAtlas().cycleUnits() },
  ]
}
