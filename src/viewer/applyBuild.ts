// Applies one rebuild job to a handle (spec 2.3.1 step 4): the placement-only
// path of AR-72, the in-place attribute write with a bounding refresh (RG-04),
// the geometry swap with deferred disposal (BG-55), the drei Outlines resync
// (RG-02), the mirrored twin, and the two InstancedMesh of a segmentArray (BG-32).
import { InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from 'three'
import type { BufferGeometry, Object3D } from 'three'
import type { BodyFrame } from '../core/bodyModel.ts'
import { segmentInstances, templateGeometry } from '../core/primitives/segmentArray.ts'
import type { SegmentArrayParams, SegmentInstance } from '../core/primitives/segmentArray.ts'
import { toBufferGeometry, writeInto } from '../core/primitives/toBufferGeometry.ts'
import type { GeometryOut, GeometryPlacement, Lod } from '../core/primitives/types.ts'
import {
  buildStructure, geometryIsFinite, mirrorGeometry, paramHash, placementOnly, structureParams, twinPlacementOf,
} from '../core/primitives/buildStructure.ts'
import { derivedSourceOf, slicePart } from '../core/primitives/derived.ts'
import type { StructureRecord } from '../core/schema.ts'
import { ensureInstanceCapacity } from './handles.ts'
import type { StructureHandle, ViewerRuntime } from './runtime.ts'

const m4 = new Matrix4()
const v3 = new Vector3()
const q4 = new Quaternion()
const s3 = new Vector3()

/** Points every child outline mesh (drei Outlines with angle 0) at the current geometry and instances (RG-02). */
export function syncOutlines(mesh: Object3D & { geometry: BufferGeometry }): void {
  for (const child of mesh.children) {
    const outline = child.children[0]
    if (!(outline instanceof Mesh)) continue
    if (outline.geometry !== mesh.geometry) outline.geometry = mesh.geometry
    if (outline instanceof InstancedMesh && mesh instanceof InstancedMesh) {
      outline.count = mesh.count
      outline.instanceMatrix = mesh.instanceMatrix
    }
  }
}

function sameCounts(geometry: BufferGeometry, out: GeometryOut): boolean {
  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  return (
    position !== undefined &&
    position.count === out.positions.length / 3 &&
    index !== null &&
    index.count === out.indices.length &&
    index.array.constructor === out.indices.constructor
  )
}

/**
 * Writes a build into the mesh's geometry for `lod` (BG-55): one BufferGeometry per level
 * per mesh, written in place when the counts match, else replaced with deferred disposal.
 * A level switch swaps `mesh.geometry` between the two and keeps the other level's buffers.
 */
export function writeGeometry(rt: ViewerRuntime, handle: StructureHandle, meshIndex: number, out: GeometryOut, lod: Lod): void {
  const mesh = handle.meshes[meshIndex]!
  const slot = handle.lodGeometries[meshIndex]!
  let geometry = slot[lod]
  if (geometry && sameCounts(geometry, out)) {
    writeInto(geometry, out)
  } else {
    const stale = geometry
    geometry = toBufferGeometry(out)
    slot[lod] = geometry
    if (stale) rt.disposeLater.push(stale)
  }
  if (mesh.geometry !== geometry) {
    const previous = mesh.geometry
    mesh.geometry = geometry
    // The other level's geometry stays for the next switch; the placeholder of createHandle and a
    // replaced geometry are freed once.
    const kept = previous === slot.interactive || previous === slot.final || rt.disposeLater.includes(previous)
    if (!kept) rt.disposeLater.push(previous)
    syncOutlines(mesh)
  }
}

function setTransform(mesh: Object3D, placement: GeometryPlacement | null): void {
  if (placement) {
    mesh.position.set(placement.position[0], placement.position[1], placement.position[2])
    mesh.quaternion.set(placement.quaternion[0], placement.quaternion[1], placement.quaternion[2], placement.quaternion[3])
    mesh.scale.set(placement.scale[0], placement.scale[1], placement.scale[2])
  } else {
    mesh.position.set(0, 0, 0)
    mesh.quaternion.identity()
    mesh.scale.set(1, 1, 1)
  }
}

function setPlacements(handle: StructureHandle, placement: GeometryPlacement | null, twin: GeometryPlacement | null): void {
  setTransform(handle.meshes[0]!, placement)
  const second = handle.meshes[1]
  if (second && !handle.instanced) {
    second.visible = twin !== null
    setTransform(second, twin)
  }
  handle.placement = placement
  handle.twinPlacement = twin
}

/** World centre, radius and box volume of the last build, for priority, labels and the debug hook. */
function updateExtent(handle: StructureHandle): void {
  const b = handle.bounds
  if (!b) return
  const size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]]
  const p = handle.placement
  if (p) {
    const scale = Math.max(p.scale[0], p.scale[1], p.scale[2])
    handle.center.set(p.position[0], p.position[1], p.position[2])
    handle.radius = b.radius * scale
    if (handle.twinPlacement) {
      const t = handle.twinPlacement.position
      handle.center.set((p.position[0] + t[0]) / 2, (p.position[1] + t[1]) / 2, (p.position[2] + t[2]) / 2)
      handle.radius = handle.center.distanceTo(v3.set(t[0], t[1], t[2])) + b.radius * scale
    }
    handle.volume = size[0]! * size[1]! * size[2]! * scale ** 3
  } else {
    handle.center.set(b.center[0], b.center[1], b.center[2])
    handle.radius = b.radius
    handle.volume = size[0]! * size[1]! * size[2]!
  }
}

/** The record whose builder runs for a handle: the source of a derived record, else the record itself. */
function buildSubject(rt: ViewerRuntime, handle: StructureHandle): { record: StructureRecord; part: string | null } {
  const derived = rt.data ? derivedSourceOf(handle.record, rt.data.structuresById) : null
  return derived ? { record: derived.source, part: derived.part } : { record: handle.record, part: null }
}

/** Hides the mesh when the build draws nothing at this time (a yolk with no ball, a missing part). */
function markEmpty(handle: StructureHandle, t: number, lod: Lod, hash: string | null): void {
  handle.bounds = null
  handle.builtLod = lod
  handle.builtHpf = t
  handle.paramHash = hash
}

/**
 * One mesh (or a mirrored pair): placement only when the hash is unchanged, else build and write.
 * A derived record builds its source and keeps the named part (D9, DM-24, DM-34).
 */
export function applyMeshBuild(rt: ViewerRuntime, handle: StructureHandle, frame: BodyFrame, t: number, lod: Lod): void {
  const { record, part } = buildSubject(rt, handle)
  const params = structureParams(record, t, frame.slMm)
  // Only a local-frame build can skip its rebuild on an unchanged hash (AR-72); world-space kinds never match.
  const hash = handle.localFrame ? `${paramHash(record, params, lod, frame)}|${part ?? ''}` : null
  if (handle.localFrame && handle.bounds && hash === handle.paramHash && handle.builtLod === lod) {
    const placement = placementOnly(record, params, frame)
    if (placement) {
      setPlacements(handle, placement, twinPlacementOf(record, params, frame))
      handle.builtHpf = t
      updateExtent(handle)
      return
    }
  }
  const whole = buildStructure(record, frame, t, lod, params)
  const out = whole && part !== null ? slicePart(whole, part) : whole
  if (!out) {
    // Nothing to draw at this time (a yolk with no ball, a chorion after its keyframes): keep the mesh hidden.
    markEmpty(handle, t, lod, hash)
    return
  }
  if (!geometryIsFinite(out)) throw new Error('builder returned a non-finite value')
  writeGeometry(rt, handle, 0, out, lod)
  const placement = out.placement ?? null
  const twin = placement ? twinPlacementOf(record, params, frame) : null
  if (handle.mirrored && handle.meshes[1] && twin) writeGeometry(rt, handle, 1, mirrorGeometry(out), lod)
  setPlacements(handle, placement, twin)
  handle.bounds = out.bounds
  handle.builtLod = lod
  handle.builtHpf = t
  handle.paramHash = hash
  updateExtent(handle)
}

function writeInstances(mesh: InstancedMesh, instances: SegmentInstance[]): void {
  ensureInstanceCapacity(mesh, instances.length)
  instances.forEach((inst, i) => {
    const { position, quaternion, scale } = inst.placement
    m4.compose(
      v3.set(position[0], position[1], position[2]),
      q4.set(quaternion[0], quaternion[1], quaternion[2], quaternion[3]),
      s3.set(scale[0], scale[1], scale[2]),
    )
    mesh.setMatrixAt(i, m4)
  })
  mesh.count = instances.length
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
}

/** A segmentArray: two InstancedMesh (right, left) with the template built once per side (BG-32). */
export function applyInstancedBuild(rt: ViewerRuntime, handle: StructureHandle, frame: BodyFrame, t: number, lod: Lod): void {
  const params = structureParams(handle.record, t, frame.slMm) as unknown as SegmentArrayParams
  const [right, left] = handle.meshes as [InstancedMesh, InstancedMesh]
  if (!params.template || typeof params.count !== 'number' || params.count <= 0) {
    right.count = 0
    left.count = 0
    handle.bounds = null
    handle.builtLod = lod
    handle.builtHpf = t
    return
  }
  const rightGeom = templateGeometry(params, frame, lod, false)
  const leftGeom = templateGeometry(params, frame, lod, true)
  if (!geometryIsFinite(rightGeom) || !geometryIsFinite(leftGeom)) throw new Error('template returned a non-finite value')
  writeGeometry(rt, handle, 0, rightGeom, lod)
  writeGeometry(rt, handle, 1, leftGeom, lod)
  const instances = segmentInstances(params, frame)
  writeInstances(right, instances.filter((i) => i.side === 'right'))
  writeInstances(left, instances.filter((i) => i.side === 'left'))
  syncOutlines(right)
  syncOutlines(left)
  // Extent from the instance positions plus the template radius.
  const r = rightGeom.bounds.radius
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const inst of instances) {
    const p = inst.placement.position
    const s = Math.max(inst.placement.scale[0], inst.placement.scale[1], inst.placement.scale[2]) * r
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, p[k]! - s)
      max[k] = Math.max(max[k]!, p[k]! + s)
    }
  }
  if (!Number.isFinite(min[0]!)) {
    handle.bounds = null
  } else {
    const center: [number, number, number] = [(min[0]! + max[0]!) / 2, (min[1]! + max[1]!) / 2, (min[2]! + max[2]!) / 2]
    const radius = Math.hypot(max[0]! - center[0], max[1]! - center[1], max[2]! - center[2])
    handle.bounds = { min: [min[0]!, min[1]!, min[2]!], max: [max[0]!, max[1]!, max[2]!], center, radius }
  }
  handle.placement = null
  handle.twinPlacement = null
  handle.builtLod = lod
  handle.builtHpf = t
  handle.paramHash = null
  updateExtent(handle)
}
