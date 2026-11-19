import { useId, type CSSProperties, type ReactNode } from 'react'
import { cx } from './cx.ts'

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: ReactNode
  /** Formats the value text shown at the right and read by `aria-valuetext`. */
  formatValue?: (value: number) => string
  /** Hides the label row; the label still names the input. */
  hideLabel?: boolean
  disabled?: boolean
  className?: string
  id?: string
  onCommit?: (value: number) => void
}

/** A range slider on a native input, so the WAI-ARIA slider pattern comes for free. */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  formatValue,
  hideLabel,
  disabled,
  className,
  id,
  onCommit,
}: SliderProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const span = max - min
  const fill = span > 0 ? ((value - min) / span) * 100 : 0
  const text = formatValue ? formatValue(value) : String(value)
  const style = { '--fill': `${Math.max(0, Math.min(100, fill))}%` } as CSSProperties
  return (
    <div className={cx('slider', className)}>
      <div className={cx('slider-head', hideLabel && 'sr-only')}>
        <label htmlFor={inputId}>{label}</label>
        <span className="slider-value" aria-hidden="true">
          {text}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        className="slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={text}
        style={style}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        onPointerUp={(e) => onCommit?.(Number(e.currentTarget.value))}
        onKeyUp={(e) => onCommit?.(Number(e.currentTarget.value))}
      />
    </div>
  )
}
