import { Suspense, lazy, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { Viewer } from './viewer/Viewer.tsx'
import { TopBar } from './ui/TopBar.tsx'
import { SystemsRail } from './ui/SystemsRail.tsx'
import { TimelineBar } from './ui/TimelineBar.tsx'
import { InfoCard } from './ui/InfoCard.tsx'
import { ToastHost } from './ui/Toast.tsx'
import { ContextLostNotice, DataErrorCard, SheetErrorBoundary, WebglUnavailable } from './ui/ErrorScreens.tsx'
import { EmbedFooter } from './ui/EmbedFooter.tsx'
import { KitMarkers } from './ui/KitMarkers.tsx'
import { PresentationOverlay } from './ui/PresentationOverlay.tsx'
import { showToast, toastText } from './ui/hooks/useToast.ts'
import { applyTheme, getTheme } from './ui/hooks/useTheme.ts'
import { useBreakpoint } from './ui/hooks/useBreakpoint.ts'
import { useReducedMotion } from './ui/hooks/useReducedMotion.ts'
import { toggleThemeEverywhere } from './ui/themeActions.ts'
import { timeKeyBindings, useAxisAnchors } from './ui/timeMotion.ts'
import { readLayout } from './state/persist.ts'
import { closeOverlay, getOverlay, openOverlay, registerAll, subscribeOverlay, toggleOverlay } from './state/shortcuts.ts'
import type { OverlayId } from './state/shortcuts.ts'
import { initSettings } from './state/slices/settings.ts'
import { readAtlas, subscribeAtlas, useAtlas } from './state/store.ts'
import { getRuntime } from './viewer/runtime.ts'
import { FluorescenceLegend, FluorescencePanel } from './ui/FluorescencePanel.tsx'

// Lazy chunks (spec 2.9, WP-H1). Each of these sheets is closed on arrival and none of them is
// on the path to the first frame, so their code, and the PNG and ZIP writers behind the export
// sheet, leave the initial download. docs/perf/README.md carries the sizes.
//
// The three sheets below load when the overlay registry first opens them and stay mounted after,
// so a second open keeps the form state and costs no round trip.
const ExportDialog = lazy(() => import('./ui/ExportDialog.tsx').then((m) => ({ default: m.ExportDialog })))
const Settings = lazy(() => import('./ui/Settings.tsx').then((m) => ({ default: m.Settings })))
const ShortcutSheet = lazy(() => import('./ui/ShortcutSheet.tsx').then((m) => ({ default: m.ShortcutSheet })))
// The kit sheet keeps effects that run while it is closed (it persists the loaded kit and fills
// in missing thumbnails), so it loads once the viewer reports its first frame (useAfterFirstFrame)
// instead of on the first open.
const KitSheet = lazy(() => import('./ui/KitSheet.tsx').then((m) => ({ default: m.KitSheet })))

export interface AppProps {
  /** Presentation mode (AR-59); overrides the store value (tests). */
  presentation?: boolean
  /** Embed mode (AR-61); overrides the store value (tests). */
  embed?: boolean
  /** Desktop rail collapsed to a 36 px handle (spec 5.1.1); the rail owns later toggles. */
  railCollapsed?: boolean
  /** Info card open; overrides the selection rule (tests). */
  cardOpen?: boolean
  /** Strip placement in presentation mode (UI-37); overrides the store value (tests). */
  strip?: 'bottom' | 'top' | 'hidden'
}

/**
 * Store warnings become error toasts after the first frame (AR-50, AR-69) and are cleared
 * inside the listener, so the StrictMode mount-cleanup-mount cycle shows each once.
 */
function useWarningToasts(): void {
  useEffect(
    () =>
      subscribeAtlas(
        (s) => s.warnings,
        (warnings) => {
          if (warnings.length === 0) return
          for (const text of warnings) showToast(text, { kind: 'error' })
          readAtlas().clearWarnings()
        },
        { fireImmediately: true },
      ),
    [],
  )
}

/** Ctrl+C with a selection copies "name (ZFA id)" per line (5.9.1); a text selection keeps the native copy. */
function copySelection(): boolean {
  const s = readAtlas()
  if (s.selection.length === 0 || !s.data) return false
  if (typeof getSelection === 'function' && getSelection()?.toString()) return false
  const text = s.selection.map((id) => { const r = s.data?.structuresById.get(id); return r ? `${r.name} (${r.id})` : id }).join('\n')
  navigator.clipboard?.writeText(text).then(() => showToast(toastText.copied), () => showToast('Copy failed', { kind: 'error' }))
  return true
}

/**
 * The UI layer of the key dispatcher (UI-41): the time keys with the 200 ms glide of the timeline
 * bar, T through the theme actions that also update the root attribute, and Ctrl+C with its toast.
 */
function useAppShortcuts(): void {
  const anchors = useAxisAnchors()
  const storeReducedMotion = useAtlas((s) => s.reducedMotion)
  const reducedMotion = useReducedMotion() || storeReducedMotion
  useEffect(
    () =>
      registerAll([
        ...timeKeyBindings(anchors, reducedMotion),
        { code: 'KeyT', run: () => toggleThemeEverywhere() },
        { code: 'KeyC', ctrl: true, run: copySelection },
      ]),
    [anchors, reducedMotion],
  )
}

const preventContextMenu = (e: { preventDefault(): void }) => e.preventDefault()

/** A lazy sheet failed to load: drop the open flag, so no overlay stays open with nothing on screen. */
function onSheetError(): void {
  closeOverlay()
  showToast('That panel could not load. Reload the page to try again.', { kind: 'error' })
}

const EXPORT_OVERLAYS: readonly OverlayId[] = ['export', 'share']
const SETTINGS_OVERLAYS: readonly OverlayId[] = ['settings']
const SHORTCUT_OVERLAYS: readonly OverlayId[] = ['shortcuts']

/** The open overlay of src/state/shortcuts.ts, so App mounts a sheet's chunk when it opens. */
function useOverlay(): OverlayId | null {
  return useSyncExternalStore(subscribeOverlay, getOverlay, () => null)
}

/**
 * True once `overlay` has opened at least once. A sheet stays mounted after its first open:
 * unmounting it would drop the form state of the export sheet and pay for the chunk again.
 */
function useOpenedOnce(overlay: OverlayId | null, ids: readonly OverlayId[]): boolean {
  const open = overlay !== null && ids.includes(overlay)
  const [seen, setSeen] = useState(open)
  if (open && !seen) setSeen(true)
  return seen || open
}

/** Longest wait for the ready signal before a deferred chunk loads anyway (no WebGL, a data error). */
const DEFERRED_CHUNK_TIMEOUT_MS = 8000

/**
 * True once the viewer has painted its first frame with final geometry (QP-31), or after
 * DEFERRED_CHUNK_TIMEOUT_MS where no viewer ever becomes ready. A bare requestIdleCallback fired
 * at about 470 ms in one measured run while the first frame was still four seconds away, so the
 * deferred chunk downloaded and parsed on the thread that was building the scene.
 */
function useAfterFirstFrame(): boolean {
  const [ready, setReady] = useState(() => getRuntime().ready)
  useEffect(() => {
    if (ready) return
    const rt = getRuntime()
    const onReady = (): void => setReady(true)
    rt.readyListeners.add(onReady)
    if (rt.ready) onReady()
    const timer = setTimeout(onReady, DEFERRED_CHUNK_TIMEOUT_MS)
    return () => {
      rt.readyListeners.delete(onReady)
      clearTimeout(timer)
    }
  }, [ready])
  return ready
}

/**
 * The layout shell of spec 5.1: top bar, systems rail, viewer, info card, and
 * timeline bar in a grid. Data attributes on the root, read from the store,
 * drive the responsive and mode rules in styles.css.
 */
export function App(props: AppProps) {
  const storePresentation = useAtlas((s) => s.presentation)
  const storeEmbed = useAtlas((s) => s.embed)
  const stripPosition = useAtlas((s) => s.stripPosition)
  const projectorScale = useAtlas((s) => s.projectorScale)
  const hasSelection = useAtlas((s) => s.selection.length > 0)
  const dataError = useAtlas((s) => s.dataError)
  const webgl = useAtlas((s) => s.webgl)
  const breakpoint = useBreakpoint()
  const initialRail = useMemo(() => readLayout().railCollapsed ?? false, [])
  const overlay = useOverlay()
  const wantExport = useOpenedOnce(overlay, EXPORT_OVERLAYS)
  const wantSettings = useOpenedOnce(overlay, SETTINGS_OVERLAYS)
  const wantShortcuts = useOpenedOnce(overlay, SHORTCUT_OVERLAYS)
  const wantKit = useAfterFirstFrame() || overlay === 'kit'

  const presentation = props.presentation ?? storePresentation
  const embed = props.embed ?? storeEmbed
  const railCollapsed = props.railCollapsed ?? initialRail
  // Desktop docks the card and shows the stage card when nothing is selected; every other layout opens it on selection.
  const cardOpen = props.cardOpen ?? (breakpoint === 'desktop' && !presentation && !embed ? true : hasSelection)
  const strip = props.strip ?? stripPosition
  // The preview panel is the overlay 'lab' (review item 9): Escape closes it in the 5.9.1 order,
  // and no second sheet can stand open behind it.
  const showLab = overlay === 'lab' && !presentation && !embed

  useWarningToasts()
  useAppShortcuts()
  useEffect(() => {
    // Sets data-theme when index.html did not (for example in a test harness).
    applyTheme(getTheme(), { persist: false })
    initSettings()
    // A link that carried `lab=1` or `fp` arrives with the panel open. Only the link opens it:
    // a kit that turns the preview on later must not push a sheet over the slide.
    if (readAtlas().labEnabled) openOverlay('lab')
  }, [])

  const viewer = dataError ? (
    <DataErrorCard error={dataError} />
  ) : webgl === 'unavailable' ? (
    <WebglUnavailable />
  ) : (
    <>
      <Viewer />
      {webgl === 'lost' ? <ContextLostNotice onReload={() => location.reload()} /> : null}
    </>
  )

  // UI-36: every presentation size is multiplied by the projector scale setting.
  const style = { '--projector-scale': projectorScale } as CSSProperties

  return (
    <div
      className="app"
      style={style}
      data-presentation={presentation ? 'true' : 'false'}
      data-embed={embed ? 'true' : 'false'}
      data-rail={railCollapsed ? 'collapsed' : 'open'}
      data-card={cardOpen ? 'open' : 'closed'}
      data-strip={presentation ? strip : undefined}
      data-webgl={webgl}
      onContextMenu={presentation ? preventContextMenu : undefined}
    >
      <header className="app-top" aria-label="Top bar">
        <TopBar onOpenSettings={() => toggleOverlay('settings')} />
      </header>
      <aside className="app-rail" aria-label="Systems rail">
        <SystemsRail />
      </aside>
      <main className="app-viewer">{viewer}<FluorescenceLegend /></main>
      {/* The card stays mounted on every breakpoint: it hosts the linked-term hook, the term sync
          and the selection announcement, and the preview sheet floats over it instead of replacing it. */}
      <aside className="app-card" aria-label="Info card">
        <InfoCard />
      </aside>
      <FluorescencePanel open={showLab} onClose={() => closeOverlay('lab')} />
      {webgl === 'unavailable' ? null : (
        <footer className="app-time" aria-label="Timeline bar">
          <TimelineBar globalKeys={false} onOpenShortcuts={() => openOverlay('shortcuts')} />
        </footer>
      )}
      <ToastHost presentation={presentation} />
      <PresentationOverlay />
      <EmbedFooter />
      <KitMarkers />
      {/* One Suspense boundary per sheet: a sheet that is still loading never hides a sheet that is
          mounted. One error boundary around all four: a chunk that never arrives leaves the viewer,
          the rail and the timeline standing instead of blanking the page. */}
      <SheetErrorBoundary onError={onSheetError}>
        <Suspense fallback={null}>{wantKit ? <KitSheet /> : null}</Suspense>
        <Suspense fallback={null}>{wantSettings ? <Settings /> : null}</Suspense>
        <Suspense fallback={null}>{wantShortcuts ? <ShortcutSheet /> : null}</Suspense>
        <Suspense fallback={null}>{wantExport ? <ExportDialog /> : null}</Suspense>
      </SheetErrorBoundary>
      <p id="atlas-live" className="sr-only" aria-live="polite" />
    </div>
  )
}
