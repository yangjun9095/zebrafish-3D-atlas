# 11. Zebrahub cell-type crosswalk to the Zebrafish Anatomy Ontology

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-07. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Date: 2026-09-07. Maps the Zebrahub single-cell RNA-seq label vocabulary (Lange et al. 2024,
Cell) to Zebrafish Anatomy Ontology (ZFA) ids, then checks each id against
`src/data/structures/*.json`. The scripts and the intermediate files stayed in a local scratch
directory outside the repository.

**Status: the table is kept.** Its source is Table S1 of Lange et al., Cell
2024;187(23):6742-6759.e17, `10.1016/j.cell.2024.09.047`, the annotation ontology tracker. The
version of record is CC BY 4.0 (Crossref licence record). Yang-Joon Kim, the repository owner and
a coauthor of the paper, confirmed on 2026-09-08 that the table is public.

**What ships.** `docs/research/zebrahub-crosswalk.draft.json`, 203 rows, one per cluster label.
Each row carries the label, the stage names it appears at, the Cell Ontology, UBERON and ZFA ids
where the authors supplied them, and the ZFA mapping and stand-in derived here. No marker gene
and no cell count is in that file, and nothing from it reaches the app. Attribute the labels and
the source ids to Lange et al. 2024 under CC BY 4.0.

**What was not done.** The rows here have not been compared, line by line or otherwise, with the
published Table S1. The copy this note read is the bioRxiv supplementary file of the same table
(preprint `10.1101/2023.03.06.531398`, file `media-14.xlsx`), because the paper is not in PMC and
the publisher blocked this node. Section 7, items 1 and 2, hold the questions that follow from
that, and section 8 holds two questions about individual rows.

Section 4 stays removed: it was a checklist that repeated label strings from the table, and
`docs/research/zebrahub-crosswalk.draft.json` now carries that data directly. The section numbers
do not move, because records in `src/data/structures/` cite section 5 by number.

`docs/research/08-zebrahub-imaging-data.md` was named as the source for the single-cell section
and licence, but that file covers imaging only and has no single-cell section. The single-cell
material is in `docs/research/04-imaging-resources.md`, section 2.2 (line 60) and master-table
row 2 (line 15). This report uses that file instead.

## 1. Sources

**The dataset.** Figshare article 20510367, "Zebrahub single cell dataset", project 146247
(`https://api.figshare.com/v2/articles/20510367`). Licence CC BY 4.0, read from the API's
`license` field. Twelve files: one h5ad zip per stage plus one full-atlas zip
(`zf_atlas_full_v1_release.h5ad.zip`, 1.59 GB), 3.2 GB total. Description states 120,671 cells
across at least 4 embryo replicates per stage, plus a data-use policy requiring redistribution
to carry the full policy text and barring whole-atlas publication ahead of the Biohub's own. No
h5ad file was downloaded; the API's JSON gave file list, sizes, and description without one.

**The label vocabulary.** The CZ CELLxGENE Discover API
(`https://api.cellxgene.cziscience.com/curation/v1/collections`, 388 collections) has no
collection for DOI `10.1016/j.cell.2024.09.047` or for Royer or Lange as author. Zebrahub is
not on CELLxGENE. A name search did surface "Developmental Zebrafish Reference Atlas"
(`4ea9a90e-1dad-4c67-b1e3-8488ab7dc269`), a different, later Trapnell-lab dataset (Duran, Barkan
et al., bioRxiv 10.1101/2025.04.03.646654, CC BY-NC, 18-96 hpf, 317 cell type calls, 31
tissues); it is not used here beyond this note.

The Cell 2024 paper is not in PMC: Europe PMC lists PMID 39454574 with `isOpenAccess: N` and no
PMCID, and an NCBI PMC search for the DOI returns zero results. A direct fetch of
`https://www.cell.com/cell/fulltext/S0092-8674(24)01079-5` returns HTTP 403. Its own
supplementary tables were unreachable from this node.

The label vocabulary instead comes from the bioRxiv preprint of the same work,
`10.1101/2023.03.06.531398` (v2, 2023-06-14). Its supplementary-material page lists
"Supplementary Table 1. Annotation ontology tracker"
(`https://www.biorxiv.org/content/biorxiv/early/2023/06/14/2023.03.06.531398/DC14/embed/media-14.xlsx`,
87 KB): one row per Leiden cluster per stage, with a human-readable label, marker genes, and,
where the authors supplied one, a Cell Ontology (CL) id, an UBERON id, and a ZFA id and name.
998 rows, 203 non-blank unique labels, across 10 stages in the source's own naming:
`0 budstage`, `05somite`, `10somite`, `15somite`, `20somite`, `30somite`, `2dpf`, `3dpf`, `5dpf`,
`10dpf`. That is one fewer stage than the figshare file list's seven hpf points plus four dpf
points; the mismatch is unresolved and no hpf value is guessed for any preprint stage name.

**Licence.** The bioRxiv API reports both versions of `10.1101/2023.03.06.531398` as
`"license": "cc_by_nc_nd"`
(`https://api.biorxiv.org/details/biorxiv/10.1101/2023.03.06.531398`). That is the licence on the
exact file this crosswalk is built from. That differs from the two Zebrahub licences already on
record: the published Cell paper is CC BY 4.0 (Crossref and Europe PMC, per `08` section 3.2),
and the figshare h5ad deposit is CC BY 4.0. Only the preprint supplementary file is
CC BY-NC-ND. See section 7, item 1.

## 2. Method

The record counts in this section and the next describe `src/data/structures/` as it stood on
2026-09-07, when it held 215 records. The tree holds 221 records today. Section 3 states what
that difference changes.

1. Parsed `data/zfin/anatomy_item.txt` (3,113 ids), `anatomy_synonyms.txt` (1,947 ids with a
   synonym), `anatomy_relationship.txt` (5,992 edges). Confirmed against `data/zfin/zfa.obo`
   that a relationship row `(A, B, relation)` means "B relation A": column 1 is the container,
   column 2 the part, for both `part of` and `is_a`.
2. Loaded all 215 records across the 16 files in `src/data/structures/`, tagging each with its
   `system` and whether it came from `groups.json`.
3. For each of the 203 labels, took the paper's own `zfa_id` where given (198 of 203). Compared
   the label text to the ZFA canonical name (`exact`), a synonym (`synonym`), or neither
   (`curated`: the paper's id is right, the cluster name is worded differently). Five labels
   carry no `zfa_id`; all five are the paper's own QC markers (`unassigned`,
   `to_delete_to_few_cells`, `unclear3`, two doublet calls), not biological labels.
4. Checked every resolved id against the 215 modeled records. Where absent, walked the `part
   of`/`is_a` closure upward (breadth-first, 15-hop cap) to the nearest modeled id as a
   stand-in.
5. Where the closure only reached the generic `ZFA:0001094` "whole organism", substituted a
   hand-picked stand-in for 11 well-justified cases (for example epidermal cell to the modeled
   epidermis record), marked `confidence: medium` with the reasoning in the row's note. Nine
   labels still land on "whole organism" with no better candidate (section 5, item 6). One
   label, head mesenchyme, has no modeled ancestor at any distance.
6. Validated the JSON with `python3 -c "import json; json.load(open(...))"`.

Cell counts are not available from this source: the tracker gives Leiden cluster ids and marker
genes per row, not per-cluster counts, and the figshare API gives only one count for the whole
collection (120,671 cells), not per label. Getting per-label counts would require opening the
h5ad files, out of scope here.

## 3. Coverage

| Metric | Count | of |
|---|---|---|
| Unique labels in the tracker | 203 | - |
| QC labels, no anatomical meaning | 5 | 203 |
| Real biological labels | 198 | 203 |
| Matched exactly to the ZFA name | 127 | 198 |
| Matched to a ZFA synonym | 6 | 198 |
| Matched by curation (id right, wording differs) | 65 | 198 |
| Already modeled in `src/data/structures/` | 65 | 198 |
| Modeled as a `groups.json` group node | 19 | 65 |
| Not modeled, specific stand-in found | 123 | 133 not modeled |
| Not modeled, only generic "whole organism" stand-in | 9 | 133 not modeled |
| Not modeled, no stand-in at all (head mesenchyme) | 1 | 133 not modeled |
| Row carries a Cell Ontology id from the source | 62 | 198 |
| Row carries an UBERON id from the source | 60 | 198 |

Every one of the 198 biological labels resolved to a ZFA id; the paper had already done this for
193 of them, and only 5 needed a synonym or curated match applied here. "No anatomical home"
applies only to the 5 QC labels. Modeled coverage is separate: one in three labels (65) point
straight at a record the atlas already carries; the rest resolve one or more `part of`/`is_a`
hops up, expected since the scRNA-seq atlas resolves 203 Leiden clusters against 215 coarser
atlas regions. Per-stage label counts run from 14 at 0-bud stage to 60 at 10 dpf.

**These counts are dated.** Sections 2 and 3 describe `src/data/structures/` as it stood on
2026-09-07, when it held 215 records in 16 files. The tree has grown since. Re-checking the 203
rows against the records on 2026-09-09 finds 70 whose ZFA id is a record, against the 65 counted
here. Neither this note nor `zebrahub-crosswalk.draft.json` has been rebuilt for that difference.

## 4. Checklist: structures named in the task

Removed. The checklist repeated label strings that `docs/research/zebrahub-crosswalk.draft.json`
now carries directly. Read the JSON instead. This heading stays so that the section numbers below
do not move.

## 5. Absent structures worth adding

Ranked by stage breadth, restricted to labels the atlas does not yet model:

1. **Neural crest** (ZFA:0000045), 6 of 10 stages, a checklist item. Stand-in is neural plate; a
   dedicated record would separate neural crest migration from the plate it buds from.
2. **Epidermal cell** (ZFA:0009183), 5 stages under three spellings. Not a true gap: the
   modeled `ZFA:0000105` epidermis record already covers this, only under a tissue-level id
   rather than the cell-type id the paper used.
3. **Head mesenchyme** (ZFA:0000113), 4 stages, no stand-in at any distance. Its `is_a` chain
   (mesenchyme, then "portion of tissue") never reaches a body region. Model it directly, or
   have a curator pick a region; skeletal system and splanchnocranium are both modeled
   candidates since head mesenchyme feeds craniofacial cartilage and connective tissue.
4. **Pigment cell family** (ZFA:0009090 pigment cell, plus one curated pigment-cell row), 3
   stages, generic-only stand-in. `integument_pigment` models melanocyte and xanthophore
   individually but has no group node above them; adding one would give these clusters a home.
5. **Midbrain-hindbrain boundary** (ZFA:0000042), 3 stages, a checklist item. Stand-in is brain;
   a well-defined organizer region and a reasonable next nervous-system record.
6. **Mesoderm family** (ZFA:0000041, ZFA:0001065, ZFA:0000121, ZFA:0005040), 3 stages each,
   generic-only stand-in. All four give rise to blood, heart, and kidney in different
   proportions, so no single downstream system is a correct stand-in; left open rather than
   forced.
7. **Cranial ganglion** (ZFA:0000013), 3 stages. Stand-in is peripheral nervous system; several
   named ganglia are already modeled individually, so a generic record may be unneeded if the
   goal is to name each ganglion.
8. **Vasculature / blood** (ZFA:0005249, ZFA:0009044), 3 stages each. Stand-ins are
   cardiovascular system and hematopoietic system, both modeled group nodes; coarse-to-fine gap
   rather than a missing home.

## 6. The full crosswalk

The table is `docs/research/zebrahub-crosswalk.draft.json`: 203 rows, one per label, with the
fields listed under "What ships" at the top of this note. Section 2 states how each row was
built and section 3 counts them. The rows are not repeated here in prose.

## 7. Open questions

1. **Which licence covers the shipped crosswalk?** The rows ship in
   `docs/research/zebrahub-crosswalk.draft.json` and are attributed to Table S1 of the Cell
   version of record, which Crossref records as CC BY 4.0. The copy they were extracted from is
   the bioRxiv supplementary file of the same table, and the bioRxiv API reports that preprint as
   CC BY-NC-ND (section 1, "Licence"). The open question is whether to rebuild the file from the
   published Table S1, so that the copy and the licence come from one document. Ask the
   Lange/Royer group, the same ask `08` already makes for the imaging licence.
2. **Does the published Table S1 match the preprint's?** Not compared. The paper is not in PMC
   and the publisher blocked this node, so no row in this note or in the JSON has been checked
   against the published table. The 11-versus-10-stage mismatch (section 1) may resolve once the
   published table is available.
3. **Head mesenchyme has no home in ZFA's own graph.** Confirm with a curator whether it should
   become its own record or split across existing regions.
4. **The mesoderm-family labels** resolve only to "whole organism". A curator with a fate map
   for 0-bud through 15-somite stages could split these by region; not attempted here.
5. **No pigment cell group node exists.** Melanocyte and xanthophore are modeled individually;
   adding a parent node, and whether to add iridophore, is a product decision.
6. **Two rows to ask the authors about.** Section 8 states both as questions. They concern the
   copy of the table this note read, which nobody has compared with the published Table S1, so
   neither is a statement about the published paper. Yang-Joon Kim is a coauthor and will put
   both to the Royer/Lange group alongside the licence question in item 1.

## 8. Two questions for the authors

Both questions are about the copy of the table this note read, the bioRxiv supplementary file of
Table S1. Nobody has compared that copy with the published Table S1, and a difference between the
two would answer either question on its own. Neither item is a finding about the published paper.
Yang-Joon Kim, a coauthor, will put both to the Royer/Lange group.

1. **The `Endodermal cells` row at the 0-bud stage.** The tracker assigns it ZFA:0009137,
   ectodermal cell, the same id as the `Ectoderm` row above it, while the cluster's own marker
   genes (`sox17`, `foxa2`, `sox32`) are endoderm markers. Is ZFA:0009137 the intended id for that
   cluster? The crosswalk keeps the id the table gives in the row's `zfaId`, marks the row
   `confidence: low`, and its note names ZFA:0000017, endoderm, as the reading the marker genes
   support.
2. **The `oligodendrocyte` rows at 5 and 10 dpf.** Their Cell Ontology id is CL:0000128, and
   other rows in the same table give the term for CL:0000128 as oligodendrocyte, but the term text
   on these rows reads "epidermal cell". The ZFA id also changes across the two stages
   (ZFA:0009076 oligodendrocyte and ZFA:0009183 epidermal cell). Which annotation is the intended
   one? The crosswalk uses ZFA:0009076, oligodendrocyte, which agrees with the cluster label.
