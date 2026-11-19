// Creates the handle of a record once, registers it in the runtime while mounted,
// and asks the driver for a rebuild. Shared by StructureMesh and InstancedStructure.
import { useEffect, useMemo } from 'react'
import type { StructureRecord } from '../core/schema.ts'
import { createHandle, disposeHandle } from './handles.ts'
import { scheduleRebuild } from './rebuild.ts'
import { getRuntime } from './runtime.ts'
import type { StructureHandle } from './runtime.ts'

export function useStructureHandle(record: StructureRecord): StructureHandle {
  // The rebuild driver binds `rt.data` in an effect, and React runs a child's effect before the
  // parent's, so the first handles are made while `rt.data` is still null. `createHandle` reads
  // the store instead when that happens, and resolves the shape again on the first frame that
  // has the data: nothing here writes to the runtime during the render phase.
  const handle = useMemo(() => createHandle(getRuntime(), record), [record])
  useEffect(() => {
    const rt = getRuntime()
    rt.handles.set(handle.id, handle)
    rt.buildVersion++
    scheduleRebuild(rt)
    return () => {
      rt.handles.delete(handle.id)
      rt.buildVersion++
      disposeHandle(handle)
      rt.visualDirty = true
    }
  }, [handle])
  return handle
}
