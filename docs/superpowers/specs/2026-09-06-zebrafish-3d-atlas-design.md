# Zebrafish 3D Atlas: design specification

Date: 2026-09-06. Status: reviewed draft, 72 findings applied. Owner: Yang-Joon Kim.

Decision record: `2026-09-06-architecture-decisions.md` (D1 to D15). Every section below complies with it. A decision changes only by editing that file; this document does not re-open one.

## Abstract

Extension of 2026-09-09, renamed 2026-09-12 (D18): `?lab=1` reveals an experimental Reporter
preview panel using existing modeled ZFA labels. Up to 24 rules select anatomy, optional modeled
parts, inclusive hpf windows and fluorescent proteins; the skin record is never a target. Equal
endpoints mean a snapshot. Reused reporters union coverage, with composite and individual-channel
views. Presence, sex and visibility still apply, and every present structure stays pickable while
the preview is on. An emissive material pass displays targets against adjustable neutral fish
context on the `'fluorescence'` theme-token variant; no geometry rebuild is needed for a
rule/color change. Versioned `fp` URL state and optional bookmark configuration preserve rules; a
bookmark with no fluorescence field keeps the live rules. PNG export retains fluorescence and
identifies a schematic target preview. This is a user-authored tissue visualization, not a
prediction of enhancer activity or single-cell expression. D18 governs this extension where the
original version-1 sections differ.

The zebrafish 3D atlas is a static web viewer for talks. One time axis runs from the 1-cell zygote at 0 hours post fertilization (hpf) to 180 days post fertilization (dpf), which is 4320 hpf. The viewer draws one procedural fish at the current time; its structures appear, move and grow as the user scrubs. Every structure carries an id from the Zebrafish Anatomy Ontology (ZFA) and a stage window from the Zebrafish Stage Ontology (ZFS). Both ontologies come from the Zebrafish Information Network (ZFIN). This specification has six sections and a list of open conflicts. Section 1 states the users, the requirements and the success criteria for version 1. Section 2 fixes the stack, the module layout, the store, the rendering rules, the URL state and the export pipeline. Section 3 defines the five data files and their schemas, the merge plan for the 220 research records, and the validation rules. Section 4 defines the body frame, the body model with its five regimes and its 32 keyframes, and the growth table. It also defines the primitive builders, the interpolation rules, the topology handoffs and the rebuild scheduler. Section 5 defines the timeline bar, the panels, the interactions, the visual tokens, the accessibility rules and the application states. Section 6 defines the tool chain, the tests, the validation script and the browser tests. It also defines the performance procedure, continuous integration, the release checklist and the work packages. Section 7 lists the conflicts with the decision record that the section authors and the review raised and that the owner must settle. Requirement ids carry a prefix per section: OV, AR, DM, BG, UX or UI, and QP.

## Contents

- [1. Overview and requirements](#1-overview-and-requirements)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Users and moments of use](#12-users-and-moments-of-use)
  - [1.3 Goals and non-goals](#13-goals-and-non-goals)
  - [1.4 Glossary](#14-glossary)
  - [1.5 Success criteria for version 1](#15-success-criteria-for-version-1)
  - [1.6 Research files and ownership](#16-research-files-and-ownership)
- [2. Architecture and runtime](#2-architecture-and-runtime)
  - [2.1 Stack](#21-stack)
  - [2.2 Module layout](#22-module-layout)
  - [2.3 Data flow](#23-data-flow)
  - [2.4 Store shape](#24-store-shape)
  - [2.5 Rendering](#25-rendering)
  - [2.6 URL state](#26-url-state)
  - [2.7 Export pipeline](#27-export-pipeline)
  - [2.8 Presentation mode and embed mode](#28-presentation-mode-and-embed-mode)
  - [2.9 Performance budget](#29-performance-budget)
  - [2.10 Error handling](#210-error-handling)
  - [2.11 Extensions of the research files](#211-extensions-of-the-research-files)
- [3. Data model](#3-data-model)
  - [3.1 Data files](#31-data-files)
  - [3.2 Schemas](#32-schemas)
  - [3.3 systems.json](#33-systemsjson)
  - [3.4 Group nodes](#34-group-nodes)
  - [3.5 Merge plan](#35-merge-plan)
  - [3.6 Colour exceptions (D10)](#36-colour-exceptions-d10)
  - [3.7 Attribution data](#37-attribution-data)
  - [3.8 Validation rules](#38-validation-rules)
- [4. Body model and geometry](#4-body-model-and-geometry)
  - [4.1 Body frame](#41-body-frame)
  - [4.2 The five regimes](#42-the-five-regimes)
  - [4.3 The `body.json` keyframe table](#43-the-bodyjson-keyframe-table)
  - [4.4 The growth table (D6)](#44-the-growth-table-d6)
  - [4.5 Primitive catalogue](#45-primitive-catalogue)
  - [4.6 Custom builders](#46-custom-builders)
  - [4.7 Interpolation rules](#47-interpolation-rules)
  - [4.8 Topology handoffs (D9)](#48-topology-handoffs-d9)
  - [4.9 Rebuild scheduling](#49-rebuild-scheduling)
  - [4.10 Worked example: notochord and heart](#410-worked-example-notochord-and-heart)
  - [4.11 Visual calibration targets](#411-visual-calibration-targets)
- [5. Timeline bar and user interface](#5-timeline-bar-and-user-interface)
  - [5.1 Layout](#51-layout)
  - [5.2 Timeline bar](#52-timeline-bar)
  - [5.3 Systems rail](#53-systems-rail)
  - [5.4 Info card](#54-info-card)
  - [5.5 Search](#55-search)
  - [5.6 Top bar](#56-top-bar)
  - [5.7 Viewer interactions](#57-viewer-interactions)
  - [5.8 Themes and tokens](#58-themes-and-tokens)
  - [5.9 Accessibility](#59-accessibility)
  - [5.10 First-run hint, loading, error and empty states](#510-first-run-hint-loading-error-and-empty-states)
  - [5.11 Export and share dialogs](#511-export-and-share-dialogs)
  - [5.12 Slide kit](#512-slide-kit)
  - [5.13 Dissect slider](#513-dissect-slider)
  - [5.14 Vocabulary search](#514-vocabulary-search)
- [6. Testing, tooling, deployment and implementation plan](#6-testing-tooling-deployment-and-implementation-plan)
  - [6.1 Tool chain and npm scripts](#61-tool-chain-and-npm-scripts)
  - [6.2 Unit test plan for src/core](#62-unit-test-plan-for-srccore)
  - [6.3 Data validation script](#63-data-validation-script)
  - [6.4 Playwright plan](#64-playwright-plan)
  - [6.5 Performance measurement procedure](#65-performance-measurement-procedure)
  - [6.6 Continuous integration and deployment](#66-continuous-integration-and-deployment)
  - [6.7 Release checklist and README outline](#67-release-checklist-and-readme-outline)
  - [6.8 Work packages](#68-work-packages)
  - [6.9 Risks and mitigations](#69-risks-and-mitigations)
- [7. Open conflicts for the owner](#7-open-conflicts-for-the-owner)
  - [7.3 From the review](#73-from-the-review)

## 1. Overview and requirements

### 1.1 Purpose

The zebrafish 3D atlas is a static web viewer for talks. One time axis runs from the 1-cell zygote at 0 hours post fertilization (hpf) to 180 days post fertilization (dpf). That end point is 4320 hpf (decision D1). The viewer draws one procedural fish at the current time. Structures appear, move, and grow as the user scrubs. Every structure carries an id from the Zebrafish Anatomy Ontology (ZFA) and a stage window from the Zebrafish Stage Ontology (ZFS). The app has no backend. One build deploys to GitHub Pages and to Vercel (D1). The decision record `2026-09-06-architecture-decisions.md` binds every section of this spec.

### 1.2 Users and moments of use

Research 07 section 1 defines four moments of use. The table condenses them.

| Moment | Device and environment | Pointer | What the user needs |
|---|---|---|---|
| M1 Talk speaker | Laptop mirrored to a projector, dark room, 1920 by 1080 or 1280 by 720 output; audience at 5 to 20 m | Trackpad, clicker, arrow keys | Only the timeline bar on screen; a large readout; instant stage steps; no surprise pop-ups |
| M2 Poster visitor | Phone from a QR code, bright hall, 390 by 844 px portrait | One thumb | Load in seconds on a hall network; a large thumb target; the state the poster author encoded in the URL |
| M3 Lab member | Laptop or monitor, 1440 by 900 px and up | Mouse or trackpad, keyboard | Tree, search, ZFA definitions, ZFIN links, multi-select, section planes |
| M4 Slide author | Same as M3 | Mouse, keyboard | A deterministic camera and time from a URL; PNG at 2x or 4x with a transparent background; labels and a scale bar on demand |

M1 is the primary moment (research 07 section 1). The requirements below follow from the four moments.

- **OV-01** Every pointer target measures at least 44 by 44 CSS px. This meets Web Content Accessibility Guidelines (WCAG) 2.2 level AAA (research 07 section 1, UX-US-01).
- **OV-02** Text contrast is at least 4.5:1 under 24 px and 3:1 at 24 px and above. Controls and swatches reach 3:1 against their surroundings (research 07 section 1, UX-US-02).
- **OV-03** The URL encodes time, selection, camera, and visibility (D1). A URL pasted into a slide restores the same view (research 07 section 1, UX-US-03).
- **OV-04** Presentation mode hides every control except a timeline strip. The strip appears on pointer movement, on a key press and while playback runs. It hides 3 s after the last of these ends, unless the presenter pins it (UI-37). The keyboard alone drives time, view presets, and bookmarks (research 07 section 1, UX-US-04).
- **OV-05** The first interactive frame arrives within 2 s on a 10 Mbit/s connection (research 07 section 1, UX-US-05). Geometry is procedural, so the payload holds records and keyframes, not meshes (D3). The hardening slice measures this budget (D15).
- **OV-06** The dark theme is the default. The light theme is one click away (research 07 section 1, UX-US-06).
- **OV-07** No action opens a modal dialog in presentation mode except the export dialog (research 07 section 1, UX-US-07).
- **OV-08** The layout works on a phone at 390 by 844 px portrait (D1; research 07 section 2.1). A mobile-first layout is out of scope (D1).
- **OV-09** Export writes a PNG at 1x, 2x, or 4x of the viewport, or at a fixed slide size, with an optional transparent background (D1; AR-52).

### 1.3 Goals and non-goals

Decision D1 fixes the scope of version 1. The goals are:

- **OV-10** The time axis runs from 0 hpf to 4320 hpf. The slider stops at 180 dpf. The ZFS adult stage continues to 730 dpf in the data, and the slider does not (D1).
- **OV-11** The viewer shows one fish at one time point (D1).
- **OV-12** Every structure is selectable. The info card shows the ZFA definition, the ZFIN stage window, a ZFIN link, developmental events, and a "Jump to first appearance" button (D1).
- **OV-13** Every structure is procedural and placed in the body frame. No record stores world-space vertices (D3).
- **OV-14** The app is static, with no backend. The same build deploys to GitHub Pages and Vercel (D1).
- **OV-15** Code ships under MIT. Data derived from ZFIN carries the CC BY 4.0 credit in `public/ATTRIBUTION.md` and in the info card footer (D14).

The non-goals for version 1 are:

| Non-goal | Source |
|---|---|
| Real imaging meshes | D1 |
| Cross-sections of real data | D1 |
| Single-cell overlays | D1 |
| Multi-fish comparison | D1 |
| A mobile-first layout | D1 |
| An exploded view | D1 |
| Time after 180 dpf on the slider | D1 |
| Morph-target baking | D3 |
| Slow and fast growth tracks | D6 |

### 1.4 Glossary

Every section of this spec uses these names and no synonyms.

| Term | Meaning | Source |
|---|---|---|
| structure | One record in `structures.json`. It has one ZFA id, one system, and procedural geometry or `geometry: null`. | D3, D5 |
| system | One of the 15 fixed groups in `systems.json`. It owns a palette slot and a list of ZFA root ids. | D5 |
| group node | A structure record with `geometry: null` that the UI tree needs as a parent, for example "brain". | D5 |
| stage | One of the 43 named ZFS stages. Its hpf start and end come from the ZFIN stage table. The 44th row of that table, `ZFS:0000000` Unknown, is not a stage (section 7.3). | D7 |
| period | One of the 10 ZFS stage groups: zygote, cleavage, blastula, gastrula, segmentation, pharyngula, hatching, larval, juvenile, adult. | D7; research 07 terms |
| headline stage | One of the 18 stages that D7 names for the timeline bar ticks and for the screenshot set. | D7, D13 |
| keyframe | The parameter values of one structure at one hpf value. Parameters interpolate with a smoothstep between the bracketing keyframes. | D3 |
| presence window | The interval from `visibleFromHpf` to `modelEndHpf` during which a structure exists. It has a fade window at each end. | D3 |
| handoff | A case where one structure becomes one or more others, listed in `handoffs.json`. The viewer cross-fades the source and the targets over the stated window. | D9 |
| body frame | The coordinate system `{u, v, w}` attached to the spine. `u` runs along the spine, `v` from ventral to dorsal, `w` from left to right. | D3 |
| body model | The pure TypeScript module `bodyModel(t)`. It returns the spine, the cross-section profile, the yolk, the chorion, and the body length at time `t`. | D3 |
| regime | One of five equation sets R0 to R4. The body model switches regime by time and blends across each boundary. | D3 |
| growth track | The table `growth` in `stages.json` that maps hpf to body length. Version 1 has one growth track. | D6 |
| time axis | The mapping from hpf to track position. `stages.json` owns it as `timeAxis` with seven segments. | D7 |
| headline tick | The drawn tick and label for a headline stage on the timeline bar. It is drawn only when it is at least 8 px from the previous drawn tick. | D7 |
| info card | The panel that shows the selected structure: ZFA definition, stage window, ZFIN link, events, and the jump button. | D1 |
| timeline bar | The full-width control that holds the track, the thumb, the transport controls, and the readout. | D7; research 07 section 3 |
| view preset | One of six named camera positions: lateral, dorsal, ventral, anterior, posterior, three-quarter. | D4 |
| presentation mode | The layout that hides all controls except a timeline strip and a floating info card. The `P` key or the Present button toggles it. | research 07 sections 2.1 and 2.5 |
| embed mode | The layout that `?embed=1` selects. It hides the top bar and the rail. It keeps a compact timeline bar and a floating info card and adds a footer with the ZFIN credit. | research 07 section 6.3 |

Standard length (SL) is the post-embryonic length measure of Parichy et al. 2009 and of Singleman and Holtzman 2014 (research 02 section 3). Post-embryonic sizes and events use SL and reach the time axis through the growth track (D6).

### 1.5 Success criteria for version 1

A reviewer checks each item and records the result. The build is version 1 when every box is checked. The table maps each group of criteria to the command that produces the evidence (D12, D13).

| Criteria | Evidence |
|---|---|
| OV-20, OV-22, OV-23, OV-25 | A screen recording of one scrub and one 1x playback in the built app |
| OV-21 | `npm run test` output |
| OV-24, OV-26 to OV-32 | `npm run validate` output |
| OV-33 to OV-40 | A manual pass in the built app on a desktop browser and on a phone |
| OV-41 | The Playwright run of `scripts/screenshot.ts` and the PNG files under `docs/screenshots/` |
| OV-42 | The five command outputs in one terminal session |
| OV-43, OV-44 | The repository tree and the two live URLs |

Body and time:

- [ ] **OV-20** Scrubbing from 0 to 4320 hpf at 1x shows a continuous body. The only pops are the handoffs in D9, each inside its window.
- [ ] **OV-21** The body model tests pass (D13). They check for no NaN at 1 hpf resolution, a monotonic body length after 10 hpf, and continuous positions across the four regime boundaries.
- [ ] **OV-22** The chorion ends at 72 hpf with a fade from 48 hpf. The yolk is absent after 168 hpf (D8).
- [ ] **OV-23** Playback at 1x crosses the full track in 60 s and stops at the axis end (D7).
- [ ] **OV-24** The time axis has seven segments, is monotonic, and sums to 100 percent (D7, D13).
- [ ] **OV-25** The default view looks along -z. The fish shows its left side with the snout on the left (D4).

Data:

- [ ] **OV-26** Every structure record has a ZFA id that resolves in `anatomy_item.txt`. There is one record per id (D13).
- [ ] **OV-27** Every structure has exactly one `system` from the 15 slots in `systems.json` (D5).
- [ ] **OV-28** Every stage window matches ZFIN. Each override carries a note (D13).
- [ ] **OV-29** Keyframes are sorted and lie inside the presence window. Body coordinates lie inside range (D13).
- [ ] **OV-30** Every parent id and every handoff id resolves (D13).
- [ ] **OV-31** The heart is one record, `ZFA:0000114`, with an `aliasChain` of the five ZFIN heart terms. Four chamber records exist from 42 hpf (D9).
- [ ] **OV-32** `npm run validate` passes with zero errors (D13).

Interaction:

- [ ] **OV-33** Clicking any visible structure selects it. The info card shows the five items of OV-12.
- [ ] **OV-34** "Jump to first appearance" moves time to the structure's first fully visible time, `visibleFromHpf + fadeInHpf`, snapped to the containing stage start when snap is on (D1, D3; UI-20).
- [ ] **OV-35** Selection draws a two-tone outline in the focus colour with a background-colour ring and changes no fill (D10; AR-35).
- [ ] **OV-36** Each of the six view presets frames the body (D4).
- [ ] **OV-37** A copied URL opens in a new tab with the same time, selection, camera, visibility and theme (D1). The check runs once under each `prefers-color-scheme` value.
- [ ] **OV-38** In presentation mode the keyboard alone steps time and switches view presets. The strip stays visible while playback runs and hides 3 s after the last input once playback stops (OV-04).
- [ ] **OV-39** At 390 by 844 px the fish and the timeline bar are visible (OV-08). The page has no horizontal scroll (research 07 section 7, UX-AC-12).

Export and delivery:

- [ ] **OV-40** PNG export at 1x, 2x, and 4x each produce a file. An opaque export pixel matches the on-screen pixel within 2 of 255 per channel, so the export carries the same tone mapping as the canvas (AR-51). The transparent option composites onto a white slide and onto a black slide with no fringe, and the exported overlays stay legible on both (AR-55, AR-56; research 07 section 6.1, UX-EX-03).
- [ ] **OV-41** 18 headline screenshots exist in lateral view and 18 in dorsal view under `docs/screenshots/`. The Playwright run confirms that no canvas is blank (D13).
- [ ] **OV-42** `npm run check`, `npm run lint`, `npm run test`, `npm run validate`, and `npm run build` pass (D13).
- [ ] **OV-43** `public/ATTRIBUTION.md` credits ZFIN under CC BY 4.0. The info card footer shows the credit. No Kimmel 1995 figure is in the repository (D14).
- [ ] **OV-44** The same build is live on GitHub Pages and on Vercel (D1).

### 1.6 Research files and ownership

Decision D11 assigns ownership of values. Where a research file contradicts the decision record, the decision record wins.

| File | Owns | What the spec takes from it |
|---|---|---|
| `01-human-atlas-reference.md` | No values. It describes the reference implementation. | The panel anatomy, the systems list, the isolate action, and the hover chip that the layout borrows (research 07 section 0) |
| `02-developmental-staging.md`, `stages.draft.json` | The 43 named ZFS stages (the ZFIN table has 44 rows with Unknown), the 10 periods, and the event list | Stage bounds and period bounds. D7 replaces the draft time axis. D8 replaces the event values where they differ. |
| `03a` to `03e` `.md` and `.draft.json` | Organ numbers: position, size, and keyframes of 220 structure records (D11) | The structure records after the corrections in `03-anatomy-factcheck-findings.md` section 4 |
| `03-anatomy-factcheck-findings.md` | No values. It is a work list. | The corrections in priority order; 29 high and 21 medium findings (section 2) |
| `04-imaging-resources.md` | Licence and link data for external atlases | Outbound links for the info card. No mesh ships in version 1 (D1). |
| `05-morphometrics.md`, `morphometrics.draft.json` | Body-scale numbers (D11): egg, yolk, body length, head-trunk angle, posture | Regime parameters and growth track inputs for the body model (D3, D6) |
| `06-viewer-tech.md` | Library choices (D11) | The pure core under `src/core/` and the interpolation strategy. D2 pins the versions. |
| `07-design-brief.md` | Every UX value (D11): sizes, motion, tokens, palette | Layout, timeline bar, colour tokens, export, accessibility, and application states. D5 and D7 replace its system names and its track anchors. |

Known overrides that the decision record applies to the research files:

| Research value | Decision value |
|---|---|
| Research 07 section 3.2: 13 track anchors, adult band from 90 dpf | D7: seven segments from 0 to 4320 hpf |
| Research 07 section 3.4: 17 headline labels; research 02 section 4: 14 headline ticks | D7: 18 headline ticks |
| Research 07 section 4.2: slot names hematopoietic, immune, musculature, integument, renal, yolk | D5: 15 system ids with `hematopoietic_immune`, `muscular`, `integument_pigment`, `excretory`, `early_embryo` |
| `stages.draft.json` `timeAxis.domainHpf` ends at 2160 | D1, D7: the domain ends at 4320 hpf |
| Research 07 section 3.7: "Last stage" sets `t` to 2160 | D1: the axis ends at 4320 hpf. `End` moves to 2160 hpf, the start of the last stage, and `Shift+End` moves to the axis end (section 5). |
| ZFIN page head-trunk angle 55 degrees at 60 hpf | D8: 35 degrees, interpolated |

## 2. Architecture and runtime

This section fixes the stack, the module layout, the data flow, and the store. It also fixes the rendering rules, the URL state, the export pipeline, the two view modes, the performance budget, and the error paths. Time values are in hours post fertilization (hpf) unless a value says days post fertilization (dpf). Body sizes after 72 hpf are stated at a standard length (SL). Structure ids come from the ZFIN anatomy ontology (ZFA) and stage ids from the ZFIN stage ontology (ZFS). Decisions D1 to D15 refer to the decision record.

### 2.1 Stack

The versions below are the D2 versions. `package.json` already pins them. Research 06, section 1, records the peer ranges that fix each choice.

| Package | Version | Justification |
|---|---|---|
| react, react-dom | 19.2.x | inside the `>=19 <19.3` peer window of @react-three/fiber 9.7 (research 06, section 1) |
| three | 0.185.1 | newest release inside every peer range; ships `readRenderTargetPixelsAsync` and `NeutralToneMapping` (research 06, sections 1 and 5) |
| @react-three/fiber | 9.7.x | one React component per structure; built-in pointer events; `frameloop="demand"` (research 06, section 2) |
| @react-three/drei | 10.7.x | `Html`, `OrbitControls`, `Outlines`, `Bounds`, `PerformanceMonitor` without custom code (research 06, section 10) |
| @react-three/postprocessing | 3.1.x | `Outline` with `xRay` and SMAA behind the quality toggle only; caps three below 0.186 (research 06, section 9) |
| zustand | 5.x | one store read by the UI and the scene; already a drei dependency (research 06, section 10) |
| zod | 4.x | one schema for data files and URL state; `z.toJSONSchema()` emits Draft 2020-12 for editors (research 06, section 6) |
| tailwindcss, @tailwindcss/vite | 4.3.x | panel styling from CSS variables; peer range includes Vite 8 (research 06, section 1) |
| lucide-react | 1.41.0 | icon names verified against `lucide-static` in research 07, section 4.7 |
| vite | 8.2.x | static build with Rolldown; `base` from `BASE_PATH` for GitHub Pages (research 06, section 7) |
| typescript | 5.9.x | pinned by D2; the lint tool chain does not support TypeScript 7 (research 06, section 1) |
| vitest | 5.x | core and data tests run in Node without a WebGL context (research 06, section 7) |
| @playwright/test | 1.63.x | system Chrome with SwiftShader flags for screenshots on a node without a GPU (research 06, section 7) |
| eslint, typescript-eslint | 10.x, 8.x | flat config; typescript-eslint 8.69 accepts ESLint 10 (research 06, section 7) |
| postprocessing | 6.39.4 | the peer of @react-three/postprocessing; listed as a direct dependency so that AR-01 pins it (its peer range caps three below 0.186) |
| @react-three/eslint-plugin | 0.1.2 | devDependency; the two rules of section 6.1.2 are confirmed against it in WP-01 |

- **AR-01** Every dependency is pinned to an exact version in `package.json`, including the peer package `postprocessing`. An upgrade of three or postprocessing re-baselines the screenshots under `docs/screenshots/` before merge.
- **AR-02** The app installs no shadcn. The six local UI components that D2 names (button, badge, slider, switch, sheet, combobox) are files under `src/ui/primitives/`.
- **AR-03** The Node engine is `>=22.12`. The scripts under `scripts/` run with `node <file>.ts` through type stripping (D2).

### 2.2 Module layout

D12 fixes the top-level folders. The table below expands them to files. A file name in this table is the name the implementation uses.

- **AR-04** `src/core/` imports no DOM API, no React, and no three.js module. The one exception is `src/core/primitives/toBufferGeometry.ts`, which imports `BufferGeometry` and `BufferAttribute` from `three`. Every other builder returns plain typed arrays. `src/core/spine.ts` implements its own centripetal Catmull-Rom sampling and parallel-transport frames. An ESLint `no-restricted-imports` rule bans `three`, `react`, and `@react-three/*` under `src/core/**` and `src/state/**`, with one override for `toBufferGeometry.ts`.
- **AR-05** Imports flow one way: `core` imports nothing from the other folders; `state` imports `core`; `viewer` and `ui` import `core` and `state`; `viewer` and `ui` never import each other. `App.tsx` composes both.
- **AR-06** The five JSON files under `src/data/` are imported statically with `with { type: 'json' }`. Vite bundles them into the build. There is no runtime fetch of atlas data. `src/data/index.ts` passes `body.json` and the growth table to `createBodyModel` once at load (BG-10); scripts under `scripts/` read the same files through `fs` (QP-03).

#### 2.2.1 `src/core/`

| File | Purpose |
|---|---|
| `schema.ts` | zod schemas for the five data files (section 3.2): `SystemRecord`, `StagesFile`, `StructureRecord` with `GeometrySpec` as a discriminated union on `kind`, `BodyFile`, `HandoffRecord` (D3, D5, D6, D7, D9); `parseAtlasData(raw)` runs the five root schemas, resolves cross references, and returns `AtlasData` or an `AtlasParseError` with file, path, and message |
| `jsonSchema.ts` | `z.toJSONSchema()` for the five root schemas; `scripts/validate-data.ts` writes them to `docs/schema/` |
| `attribution.ts` | the typed attribution constant (DM-04); the info card footer and `scripts/build-attribution.ts` read it |
| `bodyModel.ts` | `createBodyModel(body, growth)` returns `bodyModel(hpf): BodyFrame` (D3, BG-09, BG-10): 128 spine stations with position, tangent, dorsal normal, lateral binormal, `hD`, `hV`, `hW`; yolk, chorion, epiboly, somite count, body length, head-trunk angle; `frameAt` and `toWorld`; interpolates `body.json` linearly (BG-28) |
| `spine.ts` | centripetal Catmull-Rom curve, arc-length sampling, parallel-transport frames (BG-01, BG-03); no three import |
| `growth.ts` | `bodyLengthAt(hpf)`, `slAt(hpf)` and `slScale(hpf, sizeRefSl) = slAt(max(hpf, 72)) / sizeRefSl` from the `growth` table (D6, BG-26, BG-43) |
| `primitives/types.ts` | `GeometryOut { positions, normals, uvs, indices, bounds, placement? }` as typed arrays; `Lod`; the `PrimitiveBuilder` interface (BG-29); `placement` carries the world transform of a local-frame build (AR-72) |
| `primitives/tessellation.ts` | row and radial counts per primitive kind for the `interactive` and `final` levels (BG-29, BG-30); the interactive counts are chosen at load from a measured build cost (AR-73) |
| `primitives/ellipsoid.ts`, `superellipsoid.ts`, `tube.ts`, `lathe.ts`, `segmentArray.ts`, `sheet.ts`, `shell.ts` | the seven primitives of D3 with analytic normals (section 4.5) |
| `primitives/custom/heartLoop.ts`, `gutLoop.ts`, `eyeCup.ts`, `earVesicle.ts`, `somiteChevron.ts`, `finSheet.ts`, `primordiumMover.ts` | the custom builders (section 4.6); the first four are the D3 set |
| `primitives/buildStructure.ts` | `buildStructure(record, frame, t, level): GeometryOut`; interpolates keyframes, converts body coordinates, dispatches on `kind` |
| `primitives/toBufferGeometry.ts` | `GeometryOut` to `BufferGeometry`; `writeInto(geometry, out)` updates existing attributes in place when counts match and sets `boundingBox` and `boundingSphere` from `out.bounds` (AR-72); the one file under `src/core/` that imports `three` |
| `interpolation.ts` | `bracket(keyframes, t)` and `interpolateParams(spec, keyframes, t, sl)`: keyframe bracketing and smoothstep parameter blend (D3, BG-41 to BG-43) |
| `presence.ts` | `presenceAt(record, t)` returns `{ present, fade }` from `visibleFromHpf`, `modelEndHpf`, the fade window, and handoff cross-fades (D3, D9); `present` is true when the fade opacity is above 0 (BG-44); `presentIds(records, t)` returns the sorted id list that the store caches (AR-74) |
| `handoffs.ts` | resolves an SL window through the growth table and seeds a target's first keyframe from the driver (BG-49, BG-50); the viewer and `scripts/validate-data.ts` share it |
| `timeAxis.ts` | `hpfToTrack` and `trackToHpf` from the D7 segment table (UI-03); stage lookup; headline ticks; snap target |
| `playback.ts` | track distance per second for each speed; 1x crosses the track in 60 s (D7) |
| `format.ts` | readout strings for `hpf`, `dpf`, and `auto` units (research 07, UX-TL-24) and the temperature relabel (UI-14) |
| `urlState.ts` | the `UrlState` zod schema, `parseUrl`, `serializeUrl` |
| `rebuildQueue.ts` | pure priority queue: `replace(jobs)` keeps the age of a job that survives the replacement, `drain(budgetMs, now)` serves jobs older than 4 frames first (AR-12); no timers, no three |
| `palette.ts` | system hue per theme, lightness step per depth, exception list (D10; research 07, section 4.2) |
| `paramUnits.ts` | the suffix rule of DM-35: which parameter names rescale by SL, which are angles, which are counts; `interpolation.ts` and the unit test of QP-16 read it |

#### 2.2.2 `src/data/`

| File | Purpose |
|---|---|
| `systems.json`, `stages.json`, `structures.json`, `body.json`, `handoffs.json` | the five data files (D12) |
| `index.ts` | imports the five files and exports `loadAtlasData()`, a thin call to `parseAtlasData` |

#### 2.2.3 `src/state/`

| File | Purpose |
|---|---|
| `store.ts` | `createAtlasStore()` and the `useAtlas` hook; combines the slices below |
| `slices/time.ts`, `selection.ts`, `visibility.ts`, `view.ts`, `appearance.ts`, `mode.ts`, `runtime.ts` | one slice per concern; each slice owns its fields and actions |
| `urlSync.ts` | subscribes to the store, serialises the URL subset, calls `history.replaceState` under a 300 ms throttle |
| `persist.ts` | reads and writes `theme`, rail widths, and the first-run flag in `localStorage`; a no-op in embed mode |
| `shortcuts.ts` | key to action table; ignored while focus is in a text field |

#### 2.2.4 `src/viewer/`

| File | Purpose |
|---|---|
| `Viewer.tsx` | the R3F `Canvas` with the settings of AR-21; the WebGL probe; context-loss handlers |
| `Scene.tsx` | composes lights, environment, body, structures, selection, labels, camera rig, section plane |
| `Lights.tsx` | hemisphere, key, and rim lights, each with its `target`, parented to the camera (AR-24) |
| `Environment.tsx` | `RoomEnvironment` through `PMREMGenerator` at intensity 0.3 (AR-23) |
| `Body.tsx` | the yolk and chorion meshes of the `bodyDriven` records (DM-31) from `bodyModel(t)`; the skin is the whole-organism structure ZFA:0001094 and goes through `StructureMesh` |
| `Structures.tsx` | mounts one `StructureMesh` or `InstancedStructure` per record with geometry once at load and toggles `visible` from `presentIds` (AR-74); it never mounts or unmounts a mesh inside the frame loop |
| `StructureMesh.tsx` | one mesh per structure; holds the geometry ref, material state, fade, layers, `renderOrder`, and the local-frame transform of AR-72 |
| `InstancedStructure.tsx` | `segmentArray` structures as two `InstancedMesh` objects (left and right, BG-32) with `count` set per rebuild |
| `rebuild.ts` | the rebuild driver: store subscription, settle timer, the `useFrame` slice loop of AR-10 to AR-14, the geometry cache of BG-54 |
| `materials.ts` | material factory per structure; state transitions for opaque, fading, ghost, isolated context, x-ray |
| `picking.ts` | raycaster layer rule, `pickable` rule, the section-plane filter of AR-34, tap thresholds, `stopPropagation` on first hit |
| `Selection.tsx` | two drei `Outlines` children (ring and core, AR-35) around selected meshes; `PostOutline.tsx` mounts the composer when quality is `presentation` |
| `Hover.tsx` | emissive tint, cursor, hover chip anchor |
| `Labels.tsx` | drei `Html` labels under the budget of 8; priority and overlap pass |
| `CameraRig.tsx` | `PerspectiveCamera`, `OrbitControls`, presets, fit, reserved rectangle, near and far update |
| `SectionPlane.tsx` | one clipping plane, axis and position, drag rectangle |
| `ScaleBar.tsx`, `Gizmo.tsx` | scale bar and orientation gizmo overlays |
| `Clock.tsx` | advances `time` during playback once per frame |
| `export/renderToTarget.ts`, `tile.ts`, `encodePng.ts`, `overlay.ts`, `exportPng.ts` | the export pipeline of AR-51 to AR-58 |

#### 2.2.5 `src/ui/`

| File | Purpose |
|---|---|
| `TopBar.tsx`, `Search.tsx`, `ViewPresets.tsx`, `ThemeToggle.tsx` | top bar and its controls |
| `SystemsRail.tsx`, `SystemRow.tsx`, `RailPresets.tsx`, `XraySlider.tsx`, `SectionControl.tsx`, `Tree.tsx` | the rail |
| `TimelineBar.tsx`, `Track.tsx`, `Transport.tsx`, `Readout.tsx`, `StageCard.tsx` | the timeline bar |
| `InfoCard.tsx` | the info card |
| `ExportDialog.tsx`, `Settings.tsx`, `ShortcutSheet.tsx`, `About.tsx`, `Toast.tsx`, `FirstRunHint.tsx` | dialogs and transient UI |
| `PresentationOverlay.tsx`, `EmbedFooter.tsx` | the two mode-specific layers; the overlay holds the fullscreen chip and the black screen of UI-40 |
| `KitSheet.tsx`, `KitMarkers.tsx` | the slide kit sheet and the bookmark markers on the strip (section 5.12) |
| `ErrorScreens.tsx` | data error card and WebGL unavailable screen |
| `primitives/Button.tsx`, `Badge.tsx`, `Slider.tsx`, `Switch.tsx`, `Sheet.tsx`, `Combobox.tsx` | the six local primitives (AR-02) |
| `hooks/useShortcuts.ts`, `useReducedMotion.ts`, `useBreakpoint.ts`, `useIdleCursor.ts` | UI hooks |

#### 2.2.6 Other folders

| Path | Purpose |
|---|---|
| `src/main.tsx`, `src/App.tsx`, `src/styles.css` | React root, layout shell, Tailwind tokens |
| `scripts/validate-data.ts` | the D13 data checks (section 3.8); exits non-zero when any error rule fails |
| `scripts/gen-body.ts` | evaluates the regime equations of section 4.2 at the 32 keyframe times and writes `src/data/body.json`; `npm run validate` re-runs it and fails on a diff (BG-25) |
| `scripts/screenshot.ts` | drives Playwright over the 18 headline stages in lateral and dorsal views (D13) |
| `scripts/build-attribution.ts` | writes `public/ATTRIBUTION.md` from the ZFIN version strings (D14) |
| `tests/unit/*.test.ts` | vitest: schema, body model, builders, interpolation, time axis, URL round trip, queue |
| `tests/e2e/*.spec.ts` | Playwright: screenshots, selection, URL, export size, WebGL probe, presentation mode (QP-37) |
| `public/favicon.svg`, `public/ATTRIBUTION.md`, `public/fallback-24hpf.png` | static assets; the fallback PNG is a build output of `scripts/screenshot.ts` |

### 2.3 Data flow

The pipeline has one direction:

```
src/data/*.json --> parseAtlasData (zod) --> store.data (AtlasData)
store.time (t) --> bodyModel(t) --> BodyFrame
(record, BodyFrame, t, level) --> buildStructure --> GeometryOut --> toBufferGeometry --> mesh.geometry
```

- **AR-07** `loadAtlasData()` runs once at startup, before the first render. A parse failure sets `dataError` and the app renders the error card of AR-66.
- **AR-08** `bodyModel(t)` is memoised on `t` rounded to 0.01 hpf. One frame serves every builder in one rebuild pass.
- **AR-09** A structure builder is a pure function of `(record, frame, t, level)`. It never reads the store and never touches a mesh.

#### 2.3.1 How a time change propagates

1. A UI control, the `Clock`, or `applyUrl` calls `setTime(t)`. The action writes `time`, sets `tessellation` to `interactive`, and calls the R3F `invalidate()`.
2. The rebuild driver in `rebuild.ts` subscribes to `time` outside React render. On change it computes the body frame, reads `presentIds` from the store (AR-74), and calls `queue.replace(jobs)`. A job whose structure was already queued keeps its age. It restarts a 120 ms settle timer.
3. A `useFrame` callback at priority -1 runs before the render pass. It calls `queue.drain(8, performance.now)`. `drain` pops jobs in priority order (AR-13) until the budget is spent or the queue is empty. Each job calls `buildStructure` and then applies the result.
4. Apply: a job whose parameter hash (BG-54) equals the mesh's current hash writes only the transform of AR-72 and skips the build. Otherwise, when the new vertex and index counts equal the current counts, `writeInto` copies into the existing attribute arrays, sets `needsUpdate`, and sets `boundingBox` and `boundingSphere` from `GeometryOut.bounds`. Otherwise the driver assigns a new `BufferGeometry` and disposes the old one.
5. When the queue is not empty after the slice, the driver calls `invalidate()` again. The next frame continues the drain.
6. When the settle timer fires, the driver sets `tessellation` to `final`, enqueues every present structure again, and invalidates. The same loop drains the final jobs in slices of 8 ms.

- **AR-10** The rebuild budget per frame is 8 ms of wall time (D3). `drain` checks the clock after every job, so one long job can overrun by at most one job.
- **AR-11** A final rebuild starts 120 ms after the last time change (D3). During playback the timer never fires, so playback runs at interactive tessellation. A pause triggers the final rebuild.
- **AR-12** A new time replaces the queue. It never appends. A job carries the time it was made for and the frame number at which its structure first entered the queue without being served (its age). A mesh keeps its previous geometry until its job runs. During playback a job that the 8 ms slice does not reach survives the next `replace` with its age, and a job older than 4 frames moves to the front (AR-13). The lag of any structure is therefore at most 4 frames plus one slice; the estimate in section 2.9 gives the drain time of one full interactive queue.
- **AR-13** Priority order: jobs older than 4 frames first, oldest first; then the skin (the whole-organism tube, DM-31); then the selected and hovered structures; then the remaining structures by descending bounding-box volume from their last build. Structures outside the camera frustum at the last frame come last.
- **AR-14** Fade in, fade out, and the 300 ms boundary transition of D3 are per-frame material and scale updates in `StructureMesh`. They never enqueue a rebuild.
- **AR-15** No `useFrame` callback calls `setState`. Callbacks read the store with `getState()` (research 06, section 2). The one writer inside the frame loop is `Clock`, which calls `setTime` once per frame while `playing` is true. `setTime` is the only action that runs at frame rate, so it also writes the derived fields of AR-74; React components never subscribe to `time` itself.
- **AR-16** The `Canvas` runs with `frameloop="demand"`. Every store action that changes something visible calls `invalidate()`. `OrbitControls` invalidates on its `change` event. An idle viewer renders nothing.

### 2.4 Store shape

- **AR-17** One zustand store holds all shared state. Slices split the file, not the store. Components select single fields, never the whole state. A component that renders time-dependent text subscribes to `stageIndex` or `presentIds` (AR-74), not to `time`.
- **AR-18** Actions are the only writers. A component never calls `setState` with a raw object.
- **AR-19** The URL subset of the store is exactly the fields that `toUrl()` reads. They are `time`, `selection`, `selectedTerm`, `viewPreset`, `camera`, `hiddenSystems`, `hiddenStructures`, `xray`, `dissect`, `section`, `isolate`, `theme`, `units`, `snap`, `labels`, `embed`, `presentation`, `kit`, `temperatureC`, `sex`, `stripPinned` and `projectorScale`. `hover`, `playing`, `speed`, `blackScreen`, and the runtime fields never reach the URL.
- **AR-20** `selection` holds at most 12 ids (research 07, UX-IN-04). `select` with `add` beyond 12 drops the oldest id.

```ts
// src/state/store.ts
export type SystemId = string            // one of the 15 ids in systems.json (D5)
export type ZfaId = `ZFA:${string}`
export type ViewPreset = 'lateral' | 'dorsal' | 'ventral' | 'anterior' | 'posterior' | 'threeQuarter' | 'free'
export type SectionAxis = 'sagittal' | 'frontal' | 'transverse'
export type Units = 'hpf' | 'dpf' | 'auto'
export type Theme = 'dark' | 'light'
export type Quality = 'standard' | 'presentation'
export type Speed = 0.5 | 1 | 2 | 4 | 8
export type Tessellation = 'interactive' | 'final'
export type WebglStatus = 'probing' | 'ok' | 'lost' | 'unavailable'

export interface CameraPose { position: [number, number, number]; target: [number, number, number] }
export interface SectionState { axis: SectionAxis | null; position: number; flip: boolean }  // position in [-1, 1]
export interface Bookmark { name: string; t: number; cam: CameraPose; sel: ZfaId[]; hide: string[]; xr: number; sec: SectionState; iso: boolean; labels: boolean; notes: string }
export interface SlideKit { id: string; name: string; bookmarks: Bookmark[]; index: number }

export interface AtlasState {
  data: AtlasData | null; dataError: AtlasParseError | null
  time: number; playing: boolean; speed: Speed; snap: boolean; units: Units; temperatureC: number
  stageIndex: number; presentIds: ZfaId[]              // derived by setTime with equality checks (AR-74)
  selection: ZfaId[]; hover: ZfaId | null; pinnedLabels: ZfaId[]
  hiddenSystems: SystemId[]; hiddenStructures: ZfaId[]; isolate: boolean
  xray: number; section: SectionState
  viewPreset: ViewPreset; camera: CameraPose | null; followGrowth: boolean; keepDorsalUp: boolean; fitRequest: number
  theme: Theme; labels: boolean; quality: Quality; reducedMotion: boolean
  presentation: boolean; embed: boolean; kit: SlideKit | null; sex: 'female' | 'male'
  stripPinned: boolean; projectorScale: 1 | 1.5 | 2; stripPosition: 'bottom' | 'top'; blackScreen: boolean
  tessellation: Tessellation; rebuildPending: number; webgl: WebglStatus; warnings: string[]
}

export interface AtlasActions {
  loadData(): void
  setTime(t: number): void; stepStage(dir: -1 | 1): void; stepPeriod(dir: -1 | 1): void
  play(): void; pause(): void; setSpeed(s: Speed): void; toggleSnap(): void; cycleUnits(): void; setTemperature(c: number): void
  select(id: ZfaId | null, opts?: { add?: boolean }): void; clearSelection(): void
  setHover(id: ZfaId | null): void; togglePinnedLabel(id: ZfaId): void
  setSystemHidden(id: SystemId, hidden: boolean): void; soloSystem(id: SystemId): void
  applyRailPreset(name: 'all' | 'none' | 'embryo' | 'organs' | 'skeleton'): void
  setStructureHidden(id: ZfaId, hidden: boolean): void; setIsolate(on: boolean): void
  setXray(value: number): void; toggleXray(): void; setSection(patch: Partial<SectionState>): void
  setViewPreset(p: ViewPreset): void; setCameraPose(pose: CameraPose): void; requestFit(): void
  resetView(all?: boolean): void; setFollowGrowth(on: boolean): void; setKeepDorsalUp(on: boolean): void
  setTheme(t: Theme): void; setLabels(on: boolean): void; setQuality(q: Quality): void
  setPresentation(on: boolean): void; setEmbed(on: boolean): void; setSex(s: 'female' | 'male'): void
  toggleStripPin(): void; setProjectorScale(s: 1 | 1.5 | 2): void; setStripPosition(p: 'bottom' | 'top'): void
  toggleBlackScreen(): void; toggleFullscreen(): void
  loadKit(kit: SlideKit | null): void; addBookmark(name?: string): void; stepBookmark(dir: -1 | 1): void
  setTessellation(level: Tessellation): void; setRebuildPending(n: number): void; setWebgl(s: WebglStatus): void
  pushWarning(text: string): void; applyUrl(state: UrlState): void; toUrl(): UrlState
}

export type AtlasStore = AtlasState & AtlasActions
```

Defaults for the fields that the URL does not set:

| Field | Default |
|---|---|
| `time` | 24 hpf (research 07, UX-LY-12) |
| `speed` | 1 |
| `snap` | false; true on entry to presentation mode (research 07, UX-TL-20) |
| `units` | `auto` |
| `xray` | 60 (UXR-05 of the review; research 07 UX-VS-16 marks the value as tuned against real geometry) |
| `stageIndex`, `presentIds` | derived from `time` at load |
| `stripPinned` | false |
| `projectorScale` | 1 |
| `stripPosition` | `bottom` |
| `blackScreen` | false; never persisted |
| `section` | `{ axis: null, position: 0, flip: false }` |
| `viewPreset` | `lateral` (D4) |
| `followGrowth`, `keepDorsalUp` | true |
| `theme` | the stored choice, then `prefers-color-scheme` |
| `temperatureC` | 28.5 (UI-13) |
| `labels` | false; presentation mode also starts with false (research 07, UX-VS-21) |
| `quality` | `standard` |
| `sex` | `female` |

### 2.5 Rendering

#### 2.5.1 Canvas

- **AR-21** `Viewer.tsx` creates the `Canvas` with `gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }}` and `frameloop="demand"`. The device pixel ratio has two values. While `time` or the camera moves, `dpr = min(devicePixelRatio, 2560 / cssWidth, 2)`, which caps the interactive backing store near 2560 px wide. The settled frame (after the final rebuild of AR-11) renders at `min(devicePixelRatio, 2)`; under `frameloop="demand"` that frame renders once. `antialias` (MSAA) is off when the backing store exceeds 4 megapixels. `onCreated` sets `gl.toneMapping = NeutralToneMapping`, `gl.toneMappingExposure = 1.0`, `gl.outputColorSpace = SRGBColorSpace`, and `gl.localClippingEnabled = true`.
- **AR-22** Tone mapping is `NeutralToneMapping`, never ACES. ACES shifts hue, and the legend swatch must match the organ colour (research 06, section 5).
- **AR-23** The environment is `RoomEnvironment` from `three/addons/environments/RoomEnvironment.js`, baked once through `PMREMGenerator`, at `envMapIntensity` 0.3 (research 07, UX-VS-13) for every structure except the soft-tissue classes (wall, veil, tissue), which use 0.15 for a matte finish (D18 amendment, 2026-09-12). It needs no download and no licence check. A local HDR under `public/hdri/` is a later option once its licence is verified (D14).
- **AR-24** Lights follow research 07, UX-VS-14. One `HemisphereLight` uses sky `--bg` lightened and ground `--bg`. One key `DirectionalLight` at intensity 2.0 comes from anterodorsal-left. One rim `DirectionalLight` at 1.2 comes from posterior-right. The three lights are children of the camera, so the lateral view is lit the same after an orbit. Each directional light's `target` is also a child of the camera at `(0, 0, -1)`, and the light sits at its view-space offset; a target left at the world origin would turn the key direction with every zoom.
- **AR-25** The scene background is the theme `--bg` as a solid colour. There is no ground plane (research 07, UX-VS-18).

#### 2.5.2 Materials

- **AR-26** Every structure uses `MeshStandardMaterial` with `metalness` 0.05 and `flatShading` false (research 07, UX-VS-13; research 01, section 4.6, uses 0.53 and 0.08). `roughness` is 0.55 for every structure, skin included, except the soft-tissue classes (wall, veil, tissue), which use 0.8 for a matte finish (D18 amendment, 2026-09-12). Closed primitives use `FrontSide`. Sheets (fins, fin fold, periderm) use `DoubleSide`.
- **AR-27** Each structure owns one material instance, cloned from its system base material at mount and cached by structure id. Per-structure opacity, emissive, and clipping state need per-material uniforms. The material count adds no draw calls.
- **AR-28** The base colour is the system hex for the active theme, stepped in lightness by tree depth (D10; research 07, UX-VS-07). The exception list of D10 overrides the hue for arteries, veins, otoliths, retinal pigment epithelium, melanophores, xanthophores, iridophores, cartilage, bone, yolk, lens, and chorion.
- **AR-29** `MeshPhysicalMaterial` with `transmission` is used for the lens and the chorion only, and only when `quality` is `presentation`. At `standard` quality both use the transparent path of AR-30 (research 06, section 5). Every material variant that the app can reach (opaque, transparent, transmission, each with the clipping plane of AR-43) is compiled once at load with `renderer.compileAsync` (AR-75).

#### 2.5.3 Transparency and x-ray

- **AR-30** A transparent structure sets `transparent = true`, `depthWrite = false` and keeps its side setting. The driver sorts transparent structures by the radius of their bounding sphere, smallest first, and writes the rank into `renderOrder` from 1 upward. An inner structure therefore draws before the structure that encloses it, and the enclosing structure blends over it (research 06, section 5); the chorion draws after the skin because its sphere is larger. Two `renderOrder` bands stay fixed: 500 for isolate ghosts (AR-33) and 1000 for the skin.
- **AR-31** An opaque structure keeps `transparent = false`, `depthWrite = true`, `renderOrder = 0`. During a fade the material is transparent; after the fade the driver restores the opaque state.
- **AR-32** Every structure belongs to one of nine opacity classes, and the class fixes its opacity at three x-ray anchors: 0 (solid), the default 60, and 100 (RN-04, `docs/research/10-visual-reference-notes.md`, tuned against the owner's reference figures of 2026-09-07). Opacity between two anchors is linear in the x-ray value. `OPACITY_ANCHORS` in `src/viewer/materials.ts` holds the anchors; `SYSTEM_OPACITY_CLASS` holds each system's default class and `STRUCTURE_OPACITY_CLASS` overrides it for the named records below. The skin is the whole-organism body tube, record ZFA:0001094 (DM-31); the periderm, the epidermis and the enveloping layer are not the skin and take their own system's class.

| Class | 0 | 60 (default) | 100 | Records |
|---|---|---|---|---|
| skin | 0.60 | 0.24 | 0 | the body tube ZFA:0001094 alone; a fresnel rim keeps its outline (section 2.5.4) |
| core | 1 | 1 | 1 | early_embryo, axial, cardiovascular, hematopoietic_immune, endocrine; also the eye and its parts, the otoliths, the neuromasts, the horizontal myoseptum, the xanthophores and the iridophores |
| organ | 1 | 0.7 | 0.4 | nervous, sensory, respiratory, digestive, excretory, reproductive, skeletal |
| capsule | 1 | 0.5 | 0.25 | the otic vesicle and the inner ear |
| tissue | 1 | 0.6 | 0.3 | the rayed fins from flexion |
| pigment | 1 | 0.92 | 0.45 | the melanophores and the four larval stripe records |
| wall | 1 | 0.5 | 0.12 | muscular, fins before flexion, integument_pigment; also the somite and the segmental plate |
| veil | 1 | 0.35 | 0.08 | the median fin fold; the embryonic mesoderm sheets (lateral plate, intermediate mesoderm, head mesenchyme) |
| film | 1 | 0.25 | 0.05 | the scale |

A melanophore is opaque in life, and the `tissue` class it first took let the pale myotomes
behind an adult flank band lift it to about L* 45, three times the L* 15 of its D10 near-black
colour, so the band read as grey rather than as pigment; the `pigment` class keeps it dark at the
default while still opening to 0.45 at x-ray 100 so the deep view still shows the flank organs.

A class opacity is a ceiling, not a fixed value. The lens and the chorion carry a role opacity of
0.35 and 0.10 from their D10 colour override, and the visual pass takes the lower of the class
opacity and the role opacity, so neither ever reads as solid at any x-ray value; the chorion
opacity of 0.10 (UX-VS-15) is this ceiling, not a class of its own. A structure at opacity 0 sets
`visible = false`.

At the earlier default of 25 the skin veil at 0.45 turned the cardiovascular hue `#E4483C` into
`#D69598` and reduced the smallest distance between system hues from deltaE 24 to 11 (review
UXR-05); the default moved to 60 for that reason and the class table above replaces the single
muscular ramp research 07 first proposed.

**On-top otoliths.** The otolith (ZFA:0001617) takes the core class like every other opaque
sensory record, but a core record still draws in three's opaque pass, so it loses the depth test
against a translucent shell that nests around it afterward: the otic vesicle and the inner ear
nest from 19 to 72 hpf, stacking two capsule shells (four surfaces) around it. `ALWAYS_ON_TOP_IDS`
lists the otolith alone: it draws instead in the translucent pass at render order 900, between
the ghost order (500) and the skin (1000), with depth testing off and full alpha, so it reads
through every shell that covers it rather than blending under whichever one draws last. Keep this
set small: a member also shows through the far side of the head.
- **AR-33** Isolate sets every non-selected structure to opacity 0.06 in `--text-muted`, `depthWrite = false`, `renderOrder = 500` (research 07, section 4.3). In presentation mode the ghost opacity is 0.14, because 0.06 on `--bg` (about 1.3:1) disappears on a projector.
- **AR-34** Picking uses two layers. Layer 0 renders. Layer 1 is the raycast layer. A mesh enables layer 1 only when its record has `pickable: true`, its opacity is 0.3 or more, and it is not hidden. The skin (ZFA:0001094), periderm, epidermis, enveloping layer and chorion carry `pickable: false` and are selectable from the tree and from search only. A click passes through a ghosted body to the organ behind it (research 06, section 5). `stopPropagation()` on the first hit stops the click from selecting the stack. While a section plane is active, an r3f `raycaster.filter` drops every intersection whose point lies on the clipped side of the plane (`plane.distanceToPoint(point) < 0`), because clipping is a fragment discard that the `Raycaster` does not see; back-face hits on the darkened cut wall stay, so a click on the cut selects the structure that shows the cut.

#### 2.5.4 Selection, hover, labels

- **AR-35** Selection draws two drei `Outlines` children on each selected mesh: an outer ring in `--bg` and an inner ring in `--focus`. The ring in `--bg` is 1 px wider on each side, so the outline stays visible on the yolk (`#F2C94C`, deltaE 8.4 from `--focus`) and on the xanthophores. Both use `screenspace` true, `angle={0}` and `thickness` in drawing-buffer pixels: `2 * dpr` for the focus ring and `4 * dpr` for the background ring. `angle={0}` makes `Outlines` share the parent geometry instead of copying it through `toCreasedNormals`; the copy would freeze the outline at the shape of the moment of selection, discard the analytic normals and triple the vertex count. The `Outlines` element is keyed on the geometry object, so a tessellation swap re-runs its effect. The base colour never changes on selection (D10). When `quality` is `presentation`, `PostOutline.tsx` mounts `EffectComposer` with `multisampling={4}`, `Outline`, and `SMAA`, and unmounts the drei `Outlines`. The `Outline` pass uses `edgeStrength` 4, `visibleEdgeColor` `--focus`, `hiddenEdgeColor` `--focus` at 50 percent, `xRay` true, and a second pass in `--bg` at `edgeStrength` 4 with a 1 px wider kernel for the two-tone effect. During export both outline paths are off; the export dialog draws the selection outline into the 2D overlay instead (AR-56).
- **AR-36** Hover sets `emissive` to the base colour at 8 percent and the cursor to `pointer` through drei `useCursor` (research 07, section 4.3). Hover starts after 80 ms and is off on touch (UX-IN-01). Hover never uses a postprocessing pass.
- **AR-37** Labels are drei `Html` elements. At most 8 show at once. Priority: selected, hovered, pinned, then the largest visible structures by projected area. A greedy pass hides a label whose box overlaps a higher-priority label (research 07, UX-VS-20). Labels hide while the camera moves and return 150 ms after it stops. Each label has a leader line of 16 to 32 px and a 4 px anchor dot in the structure colour (UX-VS-19). `Html` labels are DOM nodes; the export draws them onto the overlay canvas of AR-56.

#### 2.5.5 Camera

- **AR-38** The camera is a `PerspectiveCamera` with a vertical field of view of 34 degrees (research 01, section 2.2). `near` is 0.01 times the current body length and `far` is 50 times it. Both update when the body length changes.
- **AR-39** Controls are drei `OrbitControls` with `enableDamping` true, `dampingFactor` 0.08, `zoomToCursor` true, `minDistance` 0.4 and `maxDistance` 8 times the body length (research 07, UX-IN-10, UX-IN-11). `camera.up` stays `+y` for every preset, because `OrbitControls` reads `object.up` once in its constructor and a later change has no effect. `keepDorsalUp` clamps the polar angle to 0.05 pi and 0.95 pi (UX-IN-13). The clamp is lifted while `viewPreset` is `dorsal` or `ventral` and restored on the first manual orbit, so the two polar presets are not pushed 9 degrees off axis by the next `update()`. A preset tween runs with `controls.enabled = false` and ends with one `controls.update()`, so damping does not fight the tween. A `change` handler clamps the pan target to 1.5 times the body bounding box (UX-IN-08). The controls `end` event writes `camera` to the store.
- **AR-40** View presets use the D4 axes (+x posterior, +y dorsal, +z left). A preset is a pair of spherical angles about the target: `polar` from `+y` and `azimuth` from `+z` toward `+x`.

| Preset | Camera direction from the target | polar, azimuth | Result |
|---|---|---|---|
| lateral | +z | pi / 2, 0 | left side; snout on screen left (D4 default) |
| dorsal | +y | 0.001, pi / 2 | snout on screen left; the polar offset keeps the roll of `lookAt` defined |
| ventral | -y | pi - 0.001, pi / 2 | snout on screen left |
| anterior | -x | pi / 2, -pi / 2 | |
| posterior | +x | pi / 2, pi / 2 | |
| threeQuarter | (-0.45, 0.35, 0.82) normalised | acos(0.35), atan2(-0.45, 0.82) | research 07 UX-IN-14 vector with x negated for the D4 axes |

The azimuth of the dorsal and ventral presets is the value that puts the snout on the screen left with `up = +y`; `CameraRig` derives it from the D4 axes at start and the test of QP-38 checks it. A preset change slerps the camera over 500 ms with the research 07 easing, or cuts under reduced motion. Any manual orbit sets `viewPreset` to `free`.

- **AR-41** Fit-to-bounds computes the bounding sphere of the body frame plus the fins, and sets the distance to `radius / sin(fov / 2)` times 1.1. Fit runs on first load, on `F` and on a preset change (D4). While `followGrowth` is true, the rig also follows the body on every `t` change: the target moves to the body centroid and the distance scales with the body length, both through a critically damped filter with a 200 ms time constant (research 07, UX-IN-12). Continuous follow frames the body on every stage change, which is the D4 rule, and avoids the jumps of a per-stage fit: inside one stage the body grows by up to 1.56 times (14-19 somites) and 1.50 times (juvenile). QP-43 checks that the on-screen body length changes by at most 2 percent per second at 1x.
- **AR-42** Fit accepts a reserved rectangle in CSS px (`top`, `right`, `bottom`, `left`), the idea of research 01, section 2.2. On desktop the panels are docked and the rectangle is zero. On tablet and phone the open sheet reserves its width or height. Presentation mode reserves the 320 px floating info card while a selection exists. `CameraRig` applies the rectangle with `camera.setViewOffset` and clears it with `clearViewOffset` when the rectangle is zero.

#### 2.5.6 Section plane

- **AR-43** One `Plane` in world space cuts the model. Every structure material carries `clippingPlanes = [plane]` from its creation. When `axis` is `null`, `SectionPlane.tsx` moves the plane to a constant of 1e6 mm instead of removing it, because `numClippingPlanes` is part of the shader program key and the first press of a section button would otherwise compile a new program for every material variant and block the main thread for 100 to 400 ms. One axis is active at a time (research 07, UX-IN-18). Sagittal uses the ±z normal, frontal ±y, transverse ±x. `position` in [-1, 1] maps across the body bounding box on that axis. `flip` negates the normal.
- **AR-44** The `side` of a material never changes at runtime, for the same program-key reason. Closed primitives stay `FrontSide` and draw no cut wall; sheets stay `DoubleSide`. The `onBeforeCompile` patch of every material darkens the fragment by 20 L* when `gl_FrontFacing` is false, so the inside of a sheet and the cut of any `DoubleSide` structure read as a filled surface. A stencil cap pass is a later feature. During a drag, a translucent rectangle in `--accent` at 12 percent shows the plane and hides 300 ms after release.

### 2.6 URL state

- **AR-45** The schema below is the full query parameter set. Every parameter is optional. An absent parameter means the default.

```ts
// src/core/urlState.ts
import { z } from 'zod'
const flag = z.coerce.number().int().min(0).max(1)
export const UrlState = z.object({
  t:       z.coerce.number().transform((n) => Math.min(Math.max(n, 0), 4320)).default(24),  // hpf (D1); out of range clamps with a warning (AR-46)
  sel:     z.string().regex(/^\d{7}(,\d{7}){0,11}$/).optional(),            // ZFA numbers, no prefix, max 12
  term:    z.string().regex(/^\d{7}$/).optional(),                          // selected ZFA vocabulary term (D17, section 5.14)
  v:       z.enum(['lat', 'dor', 'ven', 'ant', 'pos', 'tq']).default('lat'), // D4 presets; 'pos' added for posterior
  cam:     z.string().regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){5}$/).optional(), // position xyz, target xyz in mm; implies a free camera
  hide:    z.string().regex(/^([a-z_]+|\d{7})(,([a-z_]+|\d{7}))*$/).optional(), // system ids (D5) or ZFA numbers
  xr:      z.coerce.number().int().min(0).max(100).default(60),
  x:       z.coerce.number().int().min(0).max(100).default(0),              // dissect percent (D17, section 5.13)
  sec:     z.string().regex(/^(sag|fro|tra):-?(0(\.\d+)?|1(\.0+)?)(:f)?$/).optional(), // axis:position[:f]
  iso:     flag.default(0),
  theme:   z.enum(['dark', 'light']).optional(),                             // absent: stored choice, then prefers-color-scheme
  u:       z.enum(['hpf', 'dpf', 'auto']).default('auto'),
  snap:    flag.optional(),                                                  // absent: 1 in presentation mode, else 0
  labels:  flag.optional(),                                                  // absent: 0
  temp:    z.coerce.number().min(24).max(33).default(28.5),                 // incubation temperature for the relabel (UI-13)
  sex:     z.enum(['f', 'm']).default('f'),                                 // gonad handoff target (D9, UI-27)
  embed:   flag.default(0),
  present: flag.default(0),
  pin:     flag.default(0),                                                  // timeline strip pinned in presentation mode (UI-37)
  ps:      z.enum(['1', '1.5', '2']).default('1'),                          // projector scale (UI-36)
  kit:     z.string().max(2048).optional(),                                  // base64url kit or a localStorage kit id
})
export type UrlState = z.infer<typeof UrlState>
export function parseUrl(search: string): { state: UrlState; warnings: string[] }
export function serializeUrl(state: UrlState): string   // omits defaults; numbers to 3 decimals
```

- **AR-46** `parseUrl` parses each key on its own with `safeParse`. A key that fails falls back to its default and adds one warning. One bad parameter never discards the others (research 07, UX-ST-09). A numeric `t` outside `[0, 4320]` does not fail: the transform clamps it and `parseUrl` adds the warning that AR-69 turns into "Time clamped to 180 dpf".
- **AR-47** `sel` ids that are not in `structures.json` are dropped with a warning. `term` is a
  vocabulary id, not a record id, so `parseUrl` checks only its shape; the lazy vocabulary chunk
  decides whether it exists and raises the same warning when it does not (section 5.14). `hide` tokens are checked against the system ids and structure ids; unknown tokens are dropped with a warning. A `cam` value overrides `v` and sets `viewPreset` to `free`.
- **AR-48** `urlSync.ts` writes the URL with `history.replaceState` at most every 300 ms during interaction and once when the interaction ends (research 07, UX-EX-08). It never calls `pushState`. In embed mode it does not write at all.
- **AR-49** `serializeUrl` omits every parameter at its default. `cam` appears only when the preset is `free`. `theme` appears in the address bar once the user has chosen a theme with the toggle, in every "Copy link" result, and always in a link with `present=1`, so a link copied from a dark laptop opens dark on a light-preferring seminar laptop (research 07, UX-VS-02). The `t` value is rounded to 2 decimals and `cam` to 3.
- **AR-50** `parseUrl` runs once before the first render. `applyUrl` writes the result into the store, and the warnings surface as toasts after the first frame.

### 2.7 Export pipeline

- **AR-51** Export renders into render targets, never from the on-screen buffer. `preserveDrawingBuffer` stays false. Three renders into a non-XR render target with `toneMapping` set to `NoToneMapping`, so a byte target would hold un-tone-mapped colour with clipped highlights and a hue shift against the legend. The pipeline therefore renders each tile into a linear `HalfFloatType` target with `LinearSRGBColorSpace`, then runs `OutputPass` from `three/addons` (tone mapping `NeutralToneMapping` and the sRGB transfer) into an `UnsignedByteType` `SRGBColorSpace` target of the output tile size. Neither target uses MSAA; anti-aliasing comes from the supersample of AR-53.
- **AR-52** The dialog has a frame and a size. Frames: `viewport` (the canvas aspect), `16:9`, `4:3`, `1:1`. Sizes: 1x, 2x or 4x of the canvas CSS size, independent of the device pixel ratio, or the fixed sizes 1920 by 1080 and 3840 by 2160 (16:9 only). A non-viewport frame renders with the camera aspect set to the frame and the fit of AR-41 applied to that aspect, through the same tile pipeline; the on-screen camera is untouched. The longest edge is capped at 8192 px, and the dialog states the resulting size (research 07, UX-EX-02). The size appears in the file name (AR-57).
- **AR-53** Tiling: the output tile edge is 2048 px, or 1024 px when `gl.getParameter(gl.MAX_TEXTURE_SIZE)` is below 4096 or the device is a phone. Each tile renders at twice its edge into the linear target of AR-51 and a 2 by 2 box filter reduces it to the output tile during `OutputPass`. For each tile, `camera.setViewOffset(W2, H2, x2, y2, tw2, th2)` sets the sub-frustum at the render size, the scene renders, and `renderer.readRenderTargetPixelsAsync` reads the byte target. Rows are flipped, since WebGL rows start at the bottom, and copied into one `ImageData` of W by H. After the last tile the rig restores the fit view offset of AR-42 or calls `clearViewOffset`. The screen-space outlines of AR-35 are off during export because their thickness would be computed per tile and show seams; the `EffectComposer` cannot render into the export target, so the presentation-quality path exports without SMAA.
- **AR-54** Before the first tile, export pauses playback, clears hover, hides the drag rectangle of AR-44, and pauses the `PerformanceMonitor` of AR-64, which would otherwise read the export frames as a decline. It then waits for the rebuild queue to drain at `final` tessellation. After the last tile it restores playback state and the monitor.
- **AR-55** Transparent export sets `scene.background = null` and the clear alpha to 0. The renderer keeps `premultipliedAlpha` at its default of true. The un-premultiply step runs in linear light inside the `OutputPass` shader, before the sRGB transfer: `rgb / alpha` on the linear HalfFloat colour, then the transfer, then the byte write. Dividing sRGB-encoded bytes by alpha would brighten a skin pixel at alpha 0.45 by 1.55 times and leave a bright halo. Opaque export clears to the theme `--bg`.
- **AR-56** Overlays (labels, scale bar, readout, legend, and the selection outline when "Include selection outline" is on) are drawn onto a 2D `OffscreenCanvas` of W by H. The dialog's "Overlay colour" is `auto`, `dark` or `light`; `auto` draws dark overlays on a transparent export and theme overlays otherwise. Text and lines are drawn with a 2 px halo (times the export scale) in the opposite colour, so a readout stays legible on a white slide and on a black slide. The exported scale bar is 2 px times the scale with 6 px end caps. Text sizes use the theme tokens scaled by the export scale. The overlay is composited over the WebGL image. The label positions come from the same layout pass as AR-37, projected at the export size. The selection outline in the overlay is the projected silhouette of the selected meshes, stroked with the two-tone rule of AR-35.
- **AR-57** Encoding uses `OffscreenCanvas.convertToBlob({ type: 'image/png' })`. The file name is `zfatlas_<time>_<view>_<selection-or-all>_<size>.png`, where `<size>` is `2x` for a viewport export and `1920x1080` for a fixed size (research 07, UX-EX-04). The time uses the readout format without spaces, for example `zfatlas_24hpf_lateral_heart_2x.png`. "Copy image" uses the Clipboard API with `image/png` where available; otherwise the button is hidden.
- **AR-58** Export never allocates more than one tile pair at a time. At the 2048 px output tile, the 4096 px linear target holds 4096 x 4096 x 8 bytes of colour and 4096 x 4096 x 4 bytes of depth, and the byte target 2048 x 2048 x 4 bytes. The peak transient GPU memory is therefore about 220 MB; at the 1024 px tile of a phone it is about 55 MB. A 4096 px MSAA tile would have needed about 600 MB and could lose the context on an integrated GPU. The targets are disposed after the last tile.

### 2.8 Presentation mode and embed mode

- **AR-59** Presentation mode (`present=1`, the Present button, or `P`) hides the top bar, the rail, and the docked info card. A 320 px floating info card sits at the top right while a selection exists. The timeline bar shrinks to a 64 px strip. The strip is visible while `playing` is true, for 3 s after playback stops or after the last pointer or key input, for 3 s after entry through `present=1`, and at all times while `stripPinned` is true (UI-37). The readout chip never hides; its text sizes follow the presentation type scale of UI-36 (research 07, sections 2.5 and 3.9). The cursor hides after 2 s of idle. On entry it sets `snap` true, `labels` false, and "Jump to appearance on select" on. The context menu of UX-IN-05 is disabled. `Escape` exits it last in the Escape order. Fullscreen uses the Fullscreen API only from a user gesture, never from the URL alone: `Enter` and `Shift+F` toggle it, and a chip "Press Enter for fullscreen" shows for 5 s after entry through the URL (UI-40).
- **AR-60** In presentation mode with a kit loaded, `ArrowLeft` and `ArrowRight` step between bookmarks; `Shift+Arrow` steps stages. A bookmark step animates `time` over 600 ms and the camera over 500 ms, or cuts under reduced motion (research 07, UX-EX-13 and UX-EX-14). Section 5.12 specifies the kit sheet, the strip markers and the two starter kits. Auto-rotate is available at `autoRotateSpeed` 0.5 and stops on any input.
- **AR-61** Embed mode (`embed=1`) hides the top bar and the rail. It keeps the timeline bar at its 96 px tablet height and a floating info card. A 28 px footer at the bottom right shows "Open in Zebrafish Atlas" and the ZFIN attribution (research 07, UX-EX-10). The link carries the full serialised state. The page sets `touch-action: pan-y` on everything except the canvas and the track.
- **AR-62** Embed mode accepts every other URL parameter. It never writes `localStorage`, never writes the URL, and never shows the first-run hint (research 07, UX-EX-11). Keyboard shortcuts work only while the frame has focus.

### 2.9 Performance budget

The budgets below come from research 06, section 8, and from arithmetic on the tessellation counts of BG-29 and BG-30, which are the single source for `tessellation.ts`. The derived numbers are estimates until the hardening phase (D15, step 4) measures them on the presenter's laptop and records them here. At the final level the 150 structures of a larva sum to about 105,000 vertices and 170,000 triangles: one body sweep of 4,257 vertices, about 120 compact primitives at 825 vertices, 20 tubes at 637 vertices, the sheets and the somite arrays. Interactive counts halve each dimension, so an interactive mesh has about one quarter of the final vertices.

| Metric | Budget | Source |
|---|---|---|
| Frame time while scrubbing or playing | 16.7 ms: 8 ms rebuild (D3) plus 6 ms render plus headroom | research 06, section 8 |
| Frame time while settled | 0 ms; `frameloop="demand"` | research 06, section 8 |
| Frame time while orbiting | 16.7 ms with no rebuild work | research 06, section 8 |
| Draw calls per frame | 200 | research 06, section 8 |
| React commits per second during playback | 5 | derived: AR-74; measured by the dev overlay of AR-65 |
| Triangles on screen, interactive | 45,000 | derived: final divided by 4 |
| Triangles on screen, final | 170,000 (limit 200,000) | derived from BG-29 and BG-30; research 06, section 3, estimates 150,000 for 150 structures |
| Full final rebuild, all present structures | 18 to 24 ms, so 3 sliced frames | derived: research 06, section 4, measured 174 ns per vertex for positions and analytic normals; 105,000 vertices; plus 20 to 40 us fixed cost per job |
| Full interactive rebuild | 7 to 10 ms on the benchmark core, 15 to 30 ms on a phone; the age rule of AR-12 bounds the lag and AR-73 fits the counts to the machine | derived: 26,000 vertices at 174 ns plus 150 jobs at 20 to 40 us; with AR-72 most compact primitives skip the build and the queue holds 30 to 40 spine-following jobs |
| Geometry memory, CPU plus GPU | 17 MB | derived: 105,000 vertices x 32 bytes x 2 levels x 2 copies |
| Time to first frame | 2 s on a laptop | research 06, section 8 |
| Initial JavaScript, gzip | 600 kB | budget; measured at build in the hardening phase |
| `structures.json` raw | 1 MB | budget for 220 records with keyframes |

- **AR-63** The hardening gate measures the p95 frame time over a 10 s scrub on the reference laptop. The build fails the gate when p95 exceeds 20 ms (research 06, section 8).
- **AR-64** drei `PerformanceMonitor` drives a fallback ladder. Each `onDecline` steps down one rung; `onIncline` after 2 s under budget steps up one rung.

The monitor is paused during export (AR-54) and during the final-rebuild burst of AR-11, so neither reads as a decline.

| Rung | Fallback |
|---|---|
| 1 | interactive device pixel ratio from the AR-21 cap to 1 during playback and scrubbing |
| 2 | hold interactive tessellation; skip the final rebuild of AR-11 |
| 3 | hide labels until the frame time recovers |
| 4 | postprocessing outline off; then drei `Outlines` off while the camera or time moves |
| 5 | interactive tessellation drops to one quarter of the final counts per dimension |

- **AR-65** A dev-only overlay shows `renderer.info.render.calls`, `triangles`, the rebuild queue length, the oldest job age, the last slice time, and a React commit counter (commits per second, from a `useEffect` counter in `App.tsx`). It mounts when `import.meta.env.DEV` is true and `?perf=1` is present. The acceptance value for the commit counter is under 5 per second during playback (AR-74).

### 2.10 Error handling

- **AR-66** Data parse failure: `parseAtlasData` returns `AtlasParseError { file, issues: { path, message }[] }`. `ErrorScreens.tsx` renders a centred card "Could not load the atlas data" with the file name and the first three issues. The top bar stays, so the About sheet stays reachable (research 07, UX-ST-08). Because the data is bundled, a parse failure is a build defect; `npm run validate` catches it before build (D13).
- **AR-67** WebGL unavailable: before the `Canvas` mounts, `Viewer.tsx` probes `document.createElement('canvas').getContext('webgl2')`. three 0.185 needs WebGL 2. On failure the app renders `public/fallback-24hpf.png` (the lateral view at 24 hpf from the screenshot script), the message "This browser cannot run the 3D viewer. Try a current version of Chrome, Firefox or Safari.", and links to ZFIN and the stage table. The timeline bar is hidden (research 07, UX-ST-06).
- **AR-68** Context lost: the `webglcontextlost` handler calls `preventDefault`, sets `webgl` to `lost`, pauses playback, and shows a toast "The 3D view paused. Restoring…". On `webglcontextrestored` the driver enqueues every present structure at `final` tessellation and invalidates. A "Reload viewer" button appears after 5 s (research 07, UX-ST-07).
- **AR-69** Missing structure in the URL: an unknown `sel` id falls back to the default for that field. The toast reads "Structure ZFA:9999999 is not in this atlas". A `t` above 4320 clamps with the toast "Time clamped to 180 dpf" (research 07, UX-ST-09). A selected structure that is not present at `t` keeps the info card open with the "Jump to" button (D1; research 07, UX-IN-23).
- **AR-70** A structure record with `geometry: null` never enters the rebuild queue. Selecting it opens the info card with the note of research 07, UX-ST-03.
- **AR-71** A builder that throws or returns a non-finite value at runtime is caught per job. The driver hides that structure, logs one console error per structure id, and continues the drain. The D13 validation script makes this path unreachable in a passing build.
- **AR-72** Local-frame placement. The compact kinds (`ellipsoid`, `superellipsoid`, `lathe`, `shell`, and the custom builders `eyeCup`, `earVesicle`, `primordiumMover`) emit positions relative to `bounds.center` and return a `placement` (`position`, `quaternion`, `scale`) computed from `toWorld`, `frameAt` and `SL(t) / sizeRefSl`. `StructureMesh` writes the placement into `mesh.position`, `mesh.quaternion` and `mesh.scale` on every time change and rebuilds the vertices only when the parameter hash of BG-54 changes. The kinds that follow the spine over a `u` range (`tube`, `sheet`, `segmentArray`, `heartLoop`, `gutLoop`, `somiteChevron`, `finSheet`) keep world-space vertices and rebuild on every time change. A local-frame mesh scales about its own centre, so an appearing structure grows in place instead of moving in from the origin, and its bounding sphere in local space is constant. The body coordinates of every structure are still converted to world space at every time step (D3); only the vertex buffer is reused. Section 7.3 asks the owner to confirm this reading of D3.
- **AR-73** Adaptive interactive tessellation. At load the app builds one 24 x 32 ellipsoid ten times and measures the median nanoseconds per vertex. `tessellation.ts` then chooses the interactive counts as the largest entry of a three-step ladder (`1/2`, `1/3`, `1/4` of the final counts per dimension) at which the exact `vertexCount` sum of the present structures at 48 hpf, times the measured cost, plus 30 us per job, fits in 6 ms. The final counts never change. The chosen step is shown in the dev overlay of AR-65 and can be forced with `?tess=<step>`.
- **AR-74** Derived store fields. `setTime` computes `stageIndex` (from `timeAxis.ts`) and `presentIds` (from `presence.ts`) and writes each only when it differs from the stored value (a shallow equality check for the id list). The stage card, the rail badges, the tree filter and counts, the info card badge and alias line, the event clock icon and `Structures.tsx` subscribe to these two fields and never to `time`. The thumb position, the readout text and the stage card position use transient store subscriptions (`store.subscribe`) that write DOM properties directly. During playback React therefore commits only when the stage or the present set changes, which happens at most a few times per second (AR-65).
- **AR-75** Program warm-up. At load, after the data parse, the app calls `renderer.compileAsync(scene, camera)` on a hidden scene that holds one mesh per reachable material variant: opaque, transparent, transmission (AR-29), each with the clipping plane of AR-43 and each side setting of AR-44. The first section press, the first fade and the first transmission use therefore compile nothing during a talk.

### 2.11 Extensions of the research files

This section contradicts no decision. Three points extend the research files:

1. Research 07 lists five view presets in `v`. D4 lists six. The `v` enum adds `pos` for posterior.
2. Research 07 encodes `hide` as palette slots (`S07`). D5 makes `systems.json` the owner of system ids, so `hide` carries D5 ids and, for hidden structures, 7-digit ZFA numbers.
3. Research 07, UX-LY-12, opens on the three-quarter preset. D4 names lateral as the default, so `v` defaults to `lat`.
4. The review of 2026-09-06 changed values in the domain that research 07 owns (D11). Section 7.3 lists them for write-back into research 07: the presentation type scale (UI-36), the strip visibility rule (UI-37), the x-ray default 60 (AR-32), the two-tone outline (AR-35), the export overlay colour and halo (AR-56), the export frames and sizes (AR-52), the fullscreen and black-screen keys (UI-40), the key dispatcher and remote mapping (UI-41), the accent token and the xanthophore hex (section 5.8), the rail swatch grid (UI-43), the root height rule (UI-44), the isolate ghost opacity in presentation mode (AR-33), and the two new URL parameters `pin` and `ps`.

## 3. Data model

The data model is the contract between the research drafts, the validation script, and the viewer. Five JSON files in `src/data/` hold every value the viewer reads. One zod module, `src/core/schema.ts`, defines each record; section 4 lists the body keyframe and handoff schemas that it also exports. This section uses these abbreviations: hpf is hours post fertilization at 28.5 C; dpf is days post fertilization; SL is standard length (snout to caudal fin base); TL is total length (snout to caudal fin tip); EL is embryo length as Kimmel et al. 1995 define it; ZFA is the Zebrafish Anatomy Ontology; ZFS is the Zebrafish Stage Ontology.

### 3.1 Data files

| File | Owns | Root schema | Rows in version 1 |
|---|---|---|---|
| `systems.json` | the 15 systems of D5: display name, ZFA roots, palette slot, colours, rail order | `SystemRecord[]` | 15 |
| `stages.json` | the 43 named ZFS stages, the 10 periods, the events, the growth table, the time axis (D6, D7) | `StagesFile` | 43 stages (the `ZFS:0000000` Unknown row of the ZFIN file is excluded, section 7.3), 10 periods, the 53 draft events plus the D8 rows, 32 growth points (section 4.4) |
| `structures.json` | every selectable structure and every group node (D3, D5) | `StructureRecord[]` | 236 (see the merge plan) |
| `body.json` | the body keyframes that drive the body model (D3) | `BodyFile` | 32 keyframes (section 4.3) |
| `handoffs.json` | the topology handoffs of D9 and the develops-from handoffs of BG-49 | `HandoffRecord[]` | 24 (section 4.8) |

- DM-01 Each value has one owner file. No file repeats a value that another file owns. The viewer joins the files by id at load time.
- DM-02 Every structure id is a ZFA id and every stage id is a ZFS id. No file mints its own id.
- DM-03 `npm run validate` parses each file with the zod schema and then runs the numbered rules in the validation section. A failure stops the build.
- DM-04 The attribution data lives in `src/core/attribution.ts` as a typed constant. `scripts/build-attribution.ts` writes `public/ATTRIBUTION.md` from it, and the info card footer reads the same constant.
- DM-05 `scripts/validate-data.ts` also calls `z.toJSONSchema` on each root schema and writes the result to `docs/schema/`. The JSON Schema files are documentation; the zod module is the source.

### 3.2 Schemas

The code below is zod 4 and TypeScript 5.9. Units are millimetres and hpf unless a field name says otherwise. Every schema is strict: unknown keys fail.

#### 3.2.1 Shared types and SystemRecord

```ts
import { z } from 'zod';

export const ZfaId = z.string().regex(/^ZFA:\d{7}$/);
export const ZfsId = z.string().regex(/^ZFS:\d{7}$/);
export const Hex = z.string().regex(/^#[0-9A-F]{6}$/);
export const Hpf = z.number().min(0).max(17520);
export const Mm = z.number().min(0);
export const Url = z.string().url();

export const SystemId = z.enum([
  'early_embryo', 'axial', 'nervous', 'sensory', 'cardiovascular',
  'hematopoietic_immune', 'respiratory', 'digestive', 'excretory', 'endocrine',
  'reproductive', 'skeletal', 'muscular', 'fins', 'integument_pigment',
]);

export const SystemRecord = z.strictObject({
  id: SystemId,
  displayName: z.string().min(1),
  zfaRoots: z.array(ZfaId).min(1),
  paletteSlot: z.string().regex(/^S(0[1-9]|1[0-5])$/),
  color: z.strictObject({ dark: Hex, light: Hex }),
  icon: z.string().min(1),                 // lucide name, research 07 UX-VS-08
  order: z.number().int().min(1).max(15),  // rail order, D5 table order
});
```

#### 3.2.2 StageRecord, PeriodRecord, EventRecord, GrowthPoint, TimeAxis

```ts
export const PeriodId = z.enum([
  'zygote', 'cleavage', 'blastula', 'gastrula', 'segmentation',
  'pharyngula', 'hatching', 'larval', 'juvenile', 'adult',
]);

export const StageRecord = z.strictObject({
  zfs: ZfsId,
  zdb: z.string().regex(/^ZDB-STAGE-\d{6}-\d+$/),
  name: z.string().min(1),          // ZFIN label, for example "Pharyngula:Prim-15"
  shortLabel: z.string().min(1),    // "prim-15"
  period: PeriodId,
  startHpf: Hpf,
  endHpf: Hpf,
  dpfLabel: z.string(),
  landmarks: z.array(z.string()),
  lengthMm: z.strictObject({
    value: z.number().positive(),
    measure: z.enum(['EL', 'TL', 'SL']),
    source: Url,
  }).nullable(),
  headline: z.boolean(),
  sources: z.array(Url).min(1),
});

export const PeriodRecord = z.strictObject({
  id: PeriodId,
  zfs: ZfsId.nullable(),            // null for zygote (no ZFS period term); the other ids exist in zfa.obo only (E003)
  displayName: z.string().min(1),
  startHpf: Hpf,
  endHpf: Hpf,
  note: z.string().optional(),
});

export const EventRecord = z.strictObject({
  id: z.string().regex(/^ev-[a-z0-9-]+$/),
  hpf: Hpf,
  label: z.string().min(1),
  description: z.string(),
  source: Url,
  hpfIsEstimate: z.boolean().default(false),   // true when the source defines the event by SL
  slMm: z.number().positive().nullable().default(null),
  canonical: z.boolean().default(false),        // true for every D8 row
});

export const GrowthPoint = z.strictObject({
  hpf: Hpf,
  lengthMm: z.number().positive(),
  measure: z.enum(['EL', 'TL', 'SL']),          // EL: Kimmel embryo length, egg diameter to 10 hpf; TL: total length, 1.2 x SL from 1080 hpf
  standardLengthMm: z.number().positive().nullable(),  // null before 72 hpf; derived, see DM-18
  source: z.string().min(1),
  estimate: z.boolean(),
});

export const TimeAxis = z.strictObject({
  domainHpf: z.tuple([z.literal(0), z.literal(4320)]),
  segments: z.array(z.strictObject({
    id: z.string().min(1),
    label: z.string().min(1),
    startHpf: Hpf,
    endHpf: Hpf,
    share: z.number().min(0).max(1),            // D7: 0.18, 0.12, 0.22, 0.10, 0.16, 0.14, 0.08
  })).length(7),
  headlineTicks: z.array(z.strictObject({
    hpf: Hpf,
    label: z.string().min(1),
    zfs: ZfsId.nullable(),                      // null for 180 dpf
  })).length(18),
  minTickGapPx: z.literal(8),
  playbackTrackSeconds: z.literal(60),
});

export const StagesFile = z.strictObject({
  meta: z.strictObject({
    zfaRelease: z.string(),                     // "2026-07-16" from the zfa.obo header
    temperatureC: z.literal(28.5),
    generated: z.string(),
  }),
  stages: z.array(StageRecord).length(43),      // the named stages; ZFS:0000000 Unknown is rejected (E022)
  periods: z.array(PeriodRecord).length(10),
  events: z.array(EventRecord),
  growth: z.array(GrowthPoint).min(2),
  timeAxis: TimeAxis,
});
```

#### 3.2.3 Placement and parameters per primitive

The parameter names follow the primitive catalogue of section 4.5 and the custom builders of section 4.6. Every leaf name follows the unit suffix rule of DM-35: a name that ends in `Mm` is a length that the `sizeRefSl` rescale of BG-43 multiplies; a name that ends in `Deg` is an angle; `u`, `v`, `w`, `s0`, `s1`, `e1`, `e2`, `ellipticity` and a name that ends in `Fraction` are dimensionless; a name that starts with `count` is a count. The unit test of QP-16 walks every schema leaf and fails on a numeric leaf outside these classes.

```ts
const Signed = z.number().min(-1).max(1);                    // v and w: -1 ventral or left surface, +1 dorsal or right surface
const U = z.number().min(0).max(1.25);                       // 0 snout, 1 notochord end; above 1.0 only in the fins system (E012)
const Mm4 = z.number().min(0.004);                           // floor of a tube radius and a sheet edge (BG-31)

export const Size = z.union([                                // a *Mm leaf holds a Size; the fraction form skips the SL rescale (DM-17)
  Mm,                                                        // millimetres
  z.strictObject({ value: z.number().min(0), unit: z.enum(['mm', 'bodyHeightFraction']) }),
]);

export const Placement = z.strictObject({
  u: U, v: Signed, w: Signed,
  yawDeg: z.number().optional(), pitchDeg: z.number().optional(), rollDeg: z.number().optional(),
  mirror: z.boolean().default(false),                        // paired: draw at +w and at -w
});

export const EllipsoidParams = z.strictObject({
  placement: Placement,
  radiiMm: z.tuple([Size, Size, Size]),                      // along u, v, w
});
export const SuperellipsoidParams = EllipsoidParams.extend({
  e1: z.number().min(0.3).max(2.0),                          // north-south exponent; above 2 the Barr normal is infinite at the poles (BG-29)
  e2: z.number().min(0.3).max(2.0),                          // east-west exponent
});
export const TubeParams = z.strictObject({
  path: z.union([
    z.strictObject({ type: z.literal('spine'), uStart: U, uEnd: U, v: Signed, w: Signed }),
    z.strictObject({ type: z.literal('spline'), points: z.array(Placement).min(2) }),
  ]),
  radiusMm: z.union([Size, z.strictObject({ r0Mm: Size, r1Mm: Size }), z.literal('body')]),
  ellipticity: z.number().positive().default(1),             // v radius divided by w radius
  caps: z.enum(['none', 'round', 'flat']).default('round'),
  taperFromU: U.optional(),                                  // notochord: the taper starts here
  flexionDeg: z.number().min(0).max(45).default(0),          // notochord: dorsal bend of the posterior part
  flexionFromU: U.optional(),
  segmented: z.boolean().default(false),                     // drives a material stripe, not the geometry
});
export const LatheParams = z.strictObject({
  placement: Placement,
  profileMm: z.array(z.tuple([Mm, z.number()])).min(6).max(10), // [radius, height along the local y axis], both mm
  phiLengthDeg: z.number().min(1).max(360).default(360),
});
export const SheetParams = z.strictObject({
  base: z.strictObject({ uStart: U, uEnd: U, side: z.enum(['dorsal', 'ventral', 'lateral']), w: Signed }),
  outlineMm: z.array(z.tuple([z.number(), z.number()])).min(3), // closed 2D spline as [chord, span] in mm
  thicknessBaseMm: Mm,
  thicknessEdgeMm: Mm4,
  rakeDeg: z.number().default(0),
});
export const ShellParams = z.strictObject({
  centre: Placement,
  innerRadiusMm: Mm,
  thicknessMm: Mm,
  polarDeg: z.number().min(0).max(180),                      // coverage from the animal pole
  azimuthDeg: z.number().min(1).max(360).default(360),
});
export const BodyDrivenParams = z.strictObject({             // the yolk and the chorion: parameters come from the body frame (DM-31)
  part: z.enum(['yolk', 'chorion']),
});
// One strict schema per custom builder; the field lists are in section 4.6 and follow the suffix rule.
export const HeartLoopParams = z.strictObject({ builder: z.literal('heartLoop'), placement: Placement, /* BG-34 fields */ });
export const GutLoopParams = z.strictObject({ builder: z.literal('gutLoop'), /* BG-35 fields */ });
export const EyeCupParams = z.strictObject({ builder: z.literal('eyeCup'), placement: Placement, /* BG-36 fields */ });
export const EarVesicleParams = z.strictObject({ builder: z.literal('earVesicle'), placement: Placement, /* BG-37 fields */ });
export const SomiteChevronParams = z.strictObject({ builder: z.literal('somiteChevron'), /* BG-38 fields */ });
export const FinSheetParams = z.strictObject({ builder: z.literal('finSheet'), /* BG-39 fields */ });
export const PrimordiumMoverParams = z.strictObject({ builder: z.literal('primordiumMover'), placement: Placement, /* BG-40 fields */ });
export const CustomParams = z.discriminatedUnion('builder', [
  HeartLoopParams, GutLoopParams, EyeCupParams, EarVesicleParams, SomiteChevronParams, FinSheetParams, PrimordiumMoverParams,
]);
export const SegmentArrayParams = z.strictObject({
  template: z.discriminatedUnion('kind', [                   // the template placement gives v and w; the array sets u
    z.strictObject({ kind: z.literal('ellipsoid'), ...EllipsoidParams.shape }),
    z.strictObject({ kind: z.literal('superellipsoid'), ...SuperellipsoidParams.shape }),
    z.strictObject({ kind: z.literal('tube'), ...TubeParams.shape }),
    z.strictObject({ kind: z.literal('sheet'), ...SheetParams.shape }),
    z.strictObject({ kind: z.literal('custom'), ...SomiteChevronParams.shape }),   // the only custom template
  ]),
  uStart: U, uEnd: U,
  count: z.number().min(0),                                  // interpolation type count (BG-42)
  mirror: z.boolean().default(false),
  perIndex: z.strictObject({ scale: z.number().positive(), offsetV: z.number(), chevronDeg: z.number() }).partial().optional(),
});
export const DerivedParams = z.strictObject({                // a part of another record's builder (BG-34, BG-36) or of the yolk (DM-31)
  sourceId: ZfaId,
  part: z.string().min(1),                                   // atrium, ventricle, bulbus, sinusVenosus, lens, retina, rpe, ball, extension
});
```

#### 3.2.4 GeometrySpec

A geometry lists its static parameters once and then its keyframes. A keyframe lists only the parameters that change from that hpf on (BG-41). The static block plus the first keyframe cover every required parameter of the kind (E030). Inheritance across keyframes merges objects per leaf to any depth, so a heart keyframe may list `segments.atrium.rMm` alone; an array replaces the whole array and keeps its length (BG-41, E035). zod 4 has no deep partial, so `deepPartial(shape)` below stands for a hand-written keyframe shape per kind in which every nested object is itself partial and every array keeps its full element schema.

```ts
export const PrimitiveKind = z.enum([
  'ellipsoid', 'superellipsoid', 'tube', 'lathe', 'segmentArray', 'sheet', 'shell', 'bodyDriven', 'custom', 'derived',
]);

const geometryOf = <K extends string, S extends z.ZodRawShape, F extends z.ZodRawShape>(kind: K, shape: S, fixed: F) => {
  const partial = deepPartial(shape);                        // per-leaf partial to any depth (BG-41); hand-written per kind
  return z.strictObject({
    kind: z.literal(kind),
    ...fixed,                                                // required on the static block: the builder literal of a custom kind
    ...partial,                                              // static parameters, valid for every keyframe
    keyframes: z.array(z.strictObject({
      hpf: Hpf,
      sizeRefSl: z.number().positive().optional(),           // required at or after 72 hpf (DM-14)
      ...partial,                                            // the parameters that change at this keyframe
    })).min(1),
    geometryEndHpf: Hpf.optional(),                          // the mesh ends here; the record continues as a group node
    handoffOut: z.string().optional(),                       // the handoff id that consumes this geometry
    lodHint: z.enum(['low', 'medium', 'high']).default('medium'),
    boundsMarginMm: Mm.optional(),                           // allowed protrusion beyond the body box for W007
    estimate: z.array(z.string()).default([]),               // parameter names that are estimates
    sources: z.array(z.string().min(1)).min(1),
  });
};

export const PrimitiveGeometry = z.discriminatedUnion('kind', [
  geometryOf('ellipsoid', EllipsoidParams.shape, {}),
  geometryOf('superellipsoid', SuperellipsoidParams.shape, {}),
  geometryOf('tube', TubeParams.shape, {}),
  geometryOf('lathe', LatheParams.shape, {}),
  geometryOf('segmentArray', SegmentArrayParams.shape, {}),
  geometryOf('sheet', SheetParams.shape, {}),
  geometryOf('shell', ShellParams.shape, {}),
  geometryOf('bodyDriven', {}, { part: BodyDrivenParams.shape.part }),
  geometryOf('derived', {}, DerivedParams.shape),
]);
const customOf = <S extends z.ZodRawShape & { builder: z.ZodLiteral<string> }>(p: z.ZodObject<S>) =>
  geometryOf('custom', omitBuilder(p.shape), { builder: p.shape.builder });           // one member per builder, strict
export const CustomGeometry = z.discriminatedUnion('builder', [
  customOf(HeartLoopParams), customOf(GutLoopParams), customOf(EyeCupParams), customOf(EarVesicleParams),
  customOf(SomiteChevronParams), customOf(FinSheetParams), customOf(PrimordiumMoverParams),
]);
export const GeometrySpec = z.union([PrimitiveGeometry, CustomGeometry]);
```

Between two keyframes the viewer interpolates each numeric parameter with a smoothstep (D3, BG-41). Before the first keyframe it holds the first values. After the last keyframe it holds the last values and applies the `sizeRefSl` rescale (BG-43). `omitBuilder` removes the `builder` literal from a builder's shape so that it enters the static block once, through `fixed`; `z.discriminatedUnion` takes a tuple literal, so the seven members are listed.

#### 3.2.5 StructureRecord

```ts
export const Laterality = z.enum(['midline', 'paired', 'left', 'right']);
export const ParentRelation = z.enum(['part_of', 'is_a', 'develops_from', 'grouping', 'root']);

export const SizeRow = z.strictObject({            // reference measurements, shown on the info card
  hpf: Hpf,
  stageLabel: z.string().min(1),
  dimsMm: z.record(z.string(), z.number()),        // lengths in mm: length, width, diameter, thickness, volumeMm3
  counts: z.record(z.string(), z.number()),        // counts: count, countPerSide, cells, tiers, lines, archesPerSide
  anglesDeg: z.record(z.string(), z.number()),     // angles: keys ending in Deg
  source: z.string().min(1),
  note: z.string().optional(),
  estimate: z.boolean().default(false),
  basisSL: z.number().positive().nullable().default(null), // SL of the measured specimen when known
});

export const StructureEvent = z.strictObject({
  hpf: Hpf,
  text: z.string().min(1),
  source: z.string().optional(),
  estimate: z.boolean().default(false),            // true when the hour is read from a ZFA stage bin (DM-37)
});

export const AliasLink = z.strictObject({          // ZFIN terms that name this record during a window
  zfaId: ZfaId,
  name: z.string().min(1),
  fromHpf: Hpf,
  toHpf: Hpf,
});

export const StructureRecord = z.strictObject({
  id: ZfaId,
  name: z.string().min(1),                         // equals the ZFIN label
  synonyms: z.array(z.string()),
  system: SystemId,
  alsoIn: z.array(SystemId).default([]),
  zfaParent: ZfaId.nullable(),                     // resolves in anatomy_item.txt
  uiParent: ZfaId.nullable(),                      // resolves in structures.json; null only for the root
  parentRelation: ParentRelation,                  // relation between id and zfaParent
  definition: z.string(),
  zfinStartStage: ZfsId,
  zfinEndStage: ZfsId,
  startHpf: Hpf,
  endHpf: Hpf,
  visibleFromHpf: Hpf,
  modelEndHpf: Hpf,
  overrideNote: z.string().nullable(),             // required when a window differs from ZFIN
  fadeInHpf: z.number().min(0),
  fadeOutHpf: z.number().min(0),
  laterality: Laterality,
  pickable: z.boolean().default(true),             // false: selectable from the tree and search only (AR-34)
  sexSpecific: z.enum(['female', 'male']).nullable().default(null),   // drawn only while the sex toggle matches (DM-32)
  aliasChain: z.array(AliasLink).default([]),
  events: z.array(StructureEvent),
  sizes: z.array(SizeRow),
  colorOverride: z.strictObject({
    dark: Hex,
    light: Hex,
    opacity: z.number().min(0).max(1).optional(),
  }).nullable(),
  sources: z.array(z.string().min(1)).min(1),
  geometry: GeometrySpec.nullable(),               // null for a group node
});
```

#### 3.2.6 HandoffRecord and BodyKeyframe

Section 4.8 (BG-48) lists the `HandoffRecord` schema and section 4.3.1 (BG-24) lists the `BodyKeyframe` and `BodyFile` schemas. `src/core/schema.ts` exports both. A handoff id matches `^[a-z0-9_]+$` and is unique in `handoffs.json`.

- DM-06 A window in `HandoffRecord` given in SL is placed on the time axis through the growth table, as D6 requires. The viewer never stores a second time mapping.
- DM-07 The `template` of a `segmentArray` carries sizes for one element. The element count interpolates between keyframes; the viewer draws `floor(count)` elements at full size and one more element scaled by the fraction (BG-42).

### 3.3 systems.json

The 15 rows below are the complete file content apart from `icon`, which comes from research 07 UX-VS-08. The hex values are copied from research 07 section 4.2. Research 07 has separate slots for hematopoietic (S04) and immune (S13) and no slot for axial. D5 merges blood and immune, so `hematopoietic_immune` takes S04 and `axial` takes the freed S13.

| order | id | displayName | zfaRoots (id, ZFIN name) | slot | dark | light |
|---|---|---|---|---|---|---|
| 1 | early_embryo | Early embryo | ZFA:0000020 extraembryonic structure; ZFA:0000084 yolk; ZFA:0001176 blastoderm; ZFA:0000001 Kupffer's vesicle; ZFA:0000026 hatching gland; ZFA:0000077 tail bud | S15 | `#D9C79A` | `#8E7E55` |
| 2 | axial | Axial | ZFA:0000135 notochord; ZFA:0000155 somite; ZFA:0000255 paraxial mesoderm; ZFA:0001204 axial mesoderm; ZFA:0000022 floor plate; ZFA:0000031 hypochord | S13 | `#3E9B4F` | `#01722A` |
| 3 | nervous | Nervous | ZFA:0000396 nervous system | S01 | `#5B8DEF` | `#1863BF` |
| 4 | sensory | Sensory | ZFA:0000282 sensory system | S02 | `#7FD3F5` | `#2989A9` |
| 5 | cardiovascular | Cardiovascular | ZFA:0000010 cardiovascular system | S03 | `#E4483C` | `#B81A1D` |
| 6 | hematopoietic_immune | Blood and immune | ZFA:0005023 hematopoietic system; ZFA:0001159 immune system | S04 | `#F28FA0` | `#B15567` |
| 7 | respiratory | Respiratory | ZFA:0000272 respiratory system; ZFA:0001306 pharyngeal arch | S09 | `#66D1C2` | `#028B7E` |
| 8 | digestive | Digestive | ZFA:0000339 digestive system | S08 | `#A9713B` | `#84511C` |
| 9 | excretory | Excretory | ZFA:0000163 renal system | S10 | `#C6D34A` | `#7A8800` |
| 10 | endocrine | Endocrine | ZFA:0001158 endocrine system | S12 | `#D34FA7` | `#AA2382` |
| 11 | reproductive | Reproductive | ZFA:0000632 reproductive system | S11 | `#B067D6` | `#8641AC` |
| 12 | skeletal | Skeletal | ZFA:0000434 skeletal system | S06 | `#F0EDE4` | `#939088` |
| 13 | muscular | Muscular | ZFA:0000548 musculature system | S05 | `#F08A3C` | `#B05500` |
| 14 | fins | Fins | ZFA:0000108 fin | S14 | `#A9AFF2` | `#6972B0` |
| 15 | integument_pigment | Skin and pigment | ZFA:0000368 integument; ZFA:0009090 pigment cell | S07 | `#C3CAD2` | `#7A8188` |

All ids and names come from `anatomy_item.txt` (ZFA release 2026-07-16). `ZFA:0000282` covers the visual, vestibuloauditory, olfactory and lateral line systems by `is_a`. `ZFA:0000339` covers the liver (ZFA:0000123) and the pancreatic system (ZFA:0001371) by `part_of`.

- DM-08 `systems.json` is the only place that maps a system to a palette slot and to hex values. The viewer reads colours from it and never hard-codes a hue.

### 3.4 Group nodes

A group node is a `StructureRecord` with `geometry: null`. It exists so that every `uiParent` resolves and so that the tree can collapse a region. The list below has two parts. The first part is 29 ZFA terms that the drafts name as a parent but do not describe. The second part is 16 draft records whose shape notes say "group node", or whose volume the children already draw. Names come from `anatomy_item.txt`. The system follows the children that reference the node. Three draft records that earlier versions of this list treated as group nodes carry geometry instead: the root ZFA:0001094 whole organism is the skin tube (DM-31), the eye ZFA:0000107 owns the `eyeCup` builder (DM-34), and the kidney ZFA:0000529 draws the 03d strip that the pronephros handoff seeds (BG-49).

| ZFA id | name | system | why it is a group node |
|---|---|---|---|
| ZFA:0001114 | head | axial | body region; the skin tube draws it |
| ZFA:0001115 | trunk | axial | body region; the skin tube draws it |
| ZFA:0001117 | post-vent region | axial | body region; the skin tube draws it |
| ZFA:0007116 | pleuroperitoneal region | axial | trunk body cavity under ZFA:0001115; ZFA lists it as an anatomical cluster with eleven part-of children (intestine, pancreas, pronephros, gonad, swim bladder and others); the swim bladder's `uiParent` is the respiratory system with `parentRelation: 'grouping'` |
| ZFA:0007115 | pericardial region | axial | head-trunk body cavity under ZFA:0001115; the pericardium's `uiParent` is the cardiovascular system with `parentRelation: 'grouping'` |
| ZFA:0000092 | axis | axial | regime R2 of the body model draws the wrapped axis |
| ZFA:0000020 | extraembryonic structure | early_embryo | draft 03a: grouping node |
| ZFA:0000255 | paraxial mesoderm | axial | draft 03a: grouping node |
| ZFA:0000017 | endoderm | axial | parent of hypochord; not described |
| ZFA:0000473 | trunk musculature | muscular | parent of myotome; not described |
| ZFA:0000548 | musculature system | muscular | 03e uiParent; not described |
| ZFA:0000396 | nervous system | nervous | system root of D5; parent of the central and peripheral nervous systems; not described |
| ZFA:0000012 | central nervous system | nervous | parent of neural plate to spinal cord; not described |
| ZFA:0000142 | peripheral nervous system | nervous | parent of the ganglia; not described |
| ZFA:0000008 | brain | nervous | draft 03b: union of the child lobes |
| ZFA:0000109 | forebrain | nervous | draft 03b: group node |
| ZFA:0000282 | sensory system | sensory | system root of D5; parent of the visual, vestibuloauditory, olfactory and lateral line systems; not described |
| ZFA:0001127 | visual system | sensory | parent of eye; not described |
| ZFA:0001138 | vestibuloauditory system | sensory | parent of inner ear; not described |
| ZFA:0001149 | olfactory system | sensory | parent of peripheral olfactory organ; not described |
| ZFA:0000034 | lateral line system | sensory | draft 03b: group node |
| ZFA:0000010 | cardiovascular system | cardiovascular | parent of heart and vessels; not described |
| ZFA:0000096 | cardinal system | cardiovascular | parent of the cardinal veins; not described |
| ZFA:0005003 | pharyngeal vasculature | cardiovascular | parent of aortic arch and ventral aorta; not described |
| ZFA:0005024 | trunk vasculature | cardiovascular | parent of dorsal aorta and trunk vessels; not described |
| ZFA:0005037 | post-vent vasculature | cardiovascular | parent of caudal artery and vein; not described |
| ZFA:0001267 | cranial vasculature | cardiovascular | draft 03c: group node |
| ZFA:0005023 | hematopoietic system | hematopoietic_immune | parent of intermediate cell mass and spleen; not described |
| ZFA:0001159 | immune system | hematopoietic_immune | parent of thymus; not described |
| ZFA:0000272 | respiratory system | respiratory | parent of gill; `uiParent` of the swim bladder by `grouping` (D5) |
| ZFA:0000339 | digestive system | digestive | parent of gut, pharynx and mouth; not described |
| ZFA:0000112 | gut | digestive | draft 03d: group node |
| ZFA:0001338 | intestine | digestive | draft 03d: group node |
| ZFA:0000036 | liver and biliary system | digestive | parent of liver and gall bladder; not described |
| ZFA:0001371 | pancreatic system | digestive | parent of the pancreatic buds; not described |
| ZFA:0000140 | pancreas | digestive | endocrine and exocrine pancreas fill its volume |
| ZFA:0000163 | renal system | excretory | parent of pronephros and kidney; not described |
| ZFA:0000151 | pronephros | excretory | draft 03d: group node; its parts (glomerulus, tubule, duct) carry the geometry and the handoff (BG-49) |
| ZFA:0001158 | endocrine system | endocrine | parent of thyroid and ultimobranchial body; not described |
| ZFA:0000632 | reproductive system | reproductive | parent of gonad and germ cells; not described |
| ZFA:0000413 | gonad | reproductive | draft 03d: group node; the immature gonad ZFA:0005272 drives the sex handoff and the toggled child is drawn (DM-32) |
| ZFA:0000434 | skeletal system | skeletal | 03e uiParent; not described |
| ZFA:0001216 | splanchnocranium | skeletal | draft 03e: group of seven arches; the cartilages draw them |
| ZFA:0000108 | fin | fins | 03e uiParent; not described |
| ZFA:0000368 | integument | integument_pigment | 03e uiParent; not described |

- DM-09 A group node carries the full record apart from geometry: definition, ZFIN window, sources. The info card shows it like any structure, without a "Jump to first appearance" target in 3D.
- DM-10 A slice-2 author may add geometry to a group node. The author may also set `geometry: null` on a container whose children fill its volume. Both changes pass through `npm run validate`.
- DM-30 A group node's `modelEndHpf` is the latest `modelEndHpf` of its descendants and its `visibleFromHpf` the earliest, each with an `overrideNote` that names the child, so the tree filter of UX-IN-26 never hides a present child under an absent parent. The extraembryonic structure ZFA:0000020 therefore ends at 168 hpf (the yolk) although ZFA ends it at 48, and the axis ZFA:0000092 ends at 19 hpf with regime R2. Rule W009 warns when a group node's window does not contain a child's window.
- DM-31 The root ZFA:0001094 whole organism is not a group node. Its geometry is `{ kind: 'tube', path: { type: 'spine', uStart: 0, uEnd: 1, v: 0, w: 0 }, radiusMm: 'body' }` (BG-30), so the skin is a normal structure with a material, an opacity and a tree row; its `system` is `integument_pigment`, because research 07 UX-VS-05 and UX-VS-15 define the skin as the S07 shell, and rule W003 exempts the root. It has `pickable: false` (AR-34). The yolk ZFA:0000084 and the chorion ZFA:0000329 carry `kind: 'bodyDriven'`; their shape comes from `frame.yolk` and `frame.chorion` (BG-33) and their presence, colour and opacity from the record. Ball ZFA:0000006 and extension ZFA:0000106 are `derived` from the yolk with parts `ball` and `extension`. `Body.tsx` draws the two `bodyDriven` records; every other record goes through `StructureMesh`.
- DM-32 A record with `sexSpecific` set is drawn only while the `sex` state matches. Ovary ZFA:0000403 is `female` and testis ZFA:0000598 is `male`. Both have `visibleFromHpf` 600 with an `overrideNote` that cites the D9 window (ZFA starts both at 504 hpf). The immature gonad ZFA:0005272 (ZFA 336 to 720 hpf, an ellipsoid pair in the 03d draft) is the `from` and `driver` of the `gonad_sex` handoff; the gonad ZFA:0000413 stays the group node that parents all three. The ZFA term `gonad primordium` ZFA:0001262 ends at 312 hpf, so the D9 row "gonad primordium" maps to the immature gonad in this window (section 7.3).

### 3.5 Merge plan

The merge script reads the five draft files (`03a` to `03e`, 220 records) and writes `structures.json`. It runs once; after that, authors edit `structures.json` directly.

#### 3.5.1 Field mapping

| Draft field | Schema field | Rule |
|---|---|---|
| `id`, `name`, `synonyms`, `definition`, `sources` | same | copied |
| `system` | `system` | after the system remap below |
| `uiGroup` (03a) | none | remap key only |
| `parent` (03a to 03d) | `uiParent` | also `zfaParent` when `anatomy_relationship.txt` has a `part_of` or `is_a` row |
| `parent` (03e) | `zfaParent` | |
| `uiParent` (03e) | `uiParent` | |
| `parentAll` (03e), `zfaPartOf` (03b, 03c), `developsFrom` (03c) | none | ZFA holds these |
| `parentRelation` (03a) | `parentRelation` | other files: derived from the ZFA row, else `grouping` |
| `startStage`, `endStage` | `zfinStartStage`, `zfinEndStage` | |
| `startStageName`, `endStageName` | none | joined from `stages.json` |
| `startHpf`, `endHpf` | same | |
| `visibleFromHpf`, `modelEndHpf` | same | defaults applied when absent |
| `visibleFromNote`, `visibleNote`, `modelEndNote`, `startNote`, `endNote` | `overrideNote` | concatenated with "; " |
| `spatial.apFraction` | `geometry.placement.u` | conversion below: `u = apFraction x L_source(t) / axisLengthMm(t)` |
| `spatial.apFractionByStage` | keyframe `placement` overrides | keys `24`, `48`, `120` are hpf; `adult` is 2160 |
| `spatial.dv` | `geometry.placement.v` | keyword table: dorsal 0.6, ventral -0.6, spine or midline 0, surface plus or minus 1 |
| `spatial.laterality` | `laterality`, `placement.mirror` | prefix match on the lower-cased value: `paired`, `bilateral`, `bilobed` or `two` give `paired` and `mirror: true`; a value that starts with `left` (also `left-ventral`) gives `left`; `right` gives `right`; `fused`, `single` and every other value give `midline` |
| `spatial.landmarks`, `shape.notes`, `notes` | none | stay in the research files as slice-2 input |
| `shape.primitive` | `geometry.kind` | `sphere` becomes `ellipsoid` with equal radii; `fin` becomes `sheet` |
| `sizes[].dims_um` | `sizes[].dimsMm`, `sizes[].counts`, `sizes[].anglesDeg` | by allowlist on the key: a key that matches `/count|cells|tiers|lines|_per_/i` goes to `counts` unchanged (camel-cased, so `count_per_side` becomes `countPerSide`); a key that ends in `Deg` goes to `anglesDeg` unchanged; `volume_um3` becomes `dimsMm.volumeMm3` divided by 1e9; a key that ends in `Fraction` is dropped with a note; every other key is a length in micrometres and goes to `dimsMm` divided by 1000. The 76 distinct keys of the five drafts are listed in the merge log; rule W008 warns on a key outside the list |
| `sizes[].basis` (03c) | `sizes[].estimate` | `estimate` gives true; `derived` gives false with note "derived" |
| `sizes[].estimate` (03e) | `sizes[].estimate` | |
| `sizes[].stageLabel`, `hpf`, `source`, `note` | same | |
| `events[].event` | `events[].text` | `hpf` and `source` copied |
| `colorHint` | none | colours come from `systems.json` and the exception list |

- DM-11 The merge writes each `SizeRow` unchanged apart from the unit. Size rows are reference data for the info card. Geometry keyframes are authored in slice 2 from the size rows and the shape notes; the merge writes `geometry: null` for every record and a `geometry.todo` file lists the primitive kind and the converted `u` range per record.

#### 3.5.2 System remap

| Draft value | Schema value | Source |
|---|---|---|
| `extraembryonic`; 03a `uiGroup` `early_embryo` | `early_embryo` | D5 |
| 03a `uiGroup` `axial` and `body_region` | `axial` | D5; body regions are group nodes |
| 03a `uiGroup` `fin_fold` | `fins` | D5 |
| floor plate ZFA:0000022 (03a: nervous) | `axial` | D5 scope |
| pharyngeal arch ZFA:0001306 (03a: axial) | `respiratory` | D5 duplicate ownership |
| ceratobranchial 5 tooth ZFA:0000694 (03e: skeletal) | `digestive` | D5; the fact check preferred skeletal, D5 wins |
| head kidney ZFA:0000669 (03c: hematopoietic_immune) | `excretory` | D5; hematopoietic event kept at 96 hpf |
| hypophysis ZFA:0000118, epiphysis ZFA:0000019 | `nervous`, `alsoIn: ['endocrine']` | D5 |

#### 3.5.3 Duplicate ownership

Seven ids appear in two files. The merge keeps one record per id and resolves the conflicts as research 03 fact-check table 2.2 and D5 direct.

| id | name | kept | resolution |
|---|---|---|---|
| ZFA:0001185 | periderm | 03e record | `uiParent` ZFA:0000368; `zfaParent` ZFA:0000016 (`part_of`); thickness 0.002 to 0.003 mm; `modelEndHpf` 168 from 03a with note |
| ZFA:0001056 | myotome | 03e record | count 30 to 32 with note; the adult keyframe carries `sizeRefSl` 28 (DM-15) |
| ZFA:0000671 | horizontal myoseptum | 03a record | `zfaParent` ZFA:0001089 (`is_a`); `uiParent` ZFA:0001056 |
| ZFA:0000040 | median fin fold | 03a record | `visibleFromHpf` 19 (the tail is free at 19 hpf, BG-14; ZFA starts the fold at 22 and the 03a note at 18) and `modelEndHpf` 720 with notes; the height ramps from 0.02 mm at 19 hpf to the 0.06 mm of BG-39 at 24 hpf; system fins |
| ZFA:0001306 | pharyngeal arch | 03c record | system respiratory; the 03c parameterization (count per side, region length, arch width) |
| ZFA:0000669 | head kidney | 03d record | system excretory; `visibleFromHpf` 96 with the Willett et al. 1999 note; 03c 120 hpf sizes merged in |
| ZFA:0000694 | ceratobranchial 5 tooth | 03e record | system digestive; the 03e count series kept |

#### 3.5.4 Position: apFraction to u

`u` is arc length along the spine divided by the snout-to-notochord-end length, which equals SL after flexion (D3). Each draft used a different denominator. The rule per source and per `apFractionByStage` key is `u = apFraction x L_source(t) / axisLengthMm(t)`, clamped to `[0, 1]` except for records in the fins system. `L_source(t)` is the length in the source's own measure at the key's hpf, read from `growth.lengthMm` (EL or TL) or `growth.standardLengthMm` (SL). `axisLengthMm(t)` is the `axisLengthMm` of `body.json` at that hpf (section 4.3.2), which the growth table does not hold. The formula therefore has a value at every key, including 24 and 48 hpf where `standardLengthMm` is null.

| Source | Measure up to 72 hpf | Measure 72 to 720 hpf | Measure at 2160 hpf | `L_source / axisLengthMm` at 24, 48, 120, 2160 hpf |
|---|---|---|---|---|
| 03a | axis length from the snout (research 03a section 2) | TL | SL 18 mm | 1.00, 1.00, 1.083, 1.00 |
| 03b | EL | SL | SL 18 mm | 0.93, 1.07, 1.00, 1.00 |
| 03c | TL (1.9, 3.1 mm at 24, 48 hpf) | TL (3.9 mm at 120 hpf) | SL 25 mm | 0.93, 1.07, 1.083, 1.00 |
| 03d | TL | TL | TL (anal fin origin at 0.55 TL) | 0.93, 1.07, 1.083, 1.20 |
| 03e | SL | SL | SL 28 mm | 1.00, 1.00, 1.00, 1.00 |

The factors are `lengthMm / axisLengthMm` at the key: 1.90 / 2.05 at 24 hpf, 3.10 / 2.90 at 48 hpf, 3.90 / 3.60 at 120 hpf, and 21.6 / 18.0 at 2160 hpf (sections 4.3.2 and 4.4). Research 05 section 5.1 states that EL is shorter than the axis length in a curled embryo, which is why the 24 hpf factor is below 1; the earlier assumption that TL, EL and axis length are equal before 72 hpf is dropped. For 03a and 03e the source measure is the axis length or SL, so the factor is 1 by definition.

- DM-12 `u` may exceed 1.0 only for records in the fins system, and never exceeds 1.25 (BG-08). The caudal fin reaches 1.2 (research 05 section 13: TL is about 1.2 x SL).
- DM-13 `v` and `w` from the merge are provisional. Slice-2 authors set them against the body model and the validator checks only the range.

#### 3.5.5 Reference SL rule (D6)

- DM-14 A keyframe at or after 72 hpf carries `sizeRefSl`, the SL in millimetres at which its sizes are stated (D6). A keyframe before 72 hpf carries none.
- DM-15 A keyframe before 72 hpf stores sizes in absolute millimetres. A keyframe at or after 72 hpf stores the measured sizes and sets `sizeRefSl` to the SL of the measured specimen. For a 2160 hpf row from the drafts that SL is the adult SL of the source file. It is 18 for 03a and 03b, 25 for 03c and 03d, and 28 for 03e. For every other row it is `growth.standardLengthMm` at the row's hpf.
- DM-16 At runtime the viewer rescales the sizes of each bracketing keyframe that carries `sizeRefSl` by `slScale(t, sizeRefSl) = SL(max(t, 72)) / sizeRefSl` before it interpolates (BG-43). Between a pre-72 keyframe without `sizeRefSl` and a post-72 keyframe with it, for example the notochord at 60 hpf, the post-72 keyframe is therefore scaled by `SL(72) / sizeRefSl` and the pre-72 keyframe is not scaled; `slAt` stays null before 72 hpf and never enters a division. At `t = 72` the growth table SL equals the `sizeRefSl` of a 72 hpf keyframe, so the R3 to R4 boundary is continuous.
- DM-17 A `Size` with unit `bodyHeightFraction` skips the rule; it is a fraction of `hD(u) + hV(u)` at the placement `u`.
- DM-18 The growth table has 32 rows at the body keyframe times; section 4.4 lists every value and source. `standardLengthMm` is null before 72 hpf. From 72 to 720 hpf it is TL minus the caudal fin extent beyond the notochord end (BG-26). From 1080 hpf it is the Singleman and Holtzman SL and `lengthMm` is 1.2 x SL (D6; research 05 section 13).

#### 3.5.6 Presence window rules

- DM-19 `visibleFromHpf` defaults to `startHpf`. When `zfinStartStage` is `ZFS:0000000` (Unknown, 22 records), the record must set `visibleFromHpf` above 0 and give an `overrideNote`.
- DM-20 `visibleFromHpf` below `startHpf` is allowed with an `overrideNote`. Four records use it. Caudal vein ZFA:0000180 starts at 24 (ZFIN 96). Intersegmental vessel ZFA:0001285 starts at 22 (ZFIN 24). Thyroid primordium ZFA:0001081 starts at 24 (ZFIN 30). Endocrine pancreas ZFA:0001260 starts at 24 (ZFIN 48).
- DM-21 `modelEndHpf` defaults to the smaller of `endHpf` and 4320. D8 overrides: chorion ZFA:0000329 72 with fade from 48; yolk ZFA:0000084 168 (ZFA ends at 144); ball ZFA:0000006 and extension ZFA:0000106 168 (ZFA ends at 120). Draft overrides with notes: median fin fold 720, periderm 168, primordial germ cell ZFA:0009288 720 (the gonad handoff `gonad_sex` takes over). Biology overrides with notes, where the ZFA end stage is a wide bin: Kupffer's vesicle ZFA:0000001 ends at 19 hpf with `fadeOutHpf` 2 (ZFA ends it at Prim-5, 30 hpf; it regresses between the 14- and 20-somite stages, Kimmel 1995 and Essner et al. 2005); tail bud ZFA:0000077 ends at 24 hpf (ZFA Prim-5; the tail bud is spent when the last somites form). The merge log lists every record whose ZFA end is a bin wider than 6 h and whose draft `modelEndHpf` is null, for a slice-2 audit.
- DM-22 `fadeInHpf` defaults to 5 percent of the duration of the ZFS stage that contains `visibleFromHpf`; `fadeOutHpf` uses the stage that contains `modelEndHpf` (D3). D8 sets chorion `fadeOutHpf` 24 and posterior chamber swim bladder ZFA:0001278 `fadeInHpf` 24 (96 to 120 hpf).
- DM-36 The axis end is a clamp, not an end. When `endHpf` exceeds 4320, the merge writes `modelEndHpf` 4320 and `fadeOutHpf` 0; when `startHpf` is 0, it writes `fadeInHpf` 0. Without this rule the about 150 records that ZFA carries to the adult stage would take the 5 percent default of the Adult stage (15,360 h), fade from 3552 hpf and reach opacity 0 at the 180 dpf headline tick. Rule E032 enforces it.
- DM-23 Every keyframe lies inside `[visibleFromHpf, modelEndHpf]`, and the first keyframe lies at `visibleFromHpf`.
- DM-33 Handoff windows are written into the records, never applied at runtime. For every row of `handoffs.json` the merge sets each `to` record's `visibleFromHpf` to the window start and each `from` record's `modelEndHpf` to the window end, with an `overrideNote` that names the handoff. A `to` record whose ZFA start precedes the window keeps its ZFA start: the forebrain regions ZFA start at 14 hpf while the `neural_tube_brain` window is 22 to 24 hpf, and the kidney ZFA start is 120 hpf while the `pronephros_mesonephros` window is 288 to 336 hpf. Such a record is seeded from the driver at its own `visibleFromHpf` (BG-49). Rule E034 checks the result; the runtime clamp that an earlier version of BG-48 described is deleted.
- DM-37 A ZFA start stage is a bin, never an event time. An event whose hour is read from a stage bin carries `estimate: true` and sits at the bin's most probable hour from the literature, not at the bin start. Tooth 5V ZFA:0001142 starts in the Protruding-mouth bin (72 to 96 hpf); its event "tooth 5V present" stays at 96 hpf with `estimate: true` (Van der heyden and Huysseune 2000: 5V1 in the 80 to 96 hpf range), so the card does not list 3V and 5V at one instant.

#### 3.5.7 Fixes the fact check demanded

Each fix names research 03 fact-check findings section 4 by item number.

1. Item 1, apFraction clamps: caudal fin ZFA:0001058 `u` [0.95, 1.0] with the sheet outline reaching 1.2; lepidotrichium ZFA:0001554 `u` [0.26, 1.0] with the rays on the fin outlines; melanophore stripe ZFA:0001463 [0.25, 1.0]; melanocyte ZFA:0009091, xanthophore ZFA:0009198 and iridophore ZFA:0009199 [0.05, 1.0]. The basis for the atlas is SL (DM-12).
2. Item 2, duplicates: the table above.
3. Item 3, parents: the 23 records of fact-check table 2.3 move the draft `parent` to `uiParent`. Their `zfaParent` comes from the "direct ZFA parents" column, with `parentRelation` `is_a` or `part_of`. The four develops_from cases (yolk syncytial layer, notochord, paraxial mesoderm, periderm) set `parentRelation: 'develops_from'` and keep the draft parent as `uiParent`. The 16 null parents of 03e take `zfaParent` from ZFA: horizontal myoseptum ZFA:0001089; slow and fast muscle cell ZFA:0009115; adductor mandibulae and sternohyoid ZFA:0000236; median fin fold ZFA:0000292; pectoral and pelvic fin bud ZFA:0001383; pectoral and pelvic fin ZFA:0005596; dorsal fin ZFA:0005597; lepidotrichium ZFA:0001590; the four larval melanophore stripes ZFA:0005220.
4. Item 4, pectoral fin bud ZFA:0000141: `visibleFromHpf` 28 (D8) with the Kimmel note; the 24 hpf size row moves to 28 hpf.
5. Item 5, yolk ZFA:0000084 at 48 hpf: the size row is generated from `body.json` (`ballDiameter` 0.44 mm, `extensionLength` 0.65 mm, section 4.3.2; research 05 section 7 gives 0.44 and 0.65 x 0.14 at long-pec). The yolk size rows at every keyframe come from `body.json` through the merge, so the info card and the mesh cannot drift. The fact-check value of 0.400 and 0.600 mm (extension 1.5 x ball diameter) is superseded.
6. Item 6, tooth ZFA:0000694: the "tooth 5V present" event stays at 96 hpf with `estimate: true` (DM-37). The fact check moved it to 72 hpf because the ZFA start stage of tooth 5V is Protruding-mouth; that stage is the 72 to 96 hpf bin, and 96 hpf lies inside it.
7. Item 7, heart ZFA:0000114: looping starts at 30 hpf (D8); the tube stays straight before 30 hpf; the "from 28 hpf" event text is removed.
8. Item 8, adult SL: no numbers change; DM-15 records the source basis (25 mm for 03c and 03d, 28 mm for 03e) as `sizeRefSl`.
9. Item 9, six missing size rows: periderm ZFA:0001185 at 48 and 120 hpf (copies of the 24 hpf row scaled by the body length ratio, marked estimate); otic placode ZFA:0000138 at 24 hpf; posterior lateral line primordium ZFA:0001157 at 120 hpf; heart rudiment at 24 hpf (becomes the heart record's 24 hpf row); primordial germ cell ZFA:0009288 at 720 hpf (terminal row, copy of 120 hpf).
10. Item 10, system names: D5 closes it; the remap table above.
11. Item 11: DM-20.
12. Nineteen size rows outside the presence window (fact-check section 2.6). "Move" keeps the values and changes the hpf; "drop" deletes the row.

| id | name | row (hpf) | action |
|---|---|---|---|
| ZFA:0000084 | yolk | 2160 | drop (`modelEndHpf` 168) |
| ZFA:0000035 | lens | 24 | keep; `visibleFromHpf` 24 with note (optic cup handoff 24 to 30 hpf, D9) |
| ZFA:0000152 | retina | 24 | keep; same rule |
| ZFA:0000144 | retinal pigmented epithelium | 24 | keep; same rule |
| ZFA:0000048 | olfactory placode | 16 | move to 22 (`visibleFromHpf`) |
| ZFA:0000217 | inner ear | 24, 48 | drop 24; move 48 to 66; `visibleFromHpf` 66 (otic vesicle handoff 66 to 72 hpf, D9) |
| ZFA:0000076 | swim bladder | 60 | keep; `visibleFromHpf` 60 (ZFA start Pec-fin) as a collapsed sac of radius about 0.02 mm, seeded from the swim bladder bud (BG-49); the D8 inflation runs on the posterior chamber ZFA:0001278 with `fadeInHpf` 24 from 96 hpf |
| ZFA:0000123 | liver | 24 | drop (liver primordium ZFA:0000124 holds 24 hpf) |
| ZFA:0000208 | gall bladder | 48 | move to 72 |
| ZFA:0000298 | vent | 24, 48 | drop both (proctodeum ZFA:0000066 holds 22 to 30 hpf) |
| ZFA:0000529 | kidney | 120 | keep; `visibleFromHpf` 120 (ZFA start, DM-33); the pronephros handoff runs 288 to 336 hpf (D9) |
| ZFA:0000547 | mouth | 48 | move to 60 |
| ZFA:0001200 | corpuscles of Stannius | 24 | move to 50 |
| ZFA:0001448 | ultimobranchial body | 60, 120 | drop 60; move 120 to 168 |
| ZFA:0000622 | barbel | 900 | move to 1080 |
| ZFA:0007049 | adductor mandibulae | 2160 | keep; `modelEndHpf` 4320 with note (ZFIN end stage Days 21-29 is an annotation limit; the muscle persists) |

- DM-24 The heart is one record, ZFA:0000114 (D9). The merge folds four draft records into its `aliasChain`: heart primordium ZFA:0000028, heart rudiment ZFA:0000115, primitive heart tube ZFA:0000149 and heart tube ZFA:0000360. With the record's own name these are the five ZFIN heart terms of D9. Each `AliasLink` carries `zfaId`, `name`, `fromHpf` and `toHpf`. The alias windows are 11.66 to 19, 19 to 22, 22 to 24 and 24 to 42 hpf. Each window starts at the ZFIN start stage of its term. The heart record gets `visibleFromHpf` 19 (the heart rudiment, section 4.10) and an `overrideNote`. The heart primordium alias precedes the geometry and appears on the info card only. Their size rows and events merge into the heart record. Atrium ZFA:0000471, cardiac ventricle ZFA:0000009, bulbus arteriosus ZFA:0000173 and sinus venosus ZFA:0000154 stay as records. They have `visibleFromHpf` 42 and `derived` geometry (BG-34).
- DM-34 The eye is one record, ZFA:0000107, and owns the `eyeCup` builder (BG-36) from 11.66 hpf to the adult, on the pattern that D9 sets for the heart. The merge folds two draft records into its `aliasChain`: optic vesicle ZFA:0000050 (11.66 to 19 hpf) and optic cup ZFA:0001202 (19 to 24 hpf); each window starts at the ZFIN start stage of its term and the record's own name applies from 24 hpf, its ZFA start. The eye gets `visibleFromHpf` 11.66 with an `overrideNote`. The optic vesicle to optic cup row of D9 is a `withinRecord` handoff (the builder's `stage` steps from `vesicle` to `cup` over 16 to 24 hpf) and the optic cup to parts row seeds retina, lens and retinal pigmented epithelium from the eye's parameters over 24 to 30 hpf (BG-49). The eye's own mesh ends at 30 hpf (`geometryEndHpf`) and the record continues as the selectable parent of the three parts, whose `derived` geometry reads the eye's keyframes to the adult. Without one owner the `eyeCup` builder had no record after 30 hpf, when the optic cup ends in ZFIN.
- DM-35 Unit suffix rule. A numeric parameter name ends in `Mm` (length, rescaled by BG-43 unless its value carries `unit: 'bodyHeightFraction'`), ends in `Deg` (angle, interpolation type `angle`), starts with `count` (type `count`), or is one of `u`, `v`, `w`, `s0`, `s1`, `e1`, `e2`, `ellipticity`, `exponent`, a name ending in `Fraction`, or a `Placement` field (dimensionless, type `number` without rescale). `src/core/paramUnits.ts` holds the rule; `interpolation.ts` derives each leaf's type from it (BG-47); the unit test of QP-16 fails on a schema leaf outside the rule.
- DM-25 Record count after the merge: 220 draft records, minus 7 duplicates, minus 4 heart aliases, minus 2 eye aliases (DM-34), plus 29 group nodes that the drafts do not describe, gives 236.

### 3.6 Colour exceptions (D10)

The exception list is data: the `colorOverride` field of each record named below. Every other record has `colorOverride: null` and takes the system hue with the lightness step of research 07 UX-VS-07. The dark hex values come from the draft `colorHint` fields where the drafts agree. Those are the 03c vessel colours, the 03e cartilage and bone colours, and the 03a yolk colour. The light hex values are proposals from this section; the research 07 check script must confirm 3:1 contrast against `#F5F6F7` before slice 3.

| Role (D10) | Records | dark | light | opacity |
|---|---|---|---|---|
| artery red | ZFA:0000014 dorsal aorta; ZFA:0000011 caudal artery; ZFA:0005004 aortic arch; ZFA:0000604 ventral aorta; ZFA:0005002 basilar artery; ZFA:0001053 primitive internal carotid artery | `#E31A1C` | `#A50F15` | |
| vein blue | ZFA:0000477 posterior cardinal vein; ZFA:0000423 anterior cardinal vein; ZFA:0000186 common cardinal vein; ZFA:0000180 caudal vein; ZFA:0001286 caudal vein plexus; ZFA:0001052 primordial hindbrain channel; ZFA:0005934 subintestinal venous plexus | `#1F78B4` | `#08519C` | |
| otolith white | ZFA:0001617 otolith | `#F5F5F5` | `#C8CCD0` | |
| near black | ZFA:0000144 retinal pigmented epithelium; ZFA:0009091 melanocyte; ZFA:0005221, ZFA:0005222, ZFA:0005223, ZFA:0005224 larval melanophore stripes; ZFA:0001463 melanophore stripe | `#23262B` | `#1B1F24` | |
| xanthophore yellow | ZFA:0009198 xanthophore | `#FFB000` | `#C97D00` | |
| iridophore silver | ZFA:0009199 iridophore | `#C9D6DF` | `#7D8A94` | |
| cartilage Alcian blue | ZFA:0001580 neurocranium; ZFA:0001205 Meckel's cartilage; ZFA:0001399 palatoquadrate cartilage; ZFA:0001400 ceratohyal cartilage; ZFA:0001422 hyosymplectic cartilage; ZFA:0000095 pharyngeal arch 3-7 skeleton; ZFA:0000364 hypural | `#8FC1E3` | `#2F6F9F` | |
| bone alizarin ivory | ZFA:0000694 ceratobranchial 5 tooth; ZFA:0000191 dentary; ZFA:0000270 maxilla; ZFA:0000250 opercle; ZFA:0000184 cleithrum; ZFA:0001189 vertebra; ZFA:0000538 rib; ZFA:0001188 Weberian apparatus; ZFA:0001554 lepidotrichium | `#E9DFC4` | `#8C7F5E` | |
| yolk pale yellow | ZFA:0000084 yolk; ZFA:0000006 ball; ZFA:0000106 extension; ZFA:0000088 yolk syncytial layer | `#F2C94C` | `#A6861B` | |
| lens clear | ZFA:0000035 lens | `#CFEEFF` | `#8FB4CC` | 0.35 |
| chorion glass | ZFA:0000329 chorion | `#C8D0D8` | `#7A8790` | 0.10 (research 07 UX-VS-15) |

Intersegmental vessel ZFA:0001285 and the dorsal longitudinal anastomotic vessel ZFA:0005025 carry arterial and venous segments and keep the system hue. The neurocranium keeps the cartilage colour in version 1 although its ethmoid region ossifies at 1080 hpf. The xanthophore hex was `#F2C14E`, which sat deltaE 5.5 from the yolk `#F2C94C` and 7.1 from `--focus`; `#FFB000` sits deltaE 23 from the yolk and 30 from the muscular hue (review UXR-13). The check script of UI-42 confirms every pair before `systems.json` freezes in WP-02.

- DM-26 A `colorOverride` never changes on selection. Selection is an outline in `--focus` (D10, research 07 UX-VS-17).

### 3.7 Attribution data

```ts
// src/core/attribution.ts
export const attribution = {
  zfin: {
    holder: 'ZFIN, The Zebrafish Information Network, University of Oregon, https://zfin.org',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    text:
      'Anatomy terms, definitions, synonyms, parent relations, stage names and stage times ' +
      'are derived from ZFIN, the Zebrafish Information Network (https://zfin.org), and are ' +
      'used under the Creative Commons Attribution 4.0 licence. Zebrafish Anatomy Ontology ' +
      '(ZFA) and Zebrafish Stage Ontology (ZFS) release 2026-07-16 (zfa.obo data-version ' +
      'releases/2026-07-16). Files: anatomy_item.txt, anatomy_relationship.txt, ' +
      'anatomy_synonyms.txt, stage_ontology.txt, downloaded 2026-09-06. The atlas modifies ' +
      'these data: it adds model windows, positions, sizes and colours that ZFIN does not provide.',
    footer: 'Definitions and stages: ZFIN, CC BY 4.0',
  },
  zfaRelease: '2026-07-16',
  citations: [
    {
      key: 'Kimmel1995',
      text: 'Kimmel CB, Ballard WW, Kimmel SR, Ullmann B, Schilling TF. Stages of embryonic ' +
        'development of the zebrafish. Dev Dyn 1995;203:253-310.',
      doi: '10.1002/aja.1002030302',
      use: 'stage times, embryo lengths, head-trunk angles, staging text read through the ZFIN staging pages',
    },
    {
      key: 'Parichy2009',
      text: 'Parichy DM, Elizondo MR, Mills MG, Gordon TN, Engeszer RE. Normal table of ' +
        'postembryonic zebrafish development. Dev Dyn 2009;238:2975-3015.',
      doi: '10.1002/dvdy.22113',
      use: 'post-embryonic milestones by standard length',
    },
    {
      key: 'Singleman2014',
      text: 'Singleman C, Holtzman NG. Growth and maturation in the zebrafish, Danio rerio: ' +
        'a staging tool for teaching and research. Zebrafish 2014;11:396-406.',
      doi: '10.1089/zeb.2014.0976',
      use: 'juvenile and adult standard length thresholds at 45, 90 and 180 dpf',
    },
  ],
  notes: [
    'No figure from Kimmel et al. 1995 is redistributed (D14).',
    'Code is MIT licensed; see LICENSE.',
  ],
} as const;
```

- DM-27 The info card footer shows `attribution.zfin.footer` with a link to the licence URL. `public/ATTRIBUTION.md` shows the full text and the three citations.

### 3.8 Validation rules

`scripts/validate-data.ts` runs the rules below after the zod parse. An `E` rule fails the run. A `W` rule prints and continues. Messages use the pattern `<code> <file>:<id>: <text>`.

1. E001 Schema parse. Message: `E001 <file>:<path>: <zod issue>`.
2. E002 Every `id`, `zfaParent`, `uiParent`, alias id, handoff id and system root exists in `anatomy_item.txt`. Message: `E002 <file>:<id>: not in anatomy_item.txt (ZFA release 2026-07-16)`.
3. E003 Every stage `zfs` exists in `stage_ontology.txt` and every period `zfs` exists as a term id in `zfa.obo` (the eight period terms `ZFS:0000045` to `ZFS:0000051` and `ZFS:0007000` are not in the stage table). Message: `E003 <file>:<id>: <zfs> not in stage_ontology.txt or zfa.obo`.
4. E004 `name` equals the ZFIN label. Message: `E004 structures:<id>: name "<name>" differs from ZFIN label "<label>"`.
5. E005 `zfinStartStage` and `zfinEndStage` equal the ZFIN columns. Message: `E005 structures:<id>: zfinStartStage <zfs> differs from ZFIN <zfs>` (same for the end stage).
6. E006 `startHpf` and `endHpf` equal the ZFS bounds of those stages. Message: `E006 structures:<id>: startHpf <n> differs from the ZFS bound <n>`.
7. E007 `visibleFromHpf` differs from `startHpf`, or `modelEndHpf` differs from `min(endHpf, 4320)`, only with a non-empty `overrideNote`. Message: `E007 structures:<id>: visibleFromHpf <n> differs from startHpf <n> without overrideNote`.
8. E008 A record whose `zfinStartStage` is `ZFS:0000000` sets `visibleFromHpf` above 0, except the root ZFA:0001094; a record whose `zfinEndStage` is `ZFS:0000000` (for example otic vesicle ZFA:0000051) sets `modelEndHpf` below 4320 with an `overrideNote`. Message: `E008 structures:<id>: start stage Unknown and visibleFromHpf is 0`; `E008 structures:<id>: end stage Unknown and modelEndHpf is 4320`.
9. E009 `visibleFromHpf < modelEndHpf` and `fadeInHpf + fadeOutHpf <= modelEndHpf - visibleFromHpf`. Message: `E009 structures:<id>: presence window [<a>, <b>] is empty or shorter than its fades`.
10. E010 Keyframes are strictly increasing in hpf. Message: `E010 structures:<id>: keyframe <i> at <n> hpf is not after keyframe <i-1>`.
11. E011 Every keyframe lies inside the presence window. Message: `E011 structures:<id>: keyframe at <n> hpf lies outside [<visibleFromHpf>, <modelEndHpf>]`.
12. W001 The first keyframe lies at `visibleFromHpf`, except for a record that a handoff seeds (BG-50), whose first stored keyframe may lie later. Message: `W001 structures:<id>: first keyframe at <n> hpf, visibleFromHpf is <m>`.
13. E012 Every body coordinate (`placement`, `path`, `base`, `centre`, `points`, `uStart`, `uEnd`) has `u` in `[0, 1]`, or in `[0, 1.25]` when `system` is `fins`. `v` and `w` lie in `[-1, 1]`, and `uStart <= uEnd`. Applies to the static parameters and to every keyframe. Message: `E012 structures:<id>: u <a> outside [0, <max>]`.
14. E013 One record per id across `structures.json`. Message: `E013 structures:<id>: appears <n> times`.
15. E014 Every `uiParent` is a record, and exactly one record (ZFA:0001094) has `uiParent: null`. Message: `E014 structures:<id>: uiParent <pid> is not a record`; `E014 structures: <n> root records, expected 1`.
16. E015 The `uiParent` chain has no cycle. Message: `E015 structures:<id>: uiParent cycle <id> -> ... -> <id>`.
17. E016 When `parentRelation` is `part_of`, `is_a` or `develops_from`, `anatomy_relationship.txt` has that row. The file's columns are parent id, child id, relation type, and the type strings are `is_a`, `part of`, `develops from` and `overlaps`; the validator maps `part_of` to `part of` and `develops_from` to `develops from` and looks up the row `(zfaParent, id, type)`. Message: `E016 structures:<id>: no <relation> row to <pid> in anatomy_relationship.txt`.
18. E017 No alias id in an `aliasChain` is also a record, and alias windows are contiguous. The first window may start before `visibleFromHpf` (DM-24). Message: `E017 structures:<id>: alias <aid> is also a record`.
19. E018 `system` is in `systems.json`; `alsoIn` does not contain `system`. Message: `E018 structures:<id>: system <s> is not in systems.json`.
20. E019 Every keyframe at or after 72 hpf carries `sizeRefSl`; no keyframe before 72 hpf carries it (DM-14, BG-43). Message: `E019 structures:<id>: keyframe at <n> hpf has no sizeRefSl`.
21. E020 Every `SizeRow` has a non-empty `source`. Message: `E020 structures:<id>: size row at <n> hpf has no source`.
22. E021 Every handoff `from`, `to` and `driver` id is a record, and the `driver` is a `from` id or shares the record (`withinRecord`). A window given in SL resolves through the growth table to hpf before the checks. Message: `E021 handoffs:<hid>: <id> is not a record`.
23. E022 `stages` has 43 rows sorted by `startHpf`, each `startHpf` equals the previous `endHpf`, the first is 0, and no row has `zfs` `ZFS:0000000`. Message: `E022 stages:<zfs>: startHpf <n> differs from the previous endHpf <m>`; `E022 stages:ZFS:0000000: the Unknown row is not a stage`.
24. E023 `timeAxis.segments` are contiguous from 0 to 4320 and the shares sum to 1 within 1e-6. Message: `E023 stages:timeAxis: shares sum to <x>, expected 1`.
25. E024 `headlineTicks` are 18, strictly increasing, inside the domain, and each `zfs` is a stage that starts at that hpf. Message: `E024 stages:timeAxis: tick "<label>" at <n> hpf does not start stage <zfs>`.
26. E025 `growth` is sorted by hpf and `lengthMm` and `standardLengthMm` are non-decreasing. Message: `E025 stages:growth: length falls at <n> hpf`.
27. E026 Every event with `canonical: true` matches the D8 value. Message: `E026 stages:<eid>: hpf <n> differs from the canonical <m>`.
28. E027 Every `systems.json` `paletteSlot` and `order` is unique and the file has 15 rows. Message: `E027 systems:<id>: paletteSlot <slot> is reused`.
29. E028 `structures.json` has no `colorOverride` on a record outside the exception list of this section. Message: `E028 structures:<id>: colorOverride is not in the exception list`.
30. W002 A group node has at least one child. Message: `W002 structures:<id>: group node has no children`.
31. W003 A record's `uiParent` is in another system, except when the `uiParent` is the root ZFA:0001094 or the `parentRelation` is `grouping`. Message: `W003 structures:<id>: uiParent <pid> is in system <s>`.
32. W004 Two consecutive keyframes span more than one time-axis segment. Message: `W004 structures:<id>: no keyframe between <a> and <b> hpf`.
33. W005 A size row lies outside the presence window. Message: `W005 structures:<id>: size row at <n> hpf lies outside [<a>, <b>]`.
34. E029 Building every keyframe at both tessellation levels gives finite positions and finite normals; every normal has unit length within 1e-3; for the convex kinds (`ellipsoid`, `superellipsoid`, `lathe` with a convex profile, `shell` outer surface) every normal points outward, that is `dot(normal, position - centre) > 0`. Message: `E029 structures:<id>: keyframe at <n> hpf builds a non-finite or inward normal at vertex <v>`.
35. E030 The static parameters plus the first keyframe cover every required parameter of the geometry kind. Message: `E030 structures:<id>: parameter <name> is missing at the first keyframe`.
36. E031 `body.json` matches the output of `scripts/gen-body.ts`; `hpf` ascends; every profile has the 9 stations; `axisLengthMm` and `bodyLengthMm` never fall after 10 hpf (BG-25). Message: `E031 body:<hpf>: <text>`.
37. W006 A structure with geometry whose presence window exceeds 24 h has at least two keyframes. Message: `W006 structures:<id>: one keyframe over <n> h`.
38. E032 A record whose `modelEndHpf` is 4320 because `endHpf` exceeds 4320 has `fadeOutHpf` 0, and a record whose `visibleFromHpf` is 0 has `fadeInHpf` 0 (DM-36). Message: `E032 structures:<id>: fade of <n> h at the clamped axis end`.
39. E033 Every handoff `driver` and every `derived` `sourceId` has non-null geometry whose keyframes cover the target's presence window; the source's mesh may have ended (`geometryEndHpf`). Message: `E033 structures:<id>: source <sid> has no geometry parameters at <n> hpf`.
40. E034 For every handoff, each `to` record's `visibleFromHpf` equals the window start, or equals its ZFA `startHpf` when that precedes the window (DM-33); each `from` record's `modelEndHpf` equals the window end; each of these records carries an `overrideNote` that names the handoff id; each `to` record's first stored keyframe lies inside `[visibleFromHpf, window end]`. Message: `E034 handoffs:<hid>: <id> visibleFromHpf <n> differs from the window start <m>`.
41. E035 Every array parameter (`outlineMm`, `profileMm`, `points`, `radiiMm`, a `segments` range list) has the same length in every keyframe of a record, and in the seeded first keyframe of a handoff target (BG-42). Message: `E035 structures:<id>: <name> has <n> elements at <a> hpf and <m> at <b> hpf`.
42. E036 For every tube sweep at every keyframe, `max(radius) x max(curvature) < 0.9` along the path, so the inner side of a bend does not self-intersect and its normals do not invert (BG-31). The heart loop at `bendDeg` 140 with an atrium radius of 0.055 mm is the first case this rule guards. Message: `E036 structures:<id>: keyframe at <n> hpf has r x kappa = <x>`.
43. W007 The bounding box of every built keyframe lies inside the body box of that time plus the record's `boundsMarginMm` (default 0), where the body box is the union of the spine tube (profile half-heights), the yolk and the chorion of `bodyModel(t)`. The fins system gets a 20 percent margin. Message: `W007 structures:<id>: keyframe at <n> hpf protrudes <x> mm beyond the body box`.
44. W008 A size row key is outside the merge allowlist of section 3.5.1. Message: `W008 structures:<id>: size key <key> is not in the allowlist`.
45. W009 A group node's `[visibleFromHpf, modelEndHpf]` does not contain a descendant's window (DM-30). Message: `W009 structures:<id>: child <cid> [<a>, <b>] lies outside [<c>, <d>]`.

- DM-28 The validator prints one line per finding in the pattern above, then a summary line `validate: <n> records, <e> errors, <w> warnings`, and exits with code 1 when `e > 0`. Section 6.3 lists the command flags.
- DM-29 The validator loads the ZFIN files from `docs/research/zfin/` at the pinned release: `anatomy_item.txt`, `anatomy_relationship.txt`, `anatomy_synonyms.txt`, `stage_ontology.txt` and `zfa.obo` (the period term ids, E003). A release change is a data change: it updates `stages.meta.zfaRelease`, the attribution text, and reruns the merge checks.

## 4. Body model and geometry

This section defines the body frame, the body model and the keyframe data in `body.json`. It also defines the primitive builders, the interpolation rules, the topology handoffs and the rebuild scheduler. Units are millimetres (mm) and hours post fertilization (hpf); days post fertilization (dpf) convert as hpf = 24 x dpf. Standard length (SL) is the distance from the snout to the posterior end of the notochord. The Zebrafish Anatomy Ontology (ZFA) and the Zebrafish Stage Ontology (ZFS) supply ids and stage windows. Decision D3 fixes the regimes, the body coordinates, and the primitive list. Decision D4 fixes the world axes. Decision D6 fixes the growth track. Research 05 owns every body-scale number below (D11). A value marked "estimate" is a reading of staging images or a derivation from a sourced ratio.

### 4.1 Body frame

#### 4.1.1 Spine

**BG-01.** `bodyModel(t)` builds the spine as a centripetal Catmull-Rom curve through the control points of the interpolated keyframe. `src/core/spine.ts` implements the curve with the parameterization of three's `CatmullRomCurve3` (type `centripetal`; three applies its `tension` parameter only to the `catmullrom` type, so no tension value exists here) and imports no three module (AR-04). The keyframe stores at least 9 control points as `[u, x, y]` with `z = 0`. The module samples the curve at 128 stations, `u_i = i / 127`, by arc length. Research 06 section 3 gives the reason for the centripetal type: it does not loop when control points are unevenly spaced.

**BG-02.** `u = 0` is the snout tip. `u = 1` is the posterior end of the notochord. The spine lies in the sagittal plane (`z = 0`) in version 1. The world origin is the spine point at `u = 0.4`. The spine tangent there is `+x` and the dorsal normal there is `+y`. D4 fixes `+x` posterior, `+y` dorsal and `+z` left. Section 4.2.6 states how the frame reaches this convention from the egg.

#### 4.1.2 Local frame by parallel transport

**BG-03.** The module computes a rotation-minimizing frame (tangent `T`, dorsal normal `N`, lateral binormal `B`) by parallel transport. It seeds the frame at the station nearest `u = 0.4` and transports it toward both ends. The algorithm:

```
k  = index of the station nearest u = 0.4
T[k] = normalize(P'(u_k))
N[k] = normalize(up - (up . T[k]) T[k])        with up = (0, 1, 0)
B[k] = N[k] x T[k]                              // points to the right side (-z at rest)
for i = k+1 .. 127 (forward) and i = k-1 .. 0 (backward), with j the previous index:
  T[i] = normalize(P'(u_i))
  c    = T[j] x T[i]
  if |c| < 1e-9:  N[i] = N[j]
  else:           N[i] = rotate(N[j], axis = c / |c|, angle = atan2(|c|, T[j] . T[i]))
  B[i] = N[i] x T[i]
```

The seed is safe at `u = 0.4` because the tangent there stays within 72 degrees of `+x` at every time (section 4.2.6). The seed is unsafe at `u = 0`, where the bent head of a 24 hpf embryo points down. Frenet frames (`computeFrenetFrames`) are not used; they flip where the curvature changes sign.

**BG-04.** The unit tests in D13 (QP-11) check three properties of the frame. Along the spine, `N[i] . N[i-1] > 0.99` at every station and every hour from 0 to 4320 hpf. Across time, `N(u, t) . N(u, t + 1 h) > 0.99` at every station and every hour, so a control-point edit cannot flip dorsal and ventral for one hour without failing the test. At the seed, `N(0.4, t) . up > 0.2` at every hour; the 10 hpf control points give `N(0.4) = (0.95, 0.32)`, the smallest value on the axis. The along-`u` test alone cannot catch a flip, because the planar spine has a signed in-plane normal that is coherent along `u` whatever its sign.

#### 4.1.3 Body coordinates to world position

**BG-05.** A structure position `{u, v, w}` maps to a world point by

```
X(u, v, w) = P(u) + v * h(u, v) * N(u) + w * hW(u) * B(u)
h(u, v)    = hD(u)  if v >= 0
           = hV(u)  if v <  0
```

`hD(u)` is the dorsal half-height, `hV(u)` the ventral half-height, `hW(u)` the half-width. `v = +1` is the dorsal skin and `v = -1` the ventral skin. `w = +1` is the right skin and `w = -1` the left skin (D3). The skin is the superellipse `|v|^n + |w|^n = 1` with `n = 2` unless the profile station carries another exponent. The keyframe stores the profile at 9 stations: `u = 0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0`. The module interpolates them across the 128 stations with a monotone cubic (Fritsch-Carlson). A half-height therefore never overshoots below zero.

**BG-06.** The data validator (D13, E012) rejects `|v| > 1` and `|w| > 1` (D3). A fin bud or the pericardium sits at the skin (`|v| = 1` or `|w| = 1`) and protrudes by its own radius. The body box of rule W007 is the union of the spine tube, the yolk and the chorion of `bodyModel(t)`, so the chorion, the yolk, the eyes and the fin buds lie inside it; a record that protrudes further states its `boundsMarginMm`.

#### 4.1.4 Size units

**BG-07.** A size field carries a unit. `mm` is the default. `bodyHeightFraction` resolves at every time step as

```
size_mm = fraction * (hD(u_c) + hV(u_c))
```

where `u_c` is the structure's anchor `u` at that time. The fraction applies to all three radii of a primitive unless the record gives the radii separately. From 72 hpf a keyframe carries `sizeRefSl` (D6): the runtime multiplies its sizes by `SL(t) / sizeRefSl` before interpolation (section 4.7, DM-14).

#### 4.1.5 Fins past `u = 1`

**BG-08.** For `1 < u <= 1.25` the module extends the spine along the tangent at `u = 1`:

```
P(u) = P(1) + (u - 1) * L * T(1),   frame = frame(1),   hD = hD(1), hV = hV(1), hW = hW(1)
```

`L` is the axis length. The caudal fin sheet uses `u` up to 1.20 (research 03e, caudal fin, "apFraction 0.95 to 1.2"). The notochord flexion (45 degrees at 6.5 mm SL, D8) is a parameter of the notochord structure and of the caudal fin sheet. The spine itself does not bend there. The spine stays smooth through `u = 1` and the caudal fin base lies on the extended tangent.

#### 4.1.6 The `BodyFrame` type

**BG-09.** `src/core/bodyModel.ts` exports:

```ts
export type Vec3 = [number, number, number]
export type Regime = 'R0' | 'R1' | 'R2' | 'R3' | 'R4'

export interface BodyStation {
  u: number; p: Vec3; t: Vec3; n: Vec3; b: Vec3
  hD: number; hV: number; hW: number; exponent: number
}

export interface BodyFrame {
  hpf: number
  regime: Regime
  stations: BodyStation[]                     // 128 entries, u = i / 127
  axisLengthMm: number                        // snout to notochord end
  bodyLengthMm: number                        // growth table value (D6)
  slMm: number | null                         // null before 72 hpf
  headTrunkAngleDeg: number | null            // null before 22 hpf
  notochordFlexionDeg: number
  ventU: number
  epibolyFraction: number
  somiteCount: number
  cellCount: number | null                    // null after 4.66 hpf
  cap: { baseRadiusMm: number; heightMm: number } | null
  shellThicknessMm: number | null
  yolk: {
    ball: { centre: Vec3; radiusMm: number; u: number; depthMm: number } | null
    extension: { u0: number; u1: number; r0Mm: number; r1Mm: number } | null
  } | null
  chorion: { centre: Vec3; radiusMm: number } | null
  frameAt(u: number): { p: Vec3; t: Vec3; n: Vec3; b: Vec3; hD: number; hV: number; hW: number }
  toWorld(u: number, v: number, w: number): Vec3
}

export type BodyModel = (hpf: number) => BodyFrame
export function createBodyModel(body: BodyFile, growth: GrowthPoint[]): BodyModel
```

**BG-10.** `createBodyModel(body, growth)` takes the parsed `body.json` and the growth table of `stages.json` and returns `bodyModel(hpf)`, a pure function of `hpf` and of those two inputs. The module imports no JSON itself, so the app (`src/data/index.ts`, AR-06) and `scripts/validate-data.ts` (which reads the files through `fs`) create the same model without a bundler. It touches no DOM and no three.js object. It caches the last frame by `hpf` rounded to 0.001 h. `bodyModel(t)` in the rest of this document is the function that `createBodyModel` returned.

### 4.2 The five regimes

D3 fixes five regimes. Each regime is a set of equations that the generator script `scripts/gen-body.ts` evaluates at the 32 keyframe times to produce `body.json` (section 4.3). The runtime interpolates `body.json`; it does not evaluate the regime equations. The generator is checked into `scripts/` so that a change to an equation regenerates the table.

#### 4.2.1 R0, blastodisc (0 to 4.66 hpf)

**BG-11.** The yolk is a sphere of radius `Ry` centred at the origin of the yolk-fixed frame, animal pole at `+y`. `Ry = 0.35 mm` at 0 hpf (zygote diameter 0.7 mm, research 05 section 2). The blastodisc is a half superellipsoid with semi-axes `(a, h, a)` and exponent 2 whose base plane sits at `y = sqrt(Ry^2 - a^2)`. The cell count `n(t)` follows the ZFS cleavage stages:

```
n(t) = 2^k,  k = 1 + floor((t - 0.75) / 0.25)     for 0.75 <= t < 3.0 hpf   (2-cell at 0.75, 1k-cell at 3.0)
n(t) = 1                                            for t < 0.75
```

The cap height follows the cell count while cleavage is synchronous, then flattens:

```
h(n) = 0.20 + 0.010 * log2(n)  mm      for t <= 3.0 hpf     (1-cell 0.20, 64-cell 0.26, 1k-cell 0.30)
h(t) falls linearly from 0.30 (3.33 hpf, high) to 0.15 (4.0 hpf, sphere) and 0.10 (4.33 hpf, dome)
```

Research 05 section 16.2 gives 0.20, 0.25, 0.30 and 0.15 mm at 1-cell, 64-cell, high and sphere. Research 03a (blastodisc record) gives a base diameter of 0.5 mm at 128-cell and 0.65 mm at sphere. All cap values are estimates. Research 05 section 2 found no measured cap height per cleavage stage.

| hpf | stage | cellCount | capBaseRadiusMm | capHeightMm | shellThicknessMm | epibolyFraction | yolkRadiusMm | presumptive axis arc (deg) |
|---|---|---|---|---|---|---|---|---|
| 0 | 1-cell | 1 | 0.30 | 0.20 | null | 0 | 0.35 | 59 |
| 0.75 | 2-cell | 2 | 0.29 | 0.21 | null | 0 | 0.35 | 56 |
| 2.25 | 128-cell | 128 | 0.26 | 0.27 | null | 0 | 0.35 | 48 |
| 3.33 | high | 2048 (estimate) | 0.25 | 0.30 | null | 0 | 0.35 | 46 |
| 4.0 | sphere | 4096 (estimate) | 0.30 | 0.15 | 0.12 | 0.15 | 0.35 | 59 |
| 4.33 | dome | 4096 (estimate) | 0.33 | 0.10 | 0.10 | 0.20 | 0.35 | 72 |
| 4.66 | 30%-epiboly | null | null | null | 0.06 | 0.30 | 0.345 | 66 |
| 5.25 | 50%-epiboly | null | null | null | 0.055 | 0.50 | 0.34 | 90 |
| 6 | shield | null | null | null | 0.05 | 0.50 | 0.33 | 90 |
| 8 | 75%-epiboly | null | null | null | 0.045 | 0.75 | 0.33 | 120 |
| 9 | 90%-epiboly | null | null | null | 0.04 | 0.90 | 0.325 | 143 |
| 10 | bud | null | null | null | 0.035 | 1.00 | 0.325 | 180 |

Sources: epiboly fractions from ZFS start times (research 05 section 3). Shell thickness and yolk radius from research 05 section 16.2 and section 2 (estimates). The dome-stage yolk bulge of 0.05 mm toward the animal pole (research 05 section 16.2) is the parameter `yolkDomeMm`. It is 0.05 at 4.33 hpf and 0 at 4.66 hpf.

**BG-12.** Every keyframe carries a spine, so that structures placed in body coordinates before 10 hpf resolve. Before 10 hpf the spine is the presumptive axis. It is an arc on the dorsal meridian (`+x` half of the sagittal plane) from the animal pole to the blastoderm margin. Its radius is `Ry + shellThickness / 2`. Its angular extent is `max(theta_m, theta_cap, 30 degrees)`. `theta_m = acos(1 - 2 f)` is the polar angle of the margin. `theta_cap = asin(a / Ry)` is the half-angle of the cap. The shield (6 hpf) therefore sits at `u = 1`. The tail bud at 10 hpf also sits at `u = 1`, on the vegetal pole, without a jump.

#### 4.2.2 R1, epiboly (4.66 to 10 hpf)

**BG-13.** The blastoderm is a spherical shell with inner radius `Ry` and thickness `shellThicknessMm`. It covers the sphere from the animal pole to the polar angle `theta_m = acos(1 - 2 f)`. `f` is the epiboly fraction, the fraction of the yolk cell surface that the blastoderm covers. `f = 0.5` puts the margin on the equator (germ ring and shield stages, research 05 section 3). Between the ZFS times the module interpolates `f` linearly. From 6 to 10 hpf this gives 12.5 percent per hour. Kimmel reports about 15 percent per hour (research 05 section 3). The germ ring thickening and the shield are structure records placed at `u = 1` on the shell. The shield spans 30 degrees of longitude and is 0.08 mm thick (research 05 section 16.2). The body model does not draw them.

#### 4.2.3 R2, wrapped axis (10 to 19 hpf, blending to 22 hpf)

**BG-14.** The axis is a tube of length `L(t)` whose spine follows a great-circle arc on the yolk sphere in the yolk-fixed frame. The arc starts at the animal pole (`u = 0`, the head) and runs down the dorsal meridian. A contact fraction `c(t)` of the axis lies on the sphere. The remainder is a free tail that leaves the sphere on the tangent and curls ventrally by `thetaTail`.

```
Rs      = Ry + hV_trunk - 0.03 mm                 spine radius; the ventral skin touches the yolk with 0.03 mm overlap
omega   = c * L / Rs                              contact wrap angle in radians
phi(u)  = u * L / Rs                              for u * L <= c * L   (on the sphere)
P(u)    = Rs * (sin phi, cos phi, 0)
free part: start at phi = omega with heading -omega, follow a circular arc of total turn thetaTail over length (1 - c) L
```

| hpf | stage | L (mm) | c | wrap angle (deg) | thetaTail (deg) | trunk hD / hV / hW (mm) | head hD / hV / hW (mm) | source |
|---|---|---|---|---|---|---|---|---|
| 10 | bud | 1.02 | 1.0 | 180 | 0 | 0.05 / 0.03 / 0.12 | 0.08 / 0.03 / 0.10 | wrap from research 05 section 15; L derived |
| 12 | 5-9 somites | 1.15 | 1.0 | 204 | 0 | 0.07 / 0.04 / 0.11 | 0.11 / 0.04 / 0.12 | wrap about 200 (research 05 section 15) |
| 14 | 10-13 somites | 1.26 | 1.0 | 225 | 0 | 0.08 / 0.05 / 0.11 | 0.14 / 0.06 / 0.14 | interpolated |
| 16 | 14-19 somites | 1.38 | 1.0 | 240 | 0 | 0.10 / 0.06 / 0.10 | 0.16 / 0.08 / 0.16 | wrap about 240 (research 05 section 15) |
| 18 | 14-19 somites | 1.66 | 0.7 | 199 | 20 | 0.11 / 0.07 / 0.10 | 0.17 / 0.09 / 0.17 | estimate |
| 19 | 20-25 somites | 1.80 | 0.5 | 152 | 40 | 0.12 / 0.07 / 0.10 | 0.18 / 0.10 / 0.18 | L from research 05 section 16.3; tail free at 19 hpf (research 05 section 15) |

Research 05 section 16.3 lists axis lengths of 1.0, 1.2, 1.5 and 1.8 mm at 10, 11.66, 16 and 19 hpf. Section 15 lists wrap angles of 180, 200 and 240 degrees at 10, 11.66 and 16 hpf. Both series are estimates and they do not agree. A 240 degree wrap on a 0.60 mm yolk ball, with the spine 0.03 mm above the skin, gives 1.38 mm. Research 05 gives 1.5 mm. The wrap angle is the visible feature in the staging images, so the generator keeps the wrap angle and derives `L`. The head radii come from research 05 section 16.3 (0.20 x 0.18 mm at 16 hpf, 0.25 x 0.22 mm at 22 hpf, estimates). The head's ventral half-height is smaller because the head lies flat on the yolk.

**BG-15.** From 14 hpf the yolk is a ball plus an extension in body coordinates (section 4.2.4 gives the equations). In R2 the ball centre is the yolk centre (`u = 0.4`, depth `Rs`). The extension starts at the ball's posterior pole and follows the spine. The extension appears at 16 hpf with length 0.42 x ball diameter (kidney-bean stage, research 05 sections 7 and 15). It reaches 0.60 x ball diameter at 19 hpf ("more than half", Kimmel via research 05 section 7).

**BG-58.** Somite count. The generator writes `somiteCount(t)` from the rates of research 05 section 4 (Kimmel 1995: about 3 per hour for the first 5 to 6 somites, then about 2 per hour):

```
somiteCount(t) = 0                                  for t < 10.33 hpf
               = min(6, 1 + 3 (t - 10.33))          for 10.33 <= t < 12 hpf
               = min(30, 6 + 2 (t - 12))            for 12 <= t < 26 hpf
               = 31                                 from 26 hpf (final count 30 to 34)
```

The count at each somite-stage start equals the lower bound in the ZFS stage name: 1 at 10.33 (1-4 somites), 5 at 11.66 (5-9 somites), 10 at 14 (10-13 somites), 14 at 16 (14-19 somites), 20 at 19 (20-25 somites), 26 at 22 (26+ somites), and 18 at 18 hpf ("18 somites are present at 18 h", Kimmel 1995) and about 30 at 24 hpf. QP-11 asserts these seven values. An earlier draft of section 4.3.2 lagged the stage names by one somite at every stage start.

#### 4.2.4 R3, straightening (19 to 72 hpf)

**BG-16.** From 22 hpf the spine is built in the body-fixed frame from four pieces:

```
trunk:  straight along +x from u_b = 0.32 to u = 0.7
tail:   from u = 0.7 to 1.0, a circular arc of total ventral turn thetaTail
head:   from u_a = 0.06 to u_b, a circular arc of total ventral turn beta = HTA - 20 degrees
snout:  from u = 0 to u_a, straight along the head's final direction
then translate so that P(0.4) = origin
```

The head-trunk angle (HTA) is the angle between the ear-eye line and the trunk notochord (Kimmel). A straight larva has an HTA near 20 degrees because the eye sits ventral to the ear. The spine bend is therefore `HTA - 20` (research 05 section 16.5). The series is 120, 95, 75, 55, 45, 35, 25 degrees at 24, 30, 36, 42, 48, 60, 72 hpf (research 05 section 15). The 60 hpf value of 35 comes from D8. The ZFIN page value of 55 is unused. The generator uses 125 degrees at 22 hpf (estimate) and 22, 20 degrees at 96 and 120 hpf (research 05 section 15, estimate). `thetaTail` is 45, 20, 8, 0 degrees at 22, 24, 30, 36 hpf (estimates from the 26+ somite and prim-5 images, research 05 section 15).

**BG-17.** The axis length `L` is 1.95, 2.05, 2.45, 2.65, 2.80, 2.90, 3.10, 3.25 mm at 22, 24, 30, 36, 42, 48, 60, 72 hpf. Research 05 section 16.4 sets 2.0 mm at 24 hpf (embryo length 1.9 mm, curled). It sets 3.1 mm at 48 hpf and 3.5 mm at 72 hpf. The generator subtracts the caudal fin fold beyond the notochord tip from the 48 and 72 hpf values. The fold is 0.2 and 0.25 mm (research 03e caudal fin record). `L` then equals SL at 72 hpf and grows monotonically into R4. The 48 hpf value 2.90 mm matches the SL that research 03c used for the 48 hpf heart.

**BG-18.** Yolk ball and extension. The sourced rules are ratios (Kimmel via research 05 section 7 and 15); the one free scalar is the ball radius `R(t)`:

```
R(t)      = 0.300, 0.290, 0.280, 0.275, 0.260, 0.240, 0.230, 0.220, 0.200, 0.175, 0.150, 0.125, 0  mm
            at   14,   19,    22,    24,    30,    36,    42,    48,    60,    72,    96,   120, 168 hpf   (research 05 section 7, estimates)
k(t)      = extension length / ball diameter
          = 0.42, 0.60, 0.90, 1.00, 1.10, 1.35, 1.50, 1.48, 1.30, 1.14, 1.17, 0
            at 16,   19,   22,   24,   30,   36,   42,   48,   60,   72,   96, 120 hpf   (Kimmel rules: equal at 24, 1.5 x at 42, cone by 48)
ball centre: u_c = smallest u >= 0.30 such that every head station u_h < u_b satisfies |P(u_h) - C| >= R + 0.6 hV(u_h)
             depth below the spine at u_c = hV(u_c) + R - 0.03
extension:   tube under the ventral skin from u_e0 = u_c + R / L over length k * 2R, centreline depth hV(u) + r(u) - 0.02
             radius r0 at the ball end, r1 at the vent end (table in section 4.3.4); r1 = 0.7 r0 to 42 hpf, then a cone
vent:        ventU = u_e1 to 48 hpf, then 0.60 (60 hpf) rising to 0.62 (120 hpf), 0.61 (336 hpf), 0.60 from 504 hpf
```

The clearance rule places the ball at `u = 0.36` at 24 hpf and `u = 0.30` from 36 hpf. Research 05 section 16.4 estimated 0.30 and 0.27. The 0.6 factor lets the yolk overlap the flattened ventral head, where the pericardium lies between head and yolk. At 48 hpf the extension is 1.48 x the ball diameter. This answers finding 2 of the fact-check report (research 03, "at 42 to 48 hpf extension about 1.5 x ball diameter").

**BG-19.** Chorion. To 19 hpf the chorion is a sphere of radius 0.60 mm centred on the yolk (research 05 section 16.2, estimate). Research 03a gives an inner diameter of 1.2 mm: a measured embryo radius of 397 um plus a 210 um perivitelline space. From 22 hpf the R3 posture is the dechorionated posture of the Kimmel figures (research 05 section 15: "trunk and tail almost straight" at 24 hpf, "body straight behind the head" at 48 hpf), which does not fit inside 1.2 mm. The generator then sets the chorion radius to the smallest sphere that encloses the spine plus 0.15 mm, centred on the spine's bounding box. The chorion fades from 48 to 72 hpf (D8). The review measured the enclosing radius of spine, profile and yolk with the BG-16 construction: 0.87 mm at 22 hpf, 0.94 at 24, 1.14 at 30 and 1.45 at 48 hpf. A tail curled 170 degrees behind a straight trunk still needs 0.73 mm at 22 hpf and 1.31 mm at 48 hpf, and a single planar curl of the whole body behind the head fits 0.57 mm only up to 30 hpf. A chorion of the real size therefore needs a spine that leaves the sagittal plane, which BG-02 excludes from version 1. The chorion record's `overrideNote` and its info card state that the model enlarges the chorion for this reason. Section 7.2 item 2 records the numbers and the alternative for the owner.

#### 4.2.5 R4, free-swimming (72 to 4320 hpf)

**BG-20.** The spine is straight with `L = SL` from the growth table (section 4.4). The head bend is `HTA - 20`, so 5 degrees at 72 hpf, 2 at 96 and 0 from 120 hpf. The profile comes from the four outline templates of research 05 section 16.4. The templates are day 5 at SL 3.6 mm, and SL 6.2, 10 and 28 mm. For a given SL the generator takes the two bracketing templates. It scales each by `(SL / SL_template)^0.9` for `hD` and `hV` and by `(SL / SL_template)^0.8` for `hW` (research 05 section 16.6). It interpolates the two linearly in SL. It then rescales `hD` and `hV` by one factor `g`. After that step the total height at `u = 0.6` equals the height at the anterior of the anal fin (HAA):

```
HAA(SL) = (SL - 4.4) / 3.56  mm        for 6 <= SL <= 18   (Parichy 2009 regression, R^2 0.98, research 05 section 8)
HAA(SL) = 3.82 * SL / 18     mm        for SL > 18         (isometric after maturity, estimate)
g       = HAA(SL) / H_template(0.6);   g = 1 for SL < 6
```

The regression is allometric: HAA grows 2.4 x while SL grows 1.8 x between 10 and 18 mm. A fixed power law cannot reproduce that, so the generator makes the regression the constraint. The generator deepens the posterior half of the SL 10 and SL 28 templates by 10 to 20 percent. HAA is then 0.85 to 0.90 of the maximum depth. The regression requires that ratio at 18 mm SL, where P09 measured 3.64 to 3.95 mm at maturity. The resulting adult proportions at SL 25 mm follow, each against the estimate of research 05 section 13. Maximum depth 6.3 mm (0.25 SL; estimate 0.23). Maximum width 3.2 mm (0.13 SL; estimate 0.13). Head to `u = 0.25` (0.25 SL; estimate 0.25). Total length 1.2 SL (estimate 1.2). Fineness ratio SL / depth: 6.5 at 6.5 mm SL, 4.6 at 12 mm, 3.9 at 18 and 25 mm.

**BG-21.** The yolk ball shrinks to radius 0.125 mm at 120 hpf and fades out by 168 hpf (D8, "yolk exhausted 168 hpf, inferred"). The extension is gone at 120 hpf (research 05 section 7). No yolk exists after 168 hpf. The notochord flexion parameter rises linearly from 0 at 4.5 mm SL to 45 degrees at 6.5 mm SL (research 05 section 8; D8). The growth table places these at 224 and 504 hpf.

#### 4.2.6 Frame convention and blending across regime boundaries

**BG-22.** The generator computes R0 to R2 in the yolk-fixed frame: yolk centre at the origin, animal pole `+y`, dorsal meridian `+x`. It computes R3 and R4 in the body-fixed frame: spine point `u = 0.4` at the origin, tangent `+x`, dorsal normal `+y`. It blends the two frames with one rigid motion whose angle and translation scale by `s = smoothstep((t - 10) / 12)`. `s` is 0 up to 10 hpf and 1 from 22 hpf. The stored control points are world coordinates after this motion. The tangent at `u = 0.4` therefore turns from 72 degrees below `+x` at 10 hpf to `+x` at 22 hpf. The rate is at most 10 degrees per hour. The yolk centre stays inside a 0.4 mm box around the origin from 10 to 120 hpf (generator check). The zygote at 0 hpf shows the blastodisc on top, as in the ZFIN figures.

**BG-23.** Regime boundaries are keyframe pairs; the runtime never evaluates two regimes at once. The parameters that change across each boundary and the window over which the keyframes carry them:

| Boundary | Window (hpf) | Parameters that crossfade | Parameters that appear or vanish |
|---|---|---|---|
| R0 to R1 | 4.0 to 4.66 | cap height 0.15 to shell thickness 0.06 (cap and shell both present, opacity by the structure records); epiboly 0.15 to 0.30; yolk radius | cap becomes null at 4.66; cellCount becomes null at 4.66 |
| R1 to R2 | 9 to 10.33 | epiboly 0.90 to 1.0; shell thickness 0.04 to 0.035; presumptive arc 143 to 180 degrees; trunk profile from shell thickness to 0.05 / 0.03 / 0.12 | shell becomes null at 12; somiteCount starts at 10.33 |
| R2 to R3 | 19 to 24 | spine control points (wrapped to spline); frame motion `s` 0.84 to 1.0 (complete at 22); ball centre from `u = 0.4` to `u = 0.36`; extension ratio 0.60 to 1.00; tail curl 40 to 20 degrees; chorion radius 0.60 to 1.00 | HTA starts at 22 (125 degrees); wrap angle ends at 19 |
| R3 to R4 | 60 to 72 | HTA 35 to 25; extension ratio 1.30 to 1.14; chorion opacity (D8 fade 48 to 72) | chorion null at 72; slMm starts at 72 |

The body model tests (D13) sample every hour. They assert that no station moves more than 0.7 mm per hour of model time and that no value is NaN. The largest measured step is the tail tip between 18 and 19 hpf: 0.554 mm in the control-point table, which is 0.055 mm per 0.1 h under the linear interpolation of BG-28 (QP-11 allows 0.07).

### 4.3 The `body.json` keyframe table

#### 4.3.1 Schema

**BG-24.** `src/data/body.json` holds 32 keyframes. Their times are the 32 values in the first column of the table in section 4.3.2. The zod schema, exported by `src/core/schema.ts` (section 3.2):

```ts
export const BodyKeyframe = z.object({
  hpf: z.number().min(0).max(4320),
  stage: z.string(),                                   // ZFS short label, informational
  regime: z.enum(['R0', 'R1', 'R2', 'R3', 'R4']),
  bodyLengthMm: z.number().positive(),                 // growth table value (D6)
  slMm: z.number().positive().nullable(),              // null before 72 hpf
  axisLengthMm: z.number().positive().nullable(),      // null before 10 hpf
  headTrunkAngleDeg: z.number().nullable(),
  notochordFlexionDeg: z.number().min(0).max(45),
  ventU: z.number().min(0).max(1),
  epibolyFraction: z.number().min(0).max(1),
  somiteCount: z.number().int().min(0).max(34),
  cellCount: z.number().int().nullable(),
  cap: z.object({ baseRadiusMm: z.number(), heightMm: z.number() }).nullable(),
  shellThicknessMm: z.number().nullable(),
  yolkRadiusMm: z.number().nullable(),                 // R0 to R2 sphere; equals ball radius from 14 hpf
  yolkDomeMm: z.number().default(0),
  yolkBall: z.object({ u: z.number(), depthMm: z.number(), radiusMm: z.number() }).nullable(),
  yolkExtension: z.object({ u0: z.number(), u1: z.number(), r0Mm: z.number(), r1Mm: z.number() }).nullable(),
  chorion: z.object({ centre: z.tuple([z.number(), z.number(), z.number()]), radiusMm: z.number() }).nullable(),
  spine: z.array(z.tuple([z.number(), z.number(), z.number()])).min(7),      // [u, x, y] in mm, u ascending, z = 0
  profile: z.array(z.object({
    u: z.number(), hD: z.number(), hV: z.number(), hW: z.number(), exponent: z.number().default(2),
  })).length(9),
  estimate: z.array(z.string()).default([]),           // names of fields that are estimates
  sources: z.array(z.string()),
})
export const BodyFile = z.object({ generatedBy: z.string(), keyframes: z.array(BodyKeyframe).min(24) })
```

**BG-25.** The validator (D13) checks five properties. `hpf` is strictly ascending. `spine[i].u` is strictly ascending from 0 to 1 in every keyframe. `axisLengthMm` and `bodyLengthMm` never decrease after 10 hpf. `profile` has the 9 fixed `u` stations. Every `hD`, `hV` and `hW` is positive. It re-runs `scripts/gen-body.ts` and fails if the regenerated file differs from the checked-in file.

#### 4.3.2 Scalar values per keyframe

The tables below are the generator output. Every value in the yolk, chorion and profile columns is an estimate unless section 4.2 or 4.4 names a source. Body length and SL carry their sources in section 4.4. HTA carries research 05 section 15 and D8. The somite column follows BG-58 (research 05 section 4).

| hpf | stage | bodyLengthMm | slMm | axisLengthMm | htaDeg | yolkBallDiaMm | yolkExtLenMm | chorionRadiusMm | epibolyFraction | somiteCount | flexionDeg |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1-cell | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 0.75 | 2-cell | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 2.25 | 128-cell | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 3.33 | high | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 4.33 | dome | 0.70 | null | null | null | 0.69 | null | 0.60 | 0.20 | 0 | 0 |
| 5.25 | 50%-epiboly | 0.70 | null | null | null | 0.68 | null | 0.60 | 0.50 | 0 | 0 |
| 6 | shield | 0.70 | null | null | null | 0.66 | null | 0.60 | 0.50 | 0 | 0 |
| 8 | 75%-epiboly | 0.70 | null | null | null | 0.66 | null | 0.60 | 0.75 | 0 | 0 |
| 9 | 90%-epiboly | 0.70 | null | null | null | 0.65 | null | 0.60 | 0.90 | 0 | 0 |
| 10 | bud | 0.70 | null | 1.02 | null | 0.65 | null | 0.60 | 1.00 | 0 | 0 |
| 12 | 5-9 somites | 0.80 | null | 1.15 | null | 0.62 | null | 0.60 | 1.00 | 6 | 0 |
| 14 | 10-13 somites | 0.85 | null | 1.26 | null | 0.60 | null | 0.60 | 1.00 | 10 | 0 |
| 16 | 14-19 somites | 0.90 | null | 1.38 | null | 0.60 | 0.25 | 0.60 | 1.00 | 14 | 0 |
| 18 | 14-19 somites | 1.20 | null | 1.66 | null | 0.59 | 0.29 | 0.60 | 1.00 | 18 | 0 |
| 19 | 20-25 somites | 1.40 | null | 1.80 | null | 0.58 | 0.35 | 0.60 | 1.00 | 20 | 0 |
| 22 | 26+ somites | 1.60 | null | 1.95 | 125 | 0.56 | 0.50 | 0.92 | 1.00 | 26 | 0 |
| 24 | prim-5 | 1.90 | null | 2.05 | 120 | 0.55 | 0.55 | 1.00 | 1.00 | 30 | 0 |
| 30 | prim-15 | 2.50 | null | 2.45 | 95 | 0.52 | 0.57 | 1.26 | 1.00 | 31 | 0 |
| 36 | prim-25 | 2.70 | null | 2.65 | 75 | 0.48 | 0.65 | 1.41 | 1.00 | 31 | 0 |
| 42 | high-pec | 2.90 | null | 2.80 | 55 | 0.46 | 0.69 | 1.52 | 1.00 | 31 | 0 |
| 48 | long-pec | 3.10 | null | 2.90 | 45 | 0.44 | 0.65 | 1.58 | 1.00 | 31 | 0 |
| 60 | pec-fin | 3.30 | null | 3.10 | 35 | 0.40 | 0.52 | 1.69 | 1.00 | 31 | 0 |
| 72 | protruding-mouth | 3.50 | 3.25 | 3.25 | 25 | 0.35 | 0.40 | null | 1.00 | 31 | 0 |
| 96 | day 4 | 3.70 | 3.40 | 3.40 | 22 | 0.30 | 0.35 | null | 1.00 | 31 | 0 |
| 120 | day 5 | 3.90 | 3.60 | 3.60 | 20 | 0.25 | 0.00 | null | 1.00 | 31 | 0 |
| 168 | day 7 | 4.50 | 4.10 | 4.10 | 20 | null | null | null | 1.00 | 31 | 0 |
| 336 | day 14 | 6.20 | 5.30 | 5.30 | 20 | null | null | null | 1.00 | 31 | 18 |
| 504 | day 21 | 7.80 | 6.50 | 6.50 | 20 | null | null | null | 1.00 | 31 | 45 |
| 720 | day 30 | 10.00 | 8.20 | 8.20 | 20 | null | null | null | 1.00 | 31 | 45 |
| 1080 | day 45 | 14.00 | 12.00 | 12.00 | 20 | null | null | null | 1.00 | 31 | 45 |
| 2160 | day 90 | 21.60 | 18.00 | 18.00 | 20 | null | null | null | 1.00 | 31 | 45 |
| 4320 | day 180 | 30.00 | 25.00 | 25.00 | 20 | null | null | null | 1.00 | 31 | 45 |

#### 4.3.3 Spine control points

Nine control points per keyframe as `x, y` in mm at `u = 0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0` (`z = 0`). World frame per BG-22. The runtime may use these nine points directly as the Catmull-Rom control points (BG-01).

| hpf | u=0 | 0.1 | 0.2 | 0.35 | 0.5 | 0.65 | 0.8 | 0.9 | 1.0 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.00, 0.45 | 0.05, 0.45 | 0.09, 0.44 | 0.16, 0.42 | 0.22, 0.39 | 0.28, 0.35 | 0.33, 0.31 | 0.36, 0.27 | 0.39, 0.23 |
| 0.75 | 0.00, 0.45 | 0.04, 0.45 | 0.09, 0.45 | 0.15, 0.43 | 0.21, 0.40 | 0.27, 0.37 | 0.32, 0.32 | 0.35, 0.29 | 0.38, 0.25 |
| 2.25 | 0.00, 0.48 | 0.04, 0.48 | 0.08, 0.48 | 0.14, 0.46 | 0.20, 0.44 | 0.25, 0.41 | 0.30, 0.38 | 0.33, 0.35 | 0.36, 0.32 |
| 3.33 | 0.00, 0.50 | 0.04, 0.50 | 0.08, 0.49 | 0.14, 0.48 | 0.19, 0.46 | 0.25, 0.43 | 0.30, 0.40 | 0.33, 0.38 | 0.36, 0.35 |
| 4.33 | 0.00, 0.40 | 0.05, 0.39 | 0.10, 0.38 | 0.17, 0.36 | 0.23, 0.32 | 0.29, 0.27 | 0.34, 0.21 | 0.36, 0.17 | 0.38, 0.12 |
| 5.25 | 0.00, 0.37 | 0.06, 0.36 | 0.11, 0.35 | 0.19, 0.31 | 0.26, 0.26 | 0.31, 0.19 | 0.35, 0.11 | 0.36, 0.06 | 0.37, 0.00 |
| 6 | 0.00, 0.36 | 0.06, 0.35 | 0.11, 0.34 | 0.19, 0.30 | 0.25, 0.25 | 0.30, 0.19 | 0.34, 0.11 | 0.35, 0.06 | 0.36, 0.00 |
| 8 | 0.00, 0.35 | 0.07, 0.34 | 0.14, 0.32 | 0.23, 0.26 | 0.30, 0.17 | 0.34, 0.07 | 0.35, -0.04 | 0.33, -0.11 | 0.30, -0.18 |
| 9 | 0.00, 0.35 | 0.09, 0.34 | 0.17, 0.30 | 0.27, 0.22 | 0.33, 0.11 | 0.35, -0.02 | 0.32, -0.14 | 0.27, -0.22 | 0.21, -0.28 |
| 10 | 0.00, 0.32 | 0.10, 0.31 | 0.19, 0.26 | 0.29, 0.15 | 0.32, 0.00 | 0.29, -0.15 | 0.19, -0.26 | 0.10, -0.31 | 0.00, -0.32 |
| 12 | -0.05, 0.28 | 0.06, 0.28 | 0.17, 0.23 | 0.28, 0.10 | 0.30, -0.07 | 0.24, -0.23 | 0.11, -0.33 | -0.00, -0.36 | -0.12, -0.34 |
| 14 | -0.18, 0.17 | -0.06, 0.19 | 0.06, 0.17 | 0.21, 0.05 | 0.26, -0.12 | 0.21, -0.30 | 0.07, -0.42 | -0.06, -0.45 | -0.18, -0.42 |
| 16 | -0.33, -0.02 | -0.21, 0.06 | -0.08, 0.09 | 0.11, 0.03 | 0.23, -0.14 | 0.23, -0.34 | 0.11, -0.50 | -0.01, -0.56 | -0.15, -0.56 |
| 18 | -0.42, -0.29 | -0.36, -0.14 | -0.24, -0.03 | 0.00, -0.00 | 0.20, -0.15 | 0.25, -0.39 | 0.15, -0.61 | 0.05, -0.75 | -0.05, -0.88 |
| 19 | -0.40, -0.42 | -0.39, -0.24 | -0.29, -0.10 | -0.04, -0.01 | 0.19, -0.13 | 0.35, -0.35 | 0.45, -0.60 | 0.49, -0.77 | 0.50, -0.95 |
| 22 | -0.39, -0.46 | -0.43, -0.27 | -0.36, -0.09 | -0.10, 0.00 | 0.19, 0.00 | 0.49, 0.00 | 0.78, -0.03 | 0.96, -0.10 | 1.11, -0.22 |
| 24 | -0.44, -0.48 | -0.47, -0.28 | -0.38, -0.09 | -0.10, 0.00 | 0.20, 0.00 | 0.51, 0.00 | 0.82, -0.01 | 1.02, -0.05 | 1.22, -0.11 |
| 30 | -0.70, -0.50 | -0.63, -0.27 | -0.47, -0.09 | -0.12, 0.00 | 0.24, 0.00 | 0.61, 0.00 | 0.98, -0.01 | 1.22, -0.02 | 1.47, -0.05 |
| 36 | -0.89, -0.44 | -0.73, -0.22 | -0.52, -0.07 | -0.13, 0.00 | 0.26, 0.00 | 0.66, 0.00 | 1.06, 0.00 | 1.33, 0.00 | 1.59, 0.00 |
| 42 | -1.05, -0.31 | -0.81, -0.16 | -0.56, -0.05 | -0.14, 0.00 | 0.28, 0.00 | 0.70, 0.00 | 1.12, 0.00 | 1.40, 0.00 | 1.68, 0.00 |
| 48 | -1.12, -0.24 | -0.86, -0.12 | -0.58, -0.03 | -0.15, 0.00 | 0.29, 0.00 | 0.72, 0.00 | 1.16, 0.00 | 1.45, 0.00 | 1.74, 0.00 |
| 60 | -1.22, -0.15 | -0.92, -0.08 | -0.62, -0.02 | -0.16, 0.00 | 0.31, 0.00 | 0.78, 0.00 | 1.24, 0.00 | 1.55, 0.00 | 1.86, 0.00 |
| 72 | -1.30, -0.05 | -0.97, -0.03 | -0.65, -0.01 | -0.16, 0.00 | 0.32, 0.00 | 0.81, 0.00 | 1.30, 0.00 | 1.63, 0.00 | 1.95, 0.00 |
| 96 | -1.36, -0.02 | -1.02, -0.01 | -0.68, -0.00 | -0.17, 0.00 | 0.34, 0.00 | 0.85, 0.00 | 1.36, 0.00 | 1.70, 0.00 | 2.04, 0.00 |
| 120 | -1.44, 0.00 | -1.08, 0.00 | -0.72, 0.00 | -0.18, 0.00 | 0.36, 0.00 | 0.90, 0.00 | 1.44, 0.00 | 1.80, 0.00 | 2.16, 0.00 |
| 168 | -1.64, 0.00 | -1.23, 0.00 | -0.82, 0.00 | -0.21, 0.00 | 0.41, 0.00 | 1.02, 0.00 | 1.64, 0.00 | 2.05, 0.00 | 2.46, 0.00 |
| 336 | -2.12, 0.00 | -1.59, 0.00 | -1.06, 0.00 | -0.27, 0.00 | 0.53, 0.00 | 1.33, 0.00 | 2.12, 0.00 | 2.65, 0.00 | 3.18, 0.00 |
| 504 | -2.60, 0.00 | -1.95, 0.00 | -1.30, 0.00 | -0.33, 0.00 | 0.65, 0.00 | 1.62, 0.00 | 2.60, 0.00 | 3.25, 0.00 | 3.90, 0.00 |
| 720 | -3.28, 0.00 | -2.46, 0.00 | -1.64, 0.00 | -0.41, 0.00 | 0.82, 0.00 | 2.05, 0.00 | 3.28, 0.00 | 4.10, 0.00 | 4.92, 0.00 |
| 1080 | -4.80, 0.00 | -3.60, 0.00 | -2.40, 0.00 | -0.60, 0.00 | 1.20, 0.00 | 3.00, 0.00 | 4.80, 0.00 | 6.00, 0.00 | 7.20, 0.00 |
| 2160 | -7.20, 0.00 | -5.40, 0.00 | -3.60, 0.00 | -0.90, 0.00 | 1.80, 0.00 | 4.50, 0.00 | 7.20, 0.00 | 9.00, 0.00 | 10.80, 0.00 |
| 4320 | -10.00, 0.00 | -7.50, 0.00 | -5.00, 0.00 | -1.25, 0.00 | 2.50, 0.00 | 6.25, 0.00 | 10.00, 0.00 | 12.50, 0.00 | 15.00, 0.00 |

#### 4.3.4 Profile values

`hD / hV / hW` in mm at the nine stations. Before 22 hpf the values are the R2 tube (BG-14). From 22 to 120 hpf they interpolate the research 05 section 16.4 outline tables; from 168 hpf they follow BG-20.

| hpf | u=0 | 0.1 | 0.2 | 0.35 | 0.5 | 0.65 | 0.8 | 0.9 | 1.0 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 0.75 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 2.25 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 3.33 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 4.33 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 5.25 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 6 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 8 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 9 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 10 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 12 | 0.03/0.03/0.03 | 0.11/0.04/0.12 | 0.08/0.04/0.12 | 0.07/0.04/0.11 | 0.07/0.04/0.11 | 0.07/0.04/0.11 | 0.07/0.04/0.11 | 0.06/0.03/0.10 | 0.05/0.05/0.05 |
| 14 | 0.03/0.03/0.03 | 0.14/0.06/0.14 | 0.10/0.05/0.12 | 0.08/0.05/0.11 | 0.08/0.05/0.11 | 0.08/0.05/0.11 | 0.08/0.05/0.11 | 0.07/0.04/0.09 | 0.05/0.05/0.05 |
| 16 | 0.03/0.03/0.03 | 0.16/0.08/0.16 | 0.12/0.07/0.12 | 0.10/0.06/0.10 | 0.10/0.06/0.10 | 0.10/0.06/0.10 | 0.10/0.06/0.10 | 0.09/0.05/0.09 | 0.05/0.05/0.05 |
| 18 | 0.03/0.03/0.03 | 0.17/0.09/0.17 | 0.14/0.08/0.13 | 0.11/0.07/0.10 | 0.11/0.07/0.10 | 0.11/0.07/0.10 | 0.11/0.07/0.10 | 0.10/0.06/0.09 | 0.05/0.05/0.05 |
| 19 | 0.03/0.03/0.03 | 0.18/0.10/0.18 | 0.14/0.08/0.13 | 0.12/0.07/0.10 | 0.12/0.07/0.10 | 0.12/0.07/0.10 | 0.12/0.07/0.10 | 0.10/0.06/0.09 | 0.05/0.05/0.05 |
| 22 | 0.05/0.05/0.05 | 0.18/0.16/0.18 | 0.20/0.15/0.17 | 0.13/0.10/0.09 | 0.11/0.08/0.07 | 0.10/0.07/0.05 | 0.08/0.06/0.04 | 0.06/0.05/0.03 | 0.02/0.02/0.01 |
| 24 | 0.05/0.05/0.05 | 0.18/0.16/0.18 | 0.20/0.15/0.17 | 0.13/0.10/0.09 | 0.11/0.08/0.07 | 0.10/0.07/0.05 | 0.08/0.06/0.04 | 0.06/0.05/0.03 | 0.02/0.02/0.01 |
| 30 | 0.05/0.05/0.05 | 0.19/0.17/0.19 | 0.21/0.16/0.18 | 0.14/0.10/0.09 | 0.12/0.09/0.07 | 0.10/0.08/0.06 | 0.08/0.07/0.04 | 0.06/0.05/0.03 | 0.02/0.02/0.01 |
| 36 | 0.06/0.06/0.06 | 0.20/0.18/0.20 | 0.22/0.16/0.18 | 0.14/0.11/0.10 | 0.12/0.09/0.08 | 0.10/0.08/0.06 | 0.08/0.07/0.04 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 42 | 0.06/0.06/0.06 | 0.21/0.19/0.21 | 0.23/0.17/0.19 | 0.15/0.11/0.10 | 0.12/0.10/0.08 | 0.11/0.09/0.06 | 0.09/0.07/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 48 | 0.06/0.06/0.06 | 0.22/0.20/0.22 | 0.24/0.18/0.20 | 0.15/0.12/0.10 | 0.13/0.10/0.08 | 0.11/0.10/0.07 | 0.09/0.08/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 60 | 0.07/0.07/0.07 | 0.23/0.21/0.23 | 0.25/0.19/0.21 | 0.16/0.12/0.11 | 0.14/0.11/0.08 | 0.12/0.10/0.07 | 0.10/0.08/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 72 | 0.08/0.08/0.07 | 0.24/0.22/0.24 | 0.26/0.20/0.21 | 0.16/0.14/0.11 | 0.14/0.11/0.09 | 0.12/0.10/0.07 | 0.10/0.08/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 96 | 0.09/0.09/0.08 | 0.25/0.23/0.25 | 0.27/0.21/0.21 | 0.17/0.15/0.12 | 0.15/0.12/0.10 | 0.13/0.10/0.07 | 0.11/0.08/0.05 | 0.08/0.06/0.03 | 0.02/0.02/0.01 |
| 120 | 0.10/0.10/0.08 | 0.26/0.24/0.26 | 0.28/0.22/0.22 | 0.18/0.15/0.12 | 0.16/0.13/0.10 | 0.14/0.10/0.07 | 0.11/0.08/0.05 | 0.08/0.06/0.03 | 0.02/0.02/0.01 |
| 168 | 0.11/0.11/0.09 | 0.30/0.27/0.29 | 0.32/0.26/0.25 | 0.22/0.19/0.15 | 0.19/0.16/0.12 | 0.16/0.12/0.09 | 0.13/0.09/0.06 | 0.09/0.07/0.04 | 0.02/0.02/0.01 |
| 336 | 0.13/0.13/0.11 | 0.38/0.34/0.35 | 0.42/0.35/0.32 | 0.32/0.29/0.22 | 0.27/0.23/0.17 | 0.22/0.16/0.13 | 0.17/0.12/0.08 | 0.12/0.09/0.05 | 0.04/0.04/0.02 |
| 504 | 0.16/0.16/0.13 | 0.48/0.43/0.42 | 0.54/0.46/0.40 | 0.44/0.42/0.30 | 0.38/0.33/0.24 | 0.31/0.22/0.17 | 0.22/0.16/0.11 | 0.17/0.12/0.07 | 0.05/0.05/0.02 |
| 720 | 0.22/0.22/0.16 | 0.69/0.63/0.53 | 0.80/0.69/0.52 | 0.72/0.68/0.42 | 0.66/0.56/0.35 | 0.56/0.42/0.25 | 0.38/0.28/0.16 | 0.27/0.22/0.10 | 0.08/0.08/0.03 |
| 1080 | 0.34/0.34/0.23 | 1.12/1.05/0.76 | 1.34/1.21/0.77 | 1.33/1.26/0.69 | 1.30/1.08/0.58 | 1.13/0.88/0.42 | 0.71/0.55/0.27 | 0.50/0.43/0.17 | 0.15/0.15/0.06 |
| 2160 | 0.53/0.53/0.33 | 1.86/1.73/1.08 | 2.27/2.07/1.14 | 2.35/2.24/1.06 | 2.32/1.95/0.89 | 2.00/1.60/0.64 | 1.24/0.98/0.41 | 0.87/0.77/0.28 | 0.27/0.27/0.11 |
| 4320 | 0.62/0.62/0.45 | 2.41/2.21/1.44 | 2.99/2.77/1.60 | 3.23/3.08/1.53 | 3.22/2.73/1.31 | 2.74/2.24/0.92 | 1.68/1.37/0.61 | 1.18/1.07/0.43 | 0.39/0.39/0.17 |

#### 4.3.5 Yolk placement in body coordinates

`ballU` and `ballDepthMm` place the ball centre below the spine; `extU0` to `extU1` is the extension range; `ventU` is the vent (BG-18). Before 22 hpf the extension follows the wrapped spine.

| hpf | ballU | ballDepthMm | ballRadiusMm | extU0 | extU1 | extR0Mm | extR1Mm | ventU |
|---|---|---|---|---|---|---|---|---|
| 14 | 0.40 | 0.32 | 0.300 | null | null | null | null | null |
| 16 | 0.40 | 0.33 | 0.300 | 0.62 | 0.80 | 0.110 | 0.080 | null |
| 18 | 0.40 | 0.33 | 0.295 | 0.58 | 0.76 | 0.110 | 0.078 | null |
| 19 | 0.40 | 0.33 | 0.290 | 0.56 | 0.75 | 0.110 | 0.077 | null |
| 22 | 0.37 | 0.34 | 0.280 | 0.51 | 0.77 | 0.110 | 0.073 | 0.77 |
| 24 | 0.36 | 0.34 | 0.275 | 0.49 | 0.76 | 0.100 | 0.071 | 0.76 |
| 30 | 0.31 | 0.35 | 0.260 | 0.42 | 0.65 | 0.090 | 0.064 | 0.65 |
| 36 | 0.30 | 0.33 | 0.240 | 0.39 | 0.64 | 0.080 | 0.057 | 0.64 |
| 42 | 0.30 | 0.33 | 0.230 | 0.38 | 0.63 | 0.070 | 0.050 | 0.63 |
| 48 | 0.30 | 0.33 | 0.220 | 0.38 | 0.60 | 0.070 | 0.020 | 0.60 |
| 60 | 0.30 | 0.32 | 0.200 | 0.36 | 0.53 | 0.050 | 0.015 | 0.60 |
| 72 | 0.30 | 0.30 | 0.175 | 0.35 | 0.48 | 0.040 | 0.010 | 0.61 |
| 96 | 0.30 | 0.29 | 0.150 | 0.34 | 0.45 | 0.025 | 0.010 | 0.61 |
| 120 | 0.30 | 0.27 | 0.125 | null | null | null | null | 0.62 |

### 4.4 The growth table (D6)

**BG-26.** `stages.json` holds one table `growth` with rows `{hpf, lengthMm, measure, standardLengthMm, source, estimate}` (schema `GrowthPoint`, section 3.2) at the 32 keyframe times. `lengthMm` is the egg diameter to 10 hpf. From 12 to 60 hpf it is the Kimmel embryo length (EL, the greatest linear dimension of the fixed embryo). Both carry `measure` EL. It is the ZFIN total length (TL) from 72 to 720 hpf. It is `1.2 x SL` from 1080 hpf with `measure` TL, because adult TL is SL plus a 6 mm caudal fin (research 05 section 13). `standardLengthMm` is null before 72 hpf. From 72 to 720 hpf `standardLengthMm` is TL minus the caudal extent beyond the notochord end. That extent is 0.25, 0.30, 0.30, 0.40, 0.9, 1.3, 1.8 mm at 72, 96, 120, 168, 336, 504, 720 hpf. Sources: research 03e caudal fin record and research 05 section 16.4 (estimates). From 1080 hpf it is the Singleman and Holtzman threshold (D6). The runtime interpolates the table linearly in hpf. Every SL-defined event and every `sizeRefSl` rescale reads SL from this one table. The table owns the placement of SL-defined events.

| hpf | stage | lengthMm | measure | standardLengthMm | source |
|---|---|---|---|---|---|
| 0 | 1-cell | 0.7 | EL | null | egg diameter, ZFIN zygote page (research 05 section 2) |
| 0.75 | 2-cell | 0.7 | EL | null | same |
| 2.25 | 128-cell | 0.7 | EL | null | same |
| 3.33 | high | 0.7 | EL | null | same |
| 4.33 | dome | 0.7 | EL | null | same |
| 5.25 | 50%-epiboly | 0.7 | EL | null | same |
| 6 | shield | 0.7 | EL | null | same |
| 8 | 75%-epiboly | 0.7 | EL | null | same |
| 9 | 90%-epiboly | 0.7 | EL | null | same |
| 10 | bud | 0.7 | EL | null | same |
| 12 | 5-9 somites | 0.8 | EL | null | Kimmel, "same as the zygote" (research 05 section 5.1) |
| 14 | 10-13 somites | 0.85 | EL | null | estimate between 0.8 and 0.9 |
| 16 | 14-19 somites | 0.9 | EL | null | Kimmel Table 1 (research 05 section 5.1) |
| 18 | 14-19 somites | 1.2 | EL | null | estimate between 0.9 and 1.4 |
| 19 | 20-25 somites | 1.4 | EL | null | Kimmel Table 1 |
| 22 | 26+ somites | 1.6 | EL | null | Kimmel Table 1 |
| 24 | prim-5 | 1.9 | EL | null | Kimmel Table 1 |
| 30 | prim-15 | 2.5 | EL | null | Kimmel Table 1 |
| 36 | prim-25 | 2.7 | EL | null | Kimmel Table 1 |
| 42 | high-pec | 2.9 | EL | null | Kimmel Table 1 |
| 48 | long-pec | 3.1 | EL | null | Kimmel Table 1 |
| 60 | pec-fin | 3.3 | EL | null | Kimmel Table 1 |
| 72 | protruding-mouth | 3.5 | TL | 3.25 | ZFIN index page (research 05 section 5.1); SL derived |
| 96 | day 4 | 3.7 | TL | 3.40 | ZFIN index page; SL derived |
| 120 | day 5 | 3.9 | TL | 3.60 | ZFIN index page; T25 mean 3.90 mm; SL derived (research 05 section 16.4 estimates 3.6) |
| 168 | day 7 | 4.5 | TL | 4.10 | ZFIN index page; SL derived |
| 336 | day 14 | 6.2 | TL | 5.30 | ZFIN index page; SL derived |
| 504 | day 21 | 7.8 | TL | 6.50 | ZFIN index page; SL derived; matches the L1 to L2 transition near 6.5 mm SL at 21 dpf (SH14 via research 02 section 3.2) |
| 720 | day 30 | 10.0 | TL | 8.20 | ZFIN index page; SL derived |
| 1080 | day 45 | 14.4 | TL | 12.0 | SH14 juvenile threshold (D6); TL = 1.2 x SL; ZFIN TL 14 mm |
| 2160 | day 90 | 21.6 | TL | 18.0 | SH14 adult threshold (D6); TL = 1.2 x SL |
| 4320 | day 180 | 30.0 | TL | 25.0 | SH14 180 dpf value (D6); TL = 1.2 x SL |

**BG-27.** The SL-defined events of D8 and D9 resolve through this table by linear interpolation:

| event | SL (mm) | hpf |
|---|---|---|
| notochord flexion starts | 4.5 | 224 |
| caudal fin rays | 4.9 | 280 |
| median fin fold handoff | 5.2 to 6.6 | 322 to 517 |
| metamorphic melanophores | 5.9 | 420 |
| notochord flexion complete | 6.5 | 504 |
| pelvic fin bud | 7.2 | 593 |
| squamation onset | 8.6 (D8; research 02 section 3.1 gives 9.6, section 7.3) | 758 |
| adult stripes complete | 9.6 | 853 |
| juvenile | 11.0 | 985 |
 Research 02 section 3.1 places the juvenile milestone at 28 to 45 dpf (672 to 1080 hpf); 985 hpf falls inside that window. The validator prints this list so that a change to the table is visible in review.

**BG-28.** Interpolation of `body.json`. The runtime interpolates every numeric field of `body.json` linearly in hpf between the bracketing keyframes; the smoothstep of D3 applies to structure keyframes (BG-41), not to the body. Spine control points and profile stations interpolate element-wise. A nullable field follows three rules. A field that is null at both bracketing keyframes is null. A field that starts (null at the earlier keyframe, a value at the later one: `slMm` at 72 hpf, `headTrunkAngleDeg` at 22 hpf, `yolkExtension` at 16 hpf) is null until the later keyframe. A field that ends (a value at the earlier keyframe, null at the later one: `cap` and `cellCount` at 4.66 hpf, `shellThicknessMm` at 12 hpf, `chorion` at 72 hpf, `yolkBall` at 168 hpf) holds the earlier value until the later keyframe, and the generator writes an explicit zero radius at the last keyframe of a shrinking field (`yolkBall.radiusMm` 0 at 168 hpf, `yolkExtension` radii 0 at 120 hpf), so no lerp meets a null. The chorion therefore holds its radius to 72 hpf while its record fades from 48 hpf (D8), and `slMm` is null before 72 hpf (BG-43).

### 4.5 Primitive catalogue

**BG-29.** Every primitive builder implements one interface in `src/core/primitives/`:

```ts
export type Lod = 'interactive' | 'final'

export interface PrimitiveBuilder<P> {
  readonly kind: string
  readonly localFrame: boolean                                   // true for the compact kinds of AR-72: positions relative to bounds.center
  build(params: P, frame: BodyFrame, lod: Lod): GeometryOut      // typed arrays: positions, normals, uvs, indices, bounds, placement (AR-04, AR-72)
  vertexCount(lod: Lod, params: P): number                       // exact, for the budget check and for AR-73
}

export interface Placement { u: number; v: number; w: number; yawDeg?: number; pitchDeg?: number; rollDeg?: number }
export type Size = number | { value: number; unit: 'mm' | 'bodyHeightFraction' }   // sizeRefSl sits on the keyframe (BG-43)
```

Every builder writes a `normal` attribute from a closed form and never calls `computeVertexNormals()` (D3). Every builder writes a `uv` attribute (`u` along the primitive's long axis, `v` around it) for stripes and gradients. Row and radial counts depend only on `kind` and `lod`, never on the parameters. A structure therefore keeps its vertex count across time (research 06 section 3). Vertex counts below are `(rows + 1) x (radial + 1)`; the seam column is duplicated for the uv wrap. This table and BG-30 are the single source for `tessellation.ts` and for the budget of section 2.9. A mirrored copy (`placement.mirror` or `segmentArray.mirror`) reverses the triangle winding of every triangle, because a reflection flips the handedness and three decides front faces per object from `matrixWorld.determinant()`, never per instance or per vertex range.

| kind | parameters | interactive rows x radial | final rows x radial | vertices interactive / final | analytic normal |
|---|---|---|---|---|---|
| ellipsoid | `placement`, `radiiMm: [Size, Size, Size]` | 12 x 16 | 24 x 32 | 221 / 825 | `normalize(x / a^2, y / b^2, z / c^2)` in the local frame, then rotated |
| superellipsoid | as ellipsoid plus `e1`, `e2` (north-south and east-west exponents, 0.3 to 2.0) | 12 x 16 | 24 x 32 | 221 / 825 | Barr form: `n = (c(eta, 2 - e1) c(omega, 2 - e2) / a, s(eta, 2 - e1) / b, c(eta, 2 - e1) s(omega, 2 - e2) / c)`, with `c(x, e) = sign(cos x) abs(cos x)^e`; the exponent `2 - e` is non-negative for `e <= 2`, so the pole rows stay finite (E029) |
| tube | `path`: `{type: 'spine', uStart, uEnd, v, w}` or `{type: 'spline', points: Placement[]}`; `radiusMm`: `Size`, `{r0Mm, r1Mm}` linear, or `'body'` (uses `hD`, `hV`, `hW`); `ellipticity`; `caps: 'none' | 'round' | 'flat'`; `taperFromU`, `flexionDeg`, `flexionFromU`, `segmented` for the notochord (section 4.10) | 24 x 8 | 48 x 12 | 225 / 637 plus 3 hemisphere rows per round cap | `normalize(alpha G - r' T)`, where `G` is the cross-section gradient normal `(cos theta / a, sin theta / b)` expressed in `(N, B)` (for `radiusMm: 'body'` `a` and `b` are the local half-height and half-width; for an ellipse the radial direction is not the normal, and at `hW = 0.5 hD` the error would reach 27 degrees), `alpha = 1 - (k1 x + k2 y)` with `k1`, `k2` the two curvature components of the parallel-transport frame from finite differences of `T` along `s`, and `r'` the radius derivative along `s`; the Frenet form `1 - r kappa cos theta` holds only in a plane |
| lathe | `placement`, `profileMm: [r, y][]` (6 to 10 points, 2D Catmull-Rom), `phiLengthDeg` (default 360), `axis` (local `y`) | 16 x 12 | 32 x 24 | 221 / 825 | `(cos phi dy, -dr, sin phi dy)` normalized, from the profile derivative `(dr, dy)` |
| segmentArray | `template` (any kind above), `uStart`, `uEnd`, `count` (interpolation type `count`), `mirror: boolean`, `perIndex: {scale, offsetV, chevronDeg}` | template counts | template counts | `count x template` | template normal, rotated by the instance matrix; two `InstancedMesh` objects per array (left and right, BG-32) with rotation-only matrices |
| sheet | `base`: `{uStart, uEnd, side: 'dorsal' | 'ventral' | 'lateral', w}`; `outlineMm: [chord, span][]` closed 2D spline; `thicknessBaseMm`, `thicknessEdgeMm` (floor 0.004); `rakeDeg` | 12 x 6, two faces plus rim | 24 x 8, two faces plus rim | 254 / 578 | face normal = normalized cross product of the ruled-surface partials, `+` for one face and `-` for the other; rim normal in the outline plane |
| shell | `centre`, `innerRadiusMm`, `thicknessMm`, `polarDeg` (coverage from the pole), `azimuthDeg` (default 360) | 12 x 24, two surfaces plus rim | 24 x 48, two surfaces plus rim | 700 / 2548 | radial `+r` outside, `-r` inside; rim normal along `-theta` |
| bodyDriven | `part: 'yolk' | 'chorion'` (DM-31) | yolk: lathe counts (BG-33); chorion: shell counts | as interactive, doubled | as lathe or shell | as lathe or shell |

**BG-30.** The `tube` builder with `radiusMm: 'body'` sweeps the body's own cross-section (`hD`, `hV`, `hW`, superellipse exponent). It builds the whole-organism skin, the trunk and the tail regions. Its rows are 64 (interactive) and 128 (final) and its radial count 24 and 32; 1625 and 4257 vertices. Research 06 section 4 measured 0.40 ms for a 64 x 24 sweep with face normals. Analytic normals remove the `computeVertexNormals` cost, which was 65 percent of that time.

**BG-31.** The tube radius never reaches zero. The builder clamps the radius to 0.004 mm. A `round` cap is three hemisphere rows (polar angles 30, 60 and 90 degrees) that end in one pole vertex with normal `+T` or `-T`; a single flat cap vertex would show a dark Gouraud ring where the side normals meet the pole (research 06 section 3, "do not taper to zero"). A `flat` cap is one vertex ring plus the pole with the pole normal on every vertex. The product of the largest radius and the largest curvature along a sweep stays below 0.9, so the inner side of a bend never crosses the axis and no normal inverts; rule E036 checks every keyframe.

**BG-32.** The `segmentArray` builder places instance `i` at `u_i = uStart + (i + 0.5) (uEnd - uStart) / count` and orients it by `frameAt(u_i)`. The viewer draws an array as two `InstancedMesh` objects, one for the left side and one for the right, each allocated at the maximum `ceil(count)` over the record's keyframes (an `InstancedMesh` cannot grow). Every instance matrix is a rotation plus a translation and a positive scale; a mirrored instance uses the mirrored template geometry of BG-29 (reversed winding, `w` negated) instead of a reflection matrix, because a reflection inside one `InstancedMesh` renders inside out under `FrontSide`. The visible instance count is `ceil(count)`; the last instance scales by `count - floor(count)` (section 4.7).

**BG-33.** A `lathe` with `phiLengthDeg = 360` and the yolk profile (bulge plus tail) builds the yolk ball and extension as one mesh. Research 06 section 3 gives the reason: a sphere-tube junction shows a crease under transparency. The yolk builder reads `frame.yolk` and needs no keyframes of its own.

### 4.6 Custom builders

Custom builders share the `PrimitiveBuilder` interface and live in `src/core/primitives/custom/`. Each returns one `GeometryOut` with the same attribute set as the primitives. A record selects one with `kind: 'custom'` and `builder` (section 3.2). Sizes are in mm at the `sizeRefSl` of the keyframe.

**BG-34.** `heartLoop`. Parameters:

```ts
interface HeartLoopParams {
  placement: Placement                           // venous pole anchor, u 0.16 to 0.27, v about -0.7
  stage: 'cone' | 'tube' | 'C' | 'S' | 'chambers' // step type; drives the info-card alias only
  coneBaseRadiusMm: Size; coneHeightMm: Size     // stage cone: a shallow cone on the midline, apex ventral
  tubeLengthMm: Size                              // straight length venous pole to arterial pole
  headingDeg: number                              // yaw of the tube from +x toward the left, 15 at 24 hpf
  bendDeg: number                                 // turn at the atrioventricular canal: 0 (straight), 90 (C), 130 to 140 (S)
  twistDeg: number                                // dextral twist of the ventricle limb, 0 to 30
  segments: {                                      // fractions of the centreline and radii per chamber
    sinusVenosus: { s0: number; s1: number; rMm: Size }
    atrium:       { s0: number; s1: number; rMm: Size; rAcrossMm: Size }
    avCanal:      { s0: number; s1: number; rMm: Size }
    ventricle:    { s0: number; s1: number; rMm: Size; rAcrossMm: Size; exponent: number }   // exponent 0.7 boxy larva, 1.0 round adult
    bulbus:       { s0: number; s1: number; rBaseMm: Size; rNeckMm: Size; tiltDeg: number }  // pear, tilt 30 to 35 anterior-dorsal
  }
  atriumOffset: { v: number; w: number }           // atrium left-dorsal at 48 hpf (w -0.3), posterior-dorsal from 120 hpf
}
```

The builder computes five centreline points: venous pole, atrium centre, AV canal, ventricle centre and outflow. It derives them from `tubeLengthMm`, `headingDeg`, `bendDeg`, `twistDeg` and `atriumOffset`. It fits a Catmull-Rom through them and sweeps a tube (24 x 12 interactive, 48 x 16 final). The radius per `s` is the piecewise-linear blend of the chamber radii. It exposes `segmentRange(part)` so that a chamber record (`kind: 'derived'`, `sourceId`, `part`) builds only its `s` range from the same parameters (D9). Looping starts at 30 hpf (D8); `bendDeg` stays 0 before that (fact-check finding 4, research 03).

**BG-35.** `gutLoop`. Parameters:

- `path`: points from the mouth record to the vent (`ventU`). The path starts where the mouth record sits: `u` 0.09, `v` -0.85 at 48 to 60 hpf (ventral, between the eyes) and `u` 0.02, `v` -0.5 from 72 hpf (terminal at the snout, the protruding-mouth stage), keyframed over 60 to 72 hpf. The pharynx segment spans `u` 0.05 to 0.22, so the ceratobranchial 5 teeth (`u` 0.20 to 0.24) sit on it. An earlier draft started the path at `u` 0.12, 0.43 mm behind the snout at 120 hpf and disconnected from the mouth.
- `radius` per segment (`esophagus`, `intestinalBulb`, `midIntestine`, `posteriorIntestine`), each with an `s` range.
- `bulbOffsetW`: the bulb sits to the left in the larva.
- `loops`: 0 in the larva, 1 from 504 hpf, 3 in the adult (research 03d intestine record).
- `attachments`: named faces on the tube surface at a given `s` and `thetaDeg`. The liver uses the left face at `s` 0.25 to 0.36. The pancreas uses the right-dorsal face at `s` 0.30 to 0.45. The gall bladder uses the right-ventral face.

An attachment returns a `Placement` on the gut surface at time `t`. The liver and pancreas records place their ellipsoids at that placement plus their own offset. The organs therefore follow the gut when it loops. Tessellation as the tube.

**BG-36.** `eyeCup`. Parameters:

- `placement`: `u` 0.10, `w` +-0.8.
- `outerDiameterMm`, `depthMm`, `stage: 'vesicle' | 'cup' | 'eye'`.
- `fissureDeg`: the choroid fissure width; it closes by 48 hpf.
- `lensDiameterMm`, `lensProtrusion` (0 to 0.4 of the lens radius beyond the cup rim).
- `rpeThicknessMm`, `retinaThicknessMm`.

The eye record ZFA:0000107 owns the builder from 11.66 hpf (DM-34); the `stage` steps from `vesicle` to `cup` inside the record and the info card alias follows. The builder returns three sub-ranges that the lens, retina and retinal pigment epithelium (RPE) records address by `part` (`kind: 'derived'`, `sourceId` the eye, section 3.2). The RPE is a thin outer lathe shell, the retina a thick inner shell, the lens a sphere. Sizes come from the research 03b eye and lens records. Cup 0.17 mm at 24 hpf; eye 0.23 at 48, 0.30 at 120 hpf, 2.5 mm adult. Lens 0.063 at 24, 0.10 at 120 hpf, 0.16 at 15 dpf, 0.9 mm adult. RPE opacity 0 at 22 hpf to 1 at 36 hpf is a material parameter set by the record. The eye's own mesh ends at 30 hpf and its keyframes continue to 4320 hpf for the three parts (E033).

**BG-37.** `earVesicle`. Parameters:

- `placement`: `u` 0.22 at 24 hpf, 0.21 at 48 hpf.
- `lengthMm`, `widthMm`, `heightMm`, `wallMm`.
- `otoliths: [{diameterMm, pole: 'anterior' | 'posterior'}]`.
- `pillarLength`: 0 to 1; the projections grow from 45 to 72 hpf.
- `canals: {loopDiameterMm, tubeDiameterMm, present: boolean}`: three orthogonal tori on the dorsal vestibule.

Sizes come from research 03b. The otic vesicle is 0.07 x 0.045 x 0.055 mm at 24 hpf and 0.13 x 0.09 x 0.11 mm at 48 hpf. The canal loop is 0.09 mm at 72 hpf. The adult ear is 2.3 mm long. The otoliths are white (D10).

**BG-38.** `somiteChevron`. The template of the somite and myotome arrays. Parameters:

- `lengthMm` along `u`; `widthMm`.
- `heightFraction`: body height fraction, 1.0 for myotomes.
- `chevronDeg`: 0 (cuboid) at formation, 40 for segments 8 to 15 by 26 hpf (research 03a somite record).
- `wFold`: 0 in the larva, 1 for the adult W-shape.
- `apexU`: the apex points anteriorly.

The builder returns a prism with the chevron cut on the anterior and posterior faces (8 x 8, 81 vertices, research 06 section 3). The array gives segment `i` a `chevronDeg` that ramps over 2 h, starting 4 h after the segment formed. Segments 1 and 2 stay straight.

**BG-39.** `finSheet`. A `sheet` with fin-specific parameters:

- `base` on the body: `uStart`, `uEnd`, side.
- `outline` as `[chord, span]` points; chord runs along the base, span outward.
- `rakeDeg`: the pectoral fin swings from lateral at 30 hpf to posterior at 60 hpf.
- `rays: {count, lengthFraction, thicknessMm}`: a `segmentArray` of tapered rods inside the sheet from the base to the margin. No rays exist before 4.9 mm SL.
- `forkDepthFraction`: caudal fin only, 0 to 0.05 SL from 6.4 mm SL.
- `lobes: 1 | 2`.

The median fin fold is one `finSheet`. Its dorsal base starts at `u` 0.46 at 24 hpf, 0.42 at 48 hpf and 0.40 from 72 hpf (somite 8; the drafts place the fold start at apFraction 0.40 in 03a and 0.42 in 03e, and somite 8 sits near `u` 0.47 at 24 hpf with somite 1 behind the otic placode at `u` 0.25 and the vent at somite 17). It runs over the tail tip and back to the vent (`ventU`) on the ventral side. An earlier draft started it at `u` 0.27, the pectoral fin bud level, which put a dorsal fold behind the ear in every lateral screenshot. Its height profile comes from the research 03a median fin fold record. The height ramps from 0.02 mm at 19 hpf (the tail is free, BG-14; `visibleFromHpf` 19, section 3.5.3) to a maximum of 0.06 mm at 24 hpf, 0.20 mm at 48 hpf and 0.25 mm at 120 hpf. The calibration pass of 2026-09-07 replaced those maxima. RN-04 and the owner's reference figures cap the fold at 0.20 to 0.35 of the local body height, which is 0.060 mm at 48 hpf and 0.067 mm at 120 hpf: at 0.20 mm the fold stood four times the height of the tail it borders. The record `ZFA:0000040` in `src/data/structures/fins.json` holds the outline that replaced these numbers and its `geometry.sources` states the conflict. BG-17 and BG-26 still subtract the old caudal fold lengths (0.20, 0.25, 0.30 and 0.40 mm at 48, 72, 120 and 168 hpf) from the axis length in `scripts/gen-body.ts`; the rim rule gives 0.08 to 0.10 mm instead. Reconciling that changes the body model, so it is left for the owner.

**BG-59.** Span direction field. A sheet whose base turns 180 degrees around the tail tip (radius about 0.02 mm) with span rays of 0.06 to 0.20 mm self-intersects when every ray follows the local normal: the dorsal and ventral rays cross within 0.02 mm of the base and the face normals point into the sheet, in the centre of the 24 and 48 hpf headline screenshots. The `finSheet` builder therefore draws its rows along a span direction field: `+N` along the dorsal base, `-N` along the ventral base, and over the BG-08 extension past `u = 1` a caudal fan that slerps from `+N` through `+T` to `-N`. The fold is one sheet whose rows follow the field, so no two rays cross. The caudal fin reuses the field after the `fin_fold_fins` handoff. QP-12 asserts that no triangle of the fold at 24 and 48 hpf has an inverted winding.

**BG-40.** `primordiumMover`. Parameters:

- `placement` at `u(t)` on the horizontal myoseptum (`v = 0`, `w = +-1`).
- `lengthMm 0.10`, `widthMm 0.04`, `heightMm 0.02`.
- `speedMmPerHour 0.1`, `startHpf 20`, `startU 0.30`.
- `deposits: {everySomites: 6, neuromastDiameterMm: 0.05}`.

The builder returns a flattened teardrop superellipsoid. The record's keyframes give `u` at 20, 24, 30, 36 and 42 hpf. Those match myotome 3, 5, 15, 25 and the tail tip (research 03b posterior lateral line primordium record). Deposited neuromasts are a separate `segmentArray` whose `count` steps up as the primordium passes each deposit point.

### 4.7 Interpolation rules

**BG-41.** For a structure at time `t`, the runtime finds the bracketing keyframes `a` and `b` with `a.hpf <= t <= b.hpf`. It computes `s = smoothstep((t - a.hpf) / (b.hpf - a.hpf))` with `smoothstep(x) = x^2 (3 - 2x)` on `[0, 1]` (D3). Before the first keyframe the first keyframe applies; after the last the last applies. A parameter missing from keyframe `b` inherits its value from the nearest earlier keyframe that has it, so a keyframe lists only what changes. Inheritance works per leaf to any depth: a keyframe that lists `segments.atrium.rMm` alone inherits every other leaf of `segments`, including `segments.atrium.s0`. An array is one leaf: a keyframe that lists `outlineMm` replaces the whole array, and every keyframe of a record gives the array the same length (E035).

**BG-42.** Each parameter has an interpolation type, fixed by the schema:

| type | rule | examples |
|---|---|---|
| number, length | `lerp(a, b, s)` after the `sizeRefSl` rescale of BG-43; names that end in `Mm` (DM-35) | `radiiMm`, `tubeLengthMm`, `rMm`, `thicknessBaseMm` |
| number, dimensionless | `lerp(a, b, s)` without rescale | `u`, `v`, `w`, `s0`, `s1`, `e1`, `e2`, `ellipticity`, `exponent`, names that end in `Fraction` |
| angle | `lerp` on the shortest signed difference in degrees, then wrap to `(-180, 180]`; names that end in `Deg` | `bendDeg`, `headingDeg`, `chevronDeg`, `rakeDeg` |
| count | `c = lerp(a, b, s)`; instances `floor(c)` at full scale; one more instance at scale `c - floor(c)`; names that start with `count` | `count` of a `segmentArray`, `countNeuromasts` |
| boolean | the earlier keyframe's value until `t` reaches `b.hpf` | `segmented`, `canals.present` |
| enum | as boolean | `stage` of the heart loop, `side` |
| vector | component-wise by the rule of its leaf name | `radiiMm`, `centre`, `atriumOffset` |
| array (fixed length) | element-wise by the rule of its leaf name; the array replaces whole and keeps its length across keyframes (E035) | `outlineMm` points, `profileMm` stations, `points` |

**BG-43.** `sizeRefSl` rescale (D6). When keyframe `a` carries `sizeRefSl`, the runtime replaces each of its `Mm` leaves by `size x slScale(t, a.sizeRefSl)` before the `lerp`, and likewise for `b`, with `slScale(t, ref) = SL(max(t, 72)) / ref`. `SL(t)` comes from the growth table by linear interpolation (BG-26) and is null before 72 hpf; the `max` keeps the null out of the division when a post-72 keyframe is bracketed with a pre-72 keyframe (the notochord at 60 hpf, DM-16, QP-13). A keyframe at or after 72 hpf must carry `sizeRefSl`; the validator rejects a post-embryonic keyframe without it.

**BG-44.** Presence and fade. A structure exists from `visibleFromHpf` to `modelEndHpf` (D3 defaults: the ZFIN start and end stages). It fades in over `fadeInHpf` and out over `fadeOutHpf`. The default for both is 5 percent of the duration of the structure's first ZFS stage (D3). The fade drives material opacity from 0 to 1 and scale about the structure's centroid from 0.7 to 1.0 (research 06 section 4). `material.transparent` is true only inside a fade window. A structure is present at `t` when its fade opacity is above 0; the rail counts, the tree filter and the info card badge use this definition (`presenceAt`, AR-74). Its first fully visible time is `visibleFromHpf + fadeInHpf`, the target of "Jump to first appearance" (UI-20). The default per period, from the ZFS stage lengths in `stages.json`:

| period | first-stage lengths (h) | default fade window (h) |
|---|---|---|
| zygote | 0.75 | 0.04 |
| cleavage | 0.25 | 0.0125 |
| blastula | 0.25 to 0.33 | 0.0125 to 0.017 |
| gastrula | 0.33 to 2.0 | 0.017 to 0.10 |
| segmentation | 1.33 to 3.0 | 0.067 to 0.15 |
| pharyngula | 6 | 0.30 |
| hatching | 12 | 0.60 |
| larval | 24 to 216 | 1.2 to 10.8 |
| juvenile | 360 to 1080 | 18 to 54 |
| adult | 2160 to 4320 on the axis | 108 at 2160 hpf for a structure that starts in the adult stage; 0 at the axis end for every structure that ZFA carries past 4320 (DM-36) |

A record may set `fadeInHpf` and `fadeOutHpf` explicitly. The chorion does (fade out 48 to 72 hpf, D8). The swim bladder posterior chamber does (fade in 96 to 120 hpf, D8).

**BG-45.** `segmentArray` count changes. New segments scale in from 0 (BG-42, type `count`). The scale-in is about the segment's own centroid at its station, so a somite grows in place at the tail bud. When a count falls (the fin fold rays do not; the yolk stripes do), the last instance scales out the same way.

**BG-46.** The 300 ms UI transition (D3; research 07 UX-IN-21). When `t` crosses `visibleFromHpf` or `modelEndHpf` during a scrub, a click-move or playback, the viewer runs a transition on top of the data fade. On appearance the structure scales from 0.6 to 1.0 about its centroid. Its opacity rises from 0 to 1 over the same 300 ms. The easing is `cubic-bezier(0.2, 0, 0, 1)`. On disappearance the reverse runs over 200 ms. When the timeline thumb moves faster than 3 stages per second the transition is skipped. With `prefers-reduced-motion: reduce` the transition is opacity only over 150 ms. The transition runs in the viewer and never changes the data fade in BG-44.

**BG-47.** Interpolation code lives in `src/core/interpolation.ts` and has no three.js import. It exports `bracket(keyframes, t)` and `interpolateParams(spec, keyframes, t, sl)`. `ParamSpec` maps each leaf to its type from BG-42 by the leaf's name through the suffix rule of DM-35 (`src/core/paramUnits.ts`); the zod schema alone cannot carry the type, because `Mm`, `U`, `Signed`, `e1` and `count` are all `z.number()`. The unit test of QP-16 walks every schema leaf and fails when a numeric leaf has no class, so a field cannot lack a type.

### 4.8 Topology handoffs (D9)

**BG-48.** `src/data/handoffs.json` holds one row per D9 handoff. The optic row of D9 is two rows here. The heart cone row stays one row and points inside the heart record (`withinRecord`). Schema (`src/core/schema.ts`):

```ts
export const HandoffRecord = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+$/),
  from: z.array(ZfaId).min(1),
  to: z.array(ZfaId).min(1),
  window: z.union([
    z.object({ startHpf: z.number(), endHpf: z.number() }),
    z.object({ startSl: z.number(), endSl: z.number() }),        // resolved through the growth table at load
  ]),
  perSegment: z.object({ delayHpf: z.number(), lengthHpf: z.number() }).optional(),
  driver: ZfaId,                                                 // the structure whose geometry seeds the targets
  seed: z.enum(['copyPlacement', 'subRange', 'outlineSegment', 'sexToggle']),
  withinRecord: z.boolean().default(false),                      // true when source and target share one record
  note: z.string(),
})
```

The viewer cross-fades the `from` structures out and the `to` structures in over the window, with the fade of BG-44 (opacity and scale). The window is written into the records by the merge (DM-33): each `from` record's `modelEndHpf` is the window end and each `to` record's `visibleFromHpf` is the window start, or its ZFA start when that comes first. The viewer applies no clamp of its own. The validator checks that every id resolves (E021), that the written windows match (E034), and that every driver has geometry parameters over the target's window (E033).

**BG-49.** The develops_from rule comes from research 01 section 7.4. At the window start, the `to` structure's first keyframe derives from the `driver`'s geometry at that time. The mesh then changes shape continuously. The `seed` field names the derivation:

| id | from | to | window | driver and seed | derived first keyframe |
|---|---|---|---|---|---|
| neural_plate_keel | neural plate ZFA:0000132 | neural keel ZFA:0000131 | 10 to 11 hpf | plate, `copyPlacement` | keel tube: `uStart`, `uEnd` from the plate sheet; `ry = 1.5 x plate thickness`, `rz = plate half-width / 2` |
| neural_keel_rod | neural keel | neural rod ZFA:0000133 | 11.7 to 13 hpf | keel, `copyPlacement` | rod tube: same `u` range; `r = sqrt(ry rz)` of the keel |
| neural_rod_tube | neural rod | neural tube ZFA:0001135 | 14 to 16 hpf | rod, `copyPlacement` | tube: same `u` range and radius; lumen radius 0.3 r |
| neural_tube_brain | neural tube ZFA:0001135 | telencephalon ZFA:0000079, diencephalon ZFA:0000101, midbrain ZFA:0000128, hindbrain ZFA:0000029, spinal cord ZFA:0000075 | 22 to 24 hpf | tube, `subRange` | the four brain regions keep their ZFA start of 14 hpf (DM-33) and are seeded at 14 hpf as sub-tubes of the neural tube over their `u` sub-ranges; from 14 hpf the neural tube mesh spans only the trunk behind the hindbrain, so no two meshes coincide; the regions swell into vesicles by 24 hpf; over the window the tube's trunk mesh hands off to the spinal cord, which keeps the tube radius from the hindbrain end to `u = 1`, and the neural tube record becomes a group node (`geometryEndHpf` 24); the forebrain ZFA:0000109 stays a group node, so its two geometry-bearing children stand in the `to` list (D9 names "brain regions") |
| heart_cone_tube | heart (stage cone) | heart (stage tube) | 22 to 24 hpf | heart ZFA:0000114, `withinRecord` | the heart loop's `stage` steps and `tubeLengthMm` grows from `coneHeightMm`; the info card alias changes (heart rudiment to heart tube) |
| heart_tube_chambers | heart loop mesh | atrium ZFA:0000471, ventricle ZFA:0000009, bulbus arteriosus ZFA:0000173, sinus venosus ZFA:0000154 | 42 to 48 hpf | heart, `subRange` | each chamber builds `segmentRange(part)` of the same loop parameters (BG-34); the heart record's own mesh fades out and the record becomes the group node |
| optic_vesicle_cup | eye ZFA:0000107 (alias optic vesicle) | eye (alias optic cup) | 16 to 24 hpf | eye, `withinRecord` | the `eyeCup` `stage` steps from `vesicle` to `cup`; cup `outerDiameterMm` = vesicle diameter, `depthMm` = 0.6 x diameter; the info card alias changes (DM-34) |
| optic_cup_parts | eye (alias optic cup) | retina ZFA:0000152, lens ZFA:0000035, retinal pigment epithelium ZFA:0000144 | 24 to 30 hpf | eye, `subRange` | parts by `part` of `eyeCup` (BG-36) from the eye's parameters; lens volume 10 percent of the cup volume at 24 hpf (research 03b); the eye's own mesh ends at 30 hpf |
| otic_vesicle_ear | otic vesicle ZFA:0000051 | inner ear ZFA:0000217 | 66 to 72 hpf | vesicle, `copyPlacement` | `earVesicle` with `canals.present` true, loop diameter from the pillar length at 66 hpf |
| somites_myotomes | somite ZFA:0000155 | myotome ZFA:0001056 | 14 to 24 hpf, per segment | somite array, `subRange` | segment `i` of the myotome array copies segment `i` of the somite array (length, height, `chevronDeg`); `perSegment: {delayHpf: 2, lengthHpf: 2}` from each segment's formation time (conflict item 1 at the end of this section covers the tail segments) |
| fin_fold_fins | median fin fold ZFA:0000040 | dorsal fin ZFA:0001173, anal fin ZFA:0001162, caudal fin ZFA:0001058 | 5.2 to 6.6 mm SL (322 to 517 hpf) | fold sheet, `outlineSegment` | each fin's first outline is the fold's outline over the fin's base `u` range (dorsal 0.58 to 0.72, anal 0.60 to 0.80, caudal 0.95 to 1.2; research 03e); the fold between the fins fades out |
| pronephros_mesonephros | pronephric glomerulus ZFA:0001557, pronephric tubule ZFA:0001558, pronephric duct ZFA:0000150 (the geometry-bearing parts of the pronephros group node) | mesonephros (kidney ZFA:0000529) | 12 to 14 dpf (288 to 336 hpf) | pronephric duct, `copyPlacement` | kidney lathe (the 03d strip) along the duct's `u` range under the dorsal aorta; radius from the duct pair; the kidney keeps its ZFA start of 120 hpf (DM-33), so the seed is evaluated at 120 hpf and the window fades the pronephros parts out |
| gonad_sex | immature gonad ZFA:0005272 | ovary ZFA:0000403 (`sexSpecific: 'female'`) or testis ZFA:0000598 (`sexSpecific: 'male'`) | 25 to 30 dpf (600 to 720 hpf) | immature gonad, `sexToggle` | the target that matches the `sex` state copies the immature gonad's placement and radii; the other is not drawn (DM-32) |
| larval_adult_stripes | larval melanophore stripes | adult stripes 1D, 1V | 5.9 to 9.6 mm SL (420 to 853 hpf) | lateral larval stripe, `copyPlacement` | adult stripe sheets take the lateral stripe's `u` range and `v`; metamorphic melanophores appear as a new array at 5.9 mm SL |

Ten develops-from pairs among the records have a source and a target that overlap in time and have no row in the D9 table. Without a row the two meshes overlap and then pop, which fails OV-20. `handoffs.json` therefore holds these `copyPlacement` rows as well; section 7.3 asks the owner to extend the D9 table. Every window lies inside the `from` record's ZFA window and starts at or after the `to` record's ZFA start, except where DM-20 already moves a start.

| id | from | to | window | source of the window |
|---|---|---|---|---|
| pectoral_bud_fin | pectoral fin bud ZFA:0000141 | pectoral fin ZFA:0000140 (ZFA start 30 hpf) | 48 to 60 hpf | the bud ends at 60 hpf in ZFA; the fin blade is distinct by long-pec |
| pelvic_bud_fin | pelvic fin bud | pelvic fin | 8.5 to 8.7 mm SL (748 to 767 hpf) | Parichy et al. 2009 pelvic fin ray stage (research 02 section 3.1) |
| liver_primordium_liver | liver primordium ZFA:0000124 | liver ZFA:0000123 | 28 to 30 hpf | ZFA: primordium 24 to 30, liver from 30 |
| pancreatic_buds_pancreas | dorsal and ventral pancreatic buds | pancreas ZFA:0000140 group and its exocrine and endocrine parts | 48 to 60 hpf | bud fusion at about 52 hpf (Field et al. 2003) |
| swim_bladder_bud_sac | swim bladder bud ZFA:0005335 | swim bladder ZFA:0000076 (collapsed sac, section 3.5.7 item 12) | 55 to 60 hpf | ZFA: bud ends 60, sac from 60 |
| thyroid_primordium_follicle | thyroid primordium ZFA:0001081 | thyroid follicle | 48 to 60 hpf | first follicle at about 55 hpf (Alt et al. 2006) |
| interrenal_primordium_gland | interrenal primordium | interrenal gland | 72 to 96 hpf | ZFA: primordium 19 to 96, gland from 72 |
| otic_placode_vesicle | otic placode ZFA:0000138 | otic vesicle ZFA:0000051 | 16 to 19 hpf | cavitation at 18 to 19 hpf (Haddon and Lewis 1996) |
| olfactory_placode_organ | olfactory placode ZFA:0000048 | peripheral olfactory organ | 28 to 30 hpf | ZFA: placode 14 to 30, organ from 30 |
| gonad_primordium_immature | gonad primordium ZFA:0001262 | immature gonad ZFA:0005272 | 312 to 336 hpf | ZFA: primordium to Days 7-13, immature gonad from Days 14-20 (DM-32) |

**BG-50.** The driver's geometry at the seed time is the exact source. The seed time is the target's `visibleFromHpf`, which is the window start unless the target's ZFA start precedes the window (DM-33). The runtime evaluates the driver's interpolated parameters at the seed time once. It converts them by the `seed` rule and writes the result as the target's first keyframe in memory. `structures.json` therefore stores the target's later keyframes only, plus the id of the handoff that seeds it. The validator runs the same conversion and reports the seeded values.

### 4.9 Rebuild scheduling

**BG-51.** Two tessellation levels exist (D3): `interactive` while `t` changes (scrub, playback, click-move, bookmark step) and `final` once `t` has been stable for 120 ms. The scheduler in `src/viewer/rebuild.ts` keeps one state per present structure: `idle`, `dirty`, `building`, `built(lod)`.

**BG-52.** On every change of `t`, the scheduler marks every present structure `dirty`, cancels the settle timer, and starts a new 120 ms timer. A structure that was already `dirty` keeps the frame number at which it became dirty (its age, AR-12). In the next `useFrame` callback it drains the queue at the interactive level until 8 ms of build time have elapsed in that frame (D3). Structures that the budget did not reach keep their previous geometry for that frame and stay `dirty` with their age. The next frame serves the jobs older than 4 frames first, so during playback every structure is rebuilt at least once per 5 frames; without the age rule a queue that is replaced every frame would never reach the small structures at its tail (otoliths, neuromasts, small vessels), which would stay at stale positions while the body moved. This is the time slicing of D3. A local-frame structure (AR-72) whose parameter hash is unchanged costs only a transform write and leaves the queue at once. When the settle timer fires, the scheduler marks every present structure `dirty` at the final level. It drains the queue with the same 8 ms budget per frame. `frameloop="demand"` stays on; the scheduler calls `invalidate()` while the queue is non-empty (research 06 section 8).

**BG-53.** Queue priority follows AR-13, highest first. Jobs older than 4 frames come first, oldest first. Then comes the skin (the whole-organism `tube` with `radiusMm: 'body'`, DM-31), because every other structure is read against it. Next come the selected structure with its ancestors and the hovered structure. Then come the remaining structures by descending bounding-box volume from their last build. Structures outside the camera frustum at the last frame come last. The priority is recomputed when the queue is refilled, not per frame.

**BG-54.** Cache. The scheduler keeps a `Map<structureId, {lod, paramHash, geometry}>` with at most two entries per structure (one per level). `paramHash` hashes the interpolated parameters quantized to 0.0001 mm, 0.1 degree and 0.001 for fractions. It includes the body-frame hash (`hpf` rounded to 0.001 h). A build whose hash matches the cached entry is skipped. During playback at 1x (60 s for the whole track, D7) most embryonic structures change every frame. In a paused state the final level is built once.

**BG-55.** Disposal. After the scheduler assigns a new geometry to the mesh, it disposes the replaced geometry (`geometry.dispose()`). Disposal runs at the end of the same frame, after the render call. It keeps the replaced geometry only when that geometry is the other level's cache entry. When a structure leaves its presence window, its two cache entries are disposed 500 ms after the fade and the UI transition (BG-46) end. Each structure owns one material cloned from its system base material (AR-27); the scheduler never disposes a material.

**BG-56.** Budget evidence. Research 06 section 4 measured 59.9 ms for 243,750 vertices with `computeVertexNormals` (38.7 ms of it in the normals), which is 174 ns per vertex for positions and analytic normals on one server core. The analytic-normal builders of BG-29 avoid the normals cost. The performance table of section 2 estimates 7 to 10 ms for a full interactive rebuild of 26,000 vertices in 150 jobs on that core, and 15 to 30 ms on a phone; the age rule of BG-52, the transform placement of AR-72 and the adaptive counts of AR-73 keep the per-frame slice at 8 ms and the lag under 5 frames. It estimates about three slices (18 to 24 ms) for a full final rebuild at about 105,000 final vertices. Both are estimates until the hardening phase measures them. The Playwright performance test (D13) scrubs 10 s and asserts a p95 frame time under 20 ms on the presenter's laptop. Morph-target baking (research 06 section 4, strategy 2) is the fallback if that test fails. It stays out of version 1 (D3).

### 4.10 Worked example: notochord and heart

**BG-57.** The two records below are the reference for record authors. They show the fields that drive geometry; the other `StructureRecord` fields of section 3.2 are omitted. Sizes before 72 hpf are mm; from 72 hpf every keyframe carries `sizeRefSl` (DM-14). Keyframes list only what changes (BG-41). ZFA ids and stage windows come from `anatomy_item.txt` (notochord ZFA:0000135, bud to adult; heart ZFA:0000114, high-pec to adult, with the alias chain of D9).

```json
{
  "id": "ZFA:0000135",
  "name": "notochord",
  "system": "axial",
  "visibleFromHpf": 10,
  "modelEndHpf": 4320,
  "fadeInHpf": 0.5,
  "geometry": {
    "kind": "tube",
    "path": { "type": "spine", "uStart": 0.15, "uEnd": 1.0, "v": 0, "w": 0 },
    "caps": "round",
    "keyframes": [
      { "hpf": 10,   "radiusMm": { "r0Mm": 0.0225, "r1Mm": 0.015 }, "taperFromU": 0.90, "flexionDeg": 0, "flexionFromU": 0.92, "segmented": false },
      { "hpf": 16,   "segmented": true },
      { "hpf": 24,   "path": { "type": "spine", "uStart": 0.12, "uEnd": 1.0, "v": 0, "w": 0 }, "radiusMm": { "r0Mm": 0.020, "r1Mm": 0.010 } },
      { "hpf": 48,   "radiusMm": { "r0Mm": 0.0275, "r1Mm": 0.010 } },
      { "hpf": 72,   "sizeRefSl": 3.25 },
      { "hpf": 120,  "sizeRefSl": 3.6,  "radiusMm": { "r0Mm": 0.0325, "r1Mm": 0.010 } },
      { "hpf": 168,  "sizeRefSl": 4.1,  "radiusMm": { "r0Mm": 0.034, "r1Mm": 0.010 }, "flexionDeg": 0 },
      { "hpf": 224,  "sizeRefSl": 4.5,  "flexionDeg": 0 },
      { "hpf": 336,  "sizeRefSl": 5.3,  "radiusMm": { "r0Mm": 0.040, "r1Mm": 0.012 }, "flexionDeg": 18 },
      { "hpf": 504,  "sizeRefSl": 6.5,  "radiusMm": { "r0Mm": 0.045, "r1Mm": 0.012 }, "flexionDeg": 45 },
      { "hpf": 720,  "sizeRefSl": 8.2,  "radiusMm": { "r0Mm": 0.050, "r1Mm": 0.014 } },
      { "hpf": 1080, "sizeRefSl": 12.0, "radiusMm": { "r0Mm": 0.070, "r1Mm": 0.018 } },
      { "hpf": 2160, "sizeRefSl": 18.0, "radiusMm": { "r0Mm": 0.100, "r1Mm": 0.025 } },
      { "hpf": 4320, "sizeRefSl": 25.0, "radiusMm": { "r0Mm": 0.130, "r1Mm": 0.030 } }
    ],
    "estimate": ["radiusMm", "taperFromU"],
    "sources": ["research 03a notochord record", "research 05 section 8", "D8 flexion 6.5 mm SL"]
  }
}
```

Diameters: 45 um at bud, 40 um at 24 hpf, 55 um at 48 hpf, 65 um at 120 hpf. Sources: research 03a and research 05 section 8 (estimates). `flexionDeg` bends the last 8 percent of the tube dorsally (research 03a). `segmented` is a boolean that steps at 16 hpf (stack-of-pennies appearance, research 03a) and drives a stripe in the material, not the geometry. Post-embryonic radii are estimates for the vertebral core; the vertebrae (skeletal) cover the notochord from 6 dpf. At 60 hpf the bracketing keyframes are 48 hpf (no `sizeRefSl`) and 72 hpf (`sizeRefSl` 3.25): the 72 hpf radii are multiplied by `slScale(60, 3.25) = SL(72) / 3.25 = 1`, so the two keyframes lerp in plain millimetres (BG-43, QP-13). The `radiusMm` object is one leaf group: a keyframe that lists it gives both `r0Mm` and `r1Mm`, and a keyframe that omits it inherits both (BG-41).

```json
{
  "id": "ZFA:0000114",
  "name": "heart",
  "system": "cardiovascular",
  "visibleFromHpf": 19,
  "modelEndHpf": 4320,
  "aliasChain": [
    { "zfaId": "ZFA:0000028", "name": "heart primordium", "fromHpf": 11.66, "toHpf": 19 },
    { "zfaId": "ZFA:0000115", "name": "heart rudiment", "fromHpf": 19, "toHpf": 22 },
    { "zfaId": "ZFA:0000149", "name": "primitive heart tube", "fromHpf": 22, "toHpf": 24 },
    { "zfaId": "ZFA:0000360", "name": "heart tube", "fromHpf": 24, "toHpf": 42 }
  ],
  "geometry": {
    "kind": "custom",
    "builder": "heartLoop",
    "geometryEndHpf": 48,
    "handoffOut": "heart_tube_chambers",
    "keyframes": [
      { "hpf": 19,  "placement": { "u": 0.21, "v": -0.7, "w": 0 }, "stage": "cone", "coneBaseRadiusMm": 0.06, "coneHeightMm": 0.03,
        "tubeLengthMm": 0.0, "headingDeg": 0, "bendDeg": 0, "twistDeg": 0,
        "segments": { "sinusVenosus": { "s0": 0.0, "s1": 0.1, "rMm": 0.025 }, "atrium": { "s0": 0.1, "s1": 0.45, "rMm": 0.025, "rAcrossMm": 0.025 },
                      "avCanal": { "s0": 0.45, "s1": 0.55, "rMm": 0.022 }, "ventricle": { "s0": 0.55, "s1": 0.9, "rMm": 0.025, "rAcrossMm": 0.025, "exponent": 0.7 },
                      "bulbus": { "s0": 0.9, "s1": 1.0, "rBaseMm": 0.02, "rNeckMm": 0.015, "tiltDeg": 0 } },
        "atriumOffset": { "v": 0, "w": 0 } },
      { "hpf": 22,  "stage": "tube", "tubeLengthMm": 0.18, "headingDeg": 15 },
      { "hpf": 24,  "tubeLengthMm": 0.20 },
      { "hpf": 30,  "tubeLengthMm": 0.25, "segments": { "atrium": { "rMm": 0.0275, "rAcrossMm": 0.0275 }, "ventricle": { "rMm": 0.0275, "rAcrossMm": 0.0275 } } },
      { "hpf": 36,  "stage": "C", "tubeLengthMm": 0.28, "bendDeg": 90, "segments": { "atrium": { "rMm": 0.040, "rAcrossMm": 0.040 }, "ventricle": { "rMm": 0.035, "rAcrossMm": 0.035 } } },
      { "hpf": 42,  "stage": "chambers", "bendDeg": 120, "twistDeg": 15,
        "segments": { "sinusVenosus": { "rMm": 0.022 }, "atrium": { "rMm": 0.050, "rAcrossMm": 0.040 }, "ventricle": { "rMm": 0.055, "rAcrossMm": 0.045 },
                      "bulbus": { "rBaseMm": 0.017, "rNeckMm": 0.012, "tiltDeg": 20 } }, "atriumOffset": { "v": 0.2, "w": -0.3 } },
      { "hpf": 48,  "stage": "S", "bendDeg": 140, "twistDeg": 30,
        "segments": { "sinusVenosus": { "rMm": 0.0225 }, "atrium": { "rMm": 0.055, "rAcrossMm": 0.045 }, "ventricle": { "rMm": 0.0625, "rAcrossMm": 0.0525 },
                      "bulbus": { "rBaseMm": 0.0175, "rNeckMm": 0.012, "tiltDeg": 30 } } },
      { "hpf": 72,  "sizeRefSl": 3.25 },
      { "hpf": 120, "sizeRefSl": 3.6, "placement": { "u": 0.21, "v": -0.7, "w": 0 }, "segments": { "sinusVenosus": { "rMm": 0.030 }, "atrium": { "rMm": 0.070, "rAcrossMm": 0.055 },
                      "ventricle": { "rMm": 0.075, "rAcrossMm": 0.0625, "exponent": 0.7 }, "bulbus": { "rBaseMm": 0.0275, "rNeckMm": 0.018, "tiltDeg": 30 } },
        "atriumOffset": { "v": 0.3, "w": -0.1 } },
      { "hpf": 168,  "sizeRefSl": 25.0, "segments": { "sinusVenosus": { "rMm": 0.20 }, "atrium": { "rMm": 0.50, "rAcrossMm": 0.45 },
                      "ventricle": { "rMm": 0.535, "rAcrossMm": 0.445, "exponent": 0.8 }, "bulbus": { "rBaseMm": 0.20, "rNeckMm": 0.12, "tiltDeg": 35 } } },
      { "hpf": 2160, "sizeRefSl": 25.0, "placement": { "u": 0.205, "v": -0.7, "w": 0 }, "segments": { "ventricle": { "exponent": 1.0 } } },
      { "hpf": 4320, "sizeRefSl": 25.0 }
    ],
    "estimate": ["tubeLengthMm", "headingDeg", "bendDeg", "twistDeg", "atriumOffset", "segments.sinusVenosus", "segments.bulbus at 48 hpf"],
    "sources": ["research 03c heart, heart tube, atrium, ventricle, bulbus, sinus venosus records", "D8 looping onset 30 hpf", "Singleman and Holtzman 2012 ventricle 4.28 percent of SL"]
  }
}
```

Radii are half the research 03c dimensions. At 24 to 30 hpf the tube is 50 um across. At 48 hpf: atrium 110 x 90 um, ventricle 125 x 105 um, bulbus 45 x 35 um, sinus venosus 40 x 45 um. At 120 hpf: atrium 140 x 110, ventricle 150 x 125, bulbus 85 x 55 um. At 25 mm SL: ventricle 1070 x 890, atrium 1000 x 900, bulbus 600 x 400 um. The 168 hpf keyframe already uses the 25 mm SL values with `sizeRefSl: 25`. At SL 4.1 mm that gives a ventricle radius of 0.088 mm, continuous with 0.075 mm at 120 hpf. The chamber records (atrium, ventricle, bulbus arteriosus, sinus venosus) carry `geometry: {kind: 'derived', sourceId: 'ZFA:0000114', part: 'atrium'}` and so on. Each has one keyframe at 42 hpf and no parameters of its own (BG-34, BG-49). The heart record's mesh ends at 48 hpf (`geometryEndHpf`) and the record continues as the selectable group node of the four heart parts. The zebrafish heart has two chambers, the atrium and the ventricle; the sinus venosus and the bulbus arteriosus are the inflow and outflow segments.

### 4.11 Visual calibration targets

**BG-60.** Research 10 (`docs/research/10-visual-reference-notes.md`) reads four of the owner's
reference illustrations and restates them as seven numeric and structural targets, RN-01 to
RN-07. No reference figure is copied into this repository; the source images stay in
`data/samples/`, read only, and the targets below are the numbers the model must meet, not the
images. Each target names its landing point in the data or in the rendering rules.

| Target | What it sets | Landing point |
|---|---|---|
| RN-01 somite size | Somite dorsoventral height 0.3 to 0.4 of local body height at 18 to 48 hpf, in a band lateral to the notochord and the neural tube that never reaches the skin | the axial system records (`src/data/structures/axial.json`) and the `wall` class of AR-32 |
| RN-02 myotome size | Post-embryonic myotomes fill the trunk between skin and spine but stay translucent, so the vertebral column reads through them | the muscular system's `wall` class default (AR-32) |
| RN-03 layering | Medial to lateral: notochord, then the neural tube dorsal to it, then somites and myotomes, then skin | the spine-outward render order of AR-30 (`lateralDepth` in `src/viewer/materials.ts`) |
| RN-04 default translucency | Skin about 0.15 to 0.25 with a rim; somites and myotomes about 0.45 to 0.6; brain and gut about 0.7; notochord, heart, vessels, eye and lens opaque; the default view already shows the notochord through the trunk | the nine-class table of AR-32: skin 0.24, wall 0.50, organ 0.70, core 1, at the default x-ray 60 |
| RN-05 chorion | A thin line or a faint shell; the embryo dominates the frame | the chorion's 0.10 role opacity ceiling (UX-VS-15, AR-32) |
| RN-06 vessel schematic | The dorsal aorta and the posterior cardinal vein as two parallel tubes under the notochord from 24 hpf; the common cardinal vein as a thin sheet over the yolk | the cardiovascular records (`src/data/structures/cardiovascular.json`); the `core` class keeps every vessel opaque at every x-ray value |
| RN-07 adult organs | Swim bladder with two chambers, kidney as a thin dorsal band, gut coiled, gonad ventral, gills under the opercle, with the body wall translucent so all of them read in lateral view | the respiratory, excretory, digestive and reproductive records at the `organ` class (0.70 default); the skin class (0.24 default) keeps the body wall translucent over them |

**BG-61.** The comparison procedure follows research 10's own instructions: screenshots at 18,
24, 30, 48, 72 and 120 hpf lateral against RN-01 to RN-06, and at 90 and 180 dpf against RN-07.
A human reviewer runs the comparison, because a target such as "the embryo dominates the frame"
is a judgment on a picture, not an assertion a unit test can make; the numeric parts of the table
above (the height fraction, the opacity anchors) do carry validator and unit-test coverage
through the rules of AR-32 and section 3.8.

## 5. Timeline bar and user interface

This section specifies the timeline bar, the panels, the viewer interactions, the visual tokens, the accessibility rules and the application states. Research 07 owns every user experience value here (D11): sizes, durations, easing curves, colour tokens and the palette. Requirement ids of the form `UX-<AREA>-<NN>` come from research 07 unchanged. New requirements carry ids of the form `UI-<NN>`. Where the decision record and research 07 differ, this section follows the decision record and names the difference.

Abbreviations: hpf is hours post fertilization at 28.5 C. dpf is days post fertilization. SL is standard length. ZFA is the Zebrafish Anatomy Ontology. ZFS is the Zebrafish Stage Ontology. WCAG is the Web Content Accessibility Guidelines. ARIA is Accessible Rich Internet Applications.

Terms: the "timeline bar" is the bottom bar. The "track" is the slider element inside the timeline bar. The "thumb" is the handle on the track. The "stage card" is the floating card above the thumb. The "systems rail" is the left panel. The "info card" is the right panel. The "time axis" is the mapping between hpf and track position (D7). `t` is the current time in hpf. A "period" is one of the 10 ZFS stage groups in `stages.json`.

### 5.1 Layout

#### 5.1.1 Breakpoints and regions

Sizes come from research 07 section 2.1.

| Name | Width | Systems rail | Info card | Timeline bar | Columns |
|---|---|---|---|---|---|
| Phone | under 640 px | Bottom sheet, opened by a Layers button | Bottom sheet with peek (96 px), half (50 dvh) and full (90 dvh) detents | 88 px, period bands only | One |
| Tablet | 640 to 1279 px | 56 px icon strip; expands to a 280 px overlay on tap | 360 px overlay sheet from the right | 96 px, headline and period ticks | Viewer keeps full width behind overlays |
| Desktop | 1280 px and up | 280 px docked; collapses to a 36 px handle | 340 px docked; shows the stage card of UX-LY-08 when nothing is selected; collapses only by hand, and the collapsed state persists with the width | 112 px, all ticks that pass the 8 px rule | Three, plus top and bottom bars |
| Presentation | any | hidden | 320 px floating card, top right, only while a selection exists | 64 px strip at the bottom or the top (setting); visible while playing, for 3 s after input, or pinned (UI-37) | Canvas only |

The viewer canvas fills the space that remains. On desktop no panel covers the fish at the default camera. On tablet and phone, an open sheet shifts the camera framing up by half the sheet height (`camera.setViewOffset`). The selected structure stays visible.

#### 5.1.2 Desktop wireframe (1440 x 900 reference)

```
+----------------------------------------------------------------------------------------------------+
| [fish] Zebrafish Atlas  [ Search structures, synonyms, ZFA ids   Ctrl K ]  [Lat][Dor][Ven][Ant][Pos][3/4]  [theme][export][share][present][settings][help] |  48 px
+----------------------+-------------------------------------------------------------+---------------+
| SYSTEMS      118/220 |                                                             | Heart         |
| [EE][Ax][Ne][Se][Ca] |                                                             | ZFA:0000114   |
| [Bl][Re][Di][Ex][En] |                                                             | Cardiovascular|
| [Rp][Sk][Mu][Fi][Sp] |                                                             | High-pec -> Adult (ZFIN) |
| [All][None][Embryo][Organs][Skeleton]                                              | ZFIN term now: heart tube |
| X-ray      [=====o-] |                    (3D viewer, canvas)                      |               |
| Section [Off|S|F|T]  |                                                             | Definition    |
| TREE  [x] present now|                                                             | The muscular  |
| v Cardiovascular 4/5 |                                                             | organ that... |
|   v heart            |                                                             |               |
|       atrium         |                                                             | Events        |
|       ventricle      |                                                             | 24 hpf beat   |
|   > dorsal aorta     |                                                             | 30 hpf looping|
| > Nervous      12/40 |                                                             |               |
| > Sensory       6/18 |                                                             | [Open in ZFIN]|
| > Digestive     3/22 |                                                             | [Isolate][Hide]|
| > Excretory     2/9  |                                                             | [Jump to 19.2 hpf]|
| > Axial         4/6  |                                                             | Sources (3)   |
| > Early embryo  3/12 |   24 hpf | Prim-5 | 1.9 mm          [scale bar] [gizmo] [fit] | ZFIN CC BY 4.0|
| > Fins          1/8  |                                                             |               |
| > Skin+pigment  2/9  |                                                             |               |
| ...                  |                                                             |               |
|                      |                                                             |               |
| 280 px               |                                                             | 340 px        |
+----------------------+-------------------------------------------------------------+---------------+
| Cleav Blastula Gastrula  Segmentation   Pharyngula    Hatching    Larval        Juvenile   Adult    |  28 px labels
| [|====|=======|=========|=============|=============|===========|==============|==========|=======] |  40 px track
|    . .  .   .    .   . .     . .  .        .  . .         .          .  .          .        .        |   8 px events
| 24 hpf | Prim-5 | 1.9 mm   [|<] [<] [play] [>] [>|]   1x [v]  [snap]  [hpf|dpf|auto]  [keys]      |  36 px transport
+----------------------------------------------------------------------------------------------------+   112 px total
```

At 900 px of viewport height the rail shows the 15 systems as a 3 by 5 grid of 44 px swatch cells in the D5 order (UI-43); the header, the grid, the presets, the x-ray and the section control use 312 px, and the tree gets the remaining 428 px, about 15 rows. The zygote band is 18.8 px wide at this width and carries no label (see period bands below).

#### 5.1.3 Tablet wireframe (1024 x 768)

```
+---------------------------------------------------------------------------+
| [fish] Zebrafish Atlas   [ Search...  ]     [Lat][Dor][3/4] [..] [present] |  48 px
+----+----------------------------------------------------------------------+
|[=] |                                                     +--------------+ |
|[o] |                                                     | Heart        | |
|[o] |                                                     | ZFA:0000114  | |
|[o] |                (3D viewer)                          | ...          | |
|[o] |                                                     | [Jump 19 hpf]| |
|[o] |                                                     +--------------+ |
|[o] |   24 hpf | Prim-5 | 1.9 mm                      360 px overlay sheet |
| 56 |                                                                      |
+----+----------------------------------------------------------------------+
| Bla Gastrula  Segmentation   Pharyngula   Hatching  Larval      Juv  Adult |  24 px labels
| [|==|=======|============|============|=========|===========|========|====] |  36 px track
| 24 hpf | Prim-5     [<] [play] [>]   1x   [snap]   [hpf|dpf]               |  32 px transport
+---------------------------------------------------------------------------+   96 px total
```

The 56 px strip holds the 15 system swatches as 44 px toggle buttons. The Layers button at its top expands the full rail as a 280 px overlay. The overflow button `[..]` holds the other three view presets, theme, export, share, settings and help.

#### 5.1.4 Phone wireframe (390 x 844 portrait)

```
+--------------------------------------+
| [fish] Zebrafish Atlas  [search][=]  |  44 px + safe area
+--------------------------------------+
|                                      |
|            (3D viewer)               |
|                                      |
|   24 hpf | Prim-5 | 1.9 mm  [Lateral]|  readout chip 32 px, view preset cycler shows the current preset name
+--------------------------------------+
| Heart  ZFA:0000114        [^] [x]    |  info card peek 96 px (drag up for half or full)
| High-pec -> Adult                    |
+--------------------------------------+
| ||Bla|Gas|Segm|Phar|Hatc|Larval|Juv|A|  band strip 32 px, no ticks
|                 ^                    |
| [|<]  [<]   [ play ]   [>]   [snap]  |  transport 44 px (88 px total) + safe area
+--------------------------------------+
```

The `[=]` button opens the Layers sheet (systems, x-ray, section, tree) from the bottom at the half detent; the sheet's bottom edge stops at the top of the timeline bar, so the bar stays visible and usable under an open sheet. Speed and units live in the Layers sheet and behind a long press on the play button. The band strip is one `role="slider"` element. The thumb is a 4 px line with a 44 px invisible hit area.

- **UI-44** The app root is `height: 100dvh; overflow: hidden` with `padding` from `env(safe-area-inset-*)`. A `100vh` root on iOS Safari hides the timeline bar under the browser toolbar and scrolls vertically. QP-36 asserts `scrollHeight <= innerHeight` as well as the width check.

#### 5.1.5 Presentation mode wireframe (1920 x 1080)

```
+--------------------------------------------------------------------------------------+
|                                                              +-------------------+   |
|                                                              | Heart             |   |
|                        (3D viewer, full bleed)               | ZFA:0000114       |   |
|                                                              | High-pec -> Adult |   |
|                                                              +-------------------+   |
|  24 hpf | Prim-5 | 1.9 mm   (readout chip: 48 px time, 40 px stage, 32 px length; UI-36)   |
|--------------------------------------------------------------------------------------|
| Cleav Blastula Gastrula Segmentation Pharyngula Hatching Larval    Juvenile  Adult    |  28 px label row, 20 px text
| [|====|=======|=========|============|============|=========|==============|=======|===] |  36 px track (64 px strip)
+--------------------------------------------------------------------------------------+
```

The info card appears only while a structure is selected; its definition text is collapsed by default behind a "Definition" row. The strip shows band fills, ticks, the thumb and the period labels. It shows no headline labels (UX-TL-09) and no transport buttons. It is visible while playback runs, for 3 s after the last input, and while pinned (UI-37). The cursor hides after 2 s of idle.

- **UI-36** Presentation type scale. One scale replaces the four sizes that earlier drafts gave the readout (20, 28, 32 px and a 1.25 factor). Base sizes at `--ui-scale` 1: readout time 48 px, stage name 40 px, length 32 px, period labels 20 px, info card name 40 px, info card body 24 px, 3D labels 20 px, toast text 24 px. Every presentation size is multiplied by `--ui-scale = clamp(1, min(100vw / 1920px, 100vh / 1080px), 2) x projectorScale`, where `projectorScale` is the "Projector scale" setting (1, 1.5 or 2; URL `ps=`), so a 3840 by 2160 output at 100 percent scaling keeps the same angular size as 1920 by 1080. Arithmetic behind the base sizes: on a 3 m wide 1080p image 1 px is 1.56 mm and a cap height of `distance / 250` is readable, so 48 px text reads to about 13 m and 20 px labels to about 5.6 m; M1 places the audience at 5 to 20 m, and the projector scale covers the far end.

#### 5.1.6 Layout rules

- **UX-LY-09** Panels use a solid surface colour in the dark theme. No blur, no translucency. The light theme may use `backdrop-filter: blur(16px)` at 92 percent surface opacity.
- **UX-LY-10** The systems rail and the info card resize by drag between 240 and 400 px. The sizes persist in `localStorage`.
- **UX-LY-11** Collapsing the rail or the info card animates the width over 200 ms with `cubic-bezier(0.2, 0, 0, 1)`. The canvas resizes on each frame so the fish does not jump.
- **UI-01** First load shows the lateral preset (D4). When the URL carries no `t`, the viewer opens at 24 hpf (Prim-5). Research 07 UX-LY-12 named the three-quarter preset; D4 names lateral as the default, and D4 wins.
- **UI-02** Presentation mode starts with `P` or the Present button. It hides every panel and bar. The timeline strip follows UI-37. Presentation mode sets snap on (UX-TL-20), labels off (UX-VS-21) and "Jump to appearance on select" on (UX-IN-25). `Escape` exits. Text follows the presentation type scale of UI-36; the 1.25 factor of research 07 section 4.5 is superseded (section 7.3).
- **UI-37** Strip visibility. The strip is visible while `playing` is true and for 3 s after playback stops; for 3 s after a pointer movement or a key press; for 3 s after entry through `present=1`; and at all times while `stripPinned` is true. `Shift+P` toggles the pin and the URL carries it as `pin=1`. The readout chip never hides. The "Strip position" setting (bottom, default, or top) moves the strip to the top edge for rooms where the bottom of the projection is hidden by heads. During a 60 s playback the audience therefore sees the thumb move through the periods; an earlier draft hid the strip after 3 s of idle even while playback ran.

### 5.2 Timeline bar

#### 5.2.1 Track geometry

Values come from research 07 section 3.1. The track width `W` equals the bar width minus twice the padding. At 1440 px wide `W` is 1392 px on desktop.

| Element | Desktop | Tablet | Phone | Presentation |
|---|---|---|---|---|
| Bar height | 112 px | 96 px | 88 px | 64 px |
| Horizontal padding | 24 px | 16 px | 16 px | 32 px |
| Period label row | 28 px, 12 px text | 24 px, 11 px text | none; labels inside bands, 10 px, abbreviated | 28 px, 20 px text (UI-36) |
| Track row | 40 px; band fill 24 px, centred | 36 px; fill 22 px | 32 px; fill 32 px | 36 px; fill 28 px |
| Tick row | inside the track row, under the fill: 6 px stage ticks, 10 px period ticks | 6 px headline and period ticks | none | inside the track row, as desktop |
| Event marker row | 8 px, under the track row | none | none | none |
| Transport row | 36 px | 32 px | 44 px | none |
| Thumb and hit area | 2 px line across the track row plus a 16 px handle on the fill; 44 x 44 px hit area | same | 4 px line, no circle; 44 x 56 px | 3 px line plus a 20 px handle; 56 x 56 px |
| Stage card above thumb | 220 x 60 px, 8 px above the fill, arrow 8 px | 200 x 56 px | readout chip instead | none; the readout chip of UI-36 carries the stage |

`W` at the reference widths: 1392 px (desktop 1440), 992 px (tablet 1024), 358 px (phone 390), 1856 px (presentation 1920).

#### 5.2.2 The time axis mapping

`stages.json` owns the time axis (D7). The track maps hpf to a fraction of `W` with a piecewise-linear function through eight anchors. The anchors are the D7 segment boundaries with cumulative shares.

| Anchor | hpf | dpf | Cumulative fraction | Segment (D7) | Share | Width at 1392 px | Resolution at 1392 px |
|---|---|---|---|---|---|---|---|
| A0 | 0 | 0 | 0.00 | | | | |
| A1 | 10 | | 0.18 | zygote to bud | 18 percent | 250.6 px | 25.1 px per hpf |
| A2 | 24 | 1 | 0.30 | segmentation | 12 percent | 167.0 px | 11.9 px per hpf |
| A3 | 72 | 3 | 0.52 | pharyngula and hatching | 22 percent | 306.2 px | 6.4 px per hpf |
| A4 | 168 | 7 | 0.62 | early larva | 10 percent | 139.2 px | 34.8 px per dpf |
| A5 | 720 | 30 | 0.78 | larva | 16 percent | 222.7 px | 9.7 px per dpf |
| A6 | 2160 | 90 | 0.92 | juvenile | 14 percent | 194.9 px | 3.2 px per dpf |
| A7 | 4320 | 180 | 1.00 | adult | 8 percent | 111.4 px | 1.2 px per dpf |

- **UX-TL-01** Between anchors the mapping is linear in hpf. The inverse reads the same table by fraction. The data validator checks that the fractions are monotonic and that the shares sum to 100 percent (D13).
- **UI-03** The pure module `src/core/timeAxis.ts` exports the two functions below. The viewer, the URL state and the export file name use them; no other code maps time to position.

```ts
// src/core/timeAxis.ts
export interface AxisAnchor { hpf: number; fraction: number }

/** Derived at load from stages.json timeAxis.segments: the D7 segment shares as cumulative fractions. */
export const AXIS_ANCHORS: readonly AxisAnchor[] = [
  { hpf: 0, fraction: 0.00 },
  { hpf: 10, fraction: 0.18 },
  { hpf: 24, fraction: 0.30 },
  { hpf: 72, fraction: 0.52 },
  { hpf: 168, fraction: 0.62 },
  { hpf: 720, fraction: 0.78 },
  { hpf: 2160, fraction: 0.92 },
  { hpf: 4320, fraction: 1.00 },
];

/** Maps hpf to a track fraction in [0, 1]. Linear in hpf inside each segment. Clamps outside the domain. */
export function hpfToTrack(hpf: number, anchors: readonly AxisAnchor[] = AXIS_ANCHORS): number {
  const last = anchors[anchors.length - 1];
  const h = Math.min(Math.max(hpf, anchors[0].hpf), last.hpf);
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (h <= b.hpf) return a.fraction + ((b.fraction - a.fraction) * (h - a.hpf)) / (b.hpf - a.hpf);
  }
  return 1;
}

/** Inverse of hpfToTrack. Reads the same table by fraction. */
export function trackToHpf(fraction: number, anchors: readonly AxisAnchor[] = AXIS_ANCHORS): number {
  const x = Math.min(Math.max(fraction, 0), 1);
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (x <= b.fraction) return a.hpf + ((b.hpf - a.hpf) * (x - a.fraction)) / (b.fraction - a.fraction);
  }
  return anchors[anchors.length - 1].hpf;
}
```

Worked values: `hpfToTrack(24)` is 0.30, `hpfToTrack(42)` is 0.3825, `hpfToTrack(120)` is 0.57, `trackToHpf(0.75)` is 616.5 hpf.

#### 5.2.3 Period bands

The 10 periods, their ZFS ids and their hpf ranges come from `stages.json`. The ramp colours come from research 07 section 4.4. The widths below use the D7 mapping.

| Period | ZFS id | hpf | Hex | L* | Width at 1392 px | at 992 px | at 358 px | at 1856 px |
|---|---|---|---|---|---|---|---|---|
| Zygote | none | 0 to 0.75 | `#485693` | 38 | 18.8 | 13.4 | 4.8 | 25.1 |
| Cleavage | ZFS:0000046 | 0.75 to 2.25 | `#046BA4` | 43 | 37.6 | 26.8 | 9.7 | 50.1 |
| Blastula | ZFS:0000045 | 2.25 to 5.25 | `#007C9E` | 48 | 75.2 | 53.6 | 19.3 | 100.2 |
| Gastrula | ZFS:0000047 | 5.25 to 10.33 | `#008C9B` | 53 | 123.0 | 87.6 | 31.6 | 163.9 |
| Segmentation | ZFS:0000049 | 10.33 to 24 | `#0B9C93` | 58 | 163.1 | 116.2 | 41.9 | 217.5 |
| Pharyngula | ZFS:0000050 | 24 to 48 | `#4FA983` | 63 | 153.1 | 109.1 | 39.4 | 204.2 |
| Hatching | ZFS:0007000 | 48 to 72 | `#82B275` | 68 | 153.1 | 109.1 | 39.4 | 204.2 |
| Larval | ZFS:0000048 | 72 to 720 | `#B1B971` | 73 | 361.9 | 257.9 | 93.1 | 482.6 |
| Juvenile | ZFS:0000051 | 720 to 2160 | `#DEBD7A` | 78 | 194.9 | 138.9 | 50.1 | 259.8 |
| Adult | ZFS:0000044 | 2160 to 4320 | `#FEC29A` | 83 | 111.4 | 79.4 | 28.6 | 148.5 |

- **UX-TL-03** Each period is a filled band on the track in its ramp colour. The fill opacity is 55 percent in the dark theme and 35 percent in the light theme. The band under the thumb renders at 100 percent.
- **UX-TL-04** Bands are separated by a 1 px gap in `--bg`. Every band has a 2 px top border in its full ramp colour.
- **UX-TL-05** Period labels sit in the label row, left-aligned to the band start with a 6 px inset. They use 12 px text at weight 500 in `--text`. A label that would overflow its band is abbreviated: Zyg, Clv, Bla, Gas, Seg, Pha, Hat, Lar, Juv, Adu. The tooltip of an abbreviated label shows the full name. The adult band label reads "Adult (90 dpf+)"; the track ends at 180 dpf (D1) while the ZFS adult stage continues in the data.
- **UI-04** A band narrower than 28 px carries no label. The zygote band is under 28 px at every reference width and never carries a label; its name appears in the hover tooltip, the stage card and the readout. On phone the labels sit inside the bands at 10 px. A label inside a band uses `--text` on a band whose fill (at 55 percent over `--bg`) has L* below 60 and `--bg` on a lighter band: the Larval, Juvenile and Adult fills measure 2.9:1, 2.5:1 and 2.2:1 against `--text`, below the 4.5:1 of OV-02, and `--bg` on them measures above 7:1.
- **UX-TL-06** Hovering a band raises its fill to 80 percent over 100 ms and shows the period tooltip: period name, hpf range, stage count, one landmark sentence. Clicking a band moves the thumb to the band start.

#### 5.2.4 Stage ticks

- **UX-TL-07** Every stage start gets a tick: 1 px wide, 6 px tall, in `--text-muted`, under the fill. Period starts get a 10 px tick at 2 px width. The axis end at 4320 hpf gets a 10 px tick.
- **UI-05** Tick candidates are the 43 stage starts and the axis end, 44 in all. Candidates are ranked: headline ticks first, then period starts, then other stage starts. The renderer walks the ranked list and draws a candidate only when it lies at least 8 px from every tick already drawn (D7). A tick that fails the test is skipped; its stage remains a snap target and a hover target.
- **UI-06** Tablet draws only headline and period candidates. Phone draws no ticks (UX-TL-08).
- **UX-TL-10** Every drawn tick has a 12 px wide invisible hit area for hover only. Clicks go to the track.

Measured result of UI-05 with the D7 mapping:

| Track width | Ticks drawn | Ticks skipped by the 8 px rule |
|---|---|---|
| 1392 px (desktop) | 38 of 44 | 4-cell, 16-cell, 64-cell, 128-cell, 512-cell, 1-4 somites |
| 1856 px (presentation) | 43 of 44 | 1-4 somites |
| 992 px (tablet, UI-06) | 25 of 44 | 1-4 somites and every non-headline, non-period stage |
| 358 px (phone) | 0 | all |

The 1-4 somites tick (10.33 hpf) sits 4.1 px after the bud headline tick at desktop width and yields to it; the segmentation band border still marks the period start (UX-TL-04). Cleavage stages are 0.25 hpf apart, or 6.3 px at desktop width, so every second cleavage tick draws.

#### 5.2.5 Headline labels

The 18 headline ticks come from D7. On desktop and tablet each carries a label under its tick: 10 px, weight 500, `--text-muted`, `font-variant-numeric: tabular-nums`, centred on the tick. The first label is left-aligned and the last is right-aligned. The presentation strip draws the ticks without labels: a 10 px label reads to about 2.8 m and the period labels of UI-36 carry the orientation instead.

| Headline tick (D7) | hpf | Label text | Position at 1392 px |
|---|---|---|---|
| 1-cell | 0 | 1-cell | 0.0 |
| 256-cell | 2.5 | 256-cell | 62.6 |
| sphere | 4 | Sphere | 100.2 |
| shield | 6 | Shield | 150.3 |
| bud | 10 | Bud | 250.6 |
| 14-somite | 16 | 14 som | 322.1 |
| prim-5 | 24 | Prim-5 | 417.6 |
| high-pec | 42 | High-pec | 532.4 |
| long-pec | 48 | Long-pec | 570.7 |
| protruding-mouth | 72 | Prot-mouth | 723.8 |
| 5 dpf | 120 | 5 dpf | 793.4 |
| 7 dpf | 168 | 7 dpf | 863.0 |
| 14 dpf | 336 | 14 dpf | 930.8 |
| 21 dpf | 504 | 21 dpf | 998.6 |
| 30 dpf | 720 | 30 dpf | 1085.8 |
| 45 dpf | 1080 | 45 dpf | 1134.5 |
| 90 dpf | 2160 | 90 dpf | 1280.6 |
| 180 dpf | 4320 | 180 dpf | 1392.0 |

- **UX-TL-09** When two label boxes would overlap, the renderer hides the label of the shorter stage. The implementation measures real label boxes. An estimate at 5.5 px per character hides "256-cell" (Sphere wins) and "High-pec" (Long-pec wins) at 1392 px. The tooltip and the stage card always carry the full stage name. Headline stages in `stages.json` carry `headline: true`; the renderer takes the label text from `timeAxis.headlineTicks[].label` (section 3.2).

#### 5.2.6 Event markers row

- **UI-07** Desktop shows an 8 px event marker row under the track row. Its content is the `events` list in `stages.json`: 52 events lie inside the axis; the 17520 hpf entry lies past the axis end and is not drawn (research 02 section 5).
- **UI-08** A marker is a 4 px diamond in `--text-muted` at `hpfToTrack(event.hpf) * W`. An event with `hpfIsEstimate: true` renders hollow with a 1 px stroke. Markers within 8 px of each other merge into one 6 px diamond with a count. At 1392 px the 52 events form 42 markers; nine are merged clusters, for example heart beat, pigmentation and circulation at 24 to 25 hpf.
- **UI-09** Hovering a marker shows the tooltip lines of UX-TL-11 plus one line per event: label, hpf or dpf, and "SL 7.2 to 7.5 mm (estimate)" when `slMm` is set. Clicking a marker moves `t` to the event hpf with the UX-TL-16 glide. Clicking a merged marker opens a 200 px list; each row moves `t` on click. Tablet, phone and presentation mode draw no event row; the track tooltip still lists events within 8 px of the pointer.

#### 5.2.7 Hover tooltip

- **UX-TL-11** Hovering the track shows a tooltip above the pointer after 150 ms. Line 1: stage name and period (13 px, 600). Line 2: time as "24 hpf" or "4.5 dpf" plus the ZFS id in `--text-muted`. Line 3: the landmark sentence (12 px). Maximum width 240 px, clamped inside the bar, no pointer events. A 2 px marker line in `--accent` shows the hovered time on the track. Landmark sentences come from the ZFIN staging table through `stages.json`, `landmarks[0]` of the stage record (UX-TL-12).
- **UX-TL-22** With snap on, the tooltip and the stage card show the stage the thumb sits on and omit the interpolated time.

#### 5.2.8 Thumb and stage card

- **UX-TL-13** The thumb is a vertical line across the track row plus a 16 px handle. The handle has a 2 px ring in `--bg` and a fill in `--accent`. Pressed state scales the handle to 20 px over 100 ms. Focus adds the 2 px focus ring at 2 px offset.
- **UX-TL-14** While the thumb is dragged, hovered or focused, the stage card floats above it: stage name (14 px, 600), time and ZFS id (12 px, tabular), body length when the growth table has a value (12 px). The stage card rises 4 px and fades in over 120 ms; it fades out over 100 ms. During drag it follows the thumb without transition.
- **UX-TL-15** Dragging updates `t` on every pointer move. The 3D scene interpolates on every frame. Snap changes only where the thumb rests on release.
- **UX-TL-16** Clicking the track at a new position moves the thumb there over 200 ms with `cubic-bezier(0.2, 0, 0, 1)`. The scene animates through the intermediate times. With `prefers-reduced-motion: reduce` the move is instant.

#### 5.2.9 Play, pause and speed

| Control | Icon (lucide) | Size | Behaviour | Key |
|---|---|---|---|---|
| First stage | `skip-back` | 36 px in a 44 px area | `t` = 0 | `Home` |
| Previous stage | `rewind` | 36 px | `t` = start of the previous stage | `ArrowLeft` |
| Play or pause | `play` / `pause` | 44 px, `--accent` fill | Advances the thumb at a constant track speed | `Space` |
| Next stage | `fast-forward` | 36 px | `t` = start of the next stage | `ArrowRight` |
| Last stage | `skip-forward` | 36 px | `t` = 2160 (Adult start); `Shift+End` gives 4320 | `End` |
| Speed | menu button labelled "1x" | 36 px | Menu lists 0.5x, 1x, 2x, 4x, 8x | `[` slower, `]` faster |
| Snap to stage | `magnet` toggle | 36 px | See step keys and snap | `S` |
| Units | segmented hpf, dpf, auto | 3 x 36 px | See readout and units | `U` cycles |
| Keyboard help | `keyboard` | 36 px | Opens the shortcut sheet | `?` |

- **UX-TL-17** Playback speed is defined in track distance (D7). At 1x the thumb crosses the full track in 60 s. Each frame advances the track fraction by `speed / 60` per second and converts back with `trackToHpf`. Playback stops at 4320 hpf and the button returns to play. `play()` at the axis end first moves `t` to the time at which the last playback started (or to 0 when none ran), then plays, so one press of `Space` replays. A transport button blurs itself after a pointer click, so a later `Space` reaches the global handler once (UI-41).

```ts
// per animation frame, dt in seconds
const next = hpfToTrack(t) + (speed / 60) * dt;
t = trackToHpf(Math.min(next, 1));
// play(): if (t >= 4320) setTime(lastPlayStart ?? 0); lastPlayStart = t; playing = true
```

| Speed | Full track | 0 to 10 hpf | 10 to 24 | 24 to 72 | 72 to 168 | 168 to 720 | 720 to 2160 | 2160 to 4320 |
|---|---|---|---|---|---|---|---|---|
| 1x | 60 s | 10.8 s | 7.2 s | 13.2 s | 6.0 s | 9.6 s | 8.4 s | 4.8 s |

The other speeds divide every duration by the speed factor: 0.5x takes 120 s for the full track, 2x takes 30 s, 4x takes 15 s and 8x takes 7.5 s.

- **UX-TL-19** Previous and First are disabled at `t` = 0. Next and Last are disabled at the axis end. Disabled buttons render at 35 percent opacity and stay focusable.
- **UI-10** The speed menu shows the full-track duration next to each item ("2x, 30 s"). With reduced motion on, the menu adds the line "Reduced motion is on" (UX-AC-07).
- **UX-TL-18** A play range with `Shift+Click` in-point and out-point is a later feature and is not in version 1.

#### 5.2.10 Step keys and snap

- **UX-TL-20** Snap is on by default in presentation mode and off elsewhere. The URL carries it as `snap=1`.
- **UX-TL-21** With snap on, releasing the thumb moves it to the nearest stage start when that start lies within 6 px; otherwise it stays. Arrow keys always step by stage. A stage step glides over 200 ms in track distance with the UX-TL-16 easing, so the 168 to 336 hpf step (4.5 to 6.2 mm) reads as growth; it cuts under reduced motion and when steps arrive faster than 3 per second. `Shift+ArrowLeft` and `Shift+ArrowRight` step by 1 hpf before 72 hpf and by 1 dpf after. `PageUp` and `PageDown` step by period outside presentation mode; in presentation mode they act as `ArrowLeft` and `ArrowRight`, because most presenter remotes send `PageUp` and `PageDown`, and `Shift+PageUp` and `Shift+PageDown` step by period (UI-41).
- **UI-11** At 1392 px the 6 px snap window is 0.24, 0.50, 0.94, 4.1, 14.9, 44 and 116 hpf across the seven D7 segments. The window scales with `W`. `End` moves to 2160 hpf, the start of the last stage; `Shift+End` moves to 4320 hpf, the axis end.

#### 5.2.11 Readout and units

- **UX-TL-23** The readout reads `<time> | <stage> | <length>`, for example `24 hpf | Prim-5 | 1.9 mm`. On desktop and tablet it sits at the left of the transport row. On phone and in presentation mode it is a chip inside the viewer. Font 14 px on desktop and, in presentation mode, the three sizes of UI-36 (48, 40 and 32 px times `--ui-scale`), weight 500, `tabular-nums`. The separators are `|` with 8 px padding.
- **UX-TL-24** Under 72 hpf the time shows hpf, with one decimal only when `t` is not an integer and snap is off (`26.5 hpf`). From 72 hpf it shows dpf with one decimal under 10 dpf (`4.5 dpf`) and integers above (`21 dpf`). The units switch forces hpf or dpf for the whole axis; `auto` applies this rule. The stage tooltip shows both units after 72 hpf (`72 hpf, 3 dpf`).
- **UI-12** The stage field shows the stage `shortLabel` from `stages.json` with a capital first letter ("Prim-5", "Days 7-13", "Adult"). The length field reads the `growth` table in `stages.json` (D6) at `t`. It shows millimetres with one decimal and the measure name in the tooltip (embryo length, total length or SL). Between table rows the value interpolates linearly and the readout appends "~". When the table has no value at `t`, the field is omitted.
- **UX-TL-26** The readout is an `aria-live="polite"` region. It announces at most once per 500 ms during playback and once per release during drag.

#### 5.2.12 Temperature relabel

- **UI-13** The settings sheet has an "Incubation temperature" field: presets 25, 28.5 and 33 C, and a numeric input from 24 to 33 C. The default is 28.5 C. The URL carries it as `temp=25`.
- **UI-14** When the temperature differs from 28.5 C, the readout, the hover tooltip and the stage card relabel embryonic times with the Kimmel et al. 1995 formula `H_T = h / (0.055 T - 0.57)` (research 02 section 1, ZFIN staging figure 2). `h` is the hour at 28.5 C and `H_T` is the hour at temperature `T`. The body model, the keyframes and the track keep 28.5 C hours; only the labels change. A chip "at 25 C" appears next to the readout. The relabel applies to `t` at or below 72 hpf, the range of the Kimmel calibration. Above 72 hpf the label keeps the 28.5 C value and the chip reads "28.5 C values". The settings sheet states this limit.

| Stage at 28.5 C | h | H_T at 25 C | H_T at 33 C |
|---|---|---|---|
| 20-somite | 19 | 23.6 | 15.3 |
| Prim-5 | 24 | 29.8 | 19.3 |
| Protruding-mouth | 72 | 89.4 | 57.8 |

The 20-somite row matches the values that research 02 quotes from ZFIN (23.6 h at 25 C; 15 h at 33 C).

#### 5.2.13 Touch behaviour

- **UX-TL-27** A single finger on the track scrubs after a 4 px horizontal movement; a tap moves the thumb. Vertical movement over 12 px before that threshold cancels the scrub.
- **UX-TL-28** While the user scrubs on phone, the readout chip at 18 px replaces the stage card. The chip moves to the top of the viewer so the finger does not cover it.
- **UX-TL-29** The scrub follows the finger 1:1. A long press of 500 ms on the track opens a stage list for precise selection.
- **UX-TL-30** Transport buttons on phone are 44 px with 8 px gaps; the play button is 56 px.

#### 5.2.14 States and motion

| State | Track fill | Thumb | Stage card | Duration and easing |
|---|---|---|---|---|
| Idle | period bands at 55 percent (dark) or 35 percent (light) | `--accent`, 16 px | hidden | |
| Hover band | band at 80 percent | unchanged | period tooltip after 150 ms | 100 ms linear |
| Hover thumb | | 18 px | stage card | 120 ms `cubic-bezier(0.2, 0, 0, 1)` |
| Drag | active band 100 percent | 20 px | follows the thumb | none during drag |
| Focus | | focus ring 2 px | stage card | 0 ms |
| Playing | active band pulses between 100 and 85 percent every 1.2 s | moves | visible | linear |
| Disabled button | | | | opacity 35 percent |
| Reduced motion | no pulse | | fades only | all transitions 0 ms except opacity 150 ms |

### 5.3 Systems rail

#### 5.3.1 System rows

- **UX-LY-04** A system row is 36 px high. It holds a 10 px colour dot, the display name (13 px, 500) and the count badge (11 px, tabular). The eye toggle button is 32 px inside a 44 px hit area.
- **UI-43** Below 1000 px of viewport height the rail shows the systems as a 3 by 5 grid of 44 px cells instead of 15 rows: each cell holds the system icon on the system swatch, a hidden system shows the icon at 45 percent with a strike, the tooltip and the `aria-label` give the display name and the count, and a click toggles the eye while `Alt+click` solos. A "List" toggle in the rail header switches to the 15 rows. At the 1440 by 900 reference the rows would leave the tree about 24 px; QP-35 asserts that the tree shows at least eight rows at that size.
- **UI-15** The 15 rows follow the D5 table order and use the D5 display names. The dot colour is the system's palette slot (see themes and tokens). Each row also shows the system icon from research 07 UX-VS-08 at 16 px; the axial system uses `ruler` and the blood and immune system uses `droplets`.
- The count badge reads "present / total", for example "4 / 5" (UX-IN-26). "present" counts structures of the system with geometry whose fade opacity is above 0 at `t` (BG-44); "total" counts all structures of the system with geometry. The badges subscribe to `presentIds` (AR-74).
- **UX-IN-27** The eye toggle hides every structure in the system. `Alt+click` on an eye shows only that system (solo). A second `Alt+click` restores the previous set. Hidden systems show `eye-off` and the name at 45 percent opacity.
- **UX-IN-28** The presets row holds five segmented buttons with `aria-pressed`: All, None, Embryo (early embryo, axial, skeletal, skin and pigment at 0.45 opacity), Organs (nervous, sensory, cardiovascular, digestive, respiratory, excretory, reproductive, endocrine, blood and immune; skin at 0.10), Skeleton (skeletal only, skin at 0).
- **UI-16** The rail header shows the total count badge for the whole atlas ("118 / 220") and a collapse button. The x-ray slider and the section control sit under the presets row (UX-IN-17); their behaviour is specified under viewer interactions.

#### 5.3.2 Hierarchy tree

- **UX-LY-05** The tree fills the remaining rail height and is virtualised. It shows the ZFA `part of` hierarchy under `whole organism` (ZFA:0001094) as stored in `structures.json`. Rows are 28 px with a 16 px indent per level. Each row holds a 16 px chevron (44 px hit area), an 8 px swatch, the 13 px name and a 24 px eye.
- **UI-17** The top level of the tree is the 15 systems, derived at load from `systems.json` in the D5 order; these rows are not records and carry no id (DM-02 holds). Under a system row sit the records of that system whose `uiParent` is the root ZFA:0001094 or a record of another system; below them the stored `uiParent` chain applies. The root record itself (the skin, DM-31) is not a tree row; it is reachable from search and from the rail header. The tree opens with the system level expanded and every deeper level collapsed. Expansion state persists in `localStorage`.
- **UX-IN-26** The filter "Only structures present now" is a checkbox in the tree header and is on by default. With the filter on, rows absent at `t` are hidden; a group node counts as present while any descendant is present (DM-30). With the filter off, absent rows render at 45 percent opacity with a `clock` icon.
- **UI-18** A group node with `geometry: null` (D5) renders a dashed swatch. Clicking it selects the group; the info card shows its definition and its children (see the info card).
- **UX-IN-29** Click selects; the chevron expands; the eye hides; hover highlights the structure in 3D; the row scrolls into view when a structure is selected in 3D or from search. A row with children carries a count badge in the form of UX-IN-26 for its descendants.

#### 5.3.3 Keyboard use in the rail

- **UX-AC-02** The tree uses `role="tree"` with `treeitem` and `group` children, `aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset` and `aria-multiselectable="true"`. Keys follow the WAI-ARIA tree view pattern: Down, Up, Right, Left, Home, End, Enter, Space, `*`, type-ahead, `Shift+Arrow`, `Ctrl+A`. The eye toggle inside a row is a `button` with `aria-pressed`, reached with `Tab` from the focused row.
- **UI-19** The system list is a `listbox` of rows; Up and Down move, Space toggles the eye, Enter selects the system group node in the tree, `Alt+Enter` solos.

### 5.4 Info card

#### 5.4.1 Fields

The info card is 340 px wide on desktop (UX-LY-07). Fields appear in this order.

| Field | Content | Type |
|---|---|---|
| Name | Structure display name | Title, 20 px, 600 |
| ZFA id | `ZFA:0000114`; click copies it; toast "Copied" | Mono 12 px |
| System chip | Swatch plus the D5 display name; `alsoIn` systems as extra chips | UI 13 px |
| Presence badge | "Present" or the absent state below | Caption |
| Stage window | "ZFIN: High-pec (42 hpf) to Adult". When `visibleFromHpf` or `modelEndHpf` differs from ZFIN, a second line reads "Model: 42 to 4320 hpf" with the record note | Caption |
| Alias chain | Only when the record has `aliasChain`; see below | Caption |
| Definition | The ZFA definition text from the record | Body 14 px, 1.6 line height |
| Events | The record's events sorted by hpf: time, label. The next event after `t` carries a `clock` icon. Click moves `t` with the UX-TL-16 glide | List |
| Part of, parts, synonyms | Parent name as a link; children as links with count; a collapsed row "Synonyms (4)" | Caption |
| Open in ZFIN | External link `https://zfin.org/<ZFA id>` with `external-link` | Button |
| Actions | Isolate, Hide, Jump to first appearance (labelled with the target stage and time), Add to selection, Copy link to structure | Buttons, 36 px in 44 px areas |
| Sources | Collapsed row "Sources (3)"; expands to the record's source citations with links | Caption |
| Attribution line | `attribution.zfin.footer` ("Definitions and stages: ZFIN, CC BY 4.0", DM-27) plus "Geometry is schematic.", with a link to the licence URL and to `ATTRIBUTION.md` (D14) | Micro 11 px |

- **UI-20** The "Jump to first appearance" button moves `t` to the structure's first fully visible time, `visibleFromHpf + fadeInHpf` (D1, UX-IN-24, BG-44); with snap on, the target is the start of the stage that contains that time when that start is at or after it, otherwise the time itself. The button names the stage and the target time, for example "Jump to High-pec (42.3 hpf)" for the atrium (fade 0.3 h) and "Jump to Day 5 (120 hpf)" for the posterior chamber of the swim bladder, whose fade runs 96 to 120 hpf. A jump to `visibleFromHpf` itself would land on opacity 0 and scale 0.7, and the structure would not be pickable until opacity 0.3 (AR-34). When the structure is present at `t`, the button stays enabled and moves `t` back to the first appearance.
- **UX-IN-24** The jump uses the 200 ms thumb motion. When "follow growth" is on, the camera frames the structure after it appears.
- **UI-21** A multi-selection (up to 12 structures) shows a list card: one row per member with swatch and name, a remove button per row, and the actions Isolate, Hide and Copy link applied to all.

#### 5.4.2 Structure-absent state

- **UX-IN-23** When the selected structure does not exist at `t`, the info card stays open. The header keeps the name. The presence badge reads "Not present at 26 hpf" in `--text-muted` with a `clock` icon. The primary button reads "Jump to Prim-25 (36.3 hpf)", using the target of UI-20. The 3D outline is removed and the tree row shows the clock state.
- **UI-22** When the structure has ended, the badge reads "Modelled until 168 hpf (Days 7-13)". The button reads "Jump to Day 6 (144 hpf)", the start of the last stage in which the structure is present. The ZFIN end stage stays visible in the stage window field.
- **UI-23** A group node with `geometry: null` shows the note "No 3D geometry for this term. Its parts are listed below." and the children list. Isolate and Hide act on the children (UX-ST-03).

#### 5.4.3 Alias chain

- **UI-24** The heart is one record (`ZFA:0000114`) with an `aliasChain` of the four earlier ZFIN heart terms (D9, DM-24, research 03c section 1); the eye (`ZFA:0000107`) has a chain of two (DM-34). Entries carry `zfaId`, `name`, `fromHpf` and `toHpf`. The card shows the active entry as "ZFIN term now: heart tube (ZFA:0000360), 24 to 42 hpf". The active entry is the one whose window contains `t`; after the last window the record's own name applies. When the active alias window lies before `visibleFromHpf`, the badge reads "ZFIN describes the heart primordium at 15 hpf; the model draws the heart from 19.2 hpf" and the jump button targets the UI-20 time, so the card never shows a current ZFIN term directly above "Not present".
- **UI-25** Below the active entry a collapsed row "All ZFIN terms (5)" expands to the chain with the active row marked. The Open in ZFIN button targets the active entry's id. Search matches every alias name and id (see search).

The five terms are heart primordium (ZFA:0000028), heart rudiment (ZFA:0000115), primitive heart tube (ZFA:0000149), heart tube (ZFA:0000360) and heart (ZFA:0000114). Their ZFIN windows are 11.66 to 22, 19 to 24, 22 to 30, 24 to 42, and 42 hpf to adult. The windows overlap in ZFIN. The record stores them as the contiguous windows 11.66 to 19, 19 to 22, 22 to 24 and 24 to 42 hpf (DM-24). One term therefore applies at every `t`. The four chamber records appear as children from 42 hpf (D9).

#### 5.4.4 Stage card fallback

- **UX-LY-08** When no structure is selected, the info card shows the current stage: name, ZFS id, period, hpf range, landmark sentences, body length from the growth table, and the list of structures that first appear in this stage. Each list row selects the structure. A pin button keeps this view while a selection exists.

### 5.5 Search

- **UX-LY-02** The search field is 360 px wide and 36 px high in the top bar. `Ctrl+K` or `/` focuses it. It matches structure names, ZFA synonyms, ZFA ids, alias chain names and system names. The index builds from `structures.json` at load. Ranking: exact name, name prefix, word match in the name, synonym match, id match, fuzzy match with at most two edits. The list shows up to 8 rows and a "Show all N" row.
- **UI-26** A result row is 44 px: swatch, name (13 px), the system display name and the stage window as "42 hpf to adult". When the match came from a synonym, the synonym shows in `--text-muted`. A structure absent at `t` shows a `clock` icon and the text "from 42 hpf".
- **UX-IN-25** Enter or click selects the result and opens the info card. When the structure is absent at `t`, `t` does not change; the card opens in the absent state and a toast offers "Jump to 42.3 hpf" (the UI-20 target). With the setting "Jump to appearance on select" on, `t` moves at once to that target.
- **UX-ST-02** No match: "No structure matches 'xyz'. Search also covers ZFA synonyms and ids." plus three fuzzy suggestions, each selectable. Up and Down move through rows, Enter selects, `Escape` clears the field and returns focus to the viewer. The list uses `role="listbox"` with `aria-activedescendant`.

### 5.6 Top bar

- **UX-LY-01** The top bar is 48 px high. Left: the `fish` icon and the title "Zebrafish Atlas" (15 px, 600). Centre: the search field. Right: the view preset segmented control, then icon buttons for theme, export, share, present, settings and help. Icons are 20 px inside 44 px targets. Every icon button has an `aria-label` and a tooltip with its shortcut (UX-AC-05).

| Button | Icon (lucide) | Action | Key |
|---|---|---|---|
| View presets | six buttons of 40 px: Lat, Dor, Ven, Ant, Pos, 3/4 | Camera preset (D4) | `1` to `6` |
| Theme | `sun` / `moon` | Toggle dark and light | `T` |
| Export | `camera` | Open the export dialog | `Ctrl+Shift+S` |
| Share | `link` | Open the share dialog | `Shift+C` |
| Present | `presentation` | Presentation mode | `P` |
| Settings | `settings` | Open the settings sheet | `,` |
| Help | `info` | Open the About and shortcuts sheet | `?` |

- **UI-27** The settings sheet holds units, incubation temperature, snap, follow growth (UX-IN-12), keep dorsal up (UX-IN-13) and jump to appearance on select (UX-IN-25). It also holds labels, scale bar, studio background (UX-VS-01) and quality (the post-processing toggle, D2). A "Presentation" group holds projector scale (1x, 1.5x, 2x; UI-36) and strip position (bottom, top; UI-37). The sex toggle for the gonad handoff from 25 dpf (D9) offers female or male; the default is female. The URL carries it as `sex=f` or `sex=m`.
- **UI-28** On tablet the preset control shows Lat, Dor and 3/4; the other presets and the icon buttons except Present move into an overflow menu. On phone the bar is 44 px with the title, a search button and a menu button.

### 5.7 Viewer interactions

#### 5.7.1 Pointer gestures

| Gesture | Mouse and trackpad | Touch | Result | Id |
|---|---|---|---|---|
| Move over a structure | hover after 80 ms | none | Hover highlight and a hover chip with the name; cursor `pointer` | UX-IN-01 |
| Click or tap | left click, under 5 px movement | tap, under 12 px, under 300 ms | Select; replaces the selection; opens the info card | UX-IN-02 |
| Double-click or double-tap | within 300 ms | same | Isolate the selection; the camera fits it over 400 ms; other structures drop to 6 percent opacity | UX-IN-03 |
| Shift+click | | none; use the card action Add to selection | Add to or remove from a multi-selection, maximum 12 | UX-IN-04 |
| Right-click or long press | context menu at the pointer | 500 ms | Menu: Hide, Isolate, Add to selection, Copy name and ZFA id, Copy link to this structure, Open in ZFIN | UX-IN-05 |
| Click empty space | | tap | Clears the selection | UX-IN-06 |
| Drag | left drag | one finger | Orbit around the target | UX-IN-07 |
| Right drag or `Shift`+drag | | two fingers | Pan, clamped to 1.5 times the body bounding box | UX-IN-08 |
| Wheel or pinch | | two fingers | Dolly toward the cursor | UX-IN-09 |

- **UX-IN-10** `OrbitControls` with `enableDamping` true and `dampingFactor` 0.08.
- **UX-IN-11** `minDistance` is 0.4 times the current body length; `maxDistance` is 8 times.
- **UX-IN-12** "Follow growth" (default on) moves the controls target to the body centroid on each `t` change. It scales the camera distance with body length through a critically damped filter with a 200 ms time constant (AR-41). This is the D4 rule that the camera frames the body on every stage change; the earlier per-stage fit clause of AR-41 is deleted, because a fit that runs only at a stage boundary let the body grow by up to 1.56 times inside a stage and then jumped out in 200 ms, eleven times per playback.
- **UX-IN-13** "Keep dorsal up" (default on) clamps the polar angle to 0.05 pi and 0.95 pi. The clamp is lifted while the dorsal or ventral preset is active and returns on the first manual orbit (AR-39).

#### 5.7.2 View presets

D4 fixes the world axes: +x posterior, +y dorsal, +z the left side of the fish, millimetres. Each preset places the camera on the given direction from the body centroid at the fit distance. `camera.up` is `+y` for every preset (AR-39); the dorsal and ventral presets sit 0.001 rad off the pole with the azimuth that puts the snout on the screen left (AR-40). Transitions slerp over 500 ms with `cubic-bezier(0.2, 0, 0, 1)` with the controls disabled, then one `controls.update()`; reduced motion cuts.

| Key | Preset | Camera direction (x, y, z) | Polar, azimuth (AR-40) | Result |
|---|---|---|---|---|
| `1` | Lateral (default) | (0, 0, +1) | pi / 2, 0 | Left side of the fish; snout on the screen left, as in ZFIN figures |
| `2` | Dorsal | (0, +1, 0) | 0.001, pi / 2 | Snout on the left; the left flank toward the bottom of the screen |
| `3` | Ventral | (0, -1, 0) | pi - 0.001, pi / 2 | Snout on the left; the left flank toward the top of the screen |
| `4` | Anterior | (-1, 0, 0) | pi / 2, -pi / 2 | Head on; the left side of the fish on the screen right |
| `5` | Posterior | (+1, 0, 0) | pi / 2, pi / 2 | Tail on; the left side of the fish on the screen left |
| `6` | Three-quarter | (-0.45, 0.35, 0.82) | acos(0.35), atan2(-0.45, 0.82) | Anterodorsal left view; the research 07 vector with x negated for the D4 axis |

QP-38 asserts, for `v=dor`, that the snout projects left of the tail and that the dorsal axis of the fish is vertical on screen within 1 degree; the 18 dorsal screenshots of D13 depend on it.

- **UI-29** The orientation gizmo (64 px, bottom right) shows A, P, D, V labels and follows the same axes. Clicking a gizmo face applies the matching preset.
- **UX-IN-15** Reset (`R`) returns to the lateral preset with fit-to-body and clears x-ray to default, section to off and isolate. `Shift+R` also clears selection and hidden systems and returns `t` to 24 hpf. Reset never changes theme, units or temperature.
- **UX-IN-16** Auto-rotate is available in presentation mode at `autoRotateSpeed` 0.5. Any pointer or key input stops it.

#### 5.7.3 X-ray slider

- **UX-IN-17** The slider ranges 0 to 100 in steps of 5 and shows the value as a percentage. `X` toggles between 0 and the last non-zero value.
- **UX-VS-16** 0 to 100 percent runs the nine-class ramp of AR-32: from 0 to 60 each class moves from its opaque anchor to its default anchor, and from 60 to 100 it moves on to its deep anchor. At the default 60 the skin sits at 0.24 while, at the same slider position, the wall class (muscular, fins before flexion, the integument and pigment system's own skin structures, the somite and the segmental plate) sits at 0.50 and the organ class (nervous, sensory, respiratory, digestive, excretory, reproductive, skeletal) sits at 0.70, so the trunk and the organs show while the body outline stays. Research 07 named 25 percent as the default and marked the skin ramp alone as tuned against real geometry; the review found that the 0.45 skin veil at that default made the first click select the skin and halved the hue separation of the systems (UXR-05), and the default moved to 60 for that reason. The calibration pass of 2026-09-07 replaced research 07's single muscular ramp with the per-class table of RN-04, tuned against the owner's reference figures; the skin ramp itself is unchanged from research 07.

#### 5.7.4 Section plane

- **UX-IN-18** The section control is a segmented button: Off, Sagittal, Frontal, Transverse. Beside it sit a position slider from -1 to +1 across the body bounding box on the plane's normal axis and a flip button. The plane names follow fish anatomy usage; the tooltip for Frontal adds "(horizontal)". Research 07 used "Coronal" and marked the names unverified; this section uses the fish names.

| Control label | Plane contains | Normal axis (D4) | Slider range | Flip |
|---|---|---|---|---|
| Sagittal | anterior-posterior and dorsal-ventral axes | z (left-right) | +1 left surface to -1 right surface | keep left or right part |
| Frontal (horizontal) | anterior-posterior and left-right axes | y (dorsal-ventral) | +1 dorsal surface to -1 ventral surface | keep dorsal or ventral part |
| Transverse | dorsal-ventral and left-right axes | x (anterior-posterior) | -1 snout to +1 tail | keep anterior or posterior part |

- **UX-IN-19** Implementation: `renderer.localClippingEnabled = true`, one `THREE.Plane` in world space in every material's `clippingPlanes` from creation, parked at 1e6 mm while the section is off (AR-43). Version 1 draws no cap. Materials keep their side; back faces of `DoubleSide` structures darken by 20 L* through `gl_FrontFacing` (AR-44). Picking ignores hits on the clipped side of the plane (AR-34), so a click on the exposed brain in a sagittal section selects the brain and not the clipped skin. A stencil cap pass is a later feature. While the slider is dragged the plane shows as a translucent rectangle (`--accent` at 12 percent, 1 px border); it hides 300 ms after release.
- **UX-IN-20** The URL carries the section as `sec=sag:0.1`, `sec=fro:-0.2` or `sec=tra:0.5`. Export includes it.
- **UX-IN-21** A structure that crosses `visibleFromHpf` or `modelEndHpf` gets the 300 ms scale-and-opacity transition of D3. Scrubs faster than 3 stages per second make the change instant. With reduced motion the transition is opacity only over 150 ms.

### 5.8 Themes and tokens

#### 5.8.1 Colour tokens

Values and contrast ratios come from research 07 section 4.1.

| Token | Dark (default) | Light | Contrast |
|---|---|---|---|
| `--bg` (viewer and page) | `#0E1116` | `#F5F6F7` | |
| `--surface` (panels) | `#161B22` | `#FFFFFF` | |
| `--surface-2` (inputs, chips) | `#1E252E` | `#EEF1F4` | |
| `--border` | `#2A323C` | `#D7DCE2` | |
| `--text` | `#E7EAEE` | `#1B1F24` | 15.7:1 dark; 15.3:1 light |
| `--text-muted` | `#9AA3AD` | `#5B6470` | 7.4:1; 5.5:1 |
| `--accent` (thumb, links, active) | `#5FB8E8` | `#0B6E99` | 8.6:1; 5.2:1 |
| `--focus` (focus ring, selection outline) | `#FFD166` | `#B45309` | 13.1:1; 4.6:1 |
| `--danger` | `#E4483C` | `#B81A1D` | 4.8:1; 6.1:1 |

- **UX-US-06** Dark is the default theme. `prefers-color-scheme` sets the theme on first load; the user's choice then persists in `localStorage` (UX-VS-02). The `theme` URL parameter overrides both (UX-VS-03). The dark accent moved from `#7FD3F5`, which equalled the S02 sensory hue, to `#5FB8E8` (deltaE 12.5 from S02; contrast 8.6:1 on `--bg`); research 07 section 4.1 receives the change through section 7.3.
- **UX-VS-01** The viewer background is a solid `--bg`. The optional studio background adds a radial gradient from `--bg` lightened by 4 percent at the centre to `--bg` at the edges; export omits it.
- **UI-30** Tokens are CSS variables defined on `:root` for the light theme, redefined under `[data-theme="dark"]` and under `prefers-color-scheme: dark` when no explicit theme is set. Tailwind reads the variables (D2).
- **D18 amendment (2026-09-12)** A third token variant, `'fluorescence'` (`--bg` `#060C14`), backs the reporter preview scene and its exports. It does not follow the theme toggle or `prefers-color-scheme`, and it does not replace `dark` or `light` anywhere else in the viewer.

#### 5.8.2 The 15-slot palette

The hex values come from research 07 section 4.2. `systems.json` owns the slot assignment (D5); the table gives the assignment this section assumes. D5 merges the research 07 hematopoietic and immune systems into one and adds the axial system, which takes slot S13.

| Slot | System id (D5) | Display name | Dark hex | L* | vs `#0E1116` | Light hex | L* | vs `#F5F6F7` |
|---|---|---|---|---|---|---|---|---|
| S01 | nervous | Nervous | `#5B8DEF` | 59 | 5.9:1 | `#1863BF` | 43 | 5.4:1 |
| S02 | sensory | Sensory | `#7FD3F5` | 81 | 11.3:1 | `#2989A9` | 53 | 3.7:1 |
| S03 | cardiovascular | Cardiovascular | `#E4483C` | 53 | 4.8:1 | `#B81A1D` | 40 | 6.1:1 |
| S04 | hematopoietic_immune | Blood and immune | `#F28FA0` | 70 | 8.3:1 | `#B15567` | 48 | 4.4:1 |
| S05 | muscular | Muscular | `#F08A3C` | 67 | 7.6:1 | `#B05500` | 47 | 4.7:1 |
| S06 | skeletal | Skeletal | `#F0EDE4` | 94 | 16.2:1 | `#939088` | 60 | 2.9:1 |
| S07 | integument_pigment | Skin and pigment | `#C3CAD2` | 81 | 11.4:1 | `#7A8188` | 54 | 3.6:1 |
| S08 | digestive | Digestive | `#A9713B` | 52 | 4.6:1 | `#84511C` | 39 | 6.1:1 |
| S09 | respiratory | Respiratory | `#66D1C2` | 77 | 10.3:1 | `#028B7E` | 52 | 3.9:1 |
| S10 | excretory | Excretory | `#C6D34A` | 81 | 11.5:1 | `#7A8800` | 54 | 3.6:1 |
| S11 | reproductive | Reproductive | `#B067D6` | 56 | 5.2:1 | `#8641AC` | 41 | 5.8:1 |
| S12 | endocrine | Endocrine | `#D34FA7` | 54 | 4.9:1 | `#AA2382` | 40 | 5.9:1 |
| S13 | axial | Axial | `#3E9B4F` | 57 | 5.4:1 | `#01722A` | 42 | 5.6:1 |
| S14 | fins | Fins | `#A9AFF2` | 73 | 9.1:1 | `#6972B0` | 50 | 4.2:1 |
| S15 | early_embryo | Early embryo | `#D9C79A` | 81 | 11.3:1 | `#8E7E55` | 53 | 3.7:1 |

- **UX-VS-04** Colour never carries meaning alone. Every system row shows its name and icon; every structure shows its name on hover; the info card names the system in text.
- **UX-VS-07** Child structures inherit the system hue and step lightness by 6 L* per depth level (D10). Steps alternate darker and lighter around the base and clamp to the theme window. The D10 exception list (arteries red, veins blue, otoliths white, and the others) overrides the inherited hue for the named structures.
- **UI-31** A swatch whose contrast against `--bg` is below 3:1 gets a 1 px `--text-muted` outline. In the light theme this applies to S06 (2.9:1).
- **UI-32** The reduced Okabe-Ito palette of research 07 UX-VS-06 is not in version 1. It gives one hue to several systems, and D10 requires one hue per system.
- **UI-42** Colour pair check. `07-design-brief-checks.py` is extended to the 15 system hues, the 11 exception colours of section 3.6, `--focus` and `--accent`, for both themes. For every pair of colours that can co-occur on screen it requires deltaE (CIE76) of at least 12 under normal vision and at least 6 under simulated protanopia, deuteranopia and tritanopia. The review measured, before the changes of this revision: chorion against skin 2.1, iridophore against chorion 2.5, otolith against skeletal 5.5, xanthophore against yolk 5.5, and under deuteranopia xanthophore against excretory 1.4. The pairs that remain under the floor after the xanthophore and accent changes (chorion against skin, iridophore against chorion, otolith against skeletal) are separated by opacity or by lightness step rather than by hue, and the script lists them as accepted exceptions with the reason. The check runs before `systems.json` freezes in WP-02 and again in WP-H2.

#### 5.8.3 Typography

- **UX-VS-09** Typeface Inter variable, self-hosted, SIL Open Font License 1.1. Fallback stack `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Numerals in the readout, ticks, tables and ids use `font-feature-settings: "tnum" 1`. Ids use `ui-monospace, "SF Mono", Menlo, Consolas, monospace` at 12 px (UX-VS-10).

| Role | Size | Weight | Line height | Where |
|---|---|---|---|---|
| Presentation time | 48 px x `--ui-scale` | 600 | 1.1 | Readout time in presentation mode (UI-36) |
| Presentation stage and card name | 40 px x `--ui-scale` | 600 | 1.15 | Readout stage name; floating info card name |
| Presentation length | 32 px x `--ui-scale` | 500 | 1.15 | Readout length |
| Presentation body and labels | 24 px and 20 px x `--ui-scale` | 400, 500 | 1.4 | Card body, toasts; period labels and 3D labels |
| Display | 32 px | 600 | 1.15 | Loading and error headings |
| Title | 20 px | 600 | 1.25 | Info card header |
| Heading | 16 px | 600 | 1.3 | Rail section headers, dialogs |
| Body | 14 px | 400 | 1.6 | Definitions |
| UI | 13 px | 500 | 1.4 | Buttons, tree rows, system rows |
| Caption | 12 px | 400 | 1.4 | Period labels, tooltips, meta |
| Micro | 11 px | 500 | 1.2 | Tick labels, counts |

#### 5.8.4 Spacing, radius, shadow and focus ring

| Token | Value |
|---|---|
| Space scale | 4, 8, 12, 16, 24, 32, 48 px |
| Panel padding | 16 px |
| Row height | 36 px system row; 28 px tree row; 44 px touch row |
| Radius | 4 px chips and tooltips; 8 px buttons and inputs; 12 px cards; 16 px sheets |
| Border | 1 px `--border` on every panel edge that touches the canvas |
| Shadow, dark | none for docked panels; floating cards `0 8px 24px rgba(0,0,0,0.5)` |
| Shadow, light | docked `0 1px 2px rgba(20,30,40,0.06)`; floating adds `0 12px 32px rgba(20,30,40,0.10)` |
| Focus ring | 2 px solid `--focus`, offset 2 px, radius follows the element |
| Icons | lucide, 20 px in bars and rows, 16 px in tree rows and chips, stroke 1.75; only names verified in research 07 UX-VS-11 |

### 5.9 Accessibility

#### 5.9.1 Keyboard map

Shortcuts are single keys without modifiers except where listed, so a presenter's clicker mapped to arrow keys works. Shortcuts are suppressed while focus is in a text field.

| Key | Action | Key | Action |
|---|---|---|---|
| `Space` | Play or pause | `S` | Snap toggle |
| `ArrowLeft` / `ArrowRight` | Previous or next stage | `U` | Cycle units |
| `Shift+Arrow` | Step 1 hpf or 1 dpf | `1` to `6` | View presets (D4 order) |
| `PageUp` / `PageDown` | Previous or next period; in presentation mode previous or next stage (remotes) | `R` / `Shift+R` | Reset camera / reset all |
| `Shift+PageUp` / `Shift+PageDown` | Previous or next period in presentation mode | `Shift+End` | Axis end (180 dpf) |
| `Home` / `End` | Axis start / Adult start | `X` | Toggle x-ray |
| `[` / `]` | Speed down / up | `I` | Isolate selection |
| `Ctrl+K` or `/` | Focus search | `H` | Hide selection |
| `Escape` | Exit isolate, close sheet, clear selection, exit presentation (one per press, in that order) | `L` | Toggle 3D labels |
| `P` / `Shift+P` | Presentation mode / pin the strip (UI-37) | `F` | Fit camera to body |
| `Enter` (presentation) or `Shift+F` | Toggle fullscreen (UI-40) | `B` or `.` (presentation) | Black screen toggle (UI-40) |
| `T` | Toggle theme | `Ctrl+B` | Add a bookmark (section 5.12) |
| `?` | Shortcut sheet (a popover in presentation mode) | `Shift+B` | Slide kit sheet (a popover in presentation mode) |
| `Ctrl+Shift+S` | Export dialog | `,` and `Shift+C` | Settings and share; ignored in presentation mode |
| `Ctrl+C` with a selection | Copy "name (ZFA id)" | `Alt+Arrow` | Orbit by 15 degrees |
| `Alt+Plus` / `Alt+Minus` | Zoom by 10 percent | `Tab` | Move between regions |

- **UI-33** `Ctrl+B` adds a bookmark and `Shift+B` opens the slide kit sheet (research 07 UX-EX-12 with the key moved, because presenter remotes send `b` for a black screen; AR-60). With a kit loaded in presentation mode, `ArrowLeft` and `ArrowRight` step between bookmarks and `Shift+Arrow` steps stages (AR-60). The 1 hpf step is unavailable while a kit is loaded.
- **UI-40** Fullscreen and black screen. `Enter` in presentation mode and `Shift+F` in any mode toggle fullscreen through the Fullscreen API from the key gesture (AR-59). On entry through `present=1` a chip "Press Enter for fullscreen" shows for 5 s in the strip area, because a URL opened from a slide arrives with tabs and an address bar. `B` and `.` in presentation mode toggle a black screen (a `--bg` layer at opacity 1 over the canvas, `blackScreen` in the store, never in the URL); any key or pointer input other than these two keys leaves it. The context menu of UX-IN-05 is disabled in presentation mode. Only error toasts show in presentation mode, and they sit in the strip area (UX-ST-13).
- **UI-41** Key dispatcher. One `keydown` listener on `window` dispatches every shortcut from `event.code` (so `Alt+Minus` on macOS, which yields an en dash in `event.key`, still works) and calls `preventDefault()` on every combination it handles, so `Alt+ArrowLeft` never triggers browser back on Windows and Linux and `Space` never scrolls. The dispatcher ignores an event whose `defaultPrevented` is already true and an event whose target is a text field, a `button`, a `slider` or a `listbox`; the transport buttons and the track handle their own keys and blur after a pointer click, so `Space` after clicking Play toggles once and `ArrowRight` on the focused track steps once. WP-I4 adds a smoke case per row of the table above.

#### 5.9.2 ARIA roles

- **UX-AC-01** The track is `role="slider"` with `aria-valuemin="0"`, `aria-valuemax="4320"`, `aria-valuenow` set to `t` and `aria-valuetext` such as "24 hours post fertilization, Prim-5, Pharyngula period". Arrow, Home, End, PageUp and PageDown follow the WAI-ARIA slider pattern.
- **UX-AC-03** The canvas is `role="application"` with `aria-label="3D viewer"` and `aria-describedby` pointing to a hidden paragraph that lists the keyboard alternatives.
- **UX-AC-04** A hidden `aria-live="polite"` region announces selection changes ("Heart selected, cardiovascular system, present from High-pec") and readout changes.
- **UX-AC-05** Every icon button has an `aria-label` and a tooltip on hover and focus after 400 ms, showing the label and the shortcut ("Play (Space)"). Nothing relies on hover alone: every hover chip has a keyboard or info card equivalent (UX-AC-09).
- **UX-AC-06** Focus order: top bar left to right, systems rail top to bottom, viewer, info card, timeline bar. Focus rings use `:focus-visible`.
- **UX-AC-10** Touch targets are at least 44 by 44 CSS px (WCAG 2.2 SC 2.5.5, level AAA). This includes the thumb, the eye toggles and the tree chevrons.

#### 5.9.3 Reduced motion and contrast

- **UX-AC-07** `prefers-reduced-motion: reduce` disables the playing pulse, camera slerps (cut instead), the appearance scale (opacity only), auto-rotate and the thumb glide. Playback still works because the user starts it.
- **UX-US-02** Text contrast is at least 4.5:1 under 24 px and 3:1 at 24 px and above. Controls and swatches are at least 3:1 against their surroundings (WCAG 2.2 SC 1.4.3 and SC 1.4.11). The token tables above carry the measured ratios. Body text is never lighter than `--text-muted` (UX-AC-08).
- **UX-AC-12** Browser zoom to 200 percent reflows to the tablet layout and 400 percent to the phone layout; no horizontal scroll appears.

### 5.10 First-run hint, loading, error and empty states

| State | Trigger | What the user sees | Id |
|---|---|---|---|
| Loading | first load | The layout skeleton in `--surface-2`, a centred 1-cell embryo from the first keyframe as soon as the data arrives, and a 2 px progress bar under the top bar with the text "Building the atlas" and the current step. Target: first frame under 2 s on 10 Mbit/s (UX-US-05) | UX-ST-01 |
| Empty search | no match | Message and three fuzzy suggestions (see search) | UX-ST-02 |
| No geometry | a group node is selected | Definition plus the note and children list of UI-23 | UX-ST-03 |
| Nothing visible | every system hidden, or isolate hides all at `t` | Centred hint in the viewer: "Nothing is visible at 4 hpf. Show a system from the rail or jump to 24 hpf" with two buttons; it disappears on any change | UX-ST-04 |
| Structure absent | selection not present at `t` | Info card badge and Jump button (UX-IN-23) | UX-ST-05 |
| WebGL unavailable | context creation fails | A static PNG of the lateral view at 24 hpf, the message "This browser cannot run the 3D viewer. Try a current version of Chrome, Firefox or Safari.", and links to ZFIN and the stage table. The timeline bar is hidden | UX-ST-06 |
| Context lost | `webglcontextlost` | Toast "The 3D view paused. Restoring" and an automatic rebuild on `webglcontextrestored`; a "Reload viewer" button appears after 5 s | UX-ST-07 |
| Data error | `parseAtlasData` rejects a bundled data file | A centred card "Could not load the atlas data" with the file name and the first three issues (AR-66); the top bar stays so the About sheet opens | UX-ST-08 |
| Bad URL | unknown ZFA id or `t` out of range | Load the defaults, then a toast "Structure ZFA:9999999 is not in this atlas" or "Time clamped to 180 dpf" | UX-ST-09 |
| Offline | fetch fails after first load | The static site keeps working from cache; a toast "You are offline; ZFIN links will not open" | UX-ST-10 |

- **UX-ST-11** First-run hint: on the first visit (no `localStorage` key, not presentation mode, and no state parameter in the URL other than `theme`) three chips appear over the viewer after the first frame: "Drag to orbit" near the fish, "Scrub time" above the thumb, "Click a structure" with an arrow toward the head. Chips are 13 px on `--surface` with the 12 px radius. They fade after 6 s or on the first interaction and never return. "Show tips" in the help menu replays them. A deep link opened on a fresh browser therefore shows the encoded view without chips over it.
- **UX-ST-12** The About sheet states three facts: the geometry is procedural and schematic; stage timings are for 28.5 C from ZFIN; definitions and stage windows come from the ZFA and ZFS with a version string. It links to the repository, to `ATTRIBUTION.md` and to the ZFIN staging table.
- **UX-ST-13** Toasts appear bottom centre above the timeline bar, 44 px high, one at a time. They stay 2 s for confirmations and 6 s for errors, with a close button and `role="status"`. In presentation mode only error toasts appear, at the UI-36 toast size, inside the strip area; URL warnings collected at load show once, before the first frame, and never later on the projector.
- **UX-US-07** No action opens a modal dialog in presentation mode except the export dialog, which the speaker opens on purpose.

### 5.11 Export and share dialogs

#### 5.11.1 Export dialog

- **UX-EX-01** The export dialog opens from the export button or `Ctrl+Shift+S`. It offers a frame (viewport, 16:9, 4:3, 1:1), a size (1x, 2x, 4x of the viewport, or 1920 by 1080 and 3840 by 2160 for the 16:9 frame; AR-52) and a transparent background toggle (D1). Checkboxes: "Include labels", "Include scale bar", "Include readout" (time, stage, length as a text chip), "Include legend" (visible systems with swatches), "Include selection outline". A select "Overlay colour" offers auto, dark and light (AR-56). Defaults: viewport frame, 2x, transparent off, labels as shown, scale bar on, readout on, legend off, selection outline on when a selection exists, overlay colour auto. On the 1440 by 900 reference with both panels docked the canvas is about 820 by 740 px, so a viewport export gives 1640 by 1480 px at 2x; the 16:9 frame exists for slides.
- **UX-EX-02** The dialog states the resulting pixel size. The longest edge is capped at 8192 px; above that the 4x option is disabled with the reason. The render uses offscreen render targets with the tone mapping of the canvas (AR-51); overlays are drawn on a 2D canvas at the same scale so text stays sharp (research 06, presentation mode and PNG export).
- **UX-EX-03** Transparent export renders with alpha; the pipeline un-premultiplies in linear light and writes straight alpha to the PNG (AR-55), so the translucent skin composites onto any slide background without a dark or a bright fringe. The overlays carry a halo in the opposite colour, so the readout and the scale bar stay legible on a white slide and on a black slide (AR-56).
- **UX-EX-04** File name: `zfatlas_<time>_<view>_<selection-or-all>_<scale>x.png`, for example `zfatlas_24hpf_lateral_heart_2x.png`. Time uses the readout format without spaces.
- **UX-EX-05** "Copy image" places the PNG on the clipboard where the browser allows `image/png`; otherwise the button is hidden. SVG overlay export and video export are later features (UX-EX-06).

#### 5.11.2 Share dialog

- **UI-34** The share dialog opens from the share button or `Shift+C`. It shows the full URL in a read-only field, a "Copy link" button, and a "Copy link to structure" button when a selection exists. Two checkboxes, both on by default: "Include camera" (free camera as `cam`; off gives the nearest preset as `v`) and "Include theme". A list under the field names what the link restores: time, selection, view, camera, theme, hidden systems, x-ray, dissect, section, units, snap, temperature, sex, strip pin and projector scale.
- **UX-EX-08** The address bar updates with `history.replaceState` at most every 300 ms during interaction and once on release. "Copy link" shows a 2 s toast "Link copied" with the readout text.
- **UX-EX-09** "Copy link to structure" adds `sel`. If the structure is absent at `t`, it also sets `t` to the UI-20 target (`visibleFromHpf + fadeInHpf`) so the link opens on a fully visible structure.
- **UX-US-03** The full view state round-trips through the URL (D1). `src/core/urlState.ts` parses and serialises the parameters below. Unknown parameters are ignored (QP-14). A parameter that fails to parse falls back to its default and raises the UX-ST-09 toast (AR-46).

| Param | Meaning | Example |
|---|---|---|
| `t` | time in hpf, float, clamped to 0 to 4320 | `t=24` |
| `sel` | selected ZFA ids without the prefix, comma separated | `sel=0000114,0000123` |
| `term` | selected ZFA vocabulary term (D17, section 5.14); `sel` holds its stand-in record | `term=0000046` |
| `v` | view preset `lat`, `dor`, `ven`, `ant`, `pos`, `tq` | `v=lat` |
| `cam` | camera position and target, six floats in millimetres | `cam=1.2,0.8,3.1,0,0,0` |
| `hide` | hidden system ids (D5) or ZFA numbers of hidden structures | `hide=integument_pigment,early_embryo` |
| `xr` | x-ray 0 to 100; default 60 | `xr=80` |
| `x` | dissect 0 to 100; default 0 (D17, section 5.13) | `x=60` |
| `sec` | section plane and position | `sec=sag:0.1` |
| `theme` | `dark` or `light` | `theme=light` |
| `u` | units `hpf`, `dpf`, `auto` | `u=dpf` |
| `temp` | incubation temperature in C | `temp=25` |
| `sex` | gonad handoff target, `f` or `m` | `sex=m` |
| `iso`, `snap`, `labels`, `present`, `embed`, `pin` | flags; `1` means on | `snap=1&present=1&pin=1` |
| `ps` | projector scale `1`, `1.5`, `2` (UI-36) | `ps=1.5` |
| `kit` | slide kit as base64url or a `localStorage` kit id (AR-45) | |

- **UI-35** The full parameter set with types and defaults is the `UrlState` schema of section 2 (AR-45). Research 07 also names a `pal` parameter; it is not in version 1 because D10 requires one hue per system (UI-32).

### 5.12 Slide kit

A slide kit is an ordered list of bookmarks that a presenter steps through with the arrow keys in presentation mode (AR-60; research 07 UX-EX-12 to UX-EX-16). The store fields `kit` and the `Bookmark` type are in section 2.4; the URL parameter is `kit` (AR-45).

- **UI-38** Kit sheet. `KitSheet.tsx` is a 320 px sheet (a non-modal popover in presentation mode) that lists the bookmarks of the loaded kit with a 96 px thumbnail, the name, the time and the selection. The thumbnail is rendered at capture time through the export pipeline at 96 px and stored as a data URL in `localStorage` with the kit; the `kit` URL form carries no thumbnails. Rows reorder by drag and by `Alt+Arrow`, rename inline, and delete with a confirm. `Ctrl+B` adds the current view as a bookmark (UI-33); the sheet has an "Add current view" button for the mouse. Buttons: "Export JSON", "Export ZIP" (one PNG per bookmark at 2x with the export settings, written by a local stored-ZIP encoder of about 60 lines under `src/viewer/export/zip.ts`; no dependency), "Import JSON", "Copy kit link". A kit above 2 KB as base64url falls back to "Download kit" instead of a link (research 07 UX-EX-15; the 2 KB threshold is a decision, not a measured limit).
- **UI-39** Kit markers. `KitMarkers.tsx` draws one 8 px diamond in `--focus` above the track per bookmark, at `hpfToTrack(bookmark.t)`; the current bookmark's diamond is filled and the others are outlined. Hovering a marker shows the bookmark name; clicking it steps to the bookmark with the AR-60 motion. In presentation mode the markers show whenever the strip shows.
- **UI-45** Starter kits. Two kits ship in `src/data/kits.json` and appear in the kit sheet under "Starter kits": "Embryogenesis in 8 views" (1-cell 0 hpf, Sphere 4, Shield 6, Bud 10, 10 somites 14, Prim-5 24, Long-pec 48, Protruding-mouth 72; lateral preset) and "Organ origins" (heart at 22 hpf, pronephros at 14 hpf, liver at 30 hpf, swim bladder at 120 hpf; each with the structure selected and isolate on). The times are the UI-20 targets of the named structures where a structure is selected. Loading a starter kit copies it into the user's kits, so an edit never changes the shipped file.
- **UI-46** Smoke assertions (WP-I5): load `?present=1&kit=<starter 1>`, press `ArrowRight` three times, assert `t` equals the fourth bookmark's time and the strip shows four markers with the fourth filled; press `Ctrl+B`, assert the kit has nine bookmarks; export JSON, re-import it, assert deep equality.

### 5.13 Dissect slider

D17 asks for a slider that separates the structures, the way a human-anatomy "explode" control
does, without moving the body model itself. `src/core/dissect.ts` holds the layout math;
`Structures.tsx`, `Body.tsx` and `Labels.tsx` apply it in the viewer. This section states those
values as the requirements they now meet.

- **UI-60** Store, URL and control. The store field `dissect` runs 0 to 100 and defaults to 0
  (`DEFAULT_DISSECT`). `setDissect` rounds and clamps its argument; `stepDissect(dir)` moves to
  the next of four stops, 0, 30, 60, 100 (`DISSECT_STEPS`), wrapping past either end. The URL
  parameter is `x`, an integer 0 to 100, default 0, next to `xr` in the `UrlState` schema
  (section 2.6). `R` and `Shift+R` (UX-IN-15) reset `dissect` to 0 with the rest of the view. The
  `D` key steps it forward and `Shift+D` steps it back. The drawn value follows the target
  through a critically damped filter with a 200 ms time constant (`dampTowards`), the same
  pattern `followGrowth` uses (UX-IN-12). `DissectSlider.tsx` puts a "Dissect" slider in the
  systems rail, 0 to 100 in steps of 5 to match the x-ray control (UX-IN-17), with a reset button
  beside it. The button names no shortcut, because `D` steps through the four stops rather than
  returning to 0.
- **UI-61** Explode phase, 0 to 60. Below this range a structure keeps its modeled place. Above
  it, every structure carries an offset added to its placement, drawn from its system's
  direction. `systems.json` gives each system a `dissectDirection` pair, `[posterior, dorsal]` in
  the D4 lateral plane; a structure record may override its system's pair. The offset scales with
  `min(dissect, 60) / 60`, with the direction pair's own length (short for the axial system, so
  the axis stays near the spine), and with two scale factors that favour the dorsal-ventral axis
  over the anterior-posterior one (`SPREAD_BODY_LENGTHS` 0.9 times `SPREAD_FRAME_SCALE`
  [0.22, 0.30], so 0.198 of the body length along the body and 0.270 across it), because the fish
  is long and thin. The camera refits to the dissect box (`dissectFit.ts`), so the exploded fish
  does not have to stay inside the frame the body was fitted to.
  Systems whose directions lie inside `LANE_ANGLE_DEG` (45 degrees) of one another take
  successive lanes, and each lane sits `LANE_RADIUS_STEP` (0.55) further out along the same
  bearing (`spreadLanes`), so the five ventral systems stack outward instead of on top of one
  another and every system keeps the direction the data gave it. Inside a system the structures
  take the cells of a centred square lattice of pitch `STAGGER_PITCH` (`staggerAt`), which is
  deterministic: two siblings are never closer than one pitch. Each offset attaches to a
  `dissect:<id>` group per structure (D3: a transform may place unchanged geometry); the body
  model itself never moves. A structure the rail has hidden keeps its place in the body and frees
  its lattice cell and its grid cell.
- **UI-62** Inventory phase, 60 to 100. Every present structure glides from its phase 1 offset
  into one cell of a shelf-packed grid beside the body, on a `smoothstep` blend (`inventoryMix`):
  rows in system order (D5), items left to right by id
  within a row, a cell sized to the structure's own world box in the lateral plane plus a fixed
  gap (0.03 body lengths) and a margin off the body's posterior end (0.12 body lengths), the
  packer aiming for a 2.8-to-1 width-to-height block, which packs to about 1.5 to 1 in practice
  and so matches the free rectangle of the camera fit. The box, not the bounding sphere: the
  notochord is half a body long and a tenth of a body thick, and a square cell around its sphere
  would leave the grid mostly empty and every part in it too small to read. The offset moves the
  box centre onto the cell centre. The skin fades out across the whole of phase 1
  (`skinDissectFade`: opacity 1 at `dissect` 0, 0 at `dissect` 60), so the body is fully open
  before the inventory phase starts. The yolk and the chorion are body-driven and never leave the
  body frame (D3); they keep a quarter of their opacity at `dissect` 60 and above
  (`bodyPartDissectFade`), a visible anchor for where the fish was.
- **UI-63** Labels and picking. Above `dissect` 60 the label budget of AR-37 raises from 8 to 24
  (`INVENTORY_LABEL_BUDGET` in `Labels.tsx`), and labels turn on whatever the `labels` setting
  says, because the inventory view is a catalogue and needs its names. A label's leader line follows its
  structure's dissect offset, so a chip stays attached as its structure moves out. Picking,
  selection and the info card read the same handle at every `dissect` value: the slider changes a
  mesh's position and its label's anchor, never its material, its geometry or its `pickable`
  flag, so a click in the inventory grid selects the structure exactly as a click on the body
  does.
- **UI-64** What ships. `src/core/dissect.ts` computes the layout; `Structures.tsx`, `Body.tsx`
  and `Labels.tsx` draw it; `src/viewer/dissectFit.ts` and the camera rig frame it (UI-65);
  `DissectSlider.tsx` sets it by hand (UI-60); the share dialog's restore list below and the
  README control table name the `x` parameter and the `D` key. One gap remains: a bookmark
  (UI-33) does not carry `dissect`, so stepping through a slide kit leaves the slider where the
  viewer last set it.
- **UI-65** Camera. The fit of AR-41 frames the body's own points, which say nothing about where
  the slider has moved a structure: at `dissect` 100 the inventory grid is several body lengths
  wide and would sit entirely off screen. `src/viewer/dissectFit.ts` walks the offsets the viewer
  drew last and returns the box they fill, as the union of the world boxes of the builds rather
  than of their bounding spheres, so a long thin tube does not pull the frame open by its own
  length. The rig adds the eight corners of that box to the fit points, and refits whenever the
  box changes by more than a ten-thousandth of its own size. The refit runs whatever
  `followGrowth` says, because the grid is invisible without it. The zoom-out limit and the far
  plane follow the fit distance instead of the fixed 12 body lengths, and the pan limit of
  UX-IN-08 grows by the largest displacement drawn, so the user can orbit the grid by hand.
### 5.14 Vocabulary search

D17 asks the search to cover every ZFA term, not only the modeled records, so a person can find
"midbrain-hindbrain boundary" before an anatomy package ever draws it. `scripts/build-vocabulary.ts`
builds the index, `src/core/vocabularySchema.ts` and `src/core/vocabulary.ts` read it, and
`Search.tsx` and `InfoCard.tsx` show it.

- **UI-65** Build-time index. `scripts/build-vocabulary.ts` reads `anatomy_item.txt`,
  `anatomy_synonyms.txt`, `anatomy_relationship.txt`, `stage_ontology.txt` and `zfa.obo`, drops
  every term `zfa.obo` marks obsolete, and writes `src/data/vocabulary.json`: one row per
  surviving term with its id, name, synonyms, the first sentence of its definition (240
  characters at most), its ZFIN stage window in hpf, its `part of` and `is_a` parents, and its
  stand-in (UI-67). 3113 terms on 2026-09-06 (D17); re-run the script and re-count
  `data/zfin/anatomy_item.txt` at each ZFIN release, because the count moves with the snapshot.
  The file uses one-letter keys and ids with no `ZFA:` prefix to hold its size down; at 768.9 kB
  raw it still compresses to 140.4 kB gzip, so `vite.config.ts` gives it its own chunk group,
  `vocabulary`, above `atlas-data` in priority, so its bytes need not join the record chunk that
  ships on every load. `src/data/index.ts` exports `loadVocabulary()`, which reaches the file
  through a dynamic `import('./vocabulary.json')`, and `vocabularyStore.ts` calls it once, on the
  first search keystroke (`Search.tsx`) or the first render of a selected term with no record
  (`InfoCard.tsx`), and caches the result for the rest of the session. The chunk is correctly lazy
  as of this measurement (docs/perf/README.md); that file's own static import of the rest of
  `data/index.ts` is a separate, live bug that pulls `atlas-data` back into the first download,
  and docs/perf/README.md states it and its fix.
- **UI-66** Term shape. `src/core/vocabularySchema.ts` expands the short keys into a
  `VocabularyTerm`: `id`, `name`, `synonyms`, `definition`, `startHpf`, `endHpf`, `partOf`, `isA`,
  `standIn` and `standInPath` (UI-67), and `kind`, `'cell'` for an `is_a` descendant of the cell
  root ZFA:0009000 and `'structure'` for every other term. `src/core/vocabulary.ts` indexes the
  terms by id (`Vocabulary.byId`) and derives `standInOf()`, which reports one of three states:
  `'modeled'` when the term is itself a drawn record, `'partOf'` with a `recordId` and the
  ancestor names from the outermost down when a stand-in exists, or `'none'` when nothing in the
  atlas models it yet.
- **UI-67** Stand-in resolution. A term that already has geometry, or that an alias chain names
  (section 5.4.3), stands in for itself. Otherwise the build script walks the term's parents
  outward in three widening stages: `part of` alone; `part of` with `is_a`; then all three
  relations with `develops from` added, so a term with no anatomical parent still resolves
  through its developmental origin. Each stage runs breadth first and stops at the first modeled
  ancestor it reaches, favouring one with its own geometry over a geometry-less group node found
  at the same remove. `standInPath` carries the chain from the term to that ancestor, nearest
  first; the card reverses it to read outermost first, so "modelled as part of: brain > midbrain"
  reads the way a reader expects.
- **UI-68** Search and the info card. `searchIndex.ts` ranks a `VocabIndex` hit (`buildVocabIndex`,
  `searchVocabulary`) by exact name, then a synonym, then the id digits; there is no fuzzy pass
  over 3113 terms. `searchItems()` lists record hits first (section 5.5's ranking, unchanged),
  then the vocabulary hits, so an unmodeled term never crowds out a modeled one. `Search.tsx`
  shows each term row with a hollow swatch, its name, its stage window and a badge:
  `badgeText()` returns "modeled", `"part of <name>"`, or "no model". Selecting a term opens the
  info card's term view (`TermCard.tsx`): the name, the id with a copy button, the "modeled or
  part of" badge, a "cell type" or "structure" chip, the stand-in sentence (or "No record of this
  atlas contains this term yet"), the ZFIN stage window, the definition (or "ZFA states no
  definition for this term"), a "Jump to first appearance of `<stand-in name>`" button when a
  stand-in exists, Copy link, Open in ZFIN, a collapsed synonym list, and, when a stand-in exists,
  a "Highlighted: `<stand-in name>`" link that selects it. Shift+Enter on a term row in the search
  list jumps straight to the stand-in without opening the card first.

## 6. Testing, tooling, deployment and implementation plan

This section defines the tool chain, the test plan, the data validation script, and the browser test plan. It also defines the performance procedure, continuous integration (CI), the release checklist, and the work packages. Time values are in hours post fertilization (hpf) or days post fertilization (dpf). Body sizes after 72 hpf use standard length (SL). Ontology ids come from the Zebrafish Anatomy Ontology (ZFA) and the Zebrafish Stage Ontology (ZFS), both published by the Zebrafish Information Network (ZFIN). Requirement ids carry the prefix QP.

### 6.1 Tool chain and npm scripts

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
| `validate` | `node scripts/validate-data.ts` | data rules of section 3.8 |
| `screenshots` | `node scripts/screenshot.ts` | 36 PNG files under `docs/screenshots/` |
| `attribution` | `node scripts/build-attribution.ts` | writes `public/ATTRIBUTION.md` |

- **QP-01** A clean clone passes `npm ci`, `npm run check`, `npm run lint`, `npm test`, `npm run validate`, and `npm run build` in that order with exit code 0. These are the D13 gates.
- **QP-02** `package.json` pins every D2 package to an exact version. `npm ci` is the only install command in CI and in the README.
- **QP-03** Files under `scripts/`, `src/core/` and `src/data/` use only erasable TypeScript syntax, because Node 22 strips types and does not compile enums or namespaces, and `scripts/validate-data.ts` imports `src/core` and `src/data` directly. `package.json` declares `"type": "module"`. Every relative import in those three folders carries its `.ts` or `.json` extension, and every JSON import carries `with { type: 'json' }`; `tsconfig.json` sets `resolveJsonModule` and `allowImportingTsExtensions`. Scripts read the ZFIN snapshot and any file that they select at runtime through `fs`. The unit test of QP-17 enforces the extension rule and `npm run validate` is the import smoke of QP-17.
- **QP-07** `vitest.config.ts` sets `passWithNoTests: true`, and WP-01 owns one trivial test (`tests/unit/shell.test.ts`), so `npm test` exits 0 on the empty app shell.
- **QP-04** `src/core` imports nothing from `react`, `@react-three/*`, `three`, or the DOM. An ESLint rule enforces this, with one override for `src/core/primitives/toBufferGeometry.ts` (AR-04).
- **QP-05** The `.gitignore` in the repository ignores `screenshots/` at any depth, which hides `docs/screenshots/`. Replace that line with `/test-results/` and `/playwright-report/` before the first screenshot commit.

#### 6.1.1 TypeScript configuration

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler",
    "jsx": "react-jsx", "strict": true, "noUncheckedIndexedAccess": true,
    "erasableSyntaxOnly": true, "verbatimModuleSyntax": true, "resolveJsonModule": true,
    "allowImportingTsExtensions": true, "noEmit": true, "skipLibCheck": true,
    "types": ["vite/client"], "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "scripts", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

#### 6.1.2 ESLint configuration outline

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
      'no-restricted-imports': ['error', { patterns: ['react', 'react-dom', '@react-three/*', 'three', 'three/*'] }] } },
  { files: ['src/core/primitives/toBufferGeometry.ts'], rules: { 'no-restricted-imports': 'off' } },
)
```

`@react-three/eslint-plugin` 0.1.2 is a devDependency (section 2.1); the rule names `no-clone-in-loop` and `no-new-in-loop` are unverified against it (research 06, section 7). WP-01 confirms them against the installed package or drops the two rules. The extension rule of QP-03 is a unit test (QP-17), not an ESLint plugin, so no further plugin is needed.

#### 6.1.3 Vite configuration

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

### 6.2 Unit test plan for src/core

Vitest 5 runs these tests in Node without a browser. Each file below tests one module. The primitives return plain typed arrays `GeometryOut { positions, normals, uvs, indices, bounds }`, so no WebGL context is needed.

| Test file | Module | Requirement |
|---|---|---|
| `tests/unit/timeAxis.test.ts` | `src/core/timeAxis.ts` | QP-10 |
| `tests/unit/bodyModel.test.ts` | `src/core/bodyModel.ts` | QP-11 |
| `tests/unit/primitives.test.ts` | `src/core/primitives/*.ts` | QP-12 |
| `tests/unit/interpolation.test.ts` | `src/core/interpolation.ts` | QP-13 |
| `tests/unit/urlState.test.ts` | `src/core/urlState.ts` | QP-14 |
| `tests/unit/schema.test.ts` | `src/core/schema.ts` and `src/data/*.json` | QP-15 |
| `tests/unit/paramUnits.test.ts` | `src/core/paramUnits.ts` against every schema leaf | QP-16 |
| `tests/unit/imports.test.ts` | every file under `src/core`, `src/data`, `scripts` | QP-17 |
| `tests/unit/rebuildQueue.test.ts` | `src/core/rebuildQueue.ts` | QP-18 |

#### 6.2.1 Time axis

- **QP-10** `hpfToTrack` and `trackToHpf` (UI-03) form a bijection on `[0, 4320]`. For every integer hpf from 0 to 4320, `trackToHpf(hpfToTrack(h))` equals `h` within 1e-9. `hpfToTrack` is strictly increasing over the same samples. The D7 anchors map exactly: 0 to 0.00, 10 to 0.18, 24 to 0.30, 72 to 0.52, 168 to 0.62, 720 to 0.78, 2160 to 0.92, 4320 to 1.00. Segment shares read from `stages.json` sum to 1 (100 percent). The tick filter drops a tick closer than 8 px to the last drawn tick at track widths 358, 700, 1200, and 1920 px (D7). Playback at 1x moves the thumb by one track width in 60 s (D7); 30 s from 0 hpf lands at fraction 0.50, which the D7 table maps to 67.64 hpf.

#### 6.2.2 Body model

- **QP-11** The test samples `bodyModel(t)` at every integer hpf from 0 to 4320 (4321 samples). It also samples at 0.1 hpf steps around each regime boundary. The boundaries are 4.66, 10, 19, and 72 hpf (D3); each window spans 1 hpf on each side. No field of any sample is `NaN` or infinite. `bodyLengthMm` is non-decreasing for every pair of consecutive samples after 10 hpf. `bodyLengthMm` equals `growth.lengthMm` of `stages.json` at every table hpf within 1e-6. Across each boundary sweep, no spine station moves more than 0.07 mm per 0.1 hpf step. The spec's own table sets the bound: the tail tip moves 0.554 mm between 18 and 19 hpf (section 4.3.3), which is 0.055 mm per 0.1 h under the linear interpolation of BG-28; an earlier limit of 0.05 failed on that row. Spot values: yolk radius 0.35 mm at 0 hpf (research 05, section 16.2); epiboly 0.5 at 6 hpf and 1.0 at 10 hpf (D3); chorion present at 71 hpf and absent at 73 hpf (D8); yolk `null` after 168 hpf (D3); head-trunk angle 35 degrees at 60 hpf (D8) and 25 degrees at 72 hpf (D3); `slMm` null at 71 hpf and 3.25 at 72 hpf (BG-28). Somite counts at the somite-stage starts equal the lower bound of the ZFS stage name: 1 at 10.33, 5 at 11.66, 10 at 14, 14 at 16, 20 at 19, 26 at 22 hpf, plus 18 at 18 hpf and 30 at 24 hpf (BG-58). Every station holds unit `t`, `n`, and `b` vectors (BG-09), mutually orthogonal within 1e-6. Frame coherence (BG-04): `n[i] . n[i-1] > 0.99` along the spine at every hour; `n(u, t) . n(u, t + 1) > 0.99` for every station and every hour; `n(0.4, t) . (0, 1, 0) > 0.2` at every hour.

#### 6.2.3 Primitives

- **QP-12** For every primitive at both tessellation levels: the vertex count equals the count stated in the primitive's doc comment; the index count is a multiple of 3; every position and normal is finite; every normal has unit length within 1e-3 (research 06, section 7); for the convex kinds every normal points outward (`dot(normal, position - centre) > 0`), including the pole rows of a superellipsoid at `e1 = e2 = 2.0` and the round caps of a tube; the bounding box matches the analytic box within 1e-6 (an ellipsoid with radii `a, b, c` spans `[-a, a]` on x). Vertex count depends only on the tessellation level, except for `segmentArray`, where it scales with `count`. A `sheet` has two faces plus a rim, so every triangle has a defined winding and no zero-area triangle exists; the median fin fold of BG-39 at 24 and 48 hpf has no triangle with an inverted winding (BG-59). A mirrored copy has every triangle wound in the reverse order of the original (BG-29). For a tube along a bent spline the normal of the inner side of the bend points away from the axis at `r x kappa = 0.85` (BG-31). After `writeInto` runs twice on one geometry with two different frames, `geometry.boundingSphere.center` equals the analytic centre of the second build within 1e-6 and the radius matches within 1e-6 (AR-72); for a local-frame kind both are unchanged between the two writes.

#### 6.2.4 Interpolation

- **QP-13** `bracket(keyframes, t)` returns the pair `(i, i + 1)` with `k[i].hpf <= t < k[i + 1].hpf`. Before the first keyframe it returns `(0, 0)`; after the last it returns `(n - 1, n - 1)`. The smoothstep weight is 0 at `k[i].hpf`, 1 at `k[i + 1].hpf`, and 0.5 at the midpoint. Its finite-difference slope at both endpoints is below 1e-6. The `count` type of BG-42 draws `floor(c)` instances at full scale and one more at scale `c - floor(c)`. Between counts 5 and 9, weight 0.4 gives `c = 6.6`: 6 full instances and one at scale 0.6. Weight 0.5 gives 7 full instances. A non-decreasing count series never decreases between keyframes. The notochord example of section 4.10 at `t = 60` (bracketed by 48 hpf without `sizeRefSl` and 72 hpf with `sizeRefSl` 3.25) gives finite radii equal to the plain lerp of the two keyframes (BG-43). A heart keyframe that lists `segments.atrium.rMm` alone inherits `segments.atrium.s0` and every other leaf (BG-41). A keyframe that lists an `outlineMm` of a different length fails E035 in the schema test.

#### 6.2.5 URL state

- **QP-14** A seeded generator draws 200 states over the parameters defined in section 2 (AR-45), quantized to the precision that `serializeUrl` writes (`t` to 2 decimals, `cam` to 3) and with `theme` set, so that the round trip is exact. For each state, `parseUrl(serializeUrl(state)).state` deep-equals `state`, and for each serialized string `s`, `serializeUrl(parseUrl(s).state)` equals `s` (the canonical form). The default state serializes to an empty string. Unknown parameters are ignored. A `t` outside `[0, 4320]` is clamped and adds a warning to the `parseUrl` result (AR-46). The UI turns the warning into the toast of research 07, UX-ST-09. An unknown ZFA id in the selection is dropped and reported the same way. The serialized string contains no `ZFA:` prefix and no whitespace.

#### 6.2.6 Schema on real data

- **QP-15** The test imports the five files in `src/data` and parses each with its zod schema from `src/core/schema.ts`. Every parse succeeds. Every `system` value of a structure is one of the 15 ids in `systems.json` (D5). Every structure id is unique. The JSON Schema files under `docs/schema/` equal `z.toJSONSchema()` of the current zod schemas, so the committed schema never drifts. Spot values: the notochord ZFA:0000135 has `fadeOutHpf` 0 and `presenceAt` gives opacity 1 at 4320 hpf (DM-36); the chorion has `fadeOutHpf` 24 (D8).
- **QP-16** The test walks every leaf of every schema in `src/core/schema.ts` (through `z.toJSONSchema()`), and for every numeric leaf asserts that `paramUnits.ts` classifies its name as length (`Mm`), angle (`Deg`), count (`count*`) or dimensionless (the DM-35 list). A numeric leaf with no class fails the test with its path.
- **QP-17** The test reads every `.ts` file under `src/core`, `src/data` and `scripts` and asserts that every relative import specifier ends in `.ts` or `.json` and that every `.json` import carries `with { type: 'json' }` (QP-03). `npm run validate` doubles as the import smoke: it imports `src/core/bodyModel.ts`, `src/core/primitives/buildStructure.ts`, `src/core/schema.ts` and `src/data/index.ts` under Node's type stripping, so a bare import or a missing attribute fails the CI `validate` step.
- **QP-18** `rebuildQueue`: `replace(jobs)` keeps the age of a job whose id was already queued and gives a new job age 0; `drain(budget, now)` serves every job with age 4 or more before any younger job, oldest first (AR-12); under a simulated playback that replaces the queue every frame with 150 jobs and a budget that serves 40, every job is served at least once in any window of 5 frames.

### 6.3 Data validation script

`scripts/validate-data.ts` implements the D13 checks against the schemas of section 3. The rules, their levels and their messages are the numbered list of section 3.8 (E001 to E036 and W001 to W009). It reads a committed ZFIN snapshot under `docs/research/zfin/` (`anatomy_item.txt`, 3,113 rows; `anatomy_relationship.txt`, 5,992 rows; `stage_ontology.txt`, 45 rows including the header and the `ZFS:0000000` Unknown row; `zfa.obo` for the period term ids of E003; downloaded 2026-09-06; DM-29). The snapshot is CC BY 4.0 and is credited in `public/ATTRIBUTION.md` (D14). The script creates the body model with `createBodyModel` from the files it read through `fs` (BG-10) and builds every keyframe of every record for E029, E035, E036 and W007.

- **QP-20** Output format: one line per finding in the pattern `<code> <file>:<id>: <text>` (section 3.8), then the summary line of DM-28. The exit code is 1 when any error exists and 0 otherwise. `--json <path>` also writes the findings as an array of `{ level, code, file, id, message }`. `--strict` promotes warnings to errors. `--emit-schema` writes the JSON Schema files under `docs/schema/`.

```
E002 structures:ZFA:0009999: not in anatomy_item.txt (ZFA release 2026-07-16)
W005 structures:ZFA:0000604: size row at 24 hpf lies outside [96, 4320]
validate: 236 records, 1 errors, 1 warnings
```

The expected structure count is 236 (DM-25). The five drafts hold 220 records and share 7 duplicate ids (research 03, section 2.2). The merge folds 4 heart aliases and 2 eye aliases into their records and adds 29 group nodes.

### 6.4 Playwright plan

- **QP-30** Playwright 1.63 runs the local system Chrome with `channel: 'chrome'` and the bundled Chromium in CI. The launch flags `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`, and `--ignore-gpu-blocklist` give WebGL on a machine without a graphics processing unit (GPU) (research 06, section 7). Three projects run: `desktop` at 1440 by 900 CSS px (the M3 reference of section 5.1.2), `presentation` at 1920 by 1080 (the M1 output, QP-37) and `phone` at 390 by 844, all at device scale factor 1.
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
    { name: 'desktop', testIgnore: /(presentation|phone)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: ci ? undefined : 'chrome',
        viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, launchOptions: { args: gl } } },
    { name: 'presentation', testMatch: /presentation\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: ci ? undefined : 'chrome',
        viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, launchOptions: { args: gl } } },
    { name: 'phone', testMatch: /phone\.spec\.ts/,
      use: { ...devices['Pixel 7'], channel: ci ? undefined : 'chrome',
        viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, launchOptions: { args: gl } } },
  ],
})
```

#### 6.4.1 Screenshots of the headline stages

- **QP-32** `scripts/screenshot.ts` opens `/?t=<hpf>&v=<view>&embed=1&theme=dark` for the 18 headline stages of D7 with `v=lat` and `v=dor`. It saves `docs/screenshots/<hpf>-lateral.png` and `docs/screenshots/<hpf>-dorsal.png`. The hpf is the shortest decimal string of the stage start: `0`, `2.5`, `4`, `6`, `10`, `16`, `24`, `42`, `48`, `72`, `120`, `168`, `336`, `504`, `720`, `1080`, `2160`, `4320` (ZFS starts from `stage_ontology.txt`). Embed mode hides the top bar and the rail (research 07, UX-EX-10). The script requires a prior `npm run build` and starts its own preview server. A person reviews the 36 files before a phase is called done (D13).
- **QP-33** `tests/e2e/screenshots.spec.ts` captures the same 36 views through the test runner and applies the non-blank check. It does not compare pixels against a baseline in version 1, because SwiftShader and a laptop GPU produce different pixels (research 06, section 7).
- **QP-38** For every `v=dor` view the screenshot test reads `window.__atlasDebug.project(u, v, w)` (a read-only hook in every build next to `__atlasPerf`, QP-40) for the snout (`u = 0`), the notochord end (`u = 1`) and the two flanks at `u = 0.4` (`w = -1` and `w = +1`). It asserts that the snout projects at least 100 px left of the notochord end, that the segment between the two flanks is vertical on screen within 1 degree, and that the left flank projects below the right flank (AR-40). The same check with the roles of `v` and `w` exchanged runs for `v=lat`: the dorsal surface projects above the ventral surface within 1 degree of vertical.
- **QP-37** `tests/e2e/presentation.spec.ts` runs on the presentation project. It opens `/?present=1&t=<hpf>&sel=0000114&theme=dark` for the 18 headline stages of D7 and saves `docs/screenshots/present-<hpf>.png` for human review. On the 24 hpf page it asserts: no top bar, rail or docked info card is in the DOM; the readout time, stage and length have computed font sizes of 48, 40 and 32 px; the strip is visible 4 s after `Space` (playback runs) and hidden 4 s after a second `Space`; `Shift+P` keeps it visible; a right-click dispatches `contextmenu` with `defaultPrevented` true and opens no menu; `PageDown` moves `t` to 30 (Prim-15 start) and `Shift+PageDown` to 48 (Hatching start); `Enter` calls `requestFullscreen` (stubbed in the test); the floating info card is 320 px wide and its definition row is collapsed.

#### 6.4.2 Non-blank canvas check

- **QP-34** The check decodes the PNG of the canvas element and computes luminance per pixel. It passes when two conditions hold. The luminance standard deviation exceeds 8 on the 0 to 255 scale. More than 3 percent of pixels differ from the most frequent colour by more than 16 levels. These starting values live in one constant in `scripts/screenshot.ts`; WP-H1 calibrates them against the first accepted screenshot set.

#### 6.4.3 Smoke test of interactions

- **QP-35** `tests/e2e/smoke.spec.ts` runs on the desktop project and asserts, in order:

| Step | Action | Assertion |
|---|---|---|
| 1 | open `/?t=24&v=lat` | readout shows `24 hpf` and `Prim-5`; canvas non-blank |
| 2 | click the projected centre of the eye (`__atlasDebug.project` of the eye placement) | info card shows `ZFA:0000107`; URL contains `sel=0000107`; a click on the skin never selects, because the skin has `pickable: false` (AR-34) |
| 3 | press `/`, type `heart`, press `Enter` | card header reads `heart`; URL contains `sel=0000114` (D9) |
| 4 | press `ArrowRight`, then `ArrowLeft` | `t` becomes 30 (Prim-15 start), then 24 |
| 5 | press `Home`, then `End` | `t` becomes 0, then 2160 (research 07, section 3.10) |
| 6 | press `Space`, wait 500 ms, press `Space` | `t` increased and then stays constant |
| 7 | press `2` | URL contains `v=dor` |
| 8 | open `/?t=10&sel=0000114`, click "Jump to first appearance" | `t` equals the heart record's `visibleFromHpf + fadeInHpf` (snap is off); the heart mesh has opacity 1 and is on layer 1 (UI-20, AR-34) |
| 9 | open the export dialog, choose 2x, confirm | the downloaded PNG measures twice the canvas CSS size in each dimension (AR-52); the export at 1x has a centre pixel within 2 of 255 per channel of the canvas pixel (QP-39) |
| 10 | press `Escape` twice | selection cleared; URL has no `sel=` |
| 11 | open `/?t=24&sel=0000114`, press `ArrowRight` three times | after each step the bounding box of the pixels in `--focus` lies within 4 px of the projected bounding box of the heart mesh (AR-35) |
| 12 | open `/?t=72&sec=sag:0`, click the projected centre of the brain | the info card id belongs to the nervous system (AR-34 section filter) |
| 13 | open `/?t=24` at 1440 by 900 | the tree shows at least eight rows below the rail header (UI-43) |
| 14 | open `/?t=24&theme=light` in a context with `colorScheme: 'dark'` | the page renders the light theme (OV-37, AR-49) |

#### 6.4.4 Phone viewport check

- **QP-36** `tests/e2e/phone.spec.ts` runs on the phone project at 390 by 844 CSS px (research 07, section 1, moment M2). It asserts: `document.scrollingElement.scrollWidth` is at most 390 and `scrollHeight` is at most `innerHeight` (UI-44); the Layers button and the compact timeline bar are visible; the canvas is non-blank; a tap on the projected eye opens the info card at its 96 px peek height (research 07, section 2.4); with the Layers sheet open the timeline bar is still visible; every focusable control has a bounding box of at least 44 by 44 px (research 07, UX-US-01).
- **QP-39** Export pixels. In the smoke test, an opaque 1x export of `/?t=24` is compared to a `canvas.toDataURL` capture taken in the same frame with `preserveDrawingBuffer` forced on for the test: the centre pixel and four quarter-point pixels match within 2 of 255 per channel (AR-51). A transparent export of the same view is composited in the test onto white and onto black; at a skin-edge pixel the composite matches an opaque export rendered with that background colour within 3 of 255 per channel (AR-55). The readout text in the transparent export has a contrast of at least 4.5:1 against both white and black after compositing (AR-56).

### 6.5 Performance measurement procedure

Section 2 owns the budget table. The rows below repeat its values with the measurement method.

| Metric | Budget | How measured |
|---|---|---|
| Frame time during playback | 16.7 ms: 8 ms rebuild (D3) plus 6 ms render plus headroom | Chrome Performance panel, frames track, p95 over a 60 s playback at 1x |
| Draw calls per frame | 200 | `renderer.info.render.calls` read through `window.__atlasPerf` |
| React commits per second during playback | 5 | the commit counter of AR-65 through `window.__atlasPerf.commitsPerSecond` |
| Triangles on screen | 200,000 at final tessellation; 60,000 interactive | `renderer.info.render.triangles` |
| Final tessellation rebuild | 8 ms per slice (D3) | `performance.measure('atlas:rebuild')` entries |
| Time to first frame | 2 s (research 07, UX-US-05) | `performance.mark('atlas:first-frame')` minus the `timeOrigin` of the page, network throttled to 10 Mbit/s |
| Idle GPU use | 0 | frame counter constant while paused for 10 s |

- **QP-40** The viewer exposes `window.__atlasPerf` in every build: a ring buffer of the last 600 frame times, the current draw call and triangle counts, and the rebuild measures. The object is read-only and costs nothing when no one reads it.
- **QP-41** Run the procedure on the presenter's laptop, on an integrated-GPU laptop, and on one phone. Build and serve with `npm run preview`. Open `/?t=24` and the Chrome Performance panel. Record a 10 s scrub from 0 to 4320 hpf and a 60 s playback at 1x. Read the p95 frame time from the frames track and the counters from `window.__atlasPerf`. Record every value with the machine name, GPU, Chrome version, and date in `docs/perf/<date>-<machine>.md`.
- **QP-42** `tests/e2e/perf.spec.ts` runs only when `PERF=1` is set. It scrubs for 10 s and asserts p95 frame time under 20 ms (research 06, section 8). SwiftShader numbers are not representative, so CI never runs it.
- **QP-43** Follow growth. In the desktop project, with `followGrowth` on, the test plays 60 s at 1x and samples the projected snout-to-notochord-end length through `__atlasDebug.project` every 500 ms. It asserts that the relative change per second stays at or below 2 percent after the first second (AR-41, UX-IN-12), and that the readout stage index changes 42 times between `Home` and the axis end.

### 6.6 Continuous integration and deployment

- **QP-50** One workflow file `.github/workflows/ci.yml` runs on every push and pull request. The `verify` job runs the D13 gates and the browser tests. The `deploy-pages` job runs only on a push to `main` after `verify` passes.
- **QP-51** The e2e job builds with `BASE_PATH` unset. The deploy job builds again with `BASE_PATH=/zebrafish-3D-atlas/`. After deployment, the job fetches the page URL and one hashed asset URL from `dist/index.html` and fails on a non-200 status.

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:
  workflow_dispatch:
permissions: { contents: read }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }   # the deploy job overrides this (below)
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
    permissions: { contents: read, pages: write, id-token: write }   # a job-level block replaces the workflow block, so contents: read is repeated
    concurrency: { group: pages, cancel-in-progress: false }          # never cancel an in-flight Pages deployment
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

The action versions `upload-pages-artifact@v5` and `deploy-pages@v5` come from research 06, section 7. WP-H3 confirms them against the Vite static deploy guide at implementation time. The repository setting "Pages: Source" must be "GitHub Actions". The `validate` step of the `verify` job is the import smoke of QP-17: it runs `src/core` and `src/data` under Node's type stripping without Vite.

#### 6.6.1 Vercel

- **QP-52** `vercel.json` holds `{ "framework": "vite", "installCommand": "npm ci", "buildCommand": "npm run build", "outputDirectory": "dist" }`. The project setting selects Node 22. `BASE_PATH` stays unset, so assets resolve from `/`. Every pull request gets a preview deployment. All state lives in the query string, so no rewrite rule is needed.

### 6.7 Release checklist and README outline

#### 6.7.1 Release checklist

1. `git status` is clean on `main` and the CI run for the head commit is green.
2. `npm run validate -- --strict` reports zero findings.
3. `npm run build && npm run screenshots` regenerates the 36 files; a person reviews the diff against the previous set.
4. `npm run attribution` regenerates `public/ATTRIBUTION.md`; the diff is reviewed.
5. The About sheet shows the ZFA and ZFS version strings and the snapshot date (research 07, UX-ST-12).
6. On both hosts, open `/?t=24&sel=0000114&v=lat` and confirm the heart is selected at Prim-5.
7. On the GitHub Pages host, open a stage link from a slide deck and confirm the assets load under the base path.
8. Run the QP-41 procedure once and store the record under `docs/perf/`.
9. Tag `vMAJOR.MINOR.PATCH`, write the release note from the merged work package list, and publish the GitHub release.

#### 6.7.2 README outline

1. Title, one paragraph on what the viewer shows, and links to the GitHub Pages and Vercel deployments.
2. A strip of six lateral screenshots: 6, 24, 48, 72, 120, and 2160 hpf.
3. What the geometry is: procedural and schematic, placed in a body frame, not measured meshes; stage timings at 28.5 C from ZFIN.
4. Using the viewer: time axis, selection, info card, view presets, export, share links, presentation mode, keyboard shortcuts (link to the shortcut sheet).
5. Data: the five files in `src/data`, the record schema (link to `docs/schema/`), how to add a structure, `npm run validate`.
6. Development: prerequisites, the script table of 6.1, the test plan, screenshots.
7. Deployment: GitHub Pages through the workflow, Vercel through `vercel.json`, the `BASE_PATH` variable.
8. Attribution and licences: code MIT; ZFA, ZFS, and stage data CC BY 4.0 from ZFIN; the environment map source; link to `public/ATTRIBUTION.md` (D14).
9. Citation and how to report an anatomy error (issue template with structure id, stage, expected value, and source).

### 6.8 Work packages

D15 orders the work in four phases. Each phase ends when every package in it passes the D13 gates. Packages inside a phase run in parallel, one agent per package. A package edits only the files it owns; the table of section 6.8.6 assigns every file of section 2.2 to one package (QP-61). A package that needs a change outside its files writes the request into its pull request description instead of making the change. Phase 1 runs in two waves, because the first draft's done-when criteria formed a cycle (the viewer needed the store and the seed, the seed needed the validator and the builders, the validator needed the seed): wave A packages have no dependency on wave B and check against fixtures; wave B packages start when wave A has merged.

#### 6.8.1 Shared body frame API

The anatomy packages code against this application programming interface (API). WP-03 implements it and freezes it at the end of phase 1. The shapes follow D3 and D4; BG-09 in section 4.1.6 is the full type.

```ts
// src/core/bodyModel.ts: the full BodyFrame type is BG-09 (section 4.1.6)
export type Vec3 = [number, number, number]                 // mm; +x posterior, +y dorsal, +z left (D4)
export type BodyModel = (hpf: number) => BodyFrame          // 128 stations, yolk, chorion, lengths, angles
export function createBodyModel(body: BodyFile, growth: GrowthPoint[]): BodyModel   // BG-10; the app and the scripts call it once
// BodyFrame methods that every builder uses (BG-05, BG-08):
//   frameAt(u): { p, t, n, b, hD, hV, hW }                  // u may exceed 1 for fins
//   toWorld(u, v, w): Vec3                                  // p + v * (v >= 0 ? hD : hV) * n + w * hW * b
// src/core/growth.ts
export function slAt(hpf: number): number | null            // growth.standardLengthMm, linear in hpf (BG-26); null before 72 hpf
export function slScale(hpf: number, sizeRefSl: number): number   // slAt(max(hpf, 72)) / sizeRefSl (D6, BG-43); never divides by null
```

- **QP-60** After phase 1, a change to these signatures needs one pull request. That pull request updates every anatomy package and the unit tests.

#### 6.8.2 Phase 1: skeleton

Wave A (four packages in parallel; each checks against fixtures and has no dependency on wave B):

**WP-01 Tool chain and app shell.** Goal: a building, linting, testing empty app with the layout regions of section 5 and the six UI primitives. Owns: `package.json`, `tsconfig.json`, `eslint.config.js`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json`, `.github/workflows/ci.yml`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/ui/primitives/*`, `src/ui/hooks/*`, `src/ui/Toast.tsx`, `src/ui/ErrorScreens.tsx`, `src/ui/About.tsx`, `public/favicon.svg`, `tests/unit/shell.test.ts`. Depends on: D2 versions, research 07 tokens. Must not touch: `src/core`, `src/data`. Done when: `npm ci && npm run check && npm run lint && npm test && npm run build` exit 0 on the shell (QP-07) and `npm run preview` serves it.

**WP-02 Schema, time axis, URL state, presence, seed data.** Goal: the pure modules that every panel reads and the data files that need no geometry. Owns: `src/core/schema.ts`, `jsonSchema.ts`, `timeAxis.ts`, `urlState.ts`, `presence.ts`, `handoffs.ts`, `paramUnits.ts`, `format.ts`, `playback.ts`, `attribution.ts`, `src/data/stages.json`, `systems.json`, `handoffs.json`, `kits.json`, `src/data/index.ts`, `tests/fixtures/structures.fixture.json` (ten hand-written records for the other packages), `tests/unit/timeAxis.test.ts`, `urlState.test.ts`, `schema.test.ts`, `paramUnits.test.ts`, `imports.test.ts`, `docs/schema/`. Depends on: section 3 schemas, D5, D7, D9, `stages.draft.json`. Must not touch: `src/viewer`, `src/ui`, `src/state`. Done when: `npx vitest run tests/unit/timeAxis.test.ts tests/unit/urlState.test.ts tests/unit/schema.test.ts tests/unit/paramUnits.test.ts tests/unit/imports.test.ts` passes against the fixture (QP-10, QP-14 to QP-17).

**WP-03 Body model, primitives, interpolation, queue, palette.** Goal: the API above plus the D3 primitives and the pure runtime helpers. Owns: `src/core/bodyModel.ts`, `spine.ts`, `growth.ts`, `primitives/**`, `interpolation.ts`, `rebuildQueue.ts`, `palette.ts`, `scripts/gen-body.ts`, `src/data/body.json`, `tests/unit/bodyModel.test.ts`, `primitives.test.ts`, `interpolation.test.ts`, `rebuildQueue.test.ts`. Depends on: research 05 sections 5, 15, 16; D3; D6; D8; the schema types of WP-02 (a type-only dependency). Must not touch: `src/viewer`, `src/ui`, `src/data/structures.json`. Done when: `npx vitest run tests/unit/bodyModel.test.ts tests/unit/primitives.test.ts tests/unit/interpolation.test.ts tests/unit/rebuildQueue.test.ts` passes (QP-11 to QP-13, QP-18).

**WP-07 Scripts and browser tests.** Goal: the three scripts of D12, the ZFIN snapshot and the Playwright specs. Owns: `scripts/validate-data.ts`, `scripts/screenshot.ts`, `scripts/build-attribution.ts`, `docs/research/zfin/`, `tests/e2e/*.spec.ts`, `docs/screenshots/`, `public/ATTRIBUTION.md`. Depends on: the schemas and fixture of WP-02, the D13 rule list. Must not touch: `src/**`. Done when: `npm run validate -- --data tests/fixtures` exits 0 on the fixture, `npm run attribution` writes the file and exits 1 on a licence outside the allow-list, and every e2e spec parses under `npx playwright test --list`.

**WP-08 Store.** Goal: the zustand store of section 2.4 with its slices, the derived fields of AR-74 and persistence. Owns: `src/state/store.ts`, `src/state/slices/*`, `src/state/persist.ts`, `tests/unit/store.test.ts`. Depends on: `timeAxis`, `presence` and `urlState` of WP-02. Must not touch: `src/viewer`, `src/ui`. Done when: `npx vitest run tests/unit/store.test.ts` passes: `setTime` writes `stageIndex` and `presentIds` only on change, `select` caps at 12, `toUrl` and `applyUrl` round-trip through `urlState`.

Wave B (three packages in parallel after wave A has merged):

**WP-04 Structure seed.** Goal: `structures.json` with the group nodes of section 3.4 and ten structures across five systems (D15): chorion, yolk, blastoderm; notochord, somites; neural tube, spinal cord; eye, otic vesicle; heart. Owns: `src/data/structures.json`. Depends on: section 3 schema, the body frame API, 03 drafts. Must not touch: `src/core`, `src/viewer`. Done when: `npm run validate` exits 0 and `npx vitest run tests/unit/schema.test.ts` passes on the seed.

**WP-05 Viewer scene.** Goal: body, structures, picking, camera presets, and the `data-atlas-ready` attribute. Owns: `src/viewer/**`. Depends on: the body frame API, the store of WP-08, the schemas. Must not touch: `src/core`, `src/data`, `src/ui`, `src/state`. Done when: with `VITE_ATLAS_FIXTURE=1` (a Vite alias that swaps `src/data/structures.json` for the WP-02 fixture) `npx playwright test tests/e2e/screenshots.spec.ts -g "24-lateral"` passes the non-blank check, and QP-38 passes for `24-dorsal`.

**WP-06 Timeline bar and rail.** Goal: the timeline bar, the top bar readout, and the systems rail with visibility toggles. Owns: `src/ui/TimelineBar.tsx`, `Track.tsx`, `Transport.tsx`, `Readout.tsx`, `StageCard.tsx`, `TopBar.tsx`, `ViewPresets.tsx`, `ThemeToggle.tsx`, `SystemsRail.tsx`, `SystemRow.tsx`, `RailPresets.tsx`, `XraySlider.tsx`, `SectionControl.tsx`, `FirstRunHint.tsx`. Depends on: `timeAxis` API, the store of WP-08, research 07 section 3. Must not touch: `src/core`, `src/viewer`, `src/state`. Done when: smoke steps 4, 5, 6 pass with `npx playwright test tests/e2e/smoke.spec.ts -g "time keys"` against the fixture build.

Phase gate: with the seed of WP-04 in place, smoke steps 1 to 6 and the 24-lateral and 24-dorsal screenshots pass on one build, and the D13 gates are green.

#### 6.8.3 Phase 2: anatomy fill

Five packages author structure records and keyframes. Each package owns the records whose `system` is in its group and the handoff rows between those records. Records sit in `structures.json` sorted by system in the D5 order and then by id, so parallel edits touch disjoint regions. Branches merge in the order A1 to A5, and `npm run validate` runs after every merge. Every package converts the draft sizes in micrometres to millimetres and to body coordinates. It cites the source per keyframe and applies the corrections of research 03, section 4. The D5 duplicate ownership list decides the writer: periderm, myotome, and median fin fold go to WP-A5; pharyngeal arch to WP-A3; head kidney and pharyngeal teeth to WP-A4; hypophysis and epiphysis to WP-A2.

Common done-when for every anatomy package: `npm run validate` exits 0 with zero findings for the owned records; `npx vitest run tests/unit/schema.test.ts` passes; `npm run screenshots` regenerates the 36 files with the new structures visible; the owning agent lists each record it could not place with the reason.

**WP-A1 Early embryo and axial.** Owns: records in `early_embryo` and `axial`; handoffs somites to myotomes (source side). Source: `03a` draft (42 records, of which the `extraembryonic` and `axial` ones). Custom builders: none. Must not touch: `src/core`, `src/viewer`, records of other groups.

**WP-A2 Nervous and sensory.** Owns: records in `nervous` and `sensory`; the neural plate to neural tube chain and the optic and otic handoffs (D9). Source: `03b` draft (45 records). Custom builders: `src/core/primitives/custom/eyeCup.ts`, `src/core/primitives/custom/earVesicle.ts`. Must not touch: other `src/core` files, `src/viewer`, records of other groups.

**WP-A3 Cardiovascular, blood and immune, respiratory.** Owns: records in `cardiovascular`, `hematopoietic_immune`, `respiratory`; the heart cone to chambers handoffs and the heart `aliasChain` (D9). Source: `03c` draft (45 records). Custom builders: `src/core/primitives/custom/heartLoop.ts`. Must not touch: other `src/core` files, `src/viewer`, records of other groups.

**WP-A4 Digestive, excretory, endocrine, reproductive.** Owns: records in those four systems; the pronephros to mesonephros and gonad handoffs (D9). Source: `03d` draft (43 records). Custom builders: `src/core/primitives/custom/gutLoop.ts`. Must not touch: other `src/core` files, `src/viewer`, records of other groups.

**WP-A5 Skeletal, muscular, fins, skin and pigment.** Owns: records in `skeletal`, `muscular`, `fins`, `integument_pigment`; the fin fold to fins and larval to adult stripe handoffs (D9); the SL-keyed events placed through the growth table (D6). Source: `03e` draft (45 records) plus the fins, muscular, and integument records of `03a`. Custom builders: none; uses `sheet` and `segmentArray`. Must not touch: `src/core`, `src/viewer`, records of other groups.

#### 6.8.4 Phase 3: interaction

**WP-I1 Search and hierarchy tree.** Owns: `src/ui/Search.tsx`, `src/ui/Tree.tsx`. Depends on: record synonyms from the schema, store selection slice. Must not touch: `src/core`, `src/viewer`, `src/data`. Done when: smoke step 3 passes and the tree meets research 07, UX-AC-02.

**WP-I2 Info card and handoffs.** Owns: `src/ui/InfoCard.tsx`, `src/core/handoffs.ts`, `src/core/presence.ts`. Depends on: `handoffs.json`, `aliasChain`, the growth table. Must not touch: other `src/core` files, `src/data`, `src/viewer`. Done when: smoke step 8 passes and the card shows definition, stage window, ZFIN link, events, and the attribution footer (D1, D14).

**WP-I3 View presets, URL sync, export.** Owns: `src/viewer/CameraRig.tsx`, `src/viewer/export/*.ts`, `src/ui/ExportDialog.tsx`, `src/state/urlSync.ts`. Depends on: `urlState` API, D4 presets. Must not touch: `src/core`, `src/data`. Done when: smoke steps 7, 9, 10 pass and QP-14 still passes.

**WP-I4 Presentation mode, themes, settings, shortcuts.** Owns: `src/ui/Settings.tsx`, `src/state/shortcuts.ts`, `src/ui/PresentationOverlay.tsx`, `src/ui/EmbedFooter.tsx`, `src/ui/ShortcutSheet.tsx`, the theme tokens in `src/styles.css`, `tests/e2e/presentation.spec.ts` (shared with WP-07 by pull request). Depends on: research 07 sections 2.5, 3.10, 4.1; UI-36 to UI-41. Must not touch: `src/core`, `src/viewer`, `src/data`. Done when: the phone check passes, QP-37 passes, and every row of the keyboard map of section 5.9.1 has a smoke assertion, including the presentation-mode `PageDown`, `B`, `.`, `Enter`, `Shift+P` and `Ctrl+B` cases and the double-toggle cases of UI-41 (`Space` after clicking Play toggles once; `ArrowRight` on the focused track steps once).

**WP-I5 Slide kit.** Owns: `src/ui/KitSheet.tsx`, `src/ui/KitMarkers.tsx`, `src/viewer/export/zip.ts`, `src/data/kits.json` (after WP-02), the `kit` slice actions in `src/state/slices/mode.ts`. Depends on: section 5.12, the export pipeline of WP-I3, `urlState`. Must not touch: `src/core`, other `src/viewer` files. Done when: the UI-46 assertions pass and the two starter kits load from the sheet.

#### 6.8.5 Phase 4: hardening

**WP-H1 Tests and performance.** Owns: `tests/**`, `docs/perf/**`, the time-slicing code path in `src/viewer/rebuild.ts`. Done when: every test of QP-10 to QP-15 and QP-30 to QP-36 exists and passes, the QP-41 record exists for three machines, and `PERF=1 npx playwright test tests/e2e/perf.spec.ts` passes on the presenter's laptop.

**WP-H2 Accessibility.** Owns: ARIA attributes and focus handling across `src/ui/**`. Depends on: research 07, section 7. Must not touch: `src/core`, `src/data`. Done when: `tests/e2e/a11y.spec.ts` with `@axe-core/playwright` reports zero serious or critical violations on desktop and phone, and the QP-36 target-size check passes.

**WP-H3 Documentation and deploy.** Owns: `README.md`, `public/ATTRIBUTION.md`, `.github/workflows/ci.yml` deploy job, `vercel.json`, `docs/screenshots/`. Done when: the release checklist of 6.7 completes once end to end and both hosts serve the tagged build.

#### 6.8.6 File ownership

- **QP-61** Every file of section 2.2 has one owning package. A pull request that touches a file outside its package's row is rejected in review.

| Path | Phase 1 owner | Later owner (may edit after phase 1) |
|---|---|---|
| `package.json`, `tsconfig.json`, `eslint.config.js`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css` | WP-01 | WP-I4 (tokens in `styles.css`), WP-H3 (`vercel.json`) |
| `.github/workflows/ci.yml` | WP-01 | WP-H3 (deploy job) |
| `src/ui/primitives/*`, `src/ui/hooks/*`, `src/ui/Toast.tsx`, `src/ui/ErrorScreens.tsx`, `src/ui/About.tsx` | WP-01 | WP-H2 (ARIA) |
| `src/core/schema.ts`, `jsonSchema.ts`, `timeAxis.ts`, `urlState.ts`, `presence.ts`, `handoffs.ts`, `paramUnits.ts`, `format.ts`, `playback.ts`, `attribution.ts` | WP-02 | WP-I2 (`handoffs.ts`, `presence.ts` fixes by pull request) |
| `src/data/stages.json`, `systems.json`, `handoffs.json`, `kits.json`, `index.ts`, `tests/fixtures/*` | WP-02 | WP-A1 to WP-A5 (`handoffs.json` rows of their systems), WP-I5 (`kits.json`) |
| `src/core/bodyModel.ts`, `spine.ts`, `growth.ts`, `interpolation.ts`, `rebuildQueue.ts`, `palette.ts`, `src/core/primitives/**` except `custom/*`, `scripts/gen-body.ts`, `src/data/body.json` | WP-03 | WP-H1 (performance) |
| `src/core/primitives/custom/eyeCup.ts`, `earVesicle.ts` | WP-03 (stubs) | WP-A2 |
| `src/core/primitives/custom/heartLoop.ts` | WP-03 (stub) | WP-A3 |
| `src/core/primitives/custom/gutLoop.ts` | WP-03 (stub) | WP-A4 |
| `src/core/primitives/custom/somiteChevron.ts`, `finSheet.ts`, `primordiumMover.ts` | WP-03 | WP-A1, WP-A5, WP-A2 |
| `src/data/structures.json` | WP-04 | WP-A1 to WP-A5 by system block |
| `src/viewer/**` except `export/*` and `CameraRig.tsx` | WP-05 | WP-H1 (`rebuild.ts`) |
| `src/viewer/CameraRig.tsx`, `src/viewer/export/*` | WP-05 (presets and fit only) | WP-I3, WP-I5 (`export/zip.ts`) |
| `src/state/store.ts`, `src/state/slices/*`, `src/state/persist.ts` | WP-08 | WP-I5 (kit actions) |
| `src/state/urlSync.ts` | WP-I3 | |
| `src/state/shortcuts.ts` | WP-I4 | |
| `src/ui/TimelineBar.tsx`, `Track.tsx`, `Transport.tsx`, `Readout.tsx`, `StageCard.tsx`, `TopBar.tsx`, `ViewPresets.tsx`, `ThemeToggle.tsx`, `SystemsRail.tsx`, `SystemRow.tsx`, `RailPresets.tsx`, `XraySlider.tsx`, `SectionControl.tsx`, `FirstRunHint.tsx` | WP-06 | WP-H2 |
| `src/ui/Search.tsx`, `Tree.tsx` | WP-I1 | |
| `src/ui/InfoCard.tsx` | WP-I2 | |
| `src/ui/ExportDialog.tsx` | WP-I3 | |
| `src/ui/Settings.tsx`, `PresentationOverlay.tsx`, `EmbedFooter.tsx`, `ShortcutSheet.tsx` | WP-I4 | |
| `src/ui/KitSheet.tsx`, `KitMarkers.tsx` | WP-I5 | |
| `scripts/validate-data.ts`, `scripts/screenshot.ts`, `scripts/build-attribution.ts`, `docs/research/zfin/`, `public/ATTRIBUTION.md`, `docs/screenshots/` | WP-07 | WP-H3 |
| `tests/e2e/*.spec.ts` | WP-07 | WP-I1 to WP-I5 (their smoke cases), WP-H1, WP-H2 (`a11y.spec.ts`) |
| `tests/unit/*.test.ts` | the package that owns the module under test | WP-H1 |
| `README.md`, `docs/perf/**` | WP-H3, WP-H1 | |

### 6.9 Risks and mitigations

| Risk | Effect | Mitigation | Owner |
|---|---|---|---|
| Procedural look reads as toy-like to a biologist audience | the talk loses credibility on the first slide | matte materials and neutral tone mapping (research 07, UX-VS-13; research 06, section 5); human review of the 36 screenshots at every phase gate (D13); the About sheet states that geometry is schematic (research 07, UX-ST-12) | WP-05, WP-H3 |
| Performance on an integrated GPU falls below 60 fps | stutter during a live scrub | `frameloop="demand"`, one base material per system cloned per structure (AR-27), instancing for somites, scales, and rays, pixel ratio drop during playback (research 06, section 8); the QP-41 record on an integrated-GPU laptop before release | WP-05, WP-H1 |
| Data errors visible to experts | a wrong stage window or size on a projected info card | the E and W rules of section 3.8; the research 03 corrections applied in phase 2; source per keyframe; an issue template for anatomy errors in the README | WP-07, WP-A1 to WP-A5 |
| TypeScript 7 drift | `npm install` pulls a version the lint tool chain rejects | pin `typescript` 5.9.x (D2); no caret ranges; upgrade only when `typescript-eslint` declares support (research 06, section 9) | WP-01 |
| Network-dependent assets | a conference network blocks the environment map or a font | ship the HDR under `public/` (D12) or use `RoomEnvironment`; no runtime fetch outside the origin; the offline toast of research 07, UX-ST-10 | WP-05 |
| Playwright 1.63 and Chrome 145 mismatch | local browser tests fail to launch | run one launch smoke first; fall back to `npx playwright install chromium` locally (research 06, section 7) | WP-01 |
| `postprocessing` caps `three` below 0.186 | an upgrade of one breaks the other | pin both; upgrade together and regenerate screenshots (research 06, section 9) | WP-01 |
| Parallel edits to `structures.json` conflict | merge failures in phase 2 | records sorted by system block; merge order A1 to A5; `npm run validate` after each merge | WP-A1 to WP-A5 |
| Wrong base path on GitHub Pages | blank page with 404 assets | `BASE_PATH` only in the deploy job; the post-deploy asset fetch of QP-51 | WP-H3 |
| SwiftShader pixels differ from laptop pixels | false screenshot diffs | no pixel baselines in version 1; the non-blank check only (QP-33) | WP-07 |

## 7. Open conflicts for the owner

The section authors raised the items below under "Conflicts with the decision record". The assembler collected them without resolving them. An assembler note states what the assembled text assumes until the owner decides.

### 7.1 From section 3 (data model)

1. D9 lists "heart cone to heart tube, 22 to 24 hpf" as a handoff and also makes the heart one record with an `aliasChain`. A `HandoffRecord` needs two records. This section implements the row as an alias boundary inside ZFA:0000114 (DM-24) and omits it from `handoffs.json`, which therefore has 12 rows instead of 13. If D9 intends a separate heart tube record, DM-24 and DM-25 change.
2. D14 states that ZFA and ZFS data are CC BY 4.0. The `zfa.obo` header (release 2026-07-16) declares `terms:license https://creativecommons.org/licenses/by/3.0/`. Research 01 marked the 4.0 claim as unverified. The attribution text follows D14; the ZFIN download terms need one check before slice 4 ships `ATTRIBUTION.md`.

Assembler note on item 1: the assembled specification adopts the `withinRecord` flag of the section 4.8 handoff schema. `handoffs.json` therefore keeps the heart cone to heart tube row: 14 rows from the D9 table (the optic row split in two) plus the ten develops-from rows of BG-49, 24 in all (DM-24, BG-48, BG-49). The owner confirms or changes D9.

Assembler note on item 2: no change made. The attribution text follows D14 (CC BY 4.0) until the owner checks the ZFIN download terms.

### 7.2 From section 4 (body model and geometry)

1. D9 gives the somite to myotome handoff as "14 to 24 hpf (per segment)". Segments 27 to 31 form between 22.5 and 24.7 hpf (K95 rates, research 05 section 4). A per-segment window that starts 2 h after formation and lasts 2 h ends at 28.7 hpf for the last segment. This section encodes `perSegment: {delayHpf: 2, lengthHpf: 2}` with the first window starting at 14 hpf; the last windows end after 24 hpf. Either the 24 hpf bound in D9 applies to the trunk segments only, or the delay for tail segments drops to 0. The second option contradicts research 03a (chevron formation over 2 h, several hours after formation).

2. D3 places the yolk in the body model and D8 fades the chorion from 48 to 72 hpf. D3 also describes R3 as the Kimmel posture, with a 120 to 25 degree head-trunk angle and a spline body. The Kimmel figures show dechorionated embryos. An embryo of 2.0 to 3.1 mm axis length in that posture does not fit inside a 1.2 mm chorion (research 03a). This section keeps the R3 posture and enlarges the chorion sphere to enclose the body (BG-19). The review (finding R-02) asked for a constant 0.60 mm chorion with the tail curled 170 degrees behind a straight trunk. The BG-16 construction gives that posture an enclosing radius of 0.73 mm at 22 hpf, 0.77 at 24, 0.95 at 30 and 1.31 at 48 hpf, so it does not fit either; a single planar curl of trunk and tail fits 0.57 mm at 22 hpf (170 degrees), 24 hpf (180 degrees) and 30 hpf (250 degrees) and at no later keyframe. A real-size chorion therefore needs a spine that leaves the sagittal plane (a coil around the yolk), which BG-02 excludes from version 1, or the dechorionated alternative in which the chorion record ends at 22 hpf (a D8 change: `modelEndHpf` 22 instead of 72, no hatching fade). Both change the prim-5 to long-pec screenshots of D13 and need a decision.

3. D6 states the growth table in body length and D3 states smoothstep interpolation for parameters. SL-defined events need a monotone, invertible SL(t). This section therefore makes the growth table linear in hpf and reads SL from it (BG-26, BG-43). Shape parameters keep the smoothstep. No decision is contradicted, but D3 readers may expect the smoothstep to apply to SL too.

Assembler note on item 1: the assembled specification keeps the per-segment window (`perSegment: {delayHpf: 2, lengthHpf: 2}`), so the tail segments finish after 24 hpf. The owner confirms or changes the D9 bound.

Assembler note on item 2: the assembled specification keeps the enlarged chorion of BG-19 and the R3 posture, and the chorion record's info card states why. The owner decides between this, a coiled spine out of the sagittal plane (a BG-02 change), and a chorion that ends at 22 hpf (a D8 change).

Assembler note on item 3: the growth table is linear in hpf (BG-26) and shape parameters keep the smoothstep (BG-41). No decision is contradicted; the owner may add one sentence to D3 or D6.

### 7.3 From the review

The review of 2026-09-06 (graphics, biology, data and presenter lenses) raised the items below. The reviser applied every finding that the decision record allows and lists here the findings that need an edit of the record, the readings of the record that the revised text assumes, and the values that moved out of research 07's domain.

1. D8 sets squamation onset at 8.6 mm SL. Research 02 section 3.1 transcribes Parichy et al. 2009 Table 4 as PR (pelvic fin ray) 8.5 to 8.7 mm, SSL 8.6, and SP (squamation onset posterior) 9.5 to 9.6 mm, SSL 9.6; the ZFA scale term ZFA:0000277 starts in Days 30-44 (720 to 1080 hpf), which contains both. The D8 value is the pelvic fin ray stage. The spec keeps 8.6 (BG-27, E026) because D8 binds; the owner is asked to change D8 to 9.6 mm SL, which BG-26 places at 853 hpf (finding R-03, not applied).
2. D5 files the swim bladder and the pharyngeal arch under `respiratory` and the floor plate under `axial`. In ZFA the swim bladder is part of the pleuroperitoneal region and develops from the gut, the pharyngeal arch is part of the head, the respiratory system's only part is the gill, and the floor plate is part of the central nervous system; zebrafish do not breathe air, and arches 1 and 2 are jaw and opercular. The spec complies with D5 (sections 3.3, 3.5.2). Proposed D5 edits for the owner: swim bladder `digestive` with `alsoIn: ['respiratory']` or a slot renamed "Respiratory and swim bladder"; pharyngeal arch `skeletal` with `alsoIn: ['respiratory']` and arches 3 to 7 also respiratory; floor plate `nervous` with `alsoIn: ['axial']`; head kidney `alsoIn: ['hematopoietic_immune', 'endocrine']` (finding C-05, not applied).
3. D7 says `stages.json` holds "the 44 ZFS stages". `stage_ontology.txt` has 44 data rows, one of which is `ZFS:0000000` Unknown (0 to 17520 hpf), which is not a stage: it has no period, `stageAt(t)` could return it, and it would double-count 0 hpf in the tick table. The spec holds the 43 named stages and rejects the Unknown row (sections 1.4, 3.1, 3.2.2, E022, UI-05). The owner is asked to change the number in D7 to 43 (finding UXR-20; applied in the spec because the alternative breaks E022 and the period schema).
4. D9's table lists thirteen handoffs. Ten further develops-from pairs among the records overlap in time and would pop without a row (BG-49 second table: pectoral and pelvic fin buds, liver primordium, pancreatic buds, swim bladder bud, thyroid and interrenal primordia, otic and olfactory placodes, gonad primordium). D9's first sentence says the file lists every case, so the spec adds them; the owner is asked to extend the D9 table (finding R-07).
5. D9 names "neural tube to brain regions and spinal cord, 22 to 24 hpf". ZFA starts the brain regions at 14 hpf, when the neural tube itself starts, and the info card would read "ZFIN 14 hpf, Model 22". The spec reads the row as: the regions exist from 14 hpf as sub-tubes of the neural tube, and the 22 to 24 hpf window retires the tube mesh and starts the spinal cord (BG-49, DM-33). The forebrain is a group node, so the telencephalon and diencephalon stand in the `to` list. The owner confirms this reading or edits D9 (finding R-06).
6. D9 names "gonad primordium to ovary or testis, 25 to 30 dpf". The ZFA term gonad primordium ZFA:0001262 ends at 312 hpf; the term present at 25 to 30 dpf is the immature gonad ZFA:0005272, which the spec makes the source and driver (DM-32). The owner confirms the name (finding R-05).
7. D9 lists the optic vesicle and the optic cup as separate structures. The spec folds both into the eye record ZFA:0000107 as an alias chain on the heart pattern (DM-34), because the `eyeCup` builder needs one owner after 30 hpf, when the optic cup ends in ZFIN. The owner confirms that the D9 heart pattern extends to the eye (finding RV-04).
8. D3 says "Geometry is regenerated when time changes". AR-72 regenerates the vertices of a compact primitive only when its shape parameters change and moves it by a mesh transform otherwise; the body coordinates are still converted to world space at every time step and no world-space vertex is stored. The owner is asked to confirm this reading or to add "or is placed by a transform when only its position changed" to D3 (finding RG-12).
9. D1 lists export at 1x, 2x and 4x. AR-52 keeps the three and adds the frames 16:9, 4:3 and 1:1 and the fixed sizes 1920 by 1080 and 3840 by 2160 for slides. The owner confirms that D1's list is a minimum (finding UXR-09).
10. D11 makes research 07 the owner of every UX value. The review changed the values listed in section 2.11 item 4 (presentation type scale, strip visibility, x-ray default, two-tone outline, export overlay colour and frames, fullscreen and black-screen keys, key dispatcher, accent token, xanthophore hex, rail swatch grid, root height, isolate ghost opacity in presentation mode, and the `pin` and `ps` parameters). The owner is asked to write them back into research 07 sections 2.5, 3.9, 3.10, 4.1, 4.2 and 6.1 so that one file owns them again.
11. D8 fixes the chorion end at 72 hpf with a fade from 48. The chorion size question of item 7.2.2 has one alternative that needs a D8 edit (chorion `modelEndHpf` 22, no hatching fade). Listed here for completeness; the reviser did not apply it (finding R-02, see BG-19 for the measurements).
