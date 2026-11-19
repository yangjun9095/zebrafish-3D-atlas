// GeometryOut to three BufferGeometry (AR-04, AR-72). This is the one file
// under src/core that imports three. `writeInto` reuses the existing
// attributes when the counts match and sets the bounds from `out.bounds`.
import { Box3, BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three'
import type { GeometryOut } from './types.ts'

export function toBufferGeometry(out: GeometryOut): BufferGeometry {
  const geometry = new BufferGeometry()
  writeInto(geometry, out)
  return geometry
}

function setOrReplace(geometry: BufferGeometry, name: string, array: Float32Array, itemSize: number): void {
  const existing = geometry.getAttribute(name)
  if (existing && existing.count === array.length / itemSize && existing.itemSize === itemSize && existing.array instanceof Float32Array) {
    ;(existing.array as Float32Array).set(array)
    existing.needsUpdate = true
    return
  }
  geometry.setAttribute(name, new BufferAttribute(array.slice(), itemSize))
}

/** Update `geometry` in place from `out`; recreates an attribute only when its count changes. */
export function writeInto(geometry: BufferGeometry, out: GeometryOut): BufferGeometry {
  setOrReplace(geometry, 'position', out.positions, 3)
  setOrReplace(geometry, 'normal', out.normals, 3)
  setOrReplace(geometry, 'uv', out.uvs, 2)
  const index = geometry.getIndex()
  if (index && index.count === out.indices.length && index.array.constructor === out.indices.constructor) {
    ;(index.array as Uint16Array | Uint32Array).set(out.indices)
    index.needsUpdate = true
  } else {
    geometry.setIndex(new BufferAttribute(out.indices.slice(), 1))
  }
  const { min, max, center, radius } = out.bounds
  geometry.boundingBox = new Box3(new Vector3(...min), new Vector3(...max))
  geometry.boundingSphere = new Sphere(new Vector3(...center), radius)
  return geometry
}
