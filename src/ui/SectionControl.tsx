// The section plane control (UX-IN-18): Off, Sagittal, Frontal, Transverse; a position slider from
// -1 to +1 on the plane's normal axis; a flip button that keeps the other part.
//
// The plane is one world-space plane on the body, so it cannot follow a structure the dissect
// slider has moved out of the body (D17). The whole control is disabled above dissect 0, and the
// store turns the section off when the slider leaves 0.
import { FlipHorizontal } from 'lucide-react'
import { readAtlas, useAtlas, useAtlasShallow } from '../state/store.ts'
import type { SectionAxis } from '../state/store.ts'
import { IconButton } from './primitives/IconButton.tsx'
import { Slider } from './primitives/Slider.tsx'

const AXES: ReadonlyArray<{ id: SectionAxis | null; label: string; title: string }> = [
  { id: null, label: 'Off', title: 'No section' },
  { id: 'sagittal', label: 'Sagittal', title: 'Sagittal: +1 left surface to -1 right surface' },
  { id: 'frontal', label: 'Frontal', title: 'Frontal (horizontal): +1 dorsal surface to -1 ventral surface' },
  { id: 'transverse', label: 'Transverse', title: 'Transverse: -1 snout to +1 tail' },
]

const DISSECT_NOTE = 'The section plane is off while the dissect slider is above 0'

export function SectionControl() {
  const section = useAtlasShallow((s) => s.section)
  const dissected = useAtlas((s) => s.dissect) > 0
  const off = section.axis === null || dissected
  return (
    <div data-testid="section-control" data-disabled={dissected ? 'true' : 'false'}>
      <div className="seg seg-sm" role="group" aria-label="Section plane">
        {AXES.map((a) => (
          <button
            key={a.label}
            type="button"
            aria-pressed={section.axis === a.id}
            title={dissected ? DISSECT_NOTE : a.title}
            disabled={dissected}
            onClick={() => readAtlas().setSection({ axis: a.id })}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="section-row">
        <Slider
          label="Section position"
          hideLabel
          value={section.position}
          min={-1}
          max={1}
          step={0.05}
          disabled={off}
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => readAtlas().setSection({ position: v })}
        />
        <IconButton label="Flip section" size="sm" aria-pressed={section.flip} disabled={off} onClick={() => readAtlas().setSection({ flip: !section.flip })}>
          <FlipHorizontal strokeWidth={1.75} aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  )
}
