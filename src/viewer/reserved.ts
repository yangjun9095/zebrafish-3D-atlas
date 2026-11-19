// The reserved rectangle of AR-42: the parts of the viewport that a panel covers. The camera rig
// reads it every frame (view offset, fit), so a bottom sheet on the phone shifts the fish up by
// half its height instead of hiding it (spec 5.1.1). Panels register their edge and size; the
// largest claim per edge wins.
import { getRuntime } from './runtime.ts'
import type { ReservedRect } from './runtime.ts'

type Edge = keyof ReservedRect

const claims = new Map<Edge, Map<symbol, number>>()

function apply(edge: Edge): void {
  const rt = getRuntime()
  const values = claims.get(edge)
  const px = values ? Math.max(0, ...values.values()) : 0
  if (rt.reserved[edge] === px) return
  rt.reserved = { ...rt.reserved, [edge]: px }
  rt.invalidate()
}

/** Reserves `px` of the viewport at `edge` until the returned release function runs. */
export function reserveEdge(edge: Edge, px: number): () => void {
  const id = Symbol('reserved')
  let values = claims.get(edge)
  if (!values) {
    values = new Map()
    claims.set(edge, values)
  }
  values.set(id, px)
  apply(edge)
  return () => {
    claims.get(edge)?.delete(id)
    apply(edge)
  }
}
