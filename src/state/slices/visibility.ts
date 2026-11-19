// Visibility slice: hidden systems and structures, solo, rail presets, isolate, x-ray, section plane.
import type { Get, RailPreset, SectionState, Set, SystemId, VisibilityActions, VisibilityState } from './types.ts'
import { DEFAULT_XRAY, SECTION_OFF } from './types.ts'
import { sameIds } from './time.ts'

/** Systems a rail preset keeps visible (UX-IN-28, D5 ids). 'all' keeps every system; 'none' keeps none. */
const PRESET_KEEP: Record<Exclude<RailPreset, 'all' | 'none'>, readonly SystemId[]> = {
  embryo: ['early_embryo', 'axial', 'skeletal', 'integument_pigment'],
  organs: [
    'nervous', 'sensory', 'cardiovascular', 'digestive', 'respiratory',
    'excretory', 'reproductive', 'endocrine', 'hematopoietic_immune',
  ],
  skeleton: ['skeletal'],
}

export function hiddenForPreset(all: readonly SystemId[], name: RailPreset): SystemId[] {
  if (name === 'all') return []
  if (name === 'none') return [...all]
  const keep = PRESET_KEEP[name]
  return all.filter((id) => !keep.includes(id))
}

function toggleIn<T>(list: readonly T[], id: T, present: boolean): readonly T[] {
  const has = list.includes(id)
  if (present === has) return list
  return present ? [...list, id] : list.filter((x) => x !== id)
}

function clampUnit(x: number): number {
  return Number.isFinite(x) ? Math.min(Math.max(x, -1), 1) : 0
}

export function createVisibilitySlice(set: Set, get: Get): VisibilityState & VisibilityActions {
  return {
    hiddenSystems: [],
    hiddenStructures: [],
    isolate: false,
    xray: DEFAULT_XRAY,
    section: SECTION_OFF,
    railPreset: null,
    lastXray: DEFAULT_XRAY,
    soloRestore: null,

    setSystemHidden(id, hidden) {
      const { hiddenSystems } = get()
      const next = toggleIn(hiddenSystems, id, hidden)
      if (next !== hiddenSystems) set({ hiddenSystems: [...next], railPreset: null, soloRestore: null })
    },
    soloSystem(id) {
      const { data, hiddenSystems, soloRestore } = get()
      if (!data) return
      const solo = data.systems.map((s) => s.id).filter((s) => s !== id)
      const isSoloed = soloRestore !== null && sameIds([...hiddenSystems].sort(), [...solo].sort())
      if (isSoloed) {
        set({ hiddenSystems: soloRestore, soloRestore: null, railPreset: null })
        return
      }
      set({ hiddenSystems: solo, soloRestore: hiddenSystems, railPreset: null })
    },
    applyRailPreset(name) {
      const { data } = get()
      if (!data) return
      const all = data.systems.map((s) => s.id)
      set({ hiddenSystems: hiddenForPreset(all, name), railPreset: name, soloRestore: null })
    },
    setStructureHidden(id, hidden) {
      const { hiddenStructures } = get()
      const next = toggleIn(hiddenStructures, id, hidden)
      if (next !== hiddenStructures) set({ hiddenStructures: [...next] })
    },
    setIsolate(on) {
      if (on !== get().isolate) set({ isolate: on })
    },
    setXray(value) {
      if (!Number.isFinite(value)) return
      const xray = Math.min(Math.max(Math.round(value), 0), 100)
      const { xray: current, lastXray } = get()
      if (xray === current) return
      set({ xray, lastXray: xray > 0 ? xray : lastXray })
    },
    toggleXray() {
      const { xray, lastXray } = get()
      get().setXray(xray > 0 ? 0 : lastXray || DEFAULT_XRAY)
    },
    setSection(patch) {
      const current = get().section
      const section: SectionState = {
        axis: patch.axis === undefined ? current.axis : patch.axis,
        position: patch.position === undefined ? current.position : clampUnit(patch.position),
        flip: patch.flip === undefined ? current.flip : patch.flip,
      }
      if (section.axis === current.axis && section.position === current.position && section.flip === current.flip) return
      set({ section })
    },
  }
}
