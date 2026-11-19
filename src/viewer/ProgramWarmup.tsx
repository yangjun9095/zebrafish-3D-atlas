// Program warm-up (AR-75): compiles every material variant the viewer can reach
// (opaque and transparent, FrontSide and DoubleSide, each with the section plane)
// once at load, so the first fade, ghost or section press reuses a cached program.
// The probe meshes are degenerate, added for the compile and removed after it.
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { BufferAttribute, BufferGeometry, DoubleSide, FrontSide, Group, Mesh, MeshStandardMaterial } from 'three'
import { METALNESS, ROUGHNESS } from './materials.ts'
import { getRuntime } from './runtime.ts'

export function ProgramWarmup() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    const plane = getRuntime().plane
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1e-6, 0, 0, 0, 1e-6, 0]), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), 3))
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(6), 2))
    const group = new Group()
    const materials: MeshStandardMaterial[] = []
    for (const side of [FrontSide, DoubleSide]) {
      for (const transparent of [false, true]) {
        const material = new MeshStandardMaterial({ roughness: ROUGHNESS, metalness: METALNESS, side, transparent, opacity: 0.5 })
        material.clippingPlanes = [plane]
        materials.push(material)
        const mesh = new Mesh(geometry, material)
        mesh.frustumCulled = false
        group.add(mesh)
      }
    }
    scene.add(group)
    let cancelled = false
    const cleanup = (): void => {
      scene.remove(group)
      geometry.dispose()
      for (const m of materials) m.dispose()
    }
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) cleanup()
      })
    return () => {
      cancelled = true
      cleanup()
    }
  }, [gl, scene, camera])
  return null
}
