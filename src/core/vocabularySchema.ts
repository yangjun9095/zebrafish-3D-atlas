// Schema of src/data/vocabulary.json, the full ZFA vocabulary of D17.
//
// scripts/build-vocabulary.ts writes the file with one-letter keys and ids without the "ZFA:"
// prefix, so the lazy chunk stays inside the 900 kB budget. This module parses that form and
// src/core/vocabulary.ts expands it into the named API. docs/api/vocabulary.md documents both.
import { z } from 'zod'

/** "0000042": a ZFA id without its prefix, as the file stores it. */
export const TermDigits = z.string().regex(/^\d{7}$/)

export const VocabularyTermJson = z.strictObject({
  i: TermDigits,
  n: z.string().min(1),
  y: z.array(z.string().min(1)).optional(),
  d: z.string().optional(),
  /**
   * ZFIN start and end stage in hpf. Absent or null when the ZFIN row is the placeholder
   * "Unknown" stage (ZDB-STAGE-050211-1, ZFS:0000000, 0.00 to 17520.00), which states no
   * window: half the anatomy items carry it, and the atlas says so rather than reading the
   * placeholder's numbers as a real window from the zygote to the adult.
   */
  a: z.number().nullish(),
  b: z.number().nullish(),
  p: z.array(TermDigits).optional(),
  s: z.array(TermDigits).optional(),
  m: TermDigits.optional(),
  c: z.array(TermDigits).optional(),
  k: z.literal(1).optional(),
})
export type VocabularyTermJson = z.infer<typeof VocabularyTermJson>

export const VocabularyFile = z.strictObject({
  /** ZFA release of the snapshot, "2026-07-16". */
  release: z.string().nullable(),
  source: z.string(),
  terms: z.array(VocabularyTermJson),
})
export type VocabularyFile = z.infer<typeof VocabularyFile>

/** 'cell' for an is_a descendant of ZFA:0009000, 'structure' for every other term (D17). */
export type TermKind = 'cell' | 'structure'

/** One vocabulary term with its short keys expanded. */
export interface VocabularyTerm {
  /** "ZFA:0000042" */
  id: string
  name: string
  synonyms: string[]
  /** First sentence of the ZFA definition, at most 240 characters; "" when ZFA states none. */
  definition: string
  /** ZFIN start stage in hpf, or null when ZFIN states no start stage. */
  startHpf: number | null
  /** ZFIN end stage in hpf, or null when ZFIN states none; 17520 ends the adult stage. */
  endHpf: number | null
  /** part_of parents. */
  partOf: string[]
  /** is_a parents. */
  isA: string[]
  /** The nearest modeled record, or null when nothing in the atlas contains the term. */
  standIn: string | null
  /** The chain from the term to the stand-in, nearest first, ending at the stand-in. */
  standInPath: string[]
  kind: TermKind
}

export function withPrefix(digits: string): string {
  return `ZFA:${digits}`
}

export function expandTerm(raw: VocabularyTermJson): VocabularyTerm {
  return {
    id: withPrefix(raw.i),
    name: raw.n,
    synonyms: raw.y ?? [],
    definition: raw.d ?? '',
    startHpf: raw.a ?? null,
    endHpf: raw.b ?? null,
    partOf: (raw.p ?? []).map(withPrefix),
    isA: (raw.s ?? []).map(withPrefix),
    standIn: raw.m === undefined ? null : withPrefix(raw.m),
    standInPath: (raw.c ?? []).map(withPrefix),
    kind: raw.k === 1 ? 'cell' : 'structure',
  }
}

export interface VocabularyParseError {
  path: string
  message: string
}

export type VocabularyParseResult =
  | { ok: true; file: VocabularyFile }
  | { ok: false; error: VocabularyParseError }

/** Parses the generated file. The first issue is enough: the file is machine written. */
export function parseVocabularyFile(raw: unknown): VocabularyParseResult {
  const result = VocabularyFile.safeParse(raw)
  if (result.success) return { ok: true, file: result.data }
  const issue = result.error.issues[0]
  const path = issue.path.map((s) => String(s)).join('.')
  return { ok: false, error: { path, message: issue.message } }
}
