# Rendering review and reporter-preview proposal

_Written by a second AI coding agent under the direction of Yang-Joon Kim,
2026-09-09. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Date: 2026-09-09. Branch: `feature/reporter-preview`.

This records the initial assessment requested by Yang-Joon Kim before implementation, not an
anatomical validation. The ZFA-based reporter preview was subsequently implemented under
[D18](../superpowers/specs/2026-09-06-architecture-decisions.md#d18-experimental-reporter-preview-owner-request-2026-09-09);
the broader geometry recommendations below remain proposals. The review opened the existing
`bundle/zebrafish-3d-atlas.html` in headless Chrome using SwiftShader and compared it with the
[live Human Atlas](https://human-atlas-seven.vercel.app/) and its
[repository documentation](https://github.com/ashemag/human-atlas).
The existing bundle was inspected without rebuilding it; this review does not establish that
every bundled module is identical to the current source tree.

## What was inspected

- README, local contributor guidance, architecture decisions D1–D3 and D10, relevant rendering
  and geometry code, and the draft Zebrahub crosswalk and its research note.
- Fresh desktop screenshots at 1600 × 900: 8 hpf lateral, 24 hpf lateral, 48 hpf lateral,
  120 hpf dorsal, 4320 hpf lateral, and 48 hpf fully dissected.
- A fresh desktop screenshot of the live Human Atlas.
- Follow-up captures at 48 hpf in dark three-quarter view and after the fully dissected view
  settled for 2.5 seconds; the latter still has crowded labels and crossing leader lines.
- Keyboard stage stepping advanced from 48 to 72 hpf; play/pause then advanced to 75.2 hpf.
  These follow-up interactions also completed without JavaScript page errors.
- All six initial fish views reached the viewer-ready state without JavaScript page errors.
  Software rendering establishes that the artifact opens; it does not establish GPU or
  physical-device performance. These samples do not validate all developmental transitions.

Review captures for this session are temporary inspection artifacts, not replacements for the
committed baseline screenshots.

## Assessment

The existing viewer has a substantial interaction foundation: time navigation, anatomy search,
system visibility, isolation, dissection, camera presets, share links and export. The largest
opportunity is to improve the geometry and visual hierarchy of the fish.

Human Atlas uses detailed BodyParts3D source meshes; this project generates schematic geometry.
Lighting and interface polish can improve readability, but cannot supply anatomical detail that
is missing from the shapes. Its compact controls, restrained materials and prominent model are
useful design references. Its batched geometry and per-structure GPU controls are relevant if
this viewer later gains many more meshes; the current system already renders on demand and
instances repeated structures, so replacing the rendering architecture is not the first step.

| Priority | Observed issue | Proposed change | How to judge the result |
| --- | --- | --- | --- |
| 1 | At 48 hpf, colored tubes, opaque eyes, peach muscle segments and the bright yolk compete for attention through the body. Depth relationships are difficult to read. | Introduce coordinated appearance presets: anatomy overview, system focus and fluorescence. Tune skin, organ and fin materials separately; reduce secondary saturation and distinguish near/far structures. | Heart, neural axis and yolk remain identifiable in lateral, dorsal and three-quarter views, with selection visible on both themes. |
| 1 | Adult muscle segments look like a row of rectangular plates. Two thick black stripes dominate the flank; the head and fins remain simplified. | Refine the body cross-sections and head/eye integration, use smoother chevron muscle surfaces, and improve fin outlines, rays and surface-bound pigment patterns. | Compare silhouette and landmarks at juvenile and adult checkpoints against appropriately sourced references in several views. |
| 1 | At 8 hpf, the blastoderm reads as a solid cap with a sharp lower edge; the surrounding translucent envelope occupies much of the image. | Improve shell thickness, edge treatment and material separation of blastoderm, yolk and chorion. Inspect intermediate epiboly and axis-straightening frames. | Germ-layer boundaries are legible and stage changes do not reveal abrupt rims, intersections or silhouette jumps. |
| 2 | At 120 hpf dorsal, the fish is a thin horizontal strip in a large viewport. Both full-height side panels remain open. | Use view-aware framing, optional vertical dorsal orientation, compact system controls and a collapsible stage-details panel. | Increase useful model area while retaining the entire silhouette and stable framing during playback. |
| 2 | At 100% dissection, many labels overlap or cover neighboring structures. | Allocate space for labels in the packing algorithm; show selected/hovered labels first and allow system-focused inventories. | Labels remain readable at 48 and 120 hpf with all systems visible and in narrower windows. |
| 2 | Current materials sort translucent objects using body-relative lateral depth and radius. | Audit opposite-side and oblique camera views before selecting a transparency improvement. Prototype camera-dependent ordering or another transparency method only against reproduced artifacts. | Overlap remains visually consistent when orbiting; skin does not obscure the selected target unexpectedly. |
| 3 | Each time update queues procedural rebuilds; existing code already coalesces requests and uses two tessellation levels. | Profile the representative stages first. If geometry work is the bottleneck, optimize stable-topology buffer updates or cache neighboring stages. | Smooth scrubbing and correct final geometry without unbounded memory growth. |

The README already records adult pigment and notochord limitations. Those are useful geometry
work items; a material change alone will not resolve them. No anatomical correctness claim is
made from the screenshots.

## Hidden fluorescence / reporter preview

Yes: the current architecture can support a useful first version. The user defines a hypothetical
target pattern, and the viewer displays its mapped anatomical regions over time. It does not
currently contain enhancer activity measurements, sequence-to-activity predictions, cell
positions or lineage data.

### Proposed interaction

The proposed opt-in `?lab=1` entry point is now implemented as the "Reporter preview" panel.
The following table records the original cell-type-oriented proposal; the implemented picker
uses the existing modeled ZFA terms directly, as the owner requested after this review:

| Rule | Cell type | Active time(s) | Reporter |
| --- | --- | --- | --- |
| A | Cardiomyocytes | 48–72 hpf | EGFP |
| B | Hepatocytes | 72–120 hpf | mCherry |
| C | Endothelial cells | 48–120 hpf | EGFP |

These are illustrative user-authored targets, not measured enhancer patterns or claims that
these exact labels already exist in the draft crosswalk.

- Add, duplicate, disable and remove rules. Allow repeated reporters across rules and multiple
  reporters for the same cell type and time window. Use stable rule IDs independent of reporter.
- Within a rule, selected cell types and selected windows each form a union; a target must match
  both a cell type and an active time. Across rules, combine the matches. Different pairings
  should use separate rows so selecting several values does not silently invent pairings.
- A timepoint means an explicitly selected snapshot or stage interval. A range means a stated
  start and end in hpf. Never invent a window around an isolated numeric timepoint. Mark active
  windows on the existing timeline and provide "Jump to target time."
- Display each mapping as direct anatomy, tissue proxy, curated group expansion, or unresolved.
  Show the actual region that will light up before the rule is applied.
- Dark background, faint neutral fish context, emissive target regions and a reporter legend.
  Offer composite and individual-channel views. Include protein names as well as colors.
- Preserve independent rules when the same reporter is reused. Union their spatial coverage by
  default; duplicating a row should not silently double brightness. Distinct reporter channels
  can mix additively in linear color space, with per-channel views to disambiguate overlap.
- Label colors and intensity as display settings. A coarse proxy overlap must not be presented
  as proof that two reporters coexist in the same cells.
- Keep the anatomy visible as context outside a rule's time window, with fluorescence off.
  Mark targets whose geometry is absent at the current time; do not light unrelated ancestors
  to make every rule appear to work.
- Carry enabled mode, rules and legend through share links, bookmarks and PNG export, including
  exported annotations that identify a schematic target preview. A feature gate is not security.

### Mapping coverage checked against the current tree

The existing `docs/research/zebrahub-crosswalk.draft.json` contains 203 labels, including 198
biological labels and five without ZFA IDs. Recounting against all current structure JSON files:

| Relationship to current anatomy records | Biological labels |
| --- | ---: |
| ZFA ID directly resolves to a record with geometry | 49 |
| ZFA ID resolves to a group without its own geometry | 21 |
| ZFA ID is absent from the modeled records | 128 |
| Total | 198 |

All 128 absent IDs have a stand-in ID that resolves in the current records. This is ID resolution,
not validation of a spatial mapping: stand-ins include broad groups and the whole organism.
Even the 49 direct matches do not imply cell-resolved geometry or coverage at every source stage.

The draft has stale `modeled` flags, alias labels, source-stage names requiring explicit time
mapping, and documented low-confidence annotations. Rebuild coverage from live records, exclude
QC labels, preserve original labels, and resolve questionable mappings before exposing a broad
cell-type picker. Source-stage detection must remain distinct from a user-authored activity
window: a label missing from a sampled stage does not prove biological absence.

Start with a small, reviewed mapping set spanning heart, muscle, liver and vasculature. Approve
group expansions individually: anatomical descendants are not necessarily the selected cell
type. Whole-organism fallbacks should remain unresolved unless the user explicitly chooses
whole-body coverage. The existing draft is a starting resource, not a finished spatial atlas.

### Implementation boundaries

1. Add a typed rule model and a pure resolver that accepts current hpf, anatomy availability and
   reviewed cell-type mappings, and returns per-structure reporter contributions plus mapping
   status. Store experimental rules separately from baseline anatomy data.
2. Extend the existing material visual pass (`src/viewer/materials.ts`) and its invalidation
   inputs (`src/viewer/rebuild.ts`). Color changes should not rebuild geometry. The current pass
   rewrites emissive color for hover, so an independent one-time material edit would be lost.
3. Use existing `presenceAt`/`hasMeshAt` logic for stage and sex availability. Respect explicit
   visibility, clipping and isolation settings and report when they hide active targets.
4. Begin with emissive materials. Add selective bloom as an optional quality setting after
   profiling; prevent skin highlights and selection outlines from blooming as reporter signal.
   Keep export rendering consistent if postprocessing is introduced.
5. Version serialized rules and validate them on import. Verify repeated reporters, duplicate
   rules, overlapping time windows, absent anatomy, unresolved mappings, mode restoration and
   share/export consistency. Use visual checks for channel separation and selection visibility.

Current architecture decisions D1/D3 scope version 1 to procedural anatomy and exclude single-cell
overlays; D10 defines system colors. When implementing this requested extension, record an
explicit experimental appearance-mode exception and update the design spec accordingly.
These existing decisions do not prevent preparing or implementing the user-requested extension.

True cell-level patterns would require spatial masks or registered labeled cells. A later
reporter-persistence model would additionally need explicit maturation/decay assumptions and,
for moving cells, lineage/spatial tracking. The first preview should use immediate on/off windows
so its behavior remains understandable and reproducible.

## Recommended first implementation slice

Concentrate on 24–120 hpf: improve skin/internal contrast and head/trunk readability, then add
the gated preview with a small reviewed mapping set, editable rules, reused reporters, timeline
activation and reproducible export. Follow with adult geometry and broader cell-type coverage.
This produces an assessable visual improvement and a useful enhancer-planning tool without
requiring the entire developmental model to be rebuilt first.
