// Minimal PNG decoder for the screenshot checks: 8-bit grey, grey+alpha, RGB
// and RGBA, non-interlaced, as Chrome and Playwright write them. Returns RGBA.

import { inflateSync } from 'node:zlib'

export type DecodedPng = { width: number; height: number; rgba: Uint8Array }

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 }

export function decodePng(bytes: Uint8Array): DecodedPng {
  if (bytes.length < 8 || !SIGNATURE.every((b, i) => bytes[i] === b)) throw new Error('not a PNG file')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 8
  let width = 0
  let height = 0
  let colorType = -1
  const idat: Uint8Array[] = []
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8)
      height = view.getUint32(offset + 12)
      const bitDepth = bytes[offset + 16]
      colorType = bytes[offset + 17]
      const interlace = bytes[offset + 20]
      if (bitDepth !== 8) throw new Error(`unsupported PNG bit depth ${bitDepth}`)
      if (!(colorType in CHANNELS)) throw new Error(`unsupported PNG colour type ${colorType}`)
      if (interlace !== 0) throw new Error('interlaced PNG is not supported')
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  if (width === 0 || height === 0) throw new Error('PNG has no IHDR')
  const channels = CHANNELS[colorType]
  const raw = inflateSync(Buffer.concat(idat.map((d) => Buffer.from(d))))
  const stride = width * channels
  const pixels = unfilter(raw, width, height, channels)
  const rgba = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const s = y * stride + x * channels
      const d = (y * width + x) * 4
      if (channels >= 3) {
        rgba[d] = pixels[s]
        rgba[d + 1] = pixels[s + 1]
        rgba[d + 2] = pixels[s + 2]
        rgba[d + 3] = channels === 4 ? pixels[s + 3] : 255
      } else {
        rgba[d] = rgba[d + 1] = rgba[d + 2] = pixels[s]
        rgba[d + 3] = channels === 2 ? pixels[s + 1] : 255
      }
    }
  }
  return { width, height, rgba }
}

/** Reverses the per-scanline filters (types 0 to 4). */
function unfilter(raw: Uint8Array, width: number, height: number, bpp: number): Uint8Array {
  const stride = width * bpp
  const out = new Uint8Array(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const src = y * (stride + 1) + 1
    const dst = y * stride
    const prev = dst - stride
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i]
      const a = i >= bpp ? out[dst + i - bpp] : 0
      const b = y > 0 ? out[prev + i] : 0
      const c = y > 0 && i >= bpp ? out[prev + i - bpp] : 0
      let v: number
      if (filter === 0) v = x
      else if (filter === 1) v = x + a
      else if (filter === 2) v = x + b
      else if (filter === 3) v = x + ((a + b) >> 1)
      else if (filter === 4) v = x + paeth(a, b, c)
      else throw new Error(`unknown PNG filter ${filter} on row ${y}`)
      out[dst + i] = v & 0xff
    }
  }
  return out
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}
