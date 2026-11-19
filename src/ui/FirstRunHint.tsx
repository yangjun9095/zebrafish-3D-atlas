// The first-run hint (UX-ST-11): three chips over the viewer after the first frame on a first
// visit. They fade after 6 s or on the first interaction and never return; "Show tips" replays them.
import { useCallback, useEffect, useState } from 'react'
import { ArrowDownLeft, Hand, Orbit } from 'lucide-react'
import { isFirstRun, markFirstRunDone } from '../state/persist.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import { onReplayFirstRunHint, urlAllowsHint } from './firstRun.ts'

const FADE_AFTER_MS = 6000
const READY_TIMEOUT_MS = 20000

interface Chip {
  id: string
  text: string
  left: number
  top: number
  icon: 'orbit' | 'scrub' | 'click'
}

function viewerReady(): boolean {
  const el = document.querySelector('[data-atlas-ready]')
  const v = el?.getAttribute('data-atlas-ready')
  return v === '1' || v === 'true'
}

function placeChips(): Chip[] {
  const app = document.querySelector('.app')?.getBoundingClientRect()
  const viewer = document.querySelector('.app-viewer')?.getBoundingClientRect()
  const thumb = document.querySelector('[data-timeline-thumb]')?.getBoundingClientRect()
  if (!app || !viewer) return []
  const cx = viewer.left - app.left + viewer.width / 2
  const cy = viewer.top - app.top + viewer.height / 2
  const chips: Chip[] = [
    { id: 'orbit', text: 'Drag to orbit', left: cx + 48, top: cy + 56, icon: 'orbit' },
    { id: 'click', text: 'Click a structure', left: viewer.left - app.left + viewer.width * 0.32, top: cy - 96, icon: 'click' },
  ]
  if (thumb) chips.push({ id: 'scrub', text: 'Scrub time', left: thumb.left - app.left, top: thumb.top - app.top - 44, icon: 'scrub' })
  return chips
}

export function FirstRunHint() {
  const presentation = useAtlas((s) => s.presentation)
  const embed = useAtlas((s) => s.embed)
  const [chips, setChips] = useState<Chip[]>([])
  const [shown, setShown] = useState(false)

  const start = useCallback(() => {
    setChips(placeChips())
    setShown(true)
    markFirstRunDone()
  }, [])

  useEffect(() => onReplayFirstRunHint(start), [start])

  useEffect(() => {
    if (presentation || embed || readAtlas().data === null) return
    if (!isFirstRun() || !urlAllowsHint(location.search)) return
    const t0 = Date.now()
    const poll = setInterval(() => {
      if (viewerReady()) {
        clearInterval(poll)
        start()
      } else if (Date.now() - t0 > READY_TIMEOUT_MS) clearInterval(poll)
    }, 250)
    return () => clearInterval(poll)
  }, [presentation, embed, start])

  useEffect(() => {
    if (!shown) return
    const hide = () => setShown(false)
    const timer = setTimeout(hide, FADE_AFTER_MS)
    window.addEventListener('pointerdown', hide, { once: true })
    window.addEventListener('keydown', hide, { once: true })
    window.addEventListener('wheel', hide, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', hide)
      window.removeEventListener('keydown', hide)
      window.removeEventListener('wheel', hide)
    }
  }, [shown])

  if (chips.length === 0) return null
  return (
    <>
      {chips.map((c) => (
        <div key={c.id} className="frh-chip" data-shown={shown ? 'true' : 'false'} style={{ left: c.left, top: c.top }} aria-hidden="true">
          {c.icon === 'orbit' ? <Orbit size={16} strokeWidth={1.75} /> : c.icon === 'scrub' ? <Hand size={16} strokeWidth={1.75} /> : <ArrowDownLeft size={16} strokeWidth={1.75} />}
          {c.text}
        </div>
      ))}
    </>
  )
}
