// Attribution data (DM-04, D14). The info card footer and scripts/build-attribution.ts read it.

/** Licences that a shipped asset may carry (D14). scripts/build-attribution.ts checks against this list. */
export const ALLOWED_LICENSES = ['CC BY 4.0', 'CC BY 3.0', 'CC0 1.0', 'MIT'] as const
export type AllowedLicense = (typeof ALLOWED_LICENSES)[number]

/** The generated files that sit beside index.html in the built site. */
export const ATTRIBUTION_FILE = 'ATTRIBUTION.md'
export const NOTICES_FILE = 'THIRD-PARTY-NOTICES.txt'

/**
 * Ids of the `<script type="text/plain">` blocks that scripts/bundle.ts embeds in the
 * single-file demo. The demo travels as one file, so the UI reads these blocks instead of
 * fetching the two files beside it (L-06).
 */
export const EMBEDDED_ATTRIBUTION_ID = 'embedded-attribution'
export const EMBEDDED_NOTICES_ID = 'embedded-third-party-notices'

export const attribution = {
  /** ZFIN database content: the stage table and the anatomy item file (CC BY 4.0). */
  zfin: {
    holder: 'ZFIN, The Zebrafish Information Network, University of Oregon, https://zfin.org',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    text:
      'Anatomy terms, definitions, synonyms, parent relations, stage names and stage times ' +
      'are derived from ZFIN, the Zebrafish Information Network (https://zfin.org), and are ' +
      'used under the Creative Commons Attribution 4.0 licence. Files: anatomy_item.txt, ' +
      'anatomy_relationship.txt, anatomy_synonyms.txt, stage_ontology.txt, downloaded ' +
      '2026-09-06. The atlas modifies these data: it adds model windows, positions, sizes ' +
      'and colours that ZFIN does not provide. ' +
      'The ZFIN staging-series pages reprint Kimmel et al. 1995 (Dev Dyn 203:253-310), ' +
      'copyright ©1995 Wiley-Liss, Inc., by a permission that Wiley-Liss granted to ZFIN. ' +
      'That permission is not part of the ZFIN CC BY 4.0 grant. The atlas takes stage times, ' +
      'lengths, angles and landmark facts from those pages and states them in its own words. ' +
      'It reprints no passage and no figure.',
    citation:
      'Bradford YM, Van Slyke CE, Ruzicka L, et al. Zebrafish information network, the ' +
      'knowledgebase for Danio rerio research. Genetics 2022;220(4):iyac016.',
    footer: 'Definitions and stages: ZFIN, CC BY 4.0',
  },
  /** The ZFA and ZFS ontology files carry CC BY 3.0 in their OBO header (D14). */
  ontology: {
    holder: 'Zebrafish Anatomy Ontology (ZFA) and Zebrafish Stage Ontology (ZFS), ZFIN',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    text:
      'The Zebrafish Anatomy Ontology (ZFA) and the Zebrafish Stage Ontology (ZFS), release ' +
      '2026-07-16 (zfa.obo data-version releases/2026-07-16, http://purl.obolibrary.org/obo/zfa.obo), ' +
      'are used under the Creative Commons Attribution 3.0 licence. The atlas reads term ids, ' +
      'names, definitions and stage relations from zfa.obo. It modifies these definitions on ' +
      'two paths. The vocabulary in src/data/vocabulary.json removes the HTML markup, then ' +
      'keeps the first sentence of each definition, up to 240 characters. A first sentence ' +
      'longer than that is cut at the last sentence end that fits, or at a word gap with an ' +
      'ellipsis when it carries none. The 221 record definitions in src/data/structures/*.json ' +
      'are longer cuts of the ZFA text, and some keep more than one sentence. Two of them are ' +
      'reworded: ZFA:0000031 (hypochord) and ZFA:0009288 (primordial germ cell).',
    footer: 'ZFA and ZFS ontology, CC BY 3.0',
  },
  zfaRelease: '2026-07-16',
  citations: [
    {
      key: 'Kimmel1995',
      text:
        'Kimmel CB, Ballard WW, Kimmel SR, Ullmann B, Schilling TF. Stages of embryonic ' +
        'development of the zebrafish. Dev Dyn 1995;203:253-310.',
      doi: '10.1002/aja.1002030302',
      use: 'stage times, embryo lengths and head-trunk angles read through the ZFIN staging pages',
    },
    {
      key: 'Parichy2009',
      text:
        'Parichy DM, Elizondo MR, Mills MG, Gordon TN, Engeszer RE. Normal table of ' +
        'postembryonic zebrafish development. Dev Dyn 2009;238:2975-3015.',
      doi: '10.1002/dvdy.22113',
      use: 'post-embryonic milestones by standard length',
    },
    {
      key: 'Singleman2014',
      text:
        'Singleman C, Holtzman NG. Growth and maturation in the zebrafish, Danio rerio: ' +
        'a staging tool for teaching and research. Zebrafish 2014;11:396-406.',
      doi: '10.1089/zeb.2014.0976',
      use: 'juvenile and adult standard length thresholds at 45, 90 and 180 dpf',
    },
  ],
  notes: [
    'This atlas is a teaching aid built from schematic, estimated geometry. It is not a validated model for quantitative research.',
    'The panel layout, the systems list, the isolate action and the Dissect view follow the design of human-atlas by Ashe Magalhaes (https://github.com/ashemag/human-atlas, MIT). No human-atlas code is in this atlas.',
    'No figure from Kimmel et al. 1995 is redistributed (D14).',
    'Code is MIT licensed; see LICENSE. The licences of the bundled packages are in THIRD-PARTY-NOTICES.txt.',
  ],
} as const

export type Attribution = typeof attribution

/** The one-line footer of the info card (DM-27): both ZFIN licences. */
export function attributionFooter(): string {
  return `${attribution.zfin.footer}; ${attribution.ontology.footer}`
}

/** Every licence the attribution data names; build-attribution.ts checks each against ALLOWED_LICENSES. */
export function attributionLicenses(): string[] {
  return [attribution.zfin.license, attribution.ontology.license, 'MIT']
}

export function isAllowedLicense(license: string): license is AllowedLicense {
  return (ALLOWED_LICENSES as readonly string[]).includes(license)
}
