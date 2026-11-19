// The R3F Canvas (AR-21, AR-22, AR-67, AR-68): WebGL 2 probe, demand frameloop,
// dpr cap, NeutralToneMapping, sRGB output, local clipping, context-loss handlers,
// and the `data-atlas-ready` attribute on the wrapper once the first frame with
// final-tessellation structures has rendered (QP-31). App.tsx renders the error
// screens from store.webgl and store.dataError; the fallbacks here are minimal.
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { NeutralToneMapping, SRGBColorSpace } from 'three'
import { readAtlas, useAtlas } from '../state/store.ts'
import { EmptyHint } from './EmptyHint.tsx'
import { onPointerMissed, trackPointerDown } from './picking.ts'
import { FOV_DEG } from './presets.ts'
import { enqueueAll } from './rebuild.ts'
import { getRuntime } from './runtime.ts'
import { Scene } from './Scene.tsx'
import { CONTEXT_LOST_TEXT, WEBGL_UNAVAILABLE_TEXT, interactiveDpr, probeWebgl2 } from './webgl.ts'

const wrapperStyle = { position: 'absolute', inset: 0, overflow: 'hidden' } as const
/** Stable option objects: R3F re-applies a changed `camera` prop on every Canvas render (AR-38). */
const CAMERA_OPTIONS = { fov: FOV_DEG, near: 0.01, far: 100, position: [0, 0, 3] as [number, number, number] }
const canvasStyle = { position: 'absolute', inset: 0 } as const

/**
 * Wait before the loading line appears, so a build that finishes quickly never flashes it. The
 * chrome around the canvas renders in milliseconds while the first build takes seconds, and a
 * presenter opening a shared link otherwise sees an empty black rectangle with no sign of work.
 */
const LOADING_DELAY_MS = 300

const loadingStyle = {
  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 4,
  padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-muted)', font: '400 13px/1.4 var(--font-sans)', pointerEvents: 'none',
} as const

export function Viewer() {
  const [webgl2] = useState(() => (typeof document === 'undefined' ? true : probeWebgl2()))
  const wrapper = useRef<HTMLDivElement>(null)
  const dataError = useAtlas((s) => s.dataError)
  const [dpr] = useState(() => interactiveDpr(typeof innerWidth === 'number' ? innerWidth : 1600))
  const [glOptions] = useState(() => {
    const w = typeof innerWidth === 'number' ? innerWidth : 1600
    const h = typeof innerHeight === 'number' ? innerHeight : 900
    // MSAA is off when the backing store exceeds 4 megapixels (AR-21).
    const antialias = w * h * dpr * dpr <= 4e6
    return { antialias, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' as const }
  })

  useEffect(() => {
    readAtlas().setWebgl(webgl2 ? 'ok' : 'unavailable')
  }, [webgl2])

  const [ready, setReady] = useState(() => getRuntime().ready)
  const [waited, setWaited] = useState(false)

  useEffect(() => {
    const rt = getRuntime()
    const onReady = (): void => {
      wrapper.current?.setAttribute('data-atlas-ready', 'true')
      setReady(true)
    }
    rt.readyListeners.add(onReady)
    if (rt.ready) onReady()
    return () => {
      rt.readyListeners.delete(onReady)
    }
  }, [])

  useEffect(() => {
    if (ready) return
    const id = setTimeout(() => setWaited(true), LOADING_DELAY_MS)
    return () => clearTimeout(id)
  }, [ready])

  const onCreated = (state: RootState): void => {
    const { gl } = state
    gl.toneMapping = NeutralToneMapping
    gl.toneMappingExposure = 1.0
    gl.outputColorSpace = SRGBColorSpace
    gl.localClippingEnabled = true
    const rt = getRuntime()
    rt.canvas = gl.domElement
    gl.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      const s = readAtlas()
      s.setWebgl('lost')
      s.pause()
      s.pushWarning(CONTEXT_LOST_TEXT)
    })
    gl.domElement.addEventListener('webglcontextrestored', () => {
      const s = readAtlas()
      s.setWebgl('ok')
      s.setTessellation('final')
      enqueueAll(rt, 'final')
      state.invalidate()
    })
  }

  if (!webgl2) {
    return (
      <div style={wrapperStyle} data-atlas-ready="false" data-atlas-webgl="unavailable" role="application" aria-label="3D viewer">
        <p style={{ margin: 16 }}>{WEBGL_UNAVAILABLE_TEXT}</p>
      </div>
    )
  }
  if (dataError) {
    return (
      <div style={wrapperStyle} data-atlas-ready="false" data-atlas-data="error" role="application" aria-label="3D viewer">
        <p style={{ margin: 16 }}>Could not load the atlas data ({dataError.file}.json).</p>
      </div>
    )
  }
  return (
    <div
      ref={wrapper}
      className="atlas-viewer"
      style={wrapperStyle}
      data-atlas-ready="false"
      role="application"
      aria-label="3D viewer"
      // Focusable by script only: the search field and the sheets hand focus back here (UX-ST-02).
      tabIndex={-1}
      onPointerDownCapture={(e) => trackPointerDown(e.nativeEvent)}
    >
      <Canvas
        frameloop="demand"
        dpr={dpr}
        gl={glOptions}
        camera={CAMERA_OPTIONS}
        onCreated={onCreated}
        onPointerMissed={onPointerMissed}
        style={canvasStyle}
      >
        <Scene />
      </Canvas>
      {!ready && waited ? (
        <p style={loadingStyle} role="status" data-testid="viewer-loading">
          Building the fish&hellip;
        </p>
      ) : null}
      <EmptyHint />
    </div>
  )
}
