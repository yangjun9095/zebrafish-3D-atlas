import type { ReactNode } from 'react'
import { cx } from './cx.ts'

export interface KbdProps {
  /** Key names joined with "+", for example ["Ctrl", "K"]. */
  keys?: readonly string[]
  className?: string
  children?: ReactNode
}

/** A key cap. Pass `keys` for a combination or children for one key. */
export function Kbd({ keys, className, children }: KbdProps) {
  if (keys && keys.length > 0) {
    return (
      <span className={cx('kbd-group', className)}>
        {keys.map((k, i) => (
          <span key={`${k}-${i}`}>
            {i > 0 ? <span aria-hidden="true">+</span> : null}
            <kbd className="kbd">{k}</kbd>
          </span>
        ))}
      </span>
    )
  }
  return <kbd className={cx('kbd', className)}>{children}</kbd>
}
