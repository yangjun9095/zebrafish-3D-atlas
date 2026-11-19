// Camera rig (AR-38 to AR-42): the 34 degree PerspectiveCamera of the Canvas,
// drei OrbitControls with damping, zoom to cursor and the distance limits, driven
// by the controller in cameraRig.ts (presets, fit, reserved rectangle, follow
// growth). Presets and fit belong to WP-05. WP-I3: the presets reach the URL
// through the store (setCameraPose on the controls end event, viewPreset on a
// preset change; url.ts serialises them), and the export pipeline gets the R3F
// root from here (setExportRoot) while the Canvas is mounted.
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { ComponentRef } from 'react'
import type { PerspectiveCamera } from 'three'
import { createCameraRig } from './cameraRig.ts'
import { setExportRoot } from './export/root.ts'

type Controls = ComponentRef<typeof OrbitControls>

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const getRoot = useThree((s) => s.get)
  const controlsRef = useRef<Controls>(null)
  const rig = useMemo(() => createCameraRig(), [])

  useEffect(() => {
    rig.mount({ camera, size, invalidate, controls: () => controlsRef.current })
    return () => rig.unmount()
    // Size changes go through setSize below; a remount would reset the user's view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, camera, invalidate])

  // The export pipeline renders from the same gl, scene and camera (AR-51).
  useEffect(() => {
    setExportRoot(getRoot)
    return () => setExportRoot(null)
  }, [getRoot])

  useEffect(() => {
    rig.setSize(size)
  }, [rig, size])

  useFrame((_, dt) => rig.frame(dt))

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      zoomToCursor
      onStart={() => rig.onStart()}
      onEnd={() => rig.onEnd()}
      onChange={() => rig.onChange()}
    />
  )
}
