// Registry of the primitive builders by kind (D3, BG-29) and by custom
// builder name (section 4.6).
import { earVesicle } from './custom/earVesicle.ts'
import { eyeCup } from './custom/eyeCup.ts'
import { finSheet } from './custom/finSheet.ts'
import { gutLoop } from './custom/gutLoop.ts'
import { heartLoop } from './custom/heartLoop.ts'
import { primordiumMover } from './custom/primordiumMover.ts'
import { somiteChevron } from './custom/somiteChevron.ts'
import { ellipsoid } from './ellipsoid.ts'
import { lathe } from './lathe.ts'
import { segmentArray } from './segmentArray.ts'
import { sheet } from './sheet.ts'
import { shell } from './shell.ts'
import { superellipsoid } from './superellipsoid.ts'
import { tube } from './tube.ts'
import type { PrimitiveBuilder } from './types.ts'

export type AnyBuilder = PrimitiveBuilder<never>

export const PRIMITIVES = {
  ellipsoid, superellipsoid, tube, lathe, segmentArray, sheet, shell,
} as const

export const CUSTOM_BUILDERS = {
  heartLoop, gutLoop, eyeCup, earVesicle, somiteChevron, finSheet, primordiumMover,
} as const

export type PrimitiveKind = keyof typeof PRIMITIVES
export type CustomBuilderName = keyof typeof CUSTOM_BUILDERS

/** Builder for a geometry `kind`, or for `custom` with a `builder` name. */
export function builderFor(kind: string, builder?: string): AnyBuilder | null {
  if (kind === 'custom') return builder && builder in CUSTOM_BUILDERS ? (CUSTOM_BUILDERS[builder as CustomBuilderName] as unknown as AnyBuilder) : null
  return kind in PRIMITIVES ? (PRIMITIVES[kind as PrimitiveKind] as unknown as AnyBuilder) : null
}

export { ellipsoid, superellipsoid, tube, lathe, segmentArray, sheet, shell }
export { heartLoop, gutLoop, eyeCup, earVesicle, somiteChevron, finSheet, primordiumMover }
export * from './types.ts'
export { countsFor, setInteractiveStep, getInteractiveStep } from './tessellation.ts'
