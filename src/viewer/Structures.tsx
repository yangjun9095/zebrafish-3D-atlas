// Mounts one StructureMesh or InstancedStructure per record with a builder, once
// per data load (AR-74). Presence toggles visibility inside the visual pass of the
// rebuild driver; nothing mounts or unmounts in the frame loop. Body-driven
// records (yolk, chorion) are drawn by Body.tsx; a derived record (heart chamber, eye
// part, otolith, yolk ball) mounts like any other and the driver slices its source build.
//
// Each structure hangs under a dissect group (D17). The group carries the offset of the
// slider, so the whole structure moves with its picking, its selection outline and its
// info card. The handle's own group keeps the presence fade, which writes its position.
// src/viewer/dissectFrame.ts owns the frame the group positions come from.
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import type { Group } from 'three'
import { resetDissectLayout } from '../core/dissect.ts'
import { hasBuilder } from '../core/primitives/buildStructure.ts'
import { useAtlas } from '../state/store.ts'
import { dissectFrame, resetDissectFrame } from './dissectFrame.ts'
import { InstancedStructure } from './InstancedStructure.tsx'
import { StructureMesh } from './StructureMesh.tsx'

function DissectDriver({ groups }: { groups: RefObject<Map<string, Group>> }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    resetDissectFrame()
    return () => {
      // The layout is a module singleton: a remount must not read the offsets of the last mount.
      resetDissectFrame()
      resetDissectLayout()
    }
  }, [])
  // Priority -1, like the rebuild driver: the offsets are in place before drei Html projects
  // the label anchors in its own priority 0 callback.
  useFrame((_, dt) => dissectFrame(groups.current, dt, invalidate), -1)
  return null
}

export function Structures() {
  const data = useAtlas((s) => s.data)
  const records = useMemo(
    () => (data ? data.structures.filter((r) => r.geometry !== null && r.geometry.kind !== 'bodyDriven' && hasBuilder(r)) : []),
    [data],
  )
  const groups = useRef(new Map<string, Group>())
  return (
    <>
      {records.map((r) => (
        <group
          key={r.id}
          name={`dissect:${r.id}`}
          ref={(g) => {
            if (g) groups.current.set(r.id, g)
            else groups.current.delete(r.id)
          }}
        >
          {r.geometry?.kind === 'segmentArray' ? <InstancedStructure record={r} /> : <StructureMesh record={r} />}
        </group>
      ))}
      <DissectDriver groups={groups} />
    </>
  )
}
