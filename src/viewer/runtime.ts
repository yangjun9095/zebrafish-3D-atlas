// Viewer runtime: the structure handles, the body model, the rebuild queue
// and the section plane, shared by the scene components, the rebuild driver,
// picking, labels and the debug hook. One module singleton, because the app
// mounts one viewer (AR-05: the viewer reads the store and core only).
import { Plane, Vector3 } from 'three'
import type { BufferGeometry, Camera, Group, InstancedMesh, Mesh, MeshStandardMaterial } from 'three'
import type { BodyFrame, BodyModel } from '../core/bodyModel.ts'
import { createBodyModel } from '../core/bodyModel.ts'
import type { Bounds, GeometryPlacement, Lod } from '../core/primitives/types.ts'
import type { Presence } from '../core/presence.ts'
import { createRebuildQueue } from '../core/rebuildQueue.ts'
import type { RebuildQueue } from '../core/rebuildQueue.ts'
import type { AtlasData, StructureRecord } from '../core/schema.ts'

/** The plane constant while no section is active (AR-43). */
export const PARKED_PLANE_CONSTANT = 1e6
/** The whole-organism record: the skin (DM-31). */
export const SKIN_ID = 'ZFA:0001094'

export interface ReservedRect { top: number; right: number; bottom: number; left: number }
export const ZERO_RECT: ReservedRect = { top: 0, right: 0, bottom: 0, left: 0 }

/** One structure in the scene: its record, its objects and the state of its last build. */
export interface StructureHandle {
  id: string
  record: StructureRecord
  /** Container of the meshes; carries nothing but children. */
  group: Group
  /** One mesh; two for a mirrored local-frame pair; two InstancedMesh (right, left) for a segmentArray. */
  meshes: (Mesh | InstancedMesh)[]
  material: MeshStandardMaterial
  instanced: boolean
  /** Compact kinds take a placement and rebuild only when the parameters change (AR-72). */
  localFrame: boolean
  /** A paired local-frame record draws a mirrored twin at +|w| (placement.mirror). */
  mirrored: boolean
  isSkin: boolean
  /** Base colour hex and the role opacity from the palette (D10). */
  hex: string
  roleOpacity: number | null
  /** Colour and emissive hex last written to the material, so a pass without change skips the parse. */
  appliedHex: string | null
  appliedEmissiveHex: string | null
  /** One BufferGeometry per tessellation level per mesh (BG-55); a level switch swaps, a rebuild writes in place. */
  lodGeometries: { interactive: BufferGeometry | null; final: BufferGeometry | null }[]
  builtLod: Lod | null
  builtHpf: number | null
  paramHash: string | null
  bounds: Bounds | null
  /** Placement of the last local-frame build; identity for world-space kinds. */
  placement: GeometryPlacement | null
  twinPlacement: GeometryPlacement | null
  /** World-space centre of the last build (labels, debug hook, priority). */
  center: Vector3
  radius: number
  volume: number
  /** Last applied visual state. */
  opacity: number
  presence: Presence | null
  failed: boolean
}

export interface PointerTrack { x: number; y: number; time: number; moved: boolean }

export interface ViewerRuntime {
  data: AtlasData | null
  bodyModel: BodyModel | null
  handles: Map<string, StructureHandle>
  queue: RebuildQueue
  plane: Plane
  /** Frame counter of the rebuild loop. */
  frameNo: number
  /**
   * Bumped whenever a build lands, a handle retires, or a structure mounts or unmounts: the
   * dissect layout keys its caches on it instead of walking every handle box per frame.
   */
  buildVersion: number
  lastFrame: BodyFrame | null
  /** Bumped by every store change; the visual pass runs when it differs from the applied one. */
  storeVersion: number
  visualDirty: boolean
  /** Geometries replaced this frame, disposed at the start of the next (BG-55). */
  disposeLater: { dispose(): void }[]
  reserved: ReservedRect
  cameraPlaced: boolean
  ready: boolean
  readyListeners: Set<() => void>
  pointer: PointerTrack
  canvas: HTMLCanvasElement | null
  /** R3F invalidate and the active camera, set by the scene for the module-level driver. */
  invalidate: () => void
  camera: Camera | null
  /** Set when a drain at the final level emptied the queue. */
  finalDrained: boolean
}

let runtime: ViewerRuntime | null = null

export function getRuntime(): ViewerRuntime {
  if (!runtime) {
    runtime = {
      data: null,
      bodyModel: null,
      handles: new Map(),
      queue: createRebuildQueue(),
      plane: new Plane(new Vector3(0, 0, 1), PARKED_PLANE_CONSTANT),
      frameNo: 0,
      buildVersion: 0,
      lastFrame: null,
      storeVersion: 1,
      visualDirty: true,
      disposeLater: [],
      reserved: ZERO_RECT,
      cameraPlaced: false,
      ready: false,
      readyListeners: new Set(),
      pointer: { x: 0, y: 0, time: 0, moved: false },
      canvas: null,
      invalidate: () => {},
      camera: null,
      finalDrained: false,
    }
  }
  return runtime
}

/** Binds the parsed data to the runtime and creates the body model once per data object (BG-10). */
export function bindData(rt: ViewerRuntime, data: AtlasData | null): void {
  if (rt.data === data) return
  rt.data = data
  rt.bodyModel = data ? createBodyModel(data.body, data.stages.growth) : null
  rt.lastFrame = null
  rt.buildVersion++
  rt.ready = false
  rt.finalDrained = false
}

/** The body frame at t; memoised inside the body model on t rounded to 0.001 h (AR-08). */
export function frameAt(rt: ViewerRuntime, t: number): BodyFrame | null {
  if (!rt.bodyModel) return null
  const frame = rt.bodyModel(t)
  rt.lastFrame = frame
  return frame
}

export function markReady(rt: ViewerRuntime): void {
  if (rt.ready) return
  rt.ready = true
  for (const cb of rt.readyListeners) cb()
}

/** Resets the singleton; tests only. */
export function resetRuntime(): void {
  runtime = null
}
