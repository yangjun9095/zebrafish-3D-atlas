// The readout "24 hpf | Prim-5 | 1.9 mm EL" (UX-TL-23, UX-TL-24, UI-12, UI-14, UX-TL-26) and the
// units switch (5.2.9). The text updates through refs on every time change, never by re-render.
import { useCallback, useEffect, useRef } from 'react'
import type { StagesFile } from '../core/schema.ts'
import { MEASURE_NAMES, capitalizeLabel, formatLengthWithMeasure, lengthAt } from '../core/format.ts'
import { stageAt } from '../core/timeAxis.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import type { Units } from '../state/store.ts'
import { cx } from './primitives/cx.ts'
import { blurAfterPointer, timeText } from './timelineGeometry.ts'
import { useTransientTime } from './timeMotion.ts'

/** Live announcements happen at most once per 500 ms (UX-TL-26). */
const LIVE_THROTTLE_MS = 500
const UNIT_OPTIONS: readonly Units[] = ['hpf', 'dpf', 'auto']

export interface ReadoutProps {
  stages: StagesFile
  /** A row in the transport bar, or a chip inside the viewer (phone and presentation mode). */
  variant?: 'row' | 'chip'
}

export function Readout({ stages, variant = 'row' }: ReadoutProps) {
  const timeRef = useRef<HTMLSpanElement>(null)
  const stageRef = useRef<HTMLSpanElement>(null)
  const lenWrapRef = useRef<HTMLSpanElement>(null)
  const lenRef = useRef<HTMLSpanElement>(null)
  const tempRef = useRef<HTMLSpanElement>(null)
  const liveRef = useRef<HTMLSpanElement>(null)
  const lastLive = useRef(0)
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const units = useAtlas((s) => s.units)
  const snap = useAtlas((s) => s.snap)
  const temperatureC = useAtlas((s) => s.temperatureC)

  const apply = useCallback(
    (t: number) => {
      const stage = stageAt(stages.stages, t)
      const time = timeText(t, units, snap, temperatureC)
      const stageLabel = capitalizeLabel(stage.shortLabel)
      const len = lengthAt(stages.growth, t)
      // The measure travels with the number (review B09): "30.0 mm TL", with the standard length
      // beside it where the growth row states both.
      const lenLabel = formatLengthWithMeasure(len)
      if (timeRef.current) timeRef.current.textContent = time.text
      if (stageRef.current) stageRef.current.textContent = stageLabel
      if (lenWrapRef.current) lenWrapRef.current.hidden = lenLabel === null
      if (lenRef.current) {
        lenRef.current.textContent = lenLabel ?? ''
        lenRef.current.title = len ? MEASURE_NAMES[len.measure] : ''
      }
      if (tempRef.current) {
        tempRef.current.hidden = time.chip === null
        tempRef.current.textContent = time.chip ?? ''
      }
      const announce = [time.text, stageLabel, lenLabel].filter(Boolean).join(', ')
      const write = () => {
        if (liveRef.current) liveRef.current.textContent = announce
        lastLive.current = performance.now()
        liveTimer.current = null
      }
      if (liveTimer.current) clearTimeout(liveTimer.current)
      const wait = LIVE_THROTTLE_MS - (performance.now() - lastLive.current)
      if (wait <= 0) write()
      else liveTimer.current = setTimeout(write, wait)
    },
    [stages, units, snap, temperatureC],
  )
  useTransientTime(apply)
  useEffect(() => () => {
    if (liveTimer.current) clearTimeout(liveTimer.current)
  }, [])

  return (
    <div className={cx('readout', variant === 'chip' && 'readout-chip')} data-testid="readout">
      <span className="readout-time" ref={timeRef} />
      <span className="readout-sep" aria-hidden="true">|</span>
      <span className="readout-stage" ref={stageRef} />
      <span ref={lenWrapRef}>
        <span className="readout-sep" aria-hidden="true">|</span>
        <span className="readout-len" ref={lenRef} />
      </span>
      <span className="badge readout-temp" ref={tempRef} hidden />
      <DissectReadout />
      <span className="sr-only" aria-live="polite" aria-atomic="true" ref={liveRef} />
    </div>
  )
}

/**
 * The dissect percent beside the time (D17). Presentation mode hides the rail, and with it the
 * slider and its readout, while D and Shift+D still step the value: this is the one place a
 * presenter can read which stop they landed on. It shows only above 0.
 */
function DissectReadout() {
  const dissect = useAtlas((s) => s.dissect)
  if (dissect <= 0) return null
  return (
    <span className="readout-dissect" data-testid="readout-dissect">
      <span className="readout-sep" aria-hidden="true">|</span>
      <span>Dissect {dissect}%</span>
    </span>
  )
}

/** Segmented hpf, dpf, auto (UX-TL-24); U cycles. */
export function UnitsSwitch({ small = false }: { small?: boolean }) {
  const units = useAtlas((s) => s.units)
  return (
    <div className={cx('seg', small && 'seg-sm')} role="group" aria-label="Time units">
      {UNIT_OPTIONS.map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={units === u}
          title={`Show times in ${u === 'auto' ? 'hpf before 72 hpf and dpf after' : u} (U cycles)`}
          onClick={(e) => {
            readAtlas().setUnits(u)
            blurAfterPointer(e)
          }}
        >
          {u}
        </button>
      ))}
    </div>
  )
}
