// Derived records (D9, DM-24, DM-34, DM-31): a heart chamber, an eye part, an otolith or the
// yolk ball is a named vertex range of its source record's build, drawn with its own material.
// `derivedSourceOf` resolves the source; `slicePart` cuts the range out of a GeometryOut.
import { boundsOf } from './mesh.ts'
import type { GeometryOut } from './types.ts'
import type { StructureRecord } from '../schema.ts'

/** The source record and part name of a `derived` record; null for every other kind or an unknown source. */
export function derivedSourceOf(
  record: StructureRecord,
  byId: ReadonlyMap<string, StructureRecord>,
): { source: StructureRecord; part: string } | null {
  const g = record.geometry
  if (!g || g.kind !== 'derived') return null
  const source = byId.get(g.sourceId)
  return source && source.id !== record.id ? { source, part: g.part } : null
}

/**
 * The named part of a build as its own geometry (heart chambers, eye parts, yolk ball). The part
 * keeps the placement of the whole build, so a local-frame part is placed like its source. Null
 * when the build has no such part or the part is empty.
 */
export function slicePart(out: GeometryOut, part: string): GeometryOut | null {
  const range = out.parts?.[part]
  if (!range || range.vertexCount <= 0 || range.indexCount <= 0) return null
  const { vertexStart, vertexCount, indexStart, indexCount } = range
  const positions = out.positions.slice(vertexStart * 3, (vertexStart + vertexCount) * 3)
  const normals = out.normals.slice(vertexStart * 3, (vertexStart + vertexCount) * 3)
  const uvs = out.uvs.slice(vertexStart * 2, (vertexStart + vertexCount) * 2)
  const idx: number[] = []
  for (let i = indexStart; i + 2 < indexStart + indexCount; i += 3) {
    const a = out.indices[i]! - vertexStart, b = out.indices[i + 1]! - vertexStart, c = out.indices[i + 2]! - vertexStart
    // A triangle that reaches outside the part's vertex range is dropped (defensive; the builders keep parts contiguous).
    if (a < 0 || b < 0 || c < 0 || a >= vertexCount || b >= vertexCount || c >= vertexCount) continue
    idx.push(a, b, c)
  }
  if (idx.length === 0) return null
  const indices = vertexCount > 65535 ? new Uint32Array(idx) : new Uint16Array(idx)
  const sliced: GeometryOut = { positions, normals, uvs, indices, bounds: boundsOf(positions) }
  if (out.placement) sliced.placement = out.placement
  return sliced
}
