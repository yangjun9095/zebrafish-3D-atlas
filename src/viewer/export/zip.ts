// A minimal ZIP writer for the kit export (spec UI-38, UX-EX-15): stored entries only, no
// compression, no dependency. Layout per the PKWARE APPNOTE: local headers with the data, then
// the central directory and the end record. Names are UTF-8 (general purpose bit 11). Sizes and
// offsets stay in 32 bits; a kit of PNGs is far below the 4 GB limit. listZip reads the same
// layout back for tests and for a sanity check after an export.

export interface ZipEntry {
  name: string
  data: Uint8Array
  modified?: Date
}

export interface ZipListing {
  name: string
  size: number
  crc32: number
  data: Uint8Array
}

const LOCAL_SIG = 0x04034b50
const CENTRAL_SIG = 0x02014b50
const END_SIG = 0x06054b50
const UTF8_FLAG = 0x0800

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

/** CRC-32 (IEEE 802.3), the checksum every ZIP reader verifies. */
export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** MS-DOS time and date fields; years before 1980 clamp to 1980. */
export function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(d.getFullYear(), 1980)
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

function concat(parts: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/** Builds a stored ZIP archive from the entries in order. */
export function buildZip(entries: readonly ZipEntry[], now = new Date()): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const e of entries) {
    const name = enc.encode(e.name)
    const crc = crc32(e.data)
    const { time, date } = dosDateTime(e.modified ?? now)
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, LOCAL_SIG, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, UTF8_FLAG, true)
    lv.setUint16(10, time, true)
    lv.setUint16(12, date, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, e.data.length, true)
    lv.setUint32(22, e.data.length, true)
    lv.setUint16(26, name.length, true)
    local.set(name, 30)
    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, CENTRAL_SIG, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, UTF8_FLAG, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, e.data.length, true)
    cv.setUint32(24, e.data.length, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    central.set(name, 46)
    parts.push(local, e.data)
    centrals.push(central)
    offset += local.length + e.data.length
  }
  const cdSize = centrals.reduce((n, c) => n + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, END_SIG, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, offset, true)
  return concat([...parts, ...centrals, end])
}

/** Reads a stored archive written by buildZip (or any stored ZIP without a comment). Throws on a bad layout. */
export function listZip(bytes: Uint8Array): ZipListing[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const dec = new TextDecoder()
  const endAt = bytes.length - 22
  if (endAt < 0 || view.getUint32(endAt, true) !== END_SIG) throw new Error('zip: no end record')
  const count = view.getUint16(endAt + 10, true)
  let at = view.getUint32(endAt + 16, true)
  const out: ZipListing[] = []
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== CENTRAL_SIG) throw new Error(`zip: bad central header at ${at}`)
    const method = view.getUint16(at + 10, true)
    if (method !== 0) throw new Error(`zip: entry ${i} is not stored`)
    const crc = view.getUint32(at + 16, true)
    const size = view.getUint32(at + 20, true)
    const nameLen = view.getUint16(at + 28, true)
    const extraLen = view.getUint16(at + 30, true)
    const commentLen = view.getUint16(at + 32, true)
    const localAt = view.getUint32(at + 42, true)
    const name = dec.decode(bytes.subarray(at + 46, at + 46 + nameLen))
    if (view.getUint32(localAt, true) !== LOCAL_SIG) throw new Error(`zip: bad local header for ${name}`)
    const dataAt = localAt + 30 + view.getUint16(localAt + 26, true) + view.getUint16(localAt + 28, true)
    const data = bytes.subarray(dataAt, dataAt + size)
    if (crc32(data) !== crc) throw new Error(`zip: checksum mismatch for ${name}`)
    out.push({ name, size, crc32: crc, data })
    at += 46 + nameLen + extraLen + commentLen
  }
  return out
}
