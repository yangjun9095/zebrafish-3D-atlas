# 03b Anatomy research: nervous and sensory systems

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Scope: neural primordium, brain and its subdivisions, spinal cord, brain ventricles, cranial ganglia, lateral line, eye, ear, and olfactory organ. This file lists 45 structures for the schematic whole-organism model. The matching machine-readable draft is `03b-anatomy-nervous-sensory.draft.json`.

## Method

I extracted candidate terms from the local ZFIN files (`anatomy_item.txt`, `anatomy_relationship.txt`, `anatomy_synonyms.txt`, `zfa.obo`, `stage_ontology.txt`, ZFA release 2026-07-16). I searched names for brain, eye, ear, lateral line, olfactory, ganglion, ventricle and neural tube terms, then removed cell-level, nucleus-level and tract-level terms. This gave about 400 candidates. I kept 45 organ-level or region-level structures that a schematic model can draw. ZFIN start and end stages come from `anatomy_item.txt` joined to `stage_ontology.txt`. Definitions come from `zfa.obo`. Sizes come from the sources named in each row. Where I found no measurement, the value is an estimate and the row says so.

Stage hours use the ZFIN convention (28.5 C). The ZFS stage `Unknown` (ZFS:0000000) spans 0 to 17520 hpf in `stage_ontology.txt`. Where ZFIN gives `Unknown`, the JSON keeps that value. It then adds `visibleFromHpf` or `modelEndHpf` with a note.

## Reference body lengths

Kimmel et al. 1995 give the embryo length (EL) per stage. Parichy et al. 2009 give standard length (SL) for post-embryonic stages. Use these to convert the `apFraction` values below to micrometers.

| Stage | hpf | Length | Source |
|---|---|---|---|
| 5-9 somites | 11.7 | EL 0.8 mm | https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| 14-19 somites | 16 | EL 0.9 mm | https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| 20-25 somites | 19 | EL 1.4 mm | https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| 26+ somites | 22 | EL 1.6 mm | https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| Prim-5 | 24 | EL 1.9 mm | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| Prim-15 | 30 | EL 2.5 mm | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| Prim-25 | 36 | EL 2.7 mm | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| High-pec | 42 | EL 2.9 mm | https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| Long-pec | 48 | EL 3.1 mm | https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html |
| Pec-fin | 60 | EL 3.3 mm | https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html |
| Protruding-mouth | 72 | EL 3.5 mm | https://zfin.org/zf_info/zfbook/stages/larv_stgs.html |
| Pec-fin (Parichy) | 72 | SL 3.4 mm | Parichy et al. 2009 Dev Dyn 238:2975-3015 https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Day 5 | 120 | about 3.9 mm (estimate) | interpolated between Kimmel 72 hpf and Parichy swim bladder inflation stage SL 3.4 to 3.7 mm |
| Adult | 2160+ | SL 17.5 mm (male), 18.3 mm (female) | Parichy et al. 2009 Dev Dyn 238:2975-3015 https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |

## Brain dimensions from atlases

| Atlas or study | Age | Numbers | Source |
|---|---|---|---|
| Z-Brain | 6 dpf, nacre | confocal voxels about 0.8 x 0.8 x 2 um; 294 regions; MAP-map analysis downsampled to 300 x 679 x 80 voxels | Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Z-Brain reference stack extent | 6 dpf | about 500 x 1100 x 280 um including olfactory epithelia and anterior spinal cord (unverified; computed from the downsampled grid and the 0.8 um pixel) | Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| mapzebrain | 6 dpf | 72 non-overlapping regions, more than 2000 single neurons; stack dimensions not stated in the abstract | Kunst et al. 2019 Neuron 103:21-38 (mapzebrain, 6 dpf) https://pubmed.ncbi.nlm.nih.gov/31147152/ |
| Serial-section EM | 5.5 dpf | brain volume 5.49e7 um3 (0.055 mm3) | Hildebrand et al. 2017 Nature 545:345-349 https://pmc.ncbi.nlm.nih.gov/articles/PMC5594570/ |
| Secondary summary | 5 dpf | brain about 400 x 800 x 250 um (W x L x H), about 100,000 neurons | State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745 |
| AZBA | adult, 15 to 16 weeks, AB | light-sheet 3.25 um in plane, 4 um steps, atlas at 4 um isotropic, 203 regions with volumes 0.000026 to 0.53 mm3 | Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988 |
| Wullimann atlas (via secondary) | adult, 90 dpf+ | brain length 4.5 mm, thickness 0.4 to 2 mm | State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745 citing Wullimann, Rupp & Reichert 1996 Neuroanatomy of the Zebrafish Brain (Birkhauser) |

Per-region adult volumes exist in AZBA Supplementary file 2 (Excel). I could not read that file with the tools available. Adult region sizes below are estimates scaled to a 4.5 mm brain and should be replaced by the AZBA volumes.

## Deviations from ZFIN stages

The JSON keeps the ZFIN start and end stages for every term. These fields add model guidance without changing them.

| Term | ZFIN start or end | Model guidance | Reason |
|---|---|---|---|
| medulla oblongata (ZFA:0000545) | start Unknown (0 hpf) | visibleFromHpf 24 | ZFIN start stage is Unknown. Kimmel describes the brain as five lobes at 24 hpf; the fifth lobe is the medulla (myelencephalon). Show it from 24 hpf. |
| rhombomere (ZFA:0001064) | end Unknown (17520 hpf) | modelEndHpf 72 | ZFIN end stage is Unknown. Rhombomere boundaries are morphologically clear from 14 to about 48 hpf and fade by 72 hpf; hide the segment array after 72 hpf (estimate). |
| forebrain ventricle (ZFA:0001259) | end Unknown (17520 hpf) | modelEndHpf 72 | ZFIN end stage is Unknown. ZFA telencephalic and third ventricles develop from it; switch names at about 72 hpf (estimate). |
| otic placode (ZFA:0000138) | start Gastrula:Bud (10 hpf) | visibleFromHpf 14 | ZFIN start is bud (10 hpf) for the specified field. The placode is first visible as an ectodermal thickening at 9 to 14 somites (about 14 to 16 hpf) (https://zfin.org/zf_info/anatomy/dict/ear/ear.html, Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/). |
| otic vesicle (ZFA:0000051) | end Unknown (17520 hpf) | modelEndHpf 72 | ZFIN end stage is Unknown. Hand over to the inner ear term when the semicircular canal pillars have fused (72 hpf). |
| inner ear (ZFA:0000217) | start Segmentation:20-25 somites (19 hpf) | visibleFromHpf 72 | ZFIN start is 20-25 somites (19 hpf), overlapping the otic vesicle. For the model, show the otic vesicle until 72 hpf and the inner ear after that. |
| olfactory placode (ZFA:0000048) | start Segmentation:10-13 somites (14 hpf) | visibleFromHpf 22 | ZFIN start is 10-13 somites (14 hpf) for the placodal field. Kimmel first notes the placodes as external thickenings at the 26-somite stage (22 hpf). |

Parent choice: `parent` is the nearest listed ancestor for the UI tree. `zfaPartOf` is the direct ZFA part_of parent, or null where ZFA asserts none (neural plate, keel, rod, tube, trigeminal ganglion, otic vesicle). Four terms have no ZFA definition (spinal cord, forebrain ventricle, tectal ventricle, olfactory pit); the JSON marks the definitions I wrote.

## Tables by system

Columns: `AP` is the anterior-posterior extent as a fraction of body length from the snout tip. The table shows larval values. The JSON gives per-stage values where they differ. `Shape` is the procedural primitive.

### Neural primordium (neural plate to neural tube)

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000132 | neural plate | central nervous system | Gastrula:75%-epiboly (8) | Segmentation:5-9 somites (14) | 0.00 to 1.00 | dorsal surface of the embryo, over the notochord and paraxial mesoderm; midline | sheet | `#c9b8e8` |
| ZFA:0000131 | neural keel | central nervous system | Gastrula:Bud (10) | Segmentation:10-13 somites (16) | 0.00 to 1.00 | dorsal midline, above the notochord; midline | tube | `#b9a4e0` |
| ZFA:0000133 | neural rod | central nervous system | Segmentation:5-9 somites (11.66) | Segmentation:14-19 somites (19) | 0.00 to 1.00 | dorsal midline, above the notochord; midline | tube | `#a892d8` |
| ZFA:0001135 | neural tube | central nervous system | Segmentation:10-13 somites (14) | Pharyngula:Prim-5 (30) | 0.00 to 1.00 | dorsal midline, above the notochord; midline | tube | `#9a82d0` |

### Brain and spinal cord

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000008 | brain | central nervous system | Segmentation:10-13 somites (14) | Adult (17520) | 0.02 to 0.32 | dorsal head, above the pharynx and notochord tip; midline | custom | `#8b6fc8` |
| ZFA:0000109 | forebrain | brain | Segmentation:10-13 somites (14) | Adult (17520) | 0.02 to 0.15 | anterior brain, dorsal to the mouth and pituitary; midline | custom | `#9d7fd6` |
| ZFA:0000079 | telencephalon | forebrain | Segmentation:10-13 somites (14) | Adult (17520) | 0.02 to 0.08 | most anterior and dorsal brain lobe, above the olfactory pits; midline (paired hemispheres from about 48 hpf) | ellipsoid | `#b48ee6` |
| ZFA:0000402 | olfactory bulb | telencephalon | Pharyngula:High-pec (42) | Adult (17520) | 0.02 to 0.04 | anterior tip of the telencephalon, at the level of the olfactory pits; paired | sphere | `#c7a6f0` |
| ZFA:0000101 | diencephalon | forebrain | Segmentation:10-13 somites (14) | Adult (17520) | 0.07 to 0.15 | ventral and posterior forebrain, between the eyes; hypothalamus forms its floor; midline | ellipsoid | `#8f74cf` |
| ZFA:0000032 | hypothalamus | diencephalon | Segmentation:26+ somites (22) | Adult (17520) | 0.09 to 0.15 | ventral-most forebrain, floor of the diencephalon, above the pituitary; midline | ellipsoid | `#7d63bf` |
| ZFA:0000118 | hypophysis | diencephalon | Segmentation:20-25 somites (19) | Adult (17520) | 0.10 to 0.13 | ventral to the hypothalamus, dorsal to the roof of the mouth; midline | ellipsoid | `#e0a86b` |
| ZFA:0000019 | epiphysis | diencephalon | Segmentation:10-13 somites (14) | Adult (17520) | 0.08 to 0.10 | dorsal midline of the diencephalon, at the brain surface under the skin; midline (parapineal to the left) | sphere | `#f0d36b` |
| ZFA:0000213 | habenula | diencephalon | Hatching:Long-pec (48) | Adult (17520) | 0.08 to 0.10 | dorsal diencephalon (epithalamus), lateral to the pineal stalk; paired, left larger | ellipsoid | `#d9b3ff` |
| ZFA:0000128 | midbrain | brain | Segmentation:10-13 somites (14) | Adult (17520) | 0.13 to 0.22 | dorsal head between the eyes and the ear; dorsal tectum, ventral tegmentum; midline (paired tectal lobes) | ellipsoid | `#7c9fe0` |
| ZFA:0000445 | optic tectum | midbrain | Pharyngula:Prim-5 (24) | Adult (17520) | 0.13 to 0.21 | dorsal midbrain, directly under the skull roof; paired lobes | ellipsoid | `#6f96e6` |
| ZFA:0000042 | midbrain hindbrain boundary | brain | Segmentation:14-19 somites (16) | Adult (17520) | 0.21 to 0.23 | dorsal brain surface constriction between midbrain and cerebellum; midline | custom | `#5b7fd0` |
| ZFA:0000029 | hindbrain | brain | Segmentation:10-13 somites (14) | Adult (17520) | 0.22 to 0.33 | dorsal head over the pharynx, medial to the otic vesicles; midline | tube | `#6aa6c9` |
| ZFA:0000100 | cerebellum | hindbrain | Segmentation:26+ somites (22) | Adult (17520) | 0.21 to 0.25 | dorsal anterior hindbrain, directly behind the tectum; midline | ellipsoid | `#4fb3a6` |
| ZFA:0000545 | medulla oblongata | hindbrain | Unknown (0) | Adult (17520) | 0.24 to 0.33 | ventral and posterior hindbrain, under the fourth ventricle; midline | tube | `#5f9bb8` |
| ZFA:0001064 | rhombomere | hindbrain | Segmentation:10-13 somites (14) | Unknown (17520) | 0.22 to 0.33 | whole dorsoventral extent of the hindbrain; midline, bilaterally symmetric | segmentArray | `#7fb8d9` |
| ZFA:0000075 | spinal cord | central nervous system | Pharyngula:Prim-5 (24) | Adult (17520) | 0.33 to 0.98 | directly dorsal to the notochord, ventral to the dorsal fin fold and epidermis; between the left and right myotomes; midline | tube | `#a48bd6` |

### Brain ventricles

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0001259 | forebrain ventricle | forebrain | Segmentation:14-19 somites (16) | Unknown (17520) | 0.04 to 0.14 | lumen of the forebrain, dorsal midline; midline | custom | `#e6f2ff` |
| ZFA:0000159 | tectal ventricle | midbrain | Segmentation:10-13 somites (14) | Adult (17520) | 0.14 to 0.22 | lumen of the midbrain under the tectal lobes; midline | ellipsoid | `#e6f2ff` |
| ZFA:0000110 | fourth ventricle | hindbrain | Segmentation:14-19 somites (16) | Adult (17520) | 0.22 to 0.32 | lumen of the hindbrain under a thin roof plate; midline | custom | `#e6f2ff` |

### Cranial ganglia

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000295 | trigeminal ganglion | peripheral nervous system | Segmentation:20-25 somites (19) | Adult (17520) | 0.16 to 0.19 | lateral to the hindbrain (r2), at the level of the eye's posterior margin, under the skin; paired | ellipsoid | `#f2b880` |
| ZFA:0000588 | statoacoustic (VIII) ganglion | peripheral nervous system | Segmentation:26+ somites (22) | Adult (17520) | 0.24 to 0.27 | ventromedial to the otic vesicle, lateral to the ventral hindbrain; paired | ellipsoid | `#f2b880` |
| ZFA:0001314 | posterior lateral line ganglion | lateral line system | Pharyngula:Prim-5 (24) | Adult (17520) | 0.27 to 0.30 | posterior and slightly ventral to the otic vesicle, under the skin; paired | ellipsoid | `#f2b880` |

### Lateral line

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000034 | lateral line system | peripheral nervous system | Segmentation:10-13 somites (14) | Adult (17520) | 0.02 to 1.00 | skin surface, head and trunk; trunk line on the horizontal myoseptum; paired, bilateral | custom | `#ff9f43` |
| ZFA:0001157 | posterior lateral line primordium | lateral line system | Segmentation:20-25 somites (19) | Larval:Day 4 (120) | 0.30 to 1.00 | on the horizontal myoseptum, under the epidermis; paired | ellipsoid | `#ffb366` |
| ZFA:0000944 | posterior lateral line | lateral line system | Pharyngula:High-pec (42) | Adult (17520) | 0.30 to 1.00 | skin over the horizontal myoseptum (midbody line); dorsal and ventral rami in the larva; paired | custom | `#ff9f43` |
| ZFA:0000243 | neuromast | lateral line system | Pharyngula:Prim-5 (24) | Adult (17520) | 0.02 to 1.00 | in the epidermis, apical surface exposed through a hole in the periderm; paired lines | sphere | `#ffc078` |

### Eye

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000050 | optic vesicle | eye | Segmentation:5-9 somites (11.66) | Segmentation:20-25 somites (22) | 0.05 to 0.14 | lateral wall of the diencephalon, dorsolateral; paired | ellipsoid | `#7fc8f0` |
| ZFA:0001202 | optic cup | eye | Segmentation:20-25 somites (19) | Pharyngula:Prim-5 (30) | 0.05 to 0.14 | lateral to the diencephalon, dorsal to the pharynx; paired | lathe | `#6fbde8` |
| ZFA:0000107 | eye | visual system | Pharyngula:Prim-5 (24) | Adult (17520) | 0.05 to 0.14 | lateral head, centered on the diencephalon level; ventral half below the brain floor in the larva; paired | sphere | `#4aa8e8` |
| ZFA:0000152 | retina | eye | Pharyngula:Prim-15 (30) | Adult (17520) | 0.05 to 0.14 | inner lining of the eye cup, medial to the lens; paired | lathe | `#3b7fc4` |
| ZFA:0000144 | retinal pigmented epithelium | retina | Pharyngula:Prim-15 (30) | Adult (17520) | 0.05 to 0.14 | outermost layer of the eye cup, between neural retina and sclera; paired | lathe | `#1a1a2e` |
| ZFA:0000035 | lens | eye | Pharyngula:Prim-15 (30) | Adult (17520) | 0.06 to 0.13 | center of the pupil, lateral pole of the eye; paired | sphere | `#cfeeff` |

### Ear

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000138 | otic placode | inner ear | Gastrula:Bud (10) | Segmentation:26+ somites (24) | 0.25 to 0.29 | surface ectoderm lateral to the hindbrain (r5), dorsolateral head; paired | ellipsoid | `#7fd8c8` |
| ZFA:0000051 | otic vesicle | inner ear | Segmentation:14-19 somites (16) | Unknown (17520) | 0.25 to 0.30 | lateral to the hindbrain at rhombomere 5, dorsal to the pharynx, under the skin; paired | ellipsoid | `#5fcfbf` |
| ZFA:0000217 | inner ear | vestibuloauditory system | Segmentation:20-25 somites (19) | Adult (17520) | 0.16 to 0.22 | lateral to the hindbrain, inside the otic capsule; utricle dorsal-anterior, saccule ventral-posterior; paired | custom | `#3fbfae` |
| ZFA:0001617 | otolith | inner ear | Segmentation:20-25 somites (19) | Adult (17520) | 0.26 to 0.30 | inside the otic vesicle lumen; anterior (utricular) otolith dorsal-anterior, posterior (saccular) otolith ventral-posterior; paired, two per ear in the embryo, three per ear in the adult | sphere | `#f5f5f5` |
| ZFA:0000431 | semicircular canal | inner ear | Pharyngula:High-pec (42) | Adult (17520) | 0.16 to 0.22 | dorsal half of the inner ear (pars superior); paired, three per ear | custom | `#2fa89a` |

### Olfactory organ

| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000048 | olfactory placode | peripheral olfactory organ | Segmentation:10-13 somites (14) | Pharyngula:Prim-5 (30) | 0.01 to 0.04 | anterior and dorsal to the forebrain, anterolateral head surface, medial to the eyes; paired | ellipsoid | `#c5e86c` |
| ZFA:0000047 | peripheral olfactory organ | olfactory system | Pharyngula:Prim-15 (30) | Adult (17520) | 0.01 to 0.04 | dorsal snout surface, anteromedial to the eyes; paired | lathe | `#a8d84a` |
| ZFA:0000130 | olfactory pit | peripheral olfactory organ | Pharyngula:Prim-15 (30) | Adult (17520) | 0.01 to 0.04 | opening on the dorsal snout, anteromedial to each eye; paired | custom | `#e9f5c9` |

## Per-structure notes

### Neural primordium (neural plate to neural tube)

#### neural plate (ZFA:0000132)

Synonyms: presumptive central nervous system. UI parent: central nervous system (ZFA:0000012); ZFA part_of: none.

Definition (ZFA): Portion of tissue that is the earliest recognizable dorsal ectodermal primordium of the central nervous system present near the end of gastrulation before infolding to form the neural keel; consists of a thickened pseudostratified epithelium.

Position: Dorsal midline from the anterior neural plate (future forebrain, near the animal pole) to the tail bud. Widest anteriorly.

Procedural shape: Thick dorsal ectodermal sheet draped on the yolk sphere from 8 to 10 hpf. Model it as a spherical-cap strip. Width is about 300 um anteriorly and tapers to about 100 um posteriorly. Thickness is 3 to 6 cells anteriorly and 1 cell posteriorly.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 75%-epiboly | 8 | length 1000, width 300, thickness 25 | estimate (no measured value found; scaled from reference images and body length); embryo diameter about 0.8 mm at 5-9 somites, https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| Bud | 10 | length 1200, width 250, thickness 30 | estimate (no measured value found; scaled from reference images and body length); cell-layer counts from Araya et al. 2016 Dev Dyn 245:197-208 https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.24304 |

Events:

- 4 hpf: Presumptive neural plate specified in the dorsal ectoderm (ZFA presumptive neural plate starts at sphere).
- 8 hpf: Neural plate recognizable as a thickened dorsal ectoderm (ZFIN start, 75%-epiboly).
- 10 hpf: Convergence toward the dorsal midline starts; the plate folds into the neural keel (Araya et al. 2016 Dev Dyn 245:197-208 https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.24304).
- 14 hpf: Plate no longer present as a separate structure (ZFIN end, 5-9 somites).

Sources: https://zfin.org/ZFA:0000132; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Araya et al. 2016 Dev Dyn 245:197-208 https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.24304

#### neural keel (ZFA:0000131)

Synonyms: presumptive central nervous system. UI parent: central nervous system (ZFA:0000012); ZFA part_of: none.

Definition (ZFA): An intermediate stage (between the neural plate and neural rod) during the early segmentation period in the morphogenesis of the central nervous system primordium; the keel is roughly triangular shaped in cross section.

Position: Runs from the anterior head (optic primordium bulges laterally from the anterior keel) to the tail bud.

Procedural shape: Solid rod with a triangular cross-section (apex ventral). Extrude a triangle of width about 80 um and height about 60 um along the dorsal midline spline. Anterior head end swells to about 150 um.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Bud | 10 | length 1300, width 80, height 60 | estimate (no measured value found; scaled from reference images and body length) |
| 5-9 somites | 12 | length 1400, width 80, height 70 | estimate (no measured value found; scaled from reference images and body length); embryo length 0.8 mm at 5-9 somites https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |

Events:

- 10 hpf: Neural keel forms by convergence of the neural plate (ZFIN start, bud).
- 11.7 hpf: Brain primordium thickened into the keel; optic primordium first distinguishable in side view (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 14 hpf: Keel rounds into the neural rod; three pronounced anterior thickenings visible (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 16 hpf: Keel stage over (ZFIN end, 10-13 somites).

Sources: https://zfin.org/ZFA:0000131; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/seg.html; Araya et al. 2016 Dev Dyn 245:197-208 https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.24304

#### neural rod (ZFA:0000133)

Synonyms: presumptive central nervous system. UI parent: central nervous system (ZFA:0000012); ZFA part_of: none.

Definition (ZFA): An intermediate stage in the development of the central nervous system present during the segmentation period; the neural rod is roughly cylindrical in shape, forms from the neural keel, and is not yet hollowed out into the neural tube.

Position: Head end shows the ten neuromere swellings; trunk portion lies above each somite pair.

Procedural shape: Solid cylinder of about 60 um diameter along the dorsal spline, without a lumen. Head end widens into a series of bulges (neuromeres).

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 5-9 somites | 12 | length 1400, diameter 60 | estimate (no measured value found; scaled from reference images and body length) |
| 14-19 somites | 16 | length 1600, diameter 65 | estimate (no measured value found; scaled from reference images and body length); embryo length 0.9 mm at 14-19 somites https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |

Events:

- 11.7 hpf: Neural rod forms from the keel (ZFIN start, 5-9 somites).
- 16 hpf: About ten neuromeres visible along the rod; rhombomeres r2 to r6 visible dorsolaterally (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 17 hpf: Neural tube closure; brain morphogenesis begins (Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/).
- 19 hpf: Rod hollows into the neural tube (ZFIN end, 14-19 somites).

Sources: https://zfin.org/ZFA:0000133; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/seg.html; Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/

#### neural tube (ZFA:0001135)

Synonyms: presumptive central nervous system. UI parent: central nervous system (ZFA:0000012); ZFA part_of: none.

Definition (ZFA): Portion of tissue that is the cavity-containing primordium of the central nervous system, developing from the neural rod in the late segmentation period.

Position: The whole central nervous system from the telencephalon to the tail tip. Brain ventricles inflate along its anterior third.

Procedural shape: Hollow tube: outer diameter about 60 to 70 um in the trunk, lumen (neurocoel) about 5 to 10 um. Anterior third swells into the three primary brain vesicles.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 14-19 somites | 16 | length 1600, diameter 65, lumen 8 | estimate (no measured value found; scaled from reference images and body length) |
| 20-25 somites | 19 | length 2000, diameter 70, lumen 10 | estimate (no measured value found; scaled from reference images and body length); embryo length 1.4 mm at 20-25 somites https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| Prim-5 | 24 | length 2400, trunkWidth 35, trunkHeight 65 | estimate (no measured value found; scaled from reference images and body length); embryo length 1.9 mm https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |

Events:

- 14 hpf: Neural tube stage begins (ZFIN start, 10-13 somites).
- 18 hpf: Brain ventricle inflation begins (Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/).
- 19 hpf: Hollowing of the rod into the tube nearly complete; ventricles present along the brain (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 22 hpf: Cerebrospinal fluid starts to fill the ventricles (Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/).
- 30 hpf: ZFIN end (prim-5); the model should switch to brain plus spinal cord terms from 24 hpf.

Sources: https://zfin.org/ZFA:0001135; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/; Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/

### Brain and spinal cord

#### brain (ZFA:0000008)

Synonyms: brain structure. UI parent: central nervous system (ZFA:0000012); ZFA part_of: ZFA:0000012.

Definition (ZFA): Cavitated compound organ which is comprised of gray and white matter and surrounds the cerebral ventricular system.

Position: From the olfactory bulbs (anterior) to the obex where the medulla becomes spinal cord (about the level of the first somite / occipital region).

Procedural shape: Union of child lobes. Larva: five lobes in a row (telencephalon, diencephalon, midbrain, cerebellum, medulla). Adult: same lobes. Add paired olfactory bulbs, paired everted telencephalic hemispheres, paired large tectal lobes, a single corpus cerebelli, and a medulla that tapers into the cord.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 600, width 200, height 200 | estimate (no measured value found; scaled from reference images and body length); head occupies about 0.3 of the 1.9 mm embryo https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| Long-pec | 48 | length 700, width 300, height 250 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 800, width 400, height 250 | about 400 x 800 x 250 um (W x L x H) at 5 dpf, about 100,000 neurons; State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745; brain volume 5.49e7 um3 at 5.5 dpf, Hildebrand et al. 2017 Nature 545:345-349 https://pmc.ncbi.nlm.nih.gov/articles/PMC5594570/ |
| Day 6 (Z-Brain) | 144 | length 1100, width 500, height 280 | Z-Brain reference stack bounding box, voxels 0.8 x 0.8 x 2 um (Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/); stack extent about 500 x 1100 x 280 um (unverified, includes olfactory epithelium and anterior spinal cord) |
| Adult | 2160 | length 4500, width 2500, thickness_min 400, thickness_max 2000 | length 4.5 mm, thickness 0.4 to 2 mm (State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745 citing Wullimann, Rupp & Reichert 1996 Neuroanatomy of the Zebrafish Brain (Birkhauser)); width 2.5 mm is an estimate; AZBA regions span 0.000026 to 0.53 mm3 (Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988) |

Events:

- 14 hpf: Brain term starts (ZFIN, 10-13 somites); four subdivisions visible by 16 hpf (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 16 hpf: About ten neuromeres: three large anterior ones and seven rhombomeres (https://zfin.org/zf_info/zfbook/stages/seg.html).
- 24 hpf: Brain sculptured into five lobes (https://zfin.org/zf_info/zfbook/stages/phar.html).
- 120 hpf: Larval brain about 800 um long; layered cerebellum and tectum present (Bae et al. 2009 Dev Biol 330:406-426 https://pubmed.ncbi.nlm.nih.gov/19371731/).
- 2160 hpf: Adult brain about 4.5 mm long (State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745).

Sources: https://zfin.org/ZFA:0000008; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar.html; Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/; Kunst et al. 2019 Neuron 103:21-38 (mapzebrain, 6 dpf) https://pubmed.ncbi.nlm.nih.gov/31147152/; Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988; Hildebrand et al. 2017 Nature 545:345-349 https://pmc.ncbi.nlm.nih.gov/articles/PMC5594570/; State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745

#### forebrain (ZFA:0000109)

Synonyms: prosencephalon. UI parent: brain (ZFA:0000008); ZFA part_of: ZFA:0000008.

Definition (ZFA): The most anterior region the brain including both the telencephalon and diencephalon.

Position: Anterior to the midbrain; the eyes attach to it through the optic stalks.

Procedural shape: Group node. Render as the union of telencephalon and diencephalon.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 250, width 180, height 200 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 300, width 250, height 230 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 350, width 320, height 250 | estimate (no measured value found; scaled from reference images and body length); scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 2000, width 1800, height 1200 | estimate (no measured value found; scaled from reference images and body length); adult brain 4.5 mm long State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745 |

Events:

- 6 hpf: Presumptive forebrain in the gastrula (ZFA presumptive forebrain, shield).
- 14 hpf: Forebrain distinguishable (ZFIN start, 10-13 somites).
- 16 hpf: Telencephalon and diencephalon are separate swellings (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).

Sources: https://zfin.org/ZFA:0000109; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html

#### telencephalon (ZFA:0000079)

Synonyms: none. UI parent: forebrain (ZFA:0000109); ZFA part_of: ZFA:0000109.

Definition (ZFA): The anterior and dorsal forebrain neuromere. In ray-finned fishes and most pronounced in teleosts the roof plate of the embryonic telencephalon extends laterally with the effect that the paired alar plates forming the hemispheric walls roll out lateroventrally in a process called eversion.

Position: Anterior to the diencephalon; olfactory bulbs at its anterior tip; sits between the two eyes in the larva.

Procedural shape: Larva: single ellipsoid with a shallow dorsal midline groove. Adult: two everted hemispheres, model as two side-by-side ellipsoids (each about 1.2 x 0.7 x 0.9 mm) fused ventrally.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 120, width 120, height 130 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 150, width 160, height 150 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 200, width 200, height 150 | estimate (no measured value found; scaled from reference images and body length); scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 1200, width 1500, height 900 | estimate (no measured value found; scaled from reference images and body length); both hemispheres; brain 4.5 mm long State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745 |

Events:

- 10.3 hpf: Presumptive telencephalon (ZFA, 1-4 somites).
- 14 hpf: Telencephalon distinguishable (ZFIN start, 10-13 somites).
- 16 hpf: Telencephalon is one of four prominent brain subdivisions (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 48 hpf: Eversion of the telencephalic roof starts; hemispheres become visible (ZFA definition; timing unverified).
- 2160 hpf: Adult everted pallium with dorsal, medial, lateral and central zones (Wullimann, Rupp & Reichert 1996 Neuroanatomy of the Zebrafish Brain (Birkhauser)).

Sources: https://zfin.org/ZFA:0000079; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Wullimann, Rupp & Reichert 1996 Neuroanatomy of the Zebrafish Brain (Birkhauser)

#### olfactory bulb (ZFA:0000402)

Synonyms: bulbus olfactorius, olfactory lobe. UI parent: telencephalon (ZFA:0000079); ZFA part_of: ZFA:0000079.

Definition (ZFA): Brain structure which is the paired anteriormost part of the telencephalon and are connected to the telencephalon by two tracts carrying secondary olfactory fibers. From Neuroanatomy of the Zebrafish Brain.

Position: Directly posterior to each olfactory pit; connected to the telencephalon by short olfactory tracts in the adult.

Procedural shape: Two small spheres at the anterior face of the telencephalon. In the adult they are distinct bulbs about 0.6 mm across on short stalks.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Long-pec | 48 | diameter 40 | estimate (no measured value found; scaled from reference images and body length); protoglomeruli appear at 48 hpf (ZFA olfactory bulb protoglomerulus) |
| Day 5 | 120 | diameter 60 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 700, width 600, height 500 | estimate (no measured value found; scaled from reference images and body length); AZBA largest region 0.53 mm3 for scale Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988 |

Events:

- 42 hpf: Olfactory bulb recognizable (ZFIN start, high-pec).
- 48 hpf: Protoglomeruli form; olfactory axons already reached the forebrain during placode stages (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/).
- 72 hpf: Dorsal and ventral bulb zones defined (ZFA zones start at protruding-mouth).

Sources: https://zfin.org/ZFA:0000402; Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/; Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988

#### diencephalon (ZFA:0000101)

Synonyms: none. UI parent: forebrain (ZFA:0000109); ZFA part_of: ZFA:0000109.

Definition (ZFA): The more posterior and ventral of two forebrain neuromeres, the other being the telencephalon; major derivatives are the eye cups, the brain pretectal region, the thalamus, hypothalamus, and epithalamus (including the habenula and epiphysis).

Position: Posterior to the telencephalon, anterior to the midbrain; eyes attach here via the optic stalks; epiphysis on its roof, pituitary under its floor.

Procedural shape: Ellipsoid wedge between telencephalon and midbrain; taller than wide in the larva. Contains the third ventricle.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 150, width 150, height 200 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 180, width 200, height 230 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 250, width 250, height 250 | estimate (no measured value found; scaled from reference images and body length); scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 1200, width 1200, height 1200 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 10.3 hpf: Presumptive diencephalon (ZFA, 1-4 somites).
- 14 hpf: Diencephalon distinguishable (ZFIN start, 10-13 somites).
- 22 hpf: Rudiments of epiphysis and hypothalamus visible in the diencephalon (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 24 hpf: Mid-diencephalic organizer active (ZFA, prim-5).

Sources: https://zfin.org/ZFA:0000101; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html

#### hypothalamus (ZFA:0000032)

Synonyms: none. UI parent: diencephalon (ZFA:0000101); ZFA part_of: ZFA:0000101.

Definition (ZFA): Multi-tissue structure which is the largest portion of diencephalon and is ventrally located. The hypothalamus arises near the end of the segmentation period and the embryonic hypothalamic region gives rise to the neurohypophysis and other diencephalic nuclei.

Position: Ventral bulge of the diencephalon; the pituitary hangs from its floor; in the adult the inferior lobes bulge ventrolaterally.

Procedural shape: Ventral ellipsoid under the diencephalon. Adult: add two lateral inferior lobes (each about 0.6 mm) so the ventral view shows a trilobed floor.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 100, width 100, height 80 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 150, width 150, height 100 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 200, width 180, height 120 | estimate (no measured value found; scaled from reference images and body length); scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 1200, width 1300, height 800 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 22 hpf: Hypothalamic rudiment visible (ZFIN start, 26+ somites; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 48 hpf: Intermediate hypothalamus defined (ZFA, long-pec).
- 72 hpf: Neurohypophysis becomes distinct under the hypothalamus (Chapman et al. 2005 J Comp Neurol 487:428-440 https://pubmed.ncbi.nlm.nih.gov/15906316/).

Sources: https://zfin.org/ZFA:0000032; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Chapman et al. 2005 J Comp Neurol 487:428-440 https://pubmed.ncbi.nlm.nih.gov/15906316/

#### hypophysis (ZFA:0000118)

Synonyms: pituitary. UI parent: diencephalon (ZFA:0000101); ZFA part_of: ZFA:0000101.

Definition (ZFA): A compound organ which is an endocrine gland located ventral to the diencephalon and derived from mixed neuroectodermal and non-neuroectodermal origin.

Position: Midline, directly under the diencephalic floor, between and slightly behind the eyes. In the adult it sits in a shallow fossa of the skull base.

Procedural shape: Small flattened ellipsoid pressed against the hypothalamic floor. Adult: oval about 0.5 x 0.35 x 0.3 mm (estimate).

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 60, width 40, height 30 | estimate (no measured value found; scaled from reference images and body length); pituitary reaches its maximum relative volume at 24 hpf (Chapman et al. 2005 J Comp Neurol 487:428-440 https://pubmed.ncbi.nlm.nih.gov/15906316/) |
| Long-pec | 48 | length 60, width 35, height 30 | estimate (no measured value found; scaled from reference images and body length); anterior and posterior domains 48 to 64 hpf (POMC-GFP) |
| Day 5 | 120 | length 80, width 50, height 40 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 500, width 350, height 300 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 19 hpf: Hypophysis term starts (ZFIN, 20-25 somites); placode cells at the anterior neural ridge.
- 24 hpf: Adenohypophysis morphologically distinct; placode cells fuse into one mass after 24 hpf (Chapman et al. 2005 J Comp Neurol 487:428-440 https://pubmed.ncbi.nlm.nih.gov/15906316/).
- 48 hpf: Adenohypophysis term starts (ZFA); hypophyseal capillary forms.
- 72 hpf: Neurohypophysis distinct (Chapman et al. 2005 J Comp Neurol 487:428-440 https://pubmed.ncbi.nlm.nih.gov/15906316/).

Sources: https://zfin.org/ZFA:0000118; Chapman et al. 2005 J Comp Neurol 487:428-440 https://pubmed.ncbi.nlm.nih.gov/15906316/

#### epiphysis (ZFA:0000019)

Synonyms: corpus pineale, pineal gland, pineal organ. UI parent: diencephalon (ZFA:0000101); ZFA part_of: ZFA:0001359.

Definition (ZFA): A circumscribed swelling, includes the pineal primordium that appears late in the segmentation period in the dorsal midline of the diencephalon. It is located directly rostral to the posterior commissure and dorsal to the habenular commissure.

Position: Dorsal roof of the diencephalon, rostral to the posterior commissure, between the eyes in dorsal view.

Procedural shape: Small sphere on the dorsal brain surface. Adult: end vesicle about 0.3 mm on a thin stalk (ZFA epiphyseal stalk from 45 dpf).

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 35 | estimate (no measured value found; scaled from reference images and body length); pineal complex anlage about 30 to 32 cells at 24 hpf (Snelson et al. 2008 Dev Dyn 237:3538-3544 https://pubmed.ncbi.nlm.nih.gov/18629869/) |
| Long-pec | 48 | diameter 45 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 60, width 45, height 40 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 300, width 200, height 150 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 14 hpf: Epiphysis term starts (ZFIN, 10-13 somites); epiphyseal cluster from 16 hpf.
- 22 hpf: Epiphysis rudiment visible (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 24 hpf: About 30 pineal complex cells; anterior cells give rise to the parapineal (Snelson et al. 2008 Dev Dyn 237:3538-3544 https://pubmed.ncbi.nlm.nih.gov/18629869/).
- 26 hpf: Parapineal migrates to the left between 24 and 32 hpf; ablation at 24 to 28 hpf gives symmetric habenulae (Lekk et al. 2019 eLife 8:e47376 https://elifesciences.org/articles/47376).
- 1080 hpf: Epiphyseal stalk elongates (ZFA, 45-89 dpf).

Sources: https://zfin.org/ZFA:0000019; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Snelson et al. 2008 Dev Dyn 237:3538-3544 https://pubmed.ncbi.nlm.nih.gov/18629869/; Lekk et al. 2019 eLife 8:e47376 https://elifesciences.org/articles/47376

#### habenula (ZFA:0000213)

Synonyms: habenulae, habenular nucleus. UI parent: diencephalon (ZFA:0000101); ZFA part_of: ZFA:0000509.

Definition (ZFA): The habenula relays impulses from limbic areas of the telencephalon to an unpaired midbrain nucleus, the interpeduncular nucleus.

Position: Two nuclei flanking the third ventricle under the pineal; the left dorsal habenula is larger with more neuropil.

Procedural shape: Two ellipsoids either side of the midline; scale the left one about 1.2x. Internal structure; visible only in cut-away or transparent brain mode.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Long-pec | 48 | length 30, width 25, height 25 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 50, width 40, height 35 | estimate (no measured value found; scaled from reference images and body length); left larger than right (unmeasured here) |
| Adult | 2160 | length 400, width 300, height 250 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 32 hpf: Left-biased habenular neurogenesis begins after parapineal migration (unverified exact hour).
- 48 hpf: Habenula term starts (ZFIN, long-pec); ventral habenula forms from 48 hpf to 4 dpf (Beretta et al. 2013 Neural Dev 8:19 https://neuraldevelopment.biomedcentral.com/articles/10.1186/1749-8104-8-19).
- 96 hpf: Dorsal habenular asymmetry established; ventral habenula complete (Beretta et al. 2013 Neural Dev 8:19 https://neuraldevelopment.biomedcentral.com/articles/10.1186/1749-8104-8-19).

Sources: https://zfin.org/ZFA:0000213; Beretta et al. 2013 Neural Dev 8:19 https://neuraldevelopment.biomedcentral.com/articles/10.1186/1749-8104-8-19; Lekk et al. 2019 eLife 8:e47376 https://elifesciences.org/articles/47376

#### midbrain (ZFA:0000128)

Synonyms: mesencephalon. UI parent: brain (ZFA:0000008); ZFA part_of: ZFA:0000008.

Definition (ZFA): The brain region between the forebrain anteriorly and the hindbrain posteriorly, including the tectum dorsally and the midbrain tegmentum ventrally.

Position: Posterior to the diencephalon, anterior to the midbrain-hindbrain boundary constriction; largest dorsal lobe in the larva.

Procedural shape: Ellipsoid with a dorsal midline groove separating the two tectal lobes; ventral half is the tegmentum. Contains the tectal ventricle.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 180, width 200, height 200 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 250, width 280, height 220 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 300, width 350, height 250 | estimate (no measured value found; scaled from reference images and body length); scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 1800, width 2200, height 1200 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 6 hpf: Presumptive midbrain (ZFA, shield).
- 14 hpf: Midbrain distinguishable (ZFIN start, 10-13 somites).
- 16 hpf: Midbrain-hindbrain boundary constriction forms (ZFA, 14-19 somites).
- 24 hpf: Optic tectum and tegmentum terms start (ZFIN, prim-5).

Sources: https://zfin.org/ZFA:0000128; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html

#### optic tectum (ZFA:0000445)

Synonyms: dorsal midbrain, mesencephalic tectum, tectal lobe, tectum, tectum opticum. UI parent: midbrain (ZFA:0000128); ZFA part_of: ZFA:0000128.

Definition (ZFA): Multi-tissue structure that is the dorsal part of the midbrain and develops from the alar plate and is the most complex layered structure in the zebrafish brain.

Position: Two dorsal lobes behind the eyes; the largest visible brain structure in a dorsal view of larva and adult.

Procedural shape: Two dorsolateral ellipsoids (one per lobe) meeting at the midline. Larva: each lobe about 300 x 150 x 120 um at 5 dpf. Adult: each lobe about 1.6 x 1.0 x 0.9 mm (estimate).

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 150, width 180, height 100 | estimate (no measured value found; scaled from reference images and body length); each lobe about 150 x 90 um |
| Long-pec | 48 | length 220, width 250, height 130 | estimate (no measured value found; scaled from reference images and body length); retinal axons arrive at the tectum from about 46 hpf (unverified) |
| Day 5 | 120 | length 300, width 320, height 150 | estimate (no measured value found; scaled from reference images and body length); both lobes; scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 1600, width 2000, height 900 | estimate (no measured value found; scaled from reference images and body length); both lobes; AZBA largest single region 0.53 mm3 Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988 |

Events:

- 24 hpf: Optic tectum term starts (ZFIN, prim-5).
- 72 hpf: First visual behaviors 68 to 80 hpf rely on retinotectal input (Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/).
- 120 hpf: Tectum supports prey capture at 5 dpf; layered neuropil present (Bae et al. 2009 Dev Biol 330:406-426 https://pubmed.ncbi.nlm.nih.gov/19371731/ for layering context).

Sources: https://zfin.org/ZFA:0000445; Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/; Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/; Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988

#### midbrain hindbrain boundary (ZFA:0000042)

Synonyms: isthmus, mhb, midbrain-hindbrain boundary. UI parent: brain (ZFA:0000008); ZFA part_of: ZFA:0000008.

Definition (ZFA): The boundary between the mesencephalon and the rhombencephalon.

Position: Deep transverse fold on the dorsal brain between the tectal lobes and the cerebellar plate; visible from outside in the embryo.

Procedural shape: Not a solid. Model it as a ring-shaped groove (a torus scaled to the brain diameter). A thin transverse marker disc at the midbrain/hindbrain junction also works.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | ringDiameter 180, grooveDepth 30 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | ringDiameter 230, grooveDepth 40 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | ringDiameter 280, grooveDepth 40 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | ringDiameter 1500, grooveDepth 150 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 8 hpf: Presumptive midbrain-hindbrain boundary (ZFA, 75%-epiboly).
- 16 hpf: Boundary and its constriction visible (ZFIN start, 14-19 somites).
- 24 hpf: Constriction requires laminin-dependent basal constriction, deepest at 24 to 30 hpf (unverified hour).

Sources: https://zfin.org/ZFA:0000042; https://zfin.org/ZFA:0007125

#### hindbrain (ZFA:0000029)

Synonyms: rhombencephalon. UI parent: brain (ZFA:0000008); ZFA part_of: ZFA:0000008.

Definition (ZFA): The most posterior of the three principal regions of the brain. In mammals and birds the hindbrain is divided into a rostral metencephalon and a caudal myelencephalon.

Position: From the midbrain-hindbrain boundary to the obex; the otic vesicle lies lateral to rhombomere 5.

Procedural shape: Tapered tube widest anteriorly; dorsal cerebellum bump at its front, thin roof plate over the fourth ventricle. Embryo: segment the tube into 7 to 8 rhombomere bulges.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 400, width 150, height 150 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 450, width 200, height 180 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 450, width 280, height 200 | estimate (no measured value found; scaled from reference images and body length); scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 1800, width 1500, height 1200 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 6 hpf: Presumptive hindbrain (ZFA, shield).
- 14 hpf: Hindbrain distinguishable; rhombomeres appear (ZFIN start, 10-13 somites).
- 16 hpf: Rhombomeres r2 to r6 visible dorsolaterally (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 19 hpf: Seven rhombomeres prominent; cerebellar rudiment first recognizable (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 22 hpf: Statoacoustic ganglion neuroblasts delaminate from the ear beside the hindbrain (https://zfin.org/zf_info/anatomy/dict/stato/stato.html).

Sources: https://zfin.org/ZFA:0000029; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html

#### cerebellum (ZFA:0000100)

Synonyms: none. UI parent: hindbrain (ZFA:0000029); ZFA part_of: ZFA:0000029.

Definition (ZFA): Brain structure derived from the anterior hindbrain, and perhaps including posterior midbrain. The cerebellum plays a role in somatic motor function, the control of muscle tone, and balance.

Position: Dorsal plate behind the midbrain-hindbrain constriction; in the adult the corpus cerebelli is a single dorsal lobe with the valvula tucked under the tectum.

Procedural shape: Larva: transverse plate (wide, short, thin). Adult: single rounded lobe (corpus cerebelli) about 1.0 x 1.2 x 0.8 mm plus lateral eminentiae granulares; valvula hidden under the tectum.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 50, width 150, height 40 | estimate (no measured value found; scaled from reference images and body length); cerebellar primordium prominent at 22 hpf https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| Long-pec | 48 | length 80, width 200, height 60 | estimate (no measured value found; scaled from reference images and body length); cerebellar plate term starts 42 hpf (ZFA) |
| Day 5 | 120 | length 120, width 250, height 80 | estimate (no measured value found; scaled from reference images and body length); layers first detectable at 5 dpf Bae et al. 2009 Dev Biol 330:406-426 https://pubmed.ncbi.nlm.nih.gov/19371731/ |
| Adult | 2160 | length 1000, width 1200, height 800 | estimate (no measured value found; scaled from reference images and body length); corpus cerebelli only |

Events:

- 19 hpf: Cerebellar rudiment first recognizable (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 22 hpf: Cerebellum term starts (ZFIN, 26+ somites); primordium prominent.
- 72 hpf: GABAergic and glutamatergic neuron differentiation begins at 3 dpf (Bae et al. 2009 Dev Biol 330:406-426 https://pubmed.ncbi.nlm.nih.gov/19371731/).
- 120 hpf: Purkinje and granule layers first detectable at 5 dpf (Bae et al. 2009 Dev Biol 330:406-426 https://pubmed.ncbi.nlm.nih.gov/19371731/).

Sources: https://zfin.org/ZFA:0000100; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Bae et al. 2009 Dev Biol 330:406-426 https://pubmed.ncbi.nlm.nih.gov/19371731/

#### medulla oblongata (ZFA:0000545)

Synonyms: none. UI parent: hindbrain (ZFA:0000029); ZFA part_of: ZFA:0000029.

Definition (ZFA): Brain structure that is located ventrocaudal to the cerebellum and just anterior to the spinal cord and contains the sensory and motor nuclei of six cranial nerves. In zebrafish, with the exception of the cerebellum, the ventral remainder of the metencephalon can be separated only arbitrarily from the more caudal myelencephalic portion of the medulla oblongata.

Position: Posterior to the cerebellum, tapering into the spinal cord at the obex; otic vesicles lie lateral to its anterior half.

Procedural shape: Truncated cone: anterior diameter about equal to the hindbrain width, posterior diameter equal to the spinal cord. Flat dorsal surface (floor of the fourth ventricle).

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 350, width 140, height 130 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 380, width 180, height 160 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 350, width 250, height 200 | estimate (no measured value found; scaled from reference images and body length); scaled from Z-Brain Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/ |
| Adult | 2160 | length 1200, width 1200, height 1000 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 24 hpf: Myelencephalic lobe visible as the fifth brain lobe (https://zfin.org/zf_info/zfbook/stages/phar.html).
- 48 hpf: Vagal and facial lobes and reticular nuclei differentiate (unverified timing).

Sources: https://zfin.org/ZFA:0000545; https://zfin.org/zf_info/zfbook/stages/phar.html

#### rhombomere (ZFA:0001064)

Synonyms: hindbrain segment, neuromere, rhombomeres. UI parent: hindbrain (ZFA:0000029); ZFA part_of: ZFA:0000029.

Definition (ZFA): A segment of the developing hindbrain.

Position: Seven (r1 to r7) or eight segments from the midbrain-hindbrain boundary to the first somite. The otic vesicle sits lateral to r5. The trigeminal ganglion lies lateral to r2.

Procedural shape: Array of 7 to 8 short barrel segments along the hindbrain tube. Each is about 50 um long at 24 hpf. Shallow constrictions separate them. Use it as a repeating texture or as separate selectable bulges.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 14-19 somites | 16 | segmentLength 40, count 5, width 120 | estimate (no measured value found; scaled from reference images and body length); r2 to r6 visible at 16 hpf https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| Prim-5 | 24 | segmentLength 50, count 7, width 150 | estimate (no measured value found; scaled from reference images and body length); seven rhombomeres https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| Long-pec | 48 | segmentLength 60, count 7, width 200 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 10 hpf: Presumptive rhombomeres 1 to 8 (ZFA, bud).
- 14 hpf: Rhombomeres visible (ZFIN start, 10-13 somites).
- 16 hpf: r2 to r6 visible in dorsolateral view (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 19 hpf: Seven rhombomeres prominent (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 72 hpf: Boundaries no longer obvious externally (estimate).

Sources: https://zfin.org/ZFA:0001064; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; https://zfin.org/zf_info/zfbook/stages/seg.html

#### spinal cord (ZFA:0000075)

Synonyms: medulla spinalis, spinal cord structure. UI parent: central nervous system (ZFA:0000012); ZFA part_of: ZFA:0000012.

Definition (ZFA): Posterior part of the central nervous system, a tube of nervous tissue dorsal to the notochord that runs from the hindbrain to the tail tip. (ZFA gives no definition; written by us.)

Position: Starts at the obex behind the medulla and runs to the tail tip above the notochord. Dorsal root ganglia sit on it segmentally from 24 hpf.

Procedural shape: Tube along the body spline, taller than wide in cross-section (oval, height about 2x width in the embryo), tapering toward the tail. Central canal about 5 um.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 1250, width 30, height 60 | estimate (no measured value found; scaled from reference images and body length); embryo length 1.9 mm https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| Long-pec | 48 | length 2200, width 35, height 70 | estimate (no measured value found; scaled from reference images and body length); embryo length 3.1 mm https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html |
| Day 5 | 120 | length 2900, width 45, height 80 | estimate (no measured value found; scaled from reference images and body length); larva about 3.9 mm (estimate from 3.5 mm at 72 hpf https://zfin.org/zf_info/zfbook/stages/larv_stgs.html) |
| Adult | 2160 | length 13000, diameter 450 | estimate (no measured value found; scaled from reference images and body length); adult SL about 18 mm Parichy et al. 2009 Dev Dyn 238:2975-3015 https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |

Events:

- 6 hpf: Presumptive spinal cord (ZFA, shield).
- 16 hpf: Rohon-Beard and trigeminal sensory axons start to cover the skin (https://zfin.org/zf_info/zfbook/stages/seg.html).
- 17 hpf: Primary motoneurons differentiate, three to four per hemisegment (https://zfin.org/zf_info/zfbook/stages/seg.html).
- 24 hpf: Spinal cord term starts (ZFIN, prim-5); dorsal root ganglia appear (ZFA).
- 48 hpf: Myelination of the cord begins around 2 to 3 dpf (unverified).

Sources: https://zfin.org/ZFA:0000075; https://zfin.org/zf_info/zfbook/stages/seg.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html; https://zfin.org/zf_info/zfbook/stages/larv_stgs.html; Parichy et al. 2009 Dev Dyn 238:2975-3015 https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

### Brain ventricles

#### forebrain ventricle (ZFA:0001259)

Synonyms: forebrain vesicle, prosencephalic ventricle. UI parent: forebrain (ZFA:0000109); ZFA part_of: ZFA:0000109.

Definition (ZFA): Fluid-filled cavity of the embryonic forebrain that later divides into the telencephalic and third ventricles. (ZFA gives no definition; written by us.)

Position: Slit-like cavity in the telencephalon opening into the taller diencephalic (third) ventricle; visible as a clear space in the live embryo.

Procedural shape: Negative space: a thin vertical slit (telencephalic part) continuous with a tall narrow diencephalic chamber. Render as a translucent inner mesh or as a cut-away.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 14-19 somites | 16 | length 80, width 15, height 60 | estimate (no measured value found; scaled from reference images and body length) |
| Prim-5 | 24 | length 200, width 40, height 150 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 250, width 50, height 180 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 16 hpf: Forebrain ventricle term starts (ZFIN, 14-19 somites); inflation begins at about 18 hpf (Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/).
- 22 hpf: Cerebrospinal fluid begins to fill the ventricles (Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/).
- 28 hpf: Directional CSF flow from diencephalic to rhombencephalic ventricle at 27 to 30 hpf (Fame et al. 2016 Fluids Barriers CNS 13:11 https://link.springer.com/article/10.1186/s12987-016-0036-z).

Sources: https://zfin.org/ZFA:0001259; Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/; Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/; Fame et al. 2016 Fluids Barriers CNS 13:11 https://link.springer.com/article/10.1186/s12987-016-0036-z

#### tectal ventricle (ZFA:0000159)

Synonyms: cerebral aqueduct, medial tectal ventricle, mesencephalic ventricle, mesencephalic vesicle, midbrain ventricle, ventriculus mesencephali. UI parent: midbrain (ZFA:0000128); ZFA part_of: ZFA:0000128.

Definition (ZFA): Fluid-filled cavity of the midbrain under the optic tectum. (ZFA gives no definition; written by us.)

Position: Wide chamber under the tectum; in the adult a narrow cleft between the tectal hemispheres and the torus.

Procedural shape: Negative space: flattened ellipsoid inside the midbrain, widest dorsally. Render as a translucent inner mesh.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 150, width 120, height 100 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 180, width 150, height 100 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 200, width 150, height 80 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 1200, width 300, height 200 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 14 hpf: Tectal ventricle term starts (ZFIN, 10-13 somites).
- 18 hpf: Ventricle inflation begins (Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/).

Sources: https://zfin.org/ZFA:0000159; Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/; Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/

#### fourth ventricle (ZFA:0000110)

Synonyms: 4th ventricle, hindbrain ventricle, rhombencephalic ventricle, rhombencephalic vesicle, ventricle IV, ventriculus rhombencephali. UI parent: hindbrain (ZFA:0000029); ZFA part_of: ZFA:0000029.

Definition (ZFA): Fluid-filled brain cavity. Most posterior brain ventricle.

Position: Diamond-shaped in dorsal view in the embryo. A thin epithelium roofs it, so it appears as a clear dorsal window between the otic vesicles.

Procedural shape: Negative space: rhombic prism (wide in the middle, pointed at both ends) with a flat floor. Its dorsal roof is a thin sheet, so it reads as an open dorsal window in the embryo.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 14-19 somites | 16 | length 150, width 60, height 40 | estimate (no measured value found; scaled from reference images and body length) |
| Prim-5 | 24 | length 350, width 120, height 80 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 400, width 150, height 90 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 400, width 180, height 80 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 1500, width 800, height 300 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 16 hpf: Fourth ventricle term starts (ZFIN, 14-19 somites).
- 18 hpf: Inflation begins (Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/).
- 24 hpf: Choroid plexus tela over the fourth ventricle (ZFA, prim-5).

Sources: https://zfin.org/ZFA:0000110; Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/; Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/

### Cranial ganglia

#### trigeminal ganglion (ZFA:0000295)

Synonyms: 5th ganglion, fifth ganglion, gV, trigeminal ganglia. UI parent: peripheral nervous system (ZFA:0000142); ZFA part_of: none.

Definition (ZFA): A prominent collection of touch-sensory neurons of the trigeminal or fifth cranial nerve, positioned beside the brain between the eye and the ear.

Position: Between the eye and the otic vesicle, lateral to rhombomere 2, just under the epidermis; its axons fan over the head skin.

Procedural shape: Small ellipsoid lateral to the anterior hindbrain, long axis anteroposterior.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 45, width 25, height 25 | estimate (no measured value found; scaled from reference images and body length); about 60 neurons (eNeuro 2025 12(5) ENEURO.0043-25.2025 (about 60 trigeminal neurons) https://www.eneuro.org/content/12/5/ENEURO.0043-25.2025) |
| Long-pec | 48 | length 55, width 30, height 30 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 70, width 40, height 35 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 400, width 250, height 200 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 10.3 hpf: Trigeminal placode and trigeminal neural crest (ZFA, 1-4 somites).
- 16 hpf: Peripheral sensory axons begin to cover the skin (https://zfin.org/zf_info/zfbook/stages/seg.html).
- 19 hpf: Trigeminal ganglion term starts (ZFIN, 20-25 somites).
- 24 hpf: Touch-evoked responses present; about 60 sensory neurons (eNeuro 2025 12(5) ENEURO.0043-25.2025 (about 60 trigeminal neurons) https://www.eneuro.org/content/12/5/ENEURO.0043-25.2025).

Sources: https://zfin.org/ZFA:0000295; https://zfin.org/zf_info/zfbook/stages/seg.html; eNeuro 2025 12(5) ENEURO.0043-25.2025 (about 60 trigeminal neurons) https://www.eneuro.org/content/12/5/ENEURO.0043-25.2025

#### statoacoustic (VIII) ganglion (ZFA:0000588)

Synonyms: auditory ganglion, gVIII, octaval ganglion, sag, statoacoustic ganglia. UI parent: peripheral nervous system (ZFA:0000142); ZFA part_of: ZFA:0001138.

Definition (ZFA): The sensory ganglion of the ear.

Position: Between the anteroventral floor of the ear and the hindbrain. By 4 dpf it sits between the ventromedial ear wall and the ventral hindbrain (https://zfin.org/zf_info/anatomy/dict/stato/stato.html).

Procedural shape: Ellipsoid tucked under the anterior half of the otic vesicle.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 40, width 25, height 20 | estimate (no measured value found; scaled from reference images and body length); loose aggregate until 28 hpf https://zfin.org/zf_info/anatomy/dict/stato/stato.html |
| Long-pec | 48 | length 60, width 35, height 30 | estimate (no measured value found; scaled from reference images and body length); compact by 48 hpf https://zfin.org/zf_info/anatomy/dict/stato/stato.html |
| Day 5 | 120 | length 80, width 45, height 40 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 500, width 300, height 250 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 22 hpf: Neuroblasts begin to delaminate from the otic floor (26-somite stage; https://zfin.org/zf_info/anatomy/dict/stato/stato.html); ZFIN start 26+ somites.
- 24 hpf: First HNK-1 positive neurons; peak delamination 22 to 30 hpf (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 42 hpf: Delamination ends (https://zfin.org/zf_info/anatomy/dict/stato/stato.html).
- 48 hpf: Ganglion compact (https://zfin.org/zf_info/anatomy/dict/stato/stato.html).

Sources: https://zfin.org/ZFA:0000588; https://zfin.org/zf_info/anatomy/dict/stato/stato.html; Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/

#### posterior lateral line ganglion (ZFA:0001314)

Synonyms: pLLg, posterior lateral line ganglia. UI parent: lateral line system (ZFA:0000034); ZFA part_of: ZFA:0000034.

Definition (ZFA): The posterior lateral line ganglion develops from a cranial ectodermal placode and contains sensory neurons that innervate the posterior lateral line system.

Position: Directly behind the otic vesicle at the origin of the posterior lateral line nerve, which runs along the horizontal myoseptum.

Procedural shape: Small ellipsoid behind the ear; add a thin tube (nerve) along the horizontal myoseptum to the tail if nerves are shown.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 35, width 20, height 20 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | length 50, width 30, height 25 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | length 60, width 35, height 30 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 350, width 200, height 180 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 14 hpf: Posterior lateral line placode (ZFA, 10-13 somites).
- 24 hpf: Ganglion term starts (ZFIN, prim-5); its axons follow the migrating primordium.

Sources: https://zfin.org/ZFA:0001314; https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html

### Lateral line

#### lateral line system (ZFA:0000034)

Synonyms: ll. UI parent: peripheral nervous system (ZFA:0000142); ZFA part_of: ZFA:0000142.

Definition (ZFA): A sensory system on the surface of the fish, consisting of small sensory patches (neuromasts) distributed in discrete lines over the body surface. The lateral line system is stimulated by local water displacements and vibrations, and detects propulsion of the fish through the water, as well as facilitating shoaling, prey capture, and predator and obstacle avoidance.

Position: Eight distinct lines in the 4 dpf larva: supraorbital, infraorbital, mandibular, opercular, otic, middle, occipital, posterior (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html).

Procedural shape: Group node. Render as arrays of neuromast discs placed on the skin along named line splines; optionally thin nerve tubes back to the ganglia.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | neuromastCount 1 | estimate (no measured value found; scaled from reference images and body length); first neuromast deposited about 24 hpf (ZFA neuromast start prim-5) |
| Long-pec | 48 | neuromastCount 10 | estimate (no measured value found; scaled from reference images and body length); primary primordium reaches the tail by about 40 to 50 hpf https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html |
| Day 4 | 96 | neuromastCount 26, lines 8 | 3 + 4 + 2 + 1 + 2 + 2 + 1 + about 11 neuromasts, https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html |
| Day 5 | 120 | neuromastCount 28, lines 8 | estimate (no measured value found; scaled from reference images and body length); eight lines with about 26 neuromasts at 4 dpf (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html) plus a few intercalary neuromasts from primII |
| Adult | 2160 | neuromastCount 1000 | adult posterior line neuromast number more than 10x the larval number through accessory neuromasts (Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/); total count estimate |

Events:

- 14 hpf: Lateral line system term starts (ZFIN, 10-13 somites); placodes form.
- 18 hpf: Posterior primordium first visible with DIC at the 18-somite stage (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html).
- 20 hpf: Primordium starts migrating caudally (Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251).
- 40 hpf: Primordium reaches the tail (about 40 hpf Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251; long-pec 50 hpf https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html).
- 96 hpf: Eight distinct lines with about 26 neuromasts (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html).
- 2160 hpf: Adult stitches and canal neuromasts; count grows more than tenfold (Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/).

Sources: https://zfin.org/ZFA:0000034; https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html; Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251; Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/

#### posterior lateral line primordium (ZFA:0001157)

Synonyms: posterior lateral line primordia. UI parent: lateral line system (ZFA:0000034); ZFA part_of: ZFA:0001471.

Definition (ZFA): A migrating group of cells originating from the posterior lateral line placode. The primordium deposits seven to nine neuromasts and interneuromasts between them during its posterior migration to the tail.

Position: Starts just posterior to the otic vesicle at 20 hpf. Leading edge over myotome 3 at 22 hpf, myotome 5 at 24 hpf, myotome 15 at 30 hpf, myotome 25 at 36 hpf. Tail tip by 40 to 50 hpf (Kimmel prim stages).

Procedural shape: Flat teardrop (about 100 x 40 x 20 um). Slide it along the horizontal myoseptum spline from apFraction 0.30 (20 hpf) to 1.0 (about 42 hpf) at 100 um/h. Drop a neuromast disc every 5 to 7 somites.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 20-25 somites | 20 | length 100, width 40, height 20, cells 100 | about 100 cells (Pinto-Teixeira et al. 2013 Front Neuroanat 7:33 https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2013.00033/full); 100 to 150 cells (Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251); dimensions estimate |
| Prim-5 | 24 | length 110, width 40, height 20 | estimate (no measured value found; scaled from reference images and body length); leading edge over myotome 5 https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| Prim-25 | 36 | length 100, width 40, height 20 | estimate (no measured value found; scaled from reference images and body length); leading edge over myotome 25 https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| Long-pec | 48 | length 80, width 35, height 20 | estimate (no measured value found; scaled from reference images and body length); primary primordium has reached the tail (Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251, https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html); secondary primordium (primII) starts at 48 hpf (ZFA:0005116) |

Events:

- 18 hpf: Primordium first visible (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html); ZFIN start 20-25 somites (19 hpf).
- 20 hpf: Migration begins; speed about 100 um/h or 1.7 myotomes/h (https://zfin.org/zf_info/zfbook/stages/phar.html).
- 24 hpf: Leading edge over myotome 5; first neuromast deposited (https://zfin.org/zf_info/zfbook/stages/phar_stgs.html).
- 42 hpf: Primary primordium reaches the tail tip and forms the terminal neuromasts (Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251; ZFIN 50 hpf https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html).
- 48 hpf: Secondary primordium (primII) starts migrating (ZFA, long-pec).
- 120 hpf: Primordium term ends (ZFIN, day 4).

Sources: https://zfin.org/ZFA:0001157; https://zfin.org/ZFA:0005115; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/phar.html; https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html; Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251; Pinto-Teixeira et al. 2013 Front Neuroanat 7:33 https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2013.00033/full

#### posterior lateral line (ZFA:0000944)

Synonyms: midbody lateral line, midtrunk line, pll. UI parent: lateral line system (ZFA:0000034); ZFA part_of: ZFA:0001471.

Definition (ZFA): One of eight distinct lateral lines in the 4-day larva. The posterior lateral line runs along the horizontal myoseptum from the otic vessicle to the caudal fin.

Position: Runs from behind the otic vesicle along the horizontal myoseptum to the caudal fin base (ZFA definition).

Procedural shape: Spline along the horizontal myoseptum. It carries 5 to 6 neuromast discs at 2 dpf (L1 to L5 plus the terminal cluster) and about 11 by 4 dpf. In the adult each site becomes a stitch of several neuromasts.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Long-pec | 48 | neuromastCount 7, spacing_um 350 | estimate (no measured value found; scaled from reference images and body length); seven to nine neuromasts and interneuromasts after the first migration (ZFA primordium definition) |
| Day 4 | 96 | neuromastCount 11 | about 11 neuromasts in dorsal and ventral rami (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html) |
| Day 5 | 120 | neuromastCount 12, spacing_um 300 | estimate (no measured value found; scaled from reference images and body length); about 11 at 4 dpf (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html) |
| Adult | 2160 | neuromastCount 300 | more than 10x the larval count (Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/); absolute number estimate |

Events:

- 42 hpf: Posterior lateral line term starts (ZFIN, high-pec).
- 48 hpf: Line complete from ear to tail; primII adds intercalary neuromasts (ZFA).
- 96 hpf: About 11 neuromasts (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html).
- 720 hpf: Post-embryonic addition and migration of neuromasts; stitches form (Parichy et al. 2009 Dev Dyn 238:2975-3015 https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/, Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/).

Sources: https://zfin.org/ZFA:0000944; https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html; Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/; Parichy et al. 2009 Dev Dyn 238:2975-3015 https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### neuromast (ZFA:0000243)

Synonyms: lateral line neuromast, lateral line organ, neuromasts. UI parent: lateral line system (ZFA:0000034); ZFA part_of: ZFA:0000034.

Definition (ZFA): Volcano-shaped lateral line sensory organ located in characteristic positions within the skin epithelium and containing hair cells and their support elements.

Position: Positions follow the eight named lines; trunk neuromasts sit on the horizontal myoseptum.

Procedural shape: Flattened dome (rosette) on the skin: 50 um diameter, 20 um tall when mature; add a small cupula cone if desired. Instance it along line splines.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 20, height 12 | estimate (no measured value found; scaled from reference images and body length); first proneuromast just deposited |
| Long-pec | 48 | diameter 30, height 15 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | diameter 50, height 20, cells 60, hairCells 20 | mature neuromast 50 um diameter, 20 um height, about 60 cells, one third hair cells (Pinto-Teixeira et al. 2013 Front Neuroanat 7:33 https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2013.00033/full) |
| Adult | 2160 | diameter 60, height 25 | estimate (no measured value found; scaled from reference images and body length); adult neuromasts cluster into stitches (Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/) |

Events:

- 22 hpf: Protoneuromast forms in the trailing primordium (ZFA, 26+ somites).
- 24 hpf: Neuromast term starts (ZFIN, prim-5).
- 48 hpf: Hair cells with kinocilia and cupulae; mechanosensitive.
- 120 hpf: Mature size reached (Pinto-Teixeira et al. 2013 Front Neuroanat 7:33 https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2013.00033/full).

Sources: https://zfin.org/ZFA:0000243; Pinto-Teixeira et al. 2013 Front Neuroanat 7:33 https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2013.00033/full; Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/

### Eye

#### optic vesicle (ZFA:0000050)

Synonyms: optic vesicles. UI parent: eye (ZFA:0000107); ZFA part_of: ZFA:0001678.

Definition (ZFA): Portion of tissue that is comprised of neuroepithelium which has pinched off from the anterior neural keel and will form the optic cup.

Position: Wing-shaped evagination from the forebrain keel; lateral to the diencephalon, dorsal to the future pharynx.

Procedural shape: Flat wing: an ellipsoid with axes about 150 (AP) x 60 (mediolateral) x 100 (DV) um. A broad stalk attaches it to the forebrain. Rotate it from horizontal to vertical between 12 and 16 hpf.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 5-9 somites | 12 | length 120, width 50, height 80, volume_um3 840000 | volume 0.84e6 um3 at 12 hpf (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/); linear dims estimate |
| 14-19 somites | 16 | length 150, width 60, height 110, volume_um3 1170000 | lateral plus medial layer 0.65e6 + 0.52e6 um3 at 16 hpf (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/); linear dims estimate |
| 20-25 somites | 19 | length 160, width 90, height 140 | estimate (no measured value found; scaled from reference images and body length); invagination under way (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/) |

Events:

- 10 hpf: Optic primordium (eye field) in the anterior neural keel (ZFA, bud).
- 11.7 hpf: Optic vesicle term starts (ZFIN, 5-9 somites); evagination at the 6-7 somite stage (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/).
- 13 hpf: Wing shape at 8-9 somites; bends ventrally at 10-12 somites (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/).
- 16 hpf: Evagination ends; invagination starts (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/); invagination from the 14-somite stage (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/).
- 22 hpf: Vesicle term ends (ZFIN, 20-25 somites); optic cup formed.

Sources: https://zfin.org/ZFA:0000050; Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/; Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/; Li, Joseph & Easter 2000 Dev Dyn 218:175-188 https://pubmed.ncbi.nlm.nih.gov/10822269/

#### optic cup (ZFA:0001202)

Synonyms: eye cup. UI parent: eye (ZFA:0000107); ZFA part_of: ZFA:0001678.

Definition (ZFA): Multi-tissue structure that is comprised of neural and non-neural epithelial layers which will form the retina and retinal pigmented epithelium of the mature eye.

Position: Cup opens laterally around the lens. The choroid fissure forms on the anterior edge. It rotates to ventral by 36 hpf (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/).

Procedural shape: Hemispherical double-walled cup (lathe profile: outer wall = future RPE, inner thick wall = future neural retina) with a ventral slit (choroid fissure). Outer diameter about 170 um at 24 hpf.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 20-25 somites | 19 | diameter 150, depth 90 | estimate (no measured value found; scaled from reference images and body length) |
| Prim-5 | 24 | diameter 170, depth 110, volume_um3 1230000 | optic cup volume 1.23e6 um3 at 24 hpf; lens is about 10% of cup volume (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/); diameter estimate |

Events:

- 16 hpf: Invagination commences from the center of the primordium (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/).
- 19 hpf: Optic cup term starts (ZFIN, 20-25 somites); choroid fissure forms at 18-20 somites (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/).
- 24 hpf: Eyecups well formed (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/); presumptive neural retina and RPE layers (ZFA, 22 to 30 hpf).
- 30 hpf: Cup term ends (ZFIN, prim-5); retina and RPE terms start (ZFIN, prim-15).

Sources: https://zfin.org/ZFA:0001202; Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/; Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/; Li, Joseph & Easter 2000 Dev Dyn 218:175-188 https://pubmed.ncbi.nlm.nih.gov/10822269/

#### eye (ZFA:0000107)

Synonyms: eyes. UI parent: visual system (ZFA:0001127); ZFA part_of: ZFA:0001114.

Definition (ZFA): Cavitated compound organ that consists of the neural retina, lens, cornea and iris and is the sensory apparatus of the visual system.

Position: Largest head organ in the embryo and larva. The gap to the otic vesicle is about 300 um at 24 hpf and about 60 um at 48 hpf (Kimmel OVL index, estimate).

Procedural shape: Sphere (slightly flattened mediolaterally) with a spherical lens protruding laterally through the pupil. Diameter 170 um at 24 hpf, about 300 um at 5 dpf, about 2.5 mm in the adult.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 170 | estimate (no measured value found; scaled from reference images and body length); optic cup volume 1.23e6 um3 (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/) |
| Long-pec | 48 | diameter 230 | estimate (no measured value found; scaled from reference images and body length); area and volume of the eye increase sevenfold from 16 to 72 hpf (Li, Joseph & Easter 2000 Dev Dyn 218:175-188 https://pubmed.ncbi.nlm.nih.gov/10822269/) |
| Protruding-mouth | 72 | diameter 270 | estimate (no measured value found; scaled from reference images and body length); image plane reaches the photoreceptors at 72 hpf (Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/) |
| Day 5 | 120 | diameter 300 | lens nodal point to photoreceptor outer segments 139.2 um and lens radius 50.7 um at 5 dpf (Haug et al. 2010 Front Zool 7:8 https://pmc.ncbi.nlm.nih.gov/articles/PMC2848032/); outer diameter computed as about 2 x (139 + 15) um |
| Adult | 2160 | diameter 2500 | estimate (no measured value found; scaled from reference images and body length); adult lens about 1 mm (Bell et al. 2014 Exp Eye Res (adult lens about 1 mm) https://pmc.ncbi.nlm.nih.gov/articles/PMC4259836/) |

Events:

- 24 hpf: Eye term starts (ZFIN, prim-5); retinal pigmentation begins (Kimmel prim-5, unverified quote).
- 36 hpf: Choroid fissure rotated to ventral (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/).
- 48 hpf: Lens fiber differentiation 36 to 48 hpf; posterior suture visible (Greiling & Clark 2009 Dev Dyn 238:2254-2265 https://pubmed.ncbi.nlm.nih.gov/19504455/, Dahm et al. 2007 Exp Eye Res 85:74-89 https://pubmed.ncbi.nlm.nih.gov/17467692/).
- 72 hpf: Focused retinal image; tracking eye movements 73 to 80 hpf; startle to light 68 to 79 hpf (Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/).
- 2160 hpf: Adult eye about 2.5 mm with a 1 mm lens (Bell et al. 2014 Exp Eye Res (adult lens about 1 mm) https://pmc.ncbi.nlm.nih.gov/articles/PMC4259836/; diameter estimate).

Sources: https://zfin.org/ZFA:0000107; Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/; Li, Joseph & Easter 2000 Dev Dyn 218:175-188 https://pubmed.ncbi.nlm.nih.gov/10822269/; Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/; Haug et al. 2010 Front Zool 7:8 https://pmc.ncbi.nlm.nih.gov/articles/PMC2848032/; Bell et al. 2014 Exp Eye Res (adult lens about 1 mm) https://pmc.ncbi.nlm.nih.gov/articles/PMC4259836/

#### retina (ZFA:0000152)

Synonyms: retinas. UI parent: eye (ZFA:0000107); ZFA part_of: ZFA:0005567.

Definition (ZFA): Multi-tissue structure that contains the retinal neural layer and the retinal pigmented epithelium, and develops from the optic cup.

Position: Hemispherical shell facing the lens; optic nerve exits at its ventronasal side through the former choroid fissure.

Procedural shape: Thick hemispherical shell (lathe). Outer radius = eye radius minus RPE thickness. Wall thickness (estimates): 60 um at 24 hpf, 90 um at 48 hpf, about 100 um at 5 dpf, 200 to 250 um in the adult.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | outerDiameter 160, thickness 60 | estimate (no measured value found; scaled from reference images and body length); neuroepithelium not yet laminated |
| Long-pec | 48 | outerDiameter 220, thickness 90 | estimate (no measured value found; scaled from reference images and body length); ganglion cell layer forming |
| Day 5 | 120 | outerDiameter 290, thickness 100 | estimate (no measured value found; scaled from reference images and body length); retinal radius about 140 to 150 um from Haug et al. 2010 Front Zool 7:8 https://pmc.ncbi.nlm.nih.gov/articles/PMC2848032/ |
| Adult | 2160 | outerDiameter 2400, thickness 220 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 22 hpf: Presumptive neural retina (inner cup layer) (ZFA, 26+ somites).
- 30 hpf: Retina term starts (ZFIN, prim-15).
- 48 hpf: First ganglion cells differentiate ventronasally about 28 to 32 hpf; lamination 48 to 72 hpf (unverified hours).
- 72 hpf: Most cell classes present in central retina by 72 to 96 hpf; outer segments appear (Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/).
- 2160 hpf: Continuous growth from the ciliary marginal zone throughout life (Marcus et al. 1999 Vis Neurosci 16:417).

Sources: https://zfin.org/ZFA:0000152; Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/; Haug et al. 2010 Front Zool 7:8 https://pmc.ncbi.nlm.nih.gov/articles/PMC2848032/

#### retinal pigmented epithelium (ZFA:0000144)

Synonyms: PRE, RPE, pigmented epithelium, pigmented retina, pigmented retinal epithelium. UI parent: retina (ZFA:0000152); ZFA part_of: ZFA:0000152.

Definition (ZFA): A monolayer of pigmented epithelium covering the neural retina; develops from the outer of the two layers of the optic cup.

Position: Covers the whole back of the eye; it is the black shell that makes the eye visible from outside from 24 hpf onward.

Procedural shape: Thin dark hemispherical shell (5 to 10 um) directly outside the retina. Drive its opacity from 0 at 22 hpf to 1 by about 36 hpf to show pigmentation.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | outerDiameter 170, thickness 8 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | outerDiameter 230, thickness 8 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | outerDiameter 300, thickness 10 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | outerDiameter 2500, thickness 15 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 22 hpf: Presumptive RPE (outer cup layer) (ZFA, 26+ somites); PE shrinks as cells move into the neural retina 14 to 24 hpf (Li, Joseph & Easter 2000 Dev Dyn 218:175-188 https://pubmed.ncbi.nlm.nih.gov/10822269/).
- 24 hpf: Melanin first appears in the RPE at the prim-5 stage (Kimmel; exact quote unverified).
- 30 hpf: RPE term starts (ZFIN, prim-15); eye clearly dark by prim-15 (unverified).
- 36 hpf: RPE fully pigmented (estimate).

Sources: https://zfin.org/ZFA:0000144; Li, Joseph & Easter 2000 Dev Dyn 218:175-188 https://pubmed.ncbi.nlm.nih.gov/10822269/; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html

#### lens (ZFA:0000035)

Synonyms: lenses. UI parent: eye (ZFA:0000107); ZFA part_of: ZFA:0005566.

Definition (ZFA): Portion of tissue that is a transparent, biconvex structure located in the eye through which light is focused.

Position: Spherical lens filling most of the pupil; it protrudes laterally beyond the eye contour in the larva.

Procedural shape: Sphere. Diameter about 63 um at 24 hpf, about 100 um at 5 dpf, 160 um at 15 dpf, 0.75 to 1 mm in adults.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | diameter 63, volume_um3 130000 | lens volume 0.13e6 um3 at 24 hpf (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/); diameter computed for a sphere |
| Long-pec | 48 | diameter 80 | estimate (no measured value found; scaled from reference images and body length); fiber differentiation 36 to 48 hpf (Greiling & Clark 2009 Dev Dyn 238:2254-2265 https://pubmed.ncbi.nlm.nih.gov/19504455/) |
| Day 5 | 120 | diameter 101 | lens radius 50.7 um at 5 dpf (Haug et al. 2010 Front Zool 7:8 https://pmc.ncbi.nlm.nih.gov/articles/PMC2848032/) |
| Day 15 | 360 | diameter 160 | 160 um at 15 dpf (Wang et al. 2020 Exp Eye Res (optical development of the zebrafish lens) https://pmc.ncbi.nlm.nih.gov/articles/PMC10666921/) |
| Adult | 2160 | diameter 900 | about 1 mm (Bell et al. 2014 Exp Eye Res (adult lens about 1 mm) https://pmc.ncbi.nlm.nih.gov/articles/PMC4259836/); 540 to 790 um in 1.3 to 1.8 year old fish (Wang et al. 2020 Exp Eye Res (optical development of the zebrafish lens) https://pmc.ncbi.nlm.nih.gov/articles/PMC10666921/) |

Events:

- 11.7 hpf: Lens placode (ZFA, 5-9 somites); first visible as a thickening at about 15 hpf (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/).
- 19 hpf: Solid lens vesicle (ZFA, 20-25 somites); round by 20 hpf (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/).
- 24 hpf: Lens pinches off from the ectoderm as a solid cell mass (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/, Dahm et al. 2007 Exp Eye Res 85:74-89 https://pubmed.ncbi.nlm.nih.gov/17467692/).
- 30 hpf: Lens term starts (ZFIN, prim-15).
- 48 hpf: Posterior suture visible (Greiling & Clark 2009 Dev Dyn 238:2254-2265 https://pubmed.ncbi.nlm.nih.gov/19504455/).
- 72 hpf: Lens optically functional; image focused on photoreceptors (Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/).

Sources: https://zfin.org/ZFA:0000035; Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/; Greiling & Clark 2009 Dev Dyn 238:2254-2265 https://pubmed.ncbi.nlm.nih.gov/19504455/; Dahm et al. 2007 Exp Eye Res 85:74-89 https://pubmed.ncbi.nlm.nih.gov/17467692/; Haug et al. 2010 Front Zool 7:8 https://pmc.ncbi.nlm.nih.gov/articles/PMC2848032/; Wang et al. 2020 Exp Eye Res (optical development of the zebrafish lens) https://pmc.ncbi.nlm.nih.gov/articles/PMC10666921/; Bell et al. 2014 Exp Eye Res (adult lens about 1 mm) https://pmc.ncbi.nlm.nih.gov/articles/PMC4259836/; Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/

### Ear

#### otic placode (ZFA:0000138)

Synonyms: none. UI parent: inner ear (ZFA:0000217); ZFA part_of: ZFA:0001138.

Definition (ZFA): Primordium of the ear epithelium before it hollows into the otic vesicle, present beside the hindbrain rudiment in the mid-segmentation period.

Position: Oval ectodermal thickening beside rhombomere 5, posterior to the eye by about five otic vesicle lengths at 24 hpf (Kimmel OVL).

Procedural shape: Flat oval plaque (about 60 x 40 x 15 um) on the lateral head surface. Thicken and hollow it into the otic vesicle at 18 hpf.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 10-13 somites | 14 | length 50, width 35, thickness 15 | estimate (no measured value found; scaled from reference images and body length) |
| 14-19 somites | 16 | length 60, width 40, thickness 20 | estimate (no measured value found; scaled from reference images and body length); placode visible at about 16 hpf (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/) |

Events:

- 10 hpf: Otic placode term starts (ZFIN, bud).
- 14 hpf: Placode visible at 9 to 14 somites (https://zfin.org/zf_info/anatomy/dict/ear/ear.html).
- 16 hpf: Placode visible at about 16 hpf (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 18 hpf: Cavitation into the otic vesicle at the 18-somite stage (https://zfin.org/zf_info/anatomy/dict/ear/ear.html, Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 24 hpf: Placode term ends (ZFIN, 26+ somites).

Sources: https://zfin.org/ZFA:0000138; https://zfin.org/zf_info/anatomy/dict/ear/ear.html; Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/

#### otic vesicle (ZFA:0000051)

Synonyms: otic capsule, otocyst, ov. UI parent: inner ear (ZFA:0000217); ZFA part_of: none.

Definition (ZFA): Epithelial sac present beside the fifth rhombomere; forms the semicircular canals dorsally and the otolith organs ventrally, and houses the acoustico-vestibular sensory epithelia (maculae) of hair cells.

Position: Clear fluid-filled oval behind the eye with two dark otoliths (anterior and posterior). The eye-to-ear gap shrinks from 5 to 0.5 vesicle lengths between 24 and 48 hpf (Kimmel OVL).

Procedural shape: Hollow ellipsoid with a thin wall (about 10 um), long axis anteroposterior. From 45 hpf grow three internal pillars (finger-like projections) that fuse by 72 hpf.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 14-19 somites | 18 | length 50, width 35, height 40 | estimate (no measured value found; scaled from reference images and body length); lumen appears at 18 hpf (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/) |
| Prim-5 | 24 | length 70, width 45, height 55 | estimate (no measured value found; scaled from reference images and body length); Kimmel OVL 5 at 24 hpf (https://zfin.org/zf_info/zfbook/stages/phar_stgs.html) |
| Long-pec | 48 | length 130, width 90, height 110 | estimate (no measured value found; scaled from reference images and body length); Kimmel OVL 1/2 at 48 hpf (https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html) |
| Protruding-mouth | 72 | length 180, width 120, height 150 | estimate (no measured value found; scaled from reference images and body length); ear grows by fluid filling during days 1 to 3 (https://zfin.org/zf_info/anatomy/dict/ear/ear.html) |

Events:

- 16 hpf: Otic vesicle term starts (ZFIN, 14-19 somites).
- 18 hpf: Lumen forms by cavitation (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 19.5 hpf: Two otoliths appear (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 24 hpf: First hair cells in two maculae under the otoliths (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 36 hpf: Endolymphatic sac evaginates from the dorsal wall (Swinburne et al. 2018 eLife 7:e37131 https://elifesciences.org/articles/37131).
- 42 hpf: 10 to 20 hair cells per macula (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/); anterior, lateral and posterior protrusions start 42 to 48 hpf (ZFA, Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/).
- 72 hpf: All three canal pillars fused (Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/).

Sources: https://zfin.org/ZFA:0000051; Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/; https://zfin.org/zf_info/anatomy/dict/ear/ear.html; https://zfin.org/zf_info/zfbook/stages/phar_stgs.html; https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html; Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/; Swinburne et al. 2018 eLife 7:e37131 https://elifesciences.org/articles/37131

#### inner ear (ZFA:0000217)

Synonyms: ear, otic capsule, otocyst. UI parent: vestibuloauditory system (ZFA:0001138); ZFA part_of: ZFA:0001138.

Definition (ZFA): The auditory (hearing) and vestibular (balance) organ of the fish, equivalent to the inner ear of amniotes.

Position: Behind the eye and lateral to the medulla; in the adult it is enclosed by the prootic, pterotic, sphenotic and exoccipital bones.

Procedural shape: Compound: an ellipsoidal vestibule (utricle + saccule) with three semicircular canal tori (anterior, posterior, lateral) on the pars superior. The lagena is a small ventral-posterior pouch from 15 dpf.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-5 | 24 | length 70, width 45, height 55 | estimate (no measured value found; scaled from reference images and body length); same body as the otic vesicle at this stage (ZFIN inner ear starts at 19 hpf and overlaps the otic vesicle term) |
| Long-pec | 48 | length 130, width 90, height 110 | estimate (no measured value found; scaled from reference images and body length); same body as the otic vesicle at this stage |
| Day 5 | 120 | length 250, width 170, height 220 | estimate (no measured value found; scaled from reference images and body length); canals complete by 3 dpf, pars inferior grows 5 to 20 dpf (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/) |
| Day 30 | 720 | length 500, width 350, height 450 | estimate (no measured value found; scaled from reference images and body length); adult ear is nearly five times the larval size (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/) |
| Adult | 2160 | length 2300, width 1500, height 2000 | about 2.3 mm long in a 2-year-old fish (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/); width and height estimate |

Events:

- 19 hpf: Inner ear term starts (ZFIN, 20-25 somites).
- 72 hpf: Three semicircular canals formed by 3 dpf (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/).
- 168 hpf: About 80 hair cells per macula between 3 and 7 dpf (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 360 hpf: Lagenar macula with differentiated hair cells by 15 dpf (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/).
- 2160 hpf: Adult ear about 2.3 mm long with three otoliths (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/, https://zfin.org/zf_info/anatomy/dict/oto/otolith.html).

Sources: https://zfin.org/ZFA:0000217; Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/; Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/; https://zfin.org/zf_info/anatomy/dict/oto/otolith.html

#### otolith (ZFA:0001617)

Synonyms: immature otolith, immature otoliths, statolith. UI parent: inner ear (ZFA:0000217); ZFA part_of: ZFA:0000051.

Definition (ZFA): Portion of organism substance composed of calcium carbonate located in the otolith organ and positioned over a sensory macula; two form in each vesicle during the late segmentation period.

Position: Two dark spheres at the anterior and posterior poles of the otic vesicle. The anterior one becomes the lapillus and the posterior one the sagitta (https://zfin.org/zf_info/anatomy/dict/oto/otolith.html).

Procedural shape: Two spheres per ear tethered to the maculae. Adult: three flattened discs (sagitta about 1 mm, lapillus about 0.6 mm, asteriscus about 0.5 mm; estimates).

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 20-25 somites | 19.5 | diameter 5 | estimate (no measured value found; scaled from reference images and body length); visible only with Nomarski optics at 19 hpf (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html) |
| Prim-5 | 24 | diameter 12 | estimate (no measured value found; scaled from reference images and body length); easily seen at 22 hpf (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html); free particles gone after 24 hpf (https://zfin.org/zf_info/anatomy/dict/oto/otolith.html) |
| Long-pec | 48 | diameter 25 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | anteriorDiameter 40, posteriorDiameter 55 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | sagittaLength 1000, lapillusLength 600, asteriscusLength 500 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 18 hpf: Otolith term starts at 18 hpf (https://zfin.org/zf_info/anatomy/dict/oto/otolith.html); ZFIN start 20-25 somites.
- 18.5 hpf: Particles coalesce into two otoliths (https://zfin.org/zf_info/anatomy/dict/oto/otolith.html); two otoliths by 19.5 hpf (Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/).
- 22 hpf: Two otoliths easily seen in each vesicle (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 24 hpf: Growth by accretion; distinct shapes during the larval period (https://zfin.org/zf_info/anatomy/dict/oto/otolith.html).
- 360 hpf: Third otolith (asteriscus) forms over the lagena about 15 dpf (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/, timing of otolith unverified).

Sources: https://zfin.org/ZFA:0001617; https://zfin.org/zf_info/anatomy/dict/oto/otolith.html; Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/

#### semicircular canal (ZFA:0000431)

Synonyms: scc, semicircular canals, semicircular duct. UI parent: inner ear (ZFA:0000217); ZFA part_of: ZFA:0005409.

Definition (ZFA): Fluid-filled semicircular tubes, arranged orthogonally to each other in the inner ear. Each canal is associated with a crista that detects angular accelerations.

Position: Anterior and posterior canals are vertical and meet dorsally in the common crus; the lateral canal is horizontal at the level of the utricle.

Procedural shape: Three tori (tube radius about 15 um in the larva, about 100 um in the adult) arranged orthogonally on the dorsal vestibule. Between 45 and 72 hpf, animate three finger-like projections that grow into the vesicle and fuse into pillars. The canals are the spaces left around the pillars.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| High-pec | 45 | projectionLength 30 | estimate (no measured value found; scaled from reference images and body length); projections begin at 45 hpf (https://zfin.org/zf_info/anatomy/dict/semi_canal/semi.html) |
| Long-pec | 48 | projectionLength 45, tubeDiameter 20 | estimate (no measured value found; scaled from reference images and body length); anterior and posterior projections growing at 48 hpf (Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/) |
| Protruding-mouth | 72 | loopDiameter 90, tubeDiameter 25 | estimate (no measured value found; scaled from reference images and body length); pillars fused at 72 hpf (Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/) |
| Day 5 | 120 | loopDiameter 120, tubeDiameter 30 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | loopDiameter 1200, tubeDiameter 200 | estimate (no measured value found; scaled from reference images and body length); adult ear 2.3 mm long (Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/) |

Events:

- 42 hpf: Semicircular canal term starts (ZFIN, high-pec).
- 45 hpf: Epithelial projections push into the vesicle (https://zfin.org/zf_info/anatomy/dict/semi_canal/semi.html, Waterman & Bell 1984 Anat Rec 210:101-114 https://pubmed.ncbi.nlm.nih.gov/6486477/).
- 50 hpf: Lateral projection with anterior and posterior bulges present (Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/).
- 57 hpf: Anterior and posterior projections fuse with their bulges 57 to 68 hpf (Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/); fusion between long-pec and pec-fin (https://zfin.org/zf_info/anatomy/dict/semi_canal/semi.html).
- 72 hpf: All three pillars fused; canals continue to elongate (Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/).

Sources: https://zfin.org/ZFA:0000431; https://zfin.org/zf_info/anatomy/dict/semi_canal/semi.html; Waterman & Bell 1984 Anat Rec 210:101-114 https://pubmed.ncbi.nlm.nih.gov/6486477/; Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/; Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/; Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/

### Olfactory organ

#### olfactory placode (ZFA:0000048)

Synonyms: olfactory placodes. UI parent: peripheral olfactory organ (ZFA:0000047); ZFA part_of: ZFA:0001149.

Definition (ZFA): Neurogenic placode that gives rise to the olfactory neurons that which convey odor information to the CNS.

Position: Two ectodermal thickenings at the anterior edge of the neural plate, later at the anterior borders of the eyes (Kimmel long-pec).

Procedural shape: Flat oval plaque (about 50 x 35 x 20 um) on the snout surface; hollow it into a pit at 30 hpf.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| 14-19 somites | 16 | length 40, width 30, thickness 15 | estimate (no measured value found; scaled from reference images and body length) |
| Prim-5 | 24 | length 50, width 35, thickness 25 | estimate (no measured value found; scaled from reference images and body length); placodes thickened at 22 hpf (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html) |

Events:

- 10 hpf: Olfactory field at the anterolateral neural plate edge converges anteriorly (Whitlock & Westerfield 2000 Development 127:3645-3653 https://pubmed.ncbi.nlm.nih.gov/10934010/).
- 14 hpf: Olfactory placode term starts (ZFIN, 10-13 somites).
- 22 hpf: Placodes thicken anterior and dorsal to the forebrain (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- 24 hpf: Axons grow into the forebrain while epidermis still covers the placode (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/).
- 30 hpf: Placode term ends (ZFIN, prim-5); pit opens.

Sources: https://zfin.org/ZFA:0000048; https://zfin.org/zf_info/zfbook/stages/seg_stgs.html; Whitlock & Westerfield 2000 Development 127:3645-3653 https://pubmed.ncbi.nlm.nih.gov/10934010/; Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/

#### peripheral olfactory organ (ZFA:0000047)

Synonyms: nasal sac, nose. UI parent: olfactory system (ZFA:0001149); ZFA part_of: ZFA:0001149.

Definition (ZFA): Organ that is the specialized structure of the face that contains olfactory neurons. The peripheral olfactory organ is paired.

Position: Paired nasal sacs on the dorsal snout; in the adult each has an incurrent and an excurrent nostril separated by a skin flap.

Procedural shape: Shallow bowl (lathe) sunk into the snout surface; adult: sac about 1 mm with a rosette of radial lamellae and two nostrils.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-15 | 30 | diameter 45, depth 20 | estimate (no measured value found; scaled from reference images and body length) |
| Long-pec | 48 | diameter 60, depth 35 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | diameter 80, depth 50 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 1000, width 700, depth 400 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 30 hpf: Peripheral olfactory organ and olfactory pit terms start (ZFIN, prim-15).
- 31 hpf: Epidermis separates to form the pit; dendrites grow out (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/; exact hour unverified).
- 72 hpf: Olfactory rosette term starts (ZFA, protruding-mouth); lamellae form slowly during larval life (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/).
- 2160 hpf: Adult rosette with midline raphe and lamellae; incurrent and excurrent nostrils (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/).

Sources: https://zfin.org/ZFA:0000047; Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/

#### olfactory pit (ZFA:0000130)

Synonyms: nasal canal, nasal cavity, nasal pit, olfactory cavity. UI parent: peripheral olfactory organ (ZFA:0000047); ZFA part_of: ZFA:0000047.

Definition (ZFA): Depression on the snout that opens from the olfactory placode and holds the olfactory epithelium. (ZFA gives no definition; written by us.)

Position: Round depression on the snout in the larva; becomes the nasal cavity with two nostrils in the adult.

Procedural shape: Negative space: a bowl-shaped depression cut into the peripheral olfactory organ. About 30 um across at 36 hpf and about 60 um at 5 dpf. A ring of kinocilia surrounds the rim from 2 dpf.

Sizes:

| Stage | hpf | Dimensions (um unless stated) | Source |
|---|---|---|---|
| Prim-25 | 36 | diameter 30, depth 15 | estimate (no measured value found; scaled from reference images and body length); pits form at about 31 to 36 hpf (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/) |
| Long-pec | 48 | diameter 45, depth 25 | estimate (no measured value found; scaled from reference images and body length) |
| Day 5 | 120 | diameter 60, depth 40 | estimate (no measured value found; scaled from reference images and body length) |
| Adult | 2160 | length 900, width 600, depth 350 | estimate (no measured value found; scaled from reference images and body length) |

Events:

- 30 hpf: Olfactory pit term starts (ZFIN, prim-15).
- 31 hpf: Pit opens as the epidermis separates (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/; hour unverified).
- 48 hpf: Olfactory rod cells present in pits from 36 hpf, consistently beyond 46 hpf (unverified secondary).
- 2160 hpf: Nasal cavity with incurrent and excurrent nostrils (Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/).

Sources: https://zfin.org/ZFA:0000130; Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/

## Open questions

- I found no published micrometer measurements for the otic vesicle at 24 and 48 hpf, the spinal cord cross-section, the embryonic brain ventricles, the pineal, the pituitary, or the adult brain regions. All such rows are estimates. A quick calibration pass on a few reference images (ZFIN stage photographs, Z-Brain, AZBA) would replace them.

- ZFIN's server refused connections during part of this session, so I could not open every term page. Term ids, names, stages and definitions come from the local dump (release 2026-07-16), which is the same data.

- The hypophysis and epiphysis are also endocrine organs in ZFA. The endocrine specialist may list them too; keep one record per id when merging.

- The olfactory placode start (14 hpf), the otic placode start (10 hpf) and the inner ear start (19 hpf) in ZFIN mark specification, not visibility. The JSON adds `visibleFromHpf` for these three plus the medulla oblongata.

- Eye and lens sizes between 24 and 72 hpf are computed from volumes (Kwan et al. 2012) and from 5 dpf optics (Haug et al. 2010). Direct diameters for 48 and 72 hpf are estimates.

