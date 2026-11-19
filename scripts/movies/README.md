# Movies

One movie of the fish growing from 0 to 48 hpf with one tissue lit in one reporter. The movie is
the app itself, driven frame by frame: the reporter preview of D18 paints the tissue, the faint
fish stays as context, and the camera follows the growth without the refit jump the live viewer
has.

| Need | Command |
|---|---|
| one movie | `npm run movie -- --target ZFA:0000135 --slug notochord --reporter egfp` |
| every movie of the tissue list | `node scripts/movies/render-all.ts --parallel 4` |
| the same on one compute node | `sbatch scripts/movies/render.sbatch` |
| the same as one array task per tissue | `sbatch scripts/movies/render-array.sbatch` |
| the wild-type movie, no reporter | `sbatch scripts/movies/render-wildtype.sbatch` |
| the plan without rendering | `node scripts/movies/render-all.ts --dry-run` |
| a check of every finished movie | `scripts/movies/check-movies.sh` |
| the candidates of a stage range | `node scripts/movies/selection/candidates.ts --from 0 --to 48 --out FILE` |
| one frame per candidate | `node scripts/movies/selection/capture.ts --candidates FILE --out DIR` |
| the lit area of every frame | `python3 scripts/movies/selection/measure.py DIR` |
| contact sheets of those frames | `python3 scripts/movies/selection/sheets.py DIR` |
| the ranking of the candidates | `python3 scripts/movies/selection/rank.py DIR --pool a,b --k 8` |
| the distance between two reporter colours | `node scripts/movies/palette-distance.ts` |
| the contact sheet of the colour series | `node scripts/movies/contact-sheet.ts --out DIR` |
| the README of the movies folder | `node scripts/movies/write-readme.ts --out DIR` |

Movies are written to `/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas-movies/`,
outside the repository. The file name is `<slug>_<REPORTER>.mp4`, for example `notochord_EGFP.mp4`.

## The workflow, end to end

Ten steps from "which tissues" to a checked and documented set of movies. Steps 1 to 5 measure the
candidates, step 6 is the one step a person does, and steps 7 to 10 render and publish. Write the
frames and the build outside the repository, and give the ports and the directories to yourself
alone (`CLAUDE.md`).

```sh
# 1. every record whose window meets the stage range
node scripts/movies/selection/candidates.ts --from 0 --to 48 --out /tmp/sel/candidates.json

# 2. one frame per candidate per hour, through the reporter preview
node scripts/movies/selection/capture.ts --candidates /tmp/sel/candidates.json \
     --out /tmp/sel/shots --port 4971 --dist /tmp/sel/dist

# 3. the lit area of every frame, the overlaps and the masks
python3 scripts/movies/selection/measure.py /tmp/sel/shots

# 4. contact sheets, six panels a sheet. Read every frame.
python3 scripts/movies/selection/sheets.py /tmp/sel/shots

# 5. the ranking: territory, then the k most separable tissues
python3 scripts/movies/selection/rank.py /tmp/sel/shots --pool notochord,myotome,eye --k 8

# 6. write scripts/movies/tissues.json by hand, from the ranking and the sheets

# 7. render, one array task per tissue, then the wild-type pair on the login node
sbatch scripts/movies/render-array.sbatch
bash scripts/movies/render-wildtype.sbatch

# 8. probe every finished movie and write SHA256SUMS
scripts/movies/check-movies.sh

# 9. one frame of each colour movie, tiled and labelled
node scripts/movies/contact-sheet.ts --out /path/to/movies

# 10. the README of the movies folder
node scripts/movies/write-readme.ts --out /path/to/movies --date 2026-09-14
```

Step 6 is a person's step and stays one. The measurements say which tissues share a territory and
which read as one shape; they cannot tell a tail outline from a lobed head mass. Read the sheets,
then write the list: the slug, the label, the ZFA id, the `includeParts` flag, the window, the
system, one sentence of `why`, and `distinctRank` from the ranking of step 5.
`docs/research/12-movie-tissue-selection.md` records what the frames of 2026-09-14 showed and why
57 of the 77 candidates of that run did not reach the list.

The three python scripts need numpy, scipy and Pillow. The login node carries all three (numpy
1.19, scipy 1.5 and Pillow 8.4 under python 3.6), so run them there and install nothing.

### `selection/candidates.ts`

Reads every JSON file of `src/data/structures/`, the records and the group nodes of `groups.json`,
and writes one row per entry whose `visibleFromHpf` to `modelEndHpf` window meets `--from` to
`--to`: the slug, the ZFA id, the record id, the name, the system, the kind (`record` or `group`),
the `includeParts` flag and the window. `--system` keeps the systems it names. A row is a
proposal, not a decision.

`includeParts` is true when another record names this row as its `uiParent`, the field
`fluorescenceTargets` walks, and always true for a group, which draws nothing itself and lights
its parts. Four of the twenty tissues of 2026-09-14 are groups: the brain, the lateral line
system, the pigment cells and the trunk vasculature.

```sh
node scripts/movies/selection/candidates.ts --from 0 --to 48 --out /tmp/sel/candidates.json
```

### `selection/capture.ts`

Opens the page once per hour, writes one EGFP rule per candidate through
`window.__atlasDebug.state().setFluorescence`, and screenshots at 1600 by 900. Without `--base` it
builds the app into `--dist` and serves it itself, never the repository's `dist/`. Each candidate
is shot at up to three hours of the grid inside its own window, 24 and 48 preferred, and a
candidate that lights no handle at its first hour is shot again near its onset (`--recheck`, or
`--recheck none`). It writes the frames and `capture.json`.

```sh
node scripts/movies/selection/capture.ts --candidates /tmp/sel/candidates.json \
     --out /tmp/sel/shots --only notochord,heart --hours 24,48 --port 4971 --dist /tmp/sel/dist
```

### `selection/measure.py`

Reads `capture.json`, measures two green masks over the top 800 rows of every frame and writes
`measured.json` and `masks.npz`. A pixel is strongly lit when its green channel is above 50 and
exceeds the larger of its red and blue by more than 25; the faint count needs a green excess above
8 alone. It prints the area, the box, the fill and the centroid of every frame, then the pairs
that share a territory at 0.30 overlap or above.

```sh
python3 scripts/movies/selection/measure.py /tmp/sel/shots
```

### `selection/sheets.py`

Six panels a sheet from `measured.json`, each cropped to the region the embryo occupies and
labelled with the slug, the hour, the lit area and the box. `--only` takes a slug or a `slug@hour`.
The sheets go to `<shots>/sheets/`.

```sh
python3 scripts/movies/selection/sheets.py /tmp/sel/shots --only notochord,heart@24
```

### `selection/rank.py`

Two stages over the masks. Stage one prints the peak area of every tissue of `--pool` and its
highest overlap against another one at a shared hour, low overlap first. Stage two describes every
mask at the reference hour by five numbers, the area, the fill, the aspect, the pieces and the
perimeter over the area, takes the form distance of two tissues as the distance between those
numbers, and takes the separability of a pair as the form distance times one minus the overlap. It
searches every subset of `--k` and keeps the one whose weakest pair is strongest, then prints the
`k` in rank order with the closest competitor inside the set, and the tissues that missed it.
`rank.json` holds every number.

```sh
python3 scripts/movies/selection/rank.py /tmp/sel/shots --pool notochord,myotome,eye --k 8 --hours 24,48
```

### `palette-distance.ts`

Prints the CIE76 distance between the display colours of every pair of `REPORTERS`, closest pair
first. A pair below about 20 reads as one colour in a movie. The eight colours of the current
table keep their closest pair at 35.13, mVenus against mKO2. Run it after a reporter is added.

```sh
node scripts/movies/palette-distance.ts
```

### `contact-sheet.ts`

One frame of each colour-series movie at `--at` seconds, scaled to 960 wide, labelled
"<label>, <reporterName>" and tiled four to a row, so eight movies give a 3840 by 1080 sheet. The
order is the palette order of `render-all.ts`, and the EGFP slot takes the EGFP movie of the
tissue whose `distinctRank` maps to it, because that tissue is rendered once, in series 1. ffmpeg
comes from `$FFMPEG`, else the static 7.0 build under `/hpc/apps`, else the path. That build has
no drawtext, so the labels are drawn by the first ffmpeg that has it, `/usr/bin/ffmpeg` on the
login node. With no such build the panels carry no label and the last line says so.

```sh
node scripts/movies/contact-sheet.ts --out /path/to/movies --at 19.6
```

### `write-readme.ts`

Reads `<out>/manifest.json` and the `.mp4` files in `<out>`, and writes `<out>/README.md`: the
properties table, series 1 in EGFP, series 2 in palette order, the wild-type pair, how to render
them again and the licence note. The counts and the sizes come from the directory. `--date` is the
date the batch was rendered and defaults to today.

```sh
node scripts/movies/write-readme.ts --out /path/to/movies --date 2026-09-14
```

## What one movie holds

| Property | Value |
|---|---|
| Size | 1920 by 1080 |
| Frames | 600, 30 frames a second, 20 seconds |
| Time | 0 to 48 hpf, linear, one frame every 0.08 h |
| Codec | H.264, `-crf 18 -pix_fmt yuv420p -movflags +faststart`, no audio |
| View | lateral, dark preview background, no panels, no legend, no labels |
| Credit | `Schematic model \| data: ZFIN CC BY 4.0`, bottom left |

The 600-frame notochord movie in EGFP is 2.34 MB: most of the frame is flat dark ground,
which H.264 compresses hard.

## The single-movie command

```
node scripts/render-movie.ts --target ZFA:0000135 --slug notochord --reporter egfp
     [--include-parts] [--from 0] [--to 48] [--lit-from N] [--lit-to N]
     [--seconds 20] [--fps 30] [--width 1920] [--height 1080] [--context 24]
     [--out DIR] [--port 4952] [--dist DIR] [--frames DIR] [--keep-frames]
     [--credit TEXT] [--crf 18] [--ffmpeg PATH]
     [--wildtype] [--invert] [--name FILE.mp4]
```

- `--target` is the ZFA id the reporter rule points at. `--include-parts` lights its modeled
  descendants as well, the way the preview panel's "include parts" switch does.
- `--from` and `--to` are the movie's time span. `--lit-from` and `--lit-to` are the window the
  rule lights the tissue in, and default to the span. Give them separately for a movie that runs
  over the whole span and lights a tissue only while it exists.
- `--reporter` takes a reporter id of `REPORTERS` in `src/core/fluorescence.ts`. The script reads
  that table at run time, so a reporter added to the app needs no change here.
- `--dist` holds the built app. The default is `node_modules/.cache/atlas-movie-dist`, and the
  script builds into it once and reuses it after. It refuses the repository's `dist/`, which
  `npm run gate` and the browser suite share.
- `--port` is the `vite preview` port. Use one nothing else is listening on.
- `--keep-frames` leaves the PNGs in `<out>/.frames/<name>-<pid>/`. They are deleted by default.
  The process id in the name keeps two runs of the same movie apart: a resubmitted array task
  next to a still-running one once deleted each other's frames, and both encodes failed.
- `--wildtype` puts no rule in the preview, so no tissue is lit and every structure is drawn as
  the faint context. `--target` and `--slug` then default to `ZFA:0000135` and `wildtype`.
- `--invert` negates every frame in the encode (`-vf negate`), which turns the dark preview into
  a bright field.
- `--name` replaces the `<slug>_<REPORTER>.mp4` file name.
- `--ffmpeg` defaults to `$FFMPEG`, then to `ffmpeg` on the path. On most `cpu` nodes the system
  `/usr/bin/ffmpeg` 4.2 cannot load `libvmaf.so.0`; the sbatch scripts export
  `FFMPEG=/hpc/apps/ffmpeg/7.0/bin/ffmpeg`, a static build that runs on every node.

## The wild-type movie

`render-wildtype.sbatch` renders the fish with no reporter, at a fish context of 100, and
encodes the kept frames twice:

| File | Look |
|---|---|
| `wildtype_brightfield.mp4` | frames inverted: an off-white field and a sepia-grey embryo, the look of a transmitted-light image |
| `wildtype_darkfield.mp4` | frames as rendered: a grey embryo on black, next to the reporter movies |

Every structure is drawn in this movie, and on the `cpu` nodes that cost 8 to 34 s a frame (jobs
36208458 with 8 CPUs and 36209136 with 32, 2026-09-14), against 1.6 to 3 s for a reporter movie.
On the login node the same render ran at 1.2 to 3 s a frame and finished in 18 minutes, so run this
one there with `bash scripts/movies/render-wildtype.sbatch`. The one-movie command is

```
node scripts/render-movie.ts --wildtype --invert --context 100 --name wildtype_brightfield.mp4
```

## The batch command

```
node scripts/movies/render-all.ts [--tissues scripts/movies/tissues.json] [--out DIR]
     [--palette FILE] [--parallel 2] [--force] [--only slug,slug] [--dry-run] [--manifest-only]
     [--from 0] [--to 48] [--seconds 20] [--fps 30] ...
```

The job list is every tissue of `tissues.json` in EGFP, then the eight tissues with the lowest
`distinctRank` in the palette order: red, orange, yellow, green, cyan, blue, magenta and the
eighth, which is `mcherry, mko2, mvenus, egfp, mturquoise2, mtagbfp2, irfp670, mscarlet`. A
`--palette` file replaces that with its own JSON array of reporter ids. A tissue whose rank maps
back to EGFP is not rendered twice, so a 20-tissue list plans 27 or 28 movies.

One `vite build` and one `vite preview` serve the whole run. `--parallel N` launches N copies of
Chrome against that one server and gives each one page. A movie whose file is already in the
output directory is skipped unless `--force`, so a run that is killed can be repeated.

`--only` keeps the jobs of the named tissues. The plan is made over the whole list first, so a
ranked tissue keeps its palette colour when it is rendered alone; `render-array.sbatch` relies on
this when it gives each array task one tissue.

`<out>/manifest.json` carries one entry per movie: the file name, the tissue, the ZFA id, the
system, the reporter, the frame count, the seconds per frame, the byte count and the sha256.
Each render writes its entry to `<out>/.manifest/<movie>.json`, and the manifest is assembled from
those files after every movie, keeping only entries whose movie is on disk. Parallel runs, one
array task per tissue, therefore never overwrite each other's entries. `--manifest-only` assembles
the manifest and exits; run it after deleting a movie by hand.

## The check

`scripts/movies/check-movies.sh` probes every movie in the output folder, or the files given as
arguments: 1920 by 1080, H.264 in yuv420p, 600 frames, 20.0 s, a byte count between 1.5 and 12 MB,
and a mean luma above 17 at 19.6 s so a black or blank render is caught. With no arguments it also
writes `<out>/SHA256SUMS`. The exit status is the number of files with a problem. On 2026-09-14
all 29 files passed.

## How long it takes

The scene renders through SwiftShader, so the frame rate follows the CPU count.

| Where | Parallel | Seconds per frame | One 600-frame movie |
|---|---|---|---|
| Login node, 128 cores | 1 | 1.77 mean, 0.6 to 4.2 | 18 min |
| `cpu` node, 16 CPUs | 4 | 6.4 | about 65 min |
| `cpu` node, 8 CPUs | 2 | 6.3 | about 63 min |

Per-frame time follows the cores one Chrome gets and throughput follows the total CPU count, so
`--cpus-per-task 32 --parallel 8` halves the wall time of a batch. The six-hour window of
`render.sbatch` holds about 20 movies; a 28-movie list needs two runs.

`render-array.sbatch` submits one task per tissue (`--array=0-19`, index into `tissues.json`),
each with 8 CPUs and `--parallel 2`, and each task builds its own copy of the app and serves it
on port `ATLAS_MOVIE_PORT_BASE` (default 5100) plus the task index. On 2026-09-14 the 27 movies
of the list finished in about 70 minutes of wall time at 1.6 to 1.9 s per frame when a node was
not shared, and up to 8 s per frame when it was. Set a different `ATLAS_MOVIE_PORT_BASE` for a
second array that runs while the first is still up.

About 40 percent of each frame is work the movie does not need: a time change runs an interactive
rebuild of every structure first and the final rebuild 120 ms later (`scheduleRebuild` in
`src/viewer/rebuild.ts`), and this script waits for the final one. Skipping the interactive pass
needs a change inside the viewer.

## How a frame is made

1. The page opens at `?lab=1&embed=1&theme=dark&v=lat&labels=0&fp=<token>`. The `fp` token is the
   base64url `FluorescenceConfig` of `src/state/slices/url.ts`, with one rule and `context` at the
   app default of 24.
2. One injected stylesheet hides every panel, the timeline strip, the embed footer and the preview
   chip, and gives the canvas the whole viewport. One injected element draws the credit line.
3. `followGrowth` goes off. The app's own fit is measured at 0, 6, 10, 16, 19, 24, 30, 36, 42 and
   48 hpf through `setViewPreset`, and the target, the view direction and the distance are
   interpolated with a monotone cubic spline. Every frame writes its pose through `setCameraPose`.
4. Every frame sets the time through `window.__atlasDebug`, waits until the rebuild driver reports
   an empty queue at the final tessellation level with no pending visual pass, and takes a viewport
   screenshot.
5. `ffmpeg` encodes the PNGs and the frames are deleted.

The capture is a viewport screenshot, not the render-target export of AR-51. `exportPng` is a
module function the page never publishes, and driving the export dialog once per frame would add a
tiled 2x render and a PNG encode to every frame. The consequence is that the export overlay is
absent: no readout, no scale bar, no legend, no label chips, and the credit line is this script's
own element rather than the `EXPORT_CREDIT` the overlay paints. `--credit` changes the text.

## The unit tests

`tests/unit/renderMovie.test.ts` covers the pure half of the render: the frame schedule, the
monotone spline and the pose track, the file names, the `fp` token, the URL, the ffmpeg arguments,
and the job plan. It uses a two-entry placeholder tissue list and starts no browser.

`tests/unit/movieTooling.test.ts` covers the pure half of the tools above: the candidate rows and
the slug form, the hour picks and the onset re-check, the CIELAB distance of the palette, the
contact-sheet order and the filter graph, and the README tables. It starts no browser and runs no
ffmpeg.

```sh
npx vitest run tests/unit/renderMovie.test.ts tests/unit/movieTooling.test.ts
```
