import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cx } from './cx.ts'

export interface ComboboxItem {
  id: string
  label: string
  /** Secondary text at the right of the row, for example the system name. */
  hint?: string
  disabled?: boolean
}

export interface ComboboxProps<T extends ComboboxItem> {
  value: string
  onValueChange: (value: string) => void
  items: readonly T[]
  onSelect: (item: T) => void
  label: string
  placeholder?: string
  emptyMessage?: ReactNode
  renderItem?: (item: T, active: boolean) => ReactNode
  /** Called on Escape after the list closes, so a parent can return focus. */
  onEscape?: () => void
  id?: string
  className?: string
  autoFocus?: boolean
}

/**
 * A text input with a listbox (WAI-ARIA combobox pattern). The parent owns the
 * query and the filtered items; this component owns the open state and the
 * active row. Up and Down move, Enter selects, Escape closes, clears and hands focus back.
 */
export function Combobox<T extends ComboboxItem>({
  value,
  onValueChange,
  items,
  onSelect,
  label,
  placeholder,
  emptyMessage = 'No match',
  renderItem,
  onEscape,
  id,
  className,
  autoFocus,
}: ComboboxProps<T>) {
  const autoId = useId()
  const inputId = id ?? autoId
  const listId = `${inputId}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const showList = open && value.length > 0
  const activeIndex = items.length === 0 ? 0 : Math.min(active, items.length - 1)
  const activeItem = items[activeIndex]
  const activeId = showList && activeItem ? `${listId}-${activeItem.id}` : undefined

  const move = (delta: number) => {
    if (items.length === 0) return
    setOpen(true)
    setActive((activeIndex + delta + items.length) % items.length)
  }

  const choose = (item: T | undefined) => {
    if (!item || item.disabled) return
    onSelect(item)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Enter':
        if (showList) {
          e.preventDefault()
          choose(activeItem)
        }
        break
      case 'Escape':
        // One press: close the list, clear the field, hand focus back (UX-ST-02).
        e.preventDefault()
        setOpen(false)
        if (value.length > 0) onValueChange('')
        onEscape?.()
        break
      default:
        break
    }
  }

  return (
    <div ref={rootRef} className={cx('combo', className)}>
      <Search className="combo-icon" aria-hidden="true" strokeWidth={1.75} />
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        autoFocus={autoFocus}
        className="combo-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onValueChange(e.currentTarget.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showList ? (
        <ul id={listId} role="listbox" aria-label={label} className="combo-list">
          {items.length === 0 ? (
            <li className="combo-empty" role="presentation">
              {emptyMessage}
            </li>
          ) : (
            items.map((item, i) => (
              <li
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={i === activeIndex}
                aria-disabled={item.disabled || undefined}
                data-active={i === activeIndex || undefined}
                className="combo-option"
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
              >
                {renderItem ? (
                  renderItem(item, i === activeIndex)
                ) : (
                  <>
                    <span>{item.label}</span>
                    {item.hint ? <span className="combo-hint">{item.hint}</span> : null}
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
