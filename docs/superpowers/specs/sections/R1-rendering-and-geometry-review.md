## Rendering and geometry review

Reviewer role: three.js and WebGL engineer. Scope: the rendering, geometry, scheduling and export plan of the design spec (sections 2.3, 2.5, 2.7, 2.9, 4.1, 4.5 to 4.9). Every claim about library behaviour below was checked against the installed packages in `node_modules`: three 0.185.1, @react-three/fiber 9.7.0, @react-three/drei 10.7.8, @react-three/postprocessing 3.1.1, postprocessing 6.39.4, zustand 5.0.15, react 19.2.8. File and line numbers refer to those packages. Severity: high blocks version 1 or embarrasses the presenter; medium must be fixed before implementation starts; low is polish.

Each finding quotes the spec text it objects to, states the failure as input and wrong result, and proposes one fix.

### Findings of high severity

#### RG-01. Queue replacement starves low-priority structures during playback

Spec text. AR-12: "A new time replaces the queue. It never appends. ... The lag of any structure is at most the drain time of one queue." BG-52: "Structures that the budget did not reach keep their previous geometry for that frame and stay `dirty`. The next frame continues from the head of the queue." Section 2.9: "Full interactive rebuild: 8 ms, one frame."

Computation. Research 06 section 4 measured 243,750 vertices (150 x 1,625) in 59.9 ms with `computeVertexNormals` at 38.7 ms. Positions alone therefore cost 21.2 ms, or 87 ns per vertex on one EPYC 7713 core. Section 2.9 assumes analytic normals cost the same, so 174 ns per vertex. The interactive level has about 25,000 vertices (one quarter of 100,000), so 4.4 ms. Each of about 150 present structures also pays a fixed cost per job. The job runs `presenceAt`, `bracket`, `interpolateParams` over 30 to 60 numbers with the `sizeRefSl` rescale, the quantised `paramHash`, `writeInto` of three arrays, and the bounds. I estimate 20 to 40 us per job; the spec does not measure it. That is 3 to 6 ms. The sum is 7.4 to 10.4 ms on the benchmark core before `bodyModel(t)` and before any `Math.pow` in the superellipsoid normals. A phone core is 2 to 3 times slower, so 15 to 30 ms.

Failure. During playback a new `t` arrives every frame, so AR-12 replaces the queue every frame and BG-52's "continues from the head" never happens. Every structure that the 8 ms slice does not reach is dropped and re-queued behind the same larger structures next frame. Input: play at 1x from 24 to 72 hpf (13.2 s per the section 5.2.9 table) while the head-trunk angle goes from 120 to 25 degrees. Result: the smallest structures by volume (otoliths, neuromasts, thyroid, small vessels) are never rebuilt. At 48 hpf the otolith still sits where the ear was at 30 hpf, about 0.3 mm outside the head. On a phone the same happens to most organs. The lag is unbounded, so the AR-12 claim is false under continuous time change.

Fix. Three changes, all inside D3. First, make the priority age-aware: `priority = volumeRank - framesSinceLastBuild * k`, with a hard rule that a job older than 4 frames goes to the front. Every structure is then rebuilt within a bounded number of frames and the error is a bounded lag, not a frozen organ. Second, apply RG-12 (place compact primitives by a transform) so that the interactive queue holds only spine-dependent structures. Third, make the interactive level adaptive: `PrimitiveBuilder.vertexCount` is exact, so the driver can measure ns per vertex on the first ten jobs and pick the interactive row and radial counts that fit 8 ms on that machine. This is the mechanism that rung 5 of AR-64 needs anyway.

#### RG-02. The drei `Outlines` selection outline does not follow a rebuilt mesh

Spec text. AR-35: "Selection draws a drei `Outlines` child on each selected mesh: `screenspace` true, `thickness` 2, colour `--focus`." Section 2.3.1 step 4: "when the new vertex and index counts equal the current counts, `writeInto` copies into the existing attribute arrays and sets `needsUpdate`."

Verified behaviour. `@react-three/drei/core/Outlines.js` lines 70 and 87 to 121: the default prop is `angle = Math.PI`. The layout effect rebuilds the outline mesh only when `oldGeometry.current !== parent.geometry`, and when `angle` is truthy it assigns `mesh.geometry = toCreasedNormals(parent.geometry, angle)`. That call returns a new non-indexed copy of the parent geometry.

Failure. Input: select the heart at 30 hpf, then scrub to 48 hpf. `writeInto` keeps the geometry object identity, so the effect never re-runs, and the outline mesh keeps the copy made at 30 hpf. Result: the yellow outline stays at the 30 hpf heart position and shape while the heart moves and loops. The copy also discards the analytic normals of D3 and triples the vertex count of every selected structure. When the LOD swap assigns the other cached geometry (identity changes), the effect catches it only on the next React render of `StructureMesh`, which the imperative driver does not trigger. One more detail: the `size` uniform is the drawing-buffer size (line 82), so `thickness 2` is 2 device pixels, which is 1 CSS px at dpr 2.

Fix. Pass `angle={0}` so the outline shares `parent.geometry` and follows every `writeInto`. Key the `Outlines` element on the geometry object (for example `key={lod}`) so a swap re-runs the effect in the same commit. Set `thickness` from `2 * dpr`. Add a Playwright step to `smoke.spec.ts`: select the heart, press `ArrowRight` three times, and assert that the outline pixels lie within 4 px of the heart's projected bounds.

#### RG-03. The dorsal and ventral presets fight `OrbitControls`

Spec text. AR-40 table: "dorsal | +y | -z" and "ventral | -y | +z" for camera direction and camera up. AR-39: "`keepDorsalUp` clamps the polar angle to 0.05 pi and 0.95 pi." Section 2.4: `keepDorsalUp` defaults to true.

Verified behaviour. `three/examples/jsm/controls/OrbitControls.js` line 406: `this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0))` runs once in the constructor. A later change to `camera.up` does not change the orbit frame. The polar angle is therefore always measured from +y.

Failure. Input: press `2` (dorsal) with the default settings. The 500 ms slerp puts the camera at +y from the target, at polar angle 0. On the next `controls.update()` the clamp moves it to 0.05 pi. Result: the "dorsal" view is 9 degrees off axis, the fish is drawn in a slight three-quarter view, and all 18 dorsal screenshots of D13 are wrong. If the clamp is lifted but `up` stays +y, `lookAt` at the pole has no defined roll. "Snout on the left" is then not guaranteed and can differ between two presses of the same key.

Fix. Keep `camera.up = +y` for every preset so `_quat` stays valid. Implement dorsal as polar angle 0.001 with the azimuth that puts the snout on screen-left, and ventral as pi minus 0.001. While `viewPreset` is dorsal or ventral, set `minPolarAngle = 0` and `maxPolarAngle = pi`; restore the 0.05 pi clamp on the first manual orbit, which already sets `viewPreset` to `free`. Drive the preset tween by writing `controls.target` and `camera.position` with `controls.enabled = false` for the 500 ms, then call `controls.update()` once. Without that, the damping of AR-39 applies its own delta on top of the tween and the camera jitters. Add a Playwright assertion for `v=dor`: the projected snout is left of the projected tail and the projected dorsal axis is vertical within 1 degree.

#### RG-04. Bounding spheres go stale after `writeInto`, so culling and picking break

Spec text. Section 2.3.1 step 4: "`writeInto` copies into the existing attribute arrays and sets `needsUpdate`." The spec mentions no bounding volume update; the words `boundingSphere` and `frustumCulled` do not occur in it.

Verified behaviour. `three/src/math/Frustum.js` line 158 and `three/src/objects/Mesh.js` line 236 compute `geometry.boundingSphere` only when it is `null`. A position write with `needsUpdate` does not reset it.

Failure. Input: zoom in on the heart at 24 hpf, then scrub to 60 hpf. The heart's vertices move about 0.5 mm as the head straightens, but the sphere computed at 24 hpf stays. Result: the mesh is frustum-culled while it is on screen (it blinks out during a zoomed scrub), and a click on the visible heart misses because the raycaster rejects the mesh by the old sphere. OV-33 fails for every structure that has moved since its first render.

Fix. `writeInto` sets `geometry.boundingBox` and `geometry.boundingSphere` from `GeometryOut.bounds`, which the builder already computes. With RG-12 the local-frame geometry has a constant sphere and only the mesh transform changes, so this cost disappears. Add to QP-12: after two `writeInto` calls with different frames, `geometry.boundingSphere.center` equals the analytic centre within 1e-6.

#### RG-05. The raycaster ignores the section plane, so the user cannot select what the cut exposes

Spec text. AR-43: "One `Plane` in world space cuts the model. `SectionPlane.tsx` writes it into `clippingPlanes` of every structure material." AR-34 and `picking.ts` describe layers and tap thresholds and nothing about the plane.

Verified behaviour. Clipping is a fragment discard (`clipping_planes_fragment.glsl.js` line 53). `Raycaster` tests triangles and knows nothing about `clippingPlanes`. three's `Plane` clips points with negative signed distance (`WebGLClipping.js` line 150 with `vClipPosition = -mvPosition.xyz`).

Failure. Input: sagittal section at position 0 in the lateral view, then click on the exposed brain. Result: the first intersection is the clipped-away left skin, then the left eye, then the left half of the brain. `stopPropagation()` on the first hit selects the skin. Every click in section mode selects an invisible surface. The M3 use case "section planes" and OV-33 fail together.

Fix. In `picking.ts`, pass an r3f `raycaster.filter` that drops every intersection with `plane.distanceToPoint(hit.point) < 0` while `section.axis` is not null. Keep back-face hits, because with `DoubleSide` the darkened far wall of a hollow organ is the visible cut surface. Add a Playwright step: with `sec=sag:0`, a click at the projected brain centre selects a nervous-system id.

#### RG-06. The exported PNG is not tone mapped and its alpha is un-premultiplied in the wrong colour space

Spec text. AR-51: "Export renders into a `WebGLRenderTarget` ... The target uses `samples: 4`, `UnsignedByteType`, and `SRGBColorSpace`." AR-22: "Tone mapping is `NeutralToneMapping`, never ACES ... the legend swatch must match the organ colour." AR-55: "The encoder therefore un-premultiplies pixels with alpha between 0 and 1 before it writes the PNG."

Verified behaviour. `three/src/renderers/webgl/WebGLPrograms.js` lines 176 to 184: `toneMapping` is `NoToneMapping` whenever `currentRenderTarget` is not null and not an XR target. Line 212: for a render target the shader output colour space is the working (linear) space, and the `SRGB8_ALPHA8` target encodes on write, so blending happens in linear light and the bytes read back are the sRGB encoding of a linear, alpha-weighted colour.

Failure, part 1. Input: export at 2x from a scene that looks right on screen. Result: the PNG has no tone mapping. The key light at intensity 2.0 plus the environment pushes skin highlights above 1.0; on screen `NeutralToneMapping` rolls them off, in the PNG they clip to white and the hue shifts. The slide does not match the legend or the screen, which breaks AR-22 exactly where it matters (moment M4).

Failure, part 2. Input: transparent export with the skin at opacity 0.45 over the empty background. The stored byte is `encode(0.45 * c)`. Dividing that by 0.45 gives `encode(c) * 0.45^(-0.545)`. That value is 1.55 times too bright and clips. Result: a bright halo around the fish on every slide, the opposite of the "no dark fringe" requirement in OV-40.

Fix. Render each tile into a linear `HalfFloatType` target, then run `OutputPass` from `three/addons/postprocessing/OutputPass.js` (it applies `renderer.toneMapping` and the sRGB encode) into the byte target that is read back. Un-premultiply in linear light: decode sRGB, divide RGB by alpha, re-encode. Add two Playwright checks. A pixel at the body centre in the opaque export equals the same pixel on the canvas within 2 of 255. A 0.45-alpha edge pixel of the transparent export, composited on white in the test, equals the opaque-on-white export within 3 of 255.

### Findings of medium severity

#### RG-07. The budget table and the builder table give different tessellations

Spec text. Section 2.9: "body tube | 32 x 16 | 64 x 32 | 4,096", "ellipsoid, superellipsoid | 12 x 8 | 24 x 16 | 768", "shell | 16 x 16 | 32 x 32 | 2,048". BG-30: "Its rows are 64 (interactive) and 128 (final) and its radial count 24 and 32; 1625 and 4257 vertices." BG-29: ellipsoid "12 x 16 | 24 x 32 | 221 / 825", shell "12 x 24, two surfaces plus rim | 24 x 48, two surfaces plus rim | 700 / 2548".

Failure. `4257 = 129 x 33`, so the final body is 128 x 32 and 8,192 triangles, twice the 2.9 row. The final ellipsoid at 24 x 32 is 1,536 triangles, twice the 2.9 row. The shell at 24 x 48 with two surfaces is about 4,700 triangles. `primitives/tessellation.ts` will be written from one of the two tables, and the 2.9 budget (60,000 interactive, 200,000 final triangles) is computed from the smaller one.

Fix. Delete the per-kind rows from section 2.9 and reference BG-29 and BG-30 as the single source. Recompute the triangle budget from them: with 40 ellipsoids, 40 tubes, 10 lathes, 10 sheets, 3 shells, the body and the arrays the final scene is about 170,000 triangles and 105,000 vertices, which still fits the 200,000 budget.

#### RG-08. The superellipsoid normal is singular for exponents above 2

Spec text. BG-29: "Barr form: `n = (c(eta, 2 - e1) c(omega, 2 - e2) / a, s(eta, 2 - e1) / b, ...)`, with `c(x, e) = sign(cos x) abs(cos x)^e`." Section 3.2.3: `e1: z.number().min(0.3).max(2.5)`. E029 checks "finite positions" only.

Failure. Input: `e1 = 2.2`. At the poles `cos eta = 0` and the exponent `2 - e1 = -0.2`, so `abs(0)^(-0.2)` is infinite and `normalize` returns NaN. The pole rows render black or flicker, and `computeBoundingSphere` is unaffected so nothing else warns. The same happens at `cos omega = 0` for `e2 > 2`. For `e < 2` the exponent is positive and the formula is correct, including at the poles, where the analytic normal is `(0, +-1/b, 0)` up to scale. On a degenerate pole row this is where analytic normals beat `computeVertexNormals`.

Fix. Cap `e1` and `e2` at 2.0 in the schema (2.0 is already a bi-cone; organs use 0.6 to 1.5). Extend E029 and QP-12 to normals: every normal finite, unit length within 1e-3, and `dot(normal, position - centre) > 0` for every convex kind. The outward test also catches the winding and sign errors of RG-10 and RG-16.

#### RG-09. The tube normal formula is wrong for the frame the spec uses, for elliptic sections, and for tight bends

Spec text. BG-29 tube: "`dP/ds = T (1 - r kappa cos theta) + r' (cos N + sin B)`". BG-30: "The `tube` builder with `radius: 'body'` sweeps the body's own cross-section (`hD`, `hV`, `hW`, superellipse exponent)." `TubeParams.ellipticity` in section 3.2.3. BG-31: "It closes each end with one cap vertex whose normal is `+T` or `-T`."

Failure, three parts. (1) The term `1 - r kappa cos theta` is the Frenet form. The frame of BG-03 is a parallel-transport frame, whose curvature has two components: `T' = k1 N + k2 B`, so the term is `1 - r (k1 cos theta + k2 sin theta)`. For the planar spine of version 1 `k2 = 0`, but a `type: 'spline'` tube through 3D points (heart loop, vessels, gut loops) has `k2 != 0`, and for a tapered tube (`r' != 0`) the normal then tilts. (2) For `radius: 'body'` the cross-section is a superellipse with `hW` about half of `hD` in the adult. The written formula gives the radial direction; the correct normal is the gradient `(cos theta / a, sin theta / b)` for an ellipse, and `(|x/a|^(n-1) sign(x) / a, |y/b|^(n-1) sign(y) / b)` for exponent `n`. At `hW = 0.5 hD` the radial direction is up to 27 degrees off the true normal, so the whole body shades as if rounder than it is and the highlight sits in the wrong place. (3) When `r kappa > 1` the coefficient of `T` becomes negative, the inner side of the bend folds through itself, and the normal points inward. The heart at 48 hpf has `bendDeg 140` over a 0.28 mm tube with atrium radius 0.055 mm; the AV canal region reaches that regime. Result: dark, inside-out patches on the inner curve of the most-selected organ. E029 does not catch it because the positions are finite and inside the body box. A single cap vertex with normal `+-T` next to a ring of radial normals also gives a dark ring where Gouraud interpolation crosses 90 degrees; a "round" cap that is one vertex is flat.

Fix. Write the normal as `normalize(alpha * G - r' * T)` where `G` is the 2D gradient normal of the cross-section lifted into the `N, B` plane and `alpha = 1 - (k1 x + k2 y)` with `(x, y)` the section point; take `k1, k2` from finite differences of the sampled frames. Add validator rule E032: `max(r) * max(kappa) < 0.9` per tube and per custom sweep; the heart loop record then needs a larger AV-canal bend radius or a smaller atrium radius at 48 hpf. Build `caps: 'round'` as three hemisphere rows with sphere normals (about 40 extra vertices per tube).

#### RG-10. Mirrored copies need reversed winding; three flips front faces per object, not per instance

Spec text. Section 3.2.3: "`mirror: z.boolean().default(false), // paired: draw at +w and at -w`". BG-32: "When `mirror` is true it places two instances per index, mirrored across `w`." BG-29 segmentArray: "one `InstancedMesh` per array." AR-26: "Closed primitives use `FrontSide`."

Verified behaviour. `three/src/renderers/WebGLRenderer.js` line 1188: `frontFaceCW = (object.isMesh && object.matrixWorld.determinantAffine() < 0)`. The check reads the object's matrix, never an instance matrix.

Failure. Input: the myotome array with `mirror: true` as one `InstancedMesh` whose mirrored instances use a reflection matrix (determinant -1). Result: the mirrored half has clockwise winding, `FrontSide` culls its front faces, and the left-side myotomes render as their inside or not at all. A paired ellipsoid whose mirrored copy is baked into the same geometry with the same index order fails the same way; only a separate mesh with a reflecting `matrixWorld` is handled by three.

Fix. In the builder, a mirrored copy negates `w` and reverses the winding of every triangle (swap indices 1 and 2). For arrays, use two `InstancedMesh` objects (left and right) with rotation-only instance matrices; the chevron apex direction is then set by the template, not by the matrix. Two objects also sort correctly when the x-ray slider makes the myotomes translucent, and give a bounded `maxCount` per object (allocate `InstancedMesh` with the maximum `count` over the keyframes; the spec never states the allocation size and three cannot grow an instance buffer).

#### RG-11. Export peak memory is about 600 MB, not 134 MB, and screen-space effects do not tile

Spec text. AR-58: "At a 4096 px tile, the MSAA target and its resolve hold 4096 x 4096 x 4 bytes each. The peak transient GPU memory is therefore about 134 MB." AR-53: tile edge `min(MAX_RENDERBUFFER_SIZE, MAX_TEXTURE_SIZE, 4096)`.

Verified behaviour. `WebGLTextures.js` lines 1710 and 2122 allocate the colour and depth attachments with `renderbufferStorageMultisample` at `samples`; the depth format is `DEPTH_COMPONENT24` or `DEPTH24_STENCIL8` (lines 261 to 278). `readRenderTargetPixelsAsync` reads the resolved `__webglFramebuffer` (line 3161), which is correct.

Failure. At 4096 x 4096 with 4 samples: colour 4 x 4 B x 16.8 M = 268 MB, depth 4 x 4 B x 16.8 M = 268 MB, resolve texture 67 MB. Total about 600 MB for one tile. Input: 4x export on an integrated-GPU laptop or on the poster visitor's phone. Result: allocation failure or `webglcontextlost` during the export, which AR-68 then reports as a paused viewer. Two more tiling errors: the drei `Outlines` `screenspace` offset is computed in clip space per tile, so the outline thickness changes between tiles and shows seams; the `EffectComposer` of `PostOutline.tsx` renders to its own canvas-sized buffers and cannot render into the export target, so at `presentation` quality the export silently drops the outline and SMAA.

Fix. Tile at 2048 px and drop MSAA on the export target; render each tile at 2x the target size into a `HalfFloatType` target (about 134 MB at 2048 x 2 squared x 8 B) and box-filter down. This gives better edges than 4x MSAA and combines with the RG-06 pipeline. During export set `screenspace={false}` on `Outlines` with a world thickness derived from the camera distance, or draw the selection outline into the 2D overlay of AR-56. Pause drei `PerformanceMonitor` during export and during the final-rebuild burst, otherwise the long export frames count as a decline and the viewer comes back at dpr 1.

#### RG-12. Build compact primitives in a local frame and place them with a transform

Spec text. BG-29: "`normalize(x / a^2, y / b^2, z / c^2)` in the local frame, then rotated." `buildStructure(record, frame, t, level): GeometryOut` "interpolates keyframes, converts body coordinates". BG-44: "scale about the structure's centroid from 0.7 to 1.0". BG-46: "the structure scales from 0.6 to 1.0 about its centroid."

Failure. The builders bake world positions, so an ellipsoid at a fixed `{u, v, w}` is re-vertexed every frame although only `frameAt(u)` and the SL scale changed. This is most of the interactive queue in RG-01. A world-baked mesh also cannot scale about its centroid with `mesh.scale`; it scales about the world origin at `u = 0.4`, so a structure that appears during a scrub flies in from the middle of the trunk instead of growing in place. Every world-baked mesh also has the stale-sphere problem of RG-04.

Fix. `GeometryOut` positions are relative to `bounds.center` for every kind whose shape does not depend on the spine (ellipsoid, superellipsoid, lathe, shell, `eyeCup`, `earVesicle`, `primordiumMover`). `StructureMesh` sets `mesh.position` from `toWorld(u, v, w)`, `mesh.quaternion` from `frameAt(u)` plus the yaw, pitch and roll of `Placement`, and `mesh.scale` from `SL(t) / sizeRefSl`. A rebuild for these kinds runs only when the interpolated shape parameters change hash. Spine-following kinds (tube on the spine, sheet, segmentArray instance matrices, body) keep the current path. This stays inside D3: no record stores world vertices, geometry is still regenerated when its parameters change, and body coordinates are still converted at every time step.

#### RG-13. A store field that changes at 60 Hz re-renders the whole UI every frame

Spec text. AR-17: "Components select single fields, never the whole state." AR-15: "The one writer inside the frame loop is `Clock`, which calls `setTime` once per frame while `playing` is true." `Structures.tsx`: "maps present structure records to `StructureMesh` or `InstancedStructure`." Section 5.3: rail badges "present / total" and the tree filter "Only structures present now".

Failure. `time` is one field, but the thumb, the readout, the stage card, the 15 rail badges, the tree filter and its per-node counts, the info card presence badge and alias line, the event-marker clock icon, and `Structures.tsx` all derive from it. Input: playback at 1x. Result: every one of these components re-renders 60 times per second; `Structures.tsx` recomputes presence for 236 records and reconciles up to 190 children per frame, and each boundary crossing mounts or unmounts a mesh (allocation plus first-render program binding inside the frame). React work of 2 to 5 ms per frame lands on top of the 8 ms rebuild and the 2 to 5 ms CPU side of `renderer.render` for 200 draw calls with per-material uniforms. The 16.7 ms budget of section 2.9 has no room for it.

Fix. `setTime` also writes `stageIndex` (changes 44 times over the axis) and `presentIds` (changes only at a presence boundary), each with an equality check so subscribers do not fire. UI components subscribe to those two fields. The thumb, readout and stage card use `useAtlas.subscribe` with a DOM write (transient update) instead of React state. `Structures.tsx` mounts every geometry-bearing record once and toggles `mesh.visible` from `presentIds`; fades and the 300 ms transition already run per frame in `StructureMesh` (AR-14). Add to the dev overlay (AR-65) a React commit counter per second; the acceptance value during playback is under 5.

#### RG-14. First use of the section plane, `DoubleSide` and transmission stalls on shader compilation

Spec text. AR-43: "`SectionPlane.tsx` writes it into `clippingPlanes` of every structure material and removes it when `axis` is `null`." AR-44: "While the section is active, clipped materials switch to `DoubleSide`." AR-29: `MeshPhysicalMaterial` with `transmission` at `presentation` quality.

Verified behaviour. `WebGLPrograms.js` line 354 and 485: `numClippingPlanes` is part of the program cache key; so is `doubleSided`. Changing either compiles a new program on first use.

Failure. Input: during a talk, press the Sagittal button. Result: the frame that first draws with one clipping plane compiles a new program for every material variant in use (opaque, transparent, `DoubleSide`, `flatShading` off, with and without `colorOverride` emissive) and blocks the main thread for 100 to 400 ms on an integrated GPU. The same stall repeats the first time a fade sets `transparent` together with `DoubleSide`, and when the quality toggle enables transmission.

Fix. Keep `clippingPlanes = [plane]` on every material at all times; when the section is off, set the plane to normal `+y` and constant `1e6` so nothing is clipped and the program does not change. Keep `side` fixed per material (sheets `DoubleSide`, closed kinds `FrontSide`) and darken the cut face in the existing `onBeforeCompile` patch using `gl_FrontFacing` instead of switching `side`. At load, call `renderer.compileAsync(scene, camera)` once with one hidden mesh per material variant, including the transmission variant.

#### RG-15. One chord-span sheet cannot wrap the tail tip without self-intersection

Spec text. BG-39: "The median fin fold is one `finSheet`. Its base runs from `u = 0.27` (somite 8) over the tail tip to the vent on the ventral side." BG-29 sheet: "`outline: [chord, span][]` closed 2D spline". Section 4.3.4: the body half-heights at `u = 1.0` are 0.02 / 0.02 / 0.01 mm at 24 hpf. BG-39: "The maximum height is 0.06 mm at 24 hpf, 0.20 mm at 48 hpf."

Failure. At the tail tip the base turns 180 degrees with a radius of about 0.02 mm while the span rays are 0.06 to 0.20 mm long. Rays from the dorsal side and rays from the ventral side cross within 0.02 mm of the base. Result: the fold sheet folds through itself around the tip, triangles invert, the two faces swap, and the analytic face normals point into the sheet. Input: the 24 hpf and 48 hpf lateral screenshots of D13. The tail fold is the largest transparent-looking feature of the embryo at those stages, and the artefact sits in the middle of it.

Fix. Split the span direction into three regions: dorsal (`+N`), caudal fan (slerp from `+N` through `+T` to `-N` over the extension of BG-08 past `u = 1`), and ventral (`-N`). Build the fold as one sheet whose rows follow that direction field, so the rows at the tip radiate from the notochord end like a fan and never cross. The same direction field serves the caudal fin after the `fin_fold_fins` handoff.

#### RG-16. Frame tests miss a whole-frame flip across time; the tension setting is a no-op

Spec text. BG-04: "The unit tests in D13 check that `N[i] . N[i-1] > 0.99` at every station and every hour from 0 to 4320 hpf." BG-01: "the parameterization of three's `CatmullRomCurve3` (type `centripetal`, tension 0.5)".

Verified behaviour. `CatmullRomCurve3.js` lines 12 and 226 to 247: `tension` is used only for `curveType === 'catmullrom'`; centripetal and chordal curves ignore it.

Analysis. For the planar spine of version 1 the parallel-transport frame equals the signed in-plane normal, so no flip can occur along `u`; BG-04 will pass. The one way the frame can flip is across time: the seed `N = normalize(up - (up . T) T)` at `u = 0.4` picks whichever in-plane normal has a positive `y` component. I checked the control points of section 4.3.3: at 10 hpf the tangent at `u = 0.4` is 72 degrees below `+x` and the outward normal is `(0.95, 0.32)`, so the seed is correct at every keyframe. A future edit to the R0 to R2 control points that drops the `y` component below zero flips dorsal and ventral for the whole fish at that hour, and BG-04 still passes because the flip is consistent along `u`.

Fix. Add two assertions to QP-11: `N(u, t) . N(u, t + 1 h) > 0.99` for every station and every hour, and `N(0.4, t) . up > 0.2` for every hour. Delete "tension 0.5" from BG-01 or change the type to `catmullrom`; the two words together describe a curve three does not build.

#### RG-17. A 4K projector defeats `dpr={[1, 2]}` in both scaling modes

Spec text. AR-21: "`dpr={[1, 2]}`". Section 1.2, M1: "Laptop mirrored to a projector ... 1920 by 1080 or 1280 by 720 output". AR-64 rung 1: "device pixel ratio 2 to 1 during playback and scrubbing".

Failure. Input: a 3840 x 2160 projector or display at 200 percent scaling. The backing store is 8.3 Mpx with 4x MSAA (about 265 MB of framebuffer) and 200 draw calls with translucent overdraw; an integrated GPU is fill-bound below 60 fps before any rebuild work, and the monitor lowers dpr only after a measured decline plus 2 s of hysteresis, so the audience sees the stutter first. Input: the same output at 100 percent scaling. The CSS viewport is 3840 px wide, the timeline bar is 112 px of 2160 (5 percent), the readout is 20 px text in presentation mode, and nothing is readable at 20 m.

Fix. Cap the interactive backing store: `dpr = min(devicePixelRatio, 2560 / cssWidth)` while `t` or the camera moves, and render the settled frame at the full ratio; `frameloop="demand"` makes the settled frame free. Set `antialias` false when the backing store exceeds 4 Mpx and rely on the settled high-dpr frame instead. In presentation mode scale the UI with `--ui-scale = clamp(1, min(100vw / 1920px, 100vh / 1080px), 2)` so a 4K output at 100 percent reads like 1080p.

### Findings of low severity

#### RG-18. Camera-parented directional lights need their targets parented too

Spec text. AR-24: "One key `DirectionalLight` at intensity 2.0 comes from anterodorsal-left ... The three lights are children of the camera, so the lateral view is lit the same after an orbit."

Failure. A `DirectionalLight` shines from its world position toward `light.target`, whose default is an `Object3D` at the world origin that is in no scene, so its matrix never updates. Input: zoom from 8 to 0.4 body lengths. Result: the light direction changes from "from the camera side" toward "from the anterodorsal offset", so the shading of the same view changes with zoom and the key never comes from anterodorsal-left as such.

Fix. Add each `light.target` as a child of the camera at position `(0, 0, -1)` and each light at its offset; both then move with the camera and the direction is constant in view space.

#### RG-19. Transparent render order by tree depth is not containment order

Spec text. AR-30: "`renderOrder = 1000 - depth`, where `depth` is its depth in the part-of tree. An inner shell therefore draws before an outer shell."

Failure. The chorion is at depth 1 or 2 (under `extraembryonic structure`), the whole-organism skin is at depth 0. Input: 30 hpf with the default x-ray. Result: the chorion (999) draws before the skin (1000) although it encloses it, so the skin is not tinted by the chorion where they overlap. At 10 percent chorion opacity the error is small; the rule is still inverted for every container that is not the skin.

Fix. Sort transparent structures by bounding-sphere radius descending (largest last) and keep `renderOrder` bands only for the isolate ghosts (500) and the skin (1000).

#### RG-20. Package pins: one peer dependency floats and one plugin is missing

Spec text. AR-01: "Every dependency is pinned to an exact version in `package.json`." Section 6.1.2 imports `@react-three/eslint-plugin`.

Checked against `package.json` and `node_modules`. The D2 versions match research 06 and are installed as pinned: three 0.185.1, @react-three/fiber 9.7.0 (peer react `>=19 <19.3`, satisfied by 19.2.8), @react-three/drei 10.7.8, @react-three/postprocessing 3.1.1, zustand 5.0.15, zod 4.5.4, vite 8.2.2, vitest 5.0.0, typescript 5.9.3 (inside typescript-eslint's `<6.1.0`), eslint 10.10.0, eslint-plugin-react-hooks 7.1.1 (`configs.recommended.rules` exists, so the 6.1.2 outline works). Two gaps: `postprocessing` 6.39.4 (peer `three >= 0.168.0 < 0.186.0`) is installed only as a peer of @react-three/postprocessing and is not in `package.json`, so only `package-lock.json` pins it; and `@react-three/eslint-plugin` is not installed, so the `eslint.config.js` of section 6.1.2 fails at import.

Fix. Add `"postprocessing": "6.39.4"` to `dependencies`. Either add `@react-three/eslint-plugin` 0.1.2 to `devDependencies` and confirm its rule names in WP-01, or drop the two rules from 6.1.2.

### Points that are correct and not obvious

- Duplicating the seam column (BG-29) is safe with analytic normals; both seam vertices get the same normal, so no seam line appears. With `computeVertexNormals` the same layout would show a seam. Keep the pairing.
- The pole rows of the ellipsoid and lathe are degenerate triangles; analytic normals give them the right value, which face-averaged normals do not.
- For the planar spine of version 1 the parallel-transport frame of BG-03 is exactly the signed in-plane normal and cannot flip along `u`. The seed at `u = 0.4` is correct at every keyframe of section 4.3.3 (see RG-16 for the missing test).
- `readRenderTargetPixelsAsync` reads the resolved framebuffer of an MSAA target (`WebGLRenderer.js` line 3161), so the AR-53 read path is right; the problems are the tone mapping, the colour space and the memory (RG-06, RG-11).
- `NeutralToneMapping`, `SRGB8_ALPHA8` render targets and `OutputPass` all exist in three 0.185.1.
- The r3f `filter` on the raycaster and the `frontFaceCW` check are the two places where three's renderer and picker disagree with the fragment stage; RG-05 and RG-10 are the only such cases I found in this plan.

### Conflicts with the decision record

1. D2 lists `@react-three/postprocessing` as an "optional quality toggle only" and drei `Outlines` as the default outline. Research 06 section 5 states that the inverted hull "shows hull intersections" on concave shapes. The heart loop (S-shape at 48 hpf), the gut loops, the semicircular canals and the eye cup are concave, and the heart is the structure a presenter selects most. RG-02 keeps drei `Outlines` as the default and fixes its use. If the owner wants a clean outline on the heart at `standard` quality, D2 must change; the screen-space `Outline` pass is the only option in the stack that handles concave shapes and shows the hidden edge through the skin.

2. D3 states "Geometry is regenerated when time changes." RG-12 keeps regeneration for every primitive whose shape depends on the spine and moves compact primitives with a transform when only their placement or SL scale changes. I read D3 as a data rule (no stored vertices; body coordinates converted every time step), and RG-12 complies with that reading. If the owner reads D3 as "every vertex is rewritten on every time change", RG-12 conflicts and RG-01 then needs the age-aware priority and the adaptive interactive level alone.

3. D3 fixes the 8 ms rebuild budget. RG-01 shows that with the stated vertex counts the interactive rebuild is 7.4 to 10.4 ms on the benchmark core and 15 to 30 ms on a phone. The budget stands as a per-frame slice; the spec's claim that a full interactive rebuild fits one slice (section 2.9) does not, and the scheduler must be correct when it does not fit.
