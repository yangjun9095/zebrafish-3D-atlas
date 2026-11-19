// Pure model of the hierarchy tree (spec 5.3.2, UI-17, UX-IN-26, UX-IN-29, DM-30). buildTree runs once per
// data load; treeRows applies presence, hidden state, selection, expansion and the filter per render.
import type { AtlasData, StructureRecord, SystemRecord } from '../core/schema.ts'
import type { SystemCounts } from './railModel.ts'

export const ROOT_ID = 'ZFA:0001094'

export interface TreeNode {
  /** "sys:<system id>" for a system row, the ZFA id for a record row. */
  key: string
  kind: 'system' | 'record'
  name: string
  system: SystemRecord
  record: StructureRecord | null
  /** true for a record with geometry null (UI-18). */
  group: boolean
  children: TreeNode[]
  /** 0 for a system row; a direct child of a system row has depth 1. */
  depth: number
  /** Ids of the descendant records with geometry (counts, eye toggle, presence of a group). */
  geometryIds: string[]
  /** Ids of every descendant record, used for group presence (DM-30). */
  descendantIds: string[]
}

export interface TreeModel {
  roots: TreeNode[]
  byKey: Map<string, TreeNode>
  parentKey: Map<string, string | null>
}

export const systemKey = (id: string): string => `sys:${id}`

/**
 * The 15 systems in D5 order; under each, the records of the system whose uiParent is the root, missing,
 * or a record of another system, then the stored uiParent chain within the system (UI-17). The root record
 * is not a row. A cycle is cut at the first repeated id.
 */
export function buildTree(data: Pick<AtlasData, 'systems' | 'structures' | 'structuresById'>): TreeModel {
  const byKey = new Map<string, TreeNode>()
  const parentKey = new Map<string, string | null>()
  const childrenOf = new Map<string, StructureRecord[]>()
  const tops = new Map<string, StructureRecord[]>()
  for (const r of data.structures) {
    if (r.id === ROOT_ID) continue
    const parent = r.uiParent === null ? null : data.structuresById.get(r.uiParent)
    const nested = parent && parent.id !== ROOT_ID && parent.system === r.system
    const bucket = nested ? childrenOf : tops
    const id = nested ? parent.id : r.system
    const list = bucket.get(id)
    if (list) list.push(r)
    else bucket.set(id, [r])
  }
  const sortByName = (a: StructureRecord, b: StructureRecord) => a.name.localeCompare(b.name)

  const build = (r: StructureRecord, system: SystemRecord, depth: number, parent: string, seen: Set<string>): TreeNode | null => {
    if (seen.has(r.id)) return null
    seen.add(r.id)
    const node: TreeNode = {
      key: r.id, kind: 'record', name: r.name, system, record: r, group: r.geometry === null,
      children: [], depth, geometryIds: [], descendantIds: [],
    }
    for (const c of (childrenOf.get(r.id) ?? []).sort(sortByName)) {
      const child = build(c, system, depth + 1, r.id, seen)
      if (!child) continue
      node.children.push(child)
      node.descendantIds.push(c.id, ...child.descendantIds)
      node.geometryIds.push(...child.geometryIds)
    }
    if (r.geometry !== null) node.geometryIds.unshift(r.id)
    byKey.set(node.key, node)
    parentKey.set(node.key, parent)
    return node
  }

  const roots: TreeNode[] = []
  const seen = new Set<string>()
  for (const system of [...data.systems].sort((a, b) => a.order - b.order)) {
    const node: TreeNode = {
      key: systemKey(system.id), kind: 'system', name: system.displayName, system, record: null, group: false,
      children: [], depth: 0, geometryIds: [], descendantIds: [],
    }
    for (const r of (tops.get(system.id) ?? []).sort(sortByName)) {
      const child = build(r, system, 1, node.key, seen)
      if (!child) continue
      node.children.push(child)
      node.descendantIds.push(r.id, ...child.descendantIds)
      node.geometryIds.push(...child.geometryIds)
    }
    byKey.set(node.key, node)
    parentKey.set(node.key, null)
    roots.push(node)
  }
  return { roots, byKey, parentKey }
}

/** Keys of the ancestors of `key`, nearest first. */
export function ancestorKeys(model: TreeModel, key: string): string[] {
  const out: string[] = []
  let k = model.parentKey.get(key) ?? null
  while (k !== null) {
    out.push(k)
    k = model.parentKey.get(k) ?? null
  }
  return out
}

/** The system level expanded, every deeper level collapsed (UI-17). */
export function defaultExpanded(model: TreeModel): string[] {
  return model.roots.map((r) => r.key)
}

/**
 * The single group child of a system row ("nervous system" under Nervous, "renal system" under
 * Excretory), or null. Its rows fold into the system row, so a structure needs no extra expand;
 * the record stays selectable from search and the card.
 */
export function wrapperChild(node: TreeNode): TreeNode | null {
  if (node.kind !== 'system' || node.children.length !== 1) return null
  const child = node.children[0]
  return child.group && child.children.length > 0 ? child : null
}

/** The rows shown under a node: its children, or the wrapper's children when the wrapper folds away. */
export function shownChildren(node: TreeNode): TreeNode[] {
  return wrapperChild(node)?.children ?? node.children
}

export interface TreeRowsInput {
  model: TreeModel
  presentIds: ReadonlySet<string>
  hiddenStructures: readonly string[]
  hiddenSystems: readonly string[]
  selection: readonly string[]
  expanded: ReadonlySet<string>
  /** "Only structures present now" (UX-IN-26). A selected row and its ancestors always show. */
  onlyPresent: boolean
}

export interface TreeRow {
  node: TreeNode
  /** aria-level, 1 for a system row. */
  level: number
  posInSet: number
  setSize: number
  expanded: boolean
  present: boolean
  hidden: boolean
  /** false when the eye has nothing to hide (a group without geometry below it). */
  hideable: boolean
  selected: boolean
  /** "present / total" of the descendants with geometry; null for a leaf. */
  counts: SystemCounts | null
  children: TreeRow[]
}

/** The visible rows as a nested list; flattenRows gives the DOM order. */
export function treeRows(input: TreeRowsInput): TreeRow[] {
  const { model, presentIds, expanded, onlyPresent } = input
  const hiddenStructures = new Set(input.hiddenStructures)
  const hiddenSystems = new Set(input.hiddenSystems)
  const selection = new Set(input.selection)

  // Presence follows the drawn structures: a record with geometry by its own fade, a group or a system
  // while any descendant with geometry is present (DM-30). A group's own ZFIN window does not count.
  const isPresent = (node: TreeNode): boolean => node.geometryIds.some((id) => presentIds.has(id))
  // A selected row and its ancestors always show, so the tree can reveal a selection made elsewhere.
  const revealed = new Set<string>()
  for (const id of selection) {
    revealed.add(id)
    for (const k of ancestorKeys(model, id)) revealed.add(k)
  }
  const isHidden = (node: TreeNode): boolean => {
    if (hiddenSystems.has(node.system.id)) return true
    if (node.kind === 'system') return false
    if (!node.group) return hiddenStructures.has(node.key)
    return node.geometryIds.length > 0 && node.geometryIds.every((id) => hiddenStructures.has(id))
  }
  const countsOf = (node: TreeNode): SystemCounts | null => {
    if (shownChildren(node).length === 0) return null
    const ids = node.kind === 'record' && node.record?.geometry !== null ? node.geometryIds.slice(1) : node.geometryIds
    let present = 0
    for (const id of ids) if (presentIds.has(id)) present++
    return { present, total: ids.length }
  }

  const rows = (nodes: TreeNode[], level: number): TreeRow[] => {
    const kept = nodes.filter((n) => !onlyPresent || isPresent(n) || revealed.has(n.key))
    return kept.map((node, i) => {
      const children = shownChildren(node)
      const open = children.length > 0 && expanded.has(node.key)
      return {
        node,
        level,
        posInSet: i + 1,
        setSize: kept.length,
        expanded: open,
        present: isPresent(node),
        hidden: isHidden(node),
        hideable: node.kind === 'system' || node.geometryIds.length > 0,
        selected: node.kind === 'record' && selection.has(node.key),
        counts: countsOf(node),
        children: open ? rows(children, level + 1) : [],
      }
    })
  }
  return rows(model.roots, 1)
}

/** Depth-first order of the visible rows, for the roving tabindex and type-ahead. */
export function flattenRows(rows: TreeRow[]): TreeRow[] {
  const out: TreeRow[] = []
  const walk = (list: TreeRow[]) => {
    for (const r of list) {
      out.push(r)
      walk(r.children)
    }
  }
  walk(rows)
  return out
}

/** The next row after `from` whose name starts with `prefix`, wrapping around (type-ahead). */
export function typeAheadTarget(flat: TreeRow[], from: number, prefix: string): number {
  const p = prefix.toLowerCase()
  if (flat.length === 0 || p.length === 0) return -1
  // A repeated single letter cycles through the rows that start with it.
  const start = p.length === 1 ? from + 1 : from
  for (let step = 0; step < flat.length; step++) {
    const i = (start + step) % flat.length
    if (flat[i].node.name.toLowerCase().startsWith(p)) return i
  }
  return -1
}
