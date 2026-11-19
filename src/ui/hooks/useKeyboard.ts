import { useEffect, useRef } from 'react'

/**
 * A key binding matched on `event.code` (UI-41), so `Alt+Minus` on macOS and
 * the digit row work the same on every layout. Modifier flags default to
 * false and must match exactly; `ctrl` also accepts the Command key.
 */
export interface KeyBinding {
  code: string
  shift?: boolean
  ctrl?: boolean
  alt?: boolean
  /** Skips the binding when it returns false. */
  when?: () => boolean
  run: (event: KeyboardEvent) => void
}

/** The event fields the dispatcher reads; a plain object satisfies it in tests. */
export interface KeyEventLike {
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  defaultPrevented: boolean
  target: EventTarget | null
}

export interface TargetLike {
  tagName?: string
  isContentEditable?: boolean
  getAttribute?: (name: string) => string | null
}

const TEXT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const OWN_KEY_ROLES = new Set(['slider', 'listbox', 'textbox', 'combobox', 'searchbox', 'tree', 'treeitem'])

/** True for a text field, a button, a slider, a listbox or a tree row: elements that handle their own keys. */
export function targetHandlesKeys(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false
  const el = target as TargetLike
  const tag = el.tagName?.toUpperCase()
  if (tag && TEXT_TAGS.has(tag)) return true
  if (tag === 'BUTTON') return true
  if (el.isContentEditable) return true
  const role = el.getAttribute?.('role')
  return role !== null && role !== undefined && OWN_KEY_ROLES.has(role)
}

function insideModal(target: unknown): boolean {
  const el = target as { closest?: (sel: string) => unknown } | null
  return typeof el?.closest === 'function' && Boolean(el.closest('[aria-modal="true"]'))
}

/** True when the dispatcher must skip the event (UI-41): handled, from a control that owns its keys, or inside a modal sheet. */
export function shouldIgnoreKeyEvent(event: KeyEventLike): boolean {
  return event.defaultPrevented || targetHandlesKeys(event.target) || insideModal(event.target)
}

/** True when the event's code and modifiers match the binding. */
export function matchesBinding(event: KeyEventLike, binding: KeyBinding): boolean {
  if (event.code !== binding.code) return false
  if (event.shiftKey !== Boolean(binding.shift)) return false
  if (event.altKey !== Boolean(binding.alt)) return false
  const ctrlLike = event.ctrlKey || event.metaKey
  return ctrlLike === Boolean(binding.ctrl)
}

/** Returns the first binding that matches and is enabled, or null. */
export function findBinding(event: KeyEventLike, bindings: readonly KeyBinding[]): KeyBinding | null {
  for (const b of bindings) {
    if (matchesBinding(event, b) && (b.when?.() ?? true)) return b
  }
  return null
}

export interface UseKeyboardOptions {
  enabled?: boolean
  /** Defaults to `window`. */
  target?: Window | HTMLElement | null
}

/**
 * Installs one `keydown` listener that dispatches the bindings. It calls
 * `preventDefault()` on every combination it handles, so Space never scrolls
 * and Alt+Arrow never navigates. The latest bindings are read at event time.
 */
export function useKeyboard(bindings: readonly KeyBinding[], options: UseKeyboardOptions = {}): void {
  const { enabled = true, target } = options
  const ref = useRef(bindings)
  useEffect(() => {
    ref.current = bindings
  })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const node: Window | HTMLElement = target ?? window
    const onKeyDown = (e: Event) => {
      const event = e as KeyboardEvent
      if (shouldIgnoreKeyEvent(event)) return
      const hit = findBinding(event, ref.current)
      if (!hit) return
      event.preventDefault()
      hit.run(event)
    }
    node.addEventListener('keydown', onKeyDown)
    return () => node.removeEventListener('keydown', onKeyDown)
  }, [enabled, target])
}
