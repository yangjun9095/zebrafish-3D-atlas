// One system in the rail: the 36 px row (UX-LY-04, UI-15) and the 44 px grid cell (UI-43).
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import {
  Activity, Bone, Box, Brain, CircleDot, Dna, Droplet, Droplets, Egg, Eye, EyeOff, Flag, Heart, Ruler, Shield, Waves, Wind,
} from 'lucide-react'
import type { SystemRecord } from '../core/schema.ts'
import { lightnessOf } from '../core/palette.ts'
import { Badge } from './primitives/Badge.tsx'
import { Tooltip } from './primitives/Tooltip.tsx'
import type { PaletteMode } from '../core/palette.ts'
import { countLabel, swatchNeedsOutline, systemSwatch } from './railModel.ts'
import type { SystemCounts } from './railModel.ts'

type IconComponent = typeof Brain

/** lucide components for the icon names in systems.json (UX-VS-08, UI-15). */
const ICONS: Record<string, IconComponent> = {
  activity: Activity, bone: Bone, box: Box, brain: Brain, 'circle-dot': CircleDot, dna: Dna, droplet: Droplet, droplets: Droplets,
  egg: Egg, eye: Eye, flag: Flag, heart: Heart, ruler: Ruler, shield: Shield, waves: Waves, wind: Wind,
}

export interface SystemRowProps {
  system: SystemRecord
  counts: SystemCounts
  hidden: boolean
  theme: 'dark' | 'light'
  palette?: PaletteMode
  /** The active row of the listbox (UI-19). */
  active?: boolean
  id?: string
  /** Alt+click solos (UX-IN-27). */
  onToggle: (solo: boolean) => void
  onActivate?: () => void
}

function SystemIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? CircleDot
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />
}

export function SystemRow({ system, counts, hidden, theme, palette = 'atlas', active = false, id, onToggle, onActivate }: SystemRowProps) {
  const swatch = systemSwatch(system, theme, palette)
  const outline = swatchNeedsOutline(system, theme, palette)
  const onEye = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onToggle(e.altKey)
  }
  const onEyeKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    // Space and Enter on the button fire click; stop them from reaching the listbox handler.
    if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
  }
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      className="sys-row"
      data-system={system.id}
      data-hidden={hidden ? 'true' : 'false'}
      onClick={onActivate}
    >
      <span className="sys-dot" data-outline={outline ? 'true' : 'false'} style={{ background: swatch }} aria-hidden="true" />
      <SystemIcon name={system.icon} className="sys-icon" />
      <span className="sys-name">{system.displayName}</span>
      <Badge title={`${counts.present} present at this time of ${counts.total} modelled`}>{countLabel(counts)}</Badge>
      <Tooltip label={hidden ? `Show ${system.displayName}` : `Hide ${system.displayName}`} shortcut="Alt+click solos">
        <button
          type="button"
          className="btn btn-ghost iconbtn iconbtn-sm sys-eye"
          aria-label={`${hidden ? 'Show' : 'Hide'} ${system.displayName}`}
          aria-pressed={!hidden}
          onClick={onEye}
          onKeyDown={onEyeKey}
        >
          {hidden ? <EyeOff strokeWidth={1.75} aria-hidden="true" /> : <Eye strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </Tooltip>
    </li>
  )
}

export interface SystemCellProps {
  system: SystemRecord
  counts: SystemCounts
  hidden: boolean
  theme: 'dark' | 'light'
  palette?: PaletteMode
  onToggle: (solo: boolean) => void
}

/** A 44 px swatch cell: the icon on the system colour; a hidden system shows the icon at 45 percent with a strike. */
export function SystemCell({ system, counts, hidden, theme, palette = 'atlas', onToggle }: SystemCellProps) {
  const swatch = systemSwatch(system, theme, palette)
  const outline = swatchNeedsOutline(system, theme, palette)
  const label = `${system.displayName}, ${countLabel(counts)}`
  return (
    <Tooltip label={label} shortcut="Alt+click solos">
      <button
        type="button"
        className="sys-cell"
        aria-label={label}
        aria-pressed={!hidden}
        data-system={system.id}
        data-outline={outline ? 'true' : 'false'}
        style={{ background: swatch, '--swatch': swatch, color: lightnessOf(swatch) > 60 ? '#0E1116' : '#F5F6F7' } as CSSProperties}
        onClick={(e) => onToggle(e.altKey)}
      >
        <SystemIcon name={system.icon} />
      </button>
    </Tooltip>
  )
}
