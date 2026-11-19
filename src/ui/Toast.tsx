import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './primitives/Button.tsx'
import { IconButton } from './primitives/IconButton.tsx'
import { dismissToast, setToastErrorsOnly, useToasts } from './hooks/useToast.ts'

export interface ToastHostProps {
  /** In presentation mode only error toasts show (UX-ST-13). */
  presentation?: boolean
}

/**
 * Renders the visible toast bottom centre above the timeline bar: 44 px high,
 * `role="status"`, a close button. Call `showToast` from `hooks/useToast.ts`.
 */
export function ToastHost({ presentation = false }: ToastHostProps) {
  const toasts = useToasts()
  const head = toasts[0]

  useEffect(() => {
    setToastErrorsOnly(presentation)
  }, [presentation])

  return (
    <div className="toast-host" aria-live="polite">
      {head ? (
        <div
          key={head.id}
          role="status"
          className={head.kind === 'error' ? 'toast toast-error' : 'toast'}
          data-kind={head.kind}
        >
          <span className="toast-text">{head.text}</span>
          {head.action ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                head.action?.onClick()
                dismissToast(head.id)
              }}
            >
              {head.action.label}
            </Button>
          ) : null}
          <IconButton label="Dismiss" size="sm" tooltip={false} onClick={() => dismissToast(head.id)}>
            <X aria-hidden="true" strokeWidth={1.75} />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}
