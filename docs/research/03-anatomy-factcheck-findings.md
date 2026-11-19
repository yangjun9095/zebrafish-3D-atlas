# 03. Fact check of the anatomy drafts

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Scope: the five files `03a` to `03e` `*.draft.json` (220 records). Method: the script `03-anatomy-factcheck.py` runs the structural checks against the ZFIN downloads (anatomy_item.txt, anatomy_relationship.txt, anatomy_synonyms.txt, stage_ontology.txt) and writes `03-anatomy-factcheck-report.md` and `.json`. I then tried to refute 24 position, size and event claims against ZFIN pages and primary papers. I did not edit the drafts.

Abbreviations: ZFA = Zebrafish Anatomy Ontology; ZFS = Zebrafish Stage Ontology; hpf = hours post fertilization at 28.5 C; SL = standard length; EL = embryo length (Kimmel et al. 1995).

Two notes on method. The column order of `anatomy_relationship.txt` is parent, child, relation (verified against the OBO: `ZFA:0000077<tab>ZFA:0000001<tab>part of` matches `ZFA:0000001 part_of ZFA:0000077 tail bud`). No file defines the allowed `system` list. All five writers use the same 15 values (nervous, sensory, cardiovascular, hematopoietic_immune, respiratory, digestive, excretory, endocrine, reproductive, skeletal, muscular, fins, integument_pigment, extraembryonic, axial), so the script treats that set as the allowed list. The design brief (07) names its 15 palette slots differently (hematopoietic, immune, musculature, integument, renal, yolk). One of the two lists must change before the app maps colours.

## 1. What passed

- All five files parse as JSON and are lists. Every record has the 16 shared keys, `spatial.apFraction/dv/laterality/landmarks` and `shape.primitive/notes`. Every `shape.primitive` is in the agreed set.
- All 220 ids exist in `anatomy_item.txt` and every `name` equals the ZFIN label (no synonym substitutions).
- All 220 `startStage` and `endStage` values equal the ZFIN start and end stages; all `startHpf` and `endHpf` values equal the `stage_ontology.txt` bounds of those stages.
- All 22 records whose ZFIN start stage is Unknown (ZFS:0000000) carry a `visibleFromHpf` with a note.
- Every `parent`, `uiParent`, `parentAll`, `zfaPartOf` and `developsFrom` id exists in ZFIN.
- No `system` value falls outside the 15-value set.

## 2. Automated findings

Counts: high 29, medium 21, low 36, info 150. The full table is in `03-anatomy-factcheck-report.md`.

### 2.1 apFraction outside 0..1 (high, 6 records, all 03e)

| id | name | apFraction | correct value |
|---|---|---|---|
| ZFA:0001058 | caudal fin | [0.95, 1.2] | [0.95, 1.0] with the fin drawn past the SL end, or state the basis (TL) in a new field `apFractionBasis` |
| ZFA:0001554 | lepidotrichium | [0.26, 1.2] | [0.26, 1.0] (same rule) |
| ZFA:0001463 | melanophore stripe | [0.25, 1.2] | [0.25, 1.0] |
| ZFA:0009091 | melanocyte | [0.05, 1.1] | [0.05, 1.0] |
| ZFA:0009198 | xanthophore | [0.05, 1.1] | [0.05, 1.0] |
| ZFA:0009199 | iridophore | [0.05, 1.1] | [0.05, 1.0] |

The writer used values above 1 to say "extends onto the caudal fin". The schema says 0..1. Pick one basis for the whole atlas (SL or TL) and write it down.

### 2.2 Duplicate ids across files (medium, 7 ids) with conflicting values

| id | name | files | conflicts | recommended merge |
|---|---|---|---|---|
| ZFA:0001185 | periderm | 03a, 03e | parent ZFA:0001094 vs ZFA:0000016; thickness 5 vs 2 um; 03a adds `modelEndHpf` 168; colours differ | keep one record; parent ZFA:0000016 (ectoderm, the ZFA develops_from chain) or ZFA:0001094 with `parentRelation: grouping`; thickness 2 to 3 um (EVL is one cell thick) |
| ZFA:0001056 | myotome | 03a, 03e | count 31 vs 32 at 48 to 2160 hpf; adult length 550 vs 700 um; adult height 4000 vs 6000 um | one record; count 30 to 32 with a note; adult size on the agreed adult SL (section 3, item 21) |
| ZFA:0000671 | horizontal myoseptum | 03a, 03e | parent ZFA:0001089 vs null; adult length 15000 vs 21000 um | one record; parent ZFA:0001089 |
| ZFA:0000040 | median fin fold | 03a, 03e | parent ZFA:0001094 vs null; 03a `visibleFromHpf` 24 and `modelEndHpf` 720; 03e neither; height 60 vs 80 um at 24 hpf | one record; keep the 03a overrides (ZFA ends the term at day 5 but the fold persists to about 7 mm SL) |
| ZFA:0001306 | pharyngeal arch | 03a, 03c | system axial vs respiratory; dims are different parameterizations (length/height/width vs count_per_side/region_length/arch_width) | one record; system respiratory or skeletal; one parameterization |
| ZFA:0000669 | head kidney | 03c, 03d | system hematopoietic_immune vs excretory; `visibleFromHpf` 96 vs 720; sizes at 120 hpf (80x60x40 um) vs 720 hpf (1000x500x300 um) | one record; `visibleFromHpf` 96 (Willett et al. 1999: the pronephros holds hematopoietic cells at 96 hpf, https://europepmc.org/abstract/MED/10213388); note that the head region becomes distinct at about 30 dpf |
| ZFA:0000694 | ceratobranchial 5 tooth | 03d, 03e | system digestive vs skeletal; count field only in 03e; adult height 250 vs 300 um | one record; system skeletal; keep the count series |

### 2.3 Parent is not a ZFA part_of or is_a ancestor (high, 23 records)

The draft `parent` is a developmental successor or a UI grouping, and `anatomy_relationship.txt` has no part_of or is_a path from the child to it. Either move the value to `uiParent` (as 03e does) or set `parentRelation` to `grouping` or `developsInto`, and set `parent` to the ZFA parent given here.

| file | id | name | draft parent | direct ZFA parents |
|---|---|---|---|---|
| 03a | ZFA:0000038 | margin | ZFA:0001176 blastoderm | is_a ZFA:0001105 embryonic structure |
| 03a | ZFA:0000060 | prechordal plate | ZFA:0000092 axis | part_of ZFA:0001204 axial mesoderm |
| 03a | ZFA:0000091 | axial chorda mesoderm | ZFA:0000092 axis | part_of ZFA:0001204 axial mesoderm |
| 03a | ZFA:0000111 | germ ring | ZFA:0001176 blastoderm | is_a ZFA:0001105 embryonic structure |
| 03b | ZFA:0000048 | olfactory placode | ZFA:0000047 peripheral olfactory organ | part_of ZFA:0001149 olfactory system |
| 03b | ZFA:0000050 | optic vesicle | ZFA:0000107 eye | part_of ZFA:0001678 immature eye |
| 03b | ZFA:0001202 | optic cup | ZFA:0000107 eye | part_of ZFA:0001678 immature eye |
| 03b | ZFA:0000051 | otic vesicle | ZFA:0000217 inner ear | is_a ZFA:0001105 embryonic structure |
| 03b | ZFA:0000138 | otic placode | ZFA:0000217 inner ear | part_of ZFA:0001138 vestibuloauditory system |
| 03b | ZFA:0000132 | neural plate | ZFA:0000012 central nervous system | is_a ZFA:0001477 portion of tissue |
| 03b | ZFA:0000131 | neural keel | ZFA:0000012 | is_a ZFA:0001477 |
| 03b | ZFA:0000133 | neural rod | ZFA:0000012 | is_a ZFA:0001477 |
| 03b | ZFA:0001135 | neural tube | ZFA:0000012 | is_a ZFA:0001477 |
| 03c | ZFA:0000555 | opercular flap | ZFA:0001114 head | is_a ZFA:0000292 surface structure |
| 03c | ZFA:0005967 | pseudobranch | ZFA:0001114 head | is_a ZFA:0001488 multi-tissue structure |
| 03c | ZFA:0000604 | ventral aorta | ZFA:0005003 pharyngeal vasculature | is_a ZFA:0000005 artery |
| 03c | ZFA:0001053 | primitive internal carotid artery | ZFA:0001267 cranial vasculature | is_a ZFA:0000005 artery |
| 03c | ZFA:0001286 | caudal vein plexus | ZFA:0005037 post-vent vasculature | is_a ZFA:0005932 developmental vascular plexus |
| 03c | ZFA:0005934 | subintestinal venous plexus | ZFA:0005024 trunk vasculature | is_a ZFA:0005931 vascular plexus |
| 03c | ZFA:0005335 | swim bladder bud | ZFA:0007116 pleuroperitoneal region | is_a ZFA:0001105 embryonic structure |
| 03d | ZFA:0001200 | corpuscles of Stannius | ZFA:0000151 pronephros | is_a ZFA:0001477 portion of tissue |
| 03d | ZFA:0005737 | intestinal rod | ZFA:0000112 gut | is_a ZFA:0001488 multi-tissue structure |
| 03d | ZFA:0005738 | intestinal bulb primordium | ZFA:0000112 gut | is_a ZFA:0001477 portion of tissue |

Four more records (medium) reach the parent only through develops_from: 03a yolk syncytial layer -> yolk, notochord -> whole organism, paraxial mesoderm -> whole organism, periderm -> whole organism. Label them `developsFrom` or point them at a part_of ancestor.

Sixteen 03e records have `parent: null` and no `parentRelation` (low): horizontal myoseptum, slow and fast muscle cell, adductor mandibulae, sternohyoid, median fin fold, pectoral fin bud, pectoral fin, pelvic fin bud, pelvic fin, dorsal fin, lepidotrichium, and the four larval melanophore stripes. They carry a `uiParent` only. Fill `parent` from ZFA.

### 2.4 Missing size keyframes at a checkpoint where the structure exists (medium, 6)

| file | id | name | missing | keyframes present |
|---|---|---|---|---|
| 03a | ZFA:0001185 | periderm | 48 and 120 hpf (model keeps it to 168 hpf) | 10, 24 |
| 03b | ZFA:0000138 | otic placode | 24 hpf (exists to 24) | 14, 16 |
| 03b | ZFA:0001157 | posterior lateral line primordium | 120 hpf (exists to 120) | 20, 24, 36, 48 |
| 03c | ZFA:0000115 | heart rudiment | 24 hpf (exists 19 to 24) | 21 |
| 03d | ZFA:0009288 | primordial germ cell | adult (endHpf 17520 by convention) | 4, 24, 48, 120 |

For the three short-lived structures a terminal keyframe at the end hpf is enough.

### 2.5 Overrides earlier than the ZFIN start (medium, 4; all carry notes)

caudal vein 24 vs ZFIN 96 hpf (03c); intersegmental vessel 22 vs 24 (03c, note marked unverified); thyroid primordium 24 vs 30 (03d); endocrine pancreas 24 vs 48 (03d). The literature supports all four (Isogai et al. 2001 for the caudal vein; Field et al. 2003 for the dorsal pancreatic bud at 24 hpf, https://europepmc.org/abstract/MED/12941629). Keep them, but the data model must allow `visibleFromHpf < startHpf`.

### 2.6 Low and informational

Nineteen size keyframes fall outside the record's own existence window (for example 03b lens, retina and retinal pigmented epithelium have 24 hpf keyframes but ZFIN starts them at 30 hpf; 03c swim bladder has a 60 hpf keyframe but `visibleFromHpf` 96). These are handover frames from a predecessor term. Either drop them or add a `visibleFromHpf` that matches the first keyframe. Sixty-four events fall outside the existence window (informational). Two records list synonyms that ZFIN does not have (see the report).

## 3. Web spot checks

I tried to refute each claim. "Supported" means the source states the value; "not verified" means I could not reach a source that states it. The WebSearch budget of this session ran out after the first batch, so I used direct URLs (ZFIN, Europe PMC REST, NCBI E-utilities) instead.

| # | file / id | claim | verdict | evidence | correct value |
|---|---|---|---|---|---|
| 1 | 03e ZFA:0000141 pectoral fin bud | "bud arises by about 24 hpf"; 24 hpf keyframe 25 x 100 x 80 um | refuted | Kimmel, ZFIN prim-5 text: "By 26 h (prim-8), mesenchyme gathers ... where the pectoral fin buds will form. The buds first appear as mounds by 28-29 h"; prim-15: "shallow domes". https://zfin.org/zf_info/zfbook/stages/phar_stgs.html | keep ZFA start Prim-5 but add `visibleFromHpf` 28; move the first keyframe to 28 to 30 hpf |
| 2 | 03a ZFA:0000084 yolk | 48 hpf keyframe: ball 450 um, extension 500 um (ratio 1.11) | refuted | Kimmel high-pec (42 h): extension "about 1.5 times the diameter of the yolk ball"; prim-25: "markedly surpasses". Same URL as 1 | at 42 to 48 hpf extensionLength about 1.5 x ballDiameter (for example ball 400, extension 600 um) |
| 3 | 03d ZFA:0000694 tooth | event 96 hpf "tooth 5V present (ZFIN Day 4 start for 5V is Protruding-mouth)" | refuted | ZFA tooth 5V (ZFA:0001142) starts at Protruding-mouth = 72 hpf (anatomy_item.txt); the event text contradicts itself | move the event to 72 hpf |
| 4 | 03c ZFA:0000360 heart tube | "looping can be observed from 28 hpf" | contradicted by the staging series | Kimmel prim-15 (30 h): "The heart is still a straight tube"; prim-25 (36 h): "now bends slightly"; Bakkers 2011: looping 36 to 48 hpf, https://europepmc.org/abstract/MED/21602174 | looping onset 30 to 36 hpf; do not bend the tube before 30 hpf |
| 5 | 03a, 03c, 03d, 03e adult keyframes | adult (2160 hpf) sizes scaled to 18 mm SL (03a), 25 mm (03c, 03d) and 28 mm SL (03e, cited to FishBase) | inconsistent | FishBase gives a maximum of 3.8 cm SL, not a typical 90 dpf fish, https://www.fishbase.se/summary/Danio-rerio.html; `morphometrics.draft.json` anchors 90 dpf at 18 mm SL | pick one adult SL for 2160 hpf (18 mm per the morphometrics file, or another agreed value) and rescale the 03c, 03d and 03e adult dims |
| 6 | 03a ZFA:0000329 chorion | inner diameter 1200 um, wall 3 um | supported | PMC10537415: embryo radius 397 um, perivitelline space 210 um, chorion 3 um, measured at epiboly; 2 x 607 = 1214 um | none; note that the measurement is at epiboly |
| 7 | 03a ZFA:0000084 yolk | zygote 0.7 mm | supported | https://zfin.org/zf_info/zfbook/stages/zygote.html | none |
| 8 | 03a yolk, 4 hpf | sphere-stage diameter 675 um, cited to nature.com/articles/srep08601 | not verified | that DOI resolves to Kobitski et al. 2015 (digital model of the embryo); its abstract gives no diameter | keep as an estimate or cite the figure |
| 9 | 03a somite, 03e myotome | somites at 3 per hour for the first six, then 2 per hour; 18 somites at 18 h | supported | https://zfin.org/zf_info/zfbook/stages/seg.html | none |
| 10 | 03a, 03e EL values | 1.9 mm at 24 h, 3.1 mm at 48 h, 3.9 mm at day 5; 6 teeth at day 5 | supported | https://zfin.org/zf_info/zfbook/stages/index.html (Day 5: "3.9 mm total body length; 6 teeth") | none |
| 11 | 03b ZFA:0000051 otic vesicle, ZFA:0001617 otolith | cavitation 18 h, otoliths 19.5 h, hair cells 24 h, 10 to 20 hair cells at 42 h, canals 42 to 72 h; particles coalesce from 18.5 h | supported | Haddon and Lewis 1996 abstract via https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=8821445&rettype=abstract ; https://zfin.org/zf_info/anatomy/dict/oto/otolith.html | none |
| 12 | 03b ZFA:0001157 primordium, ZFA:0000243 neuromast | about 100 cells; 100 um/h; tip over somite 3 at 22 h, myotome 5 at 24 h, tail by 42 h; mature neuromast 50 um wide, 20 um high, about 60 cells, one third hair cells | supported | ZFIN seg_stgs and phar_stgs pages; Pinto-Teixeira et al. 2013, https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2013.00033/full | none |
| 13 | 03c ZFA:0000149 primitive heart tube | heartbeat onset 24 hpf | supported | Kimmel prim-5: "begins to beat just prior to this stage"; Bakkers 2011 | none (23 to 24 hpf) |
| 14 | 03c ZFA:0000114 heart | 141 bpm at 48 hpf and 28 C | disagrees with Kimmel | Kimmel high-pec (42 h): "beats (about 180 per minute)"; the draft value comes from Denvir et al. 2008 | keep, but state the temperature and that the staging series gives about 180 |
| 15 | 03c heart | endocardial cushions 48 hpf, valve leaflets 105 hpf, pro-epicardium 48 hpf, epicardium spreads 72 hpf, myl7 at 14 somites, cardiac disc at 12 to 15 somites (16 hpf) | supported | Bakkers 2011 full text, https://www.ebi.ac.uk/europepmc/webservices/rest/PMC3125074/fullTextXML | none |
| 16 | 03a ZFA:0000026 hatching gland | 271 +/- 42 cells at 18 hpf; 241 to 267 at 48 hpf; continuous sheet at 24 hpf | supported | PMC8820232 (values are for the 18-somite stage) | none |
| 17 | 03e ZFA:0001205 Meckel's cartilage | distinct by 55 hpf; dentary osteoblasts 78 hpf; chondrocytes span the width at 86 hpf; condensations at 48 hpf | supported | https://www.facebase.org/resources/zebrafish/fishface/meckel/ ; https://zfin.org/zf_info/zfbook/stages/hatch.html | none |
| 18 | 03d ZFA:0000123 liver | aggregation after 24 hpf; hepatic duct 50 hpf; endothelial cells 55 to 58 hpf; circulation 72 hpf; crosses the midline 80 to 84 hpf; right lobe 80 to 96 hpf; third lobe about 15 dpf; hepatocytes 10 to 14 um | supported | Field et al. 2003 abstract; Korzh et al. 2008 full text, https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2564926/fullTextXML | none; the draft's "sinusoids 12 to 16 um at 120 hpf" is not in Korzh (5 to 8 um at 68 to 72 hpf) |
| 19 | 03d ZFA:0000140 pancreas, ZFA:0001260 | dorsal bud 24 hpf, ventral bud 40 hpf, fusion 52 hpf | supported | Field et al. 2003 II abstract via Europe PMC | none |
| 20 | 03d ZFA:0001081 thyroid primordium | first follicle 55 hpf | supported | Alt et al. 2006 abstract, https://europepmc.org/abstract/MED/16680724 | none; the 20, 24 and 36 to 40 hpf marker times are not verified |
| 21 | 03d ZFA:0000151 pronephros | filtration onset 40 to 48 hpf | supported | Drummond et al. 1998 abstract | none |
| 22 | 03c ZFA:0000076 swim bladder | budding 36 to 48 hpf; inflation 96 to 120 hpf; anterior chamber 21 dpf | supported; "elongation 65 to 96 hpf" not verified | Winata et al. 2009 abstract: budding 36 to 48 hpf, growth to 4.5 dpf, inflation 4.5 dpf and 21 dpf | none |
| 23 | 03c gill (72), gill filament (84) | filament rudiments late in the hatching period; first filaments 3.5 dpf | supported for the ZFIN part | https://zfin.org/zf_info/zfbook/stages/hatch.html ; the 2025 gill atlas abstract has no dpf value | none |
| 24 | 03e melanocyte events | dorsal stripe 30, ventral 36, lateral 42, yolk stripe 72 hpf; melanophores first behind the otic vesicle at 24 h | supported | ZFA start stages of ZFA:0005221 to 0005224; Kimmel prim-5 and prim-15 text | none |
| 25 | 03e caudal fin, melanophore stripe | Parichy 2009 SL landmarks (rays 4.9 to 5.1 mm, lobes 6.4 mm, stripes 9 mm, flexion 4.5 to 6.5 mm) | not verified | PMC3030279 returns a captcha; Wiley returns 403; Europe PMC has no full text | leave as cited; re-check when the PMC copy is reachable |
| 26 | 03e pectoral fin bud dims | 34.7 +/- 6 um at 30 hpf; 72.2 +/- 12 um at 46 hpf (Yano et al. 2012 Table S1) | not verified | the main text refers to supplementary Table S1, which I could not open | leave as cited |

## 4. Corrections in priority order

1. Clamp the six 03e `apFraction` ranges to 1.0 and record the basis (SL or TL) once for the atlas.
2. Merge the seven duplicate ids and resolve the value conflicts in table 2.2; the head kidney should use `visibleFromHpf` 96.
3. Fix the 23 `parent` values in table 2.3 (or move them to `uiParent` and set `parentRelation`), the four develops_from cases, and the 16 null parents in 03e.
4. Pectoral fin bud: `visibleFromHpf` 28, first keyframe at 28 to 30 hpf.
5. Yolk 48 hpf keyframe: extension about 1.5 x ball diameter.
6. Tooth 5V event: 72 hpf.
7. Heart tube: looping onset 30 to 36 hpf, not 28.
8. Agree one adult SL for the 2160 hpf keyframes and rescale 03c, 03d, 03e.
9. Add the six missing checkpoint keyframes (table 2.4).
10. Reconcile the 15 `system` names between the drafts and the design brief.
11. Let the data model accept `visibleFromHpf` earlier than `startHpf` (four records rely on it).
