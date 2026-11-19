// The "nothing visible" hint (UX-ST-04): a centred line with two buttons when every present
// structure is hidden, or nothing is present at t. Presentation and embed mode show no hint.
import { formatTime } from '../core/format.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import type { AtlasStore } from '../state/store.ts'

/** True when no drawn structure would be visible at t (hidden systems and structures, isolate). */
function nothingVisible(s: Pick<AtlasStore, 'data' | 'presentIds' | 'hiddenSystems' | 'hiddenStructures' | 'isolate' | 'selection'>): boolean {
  const data = s.data
  if (!data) return false
  return !s.presentIds.some((id) => {
    const r = data.structuresById.get(id)
    if (!r || !r.geometry) return false
    if (s.hiddenStructures.includes(id) || s.hiddenSystems.includes(r.system)) return false
    if (s.isolate && s.selection.length > 0 && !s.selection.includes(id)) return false
    return true
  })
}

const box = {
  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 5,
  display: 'grid', gap: 12, justifyItems: 'center', padding: '16px 20px', borderRadius: 12,
  border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--elev-floating)',
  font: '400 14px/1.4 var(--font-sans)', textAlign: 'center', maxWidth: 360,
} as const

export function EmptyHint() {
  const shown = useAtlas((s) => !s.presentation && !s.embed && s.webgl === 'ok' && nothingVisible(s))
  const timeText = useAtlas((s) => (shown ? formatTime(s.time, s.units) : ''))
  if (!shown) return null
  return (
    <div className="viewer-hint" role="status" data-testid="viewer-empty-hint" style={box}>
      <span>Nothing is visible at {timeText}. Show a system from the rail or jump to 24 hpf.</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-primary" onClick={() => readAtlas().applyRailPreset('all')}>Show all</button>
        <button type="button" className="btn" onClick={() => readAtlas().setTime(24)}>Jump to 24 hpf</button>
      </div>
    </div>
  )
}
