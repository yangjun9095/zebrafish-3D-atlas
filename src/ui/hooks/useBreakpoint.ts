import { useMediaQuery } from './useMediaQuery.ts'

/** The three layouts of spec 5.1.1: phone under 640 px, tablet to 1279 px, desktop from 1280 px. */
export type Breakpoint = 'phone' | 'tablet' | 'desktop'

export const TABLET_MIN_PX = 640
export const DESKTOP_MIN_PX = 1280

/** Picks the layout from a viewport width in CSS px. */
export function breakpointFor(widthPx: number): Breakpoint {
  if (widthPx >= DESKTOP_MIN_PX) return 'desktop'
  if (widthPx >= TABLET_MIN_PX) return 'tablet'
  return 'phone'
}

/** Returns the current layout; 'phone' when no window exists. */
export function useBreakpoint(): Breakpoint {
  const tablet = useMediaQuery(`(min-width: ${TABLET_MIN_PX}px)`)
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_MIN_PX}px)`)
  if (desktop) return 'desktop'
  if (tablet) return 'tablet'
  return 'phone'
}
