// The R3F root registry of the export path (AR-51), split out of exportPng.ts so that a module
// that only needs the live root does not pull in the tile renderer, the overlay painter and the
// PNG encoder (WP-H1). CameraRig registers the root here while the Canvas is mounted; the export
// sheet and the kit thumbnails read it.
import type { RootState } from '@react-three/fiber'
import type { CanvasSize } from './plan.ts'

let rootGetter: (() => RootState) | null = null

/** CameraRig registers the R3F root getter while the Canvas is mounted. */
export function setExportRoot(get: (() => RootState) | null): void {
  rootGetter = get
}

/** The live R3F root, or null before the viewer mounts (the snapshot path of kitActions reads it). */
export function getExportRoot(): RootState | null {
  return rootGetter?.() ?? null
}

/** The canvas CSS size, or null before the viewer mounts. */
export function exportCanvasSize(): CanvasSize | null {
  const root = rootGetter?.()
  return root ? { width: root.size.width, height: root.size.height } : null
}
