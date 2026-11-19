// URL slice: the store <-> UrlState mapping of AR-19 and AR-45. Parsing and serialising strings
// belong to src/core/urlState.ts; urlSync.ts (WP-I3) calls both.
import type { UrlState, ViewParam } from '../../core/urlState.ts'
import { URL_DEFAULTS, camParam, hideParam, parseCam, parseSec, secParam, selParam } from '../../core/urlState.ts'
import type { UrlKey } from '../../core/urlState.ts'
import type { Get, ProjectorScale, SectionState, Set, SlideKit, StoreDeps, UrlActions, ViewPreset, ZfaId } from './types.ts'
import { SECTION_OFF } from './types.ts'
import { clampTime, refreshDerived } from './time.ts'
import { KitJson, kitWithBookmarks, newKitId, normalizeBookmark } from './mode.ts'
import { emptyFluorescence, FluorescenceConfig, MAX_FLUORESCENCE_TOKEN_CHARS } from '../../core/fluorescence.ts'

const KIT_URL_MAX = 2048

/**
 * The largest decoded kit JSON decodeKit parses (SEC-02). The `kit` parameter is already capped
 * at 2 KB by src/core/urlState.ts, so this only bounds the work a direct caller can ask for.
 */
export const KIT_JSON_MAX_CHARS = 256 * 1024

const PRESET_TO_V: Record<Exclude<ViewPreset, 'free'>, ViewParam> = {
  lateral: 'lat', dorsal: 'dor', ventral: 'ven', anterior: 'ant', posterior: 'pos', threeQuarter: 'tq',
}
const V_TO_PRESET: Record<ViewParam, ViewPreset> = {
  lat: 'lateral', dor: 'dorsal', ven: 'ventral', ant: 'anterior', pos: 'posterior', tq: 'threeQuarter',
}

const flag = (on: boolean): number => (on ? 1 : 0)

export function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeBase64Url(token: string): string | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (token.length % 4)) % 4)
    const bin = atob(b64)
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
  } catch {
    return null
  }
}

const kitTokens = new WeakMap<SlideKit, string>()

/** The kit URL form: base64url JSON, or the kit id when the token exceeds 2 KB (UI-38). Cached per kit object: toUrl runs on every store change. */
export function encodeKit(kit: SlideKit): string {
  let token = kitTokens.get(kit)
  if (token === undefined) {
    const encoded = encodeBase64Url(JSON.stringify(kit))
    token = encoded.length > KIT_URL_MAX ? kit.id : encoded
    kitTokens.set(kit, token)
  }
  return token
}

/** The keys a bookmark also carries. A link with every one of them at its default is a bare `?kit=` link. */
const VIEW_KEYS: readonly UrlKey[] = ['t', 'sel', 'term', 'v', 'cam', 'hide', 'xr', 'x', 'sec', 'iso', 'labels', 'fp']

const fluorescenceTokens = new WeakMap<FluorescenceConfig, string>()
export function encodeFluorescence(config: FluorescenceConfig): string {
  let token = fluorescenceTokens.get(config)
  if (!token) {
    token = encodeBase64Url(JSON.stringify(config))
    fluorescenceTokens.set(config, token)
  }
  return token
}

export function decodeFluorescence(token: string): FluorescenceConfig | null {
  if (token.length > MAX_FLUORESCENCE_TOKEN_CHARS) return null
  try {
    const text = decodeBase64Url(token)
    const result = FluorescenceConfig.safeParse(text ? JSON.parse(text) : null)
    return result.success ? result.data : null
  } catch { return null }
}

/**
 * True when the URL states no view of its own, so the kit's current bookmark supplies it (UI-38).
 * `fp` is one of the view keys: a link that carries a fluorescence preview states a view, so the
 * kit opens on that link's state and not on the bookmark the kit was saved at.
 */
export function isBareKitLink(u: UrlState): boolean {
  return u.kit !== undefined && VIEW_KEYS.every((k) => u[k] === URL_DEFAULTS[k])
}

/**
 * Reads the `kit` parameter: base64url JSON validated with KitJson, else the stored kit under
 * that id. Returns null when neither reads (SEC-02), and applyUrl then warns. Every bookmark
 * passes KitJson before normalizeBookmark sees it, and normalizeBookmark is total, so a crafted
 * link raises a toast instead of throwing before React renders.
 */
export function decodeKit(token: string, readKit?: StoreDeps['readKit']): SlideKit | null {
  // base64 is 4/3 of its input, so a longer token cannot decode under the cap.
  const json = token.length <= KIT_JSON_MAX_CHARS * 2 ? decodeBase64Url(token) : null
  if (json !== null && json.length <= KIT_JSON_MAX_CHARS) {
    try {
      const parsed = KitJson.safeParse(JSON.parse(json))
      if (parsed.success) {
        const { id, name, bookmarks, index } = parsed.data
        return kitWithBookmarks({ id: id ?? newKitId(), name, bookmarks: [], index: 0 }, bookmarks.map(normalizeBookmark), index ?? 0)
      }
    } catch {
      // Not JSON: fall through to the stored-kit lookup.
    }
  }
  return readKit?.(token) ?? null
}

function sectionFromParam(sec: string | undefined): SectionState {
  const parsed = parseSec(sec)
  if (!parsed || !Number.isFinite(parsed.position)) return SECTION_OFF
  return { axis: parsed.axis, position: Math.min(Math.max(parsed.position, -1), 1), flip: parsed.flip }
}

export function createUrlSlice(set: Set, get: Get, deps: StoreDeps): UrlActions {
  return {
    toUrl(opts = {}) {
      const s = get()
      const includeCamera = opts.includeCamera ?? true
      const includeTheme = opts.includeTheme ?? (s.themeSource !== 'system' || s.presentation)
      const out: UrlState = {
        t: Number(s.time.toFixed(2)),
        v: s.viewPreset === 'free' ? 'lat' : PRESET_TO_V[s.viewPreset],
        xr: s.xray,
        x: s.dissect,
        iso: flag(s.isolate),
        u: s.units,
        temp: s.temperatureC,
        sex: s.sex === 'male' ? 'm' : s.sex === 'both' ? 'b' : 'f',
        embed: flag(s.embed),
        present: flag(s.presentation),
        pin: flag(s.stripPinned),
        ps: String(s.projectorScale) as UrlState['ps'],
      }
      const sel = selParam(s.selection)
      if (sel) out.sel = sel
      // D17: the term rides its own key, because a term the atlas does not draw has no record
      // and `sel` holds its stand-in. A reload reads it back in applyUrl below.
      const term = s.selectedTerm ? selParam([s.selectedTerm]) : undefined
      if (term) out.term = term
      if (s.viewPreset === 'free' && s.camera && includeCamera) out.cam = camParam(s.camera)
      const hide = hideParam([...s.hiddenSystems, ...s.hiddenStructures])
      if (hide) out.hide = hide
      if (s.section.axis) out.sec = secParam({ axis: s.section.axis, position: s.section.position, flip: s.section.flip })
      if (includeTheme) out.theme = s.theme
      if (s.snap !== s.presentation) out.snap = flag(s.snap)
      if (s.labels) out.labels = 1
      if (s.kit) out.kit = encodeKit(s.kit)
      if (s.labEnabled) out.lab = 1
      if (s.fluorescence.enabled || s.fluorescence.rules.length > 0) out.fp = encodeFluorescence(s.fluorescence)
      return out
    },

    applyUrl(u) {
      const s = get()
      const data = s.data
      const warnings: string[] = []
      const fluorescence = u.fp ? decodeFluorescence(u.fp) : emptyFluorescence()
      if (!fluorescence) warnings.push('The fluorescence preview in the link could not be read')
      const knownStructure = (id: ZfaId): boolean => !data || data.structuresById.has(id)
      const selection: ZfaId[] = []
      for (const n of u.sel ? u.sel.split(',') : []) {
        const id: ZfaId = `ZFA:${n}`
        if (knownStructure(id)) selection.push(id)
        else warnings.push(`Structure ${id} is not in this atlas`)
      }
      const hiddenSystems: string[] = []
      const hiddenStructures: ZfaId[] = []
      for (const tok of u.hide ? u.hide.split(',') : []) {
        if (/^\d{7}$/.test(tok)) {
          const id: ZfaId = `ZFA:${tok}`
          if (knownStructure(id)) hiddenStructures.push(id)
          else warnings.push(`Structure ${id} is not in this atlas`)
        } else if (!data || data.systems.some((sys) => sys.id === tok)) {
          hiddenSystems.push(tok)
        } else {
          warnings.push(`System "${tok}" is not in this atlas`)
        }
      }
      if (u.x > 0 && u.sec !== undefined) warnings.push('The section plane is off while the dissect slider is above 0')
      const camera = parseCam(u.cam)
      const viewPreset: ViewPreset = camera ? 'free' : V_TO_PRESET[u.v]
      let kit = s.kit
      if (u.kit !== undefined) {
        kit = decodeKit(u.kit, deps.readKit)
        if (!kit) warnings.push('The slide kit in the link could not be read')
      }
      const presentation = u.present === 1
      if (presentation !== s.presentation) s.setPresentation(presentation)
      const after = get()
      set({
        labEnabled: u.lab === 1 || (u.fp !== undefined && fluorescence !== null),
        fluorescence: fluorescence ?? emptyFluorescence(),
        time: clampTime(u.t),
        selection,
        hiddenSystems,
        hiddenStructures,
        railPreset: null,
        soloRestore: null,
        camera,
        viewPreset,
        selectedTerm: u.term ? `ZFA:${u.term}` : null,
        xray: u.xr,
        lastXray: u.xr > 0 ? u.xr : after.lastXray,
        dissect: u.x,
        // The section plane cuts the body, which the dissect slider has moved the structures out
        // of, so the two do not run together (src/state/slices/view.ts).
        section: u.x > 0 ? SECTION_OFF : sectionFromParam(u.sec),
        isolate: u.iso === 1,
        ...(u.theme ? { theme: u.theme, themeSource: 'url' as const } : {}),
        units: u.u,
        snap: u.snap === undefined ? after.snap : u.snap === 1,
        labels: u.labels === undefined ? after.labels : u.labels === 1,
        temperatureC: u.temp,
        sex: u.sex === 'm' ? 'male' : u.sex === 'b' ? 'both' : 'female',
        embed: u.embed === 1,
        stripPinned: u.pin === 1,
        projectorScale: Number(u.ps) as ProjectorScale,
        kit,
        warnings: warnings.length > 0 ? [...after.warnings, ...warnings] : after.warnings,
      })
      // A share link made while a kit is loaded carries the view itself (D1); only a bare kit link opens on the bookmark.
      if (kit && kit !== s.kit && kit.bookmarks.length > 0 && isBareKitLink(u)) get().goToBookmark(kit.index)
      refreshDerived(set, get, deps)
    },
  }
}
