// Presentation-mode layer (spec 2.8 AR-59, UI-40): the black screen, the "Press Enter for
// fullscreen" chip after entry through the URL, the 2 s cursor hide, and the pointer exit from the
// black screen. The dispatcher in src/state/shortcuts.ts owns the keys (B, ., Enter, Escape).
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { readAtlas, useAtlas } from '../state/store.ts'
import { Kbd } from './primitives/Kbd.tsx'

const CURSOR_IDLE_MS = 2000
const FULLSCREEN_CHIP_MS = 5000

function isFullscreen(): boolean {
  return typeof document !== 'undefined' && document.fullscreenElement !== null
}

/** Hides the cursor over the app root after 2 s without pointer movement (AR-59). */
function useCursorIdle(active: boolean, ref: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const root = ref.current?.parentElement
    if (!active || !root) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const hide = () => root.setAttribute('data-cursor', 'hidden')
    const wake = () => {
      root.removeAttribute('data-cursor')
      if (timer) clearTimeout(timer)
      timer = setTimeout(hide, CURSOR_IDLE_MS)
    }
    wake()
    window.addEventListener('pointermove', wake)
    window.addEventListener('pointerdown', wake)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('pointermove', wake)
      window.removeEventListener('pointerdown', wake)
      root.removeAttribute('data-cursor')
    }
  }, [active, ref])
}

const READY_SELECTOR = '[data-atlas-ready="true"]'

/**
 * Shows the fullscreen chip for 5 s when presentation mode was already on at mount, that is after
 * entry through present=1 (applyUrl runs before the first render). The 5 s start when the viewer
 * has rendered its first final frame (the ready attribute of QP-31), so a slow first build does
 * not eat the window. It never returns on a later entry.
 */
function useFullscreenChip(presentation: boolean): boolean {
  const [shown, setShown] = useState(() => readAtlas().presentation && !isFullscreen())
  useEffect(() => {
    if (!shown) return
    let timer: ReturnType<typeof setTimeout> | null = null
    let observer: MutationObserver | null = null
    const arm = () => {
      if (timer !== null) return
      observer?.disconnect()
      observer = null
      timer = setTimeout(() => setShown(false), FULLSCREEN_CHIP_MS)
    }
    if (document.querySelector(READY_SELECTOR)) arm()
    else {
      observer = new MutationObserver(() => {
        if (document.querySelector(READY_SELECTOR)) arm()
      })
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-atlas-ready'] })
    }
    const onChange = () => {
      if (isFullscreen()) setShown(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      if (timer !== null) clearTimeout(timer)
      observer?.disconnect()
      document.removeEventListener('fullscreenchange', onChange)
    }
  }, [shown])
  return presentation && shown
}

/** A pointer press leaves the black screen (UI-40); the dispatcher handles the keys. */
function useBlackScreenExit(blackScreen: boolean): void {
  useEffect(() => {
    if (!blackScreen) return
    const leave = () => {
      if (readAtlas().blackScreen) readAtlas().toggleBlackScreen()
    }
    window.addEventListener('pointerdown', leave, { capture: true })
    return () => window.removeEventListener('pointerdown', leave, { capture: true })
  }, [blackScreen])
}

export function PresentationOverlay() {
  const presentation = useAtlas((s) => s.presentation)
  const blackScreen = useAtlas((s) => s.blackScreen)
  const ref = useRef<HTMLDivElement>(null)
  const chip = useFullscreenChip(presentation)
  useCursorIdle(presentation, ref)
  useBlackScreenExit(presentation && blackScreen)

  if (!presentation) return null
  return (
    <div ref={ref} className="pres-layer" data-testid="presentation-layer">
      {chip ? (
        <div className="pres-chip" role="status">
          Press <Kbd>Enter</Kbd> for fullscreen
        </div>
      ) : null}
      {blackScreen ? <div className="black-screen" data-testid="black-screen" aria-label="Black screen; press any key to return" /> : null}
    </div>
  )
}
