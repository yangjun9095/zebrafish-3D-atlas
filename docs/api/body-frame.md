# Body frame and record API

Reference for the phase 2 anatomy packages (WP-A1 to WP-A5) and the phase 3 interaction
packages. The signatures below are copied from `src/core` at the end of phase 1 (commit
5789af5, plus the phase 2/3 preparation). The shared API is frozen (spec QP-60): a change to a
signature needs one pull request that updates every package.

Precedence for values: the decision record (`docs/superpowers/specs/2026-09-06-architecture-decisions.md`,
D1 to D16) wins over the spec (`2026-09-06-zebrafish-3d-atlas-design.md`), and the spec wins over
the research drafts (D11). Where this file and the code differ, the code wins; report the
difference in your package's `requests`.

Contents

1. Files and commands per package
2. Axes, units and body coordinates
3. `bodyModel.ts`
4. `spine.ts` and `growth.ts`
5. Sizes: `Size`, `sizeMode`, `sizeRefSl`
6. Primitives and `buildStructure`
7. Keyframes and interpolation
8. Presence and fades
9. Handoffs
10. Schema: `StructureRecord` and `GeometrySpec`
11. Record rules checklist
12. Worked example: the otic vesicle
13. Validator rules and codes

## 1. Files and commands per package

The records live in one JSON array per D5 system under `src/data/structures/`, and the handoff
rows in one file per package under `src/data/handoffs/`. `src/data/structures/all.ts` and
`src/data/handoffs/all.ts` concatenate them for the app; the scripts read the directories.

| Package | Record files | Handoff file | Custom builder files |
|---|---|---|---|
| WP-A1 | `structures/early_embryo.json`, `structures/axial.json` | `handoffs/a1-early-axial.json` | none (`somiteChevron` through `segmentArray`) |
| WP-A2 | `structures/nervous.json`, `structures/sensory.json` | `handoffs/a2-nervous-sensory.json` | `src/core/primitives/custom/eyeCup.ts`, `earVesicle.ts`, `primordiumMover.ts` |
| WP-A3 | `structures/cardiovascular.json`, `hematopoietic_immune.json`, `respiratory.json` | `handoffs/a3-cardio-blood-respiratory.json` | `custom/heartLoop.ts` |
| WP-A4 | `structures/digestive.json`, `excretory.json`, `endocrine.json`, `reproductive.json` | `handoffs/a4-digestive-excretory-endocrine-reproductive.json` | `custom/gutLoop.ts` |
| WP-A5 | `structures/skeletal.json`, `muscular.json`, `fins.json`, `integument_pigment.json` | `handoffs/a5-skeletal-muscular-fins-skin.json` | `custom/finSheet.ts` |

A handoff row belongs to the file of the system of its `driver` record. A row whose targets
sit in another package stays in the driver's file; the target package reads it.

`src/data/structures/groups.json` holds the 45 group nodes of spec 3.4 (`geometry: null`).
It is shared: do not edit it. Put a group-node change (a window per DM-30, a new group node,
geometry for a group node per DM-10) in your `requests`. Every `uiParent` that a 03 draft
names is already a record.

Commands:

```
node scripts/validate-data.ts                 # all rules; 0 errors required
node scripts/validate-data.ts --strict-handoffs   # W011 becomes E021 (phase 2 CI)
npx tsc --noEmit -p tsconfig.json
npx eslint <your files>
npx vitest run <your tests>
node scripts/snap.ts --port <port> --out <dir> --hpf 24,48,120,720,4320 --views lat,dor
```

`scripts/snap.ts` builds into `<dir>/dist` (never the shared `dist/`), serves it on your port,
screenshots each view at 1600 by 900 with the system Chrome, and stops the server. Views:
`lat`, `dor`, `ven`, `ant`, `pos`, `tq`. Options: `--embed 0|1` (default 1), `--xr 0..100`,
`--hide <system ids or 7-digit ZFA numbers>`, `--theme dark|light`. Never run `npm run build`
from a package.

## 2. Axes, units and body coordinates

World space (D4): millimetres; +x posterior, +y dorsal, +z the left side of the fish. The
default lateral view looks along -z, so the fish shows its left side with the snout on the left.

Body coordinates (D3):

- `u`: arc length along the spine divided by the snout-to-notochord-end length. `u = 0` is the
  snout tip, `u = 1` the posterior end of the notochord. `u` above 1 (to 1.25) is allowed only in
  the `fins` system (E012); `frameAt(u)` then extends along the tangent at `u = 1` (BG-08).
- `v`: -1 ventral skin, 0 spine, +1 dorsal skin.
- `w`: -1 left skin, 0 midline, +1 right skin.
- `toWorld(u, v, w) = p + v * (v >= 0 ? hD : hV) * n + w * hW * b` with the station frame
  `p` (spine point), `t` (tangent, posterior), `n` (dorsal normal), `b` (lateral binormal).
- The local body height at `u` is `hD + hV`; the half-width is `hW`. A `bodyHeightFraction`
  size is a fraction of `hD + hV` at the placement's `u`.
- Local axes of a placed primitive (`mesh.ts` `localAxes`): x along `t`, y along `n`,
  z = x cross y (the left side); `yawDeg`, `pitchDeg`, `rollDeg` rotate them in that order.
  `mirror: true` draws the primitive at `-|w|` and a twin at `+|w|`.

Body regimes (`regimeAt(hpf)`, `REGIME_BOUNDS_HPF = { R0: 4.66, R1: 10, R2: 19, R3: 72 }`):

| Regime | hpf | Body |
|---|---|---|
| R0 | 0 to 4.66 | yolk sphere plus a blastodisc cap |
| R1 | 4.66 to 10 | blastoderm shell over the sphere, epiboly fraction |
| R2 | 10 to 19 | axis wrapped on the yolk surface |
| R3 | 19 to 72 | spline body, head-trunk angle 120 to 25 degrees, yolk ball plus extension |
| R4 | 72 to 4320 | spline body scaled by standard length; no yolk after 168 hpf |

Body numbers at the headline stages (from `src/data/body.json` and `stages.json`):

| hpf | axisLengthMm | SL mm | hD, hV, hW at u 0.5 (mm) | ventU |
|---|---|---|---|---|
| 24 | 2.05 | null | 0.110, 0.190, 0.070 | 0.76 |
| 48 | 2.90 | null | 0.130, 0.172, 0.080 | 0.60 |
| 72 | 3.25 | 3.25 | 0.140, 0.151, 0.090 | 0.61 |
| 120 | 3.60 | 3.6 | 0.160, 0.130, 0.100 | 0.62 |
| 720 | 8.20 | 8.2 | 0.702, 0.603, 0.346 | 0.60 |
| 4320 | 25.0 | 25 | 3.562, 2.991, 1.308 | 0.60 |

## 3. `bodyModel.ts`

```ts
export type Vec3 = [number, number, number]
export type Regime = 'R0' | 'R1' | 'R2' | 'R3' | 'R4'
export const PROFILE_U: readonly number[]            // [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0]
export const REGIME_BOUNDS_HPF: { R0: 4.66; R1: 10; R2: 19; R3: 72 }

export function createBodyModel(body: BodyFile, growth: GrowthPoint[]): BodyModel   // pure; the app and the scripts call it once
export type BodyModel = (hpf: number) => BodyFrame     // cached per 1e-3 hpf
export function regimeAt(hpf: number): Regime
export function somiteCountAt(hpf: number): number     // Kimmel rates, 31 from 26 hpf
export function cellCountAt(hpf: number): number | null   // null from 4.66 hpf

export interface LocalFrame { p: Vec3; t: Vec3; n: Vec3; b: Vec3; hD: number; hV: number; hW: number; exponent: number }
export interface BodyStation extends LocalFrame { u: number }

export interface BodyFrame {
  hpf: number
  regime: Regime
  stations: BodyStation[]            // 128 stations, u = i / 127
  axisLengthMm: number               // snout to notochord end; the u denominator
  bodyLengthMm: number               // growth table (EL or TL)
  slMm: number | null                // standard length; null before 72 hpf
  headTrunkAngleDeg: number | null
  notochordFlexionDeg: number
  ventU: number                      // u of the vent
  epibolyFraction: number
  somiteCount: number
  cellCount: number | null
  cap: { baseRadiusMm: number; heightMm: number } | null     // blastodisc (R0)
  shellThicknessMm: number | null                            // blastoderm (R1)
  yolkDomeMm: number
  yolk: {
    ball: { centre: Vec3; radiusMm: number; u: number; depthMm: number } | null
    extension: { u0: number; u1: number; r0Mm: number; r1Mm: number } | null
  } | null                           // null after the yolk is gone
  chorion: { centre: Vec3; radiusMm: number } | null
  frameAt(u: number): LocalFrame     // u may exceed 1 (fins)
  toWorld(u: number, v: number, w: number): Vec3
}
```

`BodyKeyframe` and `BodyFile` mirror `src/data/body.json` (`scripts/gen-body.ts` writes it; E031
compares the file with a fresh run). A builder never reads `body.json`; it reads the frame.

## 4. `spine.ts` and `growth.ts`

`spine.ts` (rarely needed by a record author; the tube and gut builders use it):

```ts
export const STATION_COUNT = 128
export const SEED_U = 0.4
export function sampleByArcLength(points: Vec3[], count = STATION_COUNT): { positions: Vec3[]; tangents: Vec3[]; length: number }
export function parallelTransportFrames(tangents: Vec3[], seedU = SEED_U, up: Vec3 = [0, 1, 0]): { t: Vec3[]; n: Vec3[]; b: Vec3[] }
export function monotoneCubic(xs: number[], ys: number[], xq: number[]): number[]
export function enclosingSphere(points: Vec3[], radii?: number[], iterations = 400): { centre: Vec3; radius: number }
export function sampleSpine(controlPoints: readonly (readonly [number, number, number])[]): SpineSample
export function blendSpine(a: SpineSample, b: SpineSample, s: number): { positions: Vec3[]; tangents: Vec3[] }
```

`growth.ts` (D6, BG-43). The table is `stages.json` `growth`; SL is linear in hpf between rows
and null before 72 hpf. The pure forms take the table; the short forms read the table that
`configureGrowth` registered (the app registers it in `src/bootstrap.ts`; a script must call
`configureGrowth(stages.growth)` or use the `*From` forms).

```ts
export interface GrowthPoint { hpf: number; lengthMm: number; measure: 'EL' | 'TL' | 'SL'; standardLengthMm: number | null; source: string; estimate: boolean }
export const SL_START_HPF = 72
export function bodyLengthAtFrom(table: readonly GrowthPoint[], hpf: number): number
export function slAtFrom(table: readonly GrowthPoint[], hpf: number): number | null
export function slScaleFrom(table: readonly GrowthPoint[], hpf: number, sizeRefSl: number): number   // SL(max(hpf, 72)) / sizeRefSl; 1 when either side is missing
export function hpfAtSlFrom(table: readonly GrowthPoint[], sl: number): number | null
export function configureGrowth(table: readonly GrowthPoint[]): void
export const bodyLengthAt: (hpf: number) => number
export const slAt: (hpf: number) => number | null
export const slScale: (hpf: number, sizeRefSl: number) => number
export const hpfAtSl: (sl: number) => number | null
```

SL at the headline stages, the values to write as `sizeRefSl`:

| hpf | 72 | 96 | 120 | 168 | 336 | 504 | 720 | 1080 | 2160 | 4320 |
|---|---|---|---|---|---|---|---|---|---|---|
| SL mm | 3.25 | 3.4 | 3.6 | 4.1 | 5.3 | 6.5 | 8.2 | 12 | 18 | 25 |

A keyframe at another hpf at or after 72 takes the interpolated SL (`slAtFrom`). An SL that
the literature gives (for example 5.2 mm SL for the fin fold handoff) maps to hpf through
`hpfAtSlFrom` (5.2 mm is 322 hpf, 6.6 mm is 517 hpf).

## 5. Sizes: `Size`, `sizeMode`, `sizeRefSl`

```ts
export type Size = number | { value: number; unit: 'mm' | 'bodyHeightFraction' }
export function sizeMm(size: Size, frame: BodyFrame, u: number): number   // fraction x (hD + hV) at u
```

- A number is millimetres. Convert the draft micrometres with `umToMm` (`paramUnits.ts`).
- `{ value, unit: 'bodyHeightFraction' }` is the `sizeMode` of the task brief: the size follows
  the local body height, and the SL rescale skips it (DM-17). Use it where the drafts give a
  ratio to body height and for every structure that must stay under the skin at every stage.
- Which leaves accept the object form: every leaf typed `Size` in section 6 (`radiiMm` entries,
  `radiusMm`, `r0Mm`, `r1Mm`, and the custom builders' `*Mm` leaves). `thicknessBaseMm`,
  `thicknessEdgeMm`, `innerRadiusMm`, `thicknessMm`, `profileMm` and `outlineMm` are plain
  millimetres.
- `sizeRefSl` (E019): every keyframe at or after 72 hpf carries the SL of the specimen the
  sizes describe; no keyframe before 72 hpf carries it. At time `t` the builder multiplies every
  length leaf of that keyframe's resolved parameters by `SL(max(t, 72)) / sizeRefSl`
  (`rescaleFactor`). A length leaf is a name ending in `Mm` or `MmPerHour` (`classifyParam`).
  Placement, `u` ranges, fractions, angles and counts never rescale.
- The rule of thumb for a size row of the drafts: a measurement at 120 hpf on a 3.6 mm SL
  larva becomes a keyframe `{ "hpf": 120, "sizeRefSl": 3.6, ... }` with the millimetre values
  as measured.

## 6. Primitives and `buildStructure`

```ts
// src/core/primitives/types.ts
export type Lod = 'interactive' | 'final'
export interface Placement { u: number; v: number; w: number; yawDeg?: number; pitchDeg?: number; rollDeg?: number; mirror?: boolean }
export interface GeometryOut {
  positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: Uint16Array | Uint32Array
  bounds: { min: Vec3; max: Vec3; center: Vec3; radius: number }
  placement?: { position: Vec3; quaternion: Quat; scale: Vec3 }      // local-frame kinds
  parts?: Record<string, { vertexStart: number; vertexCount: number; indexStart: number; indexCount: number }>
  sweep?: { maxRadiusMm: number; maxCurvature: number; product: number }   // E036
}
export interface PrimitiveBuilder<P> {
  readonly kind: string
  readonly localFrame: boolean
  build(params: P, frame: BodyFrame, lod: Lod): GeometryOut
  vertexCount(lod: Lod, params: P): number
}

// src/core/primitives/index.ts
export const PRIMITIVES: { ellipsoid, superellipsoid, tube, lathe, segmentArray, sheet, shell }
export const CUSTOM_BUILDERS: { heartLoop, gutLoop, eyeCup, earVesicle, somiteChevron, finSheet, primordiumMover }
export function builderFor(kind: string, builder?: string): PrimitiveBuilder<never> | null
export { countsFor, setInteractiveStep, getInteractiveStep }   // tessellation.ts

// src/core/primitives/buildStructure.ts
export function structureParams(record: StructureRecord, t: number, sl: number | null): Record<string, unknown>
export function buildStructure(record: StructureRecord, frame: BodyFrame, t: number, lod: Lod, params?: Record<string, unknown>): GeometryOut | null
export function builderOf(record: StructureRecord): PrimitiveBuilder<never> | null   // null for group, bodyDriven, derived
export function hasBuilder(record: StructureRecord): boolean
export function isLocalFrame(record: StructureRecord): boolean
export function isMirroredPair(record: StructureRecord): boolean
export function paramHash(record: StructureRecord, params: Record<string, unknown>, lod: Lod, frame: BodyFrame): string
export function geometryIsFinite(out: GeometryOut): boolean
export function placementOnly(record, params, frame): GeometryPlacement | null
export function twinPlacementOf(record, params, frame): GeometryPlacement | null
export function mirrorGeometry(out: GeometryOut): GeometryOut
```

`buildStructure` interpolates the record's parameters at `t` (section 7), then calls the
builder. The validator calls it for every keyframe at both levels (E029, E036, W007). Test a
record the same way:

```ts
import { createBodyModel } from '../../src/core/bodyModel.ts'
import { buildStructure } from '../../src/core/primitives/buildStructure.ts'
const model = createBodyModel(body, stages.growth)
const out = buildStructure(record, model(48), 48, 'final')   // null for a group node
```

### 6.1 Record shape per kind

The zod schema (`src/core/schema/params.ts`, `customParams.ts`, `segmentArray.ts`) is the
record form: strict objects, no unknown keys. Each kind lists its static parameters; the same
leaves may appear per keyframe as partial overrides. Defaults (`PARAM_DEFAULTS`) apply after
the merge: `mirror false`, `ellipticity 1`, `caps 'round'`, `flexionDeg 0`, `segmented false`,
`phiLengthDeg 360`, `rakeDeg 0`, `azimuthDeg 360`. Required parameters (E030) must be present
after the static block and the first keyframe merge.

| kind | frame | parameters (required in bold) |
|---|---|---|
| `ellipsoid` | local | **placement**, **radiiMm** `[Size, Size, Size]` along u, v, w |
| `superellipsoid` | local | **placement**, **radiiMm**, **e1**, **e2** in 0.3 to 2.0 |
| `tube` | world | **path** `{ type: 'spine', uStart, uEnd, v, w }` or `{ type: 'spline', points: Placement[] }` (2 or more); **radiusMm** `Size`, `{ r0Mm, r1Mm }` (taper start to end) or `'body'` (skin only); `ellipticity` (v radius over w radius); `caps` `'none'`, `'round'`, `'flat'`; `taperFromU`; `flexionDeg` 0 to 45 with `flexionFromU` (spine path only; clamped inside 0.9 of the dorsal half-height); `segmented` |
| `lathe` | local | **placement**, **profileMm** 6 to 10 `[radius, y]` points, lowest y first; `phiLengthDeg` |
| `sheet` | world | **base** `{ uStart, uEnd, side: 'dorsal' \| 'ventral' \| 'lateral', w }`, **outlineMm** closed outline of 3 or more `[chord, span]` points in mm, **thicknessBaseMm**, **thicknessEdgeMm** (0.004 or more); `rakeDeg` swings the span toward posterior. `side 'lateral'` sits at `v 0`, `w` (1 when 0) |
| `shell` | local | **centre** (Placement), **innerRadiusMm**, **thicknessMm**, **polarDeg** 0 to 180 from world +y; `azimuthDeg` |
| `segmentArray` | world | **template**, **uStart**, **uEnd**, **count** (may be fractional, BG-42); `mirror`; `perIndex` `{ scale, offsetV, chevronDeg }`. Instance i sits at `uStart + (i + 0.5)(uEnd - uStart) / count`; a template without a placement sits at `v 0, w 1` |
| `bodyDriven` | body | **part** `'yolk'`, `'chorion'`, `'blastodisc'`, `'blastoderm'`; shape from the frame (DM-31). Reserved for the four phase 1 records |
| `derived` | source | **sourceId**, **part**: a named vertex range of another record's build (`atrium`, `ventricle`, `bulbus`, `sinusVenosus`, `avCanal` of the heart; `lens`, `retina`, `rpe` of the eye; `ball`, `extension` of the yolk) |
| `custom` | see 6.2 | **builder** plus the builder's parameters |

Segment array templates: the schema accepts `ellipsoid`, `superellipsoid`, `tube`, `sheet` and
`custom` with `builder 'somiteChevron'`; the builder (`segmentArray.ts`) instantiates
`ellipsoid`, `superellipsoid`, `lathe` and `somiteChevron`. Use `ellipsoid`, `superellipsoid` or
`somiteChevron`; a `tube` or `sheet` template fails at build (E029) and a `lathe` template fails
the parse (E001).

Tessellation (final rows x radial, `tessellation.ts`): ellipsoid and superellipsoid 24 x 32,
tube 48 x 12, skin tube 128 x 32, lathe 32 x 24, sheet 24 x 8, shell 24 x 48, heartLoop 48 x 16,
gutLoop 48 x 12, eyeCup and earVesicle 24 x 32, somiteChevron 8 x 8, finSheet 24 x 8,
primordiumMover 12 x 16. Every normal is analytic; E029 rejects a non-unit or inward normal.

### 6.2 Custom builders

Each custom kind has a zod shape (the record form, `customParams.ts`) and a TypeScript
parameter interface in its builder file. For four builders the two agree. For three they do
not (see the notes); a record must satisfy the zod shape, so the owner of the builder file
aligns the builder with the schema before the first record lands. Report the change in
`requests` if you do not own the file.

**heartLoop** (BG-34, WP-A3, `custom/heartLoop.ts`, local frame, sweep rule E036).
Schema and builder agree.

```ts
{ placement, stage: 'cone' | 'tube' | 'C' | 'S' | 'chambers', coneBaseRadiusMm: Size, coneHeightMm: Size,
  tubeLengthMm: Size, headingDeg, bendDeg: 0..180, twistDeg,
  segments: { sinusVenosus: { s0, s1, rMm }, atrium: { s0, s1, rMm, rAcrossMm }, avCanal: { s0, s1, rMm },
              ventricle: { s0, s1, rMm, rAcrossMm, exponent }, bulbus: { s0, s1, rBaseMm, rNeckMm, tiltDeg } },
  atriumOffset: { v, w } }
export const HEART_PARTS = ['sinusVenosus', 'atrium', 'avCanal', 'ventricle', 'bulbus']
export function segmentRange(params, part): { s0; s1 }
export function heartCentreline(params, frame): Vec3[]
```

**eyeCup** (BG-36, WP-A2, `custom/eyeCup.ts`, local frame). Agree. Parts `rpe`, `retina`, `lens`.

```ts
{ placement, outerDiameterMm: Size, depthMm: Size, stage: 'vesicle' | 'cup' | 'eye', fissureDeg: 0..180,
  lensDiameterMm: Size, lensProtrusionFraction: 0..0.4, rpeThicknessMm: Size, retinaThicknessMm: Size }
```

**earVesicle** (BG-37, WP-A2, `custom/earVesicle.ts`, local frame). Agree.

```ts
{ placement, lengthMm: Size, widthMm: Size, heightMm: Size, wallMm: Size,
  otoliths: { diameterMm: Size; pole: 'anterior' | 'posterior' }[], pillarLengthFraction: 0..1,
  canals: { loopDiameterMm: Size; tubeDiameterMm: Size; present: boolean } }
```

**somiteChevron** (BG-38, `custom/somiteChevron.ts`, local frame). Schema: `{ lengthMm, widthMm,
heightFraction, chevronDeg, wFoldFraction, apexOffsetFraction }`. The builder also reads
`placement` (required) and an optional `heightMm` that overrides `heightFraction`. Use it as a
`segmentArray` template, where the array supplies the placement; a standalone
`custom/somiteChevron` record has no placement in the schema and fails at build.

**gutLoop** (BG-35, WP-A4, `custom/gutLoop.ts`, world frame, E036). The schema and the builder
differ. Schema (the record form):

```ts
{ path: Placement[] (2 or more; the last u is ventU),
  segments: { esophagus: { s0, s1, rMm }, intestinalBulb: {...}, midIntestine: {...}, posteriorIntestine: {...} },
  bulbOffsetW: -1..1, countLoops: number (0 larva, 1 from 504 hpf, 3 adult),
  attachments: { name, s0, s1, thetaDeg }[] }
```

Builder interface today: `radius` instead of `segments`, `loops` instead of `countLoops`, and
`attachments` as a `Record<name, { s0, s1, thetaDeg }>`. `gutAttachment(params, frame, name)`
returns the world point and normal of an attachment face for the liver, pancreas and gall
bladder. WP-A4 owns the builder file and aligns it with the schema (the schema names follow
the DM-35 suffix rule, which the interpolation and rescale depend on).

**finSheet** (BG-39, WP-A5, `custom/finSheet.ts`, world frame). The schema and the builder
differ. Schema:

```ts
{ base: { uStart, uEnd, side: 'dorsal' | 'ventral' | 'lateral', w }, outlineMm: [chord, span][] (mm, 3 or more),
  thicknessBaseMm, thicknessEdgeMm (0.004 or more), rakeDeg,
  rays: { count, lengthFraction: 0..1, thicknessMm: Size }, forkDepthFraction: 0..0.2, lobes: 'one' | 'two' }
```

Builder interface today: `base.side` also accepts `'fold'` and `'caudal'`; `outline` as
`[chord fraction 0..1, height mm]` instead of `outlineMm`; `fanShare`; `lobes` as `1 | 2`;
`rays` optional. The `'fold'` leg draws the median fin fold around the tail (dorsal base, fan
on the BG-08 extension, ventral base to the vent). WP-A5 owns the builder file and aligns it
with the schema; the fold and caudal legs need a schema request (WP-02 file
`src/core/schema/customParams.ts`), because the record form must express them.

**primordiumMover** (BG-40, WP-A2, `custom/primordiumMover.ts`, local frame). The schema and
the builder differ in the deposit rule. Schema:

```ts
{ placement (u per keyframe on the horizontal myoseptum, v 0, w +-1), lengthMm: Size, widthMm: Size, heightMm: Size,
  speedMmPerHour, deposits: { countSomitesPerDeposit: integer, neuromastDiameterMm: Size } }
```

Builder interface today: `deposits.everySomites`, optional `startHpf` and `startU`. The mesh
itself (a teardrop sweep) reads only `placement`, `lengthMm`, `widthMm`, `heightMm`. WP-A2 aligns
the builder with the schema.

## 7. Keyframes and interpolation

`src/core/interpolation.ts`:

```ts
export interface Keyframe { hpf: number; sizeRefSl?: number; [key: string]: unknown }
export function interpolateParams(staticParams, keyframes, t, sl: number | null, spec = defaultParamSpec): Record<string, unknown>
export function resolveKeyframe(staticParams, keyframes, index, spec?): Record<string, unknown>
export function mergeParams(base, patch): Record<string, unknown>     // deep merge per leaf; arrays replace whole
export function bracket(keyframes, t): [number, number]
export function weightBetween(aHpf, bHpf, t): number                  // smoothstep
export function lerpAngleDeg(a, b, s): number                        // shortest arc
export function countInstances(c): { full; partialScale; visible }   // BG-42
export function rescaleFactor(sizeRefSl: number | undefined, sl: number | null | undefined): number
export function classifyLeaf(name): 'length' | 'dimensionless' | 'angle' | 'count' | 'step'
```

Rules a record author needs:

1. The geometry block minus its metadata keys (`kind`, `builder`, `part`, `sourceId`,
   `keyframes`, `geometryEndHpf`, `handoffOut`, `lodHint`, `boundsMarginMm`, `estimate`,
   `sources`) is the static block. Keyframe metadata is `hpf` and `sizeRefSl`.
2. The effective parameters of keyframe i are the static block merged with keyframes 0 to i,
   leaf by leaf. A leaf written once is inherited by every later keyframe; write only what
   changes. An array replaces the whole array, and its length must not change between
   keyframes (E035).
3. Between two keyframes the weight is `smoothstep((t - a) / (b - a))`. Numbers interpolate
   linearly; a `*Deg` leaf takes the shortest arc; a string, boolean or enum switches at the
   later keyframe's hpf; arrays of equal length blend element by element.
4. Before the first keyframe the first values hold; after the last keyframe the last values
   hold. The first keyframe lies at `visibleFromHpf` (W001), except for a record that a handoff
   seeds.
5. A `count*` leaf drives `countInstances`: `floor(c)` full instances plus one scaled by the
   fraction. `count` may be non-integer at a keyframe.
6. Leaf names follow DM-35: `*Mm` and `*MmPerHour` are lengths (rescaled by `sizeRefSl`),
   `*Deg` angles, `count*` counts; `u`, `v`, `w`, `s0`, `s1`, `e1`, `e2`, `ellipticity`,
   `exponent`, `uStart`, `uEnd`, `scale`, `*Fraction`, `*U`, `*V`, `*W` are dimensionless.
7. Keyframes at least at every headline stage inside the presence window (24, 42, 48, 72, 120,
   168, 336, 504, 720, 1080, 2160, 4320 hpf where present) plus the stage where the structure
   appears. Two consecutive keyframes must not skip a whole time-axis segment (W004; segments
   end at 10, 24, 72, 168, 720, 2160, 4320 hpf). A keyframe may carry only `hpf` and
   `sizeRefSl` when nothing else changes (the spinal cord does this at 72 and 168 hpf).

## 8. Presence and fades

`src/core/presence.ts`:

```ts
export interface PresenceRecord { visibleFromHpf: number; modelEndHpf: number; fadeInHpf: number; fadeOutHpf: number; sexSpecific?: 'female' | 'male' | null }
export interface Presence { present: boolean; opacity: number; scale: number; fade: number; transparent: boolean; phase: 'before' | 'fadeIn' | 'full' | 'fadeOut' | 'after' | 'hiddenBySex' }
export function presenceAt(record: PresenceRecord, hpf: number, opts?: { sex?: 'female' | 'male' }): Presence
export function presentIds(records, hpf, opts?): string[]
export function firstFullyVisibleHpf(record): number          // visibleFromHpf + fadeInHpf, the "Jump to first appearance" target
export function hasMeshAt(record & { geometry }, hpf, opts?): boolean   // present, geometry not null, hpf <= geometryEndHpf
export function defaultFades(input: { startHpf; endHpf; visibleFromHpf; modelEndHpf }, stages, axisEndHpf = 4320): { fadeInHpf; fadeOutHpf }
export function stageContaining(stages, hpf, edge: 'start' | 'end'): StageRecord | null
export const DEFAULT_FADE_FRACTION = 0.05
export const FADE_SCALE_MIN = 0.7
```

- The window `[visibleFromHpf, modelEndHpf]` is inclusive. Opacity ramps over `fadeInHpf` after
  the start and over `fadeOutHpf` before the end; scale ramps 0.7 to 1 with it.
- Default fades: 5 percent of the stage that contains the window edge (`defaultFades`). Write
  the numbers into the record; the schema has no default.
- DM-36: a record whose `visibleFromHpf` is 0 has `fadeInHpf` 0; a record whose `modelEndHpf` is
  4320 because ZFA ends it later has `fadeOutHpf` 0 (E032). `visibleFromHpf < modelEndHpf` and
  the fades fit inside the window (E009).
- `visibleFromHpf` defaults to `startHpf` and `modelEndHpf` to `min(endHpf, 4320)`; a different
  value needs a non-empty `overrideNote` (E007). A ZFA end stage Unknown needs an explicit end
  below 4320 with a note (E008).
- `geometry.geometryEndHpf`: the mesh ends here and the record continues as a group node
  (the neural tube at 24 hpf).
- `sexSpecific`: drawn only while the sex toggle matches (ovary `female`, testis `male`).

## 9. Handoffs

`src/core/handoffs.ts`:

```ts
export interface HandoffRecord {
  id: string                       // ^[a-z0-9_]+$
  from: ZfaId[]; to: ZfaId[]
  window: { startHpf; endHpf } | { startSl; endSl }   // SL resolves through the growth table
  perSegment?: { delayHpf: number; lengthHpf: number }   // somites to myotomes
  driver: ZfaId                    // the structure whose geometry seeds the targets; a from id, or the record itself when withinRecord
  seed: 'copyPlacement' | 'subRange' | 'outlineSegment' | 'sexToggle'
  withinRecord?: boolean           // alias boundary inside one record (heart cone to tube, optic vesicle to cup)
  note: string
}
export function resolveWindow(handoff, growth): { startHpf; endHpf }    // throws when an SL is outside the table
export function perSegmentWindow(handoff, segmentFormationHpf): { startHpf; endHpf }
export function crossfadeInWindow(win, hpf): { from; to; progress; active }
export function crossfadeAt(handoff, hpf, growth): CrossfadeWeights
export function handoffsFor(handoffs, id): { asFrom; asTo; asDriver }
export function handoffById(handoffs, id): HandoffRecord | undefined
export function seedingHandoff(handoffs, targetId): HandoffRecord | undefined   // first non-withinRecord row that lists the target
export function seedTime(target: { visibleFromHpf }): number
export function slAtHpf(growth, hpf): number | null
export function hpfAtSl(growth, slMm): number | null
```

Authoring rules (E033, E034, BG-48 to BG-50):

- Each `to` record's `visibleFromHpf` equals the window start, or its ZFA `startHpf` when that
  is earlier (DM-33). Each `from` record's `modelEndHpf` equals the window end, or its geometry
  ends there (`geometryEndHpf`) when the record continues as a group node; for a `perSegment`
  row the source may also end at window end + `delayHpf` + `lengthHpf`. Each of these
  records names the handoff id in its `overrideNote`; the source geometry names it in
  `handoffOut`.
- A `to` record's first stored keyframe lies inside `[visibleFromHpf, window end]`. Its values
  copy the source at the seed time: `copyPlacement` copies placement and radii, `subRange` a
  segment range of the same loop, `outlineSegment` the fold's outline over the fin's base
  range, `sexToggle` the immature gonad into the record that matches the sex state.
- The `driver` has non-null geometry whose keyframes cover the target's presence window start.
- Phase 1 fallback (`src/core/handoffFallback.ts`): while no `to` record with a builder exists,
  the app keeps the `from` record's mesh to its ZFA end. The validator reads the authored file,
  so author the windows as final. When your target record lands, the source retires as
  authored; check the cross-fade in a snapshot at the window end.
- The 24 D9 rows are already written. Add a row only for a develops-from pair that D9 lists
  and the files miss; put a new row in the file of the driver's system.

## 10. Schema: `StructureRecord` and `GeometrySpec`

`src/core/schema/structure.ts` (strict objects; unknown keys fail E001):

| Field | Type | Meaning |
|---|---|---|
| `id` | `ZFA:\d{7}` | one record per ZFA id (E013); must exist in `anatomy_item.txt` (E002) |
| `name` | string | equals the ZFIN label (E004; a synonym gives W010) |
| `synonyms` | string[] | ZFIN synonyms; the search covers them |
| `system` | SystemId | one of the 15 D5 ids (E018) |
| `alsoIn` | SystemId[] | extra systems for filtering; never repeats `system` |
| `zfaParent` | ZFA id or null | the ZFA parent of `parentRelation` |
| `uiParent` | ZFA id or null | tree parent; a record (E014); null only for ZFA:0001094 |
| `parentRelation` | `part_of`, `is_a`, `develops_from`, `grouping`, `root` | the first three need the row in `anatomy_relationship.txt` (E016); `grouping` for a UI-only parent |
| `definition` | string | ZFIN definition |
| `zfinStartStage`, `zfinEndStage` | `ZFS:\d{7}` | the ZFIN columns (E005); `ZFS:0000000` is Unknown |
| `startHpf`, `endHpf` | hpf | the bounds of those stages (E006); the adult stage ends at 17520 |
| `visibleFromHpf`, `modelEndHpf` | hpf | the drawn window (E007, E008, E009) |
| `overrideNote` | string or null | required when the window differs from ZFIN; names each handoff id that set it |
| `fadeInHpf`, `fadeOutHpf` | hours | fade windows (section 8) |
| `laterality` | `midline`, `paired`, `left`, `right` | `paired` goes with `placement.mirror: true` |
| `pickable` | boolean, default true | false: selectable from the tree and search only |
| `sexSpecific` | `female`, `male` or null | DM-32 |
| `aliasChain` | `{ zfaId, name, fromHpf, toHpf }[]` | ZFIN terms the record carries over time (heart, eye); contiguous windows; an alias id is never a record (E017) |
| `events` | `{ hpf, text, source?, estimate? }[]` | info-card events; `source` a URL or citation |
| `sizes` | `SizeRow[]` | reference measurements: `hpf`, `stageLabel`, `dimsMm` (mm), `counts`, `anglesDeg`, `source` (E020), `note?`, `estimate`, `basisSL` |
| `colorOverride` | `{ dark, light, opacity? }` or null | only the D10 exception list (E028, section 11) |
| `sources` | string[] (1 or more) | URLs or citations for the record |
| `geometry` | `GeometrySpec` or null | null for a group node |

`GeometrySpec` common fields (`src/core/schema/geometry.ts`):

| Field | Meaning |
|---|---|
| `kind` | one of `ellipsoid`, `superellipsoid`, `tube`, `lathe`, `segmentArray`, `sheet`, `shell`, `bodyDriven`, `custom`, `derived` |
| `builder` | custom kinds only: `heartLoop`, `gutLoop`, `eyeCup`, `earVesicle`, `somiteChevron`, `finSheet`, `primordiumMover` |
| static parameters | the kind's leaves (section 6.1) |
| `keyframes` | 1 or more `{ hpf, sizeRefSl?, ...partial parameters }`, strictly increasing (E010), inside the window (E011) |
| `geometryEndHpf` | the mesh ends here; the record continues as a group node |
| `handoffOut` | the handoff id that consumes this geometry |
| `lodHint` | `low`, `medium` (default), `high` |
| `boundsMarginMm` | allowed protrusion beyond the body box for W007 (eyes, fins, neuromasts) |
| `estimate` | parameter names that are estimates |
| `sources` | 1 or more strings, one per keyframe group is the phase 1 habit |

Size keys that W008 accepts in `dimsMm`, `counts` and `anglesDeg`: the 76 draft keys
camel-cased (`length`, `width`, `height`, `diameter`, `thickness`, `depth`, `spacing`,
`wall`, `outerDiameter`, `lumen`, `count`, `countPerSide`, `cells`, `tiers`, `lines`,
`archesPerSide`, `chevronDeg`, `headTrunkAngleDeg`, and the others listed in
`scripts/validate/rulesKeyframes.ts` `DRAFT_SIZE_KEYS`) plus `volumeMm3`.

## 11. Record rules checklist

1. One record per ZFA id in the file of its D5 system; group nodes stay in `groups.json`.
2. Micrometres of the drafts become millimetres (`umToMm`); volumes `um3` divide by 1e9.
3. Positions in body coordinates. Convert a draft `apFraction` with
   `apFractionToU(apFraction, L_source(t), axisLengthMm(t))` (spec 3.5.4; `paramUnits.ts`):
   `L_source` is the growth length in the draft's measure at that hpf, `axisLengthMm` the
   body value at that hpf (section 2 table). Draft `dv` words map through `dvKeywordToV`
   (dorsal 0.6, ventral -0.6, spine or midline 0, surface plus or minus 1); draft laterality
   through `lateralityFrom`.
4. Structures sit inside the skin at every keyframe (W007 and E029 check the build; the skin is
   the whole-organism tube with the profile half-heights). Exceptions with `boundsMarginMm`:
   eyes, fins, yolk, chorion, pectoral fin buds, neuromasts. Prefer `bodyHeightFraction`
   sizes where the drafts give ratios, so the structure scales with the local body height.
5. `sizeRefSl` on every keyframe at or after 72 hpf (section 5 table), none before.
6. Keyframes at every headline stage inside the window plus the appearance stage (section 7).
7. `visibleFromHpf` and `modelEndHpf` with an `overrideNote` when they differ from ZFIN; fades
   per section 8; the canonical windows of `scripts/validate/rulesStructures.ts`
   `CANONICAL_WINDOWS` are fixed (chorion 0 to 30 with fade 6; yolk to 168; Kupffer's vesicle
   to 19 with fade 2; tail bud to 24; posterior chamber swim bladder from 96 with fade 24).
8. `aliasChain` for a record that carries several ZFIN terms over time (heart: heart rudiment,
   primitive heart tube, and so on; eye: optic vesicle 11.66 to 19, optic cup 19 to 24).
9. `events` with `hpf`, `text` and a `source`; `sources` as URLs or citations.
10. `colorOverride` only on the D10 exception ids: arteries (ZFA:0000014, 0000011, 0005004,
    0000604, 0005002, 0001053) `#E31A1C`/`#A50F15`; veins (0000477, 0000423, 0000186, 0000180,
    0001286, 0001052, 0005934) `#1F78B4`/`#08519C`; otolith 0001617 `#F5F5F5`/`#C8CCD0`; near
    black (0000144 retinal pigmented epithelium, 0009091 melanocyte, 0005221 to 0005224
    larval stripes, 0001463 melanophore stripe) `#23262B`/`#1B1F24`; xanthophore 0009198
    `#FFB000`/`#C97D00`; iridophore 0009199 `#C9D6DF`/`#7D8A94`; cartilage (0001580, 0001205,
    0001399, 0001400, 0001422, 0000095, 0000364) `#8FC1E3`/`#2F6F9F`; bone (0000694, 0000191,
    0000270, 0000250, 0000184, 0001189, 0000538, 0001188, 0001554) `#E9DFC4`/`#8C7F5E`; yolk
    (0000084, 0000006, 0000106, 0000088) `#F2C94C`/`#A6861B`; lens 0000035 `#CFEEFF`/`#8FB4CC`
    opacity 0.35; chorion 0000329 `#C8D0D8`/`#7A8790` opacity 0.10.
11. `uiParent` in another system needs `parentRelation: 'grouping'` or the root as parent
    (W003).
12. Look at your snapshots at 24, 48, 120, 720 and 4320 hpf lateral and iterate until the
    system reads correctly.

## 12. Worked example: the otic vesicle

`src/data/structures/sensory.json`, record ZFA:0000051, as committed in phase 1. It shows a
custom builder with a mirrored placement, size rows, events, two handoffs in the
`overrideNote`, a ZFA end stage Unknown, and the `sizeRefSl` at 72 hpf.

```json
{
  "id": "ZFA:0000051",
  "name": "otic vesicle",
  "synonyms": ["otic capsule", "otocyst", "ov"],
  "system": "sensory",
  "alsoIn": [],
  "zfaParent": "ZFA:0001105",
  "uiParent": "ZFA:0001138",
  "parentRelation": "is_a",
  "definition": "Epithelial sac present beside the fifth rhombomere; forms the semicircular canals dorsally and the otolith organs ventrally, and houses the acoustico-vestibular sensory epithelia (maculae) of hair cells. (Also see Anatomical Atlas entry for ear by T. Whitfield.)",
  "zfinStartStage": "ZFS:0000026",
  "zfinEndStage": "ZFS:0000000",
  "startHpf": 16,
  "endHpf": 17520,
  "visibleFromHpf": 16,
  "modelEndHpf": 72,
  "overrideNote": "Handoff otic_placode_vesicle: seeded from the otic placode at the window start 16 hpf (D9), which equals the ZFA start. Handoff otic_vesicle_ear: the vesicle hands off to the inner ear over 66 to 72 hpf (D9). ZFA end stage Unknown (E008). The uiParent is the vestibuloauditory system until the inner ear record lands in phase 2.",
  "fadeInHpf": 0.15,
  "fadeOutHpf": 0.6,
  "laterality": "paired",
  "pickable": true,
  "sexSpecific": null,
  "aliasChain": [],
  "events": [
    { "hpf": 16, "text": "Otic vesicle term starts (ZFA, 14-19 somites).", "source": "https://zfin.org/zf_info/zfbook/stages/seg_stgs.html" },
    { "hpf": 18, "text": "Lumen forms by cavitation of the otic placode.", "source": "Haddon and Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/" },
    { "hpf": 19.5, "text": "Two otoliths appear.", "source": "Haddon and Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/" },
    { "hpf": 24, "text": "First hair cells in two maculae under the otoliths.", "source": "Haddon and Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/" },
    { "hpf": 36, "text": "Endolymphatic sac evaginates from the dorsal wall.", "source": "Swinburne et al. 2018 eLife 7:e37131 https://elifesciences.org/articles/37131" },
    { "hpf": 42, "text": "Anterior, lateral and posterior protrusions (canal pillars) start to grow, 42 to 48 hpf.", "source": "Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/" },
    { "hpf": 72, "text": "All three canal pillars fused; the inner ear record takes over (D9 otic_vesicle_ear).", "source": "Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/" }
  ],
  "sizes": [
    { "hpf": 18, "stageLabel": "14-19 somites", "dimsMm": { "length": 0.05, "width": 0.035, "height": 0.04 }, "counts": {}, "anglesDeg": {}, "source": "research 03b (estimate; scaled from reference images and body length); Haddon and Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/", "estimate": true, "note": "lumen appears at 18 hpf" },
    { "hpf": 24, "stageLabel": "Prim-5", "dimsMm": { "length": 0.07, "width": 0.045, "height": 0.055 }, "counts": {}, "anglesDeg": {}, "source": "research 03b (estimate; scaled from reference images and body length); https://zfin.org/zf_info/zfbook/stages/phar_stgs.html", "estimate": true, "note": "Kimmel OVL 5 at 24 hpf" },
    { "hpf": 48, "stageLabel": "Long-pec", "dimsMm": { "length": 0.13, "width": 0.09, "height": 0.11 }, "counts": {}, "anglesDeg": {}, "source": "research 03b (estimate; scaled from reference images and body length); https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html", "estimate": true, "note": "Kimmel OVL 1/2 at 48 hpf" },
    { "hpf": 72, "stageLabel": "Protruding-mouth", "dimsMm": { "length": 0.18, "width": 0.12, "height": 0.15 }, "counts": {}, "anglesDeg": {}, "source": "research 03b (estimate; scaled from reference images and body length); https://zfin.org/zf_info/anatomy/dict/ear/ear.html", "estimate": true, "note": "the ear grows by fluid filling during days 1 to 3" }
  ],
  "colorOverride": null,
  "sources": [
    "research 03b otic vesicle and otolith records",
    "spec BG-37",
    "Haddon and Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/",
    "https://zfin.org/zf_info/anatomy/dict/ear/ear.html"
  ],
  "geometry": {
    "kind": "custom",
    "builder": "earVesicle",
    "handoffOut": "otic_vesicle_ear",
    "keyframes": [
      {
        "hpf": 16,
        "placement": { "u": 0.22, "v": 0.2, "w": 0.75, "mirror": true },
        "lengthMm": 0.04, "widthMm": 0.03, "heightMm": 0.03, "wallMm": 0.01,
        "otoliths": [{ "diameterMm": 0.003, "pole": "anterior" }, { "diameterMm": 0.003, "pole": "posterior" }],
        "pillarLengthFraction": 0,
        "canals": { "loopDiameterMm": 0.09, "tubeDiameterMm": 0.02, "present": false }
      },
      { "hpf": 18, "lengthMm": 0.05, "widthMm": 0.035, "heightMm": 0.04 },
      { "hpf": 19.5, "otoliths": [{ "diameterMm": 0.005, "pole": "anterior" }, { "diameterMm": 0.005, "pole": "posterior" }] },
      { "hpf": 24, "lengthMm": 0.07, "widthMm": 0.045, "heightMm": 0.055, "otoliths": [{ "diameterMm": 0.012, "pole": "anterior" }, { "diameterMm": 0.012, "pole": "posterior" }] },
      { "hpf": 42, "placement": { "u": 0.215 }, "lengthMm": 0.115, "widthMm": 0.08, "heightMm": 0.095, "otoliths": [{ "diameterMm": 0.022, "pole": "anterior" }, { "diameterMm": 0.022, "pole": "posterior" }] },
      { "hpf": 48, "placement": { "u": 0.21 }, "lengthMm": 0.13, "widthMm": 0.09, "heightMm": 0.11, "pillarLengthFraction": 0.25, "otoliths": [{ "diameterMm": 0.025, "pole": "anterior" }, { "diameterMm": 0.025, "pole": "posterior" }] },
      { "hpf": 66, "lengthMm": 0.17, "widthMm": 0.11, "heightMm": 0.14, "pillarLengthFraction": 0.8 },
      { "hpf": 72, "sizeRefSl": 3.25, "lengthMm": 0.18, "widthMm": 0.12, "heightMm": 0.15, "pillarLengthFraction": 1, "otoliths": [{ "diameterMm": 0.03, "pole": "anterior" }, { "diameterMm": 0.035, "pole": "posterior" }] }
    ],
    "estimate": ["placement", "wallMm", "otoliths", "pillarLengthFraction", "canals", "lengthMm at 16, 42 and 66 hpf"],
    "sources": [
      "16 hpf: seed from the otic placode thickening 60 x 40 x 20 um (research 03b otic placode row, estimate); wall about 10 um (research 03b shape note)",
      "18 hpf: 50 x 35 x 40 um, lumen by cavitation (research 03b; Haddon and Lewis 1996)",
      "19.5 hpf: two otoliths of about 5 um (research 03b otolith row; Haddon and Lewis 1996)",
      "24 hpf: 70 x 45 x 55 um, otoliths 12 um (research 03b; BG-37); u 0.22 (BG-37)",
      "42 to 48 hpf: 130 x 90 x 110 um at 48 hpf, otoliths 25 um, pillars start 42 to 48 hpf (research 03b; Geng et al. 2013); u 0.21 at 48 hpf (BG-37)",
      "66 to 72 hpf: 180 x 120 x 150 um at 72 hpf, pillars fused (research 03b; Geng et al. 2013); canal loop 90 um at 72 hpf for the inner ear seed (BG-37); otoliths 30 and 35 um interpolated toward the 120 hpf row (40 and 55 um)",
      "placement v 0.2, w 0.75: lateral to the hindbrain at rhombomere 5, dorsal to the pharynx (research 03b spatial note; estimate)"
    ]
  }
}
```

Notes on the example: the placement `u` moves from 0.22 to 0.21 as the head grows (only `u`
is written at 42 and 48 hpf; `v`, `w` and `mirror` are inherited); the `otoliths` array is
rewritten whole at each change with the same length; `canals.present` stays false until the
inner ear record takes over; the 72 hpf keyframe carries `sizeRefSl` 3.25. A tube example
with `sizeRefSl`-only keyframes is the spinal cord ZFA:0000075 in `nervous.json`; a
`segmentArray` with a `somiteChevron` template is the somite ZFA:0000155 in `axial.json`.

## 13. Validator rules and codes

`node scripts/validate-data.ts` prints `<code> <file>:<id>: <text>` per finding, then
`validate: <n> records, <e> errors, <w> warnings`, and exits 1 when `e > 0`. An `E` rule fails
the run; a `W` rule prints. Flags: `--data <dir>`, `--zfin <dir>`, `--json <path>` (findings as
JSON), `--strict` (every warning is an error), `--strict-handoffs` (W011 becomes E021),
`--emit-schema` (rewrites `docs/schema/*.json`).

| Code | Rule |
|---|---|
| E001 | schema parse (zod); a missing file; a split file that is not a JSON array |
| E002 | every `id`, `zfaParent`, `uiParent`, alias id, handoff id and system root exists in `anatomy_item.txt` |
| E003 | every stage `zfs` exists in `stage_ontology.txt` or `zfa.obo` |
| E004 | `name` equals the ZFIN label |
| E005 | `zfinStartStage` and `zfinEndStage` equal the ZFIN columns |
| E006 | `startHpf` and `endHpf` equal the ZFS bounds of those stages |
| E007 | `visibleFromHpf` or `modelEndHpf` differs from the default only with a non-empty `overrideNote` |
| E008 | a ZFA start stage Unknown has `visibleFromHpf` above 0 (root excepted); a ZFA end stage Unknown has `modelEndHpf` below 4320 with a note |
| E009 | `visibleFromHpf < modelEndHpf` and `fadeInHpf + fadeOutHpf <= modelEndHpf - visibleFromHpf` |
| E010 | keyframes strictly increasing in hpf |
| E011 | every keyframe inside the presence window |
| E012 | `u` in [0, 1] ([0, 1.25] in `fins`), `v` and `w` in [-1, 1], `uStart <= uEnd`, in the static block and every keyframe |
| E013 | one record per id across the structure files |
| E014 | every `uiParent` is a record; exactly one root with `uiParent: null` |
| E015 | no `uiParent` cycle |
| E016 | `part_of`, `is_a`, `develops_from` have their row in `anatomy_relationship.txt` |
| E017 | no alias id is a record; alias windows are non-empty and contiguous |
| E018 | `system` is in `systems.json`; `alsoIn` does not repeat it |
| E019 | `sizeRefSl` on every keyframe at or after 72 hpf and on none before |
| E020 | every size row has a non-empty `source` |
| E021 | handoff ids unique; SL windows resolve; the window is ordered; every `from`, `to`, `driver` is a record (with `--strict-handoffs`; else W011); the `driver` is a `from` id or `withinRecord` |
| E022 | 44 stage rows, contiguous from 0, ZFIN values, no Unknown row |
| E023 | time-axis segments contiguous 0 to 4320, shares sum to 1 |
| E024 | 18 headline ticks, increasing, each starting its stage, the D7 list |
| E025 | growth sorted; lengths and SL non-decreasing; SL never returns to null |
| E026 | canonical events match D8; canonical presence windows (`CANONICAL_WINDOWS`) hold for every record that exists |
| E027 | 15 systems with unique `paletteSlot` and `order`; roots in ZFA |
| E028 | `colorOverride` only on the D10 exception list |
| E029 | every keyframe builds at both levels with finite positions and unit normals; convex kinds have outward normals |
| E030 | the static block plus the first keyframe cover the required parameters of the kind; a custom kind names its builder |
| E031 | `body.json` checks and equality with a fresh `scripts/gen-body.ts` run |
| E032 | no fade at the axis start (`visibleFromHpf` 0) or at the clamped axis end (DM-36) |
| E033 | every handoff `driver` and `derived` `sourceId` has geometry whose keyframes cover the target's start |
| E034 | handoff windows: `to` starts at the window start (or its earlier ZFA start), `from` ends at the window end, both name the handoff in `overrideNote`, the target's first keyframe lies inside `[visibleFromHpf, window end]` |
| E035 | array parameters (`outlineMm`, `profileMm`, `points`, `radiiMm`) keep their length across keyframes |
| E036 | tube and loop sweeps keep `max(radius) x max(curvature) < 0.9` |
| W001 | the first keyframe lies at `visibleFromHpf` (seeded targets excepted) |
| W002 | a group node has at least one child |
| W003 | a `uiParent` in another system without `grouping` or the root as parent |
| W004 | two consecutive keyframes span more than one time-axis segment |
| W005 | a size row outside the presence window |
| W006 | a window over 24 h with one keyframe |
| W007 | a built keyframe protrudes beyond the body box (spine tube, yolk, chorion) plus `boundsMarginMm`; `fins` get a 20 percent margin |
| W008 | a size key outside the allowlist |
| W009 | a group node's window does not contain a descendant's window (DM-30) |
| W010 | `name` is a ZFIN synonym of the label |
| W011 | a handoff `from`, `to` or `driver` id is not a record yet (phase 2 CI passes `--strict-handoffs`) |
| W012 | a source string closes more parentheses than it opens |
| W013 | a string in the record still carries the marker `unverified` |
