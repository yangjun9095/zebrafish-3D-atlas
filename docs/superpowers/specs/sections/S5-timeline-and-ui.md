> **Superseded draft.** The assembled specification
> [`../2026-09-06-zebrafish-3d-atlas-design.md`](../2026-09-06-zebrafish-3d-atlas-design.md)
> is authoritative. This file is the section draft written before reconciliation and it may
> disagree with the assembled specification. Written by AI coding agents (Claude Code) under
> the direction of Yang-Joon Kim, 2026-09-06.

## Timeline bar and user interface

This section specifies the timeline bar, the panels, the viewer interactions, the visual tokens, the accessibility rules and the application states. Research 07 owns every user experience value here (D11): sizes, durations, easing curves, colour tokens and the palette. Requirement ids of the form `UX-<AREA>-<NN>` come from research 07 unchanged. New requirements carry ids of the form `UI-<NN>`. Where the decision record and research 07 differ, this section follows the decision record and names the difference.

Abbreviations: hpf is hours post fertilization at 28.5 C. dpf is days post fertilization. SL is standard length. ZFA is the Zebrafish Anatomy Ontology. ZFS is the Zebrafish Stage Ontology. WCAG is the Web Content Accessibility Guidelines. ARIA is Accessible Rich Internet Applications.

Terms: the "timeline bar" is the bottom bar. The "track" is the slider element inside the timeline bar. The "thumb" is the handle on the track. The "stage card" is the floating card above the thumb. The "systems rail" is the left panel. The "info card" is the right panel. The "time axis" is the mapping between hpf and track position (D7). `t` is the current time in hpf. A "period" is one of the 10 ZFS stage groups in `stages.json`.

### Layout

#### Breakpoints and regions

Sizes come from research 07 section 2.1.

| Name | Width | Systems rail | Info card | Timeline bar | Columns |
|---|---|---|---|---|---|
| Phone | under 640 px | Bottom sheet, opened by a Layers button | Bottom sheet with peek (96 px), half (50 dvh) and full (90 dvh) detents | 88 px, period bands only | One |
| Tablet | 640 to 1279 px | 56 px icon strip; expands to a 280 px overlay on tap | 360 px overlay sheet from the right | 96 px, headline and period ticks | Viewer keeps full width behind overlays |
| Desktop | 1280 px and up | 280 px docked; collapses to a 36 px handle | 340 px docked; collapses when nothing is selected and no stage card is pinned | 112 px, all ticks that pass the 8 px rule | Three, plus top and bottom bars |
| Presentation | any | hidden | 320 px floating card, top right, only while a selection exists | 64 px strip, auto-hide | Canvas only |

The viewer canvas fills the space that remains. On desktop no panel covers the fish at the default camera. On tablet and phone, an open sheet shifts the camera framing up by half the sheet height (`camera.setViewOffset`). The selected structure stays visible.

#### Desktop wireframe (1440 x 900 reference)

```
+----------------------------------------------------------------------------------------------------+
| [fish] Zebrafish Atlas  [ Search structures, synonyms, ZFA ids   Ctrl K ]  [Lat][Dor][Ven][Ant][Pos][3/4]  [theme][export][share][present][settings][help] |  48 px
+----------------------+-------------------------------------------------------------+---------------+
| SYSTEMS      118/220 |                                                             | Heart         |
| [o] Early embryo [e] |                                                             | ZFA:0000114   |
| [o] Axial        [e] |                                                             | Cardiovascular|
| [o] Nervous      [e] |                                                             | High-pec -> Adult (ZFIN) |
| [o] Sensory      [e] |                                                             | ZFIN term now: heart tube |
| [o] Cardiovasc.  [e] |                    (3D viewer, canvas)                      |               |
| [o] Blood+immune [e] |                                                             | Definition    |
| [o] Respiratory  [e] |                                                             | The muscular  |
| [o] Digestive    [e] |                                                             | organ that... |
| [o] Excretory    [e] |                                                             |               |
| [o] Endocrine    [e] |                                                             | Events        |
| [o] Reproductive [e] |                                                             | 24 hpf beat   |
| [o] Skeletal     [e] |                                                             | 30 hpf looping|
| [o] Muscular     [e] |                                                             |               |
| [o] Fins         [e] |                                                             | [Open in ZFIN]|
| [o] Skin+pigment [e] |                                                             | [Isolate][Hide]|
| [All][None][Embryo][Organs][Skeleton]                                              | [Jump to 42 hpf]|
| X-ray      [==o----] |                                                             | Sources (3)   |
| Section [Off|S|F|T]  |   24 hpf | Prim-5 | 1.9 mm          [scale bar] [gizmo] [fit] | ZFIN CC BY 4.0|
| TREE  [x] present now|                                                             |               |
| v whole organism     |                                                             |               |
|   v cardiovascular   |                                                             |               |
|     > heart  4 / 5   |                                                             |               |
| 280 px               |                                                             | 340 px        |
+----------------------+-------------------------------------------------------------+---------------+
| Cleav Blastula Gastrula  Segmentation   Pharyngula    Hatching    Larval        Juvenile   Adult    |  28 px labels
| [|====|=======|=========|=============|=============|===========|==============|==========|=======] |  40 px track
|    . .  .   .    .   . .     . .  .        .  . .         .          .  .          .        .        |   8 px events
| 24 hpf | Prim-5 | 1.9 mm   [|<] [<] [play] [>] [>|]   1x [v]  [snap]  [hpf|dpf|auto]  [keys]      |  36 px transport
+----------------------------------------------------------------------------------------------------+   112 px total
```

The rail rows follow the order of the D5 table. The zygote band is 18.8 px wide at this width and carries no label (see period bands below).

#### Tablet wireframe (1024 x 768)

```
+---------------------------------------------------------------------------+
| [fish] Zebrafish Atlas   [ Search...  ]     [Lat][Dor][3/4] [..] [present] |  48 px
+----+----------------------------------------------------------------------+
|[=] |                                                     +--------------+ |
|[o] |                                                     | Heart        | |
|[o] |                                                     | ZFA:0000114  | |
|[o] |                (3D viewer)                          | ...          | |
|[o] |                                                     | [Jump 42 hpf]| |
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

#### Phone wireframe (390 x 844 portrait)

```
+--------------------------------------+
| [fish] Zebrafish Atlas  [search][=]  |  44 px + safe area
+--------------------------------------+
|                                      |
|            (3D viewer)               |
|                                      |
|   24 hpf | Prim-5 | 1.9 mm    [3/4]  |  readout chip 32 px, view preset cycler
+--------------------------------------+
| Heart  ZFA:0000114        [^] [x]    |  info card peek 96 px (drag up for half or full)
| High-pec -> Adult                    |
+--------------------------------------+
| ||Bla|Gas|Segm|Phar|Hatc|Larval|Juv|A|  band strip 32 px, no ticks
|                 ^                    |
| [|<]  [<]   [ play ]   [>]   [snap]  |  transport 44 px (88 px total) + safe area
+--------------------------------------+
```

The `[=]` button opens the Layers sheet (systems, x-ray, section, tree) from the bottom at the half detent. Speed and units live in the Layers sheet and behind a long press on the play button. The band strip is one `role="slider"` element. The thumb is a 4 px line with a 44 px invisible hit area.

#### Presentation mode wireframe (1920 x 1080)

```
+--------------------------------------------------------------------------------------+
|                                                              +-------------------+   |
|                                                              | Heart             |   |
|                        (3D viewer, full bleed)               | ZFA:0000114       |   |
|                                                              | High-pec -> Adult |   |
|                                                              +-------------------+   |
|  24 hpf | Prim-5 | 1.9 mm   (28 px readout chip)                                     |
|--------------------------------------------------------------------------------------|
| Cleav Blastula Gastrula Segmentation Pharyngula Hatching Larval    Juvenile  Adult    |  20 px labels, 14 px text
| [|====|=======|=========|============|============|=========|==============|=======|===] |  44 px track (64 px strip)
+--------------------------------------------------------------------------------------+
```

The info card appears only while a structure is selected. The strip shows band fills, ticks, the thumb and the period labels. It has no transport buttons. The cursor hides after 2 s of idle.

#### Layout rules

- **UX-LY-09** Panels use a solid surface colour in the dark theme. No blur, no translucency. The light theme may use `backdrop-filter: blur(16px)` at 92 percent surface opacity.
- **UX-LY-10** The systems rail and the info card resize by drag between 240 and 400 px. The sizes persist in `localStorage`.
- **UX-LY-11** Collapsing the rail or the info card animates the width over 200 ms with `cubic-bezier(0.2, 0, 0, 1)`. The canvas resizes on each frame so the fish does not jump.
- **UI-01** First load shows the lateral preset (D4). When the URL carries no `t`, the viewer opens at 24 hpf (Prim-5). Research 07 UX-LY-12 named the three-quarter preset; D4 names lateral as the default, and D4 wins.
- **UI-02** Presentation mode starts with `P` or the Present button. It hides every panel and bar. The timeline strip appears on pointer movement or on a key press and hides after 3 s of idle (UX-US-04). Presentation mode sets snap on (UX-TL-20), labels off (UX-VS-21) and "Jump to appearance on select" on (UX-IN-25). `Escape` exits. The readout, the period labels and the info card text scale by 1.25 (research 07 section 4.5).

### Timeline bar

#### Track geometry

Values come from research 07 section 3.1. The track width `W` equals the bar width minus twice the padding. At 1440 px wide `W` is 1392 px on desktop.

| Element | Desktop | Tablet | Phone | Presentation |
|---|---|---|---|---|
| Bar height | 112 px | 96 px | 88 px | 64 px |
| Horizontal padding | 24 px | 16 px | 16 px | 32 px |
| Period label row | 28 px, 12 px text | 24 px, 11 px text | none; labels inside bands, 10 px, abbreviated | 20 px, 14 px text |
| Track row | 40 px; band fill 24 px, centred | 36 px; fill 22 px | 32 px; fill 32 px | 44 px; fill 28 px |
| Tick row | inside the track row, under the fill: 6 px stage ticks, 10 px period ticks | 6 px headline and period ticks | none | inside the track row, as desktop |
| Event marker row | 8 px, under the track row | none | none | none |
| Transport row | 36 px | 32 px | 44 px | none |
| Thumb and hit area | 2 px line across the track row plus a 16 px handle on the fill; 44 x 44 px hit area | same | 4 px line, no circle; 44 x 56 px | 3 px line plus a 20 px handle; 56 x 56 px |
| Stage card above thumb | 220 x 60 px, 8 px above the fill, arrow 8 px | 200 x 56 px | readout chip instead | 260 x 68 px |

`W` at the reference widths: 1392 px (desktop 1440), 992 px (tablet 1024), 358 px (phone 390), 1856 px (presentation 1920).

#### The time axis mapping

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

/** Loaded from stages.json timeAxis.anchors. Values are the D7 segments as cumulative fractions. */
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

#### Period bands

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
- **UI-04** A band narrower than 28 px carries no label. The zygote band is under 28 px at every reference width and never carries a label; its name appears in the hover tooltip, the stage card and the readout. On phone the labels sit inside the bands at 10 px.
- **UX-TL-06** Hovering a band raises its fill to 80 percent over 100 ms and shows the period tooltip: period name, hpf range, stage count, one landmark sentence. Clicking a band moves the thumb to the band start.

#### Stage ticks

- **UX-TL-07** Every stage start gets a tick: 1 px wide, 6 px tall, in `--text-muted`, under the fill. Period starts get a 10 px tick at 2 px width. The axis end at 4320 hpf gets a 10 px tick.
- **UI-05** Tick candidates are the 44 stage starts and the axis end. Candidates are ranked: headline ticks first, then period starts, then other stage starts. The renderer walks the ranked list and draws a candidate only when it lies at least 8 px from every tick already drawn (D7). A tick that fails the test is skipped; its stage remains a snap target and a hover target.
- **UI-06** Tablet draws only headline and period candidates. Phone draws no ticks (UX-TL-08).
- **UX-TL-10** Every drawn tick has a 12 px wide invisible hit area for hover only. Clicks go to the track.

Measured result of UI-05 with the D7 mapping:

| Track width | Ticks drawn | Ticks skipped by the 8 px rule |
|---|---|---|
| 1392 px (desktop) | 39 of 45 | 4-cell, 16-cell, 64-cell, 128-cell, 512-cell, 1-4 somites |
| 1856 px (presentation) | 44 of 45 | 1-4 somites |
| 992 px (tablet, UI-06) | 26 of 45 | 1-4 somites and every non-headline, non-period stage |
| 358 px (phone) | 0 | all |

The 1-4 somites tick (10.33 hpf) sits 4.1 px after the bud headline tick at desktop width and yields to it; the segmentation band border still marks the period start (UX-TL-04). Cleavage stages are 0.25 hpf apart, or 6.3 px at desktop width, so every second cleavage tick draws.

#### Headline labels

The 18 headline ticks come from D7. Each carries a label under its tick: 10 px, weight 500, `--text-muted`, `font-variant-numeric: tabular-nums`, centred on the tick. The first label is left-aligned and the last is right-aligned.

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

- **UX-TL-09** When two label boxes would overlap, the renderer hides the label of the shorter stage. The implementation measures real label boxes. An estimate at 5.5 px per character hides "256-cell" (Sphere wins) and "High-pec" (Long-pec wins) at 1392 px. The tooltip and the stage card always carry the full stage name. Headline stages in `stages.json` carry `headline: true` and an `axisLabel` string; the renderer takes the label text from the data.

#### Event markers row

- **UI-07** Desktop shows an 8 px event marker row under the track row. Its content is the `events` list in `stages.json`: 52 events lie inside the axis; the 17520 hpf entry lies past the axis end and is not drawn (research 02 section 5).
- **UI-08** A marker is a 4 px diamond in `--text-muted` at `hpfToTrack(event.hpf) * W`. An event with `hpfIsEstimate: true` renders hollow with a 1 px stroke. Markers within 8 px of each other merge into one 6 px diamond with a count. At 1392 px the 52 events form 42 markers; nine are merged clusters, for example heart beat, pigmentation and circulation at 24 to 25 hpf.
- **UI-09** Hovering a marker shows the tooltip lines of UX-TL-11 plus one line per event: label, hpf or dpf, and "SL 7.2 to 7.5 mm (estimate)" when `slMm` is set. Clicking a marker moves `t` to the event hpf with the UX-TL-16 glide. Clicking a merged marker opens a 200 px list; each row moves `t` on click. Tablet, phone and presentation mode draw no event row; the track tooltip still lists events within 8 px of the pointer.

#### Hover tooltip

- **UX-TL-11** Hovering the track shows a tooltip above the pointer after 150 ms. Line 1: stage name and period (13 px, 600). Line 2: time as "24 hpf" or "4.5 dpf" plus the ZFS id in `--text-muted`. Line 3: the landmark sentence (12 px). Maximum width 240 px, clamped inside the bar, no pointer events. A 2 px marker line in `--accent` shows the hovered time on the track. Landmark sentences come from the ZFIN staging table through `stages.json`, `landmarks[0]` of the stage record (UX-TL-12).
- **UX-TL-22** With snap on, the tooltip and the stage card show the stage the thumb sits on and omit the interpolated time.

#### Thumb and stage card

- **UX-TL-13** The thumb is a vertical line across the track row plus a 16 px handle. The handle has a 2 px ring in `--bg` and a fill in `--accent`. Pressed state scales the handle to 20 px over 100 ms. Focus adds the 2 px focus ring at 2 px offset.
- **UX-TL-14** While the thumb is dragged, hovered or focused, the stage card floats above it: stage name (14 px, 600), time and ZFS id (12 px, tabular), body length when the growth table has a value (12 px). The stage card rises 4 px and fades in over 120 ms; it fades out over 100 ms. During drag it follows the thumb without transition.
- **UX-TL-15** Dragging updates `t` on every pointer move. The 3D scene interpolates on every frame. Snap changes only where the thumb rests on release.
- **UX-TL-16** Clicking the track at a new position moves the thumb there over 200 ms with `cubic-bezier(0.2, 0, 0, 1)`. The scene animates through the intermediate times. With `prefers-reduced-motion: reduce` the move is instant.

#### Play, pause and speed

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

- **UX-TL-17** Playback speed is defined in track distance (D7). At 1x the thumb crosses the full track in 60 s. Each frame advances the track fraction by `speed / 60` per second and converts back with `trackToHpf`. Playback stops at 4320 hpf and the button returns to play.

```ts
// per animation frame, dt in seconds
const next = hpfToTrack(t) + (speed / 60) * dt;
t = trackToHpf(Math.min(next, 1));
```

| Speed | Full track | 0 to 10 hpf | 10 to 24 | 24 to 72 | 72 to 168 | 168 to 720 | 720 to 2160 | 2160 to 4320 |
|---|---|---|---|---|---|---|---|---|
| 1x | 60 s | 10.8 s | 7.2 s | 13.2 s | 6.0 s | 9.6 s | 8.4 s | 4.8 s |

The other speeds divide every duration by the speed factor: 0.5x takes 120 s for the full track, 2x takes 30 s, 4x takes 15 s and 8x takes 7.5 s.

- **UX-TL-19** Previous and First are disabled at `t` = 0. Next and Last are disabled at the axis end. Disabled buttons render at 35 percent opacity and stay focusable.
- **UI-10** The speed menu shows the full-track duration next to each item ("2x, 30 s"). With reduced motion on, the menu adds the line "Reduced motion is on" (UX-AC-07).
- **UX-TL-18** A play range with `Shift+Click` in-point and out-point is a later feature and is not in version 1.

#### Step keys and snap

- **UX-TL-20** Snap is on by default in presentation mode and off elsewhere. The URL carries it as `snap=1`.
- **UX-TL-21** With snap on, releasing the thumb moves it to the nearest stage start when that start lies within 6 px; otherwise it stays. Arrow keys always step by stage. `Shift+ArrowLeft` and `Shift+ArrowRight` step by 1 hpf before 72 hpf and by 1 dpf after. `PageUp` and `PageDown` step by period.
- **UI-11** At 1392 px the 6 px snap window is 0.24, 0.50, 0.94, 4.1, 14.9, 44 and 116 hpf across the seven D7 segments. The window scales with `W`. `End` moves to 2160 hpf, the start of the last stage; `Shift+End` moves to 4320 hpf, the axis end.

#### Readout and units

- **UX-TL-23** The readout reads `<time> | <stage> | <length>`, for example `24 hpf | Prim-5 | 1.9 mm`. On desktop and tablet it sits at the left of the transport row. On phone and in presentation mode it is a chip inside the viewer. Font 14 px on desktop, 20 px in presentation mode, weight 500, `tabular-nums`. The separators are `|` with 8 px padding.
- **UX-TL-24** Under 72 hpf the time shows hpf, with one decimal only when `t` is not an integer and snap is off (`26.5 hpf`). From 72 hpf it shows dpf with one decimal under 10 dpf (`4.5 dpf`) and integers above (`21 dpf`). The units switch forces hpf or dpf for the whole axis; `auto` applies this rule. The stage tooltip shows both units after 72 hpf (`72 hpf, 3 dpf`).
- **UI-12** The stage field shows the stage `shortLabel` from `stages.json` with a capital first letter ("Prim-5", "Days 7-13", "Adult"). The length field reads the `growth` table in `stages.json` (D6) at `t`. It shows millimetres with one decimal and the measure name in the tooltip (embryo length, total length or SL). Between table rows the value interpolates linearly and the readout appends "~". When the table has no value at `t`, the field is omitted.
- **UX-TL-26** The readout is an `aria-live="polite"` region. It announces at most once per 500 ms during playback and once per release during drag.

#### Temperature relabel

- **UI-13** The settings sheet has an "Incubation temperature" field: presets 25, 28.5 and 33 C, and a numeric input from 24 to 33 C. The default is 28.5 C. The URL carries it as `temp=25`.
- **UI-14** When the temperature differs from 28.5 C, the readout, the hover tooltip and the stage card relabel embryonic times with the Kimmel et al. 1995 formula `H_T = h / (0.055 T - 0.57)` (research 02 section 1, ZFIN staging figure 2). `h` is the hour at 28.5 C and `H_T` is the hour at temperature `T`. The body model, the keyframes and the track keep 28.5 C hours; only the labels change. A chip "at 25 C" appears next to the readout. The relabel applies to `t` at or below 72 hpf, the range of the Kimmel calibration. Above 72 hpf the label keeps the 28.5 C value and the chip reads "28.5 C values". The settings sheet states this limit.

| Stage at 28.5 C | h | H_T at 25 C | H_T at 33 C |
|---|---|---|---|
| 20-somite | 19 | 23.6 | 15.3 |
| Prim-5 | 24 | 29.8 | 19.3 |
| Protruding-mouth | 72 | 89.4 | 57.8 |

The 20-somite row matches the values that research 02 quotes from ZFIN (23.6 h at 25 C; 15 h at 33 C).

#### Touch behaviour

- **UX-TL-27** A single finger on the track scrubs after a 4 px horizontal movement; a tap moves the thumb. Vertical movement over 12 px before that threshold cancels the scrub.
- **UX-TL-28** While the user scrubs on phone, the readout chip at 18 px replaces the stage card. The chip moves to the top of the viewer so the finger does not cover it.
- **UX-TL-29** The scrub follows the finger 1:1. A long press of 500 ms on the track opens a stage list for precise selection.
- **UX-TL-30** Transport buttons on phone are 44 px with 8 px gaps; the play button is 56 px.

#### States and motion

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

### Systems rail

#### System rows

- **UX-LY-04** A system row is 36 px high. It holds a 10 px colour dot, the display name (13 px, 500) and the count badge (11 px, tabular). The eye toggle button is 32 px inside a 44 px hit area.
- **UI-15** The 15 rows follow the D5 table order and use the D5 display names. The dot colour is the system's palette slot (see themes and tokens). Each row also shows the system icon from research 07 UX-VS-08 at 16 px; the axial system uses `ruler` and the blood and immune system uses `droplets`.
- The count badge reads "present / total", for example "4 / 5" (UX-IN-26). "present" counts structures of the system with geometry that exist at `t`; "total" counts all structures of the system with geometry.
- **UX-IN-27** The eye toggle hides every structure in the system. `Alt+click` on an eye shows only that system (solo). A second `Alt+click` restores the previous set. Hidden systems show `eye-off` and the name at 45 percent opacity.
- **UX-IN-28** The presets row holds five segmented buttons with `aria-pressed`: All, None, Embryo (early embryo, axial, skeletal, skin and pigment at 0.45 opacity), Organs (nervous, sensory, cardiovascular, digestive, respiratory, excretory, reproductive, endocrine, blood and immune; skin at 0.10), Skeleton (skeletal only, skin at 0).
- **UI-16** The rail header shows the total count badge for the whole atlas ("118 / 220") and a collapse button. The x-ray slider and the section control sit under the presets row (UX-IN-17); their behaviour is specified under viewer interactions.

#### Hierarchy tree

- **UX-LY-05** The tree fills the remaining rail height and is virtualised. It shows the ZFA `part of` hierarchy under `whole organism` (ZFA:0001094) as stored in `structures.json`. Rows are 28 px with a 16 px indent per level. Each row holds a 16 px chevron (44 px hit area), an 8 px swatch, the 13 px name and a 24 px eye.
- **UI-17** The tree opens with the system level expanded and every deeper level collapsed. Expansion state persists in `localStorage`.
- **UX-IN-26** The filter "Only structures present now" is a checkbox in the tree header and is on by default. With the filter on, rows absent at `t` are hidden. With the filter off, absent rows render at 45 percent opacity with a `clock` icon.
- **UI-18** A group node with `geometry: null` (D5) renders a dashed swatch. Clicking it selects the group; the info card shows its definition and its children (see the info card).
- **UX-IN-29** Click selects; the chevron expands; the eye hides; hover highlights the structure in 3D; the row scrolls into view when a structure is selected in 3D or from search. A row with children carries a count badge in the form of UX-IN-26 for its descendants.

#### Keyboard navigation in the rail

- **UX-AC-02** The tree uses `role="tree"` with `treeitem` and `group` children, `aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset` and `aria-multiselectable="true"`. Keys follow the WAI-ARIA tree view pattern: Down, Up, Right, Left, Home, End, Enter, Space, `*`, type-ahead, `Shift+Arrow`, `Ctrl+A`. The eye toggle inside a row is a `button` with `aria-pressed`, reached with `Tab` from the focused row.
- **UI-19** The system list is a `listbox` of rows; Up and Down move, Space toggles the eye, Enter selects the system group node in the tree, `Alt+Enter` solos.

### Info card

#### Fields

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
| Actions | Isolate, Hide, Jump to first appearance, Add to selection, Copy link to structure | Buttons, 36 px in 44 px areas |
| Sources | Collapsed row "Sources (3)"; expands to the record's source citations with links | Caption |
| Attribution line | "Anatomy and stage terms from ZFIN (ZFA, ZFS), CC BY 4.0. Geometry is schematic." with a link to `ATTRIBUTION.md` (D14) | Micro 11 px |

- **UI-20** The "Jump to first appearance" button reads "Jump to High-pec (42 hpf)" and moves `t` to `visibleFromHpf` (D1, UX-IN-24). When the structure is present at `t`, the button stays enabled and moves `t` back to the first appearance.
- **UX-IN-24** The jump uses the 200 ms thumb motion. When "follow growth" is on, the camera frames the structure after it appears.
- **UI-21** A multi-selection (up to 12 structures) shows a list card: one row per member with swatch and name, a remove button per row, and the actions Isolate, Hide and Copy link applied to all.

#### Structure-absent state

- **UX-IN-23** When the selected structure does not exist at `t`, the info card stays open. The header keeps the name. The presence badge reads "Not present at 26 hpf" in `--text-muted` with a `clock` icon. The primary button reads "Jump to Prim-25 (36 hpf)", using `visibleFromHpf`. The 3D outline is removed and the tree row shows the clock state.
- **UI-22** When the structure has ended, the badge reads "Modelled until 168 hpf (Days 7-13)". The button reads "Jump to Day 6 (144 hpf)", the start of the last stage in which the structure is present. The ZFIN end stage stays visible in the stage window field.
- **UI-23** A group node with `geometry: null` shows the note "No 3D geometry for this term. Its parts are listed below." and the children list. Isolate and Hide act on the children (UX-ST-03).

#### Alias chain

- **UI-24** The heart is one record (`ZFA:0000114`) with an `aliasChain` of the five ZFIN heart terms (D9, research 03c section 1). Entries carry `zfa`, `name`, `fromHpf` and `toHpf`. The card shows the active entry as "ZFIN term now: heart tube (ZFA:0000360), 24 to 42 hpf". The active entry is the one with the largest `fromHpf` at or below `t`.
- **UI-25** Below the active entry a collapsed row "All ZFIN terms (5)" expands to the chain with the active row marked. The Open in ZFIN button targets the active entry's id. Search matches every alias name and id (see search).

The five terms are heart primordium (ZFA:0000028), heart rudiment (ZFA:0000115), primitive heart tube (ZFA:0000149), heart tube (ZFA:0000360) and heart (ZFA:0000114). Their ZFIN windows are 11.66 to 22, 19 to 24, 22 to 30, 24 to 42, and 42 hpf to adult. The windows overlap in ZFIN; the largest-`fromHpf` rule picks one term at every `t`. The four chamber records appear as children from 42 hpf (D9).

#### Stage card fallback

- **UX-LY-08** When no structure is selected, the info card shows the current stage: name, ZFS id, period, hpf range, landmark sentences, body length from the growth table, and the list of structures that first appear in this stage. Each list row selects the structure. A pin button keeps this view while a selection exists.

### Search

- **UX-LY-02** The search field is 360 px wide and 36 px high in the top bar. `Ctrl+K` or `/` focuses it. It matches structure names, ZFA synonyms, ZFA ids, alias chain names and system names. The index builds from `structures.json` at load. Ranking: exact name, name prefix, word match in the name, synonym match, id match, fuzzy match with at most two edits. The list shows up to 8 rows and a "Show all N" row.
- **UI-26** A result row is 44 px: swatch, name (13 px), the system display name and the stage window as "42 hpf to adult". When the match came from a synonym, the synonym shows in `--text-muted`. A structure absent at `t` shows a `clock` icon and the text "from 42 hpf".
- **UX-IN-25** Enter or click selects the result and opens the info card. When the structure is absent at `t`, `t` does not change; the card opens in the absent state and a toast offers "Jump to 42 hpf". With the setting "Jump to appearance on select" on, `t` moves at once.
- **UX-ST-02** No match: "No structure matches 'xyz'. Search also covers ZFA synonyms and ids." plus three fuzzy suggestions, each selectable. Up and Down move through rows, Enter selects, `Escape` clears the field and returns focus to the viewer. The list uses `role="listbox"` with `aria-activedescendant`.

### Top bar

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

- **UI-27** The settings sheet holds units, incubation temperature, snap, follow growth (UX-IN-12), keep dorsal up (UX-IN-13) and jump to appearance on select (UX-IN-25). It also holds labels, scale bar, studio background (UX-VS-01) and quality (the post-processing toggle, D2). The sex toggle for the gonad handoff from 25 dpf (D9) offers female or male; the default is female. The URL carries it as `sex=f` or `sex=m`.
- **UI-28** On tablet the preset control shows Lat, Dor and 3/4; the other presets and the icon buttons except Present move into an overflow menu. On phone the bar is 44 px with the title, a search button and a menu button.

### Viewer interactions

#### Pointer gestures

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
- **UX-IN-12** "Follow growth" (default on) moves the controls target to the body centroid on each `t` change. It scales the camera distance with body length over 200 ms. This is the D4 rule that the camera frames the body on every stage change.
- **UX-IN-13** "Keep dorsal up" (default on) clamps the polar angle to 0.05 pi and 0.95 pi.

#### View presets

D4 fixes the world axes: +x posterior, +y dorsal, +z the left side of the fish, millimetres. Each preset places the camera on the given direction from the body centroid at the fit distance, with the given up vector. Transitions slerp over 500 ms with `cubic-bezier(0.2, 0, 0, 1)`; reduced motion cuts.

| Key | Preset | Camera direction (x, y, z) | Up vector | Result |
|---|---|---|---|---|
| `1` | Lateral (default) | (0, 0, +1) | +y | Left side of the fish; snout on the screen left, as in ZFIN figures |
| `2` | Dorsal | (0, +1, 0) | -z | Snout on the left; the left flank toward the bottom of the screen |
| `3` | Ventral | (0, -1, 0) | +z | Snout on the left; the left flank toward the top of the screen |
| `4` | Anterior | (-1, 0, 0) | +y | Head on; the left side of the fish on the screen right |
| `5` | Posterior | (+1, 0, 0) | +y | Tail on; the left side of the fish on the screen left |
| `6` | Three-quarter | (-0.45, 0.35, 0.82) | +y | Anterodorsal left view; the research 07 vector with x negated for the D4 axis |

- **UI-29** The orientation gizmo (64 px, bottom right) shows A, P, D, V labels and follows the same axes. Clicking a gizmo face applies the matching preset.
- **UX-IN-15** Reset (`R`) returns to the lateral preset with fit-to-body and clears x-ray to default, section to off and isolate. `Shift+R` also clears selection and hidden systems and returns `t` to 24 hpf. Reset never changes theme, units or temperature.
- **UX-IN-16** Auto-rotate is available in presentation mode at `autoRotateSpeed` 0.5. Any pointer or key input stops it.

#### X-ray slider

- **UX-IN-17** The slider ranges 0 to 100 in steps of 5 and shows the value as a percentage. `X` toggles between 0 and the last non-zero value.
- **UX-VS-16** 0 to 100 percent maps skin opacity from 0.60 to 0.00. Above 50 percent it also maps muscular opacity from 1.0 to 0.25, so internal structures show while the body outline stays. The default is 25 percent. The team tunes both mappings against real geometry.

#### Section plane

- **UX-IN-18** The section control is a segmented button: Off, Sagittal, Frontal, Transverse. Beside it sit a position slider from -1 to +1 across the body bounding box on the plane's normal axis and a flip button. The plane names follow fish anatomy usage; the tooltip for Frontal adds "(horizontal)". Research 07 used "Coronal" and marked the names unverified; this section uses the fish names.

| Control label | Plane contains | Normal axis (D4) | Slider range | Flip |
|---|---|---|---|---|
| Sagittal | anterior-posterior and dorsal-ventral axes | z (left-right) | +1 left surface to -1 right surface | keep left or right part |
| Frontal (horizontal) | anterior-posterior and left-right axes | y (dorsal-ventral) | +1 dorsal surface to -1 ventral surface | keep dorsal or ventral part |
| Transverse | dorsal-ventral and left-right axes | x (anterior-posterior) | -1 snout to +1 tail | keep anterior or posterior part |

- **UX-IN-19** Implementation: `renderer.localClippingEnabled = true`, one `THREE.Plane` in world space in every material's `clippingPlanes`. Caps are drawn with a stencil pass in the base colour darkened by 20 L*. While the slider is dragged the plane shows as a translucent rectangle (`--accent` at 12 percent, 1 px border); it hides 300 ms after release.
- **UX-IN-20** The URL carries the section as `sec=sag:0.1`, `sec=fro:-0.2` or `sec=tra:0.5`. Export includes it.
- **UX-IN-21** A structure that crosses `visibleFromHpf` or `modelEndHpf` gets the 300 ms scale-and-opacity transition of D3. Scrubs faster than 3 stages per second make the change instant. With reduced motion the transition is opacity only over 150 ms.

### Themes and tokens

#### Colour tokens

Values and contrast ratios come from research 07 section 4.1.

| Token | Dark (default) | Light | Contrast |
|---|---|---|---|
| `--bg` (viewer and page) | `#0E1116` | `#F5F6F7` | |
| `--surface` (panels) | `#161B22` | `#FFFFFF` | |
| `--surface-2` (inputs, chips) | `#1E252E` | `#EEF1F4` | |
| `--border` | `#2A323C` | `#D7DCE2` | |
| `--text` | `#E7EAEE` | `#1B1F24` | 15.7:1 dark; 15.3:1 light |
| `--text-muted` | `#9AA3AD` | `#5B6470` | 7.4:1; 5.5:1 |
| `--accent` (thumb, links, active) | `#7FD3F5` | `#0B6E99` | 11.3:1; 5.2:1 |
| `--focus` (focus ring, selection outline) | `#FFD166` | `#B45309` | 13.1:1; 4.6:1 |
| `--danger` | `#E4483C` | `#B81A1D` | 4.8:1; 6.1:1 |

- **UX-US-06** Dark is the default theme. `prefers-color-scheme` sets the theme on first load; the user's choice then persists in `localStorage` (UX-VS-02). The `theme` URL parameter overrides both (UX-VS-03).
- **UX-VS-01** The viewer background is a solid `--bg`. The optional studio background adds a radial gradient from `--bg` lightened by 4 percent at the centre to `--bg` at the edges; export omits it.
- **UI-30** Tokens are CSS variables defined on `:root` for the light theme, redefined under `[data-theme="dark"]` and under `prefers-color-scheme: dark` when no explicit theme is set. Tailwind reads the variables (D2).

#### The 15-slot palette

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

#### Typography

- **UX-VS-09** Typeface Inter variable, self-hosted, SIL Open Font License 1.1. Fallback stack `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Numerals in the readout, ticks, tables and ids use `font-feature-settings: "tnum" 1`. Ids use `ui-monospace, "SF Mono", Menlo, Consolas, monospace` at 12 px (UX-VS-10).

| Role | Size | Weight | Line height | Where |
|---|---|---|---|---|
| Display | 32 px | 600 | 1.15 | Presentation stage name |
| Title | 20 px | 600 | 1.25 | Info card header |
| Heading | 16 px | 600 | 1.3 | Rail section headers, dialogs |
| Body | 14 px | 400 | 1.6 | Definitions |
| UI | 13 px | 500 | 1.4 | Buttons, tree rows, system rows |
| Caption | 12 px | 400 | 1.4 | Period labels, tooltips, meta |
| Micro | 11 px | 500 | 1.2 | Tick labels, counts |

#### Spacing, radius, elevation and focus ring

| Token | Value |
|---|---|
| Space scale | 4, 8, 12, 16, 24, 32, 48 px |
| Panel padding | 16 px |
| Row height | 36 px system row; 28 px tree row; 44 px touch row |
| Radius | 4 px chips and tooltips; 8 px buttons and inputs; 12 px cards; 16 px sheets |
| Border | 1 px `--border` on every panel edge that touches the canvas |
| Elevation, dark | none for docked panels; floating cards `0 8px 24px rgba(0,0,0,0.5)` |
| Elevation, light | docked `0 1px 2px rgba(20,30,40,0.06)`; floating adds `0 12px 32px rgba(20,30,40,0.10)` |
| Focus ring | 2 px solid `--focus`, offset 2 px, radius follows the element |
| Icons | lucide, 20 px in bars and rows, 16 px in tree rows and chips, stroke 1.75; only names verified in research 07 UX-VS-11 |

### Accessibility

#### Keyboard map

Shortcuts are single keys without modifiers except where listed, so a presenter's clicker mapped to arrow keys works. Shortcuts are suppressed while focus is in a text field.

| Key | Action | Key | Action |
|---|---|---|---|
| `Space` | Play or pause | `S` | Snap toggle |
| `ArrowLeft` / `ArrowRight` | Previous or next stage | `U` | Cycle units |
| `Shift+Arrow` | Step 1 hpf or 1 dpf | `1` to `6` | View presets (D4 order) |
| `PageUp` / `PageDown` | Previous or next period | `R` / `Shift+R` | Reset camera / reset all |
| `Home` / `End` | Axis start / Adult start | `Shift+End` | Axis end (180 dpf) |
| `[` / `]` | Speed down / up | `X` | Toggle x-ray |
| `Ctrl+K` or `/` | Focus search | `I` | Isolate selection |
| `Escape` | Exit isolate, close sheet, clear selection, exit presentation (one per press, in that order) | `H` | Hide selection |
| `P` | Presentation mode | `L` | Toggle 3D labels |
| `T` | Toggle theme | `F` | Fit camera to body |
| `?` | Shortcut sheet | `,` | Settings sheet |
| `Ctrl+Shift+S` | Export dialog | `Shift+C` | Share dialog |
| `Ctrl+C` with a selection | Copy "name (ZFA id)" | `Alt+Arrow` | Orbit by 15 degrees |
| `Alt+Plus` / `Alt+Minus` | Zoom by 10 percent | `Tab` | Move between regions |

- **UI-33** Research 07 assigned `B` and `Shift+B` to bookmarks and the slide kit. The slide kit is not in version 1 (D1, D15), so those keys stay unassigned.

#### ARIA roles

- **UX-AC-01** The track is `role="slider"` with `aria-valuemin="0"`, `aria-valuemax="4320"`, `aria-valuenow` set to `t` and `aria-valuetext` such as "24 hours post fertilization, Prim-5, Pharyngula period". Arrow, Home, End, PageUp and PageDown follow the WAI-ARIA slider pattern.
- **UX-AC-03** The canvas is `role="application"` with `aria-label="3D viewer"` and `aria-describedby` pointing to a hidden paragraph that lists the keyboard alternatives.
- **UX-AC-04** A hidden `aria-live="polite"` region announces selection changes ("Heart selected, cardiovascular system, present from High-pec") and readout changes.
- **UX-AC-05** Every icon button has an `aria-label` and a tooltip on hover and focus after 400 ms, showing the label and the shortcut ("Play (Space)"). Nothing relies on hover alone: every hover chip has a keyboard or info card equivalent (UX-AC-09).
- **UX-AC-06** Focus order: top bar left to right, systems rail top to bottom, viewer, info card, timeline bar. Focus rings use `:focus-visible`.
- **UX-AC-10** Touch targets are at least 44 by 44 CSS px (WCAG 2.2 SC 2.5.5, level AAA). This includes the thumb, the eye toggles and the tree chevrons.

#### Reduced motion and contrast

- **UX-AC-07** `prefers-reduced-motion: reduce` disables the playing pulse, camera slerps (cut instead), the appearance scale (opacity only), auto-rotate and the thumb glide. Playback still works because the user starts it.
- **UX-US-02** Text contrast is at least 4.5:1 under 24 px and 3:1 at 24 px and above. Controls and swatches are at least 3:1 against their surroundings (WCAG 2.2 SC 1.4.3 and SC 1.4.11). The token tables above carry the measured ratios. Body text is never lighter than `--text-muted` (UX-AC-08).
- **UX-AC-12** Browser zoom to 200 percent reflows to the tablet layout and 400 percent to the phone layout; no horizontal scroll appears.

### First-run hint, loading, error and empty states

| State | Trigger | What the user sees | Id |
|---|---|---|---|
| Loading | first load | The layout skeleton in `--surface-2`, a centred 1-cell embryo from the first keyframe as soon as the data arrives, and a 2 px progress bar under the top bar with the text "Building the atlas" and the current step. Target: first frame under 2 s on 10 Mbit/s (UX-US-05) | UX-ST-01 |
| Empty search | no match | Message and three fuzzy suggestions (see search) | UX-ST-02 |
| No geometry | a group node is selected | Definition plus the note and children list of UI-23 | UX-ST-03 |
| Nothing visible | every system hidden, or isolate hides all at `t` | Centred hint in the viewer: "Nothing is visible at 4 hpf. Show a system from the rail or jump to 24 hpf" with two buttons; it disappears on any change | UX-ST-04 |
| Structure absent | selection not present at `t` | Info card badge and Jump button (UX-IN-23) | UX-ST-05 |
| WebGL unavailable | context creation fails | A static PNG of the lateral view at 24 hpf, the message "This browser cannot run the 3D viewer. Try a current version of Chrome, Firefox or Safari.", and links to ZFIN and the stage table. The timeline bar is hidden | UX-ST-06 |
| Context lost | `webglcontextlost` | Toast "The 3D view paused. Restoring" and an automatic rebuild on `webglcontextrestored`; a "Reload viewer" button appears after 5 s | UX-ST-07 |
| Data error | a data file fails to load | A centred card "Could not load the atlas data (HTTP 503)" with a Retry button; the top bar stays so the About sheet opens | UX-ST-08 |
| Bad URL | unknown ZFA id or `t` out of range | Load the defaults, then a toast "Structure ZFA:9999999 is not in this atlas" or "Time clamped to 180 dpf" | UX-ST-09 |
| Offline | fetch fails after first load | The static site keeps working from cache; a toast "You are offline; ZFIN links will not open" | UX-ST-10 |

- **UX-ST-11** First-run hint: on the first visit (no `localStorage` key, not presentation mode) three chips appear over the viewer after the first frame: "Drag to orbit" near the fish, "Scrub time" above the thumb, "Click a structure" with an arrow toward the head. Chips are 13 px on `--surface` with the 12 px radius. They fade after 6 s or on the first interaction and never return. "Show tips" in the help menu replays them.
- **UX-ST-12** The About sheet states three facts: the geometry is procedural and schematic; stage timings are for 28.5 C from ZFIN; definitions and stage windows come from the ZFA and ZFS with a version string. It links to the repository, to `ATTRIBUTION.md` and to the ZFIN staging table.
- **UX-ST-13** Toasts appear bottom centre above the timeline bar, 44 px high, one at a time. They stay 2 s for confirmations and 6 s for errors, with a close button and `role="status"`.
- **UX-US-07** No action opens a modal dialog in presentation mode except the export dialog, which the speaker opens on purpose.

### Export and share dialogs

#### Export dialog

- **UX-EX-01** The export dialog opens from the export button or `Ctrl+Shift+S`. It offers scale 1x, 2x or 4x of the current viewport and a transparent background toggle (D1). Checkboxes: "Include labels", "Include scale bar", "Include readout" (time, stage, length as a text chip), "Include legend" (visible systems with swatches). Defaults: 2x, transparent off, labels as shown, scale bar on, readout on, legend off.
- **UX-EX-02** The dialog states the resulting pixel size. The longest edge is capped at 8192 px; above that the 4x option is disabled with the reason. The render uses an offscreen render target; overlays are drawn on a 2D canvas at the same scale so text stays sharp (research 06, presentation mode and PNG export).
- **UX-EX-03** Transparent export renders with alpha and premultiplied output so the translucent skin composites onto any slide background.
- **UX-EX-04** File name: `zfatlas_<time>_<view>_<selection-or-all>_<scale>x.png`, for example `zfatlas_24hpf_lateral_heart_2x.png`. Time uses the readout format without spaces.
- **UX-EX-05** "Copy image" places the PNG on the clipboard where the browser allows `image/png`; otherwise the button is hidden. SVG overlay export and video export are later features (UX-EX-06).

#### Share dialog

- **UI-34** The share dialog opens from the share button or `Shift+C`. It shows the full URL in a read-only field, a "Copy link" button, and a "Copy link to structure" button when a selection exists. Two checkboxes: "Include camera" (free camera as `cam`; off gives the nearest preset as `v`) and "Include theme". A list under the field names what the link restores: time, selection, view, hidden systems, x-ray, section, units, snap, temperature and sex.
- **UX-EX-08** The address bar updates with `history.replaceState` at most every 300 ms during interaction and once on release. "Copy link" shows a 2 s toast "Link copied" with the readout text.
- **UX-EX-09** "Copy link to structure" adds `sel`. If the structure is absent at `t`, it also sets `t` to `visibleFromHpf` so the link opens on a visible structure.
- **UX-US-03** The full view state round-trips through the URL (D1). `src/core/urlState.ts` parses and serialises the parameters below; unknown parameters are ignored and reported with the UX-ST-09 toast.

| Param | Meaning | Example |
|---|---|---|
| `t` | time in hpf, float, clamped to 0 to 4320 | `t=24` |
| `sel` | selected ZFA ids without the prefix, comma separated | `sel=0000114,0000123` |
| `v` | view preset `lat`, `dor`, `ven`, `ant`, `pos`, `tq` | `v=lat` |
| `cam` | camera position and target, six floats in millimetres | `cam=1.2,0.8,3.1,0,0,0` |
| `hide` | hidden system ids | `hide=integument_pigment,early_embryo` |
| `xr` | x-ray 0 to 100 | `xr=60` |
| `sec` | section plane and position | `sec=sag:0.1` |
| `theme` | `dark` or `light` | `theme=light` |
| `u` | units `hpf`, `dpf`, `auto` | `u=dpf` |
| `temp` | incubation temperature in C | `temp=25` |
| `sex` | gonad handoff target, `f` or `m` | `sex=m` |
| `iso`, `snap`, `labels`, `present` | flags; `1` means on | `snap=1&present=1` |

- **UI-35** The `embed`, `kit` and `pal` parameters of research 07 are reserved and ignored in version 1. Embed mode, the slide kit and the reduced palette are later features.
