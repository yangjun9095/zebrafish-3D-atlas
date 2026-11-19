// Environment (AR-23): RoomEnvironment baked once through PMREMGenerator and
// attached as the scene environment. No download, no licence check. The 0.3
// intensity sits on every structure material (materials.ts, envMapIntensity).
// The render target is created and disposed inside one effect, so the StrictMode
// mount-cleanup-mount cycle of development never disposes a texture in use.
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export const ENV_INTENSITY = 0.3

export function Environment() {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const { gl, scene, invalidate } = get()
    const pmrem = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)
    // The room's box geometries and materials served the bake only.
    room.dispose()
    pmrem.dispose()
    scene.environment = target.texture
    invalidate()
    return () => {
      if (get().scene.environment === target.texture) get().scene.environment = null
      target.dispose()
    }
  }, [get])
  return null
}
