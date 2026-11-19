# Attribution

This atlas is a schematic, procedural model. Its anatomy terms and stage table come from the sources below.

## Data sources

### ZFIN, The Zebrafish Information Network, University of Oregon, https://zfin.org

Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Anatomy terms, definitions, synonyms, parent relations, stage names and stage times are derived from ZFIN, the Zebrafish Information Network (https://zfin.org), and are used under the Creative Commons Attribution 4.0 licence. Files: anatomy_item.txt, anatomy_relationship.txt, anatomy_synonyms.txt, stage_ontology.txt, downloaded 2026-09-06. The atlas modifies these data: it adds model windows, positions, sizes and colours that ZFIN does not provide. The ZFIN staging-series pages reprint Kimmel et al. 1995 (Dev Dyn 203:253-310), copyright ©1995 Wiley-Liss, Inc., by a permission that Wiley-Liss granted to ZFIN. That permission is not part of the ZFIN CC BY 4.0 grant. The atlas takes stage times, lengths, angles and landmark facts from those pages and states them in its own words. It reprints no passage and no figure.

### Zebrafish Anatomy Ontology (ZFA) and Zebrafish Stage Ontology (ZFS), ZFIN

Licence: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

The Zebrafish Anatomy Ontology (ZFA) and the Zebrafish Stage Ontology (ZFS), release 2026-07-16 (zfa.obo data-version releases/2026-07-16, http://purl.obolibrary.org/obo/zfa.obo), are used under the Creative Commons Attribution 3.0 licence. The atlas reads term ids, names, definitions and stage relations from zfa.obo. It modifies these definitions on two paths. The vocabulary in src/data/vocabulary.json removes the HTML markup, then keeps the first sentence of each definition, up to 240 characters. A first sentence longer than that is cut at the last sentence end that fits, or at a word gap with an ellipsis when it carries none. The 221 record definitions in src/data/structures/*.json are longer cuts of the ZFA text, and some keep more than one sentence. Two of them are reworded: ZFA:0000031 (hypochord) and ZFA:0009288 (primordial germ cell).

ZFA and ZFS release: 2026-07-16.

## Literature

- Kimmel CB, Ballard WW, Kimmel SR, Ullmann B, Schilling TF. Stages of embryonic development of the zebrafish. Dev Dyn 1995;203:253-310. https://doi.org/10.1002/aja.1002030302 Used for: stage times, embryo lengths and head-trunk angles read through the ZFIN staging pages.
- Parichy DM, Elizondo MR, Mills MG, Gordon TN, Engeszer RE. Normal table of postembryonic zebrafish development. Dev Dyn 2009;238:2975-3015. https://doi.org/10.1002/dvdy.22113 Used for: post-embryonic milestones by standard length.
- Singleman C, Holtzman NG. Growth and maturation in the zebrafish, Danio rerio: a staging tool for teaching and research. Zebrafish 2014;11:396-406. https://doi.org/10.1089/zeb.2014.0976 Used for: juvenile and adult standard length thresholds at 45, 90 and 180 dpf.

## Notes

- This atlas is a teaching aid built from schematic, estimated geometry. It is not a validated model for quantitative research.
- The panel layout, the systems list, the isolate action and the Dissect view follow the design of human-atlas by Ashe Magalhaes (https://github.com/ashemag/human-atlas, MIT). No human-atlas code is in this atlas.
- No figure from Kimmel et al. 1995 is redistributed (D14).
- Code is MIT licensed; see LICENSE. The licences of the bundled packages are in THIRD-PARTY-NOTICES.txt.

## Planned data (not yet used)

- Lange M, Granados A, VijayKumar S, Bragantini J, Ancheta S, Kim YJ, et al. A multimodal zebrafish developmental atlas reveals the state-transition dynamics of late-vertebrate pluripotent axial progenitors. Cell 2024;187(23):6742-6759.e17. https://doi.org/10.1016/j.cell.2024.09.047 Not yet used. Zebrahub light-sheet imaging (Royer group, Chan Zuckerberg Biohub San Francisco), version of record CC BY 4.0. A future real-data layer would derive body-outline meshes for the gastrula and segmentation stages from the ZMNS001 time-lapse; no such mesh ships in this version.

## Code

The application code is MIT licensed; see LICENSE in the repository.

The atlas bundles third-party packages. Their licences and notices are in `THIRD-PARTY-NOTICES.txt`, beside this file in the built site.
