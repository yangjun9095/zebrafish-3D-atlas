// The eleven-record fixture of WP-02 as a module. With VITE_ATLAS_FIXTURE=1 the alias in
// vite.config.ts swaps src/data/structures/all.ts for this file (spec 6.8.2, WP-05).
import fixture from './structures.fixture.json' with { type: 'json' }

export const structuresRaw: unknown[] = fixture
