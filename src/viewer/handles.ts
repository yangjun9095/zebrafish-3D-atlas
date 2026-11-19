// Structure handles: one Mesh (two for a mirrored pair, two InstancedMesh for a
// segmentArray) and one material per record (AR-27), created once at mount and
// filled by the rebuild driver. Also the synthetic skin record that Body.tsx
// uses when the data carries no whole-organism tube.
import { BufferGeometry, Group, InstancedBufferAttribute, InstancedMesh, Mesh, Vector3 } from 'three'
import type { StructureRecord } from '../core/schema.ts'
import { settingsStore } from '../state/slices/settings.ts'
import { readAtlas } from '../state/store.ts'
import { isLocalFrame, isMirroredPair, isSkinRecord } from '../core/primitives/buildStructure.ts'
import { derivedSourceOf } from '../core/primitives/derived.ts'
import { colourOf, createStructureMaterial } from './materials.ts'
import { SKIN_ID } from './runtime.ts'
import type { StructureHandle, ViewerRuntime } from './runtime.ts'

/** Instance capacity of one side of a segmentArray when the record states no count. */
export const INSTANCE_CAPACITY = 64

/** The largest `count` a segmentArray record states, so the instance buffer never grows during playback. */
export function instanceCapacityOf(record: StructureRecord): number {
  const g = record.geometry
  if (!g || g.kind !== 'segmentArray') return INSTANCE_CAPACITY
  let max = typeof g.count === 'number' ? g.count : 0
  for (const k of g.keyframes) if (typeof k.count === 'number') max = Math.max(max, k.count)
  return max > 0 ? Math.ceil(max) : INSTANCE_CAPACITY
}

function newInstanced(material: StructureHandle['material'], capacity: number): InstancedMesh {
  const mesh = new InstancedMesh(new BufferGeometry(), material, capacity)
  mesh.count = 0
  mesh.frustumCulled = false
  return mesh
}

/**
 * Grows the instance matrix buffer when a rebuild needs more instances than the record
 * stated. `dispose()` first: three frees the old GL buffer only through the InstancedMesh
 * dispose event, and re-arms the listener on the next render.
 */
export function ensureInstanceCapacity(mesh: InstancedMesh, count: number): void {
  const capacity = mesh.instanceMatrix.count
  if (count <= capacity) return
  let next = capacity
  while (next < count) next *= 2
  mesh.dispose()
  mesh.instanceMatrix = new InstancedBufferAttribute(new Float32Array(next * 16), 16)
}

/**
 * The record whose frame flags a handle takes: the source of a derived record, else the record
 * itself. Null while no atlas data is bound, so the caller resolves again on the first frame that
 * has it. A paired derived record (the retina, the pigmented epithelium and the lens of the eye,
 * the otolith) takes its mirror flag from here, or only one side of the pair ever draws.
 */
function shapeOf(rt: ViewerRuntime, record: StructureRecord): StructureRecord | null {
  const data = rt.data ?? readAtlas().data
  if (!data) return null
  const derived = derivedSourceOf(record, data.structuresById)
  return derived ? derived.source : record
}

interface FrameFlags { localFrame: boolean; mirrored: boolean }

/** Reads the frame flags once the shape resolves, and holds them from then on. */
function frameFlags(rt: ViewerRuntime, record: StructureRecord, shape: StructureRecord | null): () => FrameFlags {
  const read = (r: StructureRecord): FrameFlags => ({ localFrame: isLocalFrame(r), mirrored: isMirroredPair(r) })
  let held: FrameFlags | null = shape ? read(shape) : null
  return () => {
    if (!held) {
      const resolved = shapeOf(rt, record)
      if (resolved) held = read(resolved)
    }
    return held ?? read(record)
  }
}

export function createHandle(rt: ViewerRuntime, record: StructureRecord): StructureHandle {
  const state = readAtlas()
  const data = rt.data ?? state.data
  const colour = data ? colourOf(record, data, state.theme, settingsStore.getState().palette) : { hex: '#9AA3AD', opacity: null }
  const material = createStructureMaterial(record, colour.hex, rt.plane)
  // A derived record draws a part of its source's build, so it takes the source's frame flags.
  const shape = shapeOf(rt, record)
  const flags = frameFlags(rt, record, shape)
  // A derived record whose source is still unknown keeps the twin mesh of a paired source: the
  // mesh list is fixed at mount, while `mirrored` resolves on the first frame that has the data.
  const pending = shape === null && record.geometry?.kind === 'derived'
  const instanced = (shape ?? record).geometry?.kind === 'segmentArray'
  const capacity = instanceCapacityOf(shape ?? record)
  const meshes: (Mesh | InstancedMesh)[] = instanced
    ? [newInstanced(material, capacity), newInstanced(material, capacity)]
    : [new Mesh(new BufferGeometry(), material)]
  if (!instanced && (pending || flags().mirrored)) meshes.push(new Mesh(new BufferGeometry(), material))
  for (const mesh of meshes) {
    mesh.name = record.id
    mesh.layers.set(0)
    mesh.userData.zfaId = record.id
  }
  const group = new Group()
  group.name = `structure:${record.id}`
  return {
    id: record.id,
    record,
    group,
    meshes,
    material,
    instanced,
    get localFrame() { return flags().localFrame },
    get mirrored() { return flags().mirrored },
    isSkin: isSkinRecord(record),
    hex: colour.hex,
    roleOpacity: colour.opacity,
    appliedHex: null,
    appliedEmissiveHex: null,
    lodGeometries: meshes.map(() => ({ interactive: null, final: null })),
    builtLod: null,
    builtHpf: null,
    paramHash: null,
    bounds: null,
    placement: null,
    twinPlacement: null,
    center: new Vector3(),
    radius: 0,
    volume: 0,
    opacity: 0,
    presence: null,
    failed: false,
  }
}

/** Frees the geometries of both levels and the material of a handle (BG-55 on unmount). */
export function disposeHandle(handle: StructureHandle): void {
  for (const [i, mesh] of handle.meshes.entries()) {
    const slot = handle.lodGeometries[i]
    for (const g of [mesh.geometry, slot?.interactive, slot?.final]) g?.dispose()
    if (slot) slot.interactive = slot.final = null
  }
  handle.material.dispose()
}

/** The skin record of DM-31 for a data set without ZFA:0001094 (Body.tsx fallback). */
export function syntheticSkinRecord(): StructureRecord {
  return {
    id: SKIN_ID,
    name: 'whole organism',
    synonyms: [],
    system: 'integument_pigment',
    alsoIn: [],
    zfaParent: null,
    uiParent: null,
    parentRelation: 'root',
    definition: 'The body outline, drawn from the body model (DM-31).',
    zfinStartStage: 'ZFS:0000001',
    zfinEndStage: 'ZFS:0000044',
    startHpf: 0,
    endHpf: 4320,
    visibleFromHpf: 0,
    modelEndHpf: 4320,
    overrideNote: null,
    fadeInHpf: 0,
    fadeOutHpf: 0,
    laterality: 'midline',
    pickable: false,
    sexSpecific: null,
    aliasChain: [],
    events: [],
    sizes: [],
    colorOverride: null,
    sources: ['spec DM-31'],
    geometry: {
      kind: 'tube',
      path: { type: 'spine', uStart: 0, uEnd: 1, v: 0, w: 0 },
      radiusMm: 'body',
      caps: 'round',
      keyframes: [{ hpf: 0 }],
      lodHint: 'high',
      estimate: [],
      sources: ['spec BG-30'],
    },
  }
}
