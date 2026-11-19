# ZFIN source files

Downloaded on 2026-09-06 from https://zfin.org/downloads and http://purl.obolibrary.org/obo/zfa.obo.

| File | Content |
|---|---|
| `stage_ontology.txt` | ZDB stage id, ZFS id, stage name, start hpf, end hpf at 28.5 C |
| `anatomy_item.txt` | ZFA id, name, start stage (ZDB id), end stage (ZDB id) |
| `anatomy_relationship.txt` | parent ZFA id, child ZFA id, relation type (`is_a`, `part of`, `develops from`, ...) |
| `anatomy_synonyms.txt` | ZFA id, name, synonym |
| `zfa.obo` | Zebrafish Anatomy Ontology with definitions and stage relations |

The four ZFIN download files are CC BY 4.0. `zfa.obo` carries CC BY 3.0 in its own OBO header
(line 21, `property_value: terms:license https://creativecommons.org/licenses/by/3.0/`). Cite:
Bradford YM et al. (2022) Zebrafish information network, the knowledgebase for Danio rerio
research. Genetics 220(4):iyac016. See `public/ATTRIBUTION.md`.

The validation script in `scripts/validate-data.ts` reads these files. Do not edit them by hand.
