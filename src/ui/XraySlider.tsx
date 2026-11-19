// The x-ray slider (UX-IN-17): 0 to 100 in steps of 5; X toggles between 0 and the last value.
import { readAtlas, useAtlas } from '../state/store.ts'
import { Slider } from './primitives/Slider.tsx'

export function XraySlider() {
  const xray = useAtlas((s) => s.xray)
  return (
    <Slider
      label="X-ray"
      value={xray}
      min={0}
      max={100}
      step={5}
      formatValue={(v) => `${v}%`}
      onChange={(v) => readAtlas().setXray(v)}
      className="xray-slider"
    />
  )
}
