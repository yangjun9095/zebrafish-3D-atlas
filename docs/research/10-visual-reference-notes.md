# Visual reference notes from the owner's sample images

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-07. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Date: 2026-09-07. Source: four reference illustrations the owner placed in `data/samples/`.
The four figures are unattributed third-party images: their author and licence are not recorded.
They stay out of the repository. `.gitignore` excludes `data/samples/`, no figure was ever
committed, and this note reproduces none of them. They served as calibration targets only, and
the targets below are written in the author's own words.
The owner's request: "the somites are a little too large... and I want a bit of transparency
to see through the notochord".

## What the references show

| Reference | Stage range | What to match |
|---|---|---|
| Stage series with a structure colour key (1-cell to long-pec, 48 hpf) | 0 to 48 hpf | Thin somite chevrons in a narrow band flanking the notochord; CNS dorsal to the notochord; yolk large and pale; tissues translucent; per-structure colour key (yolk, EVL, YSL, PGCs, CNS, floor plate, epidermis, notochord, somites, eyes, ear, nose, heart and vessels, liver, kidney, gut, pancreas, pigment) |
| Painted stage series (1-cell to 48 hr) | 0 to 48 hpf | Chorion drawn as a thin line; body a translucent veil; the notochord and somite blocks visible through the trunk; eye and otic vesicle dark and clear |
| Vascular lateral view on a bright-field embryo | about 26 to 30 hpf | Dorsal aorta and posterior cardinal vein as two parallel lines under the notochord; caudal artery and vein into the tail; common cardinal vein sweeping over the yolk; head vessels; arteries red, veins blue |
| Adult anatomy diagram | adult | Semi-transparent body wall with organs visible: swim bladder (two chambers), kidney along the dorsal body wall, intestine, spleen, pancreas, testis, gills, heart; dorsal muscles; stripes over the flank |

## Calibration targets for the model

- **RN-01 Somite size.** At 18 to 48 hpf a somite is a chevron block whose dorsoventral height is
  about 0.3 to 0.4 of the local body height and whose anteroposterior length matches the 03a
  values (about 50 um, 30 um in the tail). The band sits lateral to the notochord and the
  neural tube; its dorsal edge stays below the neural tube crest and its ventral edge stays
  above the yolk. It never reaches the skin.
- **RN-02 Myotome size.** Post-embryonic myotomes fill the trunk between skin and spine but
  stay translucent (see RN-04) so the vertebral column reads through them.
- **RN-03 Layering.** From medial to lateral: notochord, then neural tube dorsal to it, then
  somites and myotomes lateral, then skin. The renderer must respect this so that a lateral
  view shows the notochord through the somites.
- **RN-04 Default translucency.** Skin about 0.15 to 0.25 opacity with a rim; somites and
  myotomes about 0.45 to 0.6; brain and gut about 0.7; notochord, heart, vessels, eye and
  lens opaque or near-opaque. The x-ray slider keeps its range, but the default must already
  show the notochord through the trunk.
- **RN-05 Chorion.** A thin line or a faint shell; the embryo must dominate the frame.
- **RN-06 Vessel schematic.** Dorsal aorta and posterior cardinal vein as two parallel tubes
  under the notochord from 24 hpf; the common cardinal vein as a thin sheet over the yolk.
- **RN-07 Adult organs.** Swim bladder with two chambers, kidney as a thin dorsal band, gut
  coiled, gonad ventral, gills under the opercle; the body wall translucent so all of them
  read in lateral view.

## How to apply

Run a visual calibration pass after the phase 2/3 gate: adjust the somite and myotome
records (heights as bodyHeightFraction), the per-system default opacities in the materials
module, the render order for nested translucent tissues, and compare screenshots at 18, 24,
30, 48, 72 and 120 hpf lateral against RN-01 to RN-06, and at 90 and 180 dpf against RN-07.
