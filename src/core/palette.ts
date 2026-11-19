// Colour policy (D10, AR-28, UX-VS-07): the system hue per theme comes from
// systems.json (DM-08) and is passed in; this module steps lightness by tree
// depth inside the theme window and holds the D10 exception list.

export type Theme = 'dark' | 'light'
export interface ThemeHex { dark: string; light: string }

/** L* window per theme (research 07 section 4.2). */
export const LIGHTNESS_WINDOW: Record<Theme, [number, number]> = { dark: [52, 94], light: [39, 60] }
export const LIGHTNESS_STEP = 6

/** Selection outline colour (`--focus`, research 07 section 4.1). Never a fill change (D10). */
export const FOCUS_HEX: ThemeHex = { dark: '#FFD166', light: '#B45309' }

/** The two system palettes of UI-27: the 15 atlas hues, or the 8 Okabe-Ito hues of UX-VS-06. */
export type PaletteMode = 'atlas' | 'okabeIto'

/** Research 07 UX-VS-06: the 15 systems on the 8 Okabe-Ito colours (G1 to G8), the same hex in both themes. */
export const OKABE_ITO_BY_SYSTEM: Record<string, string> = {
  nervous: '#0072B2', sensory: '#0072B2',
  cardiovascular: '#D55E00', hematopoietic_immune: '#D55E00',
  muscular: '#E69F00',
  skeletal: '#F0E442', fins: '#F0E442',
  digestive: '#009E73', respiratory: '#009E73', excretory: '#009E73',
  reproductive: '#CC79A7', endocrine: '#CC79A7',
  integument_pigment: '#56B4E9',
  early_embryo: '#999999', axial: '#999999',
}

/** The hue pair of a system under a palette: systems.json, or the Okabe-Ito slot in both themes. */
export function systemPair(system: { id: string; color: ThemeHex }, palette: PaletteMode = 'atlas'): ThemeHex {
  const okabe = palette === 'okabeIto' ? OKABE_ITO_BY_SYSTEM[system.id] : undefined
  return okabe ? { dark: okabe, light: okabe } : system.color
}

/** The system hue for a theme under a palette. */
export function systemHex(system: { id: string; color: ThemeHex }, theme: Theme, palette: PaletteMode = 'atlas'): string {
  return systemPair(system, palette)[theme]
}

/** Page background per theme (styles.css `--bg`), for the swatch contrast rule of UI-31. */
export const BACKGROUND_HEX: ThemeHex = { dark: '#0E1116', light: '#F5F6F7' }

/** WCAG 2 contrast ratio of two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string): number => {
    const [r, g, bb] = hexToRgb(hex).map((v) => toLinear(v / 255)) as [number, number, number]
    return 0.2126 * r + 0.7152 * g + 0.0722 * bb
  }
  const la = lum(a), lb = lum(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export type ColourRole =
  | 'artery' | 'vein' | 'otolith' | 'nearBlack' | 'xanthophore' | 'iridophore'
  | 'cartilage' | 'bone' | 'yolk' | 'lens' | 'chorion'

export interface ColourOverride extends ThemeHex { role: ColourRole; opacity?: number }

/** D10 roles with the hex pairs of spec section 3.6. */
export const COLOUR_ROLES: Record<ColourRole, ColourOverride> = {
  artery: { role: 'artery', dark: '#E31A1C', light: '#A50F15' },
  vein: { role: 'vein', dark: '#1F78B4', light: '#08519C' },
  otolith: { role: 'otolith', dark: '#F5F5F5', light: '#C8CCD0' },
  nearBlack: { role: 'nearBlack', dark: '#23262B', light: '#1B1F24' },
  xanthophore: { role: 'xanthophore', dark: '#FFB000', light: '#C97D00' },
  iridophore: { role: 'iridophore', dark: '#C9D6DF', light: '#7D8A94' },
  cartilage: { role: 'cartilage', dark: '#8FC1E3', light: '#2F6F9F' },
  bone: { role: 'bone', dark: '#E9DFC4', light: '#8C7F5E' },
  yolk: { role: 'yolk', dark: '#F2C94C', light: '#A6861B' },
  lens: { role: 'lens', dark: '#CFEEFF', light: '#8FB4CC', opacity: 0.35 },
  chorion: { role: 'chorion', dark: '#C8D0D8', light: '#7A8790', opacity: 0.1 },
}

/** ZFA ids of the records that carry each role (spec section 3.6). */
export const COLOUR_EXCEPTIONS: Record<string, ColourRole> = {
  'ZFA:0000014': 'artery', 'ZFA:0000011': 'artery', 'ZFA:0005004': 'artery', 'ZFA:0000604': 'artery', 'ZFA:0005002': 'artery', 'ZFA:0001053': 'artery',
  'ZFA:0000477': 'vein', 'ZFA:0000423': 'vein', 'ZFA:0000186': 'vein', 'ZFA:0000180': 'vein', 'ZFA:0001286': 'vein', 'ZFA:0001052': 'vein', 'ZFA:0005934': 'vein',
  'ZFA:0001617': 'otolith',
  'ZFA:0000144': 'nearBlack', 'ZFA:0009091': 'nearBlack', 'ZFA:0005221': 'nearBlack', 'ZFA:0005222': 'nearBlack', 'ZFA:0005223': 'nearBlack', 'ZFA:0005224': 'nearBlack', 'ZFA:0001463': 'nearBlack',
  'ZFA:0009198': 'xanthophore',
  'ZFA:0009199': 'iridophore',
  'ZFA:0001580': 'cartilage', 'ZFA:0001205': 'cartilage', 'ZFA:0001399': 'cartilage', 'ZFA:0001400': 'cartilage', 'ZFA:0001422': 'cartilage', 'ZFA:0000095': 'cartilage', 'ZFA:0000364': 'cartilage',
  'ZFA:0000694': 'bone', 'ZFA:0000191': 'bone', 'ZFA:0000270': 'bone', 'ZFA:0000250': 'bone', 'ZFA:0000184': 'bone', 'ZFA:0001189': 'bone', 'ZFA:0000538': 'bone', 'ZFA:0001188': 'bone', 'ZFA:0001554': 'bone',
  'ZFA:0000084': 'yolk', 'ZFA:0000006': 'yolk', 'ZFA:0000106': 'yolk', 'ZFA:0000088': 'yolk',
  'ZFA:0000035': 'lens',
  'ZFA:0000329': 'chorion',
}

export function overrideFor(zfaId: string): ColourOverride | null {
  const role = COLOUR_EXCEPTIONS[zfaId]
  return role ? COLOUR_ROLES[role] : null
}

// sRGB <-> CIELAB ------------------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (!Number.isFinite(n) || full.length !== 6) throw new Error(`bad hex colour: ${hex}`)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(rgb: [number, number, number]): string {
  const c = (v: number): string => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0').toUpperCase()
  return `#${c(rgb[0])}${c(rgb[1])}${c(rgb[2])}`
}

const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const toSrgb = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)
const WHITE = [0.95047, 1.0, 1.08883] as const
const fLab = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29)
const fInv = (t: number): number => (t > 6 / 29 ? t * t * t : (108 / 841) * (t - 4 / 29))

export function rgbToLab(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb.map((v) => toLinear(v / 255)) as [number, number, number]
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / WHITE[0]
  const y = (0.2126729 * r + 0.7151522 * g + 0.072175 * b) / WHITE[1]
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / WHITE[2]
  const fx = fLab(x), fy = fLab(y), fz = fLab(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export function labToRgb(lab: [number, number, number]): [number, number, number] {
  const [L, a, b] = lab
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const x = fInv(fx) * WHITE[0], y = fInv(fy) * WHITE[1], z = fInv(fz) * WHITE[2]
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
  const g = -0.969266 * x + 1.8760108 * y + 0.041556 * z
  const bb = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
  return [toSrgb(r) * 255, toSrgb(g) * 255, toSrgb(bb) * 255].map((v) => Math.min(255, Math.max(0, v))) as [number, number, number]
}

export const lightnessOf = (hex: string): number => rgbToLab(hexToRgb(hex))[0]

/** Signed L* offset for a depth: 0, -6, +6, -12, +12, ... (UX-VS-07). */
export function lightnessOffset(depth: number): number {
  if (depth <= 0) return 0
  const k = Math.ceil(depth / 2)
  return (depth % 2 === 1 ? -1 : 1) * k * LIGHTNESS_STEP
}

/** Set L* of a hex colour, keeping a and b, and clamp to the theme window. */
export function withLightness(hex: string, targetL: number, theme: Theme): string {
  const [, a, b] = rgbToLab(hexToRgb(hex))
  const [lo, hi] = LIGHTNESS_WINDOW[theme]
  const L = Math.min(hi, Math.max(lo, targetL))
  return rgbToHex(labToRgb([L, a, b]))
}

/** Child colour: the system hue stepped by depth inside the theme window (AR-28). Depth 0 is the system base. */
export function stepLightness(baseHex: string, depth: number, theme: Theme): string {
  if (depth <= 0) return baseHex.toUpperCase()
  return withLightness(baseHex, lightnessOf(baseHex) + lightnessOffset(depth), theme)
}

export interface StructureColourInput {
  /** System hex pair from systems.json. */
  system: ThemeHex
  /** Depth below the system row in the tree; 0 for a direct child. */
  depth: number
  theme: Theme
  /** The record's colorOverride, or its ZFA id to look the D10 role up. */
  override?: ThemeHex | null
  zfaId?: string
}

/** Base colour and opacity of a structure (AR-28, D10). */
export function structureColour(input: StructureColourInput): { hex: string; opacity: number | null } {
  const roleOverride = input.zfaId ? overrideFor(input.zfaId) : null
  const override = input.override ?? roleOverride
  if (override) return { hex: override[input.theme].toUpperCase(), opacity: roleOverride?.opacity ?? null }
  return { hex: stepLightness(input.system[input.theme], input.depth, input.theme), opacity: null }
}
