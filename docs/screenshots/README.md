# Screenshots

Generated images. Do not hand-edit a PNG here; regenerate it with the commands below and commit
the result. Every file name states its hpf and its view. `npm run screenshots` rewrites all 36
headline files, 5.4 MB, so commit only the images your change actually alters.

## This directory

The 18 headline stages (D7), each in lateral (`-lateral.png`) and dorsal (`-dorsal.png`) view:
0, 2.5, 4, 6, 10, 16, 24, 42, 48, 72, 120, 168, 336, 504, 720, 1080, 2160, 4320 hpf.

```sh
npm run screenshots
```

This runs `tests/e2e/screenshots.spec.ts` with Playwright and the system Chrome, and writes the
36 PNGs to this directory. It needs a prior `npm run build`; the test starts `npm run preview` on
port 4173 when nothing already answers there. A run also checks that no canvas came back blank.
Those 36 views are the model alone: the test loads the app in embed mode, so no panel is in frame.

## The four README views

`<hpf>-lateral-app.png` at 24, 48, 120 and 4320 hpf. These are whole-window views: the systems
rail, the structure tree, the info card, the timeline and the readout are all in frame, and each
one has a structure selected so that the info card shows a structure. The top-level `README.md`
uses these four and no others. `npm run screenshots` does not touch them; regenerate them with
`--embed 0` and a `--sel` id, then copy the four files here under their `-app` names:

```sh
node scripts/snap.ts --port <port> --out <dir> --hpf 24   --views lat --embed 0 --sel 0000135
node scripts/snap.ts --port <port> --out <dir> --hpf 48   --views lat --embed 0 --sel 0000114
node scripts/snap.ts --port <port> --out <dir> --hpf 120  --views lat --embed 0 --sel 0000076
node scripts/snap.ts --port <port> --out <dir> --hpf 4320 --views lat --embed 0 --sel 0000107
```

The four ids are the notochord, the heart, the swim bladder and the eye.

## Dissect (D17)

Four views of the dissect slider, lateral only: `dissect-<hpf>-<value>.png` at 48 and 4320 hpf,
at 60 percent (the systems pulled apart) and at 100 percent (the inventory grid). The camera fit
encloses the dissect layout (UI-65), so no hand-set camera is needed:

```sh
node scripts/snap.ts --port <port> --out <dir> --hpf 48,4320 --views lat --dissect 60
node scripts/snap.ts --port <port> --out <dir> --hpf 48,4320 --views lat --dissect 100
```

Copy the four files out of `<dir>` into this directory. With `--systems`, `--dissect` writes
`dissect-<system>-<hpf>-lat-<n>.png`: every file a dissect run writes starts with `dissect-` and
ends with the slider value.

## `systems/`

Each of the 15 D5 systems alone, at 48, 120 and 4320 hpf, lateral view only, with the other 14
systems hidden: `<system>-<hpf>-lat.png`. These come from `scripts/snap.ts --systems`, which
builds into its own directory rather than `dist/`, so it leaves the committed build alone:

```sh
node scripts/snap.ts --port <port> --out <dir> --hpf 48,120,4320 --views lat --systems
```

Copy the files this prints out of `<dir>` into `docs/screenshots/systems/`; the script itself
never writes here.

## Reviewing a screenshot

Open the PNG and look at it rather than describing it from memory. Compare it against the derived
targets in `docs/research/10-visual-reference-notes.md` (RN-01 to RN-07) at 18, 24, 30, 48, 72 and
120 hpf, and against the adult targets at 2160 and 4320 hpf. The reference illustrations behind
those targets are third-party figures and are not in this repository.
