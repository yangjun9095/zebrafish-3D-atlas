import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx.ts'

export type BadgeTone = 'neutral' | 'accent' | 'danger' | 'solid'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
}

/** A small chip for counts and states: 20 px high, 11 px tabular text, 4 px radius. */
export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx('badge', tone !== 'neutral' && `badge-${tone}`, className)} {...rest}>
      {children}
    </span>
  )
}
