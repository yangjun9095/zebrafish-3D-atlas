// Picking (AR-34, UX-IN-01 to UX-IN-06): the raycaster reads layer 1 only, the
// section-plane filter drops hits on the clipped side, and the per-mesh handlers
// select on a still click, add with Shift, isolate on a double click, and hover
// after 80 ms with `stopPropagation` on the first hit.
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect } from 'react'
import type { Intersection } from 'three'
import type { ZfaId } from '../state/store.ts'
import { readAtlas } from '../state/store.ts'
import { RAYCAST_LAYER } from './materials.ts'
import { PARKED_PLANE_CONSTANT, getRuntime } from './runtime.ts'

/** A click moves less than this many CSS px (UX-IN-02). */
export const CLICK_MAX_MOVE_PX = 5
export const TAP_MAX_MOVE_PX = 12
export const TAP_MAX_MS = 300
export const HOVER_DELAY_MS = 80

/** Sets the raycast layer and the clipping-aware filter once per Canvas. */
export function usePickingSetup(): void {
  const raycaster = useThree((s) => s.raycaster)
  const setEvents = useThree((s) => s.setEvents)
  useEffect(() => {
    raycaster.layers.set(RAYCAST_LAYER)
    const rt = getRuntime()
    // AR-34: clipping is a fragment discard the Raycaster does not see; drop hits on the clipped side.
    const filter = (items: Intersection[]): Intersection[] => {
      if (Math.abs(rt.plane.constant) >= PARKED_PLANE_CONSTANT) return items
      return items.filter((hit) => rt.plane.distanceToPoint(hit.point) >= 0)
    }
    setEvents({ filter })
    return () => setEvents({ filter: undefined })
  }, [raycaster, setEvents])
}

/** Records the pointer-down position; the click and missed handlers compare against it. */
export function trackPointerDown(e: PointerEvent | MouseEvent): void {
  const p = getRuntime().pointer
  p.x = e.clientX
  p.y = e.clientY
  p.time = performance.now()
  p.moved = false
}

/** True when the pointer stayed within the click or tap threshold since pointer down. */
export function isStillClick(e: MouseEvent | PointerEvent, touch = false): boolean {
  const p = getRuntime().pointer
  const dist = Math.hypot(e.clientX - p.x, e.clientY - p.y)
  if (touch) return dist < TAP_MAX_MOVE_PX && performance.now() - p.time < TAP_MAX_MS
  return dist < CLICK_MAX_MOVE_PX
}

let hoverTimer: ReturnType<typeof setTimeout> | null = null

function clearHoverTimer(): void {
  if (hoverTimer !== null) clearTimeout(hoverTimer)
  hoverTimer = null
}

export interface PickHandlers {
  onPointerDown(e: ThreeEvent<PointerEvent>): void
  onClick(e: ThreeEvent<MouseEvent>): void
  onDoubleClick(e: ThreeEvent<MouseEvent>): void
  onPointerOver(e: ThreeEvent<PointerEvent>): void
  onPointerOut(e: ThreeEvent<PointerEvent>): void
}

/** Event handlers of one structure mesh. */
export function pickHandlers(id: ZfaId): PickHandlers {
  return {
    onPointerDown(e) {
      trackPointerDown(e.nativeEvent)
    },
    onClick(e) {
      e.stopPropagation()
      const touch = e.nativeEvent instanceof PointerEvent && e.nativeEvent.pointerType === 'touch'
      if (!isStillClick(e.nativeEvent, touch)) return
      readAtlas().select(id, { add: e.nativeEvent.shiftKey })
    },
    onDoubleClick(e) {
      e.stopPropagation()
      const s = readAtlas()
      if (!s.selection.includes(id)) s.select(id)
      s.setIsolate(true)
    },
    onPointerOver(e) {
      e.stopPropagation()
      if (e.nativeEvent.pointerType === 'touch') return
      clearHoverTimer()
      hoverTimer = setTimeout(() => {
        hoverTimer = null
        readAtlas().setHover(id)
      }, HOVER_DELAY_MS)
    },
    onPointerOut() {
      clearHoverTimer()
      const s = readAtlas()
      if (s.hover === id) s.setHover(null)
    },
  }
}

/** Canvas `onPointerMissed`: a still click on empty space clears the selection (UX-IN-06). */
export function onPointerMissed(e: MouseEvent): void {
  if (!isStillClick(e)) return
  readAtlas().select(null)
}
