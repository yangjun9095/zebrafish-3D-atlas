// The five rail presets (UX-IN-28): All, None, Embryo, Organs, Skeleton as aria-pressed segmented buttons.
import { readAtlas, useAtlas } from '../state/store.ts'
import type { RailPreset } from '../state/store.ts'

const PRESETS: ReadonlyArray<{ id: RailPreset; label: string; title: string }> = [
  { id: 'all', label: 'All', title: 'Show every system' },
  { id: 'none', label: 'None', title: 'Hide every system' },
  { id: 'embryo', label: 'Embryo', title: 'Early embryo, axial, skeletal, skin and pigment' },
  { id: 'organs', label: 'Organs', title: 'Nervous, sensory, cardiovascular, digestive, gills, excretory, reproductive, endocrine, blood' },
  { id: 'skeleton', label: 'Skeleton', title: 'Skeletal only' },
]

export function RailPresets() {
  const current = useAtlas((s) => s.railPreset)
  return (
    <div className="seg seg-sm rail-presets" role="group" aria-label="Visibility presets" data-testid="rail-presets">
      {PRESETS.map((p) => (
        <button key={p.id} type="button" aria-pressed={current === p.id} title={p.title} onClick={() => readAtlas().applyRailPreset(p.id)}>
          {p.label}
        </button>
      ))}
    </div>
  )
}
