// Checks the script-src hashes of the Content-Security-Policy against the built page (SEC-03).
//
//   node scripts/check-csp.ts [--dist <dir>]
//
// index.html holds one inline script, the pre-paint theme setter. The policy in public/_headers
// and vercel.json names its SHA-256. An edit to that script changes the hash, and the browser
// then refuses to run the script and the page paints in the wrong theme. This check runs after
// the build, so the edit fails the build instead.
//
// Run it after `npm run build`. The single-file bundle of `npm run bundle` inlines the whole
// application into dist/index.html, so its hashes are not the ones a hosted deploy sends.
//
// It also holds the two files to one policy: a header set that drifts between hosts is a defect
// a reviewer finds only after a deploy.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** `<script>` blocks with no `src` attribute, with their bodies. */
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi

/** The base64 SHA-256 of one inline script body, in the form CSP writes it. */
export function scriptHash(body: string): string {
  return `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`
}

/** The hashes of every inline script of an HTML page, in source order. */
export function inlineScriptHashes(html: string): string[] {
  return [...html.matchAll(INLINE_SCRIPT)].map((m) => scriptHash(m[1]))
}

/** The policy line of public/_headers. */
export function policyFromHeaders(text: string): string {
  const line = text.split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'))
  if (line === undefined) throw new Error('public/_headers has no Content-Security-Policy line')
  return line.split(':').slice(1).join(':').trim()
}

/** The policy value of vercel.json. */
export function policyFromVercel(text: string): string {
  const config = JSON.parse(text) as { headers?: Array<{ headers?: Array<{ key: string; value: string }> }> }
  for (const rule of config.headers ?? []) {
    for (const header of rule.headers ?? []) {
      if (header.key === 'Content-Security-Policy') return header.value
    }
  }
  throw new Error('vercel.json has no Content-Security-Policy header')
}

function main(): number {
  const distFlag = process.argv.indexOf('--dist')
  const dist = distFlag === -1 ? join(repoRoot, 'dist') : resolve(process.argv[distFlag + 1] ?? '')
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  const hashes = inlineScriptHashes(html)
  const headers = policyFromHeaders(readFileSync(join(repoRoot, 'public/_headers'), 'utf8'))
  const vercel = policyFromVercel(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'))

  const problems: string[] = []
  if (headers !== vercel) problems.push('public/_headers and vercel.json carry different policies')
  if (hashes.length === 0) problems.push(`${join(dist, 'index.html')} has no inline script; the policy names one`)
  for (const hash of hashes) {
    if (!headers.includes(hash)) problems.push(`public/_headers does not name ${hash}`)
    if (!vercel.includes(hash)) problems.push(`vercel.json does not name ${hash}`)
  }
  if (problems.length > 0) {
    for (const p of problems) console.error(`csp: ${p}`)
    console.error(`csp: the built page needs script-src ${hashes.join(' ')}`)
    return 1
  }
  console.log(`csp: ${String(hashes.length)} inline script hash(es) match public/_headers and vercel.json`)
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    process.exit(main())
  } catch (e: unknown) {
    console.error(`csp: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  }
}
