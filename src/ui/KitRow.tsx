// One bookmark row of the kit sheet (spec UI-38): thumbnail, name with inline rename, time and
// selection, move up and down (buttons, drag, Alt+Arrow), and delete with a confirm step.
import { useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import { kitWithBookmarks, removeItem, updateBookmark } from '../state/slices/mode.ts'
import { readAtlas } from '../state/store.ts'
import type { Bookmark, SlideKit } from '../state/store.ts'
import { commitKit, getThumbs, moveRow } from './kitActions.ts'
import { Button } from './primitives/Button.tsx'
import { IconButton } from './primitives/IconButton.tsx'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export function NameField({ value, onCommit, onCancel, label }: { value: string; onCommit(v: string): void; onCancel(): void; label: string }) {
  return (
    <input
      className="kit-input"
      type="text"
      defaultValue={value}
      aria-label={label}
      autoFocus
      onBlur={(e) => onCommit(e.currentTarget.value)}
      onKeyDown={(e) => {
        // The sheet closes on Escape; an edit swallows it.
        e.stopPropagation()
        if (e.key === 'Enter') onCommit(e.currentTarget.value)
        if (e.key === 'Escape') onCancel()
      }}
    />
  )
}

interface RowProps {
  kit: SlideKit
  index: number
  bookmark: Bookmark
  thumb: string | null
  selectionText: string
  timeText: string
}

export function BookmarkRow({ kit, index, bookmark, thumb, selectionText, timeText }: RowProps) {
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const current = index === kit.index
  const go = () => readAtlas().goToBookmark(index)
  const move = (from: number, to: number) => moveRow(kit, from, to)
  const remove = () => {
    const nextIndex = index < kit.index ? kit.index - 1 : kit.index
    commitKit(kitWithBookmarks(kit, removeItem(kit.bookmarks, index), nextIndex), removeItem(getThumbs(kit.id), index))
  }
  const onKeyDown = (e: ReactKeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      move(index, index + (e.key === 'ArrowUp' ? -1 : 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      go()
    }
  }
  return (
    <li
      className="kit-row"
      data-index={index}
      data-current={current ? 'true' : 'false'}
      tabIndex={0}
      aria-label={`${bookmark.name}, ${timeText}${current ? ', current' : ''}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const from = Number(e.dataTransfer.getData('text/plain'))
        if (Number.isInteger(from)) move(from, index)
      }}
      onKeyDown={onKeyDown}
    >
      <button type="button" className="kit-thumb" aria-label={`Go to ${bookmark.name}`} onClick={go}>
        {thumb ? <img src={thumb} alt="" /> : <span>{timeText}</span>}
      </button>
      <div className="kit-main">
        {editing ? (
          <NameField
            value={bookmark.name}
            label="Bookmark name"
            onCommit={(v) => {
              setEditing(false)
              if (v.trim() && v.trim() !== bookmark.name) commitKit(updateBookmark(kit, index, { name: v.trim() }))
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button type="button" className="kit-name" onClick={go} onDoubleClick={() => setEditing(true)} title={bookmark.name}>
            {bookmark.name}
          </button>
        )}
        <div className="kit-meta" title={selectionText}>
          {timeText} · {selectionText}
        </div>
      </div>
      <div className="kit-row-actions">
        <IconButton label="Move up" shortcut="Alt+↑" size="sm" disabled={index === 0} onClick={() => move(index, index - 1)}>
          <ArrowUp {...ICON} />
        </IconButton>
        <IconButton label="Move down" shortcut="Alt+↓" size="sm" disabled={index === kit.bookmarks.length - 1} onClick={() => move(index, index + 1)}>
          <ArrowDown {...ICON} />
        </IconButton>
        <IconButton label="Rename" size="sm" onClick={() => setEditing(true)}>
          <Pencil {...ICON} />
        </IconButton>
        {confirm ? (
          <Button size="sm" variant="danger" autoFocus onBlur={() => setConfirm(false)} onClick={remove}>
            Delete?
          </Button>
        ) : (
          <IconButton label="Delete" size="sm" onClick={() => setConfirm(true)}>
            <Trash2 {...ICON} />
          </IconButton>
        )}
      </div>
    </li>
  )
}
