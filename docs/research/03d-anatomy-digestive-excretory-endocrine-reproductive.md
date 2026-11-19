# Zebrafish anatomy research 03d: digestive, excretory, endocrine and reproductive systems

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

This document lists the structures of the digestive, excretory (renal), endocrine and reproductive systems that a schematic whole-organism 3D model should show. The companion file `03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json` holds the same data in machine form.

## 1. Method

I extracted candidate terms from the local ZFIN files: `anatomy_item.txt`, `anatomy_relationship.txt`, `anatomy_synonyms.txt` and `zfa.obo`. I kept terms at organ, tissue or region level and dropped cell-level terms except the primordial germ cell, which the task requested. The final list holds 43 structures. Definitions, synonyms, part_of parents and start/end stages come from `zfa.obo`. I checked every start and end stage against `anatomy_item.txt`; all entries match. Positions, shapes, sizes and events come from three places: the ZFA definitions, Kimmel et al. 1995 as mirrored on ZFIN, and the primary papers listed under each structure. The ZFIN staging pages and several publisher sites refused connections during this session. I used PubMed Central full texts and Europe PMC instead. The web search budget of the session ran out before I could find measured sizes for several organs. Every size that I could not find in a source carries the label `estimate (this document)` in the JSON and `(estimate)` in the tables below.

## 2. Conventions

- `startHpf` is the start of the ZFIN start stage. `endHpf` is the end of the ZFIN end stage as given in `stage_ontology.txt`. For structures that persist into the adult, `endHpf` is 17520 (the end of the Adult stage). This matches drafts 03b, 03c and 03e. Draft 03a uses the same rule for intermediate stages.
- A ZFIN start stage of Unknown (ZFS:0000000) gives `startHpf` 0.0 and a `startNote`. Such entries carry `visibleFromHpf` with a source. A ZFIN end stage of Unknown gives `endHpf` 17520 and an `endNote`.
- `visibleFromHpf` marks the time at which a schematic model should first draw the structure when that time differs from the ZFIN start stage. The reason is given in `visibleNote`.
- Sizes are listed at 24, 48 and 120 hpf and in the adult when the structure exists at that time. Structures with an Unknown start stage (mouth, head kidney, mesonephric duct, gonad primordium) have sizes from their `visibleFromHpf` onward. The primordial germ cell has no adult size because the cells become oogonia or spermatogonia.
- `apFraction` is the fraction of total body length from the snout tip (0) to the tail tip (1). All values are estimates read from the landmarks in the `spatial.landmarks` field. Landmarks used: somite 1 lies at about 0.27 of body length at 24 hpf. The anus lies at the posterior end of the yolk extension, at about 0.56 to 0.58 of body length in the larva. The anal fin origin lies at about 0.55 of total length in the adult.
- Sizes are in micrometres. Adult sizes assume a fish of 25 mm standard length (adult 23 to 26 mm SL in Parichy et al. 2009).
- Body length references come from `05-morphometrics.md` in this folder, which cites Kimmel et al. 1995 (K95) and Parichy et al. 2009 (P09). Embryo length is 1.9 mm at Prim-5 (24 hpf) and 3.1 mm at Long-pec (48 hpf). Total length is 3.5 mm at Protruding-mouth (72 hpf) and 3.9 mm at Day 5 (120 hpf). The swim bladder inflates at 3.5 to 3.7 mm SL. Adult total length is about 1.2 times SL. With these values, one somite of about 45 um at 24 hpf equals about 0.024 of body length.
- System roots appear only as `parent` values and need no geometry. They are: digestive system ZFA:0000339, liver and biliary system ZFA:0000036, pancreatic system ZFA:0001371, renal system ZFA:0000163, endocrine system ZFA:0001158 and reproductive system ZFA:0000632.

## 3. Summary tables

### 3.1 Digestive system

| ZFA id | Name | Parent (part_of) | ZFIN start | ZFIN end | Visible from (hpf) | Position (AP fraction; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000112 | gut | digestive system (ZFA:0000339) | Segmentation:10-13 somites (14-16 hpf) | Adult (2160-17520 hpf) | 14.0 | 0.12-0.58; midline, loops left at the foregut | custom | `#D9B382` |
| ZFA:0005737 | intestinal rod | gut (ZFA:0000112) | Segmentation:20-25 somites (19-22 hpf) | Pharyngula:High-pec (42-48 hpf) | 19.0 | 0.25-0.56; midline; the foregut segment bends left between 26 and 30 hpf | tube | `#E8C99B` |
| ZFA:0005738 | intestinal bulb primordium | gut (ZFA:0000112) | Pharyngula:Prim-5 (24-30 hpf) | Pharyngula:High-pec (42-48 hpf) | 24.0 | 0.25-0.32; bends to the left of the midline between 26 and 30 hpf | tube | `#E2B77A` |
| ZFA:0000056 | pharynx | digestive system (ZFA:0000339) | Segmentation:10-13 somites (14-16 hpf) | Adult (2160-17520 hpf) | 14.0 | 0.08-0.25; midline | tube | `#E6A57E` |
| ZFA:0000547 | mouth | digestive system (ZFA:0000339) | Unknown (0-17520 hpf) | Adult (2160-17520 hpf) | 60 | 0-0.03; midline | custom | `#C97B63` |
| ZFA:0000204 | esophagus | gut (ZFA:0000112) | Pharyngula:Prim-15 (30-36 hpf) | Adult (2160-17520 hpf) | 30.0 | 0.22-0.27; midline | tube | `#D8946A` |
| ZFA:0001338 | intestine | gut (ZFA:0000112) | Pharyngula:Prim-15 (30-36 hpf) | Adult (2160-17520 hpf) | 30.0 | 0.27-0.57; midline, with the bulb offset to the left in the larva | custom | `#E3A572` |
| ZFA:0001076 | intestinal bulb | intestine (ZFA:0001338) | Pharyngula:High-pec (42-48 hpf) | Adult (2160-17520 hpf) | 42.0 | 0.27-0.4; left of the midline in the larva | tube | `#EDAE6B` |
| ZFA:0001323 | mid intestine | intestine (ZFA:0001338) | Pharyngula:Prim-15 (30-36 hpf) | Adult (2160-17520 hpf) | 30.0 | 0.4-0.5; midline | tube | `#E39A5B` |
| ZFA:0000706 | posterior intestine | intestine (ZFA:0001338) | Pharyngula:Prim-15 (30-36 hpf) | Adult (2160-17520 hpf) | 30.0 | 0.5-0.57; midline | tube | `#C98A4E` |
| ZFA:0005781 | cloaca | gut (ZFA:0000112) | Pharyngula:Prim-5 (24-30 hpf) | Adult (2160-17520 hpf) | 24.0 | 0.56-0.58; midline | sphere | `#A86B4C` |
| ZFA:0000066 | proctodeum | gut (ZFA:0000112) | Segmentation:26+ somites (22-24 hpf) | Pharyngula:Prim-5 (24-30 hpf) | 22.0 | 0.56-0.57; midline | custom | `#8F5A40` |
| ZFA:0000298 | vent | cloaca (ZFA:0005781) | Pharyngula:Prim-5 (24-30 hpf) | Adult (2160-17520 hpf) | 120 | 0.565-0.575; midline | custom | `#7A4A35` |
| ZFA:0000124 | liver primordium | liver and biliary system (ZFA:0000036) | Pharyngula:Prim-5 (24-30 hpf) | Pharyngula:Prim-5 (24-30 hpf) | 24.0 | 0.26-0.29; left; the primordium is the leftward thickening of the foregut | ellipsoid | `#A8453A` |
| ZFA:0000123 | liver | liver and biliary system (ZFA:0000036) | Pharyngula:Prim-15 (30-36 hpf) | Adult (2160-17520 hpf) | 30.0 | 0.24-0.36; left of the midline until 80 hpf; crosses the midline to the right at 80 to 84 hpf; three lobes in the adult | ellipsoid | `#9B3B32` |
| ZFA:0000208 | gall bladder | liver and biliary system (ZFA:0000036) | Hatching:Long-pec (48-60 hpf) | Adult (2160-17520 hpf) | 72 | 0.3-0.33; right; adjacent to the right liver lobe | sphere | `#5E9E5A` |
| ZFA:0001370 | posterior pancreatic bud | pancreatic system (ZFA:0001371) | Pharyngula:Prim-5 (24-30 hpf) | Hatching:Long-pec (48-60 hpf) | 24.0 | 0.3-0.33; right of the midline | sphere | `#E9D27F` |
| ZFA:0001369 | anterior pancreatic bud | pancreatic system (ZFA:0001371) | Pharyngula:Prim-25 (36-42 hpf) | Hatching:Pec-fin (60-72 hpf) | 36.0 | 0.29-0.32; left-ventral, then grows dorsally and to the right to meet the posterior bud | ellipsoid | `#F0E3A1` |
| ZFA:0000140 | pancreas | pancreatic system (ZFA:0001371) | Hatching:Long-pec (48-60 hpf) | Adult (2160-17520 hpf) | 48.0 | 0.3-0.45; right | custom | `#EBD68C` |
| ZFA:0001260 | endocrine pancreas | pancreas (ZFA:0000140) | Hatching:Long-pec (48-60 hpf) | Adult (2160-17520 hpf) | 24 | 0.31-0.33; right of the midline | sphere | `#D8A63C` |
| ZFA:0001249 | exocrine pancreas | pancreas (ZFA:0000140) | Hatching:Long-pec (48-60 hpf) | Adult (2160-17520 hpf) | 48.0 | 0.3-0.45; right | custom | `#F2E6B3` |
| ZFA:0000694 | ceratobranchial 5 tooth | pharynx (ZFA:0000056) | Hatching:Long-pec (48-60 hpf) | Adult (2160-17520 hpf) | 48.0 | 0.2-0.24; paired, one tooth field on each ceratobranchial 5 | custom | `#F1EBD8` |

### 3.2 Excretory (renal) system

| ZFA id | Name | Parent (part_of) | ZFIN start | ZFIN end | Visible from (hpf) | Position (AP fraction; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000151 | pronephros | renal system (ZFA:0000163) | Segmentation:10-13 somites (14-16 hpf) | Larval:Days 7-13 (168-336 hpf) | 14.0 | 0.28-0.57; paired ducts and tubules; glomeruli fused at the midline | custom | `#8C4FA3` |
| ZFA:0001557 | pronephric glomerulus | pronephros (ZFA:0000151) | Segmentation:10-13 somites (14-16 hpf) | Larval:Days 7-13 (168-336 hpf) | 14.0 | 0.29-0.31; paired primordia at 24 hpf; fused at the midline by 48 hpf | sphere | `#B23A8C` |
| ZFA:0001558 | pronephric tubule | pronephros (ZFA:0000151) | Segmentation:10-13 somites (14-16 hpf) | Larval:Days 7-13 (168-336 hpf) | 14.0 | 0.3-0.35; paired, lateral to the glomerulus | tube | `#A55BB0` |
| ZFA:0000150 | pronephric duct | pronephros (ZFA:0000151) | Segmentation:10-13 somites (14-16 hpf) | Larval:Days 7-13 (168-336 hpf) | 14.0 | 0.33-0.57; paired, left and right | tube | `#9C6FC4` |
| ZFA:0000529 | kidney | renal system (ZFA:0000163) | Larval:Day 5 (120-144 hpf) | Adult (2160-17520 hpf) | 288 | 0.22-0.56; midline, fused bilateral lobes in the head kidney; paired trunk tissue that fuses in the adult | custom | `#7B2D8E` |
| ZFA:0000669 | head kidney | kidney (ZFA:0000529) | Unknown (0-17520 hpf) | Adult (2160-17520 hpf) | 720 | 0.22-0.3; fused bilateral lobes at the midline | ellipsoid | `#6A2C7A` |
| ZFA:0001293 | posterior kidney | kidney (ZFA:0000529) | Larval:Day 6 (144-168 hpf) | Adult (2160-17520 hpf) | 336 | 0.3-0.56; paired strips that fuse at the midline in the adult | tube | `#8E4A9E` |
| ZFA:0000546 | mesonephric duct | renal system (ZFA:0000163) | Unknown (0-17520 hpf) | Adult (2160-17520 hpf) | 336 | 0.3-0.57; paired | tube | `#B48ACF` |

### 3.3 Endocrine glands

| ZFA id | Name | Parent (part_of) | ZFIN start | ZFIN end | Visible from (hpf) | Position (AP fraction; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0001081 | thyroid primordium | endocrine system (ZFA:0001158) | Pharyngula:Prim-15 (30-36 hpf) | Hatching:Long-pec (48-60 hpf) | 24 | 0.14-0.17; midline | sphere | `#E57DA0` |
| ZFA:0001072 | thyroid follicle | endocrine system (ZFA:0001158) | Hatching:Long-pec (48-60 hpf) | Adult (2160-17520 hpf) | 48.0 | 0.15-0.22; midline; follicles scatter left and right of the ventral aorta in the adult | custom | `#D9548A` |
| ZFA:0001346 | interrenal primordium | pronephros (ZFA:0000151) | Segmentation:20-25 somites (19-22 hpf) | Larval:Protruding-mouth (72-96 hpf) | 19.0 | 0.3-0.32; bilateral at 22 to 27 hpf; single cluster slightly right of the midline from 24 to 30 hpf; between the dorsal aorta and the right posterior cardinal vein by 28 hpf | sphere | `#E0A83C` |
| ZFA:0001345 | interrenal gland | head kidney (ZFA:0000669) | Larval:Protruding-mouth (72-96 hpf) | Adult (2160-17520 hpf) | 72.0 | 0.3-0.32; single tissue slightly right of the midline; bilobed in the adult, lateral to the notochord | ellipsoid | `#D4922A` |
| ZFA:0001200 | corpuscles of Stannius | pronephros (ZFA:0000151) | Segmentation:20-25 somites (19-22 hpf) | Adult (2160-17520 hpf) | 50 | 0.44-0.47; paired, one on each duct (occasionally fused) | sphere | `#C15A9A` |
| ZFA:0001448 | ultimobranchial body | endocrine system (ZFA:0001158) | Hatching:Pec-fin (60-72 hpf) | Adult (2160-17520 hpf) | 168 | 0.22-0.24; midline (paired origin from caudal pharyngeal pouches; described as a single midline organ in the adult) | sphere | `#6FA8D6` |

### 3.4 Reproductive system

| ZFA id | Name | Parent (part_of) | ZFIN start | ZFIN end | Visible from (hpf) | Position (AP fraction; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0009288 | primordial germ cell | reproductive system (ZFA:0000632) | Blastula:Sphere (4-4.33 hpf) | Unknown (0-17520 hpf) | 4.0 | 0.4-0.46; two bilateral clusters | custom | `#EE6FA0` |
| ZFA:0001262 | gonad primordium | reproductive system (ZFA:0000632) | Unknown (0-17520 hpf) | Larval:Days 7-13 (168-336 hpf) | 120 | 0.36-0.44; paired rods left and right of the dorsal mesentery | ellipsoid | `#F29BB6` |
| ZFA:0005272 | immature gonad | reproductive system (ZFA:0000632) | Larval:Days 14-20 (336-504 hpf) | Larval:Days 21-29 (504-720 hpf) | 336.0 | 0.33-0.5; paired | ellipsoid | `#F0A5C0` |
| ZFA:0000413 | gonad | reproductive system (ZFA:0000632) | Larval:Days 21-29 (504-720 hpf) | Adult (2160-17520 hpf) | 504.0 | 0.28-0.55; paired | custom | `#E8A0B5` |
| ZFA:0000403 | ovary | gonad (ZFA:0000413) | Larval:Days 21-29 (504-720 hpf) | Adult (2160-17520 hpf) | 504.0 | 0.28-0.55; bilobed, paired lobes joined caudally; suspended by the mesovarium | ellipsoid | `#F4B6C8` |
| ZFA:0000598 | testis | gonad (ZFA:0000413) | Larval:Days 21-29 (504-720 hpf) | Adult (2160-17520 hpf) | 504.0 | 0.3-0.55; paired, positioned laterally | tube | `#DDE3EC` |
| ZFA:0001118 | urogenital papilla | reproductive system (ZFA:0000632) | Larval:Day 6 (144-168 hpf) | Adult (2160-17520 hpf) | 144.0 | 0.57-0.585; midline | custom | `#C9A0DC` |

## 4. Deviations from ZFIN stages

No entry changes a ZFIN start or end stage. The JSON keeps the ZFIN stages as the source of truth. Where a structure becomes visible at a different time, the entry adds `visibleFromHpf`:

- mouth (ZFA:0000547): ZFIN start Unknown (0-17520 hpf); draw from 60 hpf. ZFIN gives an unknown start stage. The mouth opens at about 60 hpf in a ventral position and reaches its anterior terminal position by 72 hpf (Protruding-mouth stage).
- vent (ZFA:0000298): ZFIN start Pharyngula:Prim-5 (24-30 hpf); draw from 120 hpf. ZFIN starts the vent at Prim-5 (24 hpf) because it develops from the proctodeum. The opening only becomes patent at about 120 hpf.
- gall bladder (ZFA:0000208): ZFIN start Hatching:Long-pec (48-60 hpf); draw from 72 hpf. ZFIN starts the gall bladder at Long-pec (48 hpf). It becomes easy to see as a green sac from about 3 dpf, after bile pigment accumulates.
- endocrine pancreas (ZFA:0001260): ZFIN start Hatching:Long-pec (48-60 hpf); draw from 24 hpf. ZFIN starts the endocrine pancreas at Long-pec (48 hpf). The principal islet is already a compact cluster at 24 hpf (posterior pancreatic bud term).
- kidney (ZFA:0000529): ZFIN start Larval:Day 5 (120-144 hpf); draw from 288 hpf. ZFIN starts the kidney (mesonephros) at Day 5 (120 hpf) when nephron progenitors appear. The first mesonephric nephron forms at 12 to 14 dpf ventral to the sixth myotome.
- head kidney (ZFA:0000669): ZFIN start Unknown (0-17520 hpf); draw from 720 hpf. ZFIN gives an unknown start stage. The head region becomes distinct at the 9 mm stage (about 30 dpf).
- posterior kidney (ZFA:0001293): ZFIN start Larval:Day 6 (144-168 hpf); draw from 336 hpf. ZFIN starts the posterior kidney at Day 6 (144 hpf). The first mesonephric nephrons of the trunk appear at 12 to 14 dpf.
- mesonephric duct (ZFA:0000546): ZFIN start Unknown (0-17520 hpf); draw from 336 hpf. ZFIN gives an unknown start stage. The mesonephric duct is the pronephric duct that persists after 14 dpf.
- thyroid primordium (ZFA:0001081): ZFIN start Pharyngula:Prim-15 (30-36 hpf); draw from 24 hpf. ZFIN starts the primordium at Prim-15 (30 hpf). nkx2.4b-positive thyroid cells are present in the pharyngeal floor at 24 hpf and pax2a-positive precursors from 18 to 22 hpf.
- corpuscles of Stannius (ZFA:0001200): ZFIN start Segmentation:20-25 somites (19-22 hpf); draw from 50 hpf. ZFIN starts the term at 20-25 somites (19 hpf). stc1-positive cells appear in the tubule at 24 hpf and bulge from it at 32 hpf. They form discrete glands on top of the tubules by 50 hpf.
- ultimobranchial body (ZFA:0001448): ZFIN start Hatching:Pec-fin (60-72 hpf); draw from 168 hpf. ZFIN starts the ultimobranchial body at Pec-fin (60 hpf). calca-positive C cells are documented from 7 dpf; the location is documented at 10 dpf.
- gonad primordium (ZFA:0001262): ZFIN start Unknown (0-17520 hpf); draw from 120 hpf. ZFIN gives an unknown start stage. Somatic gonad cells surround germ cells from 5 dpf; germ cells alone mark the region from 24 hpf.

Entries with a ZFIN end stage of Unknown: primordial germ cell (ZFA:0009288). The JSON sets its `endHpf` to 17520 and marks this in `endNote`. Entries with a ZFIN start stage of Unknown: mouth (ZFA:0000547), head kidney (ZFA:0000669), mesonephric duct (ZFA:0000546), gonad primordium (ZFA:0001262). The JSON sets their `startHpf` to 0.0 and marks this in `startNote`.

## 5. Per-structure notes

### Digestive system

#### gut (ZFA:0000112)

- Synonyms: alimentary canal, enteric tract, gut tube
- ZFA definition: The alimentary or digestive tract, and associated organs.
- ZFIN stages: Segmentation:10-13 somites (14-16 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.12 to 0.58 of body length. Dorsoventral: ventral to the notochord and dorsal aorta; dorsal to the yolk and later to the pericardium. Laterality: midline, loops left at the foregut. Landmarks: group node: pharynx to vent. Anus lies at the posterior end of the yolk extension at about 0.55 to 0.58 of body length in the larva.
- Shape: custom. Group node only. Draw no geometry. Children carry the tubes.
- Notes: ZFA treats gut as an anatomical group that holds the esophagus, intestine, cloaca and proctodeum. Use it as the parent node in the UI and give it no mesh of its own. The 52 hpf and 74 to 76 hpf events come from a 2025 review that cites Ng et al. 2005 and Wallace et al. 2005.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 1000, diameter 25 endodermal rod from the pharynx to the proctodeum | (estimate) |
| Long-pec | 48 | length 1300, diameter 40 | (estimate) |
| Day 5 | 120 | length 1700, diameter 90 mouth to vent, straight-line path | (estimate) |
| Adult | 2160 | length 40000, diameter 1500 folded intestine in a 25 mm SL fish | (estimate) |

Events:
- 14 hpf: digestive system and gut terms begin in ZFIN (10-13 somites)
- 19 hpf: endoderm forms a continuous rod along the midline (intestinal rod)
- 26 hpf: gut endoderm lies as a thin layer dorsal to the yolk
- 52 hpf: gut tube extends from the prospective mouth to the anus; liver, pancreas and swim bladder buds visible
- 75 hpf: single continuous lumen from mouth to anus; anus still closed
- 120 hpf: cloaca opens; larvae start to feed at 5 to 7 dpf

Sources: https://zfin.org/ZFA:0000112; https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/; https://pubmed.ncbi.nlm.nih.gov/16125164/; https://pubmed.ncbi.nlm.nih.gov/15652704/

#### intestinal rod (ZFA:0005737)

- Synonyms: endodermal rod, intestinal anlage
- ZFA definition: Multicellular structure composed of endodermal cells that forms a continuous rod along the anterior-posterior axis of the embryo in contact with the YSL.  This rod will give rise to the endodermal components of the alimentary canal and its connected organs: liver, gall bladder pancreas and swim bladder. Does not have part pharyngeal endoderm.
- ZFIN stages: Segmentation:20-25 somites (19-22 hpf) to Pharyngula:High-pec (42-48 hpf).
- Position: AP 0.25 to 0.56 of body length. Dorsoventral: ventral to the notochord; directly on the yolk syncytial layer. Laterality: midline; the foregut segment bends left between 26 and 30 hpf. Landmarks: from the posterior pharynx (somite 1 level) to the proctodeum below somite 17 to 18
- Shape: tube. Solid rod (no lumen) along a spline that follows the dorsal surface of the yolk ball and yolk extension. Add a leftward kink under somites 1 to 3 from 26 hpf.
- Notes: The rod gives rise to the endodermal parts of the alimentary canal, liver, gall bladder, pancreas and swim bladder. The pharyngeal endoderm is not part of it. Use this term for the gut between 19 and 48 hpf and switch to intestine, intestinal bulb, mid intestine and posterior intestine afterwards.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| 20-25 somites | 21 | length 800, diameter 20 | (estimate) |
| Prim-5 | 24 | length 1000, diameter 25 rod is two to three cells wide | (estimate) |
| Long-pec | 48 | length 1300, diameter 40 replaced by the intestine terms at 48 hpf | (estimate) |

Events:
- 19 hpf: intestinal rod term starts in ZFIN (20-25 somites)
- 24 hpf: endoderm cells caudal to the pharynx have aggregated into the rod
- 28 hpf: rod segment under somite 1 thickens; liver morphogenesis begins
- 30 hpf: foregut portion loops to the left (26 to 30 hpf)
- 48 hpf: ZFIN end stage High-pec; the rod is now the intestine

Sources: https://zfin.org/ZFA:0005737; https://zfin.org/ZDB-PUB-030325-1; http://www.cas.zju.edu.cn/_upload/article/files/71/46/73e0e645441480db54b7de893f91/374ffd61-efc8-499e-979a-b5043a68c280.pdf; https://pubmed.ncbi.nlm.nih.gov/16125164/

#### intestinal bulb primordium (ZFA:0005738)

- Synonyms: none
- ZFA definition: Portion of the intestinal rod that loops to left between 26-30hpf and gives rise to the intestinal bulb and liver and anterior pancreatic primordium.  The endoderm at this stage is a compact mass of cells with little to no polarization.
- ZFIN stages: Pharyngula:Prim-5 (24-30 hpf) to Pharyngula:High-pec (42-48 hpf).
- Position: AP 0.25 to 0.32 of body length. Dorsoventral: ventral to the notochord at somites 1 to 3; dorsal to the yolk. Laterality: bends to the left of the midline between 26 and 30 hpf. Landmarks: under somites 1 to 3, posterior to the pharynx, anterior to the yolk ball apex
- Shape: tube. Thickened anterior part of the intestinal rod. Model as a wider tube segment that bows left. The liver primordium buds from its left face and the anterior pancreatic bud from its ventral face.
- Notes: ZFA notes that the primordium is a compact mass of endoderm cells with little polarisation. It is the source of the intestinal bulb, the liver and the anterior pancreatic bud.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 150, diameter 40 | (estimate) |
| Long-pec | 48 | length 200, diameter 60 ZFIN end stage High-pec | (estimate) |

Events:
- 24 hpf: term starts in ZFIN (Prim-5)
- 28 hpf: thickens under somite 1; liver bud appears on the left
- 30 hpf: loops left; left bend complete by about 34 hpf
- 36 hpf: anterior (ventral) pancreatic bud arises from its ventral ridge
- 48 hpf: becomes the intestinal bulb

Sources: https://zfin.org/ZFA:0005738; https://zfin.org/ZDB-PUB-030325-1; http://www.cas.zju.edu.cn/_upload/article/files/71/46/73e0e645441480db54b7de893f91/374ffd61-efc8-499e-979a-b5043a68c280.pdf

#### pharynx (ZFA:0000056)

- Synonyms: none
- ZFA definition: Swollen region of the anterior foregut, posterior to the mouth and anterior to the liver; its walls form the jaws and gills.
- ZFIN stages: Segmentation:10-13 somites (14-16 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.08 to 0.25 of body length. Dorsoventral: ventral to the hindbrain and notochord; dorsal to the heart. Laterality: midline. Landmarks: from the mouth to the esophagus; pharyngeal pouches 1 to 6 open into it; the teeth sit on ceratobranchial 5 at its posterior end
- Shape: tube. Flattened tube, wider than tall, from the mouth to the esophagus. Add paired lateral slits (pouches) from 48 hpf. In the adult it is a wide chamber under the gill arches.
- Notes: ZFA defines the pharynx as the swollen anterior foregut between the mouth and the liver whose walls form the jaws and gills. The teeth term (ceratobranchial 5 tooth) is a part of the pharynx. The skeletal and respiratory specialists cover arches and gills.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 300, width 60, height 30 | (estimate) |
| Long-pec | 48 | length 350, width 90, height 40 | (estimate) |
| Day 5 | 120 | length 450, width 150, height 60 | (estimate) |
| Adult | 2160 | length 4500, width 3000, height 1500 | (estimate) |

Events:
- 14 hpf: pharyngeal endoderm present (10-13 somites)
- 48 hpf: pharyngeal pouches 2 to 6 have formed; small open mouth located between the eyes
- 72 hpf: mouth protrudes anterior to the eye; pharynx connects mouth to esophagus
- 120 hpf: gill filaments and teeth in place; feeding begins

Sources: https://zfin.org/ZFA:0000056; https://zfin.org/zf_info/zfbook/stages/hatch.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/

#### mouth (ZFA:0000547)

- Synonyms: none
- ZFA definition: No definition in ZFA.
- ZFIN stages: Unknown (0-17520 hpf) to Adult (2160-17520 hpf).
- Position: AP 0 to 0.03 of body length. Dorsoventral: ventral between the eyes at 48 to 60 hpf; terminal at the snout tip from 72 hpf. Laterality: midline. Landmarks: anterior tip of the head; below the eyes before 72 hpf
- Shape: custom. Elliptical opening on the head mesh. Animate its position from mid-ventral (below the eyes) at 60 hpf to the snout tip at 72 hpf. Use a boolean cut or a dark disc.
- Notes: Kimmel et al. 1995 describe the repositioning of the mouth during the last 12 hours of the hatching period. The ZFA start stage is unknown, so the model should use visibleFromHpf.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Long-pec | 48 | width 30, height 15 small opening between the eyes, seen only with Nomarski optics | (estimate) |
| Pec-fin | 60 | width 50, height 30 small ventral opening | (estimate) |
| Protruding-mouth | 72 | width 80, height 50 | (estimate) |
| Day 5 | 120 | width 150, height 80 | (estimate) |
| Adult | 2160 | width 2500, height 1500 | (estimate) |

Events:
- 19 hpf: stomodeum (ectodermal invagination) forms at 20-25 somites
- 48 hpf: small open mouth visible with Nomarski optics between the eyes
- 60 hpf: mouth opens in a ventral position
- 72 hpf: mouth protrudes beyond the eye and gapes open
- 96 hpf: anterior-dorsal protrusion continues during day 4

Sources: https://zfin.org/ZFA:0000547; https://zfin.org/zf_info/zfbook/stages/hatch.html; https://zfin.org/zf_info/zfbook/stages/larval.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC10945834/

#### esophagus (ZFA:0000204)

- Synonyms: oesophagus
- ZFA definition: Esophagus part of the gut that develops from endodermal precursors at the rostral end of the digestive tract.  The esophagus develops independently from the intestine.
- ZFIN stages: Pharyngula:Prim-15 (30-36 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.22 to 0.27 of body length. Dorsoventral: dorsal to the pericardium and sinus venosus; ventral to the notochord. Laterality: midline. Landmarks: short tube between the posterior pharynx and the intestinal bulb; the swim bladder pneumatic duct leaves its dorsal wall; the liver lies ventral and left of its posterior end
- Shape: tube. Short narrow tube. Keep the lumen closed before 72 hpf. Wall thicker than the intestine (striated muscle).
- Notes: ZFA states that the esophagus develops from endodermal precursors at the rostral end of the digestive tract, independently of the intestine. The 5 dpf and 7 dpf epithelium statements come from the 2025 gut review.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-15 | 30 | length 40, diameter 20 | (estimate) |
| Long-pec | 48 | length 80, diameter 25 | (estimate) |
| Day 5 | 120 | length 130, diameter 40 | (estimate) |
| Adult | 2160 | length 2000, diameter 1000 | (estimate) |

Events:
- 30 hpf: esophagus term starts in ZFIN (Prim-15); it develops separately from the intestine
- 52 hpf: gut tube continuous from mouth to anus
- 75 hpf: lumen continuous with the pharynx and intestinal bulb
- 120 hpf: esophageal epithelium detectable as a distinct region
- 168 hpf: epithelium begins to stratify into four cell layers

Sources: https://zfin.org/ZFA:0000204; https://pubmed.ncbi.nlm.nih.gov/15652704/; https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/

#### intestine (ZFA:0001338)

- Synonyms: none
- ZFA definition: Folded tube that has parts intestinal bulb, mid intestine and posterior intestine.  The intestine is where digestion and nutrient absorption occurs.
- ZFIN stages: Pharyngula:Prim-15 (30-36 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.27 to 0.57 of body length. Dorsoventral: ventral to the swim bladder, pronephric ducts and dorsal aorta; dorsal to the yolk extension in the larva. Laterality: midline, with the bulb offset to the left in the larva. Landmarks: from the esophagus to the cloaca; folds into three loops in the adult coelom
- Shape: custom. Group node for intestinal bulb, mid intestine and posterior intestine. Use one spline for the whole intestine and let the children own segments of it.
- Notes: ZFA defines the intestine as a folded tube with parts intestinal bulb, mid intestine and posterior intestine. Alvers et al. 2014 report that single lumens form by 68 hpf. Li et al. 2020 describe the larval to juvenile looping and growth.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-15 | 30 | length 900, diameter 30 | (estimate) |
| Long-pec | 48 | length 1200, diameter 40 | (estimate) |
| Day 5 | 120 | length 1400, diameter 90 bulb diameter about 100; posterior segment about 40 | (estimate) |
| Adult | 2160 | length 35000, diameter 1500 three folded segments in a 25 mm SL fish | (estimate) |

Events:
- 30 hpf: intestine term starts in ZFIN (Prim-15)
- 48 hpf: multiple small lumens form between cells
- 68 hpf: all embryos show a single lumen
- 98 hpf: epithelial folding begins in the intestinal bulb; three regions distinguishable between 98 and 126 hpf
- 504 hpf: a loop forms midway along the intestine between 20 and 22 dpf; length doubles between 19 and 26 dpf
- 792 hpf: adult pattern of epithelial turnover begins at about 33 dpf

Sources: https://zfin.org/ZFA:0001338; https://pmc.ncbi.nlm.nih.gov/articles/PMC3929411/; https://pmc.ncbi.nlm.nih.gov/articles/PMC8432741/; https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2996925/

#### intestinal bulb (ZFA:0001076)

- Synonyms: anterior intestine, foregut, pseudogaster
- ZFA definition: The bulbous anteriormost portion of the intestine has the most digestive enzymes and the greatest epithelial surface area.
- ZFIN stages: Pharyngula:High-pec (42-48 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.27 to 0.4 of body length. Dorsoventral: ventral to the swim bladder; dorsal and right of the liver; the pancreas head lies on its dorsal-right side. Laterality: left of the midline in the larva. Landmarks: immediately posterior to the esophagus; widest part of the gut; the hepatopancreatic duct enters its ventral wall
- Shape: tube. Tube with a large radius that tapers into the mid intestine. Give it the widest lumen of the tract. In the adult the rostral bulb is the first descending loop.
- Notes: Synonyms in ZFA include anterior intestine and foregut. The zebrafish has no stomach; the bulb stores food. Wang et al. 2010 name the adult segment the rostral intestinal bulb.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| High-pec | 42 | length 200, diameter 50 | (estimate) |
| Long-pec | 48 | length 250, diameter 60 | (estimate) |
| Day 5 | 120 | length 400, diameter 100 | (estimate) |
| Adult | 2160 | length 12000, diameter 2000 | (estimate) |

Events:
- 42 hpf: intestinal bulb term starts in ZFIN (High-pec)
- 58 hpf: two enlarged lumens side by side in the bulb, then fusion
- 98 hpf: folding of the bulb epithelium begins
- 120 hpf: the bulb holds the most digestive enzymes and the largest epithelial surface

Sources: https://zfin.org/ZFA:0001076; https://pmc.ncbi.nlm.nih.gov/articles/PMC3929411/; https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2996925/

#### mid intestine (ZFA:0001323)

- Synonyms: none
- ZFA definition: The terminal region of the mid intestine is comprised of specialized enterocytes that appear to play a role in mucosal immunity.  The mid intestine also appears to be involved in iron absorption.
- ZFIN stages: Pharyngula:Prim-15 (30-36 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.4 to 0.5 of body length. Dorsoventral: dorsal to the yolk extension in the larva; ventral to the pronephric ducts. Laterality: midline. Landmarks: between the intestinal bulb and the posterior intestine; the pancreas tail runs along its right side
- Shape: tube. Medium radius tube. In the adult this is the second loop of the folded intestine.
- Notes: ZFA notes that the posterior end of the mid intestine holds enterocytes with a role in mucosal immunity and iron uptake.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-15 | 30 | length 300, diameter 25 | (estimate) |
| Long-pec | 48 | length 400, diameter 35 | (estimate) |
| Day 5 | 120 | length 500, diameter 60 | (estimate) |
| Adult | 2160 | length 12000, diameter 1500 | (estimate) |

Events:
- 30 hpf: mid intestine term starts in ZFIN (Prim-15)
- 100 hpf: goblet cells appear in the mid intestine
- 120 hpf: specialised enterocytes at its posterior end take up macromolecules

Sources: https://zfin.org/ZFA:0001323; https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/; https://pubmed.ncbi.nlm.nih.gov/15652704/

#### posterior intestine (ZFA:0000706)

- Synonyms: none
- ZFA definition: The posterior intestine has short longitudinally arranged epithelial folds which are similar to the colon of higher vertebrates.
- ZFIN stages: Pharyngula:Prim-15 (30-36 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.5 to 0.57 of body length. Dorsoventral: ventral to the pronephric ducts; dorsal to the ventral fin fold. Laterality: midline. Landmarks: from the end of the yolk extension to the cloaca
- Shape: tube. Narrow straight tube that ends at the cloaca. In the adult this is the third, caudal loop.
- Notes: ZFA describes short longitudinal epithelial folds similar to the colon. Wang et al. 2010 show that the adult caudal segments share expression features with the mammalian large intestine.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-15 | 30 | length 200, diameter 20 | (estimate) |
| Long-pec | 48 | length 250, diameter 30 | (estimate) |
| Day 5 | 120 | length 250, diameter 40 | (estimate) |
| Adult | 2160 | length 10000, diameter 1200 | (estimate) |

Events:
- 30 hpf: posterior intestine term starts in ZFIN (Prim-15)
- 48 hpf: hindgut inserts into the cloaca
- 52 hpf: first enteroendocrine cells appear in the posterior intestine
- 120 hpf: cloaca opens; the segment resembles the colon of other vertebrates

Sources: https://zfin.org/ZFA:0000706; https://pmc.ncbi.nlm.nih.gov/articles/PMC10050536/; https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2996925/

#### cloaca (ZFA:0005781)

- Synonyms: none
- ZFA definition: Part of the gut where the pronephric tubules come together with the caudal end of the intestine attaching at 4dpf.  The oviduct or sperm duct connect later.
- ZFIN stages: Pharyngula:Prim-5 (24-30 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.56 to 0.58 of body length. Dorsoventral: ventral body wall at the posterior end of the yolk extension. Laterality: midline. Landmarks: where the two pronephric ducts and the posterior intestine meet; the vent opens on the ventral surface just anterior to the anal fin fold
- Shape: sphere. Small chamber at the end of the gut spline. Attach the two pronephric duct splines here. Open the vent (dark disc) at 120 hpf.
- Notes: The ZFA definition places the intestinal attachment at 4 dpf. A 2023 review places the hindgut insertion at 48 hpf and the opening at about 120 hpf. Both agree that excretion starts at about 5 dpf.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 25 | (estimate) |
| Long-pec | 48 | diameter 35 | (estimate) |
| Day 5 | 120 | diameter 45 | (estimate) |
| Adult | 2160 | diameter 800 | (estimate) |

Events:
- 24 hpf: cloaca term starts in ZFIN (Prim-5); pronephric ducts fuse at the cloaca at 24 to 30 hpf
- 48 hpf: hindgut inserts into the cloaca
- 96 hpf: intestine attaches to the cloaca at 4 dpf (ZFA definition)
- 120 hpf: cloaca opens for excretion
- 2160 hpf: oviduct or sperm duct connect in the adult

Sources: https://zfin.org/ZFA:0005781; https://pmc.ncbi.nlm.nih.gov/articles/PMC10050536/; https://pmc.ncbi.nlm.nih.gov/articles/PMC8424172/

#### proctodeum (ZFA:0000066)

- Synonyms: anus
- ZFA definition: An inward fold on the surface of the embryonic ectoderm that develops into part of the anal passage.
- ZFIN stages: Segmentation:26+ somites (22-24 hpf) to Pharyngula:Prim-5 (24-30 hpf).
- Position: AP 0.56 to 0.57 of body length. Dorsoventral: ventral surface. Laterality: midline. Landmarks: shallow ectodermal pit at the posterior end of the yolk extension, below somite 17 to 18
- Shape: custom. Small surface dimple. Show it only from 22 to 30 hpf, then hand over to the vent.
- Notes: ZFA lists anus as a synonym of proctodeum. The vent term continues from 24 hpf to adult.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| 26+ somites | 22 | diameter 20, depth 10 | (estimate) |
| Prim-5 | 24 | diameter 25, depth 15 | (estimate) |

Events:
- 22 hpf: proctodeum term starts in ZFIN (26+ somites)
- 30 hpf: ZFIN end stage Prim-5; the vent develops from it

Sources: https://zfin.org/ZFA:0000066

#### vent (ZFA:0000298)

- Synonyms: cloacal opening, cloacal vent
- ZFA definition: Is a surface structure and is the external opening of the cloaca.
- ZFIN stages: Pharyngula:Prim-5 (24-30 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.565 to 0.575 of body length. Dorsoventral: ventral surface. Laterality: midline. Landmarks: just anterior to the anal fin (fold); posterior to the yolk extension; anterior to the urogenital papilla in the adult
- Shape: custom. Dark elliptical disc on the ventral body surface. Scale with body length.
- Notes: ZFA synonyms: cloacal opening, cloacal vent. Parichy et al. 2009 use the vent as a landmark for fin fold loss.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 20 | (estimate) |
| Long-pec | 48 | diameter 30 | (estimate) |
| Day 5 | 120 | diameter 40 | (estimate) |
| Adult | 2160 | diameter 700 | (estimate) |

Events:
- 24 hpf: vent term starts in ZFIN (Prim-5)
- 120 hpf: cloaca opens for excretion
- 720 hpf: the last fin fold remnant persists at the anterior margin of the vent at about 10 mm SL

Sources: https://zfin.org/ZFA:0000298; https://pmc.ncbi.nlm.nih.gov/articles/PMC10050536/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### liver primordium (ZFA:0000124)

- Synonyms: liver bud
- ZFA definition: Embryonic primordium that develops into the liver.
- ZFIN stages: Pharyngula:Prim-5 (24-30 hpf) to Pharyngula:Prim-5 (24-30 hpf).
- Position: AP 0.26 to 0.29 of body length. Dorsoventral: ventral to the notochord at somite 1; dorsal to the yolk. Laterality: left; the primordium is the leftward thickening of the foregut. Landmarks: under somite 1, posterior to the heart and pharynx, anterior-dorsal to the yolk ball
- Shape: ellipsoid. Small ellipsoid attached to the left face of the intestinal bulb primordium. Grow it from 28 to 30 hpf.
- Notes: Field et al. 2003 split liver budding (24 to 50 hpf) into three stages. The primordium term covers only the first hours. Synonym: liver bud.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 40, width 30, height 30 budding stage I: aggregating hepatocytes | (estimate) |
| Prim-5 late | 28 | length 60, width 40, height 40 thickening under somite 1 | (estimate) |

Events:
- 24 hpf: liver primordium term starts and ends in ZFIN (Prim-5); hepatoblasts aggregate shortly after 24 hpf
- 28 hpf: endoderm under somite 1 thickens (budding stage II)
- 30 hpf: primordium bends to the left; the liver term takes over

Sources: https://zfin.org/ZFA:0000124; https://zfin.org/ZDB-PUB-030325-1; http://www.cas.zju.edu.cn/_upload/article/files/71/46/73e0e645441480db54b7de893f91/374ffd61-efc8-499e-979a-b5043a68c280.pdf

#### liver (ZFA:0000123)

- Synonyms: none
- ZFA definition: Solid compound organ with three lobes that has many functions including bile production, blood detoxification, the production of critical plasma proteins and clotting factors, complement proteins  and the storage of many substances, such as lipids, amino acids, iron, and glycogen. Female fish produce vitellogenins in the liver.
- ZFIN stages: Pharyngula:Prim-15 (30-36 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.24 to 0.36 of body length. Dorsoventral: ventral to the esophagus and swim bladder; dorsal to the pericardium and yolk. Laterality: left of the midline until 80 hpf; crosses the midline to the right at 80 to 84 hpf; three lobes in the adult. Landmarks: posterior to the heart, anterior to the intestinal bulb; the gall bladder sits on the right lobe
- Shape: ellipsoid. One ellipsoid on the left of the foregut until 72 hpf. From 80 hpf add a second ellipsoid on the right (gall bladder lobe). From 15 dpf add a flat ventral lobe along the intestine. In the adult use three lobes that wrap the intestinal loops.
- Notes: ZFA defines the liver as a solid compound organ with three lobes. Korzh et al. 2008 give the lobe timeline and the sinusoid and hepatocyte diameters. The adult dimensions are estimates for a 25 mm SL fish; Gupta and Mullins 2010 describe the adult liver as large, lobed and tan.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 40, width 30, height 30 primordium only | (estimate) |
| Long-pec | 48 | length 100, width 60, height 60 compact bud; hepatic duct present at 50 hpf | (estimate) |
| Protruding-mouth | 72 | length 150, width 80, height 80 | (estimate) |
| Day 5 | 120 | length 250, width 170, height 120 blood flow detected 70 um deep in both lobes; hepatocytes 10 to 14 um; sinusoids 12 to 16 um | (estimate) |
| Adult | 2160 | length 5000, width 3000, height 2000 three lobes along the intestinal loops | (estimate) |

Events:
- 28 hpf: budding begins under somite 1
- 30 hpf: liver term starts in ZFIN (Prim-15); the anlage protrudes from the rod on the left
- 34 hpf: leftward bend complete
- 46 hpf: differentiated hepatocytes first detected (44 to 48 hpf)
- 50 hpf: hepatic duct forms; end of budding, start of growth
- 56 hpf: endothelial cells surround the bud (55 to 58 hpf)
- 72 hpf: hepatic blood circulation starts; the liver expands beyond somite 1
- 82 hpf: liver crosses the midline ventral to the esophagus; right lobe forms (80 to 84 hpf)
- 120 hpf: vascular network almost complete; hepatic portal vein formed
- 360 hpf: ventral (third) lobe starts to expand posteriorly at about 15 dpf

Sources: https://zfin.org/ZFA:0000123; https://zfin.org/ZDB-PUB-030325-1; http://www.cas.zju.edu.cn/_upload/article/files/71/46/73e0e645441480db54b7de893f91/374ffd61-efc8-499e-979a-b5043a68c280.pdf; https://pmc.ncbi.nlm.nih.gov/articles/PMC2564926/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/; https://journals.sagepub.com/doi/10.1177/0192623311409597

#### gall bladder (ZFA:0000208)

- Synonyms: none
- ZFA definition: The compound organ that stores bile.
- ZFIN stages: Hatching:Long-pec (48-60 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.3 to 0.33 of body length. Dorsoventral: ventral to the intestinal bulb. Laterality: right; adjacent to the right liver lobe. Landmarks: between the right liver lobe and the intestinal bulb; the cystic duct joins the common bile duct
- Shape: sphere. Green translucent sphere on the right side of the foregut. Scale with the liver.
- Notes: ZFA names the right liver lobe the gall bladder lobe. In the adult the gall bladder is a green translucent fluid-filled sac in the viscera.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Long-pec | 48 | diameter 25 | (estimate) |
| Protruding-mouth | 72 | diameter 40 | (estimate) |
| Day 5 | 120 | diameter 70 | (estimate) |
| Adult | 2160 | diameter 1200 | (estimate) |

Events:
- 48 hpf: gall bladder term starts in ZFIN (Long-pec)
- 60 hpf: biliary cells differentiate (50 to 70 hpf)
- 72 hpf: cystic duct and common bile duct terms start in ZFIN (Protruding-mouth)
- 120 hpf: bile stored and released; larva feeds

Sources: https://zfin.org/ZFA:0000208; https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2564926/

#### posterior pancreatic bud (ZFA:0001370)

- Synonyms: caudal anlage, dorsal pancreatic anlage, dorsal posterior bud
- ZFA definition: Pancreatic bud that forms dorsal and adjacent to the developing intestine.
- ZFIN stages: Pharyngula:Prim-5 (24-30 hpf) to Hatching:Long-pec (48-60 hpf).
- Position: AP 0.3 to 0.33 of body length. Dorsoventral: dorsal to the intestinal rod; between the dorsal aorta and the posterior cardinal vein. Laterality: right of the midline. Landmarks: posterior to the liver primordium, at the level of somites 3 to 4
- Shape: sphere. Sphere of endocrine cells on the dorsal-right face of the gut rod. It becomes the principal islet.
- Notes: ZFA synonyms: dorsal pancreatic anlage, dorsal posterior bud, caudal anlage. Hesselson et al. 2009 state that the principal islet beta cells coalesce into the dorsal bud by 24 hpf. The 36 hpf cell count is from a 2015 Scientific Reports paper on pdx1 mutants.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 35 islet coalesces by 24 hpf | (estimate) |
| Prim-25 | 36 | diameter 45 about 46 hormone-positive cells at 36 hpf | (estimate) |
| Long-pec | 48 | diameter 50 ZFIN end stage Long-pec | (estimate) |

Events:
- 14 hpf: pancreas primordium term starts in ZFIN (10-13 somites)
- 24 hpf: posterior pancreatic bud term starts; endocrine cells coalesce into the dorsal bud
- 40 hpf: anterior bud appears ventrally and grows toward it
- 52 hpf: the two buds fuse; the dorsal bud becomes the principal islet
- 60 hpf: ZFIN end stage Long-pec

Sources: https://zfin.org/ZFA:0001370; https://pubmed.ncbi.nlm.nih.gov/12941629/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2736433/; https://www.nature.com/articles/srep14241

#### anterior pancreatic bud (ZFA:0001369)

- Synonyms: exocrine anlage, rostral anlage, ventral anterior bud, ventral pancreatic anlage
- ZFA definition: Pancreatic bud that develops from a ridge on the ventral side of the intestinal bulb primordium.
- ZFIN stages: Pharyngula:Prim-25 (36-42 hpf) to Hatching:Pec-fin (60-72 hpf).
- Position: AP 0.29 to 0.32 of body length. Dorsoventral: ventral to the intestinal bulb primordium. Laterality: left-ventral, then grows dorsally and to the right to meet the posterior bud. Landmarks: ventral ridge of the intestinal bulb primordium, next to the liver bud
- Shape: ellipsoid. Small ellipsoid on the ventral face of the foregut that elongates toward the posterior bud between 40 and 52 hpf.
- Notes: ZFA synonyms: ventral pancreatic anlage, exocrine anlage, rostral anlage. This bud gives rise to the exocrine tissue, the pancreatic duct and later the secondary islets.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-25 | 36 | length 30, diameter 25 | (estimate) |
| Long-pec | 48 | length 80, diameter 40 | (estimate) |
| Pec-fin | 60 | length 120, diameter 50 ZFIN end stage Pec-fin | (estimate) |

Events:
- 36 hpf: anterior pancreatic bud term starts in ZFIN (Prim-25)
- 40 hpf: bud visible on the ventral foregut
- 52 hpf: fuses with the posterior bud
- 72 hpf: ZFIN end stage Pec-fin; exocrine pancreas and ducts derive from it

Sources: https://zfin.org/ZFA:0001369; https://pubmed.ncbi.nlm.nih.gov/12941629/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3026409/

#### pancreas (ZFA:0000140)

- Synonyms: none
- ZFA definition: The pancreas is an organ composed of endocrine and exocrine glandular tissue that produce hormones and digestive enzymes.  Unlike in other studied vertebrates the pancreas in zebrafish develops from two buds, one anterior  and one posterior. In adult fish the main pancreas is located on the right side attached to the lateral aspect of the intestine by the pancreatic duct. Typically, one large islet and 3-6 smaller islets occupy the main pancreas. The tail of the pancreas is embedded with single beta cells or clusters of small islets and extends caudally along the right side of the intestine.
- ZFIN stages: Hatching:Long-pec (48-60 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.3 to 0.45 of body length. Dorsoventral: dorsal and right of the intestinal bulb; the tail runs along the right side of the mid intestine. Laterality: right. Landmarks: head of the pancreas at the intestinal bulb, next to the gall bladder and liver; tail along the intestine toward the swim bladder region
- Shape: custom. Head: ellipsoid on the dorsal-right side of the bulb that holds the principal islet. Tail: thin tapering tube along the right side of the intestine. In the adult use a diffuse ribbon in the mesentery along the intestinal loops.
- Notes: ZFA notes that the zebrafish pancreas forms from two buds. In the adult the main pancreas lies on the right side, attached to the intestine by the pancreatic duct. It holds one large islet and three to six smaller islets. The tail extends caudally along the right side of the intestine.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Long-pec | 48 | length 120, width 60, height 50 fused buds | (estimate) |
| Protruding-mouth | 72 | length 200, width 80, height 60 | (estimate) |
| Day 5 | 120 | length 400, width 110, height 80 head plus tail along the intestine | (estimate) |
| Adult | 2160 | length 8000, width 1500, height 800 diffuse along the intestine; main pancreas on the right | (estimate) |

Events:
- 48 hpf: pancreas term starts in ZFIN (Long-pec)
- 52 hpf: dorsal and ventral buds fuse
- 70 hpf: exocrine pancreas reporter expression starts (67 to 72 hpf)
- 120 hpf: exocrine protease activity present; tail extends caudally
- 168 hpf: secondary islets form at about 7 dpf

Sources: https://zfin.org/ZFA:0000140; https://pubmed.ncbi.nlm.nih.gov/12941629/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2564926/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3026409/

#### endocrine pancreas (ZFA:0001260)

- Synonyms: pancreatic islet, tail pancreas
- ZFA definition: The zebrafish endocrine pancreas is an compound organ component composed of small groups of islet cells that are distributed throughout the exocrine pancreas.  The islet cells produce insulin, glucagon and somatostatin.
- ZFIN stages: Hatching:Long-pec (48-60 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.31 to 0.33 of body length. Dorsoventral: dorsal to the intestinal bulb. Laterality: right of the midline. Landmarks: principal islet in the pancreas head; secondary islets scattered along the tail from 7 dpf
- Shape: sphere. One sphere (principal islet) inside the pancreas head. Add small spheres along the tail after 7 dpf. Adult: one large islet plus three to six smaller islets.
- Notes: ZFA synonyms: pancreatic islet, tail pancreas. The endocrine pancreas is part of both the digestive and endocrine systems in ZFA. Secondary islet timing comes from the ZFA definition of secondary islet.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 35 | (estimate) |
| Long-pec | 48 | diameter 50 | (estimate) |
| Day 5 | 120 | diameter 60 | (estimate) |
| Adult | 2160 | diameter 300 principal islet | (estimate) |

Events:
- 24 hpf: principal islet coalesces (dorsal bud)
- 48 hpf: endocrine pancreas term starts in ZFIN; islet functional by 48 hpf
- 120 hpf: secondary islets can be induced from 5 dpf
- 168 hpf: secondary islets usually form at about 7 dpf

Sources: https://zfin.org/ZFA:0001260; https://zfin.org/ZFA:0005756; https://pmc.ncbi.nlm.nih.gov/articles/PMC2736433/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3026409/

#### exocrine pancreas (ZFA:0001249)

- Synonyms: head pancreas, rostral pancreas
- ZFA definition: The exocrine pancreas is a diffuse organ composed of a branching network of ducts and associated acinar glands that manufacture the proteolytic enzymes and bicarbonate required for digestion.
- ZFIN stages: Hatching:Long-pec (48-60 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.3 to 0.45 of body length. Dorsoventral: dorsal and right of the intestine. Laterality: right. Landmarks: surrounds the principal islet and extends as the pancreas tail along the intestine
- Shape: custom. Pale tissue that wraps the islet sphere and forms the tail ribbon. Same spline as the pancreas node.
- Notes: ZFA synonyms: head pancreas, rostral pancreas. It derives from the anterior (ventral) pancreatic bud.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Long-pec | 48 | length 100, width 50, height 40 | (estimate) |
| Day 5 | 120 | length 380, width 100, height 70 | (estimate) |
| Adult | 2160 | length 8000, width 1500, height 800 | (estimate) |

Events:
- 48 hpf: exocrine pancreas term starts in ZFIN (Long-pec)
- 70 hpf: acinar reporter expression starts (67 to 72 hpf)
- 120 hpf: phospholipase and protease activity present; increases 5 to 6 dpf

Sources: https://zfin.org/ZFA:0001249; https://pmc.ncbi.nlm.nih.gov/articles/PMC2564926/; https://pubmed.ncbi.nlm.nih.gov/12941629/

#### ceratobranchial 5 tooth (ZFA:0000694)

- Synonyms: pharyngeal tooth, teeth, tooth
- ZFA definition: Is a multi-tissue structure composed of dentine, enameloid and tooth pulp. The tips of the ceratobranchial 5 teeth form before the ceratobranchial itself (3.0 mm NL). As they grow ventrally, they meet the perichondrally ossified surface of ceratobranchial 5 and become firmly ankylosed to the bone. Ceratobranchial teeth are the only teeth present in zebrafish and other cypriniforms.
- ZFIN stages: Hatching:Long-pec (48-60 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.2 to 0.24 of body length. Dorsoventral: ventral floor of the posterior pharynx, dorsal to the heart. Laterality: paired, one tooth field on each ceratobranchial 5. Landmarks: on the fifth ceratobranchial (pharyngeal jaw), posterior to the gill arches, at about 450 um from the opercular surface in a 1 month fish
- Shape: custom. Small cones on the medial face of each ceratobranchial 5, pointing dorsally. Start with one cone per side (4V) at 48 hpf, add 3V at 72 hpf and 5V at 96 hpf. Adult: 11 cones per side in three rows (5 ventral, 4 mediodorsal, 2 dorsal).
- Notes: ZFA states that ceratobranchial teeth are the only teeth in zebrafish and that tooth tips form before the bone itself (3.0 mm NL). Van der heyden and Huysseune 2000 give the initiation and replacement dynamics. The 2015 imaging review restates 4V at 48 hpf, replacement at 80 hpf and the 11 teeth per side. The 2.4.5 row formula is from Van der heyden and Huysseune 2000 (unverified here).

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Long-pec | 48 | height 20, diameter 15 early morphogenesis germ of tooth 4V | (estimate) |
| Day 5 | 120 | height 50, diameter 25 three attached teeth per side | (estimate) |
| Adult | 2160 | height 250, diameter 100 11 teeth per side | (estimate) |

Events:
- 48 hpf: first tooth germ (4V) visible; ceratobranchial 5 tooth term starts in ZFIN (Long-pec)
- 72 hpf: tooth 3V starts (ZFIN Protruding-mouth)
- 80 hpf: 4V attaches; first replacement tooth forms at the 4V position
- 96 hpf: tooth 5V present (ZFIN Day 4 start for 5V is Protruding-mouth)
- 384 hpf: ventral tooth row complete at about 16 dpf
- 624 hpf: 22 cycling teeth (11 per side) in fish older than 26 dpf

Sources: https://zfin.org/ZFA:0000694; https://zfin.org/ZFA:0001145; https://zfin.org/ZFA:0001143; https://pubmed.ncbi.nlm.nih.gov/11084648/; https://pmc.ncbi.nlm.nih.gov/articles/PMC4298156/

### Excretory (renal) system

#### pronephros (ZFA:0000151)

- Synonyms: embryonic kidney, pronephric nephron
- ZFA definition: The embryonic kidney, present at the level of the third somite, is composed of two glomeruli fused at the midline, two pronephric tubules, and paired bilateral pronephric ducts that modify the composition of the blood filtrate before delivering it to the cloaca for excretion.
- ZFIN stages: Segmentation:10-13 somites (14-16 hpf) to Larval:Days 7-13 (168-336 hpf).
- Position: AP 0.28 to 0.57 of body length. Dorsoventral: ventral to the somites; dorsal to the gut; glomerulus ventral to the dorsal aorta. Laterality: paired ducts and tubules; glomeruli fused at the midline. Landmarks: glomerulus at somite 3; tubules from somite 3 to 5; ducts from somite 5 to the cloaca at somite 17 to 18
- Shape: custom. Group node: one fused sphere (glomerulus) plus two short tubules that turn into two long ducts running caudally to the cloaca. Keep the two ducts parallel, about 60 to 80 um apart at 24 hpf.
- Notes: ZFA defines the pronephros as two glomeruli fused at the midline, two tubules and paired ducts at the level of the third somite. Wingert et al. 2007 map the segments to somites. Podocytes and neck lie at somite 3 to 4. The proximal convoluted tubule starts at somite 5 at 24 hpf and at somite 3 at 48 hpf. The tubule spans somites 4 to 18. The distal late segment and the duct overlap at somite 17.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 800, duct_diameter 20 from somite 3 to the cloaca; nephric primordium ventral to somite 3 | (estimate) |
| Long-pec | 48 | length 1000, duct_diameter 30 | (estimate) |
| Day 5 | 120 | length 1300, duct_diameter 35 | (estimate) |
| Days 7-13 | 240 | length 1800, duct_diameter 40 ZFIN end stage; mesonephros takes over | (estimate) |

Events:
- 10.3 hpf: pronephric mesoderm (intermediate mesoderm) present at 1-4 somites
- 14 hpf: pronephros, glomerulus, tubule and duct terms start in ZFIN (10-13 somites)
- 21 hpf: distal tubule reaches and fuses with the cloaca by the 22 somite stage
- 24 hpf: ducts complete; nephric primordium ventral to somite 3
- 44 hpf: vascularisation and onset of filtration between 40 and 48 hpf; glomeruli fused at the midline by 48 hpf
- 72 hpf: proximal convoluted tubule coils between 72 and 144 hpf
- 336 hpf: ZFIN end stage Days 7-13; mesonephric nephrons appear from 12 to 14 dpf

Sources: https://zfin.org/ZFA:0000151; https://journals.biologists.com/dev/article/125/23/4655/40115/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2042002/; https://pmc.ncbi.nlm.nih.gov/articles/PMC5069491/

#### pronephric glomerulus (ZFA:0001557)

- Synonyms: pronephric glomera, pronephric glomeruli, pronephric glomus
- ZFA definition: Paired highly vascularized structures of the pronephros which are fused at the midline.  Responsible for blood filtration and begins to function between 40 and 48hpf.
- ZFIN stages: Segmentation:10-13 somites (14-16 hpf) to Larval:Days 7-13 (168-336 hpf).
- Position: AP 0.29 to 0.31 of body length. Dorsoventral: immediately ventral to the dorsal aorta; dorsal to the gut. Laterality: paired primordia at 24 hpf; fused at the midline by 48 hpf. Landmarks: level of somite 3; the interrenal gland lies immediately caudal to it
- Shape: sphere. Two small spheres left and right of the midline at 24 hpf that merge into one sphere under the dorsal aorta by 48 hpf.
- Notes: ZFA synonyms: pronephric glomera, glomeruli, glomus. Drummond et al. 1998 showed that filtration starts between 40 and 48 hpf.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 30 each bilateral cluster | (estimate) |
| Long-pec | 48 | width 70, height 40, length 50 fused glomerulus | (estimate) |
| Day 5 | 120 | width 90, height 50, length 60 | (estimate) |
| Days 7-13 | 240 | width 100, height 60, length 70 | (estimate) |

Events:
- 14 hpf: term starts in ZFIN (10-13 somites)
- 24 hpf: podocyte progenitors in a curve at somite 3 to 4
- 40 hpf: filtration begins between 40 and 48 hpf
- 48 hpf: podocyte clusters fused at the midline at somite 3
- 336 hpf: ZFIN end stage Days 7-13

Sources: https://zfin.org/ZFA:0001557; https://journals.biologists.com/dev/article/125/23/4655/40115/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2042002/

#### pronephric tubule (ZFA:0001558)

- Synonyms: ciliated neck segment
- ZFA definition: Bilaterally paired tubes connecting the pronephric glomeruli to the pronephric ducts. In zebrafish and other teleosts, the pronephric nephron and tubules form after the pronephric duct, connecting to the anterior-most tip of the pronephric ducts.
- ZFIN stages: Segmentation:10-13 somites (14-16 hpf) to Larval:Days 7-13 (168-336 hpf).
- Position: AP 0.3 to 0.35 of body length. Dorsoventral: ventral to somites 3 to 5; dorsal to the gut and the swim bladder region. Laterality: paired, lateral to the glomerulus. Landmarks: neck at somite 3; proximal convoluted tubule from somite 3 (48 hpf) or 5 (24 hpf) to about somite 8; coils after 72 hpf
- Shape: tube. Two short tubes that leave the glomerulus laterally and bend caudally into the ducts. From 72 hpf add coiling (a helical spline of two to three turns) in the proximal segment.
- Notes: ZFA synonym: ciliated neck segment. ZFA notes that in teleosts the tubules form after the duct and join the anterior tip of the duct.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 150, diameter 25 | (estimate) |
| Long-pec | 48 | length 200, diameter 30 | (estimate) |
| Day 5 | 120 | length 300, diameter 35 coiled | (estimate) |
| Days 7-13 | 240 | length 350, diameter 40 | (estimate) |

Events:
- 14 hpf: term starts in ZFIN (10-13 somites)
- 24 hpf: segments patterned; anterior boundary of the proximal tubule at somite 5
- 48 hpf: anterior boundary shifts to somite 3
- 72 hpf: proximal convoluted tubule coils between 72 and 144 hpf
- 336 hpf: ZFIN end stage Days 7-13

Sources: https://zfin.org/ZFA:0001558; https://pmc.ncbi.nlm.nih.gov/articles/PMC2042002/; https://journals.biologists.com/dev/article/125/23/4655/40115/

#### pronephric duct (ZFA:0000150)

- Synonyms: pronephric ducts
- ZFA definition: Duct of the embryonic kidney, present bilaterally ventral to the somites and leading to the cloacal chamber. Wingert et al. have suggested that the pronephric duct as described traditionally may consist of subregions which are analogous to portions of the tubule segment of mammalian and other fish nephrons.
- ZFIN stages: Segmentation:10-13 somites (14-16 hpf) to Larval:Days 7-13 (168-336 hpf).
- Position: AP 0.33 to 0.57 of body length. Dorsoventral: ventral to the somites, lateral to the dorsal aorta and posterior cardinal vein; dorsal to the gut. Laterality: paired, left and right. Landmarks: from about somite 5 to the cloaca below somite 17 to 18; the corpuscles of Stannius sit on top of the distal segment
- Shape: tube. Two parallel tubes along the ventral edge of the somites that converge and fuse at the cloaca. Lumen diameter grows with age.
- Notes: ZFA notes that the duct as described traditionally contains segments that match tubule segments of other vertebrates (Wingert et al. 2007). The lumen numbers are estimates; Sullivan-Brown et al. 2008 report a larger lumen in medial than posterior tubules at 26 to 30 hpf.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 650, diameter 20, lumen 8 somite 5 to cloaca; somite length about 45 um | (estimate) |
| Long-pec | 48 | length 800, diameter 30, lumen 12 | (estimate) |
| Day 5 | 120 | length 1000, diameter 35, lumen 15 | (estimate) |
| Days 7-13 | 240 | length 1400, diameter 40, lumen 18 | (estimate) |

Events:
- 14 hpf: duct term starts in ZFIN (10-13 somites)
- 17 hpf: distal end starts to migrate toward the cloaca (16 to 18 somites)
- 21 hpf: distal segment fuses with the cloaca by 22 somites
- 24 hpf: ducts complete along the trunk
- 48 hpf: ducts converge at the cloaca in wt1b reporter larvae
- 336 hpf: ZFIN end stage Days 7-13; mesonephric duct continues in the adult

Sources: https://zfin.org/ZFA:0000150; https://pmc.ncbi.nlm.nih.gov/articles/PMC2042002/; https://pmc.ncbi.nlm.nih.gov/articles/PMC5069491/; https://pmc.ncbi.nlm.nih.gov/articles/PMC8424172/

#### kidney (ZFA:0000529)

- Synonyms: mesonephros
- ZFA definition: Cavitated compound organ located in the pleuroperitoneal cavity where hematopoiesis and filtering of blood occur.
- ZFIN stages: Larval:Day 5 (120-144 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.22 to 0.56 of body length. Dorsoventral: along the dorsal body wall, ventral to the vertebral column and dorsal aorta; dorsal to the swim bladder and gut. Laterality: midline, fused bilateral lobes in the head kidney; paired trunk tissue that fuses in the adult. Landmarks: head kidney behind the gills; trunk (body) kidney along the vertebrae; tail kidney to the level of the vent
- Shape: custom. Flat elongated strip pressed against the dorsal body wall. Wider anterior head region with two lobes, narrow trunk and tail. In the larva show it as new nephron spheres added around the pronephric ducts.
- Notes: ZFA synonym: mesonephros. The kidney is part of the renal, immune and pleuroperitoneal terms. Zhou et al. 2010 and Diep et al. 2015 give the timing. Gupta and Mullins 2010 describe the adult kidney as a translucent pink structure along the dorsal body wall. It has head, body and tail regions.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Day 5 | 120 | length 50, width 20, height 20 nephron progenitor clusters only; no organ yet | (estimate) |
| Days 14-20 | 336 | length 300, width 80, height 50 first mesonephric nephrons around the pronephros | (estimate) |
| Juvenile 30 dpf | 720 | length 5000, width 500, height 300 head, trunk and tail regions present at 9 mm | (estimate) |
| Adult | 2160 | length 14000, width 1500, height 800 about 300 nephrons at 3 months | (estimate) |

Events:
- 120 hpf: kidney and nephron progenitor terms start in ZFIN (Day 5)
- 240 hpf: first mesonephric nephron expresses cdh17 at 5.2 to 5.5 mm (about 10 dpf)
- 312 hpf: first podocytes and first nephron primordium ventral to the sixth myotome (12 to 14 dpf)
- 456 hpf: nephrogenesis proceeds caudally, then rostrally from 18 to 20 dpf
- 720 hpf: head, trunk and tail regions distinct at 9 mm (about 30 dpf)
- 2160 hpf: about 150 medial nephrons (48 percent of the total) by 3 months; number still rises slowly to 18 months

Sources: https://zfin.org/ZFA:0000529; https://pmc.ncbi.nlm.nih.gov/articles/PMC2980409/; https://pmc.ncbi.nlm.nih.gov/articles/PMC4412820/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/

#### head kidney (ZFA:0000669)

- Synonyms: anterior kidney, kidney marrow
- ZFA definition: The zebrafish head kidney consists of fused bilateral lobes located in the anterior part of the kidney.  It is analogous to the mammalian bone marrow and the primary site of definitive hematopoiesis.
- ZFIN stages: Unknown (0-17520 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.22 to 0.3 of body length. Dorsoventral: dorsal body wall behind the gills; dorsal to the anterior swim bladder chamber and the heart. Laterality: fused bilateral lobes at the midline. Landmarks: anterior part of the kidney; holds the interrenal gland; site of definitive hematopoiesis
- Shape: ellipsoid. Two fused ellipsoids at the anterior end of the kidney strip, darker than the trunk kidney.
- Notes: ZFA synonyms: anterior kidney, kidney marrow. The hematopoietic specialist may also model this node.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Juvenile 30 dpf | 720 | length 1000, width 500, height 300 | (estimate) |
| Adult | 2160 | length 3000, width 1800, height 900 | (estimate) |

Events:
- 720 hpf: head, trunk and tail regions distinct at 9 mm
- 2160 hpf: main site of definitive hematopoiesis in the adult

Sources: https://zfin.org/ZFA:0000669; https://pmc.ncbi.nlm.nih.gov/articles/PMC4412820/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/

#### posterior kidney (ZFA:0001293)

- Synonyms: posterior kidneys
- ZFA definition: No definition in ZFA.
- ZFIN stages: Larval:Day 6 (144-168 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.3 to 0.56 of body length. Dorsoventral: ventral to the vertebral column; dorsal to the swim bladder and gonads. Laterality: paired strips that fuse at the midline in the adult. Landmarks: trunk (body) and tail kidney from behind the head kidney to the level of the vent
- Shape: tube. Flattened ribbon along the dorsal midline that tapers caudally. Same spline as the pronephric ducts, which it replaces.
- Notes: ZFA gives no definition. Diep et al. 2015 show new mesonephric nephrons forming on top of the pronephric distal early and distal late segments.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Days 14-20 | 336 | length 1500, width 80, height 50 | (estimate) |
| Juvenile 30 dpf | 720 | length 4000, width 300, height 200 | (estimate) |
| Adult | 2160 | length 11000, width 1200, height 600 | (estimate) |

Events:
- 144 hpf: posterior kidney term starts in ZFIN (Day 6)
- 312 hpf: first nephron primordium ventral to the sixth myotome
- 480 hpf: new nephrons form on top of the pronephric distal segments at the 8 mm stage
- 720 hpf: trunk and tail regions distinct at 9 mm

Sources: https://zfin.org/ZFA:0001293; https://pmc.ncbi.nlm.nih.gov/articles/PMC4412820/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2980409/

#### mesonephric duct (ZFA:0000546)

- Synonyms: Wolffian duct, renal duct
- ZFA definition: Duct of the adult kidney (mesonephros), present bilaterally ventral to the somites and leading to the cloacal chamber.
- ZFIN stages: Unknown (0-17520 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.3 to 0.57 of body length. Dorsoventral: ventral to the somites and vertebrae; dorsal to the gut. Laterality: paired. Landmarks: runs along the kidney and empties into the cloacal chamber
- Shape: tube. Continue the pronephric duct splines after 336 hpf under this term.
- Notes: ZFA synonyms: renal duct, Wolffian duct. ZFA defines it as the duct of the adult kidney, bilateral, ventral to the somites, leading to the cloacal chamber.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Days 14-20 | 336 | length 1500, diameter 40 | (estimate) |
| Adult | 2160 | length 12000, diameter 300 | (estimate) |

Events:
- 336 hpf: pronephric duct term ends; mesonephric duct continues
- 2160 hpf: drains the adult kidney into the cloacal chamber

Sources: https://zfin.org/ZFA:0000546; https://pmc.ncbi.nlm.nih.gov/articles/PMC4412820/

### Endocrine glands

#### thyroid primordium (ZFA:0001081)

- Synonyms: thyroid primordia
- ZFA definition: Portion of tissue part of the pharyngeal endoderm that is fated to become thyroid follicle.
- ZFIN stages: Pharyngula:Prim-15 (30-36 hpf) to Hatching:Long-pec (48-60 hpf).
- Position: AP 0.14 to 0.17 of body length. Dorsoventral: floor of the pharynx, dorsal to the heart tube and outflow tract. Laterality: midline. Landmarks: pharyngeal floor at the level of the second pharyngeal arch, just anterior to the outflow tract
- Shape: sphere. Small sphere in the ventral pharyngeal wall. From 36 to 40 hpf let it bud rostro-ventrally out of the wall.
- Notes: The 2021 review (PMC8213386) and Alt et al. 2006 give this timeline. At 28 hpf the foregut holds up to 100 Pax2a positive cells, but the 55 hpf primordium holds only 30 to 40 differentiated thyroid cells.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 30 monolayer of committed cells | (estimate) |
| Prim-15 | 30 | diameter 35 | (estimate) |
| Prim-25 | 40 | length 50, diameter 35 placode budding from the pharyngeal epithelium | (estimate) |
| Long-pec | 55 | diameter 40 30 to 40 differentiated cells; ZFIN end stage Long-pec | (estimate) |

Events:
- 20 hpf: pax2a expression starts in the foregut endoderm
- 24 hpf: nkx2.4b positive thyroid cells near the heart tube
- 30 hpf: thyroid primordium term starts in ZFIN (Prim-15); pax8 and foxe1 expressed at 28 to 30 hpf
- 38 hpf: placode buds from the pharyngeal epithelium (36 to 40 hpf); tg expressed
- 55 hpf: first follicle differentiates; end of the primordium term at 60 hpf

Sources: https://zfin.org/ZFA:0001081; https://pmc.ncbi.nlm.nih.gov/articles/PMC8213386/; https://pubmed.ncbi.nlm.nih.gov/16680726/; https://pmc.ncbi.nlm.nih.gov/articles/PMC10214844/

#### thyroid follicle (ZFA:0001072)

- Synonyms: thyroid follicles
- ZFA definition: Portion of tissue formed form thyroid follicle cells that forms along the midline in pharyngeal mesenchyme.  The follicles are not encapsulated by connective tissue.
- ZFIN stages: Hatching:Long-pec (48-60 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.15 to 0.22 of body length. Dorsoventral: ventral to the pharynx; along the ventral aorta between the hypobranchial cartilage and the outflow tract. Laterality: midline; follicles scatter left and right of the ventral aorta in the adult. Landmarks: first follicle at the anterior end; new follicles added caudally along the ventral aorta
- Shape: custom. Chain of small spheres along the ventral aorta. One sphere at 55 hpf, four to six spheres by 6 dpf, several dozen scattered spheres in the adult. No capsule.
- Notes: ZFA states that follicles form along the midline in pharyngeal mesenchyme and are not encapsulated. Alt et al. 2006 showed that the first follicle becomes the most anterior one and that new follicles are added caudally. Trubiroha et al. 2018 counted 4 to 6 follicles from 6 to 11 dpf.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Long-pec | 55 | diameter 35 one follicle | (estimate) |
| Day 5 | 120 | length 150, diameter 30 four to six follicles in a row | (estimate) |
| Days 7-13 | 264 | length 250, diameter 40 4 to 6 follicles; follicle size increases 6 to 11 dpf | (estimate) |
| Adult | 2160 | length 2500, diameter 120 loose follicles along the ventral aorta | (estimate) |

Events:
- 48 hpf: thyroid follicle term starts in ZFIN (Long-pec)
- 55 hpf: first follicle with a lumen; functional genes expressed
- 72 hpf: follicular tissue grows along the pharyngeal midline (55 to 120 hpf)
- 144 hpf: cell cords re-organised into distinct follicles by 6 dpf; typically 4 to 6 follicles from 6 to 11 dpf
- 2160 hpf: bulk of the thyroid caudal to the branchial chamber along the ventral aorta

Sources: https://zfin.org/ZFA:0001072; https://pubmed.ncbi.nlm.nih.gov/16680726/; https://pmc.ncbi.nlm.nih.gov/articles/PMC8213386/; https://pmc.ncbi.nlm.nih.gov/articles/PMC5884836/; https://pmc.ncbi.nlm.nih.gov/articles/PMC13340149/

#### interrenal primordium (ZFA:0001346)

- Synonyms: none
- ZFA definition: Multi-tissue structure located in the kidney that develops into the interrenal gland.
- ZFIN stages: Segmentation:20-25 somites (19-22 hpf) to Larval:Protruding-mouth (72-96 hpf).
- Position: AP 0.3 to 0.32 of body length. Dorsoventral: ventral to somite 3, ventral to the dorsal aorta; dorsal to the gut. Laterality: bilateral at 22 to 27 hpf; single cluster slightly right of the midline from 24 to 30 hpf; between the dorsal aorta and the right posterior cardinal vein by 28 hpf. Landmarks: next to the pronephric glomerular primordia; immediately caudal to the glomerulus after fusion
- Shape: sphere. Two small spheres beside the glomerular primordia at 22 hpf that merge into one sphere right of the midline by 30 hpf.
- Notes: Hsu et al. 2003 describe parallel development with the pronephros. Chou et al. 2012 give the vessel timeline and the rightward position.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| 20-25 somites | 22 | diameter 20 each bilateral cluster | (estimate) |
| Prim-5 | 24 | diameter 30 converging | (estimate) |
| Long-pec | 48 | diameter 40 | (estimate) |
| Protruding-mouth | 72 | diameter 50 ZFIN end stage Protruding-mouth | (estimate) |

Events:
- 19 hpf: interrenal primordium term starts in ZFIN (20-25 somites)
- 22 hpf: ff1b positive bilateral clusters ventral to somite 3 (22 to 27 hpf)
- 27 hpf: clusters fuse at the midline at the 22 to 24 somite stage guided by angioblasts
- 28 hpf: single tissue between the dorsal aorta and the right posterior cardinal vein
- 48 hpf: interrenal vessel sprouts from the dorsal aorta into the tissue at about 2 dpf
- 96 hpf: ZFIN end stage Protruding-mouth; interrenal gland term continues

Sources: https://zfin.org/ZFA:0001346; https://journals.biologists.com/dev/article/130/10/2107/52039/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3428036/

#### interrenal gland (ZFA:0001345)

- Synonyms: none
- ZFA definition: An bilobed multi-tissue structure lateral to the notochord composed of an epithelium consisting of steroid producing cells interposed with chromaffin cells.  The interrenal gland is embedded within the head kidney.  The interrenal gland is the zebrafish functional equivalent of the mammalian adrenal cortex.
- ZFIN stages: Larval:Protruding-mouth (72-96 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.3 to 0.32 of body length. Dorsoventral: ventral to the dorsal aorta at the midtrunk level of somites 3 to 4; dorsal to the gut. Laterality: single tissue slightly right of the midline; bilobed in the adult, lateral to the notochord. Landmarks: immediately caudal to the vascularised glomerulus; embedded in the head kidney in the adult
- Shape: ellipsoid. One ellipsoid just caudal to the glomerulus, right of the midline, with a vessel through it from 2 dpf. In the adult: two lobes inside the head kidney.
- Notes: ZFA defines the gland as bilobed, lateral to the notochord, embedded in the head kidney and the equivalent of the adrenal cortex. Chou et al. 2012 place the assembling gland at the level of somites 3 to 4.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Protruding-mouth | 72 | length 60, width 45, height 40 assembly complete by 3 dpf | (estimate) |
| Day 5 | 120 | length 70, width 50, height 45 | (estimate) |
| Adult | 2160 | length 800, width 400, height 300 steroidogenic and chromaffin cells scattered in the head kidney | (estimate) |

Events:
- 48 hpf: assembly starts at about 2 dpf; cells migrate from the right of the dorsal aorta toward the midline
- 72 hpf: interrenal gland term starts in ZFIN (Protruding-mouth); circulation through the gland established by 3 dpf
- 120 hpf: pituitary control of interrenal growth starts at 5 dpf
- 2160 hpf: bilobed tissue lateral to the notochord inside the head kidney

Sources: https://zfin.org/ZFA:0001345; https://pmc.ncbi.nlm.nih.gov/articles/PMC3428036/; https://journals.biologists.com/dev/article/130/10/2107/52039/; https://pmc.ncbi.nlm.nih.gov/articles/PMC13340149/

#### corpuscles of Stannius (ZFA:0001200)

- Synonyms: none
- ZFA definition: Islands of eosinic cells found on the lateroventral surface of the kidney. Function is thought to be that of the parathyroid gland in other vertebrates, which are lacking in fishes. These cells secrete hypocalcin (teleocalcin) to regulate calcium metabolism.
- ZFIN stages: Segmentation:20-25 somites (19-22 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.44 to 0.47 of body length. Dorsoventral: dorsal side of the pronephric duct; ventral to the somites. Laterality: paired, one on each duct (occasionally fused). Landmarks: junction of the distal early and distal late segments, at about somite 10 to 12; lateroventral surface of the posterior kidney in the adult
- Shape: sphere. One small sphere on the dorsal surface of each pronephric duct at the distal early / distal late junction. Extrude it upward between 32 and 50 hpf.
- Notes: ZFA describes islands of eosinophilic cells on the lateroventral surface of the kidney that secrete hypocalcin (stanniocalcin). Naylor et al. 2018 describe the transdifferentiation and extrusion from the distal early tubule. The somite level is an estimate read from the Wingert 2007 segment map.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 15 stc1 positive cells still inside the tubule | (estimate) |
| Long-pec | 50 | diameter 25 discrete gland on top of the tubule | (estimate) |
| Day 5 | 120 | diameter 35 | (estimate) |
| Adult | 2160 | diameter 200 islands on the lateroventral kidney surface | (estimate) |

Events:
- 19 hpf: term starts in ZFIN (20-25 somites); cells arise in the distal pronephros
- 24 hpf: cdh17 down-regulated and stc1 expressed in the posterior distal early segment
- 32 hpf: prominent bulge on the dorsal side of the tubule
- 42 hpf: neighbouring epithelial cells meet under the extruding cells
- 50 hpf: discrete separate glands on top of each tubule in about 70 percent of animals
- 60 hpf: extrusion complete in most embryos

Sources: https://zfin.org/ZFA:0001200; https://pmc.ncbi.nlm.nih.gov/articles/PMC6250424/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2042002/

#### ultimobranchial body (ZFA:0001448)

- Synonyms: ultimobranchial bodies
- ZFA definition: Glands that produce calcitonin.  In adult fish the glands lie as two groups of follicles at the transverse septum close to the sinus venosus.
- ZFIN stages: Hatching:Pec-fin (60-72 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.22 to 0.24 of body length. Dorsoventral: between the gut and the heart, beneath the muscle layer of the gut, at the axial level of the sinus venosus; dorsal to the heart in the transverse septum in the adult. Laterality: midline (paired origin from caudal pharyngeal pouches; described as a single midline organ in the adult). Landmarks: ventral wall of the esophagus, above the sinus venosus and atrium
- Shape: sphere. Small sphere between the esophagus and the sinus venosus. In the adult a cluster of small follicles dorsal to the heart in the transverse septum.
- Notes: ZFA states that in the adult the glands lie as two groups of follicles at the transverse septum close to the sinus venosus. The 2024 Development paper (PMC11698069) gives the larval position and calca timing.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Pec-fin | 60 | diameter 20 | (estimate) |
| Day 5 | 120 | diameter 30 | (estimate) |
| Days 7-13 | 240 | diameter 45 distinct cell cluster with several small follicles at 10 dpf | (estimate) |
| Adult | 2160 | diameter 300 | (estimate) |

Events:
- 60 hpf: ultimobranchial body term starts in ZFIN (Pec-fin)
- 168 hpf: calca transcripts in the ultimobranchial body at 7 dpf; calcitonin protein not yet detectable
- 240 hpf: distinct cluster of several small follicles between gut and heart at 10 dpf
- 2160 hpf: single midline organ dorsal to the heart in the transverse septum; two groups of follicles near the sinus venosus (ZFA)

Sources: https://zfin.org/ZFA:0001448; https://pmc.ncbi.nlm.nih.gov/articles/PMC11698069/; https://pmc.ncbi.nlm.nih.gov/articles/PMC13340149/

### Reproductive system

#### primordial germ cell (ZFA:0009288)

- Synonyms: PGC
- ZFA definition: A primordial germ cell is a diploid germ cell precursors that transiently exist in the embryo before they enter into close association with the somatic cells of the gonad and become irreversibly committed as germ cells.
- ZFIN stages: Blastula:Sphere (4-4.33 hpf) to Unknown (0-17520 hpf).
- Position: AP 0.4 to 0.46 of body length. Dorsoventral: dorsal to the yolk; ventral to the somites and lateral to the pronephric ducts at 24 hpf. Laterality: two bilateral clusters. Landmarks: at the junction of the yolk ball and yolk extension, at the level of somites 8 to 10, at 24 hpf; in the gonadal region ventral to the swim bladder at 5 dpf
- Shape: custom. Point cloud of 4 to 50 small spheres. Four cells at 4 hpf at the blastoderm margin, then two migrating clusters that settle at the yolk ball / yolk extension junction by 24 hpf.
- Notes: ZFA gives an unknown end stage for this cell term. The 2021 PGC paper (PMC7847270) cites 25 to 50 PGCs at 24 hpf. This is a cell-level term kept because the task asked for it; the model can draw it as a cluster.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Sphere | 4 | count 4, cell_diameter 15 four PGCs at the blastoderm margin | (estimate) |
| Prim-5 | 24 | count 35, cluster_length 60, cell_diameter 12 25 to 50 PGCs in compact bilateral clusters | https://pmc.ncbi.nlm.nih.gov/articles/PMC7847270/ |
| Long-pec | 48 | count 40, cluster_length 70, cell_diameter 12 | (estimate) |
| Day 5 | 120 | count 45, cluster_length 80, cell_diameter 12 PGCs begin to associate with somatic gonad cells | (estimate) |

Events:
- 3 hpf: PGCs specified at mid-blastula
- 4 hpf: primordial germ cell term starts in ZFIN (Sphere)
- 24 hpf: migration to the gonadal region complete; 25 to 50 PGCs in bilateral clusters
- 120 hpf: PGCs and somatic gonad cells begin to coalesce
- 168 hpf: gonad primordium term ends at 336 hpf; germ cells continue as oogonia or spermatogonia

Sources: https://zfin.org/ZFA:0009288; https://pmc.ncbi.nlm.nih.gov/articles/PMC7847270/; https://pmc.ncbi.nlm.nih.gov/articles/PMC5600409/

#### gonad primordium (ZFA:0001262)

- Synonyms: gonadal primordium, undifferentiated gonad
- ZFA definition: Portion of tissue that gives rise to the immature gonad.
- ZFIN stages: Unknown (0-17520 hpf) to Larval:Days 7-13 (168-336 hpf).
- Position: AP 0.36 to 0.44 of body length. Dorsoventral: ventral to the mesonephros / pronephric ducts; dorsal to the gut; in contact with the coelomic epithelium that lines the swim bladder at 5 dpf. Laterality: paired rods left and right of the dorsal mesentery. Landmarks: at the level of the swim bladder, dorsolateral to the intestine
- Shape: ellipsoid. Two thin ellipsoids (rods) oriented along the body axis, dorsolateral to the gut under the swim bladder.
- Notes: ZFA synonyms: gonadal primordium, undifferentiated gonad. Leerberg et al. 2017 describe the rod-like paired gonad with germ cells in the core.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Day 5 | 120 | length 80, diameter 25 germ cells with a few somatic cells | (estimate) |
| Days 7-13 | 240 | length 150, diameter 40 bilayered somatic compartment by 8 to 10 dpf | (estimate) |
| Days 7-13 end | 336 | length 200, diameter 50 ZFIN end stage Days 7-13 | (estimate) |

Events:
- 120 hpf: somatic gonad cells detected around germ cells at 5 dpf
- 216 hpf: somatic compartment organised into an outer epithelial and inner mesenchymal layer (8 to 10 dpf)
- 276 hpf: inner somatic cells begin to express sex-specific markers cyp19a1a and amh (11 to 12 dpf)
- 312 hpf: early oocytes appear in all animals from about 13 dpf
- 336 hpf: ZFIN end stage Days 7-13; immature gonad term follows

Sources: https://zfin.org/ZFA:0001262; https://pmc.ncbi.nlm.nih.gov/articles/PMC5600409/; https://pmc.ncbi.nlm.nih.gov/articles/PMC10651076/

#### immature gonad (ZFA:0005272)

- Synonyms: juvenile gonad, juvenile ovary
- ZFA definition: Immature reproductive tissue that has not undergone final maturation into either testis or ovary. During gonadal development, the gonad may be  transiently intersexual where there is a  parallel presence of both oocytes and spermatocytes.
- ZFIN stages: Larval:Days 14-20 (336-504 hpf) to Larval:Days 21-29 (504-720 hpf).
- Position: AP 0.33 to 0.5 of body length. Dorsoventral: ventral to the kidney and dorsal aorta; dorsal to the intestine; ventral to the swim bladder. Laterality: paired. Landmarks: elongated along the dorsal coelom; blood supply from the swim bladder artery at 20 dpf
- Shape: ellipsoid. Two elongated ellipsoids under the swim bladder that grow along the axis between 14 and 30 dpf.
- Notes: ZFA synonyms: juvenile gonad, juvenile ovary. ZFA notes that the gonad may be transiently intersexual. The 2023 bipotential gonad paper (PMC10651076) gives the cell arrival timeline and the 20 dpf size context.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Days 14-20 | 336 | length 250, diameter 60 | (estimate) |
| Days 14-20 (20 dpf) | 480 | length 500, diameter 120 fish about 7 mm SL | (estimate) |
| Days 21-29 | 720 | length 900, diameter 200 ZFIN end stage Days 21-29 | (estimate) |

Events:
- 336 hpf: immature gonad term starts in ZFIN (Days 14-20)
- 360 hpf: vascular and lymphatic endothelium, pericytes and macrophages populate the gonad between 12 and 20 dpf
- 480 hpf: sex determination in progress at 20 dpf; macrophages engulf germ cells
- 600 hpf: overt sex differentiation at about 25 dpf
- 720 hpf: ZFIN end stage Days 21-29; gonad, ovary and testis terms start at 504 hpf

Sources: https://zfin.org/ZFA:0005272; https://pmc.ncbi.nlm.nih.gov/articles/PMC10651076/; https://pmc.ncbi.nlm.nih.gov/articles/PMC5600409/

#### gonad (ZFA:0000413)

- Synonyms: gonads, mature gonad
- ZFA definition: The part of the reproductive system that produces and releases eggs (ovary) or sperm (testis).
- ZFIN stages: Larval:Days 21-29 (504-720 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.28 to 0.55 of body length. Dorsoventral: ventral to the kidney and swim bladder; dorsal and lateral to the intestine. Laterality: paired. Landmarks: group node for ovary and testis in the coelom
- Shape: custom. Group node. Switch the child (ovary or testis) with a sex toggle in the UI.
- Notes: ZFA synonyms: gonads, mature gonad. It develops from the immature gonad.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Days 21-29 | 504 | length 800, diameter 200 | (estimate) |
| Adult | 2160 | length 10000, diameter 3000 female; see ovary and testis | (estimate) |

Events:
- 504 hpf: gonad term starts in ZFIN (Days 21-29)
- 600 hpf: overt sex differentiation at about 25 dpf
- 2160 hpf: sexual maturity at about 3 months

Sources: https://zfin.org/ZFA:0000413; https://pmc.ncbi.nlm.nih.gov/articles/PMC10651076/; https://pmc.ncbi.nlm.nih.gov/articles/PMC2980409/

#### ovary (ZFA:0000403)

- Synonyms: ovaries
- ZFA definition: Female reproductive organ.  The ovary is a bilobed cavitated organ located ventral to the swim bladder.
- ZFIN stages: Larval:Days 21-29 (504-720 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.28 to 0.55 of body length. Dorsoventral: ventral to the swim bladder and kidney; dorsal and lateral to the intestine; fills much of the coelom in a gravid female. Laterality: bilobed, paired lobes joined caudally; suspended by the mesovarium. Landmarks: rostral third of the abdominal cavity holds about one third ovary; the proportion rises caudally (Menke et al. 2011)
- Shape: ellipsoid. Two large elongated ellipsoids with a granular surface (follicles) that taper caudally into a short oviduct to the cloaca. Scale strongly with reproductive state.
- Notes: ZFA defines the ovary as a bilobed cavitated organ ventral to the swim bladder. Gupta and Mullins 2010 describe the bilobed ovary suspended by a vascularised mesovarium. Adult size is an estimate derived from the GSI ratio in PMC3842893 and the adult SL in Parichy et al. 2009.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Days 21-29 | 504 | length 900, diameter 250 per lobe | (estimate) |
| Juvenile 45 dpf | 1080 | length 3000, diameter 800 per lobe | (estimate) |
| Adult | 2160 | length 10000, width 4000, height 3000 per lobe in a gravid 25 mm SL female; female GSI at least ten times the male GSI | (estimate) |

Events:
- 504 hpf: ovary term starts in ZFIN (Days 21-29)
- 720 hpf: ovarian follicle terms start in ZFIN (Juvenile Days 30-44)
- 1080 hpf: oocyte stage I to V terms start in ZFIN (Juvenile Days 45-89)
- 2160 hpf: mature stage IV and V oocytes present unless recently spawned

Sources: https://zfin.org/ZFA:0000403; https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/; https://journals.sagepub.com/doi/10.1177/0192623311409597; https://pmc.ncbi.nlm.nih.gov/articles/PMC3842893/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### testis (ZFA:0000598)

- Synonyms: testes
- ZFA definition: Male reproductive organ. Adult zebrafish testes are paired organs forming elongated structures, internally organized into tubules. These tubules are formed by seminiferous epithelium containing cysts of spermatogonia and spermatocytes surrounded by somatic support cells, called Sertoli cells. Cysts are arranged around a lumen containing spermatozoa that is connected to the efferent ducts. The interstitial regions between the tubules contain the steroid-producing Leydig cells, connective tissue, and blood vessels.
- ZFIN stages: Larval:Days 21-29 (504-720 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.3 to 0.55 of body length. Dorsoventral: attached to the dorsal body wall; ventral to the kidney and swim bladder; dorsolateral to the intestine. Laterality: paired, positioned laterally. Landmarks: long white strands along the dorsal coelom that join the sperm duct at the cloaca
- Shape: tube. Two thin white elongated ellipsoids or tubes along the dorsal coelom, much thinner than the ovary lobes.
- Notes: ZFA describes paired elongated testes organised into tubules. Gupta and Mullins 2010 describe long white paired organs attached to the dorsal body wall. The INHAND male reproductive chapter notes that zebrafish testes are positioned laterally.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Days 21-29 | 504 | length 800, diameter 150 | (estimate) |
| Juvenile 45 dpf | 1080 | length 3000, diameter 400 | (estimate) |
| Adult | 2160 | length 9000, width 1200, height 900 per testis; male GSI about one tenth of the female GSI | (estimate) |

Events:
- 504 hpf: testis term starts in ZFIN (Days 21-29)
- 1080 hpf: spermatocyte term starts in ZFIN (Juvenile Days 45-89)
- 2160 hpf: seminiferous tubules with cysts of spermatogonia to spermatids

Sources: https://zfin.org/ZFA:0000598; https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/; https://pmc.ncbi.nlm.nih.gov/articles/PMC13340196/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3842893/

#### urogenital papilla (ZFA:0001118)

- Synonyms: UGP, anal papilla, anal papillae, genital papilla, urogenital papillae
- ZFA definition: A protuberance in front of the gential pore and behind the vent. Mature females have a well developed urogenital papillae whilst in mature males it is poorly developed.
- ZFIN stages: Larval:Day 6 (144-168 hpf) to Adult (2160-17520 hpf).
- Position: AP 0.57 to 0.585 of body length. Dorsoventral: ventral surface. Laterality: midline. Landmarks: small protuberance in front of the genital pore and behind the vent, at the anterior base of the anal fin
- Shape: custom. Small cone or nub on the ventral surface just posterior to the vent. Larger and more rounded in females.
- Notes: ZFA synonyms: genital papilla, anal papilla, UGP. The ZFA definition gives the position between the vent and the genital pore.

| Stage | hpf | Dimensions (um) | Source |
|---|---|---|---|
| Day 6 | 144 | height 15, diameter 20 | (estimate) |
| Juvenile 30 dpf | 720 | height 80, diameter 100 | (estimate) |
| Adult | 2160 | height 500, diameter 600 female; male papilla smaller | (estimate) |

Events:
- 144 hpf: urogenital papilla term starts in ZFIN (Day 6)
- 2160 hpf: well developed in mature females; poorly developed in males

Sources: https://zfin.org/ZFA:0001118

## 6. Recommendations for the procedural model

1. Build one gut spline from the mouth to the vent. Let the esophagus, intestinal bulb, mid intestine and posterior intestine own parameter ranges of that spline. Change the radius profile by stage: near-uniform rod at 24 hpf, bulb enlargement from 42 hpf, folds from 98 hpf.
2. Key the foregut left bend between 26 and 34 hpf. Hang the liver primordium on the left face and the anterior pancreatic bud on the ventral face of the same spline segment.
3. Model the liver as one ellipsoid on the left until 80 hpf. Add a right ellipsoid at 80 to 84 hpf and a flat ventral lobe at about 15 dpf. Place the gall bladder sphere on the right lobe.
4. Model the pancreas as a head ellipsoid (with an islet sphere inside) plus a tail tube along the right side of the mid intestine. Add small secondary islet spheres after 7 dpf.
5. Build the pronephros from two parallel duct splines under the somites that meet at the cloaca. Add two short tubules and one glomerulus sphere at somite 3 that fuses at the midline by 48 hpf. Coil the proximal segment from 72 hpf. From 14 dpf add nephron spheres along the ducts. Morph the whole into the flat mesonephros strip by 30 dpf.
6. Place the interrenal ellipsoid just caudal to the glomerulus, right of the midline. Place the corpuscles of Stannius as one sphere on each duct at about 0.45 of body length. Draw the thyroid as a chain of spheres under the pharynx along the ventral aorta. Put the ultimobranchial body between the esophagus and the sinus venosus.
7. For the gonads draw PGCs as a point cloud at 24 hpf and paired rods under the swim bladder from 5 dpf. Add a sex toggle that swaps two large granular ovary lobes for two thin testis strands after 25 dpf.
8. Use `visibleFromHpf` where the ZFIN start stage and the visible onset differ. The values are: mouth 60 hpf, vent opening 120 hpf, gall bladder 72 hpf, corpuscles of Stannius 50 hpf. Thyroid primordium 24 hpf, endocrine pancreas 24 hpf, ultimobranchial body 168 hpf. Mesonephros 288 hpf, head kidney 720 hpf, posterior kidney 336 hpf, mesonephric duct 336 hpf, gonad primordium 120 hpf.
9. Treat every size marked `estimate` as a placeholder. The measured anchors are few. Hepatocyte diameter is 10 to 14 um and sinusoid diameter 12 to 16 um at 120 hpf (Korzh et al. 2008). There are 25 to 50 PGCs at 24 hpf (PMC7847270). There are 4 to 6 thyroid follicles from 6 to 11 dpf (Trubiroha et al. 2018). Pronephros segment positions are given by somite number (Wingert et al. 2007). There are about 150 medial nephrons, 48 percent of all nephrons, at 3 months (Zhou et al. 2010). The adult has 11 teeth per side (PMC4298156).

## 7. Open questions

- Measured organ dimensions at 24, 48 and 120 hpf are missing for most structures. Field et al. 2003 (liver and pancreas), Ng et al. 2005 and Wallace et al. 2005 (intestine) contain measurements. I could not read them in this session because the publisher pages refused the connection. A follow-up should read those papers and replace the estimates.
- Kimmel et al. 1995 Figure 16 gives embryo length versus hours. That value is needed to convert the somite-based positions into micrometres at 24 and 48 hpf.
- Adult organ dimensions (liver, kidney, ovary, testis, intestine length) need a measured source. Menke et al. 2011 (Toxicol Pathol 39:759) and Wang et al. 2010 are the best candidates; I could read only the abstract and figure legends.
- ZFA has no term named thyroid gland. I used thyroid follicle (ZFA:0001072) for the gland and thyroid primordium (ZFA:0001081) for the anlage. The UI may want a display name `thyroid` for ZFA:0001072.
- ZFA has no generic tooth term; ceratobranchial 5 tooth (ZFA:0000694) carries the synonyms tooth and pharyngeal tooth. Individual tooth terms (tooth 4V etc.) exist and can drive per-tooth appearance if wanted.
- The hypophysis (ZFA:0000118) and epiphysis (ZFA:0000019) are endocrine in ZFA but were not in this task. Draft 03b (nervous and sensory) already holds both ids, so they need no entry here.
- The swim bladder (ZFA:0000076) and the spleen (ZFA:0000436) sit in draft 03c; the yolk (ZFA:0000084) sits in draft 03a. This draft does not repeat them.
- Two ids appear both here and in a sibling draft. Head kidney (ZFA:0000669) is also in 03c (hematopoietic role). Ceratobranchial 5 tooth (ZFA:0000694) is also in 03e (skeletal role). The merge step should keep one entry per id and combine the notes. This draft treats the head kidney as part of the kidney and the teeth as part of the pharynx. This follows the ZFA part_of relations.
- The Kimmel body lengths in section 2 come from the sibling file `05-morphometrics.md`; I did not read the Kimmel figure myself in this session.

