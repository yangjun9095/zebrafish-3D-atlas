// The D9 handoff rows, one file per anatomy package, keyed by the system of the source
// (driver) record: a1 early embryo and axial, a2 nervous and sensory, a3 cardiovascular,
// blood and respiratory, a4 digestive, excretory, endocrine and reproductive, a5 skeletal,
// muscular, fins and skin. src/data/index.ts is the only importer.
import a1 from './a1-early-axial.json' with { type: 'json' }
import a2 from './a2-nervous-sensory.json' with { type: 'json' }
import a3 from './a3-cardio-blood-respiratory.json' with { type: 'json' }
import a4 from './a4-digestive-excretory-endocrine-reproductive.json' with { type: 'json' }
import a5 from './a5-skeletal-muscular-fins-skin.json' with { type: 'json' }

export const handoffsRaw: unknown[] = [...a1, ...a2, ...a3, ...a4, ...a5]
