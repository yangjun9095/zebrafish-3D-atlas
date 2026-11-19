// Section plane (AR-43, UX-IN-19): one world-space Plane that every structure
// material carries from creation. Off means parked, never removed, so no material
// recompiles. Follows the store's section state and the body size at t.
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { atlasStore, readAtlas } from '../state/store.ts'
import { getRuntime } from './runtime.ts'
import { updateSectionPlane } from './section.ts'

export function SectionPlane() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const apply = (): void => {
      const s = readAtlas()
      updateSectionPlane(getRuntime(), s.section, s.time)
      invalidate()
    }
    apply()
    const unsubSection = atlasStore.subscribe((s) => s.section, apply)
    const unsubTime = atlasStore.subscribe((s) => s.time, () => {
      if (readAtlas().section.axis) apply()
    })
    return () => {
      unsubSection()
      unsubTime()
    }
  }, [invalidate])
  return null
}
