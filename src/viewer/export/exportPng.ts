// Export entry point (AR-51 to AR-58, UX-EX-01 to UX-EX-05). CameraRig registers the R3F root
// through setExportRoot in ./root.ts; the dialog calls previewExport for the size line and exportPng for the
// PNG. The pipeline pauses playback, clears hover, waits for the final rebuild, hides the
// screen-space outlines, renders the tiles into offscreen targets without a scene background,
// paints the theme background under the straight-alpha result, draws the overlay and encodes.
import type { RootState } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import { formatTimeForFileName } from '../../core/format.ts'
import { hasMeshAt } from '../../core/presence.ts'
import { readAtlas } from '../../state/store.ts'
import type { AtlasStore, ViewPreset } from '../../state/store.ts'
import { bodyFitPoints } from '../fit.ts'
import { bodyBoundingSphere, fitDistance } from '../presets.ts'
import { ZERO_RECT, frameAt, getRuntime } from '../runtime.ts'
import type { ViewerRuntime } from '../runtime.ts'
import { documentTheme, readThemeTokens, variantFor } from '../tokens.ts'
import { canvasToPng } from './download.ts'
import { exportCanvasSize, getExportRoot } from './root.ts'
import { outlineBands } from './outlineMask.ts'
import { composeImage, drawOverlay, REPORTER_PREVIEW_CREDIT } from './overlay.ts'
import type { Rect } from './overlay.ts'
import { focusHexFor, labelChips, legendRows, makeProjector, readoutText, scaleBarAt, selectionMaskScene } from './overlayInputs.ts'
import type { Projector } from './overlayInputs.ts'
import { MAX_EDGE_PX, exportFileName, outputSize, overlayPalette, tileEdge } from './plan.ts'
import type { ExportOptions, OutputSize } from './plan.ts'
import { applyViewOffset, renderColourTiles, renderMaskTiles } from './tiles.ts'
import type { TileContext } from './tiles.ts'

export type { ExportFixedSize, ExportFrame, ExportOptions, ExportScale, OverlayColour } from './plan.ts'

export interface ExportResult {
  blob: Blob
  width: number
  height: number
  fileName: string
}

export interface ExportHooks {
  onProgress?(done: number, total: number): void
}

/** Longest wait for the rebuild queue to drain at the final level before the export renders anyway. */
export const EXPORT_DRAIN_TIMEOUT_MS = 15_000

/** The output size the dialog states (UX-EX-02); null before the viewer mounts. */
export function previewExport(options: ExportOptions): OutputSize | null {
  const canvas = exportCanvasSize()
  return canvas ? outputSize(options, canvas) : null
}

const VIEW_NAMES: Record<ViewPreset, string> = {
  lateral: 'lateral', dorsal: 'dorsal', ventral: 'ventral', anterior: 'anterior', posterior: 'posterior', threeQuarter: 'three-quarter', free: 'free',
}

const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()))

function allFinal(rt: ViewerRuntime, s: AtlasStore): boolean {
  for (const h of rt.handles.values()) {
    if (h.failed || !hasMeshAt(h.record, s.time, { sex: s.sex })) continue
    if (h.builtLod !== 'final' || h.builtHpf !== s.time) return false
  }
  return true
}

/** Waits until the queue is empty at the final level and the visual pass has applied (AR-54). */
async function waitForFinal(rt: ViewerRuntime): Promise<void> {
  const start = performance.now()
  while (performance.now() - start < EXPORT_DRAIN_TIMEOUT_MS) {
    rt.invalidate()
    await nextFrame()
    const s = readAtlas()
    if (rt.queue.size() === 0 && s.tessellation === 'final' && allFinal(rt, s) && !rt.visualDirty) break
  }
  await nextFrame()
}

/** Hides the drei Outlines (children of the structure meshes) and returns the restore function. */
function hideOutlines(rt: ViewerRuntime): () => void {
  const hidden: { object: { visible: boolean }; visible: boolean }[] = []
  for (const h of rt.handles.values()) {
    for (const mesh of h.meshes) for (const child of mesh.children) {
      hidden.push({ object: child, visible: child.visible })
      child.visible = false
    }
  }
  return () => { for (const e of hidden) e.object.visible = e.visible }
}

interface ExportCamera { camera: PerspectiveCamera; frustumOffset: { x: number; y: number }; centre: Vector3 }

/** The projected bounds of the body fit points in output px; null without a body frame. */
function projectedBodyBox(rt: ViewerRuntime, project: Projector, time: number): Rect | null {
  const frame = rt.lastFrame ?? frameAt(rt, time)
  if (!frame) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of bodyFitPoints(frame)) {
    const q = project(new Vector3(p[0], p[1], p[2]))
    if (!q) continue
    x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y)
  }
  return Number.isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null
}

/** A clone of the live camera; a non-viewport frame keeps the view direction and re-fits the distance (AR-52). */
function exportCamera(root: RootState, rt: ViewerRuntime, out: OutputSize, frame: ExportOptions['frame']): ExportCamera {
  const live = root.camera as PerspectiveCamera
  const camera = live.clone()
  camera.clearViewOffset()
  const body = rt.lastFrame ?? frameAt(rt, readAtlas().time)
  const fit = body ? bodyBoundingSphere(body) : { center: [0, 0, 0] as [number, number, number], radius: 1 }
  const controls = root.controls as { target?: Vector3 } | null
  const centre = controls?.target?.clone() ?? new Vector3(...fit.center)
  let frustumOffset = { x: 0, y: 0 }
  if ((frame ?? 'viewport') === 'viewport') {
    const view = live.view
    if (view?.enabled) frustumOffset = { x: (view.offsetX * out.width) / view.fullWidth, y: (view.offsetY * out.height) / view.fullHeight }
  } else {
    const onScreen = fitDistance(fit.radius, { width: root.size.width, height: root.size.height, reserved: rt.reserved })
    const framed = fitDistance(fit.radius, { width: out.width, height: out.height, reserved: ZERO_RECT })
    const dir = camera.position.clone().sub(centre)
    const dist = Math.max(dir.length(), 1e-6)
    camera.position.copy(centre).addScaledVector(dir.divideScalar(dist), dist * (framed / onScreen))
    camera.aspect = out.width / out.height
  }
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
  return { camera, frustumOffset, centre }
}

/** Renders the current view to a PNG (D1). Rejects before the viewer mounts or above the size cap. */
export async function exportPng(options: ExportOptions = {}, hooks: ExportHooks = {}): Promise<ExportResult> {
  const root = getExportRoot()
  const rt = getRuntime()
  if (!root || !rt.data) throw new Error('The 3D viewer is not ready')
  const out = outputSize(options, { width: root.size.width, height: root.size.height })
  if (out.overCap) throw new Error(`The export would exceed ${MAX_EDGE_PX} px on its longest edge`)
  const transparent = options.transparent ?? false
  const s0 = readAtlas()
  const wasPlaying = s0.playing
  if (wasPlaying) s0.pause()
  s0.setHover(null)
  await waitForFinal(rt)

  const s = readAtlas()
  const { gl, scene } = root
  const glCtx = gl.getContext()
  const edge = tileEdge({
    maxTextureSize: gl.capabilities.maxTextureSize,
    maxRenderbufferSize: Number(glCtx.getParameter(glCtx.MAX_RENDERBUFFER_SIZE)) || gl.capabilities.maxTextureSize,
    phone: typeof matchMedia === 'function' && matchMedia('(max-width: 639px)').matches,
  })
  const { camera, frustumOffset, centre } = exportCamera(root, rt, out, options.frame)
  const ctx: TileContext = { gl, scene, camera, width: out.width, height: out.height, frustumOffset, tileEdge: edge, transparent, onProgress: hooks.onProgress }
  const restoreOutlines = hideOutlines(rt)
  const previousBackground = scene.background
  let rgba: Uint8ClampedArray<ArrayBuffer>
  let mask: Uint8Array | null = null
  try {
    rgba = await renderColourTiles(ctx)
    const wantOutline = (options.includeSelectionOutline ?? s.selection.length > 0) && s.selection.length > 0
    const maskScene = wantOutline ? selectionMaskScene(s, rt) : null
    if (maskScene) {
      try {
        mask = await renderMaskTiles(ctx, maskScene.scene)
      } finally {
        maskScene.dispose()
      }
    }
  } finally {
    scene.background = previousBackground
    restoreOutlines()
    gl.setRenderTarget(null)
    if (wasPlaying) readAtlas().play()
    rt.invalidate()
  }

  applyViewOffset(ctx, null)
  const preview = s.fluorescence.enabled
  // The preview ground, not the page theme, and never the theme key: forcing 'dark' here stored
  // the live theme's colours under that key and every later export read them (review item 4).
  const tokens = readThemeTokens(variantFor(documentTheme(s.theme), preview))
  const palette = overlayPalette(options.overlayColour ?? 'auto', transparent, tokens.theme)
  const project = makeProjector(camera, out.width, out.height)
  const overlay = drawOverlay({
    width: out.width,
    height: out.height,
    scale: out.scale,
    palette,
    readout: (options.includeReadout ?? true) ? readoutText(s) : null,
    // A micrometre bar under a drawn pattern reads as a measured image, so the preview drops it.
    scaleBar: !preview && (options.includeScaleBar ?? true) ? scaleBarAt(project, camera, centre, Math.min(200 * out.scale, out.width * 0.3)) : null,
    legend: (options.includeLegend ?? preview) ? legendRows(s, rt, palette) : [],
    creditPrefix: preview ? REPORTER_PREVIEW_CREDIT : null,
    labels: (options.includeLabels ?? true) ? labelChips(s, rt, project, palette) : [],
    outline: mask ? { bands: outlineBands(mask, out.width, out.height, out.scale), focusHex: focusHexFor(palette) } : null,
    bodyBox: projectedBodyBox(rt, project, s.time),
  })
  // The `--bg` of the variant under the straight-alpha render, so the export background equals
  // the screen's (AR-55).
  const blob = await canvasToPng(composeImage(rgba, out.width, out.height, overlay, transparent ? null : tokens.bg))
  const names = s.selection.map((id) => s.data?.structuresById.get(id)?.name ?? id)
  const fileName = exportFileName({ time: formatTimeForFileName(s.time, s.units), view: VIEW_NAMES[s.viewPreset], selectionNames: names, sizeToken: out.token })
  return { blob, width: out.width, height: out.height, fileName }
}
