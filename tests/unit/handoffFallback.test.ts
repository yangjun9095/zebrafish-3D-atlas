// Phase 1 review F1 and R2: a handoff source keeps its mesh while no target record draws.
// Since phase 2 every D9 target is a record with a builder or a derived part, so the fallback
// is a no-op on the shipped data; the synthetic case below keeps the rule itself covered.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { applyHandoffFallback, handoffsWithoutTargets } from '../../src/core/handoffFallback.ts'
import { hasMeshAt } from '../../src/core/presence.ts'
import { HandoffsFile, StructuresFile, parseAtlasData } from '../../src/core/schema.ts'
import { handoffsRaw } from '../../src/data/handoffs/all.ts'
import { structuresRaw } from '../../src/data/structures/all.ts'

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown
const structures = StructuresFile.parse(structuresRaw)
const handoffs = HandoffsFile.parse(handoffsRaw)
const byId = new Map(structures.map((r) => [r.id, r]))

describe('applyHandoffFallback on the shipped data', () => {
  const { structures: effective, notes } = applyHandoffFallback(structures, handoffs)
  const rec = (id: string) => effective.find((r) => r.id === id)!

  it('finds a drawable target for every handoff, derived parts included', () => {
    expect(handoffsWithoutTargets(handoffs, byId)).toEqual([])
    expect(notes).toEqual([])
  })

  it('keeps every record identity and the authored windows', () => {
    for (const r of structures) expect(rec(r.id)).toBe(r)
    // The eye and the heart end their own mesh at the handoff window and continue as parents of derived parts.
    expect(rec('ZFA:0000107').geometry?.geometryEndHpf).toBe(30)
    expect(rec('ZFA:0000114').geometry?.geometryEndHpf).toBe(48)
    expect(hasMeshAt(rec('ZFA:0000107'), 120)).toBe(false)
    expect(hasMeshAt(rec('ZFA:0000152'), 120)).toBe(true)
    // The somite array ends when its last segment has crossed to the myotomes; the otic vesicle at the ear window.
    expect(rec('ZFA:0000155').modelEndHpf).toBe(33)
    expect(rec('ZFA:0000051').modelEndHpf).toBe(72)
    expect(rec('ZFA:0001135').geometry?.geometryEndHpf).toBe(24)
  })

  it('is applied by parseAtlasData with no notes', () => {
    const res = parseAtlasData({
      systems: read('src/data/systems.json'),
      stages: read('src/data/stages.json'),
      structures: structuresRaw,
      body: read('src/data/body.json'),
      handoffs: handoffsRaw,
      kits: read('src/data/kits.json'),
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.data.structuresById.get('ZFA:0000107')?.geometry?.geometryEndHpf).toBe(30)
    expect(res.data.fallbackNotes).toEqual([])
  })
})

describe('applyHandoffFallback without a target', () => {
  it('runs the source to its ZFA end, drops its geometryEndHpf, and notes it', () => {
    const withoutParts = structures.filter((r) => !['ZFA:0000152', 'ZFA:0000144', 'ZFA:0000035'].includes(r.id))
    const { structures: effective, notes } = applyHandoffFallback(withoutParts, handoffs)
    const eye = effective.find((r) => r.id === 'ZFA:0000107')!
    expect(eye.geometry?.geometryEndHpf).toBeUndefined()
    expect(eye.modelEndHpf).toBe(4320)
    expect(eye.fadeOutHpf).toBe(0)
    expect(hasMeshAt(eye, 4320)).toBe(true)
    expect(notes).toEqual(['handoffs:optic_cup_parts: ZFA:0000107 keeps its mesh to 4320 hpf until a target record lands'])
    // Untouched records keep their identity.
    expect(effective.find((r) => r.id === 'ZFA:0000114')).toBe(byId.get('ZFA:0000114'))
  })
})
