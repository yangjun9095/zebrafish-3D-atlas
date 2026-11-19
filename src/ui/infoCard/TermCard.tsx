// The info card in its term state (D17): a ZFA vocabulary term that the atlas does not draw.
// It shows the name, the id with a ZFIN link, the badge, the ZFIN definition, the ZFIN stage
// window, the stand-in chain, the term kind, and "Jump to first appearance" of the stand-in.
import { Copy, ExternalLink, Link, X } from 'lucide-react'
import type { AtlasData } from '../../core/schema.ts'
import { badgeText } from '../../core/vocabulary.ts'
import type { Vocabulary, VocabularyTerm } from '../../core/vocabulary.ts'
import { readAtlas, useAtlas } from '../../state/store.ts'
import type { ZfaId } from '../../state/store.ts'
import { showToast, toastText } from '../hooks/useToast.ts'
import { Badge } from '../primitives/Badge.tsx'
import { Button } from '../primitives/Button.tsx'
import { IconButton } from '../primitives/IconButton.tsx'
import { copyId } from './actions.ts'
import { zfinUrl } from './model.ts'
import { AttributionFooter } from './Sections.tsx'
import { jumpToStandIn, standInNow, standInText, termLink, termWindowText } from './term.ts'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export interface TermCardProps {
  data: AtlasData
  vocab: Vocabulary
  term: VocabularyTerm
  /** false inside the phone sheet, whose header already names the term. */
  showHeader?: boolean
}

async function copyLink(vocab: Vocabulary, termId: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(termLink(vocab, termId))
    showToast(toastText.linkCopied, { kind: 'success' })
  } catch {
    showToast('Copy failed; the browser blocked the clipboard', { kind: 'error' })
  }
}

export function TermCard({ data, vocab, term, showHeader = true }: TermCardProps) {
  const presentation = useAtlas((s) => s.presentation)
  const stand = standInNow(vocab, term)
  const standIn = stand.recordId ? data.structuresById.get(stand.recordId) ?? null : null
  const chain = standInText(stand)

  return (
    <>
      {showHeader ? (
        <header className="info-head">
          <div className="info-head-main">
            <h2 className="info-title">{term.name}</h2>
            <button type="button" className="info-id" title="Copy the ZFA id" onClick={() => void copyId(term.id)}>
              {term.id}
              <Copy {...ICON} />
            </button>
          </div>
          <div className="info-head-actions">
            <IconButton label="Close" shortcut="Esc" size="sm" onClick={() => readAtlas().clearSelection()}>
              <X {...ICON} />
            </IconButton>
          </div>
        </header>
      ) : (
        <button type="button" className="info-id" title="Copy the ZFA id" onClick={() => void copyId(term.id)}>
          {term.id}
          <Copy {...ICON} />
        </button>
      )}
      <div className="info-chips" aria-label="Term">
        <Badge tone={stand.state === 'none' ? 'neutral' : 'accent'} data-testid="term-badge">
          {badgeText(stand, vocab)}
        </Badge>
        <Badge data-testid="term-kind">{term.kind === 'cell' ? 'cell type' : 'structure'}</Badge>
      </div>
      <p className="info-presence" data-kind="term" data-testid="term-standin">
        <span>
          {chain === '' ? 'No record of this atlas contains this term yet.' : chain}
        </span>
      </p>
      <p className="info-caption" data-testid="term-zfin-window">
        {termWindowText(term, data.stages.stages)}
      </p>
      {term.definition ? (
        <p className="info-definition" data-testid="term-definition">
          {term.definition}
        </p>
      ) : (
        <p className="info-caption">ZFA states no definition for this term.</p>
      )}
      <div className="info-actions">
        {standIn ? (
          <Button variant="primary" data-testid="term-jump" onClick={() => jumpToStandIn(vocab, term.id)}>
            Jump to first appearance of {standIn.name}
          </Button>
        ) : null}
        {presentation ? null : (
          <>
            <Button onClick={() => void copyLink(vocab, term.id)}>
              <Link {...ICON} />
              Copy link
            </Button>
            <a className="btn" href={zfinUrl(term.id)} target="_blank" rel="noopener noreferrer" data-testid="term-zfin-link">
              Open in ZFIN
              <ExternalLink {...ICON} />
            </a>
          </>
        )}
      </div>
      {presentation || term.synonyms.length === 0 ? null : (
        <details className="info-details" data-testid="term-synonyms">
          <summary>Synonyms ({term.synonyms.length})</summary>
          <p className="info-note">{term.synonyms.join(', ')}</p>
        </details>
      )}
      {standIn ? (
        <p className="info-caption">
          Highlighted:{' '}
          <button type="button" className="info-id" onClick={() => readAtlas().select(standIn.id as ZfaId)}>
            {standIn.name}
          </button>
        </p>
      ) : null}
      <AttributionFooter />
    </>
  )
}
