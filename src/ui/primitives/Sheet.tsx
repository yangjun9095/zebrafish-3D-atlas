import { useEffect, useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { reserveEdge } from '../../viewer/reserved.ts'
import { IconButton } from './IconButton.tsx'
import { cx } from './cx.ts'

export type SheetSide = 'left' | 'right' | 'bottom'
export type SheetDetent = 'peek' | 'half' | 'full'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  side?: SheetSide
  /** Height of a bottom sheet (spec 5.1.1): 96 px, 50 dvh, or 90 dvh. */
  detent?: SheetDetent
  /** A modal sheet draws a backdrop and traps Tab inside. */
  modal?: boolean
  /** Extra controls in the header, left of the close button. */
  actions?: ReactNode
  width?: number
  className?: string
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/** A side or bottom panel with a title, a close button, Escape to close, and focus return. */
export function Sheet({
  open,
  onClose,
  title,
  side = 'right',
  detent = 'half',
  modal = true,
  actions,
  width,
  className,
  children,
}: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const returnRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    // A field with autoFocus (the phone search) keeps the focus it took on mount.
    if (panel && !panel.contains(document.activeElement)) panel.focus()
    return () => {
      returnRef.current?.focus?.()
    }
  }, [open])

  // A bottom sheet covers the lower part of the viewer: the camera rig shifts the fish up by half its height (AR-42).
  useEffect(() => {
    const panel = panelRef.current
    if (!open || side !== 'bottom' || !panel) return
    let release: (() => void) | null = null
    const measure = () => {
      release?.()
      release = reserveEdge('bottom', panel.getBoundingClientRect().height)
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(panel)
    return () => {
      observer?.disconnect()
      release?.()
    }
  }, [open, side, detent])

  if (!open) return null

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      // The window dispatcher (src/state/shortcuts.ts) runs first in the capture phase; when it took the
      // press (exit isolate, close a registered overlay) this sheet leaves it at one step (5.9.1).
      if (e.nativeEvent.defaultPrevented) return
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !modal || !panelRef.current) return
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  const style = width ? ({ '--sheet-w': `${width}px` } as CSSProperties) : undefined

  return (
    <>
      {modal ? <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" /> : null}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={modal || undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        data-detent={side === 'bottom' ? detent : undefined}
        className={cx('sheet', `sheet-${side}`, className)}
        style={style}
        onKeyDown={onKeyDown}
      >
        {side === 'bottom' ? <div className="sheet-grabber" aria-hidden="true" /> : null}
        <div className="sheet-header">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          {actions}
          <IconButton label="Close" shortcut="Esc" size="sm" onClick={onClose}>
            <X aria-hidden="true" strokeWidth={1.75} />
          </IconButton>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}
