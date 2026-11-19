import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx.ts'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Renders `aria-pressed` for a toggle button. */
  pressed?: boolean
  children?: ReactNode
}

/** A text button: 36 px high by default, 8 px radius, focus ring from the tokens. */
export function Button({
  variant = 'secondary',
  size = 'md',
  pressed,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cx(
        'btn',
        variant !== 'secondary' && `btn-${variant}`,
        size !== 'md' && `btn-${size}`,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
