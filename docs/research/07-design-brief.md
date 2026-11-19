# 07. Design brief: zebrafish 3D atlas viewer

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Status: draft for engineering review. Date: 2026-09-06.

This brief specifies the user interface of the zebrafish 3D atlas viewer. It covers users, layout, the timeline bar, the visual system, interactions, export, accessibility, and application states. Requirements carry IDs of the form `UX-<AREA>-<NN>`. Tables hold tokens and sizes. Prose holds reasoning.

Pixel sizes, durations, easing curves, and token values in this brief are design decisions. They have no external source unless a citation follows them. Facts about other products, standards, and zebrafish biology carry a URL. Facts I could not verify carry the mark "(unverified)".

Companion script: `07-design-brief-checks.py` in this directory reproduces every contrast ratio, colour-difference value, and timeline width quoted below.

Terms used in this brief:

- "structure": one ZFA (Zebrafish Anatomy Ontology) term with geometry.
- "system": one of 15 top-level groups of structures. The data model (research file 03) owns the final list. This brief assigns palette slots S01 to S15 and proposes a mapping.
- "stage": one of the 43 named ZFS (Zebrafish Stage Ontology) stages from Zygote:1-cell to Adult. Source: `stage_ontology.txt` from ZFIN, which lists 44 rows including "Unknown".
- "period": one of the 10 stage groups Zygote, Cleavage, Blastula, Gastrula, Segmentation, Pharyngula, Hatching, Larval, Juvenile, Adult. Source: the same file.
- "time" or `t`: hours post fertilization (hpf) at 28.5 C, stored as a float.
- "the track": the horizontal timeline element.
- "the card": the right-hand structure panel.
- "the rail": the left-hand systems and tree panel.

---

## 0. Precedents

I studied eleven precedents. Several of them are single-page applications, so a text fetch returned only a title. For those I used the project source code, the primary paper, or the product documentation, and I say which.

| Precedent | What I examined | What works | What we take | What we avoid |
|---|---|---|---|---|
| human-atlas ([repo](https://github.com/ashemag/human-atlas), [demo](https://human-atlas-seven.vercel.app)) | README and `app/globals.css`, `app/anatomy.ts`, `app/scene.tsx` in the local clone | Floating "glass" panels over a full-bleed canvas; a systems list with per-system dot, switch and count; presets All, Skeleton, Organs; an isolate action; a 310 px detail sheet; 44 px minimum icon buttons; a hover chip that names the part under the cursor | The panel anatomy, the systems list, isolate, the hover chip, the bottom dock (we replace the explode slider with the timeline) | Light theme only; desaturated earth-tone palette that is hard to tell apart on a projector; absolute pixel positioning of every panel |
| Zebrahub ([site](https://zebrahub.sf.czbiohub.org/), redirected from `zebrahub.ds.czbiohub.org`) | Landing page and `/imaging` | Stage labels in hpf; datasets from 10 hpf to 10 dpf across 10 stages; imaging opened in a neuroglancer viewer | The hpf convention and outbound links per stage | Nothing to avoid; it is a data portal, not a viewer |
| Amsterdam 3D Atlas of Human Embryology ([site](https://www.3dembryoatlas.com), [Node article](https://thenode.biologists.com/3d-atlas-human-development/resources/)) | Home page, help page, the Node write-up | 14 stage models (Carnegie 7 to 23); structures coloured by organ system; show/hide per structure; adjustable transparency | Colour by system, transparency of outer layers, up to about 150 labelled structures per stage as a target | Discrete stage files with no interpolation; 3D-PDF as the delivery format |
| Allen Developing Mouse Brain Atlas ([docs](https://brain-map.org/support/documentation/allen-developing-mouse-brain-reference-atlas), [API sample](http://api.brain-map.org/api/v2/data/query.json?criteria=model::Structure,rma::criteria,[graph_id$eq17],rma::options[num_rows$eq12])) | Documentation page and one API query | Seven ages (E11.5, E13.5, E15.5, E18.5, P4, P14, P28); the ontology in a left panel opened at level 3 of 13; a text search inside the ontology pane; related structures share related colours (the API sample shows forebrain children sharing `C86A39` and `A84D10`) | Left ontology panel with a default depth; child structures inherit the parent hue with lightness steps | Ages as separate atlases with no continuous axis |
| eMouseAtlas ([site](https://www.emouseatlas.org/emap/home.html), [Armit et al. 2017, PMC5442644](https://pmc.ncbi.nlm.nih.gov/articles/PMC5442644/)) | Home page navigation and the 2017 paper | A stage selector; an anatomy tree in the right panel that toggles structures; a section viewer with pan, zoom, plane distance, pitch and yaw; sections of arbitrary orientation | The section plane control (plane, position, orientation) and tree rows that toggle visibility | Tree on the right and image in the centre; we keep the tree on the left so the card can sit on the right |
| mapzebrain ([site](https://mapzebrain.org), [Shainer et al. 2023, PMC9946346](https://pmc.ncbi.nlm.nih.gov/articles/PMC9946346/), [Kunst et al. 2019](https://www.sciencedirect.com/science/article/pii/S0896627319303915)) | The two papers | A 6 dpf reference brain; 79 hierarchical regions; 3D and slice views; search by 3D region of interest; export of the current 3D view as an image; colour keys per data class | Image export of the exact current view; a region hierarchy that filters what is shown | Fixed age |
| Z-Brain ([Randlett et al. 2015](https://www.nature.com/articles/nmeth.3581), [GitHub README](https://github.com/owenrandlett/Z-Brain/blob/master/README.md)) | Paper abstract and README | 294 regions on a 6 dpf reference; multicolour overlays; a "click to find" region lookup; slice export | Click-to-identify and multi-select overlays | A desktop MATLAB viewer as the main interface |
| BioRender ([site](https://www.biorender.com/), [blog on icon production](https://www.biorender.com/blog/meet-the-medical-illustrators-who-hand-build-biorenders-50-000-icons)) | Home page and blog | Hand-built vector icons in one consistent style; flat fills with restrained shading; dark navy text on white with a yellow accent | Matte flat materials, one line weight, one label style; consistency over realism | Glossy or photoreal rendering |
| Apple product pages ([CSS-Tricks recreation](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/), [builder.io recreation](https://www.builder.io/blog/webgl-scroll-animation)) | Two technical write-ups | One hero object on a solid black background; a fixed, centred canvas; motion driven by a scrubber (scroll position maps to one of 148 frames in the CSS-Tricks example) | Solid dark background, one centred object, all motion driven by the user's scrub position | Scroll hijacking |
| Google Arts & Culture time browsing ([how-to page](https://www.hardreset.info/devices/apps/apps-google-arts-and-culture/find-timeline-of-art-history/)) | A third-party how-to page; the product page itself returned no text | A slider at the top of the Explore view sets the time and filters the collection (unverified beyond that page) | A single full-width slider as the primary control | Nothing verified enough to reject |
| Distill and Observable ([Distill guide](https://distill.pub/guide/), [d-article.css](https://raw.githubusercontent.com/distillpub/template/master/src/styles/d-article.css), [styles-layout.css](https://raw.githubusercontent.com/distillpub/template/master/src/styles/styles-layout.css), [Observable10 source](https://raw.githubusercontent.com/d3/d3-scale-chromatic/main/src/categorical/observable10.js)) | Style sources | Body text 16 px at 1.7 line height in `rgba(0,0,0,0.8)`; h2 at 600 weight; a 60 px column grid at 1180 px and up; citations and footnotes that reveal on hover; the Observable10 categorical palette `#4269d0 #efb118 #ff725c #6cc5b0 #3ca951 #ff8ab7 #a463f2 #97bbf5 #9c6b4e #9498a0` | Restrained type, hover-reveal detail, tabular numerals | Long-form reading layout; the viewer is an instrument, not an article |

Two observations drive the design. First, every stage-resolved atlas above treats stages as separate files or separate pages. None has a continuous time axis with interpolated geometry. The timeline is therefore the primary control in this viewer, and the layout gives it the full width. Second, the viewers that scientists use daily (Allen, eMouseAtlas, mapzebrain) all pair an ontology tree with a visibility toggle per node. We keep that pattern.

---

## 1. Users and moments of use

| Moment | Device and environment | Distance to screen | Pointer | What the user needs |
|---|---|---|---|---|
| M1 Talk speaker | Laptop mirrored to a projector, dark room, 1920x1080 or 1280x720 output | Speaker 0.5 m; audience 5 to 20 m | Trackpad, clicker, arrow keys | Hide every control that is not the timeline; large readout; instant stage steps; no surprise pop-ups |
| M2 Poster visitor | Phone from a QR code, bright hall, 390x844 portrait | 0.3 m | Thumb, one hand | Load in seconds on a hall network; a big thumb target; the state the poster author chose, restored from the URL |
| M3 Lab member exploring | Laptop or external monitor, 1440x900 and up | 0.5 m | Mouse or trackpad, keyboard | Tree, search, ZFA definitions, links to ZFIN, multi-select, section planes |
| M4 Slide or figure author | Same as M3 | 0.5 m | Mouse, keyboard | Deterministic camera and time from a URL; PNG at 2x or 4x with a transparent background; labels and a scale bar on demand |

Derived requirements:

- **UX-US-01** Every control that can be hit with a pointer has a target of at least 44 by 44 CSS px. WCAG 2.2 requires 24 by 24 px at level AA ([SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)) and 44 by 44 px at level AAA ([SC 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)). We meet AAA because M1 uses a trackpad from across a lectern and M2 uses a thumb.
- **UX-US-02** Text contrast is at least 4.5:1 for text under 24 px and 3:1 for larger text; controls and swatches are at least 3:1 against their surroundings ([SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Section 4 lists every token with its measured ratio.
- **UX-US-03** The full view state (time, selection, camera, hidden systems, x-ray, section, theme, units, snap) round-trips through the URL. Section 6 defines the parameters. A URL pasted into a slide restores the exact view.
- **UX-US-04** Presentation mode hides all chrome except a timeline strip that appears on pointer movement or key press and hides after 3 s of idle. The keyboard alone drives time, view presets, and bookmarks.
- **UX-US-05** First interactive frame within 2 s on a 10 Mbit/s connection for M2. Geometry is procedural, so the payload is the ontology subset and parameter keyframes, not meshes. The engineering team confirms the budget with a measurement; this brief sets the target.
- **UX-US-06** Dark theme is the default because M1 is the primary moment and a black background on a projector hides bezels and light spill. Light theme is one click away and is the default when `?embed=1` is combined with `theme=light`.
- **UX-US-07** No action opens a modal dialog during M1 except the export dialog, which the speaker opens on purpose.

---

## 2. Layout

### 2.1 Breakpoints and regions

| Name | Width | Rail | Card | Timeline | Notes |
|---|---|---|---|---|---|
| Phone | under 640 px | Sheet from the bottom, opened by a "Layers" button | Bottom sheet with peek (96 px), half (50 dvh), full (90 dvh) detents | Compact: 88 px, period bands only | One column |
| Tablet | 640 to 1279 px | 56 px icon strip; expands to 280 px overlay on tap | 360 px overlay sheet from the right | 96 px, headline ticks only | Viewer keeps full width behind overlays |
| Desktop | 1280 px and up | 280 px docked; collapsible to 0 with a 36 px handle | 340 px docked; collapses when nothing is selected and no stage card is pinned | 112 px, all ticks that fit | Three columns plus top and bottom bars |
| Presentation | any | hidden | 320 px floating card, top right, only while a selection exists | 64 px strip, auto-hide | Toggle with `P` or the Present button |

The viewer canvas always fills the space that remains. Panels never cover the fish at the default camera on desktop. On tablet and phone the camera framing shifts up by half the sheet height when a sheet opens, so the selected structure stays visible. human-atlas does the same with `camera.setViewOffset` in `app/scene.tsx`.

### 2.2 Desktop wireframe (1440 x 900 reference)

```
+------------------------------------------------------------------------------------------------+
| [fish] Zebrafish Atlas   [ Search structures, ZFA ids, synonyms...      Ctrl K ]   [Lat][Dor][Ven][Ant][3/4]  [sun/moon] [camera] [link] [present] [info] |  48 px
+----------------------+-------------------------------------------------------------+-----------+
| SYSTEMS        15/15 |                                                             | Heart     |
| [o] Nervous     [eye]|                                                             | ZFA:0000114 |
| [o] Sensory     [eye]|                                                             | Pharyngula:High-pec -> Adult |
| [o] Cardiovasc  [eye]|                                                             |           |
| [o] Hematopoie  [eye]|                                                             | Definition|
| [o] Musculature [eye]|                    (3D viewer, canvas)                      | The muscular organ that pumps ...|
| [o] Skeletal    [eye]|                                                             |           |
| [o] Integument  [eye]|                                                             | Events    |
| [o] Digestive   [eye]|                                                             | 22 hpf cardiac cone |
| [o] Respiratory [eye]|                                                             | 24 hpf first beat |
| [o] Renal       [eye]|                                                             | 36 hpf looping |
| [o] Reproductive[eye]|                                                             |           |
| [o] Endocrine   [eye]|                                                             | [Open in ZFIN ->] |
| [o] Immune      [eye]|                                                             | [Isolate] [Hide] |
| [o] Fins        [eye]|                                                             | [Jump to 42 hpf] |
| [o] Yolk        [eye]|                                                             |           |
| ---------------------|                                                             |           |
| X-ray skin  [====o--]|                                                             |           |
| Section  [Off|S|C|T] |  24 hpf | Prim-5 | 1.9 mm            [A-P D-V gizmo] [fit]   |           |
| ---------------------|                                                             |           |
| TREE  [only present] |                                                             |           |
| v whole organism     |                                                             |           |
|   v nervous system   |                                                             |           |
|     > brain          |                                                             |           |
|     > spinal cord    |                                                             |           |
|   > cardiovascular   |                                                             |           |
| 280 px               |                                                             | 340 px    |
+----------------------+-------------------------------------------------------------+-----------+
| Zygote Cleavage Blastula Gastrula   Segmentation      Pharyngula       Hatching   Larval        Juvenile   Adult |  28 px labels
| [==|======|=========|=========|============|============|=======|==========|=====|========]     |  40 px track
|        ^ thumb with stage card above                                                            |
| 24 hpf | Prim-5 | 1.9 mm     [|<] [<] [play] [>] [>|]   1x [v]   [magnet snap]   [hpf|dpf|auto] [keyboard] |  36 px transport (112 px total)
+------------------------------------------------------------------------------------------------+
```

### 2.3 Tablet wireframe (1024 x 768)

```
+---------------------------------------------------------------------------+
| [fish] Zebrafish Atlas   [ Search...  ]      [Lat][Dor][3/4] [..] [present]|  48 px
+----+----------------------------------------------------------------------+
|[=] |                                                     +--------------+ |
|[o] |                                                     | Heart        | |
|[o] |                                                     | ZFA:0000114  | |
|[o] |                (3D viewer)                          | ...          | |
|[o] |                                                     | [Jump 42 hpf]| |
|[o] |                                                     +--------------+ |
|[o] |   24 hpf | Prim-5 | 1.9 mm                     360 px overlay sheet  |
| 56 |                                                                      |
+----+----------------------------------------------------------------------+
| Zyg Cleav Blast Gastr  Segmentation   Pharyngula   Hatch  Larval  Juv Adult|
| [==|=====|=====|======|============|============|=====|=========|====|===] |  96 px total
| 24 hpf | Prim-5     [<] [play] [>]   1x   [snap]   [hpf|dpf]               |
+---------------------------------------------------------------------------+
```

The 56 px strip holds the 15 system swatches as 44 px toggle buttons. A "Layers" button at its top expands the full rail as a 280 px overlay.

### 2.4 Phone wireframe (390 x 844 portrait)

```
+--------------------------------------+
| [fish] Zebrafish Atlas  [search][=]  |  44 px + safe area
+--------------------------------------+
|                                      |
|                                      |
|                                      |
|            (3D viewer)               |
|                                      |
|                                      |
|                                      |
|   24 hpf | Prim-5 | 1.9 mm    [3/4]  |  readout chip 32 px, view preset cycler
+--------------------------------------+
| Heart  ZFA:0000114        [^] [x]    |  card peek 96 px (drag up for half or full)
| Pharyngula:High-pec -> Adult         |
+--------------------------------------+
| Zyg|Clv|Blst|Gast|Segm|Phar|Ht|Larv|J|A|  band strip 32 px, no stage ticks
|                 ^                    |
| [|<]  [<]   [ play ]   [>]   [snap]  |  transport 44 px (88 px total) + safe area
+--------------------------------------+
```

The "[=]" button opens the Layers sheet (systems, x-ray, section, tree) from the bottom at the half detent. Speed and units live in an overflow menu behind a long press on the play button and in the Layers sheet. The band strip is a full-width `role="slider"`; the thumb is a 4 px line with a 44 px invisible hit area.

### 2.5 Presentation mode wireframe (1920 x 1080)

```
+--------------------------------------------------------------------------------------+
|                                                              +-------------------+   |
|                                                              | Heart             |   |
|                                                              | ZFA:0000114       |   |
|                        (3D viewer, full bleed)               | High-pec -> Adult |   |
|                                                              +-------------------+   |
|                                                                                      |
|                                                                                      |
|  24 hpf | Prim-5 | 1.9 mm   (28 px readout)                                          |
|--------------------------------------------------------------------------------------|
| [====|=======|==========|==========|=============|=============|========|====|===|==] |  64 px strip, auto-hide
+--------------------------------------------------------------------------------------+
```

The card appears only while a structure is selected. The strip shows band fills, the thumb, and the period labels at 14 px; no transport buttons. The cursor hides after 2 s of idle.

### 2.6 Component inventory

| Component | Desktop size | Contents | Requirement |
|---|---|---|---|
| Top bar | 48 px high, full width | Title (15 px, 600), search field 360 px, view preset segmented control (5 buttons of 40 px), theme toggle, export, copy link, present, help | UX-LY-01 |
| Search | 360 px wide, 36 px high; `Ctrl K` or `/` focuses it | Matches ZFA names and synonyms (`anatomy_synonyms.txt`, 2994 rows) and ZFA ids; results list shows name, system swatch, stage range; Enter selects and, if the structure is absent at `t`, offers "Jump to <start stage>" | UX-LY-02 |
| Rail | 280 px wide | Systems list (15 rows of 36 px), presets row (All, None, Embryo, Organs, Skeleton), x-ray slider, section control, tree | UX-LY-03 |
| System row | 36 px high | 10 px colour dot, name (13 px), count of visible structures (11 px, tabular), eye toggle button 32 px inside a 44 px hit area | UX-LY-04 |
| Tree | remaining rail height, virtualised | ZFA `part of` hierarchy under `whole organism` (ZFA:0001094); row 28 px, indent 16 px per level, disclosure chevron 16 px, name 13 px, swatch 8 px, eye 24 px; rows absent at `t` render at 45 percent opacity with a clock icon | UX-LY-05 |
| Viewer overlays | inside the canvas | Readout chip bottom left (see 3.9), orientation gizmo 64 px bottom right with A, P, D, V labels, fit-to-view button 36 px, hover chip | UX-LY-06 |
| Card | 340 px wide | Header: name (20 px, 600), ZFA id (12 px, mono, copy on click), system chip; body: stage range, definition (14 px, 1.6 line height), developmental events (timeline list), synonyms (collapsed), "Open in ZFIN" (`https://zfin.org/<ZFA id>`); actions: Isolate, Hide, Jump to appearance | UX-LY-07 |
| Stage card (card fallback) | 340 px wide | When no structure is selected the card shows the current stage: name, ZFS id, period, hpf range, landmark text, body length, and the list of structures that first appear in this stage | UX-LY-08 |
| Timeline bar | 112 px high, full width | See section 3 | UX-TL |

- **UX-LY-09** Panels use a solid surface colour in the dark theme (no blur, no translucency). Translucent blur over a moving 3D scene costs GPU time on projector laptops and reduces text contrast. The light theme may use `backdrop-filter: blur(16px)` at 92 percent surface opacity, which is the human-atlas approach (`.glass` in `app/globals.css`).
- **UX-LY-10** The rail and the card are resizable by drag between 240 and 400 px. The sizes persist in `localStorage`.
- **UX-LY-11** Collapsing the rail or the card animates the width over 200 ms with `cubic-bezier(0.2, 0, 0, 1)`; the canvas resizes on each frame so the fish does not jump.
- **UX-LY-12** Zebrafish convention places anterior to the left and dorsal up in lateral views. The Lateral preset and the gizmo follow that convention. At first load the viewer shows the 3/4 preset at the time given in the URL. When the URL carries no time, it opens at 24 hpf (Prim-5). Prim-5 is the first pharyngula stage and shows a recognisable fish with a beating heart ([ZFIN staging table](https://zfin.org/zf_info/zfbook/stages/index.html)).

---

## 3. Timeline bar

### 3.1 Geometry

| Element | Desktop | Tablet | Phone | Presentation |
|---|---|---|---|---|
| Bar height | 112 px | 96 px | 88 px | 64 px |
| Horizontal padding | 24 px | 16 px | 16 px | 32 px |
| Period label row | 28 px, 12 px text | 24 px, 11 px text | none (labels inside bands, 10 px, abbreviated) | 20 px, 14 px text |
| Track row | 40 px; band fill 24 px tall, vertically centred | 36 px; fill 22 px | 32 px; fill 32 px | 44 px; fill 28 px |
| Tick row | inside track row: 6 px stage ticks under the fill, 10 px period ticks | 6 px headline ticks only | none | none |
| Transport row | 36 px | 32 px | 44 px | none |
| Thumb | 2 px line across the track row plus a 16 px handle circle centred on the fill | same | 4 px line, no circle | 3 px line plus 20 px circle |
| Thumb hit area | 44 x 44 px centred on the handle | same | 44 x 56 px | 56 x 56 px |
| Stage card above thumb | 220 x 60 px, 8 px above the fill, arrow 8 px | 200 x 56 px | shown as the readout chip instead | 260 x 68 px |

The track width `W` equals the bar width minus twice the padding. At 1440 px wide that gives 1392 px on desktop. The check script uses 1200 px, 700 px and 358 px as reference widths for desktop, tablet and phone.

### 3.2 Non-linear scale

**UX-TL-01** The track maps time to position with a piecewise-linear function through the anchors below. Between anchors the mapping is linear in hpf. The inverse is the same table read backwards.

| Anchor | hpf | dpf | Fraction of track | Segment width | Reason |
|---|---|---|---|---|---|
| A0 | 0 | 0 | 0.00 | | Zygote start |
| A1 | 0.75 | | 0.02 | 2 % | Zygote period, 1 stage |
| A2 | 2.25 | | 0.08 | 6 % | Cleavage, 6 stages |
| A3 | 5.25 | | 0.17 | 9 % | Blastula, 9 stages |
| A4 | 10.33 | | 0.27 | 10 % | Gastrula, 6 stages |
| A5 | 24 | 1 | 0.38 | 11 % | Segmentation, 6 stages |
| A6 | 48 | 2 | 0.50 | 12 % | Pharyngula, 4 stages |
| A7 | 72 | 3 | 0.57 | 7 % | Hatching, 2 stages |
| A8 | 168 | 7 | 0.67 | 10 % | Larval days 3 to 7, 4 stages of 24 h |
| A9 | 720 | 30 | 0.81 | 14 % | Larval days 7 to 29, 3 stages |
| A10 | 1080 | 45 | 0.86 | 5 % | Juvenile days 30 to 44 |
| A11 | 2160 | 90 | 0.92 | 6 % | Juvenile days 45 to 89 |
| A12 | 4320 | 180 | 1.00 | 8 % | Adult band; the axis ends at 180 dpf |

Result: 0 to 72 hpf occupies 57 percent of the track, 3 to 90 dpf occupies 35 percent, and the adult band occupies 8 percent. Stage boundaries and period boundaries come from `stage_ontology.txt`.

Reasoning. The ZFS places 34 of its 43 named stages inside the first 72 hpf. A linear axis to 180 dpf would give those 34 stages 1.7 percent of the track (72 / 4320). A `log10(1 + t)` axis gives them 51 percent, close to the target. That axis spends 14 percent of the track on the first 2.25 h. Those 2.25 h hold 7 stages that all look like a ball of cells at whole-body scale. Piecewise-linear anchors give each period width in proportion to how much its geometry changes. They keep every stage boundary at a fixed pixel. They give engineers a table instead of a formula. The check script prints the alternative values.

The axis ends at 180 dpf rather than the ZFS adult end of 17520 hpf (730 dpf). Sexual maturity is reached at about 17.5 to 18.3 mm standard length ([Parichy et al. 2009, PMC3030279](https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/)); adult body length is 1.8 to 3.7 cm in the wild and up to 4 to 5 cm ([Wikipedia](https://en.wikipedia.org/wiki/Zebrafish)); the ZFS defines no stage after Adult. Nothing on the axis changes after 180 dpf except a modest length increase, so the band represents "adult" as one state. The adult band label reads "Adult (90 dpf+)".

**UX-TL-02** Per-stage widths at a 1200 px track (from the check script): the narrowest stage is Gastrula:Bud at 7.8 px; Germ-ring is 8.0 px; every pharyngula stage is 36 px; Larval day stages are 30 px; Adult is 96 px. At 700 px the narrowest is 4.5 px and at 358 px it is 2.3 px. The tick display rules in 3.4 follow from these numbers.

### 3.3 Period bands

- **UX-TL-03** Each period is a filled band on the track in its period ramp colour (section 4.4). The fill opacity is 55 percent in the dark theme and 35 percent in the light theme, over the surface colour. The band under the thumb ("active period") renders at 100 percent opacity.
- **UX-TL-04** Bands are separated by a 1 px gap in the background colour. Every band has a 2 px top border in its full ramp colour. The border keeps adjacent bands distinct where the fills are close under colour vision deficiency (see 4.4 for measured values).
- **UX-TL-05** Period labels sit in the label row above the band, left-aligned to the band start with a 6 px inset. They use 12 px text at weight 500 in the text colour. A label that would overflow its band is abbreviated (Zyg, Clv, Bla, Gas, Seg, Pha, Hat, Lar, Juv, Adu). The tooltip of an abbreviated label shows the full name. Labels never overlap; the abbreviation step runs per band from the narrowest up.
- **UX-TL-06** Hovering a band highlights it (fill to 80 percent, 100 ms) and shows the period tooltip: period name, hpf range, stage count, and one landmark sentence. Clicking a band moves the thumb to the band start.

### 3.4 Stage ticks and headline labels

- **UX-TL-07** Every stage start gets a tick: 1 px wide, 6 px tall, in the muted text colour, drawn below the fill. Period starts get a 10 px tick at 2 px width.
- **UX-TL-08** A stage tick is drawn only when the distance to the previous drawn tick is at least 8 px. At 1200 px every tick is drawn except where blastula and early gastrula ticks fall under 8 px; those collapse to the period tick and the headline ticks. At tablet widths only headline ticks are drawn. On phone no ticks are drawn.
- **UX-TL-09** Headline stages carry a short label under the tick (10 px, muted): 1-cell, 64-cell, Sphere, Shield, Bud, 10 s (somites), 20 s, Prim-5, Prim-25, Long-pec, 3 d, 5 d, 7 d, 14 d, 30 d, 45 d, 90 d. Labels are hidden when two would overlap, in order of priority from the longest stage to the shortest. The label uses `font-variant-numeric: tabular-nums`.
- **UX-TL-10** Every drawn tick has a 12 px wide invisible hit area for hover only; clicks go to the track.

### 3.5 Hover tooltip

- **UX-TL-11** Hovering the track shows a tooltip above the pointer after 150 ms: line 1 the stage name and period (13 px, 600); line 2 the time as "24 hpf" or "4.5 dpf" plus the ZFS id in the muted colour; line 3 the landmark sentence from ZFIN (12 px). The tooltip is 240 px wide maximum, clamped inside the bar horizontally, and does not intercept pointer events. A 2 px marker line in the accent colour shows the hovered time on the track.
- **UX-TL-12** Landmark sentences come from the ZFIN staging table ([source](https://zfin.org/zf_info/zfbook/stages/index.html)), for example Prim-5: "early pigmentation, heartbeat"; Long-pec: "elongated pectoral fin buds"; Shield: "embryonic shield visible". The data model stores one sentence per stage.

### 3.6 Thumb and stage card

- **UX-TL-13** The thumb is a vertical line across the track row plus a 16 px circular handle. The handle has a 2 px ring in the background colour. Its fill colour is the accent colour. Pressed state scales the handle to 20 px over 100 ms. Focus state adds the 2 px focus ring at 2 px offset.
- **UX-TL-14** While the thumb is dragged, hovered, or focused, the stage card floats above it: stage name (14 px, 600), time and ZFS id (12 px, tabular), body length when known (12 px). The card fades and rises 4 px over 120 ms on show and fades over 100 ms on hide. During drag the card follows the thumb without transition.
- **UX-TL-15** Dragging updates `t` on every pointer move; the 3D scene interpolates on every frame. Snap (3.8) changes only where the thumb rests on release and on arrow-key steps.
- **UX-TL-16** Clicking the track at a new position moves the thumb there over 200 ms with `cubic-bezier(0.2, 0, 0, 1)`, and the scene animates through the intermediate times. With `prefers-reduced-motion: reduce` the move is instant.

### 3.7 Transport controls

| Control | Icon (lucide) | Size | Behaviour | Keyboard |
|---|---|---|---|---|
| First stage | `skip-back` | 36 px in a 44 px area | `t` = 0 | `Home` |
| Previous stage | `rewind` | 36 px | `t` = start of the previous stage | `ArrowLeft` |
| Play or pause | `play` / `pause` | 44 px, accent fill | Advances the thumb at a constant track speed | `Space` |
| Next stage | `fast-forward` | 36 px | `t` = start of the next stage | `ArrowRight` |
| Last stage | `skip-forward` | 36 px | `t` = 2160 (Adult start) | `End` |
| Speed | menu button with text "1x" | 36 px | Cycles 0.5x, 1x, 2x, 4x, 8x; menu lists them | `[` slower, `]` faster |
| Snap to stage | `magnet` toggle | 36 px | See 3.8 | `S` |
| Units | segmented hpf, dpf, auto | 3 x 36 px | See 3.9 | `U` cycles |
| Keyboard help | `keyboard` | 36 px | Opens the shortcut sheet | `?` |

- **UX-TL-17** Playback speed 1x moves the thumb across the whole track in 60 s. The track is non-linear, so 1x is defined in track distance, not hpf; a constant hpf rate would spend 59 of 60 seconds after 3 dpf. 0.5x takes 120 s and 8x takes 7.5 s. Playback stops at the axis end and the button returns to "play".
- **UX-TL-18** Optional play range: `Shift+Click` on the track sets an in-point and a second `Shift+Click` sets an out-point. The range is drawn as two 2 px markers with a 20 percent accent fill between them. Play loops within the range. `Shift+Click` on a marker clears it. This is a phase 2 feature.
- **UX-TL-19** Disabled states: Previous stage and First stage are disabled at `t = 0`; Next and Last are disabled at the axis end. Disabled buttons render at 35 percent opacity and remain focusable so screen readers can announce them.

### 3.8 Snap-to-stage

- **UX-TL-20** Snap is on by default in presentation mode and off elsewhere. The state is in the URL (`snap=1`).
- **UX-TL-21** With snap on, releasing the thumb moves it to the nearest stage start if that start lies within 6 px, otherwise it stays. Arrow keys always step by stage, snap or not. `Shift+ArrowLeft` and `Shift+ArrowRight` step by 1 hpf before 72 hpf and by 1 dpf after. `PageUp` and `PageDown` step by period.
- **UX-TL-22** With snap on, the tooltip and the card show the stage the thumb sits on and omit the interpolated time.

### 3.9 Current-time readout and units

- **UX-TL-23** The readout reads `<time> | <stage> | <length>`, for example `24 hpf | Prim-5 | 1.9 mm`. On desktop and tablet it sits at the left of the transport row. On phone and in presentation mode it is a chip inside the viewer. Font 14 px (desktop), 20 px (presentation), 500 weight, `tabular-nums`. The separators are `|` with 8 px padding.
- **UX-TL-24** Time formatting: under 72 hpf show hpf with one decimal only when `t` is not an integer and snap is off (`26.5 hpf`); from 72 hpf show dpf with one decimal under 10 dpf (`4.5 dpf`) and integers above (`21 dpf`). The units switch forces hpf or dpf for the whole axis; `auto` applies the rule above. The stage tooltip shows both units after 72 hpf (`72 hpf, 3 dpf`).
- **UX-TL-25** Length values come from the ZFIN staging table ([source](https://zfin.org/zf_info/zfbook/stages/index.html)). That table lists embryo length (EL) for segmentation and pharyngula stages and total body length for larval days. Values: 14-19 somites 0.9 mm; 20-25 somites 1.4 mm; 26+ somites 1.6 mm; Prim-5 1.9 mm; Prim-15 2.5 mm; Prim-25 2.7 mm; High-pec 2.9 mm; Long-pec 3.1 mm; Pec-fin 3.3 mm; Day 5 3.9 mm; Day 6 4.2 mm. The same page gives Protruding-mouth 3.5 mm, Day 4 3.7 mm, Days 7-13 4.5 mm, Days 14-20 6.2 mm and Days 21-29 7.8 mm (unverified: read from a page summary, not from the verbatim table text). For juvenile and adult, use standard length milestones from [Parichy et al. 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/): juvenile at 10.9 to 11.7 mm and adult at 17.5 to 18.3 mm and above. Between listed values the readout interpolates linearly and appends "~". When no value exists (before 16 hpf) the length field is omitted.
- **UX-TL-26** The readout is a live region (`aria-live="polite"`) that announces at most once per 500 ms during playback and once per release during drag.

### 3.10 Keyboard shortcuts

| Key | Action | Key | Action |
|---|---|---|---|
| `Space` | Play or pause | `S` | Snap toggle |
| `ArrowLeft` / `ArrowRight` | Previous or next stage | `U` | Cycle units |
| `Shift+Arrow` | Step 1 hpf or 1 dpf | `1` to `5` | View presets Lateral, Dorsal, Ventral, Anterior, 3/4 |
| `PageUp` / `PageDown` | Previous or next period | `R` | Reset camera; `Shift+R` reset all |
| `Home` / `End` | Axis start or Adult start | `X` | Toggle x-ray between 0 and the last value |
| `[` / `]` | Speed down or up | `I` | Isolate selection |
| `Ctrl+K` or `/` | Focus search | `H` | Hide selection |
| `Escape` | Exit isolate, close sheet, clear selection, exit presentation (in that order, one per press) | `P` | Presentation mode |
| `B` | Add bookmark; `Shift+B` open slide kit | `L` | Toggle 3D labels |
| `?` | Shortcut sheet | `Ctrl+C` with a selection | Copy "name (ZFA id)" |

Shortcuts are single keys without modifiers except where listed, so a presenter's clicker mapped to arrow keys works. Shortcuts are suppressed while focus is in a text field.

### 3.11 Touch behaviour

- **UX-TL-27** A single finger on the track scrubs after a 4 px horizontal movement; a tap moves the thumb. Vertical movement over 12 px before that threshold cancels the scrub and scrolls the page in embed mode.
- **UX-TL-28** While the user scrubs on phone, the readout chip at 18 px replaces the stage card. The chip moves to the top of the viewer so a thumb does not cover it.
- **UX-TL-29** The scrub follows the finger position with a 1:1 mapping; there is no fine-scrub gesture in phase 1. A long press (500 ms) on the track opens a stage list for precise selection.
- **UX-TL-30** Transport buttons on phone are 44 px with 8 px gaps; the play button is 56 px.

### 3.12 States and motion summary

| State | Track fill | Thumb | Card | Duration and easing |
|---|---|---|---|---|
| Idle | period bands at 55 % (dark) or 35 % (light) | accent, 16 px | hidden | |
| Hover band | band at 80 % | unchanged | period tooltip after 150 ms | 100 ms linear |
| Hover thumb | | 18 px | stage card | 120 ms `cubic-bezier(0.2, 0, 0, 1)` |
| Drag | active band 100 % | 20 px | stage card follows | none during drag |
| Focus | | focus ring 2 px | stage card | 0 ms |
| Playing | active band pulses between 100 % and 85 % every 1.2 s | moves | stage card visible | linear |
| Disabled button | | | | opacity 35 % |
| Reduced motion | no pulse | | fades only | all transitions 0 ms except opacity 150 ms |

---

## 4. Visual system

### 4.1 Themes and surfaces

| Token | Dark (default) | Light | Contrast check |
|---|---|---|---|
| `--bg` (viewer and page) | `#0E1116` | `#F5F6F7` | |
| `--surface` (panels) | `#161B22` | `#FFFFFF` | |
| `--surface-2` (inputs, chips) | `#1E252E` | `#EEF1F4` | |
| `--border` | `#2A323C` | `#D7DCE2` | |
| `--text` | `#E7EAEE` | `#1B1F24` | 15.7:1 on dark bg; 15.3:1 on light bg |
| `--text-muted` | `#9AA3AD` | `#5B6470` | 7.4:1; 5.5:1 |
| `--accent` (thumb, links, active) | `#7FD3F5` | `#0B6E99` | 11.3:1; 5.2:1 |
| `--focus` (focus ring, selection outline) | `#FFD166` | `#B45309` | 13.1:1; 4.6:1 |
| `--danger` | `#E4483C` | `#B81A1D` | 4.8:1; 6.1:1 |

Ratios computed with the WCAG relative-luminance formula in the check script.

- **UX-VS-01** The viewer background is a solid colour by default. A solid colour avoids banding on 8-bit projectors, keeps exported PNGs clean, and lets a transparent export composite onto any slide. An optional "studio" background adds a radial gradient from `--bg` lightened by 4 percent at the centre to `--bg` at the edges; it is off in export.
- **UX-VS-02** Theme follows `prefers-color-scheme` on first load, then the user's choice, stored in `localStorage` and in the URL when a link is copied.
- **UX-VS-03** The `theme` URL parameter overrides the stored choice so a slide link opens in the theme the author chose.

### 4.2 System palette (15 slots)

Design method. Each system has one hue. The dark theme uses lightness L* between 52 and 94; the light theme reuses the hue with L* between 39 and 60. The bounds come from the 3:1 requirement: against `#0E1116` a colour needs L* of about 41 or more, and against `#F5F6F7` about 59 or less. Hues start from Paul Tol's qualitative schemes ([Tol's page](https://sronpersonalpages.nl/~pault/), bright, vibrant, muted and light sets) and shift to satisfy the lightness windows. The check script measures contrast and, with the Machado et al. 2009 simulation matrices ([paper, DOI 10.1109/TVCG.2009.113](https://doi.org/10.1109/TVCG.2009.113); matrices transcribed at severity 1.0, unverified against the original tables in this session), the CIE76 colour difference between every pair under protanopia, deuteranopia and tritanopia.

| Slot | Proposed system (ZFA term) | Dark hex | L* | vs `#0E1116` | Light hex | L* | vs `#F5F6F7` |
|---|---|---|---|---|---|---|---|
| S01 | Nervous system (ZFA:0000396) | `#5B8DEF` | 59 | 5.9:1 | `#1863BF` | 43 | 5.4:1 |
| S02 | Sensory systems: visual, vestibuloauditory, lateral line, olfactory (ZFA:0000282) | `#7FD3F5` | 81 | 11.3:1 | `#2989A9` | 53 | 3.7:1 |
| S03 | Cardiovascular system (ZFA:0000010) | `#E4483C` | 53 | 4.8:1 | `#B81A1D` | 40 | 6.1:1 |
| S04 | Hematopoietic system (ZFA:0005023) | `#F28FA0` | 70 | 8.3:1 | `#B15567` | 48 | 4.4:1 |
| S05 | Musculature system (ZFA:0000548) | `#F08A3C` | 67 | 7.6:1 | `#B05500` | 47 | 4.7:1 |
| S06 | Skeletal system incl. notochord (ZFA:0000434, ZFA:0000135) | `#F0EDE4` | 94 | 16.2:1 | `#939088` | 60 | 2.9:1 |
| S07 | Integument incl. periderm (ZFA:0000368, ZFA:0001185) | `#C3CAD2` | 81 | 11.4:1 | `#7A8188` | 54 | 3.6:1 |
| S08 | Digestive system incl. liver and pancreas (ZFA:0000339, ZFA:0000036, ZFA:0001371) | `#A9713B` | 52 | 4.6:1 | `#84511C` | 39 | 6.1:1 |
| S09 | Respiratory system: gills, swim bladder (ZFA:0000272) | `#66D1C2` | 77 | 10.3:1 | `#028B7E` | 52 | 3.9:1 |
| S10 | Renal system (ZFA:0000163) | `#C6D34A` | 81 | 11.5:1 | `#7A8800` | 54 | 3.6:1 |
| S11 | Reproductive system (ZFA:0000632) | `#B067D6` | 56 | 5.2:1 | `#8641AC` | 41 | 5.8:1 |
| S12 | Endocrine system (ZFA:0001158) | `#D34FA7` | 54 | 4.9:1 | `#AA2382` | 40 | 5.9:1 |
| S13 | Immune and lymphatic systems (ZFA:0001159, ZFA:0000385) | `#3E9B4F` | 57 | 5.4:1 | `#01722A` | 42 | 5.6:1 |
| S14 | Fins (ZFA:0000108) | `#A9AFF2` | 73 | 9.1:1 | `#6972B0` | 50 | 4.2:1 |
| S15 | Yolk and extraembryonic: yolk, YSL, chorion (ZFA:0000084, ZFA:0000088, ZFA:0000329) | `#D9C79A` | 81 | 11.3:1 | `#8E7E55` | 53 | 3.7:1 |

ZFA ids and names come from `anatomy_item.txt`. The 3D material uses the hex as its base colour; the same hex fills the swatch in the rail and the tree.

Measured colour separation (CIE76 ΔE, dark palette): the closest pair under normal vision is S06 skeletal vs S07 integument at 15.9; every other pair is above 24. Under simulated deficiency the weakest pairs are S07 vs S09 (deutan 5.2, protan 7.7) and S02 vs S09 (tritan 7.0). Next come S01 vs S11 (protan 7.9) and S03 vs S08 (deutan 8.4). The light palette has a narrower lightness window and is weaker: S07 vs S09 deutan 3.3 and S05 vs S10 deutan 4.4. Fifteen hue-coded categories cannot all be told apart under every deficiency; the rules below make colour redundant.

- **UX-VS-04** Colour never carries meaning alone. Every system row shows its name and an icon; every structure shows its name on hover; the card names the system in text; the tree groups by system.
- **UX-VS-05** Skin (S07) renders as a translucent shell at 15 percent opacity by default, so its swatch colour rarely competes with S09 in the scene. When x-ray is at 100 percent the skin is invisible.
- **UX-VS-06** A "reduced palette" setting maps the 15 systems onto the 8 Okabe-Ito colours ([hex values as tabulated by Wilke](https://clauswilke.com/dataviz/color-pitfalls.html)): G1 nervous and sensory `#0072B2`; G2 cardiovascular and hematopoietic `#D55E00`; G3 musculature `#E69F00`; G4 skeletal and fins `#F0E442`; G5 digestive, respiratory and renal `#009E73`; G6 reproductive, endocrine and immune `#CC79A7`; G7 integument `#56B4E9`; G8 yolk `#999999`. Measured minimum pair separation: 26.4 normal, 18.2 protan, 7.4 deutan (G6 vs G8), 16.2 tritan. In the light theme the yellow `#F0E442` has 1.2:1 contrast against the background. The rail swatch therefore gets a 1 px `--text-muted` outline in that mode.
- **UX-VS-07** Child structures inherit the system hue. Within a system, the tree assigns lightness steps of 6 L* per depth level. Steps alternate darker and lighter around the system base and clamp to the theme window. This follows the Allen practice of visually related colours for ontologically related structures ([Allen documentation](https://brain-map.org/support/documentation/allen-developing-mouse-brain-reference-atlas)).
- **UX-VS-08** Optional per-system icons in the rail, all present in lucide (checked against the `lucide-static` `tags.json`): `brain` S01, `eye` S02, `heart` S03, `droplets` S04, `activity` S05, `bone` S06, `shield` S07, `egg` S15, `wind` S09, `waves` S14, `dna` S11, `circle-dot` S12, `droplet` S10, `flag` S13, `box` S08. The mapping for S08 and S13 is weak; the team may drop icons for those and keep text.

### 4.3 Selection and state colours in 3D

| State | Treatment |
|---|---|
| Hover | Emissive tint of the base colour at 8 percent; 1 px outline in `--text` at 60 percent opacity; hover chip |
| Selected | OutlinePass with `visibleEdgeColor` = `--focus`, `edgeStrength` 4, `edgeThickness` 1.5, `edgeGlow` 0.4, `pulsePeriod` 0 ([OutlinePass source](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/postprocessing/OutlinePass.js) lists these parameters with defaults 3.0, 1.0, 0.0, 0); emissive at 15 percent |
| Multi-selected | Same outline; the card lists members |
| Hidden by user | Not rendered; the tree row shows `eye-off` and a strikethrough name |
| Not present at `t` | Not rendered; the tree row at 45 percent opacity with a `clock` icon |
| Isolated context | Other structures at 6 percent opacity in `--text-muted`, no depth write |
| Section cap | Cut faces filled with the base colour darkened by 20 L* |

### 4.4 Period ramp

An ordinal ramp for the 10 periods. Lightness rises by 5 L* per step, from 38 to 83. Hue rotates from violet through blue, teal and green to amber (LCh hue 290 to 60, chroma 38). Under any colour deficiency, neighbouring bands differ by at least the 5 L* step. Measured neighbour ΔE minima: 14.3 normal, 3.3 protan (Juvenile vs Adult), 5.7 deutan, 4.3 tritan (Segmentation vs Pharyngula). The 1 px gaps, the 2 px top borders and the text labels (UX-TL-04, UX-TL-05) carry the boundary where colour is weak.

| Period | Hex | L* | vs `#0E1116` | vs `#F5F6F7` |
|---|---|---|---|---|
| Zygote | `#485693` | 38 | 2.7:1 | 6.4:1 |
| Cleavage | `#046BA4` | 43 | 3.3:1 | 5.3:1 |
| Blastula | `#007C9E` | 48 | 3.9:1 | 4.4:1 |
| Gastrula | `#008C9B` | 53 | 4.7:1 | 3.7:1 |
| Segmentation | `#0B9C93` | 58 | 5.6:1 | 3.1:1 |
| Pharyngula | `#4FA983` | 63 | 6.6:1 | 2.6:1 |
| Hatching | `#82B275` | 68 | 7.7:1 | 2.3:1 |
| Larval | `#B1B971` | 73 | 9.0:1 | 1.9:1 |
| Juvenile | `#DEBD7A` | 78 | 10.5:1 | 1.7:1 |
| Adult | `#FEC29A` | 83 | 12.1:1 | 1.4:1 |

Band fills are decorative; the labels above them carry the information in `--text`, so the low ratios at the ends of the ramp do not violate UX-US-02. The active-period accent under the thumb uses `--accent`, not the ramp colour.

### 4.5 Typography

- **UX-VS-09** Typeface: Inter variable, self-hosted, SIL Open Font License 1.1 ([rsms.me/inter](https://rsms.me/inter/)). Fallback stack: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Enable `font-feature-settings: "tnum" 1, "ss01" 0` on numerals in the readout, ticks, tables and ids; Inter provides tabular numbers and a slashed zero as OpenType features ([same source](https://rsms.me/inter/)). IBM Plex Sans is an acceptable substitute if the team prefers it (license unverified in this session).
- **UX-VS-10** Monospace for ZFA and ZFS ids: `ui-monospace, "SF Mono", Menlo, Consolas, monospace` at 12 px.

| Role | Size | Weight | Line height | Where |
|---|---|---|---|---|
| Display | 32 px | 600 | 1.15 | Presentation readout stage name |
| Title | 20 px | 600 | 1.25 | Card header |
| Heading | 16 px | 600 | 1.3 | Rail section headers, dialogs |
| Body | 14 px | 400 | 1.6 | Definitions, descriptions |
| UI | 13 px | 500 | 1.4 | Buttons, tree rows, system rows |
| Caption | 12 px | 400 | 1.4 | Period labels, tooltips, meta |
| Micro | 11 px | 500 | 1.2 | Tick labels, counts |
| Presentation scale | multiply Body, UI and Caption by 1.25 | | | Presentation mode |

Distill sets 16 px body at 1.7 line height for long reading ([d-article.css](https://raw.githubusercontent.com/distillpub/template/master/src/styles/d-article.css)); the viewer uses 14 px because the card holds short definitions beside a canvas, and 16 px inside the About and help sheets.

### 4.6 Spacing, radius, elevation

| Token | Value |
|---|---|
| Space scale | 4, 8, 12, 16, 24, 32, 48 px |
| Panel padding | 16 px |
| Row height | 36 px (system row), 28 px (tree row), 44 px (touch row) |
| Radius | 4 px chips and tooltips, 8 px buttons and inputs, 12 px cards, 16 px sheets |
| Border | 1 px `--border` on every panel edge that touches the canvas |
| Elevation, dark theme | None; panels separate by colour and border. Floating cards: `0 8px 24px rgba(0,0,0,0.5)` |
| Elevation, light theme | Docked: `0 1px 2px rgba(20,30,40,0.06)`; floating: `0 1px 2px rgba(20,30,40,0.06), 0 12px 32px rgba(20,30,40,0.10)` |
| Focus ring | 2 px solid `--focus`, offset 2 px, radius follows the element |

### 4.7 Iconography

- **UX-VS-11** Icon set: [lucide](https://lucide.dev), 20 px in bars and rows, 16 px inside tree rows and chips, stroke width 1.75. Icons used, all verified present in `lucide-static` `tags.json`: `eye`, `eye-off`, `play`, `pause`, `skip-back`, `skip-forward`, `rewind`, `fast-forward`, `camera`, `link`, `share-2`, `copy`, `download`, `image`, `sun`, `moon`, `search`, `maximize`, `minimize`, `expand`, `shrink`, `rotate-ccw`, `scissors` (section), `scan` (x-ray), `layers`, `list-tree`, `settings`, `sliders-horizontal`, `info`, `external-link`, `chevron-right`, `chevron-down`, `keyboard`, `x`, `focus` (isolate), `crosshair`, `box`, `axis-3d`, `orbit`, `move-3d`, `rotate-3d`, `magnet`, `timer`, `bookmark`, `presentation`, `monitor`, `ruler`, `clock`, `hourglass`, `fish` (logo), `qr-code`, `printer`, `file-image`, `clipboard-copy`, `palette`, `contrast`, `target`, `locate`, `compass`.
- **UX-VS-12** Names checked and absent from that file, so not to be used: `slice`, `panel-left`, `panel-right`, `gauge`, `step-back`, `step-forward`, `circle-help`, `help-circle`, `sun-moon`, `scan-eye`, `fullscreen`, `sparkles`, `filter`, `chevrons-left`, `chevrons-right`. Use `info` for help and `expand` or `shrink` for fullscreen.

### 4.8 3D material look

- **UX-VS-13** Materials are matte. `MeshStandardMaterial` with `roughness` 0.55, `metalness` 0.05, `flatShading` false, `side` `FrontSide` for closed primitives and `DoubleSide` for sheets (fin folds, periderm). human-atlas uses roughness 0.53 and metalness 0.08 (`app/scene.tsx`); the small change removes specular hot spots on projectors. A low-intensity environment map (intensity 0.3) gives shape without glare.
- **UX-VS-14** Lighting: one hemisphere light (sky `--bg` lightened, ground `--bg`), one key directional light from anterodorsal-left at intensity 2.0, one rim light from posterior-right at 1.2. Light colours are neutral so system hues stay true. Lights are fixed to the camera so the lateral view is lit the same after an orbit.
- **UX-VS-15** Skin (S07) and chorion (in S15) are transparent: `transparent` true, `opacity` 0.15 (skin) and 0.10 (chorion), `depthWrite` false, rendered last. These property names and defaults follow the three.js `Material` documentation ([Material.js JSDoc](https://raw.githubusercontent.com/mrdoob/three.js/dev/src/materials/Material.js)). Yolk is opaque.
- **UX-VS-16** The x-ray slider maps 0 to 100 percent onto skin opacity 0.60 to 0.00. Above 50 percent it also maps onto musculature opacity 1.0 to 0.25, so internal organs become visible while the body outline stays. The default is 25 percent. Skin at 0.45 on a dark background reads as a body silhouette; skin 0.15 is the value at 75 percent. The team tunes the two defaults with real geometry.
- **UX-VS-17** Selection uses an outline pass and leaves the base colour unchanged, so the system colour stays readable while selected.
- **UX-VS-18** Ground plane: none. human-atlas draws a platform disc; a floating embryo has no floor, and a disc would break the transparent export.

### 4.9 Labels in 3D

- **UX-VS-19** Labels are HTML elements positioned by a `CSS2DRenderer`-style projection. HTML labels stay crisp at 4x export and follow the theme. Style: 12 px UI weight, `--text` on `--surface` at 85 percent opacity, 1 px `--border`, 4 px radius, padding 2 px 6 px. Each label has a 1 px leader line in `--text-muted` of 16 to 32 px and a 4 px anchor dot in the structure's colour.
- **UX-VS-20** At most 8 labels show at once. Priority: selected, hovered, pinned (by the user from the card), then the largest visible structures. A greedy pass hides any label whose box would overlap a higher-priority label. Labels are hidden during orbit and reappear 150 ms after the camera stops.
- **UX-VS-21** `L` toggles labels; the export dialog has its own "Include labels" checkbox; presentation mode starts with labels off.
- **UX-VS-22** A scale bar sits bottom right, 1.5 px thick, with the length in Caption type. Its length is 100 µm, 500 µm, 1 mm, 5 mm or 10 mm, chosen by camera distance. It is on in export by default and off on phone.

---

## 5. Interaction details

### 5.1 Pointer

| Gesture | Mouse and trackpad | Touch | Result | ID |
|---|---|---|---|---|
| Move over a structure | hover after 80 ms | none | Hover highlight, hover chip with the name, cursor `pointer` | UX-IN-01 |
| Click or tap | left click, under 5 px movement | tap, under 12 px movement, under 300 ms | Select; replaces selection; opens the card | UX-IN-02 |
| Double-click or double-tap | within 300 ms | same | Isolate the selection; camera fits it over 400 ms; other structures drop to 6 percent | UX-IN-03 |
| Shift+click | | none (use the card "Add" action or the tree with a long press) | Add or remove from a multi-selection, maximum 12 | UX-IN-04 |
| Right-click or long press | context menu at the pointer | long press 500 ms | Menu: Hide, Isolate, Add to selection, Copy name and ZFA id, Copy link to this structure, Open in ZFIN | UX-IN-05 |
| Click empty space | | tap | Clears the selection; a second `Escape` also clears | UX-IN-06 |
| Drag | left drag | one finger | Orbit around the target | UX-IN-07 |
| Right drag or `Shift`+drag | | two fingers | Pan, clamped to 1.5 times the model bounding box | UX-IN-08 |
| Wheel or pinch | | two fingers | Dolly toward the cursor (`zoomToCursor` true) | UX-IN-09 |

The 5 px and 12 px tap thresholds match human-atlas (`app/scene.tsx` uses 5 for mouse and 12 for touch).

### 5.2 Camera

- **UX-IN-10** Use `OrbitControls` with `enableDamping` true and `dampingFactor` 0.08. Property names and defaults are in the three.js source ([OrbitControls.js](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/controls/OrbitControls.js)): `dampingFactor` default 0.05, `minPolarAngle` 0, `maxPolarAngle` π, `autoRotateSpeed` 2.0.
- **UX-IN-11** Distance limits scale with the current body length `L_t`: `minDistance` 0.4 `L_t`, `maxDistance` 8 `L_t`. When `t` changes, the limits update but the camera does not move unless "follow growth" is on.
- **UX-IN-12** "Follow growth" (default on) keeps the fish framed as it grows: on each `t` change the controls target moves to the model centroid and the distance scales with `L_t` over 200 ms. Off, the camera stays fixed and the fish grows in place, which is the right choice for a size comparison across stages.
- **UX-IN-13** "Keep dorsal up" (default on) clamps `minPolarAngle` to 0.05 π and `maxPolarAngle` to 0.95 π. The user then cannot flip the fish upside down by accident. Off, the full sphere is available.
- **UX-IN-14** View presets and their camera directions in the model frame (x anterior, y dorsal, z left): Lateral from +z (left side, anterior to the screen left); Dorsal from +y; Ventral from −y; Anterior from +x; 3/4 from the unit vector (0.45, 0.35, 0.82). Transitions slerp the camera over 500 ms with `cubic-bezier(0.2, 0, 0, 1)`. Keys `1` to `5`.
- **UX-IN-15** Reset (`R`) returns to the 3/4 preset with fit-to-model and clears x-ray to default, section to off, and isolate. `Shift+R` also clears selection, hidden systems, and returns `t` to 24 hpf. Reset never changes the theme or units.
- **UX-IN-16** Auto-rotate is available in presentation mode at `autoRotateSpeed` 0.5. That is about 2 minutes per turn if the three.js default of 2.0 gives 30 s per turn (unverified). Any pointer or key input stops it.

### 5.3 X-ray and section

- **UX-IN-17** The x-ray slider lives in the rail under the systems list (desktop, tablet) and in the Layers sheet (phone). Range 0 to 100 in steps of 5; the value shows as a percentage. `X` toggles between 0 and the last non-zero value.
- **UX-IN-18** The section control is a segmented button Off, Sagittal, Coronal, Transverse. Next to it sit a position slider (−1 to +1 across the model bounding box on that axis) and a flip button. Sagittal cuts along the anterior-posterior axis in the dorsal-ventral plane and removes the left or right half. Coronal cuts parallel to the anterior-posterior axis and shows a horizontal slab. Transverse cuts perpendicular to the anterior-posterior axis. The axis names are unverified against a fish anatomy convention; the team should confirm them with a zebrafish anatomist. The names appear in the tooltip with an axis diagram.
- **UX-IN-19** Implementation: `renderer.localClippingEnabled = true`; one `THREE.Plane` in world space in each material's `clippingPlanes`; `clipShadows` true ([three.js clipping example](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_clipping.html)). Caps are drawn with a stencil pass in the base colour darkened by 20 L*. While the slider is dragged, the plane is shown as a translucent rectangle (accent at 12 percent, 1 px border); it hides 300 ms after release.
- **UX-IN-20** Section state is in the URL as `sec=<axis>:<position>` and is included in export.

### 5.4 Time and structure existence

- **UX-IN-21** When `t` crosses a structure's start stage during playback or a click-move, the structure appears. It scales from 0.6 to 1.0 about its own centroid and fades from 0 to 1 over 300 ms with `cubic-bezier(0.2, 0, 0, 1)`. Crossing back runs the reverse over 200 ms. When the user drags the thumb faster than 3 stages per second, appearances are instant to avoid ghost trails. With `prefers-reduced-motion` the animation is opacity only over 150 ms.
- **UX-IN-22** Structures fade out the same way at their ZFA end stage. Yolk, for example, ends at Larval:Day 5 in `anatomy_item.txt`.
- **UX-IN-23** When the selected structure does not exist at `t`, the card stays open. The header keeps the name; a badge under it reads "Not present at 26 hpf" in `--text-muted` with a `clock` icon; a primary button reads "Jump to Prim-25 (36 hpf)" using the start stage from `anatomy_item.txt`; the 3D outline is removed; the tree row shows the clock state. If the structure has ended, the badge reads "Annotated until Larval:Day 5; jump to Day 5 (120 hpf)".
- **UX-IN-24** The "appears at" button moves `t` with the standard 200 ms thumb motion. When "follow growth" is on, the camera frames the structure after it appears.
- **UX-IN-25** Search results and tree rows for absent structures remain selectable; selecting one opens the card in the state of UX-IN-23 without changing `t`. A setting "Jump to appearance on select" (default off; on in presentation mode) changes `t` immediately.
- **UX-IN-26** The tree filter "Only structures present now" (default on) hides absent rows; the count next to each system reads "present / total", for example "12 / 41".

### 5.5 Rail interactions

- **UX-IN-27** The eye toggle on a system row hides every structure in that system; `Alt+click` on an eye shows only that system (solo). A second `Alt+click` restores the previous set.
- **UX-IN-28** Presets: All; None; Embryo (S06, S07 at 0.45 opacity, S15, plus somites and notochord); Organs (S01, S02, S03, S08, S09, S10, S11, S12, S13 with skin at 0.10); Skeleton (S06 only, skin 0). Presets are one-click and show as `aria-pressed` segmented buttons.
- **UX-IN-29** Tree rows: click selects; the chevron expands; the eye hides; hover highlights the structure in 3D; the row scrolls into view when a structure is selected in 3D.

---

## 6. Export and share

### 6.1 PNG export

- **UX-EX-01** The export dialog opens from the `camera` button or `Ctrl+Shift+S`. It offers scale 1x, 2x, 4x of the current viewport and a transparent background toggle. Checkboxes: "Include labels", "Include scale bar", "Include readout" (time, stage, length as a text chip), "Include legend" (visible systems with swatches). The default is 2x, transparent off, labels as currently shown, scale bar on, readout on, legend off.
- **UX-EX-02** The render uses an offscreen render target at the chosen scale with `preserveDrawingBuffer` off; the longest edge is capped at 8192 px and the dialog states the resulting pixel size. Overlays (labels, scale bar, readout, legend) are drawn onto a 2D canvas over the WebGL image at the same scale so text stays sharp.
- **UX-EX-03** Transparent export renders with `alpha: true` and a clear colour of alpha 0; the skin's translucency composites correctly onto any slide background because the export uses premultiplied alpha.
- **UX-EX-04** File name: `zfatlas_<time>_<view>_<selection-or-all>_<scale>x.png`, for example `zfatlas_24hpf_lateral_heart_2x.png`. Time uses the readout format without spaces.
- **UX-EX-05** A "Copy image" action places the PNG on the clipboard where the browser allows it (Clipboard API `image/png`); otherwise the button is hidden.
- **UX-EX-06** Phase 2 adds SVG export of labels, scale bar and legend as a separate layer. It also adds a short MP4 or WebM of a time range at the current speed.

### 6.2 Links and URL state

- **UX-EX-07** URL parameters (all optional; absent means default):

| Param | Meaning | Example |
|---|---|---|
| `t` | time in hpf, float | `t=24` |
| `sel` | selected ZFA ids, comma separated, without the prefix | `sel=0000114,0000123` |
| `v` | view preset `lat`, `dor`, `ven`, `ant`, `tq`; or `cam=` for a free camera | `v=lat` |
| `cam` | camera position and target, six floats in model units | `cam=1.2,0.8,3.1,0,0,0` |
| `hide` | hidden system slots | `hide=S07,S15` |
| `xr` | x-ray 0 to 100 | `xr=60` |
| `sec` | section axis and position | `sec=sag:0.1` |
| `iso` | isolate on | `iso=1` |
| `theme` | `dark` or `light` | `theme=light` |
| `u` | units `hpf`, `dpf`, `auto` | `u=dpf` |
| `snap` | snap on | `snap=1` |
| `pal` | `std` or `oi` (Okabe-Ito reduced) | `pal=oi` |
| `labels` | labels on | `labels=1` |
| `embed` | embed mode | `embed=1` |
| `present` | start in presentation mode | `present=1` |
| `kit` | slide kit id from `localStorage` or a base64url-encoded kit | `kit=eyJ...` |

- **UX-EX-08** The address bar updates with `history.replaceState` at most every 300 ms during interaction and once on release, so the back button is not flooded. "Copy link" (`link` button or `Ctrl+L`) writes the full URL to the clipboard and shows a 2 s toast "Link copied" with the readout text.
- **UX-EX-09** "Copy link to structure" from the context menu adds `sel`. If the structure is absent at `t`, it also sets `t` to the start stage so the link opens on a visible structure.

### 6.3 Embed mode

- **UX-EX-10** `?embed=1` hides the top bar and the rail. It keeps the compact timeline (tablet spec) and a floating card. It adds a 28 px footer at bottom right with the link "Open in Zebrafish Atlas" and the ZFIN attribution. The page sets `touch-action: pan-y` on everything except the canvas and track so an embedding page still scrolls.
- **UX-EX-11** Embed mode accepts every other URL parameter, so an embedded frame can open on a specific time and selection. It never writes to `localStorage` and never shows the first-run hint.

### 6.4 Slide kit

- **UX-EX-12** A bookmark stores `{name, t, cam, sel, hide, xr, sec, iso, labels, notes}`. `B` adds the current view as a bookmark; `Shift+B` opens the kit panel (a 320 px sheet listing bookmarks with 96 px thumbnails rendered at capture time).
- **UX-EX-13** In presentation mode with a kit loaded, `ArrowRight` and `ArrowLeft` step between bookmarks instead of stages; the timeline strip shows bookmark markers as 8 px diamonds in `--focus` above the track. `Shift+Arrow` steps stages.
- **UX-EX-14** Stepping to a bookmark animates `t` over 600 ms and the camera over 500 ms, both with `cubic-bezier(0.2, 0, 0, 1)`. The audience sees the fish grow between bookmarks. With reduced motion the step is a cut.
- **UX-EX-15** The kit exports as JSON and as a ZIP of PNGs (one per bookmark at 2x, using the export settings). The JSON round-trips through the `kit` URL parameter for sharing; kits above 2 KB fall back to a "Download kit" file because URL length limits differ across browsers (unverified limit; the 2 KB threshold is a decision).
- **UX-EX-16** Starter kits ship with the app: "Embryogenesis in 8 views" (1-cell, Sphere, Shield, Bud, 10 somites, Prim-5, Long-pec, Protruding-mouth), and "Organ origins" (heart at 22 hpf, pronephros at 14 hpf, liver at 30 hpf, swim bladder at 5 dpf). The data-model file owns the exact times.

---

## 7. Accessibility

- **UX-AC-01** The track is a `role="slider"` with `aria-valuemin="0"`, `aria-valuemax="4320"`, `aria-valuenow` set to `t`, and `aria-valuetext` such as "24 hours post fertilization, Prim-5, Pharyngula period". Arrow keys, Home, End, Page Up and Page Down follow the WAI-ARIA slider pattern ([APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)); this brief maps Arrow to one stage and Page to one period, which the pattern allows as "one step" and "a larger increment".
- **UX-AC-02** The tree uses `role="tree"`, `role="treeitem"`, `role="group"`, `aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset`, and `aria-multiselectable="true"`. Keyboard: Down, Up, Right, Left, Home, End, Enter, Space, `*`, type-ahead, `Shift+Arrow`, `Ctrl+A` per the WAI-ARIA tree view pattern ([APG treeview](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)). The eye toggle inside a row is a `button` with `aria-pressed` and is reached with `Tab` from the focused row.
- **UX-AC-03** The canvas has `role="application"`, `aria-label="3D viewer"`, and `aria-describedby` pointing to a hidden paragraph that explains the keyboard alternatives: select from the tree or search, `1` to `5` for views, `Alt+Arrow` to orbit by 15 degrees, `Alt+Plus` and `Alt+Minus` to zoom by 10 percent.
- **UX-AC-04** A visually hidden `aria-live="polite"` region announces selection changes ("Heart selected, cardiovascular system, present from High-pec") and readout changes (UX-TL-26).
- **UX-AC-05** Every icon button has an `aria-label` and a visible tooltip on hover and focus after 400 ms. The tooltip shows the label and the shortcut, for example "Play (Space)".
- **UX-AC-06** Focus order: top bar left to right, rail top to bottom, viewer, card, timeline. Focus rings use `:focus-visible` with the 2 px `--focus` ring (contrast 13.1:1 dark, 4.6:1 light).
- **UX-AC-07** `prefers-reduced-motion: reduce` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)) disables: the playing pulse, camera slerps (cut instead), the appearance scale (opacity only), auto-rotate, and the thumb glide. Playback still works because the user starts it; the speed menu shows a note "Reduced motion is on".
- **UX-AC-08** Text meets 4.5:1 and UI meets 3:1 in both themes per the token table. Body text is never lighter than `--text-muted`.
- **UX-AC-09** Nothing relies on hover alone: every hover chip has a keyboard or card equivalent; every tooltip appears on focus.
- **UX-AC-10** Touch targets are at least 44 by 44 CSS px. This includes the thumb and the eye toggles (44 px hit area around a 32 px button). Tree chevrons sit in a 28 px row with a 44 px wide hit area.
- **UX-AC-11** The palette setting `pal=oi` and the per-system icons give colour-independent identification; the tree and card always state the system in text.
- **UX-AC-12** Zoom to 200 percent browser zoom reflows to the tablet layout and 400 percent to the phone layout; no horizontal scroll appears.

---

## 8. Empty, loading, error states and first-run hint

| State | Trigger | What the user sees | ID |
|---|---|---|---|
| Loading | first load | The layout skeleton (bars, rail, card outlines in `--surface-2`), a centred 1-cell embryo drawn from the first keyframe as soon as the ontology JSON arrives, and a 2 px progress bar under the top bar. Text under the embryo: "Building the atlas" and the current step ("Loading ontology", "Building geometry"). Target: first frame under 2 s (UX-US-05) | UX-ST-01 |
| Empty search | no match | "No structure matches 'xyz'. Search also covers ZFA synonyms and ids." plus three suggestions from a fuzzy match, each selectable | UX-ST-02 |
| No geometry | a ZFA term in the tree has no primitive yet | Card body shows the definition and a note "No 3D geometry yet for this term. Showing its parent: <name>" with a button to select the parent; the row in the tree shows a dashed swatch | UX-ST-03 |
| Nothing visible | user hid every system or isolate hid all at this `t` | A centred hint in the viewer: "Nothing is visible at 4 hpf. Show a system from the rail or jump to 24 hpf" with two buttons; the hint disappears on any change | UX-ST-04 |
| Structure absent | selection not present at `t` | Card badge and "Jump to" button (UX-IN-23) | UX-ST-05 |
| WebGL unavailable | context creation fails | A static PNG of the 3/4 view at 24 hpf, the message "This browser cannot run the 3D viewer. Try a current version of Chrome, Firefox or Safari.", and links to ZFIN and to the stage table. The timeline is hidden | UX-ST-06 |
| Context lost | `webglcontextlost` | A toast "The 3D view paused. Restoring…" and an automatic rebuild on `webglcontextrestored`; a "Reload viewer" button appears after 5 s | UX-ST-07 |
| Data error | ontology JSON fails | A centred card with "Could not load the atlas data (HTTP 503)" and a Retry button; the top bar stays so the user can read the About sheet | UX-ST-08 |
| Bad URL | unknown ZFA id or `t` out of range | Load the defaults, then a toast "Structure ZFA:9999999 is not in this atlas" or "Time clamped to 180 dpf" | UX-ST-09 |
| Offline (M2) | fetch fails after first load | The app is a static site and keeps working from cache once loaded; a toast "You are offline; ZFIN links will not open" | UX-ST-10 |

- **UX-ST-11** First-run hint: on the first visit (no `localStorage` key, not embed, not presentation) three chips appear over the viewer after the first frame: "Drag to orbit" near the fish, "Scrub time" above the thumb, "Click a structure" with an arrow toward the head. Each chip is 13 px on `--surface` with the 12 px radius. All chips fade after 6 s or on the first interaction, and never return. A "Show tips" item in the help menu replays them.
- **UX-ST-12** The About sheet (help button) states: the geometry is procedural and schematic, not measured meshes; stage timings are for 28.5 C from ZFIN; definitions and stage ranges come from the ZFA and ZFS with a version string; a link to the source repository and to `https://zfin.org/zf_info/zfbook/stages/index.html`.
- **UX-ST-13** Toasts appear bottom centre above the timeline, 44 px high, one at a time. They stay 2 s for confirmations and 6 s for errors, with a close button and `role="status"`.

---

## 9. Open questions for the team

1. The final list of 15 systems and their ZFA roots is owned by the data-model file. If that list differs, keep the slot hex values and reassign names; rerun the check script.
2. The section-plane axis names (sagittal, coronal, transverse) need confirmation from a zebrafish anatomist (UX-IN-18).
3. Body length values for 72 hpf to 29 dpf need a verbatim check against the ZFIN table or Kimmel et al. 1995 (UX-TL-25).
4. The x-ray defaults (UX-VS-16) and the label budget of 8 (UX-VS-20) need tuning against real procedural geometry.
5. The Machado 2009 matrices in the check script were transcribed from memory of the paper's published values; a maintainer should compare them with the original tables before the palette is frozen.
6. Whether playback speed should be defined in track distance (this brief) or in stage steps per second; a user test with two speakers would settle it.
