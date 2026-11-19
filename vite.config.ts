import { fileURLToPath } from 'node:url'
import { defineConfig, type AliasOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE_PATH is "/zebrafish-3D-atlas/" on GitHub Pages and "/" elsewhere (QP-06).
const base = process.env.VITE_BASE_PATH ?? '/'

// VITE_ATLAS_FIXTURE=1 swaps src/data/structures/all.ts for the eleven-record fixture module
// of WP-02, so the viewer tests run before the seed exists (spec 6.8.2, WP-05).
const fixtureAlias: AliasOptions =
  process.env.VITE_ATLAS_FIXTURE === '1'
    ? [
        {
          find: /^\.\/structures\/all\.ts$/,
          replacement: fileURLToPath(new URL('./tests/fixtures/structures.fixture.ts', import.meta.url)),
        },
      ]
    : []

// VITE_SINGLE_FILE=1 builds one JavaScript file: no chunk groups, and every dynamic import of
// src/App.tsx inlined. Use it for an offline copy of the viewer that a reader can open from a
// folder or hand around as one artifact. Every other build splits (docs/perf/README.md).
const singleFile = process.env.VITE_SINGLE_FILE === '1'

/**
 * Chunk groups (spec 2.9, WP-H1). The browser downloads them in parallel and compiles them in
 * parallel, and an edit to the app code leaves the hash of three, React and the atlas data
 * alone, so a return visit re-downloads only what changed. Names are stable; sizes are in
 * docs/perf/README.md. `includeDependenciesRecursively: false` keeps a group to the modules its
 * pattern matches, so the data group holds JSON and not the schema that parses it.
 */
const chunkGroups = [
  // The full ZFA vocabulary (D17) is fetched only when the user searches, so it gets its own
  // group above atlas-data; without the higher priority its 750 kB would join the record chunk.
  { name: 'vocabulary', test: /src[\\/]data[\\/]vocabulary\.json$/, priority: 110 },
  { name: 'atlas-data', test: /src[\\/]data[\\/]/, priority: 100 },
  { name: 'three', test: /node_modules[\\/](three|three-stdlib)[\\/]/, priority: 90 },
  { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 80 },
  { name: 'r3f', test: /node_modules[\\/]@react-three[\\/]/, priority: 70 },
  { name: 'zod', test: /node_modules[\\/]zod[\\/]/, priority: 60 },
  { name: 'vendor', test: /node_modules/, priority: 50 },
]

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: { alias: fixtureAlias },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        codeSplitting: singleFile ? false : { includeDependenciesRecursively: false, groups: chunkGroups },
      },
    },
  },
  // The dev server binds to localhost: it serves the whole project root, and this repository is
  // checked out on shared machines (SEC-05). `npm run dev:lan` passes --host when LAN access is
  // wanted.
  server: { port: 5173 },
  preview: { port: 4173, strictPort: true },
})
