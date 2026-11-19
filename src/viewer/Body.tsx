// The body (DM-31): the yolk and chorion records (`bodyDriven`) drawn from
// `frame.yolk` and `frame.chorion`, and the skin. The skin is the whole-organism
// tube ZFA:0001094 with `radiusMm: 'body'` (the generalized cylinder over hD, hV,
// hW); when the data carries no such record, a synthetic one is drawn so the body
// outline is never missing. The skin opacity follows the x-ray value (AR-32).
//
// The dissect slider fades the body away (D17): the skin is gone at 60 percent, and the
// yolk and the chorion keep a quarter of their opacity, so the inventory grid still has a
// visible fish beside it. The body itself never moves.
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { bodyPartDissectFade, dissectLayout, skinDissectFade } from '../core/dissect.ts'
import { useAtlas } from '../state/store.ts'
import { isSkinRecord } from '../core/primitives/buildStructure.ts'
import { syntheticSkinRecord } from './handles.ts'
import { getRuntime, SKIN_ID } from './runtime.ts'
import type { StructureHandle, ViewerRuntime } from './runtime.ts'
import { StructureMesh } from './StructureMesh.tsx'

/** Fade last written per handle, so a return to 1 hands the material back to the visual pass once. */
const applied = new Map<string, number>()

function applyFade(rt: ViewerRuntime, handle: StructureHandle, fade: number, invalidate: () => void): void {
  const last = applied.get(handle.id) ?? 1
  if (fade >= 1 && last >= 1) return
  applied.set(handle.id, fade)
  if (fade >= 1) {
    // Back at full opacity: the visual pass of materials.ts owns the material again.
    rt.visualDirty = true
    invalidate()
    return
  }
  const target = handle.opacity * fade
  const material = handle.material
  if (!material.transparent) {
    material.transparent = true
    material.needsUpdate = true
  }
  material.depthWrite = false
  material.opacity = target
  handle.group.visible = target > 0 && !handle.failed && handle.bounds !== null
}

/**
 * Writes the dissect fade after the rebuild driver's visual pass, which runs at priority -1 and
 * sets the base opacity this multiplies.
 */
function DissectFade({ ids }: { ids: readonly string[] }) {
  const invalidate = useThree((s) => s.invalidate)
  useFrame(() => {
    const rt = getRuntime()
    const value = dissectLayout.value
    for (const id of ids) {
      const handle = rt.handles.get(id)
      if (!handle) continue
      applyFade(rt, handle, handle.isSkin ? skinDissectFade(value) : bodyPartDissectFade(value), invalidate)
    }
  })
  return null
}

export function Body() {
  const data = useAtlas((s) => s.data)
  const bodyDriven = useMemo(() => (data ? data.structures.filter((r) => r.geometry?.kind === 'bodyDriven') : []), [data])
  const hasSkin = useMemo(() => (data ? data.structures.some(isSkinRecord) : false), [data])
  const skin = useMemo(() => syntheticSkinRecord(), [])
  // The skin record is mounted here or by Structures.tsx; either way its handle carries SKIN_ID.
  const fadeIds = useMemo(() => [SKIN_ID, ...bodyDriven.map((r) => r.id)], [bodyDriven])
  return (
    <>
      {bodyDriven.map((r) => <StructureMesh key={r.id} record={r} />)}
      {data && !hasSkin ? <StructureMesh record={skin} /> : null}
      <DissectFade ids={fadeIds} />
    </>
  )
}
