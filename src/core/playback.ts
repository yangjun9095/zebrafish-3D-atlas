// Playback in track distance (D7, UX-TL-17): 1x crosses the full track in 60 s.
import type { AxisAnchor } from './timeAxis.ts'
import { AXIS_ANCHORS, AXIS_END_HPF, hpfToTrack, trackToHpf } from './timeAxis.ts'

export const SPEEDS = [0.5, 1, 2, 4, 8] as const
export type Speed = (typeof SPEEDS)[number]
export const DEFAULT_SPEED: Speed = 1
/** Seconds for the full track at 1x (stages.json timeAxis.playbackTrackSeconds). */
export const TRACK_SECONDS_AT_1X = 60

/** Track fraction advanced per second at a speed. */
export function trackDistancePerSecond(speed: Speed, trackSeconds = TRACK_SECONDS_AT_1X): number {
  return speed / trackSeconds
}

/** Seconds for the full track at a speed: 120, 60, 30, 15, 7.5. */
export function fullTrackSeconds(speed: Speed, trackSeconds = TRACK_SECONDS_AT_1X): number {
  return trackSeconds / speed
}

/** Seconds a segment with the given share takes at a speed. */
export function segmentSeconds(share: number, speed: Speed, trackSeconds = TRACK_SECONDS_AT_1X): number {
  return (share * trackSeconds) / speed
}

/** Speed menu label: "2x, 30 s" (UI-10). */
export function speedLabel(speed: Speed, trackSeconds = TRACK_SECONDS_AT_1X): string {
  const s = fullTrackSeconds(speed, trackSeconds)
  return `${speed}x, ${Number.isInteger(s) ? s : s.toFixed(1)} s`
}

/** The next slower or faster speed step; stays at the end of the list. */
export function stepSpeed(speed: Speed, dir: -1 | 1): Speed {
  const i = SPEEDS.indexOf(speed)
  const j = Math.min(Math.max(i + dir, 0), SPEEDS.length - 1)
  return SPEEDS[j]
}

export interface AdvanceResult {
  hpf: number
  /** true when the thumb reached the axis end during this step */
  ended: boolean
}

/**
 * One animation step: advances the track fraction by speed / 60 per second and converts
 * back with trackToHpf. Stops at the axis end.
 */
export function advance(
  hpf: number,
  speed: Speed,
  dtSeconds: number,
  anchors: readonly AxisAnchor[] = AXIS_ANCHORS,
  trackSeconds = TRACK_SECONDS_AT_1X,
): AdvanceResult {
  const next = hpfToTrack(hpf, anchors) + trackDistancePerSecond(speed, trackSeconds) * dtSeconds
  if (next >= 1) return { hpf: anchors[anchors.length - 1]?.hpf ?? AXIS_END_HPF, ended: true }
  return { hpf: trackToHpf(next, anchors), ended: false }
}

/**
 * The time to start from on play (UX-TL-17): at the axis end, the time at which the last
 * playback started, or 0 when none ran; otherwise the current time.
 */
export function playStart(hpf: number, lastPlayStart: number | null, axisEndHpf = AXIS_END_HPF): number {
  return hpf >= axisEndHpf ? (lastPlayStart ?? 0) : hpf
}
