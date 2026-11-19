# 05. Morphometrics of the zebrafish across development

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

This document collects body dimensions that drive the procedural geometry of the atlas. All times are hours post fertilization (hpf) at 28.5 C unless a row says otherwise. Days post fertilization (dpf) convert as dpf x 24 = hpf.

Each number carries a source key from the list in section 1. A value marked "(estimate)" is my reading of published images or a derivation from a sourced ratio. A value marked "(unverified)" comes from a search summary or a secondary page that I could not open in this session. Use estimates as starting parameters and replace them when a measurement appears.

Abbreviations used below: embryo length (EL), standard length (SL), total length (TL), head-trunk angle (HTA). Also: otic vesicle length (OVL), height at anterior of anal fin (HAA), Zebrafish Information Network (ZFIN), Zebrafish Stage Ontology (ZFS).

## 1. Sources

| Key | Source | URL |
|---|---|---|
| K95 | Kimmel CB et al. 1995. Stages of embryonic development of the zebrafish. Dev Dyn 203:253-310. Read through the ZFIN staging pages. | https://doi.org/10.1002/aja.1002030302 and https://zfin.org/zf_info/zfbook/stages/index.html |
| K95-zyg | ZFIN zygote period page | https://zfin.org/zf_info/zfbook/stages/zygote.html |
| K95-blast | ZFIN blastula period and stage pages | https://zfin.org/zf_info/zfbook/stages/blast.html and https://zfin.org/zf_info/zfbook/stages/blast_stgs.html |
| K95-gast | ZFIN gastrula period and stage pages | https://zfin.org/zf_info/zfbook/stages/gast.html and https://zfin.org/zf_info/zfbook/stages/gast_stgs.html |
| K95-seg | ZFIN segmentation period and stage pages | https://zfin.org/zf_info/zfbook/stages/seg.html and https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| K95-phar | ZFIN pharyngula period and stage pages | https://zfin.org/zf_info/zfbook/stages/phar.html and https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| K95-hatch | ZFIN hatching stage pages | https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html |
| K95-larv | ZFIN larval stage pages | https://zfin.org/zf_info/zfbook/stages/larv_stgs.html |
| ZFS | ZFS stage ontology table (local file stage_ontology.txt) | https://zfin.org/zf_info/zfbook/stages/index.html |
| P09 | Parichy DM et al. 2009. Normal table of postembryonic zebrafish development. Dev Dyn 238:2975-3015. Read from the lab PDF. | https://doi.org/10.1002/dvdy.22113 and https://www.parichylab.org/_files/ugd/cef927_6f60f8bad77c487693ad2f754c87c568.pdf |
| SH14 | Singleman C, Holtzman NG. 2014. Growth and maturation in the zebrafish. Zebrafish 11:396-406. | https://doi.org/10.1089/zeb.2014.0976 and https://europepmc.org/article/PMC/PMC4108942 |
| M19 | Mosaliganti KR et al. 2019. Size control of the inner ear via hydraulic feedback. eLife 8:e39596. | https://elifesciences.org/articles/39596 |
| S08 | Schroter C et al. 2008. Dynamics of zebrafish somitogenesis. Dev Dyn 237:545-553. | https://doi.org/10.1002/dvdy.21458 |
| V23 | Venuto A et al. 2023. Initial swim bladder inflation in larval zebrafish is mediated by the lateral line. J Exp Biol 226:jeb245635. | https://europepmc.org/article/PMC/PMC9882242 |
| PLoS26 | Importance of developmental stage and microenvironment control in zebrafish larvae cardiovascular studies. PLoS One 2026. | https://pmc.ncbi.nlm.nih.gov/articles/PMC13262856/ |
| JEB24 | A larval zebrafish model of cardiac physiological recovery following cardiac arrest. 2024. | https://europepmc.org/article/PMC/PMC11413934 |
| BMC08 | Denvir MA et al. 2008. Systolic and diastolic ventricular function in zebrafish embryos. BMC Biotechnol 8:21. | https://europepmc.org/article/PMC/PMC2291041 |
| T25 | Temperature-dependence of early development of zebrafish. PLoS One 2025. | https://europepmc.org/article/PMC/PMC12755749 |
| PK19 | Impact of post-hatching maturation on the pharmacokinetics of paracetamol in zebrafish larvae. 2019. Cites larval volumes from earlier work. | https://europepmc.org/article/PMC/PMC6377609 |
| Tox19 | Subtle morphometric effects in larval zebrafish exposed to PFHxA, PFHxS and 6:2 FTOH. Toxics 2019. Control values. | https://pmc.ncbi.nlm.nih.gov/articles/PMC6396680/ |
| W20 | Wang K et al. 2020. Optical development in the zebrafish eye lens. FASEB J. | https://pmc.ncbi.nlm.nih.gov/articles/PMC10666921/ |
| C14 | Collery RF et al. 2014. Measurement of zebrafish axial length and other eye dimensions using SD-OCT. PLoS One. | https://pmc.ncbi.nlm.nih.gov/articles/PMC4205002/ |
| R15 | Randlett O et al. 2015. Whole-brain activity mapping onto a zebrafish brain atlas. Nat Methods 12:1039-1046. | https://europepmc.org/article/PMC/PMC4710481 |
| AZBA | Kenney JW et al. 2021. A 3D adult zebrafish brain atlas. eLife 10:e69988. | https://elifesciences.org/articles/69988 |
| E13 | Ellis K et al. 2013. Notochord vacuoles are lysosome-related organelles. J Cell Biol 200:667-679. | https://europepmc.org/article/PMC/PMC3587825 |
| KV18 | Dasgupta A et al. 2018. Cell volume changes contribute to epithelial morphogenesis in zebrafish Kupffer's vesicle. eLife 7:e30963. | https://elifesciences.org/articles/30963 |
| FB19 | Contractile acto-myosin belt promotes growth anisotropy in early pectoral fin development. bioRxiv 512038. | https://www.biorxiv.org/content/10.1101/512038.full.pdf |
| CF19 | Swimming capability of zebrafish is governed by water temperature, caudal fin length and genetic background. Sci Rep 2019. | https://europepmc.org/article/PMC/PMC6841939 |
| G14 | Gilbert MJH et al. 2014. Zebrafish as a model for the study of aging and exercise. Exp Gerontol 50:106-113. | https://doi.org/10.1016/j.exger.2013.11.013 |
| BR24 | Comparative study of the growth of four wild-type zebrafish lines. Biol Res 2024. | https://europepmc.org/article/PMC/PMC11411999 |
| DM18 | Dabrowski K, Miller M. 2018. Contested paradigm in raising zebrafish. Zebrafish 15:295-309. Summarizes growth curves from other labs. | https://pmc.ncbi.nlm.nih.gov/articles/PMC6037192/ |
| GR10 | Gomez-Requeni P et al. 2010. A reference growth curve for nutritional experiments in zebrafish. Fish Physiol Biochem 36:1199-1215. | https://doi.org/10.1007/s10695-010-9400-0 |
| SK22 | Dynamics of the zebrafish skeleton in three dimensions during juvenile and adult development. Front Physiol 2022. | https://pmc.ncbi.nlm.nih.gov/articles/PMC9204358/ |
| FBase | FishBase species summary for Danio rerio | https://www.fishbase.se/summary/Danio-rerio.html |
| HT16 | On the dynamic suction pumping of blood cells in tubular hearts. arXiv 1610.03427. | https://arxiv.org/abs/1610.03427 |
| Wal05 | Wallace KN et al. 2005. Intestinal growth and differentiation in zebrafish. Mech Dev 122:157-173. | https://doi.org/10.1016/j.mod.2004.10.009 |

## 2. Egg, chorion, yolk cell, and blastoderm (0 to 10 hpf)

| Measurement | Value | Stage (hpf) | Source |
|---|---|---|---|
| Zygote diameter (yolk cell plus blastodisc) | 0.7 mm | 1-cell (0) | K95-zyg |
| Chorion outer diameter after swelling | about 1.2 mm (estimate). A device patent quotes 1.5 +/- 0.3 mm for the embryo inside its chorion (unverified). | 0 to 48 | estimate |
| Chorion thickness | 1.5 to 10 um (unverified) | 0 to 48 | search summary |
| Blastodisc height at 1-cell | about 0.2 mm (estimate) | 0 to 0.75 | estimate |
| Blastodisc width at 1-cell | about 0.6 mm (estimate) | 0 to 0.75 | estimate |
| Blastoderm thickness | about 4 deep-cell layers under a flattened enveloping layer | 30%-epiboly (4.66) | K95-blast |
| Epiblast thickness | about 3 cells | germ ring (5.66) | K95-gast |
| Hypoblast thickness | 1 to 2 cells | shield (6) | K95-gast |
| Deep cell layer thickness at 30%-epiboly | about 60 um (estimate from 4 cells of about 15 um) | 4.66 | estimate |
| Blastoderm thickness at 90%-epiboly | about 40 um outside the axis (estimate) | 9 | estimate |
| Embryonic shield width | about 30 degrees of longitude of the germ ring | shield (6) | K95-gast |
| Yolk cell diameter | about 0.65 mm (estimate; the blastoderm is thin and the zygote is 0.7 mm) | 4 to 10 | estimate |
| Embryo length at 5-9 somites | about 0.8 mm, "the same as the zygote" | 11.66 | K95-seg |

Cleavage cell cycles last about 15 minutes each (K95, cleavage period). The 2-cell stage begins at 0.75 hpf and the 64-cell stage at 2.0 hpf (ZFS). I did not find measured blastodisc heights per cleavage stage. The model can hold the blastodisc as a cap of constant volume that flattens from high stage (3.33 hpf) to sphere stage (4 hpf) (K95-blast, qualitative).

## 3. Epiboly versus time

| Stage | hpf (ZFS start) | Epiboly (percent of yolk cell covered) | Source |
|---|---|---|---|
| Dome | 4.33 | epiboly begins, yolk bulges toward the animal pole | K95-blast, ZFS |
| 30%-epiboly | 4.66 | 30 | ZFS, K95 |
| 50%-epiboly | 5.25 | 50 | ZFS, K95 |
| Germ ring | 5.66 | 50 (margin pauses about one hour) | K95-gast |
| Shield | 6.0 | 50 | K95-gast |
| 75%-epiboly | 8.0 | 75 | ZFS, K95 |
| 90%-epiboly | 9.0 | 90 | ZFS, K95 |
| Bud | 10.0 | 100 | ZFS, K95 |

After the shield stage the margin advances at about 15 percent of the yolk cell per hour (K95-gast). Between 6 and 10 hpf this gives 50 to 100 percent, which matches the ZFS times.

## 4. Somite number and size

| hpf | Somite pairs | Source |
|---|---|---|
| 10.33 | 1 | ZFS, K95-seg |
| 11.66 | 5 | ZFS |
| 14.0 | 10 | ZFS |
| 16.0 | 14 | ZFS |
| 18.0 | 18 | K95-seg ("18 somites are present at 18 h") |
| 19.0 | 20 | ZFS |
| 22.0 | 26 | ZFS |
| 24.0 | about 30, 13 of them in the tail | K95-phar |
| about 26 | 30 to 34 (final count) | K95-seg |

Rates: the first 5 to 6 somites form at about 3 per hour, later somites at about 2 per hour (K95-seg). Schroter et al. report that the period is constant along the trunk and lengthens in the tail (S08 abstract). A search summary of S08 quotes 2.7 +/- 0.3 somites per hour at 28.5 C (unverified). Newly formed somites measure about 50 um along the axis between somites 6 and 14, and later somites are shorter (S08, from a search summary; unverified).

Myotome height is not tabulated in these sources. Use the trunk depth in section 8 minus the notochord and neural tube as an estimate.

## 5. Body length

### 5.1 Embryo length by stage (K95 Table 1, read from ZFIN)

EL is the greatest linear dimension of the fixed embryo, measured without straightening (K95). For curled embryos EL is shorter than the axis length.

| Stage | hpf | EL (mm) | Source |
|---|---|---|---|
| 5-9 somites | 11.66 | about 0.8 | K95-seg |
| 14-19 somites | 16 | 0.9 | K95 |
| 20-25 somites | 19 | 1.4 | K95 |
| 26+ somites | 22 | 1.6 | K95 |
| Prim-5 | 24 | 1.9 | K95 |
| Prim-15 | 30 | 2.5 | K95 |
| Prim-25 | 36 | 2.7 | K95 |
| High-pec | 42 | 2.9 | K95 |
| Long-pec | 48 | 3.1 | K95 |
| Pec-fin | 60 | 3.3 | K95 |
| Protruding-mouth | 72 | 3.5 (total body length) | K95 |
| Day 4 | 96 | 3.7 | K95 |
| Day 5 | 120 | 3.9 | K95 |
| Day 6 | 144 | 4.2 | K95 |
| Days 7-13 | 168 | 4.5 | K95 |
| Days 14-20 | 336 | 6.2 | K95 |
| Days 21-29 | 504 | 7.8 | K95 |
| Days 30-44 | 720 | 10 | K95 |
| Days 45-89 | 1080 | 14 | K95 |

Independent checks: T25 reports a mean body length of 3.90 +/- 0.12 mm at 120 hpf at 28 C. A second series in the same study gave a median of 3.46 mm. Control larvae in Tox19 measured 3.97 to 4.44 mm total length at 5 dpf. The same larvae reached only 4.60 to 4.76 mm at 14 dpf under slow growth.

### 5.2 Standard length versus age after hatching

Growth after 5 dpf depends on food, density and temperature more than on age (P09, SH14). The table lists several published curves so that the app can offer a slow, a typical and a fast track.

| dpf | SL or TL (mm) | Condition | Source |
|---|---|---|---|
| 3 | 3.5 | TL, staging series | K95 |
| 5 | 3.9 | TL, staging series | K95 |
| 5 | 3.5 (SL at posterior swim bladder inflation, pSB) | P09 reference individual | P09 |
| 7 to 13 | 4.5 | TL, staging series | K95 |
| 14 to 20 | 6.2 | TL, staging series | K95 |
| 16 | 6.8 | SL, 28 C, low density | GR10 as quoted in DM18 |
| 16 | 12 to 13 | rotifer-fed, 27 to 29.5 C, fast track | DM18 |
| 21 to 29 | 7.8 | TL, staging series | K95 |
| 30 | 6.3 | SL, 28 C, slow track (Barrionuevo et al.) | quoted in DM18 |
| 30 | 16 | SL, 28 C, fast track | GR10 as quoted in DM18 |
| 30 to 44 | 10 | TL, staging series | K95 |
| 45 | 12 (start of juvenile period) | SL, AB, 28 C | SH14 |
| 45 to 89 | 14 | TL, staging series | K95 |
| about 60 | 12 (most 12 mm SL fish were 2 months old) | SL, lab stock | SK22 |
| 90 | 18 (start of adult period) | SL, AB, 28 C | SH14 |
| 120 to 150 | 16 (4 to 5 months) | SL, lab stock | SK22 |
| 180 to 270 | 24 (6 to 9 months) | SL, lab stock | SK22 |
| 240 to 360 | 28.4 +/- 0.75 | AB young adults, 8 to 12 months (unverified) | G14 |
| 450 to 600 | 31.6 +/- 1.17 | AB middle-aged, 15 to 20 months (unverified) | G14 |
| maximum | 38 | SL, species maximum | FBase |

P09 measured growth rates across rearing conditions. Larvae grew 0.45 +/- 0.009 mm SL per day at 24 C and 0.54 +/- 0.011 at 33 C. They grew 0.48 +/- 0.006 at high density and 0.55 +/- 0.006 at low density. Larvae reared alone and anesthetized repeatedly grew 0.32 +/- 0.004 mm per day. The K95 series implies about 0.2 mm per day between 3 and 5 dpf and about 0.1 mm per day between 14 and 45 dpf. Sexual maturity appears at 17.5 +/- 0.6 mm SL in males and 18.3 +/- 0.7 mm SL in females (P09).

### 5.3 Postembryonic milestones by SL (P09 reference individuals)

| Milestone | Code | SL (mm) |
|---|---|---|
| Posterior swim bladder inflated | pSB | 3.5 |
| Early notochord flexion | FLe | 4.5 |
| Caudal fin rays appear | CR | 4.9 |
| Anal fin condensation | AC | 5.4 |
| Dorsal fin condensation | DC | 5.7 |
| Metamorphic melanophores appear | MMA | 5.9 |
| Anterior swim bladder lobe inflated | aSB | 6.0 |
| Anal fin rays appear | AR | 6.2 |
| Dorsal fin rays appear | DR | 6.4 |
| Flexion complete, final angle 45 degrees | FL | 6.5 |
| Pelvic fin bud appears | PB | 7.2 |
| Pelvic fin rays appear | PR | 8.5 |
| Posterior squamation begins | SP | 9.8 |
| Anterior squamation begins | SA | 10.4 |
| Juvenile (squamation complete) | J | 11.0 |
| Juvenile plus | J+ | 13.0 |
| Adult female reference images | A(f) | 23 and 26 |

SH14 phenotype boundaries agree. Larval fins are fin folds without rays at 4.0 to 6.0 mm SL. Tail fin rays emerge at 5.5 to 7.0 mm SL. Forking begins at 12.5 to 19.0 mm SL. Adult fin ray patterns appear above 19.0 mm SL.

## 6. Head, eye, lens, and otic vesicle

| Measurement | hpf | Value | Source |
|---|---|---|---|
| Otic vesicle volume (tissue plus lumen) | 16 | 235 +/- 16 pl, equivalent sphere diameter about 77 um | M19 |
| Otic vesicle radius | 30 | 36.2 +/- 0.92 um | M19 |
| Otic vesicle volume | 45 | 807 +/- 23 pl, equivalent sphere diameter about 115 um | M19 |
| Otic vesicle lumen volume | 45 | 440 +/- 18 pl | M19 |
| Otic vesicle wall thickness | 16 to 28 | 20 um falling to 4 um in non-sensory regions | M19 |
| Otic vesicle lumen pressure | 30 to 48 | 100 Pa rising to above 300 Pa | M19 |
| Kupffer's vesicle diameter | 11 to 16 | 20 to 80 um over its lifetime (unverified) | KV18 via search summary |
| Eye diameter | 24 | about 0.20 mm (estimate) | estimate |
| Eye diameter | 48 | about 0.26 mm (estimate) | estimate |
| Eye diameter | 72 | about 0.30 mm (estimate) | estimate |
| Eye diameter | 120 | about 0.33 mm (estimate) | estimate |
| Lens diameter | 24 | about 60 um (estimate) | estimate |
| Lens diameter | 48 | about 95 um (estimate) | estimate |
| Lens diameter | 72 | about 115 um (estimate) | estimate |
| Lens diameter | 120 | about 135 um (estimate) | estimate |
| Lens diameter | 360 (15 dpf) | 160 um | W20 |
| Lens diameter | after 471 dpf | plateau near 750 um | W20 |
| Lens diameter | 648 to 880 dpf | about 790 um | W20 |
| Head length (snout to rear of otic vesicle) | 24 | about 0.45 mm (estimate) | estimate |
| Head length | 48 | about 0.60 mm (estimate) | estimate |
| Head length | 120 | about 0.80 mm (estimate) | estimate |
| Head length, adult | about 25 percent of SL (estimate) | estimate |

Eye axial length, lens diameter and focal distance grow fastest in the first 3 months and keep growing after that (C14). After hatching, depth at nape, snout to operculum distance and eye diameter grow in near-linear proportion to one another (P09, data not shown in that paper). The pharyngula stage pages give relative head sizes in dorsal view. The yolk ball is about twice as wide as the head at prim-15. It is about 1.3 times as wide at prim-25 and at high-pec (K95-phar).

The OVL staging index is the distance between the eye and the otic vesicle in otic vesicle lengths. It falls from 5 at prim-5 to 3 at prim-15, 1 at prim-25, 3/4 at high-pec and 1/2 at long-pec (K95-phar, K95-hatch).

## 7. Yolk ball and yolk extension

The sources give relative rules more often than absolute sizes. The rules below are sourced. The absolute values are estimates that satisfy the rules.

| Stage | hpf | Rule from K95 | Yolk ball diameter (mm) | Yolk extension length x diameter (mm) |
|---|---|---|---|---|
| 14-19 somites | 16 | yolk has a kidney-bean shape | 0.60 (estimate) | forming |
| 20-25 somites | 19 | extension length is more than half the yolk ball diameter | 0.58 (estimate) | 0.35 x 0.22 (estimate) |
| 26+ somites | 22 | extension nearly as long as the yolk ball | 0.56 (estimate) | 0.50 x 0.22 (estimate) |
| Prim-5 | 24 | extension length equals the greatest yolk ball diameter | 0.55 (estimate) | 0.55 x 0.20 (estimate) |
| Prim-15 | 30 | extension just longer than the yolk ball; ball twice the head width | 0.52 (estimate) | 0.58 x 0.18 (estimate) |
| Prim-25 | 36 | extension markedly longer than the ball; ball 1.3 times head width | 0.48 (estimate) | 0.65 x 0.16 (estimate) |
| High-pec | 42 | extension about 1.5 times the ball diameter | 0.46 (estimate) | 0.69 x 0.14 (estimate) |
| Long-pec | 48 | ball volume equals head volume; extension tapers to a cone | 0.44 (estimate) | 0.65 x 0.14 tapering to 0.05 (estimate) |
| Protruding-mouth | 72 | yolk still visible under the gut | 0.35 (estimate) | 0.4 x 0.08 (estimate) |
| Day 5 | 120 | yolk sac area 0.29 to 0.31 mm2 in lateral view (Tox19) | 0.25 (estimate) | absent |
| Day 6 to 7 | 144 to 168 | yolk depleted, larva feeds | 0 | absent |

The first heartbeat begins at a median of 25 hpf and hatching at a median of 60 hpf at 28 C (T25).

## 8. Trunk and tail: depth, width, notochord, myotomes, gut

| Measurement | hpf or SL | Value | Source |
|---|---|---|---|
| Total larval volume | 72 | 253 nL | PK19, citing earlier work |
| Total larval volume | 96 | 263 nL | PK19 |
| Total larval volume | 120 | 300 nL | PK19 |
| Body depth at anus (excluding fin fold) | 24 | about 0.22 mm (estimate) | estimate |
| Body depth at anus | 48 | about 0.27 mm (estimate) | estimate |
| Body depth at anus | 120 | about 0.30 mm (estimate) | estimate |
| Body half-width at anus | 120 | about 0.12 mm (estimate; consistent with 300 nL over 3.9 mm) | estimate |
| HAA versus SL | SL above 6 mm | SL = 3.56 x HAA + 4.40, R2 0.98, valid for HAA above 0.5 mm | P09 |
| HAA at 6.2 mm SL | 14 to 20 dpf | 0.51 mm (from the regression) | P09 |
| HAA at 10 mm SL | 30 to 44 dpf | 1.57 mm (from the regression) | P09 |
| HAA at 14 mm SL | 45 to 89 dpf | 2.70 mm (from the regression) | P09 |
| HAA at maturity | 17.5 to 18.3 mm SL | 3.64 +/- 0.21 mm (males), 3.95 +/- 0.12 mm (females) | P09 |
| Notochord vacuole diameter | 24 and later | up to 40 um | E13 |
| Vacuole inflation period | 17 to 21 | inner cells change from discs to spheroids | E13 |
| Notochord diameter | 24 | about 40 um (estimate) | estimate |
| Notochord diameter | 72 | about 65 um (estimate) | estimate |
| Notochord flexion (posterior tip bends dorsally) | 4.5 to 6.5 mm SL | final angle 45 degrees | P09 |
| Newly formed somite length | 12 to 20 | about 50 um (unverified) | S08 |
| Myotome length along the axis | 120 | about 90 um (estimate: about 30 myotomes over 2.8 mm) | estimate |
| Intestine | 6 to 19 dpf | diameter doubles or triples; length grows about 700 um from 5 to 19 dpf (unverified) | Wal05 via search summary |
| Intestine diameter | 120 | about 60 um (estimate) | estimate |

Fixation shrinks SL by about 0.29 mm; P09 adds 0.29 mm to fixed lengths and SH14 follows the same correction.

## 9. Heart

| Measurement | hpf | Value | Source |
|---|---|---|---|
| Heart tube diameter | 26 to 30 | about 50 um (unverified) | HT16 |
| Heart tube length | 24 | about 0.25 mm (estimate) | estimate |
| Heartbeat onset | 25 (median at 28 C) | first contractions | T25 |
| First contractions | 17-somite stage | trunk muscle, described under 20-25 somites | K95-seg |
| Cardiac looping | 28 to 55 | S-shape by about 40 hpf | eLife 61733, https://elifesciences.org/articles/61733 |
| Heart rate | 24 | 106 +/- 14 bpm | PLoS26 |
| Heart rate | 42 | about 180 bpm | K95-phar |
| Heart rate | 48 | 137 +/- 8 bpm | PLoS26 |
| Heart rate | 72 | 171 +/- 6 bpm at 27 C, 205 +/- 11 bpm at 28 C | PLoS26 |
| Heart rate | 78 to 80 | 177 +/- 5 to 178 +/- 8 bpm | PLoS26 |
| Heart rate | 72 | 276 +/- 22 bpm at 28 C (different method), 136 +/- 8 bpm at 22 C | BMC08 |
| Heart rate | 120 to 168 | 188 +/- 5 bpm at 28 C, about 190 bpm over 80 h | JEB24 |
| Stroke volume, cardiac output | 120 to 168 | 0.20 +/- 0.001 nL, 35.5 +/- 2.2 nL per min | JEB24 |
| Heart rate | 48, 72, 96, 120 at 22 C | 141, 147, 166, 172 bpm | BMC08 |

Ventricle dimensions at 48 to 120 hpf were not tabulated in the open sources I could read. A ventricle with a 0.20 nL stroke volume and about 50 percent ejection fraction has an end-diastolic volume near 0.4 nL. That volume matches an ellipsoid of about 120 x 80 x 80 um (estimate).

## 10. Swim bladder

| Measurement | Age | Value | Source |
|---|---|---|---|
| Posterior chamber inflation | 96 to 120 hpf | inflated in most larvae by 4 to 5 dpf | V23, P09 (pSB at 3.5 to 3.7 mm SL) |
| Posterior chamber volume | 120 to 144 hpf | 0.0058 mm3 (SD 0.00043) at 6 dpf; 0.0066 +/- 0.0009 mm3 at 5 to 6 dpf | V23 |
| Equivalent ellipsoid | 120 hpf | about 0.38 x 0.18 x 0.18 mm (derived from the volume) | derived |
| Anterior chamber appears | 6.0 mm SL (about 14 to 20 dpf) | small bulge anterodorsal to the posterior lobe | P09 |
| Posterior lobe shape | above 6 mm SL | lengthens and bends ventrally at its posterior end | P09 |
| Adult swim bladder | adult | two chambers; the anterior chamber is the larger one in adults (estimate). Lengths about 5 and 4 mm at 28 mm SL (estimate) | estimate |

The swim bladder keeps the fish within 1.7 percent of neutral buoyancy through larval development (Lindsey et al. 2010, Zebrafish 7:85-96, https://doi.org/10.1089/zeb.2009.0616).

## 11. Fins

| Measurement | hpf or SL | Value | Source |
|---|---|---|---|
| Pectoral fin bud first visible | 28 to 29 | mounds lateral to somite 3 | K95-phar |
| Pectoral bud proximodistal length | 30 | 34.7 +/- 6 um (unverified) | FB19 |
| Pectoral bud dorsoventral x anteroposterior | 32 | 85 +/- 5 x 116 +/- 10 um (unverified) | FB19 |
| Pectoral bud dorsoventral x anteroposterior | 44 | 79 +/- 5 x 135 +/- 12 um (unverified) | FB19 |
| Pectoral bud proximodistal length | 46 | 72.2 +/- 12 um (unverified) | FB19 |
| Pectoral bud height to base ratio | 30 | less than 1/3 | K95-phar |
| Pectoral bud height to base ratio | 36 | about 3/4 | K95-phar |
| Pectoral bud height to base ratio | 42 | about 1 | K95-phar |
| Pectoral bud height to base ratio | 48 | about 2 | K95-hatch |
| Pectoral fin extent | 60 | covers more than half of the yolk ball when held back | K95-hatch |
| Pectoral fin length | 120 | about 0.35 mm (estimate) | estimate |
| Median fin fold height, dorsal | 24 | about 0.08 mm (estimate) | estimate |
| Median fin fold height, dorsal | 48 | about 0.15 mm (estimate) | estimate |
| Median fin fold height, dorsal and ventral | 120 | about 0.2 mm (estimate) | estimate |
| Caudal fin rays appear | 4.9 mm SL | first lepidotrichia | P09 |
| Caudal fin lobes emerge | 6.4 mm SL | dorsal and ventral lobes | P09 |
| Fin fold loss | 7.4 to 10 mm SL | fin fold reduced to about one third of the tail by 8.3 mm SL and almost lost by 10 mm SL | P09 |
| Pelvic fin bud | 7.2 mm SL | appears on the ventrolateral body wall | P09 |
| Adult caudal fin length | 6 to 9 months | AB 6.1 +/- 0.3 mm, TU 5.6 +/- 0.3 mm, WIK 6.5 +/- 0.3 mm | CF19 |
| Adult caudal fin length, long-fin strains | 6 to 9 months | TL 16.5 +/- 0.5 mm, PET 20.0 +/- 0.6 mm | CF19 |
| Adult pectoral fin length | adult | about 5 mm (estimate) | estimate |
| Adult dorsal fin height | adult | about 4 mm (estimate) | estimate |
| Adult fin ray counts | above 19 mm SL | 18 to 24 tail rays, 12 to 14 anal rays, 8 to 10 dorsal rays | SH14 |

## 12. Brain

| Measurement | Age | Value | Source |
|---|---|---|---|
| Larval brain volume | 6 dpf | "less than half a cubic millimeter" | R15 |
| Larval neuron count | 6 dpf | about 100,000 | R15 |
| Z-Brain voxel size | 6 dpf | about 0.8 x 0.8 x 2 um | R15 |
| Larval brain bounding box | 6 dpf | about 1.1 x 0.5 x 0.3 mm (length x width x height) (estimate from the atlas stack) | estimate |
| Adult brain imaging resolution | 15 to 16 weeks | 3.25 um in plane, 4 um steps | AZBA |
| Adult brain region volumes | 15 to 16 weeks | 0.000026 to 0.53 mm3 per region | AZBA |
| Adult brain length | adult | about 4.5 mm (unverified) | search summary |
| Adult brain bounding box | adult | about 4.5 x 2.5 x 2.0 mm (estimate) | estimate |

## 13. Adult body

| Measurement | Value | Source |
|---|---|---|
| SL at sexual maturity | 17.5 mm (males), 18.3 mm (females) | P09 |
| Adult stage threshold | 18 mm SL at about 90 dpf | SH14 |
| Typical laboratory adult SL | 25 to 32 mm (G14 gives 28.4 and 31.6 mm; unverified) | G14 |
| Species maximum | 3.8 cm SL | FBase |
| Body mass | 0.42 +/- 0.04 g at 8 to 12 months; 0.62 +/- 0.09 g at 15 to 20 months (unverified) | G14 |
| Body mass, slower stock at 27 C | AB 0.20 to 0.21 g at 157 dpf | BR24 |
| Total length | SL plus caudal fin of about 6 mm, so TL is about 1.2 x SL | CF19 |
| Body depth (dorsal to ventral, deepest point) | about 0.23 x SL, so about 6.5 mm at 28 mm SL (estimate) | estimate |
| Body width (left to right, widest point) | about 0.13 x SL, so about 3.6 mm at 28 mm SL (estimate) | estimate |
| Head length | about 0.25 x SL (estimate) | estimate |
| Fineness ratio (SL divided by depth) | about 4.3 (estimate) | estimate |
| Eye diameter | about 2 mm (estimate; lens 0.75 to 0.79 mm, W20) | estimate |

A microCT study (bioRxiv 10.1101/2025.09.19.677450) reports automated SL, dorsoventral height and fineness ratio for 131 adults. The page was rate limited during this session, so the values are not included. That paper is the best next source for adult depth and width.

## 14. Rates

| Rate | Value | Source |
|---|---|---|
| Cleavage cell cycle | about 15 min | K95 |
| Epiboly after shield | about 15 percent per hour | K95-gast |
| Somite formation | 3 per hour (first 5 to 6), then 2 per hour | K95-seg |
| Lateral line primordium migration | 100 um per hour, about 1.7 myotomes per hour | K95-phar |
| Axis elongation, 16 to 19 hpf | 0.5 mm in 3 h (EL 0.9 to 1.4 mm) | K95 |
| Axis elongation, 24 to 48 hpf | 1.2 mm in 24 h, about 0.05 mm per hour | K95 |
| Growth, 3 to 5 dpf | about 0.2 mm per day | K95 |
| Growth, larval to juvenile | 0.32 to 0.55 mm SL per day by condition | P09 |
| Heart rate | 106 bpm at 24 hpf to about 190 bpm at 5 dpf, 28 C | PLoS26, JEB24 |

## 15. Body posture over time

Kimmel defines HTA as the angle between a line through the ear and eye centers and a line along the trunk notochord. The embryo straightens between 20 and 70 hpf, and HTA falls over that interval.

| Stage | hpf | HTA (degrees) | Source |
|---|---|---|---|
| Prim-5 | 24 | 120 | K95-phar |
| Prim-15 | 30 | 95 | K95-phar |
| Prim-25 | 36 | 75 | K95-phar |
| High-pec | 42 | 55 | K95-phar |
| Long-pec | 48 | 45 | K95-hatch |
| Pec-fin | 60 | 35 (estimate from the trend; two reads of the ZFIN page returned 55, which breaks the monotonic series) | K95-hatch, flagged |
| Protruding-mouth | 72 | 25 | K95-larv |
| Day 5 and later | 120+ | about 20 (estimate; the head axis stays slightly ventral of the trunk axis) | estimate |

Axis wrap around the yolk. I define the wrap angle as the arc of the yolk sphere that the body axis follows, measured at the yolk center. Values are estimates from the staging images.

| Stage | hpf | Wrap angle (degrees) | Notes | Source |
|---|---|---|---|---|
| Bud | 10 | about 180 | head at the animal pole, tail bud at the closed margin near the vegetal pole | estimate from K95-gast |
| 5-9 somites | 11.66 | about 200 | axis lengthens; EL still about 0.8 mm | estimate; K95-seg |
| 14-19 somites | 16 | about 240 | yolk becomes kidney-bean shaped as the tail bud pushes against it | estimate; K95-seg |
| 20-25 somites | 19 | tail free | tail lifts from the yolk and the yolk extension separates from the ball; EL jumps to 1.4 mm | K95-seg |
| 26+ somites | 22 | tail free, curled ventrally | tail curls under the yolk extension | estimate; K95 images |
| Prim-5 | 24 | head bent 120 degrees to trunk | trunk and tail almost straight | K95-phar |
| Prim-15 | 30 | 95 degrees | rapid straightening ends about 31 to 32 hpf | K95-phar |
| Long-pec | 48 | 45 degrees | body straight behind the head | K95-hatch |

Yolk shape changes in steps (K95-seg, K95-phar, K95-hatch, T25). The yolk is a sphere until about 14 somites. It is kidney-bean shaped at 14 to 19 somites. It is a ball plus an extension from 20 somites. The extension equals the ball diameter at 24 hpf and 1.5 times the ball diameter at 42 hpf. The extension tapers to a cone by 48 hpf. The yolk shrinks to a small ventral mass by 5 dpf and is gone by 6 to 7 dpf.

Notochord flexion after hatching: the posterior notochord tip bends dorsally between 4.5 and 6.5 mm SL to a final angle of 45 degrees (P09). This sets the adult caudal fin base.

## 16. Parametric body model

### 16.1 Coordinate frame

Place the body axis along +X from snout (apFraction 0) to tail tip (apFraction 1). Dorsal is +Y. The spine spline is a Catmull-Rom curve through control points at fixed apFractions. Each control point holds four values in millimeters. Dorsal offset is the distance from the spine to the dorsal skin, without fin fold. Ventral offset is the distance from the spine to the ventral skin, without yolk. Half-width is the distance from the spine to the lateral skin. Fin fold height is the membrane beyond the skin, dorsal and ventral. A separate list holds the yolk ellipsoid, the swim bladder ellipsoid and the eye spheres. The renderer sweeps a superellipse cross-section along the spline and applies a bend for posture.

Interpolate between stage keyframes on hpf. Interpolate lengths linearly in log(hpf) after 72 hpf because growth slows with age.

### 16.2 Period 1: yolk sphere with a cap (0 to 10 hpf)

Parameters: yolk radius R (0.35 mm at 0 hpf, K95-zyg), chorion radius 0.6 mm (estimate), epiboly fraction f (section 3), cap thickness t, blastodisc height h.

| Stage | hpf | f | t (mm) | h (mm) | Notes |
|---|---|---|---|---|---|
| 1-cell | 0 | 0 | none | 0.20 (estimate) | disc on the animal pole |
| 64-cell | 2 | 0 | none | 0.25 (estimate) | mound of blastomeres |
| High | 3.33 | 0 | none | 0.30 (estimate) | tallest mound, then flattens |
| Sphere | 4 | 0.15 (estimate) | 0.12 (estimate) | 0.15 | flat interface, whole embryo spherical |
| Dome | 4.33 | 0.20 (estimate) | 0.10 (estimate) | | yolk domes 0.05 mm into the cap (estimate) |
| 30%-epiboly | 4.66 | 0.30 | 0.06 (estimate) | | uniform cup |
| Shield | 6 | 0.50 | 0.05 (estimate) | | add a dorsal thickening 30 degrees wide (K95-gast) and 0.08 mm thick (estimate) |
| 75%-epiboly | 8 | 0.75 | 0.045 (estimate) | | dorsal side thicker |
| 90%-epiboly | 9 | 0.90 | 0.04 (estimate) | | axis rudiment visible |
| Bud | 10 | 1.00 | 0.035 (estimate) | | tail bud at the vegetal pole |

### 16.3 Period 2: axis wrapped on the yolk (10 to 22 hpf)

Model the axis as a tube of total length L along a great-circle arc on the yolk sphere, starting at the animal pole. Wrap angle comes from section 15. From 19 hpf the last 30 percent of the axis leaves the sphere tangentially and the yolk extension follows the trunk (section 7).

| Stage | hpf | Axis length L (mm) | Trunk radius (mm) | Somites |
|---|---|---|---|---|
| Bud | 10 | 1.0 (estimate) | 0.06 (estimate) | 0 |
| 5-9 somites | 11.66 | 1.2 (estimate; EL 0.8) | 0.08 (estimate) | 5 to 9 |
| 14-19 somites | 16 | 1.5 (estimate; EL 0.9) | 0.10 (estimate) | 14 to 19 |
| 20-25 somites | 19 | 1.8 (estimate; EL 1.4) | 0.11 (estimate) | 20 to 25 |
| 26+ somites | 22 | 2.0 (estimate; EL 1.6) | 0.11 (estimate) | 26 to 30 |

Add the head as an ellipsoid at apFraction 0. Its radii are 0.20 x 0.18 x 0.18 mm at 16 hpf and 0.25 x 0.22 x 0.22 mm at 22 hpf (estimate). Eyes are spheres of 0.12 mm diameter at 16 hpf and 0.18 mm at 22 hpf (estimate). The otic vesicle is a sphere of 0.08 mm at 16 hpf (M19, derived from 235 pl) and 0.10 mm at 22 hpf (interpolated).

### 16.4 Period 3 onward: free-swimming outline keyframes

Values are millimeters. Rows are apFraction. The outline excludes yolk and fin fold, which are listed under each table. All values in this subsection are estimates constrained by the sourced lengths (section 5), HTA (section 15), HAA (section 8) and the yolk rules (section 7).

Prim-5, 24 hpf, axis length 2.0 mm (EL 1.9 mm, K95), HTA 120 degrees.

| ap | dorsal | ventral | halfWidth | finFold |
|---|---|---|---|---|
| 0.00 | 0.05 | 0.05 | 0.05 | 0 |
| 0.10 | 0.18 | 0.16 | 0.18 | 0 |
| 0.20 | 0.20 | 0.15 | 0.17 | 0 |
| 0.30 | 0.14 | 0.10 | 0.10 | 0.04 |
| 0.40 | 0.12 | 0.09 | 0.08 | 0.06 |
| 0.50 | 0.11 | 0.08 | 0.07 | 0.07 |
| 0.60 | 0.10 | 0.08 | 0.06 | 0.08 |
| 0.70 | 0.09 | 0.07 | 0.05 | 0.08 |
| 0.80 | 0.08 | 0.06 | 0.04 | 0.08 |
| 0.90 | 0.06 | 0.05 | 0.03 | 0.07 |
| 1.00 | 0.02 | 0.02 | 0.01 | 0.05 |

Yolk ball: center at ap 0.30, 0.22 mm below the spine, radius 0.27 mm. Yolk extension: cone from ap 0.40 to ap 0.68, radius 0.10 mm tapering to 0.07 mm. Eyes: spheres of 0.20 mm at ap 0.10, centers 0.12 mm lateral. Otic vesicle: sphere of 0.10 mm at ap 0.22. Heart: tube 0.25 x 0.05 mm under the head at ap 0.20.

Long-pec, 48 hpf, axis length 3.1 mm (K95), HTA 45 degrees.

| ap | dorsal | ventral | halfWidth | finFold |
|---|---|---|---|---|
| 0.00 | 0.06 | 0.06 | 0.06 | 0 |
| 0.10 | 0.22 | 0.20 | 0.22 | 0 |
| 0.20 | 0.24 | 0.18 | 0.20 | 0 |
| 0.30 | 0.16 | 0.12 | 0.11 | 0.06 |
| 0.40 | 0.14 | 0.11 | 0.09 | 0.10 |
| 0.50 | 0.13 | 0.10 | 0.08 | 0.13 |
| 0.60 | 0.12 | 0.10 | 0.07 | 0.15 |
| 0.70 | 0.11 | 0.09 | 0.06 | 0.15 |
| 0.80 | 0.09 | 0.08 | 0.05 | 0.14 |
| 0.90 | 0.07 | 0.06 | 0.03 | 0.12 |
| 1.00 | 0.02 | 0.02 | 0.01 | 0.08 |

Yolk ball: center at ap 0.27, 0.25 mm below the spine, radius 0.22 mm (volume near the head volume, K95-hatch). Yolk extension: cone from ap 0.36 to ap 0.57, radius 0.07 tapering to 0.02 mm. Eyes 0.26 mm at ap 0.10. Otic vesicle 0.12 mm at ap 0.21 (M19 at 45 hpf gives 0.115 mm). Pectoral fin bud: ellipsoid 0.14 x 0.08 x 0.07 mm at ap 0.24 (height to base ratio 2, K95-hatch). Heart: two chambers, each about 0.10 mm, at ap 0.18.

Protruding-mouth, 72 hpf, axis length 3.5 mm (K95), HTA 25 degrees.

| ap | dorsal | ventral | halfWidth | finFold |
|---|---|---|---|---|
| 0.00 | 0.08 | 0.08 | 0.07 | 0 |
| 0.10 | 0.24 | 0.22 | 0.24 | 0 |
| 0.20 | 0.26 | 0.20 | 0.21 | 0 |
| 0.30 | 0.17 | 0.14 | 0.12 | 0.08 |
| 0.40 | 0.15 | 0.13 | 0.10 | 0.13 |
| 0.50 | 0.14 | 0.11 | 0.09 | 0.17 |
| 0.60 | 0.13 | 0.10 | 0.07 | 0.19 |
| 0.70 | 0.12 | 0.09 | 0.06 | 0.19 |
| 0.80 | 0.10 | 0.08 | 0.05 | 0.17 |
| 0.90 | 0.07 | 0.06 | 0.03 | 0.14 |
| 1.00 | 0.02 | 0.02 | 0.01 | 0.10 |

Yolk: ellipsoid 0.40 x 0.30 x 0.30 mm at ap 0.28 under the gut. Swim bladder: not inflated. Eyes 0.30 mm. Pectoral fin: blade 0.25 x 0.15 mm held back along the body (covers more than half the yolk ball, K95-hatch). Mouth at the anterior tip, level with the eye.

Day 5, 120 hpf, TL 3.9 mm (K95), SL about 3.6 mm (estimate), HTA about 20 degrees.

| ap | dorsal | ventral | halfWidth | finFold |
|---|---|---|---|---|
| 0.00 | 0.10 | 0.10 | 0.08 | 0 |
| 0.10 | 0.26 | 0.24 | 0.26 | 0 |
| 0.20 | 0.28 | 0.22 | 0.22 | 0 |
| 0.30 | 0.19 | 0.16 | 0.13 | 0.08 |
| 0.40 | 0.17 | 0.15 | 0.12 | 0.14 |
| 0.50 | 0.16 | 0.13 | 0.10 | 0.18 |
| 0.60 | 0.15 | 0.11 | 0.08 | 0.20 |
| 0.70 | 0.13 | 0.10 | 0.07 | 0.20 |
| 0.80 | 0.11 | 0.08 | 0.05 | 0.18 |
| 0.90 | 0.08 | 0.06 | 0.03 | 0.15 |
| 1.00 | 0.02 | 0.02 | 0.01 | 0.12 |

Yolk: small ellipsoid 0.25 x 0.15 x 0.15 mm at ap 0.30 (Tox19 area 0.3 mm2 includes the gut region). Swim bladder: ellipsoid 0.38 x 0.18 x 0.18 mm at ap 0.33, 0.05 mm above the gut (V23 volume). Eyes 0.33 mm. Pectoral fin 0.35 x 0.20 mm. Gut: tube 0.06 mm diameter from ap 0.22 to ap 0.62 (anus at ap 0.62, estimate). Brain: 1.1 x 0.5 x 0.3 mm from ap 0.02 to ap 0.30 (estimate).

14 to 20 dpf, SL 6.2 mm (K95 TL 6.2 mm; treat as SL for the model), HAA 0.51 mm (P09).

| ap | dorsal | ventral | halfWidth | finFold |
|---|---|---|---|---|
| 0.00 | 0.15 | 0.15 | 0.12 | 0 |
| 0.10 | 0.45 | 0.40 | 0.40 | 0 |
| 0.20 | 0.50 | 0.42 | 0.38 | 0 |
| 0.30 | 0.42 | 0.40 | 0.30 | 0.10 |
| 0.40 | 0.38 | 0.36 | 0.26 | 0.15 |
| 0.50 | 0.34 | 0.30 | 0.22 | 0.20 (anal fin rays appear at 6.2 mm SL, P09) |
| 0.60 | 0.30 | 0.21 | 0.18 | 0.25 |
| 0.70 | 0.25 | 0.17 | 0.14 | 0.20 |
| 0.80 | 0.20 | 0.14 | 0.10 | 0.15 |
| 0.90 | 0.15 | 0.11 | 0.06 | 0.10 |
| 1.00 | 0.05 | 0.05 | 0.02 | caudal fin 0.9 mm long with two lobes (P09, lobes at 6.4 mm SL) |

Swim bladder: posterior lobe 0.9 x 0.4 x 0.4 mm at ap 0.35; anterior lobe appears at 6.0 mm SL (P09). Eyes 0.55 mm (lens 0.16 mm at 15 dpf, W20). Notochord flexion complete at 6.5 mm SL with the tip at 45 degrees (P09).

30 to 44 dpf, SL 10 mm (K95), HAA 1.57 mm (P09 regression).

| ap | dorsal | ventral | halfWidth | finFold |
|---|---|---|---|---|
| 0.00 | 0.25 | 0.25 | 0.20 | 0 |
| 0.10 | 0.80 | 0.75 | 0.65 | 0 |
| 0.20 | 0.95 | 0.85 | 0.65 | 0 |
| 0.30 | 0.95 | 0.90 | 0.60 | dorsal fin 0.8 mm at ap 0.45 to 0.60 |
| 0.40 | 0.90 | 0.85 | 0.55 | |
| 0.50 | 0.85 | 0.72 | 0.48 | anal fin 0.8 mm at ap 0.55 to 0.75 |
| 0.60 | 0.75 | 0.55 | 0.40 | |
| 0.70 | 0.60 | 0.42 | 0.30 | |
| 0.80 | 0.45 | 0.35 | 0.22 | |
| 0.90 | 0.35 | 0.30 | 0.14 | |
| 1.00 | 0.10 | 0.10 | 0.05 | caudal fin 1.8 mm, forked |

Scales cover the body from 9.8 to 11 mm SL (P09). Pelvic fin buds appear at 7.2 mm SL and rays at 8.5 mm SL (P09).

Adult, SL 28 mm (G14, unverified), TL about 34 mm, depth about 6.5 mm and width about 3.6 mm (estimates).

| ap | dorsal | ventral | halfWidth | fins |
|---|---|---|---|---|
| 0.00 | 0.6 | 0.6 | 0.5 | |
| 0.10 | 2.4 | 2.2 | 1.6 | |
| 0.20 | 3.0 | 2.8 | 1.8 | head ends at ap 0.25 (head length 7 mm, estimate) |
| 0.30 | 3.3 | 3.2 | 1.8 | pectoral fin 5 mm at ap 0.25 (estimate) |
| 0.40 | 3.3 | 3.1 | 1.7 | pelvic fin 3.5 mm at ap 0.45 (estimate) |
| 0.50 | 3.1 | 2.6 | 1.5 | dorsal fin 4 mm at ap 0.50 to 0.65 (estimate) |
| 0.60 | 2.6 | 2.0 | 1.2 | anal fin 4 mm at ap 0.58 to 0.80 (estimate) |
| 0.70 | 2.0 | 1.6 | 0.9 | |
| 0.80 | 1.5 | 1.3 | 0.7 | |
| 0.90 | 1.2 | 1.1 | 0.5 | caudal peduncle |
| 1.00 | 0.4 | 0.4 | 0.2 | caudal fin 6 mm, forked (CF19) |

Eyes about 2 mm (estimate), lens 0.75 to 0.79 mm (W20). Brain about 4.5 x 2.5 x 2.0 mm (estimate). Swim bladder chambers about 5 and 4 mm (estimate).

### 16.5 Posture bend

Apply the bend as a rotation of the head segment (ap 0 to 0.25) about the ear. Rotate by (HTA minus 20) degrees toward ventral. HTA comes from section 15. Before 24 hpf, wrap the axis on the yolk sphere (section 16.3). Between 19 and 24 hpf, blend from the wrapped pose to the prim-5 pose over 5 hours; the tail leaves the yolk at 19 hpf (K95-seg).

### 16.6 Scaling law for stages without a keyframe

For SL between keyframes, scale the outline offsets by (SL / SL_keyframe)^0.9 for depth and (SL / SL_keyframe)^0.8 for width (estimate). This keeps the fineness ratio near the P09 HAA regression and near the adult estimate of 4.3.

## 17. Gaps

1. Adult body depth and width: read the microCT paper (bioRxiv 10.1101/2025.09.19.677450) when the site allows access. It has SL, dorsoventral height and fineness ratio for 131 fish.
2. Larval eye and lens diameters at 24 to 120 hpf: all values are estimates. Greiling and Clark 2009 (Dev Dyn 238:2254, https://doi.org/10.1002/dvdy.21997) and Dahm et al. 2007 (Exp Eye Res 85:74) report lens sizes but were not open in this session.
3. Yolk ball diameter by stage: only relative rules are sourced. A morphometric toxicity screen with control values (for example Teixido et al. 2019, Toxicol Sci 167:438) would give yolk sac area at 24, 48 and 72 hpf.
4. HTA at pec-fin: confirm 35 versus 55 degrees against a printed copy of K95 Table 1.
5. Notochord diameter and gut diameter: no direct measurements were found in open sources.
6. Blastodisc height and blastoderm thickness per stage: no measurements were found. Light-sheet datasets of gastrulation would give them.
7. Somitogenesis period: reconcile the K95 rate (2 per hour) with the S08 value quoted in a search summary (2.7 per hour).
