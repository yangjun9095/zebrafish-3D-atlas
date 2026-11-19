// The six view preset buttons of D4 (spec 5.6, 5.7.2) with aria-pressed; keys live in topBarKeys.ts.
import { readAtlas, useAtlas } from '../state/store.ts'
import type { ViewPreset } from '../state/store.ts'
import { Tooltip } from './primitives/Tooltip.tsx'
import { blurAfterPointer } from './timelineGeometry.ts'
import { VIEW_PRESETS } from './topBarKeys.ts'

export interface ViewPresetsProps {
  /** Subset to render, in D4 order; the tablet bar shows Lateral, Dorsal and Three-quarter (UI-28). */
  only?: readonly ViewPreset[]
}

export function ViewPresets({ only }: ViewPresetsProps) {
  const current = useAtlas((s) => s.viewPreset)
  const list = only ? VIEW_PRESETS.filter((p) => only.includes(p.id)) : VIEW_PRESETS
  return (
    <div className="seg presets" role="group" aria-label="View presets" data-testid="view-presets">
      {list.map((p) => (
        <Tooltip key={p.id} label={p.name} shortcut={p.key}>
          <button
            type="button"
            aria-label={p.name}
            aria-pressed={current === p.id}
            data-preset={p.id}
            onClick={(e) => {
              readAtlas().setViewPreset(p.id)
              blurAfterPointer(e)
            }}
          >
            {p.short}
          </button>
        </Tooltip>
      ))}
    </div>
  )
}
