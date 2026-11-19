// The transport row (spec 5.2.9): first, previous, play or pause, next, last, the speed menu,
// the snap toggle, the units switch and the keyboard help button.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { FastForward, Keyboard, Magnet, Pause, Play, Rewind, SkipBack, SkipForward } from 'lucide-react'
import type { AtlasData } from '../core/schema.ts'
import { SPEEDS, speedLabel } from '../core/playback.ts'
import type { AxisAnchor } from '../core/timeAxis.ts'
import { AXIS_END_HPF, nextStage, prevStage } from '../core/timeAxis.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import { IconButton } from './primitives/IconButton.tsx'
import { Readout, UnitsSwitch } from './Readout.tsx'
import type { BarLayout } from './timelineGeometry.ts'
import { blurAfterPointer } from './timelineGeometry.ts'
import { glideTo, useTransientTime } from './timeMotion.ts'

export interface TransportProps {
  data: AtlasData
  layout: BarLayout
  anchors: readonly AxisAnchor[]
  reducedMotion: boolean
  /** Opens the shortcut sheet (WP-I4); the button renders disabled without it. */
  onOpenShortcuts?: () => void
}

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export function Transport({ data, layout, anchors, reducedMotion, onOpenShortcuts }: TransportProps) {
  const playing = useAtlas((s) => s.playing)
  const speed = useAtlas((s) => s.speed)
  const snap = useAtlas((s) => s.snap)
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const speedTriggerRef = useRef<HTMLButtonElement>(null)
  const speedMenuRef = useRef<HTMLUListElement>(null)
  const stages = data.stages.stages
  const adultStart = stages[stages.length - 1]?.startHpf ?? 2160
  const phone = layout === 'phone'

  // UX-TL-19: Previous and First disable at t = 0, Next and Last at the axis end; they stay focusable.
  const applyTime = useCallback((t: number) => {
    const root = rootRef.current
    if (!root) return
    root.querySelectorAll('[data-edge="start"]').forEach((b) => b.toggleAttribute('disabled', t <= 0))
    root.querySelectorAll('[data-edge="end"]').forEach((b) => b.toggleAttribute('disabled', t >= AXIS_END_HPF))
  }, [])
  useTransientTime(applyTime)

  // The checked speed takes focus on open (WAI-ARIA menu pattern); Escape returns it to the trigger.
  useEffect(() => {
    if (!menuOpen) return
    speedMenuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      speedTriggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', close)
    window.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', key)
    }
  }, [menuOpen])

  /** ArrowDown, ArrowUp, Home and End move focus among the speed items (WAI-ARIA menu pattern). */
  const onSpeedMenuKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'))
    if (items.length === 0) return
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    const go = (j: number) => items[(j + items.length) % items.length]?.focus()
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else return
    e.preventDefault()
  }

  const glide = (t: number | null) => {
    if (t !== null) glideTo(t, { anchors, reducedMotion })
  }

  return (
    <div className="tl-transport" data-testid="transport" ref={rootRef}>
      {!phone ? <Readout stages={data.stages} /> : null}
      <div className="tl-spacer" />
      <div className="tl-group" role="group" aria-label="Playback">
        <IconButton data-edge="start" className="tl-btn" label="First stage" shortcut="Home" onClick={(e) => { glide(0); blurAfterPointer(e) }}>
          <SkipBack {...ICON} />
        </IconButton>
        <IconButton data-edge="start" className="tl-btn" label="Previous stage" shortcut="ArrowLeft" onClick={(e) => { glide(prevStage(stages, readAtlas().time)); blurAfterPointer(e) }}>
          <Rewind {...ICON} />
        </IconButton>
        <IconButton
          className="tl-play"
          variant="primary"
          label={playing ? 'Pause' : 'Play'}
          shortcut="Space"
          aria-pressed={playing}
          data-testid="play"
          onClick={(e) => {
            readAtlas().togglePlay()
            blurAfterPointer(e)
          }}
        >
          {playing ? <Pause {...ICON} /> : <Play {...ICON} />}
        </IconButton>
        <IconButton data-edge="end" className="tl-btn" label="Next stage" shortcut="ArrowRight" onClick={(e) => { glide(nextStage(stages, readAtlas().time)); blurAfterPointer(e) }}>
          <FastForward {...ICON} />
        </IconButton>
        <IconButton data-edge="end" className="tl-btn" label="Last stage" shortcut="End" onClick={(e) => { glide(adultStart); blurAfterPointer(e) }}>
          <SkipForward {...ICON} />
        </IconButton>
      </div>
      <div className="tl-spacer" />
      {!phone ? (
        <div className="tl-group" ref={menuRef}>
          <button
            ref={speedTriggerRef}
            type="button"
            className="btn tl-speed"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Playback speed ${speed}x`}
            title="Speed ([ slower, ] faster)"
            onClick={(e) => {
              setMenuOpen((o) => !o)
              blurAfterPointer(e)
            }}
          >
            {speed}x
          </button>
          {menuOpen ? (
            <ul ref={speedMenuRef} className="tl-menu" role="menu" aria-label="Playback speed" onKeyDown={onSpeedMenuKeyDown}>
              {SPEEDS.map((s) => (
                <li key={s} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={s === speed}
                    onClick={() => {
                      readAtlas().setSpeed(s)
                      setMenuOpen(false)
                      speedTriggerRef.current?.focus()
                    }}
                  >
                    <span>{speedLabel(s)}</span>
                  </button>
                </li>
              ))}
              {reducedMotion ? <li className="tl-menu-note" role="none">Reduced motion is on</li> : null}
            </ul>
          ) : null}
        </div>
      ) : null}
      <IconButton
        className="tl-btn"
        label="Snap to stage"
        shortcut="S"
        aria-pressed={snap}
        data-testid="snap"
        onClick={(e) => {
          readAtlas().toggleSnap()
          blurAfterPointer(e)
        }}
      >
        <Magnet {...ICON} />
      </IconButton>
      {!phone ? <UnitsSwitch /> : null}
      {!phone ? (
        <IconButton
          className="tl-btn"
          label={onOpenShortcuts ? 'Keyboard shortcuts' : 'Keyboard shortcuts (coming soon)'}
          shortcut="?"
          disabled={!onOpenShortcuts}
          onClick={(e) => {
            onOpenShortcuts?.()
            blurAfterPointer(e)
          }}
        >
          <Keyboard {...ICON} />
        </IconButton>
      ) : null}
    </div>
  )
}
