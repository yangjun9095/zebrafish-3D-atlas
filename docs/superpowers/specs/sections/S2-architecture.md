> **Superseded draft.** The assembled specification
> [`../2026-09-06-zebrafish-3d-atlas-design.md`](../2026-09-06-zebrafish-3d-atlas-design.md)
> is authoritative. This file is the section draft written before reconciliation and it may
> disagree with the assembled specification. Written by AI coding agents (Claude Code) under
> the direction of Yang-Joon Kim, 2026-09-06.

## Architecture and runtime

This section fixes the stack, the module layout, the data flow, and the store. It also fixes the rendering rules, the URL state, the export pipeline, the two view modes, the performance budget, and the error paths. Time values are in hours post fertilization (hpf) unless a value says days post fertilization (dpf). Body sizes after 72 hpf are stated at a standard length (SL). Structure ids come from the ZFIN anatomy ontology (ZFA) and stage ids from the ZFIN stage ontology (ZFS). Decisions D1 to D15 refer to the decision record.

### Stack

The versions below are the D2 versions. `package.json` already pins them. Research 06, section 1, records the peer ranges that fix each choice.

| Package | Version | Justification |
|---|---|---|
| react, react-dom | 19.2.x | inside the `>=19 <19.3` peer window of @react-three/fiber 9.7 (research 06, section 1) |
| three | 0.185.1 | newest release inside every peer range; ships `readRenderTargetPixelsAsync` and `NeutralToneMapping` (research 06, sections 1 and 5) |
| @react-three/fiber | 9.7.x | one React component per structure; built-in pointer events; `frameloop="demand"` (research 06, section 2) |
| @react-three/drei | 10.7.x | `Html`, `OrbitControls`, `Outlines`, `Bounds`, `PerformanceMonitor` without custom code (research 06, section 10) |
| @react-three/postprocessing | 3.1.x | `Outline` with `xRay` and SMAA behind the quality toggle only; caps three below 0.186 (research 06, section 9) |
| zustand | 5.x | one store read by the UI and the scene; already a drei dependency (research 06, section 10) |
| zod | 4.x | one schema for data files and URL state; `z.toJSONSchema()` emits Draft 2020-12 for editors (research 06, section 6) |
| tailwindcss, @tailwindcss/vite | 4.3.x | panel styling from CSS variables; peer range includes Vite 8 (research 06, section 1) |
| lucide-react | 1.41.0 | icon names verified against `lucide-static` in research 07, section 4.7 |
| vite | 8.2.x | static build with Rolldown; `base` from `VITE_BASE_PATH` for GitHub Pages (research 06, section 7) |
| typescript | 5.9.x | pinned by D2; the lint tool chain does not support TypeScript 7 (research 06, section 1) |
| vitest | 5.x | core and data tests run in Node without a WebGL context (research 06, section 7) |
| @playwright/test | 1.63.x | system Chrome with SwiftShader flags for screenshots on a node without a GPU (research 06, section 7) |
| eslint, typescript-eslint | 10.x, 8.x | flat config; typescript-eslint 8.69 accepts ESLint 10 (research 06, section 7) |

- **AR-01** Every dependency is pinned to an exact version in `package.json`. An upgrade of three or postprocessing re-baselines the screenshots under `docs/screenshots/` before merge.
- **AR-02** The app installs no shadcn. The six primitives (button, badge, slider, switch, sheet, combobox) are local files under `src/ui/primitives/`.
- **AR-03** The Node engine is `>=22.12`. The scripts under `scripts/` run with `node <file>.ts` through type stripping (D2).

### Module layout

D12 fixes the top-level folders. The table below expands them to files. A file name in this table is the name the implementation uses.

- **AR-04** `src/core/` imports no DOM API, no React, and no three.js module. The one exception is `src/core/geometry/toBufferGeometry.ts`, which imports `BufferGeometry` and `BufferAttribute` from `three`. Every other builder returns plain typed arrays. `src/core/body/spine.ts` implements its own centripetal Catmull-Rom sampling and parallel-transport frames. An ESLint `no-restricted-imports` rule bans `three`, `react`, and `@react-three/*` under `src/core/**` and `src/state/**`, with one override for `toBufferGeometry.ts`.
- **AR-05** Imports flow one way: `core` imports nothing from the other folders; `state` imports `core`; `viewer` and `ui` import `core` and `state`; `viewer` and `ui` never import each other. `App.tsx` composes both.
- **AR-06** The five JSON files under `src/data/` are imported statically. Vite bundles them into the build. There is no runtime fetch of atlas data.

#### `src/core/`

| File | Purpose |
|---|---|
| `schema/systems.ts` | zod schema for `systems.json`: 15 system records with id, display name, ZFA roots, dark and light hex (D5, D10) |
| `schema/stages.ts` | zod schema for `stages.json`: 44 stages, 10 periods, events, `growth` table, `timeAxis` segments (D6, D7) |
| `schema/structures.ts` | zod schema for structure records: id, system, `alsoIn`, parent, presence window, fade window, `aliasChain`, keyframes, geometry params as a discriminated union on `kind` (D3, D5, D9) |
| `schema/body.ts` | zod schema for `body.json`: regime parameters, named stations, yolk and chorion parameters per regime (D3) |
| `schema/handoffs.ts` | zod schema for `handoffs.json`: `from`, `to`, window in hpf or SL (D9) |
| `schema/index.ts` | `parseAtlasData(raw)` runs the five schemas, resolves cross references, returns `AtlasData` or an `AtlasParseError` with file, path, and message |
| `schema/jsonSchema.ts` | `z.toJSONSchema()` for the five schemas; `scripts/validate-data.ts` writes them to `docs/schema/` |
| `body/bodyModel.ts` | `bodyModel(t): BodyFrame` (D3): 128 spine stations with position, tangent, dorsal normal, lateral binormal, `hD`, `hV`, `w`; yolk, chorion, epiboly, somite count, body length, head-trunk angle |
| `body/regimes.ts` | equations for R0 to R4 and the smoothstep blend across each boundary (D3) |
| `body/spine.ts` | centripetal Catmull-Rom curve, arc-length sampling, parallel-transport frames; no three import |
| `body/bodyCoords.ts` | `toWorld({u, v, w}, frame)` and `localHeight(u, frame)` for sizes given as a fraction of body height (D3) |
| `body/growth.ts` | `bodyLengthAt(t)` and `slRatio(t, referenceSl)` from the `growth` table (D6) |
| `geometry/types.ts` | `GeometryOut { positions, normals, uvs, indices, bounds }` as typed arrays; `TessellationLevel` |
| `geometry/tessellation.ts` | row and radial counts per primitive kind for the `interactive` and `final` levels (see the performance table) |
| `geometry/ellipsoid.ts`, `superellipsoid.ts`, `tube.ts`, `lathe.ts`, `segmentArray.ts`, `sheet.ts`, `shell.ts` | the seven primitives of D3 with analytic normals |
| `geometry/custom/heartLoop.ts`, `gutLoop.ts`, `eyeCup.ts`, `earVesicle.ts` | the four custom builders of D3 |
| `geometry/buildStructure.ts` | `buildStructure(record, frame, t, level): GeometryOut`; interpolates keyframes, converts body coordinates, dispatches on `kind` |
| `geometry/toBufferGeometry.ts` | `GeometryOut` to `BufferGeometry`; `writeInto(geometry, out)` updates existing attributes in place when counts match |
| `time/interpolate.ts` | keyframe bracketing and smoothstep parameter blend (D3) |
| `time/presence.ts` | `presenceAt(record, t)` returns `{ present, fade }` from `visibleFromHpf`, `modelEndHpf`, the fade window, and handoff cross-fades (D3, D9) |
| `time/timeAxis.ts` | hpf to track fraction and back from the D7 segment table; stage lookup; headline ticks; snap target |
| `time/playback.ts` | track distance per second for each speed; 1x crosses the track in 60 s (D7) |
| `time/format.ts` | readout strings for `hpf`, `dpf`, and `auto` units (research 07, UX-TL-24) |
| `url/urlState.ts` | the `UrlState` zod schema, `parseUrl`, `serializeUrl` |
| `rebuild/queue.ts` | pure priority queue: `replace(jobs)`, `drain(budgetMs, now)`; no timers, no three |
| `color/palette.ts` | system hue per theme, lightness step per depth, exception list, Okabe-Ito map (D10; research 07, section 4.2) |

#### `src/data/`

| File | Purpose |
|---|---|
| `systems.json`, `stages.json`, `structures.json`, `body.json`, `handoffs.json` | the five data files (D12) |
| `index.ts` | imports the five files and exports `loadAtlasData()`, a thin call to `parseAtlasData` |

#### `src/state/`

| File | Purpose |
|---|---|
| `store.ts` | `createAtlasStore()` and the `useAtlas` hook; combines the slices below |
| `slices/time.ts`, `selection.ts`, `visibility.ts`, `view.ts`, `appearance.ts`, `mode.ts`, `runtime.ts` | one slice per concern; each slice owns its fields and actions |
| `urlSync.ts` | subscribes to the store, serialises the URL subset, calls `history.replaceState` under a 300 ms throttle |
| `persist.ts` | reads and writes `theme`, rail widths, and the first-run flag in `localStorage`; a no-op in embed mode |
| `shortcuts.ts` | key to action table; ignored while focus is in a text field |

#### `src/viewer/`

| File | Purpose |
|---|---|
| `Viewer.tsx` | the R3F `Canvas` with the settings of AR-21; the WebGL probe; context-loss handlers |
| `Scene.tsx` | composes lights, environment, body, structures, selection, labels, camera rig, section plane |
| `Lights.tsx` | hemisphere, key, and rim lights parented to the camera (AR-24) |
| `Environment.tsx` | `RoomEnvironment` through `PMREMGenerator` at intensity 0.3 (AR-23) |
| `Body.tsx` | the body tube mesh from `bodyModel(t)`; first job in every rebuild |
| `Structures.tsx` | maps present structure records to `StructureMesh` or `InstancedStructure` |
| `StructureMesh.tsx` | one mesh per structure; holds the geometry ref, material state, fade, layers, `renderOrder` |
| `InstancedStructure.tsx` | `segmentArray` structures as one `InstancedMesh` with `count` set per rebuild |
| `useRebuildDriver.ts` | store subscription, settle timer, the `useFrame` slice loop of AR-10 to AR-14 |
| `materials.ts` | material factory per structure; state transitions for opaque, fading, ghost, isolated context, x-ray |
| `picking.ts` | raycaster layer rule, tap thresholds, `stopPropagation` on first hit |
| `Selection.tsx` | drei `Outlines` around selected meshes; `PostOutline.tsx` mounts the composer when quality is `presentation` |
| `Hover.tsx` | emissive tint, cursor, hover chip anchor |
| `Labels.tsx` | drei `Html` labels under the budget of 8; priority and overlap pass |
| `CameraRig.tsx` | `PerspectiveCamera`, `OrbitControls`, presets, fit, reserved rectangle, near and far update |
| `SectionPlane.tsx` | one clipping plane, axis and position, drag rectangle |
| `ScaleBar.tsx`, `Gizmo.tsx` | scale bar and orientation gizmo overlays |
| `Clock.tsx` | advances `time` during playback once per frame |
| `export/renderToTarget.ts`, `tile.ts`, `encodePng.ts`, `overlay.ts`, `exportPng.ts` | the export pipeline of AR-51 to AR-58 |

#### `src/ui/`

| File | Purpose |
|---|---|
| `TopBar.tsx`, `Search.tsx`, `ViewPresets.tsx`, `ThemeToggle.tsx` | top bar and its controls |
| `SystemsRail.tsx`, `SystemRow.tsx`, `RailPresets.tsx`, `XraySlider.tsx`, `SectionControl.tsx`, `Tree.tsx` | the rail |
| `TimelineBar.tsx`, `Track.tsx`, `Transport.tsx`, `Readout.tsx`, `StageCard.tsx` | the timeline bar |
| `InfoCard.tsx` | the info card |
| `ExportDialog.tsx`, `Settings.tsx`, `ShortcutSheet.tsx`, `About.tsx`, `Toast.tsx`, `FirstRunHint.tsx` | dialogs and transient UI |
| `PresentationOverlay.tsx`, `EmbedFooter.tsx` | the two mode-specific layers |
| `ErrorScreens.tsx` | data error card and WebGL unavailable screen |
| `primitives/Button.tsx`, `Badge.tsx`, `Slider.tsx`, `Switch.tsx`, `Sheet.tsx`, `Combobox.tsx` | the six local primitives (AR-02) |
| `hooks/useShortcuts.ts`, `useReducedMotion.ts`, `useBreakpoint.ts`, `useIdleCursor.ts` | UI hooks |

#### Other folders

| Path | Purpose |
|---|---|
| `src/main.tsx`, `src/App.tsx`, `src/styles.css` | React root, layout shell, Tailwind tokens |
| `scripts/validate-data.ts` | the D13 data checks; exits non-zero on the first failing rule set |
| `scripts/screenshot.ts` | drives Playwright over the 18 headline stages in lateral and dorsal views (D13) |
| `scripts/build-attribution.ts` | writes `public/ATTRIBUTION.md` from the ZFIN version strings (D14) |
| `tests/unit/*.test.ts` | vitest: schema, body model, builders, interpolation, time axis, URL round trip, queue |
| `tests/e2e/*.spec.ts` | Playwright: screenshots, selection, URL, export size, WebGL probe |
| `public/favicon.svg`, `public/ATTRIBUTION.md`, `public/fallback-24hpf.png` | static assets; the fallback PNG is a build output of `scripts/screenshot.ts` |

### Data flow

The pipeline has one direction:

```
src/data/*.json --> parseAtlasData (zod) --> store.data (AtlasData)
store.time (t) --> bodyModel(t) --> BodyFrame
(record, BodyFrame, t, level) --> buildStructure --> GeometryOut --> toBufferGeometry --> mesh.geometry
```

- **AR-07** `loadAtlasData()` runs once at startup, before the first render. A parse failure sets `dataError` and the app renders the error card of AR-66.
- **AR-08** `bodyModel(t)` is memoised on `t` rounded to 0.01 hpf. One frame serves every builder in one rebuild pass.
- **AR-09** A structure builder is a pure function of `(record, frame, t, level)`. It never reads the store and never touches a mesh.

#### How a time change propagates

1. A UI control, the `Clock`, or `applyUrl` calls `setTime(t)`. The action writes `time`, sets `tessellation` to `interactive`, and calls the R3F `invalidate()`.
2. `useRebuildDriver` subscribes to `time` outside React render. On change it computes the body frame, lists the present structures with `presenceAt`, and calls `queue.replace(jobs)`. It restarts a 120 ms settle timer.
3. A `useFrame` callback at priority -1 runs before the render pass. It calls `queue.drain(8, performance.now)`. `drain` pops jobs in priority order until the budget is spent or the queue is empty. Each job calls `buildStructure` and then applies the result.
4. Apply: when the new vertex and index counts equal the current counts, `writeInto` copies into the existing attribute arrays and sets `needsUpdate`. Otherwise the driver assigns a new `BufferGeometry` and disposes the old one.
5. When the queue is not empty after the slice, the driver calls `invalidate()` again. The next frame continues the drain.
6. When the settle timer fires, the driver sets `tessellation` to `final`, enqueues every present structure again, and invalidates. The same loop drains the final jobs in slices of 8 ms.

- **AR-10** The rebuild budget per frame is 8 ms of wall time (D3). `drain` checks the clock after every job, so one long job can overrun by at most one job.
- **AR-11** A final rebuild starts 120 ms after the last time change (D3). During playback the timer never fires, so playback runs at interactive tessellation. A pause triggers the final rebuild.
- **AR-12** A new time replaces the queue. It never appends. A job carries the time it was made for, and a mesh keeps its previous geometry until its job runs. The lag of any structure is at most the drain time of one queue.
- **AR-13** Priority order: body first, then the selected and hovered structures, then the remaining structures by descending bounding-box volume from their last build. Structures outside the camera frustum at the last frame come last.
- **AR-14** Fade in, fade out, and the 300 ms boundary transition of D3 are per-frame material and scale updates in `StructureMesh`. They never enqueue a rebuild.
- **AR-15** No `useFrame` callback calls `setState`. Callbacks read the store with `getState()` (research 06, section 2). The one writer inside the frame loop is `Clock`, which calls `setTime` once per frame while `playing` is true.
- **AR-16** The `Canvas` runs with `frameloop="demand"`. Every store action that changes something visible calls `invalidate()`. `OrbitControls` invalidates on its `change` event. An idle viewer renders nothing.

### Store shape

- **AR-17** One zustand store holds all shared state. Slices split the file, not the store. Components select single fields, never the whole state.
- **AR-18** Actions are the only writers. A component never calls `setState` with a raw object.
- **AR-19** The URL subset of the store is exactly the fields that `toUrl()` reads: `time`, `selection`, `viewPreset`, `camera`, `hiddenSystems`, `hiddenStructures`, `xray`, `section`, `isolate`, `theme`, `units`, `snap`, `palette`, `labels`, `embed`, `presentation`, `kit`. `hover`, `playing`, `speed`, and the runtime fields never reach the URL.
- **AR-20** `selection` holds at most 12 ids (research 07, UX-IN-04). `select` with `add` beyond 12 drops the oldest id.

```ts
// src/state/store.ts
export type SystemId = string            // one of the 15 ids in systems.json (D5)
export type ZfaId = `ZFA:${string}`
export type ViewPreset = 'lateral' | 'dorsal' | 'ventral' | 'anterior' | 'posterior' | 'threeQuarter' | 'free'
export type SectionAxis = 'sagittal' | 'coronal' | 'transverse'
export type Units = 'hpf' | 'dpf' | 'auto'
export type Theme = 'dark' | 'light'
export type Palette = 'std' | 'oi'
export type Quality = 'standard' | 'presentation'
export type Speed = 0.5 | 1 | 2 | 4 | 8
export type Tessellation = 'interactive' | 'final'
export type WebglStatus = 'probing' | 'ok' | 'lost' | 'unavailable'

export interface CameraPose { position: [number, number, number]; target: [number, number, number] }
export interface SectionState { axis: SectionAxis | null; position: number; flip: boolean }  // position in [-1, 1]
export interface Bookmark { name: string; t: number; cam: CameraPose; sel: ZfaId[]; hide: string[]; xr: number; sec: SectionState; iso: boolean; labels: boolean; notes: string }
export interface SlideKit { id: string; name: string; bookmarks: Bookmark[]; index: number }

export interface AtlasState {
  data: AtlasData | null; dataError: AtlasParseError | null
  time: number; playing: boolean; speed: Speed; snap: boolean; units: Units
  selection: ZfaId[]; hover: ZfaId | null; pinnedLabels: ZfaId[]
  hiddenSystems: SystemId[]; hiddenStructures: ZfaId[]; isolate: boolean
  xray: number; section: SectionState
  viewPreset: ViewPreset; camera: CameraPose | null; followGrowth: boolean; keepDorsalUp: boolean; fitRequest: number
  theme: Theme; palette: Palette; labels: boolean; quality: Quality; reducedMotion: boolean
  presentation: boolean; embed: boolean; kit: SlideKit | null; sex: 'female' | 'male'
  tessellation: Tessellation; rebuildPending: number; webgl: WebglStatus; warnings: string[]
}

export interface AtlasActions {
  loadData(): void
  setTime(t: number): void; stepStage(dir: -1 | 1): void; stepPeriod(dir: -1 | 1): void
  play(): void; pause(): void; setSpeed(s: Speed): void; toggleSnap(): void; cycleUnits(): void
  select(id: ZfaId | null, opts?: { add?: boolean }): void; clearSelection(): void
  setHover(id: ZfaId | null): void; togglePinnedLabel(id: ZfaId): void
  setSystemHidden(id: SystemId, hidden: boolean): void; soloSystem(id: SystemId): void
  applyRailPreset(name: 'all' | 'none' | 'embryo' | 'organs' | 'skeleton'): void
  setStructureHidden(id: ZfaId, hidden: boolean): void; setIsolate(on: boolean): void
  setXray(value: number): void; toggleXray(): void; setSection(patch: Partial<SectionState>): void
  setViewPreset(p: ViewPreset): void; setCameraPose(pose: CameraPose): void; requestFit(): void
  resetView(all?: boolean): void; setFollowGrowth(on: boolean): void; setKeepDorsalUp(on: boolean): void
  setTheme(t: Theme): void; setPalette(p: Palette): void; setLabels(on: boolean): void; setQuality(q: Quality): void
  setPresentation(on: boolean): void; setEmbed(on: boolean): void; setSex(s: 'female' | 'male'): void
  loadKit(kit: SlideKit | null): void; addBookmark(name?: string): void; stepBookmark(dir: -1 | 1): void
  setTessellation(level: Tessellation): void; setRebuildPending(n: number): void; setWebgl(s: WebglStatus): void
  pushWarning(text: string): void; applyUrl(state: UrlState): void; toUrl(): UrlState
}

export type AtlasStore = AtlasState & AtlasActions
```

Defaults for the fields that the URL does not set:

| Field | Default |
|---|---|
| `time` | 24 hpf (research 07, UX-LY-12) |
| `speed` | 1 |
| `snap` | false; true on entry to presentation mode (research 07, UX-TL-20) |
| `units` | `auto` |
| `xray` | 25 |
| `section` | `{ axis: null, position: 0, flip: false }` |
| `viewPreset` | `lateral` (D4) |
| `followGrowth`, `keepDorsalUp` | true |
| `theme` | the stored choice, then `prefers-color-scheme` |
| `palette` | `std` |
| `labels` | false; presentation mode also starts with false (research 07, UX-VS-21) |
| `quality` | `standard` |
| `sex` | `female` |

### Rendering

#### Canvas

- **AR-21** `Viewer.tsx` creates the `Canvas` with `gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }}`, `dpr={[1, 2]}`, and `frameloop="demand"`. `onCreated` sets `gl.toneMapping = NeutralToneMapping`, `gl.toneMappingExposure = 1.0`, `gl.outputColorSpace = SRGBColorSpace`, and `gl.localClippingEnabled = true`.
- **AR-22** Tone mapping is `NeutralToneMapping`, never ACES. ACES shifts hue, and the legend swatch must match the organ colour (research 06, section 5).
- **AR-23** The environment is `RoomEnvironment` from `three/addons/environments/RoomEnvironment.js`, baked once through `PMREMGenerator`, at `envMapIntensity` 0.3 (research 07, UX-VS-13). It needs no download and no licence check. A local HDR under `public/hdri/` is a later option once its licence is verified (D14).
- **AR-24** Lights follow research 07, UX-VS-14. One `HemisphereLight` uses sky `--bg` lightened and ground `--bg`. One key `DirectionalLight` at intensity 2.0 comes from anterodorsal-left. One rim `DirectionalLight` at 1.2 comes from posterior-right. The three lights are children of the camera, so the lateral view is lit the same after an orbit.
- **AR-25** The scene background is the theme `--bg` as a solid colour. There is no ground plane (research 07, UX-VS-18).

#### Materials

- **AR-26** Every structure uses `MeshStandardMaterial` with `roughness` 0.55, `metalness` 0.05, `flatShading` false (research 07, UX-VS-13; research 01, section 4.6, uses 0.53 and 0.08). Closed primitives use `FrontSide`. Sheets (fins, fin fold, periderm) use `DoubleSide`.
- **AR-27** Each structure owns one material instance, cloned from its system base material at mount and cached by structure id. Per-structure opacity, emissive, and clipping state need per-material uniforms. The material count adds no draw calls.
- **AR-28** The base colour is the system hex for the active theme and palette, stepped in lightness by tree depth (D10; research 07, UX-VS-07). The exception list of D10 overrides the hue for arteries, veins, otoliths, retinal pigment epithelium, melanophores, xanthophores, iridophores, cartilage, bone, yolk, lens, and chorion.
- **AR-29** `MeshPhysicalMaterial` with `transmission` is used for the lens and the chorion only, and only when `quality` is `presentation`. At `standard` quality both use the transparent path of AR-30 (research 06, section 5).

#### Transparency and x-ray

- **AR-30** A transparent structure sets `transparent = true`, `depthWrite = false`, `side = FrontSide`, and `renderOrder = 1000 - depth`, where `depth` is its depth in the part-of tree. An inner shell therefore draws before an outer shell, and the outer shell blends over it (research 06, section 5).
- **AR-31** An opaque structure keeps `transparent = false`, `depthWrite = true`, `renderOrder = 0`. During a fade the material is transparent; after the fade the driver restores the opaque state.
- **AR-32** The x-ray value maps 0 to 100 onto skin opacity 0.60 to 0.00. Above 50 it also maps onto muscular opacity 1.0 to 0.25 (research 07, UX-VS-16). The default 25 gives skin opacity 0.45. The chorion opacity is 0.10 (UX-VS-15). A structure at opacity 0 sets `visible = false`.
- **AR-33** Isolate sets every non-selected structure to opacity 0.06 in `--text-muted`, `depthWrite = false`, `renderOrder = 500` (research 07, section 4.3).
- **AR-34** Picking uses two layers. Layer 0 renders. Layer 1 is the raycast layer. A mesh enables layer 1 only when its opacity is 0.3 or more and it is not hidden. A click passes through a ghosted body to the organ behind it (research 06, section 5). `stopPropagation()` on the first hit stops the click from selecting the stack.

#### Selection, hover, labels

- **AR-35** Selection draws a drei `Outlines` child on each selected mesh: `screenspace` true, `thickness` 2, colour `--focus`. The base colour never changes on selection (D10). When `quality` is `presentation`, `PostOutline.tsx` mounts `EffectComposer` with `multisampling={4}`, `Outline`, and `SMAA`, and unmounts the drei `Outlines`. The `Outline` pass uses `edgeStrength` 4, `visibleEdgeColor` `--focus`, `hiddenEdgeColor` `--focus` at 50 percent, and `xRay` true.
- **AR-36** Hover sets `emissive` to the base colour at 8 percent and the cursor to `pointer` through drei `useCursor` (research 07, section 4.3). Hover starts after 80 ms and is off on touch (UX-IN-01). Hover never uses a postprocessing pass.
- **AR-37** Labels are drei `Html` elements. At most 8 show at once. Priority: selected, hovered, pinned, then the largest visible structures by projected area. A greedy pass hides a label whose box overlaps a higher-priority label (research 07, UX-VS-20). Labels hide while the camera moves and return 150 ms after it stops. Each label has a leader line of 16 to 32 px and a 4 px anchor dot in the structure colour (UX-VS-19). `Html` labels are DOM nodes; the export draws them onto the overlay canvas of AR-56.

#### Camera

- **AR-38** The camera is a `PerspectiveCamera` with a vertical field of view of 34 degrees (research 01, section 2.2). `near` is 0.01 times the current body length and `far` is 50 times it. Both update when the body length changes.
- **AR-39** Controls are drei `OrbitControls` with `enableDamping` true, `dampingFactor` 0.08, `zoomToCursor` true, `minDistance` 0.4 and `maxDistance` 8 times the body length (research 07, UX-IN-10, UX-IN-11). `keepDorsalUp` clamps the polar angle to 0.05 pi and 0.95 pi (UX-IN-13). A `change` handler clamps the pan target to 1.5 times the body bounding box (UX-IN-08). The controls `end` event writes `camera` to the store.
- **AR-40** View presets use the D4 axes (+x posterior, +y dorsal, +z left).

| Preset | Camera direction from the target | Camera up | Note |
|---|---|---|---|
| lateral | +z | +y | left side; snout on screen left (D4 default) |
| dorsal | +y | -z | snout on screen left |
| ventral | -y | +z | snout on screen left |
| anterior | -x | +y | |
| posterior | +x | +y | |
| threeQuarter | (-0.45, 0.35, 0.82) normalised | +y | research 07 UX-IN-14 vector with x negated for the D4 axes |

A preset change slerps the camera over 500 ms with the research 07 easing, or cuts under reduced motion. Any manual orbit sets `viewPreset` to `free`.

- **AR-41** Fit-to-bounds computes the bounding sphere of the body frame plus the fins, and sets the distance to `radius / sin(fov / 2)` times 1.1. Fit runs on first load, on `F`, on a preset change, and on a stage change while `followGrowth` is true (D4; research 07, UX-IN-12). A stage change is a change of ZFS stage index, not every hpf. The distance change during follow is damped over 200 ms. Fit never runs on a scrub inside one stage.
- **AR-42** Fit accepts a reserved rectangle in CSS px (`top`, `right`, `bottom`, `left`), the idea of research 01, section 2.2. On desktop the panels are docked and the rectangle is zero. On tablet and phone the open sheet reserves its width or height. Presentation mode reserves the 320 px floating info card while a selection exists. `CameraRig` applies the rectangle with `camera.setViewOffset` and clears it with `clearViewOffset` when the rectangle is zero.

#### Section plane

- **AR-43** One `Plane` in world space cuts the model. `SectionPlane.tsx` writes it into `clippingPlanes` of every structure material and removes it when `axis` is `null`. One axis is active at a time (research 07, UX-IN-18). Sagittal uses the ±z normal, coronal ±y, transverse ±x. `position` in [-1, 1] maps across the body bounding box on that axis. `flip` negates the normal.
- **AR-44** While the section is active, clipped materials switch to `DoubleSide`. A small `onBeforeCompile` patch darkens back faces by 20 L*, so the cut reads as a filled surface. A stencil cap pass is a later feature. During a drag, a translucent rectangle in `--accent` at 12 percent shows the plane and hides 300 ms after release.

### URL state

- **AR-45** The schema below is the full query parameter set. Every parameter is optional. An absent parameter means the default.

```ts
// src/core/url/urlState.ts
import { z } from 'zod'
const flag = z.coerce.number().int().min(0).max(1)
export const UrlState = z.object({
  t:       z.coerce.number().min(0).max(4320).default(24),                   // hpf (D1)
  sel:     z.string().regex(/^\d{7}(,\d{7}){0,11}$/).optional(),            // ZFA numbers, no prefix, max 12
  v:       z.enum(['lat', 'dor', 'ven', 'ant', 'pos', 'tq']).default('lat'), // D4 presets; 'pos' added for posterior
  cam:     z.string().regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){5}$/).optional(), // position xyz, target xyz in mm; implies a free camera
  hide:    z.string().regex(/^([a-z_]+|\d{7})(,([a-z_]+|\d{7}))*$/).optional(), // system ids (D5) or ZFA numbers
  xr:      z.coerce.number().int().min(0).max(100).default(25),
  sec:     z.string().regex(/^(sag|cor|tra):-?(0(\.\d+)?|1(\.0+)?)(:f)?$/).optional(), // axis:position[:f]
  iso:     flag.default(0),
  theme:   z.enum(['dark', 'light']).optional(),                             // absent: stored choice, then prefers-color-scheme
  u:       z.enum(['hpf', 'dpf', 'auto']).default('auto'),
  snap:    flag.optional(),                                                  // absent: 1 in presentation mode, else 0
  pal:     z.enum(['std', 'oi']).default('std'),
  labels:  flag.optional(),                                                  // absent: 0
  embed:   flag.default(0),
  present: flag.default(0),
  kit:     z.string().max(2048).optional(),                                  // base64url kit or a localStorage kit id
})
export type UrlState = z.infer<typeof UrlState>
export function parseUrl(search: string): { state: UrlState; warnings: string[] }
export function serializeUrl(state: UrlState): string   // omits defaults; numbers to 3 decimals
```

- **AR-46** `parseUrl` parses each key on its own with `safeParse`. A key that fails falls back to its default and adds one warning. One bad parameter never discards the others (research 07, UX-ST-09).
- **AR-47** `sel` ids that are not in `structures.json` are dropped with a warning. `hide` tokens are checked against the system ids and structure ids; unknown tokens are dropped with a warning. A `cam` value overrides `v` and sets `viewPreset` to `free`.
- **AR-48** `urlSync.ts` writes the URL with `history.replaceState` at most every 300 ms during interaction and once when the interaction ends (research 07, UX-EX-08). It never calls `pushState`. In embed mode it does not write at all.
- **AR-49** `serializeUrl` omits every parameter at its default. `cam` appears only when the preset is `free`. `theme` appears only when "Copy link" runs (research 07, UX-VS-02). The `t` value is rounded to 2 decimals.
- **AR-50** `parseUrl` runs once before the first render. `applyUrl` writes the result into the store, and the warnings surface as toasts after the first frame.

### Export pipeline

- **AR-51** Export renders into a `WebGLRenderTarget`, never from the on-screen buffer. `preserveDrawingBuffer` stays false. The target uses `samples: 4`, `UnsignedByteType`, and `SRGBColorSpace`.
- **AR-52** Output size is the canvas CSS size times the scale (1, 2, or 4), independent of the device pixel ratio. The longest edge is capped at 8192 px, and the dialog states the resulting size (research 07, UX-EX-02).
- **AR-53** Tiling: the tile edge is `min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096)`. For each tile, `camera.setViewOffset(W, H, x, y, tw, th)` sets the sub-frustum, the scene renders into the target, and `renderer.readRenderTargetPixelsAsync` reads the tile. Rows are flipped, since WebGL rows start at the bottom, and copied into one `ImageData` of W by H. After the last tile the rig restores the fit view offset of AR-42 or calls `clearViewOffset`.
- **AR-54** Before the first tile, export pauses playback, clears hover, and hides the drag rectangle of AR-44. It then waits for the rebuild queue to drain at `final` tessellation. After the last tile it restores playback state.
- **AR-55** Transparent export sets `scene.background = null` and the clear alpha to 0. The renderer keeps `premultipliedAlpha` at its default of true. The encoder therefore un-premultiplies pixels with alpha between 0 and 1 before it writes the PNG (research 07, UX-EX-03). Opaque export clears to the theme `--bg`.
- **AR-56** Overlays (labels, scale bar, readout, legend) are drawn onto a 2D `OffscreenCanvas` of W by H. Text sizes and line widths use the theme tokens scaled by the export scale. The overlay is composited over the WebGL image. The label positions come from the same layout pass as AR-37, projected at the export size.
- **AR-57** Encoding uses `OffscreenCanvas.convertToBlob({ type: 'image/png' })`. The file name is `zfatlas_<time>_<view>_<selection-or-all>_<scale>x.png` (research 07, UX-EX-04). The time uses the readout format without spaces, for example `zfatlas_24hpf_lateral_heart_2x.png`. "Copy image" uses the Clipboard API with `image/png` where available; otherwise the button is hidden.
- **AR-58** Export never allocates more than one tile target at a time. At a 4096 px tile, the MSAA target and its resolve hold 4096 x 4096 x 4 bytes each. The peak transient GPU memory is therefore about 134 MB. The target is disposed after the last tile.

### Presentation mode and embed mode

- **AR-59** Presentation mode (`present=1`, the Present button, or `P`) hides the top bar, the rail, and the docked info card. A 320 px floating info card sits at the top right while a selection exists. The timeline bar shrinks to a 64 px strip that auto-hides, and the readout chip uses 20 px text (research 07, sections 2.5 and 3.9). The cursor hides after 2 s of idle. On entry it sets `snap` true, `labels` false, and "Jump to appearance on select" on. `Escape` exits it last in the Escape order. Fullscreen uses the Fullscreen API only from a user gesture, never from the URL alone.
- **AR-60** In presentation mode with a kit loaded, `ArrowLeft` and `ArrowRight` step between bookmarks; `Shift+Arrow` steps stages. A bookmark step animates `time` over 600 ms and the camera over 500 ms, or cuts under reduced motion (research 07, UX-EX-13 and UX-EX-14). Auto-rotate is available at `autoRotateSpeed` 0.5 and stops on any input.
- **AR-61** Embed mode (`embed=1`) hides the top bar and the rail. It keeps the timeline bar at its 96 px tablet height and a floating info card. A 28 px footer at the bottom right shows "Open in Zebrafish Atlas" and the ZFIN attribution (research 07, UX-EX-10). The link carries the full serialised state. The page sets `touch-action: pan-y` on everything except the canvas and the track.
- **AR-62** Embed mode accepts every other URL parameter. It never writes `localStorage`, never writes the URL, and never shows the first-run hint (research 07, UX-EX-11). Keyboard shortcuts work only while the frame has focus.

### Performance budget

The budgets below come from research 06, section 8, and from arithmetic on the tessellation table. The derived numbers are estimates until the hardening phase (D15, step 4) measures them on the presenter's laptop and records them here.

| Kind | Interactive rows x radial | Final rows x radial | Triangles final |
|---|---|---|---|
| body tube | 32 x 16 | 64 x 32 | 4,096 |
| ellipsoid, superellipsoid | 12 x 8 | 24 x 16 | 768 |
| tube | 24 x 8 | 48 x 12 | 1,152 |
| lathe | 16 x 12 | 32 x 24 | 1,536 |
| sheet (two layers plus rim) | 12 x 6 | 24 x 8 | 832 |
| shell | 16 x 16 | 32 x 32 | 2,048 |
| segmentArray template | 6 x 6 | 8 x 8 | 128 per instance |

Interactive counts halve each dimension, so an interactive mesh has about one quarter of the final triangles.

| Metric | Budget | Source |
|---|---|---|
| Frame time while scrubbing or playing | 16.7 ms: 8 ms rebuild (D3) plus 6 ms render plus headroom | research 06, section 8 |
| Frame time while settled | 0 ms; `frameloop="demand"` | research 06, section 8 |
| Frame time while orbiting | 16.7 ms with no rebuild work | research 06, section 8 |
| Draw calls per frame | 200 | research 06, section 8 |
| Triangles on screen, interactive | 60,000 | derived: final divided by 4 |
| Triangles on screen, final | 200,000 | research 06, section 3, estimates 150,000 for 150 structures, plus outlines and helpers |
| Full final rebuild, all present structures | 24 ms, so 3 sliced frames | derived: research 06, section 4, measured 0.14 ms per 1,625 vertices for positions; normals cost the same; about 100,000 vertices |
| Full interactive rebuild | 8 ms, one frame | derived: one quarter of the vertices |
| Geometry memory, CPU plus GPU | 16 MB | derived: 100,000 vertices x 32 bytes x 2 levels x 2 copies |
| Time to first frame | 2 s on a laptop | research 06, section 8 |
| Initial JavaScript, gzip | 600 kB | budget; measured at build in the hardening phase |
| `structures.json` raw | 1 MB | budget for 220 records with keyframes |

- **AR-63** The hardening gate measures the p95 frame time over a 10 s scrub on the reference laptop. The build fails the gate when p95 exceeds 20 ms (research 06, section 8).
- **AR-64** drei `PerformanceMonitor` drives a fallback ladder. Each `onDecline` steps down one rung; `onIncline` after 2 s under budget steps up one rung.

| Rung | Fallback |
|---|---|
| 1 | device pixel ratio 2 to 1 during playback and scrubbing |
| 2 | hold interactive tessellation; skip the final rebuild of AR-11 |
| 3 | hide labels until the frame time recovers |
| 4 | postprocessing outline off; then drei `Outlines` off while the camera or time moves |
| 5 | interactive tessellation drops to one quarter of the final counts per dimension |

- **AR-65** A dev-only overlay shows `renderer.info.render.calls`, `triangles`, the rebuild queue length, and the last slice time. It mounts when `import.meta.env.DEV` is true and `?perf=1` is present.

### Error handling

- **AR-66** Data parse failure: `parseAtlasData` returns `AtlasParseError { file, issues: { path, message }[] }`. `ErrorScreens.tsx` renders a centred card "Could not load the atlas data" with the file name and the first three issues. The top bar stays, so the About sheet stays reachable (research 07, UX-ST-08). Because the data is bundled, a parse failure is a build defect; `npm run validate` catches it before build (D13).
- **AR-67** WebGL unavailable: before the `Canvas` mounts, `Viewer.tsx` probes `document.createElement('canvas').getContext('webgl2')`. three 0.185 needs WebGL 2. On failure the app renders `public/fallback-24hpf.png` (the lateral view at 24 hpf from the screenshot script), the message "This browser cannot run the 3D viewer. Try a current version of Chrome, Firefox or Safari.", and links to ZFIN and the stage table. The timeline bar is hidden (research 07, UX-ST-06).
- **AR-68** Context lost: the `webglcontextlost` handler calls `preventDefault`, sets `webgl` to `lost`, pauses playback, and shows a toast "The 3D view paused. Restoring…". On `webglcontextrestored` the driver enqueues every present structure at `final` tessellation and invalidates. A "Reload viewer" button appears after 5 s (research 07, UX-ST-07).
- **AR-69** Missing structure in the URL: an unknown `sel` id falls back to the default for that field. The toast reads "Structure ZFA:9999999 is not in this atlas". A `t` above 4320 clamps with the toast "Time clamped to 180 dpf" (research 07, UX-ST-09). A selected structure that is not present at `t` keeps the info card open with the "Jump to" button (D1; research 07, UX-IN-23).
- **AR-70** A structure record with `geometry: null` never enters the rebuild queue. Selecting it opens the info card with the note of research 07, UX-ST-03.
- **AR-71** A builder that throws or returns a non-finite value at runtime is caught per job. The driver hides that structure, logs one console error per structure id, and continues the drain. The D13 validation script makes this path unreachable in a passing build.

### Conflicts with the decision record

None found. Three points where this section extends the research files, without contradicting a decision:

1. Research 07 lists five view presets in `v`. D4 lists six. The `v` enum adds `pos` for posterior.
2. Research 07 encodes `hide` as palette slots (`S07`). D5 makes `systems.json` the owner of system ids, so `hide` carries D5 ids and, for hidden structures, 7-digit ZFA numbers.
3. Research 07, UX-LY-12, opens on the three-quarter preset. D4 names lateral as the default, so `v` defaults to `lat`.
