import { Component, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleAlert, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from './primitives/Button.tsx'

/** The shape of `AtlasParseError` from src/core/schema.ts (AR-66), kept structural here. */
export interface ParseIssueLike {
  path: string
  message: string
}
export interface ParseErrorLike {
  file: string
  issues: readonly ParseIssueLike[]
}

export const ZFIN_URL = 'https://zfin.org/'
export const ZFIN_STAGES_URL = 'https://zfin.org/zf_info/zfbook/stages/index.html'

/** Data parse failure (AR-66, UX-ST-08): the file name and the first three issues. */
export function DataErrorCard({ error }: { error: ParseErrorLike }) {
  const shown = error.issues.slice(0, 3)
  const more = error.issues.length - shown.length
  return (
    <div className="error-center" data-error="data">
      <div className="error-card" role="alert">
        <CircleAlert aria-hidden="true" strokeWidth={1.75} />
        <h1 className="error-title-sm">Could not load the atlas data</h1>
        <p className="error-text">
          The file <code className="id-mono">{error.file}</code> did not pass the schema.
        </p>
        <ul className="error-issues">
          {shown.map((issue, i) => (
            <li key={`${issue.path}-${i}`}>
              <span>{issue.path || '(root)'}</span>: {issue.message}
            </li>
          ))}
          {more > 0 ? <li>{more} more</li> : null}
        </ul>
      </div>
    </div>
  )
}

/**
 * Start-up failure (SEC-02): src/main.tsx renders this when `bootstrapShell` throws. That call
 * runs before React mounts, so without it the page stays empty and the reader has nothing to
 * report.
 */
export function StartupErrorCard({ message }: { message?: string }) {
  return (
    <div className="error-center" data-error="startup">
      <div className="error-card" role="alert">
        <CircleAlert aria-hidden="true" strokeWidth={1.75} />
        <h1 className="error-title-sm">The atlas could not start</h1>
        <p className="error-text">Open the atlas without the parameters in the link, then reload the page.</p>
        {message ? <p className="error-issues">{message}</p> : null}
      </div>
    </div>
  )
}

export interface WebglUnavailableProps {
  /** The lateral view at 24 hpf; defaults to the bundled fallback PNG. */
  fallbackSrc?: string
}

/** WebGL unavailable (AR-67, UX-ST-06): a static PNG, the message, and two links. */
export function WebglUnavailable({ fallbackSrc }: WebglUnavailableProps) {
  const src = fallbackSrc ?? `${import.meta.env.BASE_URL}fallback-24hpf.png`
  return (
    <div className="error-center" data-error="webgl">
      <div className="error-card">
        <img className="error-fallback" src={src} alt="Zebrafish embryo at 24 hours post fertilization, lateral view" />
        <h1 className="error-title-sm">This browser cannot run the 3D viewer.</h1>
        <p className="error-text">Try a current version of Chrome, Firefox or Safari.</p>
        <div className="error-links">
          <a className="link" href={ZFIN_URL} target="_blank" rel="noreferrer">
            ZFIN <ExternalLink aria-hidden="true" size={12} strokeWidth={1.75} />
          </a>
          <a className="link" href={ZFIN_STAGES_URL} target="_blank" rel="noreferrer">
            ZFIN stage table <ExternalLink aria-hidden="true" size={12} strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </div>
  )
}

export interface ContextLostProps {
  onReload: () => void
  /** Delay before the Reload button appears (AR-68: 5 s). */
  reloadAfterMs?: number
}

/** Context lost (AR-68, UX-ST-07): the status text and, after a delay, a Reload viewer button. */
export function ContextLostNotice({ onReload, reloadAfterMs = 5000 }: ContextLostProps) {
  const [showReload, setShowReload] = useState(reloadAfterMs <= 0)
  useEffect(() => {
    if (reloadAfterMs <= 0) return
    const t = setTimeout(() => setShowReload(true), reloadAfterMs)
    return () => clearTimeout(t)
  }, [reloadAfterMs])
  return (
    <div className="error-center" data-error="context-lost">
      <div className="error-card" role="status">
        <p className="error-text">The 3D view paused. Restoring…</p>
        {showReload ? (
          <Button variant="primary" onClick={onReload}>
            <RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} />
            Reload viewer
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export interface BadUrlNoticeProps {
  /** Unknown ZFA ids from the URL, for example "ZFA:9999999". */
  unknownIds?: readonly string[]
  timeClamped?: boolean
}

/**
 * Bad URL (AR-69, UX-ST-09) rendered as text rather than a toast, for the
 * load-time warning list. The toast texts live in `hooks/useToast.ts`.
 */
export function BadUrlNotice({ unknownIds = [], timeClamped = false }: BadUrlNoticeProps) {
  if (unknownIds.length === 0 && !timeClamped) return null
  return (
    <ul className="error-issues" data-error="bad-url" role="status">
      {unknownIds.map((id) => (
        <li key={id}>{`Structure ${id} is not in this atlas`}</li>
      ))}
      {timeClamped ? <li>Time clamped to 180 dpf</li> : null}
    </ul>
  )
}

export interface SheetErrorBoundaryProps {
  children: ReactNode
  /** Runs once when a child throws, so the caller can clear the overlay it flagged open. */
  onError?: (error: unknown) => void
}

interface SheetErrorBoundaryState {
  failed: boolean
}

/**
 * The one error boundary of the app, around the lazy sheets of App.tsx. A chunk that never
 * arrives (a flaky network, a viewer on a stale index.html after a redeploy) throws past
 * Suspense, and without a boundary React unmounts the whole root and the page goes blank. This
 * keeps the viewer, the rail and the timeline mounted, hands the failure to `onError` for the
 * toast and the overlay registry, and renders nothing in the sheet's place. A failed chunk
 * cannot be re-fetched, so the boundary stays closed until the reader reloads.
 */
export class SheetErrorBoundary extends Component<SheetErrorBoundaryProps, SheetErrorBoundaryState> {
  state: SheetErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): SheetErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: unknown): void {
    console.error('[atlas] a panel failed to load', error)
    this.props.onError?.(error)
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}
