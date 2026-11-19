// First-run hint helpers (UX-ST-11): the replay hook for "Show tips" and the URL rule.

const replayListeners = new Set<() => void>()

/** Replays the three chips; the help menu's "Show tips" calls it. */
export function replayFirstRunHint(): void {
  for (const cb of replayListeners) cb()
}

export function onReplayFirstRunHint(cb: () => void): () => void {
  replayListeners.add(cb)
  return () => {
    replayListeners.delete(cb)
  }
}

/** True when the URL carries no state parameter other than `theme`; a deep link shows no chips. */
export function urlAllowsHint(search: string): boolean {
  const keys = [...new URLSearchParams(search).keys()]
  return keys.every((k) => k === 'theme')
}
