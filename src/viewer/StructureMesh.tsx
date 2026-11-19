// One structure in the scene (spec 2.2.4): the handle's group with its mesh (or
// mirrored pair), the picking handlers, and the selection outline. The mesh
// objects are created once; the rebuild driver writes their geometry outside React.
import { useMemo } from 'react'
import type { StructureRecord } from '../core/schema.ts'
import { useAtlas } from '../state/store.ts'
import type { ZfaId } from '../state/store.ts'
import { pickHandlers } from './picking.ts'
import { Selection } from './Selection.tsx'
import { useStructureHandle } from './useStructureHandle.ts'

export function StructureMesh({ record }: { record: StructureRecord }) {
  const handle = useStructureHandle(record)
  const selected = useAtlas((s) => (s.selection as readonly string[]).includes(record.id))
  const handlers = useMemo(() => pickHandlers(record.id as ZfaId), [record.id])
  return (
    <primitive object={handle.group}>
      {handle.meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} {...handlers}>
          {selected ? <Selection /> : null}
        </primitive>
      ))}
    </primitive>
  )
}
