# 01. Human Atlas reference implementation

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

This document describes the human-atlas code base that the zebrafish-3D-atlas project uses as its reference. It records what the code does, with file and line references. It then proposes what to borrow, what to drop, and how each human-atlas concept maps to a zebrafish concept.

## Provenance and method

| Item | Value | Source |
|---|---|---|
| Upstream repository | https://github.com/ashemag/human-atlas | `git remote -v` in the clone |
| Commit read | `1c38bf35c254a891200d3cedecfd57abebe83d8d`, 2026-09-06 19:35 -0400, "Restore Human Atlas title" | `git log -1` in the clone |
| Clone depth | 1 commit | `git rev-list --count HEAD` |
| Live demo | https://human-atlas-seven.vercel.app | `README.md:5` |
| Code license | MIT, copyright 2026 ashemag | `LICENSE:1-3` |
| Data license | BodyParts3D 4.0, CC BY 4.0 | `public/ATTRIBUTION.md:3-8` |

The application code is small. The 16 source files under `app/`, `web/`, `scripts/`, plus `package.json`, `vite.config.ts`, `README.md` and `public/ATTRIBUTION.md` total 677 lines (`wc -l`). The lines are long. `app/page.tsx` has a 1985-character line, `app/scene.tsx` a 1078-character line, and `app/globals.css` an 8533-character line (`awk '{print length($0)}'`). I read every one of these files in full. I also read `hooks/use-mobile.ts`, `lib/utils.ts`, and the import headers of the six `components/ui` files that `app/page.tsx` imports.

Numbers marked "(measured)" come from a `python3` pass over `public/models/atlas.json` in the clone. I did not run `npm ci`, the dev server, or the validation scripts. Statements about runtime behavior come from reading the code.

## 1. Tech stack and build

### 1.1 Dependencies that matter

Versions come from `package-lock.json` (resolved) unless noted.

| Package | Version | Where it is used | Verdict |
|---|---|---|---|
| `react`, `react-dom` | 19.2.6 | `web/main.tsx`, `app/page.tsx`, `app/scene.tsx` | Core |
| `three` | 0.159.0 | `app/scene.tsx:2-5` | Core |
| `vite` | 8.0.13 | `vite.config.ts` | Core |
| `@vitejs/plugin-react` | 6.0.2 | `vite.config.ts:3` | Core |
| `@base-ui/react` | 1.7.0 | `components/ui/button.tsx:1`, `slider.tsx:1`, `switch.tsx:3`, `sheet.tsx:4`, `combobox.tsx:4`, `badge.tsx:1-2` | Core for the 6 UI primitives in use |
| `tailwindcss`, `@tailwindcss/postcss` | 4.2.1 | `app/globals.css:1`, `vite.config.ts:4` | Needed because `components/ui/*` use Tailwind utility classes. The app's own CSS is hand-written classes. |
| `tw-animate-css` | 1.4.0 | `app/globals.css:2` | Used by sheet open and close animations in `components/ui/sheet.tsx` (unverified) |
| `lucide-react` | 1.31.0 | `app/page.tsx:4` (11 icons) | Core |
| `class-variance-authority`, `clsx`, `tailwind-merge` | 0.7.1, 2.1.1, 3.6.0 | `lib/utils.ts`, `components/ui/*` | Needed by the UI primitives |
| `typescript` | 5.9.3 | `npm run check` | Core |
| `meshoptimizer` | 1.2.0 | `scripts/optimize-anatomy.mjs:2` | Build pipeline only |

### 1.2 Dependencies that are incidental

A grep for `vinext|openai|cloudflare|wrangler|recharts|embla|date-fns|input-otp|cmdk|react-day-picker|react-resizable-panels|react-server-dom` over `app/`, `web/`, `vite.config.ts` and `scripts/` returns no hits.

| Package | Why it is present | Evidence |
|---|---|---|
| `vinext` 1.0.0-beta.5, `@vitejs/plugin-rsc`, `react-server-dom-webpack` | Leftover from a Next.js-style scaffold | `tsconfig.json:19` lists `vinext/types`; `.gitignore:15-16` lists `/.next/` and `/.vinext/`; `tsconfig.json:32-35` includes `next-env.d.ts` and `.next/types` |
| `@cloudflare/vite-plugin`, `@cloudflare/workers-types`, `wrangler` | Same scaffold | `tsconfig.json:18`; `.gitignore:36` lists `/.wrangler/` |
| `@openai/sites-vite-plugin` 0.2.0 | Same scaffold | Not referenced in any source file |
| `shadcn` 4.18.0, `@shadcn/react` 0.3.0 | CLI and registry for generating `components/ui` | Not imported at runtime |
| `recharts`, `embla-carousel-react`, `date-fns`, `input-otp`, `cmdk`, `react-day-picker`, `react-resizable-panels` | Required by `components/ui` files that the app never imports | Only 6 of 60 files in `components/ui/` are imported by `app/` (`grep -rhoE "@/components/ui/[a-z-]+" app`) |
| `oxfmt`, `oxlint`, `oxlint-tsgolint` | Lint and format tools | No npm script calls them |

### 1.3 Build configuration

`vite.config.ts:6` holds the whole configuration on one line:

```ts
defineConfig({root:path('./web'),publicDir:path('./public'),plugins:[react()],resolve:{alias:{'@':path('./')}},css:{postcss:{plugins:[tailwindcss()]}},server:{watch:{usePolling:true}},build:{outDir:path('./dist'),emptyOutDir:true}})
```

| Setting | Value | Source |
|---|---|---|
| Vite root | `./web` | `vite.config.ts:6` |
| Public directory | `./public` (serves `/models/*.bin`, `/favicon.svg`) | `vite.config.ts:6` |
| Path alias | `@` maps to the repository root | `vite.config.ts:6`, `tsconfig.json:25-29` |
| Output | `./dist` | `vite.config.ts:6` |
| Dev server | `vite --host 0.0.0.0 --port 3016` | `package.json:9` |
| Type check | `tsc --noEmit` | `package.json:12` |
| Node | `>=22.13.0` | `package.json:6` |
| Deploy | Vercel, framework `vite`, `npm ci` then `npm run build` | `vercel.json:1` |

The entry chain is `web/index.html:1` (`<div id="root">` and `<script type="module" src="/main.tsx">`), then `web/main.tsx:1-4`, which renders `Home` from `../app/page` and imports `../app/globals.css`. There is no router and no server code.

## 2. Application structure

### 2.1 `app/page.tsx` (52 lines)

`Home` owns all UI state and passes a `SceneState` object down to `AnatomyScene`.

| State | Type | Purpose | Line |
|---|---|---|---|
| `atlas` | `Atlas \| null` | Parsed `/models/atlas.json` | 16-17 |
| `state` | `SceneState` | Explode amount, visible systems, selection, isolate, view, rotate, reset counter | 13, 16 |
| `progress`, `error` | number, string | Chunk load progress and error text | 16 |
| `panel` | `'layers' \| 'search' \| null` | Which floating panel is open | 16 |
| `details`, `about` | boolean | Detail sheet and about sheet open | 16 |
| `query`, `chosen` | string, `Concept \| null` | Search text and the concept shown in the detail sheet | 16 |

Derived values:

- `parts` is a `Map<id, Part>` (line 19).
- `counts` is the number of parts per system (line 20). Systems with zero parts are hidden from the list (line 21).
- `visibleCount` applies the visibility rule: when `isolate` is on, only selected parts are visible; otherwise a part is visible when its system is on or the part is selected (line 23).
- `results` runs the search. With an empty query it shows eight fixed concepts: heart, brain, liver, stomach, spleen, pancreas, urinary bladder, trachea. With a query it does a case-insensitive substring match on `name` or `id`, sorts by name length, and keeps 80 results (line 24).

Actions:

- `choose(concept)` selects all `concept.elements`, turns isolate and rotate off, opens details, closes the panel (line 25).
- `choosePart(id)` builds a one-element concept from a part and selects it (line 27). The scene calls this on tap.
- `toggle(systemId)` flips one system and clears the selection (line 28).
- `reset()` restores the initial state and bumps `reset`, which the scene reads as a camera refit request (line 29).
- Keyboard: `/` opens the search panel when focus is outside an input (line 18).
- WebMCP: `registerAtlasTools(atlas, c => flushSync(() => choose(c)))` runs once the atlas loads (line 26).

Render tree (lines 31-51), in DOM order:

| Element | Class | Content |
|---|---|---|
| `<main>` | `studio` | Positioning root, `height:100dvh` |
| `<AnatomyScene>` | `scene` | Three.js canvas |
| `<div>` | `vignette` | Radial gradient overlay, pointer-events none |
| `<header>` | `identity` | Eyebrow "INTERACTIVE ANATOMY", `<h1>Human Atlas</h1>` with badge "3D", piece count and source |
| `<nav>` | `top-actions` | "Find a structure" button with `<kbd>/</kbd>`, info button |
| `<section>` | `layers-panel glass` | Systems heading, presets All / Skeleton / Organs, system rows, footer with visible count and "Hide all" |
| `<section>` | `search-panel glass` | Base UI `Combobox` with results list, hint text |
| `<nav>` | `view-controls glass` | Buttons ¾ / F / S / B, auto-rotate, reset |
| `<div>` | `scene-caption` | Caption text between two hairlines |
| `<div>` | `bottom-dock glass` | Mobile "Systems" button, explode slider 0-100 %, reset |
| `<footer>` | `studio-footer` | Gesture hints, "Source & credits" |
| `<div>` | `loading glass` | Progress bar while `progress < 100` |
| `<Sheet>` | `detail-sheet glass` | Structure detail panel, non-modal |
| `<Sheet>` | `about-sheet glass` | Source and scope text |

Presets are hard-coded lists of system ids (line 38):

```tsx
onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['skeletal']}))}>Skeleton</Button>
... visible:['cardiac','respiratory','digestive','urinary','endocrine','reproductive']}))}>Organs</Button>
```

Clicking a system name shows only that system; the switch beside it toggles the system (line 39). The slider writes `explode` in 0-1 and forces the `front` view above 80 % (line 45). View buttons other than `front` are disabled above 80 % explode, and auto-rotate is disabled at or above 40 % (line 43).

### 2.2 `app/scene.tsx` rendering pipeline (134 lines)

`AnatomyScene` is one `useEffect` keyed on `atlas` (line 14, 132). Props arrive through refs so the effect never re-runs on state change: `latest.current=state; select.current=onSelect` (line 13). The pipeline in execution order:

| Step | What happens | Line |
|---|---|---|
| Renderer | `WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})`; pixel ratio `min(devicePixelRatio, width<768 ? 1.5 : 2)`; clear color `#f2f3f3`; `SRGBColorSpace`; `ACESFilmicToneMapping` at exposure 1.12 | 19-20 |
| Camera and controls | `PerspectiveCamera(34, 1, .005, 100)` at `(1.4, 1.05, 3.6)`, target `(0, .85, 0)`; `OrbitControls` with damping .085, distance .07 to 40, max polar angle .96 π | 22-23 |
| Environment | `RoomEnvironment` through `PMREMGenerator`, then disposed | 24 |
| Lights | `HemisphereLight(0xffffff, 0xa7acb2, 1.05)`; key `DirectionalLight(0xfffaf4, 2.3)` at `(-2, 4, 3)`; rim `DirectionalLight(0xe9f0ff, 1.8)` at `(2, 2, -3)` | 25-27 |
| Stage props | Ground `CircleGeometry(30, 96)` color `0xd5d9dc`; platform `CylinderGeometry(.68, .7, .028, 100)` color `0xeeeeec`; two thin rings at radius .63 and .55 | 28-31 |
| Per-part state textures | `partTexture`: `Float32Array(width*4)`, `RGBAFormat`, `FloatType`, width = `ceilPowerOfTwo(parts.length)`, height 1. RGB = translation offset, A = visible. `selectionTexture`: `Uint8Array(width*4)`, R = selected | 32-33 |
| Markers | One `Points` object, one point per part, round point sprite via `gl_PointCoord` discard, shown only when exploded | 37-40 |
| Hover tooltip | A DOM `div.part-hover` with `role="tooltip"` | 41 |
| Materials | One `MeshStandardMaterial` per system, see below | 49-60 |
| Chunk loading | See below | 62-77 |
| Camera fit | `fit(view, extent)` | 78-84 |
| Resize | `ResizeObserver` updates aspect, pixel ratio, size, and refits | 85 |
| Picking | Pointer handlers, see below | 86-96 |
| Animation loop | `requestAnimationFrame`, dirty flag render | 97-129 |
| Cleanup | Disposes controls, geometries, materials, textures, renderer | 131 |

**Batched geometry.** Each system gets one material (line 60). Each loaded chunk merges all parts of the same system into one `BufferGeometry` with `mergeGeometries(gs, false)` and adds one `Mesh` per (system, chunk) with `frustumCulled=false` (line 74). With 15 systems and 15 chunks the scene holds at most 225 render meshes for 2,234 parts.

**Per-structure data textures.** Every vertex carries a `partIndex` attribute (line 71). `onBeforeCompile` (lines 51-57) injects a texture lookup into the standard material:

```glsl
vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);
vec4 state = texture2D(partState, stateUv);
transformed += state.xyz; partVisible = state.w;
partSelected = texture2D(selectionState, stateUv).r;
```

The fragment shader discards when `partVisible < 0.5` and tints selected parts: `diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75)` (lines 56-57). Visibility, translation and selection therefore change without touching geometry or draw calls. The CPU writes the two typed arrays and sets `needsUpdate` (line 115).

**Integumentary handling.** The body surface material is transparent at opacity .1 with `depthWrite:false` (line 50). Picking skips it whenever any solid part is visible (lines 92-93).

**Chunk loading.** `loadChunk(ci)` fetches the gzip URL when `DecompressionStream` exists, else the raw `.bin` (line 63). For every part in the chunk it creates typed-array views into one shared `ArrayBuffer`: `Float32Array` positions, `Int16Array` normals with `normalized=true`, `Uint32Array` indices (lines 67-69). Each part also gets an unrendered picker `Mesh` with `matrixAutoUpdate=false` (line 70). Three loaders run in parallel over a shared cursor (line 77). Progress is `loaded/chunks.length` (line 75).

**Picking.** `PointerTap` decides whether a pointer-up is a tap (line 91). A tap builds a `Raycaster`, then loops all pickers. It skips invisible parts, does a cheap `ray.intersectBox` on the translated bounds, then a full `intersectObject` (line 93). When the view is exploded past 45 % and the ray misses, it falls back to `findTarget`, a 2D nearest-projected-box search with radius 24 px for touch and 16 px for mouse (line 94). `findTarget` scores by distance to the projected box plus 2.5 % of the distance to the box center (lines 44-48). The 2D targets are rebuilt on every dirty render while exploded (line 127).

**Hover.** The tooltip appears only when `amount >= .5`, no button is pressed, and the pointer is not touch (line 88). At assembled state there is no hover, only tap.

**Exploded layout.** The loop damps `amount` toward `state.explode` with `T.MathUtils.damp(amount, s.explode, 8, dt)` (line 102). Below 45 % each part moves radially by system: `angle = systemIndex / SYSTEMS.length * 2π`, radius .48, plus a vertical stretch of 28 % about y = .85 (line 111). Above 45 % each part lerps from that radial position to a packed cell (line 112). `createExplosionLayout` in `app/explosion-layout.ts` performs a shelf packing: it sorts visible parts by projected height, fills rows up to a target width derived from total area and aspect, and centers the result (lines 5-13). The layout key includes visible ids and aspect, so it recomputes only when the visible set or aspect changes (lines 106-107).

**Camera fit.** `fit(view, extent)` picks a direction per view: front `(0, .02, 1)`, back `(0, .02, -1)`, side `(1, .02, 0)`, three-quarter `(.35, .06, 1)` (line 82). Distance lerps between a normal distance (4 on desktop) and a distance that frames the packed layout after reserving 270 px of height on desktop and 350 px on mobile for panels (lines 79-81).

**Isolate.** When `isolate` is on, the loop unions the bounds of selected parts, then calls `camera.setViewOffset` so the structure is centered in the screen area left free by the header, dock, and detail sheet (lines 121-122). On desktop with the inspector open the free area excludes 370 px on the right and 285 px on the left above 1100 px width. On mobile it measures the live `.detail-sheet` and `.identity` rectangles. When isolate turns off it calls `clearViewOffset` (line 123).

**Control modes.** Rotate below 80 % explode, pan above (line 126). Ground and platform hide when exploded past 50 % or isolated. Markers show above 75 %. Auto-rotate runs at speed .65 and only below 40 % (line 126).

**Dirty-flag rendering.** The loop renders only when `dirty` is true (line 127). Controls set `dirty` on change (line 23). State changes, explode motion, and auto-rotate set it. The GPU idles when nothing moves.

### 2.3 `app/pointer-tap.ts` (21 lines)

`PointerTap` tracks active pointers in a `Map`. The rules:

| Event | Effect | Line |
|---|---|---|
| `down` with no other pointer | Clears `blocked`, records start and threshold | 5-8 |
| `down` with another pointer active | Sets `blocked` (pinch or two-finger gesture) | 8 |
| `move` beyond threshold | Sets `blocked` (drag) | 10-13 |
| `up` | Returns `true` only if this is the sole pointer and nothing blocked | 14-19 |
| `cancel` | Removes the pointer and blocks | 20 |

The scene uses a 12 px threshold for touch and 5 px for mouse (`scene.tsx:87`).

### 2.4 `app/anatomy.ts` data model (36 lines)

```ts
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number}
```

(`anatomy.ts:19-23`)

`SYSTEMS` (lines 2-18) is a curated array of 15 entries with `id`, `name`, `color`, and a two-sentence `description`. `DEFAULT_VISIBLE` (line 24) lists 14 systems; `integumentary` is off by default. `EXPLANATIONS` (lines 25-35) holds nine organ descriptions keyed by lower-case name. `explanation(name, system)` returns the organ text, else the system description, else an empty string (line 36).

### 2.5 `app/agent-tools.ts` WebMCP (13 lines)

`registerAtlasTools` looks for `document.modelContext.registerTool` (line 9). If absent it returns. Otherwise it registers two tools with an `AbortController` for lifecycle (lines 10-12):

| Tool | Read only | Input | Output |
|---|---|---|---|
| `find_anatomy` | yes | `{query: string}` | Up to 30 `{id, name, pieces}` from substring match on concept name or id (line 5) |
| `inspect_anatomical_structure` | no | `{id: string}` | Calls `inspect(concept)`, returns `{id, name, selectedPieces}`; throws when the id is unknown (line 6) |

The same `atlasTools` factory is unit-tested in `scripts/validate-interactions.mjs:24-31`.

### 2.6 `app/model-download.ts` (11 lines)

`decodeModelResponse` reads the payload, checks the first two bytes for the gzip signature `0x1f 0x8b` (line 7), decompresses through `DecompressionStream('gzip')` only when the signature is present (line 8), and asserts the byte length equals `chunk.bytes` (line 9). This handles hosts that serve `.gz` files with or without `Content-Encoding: gzip`.

### 2.7 `app/explosion-layout.ts` (14 lines)

Input: visible `Part[]` and aspect. Each part becomes a card of its x and y extent plus .04 m padding with a .035 m floor (line 5). Target width is `max(widest card, sqrt(area * clamp(aspect, .5, 1.5)) * 1.18)` (line 7). Output: `{cells: Map<id, {x, y, width, height}>, width, height}` centered on the origin (lines 12-13).

## 3. Data model: `public/models/atlas.json`

### 3.1 Top-level fields

| Field | Value | Source |
|---|---|---|
| `version` | `"BodyParts3D 4.0"` | (measured) |
| `sex` | `"male"` | (measured) |
| `source` | `"BodyParts3D"` | (measured) |
| `scope` | `"Adult male reference anatomy · 2,234 source meshes"` | (measured) |
| `parts` | 2,234 entries | (measured) |
| `concepts` | 3,432 entries | (measured) |
| `chunks` | 15 entries | (measured) |
| `triangles` | 2,288,268 | (measured) |
| `sourceTriangles`, `optimized` | Written by `scripts/optimize-anatomy.mjs:35` | (measured) |
| File size | 1,335,285 bytes | `ls -l` |
| Chunk bytes | 59,546,744 raw, 32,956,129 gzip | (measured) |

### 3.2 `Part`

Sample (measured):

```json
{"id":"FJ1252","name":"Gingiva of upper jaw","conceptId":"FMA59763","system":"skeletal","chunk":0,"positions":0,"normals":10596,"indices":15896,"vertexCount":883,"indexCount":4272,"bounds":[[-0.0354,1.5395,0.0278],[0.0341,1.5579,0.0816]]}
```

| Field | Meaning | Where set |
|---|---|---|
| `id` | BodyParts3D element id (`FJ` prefix) | `convert-anatomy.py:40` |
| `name` | English name from the OBJ header comment | `convert-anatomy.py:21` |
| `conceptId` | FMA concept id (`FMA` prefix) | `convert-anatomy.py:40` |
| `system` | One of 15 `SystemId` values; default `connective` when the map has no entry | `convert-anatomy.py:38` |
| `chunk`, `positions`, `normals`, `indices` | Chunk index and byte offsets into that chunk | `optimize-anatomy.mjs:33` |
| `vertexCount`, `indexCount` | Sizes for the typed-array views | `optimize-anatomy.mjs:33` |
| `bounds` | Axis-aligned box in meters, Y up | `convert-anatomy.py:37` |

Units: the converter multiplies millimeters by .001 and swaps axes from Z-up to Y-up (`convert-anatomy.py:23`). The body spans y = 0 to 1.73 m (measured).

### 3.3 `Concept`

```json
{"id":"FMA3710","name":"vascular tree","elements":["FJ2925","FJ2933","FJ2944","FJ2950","FJ2955","FJ3020","FJ3040"]}
```

A concept is a named node of the FMA hierarchy plus the flat list of part ids beneath it. Facts (measured):

- Every `conceptId` on a part resolves to a concept (2,234 of 2,234).
- Every `elements` entry resolves to a part.
- 1,507 concepts have one element; the largest, `FMA61775` "physical anatomical entity", has all 2,234.
- `heart` is `FMA7088` with 83 pieces; `brain` is `FMA50801` with 59; `liver` is `FMA7197` with 60; `femur` is `FMA9611` with 2.

### 3.4 How names, systems, and concepts reach the meshes

1. The mesh is the unit of geometry and picking. A tap returns a part id (`scene.tsx:94`).
2. The part carries its own `name` and `system`. The system chooses the material color and the visibility switch.
3. The concept is the unit of search and of grouped selection. Choosing a concept selects all its `elements` (`page.tsx:25`). The detail sheet then lists up to 50 members (`page.tsx:49`).
4. Presets are not in the data file. They are three hard-coded system lists in `page.tsx:38`.
5. Descriptions are not in the data file. Nine organ texts and 15 system texts live in `anatomy.ts:3-35`.

### 3.5 Chunks

```json
{"url":"/models/body-0.bin","bytes":4019496,"gzip":"/models/body-0.bin.gz","gzipBytes":2257262}
```

`optimize-anatomy.mjs:32` starts a new chunk after 4,000,000 bytes. Every array is 4-byte aligned (`optimize-anatomy.mjs:11`). Parts per chunk range from 7 to 295 (measured).

## 4. UI and UX

### 4.1 Desktop layout

Positions come from `app/globals.css`. Later rules override earlier ones; the values below are the final ones.

| Panel | Class | Position | Source line |
|---|---|---|---|
| Title block | `.identity` | left 32 px, top 29 px | 6 |
| Search and info buttons | `.top-actions` | top 32 px, right 30 px | 6 |
| Systems panel | `.layers-panel` | left 30 px, top 200 px, bottom 175 px, width 254 px, max height 654 px | 6, 34 |
| Search panel | `.search-panel` | right 30 px, top 94 px, width 350 px | 6 |
| View buttons | `.view-controls` | right 30 px, vertically centered, column | 6 |
| Caption | `.scene-caption` | bottom 162 px, centered | 6 |
| Explode dock | `.bottom-dock` | bottom 54 px, centered, width 460 px | 6 |
| Footer | `.studio-footer` | bottom 20 px, left and right 30 px | 6 |
| Detail sheet | `.detail-sheet` | top 105 px, bottom 178 px, right 95 px, width 310 px | 6 |
| About sheet | `.about-sheet` | right edge, width 450 px | 6 |
| Hover tooltip | `.part-hover` | follows pointer, max width 250 px | 15 |

Between 768 px and 1100 px the systems panel hides while the detail sheet is open (line 16).

### 4.2 Mobile behavior

The breakpoint is 767 px (line 9). `hooks/use-mobile.ts` defines 768 but the app does not import it.

| Change | Rule | Source line |
|---|---|---|
| Systems panel hidden; opens as a bottom sheet above the dock via `.mobile-open` | `.layers-panel{display:none}`, `.layers-panel.mobile-open{...bottom:calc(140px + env(safe-area-inset-bottom))}` | 9 |
| View buttons become a horizontal row under the header | `.view-controls{top:max(112px,...);flex-direction:row}` | 56 |
| Detail sheet anchors to the bottom, max height 48 dvh, 42 dvh when isolated | `.detail-sheet{bottom:calc(139px + ...);max-height:48dvh}` | 9, 21 |
| Search panel spans the width; input font 16 px | `.search-panel{left:12px;right:12px}`, `.search-panel input{font-size:16px}` | 9, 63 |
| Touch targets 44 px | `.top-actions button{width:44px;height:44px}`, `.layer-presets button{height:44px}` | 55, 61 |
| Slider thumb hit area extends 14 px | `[data-slot=slider-thumb]::after{inset:-14px}` | 60 |
| Safe areas | `env(safe-area-inset-top/right/bottom/left)` | 9, 53-58 |
| Horizontal phones (`orientation:landscape`, height ≤ 600 px) | Separate block moves the detail sheet to the right, hides view controls when a sheet is open | 10, 77-85 |
| Reduced motion | All transitions and animations off | 11 |

`scene.tsx:79-80` mirrors these numbers: it reserves 350 px on mobile and 270 px on desktop when it fits the camera.

### 4.3 Keyboard and accessibility

- `/` opens search (`page.tsx:18`). The combobox input autofocuses (`page.tsx:42`).
- The detail sheet moves focus to its title with `initialFocus={detailTitle}` and `tabIndex={-1}` (`page.tsx:49`).
- Every icon button has `aria-label`; view and preset buttons use `aria-pressed` (`page.tsx:35-43`).
- The canvas has an `aria-label` describing the gestures (`scene.tsx:21`).
- Focus rings: `outline:2px solid #538d9a; outline-offset:4px` (`globals.css:6`).
- The loading box has `role="status"`, the error box `role="alert"` (`page.tsx:47-48`).

### 4.4 Styling tokens

`globals.css:4` defines the first token set and `globals.css:26` overrides the font and radius.

| Token | Value | Use |
|---|---|---|
| Font | `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Whole app. No web font import; Inter loads only if installed locally. |
| `--background` | `#f3f4f4` | Page and `theme-color` (`web/index.html:1`) |
| `--foreground` | `#20242b` | Text |
| `--primary` | `#263b48` | Primary button, active view button, slider thumb |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--muted-foreground` | `#68727d` | Secondary text |
| `--border` | `#18253618` | Hairlines (alpha hex) |
| `--ring` | `#263b48` | Focus ring in shadcn parts |
| `--radius` | `.75rem` | shadcn radius |
| Accent teal | `#458a85` | Status dot, loading bar |
| Focus outline | `#538d9a` | Buttons and links |
| Selection tint | `vec3(0.42, 0.85, 0.78)` ≈ `#6bd9c7` at 75 % mix | Selected mesh (`scene.tsx:57`) |
| Glass surface | `#ffffffeb` background, `1px solid #25384a17` border, `backdrop-filter:blur(24px)`, radius 16 px | All floating panels |
| Tooltip | `#202e3bf5` background, white text | `.part-hover` |
| Renderer clear | `#f2f3f3` | `scene.tsx:20` |
| Vignette | `radial-gradient(ellipse at 51% 43%, transparent 35%, #83919e0f 100%)` | `.vignette` |

The design is light only. `color-scheme:light` is set at line 4 and there is no dark palette.

### 4.5 System colors

From `anatomy.ts:3-17`. The palette is low in saturation so the selection teal stands out.

| id | name | color |
|---|---|---|
| skeletal | Skeleton | `#e2d9ba` |
| muscular | Muscles | `#a85b50` |
| cardiac | Heart | `#b96760` |
| sensory | Sensory organs | `#b0c8ce` |
| arterial | Arteries | `#c05245` |
| venous | Veins | `#527c9f` |
| nervous | Nervous system | `#d8b565` |
| respiratory | Respiratory | `#b98991` |
| digestive | Digestive | `#b8916b` |
| urinary | Urinary | `#b47961` |
| lymphatic | Lymphatic | `#879f7c` |
| endocrine | Endocrine | `#c5a09a` |
| reproductive | Reproductive | `#bda098` |
| integumentary | Body surface | `#ba9b7d` |
| connective | Connective tissue | `#aec3bb` |

### 4.6 Materials and captions

Meshes use `MeshStandardMaterial` with `metalness:.08`, `roughness:.53`, `side:DoubleSide` (`scene.tsx:50`). The look is matte and depends on the `RoomEnvironment` reflection plus the three lights. The caption under the model reads `ADULT HUMAN · MALE` when assembled, `SEPARATED STRUCTURES` above 5 % explode, `ANATOMICAL INVENTORY` above 95 %, or the chosen name when isolated (`page.tsx:44`).

## 5. Validation scripts

| Script | Run | Checks | Source lines |
|---|---|---|---|
| `scripts/validate-atlas.mjs` | `node scripts/validate-atlas.mjs [atlas.json]` | Part count equals 2,234 and concept count equals 3,432 (hard-coded); ids unique; every chunk file length equals `bytes`; every part has a name, a `conceptId`, and a `system`; indices stay inside the buffer and below `vertexCount`; positions finite; every concept element resolves; triangle sum equals `triangles` | 5-11 |
| `scripts/validate-interactions.mjs` | `node scripts/validate-interactions.mjs` | For all parts and for each system subset, at aspect .46, 1, 1.7: cell count equals part count, cells stay inside the layout, no two cells overlap. Then WebMCP contract: `find_anatomy('femur')` returns results, `inspect` selects, unknown id throws, blank query throws. Then five `PointerTap` cases and an empty layout | 7-41 |
| `npm run check` | `tsc --noEmit` | Types | `package.json:12` |
| `npm run build` | `vite build` | Bundle | `package.json:10` |

`validate-interactions.mjs:3-5` imports `.ts` files directly, so it relies on Node type stripping. This is likely why `engines.node` is `>=22.13.0`; I did not verify the minimum Node version that supports this (unverified).

The geometry pipeline has three steps, documented in `README.md:54`:

1. `python3 scripts/convert-anatomy.py OBJ_DIR CONCEPT_MAP SYSTEM_MAP` parses OBJ files, converts units and axes, quantizes normals to signed 16-bit, writes `anatomy-N.bin` chunks and `atlas.json` (`convert-anatomy.py:16-45`).
2. `node scripts/optimize-anatomy.mjs` simplifies every part with `MeshoptSimplifier.simplify` to 22 % of its indices with a floor of 96 indices and a .002 relative error bound, compacts, repacks into `body-N.bin` chunks of about 4 MB, and refuses to run twice (`optimize-anatomy.mjs:7, 27-35`).
3. `node scripts/compress-models.mjs` gzips every chunk at level 9 and records `gzip` and `gzipBytes` (`compress-models.mjs:7`).

## 6. What to borrow and what to drop

### 6.1 Borrow

| Pattern | Where | Why it fits the zebrafish atlas |
|---|---|---|
| One `SceneState` object, passed by ref into a single long-lived effect | `scene.tsx:12-14` | The time slider will change 60 times a second. React re-render per frame would be too slow. The same `latest.current` pattern lets the loop read `time` without effect churn. |
| Damped scalar with `T.MathUtils.damp` and a `moving` flag | `scene.tsx:101-102` | Replace `explode` with `time`. Geometry parameters re-evaluate only while `moving` or when the visible set changes. |
| Dirty-flag rendering | `scene.tsx:127` | Talks run on laptops. Idle frames should cost nothing. |
| `PointerTap` | `pointer-tap.ts` | Copy as is. Tap versus orbit on a trackpad or phone is the same problem. |
| Systems panel: color dot, name click for solo, switch for toggle, count, presets row, "Hide all" | `page.tsx:36-41` | Direct reuse with zebrafish systems. |
| Search: default suggestions when empty, substring on name and id, results capped, `/` shortcut | `page.tsx:18, 24, 42` | Extend the match to ZFA synonyms from `anatomy_synonyms.txt`. |
| Detail sheet layout: accent bar in system color, eyebrow, title, description, meta pairs, member list, source link, primary and secondary actions | `page.tsx:49` | Replace the description with the ZFA `def:` text and the source link with `https://zfin.org/ZFA:xxxxxxx`. Add a stage window line. |
| Isolate with `camera.setViewOffset` that respects panel rectangles | `scene.tsx:121-123` | Same need. Structures in a 24 hpf embryo are small; isolate must zoom in hard. |
| `fit(view, extent)` with reserved panel heights | `scene.tsx:78-84` | Reuse the direction vectors. Add `dorsal` and `ventral`, which matter for a fish. |
| Separate picker meshes from render meshes | `scene.tsx:70` | For procedural geometry the picker can be a low-segment copy of the same primitive. |
| WebMCP tool registration with `AbortController` | `agent-tools.ts` | Optional. Costs 13 lines. Add a third tool `set_stage`. |
| Mobile rules: 767 px breakpoint, 44 px targets, safe-area insets, bottom-anchored detail sheet, horizontal-phone block, reduced motion | `globals.css:9-11, 52-88` | Copy the structure of the media blocks. |
| Glass panels, light studio ground, low-saturation system palette, single selection tint | `globals.css:6, 27`; `scene.tsx:20-31, 57` | Projects well on a conference screen. Keep the light theme for talks. |
| Plain Node validation scripts with `node:assert/strict` | `scripts/validate-*.mjs` | No test framework to install. |
| `ATTRIBUTION.md` in `public/` plus an about sheet with license links | `public/ATTRIBUTION.md`, `page.tsx:50` | ZFA and ZFS are CC BY 4.0 (unverified; check https://zfin.org before shipping). |
| Curated `SYSTEMS` array with id, name, color, description in code | `anatomy.ts:2-18` | Systems are a presentation choice. Keep them in code. |

### 6.2 Drop

| Pattern | Where | Why |
|---|---|---|
| Binary chunk files, gzip, `DecompressionStream`, `decodeModelResponse`, progress bar per chunk | `model-download.ts`, `scene.tsx:62-77`, `scripts/compress-models.mjs` | Procedural geometry ships as parameters in one JSON file. No binary download. |
| `meshoptimizer` simplification and the OBJ converter | `scripts/optimize-anatomy.mjs`, `scripts/convert-anatomy.py` | No source meshes. |
| `mergeGeometries` per system, `partIndex` attribute, `DataTexture` state, shader injection | `scene.tsx:32-33, 51-57, 71-74` | The batch exists because 2,234 parts and 2.3 million triangles cannot be separate draw calls. A zebrafish atlas with 50 to 300 structures can give each structure its own `Mesh` and its own material uniforms. Per-mesh `visible`, `position`, and an `emissive` or color mix replace the texture. Revisit only if the structure count passes about 500 (my estimate, unverified). |
| Exploded shelf layout and markers | `explosion-layout.ts`, `scene.tsx:37-40, 107-112` | See section 7 for a possible repurpose. Do not port it in the first version. |
| Hard-coded counts in the validator | `validate-atlas.mjs:5` | Structure count will change weekly. Validate invariants that hold as the count changes. |
| `sex` field and "ADULT HUMAN · MALE" caption | `anatomy.ts:21`, `page.tsx:44` | Replace with the current ZFS stage name. |
| `vinext`, `@openai/sites-vite-plugin`, Cloudflare, RSC, and the 54 unused `components/ui` files | `package.json`, `components/ui/` | Start from a clean Vite + React + Tailwind v4 + Base UI install. Add only button, badge, slider, switch, sheet, combobox. |
| Hover tooltip only in exploded mode | `scene.tsx:88` | For a fish, hover names in the assembled view help during a talk. Enable hover at all times on mouse devices. |

## 7. Proposed mapping: human-atlas concept to zebrafish-atlas concept

### 7.1 Concept table

| human-atlas | zebrafish-atlas | Notes |
|---|---|---|
| `Part` (one BodyParts3D mesh, id `FJxxxx`) | `Structure` (one procedural primitive, id `ZFA:xxxxxxx`) | The structure carries `geometry: {type, keyframes[]}` instead of buffer offsets. |
| `Part.system` | `Structure.system` | Curated, assigned in a mapping file, same as `convert-anatomy.py:38`. |
| `Part.bounds` | Computed per frame from the current parameters | Needed for isolate and picking. Cache per keyframe. |
| `Concept` (FMA node with flat `elements`) | ZFA term with `elements` = all structures in its `part of` closure | `anatomy_relationship.txt` has 2,163 `part of` rows and 3,225 `is_a` rows (measured with `awk`). Build the closure at build time. |
| `SystemId` (15 curated) | Curated list, about 10 entries | Candidates: nervous, sensory, cardiovascular, digestive, musculoskeletal, integument, excretory, respiratory (gills and swim bladder), reproductive, extraembryonic (yolk, enveloping layer, chorion). Colors to be chosen; keep low saturation. |
| Presets All / Skeleton / Organs | Two preset rows: stage presets and system presets | Stage presets jump the time slider. System presets keep the human-atlas behavior. |
| Explode slider (0 to 100 %) | Time slider (0 hpf to adult) | Same dock, same `output` readout. Show hpf under 72 h, dpf above. |
| `state.explode` damped in the loop | `state.time` damped in the loop | Reuse `scene.tsx:101-102`. |
| Caption "ADULT HUMAN · MALE" | Current ZFS stage name, for example "Pharyngula: Prim-5" | From `stage_ontology.txt` by `start <= hpf < end`. |
| Visibility A channel per part | `startHpf <= time < endHpf` and system on | `anatomy_item.txt` columns 3 and 4 give the start and end stage per term. Map them to hpf with `stage_ontology.txt`. |
| `EXPLANATIONS` (9 hand-written) | ZFA `def:` lines from `zfa.obo` | Fall back to the system description as `explanation()` does. |
| Source link to lifesciencedb.jp | `https://zfin.org/ZFA:xxxxxxx` | One URL per structure. |
| `Atlas.version` "BodyParts3D 4.0" | ZFA and ZFS release dates from the OBO header | Record both. |
| Exploded inventory | Stage gallery (see 7.3) | Later feature. |
| `find_anatomy`, `inspect_anatomical_structure` | Same two tools plus `set_stage({hpf})` | Optional. |
| `validate-atlas.mjs` | Check every structure id exists in `anatomy_item.txt`, start stage precedes end stage, keyframes sorted by hpf, every `part of` and `develops from` target resolves | Invariants, no fixed totals. |
| `validate-interactions.mjs` | `PointerTap` cases as is, plus slider-to-hpf mapping is monotonic, plus parameter interpolation is continuous at every keyframe | Same style. |

### 7.2 Stage presets

`stage_ontology.txt` lists 44 named stages from `ZFS:0000001` Zygote: 1-cell (0.00 to 0.75 hpf) to `ZFS:0000044` Adult (2160 to 17520 hpf). A preset row cannot show 44 buttons. Proposed presets, one per period, with the first stage of each period as the jump target:

| Preset label | ZFS id | ZDB stage id | Start hpf | Source |
|---|---|---|---|---|
| Zygote | ZFS:0000001 | ZDB-STAGE-010723-4 | 0.00 | `stage_ontology.txt:2` |
| Cleavage | ZFS:0000002 | ZDB-STAGE-010723-15 | 0.75 | `stage_ontology.txt:3` |
| Blastula | ZFS:0000008 | ZDB-STAGE-010723-7 | 2.25 | `stage_ontology.txt:9` |
| Gastrula | ZFS:0000017 | ZDB-STAGE-010723-6 | 5.25 | `stage_ontology.txt:18` |
| Segmentation | ZFS:0000023 | ZDB-STAGE-010723-23 | 10.33 | `stage_ontology.txt:24` |
| Pharyngula | ZFS:0000029 | ZDB-STAGE-010723-10 | 24.00 | `stage_ontology.txt:30` |
| Hatching | ZFS:0000033 | ZDB-STAGE-010723-9 | 48.00 | `stage_ontology.txt:34` |
| Larval | ZFS:0000035 | ZDB-STAGE-010723-8 | 72.00 | `stage_ontology.txt:36` |
| Juvenile | ZFS:0000042 | ZDB-STAGE-010723-51 | 720.00 | `stage_ontology.txt:43` |
| Adult | ZFS:0000044 | ZDB-STAGE-010723-39 | 2160.00 | `stage_ontology.txt:45` |

The slider should not be linear in hpf. The first 72 hours hold 34 of the 44 stages (`stage_ontology.txt:2-35`), and the adult period alone spans 15,360 hours (`stage_ontology.txt:45`). A piecewise-linear map from slider position to hpf, with one segment per period above, gives each period equal slider width. The `explode` slider in `page.tsx:45` already converts slider units to state units in one expression, so the mapping fits there.

### 7.3 What replaces the exploded view

The exploded view answers "what pieces are in here". For a fish with a time axis the analogous question is "how does this look across stages". Three options:

1. Drop it. Smallest first version.
2. Stage gallery. Render the whole embryo at several fixed stages side by side, using the shelf packing from `explosion-layout.ts` with one card per stage. The slider then scrubs all copies at once with an offset. This reuses the packing code and the `fit` logic for a wide layout.
3. System explode at a fixed time. Keep the radial phase of `scene.tsx:111`, which moves each system outward by its index angle, and drop the packing phase. This works for a 5 dpf larva where organs overlap.

I recommend option 1 for the first release and option 2 as the first extension. Option 3 is cheap to add later because the radial phase is four lines.

### 7.4 A new concept with no human-atlas analog: `develops from`

`anatomy_relationship.txt` holds 527 `develops from` rows and 10 `has developmental contribution from` rows (measured with `awk`). Examples from `anatomy_item.txt`: somite `ZFA:0000155` exists from 1-4 somites (`ZDB-STAGE-010723-23`) to 14-19 somites (`ZDB-STAGE-010723-30`); the yolk `ZFA:0000084` exists from 1-cell to Day 5. When a structure ends and a successor begins, the successor's first keyframe can copy the predecessor's last parameters. The mesh then morphs instead of popping. This rule belongs in the keyframe builder.

### 7.5 Proposed `atlas.json` shape for the zebrafish atlas

```json
{
  "version": {"zfa": "<OBO data-version>", "zfs": "<OBO data-version>"},
  "stages": [
    {"id": "ZFS:0000029", "zdb": "ZDB-STAGE-010723-10", "name": "Pharyngula:Prim-5", "startHpf": 24.0, "endHpf": 30.0}
  ],
  "systems": [
    {"id": "cardiovascular", "name": "Cardiovascular", "color": "#b96760", "description": "..."}
  ],
  "structures": [
    {
      "id": "ZFA:0000114", "name": "heart", "system": "cardiovascular",
      "startStage": "ZFS:0000031", "endStage": "ZFS:0000044", "startHpf": 36.0, "endHpf": 17520.0,
      "partOf": ["ZFA:0000010"], "developsFrom": ["ZFA:0000028"],
      "synonyms": [], "definition": "...", "url": "https://zfin.org/ZFA:0000114",
      "geometry": {"type": "tube", "keyframes": [{"hpf": 36, "params": {}}, {"hpf": 48, "params": {}}]}
    }
  ],
  "concepts": [
    {"id": "ZFA:0000010", "name": "cardiovascular system", "elements": ["ZFA:0000114"]}
  ],
  "presets": [
    {"id": "prim5", "label": "Pharyngula", "hpf": 24.0, "view": "side"}
  ]
}
```

`stages` comes straight from `stage_ontology.txt`. `structures` is the curated subset of the 3,113 ZFA terms (`wc -l anatomy_item.txt`) that get geometry. `concepts` is derived at build time from `part of` rows so that search over the full ontology still lands on rendered structures, the same way `Concept.elements` fans out to parts in `page.tsx:25`. The `startHpf` and `endHpf` for the heart in the example are placeholders; the real values come from `anatomy_item.txt` (`ZFA:0000114 heart ZDB-STAGE-010723-13 ZDB-STAGE-010723-39`, which is Prim-25 at 36 hpf to Adult).

## 8. Open questions for the repo owner

1. Base UI or Radix. The clone uses shadcn v4 on `@base-ui/react` 1.7.0. Confirm the zebrafish project follows the same choice so the six primitives port unchanged.
2. Three.js version. The clone pins 0.159.0 from `package.json:33`. A new project should pick a current release; the APIs used here (`OrbitControls`, `RoomEnvironment`, `mergeGeometries`, `onBeforeCompile`) exist in later versions (unverified for the exact version chosen).
3. Light theme only. The clone has no dark palette. Decide whether talks need a dark variant before the tokens are set.
4. Hover in assembled view. The clone disables hover names unless exploded. I recommend that hover stays on for the fish; confirm.
5. Exploded view replacement. Pick among the three options in 7.3.
