// Materials policy of src/viewer/materials.ts: the per-system default opacity table of RN-04
// and its x-ray ramp, the medial-to-lateral render order of RN-03, and the transparency and
// depth-write rules that let the notochord read through the trunk in the default view.
import { describe, expect, it } from 'vitest'
import { BufferGeometry, Group, Mesh, Plane, Vector3 } from 'three'
import { presenceAt } from '../../src/core/presence.ts'
import { isSkinRecord } from '../../src/core/primitives/buildStructure.ts'
import { StructuresFile } from '../../src/core/schema.ts'
import type { StructureRecord } from '../../src/core/schema.ts'
import { structuresRaw } from '../../src/data/structures/all.ts'
import { DEFAULT_XRAY } from '../../src/state/slices/types.ts'
import { emptyFluorescence } from '../../src/core/fluorescence.ts'
import type { ReporterId } from '../../src/core/fluorescence.ts'
import {
  OPACITY_ANCHORS, PICK_MIN_OPACITY, PREVIEW_BASE_HEX, PREVIEW_CONTEXT_CAP, PREVIEW_DIM_HEX, PREVIEW_HOVER_HEX,
  PREVIEW_SKIN_FACTOR, RAYCAST_LAYER, RENDER_ORDER_CHORION, RENDER_ORDER_PIGMENT, RENDER_ORDER_SKIN,
  RENDER_ORDER_TRANSLUCENT, ROUGHNESS, SIGNAL_EMISSIVE, SIGNAL_OPACITY, SKIN_LIFT, SKIN_RIM_EMISSIVE,
  SOFT_TISSUE_ENV_INTENSITY, SOFT_TISSUE_ROUGHNESS, XRAY_DEFAULT,
  applyVisualPass, classOpacity, createStructureMaterial, fluorescenceColor, isGhosted, lateralDepth, opacityClassOf, resolveVisual, skinOpacity,
} from '../../src/viewer/materials.ts'
import type { OpacityClass, VisualInput } from '../../src/viewer/materials.ts'
import type { StructureHandle, ViewerRuntime } from '../../src/viewer/runtime.ts'

const structures = StructuresFile.parse(structuresRaw)
const byId = new Map(structures.map((r) => [r.id, r]))
const rec = (id: string): StructureRecord => {
  const r = byId.get(id)
  if (!r) throw new Error(`${id} is not a record`)
  return r
}

const SKIN = 'ZFA:0001094'
const NOTOCHORD = 'ZFA:0000135'
const SOMITE = 'ZFA:0000155'
const MYOTOME = 'ZFA:0001056'
const SPINAL_CORD = 'ZFA:0000075'
const MIDBRAIN = 'ZFA:0000128'
const INTESTINAL_BULB = 'ZFA:0001076'
const HEART = 'ZFA:0000114'
const DORSAL_AORTA = 'ZFA:0000014'
const RETINA = 'ZFA:0000152'
const LENS = 'ZFA:0000035'
const OTOLITH = 'ZFA:0001617'
const OTIC_VESICLE = 'ZFA:0000051'
const INNER_EAR = 'ZFA:0000217'
const FIN_FOLD = 'ZFA:0000040'
const CAUDAL_FIN = 'ZFA:0001058'
const SCALE = 'ZFA:0000277'
const STRIPE_1D = 'ZFA:0001463'
/** The D10 near-black pigment records and one hour at which each draws. */
const PIGMENT_AT: readonly (readonly [string, number])[] = [
  ['ZFA:0009091', 4320], [STRIPE_1D, 4320],
  ['ZFA:0005221', 120], ['ZFA:0005222', 120], ['ZFA:0005223', 120], ['ZFA:0005224', 120],
]

function stubHandle(record: StructureRecord): StructureHandle {
  const material = createStructureMaterial(record, '#8899AA', new Plane())
  const mesh = new Mesh(new BufferGeometry(), material)
  const group = new Group()
  group.add(mesh)
  return {
    id: record.id,
    record,
    group,
    meshes: [mesh],
    material,
    instanced: false,
    localFrame: false,
    mirrored: false,
    isSkin: isSkinRecord(record),
    hex: '#8899AA',
    roleOpacity: record.colorOverride?.opacity ?? null,
    appliedHex: null,
    appliedEmissiveHex: null,
    lodGeometries: [{ interactive: null, final: null }],
    builtLod: 'final',
    builtHpf: 48,
    paramHash: null,
    bounds: { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0], radius: 0.1 },
    placement: null,
    twinPlacement: null,
    center: new Vector3(),
    radius: 0.1,
    volume: 0,
    opacity: 0,
    presence: null,
    failed: false,
  }
}

function input(patch: Partial<VisualInput> = {}): VisualInput {
  return {
    t: 48,
    sex: 'female',
    theme: 'dark',
    palette: 'atlas',
    xray: XRAY_DEFAULT,
    isolate: false,
    presentation: false,
    selection: [],
    hover: null,
    hiddenSystems: [],
    hiddenStructures: [],
    textMutedHex: '#8A9199',
    ...patch,
  }
}

/** Opacity a record takes at `hpf` and an x-ray value, with its presence applied. */
function opacityOf(id: string, hpf: number, xray = XRAY_DEFAULT): number {
  const record = rec(id)
  const handle = stubHandle(record)
  const presence = presenceAt(record, hpf)
  return resolveVisual(handle, input({ t: hpf, xray }), presence).opacity
}

describe('default opacity table (RN-04)', () => {
  it('matches the state default so the calibrated view is the one the app opens with', () => {
    expect(XRAY_DEFAULT).toBe(DEFAULT_XRAY)
  })

  it('holds the skin at 0.15 to 0.25 with its rim', () => {
    expect(skinOpacity(XRAY_DEFAULT)).toBeGreaterThanOrEqual(0.15)
    expect(skinOpacity(XRAY_DEFAULT)).toBeLessThanOrEqual(0.25)
    expect(opacityOf(SKIN, 48)).toBeCloseTo(skinOpacity(XRAY_DEFAULT), 6)
  })

  it('holds the somites and the myotomes at 0.45 to 0.6', () => {
    for (const [id, hpf] of [[SOMITE, 24], [MYOTOME, 48], [MYOTOME, 120]] as const) {
      const o = opacityOf(id, hpf)
      expect(o, `${id} at ${hpf} hpf`).toBeGreaterThanOrEqual(0.45)
      expect(o, `${id} at ${hpf} hpf`).toBeLessThanOrEqual(0.6)
    }
  })

  it('holds the brain and the gut at about 0.7', () => {
    for (const id of [MIDBRAIN, INTESTINAL_BULB, SPINAL_CORD]) {
      const o = opacityOf(id, 120)
      expect(o, id).toBeGreaterThanOrEqual(0.65)
      expect(o, id).toBeLessThanOrEqual(0.75)
    }
  })

  it('keeps the notochord, the heart, the vessels, the eye and the otoliths opaque', () => {
    for (const [id, hpf] of [[NOTOCHORD, 48], [HEART, 48], [DORSAL_AORTA, 48], [RETINA, 48], [OTOLITH, 120]] as const) {
      expect(opacityOf(id, hpf), `${id} at ${hpf} hpf`).toBeGreaterThan(0.99)
    }
  })

  it('keeps the D10 role opacity of the lens under the class value', () => {
    expect(rec(LENS).colorOverride?.opacity).toBe(0.35)
    expect(opacityOf(LENS, 48)).toBeCloseTo(0.35, 6)
  })

  it('shows the notochord through the trunk at every headline stage without touching the slider', () => {
    for (const hpf of [24, 30, 48, 72, 120]) {
      expect(opacityOf(NOTOCHORD, hpf), `notochord at ${hpf} hpf`).toBeGreaterThan(0.99)
      const wall = hpf <= 30 ? opacityOf(SOMITE, hpf) : opacityOf(MYOTOME, hpf)
      expect(wall, `trunk wall at ${hpf} hpf`).toBeLessThanOrEqual(0.6)
      expect(opacityOf(SKIN, hpf), `skin at ${hpf} hpf`).toBeLessThanOrEqual(0.25)
    }
  })
})

describe('x-ray ramp', () => {
  it('keeps the full 0 to 100 range and never rises with the slider', () => {
    for (const cls of Object.keys(OPACITY_ANCHORS) as OpacityClass[]) {
      const [a0, a60, a100] = OPACITY_ANCHORS[cls]
      expect(classOpacity(cls, 0)).toBeCloseTo(a0, 6)
      expect(classOpacity(cls, XRAY_DEFAULT)).toBeCloseTo(a60, 6)
      expect(classOpacity(cls, 100)).toBeCloseTo(a100, 6)
      let previous = Infinity
      for (let x = 0; x <= 100; x++) {
        const o = classOpacity(cls, x)
        expect(o, `${cls} at ${x}`).toBeLessThanOrEqual(previous + 1e-9)
        expect(o).toBeGreaterThanOrEqual(0)
        previous = o
      }
    }
  })

  it('clamps outside the range and leaves the skin at 0.6 with no x-ray', () => {
    expect(classOpacity('wall', -20)).toBeCloseTo(OPACITY_ANCHORS.wall[0], 6)
    expect(classOpacity('wall', 200)).toBeCloseTo(OPACITY_ANCHORS.wall[2], 6)
    expect(skinOpacity(0)).toBeCloseTo(0.6, 6)
    expect(skinOpacity(100)).toBeCloseTo(0, 6)
  })

  it('never makes the notochord transparent, at any x-ray value', () => {
    for (const x of [0, 25, 60, 80, 100]) expect(opacityOf(NOTOCHORD, 48, x)).toBeGreaterThan(0.99)
  })
})

describe('opacity class of a record', () => {
  it('reads the system table with the per-record exceptions', () => {
    expect(opacityClassOf(rec(SKIN))).toBe('skin')
    expect(opacityClassOf(rec(NOTOCHORD))).toBe('core')
    expect(opacityClassOf(rec(SOMITE))).toBe('wall')
    expect(opacityClassOf(rec(MYOTOME))).toBe('wall')
    expect(opacityClassOf(rec(MIDBRAIN))).toBe('organ')
    expect(opacityClassOf(rec(HEART))).toBe('core')
    expect(opacityClassOf(rec('ZFA:0000671'))).toBe('core')   // horizontal myoseptum
    expect(opacityClassOf(rec('ZFA:0009091'))).toBe('pigment') // melanocyte and the adult flank stripe 1V
    expect(opacityClassOf(rec('ZFA:0000121'))).toBe('veil')   // lateral plate mesoderm
    expect(opacityClassOf(rec('ZFA:0001206'))).toBe('veil')   // intermediate mesoderm
    expect(opacityClassOf(rec('ZFA:0000113'))).toBe('veil')   // head mesenchyme
  })

  it('keeps the melanophore records near opaque so the near black reads as pigment', () => {
    // At the 0.6 of `tissue` the pale myotomes behind the adult flank lifted the bands to about
    // L* 45, three times the L* 15 of the D10 near black, so they read as grey.
    for (const [id, hpf] of PIGMENT_AT) {
      expect(opacityClassOf(rec(id)), id).toBe('pigment')
      expect(opacityOf(id, hpf), `${id} at ${hpf} hpf`).toBeGreaterThanOrEqual(0.9)
    }
    // The deep view still opens them, so the flank organs read at x-ray 100 (RN-07).
    expect(opacityOf(STRIPE_1D, 4320, 100)).toBeCloseTo(0.45, 6)
  })

  it('gives every record a class the anchor table knows', () => {
    const known = Object.keys(OPACITY_ANCHORS)
    for (const r of structures) expect(known, r.id).toContain(opacityClassOf(r))
  })

  it('leaves the sensory capsules translucent so the parts inside them read (RN-04)', () => {
    // The ear vesicle used to take the opaque sensory default, so its wall wrote depth and the two
    // otoliths inside it never drew.
    for (const id of [OTIC_VESICLE, INNER_EAR]) {
      expect(opacityClassOf(rec(id)), id).toBe('capsule')
      expect(opacityOf(id, 120), id).toBeLessThan(0.99)
    }
    expect(opacityOf(OTOLITH, 120)).toBeGreaterThan(0.99)
  })

  it('holds the fin fold below the fins and the scales below both', () => {
    expect(opacityOf(FIN_FOLD, 48)).toBeCloseTo(0.35, 6)
    expect(opacityOf(CAUDAL_FIN, 4320)).toBeCloseTo(0.6, 6)
    expect(opacityOf(SCALE, 4320)).toBeCloseTo(0.25, 6)
  })
})

describe('lateral depth (RN-03)', () => {
  it('is 0 on the midline and grows outward', () => {
    expect(lateralDepth(rec(NOTOCHORD))).toBe(0)
    expect(lateralDepth(rec(SPINAL_CORD))).toBe(0)
    expect(lateralDepth(rec(SOMITE))).toBeGreaterThan(0.4)
    expect(lateralDepth(rec(MYOTOME))).toBeGreaterThan(0.4)
  })

  it('gives a derived record the depth of the source it slices', () => {
    // The retina and the lens carry no placement of their own; without the source they would
    // paint before the trunk wall (RN-03).
    expect(lateralDepth(rec(RETINA))).toBe(0)
    expect(lateralDepth(rec(RETINA), byId)).toBeGreaterThan(lateralDepth(rec(MYOTOME), byId))
    expect(lateralDepth(rec(LENS), byId)).toBe(lateralDepth(rec(RETINA), byId))
  })

  it('never exceeds the skin', () => {
    for (const r of structures) {
      const d = lateralDepth(r)
      expect(d, r.id).toBeGreaterThanOrEqual(0)
      expect(d, r.id).toBeLessThanOrEqual(1)
    }
  })
})

describe('render order and depth write (RN-03)', () => {
  const ids = [NOTOCHORD, SPINAL_CORD, MYOTOME, SKIN, RETINA, DORSAL_AORTA]

  function pass(xray = XRAY_DEFAULT): Map<string, StructureHandle> {
    const handles = new Map<string, StructureHandle>()
    for (const id of ids) handles.set(id, stubHandle(rec(id)))
    const rt = { data: null, handles, canvas: null } as unknown as ViewerRuntime
    applyVisualPass(rt, input({ t: 120, xray }))
    return handles
  }

  it('draws the opaque structures first with depth write on', () => {
    const handles = pass()
    for (const id of [NOTOCHORD, RETINA, DORSAL_AORTA]) {
      const h = handles.get(id)!
      expect(h.material.transparent, id).toBe(false)
      expect(h.material.depthWrite, id).toBe(true)
      expect(h.meshes[0]!.renderOrder, id).toBe(0)
    }
  })

  it('draws the translucent structures after them, from the spine outward, with the skin last', () => {
    const handles = pass()
    const order = (id: string) => handles.get(id)!.meshes[0]!.renderOrder
    for (const id of [SPINAL_CORD, MYOTOME]) {
      const h = handles.get(id)!
      expect(h.material.transparent, id).toBe(true)
      expect(h.material.depthWrite, id).toBe(false)
      expect(order(id), id).toBeGreaterThanOrEqual(RENDER_ORDER_TRANSLUCENT)
    }
    expect(order(SPINAL_CORD)).toBeLessThan(order(MYOTOME))
    expect(order(MYOTOME)).toBeLessThan(RENDER_ORDER_SKIN)
    expect(order(SKIN)).toBe(RENDER_ORDER_SKIN)
    expect(RENDER_ORDER_CHORION).toBeGreaterThan(RENDER_ORDER_SKIN)
  })

  it('draws the pigment class after the skin, because a melanophore lies in the skin', () => {
    const handles = new Map<string, StructureHandle>()
    for (const id of [SKIN, MYOTOME, STRIPE_1D]) handles.set(id, stubHandle(rec(id)))
    const rt = { data: null, handles, canvas: null } as unknown as ViewerRuntime
    applyVisualPass(rt, input({ t: 4320 }))
    const order = (id: string) => handles.get(id)!.meshes[0]!.renderOrder
    expect(order(STRIPE_1D)).toBe(RENDER_ORDER_PIGMENT)
    expect(RENDER_ORDER_PIGMENT).toBeGreaterThan(RENDER_ORDER_SKIN)
    expect(RENDER_ORDER_PIGMENT).toBeLessThan(RENDER_ORDER_CHORION)
    expect(order(MYOTOME)).toBeLessThan(order(SKIN))
  })

  it('hides a structure with no opacity and keeps the visible ones on', () => {
    const handles = pass()
    expect(handles.get(MYOTOME)!.group.visible).toBe(true)
    const rt = { data: null, handles, canvas: null } as unknown as ViewerRuntime
    applyVisualPass(rt, input({ t: 120, hiddenSystems: ['muscular'] }))
    expect(handles.get(MYOTOME)!.group.visible).toBe(false)
    expect(handles.get(NOTOCHORD)!.group.visible).toBe(true)
  })
})

// ---- the reporter preview (D18) ----------------------------------------------------------------

const CHORION = 'ZFA:0000329'
/** The preview with the default context slider (24 of 100). */
const PREVIEW = { ...emptyFluorescence(), enabled: true }

function previewInput(signals: readonly (readonly [string, readonly ReporterId[]])[], patch: Partial<VisualInput> = {}): VisualInput {
  return input({ fluorescence: PREVIEW, signals: new Map<string, readonly ReporterId[]>(signals), ...patch })
}

/** The visual target of one record under the preview. */
function previewTarget(id: string, hpf: number, signals: readonly (readonly [string, readonly ReporterId[]])[], patch: Partial<VisualInput> = {}) {
  const record = rec(id)
  return resolveVisual(stubHandle(record), previewInput(signals, { t: hpf, ...patch }), presenceAt(record, hpf))
}

/** Runs one pass over the given records and returns their handles. */
function previewPass(ids: readonly string[], signals: readonly (readonly [string, readonly ReporterId[]])[], patch: Partial<VisualInput> = {}): Map<string, StructureHandle> {
  const handles = new Map<string, StructureHandle>()
  for (const id of ids) handles.set(id, stubHandle(rec(id)))
  const rt = { data: null, handles, canvas: null } as unknown as ViewerRuntime
  applyVisualPass(rt, previewInput(signals, patch))
  return handles
}

describe('reporter preview opacity (D18, review items 1 and 5)', () => {
  it('keeps the unlabelled anatomy pickable at the opacity the preview dims it to', () => {
    const somite = previewTarget(SOMITE, 24, [[SPINAL_CORD, ['egfp']]])
    expect(somite.opacity).toBeLessThan(PICK_MIN_OPACITY)
    expect(somite.pickOpacity).toBeGreaterThanOrEqual(PICK_MIN_OPACITY)
    const handles = previewPass([SOMITE, SPINAL_CORD], [[SPINAL_CORD, ['egfp']]], { t: 24 })
    expect(handles.get(SOMITE)!.meshes[0]!.layers.isEnabled(RAYCAST_LAYER)).toBe(true)
  })

  it('leaves an isolate ghost unpickable', () => {
    const ghosted = previewPass([SOMITE, SPINAL_CORD], [[SPINAL_CORD, ['egfp']]], { t: 24, isolate: true, selection: [SPINAL_CORD] })
    expect(ghosted.get(SOMITE)!.meshes[0]!.layers.isEnabled(RAYCAST_LAYER)).toBe(false)
  })

  it('reads the same pick opacity as the drawn opacity outside the preview', () => {
    const record = rec(SOMITE)
    const plain = resolveVisual(stubHandle(record), input({ t: 24 }), presenceAt(record, 24))
    expect(plain.pickOpacity).toBe(plain.opacity)
  })

  it('holds a signalled structure at the signal opacity under the role clamp of D10', () => {
    expect(previewTarget(SPINAL_CORD, 48, [[SPINAL_CORD, ['egfp']]]).opacity).toBeCloseTo(SIGNAL_OPACITY, 6)
    // The lens is glass at 0.35 and the chorion at 0.1; a rule that targets them cannot open them.
    expect(previewTarget(LENS, 48, [[LENS, ['egfp']]]).opacity).toBeCloseTo(0.35 * presenceAt(rec(LENS), 48).opacity, 6)
    expect(previewTarget(CHORION, 24, [[CHORION, ['egfp']]]).opacity).toBeCloseTo(0.1 * presenceAt(rec(CHORION), 24).opacity, 6)
  })

  it('dims the unlabelled anatomy to the context cap and keeps the x-ray slider on the skin', () => {
    const context = PREVIEW.context / 100
    expect(previewTarget(MIDBRAIN, 48, [[SPINAL_CORD, ['egfp']]]).opacity).toBeCloseTo(PREVIEW_CONTEXT_CAP * context, 6)
    expect(previewTarget(SKIN, 48, []).opacity).toBeCloseTo(skinOpacity(XRAY_DEFAULT) * context * PREVIEW_SKIN_FACTOR, 6)
    expect(previewTarget(SKIN, 48, [], { xray: 100 }).opacity).toBeCloseTo(0, 6)
  })

  it('never treats the skin as a signalled target, whatever the signal map holds', () => {
    const context = PREVIEW.context / 100
    const target = previewTarget(SKIN, 48, [[SKIN, ['egfp']]])
    expect(target.opacity).toBeCloseTo(skinOpacity(XRAY_DEFAULT) * context * PREVIEW_SKIN_FACTOR, 6)
    const handles = previewPass([SKIN], [[SKIN, ['egfp']]], { t: 48 })
    expect(handles.get(SKIN)!.appliedHex).toBe(PREVIEW_DIM_HEX)
    expect(handles.get(SKIN)!.appliedEmissiveHex).toBe('#000000')
  })

  it('ghosts every structure outside the selection only while isolate is on', () => {
    expect(isGhosted(SOMITE, { isolate: true, selection: [SPINAL_CORD] })).toBe(true)
    expect(isGhosted(SPINAL_CORD, { isolate: true, selection: [SPINAL_CORD] })).toBe(false)
    expect(isGhosted(SOMITE, { isolate: true, selection: [] })).toBe(false)
    expect(isGhosted(SOMITE, { isolate: false, selection: [SPINAL_CORD] })).toBe(false)
  })
})

describe('reporter preview colours and the skin rim (review items 4 and 10)', () => {
  it('paints the signal, the dimmed anatomy and the hover from the named colours', () => {
    const handles = previewPass([SPINAL_CORD, MIDBRAIN], [[SPINAL_CORD, ['egfp']]], { t: 48, hover: MIDBRAIN })
    const lit = handles.get(SPINAL_CORD)!
    expect(lit.appliedHex).toBe(PREVIEW_BASE_HEX)
    expect(lit.appliedEmissiveHex).toBe(fluorescenceColor(['egfp']))
    expect(lit.material.emissiveIntensity).toBe(SIGNAL_EMISSIVE)
    const dim = handles.get(MIDBRAIN)!
    expect(dim.appliedHex).toBe(PREVIEW_DIM_HEX)
    expect(dim.appliedEmissiveHex).toBe(PREVIEW_HOVER_HEX)
  })

  it('keeps the skin rim over the preview ground in both page themes and drops the lift', () => {
    expect(SKIN_RIM_EMISSIVE.fluorescence).toBeCloseTo(SKIN_RIM_EMISSIVE.dark * 0.3, 6)
    expect(SKIN_LIFT.fluorescence).toBe(0)
    const handles = previewPass([SKIN], [], { t: 48, theme: 'light' })
    const uniforms = handles.get(SKIN)!.material.userData.atlasSkin as { rimEmissive: { value: number }; lift: { value: number } }
    expect(uniforms.rimEmissive.value).toBeCloseTo(SKIN_RIM_EMISSIVE.fluorescence, 6)
    expect(uniforms.lift.value).toBe(0)
    const rt = { data: null, handles, canvas: null } as unknown as ViewerRuntime
    applyVisualPass(rt, input({ t: 48, theme: 'light' }))
    expect(uniforms.rimEmissive.value).toBe(SKIN_RIM_EMISSIVE.light)
    applyVisualPass(rt, input({ t: 48, theme: 'dark' }))
    expect(uniforms.lift.value).toBe(SKIN_LIFT.dark)
  })
})

describe('surface finish (AR-23, AR-26, review item 14)', () => {
  const finish = (id: string): { roughness: number; env: number } => {
    const material = createStructureMaterial(rec(id), '#8899AA', new Plane())
    return { roughness: material.roughness, env: material.envMapIntensity }
  }

  it('keeps the skin and every firm structure at the projector-tuned finish', () => {
    expect(ROUGHNESS).toBe(0.55)
    for (const id of [SKIN, NOTOCHORD, HEART, MIDBRAIN]) {
      expect(finish(id), id).toEqual({ roughness: ROUGHNESS, env: 0.3 })
    }
  })

  it('softens the wall, veil and tissue classes only', () => {
    expect(SOFT_TISSUE_ROUGHNESS).toBe(0.8)
    expect(SOFT_TISSUE_ENV_INTENSITY).toBe(0.15)
    for (const id of [SOMITE, MYOTOME, FIN_FOLD, CAUDAL_FIN]) {
      expect(finish(id), id).toEqual({ roughness: SOFT_TISSUE_ROUGHNESS, env: SOFT_TISSUE_ENV_INTENSITY })
    }
  })
})
