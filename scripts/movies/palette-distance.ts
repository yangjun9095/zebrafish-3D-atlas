// How far apart the reporter colours of the atlas read.
//
//   node scripts/movies/palette-distance.ts
//
// It reads REPORTERS from src/core/fluorescence.ts, converts each `hex` to CIELAB through sRGB
// with the D65 white point, and prints the CIE76 distance of every pair, closest pair first. A
// pair below about 20 reads as one colour in a movie, so the closest pair is the number to watch
// when a reporter is added to the table.
//
// The distance is between the display colours, not between the emission peaks. `emissionNm` plays
// no part here.
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { REPORTERS } from '../../src/core/fluorescence.ts'
import type { ReporterId } from '../../src/core/fluorescence.ts'

/** Lightness, green-red and blue-yellow, in CIELAB. */
export type Lab = [number, number, number]

/** The sRGB transfer function, from a 0 to 1 channel to linear light. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** `#39F579` or `39f579` to the three channels of sRGB, each 0 to 1. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`palette-distance: "${hex}" is not a six-digit hex colour`)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
}

/** CIELAB of one hex colour, through linear sRGB and CIE XYZ with the D65 white point. */
export function hexToLab(hex: string): Lab {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear)
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
  const d = 6 / 29
  const f = (t: number): number => (t > d ** 3 ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29)
  const fx = f(x / 0.95047)
  const fy = f(y / 1)
  const fz = f(z / 1.08883)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** CIE76: the Euclidean distance of two CIELAB colours. Black to white is 100. */
export function deltaE76(a: Lab, b: Lab): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export interface Pair {
  a: string
  b: string
  distance: number
}

/** Every pair of the reporter table, closest pair first. */
export function palettePairs(): Pair[] {
  const ids = Object.keys(REPORTERS) as ReporterId[]
  const labs = new Map<ReporterId, Lab>(ids.map((id) => [id, hexToLab(REPORTERS[id].hex)]))
  const pairs: Pair[] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]
      const b = ids[j]
      pairs.push({ a: REPORTERS[a].name, b: REPORTERS[b].name, distance: deltaE76(labs.get(a)!, labs.get(b)!) })
    }
  }
  return pairs.sort((p, q) => p.distance - q.distance)
}

const USAGE = 'usage: node scripts/movies/palette-distance.ts'

function main(argv: string[]): number {
  for (const a of argv) {
    if (a === '--help' || a === '-h') {
      console.log(USAGE)
      return 0
    }
    console.error(`palette-distance: unexpected argument ${a}`)
    console.error(USAGE)
    return 2
  }
  const pairs = palettePairs()
  console.log(`${'pair'.padEnd(30)} dE76`)
  for (const pair of pairs) {
    console.log(`${pair.a.padEnd(13)} - ${pair.b.padEnd(13)} ${pair.distance.toFixed(2).padStart(6)}`)
  }
  const closest = pairs[0]
  console.log(`\nminimum pair: ${closest.a} - ${closest.b} = ${closest.distance.toFixed(2)}`)
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) process.exit(main(process.argv.slice(2)))
