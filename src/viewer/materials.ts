// Materials (AR-26 to AR-34): one MeshStandardMaterial per structure, the
// colour policy of D10 through the palette, the opacity rules (the per-system
// default table of RN-04 and its x-ray ramp, chorion, lens, isolate ghosts,
// presence fades), the transparency and render-order rules (RN-03), and the
// raycast layer rule. `applyVisualPass` writes all of it in one
// loop over the handles; it runs when the store changed, never per mesh.
// The skin material carries a fresnel rim (phase 2): the silhouette of the
// translucent body reads on a projector while the interior stays x-ray.
import { Color, DoubleSide, FrontSide, MeshStandardMaterial } from 'three'
import { REPORTERS, resolveFluorescence } from '../core/fluorescence.ts'
import type { FluorescenceConfig, FluorescenceSignals, ReporterId } from '../core/fluorescence.ts'
import type { Plane, WebGLProgramParametersWithUniforms } from 'three'
import { hasMeshAt, presenceAt } from '../core/presence.ts'
import type { Presence, Sex } from '../core/presence.ts'
import { structureColour, systemPair } from '../core/palette.ts'
import type { PaletteMode, Theme } from '../core/palette.ts'
import { isSkinRecord } from '../core/primitives/buildStructure.ts'
import { derivedSourceOf } from '../core/primitives/derived.ts'
import type { AtlasData, StructureRecord, SystemId } from '../core/schema.ts'
import type { StructureHandle, ViewerRuntime } from './runtime.ts'
import type { ThemeVariant } from './tokens.ts'

export const ROUGHNESS = 0.55
export const METALNESS = 0.05
/**
 * Soft tissue: the wall, veil and tissue classes. A somite, a fin fold or a fin reads as a damp
 * sheet, so it takes a rougher finish and a weaker environment term than the ROUGHNESS of AR-26
 * and the 0.3 of AR-23. Every other structure, the skin included, keeps those two values.
 */
export const SOFT_TISSUE_ROUGHNESS = 0.8
export const SOFT_TISSUE_ENV_INTENSITY = 0.15
export const HOVER_EMISSIVE = 0.08
export const GHOST_OPACITY = 0.06
export const GHOST_OPACITY_PRESENTATION = 0.14
/** First render order of a translucent structure; the rank of RN-03 counts up from here. */
export const RENDER_ORDER_TRANSLUCENT = 1
export const RENDER_ORDER_GHOST = 500
/** The otoliths of RN-04: drawn after every capsule that covers them, so they always read. */
export const RENDER_ORDER_ON_TOP = 900
export const RENDER_ORDER_SKIN = 1000
/**
 * A melanophore sits in the skin, not under it, so the pigment class draws after the skin
 * (D10 near black). Under the skin the AR-32 veil, alpha 0.24 with the dark-theme lift, added
 * about 47 of 255 to every pigment pixel: the adult flank bands measured a mean RGB of 95 to
 * 104 against a flank of 201, and 48 to 60 with the skin hidden.
 */
export const RENDER_ORDER_PIGMENT = 1050
/** The chorion encloses the skin to 30 hpf, so its glass draws after the skin (D10). */
export const RENDER_ORDER_CHORION = 1100
/** A mesh enables the raycast layer at this opacity or above (AR-34). */
export const PICK_MIN_OPACITY = 0.3
export const RAYCAST_LAYER = 1

/**
 * Skin rim (AR-32 as revised in phase 2). The fresnel term `(1 - cos)^power` raises the skin's
 * alpha toward 1 at grazing angles by SKIN_RIM_ALPHA, so the outline reads at the x-ray default
 * (opacity 0.24) on both themes. In the dark theme the rim also emits the skin colour
 * (SKIN_RIM_EMISSIVE) and the whole surface is lifted by SKIN_LIFT (the blend multiplies the
 * emission by the 0.24 alpha, so the lift is 0.45 of the colour for a visible mid grey), so
 * the light S07 grey stays light over the dark background; the light theme keeps the darker
 * S07 value and gets its outline from the alpha alone. Both fade with the skin opacity below
 * 0.12 (x-ray 80+). The reporter preview keeps the rim at 0.3 of the dark value and drops the
 * lift, so the silhouette still reads over the preview ground without lighting the flank.
 */
export const SKIN_RIM_POWER = 2.5
export const SKIN_RIM_ALPHA = 0.85
export const SKIN_RIM_EMISSIVE: Record<ThemeVariant, number> = { dark: 0.7, light: 0, fluorescence: 0.21 }
export const SKIN_LIFT: Record<ThemeVariant, number> = { dark: 0.45, light: 0, fluorescence: 0 }
/** Skin opacity below which the rim and the lift fade out, so x-ray 100 leaves nothing. */
export const SKIN_RIM_FADE_OPACITY = 0.12

interface SkinUniforms { rimEmissive: { value: number }; lift: { value: number } }

const SKIN_RIM_GLSL = `
{
  float atlasCos = abs(dot(normalize(vViewPosition), normal));
  float atlasRim = pow(1.0 - atlasCos, ${SKIN_RIM_POWER.toFixed(2)});
  float atlasGain = min(1.0, diffuseColor.a / ${SKIN_RIM_FADE_OPACITY.toFixed(3)});
  outgoingLight += diffuse * (atlasLift + atlasRimEmissive * atlasRim) * atlasGain;
  diffuseColor.a = clamp(diffuseColor.a + (1.0 - diffuseColor.a) * atlasRim * ${SKIN_RIM_ALPHA.toFixed(2)} * atlasGain, 0.0, 1.0);
}
#include <opaque_fragment>`

function skinShader(uniforms: SkinUniforms): (shader: WebGLProgramParametersWithUniforms) => void {
  return (shader) => {
    shader.uniforms.atlasRimEmissive = uniforms.rimEmissive
    shader.uniforms.atlasLift = uniforms.lift
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float atlasRimEmissive;\nuniform float atlasLift;')
      .replace('#include <opaque_fragment>', SKIN_RIM_GLSL)
  }
}

/** Writes the theme's rim values into a skin material; a no-op for every other material. */
export function applySkinTheme(material: MeshStandardMaterial, variant: ThemeVariant): void {
  const u = material.userData.atlasSkin as SkinUniforms | undefined
  if (!u) return
  u.rimEmissive.value = SKIN_RIM_EMISSIVE[variant]
  u.lift.value = SKIN_LIFT[variant]
}

/** The store fields the visual pass reads, snapshotted once per pass. */
export interface VisualInput {
  fluorescence?: FluorescenceConfig
  signals?: FluorescenceSignals
  t: number
  sex: Sex
  theme: Theme
  palette: PaletteMode
  xray: number
  isolate: boolean
  presentation: boolean
  selection: readonly string[]
  hover: string | null
  hiddenSystems: readonly string[]
  hiddenStructures: readonly string[]
  /** `--text-muted` of the active theme, the ghost colour of AR-33. */
  textMutedHex: string
}

/**
 * Depth classes of RN-03 and RN-04. A structure belongs to one class, and the class fixes its
 * opacity at three x-ray anchors: 0 (solid), the default 60, and 100 (the deep view). The values
 * are the same in both themes.
 *
 * - `core`: the notochord, the heart, the vessels, the eye, the lens and the otoliths stay opaque
 *   at every x-ray value, so they read through the tissue that covers them.
 * - `organ`: the brain and the gut sit at about 0.7 by default, so the rhombomeres read
 *   through the hindbrain.
 * - `capsule`: the otic vesicle and the inner ear, at about 0.5. Each is a shell with two
 *   surfaces and the two capsules are nested from 19 to 72 hpf, so four surfaces cover the
 *   otoliths; at 0.7 they left the otoliths a twelfth of the pixel (RN-04).
 * - `tissue`: the rayed fins after flexion, at about 0.6, so a ray reads as a surface and the
 *   swim bladder, the kidney and the gut read through the flank.
 * - `pigment`: the melanophores and their stripes, at about 0.92. A melanophore is an opaque
 *   cell in life, and at the 0.6 of `tissue` the pale myotomes behind the adult flank bands
 *   lifted them to about L* 45, three times the L* 15 of the D10 near black, so the bands read
 *   as grey and not as pigment. The class still opens to 0.45 at x-ray 100, so the deep view
 *   keeps the flank organs.
 * - `wall`: the somites and the myotomes sit at about 0.5 by default, so the notochord and the
 *   vertebral column read through the trunk without touching the slider.
 * - `veil`: the median fin fold and the embryonic mesoderm sheets, at about 0.35. Each is one
 *   or two cell layers in life.
 * - `film`: the scales, at about 0.25, so the flank reads as a texture and not as a row of tiles.
 * - `skin`: 0.6 down to 0, the AR-32 ramp; the fresnel rim keeps the outline.
 */
export type OpacityClass = 'core' | 'organ' | 'capsule' | 'tissue' | 'pigment' | 'wall' | 'veil' | 'film' | 'skin'

/** Opacity at x-ray 0, 60 and 100 per class. */
export const OPACITY_ANCHORS: Record<OpacityClass, readonly [number, number, number]> = {
  core: [1, 1, 1],
  organ: [1, 0.7, 0.4],
  capsule: [1, 0.5, 0.25],
  tissue: [1, 0.6, 0.3],
  pigment: [1, 0.92, 0.45],
  wall: [1, 0.5, 0.12],
  veil: [1, 0.35, 0.08],
  film: [1, 0.25, 0.05],
  skin: [0.6, 0.24, 0],
}

/** The x-ray value the anchors above describe as the default view (state DEFAULT_XRAY). */
export const XRAY_DEFAULT = 60

/** Class per D5 system; a record in STRUCTURE_OPACITY_CLASS overrides it. */
export const SYSTEM_OPACITY_CLASS: Record<SystemId, OpacityClass> = {
  early_embryo: 'core',
  axial: 'core',
  nervous: 'organ',
  sensory: 'organ',
  cardiovascular: 'core',
  hematopoietic_immune: 'core',
  respiratory: 'organ',
  digestive: 'organ',
  excretory: 'organ',
  endocrine: 'core',
  reproductive: 'organ',
  skeletal: 'organ',
  muscular: 'wall',
  fins: 'wall',
  integument_pigment: 'wall',
}

/**
 * Records whose class differs from their system's. The somite and the segmental plate are the
 * translucent trunk wall of RN-01; the horizontal myoseptum is the line that must read through it;
 * the melanophores keep both their D10 colour and their cover, because a stripe that the flank
 * shows through reads as grey and not as pigment (see the `pigment` class above); the embryonic
 * mesoderm sheets are veils over the trunk and the head; the eye, its parts and the otoliths are
 * the opaque sensory items of RN-04, which the rest of the sensory system is not.
 */
export const STRUCTURE_OPACITY_CLASS: Record<string, OpacityClass> = {
  'ZFA:0000155': 'wall',   // somite
  'ZFA:0000279': 'wall',   // segmental plate
  'ZFA:0000671': 'core',   // horizontal myoseptum
  'ZFA:0000121': 'veil',   // lateral plate mesoderm
  'ZFA:0001206': 'veil',   // intermediate mesoderm
  'ZFA:0000113': 'veil',   // head mesenchyme
  'ZFA:0009091': 'pigment', // melanocyte and the flank stripe 1V
  'ZFA:0009198': 'core',   // xanthophore
  'ZFA:0009199': 'core',   // iridophore
  'ZFA:0001463': 'pigment', // melanophore stripe 1D
  'ZFA:0005221': 'pigment', // larval stripes
  'ZFA:0005222': 'pigment',
  'ZFA:0005223': 'pigment',
  'ZFA:0005224': 'pigment',
  'ZFA:0000277': 'film',   // scale
  'ZFA:0000107': 'core',   // eye
  'ZFA:0000152': 'core',   // retina
  'ZFA:0000144': 'core',   // retinal pigmented epithelium
  'ZFA:0000035': 'core',   // lens; its D10 role opacity 0.35 still applies over the class
  'ZFA:0001617': 'core',   // otolith
  'ZFA:0000051': 'capsule', // otic vesicle
  'ZFA:0000217': 'capsule', // inner ear
  'ZFA:0000243': 'core',   // neuromast
  'ZFA:0000040': 'veil',   // median fin fold
  'ZFA:0001161': 'tissue', // pectoral fin
  'ZFA:0001184': 'tissue', // pelvic fin
  'ZFA:0001173': 'tissue', // dorsal fin
  'ZFA:0001162': 'tissue', // anal fin
  'ZFA:0001058': 'tissue', // caudal fin
}

/**
 * Records that must read through everything that covers them (RN-04). An opaque mesh draws in
 * three's opaque pass, before any translucent capsule, so a nested shell blends over it however
 * high its render order; these draw in the translucent pass at RENDER_ORDER_ON_TOP with the depth
 * test off and full alpha instead. Keep the set small: a member also shows through the far side
 * of the head.
 */
export const ALWAYS_ON_TOP_IDS: ReadonlySet<string> = new Set(['ZFA:0001617'])

/**
 * Melanophores. D10 puts them near black; the default finish lifted the flank stripes to three
 * times their base colour, well above the retinal pigment epithelium in the same frame, so the
 * pigment records take a matte finish with almost no environment term.
 */
export const MATTE_PIGMENT_IDS: ReadonlySet<string> = new Set([
  'ZFA:0009091', 'ZFA:0001463', 'ZFA:0005221', 'ZFA:0005222', 'ZFA:0005223', 'ZFA:0005224',
])
export const PIGMENT_ROUGHNESS = 0.95
export const PIGMENT_ENV_INTENSITY = 0.02

const classCache = new WeakMap<StructureRecord, OpacityClass>()

/** The opacity class of one record (RN-04). The skin takes its own ramp. */
export function opacityClassOf(record: StructureRecord): OpacityClass {
  const cached = classCache.get(record)
  if (cached !== undefined) return cached
  const cls = isSkinRecord(record)
    ? 'skin'
    : STRUCTURE_OPACITY_CLASS[record.id] ?? SYSTEM_OPACITY_CLASS[record.system] ?? 'core'
  classCache.set(record, cls)
  return cls
}

/** Opacity of a class at an x-ray value: linear between the three anchors of OPACITY_ANCHORS. */
export function classOpacity(cls: OpacityClass, xray: number): number {
  const [a0, a60, a100] = OPACITY_ANCHORS[cls]
  const x = Math.min(Math.max(xray, 0), 100)
  if (x <= XRAY_DEFAULT) return a0 + (a60 - a0) * (x / XRAY_DEFAULT)
  return a60 + (a100 - a60) * ((x - XRAY_DEFAULT) / (100 - XRAY_DEFAULT))
}

/** Skin opacity from the x-ray value: 0.60 at 0, 0.24 at the default 60, 0 at 100 (AR-32). */
export function skinOpacity(xray: number): number {
  return classOpacity('skin', xray)
}

const depthCache = new WeakMap<StructureRecord, number>()

/**
 * Lateral depth of a record: the largest |w| its geometry places at, 0 on the midline. The visual
 * pass draws the translucent structures from the spine outward with it (RN-03), so the notochord
 * and the neural tube paint before the somites that cover them. A `derived` record carries no
 * placement of its own, so it takes the depth of the source it slices (the lens of the eye).
 */
export function lateralDepth(record: StructureRecord, byId?: ReadonlyMap<string, StructureRecord>): number {
  const cached = depthCache.get(record)
  if (cached !== undefined) return cached
  const source = byId ? derivedSourceOf(record, byId)?.source : null
  const depth = Math.min(1, maxAbsW((source ?? record).geometry))
  if (source || record.geometry?.kind !== 'derived') depthCache.set(record, depth)
  return depth
}

/** Largest |w| in a geometry spec, over the static block and every keyframe. */
function maxAbsW(value: unknown): number {
  if (Array.isArray(value)) {
    let out = 0
    for (const item of value) out = Math.max(out, maxAbsW(item))
    return out
  }
  if (typeof value !== 'object' || value === null) return 0
  let out = 0
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'w' && typeof item === 'number') out = Math.max(out, Math.abs(item))
    else out = Math.max(out, maxAbsW(item))
  }
  return out
}

/** Tree depth below the system row: 0 for a child of the root, +1 per uiParent hop (AR-28). */
export function treeDepth(record: StructureRecord, byId: Map<string, StructureRecord>): number {
  let depth = 0
  let parent = record.uiParent
  const seen = new Set<string>([record.id])
  while (parent && !seen.has(parent)) {
    const p = byId.get(parent)
    if (!p || p.uiParent === null) break
    seen.add(parent)
    depth++
    parent = p.uiParent
  }
  return depth
}

/** Base colour and role opacity of a record for a theme and palette (D10, AR-28, UX-VS-06). */
export function colourOf(record: StructureRecord, data: AtlasData, theme: Theme, palette: PaletteMode = 'atlas'): { hex: string; opacity: number | null } {
  const system = data.systemsById.get(record.system)
  const systemHex = system ? systemPair(system, palette) : { dark: '#9AA3AD', light: '#5B6470' }
  return structureColour({
    system: systemHex,
    depth: treeDepth(record, data.structuresById),
    theme,
    override: record.colorOverride ? { dark: record.colorOverride.dark, light: record.colorOverride.light } : null,
    zfaId: record.id,
  })
}

/** The body-driven chorion shell (DM-31). */
export function isChorionRecord(record: StructureRecord): boolean {
  const g = record.geometry
  return g !== null && g.kind === 'bodyDriven' && g.part === 'chorion'
}

function isSheet(record: StructureRecord): boolean {
  const g = record.geometry
  if (!g) return false
  if (g.kind === 'sheet') return true
  if (g.kind === 'segmentArray') return g.template?.kind === 'sheet'
  return g.kind === 'custom' && g.builder === 'finSheet'
}

/** Darkens back faces by about 20 L* so a cut or the inside of a sheet reads as a surface (AR-44). */
function darkenBackFaces(shader: WebGLProgramParametersWithUniforms): void {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <opaque_fragment>',
    'if (!gl_FrontFacing) outgoingLight *= 0.5;\n#include <opaque_fragment>',
  )
}

/** The material of one structure (AR-26, AR-27): side fixed at creation, the section plane attached (AR-43). */
export function createStructureMaterial(record: StructureRecord, hex: string, plane: Plane): MeshStandardMaterial {
  const matte = MATTE_PIGMENT_IDS.has(record.id)
  const surface = opacityClassOf(record)
  const softTissue = surface === 'wall' || surface === 'veil' || surface === 'tissue'
  const material = new MeshStandardMaterial({
    color: new Color(hex),
    roughness: matte ? PIGMENT_ROUGHNESS : softTissue ? SOFT_TISSUE_ROUGHNESS : ROUGHNESS,
    metalness: matte ? 0 : METALNESS,
    flatShading: false,
    side: isSheet(record) ? DoubleSide : FrontSide,
    envMapIntensity: matte ? PIGMENT_ENV_INTENSITY : softTissue ? SOFT_TISSUE_ENV_INTENSITY : 0.3,
  })
  material.clippingPlanes = [plane]
  if (record.geometry?.kind === 'derived') {
    // A part lies on its source's surface while both draw (the handoff window, the yolk ball inside
    // the yolk): the offset lets the part win the depth test instead of z-fighting.
    material.polygonOffset = true
    material.polygonOffsetFactor = -1
    material.polygonOffsetUnits = -1
  }
  if (isSkinRecord(record)) {
    const uniforms: SkinUniforms = { rimEmissive: { value: SKIN_RIM_EMISSIVE.dark }, lift: { value: SKIN_LIFT.dark } }
    material.userData.atlasSkin = uniforms
    material.onBeforeCompile = skinShader(uniforms)
    material.customProgramCacheKey = () => 'atlas-skin'
    return material
  }
  material.onBeforeCompile = darkenBackFaces
  material.customProgramCacheKey = () => 'atlas-backface'
  return material
}

export interface VisualTarget {
  opacity: number
  /** The opacity the pick test of AR-34 reads; the preview dim never lowers it. */
  pickOpacity: number
  ghost: boolean
  hidden: boolean
  hovered: boolean
  presence: Presence
}

/** The isolate ghost rule of AR-33: with isolate on and a selection, every other structure ghosts. */
export function isGhosted(id: string, state: { isolate: boolean; selection: readonly string[] }): boolean {
  return state.isolate && state.selection.length > 0 && !state.selection.includes(id)
}

/** The opacity of one structure from the store state and its presence (AR-30 to AR-33). */
export function resolveVisual(handle: StructureHandle, input: VisualInput, presence: Presence): VisualTarget {
  const { record } = handle
  const hidden = input.hiddenStructures.includes(record.id) || input.hiddenSystems.includes(record.system)
  const ghost = isGhosted(record.id, input)
  const clamp = (value: number): number => handle.roleOpacity === null ? value : Math.min(value, handle.roleOpacity)
  const classBase = classOpacity(handle.isSkin ? 'skin' : opacityClassOf(record), input.xray)
  // The opacity outside the preview. The pick test keeps reading it, so a click still lands on
  // the brain or a somite while the preview dims them (review item 1).
  const solid = clamp(classBase)
  let base = solid
  if (input.fluorescence?.enabled) {
    // The signal never reaches the skin: an emissive whole-organism shell hides every interior
    // structure and takes the x-ray slider out of the reader's hands (review item 5).
    const signal = handle.isSkin ? undefined : input.signals?.get(record.id)
    const context = input.fluorescence.context / 100
    // The role opacity of D10 clamps the result, so the lens and the chorion stay glass.
    base = clamp(signal?.length
      ? SIGNAL_OPACITY
      : handle.isSkin ? classBase * context * PREVIEW_SKIN_FACTOR : Math.min(classBase, PREVIEW_CONTEXT_CAP) * context)
  }
  if (ghost) base = input.presentation ? GHOST_OPACITY_PRESENTATION : GHOST_OPACITY
  const drawn = !hidden && presence.present
  const opacity = drawn ? base * presence.opacity : 0
  const pickOpacity = drawn && !ghost ? Math.max(opacity, solid * presence.opacity) : opacity
  return { opacity, pickOpacity, ghost, hidden, hovered: input.hover === record.id, presence }
}

let appliedColours: string | null = null

/** Recomputes the base colour of every handle after a theme or palette change. */
function refreshColours(rt: ViewerRuntime, theme: Theme, palette: PaletteMode): void {
  const key = `${theme}|${palette}`
  if (appliedColours === key || !rt.data) return
  appliedColours = key
  for (const handle of rt.handles.values()) {
    const c = colourOf(handle.record, rt.data, theme, palette)
    handle.hex = c.hex
    handle.roleOpacity = c.opacity
  }
}

/**
 * The reporter preview of D18. A signalled structure holds SIGNAL_OPACITY and emits its channel
 * colour at SIGNAL_EMISSIVE over the near-black PREVIEW_BASE_HEX; the unlabelled anatomy keeps at
 * most PREVIEW_CONTEXT_CAP of its class opacity, times the context slider, in PREVIEW_DIM_HEX;
 * the skin holds its x-ray opacity times the slider and PREVIEW_SKIN_FACTOR, so the reader still
 * controls the body outline. PREVIEW_HOVER_HEX is the hover emission, which reads over the ground
 * without passing for a reporter colour.
 */
export const SIGNAL_OPACITY = 0.88
export const SIGNAL_EMISSIVE = 1.15
export const PREVIEW_CONTEXT_CAP = 0.25
export const PREVIEW_SKIN_FACTOR = 0.65
export const PREVIEW_BASE_HEX = '#101820'
export const PREVIEW_DIM_HEX = '#738399'
export const PREVIEW_HOVER_HEX = '#A9BCD0'

const reporterColors = new Map<string, string>()
/** Mix in linear light; channel order and duplicated rules cannot alter the composite. */
export function fluorescenceColor(channels: readonly ReporterId[]): string {
  const unique = [...new Set(channels)].sort()
  const key = unique.join('|')
  const cached = reporterColors.get(key)
  if (cached) return cached
  const color = new Color(0, 0, 0)
  for (const id of unique) color.add(new Color(REPORTERS[id].hex))
  color.multiplyScalar(1 / Math.max(1, color.r, color.g, color.b))
  const hex = `#${color.getHexString()}`
  reporterColors.set(key, hex)
  return hex
}

function applyToHandle(handle: StructureHandle, target: VisualTarget, renderOrder: number, input: VisualInput): void {
  const { material, group } = handle
  const onTop = renderOrder === RENDER_ORDER_ON_TOP
  const opaque = target.opacity >= 0.999 && !target.ghost && !onTop
  if (material.transparent === opaque) {
    // `transparent` sets the OPAQUE shader define, so a flip needs a program refresh (AR-31);
    // the warm-up of AR-75 makes that refresh a cache hit.
    material.transparent = !opaque
    material.needsUpdate = true
  }
  // RN-03: an opaque structure writes depth and hides what is behind it; a translucent one keeps
  // the depth test but not the write, so the structures under it blend through in render order.
  material.depthWrite = opaque
  material.depthTest = !onTop
  material.opacity = target.opacity
  // Colour.set parses a hex string; the pass runs every frame during playback, so write on change only.
  const preview = input.fluorescence?.enabled === true
  const channels = handle.isSkin ? undefined : input.signals?.get(handle.id)
  const signalHex = preview && channels?.length && !target.ghost ? fluorescenceColor(channels) : null
  const hex = target.ghost ? input.textMutedHex : preview ? (signalHex ? PREVIEW_BASE_HEX : PREVIEW_DIM_HEX) : handle.hex
  if (hex !== handle.appliedHex) {
    material.color.set(hex)
    handle.appliedHex = hex
  }
  const emissiveHex = signalHex ?? (target.hovered && !target.ghost ? (preview ? PREVIEW_HOVER_HEX : handle.hex) : '#000000')
  if (emissiveHex !== handle.appliedEmissiveHex) {
    material.emissive.set(emissiveHex)
    handle.appliedEmissiveHex = emissiveHex
  }
  material.emissiveIntensity = signalHex ? SIGNAL_EMISSIVE : HOVER_EMISSIVE
  if (handle.isSkin) applySkinTheme(material, preview ? 'fluorescence' : input.theme)
  const visible = target.opacity > 0 && !handle.failed && handle.bounds !== null
  group.visible = visible
  const pickable = visible && handle.record.pickable && target.pickOpacity >= PICK_MIN_OPACITY && !target.ghost
  for (const mesh of handle.meshes) {
    mesh.renderOrder = renderOrder
    if (pickable) mesh.layers.enable(RAYCAST_LAYER)
    else mesh.layers.disable(RAYCAST_LAYER)
  }
  // D3: the fade scales the structure about its own centre.
  const s = target.presence.scale
  const c = handle.center
  group.scale.setScalar(s)
  group.position.set(c.x * (1 - s), c.y * (1 - s), c.z * (1 - s))
  handle.opacity = target.opacity
  handle.presence = target.presence
}

/**
 * One pass over every handle: presence at t, opacity, colour, transparency,
 * render order, raycast layer, and the fade scale.
 *
 * Render order (RN-03). An opaque structure keeps order 0 and writes depth, so three draws it in
 * the opaque pass before anything translucent and the depth test hides whatever sits behind it.
 * The translucent structures follow, sorted from the spine outward (`lateralDepth`, then the
 * bounding radius), so the notochord and the neural tube paint before the somites that cover
 * them. Ghosts take 500, the always-on-top records 900, the skin 1000, the pigment class 1050
 * (a melanophore lies in the skin, not under it) and the chorion 1100.
 */
export function applyVisualPass(rt: ViewerRuntime, input: VisualInput): void {
  if (rt.data && input.fluorescence?.enabled) input = { ...input, signals: resolveFluorescence(rt.data, input.fluorescence, input.t, input.sex) }
  refreshColours(rt, input.theme, input.palette)
  const byId = rt.data?.structuresById
  const targets: { handle: StructureHandle; target: VisualTarget }[] = []
  for (const handle of rt.handles.values()) {
    const record = handle.record
    const presence = presenceAt(record, input.t, { sex: input.sex })
    const withMesh = hasMeshAt(record, input.t, { sex: input.sex })
    const effective: Presence = withMesh ? presence : { ...presence, present: false, opacity: 0 }
    targets.push({ handle, target: resolveVisual(handle, input, effective) })
  }
  const transparent = targets
    .filter(({ handle, target }) => target.opacity > 0 && target.opacity < 0.999 && !target.ghost && !handle.isSkin)
    .sort((a, b) => {
      const d = lateralDepth(a.handle.record, byId) - lateralDepth(b.handle.record, byId)
      return d !== 0 ? d : a.handle.radius - b.handle.radius
    })
  const rank = new Map<string, number>()
  transparent.forEach(({ handle }, i) => rank.set(handle.id, RENDER_ORDER_TRANSLUCENT + i))
  for (const { handle, target } of targets) {
    let order = rank.get(handle.id) ?? 0
    if (isChorionRecord(handle.record)) order = RENDER_ORDER_CHORION
    else if (handle.isSkin) order = RENDER_ORDER_SKIN
    else if (target.ghost) order = RENDER_ORDER_GHOST
    else if (ALWAYS_ON_TOP_IDS.has(handle.id) && target.opacity > 0) order = RENDER_ORDER_ON_TOP
    else if (target.opacity > 0 && opacityClassOf(handle.record) === 'pigment') order = RENDER_ORDER_PIGMENT
    applyToHandle(handle, target, order, input)
  }
  if (rt.canvas) rt.canvas.style.cursor = input.hover && rt.handles.get(input.hover)?.opacity ? 'pointer' : ''
}
