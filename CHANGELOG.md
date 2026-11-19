# Changelog

Notable changes to this project, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the version numbers follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

A security fix is named here as well as in the release notes, as `SECURITY.md` promises.

## [Unreleased]

### Added

- Reporter preview (`?lab=1`, D18): up to 24 rules assign a fluorescent protein and an inclusive
  hpf window to existing modeled anatomy. Reused reporters union their coverage; composite and
  individual-channel views disambiguate overlap. Rules travel in share links, bookmarks and PNG
  export, and the export names itself a schematic preview, not imaging data.

### Fixed

- Picking no longer stops on unlabeled anatomy while the reporter preview is on.
- The lab panel now shares the info card's linked-term and selection-announcement behaviour
  instead of replacing the card.
- A stored kit with unvalidated fluorescence data is read with a safe parse instead of throwing.
- PNG export uses a dedicated `'fluorescence'` theme-token variant, so exporting with the preview
  on no longer poisons the cached theme colors for later exports.
- The skin record can no longer become a reporter target; a target's signal opacity no longer
  overrides the lens and chorion role clamps.
- `crypto.randomUUID` calls in the reporter panel fall back on a plain-http host (`npm run
  dev:lan`).
- The reporter panel's time fields keep focus across a blur commit instead of remounting.
- Presentation and embed modes hide the reporter legend and dark background instead of forcing
  them on with no way to turn them off.
- The lab panel is registered as an overlay, so Escape closes it and clears the selection again.
- The light theme no longer lights a dark reporter-preview scene.
- Stepping to a bookmark recorded before the reporter preview was on keeps the live rule set
  instead of replacing it with an empty one.
- Renamed the feature from "Enhancer preview" to "Reporter preview" throughout the app, the
  README and the decision record: the panel predicts nothing, and "enhancer" implied a
  cis-regulatory prediction it does not make.
- Soft-tissue classes (wall, veil, tissue) render with a matte finish (`roughness` 0.8,
  `envMapIntensity` 0.15); skin and every other structure are unchanged from AR-26.

## [0.1.0] - 2026-09-08

First release. The date matches `date-released` in `CITATION.cff`.

### Added

- An interactive 3D viewer of zebrafish development on a time axis from 0 hpf (the 1-cell
  zygote) to 4320 hpf (the adult at 180 dpf). Every shape is procedural and schematic; the
  viewer holds no imaging volume, no segmentation and no measured mesh.
- 221 anatomy records in 15 systems (`src/data/structures/`). 173 carry geometry and draw; 48 are
  group nodes that organise the tree without drawing.
- The 44 ZFS stages, the 10 periods and 56 landmark events (`src/data/stages.json`), and a growth
  track through the standard-length milestones of Parichy et al. 2009 and Singleman and Holtzman
  2014.
- An info card per structure: the ZFA term, its definition, the ZFIN stage window, the model
  window, the sizes with their sources, and a "Why the model differs" disclosure when the two
  windows disagree.
- Per-row estimate flags. 487 of the 555 size rows are estimates and the card says so on each
  one.
- Search over names, synonyms, ZFA ids and the full ZFA vocabulary of ZFIN (3113 terms), a
  systems rail with hide and solo per system, x-ray, a section plane, a dissect slider, six view
  presets, a dark and a light theme, PNG export, presentation mode with slide kits, an embed mode
  and a share link that carries the whole viewer state in the address bar.
- `npm run validate`: about thirty rules over the records, the keyframes and the built geometry,
  checked against the ZFIN snapshot in `data/zfin/` (ZFA and ZFS release 2026-07-16).
- Generated provenance: `docs/SOURCES.md` (`npm run sources`), `public/ATTRIBUTION.md`
  (`npm run attribution`) and `public/THIRD-PARTY-NOTICES.txt` (`npm run notices`). The gate runs
  all three in check mode.
- A single-file build (`npm run bundle`) that opens offline in any browser, attached to the
  release and uploaded by CI on every push.

### Known limits

- The geometry is a teaching and talk aid, not a validated model for quantitative research. No
  independent anatomist has reviewed it.
- The adult frame is the least finished part of the model. It draws two stripes where the adult
  fish has five, and it draws the notochord as a continuous rod along the whole body.
- Motion between keyframes is a smoothstep interpolation of hand-set parameters. The viewer does
  not simulate morphogenesis.

### Method

The author built this release over three days with AI coding agents (Claude Code) working under
his direction and review. `README.md`, "How this was built", says which numbers a human checked
and which nobody checked.

[Unreleased]: https://github.com/yangjun9095/zebrafish-3D-atlas/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yangjun9095/zebrafish-3D-atlas/releases/tag/v0.1.0
