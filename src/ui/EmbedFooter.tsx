// Embed-mode footer (spec 2.8 AR-61, research 07 UX-EX-10): a 28 px strip at the bottom right with
// "Open in Zebrafish Atlas", whose link carries the full serialised state, the schematic caveat
// (review C-12) and the ZFIN attribution. The embed is the copy that travels into another slide,
// so it is the copy that most needs the caveat.
import { useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import { serializeUrl } from '../core/urlState.ts'
import { readAtlas, useAtlas } from '../state/store.ts'

/** The app URL for the current state without the embed flag; the theme is included as in a copied link (AR-49). */
function atlasUrlForEmbed(): string {
  const query = serializeUrl({ ...readAtlas().toUrl({ includeTheme: true }), embed: 0 })
  const base = typeof location === 'undefined' ? '/' : `${location.origin}${location.pathname}`
  return query ? `${base}?${query}` : base
}

export function EmbedFooter() {
  const embed = useAtlas((s) => s.embed)
  const ref = useRef<HTMLAnchorElement>(null)
  // The href follows the store lazily: it is refreshed when the pointer or focus reaches the link.
  const refresh = () => {
    if (ref.current) ref.current.href = atlasUrlForEmbed()
  }
  if (!embed) return null
  return (
    <div className="embed-footer" data-testid="embed-footer">
      <a ref={ref} className="embed-link" href={atlasUrlForEmbed()} target="_blank" rel="noreferrer" onPointerEnter={refresh} onPointerDown={refresh} onFocus={refresh}>
        Open in Zebrafish Atlas <ExternalLink aria-hidden="true" size={12} strokeWidth={1.75} />
      </a>
      <span className="embed-attrib">Schematic model. Definitions and stages: ZFIN, CC BY 4.0</span>
    </div>
  )
}
