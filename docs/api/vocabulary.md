# ZFA vocabulary

D17 asks the search index to cover every ZFA term of the ZFIN snapshot, not only the modeled
records. A term the atlas does not draw opens the info card and highlights the nearest modeled
ancestor. This page describes the generated file, the API over it and the UI that uses it.

## Build

```
node scripts/build-vocabulary.ts [--zfin data/zfin] [--data src/data/structures]
                                 [--out src/data/vocabulary.json] [--check]
```

Inputs, all read with `fs`:

| File | Used for |
|---|---|
| `data/zfin/anatomy_item.txt` | the term list, the ZFIN label, the start and end stage |
| `data/zfin/stage_ontology.txt` | the hpf of each stage |
| `data/zfin/anatomy_synonyms.txt` | the synonyms |
| `data/zfin/anatomy_relationship.txt` | `part of`, `is_a` and `develops from` parents |
| `data/zfin/zfa.obo` | the definition and the `is_obsolete` flag |
| `src/data/structures/*.json` | the modeled records and their alias chains |

The script writes one term per line and prints the term count, the stand-in count, the cell count
and the raw size. `--check` writes nothing and exits 1 when the file on disk differs, which is the
same invariant `tests/unit/vocabulary.test.ts` asserts.

Run the script again whenever a structure record is added, removed or renamed: the stand-in of a
term follows the records.

## File shape

`src/data/vocabulary.json` uses one-letter keys and ids without the `ZFA:` prefix, so the lazy
chunk stays inside the 900 kB budget of D17. The 2026-07-16 release holds 3113 terms in 751 kB
(140 kB gzip).

```json
{"i":"0000046","n":"retinal neural layer","y":["neuroretina","neural retina"],
 "d":"Portion of retina composed of all the neural tissues in the retina.",
 "a":30,"b":17520,"p":["0000152"],"s":["0001488"],"m":"0000152","c":["0000152"]}
```

| Key | Field | Note |
|---|---|---|
| `i` | id | seven digits; the API returns `ZFA:0000046` |
| `n` | name | the ZFIN label |
| `y` | synonyms | absent when the term has none |
| `d` | definition | first sentence of the ZFA definition, at most 240 characters |
| `a` | startHpf | start stage of `anatomy_item.txt`, in hpf; absent or null when ZFIN states none |
| `b` | endHpf | end stage in hpf; 17520 is the end of the adult stage, past the 4320 hpf axis; absent or null when ZFIN states none |

ZFIN gives 1602 of the 3113 anatomy items the placeholder "Unknown" stage
(`ZDB-STAGE-050211-1`, `ZFS:0000000`), whose numeric range runs 0.00 to 17520.00. That range is
not a window, so the builder leaves `a` or `b` out rather than writing 0 or 17520, `expandTerm`
maps the missing key to `null`, and the card and the search row say "ZFIN states no stage window"
instead of "Zygote:1-cell (0 hpf) to Adult".
| `p` | partOf | `part of` parents |
| `s` | isA | `is_a` parents |
| `m` | standIn | the nearest modeled record; absent when nothing models the term |
| `c` | standInPath | the chain from the term to the stand-in, nearest first |
| `k` | kind | `1` for a cell term; absent for a structure |

## Stand-in resolution

1. A term that is itself a record stands in for itself.
2. A term named in a record's `aliasChain` resolves to that record (the heart and eye chains of D9).
3. Otherwise the script walks up the relation graph, breadth first, in three stages: `part_of`
   only, then `part_of` with `is_a`, then all three relations. The first stage that reaches a
   record wins, so "modelled as part of" names a containing structure whenever one exists.
4. A group node (`geometry: null`) counts as a match, but a record that draws geometry inside two
   further levels wins over it, because only a drawn record can carry the selection outline.

A term with no match keeps `standIn` absent and the UI shows the "no model" badge.

## API

`src/core/vocabulary.ts` is pure TypeScript over the parsed file.

```ts
import { loadVocabulary } from '../data/index.ts'          // lazy chunk
import { badgeText, standInOf } from '../core/vocabulary.ts'

const vocab = await loadVocabulary()
const term = vocab.byId.get('ZFA:0000046')!
const stand = standInOf(vocab, term, (id) => data.structuresById.has(id))
// stand: { state: 'partOf', recordId: 'ZFA:0000152', pathNames: ['retina'] }
badgeText(stand, vocab)                                    // "part of retina"
```

- `buildVocabulary(file)` expands the short keys and indexes the terms by id.
- `standInOf(vocab, term, isRecord)` returns `state` `'modeled' | 'partOf' | 'none'`, the record to
  highlight, and the path names read outermost first.
- `badgeText(stand, vocab)` gives the search-row badge.
- `src/core/vocabularySchema.ts` parses the file with zod and expands one term.

`loadVocabulary()` in `src/data/index.ts` imports the JSON dynamically, so the file gets its own
`vocabulary` chunk (the group in `vite.config.ts`) and never joins `atlas-data`. The promise is
cached. Nothing on the path to the first frame calls it.

## UI

- `src/ui/infoCard/vocabularyStore.ts` holds the chunk and its loading state. The search field
  asks for it on the first keystroke; a link that names a term asks for it at start-up. A visit
  that never searches never downloads it.
- `src/ui/searchIndex.ts` builds a second index over the terms the atlas does not draw, so a query
  never lists the same structure twice. Rows come out records first, terms after them, each with a
  badge: `modeled`, `part of <stand-in>`, or `no model`.
- `src/ui/infoCard/TermCard.tsx` is the card's term state: name, id, badge, kind, the stand-in
  chain, the ZFIN stage window, the definition, "Jump to first appearance" of the stand-in, a copy
  link and the ZFIN link.
- `src/state/slices/selection.ts` adds `selectedTerm` and `selectTerm(termId, standIn)`. The store
  puts the stand-in in `selection`, so the selection outline, the labels and every other reader of
  `selection` work with no change.

## URL

The term travels in its own query key, `term` (AR-45):

```
/?t=48&sel=0000152&term=0000046
```

`sel` carries the stand-in record and `term` carries the vocabulary term. `toUrl` writes `term`
from `selectedTerm` and `applyUrl` reads it back, so `urlSync.ts` keeps the key in the address bar
like every other parameter. "Copy link" on a term card produces this form.

`parseUrl` checks only the shape of `term`, because the vocabulary that defines the id is a lazy
chunk and no record list can answer for it. `applyUrl` puts the id in `selectedTerm`; the info
card then fetches the chunk, resolves the term and its stand-in, and raises the "not in this
atlas" toast when the vocabulary does not hold the id.

A `sel` value that names a term is also accepted: `?sel=0000046` selects the term once the
vocabulary lands. The store's `applyUrl` drops that id first, because it is not a record, and
raises one "not in this atlas" toast on the way, so a hand-written link of that shape shows a
toast the app's own links never do.
