// Search (spec 5.5, UX-LY-02, UI-26, UX-IN-25, UX-ST-02, D17): a combobox over names, synonyms,
// alias names, ZFA ids and system names of the records, and over every ZFA vocabulary term after
// them. The vocabulary chunk is fetched on the first keystroke, so a visit that never searches
// never downloads it. "/" or Ctrl+K focus the field through the key dispatcher of
// src/state/shortcuts.ts (so a modal sheet keeps them out); Up and Down move; Enter selects;
// Shift+Enter or the row's Jump button moves t to the first appearance (UI-20) and selects;
// Escape clears the field and returns focus to the viewer.
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Clock, Search as SearchIcon } from 'lucide-react'
import { systemHex } from '../core/palette.ts'
import type { PaletteMode } from '../core/palette.ts'
import { parseKey, registerAll } from '../state/shortcuts.ts'
import { useAtlas } from '../state/store.ts'
import type { ZfaId } from '../state/store.ts'
import { usePalette } from './hooks/usePalette.ts'
import { Combobox } from './primitives/Combobox.tsx'
import { IconButton } from './primitives/IconButton.tsx'
import { Kbd } from './primitives/Kbd.tsx'
import { Sheet } from './primitives/Sheet.tsx'
import { jumpToStandIn, selectTermId } from './infoCard/term.ts'
import { useVocabulary } from './infoCard/vocabularyStore.ts'
import { absenceLabel, buildSearchIndex, buildVocabIndex, searchItems, stageWindowLabel, termWindowLabel } from './searchIndex.ts'
import type { SearchItem } from './searchIndex.ts'
import { jumpToStructure, selectStructure } from './selectStructure.ts'
import './Search.css'

export const SEARCH_INPUT_ID = 'atlas-search'
const LIST_PREFIX = `${SEARCH_INPUT_ID}-list-`
const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

function focusSearch(): void {
  const el = document.getElementById(SEARCH_INPUT_ID)
  if (el instanceof HTMLInputElement) {
    el.focus()
    el.select()
  }
}

/** Escape and a selection leave the field; the viewer takes focus when it is focusable (UX-ST-02). */
function returnFocusToViewer(): void {
  document.getElementById(SEARCH_INPUT_ID)?.blur()
  const viewer = document.querySelector<HTMLElement>('[role="application"]')
  viewer?.focus({ preventScroll: true })
}

interface ResultRowProps {
  item: SearchItem
  time: number
  theme: 'dark' | 'light'
  palette: PaletteMode
  onShowAll: () => void
}

/** A vocabulary row (D17): a hollow swatch, the term name, its badge and its ZFIN stage window. */
function TermRow({ item }: { item: SearchItem }) {
  const hit = item.term
  if (!hit) return null
  return (
    <div className="search-row" data-kind="term" data-testid="search-term">
      <span className="search-swatch" data-group="true" style={{ '--swatch': 'var(--text-muted)' } as CSSProperties} aria-hidden="true" />
      <span className="search-main">
        <span className="search-name">
          {hit.term.name}
          {hit.matchedText ? <span className="search-syn"> · {hit.matchedText}</span> : null}
        </span>
        <span className="search-sub">
          {hit.term.id} · {termWindowLabel(hit.term)}
        </span>
      </span>
      <span className="search-badge" data-state={hit.standIn.state} data-testid="search-badge">
        {hit.badge}
      </span>
    </div>
  )
}

/** A 44 px row (UI-26): swatch, name with the matched synonym, system and stage window, absence and Jump. */
function ResultRow({ item, time, theme, palette, onShowAll }: ResultRowProps) {
  if (item.kind === 'notice') return <span className="search-notice">{item.label}</span>
  if (item.kind === 'term') return <TermRow item={item} />
  if (item.kind === 'more' || !item.hit) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm search-more"
        data-testid="search-more"
        onClick={(e) => {
          e.stopPropagation()
          onShowAll()
        }}
      >
        {item.label}
      </button>
    )
  }
  const { record, system, matchedText } = item.hit
  const absent = absenceLabel(record, time)
  const swatch = system ? systemHex(system, theme, palette) : 'transparent'
  return (
    <div className="search-row" data-kind={item.kind} data-absent={absent ? 'true' : 'false'}>
      <span className="search-swatch" data-group={record.geometry === null ? 'true' : 'false'} style={{ background: swatch, '--swatch': swatch } as CSSProperties} aria-hidden="true" />
      <span className="search-main">
        <span className="search-name">
          {record.name}
          {matchedText ? <span className="search-syn"> · {matchedText}</span> : null}
        </span>
        <span className="search-sub">
          {system ? `${system.displayName} · ` : ''}
          {stageWindowLabel(record)}
        </span>
      </span>
      <span className="search-badge" data-state="modeled" data-testid="search-badge">
        modeled
      </span>
      {absent ? (
        <>
          <span className="search-absent">
            <Clock {...ICON} />
            absent now, {absent}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm search-jump"
            data-testid="search-jump"
            title="Jump to first appearance (Shift+Enter)"
            onClick={(e) => {
              e.stopPropagation()
              jumpToStructure(record.id as ZfaId)
            }}
          >
            Jump
          </button>
        </>
      ) : null}
    </div>
  )
}

interface SearchBoxProps {
  autoFocus?: boolean
  /** Called after a selection (the phone sheet closes). */
  onDone?: () => void
}

function SearchBox({ autoFocus, onDone }: SearchBoxProps) {
  const data = useAtlas((s) => s.data)
  const theme = useAtlas((s) => s.theme)
  const palette = usePalette()
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const active = query.trim().length > 0
  // The clock is read only while the list can show, so playback does not re-render the top bar.
  const time = useAtlas((s) => (active ? s.time : 0))
  const index = useMemo(() => (data ? buildSearchIndex(data) : null), [data])
  // The first keystroke pulls the vocabulary chunk (D17); until it lands the rows are records only.
  const { vocab } = useVocabulary(active)
  const vocabIndex = useMemo(
    () => (vocab && data ? buildVocabIndex(vocab, (id) => data.structuresById.has(id)) : null),
    [vocab, data],
  )
  const items = useMemo(
    () => (index && active ? searchItems(index, query, showAll, vocabIndex) : []),
    [index, query, showAll, active, vocabIndex],
  )

  const finish = () => {
    setQuery('')
    setShowAll(false)
    returnFocusToViewer()
    onDone?.()
  }
  const onSelect = (item: SearchItem) => {
    if (item.kind === 'term' && item.term && vocab) {
      selectTermId(vocab, item.term.term.id)
      finish()
      return
    }
    if (!item.hit) return
    selectStructure(item.hit.record.id as ZfaId)
    finish()
  }
  // Before the combobox sees Enter: Shift+Enter jumps to the active row; Enter on "Show all" expands the list.
  const onKeyDownCapture = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return
    const activeId = e.currentTarget.querySelector('input')?.getAttribute('aria-activedescendant') ?? ''
    const item = items.find((it) => `${LIST_PREFIX}${it.id}` === activeId)
    if (!item) return
    if (item.kind === 'more') {
      e.preventDefault()
      e.stopPropagation()
      setShowAll(true)
    } else if (e.shiftKey && item.kind === 'term' && item.term && vocab) {
      e.preventDefault()
      e.stopPropagation()
      jumpToStandIn(vocab, item.term.term.id)
      finish()
    } else if (e.shiftKey && item.hit) {
      e.preventDefault()
      e.stopPropagation()
      jumpToStructure(item.hit.record.id as ZfaId)
      finish()
    }
  }

  return (
    <div className="search" data-testid="search" onKeyDownCapture={onKeyDownCapture}>
      <Combobox<SearchItem>
        id={SEARCH_INPUT_ID}
        label="Search structures"
        placeholder="Search structures, ZFA terms, synonyms, ids"
        value={query}
        onValueChange={(v) => {
          setQuery(v)
          setShowAll(false)
        }}
        items={items}
        onSelect={onSelect}
        renderItem={(item) => <ResultRow item={item} time={time} theme={theme} palette={palette} onShowAll={() => setShowAll(true)} />}
        onEscape={returnFocusToViewer}
        autoFocus={autoFocus}
      />
      {query.length === 0 ? (
        <span className="search-kbd">
          <Kbd>/</Kbd>
        </span>
      ) : null}
    </div>
  )
}

export interface SearchProps {
  /** Phone: one icon button that opens the field in a sheet. */
  compact?: boolean
}

export function Search({ compact = false }: SearchProps) {
  const [open, setOpen] = useState(false)
  // Layered over the dispatcher defaults (which focus a mounted field): the phone has no field until the sheet opens.
  useEffect(() => {
    const run = () => (compact ? setOpen(true) : focusSearch())
    return registerAll([{ ...parseKey('/'), run }, { ...parseKey('Ctrl+K'), run }])
  }, [compact])

  if (!compact) return <SearchBox />
  return (
    <>
      <IconButton label="Search" shortcut="/" onClick={() => setOpen(true)}>
        <SearchIcon {...ICON} />
      </IconButton>
      <Sheet open={open} onClose={() => setOpen(false)} title="Search" side="bottom" detent="half" className="search-sheet">
        <SearchBox autoFocus onDone={() => setOpen(false)} />
      </Sheet>
    </>
  )
}
