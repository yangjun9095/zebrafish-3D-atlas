# Automated check of the anatomy drafts

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Script: `03-anatomy-factcheck.py`. Inputs: five `03*.draft.json` files and the ZFIN downloads.

## Counts

| severity | check | n |
|---|---|---|
| high | apFraction | 6 |
| high | parent-path | 23 |
| medium | duplicate-id | 7 |
| medium | override-earlier | 4 |
| medium | parent-path | 4 |
| medium | sizes-checkpoint | 6 |
| low | parent | 16 |
| low | parent-path | 1 |
| low | sizes-range | 19 |
| info | events-range | 64 |
| info | parent-in-atlas | 84 |
| info | synonym | 2 |

## Findings (high, medium, low)

| severity | check | file | id | name | issue | evidence | correct value |
|---|---|---|---|---|---|---|---|
| high | apFraction | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001058 | caudal fin | apFraction outside 0..1 | [0.95, 1.2] |  |
| high | apFraction | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001463 | melanophore stripe | apFraction outside 0..1 | [0.25, 1.2] |  |
| high | apFraction | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001554 | lepidotrichium | apFraction outside 0..1 | [0.26, 1.2] |  |
| high | apFraction | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0009091 | melanocyte | apFraction outside 0..1 | [0.05, 1.1] |  |
| high | apFraction | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0009198 | xanthophore | apFraction outside 0..1 | [0.05, 1.1] |  |
| high | apFraction | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0009199 | iridophore | apFraction outside 0..1 | [0.05, 1.1] |  |
| high | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000038 | margin | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0001176 (blastoderm); direct ZFIN parents of id: is_a ZFA:0001105 (embryonic structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000060 | prechordal plate | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000092 (axis); direct ZFIN parents of id: part of ZFA:0001204 (axial mesoderm), is_a ZFA:0001477 (portion of tissue) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000091 | axial chorda mesoderm | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000092 (axis); direct ZFIN parents of id: part of ZFA:0001204 (axial mesoderm), is_a ZFA:0001116 (presumptive structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000111 | germ ring | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0001176 (blastoderm); direct ZFIN parents of id: is_a ZFA:0001105 (embryonic structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000048 | olfactory placode | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000047 (peripheral olfactory organ); direct ZFIN parents of id: part of ZFA:0001149 (olfactory system), is_a ZFA:0001309 (neurogenic placode) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000050 | optic vesicle | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000107 (eye); direct ZFIN parents of id: is_a ZFA:0001477 (portion of tissue), part of ZFA:0001678 (immature eye) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000051 | otic vesicle | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000217 (inner ear); direct ZFIN parents of id: is_a ZFA:0001105 (embryonic structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000131 | neural keel | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000012 (central nervous system); direct ZFIN parents of id: is_a ZFA:0001477 (portion of tissue) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000132 | neural plate | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000012 (central nervous system); direct ZFIN parents of id: is_a ZFA:0001477 (portion of tissue) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000133 | neural rod | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000012 (central nervous system); direct ZFIN parents of id: is_a ZFA:0001477 (portion of tissue) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000138 | otic placode | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000217 (inner ear); direct ZFIN parents of id: part of ZFA:0001138 (vestibuloauditory system), is_a ZFA:0001310 (dorsolateral placode) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0001135 | neural tube | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000012 (central nervous system); direct ZFIN parents of id: is_a ZFA:0001477 (portion of tissue) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0001202 | optic cup | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000107 (eye); direct ZFIN parents of id: is_a ZFA:0001488 (multi-tissue structure), part of ZFA:0001678 (immature eye) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0000555 | opercular flap | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0001114 (head); direct ZFIN parents of id: is_a ZFA:0000292 (surface structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0000604 | ventral aorta | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0005003 (pharyngeal vasculature); direct ZFIN parents of id: is_a ZFA:0000005 (artery) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0001053 | primitive internal carotid artery | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0001267 (cranial vasculature); direct ZFIN parents of id: is_a ZFA:0000005 (artery) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0001286 | caudal vein plexus | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0005037 (post-vent vasculature); direct ZFIN parents of id: is_a ZFA:0005932 (developmental vascular plexus) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0005335 | swim bladder bud | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0007116 (pleuroperitoneal region); direct ZFIN parents of id: is_a ZFA:0001105 (embryonic structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0005934 | subintestinal venous plexus | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0005024 (trunk vasculature); direct ZFIN parents of id: is_a ZFA:0005931 (vascular plexus) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0005967 | pseudobranch | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0001114 (head); direct ZFIN parents of id: is_a ZFA:0001488 (multi-tissue structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0001200 | corpuscles of Stannius | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000151 (pronephros); direct ZFIN parents of id: is_a ZFA:0001477 (portion of tissue) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0005737 | intestinal rod | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000112 (gut); direct ZFIN parents of id: is_a ZFA:0001488 (multi-tissue structure) | use one of the direct ZFIN parents or an ancestor of them |
| high | parent-path | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0005738 | intestinal bulb primordium | no part_of/is_a path from id to parent in anatomy_relationship.txt | parent ZFA:0000112 (gut); direct ZFIN parents of id: is_a ZFA:0001477 (portion of tissue) | use one of the direct ZFIN parents or an ancestor of them |
| medium | duplicate-id | 03a-anatomy-extraembryonic-axial.draft.json + 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0001306 |  | id appears in more than one draft | files: 03a-anatomy-extraembryonic-axial.draft.json, 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | keep one record and merge the fields |
| medium | duplicate-id | 03a-anatomy-extraembryonic-axial.draft.json + 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0000040 |  | id appears in more than one draft | files: 03a-anatomy-extraembryonic-axial.draft.json, 03e-anatomy-skeletal-muscular-fins-integument.draft.json | keep one record and merge the fields |
| medium | duplicate-id | 03a-anatomy-extraembryonic-axial.draft.json + 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0000671 |  | id appears in more than one draft | files: 03a-anatomy-extraembryonic-axial.draft.json, 03e-anatomy-skeletal-muscular-fins-integument.draft.json | keep one record and merge the fields |
| medium | duplicate-id | 03a-anatomy-extraembryonic-axial.draft.json + 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001056 |  | id appears in more than one draft | files: 03a-anatomy-extraembryonic-axial.draft.json, 03e-anatomy-skeletal-muscular-fins-integument.draft.json | keep one record and merge the fields |
| medium | duplicate-id | 03a-anatomy-extraembryonic-axial.draft.json + 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001185 |  | id appears in more than one draft | files: 03a-anatomy-extraembryonic-axial.draft.json, 03e-anatomy-skeletal-muscular-fins-integument.draft.json | keep one record and merge the fields |
| medium | duplicate-id | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json + 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0000669 |  | id appears in more than one draft | files: 03c-anatomy-cardio-hematopoietic-respiratory.draft.json, 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | keep one record and merge the fields |
| medium | duplicate-id | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json + 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0000694 |  | id appears in more than one draft | files: 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json, 03e-anatomy-skeletal-muscular-fins-integument.draft.json | keep one record and merge the fields |
| medium | override-earlier | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0000180 | caudal vein | visibleFromHpf is earlier than the ZFIN start stage | visibleFromHpf 24; ZFIN start 96.0 |  |
| medium | override-earlier | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0001285 | intersegmental vessel | visibleFromHpf is earlier than the ZFIN start stage | visibleFromHpf 22; ZFIN start 24.0 |  |
| medium | override-earlier | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0001081 | thyroid primordium | visibleFromHpf is earlier than the ZFIN start stage | visibleFromHpf 24; ZFIN start 30.0 |  |
| medium | override-earlier | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0001260 | endocrine pancreas | visibleFromHpf is earlier than the ZFIN start stage | visibleFromHpf 24; ZFIN start 48.0 |  |
| medium | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000088 | yolk syncytial layer | no part_of/is_a path to parent; path exists only through develops_from/overlaps | parent ZFA:0000084 (yolk); path ZFA:0000088 -> ZFA:0000084 | choose a part_of/is_a ancestor or label the relation developsFrom |
| medium | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000135 | notochord | no part_of/is_a path to parent; path exists only through develops_from/overlaps | parent ZFA:0001094 (whole organism); path ZFA:0000135 -> ZFA:0000091 -> ZFA:0001116 -> ZFA:0001105 -> ZFA:0001094 | choose a part_of/is_a ancestor or label the relation developsFrom |
| medium | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000255 | paraxial mesoderm | no part_of/is_a path to parent; path exists only through develops_from/overlaps | parent ZFA:0001094 (whole organism); path ZFA:0000255 -> ZFA:0000041 -> ZFA:0001377 -> ZFA:0001116 -> ZFA:0001105 -> ZFA:0001094 | choose a part_of/is_a ancestor or label the relation developsFrom |
| medium | parent-path | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0001185 | periderm | no part_of/is_a path to parent; path exists only through develops_from/overlaps | parent ZFA:0001094 (whole organism); path ZFA:0001185 -> ZFA:0000086 -> ZFA:0001105 -> ZFA:0001094 | choose a part_of/is_a ancestor or label the relation developsFrom |
| medium | sizes-checkpoint | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0001185 | periderm | structure exists at 48 hpf but has no size keyframe in the window 42.0-60.0 hpf | keyframes at hpf: [10.0, 24.0]; exists 10.0-168.0 hpf (model override; ZFIN 10.0-24.0) | add a 48 hpf keyframe |
| medium | sizes-checkpoint | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0001185 | periderm | structure exists at 120 hpf but has no size keyframe in the window 96.0-144.0 hpf | keyframes at hpf: [10.0, 24.0]; exists 10.0-168.0 hpf (model override; ZFIN 10.0-24.0) | add a 120 hpf keyframe |
| medium | sizes-checkpoint | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000138 | otic placode | structure exists at 24 hpf but has no size keyframe in the window 22.0-30.0 hpf | keyframes at hpf: [14.0, 16.0]; exists 14.0-24.0 hpf | add a 24 hpf keyframe |
| medium | sizes-checkpoint | 03b-anatomy-nervous-sensory.draft.json | ZFA:0001157 | posterior lateral line primordium | structure exists at 120 hpf but has no size keyframe in the window 96.0-144.0 hpf | keyframes at hpf: [20.0, 24.0, 36.0, 48.0]; exists 19.0-120.0 hpf | add a 120 hpf keyframe |
| medium | sizes-checkpoint | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0000115 | heart rudiment | structure exists at 24 hpf but has no size keyframe in the window 22.0-30.0 hpf | keyframes at hpf: [21.0]; exists 19.0-24.0 hpf | add a 24 hpf keyframe |
| medium | sizes-checkpoint | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0009288 | primordial germ cell | structure exists at adult but has no size keyframe in the window 2160.0-inf hpf | keyframes at hpf: [4.0, 24.0, 48.0, 120.0]; exists 4.0-17520.0 hpf | add a adult keyframe |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0000040 | median fin fold | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0000141 | pectoral fin bud | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0000671 | horizontal myoseptum | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001161 | pectoral fin | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001173 | dorsal fin | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001184 | pelvic fin | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001384 | pelvic fin bud | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001554 | lepidotrichium | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0001651 | sternohyoid | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0005221 | dorsal larval melanophore stripe | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0005222 | ventral larval melanophore stripe | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0005223 | lateral larval melanophore stripe | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0005224 | yolk larval melanophore stripe | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0007049 | adductor mandibulae | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0009116 | slow muscle cell | parent is null and parentRelation is not root | None |  |
| low | parent | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0009117 | fast muscle cell | parent is null and parentRelation is not root | None |  |
| low | parent-path | 03b-anatomy-nervous-sensory.draft.json | ZFA:0001314 | posterior lateral line ganglion | zfaPartOf entry is not a direct part_of/is_a parent in ZFIN | ZFA:0000034 (lateral line system) |  |
| low | sizes-range | 03a-anatomy-extraembryonic-axial.draft.json | ZFA:0000084 | yolk | size keyframe outside the structure's existence range | keyframe 2160.0 hpf; exists 0.0-144.0 hpf |  |
| low | sizes-range | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000035 | lens | size keyframe outside the structure's existence range | keyframe 24.0 hpf; exists 30.0-17520.0 hpf |  |
| low | sizes-range | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000048 | olfactory placode | size keyframe outside the structure's existence range | keyframe 16.0 hpf; exists 22.0-30.0 hpf |  |
| low | sizes-range | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000144 | retinal pigmented epithelium | size keyframe outside the structure's existence range | keyframe 24.0 hpf; exists 30.0-17520.0 hpf |  |
| low | sizes-range | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000152 | retina | size keyframe outside the structure's existence range | keyframe 24.0 hpf; exists 30.0-17520.0 hpf |  |
| low | sizes-range | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000217 | inner ear | size keyframe outside the structure's existence range | keyframe 24.0 hpf; exists 72.0-17520.0 hpf |  |
| low | sizes-range | 03b-anatomy-nervous-sensory.draft.json | ZFA:0000217 | inner ear | size keyframe outside the structure's existence range | keyframe 48.0 hpf; exists 72.0-17520.0 hpf |  |
| low | sizes-range | 03c-anatomy-cardio-hematopoietic-respiratory.draft.json | ZFA:0000076 | swim bladder | size keyframe outside the structure's existence range | keyframe 60.0 hpf; exists 96.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0000123 | liver | size keyframe outside the structure's existence range | keyframe 24.0 hpf; exists 30.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0000208 | gall bladder | size keyframe outside the structure's existence range | keyframe 48.0 hpf; exists 72.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0000298 | vent | size keyframe outside the structure's existence range | keyframe 24.0 hpf; exists 120.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0000298 | vent | size keyframe outside the structure's existence range | keyframe 48.0 hpf; exists 120.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0000529 | kidney | size keyframe outside the structure's existence range | keyframe 120.0 hpf; exists 288.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0000547 | mouth | size keyframe outside the structure's existence range | keyframe 48.0 hpf; exists 60.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0001200 | corpuscles of Stannius | size keyframe outside the structure's existence range | keyframe 24.0 hpf; exists 50.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0001448 | ultimobranchial body | size keyframe outside the structure's existence range | keyframe 60.0 hpf; exists 168.0-17520.0 hpf |  |
| low | sizes-range | 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json | ZFA:0001448 | ultimobranchial body | size keyframe outside the structure's existence range | keyframe 120.0 hpf; exists 168.0-17520.0 hpf |  |
| low | sizes-range | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0000622 | barbel | size keyframe outside the structure's existence range | keyframe 900.0 hpf; exists 1080.0-17520.0 hpf |  |
| low | sizes-range | 03e-anatomy-skeletal-muscular-fins-integument.draft.json | ZFA:0007049 | adductor mandibulae | size keyframe outside the structure's existence range | keyframe 2160.0 hpf; exists 42.0-720.0 hpf |  |

## Informational (150)

- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000001 (Kupffer's vesicle): event outside the existence range: 5.25 hpf: dorsal forerunner cells gather at the shield margin
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000022 (floor plate): event outside the existence range: 8.0 hpf: presumptive floor plate in the dorsal midline
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000026 (hatching gland): event outside the existence range: 10.0 hpf: polster cells lie below the basal keratinocytes
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000031 (hypochord): event outside the existence range: 8.0 hpf: presumptive hypochord
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000040 (median fin fold): event outside the existence range: 18.0 hpf: fin fold development begins at 18 hpf
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000058 (polster): event outside the existence range: 8.0 hpf: anterior axial hypoblast reaches the animal pole
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000084 (yolk): event outside the existence range: 168.0 hpf: yolk fully absorbed by about 7 dpf
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000086 (EVL): event outside the existence range: 2.25 hpf: about five irregular tiers of EVL cells (128-cell)
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000086 (EVL): event outside the existence range: 3.0 hpf: about eleven tiers (1k-cell)
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000102 (dorsal fin fold): event outside the existence range: 400.0 hpf: dorsal fin condensation at 5.5 to 5.8 mm SL
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000135 (notochord): event outside the existence range: 8.0 hpf: chordamesoderm visible
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000329 (chorion): event outside the existence range: 72.0 hpf: hatching complete in most clutches at 28.5 C
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0001069 (ventral fin fold): event outside the existence range: 320.0 hpf: caudal fin rays appear at 4.9 to 5.1 mm SL; anal fin condensation at 5.2 to 5.5 mm SL
- events-range 03a-anatomy-extraembryonic-axial.draft.json ZFA:0001117 (post-vent region): event outside the existence range: 16.0 hpf: tail bud protrudes from the yolk
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000029 (hindbrain): event outside the existence range: 6.0 hpf: Presumptive hindbrain (ZFA, shield).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000035 (lens): event outside the existence range: 11.7 hpf: Lens placode (ZFA, 5-9 somites); first visible as a thickening at about 15 hpf (Kwan et al. 2012 Development 139:359-372
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000035 (lens): event outside the existence range: 19.0 hpf: Solid lens vesicle (ZFA, 20-25 somites); round by 20 hpf (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000035 (lens): event outside the existence range: 24.0 hpf: Lens pinches off from the ectoderm as a solid cell mass (Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.n
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000042 (midbrain hindbrain boundary): event outside the existence range: 8.0 hpf: Presumptive midbrain-hindbrain boundary (ZFA, 75%-epiboly).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000048 (olfactory placode): event outside the existence range: 10.0 hpf: Olfactory field at the anterolateral neural plate edge converges anteriorly (Whitlock & Westerfield 2000 Development 127
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000050 (optic vesicle): event outside the existence range: 10.0 hpf: Optic primordium (eye field) in the anterior neural keel (ZFA, bud).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000075 (spinal cord): event outside the existence range: 6.0 hpf: Presumptive spinal cord (ZFA, shield).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000075 (spinal cord): event outside the existence range: 16.0 hpf: Rohon-Beard and trigeminal sensory axons start to cover the skin (https://zfin.org/zf_info/zfbook/stages/seg.html).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000075 (spinal cord): event outside the existence range: 17.0 hpf: Primary motoneurons differentiate, three to four per hemisegment (https://zfin.org/zf_info/zfbook/stages/seg.html).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000079 (telencephalon): event outside the existence range: 10.3 hpf: Presumptive telencephalon (ZFA, 1-4 somites).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000100 (cerebellum): event outside the existence range: 19.0 hpf: Cerebellar rudiment first recognizable (https://zfin.org/zf_info/zfbook/stages/seg_stgs.html).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000101 (diencephalon): event outside the existence range: 10.3 hpf: Presumptive diencephalon (ZFA, 1-4 somites).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000109 (forebrain): event outside the existence range: 6.0 hpf: Presumptive forebrain in the gastrula (ZFA presumptive forebrain, shield).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000128 (midbrain): event outside the existence range: 6.0 hpf: Presumptive midbrain (ZFA, shield).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000132 (neural plate): event outside the existence range: 4.0 hpf: Presumptive neural plate specified in the dorsal ectoderm (ZFA presumptive neural plate starts at sphere).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000144 (retinal pigmented epithelium): event outside the existence range: 22.0 hpf: Presumptive RPE (outer cup layer) (ZFA, 26+ somites); PE shrinks as cells move into the neural retina 14 to 24 hpf (Li, 
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000144 (retinal pigmented epithelium): event outside the existence range: 24.0 hpf: Melanin first appears in the RPE at the prim-5 stage (Kimmel; exact quote unverified).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000152 (retina): event outside the existence range: 22.0 hpf: Presumptive neural retina (inner cup layer) (ZFA, 26+ somites).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000213 (habenula): event outside the existence range: 32.0 hpf: Left-biased habenular neurogenesis begins after parapineal migration (unverified exact hour).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000243 (neuromast): event outside the existence range: 22.0 hpf: Protoneuromast forms in the trailing primordium (ZFA, 26+ somites).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000295 (trigeminal ganglion): event outside the existence range: 10.3 hpf: Trigeminal placode and trigeminal neural crest (ZFA, 1-4 somites).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0000295 (trigeminal ganglion): event outside the existence range: 16.0 hpf: Peripheral sensory axons begin to cover the skin (https://zfin.org/zf_info/zfbook/stages/seg.html).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0001064 (rhombomere): event outside the existence range: 10.0 hpf: Presumptive rhombomeres 1 to 8 (ZFA, bud).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0001157 (posterior lateral line primordium): event outside the existence range: 18.0 hpf: Primordium first visible (https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html); ZFIN start 20-25 somites (19 hp
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0001202 (optic cup): event outside the existence range: 16.0 hpf: Invagination commences from the center of the primordium (Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubme
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0001314 (posterior lateral line ganglion): event outside the existence range: 14.0 hpf: Posterior lateral line placode (ZFA, 10-13 somites).
- events-range 03b-anatomy-nervous-sensory.draft.json ZFA:0001617 (otolith): event outside the existence range: 18.0 hpf: Otolith term starts at 18 hpf (https://zfin.org/zf_info/anatomy/dict/oto/otolith.html); ZFIN start 20-25 somites.
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000009 (cardiac ventricle): event outside the existence range: 16.0 hpf: first myl7 expression in future ventricle cells (14-somite stage)
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000009 (cardiac ventricle): event outside the existence range: 19.0 hpf: vmhc expression marks ventricular precursors
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000014 (dorsal aorta): event outside the existence range: 16.0 hpf: angioblasts migrate to the midline and form the vascular cord (ZFA:0005077, 14-19 somites)
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000014 (dorsal aorta): event outside the existence range: 20.0 hpf: the lateral dorsal aortae join into one vessel on each side around 20 hpf
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000033 (intermediate cell mass of mesoderm): event outside the existence range: 11.5 hpf: ICM ultrastructure described from the 5-somite stage (about 11.5 hpf)
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000076 (swim bladder): event outside the existence range: 36.0 hpf: budding phase 36-48 hpf
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000186 (common cardinal vein): event outside the existence range: 17.0 hpf: venous angioblast population specified about 17 hpf
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000471 (atrium): event outside the existence range: 19.0 hpf: amhc expression marks atrial precursors
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0001315 (atrioventricular canal): event outside the existence range: 36.0 hpf: endocardial cells of the future AV canal become cuboidal
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005025 (dorsal longitudinal anastomotic vessel): event outside the existence range: 30.0 hpf: longitudinal anastomoses of intersegmental sprouts begin
- events-range 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005335 (swim bladder bud): event outside the existence range: 24.0 hpf: presumptive swim bladder in the gut endoderm (ZFA:0005336, 24-36 hpf)
- events-range 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000123 (liver): event outside the existence range: 28.0 hpf: budding begins under somite 1
- events-range 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000151 (pronephros): event outside the existence range: 10.3 hpf: pronephric mesoderm (intermediate mesoderm) present at 1-4 somites
- events-range 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001081 (thyroid primordium): event outside the existence range: 20.0 hpf: pax2a expression starts in the foregut endoderm
- events-range 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001345 (interrenal gland): event outside the existence range: 48.0 hpf: assembly starts at about 2 dpf; cells migrate from the right of the dorsal aorta toward the midline
- events-range 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001370 (posterior pancreatic bud): event outside the existence range: 14.0 hpf: pancreas primordium term starts in ZFIN (10-13 somites)
- events-range 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0009288 (primordial germ cell): event outside the existence range: 3.0 hpf: PGCs specified at mid-blastula
- events-range 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000040 (median fin fold): event outside the existence range: 19.0 hpf: presumptive median fin fold (ZFIN 20-25 somites)
- events-range 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000277 (scale): event outside the existence range: 504.0 hpf: scale primordium term starts (ZFIN Days 21-29)
- events-range 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000277 (scale): event outside the existence range: 700.0 hpf: scale development begins posteriorly over the tail at about 8.1 mm SL
- events-range 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000622 (barbel): event outside the existence range: 720.0 hpf: barbel primordium (ZFIN Days 30-44); buds emerge at 30 to 40 dpf in juveniles of 10 to 12 mm SL
- events-range 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001185 (periderm): event outside the existence range: 4.66 hpf: EVL forms as the outermost blastoderm monolayer (ZFIN start 30%-epiboly for EVL)
- parent-in-atlas 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000022 (floor plate): parent id is not itself a record in any draft: ZFA:0000012 (central nervous system)
- parent-in-atlas 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000031 (hypochord): parent id is not itself a record in any draft: ZFA:0000017 (endoderm)
- parent-in-atlas 03a-anatomy-extraembryonic-axial.draft.json ZFA:0001056 (myotome): parent id is not itself a record in any draft: ZFA:0000473 (trunk musculature)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000008 (brain): parent id is not itself a record in any draft: ZFA:0000012 (central nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000034 (lateral line system): parent id is not itself a record in any draft: ZFA:0000142 (peripheral nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000047 (peripheral olfactory organ): parent id is not itself a record in any draft: ZFA:0001149 (olfactory system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000075 (spinal cord): parent id is not itself a record in any draft: ZFA:0000012 (central nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000107 (eye): parent id is not itself a record in any draft: ZFA:0001127 (visual system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000131 (neural keel): parent id is not itself a record in any draft: ZFA:0000012 (central nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000132 (neural plate): parent id is not itself a record in any draft: ZFA:0000012 (central nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000133 (neural rod): parent id is not itself a record in any draft: ZFA:0000012 (central nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000217 (inner ear): parent id is not itself a record in any draft: ZFA:0001138 (vestibuloauditory system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000295 (trigeminal ganglion): parent id is not itself a record in any draft: ZFA:0000142 (peripheral nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0000588 (statoacoustic (VIII) ganglion): parent id is not itself a record in any draft: ZFA:0000142 (peripheral nervous system)
- parent-in-atlas 03b-anatomy-nervous-sensory.draft.json ZFA:0001135 (neural tube): parent id is not itself a record in any draft: ZFA:0000012 (central nervous system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000011 (caudal artery): parent id is not itself a record in any draft: ZFA:0005037 (post-vent vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000014 (dorsal aorta): parent id is not itself a record in any draft: ZFA:0005024 (trunk vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000028 (heart primordium): parent id is not itself a record in any draft: ZFA:0000010 (cardiovascular system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000033 (intermediate cell mass of mesoderm): parent id is not itself a record in any draft: ZFA:0005023 (hematopoietic system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000054 (pericardium): parent id is not itself a record in any draft: ZFA:0007115 (pericardial region)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000076 (swim bladder): parent id is not itself a record in any draft: ZFA:0007116 (pleuroperitoneal region)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000114 (heart): parent id is not itself a record in any draft: ZFA:0000010 (cardiovascular system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000115 (heart rudiment): parent id is not itself a record in any draft: ZFA:0000010 (cardiovascular system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000149 (primitive heart tube): parent id is not itself a record in any draft: ZFA:0000010 (cardiovascular system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000180 (caudal vein): parent id is not itself a record in any draft: ZFA:0005037 (post-vent vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000186 (common cardinal vein): parent id is not itself a record in any draft: ZFA:0000096 (cardinal system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000354 (gill): parent id is not itself a record in any draft: ZFA:0000272 (respiratory system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000360 (heart tube): parent id is not itself a record in any draft: ZFA:0000010 (cardiovascular system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000423 (anterior cardinal vein): parent id is not itself a record in any draft: ZFA:0000096 (cardinal system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000436 (spleen): parent id is not itself a record in any draft: ZFA:0005023 (hematopoietic system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000477 (posterior cardinal vein): parent id is not itself a record in any draft: ZFA:0005024 (trunk vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0000604 (ventral aorta): parent id is not itself a record in any draft: ZFA:0005003 (pharyngeal vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0001077 (thymus primordium): parent id is not itself a record in any draft: ZFA:0001159 (immune system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0001078 (thymus): parent id is not itself a record in any draft: ZFA:0001159 (immune system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0001285 (intersegmental vessel): parent id is not itself a record in any draft: ZFA:0005024 (trunk vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0001286 (caudal vein plexus): parent id is not itself a record in any draft: ZFA:0005037 (post-vent vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005004 (aortic arch): parent id is not itself a record in any draft: ZFA:0005003 (pharyngeal vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005025 (dorsal longitudinal anastomotic vessel): parent id is not itself a record in any draft: ZFA:0005024 (trunk vasculature)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005335 (swim bladder bud): parent id is not itself a record in any draft: ZFA:0007116 (pleuroperitoneal region)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005898 (caudal hematopoietic tissue): parent id is not itself a record in any draft: ZFA:0005023 (hematopoietic system)
- parent-in-atlas 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005934 (subintestinal venous plexus): parent id is not itself a record in any draft: ZFA:0005024 (trunk vasculature)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000056 (pharynx): parent id is not itself a record in any draft: ZFA:0000339 (digestive system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000112 (gut): parent id is not itself a record in any draft: ZFA:0000339 (digestive system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000123 (liver): parent id is not itself a record in any draft: ZFA:0000036 (liver and biliary system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000124 (liver primordium): parent id is not itself a record in any draft: ZFA:0000036 (liver and biliary system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000140 (pancreas): parent id is not itself a record in any draft: ZFA:0001371 (pancreatic system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000151 (pronephros): parent id is not itself a record in any draft: ZFA:0000163 (renal system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000208 (gall bladder): parent id is not itself a record in any draft: ZFA:0000036 (liver and biliary system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000413 (gonad): parent id is not itself a record in any draft: ZFA:0000632 (reproductive system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000529 (kidney): parent id is not itself a record in any draft: ZFA:0000163 (renal system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000546 (mesonephric duct): parent id is not itself a record in any draft: ZFA:0000163 (renal system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0000547 (mouth): parent id is not itself a record in any draft: ZFA:0000339 (digestive system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001072 (thyroid follicle): parent id is not itself a record in any draft: ZFA:0001158 (endocrine system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001081 (thyroid primordium): parent id is not itself a record in any draft: ZFA:0001158 (endocrine system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001118 (urogenital papilla): parent id is not itself a record in any draft: ZFA:0000632 (reproductive system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001262 (gonad primordium): parent id is not itself a record in any draft: ZFA:0000632 (reproductive system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001369 (anterior pancreatic bud): parent id is not itself a record in any draft: ZFA:0001371 (pancreatic system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001370 (posterior pancreatic bud): parent id is not itself a record in any draft: ZFA:0001371 (pancreatic system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0001448 (ultimobranchial body): parent id is not itself a record in any draft: ZFA:0001158 (endocrine system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0005272 (immature gonad): parent id is not itself a record in any draft: ZFA:0000632 (reproductive system)
- parent-in-atlas 03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json ZFA:0009288 (primordial germ cell): parent id is not itself a record in any draft: ZFA:0000632 (reproductive system)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000105 (epidermis): parent id is not itself a record in any draft: ZFA:0000368 (integument)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000184 (cleithrum): parent id is not itself a record in any draft: ZFA:0000407 (pectoral girdle)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000191 (dentary): parent id is not itself a record in any draft: ZFA:0000863 (dermatocranium)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000270 (maxilla): parent id is not itself a record in any draft: ZFA:0000863 (dermatocranium)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000277 (scale): parent id is not itself a record in any draft: ZFA:0001183 (dermal superficial region)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000364 (hypural): parent id is not itself a record in any draft: ZFA:0000862 (caudal fin skeleton)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000538 (rib): parent id is not itself a record in any draft: ZFA:0001582 (non-Weberian precaudal vertebra)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0000622 (barbel): parent id is not itself a record in any draft: ZFA:0000368 (integument)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001056 (myotome): parent id is not itself a record in any draft: ZFA:0000473 (trunk musculature)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001119 (dermis): parent id is not itself a record in any draft: ZFA:0000368 (integument)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001185 (periderm): parent id is not itself a record in any draft: ZFA:0000016 (ectoderm)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001188 (Weberian apparatus): parent id is not itself a record in any draft: ZFA:0001559 (vertebral column)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001189 (vertebra): parent id is not itself a record in any draft: ZFA:0001559 (vertebral column)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001205 (Meckel's cartilage): parent id is not itself a record in any draft: ZFA:0001273 (ventral mandibular arch)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001216 (splanchnocranium): parent id is not itself a record in any draft: ZFA:0000737 (cranium)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001399 (palatoquadrate cartilage): parent id is not itself a record in any draft: ZFA:0001272 (palatoquadrate arch)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001400 (ceratohyal cartilage): parent id is not itself a record in any draft: ZFA:0001402 (ventral hyoid arch)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001422 (hyosymplectic cartilage): parent id is not itself a record in any draft: ZFA:0001401 (dorsal hyoid arch)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001463 (melanophore stripe): parent id is not itself a record in any draft: ZFA:0000368 (integument)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0001580 (neurocranium): parent id is not itself a record in any draft: ZFA:0000737 (cranium)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0009091 (melanocyte): parent id is not itself a record in any draft: ZFA:0000368 (integument)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0009198 (xanthophore): parent id is not itself a record in any draft: ZFA:0000368 (integument)
- parent-in-atlas 03e-anatomy-skeletal-muscular-fins-integument.draft.json ZFA:0009199 (iridophore): parent id is not itself a record in any draft: ZFA:0000368 (integument)
- synonym 03a-anatomy-extraembryonic-axial.draft.json ZFA:0000001 (Kupffer's vesicle): synonyms not in anatomy_synonyms.txt: KV
- synonym 03c-anatomy-cardio-hematopoietic-respiratory.draft.json ZFA:0005898 (caudal hematopoietic tissue): synonyms not in anatomy_synonyms.txt: posterior blood island
