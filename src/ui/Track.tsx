// The track of the timeline bar (spec 5.2): a role="slider" element over the static SVG layer,
// with the thumb, the hover tooltip, the stage card, pointer drag with snap on release and
// the WAI-ARIA slider keys. Time-dependent DOM updates run through a transient subscription.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { AtlasData, EventRecord } from '../core/schema.ts'
import type { AxisAnchor } from '../core/timeAxis.ts'
import { filterTicks, hpfToTrack, periodAt, snapTarget, stageAt, tickCandidates, trackToHpf } from '../core/timeAxis.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import { EVENT_LIST_ID, EventList, StageCard, TrackTooltip } from './StageCard.tsx'
import { TrackSvg } from './TrackSvg.tsx'
import { REPORTERS, ReporterId } from '../core/fluorescence.ts'
import type { BarLayout, BarMetrics, EventMarker } from './timelineGeometry.ts'
import { bandBoxes, eventMarkers, eventsNear, fractionAt, headlineLabelBoxes, sliderValueText } from './timelineGeometry.ts'
import { cancelGlide, glideTo, useTransientTime } from './timeMotion.ts'
import type { TimeKeyActions } from './TimelineBar.tsx'

export interface TrackProps {
  data: AtlasData
  layout: BarLayout
  metrics: BarMetrics
  anchors: readonly AxisAnchor[]
  reducedMotion: boolean
  keys: TimeKeyActions
}

interface Press {
  id: number
  x: number
  y: number
  type: string
  dragging: boolean
}

interface Hover {
  x: number
  hpf: number
  events: EventRecord[]
}

const TOOLTIP_DELAY_MS = 150
const SNAP_WINDOW_PX = 6
/** Hit area of the thumb handle (UX-AC-10). */
const THUMB_HIT_PX = 44
/** Shortest reporter window the lane draws, so a one-instant rule still reads. */
const FP_WINDOW_MIN_PX = 3
/** Height of one reporter lane bar. */
const FP_LANE_HEIGHT_PX = 2.5
/**
 * Vertical spacing between reporter lanes. The eight REPORTERS lanes must fit inside the
 * shortest fill row across breakpoints (tablet, 22px): 7 gaps at this pitch plus one bar height
 * is 21.75px, which leaves 0.25px of margin.
 */
const FP_LANE_PITCH_PX = 2.7

/** Keeps a reporter-lane coordinate inside the track. */
function clampPx(x: number, width: number): number {
  return Math.min(Math.max(x, 0), width)
}

export function Track({ data, layout, metrics, anchors, reducedMotion, keys }: TrackProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pressRef = useRef<Press | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeBand = useRef<Element | null>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<Hover | null>(null)
  const [tipShown, setTipShown] = useState(false)
  const [thumbHover, setThumbHover] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [focused, setFocused] = useState(false)
  const [cluster, setCluster] = useState<EventMarker | null>(null)
  const theme = useAtlas((s) => s.theme)
  const snap = useAtlas((s) => s.snap)
  const units = useAtlas((s) => s.units)
  const temperatureC = useAtlas((s) => s.temperatureC)
  const fluorescence = useAtlas((s) => s.fluorescence)
  const { stages } = data

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const bands = useMemo(
    () => bandBoxes(stages.periods, width, anchors, metrics.labelPx, theme, layout === 'phone'),
    [stages, width, anchors, metrics.labelPx, theme, layout],
  )
  const ticks = useMemo(() => {
    if (metrics.ticks === 'none' || width === 0) return []
    let candidates = tickCandidates(stages.stages, stages.periods, stages.timeAxis.headlineTicks)
    if (metrics.ticks === 'headlinePeriod') candidates = candidates.filter((c) => c.rank !== 'stage')
    return filterTicks(candidates, width, anchors, stages.timeAxis.minTickGapPx)
  }, [stages, width, anchors, metrics.ticks])
  const labels = useMemo(
    () => (metrics.headlineLabels ? headlineLabelBoxes(ticks.filter((t) => t.rank === 'headline'), stages.stages, width) : []),
    [ticks, stages, width, metrics.headlineLabels],
  )
  const markers = useMemo(() => (metrics.eventRow > 0 ? eventMarkers(stages.events, width, anchors) : []), [stages, width, anchors, metrics.eventRow])

  // Thumb position, ARIA value and the active band follow time outside React render (AR-17).
  const applyTime = useCallback(
    (t: number) => {
      const el = rootRef.current
      if (!el) return
      el.style.setProperty('--x', `${hpfToTrack(t, anchors) * width}px`)
      el.setAttribute('aria-valuenow', String(t))
      el.setAttribute('aria-valuetext', sliderValueText(t, stageAt(stages.stages, t), periodAt(stages.periods, t), readAtlas().units))
      const band = el.querySelector(`.tl-band[data-id="${periodAt(stages.periods, t).id}"]`)
      if (band !== activeBand.current) {
        activeBand.current?.removeAttribute('data-active')
        band?.setAttribute('data-active', 'true')
        activeBand.current = band
      }
    },
    [anchors, width, stages],
  )
  useTransientTime(applyTime)

  /** Closes the event list and gives focus back to the track, so a keyboard reader is not stranded. */
  const closeCluster = useCallback(() => {
    setCluster(null)
    rootRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!cluster) return
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('.tl-evlist')) setCluster(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCluster()
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [cluster, closeCluster])

  const rect = () => rootRef.current?.getBoundingClientRect() ?? { left: 0, width: 1 }
  const timeAtClient = (clientX: number) => trackToHpf(fractionAt(clientX, rect()), anchors)
  const snapped = (t: number) => (readAtlas().snap ? (snapTarget(stages.stages, t, width, anchors, SNAP_WINDOW_PX) ?? t) : t)
  const glide = (t: number) => glideTo(t, { anchors, reducedMotion })

  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = null
    setHover(null)
    setTipShown(false)
    setThumbHover(false)
  }

  const updateHover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = rect()
    const x = Math.min(Math.max(e.clientX - r.left, 0), width)
    const target = e.target as Element
    const tickHpf = target.closest?.('[data-hpf]')?.getAttribute('data-hpf')
    const markerId = target.closest?.('[data-marker]')?.getAttribute('data-marker')
    const marker = markerId ? markers.find((m) => m.events[0].id === markerId) : undefined
    const hpf = marker ? marker.hpf : tickHpf ? Number(tickHpf) : timeAtClient(e.clientX)
    const events = marker ? marker.events : metrics.eventRow > 0 ? [] : eventsNear(stages.events, hpf, width, anchors)
    setHover({ x: marker ? marker.x : x, hpf, events })
    // UX-AC-10: a 44 px square around the handle centre counts as the thumb.
    const thumbX = hpfToTrack(readAtlas().time, anchors) * width
    const handleY = metrics.labelRow + metrics.hitPad + metrics.fill / 2
    const y = e.clientY - (rootRef.current?.getBoundingClientRect().top ?? 0)
    setThumbHover(Math.abs(y - handleY) <= THUMB_HIT_PX / 2 && Math.abs(x - thumbX) <= THUMB_HIT_PX / 2)
    if (!tipShown && !hoverTimer.current) hoverTimer.current = setTimeout(() => setTipShown(true), TOOLTIP_DELAY_MS)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if ((e.target as Element).closest?.('.tl-evlist, .tl-pl')) return
    const markerId = (e.target as Element).closest?.('[data-marker]')?.getAttribute('data-marker')
    if (markerId) {
      const marker = markers.find((m) => m.events[0].id === markerId)
      if (marker && marker.events.length > 1) setCluster(marker)
      else if (marker) glide(marker.hpf)
      return
    }
    rootRef.current?.setPointerCapture(e.pointerId)
    rootRef.current?.focus({ preventScroll: true })
    cancelGlide()
    pressRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, type: e.pointerType, dragging: false }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const press = pressRef.current
    if (!press || press.id !== e.pointerId) {
      updateHover(e)
      return
    }
    const dx = e.clientX - press.x
    const dy = e.clientY - press.y
    if (!press.dragging) {
      // UX-TL-27: a finger scrubs after 4 px horizontal movement; 12 px vertical first cancels the scrub.
      if (press.type === 'touch' && Math.abs(dy) > 12 && Math.abs(dx) < 4) {
        rootRef.current?.releasePointerCapture(e.pointerId)
        pressRef.current = null
        return
      }
      if (Math.abs(dx) < (press.type === 'touch' ? 4 : 2)) return
      press.dragging = true
      readAtlas().pause()
      setDragging(true)
    }
    readAtlas().setTime(timeAtClient(e.clientX))
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const press = pressRef.current
    if (!press || press.id !== e.pointerId) return
    pressRef.current = null
    rootRef.current?.releasePointerCapture(e.pointerId)
    if (press.dragging) {
      setDragging(false)
      const t = readAtlas().time
      const target = snapped(t)
      if (target !== t) readAtlas().setTime(target)
    } else {
      glide(snapped(timeAtClient(e.clientX)))
    }
  }

  const onPointerCancel = () => {
    pressRef.current = null
    setDragging(false)
  }

  /**
   * The event diamonds live inside an `aria-hidden` SVG and open on a pointer press, so a keyboard
   * reader had no way to reach them. Shift+ArrowDown on the focused track opens the diamond nearest
   * the thumb; `EventList` then takes the arrow keys and Escape. The gesture takes a modifier because
   * the ARIA slider pattern reserves plain ArrowUp and ArrowDown for increment and decrement, which
   * `onKeyDown` binds to `nudgeTime`. The track carries role="slider", so the global dispatcher
   * leaves its keys alone (OWN_KEY_ROLES).
   */
  const openNearestCluster = (): boolean => {
    if (markers.length === 0) return false
    const x = hpfToTrack(readAtlas().time, anchors) * width
    let best = markers[0]
    for (const m of markers) if (Math.abs(m.x - x) < Math.abs(best.x - x)) best = m
    setCluster(best)
    return true
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const plain = !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey
    const shiftOnly = e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey
    if (e.key === 'ArrowDown' && shiftOnly && openNearestCluster()) {
      e.preventDefault()
      return
    }
    // The ARIA slider keys: ArrowUp raises the time by one step, ArrowDown lowers it (UX-AC-01).
    if (plain && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      cancelGlide()
      readAtlas().nudgeTime(e.key === 'ArrowUp' ? 1 : -1)
      e.preventDefault()
      return
    }
    if (keys.handle(e.nativeEvent)) e.preventDefault()
  }

  const style = {
    '--tl-block-h': `${metrics.labelRow + metrics.trackRow + metrics.eventRow + 2 * metrics.hitPad}px`,
    '--track-top': `${metrics.labelRow + metrics.hitPad}px`,
    '--track-h': `${metrics.trackRow}px`,
    '--fill-h': `${metrics.fill}px`,
    '--handle': `${metrics.handlePx}px`,
    '--thumb-line': `${metrics.thumbLinePx}px`,
    ...(hover ? { '--hx': `${hover.x}px` } : {}),
  } as CSSProperties

  const cardShown = layout !== 'phone' && layout !== 'presentation' && (dragging || thumbHover || focused)

  return (
    <div
      ref={rootRef}
      className="tl-track"
      role="slider"
      tabIndex={0}
      aria-label="Developmental time"
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={4320}
      // The event list of a merged diamond opens with Shift+ArrowDown. aria-expanded is not a
      // supported attribute of role="slider", so aria-controls names the open menu instead.
      aria-haspopup="menu"
      aria-controls={cluster ? EVENT_LIST_ID : undefined}
      aria-keyshortcuts="Shift+ArrowDown"
      data-testid="timeline-track"
      data-drag={dragging ? 'true' : 'false'}
      data-thumb-hover={thumbHover ? 'true' : 'false'}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={clearHover}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {width > 0 ? (
        <TrackSvg width={width} metrics={metrics} bands={bands} ticks={ticks} labels={labels} markers={markers} labelsInside={layout === 'phone'} onPeriodClick={glide} />
      ) : null}
      {width > 0 && fluorescence.enabled ? <svg className="fp-timeline" width={width} height={metrics.fill} style={{ top: metrics.labelRow + metrics.hitPad }} aria-hidden="true">
        {fluorescence.rules.filter((r) => r.enabled && (fluorescence.channel === 'all' || fluorescence.channel === r.reporter)).map((r) => {
          // A window past the end of the axis, and a snapshot rule that is thinner than the minimum
          // bar, both stay inside the track: the ends are clamped first, then the bar is pulled back
          // from the right edge by whatever the minimum width adds.
          const start = clampPx(hpfToTrack(r.fromHpf, anchors) * width, width)
          const end = clampPx(hpfToTrack(r.toHpf, anchors) * width, width)
          const barWidth = Math.min(Math.max(end - start, FP_WINDOW_MIN_PX), width)
          const lane = ReporterId.options.indexOf(r.reporter)
          return <rect key={r.id} data-fp-window={r.id} x={Math.min(start, width - barWidth)} y={lane * FP_LANE_PITCH_PX} width={barWidth} height={FP_LANE_HEIGHT_PX} rx={1} fill={REPORTERS[r.reporter].hex} />
        })}
      </svg> : null}
      <div className="tl-thumb" data-timeline-thumb="">
        <div className="tl-thumb-line" />
        {metrics.handlePx > 0 ? <div className="tl-thumb-handle" /> : null}
      </div>
      {hover && tipShown && !dragging ? <div className="tl-hover-line" /> : null}
      {hover && tipShown && !dragging && !thumbHover ? (
        <TrackTooltip x={hover.x} hpf={hover.hpf} stages={stages} events={hover.events} snap={snap} units={units} temperatureC={temperatureC} />
      ) : null}
      {layout !== 'phone' && layout !== 'presentation' ? <StageCard stages={stages} shown={cardShown} /> : null}
      {cluster ? (
        <EventList
          marker={cluster}
          onPick={(hpf) => {
            closeCluster()
            glide(hpf)
          }}
        />
      ) : null}
    </div>
  )
}
