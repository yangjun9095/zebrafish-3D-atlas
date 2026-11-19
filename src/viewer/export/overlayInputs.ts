// Builds the overlay content from the store and the viewer runtime (AR-56, AR-57): the readout
// text, the scale bar length at the body depth, the legend of visible systems, the label chips
// in the AR-37 priority, and the mask scene of the selected meshes for the outline.
import { DoubleSide, InstancedMesh, Mesh, MeshBasicMaterial, Scene, Vector3 } from 'three'
import type { Camera } from 'three'
import { formatReadout, lengthAt } from '../../core/format.ts'
import { FOCUS_HEX, systemHex } from '../../core/palette.ts'
import { hasMeshAt } from '../../core/presence.ts'
import { REPORTERS, resolveFluorescence } from '../../core/fluorescence.ts'
import type { ReporterId } from '../../core/fluorescence.ts'
import { stageAt } from '../../core/timeAxis.ts'
import { settingsStore } from '../../state/slices/settings.ts'
import type { AtlasStore } from '../../state/store.ts'
import { labelEligible } from '../labelEligibility.ts'
import { LABEL_BUDGET } from '../Labels.tsx'
import { colourOf, fluorescenceColor, isGhosted } from '../materials.ts'
import type { StructureHandle, ViewerRuntime } from '../runtime.ts'
import type { LegendRow, OverlayLabel } from './overlay.ts'
import { scaleBarFor } from './plan.ts'
import type { OverlayPalette } from './plan.ts'

export interface Projector {
  /** Output-pixel position of a world point, or null behind the camera. */
  (p: Vector3): { x: number; y: number } | null
}

/** Projects world points with the export camera into an image of `width` by `height`. */
export function makeProjector(camera: Camera, width: number, height: number): Projector {
  const tmp = new Vector3()
  camera.updateMatrixWorld()
  return (p) => {
    tmp.copy(p).project(camera)
    if (!Number.isFinite(tmp.x) || !Number.isFinite(tmp.y) || tmp.z > 1) return null
    return { x: ((tmp.x + 1) / 2) * width, y: ((1 - tmp.y) / 2) * height }
  }
}

export function readoutText(s: AtlasStore): string | null {
  const data = s.data
  if (!data) return null
  const stage = stageAt(data.stages.stages, s.time)
  return formatReadout({ hpf: s.time, stageShortLabel: stage.shortLabel, length: lengthAt(data.stages.growth, s.time), units: s.units, snap: s.snap })
}

/** Scale bar from the pixel length of 1 mm along the camera's right axis at `centre` (AR-56). */
export function scaleBarAt(project: Projector, camera: Camera, centre: Vector3, maxPx: number): { px: number; label: string } | null {
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize()
  const a = project(centre)
  const b = project(centre.clone().addScaledVector(right, 1))
  if (!a || !b) return null
  const choice = scaleBarFor(Math.hypot(b.x - a.x, b.y - a.y), maxPx)
  return choice ? { px: choice.px, label: choice.label } : null
}

/** Visible systems in rail order: not hidden and with at least one drawn structure at t. */
export function legendRows(s: AtlasStore, rt: ViewerRuntime, palette: OverlayPalette): LegendRow[] {
  const data = s.data
  if (!data) return []
  if (s.fluorescence.enabled) {
    const signals = resolveFluorescence(data, s.fluorescence, s.time, s.sex)
    const channels = new Set<ReporterId>()
    for (const [id, reporters] of signals) {
      const h = rt.handles.get(id)
      if (!h || h.failed || h.opacity <= 0 || !h.bounds || !h.group.visible) continue
      if (s.isolate && s.selection.length > 0 && !(s.selection as readonly string[]).includes(id)) continue
      for (const reporter of reporters) channels.add(reporter)
    }
    return [...channels].sort().map((id) => ({ name: REPORTERS[id].name, swatch: REPORTERS[id].hex }))
  }
  const drawn = new Set<string>()
  for (const h of rt.handles.values()) {
    if (h.isSkin || h.failed || h.opacity <= 0 || !h.bounds) continue
    if (!hasMeshAt(h.record, s.time, { sex: s.sex })) continue
    if ((s.hiddenStructures as readonly string[]).includes(h.id)) continue
    if (s.isolate && s.selection.length > 0 && !(s.selection as readonly string[]).includes(h.id)) continue
    drawn.add(h.record.system)
  }
  return [...data.systems]
    .sort((a, b) => a.order - b.order)
    .filter((sys) => drawn.has(sys.id) && !(s.hiddenSystems as readonly string[]).includes(sys.id))
    .map((sys) => ({ name: sys.displayName, swatch: systemHex(sys, palette.swatchTheme, settingsStore.getState().palette) }))
}

/** Label chips in the Labels.tsx priority: selected, pinned, then the largest present structures when labels are on. */
export function labelChips(s: AtlasStore, rt: ViewerRuntime, project: Projector, palette: OverlayPalette): OverlayLabel[] {
  const data = s.data
  if (!data) return []
  const state = { presentIds: s.presentIds, hiddenSystems: s.hiddenSystems, hiddenStructures: s.hiddenStructures, isolate: s.isolate, selection: s.selection }
  const ids: string[] = []
  const push = (id: string): void => {
    if (ids.includes(id) || ids.length >= LABEL_BUDGET) return
    const h = rt.handles.get(id)
    if (!h || h.opacity <= 0 || !h.bounds || !labelEligible(data.structuresById.get(id), state)) return
    ids.push(id)
  }
  s.selection.forEach(push)
  s.pinnedLabels.forEach(push)
  if (s.labels) {
    const rest = s.presentIds
      .map((id) => rt.handles.get(id))
      .filter((h): h is StructureHandle => h !== undefined && !h.isSkin)
      .sort((a, b) => b.radius - a.radius)
    for (const h of rest) push(h.id)
  }
  const out: OverlayLabel[] = []
  const signals = s.fluorescence.enabled ? resolveFluorescence(data, s.fluorescence, s.time, s.sex) : null
  const isolate = { isolate: s.isolate, selection: s.selection as readonly string[] }
  for (const id of ids) {
    const h = rt.handles.get(id)!
    const p = project(h.center)
    if (!p) continue
    // The viewer paints an isolate ghost in the muted colour with no signal, so its chip carries
    // the structure colour and not a reporter swatch (review item 13).
    const channels = signals && !isGhosted(id, isolate) ? signals.get(id) : undefined
    out.push({ x: p.x, y: p.y, text: h.record.name, swatch: channels?.length ? fluorescenceColor(channels) : colourOf(h.record, data, palette.swatchTheme, settingsStore.getState().palette).hex })
  }
  return out
}

export interface MaskScene { scene: Scene; dispose(): void }

/** A scene of white copies of the selected meshes, sharing their geometry and world matrices. */
export function selectionMaskScene(s: AtlasStore, rt: ViewerRuntime): MaskScene | null {
  const material = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide, clippingPlanes: [rt.plane], toneMapped: false })
  const scene = new Scene()
  for (const id of s.selection) {
    const h = rt.handles.get(id)
    if (!h || h.failed || h.opacity <= 0 || !h.bounds || !h.group.visible) continue
    for (const mesh of h.meshes) {
      if (!mesh.visible) continue
      const copy = mesh instanceof InstancedMesh ? new InstancedMesh(mesh.geometry, material, mesh.count) : new Mesh(mesh.geometry, material)
      if (copy instanceof InstancedMesh && mesh instanceof InstancedMesh) copy.instanceMatrix.copy(mesh.instanceMatrix)
      copy.matrixAutoUpdate = false
      copy.matrix.copy(mesh.matrixWorld)
      copy.matrixWorldNeedsUpdate = true
      copy.frustumCulled = false
      scene.add(copy)
    }
  }
  if (scene.children.length === 0) {
    material.dispose()
    return null
  }
  return {
    scene,
    dispose() {
      for (const child of scene.children) if (child instanceof InstancedMesh) child.dispose()
      material.dispose()
    },
  }
}

export function focusHexFor(palette: OverlayPalette): string {
  return FOCUS_HEX[palette.swatchTheme]
}
