// Labels (AR-37, UX-VS-19): drei Html chips, at most 8 at once. Priority:
// selected, hovered, pinned, then the largest present structures when labels are
// on. Eligibility comes from store state (presence, hidden sets, isolate), so a
// label appears with the structure and not one store change later. One frame pass
// projects every anchor, runs the greedy placement of labelLayout.ts and writes the
// chip offset and its leader line to the DOM; a chip without a free slot hides. The
// swatch colour follows the theme and palette like the material (materials.ts). An anchor adds
// the dissect offset of its structure (D17), and above 60 percent every visible structure takes
// a chip inside the wider inventory budget.
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { Group } from 'three'
import { Vector3 } from 'three'
import { DISSECT_SPREAD_END, dissectLayout, dissectOffsetOf, inventoryMix } from '../core/dissect.ts'
import type { PaletteMode } from '../core/palette.ts'
import { settingsStore } from '../state/slices/settings.ts'
import { useAtlas, useAtlasShallow } from '../state/store.ts'
import { labelEligible } from './labelEligibility.ts'
import type { LabelEligibility } from './labelEligibility.ts'
import { placeLabels } from './labelLayout.ts'
import type { LabelAnchor } from './labelLayout.ts'
import { colourOf } from './materials.ts'
import { getRuntime } from './runtime.ts'

export const LABEL_BUDGET = 8
/**
 * Chips allowed once the inventory grid is fully packed (D17): the grid is a legend, so it names
 * every cell. 101 records draw at 4320 hpf and 89 at 48 hpf, so the budget covers both; the
 * greedy placement still drops a chip that has no free slot.
 */
export const INVENTORY_LABEL_BUDGET = 120

/**
 * The budget at a slider value. It follows the grid rather than jumping at 60: the explode phase
 * ends with the eight largest structures named, and the chips arrive as the cells do, so the last
 * frame of the explode is not buried under a hundred of them.
 */
function labelBudget(dissect: number): number {
  return LABEL_BUDGET + Math.round((INVENTORY_LABEL_BUDGET - LABEL_BUDGET) * inventoryMix(dissect))
}

/** The DOM of one chip, registered by StructureLabel and written by the layout pass. */
interface ChipDom { chip: HTMLDivElement; line: SVGLineElement; dot: SVGCircleElement }

const chipDoms = new Map<string, ChipDom>()
const chipParts = new Map<string, Partial<ChipDom>>()
/** Set by the mounted LabelLayout: asks the demand frameloop for a frame. */
let requestLayout: () => void = () => {}
let chipObserver: ResizeObserver | null = null

/** A chip that changes size (the web font arrives, a name wraps) needs a new layout pass. */
function observeChip(el: HTMLDivElement, on: boolean): void {
  if (typeof ResizeObserver === 'undefined') return
  chipObserver ??= new ResizeObserver(() => requestLayout())
  if (on) chipObserver.observe(el)
  else chipObserver.unobserve(el)
}

/** Records one part of a chip's DOM; the chip counts as registered once all three parts exist. */
function registerPart<K extends keyof ChipDom>(id: string, key: K, el: ChipDom[K] | null): void {
  const parts = chipParts.get(id) ?? {}
  if (key === 'chip') {
    if (parts.chip) observeChip(parts.chip, false)
    if (el) observeChip(el as HTMLDivElement, true)
  }
  if (el) parts[key] = el
  else delete parts[key]
  chipParts.set(id, parts)
  const { chip, line, dot } = parts
  if (chip && line && dot) chipDoms.set(id, { chip, line, dot })
  else chipDoms.delete(id)
}

const readPalette = (): PaletteMode => settingsStore.getState().palette

/** True once the viewer has rendered its first final frame: the handles exist from then on. */
function useRuntimeReady(): boolean {
  return useSyncExternalStore(
    (cb) => {
      getRuntime().readyListeners.add(cb)
      return () => { getRuntime().readyListeners.delete(cb) }
    },
    () => getRuntime().ready,
    () => false,
  )
}

function StructureLabel({ id, hex }: { id: string; hex: string }) {
  const group = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const handle = getRuntime().handles.get(id)
  // drei Html mounts its children in a second React root after this frame: register through ref
  // callbacks and ask for a frame, so the layout pass runs once the chip exists (demand frameloop).
  const register = <K extends keyof ChipDom>(key: K) => (el: ChipDom[K] | null) => {
    registerPart(id, key, el)
    invalidate()
  }
  // Priority -1: drei Html projects the group in its own priority-0 callback, so the anchor must move
  // first or every chip sits at the stale anchor for a frame. A moved anchor also asks for one more
  // frame, which covers the mount frame on the demand loop.
  useFrame(() => {
    const h = getRuntime().handles.get(id)
    if (!h || !group.current) return
    // The structure's dissect group carries the offset; the anchor lives at the scene root.
    const d = dissectOffsetOf(id)
    const x = h.center.x + d[0]
    const y = h.center.y + d[1]
    const z = h.center.z + d[2]
    const p = group.current.position
    if (p.x !== x || p.y !== y || p.z !== z) {
      p.set(x, y, z)
      invalidate()
    }
    group.current.visible = h.opacity > 0 && h.bounds !== null
  }, -1)
  if (!handle) return null
  return (
    <group ref={group}>
      <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        {/* A 0 by 0 anchor: the chip and the leader are positioned from it by the layout pass. */}
        <div className="atlas-label-anchor" style={{ position: 'relative', width: 0, height: 0 }}>
          <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', width: 1, height: 1 }} aria-hidden="true">
            <line ref={register('line')} x1={0} y1={0} x2={0} y2={-18} stroke="var(--text-muted, #9AA3AD)" strokeWidth={1} style={{ visibility: 'hidden' }} />
            <circle ref={register('dot')} cx={0} cy={0} r={3} fill={hex} stroke="var(--bg, #0E1116)" strokeWidth={1.5} style={{ visibility: 'hidden' }} />
          </svg>
          <div
            ref={register('chip')}
            className="atlas-label"
            data-label-id={id}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'var(--surface, #161B22)',
              color: 'var(--text, #E6EAF0)',
              border: '1px solid var(--border, #2A323C)',
              font: '500 12px/1.2 var(--font-sans, system-ui, sans-serif)',
              whiteSpace: 'nowrap',
              visibility: 'hidden',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, background: hex, display: 'inline-block' }} />
            {handle.record.name}
          </div>
        </div>
      </Html>
    </group>
  )
}

let rankOrder: readonly string[] | null = null
let rankMap: Map<string, number> | null = null

/** Reading order of the inventory grid as a rank, or null below 60 percent. Cached per grid. */
function gridRank(): Map<string, number> | null {
  const order = dissectLayout.order
  if (dissectLayout.value < DISSECT_SPREAD_END || order.length === 0) return null
  if (order !== rankOrder || rankMap === null) {
    rankOrder = order
    rankMap = new Map(order.map((id, i) => [id, i]))
  }
  return rankMap
}

/** Projects the anchors, places the chips and writes the result to the DOM once per frame. */
function LabelLayout({ ids }: { ids: readonly string[] }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const tmp = useMemo(() => new Vector3(), [])
  const last = useRef(new Map<string, string>())
  // The frameloop is on demand: a new chip, a resized chip or the arriving web font needs one frame to take its slot.
  useEffect(() => invalidate(), [ids, invalidate])
  useEffect(() => {
    requestLayout = invalidate
    if (typeof document !== 'undefined' && 'fonts' in document) void document.fonts.ready.then(() => invalidate())
    return () => { requestLayout = () => {} }
  }, [invalidate])
  useFrame(() => {
    const rt = getRuntime()
    const anchors: LabelAnchor[] = []
    const screen = new Map<string, { x: number; y: number }>()
    // offsetWidth/offsetHeight round to the nearest CSS pixel (DOM spec); the chip's true size
    // (getBoundingClientRect) is a fraction of a pixel taller, and two labels whose anchors sit
    // almost exactly one chip-height apart can round to a false clearance and overlap on screen
    // by that fraction. The layout and the final transform both need the true size. One read per
    // chip per frame: a rect read forces layout, and the inventory grid shows over a hundred.
    const boxes = new Map<string, { w: number; h: number }>()
    let pending = false
    for (const id of ids) {
      const h = rt.handles.get(id)
      const dom = chipDoms.get(id)
      if (!dom || dom.chip.offsetWidth === 0) pending = true
      if (!dom) continue
      const r = dom.chip.getBoundingClientRect()
      boxes.set(id, { w: r.width, h: r.height })
      if (!h || h.opacity <= 0 || h.bounds === null) continue
      const d = dissectOffsetOf(id)
      tmp.set(h.center.x + d[0], h.center.y + d[1], h.center.z + d[2]).project(camera)
      if (tmp.z > 1) continue
      const x = ((tmp.x + 1) / 2) * size.width
      const y = ((1 - tmp.y) / 2) * size.height
      screen.set(id, { x, y })
      anchors.push({ id, x, y, width: r.width, height: r.height })
    }
    // A chip that has not mounted or measured yet gets another frame.
    if (pending) invalidate()
    // D17: the grid is a legend, so above 60 percent the chips take their slots in reading order
    // rather than in presence order, and the named cells read down the block.
    const rank = gridRank()
    if (rank) anchors.sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
    const placed = new Map(placeLabels(anchors, size).map((p) => [p.id, p]))
    for (const id of ids) {
      const dom = chipDoms.get(id)
      const at = screen.get(id)
      const p = placed.get(id)
      if (!dom) continue
      const { w, h } = boxes.get(id) ?? { w: 0, h: 0 }
      const key = p && at ? `${(p.x - at.x).toFixed(1)},${(p.y - at.y).toFixed(1)},${p.displaced},${w.toFixed(1)}` : 'hidden'
      if (last.current.get(id) === key) continue
      last.current.set(id, key)
      if (!p || !at) {
        dom.chip.style.visibility = 'hidden'
        dom.line.style.visibility = 'hidden'
        dom.dot.style.visibility = 'hidden'
        continue
      }
      const dx = p.x - at.x
      const dy = p.y - at.y
      dom.chip.style.visibility = 'visible'
      dom.chip.style.transform = `translate(${dx}px, ${dy}px)`
      // The leader ends at the middle of the chip edge that faces the anchor.
      const above = dy + h <= 0
      dom.line.setAttribute('x2', String(dx + w / 2))
      dom.line.setAttribute('y2', String(above ? dy + h : dy))
      dom.line.style.visibility = 'visible'
      dom.dot.style.visibility = p.displaced ? 'visible' : 'hidden'
    }
  })
  return null
}

export function Labels() {
  const selection = useAtlasShallow((s) => s.selection)
  const pinned = useAtlasShallow((s) => s.pinnedLabels)
  const hover = useAtlas((s) => s.hover)
  const labels = useAtlas((s) => s.labels)
  const dissect = useAtlas((s) => s.dissect)
  // D17: the inventory grid names every structure it shows, whatever the labels toggle says.
  const labelsOn = labels || dissect >= DISSECT_SPREAD_END
  const budget = labelBudget(dissect)
  const presentIds = useAtlasShallow((s) => s.presentIds)
  const hiddenSystems = useAtlasShallow((s) => s.hiddenSystems)
  const hiddenStructures = useAtlasShallow((s) => s.hiddenStructures)
  const isolate = useAtlas((s) => s.isolate)
  const theme = useAtlas((s) => s.theme)
  const data = useAtlas((s) => s.data)
  const palette = useSyncExternalStore(settingsStore.subscribe, readPalette, () => 'atlas' as PaletteMode)
  // The handles are created after this component's first render: the list recomputes once the viewer is ready.
  const ready = useRuntimeReady()
  const ids = useMemo(() => {
    const rt = getRuntime()
    const state: LabelEligibility = { presentIds, hiddenSystems, hiddenStructures, isolate, selection }
    const out: string[] = []
    const push = (id: string | null): void => {
      if (!id || out.includes(id) || out.length >= budget) return
      if (!rt.handles.has(id) || !labelEligible(data?.structuresById.get(id), state)) return
      out.push(id)
    }
    selection.forEach(push)
    push(hover)
    pinned.forEach(push)
    if (labelsOn) {
      const rest = presentIds
        .map((id) => rt.handles.get(id))
        .filter((h) => h !== undefined && !h.isSkin)
        .sort((a, b) => b!.radius - a!.radius)
      for (const h of rest) push(h!.id)
    }
    for (const id of chipDoms.keys()) if (!out.includes(id)) chipDoms.delete(id)
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ready` stands for the runtime handles, which are not React state.
  }, [selection, hover, pinned, labelsOn, budget, presentIds, hiddenSystems, hiddenStructures, isolate, data, ready])
  const hexOf = (id: string): string => {
    const record = data?.structuresById.get(id)
    return record && data ? colourOf(record, data, theme, palette).hex : '#9AA3AD'
  }
  return (
    <>
      {ids.map((id) => <StructureLabel key={id} id={id} hex={hexOf(id)} />)}
      <LabelLayout ids={ids} />
    </>
  )
}
