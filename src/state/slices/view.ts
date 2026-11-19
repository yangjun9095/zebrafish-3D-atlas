// View slice: camera preset, pose, follow growth, keep dorsal up, the fit request counter and
// the dissect slider (D17).
import { clampDissect, nextDissectStep } from '../../core/dissect.ts'
import { emptyFluorescence } from '../../core/fluorescence.ts'
import type { Get, SectionState, Set, ViewActions, ViewState } from './types.ts'
import { DEFAULT_DISSECT, DEFAULT_TIME_HPF, DEFAULT_XRAY, SECTION_OFF } from './types.ts'

/**
 * The section plane is one world-space plane on the body (src/viewer/section.ts), and the dissect
 * slider moves a structure out of the body, so the cut lands nowhere near the part it names and
 * at 100 percent the whole inventory grid falls outside the kept half-space. Any dissect value
 * above 0 turns the section off; SectionControl.tsx disables its buttons and says why.
 */
function sectionOff(section: SectionState, dissect: number): { section?: SectionState } {
  return dissect > 0 && section.axis !== null ? { section: SECTION_OFF } : {}
}

export function createViewSlice(set: Set, get: Get): ViewState & ViewActions {
  return {
    viewPreset: 'lateral',
    camera: null,
    followGrowth: true,
    keepDorsalUp: true,
    fitRequest: 0,
    dissect: DEFAULT_DISSECT,

    setViewPreset(p) {
      const { fitRequest } = get()
      // A preset change fits the body (AR-41); pressing the active preset again re-fits.
      set({ viewPreset: p, fitRequest: p === 'free' ? fitRequest : fitRequest + 1 })
    },
    setCameraPose(pose, opts) {
      const manual = opts?.manual ?? true
      set(manual ? { camera: pose, viewPreset: 'free' } : { camera: pose })
    },
    requestFit() {
      set({ fitRequest: get().fitRequest + 1 })
    },
    resetView(all = false) {
      // UX-IN-15: lateral preset, fit, x-ray default, section off, isolate off. Never theme, units or temperature.
      set({
        viewPreset: 'lateral',
        camera: null,
        fitRequest: get().fitRequest + 1,
        xray: DEFAULT_XRAY,
        section: SECTION_OFF,
        isolate: false,
        dissect: DEFAULT_DISSECT,
        ...(all
          // The term rides beside the selection (D17), so a full reset drops it and the `term`
          // key with it; `set` here bypasses the guard in the selection slice.
          ? { selection: [], selectedTerm: null, hiddenSystems: [], hiddenStructures: [], railPreset: null, soloRestore: null, fluorescence: emptyFluorescence() }
          : {}),
      })
      if (all) get().setTime(DEFAULT_TIME_HPF)
    },
    setFollowGrowth(on) {
      if (on !== get().followGrowth) set({ followGrowth: on })
    },
    setKeepDorsalUp(on) {
      if (on !== get().keepDorsalUp) set({ keepDorsalUp: on })
    },
    setDissect(value) {
      const dissect = clampDissect(value)
      if (dissect !== get().dissect) set({ dissect, ...sectionOff(get().section, dissect) })
    },
    stepDissect(dir) {
      const dissect = nextDissectStep(get().dissect, dir)
      set({ dissect, ...sectionOff(get().section, dissect) })
    },
  }
}
