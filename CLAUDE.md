# Zebrafish 3D Atlas

An interactive 3D atlas of zebrafish development from 0 to 4320 hpf. The geometry is procedural
and lives in a body frame; the anatomy vocabulary is ZFIN (ZFA and ZFS). Start here:

| Need | Read |
|---|---|
| features, controls, `npm run` commands, hosting status | `README.md` |
| how to author a structure record, run the validator, take screenshots | `CONTRIBUTING.md` |
| the `src/core` API (body model, primitives, schema fields, validator rule codes) | `docs/api/body-frame.md` |
| why things are the way they are (D1 to D17) | `docs/superpowers/specs/2026-09-06-architecture-decisions.md` |
| the full design | `docs/superpowers/specs/2026-09-06-zebrafish-3d-atlas-design.md` |
| research behind the numbers | `docs/research/` |
| render the movie series, or pick the tissues for a new one | `scripts/movies/README.md` |

## Document precedence

When two documents disagree, the decision record wins over the design spec, and the spec wins
over the research notes (`docs/api/body-frame.md`, "Precedence for values"). Change a decision by
editing the decision record, then the spec, never the other way round.

## Rules that a new session can miss

- A structure record holds `{u, v, w}` body coordinates and sizes in millimetres or body-height
  fractions, never a world position (`CONTRIBUTING.md`, "Body coordinates").
- Edit a system's records only in that system's file under `src/data/structures/`. Ask before
  editing `groups.json` (`CONTRIBUTING.md`, "Adding a structure").
- Do not run `npm run build` or `npx playwright test` while another agent or session may run
  them; both write to `dist/` and `docs/screenshots/`. Use
  `node scripts/snap.ts --port <port> --out <dir>` with a port and directory nobody else uses
  (`CONTRIBUTING.md`, "Running snap.ts").
- Run `node scripts/validate-data.ts` after any change under `src/data/` and before a pull
  request (`CONTRIBUTING.md`, "The validator"). `npm run gate` runs every check CI runs.
- GitHub Actions is turned off for this repository (owner decision, 2026-09-14): the browser
  suite took about 73 minutes per run on GitHub's software renderer and every run counted
  against the account's minutes. `npm run gate` is the merge gate and runs locally. The workflow
  file keeps the fast checks and a manual browser job for the day Actions is turned back on.
- Third-party reference figures stay in `data/samples/`, which git ignores. Never copy them into
  the repo or the docs.

## Working with parallel agents

Give each agent an explicit list of every file it may edit, including shared files such as
`src/App.tsx` and test files. Split a shared data file before two agents edit it. Do not send
messages to an agent that runs inside a Workflow; a message resumes a second copy of it.
