// The structure records: the group nodes of spec 3.4 plus one file per D5 system, so the
// phase 2 anatomy packages never edit the same file. src/data/index.ts is the only importer;
// scripts read the directory with fs. The order is cosmetic: ids are unique across the files.
import groups from './groups.json' with { type: 'json' }
import earlyEmbryo from './early_embryo.json' with { type: 'json' }
import axial from './axial.json' with { type: 'json' }
import nervous from './nervous.json' with { type: 'json' }
import sensory from './sensory.json' with { type: 'json' }
import cardiovascular from './cardiovascular.json' with { type: 'json' }
import hematopoieticImmune from './hematopoietic_immune.json' with { type: 'json' }
import respiratory from './respiratory.json' with { type: 'json' }
import digestive from './digestive.json' with { type: 'json' }
import excretory from './excretory.json' with { type: 'json' }
import endocrine from './endocrine.json' with { type: 'json' }
import reproductive from './reproductive.json' with { type: 'json' }
import skeletal from './skeletal.json' with { type: 'json' }
import muscular from './muscular.json' with { type: 'json' }
import fins from './fins.json' with { type: 'json' }
import integumentPigment from './integument_pigment.json' with { type: 'json' }

/** Group nodes first, then the systems in D5 rail order. */
export const structuresRaw: unknown[] = [
  ...groups,
  ...earlyEmbryo,
  ...axial,
  ...nervous,
  ...sensory,
  ...cardiovascular,
  ...hematopoieticImmune,
  ...respiratory,
  ...digestive,
  ...excretory,
  ...endocrine,
  ...reproductive,
  ...skeletal,
  ...muscular,
  ...fins,
  ...integumentPigment,
]
