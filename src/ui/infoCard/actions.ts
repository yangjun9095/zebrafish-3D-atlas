// Store-facing actions of the info card: copy id and link, isolate, hide, and the time jump
// with the 200 ms glide (UX-IN-24). Every function reads the store at call time.
import { REDUCED_MOTION_QUERY } from '../hooks/useReducedMotion.ts'
import { showToast, toastText } from '../hooks/useToast.ts'
import { selParam, serializeUrl } from '../../core/urlState.ts'
import { AXIS_ANCHORS, anchorsFromSegments } from '../../core/timeAxis.ts'
import type { AxisAnchor } from '../../core/timeAxis.ts'
import { readAtlas } from '../../state/store.ts'
import type { ZfaId } from '../../state/store.ts'
import { glideTo } from '../timeMotion.ts'

async function copyText(text: string, done: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) throw new Error('no clipboard')
    await navigator.clipboard.writeText(text)
    showToast(done, { kind: 'success' })
    return true
  } catch {
    showToast('Copy failed; the browser blocked the clipboard', { kind: 'error' })
    return false
  }
}

/** Copies "ZFA:0000114" (UX-LY-07: click on the id copies it). */
export function copyId(id: string): Promise<boolean> {
  return copyText(id, toastText.copied)
}

export interface StructureLinkOptions {
  /** ZFA id of a vocabulary term the link opens on (D17); absent means a record link. */
  termId?: string | null
  loc?: Pick<Location, 'origin' | 'pathname'>
}

/** The share URL of the current view with `sel` replaced by `ids` (AR-19, AR-49). */
export function structureLink(ids: readonly string[], opts: StructureLinkOptions = {}): string {
  const loc = opts.loc ?? location
  const url = readAtlas().toUrl()
  const sel = selParam(ids)
  if (sel) url.sel = sel
  else delete url.sel
  const term = opts.termId ? selParam([opts.termId]) : undefined
  if (term) url.term = term
  else delete url.term
  const query = serializeUrl(url)
  return `${loc.origin}${loc.pathname}${query ? `?${query}` : ''}`
}

export function copyStructureLink(ids: readonly string[]): Promise<boolean> {
  return copyText(structureLink(ids), toastText.linkCopied)
}

/** Replaces the selection with `ids` (at most 12, AR-20) and turns isolate on. */
export function isolateIds(ids: readonly ZfaId[]): void {
  const s = readAtlas()
  if (ids.length === 0) return
  s.select(ids[0])
  for (const id of ids.slice(1)) s.select(id, { add: true })
  s.setIsolate(true)
}

export function setHidden(ids: readonly ZfaId[], hidden: boolean): void {
  const s = readAtlas()
  for (const id of ids) s.setStructureHidden(id, hidden)
}

function axisAnchors(): readonly AxisAnchor[] {
  const data = readAtlas().data
  if (!data) return AXIS_ANCHORS
  try {
    return anchorsFromSegments(data.stages.timeAxis.segments)
  } catch {
    return AXIS_ANCHORS
  }
}

function reducedMotion(): boolean {
  if (readAtlas().reducedMotion) return true
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/** Moves t to `hpf` with the thumb glide of UX-TL-16; cuts under reduced motion. */
export function jumpTo(hpf: number): void {
  glideTo(hpf, { anchors: axisAnchors(), reducedMotion: reducedMotion() })
}
