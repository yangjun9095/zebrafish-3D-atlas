// The pure view of the hierarchy tree (spec 5.3.2, UX-LY-05, UX-AC-02): nested treeitems with a roving
// tabindex, chevron, swatch, name, clock, count badge and eye. Tree.tsx wires it to the store; the unit
// tests render it without one.
import { systemHex } from '../core/palette.ts'
import type { PaletteMode } from '../core/palette.ts'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronDown, ChevronRight, Clock, Eye, EyeOff } from 'lucide-react'
import { stepLightness } from '../core/palette.ts'
import { Badge } from './primitives/Badge.tsx'
import { cx } from './primitives/cx.ts'
import { countLabel } from './railModel.ts'
import { flattenRows, shownChildren } from './treeModel.ts'
import type { TreeRow } from './treeModel.ts'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export interface TreeActions {
  /** Enter or click: a record selects (add extends the selection), a system row toggles its expansion. */
  activate(row: TreeRow, add: boolean): void
  toggleExpand(row: TreeRow): void
  toggleHidden(row: TreeRow): void
  hover(row: TreeRow, on: boolean): void
  focus(row: TreeRow): void
}

const NO_ACTIONS: TreeActions = { activate() {}, toggleExpand() {}, toggleHidden() {}, hover() {}, focus() {} }

interface TreeItemProps {
  row: TreeRow
  activeKey: string | null
  theme: 'dark' | 'light'
  palette?: PaletteMode
  actions: TreeActions
}

function TreeItem({ row, activeKey, theme, palette, actions }: TreeItemProps) {
  const { node } = row
  const active = node.key === activeKey
  const hasChildren = shownChildren(node).length > 0
  const base = systemHex(node.system, theme, palette)
  const swatch = node.kind === 'system' ? base : stepLightness(base, node.depth - 1, theme)
  const eyeLabel = `${row.hidden ? 'Show' : 'Hide'} ${node.name}`
  // The name span labels the item, so the accessible name is the structure name alone (not the nested rows).
  const nameId = `tree-name-${node.key}`
  return (
    <li
      role="treeitem"
      className={cx('tree-item', node.kind === 'system' && 'tree-sys')}
      data-key={node.key}
      data-testid={node.kind === 'system' ? 'tree-system' : 'tree-record'}
      aria-labelledby={nameId}
      tabIndex={active ? 0 : -1}
      aria-level={row.level}
      aria-setsize={row.setSize}
      aria-posinset={row.posInSet}
      aria-expanded={hasChildren ? row.expanded : undefined}
      aria-selected={row.selected}
      onFocus={(e) => {
        if (e.target === e.currentTarget) actions.focus(row)
      }}
    >
      <div
        className="tree-row"
        style={{ '--level': row.level } as CSSProperties}
        data-present={row.present ? 'true' : 'false'}
        data-hidden={row.hidden ? 'true' : 'false'}
        onClick={(e) => actions.activate(row, e.shiftKey || e.ctrlKey || e.metaKey)}
        onPointerEnter={() => actions.hover(row, true)}
        onPointerLeave={() => actions.hover(row, false)}
      >
        <button
          type="button"
          className="tree-chevron"
          tabIndex={-1}
          aria-label={row.expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          data-leaf={hasChildren ? 'false' : 'true'}
          onClick={(e) => {
            e.stopPropagation()
            actions.toggleExpand(row)
          }}
        >
          {row.expanded ? <ChevronDown {...ICON} /> : <ChevronRight {...ICON} />}
        </button>
        <span className="tree-swatch" data-group={node.group ? 'true' : 'false'} style={{ background: swatch, '--swatch': swatch } as CSSProperties} aria-hidden="true" />
        <span id={nameId} className="tree-name">{node.name}</span>
        {row.present ? null : <Clock className="tree-clock" strokeWidth={1.75} aria-label="Not present now" />}
        {row.counts ? <Badge title={`${row.counts.present} present at this time of ${row.counts.total} modelled`}>{countLabel(row.counts)}</Badge> : null}
        <button
          type="button"
          className="tree-eye"
          tabIndex={active ? 0 : -1}
          aria-label={eyeLabel}
          aria-pressed={!row.hidden}
          disabled={!row.hideable}
          onClick={(e) => {
            e.stopPropagation()
            actions.toggleHidden(row)
          }}
        >
          {row.hidden ? <EyeOff {...ICON} /> : <Eye {...ICON} />}
        </button>
      </div>
      {row.children.length > 0 ? (
        <ul role="group">
          {row.children.map((child) => (
            <TreeItem key={child.node.key} row={child} activeKey={activeKey} theme={theme} palette={palette} actions={actions} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export interface TreeViewProps {
  rows: TreeRow[]
  /** The row with tabindex 0; the first row when null. */
  activeKey: string | null
  theme: 'dark' | 'light'
  palette?: PaletteMode
  actions?: TreeActions
  onKeyDown?: (e: ReactKeyboardEvent<HTMLUListElement>) => void
}

export function TreeView({ rows, activeKey, theme, palette = 'atlas', actions = NO_ACTIONS, onKeyDown }: TreeViewProps) {
  const key = activeKey !== null && flattenRows(rows).some((r) => r.node.key === activeKey) ? activeKey : (rows[0]?.node.key ?? null)
  return (
    <ul role="tree" aria-label="Structures" aria-multiselectable="true" className="tree" data-testid="structure-tree" onKeyDown={onKeyDown}>
      {rows.map((row) => (
        <TreeItem key={row.node.key} row={row} activeKey={key} theme={theme} palette={palette} actions={actions} />
      ))}
    </ul>
  )
}

