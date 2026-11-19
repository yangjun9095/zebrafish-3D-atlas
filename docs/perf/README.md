# Performance

Spec 2.9 owns the budget. Spec 6.5 owns the procedure. This file says how to run the
procedure, what the numbers were on 2026-09-07, and which of them still miss their budget.

Three things are measured: the bytes the browser downloads before the first frame, the time
the rebuild driver spends per frame, and the geometry the viewer holds in memory.

## The perf hook

The rebuild driver publishes `window.__atlasPerf` in every build (QP-40). It costs two writes
to a `Float64Array` per frame, so it stays on in production.

| Call | Returns |
|---|---|
| `frames()` | frame-to-frame times in ms, oldest first, at most 600 |
| `drains()` | ms each frame spent serving the rebuild queue, oldest first, at most 600 |
| `rebuilds()` | wall ms of each completed rebuild, from the frame that filled the queue to the frame that emptied it |
| `stats()` | `queue`, `oldestAge`, `served`, `drainMs`, `rebuildMs`, `budgetMs`, `renderMs`, `retired`, `calls`, `triangles`, `frameNo`, `ready` |
| `reset()` | empties the frame, drain and rebuild rings; keeps the render window that sets the slice |

`?perf=1` adds `performance.measure('atlas:rebuild')` per rebuild. It is off by default,
because a scrub would otherwise fill the User Timing buffer.

`src/main.tsx` marks `atlas:boot` before the data parse and `atlas:data-parsed` after it. The
driver marks `atlas:first-frame` when the first frame with final tessellation is about to
paint. Time to first frame is `atlas:first-frame` minus the page `timeOrigin`.

## Procedure A: bundle size

```
node node_modules/vite/bin/vite.js build --outDir /tmp/atlas-dist --emptyOutDir
```

Read the gzip column. A chunk that `dist/index.html` lists in a `modulepreload` link is part
of the first download; every other chunk arrives when a sheet opens.

`--outDir` keeps this build out of the repository's `dist/`, so a running `npm run preview` and
the committed screenshots are untouched.

### 2026-09-07, vite 8.2.2, rolldown 1.2.7, after integration

**The first download is 443.91 kB gzip by vite's own column and 428.85 kB at `gzip -9`, against
the 600 kB budget of spec 2.9.** The `atlas-data` and `vocabulary` chunks are both lazy: neither
carries a `modulepreload` link, so neither reaches a viewer before the first frame.
`VITE_SINGLE_FILE=1` folds every chunk into one 3.25 MB file, 773.68 kB gzip; a single-file build
never code-splits, so the split budget does not apply to it.

The build writes nineteen JavaScript chunks plus the entry HTML and the stylesheet. Thirteen of
those twenty-one files make up the first download:

| Chunk | gzip | When |
|---|---|---|
| `three` | 189.79 kB | first download |
| `react` | 59.61 kB | first download |
| `index` (app code) | 56.42 kB | first download |
| `r3f` (fiber, drei, three-stdlib) | 51.77 kB | first download |
| `zod` | 25.08 kB | first download |
| `Sheet` (shared core and state) | 17.16 kB | first download |
| `buildStructure` | 15.22 kB | first download |
| `index.css` (styles) | 11.89 kB | first download |
| `vendor` | 9.23 kB | first download |
| `spine` | 4.60 kB | first download |
| `palette` | 1.80 kB | first download |
| `index.html` | 0.92 kB | first download |
| `rolldown-runtime` | 0.42 kB | first download |
| `atlas-data` (the six record files) | 179.16 kB | after the first paint, from `bootstrap.ts` |
| `vocabulary` (the full ZFA vocabulary, D17) | 139.82 kB | first search keystroke or a link that names a term |
| `exportPng` | 7.51 kB | first export, share sheet or kit thumbnail |
| `KitSheet` | 5.58 kB | first idle callback |
| `data` (the lazy data entry) | 4.15 kB | with `atlas-data` |
| `ExportDialog` | 2.14 kB | first export or share sheet |
| `Settings` | 2.13 kB | first settings sheet |
| `ShortcutSheet` | 0.88 kB | first shortcut sheet |

**The regression this file reported earlier today is fixed.** `src/ui/infoCard/vocabularyStore.ts`
held a static `import { loadVocabulary } from '../../data/index.ts'`. `InfoCard.tsx` imports that
file at its top and `App.tsx` imports `InfoCard.tsx` at its top, so `data/index.ts` and the six
atlas JSON files it imports with `with { type: 'json' }` sat in the synchronous module graph, and
the first download measured 625.94 kB. `requestVocabulary()` now uses
`import('../../data/index.ts')`, the pattern `bootstrap.ts` already uses, and the 179.16 kB
`atlas-data` chunk is lazy again. `useToast` is no longer a chunk of its own in this build.

`atlas-data` moves with every record added and `vocabulary` moves with every ZFIN snapshot, so
re-measure both rather than quoting these rows.

### The budget

Spec 2.9 sets the budget for the first download at **600 kB gzip**. The tree is 156 kB under it.

`zod` (25.08 kB) ships in the first download by design. `bootstrap.ts` parses the URL against the
`UrlState` schema before any anatomy record exists, so the schema module and the JSON travel in
different chunks for a module-boundary reason, not a load-order choice. Dropping zod from the
runtime path would make the AR-07 and AR-66 error path dead code; that trade is still the owner's
call, not an integration change.

## Procedure B: the automated run

```
PERF=1 npx playwright test tests/e2e/perf.spec.ts
```

The spec drives three times: 48 hpf (a segmenting embryo), 120 hpf (a larva) and 4320 hpf (the
adult). At each it makes five single time steps from a settled view and one 24-step scrub, then
reads the rings. It asserts the drain, which is the CPU work the rebuild driver owns.

Without `PERF=1` only the hook, the mark and the memory tests run. CI never runs the timing
tests, because a shared node gives numbers nobody can act on (QP-42).

### 2026-09-07, shared compute node, no GPU

Chrome through SwiftShader (`--use-angle=swiftshader`), 1600 by 900, device pixel ratio 1,
169 mounted structures. SwiftShader rasterises on the CPU, so the frame column is a property of
this node and not of the app. Read the drain column, which is CPU work either way.

| Measure | 48 hpf | 120 hpf | 4320 hpf | Budget in the spec |
|---|---|---|---|---|
| one time change, drain CPU | 30.6 to 65.5 ms | 63.6 to 75.9 ms | 0 ms | 7 to 10 ms on the benchmark core |
| one time change, frames to a consistent view | 1 | 1 | 0 | 5 (QP-18) |
| scrub, drain per frame, median | 56.9 ms | 63.8 ms | 76.6 ms | the slice, 120 ms here |
| scrub, drain per frame, longest | 72.1 ms | 68.3 ms | 95.1 ms | the slice plus one job |
| scrub, frame time, median | 650 ms | 730 ms | 804 ms | 16.7 ms on a GPU |
| jobs waiting when the scrub ended | 0 | 0 | 0 | 0 |
| draw calls | 128 | 151 | 149 | 200 |
| triangles | 718,408 | 830,968 | 832,696 | 170,000, limit 200,000 |

The adult reads 0 ms for a small time step because most adult structures are local-frame
(AR-72): a step writes a placement and reuses the vertex buffer.

**The triangle count misses its budget by four times.** Frame time follows it on every machine,
so this is the largest remaining lever. It belongs to `src/core/primitives/tessellation.ts` and to
the records, not to the rebuild driver. The adaptive interactive ladder of AR-73 is not wired yet:
the interactive and final counts measured the same at all three times.

### What the rebuild work changed

| Measure | Before | After |
|---|---|---|
| time to `data-atlas-ready`, 48 / 120 / 4320 hpf | 6.3 / 7.1 / 8.0 s | 5.1 / 5.2 / 5.0 s |
| one time change at 48 hpf | 3.2 to 5.0 s over 8 to 12 frames | 0.05 to 0.46 s over 1 frame |
| one time change at 120 hpf | 3.6 to 5.7 s over 9 to 11 frames | 0.32 to 0.35 s over 1 frame |
| jobs waiting after a 24-step scrub | 59 to 87, oldest 6 to 8 frames | 0, oldest 0 frames |
| geometry freed on a move from 24 to 4320 hpf | none | 29 structures |

Four changes produced that:

1. A rebuild request raises a flag and the driver walks the handles once per frame. Mounting
   the structures called `scheduleRebuild` once per handle, and each call ran `hasMeshAt` over
   every handle mounted so far: about 23,000 presence evaluations before the first frame.
2. The visual pass runs when a field it reads changed. It used to run on any store write, so an
   orbit drag paid for a pass over every handle per pointer move.
3. The 8 ms slice of AR-13 grows to half the measured render time, up to 120 ms, once a frame
   costs more than 16.7 ms. `sliceBudget` in `src/core/rebuildQueue.ts` holds the rule. On a
   machine that renders inside the target the slice stays at 8 ms.
4. A structure that draws nothing at t gives its buffers back once time settles.

## Procedure C: the manual run on a real machine (QP-41)

Run this on the presenter's laptop, on a laptop with integrated graphics, and on one phone.

1. `npm run build`, then `npm run preview`.
2. Open `/?t=24` and the Chrome Performance panel.
3. Throttle the network to 10 Mbit/s and reload. Read `atlas:first-frame` from the User Timing
   track for the time to first frame.
4. Record a 10 s scrub from 0 to 4320 hpf. Read p95 frame time from the frames track.
5. Record a 60 s playback at 1x. Read p95 frame time again.
6. In the console, read `__atlasPerf.stats()` and the median of `__atlasPerf.drains()`.
7. Write the values, the machine name, the GPU, the Chrome version and the date to
   `docs/perf/<date>-<machine>.md`.

The gate of AR-63 is p95 frame time under 20 ms over the 10 s scrub on the reference laptop.
