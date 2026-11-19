import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type ZfinStage = { zdb: string; zfs: string; name: string; startHpf: number; endHpf: number }
export type ZfinItem = { id: string; name: string; startZdb: string; endZdb: string }

export type ZfinSnapshot = {
  dir: string
  items: Map<string, ZfinItem>
  /** Lower-cased synonyms per ZFA id. */
  synonyms: Map<string, Set<string>>
  /** Keys `${parent}\t${child}\t${type}`; types are `is_a`, `part of`, `develops from`, ... */
  relations: Set<string>
  stagesByZfs: Map<string, ZfinStage>
  stagesByZdb: Map<string, ZfinStage>
  /** Every `id:` of a [Term] stanza in zfa.obo, including the ZFS period terms. */
  oboTermIds: Set<string>
  /** `data-version: releases/<date>` of zfa.obo, or null. */
  release: string | null
}

export const ZFIN_FILES = [
  'anatomy_item.txt',
  'anatomy_relationship.txt',
  'anatomy_synonyms.txt',
  'stage_ontology.txt',
  'zfa.obo',
] as const

/** Maps the schema relation names to the strings of anatomy_relationship.txt (E016). */
export const RELATION_TYPES: Record<string, string> = {
  is_a: 'is_a',
  part_of: 'part of',
  develops_from: 'develops from',
}

function rows(path: string): string[][] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'))
}

/** Returns the names of the snapshot files that are missing under `dir`. */
export function missingZfinFiles(dir: string): string[] {
  return ZFIN_FILES.filter((name) => !existsSync(join(dir, name)))
}

/** Reads the five snapshot files. Call `missingZfinFiles` first. */
export function loadZfin(dir: string): ZfinSnapshot {
  const items = new Map<string, ZfinItem>()
  for (const [id, name, startZdb, endZdb] of rows(join(dir, 'anatomy_item.txt'))) {
    if (id && name) items.set(id, { id, name, startZdb: startZdb ?? '', endZdb: endZdb ?? '' })
  }

  const synonyms = new Map<string, Set<string>>()
  for (const [id, , synonym] of rows(join(dir, 'anatomy_synonyms.txt'))) {
    if (!id || !synonym) continue
    const set = synonyms.get(id) ?? new Set<string>()
    set.add(synonym.trim().toLowerCase())
    synonyms.set(id, set)
  }

  const relations = new Set<string>()
  for (const [parent, child, type] of rows(join(dir, 'anatomy_relationship.txt'))) {
    if (parent && child && type) relations.add(`${parent}\t${child}\t${type.trim()}`)
  }

  const stagesByZfs = new Map<string, ZfinStage>()
  const stagesByZdb = new Map<string, ZfinStage>()
  for (const [zdb, zfs, name, start, end] of rows(join(dir, 'stage_ontology.txt'))) {
    if (!zdb || !zfs || !name) continue
    const stage = { zdb, zfs, name, startHpf: Number(start), endHpf: Number(end) }
    stagesByZfs.set(zfs, stage)
    stagesByZdb.set(zdb, stage)
  }

  const oboTermIds = new Set<string>()
  let release: string | null = null
  for (const line of readFileSync(join(dir, 'zfa.obo'), 'utf8').split('\n')) {
    if (line.startsWith('id: ')) oboTermIds.add(line.slice(4).trim())
    else if (line.startsWith('data-version: ')) release = line.slice(14).trim().replace(/^releases\//, '')
  }

  return { dir, items, synonyms, relations, stagesByZfs, stagesByZdb, oboTermIds, release }
}

/** True when `${parent} ${child} ${type}` is a row of anatomy_relationship.txt. */
export function hasRelation(zfin: ZfinSnapshot, parent: string, child: string, type: string): boolean {
  return zfin.relations.has(`${parent}\t${child}\t${type}`)
}
