# Zebrafish 3D Atlas: architecture decisions

Date: 2026-09-06. Author: the orchestrating agent, on behalf of Yang-Joon Kim.
Status: accepted for version 1, revised after the spec review of 2026-09-06 (see D16). The design
spec (`2026-09-06-zebrafish-3d-atlas-design.md`) must comply with every decision below. A decision
changes only by editing this file.

Inputs: `docs/research/01` to `07`, the two fact-check reports, and the completeness critique
that found five high-severity gaps (no canonical system list, no shared coordinate frame, three
adult scales, four time-axis warps, no handoff list). Each gap is closed by a decision here.

## D1. Product scope for version 1

- A static web app with no backend. Deploy to GitHub Pages and Vercel from the same build.
- The time axis runs from 0 hpf (1-cell zygote) to 4320 hpf (180 dpf). The interactive domain
  ends at 180 dpf because the model does not change shape after that point; the ZFS adult stage
  continues to 730 dpf in the data but the slider does not.
- The viewer shows one fish at one time point. A "Dissect" slider separates the structures
  (owner request of 2026-09-07; see D17). It replaces the earlier "no exploded view" rule.
- Every structure is selectable. The info card shows the ZFA definition, the ZFIN stage window,
  a ZFIN link, developmental events, and a "Jump to first appearance" button.
- Export: PNG at 1x, 2x, 4x at least, with an optional transparent background, plus fixed slide
  sizes (1920 by 1080, 3840 by 2160) and frames (16:9, 4:3, 1:1). Share: a URL that encodes
  time, selection, camera, and visibility.
- Out of scope for version 1: real imaging meshes, cross-sections of real data, single-cell
  overlays, multi-fish comparison, a mobile-first layout. The layout must still work on a phone.

## D2. Stack

| Package | Version | Note |
|---|---|---|
| react, react-dom | 19.2.x | |
| three | 0.185.1 | newest release inside every peer range |
| @react-three/fiber | 9.7.x | |
| @react-three/drei | 10.7.x | Html labels, OrbitControls, Outlines |
| @react-three/postprocessing | 3.1.x | optional quality toggle only |
| zustand | 5.x | one store, slices per concern |
| zod | 4.x | data schema; emit JSON Schema for docs |
| tailwindcss, @tailwindcss/vite | 4.3.x | tokens in CSS variables |
| lucide-react | latest | icon names verified in research 07 |
| vite | 8.2.x | |
| typescript | 5.9.x | pinned; TypeScript 7 is not yet supported by the lint tool chain |
| vitest | 5.x | unit tests for core and data |
| @playwright/test | 1.63.x | system Chrome (`/usr/bin/google-chrome`), swiftshader |
| eslint, typescript-eslint | current | |

Node 22.22 runs the validation scripts directly (type stripping). No shadcn install; the six
primitives the reference uses are rewritten as small local components.

## D3. Geometry: procedural, placed in a body frame

Every structure is procedural. No structure stores world-space vertices in the data.

**Body model.** A pure TypeScript module `bodyModel(t)` returns, for a time `t` in hpf:

- the spine: a Catmull-Rom curve in millimetres, sampled at 128 stations;
- for each station `u` in `[0, 1]`: position, tangent, dorsal normal, lateral binormal, dorsal
  half-height `hD(u)`, ventral half-height `hV(u)`, half-width `w(u)`;
- yolk parameters: ball centre and radius, extension length and radius, or none;
- chorion radius or none; epiboly fraction; somite count; body length; head-trunk angle.

`u = 0` is the snout tip. `u = 1` is the posterior end of the notochord (the caudal peduncle in
post-flexion fish, the tail tip in embryos). Fins may extend past `u = 1`.

**Regimes.** The body model switches equations by time and blends across each boundary:

| Regime | hpf | Shape |
|---|---|---|
| R0 blastodisc | 0 to 4.66 | 0.7 mm yolk sphere plus a cell cap whose height follows cell count |
| R1 epiboly | 4.66 to 10 | blastoderm shell over the sphere; coverage from the epiboly fraction |
| R2 wrapped axis | 10 to 19 | axis on the yolk surface; wrap angle 180 to 240 degrees |
| R3 straightening | 19 to 72 | spline body; head-trunk angle 120 to 25 degrees; yolk ball plus extension |
| R4 free-swimming | 72 to 4320 | spline body scaled by standard length; no yolk after 168 hpf |

**Body coordinates.** A structure is placed with `{u, v, w}`: `u` along the spine, `v` from the
ventral surface (-1) through the spine (0) to the dorsal surface (+1), `w` from the left surface
(-1) to the right surface (+1). Sizes are millimetres, or fractions of local body height when
the record says so. The viewer converts body coordinates to world space at every time step, so
organs follow the body when it bends, straightens, and grows.

**Primitives.** ellipsoid, superellipsoid, tube (along a u range or along its own spline),
lathe, segmentArray (repeats a template along u; count is a function of time), sheet (fin
fold and fins: an outline spline with thickness), shell (sphere cap for blastoderm and chorion),
and a small set of custom builders (heart loop, gut loop, eye cup, ear vesicle).

**Interpolation.** Each structure has keyframes at hpf values. Parameters interpolate with a
smoothstep between the bracketing keyframes. Geometry is regenerated when time changes, or is
placed by a mesh transform when only its position changed. No world-space vertex is stored in
the data. Normals are analytic, not computed from faces. Two tessellation levels exist: interactive
(during scrubbing and playback) and final (rebuilt 120 ms after time settles). If a rebuild
exceeds 8 ms it is time-sliced over several frames. Morph-target baking is a later optimisation,
not a version 1 feature.

**Presence.** A structure exists from `visibleFromHpf` (default: ZFIN start stage) to
`modelEndHpf` (default: ZFIN end stage). It fades in over a window stated in the record
(default: 5 percent of its first stage) and fades out the same way. The UI adds a 300 ms
scale-and-opacity transition when a structure crosses its boundary during a scrub.

## D4. World axes and units

- Units: millimetres. The camera frames the body on every stage change.
- +x is posterior, +y is dorsal, +z is the left side of the fish. The default view looks along
  -z, so the fish shows its left side with the snout on the left, as in ZFIN figures.
- View presets: lateral (default), dorsal, ventral, anterior, posterior, three-quarter.

## D5. Canonical systems (15)

The palette has 15 fixed slots. The data file `systems.json` owns the mapping; the hex values
come from research 07 for both themes.

| id | Display name | Scope |
|---|---|---|
| early_embryo | Early embryo | chorion, yolk, blastoderm, enveloping layer, yolk syncytial layer, germ ring, shield, Kupffer's vesicle, hatching gland |
| axial | Axial | notochord, somites, hypochord, presomitic mesoderm, tail bud |
| nervous | Nervous | neural plate to tube, floor plate, brain regions, spinal cord, ganglia, lateral line nerves, pineal, pituitary |
| sensory | Sensory | eye, ear, olfactory organ, neuromasts |
| cardiovascular | Cardiovascular | heart and chambers, arteries, veins, aortic arches, plexus |
| hematopoietic_immune | Blood and immune | intermediate cell mass, blood island, caudal hematopoietic tissue, thymus, spleen, kidney marrow |
| respiratory | Gills and swim bladder | gill arches 3 to 7, gill filaments, opercular cavity, swim bladder, pseudobranch |
| digestive | Digestive | mouth, pharynx, esophagus, intestine segments, liver, pancreas, gall bladder, pharyngeal teeth, vent |
| excretory | Excretory | pronephros, glomerulus, ducts, cloaca, mesonephros, head kidney |
| endocrine | Endocrine | thyroid, interrenal, corpuscles of Stannius, ultimobranchial body |
| reproductive | Reproductive | primordial germ cells, gonad, ovary, testis, urogenital papilla |
| skeletal | Skeletal | pharyngeal arches, neurocranium, pharyngeal cartilages and bones, vertebrae, ribs, Weberian apparatus, girdles |
| muscular | Muscular | myotomes, myosepta, jaw and fin muscles |
| fins | Fins | median fin fold, pectoral, pelvic, dorsal, anal, caudal fins, fin rays |
| integument_pigment | Skin and pigment | periderm, epidermis, scales, melanophores, xanthophores, iridophores, stripes |

Each system record lists its ZFA root ids. Group nodes that the UI tree needs but that carry no
geometry (for example "brain", "pharyngeal skeleton") live in `structures.json` with
`geometry: null`. A structure has exactly one `system`. It may list `alsoIn` systems for
filtering.

**Duplicate ownership.** head kidney: excretory with `alsoIn: [hematopoietic_immune, endocrine]`.
Pharyngeal teeth: digestive. Median fin fold: fins. Periderm and epidermis: integument_pigment.
Myotome and myosepta: muscular. Pharyngeal arch: skeletal with `alsoIn: [respiratory]`; arches
3 to 7 also list respiratory. Floor plate: nervous with `alsoIn: [axial]` (ZFA: part of the
central nervous system). Hypophysis and epiphysis: nervous with `alsoIn: [endocrine]`. Swim
bladder: respiratory (the slot is named "Gills and swim bladder" because the zebrafish swim
bladder is a gut derivative for buoyancy, not an air-breathing organ). Spleen:
hematopoietic_immune. Yolk: early_embryo.

## D6. Growth track and adult scale

One canonical table `growth` in `stages.json` maps hpf to body length. It uses Kimmel embryo
length to 72 hpf, ZFIN total length for larvae, and the Singleman and Holtzman thresholds after:
12 mm standard length (SL) at 45 dpf, 18 mm SL at 90 dpf, 25 mm SL at 180 dpf. The table is
linear in hpf between its points so that SL(t) is monotone and invertible. Every
post-embryonic size in the structure records is expressed at a stated reference SL and is
rescaled by the ratio of the current SL to the reference SL. Post-embryonic events that the
literature defines by SL are placed on the time axis through this one table. Slow and fast
growth tracks are a later feature.

## D7. Time axis

`stages.json` is the only owner of the time axis. It holds the 44 named ZFS stages
(ZFS:0000001 to ZFS:0000044; the `ZFS:0000000` Unknown row is excluded), the 10 periods,
the events, the growth table, and `timeAxis`:

| Segment | hpf | Share of track width |
|---|---|---|
| zygote to bud | 0 to 10 | 18 percent |
| segmentation | 10 to 24 | 12 percent |
| pharyngula and hatching | 24 to 72 | 22 percent |
| early larva | 72 to 168 | 10 percent |
| larva | 168 to 720 | 16 percent |
| juvenile | 720 to 2160 | 14 percent |
| adult | 2160 to 4320 | 8 percent |

Headline ticks: 1-cell, 256-cell, sphere, shield, bud, 14-somite, prim-5 (24 hpf), high-pec
(42 hpf), long-pec (48 hpf), protruding-mouth (72 hpf), 5 dpf, 7 dpf, 14 dpf, 21 dpf, 30 dpf,
45 dpf, 90 dpf, 180 dpf. A tick is drawn only when it is at least 8 px from the previous drawn
tick. Playback speed is defined in track distance: 1x crosses the full track in 60 s.

## D8. Canonical event values

Where the research files disagreed, these values apply everywhere:

| Event | Value |
|---|---|
| heartbeat onset | 24 hpf |
| circulation onset | 26 hpf |
| heart looping onset | 30 hpf |
| pectoral fin bud visible | 28 hpf |
| hatching | median 60 hpf; window 48 to 72 hpf; shown as a timeline event, see the chorion row |
| chorion display | real size (inner diameter 1.2 mm) from 0 to 24 hpf, fade out 24 to 30 hpf; the model is shown dechorionated after 30 hpf, as in the Kimmel staging series, and the chorion info card says so |
| body posture to 30 hpf | every body keyframe at or before 30 hpf fits inside a 0.60 mm radius (a single planar curl of trunk and tail); the Kimmel head-trunk angle series applies from 30 hpf |
| mouth open | 72 hpf |
| swim bladder posterior chamber inflated | 100 hpf; fade 96 to 120 hpf |
| first feeding | 120 hpf |
| yolk exhausted | 168 hpf (inferred, not measured) |
| notochord flexion complete | 6.5 mm SL |
| pelvic fin bud | 7.2 mm SL |
| pelvic fin rays | 8.6 mm SL |
| squamation onset (posterior) | 9.6 mm SL |
| juvenile | 11.0 mm SL |
| adult | 18 mm SL at 90 dpf |
| head-trunk angle at 60 hpf | 35 degrees (interpolated; the ZFIN page value of 55 is not used) |

## D9. Topology handoffs

`handoffs.json` lists every case where one structure becomes others. The viewer cross-fades
the source and the targets over the window.

| From | To | Window |
|---|---|---|
| neural plate | neural keel | 10 to 11 hpf |
| neural keel | neural rod | 11.7 to 13 hpf |
| neural rod | neural tube | 14 to 16 hpf |
| neural tube | brain regions and spinal cord | 22 to 24 hpf; the brain regions exist from 14 hpf as sub-tubes, the window retires the tube mesh and starts the spinal cord |
| heart cone | heart tube | 22 to 24 hpf, as an alias boundary inside the one heart record (`withinRecord`) |
| heart tube | atrium, ventricle, bulbus arteriosus, sinus venosus | 42 to 48 hpf |
| eye (alias chain: optic vesicle 11.66 to 19 hpf, optic cup 19 to 24 hpf) | retina, lens, retinal pigment epithelium | 24 to 30 hpf; the eye is one record on the heart pattern |
| otic vesicle | inner ear with semicircular canals | 66 to 72 hpf |
| somites | myotomes | per segment: 2 h after the segment forms, over 2 h; the first window starts at 14 hpf and the last ends near 29 hpf |
| median fin fold | dorsal, anal, caudal fins | 5.2 to 6.6 mm SL |
| pronephros | mesonephros (kidney) | 12 to 14 dpf |
| immature gonad (ZFA:0005272) | ovary or testis | 25 to 30 dpf (sex toggle) |
| larval pigment stripes | adult stripes | 5.9 to 9.6 mm SL |
| pectoral fin bud | pectoral fin | 48 to 60 hpf |
| pelvic fin bud | pelvic fin | 8.5 to 8.7 mm SL |
| liver primordium | liver | 28 to 30 hpf |
| pancreatic buds | pancreas | 48 to 60 hpf |
| swim bladder bud | swim bladder | 55 to 60 hpf |
| thyroid primordium | thyroid follicles | 48 to 60 hpf |
| interrenal primordium | interrenal gland | 28 to 30 hpf |
| otic placode | otic vesicle | 16 to 18 hpf |
| olfactory placode | olfactory pit | 22 to 32 hpf |
| gonad primordium | immature gonad | 300 to 336 hpf |

The heart is one record (`ZFA:0000114`) with an `aliasChain` of the five ZFIN heart terms by
hpf for the info card, plus four chamber records from 42 hpf whose geometry is derived from the
same loop parameters.

## D10. Colour policy

One hue per system, with a documented exception list: arteries red, veins blue, otoliths white,
retinal pigment epithelium and melanophores near black, xanthophores yellow, iridophores
silver, cartilage Alcian blue, bone alizarin ivory, yolk pale yellow, lens clear, chorion glass.
Child structures inherit the system hue and step lightness by depth. Selection uses an outline
in the focus colour, never a fill change.

## D11. Ownership of values across research files

The research files are frozen inputs. Research 07 supplied the UX values, research 06 the
library choices, research 05 the body-scale numbers, and the 03 drafts the organ numbers. From
2026-09-06 the design spec owns every value it states; where the spec and a research file
differ, the spec wins, and where the spec and this record differ, this record wins. Nobody
writes values back into the research files.

## D12. Repository layout

```
src/core/      pure TypeScript, no DOM: bodyModel, primitives, interpolation, timeAxis, urlState, schema
src/data/      systems.json, stages.json, structures.json, body.json, handoffs.json, kits.json
data/zfin/     ZFIN source snapshot (stage_ontology.txt, anatomy_item.txt, relationships, synonyms, zfa.obo)
src/viewer/    react-three-fiber scene: body, structures, picking, labels, sections, export
src/ui/        panels: top bar, systems rail, timeline, info card, search, settings
src/state/     zustand store
scripts/       validate-data.ts, screenshot.ts, build-attribution.ts
tests/unit/    vitest
tests/e2e/     playwright
public/        favicon, ATTRIBUTION.md, environment map
docs/          research, specs, plans, screenshots
```

## D13. Quality gates

- `npm run check` (tsc), `npm run lint`, `npm run test` (vitest), `npm run validate` (data)
  and `npm run build` pass before any phase is called done.
- Data validation checks: ids resolve to ZFIN, stage windows match ZFIN unless overridden with
  a note, keyframes sorted and inside the presence window, body coordinates inside range, one
  record per id, every parent resolves, every handoff resolves, the time axis is monotonic and
  sums to 100 percent.
- Body model tests: no NaN at 1 hpf resolution, body length monotonic after 10 hpf, positions
  continuous across regime boundaries.
- Playwright renders 18 headline stages in lateral and dorsal views and saves PNGs under
  `docs/screenshots/`. A human reviews them; the run also checks that the canvas is not blank.

## D14. Licensing and attribution

Code: MIT. The ZFA and ZFS ontology files carry CC BY 3.0 in their OBO header (release
2026-07-16); ZFIN database content, including the stage table and the anatomy item file, is
CC BY 4.0 under the ZFIN terms of use. `public/ATTRIBUTION.md` and the info card footer state
both licences with their sources. No Kimmel 1995 figure is redistributed.
No asset with a non-commercial or unknown licence ships.

## D15. Implementation strategy

Work proceeds in vertical slices, each ending with the quality gates in D13:

1. Skeleton: app shell, data schema, stages.json, timeline bar, body model with yolk and axis,
   ten structures across five systems, screenshots.
2. Anatomy fill: one agent per system group authors structure records and keyframes against the
   body-frame API, validates, and renders its screenshots.
3. Interaction: search, info card, hierarchy tree, view presets, URL state, export,
   presentation mode, themes.
4. Hardening: tests, performance pass, accessibility pass, README, attribution, deploy workflow.

## D16. Review outcomes recorded on 2026-09-06

The spec review (graphics, biology, presenter and data lenses; 72 findings applied) asked for
the edits above. The owner settled them as follows: squamation moved to 9.6 mm SL (D8); floor
plate moved to nervous and the pharyngeal arch to skeletal (D5); the respiratory slot was renamed
"Gills and swim bladder" (D5); the stage count is 44 named stages, ZFS:0000001 to ZFS:0000044, with the Unknown row excluded (D7; the review's figure of 43 miscounted the file); the chorion is shown at
real size to 24 hpf and the model is dechorionated after 30 hpf (D8); the handoff table gained
ten develops-from rows and three readings (D9); the eye follows the heart alias pattern (D9);
transforms may place unchanged geometry (D3); the growth table is linear in hpf (D6); the export
list is a minimum (D1); the two ZFIN licences are stated (D14). The spec's section 7 items are
closed by these entries.

## D17. Dissect slider and full ZFA vocabulary (owner requests of 2026-09-07)

**Dissect slider.** A slider from 0 to 100 percent separates the structures the way the human-atlas
"explode" control does. From 0 to 60 percent each structure moves away from the spine along a
direction assigned per system in the lateral plane (nervous dorsal, cardiovascular ventral-anterior,
digestive ventral, skeletal dorsal-posterior, and so on; the data file `systems.json` owns the
directions), by a distance proportional to body length and to the slider value, with a small
per-structure stagger so siblings do not overlap. From 60 to 100 percent the structures glide into
a shelf-packed inventory grid beside the body, sorted by system, with labels on. The skin fades
with the slider. Picking, selection and the info card keep working at every value. The slider
value lives in the store and in the URL (`x=`), and the `D` key steps it. The body model itself
does not move.

**Full ZFA vocabulary.** The search index covers all ZFA terms in `data/zfin/anatomy_item.txt`
(3113 on 2026-09-06) with synonyms, definitions and stage windows, not only the modeled records.
Selecting a term without geometry opens its info card and highlights the nearest modeled ancestor
through the ZFA part_of closure, with a "modeled as part of X" note. The viewer builds this index
at build time from the ZFIN snapshot. Missing high-value regions found this way (the midbrain
hindbrain boundary ZFA:0000042 is the first) are added as records.

**Zebrahub cell-type crosswalk (phase 5).** The Zebrahub single-cell atlas labels cells with
tissue and cell-type names. A crosswalk table maps each label to a ZFA id (exact name, synonym,
or curated match) so a Zebrahub annotation can highlight the structure in the 3D atlas. Research
note: `docs/research/11-zebrahub-celltype-crosswalk.md`.

## D18. Experimental reporter preview (owner request, 2026-09-09)

The owner requested optional coloring of existing cell-type/tissue ZFA labels by fluorescent
protein and developmental time. `?lab=1` exposes the **Reporter preview** panel, registered as
the `'lab'` overlay alongside the About sheet. The panel predicts nothing, so the review of
2026-09-12 retired the name it launched under: "enhancer" implied a cis-regulatory prediction
the feature does not make, and "reporter" names only the fluorescent protein a rule assigns. The
picker uses the current modeled records, including group terms through "Include modeled parts".

This extends D1/D3 with a schematic tissue overlay and D10 with an optional appearance mode. Each
rule has a ZFA target, optional modeled descendants, an inclusive hpf window (equal endpoints
mean a snapshot), a reporter and an enable flag; the skin record is never a target and keeps its
ordinary anatomy-palette role. Reporter reuse and duplicate rules combine spatial coverage, not
intensity; reporters mix in linear color space, with per-channel views to disambiguate overlap.
Every present structure stays pickable while the preview is on, independent of display opacity.
The reporter table holds eight fluorescent proteins spaced to separate on the dark viewer
background: mTagBFP2, mTurquoise2, EGFP, mVenus, mKO2, mScarlet, mCherry and iRFP670, the last
shown as a magenta pseudocolour for its near-infrared peak.

Amendment to D10 and AR-26 (review of 2026-09-12): soft-tissue classes (wall, veil, tissue)
render with `roughness` 0.8 and `envMapIntensity` 0.15 for a matte finish; every other structure,
skin included, keeps `roughness` 0.55, `metalness` 0.05 and `envMapIntensity` 0.3 unchanged. The
preview scene and its exports use a third theme-token variant, `'fluorescence'` (background
`#060C14`), instead of the user's light or dark theme choice.

Existing presence, sex, visibility, clipping and isolation still apply. Colors and time windows
are user-authored display choices, not enhancer predictions, measured fluorescence or cell
positions. Rules are validated, versioned, and travel in share links and bookmarks; a stored kit
is read with a safe parse, and a bookmark with no fluorescence field keeps the live rule set
instead of clearing it. PNG export retains the materials and can include a reporter legend;
fluorescence exports identify the target preview. No new external biological dataset or package
is introduced.
