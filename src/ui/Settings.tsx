// The settings sheet (spec 5.6 UI-27; UI-13 temperature, UI-36 projector scale, UI-37 strip
// position, D9 sex toggle, UX-VS-06 palette). Opened with `,` or the top bar button; the overlay
// registry of src/state/shortcuts.ts holds the open state so the Escape order can close it.
import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_TEMPERATURE_C, TEMPERATURE_MAX_C, TEMPERATURE_MIN_C } from '../core/format.ts'
import { closeOverlay, getOverlay, subscribeOverlay } from '../state/shortcuts.ts'
import { settingsStore } from '../state/slices/settings.ts'
import type { PaletteMode, SexView } from '../state/slices/settings.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import type { ProjectorScale, Quality, StripPosition, Units } from '../state/store.ts'
import { useTheme } from './hooks/useTheme.ts'
import type { Theme } from './hooks/useTheme.ts'
import { Sheet } from './primitives/Sheet.tsx'
import { Slider } from './primitives/Slider.tsx'
import { Switch } from './primitives/Switch.tsx'
import { setThemeEverywhere } from './themeActions.ts'

interface Option<T extends string | number> { value: T; label: string }

/** A labelled segmented control; the buttons carry aria-pressed. */
function Segmented<T extends string | number>({ label, value, options, onChange, note }: { label: string; value: T; options: readonly Option<T>[]; onChange: (v: T) => void; note?: ReactNode }) {
  return (
    <div className="set-field">
      <div className="set-row">
        <span className="set-label">{label}</span>
        <div className="set-seg" role="group" aria-label={label}>
          {options.map((o) => (
            <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {note ? <span className="set-note">{note}</span> : null}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="set-group" aria-label={title}>
      <h3 className="set-title">{title}</h3>
      {children}
    </section>
  )
}

const THEMES: readonly Option<Theme>[] = [{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]
const PALETTES: readonly Option<PaletteMode>[] = [{ value: 'atlas', label: 'Atlas' }, { value: 'okabeIto', label: 'Okabe-Ito' }]
const UNITS: readonly Option<Units>[] = [{ value: 'hpf', label: 'hpf' }, { value: 'dpf', label: 'dpf' }, { value: 'auto', label: 'auto' }]
const QUALITIES: readonly Option<Quality>[] = [{ value: 'standard', label: 'Standard' }, { value: 'presentation', label: 'Presentation' }]
const SCALES: readonly Option<ProjectorScale>[] = [{ value: 1, label: '1x' }, { value: 1.5, label: '1.5x' }, { value: 2, label: '2x' }]
const STRIPS: readonly Option<StripPosition>[] = [{ value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' }]
const SEXES: readonly Option<SexView>[] = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'both', label: 'Both' }]
/** The UI-13 presets. */
const TEMPERATURES: readonly number[] = [25, DEFAULT_TEMPERATURE_C, 33]

export function Settings() {
  const open = useSyncExternalStore(subscribeOverlay, () => getOverlay() === 'settings', () => false)
  const { theme } = useTheme()
  const palette = useSyncExternalStore(settingsStore.subscribe, () => settingsStore.getState().palette, () => 'atlas' as PaletteMode)
  const sex = useSyncExternalStore(settingsStore.subscribe, () => settingsStore.getState().sex, () => 'female' as SexView)
  const units = useAtlas((s) => s.units)
  const snap = useAtlas((s) => s.snap)
  const temperatureC = useAtlas((s) => s.temperatureC)
  const labels = useAtlas((s) => s.labels)
  const quality = useAtlas((s) => s.quality)
  const reducedMotion = useAtlas((s) => s.reducedMotion)
  const followGrowth = useAtlas((s) => s.followGrowth)
  const keepDorsalUp = useAtlas((s) => s.keepDorsalUp)
  const jumpOnSelect = useAtlas((s) => s.jumpOnSelect)
  const projectorScale = useAtlas((s) => s.projectorScale)
  const stripPosition = useAtlas((s) => s.stripPosition)
  const presentation = useAtlas((s) => s.presentation)
  const relabel = Math.abs(temperatureC - DEFAULT_TEMPERATURE_C) > 1e-9

  return (
    <Sheet open={open} onClose={() => closeOverlay('settings')} title="Settings" side="right" width={400} modal={!presentation} className="set-sheet">
      <div className="settings" data-testid="settings-sheet">
        <Group title="Appearance">
          <Segmented label="Theme" value={theme} options={THEMES} onChange={setThemeEverywhere} />
          <Segmented
            label="Palette"
            value={palette}
            options={PALETTES}
            onChange={(p) => settingsStore.getState().setPalette(p)}
            note="Atlas gives each of the 15 systems its own hue. Okabe-Ito maps them onto 8 colour-blind safe hues; the rail and the card always name the system in text."
          />
          <Switch checked={labels} onChange={(on) => readAtlas().setLabels(on)} label="3D labels" description="Names beside the visible structures (L)" />
          <Segmented label="Quality" value={quality} options={QUALITIES} onChange={(q) => readAtlas().setQuality(q)} note="Presentation adds anti-aliasing and outlines; export ignores it." />
          <Switch checked={reducedMotion} onChange={(on) => readAtlas().setReducedMotion(on)} label="Reduced motion" description="Cuts instead of glides; no playing pulse" />
        </Group>
        <Group title="Time">
          <Segmented label="Units" value={units} options={UNITS} onChange={(u) => readAtlas().setUnits(u)} note="auto shows hpf before 72 hpf and dpf after (U cycles)." />
          <Switch checked={snap} onChange={() => readAtlas().toggleSnap()} label="Snap to stage" description="The thumb settles on stage starts (S)" />
          <div className="set-row set-row-col">
            <Slider
              label="Incubation temperature"
              value={temperatureC}
              min={TEMPERATURE_MIN_C}
              max={TEMPERATURE_MAX_C}
              step={0.5}
              formatValue={(v) => `${v} C`}
              onChange={(v) => readAtlas().setTemperature(v)}
            />
            <div className="set-row">
              <div className="set-seg" role="group" aria-label="Temperature presets">
                {TEMPERATURES.map((c) => (
                  <button key={c} type="button" aria-pressed={Math.abs(temperatureC - c) < 1e-9} onClick={() => readAtlas().setTemperature(c)}>
                    {c} C
                  </button>
                ))}
              </div>
              <input
                key={temperatureC}
                className="set-number"
                type="number"
                aria-label="Incubation temperature in degrees Celsius"
                min={TEMPERATURE_MIN_C}
                max={TEMPERATURE_MAX_C}
                step={0.5}
                defaultValue={temperatureC}
                onChange={(e) => {
                  // Typed digits commit once they form a value in range; blur clamps the rest.
                  const v = Number(e.currentTarget.value)
                  if (Number.isFinite(v) && v >= TEMPERATURE_MIN_C && v <= TEMPERATURE_MAX_C) readAtlas().setTemperature(v)
                }}
                onBlur={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (Number.isFinite(v)) readAtlas().setTemperature(Math.min(TEMPERATURE_MAX_C, Math.max(TEMPERATURE_MIN_C, v)))
                }}
              />
            </div>
            <span className="set-note">
              {relabel
                ? `Times before 72 hpf are relabelled for ${temperatureC} C with the Kimmel formula; the model keeps 28.5 C hours.`
                : 'ZFIN stage times are for 28.5 C. Another temperature relabels the readout before 72 hpf; the model does not change.'}
            </span>
          </div>
        </Group>
        <Group title="Camera">
          <Switch checked={followGrowth} onChange={(on) => readAtlas().setFollowGrowth(on)} label="Follow growth" description="Keeps the body framed as it grows" />
          <Switch checked={keepDorsalUp} onChange={(on) => readAtlas().setKeepDorsalUp(on)} label="Keep dorsal up" description="Limits the orbit so the fish never rolls" />
          <Switch checked={jumpOnSelect} onChange={(on) => readAtlas().setJumpOnSelect(on)} label="Jump to appearance on select" description="Moves time when the selected structure is absent" />
        </Group>
        <Group title="Presentation">
          <Segmented label="Projector scale" value={projectorScale} options={SCALES} onChange={(v) => readAtlas().setProjectorScale(v)} note="Multiplies the readout, card and label sizes on the projector (UI-36)." />
          <Segmented label="Strip position" value={stripPosition} options={STRIPS} onChange={(v) => readAtlas().setStripPosition(v)} note="Top for rooms where heads hide the bottom of the projection." />
        </Group>
        <Group title="Model">
          <Segmented
            label="Sex"
            value={sex}
            options={SEXES}
            onChange={(v) => settingsStore.getState().setSex(v)}
            note="Chooses ovary or testis at the gonad handoff from 25 dpf (D9). Both draws the two records together; a shared link carries female or male."
          />
        </Group>
      </div>
    </Sheet>
  )
}
