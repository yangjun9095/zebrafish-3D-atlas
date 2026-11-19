// The timeline bar (spec 5.2): track, transport row and readout per layout, the playback loop,
// the strip visibility of presentation mode (UI-37) and the global time keys of 5.9.1.
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useAtlas } from '../state/store.ts'
import { useBreakpoint } from './hooks/useBreakpoint.ts'
import { findBinding, useKeyboard } from './hooks/useKeyboard.ts'
import { useReducedMotion } from './hooks/useReducedMotion.ts'
import { FirstRunHint } from './FirstRunHint.tsx'
import { Readout } from './Readout.tsx'
import { useThemeSync } from './themeActions.ts'
import { Track } from './Track.tsx'
import { Transport } from './Transport.tsx'
import { BAR_METRICS } from './timelineGeometry.ts'
import type { BarLayout } from './timelineGeometry.ts'
import { timeKeyBindings, useAxisAnchors, usePlaybackLoop } from './timeMotion.ts'
import './TimelineBar.css'

/** The time key dispatcher shared by the window listener and the focused track (UI-41). */
export interface TimeKeyActions {
  /** Runs the binding for the event and returns true when one matched. */
  handle(event: KeyboardEvent): boolean
}

export interface TimelineBarProps {
  /**
   * Installs the time keys (Space, arrows, Home, End, PageUp, PageDown, [, ], S, U) on window.
   * Pass false when another dispatcher owns them.
   */
  globalKeys?: boolean
  /** Opens the shortcut sheet (WP-I4). */
  onOpenShortcuts?: () => void
}

const STRIP_IDLE_MS = 3000
const READY_SELECTOR = '[data-atlas-ready="true"]'

/**
 * UI-37: the strip shows while playing, for 3 s after input or entry, and while pinned. The entry
 * window starts when the viewer has rendered (the ready attribute of QP-31), so a link opened from
 * a slide shows the strip after the first build instead of hiding it before the fish appears.
 */
function useStripHidden(presentation: boolean, playing: boolean, pinned: boolean): boolean {
  const [recent, setRecent] = useState(true)
  useEffect(() => {
    if (!presentation) return
    let timer: ReturnType<typeof setTimeout> | null = null
    let observer: MutationObserver | null = null
    const show = () => setRecent(true)
    const touch = () => {
      show()
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setRecent(false), STRIP_IDLE_MS)
    }
    if (document.querySelector(READY_SELECTOR) || typeof MutationObserver === 'undefined') touch()
    else {
      // Shown without a timer until the viewer is ready; the 3 s start then.
      show()
      observer = new MutationObserver(() => {
        if (!document.querySelector(READY_SELECTOR)) return
        observer?.disconnect()
        observer = null
        touch()
      })
      observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-atlas-ready'] })
    }
    window.addEventListener('pointermove', touch)
    window.addEventListener('pointerdown', touch)
    window.addEventListener('keydown', touch)
    return () => {
      if (timer) clearTimeout(timer)
      observer?.disconnect()
      window.removeEventListener('pointermove', touch)
      window.removeEventListener('pointerdown', touch)
      window.removeEventListener('keydown', touch)
    }
  }, [presentation, playing])
  return presentation && !playing && !pinned && !recent
}

export function TimelineBar({ globalKeys = true, onOpenShortcuts }: TimelineBarProps) {
  const data = useAtlas((s) => s.data)
  const presentation = useAtlas((s) => s.presentation)
  const embed = useAtlas((s) => s.embed)
  const playing = useAtlas((s) => s.playing)
  const stripPinned = useAtlas((s) => s.stripPinned)
  const storeReducedMotion = useAtlas((s) => s.reducedMotion)
  const reducedMotion = useReducedMotion() || storeReducedMotion
  const breakpoint = useBreakpoint()
  const layout: BarLayout = presentation ? 'presentation' : embed ? 'tablet' : breakpoint
  const metrics = BAR_METRICS[layout]
  const anchors = useAxisAnchors()

  usePlaybackLoop(anchors)
  useThemeSync()
  const bindings = useMemo(() => timeKeyBindings(anchors, reducedMotion), [anchors, reducedMotion])
  useKeyboard(bindings, { enabled: globalKeys && data !== null })
  const keys = useMemo<TimeKeyActions>(
    () => ({
      handle(event) {
        const hit = findBinding(event, bindings)
        if (!hit) return false
        hit.run(event)
        return true
      },
    }),
    [bindings],
  )
  const hidden = useStripHidden(presentation, playing, stripPinned)

  if (!data) {
    return (
      <div className="tl tl-skeleton" data-layout={layout} aria-busy="true" aria-label="Building the atlas">
        <span />
        <span />
      </div>
    )
  }

  const style = { '--tl-pad': `${metrics.padX}px`, '--transport-h': `${metrics.transportRow}px` } as CSSProperties
  const chip = layout === 'phone' || layout === 'presentation'

  return (
    <>
      <div className="tl" data-layout={layout} data-playing={playing ? 'true' : 'false'} data-hidden={hidden ? 'true' : 'false'} style={style}>
        <Track data={data} layout={layout} metrics={metrics} anchors={anchors} reducedMotion={reducedMotion} keys={keys} />
        {metrics.transportRow > 0 ? <Transport data={data} layout={layout} anchors={anchors} reducedMotion={reducedMotion} onOpenShortcuts={onOpenShortcuts} /> : null}
      </div>
      {chip ? <Readout stages={data.stages} variant="chip" /> : null}
      <FirstRunHint />
    </>
  )
}
