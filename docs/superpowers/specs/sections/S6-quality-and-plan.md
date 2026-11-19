> **Superseded draft.** The assembled specification
> [`../2026-09-06-zebrafish-3d-atlas-design.md`](../2026-09-06-zebrafish-3d-atlas-design.md)
> is authoritative. This file is the section draft written before reconciliation and it may
> disagree with the assembled specification. Written by AI coding agents (Claude Code) under
> the direction of Yang-Joon Kim, 2026-09-06.

## S6. Testing, tooling, deployment and implementation plan

This section defines the tool chain, the test plan, the data validation script, and the browser test plan. It also defines the performance procedure, continuous integration (CI), the release checklist, and the work packages. Time values are in hours post fertilization (hpf) or days post fertilization (dpf). Body sizes after 72 hpf use standard length (SL). Ontology ids come from the Zebrafish Anatomy Ontology (ZFA) and the Zebrafish Stage Ontology (ZFS), both published by the Zebrafish Information Network (ZFIN). Requirement ids carry the prefix QP.

### S6.1 Tool chain and npm scripts

The package versions come from decision D2. Node 22.12 or newer runs every script; the local machine has Node 22.22 (research 06, section 1).

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | development server on port 5173 |
| `build` | `vite build` | production build into `dist/` |
| `preview` | `vite preview --port 4173 --strictPort` | serves `dist/` for browser tests |
| `check` | `tsc -p tsconfig.json --noEmit` | type check of `src`, `scripts`, `tests` |
| `lint` | `eslint .` | flat config, typed rules |
| `test` | `vitest run` | unit tests in `tests/unit` |
| `test:e2e` | `playwright test` | browser tests in `tests/e2e` against `dist/` |
| `validate` | `node scripts/validate-data.ts` | data rules of S6.3 |
| `screenshots` | `node scripts/screenshot.ts` | 36 PNG files under `docs/screenshots/` |
| `attribution` | `node scripts/build-attribution.ts` | writes `public/ATTRIBUTION.md` |

- **QP-01** A clean clone passes `npm ci`, `npm run check`, `npm run lint`, `npm test`, `npm run validate`, and `npm run build` in that order with exit code 0. These are the D13 gates.
- **QP-02** `package.json` pins every D2 package to an exact version. `npm ci` is the only install command in CI and in the README.
- **QP-03** Files under `scripts/` use only erasable TypeScript syntax, because Node 22 strips types and does not compile enums or namespaces. Relative imports in `scripts/` carry the `.ts` extension.
- **QP-04** `src/core` imports nothing from `react`, `@react-three/*`, or the DOM. An ESLint rule enforces this.
- **QP-05** The `.gitignore` in the repository ignores `screenshots/` at any depth, which hides `docs/screenshots/`. Replace that line with `/test-results/` and `/playwright-report/` before the first screenshot commit.

#### TypeScript configuration

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler",
    "jsx": "react-jsx", "strict": true, "noUncheckedIndexedAccess": true,
    "erasableSyntaxOnly": true, "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true, "noEmit": true, "skipLibCheck": true,
    "types": ["vite/client"], "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "scripts", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

#### ESLint configuration outline

```js
// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import r3f from '@react-three/eslint-plugin'

export default tseslint.config(
  { ignores: ['dist', 'docs', 'test-results', 'playwright-report', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } },
  { files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh, '@react-three': r3f },
    rules: { ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@react-three/no-clone-in-loop': 'error', '@react-three/no-new-in-loop': 'error' } },
  { files: ['src/core/**/*.ts'],
    rules: { 'no-restricted-globals': ['error', 'window', 'document', 'navigator'],
      'no-restricted-imports': ['error', { patterns: ['react', 'react-dom', '@react-three/*'] }] } },
)
```

The rule names `no-clone-in-loop` and `no-new-in-loop` are unverified for `@react-three/eslint-plugin` 0.1.2 (research 06, section 7). WP-01 confirms them against the installed package.

#### Vite configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022', sourcemap: true },
  server: { port: 5173, host: true },
})
```

- **QP-06** The GitHub Pages build sets `BASE_PATH=/zebrafish-3D-atlas/`. Vercel and local builds leave the variable unset, so `base` is `/`. No source file hard-codes the repository name.

### S6.2 Unit test plan for src/core

Vitest 5 runs these tests in Node without a browser. Each file below tests one module. The primitives return plain typed arrays `{ positions, normals, indices, bounds }`, so no WebGL context is needed.

| Test file | Module | Requirement |
|---|---|---|
| `tests/unit/timeAxis.test.ts` | `src/core/timeAxis.ts` | QP-10 |
| `tests/unit/bodyModel.test.ts` | `src/core/bodyModel.ts` | QP-11 |
| `tests/unit/primitives.test.ts` | `src/core/primitives/*.ts` | QP-12 |
| `tests/unit/interpolation.test.ts` | `src/core/interpolation.ts` | QP-13 |
| `tests/unit/urlState.test.ts` | `src/core/urlState.ts` | QP-14 |
| `tests/unit/schema.test.ts` | `src/core/schema.ts` and `src/data/*.json` | QP-15 |

#### Time axis

- **QP-10** `hpfToFraction` and `fractionToHpf` form a bijection on `[0, 4320]`. For every integer hpf from 0 to 4320, `fractionToHpf(hpfToFraction(h))` equals `h` within 1e-9. `hpfToFraction` is strictly increasing over the same samples. The D7 anchors map exactly: 0 to 0.00, 10 to 0.18, 24 to 0.30, 72 to 0.52, 168 to 0.62, 720 to 0.78, 2160 to 0.92, 4320 to 1.00. Segment shares read from `stages.json` sum to 100. The tick filter drops a tick closer than 8 px to the last drawn tick at track widths 358, 700, 1200, and 1920 px (D7). Playback at 1x moves the thumb by one track width in 60 s (D7); 30 s from 0 hpf lands at fraction 0.50, which the D7 table maps to 67.64 hpf.

#### Body model

- **QP-11** The test samples `bodyModel(t)` at every integer hpf from 0 to 4320 (4321 samples). It also samples at 0.1 hpf steps around each regime boundary. The boundaries are 4.66, 10, 19, and 72 hpf (D3); each window spans 1 hpf on each side. No field of any sample is `NaN` or infinite. `bodyLength` is non-decreasing for every pair of consecutive samples after 10 hpf. `bodyLength` equals the `growth` table of `stages.json` at every table hpf within 1e-6. Across each boundary sweep, no spine station moves more than 0.05 mm per 0.1 hpf step. That limit is five times the fastest growth rate in the Kimmel table. The table gives about 0.1 mm per hour between 19 and 24 hpf (research 05, section 5.1). Spot values: yolk radius 0.35 mm at 0 hpf (research 05, section 16.2); epiboly 0.5 at 6 hpf and 1.0 at 10 hpf (D3); chorion present at 71 hpf and absent at 73 hpf (D8); yolk `null` after 168 hpf (D3); head-trunk angle 35 degrees at 60 hpf (D8) and 25 degrees at 72 hpf (D3). Every station holds unit `tangent`, `dorsal`, and `lateral` vectors, mutually orthogonal within 1e-6.

#### Primitives

- **QP-12** For every primitive at both tessellation levels: the vertex count equals the count stated in the primitive's doc comment; the index count is a multiple of 3; every position and normal is finite; every normal has unit length within 1e-3 (research 06, section 7); the bounding box matches the analytic box within 1e-6 (an ellipsoid with radii `a, b, c` spans `[-a, a]` on x). Vertex count depends only on the tessellation level, except for `segmentArray`, where it scales with `count`. A `sheet` has two faces plus a rim, so every triangle has a defined winding and no zero-area triangle exists.

#### Interpolation

- **QP-13** `bracket(keyframes, t)` returns the pair `(i, i + 1)` with `k[i].hpf <= t < k[i + 1].hpf`. Before the first keyframe it returns `(0, 0)`; after the last it returns `(n - 1, n - 1)`. The smoothstep weight is 0 at `k[i].hpf`, 1 at `k[i + 1].hpf`, and 0.5 at the midpoint. Its finite-difference slope at both endpoints is below 1e-6. Integer parameters (`count` in `segmentArray`) use `Math.floor` of the interpolated value: between counts 5 and 9, the value at weight 0.4 is 6 and at weight 0.5 is 7. A non-decreasing count series never decreases between keyframes.

#### URL state

- **QP-14** `parse(serialize(state))` deep-equals `state` for 200 states drawn from a seeded generator over the parameters defined in section S4. The default state serializes to an empty string. Unknown parameters are ignored. A `t` outside `[0, 4320]` is clamped and sets `clamped: true`, which the UI turns into the toast of research 07, UX-ST-09. An unknown ZFA id in the selection is dropped and reported the same way. The serialized string contains no `ZFA:` prefix and no whitespace.

#### Schema on real data

- **QP-15** The test imports the five files in `src/data` and parses each with its zod schema from `src/core/schema.ts`. Every parse succeeds. Every `system` value of a structure is one of the 15 ids in `systems.json` (D5). Every structure id is unique. The JSON Schema files under `docs/schema/` equal `z.toJSONSchema()` of the current zod schemas, so the committed schema never drifts.

### S6.3 Data validation script

`scripts/validate-data.ts` implements the D13 checks against the schemas of section S3. It reads a committed ZFIN snapshot under `scripts/zfin/` (`anatomy_item.txt`, 3,113 rows; `anatomy_relationship.txt`, 5,992 rows; `stage_ontology.txt`, 45 rows; downloaded 2026-09-06). The snapshot is CC BY 4.0 and is credited in `public/ATTRIBUTION.md` (D14).

| Rule | Level | Check |
|---|---|---|
| V01 | error | Every structure id exists in `anatomy_item.txt` and the record name equals the ZFIN name |
| V02 | error | `visibleFromHpf` and `modelEndHpf` equal the ZFIN stage window unless the record carries `overrideNote`; with a note the level is warn (research 03, section 2.5 lists four records) |
| V03 | error | Keyframes are sorted by hpf, unique in hpf, and lie inside `[visibleFromHpf, modelEndHpf]` |
| V04 | error | Body coordinates: `u` in `[0, 1]`, `v` and `w` in `[-1, 1]`; a record in system `fins` may reach `u = 1.25` (the drafts used 1.2; research 03, section 2.1) |
| V05 | error | One record per id across `structures.json` |
| V06 | error | Every `parent` resolves to a record in `structures.json`; `parentRelation` is set when the parent is not a ZFA `part_of` or `is_a` ancestor in `anatomy_relationship.txt` |
| V07 | error | Every handoff `from` and `to` id resolves; the window has `t0 < t1` and lies inside the presence of both sides |
| V08 | error | `timeAxis` fractions are strictly increasing and the segment shares sum to 100 |
| V09 | error | `system` and each `alsoIn` value is one of the 15 canonical ids; the drafts use `extraembryonic`, which V09 rejects in favour of `early_embryo` |
| V10 | error | All keyframes of one structure share one primitive kind and one parameter key set |
| V11 | error | Building every keyframe at both tessellation levels yields finite positions and a bounding box inside the body box of that time, with a 20 percent margin for fins |
| V12 | error | Every `growth` row is non-decreasing in hpf and in length; every headline tick hpf equals a ZFS stage start |
| V13 | warn | A structure with `geometry: null` has at least one child; a structure with geometry has at least two keyframes when its presence exceeds 24 hpf |
| V14 | warn | A record has no `sources` entry, or a size keyframe cites no source |

- **QP-20** Output format: one header line, one line per finding, one summary line. A finding line is tab-separated: `LEVEL`, rule id, file, record id, message. The exit code is 1 when any error exists and 0 otherwise. `--json <path>` also writes the findings as an array of `{ level, rule, file, id, message }`. `--strict` promotes warnings to errors. `--emit-schema` writes the JSON Schema files under `docs/schema/`.

```
validate-data: 213 structures, 15 systems, 44 stages, 13 handoffs
ERROR	V01	structures.json	ZFA:0009999	id not found in scripts/zfin/anatomy_item.txt
WARN	V02	structures.json	ZFA:0000604	visibleFromHpf 24 precedes ZFIN start 96; overrideNote present
validate-data: 1 error, 1 warning, 0.4 s
```

The expected structure count is 213: the five drafts hold 220 records and share 7 duplicate ids (research 03, section 2.2).

### S6.4 Playwright plan

- **QP-30** Playwright 1.63 runs the local system Chrome with `channel: 'chrome'` and the bundled Chromium in CI. The launch flags `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`, and `--ignore-gpu-blocklist` give WebGL on a machine without a graphics processing unit (GPU) (research 06, section 7). The desktop viewport is 1600 by 900 CSS px at device scale factor 1.
- **QP-31** Every test opens a URL and waits for `[data-atlas-ready="1"]` on the canvas wrapper. The viewer sets this attribute after the first frame rendered at the final tessellation level (D3). The context uses `reducedMotion: 'reduce'`, so appearance transitions are opacity only over 150 ms (research 07, UX-AC-07) and screenshots are stable.

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'
const ci = !!process.env.CI
const gl = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
export default defineConfig({
  testDir: 'tests/e2e', timeout: 90_000, retries: ci ? 1 : 0, reporter: ci ? 'github' : 'list',
  webServer: { command: 'npm run preview', url: 'http://localhost:4173/', reuseExistingServer: !ci },
  use: { baseURL: 'http://localhost:4173/', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: ci ? undefined : 'chrome',
      viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, launchOptions: { args: gl } } },
    { name: 'phone', use: { ...devices['Pixel 7'], channel: ci ? undefined : 'chrome',
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, launchOptions: { args: gl } } },
  ],
})
```

#### Screenshots of the headline stages

- **QP-32** `scripts/screenshot.ts` opens `/?t=<hpf>&v=<view>&embed=1&theme=dark` for the 18 headline stages of D7 with `v=lat` and `v=dor`. It saves `docs/screenshots/<hpf>-lateral.png` and `docs/screenshots/<hpf>-dorsal.png`. The hpf is the shortest decimal string of the stage start: `0`, `2.5`, `4`, `6`, `10`, `16`, `24`, `42`, `48`, `72`, `120`, `168`, `336`, `504`, `720`, `1080`, `2160`, `4320` (ZFS starts from `stage_ontology.txt`). Embed mode hides the top bar and the rail (research 07, UX-EX-10). The script requires a prior `npm run build` and starts its own preview server. A person reviews the 36 files before a phase is called done (D13).
- **QP-33** `tests/e2e/screenshots.spec.ts` captures the same 36 views through the test runner and applies the non-blank check. It does not compare pixels against a baseline in version 1, because SwiftShader and a laptop GPU produce different pixels (research 06, section 7).

#### Non-blank canvas check

- **QP-34** The check decodes the PNG of the canvas element and computes luminance per pixel. It passes when two conditions hold. The luminance standard deviation exceeds 8 on the 0 to 255 scale. More than 3 percent of pixels differ from the most frequent colour by more than 16 levels. These starting values live in one constant in `scripts/screenshot.ts`; WP-H1 calibrates them against the first accepted screenshot set.

#### Smoke test of interactions

- **QP-35** `tests/e2e/smoke.spec.ts` runs on the desktop project and asserts, in order:

| Step | Action | Assertion |
|---|---|---|
| 1 | open `/?t=24&v=lat` | readout shows `24 hpf` and `Prim-5`; canvas non-blank |
| 2 | click the canvas centre | info card shows an id matching `^ZFA:\d{7}$`; URL contains `sel=` |
| 3 | press `/`, type `heart`, press `Enter` | card header reads `heart`; URL contains `sel=0000114` (D9) |
| 4 | press `ArrowRight`, then `ArrowLeft` | `t` becomes 30 (Prim-15 start), then 24 |
| 5 | press `Home`, then `End` | `t` becomes 0, then 2160 (research 07, section 3.10) |
| 6 | press `Space`, wait 500 ms, press `Space` | `t` increased and then stays constant |
| 7 | press `2` | URL contains `v=dor` |
| 8 | open `/?t=10&sel=0000114`, click "Jump to first appearance" | `t` equals the heart record's `visibleFromHpf` |
| 9 | open the export dialog, choose 2x, confirm | the downloaded PNG is 3200 by 1800 px |
| 10 | press `Escape` twice | selection cleared; URL has no `sel=` |

#### Phone viewport check

- **QP-36** `tests/e2e/phone.spec.ts` runs on the phone project at 390 by 844 CSS px (research 07, section 1, moment M2). It asserts: `document.scrollingElement.scrollWidth` is at most 390; the Layers button and the compact timeline bar are visible; the canvas is non-blank; a tap on the canvas centre opens the info card at its 96 px peek height (research 07, section 2.4); every focusable control has a bounding box of at least 44 by 44 px (research 07, UX-US-01).

### S6.5 Performance measurement procedure

Section S2 owns the budget table. The rows below copy it from research 06, section 8, for the procedure; where S2 states another value, S2 wins.

| Metric | Budget | How measured |
|---|---|---|
| Frame time during playback | 16.7 ms total; GPU 8 ms; script 4 ms | Chrome Performance panel, frames track, p95 over a 60 s playback at 1x |
| Draw calls per frame | 200 | `renderer.info.render.calls` read through `window.__atlasPerf` |
| Triangles on screen | 600,000 at device pixel ratio 2 | `renderer.info.render.triangles` |
| Final tessellation rebuild | 8 ms per slice (D3) | `performance.measure('atlas:rebuild')` entries |
| Time to first frame | 2 s (research 07, UX-US-05) | `performance.mark('atlas:first-frame')` minus navigation start, network throttled to 10 Mbit/s |
| Idle GPU use | 0 | frame counter constant while paused for 10 s |

- **QP-40** The viewer exposes `window.__atlasPerf` in every build: a ring buffer of the last 600 frame times, the current draw call and triangle counts, and the rebuild measures. The object is read-only and costs nothing when no one reads it.
- **QP-41** Run the procedure on the presenter's laptop, on an integrated-GPU laptop, and on one phone. Build and serve with `npm run preview`. Open `/?t=24` and the Chrome Performance panel. Record a 10 s scrub from 0 to 4320 hpf and a 60 s playback at 1x. Read the p95 frame time from the frames track and the counters from `window.__atlasPerf`. Record every value with the machine name, GPU, Chrome version, and date in `docs/perf/<date>-<machine>.md`.
- **QP-42** `tests/e2e/perf.spec.ts` runs only when `PERF=1` is set. It scrubs for 10 s and asserts p95 frame time under 20 ms (research 06, section 8). SwiftShader numbers are not representative, so CI never runs it.

### S6.6 Continuous integration and deployment

- **QP-50** One workflow file `.github/workflows/ci.yml` runs on every push and pull request. The `verify` job runs the D13 gates and the browser tests. The `deploy-pages` job runs only on a push to `main` after `verify` passes.
- **QP-51** The e2e job builds with `BASE_PATH` unset. The deploy job builds again with `BASE_PATH=/zebrafish-3D-atlas/`. After deployment, the job fetches the page URL and one hashed asset URL from `dist/index.html` and fails on a non-200 status.

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:
  workflow_dispatch:
permissions: { contents: read }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  verify:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run check
      - run: npm run lint
      - run: npm test
      - run: npm run validate
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env: { CI: true }
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: e2e-results, path: "test-results\nplaywright-report", retention-days: 14 }
  deploy-pages:
    needs: verify
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env: { BASE_PATH: /zebrafish-3D-atlas/ }
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v5
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v5
      - run: |
          curl -fsS "${{ steps.deployment.outputs.page_url }}" > /dev/null
          asset=$(grep -o 'assets/[^"]*\.js' dist/index.html | head -1)
          curl -fsS "${{ steps.deployment.outputs.page_url }}$asset" > /dev/null
```

The action versions `upload-pages-artifact@v5` and `deploy-pages@v5` come from research 06, section 7. WP-H3 confirms them against the Vite static deploy guide at implementation time. The repository setting "Pages: Source" must be "GitHub Actions".

#### Vercel

- **QP-52** `vercel.json` holds `{ "framework": "vite", "installCommand": "npm ci", "buildCommand": "npm run build", "outputDirectory": "dist" }`. The project setting selects Node 22. `BASE_PATH` stays unset, so assets resolve from `/`. Every pull request gets a preview deployment. All state lives in the query string, so no rewrite rule is needed.

### S6.7 Release checklist and README outline

#### Release checklist

1. `git status` is clean on `main` and the CI run for the head commit is green.
2. `npm run validate -- --strict` reports zero findings.
3. `npm run build && npm run screenshots` regenerates the 36 files; a person reviews the diff against the previous set.
4. `npm run attribution` regenerates `public/ATTRIBUTION.md`; the diff is reviewed.
5. The About sheet shows the ZFA and ZFS version strings and the snapshot date (research 07, UX-ST-12).
6. On both hosts, open `/?t=24&sel=0000114&v=lat` and confirm the heart is selected at Prim-5.
7. On the GitHub Pages host, open a stage link from a slide deck and confirm the assets load under the base path.
8. Run the QP-41 procedure once and store the record under `docs/perf/`.
9. Tag `vMAJOR.MINOR.PATCH`, write the release note from the merged work package list, and publish the GitHub release.

#### README outline

1. Title, one paragraph on what the viewer shows, and links to the GitHub Pages and Vercel deployments.
2. A strip of six lateral screenshots: 6, 24, 48, 72, 120, and 2160 hpf.
3. What the geometry is: procedural and schematic, placed in a body frame, not measured meshes; stage timings at 28.5 C from ZFIN.
4. Using the viewer: time axis, selection, info card, view presets, export, share links, presentation mode, keyboard shortcuts (link to the shortcut sheet).
5. Data: the five files in `src/data`, the record schema (link to `docs/schema/`), how to add a structure, `npm run validate`.
6. Development: prerequisites, the script table of S6.1, the test plan, screenshots.
7. Deployment: GitHub Pages through the workflow, Vercel through `vercel.json`, the `BASE_PATH` variable.
8. Attribution and licences: code MIT; ZFA, ZFS, and stage data CC BY 4.0 from ZFIN; the environment map source; link to `public/ATTRIBUTION.md` (D14).
9. Citation and how to report an anatomy error (issue template with structure id, stage, expected value, and source).

### S6.8 Work packages

D15 orders the work in four phases. Each phase ends when every package in it passes the D13 gates. Packages inside a phase run in parallel, one agent per package. A package edits only the files it owns. A package that needs a change outside its files writes the request into its pull request description instead of making the change.

#### Shared body frame API

The anatomy packages code against this application programming interface (API). WP-03 implements it and freezes it at the end of phase 1. The shapes follow D3 and D4.

```ts
// src/core/bodyModel.ts
export type Vec3 = readonly [number, number, number]        // mm; +x posterior, +y dorsal, +z left (D4)
export type Regime = 'R0' | 'R1' | 'R2' | 'R3' | 'R4'
export interface BodyCoord { u: number; v: number; w: number } // D3 body coordinates
export interface Station {
  u: number                                    // 0 snout tip, 1 posterior end of the notochord
  position: Vec3; tangent: Vec3; dorsal: Vec3; lateral: Vec3
  hD: number; hV: number; w: number            // dorsal half-height, ventral half-height, half-width, mm
}
export interface BodyState {
  t: number; regime: Regime; blend: number     // blend is 0..1 inside a regime boundary window
  stations: readonly Station[]                 // 128 stations, u ascending
  bodyLength: number; sl: number               // mm; sl equals bodyLength after 72 hpf (D6)
  headTrunkAngle: number; somiteCount: number; epiboly: number
  yolk: { center: Vec3; radius: number; extensionLength: number; extensionRadius: number } | null
  chorion: { center: Vec3; radius: number } | null
}
export function bodyModel(t: number): BodyState
export function frameAt(body: BodyState, u: number): Station     // interpolated; u may exceed 1 for fins
export function toWorld(body: BodyState, p: BodyCoord): Vec3     // station + v * (v > 0 ? hD : hV) * dorsal + w * halfWidth * lateral
export function slScale(body: BodyState, referenceSl: number): number  // body.sl / referenceSl (D6)
```

- **QP-60** After phase 1, a change to these signatures needs one pull request. That pull request updates every anatomy package and the unit tests.

#### Phase 1: skeleton

**WP-01 Tool chain and app shell.** Goal: a building, linting, testing empty app with the layout regions of section S5. Owns: `package.json`, `tsconfig.json`, `eslint.config.js`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json`, `.github/workflows/ci.yml`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/ui/tokens.css`. Depends on: D2 versions, research 07 tokens. Must not touch: `src/core`, `src/data`. Done when: `npm ci && npm run check && npm run lint && npm test && npm run build` exit 0 and `npm run preview` serves the shell.

**WP-02 Time axis, URL state, schema, seed data.** Goal: the pure modules that every panel reads. Owns: `src/core/timeAxis.ts`, `src/core/urlState.ts`, `src/core/schema.ts`, `src/data/stages.json`, `src/data/systems.json`, `src/data/handoffs.json`, `tests/unit/timeAxis.test.ts`, `tests/unit/urlState.test.ts`, `tests/unit/schema.test.ts`, `docs/schema/`. Depends on: section S3 schemas, D5, D7, D9, `stages.draft.json`. Must not touch: `src/viewer`, `src/ui`. Done when: `npx vitest run tests/unit/timeAxis.test.ts tests/unit/urlState.test.ts tests/unit/schema.test.ts` passes and `npm run validate` reports zero V08 and V12 findings.

**WP-03 Body model, primitives, interpolation.** Goal: the API above plus the D3 primitives. Owns: `src/core/bodyModel.ts`, `src/core/primitives/*.ts`, `src/core/interpolation.ts`, `src/data/body.json`, `tests/unit/bodyModel.test.ts`, `tests/unit/primitives.test.ts`, `tests/unit/interpolation.test.ts`. Depends on: research 05 sections 5, 15, 16; D3; D6; D8. Must not touch: `src/viewer`, `src/ui`, `src/data/structures.json`. Done when: `npx vitest run tests/unit/bodyModel.test.ts tests/unit/primitives.test.ts tests/unit/interpolation.test.ts` passes (QP-11 to QP-13).

**WP-04 Structure seed.** Goal: `structures.json` with the 15 system group nodes and ten structures across five systems (D15): chorion, yolk, blastoderm; notochord, somites; neural tube, spinal cord; eye, otic vesicle; heart. Owns: `src/data/structures.json`. Depends on: section S3 schema, the body frame API, 03 drafts. Must not touch: `src/core`, `src/viewer`. Done when: `npm run validate` exits 0 and `npx vitest run tests/unit/schema.test.ts` passes.

**WP-05 Viewer scene.** Goal: body, structures, picking, camera presets, and the `data-atlas-ready` attribute. Owns: `src/viewer/**`. Depends on: the body frame API, the store shape of section S4, the schemas. Must not touch: `src/core`, `src/data`, `src/ui`. Done when: `npx playwright test tests/e2e/screenshots.spec.ts -g "24-lateral"` passes the non-blank check.

**WP-06 Store and timeline bar.** Goal: the zustand store, the timeline bar, the top bar readout, and the systems rail with visibility toggles. Owns: `src/state/**`, `src/ui/TimelineBar/**`, `src/ui/TopBar/**`, `src/ui/SystemsRail/**`. Depends on: `timeAxis` API, research 07 section 3. Must not touch: `src/core`, `src/viewer`. Done when: smoke steps 1, 4, 5, 6 pass with `npx playwright test tests/e2e/smoke.spec.ts`.

**WP-07 Scripts.** Goal: the three scripts of D12 and the ZFIN snapshot. Owns: `scripts/**`, `tests/e2e/screenshots.spec.ts`, `docs/screenshots/`, `public/ATTRIBUTION.md`. Depends on: the schemas, the D13 rule list. Must not touch: `src/**`. Done when: `npm run validate` runs on the seed data, `npm run screenshots` writes 36 files, `npm run attribution` writes the file and exits 1 on a licence outside the allow-list.

#### Phase 2: anatomy fill

Five packages author structure records and keyframes. Each package owns the records whose `system` is in its group and the handoff rows between those records. Records sit in `structures.json` sorted by system in the D5 order and then by id, so parallel edits touch disjoint regions. Branches merge in the order A1 to A5, and `npm run validate` runs after every merge. Every package converts the draft sizes in micrometres to millimetres and to body coordinates. It cites the source per keyframe and applies the corrections of research 03, section 4. The D5 duplicate ownership list decides the writer: periderm, myotome, and median fin fold go to WP-A5; pharyngeal arch to WP-A3; head kidney and pharyngeal teeth to WP-A4; hypophysis and epiphysis to WP-A2.

Common done-when for every anatomy package: `npm run validate` exits 0 with zero findings for the owned records; `npx vitest run tests/unit/schema.test.ts` passes; `npm run screenshots` regenerates the 36 files with the new structures visible; the owning agent lists each record it could not place with the reason.

**WP-A1 Early embryo and axial.** Owns: records in `early_embryo` and `axial`; handoffs somites to myotomes (source side). Source: `03a` draft (42 records, of which the `extraembryonic` and `axial` ones). Custom builders: none. Must not touch: `src/core`, `src/viewer`, records of other groups.

**WP-A2 Nervous and sensory.** Owns: records in `nervous` and `sensory`; the neural plate to neural tube chain and the optic and otic handoffs (D9). Source: `03b` draft (45 records). Custom builders: `src/core/primitives/custom/eyeCup.ts`, `src/core/primitives/custom/earVesicle.ts`. Must not touch: other `src/core` files, `src/viewer`, records of other groups.

**WP-A3 Cardiovascular, blood and immune, respiratory.** Owns: records in `cardiovascular`, `hematopoietic_immune`, `respiratory`; the heart cone to chambers handoffs and the heart `aliasChain` (D9). Source: `03c` draft (45 records). Custom builders: `src/core/primitives/custom/heartLoop.ts`. Must not touch: other `src/core` files, `src/viewer`, records of other groups.

**WP-A4 Digestive, excretory, endocrine, reproductive.** Owns: records in those four systems; the pronephros to mesonephros and gonad handoffs (D9). Source: `03d` draft (43 records). Custom builders: `src/core/primitives/custom/gutLoop.ts`. Must not touch: other `src/core` files, `src/viewer`, records of other groups.

**WP-A5 Skeletal, muscular, fins, skin and pigment.** Owns: records in `skeletal`, `muscular`, `fins`, `integument_pigment`; the fin fold to fins and larval to adult stripe handoffs (D9); the SL-keyed events placed through the growth table (D6). Source: `03e` draft (45 records) plus the fins, muscular, and integument records of `03a`. Custom builders: none; uses `sheet` and `segmentArray`. Must not touch: `src/core`, `src/viewer`, records of other groups.

#### Phase 3: interaction

**WP-I1 Search and hierarchy tree.** Owns: `src/ui/Search/**`, `src/ui/Tree/**`. Depends on: record synonyms from the schema, store selection slice. Must not touch: `src/core`, `src/viewer`, `src/data`. Done when: smoke step 3 passes and the tree meets research 07, UX-AC-02.

**WP-I2 Info card and handoffs.** Owns: `src/ui/InfoCard/**`, `src/viewer/handoffs.ts`. Depends on: `handoffs.json`, `aliasChain`, the growth table. Must not touch: `src/core`, `src/data`, other viewer files. Done when: smoke step 8 passes and the card shows definition, stage window, ZFIN link, events, and the attribution footer (D1, D14).

**WP-I3 View presets, URL sync, export.** Owns: `src/viewer/cameraPresets.ts`, `src/viewer/export.ts`, `src/ui/ExportDialog/**`, the URL sync slice in `src/state`. Depends on: `urlState` API, D4 presets. Must not touch: `src/core`, `src/data`. Done when: smoke steps 7, 9, 10 pass and QP-14 still passes.

**WP-I4 Presentation mode, themes, settings, shortcuts.** Owns: `src/ui/Settings/**`, `src/ui/shortcuts.ts`, `src/ui/Presentation/**`, theme tokens. Depends on: research 07 sections 2.5, 3.10, 4.1. Must not touch: `src/core`, `src/viewer`, `src/data`. Done when: the phone check passes and every shortcut of research 07, section 3.10 has a smoke assertion.

#### Phase 4: hardening

**WP-H1 Tests and performance.** Owns: `tests/**`, `docs/perf/**`, the time-slicing code path in `src/viewer/rebuild.ts`. Done when: every test of QP-10 to QP-15 and QP-30 to QP-36 exists and passes, the QP-41 record exists for three machines, and `PERF=1 npx playwright test tests/e2e/perf.spec.ts` passes on the presenter's laptop.

**WP-H2 Accessibility.** Owns: ARIA attributes and focus handling across `src/ui/**`. Depends on: research 07, section 7. Must not touch: `src/core`, `src/data`. Done when: `tests/e2e/a11y.spec.ts` with `@axe-core/playwright` reports zero serious or critical violations on desktop and phone, and the QP-36 target-size check passes.

**WP-H3 Documentation and deploy.** Owns: `README.md`, `public/ATTRIBUTION.md`, `.github/workflows/ci.yml` deploy job, `vercel.json`, `docs/screenshots/`. Done when: the release checklist of S6.7 completes once end to end and both hosts serve the tagged build.

### S6.9 Risks and mitigations

| Risk | Effect | Mitigation | Owner |
|---|---|---|---|
| Procedural look reads as toy-like to a biologist audience | the talk loses credibility on the first slide | matte materials and neutral tone mapping (research 07, UX-VS-13; research 06, section 5); human review of the 36 screenshots at every phase gate (D13); the About sheet states that geometry is schematic (research 07, UX-ST-12) | WP-05, WP-H3 |
| Performance on an integrated GPU falls below 60 fps | stutter during a live scrub | `frameloop="demand"`, one material per system, instancing for somites, scales, and rays, pixel ratio drop during playback (research 06, section 8); the QP-41 record on an integrated-GPU laptop before release | WP-05, WP-H1 |
| Data errors visible to experts | a wrong stage window or size on a projected info card | the V01 to V14 rules; the research 03 corrections applied in phase 2; source per keyframe; an issue template for anatomy errors in the README | WP-07, WP-A1 to WP-A5 |
| TypeScript 7 drift | `npm install` pulls a version the lint tool chain rejects | pin `typescript` 5.9.x (D2); no caret ranges; upgrade only when `typescript-eslint` declares support (research 06, section 9) | WP-01 |
| Network-dependent assets | a conference network blocks the environment map or a font | ship the HDR under `public/` (D12) or use `RoomEnvironment`; no runtime fetch outside the origin; the offline toast of research 07, UX-ST-10 | WP-05 |
| Playwright 1.63 and Chrome 145 mismatch | local browser tests fail to launch | run one launch smoke first; fall back to `npx playwright install chromium` locally (research 06, section 7) | WP-01 |
| `postprocessing` caps `three` below 0.186 | an upgrade of one breaks the other | pin both; upgrade together and regenerate screenshots (research 06, section 9) | WP-01 |
| Parallel edits to `structures.json` conflict | merge failures in phase 2 | records sorted by system block; merge order A1 to A5; `npm run validate` after each merge | WP-A1 to WP-A5 |
| Wrong base path on GitHub Pages | blank page with 404 assets | `BASE_PATH` only in the deploy job; the post-deploy asset fetch of QP-51 | WP-H3 |
| SwiftShader pixels differ from laptop pixels | false screenshot diffs | no pixel baselines in version 1; the non-blank check only (QP-33) | WP-07 |
