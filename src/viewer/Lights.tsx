// Lights (AR-24 as revised in phase 2): a hemisphere light plus a three-point
// set (key, fill, rim) of directional lights, all children of the camera with
// their targets, so the lateral view is lit the same after an orbit. The fill
// lifts the shadow side and flattens the specular bands that the key alone
// drew across the flat caps of the early embryo; the RoomEnvironment of
// Environment.tsx supplies the soft reflections. View space: -z is the view
// direction; anterior is screen left, dorsal is up and the fish's left side
// faces the camera in the lateral view.
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Color } from 'three'
import type { DirectionalLight, Object3D } from 'three'

export const KEY_INTENSITY = 1.6
export const FILL_INTENSITY = 0.7
export const RIM_INTENSITY = 1.1
export const HEMISPHERE_INTENSITY = 0.7

function lighten(hex: string, amount: number): string {
  const c = new Color(hex)
  c.lerp(new Color('#FFFFFF'), amount)
  return `#${c.getHexString()}`
}

function CameraLight({ position, intensity }: { position: [number, number, number]; intensity: number }) {
  const light = useRef<DirectionalLight>(null)
  const target = useRef<Object3D>(null)
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current
  }, [])
  return (
    <>
      <directionalLight ref={light} position={position} intensity={intensity} />
      <object3D ref={target} position={[0, 0, -1]} />
    </>
  )
}

export function Lights({ bg }: { bg: string }) {
  const camera = useThree((s) => s.camera)
  return (
    <primitive object={camera}>
      <hemisphereLight args={[lighten(bg, 0.35), bg, HEMISPHERE_INTENSITY]} />
      {/* Key from anterodorsal-left: screen left, up, toward the camera. */}
      <CameraLight position={[-3, 3, 2]} intensity={KEY_INTENSITY} />
      {/* Fill from the lower right, toward the camera and wide, so the key's terminator softens. */}
      <CameraLight position={[3, -1.5, 3.5]} intensity={FILL_INTENSITY} />
      {/* Rim from posterior-right: screen right, behind the fish. */}
      <CameraLight position={[3, 1, -6]} intensity={RIM_INTENSITY} />
    </primitive>
  )
}
