// A segmentArray structure (BG-32): two InstancedMesh objects, right and left,
// whose template geometry and instance matrices the rebuild driver writes.
import { useMemo } from 'react'
import type { StructureRecord } from '../core/schema.ts'
import { useAtlas } from '../state/store.ts'
import type { ZfaId } from '../state/store.ts'
import { pickHandlers } from './picking.ts'
import { Selection } from './Selection.tsx'
import { useStructureHandle } from './useStructureHandle.ts'

export function InstancedStructure({ record }: { record: StructureRecord }) {
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
