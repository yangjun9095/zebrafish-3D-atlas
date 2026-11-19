// Playback clock (AR-15, D7): advances `time` once per frame while `playing` is
// true, in track distance so 1x crosses the track in 60 s. The one setState
// writer inside the frame loop; every other callback reads with getState().
// The timeline's rAF loop (ui/timeMotion.ts) runs only while the viewer is absent.
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { advance } from '../core/playback.ts'
import { AXIS_ANCHORS, anchorsFromSegments } from '../core/timeAxis.ts'
import { readAtlas, useAtlas } from '../state/store.ts'

/** Largest step taken from one frame, so a tab switch does not skip the track. */
const MAX_DT_S = 0.1

export function Clock() {
  const data = useAtlas((s) => s.data)
  const anchors = useMemo(() => {
    if (!data) return AXIS_ANCHORS
    try {
      return anchorsFromSegments(data.stages.timeAxis.segments)
    } catch {
      return AXIS_ANCHORS
    }
  }, [data])
  useFrame((_, dt) => {
    const s = readAtlas()
    if (!s.playing) return
    const { hpf } = advance(s.time, s.speed, Math.min(dt, MAX_DT_S), anchors)
    s.setTime(hpf)
  })
  return null
}
