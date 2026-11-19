# Skeletal, muscular, fin and integument anatomy for the zebrafish 3D atlas

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

File pair: this document and `03e-anatomy-skeletal-muscular-fins-integument.draft.json`. The JSON holds the same 45 structures in the atlas draft format.

## Scope and method

This document covers four systems: the skeleton, the skeletal muscles, the fins, and the skin with its pigment cells. It lists 45 structures that a whole-organism schematic model can draw. It works at the organ or tissue level. Two exceptions are the slow and fast muscle terms, which the Zebrafish Anatomy Ontology (ZFA) only defines at the cell level.

I took every stage in the tables below from the ZFIN files `anatomy_item.txt` and `stage_ontology.txt` (hours post fertilization, hpf, at 28.5 C). I took definitions and part_of relations from `zfa.obo`. I took body lengths for embryos and larvae from the Kimmel et al. 1995 stage table on ZFIN (https://zfin.org/zf_info/zfbook/stages/index.html). I took post-embryonic stages in standard length (SL, mm) from Parichy et al. 2009 (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/). Every other number carries a source in the notes. A size marked (estimate) is my scaling from body length. A fact marked (unverified) comes from a search summary or an abstract. I could not read those papers in full.

Reference body lengths used for estimates (Kimmel et al. 1995 stage table on ZFIN):

| Stage | hpf | Length | Note |
|---|---|---|---|
| 14-19 somites | 16 | 0.9 mm EL | embryo length |
| 20-25 somites | 19 | 1.4 mm EL | |
| 26+ somites | 22 | 1.6 mm EL | |
| Prim-5 | 24 | 1.9 mm EL | early pigmentation, heartbeat |
| Prim-15 | 30 | 2.5 mm EL | retina pigmented |
| Prim-25 | 36 | 2.7 mm EL | tail pigmentation |
| High-pec | 42 | 2.9 mm EL | rudiments of pectoral fins |
| Long-pec | 48 | 3.1 mm EL | elongated pectoral fin buds |
| Pec-fin | 60 | 3.3 mm EL | pectoral fin blades |
| Protruding-mouth | 72 | 3.5 mm TL | |
| Day 4 | 96 | 3.7 mm TL | |
| Day 5 | 120 | 3.9 mm TL | 6 teeth |
| Day 6 | 144 | 4.2 mm TL | |
| Days 7-13 | 168 | 4.5 mm TL | 8 teeth |
| Days 14-20 | 336 | 6.2 mm TL | 10 teeth |
| Days 21-29 | 504 | 7.8 mm TL | |
| Days 30-44 | 720 | 10 mm TL | adult fins and pigment |
| Days 45-89 | 1080 | 14 mm TL | 12 teeth |
| Adult | 2160 | 28 mm SL (reference fish, estimate) | FishBase maximum 3.8 cm SL (https://www.fishbase.se/summary/Danio-rerio.html) |

Post-embryonic milestones in standard length (Parichy et al. 2009, Table 4):

| Stage | SL (mm) | Meaning |
|---|---|---|
| pSB | 3.5-3.7 | swim bladder inflation |
| FLe | 4.4-4.7 | notochord flexion begins (about 4.5); complete by 6.5 with a 45 degree angle |
| CR | 4.9-5.1 | caudal fin rays appear (about 16 dpf per Frohnhofer et al. 2013) |
| AC | 5.2-5.5 | anal fin condensation |
| DC | 5.5-5.8 | dorsal fin condensation |
| MMA | 5.9-6.3 | metamorphic melanophores appear |
| AR | 6.1-6.4 | anal fin rays |
| DR | 6.4-6.6 | dorsal fin rays |
| PB | 7.2-7.5 | pelvic fin bud |
| PR | 8.5-8.7 | pelvic fin rays |
| SP | 9.5-9.6 | squamation onset posterior |
| SA | 10.1-10.4 | squamation through anterior |
| J | 10.9-11.7 | juvenile; fin fold lost |

The anterior-posterior position (apFraction) is a fraction of standard length from the snout tip. Values above 1.0 lie on the caudal fin. The fractions are schematic estimates for a fusiform adult with head length about 0.25 SL and body depth about 0.23 SL. Embryonic positions differ because the yolk sac sits under the head and anterior trunk.

## Tables by system

Columns: ZFA id, name, direct ZFA part_of parent, UI parent, ZFIN start and end stage (hpf), position, shape primitive, color hint. A plus sign (+) after the start stage marks a `visibleFromHpf` override. The deviations table explains each override.

### Skeletal system (16 structures)

| ZFA id | Name | ZFA parent | UI parent | ZFIN start | ZFIN end | Position (apFraction; DV; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0001580 | neurocranium | ZFA:0000737 cranium | ZFA:0000434 skeletal system | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.02-0.24; dorsal half of the head, floor and walls around the brain ...; midline | custom | #8FC1E3 |
| ZFA:0001216 | splanchnocranium | ZFA:0000737 cranium | ZFA:0000434 skeletal system | ZFS:0000025 (14 hpf)+ | ZFS:0000044 (17520 hpf) | 0.08-0.26; ventral half of the head, below the neurocranium and eye ...; paired | custom | #8FC1E3 |
| ZFA:0001205 | Meckel's cartilage | ZFA:0001273 ventral mandibular arch | ZFA:0001216 splanchnocranium | ZFS:0000033 (48 hpf) | ZFS:0000044 (17520 hpf) | 0.06-0.14; ventral-most element of the head, floor of the mouth; paired | tube | #8FC1E3 |
| ZFA:0001399 | palatoquadrate cartilage | ZFA:0001272 palatoquadrate arch | ZFA:0001216 splanchnocranium | ZFS:0000033 (48 hpf) | ZFS:0000044 (17520 hpf) | 0.08-0.16; lateral to the pharynx, between Meckel's cartilage below ...; paired | sheet | #8FC1E3 |
| ZFA:0001400 | ceratohyal cartilage | ZFA:0001402 ventral hyoid arch | ZFA:0001216 splanchnocranium | ZFS:0000033 (48 hpf) | ZFS:0000044 (17520 hpf) | 0.1-0.2; ventral head, behind and below Meckel's cartilage, floor of ...; paired | tube | #8FC1E3 |
| ZFA:0001422 | hyosymplectic cartilage | ZFA:0001401 dorsal hyoid arch | ZFA:0001216 splanchnocranium | ZFS:0000033 (48 hpf) | ZFS:0000044 (17520 hpf) | 0.14-0.22; lateral head wall below the otic capsule, above the ...; paired | sheet | #8FC1E3 |
| ZFA:0000095 | pharyngeal arch 3-7 skeleton | ZFA:0001216 splanchnocranium | ZFA:0001216 splanchnocranium | ZFS:0000025 (14 hpf)+ | ZFS:0000044 (17520 hpf) | 0.16-0.26; ventrolateral head, floor and sides of the pharynx behind ...; paired | segmentArray | #8FC1E3 |
| ZFA:0000694 | ceratobranchial 5 tooth | ZFA:0000056 pharynx | ZFA:0000095 pharyngeal arch 3-7 skeleton | ZFS:0000033 (48 hpf) | ZFS:0000044 (17520 hpf) | 0.22-0.26; floor of the posterior pharynx, medial face of ...; paired | custom | #E9DFC4 |
| ZFA:0000191 | dentary | ZFA:0000863 dermatocranium | ZFA:0001216 splanchnocranium | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.04-0.12; ventral-most bone of the head, lateral to the anterior half ...; paired | sheet | #E9DFC4 |
| ZFA:0000270 | maxilla | ZFA:0000863 dermatocranium | ZFA:0001216 splanchnocranium | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.03-0.1; upper lip region, lateral to the mouth, below the eye; paired | tube | #E9DFC4 |
| ZFA:0000250 | opercle | ZFA:0000555 opercular flap | ZFA:0001216 splanchnocranium | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.18-0.26; lateral head wall behind the eye, covering the gill chamber; paired | sheet | #E9DFC4 |
| ZFA:0000184 | cleithrum | ZFA:0000407 pectoral girdle | ZFA:0000434 skeletal system | ZFS:0000032 (42 hpf) | ZFS:0000044 (17520 hpf) | 0.24-0.29; spans from the dorsal occipital region down to the ventral ...; paired | tube | #E9DFC4 |
| ZFA:0001189 | vertebra | ZFA:0001559 vertebral column | ZFA:0000434 skeletal system | ZFS:0000035 (72 hpf) | ZFS:0000044 (17520 hpf) | 0.26-0.92; axial midline around the notochord, ventral to the spinal ...; midline | segmentArray | #E9DFC4 |
| ZFA:0000538 | rib | ZFA:0001582 non-Weberian precaudal vertebra | ZFA:0001189 vertebra | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.32-0.56; curve ventrolaterally from the parapophyses of the ...; paired | segmentArray | #E9DFC4 |
| ZFA:0001188 | Weberian apparatus | ZFA:0001559 vertebral column | ZFA:0001189 vertebra | ZFS:0000039 (168 hpf) | ZFS:0000044 (17520 hpf) | 0.26-0.34; dorsal to the anterior chamber of the swim bladder, just ...; midline with paired ossicles | custom | #E9DFC4 |
| ZFA:0000364 | hypural | ZFA:0000862 caudal fin skeleton | ZFA:0001058 caudal fin | ZFS:0000036 (96 hpf) | ZFS:0000044 (17520 hpf) | 0.92-1.0; ventral to the upturned tip of the notochord (urostyle) ...; midline | custom | #8FC1E3 |

### Muscular system (7 structures)

| ZFA id | Name | ZFA parent | UI parent | ZFIN start | ZFIN end | Position (apFraction; DV; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0001056 | myotome | ZFA:0000473 trunk musculature | ZFA:0000548 musculature system | ZFS:0000023 (10.33 hpf) | ZFS:0000044 (17520 hpf) | 0.25-0.98; whole depth of the trunk and tail lateral to the notochord ...; paired | segmentArray | #D98A8A |
| ZFA:0000671 | horizontal myoseptum | none | ZFA:0001056 myotome | ZFS:0000028 (22 hpf) | ZFS:0000044 (17520 hpf) | 0.25-0.98; horizontal plane at mid-depth of the myotome, at the level ...; paired | sheet | #F7E8E8 |
| ZFA:0009116 | slow muscle cell | none | ZFA:0001056 myotome | ZFS:0000023 (10.33 hpf) | ZFS:0000044 (17520 hpf) | 0.25-0.98; superficial monolayer on the lateral surface of each ...; paired | sheet | #B03A3A |
| ZFA:0009117 | fast muscle cell | none | ZFA:0001056 myotome | ZFS:0000024 (11.66 hpf) | ZFS:0000044 (17520 hpf) | 0.25-0.98; deep bulk of each myotome, medial to the slow layer, from ...; paired | segmentArray | #F2BFBF |
| ZFA:0007049 | adductor mandibulae | none | ZFA:0001216 splanchnocranium | ZFS:0000032 (42 hpf) | ZFS:0000041 (720 hpf) | 0.09-0.15; lateral to the palatoquadrate, behind and below the eye; paired | tube | #D98A8A |
| ZFA:0001651 | sternohyoid | none | ZFA:0001216 splanchnocranium | ZFS:0000033 (48 hpf) | ZFS:0000044 (17520 hpf) | 0.16-0.27; ventral midline of the throat, between the ceratohyals and ...; paired, fused to a midline cone | tube | #D98A8A |
| ZFA:0000563 | pectoral fin musculature | ZFA:0001161 pectoral fin | ZFA:0001161 pectoral fin | ZFS:0000031 (36 hpf) | ZFS:0000044 (17520 hpf) | 0.25-0.3; at the fin base on the ventrolateral body wall behind the ...; paired | ellipsoid | #D98A8A |

### Fins (9 structures)

| ZFA id | Name | ZFA parent | UI parent | ZFIN start | ZFIN end | Position (apFraction; DV; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0000040 | median fin fold | none | ZFA:0000108 fin | ZFS:0000028 (22 hpf) | ZFS:0000037 (144 hpf) | 0.42-1.0; continuous sagittal fold: dorsal from somite 8 back around ...; midline | fin | #CFE8F3 |
| ZFA:0000141 | pectoral fin bud | none | ZFA:0000108 fin | ZFS:0000029 (24 hpf) | ZFS:0000033 (60 hpf) | 0.26-0.31; lateral body wall at the yolk sac / trunk boundary, level ...; paired | ellipsoid | #CFE8F3 |
| ZFA:0001161 | pectoral fin | none | ZFA:0000108 fin | ZFS:0000030 (30 hpf) | ZFS:0000044 (17520 hpf) | 0.26-0.4; ventrolateral, behind the opercle, above the yolk sac in ...; paired | fin | #CFE8F3 |
| ZFA:0001384 | pelvic fin bud | none | ZFA:0000108 fin | ZFS:0000040 (336 hpf) | ZFS:0000042 (1080 hpf) | 0.48-0.52; ventral body wall, below the posterior lobe of the swim ...; paired | ellipsoid | #CFE8F3 |
| ZFA:0001184 | pelvic fin | none | ZFA:0000108 fin | ZFS:0000042 (720 hpf) | ZFS:0000044 (17520 hpf) | 0.48-0.62; ventral, on the belly below the swim bladder, anterior to ...; paired | fin | #CFE8F3 |
| ZFA:0001173 | dorsal fin | none | ZFA:0000108 fin | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.58-0.72; dorsal midline, above the vent and anal fin origin; midline | fin | #CFE8F3 |
| ZFA:0001162 | anal fin | ZFA:0001117 post-vent region | ZFA:0000108 fin | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.6-0.8; ventral midline, immediately posterior to the vent; midline | fin | #CFE8F3 |
| ZFA:0001058 | caudal fin | ZFA:0001117 post-vent region | ZFA:0000108 fin | ZFS:0000029 (24 hpf) | ZFS:0000044 (17520 hpf) | 0.95-1.2; posterior end of the body, centered on the axis; upper lobe ...; midline | fin | #CFE8F3 |
| ZFA:0001554 | lepidotrichium | none | ZFA:0000108 fin | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.26-1.2; inside every fin membrane, radiating from the fin base; paired hemitrichia per ray | segmentArray | #E9DFC4 |

### Integument and pigment (13 structures)

| ZFA id | Name | ZFA parent | UI parent | ZFIN start | ZFIN end | Position (apFraction; DV; side) | Shape | Color |
|---|---|---|---|---|---|---|---|---|
| ZFA:0001185 | periderm | ZFA:0000016 ectoderm | ZFA:0000368 integument | ZFS:0000022 (10 hpf) | ZFS:0000028 (24 hpf) | 0.0-1.0; outermost cell layer of the whole embryo including the yolk ...; midline | sheet | #F5E6D3 |
| ZFA:0000105 | epidermis | ZFA:0000368 integument | ZFA:0000368 integument | ZFS:0000029 (24 hpf) | ZFS:0000044 (17520 hpf) | 0.0-1.0; outer surface of the whole body and fins; midline | sheet | #F5E6D3 |
| ZFA:0001119 | dermis | ZFA:0000368 integument | ZFA:0000368 integument | ZFS:0000029 (24 hpf) | ZFS:0000044 (17520 hpf) | 0.0-1.0; directly under the epidermis, over the hypodermis and muscle; midline | sheet | #EBD9C8 |
| ZFA:0000277 | scale | ZFA:0001183 dermal superficial region | ZFA:0001119 dermis | ZFS:0000042 (720 hpf) | ZFS:0000044 (17520 hpf) | 0.2-1.0; over the whole trunk and tail flank in overlapping rows ...; paired | custom | #D9E2E8 |
| ZFA:0009091 | melanocyte | ZFA:0000368 integument | ZFA:0000368 integument | ZFS:0000029 (24 hpf) | ZFS:0000044 (17520 hpf) | 0.05-1.1; dermal and hypodermal pigment cells; in the embryo arranged ...; paired | custom | #1A1A1A |
| ZFA:0009198 | xanthophore | ZFA:0000368 integument | ZFA:0000368 integument | ZFS:0000032 (42 hpf) | ZFS:0000044 (17520 hpf) | 0.05-1.1; scattered widely over the body in the larva; in the adult ...; paired | custom | #F2C14E |
| ZFA:0009199 | iridophore | ZFA:0000368 integument | ZFA:0000368 integument | ZFS:0000032 (42 hpf) | ZFS:0000044 (17520 hpf) | 0.05-1.1; eye and yolk sac in the embryo; dense sheet in the ...; paired | custom | #C9D6DF |
| ZFA:0005221 | dorsal larval melanophore stripe | none | ZFA:0009091 melanocyte | ZFS:0000030 (30 hpf) | ZFS:0000040 (504 hpf) | 0.05-0.98; dorsal apex of the myotomes and the dorsal head, along the ...; paired | tube | #1A1A1A |
| ZFA:0005223 | lateral larval melanophore stripe | none | ZFA:0009091 melanocyte | ZFS:0000032 (42 hpf) | ZFS:0000040 (504 hpf) | 0.28-0.95; at the level of the horizontal myoseptum on the flank; paired | tube | #1A1A1A |
| ZFA:0005222 | ventral larval melanophore stripe | none | ZFA:0009091 melanocyte | ZFS:0000031 (36 hpf) | ZFS:0000040 (504 hpf) | 0.15-0.95; ventral edge of the myotomes, dorsal to the yolk and gut ...; paired | tube | #1A1A1A |
| ZFA:0005224 | yolk larval melanophore stripe | none | ZFA:0009091 melanocyte | ZFS:0000035 (72 hpf) | ZFS:0000040 (504 hpf) | 0.12-0.45; ventral surface of the yolk sac and yolk extension; paired | tube | #1A1A1A |
| ZFA:0001463 | melanophore stripe | ZFA:0000368 integument | ZFA:0009091 melanocyte | ZFS:0000000 (0 hpf)+ | ZFS:0000044 (17520 hpf) | 0.25-1.2; flank: stripes 1D and 1V flank the interstripe X0 at the ...; paired | tube | #1A1A1A |
| ZFA:0000622 | barbel | ZFA:0000368 integument | ZFA:0001114 head | ZFS:0000043 (1080 hpf) | ZFS:0000044 (17520 hpf) | 0.03-0.12; ventrolateral snout: maxillary barbel at the posteroventral ...; paired | tube | #D8B48A |

## Deviations from ZFIN start stages

The JSON keeps the ZFIN start and end stages unchanged. Where the ZFIN start stage is Unknown (ZFS:0000000, 0 hpf) or earlier than the first drawable form, the JSON adds `visibleFromHpf`. The model should create the mesh at `visibleFromHpf`, not at `startHpf`.

| ZFA id | Name | ZFIN start | visibleFromHpf | Reason |
|---|---|---|---|---|
| ZFA:0001580 | neurocranium | ZFS:0000000 (0 hpf) | 42 | ZFIN gives start stage Unknown. The first Alcian-positive element, the trabecula cranii, has ZFIN start stage High-pec (42 hpf). |
| ZFA:0001216 | splanchnocranium | ZFS:0000025 (14 hpf) | 48 | ZFIN start stage is 10-13 somites (14 hpf) for the arch primordia. Alcian-positive cartilage is present from about 48 to 55 hpf. |
| ZFA:0000095 | pharyngeal arch 3-7 skeleton | ZFS:0000025 (14 hpf) | 48 | ZFIN start stage is 10-13 somites (14 hpf) for the arch skeleton primordia. Cartilage rods are visible from 48 to 60 hpf. |
| ZFA:0000191 | dentary | ZFS:0000000 (0 hpf) | 86 | ZFIN start stage Unknown. FishFace reports Alizarin-red-positive dentary at 86 hpf; the ZFA definition (from Cubbage and Mabee 1996) gives 5.1 mm NL. |
| ZFA:0000270 | maxilla | ZFS:0000000 (0 hpf) | 200 | ZFIN start stage Unknown. The ZFA definition gives 4.8 mm NL, which the ZFIN stage table places in Days 7-13 (4.5 mm at 168 hpf). |
| ZFA:0000250 | opercle | ZFS:0000000 (0 hpf) | 72 | ZFIN start stage Unknown. Kimmel et al. 2010 report first mineralization at 3 dpf. |
| ZFA:0000538 | rib | ZFS:0000000 (0 hpf) | 600 | ZFIN start stage Unknown. Rib onset is an estimate (about 6 to 7 mm SL); the ZFA lists ribs of vertebrae 1-6 as separate terms. |
| ZFA:0001173 | dorsal fin | ZFS:0000000 (0 hpf) | 400 | ZFIN start stage Unknown. Parichy et al. 2009 place the first dorsal fin condensation at 5.5 to 5.8 mm SL, which is about 14 to 17 dpf under their conditions (ZFIN stage table: 6.2 mm TL at 14 dpf). |
| ZFA:0001162 | anal fin | ZFS:0000000 (0 hpf) | 380 | ZFIN start stage Unknown. First condensation at 5.2 to 5.5 mm SL (Parichy et al. 2009), about 13 to 16 dpf. |
| ZFA:0001554 | lepidotrichium | ZFS:0000000 (0 hpf) | 300 | ZFIN start stage Unknown. First lepidotrichia (caudal) at 4.9 to 5.1 mm SL, about 16 dpf. |
| ZFA:0001463 | melanophore stripe | ZFS:0000000 (0 hpf) | 800 | ZFIN start stage Unknown. The first adult stripes (1D, 1V) are discernible at about 9 mm SL (Parichy et al. 2009), about 30 dpf (ZFIN stage table: 10 mm TL at 30 dpf, 'adult fins/pigment'). |

Two further ZFIN values need care. The caudal fin (ZFA:0001058) starts at Prim-5 because ZFIN treats the caudal part of the fin fold as the fin. Its rays appear at 4.9 to 5.1 mm SL. The myotome (ZFA:0001056) starts at 1-4 somites. The somite term (ZFA:0000155) ends at Pec-fin (72 hpf), so the myotome is the term that persists.

## Hierarchy notes

The JSON has two parent fields. `parent` is the first direct part_of parent in `zfa.obo`; `parentAll` lists all of them. `uiParent` is the nearest ancestor that this file or a system-level term contains. The system-level terms are skeletal system ZFA:0000434, musculature system ZFA:0000548, fin ZFA:0000108, integument ZFA:0000368, and head ZFA:0001114. The merge step can create these five as group nodes.

Some ZFA terms have no part_of parent (they only have is_a). Examples: fins (is_a surface structure), lepidotrichium (is_a dermal bone), adductor mandibulae and sternohyoid (is_a mandibular muscle). For these `parent` is null and `uiParent` carries the hierarchy.

The notochord (ZFA:0000135) belongs to the axial specialist. The skeletal entries reference it as the axis of the vertebrae and hypurals.

## Notes per structure

### Skeletal system

#### ZFA:0001580 neurocranium

Synonyms: braincase; palatal skeleton.

Definition (ZFA): Anatomical cluster that is the regional skeletal system surrounding the brain.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 42 hpf.

Position: apFraction 0.02 to 0.24. Dorsoventral: dorsal half of the head, floor and walls around the brain, above the pharynx. Laterality: midline. Landmarks: from the ethmoid plate at the snout to the occipital arch at the first vertebra; roofs the orbit and otic capsule.

Shape: custom. Model a shallow trough (lathe or extruded U-profile) under the brain. Paired trabeculae (thin rods) fuse anteriorly into a flat ethmoid plate. Parachordals flank the notochord tip posteriorly. Add a dermal roof (frontal, parietal) only from the juvenile stage.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 350 um, width 120 um | estimate; trabeculae plus ethmoid plate; scaled to a 3.1 mm embryo | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 600 um, width 250 um | estimate; cartilaginous neurocranium of a 3.9 mm larva | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | length 6500 um, width 3500 um, height 3000 um | estimate; skull of a 28 mm SL adult; head length about 0.25 SL | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 42 hpf: trabeculae cranii are the first neurocranial cartilage (ZFIN start stage High-pec) (https://zfin.org/ZFA:0001507)
- 48 hpf: parachordal cartilages and the ethmoid plate appear (ZFIN start stage Long-pec) (https://zfin.org/ZFA:0001405)
- 288 hpf: occipital arch cartilages fuse and meet medially as the tectum synoticum by 12 dpf (https://zfin.org/ZFA:0001504)
- 504 hpf: frontal bone ossifies (ZFIN start stage Days 21-29) (https://zfin.org/ZFA:0000514)
- 1080 hpf: ethmoid cartilage is replaced by bone (ZFIN end stage Days 30-44 for the cartilage) (https://zfin.org/ZFA:0001405)

Notes: Group node. Sub-elements with their own ZFA ids: trabecula cranii ZFA:0001507, ethmoid cartilage ZFA:0001405, parachordal cartilage ZFA:0001423, parasphenoid ZFA:0000561, frontal bone ZFA:0000514, parietal bone ZFA:0000486.

Sources: https://zfin.org/ZFA:0001580; https://zfin.org/ZFA:0001507; https://zfin.org/ZFA:0001405; https://zfin.org/ZFA:0000514; https://pubmed.ncbi.nlm.nih.gov/29852585/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/

#### ZFA:0001216 splanchnocranium

Synonyms: pharyngeal arch skeleton; pharyngeal skeleton.

Definition (ZFA): Anatomical cluster that is the regional skeletal system of the jaws, hyoid and branchial arches.

ZFIN stages: ZFS:0000025 (14 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 48 hpf.

Position: apFraction 0.08 to 0.26. Dorsoventral: ventral half of the head, below the neurocranium and eye, around the pharynx. Laterality: paired. Landmarks: from the mouth (anterior tip of Meckel's cartilage) to the last gill arch under the otic capsule.

Shape: custom. Group of seven bilateral arches. Model each arch as one or two bent tubes (dorsal and ventral elements) hanging from the neurocranium and meeting at the ventral midline.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 300 um, width 250 um | estimate; first condensations; arch 1 and 2 elements distinct by 55 hpf | https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/ |
| Day 5 | 120 | length 550 um, width 350 um, height 250 um | estimate; all seven arches cartilaginous in a 3.9 mm larva | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | length 6000 um, width 4000 um, height 3500 um | estimate; jaws plus opercular series of a 28 mm SL adult | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 14 hpf: ZFIN start stage 10-13 somites (arch primordia) (https://zfin.org/ZFA:0001216)
- 45 hpf: cartilage pattern of the pharyngeal arches emerges between 45 and 72 hpf (https://pubmed.ncbi.nlm.nih.gov/9808777/)
- 55 hpf: Meckel's cartilage, palatoquadrate and ceratohyal are distinct cartilage elements by 55 hpf (https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/)
- 72 hpf: opercle is the first dermal bone of the arch skeleton to mineralize (3 dpf) (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475)
- 96 hpf: larvae start feeding at 4 dpf with a functional jaw (https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal)

Notes: Group node for the pharyngeal skeleton. Children in this file: Meckel's cartilage, palatoquadrate, ceratohyal, hyosymplectic, pharyngeal arch 3-7 skeleton, ceratobranchial 5 tooth, dentary, maxilla, opercle.

Sources: https://zfin.org/ZFA:0001216; https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal; https://pubmed.ncbi.nlm.nih.gov/9808777/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/; https://pubmed.ncbi.nlm.nih.gov/29852585/

#### ZFA:0001205 Meckel's cartilage

Synonyms: ventral mandibular cartilage.

Definition (ZFA): Meckel's cartilage is the bilaterally paired, rod-like, cartilaginous ventral component of the lower jaw, or ventral mandibular arch. It is typically resorbed in adults.

ZFIN stages: ZFS:0000033 (48 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.06 to 0.14. Dorsoventral: ventral-most element of the head, floor of the mouth. Laterality: paired. Landmarks: left and right rods meet at the anterior midline (mandibular symphysis); posterior end articulates with the palatoquadrate.

Shape: tube. Two curved rods forming a V that opens posteriorly. Diameter about 1 to 2 chondrocytes (15 to 25 um) in the larva. Later wrap in a thin dentary bone shell.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 90 um, diameter 20 um | estimate; condensation becoming a distinct rod by 55 hpf | https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/ |
| Pec-fin | 60 | length 130 um, diameter 20 um | estimate | https://pubmed.ncbi.nlm.nih.gov/9808777/ |
| Day 5 | 120 | length 220 um, diameter 25 um | estimate; rod that spans the mediolateral width with single stacked chondrocytes; length is an estimate | https://www.facebase.org/resources/zebrafish/fishface/meckel/ |
| Adult | 2160 | length 3000 um, diameter 250 um | estimate; lower jaw of a 28 mm SL adult, largely replaced by dentary and anguloarticular bone | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 48 hpf: mesenchymal precartilage condensation in the mandibular arch at the start of the hatching period (https://zfin.org/zf_info/zfbook/stages/hatch.html)
- 55 hpf: Meckel's cartilage is present and distinct from the palatoquadrate by 55 hpf (https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/)
- 78 hpf: dentary osteoblasts appear along the anterolateral surface at 78 hpf (https://www.facebase.org/resources/zebrafish/fishface/meckel/)
- 86 hpf: chondrocytes span the mediolateral width; growth by cell intercalation (https://www.facebase.org/resources/zebrafish/fishface/meckel/)

Sources: https://zfin.org/ZFA:0001205; https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/; https://www.facebase.org/resources/zebrafish/fishface/meckel/; https://pubmed.ncbi.nlm.nih.gov/9808777/; https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal

#### ZFA:0001399 palatoquadrate cartilage

Synonyms: dorsal mandibular cartilage; pterygoquadrate; quadrate cartilage.

Definition (ZFA): Cartilage that is the dorsal component of the first pharyngeal arch.  It is roughly triangular with slightly concave dorsal edges and convex ventral edges.  The anteroventral corner gives rise the quadrate and articulates with the posterior end of  Meckel's cartilage.  The anterodorsal tip articulates with the lateral edge of the ethmoid plate and the posteroventral edge articulates with the anterodorsal edge of the hyosymplectic.

ZFIN stages: ZFS:0000033 (48 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.08 to 0.16. Dorsoventral: lateral to the pharynx, between Meckel's cartilage below and the ethmoid plate above. Laterality: paired. Landmarks: anteroventral corner (quadrate) meets Meckel's cartilage; anterodorsal tip meets the ethmoid plate; posterior edge meets the hyosymplectic.

Shape: sheet. Roughly triangular flat plate (thickness one chondrocyte) with a longer horizontal ventral edge. Orient in a parasagittal plane, tilted so its dorsal tip leans medially.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 80 um, height 50 um, thickness 20 um | estimate | https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/ |
| Day 5 | 120 | length 180 um, height 100 um, thickness 20 um | estimate | https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/ |
| Adult | 2160 | length 2500 um, height 1500 um, thickness 200 um | estimate; quadrate, autopalatine, ectopterygoid and entopterygoid bones replace it in the adult | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 55 hpf: distinct element by 55 hpf (https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/)
- 72 hpf: cartilage pattern of the mandibular arch complete by 72 hpf (https://pubmed.ncbi.nlm.nih.gov/9808777/)
- 240 hpf: quadrate ossification in the perichondrium (unverified timing) (https://pubmed.ncbi.nlm.nih.gov/29852585/)

Sources: https://zfin.org/ZFA:0001399; https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/; https://pubmed.ncbi.nlm.nih.gov/9808777/; https://pubmed.ncbi.nlm.nih.gov/29852585/

#### ZFA:0001400 ceratohyal cartilage

Definition (ZFA): Pharyngeal arch cartilage that is bilaterally paired and the largest cartilaginous component of the ventral hyoid arch.

ZFIN stages: ZFS:0000033 (48 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.1 to 0.2. Dorsoventral: ventral head, behind and below Meckel's cartilage, floor of the pharynx. Laterality: paired. Landmarks: left and right rods form an inverted V that points anteriorly; posterior ends meet the hyosymplectic below the ear.

Shape: tube. Straight rod, thicker at the posterior end (dumbbell from 150 hpf). Angle between left and right rods about 60 to 90 degrees in the larva (the classic ceratohyal angle metric).

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 90 um, diameter 30 um | estimate; multilayer condensation at 55 hpf | https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/ |
| Pec-fin | 60 | length 150 um, diameter 25 um | estimate | https://pubmed.ncbi.nlm.nih.gov/9808777/ |
| Day 5 | 120 | length 260 um, diameter 30 um | estimate; dumbbell shape at 150 hpf; length is an estimate | https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/ |
| Adult | 2160 | length 3500 um, diameter 400 um | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 55 hpf: condensation of chondrogenic cells in several layers by 55 hpf (https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/)
- 79 hpf: straightened rod by 79 hpf (https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/)
- 150 hpf: ceratohyal bone appears in the perichondrium at 150 hpf (https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/)
- 516 hpf: four perichondral bones almost cover the cartilage by 516 hpf (https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/)

Sources: https://zfin.org/ZFA:0001400; https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/; https://pubmed.ncbi.nlm.nih.gov/9808777/; https://zfin.org/ZFA:0000578

#### ZFA:0001422 hyosymplectic cartilage

Synonyms: hyomandibular cartilage.

Definition (ZFA): Bilaterally paired large cartilage that articulates with the chondrocranium dorsally, the opercle posteriorly, and the palatoquadrate cartilage anteriorly.

ZFIN stages: ZFS:0000033 (48 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.14 to 0.22. Dorsoventral: lateral head wall below the otic capsule, above the ceratohyal. Laterality: paired. Landmarks: dorsal end hangs from the otic region of the neurocranium; posterior edge carries the opercle joint; anteroventral symplectic process reaches the palatoquadrate.

Shape: sheet. Flat plate with a ventral rod (symplectic). Model as a vertical plate about one chondrocyte thick with a tapered ventral spur.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 50 um, height 80 um, thickness 20 um | estimate; dorsal chondrification site of the hyoid condensation | https://pubmed.ncbi.nlm.nih.gov/9808777/ |
| Day 5 | 120 | length 120 um, height 200 um, thickness 20 um | estimate | https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/ |
| Adult | 2160 | length 1500 um, height 3000 um, thickness 200 um | estimate; hyomandibula and symplectic bones | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 48 hpf: hyoid condensation splits into a dorsal hyosymplectic and a ventral ceratohyal site (https://pubmed.ncbi.nlm.nih.gov/9808777/)
- 72 hpf: opercle articulates with the hyosymplectic by a ball-and-socket joint from 3 dpf (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475)

Sources: https://zfin.org/ZFA:0001422; https://pubmed.ncbi.nlm.nih.gov/9808777/; https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475; https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/

#### ZFA:0000095 pharyngeal arch 3-7 skeleton

Synonyms: branchial arch skeleton; gill arches 1-5 skeleton.

Definition (ZFA): Skeletal and cartilaginous elements of the gill arches; the last five of the set of seven pharyngeal arches; the numbering system can be confusing; generally branchial arch #1 is the first gill arch, or the third pharyngeal arch, but some authors do not follow this convention.

ZFIN stages: ZFS:0000025 (14 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 48 hpf.

Position: apFraction 0.16 to 0.26. Dorsoventral: ventrolateral head, floor and sides of the pharynx behind the ceratohyal. Laterality: paired. Landmarks: five bilateral gill arches (ceratobranchials 1-5) stacked anteroposteriorly under the otic capsule; ceratobranchial 5 carries the teeth.

Shape: segmentArray. Array of five bent rods per side (ceratobranchials). Each is about 60 to 70 percent of the ceratohyal length in the larva. The rods converge on a midline copula. Add short dorsal epibranchials as second rods.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 60 um, diameter 15 um, count 2 | estimate; ceratobranchial 1 and 5 first (ZFIN start Long-pec) | https://zfin.org/ZFA:0001520 |
| Day 5 | 120 | length 150 um, diameter 20 um, count 5 | estimate; all five ceratobranchials cartilaginous | https://zfin.org/ZFA:0001517 |
| Adult | 2160 | length 2500 um, diameter 250 um, count 5 | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 48 hpf: ceratobranchial 1 and 5 cartilages appear (ZFIN start Long-pec) (https://zfin.org/ZFA:0001521)
- 60 hpf: ceratobranchials 2 to 4 appear (ZFIN start Pec-fin) (https://zfin.org/ZFA:0001517)
- 72 hpf: gill filament buds form on the four gill-bearing arches late in the hatching period (https://zfin.org/zf_info/zfbook/stages/hatch.html)
- 336 hpf: ceratobranchial 1 to 4 bones ossify (ZFIN start Days 14-20) (https://zfin.org/ZFA:0001237)

Sources: https://zfin.org/ZFA:0000095; https://zfin.org/ZFA:0001516; https://zfin.org/ZFA:0001521; https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal; https://zfin.org/zf_info/zfbook/stages/hatch.html

#### ZFA:0000694 ceratobranchial 5 tooth

Synonyms: pharyngeal tooth; teeth; tooth.

Definition (ZFA): Is a multi-tissue structure composed of dentine, enameloid and tooth pulp. The tips of the ceratobranchial 5 teeth form before the ceratobranchial itself (3.0 mm NL). As they grow ventrally, they meet the perichondrally ossified surface of ceratobranchial 5 and become firmly ankylosed to the bone. Ceratobranchial teeth are the only teeth present in zebrafish and other cypriniforms.

ZFIN stages: ZFS:0000033 (48 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.22 to 0.26. Dorsoventral: floor of the posterior pharynx, medial face of ceratobranchial 5. Laterality: paired. Landmarks: one ventral row of up to 5 teeth plus two dorsal rows per side in the adult; the only teeth in zebrafish.

Shape: custom. Tiny cones (10 to 20 um at 48 hpf, about 300 um in adults) pointing dorsomedially from ceratobranchial 5. Render as a cluster of cones; count grows with stage.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | height 15 um, diameter 8 um, count 2 | estimate; tooth tips form before the ceratobranchial itself (3.0 mm NL) | https://zfin.org/ZFA:0000694 |
| Day 5 | 120 | height 40 um, diameter 15 um, count 6 | estimate; 6 teeth at day 5 | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | height 300 um, diameter 100 um, count 22 | estimate; 11 tooth positions per side in three rows; count and size unverified | https://pubmed.ncbi.nlm.nih.gov/11084648/ |

Events:

- 48 hpf: tooth tips form at 3.0 mm NL, before ceratobranchial 5 ossifies (https://zfin.org/ZFA:0000694)
- 120 hpf: 6 teeth (day 5) (https://zfin.org/zf_info/zfbook/stages/index.html)
- 168 hpf: 8 teeth (days 7-13) (https://zfin.org/zf_info/zfbook/stages/index.html)
- 336 hpf: 10 teeth (days 14-20) (https://zfin.org/zf_info/zfbook/stages/index.html)
- 1080 hpf: 12 teeth (days 45-89) (https://zfin.org/zf_info/zfbook/stages/index.html)

Sources: https://zfin.org/ZFA:0000694; https://zfin.org/zf_info/zfbook/stages/index.html; https://pubmed.ncbi.nlm.nih.gov/11084648/

#### ZFA:0000191 dentary

Synonyms: dentary bone.

Definition (ZFA): Dermal bone that forms the antero-lateral part of the lower jaw. It first appears around the anterior end of Meckel's cartilage (5.1 mm NL). In the adult, the dentary meets its counterpart anteriorly at the mandibular symphysis. The dentary abuts the retroarticular posteriorly, and it surround the anguloarticular. The dentary is connected to the maxilla by the maxillo-mandibular ligament. Dentary teeth are absent in cypriniforms, but are present in other ostariophysans.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 86 hpf.

Position: apFraction 0.04 to 0.12. Dorsoventral: ventral-most bone of the head, lateral to the anterior half of Meckel's cartilage. Laterality: paired. Landmarks: meets its partner at the mandibular symphysis; forms the outer surface of the lower jaw.

Shape: sheet. Thin bony sleeve wrapped around the anterior half of Meckel's cartilage. Start as a short splint, then extend to a plate that covers the cartilage.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Day 4 | 96 | length 60 um, thickness 5 um | estimate; single Alizarin-red splint at 86 to 96 hpf | https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/ |
| Day 5 | 120 | length 100 um, thickness 5 um | estimate | https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/ |
| Adult | 2160 | length 3000 um, height 800 um, thickness 100 um | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 78 hpf: dentary osteoblasts appear along Meckel's cartilage at 78 hpf (https://www.facebase.org/resources/zebrafish/fishface/meckel/)
- 86 hpf: Alizarin red staining of the dentary at 86 hpf (https://www.facebase.org/resources/zebrafish/fishface/meckel/)
- 200 hpf: Cubbage and Mabee report the dentary first at 5.1 mm NL (cited in the ZFA definition); timing differs between rearing conditions (https://zfin.org/ZFA:0000191)

Sources: https://zfin.org/ZFA:0000191; https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/; https://www.facebase.org/resources/zebrafish/fishface/meckel/; https://pubmed.ncbi.nlm.nih.gov/29852585/

#### ZFA:0000270 maxilla

Synonyms: maxillae.

Definition (ZFA): The dermal maxilla forms part of the upper jaw. It is first visible as a small dorsoventrally oriented rod of bone in the lateral region of the upper jaw. Through anterior ossification it becomes S-shaped, with its anteriormost tip directed medially (4.8 mm NL). The posteroventral end of the maxilla is connected to the dentary by a ligament. Maxillary teeth are absent in cypriniforms, but are present in other ostariophysans. Two barbels are present on the maxilla. The presence of two pairs of maxillary barbels is considered by Cavender and Coburn (1992) to be the primitive condition for the Cyprinidae.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 200 hpf.

Position: apFraction 0.03 to 0.1. Dorsoventral: upper lip region, lateral to the mouth, below the eye. Laterality: paired. Landmarks: dorsoventral rod at the corner of the mouth; premaxilla lies anterior to its dorsal tip; maxillary barbel attaches to its posteroventral end.

Shape: tube. Thin S-shaped rod oriented dorsoventrally; the anterior tip turns medially. Pair with a small L-shaped premaxilla (ZFA:0000567) anteriorly.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 7-13 | 200 | length 80 um, diameter 10 um | estimate; first visible at 4.8 mm NL | https://zfin.org/ZFA:0000270 |
| Adult | 2160 | length 2200 um, diameter 200 um | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 200 hpf: first visible as a small dorsoventral rod at 4.8 mm NL (about 4.5 mm TL is reached at days 7-13) (https://zfin.org/ZFA:0000270)
- 260 hpf: premaxilla appears anterior to the maxilla at 5.7 mm (https://zfin.org/ZFA:0000567)
- 720 hpf: maxillary barbel bud forms at the posteroventral corner at 30 to 40 dpf (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737)

Notes: No maxilla at 24, 48 or 120 hpf; the upper jaw is the palatoquadrate at those stages.

Sources: https://zfin.org/ZFA:0000270; https://pubmed.ncbi.nlm.nih.gov/29852585/; https://zfin.org/ZFA:0000567; https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737; https://zfin.org/zf_info/zfbook/stages/index.html

#### ZFA:0000250 opercle

Synonyms: opercles.

Definition (ZFA): Dermal bone that articulates anteriorly with the hyomandibula. The opercle is paired and typically the largest bone of the opercular series.  It is derived from the neural crest and is located in 2nd pharyngeal arch.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 72 hpf.

Position: apFraction 0.18 to 0.26. Dorsoventral: lateral head wall behind the eye, covering the gill chamber. Laterality: paired. Landmarks: dorsal apex articulates with the hyosymplectic; posterior free edge marks the head-trunk boundary and the anterior limit of the cleithrum.

Shape: sheet. Fan: a rod at 3 dpf that widens into a fan by 4 to 5 dpf and a trapezoid in the adult. Keep the joint apex fixed and grow the ventral and posterior edges.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Protruding-mouth | 72 | length 40 um, width 8 um, thickness 4 um | estimate; small linear spur at 3 dpf | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475 |
| Day 5 | 120 | length 90 um, width 50 um, thickness 5 um | estimate; fan shape emerges at 4 to 5 dpf | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475 |
| Days 7-13 | 312 | length 190 um, width 130 um, thickness 8 um | estimate; edge outgrowth 10.0 um/day (ventral) and 16.5 um/day (posterior) between 7 and 13 dpf | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475 |
| Adult | 2160 | length 3500 um, width 3000 um, thickness 100 um | estimate; maxillary barbel reaches the middle of the opercle | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 72 hpf: opercle first mineralizes at 3 dpf as a linear spur (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475)
- 108 hpf: fan shape from 4 to 5 dpf (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475)
- 312 hpf: duck-like silhouette at about 13 dpf; growth 21.6 to 32.0 um/day between 13 and 19 dpf (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475)

Notes: The opercular flap (ZFA:0000555) that covers the gills also contains the subopercle, interopercle and preopercle.

Sources: https://zfin.org/ZFA:0000250; https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475; https://pubmed.ncbi.nlm.nih.gov/29852585/

#### ZFA:0000184 cleithrum

Synonyms: cleithra.

Definition (ZFA): Transversely oriented bone connecting the occipital region of the skull dorsally and pectoral girdle ventrally; appears near the end of embryogenesis.

ZFIN stages: ZFS:0000032 (42 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.24 to 0.29. Dorsoventral: spans from the dorsal occipital region down to the ventral pectoral girdle, just behind the opercle. Laterality: paired. Landmarks: posterior boundary of the head; the pectoral fin base sits on its ventral half.

Shape: tube. Curved dorsoventral splint, concave anteriorly, that thickens into a blade in the adult.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 60 um, diameter 8 um | estimate; appears near the end of embryogenesis | https://zfin.org/ZFA:0000184 |
| Day 5 | 120 | length 250 um, diameter 12 um | estimate | https://pubmed.ncbi.nlm.nih.gov/29852585/ |
| Adult | 2160 | length 5000 um, width 800 um, thickness 150 um | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 42 hpf: ZFIN start stage High-pec (https://zfin.org/ZFA:0000184)
- 72 hpf: one of the earliest dermal bones with the opercle and branchiostegal ray 3 (3.4 mm NL) (https://zfin.org/ZFA:0001280)

Notes: Direct ZFA part_of parent is the pectoral girdle ZFA:0000407, which is part of the pectoral fin skeleton.

Sources: https://zfin.org/ZFA:0000184; https://pubmed.ncbi.nlm.nih.gov/29852585/; https://zfin.org/ZFA:0000407

#### ZFA:0001189 vertebra

Synonyms: vertebrae.

Definition (ZFA): All serially repeated ossified, cartilaginous, and ligamentous elements around the notochord (Schultze and Arratia, 1988).  Adult zebrafish usually 32 vertebrae but may have as few as 30 to as many as 33 vertebrae.

ZFIN stages: ZFS:0000035 (72 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.26 to 0.92. Dorsoventral: axial midline around the notochord, ventral to the spinal cord and dorsal to the gut and swim bladder. Laterality: midline. Landmarks: vertebra 1 follows the occiput; vertebrae 1-4 form the Weberian apparatus; 5-14 bear ribs; 15-29 are caudal; the last 3-4 are fused into the caudal fin complex.

Shape: segmentArray. Array of 31 to 33 short cylinders (centra) with dorsal neural arches and, posterior to the vent, ventral hemal arches. Mineralization spreads anterior to posterior; drive centrum opacity by SL.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Day 5 | 120 | length 100 um, diameter 60 um, count 3 | estimate; centra 3 and 4 mineralize at 4.0 mm TL; 5 then 1 and 2 by 4.4 mm TL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/ |
| Days 14-20 | 400 | length 180 um, diameter 120 um, count 30 | estimate; PU2 is the last centrum to form at 6.7 mm TL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/ |
| Adult | 2160 | length 700 um, diameter 500 um, count 32 | estimate; about 22 mm of column in a 28 mm SL fish; 31-32 vertebrae per FishBase, mode 32 (30-33) per ZFA, mode 33 per Bensimon-Brito | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 72 hpf: ZFIN start stage Protruding-mouth for vertebra and centrum (https://zfin.org/ZFA:0000126)
- 120 hpf: first mineralized centra (3 and 4) at 4.0 mm TL, anterior-to-posterior (https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/)
- 132 hpf: centrum 5, then 1 and 2, at 4.4 mm TL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/)
- 220 hpf: caudal fin centra start with U1 of the compound centrum at 5.5 mm TL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/)
- 400 hpf: PU2 is the last centrum, at 6.7 mm TL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/)

Notes: Direct ZFA part_of parent is vertebral column ZFA:0001559 (ZFIN start Unknown), which is part of the postcranial axial skeleton ZFA:0000317. Regions per Bensimon-Brito 2012: 4 Weberian, 10 abdominal, 15 caudal, 3-4 caudal fin vertebrae.

Sources: https://zfin.org/ZFA:0001189; https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/; https://pubmed.ncbi.nlm.nih.gov/14579374/; https://www.fishbase.se/summary/Danio-rerio.html; https://zfin.org/ZFA:0001559

#### ZFA:0000538 rib

Synonyms: dorsal rib; pleural rib.

Definition (ZFA): Endochondral bone that is intersegmental and rod-shaped, forming in the peritoneal membrane and attached to the vertebral parapophyses. Ribs protect and support internal organs.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 600 hpf.

Position: apFraction 0.32 to 0.56. Dorsoventral: curve ventrolaterally from the parapophyses of the abdominal vertebrae around the body cavity. Laterality: paired. Landmarks: on vertebrae 5 to 14 (non-Weberian precaudal vertebrae); enclose the swim bladder and gut.

Shape: segmentArray. Ten pairs of thin curved rods, each about 40 to 60 percent of body depth, angled posteroventrally.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 21-29 | 600 | length 900 um, diameter 30 um, count 10 | estimate; onset not verified; ribs are absent from the 5 dpf larva | https://pubmed.ncbi.nlm.nih.gov/14579374/ |
| Adult | 2160 | length 3500 um, diameter 120 um, count 10 | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 600 hpf: ribs ossify after the centra during the late larval period (timing unverified; Bird and Mabee 2003 give the sequence) (https://pubmed.ncbi.nlm.nih.gov/14579374/)

Sources: https://zfin.org/ZFA:0000538; https://pubmed.ncbi.nlm.nih.gov/14579374/; https://zfin.org/ZFA:0001582

#### ZFA:0001188 Weberian apparatus

Definition (ZFA): The Weberian apparatus consists of the modified anteriormost four vertebrae and associated structures of otophysans which transduce sound or pressure waves from the tunica externa of the swim bladder to the inner ear (Alexander, 1962).

ZFIN stages: ZFS:0000039 (168 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.26 to 0.34. Dorsoventral: dorsal to the anterior chamber of the swim bladder, just behind the skull. Laterality: midline with paired ossicles. Landmarks: modified vertebrae 1 to 4 with the ossicle chain (claustrum, scaphium, intercalarium, tripus) linking swim bladder to inner ear.

Shape: custom. Four enlarged anterior centra plus a chain of three to four small paired ossicles on each side. At schematic scale, draw as a thickened anterior block of the column with a lateral bead chain.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 7-13 | 168 | length 400 um, width 200 um | estimate; ZFIN start Days 7-13; ossicles chondrify in larvae of 3 to 28 mm TL series | https://zfin.org/ZFA:0001188 |
| Adult | 2160 | length 2800 um, width 1500 um, height 1500 um | estimate | https://academic.oup.com/zoolinnean/article/140/2/241/2624252 |

Events:

- 168 hpf: ZFIN start stage Days 7-13 (https://zfin.org/ZFA:0001188)
- 200 hpf: tripus differentiates first, then intercalarium and scaphium; claustrum last (unverified order from Grande and Young 2004) (https://academic.oup.com/zoolinnean/article/140/2/241/2624252)
- 336 hpf: Weberian vertebrae 1-4 and post-Weberian supraneural ossify (ZFIN start Days 14-20 for supraneural) (https://zfin.org/ZFA:0001397)

Notes: Bird and Mabee 2003 identify the Weberian apparatus as one of two separate centers of axial ossification (the other is the caudal fin).

Sources: https://zfin.org/ZFA:0001188; https://academic.oup.com/zoolinnean/article/140/2/241/2624252; https://pubmed.ncbi.nlm.nih.gov/14579374/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/

#### ZFA:0000364 hypural

Synonyms: hyp; hypuralia; hypurals.

Definition (ZFA): Expanded and laterally flattened hemal arches and spines. They support the lepidotrichia of the caudal fin. The hypurals form ventral to the posterior tip of the dorsally-flexed notochord. In zebrafish condensation of the hypurals begins at approximately 6 dpf (4.1 mm NL, notochord length).

ZFIN stages: ZFS:0000036 (96 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.92 to 1.0. Dorsoventral: ventral to the upturned tip of the notochord (urostyle), inside the base of the caudal fin. Laterality: midline. Landmarks: fan of 5 flattened plates below the urostyle; the diastema between hypural 2 and 3 marks the cleft of the homocercal fin.

Shape: custom. Five thin fan-shaped plates radiating posteroventrally from the notochord tip; hypural 1 and 2 below the diastema, 3 to 5 above. Appear in order 1, 2, 3 (days 4 to 6), 4 and 5 (days 7-13).

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Day 5 | 120 | length 80 um, width 30 um, thickness 15 um, count 2 | estimate; hypural 1 and 2 condensations (ZFIN start Day 4 and Day 5; 4.1 mm NL) | https://zfin.org/ZFA:0000364 |
| Days 14-20 | 400 | length 400 um, width 150 um, count 5 | estimate | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Adult | 2160 | length 2500 um, width 900 um, thickness 150 um, count 5 | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 96 hpf: hypural 1 (ZFIN start Day 4); condensation of hypurals at about 6 dpf, 4.1 mm NL (https://zfin.org/ZFA:0000364)
- 120 hpf: hypural 2 (ZFIN start Day 5) (https://zfin.org/ZFA:0001561)
- 144 hpf: hypural 3 (ZFIN start Day 6) (https://zfin.org/ZFA:0001562)
- 168 hpf: hypural 4 and 5 (ZFIN start Days 7-13) (https://zfin.org/ZFA:0001563)
- 220 hpf: notochord flexion from 4.5 to 6.5 mm SL, final angle about 45 degrees (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Notes: Direct ZFA part_of parent is caudal fin skeleton ZFA:0000862 (ZFIN start Unknown), itself part of the caudal fin.

Sources: https://zfin.org/ZFA:0000364; https://zfin.org/ZFA:0000862; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/

### Muscular system

#### ZFA:0001056 myotome

Synonyms: myomeres.

Definition (ZFA): Muscle that develops from somite and gives rise to body wall muscle masses.

ZFIN stages: ZFS:0000023 (10.33 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.25 to 0.98. Dorsoventral: whole depth of the trunk and tail lateral to the notochord and spinal cord; epaxial half above and hypaxial half below the horizontal myoseptum. Laterality: paired. Landmarks: myotome 1 follows the otic vesicle; 30 to 34 segments; each is a chevron pointing anteriorly at the horizontal myoseptum.

Shape: segmentArray. Array of 30 chevron-shaped (later W-shaped) blocks per side. Segment length about 60 um at 24 to 48 hpf and about 700 um in a 28 mm SL adult. Nest a thin superficial slow layer over a deep fast core.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 59 um, width 60 um, height 150 um, count 30 | measured; 59 um per myotome derived from the lateral line primordium speed of 100 um/hour = 1.7 myotomes/hour; height and width are estimates | https://zfin.org/zf_info/zfbook/stages/phar.html |
| Long-pec | 48 | length 60 um, width 90 um, height 220 um, count 32 | estimate | https://zfin.org/zf_info/zfbook/stages/phar.html |
| Day 5 | 120 | length 80 um, width 120 um, height 300 um, count 32 | estimate; 3.9 mm larva | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | length 700 um, width 2500 um, height 6000 um, count 32 | estimate; 28 mm SL adult; one myomere per vertebra | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 10.33 hpf: first somite furrow (ZFIN start 1-4 somites) (https://zfin.org/zf_info/zfbook/stages/seg.html)
- 11.66 hpf: somites form at 3 per hour for the first six, then 2 per hour (https://zfin.org/zf_info/zfbook/stages/seg.html)
- 18 hpf: 18 somites at 18 hpf (https://zfin.org/zf_info/zfbook/stages/seg.html)
- 24 hpf: somitogenesis ends at about 24 hpf with 30 to 34 somites; tail somites are shorter (https://pubmed.ncbi.nlm.nih.gov/18265021/)
- 72 hpf: somite term ends (ZFIN end Pec-fin); the myotome persists to the adult (https://zfin.org/ZFA:0000155)

Notes: Sub-regions with their own ZFA ids: epaxial myotome region ZFA:0001084 and hypaxial myotome region ZFA:0001085 (both 11.66 to 72 hpf in ZFIN).

Sources: https://zfin.org/ZFA:0001056; https://zfin.org/zf_info/zfbook/stages/seg.html; https://zfin.org/zf_info/zfbook/stages/phar.html; https://pubmed.ncbi.nlm.nih.gov/18265021/; https://pubmed.ncbi.nlm.nih.gov/11066087/; https://pubmed.ncbi.nlm.nih.gov/8951054/

#### ZFA:0000671 horizontal myoseptum

Synonyms: horizontal septum.

Definition (ZFA): A connective tissue partition developing at the apex of the chevron-shaped myotome and separating dorsal (epaxial) and ventral (hypaxial) body wall muscle masses.

ZFIN stages: ZFS:0000028 (22 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.25 to 0.98. Dorsoventral: horizontal plane at mid-depth of the myotome, at the level of the notochord. Laterality: paired. Landmarks: the lateral line nerve and the lateral larval melanophore stripe run along it; the adult interstripe X0 forms over it.

Shape: sheet. Thin horizontal sheet (connective tissue) that splits each myotome into epaxial and hypaxial halves; render as a 5 um seam.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 1400 um, width 60 um, thickness 5 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Long-pec | 48 | length 2300 um, width 90 um, thickness 5 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 2900 um, width 120 um, thickness 5 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | length 21000 um, width 2500 um, thickness 30 um | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 22 hpf: ZFIN start stage 26+ somites (https://zfin.org/ZFA:0000671)
- 24 hpf: muscle pioneer slow cells that do not migrate mark the myoseptum position (https://pubmed.ncbi.nlm.nih.gov/8951054/)

Sources: https://zfin.org/ZFA:0000671; https://pubmed.ncbi.nlm.nih.gov/8951054/; https://pubmed.ncbi.nlm.nih.gov/11066087/

#### ZFA:0009116 slow muscle cell

Synonyms: red muscle cell; slow muscle fiber.

Definition (ZFA): A muscle cell that is small, darkly colored, with high lipid and mitochondrial content.

ZFIN stages: ZFS:0000023 (10.33 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.25 to 0.98. Dorsoventral: superficial monolayer on the lateral surface of each myotome in the embryo; a lateral wedge at the horizontal myoseptum in the adult. Laterality: paired. Landmarks: directly under the skin, over the fast core.

Shape: sheet. One-cell-thick red sheet (about 10 um) on the outer face of every myotome from 24 hpf. In the adult, replace by a triangular wedge along the horizontal myoseptum (superficial red muscle).

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | height 150 um, thickness 10 um | estimate; adaxial cells migrate radially to form a superficial layer | https://pubmed.ncbi.nlm.nih.gov/8951054/ |
| Long-pec | 48 | height 220 um, thickness 12 um | estimate | https://pubmed.ncbi.nlm.nih.gov/8951054/ |
| Day 5 | 120 | height 300 um, thickness 15 um | estimate | https://pubmed.ncbi.nlm.nih.gov/8951054/ |
| Adult | 2160 | height 1500 um, thickness 400 um | estimate; lateral red muscle wedge; dimensions unverified | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 10.33 hpf: ZFIN start stage 1-4 somites (adaxial cells) (https://zfin.org/ZFA:0009116)
- 18 hpf: adaxial cells migrate radially away from the notochord to become the superficial layer (https://pubmed.ncbi.nlm.nih.gov/8951054/)

Notes: ZFA only has a cell-level term for slow muscle; used here as a tissue layer.

Sources: https://zfin.org/ZFA:0009116; https://pubmed.ncbi.nlm.nih.gov/8951054/; https://pubmed.ncbi.nlm.nih.gov/11066087/

#### ZFA:0009117 fast muscle cell

Synonyms: fast muscle fiber; white muscle cell.

Definition (ZFA): A muscle cell that has a fast contractile response. Fast muscle fibers make up the deep portion of the myotome and are also known as white muscle cells.

ZFIN stages: ZFS:0000024 (11.66 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.25 to 0.98. Dorsoventral: deep bulk of each myotome, medial to the slow layer, from the notochord to under the slow layer. Laterality: paired. Landmarks: fills the chevron; multinucleate fibers span the whole segment.

Shape: segmentArray. The same chevron blocks as the myotome minus the 10 um outer slow sheet. Pale pink.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 59 um, width 50 um, height 140 um | estimate | https://zfin.org/zf_info/zfbook/stages/phar.html |
| Long-pec | 48 | length 60 um, width 80 um, height 210 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 80 um, width 110 um, height 290 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | length 700 um, width 2300 um, height 5800 um | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 11.66 hpf: ZFIN start stage 5-9 somites (https://zfin.org/ZFA:0009117)
- 24 hpf: lateral presomitic cells stay deep and differentiate into fast fibers (https://pubmed.ncbi.nlm.nih.gov/8951054/)

Notes: ZFA only has a cell-level term for fast muscle; used here as a tissue block.

Sources: https://zfin.org/ZFA:0009117; https://pubmed.ncbi.nlm.nih.gov/8951054/

#### ZFA:0007049 adductor mandibulae

Synonyms: dorsal adductor mandibulae.

Definition (ZFA): Is a mandibular muscle that forms along the palatoquadrates and inserts on Meckel's cartilages and functions in jaw closing.

ZFIN stages: ZFS:0000032 (42 hpf) to ZFS:0000041 (720 hpf).

Position: apFraction 0.09 to 0.15. Dorsoventral: lateral to the palatoquadrate, behind and below the eye. Laterality: paired. Landmarks: runs from the palatoquadrate/hyosymplectic to the posterior end of Meckel's cartilage; jaw closer.

Shape: tube. Short thick spindle (muscle belly) angled anteroventrally from the cheek to the jaw joint.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 60 um, diameter 20 um | estimate; myoblasts differentiate in synchrony with the cartilage condensations | https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal |
| Day 5 | 120 | length 120 um, diameter 40 um | estimate | https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal |
| Adult | 2160 | length 2500 um, diameter 1200 um | estimate; adductor mandibulae complex A1-A3 (ZFA:0000311) | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 42 hpf: ZFIN start stage High-pec (https://zfin.org/ZFA:0007049)
- 48 hpf: cartilage and muscle precursors of the arches differentiate up to 2 days before feeding at 4 dpf (https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal)
- 720 hpf: ZFIN end stage Days 21-29; replaced by the adductor mandibulae complex term ZFA:0000311 from Days 30-44 (https://zfin.org/ZFA:0000311)

Notes: Direct ZFA relation is is_a mandibular muscle (ZFA:0000236); no part_of parent. UI parent set to the splanchnocranium so jaw muscles sit with the jaw.

Sources: https://zfin.org/ZFA:0007049; https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal; https://zfin.org/ZFA:0000311

#### ZFA:0001651 sternohyoid

Synonyms: hypobranchial muscle; sternohyoideus; sternohyoids.

Definition (ZFA): Head muscle that originates on the anterior region of the cleithrum and inserts on the urohyal. The hypobranchial forms initially as left and right parts that later fuse together forming a cone shape.  The muscle is innervated by the occipitospinals and mainly composed of fast twitch muscle fibers.

ZFIN stages: ZFS:0000033 (48 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.16 to 0.27. Dorsoventral: ventral midline of the throat, between the ceratohyals and the pectoral girdle, below the pharynx and heart. Laterality: paired, fused to a midline cone. Landmarks: from the anterior face of the cleithrum forward to the urohyal (behind the ceratohyal symphysis).

Shape: tube. Cone with its base at the cleithra and apex at the urohyal; ventral surface of the head.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | length 120 um, diameter 40 um | estimate | https://zfin.org/ZFA:0001651 |
| Day 5 | 120 | length 250 um, diameter 80 um | estimate | https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal |
| Adult | 2160 | length 3500 um, diameter 1200 um | estimate | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 48 hpf: ZFIN start stage Long-pec; forms as left and right halves that fuse into a cone (https://zfin.org/ZFA:0001651)

Notes: No ZFA part_of parent (is_a mandibular muscle). Companions on the ventral throat: intermandibularis ZFA:0000369, interhyoideus ZFA:0007051, hyohyoideus ZFA:0007052 (all 48 to 60 hpf).

Sources: https://zfin.org/ZFA:0001651; https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal

#### ZFA:0000563 pectoral fin musculature

Synonyms: pectoral fin muscle.

Definition (ZFA): Musculature that is part of the pectoral fin.

ZFIN stages: ZFS:0000031 (36 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.25 to 0.3. Dorsoventral: at the fin base on the ventrolateral body wall behind the opercle; abductor on the outer face, adductor on the inner face. Laterality: paired. Landmarks: covers the endoskeletal disc / girdle at the fin base.

Shape: ellipsoid. Two flattened ellipsoids (abductor and adductor) at the base of each pectoral fin; scale with the fin base width.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-25 | 36 | length 40 um, width 30 um, thickness 15 um | estimate; ZFIN start Prim-25 | https://zfin.org/ZFA:0000563 |
| Long-pec | 48 | length 70 um, width 50 um, thickness 20 um | estimate | https://zfin.org/ZFA:0000563 |
| Day 5 | 120 | length 120 um, width 80 um, thickness 30 um | estimate | https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/ |
| Adult | 2160 | length 2500 um, width 1500 um, thickness 600 um | estimate; discrete superficial and deep muscles from 7 mm body length; mature by about 12 mm TL | https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/ |

Events:

- 36 hpf: ZFIN start stage Prim-25 (primitive adductor at 36 hpf) (https://zfin.org/ZFA:0005650)
- 1000 hpf: discrete superficial and deep fin muscles identifiable at 7 mm body length (https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/)
- 1200 hpf: mature muscle morphology established by about 12 mm total length (https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/)

Sources: https://zfin.org/ZFA:0000563; https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/; https://pubmed.ncbi.nlm.nih.gov/10349624/

### Fins

#### ZFA:0000040 median fin fold

Synonyms: median fin.

Definition (ZFA): Surface structure that will develop into one of the median fins.  Extends from dorsal surface of fish, caudal to the 8th somite, to the ventral surface ending at the caudal side of the  vent.

ZFIN stages: ZFS:0000028 (22 hpf) to ZFS:0000037 (144 hpf).

Position: apFraction 0.42 to 1.0. Dorsoventral: continuous sagittal fold: dorsal from somite 8 back around the tail tip and forward on the ventral side to the vent. Laterality: midline. Landmarks: dorsal fin fold ZFA:0000102 and ventral fin fold ZFA:0001069 are its two regions; the pre-anal part lies between vent and yolk extension.

Shape: fin. Thin translucent sheet (two epidermal layers around a mesenchyme-free space with actinotrichia) hugging the dorsal, caudal and ventral midline. Height about 5 to 8 percent of body length; taper toward somite 8 dorsally and the vent ventrally. Fade out by 144 hpf as the median fins condense.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 1100 um, height 80 um, thickness 8 um | estimate; barely present at the start of the pharyngula period; 1.9 mm embryo | https://zfin.org/zf_info/zfbook/stages/phar.html |
| Long-pec | 48 | length 1900 um, height 180 um, thickness 8 um | estimate; prominent, with actinotrichia | https://zfin.org/zf_info/zfbook/stages/phar.html |
| Day 5 | 120 | length 2500 um, height 250 um, thickness 8 um | estimate; 3.9 mm larva | https://zfin.org/zf_info/zfbook/stages/index.html |

Events:

- 19 hpf: presumptive median fin fold (ZFIN 20-25 somites) (https://zfin.org/ZFA:0005102)
- 22 hpf: ZFIN start stage 26+ somites (https://zfin.org/ZFA:0000040)
- 24 hpf: barely present at the onset of the pharyngula period; becomes prominent and forms collagenous fin rays (actinotrichia) (https://zfin.org/zf_info/zfbook/stages/phar.html)
- 144 hpf: ZFIN end stage Day 5; the fold persists as a remnant until the juvenile stage at 10.9 to 11.7 mm SL when fin fold loss is complete (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Notes: Actinotrichia (ZFA:0005435, ZFIN start Prim-5) are the unsegmented collagen rods that stiffen the fold. The fold gives rise to the dorsal, anal and caudal fins.

Sources: https://zfin.org/ZFA:0000040; https://zfin.org/zf_info/zfbook/stages/phar.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://zfin.org/ZFA:0005435

#### ZFA:0000141 pectoral fin bud

Synonyms: pectoral fin buds.

Definition (ZFA): Fin bud that develops into the pectoral fin.

ZFIN stages: ZFS:0000029 (24 hpf) to ZFS:0000033 (60 hpf).

Position: apFraction 0.26 to 0.31. Dorsoventral: lateral body wall at the yolk sac / trunk boundary, level with the horizontal myoseptum, just behind the otic vesicle and future opercle. Laterality: paired. Landmarks: over somites 2 to 4; the bud points laterally then swings posteriorly.

Shape: ellipsoid. Low dome at 24 hpf, then an elongating paddle. Proximodistal length is 35 um at 30 hpf and 72 um at 46 hpf. Anteroposterior width is 116 to 135 um. Dorsoventral height is 85 to 79 um. Cap with a thin apical fold from 36 hpf.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 25 um, width 100 um, height 80 um | estimate; bud forms at about 24 hpf; 30 hpf proximodistal length is 34.7 +/- 6 um | https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish |
| Prim-15 | 30 | length 35 um, width 116 um, height 85 um | measured; 34.7 +/- 6 um proximodistal at 30 hpf; 116 +/- 10 um anteroposterior at 32 hpf | https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish |
| High-pec | 46 | length 72 um, width 135 um, height 79 um | measured; 72.2 +/- 12 um proximodistal at 46 hpf; 135 +/- 12 um anteroposterior and 79 +/- 5 um dorsoventral at 44 hpf | https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish |
| Long-pec | 48 | length 110 um, width 135 um, height 80 um | estimate; elongated bud with a distal fold (Kimmel: Long-pec = elongated pectoral fin buds) | https://zfin.org/zf_info/zfbook/stages/index.html |

Events:

- 24 hpf: ZFIN start stage Prim-5; bud arises from lateral plate mesoderm by about 24 hpf (https://pubmed.ncbi.nlm.nih.gov/10349624/)
- 42 hpf: rudiments of pectoral fins are the staging landmark of High-pec (42 hpf) (https://zfin.org/zf_info/zfbook/stages/index.html)
- 48 hpf: elongated buds with central mesenchymal condensations that will form the girdle cartilage (https://zfin.org/zf_info/zfbook/stages/hatch.html)
- 60 hpf: ZFIN end stage Long-pec; the term pectoral fin (ZFA:0001161) continues (https://zfin.org/ZFA:0000141)

Sources: https://zfin.org/ZFA:0000141; https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish; https://pubmed.ncbi.nlm.nih.gov/10349624/; https://zfin.org/zf_info/zfbook/stages/hatch.html; https://zfin.org/zf_info/zfbook/stages/index.html

#### ZFA:0001161 pectoral fin

Synonyms: forefin; pectoral fins.

Definition (ZFA): Paired fin that is located in the thoracic region of the body.

ZFIN stages: ZFS:0000030 (30 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.26 to 0.4. Dorsoventral: ventrolateral, behind the opercle, above the yolk sac in the larva and low on the flank in the adult. Laterality: paired. Landmarks: base on the cleithrum / scapulocoracoid; the larval fin points dorsoposteriorly, the adult fin lies against the flank.

Shape: fin. Paddle: an endoskeletal disc at the base plus a fan-shaped fold that becomes a rayed blade. Larval blade length about 2 to 3 times the base width. Adult: about 10 to 12 rays, 4 proximal radials and 6 to 8 distal radials, fin length about 0.15 to 0.2 SL.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-15 | 30 | length 35 um, width 116 um | measured; ZFIN start Prim-15; bud proximodistal 34.7 um | https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish |
| Long-pec | 48 | length 110 um, width 135 um | estimate; bud 72 um at 46 hpf plus apical fold | https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish |
| Pec-fin | 60 | length 180 um, width 140 um | estimate; pectoral fin blades (Kimmel Pec-fin stage) | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 320 um, width 160 um, thickness 15 um | estimate; about 8 percent of a 3.9 mm larva | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | length 5000 um, width 2500 um, thickness 200 um | estimate; 0.18 SL in a 28 mm SL adult | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 30 hpf: ZFIN start stage Prim-15 (https://zfin.org/ZFA:0001161)
- 60 hpf: fin blade expands from the apical fold (Pec-fin, 60 hpf) (https://zfin.org/zf_info/zfbook/stages/hatch.html)
- 96 hpf: endochondral disc formed proximal to the distal membrane by about 4 dpf (https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/)
- 336 hpf: endoskeletal disc persists for about two weeks, then is remodeled into 4 proximal and 6 to 8 distal radials (https://pubmed.ncbi.nlm.nih.gov/10349624/)
- 1200 hpf: adult fin morphology and muscle organization by about 12 mm TL; fin beat frequency falls from 28 Hz (larva) to 13 Hz (33 dpf juvenile) (https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/)

Notes: Pectoral fin ray count: the ZFA lepidotrichium definition gives about two more rays than distal radials. With 6 to 8 distal radials (Grandel and Schulte-Merker 1998) this gives 8 to 10 rays. Counts of 10 to 12 are common in the literature (unverified).

Sources: https://zfin.org/ZFA:0001161; https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish; https://pubmed.ncbi.nlm.nih.gov/10349624/; https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/; https://zfin.org/zf_info/zfbook/stages/hatch.html; https://zfin.org/zf_info/zfbook/stages/index.html

#### ZFA:0001384 pelvic fin bud

Synonyms: pelvic fin buds.

Definition (ZFA): Fin bud that develops into the pelvic fin.

ZFIN stages: ZFS:0000040 (336 hpf) to ZFS:0000042 (1080 hpf).

Position: apFraction 0.48 to 0.52. Dorsoventral: ventral body wall, below the posterior lobe of the swim bladder, anterior to the vent. Laterality: paired. Landmarks: small protuberances on the belly at 7.2 to 7.5 mm SL.

Shape: ellipsoid. Two low domes (about 100 um) on the ventral midline flanks; grow into short paddles before rays form at 8.5 mm SL.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 21-29 | 504 | length 100 um, width 150 um | estimate; PB stage 7.2 to 7.5 mm SL, about 3 weeks | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Days 30-44 | 800 | length 400 um, width 250 um | estimate; before ray appearance at 8.5 to 8.7 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |

Events:

- 336 hpf: ZFIN start stage Days 14-20 (https://zfin.org/ZFA:0001384)
- 504 hpf: pelvic fin bud appearance (PB) at 7.2 to 7.5 mm SL, about 3 weeks post fertilization (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 560 hpf: basipterygium cartilages present at 7.9 mm (https://zfin.org/ZFA:0001539)
- 1080 hpf: ZFIN end stage Days 30-44; the pelvic fin term continues (https://zfin.org/ZFA:0001184)

Sources: https://zfin.org/ZFA:0001384; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://www.frontiersin.org/journals/cell-and-developmental-biology/articles/10.3389/fcell.2023.1170691/full; https://pubmed.ncbi.nlm.nih.gov/10349624/

#### ZFA:0001184 pelvic fin

Synonyms: pelvic fins.

Definition (ZFA): Paired fin located in the abdominal position of the body.

ZFIN stages: ZFS:0000042 (720 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.48 to 0.62. Dorsoventral: ventral, on the belly below the swim bladder, anterior to the vent and anal fin. Laterality: paired. Landmarks: base on the basipterygium at about 0.5 SL; tip reaches toward the vent.

Shape: fin. Small triangular paired fin about 0.12 SL long. It has about 7 rays (unverified count). Rays appear at 8.5 to 8.7 mm SL and reach full number by 10 to 12 mm SL.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 30-44 | 800 | length 700 um, width 400 um | estimate; PR stage 8.5 to 8.7 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Adult | 2160 | length 3500 um, width 1800 um, thickness 150 um | estimate; 28 mm SL adult | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 720 hpf: ZFIN start stage Days 30-44 (https://zfin.org/ZFA:0001184)
- 760 hpf: pelvic fin rays appear (PR) at 8.5 to 8.7 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 1000 hpf: maximum ray number by 10 to 12 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Notes: Pelvic girdle ZFA:0000565 (ZFIN start Days 21-29) supports the fin; pelvic radials 1 to 3 have ZFA ids ZFA:0001417, ZFA:0001415, ZFA:0001416.

Sources: https://zfin.org/ZFA:0001184; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://pubmed.ncbi.nlm.nih.gov/10349624/; https://zfin.org/ZFA:0000565

#### ZFA:0001173 dorsal fin

Definition (ZFA): Median fin that is located on the dorsal surface of the fish.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 400 hpf.

Position: apFraction 0.58 to 0.72. Dorsoventral: dorsal midline, above the vent and anal fin origin. Laterality: midline. Landmarks: single dorsal fin of about 10 rays on 8 pterygiophores (ZFA lists dorsal fin pterygiophores 1-8); origin slightly anterior to the anal fin origin.

Shape: fin. Triangular sail with a longer anterior edge; base about 0.12 SL, height about 0.12 SL in the adult. Condensation appears at 5.5 to 5.8 mm SL, rays at 6.4 to 6.6 mm SL.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 14-20 | 400 | length 500 um, height 200 um | estimate; DC condensation 5.5 to 5.8 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Days 21-29 | 520 | length 800 um, height 500 um | estimate; DR rays 6.4 to 6.6 mm SL; about 10 rays by 7.2 to 7.5 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Adult | 2160 | length 3500 um, height 3500 um, thickness 150 um | estimate; 28 mm SL adult | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 22 hpf: arises from the dorsal fin fold region (ZFA:0000102, ZFIN 22 to 144 hpf) (https://zfin.org/ZFA:0000102)
- 168 hpf: dorsal fin skeleton term starts (ZFIN Days 7-13) (https://zfin.org/ZFA:0001124)
- 400 hpf: dorsal fin condensation (DC) at 5.5 to 5.8 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 520 hpf: dorsal fin rays appear (DR) at 6.4 to 6.6 mm SL; about 10 rays maximum (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Sources: https://zfin.org/ZFA:0001173; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://zfin.org/ZFA:0001124; https://zfin.org/ZFA:0000102

#### ZFA:0001162 anal fin

Definition (ZFA): Median fin that is located posterior to the anus.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 380 hpf.

Position: apFraction 0.6 to 0.8. Dorsoventral: ventral midline, immediately posterior to the vent. Laterality: midline. Landmarks: longer base than the dorsal fin; about 15 rays (10 to 12 branched); striped in the adult.

Shape: fin. Low triangular fin with a base of about 0.2 SL and height about 0.1 SL in the adult. Condensation at 5.2 to 5.5 mm SL, rays at 6.1 to 6.4 mm SL; all rays by about 8.5 mm SL.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 14-20 | 380 | length 600 um, height 200 um | estimate; AC condensation 5.2 to 5.5 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Days 21-29 | 500 | length 1000 um, height 400 um | estimate; AR rays 6.1 to 6.4 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Adult | 2160 | length 5500 um, height 3000 um, thickness 150 um | estimate; 28 mm SL adult; branched anal rays 10-12 | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 22 hpf: arises from the ventral fin fold (ZFA:0001069, ZFIN 22 to 144 hpf) (https://zfin.org/ZFA:0001069)
- 380 hpf: anal fin condensation (AC) at 5.2 to 5.5 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 500 hpf: anal fin rays appear (AR) at 6.1 to 6.4 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 760 hpf: all rays present by about 8.5 mm SL; segment addition linear through 11 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Sources: https://zfin.org/ZFA:0001162; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://www.fishbase.se/summary/Danio-rerio.html; https://zfin.org/ZFA:0001069

#### ZFA:0001058 caudal fin

Synonyms: tail; tail fin.

Definition (ZFA): Fin that is the most posterior median fin. It is composed of a complex of three modified centra and modified neural and hemal arches and spines.

ZFIN stages: ZFS:0000029 (24 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.95 to 1.2. Dorsoventral: posterior end of the body, centered on the axis; upper lobe above and lower lobe below the notochord tip. Laterality: midline. Landmarks: the only fin present as a fold at 24 hpf; rays from 4.9 to 5.1 mm SL; homocercal forked fin with about 19 principal rays (ZFA principal rays 1-19) plus procurrent rays.

Shape: fin. Start as the rounded caudal end of the median fin fold. From 4.5 mm SL bend the notochord tip up 45 degrees. Grow a fan of about 19 to 20 rays below the tip. From 6.4 mm SL carve a middle cleft to make two equal lobes. Adult fork depth is about 0.05 SL and fin length about 0.2 SL.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | length 150 um, height 250 um, thickness 8 um | estimate; posterior part of the fin fold around the tail tip | https://zfin.org/zf_info/zfbook/stages/index.html |
| Long-pec | 48 | length 250 um, height 400 um, thickness 8 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 300 um, height 450 um, thickness 10 um | estimate; no rays yet; rays appear at 4.9 to 5.1 mm SL | https://zfin.org/zf_info/zfbook/stages/index.html |
| Days 14-20 | 400 | length 900 um, height 1200 um | estimate; about 20 rays by 6.0 mm SL; lobes emerge at 6.4 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Adult | 2160 | length 6000 um, height 7000 um, thickness 200 um | estimate; 28 mm SL adult; stripes extend onto the caudal rays | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 24 hpf: ZFIN start stage Prim-5 (as part of the fin fold) (https://zfin.org/ZFA:0001058)
- 220 hpf: notochord flexion begins at about 4.5 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 300 hpf: caudal fin rays appear (CR) at 4.9 to 5.1 mm SL, about 16 dpf (https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other)
- 400 hpf: nearly maximal ray number (about 20) by 6.0 mm SL; flexion complete by 6.5 mm SL with a 45 degree angle (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 450 hpf: dorsal and ventral lobes emerge at about 6.4 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Sources: https://zfin.org/ZFA:0001058; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other; https://www.fishbase.se/summary/Danio-rerio.html; https://zfin.org/ZFA:0000862

#### ZFA:0001554 lepidotrichium

Synonyms: fin ray; lepidotrichia.

Definition (ZFA): Dermal bone that is rod-like, formed and usually contained in a fin membrane, and jointed to or adjacent to distal radials. They are bilaterally paired.  Lepidotrichia are formed from paired hemitrichia surrounding actinotrichia. There are usually two more lepidotrichia than distal radials.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 300 hpf.

Position: apFraction 0.26 to 1.2. Dorsoventral: inside every fin membrane, radiating from the fin base. Laterality: paired hemitrichia per ray. Landmarks: caudal about 19 principal rays; anal about 15; dorsal about 10; pectoral about 10 to 12; pelvic about 7 (pectoral and pelvic counts unverified).

Shape: segmentArray. Per fin, an array of tapered segmented rods (two hemitrichia each), branching distally in the branched rays. Segment length grows linearly with SL. Ray thickness about 20 um in juveniles, 80 to 100 um in adults.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 14-20 | 400 | length 600 um, diameter 20 um, count 20 | estimate; caudal rays only | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Days 21-29 | 520 | length 900 um, diameter 25 um, count 45 | estimate; caudal plus anal plus dorsal rays | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Adult | 2160 | length 6000 um, diameter 90 um, count 70 | estimate; all fins | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 300 hpf: first caudal fin rays at 4.9 to 5.1 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 500 hpf: anal fin rays 6.1 to 6.4 mm SL; dorsal fin rays 6.4 to 6.6 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 760 hpf: pelvic fin rays 8.5 to 8.7 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 1000 hpf: ray segment addition proceeds linearly through about 11 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Notes: Per-fin terms: caudal ZFA:0001550, dorsal ZFA:0001418, anal ZFA:0001421, pectoral ZFA:0001551, pelvic ZFA:0001552. All have ZFIN start Unknown. Lepidotrichia form around actinotrichia (ZFA:0005435).

Sources: https://zfin.org/ZFA:0001554; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://www.fishbase.se/summary/Danio-rerio.html; https://zfin.org/ZFA:0001550; https://zfin.org/ZFA:0001585

### Integument and pigment

#### ZFA:0001185 periderm

Synonyms: EVL.

Definition (ZFA): The outermost epidermal layer covering the fish at embryonic stages; derived from the EVL and thought to eventually be replaced by the superficial stratum of the epidermis. Sometimes used synonymously with EVL.

ZFIN stages: ZFS:0000022 (10 hpf) to ZFS:0000028 (24 hpf).

Position: apFraction 0.0 to 1.0. Dorsoventral: outermost cell layer of the whole embryo including the yolk sac and fin fold. Laterality: midline. Landmarks: derived from the enveloping layer (EVL, ZFA:0000086, 4.66 to 10 hpf).

Shape: sheet. Single squamous layer about 2 um thick over the whole body surface. Render it as the outer skin shell of the embryo from bud stage to 24 hpf. Then hand over to the epidermis term.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Bud | 10 | length 1000 um, thickness 2 um | estimate; outer of the two epidermal layers | https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/ |
| Prim-5 | 24 | length 1900 um, thickness 2 um | measured; the two-layer epidermis is about 4 um thick at 24 hpf; the periderm is its outer layer | https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/ |

Events:

- 4.66 hpf: EVL forms as the outermost blastoderm monolayer (ZFIN start 30%-epiboly for EVL) (https://zfin.org/ZFA:0000086)
- 10 hpf: ZFIN start stage Bud for periderm (https://zfin.org/ZFA:0001185)
- 24 hpf: ZFIN end stage 26+ somites; the superficial stratum of the epidermis replaces it (https://zfin.org/ZFA:0001179)

Sources: https://zfin.org/ZFA:0001185; https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/; https://zfin.org/ZFA:0000086

#### ZFA:0000105 epidermis

Definition (ZFA): A cellular, multilayered epithelium derived from the ectoderm. Zebrafish epidermis consists only of living cells unlike terrestrial vertebrates in which dead, keratinized cells are present.

ZFIN stages: ZFS:0000029 (24 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.0 to 1.0. Dorsoventral: outer surface of the whole body and fins. Laterality: midline. Landmarks: two cell layers until about 6 mm SL; stratifies to 4 to 6 layers by 8.6 mm SL.

Shape: sheet. Body-hugging shell. Thickness is 4 um at 24 hpf. It stays two layers thick to about 25 dpf. It then grows about 4.7 um per mm SL. Adult thickness is 20 um on the head, 40 to 60 um on the dorsal trunk and 10 um on the ventral abdomen.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | thickness 4 um | measured; two cell layers, about 4 um | https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/ |
| Long-pec | 48 | thickness 5 um | estimate; still two layers | https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/ |
| Day 5 | 120 | thickness 6 um | estimate; two layers until about 20 dpf | https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/ |
| Adult | 2160 | thickness 50 um | measured; 20 um head, 40 to 60 um dorsal trunk, 10 um ventral abdomen | https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/ |

Events:

- 24 hpf: ZFIN start stage Prim-5; epidermis about 4 um, two layers (https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/)
- 600 hpf: stratification begins at 5.4 to 6 mm SL (head) and 6.7 mm SL (dorsal trunk), about 25 dpf (https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/)
- 720 hpf: four to six cell layers by 8.6 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/)

Notes: Strata with their own ZFA ids: epidermal superficial stratum ZFA:0001179 and basal stratum ZFA:0001180 (both from 10 hpf), intermediate stratum ZFA:0001181 (from Days 21-29).

Sources: https://zfin.org/ZFA:0000105; https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/

#### ZFA:0001119 dermis

Definition (ZFA): A collagenous layer of the skin subjacent to the epidermis and covering the hypodermis. It contains various types of cells (e.g. fibroblasts, pigment cells, nerve, blood vessels and scales.

ZFIN stages: ZFS:0000029 (24 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.0 to 1.0. Dorsoventral: directly under the epidermis, over the hypodermis and muscle. Laterality: midline. Landmarks: hosts the pigment cells, scales and the stratum compactum collagen layer.

Shape: sheet. Thin collagenous layer under the epidermis. Collagen fibrils (22 nm) appear in an acellular subepidermal space at 24 hpf. The stratum compactum is 2 um at 7.5 mm SL and 5 um at 9 mm SL. Adult dermis is tens of um (estimate).

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | thickness 1 um | estimate; acellular collagen layer under the epidermis | https://pubmed.ncbi.nlm.nih.gov/15272388/ |
| Long-pec | 48 | thickness 2 um | estimate | https://pubmed.ncbi.nlm.nih.gov/15272388/ |
| Day 5 | 120 | thickness 3 um | estimate; orthogonal collagen plywood forms from 5 to 7 dpf | https://pubmed.ncbi.nlm.nih.gov/15272388/ |
| Adult | 2160 | thickness 40 um | estimate; stratum compactum 5 um at 9 mm SL; adult value is an estimate | https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/ |

Events:

- 24 hpf: first collagen fibrils (22 nm) in the subepidermal space at 24 hpf; ZFIN start Prim-5 (https://pubmed.ncbi.nlm.nih.gov/15272388/)
- 120 hpf: collagen plywood of the primary dermal stroma at 5 to 7 dpf (https://pubmed.ncbi.nlm.nih.gov/15272388/)
- 480 hpf: fibroblasts invade the dermal stroma at 20 to 26 dpf (https://pubmed.ncbi.nlm.nih.gov/15272388/)
- 504 hpf: scale primordia form in the dermis (ZFIN start Days 21-29) (https://zfin.org/ZFA:0001704)

Notes: Hypodermis ZFA:0001136 (ZFIN start Days 14-20) lies under the dermis and also contains pigment cells.

Sources: https://zfin.org/ZFA:0001119; https://pubmed.ncbi.nlm.nih.gov/15272388/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/

#### ZFA:0000277 scale

Synonyms: scales.

Definition (ZFA): Dermal bone that is thin, flexible, and platelike, and that develops in overlapping skinfolds that cover the body and often the head of fish and the bases of the fins.

ZFIN stages: ZFS:0000042 (720 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.2 to 1.0. Dorsoventral: over the whole trunk and tail flank in overlapping rows; head is scaleless. Laterality: paired. Landmarks: first row on the caudal peduncle, second row on the flank above the ribs; rows added dorsally and ventrally, columns anteriorly.

Shape: custom. Array of thin overlapping discs (elasmoid scales) in a hexagonal lattice; grow the lattice from the caudal peduncle forward over about 13 days. Adult scale diameter about 0.5 to 1 mm (estimate).

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 30-44 | 800 | diameter 300 um, thickness 10 um, count 40 | estimate; two rows within one day of onset; onset about 9 mm SL | https://elifesciences.org/articles/37001 |
| Adult | 2160 | diameter 800 um, thickness 20 um, count 500 | estimate; count and diameter are estimates | https://www.fishbase.se/summary/Danio-rerio.html |

Events:

- 504 hpf: scale primordium term starts (ZFIN Days 21-29) (https://zfin.org/ZFA:0001704)
- 700 hpf: scale development begins posteriorly over the tail at about 8.1 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 720 hpf: squamation begins at about 9 mm SL; first row on the caudal peduncle, second row above the ribs; ZFIN start Days 30-44 (https://elifesciences.org/articles/37001)
- 780 hpf: squamation onset posterior (SP) 9.5 to 9.6 mm SL; through anterior (SA) 10.1 to 10.4 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 1030 hpf: full hexagonal coat after about 13 days; juvenile (J) 10.9 to 11.7 mm SL (https://elifesciences.org/articles/37001)

Notes: Stages 2R (two rows), 4R (four rows), B (beard, scales on dorsal anterior and post-mandibular skin) from Aman et al. 2018.

Sources: https://zfin.org/ZFA:0000277; https://elifesciences.org/articles/37001; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### ZFA:0009091 melanocyte

Synonyms: melanophore.

Definition (ZFA): A pigment cell derived from the neural crest. Contains melanin-filled pigment granules, which gives a brown to black appearance.

ZFIN stages: ZFS:0000029 (24 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.05 to 1.1. Dorsoventral: dermal and hypodermal pigment cells; in the embryo arranged in dorsal, lateral, ventral and yolk stripes; in the adult confined to the dark stripes. Laterality: paired. Landmarks: first cells over the head and dorsal trunk at 24 hpf; also the retinal pigment epithelium (a separate ZFA term).

Shape: custom. Point cloud of black stellate cells (about 30 to 60 um across). Render them as dark dots on the skin shell. Key density and stripe assignment to stage. Adult melanophores cover the 5 dark stripes.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-5 | 24 | diameter 30 um, count 20 | estimate; early pigmentation is the Prim-5 landmark | https://zfin.org/zf_info/zfbook/stages/index.html |
| Long-pec | 48 | diameter 50 um, count 300 | estimate; four larval stripes forming | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | diameter 60 um, count 450 | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | diameter 80 um, count 5000 | estimate; five dark stripes; counts are estimates | https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other |

Events:

- 24 hpf: ZFIN start stage Prim-5; melanophores begin to differentiate at the onset of the pharyngula period (https://zfin.org/zf_info/zfbook/stages/phar.html)
- 30 hpf: dorsal larval stripe (ZFIN Prim-15); retina pigmented (https://zfin.org/ZFA:0005221)
- 36 hpf: ventral larval stripe; tail pigmentation (Prim-25) (https://zfin.org/ZFA:0005222)
- 42 hpf: lateral larval stripe (High-pec) (https://zfin.org/ZFA:0005223)
- 72 hpf: yolk larval stripe (Protruding-mouth) (https://zfin.org/ZFA:0005224)
- 420 hpf: metamorphic melanophores appear at about 6.0 mm SL (MMA 5.9 to 6.3 mm SL) (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 800 hpf: adult stripes 1D and 1V discernible at about 9 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Notes: ZFA name is melanocyte; synonym melanophore. Larval and adult stripe terms are separate entries in this file.

Sources: https://zfin.org/ZFA:0009091; https://zfin.org/zf_info/zfbook/stages/phar.html; https://zfin.org/zf_info/zfbook/stages/index.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667786/; https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other

#### ZFA:0009198 xanthophore

Definition (ZFA): A pigment cell derived from the neural crest. Contains carotenoid pigments in structures called pterinosomes or xanthosomes. This gives an appearance ranging from a golden yellow to orange and red.

ZFIN stages: ZFS:0000032 (42 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.05 to 1.1. Dorsoventral: scattered widely over the body in the larva; in the adult confined to the light interstripes over the iridophore sheet. Laterality: paired. Landmarks: yellow cast over the dorsal head and trunk of the larva.

Shape: custom. Point cloud of yellow cells (about 40 um) on the skin shell; larval: diffuse dorsal; adult: dense in interstripes X0, X1D, X1V.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | diameter 30 um, count 100 | estimate; ZFIN start High-pec (42 hpf) | https://zfin.org/ZFA:0009198 |
| Day 5 | 120 | diameter 40 um, count 300 | estimate; scattered widely over the body | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667786/ |
| Adult | 2160 | diameter 60 um, count 4000 | estimate | https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other |

Events:

- 42 hpf: ZFIN start stage High-pec (https://zfin.org/ZFA:0009198)
- 450 hpf: metamorphic xanthophores differentiate at about 6.5 mm SSL (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667786/)
- 800 hpf: xanthophores cover the iridophore sheet of the interstripes (https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other)

Sources: https://zfin.org/ZFA:0009198; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667786/; https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other

#### ZFA:0009199 iridophore

Synonyms: iridocyte; iridosome.

Definition (ZFA): A pigment cell derived from the neural crest. The cell contains flat light-reflecting platelets, probably of guanine, in stacks called reflecting platets or iridisomes. The color-generating components produce a silver, gold, or iridescent color.

ZFIN stages: ZFS:0000032 (42 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.05 to 1.1. Dorsoventral: eye and yolk sac in the embryo; dense sheet in the interstripes and a thin layer over the dark stripes in the adult; also the belly (argentum). Laterality: paired. Landmarks: first interstripe X0 forms at the horizontal myoseptum.

Shape: custom. Silver reflective patches. Embryo: an eye ring and yolk patches. From 4.5 to 4.9 mm SL: a horizontal band along the myoseptum (X0) that widens. Adult: dense sheets in all interstripes plus a silver belly.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Long-pec | 48 | diameter 20 um, count 30 | estimate; ZFIN start High-pec; iridescent patches on the eye and yolk | https://zfin.org/ZFA:0009199 |
| Day 5 | 120 | diameter 25 um, count 80 | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Adult | 2160 | diameter 30 um, count 20000 | estimate; dense sheets; count is an estimate | https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other |

Events:

- 42 hpf: ZFIN start stage High-pec (https://zfin.org/ZFA:0009199)
- 300 hpf: metamorphic iridophores as early as 4.5 mm SSL; S-iridophores visible at CR stage (4.9 mm SL, about 16 dpf) (https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other)
- 800 hpf: dense interstripe sheet X0 complete as stripes 1D and 1V form at about 9 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Sources: https://zfin.org/ZFA:0009199; https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667786/; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### ZFA:0005221 dorsal larval melanophore stripe

Definition (ZFA): A larval melanophore stripe that forms a band extending from the head to the tail along the dorsal apex of the myotomes.

ZFIN stages: ZFS:0000030 (30 hpf) to ZFS:0000040 (504 hpf).

Position: apFraction 0.05 to 0.98. Dorsoventral: dorsal apex of the myotomes and the dorsal head, along the base of the dorsal fin fold. Laterality: paired. Landmarks: from the head to the tail tip along the dorsal midline (paired left and right rows that merge over the head).

Shape: tube. Thin band of melanophores along the named landmark. The band is one or two cells wide (about 40 to 60 um). Render it as a dark line or a strip of dots on the skin shell.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-15 | 30 | length 1800 um, width 40 um | estimate; ZFIN start Prim-15 | https://zfin.org/zf_info/zfbook/stages/index.html |
| Long-pec | 48 | length 2600 um, width 50 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 3300 um, width 60 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |

Events:

- 30 hpf: ZFIN start stage Prim-15 (https://zfin.org/ZFA:0005221)
- 504 hpf: ZFIN end stage Days 14-20; replaced by adult stripe 2D dorsally (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Sources: https://zfin.org/ZFA:0005221; https://zfin.org/zf_info/zfbook/stages/phar.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### ZFA:0005223 lateral larval melanophore stripe

Definition (ZFA): The larval melanophore stripe that is at the level of the horizontal myoseptum.

ZFIN stages: ZFS:0000032 (42 hpf) to ZFS:0000040 (504 hpf).

Position: apFraction 0.28 to 0.95. Dorsoventral: at the level of the horizontal myoseptum on the flank. Laterality: paired. Landmarks: along the horizontal myoseptum; the lateral line nerve runs with it.

Shape: tube. Thin band of melanophores along the named landmark. The band is one or two cells wide (about 40 to 60 um). Render it as a dark line or a strip of dots on the skin shell.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| High-pec | 42 | length 1500 um, width 40 um | estimate; ZFIN start High-pec | https://zfin.org/zf_info/zfbook/stages/index.html |
| Long-pec | 48 | length 1800 um, width 40 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 2500 um, width 50 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |

Events:

- 42 hpf: ZFIN start stage High-pec (https://zfin.org/ZFA:0005223)
- 504 hpf: ZFIN end stage Days 14-20; these melanophores are lost or migrate to the primary adult stripes by about 12 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Sources: https://zfin.org/ZFA:0005223; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://pubmed.ncbi.nlm.nih.gov/8951054/

#### ZFA:0005222 ventral larval melanophore stripe

Definition (ZFA): A larval melanophore stripe that forms a band, of pigmentation extending from the bases of the eyes on each side of the midline to the top of the tail, that underlies the myotomes bilaterally, still is dorsal to the yolk.

ZFIN stages: ZFS:0000031 (36 hpf) to ZFS:0000040 (504 hpf).

Position: apFraction 0.15 to 0.95. Dorsoventral: ventral edge of the myotomes, dorsal to the yolk and gut, from the eye base to the tail. Laterality: paired. Landmarks: paired band under the myotomes along the dorsal aorta level; passes over the yolk extension.

Shape: tube. Thin band of melanophores along the named landmark. The band is one or two cells wide (about 40 to 60 um). Render it as a dark line or a strip of dots on the skin shell.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Prim-25 | 36 | length 1900 um, width 40 um | estimate; ZFIN start Prim-25 (tail pigmentation landmark) | https://zfin.org/zf_info/zfbook/stages/index.html |
| Long-pec | 48 | length 2400 um, width 50 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 3000 um, width 60 um | estimate | https://zfin.org/zf_info/zfbook/stages/index.html |

Events:

- 36 hpf: ZFIN start stage Prim-25 (https://zfin.org/ZFA:0005222)
- 504 hpf: ZFIN end stage Days 14-20; replaced by adult stripe 1V then 2V ventrally (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)

Sources: https://zfin.org/ZFA:0005222; https://zfin.org/zf_info/zfbook/stages/index.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### ZFA:0005224 yolk larval melanophore stripe

Definition (ZFA): The larval melanophore stripe that forms a band over the ventral surface of the yolk sac.

ZFIN stages: ZFS:0000035 (72 hpf) to ZFS:0000040 (504 hpf).

Position: apFraction 0.12 to 0.45. Dorsoventral: ventral surface of the yolk sac and yolk extension. Laterality: paired. Landmarks: band over the ventral yolk from the heart region back to the yolk extension tip; disappears with the yolk.

Shape: tube. Thin band of melanophores along the named landmark. The band is one or two cells wide (about 40 to 60 um). Render it as a dark line or a strip of dots on the skin shell.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Protruding-mouth | 72 | length 900 um, width 60 um | estimate; ZFIN start Protruding-mouth | https://zfin.org/zf_info/zfbook/stages/index.html |
| Day 5 | 120 | length 800 um, width 60 um | estimate; yolk nearly absorbed | https://zfin.org/zf_info/zfbook/stages/index.html |

Events:

- 72 hpf: ZFIN start stage Protruding-mouth (https://zfin.org/ZFA:0005224)
- 504 hpf: ZFIN end stage Days 14-20 (https://zfin.org/ZFA:0005224)

Sources: https://zfin.org/ZFA:0005224; https://zfin.org/zf_info/zfbook/stages/index.html; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/

#### ZFA:0001463 melanophore stripe

Synonyms: melanophore stripes.

Definition (ZFA): Surface structure composed of an array of melanophores arranged in a stripe.  Stripes are oriented from rostral to caudal.

ZFIN stages: ZFS:0000000 (0 hpf) to ZFS:0000044 (17520 hpf). Visible in the model from 800 hpf.

Position: apFraction 0.25 to 1.2. Dorsoventral: flank: stripes 1D and 1V flank the interstripe X0 at the horizontal myoseptum; 2D above and 2V below; stripes continue onto the anal and caudal fins. Laterality: paired. Landmarks: X0 center sits at relative dorsoventral position 0.5 at 8 mm SL and 0.4 at 16 mm SL (unverified); five dark stripes and four light interstripes in the adult.

Shape: tube. Horizontal dark bands about 1 mm wide in a 28 mm adult. Lighter interstripes of equal width alternate with them. Order of appearance: 1D and 1V (9 mm SL), 2V (14 mm SL), 2D (16 mm SL), further stripes in large adults. Extend 1V and its neighbors onto the anal fin. Extend the central stripes onto the caudal fin.

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 30-44 | 800 | length 7000 um, width 400 um, count 2 | estimate; 1D and 1V at about 9 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Days 45-89 | 1500 | length 11000 um, width 600 um, count 3 | estimate; 2V by 14 mm SL | https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/ |
| Adult | 2160 | length 21000 um, width 1000 um, count 5 | estimate; five stripes, four interstripes; width is an estimate | https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other |

Events:

- 300 hpf: S-iridophores of the future X0 interstripe visible at CR stage (4.9 mm SL, about 16 dpf) (https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other)
- 420 hpf: metamorphic melanophores appear at about 6 mm SL over the dorsal and ventral myotomes (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 800 hpf: primary stripes 1D and 1V discernible at about 9 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 1300 hpf: first secondary stripe 2V by about 14 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 1500 hpf: second secondary stripe 2D by about 16 mm SL (https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)
- 2160 hpf: adult: five melanophore stripes with four interstripes; interstripes are iridophore sheets covered by xanthophores (https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other)

Notes: Melanophores of the larval stripes are listed separately (ZFA:0005221 to ZFA:0005224).

Sources: https://zfin.org/ZFA:0001463; https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/; https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667786/; https://www.fishbase.se/summary/Danio-rerio.html; https://elifesciences.org/articles/52998

#### ZFA:0000622 barbel

Synonyms: barble.

Definition (ZFA): Surface structure which is a tactile structure found in the branchial region. Barbels are covered with epidermis rich in taste buds, and are innervated by branches of the cranial nerves.

ZFIN stages: ZFS:0000043 (1080 hpf) to ZFS:0000044 (17520 hpf).

Position: apFraction 0.03 to 0.12. Dorsoventral: ventrolateral snout: maxillary barbel at the posteroventral corner of the maxilla (mouth corner); nasal barbel at the anterior nostril. Laterality: paired. Landmarks: maxillary barbel reaches the middle of the opercle; rostral (nasal) barbel reaches the anterior orbit margin.

Shape: tube. Tapered whisker. It is 200 to 300 um wide at the base and 50 um at the tip. It is 2 to 4 mm long in 20 to 30 mm SL fish. It trails posteriorly along the cheek. There are two pairs (maxillary and nasal).

Sizes:

| Stage | hpf | Dimensions | Status | Source |
|---|---|---|---|---|
| Days 30-44 | 900 | length 100 um, diameter 80 um | estimate; epithelial buds at 30 to 40 dpf, 10 to 12 mm SL | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737 |
| Adult | 2160 | length 3000 um, diameter 250 um | measured; 2 to 4 mm long, 200 to 300 um at the base, 50 um at the tip in 2 to 3 cm SL fish | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737 |

Events:

- 720 hpf: barbel primordium (ZFIN Days 30-44); buds emerge at 30 to 40 dpf in juveniles of 10 to 12 mm SL (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737)
- 1080 hpf: ZFIN start stage Days 45-89 for barbel (https://zfin.org/ZFA:0000622)
- 2160 hpf: barbel length correlates with standard length over a wide size range (https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737)

Notes: Sub-terms: maxillary barbel ZFA:0005408 and anterior nasal barbel ZFA:0005407 (both ZFIN start Unknown), barbel primordium ZFA:0005119 (Days 30-44 to Days 45-89).

Sources: https://zfin.org/ZFA:0000622; https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737; https://www.fishbase.se/summary/Danio-rerio.html; https://zfin.org/ZFA:0005408; https://zfin.org/ZFA:0005407

## Open questions

- Rib onset. ZFIN gives start stage Unknown. Bird and Mabee 2003 hold the sequence but I could only read the abstract. The 600 hpf value is an estimate.
- Weberian ossicle order. The tripus-first order comes from a search summary of Grande and Young 2004 and is unverified.
- Pectoral fin length at 72 and 120 hpf. Mao et al. 2012 give 34.7 um (30 hpf) and 72.2 um (46 hpf) for the bud; later lengths are estimates.
- Adult scale diameter and scale count are estimates. Aman et al. 2018 give onset (about 9 mm SL) and duration (about 13 days) only.
- Pectoral and pelvic fin ray counts are unverified. Parichy et al. 2009 give caudal about 20, anal about 15, dorsal about 10.
- Adult jaw cartilage and bone lengths are estimates scaled to a 28 mm SL fish.
- The dentary onset differs between FishFace (Alizarin red at 86 hpf) and the ZFA definition from Cubbage and Mabee 1996 (5.1 mm NL). I used 86 hpf.
- Adult slow muscle geometry (lateral red wedge) is standard teleost anatomy but I did not find a zebrafish measurement.
- ZFIN web pages refused connections during this session for the segmentation, pharyngula and larval descriptions. Several Kimmel et al. 1995 statements therefore come from the stage index table only.

## Source list

- https://zfin.org/ZFA:0001580
- https://zfin.org/ZFA:0001507
- https://zfin.org/ZFA:0001405
- https://zfin.org/ZFA:0000514
- https://pubmed.ncbi.nlm.nih.gov/29852585/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC3698193/
- https://zfin.org/ZFA:0001216
- https://journals.biologists.com/dev/article/124/15/2945/39466/Musculoskeletal-patterning-in-the-pharyngeal
- https://pubmed.ncbi.nlm.nih.gov/9808777/
- https://zfin.org/ZFA:0001205
- https://www.facebase.org/resources/zebrafish/fishface/meckel/
- https://zfin.org/ZFA:0001399
- https://zfin.org/ZFA:0001400
- https://www.facebase.org/resources/zebrafish/fishface/ceratohyal/
- https://zfin.org/ZFA:0000578
- https://zfin.org/ZFA:0001422
- https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0009475
- https://zfin.org/ZFA:0000095
- https://zfin.org/ZFA:0001516
- https://zfin.org/ZFA:0001521
- https://zfin.org/zf_info/zfbook/stages/hatch.html
- https://zfin.org/ZFA:0000694
- https://zfin.org/zf_info/zfbook/stages/index.html
- https://pubmed.ncbi.nlm.nih.gov/11084648/
- https://zfin.org/ZFA:0000191
- https://zfin.org/ZFA:0000270
- https://zfin.org/ZFA:0000567
- https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008737
- https://zfin.org/ZFA:0000250
- https://zfin.org/ZFA:0000184
- https://zfin.org/ZFA:0000407
- https://zfin.org/ZFA:0001189
- https://pmc.ncbi.nlm.nih.gov/articles/PMC3517302/
- https://pubmed.ncbi.nlm.nih.gov/14579374/
- https://www.fishbase.se/summary/Danio-rerio.html
- https://zfin.org/ZFA:0001559
- https://zfin.org/ZFA:0000538
- https://zfin.org/ZFA:0001582
- https://zfin.org/ZFA:0001188
- https://academic.oup.com/zoolinnean/article/140/2/241/2624252
- https://zfin.org/ZFA:0000364
- https://zfin.org/ZFA:0000862
- https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/
- https://zfin.org/ZFA:0001056
- https://zfin.org/zf_info/zfbook/stages/seg.html
- https://zfin.org/zf_info/zfbook/stages/phar.html
- https://pubmed.ncbi.nlm.nih.gov/18265021/
- https://pubmed.ncbi.nlm.nih.gov/11066087/
- https://pubmed.ncbi.nlm.nih.gov/8951054/
- https://zfin.org/ZFA:0000671
- https://zfin.org/ZFA:0009116
- https://zfin.org/ZFA:0009117
- https://zfin.org/ZFA:0007049
- https://zfin.org/ZFA:0000311
- https://zfin.org/ZFA:0001651
- https://zfin.org/ZFA:0000563
- https://pmc.ncbi.nlm.nih.gov/articles/PMC4097112/
- https://pubmed.ncbi.nlm.nih.gov/10349624/
- https://zfin.org/ZFA:0000040
- https://zfin.org/ZFA:0005435
- https://zfin.org/ZFA:0000141
- https://journals.biologists.com/dev/article/139/16/2916/45235/Mechanism-of-pectoral-fin-outgrowth-in-zebrafish
- https://zfin.org/ZFA:0001161
- https://zfin.org/ZFA:0001384
- https://www.frontiersin.org/journals/cell-and-developmental-biology/articles/10.3389/fcell.2023.1170691/full
- https://zfin.org/ZFA:0001184
- https://zfin.org/ZFA:0000565
- https://zfin.org/ZFA:0001173
- https://zfin.org/ZFA:0001124
- https://zfin.org/ZFA:0000102
- https://zfin.org/ZFA:0001162
- https://zfin.org/ZFA:0001069
- https://zfin.org/ZFA:0001058
- https://journals.biologists.com/dev/article/140/14/2997/45781/Iridophores-and-their-interactions-with-other
- https://zfin.org/ZFA:0001554
- https://zfin.org/ZFA:0001550
- https://zfin.org/ZFA:0001585
- https://zfin.org/ZFA:0001185
- https://pmc.ncbi.nlm.nih.gov/articles/PMC3828764/
- https://zfin.org/ZFA:0000086
- https://zfin.org/ZFA:0000105
- https://zfin.org/ZFA:0001119
- https://pubmed.ncbi.nlm.nih.gov/15272388/
- https://zfin.org/ZFA:0000277
- https://elifesciences.org/articles/37001
- https://zfin.org/ZFA:0009091
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667786/
- https://zfin.org/ZFA:0009198
- https://zfin.org/ZFA:0009199
- https://zfin.org/ZFA:0005221
- https://zfin.org/ZFA:0005223
- https://zfin.org/ZFA:0005222
- https://zfin.org/ZFA:0005224
- https://zfin.org/ZFA:0001463
- https://elifesciences.org/articles/52998
- https://zfin.org/ZFA:0000622
- https://zfin.org/ZFA:0005408
- https://zfin.org/ZFA:0005407
