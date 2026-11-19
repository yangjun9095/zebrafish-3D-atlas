// Hierarchy tree of the systems rail (spec 5.3.2, UI-17, UI-18, UX-IN-26, UX-IN-29, UX-AC-02): wires
// TreeView.tsx to the atlas store. Rows follow the WAI-ARIA tree pattern with a roving tabindex: Down, Up,
// Right, Left, Home, End, Enter, Space, "*", type-ahead, Shift+Arrow and Ctrl+A; the global dispatcher
// skips a focused treeitem (UI-41). The eye of the focused row is one Tab away. The present filter is on
// by default; expansion persists in localStorage.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { readLayout, writeLayout } from '../state/persist.ts'
import { usePalette } from './hooks/usePalette.ts'
import { MAX_SELECTION, readAtlas, subscribeAtlas, useAtlas } from '../state/store.ts'
import type { ZfaId } from '../state/store.ts'
import { selectStructure } from './selectStructure.ts'
import { ancestorKeys, buildTree, defaultExpanded, flattenRows, shownChildren, treeRows, typeAheadTarget } from './treeModel.ts'
import { TreeView } from './TreeView.tsx'
import type { TreeActions } from './TreeView.tsx'
import './Tree.css'

const TYPE_AHEAD_MS = 500

function rowElement(root: HTMLElement | null, key: string): HTMLElement | null {
  return root?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`) ?? null
}

export function Tree() {
  const data = useAtlas((s) => s.data)
  const presentIds = useAtlas((s) => s.presentIds)
  const hiddenStructures = useAtlas((s) => s.hiddenStructures)
  const hiddenSystems = useAtlas((s) => s.hiddenSystems)
  const selection = useAtlas((s) => s.selection)
  const theme = useAtlas((s) => s.theme)
  const palette = usePalette()
  const model = useMemo(() => (data ? buildTree(data) : null), [data])
  const [onlyPresent, setOnlyPresent] = useState(true)
  const [stored, setStored] = useState<Set<string> | null>(() => {
    const keys = readLayout().treeExpanded
    return Array.isArray(keys) ? new Set(keys) : null
  })
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const typeAhead = useRef({ text: '', at: 0 })

  const expanded = useMemo(() => stored ?? new Set(model ? defaultExpanded(model) : []), [stored, model])
  const rows = useMemo(
    () => (model ? treeRows({ model, presentIds: new Set(presentIds), hiddenStructures, hiddenSystems, selection, expanded, onlyPresent }) : []),
    [model, presentIds, hiddenStructures, hiddenSystems, selection, expanded, onlyPresent],
  )
  const flat = useMemo(() => flattenRows(rows), [rows])

  const setExpanded = (next: Set<string>, persist: boolean) => {
    setStored(next)
    if (persist) writeLayout({ treeExpanded: [...next] })
  }
  const setOpen = (keys: string[], open: boolean) => {
    const next = new Set(expanded)
    for (const k of keys) {
      if (open) next.add(k)
      else next.delete(k)
    }
    setExpanded(next, true)
  }
  const moveTo = (key: string) => {
    setActiveKey(key)
    rowElement(rootRef.current, key)?.focus({ preventScroll: false })
  }

  // A selection made in 3D, from search or from the URL reveals its row (UX-IN-29).
  useEffect(() => {
    if (!model) return
    return subscribeAtlas(
      (s) => s.selection[s.selection.length - 1] ?? null,
      (id) => {
        if (!id) return
        const ancestors = ancestorKeys(model, id)
        if (ancestors.length === 0) return
        setStored((prev) => {
          const base = prev ?? new Set(defaultExpanded(model))
          if (ancestors.every((k) => base.has(k))) return prev
          const next = new Set(base)
          for (const k of ancestors) next.add(k)
          return next
        })
        setActiveKey(id)
        requestAnimationFrame(() => rowElement(rootRef.current, id)?.scrollIntoView({ block: 'nearest' }))
      },
      { fireImmediately: true },
    )
  }, [model])

  const actions: TreeActions = {
    activate(row, add) {
      setActiveKey(row.node.key)
      if (row.node.kind === 'record') selectStructure(row.node.key as ZfaId, { add })
      else setOpen([row.node.key], !row.expanded)
    },
    toggleExpand(row) {
      if (row.node.children.length > 0) setOpen([row.node.key], !row.expanded)
    },
    toggleHidden(row) {
      const s = readAtlas()
      const { node } = row
      if (node.kind === 'system') s.setSystemHidden(node.system.id, !row.hidden)
      else if (!node.group) s.setStructureHidden(node.key as ZfaId, !row.hidden)
      else for (const id of node.geometryIds) s.setStructureHidden(id as ZfaId, !row.hidden)
    },
    hover(row, on) {
      if (row.node.kind !== 'record' || row.node.group) return
      const s = readAtlas()
      if (on) s.setHover(row.node.key as ZfaId)
      else if (s.hover === row.node.key) s.setHover(null)
    },
    focus(row) {
      setActiveKey(row.node.key)
    },
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    // The chevron and the eye handle their own keys.
    if (flat.length === 0 || (e.target instanceof HTMLElement && e.target.closest('button'))) return
    const i = Math.max(0, flat.findIndex((r) => r.node.key === activeKey))
    const row = flat[i]
    const go = (j: number, extend = false) => {
      const target = flat[Math.min(Math.max(j, 0), flat.length - 1)]
      moveTo(target.node.key)
      if (extend && target.node.kind === 'record') selectStructure(target.node.key as ZfaId, { add: true })
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      const s = readAtlas()
      s.clearSelection()
      for (const r of flat.filter((r) => r.node.kind === 'record').slice(0, MAX_SELECTION)) s.select(r.node.key as ZfaId, { add: true })
    } else if (e.key === 'ArrowDown') go(i + 1, e.shiftKey)
    else if (e.key === 'ArrowUp') go(i - 1, e.shiftKey)
    else if (e.key === 'ArrowRight') {
      if (shownChildren(row.node).length === 0) return
      if (!row.expanded) setOpen([row.node.key], true)
      else go(i + 1)
    } else if (e.key === 'ArrowLeft') {
      if (row.expanded) setOpen([row.node.key], false)
      else {
        // A folded wrapper (R13) has no row: climb to the nearest ancestor that does.
        let parent = model?.parentKey.get(row.node.key) ?? null
        while (parent && !flat.some((r) => r.node.key === parent)) parent = model?.parentKey.get(parent) ?? null
        if (parent) moveTo(parent)
      }
    } else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(flat.length - 1)
    else if (e.key === 'Enter') actions.activate(row, false)
    else if (e.key === ' ') {
      if (row.node.kind === 'record') selectStructure(row.node.key as ZfaId, { add: true })
      else setOpen([row.node.key], !row.expanded)
    } else if (e.key === '*') {
      const parent = model?.parentKey.get(row.node.key) ?? null
      const siblings = parent === null ? (model?.roots ?? []) : (model?.byKey.get(parent)?.children ?? [])
      setOpen(siblings.filter((n) => n.children.length > 0).map((n) => n.key), true)
    } else if (/^[a-z0-9]$/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now()
      const prev = typeAhead.current
      const text = now - prev.at > TYPE_AHEAD_MS ? e.key : prev.text + e.key
      typeAhead.current = { text, at: now }
      const j = typeAheadTarget(flat, i, text)
      if (j >= 0) moveTo(flat[j].node.key)
    } else return
    e.preventDefault()
  }

  return (
    <div ref={rootRef} className="tree-host">
      <div className="tree-head">
        <p className="tree-title">Structures</p>
        <label className="tree-filter">
          <input type="checkbox" checked={onlyPresent} onChange={(e) => setOnlyPresent(e.currentTarget.checked)} data-testid="tree-filter" />
          Only present now
        </label>
      </div>
      {rows.length === 0 ? (
        <p className="tree-empty">{model ? 'Nothing is present at this time. Turn the filter off to list every structure.' : 'The structure tree loads with the atlas data.'}</p>
      ) : null}
      <TreeView rows={rows} activeKey={activeKey} theme={theme} palette={palette} actions={actions} onKeyDown={onKeyDown} />
    </div>
  )
}
