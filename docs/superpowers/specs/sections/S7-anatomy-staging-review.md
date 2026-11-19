## Anatomy and staging review

Reviewer role: zebrafish developmental biologist, ZFIN curation perspective. Scope: the design spec `2026-09-06-zebrafish-3d-atlas-design.md` read in full against the decision record `2026-09-06-architecture-decisions.md`, the ZFIN raw files (ZFA release 2026-07-16: `anatomy_item.txt`, `anatomy_relationship.txt`, `stage_ontology.txt`, `zfs.obo`), and research files 02, 03a to 03e and 05.

What I verified in this session: every ZFA id in the spec against `anatomy_item.txt` (165 real ids; all resolve and every quoted name matches), the ZFA stage windows and `part of` rows quoted below, the ZFS stage table, and the research tables quoted below. What I did not verify: the page numbers of the papers I cite from memory (Kimmel et al. 1995, Parichy et al. 2009 beyond what research 02 quotes, Essner et al. 2005, Van der heyden and Huysseune 2000, Field et al. 2003, Alt et al. 2006, Uchida et al. 2002). Confirm those before the numbers enter a record.

Severity: high blocks version 1 or embarrasses the presenter; medium should change before implementation starts; low is polish. Each finding quotes the spec, states the failure as input to wrong result, and proposes a fix. Findings that require an edit to the decision record are repeated under "Conflicts with the decision record" at the end.

### High severity

#### R-01 Somite counts lag the stage names by one somite

Spec (section 4.3.2, scalar table): `| 14 | 10-13 somites | ... | 9 |`, `| 16 | 14-19 somites | ... | 13 |`, `| 18 | 14-19 somites | ... | 17 |`, `| 19 | 20-25 somites | ... | 19 |`, `| 22 | 26+ somites | ... | 25 |`, `| 24 | prim-5 | ... | 29 |`.

Failure: at `t = 16` the headline tick reads "14 som" (D7) and the somite `segmentArray` draws 13 segments. At `t = 22` the stage card reads "26+ somites" and the model shows 25. At `t = 14` the stage is "10-13 somites" and the model shows 9. Every stage start from 14 hpf on contradicts its own label by one.

Evidence: the ZFS stage names in `stage_ontology.txt` state the count at the stage start (10 at 14.00 h, 14 at 16.00 h, 20 at 19.00 h, 26 at 22.00 h). Research 05 section 4, which owns body-scale numbers under D11, tabulates 10 at 14 hpf, 14 at 16, 18 at 18 ("18 somites are present at 18 h", Kimmel et al. 1995), 20 at 19, 26 at 22, about 30 at 24, and 30 to 34 final. Kimmel's rates are 3 per hour for the first 5 to 6 somites, then 2 per hour.

Fix: generate `somiteCount` from the Kimmel rates and pin the stage starts: 0 at 10.0, 1 at 10.33, 5 at 11.66, 6 at 12, 10 at 14, 14 at 16, 18 at 18, 20 at 19, 26 at 22, 30 at 24, 31 from 26 hpf. The rule `count = min(6, 1 + 3 (t - 10.33))` for `t <= 12` and `count = min(30, 6 + 2 (t - 12))` for `12 < t <= 24` reproduces every pinned value. Add a unit test that asserts the count at each ZFS somite-stage start equals the lower bound in the stage name.

#### R-02 The chorion is inflated to three times its real size from 22 to 72 hpf

Spec (BG-19): "From 22 hpf the R3 posture is the dechorionated posture of the Kimmel figures, which does not fit inside 1.2 mm. The generator then sets the chorion radius to the smallest sphere that encloses the spine plus 0.15 mm". Section 4.3.2 gives `chorionRadiusMm` 1.00 at 24 hpf, 1.58 at 48 hpf and 1.69 at 60 hpf.

Failure: at `t = 48` the viewer draws a 3.2 mm chorion around a 3.1 mm embryo; at `t = 60` a 3.4 mm chorion. The real chorion is about 1.2 mm across (research 03a: measured embryo radius 397 um plus a 210 um perivitelline space). The prim-5, high-pec and long-pec headline screenshots (D13) will show an embryo in a chorion three times too large. Any zebrafish audience knows the 24 to 48 hpf embryo lies curled inside a 1.2 mm chorion with the tail wrapped along the yolk; Kimmel et al. 1995 photograph dechorionated embryos for that reason, and research 05 section 15 records the 26+ somite tail as "curled ventrally" from the Kimmel images.

Fix: keep the chorion at radius 0.60 mm from 0 to 72 hpf (D8 fixes only its end and fade). Raise `thetaTail` in R3 so the body fits: about 170 degrees at 22 to 24 hpf, 140 at 30, 110 at 36, 90 at 42 and 48, then straighten from 48 to 72 hpf as the chorion fades. Keep the D8 head-trunk series unchanged; the head angle is independent of the tail curl. This closes open conflict 7.2 item 2 without a decision change. If the owner prefers the dechorionated Kimmel posture, the chorion must not be drawn after 22 hpf, and that needs a D8 edit.

#### R-03 The D8 squamation value is Parichy's pelvic-fin-ray value

Spec (D8 table and BG-27): `| squamation onset | 8.6 mm SL |` and `| squamation onset | 8.6 | 758 |`.

Failure: the event marker, the tooltip text "SL 8.6 mm" and the scale record's `visibleFromHpf` place squamation at 758 hpf. Parichy et al. 2009 Table 4, as research 02 section 3.1 transcribes it, gives pelvic fin ray appearance (PR) at 8.5 to 8.7 mm SL (SSL 8.6) and squamation onset posterior (SP) at 9.5 to 9.6 mm SL (SSL 9.6), with SA at 10.1 to 10.4. A reader who knows the Parichy table sees the pelvic-fin-ray value labelled as squamation.

Fix: change the D8 row to 9.6 mm SL. Through the BG-26 table that is 853 hpf, the same hpf the spec already derives for "adult stripes complete 9.6". The ZFA scale start stage (Days 30-44, 720 to 1080 hpf) contains both values, so no ZFA override changes. This is a decision-record edit; see the conflicts list.

### Medium severity

#### R-04 The median fin fold starts at the pectoral fin bud instead of somite 8

Spec (BG-39): "The median fin fold is one `finSheet`. Its base runs from `u = 0.27` (somite 8) over the tail tip to the vent on the ventral side."

Failure: at `t = 24` the dorsal fin fold begins 0.55 mm behind the snout, directly above the pectoral fin bud (03e places the bud at apFraction 0.26 to 0.31; research 05 at 0.24). Every lateral screenshot from 24 to 120 hpf shows a fin fold that starts behind the ear.

Evidence: 03a somite record: "somite 1 just behind the otic placode; the vent lies at about somite 17". With somite 1 at `u` 0.25 and the vent at `u` 0.76 (spec section 4.3.5, 24 hpf), one somite spans 0.032 and somite 8 sits at `u` 0.47. Both drafts place the fold start at 0.40 (03a) and 0.42 (03e).

Fix: base `uStart` 0.46 at 24 hpf, 0.42 at 48 hpf, 0.40 from 72 hpf; ventral base from the vent (`ventU`). The 0.27 value belongs to no source.

#### R-05 The gonad handoff drives from a record that has no geometry

Spec (section 3.4): `| ZFA:0000413 | gonad | reproductive | draft 03d: group node; sex toggle switches the child |`. Spec (BG-49): `| gonad_sex | gonad ZFA:0000413 primordium | ovary ZFA:0000403 or testis ZFA:0000598 | 25 to 30 dpf (600 to 720 hpf) | gonad, sexToggle | the toggled target copies the primordium's placement and radii`.

Failure: at the window start (600 hpf) BG-50 evaluates the driver's interpolated parameters. The driver has `geometry: null`, so there is no placement and no radii to copy; the seed throws and E021 and E029 cannot run. ZFA has no "gonad primordium" alias on the gonad term; it has separate terms `gonad primordium` ZFA:0001262 (Unknown to Days 7-13) and `immature gonad` ZFA:0005272 (Days 14-20 to Days 21-29, 336 to 720 hpf). Ovary and testis both start at Days 21-29 (504 hpf) in ZFA, so the 600 hpf window start needs an `overrideNote` on both targets (E007).

Biology: every zebrafish first forms a juvenile ovary at about 10 to 14 dpf; males transform it into a testis between about 20 and 30 dpf (Takahashi 1977; Uchida et al. 2002; Maack and Segner 2003). The D9 window fits the transformation, and `immature gonad` is the ZFA term for the source.

Fix: add `immature gonad` ZFA:0005272 as a geometric record (paired ellipsoids, 03d gonad placement `u` 0.28 to 0.55, ventral to the pronephric ducts, `w` plus or minus 0.3) with `visibleFromHpf` 336. Make it the `from` and `driver` of `gonad_sex`. Keep gonad ZFA:0000413 as the group node. Set ovary and testis `visibleFromHpf` 600 with a note that cites the D9 window.

#### R-06 Brain regions are held back to 22 hpf against ZFA and Kimmel

Spec (BG-48): "When the ZFIN stages disagree with the window, it clamps the `from` structures' `modelEndHpf` and the `to` structures' `visibleFromHpf` to the window." Applied to `neural_tube_brain` (22 to 24 hpf), this sets forebrain, midbrain and hindbrain `visibleFromHpf` to 22.

Failure: at `t = 18` the viewer draws a featureless neural tube while it draws the optic cup and the otic vesicle beside it. The info card for forebrain reads "ZFIN: 10-13 somites (14 hpf) to Adult. Model: 22 to 4320 hpf" with no biological reason.

Evidence: `anatomy_item.txt` starts brain ZFA:0000008, forebrain ZFA:0000109, midbrain ZFA:0000128 and hindbrain ZFA:0000029 at 10-13 somites (14 hpf); the neural tube ZFA:0001135 runs 14 to 30 hpf in parallel (forebrain `develops from` forebrain neural tube). Kimmel et al. 1995 describe the brain as subdivided at the 10-somite stage and ten neuromeres at the 18-somite stage. The spinal cord ZFA:0000075 starts at Prim-5 (24 hpf), so the D9 window is right for the spinal cord.

Fix: do not clamp a `to` record's `visibleFromHpf` forward when its ZFA start precedes the window. Let forebrain, midbrain and hindbrain appear at 14 hpf as `subRange` sub-tubes of the neural tube (the three vesicles as slightly wider segments), and use the D9 window 22 to 24 hpf only to retire the neural tube mesh and to start the spinal cord. If D9 is read as "the regions do not exist before 22 hpf", D9 needs an edit; see the conflicts list.

#### R-07 Nine develops-from pairs in the drafts have no handoff row

Spec (D9): "`handoffs.json` lists every case where one structure becomes others." Spec (OV-20): "The only pops are the handoffs in D9, each inside its window." The 14 rows of BG-49 omit these pairs, all of which are records in the drafts and `develops from` rows in `anatomy_relationship.txt`:

| From (ZFA window) | To (ZFA start) | Proposed window | Basis |
|---|---|---|---|
| pectoral fin bud ZFA:0000141 (24 to 60; D8 bud 28) | pectoral fin ZFA:0001161 (30) | 48 to 60 hpf | Kimmel names 60 h "pec-fin" for the flattened fin blade |
| pelvic fin bud ZFA:0001384 (336 to 1080; D8 bud 7.2 mm SL) | pelvic fin ZFA:0001184 (720) | 8.5 to 8.7 mm SL (748 to 767 hpf) | Parichy 2009 PR, research 02 section 3.1 |
| liver primordium ZFA:0000124 (24 to 30) | liver ZFA:0000123 (30) | 28 to 30 hpf | ZFA windows abut |
| posterior pancreatic bud ZFA:0001370 (24 to 60), anterior pancreatic bud ZFA:0001369 (36 to 72) | pancreas ZFA:0000140 (48) | 48 to 60 hpf | bud fusion about 52 hpf (Field et al. 2003) |
| swim bladder bud ZFA:0005335 (36 to 60) | swim bladder ZFA:0000076 (60) | 55 to 60 hpf | ZFA windows abut |
| thyroid primordium ZFA:0001081 (30 to 60) | thyroid follicle ZFA:0001072 (48) | 48 to 60 hpf | first follicle about 55 hpf (Alt et al. 2006) |
| interrenal primordium ZFA:0001346 (19 to 96) | interrenal gland ZFA:0001345 (72) | 72 to 96 hpf | ZFA windows |
| otic placode ZFA:0000138 (10 to 24) | otic vesicle ZFA:0000051 (16) | 16 to 19 hpf | cavitation by the 18-somite stage (Haddon and Lewis 1996) |
| olfactory placode ZFA:0000048 (14 to 30) | peripheral olfactory organ ZFA:0000047 (30) | 28 to 30 hpf | ZFA windows abut |

Failure: at `t = 59.9` the pectoral fin bud mesh and the pectoral fin mesh overlap at `u` 0.26 to 0.31 (both records exist from 30 hpf); at `t = 60` the bud vanishes with a data fade and no cross-fade. The same pop happens at 30 hpf (liver), 60 hpf (swim bladder, pancreatic buds), 96 hpf (interrenal) and 720 to 1080 hpf (pelvic fin). OV-20 fails on the first scrub.

Fix: add the nine rows to `handoffs.json` with `seed: copyPlacement` and the windows above. Clamp the source `modelEndHpf` to each window end as BG-48 already does. If D9's table is read as exhaustive, the table needs these rows; see the conflicts list.

#### R-08 Kupffer's vesicle persists to 30 hpf

Spec (DM-21): "`modelEndHpf` defaults to the smaller of `endHpf` and 4320." The 03a Kupffer's vesicle record has `modelEndHpf: null` and the ZFA end stage Prim-5 (30 hpf), so the model draws the vesicle until 30 hpf.

Failure: the prim-5 (24 hpf) headline screenshot shows a vesicle under the tail. No such structure exists at 24 hpf. The 03a definition itself says "transiently present during most of the segmentation period".

Evidence: Kupffer's vesicle forms at the 1- to 2-somite stage and regresses between the 14- and 20-somite stages, 16 to 19 hpf (Kimmel et al. 1995 segmentation text; Essner et al. 2005). The ZFA end stage is a coarse annotation bin.

Fix: `modelEndHpf` 19 with `fadeOutHpf` 2 and an `overrideNote` that cites the sources; keep the ZFA end stage on the info card. Apply the same check to every record whose ZFA end stage is a wide bin and whose draft `modelEndHpf` is null (tail bud ZFA:0000077 ends Prim-5 too; it should end near 24 hpf when the fin fold and the last somites form).

#### R-09 The gut starts at the eye instead of the mouth

Spec (BG-35): "`path`: points from the mouth (`u` 0.12) to the vent (`ventU`)."

Failure: at `t = 120` (SL 3.6 mm) the pharynx and gut start 0.43 mm behind the snout, at the level of the eye. The mouth record (03d apFraction 0.00 to 0.03) floats 0.3 mm in front of the gut with no connection. The protruding-mouth stage (72 hpf) is named for the mouth moving anterior to the eye.

Evidence: 03d mouth record: "ventral between the eyes at 48 to 60 hpf; terminal at the snout tip from 72 hpf". ZFA lists the mouth and the pharynx as `part of` the digestive system.

Fix: start the gut path at the mouth record's placement: `u` 0.09, `v` -0.85 at 48 to 60 hpf (ventral, between the eyes); `u` 0.02, `v` -0.5 from 72 hpf (terminal). Keyframe the move over 60 to 72 hpf. Give the pharynx segment `u` 0.05 to 0.22 so the gill region and the ceratobranchial 5 teeth (03d `u` 0.20 to 0.24) sit on it.

#### R-10 A body cavity is filed under Respiratory to parent the swim bladder

Spec (section 3.4): `| ZFA:0007116 | pleuroperitoneal region | respiratory | parent of swim bladder; not described |` and `| ZFA:0007115 | pericardial region | cardiovascular | parent of pericardium; not described |`.

Failure: the systems tree shows "pleuroperitoneal region" under Respiratory. In `anatomy_relationship.txt` that term is an `anatomical cluster` with eleven `part of` children: intestine, pancreas, pronephros, gall bladder, gonad, spleen, kidney, swim bladder, visceral fat, pleuroperitoneal cavity and parietal peritoneum. It is the trunk body cavity, and W003 fires for every child whose `zfaParent` is this node. A biologist reads "pleuroperitoneal region: Respiratory" as an error.

Fix: parent the swim bladder directly to the respiratory system node ZFA:0000272 with `parentRelation: grouping` (D5 assigns the system; the ZFA `part of` row stays in the research file). Put the pleuroperitoneal region, if it stays in the tree, under trunk ZFA:0001115 in `axial` with the other body regions. Treat the pericardial region the same way for consistency, even though pericardium is its only child.

### Low severity

#### R-11 The tooth 5V event uses a stage-bin start as an event time

Spec (section 3.5.7, item 6): "the 'tooth 5V present' event moves from 96 to 72 hpf."

Failure: the info card lists "72 hpf tooth 5V present" next to "72 hpf tooth 3V starts", so two tooth positions appear at the same instant. The fact check moved the event because ZFA starts tooth 5V ZFA:0001142 at Protruding-mouth. That stage is the 72 to 96 hpf bin, so the 96 hpf event was inside it and the ZFA row did not refute it. Van der heyden and Huysseune 2000 place 4V1 initiation at 48 hpf, 4V1 attachment at about 80 hpf, and 5V1 about two days after 4V1, in the 80 to 96 hpf range; the 03d record encodes that sequence.

Fix: keep the event at 96 hpf with `hpfIsEstimate: true` and the citation. Add a rule for record authors: a ZFA start stage is a bin, never an event time.

#### R-12 The period ZFS ids are not in `stage_ontology.txt`, so E003 fails

Spec (section 3.2.2): `PeriodRecord.zfs` and section 5.2.3 list cleavage ZFS:0000046, blastula ZFS:0000045, gastrula ZFS:0000047, segmentation ZFS:0000049, pharyngula ZFS:0000050, hatching ZFS:0007000, larval ZFS:0000048, juvenile ZFS:0000051. Spec (E003): "Every ZFS id exists in `stage_ontology.txt`." Section 6.3 snapshots only `stage_ontology.txt` (45 rows).

Failure: `stage_ontology.txt` holds ZFS:0000000 to ZFS:0000044 only. The eight period ids exist only in `zfs.obo` (names there: cleavage, blastula, gastrula, segmentation, pharyngula, hatching, larva, juvenile). `npm run validate` fails E003 on eight period rows.

Fix: add `zfs.obo` to `docs/research/zfin/` and let E003 accept an id from either file. Use the obo name "larva" where the display name should match ZFS.

#### R-13 The yolk size row at 48 hpf disagrees with the drawn yolk

Spec (section 3.5.7, item 5): "yolk ZFA:0000084 at 48 hpf: `ballDiameter` 0.400 mm, `extensionLength` 0.600 mm". Spec (section 4.3.2, 48 hpf row): `yolkBallDiaMm` 0.44, `yolkExtLenMm` 0.65.

Failure: at `t = 48` the info card states a 0.40 mm ball while the yolk lathe (BG-33 reads `frame.yolk`) draws 0.44 mm. The ratios agree (1.50 and 1.48); the absolute values differ by 10 percent.

Fix: set the size row to 0.44 and 0.65 mm, which are the research 05 section 7 values, or generate the yolk size rows from `body.json` so the two files cannot drift.

#### R-14 The swim bladder is absent from 60 to 96 hpf while its ZFA window starts at 60

Spec (section 3.5.7, item 12): `| ZFA:0000076 | swim bladder | 60 | move to 96 |`. The 03c record sets `visibleFromHpf` 96, and its own note says "Show a collapsed sac from 60 hpf and inflate it at about 100 hpf."

Failure: the info card reads "ZFIN: Pec-fin (60 hpf) to Adult. Model: 96 to 4320 hpf"; the swim bladder bud record ends at 60 and nothing represents the organ for 36 hours; at 96 hpf the sac appears and inflates in one motion.

Fix: `visibleFromHpf` 60 with a collapsed sac (radius about 0.02 mm), the handoff of R-07 from the bud, and the D8 fade 96 to 120 hpf on the posterior chamber record ZFA:0001278 for the inflation. The spec's 60 hpf size row then stays.

#### R-15 The fin fold appears two hours after the ZFA start and six hours after the tail lifts

Spec (section 3.5.3): "median fin fold | 03a record | `visibleFromHpf` 24 and `modelEndHpf` 720 with notes". The 03a note itself reads "begins at 18 hpf".

Failure: from 19 hpf (tail free, BG-14) to 24 hpf the free tail is a bare rod. ZFA starts the median fin fold ZFA:0000040 at 26+ somites (22 hpf).

Fix: `visibleFromHpf` 19 with a height ramp from 0.02 mm to the 0.06 mm of BG-39 at 24 hpf; keep the ZFA start on the info card with the note.

#### R-16 The `extraembryonic structure` group node ends before its children

Spec (section 3.4): `| ZFA:0000020 | extraembryonic structure | early_embryo | draft 03a: grouping node |`, with the default `modelEndHpf` from ZFA (High-pec, 48 hpf). Its children yolk (168 hpf) and chorion (72 hpf) outlive it. The same pattern holds for `axis` ZFA:0000092 (ZFA end 14 hpf; the spec says regime R2 draws the wrapped axis to 19 hpf).

Failure: with UX-IN-26 on ("Only structures present now"), the tree hides the parent row at `t = 60` and the yolk row goes with it, although the yolk is drawn and selectable.

Fix: set the group node `modelEndHpf` to the latest child's `modelEndHpf` with a note, or add a tree rule that a group node is present while any descendant is present. Add W-rule: a group node's presence window must contain every child's window.

### Correct and non-obvious

- The D4 camera convention is right. With +x posterior, +y dorsal, +z left and the camera on +z looking along -z with +y up, screen right is `(-z) x (+y) = +x`, so the snout is on the left and the +z (left) flank faces the viewer. The dorsal, ventral, anterior, posterior and three-quarter rows of AR-40 all check out, and the BG-03 seed `B = N x T = -z` puts `w = +1` on the right side as D3 states.
- The heart alias chain matches `anatomy_item.txt` exactly: heart primordium 11.66 to 24, heart rudiment 19 to 24, primitive heart tube 22 to 30, heart tube 24 to 42, heart from High-pec 42 to adult. The contiguous storage of DM-24 is a fair reading of the overlapping ZFA windows.
- The D8 head-trunk angle of 35 degrees at 60 hpf restores the monotone Kimmel series 120, 95, 75, 55, 45, 35, 25; research 05 section 15 flags the ZFIN page value of 55 as a likely transcription error.
- The pronephros to kidney handoff at 12 to 14 dpf ends exactly where ZFA ends the pronephros (Days 7-13, 336 hpf); the `fin_fold_fins` window 5.2 to 6.6 mm SL spans Parichy's anal condensation to dorsal ray appearance; the period bounds and the 18 headline ticks all coincide with ZFS stage starts; `ZFA:0000282` has the five `is_a` children the spec claims (plus gustatory system), and liver and pancreatic system are `part of` the digestive system as stated.
- The `%-epiboly` mapping `theta_m = acos(1 - 2 f)` treats Kimmel's fraction as a fraction of the animal-vegetal height. On a sphere the height fraction equals the area fraction (Archimedes), so the BG-13 wording "fraction of the yolk cell surface" is also correct.

### Conflicts with the decision record

1. **D8, squamation onset 8.6 mm SL** (R-03). Parichy et al. 2009 Table 4 (research 02 section 3.1) gives squamation onset posterior at 9.5 to 9.6 mm SL; 8.6 is the pelvic fin ray value. Proposed edit: `squamation onset | 9.6 mm SL`. Severity high.

2. **D9, `neural tube -> brain regions and spinal cord, 22 to 24 hpf`** (R-06). ZFA starts forebrain, midbrain and hindbrain at 14 hpf and Kimmel describes ten neuromeres at 18 h. The window is right for the spinal cord (ZFA 24 hpf) and for retiring the neural tube mesh. Proposed reading, or edit: the brain regions appear at their ZFA start as sub-ranges of the tube; the 22 to 24 hpf window retires the tube and starts the spinal cord. Severity medium.

3. **D9, `median fin fold -> dorsal, anal, caudal fins, 5.2 to 6.6 mm SL`**. Parichy places caudal fin ray appearance at 4.9 to 5.1 mm SL (research 02 section 3.1; BG-27 lists it at 4.9 mm, 280 hpf), before the window opens. Under E021 the caudal fin's first keyframe must lie inside the window, so the model cannot show caudal rays at 4.9 mm, and ZFA starts the caudal fin ZFA:0001058 at Prim-5. Proposed edit: split the row into `fold -> caudal fin, 4.5 to 5.0 mm SL` (flexion onset to ray appearance) and `fold -> dorsal, anal fins, 5.2 to 6.6 mm SL`. Severity medium.

4. **D9, exhaustiveness of the handoff table** (R-07). D9 says `handoffs.json` "lists every case where one structure becomes others" and then lists 13 rows. Nine further develops-from pairs exist among the 220 records. Proposed edit: add the nine rows of R-07, or state that the D9 table is the minimum set and `handoffs.json` may extend it. Severity medium.

5. **D5, swim bladder under `respiratory`**. In ZFA the swim bladder is `part of` the pleuroperitoneal region and `develops from` the swim bladder bud of the gut; the respiratory system's only `part of` child is the gill. Zebrafish are physostomes that do not air-breathe; the organ serves buoyancy and hearing through the Weberian apparatus (also a D5 item, under skeletal). An expert audience will question "Respiratory: swim bladder". Proposed edit: `digestive` with `alsoIn: [respiratory]`, or keep `respiratory` and rename the slot "Respiratory and swim bladder". Severity medium.

6. **D5, pharyngeal arch under `respiratory`**. ZFA files the pharyngeal arch ZFA:0001306 under head only. Arches 1 and 2 (mandibular, hyoid) build the jaw and the opercular series and have no respiratory role; only arches 3 to 7 carry gills. Proposed edit: pharyngeal arch in `skeletal` (or a head group in `axial`) with `alsoIn: [respiratory]`, and the gill arches 3 to 7 also in respiratory. Severity medium.

7. **D5, floor plate under `axial`**. ZFA files the floor plate ZFA:0000022 as `part of` the central nervous system, and the 03a draft assigned it to nervous. The tree will show a neural tube structure under Axial and W003 fires on its parent. Proposed edit: `nervous` with `alsoIn: [axial]`. Severity low.

8. **D5, head kidney**. Complies. ZFA also files the head kidney `part of` the endocrine system (interrenal tissue) and the hematopoietic system. Proposed addition, no conflict: `alsoIn: [hematopoietic_immune, endocrine]`. Severity low.
