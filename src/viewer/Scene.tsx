// Scene composition (spec 2.2.4): background, environment, lights, camera rig,
// body, structures, labels, section plane, clock, plus the rebuild driver, the
// picking setup and the debug hook, all inside the Canvas.
import { Body } from './Body.tsx'
import { CameraRig } from './CameraRig.tsx'
import { Clock } from './Clock.tsx'
import { useDebugHook } from './debug.ts'
import { Environment } from './Environment.tsx'
import { Labels } from './Labels.tsx'
import { Lights } from './Lights.tsx'
import { usePickingSetup } from './picking.ts'
import { ProgramWarmup } from './ProgramWarmup.tsx'
import { useRebuildDriver } from './rebuild.ts'
import { SectionPlane } from './SectionPlane.tsx'
import { Structures } from './Structures.tsx'
import { readThemeTokens } from './tokens.ts'
import { useThemeTokens } from './useThemeTokens.ts'
import { useAtlas } from '../state/store.ts'

export function Scene() {
  useRebuildDriver()
  usePickingSetup()
  useDebugHook()
  const themeTokens = useThemeTokens()
  const fluorescence = useAtlas((s) => s.fluorescence.enabled)
  // One ground for the background and for the lights. The preview used to darken the background
  // alone, so in the light theme a near-white hemisphere lit a near-black scene (review item 10).
  const tokens = fluorescence ? readThemeTokens('fluorescence') : themeTokens
  return (
    <>
      <color attach="background" args={[tokens.bg]} />
      <Environment />
      <ProgramWarmup />
      <Lights bg={tokens.bg} />
      <CameraRig />
      <Body />
      <Structures />
      <Labels />
      <SectionPlane />
      <Clock />
    </>
  )
}
