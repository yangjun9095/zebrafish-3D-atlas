> **Superseded draft.** The assembled specification
> [`../2026-09-06-zebrafish-3d-atlas-design.md`](../2026-09-06-zebrafish-3d-atlas-design.md)
> is authoritative. This file is the section draft written before reconciliation and it may
> disagree with the assembled specification. Written by AI coding agents (Claude Code) under
> the direction of Yang-Joon Kim, 2026-09-06.

## Data model

The data model is the contract between the research drafts, the validation script, and the viewer. Five JSON files in `src/data/` hold every value the viewer reads. One zod module, `src/core/schema.ts`, defines each record. This section uses these abbreviations: hpf is hours post fertilization at 28.5 C; dpf is days post fertilization; SL is standard length (snout to caudal fin base); TL is total length (snout to caudal fin tip); EL is embryo length as Kimmel et al. 1995 define it; ZFA is the Zebrafish Anatomy Ontology; ZFS is the Zebrafish Stage Ontology.

### Data files

| File | Owns | Root schema | Rows in version 1 |
|---|---|---|---|
| `systems.json` | the 15 systems of D5: display name, ZFA roots, palette slot, colours, rail order | `SystemRecord[]` | 15 |
| `stages.json` | the 44 ZFS stages, the 10 periods, the events, the growth table, the time axis (D6, D7) | `StagesFile` | 44 stages, 10 periods, the 53 draft events plus the D8 rows, 22 growth points |
| `structures.json` | every selectable structure and every group node (D3, D5) | `StructureRecord[]` | 236 (see the merge plan) |
| `body.json` | the body keyframes that drive the body model (D3) | `BodyKeyframe[]` | one per regime boundary plus the posture keyframes of research 05 section 15 |
| `handoffs.json` | the topology handoffs of D9 | `HandoffRecord[]` | 12 |

- DM-01 Each value has one owner file. No file repeats a value that another file owns. The viewer joins the files by id at load time.
- DM-02 Every structure id is a ZFA id and every stage id is a ZFS id. No file mints its own id.
- DM-03 `npm run validate` parses each file with the zod schema and then runs the numbered rules in the validation section. A failure stops the build.
- DM-04 The attribution data lives in `src/core/attribution.ts` as a typed constant. `scripts/build-attribution.ts` writes `public/ATTRIBUTION.md` from it, and the info card footer reads the same constant.
- DM-05 `scripts/validate-data.ts` also calls `z.toJSONSchema` on each root schema and writes the result to `docs/schema/`. The JSON Schema files are documentation; the zod module is the source.

### Schemas

The code below is zod 4 and TypeScript 5.9. Units are millimetres and hpf unless a field name says otherwise. Every schema is strict: unknown keys fail.

#### Shared types and SystemRecord

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

#### StageRecord, PeriodRecord, EventRecord, GrowthPoint, TimeAxis

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
  zfs: ZfsId.nullable(),            // null for zygote (no ZFS period term)
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
  measure: z.enum(['EL', 'TL', 'SL']),
  standardLengthMm: z.number().positive(),      // derived; see the referenceSL rule
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
  stages: z.array(StageRecord).length(44),
  periods: z.array(PeriodRecord).length(10),
  events: z.array(EventRecord),
  growth: z.array(GrowthPoint).min(2),
  timeAxis: TimeAxis,
});
```

#### Placement and keyframe parameters per primitive

```ts
const Signed = z.number().min(-1).max(1);
const URange = z.tuple([z.number().min(0).max(1.2), z.number().min(0).max(1.2)]);
const Vec3 = z.tuple([z.number(), z.number(), z.number()]);         // (u, v, w)
const Profile = z.array(z.tuple([z.number().min(0).max(1), Mm])).min(2); // [s, mm]

export const Placement = z.strictObject({
  u: URange,                                        // 0 snout, 1 notochord end; max 1.0 unless system is fins
  v: z.union([Signed, z.tuple([Signed, Signed])]),  // -1 ventral surface, 0 spine, +1 dorsal surface
  w: z.union([Signed, z.tuple([Signed, Signed])]),  // -1 left surface, +1 right surface
  mirror: z.boolean().default(false),               // paired: draw at +w and at -w
});

export const EllipsoidParams = z.strictObject({
  radii: z.tuple([Mm, Mm, Mm]),                     // along u, v, w
});
export const SuperellipsoidParams = z.strictObject({
  radii: z.tuple([Mm, Mm, Mm]),
  exponents: z.tuple([z.number().min(0.2).max(4), z.number().min(0.2).max(4)]),
});
export const TubeParams = z.strictObject({
  path: z.union([
    z.strictObject({ uRange: URange }),             // follows the spine
    z.strictObject({ spline: z.array(Vec3).min(2) }), // own Catmull-Rom spline in body coordinates
  ]),
  radiusProfile: Profile,                           // [s along the tube, radius]
  aspect: z.number().positive().default(1),         // v radius divided by w radius
});
export const LatheParams = z.strictObject({
  profile: z.array(z.tuple([Mm, z.number()])).min(3), // [radius, height along the axis]
  axis: z.enum(['u', 'v', 'w']),
  arcDeg: z.number().min(1).max(360).default(360),
});
export const SheetParams = z.strictObject({
  outline: z.array(z.tuple([z.number(), z.number()])).min(3), // closed polyline in the sheet plane
  plane: z.enum(['sagittal', 'coronal', 'transverse']),
  thickness: Mm,
});
export const ShellParams = z.strictObject({
  radius: Mm,
  coverage: z.number().min(0).max(1),               // fraction of the sphere from the animal pole
  thickness: Mm,
});
export const CustomParams = z.strictObject({
  builder: z.enum(['heartLoop', 'gutLoop', 'eyeCup', 'earVesicle', 'pointCloud']),
  params: z.record(z.string(), z.unknown()),        // each builder validates its own params
});
export const SegmentArrayParams = z.strictObject({
  count: z.number().int().min(1),                   // interpolates between keyframes, rounded
  spacingMode: z.enum(['uniform', 'somitic', 'explicit']),
  spacingU: z.array(z.number().min(0).max(1.2)).optional(), // required when spacingMode is explicit
  template: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('ellipsoid'), params: EllipsoidParams }),
    z.strictObject({ kind: z.literal('superellipsoid'), params: SuperellipsoidParams }),
    z.strictObject({ kind: z.literal('tube'), params: TubeParams }),
    z.strictObject({ kind: z.literal('sheet'), params: SheetParams }),
  ]),
});
```

#### GeometrySpec

```ts
export const PrimitiveKind = z.enum([
  'ellipsoid', 'superellipsoid', 'tube', 'lathe', 'segmentArray', 'sheet', 'shell', 'custom',
]);

const geometryBase = {
  placement: Placement,
  sizeMode: z.enum(['mm', 'bodyHeightFraction']),
  referenceSL: z.number().positive().nullable(),    // 18 when any keyframe is at or after 72 hpf
  lodHint: z.enum(['low', 'medium', 'high']).default('medium'),
};

const keyframes = <T extends z.ZodTypeAny>(params: T) =>
  z.array(z.strictObject({
    hpf: Hpf,
    placement: Placement.partial().optional(),      // overrides the base placement from this hpf
    params,
  })).min(1);

export const GeometrySpec = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ellipsoid'), ...geometryBase, keyframes: keyframes(EllipsoidParams) }),
  z.strictObject({ kind: z.literal('superellipsoid'), ...geometryBase, keyframes: keyframes(SuperellipsoidParams) }),
  z.strictObject({ kind: z.literal('tube'), ...geometryBase, keyframes: keyframes(TubeParams) }),
  z.strictObject({ kind: z.literal('lathe'), ...geometryBase, keyframes: keyframes(LatheParams) }),
  z.strictObject({ kind: z.literal('segmentArray'), ...geometryBase, keyframes: keyframes(SegmentArrayParams) }),
  z.strictObject({ kind: z.literal('sheet'), ...geometryBase, keyframes: keyframes(SheetParams) }),
  z.strictObject({ kind: z.literal('shell'), ...geometryBase, keyframes: keyframes(ShellParams) }),
  z.strictObject({ kind: z.literal('custom'), ...geometryBase, keyframes: keyframes(CustomParams) }),
]);
```

Between two keyframes the viewer interpolates each numeric parameter with a smoothstep (D3). Before the first keyframe it holds the first values. After the last keyframe it holds the last values and applies the referenceSL scale.

#### StructureRecord

```ts
export const Laterality = z.enum(['midline', 'paired', 'left', 'right']);
export const ParentRelation = z.enum(['part_of', 'is_a', 'develops_from', 'grouping', 'root']);

export const SizeRow = z.strictObject({            // reference measurements, shown on the info card
  hpf: Hpf,
  stageLabel: z.string().min(1),
  dimsMm: z.record(z.string(), z.number()),        // keys as in the drafts: length, width, diameter, count
  source: z.string().min(1),
  note: z.string().optional(),
  estimate: z.boolean().default(false),
  basisSL: z.number().positive().nullable().default(null), // SL of the measured specimen when known
});

export const StructureEvent = z.strictObject({
  hpf: Hpf,
  text: z.string().min(1),
  source: z.string().optional(),
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

#### HandoffRecord and BodyKeyframe

```ts
export const HandoffRecord = z.strictObject({
  id: z.string().regex(/^ho-[a-z0-9-]+$/),
  from: ZfaId,
  to: z.array(ZfaId).min(1),
  window: z.union([
    z.strictObject({ startHpf: Hpf, endHpf: Hpf }),
    z.strictObject({ startSL: z.number().positive(), endSL: z.number().positive() }),
  ]),
  mode: z.enum(['crossfade', 'split']),            // crossfade: from ends; split: from persists as the parent
  note: z.string().optional(),
});

export const Regime = z.enum(['R0', 'R1', 'R2', 'R3', 'R4']);

export const BodyKeyframe = z.strictObject({
  hpf: Hpf,
  regime: Regime,
  spine: z.array(z.tuple([z.number().min(0).max(1), z.number(), z.number()])).min(2), // (u, x mm, y mm)
  hD: Profile,                                     // dorsal half-height by u
  hV: Profile,                                     // ventral half-height by u
  w: Profile,                                      // half-width by u
  yolk: z.strictObject({
    ballCenterU: z.number().min(0).max(1),
    ballRadiusMm: Mm,
    extensionLengthMm: Mm,
    extensionRadiusMm: Mm,
  }).nullable(),
  chorionRadiusMm: Mm.nullable(),
  epibolyFraction: z.number().min(0).max(1),
  somiteCount: z.number().int().min(0).max(34),
  headTrunkAngleDeg: z.number().min(0).max(180),
  bodyLengthMm: z.number().positive(),
  standardLengthMm: z.number().positive(),
  source: z.string().min(1),
});
```

- DM-06 A window in `HandoffRecord` given in SL is placed on the time axis through the growth table, as D6 requires. The viewer never stores a second time mapping.
- DM-07 The `template` of a `segmentArray` carries sizes for one element in millimetres. The element count interpolates linearly between keyframes and is rounded at render time.

### systems.json

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

### Group nodes

A group node is a `StructureRecord` with `geometry: null`. It exists so that every `uiParent` resolves and so that the tree can collapse a region. The list below has two parts. The first part is 27 ZFA terms that the drafts name as a parent but do not describe. The second part is 19 draft records whose shape notes say "group node", or whose volume the body model or the children already draw. Names come from `anatomy_item.txt`. The system follows the children that reference the node.

| ZFA id | name | system | why it is a group node |
|---|---|---|---|
| ZFA:0001094 | whole organism | axial | UI root; the body model draws the body |
| ZFA:0001114 | head | axial | body region; the body model draws it |
| ZFA:0001115 | trunk | axial | body region; the body model draws it |
| ZFA:0001117 | post-vent region | axial | body region; the body model draws it |
| ZFA:0000092 | axis | axial | regime R2 of the body model draws the wrapped axis |
| ZFA:0000020 | extraembryonic structure | early_embryo | draft 03a: grouping node |
| ZFA:0000255 | paraxial mesoderm | axial | draft 03a: grouping node |
| ZFA:0000017 | endoderm | axial | parent of hypochord; not described |
| ZFA:0000473 | trunk musculature | muscular | parent of myotome; not described |
| ZFA:0000548 | musculature system | muscular | 03e uiParent; not described |
| ZFA:0000012 | central nervous system | nervous | parent of neural plate to spinal cord; not described |
| ZFA:0000142 | peripheral nervous system | nervous | parent of the ganglia; not described |
| ZFA:0000008 | brain | nervous | draft 03b: union of the child lobes |
| ZFA:0000109 | forebrain | nervous | draft 03b: group node |
| ZFA:0001127 | visual system | sensory | parent of eye; not described |
| ZFA:0000107 | eye | sensory | retina, lens and retinal pigmented epithelium fill its volume |
| ZFA:0001138 | vestibuloauditory system | sensory | parent of inner ear; not described |
| ZFA:0001149 | olfactory system | sensory | parent of peripheral olfactory organ; not described |
| ZFA:0000034 | lateral line system | sensory | draft 03b: group node |
| ZFA:0000010 | cardiovascular system | cardiovascular | parent of heart and vessels; not described |
| ZFA:0000096 | cardinal system | cardiovascular | parent of the cardinal veins; not described |
| ZFA:0005003 | pharyngeal vasculature | cardiovascular | parent of aortic arch and ventral aorta; not described |
| ZFA:0005024 | trunk vasculature | cardiovascular | parent of dorsal aorta and trunk vessels; not described |
| ZFA:0005037 | post-vent vasculature | cardiovascular | parent of caudal artery and vein; not described |
| ZFA:0001267 | cranial vasculature | cardiovascular | draft 03c: group node |
| ZFA:0007115 | pericardial region | cardiovascular | parent of pericardium; not described |
| ZFA:0005023 | hematopoietic system | hematopoietic_immune | parent of intermediate cell mass and spleen; not described |
| ZFA:0001159 | immune system | hematopoietic_immune | parent of thymus; not described |
| ZFA:0000272 | respiratory system | respiratory | parent of gill; not described |
| ZFA:0007116 | pleuroperitoneal region | respiratory | parent of swim bladder; not described |
| ZFA:0000339 | digestive system | digestive | parent of gut, pharynx and mouth; not described |
| ZFA:0000112 | gut | digestive | draft 03d: group node |
| ZFA:0001338 | intestine | digestive | draft 03d: group node |
| ZFA:0000036 | liver and biliary system | digestive | parent of liver and gall bladder; not described |
| ZFA:0001371 | pancreatic system | digestive | parent of the pancreatic buds; not described |
| ZFA:0000140 | pancreas | digestive | endocrine and exocrine pancreas fill its volume |
| ZFA:0000163 | renal system | excretory | parent of pronephros and kidney; not described |
| ZFA:0000151 | pronephros | excretory | draft 03d: group node |
| ZFA:0000529 | kidney | excretory | head kidney and posterior kidney fill its volume |
| ZFA:0001158 | endocrine system | endocrine | parent of thyroid and ultimobranchial body; not described |
| ZFA:0000632 | reproductive system | reproductive | parent of gonad and germ cells; not described |
| ZFA:0000413 | gonad | reproductive | draft 03d: group node; sex toggle switches the child |
| ZFA:0000434 | skeletal system | skeletal | 03e uiParent; not described |
| ZFA:0001216 | splanchnocranium | skeletal | draft 03e: group of seven arches; the cartilages draw them |
| ZFA:0000108 | fin | fins | 03e uiParent; not described |
| ZFA:0000368 | integument | integument_pigment | 03e uiParent; not described |

- DM-09 A group node carries the full record apart from geometry: definition, ZFIN window, sources. The info card shows it like any structure, without a "Jump to first appearance" target in 3D.
- DM-10 A slice-2 author may add geometry to a group node. The author may also set `geometry: null` on a container whose children fill its volume. Both changes pass through `npm run validate`.

### Merge plan

The merge script reads the five draft files (`03a` to `03e`, 220 records) and writes `structures.json`. It runs once; after that, authors edit `structures.json` directly.

#### Field mapping

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
| `spatial.apFraction` | `geometry.placement.u` | conversion below |
| `spatial.apFractionByStage` | keyframe `placement` overrides | keys `24`, `48`, `120` are hpf; `adult` is 2160 |
| `spatial.dv` | `geometry.placement.v` | keyword table: dorsal 0.6, ventral -0.6, spine or midline 0, surface plus or minus 1 |
| `spatial.laterality` | `laterality`, `placement.mirror` | first word: paired, bilateral or bilobed give `paired` and `mirror: true`; left; right; else midline |
| `spatial.landmarks`, `shape.notes`, `notes` | none | stay in the research files as slice-2 input |
| `shape.primitive` | `geometry.kind` | `sphere` becomes `ellipsoid` with equal radii; `fin` becomes `sheet` |
| `sizes[].dims_um` | `sizes[].dimsMm` | divided by 1000; `count`, `cells`, `tiers`, `*Deg`, `*Fraction` keys copied as they are |
| `sizes[].basis` (03c) | `sizes[].estimate` | `estimate` gives true; `derived` gives false with note "derived" |
| `sizes[].estimate` (03e) | `sizes[].estimate` | |
| `sizes[].stageLabel`, `hpf`, `source`, `note` | same | |
| `events[].event` | `events[].text` | `hpf` and `source` copied |
| `colorHint` | none | colours come from `systems.json` and the exception list |

- DM-11 The merge writes each `SizeRow` unchanged apart from the unit. Size rows are reference data for the info card. Geometry keyframes are authored in slice 2 from the size rows and the shape notes; the merge writes `geometry: null` for every record and a `geometry.todo` file lists the primitive kind and the converted `u` range per record.

#### System remap

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

#### Duplicate ownership

Seven ids appear in two files. The merge keeps one record per id and resolves the conflicts as research 03 fact-check table 2.2 and D5 direct.

| id | name | kept | resolution |
|---|---|---|---|
| ZFA:0001185 | periderm | 03e record | `uiParent` ZFA:0000368; `zfaParent` ZFA:0000016 (`part_of`); thickness 0.002 to 0.003 mm; `modelEndHpf` 168 from 03a with note |
| ZFA:0001056 | myotome | 03e record | count 30 to 32 with note; adult size rescaled by the referenceSL rule |
| ZFA:0000671 | horizontal myoseptum | 03a record | `zfaParent` ZFA:0001089 (`is_a`); `uiParent` ZFA:0001056 |
| ZFA:0000040 | median fin fold | 03a record | `visibleFromHpf` 24 and `modelEndHpf` 720 with notes; system fins |
| ZFA:0001306 | pharyngeal arch | 03c record | system respiratory; the 03c parameterization (count per side, region length, arch width) |
| ZFA:0000669 | head kidney | 03d record | system excretory; `visibleFromHpf` 96 with the Willett et al. 1999 note; 03c 120 hpf sizes merged in |
| ZFA:0000694 | ceratobranchial 5 tooth | 03e record | system digestive; the 03e count series kept |

#### Position: apFraction to u

`u` is arc length along the spine divided by the snout-to-notochord-end length, which equals SL after flexion (D3). Each draft used a different denominator. The rule per source is `u = apFraction x L_source / SL(t)`, clamped to `[0, 1]` except for records in the fins system.

| Source | Denominator up to 72 hpf | Denominator 72 to 720 hpf | Denominator at 2160 hpf | Factor applied |
|---|---|---|---|---|
| 03a | axis length from the snout (research 03a section 2) | TL | SL 18 mm | 1.0 |
| 03b | EL, treated as axis length | SL | SL 18 mm | 1.0 |
| 03c | TL (1.9, 3.1 mm at 24, 48 hpf) | TL (3.9 mm at 120 hpf) | SL 25 mm | 1.0 to 72 hpf; 1.114 from 72 to 720 hpf; 1.0 at 2160 |
| 03d | TL | TL | TL (anal fin origin at 0.55 TL) | 1.0 to 72 hpf; 1.114 from 72 to 720 hpf; 1.2 at 2160 |
| 03e | SL | SL | SL 28 mm | 1.0 |

The factor 1.114 is TL 3.9 mm divided by SL 3.5 mm at 5 dpf (research 05 section 5.2: Kimmel TL, Parichy SL at posterior swim bladder inflation). The factor 1.2 is the adult TL to SL ratio (research 05 section 13). Before 72 hpf the fin fold adds no measurable length to the notochord, so the merge treats TL, EL and axis length as equal; this is an assumption, not a measurement.

- DM-12 `u` may exceed 1.0 only for records in the fins system, and never exceeds 1.2 (research 05 section 13: TL is about 1.2 x SL).
- DM-13 `v` and `w` from the merge are provisional. Slice-2 authors set them against the body model and the validator checks only the range.

#### Reference SL rule (D6)

- DM-14 `referenceSL` is 18 mm (SL at 90 dpf, D6) for every structure with `sizeMode: 'mm'` and a keyframe at or after 72 hpf. It is null otherwise.
- DM-15 A keyframe before 72 hpf stores sizes in absolute millimetres. A keyframe at or after 72 hpf stores sizes at the reference SL: `stored = measured x 18 / SL_basis`. For a 2160 hpf row, `SL_basis` is the adult SL of the source file: 18 for 03a and 03b, 25 for 03c and 03d, 28 for 03e. For every other row it is `growth.standardLengthMm(hpf)`.
- DM-16 At runtime, for `t` at or after 72 hpf, `size(t) = interpolated(t) x SL(t) / 18`. At `t = 72` the two formulas agree, so the R3 to R4 boundary is continuous.
- DM-17 `sizeMode: 'bodyHeightFraction'` skips the rule; the sizes are fractions of `hD(u) + hV(u)` at the placement `u`.
- DM-18 `growth.standardLengthMm` equals `lengthMm` for EL and SL rows and `lengthMm / 1.114` for TL rows between 72 and 720 hpf. The growth table has 22 rows: 0 hpf 0.7 mm (zygote diameter); Kimmel EL at 11.66, 16, 19, 22, 24, 30, 36, 42, 48, 60 hpf; Kimmel TL at 72, 96, 120, 144, 168, 336, 504, 720 hpf; Singleman and Holtzman SL 12 mm at 1080, 18 mm at 2160, 25 mm at 4320 hpf (research 05 section 5.1 and 5.2; D6).

#### Presence window rules

- DM-19 `visibleFromHpf` defaults to `startHpf`. When `zfinStartStage` is `ZFS:0000000` (Unknown, 22 records), the record must set `visibleFromHpf` above 0 and give an `overrideNote`.
- DM-20 `visibleFromHpf` below `startHpf` is allowed with an `overrideNote`. Four records use it. Caudal vein ZFA:0000180 starts at 24 (ZFIN 96). Intersegmental vessel ZFA:0001285 starts at 22 (ZFIN 24). Thyroid primordium ZFA:0001081 starts at 24 (ZFIN 30). Endocrine pancreas ZFA:0001260 starts at 24 (ZFIN 48).
- DM-21 `modelEndHpf` defaults to the smaller of `endHpf` and 4320. D8 overrides: chorion ZFA:0000329 72 with fade from 48; yolk ZFA:0000084 168 (ZFA ends at 144); ball ZFA:0000006 and extension ZFA:0000106 168 (ZFA ends at 120). Draft overrides with notes: median fin fold 720, periderm 168, primordial germ cell ZFA:0009288 720 (the gonad handoff `ho-gonad` takes over).
- DM-22 `fadeInHpf` defaults to 5 percent of the duration of the ZFS stage that contains `visibleFromHpf`; `fadeOutHpf` uses the stage that contains `modelEndHpf` (D3). D8 sets chorion `fadeOutHpf` 24 and posterior chamber swim bladder ZFA:0001278 `fadeInHpf` 24 (96 to 120 hpf).
- DM-23 Every keyframe lies inside `[visibleFromHpf, modelEndHpf]`, and the first keyframe lies at `visibleFromHpf`.

#### Fixes the fact check demanded

Each fix names research 03 fact-check findings section 4 by item number.

1. Item 1, apFraction clamps: caudal fin ZFA:0001058 `u` [0.95, 1.0] with the sheet outline reaching 1.2; lepidotrichium ZFA:0001554 `u` [0.26, 1.0] with the rays on the fin outlines; melanophore stripe ZFA:0001463 [0.25, 1.0]; melanocyte ZFA:0009091, xanthophore ZFA:0009198 and iridophore ZFA:0009199 [0.05, 1.0]. The basis for the atlas is SL (DM-12).
2. Item 2, duplicates: the table above.
3. Item 3, parents: the 23 records of fact-check table 2.3 move the draft `parent` to `uiParent`. Their `zfaParent` comes from the "direct ZFA parents" column, with `parentRelation` `is_a` or `part_of`. The four develops_from cases (yolk syncytial layer, notochord, paraxial mesoderm, periderm) set `parentRelation: 'develops_from'` and keep the draft parent as `uiParent`. The 16 null parents of 03e take `zfaParent` from ZFA: horizontal myoseptum ZFA:0001089; slow and fast muscle cell ZFA:0009115; adductor mandibulae and sternohyoid ZFA:0000236; median fin fold ZFA:0000292; pectoral and pelvic fin bud ZFA:0001383; pectoral and pelvic fin ZFA:0005596; dorsal fin ZFA:0005597; lepidotrichium ZFA:0001590; the four larval melanophore stripes ZFA:0005220.
4. Item 4, pectoral fin bud ZFA:0000141: `visibleFromHpf` 28 (D8) with the Kimmel note; the 24 hpf size row moves to 28 hpf.
5. Item 5, yolk ZFA:0000084 at 48 hpf: `ballDiameter` 0.400 mm, `extensionLength` 0.600 mm (extension 1.5 x ball diameter, Kimmel high-pec text).
6. Item 6, tooth ZFA:0000694: the "tooth 5V present" event moves from 96 to 72 hpf.
7. Item 7, heart ZFA:0000114: looping starts at 30 hpf (D8); the tube stays straight before 30 hpf; the "from 28 hpf" event text is removed.
8. Item 8, adult SL: no numbers change; DM-15 records the source basis (25 mm for 03c and 03d, 28 mm for 03e) and rescales to 18 mm.
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
| ZFA:0000076 | swim bladder | 60 | move to 96 |
| ZFA:0000123 | liver | 24 | drop (liver primordium ZFA:0000124 holds 24 hpf) |
| ZFA:0000208 | gall bladder | 48 | move to 72 |
| ZFA:0000298 | vent | 24, 48 | drop both (proctodeum ZFA:0000066 holds 22 to 30 hpf) |
| ZFA:0000529 | kidney | 120 | move to 288 (pronephros handoff 12 to 14 dpf, D9) |
| ZFA:0000547 | mouth | 48 | move to 60 |
| ZFA:0001200 | corpuscles of Stannius | 24 | move to 50 |
| ZFA:0001448 | ultimobranchial body | 60, 120 | drop 60; move 120 to 168 |
| ZFA:0000622 | barbel | 900 | move to 1080 |
| ZFA:0007049 | adductor mandibulae | 2160 | keep; `modelEndHpf` 4320 with note (ZFIN end stage Days 21-29 is an annotation limit; the muscle persists) |

- DM-24 The heart is one record, ZFA:0000114 (D9). The merge folds four draft records into its `aliasChain`: heart primordium ZFA:0000028, heart rudiment ZFA:0000115, primitive heart tube ZFA:0000149 and heart tube ZFA:0000360. The alias windows are 11.66 to 19, 19 to 24, 24 to 30 and 30 to 42 hpf. The heart record gets `visibleFromHpf` 11.66 and an `overrideNote`. Their size rows and events merge into the heart record. Atrium ZFA:0000471, cardiac ventricle ZFA:0000009, bulbus arteriosus ZFA:0000173 and sinus venosus ZFA:0000154 stay as records with `visibleFromHpf` 42.
- DM-25 Record count after the merge: 220 draft records, minus 7 duplicates, minus 4 heart aliases, plus 27 group nodes that the drafts do not describe, gives 236.

### Colour exceptions (D10)

The exception list is data: the `colorOverride` field of each record named below. Every other record has `colorOverride: null` and takes the system hue with the lightness step of research 07 UX-VS-07. The dark hex values come from the draft `colorHint` fields where the drafts agree. Those are the 03c vessel colours, the 03e cartilage and bone colours, and the 03a yolk colour. The light hex values are proposals from this section; the research 07 check script must confirm 3:1 contrast against `#F5F6F7` before slice 3.

| Role (D10) | Records | dark | light | opacity |
|---|---|---|---|---|
| artery red | ZFA:0000014 dorsal aorta; ZFA:0000011 caudal artery; ZFA:0005004 aortic arch; ZFA:0000604 ventral aorta; ZFA:0005002 basilar artery; ZFA:0001053 primitive internal carotid artery | `#E31A1C` | `#A50F15` | |
| vein blue | ZFA:0000477 posterior cardinal vein; ZFA:0000423 anterior cardinal vein; ZFA:0000186 common cardinal vein; ZFA:0000180 caudal vein; ZFA:0001286 caudal vein plexus; ZFA:0001052 primordial hindbrain channel; ZFA:0005934 subintestinal venous plexus | `#1F78B4` | `#08519C` | |
| otolith white | ZFA:0001617 otolith | `#F5F5F5` | `#C8CCD0` | |
| near black | ZFA:0000144 retinal pigmented epithelium; ZFA:0009091 melanocyte; ZFA:0005221, ZFA:0005222, ZFA:0005223, ZFA:0005224 larval melanophore stripes; ZFA:0001463 melanophore stripe | `#23262B` | `#1B1F24` | |
| xanthophore yellow | ZFA:0009198 xanthophore | `#F2C14E` | `#B8860B` | |
| iridophore silver | ZFA:0009199 iridophore | `#C9D6DF` | `#7D8A94` | |
| cartilage Alcian blue | ZFA:0001580 neurocranium; ZFA:0001205 Meckel's cartilage; ZFA:0001399 palatoquadrate cartilage; ZFA:0001400 ceratohyal cartilage; ZFA:0001422 hyosymplectic cartilage; ZFA:0000095 pharyngeal arch 3-7 skeleton; ZFA:0000364 hypural | `#8FC1E3` | `#2F6F9F` | |
| bone alizarin ivory | ZFA:0000694 ceratobranchial 5 tooth; ZFA:0000191 dentary; ZFA:0000270 maxilla; ZFA:0000250 opercle; ZFA:0000184 cleithrum; ZFA:0001189 vertebra; ZFA:0000538 rib; ZFA:0001188 Weberian apparatus; ZFA:0001554 lepidotrichium | `#E9DFC4` | `#8C7F5E` | |
| yolk pale yellow | ZFA:0000084 yolk; ZFA:0000006 ball; ZFA:0000106 extension; ZFA:0000088 yolk syncytial layer | `#F2C94C` | `#A6861B` | |
| lens clear | ZFA:0000035 lens | `#CFEEFF` | `#8FB4CC` | 0.35 |
| chorion glass | ZFA:0000329 chorion | `#C8D0D8` | `#7A8790` | 0.10 (research 07 UX-VS-15) |

Intersegmental vessel ZFA:0001285 and the dorsal longitudinal anastomotic vessel ZFA:0005025 carry arterial and venous segments and keep the system hue. The neurocranium keeps the cartilage colour in version 1 although its ethmoid region ossifies at 1080 hpf.

- DM-26 A `colorOverride` never changes on selection. Selection is an outline in `--focus` (D10, research 07 UX-VS-17).

### Attribution data

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

### Validation rules

`scripts/validate-data.ts` runs the rules below after the zod parse. An `E` rule fails the run. A `W` rule prints and continues. Messages use the pattern `<code> <file>:<id>: <text>`.

1. E001 Schema parse. Message: `E001 <file>:<path>: <zod issue>`.
2. E002 Every `id`, `zfaParent`, `uiParent`, alias id, handoff id and system root exists in `anatomy_item.txt`. Message: `E002 <file>:<id>: not in anatomy_item.txt (ZFA release 2026-07-16)`.
3. E003 Every ZFS id exists in `stage_ontology.txt`. Message: `E003 <file>:<id>: <zfs> not in stage_ontology.txt`.
4. E004 `name` equals the ZFIN label. Message: `E004 structures:<id>: name "<name>" differs from ZFIN label "<label>"`.
5. E005 `zfinStartStage` and `zfinEndStage` equal the ZFIN columns. Message: `E005 structures:<id>: zfinStartStage <zfs> differs from ZFIN <zfs>` (same for the end stage).
6. E006 `startHpf` and `endHpf` equal the ZFS bounds of those stages. Message: `E006 structures:<id>: startHpf <n> differs from the ZFS bound <n>`.
7. E007 `visibleFromHpf` differs from `startHpf`, or `modelEndHpf` differs from `min(endHpf, 4320)`, only with a non-empty `overrideNote`. Message: `E007 structures:<id>: visibleFromHpf <n> differs from startHpf <n> without overrideNote`.
8. E008 A record whose `zfinStartStage` is `ZFS:0000000` sets `visibleFromHpf` above 0, except the root ZFA:0001094. Message: `E008 structures:<id>: start stage Unknown and visibleFromHpf is 0`.
9. E009 `visibleFromHpf < modelEndHpf` and `fadeInHpf + fadeOutHpf <= modelEndHpf - visibleFromHpf`. Message: `E009 structures:<id>: presence window [<a>, <b>] is empty or shorter than its fades`.
10. E010 Keyframes are strictly increasing in hpf. Message: `E010 structures:<id>: keyframe <i> at <n> hpf is not after keyframe <i-1>`.
11. E011 Every keyframe lies inside the presence window. Message: `E011 structures:<id>: keyframe at <n> hpf lies outside [<visibleFromHpf>, <modelEndHpf>]`.
12. W001 The first keyframe lies at `visibleFromHpf`. Message: `W001 structures:<id>: first keyframe at <n> hpf, visibleFromHpf is <m>`.
13. E012 `placement.u` lies in `[0, 1]`, or in `[0, 1.2]` when `system` is `fins`; `v` and `w` lie in `[-1, 1]`; a range has `min <= max`. Applies to the base placement and to every keyframe override. Message: `E012 structures:<id>: placement.u [<a>, <b>] outside [0, <max>]`.
14. E013 One record per id across `structures.json`. Message: `E013 structures:<id>: appears <n> times`.
15. E014 Every `uiParent` is a record, and exactly one record (ZFA:0001094) has `uiParent: null`. Message: `E014 structures:<id>: uiParent <pid> is not a record`; `E014 structures: <n> root records, expected 1`.
16. E015 The `uiParent` chain has no cycle. Message: `E015 structures:<id>: uiParent cycle <id> -> ... -> <id>`.
17. E016 When `parentRelation` is `part_of`, `is_a` or `develops_from`, `anatomy_relationship.txt` has that row for `(zfaParent, id)`. Message: `E016 structures:<id>: no <relation> row to <pid> in anatomy_relationship.txt`.
18. E017 No alias id in an `aliasChain` is also a record, and alias windows are contiguous. Message: `E017 structures:<id>: alias <aid> is also a record`.
19. E018 `system` is in `systems.json`; `alsoIn` does not contain `system`. Message: `E018 structures:<id>: system <s> is not in systems.json`.
20. E019 `referenceSL` is 18 when `sizeMode` is `mm` and any keyframe is at or after 72 hpf; null otherwise. Message: `E019 structures:<id>: referenceSL <v> does not match the keyframe range`.
21. E020 Every `SizeRow` has a non-empty `source`. Message: `E020 structures:<id>: size row at <n> hpf has no source`.
22. E021 Every handoff `from` and `to` id is a record; the window lies inside the `from` presence window and starts at or before every `to` record's `visibleFromHpf` plus its `fadeInHpf`. Message: `E021 handoffs:<hid>: <id> is not a record`; `E021 handoffs:<hid>: window [<a>, <b>] outside the presence of <id>`.
23. E022 `stages` has 44 rows sorted by `startHpf`, each `startHpf` equals the previous `endHpf`, and the first is 0. Message: `E022 stages:<zfs>: startHpf <n> differs from the previous endHpf <m>`.
24. E023 `timeAxis.segments` are contiguous from 0 to 4320 and the shares sum to 1 within 1e-6. Message: `E023 stages:timeAxis: shares sum to <x>, expected 1`.
25. E024 `headlineTicks` are 18, strictly increasing, inside the domain, and each `zfs` is a stage that starts at that hpf. Message: `E024 stages:timeAxis: tick "<label>" at <n> hpf does not start stage <zfs>`.
26. E025 `growth` is sorted by hpf and `lengthMm` and `standardLengthMm` are non-decreasing. Message: `E025 stages:growth: length falls at <n> hpf`.
27. E026 Every event with `canonical: true` matches the D8 value. Message: `E026 stages:<eid>: hpf <n> differs from the canonical <m>`.
28. E027 Every `systems.json` `paletteSlot` and `order` is unique and the file has 15 rows. Message: `E027 systems:<id>: paletteSlot <slot> is reused`.
29. E028 `structures.json` has no `colorOverride` on a record outside the exception list of this section. Message: `E028 structures:<id>: colorOverride is not in the exception list`.
30. W002 A group node has at least one child. Message: `W002 structures:<id>: group node has no children`.
31. W003 A record's `uiParent` is in another system. Message: `W003 structures:<id>: uiParent <pid> is in system <s>`.
32. W004 Two consecutive keyframes span more than one time-axis segment. Message: `W004 structures:<id>: no keyframe between <a> and <b> hpf`.
33. W005 A size row lies outside the presence window. Message: `W005 structures:<id>: size row at <n> hpf lies outside [<a>, <b>]`.

- DM-28 The validator prints a summary line `validate: <n> records, <e> errors, <w> warnings` and exits with code 1 when `e > 0`.
- DM-29 The validator loads the ZFIN files from `docs/research/zfin/` at the pinned release. A release change is a data change: it updates `stages.meta.zfaRelease`, the attribution text, and reruns the merge checks.

### Conflicts with the decision record

1. D9 lists "heart cone to heart tube, 22 to 24 hpf" as a handoff and also makes the heart one record with an `aliasChain`. A `HandoffRecord` needs two records. This section implements the row as an alias boundary inside ZFA:0000114 (DM-24) and omits it from `handoffs.json`, which therefore has 12 rows instead of 13. If D9 intends a separate heart tube record, DM-24 and DM-25 change.
2. D14 states that ZFA and ZFS data are CC BY 4.0. The `zfa.obo` header (release 2026-07-16) declares `terms:license https://creativecommons.org/licenses/by/3.0/`. Research 01 marked the 4.0 claim as unverified. The attribution text follows D14; the ZFIN download terms need one check before slice 4 ships `ATTRIBUTION.md`.
