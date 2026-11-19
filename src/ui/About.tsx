import { useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import { ATTRIBUTION_FILE, EMBEDDED_ATTRIBUTION_ID, EMBEDDED_NOTICES_ID, NOTICES_FILE } from '../core/attribution.ts'
import { Sheet } from './primitives/Sheet.tsx'

export interface AboutProps {
  /** ZFA and ZFS release date from the ontology header (D14). */
  ontologyRelease?: string
  repositoryUrl?: string
}

export const REPOSITORY_URL = 'https://github.com/yangjun9095/zebrafish-3D-atlas'
const STAGES_URL = 'https://zfin.org/zf_info/zfbook/stages/index.html'
const ZFIN_TERMS_URL = 'https://zfin.atlassian.net/wiki/spaces/general/pages/1942160112'
const CC_BY_4_URL = 'https://creativecommons.org/licenses/by/4.0/'
const CC_BY_3_URL = 'https://creativecommons.org/licenses/by/3.0/'

const NOTICE_TEXT: CSSProperties = { margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: '400 12px/1.5 var(--font-mono)' }

function Ext({ href, children }: { href: string; children: string }) {
  return (
    <a className="link" href={href} target="_blank" rel="noreferrer">
      {children} <ExternalLink aria-hidden="true" size={12} strokeWidth={1.75} />
    </a>
  )
}

/** The text of the block scripts/bundle.ts embedded, or null when the page has its files beside it. */
function embeddedText(id: string): string | null {
  if (typeof document === 'undefined') return null
  const text = document.getElementById(id)?.textContent ?? ''
  return text.trim() === '' ? null : text
}

export interface NoticeLinkProps {
  /** A file beside index.html: ATTRIBUTION_FILE or NOTICES_FILE. */
  file: string
  /** Id of the block that carries the same text inside the single-file demo. */
  embeddedId: string
  /** Title of the panel that shows the embedded text. */
  title: string
  label: string
  className?: string
  icon?: boolean
}

/**
 * Links a notice file, and opens the embedded copy in a panel instead when the page travels as
 * one file (L-06). CC BY 4.0, CC BY 3.0 and MIT each ask for the notice in every copy, and the
 * demo has no file beside it.
 */
export function NoticeLink({ file, embeddedId, title, label, className, icon = false }: NoticeLinkProps) {
  const [text, setText] = useState<string | null>(null)
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    const embedded = embeddedText(embeddedId)
    if (embedded === null) return
    e.preventDefault()
    setText(embedded)
  }
  return (
    <>
      <a className={className} href={`${import.meta.env.BASE_URL}${file}`} target="_blank" rel="noreferrer" onClick={open}>
        {label}
        {icon ? <ExternalLink aria-hidden="true" size={12} strokeWidth={1.75} /> : null}
      </a>
      {text === null ? null : (
        <Sheet open onClose={() => setText(null)} title={title} side="right" width={560} modal={false}>
          <pre style={NOTICE_TEXT}>{text}</pre>
        </Sheet>
      )}
    </>
  )
}

/** The About text (UX-ST-12): three facts, the build disclosure, an attribution line, and the links. */
export function About({ ontologyRelease = '2026-07-16', repositoryUrl = REPOSITORY_URL }: AboutProps) {
  return (
    <div className="about">
      <p>
        The Zebrafish 3D Atlas shows one schematic fish at one time point from the 1-cell zygote to the adult. Every
        shape is procedural and placed in a body frame; it is not a measured mesh. Stage timings are for 28.5 C from
        ZFIN. Definitions and stage windows come from the Zebrafish Anatomy Ontology (ZFA) and the Zebrafish Stage
        Ontology (ZFS), release {ontologyRelease}. This is a teaching aid built from schematic, estimated geometry. It
        is not a validated model for quantitative research.
      </p>
      <p>
        The author built this atlas over three days with AI coding agents (Claude Code) working under his direction
        and review. The agents wrote the application code, the data records and the research notes; the author set the
        scope, chose the sources and reviewed each change. No independent anatomist has reviewed the geometry.
      </p>
      <p>
        This is a personal project by a scientist at Chan Zuckerberg Biohub San Francisco. It is not a CZ Biohub
        product, and neither CZ Biohub nor ZFIN has reviewed or endorsed it.
      </p>
      <p className="about-attrib">
        Definitions and stages: ZFIN, used under licence. The ZFA and ZFS ontology files are CC BY 3.0; ZFIN database
        content, including the stage table, is CC BY 4.0 under the ZFIN terms of use. ZFIN supplies the vocabulary,
        not the geometry. Code: MIT, with the licences of the bundled packages in the third-party notices. Geometry is
        schematic.
      </p>
      <ul className="about-links">
        <li>
          <Ext href={repositoryUrl}>Repository</Ext>
        </li>
        <li>
          <NoticeLink
            file={ATTRIBUTION_FILE}
            embeddedId={EMBEDDED_ATTRIBUTION_ID}
            title="Attribution"
            label="Attribution "
            className="link"
            icon
          />
        </li>
        <li>
          <NoticeLink
            file={NOTICES_FILE}
            embeddedId={EMBEDDED_NOTICES_ID}
            title="Third-party notices"
            label="Third-party notices "
            className="link"
            icon
          />
        </li>
        <li>
          <Ext href={STAGES_URL}>ZFIN staging table</Ext>
        </li>
        <li>
          <Ext href={ZFIN_TERMS_URL}>ZFIN terms of use</Ext>
        </li>
        <li>
          <Ext href={CC_BY_4_URL}>CC BY 4.0</Ext>
        </li>
        <li>
          <Ext href={CC_BY_3_URL}>CC BY 3.0</Ext>
        </li>
      </ul>
    </div>
  )
}

export interface AboutSheetProps extends AboutProps {
  open: boolean
  onClose: () => void
}

/** The About text inside a right-hand sheet. */
export function AboutSheet({ open, onClose, ...rest }: AboutSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="About the Zebrafish 3D Atlas" side="right" width={400}>
      <About {...rest} />
    </Sheet>
  )
}
