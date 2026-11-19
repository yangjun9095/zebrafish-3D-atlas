import type { ReactNode } from 'react'
import { Button, type ButtonProps } from './Button.tsx'
import { Tooltip } from './Tooltip.tsx'
import { cx } from './cx.ts'

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'size' | 'aria-label'> {
  /** Accessible name; also the tooltip text (UX-AC-05). */
  label: string
  /** Shortcut shown in the tooltip, for example "Space". */
  shortcut?: string
  /** 44 px target (default) or a 32 px button for dense rows. */
  size?: 'md' | 'sm'
  /** Set false to omit the tooltip (a parent already labels the button). */
  tooltip?: boolean
  children: ReactNode
}

/** An icon-only button with an `aria-label` and a tooltip that names the shortcut. */
export function IconButton({
  label,
  shortcut,
  size = 'md',
  tooltip = true,
  variant = 'ghost',
  className,
  children,
  ...rest
}: IconButtonProps) {
  const button = (
    <Button
      aria-label={label}
      variant={variant}
      className={cx('iconbtn', size === 'sm' && 'iconbtn-sm', className)}
      {...rest}
    >
      {children}
    </Button>
  )
  if (!tooltip) return button
  return (
    <Tooltip label={label} shortcut={shortcut}>
      {button}
    </Tooltip>
  )
}
