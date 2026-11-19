#!/usr/bin/env python3
"""Build 03b-anatomy-nervous-sensory.draft.json and .md from ZFIN files + curated data."""
import csv, json, re, os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
RAW = os.environ.get("ZFIN_DIR", os.path.join(REPO, "data", "zfin"))
OUT = HERE
os.makedirs(OUT, exist_ok=True)

# ---------- ZFIN tables ----------
stages = {}
for row in csv.reader(open(f"{RAW}/stage_ontology.txt"), delimiter="\t"):
    stages[row[0]] = dict(zfs=row[1], name=row[2], start=float(row[3]), end=float(row[4]))
items = {}
for row in csv.reader(open(f"{RAW}/anatomy_item.txt"), delimiter="\t"):
    if len(row) >= 4:
        items[row[0]] = dict(name=row[1], start=row[2], end=row[3])
syn = {}
for row in csv.reader(open(f"{RAW}/anatomy_synonyms.txt"), delimiter="\t"):
    if len(row) >= 3:
        syn.setdefault(row[0], []).append(row[2].strip())
obo = open(f"{RAW}/zfa.obo").read()
defs, partof = {}, {}
for block in obo.split("\n[Term]\n")[1:]:
    m = re.search(r"^id: (\S+)", block, re.M)
    if not m:
        continue
    tid = m.group(1)
    d = re.search(r'^def: "(.*?)" \[', block, re.M | re.S)
    defs[tid] = d.group(1) if d else None
    partof[tid] = re.findall(r"^relationship: part_of (\S+) ! (.*)", block, re.M)

# ---------- sources ----------
ZF = lambda i: f"https://zfin.org/{i}"
K95 = "Kimmel et al. 1995 Dev Dyn 203:253-310 (ZFIN staging series) https://zfin.org/zf_info/zfbook/stages/index.html"
K95_PHAR = "https://zfin.org/zf_info/zfbook/stages/phar_stgs.html"
K95_PHARP = "https://zfin.org/zf_info/zfbook/stages/phar.html"
K95_SEG = "https://zfin.org/zf_info/zfbook/stages/seg_stgs.html"
K95_SEGP = "https://zfin.org/zf_info/zfbook/stages/seg.html"
K95_HATCH = "https://zfin.org/zf_info/zfbook/stages/hatch_stgs.html"
K95_LARV = "https://zfin.org/zf_info/zfbook/stages/larv_stgs.html"
HL96 = "Haddon & Lewis 1996 J Comp Neurol 365:113-128 https://pubmed.ncbi.nlm.nih.gov/8821445/"
ZFIN_EAR = "https://zfin.org/zf_info/anatomy/dict/ear/ear.html"
ZFIN_OTO = "https://zfin.org/zf_info/anatomy/dict/oto/otolith.html"
ZFIN_SCC = "https://zfin.org/zf_info/anatomy/dict/semi_canal/semi.html"
ZFIN_SAG = "https://zfin.org/zf_info/anatomy/dict/stato/stato.html"
ZFIN_LL = "https://zfin.org/zf_info/anatomy/dict/lat_line/lat_line.html"
GENG13 = "Geng et al. 2013 Development 140:4362-4374 https://pubmed.ncbi.nlm.nih.gov/24067352/"
WB84 = "Waterman & Bell 1984 Anat Rec 210:101-114 https://pubmed.ncbi.nlm.nih.gov/6486477/"
BF02 = "Bever & Fekete 2002 Dev Dyn 223:536-543 https://pubmed.ncbi.nlm.nih.gov/11921341/"
KWAN12 = "Kwan et al. 2012 Development 139:359-372 https://pmc.ncbi.nlm.nih.gov/articles/PMC3243097/"
SD94 = "Schmitt & Dowling 1994 J Comp Neurol 344:532-542 https://pubmed.ncbi.nlm.nih.gov/7929890/"
LI00 = "Li, Joseph & Easter 2000 Dev Dyn 218:175-188 https://pubmed.ncbi.nlm.nih.gov/10822269/"
EN96 = "Easter & Nicola 1996 Dev Biol 180:646-663 https://pubmed.ncbi.nlm.nih.gov/8954734/"
HAUG10 = "Haug et al. 2010 Front Zool 7:8 https://pmc.ncbi.nlm.nih.gov/articles/PMC2848032/"
LENSOPT = "Wang et al. 2020 Exp Eye Res (optical development of the zebrafish lens) https://pmc.ncbi.nlm.nih.gov/articles/PMC10666921/"
LENSAD = "Bell et al. 2014 Exp Eye Res (adult lens about 1 mm) https://pmc.ncbi.nlm.nih.gov/articles/PMC4259836/"
GREIL09 = "Greiling & Clark 2009 Dev Dyn 238:2254-2265 https://pubmed.ncbi.nlm.nih.gov/19504455/"
DAHM07 = "Dahm et al. 2007 Exp Eye Res 85:74-89 https://pubmed.ncbi.nlm.nih.gov/17467692/"
PLLP20 = "Dalle Nogare et al. 2020 eLife 9:e58251 https://elifesciences.org/articles/58251"
NM13 = "Pinto-Teixeira et al. 2013 Front Neuroanat 7:33 https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2013.00033/full"
WADA13 = "Wada et al. 2013 PNAS 110:5659-5664 https://pubmed.ncbi.nlm.nih.gov/23509277/"
HZ93 = "Hansen & Zeiske 1993 J Comp Neurol 333:289-300 https://pubmed.ncbi.nlm.nih.gov/8345108/"
WW00 = "Whitlock & Westerfield 2000 Development 127:3645-3653 https://pubmed.ncbi.nlm.nih.gov/10934010/"
ENEURO25 = "eNeuro 2025 12(5) ENEURO.0043-25.2025 (about 60 trigeminal neurons) https://www.eneuro.org/content/12/5/ENEURO.0043-25.2025"
ZBRAIN = "Randlett et al. 2015 Nat Methods 12:1039-1046 (Z-Brain, 6 dpf) https://pmc.ncbi.nlm.nih.gov/articles/PMC4710481/"
MAPZ = "Kunst et al. 2019 Neuron 103:21-38 (mapzebrain, 6 dpf) https://pubmed.ncbi.nlm.nih.gov/31147152/"
AZBA = "Kenney et al. 2021 eLife 10:e69988 (AZBA, adult) https://elifesciences.org/articles/69988"
HILDE17 = "Hildebrand et al. 2017 Nature 545:345-349 https://pmc.ncbi.nlm.nih.gov/articles/PMC5594570/"
BRAINEMU = "State of Brain Emulation Report 2025 (secondary source) https://arxiv.org/pdf/2510.15745"
WULL96 = "Wullimann, Rupp & Reichert 1996 Neuroanatomy of the Zebrafish Brain (Birkhauser)"
PAR09 = "Parichy et al. 2009 Dev Dyn 238:2975-3015 https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/"
CHAP05 = "Chapman et al. 2005 J Comp Neurol 487:428-440 https://pubmed.ncbi.nlm.nih.gov/15906316/"
SNEL08 = "Snelson et al. 2008 Dev Dyn 237:3538-3544 https://pubmed.ncbi.nlm.nih.gov/18629869/"
LEKK19 = "Lekk et al. 2019 eLife 8:e47376 https://elifesciences.org/articles/47376"
BER13 = "Beretta et al. 2013 Neural Dev 8:19 https://neuraldevelopment.biomedcentral.com/articles/10.1186/1749-8104-8-19"
BAE09 = "Bae et al. 2009 Dev Biol 330:406-426 https://pubmed.ncbi.nlm.nih.gov/19371731/"
GS12 = "Gutzman & Sive 2012 J Vis Exp (ventricle inflation begins about 18 hpf) https://pubmed.ncbi.nlm.nih.gov/23128341/"
LS05 = "Lowery & Sive 2005 Development 132:2057-2067 https://pubmed.ncbi.nlm.nih.gov/15788456/"
FAME16 = "Fame et al. 2016 Fluids Barriers CNS 13:11 https://link.springer.com/article/10.1186/s12987-016-0036-z"
SWIN18 = "Swinburne et al. 2018 eLife 7:e37131 https://elifesciences.org/articles/37131"
ARAYA16 = "Araya et al. 2016 Dev Dyn 245:197-208 https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.24304"
EST = "estimate (no measured value found; scaled from reference images and body length)"

# Body length (Kimmel EL): 24 h 1.9 mm, 48 h 3.1 mm, 72 h 3.5 mm; 120 h about 3.9 mm (estimate); adult SL about 18 mm (Parichy 2009)

def S(label, hpf, dims, source):
    return dict(stageLabel=label, hpf=hpf, dims_um=dims, source=source)

def E(hpf, event):
    return dict(hpf=hpf, event=event)

# ---------- curated structures ----------
STRUCTS = []
def add(**kw):
    STRUCTS.append(kw)

# ===== early neural primordium =====
add(id="ZFA:0000132", system="nervous", parent="ZFA:0000012", zfaPartOf=None,
    spatial=dict(apFraction=[0.0, 1.0], dv="dorsal surface of the embryo, over the notochord and paraxial mesoderm", laterality="midline",
                 landmarks="Dorsal midline from the anterior neural plate (future forebrain, near the animal pole) to the tail bud. Widest anteriorly."),
    shape=dict(primitive="sheet", notes="Thick dorsal ectodermal sheet draped on the yolk sphere from 8 to 10 hpf. Model it as a spherical-cap strip. Width is about 300 um anteriorly and tapers to about 100 um posteriorly. Thickness is 3 to 6 cells anteriorly and 1 cell posteriorly."),
    sizes=[S("75%-epiboly", 8.0, dict(length=1000, width=300, thickness=25), EST + "; embryo diameter about 0.8 mm at 5-9 somites, " + K95_SEG),
           S("Bud", 10.0, dict(length=1200, width=250, thickness=30), EST + "; cell-layer counts from " + ARAYA16)],
    events=[E(4.0, "Presumptive neural plate specified in the dorsal ectoderm (ZFA presumptive neural plate starts at sphere)."),
            E(8.0, "Neural plate recognizable as a thickened dorsal ectoderm (ZFIN start, 75%-epiboly)."),
            E(10.0, "Convergence toward the dorsal midline starts; the plate folds into the neural keel (" + ARAYA16 + ")."),
            E(14.0, "Plate no longer present as a separate structure (ZFIN end, 5-9 somites).")],
    colorHint="#c9b8e8",
    sources=[ZF("ZFA:0000132"), K95_SEG, ARAYA16])

add(id="ZFA:0000131", system="nervous", parent="ZFA:0000012", zfaPartOf=None,
    spatial=dict(apFraction=[0.0, 1.0], dv="dorsal midline, above the notochord", laterality="midline",
                 landmarks="Runs from the anterior head (optic primordium bulges laterally from the anterior keel) to the tail bud."),
    shape=dict(primitive="tube", notes="Solid rod with a triangular cross-section (apex ventral). Extrude a triangle of width about 80 um and height about 60 um along the dorsal midline spline. Anterior head end swells to about 150 um."),
    sizes=[S("Bud", 10.0, dict(length=1300, width=80, height=60), EST),
           S("5-9 somites", 12.0, dict(length=1400, width=80, height=70), EST + "; embryo length 0.8 mm at 5-9 somites " + K95_SEG)],
    events=[E(10.0, "Neural keel forms by convergence of the neural plate (ZFIN start, bud)."),
            E(11.7, "Brain primordium thickened into the keel; optic primordium first distinguishable in side view (" + K95_SEG + ")."),
            E(14.0, "Keel rounds into the neural rod; three pronounced anterior thickenings visible (" + K95_SEG + ")."),
            E(16.0, "Keel stage over (ZFIN end, 10-13 somites).")],
    colorHint="#b9a4e0",
    sources=[ZF("ZFA:0000131"), K95_SEG, K95_SEGP, ARAYA16])

add(id="ZFA:0000133", system="nervous", parent="ZFA:0000012", zfaPartOf=None,
    spatial=dict(apFraction=[0.0, 1.0], dv="dorsal midline, above the notochord", laterality="midline",
                 landmarks="Head end shows the ten neuromere swellings; trunk portion lies above each somite pair."),
    shape=dict(primitive="tube", notes="Solid cylinder of about 60 um diameter along the dorsal spline, without a lumen. Head end widens into a series of bulges (neuromeres)."),
    sizes=[S("5-9 somites", 12.0, dict(length=1400, diameter=60), EST),
           S("14-19 somites", 16.0, dict(length=1600, diameter=65), EST + "; embryo length 0.9 mm at 14-19 somites " + K95_SEG)],
    events=[E(11.7, "Neural rod forms from the keel (ZFIN start, 5-9 somites)."),
            E(16.0, "About ten neuromeres visible along the rod; rhombomeres r2 to r6 visible dorsolaterally (" + K95_SEG + ")."),
            E(17.0, "Neural tube closure; brain morphogenesis begins (" + LS05 + ")."),
            E(19.0, "Rod hollows into the neural tube (ZFIN end, 14-19 somites).")],
    colorHint="#a892d8",
    sources=[ZF("ZFA:0000133"), K95_SEG, K95_SEGP, LS05])

add(id="ZFA:0001135", system="nervous", parent="ZFA:0000012", zfaPartOf=None,
    spatial=dict(apFraction=[0.0, 1.0], dv="dorsal midline, above the notochord", laterality="midline",
                 landmarks="The whole central nervous system from the telencephalon to the tail tip. Brain ventricles inflate along its anterior third."),
    shape=dict(primitive="tube", notes="Hollow tube: outer diameter about 60 to 70 um in the trunk, lumen (neurocoel) about 5 to 10 um. Anterior third swells into the three primary brain vesicles."),
    sizes=[S("14-19 somites", 16.0, dict(length=1600, diameter=65, lumen=8), EST),
           S("20-25 somites", 19.0, dict(length=2000, diameter=70, lumen=10), EST + "; embryo length 1.4 mm at 20-25 somites " + K95_SEG),
           S("Prim-5", 24.0, dict(length=2400, trunkWidth=35, trunkHeight=65), EST + "; embryo length 1.9 mm " + K95_PHAR)],
    events=[E(14.0, "Neural tube stage begins (ZFIN start, 10-13 somites)."),
            E(18.0, "Brain ventricle inflation begins (" + GS12 + ")."),
            E(19.0, "Hollowing of the rod into the tube nearly complete; ventricles present along the brain (" + K95_SEG + ")."),
            E(22.0, "Cerebrospinal fluid starts to fill the ventricles (" + LS05 + ")."),
            E(30.0, "ZFIN end (prim-5); the model should switch to brain plus spinal cord terms from 24 hpf.")],
    colorHint="#9a82d0",
    sources=[ZF("ZFA:0001135"), K95_SEG, GS12, LS05])

# ===== brain =====
add(id="ZFA:0000008", system="nervous", parent="ZFA:0000012", zfaPartOf="ZFA:0000012",
    spatial=dict(apFraction=[0.02, 0.32], dv="dorsal head, above the pharynx and notochord tip", laterality="midline",
                 apFractionByStage={"24": [0.03, 0.33], "120": [0.03, 0.22], "adult": [0.05, 0.25]},
                 landmarks="From the olfactory bulbs (anterior) to the obex where the medulla becomes spinal cord (about the level of the first somite / occipital region)."),
    shape=dict(primitive="custom", notes="Union of child lobes. Larva: five lobes in a row (telencephalon, diencephalon, midbrain, cerebellum, medulla). Adult: same lobes. Add paired olfactory bulbs, paired everted telencephalic hemispheres, paired large tectal lobes, a single corpus cerebelli, and a medulla that tapers into the cord."),
    sizes=[S("Prim-5", 24.0, dict(length=600, width=200, height=200), EST + "; head occupies about 0.3 of the 1.9 mm embryo " + K95_PHAR),
           S("Long-pec", 48.0, dict(length=700, width=300, height=250), EST),
           S("Day 5", 120.0, dict(length=800, width=400, height=250), "about 400 x 800 x 250 um (W x L x H) at 5 dpf, about 100,000 neurons; " + BRAINEMU + "; brain volume 5.49e7 um3 at 5.5 dpf, " + HILDE17),
           S("Day 6 (Z-Brain)", 144.0, dict(length=1100, width=500, height=280), "Z-Brain reference stack bounding box, voxels 0.8 x 0.8 x 2 um (" + ZBRAIN + "); stack extent about 500 x 1100 x 280 um (unverified, includes olfactory epithelium and anterior spinal cord)"),
           S("Adult", 2160.0, dict(length=4500, width=2500, thickness_min=400, thickness_max=2000), "length 4.5 mm, thickness 0.4 to 2 mm (" + BRAINEMU + " citing " + WULL96 + "); width 2.5 mm is an estimate; AZBA regions span 0.000026 to 0.53 mm3 (" + AZBA + ")")],
    events=[E(14.0, "Brain term starts (ZFIN, 10-13 somites); four subdivisions visible by 16 hpf (" + K95_SEG + ")."),
            E(16.0, "About ten neuromeres: three large anterior ones and seven rhombomeres (" + K95_SEGP + ")."),
            E(24.0, "Brain sculptured into five lobes (" + K95_PHARP + ")."),
            E(120.0, "Larval brain about 800 um long; layered cerebellum and tectum present (" + BAE09 + ")."),
            E(2160.0, "Adult brain about 4.5 mm long (" + BRAINEMU + ").")],
    colorHint="#8b6fc8",
    sources=[ZF("ZFA:0000008"), K95_SEG, K95_PHARP, ZBRAIN, MAPZ, AZBA, HILDE17, BRAINEMU])

add(id="ZFA:0000109", system="nervous", parent="ZFA:0000008", zfaPartOf="ZFA:0000008",
    spatial=dict(apFraction=[0.02, 0.15], dv="anterior brain, dorsal to the mouth and pituitary", laterality="midline",
                 apFractionByStage={"24": [0.03, 0.16], "120": [0.03, 0.12], "adult": [0.05, 0.13]},
                 landmarks="Anterior to the midbrain; the eyes attach to it through the optic stalks."),
    shape=dict(primitive="custom", notes="Group node. Render as the union of telencephalon and diencephalon."),
    sizes=[S("Prim-5", 24.0, dict(length=250, width=180, height=200), EST),
           S("Long-pec", 48.0, dict(length=300, width=250, height=230), EST),
           S("Day 5", 120.0, dict(length=350, width=320, height=250), EST + "; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=2000, width=1800, height=1200), EST + "; adult brain 4.5 mm long " + BRAINEMU)],
    events=[E(6.0, "Presumptive forebrain in the gastrula (ZFA presumptive forebrain, shield)."),
            E(14.0, "Forebrain distinguishable (ZFIN start, 10-13 somites)."),
            E(16.0, "Telencephalon and diencephalon are separate swellings (" + K95_SEG + ").")],
    colorHint="#9d7fd6",
    sources=[ZF("ZFA:0000109"), K95_SEG])

add(id="ZFA:0000079", system="nervous", parent="ZFA:0000109", zfaPartOf="ZFA:0000109",
    spatial=dict(apFraction=[0.02, 0.08], dv="most anterior and dorsal brain lobe, above the olfactory pits", laterality="midline (paired hemispheres from about 48 hpf)",
                 apFractionByStage={"24": [0.03, 0.09], "120": [0.03, 0.08], "adult": [0.06, 0.12]},
                 landmarks="Anterior to the diencephalon; olfactory bulbs at its anterior tip; sits between the two eyes in the larva."),
    shape=dict(primitive="ellipsoid", notes="Larva: single ellipsoid with a shallow dorsal midline groove. Adult: two everted hemispheres, model as two side-by-side ellipsoids (each about 1.2 x 0.7 x 0.9 mm) fused ventrally."),
    sizes=[S("Prim-5", 24.0, dict(length=120, width=120, height=130), EST),
           S("Long-pec", 48.0, dict(length=150, width=160, height=150), EST),
           S("Day 5", 120.0, dict(length=200, width=200, height=150), EST + "; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=1200, width=1500, height=900), EST + "; both hemispheres; brain 4.5 mm long " + BRAINEMU)],
    events=[E(10.3, "Presumptive telencephalon (ZFA, 1-4 somites)."),
            E(14.0, "Telencephalon distinguishable (ZFIN start, 10-13 somites)."),
            E(16.0, "Telencephalon is one of four prominent brain subdivisions (" + K95_SEG + ")."),
            E(48.0, "Eversion of the telencephalic roof starts; hemispheres become visible (ZFA definition; timing unverified)."),
            E(2160.0, "Adult everted pallium with dorsal, medial, lateral and central zones (" + WULL96 + ").")],
    colorHint="#b48ee6",
    sources=[ZF("ZFA:0000079"), K95_SEG, WULL96])

add(id="ZFA:0000402", system="nervous", parent="ZFA:0000079", zfaPartOf="ZFA:0000079",
    spatial=dict(apFraction=[0.02, 0.04], dv="anterior tip of the telencephalon, at the level of the olfactory pits", laterality="paired",
                 apFractionByStage={"48": [0.03, 0.05], "120": [0.02, 0.04], "adult": [0.05, 0.07]},
                 landmarks="Directly posterior to each olfactory pit; connected to the telencephalon by short olfactory tracts in the adult."),
    shape=dict(primitive="sphere", notes="Two small spheres at the anterior face of the telencephalon. In the adult they are distinct bulbs about 0.6 mm across on short stalks."),
    sizes=[S("Long-pec", 48.0, dict(diameter=40), EST + "; protoglomeruli appear at 48 hpf (ZFA olfactory bulb protoglomerulus)"),
           S("Day 5", 120.0, dict(diameter=60), EST),
           S("Adult", 2160.0, dict(length=700, width=600, height=500), EST + "; AZBA largest region 0.53 mm3 for scale " + AZBA)],
    events=[E(42.0, "Olfactory bulb recognizable (ZFIN start, high-pec)."),
            E(48.0, "Protoglomeruli form; olfactory axons already reached the forebrain during placode stages (" + HZ93 + ")."),
            E(72.0, "Dorsal and ventral bulb zones defined (ZFA zones start at protruding-mouth).")],
    colorHint="#c7a6f0",
    sources=[ZF("ZFA:0000402"), HZ93, AZBA])

add(id="ZFA:0000101", system="nervous", parent="ZFA:0000109", zfaPartOf="ZFA:0000109",
    spatial=dict(apFraction=[0.07, 0.15], dv="ventral and posterior forebrain, between the eyes; hypothalamus forms its floor", laterality="midline",
                 apFractionByStage={"24": [0.08, 0.16], "120": [0.07, 0.12], "adult": [0.09, 0.14]},
                 landmarks="Posterior to the telencephalon, anterior to the midbrain; eyes attach here via the optic stalks; epiphysis on its roof, pituitary under its floor."),
    shape=dict(primitive="ellipsoid", notes="Ellipsoid wedge between telencephalon and midbrain; taller than wide in the larva. Contains the third ventricle."),
    sizes=[S("Prim-5", 24.0, dict(length=150, width=150, height=200), EST),
           S("Long-pec", 48.0, dict(length=180, width=200, height=230), EST),
           S("Day 5", 120.0, dict(length=250, width=250, height=250), EST + "; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=1200, width=1200, height=1200), EST)],
    events=[E(10.3, "Presumptive diencephalon (ZFA, 1-4 somites)."),
            E(14.0, "Diencephalon distinguishable (ZFIN start, 10-13 somites)."),
            E(22.0, "Rudiments of epiphysis and hypothalamus visible in the diencephalon (" + K95_SEG + ")."),
            E(24.0, "Mid-diencephalic organizer active (ZFA, prim-5).")],
    colorHint="#8f74cf",
    sources=[ZF("ZFA:0000101"), K95_SEG])

add(id="ZFA:0000032", system="nervous", parent="ZFA:0000101", zfaPartOf="ZFA:0000101",
    spatial=dict(apFraction=[0.09, 0.15], dv="ventral-most forebrain, floor of the diencephalon, above the pituitary", laterality="midline",
                 apFractionByStage={"24": [0.10, 0.16], "120": [0.08, 0.13], "adult": [0.10, 0.15]},
                 landmarks="Ventral bulge of the diencephalon; the pituitary hangs from its floor; in the adult the inferior lobes bulge ventrolaterally."),
    shape=dict(primitive="ellipsoid", notes="Ventral ellipsoid under the diencephalon. Adult: add two lateral inferior lobes (each about 0.6 mm) so the ventral view shows a trilobed floor."),
    sizes=[S("Prim-5", 24.0, dict(length=100, width=100, height=80), EST),
           S("Long-pec", 48.0, dict(length=150, width=150, height=100), EST),
           S("Day 5", 120.0, dict(length=200, width=180, height=120), EST + "; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=1200, width=1300, height=800), EST)],
    events=[E(22.0, "Hypothalamic rudiment visible (ZFIN start, 26+ somites; " + K95_SEG + ")."),
            E(48.0, "Intermediate hypothalamus defined (ZFA, long-pec)."),
            E(72.0, "Neurohypophysis becomes distinct under the hypothalamus (" + CHAP05 + ").")],
    colorHint="#7d63bf",
    sources=[ZF("ZFA:0000032"), K95_SEG, CHAP05])

add(id="ZFA:0000118", system="nervous", parent="ZFA:0000101", zfaPartOf="ZFA:0000101",
    spatial=dict(apFraction=[0.10, 0.13], dv="ventral to the hypothalamus, dorsal to the roof of the mouth", laterality="midline",
                 apFractionByStage={"24": [0.09, 0.11], "120": [0.10, 0.12], "adult": [0.12, 0.14]},
                 landmarks="Midline, directly under the diencephalic floor, between and slightly behind the eyes. In the adult it sits in a shallow fossa of the skull base."),
    shape=dict(primitive="ellipsoid", notes="Small flattened ellipsoid pressed against the hypothalamic floor. Adult: oval about 0.5 x 0.35 x 0.3 mm (estimate)."),
    sizes=[S("Prim-5", 24.0, dict(length=60, width=40, height=30), EST + "; pituitary reaches its maximum relative volume at 24 hpf (" + CHAP05 + ")"),
           S("Long-pec", 48.0, dict(length=60, width=35, height=30), EST + "; anterior and posterior domains 48 to 64 hpf (POMC-GFP)"),
           S("Day 5", 120.0, dict(length=80, width=50, height=40), EST),
           S("Adult", 2160.0, dict(length=500, width=350, height=300), EST)],
    events=[E(19.0, "Hypophysis term starts (ZFIN, 20-25 somites); placode cells at the anterior neural ridge."),
            E(24.0, "Adenohypophysis morphologically distinct; placode cells fuse into one mass after 24 hpf (" + CHAP05 + ")."),
            E(48.0, "Adenohypophysis term starts (ZFA); hypophyseal capillary forms."),
            E(72.0, "Neurohypophysis distinct (" + CHAP05 + ").")],
    colorHint="#e0a86b",
    sources=[ZF("ZFA:0000118"), CHAP05])

add(id="ZFA:0000019", system="nervous", parent="ZFA:0000101", zfaPartOf="ZFA:0001359",
    spatial=dict(apFraction=[0.08, 0.10], dv="dorsal midline of the diencephalon, at the brain surface under the skin", laterality="midline (parapineal to the left)",
                 apFractionByStage={"24": [0.09, 0.10], "120": [0.07, 0.09], "adult": [0.09, 0.11]},
                 landmarks="Dorsal roof of the diencephalon, rostral to the posterior commissure, between the eyes in dorsal view."),
    shape=dict(primitive="sphere", notes="Small sphere on the dorsal brain surface. Adult: end vesicle about 0.3 mm on a thin stalk (ZFA epiphyseal stalk from 45 dpf)."),
    sizes=[S("Prim-5", 24.0, dict(diameter=35), EST + "; pineal complex anlage about 30 to 32 cells at 24 hpf (" + SNEL08 + ")"),
           S("Long-pec", 48.0, dict(diameter=45), EST),
           S("Day 5", 120.0, dict(length=60, width=45, height=40), EST),
           S("Adult", 2160.0, dict(length=300, width=200, height=150), EST)],
    events=[E(14.0, "Epiphysis term starts (ZFIN, 10-13 somites); epiphyseal cluster from 16 hpf."),
            E(22.0, "Epiphysis rudiment visible (" + K95_SEG + ")."),
            E(24.0, "About 30 pineal complex cells; anterior cells give rise to the parapineal (" + SNEL08 + ")."),
            E(26.0, "Parapineal migrates to the left between 24 and 32 hpf; ablation at 24 to 28 hpf gives symmetric habenulae (" + LEKK19 + ")."),
            E(1080.0, "Epiphyseal stalk elongates (ZFA, 45-89 dpf).")],
    colorHint="#f0d36b",
    sources=[ZF("ZFA:0000019"), K95_SEG, SNEL08, LEKK19])

add(id="ZFA:0000213", system="nervous", parent="ZFA:0000101", zfaPartOf="ZFA:0000509",
    spatial=dict(apFraction=[0.08, 0.10], dv="dorsal diencephalon (epithalamus), lateral to the pineal stalk", laterality="paired, left larger",
                 apFractionByStage={"48": [0.08, 0.10], "120": [0.07, 0.09], "adult": [0.09, 0.11]},
                 landmarks="Two nuclei flanking the third ventricle under the pineal; the left dorsal habenula is larger with more neuropil."),
    shape=dict(primitive="ellipsoid", notes="Two ellipsoids either side of the midline; scale the left one about 1.2x. Internal structure; visible only in cut-away or transparent brain mode."),
    sizes=[S("Long-pec", 48.0, dict(length=30, width=25, height=25), EST),
           S("Day 5", 120.0, dict(length=50, width=40, height=35), EST + "; left larger than right (unmeasured here)"),
           S("Adult", 2160.0, dict(length=400, width=300, height=250), EST)],
    events=[E(32.0, "Left-biased habenular neurogenesis begins after parapineal migration (unverified exact hour)."),
            E(48.0, "Habenula term starts (ZFIN, long-pec); ventral habenula forms from 48 hpf to 4 dpf (" + BER13 + ")."),
            E(96.0, "Dorsal habenular asymmetry established; ventral habenula complete (" + BER13 + ").")],
    colorHint="#d9b3ff",
    sources=[ZF("ZFA:0000213"), BER13, LEKK19])

add(id="ZFA:0000128", system="nervous", parent="ZFA:0000008", zfaPartOf="ZFA:0000008",
    spatial=dict(apFraction=[0.13, 0.22], dv="dorsal head between the eyes and the ear; dorsal tectum, ventral tegmentum", laterality="midline (paired tectal lobes)",
                 apFractionByStage={"24": [0.15, 0.23], "120": [0.11, 0.18], "adult": [0.11, 0.18]},
                 landmarks="Posterior to the diencephalon, anterior to the midbrain-hindbrain boundary constriction; largest dorsal lobe in the larva."),
    shape=dict(primitive="ellipsoid", notes="Ellipsoid with a dorsal midline groove separating the two tectal lobes; ventral half is the tegmentum. Contains the tectal ventricle."),
    sizes=[S("Prim-5", 24.0, dict(length=180, width=200, height=200), EST),
           S("Long-pec", 48.0, dict(length=250, width=280, height=220), EST),
           S("Day 5", 120.0, dict(length=300, width=350, height=250), EST + "; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=1800, width=2200, height=1200), EST)],
    events=[E(6.0, "Presumptive midbrain (ZFA, shield)."),
            E(14.0, "Midbrain distinguishable (ZFIN start, 10-13 somites)."),
            E(16.0, "Midbrain-hindbrain boundary constriction forms (ZFA, 14-19 somites)."),
            E(24.0, "Optic tectum and tegmentum terms start (ZFIN, prim-5).")],
    colorHint="#7c9fe0",
    sources=[ZF("ZFA:0000128"), K95_SEG])

add(id="ZFA:0000445", system="nervous", parent="ZFA:0000128", zfaPartOf="ZFA:0000128",
    spatial=dict(apFraction=[0.13, 0.21], dv="dorsal midbrain, directly under the skull roof", laterality="paired lobes",
                 apFractionByStage={"24": [0.15, 0.22], "120": [0.11, 0.18], "adult": [0.11, 0.17]},
                 landmarks="Two dorsal lobes behind the eyes; the largest visible brain structure in a dorsal view of larva and adult."),
    shape=dict(primitive="ellipsoid", notes="Two dorsolateral ellipsoids (one per lobe) meeting at the midline. Larva: each lobe about 300 x 150 x 120 um at 5 dpf. Adult: each lobe about 1.6 x 1.0 x 0.9 mm (estimate)."),
    sizes=[S("Prim-5", 24.0, dict(length=150, width=180, height=100), EST + "; each lobe about 150 x 90 um"),
           S("Long-pec", 48.0, dict(length=220, width=250, height=130), EST + "; retinal axons arrive at the tectum from about 46 hpf (unverified)"),
           S("Day 5", 120.0, dict(length=300, width=320, height=150), EST + "; both lobes; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=1600, width=2000, height=900), EST + "; both lobes; AZBA largest single region 0.53 mm3 " + AZBA)],
    events=[E(24.0, "Optic tectum term starts (ZFIN, prim-5)."),
            E(72.0, "First visual behaviors 68 to 80 hpf rely on retinotectal input (" + EN96 + ")."),
            E(120.0, "Tectum supports prey capture at 5 dpf; layered neuropil present (" + BAE09 + " for layering context).")],
    colorHint="#6f96e6",
    sources=[ZF("ZFA:0000445"), EN96, ZBRAIN, AZBA])

add(id="ZFA:0000042", system="nervous", parent="ZFA:0000008", zfaPartOf="ZFA:0000008",
    spatial=dict(apFraction=[0.21, 0.23], dv="dorsal brain surface constriction between midbrain and cerebellum", laterality="midline",
                 apFractionByStage={"24": [0.22, 0.24], "120": [0.17, 0.19], "adult": [0.16, 0.18]},
                 landmarks="Deep transverse fold on the dorsal brain between the tectal lobes and the cerebellar plate; visible from outside in the embryo."),
    shape=dict(primitive="custom", notes="Not a solid. Model it as a ring-shaped groove (a torus scaled to the brain diameter). A thin transverse marker disc at the midbrain/hindbrain junction also works."),
    sizes=[S("Prim-5", 24.0, dict(ringDiameter=180, grooveDepth=30), EST),
           S("Long-pec", 48.0, dict(ringDiameter=230, grooveDepth=40), EST),
           S("Day 5", 120.0, dict(ringDiameter=280, grooveDepth=40), EST),
           S("Adult", 2160.0, dict(ringDiameter=1500, grooveDepth=150), EST)],
    events=[E(8.0, "Presumptive midbrain-hindbrain boundary (ZFA, 75%-epiboly)."),
            E(16.0, "Boundary and its constriction visible (ZFIN start, 14-19 somites)."),
            E(24.0, "Constriction requires laminin-dependent basal constriction, deepest at 24 to 30 hpf (unverified hour).")],
    colorHint="#5b7fd0",
    sources=[ZF("ZFA:0000042"), ZF("ZFA:0007125")])

add(id="ZFA:0000029", system="nervous", parent="ZFA:0000008", zfaPartOf="ZFA:0000008",
    spatial=dict(apFraction=[0.22, 0.33], dv="dorsal head over the pharynx, medial to the otic vesicles", laterality="midline",
                 apFractionByStage={"24": [0.23, 0.34], "120": [0.18, 0.23], "adult": [0.17, 0.25]},
                 landmarks="From the midbrain-hindbrain boundary to the obex; the otic vesicle lies lateral to rhombomere 5."),
    shape=dict(primitive="tube", notes="Tapered tube widest anteriorly; dorsal cerebellum bump at its front, thin roof plate over the fourth ventricle. Embryo: segment the tube into 7 to 8 rhombomere bulges."),
    sizes=[S("Prim-5", 24.0, dict(length=400, width=150, height=150), EST),
           S("Long-pec", 48.0, dict(length=450, width=200, height=180), EST),
           S("Day 5", 120.0, dict(length=450, width=280, height=200), EST + "; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=1800, width=1500, height=1200), EST)],
    events=[E(6.0, "Presumptive hindbrain (ZFA, shield)."),
            E(14.0, "Hindbrain distinguishable; rhombomeres appear (ZFIN start, 10-13 somites)."),
            E(16.0, "Rhombomeres r2 to r6 visible dorsolaterally (" + K95_SEG + ")."),
            E(19.0, "Seven rhombomeres prominent; cerebellar rudiment first recognizable (" + K95_SEG + ")."),
            E(22.0, "Statoacoustic ganglion neuroblasts delaminate from the ear beside the hindbrain (" + ZFIN_SAG + ").")],
    colorHint="#6aa6c9",
    sources=[ZF("ZFA:0000029"), K95_SEG])

add(id="ZFA:0000100", system="nervous", parent="ZFA:0000029", zfaPartOf="ZFA:0000029",
    spatial=dict(apFraction=[0.21, 0.25], dv="dorsal anterior hindbrain, directly behind the tectum", laterality="midline",
                 apFractionByStage={"24": [0.23, 0.25], "120": [0.17, 0.20], "adult": [0.15, 0.20]},
                 landmarks="Dorsal plate behind the midbrain-hindbrain constriction; in the adult the corpus cerebelli is a single dorsal lobe with the valvula tucked under the tectum."),
    shape=dict(primitive="ellipsoid", notes="Larva: transverse plate (wide, short, thin). Adult: single rounded lobe (corpus cerebelli) about 1.0 x 1.2 x 0.8 mm plus lateral eminentiae granulares; valvula hidden under the tectum."),
    sizes=[S("Prim-5", 24.0, dict(length=50, width=150, height=40), EST + "; cerebellar primordium prominent at 22 hpf " + K95_SEG),
           S("Long-pec", 48.0, dict(length=80, width=200, height=60), EST + "; cerebellar plate term starts 42 hpf (ZFA)"),
           S("Day 5", 120.0, dict(length=120, width=250, height=80), EST + "; layers first detectable at 5 dpf " + BAE09),
           S("Adult", 2160.0, dict(length=1000, width=1200, height=800), EST + "; corpus cerebelli only")],
    events=[E(19.0, "Cerebellar rudiment first recognizable (" + K95_SEG + ")."),
            E(22.0, "Cerebellum term starts (ZFIN, 26+ somites); primordium prominent."),
            E(72.0, "GABAergic and glutamatergic neuron differentiation begins at 3 dpf (" + BAE09 + ")."),
            E(120.0, "Purkinje and granule layers first detectable at 5 dpf (" + BAE09 + ").")],
    colorHint="#4fb3a6",
    sources=[ZF("ZFA:0000100"), K95_SEG, BAE09])

add(id="ZFA:0000545", system="nervous", parent="ZFA:0000029", zfaPartOf="ZFA:0000029",
    visibleFromHpf=24.0, visibleNote="ZFIN start stage is Unknown. Kimmel describes the brain as five lobes at 24 hpf; the fifth lobe is the medulla (myelencephalon). Show it from 24 hpf.",
    spatial=dict(apFraction=[0.24, 0.33], dv="ventral and posterior hindbrain, under the fourth ventricle", laterality="midline",
                 apFractionByStage={"24": [0.25, 0.34], "120": [0.19, 0.23], "adult": [0.18, 0.25]},
                 landmarks="Posterior to the cerebellum, tapering into the spinal cord at the obex; otic vesicles lie lateral to its anterior half."),
    shape=dict(primitive="tube", notes="Truncated cone: anterior diameter about equal to the hindbrain width, posterior diameter equal to the spinal cord. Flat dorsal surface (floor of the fourth ventricle)."),
    sizes=[S("Prim-5", 24.0, dict(length=350, width=140, height=130), EST),
           S("Long-pec", 48.0, dict(length=380, width=180, height=160), EST),
           S("Day 5", 120.0, dict(length=350, width=250, height=200), EST + "; scaled from Z-Brain " + ZBRAIN),
           S("Adult", 2160.0, dict(length=1200, width=1200, height=1000), EST)],
    events=[E(24.0, "Myelencephalic lobe visible as the fifth brain lobe (" + K95_PHARP + ")."),
            E(48.0, "Vagal and facial lobes and reticular nuclei differentiate (unverified timing).")],
    colorHint="#5f9bb8",
    sources=[ZF("ZFA:0000545"), K95_PHARP])

add(id="ZFA:0001064", system="nervous", parent="ZFA:0000029", zfaPartOf="ZFA:0000029",
    modelEndHpf=72.0, modelEndNote="ZFIN end stage is Unknown. Rhombomere boundaries are morphologically clear from 14 to about 48 hpf and fade by 72 hpf; hide the segment array after 72 hpf (estimate).",
    spatial=dict(apFraction=[0.22, 0.33], dv="whole dorsoventral extent of the hindbrain", laterality="midline, bilaterally symmetric",
                 landmarks="Seven (r1 to r7) or eight segments from the midbrain-hindbrain boundary to the first somite. The otic vesicle sits lateral to r5. The trigeminal ganglion lies lateral to r2."),
    shape=dict(primitive="segmentArray", notes="Array of 7 to 8 short barrel segments along the hindbrain tube. Each is about 50 um long at 24 hpf. Shallow constrictions separate them. Use it as a repeating texture or as separate selectable bulges."),
    sizes=[S("14-19 somites", 16.0, dict(segmentLength=40, count=5, width=120), EST + "; r2 to r6 visible at 16 hpf " + K95_SEG),
           S("Prim-5", 24.0, dict(segmentLength=50, count=7, width=150), EST + "; seven rhombomeres " + K95_SEG),
           S("Long-pec", 48.0, dict(segmentLength=60, count=7, width=200), EST)],
    events=[E(10.0, "Presumptive rhombomeres 1 to 8 (ZFA, bud)."),
            E(14.0, "Rhombomeres visible (ZFIN start, 10-13 somites)."),
            E(16.0, "r2 to r6 visible in dorsolateral view (" + K95_SEG + ")."),
            E(19.0, "Seven rhombomeres prominent (" + K95_SEG + ")."),
            E(72.0, "Boundaries no longer obvious externally (estimate).")],
    colorHint="#7fb8d9",
    sources=[ZF("ZFA:0001064"), K95_SEG, K95_SEGP])

add(id="ZFA:0000075", system="nervous", parent="ZFA:0000012", zfaPartOf="ZFA:0000012",
    spatial=dict(apFraction=[0.33, 0.98], dv="directly dorsal to the notochord, ventral to the dorsal fin fold and epidermis; between the left and right myotomes", laterality="midline",
                 apFractionByStage={"24": [0.34, 0.98], "120": [0.23, 0.98], "adult": [0.25, 0.98]},
                 landmarks="Starts at the obex behind the medulla and runs to the tail tip above the notochord. Dorsal root ganglia sit on it segmentally from 24 hpf."),
    shape=dict(primitive="tube", notes="Tube along the body spline, taller than wide in cross-section (oval, height about 2x width in the embryo), tapering toward the tail. Central canal about 5 um."),
    sizes=[S("Prim-5", 24.0, dict(length=1250, width=30, height=60), EST + "; embryo length 1.9 mm " + K95_PHAR),
           S("Long-pec", 48.0, dict(length=2200, width=35, height=70), EST + "; embryo length 3.1 mm " + K95_HATCH),
           S("Day 5", 120.0, dict(length=2900, width=45, height=80), EST + "; larva about 3.9 mm (estimate from 3.5 mm at 72 hpf " + K95_LARV + ")"),
           S("Adult", 2160.0, dict(length=13000, diameter=450), EST + "; adult SL about 18 mm " + PAR09)],
    events=[E(6.0, "Presumptive spinal cord (ZFA, shield)."),
            E(16.0, "Rohon-Beard and trigeminal sensory axons start to cover the skin (" + K95_SEGP + ")."),
            E(17.0, "Primary motoneurons differentiate, three to four per hemisegment (" + K95_SEGP + ")."),
            E(24.0, "Spinal cord term starts (ZFIN, prim-5); dorsal root ganglia appear (ZFA)."),
            E(48.0, "Myelination of the cord begins around 2 to 3 dpf (unverified).")],
    colorHint="#a48bd6",
    sources=[ZF("ZFA:0000075"), K95_SEGP, K95_PHAR, K95_HATCH, K95_LARV, PAR09])

# ===== ventricles =====
add(id="ZFA:0001259", system="nervous", parent="ZFA:0000109", zfaPartOf="ZFA:0000109",
    modelEndHpf=72.0, modelEndNote="ZFIN end stage is Unknown. ZFA telencephalic and third ventricles develop from it; switch names at about 72 hpf (estimate).",
    spatial=dict(apFraction=[0.04, 0.14], dv="lumen of the forebrain, dorsal midline", laterality="midline",
                 landmarks="Slit-like cavity in the telencephalon opening into the taller diencephalic (third) ventricle; visible as a clear space in the live embryo."),
    shape=dict(primitive="custom", notes="Negative space: a thin vertical slit (telencephalic part) continuous with a tall narrow diencephalic chamber. Render as a translucent inner mesh or as a cut-away."),
    sizes=[S("14-19 somites", 16.0, dict(length=80, width=15, height=60), EST),
           S("Prim-5", 24.0, dict(length=200, width=40, height=150), EST),
           S("Long-pec", 48.0, dict(length=250, width=50, height=180), EST)],
    events=[E(16.0, "Forebrain ventricle term starts (ZFIN, 14-19 somites); inflation begins at about 18 hpf (" + GS12 + ")."),
            E(22.0, "Cerebrospinal fluid begins to fill the ventricles (" + LS05 + ")."),
            E(28.0, "Directional CSF flow from diencephalic to rhombencephalic ventricle at 27 to 30 hpf (" + FAME16 + ").")],
    colorHint="#e6f2ff",
    sources=[ZF("ZFA:0001259"), GS12, LS05, FAME16])

add(id="ZFA:0000159", system="nervous", parent="ZFA:0000128", zfaPartOf="ZFA:0000128",
    spatial=dict(apFraction=[0.14, 0.22], dv="lumen of the midbrain under the tectal lobes", laterality="midline",
                 landmarks="Wide chamber under the tectum; in the adult a narrow cleft between the tectal hemispheres and the torus."),
    shape=dict(primitive="ellipsoid", notes="Negative space: flattened ellipsoid inside the midbrain, widest dorsally. Render as a translucent inner mesh."),
    sizes=[S("Prim-5", 24.0, dict(length=150, width=120, height=100), EST),
           S("Long-pec", 48.0, dict(length=180, width=150, height=100), EST),
           S("Day 5", 120.0, dict(length=200, width=150, height=80), EST),
           S("Adult", 2160.0, dict(length=1200, width=300, height=200), EST)],
    events=[E(14.0, "Tectal ventricle term starts (ZFIN, 10-13 somites)."),
            E(18.0, "Ventricle inflation begins (" + GS12 + ").")],
    colorHint="#e6f2ff",
    sources=[ZF("ZFA:0000159"), GS12, LS05])

add(id="ZFA:0000110", system="nervous", parent="ZFA:0000029", zfaPartOf="ZFA:0000029",
    spatial=dict(apFraction=[0.22, 0.32], dv="lumen of the hindbrain under a thin roof plate", laterality="midline",
                 landmarks="Diamond-shaped in dorsal view in the embryo. A thin epithelium roofs it, so it appears as a clear dorsal window between the otic vesicles."),
    shape=dict(primitive="custom", notes="Negative space: rhombic prism (wide in the middle, pointed at both ends) with a flat floor. Its dorsal roof is a thin sheet, so it reads as an open dorsal window in the embryo."),
    sizes=[S("14-19 somites", 16.0, dict(length=150, width=60, height=40), EST),
           S("Prim-5", 24.0, dict(length=350, width=120, height=80), EST),
           S("Long-pec", 48.0, dict(length=400, width=150, height=90), EST),
           S("Day 5", 120.0, dict(length=400, width=180, height=80), EST),
           S("Adult", 2160.0, dict(length=1500, width=800, height=300), EST)],
    events=[E(16.0, "Fourth ventricle term starts (ZFIN, 14-19 somites)."),
            E(18.0, "Inflation begins (" + GS12 + ")."),
            E(24.0, "Choroid plexus tela over the fourth ventricle (ZFA, prim-5).")],
    colorHint="#e6f2ff",
    sources=[ZF("ZFA:0000110"), GS12, LS05])

# ===== cranial ganglia =====
add(id="ZFA:0000295", system="nervous", parent="ZFA:0000142", zfaPartOf=None,
    spatial=dict(apFraction=[0.16, 0.19], dv="lateral to the hindbrain (r2), at the level of the eye's posterior margin, under the skin", laterality="paired",
                 apFractionByStage={"24": [0.17, 0.19], "120": [0.13, 0.15], "adult": [0.13, 0.15]},
                 landmarks="Between the eye and the otic vesicle, lateral to rhombomere 2, just under the epidermis; its axons fan over the head skin."),
    shape=dict(primitive="ellipsoid", notes="Small ellipsoid lateral to the anterior hindbrain, long axis anteroposterior."),
    sizes=[S("Prim-5", 24.0, dict(length=45, width=25, height=25), EST + "; about 60 neurons (" + ENEURO25 + ")"),
           S("Long-pec", 48.0, dict(length=55, width=30, height=30), EST),
           S("Day 5", 120.0, dict(length=70, width=40, height=35), EST),
           S("Adult", 2160.0, dict(length=400, width=250, height=200), EST)],
    events=[E(10.3, "Trigeminal placode and trigeminal neural crest (ZFA, 1-4 somites)."),
            E(16.0, "Peripheral sensory axons begin to cover the skin (" + K95_SEGP + ")."),
            E(19.0, "Trigeminal ganglion term starts (ZFIN, 20-25 somites)."),
            E(24.0, "Touch-evoked responses present; about 60 sensory neurons (" + ENEURO25 + ").")],
    colorHint="#f2b880",
    sources=[ZF("ZFA:0000295"), K95_SEGP, ENEURO25])

add(id="ZFA:0000588", system="nervous", parent="ZFA:0000142", zfaPartOf="ZFA:0001138",
    spatial=dict(apFraction=[0.24, 0.27], dv="ventromedial to the otic vesicle, lateral to the ventral hindbrain", laterality="paired",
                 landmarks="Between the anteroventral floor of the ear and the hindbrain. By 4 dpf it sits between the ventromedial ear wall and the ventral hindbrain (" + ZFIN_SAG + ")."),
    shape=dict(primitive="ellipsoid", notes="Ellipsoid tucked under the anterior half of the otic vesicle."),
    sizes=[S("Prim-5", 24.0, dict(length=40, width=25, height=20), EST + "; loose aggregate until 28 hpf " + ZFIN_SAG),
           S("Long-pec", 48.0, dict(length=60, width=35, height=30), EST + "; compact by 48 hpf " + ZFIN_SAG),
           S("Day 5", 120.0, dict(length=80, width=45, height=40), EST),
           S("Adult", 2160.0, dict(length=500, width=300, height=250), EST)],
    events=[E(22.0, "Neuroblasts begin to delaminate from the otic floor (26-somite stage; " + ZFIN_SAG + "); ZFIN start 26+ somites."),
            E(24.0, "First HNK-1 positive neurons; peak delamination 22 to 30 hpf (" + HL96 + ")."),
            E(42.0, "Delamination ends (" + ZFIN_SAG + ")."),
            E(48.0, "Ganglion compact (" + ZFIN_SAG + ").")],
    colorHint="#f2b880",
    sources=[ZF("ZFA:0000588"), ZFIN_SAG, HL96])

add(id="ZFA:0001314", system="nervous", parent="ZFA:0000034", zfaPartOf="ZFA:0000034",
    spatial=dict(apFraction=[0.27, 0.30], dv="posterior and slightly ventral to the otic vesicle, under the skin", laterality="paired",
                 landmarks="Directly behind the otic vesicle at the origin of the posterior lateral line nerve, which runs along the horizontal myoseptum."),
    shape=dict(primitive="ellipsoid", notes="Small ellipsoid behind the ear; add a thin tube (nerve) along the horizontal myoseptum to the tail if nerves are shown."),
    sizes=[S("Prim-5", 24.0, dict(length=35, width=20, height=20), EST),
           S("Long-pec", 48.0, dict(length=50, width=30, height=25), EST),
           S("Day 5", 120.0, dict(length=60, width=35, height=30), EST),
           S("Adult", 2160.0, dict(length=350, width=200, height=180), EST)],
    events=[E(14.0, "Posterior lateral line placode (ZFA, 10-13 somites)."),
            E(24.0, "Ganglion term starts (ZFIN, prim-5); its axons follow the migrating primordium.")],
    colorHint="#f2b880",
    sources=[ZF("ZFA:0001314"), ZFIN_LL])

# ===== lateral line =====
add(id="ZFA:0000034", system="sensory", parent="ZFA:0000142", zfaPartOf="ZFA:0000142",
    spatial=dict(apFraction=[0.02, 1.0], dv="skin surface, head and trunk; trunk line on the horizontal myoseptum", laterality="paired, bilateral",
                 landmarks="Eight distinct lines in the 4 dpf larva: supraorbital, infraorbital, mandibular, opercular, otic, middle, occipital, posterior (" + ZFIN_LL + ")."),
    shape=dict(primitive="custom", notes="Group node. Render as arrays of neuromast discs placed on the skin along named line splines; optionally thin nerve tubes back to the ganglia."),
    sizes=[S("Prim-5", 24.0, dict(neuromastCount=1), EST + "; first neuromast deposited about 24 hpf (ZFA neuromast start prim-5)"),
           S("Long-pec", 48.0, dict(neuromastCount=10), EST + "; primary primordium reaches the tail by about 40 to 50 hpf " + ZFIN_LL),
           S("Day 4", 96.0, dict(neuromastCount=26, lines=8), "3 + 4 + 2 + 1 + 2 + 2 + 1 + about 11 neuromasts, " + ZFIN_LL),
           S("Day 5", 120.0, dict(neuromastCount=28, lines=8), EST + "; eight lines with about 26 neuromasts at 4 dpf (" + ZFIN_LL + ") plus a few intercalary neuromasts from primII"),
           S("Adult", 2160.0, dict(neuromastCount=1000), "adult posterior line neuromast number more than 10x the larval number through accessory neuromasts (" + WADA13 + "); total count estimate")],
    events=[E(14.0, "Lateral line system term starts (ZFIN, 10-13 somites); placodes form."),
            E(18.0, "Posterior primordium first visible with DIC at the 18-somite stage (" + ZFIN_LL + ")."),
            E(20.0, "Primordium starts migrating caudally (" + PLLP20 + ")."),
            E(40.0, "Primordium reaches the tail (about 40 hpf " + PLLP20 + "; long-pec 50 hpf " + ZFIN_LL + ")."),
            E(96.0, "Eight distinct lines with about 26 neuromasts (" + ZFIN_LL + ")."),
            E(2160.0, "Adult stitches and canal neuromasts; count grows more than tenfold (" + WADA13 + ").")],
    colorHint="#ff9f43",
    sources=[ZF("ZFA:0000034"), ZFIN_LL, PLLP20, WADA13])

add(id="ZFA:0001157", system="sensory", parent="ZFA:0000034", zfaPartOf="ZFA:0001471",
    spatial=dict(apFraction=[0.30, 1.0], dv="on the horizontal myoseptum, under the epidermis", laterality="paired",
                 landmarks="Starts just posterior to the otic vesicle at 20 hpf. Leading edge over myotome 3 at 22 hpf, myotome 5 at 24 hpf, myotome 15 at 30 hpf, myotome 25 at 36 hpf. Tail tip by 40 to 50 hpf (Kimmel prim stages)."),
    shape=dict(primitive="ellipsoid", notes="Flat teardrop (about 100 x 40 x 20 um). Slide it along the horizontal myoseptum spline from apFraction 0.30 (20 hpf) to 1.0 (about 42 hpf) at 100 um/h. Drop a neuromast disc every 5 to 7 somites."),
    sizes=[S("20-25 somites", 20.0, dict(length=100, width=40, height=20, cells=100), "about 100 cells (" + NM13 + "); 100 to 150 cells (" + PLLP20 + "); dimensions estimate"),
           S("Prim-5", 24.0, dict(length=110, width=40, height=20), EST + "; leading edge over myotome 5 " + K95_PHAR),
           S("Prim-25", 36.0, dict(length=100, width=40, height=20), EST + "; leading edge over myotome 25 " + K95_PHAR),
           S("Long-pec", 48.0, dict(length=80, width=35, height=20), EST + "; primary primordium has reached the tail (" + PLLP20 + ", " + ZFIN_LL + "); secondary primordium (primII) starts at 48 hpf (ZFA:0005116)")],
    events=[E(18.0, "Primordium first visible (" + ZFIN_LL + "); ZFIN start 20-25 somites (19 hpf)."),
            E(20.0, "Migration begins; speed about 100 um/h or 1.7 myotomes/h (" + K95_PHARP + ")."),
            E(24.0, "Leading edge over myotome 5; first neuromast deposited (" + K95_PHAR + ")."),
            E(42.0, "Primary primordium reaches the tail tip and forms the terminal neuromasts (" + PLLP20 + "; ZFIN 50 hpf " + ZFIN_LL + ")."),
            E(48.0, "Secondary primordium (primII) starts migrating (ZFA, long-pec)."),
            E(120.0, "Primordium term ends (ZFIN, day 4).")],
    colorHint="#ffb366",
    sources=[ZF("ZFA:0001157"), ZF("ZFA:0005115"), K95_PHAR, K95_PHARP, ZFIN_LL, PLLP20, NM13])

add(id="ZFA:0000944", system="sensory", parent="ZFA:0000034", zfaPartOf="ZFA:0001471",
    spatial=dict(apFraction=[0.30, 1.0], dv="skin over the horizontal myoseptum (midbody line); dorsal and ventral rami in the larva", laterality="paired",
                 landmarks="Runs from behind the otic vesicle along the horizontal myoseptum to the caudal fin base (ZFA definition)."),
    shape=dict(primitive="custom", notes="Spline along the horizontal myoseptum. It carries 5 to 6 neuromast discs at 2 dpf (L1 to L5 plus the terminal cluster) and about 11 by 4 dpf. In the adult each site becomes a stitch of several neuromasts."),
    sizes=[S("Long-pec", 48.0, dict(neuromastCount=7, spacing_um=350), EST + "; seven to nine neuromasts and interneuromasts after the first migration (ZFA primordium definition)"),
           S("Day 4", 96.0, dict(neuromastCount=11), "about 11 neuromasts in dorsal and ventral rami (" + ZFIN_LL + ")"),
           S("Day 5", 120.0, dict(neuromastCount=12, spacing_um=300), EST + "; about 11 at 4 dpf (" + ZFIN_LL + ")"),
           S("Adult", 2160.0, dict(neuromastCount=300), "more than 10x the larval count (" + WADA13 + "); absolute number estimate")],
    events=[E(42.0, "Posterior lateral line term starts (ZFIN, high-pec)."),
            E(48.0, "Line complete from ear to tail; primII adds intercalary neuromasts (ZFA)."),
            E(96.0, "About 11 neuromasts (" + ZFIN_LL + ")."),
            E(720.0, "Post-embryonic addition and migration of neuromasts; stitches form (" + PAR09 + ", " + WADA13 + ").")],
    colorHint="#ff9f43",
    sources=[ZF("ZFA:0000944"), ZFIN_LL, WADA13, PAR09])

add(id="ZFA:0000243", system="sensory", parent="ZFA:0000034", zfaPartOf="ZFA:0000034",
    spatial=dict(apFraction=[0.02, 1.0], dv="in the epidermis, apical surface exposed through a hole in the periderm", laterality="paired lines",
                 landmarks="Positions follow the eight named lines; trunk neuromasts sit on the horizontal myoseptum."),
    shape=dict(primitive="sphere", notes="Flattened dome (rosette) on the skin: 50 um diameter, 20 um tall when mature; add a small cupula cone if desired. Instance it along line splines."),
    sizes=[S("Prim-5", 24.0, dict(diameter=20, height=12), EST + "; first proneuromast just deposited"),
           S("Long-pec", 48.0, dict(diameter=30, height=15), EST),
           S("Day 5", 120.0, dict(diameter=50, height=20, cells=60, hairCells=20), "mature neuromast 50 um diameter, 20 um height, about 60 cells, one third hair cells (" + NM13 + ")"),
           S("Adult", 2160.0, dict(diameter=60, height=25), EST + "; adult neuromasts cluster into stitches (" + WADA13 + ")")],
    events=[E(22.0, "Protoneuromast forms in the trailing primordium (ZFA, 26+ somites)."),
            E(24.0, "Neuromast term starts (ZFIN, prim-5)."),
            E(48.0, "Hair cells with kinocilia and cupulae; mechanosensitive."),
            E(120.0, "Mature size reached (" + NM13 + ").")],
    colorHint="#ffc078",
    sources=[ZF("ZFA:0000243"), NM13, WADA13])

# ===== eye =====
add(id="ZFA:0000050", system="sensory", parent="ZFA:0000107", zfaPartOf="ZFA:0001678",
    spatial=dict(apFraction=[0.05, 0.14], dv="lateral wall of the diencephalon, dorsolateral", laterality="paired",
                 landmarks="Wing-shaped evagination from the forebrain keel; lateral to the diencephalon, dorsal to the future pharynx."),
    shape=dict(primitive="ellipsoid", notes="Flat wing: an ellipsoid with axes about 150 (AP) x 60 (mediolateral) x 100 (DV) um. A broad stalk attaches it to the forebrain. Rotate it from horizontal to vertical between 12 and 16 hpf."),
    sizes=[S("5-9 somites", 12.0, dict(length=120, width=50, height=80, volume_um3=840000), "volume 0.84e6 um3 at 12 hpf (" + KWAN12 + "); linear dims estimate"),
           S("14-19 somites", 16.0, dict(length=150, width=60, height=110, volume_um3=1170000), "lateral plus medial layer 0.65e6 + 0.52e6 um3 at 16 hpf (" + KWAN12 + "); linear dims estimate"),
           S("20-25 somites", 19.0, dict(length=160, width=90, height=140), EST + "; invagination under way (" + KWAN12 + ")")],
    events=[E(10.0, "Optic primordium (eye field) in the anterior neural keel (ZFA, bud)."),
            E(11.7, "Optic vesicle term starts (ZFIN, 5-9 somites); evagination at the 6-7 somite stage (" + SD94 + ")."),
            E(13.0, "Wing shape at 8-9 somites; bends ventrally at 10-12 somites (" + SD94 + ")."),
            E(16.0, "Evagination ends; invagination starts (" + KWAN12 + "); invagination from the 14-somite stage (" + SD94 + ")."),
            E(22.0, "Vesicle term ends (ZFIN, 20-25 somites); optic cup formed.")],
    colorHint="#7fc8f0",
    sources=[ZF("ZFA:0000050"), SD94, KWAN12, LI00])

add(id="ZFA:0001202", system="sensory", parent="ZFA:0000107", zfaPartOf="ZFA:0001678",
    spatial=dict(apFraction=[0.05, 0.14], dv="lateral to the diencephalon, dorsal to the pharynx", laterality="paired",
                 landmarks="Cup opens laterally around the lens. The choroid fissure forms on the anterior edge. It rotates to ventral by 36 hpf (" + SD94 + ")."),
    shape=dict(primitive="lathe", notes="Hemispherical double-walled cup (lathe profile: outer wall = future RPE, inner thick wall = future neural retina) with a ventral slit (choroid fissure). Outer diameter about 170 um at 24 hpf."),
    sizes=[S("20-25 somites", 19.0, dict(diameter=150, depth=90), EST),
           S("Prim-5", 24.0, dict(diameter=170, depth=110, volume_um3=1230000), "optic cup volume 1.23e6 um3 at 24 hpf; lens is about 10% of cup volume (" + KWAN12 + "); diameter estimate")],
    events=[E(16.0, "Invagination commences from the center of the primordium (" + SD94 + ")."),
            E(19.0, "Optic cup term starts (ZFIN, 20-25 somites); choroid fissure forms at 18-20 somites (" + SD94 + ")."),
            E(24.0, "Eyecups well formed (" + SD94 + "); presumptive neural retina and RPE layers (ZFA, 22 to 30 hpf)."),
            E(30.0, "Cup term ends (ZFIN, prim-5); retina and RPE terms start (ZFIN, prim-15).")],
    colorHint="#6fbde8",
    sources=[ZF("ZFA:0001202"), SD94, KWAN12, LI00])

add(id="ZFA:0000107", system="sensory", parent="ZFA:0001127", zfaPartOf="ZFA:0001114",
    spatial=dict(apFraction=[0.05, 0.14], dv="lateral head, centered on the diencephalon level; ventral half below the brain floor in the larva", laterality="paired",
                 apFractionByStage={"24": [0.05, 0.15], "120": [0.05, 0.13], "adult": [0.07, 0.13]},
                 landmarks="Largest head organ in the embryo and larva. The gap to the otic vesicle is about 300 um at 24 hpf and about 60 um at 48 hpf (Kimmel OVL index, estimate)."),
    shape=dict(primitive="sphere", notes="Sphere (slightly flattened mediolaterally) with a spherical lens protruding laterally through the pupil. Diameter 170 um at 24 hpf, about 300 um at 5 dpf, about 2.5 mm in the adult."),
    sizes=[S("Prim-5", 24.0, dict(diameter=170), EST + "; optic cup volume 1.23e6 um3 (" + KWAN12 + ")"),
           S("Long-pec", 48.0, dict(diameter=230), EST + "; area and volume of the eye increase sevenfold from 16 to 72 hpf (" + LI00 + ")"),
           S("Protruding-mouth", 72.0, dict(diameter=270), EST + "; image plane reaches the photoreceptors at 72 hpf (" + EN96 + ")"),
           S("Day 5", 120.0, dict(diameter=300), "lens nodal point to photoreceptor outer segments 139.2 um and lens radius 50.7 um at 5 dpf (" + HAUG10 + "); outer diameter computed as about 2 x (139 + 15) um"),
           S("Adult", 2160.0, dict(diameter=2500), EST + "; adult lens about 1 mm (" + LENSAD + ")")],
    events=[E(24.0, "Eye term starts (ZFIN, prim-5); retinal pigmentation begins (Kimmel prim-5, unverified quote)."),
            E(36.0, "Choroid fissure rotated to ventral (" + SD94 + ")."),
            E(48.0, "Lens fiber differentiation 36 to 48 hpf; posterior suture visible (" + GREIL09 + ", " + DAHM07 + ")."),
            E(72.0, "Focused retinal image; tracking eye movements 73 to 80 hpf; startle to light 68 to 79 hpf (" + EN96 + ")."),
            E(2160.0, "Adult eye about 2.5 mm with a 1 mm lens (" + LENSAD + "; diameter estimate).")],
    colorHint="#4aa8e8",
    sources=[ZF("ZFA:0000107"), KWAN12, LI00, EN96, HAUG10, LENSAD])

add(id="ZFA:0000152", system="sensory", parent="ZFA:0000107", zfaPartOf="ZFA:0005567",
    spatial=dict(apFraction=[0.05, 0.14], dv="inner lining of the eye cup, medial to the lens", laterality="paired",
                 landmarks="Hemispherical shell facing the lens; optic nerve exits at its ventronasal side through the former choroid fissure."),
    shape=dict(primitive="lathe", notes="Thick hemispherical shell (lathe). Outer radius = eye radius minus RPE thickness. Wall thickness (estimates): 60 um at 24 hpf, 90 um at 48 hpf, about 100 um at 5 dpf, 200 to 250 um in the adult."),
    sizes=[S("Prim-5", 24.0, dict(outerDiameter=160, thickness=60), EST + "; neuroepithelium not yet laminated"),
           S("Long-pec", 48.0, dict(outerDiameter=220, thickness=90), EST + "; ganglion cell layer forming"),
           S("Day 5", 120.0, dict(outerDiameter=290, thickness=100), EST + "; retinal radius about 140 to 150 um from " + HAUG10),
           S("Adult", 2160.0, dict(outerDiameter=2400, thickness=220), EST)],
    events=[E(22.0, "Presumptive neural retina (inner cup layer) (ZFA, 26+ somites)."),
            E(30.0, "Retina term starts (ZFIN, prim-15)."),
            E(48.0, "First ganglion cells differentiate ventronasally about 28 to 32 hpf; lamination 48 to 72 hpf (unverified hours)."),
            E(72.0, "Most cell classes present in central retina by 72 to 96 hpf; outer segments appear (" + EN96 + ")."),
            E(2160.0, "Continuous growth from the ciliary marginal zone throughout life (Marcus et al. 1999 Vis Neurosci 16:417).")],
    colorHint="#3b7fc4",
    sources=[ZF("ZFA:0000152"), EN96, HAUG10])

add(id="ZFA:0000144", system="sensory", parent="ZFA:0000152", zfaPartOf="ZFA:0000152",
    spatial=dict(apFraction=[0.05, 0.14], dv="outermost layer of the eye cup, between neural retina and sclera", laterality="paired",
                 landmarks="Covers the whole back of the eye; it is the black shell that makes the eye visible from outside from 24 hpf onward."),
    shape=dict(primitive="lathe", notes="Thin dark hemispherical shell (5 to 10 um) directly outside the retina. Drive its opacity from 0 at 22 hpf to 1 by about 36 hpf to show pigmentation."),
    sizes=[S("Prim-5", 24.0, dict(outerDiameter=170, thickness=8), EST),
           S("Long-pec", 48.0, dict(outerDiameter=230, thickness=8), EST),
           S("Day 5", 120.0, dict(outerDiameter=300, thickness=10), EST),
           S("Adult", 2160.0, dict(outerDiameter=2500, thickness=15), EST)],
    events=[E(22.0, "Presumptive RPE (outer cup layer) (ZFA, 26+ somites); PE shrinks as cells move into the neural retina 14 to 24 hpf (" + LI00 + ")."),
            E(24.0, "Melanin first appears in the RPE at the prim-5 stage (Kimmel; exact quote unverified)."),
            E(30.0, "RPE term starts (ZFIN, prim-15); eye clearly dark by prim-15 (unverified)."),
            E(36.0, "RPE fully pigmented (estimate).")],
    colorHint="#1a1a2e",
    sources=[ZF("ZFA:0000144"), LI00, K95_PHAR])

add(id="ZFA:0000035", system="sensory", parent="ZFA:0000107", zfaPartOf="ZFA:0005566",
    spatial=dict(apFraction=[0.06, 0.13], dv="center of the pupil, lateral pole of the eye", laterality="paired",
                 landmarks="Spherical lens filling most of the pupil; it protrudes laterally beyond the eye contour in the larva."),
    shape=dict(primitive="sphere", notes="Sphere. Diameter about 63 um at 24 hpf, about 100 um at 5 dpf, 160 um at 15 dpf, 0.75 to 1 mm in adults."),
    sizes=[S("Prim-5", 24.0, dict(diameter=63, volume_um3=130000), "lens volume 0.13e6 um3 at 24 hpf (" + KWAN12 + "); diameter computed for a sphere"),
           S("Long-pec", 48.0, dict(diameter=80), EST + "; fiber differentiation 36 to 48 hpf (" + GREIL09 + ")"),
           S("Day 5", 120.0, dict(diameter=101), "lens radius 50.7 um at 5 dpf (" + HAUG10 + ")"),
           S("Day 15", 360.0, dict(diameter=160), "160 um at 15 dpf (" + LENSOPT + ")"),
           S("Adult", 2160.0, dict(diameter=900), "about 1 mm (" + LENSAD + "); 540 to 790 um in 1.3 to 1.8 year old fish (" + LENSOPT + ")")],
    events=[E(11.7, "Lens placode (ZFA, 5-9 somites); first visible as a thickening at about 15 hpf (" + KWAN12 + ")."),
            E(19.0, "Solid lens vesicle (ZFA, 20-25 somites); round by 20 hpf (" + KWAN12 + ")."),
            E(24.0, "Lens pinches off from the ectoderm as a solid cell mass (" + KWAN12 + ", " + DAHM07 + ")."),
            E(30.0, "Lens term starts (ZFIN, prim-15)."),
            E(48.0, "Posterior suture visible (" + GREIL09 + ")."),
            E(72.0, "Lens optically functional; image focused on photoreceptors (" + EN96 + ").")],
    colorHint="#cfeeff",
    sources=[ZF("ZFA:0000035"), KWAN12, GREIL09, DAHM07, HAUG10, LENSOPT, LENSAD, EN96])

# ===== ear =====
add(id="ZFA:0000138", system="sensory", parent="ZFA:0000217", zfaPartOf="ZFA:0001138",
    visibleFromHpf=14.0, visibleNote="ZFIN start is bud (10 hpf) for the specified field. The placode is first visible as an ectodermal thickening at 9 to 14 somites (about 14 to 16 hpf) (" + ZFIN_EAR + ", " + HL96 + ").",
    spatial=dict(apFraction=[0.25, 0.29], dv="surface ectoderm lateral to the hindbrain (r5), dorsolateral head", laterality="paired",
                 landmarks="Oval ectodermal thickening beside rhombomere 5, posterior to the eye by about five otic vesicle lengths at 24 hpf (Kimmel OVL)."),
    shape=dict(primitive="ellipsoid", notes="Flat oval plaque (about 60 x 40 x 15 um) on the lateral head surface. Thicken and hollow it into the otic vesicle at 18 hpf."),
    sizes=[S("10-13 somites", 14.0, dict(length=50, width=35, thickness=15), EST),
           S("14-19 somites", 16.0, dict(length=60, width=40, thickness=20), EST + "; placode visible at about 16 hpf (" + HL96 + ")")],
    events=[E(10.0, "Otic placode term starts (ZFIN, bud)."),
            E(14.0, "Placode visible at 9 to 14 somites (" + ZFIN_EAR + ")."),
            E(16.0, "Placode visible at about 16 hpf (" + HL96 + ")."),
            E(18.0, "Cavitation into the otic vesicle at the 18-somite stage (" + ZFIN_EAR + ", " + HL96 + ")."),
            E(24.0, "Placode term ends (ZFIN, 26+ somites).")],
    colorHint="#7fd8c8",
    sources=[ZF("ZFA:0000138"), ZFIN_EAR, HL96])

add(id="ZFA:0000051", system="sensory", parent="ZFA:0000217", zfaPartOf=None,
    modelEndHpf=72.0, modelEndNote="ZFIN end stage is Unknown. Hand over to the inner ear term when the semicircular canal pillars have fused (72 hpf).",
    spatial=dict(apFraction=[0.25, 0.30], dv="lateral to the hindbrain at rhombomere 5, dorsal to the pharynx, under the skin", laterality="paired",
                 apFractionByStage={"24": [0.26, 0.30], "48": [0.22, 0.27], "120": [0.16, 0.21]},
                 landmarks="Clear fluid-filled oval behind the eye with two dark otoliths (anterior and posterior). The eye-to-ear gap shrinks from 5 to 0.5 vesicle lengths between 24 and 48 hpf (Kimmel OVL)."),
    shape=dict(primitive="ellipsoid", notes="Hollow ellipsoid with a thin wall (about 10 um), long axis anteroposterior. From 45 hpf grow three internal pillars (finger-like projections) that fuse by 72 hpf."),
    sizes=[S("14-19 somites", 18.0, dict(length=50, width=35, height=40), EST + "; lumen appears at 18 hpf (" + HL96 + ")"),
           S("Prim-5", 24.0, dict(length=70, width=45, height=55), EST + "; Kimmel OVL 5 at 24 hpf (" + K95_PHAR + ")"),
           S("Long-pec", 48.0, dict(length=130, width=90, height=110), EST + "; Kimmel OVL 1/2 at 48 hpf (" + K95_HATCH + ")"),
           S("Protruding-mouth", 72.0, dict(length=180, width=120, height=150), EST + "; ear grows by fluid filling during days 1 to 3 (" + ZFIN_EAR + ")")],
    events=[E(16.0, "Otic vesicle term starts (ZFIN, 14-19 somites)."),
            E(18.0, "Lumen forms by cavitation (" + HL96 + ")."),
            E(19.5, "Two otoliths appear (" + HL96 + ")."),
            E(24.0, "First hair cells in two maculae under the otoliths (" + HL96 + ")."),
            E(36.0, "Endolymphatic sac evaginates from the dorsal wall (" + SWIN18 + ")."),
            E(42.0, "10 to 20 hair cells per macula (" + HL96 + "); anterior, lateral and posterior protrusions start 42 to 48 hpf (ZFA, " + GENG13 + ")."),
            E(72.0, "All three canal pillars fused (" + GENG13 + ").")],
    colorHint="#5fcfbf",
    sources=[ZF("ZFA:0000051"), HL96, ZFIN_EAR, K95_PHAR, K95_HATCH, GENG13, SWIN18])

add(id="ZFA:0000217", system="sensory", parent="ZFA:0001138", zfaPartOf="ZFA:0001138",
    visibleFromHpf=72.0, visibleNote="ZFIN start is 20-25 somites (19 hpf), overlapping the otic vesicle. For the model, show the otic vesicle until 72 hpf and the inner ear after that.",
    spatial=dict(apFraction=[0.16, 0.22], dv="lateral to the hindbrain, inside the otic capsule; utricle dorsal-anterior, saccule ventral-posterior", laterality="paired",
                 apFractionByStage={"120": [0.16, 0.21], "adult": [0.15, 0.21]},
                 landmarks="Behind the eye and lateral to the medulla; in the adult it is enclosed by the prootic, pterotic, sphenotic and exoccipital bones."),
    shape=dict(primitive="custom", notes="Compound: an ellipsoidal vestibule (utricle + saccule) with three semicircular canal tori (anterior, posterior, lateral) on the pars superior. The lagena is a small ventral-posterior pouch from 15 dpf."),
    sizes=[S("Prim-5", 24.0, dict(length=70, width=45, height=55), EST + "; same body as the otic vesicle at this stage (ZFIN inner ear starts at 19 hpf and overlaps the otic vesicle term)"),
           S("Long-pec", 48.0, dict(length=130, width=90, height=110), EST + "; same body as the otic vesicle at this stage"),
           S("Day 5", 120.0, dict(length=250, width=170, height=220), EST + "; canals complete by 3 dpf, pars inferior grows 5 to 20 dpf (" + BF02 + ")"),
           S("Day 30", 720.0, dict(length=500, width=350, height=450), EST + "; adult ear is nearly five times the larval size (" + BF02 + ")"),
           S("Adult", 2160.0, dict(length=2300, width=1500, height=2000), "about 2.3 mm long in a 2-year-old fish (" + BF02 + "); width and height estimate")],
    events=[E(19.0, "Inner ear term starts (ZFIN, 20-25 somites)."),
            E(72.0, "Three semicircular canals formed by 3 dpf (" + BF02 + ")."),
            E(168.0, "About 80 hair cells per macula between 3 and 7 dpf (" + HL96 + ")."),
            E(360.0, "Lagenar macula with differentiated hair cells by 15 dpf (" + BF02 + ")."),
            E(2160.0, "Adult ear about 2.3 mm long with three otoliths (" + BF02 + ", " + ZFIN_OTO + ").")],
    colorHint="#3fbfae",
    sources=[ZF("ZFA:0000217"), BF02, HL96, ZFIN_OTO])

add(id="ZFA:0001617", system="sensory", parent="ZFA:0000217", zfaPartOf="ZFA:0000051",
    spatial=dict(apFraction=[0.26, 0.30], dv="inside the otic vesicle lumen; anterior (utricular) otolith dorsal-anterior, posterior (saccular) otolith ventral-posterior", laterality="paired, two per ear in the embryo, three per ear in the adult",
                 landmarks="Two dark spheres at the anterior and posterior poles of the otic vesicle. The anterior one becomes the lapillus and the posterior one the sagitta (" + ZFIN_OTO + ")."),
    shape=dict(primitive="sphere", notes="Two spheres per ear tethered to the maculae. Adult: three flattened discs (sagitta about 1 mm, lapillus about 0.6 mm, asteriscus about 0.5 mm; estimates)."),
    sizes=[S("20-25 somites", 19.5, dict(diameter=5), EST + "; visible only with Nomarski optics at 19 hpf (" + K95_SEG + ")"),
           S("Prim-5", 24.0, dict(diameter=12), EST + "; easily seen at 22 hpf (" + K95_SEG + "); free particles gone after 24 hpf (" + ZFIN_OTO + ")"),
           S("Long-pec", 48.0, dict(diameter=25), EST),
           S("Day 5", 120.0, dict(anteriorDiameter=40, posteriorDiameter=55), EST),
           S("Adult", 2160.0, dict(sagittaLength=1000, lapillusLength=600, asteriscusLength=500), EST)],
    events=[E(18.0, "Otolith term starts at 18 hpf (" + ZFIN_OTO + "); ZFIN start 20-25 somites."),
            E(18.5, "Particles coalesce into two otoliths (" + ZFIN_OTO + "); two otoliths by 19.5 hpf (" + HL96 + ")."),
            E(22.0, "Two otoliths easily seen in each vesicle (" + K95_SEG + ")."),
            E(24.0, "Growth by accretion; distinct shapes during the larval period (" + ZFIN_OTO + ")."),
            E(360.0, "Third otolith (asteriscus) forms over the lagena about 15 dpf (" + BF02 + ", timing of otolith unverified).")],
    colorHint="#f5f5f5",
    sources=[ZF("ZFA:0001617"), ZFIN_OTO, HL96, K95_SEG, BF02])

add(id="ZFA:0000431", system="sensory", parent="ZFA:0000217", zfaPartOf="ZFA:0005409",
    spatial=dict(apFraction=[0.16, 0.22], dv="dorsal half of the inner ear (pars superior)", laterality="paired, three per ear",
                 landmarks="Anterior and posterior canals are vertical and meet dorsally in the common crus; the lateral canal is horizontal at the level of the utricle."),
    shape=dict(primitive="custom", notes="Three tori (tube radius about 15 um in the larva, about 100 um in the adult) arranged orthogonally on the dorsal vestibule. Between 45 and 72 hpf, animate three finger-like projections that grow into the vesicle and fuse into pillars. The canals are the spaces left around the pillars."),
    sizes=[S("High-pec", 45.0, dict(projectionLength=30), EST + "; projections begin at 45 hpf (" + ZFIN_SCC + ")"),
           S("Long-pec", 48.0, dict(projectionLength=45, tubeDiameter=20), EST + "; anterior and posterior projections growing at 48 hpf (" + GENG13 + ")"),
           S("Protruding-mouth", 72.0, dict(loopDiameter=90, tubeDiameter=25), EST + "; pillars fused at 72 hpf (" + GENG13 + ")"),
           S("Day 5", 120.0, dict(loopDiameter=120, tubeDiameter=30), EST),
           S("Adult", 2160.0, dict(loopDiameter=1200, tubeDiameter=200), EST + "; adult ear 2.3 mm long (" + BF02 + ")")],
    events=[E(42.0, "Semicircular canal term starts (ZFIN, high-pec)."),
            E(45.0, "Epithelial projections push into the vesicle (" + ZFIN_SCC + ", " + WB84 + ")."),
            E(50.0, "Lateral projection with anterior and posterior bulges present (" + GENG13 + ")."),
            E(57.0, "Anterior and posterior projections fuse with their bulges 57 to 68 hpf (" + GENG13 + "); fusion between long-pec and pec-fin (" + ZFIN_SCC + ")."),
            E(72.0, "All three pillars fused; canals continue to elongate (" + GENG13 + ").")],
    colorHint="#2fa89a",
    sources=[ZF("ZFA:0000431"), ZFIN_SCC, WB84, GENG13, HL96, BF02])

# ===== olfactory =====
add(id="ZFA:0000048", system="sensory", parent="ZFA:0000047", zfaPartOf="ZFA:0001149",
    visibleFromHpf=22.0, visibleNote="ZFIN start is 10-13 somites (14 hpf) for the placodal field. Kimmel first notes the placodes as external thickenings at the 26-somite stage (22 hpf).",
    spatial=dict(apFraction=[0.01, 0.04], dv="anterior and dorsal to the forebrain, anterolateral head surface, medial to the eyes", laterality="paired",
                 landmarks="Two ectodermal thickenings at the anterior edge of the neural plate, later at the anterior borders of the eyes (Kimmel long-pec)."),
    shape=dict(primitive="ellipsoid", notes="Flat oval plaque (about 50 x 35 x 20 um) on the snout surface; hollow it into a pit at 30 hpf."),
    sizes=[S("14-19 somites", 16.0, dict(length=40, width=30, thickness=15), EST),
           S("Prim-5", 24.0, dict(length=50, width=35, thickness=25), EST + "; placodes thickened at 22 hpf (" + K95_SEG + ")")],
    events=[E(10.0, "Olfactory field at the anterolateral neural plate edge converges anteriorly (" + WW00 + ")."),
            E(14.0, "Olfactory placode term starts (ZFIN, 10-13 somites)."),
            E(22.0, "Placodes thicken anterior and dorsal to the forebrain (" + K95_SEG + ")."),
            E(24.0, "Axons grow into the forebrain while epidermis still covers the placode (" + HZ93 + ")."),
            E(30.0, "Placode term ends (ZFIN, prim-5); pit opens.")],
    colorHint="#c5e86c",
    sources=[ZF("ZFA:0000048"), K95_SEG, WW00, HZ93])

add(id="ZFA:0000047", system="sensory", parent="ZFA:0001149", zfaPartOf="ZFA:0001149",
    spatial=dict(apFraction=[0.01, 0.04], dv="dorsal snout surface, anteromedial to the eyes", laterality="paired",
                 apFractionByStage={"48": [0.02, 0.05], "120": [0.01, 0.04], "adult": [0.03, 0.06]},
                 landmarks="Paired nasal sacs on the dorsal snout; in the adult each has an incurrent and an excurrent nostril separated by a skin flap."),
    shape=dict(primitive="lathe", notes="Shallow bowl (lathe) sunk into the snout surface; adult: sac about 1 mm with a rosette of radial lamellae and two nostrils."),
    sizes=[S("Prim-15", 30.0, dict(diameter=45, depth=20), EST),
           S("Long-pec", 48.0, dict(diameter=60, depth=35), EST),
           S("Day 5", 120.0, dict(diameter=80, depth=50), EST),
           S("Adult", 2160.0, dict(length=1000, width=700, depth=400), EST)],
    events=[E(30.0, "Peripheral olfactory organ and olfactory pit terms start (ZFIN, prim-15)."),
            E(31.0, "Epidermis separates to form the pit; dendrites grow out (" + HZ93 + "; exact hour unverified)."),
            E(72.0, "Olfactory rosette term starts (ZFA, protruding-mouth); lamellae form slowly during larval life (" + HZ93 + ")."),
            E(2160.0, "Adult rosette with midline raphe and lamellae; incurrent and excurrent nostrils (" + HZ93 + ").")],
    colorHint="#a8d84a",
    sources=[ZF("ZFA:0000047"), HZ93])

add(id="ZFA:0000130", system="sensory", parent="ZFA:0000047", zfaPartOf="ZFA:0000047",
    spatial=dict(apFraction=[0.01, 0.04], dv="opening on the dorsal snout, anteromedial to each eye", laterality="paired",
                 landmarks="Round depression on the snout in the larva; becomes the nasal cavity with two nostrils in the adult."),
    shape=dict(primitive="custom", notes="Negative space: a bowl-shaped depression cut into the peripheral olfactory organ. About 30 um across at 36 hpf and about 60 um at 5 dpf. A ring of kinocilia surrounds the rim from 2 dpf."),
    sizes=[S("Prim-25", 36.0, dict(diameter=30, depth=15), EST + "; pits form at about 31 to 36 hpf (" + HZ93 + ")"),
           S("Long-pec", 48.0, dict(diameter=45, depth=25), EST),
           S("Day 5", 120.0, dict(diameter=60, depth=40), EST),
           S("Adult", 2160.0, dict(length=900, width=600, depth=350), EST)],
    events=[E(30.0, "Olfactory pit term starts (ZFIN, prim-15)."),
            E(31.0, "Pit opens as the epidermis separates (" + HZ93 + "; hour unverified)."),
            E(48.0, "Olfactory rod cells present in pits from 36 hpf, consistently beyond 46 hpf (unverified secondary)."),
            E(2160.0, "Nasal cavity with incurrent and excurrent nostrils (" + HZ93 + ").")],
    colorHint="#e9f5c9",
    sources=[ZF("ZFA:0000130"), HZ93])

# ---------- assemble ----------
out = []
for s in STRUCTS:
    it = items[s["id"]]
    st, en = stages[it["start"]], stages[it["end"]]
    rec = dict(id=s["id"], name=it["name"], synonyms=sorted(set(syn.get(s["id"], []))), system=s["system"],
               parent=s["parent"], zfaPartOf=s.get("zfaPartOf"),
               startStage=st["zfs"], startStageName=st["name"], startHpf=st["start"],
               endStage=en["zfs"], endStageName=en["name"], endHpf=en["end"])
    if "visibleFromHpf" in s:
        rec["visibleFromHpf"] = s["visibleFromHpf"]; rec["visibleFromNote"] = s["visibleNote"]
    if "modelEndHpf" in s:
        rec["modelEndHpf"] = s["modelEndHpf"]; rec["modelEndNote"] = s["modelEndNote"]
    d = defs.get(s["id"])
    if d:
        d = re.sub(r"<[^>]+>", "", d)
        d = re.sub(r"\s*\(See Anatomical Atlas entry.*?\)", "", d)
        d = re.sub(r"\s*\(Also see Anatomical Atlas entry.*?\)", "", d)
        sents = re.split(r"(?<=[.!?])\s+", d.strip())
        d = " ".join(sents[:2])
    else:
        d = {"ZFA:0000075": "Posterior part of the central nervous system, a tube of nervous tissue dorsal to the notochord that runs from the hindbrain to the tail tip. (ZFA gives no definition; written by us.)",
             "ZFA:0001259": "Fluid-filled cavity of the embryonic forebrain that later divides into the telencephalic and third ventricles. (ZFA gives no definition; written by us.)",
             "ZFA:0000159": "Fluid-filled cavity of the midbrain under the optic tectum. (ZFA gives no definition; written by us.)",
             "ZFA:0000130": "Depression on the snout that opens from the olfactory placode and holds the olfactory epithelium. (ZFA gives no definition; written by us.)"}[s["id"]]
    rec["definition"] = d
    rec["spatial"] = s["spatial"]; rec["shape"] = s["shape"]; rec["sizes"] = s["sizes"]; rec["events"] = s["events"]
    rec["colorHint"] = s["colorHint"]; rec["sources"] = s["sources"]
    out.append(rec)

json_path = f"{OUT}/03b-anatomy-nervous-sensory.draft.json"
json.dump(out, open(json_path, "w"), indent=2, ensure_ascii=False)
print("wrote", json_path, len(out), "structures")

# ---------- validation ----------
for rec in out:
    it = items[rec["id"]]
    assert stages[it["start"]]["zfs"] == rec["startStage"] and stages[it["end"]]["zfs"] == rec["endStage"], rec["id"]
    for ref in (24, 48, 120, 2160):
        exists = rec["startHpf"] <= ref < rec["endHpf"]
        if rec.get("modelEndHpf") and ref >= rec["modelEndHpf"]:
            exists = False
        if exists:
            has = any(abs(sz["hpf"] - ref) < 1e-6 or (ref == 2160 and sz["stageLabel"] == "Adult") for sz in rec["sizes"])
            if not has:
                print("MISSING SIZE", rec["id"], rec["name"], ref)
print("validation done")

# ---------- markdown ----------
def hpf_str(v):
    return f"{v:g}"

GROUPS = [
    ("Neural primordium (neural plate to neural tube)", ["ZFA:0000132", "ZFA:0000131", "ZFA:0000133", "ZFA:0001135"]),
    ("Brain and spinal cord", ["ZFA:0000008", "ZFA:0000109", "ZFA:0000079", "ZFA:0000402", "ZFA:0000101", "ZFA:0000032", "ZFA:0000118", "ZFA:0000019", "ZFA:0000213", "ZFA:0000128", "ZFA:0000445", "ZFA:0000042", "ZFA:0000029", "ZFA:0000100", "ZFA:0000545", "ZFA:0001064", "ZFA:0000075"]),
    ("Brain ventricles", ["ZFA:0001259", "ZFA:0000159", "ZFA:0000110"]),
    ("Cranial ganglia", ["ZFA:0000295", "ZFA:0000588", "ZFA:0001314"]),
    ("Lateral line", ["ZFA:0000034", "ZFA:0001157", "ZFA:0000944", "ZFA:0000243"]),
    ("Eye", ["ZFA:0000050", "ZFA:0001202", "ZFA:0000107", "ZFA:0000152", "ZFA:0000144", "ZFA:0000035"]),
    ("Ear", ["ZFA:0000138", "ZFA:0000051", "ZFA:0000217", "ZFA:0001617", "ZFA:0000431"]),
    ("Olfactory organ", ["ZFA:0000048", "ZFA:0000047", "ZFA:0000130"]),
]
byid = {r["id"]: r for r in out}
names = {r["id"]: r["name"] for r in out}
names.update({"ZFA:0000012": "central nervous system", "ZFA:0000142": "peripheral nervous system", "ZFA:0001127": "visual system",
              "ZFA:0001138": "vestibuloauditory system", "ZFA:0001149": "olfactory system", "ZFA:0001359": "pineal complex",
              "ZFA:0000509": "epithalamus", "ZFA:0001678": "immature eye", "ZFA:0005567": "posterior segment eye",
              "ZFA:0005566": "anterior segment eye", "ZFA:0005409": "pars superior ear", "ZFA:0001471": "posterior lateral line system",
              "ZFA:0001114": "head"})

md = []
md.append("# 03b Anatomy research: nervous and sensory systems\n")
md.append("Scope: neural primordium, brain and its subdivisions, spinal cord, brain ventricles, cranial ganglia, lateral line, eye, ear, and olfactory organ. This file lists 45 structures for the schematic whole-organism model. The matching machine-readable draft is `03b-anatomy-nervous-sensory.draft.json`.\n")
md.append("## Method\n")
md.append("I extracted candidate terms from the local ZFIN files (`anatomy_item.txt`, `anatomy_relationship.txt`, `anatomy_synonyms.txt`, `zfa.obo`, `stage_ontology.txt`, ZFA release 2026-07-16). I searched names for brain, eye, ear, lateral line, olfactory, ganglion, ventricle and neural tube terms, then removed cell-level, nucleus-level and tract-level terms. This gave about 400 candidates. I kept 45 organ-level or region-level structures that a schematic model can draw. ZFIN start and end stages come from `anatomy_item.txt` joined to `stage_ontology.txt`. Definitions come from `zfa.obo`. Sizes come from the sources named in each row. Where I found no measurement, the value is an estimate and the row says so.\n")
md.append("Stage hours use the ZFIN convention (28.5 C). The ZFS stage `Unknown` (ZFS:0000000) spans 0 to 17520 hpf in `stage_ontology.txt`. Where ZFIN gives `Unknown`, the JSON keeps that value. It then adds `visibleFromHpf` or `modelEndHpf` with a note.\n")

md.append("## Reference body lengths\n")
md.append("Kimmel et al. 1995 give the embryo length (EL) per stage. Parichy et al. 2009 give standard length (SL) for post-embryonic stages. Use these to convert the `apFraction` values below to micrometers.\n")
md.append("| Stage | hpf | Length | Source |\n|---|---|---|---|")
for row in [("5-9 somites", "11.7", "EL 0.8 mm", K95_SEG), ("14-19 somites", "16", "EL 0.9 mm", K95_SEG), ("20-25 somites", "19", "EL 1.4 mm", K95_SEG),
            ("26+ somites", "22", "EL 1.6 mm", K95_SEG), ("Prim-5", "24", "EL 1.9 mm", K95_PHAR), ("Prim-15", "30", "EL 2.5 mm", K95_PHAR),
            ("Prim-25", "36", "EL 2.7 mm", K95_PHAR), ("High-pec", "42", "EL 2.9 mm", K95_PHAR), ("Long-pec", "48", "EL 3.1 mm", K95_HATCH),
            ("Pec-fin", "60", "EL 3.3 mm", K95_HATCH), ("Protruding-mouth", "72", "EL 3.5 mm", K95_LARV), ("Pec-fin (Parichy)", "72", "SL 3.4 mm", PAR09),
            ("Day 5", "120", "about 3.9 mm (estimate)", "interpolated between Kimmel 72 hpf and Parichy swim bladder inflation stage SL 3.4 to 3.7 mm"),
            ("Adult", "2160+", "SL 17.5 mm (male), 18.3 mm (female)", PAR09)]:
    md.append(f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} |")
md.append("")

md.append("## Brain dimensions from atlases\n")
md.append("| Atlas or study | Age | Numbers | Source |\n|---|---|---|---|")
md.append(f"| Z-Brain | 6 dpf, nacre | confocal voxels about 0.8 x 0.8 x 2 um; 294 regions; MAP-map analysis downsampled to 300 x 679 x 80 voxels | {ZBRAIN} |")
md.append(f"| Z-Brain reference stack extent | 6 dpf | about 500 x 1100 x 280 um including olfactory epithelia and anterior spinal cord (unverified; computed from the downsampled grid and the 0.8 um pixel) | {ZBRAIN} |")
md.append(f"| mapzebrain | 6 dpf | 72 non-overlapping regions, more than 2000 single neurons; stack dimensions not stated in the abstract | {MAPZ} |")
md.append(f"| Serial-section EM | 5.5 dpf | brain volume 5.49e7 um3 (0.055 mm3) | {HILDE17} |")
md.append(f"| Secondary summary | 5 dpf | brain about 400 x 800 x 250 um (W x L x H), about 100,000 neurons | {BRAINEMU} |")
md.append(f"| AZBA | adult, 15 to 16 weeks, AB | light-sheet 3.25 um in plane, 4 um steps, atlas at 4 um isotropic, 203 regions with volumes 0.000026 to 0.53 mm3 | {AZBA} |")
md.append(f"| Wullimann atlas (via secondary) | adult, 90 dpf+ | brain length 4.5 mm, thickness 0.4 to 2 mm | {BRAINEMU} citing {WULL96} |")
md.append("")
md.append("Per-region adult volumes exist in AZBA Supplementary file 2 (Excel). I could not read that file with the tools available. Adult region sizes below are estimates scaled to a 4.5 mm brain and should be replaced by the AZBA volumes.\n")

md.append("## Deviations from ZFIN stages\n")
md.append("The JSON keeps the ZFIN start and end stages for every term. These fields add model guidance without changing them.\n")
md.append("| Term | ZFIN start or end | Model guidance | Reason |\n|---|---|---|---|")
for r in out:
    if "visibleFromHpf" in r:
        md.append(f"| {r['name']} ({r['id']}) | start {r['startStageName']} ({hpf_str(r['startHpf'])} hpf) | visibleFromHpf {hpf_str(r['visibleFromHpf'])} | {r['visibleFromNote']} |")
    if "modelEndHpf" in r:
        md.append(f"| {r['name']} ({r['id']}) | end {r['endStageName']} ({hpf_str(r['endHpf'])} hpf) | modelEndHpf {hpf_str(r['modelEndHpf'])} | {r['modelEndNote']} |")
md.append("")
md.append("Parent choice: `parent` is the nearest listed ancestor for the UI tree. `zfaPartOf` is the direct ZFA part_of parent, or null where ZFA asserts none (neural plate, keel, rod, tube, trigeminal ganglion, otic vesicle). Four terms have no ZFA definition (spinal cord, forebrain ventricle, tectal ventricle, olfactory pit); the JSON marks the definitions I wrote.\n")

md.append("## Tables by system\n")
md.append("Columns: `AP` is the anterior-posterior extent as a fraction of body length from the snout tip. The table shows larval values. The JSON gives per-stage values where they differ. `Shape` is the procedural primitive.\n")
for title, ids in GROUPS:
    md.append(f"### {title}\n")
    md.append("| ZFA id | Name | UI parent | ZFIN start (hpf) | ZFIN end (hpf) | AP | DV / laterality | Shape | Color |\n|---|---|---|---|---|---|---|---|---|")
    for i in ids:
        r = byid[i]
        sp = r["spatial"]
        md.append(f"| {r['id']} | {r['name']} | {names.get(r['parent'], r['parent'])} | {r['startStageName']} ({hpf_str(r['startHpf'])}) | {r['endStageName']} ({hpf_str(r['endHpf'])}) | {sp['apFraction'][0]:.2f} to {sp['apFraction'][1]:.2f} | {sp['dv']}; {sp['laterality']} | {r['shape']['primitive']} | `{r['colorHint']}` |")
    md.append("")

md.append("## Per-structure notes\n")
for title, ids in GROUPS:
    md.append(f"### {title}\n")
    for i in ids:
        r = byid[i]
        md.append(f"#### {r['name']} ({r['id']})\n")
        md.append(f"Synonyms: {', '.join(r['synonyms']) if r['synonyms'] else 'none'}. UI parent: {names.get(r['parent'], r['parent'])} ({r['parent']}); ZFA part_of: {r['zfaPartOf'] or 'none'}.\n")
        md.append(f"Definition (ZFA): {r['definition']}\n")
        md.append(f"Position: {r['spatial']['landmarks']}\n")
        md.append(f"Procedural shape: {r['shape']['notes']}\n")
        md.append("Sizes:\n")
        md.append("| Stage | hpf | Dimensions (um unless stated) | Source |\n|---|---|---|---|")
        for sz in r["sizes"]:
            dims = ", ".join(f"{k} {v}" for k, v in sz["dims_um"].items())
            md.append(f"| {sz['stageLabel']} | {hpf_str(sz['hpf'])} | {dims} | {sz['source']} |")
        md.append("")
        md.append("Events:\n")
        for ev in r["events"]:
            md.append(f"- {hpf_str(ev['hpf'])} hpf: {ev['event']}")
        md.append("")
        md.append("Sources: " + "; ".join(r["sources"]) + "\n")

md.append("## Open questions\n")
md.append("- I found no published micrometer measurements for the otic vesicle at 24 and 48 hpf, the spinal cord cross-section, the embryonic brain ventricles, the pineal, the pituitary, or the adult brain regions. All such rows are estimates. A quick calibration pass on a few reference images (ZFIN stage photographs, Z-Brain, AZBA) would replace them.\n")
md.append("- ZFIN's server refused connections during part of this session, so I could not open every term page. Term ids, names, stages and definitions come from the local dump (release 2026-07-16), which is the same data.\n")
md.append("- The hypophysis and epiphysis are also endocrine organs in ZFA. The endocrine specialist may list them too; keep one record per id when merging.\n")
md.append("- The olfactory placode start (14 hpf), the otic placode start (10 hpf) and the inner ear start (19 hpf) in ZFIN mark specification, not visibility. The JSON adds `visibleFromHpf` for these three plus the medulla oblongata.\n")
md.append("- Eye and lens sizes between 24 and 72 hpf are computed from volumes (Kwan et al. 2012) and from 5 dpf optics (Haug et al. 2010). Direct diameters for 48 and 72 hpf are estimates.\n")

md_path = f"{OUT}/03b-anatomy-nervous-sensory.md"
open(md_path, "w").write("\n".join(md) + "\n")
print("wrote", md_path)
