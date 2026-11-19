## 8. Review of the data model, validation rules, tests and work packages

This section is an adversarial review of sections 2, 3, 4 and 6 of the design specification against the decision record (D1 to D15), the research files, and the ZFIN snapshot (`anatomy_item.txt`, 3,113 rows; `anatomy_relationship.txt`, 5,992 rows; `stage_ontology.txt`, 45 rows; `zfa.obo` release 2026-07-16). Each finding quotes the specification, states the failure as input to wrong result, and proposes one fix. Severity: high blocks version 1 or embarrasses the presenter; medium should be fixed before implementation starts; low is polish. Finding ids carry the prefix RV.

### 8.1 What the review confirmed

These claims in the specification are correct and were checked against the source files.

| Claim | Check |
|---|---|
| DM-25: 220 draft records, 7 duplicate ids, 4 heart aliases, 27 new group nodes, 236 records | The five `.draft.json` files hold 220 records and 213 distinct ids. The 7 duplicates are ZFA:0000040, 0000669, 0000671, 0000694, 0001056, 0001185, 0001306. The 03c draft holds the 4 alias records. The section 3.4 table has 46 rows, of which 19 are draft records. |
| E002 target: every ZFA id in the specification resolves | 167 distinct ZFA ids appear in the specification. All resolve in `anatomy_item.txt` except ZFA:0009999 and ZFA:9999999, which are the error-message examples. |
| BG-27: SL-defined events placed by linear interpolation of the growth table | Every hpf value in the BG-27 table reproduces from the section 4.4 rows (for example 5.2 mm SL gives 322 hpf, 9.6 mm SL gives 853 hpf). |
| UI-03 worked values and QP-10 anchors | `hpfToTrack(42) = 0.3825`, `hpfToTrack(120) = 0.57`, `trackToHpf(0.75) = 616.5`, fraction 0.50 gives 67.64 hpf. |
| 3.5.1 field mapping | The draft field names match: 03a has `uiGroup` and `parentRelation`; 03e has `uiParent` and `parentAll`; 03b and 03c have `zfaPartOf`; 03c has `developsFrom` and `visibleNote`; 03d has `startNote`, `endNote`, `visibleNote`; `spatial.apFractionByStage` uses the keys `24`, `48`, `120`, `adult`. |

### 8.2 Findings

#### RV-01 (high) Every structure that reaches the axis end fades to zero at 180 dpf

**Spec.** DM-22: "`fadeOutHpf` uses the stage that contains `modelEndHpf`" with the default "5 percent of the duration" of that stage. BG-44 table, adult row: "clamped so that the fade ends before 4320". AR-32: "A structure at opacity 0 sets `visible = false`."

**Failure.** About 150 records have the ZFIN end stage Adult, so `modelEndHpf` defaults to 4320 (DM-21). The stage that contains 4320 is Adult, 2160 to 17520 hpf, 15,360 h long. Five percent is 768 h. Every such structure starts to fade at 3552 hpf (148 dpf) and reaches opacity 0 at 4320 hpf. Under the BG-44 reading (5 percent of the 2160 h axis share) the fade starts at 4212 hpf. Either way, at `t = 4320` the viewer shows the body tube from the body model and no organ. The `4320-lateral.png` and `4320-dorsal.png` screenshots of QP-32 fail the non-blank check or show an empty skin. A presenter who drags to the last headline tick loses the fish on stage.

**Fix.** Make the axis end a clamp, not an ending. DM-21: when `endHpf > 4320`, write `modelEndHpf: 4320` and `fadeOutHpf: 0`. Add rule E032: "`fadeOutHpf` is 0 when `modelEndHpf` equals 4320 and `endHpf` exceeds 4320." Apply the same rule to `visibleFromHpf: 0` (the root and the chorion have no fade-in at fertilization). Add a QP-11 style spot value to the schema test: the notochord has opacity 1 at 4320 hpf.

#### RV-02 (high) "Jump to first appearance" lands where the structure is invisible and unpickable

**Spec.** OV-34 and UI-20: the button "moves `t` to `visibleFromHpf`". BG-44: the structure "fades in over `fadeInHpf`" and "the fade drives material opacity from 0 to 1" starting at `visibleFromHpf`. AR-32: opacity 0 sets `visible = false`. AR-34: a mesh enables the raycast layer "only when its opacity is 0.3 or more".

**Failure.** The user selects the atrium at 24 hpf and clicks "Jump to High-pec (42 hpf)". At 42.00 hpf the atrium has opacity 0 and `visible = false`. The info card says "Present" and the 3D view shows nothing. The atrium becomes clickable at 42.09 hpf (30 percent of a 0.3 h fade). For a structure that appears in Days 7-13 the fade is 8.4 h, so the structure is invisible at the jump target and unpickable for 2.5 h of model time. Presentation mode turns on "Jump to appearance on select" (UI-02), so every search result in a talk opens on an invisible structure. Smoke step 8 asserts only that `t` equals `visibleFromHpf`; it passes while the screen is empty.

**Fix.** Define the jump target as `visibleFromHpf + fadeInHpf` in OV-34, UI-20, UX-IN-23, UX-EX-09 and smoke step 8, and name the target hpf on the button. Define "present" for the rail count, the tree filter and the presence badge as opacity above 0, and add the assertion "the jumped-to structure is on layer 1 and has opacity 1" to smoke step 8.

#### RV-03 (high) The `sizeRefSl` rescale divides by a null SL before 72 hpf

**Spec.** BG-43: "When keyframe `a` carries `sizeRefSl`, the runtime replaces each of its sizes by `size x SL(t) / a.sizeRefSl` before the `lerp`, and likewise for `b`." Section 6.8.1: `slAt(hpf): number | null // null before 72 hpf`. DM-14: "A keyframe before 72 hpf carries none."

**Failure.** The notochord example (BG-57) has keyframes at 48 hpf (no `sizeRefSl`) and 72 hpf (`sizeRefSl: 3.25`). At `t = 60` the bracket is (48, 72). Keyframe `b` carries `sizeRefSl`, so the runtime computes `radius x SL(60) / 3.25`. `SL(60)` is null. The result is NaN, E029 fails for every record that spans 72 hpf, and at runtime AR-71 hides the notochord, the heart, the eye and the gut between their last embryonic keyframe and 72 hpf. The claim in DM-16 that "the R3 to R4 boundary is continuous" depends on this undefined value.

**Fix.** Define `slScale(t, sizeRefSl) = SL(max(t, 72)) / sizeRefSl`, so a post-embryonic keyframe rescales by `SL(72) / sizeRefSl` while it is bracketed with an embryonic one. State the rule in BG-43 and DM-16. Add a QP-13 case: the notochord example at `t = 60` gives a finite `r0` between 0.0275 and 0.0275 x 3.25 / 3.25.

#### RV-04 (high) Four group nodes are handoff drivers or targets, and the eye cup has no owner after 30 hpf

**Spec.** Section 3.4 lists pronephros ZFA:0000151, gonad ZFA:0000413, kidney ZFA:0000529 and forebrain ZFA:0000109 as group nodes with `geometry: null`. BG-49 lists pronephros as the `driver` of `pronephros_mesonephros` ("kidney lathe along the same `u` range"), gonad as the `driver` of `gonad_sex`, kidney as its target, and forebrain as a target of `neural_tube_brain` ("the vesicles start as ellipsoids of the tube radius"). BG-50: "the `to` structure's first keyframe derives from the `driver`'s geometry". AR-70: a `geometry: null` record "never enters the rebuild queue". BG-36: the `eyeCup` builder "returns three sub-ranges that the lens, retina and retinal pigment epithelium records address by `part`"; section 3.4 makes eye ZFA:0000107 a group node.

**Failure.** The validator runs the BG-50 seed for `gonad_sex` at 600 hpf, asks the gonad for its interpolated parameters, and finds no geometry. The ovary has no first keyframe. The same happens for the kidney at 288 hpf and the forebrain at 22 hpf. For the eye: the optic cup ZFA:0001202 has the ZFIN window 20-25 somites to Prim-5 (19 to 30 hpf, `anatomy_item.txt`). The retina, lens and RPE are `derived` records with `sourceId` and run to adult. After 30 hpf no record holds the `eyeCup` parameters, so the three parts have no source and the eye disappears at 30 hpf. The 03b draft gives the eye a sphere and the kidney a strip; the specification removed both.

**Fix.** Remove pronephros, gonad, kidney and forebrain from the group-node list, or move the handoff endpoints to geometry-bearing children (glomerulus and pronephric duct; ovary and testis with a new `sexSpecific: 'female' | 'male' | null` field, since `present: false` is not a schema field; posterior kidney; telencephalon and diencephalon). Make eye ZFA:0000107 the `eyeCup` owner with an `aliasChain` of optic vesicle (11.66 to 19) and optic cup (19 to 24), the pattern D9 sets for the heart. Add rule E033: every handoff `driver` and every `derived` `sourceId` has non-null geometry that covers the target's presence window. Update DM-25 if the count changes.

#### RV-05 (high) Phase 1 cannot start: unowned files, phase 3 modules on the phase 1 path, and circular done-when criteria

**Spec.** Section 6.8: "A package edits only the files it owns." WP-05 "Must not touch: `src/core`". WP-06 "Done when: smoke steps 1, 4, 5, 6 pass". WP-05 "Done when: `npx playwright test tests/e2e/screenshots.spec.ts -g "24-lateral"` passes the non-blank check." WP-04 "Done when: `npm run validate` exits 0." WP-I2 (phase 3) owns `src/core/handoffs.ts` and `src/core/presence.ts`.

**Failure.** Section 2.2 names files that no phase 1 package owns: `src/core/palette.ts`, `format.ts`, `playback.ts`, `rebuildQueue.ts`, `attribution.ts`, `jsonSchema.ts`, `src/data/index.ts`, `src/ui/primitives/*`, `src/ui/hooks/*`, `Toast.tsx`, `ErrorScreens.tsx`, and `tests/e2e/smoke.spec.ts`. WP-05 needs `presenceAt` (step 2 of 2.3.1) and `rebuildQueue.ts`; both are outside its files and `presence.ts` belongs to phase 3. WP-07 needs `handoffs.ts` for E021 SL windows and the BG-50 seed; that file belongs to phase 3. WP-06 cannot pass smoke step 1 ("canvas non-blank") without WP-05, WP-05 cannot render without the store of WP-06 and the seed data of WP-04, WP-04 cannot pass `npm run validate` without WP-07's script and WP-03's builders (E029), and WP-07's done-when needs WP-04's seed data. Seven agents start tomorrow and four of them wait on each other.

**Fix.** Add an ownership table that assigns every file of section 2.2 to one package. Move `presence.ts` and `handoffs.ts` to WP-02, `rebuildQueue.ts`, `playback.ts`, `format.ts`, `palette.ts` to WP-03 or a new WP-08 "core utilities", `src/ui/primitives/*` and `hooks/*` to WP-01, and `tests/e2e/smoke.spec.ts` to WP-07. Split phase 1 into two waves: wave A is WP-01, WP-02, WP-03, WP-07 (validator on a fixture file); wave B is WP-04, WP-05, WP-06. Give wave B done-when criteria that do not depend on each other: WP-06 passes a store unit test and renders the timeline bar against a stub canvas; WP-05 renders the body from `body.json` alone before structures exist.

#### RV-06 (high) E029 rejects the chorion, the yolk, the eyes and every fin bud

**Spec.** E029: "The bounding box lies inside the body box of that time, with a 20 percent margin for the fins system." BG-06: "A fin bud or the pericardium sits at the skin (`|v| = 1` or `|w| = 1`) and protrudes by its own radius."

**Failure.** At 24 hpf the body half-heights peak at 0.20 mm (section 4.3.4) while the chorion radius is 1.00 mm (section 4.3.2). The yolk ball centre lies 0.34 mm below the spine with radius 0.275 mm, so its lowest point is 0.615 mm below the spine against a ventral half-height of 0.10 mm at `u = 0.35`. The eye cup of diameter 0.17 mm at `w = 0.8` and `u = 0.10` (BG-36) reaches 0.229 mm from the midline against a half-width of 0.18 mm. The pectoral fin bud protrudes by its radius by design. Each of these fails E029, and `npm run validate` cannot exit 0 on the WP-04 seed set (chorion, yolk, eye are three of its ten structures).

**Fix.** Define the body box as the union of the spine tube, the yolk and the chorion from `BodyFrame`, and add an optional `boundsMarginMm` on the geometry spec (default 0; fins 20 percent of the axis length; skin-attached records their largest radius). Keep E029 as an error for finite positions and make the box test a warning W007 with the margin, so an author sees a misplaced organ without blocking the build.

#### RV-07 (medium) Handoff windows, presence windows and the override list disagree

**Spec.** BG-48: "When the ZFIN stages disagree with the window, it clamps the `from` structures' `modelEndHpf` and the `to` structures' `visibleFromHpf` to the window." E021: "The window lies inside the `from` presence window. It starts at or before every `to` record's `visibleFromHpf` plus its `fadeInHpf`." W001: "The first keyframe lies at `visibleFromHpf`." E021 also: "Each `to` record's first keyframe lies inside the window."

**Failure.** The rules point in three directions. Somite ZFA:0000155 ends at 14-19 somites in ZFIN (19 hpf); the D9 window is 14 to 24 hpf and the per-segment windows run to 28.7 hpf, so E021 fails on the D9 row, and DM-21 lists no somite override. Otic vesicle ZFA:0000051 has the ZFIN end stage Unknown, so `endHpf` is 17520 and `modelEndHpf` defaults to 4320; the `otic_vesicle_ear` window is 66 to 72 hpf. Ovary and testis start at Days 21-29 (504 hpf) while `gonad_sex` starts at 600 hpf; the forebrain, midbrain, hindbrain and spinal cord start at 14 hpf while `neural_tube_brain` starts at 22 hpf; the myotome starts at 10.33 hpf while `somites_myotomes` starts at 14 hpf. For each target, BG-41 holds the seeded first keyframe from `visibleFromHpf`, so the forebrain ellipsoid shows from 14 hpf inside the neural tube, 8 h before the handoff. W001 fires for every seeded target because BG-50 stores no first keyframe. E008 covers only a start stage of Unknown, not an end stage of Unknown.

**Fix.** Delete the runtime clamp in BG-48. Add rule E034: a handoff target's `visibleFromHpf` equals the window start (the first segment's start for `perSegment`) and a handoff source's `modelEndHpf` equals the window end, each with an `overrideNote` that names the handoff id. Let the merge script write these overrides. Exempt seeded targets from W001 and let E021 check the first stored keyframe against the window end instead. Extend E008 to records whose `zfinEndStage` is ZFS:0000000: they must set `modelEndHpf` below 4320 with a note.

#### RV-08 (medium) E003 and E016 read the ZFIN files with the wrong vocabulary

**Spec.** E003: "Every ZFS id exists in `stage_ontology.txt`." Section 5.2.3 gives the period ids ZFS:0000046 (Cleavage), ZFS:0000045, ZFS:0000047, ZFS:0000049, ZFS:0000050, ZFS:0007000, ZFS:0000048, ZFS:0000051 and ZFS:0000044. E016: "`anatomy_relationship.txt` has that row for `(zfaParent, id)`" with relation `part_of`, `is_a` or `develops_from`.

**Failure.** `stage_ontology.txt` holds 45 rows: the 44 stages and ZFS:0000000. It holds no period term. The period ids above exist only in `zfa.obo` (checked: `id: ZFS:0000046`, `name: cleavage`). E003 therefore fails on 8 of the 10 `PeriodRecord.zfs` values and `stages.json` never validates. The adult period reuses the stage id ZFS:0000044 and passes by accident. In `anatomy_relationship.txt` the third column reads `is_a`, `part of` and `develops from`, with spaces, and column 1 is the parent (checked: `ZFA:0000010 ZFA:0000114 part of`). A validator that greps for `part_of` finds nothing and rejects every record with `parentRelation: part_of`.

**Fix.** E003: check stage ids against `stage_ontology.txt` and period ids against the `[Term]` ids of `zfa.obo` (or a committed `zfs.obo`), and state which file. E016: state the column order (parent, child, type) and the mapping `part_of` to `part of`, `develops_from` to `develops from`. Add `zfa.obo` to the DM-29 snapshot list.

#### RV-09 (medium) The interpolation type of a parameter cannot be derived from the zod schema

**Spec.** BG-47: "`ParamSpec` maps each field to its type from BG-42. The zod schema derives it, so a field cannot lack a type." BG-42 rescales `number` parameters by `sizeRefSl` and lists `u`, `v`, `w` among them.

**Failure.** `Mm`, `U`, `Signed`, `e1`, `count`, `ellipticity` and `phiLengthDeg` are all `z.number()` with different bounds. Nothing in the schema says which numbers are millimetres (rescaled), which are degrees (shortest-arc lerp), and which are fractions or counts. Names are inconsistent: `radii`, `radius`, `profile`, `outline` and `thicknessBaseMm` are all millimetres, but only the last says so; `CustomParams` is a `looseObject`, so the heart's `segments.atrium.rMm` is not in the schema at all. An implementer who rescales every `number` also rescales `u`, and an eye at `u = 0.10` moves to `u = 0.10 x SL(t) / sizeRefSl`. One who rescales only `*Mm` fields leaves `radii` at the 25 mm adult value in a 4 mm larva.

**Fix.** Adopt a naming rule and enforce it with a unit test that walks every numeric leaf of every schema, including the custom builders' own schemas: `*Mm` millimetres (rescaled), `*Deg` angle, `*Fraction` and `u`, `v`, `w`, `s0`, `s1`, `e1`, `e2` dimensionless, `count*` count. Rename `radii` to `radiiMm`, `radius` to `radiusMm` (`r0Mm`, `r1Mm`), `profile` entries to `[rMm, yMm]`, `outline` to `[chordMm, spanMm]`. Make every custom builder export a strict zod schema and register it in `CustomParams` as a discriminated union on `builder`, so `looseObject` disappears.

#### RV-10 (medium) Keyframe inheritance depth and array lengths are undefined

**Spec.** BG-41: "A parameter missing from keyframe `b` inherits its value from the nearest earlier keyframe that has it, so a keyframe lists only what changes." The heart example at 30 hpf writes `"segments": { "atrium": { "rMm": 0.0275, "rAcrossMm": 0.0275 }, "ventricle": { ... } }` and omits `s0`, `s1`, `sinusVenosus`, `avCanal` and `bulbus`. The notochord example at 24 hpf restates the whole `path` object. BG-42: "array (fixed length): element-wise number".

**Failure.** The heart example needs a deep merge per leaf; the strict primitive schemas forbid it, because `z.object(shape).partial()` is shallow and `radius: { r0, r1 }` or `path: { type, uStart, uEnd, v, w }` must be complete in every keyframe that mentions them. An implementer who merges shallowly drops the atrium's `s0` and `s1` at 30 hpf and the heart builder reads `undefined`. For arrays, a sheet whose `outline` has 6 points at 24 hpf and 8 points at 120 hpf has no element-wise lerp, and the `fin_fold_fins` seed produces an outline whose length no rule ties to the target's later keyframes.

**Fix.** State in BG-41: objects merge per leaf to any depth; arrays replace as a whole and must keep their length across the keyframes of one record. Add rule E035: every array parameter (`outline`, `profile`, `points`, `radii`) has the same length in every keyframe of a record, and a seeded first keyframe matches that length. Make the keyframe schemas deep-partial for objects (zod 4 has no built-in `deepPartial`; write the partial shapes by hand for the seven primitives).

#### RV-11 (medium) The `apFraction` to `u` rule divides by a null SL and equates EL with axis length

**Spec.** Section 3.5.4: "The rule per source is `u = apFraction x L_source / SL(t)`" with "`SL(t)` is `growth.standardLengthMm`", then the table gives "Factor applied 1.0" up to 72 hpf and the note "Before 72 hpf the fin fold adds no measurable length to the notochord, so the merge treats TL, EL and axis length as equal; this is an assumption."

**Failure.** `standardLengthMm` is null before 72 hpf (DM-18), so the formula has no value for the 24 and 48 hpf keys of `apFractionByStage` (22 and 10 records). The table's factor 1.0 contradicts the formula. The assumption is wrong for curled embryos: research 05 line 107 says "For curled embryos EL is shorter than the axis length", and section 4.3.2 gives EL 1.40 mm against axis length 1.80 mm at 19 hpf (22 percent) and 1.90 against 2.05 mm at 24 hpf (7 percent). A 03b record at `apFraction 0.9` of EL at 19 hpf lands at `u = 0.9` under the table's factor 1.0, but at `u = 0.70` under the specification's own formula with `L_source = EL`; the two positions are 0.36 mm apart on a 1.80 mm axis.

**Fix.** Write the rule as `u = apFraction x L_source(t) / axisLengthMm(t)` with `L_source(t)` from `growth.lengthMm` (EL or TL as the source states) and `axisLengthMm(t)` from `body.json`, for every source and every key. This gives 1.0 only where the source already used the axis (03a) or SL (03e). Remove the assumption sentence.

#### RV-12 (medium) The `dims_um` unit rule mislabels counts and volumes, and `dimsMm` carries non-lengths

**Spec.** Section 3.5.1: "`sizes[].dims_um` to `sizes[].dimsMm`: divided by 1000; `count`, `cells`, `tiers`, `*Deg`, `*Fraction` keys copied as they are." Schema: `dimsMm: z.record(z.string(), z.number())`.

**Failure.** The drafts use 76 distinct `dims_um` keys. `count_per_side` (16 rows), `neuromastCount` (9), `arches_per_side` (3), `filaments_per_arch` (3) and `lines` (2) match none of the exceptions and become 0.016, 0.009 and so on. `volume_um3` (4 rows) is divided by 1000 instead of 10^9. `headTrunkAngleDeg` and `chevronDeg` land in a field named `dimsMm`, and the info card renders "chevronDeg 40 mm". The laterality rule "first word: paired, bilateral or bilobed give paired" sorts `left-ventral` and `two` into `midline`.

**Fix.** Convert by an allowlist: keys matching `/count|cells|tiers|lines|_per_/i` copy; `/Deg$/` copy; `/Fraction$/` copy; `volume_um3` divides by 10^9 into `volumeMm3`; every other key divides by 1000. Split the schema into `dimsMm`, `counts` and `anglesDeg` records, and add rule W008 for a `dimsMm` key outside a known list. Extend the laterality rule to match `left` and `right` as prefixes and `two` as `paired`.

#### RV-13 (medium) How the Node scripts load `body.json` and `stages.json` is undefined

**Spec.** BG-10: "`bodyModel` is a pure function of `hpf` and of the loaded `body.json` and `stages.json`." Section 6.8.1: `bodyModel(hpf: number): BodyFrame`. AR-06: "The five JSON files under `src/data/` are imported statically." QP-03: "Relative imports in `scripts/` carry the `.ts` extension." D2: "Node 22.22 runs the validation scripts directly (type stripping)."

**Failure.** `scripts/validate-data.ts` must call `bodyModel` and `buildStructure` for E029. Node resolves `import './spine'` inside `src/core/bodyModel.ts` to nothing (ERR_MODULE_NOT_FOUND), because QP-03 requires extensions only under `scripts/`. A static `import body from '../data/body.json'` throws ERR_IMPORT_ATTRIBUTE_MISSING in Node 22 unless it carries `with { type: 'json' }`, and `package.json` never says `"type": "module"`. WP-03 (bodyModel) and WP-07 (validator) each guess a convention and one of them rewrites the other's imports.

**Fix.** Replace the bare function with a factory: `createBodyModel(body: BodyFile, growth: GrowthPoint[]): (hpf) => BodyFrame`, and let `src/data/index.ts` build the default instance for the app while scripts read the JSON with `fs` and `JSON.parse`. Add to QP-03: `"type": "module"` in `package.json`; every relative import under `src/core`, `src/data` and `scripts` carries its `.ts` or `.json` extension; JSON imports in `src/` carry `with { type: 'json' }`; `resolveJsonModule: true` in `tsconfig.json`. Add a CI step `node --input-type=module -e "import('./src/core/bodyModel.ts')"` to catch a regression.

#### RV-14 (medium) The body-model continuity test fails on the specification's own table, and null fields have no interpolation rule

**Spec.** QP-11: "Across each boundary sweep, no spine station moves more than 0.05 mm per 0.1 hpf step" in a window of 1 hpf on each side of 19 hpf. BG-23: "no station moves more than 0.6 mm per hour", "the largest measured step is the free tail between 18 and 19 hpf (0.55 mm)". Section 4.3.2 gives `chorionRadiusMm` 1.69 at 60 hpf and null at 72, `yolkBallDiaMm` 0.25 at 120 and null at 168, `slMm` null at 60 and 3.25 at 72. Section 4.2: "The runtime interpolates `body.json`."

**Failure.** The `u = 1.0` control point moves from (-0.05, -0.88) at 18 hpf to (0.50, -0.95) at 19 hpf, 0.554 mm in one hour. Linear interpolation gives 0.055 mm per 0.1 h; a smoothstep gives 0.083 mm at mid-window. Both exceed the QP-11 limit inside its 18 to 20 hpf window, so the test fails on the first run with correct data. The interpolation kind for `body.json` is not stated anywhere (BG-26 fixes linear only for the growth table). A chorion radius of 1.69 at 60 hpf and null at 72 hpf has no defined value at 66 hpf; the same holds for the yolk between 120 and 168 hpf, where the ball should shrink to nothing, not hold 0.125 mm and vanish.

**Fix.** Set the QP-11 limit to 0.07 mm per 0.1 h, or state the limit per station from the table. State in BG-24 that `body.json` interpolates linearly in hpf (consistent with BG-26). Replace null with explicit end values: `chorion.radiusMm` unchanged to 72 with presence from the chorion record, `yolkBall.radiusMm` 0 at 168, `slMm` equal to `axisLengthMm` before 72 (which also serves RV-03). Reserve null for fields that are absent at both bracketing keyframes.

#### RV-15 (medium) The URL `t` parameter rejects instead of clamping, and the round-trip test cannot pass as written

**Spec.** AR-45: `t: z.coerce.number().min(0).max(4320).default(24)`. AR-46: "A key that fails falls back to its default and adds one warning." AR-69: "A `t` above 4320 clamps with the toast 'Time clamped to 180 dpf'." QP-14: "`parse(serialize(state))` deep-equals `state` for 200 states drawn from a seeded generator"; AR-49: "The `t` value is rounded to 2 decimals", "`theme` appears only when 'Copy link' runs".

**Failure.** A slide link with `t=4400` fails `max(4320)`, falls back to 24 hpf, and shows the toast "Time clamped to 180 dpf" while the viewer sits at Prim-5. For QP-14, a generated state with `t = 24.123` serializes to `t=24.12`, so `parse(serialize(state))` differs from `state`; a generated `theme: 'light'` is dropped by AR-49; a generated `snap: undefined` in presentation mode parses back as 1. The test fails for most of the 200 states.

**Fix.** Write `t` as `z.coerce.number().transform(v => Math.min(Math.max(v, 0), 4320))` and push the clamp warning from the transform, so AR-46 and AR-69 agree. Write QP-14 as two properties: the generator draws only representable values (`t` to 2 decimals, `cam` to 3, `theme` set, `snap` set), and `serialize(parse(s)) === s` for a corpus of canonical strings.

#### RV-16 (low) The body skin is drawn but belongs to a record with no geometry

**Spec.** Section 2.2.4: `Body.tsx` draws "the body tube mesh from `bodyModel(t)`". Section 3.4: whole organism ZFA:0001094 is a group node, "the body model draws the body". AR-70: a `geometry: null` record "never enters the rebuild queue". AR-34 makes a mesh pickable at opacity 0.3 or more, and the default skin opacity is 0.45. Smoke step 2: "click the canvas centre" then "info card shows an id".

**Failure.** The click at the canvas centre at 24 hpf hits the skin or the yolk. If the skin mesh carries no record id, nothing is selected and step 2 fails. If it carries ZFA:0001094, the info card shows "No 3D geometry for this term" (UI-23) over a mesh the user just clicked.

**Fix.** Give the whole organism record `geometry: { kind: 'tube', path: { type: 'spine', uStart: 0, uEnd: 1 }, radius: 'body' }` (the builder of BG-30 exists for this) so the skin is a normal structure with a colour, a fade and a pick id, and let `Body.tsx` render only the yolk and the chorion from `BodyFrame`. Change smoke step 2 to click a projected point of a named structure (the eye at 24 hpf).

#### RV-17 (low) The tree has no defined top level for three systems

**Spec.** UI-17: "The tree opens with the system level expanded." WP-04: "`structures.json` with the 15 system group nodes and ten structures." UX-LY-05: the tree "shows the ZFA `part of` hierarchy under `whole organism`". Section 3.3: nervous system ZFA:0000396 and sensory system ZFA:0000282 are `zfaRoots`.

**Failure.** The group-node list of section 3.4 holds a system-level ZFA term for 12 systems but none for nervous (ZFA:0000396 absent), sensory (ZFA:0000282 absent) or axial (no ZFA term exists for it). The root ZFA:0001094 carries `system: axial` and therefore the axial swatch. WP-04 cannot write "15 system group nodes" from the list, and central nervous system ZFA:0000012 has no `uiParent` between itself and the root.

**Fix.** Either add ZFA:0000396 and ZFA:0000282 to the group-node list (DM-25 becomes 238) and state that axial records hang from the root directly, or make the tree's top level the 15 rows of `systems.json` computed at load, so no stored id is invented (DM-02 holds) and the root keeps no system colour.

#### RV-18 (low) Deploy job permissions, concurrency, and an empty test run

**Spec.** Section 6.6: workflow-level `permissions: { contents: read }`; the `deploy-pages` job sets `permissions: { pages: write, id-token: write }` and runs `actions/checkout@v4`; `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` covers both jobs. WP-01 done-when: "`npm ci && npm run check && npm run lint && npm test && npm run build` exit 0" on an empty app.

**Failure.** A job-level `permissions` block replaces the workflow block; every scope not listed becomes `none`, so the deploy job checks out with `contents: none`. This works only while the repository is public; a private mirror fails at checkout. `cancel-in-progress: true` also cancels a Pages deployment in flight when a second push lands, which GitHub's Pages starter workflow avoids. `vitest run` exits 1 when it finds no test file, so WP-01 cannot meet its done-when before WP-02 lands a test.

**Fix.** Add `contents: read` to the deploy job's permissions. Give the deploy job its own `concurrency: { group: pages, cancel-in-progress: false }`. Set `passWithNoTests: true` in `vitest.config.ts` for phase 1, or let WP-01 own one trivial test.

### 8.3 Order of repair

Fix RV-01, RV-02 and RV-03 first; they are one-line data rules and they change what every later author writes. Then settle RV-04, RV-07 and RV-17 together, because they change the group-node list, the handoff table and DM-25. RV-05 and RV-13 must be settled before any phase 1 agent starts. RV-09 and RV-10 change the schema and belong to WP-02's first commit. The rest can land during phase 1.

No finding above requires a change to the decision record. Each fix stays inside D1 to D15; RV-01 and RV-02 read D3's "window stated in the record" as permitting a zero window, and RV-04 reuses the alias pattern that D9 sets for the heart.
