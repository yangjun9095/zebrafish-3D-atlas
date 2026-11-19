// The info card (spec 5.4): the selected structure, a multi-selection list (UI-21), or the stage
// card when nothing is selected (UX-LY-08). Desktop docks it, tablet overlays it, the phone
// shows a peek strip and a bottom sheet, presentation mode floats it. Escape follows the
// UI-41 order inside the card: exit isolate, then clear the selection. The selection is the
// store's `selection`, which the URL `sel` parameter reads and writes (AR-19).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import type { AtlasData, StructureRecord } from '../core/schema.ts'
import { badgeText } from '../core/vocabulary.ts'
import { readAtlas, useAtlas, useAtlasShallow } from '../state/store.ts'
import { reserveEdge } from '../viewer/reserved.ts'
import { useBreakpoint } from './hooks/useBreakpoint.ts'
import { toastText } from './hooks/useToast.ts'
import { announceText } from './infoCard/model.ts'
import { MultiCard } from './infoCard/MultiCard.tsx'
import { PhoneCard } from './infoCard/PhoneCard.tsx'
import { StageFallback } from './infoCard/StageFallback.tsx'
import { StructureCard } from './infoCard/StructureCard.tsx'
import { TermCard } from './infoCard/TermCard.tsx'
import { openedTermId, selectTermId, standInNow, startTermSync } from './infoCard/term.ts'
import { requestVocabulary, useVocabulary } from './infoCard/vocabularyStore.ts'
import './infoCard/infoCard.css'

/** Announces a selection change in the hidden live region of App.tsx (UX-AC-04). */
function useAnnounce(records: readonly StructureRecord[], data: AtlasData | null, termText: string | null): void {
  const first = records[0] ?? null
  const count = records.length
  useEffect(() => {
    if (typeof document === 'undefined') return
    const live = document.getElementById('atlas-live')
    if (!live || !data) return
    if (termText) {
      live.textContent = termText
      return
    }
    if (!first) {
      live.textContent = ''
      return
    }
    if (count > 1) {
      live.textContent = `${count} structures selected`
      return
    }
    const system = data.systemsById.get(first.system)?.displayName ?? first.system
    live.textContent = announceText(first, system, data.stages.stages, (readAtlas().presentIds as readonly string[]).includes(first.id))
  }, [first, count, data, termText])
}

/** True after the opened link has selected its term once, so a remount does not select it again. */
let linkedTermDone = false

/**
 * A link that names a ZFA term (the `term` key, or a `sel` id the atlas does not draw, D17)
 * fetches the vocabulary chunk once the records are in and selects the term. `applyUrl` has
 * already put the id in `selectedTerm` when the link used the `term` key; the fetch resolves it
 * to a term and its stand-in, and drops it with a toast when the vocabulary does not hold it.
 * Every other visit skips the fetch.
 */
function useLinkedTerm(data: AtlasData | null, selectedTerm: string | null): void {
  useEffect(() => {
    if (!data || linkedTermDone) return
    const termId = selectedTerm ?? openedTermId((id) => data.structuresById.has(id))
    linkedTermDone = true
    if (!termId) return
    void requestVocabulary().then((vocab) => {
      if (vocab && selectTermId(vocab, termId)) return
      if (!vocab) return
      readAtlas().selectTerm(null, null)
      readAtlas().pushWarning(toastText.unknownStructure(termId))
    })
  }, [data, selectedTerm])
}

/** A floating card covers the right of the viewer: the camera rig keeps the fish in the free part (AR-42). */
function useReserveRight(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const el = ref.current
    if (!active || !el) return
    let release: (() => void) | null = null
    const measure = () => {
      release?.()
      const r = el.getBoundingClientRect()
      release = reserveEdge('right', Math.max(0, window.innerWidth - r.left))
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(el)
    return () => {
      observer?.disconnect()
      release?.()
    }
  }, [ref, active])
}

/** Escape inside the card: exit isolate first, then clear the selection (UI-41 order). */
function escapeInCard(): void {
  const s = readAtlas()
  if (s.isolate) s.setIsolate(false)
  else s.clearSelection()
}

export function InfoCard() {
  const data = useAtlas((s) => s.data)
  const selection = useAtlasShallow((s) => s.selection)
  const presentation = useAtlas((s) => s.presentation)
  const embed = useAtlas((s) => s.embed)
  const breakpoint = useBreakpoint()
  const [pinned, setPinned] = useState(false)
  const records = useMemo(
    () => (data ? selection.map((id) => data.structuresById.get(id)).filter((r): r is StructureRecord => r !== undefined) : []),
    [data, selection],
  )
  const selectedTerm = useAtlas((s) => s.selectedTerm)
  useLinkedTerm(data, selectedTerm)
  // enabled: false — the card never pulls the chunk on its own; the link hook and the search do.
  const { vocab } = useVocabulary(false)
  const term = selectedTerm && vocab ? vocab.byId.get(selectedTerm) ?? null : null
  useEffect(() => (vocab ? startTermSync(vocab) : undefined), [vocab])
  useAnnounce(records, data, term && vocab ? `${term.name} selected, ZFA term, ${badgeText(standInNow(vocab, term), vocab)}` : null)
  const cardRef = useRef<HTMLElement>(null)
  const floating = (presentation || embed || breakpoint === 'tablet') && (records.length > 0 || term !== null)
  useReserveRight(cardRef, floating)

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    // The capture-phase dispatcher may have taken this press already (5.9.1: one step per Escape).
    if (e.key !== 'Escape' || e.nativeEvent.defaultPrevented) return
    e.preventDefault()
    e.stopPropagation()
    escapeInCard()
  }

  if (!data) {
    return (
      <div className="info-card info-card-empty" aria-label="Structure information">
        <p className="info-hint">The atlas data is loading.</p>
      </div>
    )
  }

  const docked = breakpoint === 'desktop' && !presentation && !embed
  if ((records.length === 0 && term === null) || (docked && pinned)) {
    return (
      <article className="info-card" data-testid="stage-info" aria-label="Stage information" onKeyDown={onKeyDown}>
        <StageFallback data={data} pinned={pinned} hasSelection={records.length > 0} onTogglePin={() => setPinned((p) => !p)} />
      </article>
    )
  }

  const phone = breakpoint === 'phone' && !presentation && !embed
  const body = term ? (
    <TermCard data={data} vocab={vocab as NonNullable<typeof vocab>} term={term} showHeader={!phone} />
  ) : records.length > 1 ? (
    <MultiCard data={data} records={records} showHeader={!phone} />
  ) : (
    <StructureCard data={data} record={records[0]} showHeader={!phone} onPinStage={docked ? () => setPinned(true) : undefined} />
  )

  if (phone) {
    const peek = term && vocab ? { name: term.name, id: term.id, line: badgeText(standInNow(vocab, term), vocab) } : null
    return (
      <PhoneCard key={term ? term.id : selection.join(',')} data={data} records={records} term={peek} onKeyDown={onKeyDown}>
        {body}
      </PhoneCard>
    )
  }
  return (
    <article ref={cardRef} className="info-card" data-testid="info-card" aria-label="Structure information" onKeyDown={onKeyDown}>
      {body}
    </article>
  )
}
