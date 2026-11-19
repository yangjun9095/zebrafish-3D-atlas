# 06. Viewer technology options

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Date: 2026-09-06.

This report selects the viewer stack for the zebrafish 3D atlas. The app is a static site
with no backend. It renders 100 to 200 procedural structures, a time axis from 0 hpf
(hours post fertilization) to adult, panels, and search. Two kinds of people maintain it:
a scientist and AI coding agents. Every version number below comes from
`npm view <package> version` and `npm view <package> time` run on 2026-09-06 against the
public npm registry. Every source-code claim about three.js comes from the unpacked
`three@0.185.1` tarball. Other facts carry a URL or the mark "(unverified)".

## 1. Environment and version snapshot

Local machine facts, measured on 2026-09-06:

| Item | Value | How measured |
|---|---|---|
| Node | v22.22.0 | `node --version` |
| npm | 10.9.4 | `npm --version` |
| Google Chrome | 145.0.7632.159 at `/usr/bin/google-chrome` | `google-chrome --version` |
| CPU used for benchmarks | AMD EPYC 7713, 2.83 GHz | `lscpu` |

Latest published versions and the compatibility facts that matter for this project:

| Package | Latest | Published | Peer or engine facts |
|---|---|---|---|
| three | 0.185.1 | 2026-07-01 | package `exports` include `./addons/*`, `./webgpu`, `./tsl` |
| @types/three | 0.185.4 | 2026-08-04 | matches three r185 |
| react, react-dom | 19.2.8 | 2026-07-21 | |
| @react-three/fiber | 9.7.0 | 2026-07-31 | peer `react >=19 <19.3`, `three >=0.156`; `10.0.0-alpha.4` exists |
| @react-three/drei | 10.7.8 | (latest tag) | peer `react ^19`, `three >=0.159`, `@react-three/fiber ^9.0.0`; `11.0.0-alpha.7` published 2026-09-05 |
| @react-three/postprocessing | 3.1.1 | 2026-08-27 | peer `@react-three/fiber >=9.7.0`, `postprocessing ^6.36.0`, `react ^19.0.0` |
| postprocessing | 6.39.4 | 2026-07-27 | peer `three >= 0.168.0 < 0.186.0` |
| vite | 8.2.2 | 2026-08-20 | engine `node ^20.19.0 \|\| >=22.12.0`; Rolldown bundler |
| @vitejs/plugin-react | 6.1.1 | (latest tag) | peer `vite ^8.0.0`; uses Oxc for Refresh |
| typescript | 7.0.2 | 2026-07-08 | native Go compiler; no programmatic API until 7.1 |
| typescript (JS line) | 6.0.3 | 2026-04-16 | last JavaScript-based major |
| typescript-eslint | 8.69.0 | (latest tag) | peer `typescript >=4.8.4 <6.1.0`, `eslint ^8.57 \|\| ^9 \|\| ^10` |
| eslint | 10.10.0 | 2026-09-04 | |
| eslint-plugin-react-hooks | 7.1.1 | (latest tag) | peer includes `eslint ^10.0.0` |
| eslint-plugin-react-refresh | 0.5.6 | (latest tag) | peer `eslint ^9 \|\| ^10` |
| @react-three/eslint-plugin | 0.1.2 | (latest tag) | |
| tailwindcss, @tailwindcss/vite | 4.3.3 | 2026-07-16 | peer `vite ^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` |
| zustand | 5.0.15 | 2026-08-13 | drei 10 already depends on `zustand ^5.0.1` |
| zod | 4.5.4 | 2026-08-29 | `z.toJSONSchema()` targets Draft 2020-12 |
| vitest | 5.0.0 | 2026-09-03 | engine `node ^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`; peer `vite ^6.4 \|\| ^7 \|\| ^8` |
| @playwright/test | 1.63.0 | 2026-09-04 | |
| leva | 0.10.1 | 2025-10-31 | peer `react ^18 \|\| ^19` |
| tweakpane | 4.0.5 | 2024-11-03 | framework-agnostic |
| r3f-perf | 7.2.3 | (latest tag) | peer `@react-three/fiber >=8.0`, `three >=0.133` |

Three conclusions follow from this table.

React 19.2.8 sits inside the `>=19 <19.3` window of @react-three/fiber 9.7.0. three 0.185.1
sits inside the peer range of every three-dependent package. postprocessing 6.39.4 caps three
at `< 0.186.0`, so three r186 must wait for a postprocessing release.

TypeScript 7.0.2 is the `latest` tag, but typescript-eslint 8.69.0 accepts only
`typescript <6.1.0`. The 7.0 announcement says tools that need the programmatic API must wait
for 7.1 (https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). Use TypeScript
6.0.3 for `tsc --noEmit` and lint. TypeScript 6.0 changed the defaults to `strict: true`,
`module: esnext`, and `types: []` (https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/).

Vite 8 (released 2026-03-12) bundles with Rolldown and strips types itself, so the TypeScript
version affects only `tsc` and lint (https://vite.dev/blog/announcing-vite8).

## 2. Framework choice

### Options

Option A is vanilla three.js plus TypeScript, with plain DOM for the panels. Option B is
React 19 plus @react-three/fiber (r3f) 9 plus drei 10, with Tailwind for the panels.

The reference project human-atlas takes a hybrid path. Its `app/scene.tsx` (134 lines) creates
a `WebGLRenderer`, `OrbitControls`, and a `PMREMGenerator` inside one React `useEffect`.
React renders only the UI (local clone, `app/scene.tsx` lines 1 to 40). That works because
human-atlas draws one merged batch per system. The zebrafish atlas has 100 to 200 independent
structures, each with its own lifetime, keyframes, material state, hover state, and label.

### Comparison

| Concern | A: vanilla three + TS | B: React + r3f + drei |
|---|---|---|
| Scene graph for 150 structures | manual arrays and `scene.add`; disposal by hand | one `<Structure>` component per data row; React mounts and unmounts with lifetime |
| Picking and hover | own `Raycaster` loop, own tap-versus-drag logic (human-atlas wrote `pointer-tap.ts`) | `onPointerOver`, `onClick`, `instanceId` on events, built in |
| UI panels, search, timeline | DOM by hand or a second framework | same React tree, same state store |
| State sync between UI and 3D | custom event bus | zustand store read by both |
| Camera fit, labels, environment, outlines | write or import from `three/addons` | drei `Bounds`, `Html`, `Text`, `Environment`, `Outlines`, `CameraControls` |
| Testability | pure TS modules | pure TS modules for geometry; components need a DOM |
| Maintainer familiarity | scientist must learn three.js lifecycle | agents produce r3f code reliably; JSX mirrors the data model |
| Dependency risk | three only | r3f and drei track React majors; both are in alpha for the next major |

### Recommendation

Choose option B. Put every geometry builder, interpolator, and data loader in pure TypeScript
modules under `src/core/` with no React import. The React layer under `src/app/` only maps
data to components. This split keeps vitest fast and keeps the option to swap the view layer.

Sketch of the component per structure:

```ts
// src/app/Structure.tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { buildMorphGeometry } from '../core/geometry/morph'
import { materialFor } from '../core/materials'
import { useAtlas } from '../state/store'
import type { StructureDef } from '../core/schema'

export function Structure({ def }: { def: StructureDef }) {
  const mesh = useRef<Mesh>(null)
  const geometry = useMemo(() => buildMorphGeometry(def), [def])
  const select = useAtlas((s) => s.select)
  useFrame(() => {
    const t = useAtlas.getState().t
    const m = mesh.current
    if (!m || !m.morphTargetInfluences) return
    const { visible, weights } = geometry.userData.weightsAt(t)
    m.visible = visible
    for (let i = 0; i < weights.length; i++) m.morphTargetInfluences[i] = weights[i]
  })
  return <mesh ref={mesh} geometry={geometry} material={materialFor(def.system)}
               onClick={(e) => { e.stopPropagation(); select(def.id) }} />
}
```

The `useFrame` callback reads the store with `getState()` and never calls `setState`.
The r3f performance guide warns against state updates inside `useFrame`
(https://r3f.docs.pmnd.rs/advanced/scaling-performance).

## 3. Procedural organic geometry

### Body: generalized cylinder along a spine

The body is a tube along a `CatmullRomCurve3`. three r185 supports the curve types
`centripetal`, `chordal`, and `catmullrom` with a `tension` parameter
(`src/extras/curves/CatmullRomCurve3.js` lines 117 to 118). Use `centripetal`; it avoids
loops when control points are unevenly spaced. `Curve.computeFrenetFrames(segments, closed)`
returns tangents, normals, and binormals (`src/extras/core/Curve.js` line 338). It propagates
the normal from one segment to the next, so the frame does not flip along a gently bent spine.

Each station has three radii: dorsal, ventral, and lateral. The cross-section is two half
ellipses that share the lateral radius. A superellipse exponent `n` (2 gives an ellipse,
higher gives a boxier section) is one more parameter per station.

```ts
// src/core/geometry/generalizedCylinder.ts
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'

export interface Station { u: number; dorsal: number; ventral: number; lateral: number; n?: number }
export interface CylinderParams { spine: [number, number, number][]; stations: Station[]; rows: number; radial: number }

const sgnPow = (x: number, p: number) => Math.sign(x) * Math.pow(Math.abs(x), p)

export function buildGeneralizedCylinder(p: CylinderParams): BufferGeometry {
  const curve = new CatmullRomCurve3(p.spine.map((v) => new Vector3(...v)), false, 'centripetal', 0.5)
  const frames = curve.computeFrenetFrames(p.rows, false)
  const pos: number[] = [], idx: number[] = []
  const c = new Vector3()
  for (let i = 0; i <= p.rows; i++) {
    const u = i / p.rows
    curve.getPointAt(u, c)
    const s = sampleStations(p.stations, u)          // cubic interpolation across stations
    const N = frames.normals[i], B = frames.binormals[i], n = s.n ?? 2
    for (let j = 0; j < p.radial; j++) {              // no seam column: index wraps
      const a = (j / p.radial) * Math.PI * 2
      const cy = sgnPow(Math.sin(a), 2 / n), cx = sgnPow(Math.cos(a), 2 / n)
      const ry = cy >= 0 ? s.dorsal : s.ventral
      pos.push(c.x + N.x * ry * cy + B.x * s.lateral * cx,
               c.y + N.y * ry * cy + B.y * s.lateral * cx,
               c.z + N.z * ry * cy + B.z * s.lateral * cx)
    }
  }
  for (let i = 0; i < p.rows; i++) for (let j = 0; j < p.radial; j++) {
    const a = i * p.radial + j, b = a + p.radial, j1 = (j + 1) % p.radial
    idx.push(a, b, i * p.radial + j1, b, (i + 1) * p.radial + j1, i * p.radial + j1)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(idx)                       // add a (u, j / radial) uv attribute for stripes
  g.computeVertexNormals()
  return g
}
```

Design notes for this builder:

- Ends. Taper the radii to a small value at `u = 0` and `u = 1` and add one cap vertex per end.
  Do not taper to zero; degenerate triangles produce broken normals.
- Seam. The index wraps around the circumference, so no seam column is duplicated and
  `computeVertexNormals()` gives one smooth normal per vertex. The UV wraps at `v = 1`; the
  atlas uses UVs only for stripes and gradients, so the wrap is acceptable.
- Station sampling. Author 12 to 16 named stations (snout, eye, otic, pectoral, vent, ...)
  per keyframe and interpolate them across the 64 rows. The keyframe stays small.
- Row and radial counts never change for a structure. Section 4 depends on this.

### Organs, tubes, lathes, sheets

| Structure type | Primitive | three API | Notes |
|---|---|---|---|
| eye, brain vesicles, liver, kidney lobes | superellipsoid | custom builder or `three/addons/geometries/ParametricGeometry.js` | exponents `e1`, `e2` give egg and bean shapes |
| lens, otic vesicle, swim bladder, yolk | lathe | `LatheGeometry(points, segments, phiStart, phiLength)` (`src/geometries/LatheGeometry.js` line 36) | profile is a 2D Catmull-Rom of 6 to 10 points |
| gut, notochord, vessels, neural tube | tube | `TubeGeometry(path, tubularSegments, radius, radialSegments, closed)` (`src/geometries/TubeGeometry.js` line 45) or the builder above with equal radii | the builder above supports a varying radius; `TubeGeometry` does not |
| fins, fin fold, pericardium | thick sheet | custom builder | see below |
| somites, neuromasts, scales, fin rays | segment array | `InstancedMesh` | one draw call per array |

Fins. `ExtrudeGeometry` (`src/geometries/ExtrudeGeometry.js` line 40) gives uniform thickness
and hard edges, and a fin thins to its margin. Build a fin as a parametric grid with chord `u`
and span `v`. Displace two copies of the grid by `±thickness(u, v) / 2` along the grid normal
and join them with a rim strip. Thickness falls to a small floor at the margin. The median fin
fold uses the same builder with a long chord along the spine.

Yolk. The yolk ball and the yolk extension form one axisymmetric body. Model both as a single
`LatheGeometry` whose profile has a bulge and a tail. This gives one smooth mesh, one
material, and stable topology across time. A sphere plus a tube would show a crease where
they meet whenever the yolk is translucent.

### Marching cubes and signed distance fields

three r185 ships `three/addons/objects/MarchingCubes.js` (present in the tarball). A signed
distance field with a smooth-minimum union would blend the yolk into the body. The atlas
should not use it for the main model. The vertex count and order change with the field,
which breaks morph targets and stable picking. A 64^3 field is 262,144 cells per update, and
gradient normals look soft on small organs. Keep marching cubes as a fallback for a blend
that the lathe profile cannot solve.

### Vertex budget per structure

The counts below are arithmetic from the tessellation parameters.

| Structure | Rows x radial | Vertices | Triangles |
|---|---|---|---|
| body (generalized cylinder) | 64 x 32 | 2,080 | 4,096 |
| large organ (superellipsoid) | 24 x 16 | 425 | 768 |
| tube (gut, notochord) | 48 x 12 | 588 | 1,152 |
| fin sheet (two layers plus rim) | 24 x 8 x 2 | 450 | 832 |
| somite (instanced, per instance) | 8 x 8 | 81 | 128 |

At 150 structures with a mix like this, the whole model is under 100,000 vertices and
about 150,000 triangles per keyframe. Section 8 sets the on-screen budget.

## 4. Time interpolation

### Three strategies

Strategy 1: regenerate geometry each frame from interpolated parameters.

Strategy 2: precompute one geometry per keyframe with identical topology and let the GPU
blend them through `morphTargetInfluences`.

Strategy 3: evaluate the parametric surface in a vertex shader from uniforms.

### Measured cost of strategy 1

I ran a benchmark in Node 22.22 with `three@0.185.1` on one core of the AMD EPYC 7713. The
script ran in a working directory outside this repository and is not committed here, so the
numbers below cannot be reproduced from the tree. It rebuilt 150 generalized cylinders of 64 x 24 stations
(1,625 vertices each, 243,750 vertices total) from a moving spine and recomputed normals.

| Measurement | Value |
|---|---|
| Rebuild all 150 structures, positions plus `computeVertexNormals()` | 59.9 ms per frame |
| Of which `computeVertexNormals()` alone | 38.7 ms per frame |
| Rebuild per structure | 0.40 ms |
| Bytes uploaded to the GPU per frame (positions plus normals) | 5.85 MB |
| CPU linear blend of all 243,750 positions between two arrays | 1.85 ms per frame |

A 60 fps frame is 16.7 ms. Strategy 1 spends 60 ms on the CPU before the GPU draws anything.
A laptop core is not faster than this server core. Strategy 1 fails the budget by a factor of
about 4, even before adding organs and fins.

### Why strategy 2 fits

three r185 stores morph targets in a `DataArrayTexture` with one layer per target
(`src/renderers/webgl/WebGLMorphtargets.js` lines 20 to 41). The old limit of 8 morph
attributes no longer applies; the texture size is the limit. The CPU work per frame is two
float writes per mesh. Section 3 fixes the tessellation per structure, so every keyframe of a
structure has identical topology by construction. No mesh correspondence problem exists.

Memory. Each keyframe costs `vertices x 3 floats x 4 bytes` for positions and the same for
normals. Each structure keeps only its own 3 to 8 keyframes. Take 150 structures with 6
keyframes of 1,625 vertices each. Positions plus normals cost 150 x 6 x 1,625 x 24 bytes =
35.1 MB of GPU memory. Storing all 44 ZFS stages per structure would cost 257 MB and is
unnecessary.

Build time. At 0.40 ms per keyframe (measured), 150 x 6 keyframes build in 0.36 s. Do this
in a Web Worker at load, or precompute a binary file at build time.

Only two keyframes are active at a time. Set the two bracketing influences and zero the rest:

```ts
// src/core/time/weights.ts
export function weightsAt(hpf: number, keyHpf: number[]): { visible: boolean; weights: number[] } {
  const w = new Array<number>(keyHpf.length).fill(0)
  if (hpf < keyHpf[0] || hpf > keyHpf[keyHpf.length - 1]) return { visible: false, weights: w }
  let k = 0
  while (k < keyHpf.length - 2 && hpf > keyHpf[k + 1]) k++
  const a = keyHpf[k], b = keyHpf[k + 1]
  const s = b === a ? 0 : (hpf - a) / (b - a)
  w[k] = 1 - s
  w[k + 1] = s
  return { visible: true, weights: w }
}
```

Keyframe 0 is the base `position` attribute, so the array of `morphAttributes.position`
holds keyframes 1 to N-1 and weight 0 maps to "no target active". Also fill
`morphAttributes.normal`, so lighting blends with the shape.

### Why not strategy 3

A vertex shader that evaluates the surface from uniforms has zero CPU cost and no memory
per keyframe. It needs one shader per primitive family, analytic normals in GLSL, and a CPU
mirror of each mesh for the raycaster. Revisit it only if strategy 2 runs out of memory.

### Structures that appear and disappear

Each structure carries `start_hpf` and `end_hpf` derived from the ZFA start and end stages
in `anatomy_item.txt`. Set `mesh.visible = false` outside that window; an invisible mesh costs
no draw call. Inside a fade window at each end, blend `material.opacity` from 0 to 1 and the
scale from 0.7 to 1. Set `material.transparent = true` only during the fade and restore
an opaque material after it. The sorting problems of section 5 then stay confined to the
fade. A default fade window of 10 percent of the first stage duration keeps early stages
(some last 15 minutes) responsive.

### Structures that split

ZFA gives the timing. The heart tube (ZFA:0000360) runs from Prim-5 (24 hpf) to Prim-25
(36 to 42 hpf). The atrium (ZFA:0000471) and the cardiac ventricle (ZFA:0000009) start at
High-pec (42 hpf). Source: `anatomy_item.txt` and `stage_ontology.txt`. Model the parent and
the children as separate structures and add a `handoff` record:
`{ "from": ["ZFA:0000360"], "to": ["ZFA:0000471", "ZFA:0000009"], "t0": 36, "t1": 42 }`.
During `[t0, t1]` the parent fades out and the children fade in. The author makes the
children's first keyframe fit inside the parent's last keyframe, so the union looks
continuous. The viewer needs no topology surgery.

### Structures that change topology

The median fin fold (ZFA:0000040) runs from 26+ somites (22 hpf) to Larval Day 5
(120 to 144 hpf). The dorsal fin (ZFA:0001173), anal fin (ZFA:0001162), and caudal fin
(ZFA:0001058) are separate ZFA terms (`anatomy_item.txt`). Use the same `handoff` record:
the fold's last keyframes carry notches, and the three fins fade in under it. A per-vertex
alpha mask on one sheet needs a custom shader and complicates picking; I rejected it.

## 5. Interaction and rendering

### Picking and hover

r3f attaches a `Raycaster` to the canvas and dispatches `onPointerOver`, `onPointerOut`, and
`onClick` per mesh (https://r3f.docs.pmnd.rs/api/canvas, `raycaster` prop). three tests the
bounding sphere before triangles, so 150 meshes of 1,000 to 4,000 triangles raycast within a
frame. Instanced meshes report `instanceId` in the event. Two rules make nested organs pickable:

1. A structure in ghost state (opacity below 0.3) moves to a raycast-excluded layer through
   `raycaster.layers`, so a click passes through the body to the liver.
2. `event.stopPropagation()` on the first hit keeps a click from selecting the whole stack.

Hover uses drei `useCursor` for the pointer style and a small emissive tint on the hovered
material. Hover never uses a postprocessing pass; hover changes every frame during pointer
motion and must stay cheap.

### Selection outline

| Option | Mechanism | Cost | Fit |
|---|---|---|---|
| @react-three/postprocessing `Outline` inside `Selection` | edge detection on a selection mask; options `edgeStrength`, `visibleEdgeColor`, `hiddenEdgeColor`, `xRay` (default true), `blur`, `kernelSize`, `resolutionScale` (default 0.5), `multisampling` (postprocessing type definitions) | one mask render plus two full-screen passes; the composer replaces canvas MSAA unless `multisampling` is set | best for nested organs; `xRay` draws the hidden outline of a selected organ through the body |
| drei `Outlines` | inverted hull child mesh; props `thickness`, `color`, `screenspace`, `angle` (`core/Outlines.d.ts`) | one extra draw call per selected mesh; no composer | good for convex organs; concave shapes show hull intersections |
| emissive tint | `material.emissive` | free | conflicts with a categorical color palette |
| stencil outline | two passes with stencil writes | manual render ordering | no advantage over the two options above |

Recommendation: ship drei `Outlines` as the default. Keep `@react-three/postprocessing` in
the stack for a "presentation quality" toggle that enables `Outline` with `xRay` and SMAA.
Measure both on the target laptop before choosing the default for talks.

```ts
import { EffectComposer, Outline, Selection, Select, SMAA } from '@react-three/postprocessing'

<Selection>
  <EffectComposer multisampling={4}>
    <Outline edgeStrength={4} visibleEdgeColor={0x1d4ed8} hiddenEdgeColor={0x93c5fd} xRay />
    <SMAA />
  </EffectComposer>
  <Select enabled={selectedId === def.id}><Structure def={def} /></Select>
</Selection>
```

### Labels

| Option | Where it renders | Strengths | Limits |
|---|---|---|---|
| drei `Html` | DOM overlay; props `occlude` (`boolean`, `'raycast'`, `'blending'`), `distanceFactor`, `zIndexRange`, `center`, `transform` (`web/Html.d.ts`) | real text, CSS, links, screen readers | outside the WebGL canvas, so PNG export omits it |
| three `CSS2DRenderer` | DOM overlay (`examples/jsm/renderers/CSS2DRenderer.js`) | same idea for vanilla code | no occlusion helper; duplicate of `Html` under r3f |
| drei `Text` (troika-three-text 0.52.x) | in the scene as signed distance field glyphs; props `font`, `fontSize`, `anchorX`, `sdfGlyphSize` (`core/Text.d.ts`) | crisp at any zoom, captured in exports, occluded like geometry | one draw call per label; no CSS |

Recommendation: `Html` for interactive labels in normal mode, `Text` for labels that must
appear in exported PNGs. The store holds a `labelMode: 'html' | 'scene' | 'none'` flag.

### Transparency for nested organs

three sorts transparent objects back to front by object center, never per triangle. A closed
translucent body therefore shows its own back faces through its front faces in a random
order. Use these settings for a ghosted structure:

```ts
material.transparent = true
material.opacity = 0.15
material.depthWrite = false   // organs behind the ghost still draw
material.side = FrontSide     // the back wall never shows
mesh.renderOrder = 10         // ghosts draw after opaques
```

`MeshPhysicalMaterial` supports `transmission`, `thickness`, `ior`, and `attenuationDistance`
(`src/materials/MeshPhysicalMaterial.js` lines 146 to 300). Transmission renders the opaque
scene once more into a target sized by `renderer.transmissionResolutionScale`
(`src/renderers/WebGLRenderer.js` lines 289 and 2013). Reserve it for at most two structures,
such as the lens and the yolk. drei `MeshTransmissionMaterial` samples that target several
times; do not use it on an integrated GPU by default.

### Lighting and materials

Goal: a clean studio look with flat, readable colors.

- Environment. drei `Environment preset="studio"` downloads `studio_small_03_1k.hdr` at
  runtime from `https://raw.githack.com/pmndrs/drei-assets/<sha>/hdri/`
  (`core/useEnvironment.js` line 8). A talk on conference Wi-Fi must not depend on that host.
  Copy the HDR into `public/hdri/` and pass `files="/hdri/studio_small_03_1k.hdr"`. Poly Haven
  publishes its HDR files under CC0 (unverified for this file). The alternative is
  `three/addons/environments/RoomEnvironment.js`, which needs no download; human-atlas uses
  it (`app/scene.tsx` line 24).
- Material. `MeshPhysicalMaterial` with `roughness` 0.55 to 0.7, `metalness` 0, and
  `clearcoat` 0.1 for a wet surface. One shared material per organ system.
- Tone mapping. r3f applies `ACESFilmicToneMapping` unless `flat` is set
  (https://r3f.docs.pmnd.rs/api/canvas). ACES shifts hue and saturation, which hurts a
  categorical palette. three r185 also offers `AgXToneMapping` and `NeutralToneMapping`
  (`src/constants.js` lines 454 to 482). Use `NeutralToneMapping` at exposure 1.0, so the
  legend color matches the organ color.
- Upgrade caution. three r181 changed PBR energy conservation and r183 moved the
  `RoomEnvironment` scene; both change the look
  (https://github.com/mrdoob/three.js/wiki/Migration-Guide). Pin three and re-baseline the
  screenshots after each upgrade.

### Camera

- Perspective at 30 to 35 degrees vertical field of view for talks; human-atlas uses 34
  (`app/scene.tsx` line 22). Orthographic for the lateral, dorsal, and ventral views, where
  a viewer compares lengths. Offer both; drei has `OrthographicCamera`.
- Controls. drei `CameraControls` wraps camera-controls 3.1.2 and supports smooth
  `setLookAt`, `fitToBox`, and `fitToSphere`. Prefer it over `OrbitControls` for scripted
  moves between named views.
- Fit to bounds. drei `Bounds` exposes `useBounds().refresh(object).fit()` and `clip()` with
  a `margin` prop (`core/Bounds.d.ts` lines 19 to 36). Refit on an explicit stage jump, on the
  `F` key, and on first load. Do not refit on every scrub; a camera that moves while the
  embryo grows disorients the audience. During playback, damp the camera distance toward the
  whole-organism bounding sphere instead.

### Presentation mode and PNG export

Presentation mode hides the panels, sets `labelMode` to `scene`, and reads `?ui=0`. r3f
creates the renderer with `alpha=true` (https://r3f.docs.pmnd.rs/api/canvas), so a null
`scene.background` gives a transparent canvas.

Path 1: raise `renderer.setPixelRatio(k)` for one frame, render, call
`canvas.toDataURL('image/png')`, and restore. This needs `preserveDrawingBuffer: true` or a
synchronous read right after `gl.render()` in the same task. It disturbs the visible canvas
and is capped by the on-screen size times `k`.

Path 2: render into a `WebGLRenderTarget` at the target size, read it back with
`renderer.readRenderTargetPixelsAsync` (`src/renderers/WebGLRenderer.js` line 3153), and
encode with an `OffscreenCanvas`. For sizes above `MAX_RENDERBUFFER_SIZE`, render tiles with
`camera.setViewOffset(fullWidth, fullHeight, x, y, w, h)` (`src/cameras/PerspectiveCamera.js`
lines 282 to 286) and stitch them. Query the limit with
`gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)` at runtime.

Recommendation: path 2 with tiling. It never touches the on-screen frame and scales to
poster sizes. `Html` labels appear in neither path; presentation mode switches to `Text`
labels before export. Note that WebGL pixel rows start at the bottom, so flip them before
encoding.

### Animation playback

The store holds `t` (hpf), `playing`, `speed`, and `loop`. A single `useFrame((_, dt) => ...)`
in a `Clock` component advances `t` and writes it with `setState` at most once per frame.
Stage durations span 0.25 h (cleavage stages) to 15,360 h (adult) (`stage_ontology.txt`),
so a linear hpf slider is unusable. The timeline gives every stage equal width and
interpolates hpf inside a stage. Speed presets are "1 stage per second" and "1 hpf per second".

### URL state

Encode the view in the query string, never in a path:
`?t=24&s=ZFA:0000114&view=lateral&cam=persp&ui=0`. Read it on load and write it with
`history.replaceState` debounced to 250 ms. A query string needs no router and no 404
fallback on GitHub Pages. A slide links straight to a stage and a selected structure.

```ts
// src/core/url.ts
import { z } from 'zod'
export const UrlState = z.object({
  t: z.coerce.number().min(0).max(17520).default(24),
  s: z.string().regex(/^ZFA:\d{7}$/).optional(),
  view: z.enum(['lateral', 'dorsal', 'ventral', 'anterior', 'free']).default('lateral'),
  cam: z.enum(['persp', 'ortho']).default('persp'), ui: z.coerce.number().int().min(0).max(1).default(1),
})
export type UrlState = z.infer<typeof UrlState>
export const parseUrl = (search: string) => UrlState.parse(Object.fromEntries(new URLSearchParams(search)))
```

### Keyboard shortcuts

| Key | Action |
|---|---|
| Space | play or pause |
| Left, Right (Shift: 1 hpf) | previous or next stage boundary |
| F | fit camera to the whole organism |
| L, D, V, A, O | lateral, dorsal, ventral, anterior view; toggle orthographic |
| / | focus search (human-atlas uses the same key, `app/page.tsx` line 18) |
| Esc | clear selection |
| P, E, ? | presentation mode; export PNG; show this table |

Ignore shortcuts while focus is in an input or textarea. drei `KeyboardControls` maps keys
to named actions; a 30-line hook does the same without the dependency.

### Reduced motion

Read `window.matchMedia('(prefers-reduced-motion: reduce)')`. When it matches, disable
auto-play on load, make camera transitions instant, shorten fades to 0.1 s, and turn off the
outline pulse. Expose the same switch in settings.

## 6. Data pipeline

### Files

| File | Content | Source |
|---|---|---|
| `data/stages.json` | 44 stages: ZFS id, ZDB id, name, group, start hpf, end hpf | `stage_ontology.txt` (44 rows plus "Unknown") |
| `data/structures.json` | selected ZFA terms: id, name, synonyms, definition, part-of parent, develops-from, start hpf, end hpf, color, geometry kind | `anatomy_item.txt` (3,113 terms), `anatomy_relationship.txt` (5,992 rows: 3,226 is_a, 2,163 part of, 527 develops from), `zfa.obo` |
| `data/keyframes/<ZFA_id>.json` | ordered keyframes `{ hpf, params }` for one structure | authored in the inspector |
| `data/handoffs.json` | split and topology handoffs | authored |

### Schema

Use zod 4 as the single source of truth and emit JSON Schema for editors:

```ts
// src/core/schema.ts
import { z } from 'zod'

const Station = z.object({ u: z.number().min(0).max(1), dorsal: z.number().positive(),
  ventral: z.number().positive(), lateral: z.number().positive(), n: z.number().min(1).max(8).optional() })

export const GeometryParams = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('generalizedCylinder'), spine: z.array(z.tuple([z.number(), z.number(), z.number()])).min(3),
    stations: z.array(Station).min(3), rows: z.number().int().min(8), radial: z.number().int().min(6) }),
  z.object({ kind: z.literal('superellipsoid'), center: z.tuple([z.number(), z.number(), z.number()]),
    radii: z.tuple([z.number(), z.number(), z.number()]), e1: z.number(), e2: z.number(), rotation: z.tuple([z.number(), z.number(), z.number()]) }),
  z.object({ kind: z.literal('lathe'), axis: z.tuple([z.number(), z.number(), z.number()]), profile: z.array(z.tuple([z.number(), z.number()])).min(4), segments: z.number().int() }),
  // 'tube', 'sheet', and 'segmentArray' follow the same pattern
])

export const Keyframe = z.object({ hpf: z.number().min(0).max(17520), params: GeometryParams, ease: z.enum(['linear', 'smooth']).default('linear') })

export const StructureDef = z.object({
  id: z.string().regex(/^ZFA:\d{7}$/), name: z.string(), synonyms: z.array(z.string()).default([]),
  partOf: z.string().regex(/^ZFA:\d{7}$/).optional(), developsFrom: z.array(z.string()).default([]),
  startHpf: z.number(), endHpf: z.number(), system: z.string(), color: z.string().regex(/^#[0-9a-f]{6}$/i),
  keyframes: z.array(Keyframe).min(1),
})
export type StructureDef = z.infer<typeof StructureDef>
export const jsonSchema = () => z.toJSONSchema(StructureDef)   // Draft 2020-12
```

`z.toJSONSchema()` targets Draft 2020-12 and copies `.meta()` fields into the output
(https://zod.dev/json-schema). Commit the generated `schema/structure.schema.json` so VS Code
validates the JSON files while a person edits them.

### Validation script

`scripts/validate-data.ts` runs with plain `node scripts/validate-data.ts`; Node 22.22 strips
types (measured: `node t.ts` printed `ts ok 2`). It checks:

1. Every structure id exists in `anatomy_item.txt`, and the name matches.
2. `startHpf` and `endHpf` agree with the ZFA start and end stages through `stages.json`.
3. Keyframes are sorted by `hpf`, lie inside `[startHpf, endHpf]`, and share one `kind`.
4. All keyframes of one structure have equal `rows`, `radial`, `segments`, station count,
   and profile length. This guarantees identical topology for morph targets.
5. Handoff ids exist, and `t0 < t1` lies inside both lifetimes.
6. Building each keyframe produces no `NaN` and a bounding box inside the body box.

Run it in `npm run check` next to `tsc --noEmit`.

### Authoring keyframes in an inspector panel

The inspector is a dev-only React panel. It shows sliders for the parameters of the current
structure at the nearest keyframe. A button "add keyframe at t" copies the interpolated
parameters into a new keyframe. A button "save" writes the file.

Control library. leva 0.10.1 binds a folder of sliders to React state with one `useControls`
hook and declares React 19 support. Its last release is 2025-10-31. tweakpane 4.0.5 is
framework-agnostic and last released 2024-11-03. Use leva; fall back to tweakpane if leva
breaks on a React upgrade.

Write-back. A browser page cannot write into the repository. Three options exist:

1. A Vite dev-server middleware receives `POST /__atlas/save` and writes the JSON file. It
   exists only under `vite dev`, so production stays static.
2. The File System Access API (`showSaveFilePicker`) saves through a dialog. Chrome only.
3. Copy to clipboard and paste into the editor.

Use option 1 with option 3 as the fallback:

```ts
// vite.config.ts (dev-only save endpoint; validate the body with StructureDef before writing)
const saveKeyframes = (): Plugin => ({
  name: 'atlas-save-keyframes', apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__atlas/save', async (req, res) => {
      let body = ''; for await (const chunk of req) body += chunk
      const { id, json } = JSON.parse(body) as { id: string; json: unknown }
      if (!/^ZFA:\d{7}$/.test(id)) { res.statusCode = 400; return res.end() }
      await writeFile(`data/keyframes/${id.replace(':', '_')}.json`, JSON.stringify(json, null, 2))
      res.end('ok')
    })
  },
})
export default defineConfig({ base: '/zebrafish-3D-atlas/', plugins: [react(), tailwindcss(), saveKeyframes()] })
```

## 7. Testing

### Unit tests: vitest 5.0.0

Vitest 5 requires Node 22.12 or newer and Vite 6.4 or newer (https://vitest.dev/blog/vitest-5);
the local Node 22.22 and Vite 8.2.2 satisfy both. Geometry builders create `BufferGeometry`
objects without a WebGL context, so these tests run in plain Node:

- schema: every JSON file parses and the rules of section 6 hold;
- geometry: equal vertex and index counts across keyframes; no `NaN`; unit normals within 1e-3;
- interpolation: `weightsAt` returns exact weights at keyframe times and the weights sum to 1;
- URL: `parseUrl` round-trips with `serializeUrl`.

### Browser tests: Playwright 1.63.0 with system Chrome

Playwright runs against the installed Google Chrome with `channel: 'chrome'`, and it does not
install a browser for that channel (https://playwright.dev/docs/browsers). The docs state that
the current Playwright version supports the Stable and Beta channels. Chrome 145 shipped on
2026-02-10 (https://chromereleases.googleblog.com/2026/02/stable-channel-update-for-desktop_10.html),
so the local Chrome is several releases behind current stable. Compatibility of Playwright
1.63.0 with Chrome 145 is therefore (unverified); run one smoke test first. On CI, use
`npx playwright install chromium` instead.

This HPC node has no GPU. Chromium removed SwiftShader as an automatic WebGL fallback; the
switch `--enable-unsafe-swiftshader` opts back in for testing
(https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md).

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  projects: [{
    name: 'chrome',
    use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
      launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } },
  }],
})
```

Visual regression. One test per stage and view opens
`/?t=<mid hpf>&view=lateral&ui=0&anim=0`, waits for `[data-atlas-ready="1"]` on the canvas
wrapper, and calls `expect(page).toHaveScreenshot()`. `toHaveScreenshot` defaults to
`animations: 'disabled'`, `threshold: 0.2`, and `scale: 'css'`, and accepts `maxDiffPixels`,
`maxDiffPixelRatio`, `mask`, and `stylePath`
(https://playwright.dev/docs/api/class-pageassertions). Snapshot names carry the browser and
platform suffix, and the docs require baselines from the same environment
(https://playwright.dev/docs/test-snapshots). SwiftShader and a real GPU do not produce the
same pixels. Keep one baseline set per renderer and generate the CI set inside the CI container.

Interaction tests. Click a structure and assert that the info card shows its ZFA id. Press
`Right` and assert that `?t=` moved to the next stage start. Press `E`, intercept the
download, and assert that the PNG has the requested size.

### Static checks

- `tsc --noEmit` with TypeScript 6.0.3. Set `types: ["vite/client"]` explicitly, since 6.0
  defaults `types` to `[]`.
- ESLint 10.10.0 flat config with typescript-eslint 8.69.0, eslint-plugin-react-hooks 7.1.1,
  eslint-plugin-react-refresh 0.5.6, and @react-three/eslint-plugin 0.1.2 (rules
  `no-clone-in-loop`, `no-new-in-loop`, unverified rule names for this version).
- human-atlas uses oxlint for speed (1.81.0 is current). It lacks typed rules; keep ESLint
  as the gate.

### Continuous integration and deploy

One GitHub Actions workflow runs on Node 22. Its steps are `npm ci`, `npm run check` (tsc
plus data validation), `npm run lint`, `npm test`, `npm run build`, and Playwright with bundled
Chromium. The last two steps are `actions/upload-pages-artifact@v5` and
`actions/deploy-pages@v5` (https://vite.dev/guide/static-deploy). Set
`base: '/zebrafish-3D-atlas/'` for a project page on GitHub Pages. Vercel detects Vite without
settings; human-atlas ships a `vercel.json` with `npm ci`, `npm run build`, and `dist`.

## 8. Performance budget

The targets below are proposed budgets, not measurements. Confirm them on the presenter's
laptop and record the numbers in this file.

| Metric | Budget | Reason |
|---|---|---|
| Frame time | 16.7 ms total; GPU 8 ms; JS 4 ms | 60 fps with headroom for the browser compositor |
| Draw calls per frame | 200 | 150 structures plus outline, labels, helpers; the r3f guide says to stay under 1,000 (https://r3f.docs.pmnd.rs/advanced/scaling-performance) |
| Triangles on screen | 600,000 at device pixel ratio 2 | about 4 times the per-keyframe model size from section 3 |
| Morph target GPU memory | 50 MB | section 4 estimate is 35 MB |
| Time to first frame | 2 s on a laptop | keyframe build measured at 0.36 s; the rest is download and shader compile |
| Idle GPU use | 0 | `frameloop="demand"` while paused |

### Instancing

| Repeated element | Count | Mechanism |
|---|---|---|
| somites | 0 to about 34 over time | one `InstancedMesh`; set `count` per frame; matrices from the spine frame at each station |
| neuromasts | tens | one `InstancedMesh` of small spheres |
| scales | hundreds to thousands (juvenile, adult) | one `InstancedMesh` of a flat disc with per-instance matrix |
| fin rays | tens per fin | `InstancedMesh` per fin with per-instance scale, or one `BatchedMesh` for all rays |

`InstancedMesh` in r185 supports per-instance morph weights through `morphTexture` and
`setMorphAt` (`src/objects/InstancedMesh.js` lines 72 to 77), so somites can change shape
along the trunk. `BatchedMesh` supports `addGeometry`, `addInstance`, `setMatrixAt`,
`setColorAt`, `setVisibleAt`, and `optimize` (`src/objects/BatchedMesh.js` lines 560 to 1185).
Use it for repeated elements with different geometries. Morph support in `BatchedMesh` is
(unverified); do not batch structures that morph.

### Other rules

- `frameloop="demand"` plus `invalidate()` on store changes. `invalidate()` schedules at
  most one frame however often it is called (https://r3f.docs.pmnd.rs/advanced/scaling-performance).
- `dpr={[1, 2]}` with drei `PerformanceMonitor` lowering the pixel ratio to 1 during
  playback when frame time exceeds budget.
- Share one material per organ system. A per-mesh `color` needs a per-mesh material; put the
  color in a vertex attribute or a small `onBeforeCompile` uniform instead, as human-atlas
  does with its part-state texture (`app/scene.tsx` lines 50 to 58).
- `transparent: true` on as few meshes as possible; ghosting applies to the body and to
  ancestors of the selection only.
- Dispose geometries and materials in the component cleanup; `Object3D.dispose()` arrives in
  r186 (https://github.com/mrdoob/three.js/wiki/Migration-Guide).
- Debug overlay with r3f-perf 7.2.3 or `renderer.info.render.calls` and `.triangles`. A local
  Playwright test scrubs 10 s of time and asserts frame time p95 under 20 ms on a laptop GPU.
  SwiftShader numbers on CI are not representative.

## 9. Risks and upgrade notes

| Risk | Fact | Mitigation |
|---|---|---|
| postprocessing caps three | peer `three < 0.186.0` | pin three 0.185.1; upgrade three and postprocessing together |
| r3f 10 and drei 11 in alpha | `10.0.0-alpha.4`, `11.0.0-alpha.7` on npm | stay on 9.7.0 and 10.7.8; re-run screenshots before a major upgrade |
| TypeScript 7 lacks the compiler API | typescript-eslint peer `<6.1.0`; API planned for 7.1 | TypeScript 6.0.3 now; move to 7.x when typescript-eslint declares support |
| HDR preset download at runtime | drei fetches from raw.githack.com | ship the HDR in `public/` or use `RoomEnvironment` |
| PBR look shifts across three releases | r181 energy conservation, r183 `RoomEnvironment` change | pin, re-baseline |
| Headless WebGL on CI | Chromium removed the automatic SwiftShader fallback | `--enable-unsafe-swiftshader`; separate baselines |
| WebGPU | three r185 ships `three/webgpu`; postprocessing 6.x targets WebGL only | stay on `WebGLRenderer` for this project |

## 10. Recommended stack

| Package | Version | Why |
|---|---|---|
| three | 0.185.1 | newest release inside every peer range; morph targets in a texture; `readRenderTargetPixelsAsync`; `BatchedMesh` |
| @types/three | 0.185.4 | matches r185 |
| react, react-dom | 19.2.8 | inside r3f's `<19.3` window |
| @react-three/fiber | 9.7.0 | React 19 renderer for three; pointer events; `frameloop="demand"` |
| @react-three/drei | 10.7.8 | `Bounds`, `Html`, `Text`, `Outlines`, `CameraControls`, `Environment`, `Instances`, `PerformanceMonitor` |
| @react-three/postprocessing | 3.1.1 | `Outline` with `xRay` and `SMAA` for presentation mode |
| postprocessing | 6.39.4 | peer of the line above |
| zustand | 5.0.15 | one store for time, selection, camera, and UI; already a drei dependency |
| zod | 4.5.4 | schema, URL parsing, JSON Schema export |
| vite | 8.2.2 | static build, dev-only save endpoint, `base` for GitHub Pages |
| @vitejs/plugin-react | 6.1.1 | React Refresh on Vite 8 |
| tailwindcss, @tailwindcss/vite | 4.3.3 | panels and timeline styling |
| typescript | 6.0.3 | last version typescript-eslint accepts; strict defaults |
| eslint | 10.10.0 | flat config gate |
| typescript-eslint | 8.69.0 | typed rules; supports ESLint 10 |
| eslint-plugin-react-hooks | 7.1.1 | hook rules; supports ESLint 10 |
| eslint-plugin-react-refresh | 0.5.6 | Refresh boundary rules |
| @react-three/eslint-plugin | 0.1.2 | allocation-in-loop rules for `useFrame` |
| vitest | 5.0.0 | data and geometry tests in Node |
| @playwright/test | 1.63.0 | screenshots per stage with system Chrome or bundled Chromium |
| leva | 0.10.1 | dev-only keyframe inspector |
| r3f-perf | 7.2.3 | dev-only frame budget overlay |

Node engine: `>=22.12` (Vite 8 and Vitest 5 both require it; local Node is 22.22.0).

## Sources

Inline URLs above point to the primary documents. Sources without a URL in the text:

- npm registry, queried 2026-09-06 with `npm view <package> version|time|peerDependencies|engines`; tarballs of three 0.185.1, @react-three/drei 10.7.8, @react-three/postprocessing 3.1.1, and postprocessing 6.39.4, cited by file path and line.
- human-atlas clone, `package.json`, `README.md`, `app/scene.tsx`, `app/page.tsx`: https://github.com/ashemag/human-atlas
- ZFIN files `stage_ontology.txt`, `anatomy_item.txt`, `anatomy_relationship.txt` (local copies): https://zfin.org/downloads
- typescript-eslint issue on TypeScript 7 support: https://github.com/typescript-eslint/typescript-eslint/issues/10940
- Benchmark script (Node 22.22.0, three 0.185.1, AMD EPYC 7713). It ran outside this repository and is not committed here.
