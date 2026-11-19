## What this changes

<!-- One or two sentences. Name the structure, the file or the behaviour. -->

## Why

<!-- The citation, the issue number, or the reasoning. A data change needs a source. -->

## Checks

- [ ] `npm run validate` passes with 0 errors (any change under `src/data/`)
- [ ] `npm run check` passes (TypeScript)
- [ ] `npm run lint` passes (ESLint)
- [ ] `npm test` passes (unit tests)
- [ ] `npm run gate` passes, or CI runs it on this pull request

## For a data change

- [ ] Every new number carries a `source`, and a guessed value carries `estimate: true`
- [ ] A window that differs from the ZFIN bounds carries an `overrideNote` that says why
- [ ] I looked at a render of the change (`node scripts/snap.ts --port <port> --out <dir>`)
