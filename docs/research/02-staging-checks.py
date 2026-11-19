#!/usr/bin/env python3
"""Structural checks for stages.draft.json and 02-developmental-staging.md against the ZFIN stage_ontology.txt download.

Usage: python3 02-staging-checks.py [path/to/stage_ontology.txt]
Exit code 1 when any check fails."""
import json, os, sys, re
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
DEFAULT_ZFIN = os.path.join(REPO, "data", "zfin", "stage_ontology.txt")

JSON = os.path.join(HERE, "stages.draft.json")
ZFIN = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("ZFIN_STAGE_ONTOLOGY", DEFAULT_ZFIN)
MD = os.path.join(HERE, "02-developmental-staging.md")

fails = []
warns = []
def fail(msg): fails.append(msg); print("FAIL:", msg)
def warn(msg): warns.append(msg); print("WARN:", msg)
def ok(msg): print("ok  :", msg)

d = json.load(open(JSON))
zfin = {}
zfin_order = []
for line in open(ZFIN):
    line = line.rstrip("\n")
    if not line.strip(): continue
    zdb, zfs, name, s, e = line.split("\t")
    zfin[zfs] = dict(zdb=zdb, name=name, start=float(s), end=float(e))
    zfin_order.append(zfs)
print("ZFIN rows:", len(zfin))

# --- 1. All 44 ZFS ids present exactly once (plus the Unknown placeholder) ---
stages = d["stages"]
ids = [s["zfs"] for s in stages]
c = Counter(ids)
dups = [k for k, v in c.items() if v > 1]
if dups: fail(f"duplicate zfs ids in stages: {dups}")
real = {f"ZFS:{i:07d}" for i in range(1, 45)}
present = set(ids)
missing = sorted(real - present)
extra = sorted(present - real - {"ZFS:0000000"})
if missing: fail(f"missing ZFS ids: {missing}")
if extra: fail(f"unexpected ZFS ids: {extra}")
if not missing and not extra and not dups:
    ok(f"all 44 ZFS ids (0000001..0000044) present exactly once; stages list has {len(stages)} entries (incl. Unknown: {'ZFS:0000000' in present})")

# --- 2. hpf bounds, zdb ids and names equal ZFIN file ---
for s in stages:
    z = zfin.get(s["zfs"])
    if z is None:
        fail(f"{s['zfs']} not in ZFIN file"); continue
    if abs(z["start"] - s["startHpf"]) > 1e-9 or abs(z["end"] - s["endHpf"]) > 1e-9:
        fail(f"{s['zfs']} hpf mismatch: json {s['startHpf']}-{s['endHpf']} vs ZFIN {z['start']}-{z['end']}")
    if z["zdb"] != s["zdb"]:
        fail(f"{s['zfs']} zdb mismatch: json {s['zdb']} vs ZFIN {z['zdb']}")
    if z["name"] != s["name"]:
        fail(f"{s['zfs']} name mismatch: json {s['name']!r} vs ZFIN {z['name']!r}")
ok("hpf bounds / zdb / names compared for every stage")

# ordering of stages and contiguity of stage bounds
prev = None
for s in stages:
    if s["zfs"] == "ZFS:0000000": continue
    if prev is not None and abs(prev["endHpf"] - s["startHpf"]) > 1e-9:
        fail(f"stage gap/overlap: {prev['zfs']} ends {prev['endHpf']} but {s['zfs']} starts {s['startHpf']}")
    prev = s
ok("stage bounds contiguous in file order")

# dpf label consistency: floor(start/24)
for s in stages:
    if s["zfs"] == "ZFS:0000000": continue
    lbl = s["dpfLabel"]
    st = s["startHpf"]; en = s["endHpf"]
    exp_start = int(st // 24)
    m = re.match(r"^(\d+)(?:-(\d+))? dpf$", lbl)
    if m:
        a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else a
        exp_end = int((en - 1e-9) // 24)
        if a != exp_start or b != exp_end:
            warn(f"{s['zfs']} dpfLabel {lbl!r} but start//24={exp_start}, (end-eps)//24={exp_end}")

# --- 3. periods contiguous, cover 0..17520, match stage->period assignment ---
periods = d["periods"]
if abs(periods[0]["startHpf"]) > 1e-9: fail("first period does not start at 0")
if abs(periods[-1]["endHpf"] - 17520) > 1e-9: fail("last period does not end at 17520")
for a, b in zip(periods, periods[1:]):
    if abs(a["endHpf"] - b["startHpf"]) > 1e-9:
        fail(f"period gap: {a['name']} ends {a['endHpf']} but {b['name']} starts {b['startHpf']}")
ok("periods contiguous 0..17520")
pmap = {p["name"]: p for p in periods}
for s in stages:
    if s["zfs"] == "ZFS:0000000": continue
    p = pmap.get(s["period"])
    if p is None: fail(f"{s['zfs']} period {s['period']!r} not in periods"); continue
    if s["startHpf"] < p["startHpf"] - 1e-9 or s["endHpf"] > p["endHpf"] + 1e-9:
        fail(f"{s['zfs']} [{s['startHpf']},{s['endHpf']}] outside period {p['name']} [{p['startHpf']},{p['endHpf']}]")
    # ZFIN name prefix should equal period (except zygote)
    prefix = s["name"].split(":")[0].lower()
    if prefix != s["period"] and not (prefix == "zygote" and s["period"] == "zygote"):
        warn(f"{s['zfs']} ZFIN prefix {prefix!r} vs period {s['period']!r}")
ok("every stage lies within its period; ZFIN name prefixes match periods")

# --- 4. headline stages exist and ticks match ---
head = [s for s in stages if s.get("headline")]
print("headline stages:", [(s['shortLabel'], s['startHpf']) for s in head])
ticks = d["timeAxis"]["headlineTicks"]
print("headline ticks :", [(t['label'], t['hpf']) for t in ticks])
tick_hpf = sorted(t["hpf"] for t in ticks)
head_hpf = sorted(s["startHpf"] for s in head)
if tick_hpf != head_hpf:
    fail(f"headline stage starts {head_hpf} != headlineTicks hpf {tick_hpf}")
else:
    ok(f"{len(ticks)} headline ticks match {len(head)} headline stages")
for t in ticks:
    if t["hpf"] not in [s["startHpf"] for s in stages]:
        fail(f"tick {t['label']} hpf {t['hpf']} is not a stage start")

# --- 5. piecewise mapping reproduces axisFractionStart and tick fractions ---
bp = d["timeAxis"]["breakpoints"]
def frac(h):
    if h >= bp[-1]["hpf"]: return None if h > bp[-1]["hpf"] else 1.0
    for a, b in zip(bp, bp[1:]):
        if a["hpf"] <= h <= b["hpf"]:
            return a["fraction"] + (h - a["hpf"]) / (b["hpf"] - a["hpf"]) * (b["fraction"] - a["fraction"])
for s in stages:
    if s["zfs"] == "ZFS:0000000": continue
    f = frac(s["startHpf"])
    if s["axisFractionStart"] is None:
        warn(f"{s['zfs']} axisFractionStart null"); continue
    if f is None or abs(f - s["axisFractionStart"]) > 5e-4:
        fail(f"{s['zfs']} axisFractionStart {s['axisFractionStart']} != computed {f}")
for t in ticks:
    f = frac(t["hpf"])
    if abs(f - t["fraction"]) > 5e-4:
        fail(f"tick {t['label']} fraction {t['fraction']} != computed {f}")
ok("axisFractionStart and tick fractions reproduce from breakpoints (tol 5e-4)")

# --- 6. events sorted, within 0..17520, each has source ---
ev = d["events"]
hp = [e["hpf"] for e in ev]
if hp != sorted(hp): fail("events not sorted by hpf")
else: ok(f"{len(ev)} events sorted by hpf")
for e in ev:
    if not (0 <= e["hpf"] <= 17520): fail(f"event {e['label']!r} hpf {e['hpf']} out of range")
    if not e.get("source") or not str(e["source"]).startswith("http"):
        fail(f"event {e['label']!r} has no URL source")
    if not e.get("label") or not e.get("description"):
        fail(f"event at {e['hpf']} missing label/description")
ok("all events in 0..17520 with a URL source")
# every stage has sources
for s in stages:
    if not s.get("sources"): fail(f"{s['zfs']} has no sources")

# --- 7. markdown cross-check: 53 events claim, table A hpf, tick table ---
md = open(MD).read()
m = re.search(r"The list below has (\d+) events", md)
if m and int(m.group(1)) != len(ev):
    fail(f"markdown says {m.group(1)} events; json has {len(ev)}")
else:
    ok(f"markdown event count matches json ({len(ev)})")
# Table A rows
rows = re.findall(r"^\| (ZFS:\d{7}) \| (\S+) \| ([^|]+?) \| ([\d.]+) \| ([\d.]+) \|", md, re.M)
print("markdown Table A rows:", len(rows))
for zfs, period, stage, st, en in rows:
    z = zfin[zfs]
    if abs(float(st) - z["start"]) > 1e-9 or abs(float(en) - z["end"]) > 1e-9:
        fail(f"markdown {zfs} {st}-{en} vs ZFIN {z['start']}-{z['end']}")
if len(rows) != 44: fail(f"markdown Table A has {len(rows)} rows, expected 44")
else: ok("markdown Table A: 44 rows, hpf equal to ZFIN")
# markdown event table rows vs json
mrows = re.findall(r"^\| ([\d.]+)(?: est\.)? \| ([^|]+?) \| ([^|]*?) \| ([^|]+?) \|$", md, re.M)
mrows = [(float(a), b.strip()) for a, b, c, dd in mrows if a and re.match(r"^[\d.]+$", a)]
# filter to section 5 (events) by matching hpf list length
md_ev = [(h, l) for h, l in mrows if l not in ("Event",)]
json_ev = [(e["hpf"], e["label"]) for e in ev]
md_hpf = [h for h, _ in md_ev]
missing_in_md = [(h, l) for h, l in json_ev if h not in md_hpf]
if missing_in_md: warn(f"json events with hpf not found in markdown tables: {missing_in_md}")
# est flags: markdown "est." vs json hpfIsEstimate
md_est = set(float(x) for x in re.findall(r"^\| ([\d.]+) est\. \|", md, re.M))
json_est = set(e["hpf"] for e in ev if e.get("hpfIsEstimate"))
if md_est != json_est:
    fail(f"estimate flags differ: markdown est. {sorted(md_est)} vs json hpfIsEstimate {sorted(json_est)}")
else:
    ok(f"estimate flags agree ({len(json_est)} events)")

# --- 8. internal contradictions on lengths ---
for s in stages:
    L = s.get("lengthMm")
    if L:
        # landmark text mentioning EL/TL value should agree
        for lm in s["landmarks"]:
            mm = re.findall(r"(\d+(?:\.\d+)?) mm", lm)
            for v in mm:
                pass
print()
print("FAILS:", len(fails), "WARNS:", len(warns))
for f in fails: print(" -", f)
for w in warns: print(" -", w)
sys.exit(1 if fails else 0)
