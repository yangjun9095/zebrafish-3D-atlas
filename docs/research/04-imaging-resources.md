# 04. Imaging resources and anatomical atlases

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-06. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Scope: zebrafish 2D and 3D imaging resources and atlases. Each one can (a) give real 3D geometry for the viewer, (b) give reference images for the info panel, or (c) calibrate the procedural shapes. I also list two mouse and human embryo atlases as user-interface precedents.

Method: I fetched each URL on 2026-09-06 from the HPC login host. Several hosts refused connections or presented a certificate that the fetch client rejected. Section 6 records the result for each URL. A fact I could not confirm carries the mark "(unverified)".

Abbreviations: hpf, hours post fertilization. dpf, days post fertilization. mpf, months post fertilization. SL, standard length. OPT, optical projection tomography. CT, computed tomography. MRI, magnetic resonance imaging. ssEM, serial-section electron microscopy. ZFA, Zebrafish Anatomy Ontology. ZFS, Zebrafish Stage Ontology. CC, Creative Commons.

## 1. Master table

"Ship" means the license lets us convert and redistribute the asset inside the static site. "Link" means we can show a thumbnail or a link only. "No" means the license or the offline status blocks use.

| # | Resource | Maintainer | Stages | Modality | Data type | License | Size | Ship | Use for us |
|---|----------|------------|--------|----------|-----------|---------|------|------|------------|
| 1 | Zebrahub imaging | CZ Biohub SF, Royer lab | 50% epiboly onward (end stage unverified) | light-sheet time-lapse | OME-Zarr volumes, cell tracks (CSV) | not stated on site or bucket; paper CC BY | ZSNS001: 791 time points, about 3.7 TB uncompressed (estimate) | Ask | whole-embryo surface per time point, 5 to 24 hpf |
| 2 | Zebrahub scRNA-seq | CZ Biohub SF | 10 hpf to 10 dpf, 10 stages | sequencing | h5ad | CC BY 4.0 | 3.2 GB | Yes | later omics link per structure |
| 3 | Z-Brain | Engert lab, Harvard | 6 dpf | confocal | HDF5 label stacks, MATLAB masks, NRRD reference | unknown (no LICENSE file) | 4.5 GB | Link | 294 brain regions at 6 dpf |
| 4 | mapzebrain | Baier lab, MPI | 6 dpf | confocal | registered stacks, region masks, neuron traces; BrainGlobe OBJ meshes | unknown (site did not render for my fetch) | not captured | Link | brain region meshes at 6 dpf |
| 5 | ViBE-Z | Ronneberger, Freiburg | 72 hpf | confocal | 3D standard brain, 73 regions | unknown | not captured | No (host offline) | none |
| 6 | AZBA | Kenney lab, Wayne State | adult, 15 to 16 weeks | tissue clearing + light-sheet | NIfTI averages and label volume, 203 regions | CC0 1.0 (Dryad) | 2.63 GB | Yes | adult brain region meshes |
| 7 | Penn State Zebrafish Lifespan Atlas | Cheng lab, Penn State | 48 hpf to 12 mpf | H&E histology, micro-CT | virtual slides (SVS) | copyright Penn State, citation required, no open license | 555 slides | Link | body outlines and organ positions per age |
| 8 | Cheng lab X-ray histotomography | Cheng lab, Penn State | 2, 3, 4, 5 dpf; 33 dpf | synchrotron micro-CT | 8-bit reconstructions | CC0 1.0 (Dryad); paper CC BY | 25.6 GB | Yes | larval head geometry; juvenile calibration |
| 9 | Leiden 3D Atlas of Zebrafish Development (TDR-3Dbase) | Verbeek group, LIACS | 24, 36, 48, 72 hpf | serial sections (unverified) | 3D models, 15 to 33 structures each | none stated | not captured | Link | structure positions at 4 stages |
| 10 | Digital Fish Library | UCSD | adult fishes | MRI | slice movies, renderings | all rights reserved | not applicable | No | none; zebrafish absent |
| 11 | ZFIN staging series and image pages | ZFIN, Univ. of Oregon | zygote to adult | drawings, photos | web images | data CC BY 4.0; Kimmel 1995 figures copyright Wiley | not applicable | Data yes, figures no | ZFA and ZFS text; link to stage pages |
| 12 | Wikimedia Commons | community | 2-cell to adult | drawings, photos, videos | SVG, JPG, PNG, OGV | CC BY 4.0, CC BY-SA, CC0, public domain (per file) | small | Yes (per file) | info-card images |
| 13 | Bioimages (Vanderbilt) | Steven J. Baskauf | 1-cell to adult, 16 images | bright-field photos | JPG | CC BY 4.0 | small | Yes | info-card photos; outline calibration |
| 14 | IDR idr0068 | EMBL-EBI IDR | 4 to 18 hpf | light-sheet time-lapse | OME-TIFF and OME-Zarr | CC BY 4.0 | 0.17 TB | Yes | surface per time point, gastrula to segmentation |
| 15 | BioImage Archive S-BIAD1405 | Gilmour lab, Univ. of Zurich | 12 to 72 hpf | multi-view light-sheet | CZI, IMS | CC BY 4.0 | not captured | Yes | whole-embryo surfaces at fixed stages |
| 16 | BioImage Archive S-BIAD840 | Barry (Crick), Devenport (Princeton) | 2.5 to 45.5 hpf, 15 min interval | bright-field time-lapse | images | CC0 | not captured | Yes | 2D outline per hpf |
| 17 | BioImage Archive S-BIAD531 | Barry (Crick) | 4.5 to 17.5 hpf | bright-field | images | not stated; EMBL-EBI terms | not captured | Yes | 2D outline per hpf |
| 18 | Hildebrand 2017 ssEM | Engert lab and collaborators | 5.5 dpf | ssEM | PNG tile pyramid (CATMAID) | not captured | 2.7 TB | Link | none for shapes |
| 19 | Keller lab Digital Embryo | Janelia | first 24 h (Keller 2008) | light-sheet | image stacks, tracks | unknown | 10 TB (Keller 2008) | No (site unreachable) | none |
| 20 | Janelia figshare, Ahrens whole-brain | Janelia | larva | light-sheet functional | ZIP | CC BY-NC 4.0 | 59.76 GB | No | none |
| 21 | Allen Brain Map | Allen Institute | none for zebrafish | none | none | not applicable | not applicable | No | none |
| 22 | Sketchfab CC BY models | individual authors | adult; 5 dpf vasculature | micro-CT, confocal | downloadable meshes | CC BY 4.0 (5 models) | 2 k to 1.1 M faces | Yes | adult body, vertebrae, jaws, 5 dpf head vessels |
| 23 | NIH 3D | NIH | unknown | unknown | STL and others | per entry | unknown | Unverified | none yet |
| 24 | Daniocell | Farrell lab, NICHD | 3.3 to 120 hpf, 62 stages | scRNA-seq | GEO FASTQ, counts, Seurat RDS | not stated | not captured | Link | omics link |
| 25 | ZSCAPE | Trapnell lab, UW | 18 to 96 hpf, 19 time points | scRNA-seq | GitHub, downloads | not stated | not captured | Link | omics link |
| 26 | Zebrafish Brain Browser (ZBB) | Burgess lab, NICHD | 6 dpf | confocal | NIfTI reference brains; ZBB2 desktop | CC BY 4.0 (Zenodo) | 4.5 GB + 5.9 GB | Yes | 6 dpf brain surface |
| 27 | FishNet | Bryson-Richardson, Monash | 24 to 120 hpf; 5 to 17 mm SL | OPT | 3D models, 36,000 images | paper CC BY 2.0; site status unverified | not captured | Figures yes | body outline 24 hpf to 17 mm |
| 28 | DigiMorph Danio rerio | UTCT, UT Austin | adult | micro-CT | slice movies, CT data 0.2 GB | personal educational use only | 0.2 GB | No | adult skeleton proportions (view only) |
| 29 | Isogai vascular atlas | Weinstein lab, NICHD | 1 to 7 dpf | confocal microangiography | web images | citation requested; license unverified | not captured | Link | vessel layout per day |
| 30 | 3D Atlas of Human Embryology | AMC Amsterdam | Carnegie 7 to 23 | histology reconstructions | 3D-PDF, sections, labels | copyright AMC; no open license | not captured | UX precedent | stage-per-model UI |
| 31 | eMouseAtlas | MRC HGU Edinburgh | Theiler stages | OPT, histology | 3D models, ontology | CC BY (version not stated) | not captured | UX precedent | stage selector with ontology |

## 2. Per-resource notes

### 2.1 Zebrahub imaging

- URL: https://zebrahub.sf.czbiohub.org/ . The old address https://zebrahub.ds.czbiohub.org returns a 301 redirect to the new host.
- Maintainer: the Royer group at the Chan Zuckerberg Biohub San Francisco (site text).
- Imaging page: https://zebrahub.sf.czbiohub.org/imaging lists seven light-sheet time-lapse datasets with cell tracks: ZMNS001 and ZMNS002 (OpenSiMView), and ZSNS001, ZSNS002, ZSNS001_tail, ZSNS003, ZSNS004, ZSNS005 (DaXi).
- Download: https://public.czbiohub.org/royerlab/zebrahub/imaging/single-objective/ holds six OME-Zarr stores and five track files. ZSNS001_tracks.csv is 849 MiB, ZSNS004_tracks.csv is 360 MiB (directory listing).
- ZSNS001 metadata (.zattrs): axes t, c, z, y, x; three pyramid levels; voxel size 1.24 x 0.439 x 0.439 µm (z, y, x); one channel named "fused"; uint16. Level 2 shape is [791, 1, 112, 544, 606] (.zarray). Level 0 therefore holds 791 time points of about 448 x 2176 x 2424 voxels (my estimate from the 4x scale factor). That is about 4.7 GB per time point and 3.7 TB uncompressed for the whole series (my arithmetic, unverified against the bucket).
- Stages: a Node blog post (https://thenode.biologists.com/zebrahub-illuminating-zebrafish-embryogenesis-through-light-sheet-microscopy-and-scrna-sequencing/research/) says the time-lapse starts at 50% epiboly. The end stage and the time interval were not on any page I fetched (unverified).
- License: the bucket has no LICENSE or README file. The data page (https://zebrahub.sf.czbiohub.org/data) asks for a citation and states no license. Europe PMC lists the Cell paper (Lange et al. 2024, DOI 10.1016/j.cell.2024.09.047) with license "CC BY". The single-cell dataset on figshare (article 20510367) is CC BY 4.0. The imaging volumes therefore have no explicit license.
- Use for us: a fused nuclear channel from 50% epiboly onward gives a whole-embryo surface at every time point. The repository owner is at the Biohub and appears in the author list (Kim YJ). Ask the Royer group for an explicit CC BY 4.0 statement on the imaging bucket before we ship any derived mesh.

### 2.2 Zebrahub single-cell atlas

- Download: figshare project 146247, dataset "Zebrahub single cell dataset" (https://api.figshare.com/v2/articles/20510367). License CC BY 4.0. Twelve zip files with h5ad objects per stage (10, 12, 14, 15, 16, 19, 24 hpf; 2, 3, 5, 10 dpf) and one full atlas of 1.59 GB. Total 3.2 GB. The description reports 120,671 cells.
- Use for us: a later "genes in this structure" tab. The stage list aligns with our time axis.

### 2.3 Z-Brain

- URLs: https://engertlab.fas.harvard.edu/Z-Brain/ (connection refused from this host), https://github.com/owenrandlett/Z-Brain (loads), https://zebrafishexplorer.zib.de/ (viewer; certificate error from this host).
- Content: 6 dpf larval brain, 294 regions, 29 registered labels (GitHub README). Files: AnatomyLabelDatabase.hdf5 (about 4.5 GB, 0.798 x 0.798 x 2 µm), MaskDatabase.mat, Ref20131120pt14pl2.nrrd (GitHub README).
- License: the repository lists no LICENSE file. Treat as all rights reserved until the authors state otherwise.
- Citation: Randlett O et al. (2015) Nature Methods, DOI 10.1038/nmeth.3581.
- Use for us: region names and positions for the 6 dpf brain. We cannot redistribute masks without permission.

### 2.4 mapzebrain

- URL: https://mapzebrain.org/ . The site is a JavaScript application. Every fetch returned only the title, so I could not read its download or license pages. https://api.mapzebrain.org/ returned 404. https://fishatlas.neuro.mpg.de/ failed on a certificate error.
- Content: 6 dpf larval brain (Kunst M et al. 2019, Neuron, DOI 10.1016/j.neuron.2019.04.034; not open access). Shainer et al. 2023 (Science Advances, PMC9946346, CC BY-NC) states "All the data are publicly available and free to download through the mapzebrain website". The same paper lists registered images, about 4,300 single neurons, transgenic lines, and curated region segmentations.
- BrainGlobe: the package mpin_zfish_1um_v1.0 exists on https://gin.g-node.org/BrainGlobe/atlases . BrainGlobe packages hold a reference volume, an annotation volume, a structures.json hierarchy, and one OBJ mesh per region (BrainGlobe README). BrainGlobe states that each atlas keeps the license of its creator.
- License: unknown. Ask the Baier lab.
- Use for us: brain region meshes at 6 dpf if the license allows. The Légaré review counts about 70 regions (Légaré A et al. 2023, Neurophotonics 10(4):044409, PMC10541682).

### 2.5 ViBE-Z

- URL: http://vibez.informatik.uni-freiburg.de/ . DNS lookup failed on 2026-09-06 (ENOTFOUND). The BIII entry (https://biii.eu/vibe-z) still lists the site and gives license "unknown".
- Content: 72 hpf standard brain with 73 regions (Légaré review). Citation: Ronneberger O et al. (2012) Nature Methods, DOI 10.1038/nmeth.2076.
- Use for us: none while the host is offline.

### 2.6 AZBA, adult zebrafish brain atlas

- URLs: https://azba.wayne.edu/ (loads; viewer needs JavaScript), Dryad https://doi.org/10.5061/dryad.dfn2z351g , eLife https://elifesciences.org/articles/69988 .
- Content: 17 AB fish (8 female, 9 male), 15 to 16 weeks old, tissue clearing plus light-sheet, 4 µm isotropic averages, 203 regions (eLife article). Dryad files: 12 marker averages as .nii.gz (for example 20180219_topro_average_2020.nii.gz, 383.98 MB), the label volume 2021-08-22_AZBA_segmentation.nii.gz (3.42 MB), and label text files. Total 2,632,157,569 bytes (Dryad API).
- License: Dryad API reports https://spdx.org/licenses/CC0-1.0.html . The eLife article is open access; eLife publishes under CC BY 4.0 (version not captured in my fetch, unverified).
- BrainGlobe: azba_zfish_4um versions 1.0 to 1.2 on GIN, with OBJ meshes per region.
- Use for us: the only adult-stage 3D label set with a public-domain dedication. We can run marching cubes on the 203 labels and ship the adult brain.

### 2.7 Penn State Zebrafish Atlas and Lifespan Atlas

- URLs: https://bio-atlas.psu.edu/zf/ (loads), http://zfatlas.psu.edu (connection refused from this host), https://bio-atlas.psu.edu/zf/about.php (loads).
- Content: 555 hematoxylin and eosin slides scanned at 40x; ages 48 hpf, 3 to 13 dpf, 14 to 89 dpf, and up to 12 mpf; specimen lengths 3.1 mm to 14 mm; sagittal, coronal, and transverse planes; micro-CT images as a secondary resource (site text). Slides are pyramidal SVS files viewed in a browser (about page).
- License: "© 2007-2013 The Pennsylvania State University". The about page asks users to cite the frame link. It also asks for credit to http://zfatlas.psu.edu/, NIH grant 5R24 RR01744, the Jake Gittlen Cancer Research Foundation, and the PA Tobacco Settlement Fund. No open license.
- Future: Penn State Health announced a 4-year NIH grant in September 2025 for a 3D histotomography atlas led by Khai C. Ang with Keith Cheng and John Postlethwait (https://pennstatehealthnews.org/2025/09/researchers-secure-nih-grant-to-create-3d-zebrafish-atlas/).
- Use for us: measure organ positions and body proportions from the slide viewer at each age. Link to frames; do not copy images.

### 2.8 Cheng lab X-ray histotomography (Ding et al. 2019)

- Article: Ding Y et al. (2019) eLife 8:e44898, https://elifesciences.org/articles/44898 . PMC6559789 quotes the license: "This article is distributed under the terms of the Creative Commons Attribution License".
- Content: wild-type Ekkwill and huli hutu larvae at 2, 3, 4, 5 dpf at 0.743 µm isotropic voxels; juvenile at 33 dpf at 1.43 µm (article).
- Data: Dryad doi:10.5061/dryad.4nb12g2, 25.6 GB, CC0 1.0 (Dryad API). The Dryad description covers registered and unregistered 8-bit reconstructions of larval heads plus scripts. Raw projections of about 100 GB per specimen are available on request. The ViewTool at http://3D.fish reset the connection during my fetch.
- Use for us: larval head geometry at 2 to 5 dpf (brain, eyes, otic vesicles, jaw) from a public-domain volume. The 33 dpf juvenile figures in the CC BY article give whole-body proportions.

### 2.9 Leiden 3D Atlas of Zebrafish Development (TDR-3Dbase)

- URL: https://bio-imaging.liacs.nl/ZFAtlasServer/ redirects to http://bio-imaging.liacs.nl/TDR/EntranceServlet?rep_type=zf_atlas (loads).
- Content: 3D reconstruction models of embryos at 24, 36, 48, and 72 hpf with 15 to 33 named structures per model, in normal and low resolution. Browsing uses the Developmental Anatomy Ontology of Zebrafish (DAOZ). Viewing uses a Java applet or a TDRViewer JNLP application. Last update March 2012 (page text). The page does not state the modality; the group's method used serial histological sections (unverified).
- License: none stated. Citation: the group's database paper is Belmamoune M, Verbeek FJ (2008) J Integr Bioinform, PMID 20134060 (Europe PMC). A dedicated atlas paper was not confirmed (unverified).
- Use for us: the structure list per stage is a useful cross-check for our keyframe table. The Java delivery blocks mesh export.

### 2.10 Digital Fish Library

- URL: https://www.digitalfishlibrary.org/ (loads). MRI of 276 species from the Scripps collection (home page). The species list holds Cyprinidae with Cyprinus carpio and Carassius auratus and no Danio rerio (library page). "Copyright © 2009 Digital Fish Library. All Rights Reserved."
- Use for us: none.

### 2.11 ZFIN staging series, images, and terms

- Staging page: https://zfin.org/zf_info/zfbook/stages/index.html (loads). It carries the notice "Embryonic stages are modified from Kimmel et al., 1995. Developmental Dynamics 203:253-310. Copyright ©1995 Wiley-Liss, Inc. Reprinted only by permission of Wiley-Liss".
- Terms: https://zfin.org/warranty.html redirects to https://zfin.atlassian.net/wiki/spaces/general/pages/1942160112 . That page states "ZFIN data and data annotations are licensed under a Creative Commons Attribution 4.0 International License". It also states "ZFIN software has a BSD 3-clause license". The older assessment at https://reusabledata.org/zfin.html (custom restrictive license, score 2/10) describes a previous version of the terms.
- Images: figure images on ZFIN publication pages carry the copyright of their source. The CC BY 4.0 statement covers data and annotations. Treat every ZFIN image as not shippable unless its own page says otherwise.
- Atlas list: https://zfin.atlassian.net/wiki/display/general/Anatomy+Atlases+and+Resources lists 14 resources, including the ones in this document.
- Use for us: ZFA and ZFS terms, definitions, and stage windows under CC BY 4.0. Link to stage pages for photos.

### 2.12 Wikimedia Commons

Files checked through the Commons API on 2026-09-06 (license from extmetadata):

| File | License | Author | Content |
|------|---------|--------|---------|
| 202210 Zebrafish 2-cell embryo.svg | CC BY 4.0 | DBCLS | icon, 1000 x 1000 |
| 202210 Zebrafish 8-cell embryo.svg | CC BY 4.0 (same series; unverified individually) | DBCLS | icon |
| 202210 Zebrafish blastula embryo.svg | CC BY 4.0 | DBCLS | icon |
| 202210 Zebrafish early gastrula embryo.svg | CC BY 4.0 | DBCLS | icon |
| 202210 Zebrafish early somite embryo.svg | CC BY 4.0 | DBCLS | icon |
| 202210 Zebrafish late somite embryo.svg | CC BY 4.0 | DBCLS | icon |
| Embryo of Zebrafish.jpg | CC BY 4.0 | Marco Boschin | acridine orange micrograph, 1280 x 960 |
| Zebrafish-Embryo-dark-field.jpg | CC BY 2.5 | Giudicelli F et al. | dark-field embryo, 3189 x 1330 |
| Zebrafish embryos.png | CC BY 2.5 | Adam Amsterdam, MIT | pigment mutant comparison, 650 x 489 |
| CSIRO ScienceImage 7598 larval zebra.jpg | CC BY 3.0 | CSIRO | larva, 1852 x 1200 |
| Zebrafish Cycle.png | CC BY 3.0 | IlluScientia | life cycle drawing, 695 x 463 |
| Zfish midblastula stage embryo.jpg | CC0 | Celine Santiago | sphere stage cartoon, 1118 x 1102 |
| Zebrafish95-300.jpg | public domain | Shawn Burgess, NHGRI | adult photo, 1172 x 381 |
| Zebrafish Developmental Stages.tiff | CC BY-SA 4.0 | Ed Hendel | 0 h to adult panel, 880 x 1300 |
| Cleavage.png | CC BY-SA 4.0 | Gilbert SF | 1-cell to 64-cell drawing |
| Epiboly.png | CC BY-SA 4.0 | Gabriel Antonini | epiboly drawing |
| Life cycle.png | CC BY-SA 4.0 | IISER Bhopal | life cycle |
| Zebrafish embryo.jpg, Young zebrafish.jpg | CC BY-SA 4.0 | Nikita Tsyba, Azamat Bashabayev | pre-hatch and hatched fish |

Category "Danio rerio embryos" holds 39 files; category "Developmental biology in Danio rerio" holds 7 files (API counts). CC BY-SA files require share-alike on adaptations; keep them unmodified or avoid them.

### 2.13 Bioimages, Vanderbilt (Steven J. Baskauf)

- URL: https://bioimages.vanderbilt.edu/pages/zfish-devel.htm (loads). Sixteen photos: 1-, 2-, 4-, 8-cell; early, mid, late blastula; 50% epiboly; shield; gastrula; 24 hour; one, two, three day; hatched three day; adults (page captions).
- License: the metadata page https://bioimages.vanderbilt.edu/baskauf/30547.htm states Creative Commons Attribution 4.0 International and asks for the credit "Steven J. Baskauf http://bioimages.vanderbilt.edu/".
- Use for us: info-card photos for cleavage, blastula, gastrula, and 1 to 3 dpf. The chorion is present in early images; the scale bar is absent (unverified), so use them for shape, not size.

### 2.14 IDR idr0068 (Shah et al. 2019)

- URL: https://idr.openmicroscopy.org/study/idr0068/ (loads). Title "Multi-scale imaging and analysis identifies pan-embryo cell dynamics of germlayer formation in zebrafish", DOI 10.1038/s41467-019-13625-0.
- Content: light-sheet time-lapse from 4 to 18 hpf (IDR studies page). The study holds one 5D image of 829,080 planes and 0.17 TB. Average dimensions are 658 x 658 x 658 voxels, 3 channels, and 420 time points. That gives a 2-minute interval over 14 hours (my arithmetic).
- License: CC BY 4.0 (study page and IDR about page). Download by FTP, Globus, or the JSON API; IDR serves OME-Zarr (about page).
- Use for us: a nuclear channel from sphere stage to 18 somites. This covers the epiboly and early segmentation window that no other CC BY resource covers.

### 2.15 BioImage Archive datasets

Default terms: "Where no license is stated, data are available under the EMBL-EBI Terms of Use which places no restrictions on use or redistribution" (https://www.ebi.ac.uk/bioimage-archive/help-faq/).

| Accession | Content | Stages | Format | License |
|-----------|---------|--------|--------|---------|
| S-BIAD1405 | multi-view light-sheet of whole embryos, DAPI plus markers, Zeiss Z.1, four angles (Brambach M, Gilmour D, Univ. of Zurich) | 12 to 72 hpf | CZI, IMS | CC BY 4.0, DOI 10.6019/S-BIAD1405 |
| S-BIAD840 | bright-field time-lapse, 4x, every 15 min, Nikon Ti-E (Barry D, Devenport D) | 2.5 to 45.5 hpf | images | CC0 |
| S-BIAD531 | bright-field, every 15 min, machine-learning staging (Barry D) | 4.5 to 17.5 hpf | images | not stated |
| S-BIAD815 | tailbud light-sheet, in toto tracking (Attardi et al. 2018) | 18 to 21 somites onward | OME-NGFF | CC BY 4.0 |

The search at https://www.ebi.ac.uk/biostudies/api/v1/BioImages/search?query=zebrafish returned 50 hits; the four above are the whole-embryo or staging sets. S-BIAD1405 is the strongest candidate for fixed-stage whole-embryo surfaces between 12 and 72 hpf.

### 2.16 Hildebrand et al. 2017 whole-brain ssEM

- Data: http://zebrafish.link/hildebrand16 , 5.5 dpf larva, PNG tile pyramid on AWS with CATMAID, about 2.7 TB (PMC5594570 data statement). Voxel sizes 56.4 x 56.4 x 60 nm and 18.8 x 18.8 x 60 nm.
- License: not captured (author manuscript). Use for us: none for body shapes.

### 2.17 Keller lab Digital Embryo

- URL: https://www.digital-embryo.org/ now presents a *.janelia.org certificate, and the fetch failed. The Keller lab research and software pages on janelia.org list no downloadable zebrafish dataset. Keller et al. 2008 (Science, DOI 10.1126/science.1162493) described a 10 TB, first-24-hour dataset (search summary). Status: unverified; treat as unavailable.

### 2.18 Janelia figshare, Ahrens lab

- https://api.figshare.com/v2/articles/7272617 : "Whole-brain light-sheet imaging data", 18 larval fish, functional recordings, 59.76 GB, CC BY-NC 4.0. Not an anatomy resource, and the NC clause blocks reuse in a project with commercial-use freedom.

### 2.19 Allen Institute

- https://brain-map.org/ lists mouse, human, and non-human primate. No zebrafish resource.

### 2.20 Sketchfab

Sketchfab API search (type=models, downloadable=true, q=zebrafish) returned seven models on 2026-09-06:

| Model | Author | License | Vertices / faces | uid |
|-------|--------|---------|------------------|-----|
| Zebrafish (High Oblong) | jsgauthier | CC BY 4.0 | 2,034 / 4,064 | 337fb9dbe0b947c3ac509f9e271d1aa2 |
| Zebrafish vertebrae | Francesco_Turci | CC BY | 280,352 / 560,422 | 7565378bdb4848d686527e0b6d153564 |
| Zebrafish Jaw Wildtype | yushiyang | CC BY | 215,157 / 429,757 | 4f9bcc44a0864500b1b5721acdf4ab21 |
| Zebrafish Jaw Mutant | yushiyang | CC BY | 181,883 / 363,261 | 4bb1ef46883f442181dd59c932bc175b |
| 5dpf zebrafish cephalic vasculature | Vishruth.Venkat | CC BY 4.0 | 565,030 / 1,129,836 | a491b7a71a524f33bd93e4ba0d75edf6 |
| Zebrafish Jaw | Francesco_Turci | CC BY-NC-SA | 281,694 / 574,256 | f5684fc39f2149aaa7830431ab15aca0 |
| Fish feeder Version 2 | michaelaxelsson | CC BY | equipment, not anatomy | 0f08d672a35e4109ac1414a993825ed2 |

The "High Oblong" model carries the tags ct-scan and tomography and no description; its stage is not stated. The same author's staged models (21 somites, 72 hours, 10 dpf; micro-CT at the Canadian Light Source) are Standard or Editorial store licenses and are not free downloads. Searches for "zebrafish embryo" and "zebrafish larva" with downloadable=true returned no models.

### 2.21 NIH 3D

- https://3d.nih.gov/ loads and describes 12,000 assets with entries at /entries/3DPX-... . The search pages need JavaScript, and my fetch showed no zebrafish entry. Status: unverified.

### 2.22 Daniocell and ZSCAPE

- Daniocell: https://daniocell.nichd.nih.gov (loads). 62 stages, 3.3 to 120 hpf; GEO GSE223922 (FASTQ and counts); Seurat v4 .rds; no license stated; cite PMID 37995681.
- ZSCAPE: https://cole-trapnell-lab.github.io/zscape/ (loads). 18 to 96 hpf in 19 time points; about 3 million cells; code at https://github.com/cole-trapnell-lab/sdg-zfish ; no license stated; Saunders, Srivatsan et al. (2023) Nature.

### 2.23 Zebrafish Brain Browser

- URLs: http://zbbrowser.com (connection refused from this host); online viewer http://vis.arc.vt.edu/projects/zbb/ (loads; Virginia Tech and NICHD); Burgess lab software page https://www.nichd.nih.gov/research/atNICHD/Investigators/burgess/software (loads).
- Data: reference brains, Zenodo 10.5281/zenodo.7130703, 18 NIfTI files, 4.5 GB, 1 µm isotropic (2 µm for R2 files), CC BY 4.0. ZBB 2.0 desktop, Zenodo 10.5281/zenodo.2560759, 5.9 GB, IDL Virtual Machine, 264 transgenic and enhancer trap lines, CC BY 4.0.
- Citations: Marquart GD et al. (2015) Front Neural Circuits; Marquart GD et al. (2017) GigaScience 6:1-15; Tabor KM et al. (2019) eLife 8:e42687.
- Use for us: a 6 dpf whole-brain surface from the pan-neuronal (huC) reference volume under CC BY 4.0.

### 2.24 FishNet

- Paper: Bryson-Richardson RJ et al. (2007) BMC Biology 5:34, PMC2031877, license "Creative Commons Attribution License (http://creativecommons.org/licenses/by/2.0)".
- Content: OPT at 24, 48, 72, 96, and 120 hpf, then fish sampled by length from 5 to 17 mm; more than 36,000 images, more than 1,500 annotated; projections at 1360 x 1024 pixels. Figure 2 shows a volume rendering of a 15 mm fish; Figure 5 shows a 10 mm fish skeleton (PMC text).
- Site: http://www.fishnet.org.au redirects to https://zfap.org/ , which failed on a certificate error from this host. http://zebrafish.anatomyportal.org/ failed the same way. Status: unverified.
- Use for us: the CC BY 2.0 figures give body outlines from 24 hpf to 17 mm SL.

### 2.25 DigiMorph Danio rerio

- https://digimorph.org/specimens/Danio_rerio/ (loads). Adult skeleton, 914 CT slices, 0.0091 mm slice thickness, 0.0064 mm spacing, 6.8 mm field of reconstruction, CT data 0.2 GB, STL "n/a".
- Terms (https://digimorph.org/aboutdigimorph.phtml): "The images may be used for the personal education of website visitors". The same page states "Any commercial reproduction, redistribution, publication, or other use of the website content ... is prohibited unless pursuant to a written agreement".
- Use for us: view-only reference for adult skeleton proportions.

### 2.26 Isogai vascular atlas

- https://zfish.nichd.nih.gov/Intro%20Page/intro1.html (loads). Confocal microangiograms, 1 to 7 dpf, vessel names and wiring diagrams. Citation requested: Isogai S, Horiguchi M, Weinstein BM (2001) Dev Biol 230:278-301. License not stated. Use for us: vessel layout per day for the circulatory keyframes.

### 2.27 3D Atlas of Human Embryology (UX precedent)

- https://www.3dembryoatlas.com (loads). Carnegie stages 7 to 23 (15 to 60 days), 14 3D-PDF files, section stacks, label files; iOS app; "© 2016 by Department MB"; no open license. Citation: de Bakker BS et al. (2016) Science 354:aag0053.
- UX lesson: one reconstructed model per stage, chosen from a stage list. The user does not scrub time. Our slider needs interpolation between such per-stage models or a procedural fallback.

### 2.28 eMouseAtlas (UX precedent)

- https://www.emouseatlas.org/emap/home.html (loads). Theiler stages, an "EMA Stage Selector", 3D models, OPT volumes, and the EMAPA ontology. "All site content, except where otherwise noted, is licensed under a Creative Commons Attribution License" (version not stated). An April 2023 notice reports five years without funding and possible decommissioning.
- UX lesson: stage selector plus ontology tree plus 3D model is the pattern we want; the stage change is a discrete swap.

## 3. What we can legally ship

Assets with CC0, public domain, or CC BY licenses that we can convert to glTF or PNG and include in the static site. Each row gives the attribution text to place in `public/ATTRIBUTION.md` and in the info card.

| Asset | Stage | License | Conversion | Attribution text |
|-------|-------|---------|------------|------------------|
| AZBA label volume and TO-PRO average | adult | CC0 1.0 | marching cubes per label (203 regions) to glTF | "AZBA adult zebrafish brain atlas. Kenney JW, Steadman PE, Young O, et al. (2021) eLife 10:e69988. Data: Dryad https://doi.org/10.5061/dryad.dfn2z351g (CC0 1.0)." |
| Ding 2019 larval head reconstructions | 2 to 5 dpf | CC0 1.0 | threshold plus manual labels, marching cubes to glTF | "X-ray histotomography data from Ding Y, Vanselow DJ, Yakovlev MA, et al. (2019) eLife 8:e44898. Data: Dryad https://doi.org/10.5061/dryad.4nb12g2 (CC0 1.0)." |
| ZBB reference brains (huC, vglut, gad1b) | 6 dpf | CC BY 4.0 | threshold huC volume, marching cubes to glTF | "Reference brains for registration to Zebrafish Brain Browser, Harold Burgess, NICHD. https://doi.org/10.5281/zenodo.7130703 (CC BY 4.0). Marquart GD et al. (2017) GigaScience 6:1-15." |
| S-BIAD1405 whole-embryo light-sheet | 12 to 72 hpf | CC BY 4.0 | fuse views, threshold DAPI, marching cubes to glTF | "Brambach M, Gilmour D, et al. Whole-organism imaging of zebrafish development focussing on cadherin expression and tissue diversity. BioImage Archive S-BIAD1405, https://doi.org/10.6019/S-BIAD1405 (CC BY 4.0)." |
| IDR idr0068 nuclear time-lapse | 4 to 18 hpf | CC BY 4.0 | pick time points per ZFS stage, threshold, marching cubes to glTF | "Shah G, et al. (2019) Nature Communications, https://doi.org/10.1038/s41467-019-13625-0 . Image Data Resource idr0068 (CC BY 4.0)." |
| S-BIAD840 bright-field time-lapse | 2.5 to 45.5 hpf | CC0 | 2D outline per 15 min frame; PNG for info cards | "Barry D, Devenport D. Automated staging of zebrafish embryos with deep learning. BioImage Archive S-BIAD840 (CC0)." |
| Bioimages photos | 1-cell to adult | CC BY 4.0 | resize to 800 px PNG | "Steven J. Baskauf http://bioimages.vanderbilt.edu/ (CC BY 4.0)." |
| DBCLS stage icons on Commons | 2-cell to late somite | CC BY 4.0 | use SVG as is | "DataBase Center for Life Science (DBCLS), '202210 Zebrafish [stage] embryo', Wikimedia Commons (CC BY 4.0)." |
| Zebrafish95-300.jpg | adult | public domain | use as is | "Shawn Burgess, NHGRI, via Wikimedia Commons (public domain)." |
| Sketchfab "Zebrafish (High Oblong)" | adult (unverified) | CC BY 4.0 | glTF download from Sketchfab | "'Zebrafish (High Oblong)' by JS Gauthier, https://sketchfab.com/3d-models/zebrafish-high-oblong-337fb9dbe0b947c3ac509f9e271d1aa2 (CC BY 4.0)." |
| Sketchfab "Zebrafish vertebrae" | adult | CC BY | glTF download, decimate | "'Zebrafish vertebrae' by Francesco_Turci, Sketchfab uid 7565378bdb4848d686527e0b6d153564 (CC BY)." |
| Sketchfab "Zebrafish Jaw Wildtype" | adult (unverified) | CC BY | glTF download, decimate | "'Zebrafish Jaw Wildtype' by yushiyang, Sketchfab uid 4f9bcc44a0864500b1b5721acdf4ab21 (CC BY)." |
| Sketchfab "5dpf zebrafish cephalic vasculature" | 5 dpf | CC BY 4.0 | glTF download, decimate to under 200 k faces | "'5dpf zebrafish cephalic vasculature' by Vishruth.Venkat, https://sketchfab.com/3d-models/5dpf-zebrafish-cephalic-vasculature-a491b7a71a524f33bd93e4ba0d75edf6 (CC BY 4.0)." |
| FishNet paper figures | 24 hpf to 17 mm SL | CC BY 2.0 | crop figure panels to PNG | "Bryson-Richardson RJ, et al. (2007) FishNet: an online database of zebrafish anatomy. BMC Biology 5:34 (CC BY 2.0)." |
| Ding 2019 article figures | 2 to 5 dpf, 33 dpf | CC BY | crop figure panels to PNG | "Ding Y, et al. (2019) eLife 8:e44898 (CC BY)." |
| ZFIN ZFA and ZFS terms, definitions, stage windows | all | CC BY 4.0 | JSON in `data/` | "Zebrafish Information Network (ZFIN), University of Oregon, https://zfin.org (CC BY 4.0)." |
| Zebrahub h5ad | 10 hpf to 10 dpf | CC BY 4.0 | precomputed gene summaries only | "Zebrahub single cell dataset, figshare (CC BY 4.0). Lange M, et al. (2024) Cell, https://doi.org/10.1016/j.cell.2024.09.047 ." |

Assets that need a written permission or a license statement before use:

- Zebrahub imaging volumes (no license on the bucket)
- mapzebrain (license unknown)
- Z-Brain (no LICENSE file)
- Penn State slides (copyright)
- TDR-3Dbase (none stated)
- DigiMorph (educational view only)
- Kimmel 1995 and Parichy 2009 figures (Wiley copyright)
- Isogai vascular images (license not stated)

Rules for the site:

1. Keep a `public/ATTRIBUTION.md` in the format that human-atlas uses (source, license URL, publication, adaptations).
2. Show the attribution line in the info card of every structure that uses a derived mesh or image.
3. Do not mix CC BY-SA images into derived composites. Use them unmodified or skip them.
4. Do not ship CC BY-NC assets. The repository license is MIT, and downstream users may be commercial.

## 4. Calibration references

Sources that give a measurable outline or a length per stage. Use them to set the parameters of the procedural primitives.

| Stage window | Source | What you can measure | Scale information | License |
|--------------|--------|----------------------|-------------------|---------|
| 0 to 3 hpf (zygote, cleavage) | Bioimages 1-, 2-, 4-, 8-cell photos; DBCLS icons; Kimmel 1995 Fig. 1 to 4 (view only) | blastodisc height over yolk, cell count, chorion diameter | Kimmel 1995 gives about 0.7 mm egg diameter (paper; unverified here) | CC BY 4.0; Wiley (view only) |
| 2.5 to 45.5 hpf | S-BIAD840 bright-field every 15 min at 4x | 2D outline, epiboly percentage, body axis length, head-trunk angle, yolk extension | pixel size from 4x objective metadata (check in files) | CC0 |
| 4 to 18 hpf | IDR idr0068 nuclear light-sheet, 420 time points | 3D embryo surface, epiboly front, shield, somite count | voxel size in OME metadata | CC BY 4.0 |
| 12 to 72 hpf | S-BIAD1405 multi-view light-sheet with DAPI | 3D surface of head, trunk, yolk, eye, otic vesicle, fin fold at fixed stages | Zeiss Z.1 voxel size in CZI metadata | CC BY 4.0 |
| 50% epiboly onward | Zebrahub ZSNS001 (0.439 x 0.439 x 1.24 µm) | 3D surface per time point; cell tracks for tissue flow | voxel size in .zattrs | license not stated |
| 24, 36, 48, 72 hpf | TDR-3Dbase models with 15 to 33 structures | relative positions of brain, eye, heart, gut, notochord | none exported | none stated (view only) |
| 24 hpf to 120 hpf; 5 to 17 mm SL | FishNet paper figures (OPT) | whole-body outline and skeleton at 10 and 15 mm | SL given per specimen | CC BY 2.0 |
| 2 to 5 dpf | Ding 2019 Dryad volumes at 0.743 µm | head organ volumes: brain, eyes, otic vesicles, jaw cartilage | isotropic voxel size | CC0 |
| 33 dpf | Ding 2019 figures at 1.43 µm | whole-body proportions of a juvenile | isotropic voxel size | CC BY |
| 48 hpf to 12 mpf | Penn State Lifespan Atlas slides, specimens 3.1 to 14 mm | organ positions along the body axis in three planes; body depth to length ratio per age | specimen length per slide set | copyright (view only) |
| 5 to 17 mm SL (larva to juvenile) | Parichy DM et al. (2009) Dev Dyn, DOI 10.1002/dvdy.22113, PMC3030279 | SL-based stage criteria: flexion, fin ray counts, pelvic fin bud, squamation, pigment pattern | SL per stage in the tables | Wiley (view only) |
| 6 dpf | ZBB huC reference brain at 1 µm | brain outline and subdivisions | isotropic voxel size | CC BY 4.0 |
| 5 dpf | Sketchfab cephalic vasculature mesh | head vessel layout | mesh units unknown; scale from head length | CC BY 4.0 |
| adult | AZBA at 4 µm; DigiMorph CT (914 slices, 6.8 mm field); Sketchfab vertebrae and jaw meshes | brain region shapes; skull and vertebral column proportions | AZBA voxel size; DigiMorph slice spacing | CC0; view only; CC BY |
| 1 to 7 dpf | Isogai vascular atlas | vessel topology per day | none | not stated (view only) |

Notes:

- The ZFS stage windows in `stage_ontology.txt` give the time axis. Map each calibration source to a ZFS id before you read measurements from it.
- Fixed-stage 3D sets (S-BIAD1405, Ding 2019) give shapes at a few points. Time-lapse sets (S-BIAD840, idr0068, Zebrahub) give the change between them.
- No open 3D whole-body set covers 6 dpf to adult. For that window, the Penn State slides, the FishNet figures, and Parichy 2009 are the only length-calibrated references I found.

## 5. Future data hooks

The current plan uses procedural primitives with keyframed parameters. The viewer should accept real meshes per stage later without a change to the scene code.

### 5.1 Manifest per stage

Extend the human-atlas manifest pattern (`public/models/atlas.json` with `parts`, `chunks`, `concepts`) with a stage dimension:

```json
{
  "version": "zebrafish-3D-atlas meshes 0.1",
  "units": "micrometer",
  "axes": {"x": "anterior", "y": "dorsal", "z": "left"},
  "stages": [
    {
      "zfs": "ZFS:0000029",
      "name": "Prim-5",
      "hpf": [24, 30],
      "source": "S-BIAD1405",
      "license": "CC BY 4.0",
      "chunks": [{"url": "/models/zfs0000029-0.bin.gz", "bytes": 0}],
      "parts": [
        {"zfa": "ZFA:0000107", "name": "eye", "chunk": 0, "positions": 0, "normals": 0, "indices": 0, "vertexCount": 0, "indexCount": 0, "bounds": [[0,0,0],[0,0,0]]}
      ]
    }
  ]
}
```

Each part carries a ZFA id, so the same info card serves procedural and mesh geometry. The `zfs` key selects the mesh set for the slider position. When no mesh set exists for a stage, the viewer falls back to the procedural primitive.

### 5.2 Conversion pipeline

1. Volumes to labels. For AZBA the label volume exists. For light-sheet and CT volumes, threshold the nuclear or absorption channel, then clean with morphological closing. Store labels as OME-Zarr with the ZFA id in the label metadata.
2. Labels to meshes. Run marching cubes per label (scikit-image), then decimate with meshoptimizer to a 0.2 percent relative error, the same bound human-atlas uses. Recompute normals.
3. Meshes to the site. Either export glTF 2.0 with meshopt compression (gltfpack), or pack into the human-atlas binary layout (float32 positions, int16 normals, uint32 indices, gzip). The human-atlas package reaches 2,288,268 triangles in about 33 MB compressed (human-atlas README). Set a budget of 5 MB per stage set.
4. BrainGlobe atlases. `mpin_zfish_1um` and `azba_zfish_4um` already contain one OBJ mesh per region and a structures.json hierarchy. Convert OBJ to glTF with obj2gltf and map region acronyms to ZFA ids by name.
5. Record every source, license, and adaptation in `public/ATTRIBUTION.md`.

### 5.3 Time interpolation between mesh sets

Meshes from different specimens share no vertex correspondence, so morph targets do not apply. Three options, in order of effort:

1. Swap the mesh set at the stage boundary and cross-fade opacity over 0.5 s. This matches the eMouseAtlas and Amsterdam atlas behaviour.
2. Fit the procedural primitive to each mesh (least-squares on ellipsoid or spline parameters), then interpolate the parameters. The procedural model stays the animated layer; the meshes serve as keyframe targets.
3. Register consecutive volumes (for example with ANTs, as Marquart 2017 did for brain atlases) and warp one template mesh through the deformation fields. This gives true correspondence at high cost.

Option 2 fits the current plan. It also turns every CC BY volume into calibration data without shipping the volume.

### 5.4 Loading real volumes at run time

OME-Zarr stores on public HTTPS endpoints (Zebrahub, IDR) support range requests. A later version could stream a low-resolution pyramid level into a WebGL volume renderer. Zebrahub level 2 at 1.756 x 1.756 x 4.96 µm is one example. This needs CORS headers on the bucket and a license statement. Keep it out of the static build until both exist.

## 6. URL verification log (2026-09-06)

| URL | Result |
|-----|--------|
| https://zebrahub.ds.czbiohub.org | 301 to https://zebrahub.sf.czbiohub.org/ |
| https://zebrahub.sf.czbiohub.org/ , /imaging , /data , /instruments | loaded |
| https://public.czbiohub.org/royerlab/zebrahub/imaging/single-objective/ | loaded (directory listing) |
| https://engertlab.fas.harvard.edu/Z-Brain/ | connection refused |
| https://github.com/owenrandlett/Z-Brain | loaded |
| https://zebrafishexplorer.zib.de/ , https://zebrafishatlas.zib.de/ | certificate error |
| https://mapzebrain.org/ and subpages | loaded, JavaScript shell only |
| https://api.mapzebrain.org/ | 404 |
| https://fishatlas.neuro.mpg.de/ | certificate error |
| http://vibez.informatik.uni-freiburg.de/ | DNS lookup failed |
| https://azba.wayne.edu/ | loaded, JavaScript shell |
| https://datadryad.org/dataset/doi:10.5061/dryad.dfn2z351g | loaded |
| https://elifesciences.org/articles/69988 , /44898 | loaded |
| https://zfatlas.psu.edu | connection refused |
| https://bio-atlas.psu.edu/zf/ , /zf/about.php | loaded |
| http://3D.fish | connection reset |
| https://bio-imaging.liacs.nl/ZFAtlasServer/ | 301 to http://bio-imaging.liacs.nl/TDR/EntranceServlet?rep_type=zf_atlas (loaded) |
| https://www.digitalfishlibrary.org/ , /library/ | loaded |
| https://zfin.org/zf_info/zfbook/stages/index.html | loaded |
| https://zfin.org/warranty.html | 301 to https://zfin.atlassian.net/wiki/spaces/general/pages/1942160112 (loaded) |
| https://zfin.atlassian.net/wiki/display/general/Anatomy+Atlases+and+Resources | loaded |
| https://commons.wikimedia.org/w/api.php (search, categorymembers, imageinfo) | loaded |
| https://bioimages.vanderbilt.edu/pages/zfish-devel.htm , /baskauf/30547.htm | loaded |
| https://idr.openmicroscopy.org/study/idr0068/ , /about/ , /about/studies.html | loaded |
| https://www.ebi.ac.uk/biostudies/api/v1/BioImages/search?query=zebrafish | loaded |
| https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BIAD1405 , S-BIAD840 , S-BIAD531 , S-BIAD815 | loaded |
| https://www.ebi.ac.uk/bioimage-archive/help-faq/ | loaded |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC5594570/ | loaded |
| https://www.digital-embryo.org/ | certificate mismatch (*.janelia.org) |
| https://www.janelia.org/lab/keller-lab/software , /research | loaded, no dataset list |
| https://api.figshare.com/v2/articles/7272617 , /20510367 , /projects/146247/articles | loaded |
| https://brain-map.org/ | loaded |
| https://api.sketchfab.com/v3/search and /models/{uid} | loaded |
| https://3d.nih.gov/ | loaded; search pages need JavaScript |
| https://daniocell.nichd.nih.gov | loaded |
| https://cole-trapnell-lab.github.io/zscape/ | loaded |
| http://zbbrowser.com | connection refused |
| http://vis.arc.vt.edu/projects/zbb/ | loaded |
| https://zenodo.org/records/7130703 , /2560759 | loaded |
| https://www.nichd.nih.gov/research/atNICHD/Investigators/burgess/software | loaded |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC2031877/ | loaded |
| http://www.fishnet.org.au | 301 to https://zfap.org/ (certificate error) |
| http://zebrafish.anatomyportal.org/ | certificate error |
| https://digimorph.org/specimens/Danio_rerio/ , /aboutdigimorph.phtml | loaded |
| https://www.morphosource.org/catalog/media?q=Danio+rerio | access denied |
| https://zfish.nichd.nih.gov/Intro%20Page/intro1.html | loaded |
| https://www.3dembryoatlas.com , /copy-of-donate | loaded |
| https://www.emouseatlas.org/emap/home.html | loaded |
| https://gin.g-node.org/BrainGlobe/atlases | loaded |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC10541682/ , PMC9946346 , PMC6559789 | loaded |
| https://www.cell.com/cell/fulltext/S0092-8674(24)01147-4 | 403 |
| Europe PMC REST (Lange 2024, Parichy 2009, Kunst 2019, Shainer 2023) | loaded |
