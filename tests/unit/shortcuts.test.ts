// The key dispatcher of spec 5.9.1 and UI-41, and the settings store of WP-I4.
import { describe, expect, it, vi } from 'vitest'
import type { AtlasData } from '../../src/core/schema.ts'
import {
  KEYBOARD_MAP, closeOverlay, createDispatcher, getOverlay, matchesCombo, openOverlay, orbitPose, parseKey, runEscape, targetHandlesKeys,
  toggleOverlay, zoomPose,
} from '../../src/state/shortcuts.ts'
import type { KeyEventLike } from '../../src/state/shortcuts.ts'
import { attachPrefs, createSettingsStore, readPrefs, writePrefs } from '../../src/state/slices/settings.ts'
import type { StorageLike } from '../../src/state/persist.ts'
import { createAtlasStore } from '../../src/state/store.ts'
import type { AtlasStore } from '../../src/state/store.ts'

function ev(spec: string, extra: Partial<KeyEventLike> = {}): KeyEventLike {
  const k = parseKey(spec)
  return {
    code: k.code, shiftKey: k.shift, ctrlKey: k.ctrl, altKey: k.alt, metaKey: false, defaultPrevented: false, target: null,
    preventDefault: vi.fn(), ...extra,
  }
}

/** A store whose named actions are spies, so a key maps to exactly one action. */
function spyStore(init: Partial<AtlasStore> = {}) {
  const store = createAtlasStore()
  const spies: Record<string, ReturnType<typeof vi.fn>> = {}
  const actions = [
    'togglePlay', 'stepStage', 'stepPeriod', 'nudgeTime', 'stepBookmark', 'setTime', 'stepSpeed', 'toggleSnap', 'cycleUnits', 'setViewPreset',
    'resetView', 'toggleXray', 'setIsolate', 'setStructureHidden', 'setLabels', 'requestFit', 'toggleTheme', 'setPresentation', 'toggleStripPin',
    'toggleFullscreen', 'toggleBlackScreen', 'addBookmark', 'setCameraPose', 'clearSelection', 'stepDissect',
  ] as const
  const patch: Record<string, unknown> = {}
  for (const a of actions) {
    spies[a] = vi.fn()
    patch[a] = spies[a]
  }
  store.setState({ ...patch, ...init } as Partial<AtlasStore>)
  return { store, spies, d: createDispatcher(store) }
}

const el = (tagName: string, role?: string) => ({ tagName, getAttribute: (n: string) => (n === 'role' ? role ?? null : null), closest: () => null })

describe('parseKey', () => {
  it('reads modifiers, letters, digits and the punctuation aliases', () => {
    expect(parseKey('Ctrl+Shift+S')).toEqual({ code: 'KeyS', shift: true, ctrl: true, alt: false })
    expect(parseKey('Alt+ArrowLeft')).toEqual({ code: 'ArrowLeft', shift: false, ctrl: false, alt: true })
    expect(parseKey('?')).toEqual({ code: 'Slash', shift: true, ctrl: false, alt: false })
    expect(parseKey('3')).toEqual({ code: 'Digit3', shift: false, ctrl: false, alt: false })
    expect(parseKey('.')).toEqual({ code: 'Period', shift: false, ctrl: false, alt: false })
    expect(parseKey('Cmd+K').ctrl).toBe(true)
    expect(() => parseKey('Shift')).toThrow()
  })
  it('matches on code and exact modifiers, with Command standing in for Ctrl', () => {
    const b = parseKey('Ctrl+B')
    expect(matchesCombo(ev('Ctrl+B'), b)).toBe(true)
    expect(matchesCombo({ ...ev('B'), metaKey: true }, b)).toBe(true)
    expect(matchesCombo(ev('B'), b)).toBe(false)
    expect(matchesCombo(ev('Ctrl+Shift+B'), b)).toBe(false)
  })
})

describe('the keyboard map of 5.9.1', () => {
  const expectations: Record<string, { spy: string; state?: Partial<AtlasStore>; args?: unknown[] }> = {
    Space: { spy: 'togglePlay' },
    ArrowLeft: { spy: 'stepStage', args: [-1] }, ArrowRight: { spy: 'stepStage', args: [1] },
    'Shift+ArrowLeft': { spy: 'nudgeTime', args: [-1] }, 'Shift+ArrowRight': { spy: 'nudgeTime', args: [1] },
    PageUp: { spy: 'stepPeriod', args: [-1] }, PageDown: { spy: 'stepPeriod', args: [1] },
    'Shift+PageUp': { spy: 'stepPeriod', args: [-1], state: { presentation: true } },
    'Shift+PageDown': { spy: 'stepPeriod', args: [1], state: { presentation: true } },
    Home: { spy: 'setTime', args: [0] }, End: { spy: 'setTime', args: [2160] }, 'Shift+End': { spy: 'setTime', args: [4320] },
    '[': { spy: 'stepSpeed', args: [-1] }, ']': { spy: 'stepSpeed', args: [1] },
    S: { spy: 'toggleSnap' }, U: { spy: 'cycleUnits' },
    '1': { spy: 'setViewPreset', args: ['lateral'] }, '2': { spy: 'setViewPreset', args: ['dorsal'] }, '3': { spy: 'setViewPreset', args: ['ventral'] },
    '4': { spy: 'setViewPreset', args: ['anterior'] }, '5': { spy: 'setViewPreset', args: ['posterior'] }, '6': { spy: 'setViewPreset', args: ['threeQuarter'] },
    R: { spy: 'resetView', args: [false] }, 'Shift+R': { spy: 'resetView', args: [true] },
    F: { spy: 'requestFit' }, X: { spy: 'toggleXray' }, L: { spy: 'setLabels', args: [true] }, T: { spy: 'toggleTheme' },
    'Alt+ArrowLeft': { spy: 'setCameraPose', state: { camera: { position: [0, 0, 3], target: [0, 0, 0] } } },
    'Alt+ArrowRight': { spy: 'setCameraPose', state: { camera: { position: [0, 0, 3], target: [0, 0, 0] } } },
    'Alt+ArrowUp': { spy: 'setCameraPose', state: { camera: { position: [0, 0, 3], target: [0, 0, 0] } } },
    'Alt+ArrowDown': { spy: 'setCameraPose', state: { camera: { position: [0, 0, 3], target: [0, 0, 0] } } },
    'Alt+Equal': { spy: 'setCameraPose', state: { camera: { position: [0, 0, 3], target: [0, 0, 0] } } },
    'Alt+Minus': { spy: 'setCameraPose', state: { camera: { position: [0, 0, 3], target: [0, 0, 0] } } },
    I: { spy: 'setIsolate', args: [true], state: { selection: ['ZFA:0000114'] } },
    H: { spy: 'setStructureHidden', args: ['ZFA:0000114', true], state: { selection: ['ZFA:0000114'] } },
    Escape: { spy: 'clearSelection', state: { selection: ['ZFA:0000114'] } },
    P: { spy: 'setPresentation', args: [true] }, 'Shift+P': { spy: 'toggleStripPin' },
    Enter: { spy: 'toggleFullscreen', state: { presentation: true } }, 'Shift+F': { spy: 'toggleFullscreen' },
    B: { spy: 'toggleBlackScreen', state: { presentation: true } }, '.': { spy: 'toggleBlackScreen', state: { presentation: true } },
    'Ctrl+B': { spy: 'addBookmark' },
    D: { spy: 'stepDissect', args: [1] }, 'Shift+D': { spy: 'stepDissect', args: [-1] },
  }
  const owned = new Set(KEYBOARD_MAP.filter((r) => r.owner).flatMap((r) => r.specs))

  for (const row of KEYBOARD_MAP) {
    for (const spec of row.specs) {
      if (owned.has(spec) || spec === '?' || spec === ',' || spec === 'Shift+C' || spec === 'Ctrl+Shift+S') continue
      it(`${spec}: ${row.action}`, () => {
        const want = expectations[spec]
        expect(want, `no expectation for ${spec}`).toBeDefined()
        const { spies, d } = spyStore(want.state)
        const e = ev(spec)
        expect(d.dispatch(e)).toBe(true)
        expect(e.preventDefault).toHaveBeenCalled()
        expect(spies[want.spy]).toHaveBeenCalledTimes(1)
        if (want.args) expect(spies[want.spy]).toHaveBeenCalledWith(...want.args)
      })
    }
  }

  it('? and , toggle the shortcut and settings overlays; , is ignored in presentation mode', () => {
    const { d, store } = spyStore()
    closeOverlay()
    expect(d.dispatch(ev('?'))).toBe(true)
    expect(getOverlay()).toBe('shortcuts')
    expect(d.dispatch(ev(','))).toBe(true)
    expect(getOverlay()).toBe('settings')
    expect(d.dispatch(ev(','))).toBe(true)
    expect(getOverlay()).toBeNull()
    store.setState({ presentation: true })
    expect(d.dispatch(ev(','))).toBe(false)
    expect(getOverlay()).toBeNull()
  })

  it('Shift+C and Ctrl+Shift+S open the share and export sheets; Shift+C is ignored in presentation mode', () => {
    const { d, store } = spyStore()
    closeOverlay()
    expect(d.dispatch(ev('Shift+C'))).toBe(true)
    expect(getOverlay()).toBe('share')
    expect(d.dispatch(ev('Ctrl+Shift+S'))).toBe(true)
    expect(getOverlay()).toBe('export')
    expect(d.dispatch(ev('Escape'))).toBe(true)
    expect(getOverlay()).toBeNull()
    store.setState({ presentation: true })
    expect(d.dispatch(ev('Shift+C'))).toBe(false)
    expect(d.dispatch(ev('Ctrl+Shift+S'))).toBe(true)
    closeOverlay()
  })

  it('leaves the rows of other packages to register() and routes them once registered', () => {
    const { d } = spyStore()
    for (const spec of ['Shift+B']) {
      expect(d.dispatch(ev(spec)), spec).toBe(false)
      const run = vi.fn()
      const off = d.register(spec, run)
      expect(d.dispatch(ev(spec))).toBe(true)
      expect(run).toHaveBeenCalledTimes(1)
      off()
      expect(d.dispatch(ev(spec))).toBe(false)
    }
    // Ctrl+K and / decline without a search field (node has no document); a registration wins.
    expect(d.dispatch(ev('Ctrl+K'))).toBe(false)
    const focus = vi.fn()
    d.register('/', focus)
    expect(d.dispatch(ev('/'))).toBe(true)
    expect(focus).toHaveBeenCalled()
  })

  it('lists every row of the spec table once', () => {
    const rows = KEYBOARD_MAP.map((r) => r.keys.join(' '))
    for (const k of ['Space', '← →', 'Shift+← Shift+→', 'PageUp PageDown', 'Shift+PageUp Shift+PageDown', 'Home End', 'Shift+End', '[ ]', 'S', 'U',
      '1 2 3 4 5 6', 'R Shift+R', 'F', 'X', 'L', 'T', 'Alt+← Alt+→ Alt+↑ Alt+↓', 'Alt++ Alt+-', 'Ctrl+K /', 'I', 'H', 'Ctrl+C', 'Esc', 'P Shift+P',
      'Enter Shift+F', 'B .', 'Ctrl+B', 'Shift+B', '?', ',', 'Shift+C', 'Ctrl+Shift+S', 'Tab']) {
      expect(rows).toContain(k)
    }
    expect(new Set(rows).size).toBe(rows.length)
  })
})

describe('dispatch rules (UI-41)', () => {
  it('ignores handled events and events from text fields, buttons, sliders and listboxes', () => {
    const { d, spies } = spyStore()
    expect(d.dispatch(ev('Space', { defaultPrevented: true }))).toBe(false)
    for (const t of [el('INPUT'), el('TEXTAREA'), el('SELECT'), el('BUTTON'), el('DIV', 'slider'), el('UL', 'listbox'), el('INPUT', 'combobox')]) {
      expect(targetHandlesKeys(t)).toBe(true)
      expect(d.dispatch(ev('Space', { target: t as unknown as EventTarget }))).toBe(false)
    }
    expect(d.dispatch(ev('Space', { target: el('DIV') as unknown as EventTarget }))).toBe(true)
    expect(spies.togglePlay).toHaveBeenCalledTimes(1)
  })

  it('a focused button keeps Space and Enter; P and the arrows reach the dispatcher (UI-41)', () => {
    const { d, spies } = spyStore()
    const button = el('BUTTON') as unknown as EventTarget
    expect(targetHandlesKeys(el('BUTTON'), 'Space')).toBe(true)
    expect(targetHandlesKeys(el('BUTTON'), 'Enter')).toBe(true)
    expect(targetHandlesKeys(el('BUTTON'), 'KeyP')).toBe(false)
    expect(d.dispatch(ev('Enter', { target: button }))).toBe(false)
    expect(d.dispatch(ev('P', { target: button }))).toBe(true)
    expect(spies.setPresentation).toHaveBeenCalledWith(true)
    expect(d.dispatch(ev('ArrowRight', { target: button }))).toBe(true)
    expect(spies.stepStage).toHaveBeenCalledWith(1)
    const ownKeys = { tagName: 'BUTTON', getAttribute: (n: string) => (n === 'data-own-keys' ? '' : null) }
    expect(d.dispatch(ev('P', { target: ownKeys as unknown as EventTarget }))).toBe(false)
  })

  it('fires toggles once per press and lets arrows repeat', () => {
    const { d, spies } = spyStore()
    expect(d.dispatch(ev('P', { repeat: true }))).toBe(false)
    expect(spies.setPresentation).not.toHaveBeenCalled()
    expect(d.dispatch(ev('ArrowRight', { repeat: true }))).toBe(true)
    expect(spies.stepStage).toHaveBeenCalledWith(1)
  })

  it('inside a modal sheet only Escape, ? and , work', () => {
    const { d, spies } = spyStore()
    const inModal = { tagName: 'DIV', getAttribute: () => null, closest: (sel: string) => (sel.includes('aria-modal') ? {} : null) }
    expect(d.dispatch(ev('Space', { target: inModal as unknown as EventTarget }))).toBe(false)
    expect(spies.togglePlay).not.toHaveBeenCalled()
    openOverlay('settings')
    expect(d.dispatch(ev('Escape', { target: inModal as unknown as EventTarget }))).toBe(true)
    expect(getOverlay()).toBeNull()
  })

  it('a registration wins over the defaults and over an earlier registration until it is removed', () => {
    const { d, spies } = spyStore()
    const first = vi.fn()
    const second = vi.fn()
    const offFirst = d.register('Space', first)
    const offSecond = d.register('Space', second)
    d.dispatch(ev('Space'))
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
    offSecond()
    d.dispatch(ev('Space'))
    expect(first).toHaveBeenCalledTimes(1)
    offFirst()
    d.dispatch(ev('Space'))
    expect(spies.togglePlay).toHaveBeenCalledTimes(1)
  })

  it('a handler that returns false declines and the next binding runs', () => {
    const { d, spies } = spyStore()
    d.register('Space', () => false)
    expect(d.dispatch(ev('Space'))).toBe(true)
    expect(spies.togglePlay).toHaveBeenCalledTimes(1)
  })

  it('presentation-only keys decline outside presentation mode', () => {
    const { d, spies } = spyStore()
    for (const spec of ['Enter', 'B', '.']) expect(d.dispatch(ev(spec)), spec).toBe(false)
    expect(spies.toggleFullscreen).not.toHaveBeenCalled()
    expect(spies.toggleBlackScreen).not.toHaveBeenCalled()
  })

  it('PageDown steps a stage in presentation mode and a period elsewhere', () => {
    const { d, spies, store } = spyStore()
    d.dispatch(ev('PageDown'))
    expect(spies.stepPeriod).toHaveBeenCalledWith(1)
    store.setState({ presentation: true })
    d.dispatch(ev('PageDown'))
    expect(spies.stepStage).toHaveBeenCalledWith(1)
  })

  it('with a kit in presentation mode the arrows step bookmarks and Shift+Arrow steps stages', () => {
    const kit = { id: 'k', name: 'k', bookmarks: [], index: 0 }
    const { d, spies } = spyStore({ presentation: true, kit })
    d.dispatch(ev('ArrowRight'))
    expect(spies.stepBookmark).toHaveBeenCalledWith(1)
    d.dispatch(ev('Shift+ArrowLeft'))
    expect(spies.stepStage).toHaveBeenCalledWith(-1)
    expect(spies.nudgeTime).not.toHaveBeenCalled()
  })

  it('any key other than B and . leaves the black screen and does nothing else', () => {
    const { d, spies } = spyStore({ presentation: true, blackScreen: true })
    const e = ev('ArrowRight')
    expect(d.dispatch(e)).toBe(true)
    expect(spies.toggleBlackScreen).toHaveBeenCalledTimes(1)
    expect(spies.stepStage).not.toHaveBeenCalled()
    expect(e.preventDefault).toHaveBeenCalled()
    d.dispatch(ev('B'))
    expect(spies.toggleBlackScreen).toHaveBeenCalledTimes(2)
  })

  it('I declines without a selection and H hides every selected id', () => {
    const { d, spies, store } = spyStore()
    expect(d.dispatch(ev('I'))).toBe(false)
    expect(d.dispatch(ev('H'))).toBe(false)
    store.setState({ selection: ['ZFA:0000114', 'ZFA:0000107'] })
    d.dispatch(ev('H'))
    expect(spies.setStructureHidden).toHaveBeenCalledTimes(2)
  })
})

describe('the Escape order', () => {
  it('exits isolate, closes the sheet, clears the selection, exits presentation, one per press', () => {
    const store = createAtlasStore({ isolate: true, selection: ['ZFA:0000114'], presentation: true })
    openOverlay('shortcuts')
    expect(runEscape(store)).toBe(true)
    expect(store.getState().isolate).toBe(false)
    expect(runEscape(store)).toBe(true)
    expect(getOverlay()).toBeNull()
    expect(runEscape(store)).toBe(true)
    expect(store.getState().selection).toEqual([])
    expect(runEscape(store)).toBe(true)
    expect(store.getState().presentation).toBe(false)
    expect(runEscape(store)).toBe(false)
  })

  it("closes the reporter preview sheet before it clears the selection, with 'lab' registered", () => {
    const store = createAtlasStore({ selection: ['ZFA:0000114'] })
    closeOverlay()
    toggleOverlay('lab')
    expect(getOverlay()).toBe('lab')
    // The sheet carries role="dialog". Registered, it closes first; unregistered, runEscape would
    // bail at the DOM popup test and the next Escape would never reach the selection.
    expect(runEscape(store)).toBe(true)
    expect(getOverlay()).toBeNull()
    expect(store.getState().selection).toEqual(['ZFA:0000114'])
    expect(runEscape(store)).toBe(true)
    expect(store.getState().selection).toEqual([])
    toggleOverlay('lab')
    toggleOverlay('lab')
    expect(getOverlay()).toBeNull()
    openOverlay('lab')
    closeOverlay('settings')
    expect(getOverlay()).toBe('lab')
    closeOverlay('lab')
    expect(getOverlay()).toBeNull()
  })

  it('closes the card of a vocabulary term that no record stands in for (D17)', () => {
    const store = createAtlasStore()
    // A term with no stand-in leaves the selection empty, so the selection test alone missed it.
    store.getState().selectTerm('ZFA:0009401', null)
    expect(store.getState().selection).toEqual([])
    expect(store.getState().selectedTerm).toBe('ZFA:0009401')
    expect(runEscape(store)).toBe(true)
    expect(store.getState().selectedTerm).toBeNull()
    expect(runEscape(store)).toBe(false)
  })
})

describe('camera arithmetic', () => {
  it('orbits by 15 degrees at a constant distance and clamps the polar angle', () => {
    const pose = { position: [0, 0, 3] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
    const yawed = orbitPose(pose, 15, 0, true)
    expect(Math.hypot(...yawed.position)).toBeCloseTo(3, 6)
    expect(Math.atan2(yawed.position[0], yawed.position[2]) * (180 / Math.PI)).toBeCloseTo(15, 6)
    let p = pose
    for (let i = 0; i < 12; i++) p = orbitPose(p, 0, 15, true)
    const polar = Math.acos(p.position[1] / Math.hypot(...p.position)) * (180 / Math.PI)
    expect(polar).toBeCloseTo(9, 3)
    expect(zoomPose(pose, 0.9).position[2]).toBeCloseTo(2.7, 6)
  })
})

describe('settings store', () => {
  function memory(): StorageLike & { map: Map<string, string> } {
    const map = new Map<string, string>()
    return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) }
  }
  const female = { id: 'ZFA:0000403', visibleFromHpf: 600, modelEndHpf: 4320, fadeInHpf: 0, fadeOutHpf: 0, sexSpecific: 'female' }
  const male = { id: 'ZFA:0000598', visibleFromHpf: 600, modelEndHpf: 4320, fadeInHpf: 0, fadeOutHpf: 0, sexSpecific: 'male' }
  const data = { structures: [female, male], stages: { stages: [] } } as unknown as AtlasData

  it('mirrors the atlas sex and "both" draws every sex-specific record', () => {
    const atlas = createAtlasStore({ data, time: 1000 })
    atlas.getState().setTime(1000)
    const settings = createSettingsStore(atlas)
    expect(settings.getState().sex).toBe('female')
    expect(atlas.getState().presentIds).toEqual([female.id])
    settings.getState().setSex('male')
    expect(atlas.getState().sex).toBe('male')
    expect(atlas.getState().presentIds).toEqual([male.id])
    settings.getState().setSex('both')
    expect(settings.getState().sex).toBe('both')
    expect(atlas.getState().presentIds).toEqual([female.id, male.id])
    expect(atlas.getState().toUrl().sex).toBe('b')
    atlas.getState().setSex('female')
    expect(settings.getState().sex).toBe('female')
  })

  it('applies stored preferences, writes changes, and never writes in embed mode', () => {
    const storage = memory()
    writePrefs({ reducedMotion: true, stripPosition: 'top', palette: 'okabeIto' }, storage)
    expect(readPrefs(storage)).toEqual({ reducedMotion: true, stripPosition: 'top', palette: 'okabeIto' })
    storage.setItem('zfatlas:prefs:v1', '{"quality":"bad","followGrowth":"no"}')
    expect(readPrefs(storage)).toEqual({})

    const atlas = createAtlasStore()
    const settings = createSettingsStore(atlas)
    writePrefs({ reducedMotion: true, stripPosition: 'top', palette: 'okabeIto', keepDorsalUp: false }, storage)
    const detach = attachPrefs(atlas, settings, storage)
    expect(atlas.getState().reducedMotion).toBe(true)
    expect(atlas.getState().stripPosition).toBe('top')
    expect(atlas.getState().keepDorsalUp).toBe(false)
    expect(settings.getState().palette).toBe('okabeIto')
    atlas.getState().setQuality('presentation')
    settings.getState().setPalette('atlas')
    expect(readPrefs(storage)).toMatchObject({ quality: 'presentation', palette: 'atlas' })
    atlas.getState().setPresentation(true)
    expect(readPrefs(storage).jumpOnSelect).toBeUndefined()
    atlas.getState().setEmbed(true)
    atlas.getState().setFollowGrowth(false)
    expect(readPrefs(storage).followGrowth).toBeUndefined()
    detach()
  })
})
