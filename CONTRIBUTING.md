# Contributing

Thank you for reading this. The most useful contribution to this project is a correction to the
anatomy. The geometry is schematic and most size values are estimates, so a wrong shape, a wrong
position or a wrong stage window is the kind of error that a zebrafish biologist can see in one
frame and that I cannot see at all.

This project holds a procedural 3D model. A structure record has no stored vertices; it holds
parameters that a builder turns into geometry at each time point. This file explains how to report
an error, how to read and write a record, and how to check your work. The full reference is
`docs/api/body-frame.md`; the binding decisions are
`docs/superpowers/specs/2026-09-06-architecture-decisions.md` (D1 to D17).

## Report an error in the anatomy

1. Open an [anatomy correction issue](../../issues/new?template=anatomy-correction.yml). It asks
   for four things: the ZFA id, the stage in hpf, what is wrong, and a citation. The info card
   prints the ZFA id under the structure name, and the address bar carries the whole viewer
   state, so a copied link opens the exact frame you saw.
2. That is enough. You do not have to write the fix.
3. If you want to write the fix, open a pull request that changes one record and passes
   `npm run validate`. One record per pull request keeps the review short and keeps the history
   readable.

For a viewer problem rather than an anatomy problem, use the bug report form. For a question
about a ZFIN term or a stage definition, write to ZFIN: this repository copies the ontology, it
does not curate it.

## Set up

```sh
nvm use              # or fnm use; reads .nvmrc, which pins Node 22
npm ci
npm run dev          # http://localhost:5173
```

## Body coordinates

Every structure sits in body coordinates, not world coordinates:

- `u`: arc length along the spine, 0 at the snout tip, 1 at the posterior end of the notochord.
  `u` above 1 (to 1.25) is allowed only in the `fins` system.
- `v`: -1 at the ventral skin, 0 on the spine, +1 at the dorsal skin.
- `w`: -1 at the left skin, 0 at the midline, +1 at the right skin.

The viewer converts `{u, v, w}` to millimetres at every time step, so a structure follows the
body as it bends, straightens and grows. Never write a world-space position into a record.

A size is either a plain number in millimetres, or `{ value, unit: 'bodyHeightFraction' }` for a
size that should scale with the local body height instead of standard length. Use the fraction
form for a structure that must stay under the skin at every stage, and for a draft value already
given as a ratio to body height.

## Sizes and the growth scale

A record's lengths (any field ending in `Mm` or `MmPerHour`) are written at one reference
standard length, `sizeRefSl`, and the app rescales them by the ratio of the current standard
length to that reference. The rule:

- Every keyframe at or after 72 hpf carries `sizeRefSl`, the standard length in millimetres of
  the specimen the sizes describe (see the SL table in `docs/api/body-frame.md` section 4).
- No keyframe before 72 hpf carries `sizeRefSl`.
- Placement, `u` ranges, fractions, angles and counts never rescale.

## Sources

Every record carries a non-empty `sources` array (papers, ZFIN pages, or a stated estimate), and
every entry in `sizes` and `events` carries its own `source`. Write the window and the numbers as
you find them. Mark a guessed value as an estimate (`estimate: true`); do not write it as
measured. When a window differs from the ZFIN stage bounds, `overrideNote` states why, and names
the handoff id if one applies. `overrideNote` is the text the info card shows behind "Why the
model differs", so write it for a reader, not for yourself.

## The validator

```sh
npm run validate
```

The validator checks that every id, parent, alias and handoff resolves against the ZFIN
snapshot in `data/zfin/`, that keyframes are sorted and inside the presence window, that body
coordinates stay in range, that a built structure has no `NaN` and stays inside the skin, and
about thirty other rules (`docs/api/body-frame.md` section 13 lists every code). It exits 1 on
any error (`E` codes); a warning (`W` codes) prints but does not fail the run. Useful flags:

- `--strict` turns every warning into an error.
- `--lenient-handoffs` turns a missing handoff target back into the warning W011. The default is
  the error E021.
- `--json <path>` writes the findings as JSON.
- `--emit-schema` rewrites the JSON Schema files under `docs/schema/` after a change to
  `src/core/schema/`.

Pass a flag through npm with `--`, for example `npm run validate -- --strict`.

Run the validator after every change to a file under `src/data/`, before you open a pull
request.

## Adding a structure

1. Pick the ZFA id from `data/zfin/anatomy_item.txt` and add one record to the JSON file of its
   system under `src/data/structures/`. A group node has no geometry and lives in `groups.json`.
2. Fill in the ZFIN fields (`name`, `zfinStartStage`, `zfinEndStage`, `startHpf`, `endHpf`,
   `definition`) so they equal the ZFIN source. Set `visibleFromHpf` and `modelEndHpf`; add an
   `overrideNote` only when they differ from the ZFIN bounds.
3. Write `geometry`: choose a primitive kind (`ellipsoid`, `superellipsoid`, `tube`, `lathe`,
   `segmentArray`, `sheet`, `shell`, or a `custom` builder) and its static parameters, then a
   `keyframes` array with at least one row at every headline stage inside the presence window.
   `docs/api/body-frame.md` section 6 lists the parameters per kind, section 7 the
   interpolation rules, and section 12 a full worked example (the otic vesicle).
4. Add `sizes`, `events` and `sources`.
5. Run the checks for your files:

   ```sh
   npm run validate
   npm run check
   npm run lint
   npm test
   ```

6. Take a snapshot (next section) at 24, 48, 120, 720 and 4320 hpf, lateral view, and look at the
   PNGs. Compare the new structure's size and position against the derived targets in
   `docs/research/10-visual-reference-notes.md` (RN-01 to RN-07), and iterate until it reads
   correctly. The reference illustrations behind those targets are third-party figures and are
   not in this repository; only the derived numbers are.

## Looking at your change

`scripts/snap.ts` builds the app into its own directory and takes screenshots, so it leaves the
shared `dist/` and `docs/screenshots/` alone:

```sh
node scripts/snap.ts --port 5199 --out /tmp/atlas-snap --hpf 24,48,120 --views lat
```

```
node scripts/snap.ts --port <port> --out <dir> [--hpf 24,48,120,720,4320] [--views lat,dor]
                     [--embed 0|1] [--xr 0..100] [--dissect 0..100] [--cam x,y,z,tx,ty,tz]
                     [--hide <system ids or ZFA numbers>] [--sel <ZFA numbers>]
                     [--theme dark|light] [--systems]
```

- `--hpf` and `--views` (`lat`, `dor`, `ven`, `ant`, `pos`, `tq`) pick the shots. The defaults are
  the five headline hours above, in the lateral and dorsal views.
- `--hide` takes the URL form: system ids or 7-digit ZFA numbers, comma separated.
- `--sel` selects records by their 7-digit ZFA numbers, comma separated, which opens the
  structure card. With `--embed 0` the shot carries the panels, the card and the ZFIN footer.
- `--systems` writes one lateral view per system with the other fourteen hidden, named
  `<system>-<hpf>-lat.png`, instead of the plain views.
- Use a port that nothing else on your machine is listening on, and write to a scratch directory
  rather than into the repository.

`npm run screenshots` is the other path. It rewrites all 36 headline PNGs in `docs/screenshots/`
through Playwright, and it needs a prior `npm run build`. Commit only the images your change
actually alters.

## The gate

`npm run gate` runs every check that CI runs, in the same order:

```
npm run check                    # TypeScript
npm run lint                     # ESLint
npm test                         # Vitest unit tests
npm run validate                 # the data validator
npm run gen:body -- --check      # src/data/body.json matches its generator
npm run gen:vocab -- --check     # src/data/vocabulary.json matches the ZFIN snapshot
npm run sources -- --check       # docs/SOURCES.md matches the records
npm run attribution -- --check   # public/ATTRIBUTION.md matches src/core/attribution.ts
npm run notices -- --check       # public/THIRD-PARTY-NOTICES.txt matches the dependencies
npm run build                    # the static site in dist/
npm run csp                      # the inline-script hash in public/_headers and vercel.json
npm run test:e2e                 # Playwright, with the system Chrome
```

The three generator checks are what keep a hand-written number from drifting away from the data.
When one fails, run the same script without `--check` and commit what it writes.

`npm run gate` writes `dist/`, `test-results/` and `playwright-report/`. The browser tests start
`npm run preview` on port 4173 when nothing already answers there. Stop any preview server you
left on that port first, or the tests read an old build.

## Licence of a contribution

By opening a pull request you agree that your contribution is licensed under the MIT licence in
`LICENSE`. Data you add keeps the licence of its source, and `public/ATTRIBUTION.md` and
`LICENSE-DATA` must name that source and its licence.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Report unacceptable
behaviour to yang-joon.kim@czbiohub.org.
