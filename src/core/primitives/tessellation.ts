// Row and radial counts per primitive kind (BG-29, BG-30). The final counts
// never change; the interactive counts follow a three-step ladder (AR-73):
// step 2 is the table of BG-29, steps 3 and 4 divide the final counts further.
import type { Lod } from './types.ts'

export interface Counts { rows: number; radial: number }
export type TessellationKind =
  | 'ellipsoid' | 'superellipsoid' | 'tube' | 'bodyTube' | 'lathe' | 'sheet' | 'shell'
  | 'heartLoop' | 'gutLoop' | 'eyeCup' | 'earVesicle' | 'somiteChevron' | 'finSheet' | 'primordiumMover'

const FINAL: Record<TessellationKind, Counts> = {
  ellipsoid: { rows: 24, radial: 32 },
  superellipsoid: { rows: 24, radial: 32 },
  tube: { rows: 48, radial: 12 },
  bodyTube: { rows: 128, radial: 32 },
  lathe: { rows: 32, radial: 24 },
  sheet: { rows: 24, radial: 8 },
  shell: { rows: 24, radial: 48 },
  heartLoop: { rows: 48, radial: 16 },
  gutLoop: { rows: 48, radial: 12 },
  eyeCup: { rows: 24, radial: 32 },
  earVesicle: { rows: 24, radial: 32 },
  somiteChevron: { rows: 8, radial: 8 },
  // 40 chord rows, not the 24 of BG-29: at 24 the caudal fan of a forked adult fin reads as a
  // ring of flat facets, because the fan turns 80 to 180 degrees over about a third of the chord.
  finSheet: { rows: 40, radial: 8 },
  primordiumMover: { rows: 12, radial: 16 },
}

/** The interactive table of BG-29 and BG-30 (ladder step 2). */
const INTERACTIVE_STEP2: Record<TessellationKind, Counts> = {
  ellipsoid: { rows: 12, radial: 16 },
  superellipsoid: { rows: 12, radial: 16 },
  tube: { rows: 24, radial: 8 },
  bodyTube: { rows: 64, radial: 24 },
  lathe: { rows: 16, radial: 12 },
  sheet: { rows: 12, radial: 6 },
  shell: { rows: 12, radial: 24 },
  heartLoop: { rows: 24, radial: 12 },
  gutLoop: { rows: 24, radial: 8 },
  eyeCup: { rows: 12, radial: 16 },
  earVesicle: { rows: 12, radial: 16 },
  somiteChevron: { rows: 8, radial: 8 },
  finSheet: { rows: 20, radial: 6 },
  primordiumMover: { rows: 8, radial: 12 },
}

export type LadderStep = 2 | 3 | 4
let interactiveStep: LadderStep = 2

/** AR-73: choose the interactive ladder step at load; the final counts never change. */
export function setInteractiveStep(step: LadderStep): void { interactiveStep = step }
export function getInteractiveStep(): LadderStep { return interactiveStep }

export function countsFor(kind: TessellationKind, lod: Lod): Counts {
  if (lod === 'final') return FINAL[kind]
  if (interactiveStep === 2) return INTERACTIVE_STEP2[kind]
  const f = FINAL[kind]
  return { rows: Math.max(3, Math.ceil(f.rows / interactiveStep)), radial: Math.max(3, Math.ceil(f.radial / interactiveStep)) }
}

/** `(rows + 1) x (radial + 1)`, the grid vertex count with the duplicated seam column. */
export const gridVertexCount = (c: Counts): number => (c.rows + 1) * (c.radial + 1)
