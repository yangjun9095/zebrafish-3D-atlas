// Selection outline (AR-35, D10): two drei Outlines on the selected mesh, an
// outer ring in `--bg` and an inner ring in `--focus`, thickness in drawing-buffer
// pixels. `angle={0}` shares the parent geometry, so an in-place rebuild shows at
// once; applyBuild.syncOutlines re-points the rings after a geometry swap (RG-02).
// drei's shader applies the pixel thickness in its `screenspace={false}` branch and
// its layout effect re-reads the drawing-buffer size on every render, so this
// component subscribes to the canvas size as well as the dpr.
import { Outlines } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { getRuntime } from './runtime.ts'
import { useThemeTokens } from './useThemeTokens.ts'

export function Selection() {
  const dpr = useThree((s) => s.viewport.dpr)
  // Read for the subscription only: a resize at constant dpr must re-render the rings.
  const size = useThree((s) => s.size)
  void size
  const tokens = useThemeTokens()
  const planes = useMemo(() => [getRuntime().plane], [])
  return (
    <>
      <Outlines color={tokens.bg} thickness={4 * dpr} angle={0} screenspace={false} toneMapped={false} renderOrder={1999} clippingPlanes={planes} />
      <Outlines color={tokens.focus} thickness={2 * dpr} angle={0} screenspace={false} toneMapped={false} renderOrder={2000} clippingPlanes={planes} />
    </>
  )
}
