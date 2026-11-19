# 02. Developmental staging for the time axis

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

This document fixes the canonical stage table for the timeline of the zebrafish 3D atlas. It covers the 44 ZFIN stages from the 1-cell zygote to the adult, the post-embryonic landmarks that depend on body size, a set of headline ticks, a list of landmark events, and a proposal for the non-linear time axis. The machine-readable version is `stages.draft.json` in this directory.

This note and `stages.draft.json` keep the wording of the drafting step. `src/data/stages.json`, the file the atlas ships, states the same landmark facts in the atlas's own words (audit L-03). The two therefore read differently for the landmark lines. The shipped file is the one that counts.

## 1. Sources and conventions

All embryonic times are hours post fertilization (hpf) at 28.5 C. ZFIN and Kimmel et al. 1995 write this as "h". Days post fertilization (dpf) are hpf divided by 24.

Kimmel et al. 1995 give a formula for other incubation temperatures: H_T = h / (0.055 T - 0.57), where h is the hours to reach a stage at 28.5 C and H_T is the hours at temperature T in degrees C. The 20-somite stage at 19 h therefore falls at 23.6 h at 25 C and 15 h at 33 C ([ZFIN-tmp], Figure 2 legend). Development is normal between about 25 C and 33 C ([ZFIN-tmp]).

Three different length measures appear in the sources. Do not mix them.

| Measure | Definition | Used by |
|---|---|---|
| EL, embryo length | Length of the embryo as given per stage by Kimmel et al. 1995 | [K95], [ZFIN-idx] for 16 h to 72 h |
| TL, total body length | Snout to end of the caudal fin | [ZFIN-idx] for 72 h to 45 d |
| SL, standard length | Snout to caudal peduncle; snout to notochord tip before flexion | [P09], [SH14] |

Source keys used in the tables:

| Key | Source |
|---|---|
| [ZFIN-dl] | `stage_ontology.txt` from https://zfin.org/downloads (ZDB stage id, ZFS id, name, start hpf, end hpf) |
| [ZFIN-idx] | https://zfin.org/zf_info/zfbook/stages/index.html (Kimmel Table 1 as reprinted by ZFIN, plus larval and juvenile lengths) |
| [ZFIN-zyg] | https://zfin.org/zf_info/zfbook/stages/zygote.html |
| [ZFIN-clv] | https://zfin.org/zf_info/zfbook/stages/cleave.html and https://zfin.org/zf_info/zfbook/stages/cleave_stgs.html |
| [ZFIN-bla] | https://zfin.org/zf_info/zfbook/stages/blast.html and https://zfin.org/zf_info/zfbook/stages/blast_stgs.html |
| [ZFIN-gas] | https://zfin.org/zf_info/zfbook/stages/gast.html and https://zfin.org/zf_info/zfbook/stages/gast_stgs.html |
| [ZFIN-seg] | https://zfin.org/zf_info/zfbook/stages/seg.html and https://zfin.org/zf_info/zfbook/stages/seg_stgs.html |
| [ZFIN-pha] | https://zfin.org/zf_info/zfbook/stages/phar.html and https://zfin.org/zf_info/zfbook/stages/phar_stgs.html |
| [ZFIN-hat] | https://zfin.org/zf_info/zfbook/stages/hatch.html and https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html |
| [ZFIN-lar] | https://zfin.org/zf_info/zfbook/stages/larval.html and https://zfin.org/zf_info/zfbook/stages/larv_stgs.html |
| [ZFIN-tmp] | https://zfin.org/zf_info/zfbook/stages/temp.html and https://zfin.org/zf_info/zfbook/stages/figs/fig2.html |
| [ZFA] | Zebrafish Anatomy Ontology term pages, https://zfin.org/ZFA:0000001 and so on; start and end stages from `anatomy_item.txt` ([ZFIN-dl]) |
| [ZFS] | Zebrafish Stage Ontology, http://purl.obolibrary.org/obo/zfs.obo and https://www.ebi.ac.uk/ols4/ontologies/zfs |
| [K95] | Kimmel CB, Ballard WW, Kimmel SR, Ullmann B, Schilling TF. Stages of embryonic development of the zebrafish. Dev Dyn 1995;203:253-310. https://doi.org/10.1002/aja.1002030302 |
| [P09] | Parichy DM, Elizondo MR, Mills MG, Gordon TN, Engeszer RE. Normal table of postembryonic zebrafish development. Dev Dyn 2009;238:2975-3015. https://doi.org/10.1002/dvdy.22113 ; full text https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| [SH14] | Singleman C, Holtzman NG. Growth and maturation in the zebrafish, Danio rerio: a staging tool for teaching and research. Zebrafish 2014;11:396-406. https://doi.org/10.1089/zeb.2014.0976 ; full text https://pmc.ncbi.nlm.nih.gov/articles/PMC4108942/ |
| [FEED] | Delay of initial feeding of zebrafish larvae until 8 days postfertilization has no impact on survival or growth through the juvenile stage. Zebrafish 2018. https://pmc.ncbi.nlm.nih.gov/articles/PMC6198760/ |

I read the ZFIN pages through the r.jina.ai reader proxy because zfin.org refused direct connections during this session. The Wiley full text of [K95] was behind a bot check, so every Kimmel fact below comes from the ZFIN reprint of the same text.

The ZFS ontology groups stages into periods with `part_of` relations: cleavage ZFS:0000046, blastula ZFS:0000045, gastrula ZFS:0000047, segmentation ZFS:0000049, pharyngula ZFS:0000050, hatching ZFS:0007000, larva ZFS:0000048, juvenile ZFS:0000051 ([ZFS]). The 1-cell stage (ZFS:0000001) and the adult stage (ZFS:0000044) have no separate period term. ZFS terms carry no text definitions; the definitions live on the ZFIN pages.

## 2. Table A: the 44 ZFIN stages

`stage_ontology.txt` has 45 rows: the 44 stages below plus ZFS:0000000 "Unknown" (0 to 17520 h), a placeholder for unstaged records ([ZFIN-dl]). Start and end hpf come from [ZFIN-dl]. The end of one stage equals the start of the next. Landmarks come from [ZFIN-idx] unless another key is given.

| ZFS | Period | Stage | Start h | End h | dpf | Diagnostic landmarks (source) | Length (source) |
|---|---|---|---|---|---|---|---|
| ZFS:0000001 | zygote | 1-cell | 0.00 | 0.75 | 0 | Cytoplasm streams to the animal pole and forms the blastodisc; chorion lifts; first cleavage at about 40 min ([ZFIN-zyg]) | Egg diameter about 0.7 mm ([ZFIN-zyg]) |
| ZFS:0000002 | cleavage | 2-cell | 0.75 | 1.00 | 0 | Partial cleavage; vertical furrow that spares the yolk; two equal blastomeres ([ZFIN-clv]) | none stated |
| ZFS:0000003 | cleavage | 4-cell | 1.00 | 1.25 | 0 | 2 x 2 array; second furrow at right angles to the first ([ZFIN-clv]) | none stated |
| ZFS:0000004 | cleavage | 8-cell | 1.25 | 1.50 | 0 | 2 x 4 array ([ZFIN-idx]) | none stated |
| ZFS:0000005 | cleavage | 16-cell | 1.50 | 1.75 | 0 | 4 x 4 array; the 4 central cells are the first completely cleaved cells ([ZFIN-clv]) | none stated |
| ZFS:0000006 | cleavage | 32-cell | 1.75 | 2.00 | 0 | 4 x 8 array common; oblique furrows begin; two tiers in side view ([ZFIN-clv]) | none stated |
| ZFS:0000007 | cleavage | 64-cell | 2.00 | 2.25 | 0 | 3 regular tiers of enveloping layer cells; first horizontal cleavage; first deep cells ([ZFIN-clv]) | none stated |
| ZFS:0000008 | blastula | 128-cell | 2.25 | 2.50 | 0 | 5 tiers; cleavage planes irregular; blastodisc a solid half ball ([ZFIN-bla]) | none stated |
| ZFS:0000009 | blastula | 256-cell | 2.50 | 2.75 | 0 | 7 tiers; last highly synchronous cleavage ([ZFIN-bla]) | none stated |
| ZFS:0000010 | blastula | 512-cell | 2.75 | 3.00 | 0 | 9 tiers; yolk syncytial layer (YSL) forms; midblastula transition begins ([ZFIN-bla]) | none stated |
| ZFS:0000011 | blastula | 1k-cell | 3.00 | 3.33 | 0 | 11 tiers; single row of about 20 YSL nuclei; cell cycle asynchronous ([ZFIN-bla]) | none stated |
| ZFS:0000012 | blastula | high | 3.33 | 3.66 | 0 | More than 11 tiers; blastodisc flattening begins; YSL nuclei in two rows ([ZFIN-idx]) | none stated |
| ZFS:0000013 | blastula | oblong | 3.66 | 4.00 | 0 | Blastodisc flattens to an ellipsoid; marginal constriction disappears; several rows of YSL nuclei ([ZFIN-bla]) | none stated |
| ZFS:0000014 | blastula | sphere | 4.00 | 4.33 | 0 | Spherical shape; flat border between blastodisc and yolk ([ZFIN-idx]) | none stated |
| ZFS:0000015 | blastula | dome | 4.33 | 4.66 | 0 | Yolk cell domes toward the animal pole; first sure sign of epiboly ([ZFIN-bla]) | none stated |
| ZFS:0000016 | blastula | 30%-epiboly | 4.66 | 5.25 | 0 | Blastoderm an inverted cup of uniform thickness; margin at 30% of the animal-vegetal axis ([ZFIN-bla]) | none stated |
| ZFS:0000017 | gastrula | 50%-epiboly | 5.25 | 5.66 | 0 | Margin at 50%; blastoderm still uniform; involution begins, which defines the onset of gastrulation ([ZFIN-gas]) | none stated |
| ZFS:0000018 | gastrula | germ-ring | 5.66 | 6.00 | 0 | Germ ring visible from the animal pole; epiblast about 3 cells thick over a hypoblast 1 to 2 cells thick ([ZFIN-gas]) | none stated |
| ZFS:0000019 | gastrula | shield | 6.00 | 8.00 | 0 | Embryonic shield visible; both body axes readable for the first time ([ZFIN-gas]) | none stated |
| ZFS:0000020 | gastrula | 75%-epiboly | 8.00 | 9.00 | 0 | Dorsal side thicker; epiblast, hypoblast and evacuation zone visible; prechordal plate at the animal pole ([ZFIN-gas]) | none stated |
| ZFS:0000021 | gastrula | 90%-epiboly | 9.00 | 10.00 | 0 | Axis and neural plate; brain and notochord rudiments; yolk plug ([ZFIN-gas]) | none stated |
| ZFS:0000022 | gastrula | bud | 10.00 | 10.33 | 0 | 100%-epiboly; tail bud swells within 10 to 15 min of yolk plug closure; polster ([ZFIN-gas]) | none stated |
| ZFS:0000023 | segmentation | 1-4 somites | 10.33 | 11.66 | 0 | First somite furrow; polster prominent ([ZFIN-seg]) | none stated |
| ZFS:0000024 | segmentation | 5-9 somites | 11.66 | 14.00 | 0 | Optic primordium from the 4 to 5 somite stage; Kupffer's vesicle; neural keel; pronephros rudiment by 8 somites; 3 somites per hour ([ZFIN-seg]) | EL about 0.8 mm, same as the zygote ([ZFIN-seg]) |
| ZFS:0000025 | segmentation | 10-13 somites | 14.00 | 16.00 | 0 | Pronephros forms; somite rate about 2 per hour from here ([ZFIN-idx], [ZFIN-seg]) | none stated |
| ZFS:0000026 | segmentation | 14-19 somites | 16.00 | 19.00 | 0 | Otic placode; brain neuromeres r2 to r6; yolk extension starts; tail bud protrudes; first twitches at 17 somites; 18 somites at 18 h ([ZFIN-seg]) | EL 0.9 mm ([ZFIN-idx]) |
| ZFS:0000027 | segmentation | 20-25 somites | 19.00 | 22.00 | 0 | Lens placode; otic vesicle with two tiny otoliths; brain ventricles; neural tube nearly complete; pronephric duct to the anus ([ZFIN-seg]) | EL 1.4 mm ([ZFIN-idx]) |
| ZFS:0000028 | segmentation | 26+ somites | 22.00 | 24.00 | 0 | Blood island; otoliths visible with a dissecting scope; midbrain-hindbrain boundary; lateral line primordium at somite 3; median fin fold at 22 to 23 h; 30 to 34 somite pairs in total ([ZFIN-seg]) | EL 1.6 mm ([ZFIN-idx]) |
| ZFS:0000029 | pharyngula | prim-5 | 24.00 | 30.00 | 1 | HTA 120 deg; OVL 5; primordium over myotome 5; heart beat starts just before; retinal pigment; circulation soon after 24 to 25 h; fin bud mounds by 28 to 29 h ([ZFIN-pha]) | EL 1.9 mm ([ZFIN-pha]) |
| ZFS:0000030 | pharyngula | prim-15 | 30.00 | 36.00 | 1 | HTA 95 deg; OVL 3; touch reflex; retina pigmented; dorsal stripe forming; straight heart tube; slow circulation ([ZFIN-pha]) | EL 2.5 mm ([ZFIN-pha]) |
| ZFS:0000031 | pharyngula | prim-25 | 36.00 | 42.00 | 1 | HTA 75 deg; OVL 1; heart bends; strong circulation; escape response displaces the embryo; tail pigmentation ([ZFIN-pha]) | EL 2.7 mm ([ZFIN-pha]) |
| ZFS:0000032 | pharyngula | high-pec | 42.00 | 48.00 | 1 | HTA 55 deg; OVL 3/4; fin bud height equals base width; atrium and ventricle distinct; about 180 beats per min; first xanthophores and iridophores; liver and swim bladder primordia ([ZFIN-pha]) | EL 2.9 mm ([ZFIN-pha]) |
| ZFS:0000033 | hatching | long-pec | 48.00 | 60.00 | 2 | HTA 45 deg; OVL 1/2; fin bud height-to-width about 2; first cartilage in the pectoral girdle; six aortic arches; neuromasts; hatching sporadic during the third day ([ZFIN-hat]) | EL 3.1 mm ([ZFIN-hat]) |
| ZFS:0000034 | hatching | pec-fin | 60.00 | 72.00 | 2 | Pectoral fin blade; mouth open behind the eye; jaw cartilage; hindgut lumen; HTA 55 deg on the ZFIN page, 35 deg in [K95] (unverified) ([ZFIN-hat]) | EL 3.3 mm ([ZFIN-hat]) |
| ZFS:0000035 | larval | protruding-mouth | 72.00 | 96.00 | 3 | HTA 25 deg; mouth protrudes past the eye; cleithrum, the first bone; gill filament buds; end of embryogenesis by definition ([ZFIN-lar], [ZFIN-hat]) | EL 3.5 mm ([ZFIN-lar]); TL 3.5 mm ([ZFIN-idx]) |
| ZFS:0000036 | larval | day 4 | 96.00 | 120.00 | 4 | Swim bladder inflates; mouth keeps moving anterodorsally; gut drops ventrally; yolk extension nearly empty ([ZFIN-lar]) | TL 3.7 mm ([ZFIN-idx]) |
| ZFS:0000037 | larval | day 5 | 120.00 | 144.00 | 5 | 6 pharyngeal teeth ([ZFIN-idx]); free swimming and first feeding at 5 dpf ([FEED]) | TL 3.9 mm ([ZFIN-idx]) |
| ZFS:0000038 | larval | day 6 | 144.00 | 168.00 | 6 | No ZFIN description | TL 4.2 mm ([ZFIN-idx]) |
| ZFS:0000039 | larval | days 7-13 | 168.00 | 336.00 | 7-13 | 8 teeth ([ZFIN-idx]); yolk exhausted at 8 to 9 dpf ([FEED]); flexion begins at 4.4 to 4.7 mm SL; caudal fin rays at 4.9 to 5.1 mm SL ([P09]) | TL 4.5 mm at 7 d ([ZFIN-idx]) |
| ZFS:0000040 | larval | days 14-20 | 336.00 | 504.00 | 14-20 | 10 teeth ([ZFIN-idx]); anal and dorsal fin rays at 6.1 to 6.6 mm SL; metamorphic melanophores at 5.9 to 6.3 mm SL ([P09]); pelvic fin bud start stage ([ZFA] ZFA:0001384) | TL 6.2 mm at 14 d ([ZFIN-idx]) |
| ZFS:0000041 | larval | days 21-29 | 504.00 | 720.00 | 21-29 | Pelvic fin bud at 7.2 to 7.5 mm SL; pelvic fin rays at 8.5 to 8.7 mm SL; fin fold resorbing ([P09]); gonad start stage ([ZFA] ZFA:0000413) | TL 7.8 mm at 21 d ([ZFIN-idx]) |
| ZFS:0000042 | juvenile | days 30-44 | 720.00 | 1080.00 | 30-44 | Adult fins and pigment ([ZFIN-idx]); squamation from 9.5 mm SL, complete at 10.9 to 11.7 mm SL, which defines the juvenile ([P09]); scale start stage ([ZFA] ZFA:0000277) | TL 10 mm at 30 d ([ZFIN-idx]) |
| ZFS:0000043 | juvenile | days 45-89 | 1080.00 | 2160.00 | 45-89 | 12 teeth ([ZFIN-idx]); most fish at or past 12 mm SL by 45 dpf ([SH14]); secondary stripes at about 14 and 16 mm SL ([P09]) | TL 14 mm at 45 d ([ZFIN-idx]) |
| ZFS:0000044 | adult | adult | 2160.00 | 17520.00 | 90 to 730 | Breeding adult ([ZFIN-idx]); secondary sexual characters from 17.5 mm SL in males and 18.3 mm SL in females ([P09]); 18 mm SL by 90 dpf in most fish ([SH14]) | About 18 mm SL at maturity ([P09], [SH14]) |

HTA is the head-trunk angle and OVL is the otic vesicle length index of Kimmel et al. 1995 ([ZFIN-pha]). Both fall as the embryo straightens, so a mesh generator can use HTA directly as the body curvature keyframe from 24 h to 72 h.

## 3. Table B: post-embryonic landmarks by standard length

Parichy et al. 2009 define post-embryonic stages by SL, not by age. They show that SL explains more developmental variance than dpf (median R squared 0.94 against 0.73 across 13 traits, paired Wilcoxon P < 0.0005) ([P09]). Individually reared larvae differed widely in growth between 3 and 280 dpf ([P09], Figure 3). The paper gives no dpf per milestone. It states only that the juvenile period in their laboratory runs from about 4 weeks to 6 to 12 weeks post fertilization, depending on strain and rearing ([P09]).

### 3.1 Parichy et al. 2009, Table 4 milestones

SL pre and SL post are the mean sizes just before and just after the milestone appeared in individually reared fish. SSL is the standardized standard length that the paper proposes as a stage label. All sizes are in mm ([P09], Table 4).

| Abbrev. | Milestone | SL pre | SL post | SSL | Approx. dpf (derived) | Basis for the dpf placement |
|---|---|---|---|---|---|---|
| pSB | Posterior swim bladder inflation | 3.4 | 3.7 | 3.5 | 4 to 5 | Inflation happens during day 4 ([ZFIN-lar]); TL 3.7 mm at day 4 ([ZFIN-idx]) |
| FLe | Early notochord flexion, 0 to 25 deg; larvae begin to feed | 4.4 | 4.7 | 4.5 | 8 to 10 | TL 4.5 mm at 7 d ([ZFIN-idx]); SL is shorter than TL |
| CR | Caudal fin ray appearance; mouth terminal | 4.9 | 5.1 | 4.9 | 10 to 12 | Interpolated between TL 4.5 mm at 7 d and 6.2 mm at 14 d ([ZFIN-idx]) |
| AC | Anal fin condensation | 5.2 | 5.5 | 5.4 | 12 to 13 | Same interpolation |
| DC | Dorsal fin condensation | 5.5 | 5.8 | 5.7 | 13 to 14 | Same interpolation |
| MMA | Metamorphic melanophore appearance | 5.9 | 6.3 | 5.9 | 14 to 16 | TL 6.2 mm at 14 d ([ZFIN-idx]) |
| aSB | Anterior swim bladder lobe | 5.9 | 6.2 | 6.0 | 14 to 16 | Same anchor |
| AR | Anal fin ray appearance | 6.3 | 6.4 | 6.2 | 15 to 16 | Same anchor |
| DR | Dorsal fin ray appearance | 6.5 | 6.6 | 6.4 | 15 to 17 | Same anchor |
| PB | Pelvic fin bud appearance | 7.2 | 7.5 | 7.2 | 18 to 20 | Pelvic fin bud start stage days 14-20 ([ZFA] ZFA:0001384); TL 7.8 mm at 21 d ([ZFIN-idx]) |
| PR | Pelvic fin ray appearance | 8.5 | 8.7 | 8.6 | 24 to 26 | Interpolated between TL 7.8 mm at 21 d and 10 mm at 30 d ([ZFIN-idx]) |
| SP | Squamation onset, posterior | 9.5 | 9.6 | 9.6 | 28 to 30 | Scale start stage days 30-44 ([ZFA] ZFA:0000277); TL 10 mm at 30 d ([ZFIN-idx]) |
| SA | Squamation through the anterior | 10.1 | 10.4 | 10.4 | 31 to 34 | Same anchors |
| J | Juvenile: squamation complete, fin fold gone | 11.3 | 11.7 | 11.0 | 28 to 45 | About 4 weeks ([P09]); 12 mm SL in most fish by 45 dpf ([SH14]) |
| A | Adult: secondary sexual characters | 17.5 (males), 18.3 (females) | | | 42 to 90 | 6 to 12 weeks ([P09]); 18 mm SL by 90 dpf in most fish ([SH14]) |

Treat every derived dpf as a placement on the timeline. The measured quantity is SL. The ZFIN lengths are TL, which exceeds SL by the caudal fin, so an SL milestone falls a few days after the ZFIN TL of the same number.

Other size-linked facts from [P09]: the remnants of the major fin fold lobe cover about two thirds of the tail at 7.4 mm SL and one third at 8.3 mm SL; the first two primary stripes 1D and 1V appear at about 9 mm SL; the primary stripes are complete at about 12 mm SL; secondary stripe 2V is added at about 14 mm SL and 2D at about 16 mm SL. Fish reared at 24 C grew 0.45 mm SL per day and fish at 33 C grew 0.54 mm SL per day; high density gave 0.48 and low density 0.55 mm SL per day ([P09]). After the main effect of size, temperature and density explained less than 5% of the remaining variance in developmental state ([P09], Table 5).

### 3.2 Singleman and Holtzman 2014 stages

Singleman and Holtzman score four external traits (pigment pattern, tail fin, anal fin, dorsal fin) into phenotypes P1 to P5 and combine them with SL into three larval stages, a juvenile stage and an adult stage. Their fish were AB wild types reared at 28 C plus or minus 1 C and sampled at 15, 30, 45, 60, 90 and 180 dpf ([SH14]).

| Stage | Defining phenotype | SL range in mm (fins) | SL range in mm (pigment) | Age anchors in the paper |
|---|---|---|---|---|
| L1 | P1: fin folds only, no rays; single spotted melanophore line along the lateral line | 4.0 to 6.0 | 4.0 to 6.0 | Larval period starts at about 3 dpf |
| L2 | P2: fin rays condense; tail rounded then two points; melanophores over the swim bladder | 5.5 to 7.0 | 5.5 to 7.5 | T4 peak at 21 dpf falls near the L1 to L2 transition at about 6.5 mm SL |
| L3 | P3: rays reach the fin margin, no forks; two stripes flanking the lateral line | 6.5 to 14.0 (dorsal 6.5 to 14.5) | 7.5 to 11.5 | 15 dpf sample shows larval morphology |
| J | P4: single fork in rays; 16 to 17 tail rays; third stripe | 12.5 or 13.0 to 19.5 | about 11 to 19 | Larva to juvenile transition at about 12 mm SL; most fish reach it by 45 dpf |
| A | P5: second fork; 18 to 24 tail rays; fourth stripe | above the P4 range | above about 19 | 18 mm SL and sexual maturity by about 90 dpf (3 months) |

The paper states that hatching occurs at 3 to 4 dpf, that larval development lasts about 6 weeks and ends at about 45 dpf under optimal conditions, and that zebrafish reach sexual maturity at about 3 months at 28.5 C ([SH14]).

## 4. Headline stages for the timeline ticks

I propose 14 headline ticks. Every tick is either a ZFIN period boundary or one of the reference stages that Kimmel et al. 1995 chose for their temperature calibration plot (8-cell, 64-cell, 1k-cell, dome, shield, 75%, bud, 1-somite, 14-somite, 20-somite, prim-5, prim-15, prim-25, high-pec, long-pec, pec-fin, protruding-mouth) ([ZFIN-tmp]). The post-embryonic ticks follow the ZFIN day groupings and the 45 dpf and 90 dpf anchors of [SH14].

| Tick label | hpf | Why this stage |
|---|---|---|
| 1-cell | 0 | Origin; fertilization ([ZFIN-zyg]) |
| 64-cell | 2 | Last cleavage stage; first deep cells; end of the regular blastomere arrays ([ZFIN-clv]) |
| sphere | 4 | Late blastula with the smooth spherical shape that a viewer recognizes; precedes epiboly ([ZFIN-bla]) |
| shield | 6 | First stage with readable body axes; the classic gastrula picture ([ZFIN-gas]) |
| bud | 10 | End of epiboly and gastrulation; tail bud; start of the body axis geometry ([ZFIN-gas]) |
| 14-somite | 16 | First stage with a stated EL; otic placode; yolk extension begins; mid segmentation ([ZFIN-seg]) |
| prim-5 | 24 | Period boundary; heart beat; pigmentation; 1 dpf ([ZFIN-pha]) |
| long-pec | 48 | Period boundary; hatching window opens; 2 dpf ([ZFIN-hat]) |
| protruding-mouth | 72 | End of embryogenesis by definition; 3 dpf ([ZFIN-lar]) |
| 5 dpf | 120 | Swim bladder inflated; first feeding; ZFIN "day 5" ([FEED], [ZFIN-idx]) |
| 14 dpf | 336 | ZFIN "days 14-20"; median fin rays and metamorphic melanophores at about 6 mm SL ([P09]) |
| 30 dpf | 720 | ZFIN juvenile period start; squamation ([ZFIN-dl], [P09]) |
| 45 dpf | 1080 | ZFIN "days 45-89"; most fish are juveniles of 12 mm SL ([SH14]) |
| 90 dpf | 2160 | ZFIN adult start; sexual maturity ([ZFIN-dl], [SH14]) |

1k-cell (3 h, midblastula transition) is a strong talk moment but sits 1 h after the 64-cell tick. Show it as an event marker without a tick. The remaining 30 stages appear as minor ticks and as the snap targets during scrubbing.

## 5. Landmark events

The list below has 53 events. Times are hpf at 28.5 C. Events marked "est." are defined by SL in the source; the hpf is the derived placement from section 3.1. The JSON file carries the same list under `events`.

| hpf | Event | Note | Source |
|---|---|---|---|
| 0 | Fertilization | Chorion lifts; cytoplasmic streaming within about 10 min; egg about 0.7 mm | [ZFIN-zyg] |
| 0.67 | First cleavage | About 40 min after fertilization; 2-cell stage set at 0.75 h | [ZFIN-zyg] |
| 1.5 | First complete cells | 4 central blastomeres of the 16-cell stage | [ZFIN-clv] |
| 2 | First deep cells | Horizontal cleavage at 64-cell | [ZFIN-clv] |
| 2.75 | Midblastula transition begins | Cycle 10, 512-cell; YSL starts to form | [ZFIN-bla] |
| 3 | YSL visible | About 20 nuclei in one ring; last synchronous mitotic wave | [ZFIN-bla] |
| 3.33 | Blastodisc flattening begins | High stage | [ZFIN-idx] |
| 4.33 | Epiboly begins | Doming of the yolk cell | [ZFIN-bla] |
| 5.25 | Gastrulation begins | Involution at 50%-epiboly | [ZFIN-gas] |
| 5.66 | Germ ring | Epiblast and hypoblast form | [ZFIN-gas] |
| 6 | Embryonic shield | Dorsal side and both axes identifiable | [ZFIN-gas] |
| 8 | Prechordal plate at the animal pole | 75%-epiboly | [ZFIN-gas] |
| 9 | Neural plate and yolk plug | 90%-epiboly | [ZFIN-gas] |
| 10 | Epiboly complete; tail bud | Polster forms | [ZFIN-gas] |
| 10.33 | First somite | Furrow between somites 1 and 2 | [ZFIN-seg] |
| 11.5 | Optic primordium | From the 4 to 5 somite stage; neural keel | [ZFIN-seg] |
| 11.66 | Kupffer's vesicle | Deep to the tail bud; present through segmentation | [ZFIN-seg], [ZFA] ZFA:0000001 |
| 12.7 | Pronephros rudiment | By the 8-somite stage | [ZFIN-seg] |
| 16 | Otic placode; yolk extension | EL 0.9 mm | [ZFIN-seg] |
| 17.5 | First muscle contractions | 17-somite stage | [ZFIN-seg] |
| 18 | 18 somites | About 2 somites per hour | [ZFIN-seg] |
| 19 | Otic vesicle, lens placode, otoliths | EL 1.4 mm | [ZFIN-seg] |
| 19.5 | Heart cone forms | Cone at 19.5 to 22 hpf; heart tube at 24 hpf | [ZFA] ZFA:0000115 |
| 22 | Lateral line primordium migrates; blood island | Prim-3; EL 1.6 mm | [ZFIN-seg] |
| 22.5 | Median fin fold rudiment | 22 to 23 h | [ZFIN-seg] |
| 24 | Heart beat | Starts just before prim-5; AP wave by 26 h | [ZFIN-pha] |
| 24 | Pigmentation begins | Retinal pigment epithelium, then skin melanophores | [ZFIN-pha] |
| 25 | Blood circulation begins | Cells reach the yolk ball at 24 to 25 h | [ZFIN-pha] |
| 27 | First touch response | Prim-10 | [ZFIN-pha] |
| 28.5 | Pectoral fin buds | Mounds by 28 to 29 h, lateral to somite 3 | [ZFIN-pha] |
| 30 | Retina pigmented; dorsal stripe | Prim-15; EL 2.5 mm | [ZFIN-pha] |
| 36 | Heart bends; escape swimming | Prim-25; EL 2.7 mm | [ZFIN-pha] |
| 42 | Xanthophores and iridophores; liver and swim bladder primordia | High-pec; about 180 beats per min | [ZFIN-pha] |
| 48 | Hatching window opens | Sporadic through 48 to 72 h and sometimes later | [ZFIN-hat] |
| 48 | First cartilage; six aortic arches | Long-pec; neuromasts; EL 3.1 mm | [ZFIN-hat] |
| 60 | Pectoral fin blade; mouth open | Pec-fin; EL 3.3 mm | [ZFIN-hat] |
| 72 | Protruding mouth; end of embryogenesis | Cleithrum; gill filament buds; 3.5 mm | [ZFIN-lar] |
| 108 est. | Swim bladder inflation | During day 4; 3.4 to 3.7 mm SL | [ZFIN-lar], [P09] |
| 120 | First feeding | Free swimming at 5 dpf; 6 teeth | [FEED], [ZFIN-idx] |
| 204 est. | Yolk exhausted | Survival drops when feeding starts after 8 to 9 dpf | [FEED] |
| 216 est. | Notochord flexion begins | FLe; 4.4 to 4.7 mm SL; active feeding | [P09] |
| 264 est. | Caudal fin rays | CR; 4.9 to 5.1 mm SL | [P09] |
| 300 est. | Anal and dorsal fin condensations | 5.2 to 5.8 mm SL | [P09] |
| 348 est. | Metamorphic melanophores; anterior swim bladder lobe | 5.9 to 6.3 mm SL | [P09] |
| 372 est. | Anal and dorsal fin rays | 6.1 to 6.6 mm SL | [P09] |
| 456 est. | Pelvic fin bud | 7.2 to 7.5 mm SL | [P09], [ZFA] ZFA:0001384 |
| 600 est. | Pelvic fin rays; fin fold resorption | 8.5 to 8.7 mm SL | [P09] |
| 648 est. | First primary adult stripes | 1D and 1V at about 9 mm SL | [P09] |
| 720 est. | Squamation onset | 9.5 to 10.4 mm SL | [P09], [ZFA] ZFA:0000277 |
| 840 est. | Juvenile | 10.9 to 11.7 mm SL; about 4 weeks | [P09], [SH14] |
| 960 est. | Primary stripes complete | About 12 mm SL; 2V at 14 mm, 2D at 16 mm | [P09] |
| 2160 est. | Sexual maturity | 17.5 mm SL males, 18.3 mm SL females; about 90 dpf | [P09], [SH14] |
| 17520 | End of the ZFS adult stage | 2 years | [ZFIN-dl] |

## 6. Time-axis mapping

### 6.1 The problem

A linear axis from 0 to 2160 h puts the whole embryonic period (0 to 72 h) into 3.3% of the bar. A linear axis from 0 to 72 h drops the larval and juvenile growth. A pure log axis, log10(1 + hpf) / log10(2161), gives the first 2 h 14% of the bar, and most of that time shows one round cell. The axis needs a warp that keeps three regions readable: the fast morphogenesis from 0 to 24 h, the organogenesis from 24 to 72 h, and the slow growth from 3 to 90 dpf.

### 6.2 Proposal: piecewise-linear warp with six segments

Map hpf to a bar fraction f in [0, 1] by linear interpolation between these breakpoints. The breakpoints sit on ZFIN period boundaries, so period bands have straight edges.

| Segment | hpf range | Content | Fraction range | Width | Rate |
|---|---|---|---|---|---|
| 1 | 0 to 10 | zygote, cleavage, blastula, gastrula (22 stages) | 0.00 to 0.20 | 20% | 2.0% per h |
| 2 | 10 to 24 | segmentation (6 stages) | 0.20 to 0.32 | 12% | 0.86% per h |
| 3 | 24 to 72 | pharyngula and hatching (6 stages) | 0.32 to 0.54 | 22% | 0.46% per h |
| 4 | 72 to 168 | early larva, 3 to 7 dpf (4 stages) | 0.54 to 0.64 | 10% | 2.5% per day |
| 5 | 168 to 720 | larva, 7 to 30 dpf (3 stages) | 0.64 to 0.82 | 18% | 0.78% per day |
| 6 | 720 to 2160 | juvenile, 30 to 90 dpf (2 stages) | 0.82 to 1.00 | 18% | 0.30% per day |

The embryonic period (0 to 72 h) takes 54% of the bar and the post-embryonic period takes 46%. The scrub speed, in bar fraction per hour, drops by factors of 2.3, 1.9, 4.4, 3.2 and 2.6 at the five interior breakpoints. The largest drop sits at 72 h, where the model changes from morphogenesis to growth. The inverse is the same table read the other way, so a pointer position converts to hpf without a search.

Fractions of the 14 headline ticks under this warp:

| Tick | hpf | f |
|---|---|---|
| 1-cell | 0 | 0.000 |
| 64-cell | 2 | 0.040 |
| sphere | 4 | 0.080 |
| shield | 6 | 0.120 |
| bud | 10 | 0.200 |
| 14-somite | 16 | 0.251 |
| prim-5 | 24 | 0.320 |
| long-pec | 48 | 0.430 |
| protruding-mouth | 72 | 0.540 |
| 5 dpf | 120 | 0.590 |
| 14 dpf | 336 | 0.695 |
| 30 dpf | 720 | 0.820 |
| 45 dpf | 1080 | 0.865 |
| 90 dpf | 2160 | 1.000 |

The smallest gap between headline ticks is 4% (64-cell to sphere, sphere to shield, 30 dpf to 45 dpf). On a 1200 px bar that is 48 px, enough for a short label. Fractions of all 44 stage starts are in `stages.draft.json` under `axisFractionStart`; the cleavage stages sit 0.5% apart (6 px at 1200 px), so they need snapping, not labels.

### 6.3 Comparison with the log warp

| Tick | Piecewise f | log10 f |
|---|---|---|
| 64-cell (2 h) | 0.040 | 0.143 |
| shield (6 h) | 0.120 | 0.253 |
| prim-5 (24 h) | 0.320 | 0.419 |
| protruding-mouth (72 h) | 0.540 | 0.559 |
| 14 dpf | 0.695 | 0.758 |
| 30 dpf | 0.820 | 0.857 |
| 90 dpf | 1.000 | 1.000 |

The log warp spends 14% of the bar on the first two hours and 25% on the first 6 h. The piecewise warp moves that space to the pharyngula and hatching periods, where the heart, fins, pigment and jaw appear. Keep the log warp as a fallback option in the code; it is one line and needs no table.

### 6.4 Interaction notes

Snap the scrubber to the nearest ZFS stage start when the pointer is released, and show the stage name and hpf in the readout. Give the arrow keys a step of one ZFS stage. Extend the bar past 90 dpf with a short fixed "adult" band and clamp the model at the 90 dpf keyframe, because ZFS runs the adult stage to 2 years with no further morphological landmarks ([ZFIN-dl]). Show the temperature formula in the settings panel so that a presenter can relabel the axis for 25 C or 33 C ([ZFIN-tmp]).

## 7. ZFA start and end stages of structures that drive the geometry

ZFIN annotates each anatomy term with a start and an end stage ([ZFIN-dl], `anatomy_item.txt`). These give the earliest stage at which a structure exists as a named part and therefore the earliest keyframe at which the mesh should appear. The list below covers the structures that the procedural model will need first.

| ZFA id | Structure | Start stage (hpf) | End stage (hpf) |
|---|---|---|---|
| ZFA:0001175 | blastodisc | 1-cell (0) | dome (4.66) |
| ZFA:0001176 | blastoderm | 30%-epiboly (4.66) | bud (10.33) |
| ZFA:0000088 | yolk syncytial layer | 1k-cell (3) | day 5 (144) |
| ZFA:0000111 | germ ring | germ-ring (5.66) | bud (10.33) |
| ZFA:0000077 | tail bud | bud (10) | prim-5 (30) |
| ZFA:0000135 | notochord | bud (10) | adult |
| ZFA:0000155 | somite | 1-4 somites (10.33) | pec-fin (72) |
| ZFA:0000001 | Kupffer's vesicle | 1-4 somites (10.33) | prim-5 (30) |
| ZFA:0000050 | optic vesicle | 5-9 somites (11.66) | 20-25 somites (22) |
| ZFA:0000107 | eye | prim-5 (24) | adult |
| ZFA:0000138 | otic placode | bud (10) | 26+ somites (24) |
| ZFA:0000051 | otic vesicle | 14-19 somites (16) | open |
| ZFA:0001617 | otolith | 20-25 somites (19) | adult |
| ZFA:0000115 | heart rudiment | 20-25 somites (19) | 26+ somites (24) |
| ZFA:0000360 | heart tube | prim-5 (24) | prim-25 (42) |
| ZFA:0000114 | heart | high-pec (42) | adult |
| ZFA:0000094 | blood island | 26+ somites (22) | prim-5 (30) |
| ZFA:0000040 | median fin fold | 26+ somites (22) | day 5 (144) |
| ZFA:0000141 | pectoral fin bud | prim-5 (24) | long-pec (60) |
| ZFA:0001161 | pectoral fin | prim-15 (30) | adult |
| ZFA:0000123 | liver | prim-15 (30) | adult |
| ZFA:0001338 | intestine | prim-15 (30) | adult |
| ZFA:0009198 | xanthophore | high-pec (42) | adult |
| ZFA:0009199 | iridophore | high-pec (42) | adult |
| ZFA:0000076 | swim bladder | pec-fin (60) | adult |
| ZFA:0000329 | chorion | 1-cell (0) | high-pec (48) |
| ZFA:0000084 | yolk | 1-cell (0) | day 5 (144) |
| ZFA:0001189 | vertebra | protruding-mouth (72) | adult |
| ZFA:0000184 | cleithrum | high-pec (42) | adult |
| ZFA:0001384 | pelvic fin bud | days 14-20 (336) | days 30-44 (1080) |
| ZFA:0001184 | pelvic fin | days 30-44 (720) | adult |
| ZFA:0000277 | scale | days 30-44 (720) | adult |
| ZFA:0000413 | gonad | days 21-29 (504) | adult |
| ZFA:0005220 | larval melanophore stripe | prim-15 (30) | days 14-20 (504) |
| ZFA:0000622 | barbel | days 45-89 (1080) | adult |

Some ZFA start stages precede the Kimmel text. ZFA places the otic placode at bud stage, while [ZFIN-seg] first describes it at 14 to 19 somites. ZFA places the pectoral fin bud at prim-5, while [ZFIN-pha] describes the mounds at 28 to 29 h. Use the ZFA stage as the earliest allowed keyframe and the Kimmel description as the visible-appearance keyframe.

## 8. Open questions

1. The pec-fin HTA. The ZFIN page gives 55 degrees at 60 h, the same value as high-pec at 42 h. A search snippet of the Kimmel 1995 PDF gives 35 degrees, which fits the monotonic fall from 45 degrees at 48 h to 25 degrees at 72 h. I could not open the PDF to confirm (unverified). The JSON uses the ZFIN text and flags the conflict.
2. Zygote size. [ZFIN-zyg] gives 0.7 mm diameter at fertilization; [ZFIN-seg] gives the 5 to 9 somite embryo as "about 0.8 mm, the same as the zygote". Both are Kimmel's numbers. Use 0.7 mm for the egg mesh and 0.8 mm for EL at 12 h.
3. dpf for SL milestones. No source measured dpf per Parichy milestone at 28.5 C. The derived values in section 3.1 have a spread of several days. A growth curve from a husbandry paper would tighten them.
4. Larval stage descriptions. ZFIN has no text for day 4 to days 21-29 beyond the TL and tooth counts on the index page. The geometry for 4 to 29 dpf must rest on [P09] and [SH14].
5. ZFS "Unknown" (ZFS:0000000) spans 0 to 17520 h. Exclude it from the axis and from stage counts in the app.
