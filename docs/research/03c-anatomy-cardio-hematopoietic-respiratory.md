# Cardiovascular, hematopoietic and respiratory anatomy for the zebrafish 3D atlas

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Research note 03c.

This note lists 45 structures of the heart, the blood vessels, the blood-forming organs, the gills and the swim bladder. Each structure carries a Zebrafish Anatomy Ontology (ZFA) identifier and the ZFIN start and end stages. Each structure also carries a body position, a procedural shape, sizes at reference stages and key events. The companion file `03c-anatomy-cardio-hematopoietic-respiratory.draft.json` holds the same data in machine-readable form.

## 1. Conventions

- Time is in hours post fertilization (hpf) at 28.5 C. Stage hours come from `stage_ontology.txt`. `startHpf` is the start of the ZFIN start stage. `endHpf` is the end of the ZFIN end stage. The Unknown stage (ZFS:0000000) spans 0 to 17520 h.
- `startStage` and `endStage` in the JSON copy `anatomy_item.txt` without change. Where the model should show a structure at a different time, the JSON adds `visibleFromHpf` with a source (section 4).
- `apFraction` is the position along the body as a fraction of the length from the snout tip. Embryo and larva values use total length. The reference lengths are 1.9 mm at 24 hpf, 3.1 mm at 48 hpf and 3.9 mm at 120 hpf (ZFIN staging table, https://zfin.org/zf_info/zfbook/stages/index.html). Adult values use a standard length of 25 mm (Ivanovski et al. 2009, PMID 20087250 (adult average size 2.5 cm), https://pubmed.ncbi.nlm.nih.gov/20087250/). All apFraction values are my estimates from the Kimmel et al. 1995 figures. No paper reports them.
- Sizes are in micrometers. Each size row carries a `basis` label. `measured` is a published value. `derived` is computed from a published ratio or volume. `estimate` is my estimate, with no measurement found. Numbers marked (unverified) come from search summaries of papers that I could not open in full.
- One term per thing: I write `dorsal aorta`, `posterior cardinal vein` and `common cardinal vein` throughout. ZFA synonyms appear once, in the per-structure notes.

## 2. How I chose the structures

I searched `anatomy_item.txt` for heart, vessel, blood, hematopoietic, thymus, spleen, kidney marrow, gill, opercular, swim bladder and pseudobranch terms. I read the matching records in `zfa.obo` and followed the `part_of` and `develops_from` links. The 45 structures below are organ or tissue units that a whole-body schematic can draw. I excluded cell-level terms, the endothelium and myocardium layers, the heart conduction system and the lymphatic vessels. I also excluded the rostral blood island, the individual aortic arch terms, gill lamellae, the opercular bones and the internal gill bud. The lymphatic vessels are thin and deep. The rostral blood island is a diffuse cell group. The opercular bones belong to the skeletal specialist. One segment array covers the individual aortic arches (section 7).

ZFIN keeps a chain of five heart terms with overlapping stage ranges. The first three terms are heart primordium (11.7-22 h), heart rudiment (19-24 h) and primitive heart tube (22-30 h). The last two are heart tube (24-42 h) and heart (42 h to adult). I list all five so that the info cards can cite the right term. The model needs only one heart object whose label and shape change with time.

## 3. Structure tables

### 3.1 Cardiovascular system

| ZFA id | Name | UI parent | ZFIN start | ZFIN end | Visible from (h) | AP fraction | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|---|
| ZFA:0000028 | heart primordium | cardiovascular system (ZFA:0000010) | Segmentation:5-9 somites (11.66 h) | Segmentation:20-25 somites (22 h) | 11.66 | 0.15-0.25 | ventral; paired | sheet | `#f4a582` |
| ZFA:0000115 | heart rudiment | cardiovascular system (ZFA:0000010) | Segmentation:20-25 somites (19 h) | Segmentation:26+ somites (24 h) | 19 | 0.17-0.22 | ventral midline; midline | lathe | `#e8806a` |
| ZFA:0000149 | primitive heart tube | cardiovascular system (ZFA:0000010) | Segmentation:26+ somites (22 h) | Pharyngula:Prim-5 (30 h) | 22 | 0.16-0.27 | ventral midline to left of midline; left | tube | `#d6604d` |
| ZFA:0000360 | heart tube | cardiovascular system (ZFA:0000010) | Pharyngula:Prim-5 (24 h) | Pharyngula:Prim-25 (42 h) | 24 | 0.16-0.27 | ventral; left | tube | `#c0392b` |
| ZFA:0000114 | heart | cardiovascular system (ZFA:0000010) | Pharyngula:High-pec (42 h) | Adult (17520 h) | 42 | 0.17-0.25 | ventral; midline | custom | `#b03a2e` |
| ZFA:0000154 | sinus venosus | heart (ZFA:0000114) | Pharyngula:High-pec (42 h) | Adult (17520 h) | 42 | 0.22-0.25 | ventral; midline | tube | `#7b241c` |
| ZFA:0000471 | atrium | heart (ZFA:0000114) | Pharyngula:High-pec (42 h) | Adult (17520 h) | 42 | 0.20-0.25 | ventral; left | ellipsoid | `#e74c3c` |
| ZFA:0000009 | cardiac ventricle | heart (ZFA:0000114) | Pharyngula:High-pec (42 h) | Adult (17520 h) | 42 | 0.18-0.23 | ventral; midline | ellipsoid | `#a93226` |
| ZFA:0000173 | bulbus arteriosus | heart (ZFA:0000114) | Pharyngula:High-pec (42 h) | Adult (17520 h) | 42 | 0.17-0.20 | ventral; midline | lathe | `#f1948a` |
| ZFA:0001315 | atrioventricular canal | heart (ZFA:0000114) | Pharyngula:High-pec (42 h) | Unknown (17520 h) | 42 | 0.20-0.22 | ventral; midline | tube | `#922b21` |
| ZFA:0005064 | atrioventricular valve | cardiac ventricle (ZFA:0000009) | Unknown (0 h) | Adult (17520 h) | 105 | 0.20-0.22 | inside the AV canal; midline | custom | `#f5cba7` |
| ZFA:0000054 | pericardium | pericardial region (ZFA:0007115) | Segmentation:26+ somites (22 h) | Adult (17520 h) | 22 | 0.15-0.27 | ventral; midline | ellipsoid | `#f9e79f` |
| ZFA:0000014 | dorsal aorta | trunk vasculature (ZFA:0005024) | Segmentation:26+ somites (22 h) | Adult (17520 h) | 22 | 0.24-0.57 | ventral to the notochord; midline | tube | `#e31a1c` |
| ZFA:0000477 | posterior cardinal vein | trunk vasculature (ZFA:0005024) | Segmentation:26+ somites (22 h) | Adult (17520 h) | 22 | 0.20-0.57 | ventral to the dorsal aorta; midline | tube | `#1f78b4` |
| ZFA:0000423 | anterior cardinal vein | cardinal system (ZFA:0000096) | Pharyngula:Prim-5 (24 h) | Adult (17520 h) | 24 | 0.10-0.24 | lateral to the hindbrain and otic vesicle; paired | tube | `#3182bd` |
| ZFA:0000186 | common cardinal vein | cardinal system (ZFA:0000096) | Segmentation:20-25 somites (19 h) | Adult (17520 h) | 19 | 0.20-0.30 | on the lateral and ventral surface of the yolk ball; paired | sheet | `#6baed6` |
| ZFA:0000011 | caudal artery | post-vent vasculature (ZFA:0005037) | Segmentation:26+ somites (22 h) | Adult (17520 h) | 22 | 0.57-0.97 | ventral to the notochord in the tail; midline | tube | `#e31a1c` |
| ZFA:0000180 | caudal vein | post-vent vasculature (ZFA:0005037) | Larval:Day 4 (96 h) | Adult (17520 h) | 24 | 0.57-0.97 | ventral to the caudal artery; midline | tube | `#1f78b4` |
| ZFA:0001286 | caudal vein plexus | post-vent vasculature (ZFA:0005037) | Pharyngula:Prim-5 (24 h) | Larval:Days 7-13 (336 h) | 24 | 0.60-0.95 | ventral tail between the caudal artery and the ventral fin fold; midline | custom | `#9ecae1` |
| ZFA:0001285 | intersegmental vessel | trunk vasculature (ZFA:0005024) | Pharyngula:Prim-5 (24 h) | Unknown (17520 h) | 22 | 0.24-0.95 | from the dorsal aorta or posterior cardinal vein up along each somite boundary to the dorsal longitudinal anastomotic vessel; paired | segmentArray | `#fb9a99` |
| ZFA:0005025 | dorsal longitudinal anastomotic vessel | trunk vasculature (ZFA:0005024) | Pharyngula:Prim-25 (36 h) | Unknown (17520 h) | 36 | 0.24-0.95 | dorsal-most trunk; paired | tube | `#9e9ac8` |
| ZFA:0005004 | aortic arch | pharyngeal vasculature (ZFA:0005003) | Pharyngula:Prim-5 (24 h) | Adult (17520 h) | 24 | 0.12-0.24 | inside the pharyngeal arches; paired | segmentArray | `#ef3b2c` |
| ZFA:0000604 | ventral aorta | pharyngeal vasculature (ZFA:0005003) | Unknown (0 h) | Adult (17520 h) | 24 | 0.12-0.19 | ventral midline of the pharynx; midline | tube | `#cb181d` |
| ZFA:0005934 | subintestinal venous plexus | trunk vasculature (ZFA:0005024) | Pharyngula:High-pec (42 h) | Adult (17520 h) | 42 | 0.25-0.45 | on the ventral-lateral surface of the yolk ball and over the gut; paired | sheet | `#4292c6` |
| ZFA:0001267 | cranial vasculature | head (ZFA:0001114) | Pharyngula:Prim-5 (24 h) | Adult (17520 h) | 24 | 0.02-0.25 | whole head: vessels around the brain; midline | custom | `#fc9272` |
| ZFA:0001052 | primordial hindbrain channel | cranial vasculature (ZFA:0001267) | Pharyngula:Prim-5 (24 h) | Unknown (17520 h) | 24 | 0.12-0.24 | lateral to the hindbrain; paired | tube | `#6baed6` |
| ZFA:0005002 | basilar artery | cranial vasculature (ZFA:0001267) | Pharyngula:Prim-5 (24 h) | Adult (17520 h) | 24 | 0.13-0.24 | ventral midline keel of the hindbrain; midline | tube | `#cb181d` |
| ZFA:0001053 | primitive internal carotid artery | cranial vasculature (ZFA:0001267) | Pharyngula:Prim-5 (24 h) | Unknown (17520 h) | 24 | 0.05-0.15 | ventral to the midbrain and forebrain; paired | tube | `#ef3b2c` |

### 3.2 Hematopoietic and immune system

| ZFA id | Name | UI parent | ZFIN start | ZFIN end | Visible from (h) | AP fraction | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|---|
| ZFA:0000033 | intermediate cell mass of mesoderm | hematopoietic system (ZFA:0005023) | Segmentation:14-19 somites (16 h) | Hatching:Long-pec (60 h) | 16 | 0.30-0.62 | ventral to the notochord and somites; midline | tube | `#8c564b` |
| ZFA:0000094 | blood island | intermediate cell mass of mesoderm (ZFA:0000033) | Segmentation:26+ somites (22 h) | Pharyngula:Prim-5 (30 h) | 22 | 0.60-0.70 | ventral tail; midline | ellipsoid | `#7f0000` |
| ZFA:0005898 | caudal hematopoietic tissue | hematopoietic system (ZFA:0005023) | Hatching:Long-pec (48 h) | Larval:Days 7-13 (336 h) | 48 | 0.60-0.92 | ventral tail; midline | tube | `#bf5b17` |
| ZFA:0001077 | thymus primordium | immune system (ZFA:0001159) | Pharyngula:Prim-15 (30 h) | Larval:Protruding-mouth (96 h) | 54 | 0.17-0.21 | dorsal to the third pharyngeal pouch; paired | sphere | `#c5b0d5` |
| ZFA:0001078 | thymus | immune system (ZFA:0001159) | Larval:Protruding-mouth (72 h) | Adult (17520 h) | 72 | 0.16-0.22 | dorsomedial roof of the branchial (gill) cavity; paired | ellipsoid | `#9467bd` |
| ZFA:0000436 | spleen | hematopoietic system (ZFA:0005023) | Unknown (0 h) | Adult (17520 h) | 96 | 0.42-0.52 | peritoneal cavity; left | ellipsoid | `#6a3d9a` |
| ZFA:0000669 | head kidney | kidney (ZFA:0000529) | Unknown (0 h) | Adult (17520 h) | 96 | 0.20-0.30 | retroperitoneal; midline | ellipsoid | `#b15928` |

### 3.3 Respiratory system, pharyngeal arches and swim bladder

| ZFA id | Name | UI parent | ZFIN start | ZFIN end | Visible from (h) | AP fraction | DV / laterality | Shape | Color |
|---|---|---|---|---|---|---|---|---|---|
| ZFA:0001306 | pharyngeal arch | head (ZFA:0001114) | Segmentation:10-13 somites (14 h) | Adult (17520 h) | 14 | 0.12-0.24 | ventrolateral to the hindbrain; paired | segmentArray | `#ffbb78` |
| ZFA:0001613 | pharyngeal arch 3-7 | gill (ZFA:0000354) | Segmentation:10-13 somites (14 h) | Adult (17520 h) | 14 | 0.16-0.24 | posterior five arches; paired | segmentArray | `#ff7f0e` |
| ZFA:0000354 | gill | respiratory system (ZFA:0000272) | Unknown (0 h) | Adult (17520 h) | 72 | 0.14-0.23 | in the branchial cavity under the opercular flap; paired | custom | `#ff7f0e` |
| ZFA:0000667 | gill filament | gill (ZFA:0000354) | Unknown (0 h) | Adult (17520 h) | 84 | 0.15-0.23 | projecting from the posterior face of each branchial arch into the opercular cavity; paired | tube | `#d94801` |
| ZFA:0000555 | opercular flap | head (ZFA:0001114) | Unknown (0 h) | Adult (17520 h) | 72 | 0.13-0.24 | lateral head surface behind the eye; paired | sheet | `#bcbd22` |
| ZFA:0005967 | pseudobranch | head (ZFA:0001114) | Larval:Day 4 (96 h) | Adult (17520 h) | 96 | 0.12-0.15 | inner face of the opercular region; paired | ellipsoid | `#fdae6b` |
| ZFA:0005335 | swim bladder bud | pleuroperitoneal region (ZFA:0007116) | Pharyngula:Prim-25 (36 h) | Hatching:Long-pec (60 h) | 36 | 0.27-0.30 | dorsal wall of the foregut at the level of somite 2; midline | sphere | `#e5e5e5` |
| ZFA:0000076 | swim bladder | pleuroperitoneal region (ZFA:0007116) | Hatching:Pec-fin (60 h) | Adult (17520 h) | 96 | 0.27-0.38 | dorsal to the gut and liver; midline | ellipsoid | `#c7c7c7` |
| ZFA:0001278 | posterior chamber swim bladder | swim bladder (ZFA:0000076) | Unknown (0 h) | Adult (17520 h) | 96 | 0.27-0.36 | dorsal to the gut; midline | ellipsoid | `#d9d9d9` |
| ZFA:0001277 | anterior chamber swim bladder | swim bladder (ZFA:0000076) | Larval:Days 14-20 (336 h) | Adult (17520 h) | 336 | 0.25-0.42 | dorsal to the liver and anterior gut; midline | ellipsoid | `#bdbdbd` |

Some UI parents are group terms that this list does not model. They are: ZFA:0000010 cardiovascular system, ZFA:0007115 pericardial region, ZFA:0005024 trunk vasculature, ZFA:0000096 cardinal system, ZFA:0005037 post-vent vasculature and ZFA:0005003 pharyngeal vasculature. Further group terms are ZFA:0001114 head, ZFA:0005023 hematopoietic system, ZFA:0001159 immune system, ZFA:0000529 kidney, ZFA:0000272 respiratory system and ZFA:0007116 pleuroperitoneal region. The JSON field `zfaPartOf` lists every ZFA `part_of` parent. The `parent` field picks one for the tree. Five terms have no ZFA `part_of` parent: ventral aorta, subintestinal venous plexus, opercular flap, pseudobranch and swim bladder bud. I assigned a parent to each and say so in the notes.

## 4. Deviations from the ZFIN stage range

The JSON keeps the ZFIN stages. The rows below give the time at which I recommend the model shows the structure, with the reason.

| ZFA id | Name | ZFIN start (h) | Visible from (h) | Reason |
|---|---|---|---|---|
| ZFA:0005064 | atrioventricular valve | 0 | 105 | ZFIN start is Unknown. Endocardial cushions form at 48 hpf and become leaflets by 105 hpf (Bakkers 2011); show the valve from 105 hpf. |
| ZFA:0000180 | caudal vein | 96 | 24 | ZFIN starts the term at Day 4 (96 hpf), when the plexus has remodeled into one vessel. A single ventral return channel already carries flow from 24 hpf; before 96 hpf draw it as the dorsal-most channel of the caudal vein plexus. |
| ZFA:0001285 | intersegmental vessel | 24 | 22 | ZFIN start is Prim-5 (24 hpf). Primary sprouts leave the dorsal aorta from about 22 hpf (Isogai et al. 2003 as summarized by ScienceDirect Topics; unverified). |
| ZFA:0000604 | ventral aorta | 0 | 24 | ZFIN start is Unknown. The vessel carries flow from the bulbus to aortic arch 1 once circulation starts at 24-26 hpf. |
| ZFA:0001077 | thymus primordium | 30 | 54 | ZFIN starts the term at Prim-15 (30 hpf). The first morphological primordium appears in the third pharyngeal pouch at 54 hpf (Lam et al. 2004) or 60 hpf (Willett et al. 1999). |
| ZFA:0000436 | spleen | 0 | 96 | ZFIN start is Unknown. The splenic primordium appears by 4 dpf in a small hox11-positive area of the left anterior gut (fish spleen review 2023). |
| ZFA:0000669 | head kidney | 0 | 96 | ZFIN start is Unknown. Hematopoietic cells are present in the pronephros at 96 hpf (Willett et al. 1999) and kidney hematopoiesis starts at 4 dpf (Murayama et al. 2006). The adult head kidney is the kidney marrow. |
| ZFA:0000354 | gill | 0 | 72 | ZFIN start is Unknown. Gill filament rudiments bud late in the hatching period (Kimmel et al. 1995) and the first filaments are visible at 3.5 dpf (gill atlas 2025). |
| ZFA:0000667 | gill filament | 0 | 84 | ZFIN start is Unknown. First filaments visible at 3.5 dpf (gill atlas 2025). |
| ZFA:0000555 | opercular flap | 0 | 72 | ZFIN start is Unknown. The hyoid arch forms the operculum (Kimmel et al. 1995). The opercle bone starts to ossify about 3 dpf (Cubbage and Mabee 1996, unverified). I suggest showing the flap from 72 hpf and letting it cover the gill arches by 120 hpf (unverified). |
| ZFA:0000076 | swim bladder | 60 | 96 | ZFIN starts the term at Pec-fin (60 hpf) as an uninflated sac. The posterior chamber inflates at 96-120 hpf (Winata et al. 2009; SL 3.4-3.7 mm in Parichy et al. 2009). Show a collapsed sac from 60 hpf and inflate it at about 100 hpf. |
| ZFA:0001278 | posterior chamber swim bladder | 0 | 96 | ZFIN start is Unknown. The single larval chamber is the posterior chamber; it inflates at 96-120 hpf. |

Seven structures have a ZFIN start of Unknown. They are the atrioventricular valve, the spleen, the head kidney and the gill. They also include the gill filament, the opercular flap and the posterior chamber of the swim bladder. They have no size rows before their visible-from time. They do not exist as visible structures at 24 hpf or 48 hpf.

Five structures have a ZFIN end of Unknown: atrioventricular canal, intersegmental vessel, dorsal longitudinal anastomotic vessel, primordial hindbrain channel and primitive internal carotid artery. They carry `endHpf` 17520 in the JSON. The notes say how to treat each one after the larval period.

## 5. Timeline of key events

| hpf | Event | Source |
|---|---|---|
| 11.5 | Intermediate cell mass described from the 5-somite stage. | Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/ |
| 11.7 | Bilateral heart fields (heart primordium) present; ZFIN start at 5-9 somites. | ZFA:0000028 |
| 14 | Pharyngeal arch primordium present (ZFIN start, 10-13 somites). | ZFA:0001306 |
| 16 | First cardiomyocyte differentiation (myl7) at the 14-somite stage; angioblasts form the vascular cord. | From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/; ZFA:0005077 |
| 19.5 | Heart cone forms (19.5-22 hpf). | ZFA:0000115 |
| 20 | Lateral dorsal aortae join into one vessel per side. | Gore et al. 2012, Cold Spring Harb Perspect Med 2:a006684, https://pmc.ncbi.nlm.nih.gov/articles/PMC3331685/ |
| 20 | Common cardinal vein endothelium migrates over the yolk. | Helker et al. 2013, Development 140:2776-2786, https://journals.biologists.com/dev/article/140/13/2776/76627 |
| 21 | Leftward jog of the heart tube (21-23 hpf). | From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/ |
| 22 | Dorsal aorta, posterior cardinal vein, caudal artery, blood island and pericardium: ZFIN start at 26+ somites. | anatomy_item.txt |
| 22 | Primary intersegmental sprouts leave the dorsal aorta (about 22 hpf). | Intersegmental vessel overview (ScienceDirect Topics), https://www.sciencedirect.com/topics/medicine-and-dentistry/intersegmental-vessel |
| 24 | Heart begins to beat; aortic arch 1 appears; blood begins to circulate during Prim-5. | https://zfin.org/zf_info/zfbook/stages/phar.html |
| 24 | Primordial hindbrain channel, basilar artery, primitive internal carotid artery, anterior cardinal vein: ZFIN start at Prim-5. | anatomy_item.txt |
| 25 | Caudal vein plexus sprouts from the posterior cardinal vein (25-30 hpf). | ZFA:0001286 |
| 26 | Common cardinal vein lumen open by 26 hpf; ensheathment after 32 hpf. | Helker et al. 2013, Development 140:2776-2786, https://journals.biologists.com/dev/article/140/13/2776/76627 |
| 28 | Cardiac looping observable from 28 hpf. | Twisting of the zebrafish heart tube during cardiac looping, eLife 9:e61733 (2020), https://elifesciences.org/articles/61733 |
| 30 | Hematopoietic stem cells emerge (ZFIN start of ZFA:0009014 at Prim-15). | https://zfin.org/ZFA:0009014 |
| 36 | Looping under way; AV canal endocardium becomes cuboidal; DLAV forms; primary intersegmental network complete; swim bladder bud starts (36-48 hpf). | Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/; ImageJ-based analysis of the developing zebrafish vasculature, Vascular Cell 9:2 (2017), https://vascularcell.com/public/journals/1/articles/13221-09-01-172/13221-09-02_html.html; Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/ |
| 42 | Heart, atrium, ventricle, bulbus arteriosus, sinus venosus, AV canal and subintestinal venous plexus: ZFIN start at High-pec. | anatomy_item.txt |
| 48 | Six pairs of aortic arches carry blood early in the hatching period; gill slits form; 231 ventricular cardiomyocytes; pro-epicardium; heart rate 141 bpm. | https://zfin.org/zf_info/zfbook/stages/hatch.html; Auman et al. 2007, PLoS Biol 5:e53, https://pmc.ncbi.nlm.nih.gov/articles/PMC1802756/; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/; Denvir et al. 2008, BMC Biotechnol 8:21, https://pmc.ncbi.nlm.nih.gov/articles/PMC2291041/ |
| 48 | HSPCs lodge in the caudal hematopoietic tissue (48-96 hpf). | Murayama et al. 2006, Immunity 25:963-975, https://pubmed.ncbi.nlm.nih.gov/17157041/ |
| 54 | Thymic primordium in the third pharyngeal pouch (54 h per Lam et al. 2004; 60 h per Willett et al. 1999); lymphoblasts colonize by 65 h. | Lam et al. 2004, Dev Comp Immunol 28:9-28, https://www.sciencedirect.com/science/article/abs/pii/S0145305X03001034; Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/ |
| 55 | Looping and chamber ballooning complete. | Twisting of the zebrafish heart tube during cardiac looping, eLife 9:e61733 (2020), https://elifesciences.org/articles/61733 |
| 60 | Four filament-free branchial arches at 2.5 dpf; ZFIN start of the swim bladder (Pec-fin) and aortic arches 5-6. | Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/; anatomy_item.txt |
| 72 | Epicardium spreads; gill filament rudiments bud; thymus term starts; aortic arch 2 ends; vascular smooth muscle on the aorta by 3 dpf. | Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/; https://zfin.org/zf_info/zfbook/stages/hatch.html; Stratman et al. 2017, Development 144:115-127, https://journals.biologists.com/dev/article/144/1/115/47946 |
| 84 | First gill filaments visible at 3.5 dpf. | Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/ |
| 96 | Posterior swim bladder chamber inflates (96-120 hpf); pseudobranch bud; splenic primordium; kidney hematopoiesis starts; rag1 and TCR alpha in the thymus; caudal vein plexus remodels; ZFIN start of the caudal vein. | Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/; ZFA:0005967; The fish spleen (review, 2023), Fish Shellfish Immunol, https://www.sciencedirect.com/science/article/pii/S1050464823007660; Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/; Danilova et al. 2004, Dev Comp Immunol 28:755-767, https://pubmed.ncbi.nlm.nih.gov/15043944/; ZFA:0001286 |
| 105 | AV valve leaflets formed. | Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/ |
| 120 | Heart in terminal position by SL 3.6 mm; heart rate 172 bpm. | Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/; Denvir et al. 2008, BMC Biotechnol 8:21, https://pmc.ncbi.nlm.nih.gov/articles/PMC2291041/ |
| 168 | Thymus pouch-like at 1 wpf; gill lamellae from about 7 dpf (unverified). | Lam et al. 2002, Dev Dyn 225:87-94, https://pubmed.ncbi.nlm.nih.gov/12203724/; Jonz and Nurse 2005, J Exp Biol 208:1537-1549, https://www.researchgate.net/publication/7932803_Development_of_oxygen_sensing_in_the_gills_of_zebrafish |
| 336 | Caudal hematopoietic tissue and caudal vein plexus end (Days 7-13); anterior swim bladder chamber term starts (Days 14-20). | anatomy_item.txt |
| 408 | Pseudobranch has five filaments at 17 dpf. | ZFA:0005967 |
| 432 | Anterior swim bladder chamber evaginates at 18 dph (6 mm); inflated at 21 dpf; appears at 5.9-6.2 mm SL. | Robertson et al. 2007, J Morphol 268:967-985, https://pubmed.ncbi.nlm.nih.gov/17702001/; Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/; Parichy et al. 2009, Dev Dyn 238:2975-3015, https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| 504 | Thymus morphologically mature at 3 wpf; lymphocytes in the kidney at 3 weeks. | Lam et al. 2002, Dev Dyn 225:87-94, https://pubmed.ncbi.nlm.nih.gov/12203724/; Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/ |
| 720 | Lymphocytes in the spleen at 30 dpf. | The fish spleen (review, 2023), Fish Shellfish Immunol, https://www.sciencedirect.com/science/article/pii/S1050464823007660 |
| 1440 | Ventricle growth slows from 125 to 17.8 um per day at 60 dpf. | Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/ |
| 2160 | Adult: pseudobranch filaments fused; ventricle length 4.28 percent of SL; about 25 gill filaments per arch by 6 months. | ZFA:0005967; Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/; Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/ |
| 2520 | Thymic involution begins at 15 wpf. | Lam et al. 2002, Dev Dyn 225:87-94, https://pubmed.ncbi.nlm.nih.gov/12203724/ |

## 6. Per-structure notes

### Cardiovascular system

#### heart primordium (ZFA:0000028)

ZFA definition: Bilateral groups of cells consisting of three rows: one row of endocardial precursors medially and two rows of myocardial precursors laterally. The two populations fuse at the midline between 21 and 26 somites to form the heart rudiment or cone.

Synonyms: cardiac field, heart primordia. ZFA part_of: ZFA:0000010. Develops from: ZFA:0001065.

Stage range: Segmentation:5-9 somites (ZFS:0000024, 11.66 h) to Segmentation:20-25 somites (ZFS:0000027, 22 h).

Position: AP fraction 0.15-0.25. Ventral, in the anterior lateral plate mesoderm, level of the hindbrain. Laterality: paired. Landmarks: two bilateral stripes lateral to the hindbrain, dorsal to the anterior yolk; they converge to the midline between 21 and 26 somites.

Shape (sheet): Two thin flat patches, one on each side of the midline. Animate the patches moving medially from 16 hpf to 21 hpf until they touch. Hand over to the heart rudiment at 19-22 hpf.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| 14-19 somites | 17 | length 150, width 50, thickness 15 | estimate | estimate from bilateral myl7 stripes; no measurement found |

Events:

- 11.7 h: ZFIN start: bilateral cardiac fields present at the 5-9 somite stage
- 16 h: first cardiomyocyte differentiation (myl7) at the 14-somite stage
- 19 h: vmhc (ventricle) and amhc (atrium) expression separate the two chamber lineages
- 21 h: the two fields fuse at the midline (21-26 somites) and form the heart cone

Notes: The ZFA definition gives three cell rows per side: one endocardial row medially and two myocardial rows laterally. The 3D model can draw this as two flat patches that slide to the midline. Sizes are estimates; I found no measurement of the patch.

Sources: https://zfin.org/ZFA:0000028; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/; From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/

#### heart rudiment (ZFA:0000115)

ZFA definition: The migrating myocardial precursors of the heart rudiment form a cone like structure between 19.5 hpf and 22 hpf, and eventually telescope out into the primitive heart tube at 24hpf.

Synonyms: heart cone, rudimentary heart. ZFA part_of: ZFA:0000010. Develops from: ZFA:0000028.

Stage range: Segmentation:20-25 somites (ZFS:0000027, 19 h) to Segmentation:26+ somites (ZFS:0000028, 24 h).

Position: AP fraction 0.17-0.22. Ventral midline, under the hindbrain and posterior to the otic vesicles, anterior to the yolk ball. Laterality: midline. Landmarks: the cone sits on the ventral midline; the apex (future ventricle) points dorsally, the base (future atrium) lies on the yolk.

Shape (lathe): Shallow cone, apex dorsal. Diameter 100-120 um, height 40 um (estimate). Rotate and tilt it to the left between 21 and 24 hpf (leftward jog) and stretch it into the primitive heart tube.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| 20-25 somites | 21 | diameter 110, height 40 | estimate | the cardiac disc image in Bakkers 2011 (20.5 hpf) shows a disc about 100 um across (unverified) |

Events:

- 19.5 h: cone forms between 19.5 and 22 hpf (ZFA definition)
- 20.5 h: cardiac disc stage shown in Bakkers 2011
- 21 h: leftward jog of the extruding tube, 21-23 hpf
- 24 h: the cone telescopes into the primitive heart tube

Notes: Synonym: heart cone. This term ends at the 26+ somite stage in ZFIN, so the cone lives for 19-24 hpf.

Sources: https://zfin.org/ZFA:0000115; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/; From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/

#### primitive heart tube (ZFA:0000149)

ZFA definition: Multi-tissue structure that arises from the heart rudiment and will become the heart tube.

Synonyms: none. ZFA part_of: ZFA:0000010, ZFA:0007115. Develops from: ZFA:0000115.

Stage range: Segmentation:26+ somites (ZFS:0000028, 22 h) to Pharyngula:Prim-5 (ZFS:0000029, 30 h).

Position: AP fraction 0.16-0.27. Ventral midline to left of midline, under the hindbrain, anterior-dorsal to the yolk ball. Laterality: left. Landmarks: venous pole on the anterior-left yolk margin; arterial pole under the hindbrain; the tube points anteriorly and slightly leftward.

Shape (tube): Straight tube. Diameter about 50 um (Battista et al. 2016 citing Baird et al. 2014). Length about 200 um (estimate). Add a slow peristaltic pulse from 24 hpf.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| 26+ somites | 23 | length 180, diameter 50 | estimate | diameter from Battista et al. 2016, arXiv:1610.03427 (heart tube diameter 0.05 mm at 26-30 hpf, citing Baird et al. 2014), https://arxiv.org/abs/1610.03427; length is an estimate |
| Prim-5 | 24 | length 200, diameter 50 | estimate | diameter 0.05 mm for 26-30 hpf from Battista et al. 2016, arXiv:1610.03427 (heart tube diameter 0.05 mm at 26-30 hpf, citing Baird et al. 2014), https://arxiv.org/abs/1610.03427; length is an estimate |

Events:

- 22 h: ZFIN start (26+ somites)
- 24 h: the tube begins rhythmic peristaltic contraction (heartbeat onset)
- 24 h: blood begins to circulate during the Prim-5 stage (24-30 hpf)

Notes: ZFIN keeps three tube terms in sequence: primitive heart tube (22-30 hpf), heart tube (24-42 hpf) and heart (42 hpf to adult). The ranges overlap on purpose. I recommend one 'heart' track in the model that switches its label by stage.

Sources: https://zfin.org/ZFA:0000149; https://zfin.org/zf_info/zfbook/stages/phar.html; Battista et al. 2016, arXiv:1610.03427 (heart tube diameter 0.05 mm at 26-30 hpf, citing Baird et al. 2014), https://arxiv.org/abs/1610.03427; From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/

#### heart tube (ZFA:0000360)

ZFA definition: Cavitated compound organ that will become the adult heart following looping morphogenesis and valve formation.

Synonyms: none. ZFA part_of: ZFA:0000010, ZFA:0007115. Develops from: ZFA:0000149.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Pharyngula:Prim-25 (ZFS:0000031, 42 h).

Position: AP fraction 0.16-0.27. Ventral, under the hindbrain and pharynx, anterior to the yolk ball, inside the pericardial cavity. Laterality: left. Landmarks: the tube loops between 28 and 48 hpf; the ventricle moves to the midline and the atrium stays left-dorsal.

Shape (tube): Tube along a spline. Keyframe the spline from straight (24 hpf) to a C shape (36 hpf) to an S shape (48 hpf). Give the two halves different radii: atrial half 45 um, ventricular half 40 um at 30 hpf; then let both balloon.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 200, diameter 50 | estimate | diameter from Battista et al. 2016, arXiv:1610.03427 (heart tube diameter 0.05 mm at 26-30 hpf, citing Baird et al. 2014), https://arxiv.org/abs/1610.03427; length is an estimate |
| Prim-15 | 30 | length 250, diameter 55 | estimate | no measurement found |
| Prim-25 | 36 | length 280, atrial_diameter 80, ventricular_diameter 70 | estimate | no measurement found |

Events:

- 24 h: synchronized contraction begins
- 28 h: looping can be observed from 28 hpf
- 30 h: linear heart tube fully formed; differentiation continues at the arterial pole
- 36 h: looping under way, ventricle displaced toward the midline; endocardial cells of the future AV canal become cuboidal
- 42 h: ZFIN end of the term; the organ is called heart from High-pec

Notes: No published length of the tube in micrometers was found. The tube diameter (50 um) comes from a modeling paper that cites Baird et al. 2014.

Sources: https://zfin.org/ZFA:0000360; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/; Twisting of the zebrafish heart tube during cardiac looping, eLife 9:e61733 (2020), https://elifesciences.org/articles/61733; From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/

#### heart (ZFA:0000114)

ZFA definition: Blood pumping organ composed of four components: sinus venosus, atrium, cardiac ventricle and bulbus arteriosus.

Synonyms: none. ZFA part_of: ZFA:0000010, ZFA:0007115. Develops from: ZFA:0000360.

Stage range: Pharyngula:High-pec (ZFS:0000032, 42 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.17-0.25. Ventral, posterior and ventral to the gills, inside the pericardial cavity; anterior to the liver and yolk. Laterality: midline. Landmarks: larva: between the opercular region and the anterior yolk. Adult: in the pericardial cavity behind the gill chamber, ventral to the esophagus.
AP fraction by stage: 48 h 0.17-0.25; 120 h 0.18-0.24; adult 0.17-0.24.

Shape (custom): Compound of four lathe or ellipsoid parts: sinus venosus, atrium, ventricle, bulbus arteriosus. Larval ventricle: rectangular outline; juvenile: triangular; adult: near circular (circularity 0.83). Keep the total height about equal to the sum of atrium plus ventricle.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 250, height 150, width 120 | estimate | ventricle length derived from the 4.28 percent of SL ratio in Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/ |
| Day 5 | 120 | length 300, height 200, width 150 | estimate | ventricle length derived from the 4.28 percent of SL ratio in Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/ |
| Adult | 2160 | length 2500, height 1500, width 1200 | derived | ventricle 1070 um and bulbus 610 um derived from Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/ at SL 25 mm (Ivanovski et al. 2009, PMID 20087250 (adult average size 2.5 cm), https://pubmed.ncbi.nlm.nih.gov/20087250/) |

Events:

- 42 h: ZFIN start (High-pec): four regions can be named
- 48 h: looped heart with atrium and ventricle separated by the AV canal; 231 ventricular cardiomyocytes; heart rate 141 bpm at 28 C
- 48 h: pro-epicardium appears as a cluster near the ventral wall
- 55 h: looping and chamber ballooning complete
- 72 h: epicardium spreads over the myocardium; heart rate 147 bpm
- 105 h: endocardial cushions differentiate into valve leaflets
- 120 h: terminal rotation done by SL 3.6 mm: atrium moves behind the ventricle; heart rate 172 bpm
- 1440 h: ventricle length grows 125 um per day until 60 dpf, then 17.8 um per day until 180 dpf
- 2160 h: adult: ventricle length 4.28 percent of SL, width to length ratio 0.83, compact myocardium 3-4 cells thick

Notes: Singleman and Holtzman 2012 give ventricle length as 4.28 percent of standard length across life, and bulbus length as 57 percent of ventricle length. I used these ratios with SL 2.9 mm (48 hpf), 3.5 mm (120 hpf) and 25 mm (adult) to derive sizes. The 48 hpf and 120 hpf SL values are estimates from the ZFIN total lengths of 3.1 mm and 3.9 mm.

Sources: https://zfin.org/ZFA:0000114; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/; Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/; Auman et al. 2007, PLoS Biol 5:e53, https://pmc.ncbi.nlm.nih.gov/articles/PMC1802756/; Denvir et al. 2008, BMC Biotechnol 8:21, https://pmc.ncbi.nlm.nih.gov/articles/PMC2291041/; Twisting of the zebrafish heart tube during cardiac looping, eLife 9:e61733 (2020), https://elifesciences.org/articles/61733; Gupta and Mullins 2010, J Vis Exp 37:1717, https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/

#### sinus venosus (ZFA:0000154)

ZFA definition: Heart region collecting blood from the paired common cardinal veins and delivering to the atrium. One of four components of the heart.

Synonyms: inflow tract. ZFA part_of: ZFA:0000114. Develops from: ZFA:0001722.

Stage range: Pharyngula:High-pec (ZFS:0000032, 42 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.22-0.25. Ventral; the most posterior and dorsal heart region, on the anterior yolk surface. Laterality: midline. Landmarks: receives the left and right common cardinal veins; opens into the atrium.

Shape (tube): Short wide funnel at the venous pole. Draw as a tube 40 um long that flares from the two common cardinal veins into the atrium. In the adult draw a thin-walled sac 400 um across.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 40, diameter 45 | estimate | no measurement found |
| Day 5 | 120 | length 50, diameter 60 | estimate | no measurement found |
| Adult | 2160 | length 400, diameter 400 | estimate | no measurement found |

Events:

- 42 h: ZFIN start (High-pec)
- 48 h: acts as the pacemaker region and contracts first (ZFA definition)

Notes: Synonym: inflow tract. No measurement found; all sizes are estimates scaled to the heart.

Sources: https://zfin.org/ZFA:0000154

#### atrium (ZFA:0000471)

ZFA definition: Cavitated compound organ that receives inflow of deoxygenated blood and delivers it to a muscular cardiac ventricle. Valves are present to direct flow.

Synonyms: none. ZFA part_of: ZFA:0000114. Develops from: ZFA:0001718.

Stage range: Pharyngula:High-pec (ZFS:0000032, 42 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.20-0.25. Ventral; left and dorsal of the ventricle at 48 hpf; posterior and dorsal to the ventricle from 5 dpf. Laterality: left. Landmarks: thin-walled chamber between the sinus venosus and the AV canal.

Shape (ellipsoid): Thin-walled ellipsoid. At 48 hpf place it left-dorsal of the ventricle; by 120 hpf move it behind (posterior-dorsal to) the ventricle. Adult volume about equals the ventricle volume; wall 1 cell thick, trabeculae fill about 33 percent.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 110, width 90, wall 5 | estimate | no measurement found |
| Day 5 | 120 | length 140, width 110, wall 5 | estimate | no measurement found |
| Adult | 2160 | length 1000, width 900, wall 30 | estimate | volume about equal to the ventricle per Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/ |

Events:

- 19 h: amhc expression marks atrial precursors
- 42 h: ZFIN start (High-pec)
- 120 h: terminal rotation places the atrium behind the ventricle (SL 3.6 mm)

Notes: Sizes are estimates. The atrium is dorsal and slightly left of the ventricle in the larva; in lateral view it lies behind the ventricle.

Sources: https://zfin.org/ZFA:0000471; Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/; From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/

#### cardiac ventricle (ZFA:0000009)

ZFA definition: Cavitated compound organ that receives blood flow from the atrium and delivers blood to the body via the aorta. Valves are present to direct flow.

Synonyms: ventricle. ZFA part_of: ZFA:0000114. Develops from: ZFA:0001719.

Stage range: Pharyngula:High-pec (ZFS:0000032, 42 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.18-0.23. Ventral; the most ventral and anterior chamber after looping; under the pharynx. Laterality: midline. Landmarks: between the AV canal and the bulbus arteriosus; outer curvature faces ventrally and to the right.

Shape (ellipsoid): Thick-walled ellipsoid with width to length ratio 0.83. Larval outline rectangular, juvenile triangular, adult near circular in lateral view. Trabeculae fill 73 percent of the adult lumen.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 125, width 105, wall 10 | derived | derived: 4.28 percent of an estimated SL 2.9 mm (Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/); larval ratio ranges 2.67-7.78 percent |
| Day 5 | 120 | length 150, width 125, wall 12 | derived | derived: 4.28 percent of SL 3.5 mm (Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/; SL from Parichy et al. 2009, Dev Dyn 238:2975-3015, https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/) |
| Adult | 2160 | length 1070, width 890, wall 60 | derived | derived: 4.28 percent of SL 25 mm and width ratio 0.83 (Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/; SL from Ivanovski et al. 2009, PMID 20087250 (adult average size 2.5 cm), https://pubmed.ncbi.nlm.nih.gov/20087250/); wall is an estimate |

Events:

- 16 h: first myl7 expression in future ventricle cells (14-somite stage)
- 19 h: vmhc expression marks ventricular precursors
- 42 h: ZFIN start (High-pec)
- 48 h: 231 ventricular cardiomyocytes; outer curvature cells flatten and elongate
- 72 h: trabeculation begins between 72 and 120 hpf
- 2160 h: compact myocardium 3-4 cells thick

Notes: The 4.28 percent ratio is a lifetime average from Singleman and Holtzman 2012. Their larval values range from 2.67 to 7.78 percent of body length, so treat the 48 hpf value as a rough guide.

Sources: https://zfin.org/ZFA:0000009; Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/; Auman et al. 2007, PLoS Biol 5:e53, https://pmc.ncbi.nlm.nih.gov/articles/PMC1802756/; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/

#### bulbus arteriosus (ZFA:0000173)

ZFA definition: Multi-tissue structure that consists of three layers and through which the blood exits the heart. The bulbus arteriosus is a pear shaped chamber that functions as a capacitor, maintaining continuous blood flow into the gill arches.

Synonyms: cardiac outflow tract, outflow tract, truncus. ZFA part_of: ZFA:0000114. Develops from: ZFA:0001712.

Stage range: Pharyngula:High-pec (ZFS:0000032, 42 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.17-0.20. Ventral; anterior to the ventricle, under the pharynx; continues into the ventral aorta. Laterality: midline. Landmarks: pear-shaped outflow chamber; the outflow tract angle stabilizes near 35 degrees in adults.

Shape (lathe): Pear shape (lathe), wide base on the ventricle and narrow neck into the ventral aorta. Length 57 percent of ventricle length. Tilt the axis 30-35 degrees anterior-dorsal.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 45, diameter 35 | estimate | no measurement found |
| Day 5 | 120 | length 85, diameter 55 | derived | derived: 57 percent of ventricle length (Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/) |
| Adult | 2160 | length 600, diameter 400 | derived | derived: 57 percent of ventricle length and 1.97 percent of SL (Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/) |

Events:

- 42 h: ZFIN start (High-pec)
- 72 h: outflow tract angle rises quickly during larval stages to about 30 degrees
- 2160 h: three wall layers; elastic reservoir that smooths flow into the gill arches

Notes: Synonyms: outflow tract, truncus. The 48 hpf size is an estimate; the bulbus is small and pale at that stage.

Sources: https://zfin.org/ZFA:0000173; Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/

#### atrioventricular canal (ZFA:0001315)

ZFA definition: The part of the heart connecting the atrium to the cardiac ventricle.

Synonyms: AV canal, AVC. ZFA part_of: ZFA:0000114. Develops from: ZFA:0001723.

Stage range: Pharyngula:High-pec (ZFS:0000032, 42 h) to Unknown (ZFS:0000000, 17520 h).

Position: AP fraction 0.20-0.22. Ventral; constriction between atrium and ventricle. Laterality: midline. Landmarks: the AV canal lies dorsal and posterior to the ventricle after looping.

Shape (tube): Short narrow ring joining the two chambers. Diameter about 40 percent of the ventricle width.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 30, diameter 40 | estimate | no measurement found |
| Day 5 | 120 | length 40, diameter 50 | estimate | no measurement found |
| Adult | 2160 | length 200, diameter 350 | estimate | no measurement found |

Events:

- 36 h: endocardial cells of the future AV canal become cuboidal
- 42 h: ZFIN start (High-pec)
- 48 h: single layer of cuboidal endocardial cells lines the canal; AV conduction delay appears between 36 and 48 hpf

Notes: ZFIN gives the end stage as Unknown. I keep the canal through the adult as the valve ring; the JSON endHpf follows the ZFIN Unknown stage (17520 h).

Sources: https://zfin.org/ZFA:0001315; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/

#### atrioventricular valve (ZFA:0005064)

ZFA definition: The atrioventricular valve has four distinct leaflets oriented anterior, posterior, left, and right of the atrioventricular orifice.

Synonyms: none. ZFA part_of: ZFA:0000009, ZFA:0000471. Develops from: ZFA:0001317.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 105 h: ZFIN start is Unknown. Endocardial cushions form at 48 hpf and become leaflets by 105 hpf (Bakkers 2011); show the valve from 105 hpf.

Position: AP fraction 0.20-0.22. Inside the AV canal. Laterality: midline. Landmarks: four leaflets: anterior, posterior, left and right of the AV orifice.

Shape (custom): Four small flaps inside the AV canal ring. In the whole-body view a thin torus is enough.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 5 | 120 | ring_diameter 50, leaflet_length 20 | estimate | no measurement found |
| Adult | 2160 | ring_diameter 350, leaflet_length 150 | estimate | no measurement found |

Events:

- 48 h: endocardial cushion stage
- 105 h: cushions enlarge and differentiate into valve leaflets

Notes: ZFA lists the valve as part of both the atrium and the ventricle; I set the ventricle as the UI parent.

Sources: https://zfin.org/ZFA:0005064; Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/

#### pericardium (ZFA:0000054)

ZFA definition: Serous membrane that surrounds the heart.

Synonyms: pericardial sac. ZFA part_of: ZFA:0007115. Develops from: not stated.

Stage range: Segmentation:26+ somites (ZFS:0000028, 22 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.15-0.27. Ventral; the sac under the head and pharynx, anterior to the yolk ball. Laterality: midline. Landmarks: the hatching gland cells sit on the pericardium in the pharyngula; the sac encloses the heart.

Shape (ellipsoid): Translucent thin-walled ellipsoid shell around the heart, open where the great vessels enter. Render with alpha 0.2.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 250, height 150, width 150 | estimate | no measurement found |
| Long-pec | 48 | length 320, height 220, width 200 | estimate | no measurement found |
| Day 5 | 120 | length 400, height 260, width 220 | estimate | no measurement found |
| Adult | 2160 | length 3000, height 2000, width 1500 | estimate | no measurement found |

Events:

- 22 h: ZFIN start (26+ somites)
- 24 h: hatching gland cells are prominent on the pericardial region through the pharyngula period

Notes: ZFA parent is the pericardial region (ZFA:0007115), an anatomical cluster. For the UI you may nest the pericardium under the heart node.

Sources: https://zfin.org/ZFA:0000054; https://zfin.org/zf_info/zfbook/stages/phar.html

#### dorsal aorta (ZFA:0000014)

ZFA definition: Principal unpaired, median artery of the trunk, leading from the paired roots (radices) of the dorsal aorta to the caudal artery.

Synonyms: DA, dorsal aortic root. ZFA part_of: ZFA:0005024, ZFA:0005295. Develops from: ZFA:0005077.

Stage range: Segmentation:26+ somites (ZFS:0000028, 22 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.24-0.57. Ventral to the notochord, dorsal to the posterior cardinal vein and gut. Laterality: midline. Landmarks: starts at the radix (somites 1-3), where the two lateral dorsal aortae fuse. Ends at the vent and continues as the caudal artery.
AP fraction by stage: 24 h 0.26-0.62; 48 h 0.25-0.57; 120 h 0.23-0.55; adult 0.20-0.60.

Shape (tube): Straight tube along the trunk just under the notochord. Diameter 25-32 um in the embryo. Give it 30 short side branches (the intersegmental arteries) at somite boundaries.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 700, diameter 25 | estimate | length from the trunk span at TL 1.9 mm |
| High-pec/Long-pec | 48 | length 1000, diameter 32 | estimate | diameter about 32 um at 42.5 hpf reported for Stratman et al. 2017, Development 144:115-127, https://journals.biologists.com/dev/article/144/1/115/47946 (unverified, from a search summary); length is an estimate |
| Day 5 | 120 | length 1250, diameter 28 | estimate | diameter decreases between 48 and 72 hpf (Endothelial cell morphology and dorsal aorta geometry (2024), https://pmc.ncbi.nlm.nih.gov/articles/PMC11392406/) |
| Adult | 2160 | length 10000, diameter 150 | estimate | estimate (unverified) |

Events:

- 16 h: angioblasts migrate to the midline and form the vascular cord (ZFA:0005077, 14-19 somites)
- 20 h: the lateral dorsal aortae join into one vessel on each side around 20 hpf
- 22 h: ZFIN start (26+ somites): single dorsal aorta tube in the trunk
- 22 h: primary intersegmental sprouts leave the dorsal aorta from about 22 hpf
- 24 h: circulation starts during Prim-5; the aorta is renamed caudal artery where it enters the tail
- 30 h: hematopoietic stem cells emerge from the ventral aortic floor from Prim-15 (ZFA:0009014 start)
- 72 h: vascular smooth muscle cells appear on the mid-trunk aorta by 3 dpf

Notes: ZFA part_of parents: trunk vasculature (ZFA:0005024) and axial blood vessel (ZFA:0005295). The adult diameter is an estimate; I found no published value.

Sources: https://zfin.org/ZFA:0000014; https://zfin.org/zf_info/zfbook/stages/phar.html; Gore et al. 2012, Cold Spring Harb Perspect Med 2:a006684, https://pmc.ncbi.nlm.nih.gov/articles/PMC3331685/; Intersegmental vessel overview (ScienceDirect Topics), https://www.sciencedirect.com/topics/medicine-and-dentistry/intersegmental-vessel; Stratman et al. 2017, Development 144:115-127, https://journals.biologists.com/dev/article/144/1/115/47946; Endothelial cell morphology and dorsal aorta geometry (2024), https://pmc.ncbi.nlm.nih.gov/articles/PMC11392406/; https://zfin.org/ZFA:0009014

#### posterior cardinal vein (ZFA:0000477)

ZFA definition: Continuation of the caudal vein cranial to the anal pore. The cardinal vein splits into a pair of vessels in the cranial trunk, just caudal to the radix of the aorta.

Synonyms: axial vein, caudal cardinal veins, PCV, postcardinal vein. ZFA part_of: ZFA:0000096, ZFA:0005024, ZFA:0005295. Develops from: ZFA:0005077.

Stage range: Segmentation:26+ somites (ZFS:0000028, 22 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.20-0.57. Ventral to the dorsal aorta, dorsal to the gut and yolk extension. Laterality: midline. Landmarks: single in the mid and posterior trunk. Splits into a left and a right vessel in the anterior trunk, just caudal to the aortic radix. Each side joins a common cardinal vein.
AP fraction by stage: 24 h 0.22-0.62; 48 h 0.20-0.57; 120 h 0.20-0.55; adult 0.20-0.60.

Shape (tube): Tube under the dorsal aorta, wider than the aorta. Fork it into two branches in the anterior 20 percent of the trunk that curve laterally into the common cardinal veins.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 750, diameter 35 | estimate | no measurement found |
| Long-pec | 48 | length 1100, diameter 45 | estimate | no measurement found |
| Day 5 | 120 | length 1300, diameter 40 | estimate | no measurement found |
| Adult | 2160 | length 10000, diameter 200 | estimate | estimate (unverified) |

Events:

- 22 h: ZFIN start (26+ somites)
- 24 h: carries return flow from the trunk once circulation starts
- 25 h: venous sprouts leave the PCV ventrally to build the caudal vein plexus (25-30 hpf)
- 36 h: secondary sprouts from the PCV convert about half of the intersegmental vessels to veins (36-48 hpf)

Notes: Synonyms: axial vein, PCV. Sizes are estimates.

Sources: https://zfin.org/ZFA:0000477; https://zfin.org/ZFA:0001286; https://zfin.org/ZFA:0001057

#### anterior cardinal vein (ZFA:0000423)

ZFA definition: Vein that joins with the posterior cardinal vein to form the common cardinal vein. The anterior cardinal vein (ACV) connects to the primordial hindbrain channel at early stages.

Synonyms: ACV, rostral cardinal vein. ZFA part_of: ZFA:0000096. Develops from: not stated.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.10-0.24. Lateral to the hindbrain and otic vesicle, dorsal to the pharyngeal arches. Laterality: paired. Landmarks: runs caudally from the primordial hindbrain channel to the common cardinal vein; the pectoral vein drains into it later.

Shape (tube): Paired tubes lateral to the hindbrain. Diameter 25-30 um in the embryo (estimate).

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 250, diameter 25 | estimate | no measurement found |
| Long-pec | 48 | length 350, diameter 30 | estimate | no measurement found |
| Day 5 | 120 | length 400, diameter 30 | estimate | no measurement found |
| Adult | 2160 | length 3000, diameter 150 | estimate | estimate (unverified) |

Events:

- 24 h: ZFIN start (Prim-5); connects to the primordial hindbrain channel
- 60 h: rostral part connects to the primary head sinus at 2.5 dpf

Notes: Synonym: rostral cardinal vein. Sizes are estimates.

Sources: https://zfin.org/ZFA:0000423

#### common cardinal vein (ZFA:0000186)

ZFA definition: Bilaterally paired longitudinal vein; the anterior cardinal returns blood from the head, and the posterior cardinal returns it from the trunk; these two vessels join together on each side as the common cardinal vein (duct of Cuvier; misnamed the vitelline vein) that leads across the yolk cell to the heart's sinus venosus.

Synonyms: duct of Cuvier. ZFA part_of: ZFA:0000096, ZFA:0005024. Develops from: not stated.

Stage range: Segmentation:20-25 somites (ZFS:0000027, 19 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.20-0.30. On the lateral and ventral surface of the yolk ball, between the trunk and the sinus venosus. Laterality: paired. Landmarks: each vein starts where the anterior and posterior cardinal veins meet and crosses the yolk ventrally to the sinus venosus.
AP fraction by stage: 24 h 0.22-0.32; 48 h 0.20-0.30; 120 h 0.20-0.26; adult 0.20-0.24.

Shape (sheet): At 24-48 hpf draw each vein as a broad flat channel (sheet with thickness) wrapped over the yolk surface, 100-200 um wide. From 72 hpf shrink it to a tube of 40 um that enters the sinus venosus.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 300, width 120, thickness 25 | estimate | an open-ended lumen forms by 26 hpf (Helker et al. 2013, Development 140:2776-2786, https://journals.biologists.com/dev/article/140/13/2776/76627) |
| Long-pec | 48 | length 350, width 200, thickness 30 | estimate | lumen ensheathment proceeds after 32 hpf (Helker et al. 2013, Development 140:2776-2786, https://journals.biologists.com/dev/article/140/13/2776/76627) |
| Day 5 | 120 | length 250, diameter 40 | estimate | no measurement found |
| Adult | 2160 | length 1500, diameter 250 | estimate | estimate (unverified) |

Events:

- 17 h: venous angioblast population specified about 17 hpf
- 19 h: ZFIN start (20-25 somites)
- 20 h: endothelial cells migrate as a monolayer over the yolk syncytial layer from about 20 hpf
- 26 h: an open-ended lumenized cylinder forms by 26 hpf
- 32 h: the endothelial sheet closes around the lumen (lumen ensheathment)

Notes: Synonym: duct of Cuvier. Kimmel notes the older, incorrect name vitelline vein. The wide sheet stage over the yolk is a visible feature in 24-48 hpf embryos.

Sources: https://zfin.org/ZFA:0000186; Helker et al. 2013, Development 140:2776-2786, https://journals.biologists.com/dev/article/140/13/2776/76627

#### caudal artery (ZFA:0000011)

ZFA definition: Extension of the dorsal aorta in the post-vent region.

Synonyms: CA. ZFA part_of: ZFA:0005037, ZFA:0005295. Develops from: not stated.

Stage range: Segmentation:26+ somites (ZFS:0000028, 22 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.57-0.97. Ventral to the notochord in the tail, dorsal to the caudal vein plexus. Laterality: midline. Landmarks: continuation of the dorsal aorta behind the vent; turns ventrally at the tail tip into the caudal vein.
AP fraction by stage: 24 h 0.62-0.97; 48 h 0.57-0.97; 120 h 0.55-0.96; adult 0.60-0.97.

Shape (tube): Tube continuing the dorsal aorta into the tail, tapering to 15 um near the tip, with a U-turn into the caudal vein.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 600, diameter 20 | estimate | no measurement found |
| Long-pec | 48 | length 1200, diameter 22 | estimate | no measurement found |
| Day 5 | 120 | length 1500, diameter 20 | estimate | no measurement found |
| Adult | 2160 | length 9000, diameter 100 | estimate | estimate (unverified) |

Events:

- 22 h: ZFIN start (26+ somites)
- 24 h: named caudal artery where the dorsal aorta enters the tail (Kimmel)

Notes: Sizes are estimates.

Sources: https://zfin.org/ZFA:0000011; https://zfin.org/zf_info/zfbook/stages/phar.html

#### caudal vein (ZFA:0000180)

ZFA definition: Vein in the tail returning blood from the trunk and tail to the heart, leads directly into the posterior cardinal vein in the posterior trunk.

Synonyms: CV. ZFA part_of: ZFA:0005037, ZFA:0005295. Develops from: ZFA:0001286.

Stage range: Larval:Day 4 (ZFS:0000036, 96 h) to Adult (ZFS:0000044, 17520 h). Visible from 24 h: ZFIN starts the term at Day 4 (96 hpf), when the plexus has remodeled into one vessel. A single ventral return channel already carries flow from 24 hpf; before 96 hpf draw it as the dorsal-most channel of the caudal vein plexus.

Position: AP fraction 0.57-0.97. Ventral to the caudal artery, dorsal to the ventral fin fold. Laterality: midline. Landmarks: returns blood from the tail to the posterior cardinal vein. The caudal hematopoietic tissue lies between it and the caudal artery until about 7 dpf.

Shape (tube): Tube under the caudal artery. Before 96 hpf it is the main channel of the plexus; after 96 hpf a single vessel.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 600, diameter 30 | estimate | estimate (plexus main channel) |
| Long-pec | 48 | length 1200, diameter 35 | estimate | no measurement found |
| Day 5 | 120 | length 1500, diameter 35 | estimate | no measurement found |
| Adult | 2160 | length 9000, diameter 150 | estimate | estimate (unverified) |

Events:

- 96 h: ZFIN start (Day 4): the caudal vein plexus starts to remodel and simplify

Notes: ZFA says the caudal vein develops from the caudal vein plexus.

Sources: https://zfin.org/ZFA:0000180; https://zfin.org/ZFA:0001286

#### caudal vein plexus (ZFA:0001286)

ZFA definition: Post-vent vasculature which forms an interconnecting network of venous tubes.

Synonyms: none. ZFA part_of: none. Develops from: not stated.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Larval:Days 7-13 (ZFS:0000039, 336 h).

Position: AP fraction 0.60-0.95. Ventral tail between the caudal artery and the ventral fin fold. Laterality: midline. Landmarks: honeycomb of venous channels; the caudal hematopoietic tissue sits inside it from 48 hpf.

Shape (custom): Flat ladder or honeycomb of thin tubes (8-15 um), 60-100 um tall. It runs under the caudal artery from the vent to near the tail tip. Fade it to a single tube between 96 hpf and 14 dpf.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 500, height 50, channel_diameter 12 | estimate | no measurement found |
| Long-pec | 48 | length 1100, height 90, channel_diameter 12 | estimate | no measurement found |
| Day 5 | 120 | length 1300, height 70, channel_diameter 12 | estimate | no measurement found |

Events:

- 25 h: venous endothelial cells sprout ventrally from the PCV and fuse with neighbors (25-30 hpf)
- 30 h: primordial plexus formed by 30 hpf
- 48 h: mature, perfused venous network by 2 dpf
- 96 h: remodeling and simplification start at 4 dpf
- 336 h: ZFIN end (Days 7-13)

Notes: All timing comes from the ZFA definition. Sizes are estimates.

Sources: https://zfin.org/ZFA:0001286

#### intersegmental vessel (ZFA:0001285)

ZFA definition: Blood vessels that connect the dorsal aorta or the posterior cardinal vein and the dorsal longitudinal anastomotic vessel. They run along the vertical myotomal boundaries.

Synonyms: intersegmental vessels, intersomitic vessels, segmental vessel. ZFA part_of: ZFA:0005024, ZFA:0005037. Develops from: ZFA:0000014.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Unknown (ZFS:0000000, 17520 h). Visible from 22 h: ZFIN start is Prim-5 (24 hpf). Primary sprouts leave the dorsal aorta from about 22 hpf (Isogai et al. 2003 as summarized by ScienceDirect Topics; unverified).

Position: AP fraction 0.24-0.95. From the dorsal aorta or posterior cardinal vein up along each somite boundary to the dorsal longitudinal anastomotic vessel. Laterality: paired. Landmarks: one vessel per somite boundary on each side; about 30 pairs from the first somite to the tail.

Shape (segmentArray): Array of thin vertical tubes (8-10 um), one per somite boundary on each side, each following a shallow chevron. Height equals the myotome height: about 100 um at 24 hpf, 150-200 um at 5 dpf. Spacing equals somite length: about 45 um at 24 hpf, 70-80 um at 5 dpf (estimates).

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | count_per_side 28, height 100, diameter 8, spacing 45 | estimate | spacing from a 1.3 mm trunk-tail span over about 28 somites |
| Long-pec | 48 | count_per_side 30, height 140, diameter 9, spacing 60 | estimate | no measurement found |
| Day 5 | 120 | count_per_side 30, height 180, diameter 10, spacing 75 | estimate | no measurement found |
| Adult | 2160 | count_per_side 30, height 3000, diameter 40, spacing 600 | estimate | estimate (unverified); segmental arteries and veins persist in the adult |

Events:

- 22 h: primary angiogenic sprouts leave the dorsal aorta (about 22 hpf)
- 24 h: ZFIN start (Prim-5)
- 30 h: sprouts reach the dorsal neural tube and anastomose into the DLAV (30-36 hpf)
- 36 h: primary intersegmental network complete by about 36 hpf
- 48 h: secondary sprouts from the PCV give about half of the vessels venous identity (ZFIN start of intersegmental artery and vein terms, Long-pec)

Notes: Synonyms: intersomitic vessels, segmental vessel. ZFIN end is Unknown; the JSON endHpf follows the Unknown stage. Diameters and spacing are estimates.

Sources: https://zfin.org/ZFA:0001285; https://zfin.org/ZFA:0001061; https://zfin.org/ZFA:0001057; Intersegmental vessel overview (ScienceDirect Topics), https://www.sciencedirect.com/topics/medicine-and-dentistry/intersegmental-vessel; ImageJ-based analysis of the developing zebrafish vasculature, Vascular Cell 9:2 (2017), https://vascularcell.com/public/journals/1/articles/13221-09-01-172/13221-09-02_html.html

#### dorsal longitudinal anastomotic vessel (ZFA:0005025)

ZFA definition: Paired trunk vessels that run medially along the dorsal-most portion of the trunk and post-vent region. The DLAVs are formed by the longitudinal anastomoses of the intersegmental vessels to form a right and left pair of dorsal longitudinal anastomotic vessels.

Synonyms: DLAV. ZFA part_of: ZFA:0001073, ZFA:0005024, ZFA:0005037. Develops from: ZFA:0001285.

Stage range: Pharyngula:Prim-25 (ZFS:0000031, 36 h) to Unknown (ZFS:0000000, 17520 h).

Position: AP fraction 0.24-0.95. Dorsal-most trunk, on top of the neural tube under the skin. Laterality: paired. Landmarks: two parallel vessels that become one plexiform vessel after 3 dpf; the basilar artery joins them at the caudal medulla.

Shape (tube): Two thin tubes (10 um) along the dorsal midline. They join the tops of the intersegmental vessels. Merge them into one tube from 72 hpf to 7 dpf.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-25 | 36 | length 1000, diameter 10 | estimate | no measurement found |
| Long-pec | 48 | length 1400, diameter 10 | estimate | no measurement found |
| Day 5 | 120 | length 2000, diameter 12 | estimate | no measurement found |
| Adult | 2160 | length 15000, diameter 30 | estimate | estimate (unverified); the adult dorsal anastomotic vessel is not a named ZFA structure |

Events:

- 30 h: longitudinal anastomoses of intersegmental sprouts begin
- 36 h: ZFIN start (Prim-25)
- 72 h: paired vessels remodel into a single plexiform vessel from 3 dpf until after 7 dpf

Notes: ZFIN end is Unknown. I give no adult size; the vessel is not a named adult structure.

Sources: https://zfin.org/ZFA:0005025; ImageJ-based analysis of the developing zebrafish vasculature, Vascular Cell 9:2 (2017), https://vascularcell.com/public/journals/1/articles/13221-09-01-172/13221-09-02_html.html

#### aortic arch (ZFA:0005004)

ZFA definition: Artery that is part of the pharyngeal arches.

Synonyms: aortic arches, branchial aortic arches. ZFA part_of: ZFA:0005003. Develops from: not stated.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.12-0.24. Inside the pharyngeal arches, ventral to the hindbrain, from the ventral aorta to the lateral dorsal aorta. Laterality: paired. Landmarks: arch 1 lies in the mandibular arch under the eye; arches 3-6 run through the gill arches; arches 5 and 6 share a trunk.

Shape (segmentArray): Six paired arcs (tubes, 12-20 um) rising from the ventral aorta and curving dorsally to the lateral dorsal aorta. Add arch 1 at 24 hpf, arches 3-4 by 48 hpf, arches 5-6 by 50-60 hpf; fade arches 1-2 after 72 hpf. In the adult keep four afferent and efferent branchial arteries per side.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | count_per_side 1, arc_height 80, diameter 15 | estimate | no measurement found |
| Long-pec | 48 | count_per_side 6, arc_height 110, diameter 15, spacing 45 | estimate | six pairs present early in the hatching period (https://zfin.org/zf_info/zfbook/stages/hatch.html) |
| Day 5 | 120 | count_per_side 4, arc_height 150, diameter 18, spacing 60 | estimate | no measurement found |
| Adult | 2160 | count_per_side 4, arc_height 2500, diameter 150, spacing 600 | estimate | estimate (unverified) |

Events:

- 24 h: aortic arch 1 appears at the start of the pharyngula period and carries the first circulation
- 48 h: aortic arches 3 and 4 form (ZFIN start Long-pec); the whole series of six pairs carries blood early in the hatching period
- 50 h: arches 5 and 6 are lumenized by 50 hpf (unverified, search summary of Anderson et al. 2008)
- 60 h: ZFIN start of aortic arches 5 and 6 (Pec-fin)
- 72 h: aortic arch 2 is vestigial and ends at Pec-fin
- 2160 h: arches 3-6 persist as the afferent and efferent branchial arteries of the four gill arches

Notes: Individual arch terms: ZFA:0005005 to ZFA:0005009 and ZFA:0005016. Their ZFIN start stages are Prim-5 (arches 1-2), Long-pec (arches 3-4) and Pec-fin (arches 5-6).

Sources: https://zfin.org/ZFA:0005004; https://zfin.org/ZFA:0005005; https://zfin.org/ZFA:0005006; https://zfin.org/ZFA:0005007; https://zfin.org/ZFA:0005009; https://zfin.org/zf_info/zfbook/stages/phar.html; https://zfin.org/zf_info/zfbook/stages/hatch.html; Anderson et al. 2008, Dev Biol 318:258-267, https://pubmed.ncbi.nlm.nih.gov/18462713/; Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/

#### ventral aorta (ZFA:0000604)

ZFA definition: Outflow artery from the heart to the aortic arches.

Synonyms: none. ZFA part_of: none. Develops from: not stated.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 24 h: ZFIN start is Unknown. The vessel carries flow from the bulbus to aortic arch 1 once circulation starts at 24-26 hpf.

Position: AP fraction 0.12-0.19. Ventral midline of the pharynx, between the bulbus arteriosus and the aortic arches. Laterality: midline. Landmarks: short trunk anterior to the bulbus arteriosus under the pharyngeal floor.

Shape (tube): Short midline tube from the bulbus neck forward, giving off the paired aortic arches.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 80, diameter 20 | estimate | no measurement found |
| Long-pec | 48 | length 150, diameter 22 | estimate | no measurement found |
| Day 5 | 120 | length 200, diameter 25 | estimate | no measurement found |
| Adult | 2160 | length 1500, diameter 200 | estimate | estimate (unverified) |

Events:

- 24 h: carries the first outflow into aortic arch 1

Notes: ZFA gives no part_of parent. I assign the pharyngeal vasculature (ZFA:0005003) for the UI.

Sources: https://zfin.org/ZFA:0000604; https://zfin.org/zf_info/zfbook/stages/phar.html

#### subintestinal venous plexus (ZFA:0005934)

ZFA definition: Non stereotyped venous plexus derived from specialised angioblast that originate in the floor of the posterior cardinal vein.

Synonyms: subintestinal plexus. ZFA part_of: none. Develops from: not stated.

Stage range: Pharyngula:High-pec (ZFS:0000032, 42 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.25-0.45. On the ventral-lateral surface of the yolk ball and over the gut, ventral to the posterior cardinal vein. Laterality: paired. Landmarks: reticular basket that spreads from the duct of Cuvier over the yolk; the right side dominates after 4 dpf.

Shape (sheet): Basket-shaped net of thin tubes (10-15 um) draped over the ventral yolk, 300 um long and 150 um tall at 48-72 hpf. After 96 hpf reduce to one right-sided vein (the subintestinal vein, ZFA:0005035).

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 300, height 120, channel_diameter 12 | estimate | no measurement found |
| Day 5 | 120 | length 400, height 100, channel_diameter 15 | estimate | no measurement found |
| Adult | 2160 | length 5000, diameter 150 | estimate | estimate (unverified); persists as the hepatic portal drainage |

Events:

- 42 h: ZFIN start (High-pec)
- 48 h: emerges from the duct of Cuvier at 2 dpf as a reticular structure over the yolk and gut
- 60 h: ZFIN start of the subintestinal vein term (Pec-fin)
- 72 h: rostral left vein forms the hepatic sinusoids
- 96 h: left vein breaks into segments that empty into the right vein

Notes: I model the plexus term because its ZFIN start (42 hpf) precedes the subintestinal vein term (60 hpf). Synonym of the vein: vitelline vein.

Sources: https://zfin.org/ZFA:0005934; https://zfin.org/ZFA:0005035

#### cranial vasculature (ZFA:0001267)

ZFA definition: Is an interconnected tubular multi-tissue structure that contains fluid that is actively transported around the head.

Synonyms: head vasculature. ZFA part_of: ZFA:0001114. Develops from: not stated.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.02-0.25. Whole head: vessels around the brain, eyes and pharynx. Laterality: midline. Landmarks: envelope for the head vessels; use it as the group node for the primordial hindbrain channel, basilar artery and primitive internal carotid artery.

Shape (custom): Group node. Draw only the three main vessels listed here plus the aortic arches; the rest of the head network is too fine for a whole-body model.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 450, height 300 | estimate | estimate of the head envelope |
| Long-pec | 48 | length 700, height 450 | estimate | no measurement found |
| Day 5 | 120 | length 900, height 500 | estimate | no measurement found |
| Adult | 2160 | length 6000, height 4000 | estimate | no measurement found |

Events:

- 24 h: ZFIN start (Prim-5): primordial hindbrain channel, basilar artery and primitive internal carotid artery present
- 48 h: primary head sinus forms (ZFIN start Long-pec)

Notes: ZFA part_of parent is the head (ZFA:0001114).

Sources: https://zfin.org/ZFA:0001267; https://zfin.org/ZFA:0005026

#### primordial hindbrain channel (ZFA:0001052)

ZFA definition: The paired vessels that run along the lateral walls of the hindbrain and drain into the anterior cardinal veins.

Synonyms: medial head vein, PHBC. ZFA part_of: ZFA:0005297. Develops from: not stated.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Unknown (ZFS:0000000, 17520 h).

Position: AP fraction 0.12-0.24. Lateral to the hindbrain, ventral to the otic vesicle. Laterality: paired. Landmarks: drains into the anterior cardinal vein; lies lateral to the basilar artery.

Shape (tube): Paired tubes (25-30 um) along the lateral hindbrain wall from the midbrain-hindbrain boundary to the anterior cardinal vein.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 300, diameter 30 | estimate | no measurement found |
| Long-pec | 48 | length 400, diameter 30 | estimate | no measurement found |
| Day 5 | 120 | length 450, diameter 30 | estimate | no measurement found |
| Adult | 2160 | length 3000, diameter 120 | estimate | estimate (unverified); the channel persists as part of the adult head venous drainage |

Events:

- 24 h: ZFIN start (Prim-5)
- 60 h: connects to the DLAV in the 2.5-3.5 dpf embryo

Notes: Synonym: medial head vein. ZFIN end is Unknown; ZFA parent is cranial blood vessel (ZFA:0005297), which is part of the cranial vasculature.

Sources: https://zfin.org/ZFA:0001052; https://zfin.org/ZFA:0005025

#### basilar artery (ZFA:0005002)

ZFA definition: Artery that runs along the ventral keel of the hindbrain. It lies between the primordial hindbrain channels(PHBC).

Synonyms: BA. ZFA part_of: ZFA:0005297. Develops from: not stated.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.13-0.24. Ventral midline keel of the hindbrain. Laterality: midline. Landmarks: between the two primordial hindbrain channels; joins the DLAV at the caudal medulla.

Shape (tube): Single midline tube (15 um) under the hindbrain.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 250, diameter 12 | estimate | no measurement found |
| Long-pec | 48 | length 350, diameter 15 | estimate | no measurement found |
| Day 5 | 120 | length 400, diameter 15 | estimate | no measurement found |
| Adult | 2160 | length 3000, diameter 80 | estimate | estimate (unverified) |

Events:

- 24 h: ZFIN start (Prim-5)
- 36 h: central arteries connect it to the primordial hindbrain channels through the hindbrain (ZFA:0005020 start Long-pec)

Notes: ZFA parent is cranial blood vessel (ZFA:0005297).

Sources: https://zfin.org/ZFA:0005002; https://zfin.org/ZFA:0005020

#### primitive internal carotid artery (ZFA:0001053)

ZFA definition: Artery that originates as rostral extensions of the paired lateral dorsal aorta. The primitive internal carotid artery splits to form caudal and cranial divisions.

Synonyms: PICA. ZFA part_of: none. Develops from: not stated.

Stage range: Pharyngula:Prim-5 (ZFS:0000029, 24 h) to Unknown (ZFS:0000000, 17520 h).

Position: AP fraction 0.05-0.15. Ventral to the midbrain and forebrain, medial to the eye. Laterality: paired. Landmarks: rostral extension of the lateral dorsal aorta; splits into cranial and caudal divisions near the hypothalamus.

Shape (tube): Paired tubes (15-20 um) running forward from the aortic radix under the brain toward the eyes, forking near the optic stalk.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 250, diameter 15 | estimate | no measurement found |
| Long-pec | 48 | length 350, diameter 18 | estimate | no measurement found |
| Day 5 | 120 | length 400, diameter 20 | estimate | no measurement found |
| Adult | 2160 | length 3000, diameter 100 | estimate | estimate (unverified); adult term is internal carotid artery ZFA:0005081 |

Events:

- 24 h: ZFIN start (Prim-5)
- 36 h: the cranial division ends at Prim-25 in ZFIN; the internal carotid artery (ZFA:0005081) develops from this vessel

Notes: ZFIN end is Unknown. For the adult use the internal carotid artery term.

Sources: https://zfin.org/ZFA:0001053; https://zfin.org/ZFA:0005081

### Hematopoietic and immune system

#### intermediate cell mass of mesoderm (ZFA:0000033)

ZFA definition: (no ZFA definition)

Synonyms: ICM, intermediate cell mass of Oellacher, posterior intermediate cell mass. ZFA part_of: ZFA:0005023. Develops from: ZFA:0000121, ZFA:0001201.

Stage range: Segmentation:14-19 somites (ZFS:0000026, 16 h) to Hatching:Long-pec (ZFS:0000033, 60 h).

Position: AP fraction 0.30-0.62. Ventral to the notochord and somites, dorsal to the yolk extension; occupies the future dorsal aorta and posterior cardinal vein position. Laterality: midline. Landmarks: a longitudinal strip in the trunk from about somite 5 to the end of the yolk extension.

Shape (tube): Flattened strip (ellipsoidal tube) on the trunk midline under the notochord, 30-40 um tall. Fade it out as the axial vessels and circulating blood take over (24-60 hpf).

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| 14-19 somites | 17 | length 500, height 30, width 40 | estimate | no measurement found |
| Prim-5 | 24 | length 600, height 35, width 40 | estimate | no measurement found |
| Long-pec | 48 | length 300, height 20, width 30 | estimate | residual |

Events:

- 11.5 h: ICM ultrastructure described from the 5-somite stage (about 11.5 hpf)
- 16 h: ZFIN start (14-19 somites)
- 24 h: primitive erythroid cells enter circulation; they account for all circulating erythrocytes for the first 4 days
- 60 h: ZFIN end (Long-pec)

Notes: Synonyms: ICM, intermediate cell mass of Oellacher. Willett et al. 1999 place the first ICM at about 11.5 hpf; ZFIN starts the term at 16 hpf.

Sources: https://zfin.org/ZFA:0000033; Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/

#### blood island (ZFA:0000094)

ZFA definition: Nests of developing blood cells arising late in the segmentation period from the intermediate mass, and located in the anterior-ventral tail, just posterior to the yolk extension.

Synonyms: blood islands, caudal hematopoietic tissue, posterior blood island, posterior ICM. ZFA part_of: ZFA:0000033. Develops from: not stated.

Stage range: Segmentation:26+ somites (ZFS:0000028, 22 h) to Pharyngula:Prim-5 (ZFS:0000029, 30 h).

Position: AP fraction 0.60-0.70. Ventral tail, just posterior to the yolk extension, ventral to the notochord. Laterality: midline. Landmarks: anterior-ventral tail behind the yolk extension.

Shape (ellipsoid): Small elongated ellipsoid of packed cells in the ventral tail base.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| 26+ somites | 23 | length 150, height 40, width 40 | estimate | no measurement found |
| Prim-5 | 24 | length 180, height 45, width 45 | estimate | no measurement found |

Events:

- 22 h: ZFIN start (26+ somites)
- 30 h: ZFIN end (Prim-5); the region continues as the caudal vein plexus and later the caudal hematopoietic tissue

Notes: ZFA lists posterior blood island and caudal hematopoietic tissue as synonyms of this early term. ZFIN keeps a separate later term (ZFA:0005898) for 48 hpf onward.

Sources: https://zfin.org/ZFA:0000094

#### caudal hematopoietic tissue (ZFA:0005898)

ZFA definition: Tissue that lies between the caudal artery and the caudal vein plexus where definitive hematopoiesis occurs after  48hpf and before the hematopoietic progenitors migrate to the thymus and kidney.

Synonyms: posterior blood island. ZFA part_of: ZFA:0005023. Develops from: not stated.

Stage range: Hatching:Long-pec (ZFS:0000033, 48 h) to Larval:Days 7-13 (ZFS:0000039, 336 h).

Position: AP fraction 0.60-0.92. Ventral tail, between the caudal artery and the caudal vein plexus. Laterality: midline. Landmarks: occupies the plexus region from behind the vent to near the tail tip.

Shape (tube): Flattened strip (50-60 um tall) between the caudal artery and the caudal vein, spanning most of the tail. Fill it with a stippled texture to suggest cells.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 800, height 50, width 40 | estimate | no measurement found |
| Day 5 | 120 | length 1000, height 60, width 40 | estimate | no measurement found |

Events:

- 48 h: ZFIN start (Long-pec); HSPCs from the aortic floor lodge here from 48 to 96 hpf
- 72 h: expansion and differentiation of HSPCs (fetal liver equivalent)
- 96 h: progenitors seed the kidney from 4 dpf
- 336 h: ZFIN end (Days 7-13)

Notes: Synonym: posterior blood island. Sizes are estimates.

Sources: https://zfin.org/ZFA:0005898; Murayama et al. 2006, Immunity 25:963-975, https://pubmed.ncbi.nlm.nih.gov/17157041/

#### thymus primordium (ZFA:0001077)

ZFA definition: A small outgrowth of the pharyngeal epithelium that is the site of lymphocyte cell production.

Synonyms: thymic rudiment. ZFA part_of: ZFA:0001159. Develops from: ZFA:0000818, ZFA:0001104.

Stage range: Pharyngula:Prim-15 (ZFS:0000030, 30 h) to Larval:Protruding-mouth (ZFS:0000035, 96 h). Visible from 54 h: ZFIN starts the term at Prim-15 (30 hpf). The first morphological primordium appears in the third pharyngeal pouch at 54 hpf (Lam et al. 2004) or 60 hpf (Willett et al. 1999).

Position: AP fraction 0.17-0.21. Dorsal to the third pharyngeal pouch, posterior-ventral to the otic vesicle, lateral. Laterality: paired. Landmarks: a small epithelial bud above pharyngeal arch 3, behind the eye and below the ear.

Shape (sphere): Small sphere (30-40 um) on each side above the third pouch.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Pec-fin | 60 | diameter 30 | estimate | no measurement found |
| Protruding-mouth | 72 | diameter 40 | estimate | no measurement found |

Events:

- 54 h: alymphoid primordium forms in the third pharyngeal pouch
- 60 h: thymic primordium appears (Willett et al. 1999)
- 65 h: immature lymphoblasts colonize the primordium
- 96 h: ZFIN end (Protruding-mouth); rag1 expression starts about 92 hpf

Notes: Synonym: thymic rudiment. Sizes are estimates.

Sources: https://zfin.org/ZFA:0001077; Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/; Lam et al. 2004, Dev Comp Immunol 28:9-28, https://www.sciencedirect.com/science/article/abs/pii/S0145305X03001034

#### thymus (ZFA:0001078)

ZFA definition: Paired organ where maturation of T-lymphocytes occurs. The adult thymus located on the dorsomedial aspect of the branchial cavity above the third pharyngeal cartilage.

Synonyms: none. ZFA part_of: ZFA:0001159. Develops from: ZFA:0001077.

Stage range: Larval:Protruding-mouth (ZFS:0000035, 72 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.16-0.22. Dorsomedial roof of the branchial (gill) cavity, above the third pharyngeal cartilage, under the skin behind the eye. Laterality: paired. Landmarks: just posterior-dorsal to the eye and ventral to the ear in the larva; in the adult under the dorsal edge of the operculum.
AP fraction by stage: 120 h 0.16-0.21; adult 0.15-0.20.

Shape (ellipsoid): Ellipsoid: pouch-like at 1 wpf, conical at 2-3 wpf, with a dorsal protrusion along the skull from 4 wpf. Shrink it after 15 wpf.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 5 | 120 | length 70, height 50, width 40 | estimate | no measurement found |
| Days 14-20 | 336 | length 250, height 150, width 100 | estimate | no measurement found |
| Adult | 2160 | length 800, height 500, width 300 | estimate | no measurement found |

Events:

- 72 h: ZFIN start (Protruding-mouth)
- 96 h: TCR alpha and rag1 expression detected in the thymus at 4 dpf
- 168 h: small pouch-like shape at 1 wpf; rapid lateral growth between 1 and 2 wpf
- 336 h: conical shape between 2 and 3 wpf; cortex-medulla regionalization
- 504 h: morphologically mature by 3 wpf
- 672 h: more complex shape from 4 wpf; rapid dorsal-ventral growth between 3 and 6 wpf
- 2520 h: early involution at 15 wpf

Notes: Sizes are estimates; the papers give shape and timing but no micrometer values.

Sources: https://zfin.org/ZFA:0001078; Lam et al. 2002, Dev Dyn 225:87-94, https://pubmed.ncbi.nlm.nih.gov/12203724/; Danilova et al. 2004, Dev Comp Immunol 28:755-767, https://pubmed.ncbi.nlm.nih.gov/15043944/; Menke et al. 2011, Toxicol Pathol 39:759-775, https://journals.sagepub.com/doi/10.1177/0192623311409597

#### spleen (ZFA:0000436)

ZFA definition: Organ that filters the blood removing defective blood cells. The spleen is a dark red organ, located in the peritoneal cavity, adjacent to one of the liver lobes.

Synonyms: none. ZFA part_of: ZFA:0001159, ZFA:0005023, ZFA:0007116. Develops from: not stated.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 96 h: ZFIN start is Unknown. The splenic primordium appears by 4 dpf in a small hox11-positive area of the left anterior gut (fish spleen review 2023).

Position: AP fraction 0.42-0.52. Peritoneal cavity, dorsal to the intestine, adjacent to a liver lobe, ventral to the swim bladder. Laterality: left. Landmarks: dark red elongated organ between the anterior intestinal loop and the swim bladder in the adult.
AP fraction by stage: 120 h 0.33-0.36; adult 0.42-0.52.

Shape (ellipsoid): Dark red elongated ellipsoid next to the gut. Tiny sphere at 5 dpf; elongated ellipsoid 2 mm long in the adult (estimate).

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 5 | 120 | diameter 40 | estimate | no measurement found |
| Days 21-29 | 720 | length 300, width 120 | estimate | no measurement found |
| Adult | 2160 | length 2000, height 700, width 600 | estimate | estimate (unverified) |

Events:

- 96 h: splenic primordium by 4 dpf in the left anterior gut
- 720 h: lymphocytes evident in the spleen at 30 dpf; ellipsoids still forming

Notes: ZFA lists three part_of parents: immune system, hematopoietic system and pleuroperitoneal region. Sizes are estimates.

Sources: https://zfin.org/ZFA:0000436; The fish spleen (review, 2023), Fish Shellfish Immunol, https://www.sciencedirect.com/science/article/pii/S1050464823007660; Menke et al. 2011, Toxicol Pathol 39:759-775, https://journals.sagepub.com/doi/10.1177/0192623311409597; Gupta and Mullins 2010, J Vis Exp 37:1717, https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/

#### head kidney (ZFA:0000669)

ZFA definition: The zebrafish head kidney consists of fused bilateral lobes located in the anterior part of the kidney. It is analogous to the mammalian bone marrow and the primary site of definitive hematopoiesis.

Synonyms: anterior kidney, kidney marrow. ZFA part_of: ZFA:0000529, ZFA:0001158, ZFA:0005023. Develops from: not stated.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 96 h: ZFIN start is Unknown. Hematopoietic cells are present in the pronephros at 96 hpf (Willett et al. 1999) and kidney hematopoiesis starts at 4 dpf (Murayama et al. 2006). The adult head kidney is the kidney marrow.

Position: AP fraction 0.20-0.30. Retroperitoneal, ventral to the vertebral column and dorsal aorta, dorsal to the swim bladder, behind the gills. Laterality: midline. Landmarks: fused bilateral lobes at the anterior end of the kidney, just behind the pharynx.
AP fraction by stage: 120 h 0.22-0.26; adult 0.20-0.30.

Shape (ellipsoid): Flat lobed ellipsoid pressed against the dorsal body wall under the spine. In the larva a pair of small blobs at the pronephric glomeruli (somite 3 level).

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 5 | 120 | length 80, height 40, width 60 | estimate | no measurement found |
| Adult | 2160 | length 2500, height 800, width 1500 | estimate | estimate (unverified) |

Events:

- 96 h: hematopoietic cells in the pronephros at 96 hpf; kidney seeded by HSPCs from 4 dpf
- 504 h: lymphocytes detected in the kidney at 3 weeks
- 2160 h: adult kidney marrow: main site of definitive hematopoiesis

Notes: Synonyms: anterior kidney, kidney marrow. The excretory specialist owns the kidney (ZFA:0000529); I include the head kidney as the adult hematopoietic organ.

Sources: https://zfin.org/ZFA:0000669; Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/; Murayama et al. 2006, Immunity 25:963-975, https://pubmed.ncbi.nlm.nih.gov/17157041/; Gupta and Mullins 2010, J Vis Exp 37:1717, https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/; Ivanovski et al. 2009, PMID 20087250 (adult average size 2.5 cm), https://pubmed.ncbi.nlm.nih.gov/20087250/

### Respiratory system, pharyngeal arches and swim bladder

#### pharyngeal arch (ZFA:0001306)

ZFA definition: One of a series of paired bony or cartilaginous arches that develop along the lateral walls of the foregut.

Synonyms: pharyngeal arches. ZFA part_of: ZFA:0001114. Develops from: not stated.

Stage range: Segmentation:10-13 somites (ZFS:0000025, 14 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.12-0.24. Ventrolateral to the hindbrain, posterior to the eye, lateral walls of the foregut. Laterality: paired. Landmarks: seven paired arches; a visible boundary separates arches 2 and 3; arches 1-2 form jaws and operculum, arches 3-7 form the gill region.
AP fraction by stage: 24 h 0.14-0.24; 48 h 0.12-0.24; 120 h 0.12-0.23; adult 0.08-0.22.

Shape (segmentArray): Seven paired vertical bars (rounded boxes) hanging from the head, each 40 um wide at 48 hpf and separated by pouches. Arches 1-2 are larger and more anterior. From 72 hpf let the opercular flap cover arches 3-7.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | count_per_side 7, region_length 200, arch_width 25, arch_height 80 | estimate | the primordium is present but individual arches are hard to see |
| Long-pec | 48 | count_per_side 7, region_length 300, arch_width 40, arch_height 120 | estimate | no measurement found |
| Day 5 | 120 | count_per_side 7, region_length 400, arch_width 50, arch_height 180 | estimate | no measurement found |
| Adult | 2160 | count_per_side 7, region_length 4000, arch_width 400, arch_height 2500 | estimate | no measurement found |

Events:

- 14 h: ZFIN start (10-13 somites): arch primordium ventrolateral to the brain
- 24 h: seven arches form from the primordium during the pharyngula period
- 48 h: gill slits form behind the hyoid arch and between the branchial arches, five in all

Notes: The skeletal specialist owns the arch cartilages and bones. This entry is the soft-tissue arch unit.

Sources: https://zfin.org/ZFA:0001306; https://zfin.org/zf_info/zfbook/stages/phar.html; https://zfin.org/zf_info/zfbook/stages/hatch.html

#### pharyngeal arch 3-7 (ZFA:0001613)

ZFA definition: (no ZFA definition)

Synonyms: branchial arch, branchial arches, branchial bar, branchial bars, gill arch, gill arches 1-5, visceral arches 3-7. ZFA part_of: ZFA:0000056, ZFA:0000354. Develops from: not stated.

Stage range: Segmentation:10-13 somites (ZFS:0000025, 14 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.16-0.24. Posterior five arches, under the otic vesicle and behind the hyoid arch. Laterality: paired. Landmarks: branchial arches 1-4 (pharyngeal arches 3-6) bear gill filaments; arch 7 carries the pharyngeal teeth.

Shape (segmentArray): Five paired bars. Bars 1-4 carry filament buds from 72-84 hpf; bar 5 stays smooth.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-5 | 24 | count_per_side 5, region_length 120, arch_width 20, arch_height 60 | estimate | no measurement found |
| Long-pec | 48 | count_per_side 5, region_length 180, arch_width 30, arch_height 100 | estimate | four filament-free branchial arches at 2.5 dpf (Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/) |
| Day 5 | 120 | count_per_side 5, region_length 250, arch_width 40, arch_height 150 | estimate | no measurement found |
| Adult | 2160 | count_per_side 5, region_length 2500, arch_width 300, arch_height 2500 | estimate | no measurement found |

Events:

- 14 h: ZFIN start (10-13 somites)
- 60 h: four filament-free branchial arches with branchial arteries at 2.5 dpf
- 84 h: first gill filaments visible at 3.5 dpf

Notes: Synonyms: branchial arches, gill arches 1-5. ZFA lists part_of pharynx and gill; I use gill for the UI.

Sources: https://zfin.org/ZFA:0001613; https://zfin.org/zf_info/zfbook/stages/hatch.html; Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/

#### gill (ZFA:0000354)

ZFA definition: Compound organ that consists of gill filaments, gill lamellae, gill rakers and pharyngeal arches 3-7. The gills are responsible for primary gas exchange between the blood and the surrounding water.

Synonyms: gills. ZFA part_of: ZFA:0000272. Develops from: ZFA:0001107.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 72 h: ZFIN start is Unknown. Gill filament rudiments bud late in the hatching period (Kimmel et al. 1995) and the first filaments are visible at 3.5 dpf (gill atlas 2025).

Position: AP fraction 0.14-0.23. In the branchial cavity under the opercular flap, ventral to the ear, posterior to the eye. Laterality: paired. Landmarks: four gill arches per side, each with a row of filaments pointing posteriorly.
AP fraction by stage: 120 h 0.15-0.23; adult 0.10-0.22.

Shape (custom): Four arcs per side (from pharyngeal arch 3-7) with rows of short tapered filaments. Filament count per arch: a few at 5 dpf, about 25 by 6 months.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 5 | 120 | arches_per_side 4, arch_length 150, filament_length 40, filaments_per_arch 4 | estimate | filament count is a guess from the 3.5 and 5.5 dpf images of Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/ |
| Days 14-20 | 336 | arches_per_side 4, arch_length 500, filament_length 150, filaments_per_arch 10 | estimate | no measurement found |
| Adult | 2160 | arches_per_side 4, arch_length 3000, filament_length 1000, filaments_per_arch 25 | estimate | filament count from Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/; lengths are estimates |

Events:

- 60 h: four filament-free branchial arches at 2.5 dpf
- 72 h: gill filament rudiments bud along the posterior walls of the four branchial arches late in the hatching period
- 84 h: first filaments visible at 3.5 dpf, medial before lateral
- 96 h: first lamellar tip cells at 4 dpf
- 168 h: lamellae form at about 7 dpf (unverified, search summary of Jonz and Nurse 2005)
- 348 h: medial and lateral filament numbers equalize at 14.5 dpf; gills fully functional by 14 dpf (unverified)
- 4320 h: filament number per arch stabilizes at about 25 by 6 months

Notes: The gill atlas (Development 2025) gives filament emergence and the adult count of about 25 filaments per arch; it gives no filament lengths.

Sources: https://zfin.org/ZFA:0000354; https://zfin.org/zf_info/zfbook/stages/hatch.html; Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/; Jonz and Nurse 2005, J Exp Biol 208:1537-1549, https://www.researchgate.net/publication/7932803_Development_of_oxygen_sensing_in_the_gills_of_zebrafish

#### gill filament (ZFA:0000667)

ZFA definition: Portion of tissue that projects outward from the gill and is a thread-like, soft, red respiratory and excretory structure.

Synonyms: gill filaments. ZFA part_of: ZFA:0000354. Develops from: not stated.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 84 h: ZFIN start is Unknown. First filaments visible at 3.5 dpf (gill atlas 2025).

Position: AP fraction 0.15-0.23. Projecting from the posterior face of each branchial arch into the opercular cavity. Laterality: paired. Landmarks: two rows (medial and lateral hemibranch) per arch.

Shape (tube): Tapered tube (cone) per filament; two rows per arch. Adult filaments about 1 mm long and 60 um wide (estimate) with lamellae as thin plates on both faces.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 5 | 120 | length 40, diameter 20 | estimate | no measurement found |
| Days 14-20 | 336 | length 150, diameter 35 | estimate | no measurement found |
| Adult | 2160 | length 1000, diameter 60, count_per_arch 25 | estimate | count from Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/; size is an estimate |

Events:

- 84 h: first medial filaments emerge and form vascular loops
- 132 h: lateral filaments lag behind medial at 5.5 dpf
- 252 h: medial-lateral difference less pronounced at 10.5 dpf

Notes: The gill lamella term (ZFA:0000211) is too small for the model; the filaments carry a lamellar texture instead.

Sources: https://zfin.org/ZFA:0000667; Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/

#### opercular flap (ZFA:0000555)

ZFA definition: A large flap, covered by integument,  supported by several flat bones, actuated by muscles, found on the side of the head covering the gill chambers.

Synonyms: gill cover, gill slit, opercular apparatus, opercular cover, operculum. ZFA part_of: none. Develops from: not stated.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 72 h: ZFIN start is Unknown. The hyoid arch forms the operculum (Kimmel et al. 1995). The opercle bone starts to ossify about 3 dpf (Cubbage and Mabee 1996, unverified). I suggest showing the flap from 72 hpf and letting it cover the gill arches by 120 hpf (unverified).

Position: AP fraction 0.13-0.24. Lateral head surface behind the eye, covering the gill chamber. Laterality: paired. Landmarks: hinged at the hyomandibula; free posterior edge lies over the pectoral girdle in the adult.
AP fraction by stage: 120 h 0.14-0.23; adult 0.12-0.22.

Shape (sheet): Quarter-disc sheet hinged on its anterior-dorsal edge, lying flat against the head. Animate a small open-close rotation (5-10 degrees) for breathing.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Protruding-mouth | 72 | length 120, height 120, thickness 10 | estimate | no measurement found |
| Day 5 | 120 | length 180, height 170, thickness 12 | estimate | no measurement found |
| Adult | 2160 | length 4000, height 3500, thickness 200 | estimate | no measurement found |

Events:

- 24 h: the mandibular and hyoid arches form the jaws and the operculum (Kimmel)
- 72 h: opercle ossification begins about 3 dpf (unverified)

Notes: Synonym: operculum, gill cover. The opercle bones belong to the skeletal specialist. ZFA gives no part_of parent; I assign the head.

Sources: https://zfin.org/ZFA:0000555; https://zfin.org/ZFA:0000250; https://zfin.org/zf_info/zfbook/stages/phar.html; Cubbage and Mabee 1996, J Morphol 229:121-160

#### pseudobranch (ZFA:0005967)

ZFA definition: An epithelial structure located anterior to the gill filaments and connected to the eye via the ophthalmic artery. It arises from mandibular arch neural crest-derived mesenchyme and first pouch endodermal epithelia.

Synonyms: none. ZFA part_of: none. Develops from: not stated.

Stage range: Larval:Day 4 (ZFS:0000036, 96 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.12-0.15. Inner face of the opercular region, behind the eye, anterior-dorsal to the first gill arch. Laterality: paired. Landmarks: connected to the eye by the ophthalmic artery; not exposed to the water.

Shape (ellipsoid): Small bud at 4 dpf; five short filaments at 17 dpf; one fused oval body in the adult. Draw it as a flat ellipsoid on the inside of the operculum.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 4 | 96 | diameter 25 | estimate | no measurement found |
| Day 5 | 120 | diameter 30 | estimate | no measurement found |
| Days 14-20 | 408 | length 150, filaments 5 | estimate | filament count from Thiruppathy et al. 2022, eLife 11:e78170, https://pmc.ncbi.nlm.nih.gov/articles/PMC9239679/; size is an estimate |
| Adult | 2160 | length 700, height 400, width 200 | estimate | no measurement found |

Events:

- 96 h: ZFIN start (Day 4): small bud behind the eye
- 408 h: five distinct filaments at 17 dpf
- 2160 h: the five filaments merge into one pseudobranch by 90 dpf; five cartilage rods remain

Notes: ZFA gives no part_of parent; I assign the head.

Sources: https://zfin.org/ZFA:0005967; Thiruppathy et al. 2022, eLife 11:e78170, https://pmc.ncbi.nlm.nih.gov/articles/PMC9239679/

#### swim bladder bud (ZFA:0005335)

ZFA definition: Embryonic structure that forms from the anterior gut epithelium at the level of the second somite that then matures to form the swim bladder.

Synonyms: none. ZFA part_of: none. Develops from: ZFA:0005336.

Stage range: Pharyngula:Prim-25 (ZFS:0000031, 36 h) to Hatching:Long-pec (ZFS:0000033, 60 h).

Position: AP fraction 0.27-0.30. Dorsal wall of the foregut at the level of somite 2, ventral to the notochord, dorsal to the yolk. Laterality: midline. Landmarks: posterior to the pharynx, above the anterior yolk ball.

Shape (sphere): Small bud on the dorsal gut; grows into a short tube (pneumatic duct plus sac) by 60 hpf.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Prim-25 | 36 | diameter 25 | estimate | no measurement found |
| Long-pec | 48 | length 50, diameter 35 | estimate | no measurement found |

Events:

- 24 h: presumptive swim bladder in the gut endoderm (ZFA:0005336, 24-36 hpf)
- 36 h: ZFIN start (Prim-25); budding phase 36-48 hpf
- 60 h: ZFIN end (Long-pec); elongation phase 65-96 hpf follows

Notes: Winata et al. 2009 define budding (36-48 hpf), growth (to 4.5 dpf) and inflation phases. ZFA gives no part_of parent; I assign the pleuroperitoneal region.

Sources: https://zfin.org/ZFA:0005335; https://zfin.org/ZFA:0005336; Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/

#### swim bladder (ZFA:0000076)

ZFA definition: The swim bladder is a double-chambered organ located in the coelom and used to maintain buoyancy and may function as an acoustic resonator.

Synonyms: gas bladder. ZFA part_of: ZFA:0007116. Develops from: ZFA:0005335.

Stage range: Hatching:Pec-fin (ZFS:0000034, 60 h) to Adult (ZFS:0000044, 17520 h). Visible from 96 h: ZFIN starts the term at Pec-fin (60 hpf) as an uninflated sac. The posterior chamber inflates at 96-120 hpf (Winata et al. 2009; SL 3.4-3.7 mm in Parichy et al. 2009). Show a collapsed sac from 60 hpf and inflate it at about 100 hpf.

Position: AP fraction 0.27-0.38. Dorsal to the gut and liver, ventral to the notochord and kidney, in the coelom. Laterality: midline. Landmarks: single chamber above the anterior gut behind the pectoral fins in the larva; two chambers in line under the spine from 21 dpf.
AP fraction by stage: 120 h 0.27-0.36; adult 0.25-0.62.

Shape (ellipsoid): One silver ellipsoid from 96 hpf (300 x 190 um at 5-6 dpf). From about 20 dpf add the anterior chamber in front, joined by a 150 um duct. In the adult the two chambers form a figure-eight along the spine.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Pec-fin | 60 | length 60, diameter 40 | estimate | uninflated |
| Day 5 | 120 | length 300, height 190, width 190 | derived | derived from a 6 dpf volume of 0.0058 mm3 (Swim bladder inflation and the lateral line, J Exp Biol 226:jeb245635 (2023), https://pmc.ncbi.nlm.nih.gov/articles/PMC9882242/) as an ellipsoid; axis split is an estimate |
| Days 21-29 | 504 | total_length 2000, posterior_length 1200, anterior_length 800 | estimate | anterior chamber appears at 5.9-6.2 mm SL (Parichy et al. 2009, Dev Dyn 238:2975-3015, https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/) |
| Adult | 2160 | total_length 9000, anterior_length 4200, posterior_length 5000, duct_diameter 150 | estimate | anterior chamber 4.2 mm and duct 150 um from a search summary (unverified); posterior length is an estimate |

Events:

- 36 h: budding phase 36-48 hpf
- 60 h: ZFIN start (Pec-fin)
- 65 h: elongation phase 65-96 hpf forms the pneumatic duct
- 96 h: posterior chamber inflates at 96-120 hpf by air gulping; larvae float up at about 3.7 mm SL
- 432 h: anterior chamber evaginates from the cranial end at 18 dph (6 mm)
- 504 h: anterior chamber inflated at 21 dpf; two-chambered organ complete
- 672 h: smooth muscle band in the posterior chamber wall at 25-30 dph

Notes: Synonym: gas bladder. The 5 dpf size is derived from a wild-type volume of 0.0058 mm3 at 6 dpf.

Sources: https://zfin.org/ZFA:0000076; Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/; Parichy et al. 2009, Dev Dyn 238:2975-3015, https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; Robertson et al. 2007, J Morphol 268:967-985, https://pubmed.ncbi.nlm.nih.gov/17702001/; Swim bladder inflation and the lateral line, J Exp Biol 226:jeb245635 (2023), https://pmc.ncbi.nlm.nih.gov/articles/PMC9882242/

#### posterior chamber swim bladder (ZFA:0001278)

ZFA definition: The posterior compartment of the swim bladder plays a key role in buoyancy control. It is connected to the anterior chamber via the ductus communicans.

Synonyms: none. ZFA part_of: ZFA:0000076. Develops from: not stated.

Stage range: Unknown (ZFS:0000000, 0 h) to Adult (ZFS:0000044, 17520 h). Visible from 96 h: ZFIN start is Unknown. The single larval chamber is the posterior chamber; it inflates at 96-120 hpf.

Position: AP fraction 0.27-0.36. Dorsal to the gut, ventral to the kidney. Laterality: midline. Landmarks: the larval swim bladder; in the adult the caudal chamber, connected to the esophagus by the pneumatic duct.
AP fraction by stage: 120 h 0.27-0.36; adult 0.42-0.62.

Shape (ellipsoid): Ellipsoid, longer than tall. In the adult it tapers caudally.

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Day 5 | 120 | length 300, height 190, width 190 | derived | derived from Swim bladder inflation and the lateral line, J Exp Biol 226:jeb245635 (2023), https://pmc.ncbi.nlm.nih.gov/articles/PMC9882242/ (see swim bladder) |
| Days 21-29 | 504 | length 1200, height 600 | estimate | no measurement found |
| Adult | 2160 | length 5000, height 2000, width 2000 | estimate | no measurement found |

Events:

- 96 h: inflation at 96-120 hpf
- 672 h: smooth muscle band forms in the lateral wall at 25-30 dph

Notes: The ZFA definition states that this chamber corresponds to the larval swim bladder.

Sources: https://zfin.org/ZFA:0001278; Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/; Robertson et al. 2007, J Morphol 268:967-985, https://pubmed.ncbi.nlm.nih.gov/17702001/

#### anterior chamber swim bladder (ZFA:0001277)

ZFA definition: The anterior compartment of the swim bladder is thought to have acoustic resonance properties that play a key role in audition. It is connected to the posterior chamber via the ductus communicans.

Synonyms: camera arerea weberiana. ZFA part_of: ZFA:0000076. Develops from: ZFA:0005337.

Stage range: Larval:Days 14-20 (ZFS:0000040, 336 h) to Adult (ZFS:0000044, 17520 h).

Position: AP fraction 0.25-0.42. Dorsal to the liver and anterior gut, ventral to the head kidney and spine, just behind the pectoral girdle. Laterality: midline. Landmarks: cranial chamber; coupled to the inner ear through the Weberian ossicles.

Shape (ellipsoid): Rounder ellipsoid in front of the posterior chamber, joined by the ductus communicans (150 um).

| Stage | hpf | Dimensions (um) | Basis | Source |
|---|---|---|---|---|
| Days 21-29 | 504 | length 800, height 500 | estimate | no measurement found |
| Adult | 2160 | length 4200, height 2500, width 2500 | estimate | length 4.2 mm from a search summary (unverified); height and width are estimates |

Events:

- 336 h: ZFIN start (Days 14-20); anterior swim bladder bud (ZFA:0005337) present from 60 hpf
- 432 h: evaginates from the cranial end of the original chamber at 18 dph (6 mm)
- 504 h: inflates at 21 dpf; appears at 5.9-6.2 mm SL

Notes: Synonym in ZFA: camera aerea weberiana.

Sources: https://zfin.org/ZFA:0001277; https://zfin.org/ZFA:0005337; Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/; Parichy et al. 2009, Dev Dyn 238:2975-3015, https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; Robertson et al. 2007, J Morphol 268:967-985, https://pubmed.ncbi.nlm.nih.gov/17702001/

## 7. Recommendations for the 3D model

- Use one heart object with a label that switches between the five ZFIN heart terms. Keyframe it as a cone at 20 h and a straight tube of 200 x 50 um at 24 h. Continue with a C-loop at 36 h and an S-loop with the four heart parts at 48 h; the fish heart has two chambers, and the sinus venosus and the bulbus arteriosus are the inflow and outflow segments. After 55 h scale it with body length. Use a ventricle length of 4.28 percent of standard length. Use a ventricle width of 0.83 of that length and a bulbus of 57 percent of that length.
- Draw the axial vessels as four splines that share the body spline. Put the dorsal aorta and the caudal artery under the notochord. Put the posterior cardinal vein and the caudal vein under the aorta. Keep the artery at 25-32 um and the vein at 35-45 um through 5 dpf.
- Build the intersegmental vessels as one segment array driven by the somite count and the somite length. Start the array at 22 h with sprouts of zero height and grow them to the DLAV by 36 h. Color them red until 48 h, then alternate red and blue.
- Model the aortic arches as one segment array of six arcs per side. Add arch 1 at 24 h, arches 3-4 at 48 h and arches 5-6 at 50-60 h. Fade arch 2 at 72 h and arch 1 soon after. Convert arches 3-6 into the four adult gill arch arteries.
- Render the common cardinal veins as two wide translucent sheets over the yolk between 24 h and 60 h. This sheet is one of the most visible vascular features in a live embryo at 48 h.
- Show the blood-forming sites as a relay. The early sites are the intermediate cell mass (16-60 h) and the blood island (22-30 h). The later sites are the caudal hematopoietic tissue (48-336 h), the thymus (from 54-72 h) and the head kidney (from 96 h). A short pulse of color at each hand-over makes the time axis readable.
- Inflate the swim bladder between 96 h and 120 h. A collapsed sac from 60 h to 96 h and a sudden inflation match what a viewer sees in a dish. Add the anterior chamber at about 500 h.
- Treat the opercular flap as a hinged sheet that grows caudally over the gill arches from 72 h. Keep the gill filaments as tapered cones on four arches per side. Grow the count from about 4 at 5 dpf to about 25 in the adult.
- Keep the head vessels to three named vessels plus the aortic arches. The full head network has more than 30 named vessels in ZFA and will not read at whole-body scale.
- Store every size with basis `estimate` as a named parameter. A later measurement pass can then replace it in one place.

## 8. Open questions

- Heart chamber sizes at 48 hpf and 120 hpf in micrometers. I found ratios (Singleman and Holtzman 2012) and cell counts (Auman et al. 2007) but no direct chamber lengths. A light-sheet or confocal measurement from the lab would replace the derived values.
- Vessel diameters. The dorsal aorta value of 32 um at 42.5 hpf comes from a search summary of Stratman et al. 2017 and needs a check in the paper. The posterior cardinal vein, intersegmental vessel and adult vessel diameters are estimates.
- Opercular flap timing. I could not open the larval page of the ZFIN staging series (connection refused on six tries) or Cubbage and Mabee 1996. The time at which the flap covers the gill arches (72-120 hpf) is unverified.
- Adult swim bladder posterior chamber length, adult spleen size, adult thymus size and adult head kidney size are estimates.
- Isogai et al. 2001 (the vascular atlas) was not accessible in full. Vessel timings for the cranial vessels rest on ZFIN start stages and the ZFA definitions.
- Whether the UI hierarchy should nest vessels under `trunk vasculature`, `cardinal system` and `post-vent vasculature` (ZFA part_of) or under one `blood vasculature` node. The JSON follows ZFA; the atlas team can remap.

## 9. Sources

- Anderson et al. 2008, Dev Biol 318:258-267, https://pubmed.ncbi.nlm.nih.gov/18462713/
- Auman et al. 2007, PLoS Biol 5:e53, https://pmc.ncbi.nlm.nih.gov/articles/PMC1802756/
- Bakkers 2011, Cardiovasc Res 91:279-288, https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/
- Battista et al. 2016, arXiv:1610.03427 (heart tube diameter 0.05 mm at 26-30 hpf, citing Baird et al. 2014), https://arxiv.org/abs/1610.03427
- Cubbage and Mabee 1996, J Morphol 229:121-160
- Danilova et al. 2004, Dev Comp Immunol 28:755-767, https://pubmed.ncbi.nlm.nih.gov/15043944/
- Denvir et al. 2008, BMC Biotechnol 8:21, https://pmc.ncbi.nlm.nih.gov/articles/PMC2291041/
- Developmental atlas of zebrafish gills, Development 152:dev204984 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12517346/
- Endothelial cell morphology and dorsal aorta geometry (2024), https://pmc.ncbi.nlm.nih.gov/articles/PMC11392406/
- From stripes to a beating heart (review, 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7916704/
- Gore et al. 2012, Cold Spring Harb Perspect Med 2:a006684, https://pmc.ncbi.nlm.nih.gov/articles/PMC3331685/
- Gupta and Mullins 2010, J Vis Exp 37:1717, https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/
- Helker et al. 2013, Development 140:2776-2786, https://journals.biologists.com/dev/article/140/13/2776/76627
- ImageJ-based analysis of the developing zebrafish vasculature, Vascular Cell 9:2 (2017), https://vascularcell.com/public/journals/1/articles/13221-09-01-172/13221-09-02_html.html
- Intersegmental vessel overview (ScienceDirect Topics), https://www.sciencedirect.com/topics/medicine-and-dentistry/intersegmental-vessel
- Isogai et al. 2001, Dev Biol 230:278-301, https://pubmed.ncbi.nlm.nih.gov/11161578/
- Ivanovski et al. 2009, PMID 20087250 (adult average size 2.5 cm), https://pubmed.ncbi.nlm.nih.gov/20087250/
- Jonz and Nurse 2005, J Exp Biol 208:1537-1549, https://www.researchgate.net/publication/7932803_Development_of_oxygen_sensing_in_the_gills_of_zebrafish
- Kimmel et al. 1995, Dev Dyn 203:253-310, https://doi.org/10.1002/aja.1002030302
- Lam et al. 2002, Dev Dyn 225:87-94, https://pubmed.ncbi.nlm.nih.gov/12203724/
- Lam et al. 2004, Dev Comp Immunol 28:9-28, https://www.sciencedirect.com/science/article/abs/pii/S0145305X03001034
- Menke et al. 2011, Toxicol Pathol 39:759-775, https://journals.sagepub.com/doi/10.1177/0192623311409597
- Murayama et al. 2006, Immunity 25:963-975, https://pubmed.ncbi.nlm.nih.gov/17157041/
- Parichy et al. 2009, Dev Dyn 238:2975-3015, https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/
- Robertson et al. 2007, J Morphol 268:967-985, https://pubmed.ncbi.nlm.nih.gov/17702001/
- Singleman and Holtzman 2012, Dev Dyn 241:1993-2004, https://pmc.ncbi.nlm.nih.gov/articles/PMC4446259/
- Singleman and Holtzman 2014, Zebrafish 11:396-406, https://europepmc.org/article/PMC/PMC4108942
- Stratman et al. 2017, Development 144:115-127, https://journals.biologists.com/dev/article/144/1/115/47946
- Swim bladder inflation and the lateral line, J Exp Biol 226:jeb245635 (2023), https://pmc.ncbi.nlm.nih.gov/articles/PMC9882242/
- The fish spleen (review, 2023), Fish Shellfish Immunol, https://www.sciencedirect.com/science/article/pii/S1050464823007660
- Thiruppathy et al. 2022, eLife 11:e78170, https://pmc.ncbi.nlm.nih.gov/articles/PMC9239679/
- Twisting of the zebrafish heart tube during cardiac looping, eLife 9:e61733 (2020), https://elifesciences.org/articles/61733
- Willett et al. 1999, Dev Dyn 214:323-336, https://pubmed.ncbi.nlm.nih.gov/10213388/
- Winata et al. 2009, Dev Biol 331:222-236, https://pubmed.ncbi.nlm.nih.gov/19422819/
- https://zfin.org/ZFA:0009014
- https://zfin.org/zf_info/zfbook/stages/hatch.html
- https://zfin.org/zf_info/zfbook/stages/index.html
- https://zfin.org/zf_info/zfbook/stages/phar.html
- ZFIN anatomy term pages: https://zfin.org/ZFA:0000114 and the other identifiers listed above.
- Local ZFIN files: `stage_ontology.txt`, `anatomy_item.txt`, `anatomy_relationship.txt`, `anatomy_synonyms.txt`, `zfa.obo` (release 2026-07-16).
