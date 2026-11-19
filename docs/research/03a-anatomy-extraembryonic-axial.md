# 03a. Anatomy research: early embryo, extraembryonic and axial structures

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Scope: the structures that let the model draw the zebrafish from the 1-cell zygote through segmentation, and the yolk through the larval period. This document covers the chorion, the yolk and its parts, the blastodisc and blastoderm, the gastrula layers, the tail bud, Kupffer's vesicle, the hatching gland, the periderm, the notochord, the somites and myotomes, the floor plate, the hypochord, the median fin fold, and the body regions. The companion file `03a-anatomy-extraembryonic-axial.draft.json` holds the same data in the agreed JSON draft format.

Abbreviations: ZFA = Zebrafish Anatomy Ontology; ZFS = Zebrafish Stage Ontology; hpf = hours post fertilization at 28.5 C; dpf = days post fertilization; EL = embryo length as defined by Kimmel et al. 1995; SL = standard length; HTA = head-trunk angle; YSL = yolk syncytial layer; EVL = enveloping layer; DEL = deep cell layer; KV = Kupffer's vesicle; PSM = presomitic mesoderm.

## 1. Method

1. I extracted candidate terms from `anatomy_item.txt`, `anatomy_relationship.txt`, `anatomy_synonyms.txt` and `zfa.obo` (ZFA release 2026-07-16) with grep and a Python parser. I read the definitions, the `is_a`, `part_of` and `develops_from` relations, and the `start` and `end` stage relations.
2. I kept 42 terms at organ, tissue or region level. I dropped cell-level terms (adaxial cell, muscle pioneer, notochord sheath cell) and per-somite terms (somite 1 to somite 30, myotome somite n, sclerotome somite n).
3. I mapped each ZFIN start and end stage to hpf with `stage_ontology.txt`. `startHpf` is the start of the start stage. `endHpf` is the end of the end stage. For terms that end at Adult this gives 17520 hpf (2 years). The JSON example in the task used 2160 for adult; the app should treat any `endStage` of ZFS:0000044 as "present in the adult".
4. I took stage descriptions and embryo lengths from the ZFIN copy of Kimmel et al. 1995 (https://zfin.org/zf_info/zfbook/stages/index.html and the per-period pages). ZFIN refused many connections during this session, so I could fetch only some pages. Numbers I could not confirm carry the mark "(unverified)".
5. I took post-embryonic sizes from Parichy et al. 2009 (Dev Dyn 238:2975-3015, https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/) and Singleman and Holtzman 2014 (Zebrafish 11:396-406, https://europepmc.org/api/getPdf?pmcid=PMC4108942).
6. Where no published measurement exists for a size, I give an estimate and mark it "estimate". The estimates come from the published body length at that stage and from the proportions in the ZFIN stage drawings. Treat them as starting values for the geometry parameters.

Conventions in the JSON:

- `system` uses the fixed list from the task. The list has no entry for the early embryo or for body regions. I put early embryo structures and body regions under `axial` and added a `uiGroup` field with the values `extraembryonic`, `early_embryo`, `axial`, `fin_fold` and `body_region`. The floor plate keeps `nervous`, the myotome and myosepta keep `muscular`, the periderm keeps `integument_pigment`, and the fin fold keeps `fins`.
- `parent` is the node to use in the UI tree. `parentRelation` says whether ZFA states this as `part_of`, `is_a`, or whether I chose it as a `grouping` for the UI because ZFA gives no `part_of` parent. Three parents live in other documents: trunk musculature (ZFA:0000473), central nervous system (ZFA:0000012) and endoderm (ZFA:0000017).
- `visibleFromHpf` marks the time at which a schematic model should first draw the structure when that time differs from the ZFA start stage. `modelEndHpf` marks the time at which the model should stop drawing the structure when ZFA ends the term early.
- Sizes are in micrometers. Keys such as `count`, `cells`, `arcDeg`, `chevronDeg`, `headTrunkAngleDeg` and `coverageFraction` are not lengths.

## 2. Whole-body outline per stage

The body outline is the parent shape for every other structure. The table gives the outline, the published length and the head-trunk angle per stage. EL is the embryo length from Kimmel et al. 1995 Table 1 as reproduced at https://zfin.org/zf_info/zfbook/stages/index.html. HTA values come from https://zfin.org/zf_info/zfbook/stages/phar_stgs.html and https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html. Kimmel defines the HTA as the angle between a line through the middle of the ear and the eye and a line parallel to the notochord in myotomes 5 to 10 (https://zfin.org/zf_info/zfbook/stages/figs/fig33.html).

| Stage | hpf | Outline for the model | Length | HTA | Source |
|---|---|---|---|---|---|
| 1-cell | 0 to 0.75 | Sphere. A clear dome (blastodisc) rises at the animal pole within 10 min. | 0.7 mm diameter | none | Kimmel zygote page |
| 2-cell to 64-cell | 0.75 to 2.25 | Blastodisc cleaves into 2, 2x2, 2x4, 4x4, 4x8 arrays, then three tiers. Cleavage is partial; blastomeres stay open to the yolk. | 0.7 mm | none | Kimmel cleave_stgs page |
| 128-cell to 1k-cell | 2.25 to 3.33 | Blastodisc is a high mound, a solid half ball on the yolk. YSL forms as a ring of about 20 nuclei at 1k-cell. | 0.7 mm | none | Kimmel blast_stgs page |
| High, oblong, sphere | 3.33 to 4.33 | Blastodisc flattens onto the yolk. At sphere the embryo is a sphere with a flat blastodisc-yolk interface. | 0.65 to 0.70 mm | none | Kimmel blast_stgs; Kobitski 2015 |
| Dome, 30 percent epiboly | 4.33 to 5.25 | Yolk domes into the blastoderm. Blastoderm becomes a cup of uniform thickness covering 30 percent of the animal-vegetal distance. | 0.65 to 0.70 mm | none | Kimmel blast_stgs |
| 50 percent, germ ring, shield | 5.25 to 8 | Cup reaches the equator. Rim thickens (germ ring). Dorsal bulge (shield) spans about 30 degrees of longitude. | 0.65 to 0.70 mm | none | Kimmel gast page |
| 75 percent, 90 percent, bud | 8 to 10.33 | Epiboly advances about 15 percent per hour. Dorsal side thickens into the axis. Yolk plug closes at bud. Tail bud and polster appear. | 0.65 to 0.70 mm | none | Kimmel gast page |
| 1 to 9 somites | 10.33 to 14 | Axis wraps around the yolk sphere from animal pole to vegetal pole. Somites appear at 3 per hour. KV appears under the tail bud. | EL 0.8 mm | none | Kimmel seg_stgs page |
| 10 to 13 somites | 14 to 16 | Yolk ball and yolk extension become separate regions in ZFA. Polster moves to the pericardium as the hatching gland. | about 0.85 mm (estimate) | none | ZFA; Kimmel |
| 14 to 19 somites | 16 to 19 | Tail bud protrudes away from the yolk. A constriction marks the posterior yolk. Somites at 2 per hour. Notochord shows a stack-of-pennies pattern. | EL 0.9 mm | none | Kimmel seg_stgs page |
| 20 to 25 somites | 19 to 22 | Tail elongates behind the yolk. Otic vesicle with two otoliths. First weak trunk contractions. | EL 1.4 mm | none | Kimmel seg_stgs page |
| 26+ somites | 22 to 24 | Posterior trunk nearly straight. Tail still curves ventrally. Yolk extension nearly the length of the yolk ball. | EL 1.6 mm | none | Kimmel seg_stgs page |
| Prim-5 | 24 to 30 | Head bent over the yolk. About 30 somites, 13 in the tail. Median fin fold recognizable. Yolk extension length equals yolk ball diameter. | EL 1.9 mm | 120 deg | Kimmel phar_stgs page |
| Prim-15 | 30 to 36 | Yolk extension longer than the yolk ball. Pectoral fin buds as shallow domes. Tail morphogenesis nearly complete. | EL 2.5 mm | 95 deg | Kimmel phar_stgs page |
| Prim-25 | 36 to 42 | Extension markedly longer than the ball. Actinotrichia in the fin fold. | EL 2.7 mm | 75 deg | Kimmel phar_stgs page |
| High-pec | 42 to 48 | Yolk extension cylindrical with a conical posterior taper. Heart bends. | EL 2.9 mm | 55 deg | Kimmel phar_stgs page |
| Long-pec | 48 to 60 | Yolk volume about equals head volume. Hatching begins. | EL 3.1 mm | 45 deg | Kimmel hatch_stgs page |
| Pec-fin | 60 to 72 | Pectoral fin blade extends over the yolk ball. Mouth opens. | EL 3.3 mm | 35 deg (unverified; the fetched ZFIN text read 55 deg, which conflicts with monotonic straightening) | Kimmel hatch_stgs page |
| Protruding-mouth | 72 to 96 | Straight larva. Mouth protrudes past the eye. | 3.5 mm total length | 25 deg (unverified) | Kimmel Table 1 |
| Day 4 | 96 to 120 | Swim bladder inflates at 3.4 to 3.7 mm SL. Yolk extension nearly empties. Gut drops ventrally. | 3.7 mm | none | Kimmel Table 1; larval page; Parichy 2009 |
| Day 5 | 120 to 144 | Feeding larva with a small yolk remnant. | 3.9 mm | none | Kimmel Table 1 |
| Day 6 | 144 to 168 | Yolk gone by about 7 dpf. | 4.2 mm | none | Kimmel Table 1; PMC8126416 |
| Days 7 to 13 | 168 to 336 | Notochord flexion begins at about 4.5 mm SL. | 4.5 mm | none | Kimmel Table 1; Parichy 2009 |
| Days 14 to 20 | 336 to 504 | Caudal fin rays at 4.9 to 5.1 mm SL. Anal and dorsal fin condensations at 5.2 to 5.8 mm SL. Flexion complete at 6.5 mm SL with a final angle of about 45 degrees. | 6.2 mm | none | Kimmel Table 1; Parichy 2009 |
| Days 21 to 29 | 504 to 720 | Fin fold remnants cover the posterior two thirds of the tail by 7.4 mm SL. Pelvic fin buds at 7.2 to 7.5 mm SL. | 7.8 mm | none | Kimmel Table 1; Parichy 2009 |
| Juvenile days 30 to 44 | 720 to 1080 | Squamation 9.5 to 10.4 mm SL. Juvenile from 11.3 to 11.7 mm SL. | 10 mm | none | Kimmel Table 1; Parichy 2009 |
| Juvenile days 45 to 89 | 1080 to 2160 | Juvenile body with adult fins and pigment. | 14 mm total length; about 12 mm SL at 45 dpf | none | Kimmel Table 1; Singleman 2014 |
| Adult | 2160 and later | Fusiform adult. | about 18 mm SL at 90 dpf; median about 28 mm SL at 180 dpf; reference adults 17.5 mm SL (male) and 18.3 mm SL (female) | none | Singleman 2014 Fig. 1; Parichy 2009 |

Epiboly coverage for the blastoderm shell: 30 percent at 4.66 hpf, 50 percent at 5.25 hpf, 75 percent at 8 hpf, 90 percent at 9 hpf, 100 percent at 10 hpf (https://zfin.org/zf_info/zfbook/stages/index.html). Between 50 percent and 100 percent the margin advances about 15 percent per hour (https://zfin.org/zf_info/zfbook/stages/gast.html).

Body region fractions along the axis, measured from the snout tip (estimates from the ZFIN stage drawings and the somite counts; treat as starting values):

| Stage | Head | Trunk (to the vent) | Post-vent region | Basis |
|---|---|---|---|---|
| 24 hpf | 0.00 to 0.28 | 0.28 to 0.62 | 0.62 to 1.00 | 17 trunk somites and 13 tail somites at prim-5 (Kimmel); tail somites shorter than trunk somites (Schroeter 2008) |
| 48 hpf | 0.00 to 0.25 | 0.25 to 0.60 | 0.60 to 1.00 | estimate |
| 120 hpf | 0.00 to 0.22 | 0.22 to 0.58 | 0.58 to 1.00 | estimate |
| Adult (SL) | 0.00 to 0.25 | 0.25 to 0.60 | 0.60 to 1.00 plus the caudal fin | estimate |

## 3. Structure tables

### 3.1 Extraembryonic


| ZFA id | Name | Parent (relation) | ZFIN start (hpf) | ZFIN end (hpf) | Position | Shape | Color |
|---|---|---|---|---|---|---|---|
| ZFA:0000020 | extraembryonic structure | none (root) | Zygote:1-cell (0) | Pharyngula:High-pec (48) | AP 0.00 to 1.00; surrounds the embryo; midline | custom | #CFD8DC |
| ZFA:0000329 | chorion | ZFA:0000020 extraembryonic structure (is_a) | Zygote:1-cell (0) | Pharyngula:High-pec (48) | AP 0.00 to 1.00; encloses the whole egg; midline | sphere | #C8D0D8 |
| ZFA:0000084 | yolk | ZFA:0001094 whole organism (grouping) | Zygote:1-cell (0) | Larval:Day 5 (144) | AP 0.20 to 0.62; ventral to the body axis from segmentation onward; the whole egg minus the blastodisc before that; midline | lathe | #F2C94C |
| ZFA:0000088 | yolk syncytial layer | ZFA:0000084 yolk (grouping) | Blastula:1k-cell (3) | Larval:Day 5 (144) | AP 0.20 to 0.62; outer shell of the yolk cell, directly under the blastoderm and later under the embryo body and periderm; midline | sheet | #E0B84A |
| ZFA:0000006 | ball | ZFA:0000084 yolk (part_of) | Segmentation:10-13 somites (14) | Larval:Day 4 (120) | AP 0.20 to 0.45; ventral to head and anterior trunk; midline | ellipsoid | #F2C94C |
| ZFA:0000106 | extension | ZFA:0000084 yolk (part_of) | Segmentation:10-13 somites (14) | Larval:Day 4 (120) | AP 0.45 to 0.62; ventral to the mid trunk; the gut runs along its dorsal surface; midline | tube | #F2C94C |


### 3.2 Early embryo (zygote to segmentation)

| ZFA id | Name | Parent (relation) | ZFIN start (hpf) | ZFIN end (hpf) | Position | Shape | Color |
|---|---|---|---|---|---|---|---|
| ZFA:0005772 | fertilized egg | ZFA:0001094 whole organism (grouping) | Zygote:1-cell (0) | Zygote:1-cell (0.75) | AP 0.00 to 1.00; animal pole up (blastodisc), vegetal pole down (yolk); midline | sphere | #F5E6C8 |
| ZFA:0001175 | blastodisc | ZFA:0001094 whole organism (grouping) | Zygote:1-cell (0) | Blastula:Dome (4.66) | AP 0.00 to 0.30; animal pole cap on the yolk; midline | ellipsoid | #E8D5B7 |
| ZFA:0000093 | blastomere | ZFA:0001175 blastodisc (part_of) | Zygote:1-cell (0) | Blastula:Dome (4.66) | AP 0.00 to 0.30; within the blastodisc cap; paired arrays across the midline | segmentArray | #EBDDC3 |
| ZFA:0001176 | blastoderm | ZFA:0001094 whole organism (grouping) | Blastula:30%-epiboly (4.66) | Gastrula:Bud (10.33) | AP 0.00 to 1.00; cap over the animal hemisphere that spreads to the vegetal pole; midline; thicker on the dorsal side from 75 percent epiboly | sheet | #D9C7A6 |
| ZFA:0000086 | EVL | ZFA:0001176 blastoderm (part_of) | Blastula:30%-epiboly (4.66) | Gastrula:90%-epiboly (10) | AP 0.00 to 1.00; outer surface of the blastoderm; midline | sheet | #B9D3EE |
| ZFA:0000711 | DEL | ZFA:0001176 blastoderm (part_of) | Blastula:30%-epiboly (4.66) | Gastrula:Bud (10.33) | AP 0.00 to 1.00; between the EVL and the YSL; midline | sheet | #CBBBA0 |
| ZFA:0000038 | margin | ZFA:0001176 blastoderm (grouping) | Blastula:30%-epiboly (4.66) | Gastrula:Bud (10.33) | AP 0.00 to 1.00; a latitude circle on the yolk sphere that moves from 30 percent to 100 percent epiboly; midline ring | custom | #8FA3C0 |
| ZFA:0000111 | germ ring | ZFA:0001176 blastoderm (grouping) | Gastrula:Germ-ring (5.66) | Gastrula:Bud (10.33) | AP 0.00 to 1.00; equatorial band at 50 percent epiboly, then moves vegetally; midline ring; thickest dorsally at the shield | custom | #7F94B8 |
| ZFA:0000071 | shield | ZFA:0000111 germ ring (part_of) | Gastrula:Shield (6) | Gastrula:Shield (8) | AP 0.00 to 0.10; dorsal; at the germ ring on the future dorsal midline; midline | ellipsoid | #5B6FA6 |
| ZFA:0000018 | epiblast | ZFA:0000111 germ ring (part_of) | Gastrula:Germ-ring (5.66) | Gastrula:Bud (10.33) | AP 0.00 to 1.00; outer layer of the blastoderm, under the EVL; midline | sheet | #B7CDE3 |
| ZFA:0000117 | hypoblast | ZFA:0000111 germ ring (part_of) | Gastrula:Germ-ring (5.66) | Gastrula:Bud (10.33) | AP 0.00 to 1.00; inner layer, directly on the YSL; midline; thickest along the dorsal axis | sheet | #D7A88B |
| ZFA:0000077 | tail bud | ZFA:0001094 whole organism (grouping) | Gastrula:Bud (10) | Pharyngula:Prim-5 (30) | AP 0.95 to 1.00; posterior end of the axis; on the yolk until 16 hpf, then free; midline | ellipsoid | #9C8CB8 |
| ZFA:0000001 | Kupffer's vesicle | ZFA:0000077 tail bud (part_of) | Segmentation:1-4 somites (10.33) | Pharyngula:Prim-5 (30) | AP 0.92 to 0.96; ventral; dorsal half at the posterior end of the notochord, ventral half indents the yolk; midline | sphere | #4FC3F7 |
| ZFA:0000058 | polster | ZFA:0000060 prechordal plate (part_of) | Gastrula:Bud (10) | Pharyngula:Prim-5 (30) | AP 0.00 to 0.06; ventral to the forebrain, on the yolk; midline | ellipsoid | #D4A5A5 |
| ZFA:0000026 | hatching gland | ZFA:0001094 whole organism (grouping) | Segmentation:10-13 somites (14) | Hatching:Pec-fin (72) | AP 0.08 to 0.16; ventral; on the pericardium at the anterior face of the yolk ball, under the head; midline, spread bilaterally as a transverse band | sheet | #E57373 |
| ZFA:0001185 | periderm | ZFA:0001094 whole organism (grouping) | Gastrula:Bud (10) | Segmentation:26+ somites (24) | AP 0.00 to 1.00; outer skin of the whole embryo including the yolk; midline | sheet | #DDE7EE |


### 3.3 Axial

| ZFA id | Name | Parent (relation) | ZFIN start (hpf) | ZFIN end (hpf) | Position | Shape | Color |
|---|---|---|---|---|---|---|---|
| ZFA:0000091 | axial chorda mesoderm | ZFA:0000092 axis (grouping) | Gastrula:75%-epiboly (8) | Gastrula:Bud (10.33) | AP 0.10 to 1.00; dorsal midline of the hypoblast, under the neural plate; midline | tube | #A6C48A |
| ZFA:0000060 | prechordal plate | ZFA:0000092 axis (grouping) | Gastrula:75%-epiboly (8) | Pharyngula:Prim-5 (30) | AP 0.00 to 0.10; under the anterior neural plate on the yolk; midline | ellipsoid | #C9A66B |
| ZFA:0000135 | notochord | ZFA:0001094 whole organism (grouping) | Gastrula:Bud (10) | Adult (17520) | AP 0.12 to 1.00; ventral to the neural tube, dorsal to the hypochord and dorsal aorta; midline | tube | #9CCC65 |
| ZFA:0000255 | paraxial mesoderm | ZFA:0001094 whole organism (grouping) | Gastrula:Bud (10) | Hatching:Pec-fin (72) | AP 0.20 to 1.00; lateral to the notochord and neural tube; paired | custom | #F8BBD0 |
| ZFA:0000279 | segmental plate | ZFA:0000255 paraxial mesoderm (part_of) | Gastrula:Bud (10) | Pharyngula:Prim-5 (30) | AP 0.80 to 1.00; lateral to the posterior notochord, ventral to the neural tube; paired | tube | #F48FB1 |
| ZFA:0000155 | somite | ZFA:0001115 trunk (part_of) | Segmentation:1-4 somites (10.33) | Hatching:Pec-fin (72) | AP 0.25 to 0.97; lateral to the notochord and neural tube; extend from dorsal to ventral midline in the tail; paired | segmentArray | #EF9A9A |
| ZFA:0001056 | myotome | ZFA:0000473 (other document) (part_of) | Segmentation:1-4 somites (10.33) | Adult (17520) | AP 0.25 to 0.97; the whole flank between dorsal and ventral midlines, split by the horizontal myoseptum into epaxial and hypaxial halves; paired | segmentArray | #E57373 |
| ZFA:0001089 | myoseptum | ZFA:0001056 myotome (part_of) | Segmentation:1-4 somites (10.33) | Adult (17520) | AP 0.25 to 0.97; full body height between adjacent myotomes; paired | sheet | #B71C1C |
| ZFA:0000671 | horizontal myoseptum | ZFA:0001089 myoseptum (is_a) | Segmentation:26+ somites (22) | Adult (17520) | AP 0.25 to 0.97; at the level of the notochord, mid height of the flank; paired | sheet | #8E0000 |
| ZFA:0000022 | floor plate | ZFA:0000012 (other document) (part_of) | Segmentation:5-9 somites (11.66) | Adult (17520) | AP 0.12 to 0.98; ventral midline of the neural tube, directly dorsal to the notochord; midline | tube | #7986CB |
| ZFA:0000031 | hypochord | ZFA:0000017 (other document) (part_of) | Segmentation:10-13 somites (14) | Larval:Protruding-mouth (96) | AP 0.30 to 0.97; directly ventral to the notochord, dorsal to the dorsal aorta; midline | tube | #A1887F |


### 3.4 Median fin fold

| ZFA id | Name | Parent (relation) | ZFIN start (hpf) | ZFIN end (hpf) | Position | Shape | Color |
|---|---|---|---|---|---|---|---|
| ZFA:0000040 | median fin fold | ZFA:0001094 whole organism (grouping) | Segmentation:26+ somites (22) | Larval:Day 5 (144) | AP 0.40 to 1.00; dorsal midline from somite 8 to the tail tip, around the tail, and ventral midline forward to the vent; midline | fin | #B3E5FC |
| ZFA:0000102 | dorsal fin fold | ZFA:0000040 median fin fold (part_of) | Segmentation:26+ somites (22) | Larval:Day 5 (144) | AP 0.40 to 0.95; dorsal midline from somite 8 to near the tail tip; midline | fin | #B3E5FC |
| ZFA:0001069 | ventral fin fold | ZFA:0000040 median fin fold (part_of) | Segmentation:26+ somites (22) | Larval:Day 5 (144) | AP 0.62 to 1.00; ventral midline from the vent to the tail tip and around the tip; midline | fin | #B3E5FC |


### 3.5 Body regions

| ZFA id | Name | Parent (relation) | ZFIN start (hpf) | ZFIN end (hpf) | Position | Shape | Color |
|---|---|---|---|---|---|---|---|
| ZFA:0001094 | whole organism | none (root) | Zygote:1-cell (0) | Adult (17520) | AP 0.00 to 1.00; all; midline | custom | #E0E0E0 |
| ZFA:0000092 | axis | ZFA:0001094 whole organism (part_of) | Gastrula:50%-epiboly (5.25) | Segmentation:5-9 somites (14) | AP 0.00 to 1.00; dorsal thickening of the blastoderm from animal pole to margin; midline | custom | #B0BEC5 |
| ZFA:0001114 | head | ZFA:0001094 whole organism (part_of) | Gastrula:Bud (10) | Adult (17520) | AP 0.00 to 0.28; all; midline | ellipsoid | #FFE082 |
| ZFA:0001306 | pharyngeal arch | ZFA:0001114 head (part_of) | Segmentation:10-13 somites (14) | Adult (17520) | AP 0.12 to 0.26; ventral half of the head behind the eye, lateral to the pharynx; paired | segmentArray | #FFAB91 |
| ZFA:0001115 | trunk | ZFA:0001094 whole organism (part_of) | Gastrula:Bud (10) | Adult (17520) | AP 0.28 to 0.62; all; sits on top of the yolk ball and yolk extension; midline | tube | #A5D6A7 |
| ZFA:0001117 | post-vent region | ZFA:0001094 whole organism (part_of) | Segmentation:26+ somites (22) | Adult (17520) | AP 0.62 to 1.00; all; free of the yolk; midline | tube | #90CAF9 |


## 4. Deviations from ZFIN and modelling notes

- Kupffer's vesicle: ZFA starts the term at 1-4 somites (10.33 hpf). The lumen forms at the 2-somite stage and is fully expanded at 8 somites (https://elifesciences.org/articles/30963). The JSON sets `visibleFromHpf` to 11.0.
- Median fin fold: ZFA starts the term at 26+ somites (22 hpf) and ends it at Larval Day 5 (144 hpf). Fin fold development begins at 18 hpf (https://pmc.ncbi.nlm.nih.gov/articles/PMC4482254/) and Kimmel calls the fold easily recognizable at prim-5. The continuous larval fold persists until fin fold resorption, with remnants over the posterior two thirds of the tail by 7.4 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/). The JSON sets `visibleFromHpf` to 24 and `modelEndHpf` to 720.
- Periderm: ZFA ends the term at 26+ somites (24 hpf) and starts epidermis (ZFA:0000105) at prim-5. The model needs one skin shell for the whole timeline. The JSON sets `modelEndHpf` to 168 as a hand-over point; the integument specialist owns the epidermis.
- Polster: ZFA keeps the polster to prim-5 (30 hpf) although its cells form the hatching gland from 14 hpf. The model can hide the polster bump once the hatching gland sheet appears at 14 hpf.
- Yolk: ZFA ends the yolk at Larval Day 5 (144 hpf). Yolk absorption is complete at about 7 dpf (https://pmc.ncbi.nlm.nih.gov/articles/PMC8126416/). The model should shrink the yolk remnant to zero at 144 hpf to match ZFA.
- Somite: ZFA ends the somite at Pec-fin (72 hpf). The myotome (ZFA:0001056) continues the same segment array to the adult. Use one segment array for both and switch the label at 72 hpf.
- Notochord: ZFA keeps the notochord to the adult. In the adult the vertebral centra replace it, and notochord tissue persists only inside the centra and intervertebral spaces. The model should fade the notochord tube as the centra mineralize, from 6 dpf anteriorly at about 1.5 segments per day (https://elifesciences.org/articles/33843).
- Tail bud and hatching gland: ZFA gives no `part_of` parent for either. The JSON attaches both to the whole organism as `grouping`.
- Chorion: ZFA gives the chorion an `is_a` parent (extraembryonic structure) and no `part_of` parent. The JSON keeps the extraembryonic structure as a non-rendered grouping node.
- No ZFA term exists for the pharyngeal region as a region. The JSON uses pharyngeal arch (ZFA:0001306, part of head) as the region node. The skeletal specialist owns the arch cartilages.

## 5. Per-structure notes

### 5.1 Extraembryonic


### ZFA:0000020 extraembryonic structure

Synonyms: extraembryonic structures.  
System: extraembryonic. Parent: none (root).  
ZFIN stages: Zygote:1-cell (0 hpf) to Pharyngula:High-pec (48 hpf).  

Definition: Anatomical structure that is contiguous with the embryo and is comprised of portions of tissue or cells that will not contribute to the embryo.

Landmarks: grouping node for the chorion; not rendered.

Shape: UI grouping node only. Do not render geometry.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1-cell | 0 | diameter 1200 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/ | inner chorion diameter = 2 x (embryo radius 397 um + perivitelline space 210 um) at epiboly |
| Prim-5 | 24 | diameter 1200 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/ | same shell |
| Long-pec | 48 | diameter 1200 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/ | same shell; ZFA end stage |

Events:

- 0 hpf: chorion lifts from the egg after fertilization
- 48 hpf: ZFA end stage (High-pec); hatching occurs 48 to 72 hpf

Sources: https://zfin.org/ZFA:0000020; https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/

### ZFA:0000329 chorion

System: extraembryonic. Parent: ZFA:0000020 extraembryonic structure (is_a).  
ZFIN stages: Zygote:1-cell (0 hpf) to Pharyngula:High-pec (48 hpf).  

Definition: The egg shell.

Landmarks: a sphere centred on the yolk; the perivitelline space separates it from the embryo.

Shape: Transparent thin-walled sphere. Radius = embryo radius + perivitelline space. Render with alpha 0.15 and a thin rim. Remove at hatching (48 to 72 hpf).

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1-cell | 0 | diameter 1200, wallThickness 3 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/ | inner diameter derived from radius 397 um + PVS 210 um; wall 3 um |
| Prim-5 | 24 | diameter 1200, wallThickness 3 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/ | same shell; the embryo curls inside it |
| Long-pec | 48 | diameter 1200, wallThickness 3 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/ | still present in most embryos; hatching 48 to 72 hpf |

Events:

- 0 hpf: chorion swells and lifts away from the newly fertilized egg (Kimmel 1995)
- 48 hpf: hatching period begins; hatching gland enzymes digest the chorion
- 72 hpf: hatching complete in most clutches at 28.5 C

Sources: https://zfin.org/ZFA:0000329; https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/; https://zfin.org/zf_info/zfbook/stages/zygote.html; https://zfin.org/zf_info/zfbook/stages/hatch.html

### ZFA:0000084 yolk

Synonyms: yolk cell.  
System: extraembryonic. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Zygote:1-cell (0 hpf) to Larval:Day 5 (144 hpf).  

Definition: Giant syncytial uncleaved cell containing nutrient store for embryonic development in the form of semicrystalline phospholipoprotein and contained within yolk granules.

Landmarks: heart and pericardium sit on its anterior face; the vent lies at the posterior tip of the yolk extension.

Shape: Stage 0 to 10 hpf: sphere of diameter 0.7 mm with the blastodisc on top. From 14 hpf: lathe profile with a round anterior ball and a tapering posterior extension (see ZFA:0000006 and ZFA:0000106). Shrink volume monotonically to zero by 144 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1-cell | 0 | diameter 700 | https://zfin.org/zf_info/zfbook/stages/zygote.html | zygote is about 0.7 mm in diameter |
| Sphere | 4 | diameter 675 | https://www.nature.com/articles/srep08601 | yolk sphere typical diameter 650 to 700 um |
| Prim-5 | 24 | ballDiameter 550, extensionLength 550, extensionDiameter 180 | estimate | Kimmel: at prim-5 the yolk extension length equals the yolk ball greatest diameter; absolute values are estimates |
| Long-pec | 48 | ballDiameter 450, extensionLength 500, extensionDiameter 130 | estimate | Kimmel: at long-pec the yolk volume approximates the head volume; absolute values are estimates |
| Day 5 | 120 | ballDiameter 250, ballHeight 150, extensionLength 0 | estimate | yolk extension nearly empty by day 4 (Kimmel); remnant ball only |
| Adult | 2160 | diameter 0 | https://zfin.org/zf_info/zfbook/stages/larval.html | absent; yolk fully absorbed by about 7 dpf |

Events:

- 0 hpf: non-yolky cytoplasm streams to the animal pole and separates the blastodisc from the yolk
- 3 hpf: marginal blastomeres collapse into the yolk cell and form the yolk syncytial layer
- 4.33 hpf: dome stage: the yolk cell bulges toward the animal pole as epiboly begins
- 10 hpf: blastoderm covers the yolk plug; 100 percent epiboly
- 16 hpf: a constriction appears in the posterior yolk; yolk ball and yolk extension become distinct
- 22 hpf: yolk extension is nearly the length of the yolk ball
- 42 hpf: yolk extension becomes a cylinder with a conical posterior taper
- 82 hpf: maximum yolk utilization rate at 3.4 dpf
- 96 hpf: yolk extension nearly empties during day 4
- 168 hpf: yolk fully absorbed by about 7 dpf

Sources: https://zfin.org/ZFA:0000084; https://zfin.org/zf_info/zfbook/stages/zygote.html; https://zfin.org/zf_info/zfbook/stages/blast_stgs.html; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html; https://zfin.org/zf_info/zfbook/stages/larval.html; https://www.nature.com/articles/srep08601; https://pmc.ncbi.nlm.nih.gov/articles/PMC8126416/

### ZFA:0000088 yolk syncytial layer

Synonyms: YSL, periblast, yolk sac.  
System: extraembryonic. Parent: ZFA:0000084 yolk (grouping).  
ZFIN stages: Blastula:1k-cell (3 hpf) to Larval:Day 5 (144 hpf).  

Definition: Peripheral layer of the yolk cell including nuclei and non-yolky cytoplasm.

Landmarks: the external YSL is the band just vegetal to the blastoderm margin during epiboly.

Shape: Thin shell offset a few micrometers inside the yolk surface. Render as a slightly darker rim of the yolk. Optional: draw a ring of nuclei just ahead of the blastoderm margin during epiboly.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1k-cell | 3 | ringNuclei 20, thickness 15 | https://zfin.org/zf_info/zfbook/stages/blast_stgs.html | about 20 nuclei within a single ring; thickness is an estimate |
| Prim-5 | 24 | thickness 10 | estimate | thin syncytial shell over the yolk ball and extension |
| Long-pec | 48 | thickness 10 | estimate |  |
| Day 5 | 120 | thickness 8 | estimate | remnant over the shrinking yolk |

Events:

- 2.75 hpf: marginal blastomeres begin to lose their lower borders (512-cell)
- 3 hpf: single ring of about 20 YSL nuclei (1k-cell)
- 3.66 hpf: several rows of YSL nuclei; some nuclei already internal (oblong)
- 4.33 hpf: YSL nuclei begin animal-vegetal movements as epiboly starts
- 144 hpf: ZFA end stage (Larval Day 5)

Sources: https://zfin.org/ZFA:0000088; https://zfin.org/zf_info/zfbook/stages/blast.html; https://zfin.org/zf_info/zfbook/stages/blast_stgs.html; https://www.nature.com/articles/s41598-022-07747-7

### ZFA:0000006 ball

Synonyms: yolk ball.  
System: extraembryonic. Parent: ZFA:0000084 yolk (part_of).  
ZFIN stages: Segmentation:10-13 somites (14 hpf) to Larval:Day 4 (120 hpf).  

Definition: The anterior round region of the yolk cell present after the yolk extension forms during the segmentation period.

Landmarks: heart and pericardium on its anterior-dorsal face; hatching gland on its anterior surface.

Shape: Oblate to spherical ellipsoid. Its posterior pole blends into the extension through a smooth neck (the staging constriction).

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 10-13 somites | 14 | diameter 600 | estimate | first distinct from the extension; near the full egg yolk diameter |
| Prim-5 | 24 | diameter 550 | estimate | Kimmel: extension length equals ball diameter |
| Long-pec | 48 | diameter 450 | estimate | Kimmel: yolk volume about equals head volume |
| Day 4 | 96 | diameter 300, height 200 | estimate | flattened remnant |
| Day 5 | 120 | diameter 250, height 150 | estimate | ZFA end stage; remnant continues as yolk (ZFA:0000084) to 144 hpf |

Events:

- 14 hpf: ZFA start stage (10-13 somites)
- 16 hpf: posterior constriction of the yolk becomes a staging landmark
- 120 hpf: ZFA end stage (Larval Day 4)

Sources: https://zfin.org/ZFA:0000006; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html

### ZFA:0000106 extension

Synonyms: yolk extension.  
System: extraembryonic. Parent: ZFA:0000084 yolk (part_of).  
ZFIN stages: Segmentation:10-13 somites (14 hpf) to Larval:Day 4 (120 hpf).  

Definition: The posterior elongated region of the yolk cell that forms during the segmentation period.

Landmarks: ends at the vent; the ventral fin fold begins behind it.

Shape: Tapered tube along the ventral trunk. Length equals the ball diameter at 24 hpf, exceeds it from 30 hpf, cylindrical with a conical posterior tip at 42 hpf, and collapses to a thin strand by 96 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 10-13 somites | 14 | length 250, diameter 250 | estimate | just after the constriction appears |
| Prim-5 | 24 | length 550, diameter 180 | estimate | length equals ball diameter (Kimmel) |
| Long-pec | 48 | length 500, diameter 130 | estimate |  |
| Day 4 | 96 | length 350, diameter 50 | estimate | nearly empty (Kimmel larval period) |
| Day 5 | 120 | length 0, diameter 0 | estimate | ZFA end stage; empty |

Events:

- 14 hpf: ZFA start stage
- 22 hpf: nearly the length of the yolk ball (26+ somites)
- 30 hpf: longer than the yolk ball (prim-15)
- 36 hpf: markedly exceeds the ball diameter (prim-25)
- 42 hpf: cylindrical with conical posterior taper (high-pec)
- 96 hpf: nearly empties (day 4)
- 120 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000106; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/larval.html


### 5.2 Early embryo


### ZFA:0005772 fertilized egg

Synonyms: zygote.  
System: axial. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Zygote:1-cell (0 hpf) to Zygote:1-cell (0.75 hpf).  

Definition: Diploid cell produced by the fusion of sperm cell nucleus and egg cell.

Landmarks: the whole egg inside the chorion.

Shape: Sphere 0.7 mm; from 10 min after fertilization grow a clear dome (blastodisc) at the animal pole while the yolk stays opaque.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1-cell | 0 | diameter 700 | https://zfin.org/zf_info/zfbook/stages/zygote.html | about 0.7 mm in diameter at fertilization |

Events:

- 0 hpf: fertilization; cytoplasmic streaming visible within about 10 minutes
- 0.67 hpf: first cleavage about 40 minutes after fertilization
- 0.75 hpf: ZFA end stage (1-cell)

Sources: https://zfin.org/ZFA:0005772; https://zfin.org/zf_info/zfbook/stages/zygote.html; https://bionumbers.hms.harvard.edu/bionumber.aspx?id=101661&ver=0

### ZFA:0001175 blastodisc

System: axial. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Zygote:1-cell (0 hpf) to Blastula:Dome (4.66 hpf).  

Definition: Embryonic structure that is the dome of cytoplasm that segregates from the yolk toward the animal pole during and after the one cell-stage, and which undergoes cleavage.

Landmarks: sits on the flat top of the yolk; cleavage furrows cross it.

Shape: Half-ellipsoid cap on the yolk sphere. 1-cell: low dome. 4-cell: ellipsoidal in top view. 128-cell: a high mound, a solid half ball. High to oblong: flattens. Sphere: the whole embryo is spherical with a flat cap-yolk interface. Overlay cleavage furrows as a 2x2, 2x4, 4x4, 4x8 grid at 4, 8, 16 and 32 cells.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1-cell | 0.5 | diameter 500, height 150 | estimate | dome at the animal pole of a 0.7 mm egg |
| 128-cell | 2.25 | diameter 500, height 300 | estimate | a solid half ball perched on the yolk (Kimmel) |
| Sphere | 4 | diameter 650, height 250 | estimate | blastodisc plus yolk form a sphere of about 0.65 to 0.7 mm; cells about 25 um |

Events:

- 0.17 hpf: cytoplasm streams to the animal pole and forms the blastodisc
- 0.75 hpf: first vertical cleavage furrow
- 1 hpf: blastodisc is ellipsoidal; 2x2 blastomere array
- 2.25 hpf: high mound, a solid half ball on the yolk (128-cell)
- 3.33 hpf: flattening begins (high)
- 4 hpf: sphere: flat border between blastodisc and yolk
- 4.66 hpf: becomes the blastoderm at 30 percent epiboly

Sources: https://zfin.org/ZFA:0001175; https://zfin.org/zf_info/zfbook/stages/zygote.html; https://zfin.org/zf_info/zfbook/stages/cleave_stgs.html; https://zfin.org/zf_info/zfbook/stages/blast_stgs.html; https://www.nature.com/articles/srep08601

### ZFA:0000093 blastomere

Synonyms: blastomeres.  
System: axial. Parent: ZFA:0001175 blastodisc (part_of).  
ZFIN stages: Zygote:1-cell (0 hpf) to Blastula:Dome (4.66 hpf).  

Definition: Cell that arises during cleavage and is partially cleaved, and located at the blastodisc margin prior to collectively forming the yolk syncytial layer (YSL) in the midblastula.

Landmarks: 2, 4, 8, 16, 32, 64 cells in regular arrays; tiers appear from 32 cells.

Shape: Array of touching spheres or a subdivided cap. Counts: 2 (0.75 h), 2x2 (1 h), 2x4 (1.25 h), 4x4 (1.5 h), 4x8 in two tiers (1.75 h), 64 in three tiers (2 h), then 5, 7, 9, 11 tiers to 1k-cell. Cell diameter falls from about 250 um to about 25 um by 4 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 2-cell | 0.75 | count 2, cellDiameter 250 | estimate | two equal blastomeres share a 0.5 mm blastodisc |
| 64-cell | 2 | count 64, tiers 3, cellDiameter 90 | estimate |  |
| Sphere | 4 | count 4000, cellDiameter 25 | https://www.nature.com/articles/srep08601 | cells approximated by spheres of 25 um in diameter |

Events:

- 0.75 hpf: 2 equal blastomeres
- 1.5 hpf: the 4 central blastomeres are the first completely cleaved cells
- 2 hpf: first deep cells are buried (64-cell)
- 2.75 hpf: marginal blastomeres fuse with the yolk to seed the YSL
- 4.66 hpf: ZFA end stage (dome)

Sources: https://zfin.org/ZFA:0000093; https://zfin.org/zf_info/zfbook/stages/cleave_stgs.html; https://zfin.org/zf_info/zfbook/stages/blast_stgs.html; https://www.nature.com/articles/srep08601

### ZFA:0001176 blastoderm

System: axial. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Blastula:30%-epiboly (4.66 hpf) to Gastrula:Bud (10.33 hpf).  

Definition: Embryonic structure that is composed of the cellular part of the embryo, excluding the yolk cell, derived from the blastodisc by early morphogenesis; refers particularly to the time when the cell array is sheet-like, between 30%-epiboly and the end of gastrulation.

Landmarks: margin = epiboly front; dorsal thickening = shield then axis.

Shape: Spherical shell segment (cup) over the yolk sphere. Parametrize by epiboly fraction f: 0.30 at 4.66 h, 0.50 at 5.25 h, 0.75 at 8 h, 0.90 at 9 h, 1.00 at 10 h (about 15 percent per hour after 50 percent). Thickness about 3 to 4 cells, uniform until 50 percent, then thicker on the dorsal side.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 30%-epiboly | 4.66 | coverageFraction 0.3, thickness 75 | estimate | inverted cup of uniform thickness; about 3 cells of 25 um |
| Shield | 6 | coverageFraction 0.5, thickness 100 | https://zfin.org/zf_info/zfbook/stages/gast_stgs.html | epiblast about three cells thick plus hypoblast one to two cells thick |
| Bud | 10 | coverageFraction 1.0, thickness 60 | estimate |  |

Events:

- 4.33 hpf: epiboly begins (dome)
- 4.66 hpf: 30 percent epiboly
- 5.25 hpf: 50 percent epiboly; involution starts
- 8 hpf: 75 percent epiboly; evacuation zone on the ventral side
- 9 hpf: 90 percent epiboly; yolk plug
- 10 hpf: 100 percent epiboly; ZFA end stage (bud)

Sources: https://zfin.org/ZFA:0001176; https://zfin.org/zf_info/zfbook/stages/index.html; https://zfin.org/zf_info/zfbook/stages/gast.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0000086 EVL

Synonyms: enveloping layer.  
System: axial. Parent: ZFA:0001176 blastoderm (part_of).  
ZFIN stages: Blastula:30%-epiboly (4.66 hpf) to Gastrula:90%-epiboly (10 hpf).  

Definition: Outermost monolayer of cells surrounding the embryo that become very flattened in the blastula and give rise to the periderm. Sometimes used synonymously with periderm.

Landmarks: its leading edge is the blastoderm margin.

Shape: One-cell-thick outer skin of the blastoderm cup. Render as the outer surface of the blastoderm with a subtle tile pattern.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 30%-epiboly | 4.66 | thickness 8 | estimate | flattened cells (Kimmel: very flattened) |
| 90%-epiboly | 9 | thickness 5 | estimate |  |

Events:

- 2.25 hpf: about five irregular tiers of EVL cells (128-cell)
- 3 hpf: about eleven tiers (1k-cell)
- 4.66 hpf: ZFA start stage; cells flattened
- 10 hpf: ZFA end stage; becomes the periderm

Sources: https://zfin.org/ZFA:0000086; https://zfin.org/zf_info/zfbook/stages/blast.html; https://zfin.org/zf_info/zfbook/stages/blast_stgs.html; https://www.ncbi.nlm.nih.gov/books/NBK10100/

### ZFA:0000711 DEL

Synonyms: deep cell layer, DEL cells.  
System: axial. Parent: ZFA:0001176 blastoderm (part_of).  
ZFIN stages: Blastula:30%-epiboly (4.66 hpf) to Gastrula:Bud (10.33 hpf).  

Definition: A multilayer of deep cells of fairly uniform thickness that forms during early epiboly (at dome stage; upon conversion of the blastodisc to the blastoderm); during gastrulation the DEL (deep cell layer) gives rise to the epiblast and hypoblast.

Landmarks: the bulk of the blastoderm cup.

Shape: Inner volume of the blastoderm shell. Same geometry as the blastoderm minus the EVL skin.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 30%-epiboly | 4.66 | thickness 65 | estimate | about three cells of 25 um |
| Shield | 6 | thickness 90 | https://zfin.org/zf_info/zfbook/stages/gast_stgs.html | epiblast about three cells plus hypoblast one to two cells |

Events:

- 4.33 hpf: forms at dome stage by radial intercalation
- 5.66 hpf: splits into epiblast and hypoblast at the germ ring
- 10.33 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000711; https://zfin.org/zf_info/zfbook/stages/blast.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0000038 margin

System: axial. Parent: ZFA:0001176 blastoderm (grouping).  
ZFIN stages: Blastula:30%-epiboly (4.66 hpf) to Gastrula:Bud (10.33 hpf).  

Definition: Embryonic structure, the edge of the blastoderm.

Landmarks: the epiboly front; the germ ring thickens it from 5.66 hpf.

Shape: Torus (ring) at the blastoderm edge. Latitude angle theta = 180 deg x epiboly fraction measured from the animal pole. Ring radius = yolk radius x sin(theta).

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 30%-epiboly | 4.66 | ringDiameter 560, tubeDiameter 40 | estimate | ring at 54 deg latitude on a 0.65 mm sphere |
| Shield | 6 | ringDiameter 650, tubeDiameter 60 | estimate | equatorial ring at 50 percent epiboly |

Events:

- 4.66 hpf: ZFA start stage
- 5.66 hpf: thickens into the germ ring
- 9 hpf: encircles the yolk plug
- 10 hpf: closes at the vegetal pole; ZFA end stage (bud)

Sources: https://zfin.org/ZFA:0000038; https://zfin.org/zf_info/zfbook/stages/index.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0000111 germ ring

System: axial. Parent: ZFA:0001176 blastoderm (grouping).  
ZFIN stages: Gastrula:Germ-ring (5.66 hpf) to Gastrula:Bud (10.33 hpf).  

Definition: Embryonic structure that forms as a thickened annulus at the blastoderm rim.  The germ ring is thickened because it  is the involuting margin of the blastoderm.

Landmarks: visible from the animal pole as a ring.

Shape: Thickened torus at the margin. Tube diameter about 2x the blastoderm thickness. Add a local bulge over 30 deg of longitude on the dorsal side for the shield.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Germ-ring | 5.66 | ringDiameter 650, tubeDiameter 100 | estimate | equatorial; thickness of epiblast (3 cells) plus hypoblast (1 to 2 cells) |
| 75%-epiboly | 8 | ringDiameter 460, tubeDiameter 80 | estimate |  |

Events:

- 5.66 hpf: forms nearly simultaneously all around the blastoderm rim
- 6 hpf: shield appears within it
- 10.33 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000111; https://zfin.org/zf_info/zfbook/stages/gast.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0000071 shield

Synonyms: organizer, dorsal organizer, Spemann Mangold organizer, Spemann's organizer.  
System: axial. Parent: ZFA:0000111 germ ring (part_of).  
ZFIN stages: Gastrula:Shield (6 hpf) to Gastrula:Shield (8 hpf).  

Definition: Embryonic structure that is a local accumulation of cells along the germ ring.  The shield marks the dorsal side of the embryo.

Landmarks: defines the dorsal side; future head lies toward the animal pole from it.

Shape: Local thickening of the germ ring spanning about 30 deg of longitude. Model as an ellipsoid bump merged into the torus, longer along the ring than across it.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Shield | 6 | arcDeg 30, length 170, width 100, thickness 120, cells 100 | https://zfin.org/zf_info/zfbook/stages/gast.html | about 30 degrees of longitude of the germ ring; about 100 cells (Gilbert); linear sizes are estimates for a 0.65 mm sphere |

Events:

- 6 hpf: visible from the animal pole within minutes of 50 percent epiboly
- 8 hpf: becomes less distinctive; ZFA end stage

Sources: https://zfin.org/ZFA:0000071; https://zfin.org/zf_info/zfbook/stages/gast.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html; https://www.ncbi.nlm.nih.gov/books/NBK10100/

### ZFA:0000018 epiblast

System: axial. Parent: ZFA:0000111 germ ring (part_of).  
ZFIN stages: Gastrula:Germ-ring (5.66 hpf) to Gastrula:Bud (10.33 hpf).  

Definition: The outer of the two layers of the blastoderm that form during gastrulation, corresponding to primitive ectoderm during gastrulation and to the definitive ectoderm after gastrulation.

Landmarks: about three cells thick at the germ ring stage.

Shape: Outer shell of the two-layer blastoderm. Thickness about three cells.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Germ-ring | 5.66 | thickness 75 | https://zfin.org/zf_info/zfbook/stages/gast_stgs.html | about three cells thick; 25 um cells |
| 90%-epiboly | 9 | thickness 60 | estimate |  |

Events:

- 5.66 hpf: forms as the outer layer at the germ ring
- 9 hpf: thickens dorsally as the neural plate
- 10.33 hpf: ZFA end stage; becomes ectoderm

Sources: https://zfin.org/ZFA:0000018; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0000117 hypoblast

Synonyms: mesendoderm.  
System: axial. Parent: ZFA:0000111 germ ring (part_of).  
ZFIN stages: Gastrula:Germ-ring (5.66 hpf) to Gastrula:Bud (10.33 hpf).  

Definition: The inner of the two layers of the blastoderm that forms during gastrulation and give rise to the definitive mesoderm and endoderm.

Landmarks: its anterior axial part reaches the animal pole at 75 percent epiboly.

Shape: Inner shell of the blastoderm, one to two cells thick, that extends from the margin toward the animal pole. Its front advances from the margin animalward as epiboly proceeds.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Germ-ring | 5.66 | thickness 35 | https://zfin.org/zf_info/zfbook/stages/gast_stgs.html | one to two cells thick |
| 75%-epiboly | 8 | thickness 20 | https://www.nature.com/articles/srep08601 | about 20 um at 7 hpf |

Events:

- 5.66 hpf: forms by involution at the germ ring
- 8 hpf: anterior axial hypoblast reaches the animal pole
- 10.33 hpf: ZFA end stage; mesoderm and endoderm

Sources: https://zfin.org/ZFA:0000117; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html; https://www.nature.com/articles/srep08601

### ZFA:0000077 tail bud

Synonyms: tailbud, tail bud mesenchyme.  
System: axial. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Gastrula:Bud (10 hpf) to Pharyngula:Prim-5 (30 hpf).  

Definition: Undifferentiated mesenchymal swelling at the posterior end of the embryonic axis that forms at the end of epiboly and generates the tail (no ZFA definition; wording from Kimmel 1995).

Landmarks: Kupffer's vesicle at its base; forms first at the vegetal pole where the margin closes.

Shape: Rounded knob capping the posterior axis. Attach to the yolk surface until 16 hpf, then move it off the yolk as the tail grows; keep it at the tail tip until 30 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Bud | 10 | length 120, diameter 120 | estimate | distinct swelling |
| 14-19 somites | 16 | length 150, diameter 120 | estimate | protrudes away from the body |
| Prim-5 | 24 | length 100, diameter 80 | estimate | degenerating cells at its position by 30 hpf |

Events:

- 10 hpf: distinct swelling at the caudal end of the axis (bud stage)
- 11.66 hpf: Kupffer's vesicle appears deep to the tail bud
- 16 hpf: tail bud begins to protrude away from the body and yolk
- 22 hpf: elongating tail still curves ventrally
- 30 hpf: tail morphogenesis nears completion; degenerating cells at the tail bud; ZFA end stage

Sources: https://zfin.org/ZFA:0000077; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html

### ZFA:0000001 Kupffer's vesicle

Synonyms: ciliated organ of asymmetry, KV.  
System: axial. Parent: ZFA:0000077 tail bud (part_of).  
ZFIN stages: Segmentation:1-4 somites (10.33 hpf) to Pharyngula:Prim-5 (30 hpf).  
Visible in the model from 11 hpf: lumen forms at the 2-somite stage (eLife 30963); Kimmel lists its appearance under 5-9 somites.  

Definition: Small but distinctive epithelial sac containing fluid, located midventrally posterior to the yolk cell or its extension, and transiently present during most of the segmentation period. Kupffer's vesicle has been compared to the mouse embryonic node.

Landmarks: at the base of the tail bud.

Shape: Small sphere becoming an ellipsoid by 9 somites. Grow lumen from 2 somites to a maximum at 8 to 10 somites, then shrink to zero by 30 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1-4 somites | 11 | diameter 20 | estimate | lumen first forms at 2 somites; about 50 epithelial cells |
| 10-13 somites | 14 | diameter 65, cells 50, cilia 57, ciliumLength 6 | https://anatomypubs.onlinelibrary.wiley.com/doi/full/10.1002/dvdy.24355 | maximum lumen area 2250 to 4517 um2 at 10 somites (equivalent diameter 54 to 76 um; values quoted from a search snippet of Gokey 2016); cilia from Navis 2013 |
| Prim-5 | 24 | diameter 20 | estimate | collapsing |

Events:

- 5.25 hpf: dorsal forerunner cells gather at the shield margin
- 10.33 hpf: ZFA start stage; forerunner cells organize into a rosette
- 11 hpf: lumen forms at the 2-somite stage
- 13 hpf: lumen fully expanded at 8 somites
- 13.5 hpf: ellipsoidal shape at 9 somites; cilia beat about 30 Hz
- 16 hpf: prominent at the base of the protruding tail bud
- 30 hpf: ZFA end stage (prim-5)

Sources: https://zfin.org/ZFA:0000001; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://elifesciences.org/articles/30963; https://pmc.ncbi.nlm.nih.gov/articles/PMC3621488/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2829604/; https://anatomypubs.onlinelibrary.wiley.com/doi/full/10.1002/dvdy.24355

### ZFA:0000058 polster

Synonyms: pillow.  
System: axial. Parent: ZFA:0000060 prechordal plate (part_of).  
ZFIN stages: Gastrula:Bud (10 hpf) to Pharyngula:Prim-5 (30 hpf).  

Definition: The hatching gland rudiment at the time it underlies the forebrain during the early segmentation period.

Landmarks: most anterior bulge of the axis at bud stage.

Shape: Anterior bulge under the forebrain on the yolk surface. Present as a distinct bump from 10 to 14 hpf; then flatten and move to the pericardium as the hatching gland.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Bud | 10 | length 120, width 100, height 50 | estimate | prominent bulge |
| 5-9 somites | 11.66 | length 150, width 120, height 50 | estimate | prominent polster deep to the neural plate (Kimmel wording) |
| Prim-5 | 24 | length 150, width 120, height 20 | estimate | ZFA keeps the term to 30 hpf; by then the cells form the hatching gland sheet |

Events:

- 8 hpf: anterior axial hypoblast reaches the animal pole
- 10 hpf: prominent bulge (bud stage)
- 11.66 hpf: prominent under the forebrain (5-9 somites)
- 14 hpf: becomes the hatching gland on the pericardium
- 30 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000058; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html

### ZFA:0000026 hatching gland

Synonyms: hgg.  
System: axial. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Segmentation:10-13 somites (14 hpf) to Hatching:Pec-fin (72 hpf).  

Definition: A transversely oriented set of cells located deep to the EVL on the pericardial membrane, especially prominent during pharyngula period because of the brightly refractile cytoplasmic granules (containing hatching enzymes) of the principal cells of the gland.

Landmarks: between the eyes and the yolk, anterior to the heart.

Shape: Transverse crescent-shaped sheet of about 250 granular cells draped over the anterior yolk ball under the head. Bright refractile look. Fade after hatching (72 hpf).

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 14-19 somites | 18 | cells 271, width 150, length 100, thickness 15 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8820232/ | 271 +/- 42 cells at 18 hpf; linear sizes are estimates |
| Prim-5 | 24 | cells 250, width 200, length 120, thickness 15 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8820232/ | continuous sheet by 24 hpf; cell count stable 232 to 271; sizes estimates |
| Long-pec | 48 | cells 254, width 220, length 130, thickness 15 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8820232/ | 241 to 267 cells at 48 hpf; sizes estimates |

Events:

- 10 hpf: polster cells lie below the basal keratinocytes
- 14 hpf: ZFA start stage; cells relocate above the basal layer
- 24 hpf: continuous sheet on the pericardium; ctslb and he1 expression
- 48 hpf: secretion of hatching enzyme; hatching period
- 72 hpf: ZFA end stage; cells degenerate after hatching (TUNEL positive by 78 hpf)

Sources: https://zfin.org/ZFA:0000026; https://pmc.ncbi.nlm.nih.gov/articles/PMC8820232/; https://zfin.org/zf_info/zfbook/stages/seg.html

### ZFA:0001185 periderm

Synonyms: EVL.  
System: integument_pigment. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Gastrula:Bud (10 hpf) to Segmentation:26+ somites (24 hpf).  
Model end 168 hpf: a peridermal layer persists on the larva for days; the model can keep one skin shell for the whole timeline.  

Definition: The outermost epidermal layer covering the fish at embryonic stages; derived from the EVL and thought to eventually be replaced by the superficial stratum of the epidermis. Sometimes used synonymously with EVL.

Landmarks: the rendered body surface.

Shape: Outer surface of the body and yolk. Render as the body skin; one cell thick. Continue as epidermis (ZFA:0000105) after 24 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Bud | 10 | thickness 5 | estimate |  |
| Prim-5 | 24 | thickness 5 | estimate | ZFA end stage; epidermis term starts |

Events:

- 10 hpf: EVL becomes periderm at the end of epiboly
- 24 hpf: ZFA end stage; epidermis (ZFA:0000105) begins

Sources: https://zfin.org/ZFA:0001185; https://zfin.org/ZFA:0000105


### 5.3 Axial


### ZFA:0000091 axial chorda mesoderm

Synonyms: chordamesoderm, chorda mesoderm, presumptive notochord.  
System: axial. Parent: ZFA:0000092 axis (grouping).  
ZFIN stages: Gastrula:75%-epiboly (8 hpf) to Gastrula:Bud (10.33 hpf).  

Definition: Notochord rudiment.

Landmarks: posterior to the prechordal plate; extends to the tail bud.

Shape: Thin rod along the dorsal meridian of the gastrula from the prechordal plate to the margin. Becomes the notochord at bud stage.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 75%-epiboly | 8 | length 800, diameter 50 | estimate |  |
| Bud | 10 | length 1500, diameter 45 | estimate |  |

Events:

- 8 hpf: ZFA start stage; visible in the dorsal hypoblast
- 9 hpf: notochord rudiment distinct at 90 percent epiboly
- 10.33 hpf: ZFA end stage; notochord

Sources: https://zfin.org/ZFA:0000091; https://zfin.org/zf_info/zfbook/stages/index.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0000060 prechordal plate

System: axial. Parent: ZFA:0000092 axis (grouping).  
ZFIN stages: Gastrula:75%-epiboly (8 hpf) to Pharyngula:Prim-5 (30 hpf).  

Definition: Axial hypoblast located anterior to the chorda mesoderm; the polster is its most anterior region.

Landmarks: anterior to the notochord; polster at its tip.

Shape: Flattened ellipsoid ahead of the notochord under the forebrain. Merge with the polster bump.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 75%-epiboly | 8 | length 200, width 120, thickness 40 | estimate |  |
| Prim-5 | 24 | length 150, width 100, thickness 30 | estimate | ZFA end stage at 30 hpf |

Events:

- 8 hpf: reaches the animal pole
- 10 hpf: polster bulge at its anterior end
- 30 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000060; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0000135 notochord

Synonyms: notocord.  
System: axial. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Gastrula:Bud (10 hpf) to Adult (17520 hpf).  

Definition: Rod-like principal supportive element of the embryo and larva, present in the midline just ventral to the neural tube, and differentiating during the segmentation period to form large vacuolated epithelial cells and a surrounding sheath of fibrous and elastic layers.

Landmarks: from the posterior midbrain level to the tail tip; the tip bends dorsally (flexion) from 4.5 mm SL.

Shape: Circular tube along a spline that follows the body axis. Uniform diameter along the trunk, tapering over the last 10 percent. Optional stack-of-pennies segmentation from 16 hpf and vacuolated cells from 24 hpf. From 4.5 mm SL bend the posterior 8 percent dorsally to 45 deg. From 6 dpf overlay chordacentra rings at about 1.5 segments per day.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Bud | 10 | length 1500, diameter 45 | estimate | rod along the dorsal meridian |
| Prim-5 | 24 | length 1700, diameter 40 | estimate | trunk diameter estimate; body EL 1.9 mm |
| Long-pec | 48 | length 2800, diameter 55 | estimate | vacuolated; notochord to cell diameter ratio 1.33 (Norman 2018) |
| Day 5 | 120 | length 3500, diameter 65 | estimate |  |
| Adult | 2160 | length 14000, diameter 0 | estimate | replaced by 29 to 33 vertebral centra; notochord tissue persists only inside the centra and intervertebral spaces |

Events:

- 8 hpf: chordamesoderm visible
- 10 hpf: ZFA start stage (bud)
- 16 hpf: stack-of-pennies appearance (14-19 somites)
- 24 hpf: vacuolated cells inflate during the pharyngula period
- 48 hpf: vacuolated cell packing set; aspect ratio 1.07
- 96 hpf: sheath segmentation begins at about 4 dpf, 3.5 to 4.0 mm SL, one segment every 8 h
- 144 hpf: first chordacentrum mineralizes anteriorly at 6 dpf; then about 1.5 segments per day
- 336 hpf: notochord flexion 4.5 to 6.5 mm SL, final angle about 45 deg
- 672 hpf: 29 to 31 sheath segments at 28 dpf

Sources: https://zfin.org/ZFA:0000135; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC6158209/; https://elifesciences.org/articles/33843; https://pmc.ncbi.nlm.nih.gov/articles/PMC5860813/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

### ZFA:0000255 paraxial mesoderm

Synonyms: paraxial mesenchyme.  
System: axial. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Gastrula:Bud (10 hpf) to Hatching:Pec-fin (72 hpf).  

Definition: Mesoderm which is lateral to the neural tube on both sides.

Landmarks: grouping node for segmental plate and somites.

Shape: Grouping node. Geometry is carried by the segmental plate and the somites.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 1500, width 100 | estimate | sum of somites plus the segmental plate on each side |
| Long-pec | 48 | length 2600, width 120 | estimate | ZFA end stage at 72 hpf |

Events:

- 10 hpf: ZFA start stage
- 72 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000255

### ZFA:0000279 segmental plate

Synonyms: presomitic mesoderm, PSM.  
System: axial. Parent: ZFA:0000255 paraxial mesoderm (part_of).  
ZFIN stages: Gastrula:Bud (10 hpf) to Pharyngula:Prim-5 (30 hpf).  

Definition: Unsegmented field of paraxial mesoderm present posterior to the most recently formed somite pair, from which somites will form.

Landmarks: between the last somite and the tail bud; shrinks as somites are added.

Shape: Paired tapered tubes from the last somite boundary to the tail bud. Length shrinks from about 350 um at 12 hpf to zero at about 24 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 5-9 somites | 12 | length 350, width 60, height 80 | estimate |  |
| 14-19 somites | 17 | length 250, width 50, height 70 | estimate |  |
| Prim-5 | 24 | length 80, width 40, height 50 | estimate | last somites form about 24 hpf; ZFA end stage 30 hpf |

Events:

- 10 hpf: ZFA start stage
- 10.33 hpf: first somite pinches off its anterior end
- 24 hpf: about 30 somites formed; plate nearly consumed
- 30 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000279; https://zfin.org/zf_info/zfbook/stages/seg.html; https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.21458

### ZFA:0000155 somite

Synonyms: somitic mesoderm.  
System: axial. Parent: ZFA:0001115 trunk (part_of).  
ZFIN stages: Segmentation:1-4 somites (10.33 hpf) to Hatching:Pec-fin (72 hpf).  

Definition: Undifferentiated mesodermal components of early trunk or tail segments or metameres, derived from paraxial mesoderm; forms myotomes, sclerotomes and perhaps dermatomes.

Landmarks: somite 1 just behind the otic placode; the vent lies at about somite 17.

Shape: Paired array of blocks along the axis. Count n(t): 3 per hour for the first six, then 2 per hour; 18 at 18 hpf, about 30 by 24 hpf, 13 of them in the tail. Block length about 50 um for somites 6 to 14, falling to about 30 um by somite 25; height about twice the length. Shape: cuboid at formation; the boundary deforms into a chevron (V pointing anteriorly) over 2 h starting several hours after formation; segments 1 and 2 stay straight; segments 8 to 15 reach 40 deg.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 5-9 somites | 12 | count 7, length 50, height 100, width 50 | https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.21458 | length about 50 um for somites 6 to 14 (Schroeter 2008, quoted via snippet); height about 2x length (Rost 2014) |
| Prim-5 | 24 | count 30, length 50, lengthTail 30, height 100, width 50 | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html | about 30 somites, 13 in the tail; tail somites about 30 um long by somite 25 |
| Long-pec | 48 | count 31, length 60, height 140, width 60, chevronDeg 40 | https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/ | segments 8 to 15 acquire 40 +/- 3 deg; sizes are estimates for a 3.1 mm embryo |

Events:

- 10.33 hpf: first somitic furrow (1-4 somites)
- 12 hpf: first 5 to 6 somites at about 3 per hour
- 16 hpf: about 2 per hour thereafter; older somites develop myotomes
- 18 hpf: 18 somites
- 19 hpf: trunk myotomes produce weak contractions
- 22 hpf: 26+ somites
- 24 hpf: about 30 somites, 13 in the tail
- 72 hpf: ZFA end stage; myotomes and sclerotomes

Sources: https://zfin.org/ZFA:0000155; https://zfin.org/zf_info/zfbook/stages/seg.html; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.21458; https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/

### ZFA:0001056 myotome

Synonyms: myomeres.  
System: muscular. Parent: ZFA:0000473 (other document) (part_of).  
ZFIN stages: Segmentation:1-4 somites (10.33 hpf) to Adult (17520 hpf).  

Definition: Muscle that develops from somite and gives rise to body wall muscle masses.

Landmarks: chevron with the V pointing anteriorly; adult has about 30 to 32 myomeres.

Shape: Same segment array as the somites, continued for the whole life. Each block is a chevron (anterior-pointing V) whose arms grow into W shapes in juveniles and adults. Height equals the body height at each axial position.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | count 30, length 50, height 100 | https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.21458 | same as somites |
| Long-pec | 48 | count 31, length 60, height 150, chevronDeg 40 | https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/ | sizes estimates |
| Day 5 | 120 | count 31, length 90, height 250 | estimate | 3.9 mm larva |
| Adult | 2160 | count 31, length 550, height 4000 | estimate | about 31 myomeres over an 18 mm SL body; count from vertebral number 29 to 33 |

Events:

- 10.33 hpf: ZFA start stage
- 16 hpf: older somites begin to develop myotomes
- 19 hpf: weak muscular contractions
- 22 hpf: chevron formation under way; muscle pioneers at the apex
- 26 hpf: chevron of segment 15 complete (about 2 h after onset)
- 2160 hpf: adult myomeres with W-shaped folds

Sources: https://zfin.org/ZFA:0001056; https://zfin.org/zf_info/zfbook/stages/seg.html; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/; https://elifesciences.org/articles/33843

### ZFA:0001089 myoseptum

Synonyms: myosepta, myocommata.  
System: muscular. Parent: ZFA:0001056 myotome (part_of).  
ZFIN stages: Segmentation:1-4 somites (10.33 hpf) to Adult (17520 hpf).  

Definition: Connective tissue partitions between (vertical) and within (horizontal) myotomes (no ZFA definition; wording from the vertical and horizontal myoseptum definitions).

Landmarks: the visible chevron lines on the flank.

Shape: Thin chevron-shaped sheets at each segment boundary. Render as lines on the flank; angle from 0 deg (straight) at formation to 40 deg in segments 8 to 15.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | count 29, thickness 5, chevronDeg 30 | estimate | boundaries between 30 somites; anterior chevrons complete, posterior forming |
| Long-pec | 48 | count 30, thickness 5, chevronDeg 40 | https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/ |  |
| Day 5 | 120 | count 30, thickness 8, chevronDeg 40 | estimate |  |
| Adult | 2160 | count 30, thickness 50, chevronDeg 45 | estimate |  |

Events:

- 10.33 hpf: first boundary
- 13.5 hpf: segments 4 to 7 deform simultaneously into chevrons
- 24 hpf: posterior segments deform sequentially, 2 h each

Sources: https://zfin.org/ZFA:0001089; https://zfin.org/ZFA:0000610; https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/

### ZFA:0000671 horizontal myoseptum

Synonyms: horizontal septum.  
System: muscular. Parent: ZFA:0001089 myoseptum (is_a).  
ZFIN stages: Segmentation:26+ somites (22 hpf) to Adult (17520 hpf).  

Definition: A connective tissue partition developing at the apex of the chevron-shaped myotome and separating dorsal (epaxial) and ventral (hypaxial) body wall muscle masses.

Landmarks: the lateral line runs along it; muscle pioneers mark it at the notochord.

Shape: Horizontal sheet from the notochord to the skin along the whole trunk and tail at the chevron apex.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 1400, width 50 | estimate | ZFA start 22 hpf |
| Long-pec | 48 | length 2400, width 60 | estimate |  |
| Day 5 | 120 | length 3100, width 80 | estimate |  |
| Adult | 2160 | length 15000, width 2000 | estimate |  |

Events:

- 22 hpf: ZFA start stage (26+ somites)
- 24 hpf: defined by chevron apices in the trunk

Sources: https://zfin.org/ZFA:0000671; https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/

### ZFA:0000022 floor plate

Synonyms: floorplate, fp.  
System: nervous. Parent: ZFA:0000012 (other document) (part_of).  
ZFIN stages: Segmentation:5-9 somites (11.66 hpf) to Adult (17520 hpf).  

Definition: Multi-tissue structure that is the ventral-most aspect of the developing neural tube.  The floor plate is a specialized glial structure with secretory function that spans the rostral-caudal axis from the midbrain to the tail regions.

Landmarks: a single row of cuboidal cells on top of the notochord.

Shape: Thin strip (one cell wide) along the top of the notochord from midbrain to tail. Render as a narrow ribbon; only visible in section or with the neural tube hidden.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 1600, width 10, height 10 | estimate | single row of cells |
| Long-pec | 48 | length 2700, width 10, height 10 | estimate |  |
| Day 5 | 120 | length 3400, width 10, height 10 | estimate |  |
| Adult | 2160 | length 15000, width 15, height 15 | estimate | persists as the ventral midline of the spinal cord |

Events:

- 8 hpf: presumptive floor plate in the dorsal midline
- 11.66 hpf: ZFA start stage (5-9 somites)
- 16 hpf: distinct along the neural rod

Sources: https://zfin.org/ZFA:0000022

### ZFA:0000031 hypochord

System: axial. Parent: ZFA:0000017 (other document) (part_of).  
ZFIN stages: Segmentation:10-13 somites (14 hpf) to Larval:Protruding-mouth (96 hpf).  

Definition: Portion of tissue that arises from the lateral edges of the shield and is located immediately ventral to the notochord. The hypochord is thought to play a role in positioning the dorsal aorta.

Landmarks: a single row of cells under the notochord in trunk and tail.

Shape: Thin strip (one cell wide) under the notochord from the anterior trunk to the tail. Visible only in section.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 1300, width 8, height 8 | estimate |  |
| Long-pec | 48 | length 2300, width 8, height 8 | estimate |  |
| Protruding-mouth | 72 | length 2600, width 8, height 8 | estimate | ZFA end stage 96 hpf |

Events:

- 8 hpf: presumptive hypochord
- 14 hpf: ZFA start stage (10-13 somites)
- 96 hpf: ZFA end stage

Sources: https://zfin.org/ZFA:0000031


### 5.4 Median fin fold


### ZFA:0000040 median fin fold

Synonyms: median fin.  
System: fins. Parent: ZFA:0001094 whole organism (grouping).  
ZFIN stages: Segmentation:26+ somites (22 hpf) to Larval:Day 5 (144 hpf).  
Visible in the model from 24 hpf: Kimmel: easily recognizable at prim-5; begins at 18 hpf (PMC4482254).  
Model end 720 hpf: the larval fin fold persists as a continuous keel until about 7.4 mm SL (about 3 to 4 weeks); ZFA ends the term at day 5.  

Definition: Surface structure that will develop into one of the median fins.  Extends from dorsal surface of fish, caudal to the 8th somite, to the ventral surface ending at the caudal side of the vent.

Landmarks: continuous transparent keel; tallest around the tail tip.

Shape: Thin transparent sheet extruded from the dorsal and ventral midline curves. Height profile: zero at somite 8 and at the vent, rising to a maximum around the notochord tip. Add actinotrichia lines from 36 hpf. Keep until about 7.4 mm SL, then resorb between fins, leaving dorsal, anal and caudal fins.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 1100, heightMax 60, thickness 10 | estimate | easily recognizable at prim-5 (Kimmel); sizes estimates |
| Long-pec | 48 | length 1900, heightDorsal 120, heightVentral 150, heightCaudal 200, thickness 10 | estimate | thin and flat by 48 hpf (PMC4482254); sizes estimates |
| Day 5 | 120 | length 2400, heightDorsal 150, heightCaudal 250, thickness 12 | estimate | sizes estimates |
| Days 14-20 | 336 | length 3500, heightDorsal 200, heightCaudal 400 | https://pmc.ncbi.nlm.nih.gov/articles/PMC9079066/ | height at the dorsal fin position rises from 5.0 mm SL; inter-fin height constant to 5.5 mm SL then falls; absolute values estimates |

Events:

- 18 hpf: fin fold development begins at 18 hpf
- 22 hpf: ZFA start stage (26+ somites)
- 24 hpf: easily recognizable; actinodin expression starts
- 36 hpf: actinotrichia develop (prim-25)
- 48 hpf: fin mesenchyme has finished invading; fold thin and flat
- 144 hpf: ZFA end stage (Larval Day 5)
- 336 hpf: dorsal fin fold outgrowth from about 5.0 to 5.6 mm SL
- 504 hpf: resorption between fins; remnants over the posterior two thirds of the tail by 7.4 mm SL

Sources: https://zfin.org/ZFA:0000040; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC4482254/; https://pmc.ncbi.nlm.nih.gov/articles/PMC5805328/; https://pmc.ncbi.nlm.nih.gov/articles/PMC9079066/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

### ZFA:0000102 dorsal fin fold

System: fins. Parent: ZFA:0000040 median fin fold (part_of).  
ZFIN stages: Segmentation:26+ somites (22 hpf) to Larval:Day 5 (144 hpf).  

Definition: Region of the median fin fold that develops into the dorsal fin.

Landmarks: dorsal fin condenses within it at 5.5 to 5.8 mm SL.

Shape: Dorsal half of the median fin fold sheet.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 900, heightMax 50 | estimate |  |
| Long-pec | 48 | length 1600, heightMax 120 | estimate |  |
| Day 5 | 120 | length 2100, heightMax 150 | estimate |  |

Events:

- 22 hpf: ZFA start stage
- 144 hpf: ZFA end stage
- 400 hpf: dorsal fin condensation at 5.5 to 5.8 mm SL

Sources: https://zfin.org/ZFA:0000102; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://pmc.ncbi.nlm.nih.gov/articles/PMC9079066/

### ZFA:0001069 ventral fin fold

Synonyms: ventral fin, anal fin fold, tail fin fold.  
System: fins. Parent: ZFA:0000040 median fin fold (part_of).  
ZFIN stages: Segmentation:26+ somites (22 hpf) to Larval:Day 5 (144 hpf).  

Definition: Region of the median fin fold that develops into the anal and caudal fin.

Landmarks: starts just behind the vent at the end of the yolk extension.

Shape: Ventral and caudal part of the median fin fold sheet. Tallest around the tail tip.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 700, heightMax 60 | estimate |  |
| Long-pec | 48 | length 1300, heightMax 200 | estimate |  |
| Day 5 | 120 | length 1700, heightMax 250 | estimate |  |

Events:

- 22 hpf: ZFA start stage
- 144 hpf: ZFA end stage
- 320 hpf: caudal fin rays appear at 4.9 to 5.1 mm SL; anal fin condensation at 5.2 to 5.5 mm SL

Sources: https://zfin.org/ZFA:0001069; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/


### 5.5 Body regions


### ZFA:0001094 whole organism

Synonyms: multi-cellular organism.  
System: axial. Parent: none (root).  
ZFIN stages: Zygote:1-cell (0 hpf) to Adult (17520 hpf).  

Definition: Anatomical structure that is an individual member of Danio rerio.

Landmarks: root of the hierarchy; the body outline.

Shape: Parent shape. 0 to 4.66 hpf: sphere (yolk) with a cap (blastodisc). 4.66 to 10 hpf: sphere with a cup (blastoderm) advancing over it. 10 to 24 hpf: axis wraps around the yolk; tail lifts off at 16 hpf. 24 to 72 hpf: head-trunk angle falls from 120 to about 25 deg; tail straightens. 72 hpf onward: straight larva with yolk shrinking. Adult: fusiform body, SL 18 to 30 mm.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 1-cell | 0 | diameter 700 | https://zfin.org/zf_info/zfbook/stages/zygote.html |  |
| 5-9 somites | 11.66 | length 800 | https://zfin.org/zf_info/zfbook/stages/seg_stgs.html | EL about 0.8 mm, the same as the zygote |
| 14-19 somites | 16 | length 900 | https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |  |
| 20-25 somites | 19 | length 1400 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| 26+ somites | 22 | length 1600 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Prim-5 | 24 | length 1900, headTrunkAngleDeg 120 | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |  |
| Prim-15 | 30 | length 2500, headTrunkAngleDeg 95 | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |  |
| Prim-25 | 36 | length 2700, headTrunkAngleDeg 75 | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |  |
| High-pec | 42 | length 2900, headTrunkAngleDeg 55 | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |  |
| Long-pec | 48 | length 3100, headTrunkAngleDeg 45 | https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html |  |
| Pec-fin | 60 | length 3300, headTrunkAngleDeg 35 | https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html | HTA 35 deg is unverified; the fetched ZFIN text returned 55, which conflicts with monotonic straightening |
| Protruding-mouth | 72 | length 3500, headTrunkAngleDeg 25 | https://zfin.org/zf_info/zfbook/stages/index.html | HTA 25 deg unverified |
| Day 4 | 96 | length 3700 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Day 5 | 120 | length 3900 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Day 6 | 144 | length 4200 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Days 7-13 | 168 | length 4500 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Days 14-20 | 336 | length 6200 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Days 21-29 | 504 | length 7800 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Days 30-44 | 720 | length 10000 | https://zfin.org/zf_info/zfbook/stages/index.html |  |
| Days 45-89 | 1080 | length 14000, standardLength 12000 | https://zfin.org/zf_info/zfbook/stages/index.html | 14 mm total length (Kimmel); juveniles about 12 mm SL at 45 dpf (Singleman 2014) |
| Adult | 2160 | standardLength 18000 | https://europepmc.org/api/getPdf?pmcid=PMC4108942 | adults about 18 mm SL at 90 dpf; median about 28 mm SL at 180 dpf |
| Adult reference | 2160 | standardLength 17900 | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ | reference adults 17.5 +/- 0.6 mm SL (male), 18.3 +/- 0.7 mm SL (female) |

Events:

- 0 hpf: fertilization; blastodisc forms
- 4.33 hpf: epiboly begins (dome)
- 5.25 hpf: gastrulation begins at 50 percent epiboly
- 6 hpf: shield marks the dorsal side
- 10 hpf: 100 percent epiboly; tail bud
- 10.33 hpf: first somite
- 16 hpf: tail bud protrudes away from the yolk
- 22 hpf: posterior trunk nearly straight; tail still curves ventrally
- 24 hpf: about 30 somites; HTA 120 deg
- 48 hpf: hatching period begins; HTA 45 deg
- 72 hpf: protruding mouth; larval period begins
- 96 hpf: swim bladder inflates; 3.4 to 3.7 mm SL
- 120 hpf: feeding larva 3.9 mm TL
- 336 hpf: notochord flexion 4.5 to 6.5 mm SL; fin fold resorption begins
- 720 hpf: juvenile from about 11.5 mm SL
- 2160 hpf: adult at 90 dpf, about 18 mm SL

Sources: https://zfin.org/ZFA:0001094; https://zfin.org/zf_info/zfbook/stages/index.html; https://zfin.org/zf_info/zfbook/stages/zygote.html; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html; https://zfin.org/zf_info/zfbook/stages/figs/fig33.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://europepmc.org/api/getPdf?pmcid=PMC4108942

### ZFA:0000092 axis

Synonyms: midline.  
System: axial. Parent: ZFA:0001094 whole organism (part_of).  
ZFIN stages: Gastrula:50%-epiboly (5.25 hpf) to Segmentation:5-9 somites (14 hpf).  

Definition: Organism subdivision running along the rostral-caudal axis of the early embryo.

Landmarks: visible as a thick dorsal stripe from 90 percent epiboly; head at the animal pole, tail bud at the vegetal pole.

Shape: A meridian band on the yolk sphere from the animal pole to the margin on the dorsal side. Width about 25 percent of the circumference at bud stage. Replace by head, trunk and tail bud from 10 hpf.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| 90%-epiboly | 9 | length 1500, width 400 | estimate | meridian arc from animal pole to the 90 percent latitude on a 0.65 mm sphere |
| Bud | 10 | length 2000, width 400 | estimate | full meridian |

Events:

- 5.25 hpf: ZFA start stage
- 9 hpf: axis and neural plate distinct; dorsal side much thicker
- 10 hpf: tail bud at the vegetal end, polster at the animal end
- 14 hpf: ZFA end stage (5-9 somites)

Sources: https://zfin.org/ZFA:0000092; https://zfin.org/zf_info/zfbook/stages/index.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html

### ZFA:0001114 head

System: axial. Parent: ZFA:0001094 whole organism (part_of).  
ZFIN stages: Gastrula:Bud (10 hpf) to Adult (17520 hpf).  

Definition: Organism subdivision which is the part of the body which consists of the cranial and pharyngeal regions.

Landmarks: snout to the posterior edge of the otic vesicle and pharyngeal arches; bent ventrally over the yolk at 24 hpf (HTA 120 deg).

Shape: Anterior body segment. Ellipsoid with the eyes as lateral bulges. Rotate ventrally relative to the trunk by the head-trunk angle: 120 deg (24 h), 95 (30 h), 75 (36 h), 55 (42 h), 45 (48 h), about 25 by 72 h.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 550, height 350, width 300 | estimate | about 0.28 of a 1.9 mm embryo |
| Long-pec | 48 | length 800, height 450, width 400 | estimate | yolk volume about equals head volume (Kimmel) |
| Day 5 | 120 | length 850, height 450, width 400 | estimate |  |
| Adult | 2160 | length 4500, height 3500, width 2500 | estimate | about 0.25 of an 18 mm SL adult |

Events:

- 10 hpf: ZFA start stage (bud): anterior neural plate thickens
- 24 hpf: head bent over the yolk, HTA 120 deg
- 72 hpf: mouth protrudes; head axis nearly aligned with trunk

Sources: https://zfin.org/ZFA:0001114; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html; https://zfin.org/zf_info/zfbook/stages/figs/fig33.html

### ZFA:0001306 pharyngeal arch

Synonyms: pharyngeal arches.  
System: axial. Parent: ZFA:0001114 head (part_of).  
ZFIN stages: Segmentation:10-13 somites (14 hpf) to Adult (17520 hpf).  

Definition: One of a series of paired bony or cartilaginous arches that develop along the lateral walls of the foregut. There are seven pharyngeal arches.

Landmarks: the pharyngeal region: between the eye and the heart; gill slits open at 48 to 72 hpf.

Shape: Region node for the pharyngeal part of the head: seven paired transverse bars under the hindbrain. Render as a ventrolateral block of the head; the skeletal specialist supplies the cartilages.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 250, height 150, width 300 | estimate |  |
| Long-pec | 48 | length 350, height 250, width 400 | estimate |  |
| Day 5 | 120 | length 450, height 300, width 450 | estimate |  |
| Adult | 2160 | length 2500, height 2500, width 2500 | estimate |  |

Events:

- 14 hpf: ZFA start stage (10-13 somites)
- 30 hpf: pharyngeal pouches form
- 48 hpf: jaw cartilage condensations; five gill slits form during hatching

Sources: https://zfin.org/ZFA:0001306; https://zfin.org/zf_info/zfbook/stages/hatch.html

### ZFA:0001115 trunk

System: axial. Parent: ZFA:0001094 whole organism (part_of).  
ZFIN stages: Gastrula:Bud (10 hpf) to Adult (17520 hpf).  

Definition: Organism subdivision which is the part of the body posterior to the head and anterior to the post-vent region.

Landmarks: from somite 1 to the vent (about somite 17); the yolk extension lies under it.

Shape: Body segment between head and vent. Elliptical cross section, taller than wide. Its ventral side follows the yolk; the gut runs along the yolk extension.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 650, height 250, width 200 | estimate |  |
| Long-pec | 48 | length 1100, height 350, width 250 | estimate |  |
| Day 5 | 120 | length 1400, height 450, width 300 | estimate |  |
| Adult | 2160 | length 6500, height 4500, width 2500 | estimate |  |

Events:

- 10 hpf: ZFA start stage
- 22 hpf: straightening of the posterior trunk nearly complete
- 24 hpf: 17 trunk somites

Sources: https://zfin.org/ZFA:0001115; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html

### ZFA:0001117 post-vent region

Synonyms: tail.  
System: axial. Parent: ZFA:0001094 whole organism (part_of).  
ZFIN stages: Segmentation:26+ somites (22 hpf) to Adult (17520 hpf).  

Definition: Organism subdivision which is the part of the body posterior to the vent which includes the anal and caudal fins.

Landmarks: from the vent to the tail tip; 13 tail somites at 24 hpf; curls ventrally around the yolk before 22 hpf, then straightens.

Shape: Tapered body segment behind the vent, wrapped by the median fin fold. Curve it ventrally around the yolk until 22 hpf, straighten by 48 hpf, and bend the tip dorsally (flexion) from 4.5 mm SL.

Sizes (micrometers unless the key says otherwise):

| Stage | hpf | Dimensions | Source | Note |
|---|---|---|---|---|
| Prim-5 | 24 | length 700, heightBase 200, heightTip 80 | estimate | 13 tail somites |
| Long-pec | 48 | length 1200, heightBase 300, heightTip 80 | estimate |  |
| Day 5 | 120 | length 1650, heightBase 400, heightTip 100 | estimate |  |
| Adult | 2160 | length 7000, heightBase 4000, heightTip 2500 | estimate | post-vent body plus caudal fin |

Events:

- 16 hpf: tail bud protrudes from the yolk
- 22 hpf: ZFA start stage; tail still curves ventrally
- 30 hpf: tail morphogenesis nears completion
- 336 hpf: notochord flexion 4.5 to 6.5 mm SL

Sources: https://zfin.org/ZFA:0001117; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/


## 6. Open questions

1. Notochord diameter. I found no paper that reports the wild-type notochord diameter in micrometers at 24, 48 and 120 hpf. Norman et al. 2018 give the ratio of notochord diameter to vacuolated cell diameter (1.33 at 48 hpf) and the rod aspect ratio (1.07), not absolute values (https://pmc.ncbi.nlm.nih.gov/articles/PMC6158209/). The JSON diameters (40, 55, 65 micrometers) are estimates. A confocal cross section of a 24, 48 and 120 hpf larva would settle this.
2. Yolk ball and yolk extension sizes. Kimmel gives ratios (extension length equals ball diameter at prim-5; yolk volume equals head volume at long-pec) and no absolute sizes. The JSON sizes are estimates. A measured yolk area time series (24 to 120 hpf) would improve the lathe profile.
3. Median fin fold height. Papers that measured the fold (https://pmc.ncbi.nlm.nih.gov/articles/PMC5805328/, https://pmc.ncbi.nlm.nih.gov/articles/PMC9079066/) report the values only in graphs. The JSON heights are estimates.
4. HTA for pec-fin and protruding-mouth. The fetched ZFIN text gave 55 degrees for pec-fin, which conflicts with the straightening trend. I recorded 35 degrees (pec-fin) and 25 degrees (protruding-mouth) as unverified. Check Kimmel 1995 Table 1 directly.
5. Somite length values (about 50 micrometers for somites 6 to 14, about 30 micrometers by somite 25) come from a search snippet of Schroeter et al. 2008 (https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.21458). The page itself returned HTTP 403. Confirm from the paper.
6. Kupffer's vesicle lumen area (2,250 to 4,517 square micrometers at 10 somites) comes from a search snippet of Gokey et al. 2016 (https://anatomypubs.onlinelibrary.wiley.com/doi/full/10.1002/dvdy.24355). The page itself returned HTTP 403. Confirm from the paper.
7. The `system` list has no slot for early embryo or body regions. The app team should decide whether to add `early_embryo` and `body_region` to the enum or to rely on the `uiGroup` field.
8. Kimmel's EL for curved embryos: I did not confirm whether EL follows the curved axis or the longest straight dimension. This affects how the 24 hpf axis length maps onto the wrapped body.

## 7. Source list

- ZFA and ZFS local files (release 2026-07-16): anatomy_item.txt, anatomy_relationship.txt, anatomy_synonyms.txt, zfa.obo, stage_ontology.txt. Term pages at https://zfin.org/ZFA:xxxxxxx.
- Kimmel CB, Ballard WW, Kimmel SR, Ullmann B, Schilling TF. 1995. Stages of embryonic development of the zebrafish. Dev Dyn 203:253-310. ZFIN copy: https://zfin.org/zf_info/zfbook/stages/index.html (stage table with EL); https://zfin.org/zf_info/zfbook/stages/zygote.html; https://zfin.org/zf_info/zfbook/stages/cleave_stgs.html; https://zfin.org/zf_info/zfbook/stages/blast.html; https://zfin.org/zf_info/zfbook/stages/blast_stgs.html; https://zfin.org/zf_info/zfbook/stages/gast.html; https://zfin.org/zf_info/zfbook/stages/gast_stgs.html; https://zfin.org/zf_info/zfbook/stages/seg.html; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/hatch.html; https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html; https://zfin.org/zf_info/zfbook/stages/larval.html; https://zfin.org/zf_info/zfbook/stages/figs/fig33.html.
- Parichy DM, Elizondo MR, Mills MG, Gordon TN, Engeszer RE. 2009. Normal table of postembryonic zebrafish development. Dev Dyn 238:2975-3015. https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/
- Singleman C, Holtzman NG. 2014. Growth and maturation in the zebrafish, Danio rerio: a staging tool for teaching and research. Zebrafish 11:396-406. https://europepmc.org/api/getPdf?pmcid=PMC4108942
- Kobitski AY et al. 2015. An ensemble-averaged, cell density-based digital model of zebrafish embryo development. Sci Rep 5:8601. https://www.nature.com/articles/srep08601 (yolk sphere 650 to 700 micrometers; cells about 25 micrometers; hypoblast about 20 micrometers at 7 hpf; embryo radius 330 micrometers).
- Sci Rep 12 (2022) Multiple asters organize the yolk microtubule network during dclk2-GFP zebrafish epiboly. https://www.nature.com/articles/s41598-022-07747-7 (yolk cell 700 to 800 micrometers).
- PMC10537415. Investigation of zebrafish embryo membranes at epiboly. https://pmc.ncbi.nlm.nih.gov/articles/PMC10537415/ (chorion 3 micrometers thick; perivitelline space 210 micrometers; embryo radius 397 micrometers).
- BioNumbers BNID 101661, zebrafish egg diameter 0.7 mm, citing Kimmel 1995. https://bionumbers.hms.harvard.edu/bionumber.aspx?id=101661&ver=0
- Gilbert SF. Developmental Biology, 6th ed., Early development in fish. https://www.ncbi.nlm.nih.gov/books/NBK10100/ (shield about 100 cells; EVL one cell thick).
- Schroeter C et al. 2008. Dynamics of zebrafish somitogenesis. Dev Dyn 237:545-553. https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.21458 (somite length; quoted via search snippet).
- Rost F et al. 2014. Chevron formation of the zebrafish muscle segments. J Exp Biol 217:3870-3882. https://pmc.ncbi.nlm.nih.gov/articles/PMC4213178/ (final chevron angle 40 degrees for segments 8 to 15; 2 h formation; segments 1 and 2 stay straight; length about half the height).
- Dasgupta A et al. 2018. Cell volume changes contribute to epithelial morphogenesis in zebrafish Kupffer's vesicle. eLife 7:e30963. https://elifesciences.org/articles/30963 (about 50 cells; lumen from 2 to 8 somites).
- Navis A et al. 2013. Cftr controls lumen expansion and function of Kupffer's vesicle. https://pmc.ncbi.nlm.nih.gov/articles/PMC3621488/ (57 cilia, 6 micrometers long).
- Okabe N et al. 2008. Fluid dynamics in zebrafish Kupffer's vesicle. https://pmc.ncbi.nlm.nih.gov/articles/PMC2829604/ (ellipsoid at 9 somites; position at the notochord end and in the yolk).
- Gokey JJ et al. 2016. Kupffer's vesicle size threshold for robust left-right patterning. Dev Dyn 245:22-33. https://anatomypubs.onlinelibrary.wiley.com/doi/full/10.1002/dvdy.24355 (lumen area; quoted via search snippet).
- PMC8820232. Spint2 is required for cellular cohesion during zebrafish hatching gland development. https://pmc.ncbi.nlm.nih.gov/articles/PMC8820232/ (hatching gland cell counts 232 to 271).
- PMC4482254. Protein-trap insertional mutagenesis uncovers new genes in zebrafish skin development. https://pmc.ncbi.nlm.nih.gov/articles/PMC4482254/ (fin fold begins 18 hpf; thin and flat by 48 hpf).
- PMC5805328. Effects of fin fold mesenchyme ablation on fin development. https://pmc.ncbi.nlm.nih.gov/articles/PMC5805328/ (fin fold from somite 8; actinodin from 24 hpf).
- PMC9079066. Developmental independence of median fins from the larval fin fold. https://pmc.ncbi.nlm.nih.gov/articles/PMC9079066/ (fin fold height trends by SL).
- Norman J et al. 2018. Tissue self-organization underlies morphogenesis of the notochord. https://pmc.ncbi.nlm.nih.gov/articles/PMC6158209/ (aspect ratio 1.07 and diameter ratio 1.33 at 48 hpf).
- Lleras Forero L et al. 2018. Segmentation of the zebrafish axial skeleton relies on notochord sheath cells. eLife 7:e33843. https://elifesciences.org/articles/33843 (29 to 31 sheath segments; first chordacentrum at 6 dpf; 1.5 segments per day).
- Wopat S et al. 2018. Spine patterning is guided by segmentation of the notochord sheath. https://pmc.ncbi.nlm.nih.gov/articles/PMC5860813/ (sheath segmentation from about 4 dpf, 3.5 to 4.0 mm SL, one segment every 8 h).
- PMC8126416. Mathematical modeling of the interaction between yolk utilization and fish growth in zebrafish. https://pmc.ncbi.nlm.nih.gov/articles/PMC8126416/ (maximum yolk use at 3.4 dpf; full absorption at 7 dpf).
