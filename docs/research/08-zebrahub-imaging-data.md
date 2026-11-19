# Zebrahub imaging data: inventory, access test, and a plan for a real-data layer

_Written by AI coding agents (Claude Code) under the direction of Yang-Joon Kim,
2026-09-07. A working document, not the shipped data. [`README.md`](README.md) gives its
status and what was checked._

Date: 2026-09-07.
Inputs read first: `docs/superpowers/specs/2026-09-06-architecture-decisions.md` sections D1 to D4,
and `docs/research/04-imaging-resources.md` section 2.1.

Every value marked **measured** comes from a command I ran on this HPC node on 2026-09-07. Every
value marked **stated** comes from a page or a paper, with the URL. Every value marked **derived**
is arithmetic on measured or stated values, and the derivation is shown.

The probe scripts and images stayed in a local scratch directory outside the repository.

---

## 1. Headline result

The Zebrahub imaging bucket is readable from this node over plain HTTPS. One whole low-resolution
time point of the main dataset arrives in **0.69 s** and costs **2.82 MB**. A closed whole-embryo
surface mesh of about **27,000 triangles** comes out of one multi-view time point in **1.5 s** of
wall time and gzips to **397 kB**. The measured outer diameter of the embryo is **0.77 mm**, which
matches the known 0.7 mm zebrafish egg.

Two corrections to `docs/research/04-imaging-resources.md`. The bucket holds **eleven** OME-Zarr
stores in three groups, not seven datasets. The ZSNS001 level 0 shape is not an estimate; it is in
the `.zarray` file and is given below.

One warning that changes the plan. The six single-objective (DaXi) stores do **not** contain the
whole embryo. They image a flat slab. The two multi-view (OpenSiMView) stores do. Use the multi-view
stores for body outlines.

---

## 2. Inventory

### 2.1 Bucket layout

The bucket serves a JSON directory listing when you send `Accept: application/json`. That is how I
enumerated it (**measured**): `curl -s -H 'Accept: application/json'
https://public.czbiohub.org/royerlab/zebrahub/imaging/`.

`single-objective/` holds 6 OME-Zarr stores, 5 track CSV files, 6 neuroglancer state files and
`tracks_benchmark/`. `multi-view/` holds 2 stores, 2 state files and `photo-manipulation/`.
`photo-manipulation/` holds 3 stores and 2 zero-byte JSON files. `royerlab/zebrahub/sequencing/`
holds only `3d-umaps/`. Base URL for every path below:
`https://public.czbiohub.org/royerlab/zebrahub/imaging/`

### 2.2 The eleven stores

All values **measured** from each store's `.zattrs` and `.zarray` files. Shape and chunk are at
level 0; chunk is t, c, z, y, x. Voxel size is z, y, x in micrometres, from the level 0
`coordinateTransformations` scale. "On disk" sums the real compressed bytes of one time point at
every level and multiplies by the time-point count (**derived** from **measured** chunk sizes).

| id | Group | Channels | Time pts | Level 0 shape (z, y, x) | Voxel µm | Lv | Level 0 chunk | Uncomp. TB | Disk TB |
|---|---|---|---|---|---|---|---|---|---|
| ZSNS001 | single-objective | 1 (`fused`) | 791 | 448 × 2174 × 2423 | 1.24 / 0.439 / 0.439 | 3 | 1,1,128,362,362 | 4.26 | 0.21 |
| ZSNS001_tail | single-objective | 1 (`fused`) | 791 | 420 × 1217 × 1091 | 1.24 / 0.439 / 0.439 | 3 | 1,1,128,362,362 | 1.01 | 0.03 |
| ZSNS002 | single-objective | 1 (`fused`) | 1100 | 333 × 2430 × 5254 | 1.24 / 0.439 / 0.439 | 5 | 1,1,128,362,362 | 10.69 | 0.60 |
| ZSNS003 | single-objective | 1 (`0`) | 515 | 258 × 1929 × 2038 | 1.24 / 0.439 / 0.439 | 4 | 1,1,128,1929,2038 | 1.19 | 0.21 |
| ZSNS004 | single-objective | 1 (`fused`) | 600 | 294 × 1926 × 2581 | 1.24 / 0.439 / 0.439 | 4 | 1,1,128,1926,2304 | 2.00 | 0.33 |
| ZSNS005 | single-objective | 1 (`fused`) | 600 | 291 × 1910 × 2750 | 1.24 / 0.439 / 0.439 | 4 | 1,1,128,1910,2304 | 2.10 | 0.19 |
| ZMNS001 | multi-view | 2 (`h2afva`, `mezzo`) | 270 | 396 × 1624 × 1552 | 1.97 / 0.485 / 0.485 | 5 | 1,1,101,408,408 | 1.23 | 0.35 |
| ZMNS002 | multi-view | 2 (`h2afva`, `mezzo`) | 225 | 408 × 1596 × 1824 | 1.97 / 0.485 / 0.485 | 5 | 1,1,101,408,408 | 1.22 | 0.29 |
| ZMPM001_green | photo-manip. | 1 (`fused`) | 45 | 356 × 2048 × 2048 | 0.97 / 0.485 / 0.485 | 5 | 1,1,161,323,323 | 0.15 | 0.03 |
| ZMPM001_red | photo-manip. | 1 (`fused`) | 900 | 356 × 2048 × 2048 | 0.97 / 0.485 / 0.485 | 5 | 1,1,161,323,323 | 3.07 | 0.51 |
| ZMPM002 | photo-manip. | 2 (`DendraGreen`, `DendraRed`) | 456 | 408 × 2050 × 2080 | 1.97 / 0.485 / 0.485 | 5 | 1,1,101,408,408 | 3.63 | 0.50 |
| **Total** | | | | | | | | **30.56** | **3.25** |

Common to every store (**measured**): OME-NGFF version 0.4, Zarr v2 (`.zgroup` says
`zarr_format: 2` and `zarr.json` returns 404), axis order t, c, z, y, x, dtype `<u2`, blosc with
`cname: lz4`, `clevel: 5`, `shuffle: 1`, chunk key separator `/` so a chunk sits at
`<level>/<t>/<c>/<z>/<y>/<x>`, and `cucim.skimage.transform.downscale_local_mean` 22.12.00 as the
downscale method. `ZSNS003` alone uses upper-case axis names, so a reader that matches on lower case
will fail on that store.

The `04-imaging-resources.md` figure of 3.7 TB for ZSNS001 was an over-estimate. The real
uncompressed figure is 4.26 TB across all three levels; on disk it is 0.21 TB.

### 2.3 Lowest multiscale level of each store

This is the level to fetch for whole-embryo work. "MB per time point" is the summed compressed size
of every chunk of one time point (**measured**).

| id | Level | Shape (z, y, x) | Voxel µm | MB/tp | URL suffix |
|---|---|---|---|---|---|
| ZSNS001 | 2 | 112 × 544 × 606 | 4.96 / 1.756 / 1.756 | 2.82 | `single-objective/ZSNS001.ome.zarr/2/` |
| ZSNS001_tail | 2 | 105 × 305 × 273 | 4.96 / 1.756 / 1.756 | 0.41 | `single-objective/ZSNS001_tail.ome.zarr/2/` |
| ZSNS002 | 4 | 21 × 152 × 329 | 19.84 / 7.024 / 7.024 | 0.10 | `single-objective/ZSNS002.ome.zarr/4/` |
| ZSNS003 | 3 | 33 × 242 × 255 | see 2.4 | 0.75 | `single-objective/ZSNS003.ome.zarr/3/` |
| ZSNS004 | 3 | 37 × 241 × 323 | 9.92 / 3.512 / 3.512 | 1.03 | `single-objective/ZSNS004.ome.zarr/3/` |
| ZSNS005 | 3 | 37 × 239 × 344 | 9.92 / 3.512 / 3.512 | 0.63 | `single-objective/ZSNS005.ome.zarr/3/` |
| ZMNS001 | 4 | 25 × 102 × 97 | 31.52 / 7.76 / 7.76 | 0.30 | `multi-view/ZMNS001.ome.zarr/4/` |
| ZMNS002 | 4 | 26 × 100 × 114 | 31.52 / 7.76 / 7.76 | 0.28 | `multi-view/ZMNS002.ome.zarr/4/` |
| ZMPM001_green | 4 | 23 × 128 × 128 | 15.52 / 7.76 / 7.76 | 0.04 | `multi-view/photo-manipulation/ZMPM001_green.ome.zarr/4/` |
| ZMPM001_red | 4 | 23 × 128 × 128 | 15.52 / 7.76 / 7.76 | 0.03 | `multi-view/photo-manipulation/ZMPM001_red.ome.zarr/4/` |
| ZMPM002 | 4 | 26 × 129 × 130 | 31.52 / 7.76 / 7.76 | 0.09 | `multi-view/photo-manipulation/ZMPM002.ome.zarr/4/` |

### 2.4 Two metadata defects

**ZSNS003 scale factors run the wrong way.** Its `.zattrs` gives level 0 a scale of
1.24 / 0.439 / 0.439 and level 3 a scale of 0.155 / 0.054875 / 0.054875. Scale must grow as
resolution falls. The values are divided by 2 per level instead of multiplied. Use 1.24 × 2^level,
as every other store does. Source:
`https://public.czbiohub.org/royerlab/zebrahub/imaging/single-objective/ZSNS003.ome.zarr/.zattrs`

**ZMPM001_green carries a time scale of 20.** Its level 0 scale is `[20.0, 1.0, 0.97, 0.485, 0.485]`
while the matching red store uses `[1.0, ...]`. Green holds 45 time points and red holds 900, so
green is one frame per 20 red frames. A reader that ignores the t scale will place the two channels
20 times apart in time.

### 2.5 Time step and stage range

The bucket states no time interval and no stage. Two published sources constrain it.

The Ultrack paper (CC BY) describes the same DaXi recordings: "fast (one stack per minute)",
"capturing 8.6 h to 13.2 h of zebrafish development", "producing uncompressed time-lapse data
ranging from 1.7 to 3.7 terabytes". Its data availability statement names our bucket. Source:
Bragantini J et al. (2025) Nature Methods 22:2423-2436,
https://doi.org/10.1038/s41592-025-02778-0 , full text at
`https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12615266/fullTextXML`

That interval reproduces the frame counts (**derived**). 791 frames at 1 min is 13.18 h, the paper's
13.2 h. 515 frames at 1 min is 8.58 h, the paper's 8.6 h. I therefore take **60 s per volume for
every ZSNS store**. ZSNS002 has 1100 frames, which would be 18.3 h and falls outside the paper's
range; ZSNS002 also has no track file in the bucket, so it was probably not one of the recordings
described. Treat its interval as unverified.

For the multi-view stores, the Zebrahub preprint calls Figure 1d "Maximum intensity projections of
a 12-hour light-sheet live-imaging" and titles Supplementary Video 3 "Light-sheet time-lapse of
Tg(h2afva:h2afva-mcherry; mezzo:eGFP) embryo starting at 50% epiboly"
(https://www.biorxiv.org/content/10.1101/2023.03.06.531398v2.full). 270 frames over 12 h gives
2.67 min per volume (**derived**, unverified per dataset). The same preprint names the lines:
tg(h2afva:h2afva-mCherry) alone or crossed with tg(mezzo:eGFP), and
tg(bactin2:memb-Cerulean-2A-H2B-Dendra2) for the photo-conversion stores.

### 2.6 Stage anchors read from the images

I fetched 33 time points of ZSNS001 at level 2 and made a montage (**measured**;
`ZSNS001_series_montage.png`).

| Observation | Frame | ZFS stage | hpf |
|---|---|---|---|
| Blastoderm forms a closed ring, no tail bud | 0 to 120 | late gastrula | |
| A distinct bud appears at the vegetal margin | 140 to 170 | ZFS:0000022 Bud | 10 |
| Segmental furrows first resolve in projection | 230 to 260 | ZFS:0000023 to 24 | 10.3 to 12 |
| Head lobe, elongated tail, many somites | 750 to 790 | ZFS:0000026 to 27 | 16 to 22 |

Anchoring bud stage at frame 155 with a 60 s step gives **t = 0 at 7.4 hpf** and **t = 790 at
20.6 hpf** (**derived**). Anchoring on the first visible furrows at frame 245 gives t = 0 at
6.2 hpf. Projection hides the first somites, so the bud anchor is the better one. Read the ZSNS001
window as **7 to 21 hpf, plus or minus one hour**, until the Royer group confirms it.

### 2.7 The single-objective stores are a slab, not a whole embryo

At ZSNS001 level 2, signal occupies z slices 15 to 78 out of 112 (**measured**). That is 313 µm of a
556 µm field. The segmented body measures 322 µm in z against 727 µm in y and 954 µm in x
(**measured**, time point 600). A zebrafish embryo is about 700 µm across, so roughly half the depth
is missing. The x-z projection shows flat top and bottom edges, which is the deskewed oblique light
sheet cutting the embryo.

ZMNS001 level 3 carries signal in z slices 0 to 49 out of 50 at every time point I checked, and its
x-y and x-z projections are both full discs (**measured**).

**Use ZMNS001 and ZMNS002 for whole-embryo outlines. Use ZSNS001_tail for tail detail.**

---

## 3. Licence

### 3.1 What the bucket and the site say

The bucket says nothing. These paths all return HTTP 404 (**measured**):
`royerlab/zebrahub/LICENSE`, `royerlab/zebrahub/README`, `royerlab/zebrahub/imaging/LICENSE`,
`royerlab/zebrahub/imaging/README`, `royerlab/LICENSE`, `royerlab/README`.

From https://zebrahub.sf.czbiohub.org/data , heading "Data Release Policy", verbatim:

> We aim to make Zebrahub's data rapidly and broadly available to the scientific community. We
> intend to publish the work of this project in a timely fashion, and we welcome collaborative
> interactions on the project and analyses. Contact us if you have questions or need help with the
> data. If you use any of these datasets for your own research, please cite the main zebrahub
> publication: Zebrahub - Multimodal Zebrafish Developmental Atlas Reveals the State Transition
> Dynamics of Late Vertebrate Pluripotent Axial Progenitors.

https://zebrahub.sf.czbiohub.org/imaging repeats that citation request. Neither page names a
licence. The old host `https://zebrahub.ds.czbiohub.org/imaging` returns HTTP 301 to the `.sf.` host
(**measured**).

### 3.2 What the paper says

Crossref reports the version of record under CC BY 4.0 (**measured**,
`curl https://api.crossref.org/works/10.1016/j.cell.2024.09.047`): `"content-version": "vor"`,
`"URL": "http://creativecommons.org/licenses/by/4.0/"`, start 2024-09-28. Europe PMC agrees,
reporting `"license": "cc by"` for PMID 39454574.

The bioRxiv preprint is a different matter. The bioRxiv API reports both versions of
10.1101/2023.03.06.531398 as `"license": "cc_by_nc_nd"` (**measured**,
`https://api.biorxiv.org/details/biorxiv/10.1101/2023.03.06.531398`). Do not take figures or text
from the preprint. The protocols repository is CC0 1.0 (**measured**,
https://github.com/royerlab/zebrahub-protocols/blob/main/LICENSE).

### 3.3 Where that leaves us

The paper is CC BY 4.0. The imaging volumes carry no licence statement of their own. The repository
owner is an author of that paper (Kim YJ is the sixth author of 35) and states the data may be used.
That settles the question for this project.

Two things should still happen before the layer ships. Get one sentence in writing from the Royer
group that names a licence for the imaging bucket, ideally CC BY 4.0 to match the paper, and ask
them to put it in a `LICENSE` file at `royerlab/zebrahub/imaging/`. That serves every downstream
user of this atlas, whose code is MIT. Then record in `public/ATTRIBUTION.md` that the meshes are
derived works and say what was done to the source. Section 8 gives the text.

---

## 4. Access test from this node

No `zarr`, `numcodecs` or `blosc` package exists in any Python on this node (**measured**). I wrote
a Blosc1 reader in pure Python plus numpy: a raw LZ4 block decoder, the byte-unshuffle, and the
block-offset table. It is `blosc_dec.py`, it reproduces a known volume correctly, and it runs at
about 130 MB/s of output. Pillow 8.4 in the system Python wrote the PNG files; `scripts/lib/png.ts`
in this repo is TypeScript for the screenshot pipeline and did not fit.

**ZSNS001 level 2, time point 0.** Four chunks, 2,820,346 bytes. Download 0.08 s, decompression
0.55 s, whole call 0.69 s. The assembled volume is 112 × 544 × 606, or 73.84 MB uncompressed.

Four time points across the recording (**measured**):

| Time point | Intensity max | Mean | Non-zero fraction | MB downloaded | Wall time s |
|---|---|---|---|---|---|
| 0 | 254 | 1.08 | 0.054 | 2.82 | 0.69 |
| 200 | 255 | 1.27 | 0.057 | 2.92 | 0.66 |
| 400 | 255 | 1.86 | 0.063 | 3.12 | 0.72 |
| 790 | 255 | 3.32 | 0.080 | 3.84 | 0.73 |

Projections are saved as `ZSNS001_t000_L2_mip_xy.png` and the matching `xz` and `zy` files. The
whole 791-frame series at level 2 would be 2.4 GB and about 9 minutes of wall time (**derived**).

**ZMNS001 level 2, one channel**: 10.2 MB and 0.9 to 1.0 s per time point, shape 99 × 406 × 388
(**measured**). Access is fast enough that no bulk download is needed. Fetch what you need per stage.

---

## 5. Extracting a per-stage embryo surface

### 5.1 Which frames to take

Use ZMNS001. Read t = 0 as 50% epiboly (5.25 hpf) per Supplementary Video 3, and take 2.67 min per
frame from the 12-hour figure. Frame index for a target hpf is `round((hpf - 5.25) * 60 / 2.67)`
(**derived**).

| ZFS id | Stage | hpf | ZMNS001 frame |
|---|---|---|---|
| ZFS:0000017 | Gastrula: 50%-epiboly | 5.25 | 0 |
| ZFS:0000018 | Gastrula: germ ring | 5.66 | 9 |
| ZFS:0000019 | Gastrula: shield | 6 | 17 |
| ZFS:0000020 | Gastrula: 75%-epiboly | 8 | 62 |
| ZFS:0000021 | Gastrula: 90%-epiboly | 9 | 84 |
| ZFS:0000022 | Gastrula: bud | 10 | 107 |
| ZFS:0000023 | Segmentation: 1-4 somites | 10.33 | 114 |
| ZFS:0000024 | Segmentation: 5-9 somites | 11.66 | 144 |
| ZFS:0000025 | Segmentation: 10-13 somites | 14 | 197 |
| ZFS:0000026 | Segmentation: 14-19 somites | 16 | 242 |
| ZFS:0000027 | Segmentation: 20-25 somites | 19 | 269 is the last frame, at 17.2 hpf |

ZMNS001 stops before the 20-25 somite stage. For 19 to 24 hpf, use ZSNS001 frames 700 to 790 and
accept the z slab, or fall back to IDR idr0068 (CC BY 4.0, 4 to 18 hpf), row 14 of
`docs/research/04-imaging-resources.md`. Do not invent a surface for a stage you cannot measure.

Confirm the ZMNS001 interval with the Royer group before shipping these frame numbers. The frame
index is linear in the interval, so a wrong interval slides every stage by the same factor.

### 5.2 The pipeline that I ran

Built and measured; it is `body.py`.

1. **Fetch** level 2 of ZMNS001, channel 0 (`h2afva`, the ubiquitous nuclear label). 10.2 MB.
2. **Make the voxels isotropic.** The z scale is 7.88 µm and the x-y scale is 1.94 µm, a ratio of
   4.06. Mean-bin x and y by 4, giving 99 × 101 × 97 at 7.88 µm.
3. **Coarsen** by 2 for the shipping mesh, giving 49 × 50 × 48 at 15.76 µm.
4. **Threshold.** Gaussian blur at sigma 1 voxel, Otsu on the non-zero voxels, then 40 percent of
   the Otsu value. The low factor keeps the dim embryo margin.
5. **Close the yolk.** The yolk carries no nuclear label, so the threshold leaves a hollow shell.
   Close it with a Euclidean distance transform: dilate by 200 µm, keep the largest component, fill
   from the border, erode by 200 µm. A 200 µm radius bridges the yolk; a 5-voxel box kernel does not.
6. **Take the outer shell.** Label the background and keep whatever the border cannot reach. That
   guarantees one closed body with no interior cavity.
7. **Mesh.** Surface nets, one vertex per boundary cell, then 12 Laplacian passes at alpha 0.6. I
   chose surface nets over marching cubes because it is 40 lines of numpy and gives near-uniform
   vertex density, which decimates predictably. Marching cubes gives a similar count.
8. **Export** binary glTF with positions, normals and 32-bit indices.

I validated the mesher on an analytic sphere of radius 10 voxels: the reconstructed radius is 9.83
with a standard deviation of 0.08 (**measured**).

### 5.3 What it produces

**Measured**, ZMNS001, 15.76 µm voxels, one channel:

| Frame | Body volume mm³ | Bounding box mm | Vertices | Triangles | GLB kB | GLB gzip kB |
|---|---|---|---|---|---|---|
| 0 | 0.325 | 0.772 × 0.788 × 0.756 | 13,478 | 26,952 | 632 | 393 |
| 90 | 0.321 | 0.772 × 0.788 × 0.756 | 13,692 | 27,380 | 643 | 407 |
| 180 | 0.333 | 0.772 × 0.788 × 0.756 | 13,796 | 27,588 | 647 | 407 |
| 269 | 0.355 | 0.772 × 0.788 × 0.756 | 14,014 | 28,024 | 658 | 397 |

The bounding box holds at 0.77 to 0.79 mm across the whole recording, which is right: the embryo
sits inside a fixed chorion-free volume and changes shape rather than size before 24 hpf. Kimmel's
0.7 mm egg diameter plus two or three voxels of segmentation halo per side accounts for the
difference (**derived**).

The triangle count lands on the 20k budget without a decimation pass. Grid coarsening is the
decimation. **Measured** counts at other voxel sizes, frame 180:

| Voxel µm | Grid | Triangles | GLB gzip kB |
|---|---|---|---|
| 7.88 | 99 × 101 × 97 | 120,932 | 1,858 |
| 15.76 | 49 × 50 × 48 | 21,624 to 27,588 | 334 to 407 |
| 23.64 | 33 × 33 × 32 | 9,080 | 138 |

three.js 0.185.1 no longer ships `examples/jsm/utils/SimplifyModifier.js` (HTTP 404 on the CDN,
**measured**). Decimate offline. Grid coarsening avoids the question.

### 5.4 Time cost

**Measured** per time point, on one core of this node, at 15.76 µm: 0.92 to 1.03 s to fetch level 2
over HTTPS, 0.03 s to threshold and close and shell, 0.47 to 0.51 s to mesh and smooth. Total 1.5 s.

Eleven stages therefore cost about 17 s of CPU, and the whole 270-frame ZMNS001 series costs about
7 minutes. **No GPU is needed.** Nothing in this pipeline benefits from one, so do not request one
for this job. At the full 7.88 µm resolution the cost rises to 2.5 to 3.4 s per time point, mostly
in the mesher (**measured**).

### 5.5 Alignment into the body frame

D4 sets +x posterior, +y dorsal, +z left, in millimetres. The imaging volume gives none of these.
The embryo sits at whatever angle it was mounted, and `stabilized.zarr` in the omero name says the
series was registered to remove drift, not to any anatomical frame. Fit the transform once per
dataset, not per stage:

1. Translate so the body centroid is at the origin.
2. Find the animal-vegetal axis at the first frame. At 50% epiboly the blastoderm cap is offset from
   the yolk centre, so the vector from the body centroid to the labelled-voxel centroid points to
   the animal pole. Call it **a**.
3. Find the dorsal direction at shield stage. The shield is the thickest point of the germ ring.
   Take the labelled-voxel centroid restricted to the germ-ring band, project out **a**, normalise.
   Call it **d**.
4. Build the rotation. +y is **d**. Use the cross product of **a** and **d** for +x and check the
   sign against the tail bud position. +z closes the right-handed frame; confirm the yolk extension
   runs ventral.
5. Divide by 1000 for millimetres. No fitted scale factor is needed, and any scale other than 1.0
   means the axis assignment is wrong.

Verify with two scalars whose values are known: the body diameter before 24 hpf (0.7 mm from Kimmel,
we measure 0.77) and the head-trunk angle at 30 hpf (120 degrees per D3). If the fitted frame
disagrees with either, fix the frame, not the data.

### 5.6 Fitting the procedural body model to the outlines

The atlas ships a procedural `bodyModel(t)` (D3), not real meshes, and D1 puts real imaging meshes
out of scope for version 1. The right use for these surfaces is to calibrate that model.

For each stage frame, extract the body mask as in 5.2, sample `bodyModel(t)` at 128 spine stations,
build its implicit surface from `hD(u)`, `hV(u)` and `w(u)`, rasterise it into the same grid, and
minimise the symmetric difference over the spine control points and the three profile functions by
least squares. Hold the yolk radius fixed at the measured value.

Report the Dice coefficient between the model body and the measured body at each stage. That is one
number per stage, it is comparable across stages, and it belongs in the output of
`npm run validate`. A Dice above 0.9 means the procedural model matches the real embryo; below 0.8
means a regime boundary in D3 is wrong. Do this as a script under `scripts/`, write the fitted
keyframes into `body.json`, and ship no imaging mesh in version 1.

---

## 6. Web rendering options

I tested all three in a real headless Chrome 145 on this node, driven by the repo's own
`playwright-core` 1.63 against `/usr/bin/google-chrome`, with the ANGLE SwiftShader software
rasteriser. Every result below is **measured**.

The browser reports WebGL2 available, `MAX_TEXTURE_SIZE` 8192, `MAX_3D_TEXTURE_SIZE` 2048 and
`OES_texture_float_linear` present. The WebGL2 specification only guarantees 2048 and 256 for those
two, so a 256³ 3D texture is safe everywhere.

Frame rates come from a software rasteriser. **They do not predict GPU performance.** They do show
the relative cost of the three approaches on the worst hardware a visitor might bring.

### 6.1 Option A: per-stage surface meshes in three.js

Section 5 covers the production. Eleven stages at 27k triangles cost 4.4 MB of GLB, which gzips to
about 2.8 MB served (**derived** from the measured per-stage sizes). At 23.64 µm voxels the eleven
stages cost 1.5 MB gzipped.

Draco and meshopt would shrink this further, but neither `gltf-transform` nor `gltfpack` is
installed on this node, so I did not measure them. The decoders are available:
`examples/jsm/loaders/DRACOLoader.js` (19,030 bytes) and
`examples/jsm/libs/meshopt_decoder.module.js` (29,256 bytes) both return HTTP 200 on the three
0.185.1 CDN (**measured**). Since gzip alone reaches 397 kB per stage and the whole layer fits in
3 MB, adding a decoder is not worth it yet.

### 6.2 Option B: Gaussian splats

I built a 43,162-splat cloud from the ZMNS001 body volume, wrote it as a 1.38 MB `.splat` file
(32 bytes per splat), and loaded it in both candidate libraries.

| | @mkkellogg/gaussian-splats-3d | @sparkjsdev/spark | gsplat |
|---|---|---|---|
| Latest version | 0.4.7 | 2.1.0 | 1.2.9 |
| Published | 2025-01-25 | 2026-05-18 | 2025-07-12 |
| Licence | MIT | MIT | MIT |
| Peer dependency on three | `>=0.160.0` | `>=0.180.0` | none |
| GitHub stars | 2,883 | 3,582 | 1,663 |
| Last push | 2025-10-19 | 2026-09-03 | 2026-05-26 |
| Formats | `.ply`, `.splat`, `.ksplat` | `.ply`, compressed `.ply`, `.spz`, `.splat`, `.ksplat`, `.sog` | `.ply`, `.splat` |
| Renderer | WebGL2 through three.js | WebGL2 through three.js | own WebGL, not three.js |
| Bundle, gzipped over the wire | **106 kB** | **1,801 kB** | not measured |
| Loaded with three 0.185.1 | **yes** | **yes** | not applicable |
| Rendered 43k splats | yes, 152,463 lit pixels | yes, 155,449 lit pixels | not tested |
| Frames per second, SwiftShader, 512 × 512 px | 1.7 | 1.5 | not tested |

Version, licence and dependency rows come from the npm registry
(`https://registry.npmjs.org/@sparkjsdev/spark` and the two matching URLs). Star and push rows come
from the GitHub API. Bundle sizes are the actual gzipped transfer from
`https://cdn.jsdelivr.net/npm/...`. three.js itself is 87 kB gzipped by the same measurement.

Both three.js libraries rendered the embryo correctly (`web/spark_shot.png`, `web/mk_shot.png`). Two
things I learned by running them:

- The splat sort is asynchronous. Eight synchronous `renderer.render()` calls give a black canvas.
  Drive the loop with `requestAnimationFrame` and let the worker finish.
- `@mkkellogg/gaussian-splats-3d` defaults to `sharedMemoryForWorkers: true`, which needs
  `SharedArrayBuffer`, which needs the `Cross-Origin-Opener-Policy` and
  `Cross-Origin-Embedder-Policy` response headers. **GitHub Pages cannot set response headers.** D1
  requires a build that deploys to both GitHub Pages and Vercel, so this library must run with
  `sharedMemoryForWorkers: false` and `gpuAcceleratedSort: false`. That is what I tested, and it
  worked.

`gsplat` is disqualified here. It runs its own WebGL context and cannot share the atlas's three.js
scene, so splats could not sort against the procedural organ meshes.

Splat file sizes (**derived** from the format specifications, not measured):

| Format | Bytes per splat | 200k splats | 1M splats | Spec |
|---|---|---|---|---|
| INRIA `.ply`, SH degree 3 | 248 | 49.6 MB | 248 MB | 62 float32 fields |
| INRIA `.ply`, SH degree 0 | 68 | 13.6 MB | 68 MB | 17 float32 fields |
| `.splat` | 32 | 6.4 MB | 32 MB | https://github.com/antimatter15/splat |
| `.spz`, SH degree 0 | about 19 before ZSTD | about 3.8 MB | about 19 MB | https://github.com/nianticlabs/spz |
| `.ksplat` level 1 | 16-bit fields | about half of `.ply` | | https://github.com/mkkellogg/GaussianSplats3D |

The `.spz` README states that "spz encoded splats are typically around 10x smaller than the
corresponding .ply files, with minimal visual differences between the two", and version 4 uses ZSTD
per attribute stream. My own 43k-splat file measured 1.38 MB raw and 0.21 MB gzipped (**measured**),
but that cloud is synthetic and low-entropy; a real fitted cloud will not compress that well.

### 6.3 Option C: direct volume rendering

I wrote a 60-line ray-marching shader against `THREE.Data3DTexture` and ran it in the same headless
browser. It rendered the embryo (`web/vol_shot.png`).

**Measured** sizes of a downsampled ZMNS001 volume, 8-bit:

| Grid | Raw MB | gzip MB | PNG atlas MB | Atlas pixels |
|---|---|---|---|---|
| 128³ | 2.10 | 0.90 | 0.93 | 1536 × 1536 |
| 192³ | 7.08 | 2.97 | 2.95 | 2688 × 2688 |
| 256³ | 16.78 | 6.88 | 6.61 | 4096 × 4096 |

The atlas column is there only for completeness. WebGL2 has real 3D textures, so upload the raw
bytes to a `Data3DTexture` and skip the tiling; a 4096 × 4096 atlas would also exceed the WebGL2
guaranteed `MAX_TEXTURE_SIZE` of 2048.

**Measured** render performance, 128³, 160 ray steps, 512 × 512, SwiftShader: **13.8 fps**.
That is **8 times faster than either splat library on the same hardware**, with the same content.
The reason is structural: one draw call and no CPU-side sort, against 43k instanced quads and a
per-frame depth sort. `examples/jsm/shaders/VolumeShader.js` ships with three 0.185.1 (HTTP 200,
9,284 bytes, **measured**) if you prefer not to write your own.

### 6.4 Recommendation

**Primary: per-stage surface meshes (option A), with the volume shader (option C) as the "show me
the real data" toggle.** Reasons, in order:

1. Meshes are what the atlas already renders. A `<mesh>` with a GLB is one component in the existing
   react-three-fiber scene. It picks, it outlines, it exports to PNG and it obeys the D10 colour
   policy. Splats do none of that.
2. The whole eleven-stage mesh layer is 2.8 MB gzipped (**derived** from measurement). The
   procedural atlas has no backend and ships as static files. 2.8 MB fits.
3. The volume shader costs 0.90 MB per stage at 128³ and runs 8 times faster than splats on
   software rendering (**measured**). It gives the honest "here is the actual microscope data" view
   that a mesh cannot, in 60 lines of shader with no new dependency.
4. Neither option adds a package. Option B adds either 106 kB or 1,801 kB of gzipped JavaScript, and
   the larger is 20 times the size of three.js itself.

**Fallback: Spark, lazy-loaded, behind the same toggle.** If the group wants Gaussian splats, use
Spark 2.1.0, not `@mkkellogg/gaussian-splats-3d`. Spark declares `three >= 0.180.0`, was pushed four
days ago, needs no `SharedArrayBuffer`, and reads `.spz`, the only format that keeps a million
Gaussians under 20 MB. Its 1.8 MB bundle is acceptable only behind a dynamic `import()` that runs
when the user turns the layer on. Never put it in the main chunk.

---

## 7. What I did not verify

- The exact time interval of ZMNS001, ZMNS002 and ZSNS002. Ask the Royer group.
- The stage at t = 0 of each store. My ZSNS001 figure of 7.4 hpf comes from reading a projection.
- Draco and meshopt compressed sizes. Neither tool is installed here.
- Splat performance on real GPU hardware. SwiftShader numbers show relative cost only.
- Whether the `mezzo` channel of ZMNS001 helps segmentation. I used channel 0 only.

---

## 8. Attribution text

Add this to `public/ATTRIBUTION.md`, in the shape the ZFIN entries already use, and only when a mesh
or volume derived from Zebrahub actually ships.

```markdown
### Zebrahub imaging, Royer group, Chan Zuckerberg Biohub San Francisco, https://zebrahub.sf.czbiohub.org

Licence: the imaging volumes carry no licence file. The publication that describes them is
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Used with the permission of the
Royer group.

Body outline meshes for the gastrula and segmentation stages are derived from the Zebrahub
light-sheet time-lapse ZMNS001, downloaded from
https://public.czbiohub.org/royerlab/zebrahub/imaging/multi-view/ZMNS001.ome.zarr/ on
2026-09-07. The atlas modifies these data: it reads the h2afva nuclear channel at multiscale
level 2, thresholds it, closes the unlabelled yolk, extracts one closed outer surface per stage,
decimates it to about 27,000 triangles, and rotates it into the atlas body frame. No original
image data is redistributed.

Citation: Lange M, Granados A, VijayKumar S, Bragantini J, Ancheta S, Kim YJ, et al. A multimodal
zebrafish developmental atlas reveals the state-transition dynamics of late-vertebrate pluripotent
axial progenitors. Cell 2024;187(23):6742-6759.e17.
https://doi.org/10.1016/j.cell.2024.09.047
```

Add the first line below to the Literature section. Add the other two only if the extraction ever
uses the DaXi tail recordings or the cell tracks, which the Zebrahub imaging page names as the
method papers.

```markdown
- Lange M, Granados A, VijayKumar S, Bragantini J, Ancheta S, Kim YJ, et al. A multimodal zebrafish
  developmental atlas reveals the state-transition dynamics of late-vertebrate pluripotent axial
  progenitors. Cell 2024;187(23):6742-6759.e17. https://doi.org/10.1016/j.cell.2024.09.047
  Used for: whole-embryo outlines from 5 to 17 hpf. Licence CC BY 4.0.
- Yang B, Lange M, Millett-Sikking A, et al. DaXi: high-resolution, large imaging volume and
  multi-view single-objective light-sheet microscopy. Nat Methods 2022;19:461-469.
  https://doi.org/10.1038/s41592-022-01417-2
- Bragantini J, Theodoro I, Zhao X, et al. Ultrack: pushing the limits of cell tracking across
  biological scales. Nat Methods 2025;22:2423-2436. https://doi.org/10.1038/s41592-025-02778-0
  Licence CC BY.
```

---

## 9. Reproducing this

Every script is in the probe directory named at the top of this file. `ls.sh` lists any bucket path
as JSON. `allmeta.py` collects `.zattrs` and `.zarray`. `sizes.py` sums real compressed bytes.
`blosc_dec.py` is the pure-Python Blosc1 reader. `fetch_tp.py` pulls one time point and writes
projections. `series.py`, `fine.py` and `hires.py` build the stage montages. `mesh.py` holds the
surface nets, the smoothing and the glTF writer. `body.py` runs the whole extraction of section 5.2
with timings. `volumetex.py` measures the downsampled volumes. `web/run2.mjs` drives headless
Chrome, and `web/spark.html`, `web/mk.html` and `web/vol.html` are the three rendering tests.

Nothing in the atlas repository was modified except this file.
