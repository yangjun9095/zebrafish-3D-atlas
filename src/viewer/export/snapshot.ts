// Light snapshot of the live canvas (UI-38 thumbnails): one synchronous render of the scene with
// the live camera, copied into a small 2D canvas in the same task, so it never waits for the
// rebuild queue, never pauses playback and never hides the outlines. exportPng stays the path
// for a PNG the user keeps.
import { getExportRoot } from './root.ts'

/** A data URL of the current view at `width` px, or null before the viewer mounts or without a 2D context. */
export function snapshotDataUrl(width: number): string | null {
  const root = getExportRoot()
  if (!root) return null
  const { gl, scene, camera } = root
  const source = gl.domElement
  if (source.width === 0 || source.height === 0) return null
  const height = Math.max(1, Math.round((source.height / source.width) * width))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  // preserveDrawingBuffer is off: draw right after the render, before the browser composites.
  gl.render(scene, camera)
  ctx.drawImage(source, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}
