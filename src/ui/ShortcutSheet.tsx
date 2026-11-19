// The keyboard shortcut sheet (spec 5.9.1): every row of the keyboard map, grouped, opened with `?`
// or the keyboard button of the transport row. A modal sheet in the app, a popover in presentation
// mode (UX-US-07). "Show tips" replays the first-run chips (UX-ST-11).
import { useSyncExternalStore } from 'react'
import { KEYBOARD_MAP, closeOverlay, getOverlay, subscribeOverlay } from '../state/shortcuts.ts'
import type { KeyRow } from '../state/shortcuts.ts'
import { useAtlas } from '../state/store.ts'
import { replayFirstRunHint } from './firstRun.ts'
import { useBreakpoint } from './hooks/useBreakpoint.ts'
import { Button } from './primitives/Button.tsx'
import { Kbd } from './primitives/Kbd.tsx'
import { Sheet } from './primitives/Sheet.tsx'
import { BAR_METRICS } from './timelineGeometry.ts'
import type { BarLayout } from './timelineGeometry.ts'

const GROUPS: readonly KeyRow['group'][] = ['Time', 'View', 'Selection', 'Presentation', 'App']

/** Splits "Shift+←" into its caps; a trailing "+" is the plus key itself. */
function caps(key: string): string[] {
  if (key === '+') return ['+']
  if (key.endsWith('++')) return [...caps(key.slice(0, -2)), '+']
  return key.split('+')
}

function KeyCaps({ keys }: { keys: readonly string[] }) {
  return (
    <span className="keys-caps">
      {keys.map((k, i) => (
        <span key={`${k}-${i}`} className="keys-cap">
          {i > 0 ? <span className="keys-or" aria-hidden="true"> / </span> : null}
          <Kbd keys={caps(k)} />
        </span>
      ))}
    </span>
  )
}

export function ShortcutSheet() {
  const open = useSyncExternalStore(subscribeOverlay, () => getOverlay() === 'shortcuts', () => false)
  const presentation = useAtlas((s) => s.presentation)
  const embed = useAtlas((s) => s.embed)
  const breakpoint = useBreakpoint()
  const close = () => closeOverlay('shortcuts')
  // Only the desktop timeline draws the event row, so the key that opens an event list is listed
  // only there; TimelineBar picks the same layout.
  const layout: BarLayout = presentation ? 'presentation' : embed ? 'tablet' : breakpoint
  const rows = KEYBOARD_MAP.filter((r) => !r.needsEventRow || BAR_METRICS[layout].eventRow > 0)
  return (
    <Sheet open={open} onClose={close} title="Keyboard shortcuts" side="right" width={440} modal={!presentation} className="keys-sheet">
      <div className="keys" data-testid="shortcut-sheet">
        <p className="keys-intro">
          Single keys without modifiers, so a presenter remote mapped to the arrow keys works. Shortcuts pause while a text field has
          focus.
        </p>
        {GROUPS.map((g) => (
          <section key={g} className="keys-group" aria-labelledby={`keys-${g}`}>
            <h3 id={`keys-${g}`} className="keys-title">{g}</h3>
            <dl className="keys-list">
              {rows.filter((r) => r.group === g).map((r) => (
                <div key={r.action} className="keys-row">
                  <dt><KeyCaps keys={r.keys} /></dt>
                  <dd>{r.action}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {!presentation && !embed ? (
          <div className="keys-actions">
            <Button
              size="sm"
              onClick={() => {
                close()
                replayFirstRunHint()
              }}
            >
              Show tips
            </Button>
          </div>
        ) : null}
      </div>
    </Sheet>
  )
}
