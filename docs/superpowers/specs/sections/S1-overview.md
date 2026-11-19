> **Superseded draft.** The assembled specification
> [`../2026-09-06-zebrafish-3d-atlas-design.md`](../2026-09-06-zebrafish-3d-atlas-design.md)
> is authoritative. This file is the section draft written before reconciliation and it may
> disagree with the assembled specification. Written by AI coding agents (Claude Code) under
> the direction of Yang-Joon Kim, 2026-09-06.

## Overview and requirements

### Purpose

The zebrafish 3D atlas is a static web viewer for talks. One time axis runs from the 1-cell zygote at 0 hours post fertilization (hpf) to 180 days post fertilization (dpf). That end point is 4320 hpf (decision D1). The viewer draws one procedural fish at the current time. Structures appear, move, and grow as the user scrubs. Every structure carries an id from the Zebrafish Anatomy Ontology (ZFA) and a stage window from the Zebrafish Stage Ontology (ZFS). The app has no backend. One build deploys to GitHub Pages and to Vercel (D1). The decision record `2026-09-06-architecture-decisions.md` binds every section of this spec.

### Users and moments of use

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
- **OV-04** Presentation mode hides every control except a timeline strip. The strip appears on pointer movement or key press and hides after 3 s of idle. The keyboard alone drives time, view presets, and bookmarks (research 07 section 1, UX-US-04).
- **OV-05** The first interactive frame arrives within 2 s on a 10 Mbit/s connection (research 07 section 1, UX-US-05). Geometry is procedural, so the payload holds records and keyframes, not meshes (D3). The hardening slice measures this budget (D15).
- **OV-06** The dark theme is the default. The light theme is one click away (research 07 section 1, UX-US-06).
- **OV-07** No action opens a modal dialog in presentation mode except the export dialog (research 07 section 1, UX-US-07).
- **OV-08** The layout works on a phone at 390 by 844 px portrait (D1; research 07 section 2.1). A mobile-first layout is out of scope (D1).
- **OV-09** Export writes a PNG at 1x, 2x, or 4x of the viewport with an optional transparent background (D1).

### Goals and non-goals

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

### Glossary

Every section of this spec uses these names and no synonyms.

| Term | Meaning | Source |
|---|---|---|
| structure | One record in `structures.json`. It has one ZFA id, one system, and procedural geometry or `geometry: null`. | D3, D5 |
| system | One of the 15 fixed groups in `systems.json`. It owns a palette slot and a list of ZFA root ids. | D5 |
| group node | A structure record with `geometry: null` that the UI tree needs as a parent, for example "brain". | D5 |
| stage | One of the 44 ZFS stages. Its hpf start and end come from the ZFIN stage table. | D7 |
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

### Success criteria for version 1

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
- [ ] **OV-34** "Jump to first appearance" moves time to the structure's `visibleFromHpf` (D1, D3).
- [ ] **OV-35** Selection draws an outline in the focus colour and changes no fill (D10).
- [ ] **OV-36** Each of the six view presets frames the body (D4).
- [ ] **OV-37** A copied URL opens in a new tab with the same time, selection, camera, and visibility (D1).
- [ ] **OV-38** In presentation mode the keyboard alone steps time and switches view presets. The strip hides after 3 s of idle (OV-04).
- [ ] **OV-39** At 390 by 844 px the fish and the timeline bar are visible (OV-08). The page has no horizontal scroll (research 07 section 7, UX-AC-12).

Export and delivery:

- [ ] **OV-40** PNG export at 1x, 2x, and 4x each produce a file. The transparent option composites onto a coloured slide background with no dark fringe (D1; research 07 section 6.1, UX-EX-03).
- [ ] **OV-41** 18 headline screenshots exist in lateral view and 18 in dorsal view under `docs/screenshots/`. The Playwright run confirms that no canvas is blank (D13).
- [ ] **OV-42** `npm run check`, `npm run lint`, `npm run test`, `npm run validate`, and `npm run build` pass (D13).
- [ ] **OV-43** `public/ATTRIBUTION.md` credits ZFIN under CC BY 4.0. The info card footer shows the credit. No Kimmel 1995 figure is in the repository (D14).
- [ ] **OV-44** The same build is live on GitHub Pages and on Vercel (D1).

### Research files and ownership

Decision D11 assigns ownership of values. Where a research file contradicts the decision record, the decision record wins.

| File | Owns | What the spec takes from it |
|---|---|---|
| `01-human-atlas-reference.md` | No values. It describes the reference implementation. | The panel anatomy, the systems list, the isolate action, and the hover chip that the layout borrows (research 07 section 0) |
| `02-developmental-staging.md`, `stages.draft.json` | The 44 ZFS stages, the 10 periods, and the event list | Stage bounds and period bounds. D7 replaces the draft time axis. D8 replaces the event values where they differ. |
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
| Research 07 section 3.7: "Last stage" sets `t` to 2160 | D1: the axis end is 4320 hpf |
| ZFIN page head-trunk angle 55 degrees at 60 hpf | D8: 35 degrees, interpolated |
