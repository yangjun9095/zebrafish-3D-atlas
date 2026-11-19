// Global key dispatcher (spec 5.9.1, UI-41). One capture-phase keydown listener on window matches
// event.code plus exact modifiers, calls preventDefault() on every key it handles, and ignores an
// event that is already handled or that targets a text field, a slider, a listbox, or a button for
// the keys a button handles itself (Space and Enter; every key on a `data-own-keys` control).
// The defaults below drive the store directly; a package layers its own handler with register()
// and the newest registration wins. The overlay registry names the open sheet for the Escape order.
import { atlasStore } from './store.ts'
import type { AtlasStoreApi } from './slices/compose.ts'
import type { CameraPose } from './slices/types.ts'

export interface KeyEventLike {
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  defaultPrevented: boolean
  repeat?: boolean
  target: EventTarget | null
  preventDefault(): void
}

export interface Shortcut {
  code: string
  shift?: boolean
  ctrl?: boolean
  alt?: boolean
  /** Skips the binding when it returns false. */
  when?: () => boolean
  /** Runs the action. Return false to decline: the next matching binding runs, else the browser keeps the key. */
  run(event: KeyboardEvent): void | boolean
}

export interface KeyCombo { code: string; shift: boolean; ctrl: boolean; alt: boolean }

const CODE_ALIASES: Record<string, string> = {
  '?': 'Shift+Slash', '/': 'Slash', '[': 'BracketLeft', ']': 'BracketRight', ',': 'Comma', '.': 'Period',
  Plus: 'Equal', Minus: 'Minus', ' ': 'Space', Esc: 'Escape', Up: 'ArrowUp', Down: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight',
}

/** Parses "Ctrl+Shift+KeyS", "Alt+ArrowLeft", "?", "Shift+P" or "3" into a combo (Cmd counts as Ctrl). */
export function parseKey(spec: string): KeyCombo {
  const combo: KeyCombo = { code: '', shift: false, ctrl: false, alt: false }
  for (const raw of spec.split('+').filter(Boolean)) {
    const part = CODE_ALIASES[raw] ?? raw
    if (part.includes('+')) {
      const inner = parseKey(part)
      combo.code = inner.code
      combo.shift ||= inner.shift
      continue
    }
    const low = part.toLowerCase()
    if (low === 'ctrl' || low === 'control' || low === 'cmd' || low === 'meta') combo.ctrl = true
    else if (low === 'shift') combo.shift = true
    else if (low === 'alt' || low === 'option') combo.alt = true
    else if (/^[a-z]$/i.test(part)) combo.code = `Key${part.toUpperCase()}`
    else if (/^\d$/.test(part)) combo.code = `Digit${part}`
    else combo.code = part
  }
  if (!combo.code) throw new Error(`shortcut "${spec}" names no key`)
  return combo
}

export function matchesCombo(e: KeyEventLike, b: KeyCombo | Shortcut): boolean {
  return e.code === b.code && e.shiftKey === Boolean(b.shift) && e.altKey === Boolean(b.alt) && (e.ctrlKey || e.metaKey) === Boolean(b.ctrl)
}

const TEXT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const OWN_KEY_ROLES = new Set(['slider', 'listbox', 'textbox', 'combobox', 'searchbox', 'tree', 'treeitem'])
/** The keys a focused button handles itself; every other key reaches the dispatcher (a closed sheet returns focus to its opener button). */
const BUTTON_KEYS = new Set(['Space', 'Enter', 'NumpadEnter'])

/**
 * True when the target owns the key (UI-41, UX-AC-02): a text field, a slider, a listbox, a tree
 * row or a `data-own-keys` control for every key; a button for Space and Enter (all keys when no code is given).
 */
export function targetHandlesKeys(target: unknown, code?: string): boolean {
  if (!target || typeof target !== 'object') return false
  const el = target as { tagName?: string; isContentEditable?: boolean; getAttribute?: (n: string) => string | null }
  const tag = el.tagName?.toUpperCase()
  if ((tag && TEXT_TAGS.has(tag)) || el.isContentEditable) return true
  if (el.getAttribute?.('data-own-keys') !== null && el.getAttribute?.('data-own-keys') !== undefined) return true
  if (tag === 'BUTTON') return code === undefined || BUTTON_KEYS.has(code)
  const role = el.getAttribute?.('role')
  return role !== null && role !== undefined && OWN_KEY_ROLES.has(role)
}

function insideModal(target: unknown): boolean {
  const el = target as { closest?: (sel: string) => unknown } | null
  return typeof el?.closest === 'function' && Boolean(el.closest('[aria-modal="true"]'))
}

function domHasPopup(): boolean {
  return typeof document !== 'undefined' && document.querySelector('[role="dialog"], [role="menu"]') !== null
}

// Overlay registry: the open sheet or dialog, one at a time (settings, shortcuts, share, export,
// kit, about, lab). A sheet that carries role="dialog" must register here, because runEscape tests
// the registry before domHasPopup() and an unregistered dialog makes Escape bail: it closes the
// registered overlay first, so the reader's next Escape still clears the selection.
export type OverlayId = 'settings' | 'shortcuts' | 'share' | 'export' | 'kit' | 'about' | 'lab' | (string & {})
let overlay: OverlayId | null = null
const overlayListeners = new Set<() => void>()
const emitOverlay = () => { for (const cb of overlayListeners) cb() }
export function getOverlay(): OverlayId | null { return overlay }
export function openOverlay(id: OverlayId): void { if (overlay !== id) { overlay = id; emitOverlay() } }
export function closeOverlay(id?: OverlayId): void { if (overlay !== null && (id === undefined || overlay === id)) { overlay = null; emitOverlay() } }
export function toggleOverlay(id: OverlayId): void { if (overlay === id) closeOverlay(id); else openOverlay(id) }
export function subscribeOverlay(cb: () => void): () => void { overlayListeners.add(cb); return () => { overlayListeners.delete(cb) } }

// Camera arithmetic for Alt+Arrow (orbit by 15 degrees) and Alt+Plus/Minus (zoom by 10 percent).
const POLAR_CLAMP = 0.05 * Math.PI
export function orbitPose(pose: CameraPose, yawDeg: number, pitchDeg: number, clampPolar: boolean): CameraPose {
  const [tx, ty, tz] = pose.target
  const dx = pose.position[0] - tx, dy = pose.position[1] - ty, dz = pose.position[2] - tz
  const r = Math.max(Math.hypot(dx, dy, dz), 1e-6)
  let theta = Math.atan2(dx, dz) + (yawDeg * Math.PI) / 180
  let phi = Math.acos(Math.min(Math.max(dy / r, -1), 1)) - (pitchDeg * Math.PI) / 180
  const lo = clampPolar ? POLAR_CLAMP : 1e-3
  phi = Math.min(Math.max(phi, lo), Math.PI - lo)
  theta = ((theta + Math.PI) % (2 * Math.PI)) - Math.PI
  return { target: pose.target, position: [tx + r * Math.sin(phi) * Math.sin(theta), ty + r * Math.cos(phi), tz + r * Math.sin(phi) * Math.cos(theta)] }
}
export function zoomPose(pose: CameraPose, factor: number): CameraPose {
  const [tx, ty, tz] = pose.target
  return { target: pose.target, position: [tx + (pose.position[0] - tx) * factor, ty + (pose.position[1] - ty) * factor, tz + (pose.position[2] - tz) * factor] }
}

/** Focuses the search field of the top bar (Ctrl+K, /); false without one. */
function focusSearch(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.querySelector<HTMLElement>('input[type="search"], [role="searchbox"], [role="combobox"] input, input[role="combobox"]')
  if (!el) return false
  el.focus()
  return true
}

/**
 * The Escape order of 5.9.1: exit isolate, close the sheet, clear the selection, exit presentation.
 * "The sheet" is whatever openOverlay last named, the reporter preview sheet ('lab') included.
 */
export function runEscape(store: AtlasStoreApi): boolean {
  const s = store.getState()
  if (s.isolate) { s.setIsolate(false); return true }
  if (overlay !== null) { closeOverlay(); return true }
  if (domHasPopup()) return false
  // A term with no stand-in leaves the selection empty while its card is open (D17), so the
  // term is tested too; clearSelection drops both.
  if (s.selection.length > 0 || s.selectedTerm !== null) { s.clearSelection(); return true }
  if (s.presentation) { s.setPresentation(false); return true }
  return false
}

function key(spec: string, run: Shortcut['run'], when?: () => boolean): Shortcut {
  return { ...parseKey(spec), run, when }
}

/** The default table: every row of 5.9.1 that the store can serve. Other packages layer the rest. */
export function defaultShortcuts(store: AtlasStoreApi): Shortcut[] {
  const S = () => store.getState()
  const present = () => S().presentation
  const withKit = () => S().presentation && S().kit !== null
  const view = (dir: 1 | -1, kind: 'stage' | 'period') => () => (kind === 'stage' ? S().stepStage(dir) : S().stepPeriod(dir))
  const adultStart = () => { const st = S().data?.stages.stages; return st && st.length > 0 ? st[st.length - 1].startHpf : 2160 }
  const orbit = (yaw: number, pitch: number) => () => {
    const s = S()
    if (!s.camera) return false
    s.setCameraPose(orbitPose(s.camera, yaw, pitch, s.keepDorsalUp), { manual: true })
  }
  const zoom = (factor: number) => () => { const s = S(); if (!s.camera) return false; s.setCameraPose(zoomPose(s.camera, factor), { manual: true }) }
  const sel = () => S().selection.length > 0
  return [
    key('Space', () => S().togglePlay()),
    key('ArrowRight', () => S().stepBookmark(1), withKit),
    key('ArrowLeft', () => S().stepBookmark(-1), withKit),
    key('Shift+ArrowRight', view(1, 'stage'), withKit),
    key('Shift+ArrowLeft', view(-1, 'stage'), withKit),
    key('ArrowRight', view(1, 'stage')),
    key('ArrowLeft', view(-1, 'stage')),
    key('Shift+ArrowRight', () => S().nudgeTime(1)),
    key('Shift+ArrowLeft', () => S().nudgeTime(-1)),
    key('PageDown', view(1, 'stage'), present),
    key('PageUp', view(-1, 'stage'), present),
    key('Shift+PageDown', view(1, 'period'), present),
    key('Shift+PageUp', view(-1, 'period'), present),
    key('PageDown', view(1, 'period')),
    key('PageUp', view(-1, 'period')),
    key('Home', () => S().setTime(0)),
    key('End', () => S().setTime(adultStart())),
    key('Shift+End', () => S().setTime(4320)),
    key('[', () => S().stepSpeed(-1)),
    key(']', () => S().stepSpeed(1)),
    key('S', () => S().toggleSnap()),
    key('U', () => S().cycleUnits()),
    ...(['lateral', 'dorsal', 'ventral', 'anterior', 'posterior', 'threeQuarter'] as const).map((p, i) => key(String(i + 1), () => S().setViewPreset(p))),
    key('R', () => S().resetView(false)),
    key('Shift+R', () => S().resetView(true)),
    key('X', () => S().toggleXray()),
    key('D', () => S().stepDissect(1)),
    key('Shift+D', () => S().stepDissect(-1)),
    key('I', () => { const s = S(); if (!s.isolate && !sel()) return false; s.setIsolate(!s.isolate) }),
    key('H', () => { const s = S(); for (const id of s.selection) s.setStructureHidden(id, true) }, sel),
    key('L', () => S().setLabels(!S().labels)),
    key('F', () => S().requestFit()),
    key('T', () => S().toggleTheme()),
    key('P', () => S().setPresentation(!S().presentation)),
    key('Shift+P', () => S().toggleStripPin()),
    key('Enter', () => S().toggleFullscreen(), present),
    key('NumpadEnter', () => S().toggleFullscreen(), present),
    key('Shift+F', () => S().toggleFullscreen()),
    key('B', () => S().toggleBlackScreen(), present),
    key('.', () => S().toggleBlackScreen(), present),
    key('Ctrl+B', () => S().addBookmark()),
    key('Ctrl+K', focusSearch),
    key('/', focusSearch),
    key('Alt+ArrowLeft', orbit(-15, 0)),
    key('Alt+ArrowRight', orbit(15, 0)),
    key('Alt+ArrowUp', orbit(0, 15)),
    key('Alt+ArrowDown', orbit(0, -15)),
    key('Alt+Equal', zoom(0.9)),
    key('Alt+NumpadAdd', zoom(0.9)),
    key('Alt+Minus', zoom(1 / 0.9)),
    key('Alt+NumpadSubtract', zoom(1 / 0.9)),
    key('?', () => toggleOverlay('shortcuts')),
    key(',', () => toggleOverlay('settings'), () => !present()),
    // The export and share sheets read the overlay registry (src/viewer/export/dialogState.ts).
    key('Ctrl+Shift+S', () => openOverlay('export')),
    key('Shift+C', () => openOverlay('share'), () => !present()),
    key('Escape', () => runEscape(store)),
  ]
}

/** Keys that still work while focus sits inside a modal sheet. */
const MODAL_KEYS: readonly KeyCombo[] = [parseKey('Escape'), parseKey(','), parseKey('?')]
/** Keys that repeat while held; every other key fires once per press. */
const REPEATABLE = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract'])

export interface RegisterOptions { when?: () => boolean }
export interface Dispatcher {
  /** Dispatches one event; true when a binding handled it (and preventDefault ran). */
  dispatch(event: KeyEventLike): boolean
  /** Adds a binding that wins over the defaults and earlier registrations; returns the remover. */
  register(key: string, run: Shortcut['run'], opts?: RegisterOptions): () => void
  /** Adds a group of bindings; returns one remover. */
  registerAll(bindings: readonly Shortcut[]): () => void
  /** Installs the capture-phase keydown listener; returns the remover. */
  install(target?: Pick<Window, 'addEventListener' | 'removeEventListener'> | null): () => void
  readonly bindings: readonly Shortcut[]
}

export function createDispatcher(store: AtlasStoreApi): Dispatcher {
  const defaults = defaultShortcuts(store)
  const layers: (readonly Shortcut[])[] = []
  const dispatcher: Dispatcher = {
    get bindings() { return [...layers.slice().reverse().flat(), ...defaults] },
    dispatch(e) {
      if (e.defaultPrevented || targetHandlesKeys(e.target, e.code)) return false
      if (e.repeat && !REPEATABLE.has(e.code)) return false
      const s = store.getState()
      // UI-40: any key other than B and . leaves the black screen and does nothing else.
      if (s.blackScreen && !(e.code === 'KeyB' || e.code === 'Period') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        s.toggleBlackScreen()
        e.preventDefault()
        return true
      }
      if (insideModal(e.target) && !MODAL_KEYS.some((k) => matchesCombo(e, k))) return false
      for (const b of dispatcher.bindings) {
        if (!matchesCombo(e, b) || (b.when && !b.when())) continue
        if (b.run(e as unknown as KeyboardEvent) === false) continue
        e.preventDefault()
        return true
      }
      return false
    },
    register(spec, run, opts) {
      return dispatcher.registerAll([{ ...parseKey(spec), run, when: opts?.when }])
    },
    registerAll(bindings) {
      layers.push(bindings)
      return () => { const i = layers.indexOf(bindings); if (i >= 0) layers.splice(i, 1) }
    },
    install(target) {
      const node = target === undefined ? (typeof window === 'undefined' ? null : window) : target
      if (!node) return () => undefined
      const onKeyDown = (ev: Event) => { dispatcher.dispatch(ev as unknown as KeyEventLike) }
      node.addEventListener('keydown', onKeyDown, true)
      return () => node.removeEventListener('keydown', onKeyDown, true)
    },
  }
  return dispatcher
}

let appDispatcher: Dispatcher | null = null
/** The dispatcher bound to the app store. */
export function getDispatcher(): Dispatcher {
  appDispatcher ??= createDispatcher(atlasStore)
  return appDispatcher
}
/** Registers a handler for a key spec such as "Ctrl+Shift+S" or "Shift+C"; the newest wins. Returns the remover. */
export function register(key: string, run: Shortcut['run'], opts?: RegisterOptions): () => void {
  return getDispatcher().register(key, run, opts)
}
export function registerAll(bindings: readonly Shortcut[]): () => void {
  return getDispatcher().registerAll(bindings)
}
/** Installs the window listener once (main.tsx). Returns the remover. */
export function installShortcuts(): () => void {
  return getDispatcher().install()
}

export interface KeyRow {
  keys: string[]
  action: string
  specs: string[]
  group: 'Time' | 'View' | 'Selection' | 'Presentation' | 'App'
  owner?: string
  /** The key works only where the timeline draws its event row, so the sheet hides the row elsewhere. */
  needsEventRow?: boolean
}
/** The keyboard map of 5.9.1 for the shortcut sheet; `specs` are the dispatcher keys of each row. */
export const KEYBOARD_MAP: readonly KeyRow[] = [
  { group: 'Time', keys: ['Space'], action: 'Play or pause', specs: ['Space'] },
  { group: 'Time', keys: ['←', '→'], action: 'Previous or next stage (bookmarks with a kit in presentation mode)', specs: ['ArrowLeft', 'ArrowRight'] },
  { group: 'Time', keys: ['Shift+←', 'Shift+→'], action: 'Step 1 hpf before 72 hpf, 1 dpf after (stages with a kit)', specs: ['Shift+ArrowLeft', 'Shift+ArrowRight'] },
  { group: 'Time', keys: ['PageUp', 'PageDown'], action: 'Previous or next period; stage in presentation mode (remotes)', specs: ['PageUp', 'PageDown'] },
  { group: 'Time', keys: ['Shift+PageUp', 'Shift+PageDown'], action: 'Previous or next period in presentation mode', specs: ['Shift+PageUp', 'Shift+PageDown'] },
  { group: 'Time', keys: ['Home', 'End'], action: 'Axis start, adult start', specs: ['Home', 'End'] },
  { group: 'Time', keys: ['Shift+End'], action: 'Axis end (180 dpf)', specs: ['Shift+End'] },
  { group: 'Time', keys: ['[', ']'], action: 'Speed down, speed up', specs: ['[', ']'] },
  { group: 'Time', keys: ['S'], action: 'Snap to stage', specs: ['S'] },
  { group: 'Time', keys: ['U'], action: 'Cycle units (hpf, dpf, auto)', specs: ['U'] },
  { group: 'Time', keys: ['↑', '↓'], action: 'Step the time up or down (timeline focused)', specs: [], owner: 'Track' },
  { group: 'Time', keys: ['Shift+↓'], action: 'Open the events nearest the thumb (timeline focused)', specs: ['Shift+ArrowDown'], owner: 'Track', needsEventRow: true },
  { group: 'View', keys: ['1', '2', '3', '4', '5', '6'], action: 'Lateral, dorsal, ventral, anterior, posterior, three-quarter', specs: ['1', '2', '3', '4', '5', '6'] },
  { group: 'View', keys: ['R', 'Shift+R'], action: 'Reset camera, reset all', specs: ['R', 'Shift+R'] },
  { group: 'View', keys: ['F'], action: 'Fit camera to body', specs: ['F'] },
  { group: 'View', keys: ['X'], action: 'Toggle x-ray', specs: ['X'] },
  { group: 'View', keys: ['D', 'Shift+D'], action: 'Step the dissect slider 0, 30, 60, 100 percent (Shift steps back)', specs: ['D', 'Shift+D'] },
  { group: 'View', keys: ['L'], action: 'Toggle 3D labels', specs: ['L'] },
  { group: 'View', keys: ['T'], action: 'Toggle theme', specs: ['T'] },
  { group: 'View', keys: ['Alt+←', 'Alt+→', 'Alt+↑', 'Alt+↓'], action: 'Orbit by 15 degrees', specs: ['Alt+ArrowLeft', 'Alt+ArrowRight', 'Alt+ArrowUp', 'Alt+ArrowDown'] },
  { group: 'View', keys: ['Alt++', 'Alt+-'], action: 'Zoom by 10 percent', specs: ['Alt+Equal', 'Alt+Minus'] },
  { group: 'Selection', keys: ['Ctrl+K', '/'], action: 'Focus search', specs: ['Ctrl+K', '/'], owner: 'Search' },
  { group: 'Selection', keys: ['I'], action: 'Isolate selection', specs: ['I'] },
  { group: 'Selection', keys: ['H'], action: 'Hide selection', specs: ['H'] },
  { group: 'Selection', keys: ['Ctrl+C'], action: 'Copy "name (ZFA id)" of the selection', specs: ['Ctrl+C'], owner: 'App' },
  { group: 'Selection', keys: ['Esc'], action: 'Exit isolate, close sheet, clear selection, exit presentation (one per press)', specs: ['Escape'] },
  { group: 'Presentation', keys: ['P', 'Shift+P'], action: 'Presentation mode, pin the strip', specs: ['P', 'Shift+P'] },
  { group: 'Presentation', keys: ['Enter', 'Shift+F'], action: 'Fullscreen (Enter in presentation mode)', specs: ['Enter', 'Shift+F'] },
  { group: 'Presentation', keys: ['B', '.'], action: 'Black screen (presentation mode)', specs: ['B', '.'] },
  { group: 'Presentation', keys: ['Ctrl+B'], action: 'Add a bookmark', specs: ['Ctrl+B'] },
  { group: 'Presentation', keys: ['Shift+B'], action: 'Slide kit sheet', specs: ['Shift+B'], owner: 'KitSheet' },
  { group: 'App', keys: ['?'], action: 'This sheet', specs: ['?'] },
  { group: 'App', keys: [','], action: 'Settings (not in presentation mode)', specs: [','] },
  { group: 'App', keys: ['Shift+C'], action: 'Share link (not in presentation mode)', specs: ['Shift+C'] },
  { group: 'App', keys: ['Ctrl+Shift+S'], action: 'Export PNG', specs: ['Ctrl+Shift+S'] },
  { group: 'App', keys: ['Tab'], action: 'Move between regions', specs: [], owner: 'browser' },
]
