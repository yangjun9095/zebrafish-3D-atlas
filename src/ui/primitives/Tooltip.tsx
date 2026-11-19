import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { Kbd } from './Kbd.tsx'

export interface TooltipProps {
  label: ReactNode
  /** Shortcut rendered as a key cap after the label. */
  shortcut?: string
  side?: 'top' | 'bottom'
  /** Delay before the tooltip shows on hover and focus (UX-AC-05: 400 ms). */
  delayMs?: number
  children: ReactNode
}

/**
 * A tooltip that appears on hover and on focus after a delay and hides on
 * Escape. The child receives `aria-describedby` when it is a single element.
 */
export function Tooltip({ label, shortcut, side = 'top', delayMs = 400, children }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  const show = () => {
    clear()
    timer.current = setTimeout(() => setOpen(true), delayMs)
  }
  const hide = () => {
    clear()
    setOpen(false)
  }

  useEffect(() => clear, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': id })
    : children

  return (
    <span
      className="tip-anchor"
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      onPointerDown={hide}
    >
      {child}
      {open ? (
        <span role="tooltip" id={id} className="tip" data-side={side}>
          {label}
          {shortcut ? <Kbd>{shortcut}</Kbd> : null}
        </span>
      ) : null}
    </span>
  )
}
