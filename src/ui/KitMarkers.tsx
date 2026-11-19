// Bookmark markers on the timeline track (spec 5.12, UI-39): one 8 px diamond in --focus per
// bookmark at hpfToTrack(bookmark.t); the current one is filled, the others outlined. The bar
// exposes no marker slot, so the markers portal into the track element and follow it through the
// strip hide of UI-37. A click steps to the bookmark with the AR-60 motion.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatTime } from '../core/format.ts'
import { hpfToTrack } from '../core/timeAxis.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import { blurAfterPointer } from './timelineGeometry.ts'
import { useAxisAnchors } from './timeMotion.ts'

const TRACK_SELECTOR = '.tl-track[data-testid="timeline-track"]'

/** The track element; re-queried when the DOM changes, since the bar mounts after the data parses. */
function useTrackElement(): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const find = () => setEl((cur) => (cur && cur.isConnected ? cur : document.querySelector<HTMLElement>(TRACK_SELECTOR)))
    find()
    const observer = new MutationObserver(find)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return el
}

const MARKER_CSS = `
.kit-markers { position: absolute; left: 0; right: 0; top: calc(var(--track-top, 28px) - 12px); height: 12px; pointer-events: none; }
.kit-marker {
  position: absolute; top: -6px; width: 24px; height: 24px; margin-left: -12px; padding: 0; border: 0; background: none;
  display: grid; place-items: center; color: var(--focus); cursor: pointer; pointer-events: auto; border-radius: 4px;
}
.kit-marker svg { width: 10px; height: 10px; overflow: visible; }
.kit-marker path { fill: none; stroke: currentColor; stroke-width: 1.25; }
.kit-marker[data-current="true"] path { fill: currentColor; }
.kit-marker:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
.kit-marker::after {
  content: attr(data-name); position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%);
  padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface); color: var(--text);
  font: 400 12px/1.4 var(--font-sans); white-space: nowrap; opacity: 0; pointer-events: none;
}
.kit-marker:hover::after, .kit-marker:focus-visible::after { opacity: 1; }
.app[data-presentation="true"] .kit-marker::after { font-size: var(--pres-label); }
.tl[data-layout="phone"] .kit-markers { top: 0; }
`

export function KitMarkers() {
  const kit = useAtlas((s) => s.kit)
  const units = useAtlas((s) => s.units)
  const anchors = useAxisAnchors()
  const track = useTrackElement()
  if (!kit || kit.bookmarks.length === 0 || !track) return null
  return createPortal(
    <div className="kit-markers" data-kit-markers="" role="group" aria-label="Bookmarks">
      <style>{MARKER_CSS}</style>
      {kit.bookmarks.map((b, i) => {
        const current = i === kit.index
        return (
          <button
            key={i}
            type="button"
            className="kit-marker"
            data-kit-marker=""
            data-index={i}
            data-current={current ? 'true' : 'false'}
            data-name={b.name}
            aria-current={current ? 'true' : undefined}
            aria-label={`Bookmark ${i + 1}: ${b.name}, ${formatTime(b.t, units)}`}
            style={{ left: `${(hpfToTrack(b.t, anchors) * 100).toFixed(3)}%` }}
            onClick={(e) => {
              readAtlas().goToBookmark(i)
              blurAfterPointer(e)
            }}
          >
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 1 L9 5 L5 9 L1 5 Z" />
            </svg>
          </button>
        )
      })}
    </div>,
    track,
  )
}
