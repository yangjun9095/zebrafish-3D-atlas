import { useCallback, useSyncExternalStore } from 'react'

function canMatch(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/** Returns whether `query` matches now; false on the server and in tests without a window. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatch()) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = useCallback(() => (canMatch() ? window.matchMedia(query).matches : false), [query])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
