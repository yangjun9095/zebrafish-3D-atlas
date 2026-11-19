import { useSyncExternalStore } from 'react'

export type ToastKind = 'info' | 'success' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: number
  text: string
  kind: ToastKind
  durationMs: number
  action?: ToastAction
}

export interface ToastOptions {
  kind?: ToastKind
  /** Defaults to 2 s for confirmations and 6 s for errors (UX-ST-13). */
  durationMs?: number
  action?: ToastAction
}

/** Standard toast texts of spec 2.10 and 5.10. */
export const toastText = {
  contextLost: 'The 3D view paused. Restoring…',
  timeClamped: 'Time clamped to 180 dpf',
  offline: 'You are offline; ZFIN links will not open',
  linkCopied: 'Link copied',
  copied: 'Copied',
  unknownStructure: (id: string) => `Structure ${id} is not in this atlas`,
} as const

export const TOAST_CONFIRM_MS = 2000
export const TOAST_ERROR_MS = 6000

const listeners = new Set<() => void>()
let queue: readonly ToastItem[] = []
let nextId = 1
let timer: ReturnType<typeof setTimeout> | null = null
let errorsOnly = false

function emit() {
  for (const cb of listeners) cb()
}

function arm() {
  if (timer) clearTimeout(timer)
  timer = null
  const head = queue[0]
  if (!head) return
  timer = setTimeout(() => dismissToast(head.id), head.durationMs)
}

/**
 * Queues a toast. One shows at a time; the next one shows when the current one closes.
 * A toast whose text is already queued is not queued twice; its id is returned.
 */
export function showToast(text: string, opts: ToastOptions = {}): number {
  const kind = opts.kind ?? 'info'
  if (errorsOnly && kind !== 'error') return -1
  const queued = queue.find((t) => t.text === text && t.kind === kind)
  if (queued) return queued.id
  const item: ToastItem = {
    id: nextId++,
    text,
    kind,
    durationMs: opts.durationMs ?? (kind === 'error' ? TOAST_ERROR_MS : TOAST_CONFIRM_MS),
    action: opts.action,
  }
  const wasEmpty = queue.length === 0
  queue = [...queue, item]
  if (wasEmpty) arm()
  emit()
  return item.id
}

/** Removes one toast by id, or the visible one when no id is given. */
export function dismissToast(id?: number): void {
  const target = id ?? queue[0]?.id
  if (target === undefined) return
  const wasHead = queue[0]?.id === target
  queue = queue.filter((t) => t.id !== target)
  if (wasHead) arm()
  emit()
}

/** Drops every queued toast. */
export function clearToasts(): void {
  queue = []
  if (timer) clearTimeout(timer)
  timer = null
  emit()
}

/** In presentation mode only error toasts show (UX-ST-13). */
export function setToastErrorsOnly(on: boolean): void {
  errorsOnly = on
  if (on && queue.some((t) => t.kind !== 'error')) {
    queue = queue.filter((t) => t.kind === 'error')
    arm()
    emit()
  }
}

export function getToasts(): readonly ToastItem[] {
  return queue
}

export function subscribeToasts(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** The toast queue; the first item is the visible one. */
export function useToasts(): readonly ToastItem[] {
  return useSyncExternalStore(subscribeToasts, getToasts, getToasts)
}
