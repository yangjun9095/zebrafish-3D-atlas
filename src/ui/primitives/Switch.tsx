import { useId, type ReactNode } from 'react'
import { cx } from './cx.ts'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  className?: string
  id?: string
}

/** A `role="switch"` toggle. Space and Enter toggle it through the native button. */
export function Switch({ checked, onChange, label, description, disabled, className, id }: SwitchProps) {
  const autoId = useId()
  const descId = description ? `${id ?? autoId}-desc` : undefined
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={descId}
      disabled={disabled}
      className={cx('switch', className)}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track" aria-hidden="true" />
      <span className="switch-text">
        <span>{label}</span>
        {description ? (
          <span id={descId} className="switch-desc">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  )
}
