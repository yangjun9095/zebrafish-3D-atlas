// Shared types of the atlas store (spec 2.4). Slices import from here; nothing here imports a slice.
import type { StoreApi } from 'zustand/vanilla'
import type { AtlasData, AtlasParseError, AtlasParseResult, StageRecord, StructureRecord } from '../../core/schema.ts'
import type { UrlState } from '../../core/urlState.ts'
import type { FluorescenceConfig } from '../../core/fluorescence.ts'

export type SystemId = string
export type ZfaId = `ZFA:${string}`
export type ViewPreset = 'lateral' | 'dorsal' | 'ventral' | 'anterior' | 'posterior' | 'threeQuarter' | 'free'
export type SectionAxis = 'sagittal' | 'frontal' | 'transverse'
export type Units = 'hpf' | 'dpf' | 'auto'
export type Theme = 'dark' | 'light'
/** Where the current theme came from. Only a user choice is persisted; 'system' never reaches the URL (AR-49). */
export type ThemeSource = 'system' | 'stored' | 'url' | 'user'
export type Quality = 'standard' | 'presentation'
export type Speed = 0.5 | 1 | 2 | 4 | 8
export type Tessellation = 'interactive' | 'final'
export type WebglStatus = 'probing' | 'ok' | 'lost' | 'unavailable'
/** The D9 sex toggle; 'both' draws the ovary and the testis together (UI-27). */
export type Sex = 'female' | 'male' | 'both'
export type ProjectorScale = 1 | 1.5 | 2
export type StripPosition = 'bottom' | 'top'
export type RailPreset = 'all' | 'none' | 'embryo' | 'organs' | 'skeleton'
export type StepDir = -1 | 1

export interface CameraPose { position: [number, number, number]; target: [number, number, number] }
export interface SectionState { axis: SectionAxis | null; position: number; flip: boolean }
export interface Bookmark {
  fluorescence?: FluorescenceConfig
  name: string
  t: number
  view: ViewPreset
  cam: CameraPose | null
  sel: ZfaId[]
  hide: string[]
  xr: number
  sec: SectionState
  iso: boolean
  labels: boolean
  notes: string
}
export interface SlideKit { id: string; name: string; bookmarks: Bookmark[]; index: number }

export const SPEEDS: readonly Speed[] = [0.5, 1, 2, 4, 8]
export const MAX_SELECTION = 12
export const TIME_MAX_HPF = 4320
export const DEFAULT_TIME_HPF = 24
export const DEFAULT_XRAY = 60
export const DEFAULT_DISSECT = 0
export const DEFAULT_TEMPERATURE_C = 28.5
export const SECTION_OFF: SectionState = { axis: null, position: 0, flip: false }

export interface TimeState {
  time: number
  playing: boolean
  speed: Speed
  snap: boolean
  units: Units
  temperatureC: number
  /** Derived by setTime with equality checks (AR-74). -1 before the data loads. */
  stageIndex: number
  presentIds: ZfaId[]
  /** Time at which the last playback started; play() at the axis end returns here (UX-TL-17). */
  playStartHpf: number | null
}
export interface TimeActions {
  setTime(t: number): void
  stepStage(dir: StepDir): void
  stepPeriod(dir: StepDir): void
  /** Shift+Arrow: 1 hpf before 72 hpf, 1 dpf after (UX-TL-21). */
  nudgeTime(dir: StepDir): void
  play(): void
  pause(): void
  togglePlay(): void
  setSpeed(s: Speed): void
  stepSpeed(dir: StepDir): void
  toggleSnap(): void
  setUnits(u: Units): void
  cycleUnits(): void
  setTemperature(c: number): void
  /** Moves time to visibleFromHpf + fadeInHpf of the structure (UI-20). */
  jumpToAppearance(id: ZfaId): void
}

export interface SelectionState { selection: ZfaId[]; hover: ZfaId | null; pinnedLabels: ZfaId[] }
export interface SelectionActions {
  select(id: ZfaId | null, opts?: { add?: boolean }): void
  clearSelection(): void
  setHover(id: ZfaId | null): void
  togglePinnedLabel(id: ZfaId): void
}

export interface VisibilityState {
  hiddenSystems: SystemId[]
  hiddenStructures: ZfaId[]
  isolate: boolean
  xray: number
  section: SectionState
  /** The rail preset that produced the current hidden set, or null after a manual change (UX-IN-28). */
  railPreset: RailPreset | null
  /** Last non-zero x-ray value, the target of toggleXray (UX-IN-17). */
  lastXray: number
  /** Hidden set before the last solo, restored by a second solo of the same system (UX-IN-27). */
  soloRestore: SystemId[] | null
}
export interface VisibilityActions {
  setSystemHidden(id: SystemId, hidden: boolean): void
  soloSystem(id: SystemId): void
  applyRailPreset(name: RailPreset): void
  setStructureHidden(id: ZfaId, hidden: boolean): void
  setIsolate(on: boolean): void
  setXray(value: number): void
  toggleXray(): void
  setSection(patch: Partial<SectionState>): void
}

export interface ViewState {
  viewPreset: ViewPreset
  camera: CameraPose | null
  followGrowth: boolean
  keepDorsalUp: boolean
  /** Counter; the camera rig fits the body when it changes (AR-41). */
  fitRequest: number
  /** Dissect slider, 0 to 100 percent (D17). The viewer damps its own follow of this value. */
  dissect: number
}
export interface ViewActions {
  setViewPreset(p: ViewPreset): void
  /** The rig writes the pose on its end event. manual (default true) marks a user orbit and sets the preset to free. */
  setCameraPose(pose: CameraPose, opts?: { manual?: boolean }): void
  requestFit(): void
  resetView(all?: boolean): void
  setFollowGrowth(on: boolean): void
  setKeepDorsalUp(on: boolean): void
  setDissect(value: number): void
  /** Walks the D17 steps 0, 30, 60, 100 and wraps at both ends (the D key). */
  stepDissect(dir: StepDir): void
}

export interface AppearanceState {
  theme: Theme
  themeSource: ThemeSource
  labels: boolean
  quality: Quality
  reducedMotion: boolean
  /** "Jump to appearance on select" (UX-IN-25); on in presentation mode. */
  jumpOnSelect: boolean
}
export interface AppearanceActions {
  setTheme(t: Theme): void
  toggleTheme(): void
  setLabels(on: boolean): void
  setQuality(q: Quality): void
  setReducedMotion(on: boolean): void
  setJumpOnSelect(on: boolean): void
}

export interface ModeState {
  presentation: boolean
  embed: boolean
  kit: SlideKit | null
  sex: Sex
  stripPinned: boolean
  projectorScale: ProjectorScale
  stripPosition: StripPosition
  blackScreen: boolean
}
export interface ModeActions {
  setPresentation(on: boolean): void
  setEmbed(on: boolean): void
  setSex(s: Sex): void
  toggleStripPin(): void
  setProjectorScale(s: ProjectorScale): void
  setStripPosition(p: StripPosition): void
  toggleBlackScreen(): void
  toggleFullscreen(): void
  loadKit(kit: SlideKit | null): void
  addBookmark(name?: string): void
  stepBookmark(dir: StepDir): void
  /** motion 'cut' skips the 600 ms glide (the ZIP export); the default follows reducedMotion and playing. */
  goToBookmark(index: number, opts?: BookmarkMotion): void
}
export interface BookmarkMotion { motion?: 'animate' | 'cut' }

export interface RuntimeState {
  data: AtlasData | null
  dataError: AtlasParseError | null
  tessellation: Tessellation
  rebuildPending: number
  webgl: WebglStatus
  warnings: string[]
}
export interface RuntimeActions {
  /** Stores the result of parseAtlasData (AR-07) and derives stageIndex and presentIds. */
  loadData(result: AtlasParseResult): void
  setTessellation(level: Tessellation): void
  setRebuildPending(n: number): void
  setWebgl(s: WebglStatus): void
  pushWarning(text: string): void
  clearWarnings(): void
}

export interface ToUrlOptions {
  /** Share dialog "Include camera" (UI-34). Default true. */
  includeCamera?: boolean
  /** Share dialog "Include theme". Default: the theme was chosen, or presentation mode is on (AR-49). */
  includeTheme?: boolean
}
export interface UrlActions {
  toUrl(opts?: ToUrlOptions): UrlState
  applyUrl(state: UrlState): void
}

export interface FluorescenceState { labEnabled: boolean; fluorescence: FluorescenceConfig }
export interface FluorescenceActions { setFluorescence(patch: Partial<FluorescenceConfig>): void }
export type AtlasState = TimeState & SelectionState & VisibilityState & ViewState & AppearanceState & ModeState & RuntimeState & FluorescenceState
export type AtlasActions = TimeActions & SelectionActions & VisibilityActions & ViewActions & AppearanceActions & ModeActions & RuntimeActions & UrlActions & FluorescenceActions
export type AtlasStore = AtlasState & AtlasActions

export type Set = StoreApi<AtlasStore>['setState']
export type Get = StoreApi<AtlasStore>['getState']

/** The two AR-74 derivations. store.ts wires timeAxis.ts and presence.ts; a test may pass stubs. */
export interface StoreDeps {
  stageIndexAt(stages: readonly StageRecord[], hpf: number): number
  presentIds(records: readonly StructureRecord[], hpf: number, opts?: { sex?: Sex }): readonly string[]
  /** Resolves a kit URL token that is a stored kit id (AR-45). */
  readKit?(id: string): SlideKit | null
}
