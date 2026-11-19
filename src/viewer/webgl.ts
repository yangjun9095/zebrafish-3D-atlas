// WebGL probe and the viewer's fixed texts (AR-67, AR-68).

export const CONTEXT_LOST_TEXT = 'The 3D view paused. Restoring…'
export const WEBGL_UNAVAILABLE_TEXT = 'This browser cannot run the 3D viewer. Try a current version of Chrome, Firefox or Safari.'

/** WebGL 2 probe: three 0.185 needs WebGL 2. */
export function probeWebgl2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return canvas.getContext('webgl2') !== null
  } catch {
    return false
  }
}

/** Interactive device pixel ratio: capped near a 2560 px wide backing store (AR-21). */
export function interactiveDpr(cssWidth: number): number {
  const device = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
  return Math.min(device, 2560 / Math.max(1, cssWidth), 2)
}
