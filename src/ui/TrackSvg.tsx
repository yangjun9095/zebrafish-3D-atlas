// The static layer of the track: period bands, ticks, headline labels and event markers in one
// SVG (spec 5.2.3 to 5.2.6). It re-renders only when the width, the data or the layout changes.
import { memo } from 'react'
import type { DrawnTick } from '../core/timeAxis.ts'
import type { BandBox, BarMetrics, EventMarker, HeadlineLabelBox } from './timelineGeometry.ts'

export interface TrackSvgProps {
  width: number
  metrics: BarMetrics
  bands: readonly BandBox[]
  ticks: readonly DrawnTick[]
  labels: readonly HeadlineLabelBox[]
  markers: readonly EventMarker[]
  /** Period labels sit inside the bands on phone (UI-04). */
  labelsInside: boolean
  onPeriodClick: (hpf: number) => void
}

function diamond(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`
}

export const TrackSvg = memo(function TrackSvg({ width, metrics, bands, ticks, labels, markers, labelsInside, onPeriodClick }: TrackSvgProps) {
  const fillTop = metrics.labelRow + metrics.hitPad
  const fillBottom = fillTop + metrics.fill
  const height = metrics.labelRow + metrics.trackRow + metrics.eventRow + 2 * metrics.hitPad
  const eventY = fillTop + metrics.trackRow + metrics.eventRow / 2
  const labelY = fillTop - 8
  return (
    <svg className="tl-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <rect className="tl-bg" x={0} y={fillTop} width={width} height={metrics.fill} />
      {bands.map((b) => (
        <g key={b.period.id}>
          <rect className="tl-band" data-id={b.period.id} x={b.x} y={fillTop} width={b.width} height={metrics.fill} fill={b.period.color} />
          <rect className="tl-band-top" x={b.x} y={fillTop} width={b.width} height={2} fill={b.period.color} />
          {b.label ? (
            <text
              className="tl-pl"
              data-inside={labelsInside ? 'true' : 'false'}
              data-dark={b.darkText ? 'true' : 'false'}
              x={b.x + 6}
              y={labelsInside ? fillTop + metrics.fill / 2 + 3.5 : labelY}
              fontSize={metrics.labelPx}
              onClick={() => onPeriodClick(b.period.startHpf)}
            >
              {b.abbreviated ? <title>{b.fullLabel}</title> : null}
              {b.label}
            </text>
          ) : null}
        </g>
      ))}
      {ticks.map((t) => {
        const len = t.rank === 'period' ? 10 : 6
        return (
          <g key={`${t.hpf}-${t.rank}`}>
            <line className="tl-tick" data-rank={t.rank} x1={t.xPx} x2={t.xPx} y1={fillBottom} y2={fillBottom + len} />
            <rect className="tl-tick-hit" data-hpf={t.hpf} x={t.xPx - 6} y={fillBottom} width={12} height={Math.max(len, 10)} />
          </g>
        )
      })}
      {metrics.headlineLabels
        ? labels
            .filter((l) => l.visible)
            .map((l) => (
              <text key={l.tick.hpf} className="tl-hl" x={l.tick.xPx} y={fillBottom + 16} textAnchor={l.anchor}>
                {l.tick.label}
              </text>
            ))
        : null}
      {metrics.eventRow > 0
        ? markers.map((m) => {
            const merged = m.events.length > 1
            const r = merged ? 3 : 2
            return (
              <g key={m.events[0].id}>
                <path className="tl-ev" data-marker={m.events[0].id} data-estimate={m.estimate ? 'true' : 'false'} d={diamond(m.x, eventY, r)} />
                {merged ? (
                  <text className="tl-ev-count" x={m.x + r + 2} y={eventY + 3}>
                    {m.events.length}
                  </text>
                ) : null}
                <rect className="tl-ev-hit" data-marker={m.events[0].id} x={m.x - 6} y={eventY - 6} width={12 + (merged ? 8 : 0)} height={12} />
              </g>
            )
          })
        : null}
    </svg>
  )
})
