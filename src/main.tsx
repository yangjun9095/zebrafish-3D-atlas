// zodConfig comes first: it turns the zod JIT off before any module builds a schema, and
// src/core/urlState.ts builds one at module scope (SEC-03, see src/zodConfig.ts).
import './zodConfig.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { bootstrapData, bootstrapShell } from './bootstrap.ts'
import { installShortcuts } from './state/shortcuts.ts'
import { atlasStore } from './state/store.ts'
import { startUrlSync } from './state/urlSync.ts'
import { StartupErrorCard } from './ui/ErrorScreens.tsx'
import './styles.css'

// AR-07 and AR-50: the URL reaches the store before the first render; the address bar follows the
// store once the records are in. The record chunk is fetched here, before React renders, and the
// shell paints while it is in flight (spec 2.9, src/bootstrap.ts). The two marks bracket the parse
// for the time-to-first-frame procedure of spec 6.5; the rebuild driver adds `atlas:first-frame`
// when the first final-tessellation frame paints (docs/perf/README.md).
performance.mark('atlas:boot')

// Phase 1 runs before React mounts, so a throw here leaves an empty document and no error
// boundary can catch it (SEC-02). bootstrap.ts already falls back to the default view when the
// link cannot be applied; this catch covers the rest of the shell and shows a card instead.
let startupError: string | null = null
try {
  bootstrapShell(atlasStore)
} catch (err) {
  startupError = err instanceof Error ? err.message : String(err)
  console.error('[atlas] the shell failed to start', err)
}

if (startupError === null) {
  // The global key dispatcher of UI-41.
  installShortcuts()
  void bootstrapData(atlasStore)
    .then(() => {
      performance.mark('atlas:data-parsed')
      // The address bar follows the store only after the records have pruned the ids in the link,
      // so a link is never rewritten from a state that has not read it yet (AR-48).
      startUrlSync(atlasStore)
    })
    // The record chunk did not arrive. The shell stays on screen with no anatomy; without this
    // the failure is an unhandled rejection and nothing reports it.
    .catch((err: unknown) => console.error('[atlas] the atlas data failed to load', err))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{startupError === null ? <App /> : <StartupErrorCard message={startupError} />}</StrictMode>,
)
