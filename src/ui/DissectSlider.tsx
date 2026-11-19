// The dissect slider (D17): 0 to 100 in steps of 5. Up to 60 percent the systems slide out of
// the body along their own directions; above it they pack into the inventory grid beside the
// fish. D steps 0, 30, 60, 100 and Shift+D steps back. The reset button returns to 0.
import { RotateCcw } from 'lucide-react'
import { readAtlas, useAtlas } from '../state/store.ts'
import { IconButton } from './primitives/IconButton.tsx'
import { Slider } from './primitives/Slider.tsx'

export function DissectSlider() {
  const dissect = useAtlas((s) => s.dissect)
  return (
    <div className="section-row" data-testid="dissect-slider">
      <Slider
        label="Dissect"
        value={dissect}
        min={0}
        max={100}
        step={5}
        formatValue={(v) => `${v}%`}
        onChange={(v) => readAtlas().setDissect(v)}
        className="dissect-slider"
      />
      <IconButton
        label="Reset dissect"
        size="sm"
        disabled={dissect === 0}
        onClick={() => readAtlas().setDissect(0)}
      >
        <RotateCcw strokeWidth={1.75} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
