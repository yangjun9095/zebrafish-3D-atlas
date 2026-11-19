// Shared zod atoms and the SystemRecord schema (spec 3.2.1, D5).
import { z } from 'zod'

export const ZfaId = z.string().regex(/^ZFA:\d{7}$/)
export const ZfsId = z.string().regex(/^ZFS:\d{7}$/)
export const Hex = z.string().regex(/^#[0-9A-F]{6}$/)
export const Hpf = z.number().min(0).max(17520)
export const Mm = z.number().min(0)
export const Url = z.url()

/** The 15 canonical systems in rail order (D5). */
export const SYSTEM_IDS = [
  'early_embryo',
  'axial',
  'nervous',
  'sensory',
  'cardiovascular',
  'hematopoietic_immune',
  'respiratory',
  'digestive',
  'excretory',
  'endocrine',
  'reproductive',
  'skeletal',
  'muscular',
  'fins',
  'integument_pigment',
] as const

export const SystemId = z.enum(SYSTEM_IDS)
export type SystemId = z.infer<typeof SystemId>

export const SystemRecord = z.strictObject({
  id: SystemId,
  displayName: z.string().min(1),
  zfaRoots: z.array(ZfaId).min(1),
  paletteSlot: z.string().regex(/^S(0[1-9]|1[0-5])$/),
  color: z.strictObject({ dark: Hex, light: Hex }),
  /** lucide icon name (research 07, UX-VS-08). */
  icon: z.string().min(1),
  /** Rail order, the D5 table order. */
  order: z.number().int().min(1).max(15),
  /**
   * D17: the direction the dissect slider moves this system's structures, `[posterior, dorsal]`
   * in the lateral plane (D4 axes). The length scales the distance, so a system that stays near
   * the spine carries a short vector. Absent: the table in src/core/dissect.ts.
   */
  dissectDirection: z.tuple([z.number().min(-2).max(2), z.number().min(-2).max(2)]).optional(),
})
export type SystemRecord = z.infer<typeof SystemRecord>

export const SystemsFile = z.array(SystemRecord).length(15)
export type SystemsFile = z.infer<typeof SystemsFile>
