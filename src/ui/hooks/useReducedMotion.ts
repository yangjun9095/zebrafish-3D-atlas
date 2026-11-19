import { useMediaQuery } from './useMediaQuery.ts'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** True when the user asked for reduced motion (UX-AC-07): cut instead of tween. */
export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY)
}
