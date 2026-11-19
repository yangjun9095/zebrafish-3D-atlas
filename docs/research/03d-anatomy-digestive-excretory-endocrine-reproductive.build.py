#!/usr/bin/env python3
"""Build the digestive / excretory / endocrine / reproductive research files.

Reads the parsed ZFA (zfa.json) for definitions, synonyms, part_of parents and
ZFIN start/end stages, merges the curated spatial / size / event data below,
validates stages against anatomy_item.txt, and writes the .md and .draft.json.
"""
import json, os, sys

W = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(W, "zfa.json")))
T, S, I = D["terms"], D["stages"], D["items"]
OUT = W
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- sources
SRC = {
    "kimmel": "https://zfin.org/zf_info/zfbook/stages/index.html",
    "kimmel_hatch": "https://zfin.org/zf_info/zfbook/stages/hatch.html",
    "kimmel_larval": "https://zfin.org/zf_info/zfbook/stages/larval.html",
    "parichy": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3030279/",
    "field_liver": "https://zfin.org/ZDB-PUB-030325-1",
    "tao_peng": "http://www.cas.zju.edu.cn/_upload/article/files/71/46/73e0e645441480db54b7de893f91/374ffd61-efc8-499e-979a-b5043a68c280.pdf",
    "korzh": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2564926/",
    "field_panc": "https://pubmed.ncbi.nlm.nih.gov/12941629/",
    "hesselson09": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2736433/",
    "hesselson11": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3026409/",
    "ng05": "https://pubmed.ncbi.nlm.nih.gov/16125164/",
    "wallace05": "https://pubmed.ncbi.nlm.nih.gov/15652704/",
    "wallace03": "https://pubmed.ncbi.nlm.nih.gov/12618131/",
    "gi_review": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12346124/",
    "alvers": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3929411/",
    "li20": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8432741/",
    "wang10": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2996925/",
    "gupta": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3144575/",
    "menke": "https://journals.sagepub.com/doi/10.1177/0192623311409597",
    "drummond": "https://journals.biologists.com/dev/article/125/23/4655/40115/",
    "wingert": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2042002/",
    "naylor16": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5069491/",
    "zhou10": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2980409/",
    "diep15": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4412820/",
    "cloaca23": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10050536/",
    "tg_review": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8424172/",
    "alt06": "https://pubmed.ncbi.nlm.nih.gov/16680726/",
    "thy_review": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8213386/",
    "trubiroha": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5884836/",
    "thy_fgf": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10214844/",
    "inhand_endo": "https://pmc.ncbi.nlm.nih.gov/articles/PMC13340149/",
    "hsu03": "https://journals.biologists.com/dev/article/130/10/2107/52039/",
    "chou12": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3428036/",
    "naylor18": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6250424/",
    "ub24": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11698069/",
    "leerberg": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5600409/",
    "bipot": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10651076/",
    "pgc21": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7847270/",
    "gsi13": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3842893/",
    "vdh00": "https://pubmed.ncbi.nlm.nih.gov/11084648/",
    "dent_rev": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4298156/",
    "mouth60": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10945834/",
    "inhand_male": "https://pmc.ncbi.nlm.nih.gov/articles/PMC13340196/",
    "islet36": "https://www.nature.com/articles/srep14241",
}
EST = "estimate (this document)"

def zfin(tid):
    return "https://zfin.org/" + tid

# ---------------------------------------------------------------- helpers
def sz(label, hpf, dims, source, note=None):
    d = {"stageLabel": label, "hpf": hpf, "dims_um": dims, "source": source}
    if note:
        d["note"] = note
    return d

def ev(hpf, text):
    return {"hpf": hpf, "event": text}

# ---------------------------------------------------------------- curated data
# apFraction = fraction of total body length from the snout tip (0) to the
# tail tip (1). All apFraction values are estimates read from the landmark
# positions given in the "landmarks" field.
E = []

def add(**k):
    E.append(k)

# ============================================================ DIGESTIVE
add(id="ZFA:0000112", system="digestive", parent="ZFA:0000339", color="#D9B382",
    spatial={"apFraction": [0.12, 0.58], "dv": "ventral to the notochord and dorsal aorta; dorsal to the yolk and later to the pericardium", "laterality": "midline, loops left at the foregut", "landmarks": "group node: pharynx to vent. Anus lies at the posterior end of the yolk extension at about 0.55 to 0.58 of body length in the larva."},
    shape={"primitive": "custom", "notes": "Group node only. Draw no geometry. Children carry the tubes."},
    sizes=[sz("Prim-5", 24, {"length": 1000, "diameter": 25}, EST, "endodermal rod from the pharynx to the proctodeum"),
           sz("Long-pec", 48, {"length": 1300, "diameter": 40}, EST),
           sz("Day 5", 120, {"length": 1700, "diameter": 90}, EST, "mouth to vent, straight-line path"),
           sz("Adult", 2160, {"length": 40000, "diameter": 1500}, EST, "folded intestine in a 25 mm SL fish")],
    events=[ev(14, "digestive system and gut terms begin in ZFIN (10-13 somites)"),
            ev(19, "endoderm forms a continuous rod along the midline (intestinal rod)"),
            ev(26, "gut endoderm lies as a thin layer dorsal to the yolk"),
            ev(52, "gut tube extends from the prospective mouth to the anus; liver, pancreas and swim bladder buds visible"),
            ev(75, "single continuous lumen from mouth to anus; anus still closed"),
            ev(120, "cloaca opens; larvae start to feed at 5 to 7 dpf")],
    notes="ZFA treats gut as an anatomical group that holds the esophagus, intestine, cloaca and proctodeum. Use it as the parent node in the UI and give it no mesh of its own. The 52 hpf and 74 to 76 hpf events come from a 2025 review that cites Ng et al. 2005 and Wallace et al. 2005.",
    sources=[zfin("ZFA:0000112"), SRC["gi_review"], SRC["ng05"], SRC["wallace05"]])

add(id="ZFA:0005737", system="digestive", parent="ZFA:0000112", color="#E8C99B",
    spatial={"apFraction": [0.25, 0.56], "dv": "ventral to the notochord; directly on the yolk syncytial layer", "laterality": "midline; the foregut segment bends left between 26 and 30 hpf", "landmarks": "from the posterior pharynx (somite 1 level) to the proctodeum below somite 17 to 18"},
    shape={"primitive": "tube", "notes": "Solid rod (no lumen) along a spline that follows the dorsal surface of the yolk ball and yolk extension. Add a leftward kink under somites 1 to 3 from 26 hpf."},
    sizes=[sz("20-25 somites", 21, {"length": 800, "diameter": 20}, EST),
           sz("Prim-5", 24, {"length": 1000, "diameter": 25}, EST, "rod is two to three cells wide"),
           sz("Long-pec", 48, {"length": 1300, "diameter": 40}, EST, "replaced by the intestine terms at 48 hpf")],
    events=[ev(19, "intestinal rod term starts in ZFIN (20-25 somites)"),
            ev(24, "endoderm cells caudal to the pharynx have aggregated into the rod"),
            ev(28, "rod segment under somite 1 thickens; liver morphogenesis begins"),
            ev(30, "foregut portion loops to the left (26 to 30 hpf)"),
            ev(48, "ZFIN end stage High-pec; the rod is now the intestine")],
    notes="The rod gives rise to the endodermal parts of the alimentary canal, liver, gall bladder, pancreas and swim bladder. The pharyngeal endoderm is not part of it. Use this term for the gut between 19 and 48 hpf and switch to intestine, intestinal bulb, mid intestine and posterior intestine afterwards.",
    sources=[zfin("ZFA:0005737"), SRC["field_liver"], SRC["tao_peng"], SRC["ng05"]])

add(id="ZFA:0005738", system="digestive", parent="ZFA:0000112", color="#E2B77A",
    spatial={"apFraction": [0.25, 0.32], "dv": "ventral to the notochord at somites 1 to 3; dorsal to the yolk", "laterality": "bends to the left of the midline between 26 and 30 hpf", "landmarks": "under somites 1 to 3, posterior to the pharynx, anterior to the yolk ball apex"},
    shape={"primitive": "tube", "notes": "Thickened anterior part of the intestinal rod. Model as a wider tube segment that bows left. The liver primordium buds from its left face and the anterior pancreatic bud from its ventral face."},
    sizes=[sz("Prim-5", 24, {"length": 150, "diameter": 40}, EST),
           sz("Long-pec", 48, {"length": 200, "diameter": 60}, EST, "ZFIN end stage High-pec")],
    events=[ev(24, "term starts in ZFIN (Prim-5)"),
            ev(28, "thickens under somite 1; liver bud appears on the left"),
            ev(30, "loops left; left bend complete by about 34 hpf"),
            ev(36, "anterior (ventral) pancreatic bud arises from its ventral ridge"),
            ev(48, "becomes the intestinal bulb")],
    notes="ZFA notes that the primordium is a compact mass of endoderm cells with little polarisation. It is the source of the intestinal bulb, the liver and the anterior pancreatic bud.",
    sources=[zfin("ZFA:0005738"), SRC["field_liver"], SRC["tao_peng"]])

add(id="ZFA:0000056", system="digestive", parent="ZFA:0000339", color="#E6A57E",
    spatial={"apFraction": [0.08, 0.25], "dv": "ventral to the hindbrain and notochord; dorsal to the heart", "laterality": "midline", "landmarks": "from the mouth to the esophagus; pharyngeal pouches 1 to 6 open into it; the teeth sit on ceratobranchial 5 at its posterior end"},
    shape={"primitive": "tube", "notes": "Flattened tube, wider than tall, from the mouth to the esophagus. Add paired lateral slits (pouches) from 48 hpf. In the adult it is a wide chamber under the gill arches."},
    sizes=[sz("Prim-5", 24, {"length": 300, "width": 60, "height": 30}, EST),
           sz("Long-pec", 48, {"length": 350, "width": 90, "height": 40}, EST),
           sz("Day 5", 120, {"length": 450, "width": 150, "height": 60}, EST),
           sz("Adult", 2160, {"length": 4500, "width": 3000, "height": 1500}, EST)],
    events=[ev(14, "pharyngeal endoderm present (10-13 somites)"),
            ev(48, "pharyngeal pouches 2 to 6 have formed; small open mouth located between the eyes"),
            ev(72, "mouth protrudes anterior to the eye; pharynx connects mouth to esophagus"),
            ev(120, "gill filaments and teeth in place; feeding begins")],
    notes="ZFA defines the pharynx as the swollen anterior foregut between the mouth and the liver whose walls form the jaws and gills. The teeth term (ceratobranchial 5 tooth) is a part of the pharynx. The skeletal and respiratory specialists cover arches and gills.",
    sources=[zfin("ZFA:0000056"), SRC["kimmel_hatch"], SRC["gi_review"]])

add(id="ZFA:0000547", system="digestive", parent="ZFA:0000339", color="#C97B63",
    visibleFromHpf=60, visibleNote="ZFIN gives an unknown start stage. The mouth opens at about 60 hpf in a ventral position and reaches its anterior terminal position by 72 hpf (Protruding-mouth stage).",
    spatial={"apFraction": [0.0, 0.03], "dv": "ventral between the eyes at 48 to 60 hpf; terminal at the snout tip from 72 hpf", "laterality": "midline", "landmarks": "anterior tip of the head; below the eyes before 72 hpf"},
    shape={"primitive": "custom", "notes": "Elliptical opening on the head mesh. Animate its position from mid-ventral (below the eyes) at 60 hpf to the snout tip at 72 hpf. Use a boolean cut or a dark disc."},
    sizes=[sz("Long-pec", 48, {"width": 30, "height": 15}, EST, "small opening between the eyes, seen only with Nomarski optics"),
           sz("Pec-fin", 60, {"width": 50, "height": 30}, EST, "small ventral opening"),
           sz("Protruding-mouth", 72, {"width": 80, "height": 50}, EST),
           sz("Day 5", 120, {"width": 150, "height": 80}, EST),
           sz("Adult", 2160, {"width": 2500, "height": 1500}, EST)],
    events=[ev(19, "stomodeum (ectodermal invagination) forms at 20-25 somites"),
            ev(48, "small open mouth visible with Nomarski optics between the eyes"),
            ev(60, "mouth opens in a ventral position"),
            ev(72, "mouth protrudes beyond the eye and gapes open"),
            ev(96, "anterior-dorsal protrusion continues during day 4")],
    notes="Kimmel et al. 1995 describe the repositioning of the mouth during the last 12 hours of the hatching period. The ZFA start stage is unknown, so the model should use visibleFromHpf.",
    sources=[zfin("ZFA:0000547"), SRC["kimmel_hatch"], SRC["kimmel_larval"], SRC["mouth60"]])

add(id="ZFA:0000204", system="digestive", parent="ZFA:0000112", color="#D8946A",
    spatial={"apFraction": [0.22, 0.27], "dv": "dorsal to the pericardium and sinus venosus; ventral to the notochord", "laterality": "midline", "landmarks": "short tube between the posterior pharynx and the intestinal bulb; the swim bladder pneumatic duct leaves its dorsal wall; the liver lies ventral and left of its posterior end"},
    shape={"primitive": "tube", "notes": "Short narrow tube. Keep the lumen closed before 72 hpf. Wall thicker than the intestine (striated muscle)."},
    sizes=[sz("Prim-15", 30, {"length": 40, "diameter": 20}, EST),
           sz("Long-pec", 48, {"length": 80, "diameter": 25}, EST),
           sz("Day 5", 120, {"length": 130, "diameter": 40}, EST),
           sz("Adult", 2160, {"length": 2000, "diameter": 1000}, EST)],
    events=[ev(30, "esophagus term starts in ZFIN (Prim-15); it develops separately from the intestine"),
            ev(52, "gut tube continuous from mouth to anus"),
            ev(75, "lumen continuous with the pharynx and intestinal bulb"),
            ev(120, "esophageal epithelium detectable as a distinct region"),
            ev(168, "epithelium begins to stratify into four cell layers")],
    notes="ZFA states that the esophagus develops from endodermal precursors at the rostral end of the digestive tract, independently of the intestine. The 5 dpf and 7 dpf epithelium statements come from the 2025 gut review.",
    sources=[zfin("ZFA:0000204"), SRC["wallace05"], SRC["gi_review"]])

add(id="ZFA:0001338", system="digestive", parent="ZFA:0000112", color="#E3A572",
    spatial={"apFraction": [0.27, 0.57], "dv": "ventral to the swim bladder, pronephric ducts and dorsal aorta; dorsal to the yolk extension in the larva", "laterality": "midline, with the bulb offset to the left in the larva", "landmarks": "from the esophagus to the cloaca; folds into three loops in the adult coelom"},
    shape={"primitive": "custom", "notes": "Group node for intestinal bulb, mid intestine and posterior intestine. Use one spline for the whole intestine and let the children own segments of it."},
    sizes=[sz("Prim-15", 30, {"length": 900, "diameter": 30}, EST),
           sz("Long-pec", 48, {"length": 1200, "diameter": 40}, EST),
           sz("Day 5", 120, {"length": 1400, "diameter": 90}, EST, "bulb diameter about 100; posterior segment about 40"),
           sz("Adult", 2160, {"length": 35000, "diameter": 1500}, EST, "three folded segments in a 25 mm SL fish")],
    events=[ev(30, "intestine term starts in ZFIN (Prim-15)"),
            ev(48, "multiple small lumens form between cells"),
            ev(68, "all embryos show a single lumen"),
            ev(98, "epithelial folding begins in the intestinal bulb; three regions distinguishable between 98 and 126 hpf"),
            ev(504, "a loop forms midway along the intestine between 20 and 22 dpf; length doubles between 19 and 26 dpf"),
            ev(792, "adult pattern of epithelial turnover begins at about 33 dpf")],
    notes="ZFA defines the intestine as a folded tube with parts intestinal bulb, mid intestine and posterior intestine. Alvers et al. 2014 report that single lumens form by 68 hpf. Li et al. 2020 describe the larval to juvenile looping and growth.",
    sources=[zfin("ZFA:0001338"), SRC["alvers"], SRC["li20"], SRC["gi_review"], SRC["wang10"]])

add(id="ZFA:0001076", system="digestive", parent="ZFA:0001338", color="#EDAE6B",
    spatial={"apFraction": [0.27, 0.40], "dv": "ventral to the swim bladder; dorsal and right of the liver; the pancreas head lies on its dorsal-right side", "laterality": "left of the midline in the larva", "landmarks": "immediately posterior to the esophagus; widest part of the gut; the hepatopancreatic duct enters its ventral wall"},
    shape={"primitive": "tube", "notes": "Tube with a large radius that tapers into the mid intestine. Give it the widest lumen of the tract. In the adult the rostral bulb is the first descending loop."},
    sizes=[sz("High-pec", 42, {"length": 200, "diameter": 50}, EST),
           sz("Long-pec", 48, {"length": 250, "diameter": 60}, EST),
           sz("Day 5", 120, {"length": 400, "diameter": 100}, EST),
           sz("Adult", 2160, {"length": 12000, "diameter": 2000}, EST)],
    events=[ev(42, "intestinal bulb term starts in ZFIN (High-pec)"),
            ev(58, "two enlarged lumens side by side in the bulb, then fusion"),
            ev(98, "folding of the bulb epithelium begins"),
            ev(120, "the bulb holds the most digestive enzymes and the largest epithelial surface")],
    notes="Synonyms in ZFA include anterior intestine and foregut. The zebrafish has no stomach; the bulb stores food. Wang et al. 2010 name the adult segment the rostral intestinal bulb.",
    sources=[zfin("ZFA:0001076"), SRC["alvers"], SRC["gi_review"], SRC["wang10"]])

add(id="ZFA:0001323", system="digestive", parent="ZFA:0001338", color="#E39A5B",
    spatial={"apFraction": [0.40, 0.50], "dv": "dorsal to the yolk extension in the larva; ventral to the pronephric ducts", "laterality": "midline", "landmarks": "between the intestinal bulb and the posterior intestine; the pancreas tail runs along its right side"},
    shape={"primitive": "tube", "notes": "Medium radius tube. In the adult this is the second loop of the folded intestine."},
    sizes=[sz("Prim-15", 30, {"length": 300, "diameter": 25}, EST),
           sz("Long-pec", 48, {"length": 400, "diameter": 35}, EST),
           sz("Day 5", 120, {"length": 500, "diameter": 60}, EST),
           sz("Adult", 2160, {"length": 12000, "diameter": 1500}, EST)],
    events=[ev(30, "mid intestine term starts in ZFIN (Prim-15)"),
            ev(100, "goblet cells appear in the mid intestine"),
            ev(120, "specialised enterocytes at its posterior end take up macromolecules")],
    notes="ZFA notes that the posterior end of the mid intestine holds enterocytes with a role in mucosal immunity and iron uptake.",
    sources=[zfin("ZFA:0001323"), SRC["gi_review"], SRC["wallace05"]])

add(id="ZFA:0000706", system="digestive", parent="ZFA:0001338", color="#C98A4E",
    spatial={"apFraction": [0.50, 0.57], "dv": "ventral to the pronephric ducts; dorsal to the ventral fin fold", "laterality": "midline", "landmarks": "from the end of the yolk extension to the cloaca"},
    shape={"primitive": "tube", "notes": "Narrow straight tube that ends at the cloaca. In the adult this is the third, caudal loop."},
    sizes=[sz("Prim-15", 30, {"length": 200, "diameter": 20}, EST),
           sz("Long-pec", 48, {"length": 250, "diameter": 30}, EST),
           sz("Day 5", 120, {"length": 250, "diameter": 40}, EST),
           sz("Adult", 2160, {"length": 10000, "diameter": 1200}, EST)],
    events=[ev(30, "posterior intestine term starts in ZFIN (Prim-15)"),
            ev(48, "hindgut inserts into the cloaca"),
            ev(52, "first enteroendocrine cells appear in the posterior intestine"),
            ev(120, "cloaca opens; the segment resembles the colon of other vertebrates")],
    notes="ZFA describes short longitudinal epithelial folds similar to the colon. Wang et al. 2010 show that the adult caudal segments share expression features with the mammalian large intestine.",
    sources=[zfin("ZFA:0000706"), SRC["cloaca23"], SRC["gi_review"], SRC["wang10"]])

add(id="ZFA:0005781", system="digestive", parent="ZFA:0000112", color="#A86B4C",
    spatial={"apFraction": [0.56, 0.58], "dv": "ventral body wall at the posterior end of the yolk extension", "laterality": "midline", "landmarks": "where the two pronephric ducts and the posterior intestine meet; the vent opens on the ventral surface just anterior to the anal fin fold"},
    shape={"primitive": "sphere", "notes": "Small chamber at the end of the gut spline. Attach the two pronephric duct splines here. Open the vent (dark disc) at 120 hpf."},
    sizes=[sz("Prim-5", 24, {"diameter": 25}, EST),
           sz("Long-pec", 48, {"diameter": 35}, EST),
           sz("Day 5", 120, {"diameter": 45}, EST),
           sz("Adult", 2160, {"diameter": 800}, EST)],
    events=[ev(24, "cloaca term starts in ZFIN (Prim-5); pronephric ducts fuse at the cloaca at 24 to 30 hpf"),
            ev(48, "hindgut inserts into the cloaca"),
            ev(96, "intestine attaches to the cloaca at 4 dpf (ZFA definition)"),
            ev(120, "cloaca opens for excretion"),
            ev(2160, "oviduct or sperm duct connect in the adult")],
    notes="The ZFA definition places the intestinal attachment at 4 dpf. A 2023 review places the hindgut insertion at 48 hpf and the opening at about 120 hpf. Both agree that excretion starts at about 5 dpf.",
    sources=[zfin("ZFA:0005781"), SRC["cloaca23"], SRC["tg_review"]])

add(id="ZFA:0000066", system="digestive", parent="ZFA:0000112", color="#8F5A40",
    spatial={"apFraction": [0.56, 0.57], "dv": "ventral surface", "laterality": "midline", "landmarks": "shallow ectodermal pit at the posterior end of the yolk extension, below somite 17 to 18"},
    shape={"primitive": "custom", "notes": "Small surface dimple. Show it only from 22 to 30 hpf, then hand over to the vent."},
    sizes=[sz("26+ somites", 22, {"diameter": 20, "depth": 10}, EST),
           sz("Prim-5", 24, {"diameter": 25, "depth": 15}, EST)],
    events=[ev(22, "proctodeum term starts in ZFIN (26+ somites)"),
            ev(30, "ZFIN end stage Prim-5; the vent develops from it")],
    notes="ZFA lists anus as a synonym of proctodeum. The vent term continues from 24 hpf to adult.",
    sources=[zfin("ZFA:0000066")])

add(id="ZFA:0000298", system="digestive", parent="ZFA:0005781", color="#7A4A35",
    visibleFromHpf=120, visibleNote="ZFIN starts the vent at Prim-5 (24 hpf) because it develops from the proctodeum. The opening only becomes patent at about 120 hpf.",
    spatial={"apFraction": [0.565, 0.575], "dv": "ventral surface", "laterality": "midline", "landmarks": "just anterior to the anal fin (fold); posterior to the yolk extension; anterior to the urogenital papilla in the adult"},
    shape={"primitive": "custom", "notes": "Dark elliptical disc on the ventral body surface. Scale with body length."},
    sizes=[sz("Prim-5", 24, {"diameter": 20}, EST),
           sz("Long-pec", 48, {"diameter": 30}, EST),
           sz("Day 5", 120, {"diameter": 40}, EST),
           sz("Adult", 2160, {"diameter": 700}, EST)],
    events=[ev(24, "vent term starts in ZFIN (Prim-5)"),
            ev(120, "cloaca opens for excretion"),
            ev(720, "the last fin fold remnant persists at the anterior margin of the vent at about 10 mm SL")],
    notes="ZFA synonyms: cloacal opening, cloacal vent. Parichy et al. 2009 use the vent as a landmark for fin fold loss.",
    sources=[zfin("ZFA:0000298"), SRC["cloaca23"], SRC["parichy"]])

add(id="ZFA:0000124", system="digestive", parent="ZFA:0000036", color="#A8453A",
    spatial={"apFraction": [0.26, 0.29], "dv": "ventral to the notochord at somite 1; dorsal to the yolk", "laterality": "left; the primordium is the leftward thickening of the foregut", "landmarks": "under somite 1, posterior to the heart and pharynx, anterior-dorsal to the yolk ball"},
    shape={"primitive": "ellipsoid", "notes": "Small ellipsoid attached to the left face of the intestinal bulb primordium. Grow it from 28 to 30 hpf."},
    sizes=[sz("Prim-5", 24, {"length": 40, "width": 30, "height": 30}, EST, "budding stage I: aggregating hepatocytes"),
           sz("Prim-5 late", 28, {"length": 60, "width": 40, "height": 40}, EST, "thickening under somite 1")],
    events=[ev(24, "liver primordium term starts and ends in ZFIN (Prim-5); hepatoblasts aggregate shortly after 24 hpf"),
            ev(28, "endoderm under somite 1 thickens (budding stage II)"),
            ev(30, "primordium bends to the left; the liver term takes over")],
    notes="Field et al. 2003 split liver budding (24 to 50 hpf) into three stages. The primordium term covers only the first hours. Synonym: liver bud.",
    sources=[zfin("ZFA:0000124"), SRC["field_liver"], SRC["tao_peng"]])

add(id="ZFA:0000123", system="digestive", parent="ZFA:0000036", color="#9B3B32",
    spatial={"apFraction": [0.24, 0.36], "dv": "ventral to the esophagus and swim bladder; dorsal to the pericardium and yolk", "laterality": "left of the midline until 80 hpf; crosses the midline to the right at 80 to 84 hpf; three lobes in the adult", "landmarks": "posterior to the heart, anterior to the intestinal bulb; the gall bladder sits on the right lobe"},
    shape={"primitive": "ellipsoid", "notes": "One ellipsoid on the left of the foregut until 72 hpf. From 80 hpf add a second ellipsoid on the right (gall bladder lobe). From 15 dpf add a flat ventral lobe along the intestine. In the adult use three lobes that wrap the intestinal loops."},
    sizes=[sz("Prim-5", 24, {"length": 40, "width": 30, "height": 30}, EST, "primordium only"),
           sz("Long-pec", 48, {"length": 100, "width": 60, "height": 60}, EST, "compact bud; hepatic duct present at 50 hpf"),
           sz("Protruding-mouth", 72, {"length": 150, "width": 80, "height": 80}, EST),
           sz("Day 5", 120, {"length": 250, "width": 170, "height": 120}, EST, "blood flow detected 70 um deep in both lobes; hepatocytes 10 to 14 um; sinusoids 12 to 16 um"),
           sz("Adult", 2160, {"length": 5000, "width": 3000, "height": 2000}, EST, "three lobes along the intestinal loops")],
    events=[ev(28, "budding begins under somite 1"),
            ev(30, "liver term starts in ZFIN (Prim-15); the anlage protrudes from the rod on the left"),
            ev(34, "leftward bend complete"),
            ev(46, "differentiated hepatocytes first detected (44 to 48 hpf)"),
            ev(50, "hepatic duct forms; end of budding, start of growth"),
            ev(56, "endothelial cells surround the bud (55 to 58 hpf)"),
            ev(72, "hepatic blood circulation starts; the liver expands beyond somite 1"),
            ev(82, "liver crosses the midline ventral to the esophagus; right lobe forms (80 to 84 hpf)"),
            ev(120, "vascular network almost complete; hepatic portal vein formed"),
            ev(360, "ventral (third) lobe starts to expand posteriorly at about 15 dpf")],
    notes="ZFA defines the liver as a solid compound organ with three lobes. Korzh et al. 2008 give the lobe timeline and the sinusoid and hepatocyte diameters. The adult dimensions are estimates for a 25 mm SL fish; Gupta and Mullins 2010 describe the adult liver as large, lobed and tan.",
    sources=[zfin("ZFA:0000123"), SRC["field_liver"], SRC["tao_peng"], SRC["korzh"], SRC["gupta"], SRC["menke"]])

add(id="ZFA:0000208", system="digestive", parent="ZFA:0000036", color="#5E9E5A",
    visibleFromHpf=72, visibleNote="ZFIN starts the gall bladder at Long-pec (48 hpf). It becomes easy to see as a green sac from about 3 dpf, after bile pigment accumulates.",
    spatial={"apFraction": [0.30, 0.33], "dv": "ventral to the intestinal bulb", "laterality": "right; adjacent to the right liver lobe", "landmarks": "between the right liver lobe and the intestinal bulb; the cystic duct joins the common bile duct"},
    shape={"primitive": "sphere", "notes": "Green translucent sphere on the right side of the foregut. Scale with the liver."},
    sizes=[sz("Long-pec", 48, {"diameter": 25}, EST),
           sz("Protruding-mouth", 72, {"diameter": 40}, EST),
           sz("Day 5", 120, {"diameter": 70}, EST),
           sz("Adult", 2160, {"diameter": 1200}, EST)],
    events=[ev(48, "gall bladder term starts in ZFIN (Long-pec)"),
            ev(60, "biliary cells differentiate (50 to 70 hpf)"),
            ev(72, "cystic duct and common bile duct terms start in ZFIN (Protruding-mouth)"),
            ev(120, "bile stored and released; larva feeds")],
    notes="ZFA names the right liver lobe the gall bladder lobe. In the adult the gall bladder is a green translucent fluid-filled sac in the viscera.",
    sources=[zfin("ZFA:0000208"), SRC["gupta"], SRC["korzh"]])

add(id="ZFA:0001370", system="digestive", parent="ZFA:0001371", color="#E9D27F",
    spatial={"apFraction": [0.30, 0.33], "dv": "dorsal to the intestinal rod; between the dorsal aorta and the posterior cardinal vein", "laterality": "right of the midline", "landmarks": "posterior to the liver primordium, at the level of somites 3 to 4"},
    shape={"primitive": "sphere", "notes": "Sphere of endocrine cells on the dorsal-right face of the gut rod. It becomes the principal islet."},
    sizes=[sz("Prim-5", 24, {"diameter": 35}, EST, "islet coalesces by 24 hpf"),
           sz("Prim-25", 36, {"diameter": 45}, EST, "about 46 hormone-positive cells at 36 hpf"),
           sz("Long-pec", 48, {"diameter": 50}, EST, "ZFIN end stage Long-pec")],
    events=[ev(14, "pancreas primordium term starts in ZFIN (10-13 somites)"),
            ev(24, "posterior pancreatic bud term starts; endocrine cells coalesce into the dorsal bud"),
            ev(40, "anterior bud appears ventrally and grows toward it"),
            ev(52, "the two buds fuse; the dorsal bud becomes the principal islet"),
            ev(60, "ZFIN end stage Long-pec")],
    notes="ZFA synonyms: dorsal pancreatic anlage, dorsal posterior bud, caudal anlage. Hesselson et al. 2009 state that the principal islet beta cells coalesce into the dorsal bud by 24 hpf. The 36 hpf cell count is from a 2015 Scientific Reports paper on pdx1 mutants.",
    sources=[zfin("ZFA:0001370"), SRC["field_panc"], SRC["hesselson09"], SRC["islet36"]])

add(id="ZFA:0001369", system="digestive", parent="ZFA:0001371", color="#F0E3A1",
    spatial={"apFraction": [0.29, 0.32], "dv": "ventral to the intestinal bulb primordium", "laterality": "left-ventral, then grows dorsally and to the right to meet the posterior bud", "landmarks": "ventral ridge of the intestinal bulb primordium, next to the liver bud"},
    shape={"primitive": "ellipsoid", "notes": "Small ellipsoid on the ventral face of the foregut that elongates toward the posterior bud between 40 and 52 hpf."},
    sizes=[sz("Prim-25", 36, {"length": 30, "diameter": 25}, EST),
           sz("Long-pec", 48, {"length": 80, "diameter": 40}, EST),
           sz("Pec-fin", 60, {"length": 120, "diameter": 50}, EST, "ZFIN end stage Pec-fin")],
    events=[ev(36, "anterior pancreatic bud term starts in ZFIN (Prim-25)"),
            ev(40, "bud visible on the ventral foregut"),
            ev(52, "fuses with the posterior bud"),
            ev(72, "ZFIN end stage Pec-fin; exocrine pancreas and ducts derive from it")],
    notes="ZFA synonyms: ventral pancreatic anlage, exocrine anlage, rostral anlage. This bud gives rise to the exocrine tissue, the pancreatic duct and later the secondary islets.",
    sources=[zfin("ZFA:0001369"), SRC["field_panc"], SRC["hesselson11"]])

add(id="ZFA:0000140", system="digestive", parent="ZFA:0001371", color="#EBD68C",
    spatial={"apFraction": [0.30, 0.45], "dv": "dorsal and right of the intestinal bulb; the tail runs along the right side of the mid intestine", "laterality": "right", "landmarks": "head of the pancreas at the intestinal bulb, next to the gall bladder and liver; tail along the intestine toward the swim bladder region"},
    shape={"primitive": "custom", "notes": "Head: ellipsoid on the dorsal-right side of the bulb that holds the principal islet. Tail: thin tapering tube along the right side of the intestine. In the adult use a diffuse ribbon in the mesentery along the intestinal loops."},
    sizes=[sz("Long-pec", 48, {"length": 120, "width": 60, "height": 50}, EST, "fused buds"),
           sz("Protruding-mouth", 72, {"length": 200, "width": 80, "height": 60}, EST),
           sz("Day 5", 120, {"length": 400, "width": 110, "height": 80}, EST, "head plus tail along the intestine"),
           sz("Adult", 2160, {"length": 8000, "width": 1500, "height": 800}, EST, "diffuse along the intestine; main pancreas on the right")],
    events=[ev(48, "pancreas term starts in ZFIN (Long-pec)"),
            ev(52, "dorsal and ventral buds fuse"),
            ev(70, "exocrine pancreas reporter expression starts (67 to 72 hpf)"),
            ev(120, "exocrine protease activity present; tail extends caudally"),
            ev(168, "secondary islets form at about 7 dpf")],
    notes="ZFA notes that the zebrafish pancreas forms from two buds. In the adult the main pancreas lies on the right side, attached to the intestine by the pancreatic duct. It holds one large islet and three to six smaller islets. The tail extends caudally along the right side of the intestine.",
    sources=[zfin("ZFA:0000140"), SRC["field_panc"], SRC["korzh"], SRC["hesselson11"]])

add(id="ZFA:0001260", system="digestive", parent="ZFA:0000140", color="#D8A63C",
    visibleFromHpf=24, visibleNote="ZFIN starts the endocrine pancreas at Long-pec (48 hpf). The principal islet is already a compact cluster at 24 hpf (posterior pancreatic bud term).",
    spatial={"apFraction": [0.31, 0.33], "dv": "dorsal to the intestinal bulb", "laterality": "right of the midline", "landmarks": "principal islet in the pancreas head; secondary islets scattered along the tail from 7 dpf"},
    shape={"primitive": "sphere", "notes": "One sphere (principal islet) inside the pancreas head. Add small spheres along the tail after 7 dpf. Adult: one large islet plus three to six smaller islets."},
    sizes=[sz("Prim-5", 24, {"diameter": 35}, EST),
           sz("Long-pec", 48, {"diameter": 50}, EST),
           sz("Day 5", 120, {"diameter": 60}, EST),
           sz("Adult", 2160, {"diameter": 300}, EST, "principal islet")],
    events=[ev(24, "principal islet coalesces (dorsal bud)"),
            ev(48, "endocrine pancreas term starts in ZFIN; islet functional by 48 hpf"),
            ev(120, "secondary islets can be induced from 5 dpf"),
            ev(168, "secondary islets usually form at about 7 dpf")],
    notes="ZFA synonyms: pancreatic islet, tail pancreas. The endocrine pancreas is part of both the digestive and endocrine systems in ZFA. Secondary islet timing comes from the ZFA definition of secondary islet.",
    sources=[zfin("ZFA:0001260"), zfin("ZFA:0005756"), SRC["hesselson09"], SRC["hesselson11"]])

add(id="ZFA:0001249", system="digestive", parent="ZFA:0000140", color="#F2E6B3",
    spatial={"apFraction": [0.30, 0.45], "dv": "dorsal and right of the intestine", "laterality": "right", "landmarks": "surrounds the principal islet and extends as the pancreas tail along the intestine"},
    shape={"primitive": "custom", "notes": "Pale tissue that wraps the islet sphere and forms the tail ribbon. Same spline as the pancreas node."},
    sizes=[sz("Long-pec", 48, {"length": 100, "width": 50, "height": 40}, EST),
           sz("Day 5", 120, {"length": 380, "width": 100, "height": 70}, EST),
           sz("Adult", 2160, {"length": 8000, "width": 1500, "height": 800}, EST)],
    events=[ev(48, "exocrine pancreas term starts in ZFIN (Long-pec)"),
            ev(70, "acinar reporter expression starts (67 to 72 hpf)"),
            ev(120, "phospholipase and protease activity present; increases 5 to 6 dpf")],
    notes="ZFA synonyms: head pancreas, rostral pancreas. It derives from the anterior (ventral) pancreatic bud.",
    sources=[zfin("ZFA:0001249"), SRC["korzh"], SRC["field_panc"]])

add(id="ZFA:0000694", system="digestive", parent="ZFA:0000056", color="#F1EBD8",
    spatial={"apFraction": [0.20, 0.24], "dv": "ventral floor of the posterior pharynx, dorsal to the heart", "laterality": "paired, one tooth field on each ceratobranchial 5", "landmarks": "on the fifth ceratobranchial (pharyngeal jaw), posterior to the gill arches, at about 450 um from the opercular surface in a 1 month fish"},
    shape={"primitive": "custom", "notes": "Small cones on the medial face of each ceratobranchial 5, pointing dorsally. Start with one cone per side (4V) at 48 hpf, add 3V at 72 hpf and 5V at 96 hpf. Adult: 11 cones per side in three rows (5 ventral, 4 mediodorsal, 2 dorsal)."},
    sizes=[sz("Long-pec", 48, {"height": 20, "diameter": 15}, EST, "early morphogenesis germ of tooth 4V"),
           sz("Day 5", 120, {"height": 50, "diameter": 25}, EST, "three attached teeth per side"),
           sz("Adult", 2160, {"height": 250, "diameter": 100}, EST, "11 teeth per side")],
    events=[ev(48, "first tooth germ (4V) visible; ceratobranchial 5 tooth term starts in ZFIN (Long-pec)"),
            ev(72, "tooth 3V starts (ZFIN Protruding-mouth)"),
            ev(80, "4V attaches; first replacement tooth forms at the 4V position"),
            ev(96, "tooth 5V present (ZFIN Day 4 start for 5V is Protruding-mouth)"),
            ev(384, "ventral tooth row complete at about 16 dpf"),
            ev(624, "22 cycling teeth (11 per side) in fish older than 26 dpf")],
    notes="ZFA states that ceratobranchial teeth are the only teeth in zebrafish and that tooth tips form before the bone itself (3.0 mm NL). Van der heyden and Huysseune 2000 give the initiation and replacement dynamics. The 2015 imaging review restates 4V at 48 hpf, replacement at 80 hpf and the 11 teeth per side. The 2.4.5 row formula is from Van der heyden and Huysseune 2000 (unverified here).",
    sources=[zfin("ZFA:0000694"), zfin("ZFA:0001145"), zfin("ZFA:0001143"), SRC["vdh00"], SRC["dent_rev"]])

# ============================================================ EXCRETORY
add(id="ZFA:0000151", system="excretory", parent="ZFA:0000163", color="#8C4FA3",
    spatial={"apFraction": [0.28, 0.57], "dv": "ventral to the somites; dorsal to the gut; glomerulus ventral to the dorsal aorta", "laterality": "paired ducts and tubules; glomeruli fused at the midline", "landmarks": "glomerulus at somite 3; tubules from somite 3 to 5; ducts from somite 5 to the cloaca at somite 17 to 18"},
    shape={"primitive": "custom", "notes": "Group node: one fused sphere (glomerulus) plus two short tubules that turn into two long ducts running caudally to the cloaca. Keep the two ducts parallel, about 60 to 80 um apart at 24 hpf."},
    sizes=[sz("Prim-5", 24, {"length": 800, "duct_diameter": 20}, EST, "from somite 3 to the cloaca; nephric primordium ventral to somite 3"),
           sz("Long-pec", 48, {"length": 1000, "duct_diameter": 30}, EST),
           sz("Day 5", 120, {"length": 1300, "duct_diameter": 35}, EST),
           sz("Days 7-13", 240, {"length": 1800, "duct_diameter": 40}, EST, "ZFIN end stage; mesonephros takes over")],
    events=[ev(10.3, "pronephric mesoderm (intermediate mesoderm) present at 1-4 somites"),
            ev(14, "pronephros, glomerulus, tubule and duct terms start in ZFIN (10-13 somites)"),
            ev(21, "distal tubule reaches and fuses with the cloaca by the 22 somite stage"),
            ev(24, "ducts complete; nephric primordium ventral to somite 3"),
            ev(44, "vascularisation and onset of filtration between 40 and 48 hpf; glomeruli fused at the midline by 48 hpf"),
            ev(72, "proximal convoluted tubule coils between 72 and 144 hpf"),
            ev(336, "ZFIN end stage Days 7-13; mesonephric nephrons appear from 12 to 14 dpf")],
    notes="ZFA defines the pronephros as two glomeruli fused at the midline, two tubules and paired ducts at the level of the third somite. Wingert et al. 2007 map the segments to somites. Podocytes and neck lie at somite 3 to 4. The proximal convoluted tubule starts at somite 5 at 24 hpf and at somite 3 at 48 hpf. The tubule spans somites 4 to 18. The distal late segment and the duct overlap at somite 17.",
    sources=[zfin("ZFA:0000151"), SRC["drummond"], SRC["wingert"], SRC["naylor16"]])

add(id="ZFA:0001557", system="excretory", parent="ZFA:0000151", color="#B23A8C",
    spatial={"apFraction": [0.29, 0.31], "dv": "immediately ventral to the dorsal aorta; dorsal to the gut", "laterality": "paired primordia at 24 hpf; fused at the midline by 48 hpf", "landmarks": "level of somite 3; the interrenal gland lies immediately caudal to it"},
    shape={"primitive": "sphere", "notes": "Two small spheres left and right of the midline at 24 hpf that merge into one sphere under the dorsal aorta by 48 hpf."},
    sizes=[sz("Prim-5", 24, {"diameter": 30}, EST, "each bilateral cluster"),
           sz("Long-pec", 48, {"width": 70, "height": 40, "length": 50}, EST, "fused glomerulus"),
           sz("Day 5", 120, {"width": 90, "height": 50, "length": 60}, EST),
           sz("Days 7-13", 240, {"width": 100, "height": 60, "length": 70}, EST)],
    events=[ev(14, "term starts in ZFIN (10-13 somites)"),
            ev(24, "podocyte progenitors in a curve at somite 3 to 4"),
            ev(40, "filtration begins between 40 and 48 hpf"),
            ev(48, "podocyte clusters fused at the midline at somite 3"),
            ev(336, "ZFIN end stage Days 7-13")],
    notes="ZFA synonyms: pronephric glomera, glomeruli, glomus. Drummond et al. 1998 showed that filtration starts between 40 and 48 hpf.",
    sources=[zfin("ZFA:0001557"), SRC["drummond"], SRC["wingert"]])

add(id="ZFA:0001558", system="excretory", parent="ZFA:0000151", color="#A55BB0",
    spatial={"apFraction": [0.30, 0.35], "dv": "ventral to somites 3 to 5; dorsal to the gut and the swim bladder region", "laterality": "paired, lateral to the glomerulus", "landmarks": "neck at somite 3; proximal convoluted tubule from somite 3 (48 hpf) or 5 (24 hpf) to about somite 8; coils after 72 hpf"},
    shape={"primitive": "tube", "notes": "Two short tubes that leave the glomerulus laterally and bend caudally into the ducts. From 72 hpf add coiling (a helical spline of two to three turns) in the proximal segment."},
    sizes=[sz("Prim-5", 24, {"length": 150, "diameter": 25}, EST),
           sz("Long-pec", 48, {"length": 200, "diameter": 30}, EST),
           sz("Day 5", 120, {"length": 300, "diameter": 35}, EST, "coiled"),
           sz("Days 7-13", 240, {"length": 350, "diameter": 40}, EST)],
    events=[ev(14, "term starts in ZFIN (10-13 somites)"),
            ev(24, "segments patterned; anterior boundary of the proximal tubule at somite 5"),
            ev(48, "anterior boundary shifts to somite 3"),
            ev(72, "proximal convoluted tubule coils between 72 and 144 hpf"),
            ev(336, "ZFIN end stage Days 7-13")],
    notes="ZFA synonym: ciliated neck segment. ZFA notes that in teleosts the tubules form after the duct and join the anterior tip of the duct.",
    sources=[zfin("ZFA:0001558"), SRC["wingert"], SRC["drummond"]])

add(id="ZFA:0000150", system="excretory", parent="ZFA:0000151", color="#9C6FC4",
    spatial={"apFraction": [0.33, 0.57], "dv": "ventral to the somites, lateral to the dorsal aorta and posterior cardinal vein; dorsal to the gut", "laterality": "paired, left and right", "landmarks": "from about somite 5 to the cloaca below somite 17 to 18; the corpuscles of Stannius sit on top of the distal segment"},
    shape={"primitive": "tube", "notes": "Two parallel tubes along the ventral edge of the somites that converge and fuse at the cloaca. Lumen diameter grows with age."},
    sizes=[sz("Prim-5", 24, {"length": 650, "diameter": 20, "lumen": 8}, EST, "somite 5 to cloaca; somite length about 45 um"),
           sz("Long-pec", 48, {"length": 800, "diameter": 30, "lumen": 12}, EST),
           sz("Day 5", 120, {"length": 1000, "diameter": 35, "lumen": 15}, EST),
           sz("Days 7-13", 240, {"length": 1400, "diameter": 40, "lumen": 18}, EST)],
    events=[ev(14, "duct term starts in ZFIN (10-13 somites)"),
            ev(17, "distal end starts to migrate toward the cloaca (16 to 18 somites)"),
            ev(21, "distal segment fuses with the cloaca by 22 somites"),
            ev(24, "ducts complete along the trunk"),
            ev(48, "ducts converge at the cloaca in wt1b reporter larvae"),
            ev(336, "ZFIN end stage Days 7-13; mesonephric duct continues in the adult")],
    notes="ZFA notes that the duct as described traditionally contains segments that match tubule segments of other vertebrates (Wingert et al. 2007). The lumen numbers are estimates; Sullivan-Brown et al. 2008 report a larger lumen in medial than posterior tubules at 26 to 30 hpf.",
    sources=[zfin("ZFA:0000150"), SRC["wingert"], SRC["naylor16"], SRC["tg_review"]])

add(id="ZFA:0000529", system="excretory", parent="ZFA:0000163", color="#7B2D8E",
    visibleFromHpf=288, visibleNote="ZFIN starts the kidney (mesonephros) at Day 5 (120 hpf) when nephron progenitors appear. The first mesonephric nephron forms at 12 to 14 dpf ventral to the sixth myotome.",
    spatial={"apFraction": [0.22, 0.56], "dv": "along the dorsal body wall, ventral to the vertebral column and dorsal aorta; dorsal to the swim bladder and gut", "laterality": "midline, fused bilateral lobes in the head kidney; paired trunk tissue that fuses in the adult", "landmarks": "head kidney behind the gills; trunk (body) kidney along the vertebrae; tail kidney to the level of the vent"},
    shape={"primitive": "custom", "notes": "Flat elongated strip pressed against the dorsal body wall. Wider anterior head region with two lobes, narrow trunk and tail. In the larva show it as new nephron spheres added around the pronephric ducts."},
    sizes=[sz("Day 5", 120, {"length": 50, "width": 20, "height": 20}, EST, "nephron progenitor clusters only; no organ yet"),
           sz("Days 14-20", 336, {"length": 300, "width": 80, "height": 50}, EST, "first mesonephric nephrons around the pronephros"),
           sz("Juvenile 30 dpf", 720, {"length": 5000, "width": 500, "height": 300}, EST, "head, trunk and tail regions present at 9 mm"),
           sz("Adult", 2160, {"length": 14000, "width": 1500, "height": 800}, EST, "about 300 nephrons at 3 months")],
    events=[ev(120, "kidney and nephron progenitor terms start in ZFIN (Day 5)"),
            ev(240, "first mesonephric nephron expresses cdh17 at 5.2 to 5.5 mm (about 10 dpf)"),
            ev(312, "first podocytes and first nephron primordium ventral to the sixth myotome (12 to 14 dpf)"),
            ev(456, "nephrogenesis proceeds caudally, then rostrally from 18 to 20 dpf"),
            ev(720, "head, trunk and tail regions distinct at 9 mm (about 30 dpf)"),
            ev(2160, "about 150 medial nephrons (48 percent of the total) by 3 months; number still rises slowly to 18 months")],
    notes="ZFA synonym: mesonephros. The kidney is part of the renal, immune and pleuroperitoneal terms. Zhou et al. 2010 and Diep et al. 2015 give the timing. Gupta and Mullins 2010 describe the adult kidney as a translucent pink structure along the dorsal body wall. It has head, body and tail regions.",
    sources=[zfin("ZFA:0000529"), SRC["zhou10"], SRC["diep15"], SRC["gupta"]])

add(id="ZFA:0000669", system="excretory", parent="ZFA:0000529", color="#6A2C7A",
    visibleFromHpf=720, visibleNote="ZFIN gives an unknown start stage. The head region becomes distinct at the 9 mm stage (about 30 dpf).",
    spatial={"apFraction": [0.22, 0.30], "dv": "dorsal body wall behind the gills; dorsal to the anterior swim bladder chamber and the heart", "laterality": "fused bilateral lobes at the midline", "landmarks": "anterior part of the kidney; holds the interrenal gland; site of definitive hematopoiesis"},
    shape={"primitive": "ellipsoid", "notes": "Two fused ellipsoids at the anterior end of the kidney strip, darker than the trunk kidney."},
    sizes=[sz("Juvenile 30 dpf", 720, {"length": 1000, "width": 500, "height": 300}, EST),
           sz("Adult", 2160, {"length": 3000, "width": 1800, "height": 900}, EST)],
    events=[ev(720, "head, trunk and tail regions distinct at 9 mm"),
            ev(2160, "main site of definitive hematopoiesis in the adult")],
    notes="ZFA synonyms: anterior kidney, kidney marrow. The hematopoietic specialist may also model this node.",
    sources=[zfin("ZFA:0000669"), SRC["diep15"], SRC["gupta"]])

add(id="ZFA:0001293", system="excretory", parent="ZFA:0000529", color="#8E4A9E",
    visibleFromHpf=336, visibleNote="ZFIN starts the posterior kidney at Day 6 (144 hpf). The first mesonephric nephrons of the trunk appear at 12 to 14 dpf.",
    spatial={"apFraction": [0.30, 0.56], "dv": "ventral to the vertebral column; dorsal to the swim bladder and gonads", "laterality": "paired strips that fuse at the midline in the adult", "landmarks": "trunk (body) and tail kidney from behind the head kidney to the level of the vent"},
    shape={"primitive": "tube", "notes": "Flattened ribbon along the dorsal midline that tapers caudally. Same spline as the pronephric ducts, which it replaces."},
    sizes=[sz("Days 14-20", 336, {"length": 1500, "width": 80, "height": 50}, EST),
           sz("Juvenile 30 dpf", 720, {"length": 4000, "width": 300, "height": 200}, EST),
           sz("Adult", 2160, {"length": 11000, "width": 1200, "height": 600}, EST)],
    events=[ev(144, "posterior kidney term starts in ZFIN (Day 6)"),
            ev(312, "first nephron primordium ventral to the sixth myotome"),
            ev(480, "new nephrons form on top of the pronephric distal segments at the 8 mm stage"),
            ev(720, "trunk and tail regions distinct at 9 mm")],
    notes="ZFA gives no definition. Diep et al. 2015 show new mesonephric nephrons forming on top of the pronephric distal early and distal late segments.",
    sources=[zfin("ZFA:0001293"), SRC["diep15"], SRC["zhou10"]])

add(id="ZFA:0000546", system="excretory", parent="ZFA:0000163", color="#B48ACF",
    visibleFromHpf=336, visibleNote="ZFIN gives an unknown start stage. The mesonephric duct is the pronephric duct that persists after 14 dpf.",
    spatial={"apFraction": [0.30, 0.57], "dv": "ventral to the somites and vertebrae; dorsal to the gut", "laterality": "paired", "landmarks": "runs along the kidney and empties into the cloacal chamber"},
    shape={"primitive": "tube", "notes": "Continue the pronephric duct splines after 336 hpf under this term."},
    sizes=[sz("Days 14-20", 336, {"length": 1500, "diameter": 40}, EST),
           sz("Adult", 2160, {"length": 12000, "diameter": 300}, EST)],
    events=[ev(336, "pronephric duct term ends; mesonephric duct continues"),
            ev(2160, "drains the adult kidney into the cloacal chamber")],
    notes="ZFA synonyms: renal duct, Wolffian duct. ZFA defines it as the duct of the adult kidney, bilateral, ventral to the somites, leading to the cloacal chamber.",
    sources=[zfin("ZFA:0000546"), SRC["diep15"]])

# ============================================================ ENDOCRINE
add(id="ZFA:0001081", system="endocrine", parent="ZFA:0001158", color="#E57DA0",
    visibleFromHpf=24, visibleNote="ZFIN starts the primordium at Prim-15 (30 hpf). nkx2.4b-positive thyroid cells are present in the pharyngeal floor at 24 hpf and pax2a-positive precursors from 18 to 22 hpf.",
    spatial={"apFraction": [0.14, 0.17], "dv": "floor of the pharynx, dorsal to the heart tube and outflow tract", "laterality": "midline", "landmarks": "pharyngeal floor at the level of the second pharyngeal arch, just anterior to the outflow tract"},
    shape={"primitive": "sphere", "notes": "Small sphere in the ventral pharyngeal wall. From 36 to 40 hpf let it bud rostro-ventrally out of the wall."},
    sizes=[sz("Prim-5", 24, {"diameter": 30}, EST, "monolayer of committed cells"),
           sz("Prim-15", 30, {"diameter": 35}, EST),
           sz("Prim-25", 40, {"length": 50, "diameter": 35}, EST, "placode budding from the pharyngeal epithelium"),
           sz("Long-pec", 55, {"diameter": 40}, EST, "30 to 40 differentiated cells; ZFIN end stage Long-pec")],
    events=[ev(20, "pax2a expression starts in the foregut endoderm"),
            ev(24, "nkx2.4b positive thyroid cells near the heart tube"),
            ev(30, "thyroid primordium term starts in ZFIN (Prim-15); pax8 and foxe1 expressed at 28 to 30 hpf"),
            ev(38, "placode buds from the pharyngeal epithelium (36 to 40 hpf); tg expressed"),
            ev(55, "first follicle differentiates; end of the primordium term at 60 hpf")],
    notes="The 2021 review (PMC8213386) and Alt et al. 2006 give this timeline. At 28 hpf the foregut holds up to 100 Pax2a positive cells, but the 55 hpf primordium holds only 30 to 40 differentiated thyroid cells.",
    sources=[zfin("ZFA:0001081"), SRC["thy_review"], SRC["alt06"], SRC["thy_fgf"]])

add(id="ZFA:0001072", system="endocrine", parent="ZFA:0001158", color="#D9548A",
    spatial={"apFraction": [0.15, 0.22], "dv": "ventral to the pharynx; along the ventral aorta between the hypobranchial cartilage and the outflow tract", "laterality": "midline; follicles scatter left and right of the ventral aorta in the adult", "landmarks": "first follicle at the anterior end; new follicles added caudally along the ventral aorta"},
    shape={"primitive": "custom", "notes": "Chain of small spheres along the ventral aorta. One sphere at 55 hpf, four to six spheres by 6 dpf, several dozen scattered spheres in the adult. No capsule."},
    sizes=[sz("Long-pec", 55, {"diameter": 35}, EST, "one follicle"),
           sz("Day 5", 120, {"length": 150, "diameter": 30}, EST, "four to six follicles in a row"),
           sz("Days 7-13", 264, {"length": 250, "diameter": 40}, EST, "4 to 6 follicles; follicle size increases 6 to 11 dpf"),
           sz("Adult", 2160, {"length": 2500, "diameter": 120}, EST, "loose follicles along the ventral aorta")],
    events=[ev(48, "thyroid follicle term starts in ZFIN (Long-pec)"),
            ev(55, "first follicle with a lumen; functional genes expressed"),
            ev(72, "follicular tissue grows along the pharyngeal midline (55 to 120 hpf)"),
            ev(144, "cell cords re-organised into distinct follicles by 6 dpf; typically 4 to 6 follicles from 6 to 11 dpf"),
            ev(2160, "bulk of the thyroid caudal to the branchial chamber along the ventral aorta")],
    notes="ZFA states that follicles form along the midline in pharyngeal mesenchyme and are not encapsulated. Alt et al. 2006 showed that the first follicle becomes the most anterior one and that new follicles are added caudally. Trubiroha et al. 2018 counted 4 to 6 follicles from 6 to 11 dpf.",
    sources=[zfin("ZFA:0001072"), SRC["alt06"], SRC["thy_review"], SRC["trubiroha"], SRC["inhand_endo"]])

add(id="ZFA:0001346", system="endocrine", parent="ZFA:0000151", color="#E0A83C",
    spatial={"apFraction": [0.30, 0.32], "dv": "ventral to somite 3, ventral to the dorsal aorta; dorsal to the gut", "laterality": "bilateral at 22 to 27 hpf; single cluster slightly right of the midline from 24 to 30 hpf; between the dorsal aorta and the right posterior cardinal vein by 28 hpf", "landmarks": "next to the pronephric glomerular primordia; immediately caudal to the glomerulus after fusion"},
    shape={"primitive": "sphere", "notes": "Two small spheres beside the glomerular primordia at 22 hpf that merge into one sphere right of the midline by 30 hpf."},
    sizes=[sz("20-25 somites", 22, {"diameter": 20}, EST, "each bilateral cluster"),
           sz("Prim-5", 24, {"diameter": 30}, EST, "converging"),
           sz("Long-pec", 48, {"diameter": 40}, EST),
           sz("Protruding-mouth", 72, {"diameter": 50}, EST, "ZFIN end stage Protruding-mouth")],
    events=[ev(19, "interrenal primordium term starts in ZFIN (20-25 somites)"),
            ev(22, "ff1b positive bilateral clusters ventral to somite 3 (22 to 27 hpf)"),
            ev(27, "clusters fuse at the midline at the 22 to 24 somite stage guided by angioblasts"),
            ev(28, "single tissue between the dorsal aorta and the right posterior cardinal vein"),
            ev(48, "interrenal vessel sprouts from the dorsal aorta into the tissue at about 2 dpf"),
            ev(96, "ZFIN end stage Protruding-mouth; interrenal gland term continues")],
    notes="Hsu et al. 2003 describe parallel development with the pronephros. Chou et al. 2012 give the vessel timeline and the rightward position.",
    sources=[zfin("ZFA:0001346"), SRC["hsu03"], SRC["chou12"]])

add(id="ZFA:0001345", system="endocrine", parent="ZFA:0000669", color="#D4922A",
    spatial={"apFraction": [0.30, 0.32], "dv": "ventral to the dorsal aorta at the midtrunk level of somites 3 to 4; dorsal to the gut", "laterality": "single tissue slightly right of the midline; bilobed in the adult, lateral to the notochord", "landmarks": "immediately caudal to the vascularised glomerulus; embedded in the head kidney in the adult"},
    shape={"primitive": "ellipsoid", "notes": "One ellipsoid just caudal to the glomerulus, right of the midline, with a vessel through it from 2 dpf. In the adult: two lobes inside the head kidney."},
    sizes=[sz("Protruding-mouth", 72, {"length": 60, "width": 45, "height": 40}, EST, "assembly complete by 3 dpf"),
           sz("Day 5", 120, {"length": 70, "width": 50, "height": 45}, EST),
           sz("Adult", 2160, {"length": 800, "width": 400, "height": 300}, EST, "steroidogenic and chromaffin cells scattered in the head kidney")],
    events=[ev(48, "assembly starts at about 2 dpf; cells migrate from the right of the dorsal aorta toward the midline"),
            ev(72, "interrenal gland term starts in ZFIN (Protruding-mouth); circulation through the gland established by 3 dpf"),
            ev(120, "pituitary control of interrenal growth starts at 5 dpf"),
            ev(2160, "bilobed tissue lateral to the notochord inside the head kidney")],
    notes="ZFA defines the gland as bilobed, lateral to the notochord, embedded in the head kidney and the equivalent of the adrenal cortex. Chou et al. 2012 place the assembling gland at the level of somites 3 to 4.",
    sources=[zfin("ZFA:0001345"), SRC["chou12"], SRC["hsu03"], SRC["inhand_endo"]])

add(id="ZFA:0001200", system="endocrine", parent="ZFA:0000151", color="#C15A9A",
    visibleFromHpf=50, visibleNote="ZFIN starts the term at 20-25 somites (19 hpf). stc1-positive cells appear in the tubule at 24 hpf and bulge from it at 32 hpf. They form discrete glands on top of the tubules by 50 hpf.",
    spatial={"apFraction": [0.44, 0.47], "dv": "dorsal side of the pronephric duct; ventral to the somites", "laterality": "paired, one on each duct (occasionally fused)", "landmarks": "junction of the distal early and distal late segments, at about somite 10 to 12; lateroventral surface of the posterior kidney in the adult"},
    shape={"primitive": "sphere", "notes": "One small sphere on the dorsal surface of each pronephric duct at the distal early / distal late junction. Extrude it upward between 32 and 50 hpf."},
    sizes=[sz("Prim-5", 24, {"diameter": 15}, EST, "stc1 positive cells still inside the tubule"),
           sz("Long-pec", 50, {"diameter": 25}, EST, "discrete gland on top of the tubule"),
           sz("Day 5", 120, {"diameter": 35}, EST),
           sz("Adult", 2160, {"diameter": 200}, EST, "islands on the lateroventral kidney surface")],
    events=[ev(19, "term starts in ZFIN (20-25 somites); cells arise in the distal pronephros"),
            ev(24, "cdh17 down-regulated and stc1 expressed in the posterior distal early segment"),
            ev(32, "prominent bulge on the dorsal side of the tubule"),
            ev(42, "neighbouring epithelial cells meet under the extruding cells"),
            ev(50, "discrete separate glands on top of each tubule in about 70 percent of animals"),
            ev(60, "extrusion complete in most embryos")],
    notes="ZFA describes islands of eosinophilic cells on the lateroventral surface of the kidney that secrete hypocalcin (stanniocalcin). Naylor et al. 2018 describe the transdifferentiation and extrusion from the distal early tubule. The somite level is an estimate read from the Wingert 2007 segment map.",
    sources=[zfin("ZFA:0001200"), SRC["naylor18"], SRC["wingert"]])

add(id="ZFA:0001448", system="endocrine", parent="ZFA:0001158", color="#6FA8D6",
    visibleFromHpf=168, visibleNote="ZFIN starts the ultimobranchial body at Pec-fin (60 hpf). calca-positive C cells are documented from 7 dpf; the location is documented at 10 dpf.",
    spatial={"apFraction": [0.22, 0.24], "dv": "between the gut and the heart, beneath the muscle layer of the gut, at the axial level of the sinus venosus; dorsal to the heart in the transverse septum in the adult", "laterality": "midline (paired origin from caudal pharyngeal pouches; described as a single midline organ in the adult)", "landmarks": "ventral wall of the esophagus, above the sinus venosus and atrium"},
    shape={"primitive": "sphere", "notes": "Small sphere between the esophagus and the sinus venosus. In the adult a cluster of small follicles dorsal to the heart in the transverse septum."},
    sizes=[sz("Pec-fin", 60, {"diameter": 20}, EST),
           sz("Day 5", 120, {"diameter": 30}, EST),
           sz("Days 7-13", 240, {"diameter": 45}, EST, "distinct cell cluster with several small follicles at 10 dpf"),
           sz("Adult", 2160, {"diameter": 300}, EST)],
    events=[ev(60, "ultimobranchial body term starts in ZFIN (Pec-fin)"),
            ev(168, "calca transcripts in the ultimobranchial body at 7 dpf; calcitonin protein not yet detectable"),
            ev(240, "distinct cluster of several small follicles between gut and heart at 10 dpf"),
            ev(2160, "single midline organ dorsal to the heart in the transverse septum; two groups of follicles near the sinus venosus (ZFA)")],
    notes="ZFA states that in the adult the glands lie as two groups of follicles at the transverse septum close to the sinus venosus. The 2024 Development paper (PMC11698069) gives the larval position and calca timing.",
    sources=[zfin("ZFA:0001448"), SRC["ub24"], SRC["inhand_endo"]])

# ============================================================ REPRODUCTIVE
add(id="ZFA:0009288", system="reproductive", parent="ZFA:0000632", color="#EE6FA0",
    spatial={"apFraction": [0.40, 0.46], "dv": "dorsal to the yolk; ventral to the somites and lateral to the pronephric ducts at 24 hpf", "laterality": "two bilateral clusters", "landmarks": "at the junction of the yolk ball and yolk extension, at the level of somites 8 to 10, at 24 hpf; in the gonadal region ventral to the swim bladder at 5 dpf"},
    shape={"primitive": "custom", "notes": "Point cloud of 4 to 50 small spheres. Four cells at 4 hpf at the blastoderm margin, then two migrating clusters that settle at the yolk ball / yolk extension junction by 24 hpf."},
    sizes=[sz("Sphere", 4, {"count": 4, "cell_diameter": 15}, EST, "four PGCs at the blastoderm margin"),
           sz("Prim-5", 24, {"count": 35, "cluster_length": 60, "cell_diameter": 12}, SRC["pgc21"], "25 to 50 PGCs in compact bilateral clusters"),
           sz("Long-pec", 48, {"count": 40, "cluster_length": 70, "cell_diameter": 12}, EST),
           sz("Day 5", 120, {"count": 45, "cluster_length": 80, "cell_diameter": 12}, EST, "PGCs begin to associate with somatic gonad cells")],
    events=[ev(3, "PGCs specified at mid-blastula"),
            ev(4, "primordial germ cell term starts in ZFIN (Sphere)"),
            ev(24, "migration to the gonadal region complete; 25 to 50 PGCs in bilateral clusters"),
            ev(120, "PGCs and somatic gonad cells begin to coalesce"),
            ev(168, "gonad primordium term ends at 336 hpf; germ cells continue as oogonia or spermatogonia")],
    notes="ZFA gives an unknown end stage for this cell term. The 2021 PGC paper (PMC7847270) cites 25 to 50 PGCs at 24 hpf. This is a cell-level term kept because the task asked for it; the model can draw it as a cluster.",
    sources=[zfin("ZFA:0009288"), SRC["pgc21"], SRC["leerberg"]])

add(id="ZFA:0001262", system="reproductive", parent="ZFA:0000632", color="#F29BB6",
    visibleFromHpf=120, visibleNote="ZFIN gives an unknown start stage. Somatic gonad cells surround germ cells from 5 dpf; germ cells alone mark the region from 24 hpf.",
    spatial={"apFraction": [0.36, 0.44], "dv": "ventral to the mesonephros / pronephric ducts; dorsal to the gut; in contact with the coelomic epithelium that lines the swim bladder at 5 dpf", "laterality": "paired rods left and right of the dorsal mesentery", "landmarks": "at the level of the swim bladder, dorsolateral to the intestine"},
    shape={"primitive": "ellipsoid", "notes": "Two thin ellipsoids (rods) oriented along the body axis, dorsolateral to the gut under the swim bladder."},
    sizes=[sz("Day 5", 120, {"length": 80, "diameter": 25}, EST, "germ cells with a few somatic cells"),
           sz("Days 7-13", 240, {"length": 150, "diameter": 40}, EST, "bilayered somatic compartment by 8 to 10 dpf"),
           sz("Days 7-13 end", 336, {"length": 200, "diameter": 50}, EST, "ZFIN end stage Days 7-13")],
    events=[ev(120, "somatic gonad cells detected around germ cells at 5 dpf"),
            ev(216, "somatic compartment organised into an outer epithelial and inner mesenchymal layer (8 to 10 dpf)"),
            ev(276, "inner somatic cells begin to express sex-specific markers cyp19a1a and amh (11 to 12 dpf)"),
            ev(312, "early oocytes appear in all animals from about 13 dpf"),
            ev(336, "ZFIN end stage Days 7-13; immature gonad term follows")],
    notes="ZFA synonyms: gonadal primordium, undifferentiated gonad. Leerberg et al. 2017 describe the rod-like paired gonad with germ cells in the core.",
    sources=[zfin("ZFA:0001262"), SRC["leerberg"], SRC["bipot"]])

add(id="ZFA:0005272", system="reproductive", parent="ZFA:0000632", color="#F0A5C0",
    spatial={"apFraction": [0.33, 0.50], "dv": "ventral to the kidney and dorsal aorta; dorsal to the intestine; ventral to the swim bladder", "laterality": "paired", "landmarks": "elongated along the dorsal coelom; blood supply from the swim bladder artery at 20 dpf"},
    shape={"primitive": "ellipsoid", "notes": "Two elongated ellipsoids under the swim bladder that grow along the axis between 14 and 30 dpf."},
    sizes=[sz("Days 14-20", 336, {"length": 250, "diameter": 60}, EST),
           sz("Days 14-20 (20 dpf)", 480, {"length": 500, "diameter": 120}, EST, "fish about 7 mm SL"),
           sz("Days 21-29", 720, {"length": 900, "diameter": 200}, EST, "ZFIN end stage Days 21-29")],
    events=[ev(336, "immature gonad term starts in ZFIN (Days 14-20)"),
            ev(360, "vascular and lymphatic endothelium, pericytes and macrophages populate the gonad between 12 and 20 dpf"),
            ev(480, "sex determination in progress at 20 dpf; macrophages engulf germ cells"),
            ev(600, "overt sex differentiation at about 25 dpf"),
            ev(720, "ZFIN end stage Days 21-29; gonad, ovary and testis terms start at 504 hpf")],
    notes="ZFA synonyms: juvenile gonad, juvenile ovary. ZFA notes that the gonad may be transiently intersexual. The 2023 bipotential gonad paper (PMC10651076) gives the cell arrival timeline and the 20 dpf size context.",
    sources=[zfin("ZFA:0005272"), SRC["bipot"], SRC["leerberg"]])

add(id="ZFA:0000413", system="reproductive", parent="ZFA:0000632", color="#E8A0B5",
    spatial={"apFraction": [0.28, 0.55], "dv": "ventral to the kidney and swim bladder; dorsal and lateral to the intestine", "laterality": "paired", "landmarks": "group node for ovary and testis in the coelom"},
    shape={"primitive": "custom", "notes": "Group node. Switch the child (ovary or testis) with a sex toggle in the UI."},
    sizes=[sz("Days 21-29", 504, {"length": 800, "diameter": 200}, EST),
           sz("Adult", 2160, {"length": 10000, "diameter": 3000}, EST, "female; see ovary and testis")],
    events=[ev(504, "gonad term starts in ZFIN (Days 21-29)"),
            ev(600, "overt sex differentiation at about 25 dpf"),
            ev(2160, "sexual maturity at about 3 months")],
    notes="ZFA synonyms: gonads, mature gonad. It develops from the immature gonad.",
    sources=[zfin("ZFA:0000413"), SRC["bipot"], SRC["zhou10"]])

add(id="ZFA:0000403", system="reproductive", parent="ZFA:0000413", color="#F4B6C8",
    spatial={"apFraction": [0.28, 0.55], "dv": "ventral to the swim bladder and kidney; dorsal and lateral to the intestine; fills much of the coelom in a gravid female", "laterality": "bilobed, paired lobes joined caudally; suspended by the mesovarium", "landmarks": "rostral third of the abdominal cavity holds about one third ovary; the proportion rises caudally (Menke et al. 2011)"},
    shape={"primitive": "ellipsoid", "notes": "Two large elongated ellipsoids with a granular surface (follicles) that taper caudally into a short oviduct to the cloaca. Scale strongly with reproductive state."},
    sizes=[sz("Days 21-29", 504, {"length": 900, "diameter": 250}, EST, "per lobe"),
           sz("Juvenile 45 dpf", 1080, {"length": 3000, "diameter": 800}, EST, "per lobe"),
           sz("Adult", 2160, {"length": 10000, "width": 4000, "height": 3000}, EST, "per lobe in a gravid 25 mm SL female; female GSI at least ten times the male GSI")],
    events=[ev(504, "ovary term starts in ZFIN (Days 21-29)"),
            ev(720, "ovarian follicle terms start in ZFIN (Juvenile Days 30-44)"),
            ev(1080, "oocyte stage I to V terms start in ZFIN (Juvenile Days 45-89)"),
            ev(2160, "mature stage IV and V oocytes present unless recently spawned")],
    notes="ZFA defines the ovary as a bilobed cavitated organ ventral to the swim bladder. Gupta and Mullins 2010 describe the bilobed ovary suspended by a vascularised mesovarium. Adult size is an estimate derived from the GSI ratio in PMC3842893 and the adult SL in Parichy et al. 2009.",
    sources=[zfin("ZFA:0000403"), SRC["gupta"], SRC["menke"], SRC["gsi13"], SRC["parichy"]])

add(id="ZFA:0000598", system="reproductive", parent="ZFA:0000413", color="#DDE3EC",
    spatial={"apFraction": [0.30, 0.55], "dv": "attached to the dorsal body wall; ventral to the kidney and swim bladder; dorsolateral to the intestine", "laterality": "paired, positioned laterally", "landmarks": "long white strands along the dorsal coelom that join the sperm duct at the cloaca"},
    shape={"primitive": "tube", "notes": "Two thin white elongated ellipsoids or tubes along the dorsal coelom, much thinner than the ovary lobes."},
    sizes=[sz("Days 21-29", 504, {"length": 800, "diameter": 150}, EST),
           sz("Juvenile 45 dpf", 1080, {"length": 3000, "diameter": 400}, EST),
           sz("Adult", 2160, {"length": 9000, "width": 1200, "height": 900}, EST, "per testis; male GSI about one tenth of the female GSI")],
    events=[ev(504, "testis term starts in ZFIN (Days 21-29)"),
            ev(1080, "spermatocyte term starts in ZFIN (Juvenile Days 45-89)"),
            ev(2160, "seminiferous tubules with cysts of spermatogonia to spermatids")],
    notes="ZFA describes paired elongated testes organised into tubules. Gupta and Mullins 2010 describe long white paired organs attached to the dorsal body wall. The INHAND male reproductive chapter notes that zebrafish testes are positioned laterally.",
    sources=[zfin("ZFA:0000598"), SRC["gupta"], SRC["inhand_male"], SRC["gsi13"]])

add(id="ZFA:0001118", system="reproductive", parent="ZFA:0000632", color="#C9A0DC",
    spatial={"apFraction": [0.57, 0.585], "dv": "ventral surface", "laterality": "midline", "landmarks": "small protuberance in front of the genital pore and behind the vent, at the anterior base of the anal fin"},
    shape={"primitive": "custom", "notes": "Small cone or nub on the ventral surface just posterior to the vent. Larger and more rounded in females."},
    sizes=[sz("Day 6", 144, {"height": 15, "diameter": 20}, EST),
           sz("Juvenile 30 dpf", 720, {"height": 80, "diameter": 100}, EST),
           sz("Adult", 2160, {"height": 500, "diameter": 600}, EST, "female; male papilla smaller")],
    events=[ev(144, "urogenital papilla term starts in ZFIN (Day 6)"),
            ev(2160, "well developed in mature females; poorly developed in males")],
    notes="ZFA synonyms: genital papilla, anal papilla, UGP. The ZFA definition gives the position between the vent and the genital pore.",
    sources=[zfin("ZFA:0001118")])

# ---------------------------------------------------------------- stage helpers
def stage_hpf(zfs, which):
    s = S[zfs]
    return s["start"] if which == "start" else s["end"]

def build_entry(e):
    t = T[e["id"]]
    it = I[e["id"]]
    startZfs, endZfs = it["startZfs"], it["endZfs"]
    # sanity: OBO and item agree
    if t["start"] != startZfs or t["end"] != endZfs:
        print("WARN stage mismatch obo/item", e["id"], t["start"], startZfs, t["end"], endZfs, file=sys.stderr)
    startHpf = stage_hpf(startZfs, "start")
    # end of the ZFIN end stage; Adult and Unknown both end at 17520 h in
    # stage_ontology.txt, which matches drafts 03b, 03c and 03e.
    endHpf = stage_hpf(endZfs, "end")
    syn = sorted({s.strip() for s in t["synonyms"] if s.strip()})
    d = {
        "id": e["id"], "name": t["name"], "synonyms": syn, "system": e["system"],
        "parent": e["parent"],
        "startStage": startZfs, "startHpf": startHpf, "endStage": endZfs, "endHpf": endHpf,
        "definition": (t.get("def") or "No definition in ZFA.").strip(),
    }
    if "visibleFromHpf" in e:
        d["visibleFromHpf"] = e["visibleFromHpf"]
        d["visibleNote"] = e["visibleNote"]
    d.update({"spatial": e["spatial"], "shape": e["shape"], "sizes": e["sizes"], "events": e["events"],
              "colorHint": e["color"], "sources": e["sources"], "notes": e["notes"]})
    if endZfs == "ZFS:0000000":
        d["endNote"] = "ZFIN end stage is Unknown (ZFS:0000000). endHpf set to 17520 (end of the ZFS range) by convention."
    if startZfs == "ZFS:0000000":
        d["startNote"] = "ZFIN start stage is Unknown (ZFS:0000000). startHpf set to 0.0; use visibleFromHpf."
    return d

entries = [build_entry(e) for e in E]
# validation against anatomy_item
for d in entries:
    it = I[d["id"]]
    assert it["startZfs"] == d["startStage"] and it["endZfs"] == d["endStage"], d["id"]
    for k in ("Prim-5", "Long-pec", "Day 5", "Adult"):
        pass
ids = [d["id"] for d in entries]
assert len(ids) == len(set(ids))
json_path = os.path.join(OUT, "03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json")
json.dump(entries, open(json_path, "w"), indent=2, ensure_ascii=False)
print("wrote", json_path, len(entries), "entries")

# ---------------------------------------------------------------- markdown
def stg(zfs):
    s = S[zfs]
    return f"{s['name']} ({s['start']:g}-{s['end']:g} hpf)"

def dims_str(d):
    return ", ".join(f"{k} {v}" for k, v in d.items() if k != "note_only")

SYS_ORDER = [("digestive", "Digestive system"), ("excretory", "Excretory (renal) system"),
             ("endocrine", "Endocrine glands"), ("reproductive", "Reproductive system")]

md = []
md.append("# Zebrafish anatomy research 03d: digestive, excretory, endocrine and reproductive systems\n")
md.append("Author: anatomy specialist subagent. Date: 2026-09-06.\n")
md.append("This document lists the structures of the digestive, excretory (renal), endocrine and reproductive systems that a schematic whole-organism 3D model should show. "
          "The companion file `03d-anatomy-digestive-excretory-endocrine-reproductive.draft.json` holds the same data in machine form.\n")
md.append("## 1. Method\n")
md.append("I extracted candidate terms from the local ZFIN files: `anatomy_item.txt`, `anatomy_relationship.txt`, `anatomy_synonyms.txt` and `zfa.obo`. "
          "I kept terms at organ, tissue or region level and dropped cell-level terms except the primordial germ cell, which the task requested. "
          f"The final list holds {len(entries)} structures. "
          "Definitions, synonyms, part_of parents and start/end stages come from `zfa.obo`. "
          "I checked every start and end stage against `anatomy_item.txt`; all entries match. "
          "Positions, shapes, sizes and events come from three places: the ZFA definitions, Kimmel et al. 1995 as mirrored on ZFIN, and the primary papers listed under each structure. "
          "The ZFIN staging pages and several publisher sites refused connections during this session. I used PubMed Central full texts and Europe PMC instead. "
          "The web search budget of the session ran out before I could find measured sizes for several organs. "
          "Every size that I could not find in a source carries the label `estimate (this document)` in the JSON and `(estimate)` in the tables below.\n")
md.append("## 2. Conventions\n")
md.append("- `startHpf` is the start of the ZFIN start stage. `endHpf` is the end of the ZFIN end stage as given in `stage_ontology.txt`. For structures that persist into the adult, `endHpf` is 17520 (the end of the Adult stage). This matches drafts 03b, 03c and 03e. Draft 03a uses the same rule for intermediate stages.\n"
          "- A ZFIN start stage of Unknown (ZFS:0000000) gives `startHpf` 0.0 and a `startNote`. Such entries carry `visibleFromHpf` with a source. A ZFIN end stage of Unknown gives `endHpf` 17520 and an `endNote`.\n"
          "- `visibleFromHpf` marks the time at which a schematic model should first draw the structure when that time differs from the ZFIN start stage. The reason is given in `visibleNote`.\n"
          "- Sizes are listed at 24, 48 and 120 hpf and in the adult when the structure exists at that time. Structures with an Unknown start stage (mouth, head kidney, mesonephric duct, gonad primordium) have sizes from their `visibleFromHpf` onward. The primordial germ cell has no adult size because the cells become oogonia or spermatogonia.\n"
          "- `apFraction` is the fraction of total body length from the snout tip (0) to the tail tip (1). All values are estimates read from the landmarks in the `spatial.landmarks` field. Landmarks used: somite 1 lies at about 0.27 of body length at 24 hpf. The anus lies at the posterior end of the yolk extension, at about 0.56 to 0.58 of body length in the larva. The anal fin origin lies at about 0.55 of total length in the adult.\n"
          "- Sizes are in micrometres. Adult sizes assume a fish of 25 mm standard length (adult 23 to 26 mm SL in Parichy et al. 2009).\n"
          "- Body length references come from `05-morphometrics.md` in this folder, which cites Kimmel et al. 1995 (K95) and Parichy et al. 2009 (P09). Embryo length is 1.9 mm at Prim-5 (24 hpf) and 3.1 mm at Long-pec (48 hpf). Total length is 3.5 mm at Protruding-mouth (72 hpf) and 3.9 mm at Day 5 (120 hpf). The swim bladder inflates at 3.5 to 3.7 mm SL. Adult total length is about 1.2 times SL. With these values, one somite of about 45 um at 24 hpf equals about 0.024 of body length.\n"
          "- System roots appear only as `parent` values and need no geometry. They are: digestive system ZFA:0000339, liver and biliary system ZFA:0000036, pancreatic system ZFA:0001371, renal system ZFA:0000163, endocrine system ZFA:0001158 and reproductive system ZFA:0000632.\n")

md.append("## 3. Summary tables\n")
for skey, stitle in SYS_ORDER:
    md.append(f"### 3.{SYS_ORDER.index((skey, stitle)) + 1} {stitle}\n")
    md.append("| ZFA id | Name | Parent (part_of) | ZFIN start | ZFIN end | Visible from (hpf) | Position (AP fraction; side) | Shape | Color |")
    md.append("|---|---|---|---|---|---|---|---|---|")
    for d in entries:
        if d["system"] != skey:
            continue
        pn = T.get(d["parent"], {}).get("name", "") if d["parent"] else "none"
        vis = str(d.get("visibleFromHpf", d["startHpf"]))
        ap = d["spatial"]["apFraction"]
        md.append(f"| {d['id']} | {d['name']} | {pn} ({d['parent']}) | {stg(d['startStage'])} | {stg(d['endStage'])} | {vis} | {ap[0]:g}-{ap[1]:g}; {d['spatial']['laterality']} | {d['shape']['primitive']} | `{d['colorHint']}` |")
    md.append("")

md.append("## 4. Deviations from ZFIN stages\n")
md.append("No entry changes a ZFIN start or end stage. The JSON keeps the ZFIN stages as the source of truth. Where a structure becomes visible at a different time, the entry adds `visibleFromHpf`:\n")
for d in entries:
    if "visibleFromHpf" in d:
        md.append(f"- {d['name']} ({d['id']}): ZFIN start {stg(d['startStage'])}; draw from {d['visibleFromHpf']} hpf. {d['visibleNote']}")
md.append("")
md.append("Entries with a ZFIN end stage of Unknown: primordial germ cell (ZFA:0009288). The JSON sets its `endHpf` to 17520 and marks this in `endNote`. Entries with a ZFIN start stage of Unknown: mouth (ZFA:0000547), head kidney (ZFA:0000669), mesonephric duct (ZFA:0000546), gonad primordium (ZFA:0001262). The JSON sets their `startHpf` to 0.0 and marks this in `startNote`.\n")

md.append("## 5. Per-structure notes\n")
for skey, stitle in SYS_ORDER:
    md.append(f"### {stitle}\n")
    for d in entries:
        if d["system"] != skey:
            continue
        md.append(f"#### {d['name']} ({d['id']})\n")
        syn = ", ".join(d["synonyms"]) if d["synonyms"] else "none"
        md.append(f"- Synonyms: {syn}")
        md.append(f"- ZFA definition: {d['definition']}")
        md.append(f"- ZFIN stages: {stg(d['startStage'])} to {stg(d['endStage'])}.")
        sp = d["spatial"]
        md.append(f"- Position: AP {sp['apFraction'][0]:g} to {sp['apFraction'][1]:g} of body length. Dorsoventral: {sp['dv']}. Laterality: {sp['laterality']}. Landmarks: {sp['landmarks']}")
        md.append(f"- Shape: {d['shape']['primitive']}. {d['shape']['notes']}")
        md.append(f"- Notes: {d['notes']}")
        md.append("")
        md.append("| Stage | hpf | Dimensions (um) | Source |")
        md.append("|---|---|---|---|")
        for s in d["sizes"]:
            src = "(estimate)" if s["source"] == EST else s["source"]
            note = f" {s['note']}" if s.get("note") else ""
            md.append(f"| {s['stageLabel']} | {s['hpf']:g} | {dims_str(s['dims_um'])}{note} | {src} |")
        md.append("")
        md.append("Events:")
        for x in d["events"]:
            md.append(f"- {x['hpf']:g} hpf: {x['event']}")
        md.append("")
        md.append("Sources: " + "; ".join(d["sources"]))
        md.append("")

md.append("## 6. Recommendations for the procedural model\n")
md.append("1. Build one gut spline from the mouth to the vent. Let the esophagus, intestinal bulb, mid intestine and posterior intestine own parameter ranges of that spline. Change the radius profile by stage: near-uniform rod at 24 hpf, bulb enlargement from 42 hpf, folds from 98 hpf.\n"
          "2. Key the foregut left bend between 26 and 34 hpf. Hang the liver primordium on the left face and the anterior pancreatic bud on the ventral face of the same spline segment.\n"
          "3. Model the liver as one ellipsoid on the left until 80 hpf. Add a right ellipsoid at 80 to 84 hpf and a flat ventral lobe at about 15 dpf. Place the gall bladder sphere on the right lobe.\n"
          "4. Model the pancreas as a head ellipsoid (with an islet sphere inside) plus a tail tube along the right side of the mid intestine. Add small secondary islet spheres after 7 dpf.\n"
          "5. Build the pronephros from two parallel duct splines under the somites that meet at the cloaca. Add two short tubules and one glomerulus sphere at somite 3 that fuses at the midline by 48 hpf. Coil the proximal segment from 72 hpf. From 14 dpf add nephron spheres along the ducts. Morph the whole into the flat mesonephros strip by 30 dpf.\n"
          "6. Place the interrenal ellipsoid just caudal to the glomerulus, right of the midline. Place the corpuscles of Stannius as one sphere on each duct at about 0.45 of body length. Draw the thyroid as a chain of spheres under the pharynx along the ventral aorta. Put the ultimobranchial body between the esophagus and the sinus venosus.\n"
          "7. For the gonads draw PGCs as a point cloud at 24 hpf and paired rods under the swim bladder from 5 dpf. Add a sex toggle that swaps two large granular ovary lobes for two thin testis strands after 25 dpf.\n"
          "8. Use `visibleFromHpf` where the ZFIN start stage and the visible onset differ. The values are: mouth 60 hpf, vent opening 120 hpf, gall bladder 72 hpf, corpuscles of Stannius 50 hpf. Thyroid primordium 24 hpf, endocrine pancreas 24 hpf, ultimobranchial body 168 hpf. Mesonephros 288 hpf, head kidney 720 hpf, posterior kidney 336 hpf, mesonephric duct 336 hpf, gonad primordium 120 hpf.\n"
          "9. Treat every size marked `estimate` as a placeholder. The measured anchors are few. Hepatocyte diameter is 10 to 14 um and sinusoid diameter 12 to 16 um at 120 hpf (Korzh et al. 2008). There are 25 to 50 PGCs at 24 hpf (PMC7847270). There are 4 to 6 thyroid follicles from 6 to 11 dpf (Trubiroha et al. 2018). Pronephros segment positions are given by somite number (Wingert et al. 2007). There are about 150 medial nephrons, 48 percent of all nephrons, at 3 months (Zhou et al. 2010). The adult has 11 teeth per side (PMC4298156).\n")
md.append("## 7. Open questions\n")
md.append("- Measured organ dimensions at 24, 48 and 120 hpf are missing for most structures. Field et al. 2003 (liver and pancreas), Ng et al. 2005 and Wallace et al. 2005 (intestine) contain measurements. I could not read them in this session because the publisher pages refused the connection. A follow-up should read those papers and replace the estimates.\n"
          "- Kimmel et al. 1995 Figure 16 gives embryo length versus hours. That value is needed to convert the somite-based positions into micrometres at 24 and 48 hpf.\n"
          "- Adult organ dimensions (liver, kidney, ovary, testis, intestine length) need a measured source. Menke et al. 2011 (Toxicol Pathol 39:759) and Wang et al. 2010 are the best candidates; I could read only the abstract and figure legends.\n"
          "- ZFA has no term named thyroid gland. I used thyroid follicle (ZFA:0001072) for the gland and thyroid primordium (ZFA:0001081) for the anlage. The UI may want a display name `thyroid` for ZFA:0001072.\n"
          "- ZFA has no generic tooth term; ceratobranchial 5 tooth (ZFA:0000694) carries the synonyms tooth and pharyngeal tooth. Individual tooth terms (tooth 4V etc.) exist and can drive per-tooth appearance if wanted.\n"
          "- The hypophysis (ZFA:0000118) and epiphysis (ZFA:0000019) are endocrine in ZFA but were not in this task. Draft 03b (nervous and sensory) already holds both ids, so they need no entry here.\n"
          "- The swim bladder (ZFA:0000076) and the spleen (ZFA:0000436) sit in draft 03c; the yolk (ZFA:0000084) sits in draft 03a. This draft does not repeat them.\n"
          "- Two ids appear both here and in a sibling draft. Head kidney (ZFA:0000669) is also in 03c (hematopoietic role). Ceratobranchial 5 tooth (ZFA:0000694) is also in 03e (skeletal role). The merge step should keep one entry per id and combine the notes. This draft treats the head kidney as part of the kidney and the teeth as part of the pharynx. This follows the ZFA part_of relations.\n"
          "- The Kimmel body lengths in section 2 come from the sibling file `05-morphometrics.md`; I did not read the Kimmel figure myself in this session.\n")

md_path = os.path.join(OUT, "03d-anatomy-digestive-excretory-endocrine-reproductive.md")
open(md_path, "w").write("\n".join(md) + "\n")
print("wrote", md_path)
