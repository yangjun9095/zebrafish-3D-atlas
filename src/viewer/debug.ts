// Test hook (QP-38): `window.__atlasDebug.project(u, v, w)` and
// `projectStructure(zfaId)` return CSS-pixel page coordinates or null. Installed
// while the scene is mounted; the browser tests skip without it.
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Vector3 } from 'three'
import { readAtlas } from '../state/store.ts'
import { frameAt, getRuntime } from './runtime.ts'
import type { ViewerRuntime } from './runtime.ts'

export interface AtlasDebug {
  project(u: number, v: number, w: number): { x: number; y: number } | null
  projectStructure(zfaId: string): { x: number; y: number } | null
  /** A snapshot of the store, for browser tests. */
  state(): Record<string, unknown>
  runtime: ViewerRuntime
}

declare global {
  interface Window { __atlasDebug?: AtlasDebug }
}

const tmp = new Vector3()

export function useDebugHook(): void {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const rt = getRuntime()
    const toPage = (p: Vector3): { x: number; y: number } | null => {
      camera.updateMatrixWorld()
      const v = tmp.copy(p).project(camera)
      if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null
      const rect = gl.domElement.getBoundingClientRect()
      return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height }
    }
    window.__atlasDebug = {
      project(u, v, w) {
        const frame = frameAt(rt, readAtlas().time)
        if (!frame) return null
        const p = frame.toWorld(u, v, w)
        return toPage(tmp.set(p[0], p[1], p[2]))
      },
      projectStructure(zfaId) {
        const h = rt.handles.get(zfaId)
        if (!h || !h.bounds) return null
        return toPage(h.center)
      },
      state() {
        const { data, ...rest } = readAtlas()
        void data
        return rest as unknown as Record<string, unknown>
      },
      runtime: rt,
    }
    return () => {
      delete window.__atlasDebug
    }
  }, [camera, gl])
}
