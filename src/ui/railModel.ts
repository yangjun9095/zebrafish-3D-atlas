// Pure helpers of the systems rail: counts per system (UX-IN-26), swatch colour and the outline rule (UI-31).
import { BACKGROUND_HEX, contrastRatio, systemHex } from '../core/palette.ts'
import type { PaletteMode } from '../core/palette.ts'
import type { AtlasData, SystemRecord } from '../core/schema.ts'

export interface SystemCounts {
  present: number
  total: number
}

export interface RailCounts {
  bySystem: Map<string, SystemCounts>
  all: SystemCounts
}

/** "present / total" per system: structures with geometry, present when their fade opacity is above 0 (UX-IN-26). */
export function systemCounts(data: AtlasData | null, presentIds: readonly string[]): RailCounts {
  const bySystem = new Map<string, SystemCounts>()
  const all: SystemCounts = { present: 0, total: 0 }
  if (!data) return { bySystem, all }
  for (const s of data.systems) bySystem.set(s.id, { present: 0, total: 0 })
  const present = new Set(presentIds)
  for (const r of data.structures) {
    if (r.geometry === null) continue
    const c = bySystem.get(r.system)
    if (!c) continue
    c.total += 1
    all.total += 1
    if (present.has(r.id)) {
      c.present += 1
      all.present += 1
    }
  }
  return { bySystem, all }
}

export function countLabel(counts: SystemCounts): string {
  return `${counts.present} / ${counts.total}`
}

export function systemSwatch(system: SystemRecord, theme: 'dark' | 'light', palette: PaletteMode = 'atlas'): string {
  return systemHex(system, theme, palette)
}

/** Slots whose swatch contrast against --bg is under 3:1 get a 1 px outline (UI-31): S06 in the light theme. */
const OUTLINED_SLOTS: Record<'dark' | 'light', readonly string[]> = { dark: [], light: ['S06'] }

/** UI-31: the atlas rule by slot; an Okabe-Ito swatch is measured against the theme background. */
export function swatchNeedsOutline(system: SystemRecord, theme: 'dark' | 'light', palette: PaletteMode = 'atlas'): boolean {
  if (palette === 'atlas') return OUTLINED_SLOTS[theme].includes(system.paletteSlot)
  return contrastRatio(systemHex(system, theme, palette), BACKGROUND_HEX[theme]) < 3
}
