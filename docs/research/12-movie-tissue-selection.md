# Which tissues the 0 to 48 hpf movies light

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-14. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

This note picks the 20 tissues of [`scripts/movies/tissues.json`](../../scripts/movies/tissues.json)
and ranks 8 of them for a second series in several reporter colours. Every choice rests on a
screenshot of the app itself, taken through the reporter preview of decision D18. The measurements
below come from those screenshots and can be reproduced from the commands in section 2.

## 1. What this note decides

The first series gives one movie per tissue, each lit in EGFP over 0 to 48 hpf. The tissue list
holds 20 entries. Section 4 lists them with the hour each one first draws light.

The second series shows several tissues at once in different colours. That series needs tissues a
reader can tell apart in one frame. Section 5 ranks 8 of the 20 for it. The eight are the myotome,
the trunk vasculature, the pigment cells, the median fin fold, the lateral line system, the eye,
the yolk syncytial layer and the notochord. Their highest pairwise overlap is 0.31, and 22 of their
28 pairs measure 0.04 or less.

77 candidates were screened. 57 did not reach the list. Section 6 gives the reason for each one.

## 2. Method

**The build.** One `npx vite build` into a directory outside the repository, served by
`npx vite preview` on port 4951. The repository's own `dist/` was never written, following
`CLAUDE.md`.

**The frames.** Playwright drove the system Chrome headless at 1600 by 900, with the SwiftShader
flags `GL_FLAGS` of `scripts/screenshot.ts`. The page opened at

```
/?lab=1&embed=1&theme=dark&v=lat&t=<hpf>
```

and waited for `[data-atlas-ready="true"]` plus 800 ms. The reporter rule was then written through
`window.__atlasDebug.state().setFluorescence`, with one rule holding the candidate's ZFA id, the
candidate's `includeParts` flag, `fromHpf` at the record's `visibleFromHpf`, `toHpf` at 48, the
reporter `egfp`, and `context` at the app default of 24. The script waited a further 700 ms and
took the frame.

Setting the rule in place of reloading the page saved most of the run time. A control run of
12 frames through the full URL form, with the `fp` token of `encodeFluorescence`, gave identical lit
areas: the notochord measured 12312, 18786 and 18918 pixels at 12, 24 and 48 hpf by both routes.

**The frames per candidate.** Each candidate was shot at up to three hours drawn from the grid
3, 6, 7, 9, 12, 16, 18, 24, 27, 36, 48, keeping only hours inside the candidate's own window and
preferring 24 and 48. 208 frames came from that sweep and 16 more from a second run that pinned
down when a tissue first draws light. 224 frames in total.

**Lit area.** EGFP draws at `#39F579`. A pixel counts as lit when its green channel exceeds 50 and
exceeds the larger of its red and blue channels by more than 25. The count runs over the top 800
rows of the frame only, because the stage timeline along the bottom carries its own green. A
second, looser count uses a green excess above 8 and appears below as the faint area. The two agree
within 2 percent for every candidate except three, and those three are named in section 6.

**Overlap.** For a pair of candidates in the same hour, overlap is the intersection of their lit
masks divided by their union. 0.00 means the two never share a pixel and 1.00 means one mask is the
other.

**Form.** Five numbers describe a mask: its area, its fill inside its bounding box, the aspect
ratio of that box, the number of separate connected pieces, and the perimeter divided by the area.
They separate a solid disc from a lattice from a stipple. They cannot tell a tail outline from a
lobed head mass, so the final calls rest on the screenshots, which were all read.

**Where the frames are.** The scratchpad of the session that made them, under `shots/`, with
13 contact sheets under `shots/sheets/`. No frame was committed.

## 3. The candidates and what each frame showed

`parts` is the `includeParts` flag. `window` is the record's `visibleFromHpf` to its
`modelEndHpf`. `peak` is the largest lit area over the hours shot, in pixels, and `at` is the hour
of that frame. `n` is the number of drawn records the target resolves to.

| candidate | ZFA | parts | window | n | peak | at | what the frame showed | verdict |
|---|---|---|---|---|---|---|---|---|
| chorion | 0000329 | no | 0-30 | 1 | 0 | 3 | a wide dim green disc enclosing the whole embryo; only the faint count sees it, at 329101 | keep |
| yolk | 0000084 | no | 0-168 | 1 | 110699 | 3 | a bright ball, then a ball with a tapering extension at 48 | drop, overlaps the yolk syncytial layer at 0.89 |
| blastodisc | 0001175 | no | 0-4.66 | 1 | 31827 | 3 | a flat cap on the animal pole | drop, the enveloping layer covers the same cap for longer |
| blastoderm | 0001176 | no | 4-10.33 | 1 | 66622 | 7 | a dome over the yolk | drop, the same dome as the enveloping layer |
| enveloping layer | 0000086 | no | 4.66-10 | 1 | 71883 | 7 | a dome that spreads down the yolk between 5 and 9 hpf | keep |
| germ ring | 0000111 | no | 5.66-10.33 | 1 | 14615 | 6 | a narrow bright band around the blastoderm margin, 378 by 40 pixels | keep |
| epiblast | 0000018 | no | 5.66-10.33 | 1 | 68874 | 7 | a dome, 3 percent smaller than the blastoderm's | drop, duplicate dome |
| hypoblast | 0000117 | no | 5.66-10.33 | 1 | 57340 | 7 | a shorter dome under the epiblast | drop, duplicate dome |
| shield | 0000071 | no | 6-8 | 1 | 3783 | 7 | a small bright blob on the germ ring | drop, the window is 2 h |
| yolk syncytial layer | 0000088 | no | 3-144 | 1 | 106268 | 5 | a solid sphere, 369 by 368 pixels at 5 hpf and 167 by 168 at 48 | keep |
| hatching gland | 0000026 | no | 10-72 | 1 | 1447 | 12 | one oval on the dorsal yolk, clear of every other record | keep |
| Kupffer's vesicle | 0000001 | no | 10.33-19 | 1 | 555 | 16 | a 31 by 24 pixel oval at the tail tip | drop, the tail bud sits in the same place and is 5 times larger |
| tail bud | 0000077 | no | 10-24 | 1 | 2997 | 18 | a blob at the posterior tip, gone by 24 | drop, same oval class as the hatching gland, shortest window |
| primordial germ cell | 0009288 | no | 4-720 | 1 | 176 | 6 | two specks 17 by 16 pixels | drop, too small to read |
| axial chorda mesoderm | 0000091 | no | 8-10.33 | 1 | 8158 | 9 | a dorsal arc on the yolk | drop, the notochord takes over the same arc at 10 hpf |
| prechordal plate | 0000060 | no | 8-30 | 1 | 1445 | 9 | a small blob at the animal pole, 990 pixels by 24 hpf | drop, shrinks as the series runs |
| notochord | 0000135 | no | 10-4320 | 1 | 18918 | 48 | one smooth rod, 938 by 44 pixels at 48 | keep |
| segmental plate | 0000279 | no | 10-26 | 1 | 7156 | 12 | a solid block in the posterior trunk, 246 pixels left at 24 | drop, nearly gone by 24 |
| somite | 0000155 | no | 10.33-33 | 1 | 42392 | 24 | chevrons along the trunk | drop, overlaps the myotome at 0.80 and ends at 33 |
| hypochord | 0000031 | no | 14-96 | 1 | 3334 | 24 | a thin line under the notochord, 741 by 18 pixels at 48 | drop, one of six thin midline lines |
| intermediate mesoderm | 0001206 | no | 10-30 | 1 | 12176 | 24 | a thin dorsal stripe along the trunk | drop, the pronephros covers the same lineage |
| lateral plate mesoderm | 0000121 | no | 10.33-30 | 1 | 25189 | 24 | a broad stripe along the trunk | drop, overlaps the trunk vasculature at 0.39 |
| neural plate | 0000132 | no | 8-11 | 1 | 5260 | 9 | a thin dorsal arc | drop, first of five records that draw the same arc |
| neural keel | 0000131 | no | 10-13 | 1 | 15717 | 12 | a thicker version of the same arc | drop, duplicate arc |
| neural rod | 0000133 | no | 11.66-16 | 1 | 0 | 12 | nothing at the lit threshold; 3732 pixels at the faint threshold, at 0.22 opacity | drop, invisible |
| neural tube | 0001135 | no | 14-24 | 1 | 26550 | 18 | a thick arc, gone at 24 | drop, duplicate arc |
| floor plate | 0000022 | no | 11.66-168 | 1 | 3766 | 24 | a thin line dorsal to the notochord, 883 by 17 pixels at 48 | drop, one of six thin midline lines |
| spinal cord | 0000075 | no | 22-4320 | 1 | 18619 | 24 | a rod dorsal to the notochord, 759 by 41 pixels at 48 | keep |
| brain | 0000008 | yes | 14-4320 | 12 | 24128 | 24 | a lobed mass filling the head vault; dark at 14, 11540 pixels at 16 | keep |
| forebrain | 0000109 | yes | 14-4320 | 5 | 9929 | 24 | the front two lobes of the same mass | drop, overlaps the brain at 0.46 |
| midbrain | 0000128 | no | 14-4320 | 1 | 5593 | 24 | one lobe of the same mass | drop, inside the brain target |
| hindbrain | 0000029 | no | 14-4320 | 1 | 11052 | 24 | the rear lobe, and nothing at 48 | drop, goes dark inside the window |
| midbrain hindbrain boundary | 0000042 | no | 16-4320 | 1 | 1360 | 24 | a short tilted bar | drop, inside the brain target |
| rhombomere | 0001064 | no | 16-48 | 1 | 1298 | 24 | a segmented patch, dark at 16 and at 48 | drop, lit only in the middle of the window |
| cerebellum | 0000100 | no | 22-4320 | 1 | 1127 | 24 | a small solid oval | drop, inside the brain target |
| optic tectum | 0000445 | no | 24-4320 | 1 | 3412 | 36 | a solid oval over the midbrain | drop, inside the brain target |
| trigeminal ganglion | 0000295 | no | 19-4320 | 1 | 521 | 24 | a 28 by 27 pixel pair of dots | drop, too small to read |
| posterior lateral line nerve | 0000175 | no | 24-4320 | 1 | 2899 | 48 | a hairline along the flank, 770 by 7 pixels | drop, overlaps the horizontal myoseptum at 0.73 |
| eye | 0000107 | yes | 11.66-4320 | 4 | 8150 | 48 | one saturated disc at the snout, fill 0.80 | keep |
| retina | 0000152 | no | 24-4320 | 1 | 6960 | 36 | the same disc without the lens | drop, overlaps the eye at 0.85 |
| lens | 0000035 | no | 24-4320 | 1 | 5 | 48 | 5 pixels; the retina and its pigmented epithelium stand in front of it | drop, hidden behind another record |
| otic vesicle | 0000051 | no | 16-72 | 1 | 2229 | 48 | a solid circle behind the eye, 63 by 45 pixels at 48 | keep |
| inner ear | 0000217 | yes | 19-4320 | 3 | 1229 | 48 | a smaller shape inside the otic vesicle | drop, overlaps the otic vesicle at 0.55 |
| olfactory placode | 0000048 | no | 22-32 | 1 | 285 | 24 | an 18 by 21 pixel dot | drop, too small to read |
| olfactory pit | 0000130 | no | 22-4320 | 1 | 235 | 48 | a 26 by 12 pixel speck at the snout | drop, too small to read |
| lateral line primordium | 0001157 | no | 19-48 | 1 | 1304 | 24 | one migrating oval, dark at 48 | drop, the lateral line system target holds it |
| neuromast | 0000243 | no | 24-4320 | 1 | 882 | 48 | a row of dots along the flank | drop, overlaps the lateral line system at 1.00 |
| lateral line system | 0000034 | yes | 14-4320 | 2 | 1408 | 27 | the migrating oval to 27 hpf, then 6 evenly spaced dots over 594 pixels | keep |
| myotome | 0001056 | no | 10.33-4320 | 1 | 71587 | 48 | a chevron series filling the trunk, the largest lit area of any candidate | keep |
| horizontal myoseptum | 0000671 | no | 22-4320 | 1 | 3866 | 24 | a hairline along the flank, 794 by 10 pixels at 48 | drop, one of six thin midline lines |
| heart | 0000114 | yes | 19-4320 | 5 | 3301 | 48 | a compact looped mass under the head; 5 records lit at 48 | keep |
| pericardium | 0000054 | no | 22-4320 | 1 | 7145 | 48 | a solid fan around the heart | drop, overlaps the heart at 0.52 |
| dorsal aorta | 0000014 | no | 22-4320 | 1 | 6225 | 24 | one long rail, 396 by 19 pixels at 48 | drop, inside the trunk vasculature target |
| posterior cardinal vein | 0000477 | no | 22-4320 | 1 | 8912 | 24 | a second rail under the first | drop, overlaps the trunk vasculature at 0.51 |
| trunk vasculature | 0005024 | yes | 19-4320 | 5 | 20845 | 48 | two rails with a ladder of rungs between them, 15 separate pieces | keep |
| intersegmental vessel | 0001285 | no | 22-720 | 1 | 8107 | 36 | the rungs alone, a comb of vertical bars | drop, inside the trunk vasculature target |
| cranial vasculature | 0001267 | yes | 24-4320 | 5 | 4935 | 48 | a tangle in the head with short arch bars | drop, the brain and the eye already hold the head |
| cardiovascular system | 0000010 | yes | 11.66-4320 | 21 | 48380 | 36 | the heart, the head vessels and the trunk vessels together | drop, contains the heart and the trunk vasculature |
| intermediate cell mass | 0000033 | no | 16-60 | 1 | 5068 | 24 | a broken band between the somites and the yolk; 519 pixels by 48 | keep |
| pharynx | 0000056 | no | 14-4320 | 1 | 3043 | 48 | a short tube at the head and yolk junction | drop, inside the gut target's system, and thinner than the gut |
| gut | 0000112 | yes | 14-4320 | 7 | 6383 | 48 | one rod at 24, then the oesophagus, the bulb and the intestine at 48 | keep |
| liver | 0000123 | no | 28-4320 | 1 | 687 | 48 | a 39 by 23 pixel oval on the yolk | drop, the smallest of the organ ovals |
| liver primordium | 0000124 | no | 24-30 | 1 | 507 | 27 | a 28 by 25 pixel dot | drop, too small to read |
| intestinal rod | 0005737 | no | 19-48 | 1 | 6274 | 24 | the gut rod, and nothing at 36 or 48 | drop, overlaps the gut at 1.00 |
| pronephros | 0000151 | yes | 14-336 | 3 | 6140 | 24 | a long thin pair high in the trunk, 348 by 32 pixels at 48 | keep |
| pronephric duct | 0000150 | no | 14-336 | 1 | 5389 | 24 | the same pair without the glomerulus | drop, overlaps the pronephros at 0.88 |
| pharyngeal arch | 0001306 | yes | 14-4320 | 3 | 7417 | 48 | a chain of beads under the head, 1 bead at 16 and 7 at 48 | keep |
| head mesenchyme | 0000113 | no | 14-72 | 1 | 8435 | 48 | a solid oval filling the head, over the eye | drop, hides the head and ends at 72 |
| median fin fold | 0000040 | no | 22-516.7 | 1 | 23922 | 24 | a long lens-shaped outline around the tail, wall 670 by 126 pixels at 48 | keep |
| pectoral fin bud | 0000141 | no | 28-60 | 1 | 1960 | 36 | a 65 by 38 pixel oval on the yolk | drop, same oval class as the hatching gland, later window |
| caudal fin | 0001058 | no | 24-4320 | 1 | 350 | 36 | a hairline at the tail tip | drop, too small to read |
| melanocyte | 0009091 | no | 24-4320 | 1 | 813 | 30 | a sparse dotted stripe over the back | drop, the pigment cell target holds it |
| pigment cell | 0009090 | yes | 24-4320 | 8 | 10450 | 48 | 128 separate spots over the whole body; dark at 24, 644 pixels at 27 | keep |
| thyroid primordium | 0001081 | no | 24-60 | 1 | 228 | 36 | an 18 by 17 pixel dot | drop, too small to read |
| swim bladder bud | 0005335 | no | 36-60 | 1 | 193 | 48 | a 19 by 13 pixel dot | drop, too small to read |
| epidermis | 0000105 | yes | 24-4320 | 2 | 0 | 48 | nothing at either threshold; both drawn descendants start after 48 hpf | drop, invisible in this window |
| periderm | 0001185 | yes | 10-168 | 0 | 0 | 12 | nothing at either threshold; the target resolves to no drawn record | drop, nothing to light |

## 4. The 20

`first light` is the measured hour at which the tissue first draws a lit pixel. It sits later than
`fromHpf` for the group targets, because a group node's window opens before its first drawn child
appears. A rule that starts earlier costs nothing and lights nothing.

| # | tissue | ZFA | parts | fromHpf | first light | system | rank |
|---|---|---|---|---|---|---|---|
| 1 | Chorion | ZFA:0000329 | no | 0 | 0 | early_embryo | |
| 2 | Yolk syncytial layer | ZFA:0000088 | no | 3 | between 3 and 5 | early_embryo | 7 |
| 3 | Enveloping layer | ZFA:0000086 | no | 4.66 | between 4.66 and 5 | early_embryo | |
| 4 | Germ ring | ZFA:0000111 | no | 5.66 | between 5.66 and 6 | early_embryo | |
| 5 | Notochord | ZFA:0000135 | no | 10 | between 10 and 12 | axial | 8 |
| 6 | Hatching gland | ZFA:0000026 | no | 10 | between 10 and 12 | early_embryo | |
| 7 | Myotome | ZFA:0001056 | no | 10.33 | between 10.33 and 12 | muscular | 1 |
| 8 | Eye | ZFA:0000107 | yes | 11.66 | between 11.66 and 12 | sensory | 6 |
| 9 | Brain | ZFA:0000008 | yes | 14 | between 14 and 16 | nervous | |
| 10 | Lateral line system | ZFA:0000034 | yes | 14 | between 19 and 20 | sensory | 5 |
| 11 | Pronephros | ZFA:0000151 | yes | 14 | between 14 and 16 | excretory | |
| 12 | Gut | ZFA:0000112 | yes | 14 | between 19 and 24 | digestive | |
| 13 | Pharyngeal arch | ZFA:0001306 | yes | 14 | between 14 and 16 | skeletal | |
| 14 | Intermediate cell mass of mesoderm | ZFA:0000033 | no | 16 | between 16 and 24 | hematopoietic_immune | |
| 15 | Otic vesicle | ZFA:0000051 | no | 16 | between 16 and 24 | sensory | |
| 16 | Heart | ZFA:0000114 | yes | 19 | between 19 and 20 | cardiovascular | |
| 17 | Trunk vasculature | ZFA:0005024 | yes | 19 | between 22 and 24 | cardiovascular | 2 |
| 18 | Spinal cord | ZFA:0000075 | no | 22 | between 22 and 24 | nervous | |
| 19 | Median fin fold | ZFA:0000040 | no | 22 | between 22 and 24 | fins | 4 |
| 20 | Pigment cell | ZFA:0009090 | yes | 24 | between 24 and 27 | integument_pigment | 3 |

Eleven of the atlas's fifteen systems have an entry. Four do not: the endocrine system, the
respiratory system, the reproductive system and the immune system. Every record those systems draw
before 48 hpf measures under 600 lit pixels, so a movie of one would show a dot. The thyroid
primordium peaks at 228 pixels, the swim bladder bud at 193, the primordial germ cells at 176, and
the immune system draws no record at all before 48 hpf. Padding the list with them would have cost
four slots and shown nothing.

Every `targetId` above appears in `data/zfin/anatomy_item.txt`, and every `fromHpf` equals the
record's `visibleFromHpf`. The record named `EVL` carries the label "Enveloping layer" in the tissue
list, and the record named `melanocyte` is reached through the `pigment cell` group.

## 5. The eight, and how they separate

The second series needs eight tissues a reader can name in a single frame. Three tests decided
them. Each one draws a form no other member of the eight repeats. Each one reads at movie scale,
judged from the frames of section 3. Every pair keeps its own territory.

Rank 1 is the tissue whose form stands furthest from the rest.

| rank | tissue | form at 48 hpf | area | pieces | fill | perimeter / area |
|---|---|---|---|---|---|---|
| 1 | Myotome | a chevron series along the trunk | 71587 | 2 | 0.458 | 0.048 |
| 2 | Trunk vasculature | two rails with a ladder of rungs | 20845 | 15 | 0.113 | 0.275 |
| 3 | Pigment cell | a stipple of separate spots | 10450 | 128 | 0.038 | 0.364 |
| 4 | Median fin fold | a thin-walled outline around the tail | 19704 | 1 | 0.233 | 0.115 |
| 5 | Lateral line system | a row of evenly spaced dots | 882 | 6 | 0.065 | 0.265 |
| 6 | Eye | one solid disc at the snout | 8150 | 1 | 0.801 | 0.036 |
| 7 | Yolk syncytial layer | one solid sphere at mid-body | 21976 | 2 | 0.783 | 0.025 |
| 8 | Notochord | one smooth rod on the midline | 18918 | 1 | 0.458 | 0.100 |

The five form numbers spread across their whole range. Fill runs from 0.038 to 0.801. The piece
count runs from 1 to 128. Perimeter over area runs from 0.025 to 0.364. No two members sit close on
all five.

Territory, measured as overlap at 24 and 48 hpf:

| pair | overlap | hour |
|---|---|---|
| myotome and notochord | 0.31 | 24 |
| myotome and trunk vasculature | 0.26 | 48 |
| myotome and notochord | 0.22 | 48 |
| myotome and yolk syncytial layer | 0.10 | 48 |
| notochord and pigment cell | 0.09 | 48 |
| notochord and trunk vasculature | 0.09 | 48 |
| every other pair | 0.08 or less | 24 and 48 |

The myotome and the notochord share the most ground, at 0.31. They stay easy to tell apart, because
the myotome draws 30 segments and the notochord draws one unbroken rod. The eye and the yolk
syncytial layer are the only two members with a similar form, both solid and convex. They never
share a pixel, they differ by a factor of 2.7 in area, and one sits at the snout while the other
sits at mid-body. The yolk syncytial layer also earns its place on time: it is the only member lit
before 10 hpf, so it carries the first fifth of the second series alone.

Four tissues were considered for the eight and left out. The brain has the closest form to the
myotome of any pair in the pool, and it overlaps the eye at 0.18, so the head would have carried two
members. The otic vesicle repeats the eye's solid circle at a fifth of the area. The spinal cord has
the closest form to the notochord of any pair in the pool, and both are midline rods. The
intermediate cell mass falls to 519 lit pixels by 48 hpf, so it would fade out of the frame the
second series holds longest.

## 6. Why the other 57 candidates did not reach the list

The verdict column of section 3 gives each reason. They fall into six groups.

**Nothing to light: 2.** The periderm group resolves to no drawn record. The epidermis group
resolves to two, and both start after 48 hpf. Both targets produce an empty frame.

**Invisible or near invisible: 2.** The neural rod draws at 0.22 opacity and reaches no lit pixel at
either hour inside its window. The lens reaches 5 lit pixels, because the retina and its pigmented
epithelium stand between the lens and the camera.

**Too small to read: 9.** The primordial germ cells, the trigeminal ganglion, the olfactory placode,
the olfactory pit, the liver primordium, the caudal fin, the thyroid primordium, the swim bladder
bud and Kupffer's vesicle all peak under 600 lit pixels, most of them inside a box smaller than
40 by 40 pixels.

**A duplicate of another candidate's shape: 20.** The highest cases are the intestinal rod and the
gut at 1.00, the neuromasts and the lateral line system at 1.00, the pronephric duct and the
pronephros at 0.88, the yolk and the yolk syncytial layer at 0.89, the retina and the eye at 0.85,
the somites and the myotome at 0.80, the horizontal myoseptum and the posterior lateral line nerve
at 0.73, the pericardium and the heart at 0.52 and the posterior cardinal vein and the trunk
vasculature at 0.51. The blastodisc, the blastoderm, the epiblast and the hypoblast all draw the
same dome as the enveloping layer. The neural plate, the neural keel, the neural rod and the neural
tube all draw the same dorsal arc.

**Inside a target already on the list: 11.** The forebrain, the midbrain, the hindbrain, the
midbrain hindbrain boundary, the rhombomeres, the cerebellum and the optic tectum all sit under the
brain target. The dorsal aorta and the intersegmental vessels sit under the trunk vasculature
target. The lateral line primordium sits under the lateral line system target. The whole
cardiovascular system target contains both the heart and the trunk vasculature.

**A window that fails a 0 to 48 hpf movie: 13.** The shield lives 2 hours. The segmental plate falls
to 246 lit pixels by 24 hpf. The hindbrain and the rhombomeres go dark before 48 hpf while their
records still exist, because the hindbrain hands its mesh to the medulla oblongata and the
cerebellum. The tail bud, the axial chorda mesoderm, the prechordal plate, the intermediate
mesoderm, the lateral plate mesoderm, the neural tube, the head mesenchyme, the liver and the
pectoral fin bud each repeat a shape the list already carries at a less useful hour.

## 7. Limits

The frames come from SwiftShader software rendering on a machine with no GPU, at 1600 by 900, in the
lateral view only. A structure hidden behind another in that view could be clear from the dorsal
view, and the lens is the one case where that mattered. The rank order of the eight rests on five
form numbers and on a reading of the frames, so another reader could swap ranks 5 to 8 and argue it
well. The overlap numbers are exact for the frames they came from and would shift with the camera.

The geometry is schematic and no anatomist has reviewed it. A shape called distinct here is distinct
in this model, not in a fish.

`parseTissues` in `scripts/movies/render-all.ts` takes both the bare array and the
`{ "version": 1, "tissues": [...] }` wrapper that `scripts/movies/tissues.json` carries; a unit test
in `tests/unit/renderMovie.test.ts` covers both forms. Every one of the 20 entries passes, the ranked
eight come back in the order of section 5, and `plan` returns 27 movies.

The scripts behind section 2 (candidate listing, frame capture, mask measurement, contact sheets and
the ranking) live under `scripts/movies/selection/`; `scripts/movies/README.md` gives the order to
run them in for another stage range.
