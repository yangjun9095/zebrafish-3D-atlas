// SEC-03: the zod JIT is off, so the deployed Content-Security-Policy records no script-src
// violation. zod reads the flag when a schema is built, so the order of the imports in
// src/main.tsx is part of the fix and this file holds it.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import '../../src/zodConfig.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** The specifiers of the static imports of a module, in source order. */
function importSpecifiers(source: string): string[] {
  const re = /^\s*import\s+(?:[^'"]*?from\s*)?['"]([^'"]+)['"]/gm
  return [...source.matchAll(re)].map((m) => m[1])
}

describe('the zod global config', () => {
  it('sets jitless, so zod never calls new Function', () => {
    expect(z.config().jitless).toBe(true)
  })

  it('still parses and still rejects', () => {
    const schema = z.object({ a: z.string(), b: z.number().int() })
    expect(schema.parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 })
    expect(schema.safeParse({ a: 'x', b: 1.5 }).success).toBe(false)
  })

  it('is the first module src/main.tsx imports', () => {
    const specs = importSpecifiers(readFileSync(join(repoRoot, 'src/main.tsx'), 'utf8'))
    expect(specs[0]).toBe('./zodConfig.ts')
  })

  it('is reached before src/core/urlState.ts builds its schema at module scope', () => {
    const urlState = readFileSync(join(repoRoot, 'src/core/urlState.ts'), 'utf8')
    expect(urlState).toContain('UrlState.parse({})')
  })
})
