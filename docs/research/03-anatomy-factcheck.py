#!/usr/bin/env python3
"""Adversarial checks for the five anatomy drafts docs/research/03*.draft.json.

Run: python3 03-anatomy-factcheck.py [--zfin-dir DIR] [--out PREFIX]
Reads the ZFIN downloads (anatomy_item.txt, anatomy_relationship.txt,
anatomy_synonyms.txt, stage_ontology.txt) and the five drafts. Writes
<PREFIX>.json (machine readable findings) and <PREFIX>.md (human report).
Does not edit the drafts. Python 3.6+, standard library only.
"""
import argparse
import collections
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
DEFAULT_ZFIN = os.path.join(REPO, 'data', 'zfin')

# The 15 values that all five draft writers used ("the fixed list from the task").
ALLOWED_SYSTEMS = {
    'nervous', 'sensory', 'cardiovascular', 'hematopoietic_immune', 'respiratory',
    'digestive', 'excretory', 'endocrine', 'reproductive', 'skeletal', 'muscular',
    'fins', 'integument_pigment', 'extraembryonic', 'axial',
}
# Names the design brief (07) uses for its 15 palette slots, for the reconciliation note.
BRIEF_SYSTEMS = {
    'nervous', 'sensory', 'cardiovascular', 'hematopoietic', 'musculature', 'skeletal',
    'integument', 'digestive', 'respiratory', 'renal', 'reproductive', 'endocrine',
    'immune', 'fins', 'yolk',
}
REQUIRED_KEYS = ['id', 'name', 'synonyms', 'system', 'parent', 'startStage', 'startHpf',
                 'endStage', 'endHpf', 'definition', 'spatial', 'shape', 'sizes', 'events',
                 'colorHint', 'sources']
REQUIRED_SPATIAL = ['apFraction', 'dv', 'laterality', 'landmarks']
REQUIRED_SHAPE = ['primitive', 'notes']
ALLOWED_PRIMITIVES = {'ellipsoid', 'sphere', 'tube', 'lathe', 'segmentArray', 'sheet', 'fin', 'custom'}
# Checkpoints: (label, hpf, accepted keyframe window)
CHECKPOINTS = [('24 hpf', 24.0, (22.0, 30.0)), ('48 hpf', 48.0, (42.0, 60.0)),
               ('120 hpf', 120.0, (96.0, 144.0)), ('adult', 2160.0, (2160.0, 1e9))]
HPF_TOL = 0.05


def load_zfin(zdir):
    stages = {}       # ZFS id -> dict(zdb, name, start, end)
    zdb2zfs = {}
    for line in open(os.path.join(zdir, 'stage_ontology.txt')):
        p = line.rstrip('\n').split('\t')
        if len(p) < 5:
            continue
        stages[p[1]] = dict(zdb=p[0], zfs=p[1], name=p[2], start=float(p[3]), end=float(p[4]))
        zdb2zfs[p[0]] = p[1]
    items = {}
    for line in open(os.path.join(zdir, 'anatomy_item.txt')):
        p = line.rstrip('\n').split('\t')
        if len(p) < 4:
            continue
        items[p[0]] = dict(name=p[1], startZdb=p[2], endZdb=p[3],
                           startZfs=zdb2zfs.get(p[2]), endZfs=zdb2zfs.get(p[3]))
    syn = collections.defaultdict(set)
    for line in open(os.path.join(zdir, 'anatomy_synonyms.txt')):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 3:
            syn[p[0]].add(p[2].strip().lower())
    # anatomy_relationship.txt columns are: parent id, child id, relation
    # (verified: 'ZFA:0000077<tab>ZFA:0000001<tab>part of' matches OBO 'ZFA:0000001 part_of ZFA:0000077 tail bud').
    rel = collections.defaultdict(list)   # child -> [(parent, relation)]
    for line in open(os.path.join(zdir, 'anatomy_relationship.txt')):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 3:
            rel[p[1]].append((p[0], p[2]))
    return stages, items, syn, rel


def find_path(rel, child, target, allowed, limit=40):
    """BFS over allowed relation types from child up to target. Returns list of ids or None."""
    if child == target:
        return [child]
    seen = {child}
    frontier = [[child]]
    while frontier and len(frontier[0]) < limit:
        nxt = []
        for path in frontier:
            for parent, r in rel.get(path[-1], []):
                if r not in allowed or parent in seen:
                    continue
                seen.add(parent)
                if parent == target:
                    return path + [parent]
                nxt.append(path + [parent])
        frontier = nxt
    return None


def approx(a, b, tol=HPF_TOL):
    try:
        return abs(float(a) - float(b)) <= tol
    except (TypeError, ValueError):
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zfin-dir', default=DEFAULT_ZFIN)
    ap.add_argument('--out', default=os.path.join(HERE, '03-anatomy-factcheck-report'))
    ap.add_argument('--drafts', nargs='*', default=sorted(glob.glob(os.path.join(HERE, '03*.draft.json'))))
    args = ap.parse_args()

    stages, items, syn, rel = load_zfin(args.zfin_dir)
    findings = []

    def add(check, sev, fil, sid, name, issue, evidence, correct=None):
        findings.append(dict(check=check, severity=sev, file=os.path.basename(fil), id=sid,
                             name=name, issue=issue, evidence=evidence, correct=correct))

    drafts = {}
    for f in args.drafts:
        try:
            with open(f) as fh:
                d = json.load(fh)
        except Exception as e:  # noqa: BLE001
            add('json', 'high', f, None, None, 'file is not valid JSON', str(e))
            continue
        if not isinstance(d, list):
            add('json', 'high', f, None, None, 'top level is not a list', type(d).__name__)
            continue
        drafts[f] = d

    # ---- duplicate ids across files
    seen = collections.defaultdict(list)
    for f, d in drafts.items():
        for e in d:
            seen[e.get('id')].append(os.path.basename(f))
    for sid, fl in seen.items():
        if len(fl) > 1:
            add('duplicate-id', 'medium', ' + '.join(sorted(set(fl))), sid, None,
                'id appears in more than one draft', 'files: %s' % ', '.join(fl),
                'keep one record and merge the fields')

    all_ids = set(seen)

    for f, d in drafts.items():
        for e in d:
            sid = e.get('id')
            name = e.get('name')
            # ---- required keys
            missing = [k for k in REQUIRED_KEYS if k not in e]
            if missing:
                add('required-keys', 'high', f, sid, name, 'missing required keys', ', '.join(missing))
            sp = e.get('spatial') or {}
            sh = e.get('shape') or {}
            ms = [k for k in REQUIRED_SPATIAL if k not in sp]
            if ms:
                add('required-keys', 'medium', f, sid, name, 'missing spatial keys', ', '.join(ms))
            msh = [k for k in REQUIRED_SHAPE if k not in sh]
            if msh:
                add('required-keys', 'medium', f, sid, name, 'missing shape keys', ', '.join(msh))
            if sh.get('primitive') not in ALLOWED_PRIMITIVES:
                add('primitive', 'low', f, sid, name, 'shape.primitive outside the list',
                    repr(sh.get('primitive')), 'one of %s' % sorted(ALLOWED_PRIMITIVES))
            if not isinstance(e.get('sources'), list) or not e.get('sources'):
                add('sources', 'medium', f, sid, name, 'no sources listed', repr(e.get('sources')))

            # ---- id exists, name matches
            if sid not in items:
                add('id-exists', 'high', f, sid, name, 'id not in anatomy_item.txt', 'no such row')
                continue
            zname = items[sid]['name']
            if (name or '').strip().lower() != zname.lower():
                if (name or '').strip().lower() in syn.get(sid, set()):
                    add('name', 'low', f, sid, name, 'draft name is a ZFIN synonym, not the primary label',
                        'ZFIN primary label: %s' % zname, zname)
                else:
                    add('name', 'high', f, sid, name, 'draft name does not match ZFIN label or any synonym',
                        'ZFIN primary label: %s; synonyms: %s' % (zname, sorted(syn.get(sid, set()))), zname)
            # draft synonyms that ZFIN does not list (informational)
            extra = [s for s in (e.get('synonyms') or []) if s.strip().lower() not in syn.get(sid, set())
                     and s.strip().lower() != zname.lower()]
            if extra:
                add('synonym', 'info', f, sid, name, 'synonyms not in anatomy_synonyms.txt',
                    ', '.join(extra), 'drop or mark as non-ZFIN')

            # ---- stages
            zs, ze = items[sid]['startZfs'], items[sid]['endZfs']
            has_override = bool(e.get('visibleFromHpf') is not None and (e.get('visibleFromNote') or e.get('visibleNote')))
            has_start_note = bool(e.get('startNote'))
            has_end_note = bool(e.get('endNote') or e.get('modelEndNote'))
            ds, de = e.get('startStage'), e.get('endStage')
            if ds != zs:
                sev = 'low' if (has_override or has_start_note) else 'high'
                add('startStage', sev, f, sid, name,
                    'startStage differs from ZFIN' + (' (override/note present)' if sev == 'low' else ''),
                    'draft %s (%s); ZFIN %s (%s)' % (ds, stages.get(ds, {}).get('name'), zs, stages.get(zs, {}).get('name')),
                    zs)
            if de != ze:
                sev = 'low' if (has_end_note or has_override) else 'high'
                add('endStage', sev, f, sid, name,
                    'endStage differs from ZFIN' + (' (note present)' if sev == 'low' else ''),
                    'draft %s (%s); ZFIN %s (%s)' % (de, stages.get(de, {}).get('name'), ze, stages.get(ze, {}).get('name')),
                    ze)
            # hpf must equal stage_ontology bounds of the *draft* stage (internal consistency)
            if ds in stages and not approx(e.get('startHpf'), stages[ds]['start']):
                add('startHpf', 'medium' if not has_override else 'low', f, sid, name,
                    'startHpf does not equal the start of startStage in stage_ontology.txt',
                    'draft startHpf %s; %s starts at %s' % (e.get('startHpf'), ds, stages[ds]['start']),
                    stages[ds]['start'])
            if de in stages and not approx(e.get('endHpf'), stages[de]['end']):
                add('endHpf', 'medium', f, sid, name,
                    'endHpf does not equal the end of endStage in stage_ontology.txt',
                    'draft endHpf %s; %s ends at %s' % (e.get('endHpf'), de, stages[de]['end']),
                    stages[de]['end'])
            if ds not in stages:
                add('startStage', 'high', f, sid, name, 'startStage id not in stage_ontology.txt', repr(ds))
            if de not in stages:
                add('endStage', 'high', f, sid, name, 'endStage id not in stage_ontology.txt', repr(de))
            # ZFIN "Unknown" start stage (ZFS:0000000) means no start recorded; the model needs an override
            if zs == 'ZFS:0000000' and ds == 'ZFS:0000000' and e.get('visibleFromHpf') is None:
                add('unknown-start', 'medium', f, sid, name,
                    'ZFIN start stage is Unknown (ZFS:0000000, 0 hpf); no visibleFromHpf override, so the model would show it from fertilization',
                    'ZFIN start %s' % items[sid]['startZdb'], 'add visibleFromHpf with a literature note')
            vf = e.get('visibleFromHpf')
            if vf is not None and not (e.get('visibleFromNote') or e.get('visibleNote')):
                add('override-note', 'medium', f, sid, name, 'visibleFromHpf without a note', repr(vf))
            if vf is not None and ds in stages and float(vf) < stages[ds]['start'] - HPF_TOL and zs == ds:
                add('override-earlier', 'medium', f, sid, name,
                    'visibleFromHpf is earlier than the ZFIN start stage',
                    'visibleFromHpf %s; ZFIN start %s' % (vf, stages[ds]['start']))
            me = e.get('modelEndHpf')
            if me is not None and not e.get('modelEndNote'):
                add('override-note', 'medium', f, sid, name, 'modelEndHpf without a note', repr(me))

            # ---- parent
            par = e.get('parent')
            if par is None:
                if e.get('parentRelation') not in ('root',):
                    add('parent', 'low', f, sid, name, 'parent is null and parentRelation is not root',
                        repr(e.get('parentRelation')))
            else:
                if par not in items:
                    add('parent-exists', 'high', f, sid, name, 'parent id not in anatomy_item.txt', par)
                else:
                    p1 = find_path(rel, sid, par, {'part of', 'is_a'})
                    if p1 is None:
                        p2 = find_path(rel, sid, par, {'part of', 'is_a', 'develops from',
                                                       'has developmental contribution from', 'overlaps'})
                        if p2:
                            add('parent-path', 'medium', f, sid, name,
                                'no part_of/is_a path to parent; path exists only through develops_from/overlaps',
                                'parent %s (%s); path %s' % (par, items[par]['name'], ' -> '.join(p2)),
                                'choose a part_of/is_a ancestor or label the relation developsFrom')
                        else:
                            direct = [(p, r) for p, r in rel.get(sid, []) if r in ('part of', 'is_a')]
                            add('parent-path', 'high', f, sid, name,
                                'no part_of/is_a path from id to parent in anatomy_relationship.txt',
                                'parent %s (%s); direct ZFIN parents of id: %s' % (
                                    par, items[par]['name'],
                                    ', '.join('%s %s (%s)' % (r, p, items.get(p, {}).get('name')) for p, r in direct)),
                                'use one of the direct ZFIN parents or an ancestor of them')
                    if par not in all_ids:
                        add('parent-in-atlas', 'info', f, sid, name, 'parent id is not itself a record in any draft',
                            '%s (%s)' % (par, items[par]['name']))
            for key in ('parentAll', 'zfaPartOf', 'developsFrom'):
                vals = e.get(key) or []
                if isinstance(vals, str):
                    vals = [vals]
                for p in vals:
                    if p not in items:
                        add('parent-exists', 'medium', f, sid, name, '%s id not in anatomy_item.txt' % key, p)
                    elif key in ('parentAll', 'zfaPartOf'):
                        direct = {(pp, r) for pp, r in rel.get(sid, [])}
                        if (p, 'part of') not in direct and (p, 'is_a') not in direct:
                            add('parent-path', 'low', f, sid, name,
                                '%s entry is not a direct part_of/is_a parent in ZFIN' % key,
                                '%s (%s)' % (p, items[p]['name']))
                    elif key == 'developsFrom':
                        direct = {(pp, r) for pp, r in rel.get(sid, [])}
                        if (p, 'develops from') not in direct and (p, 'has developmental contribution from') not in direct:
                            add('develops-from', 'low', f, sid, name,
                                'developsFrom entry is not a direct develops_from in ZFIN',
                                '%s (%s)' % (p, items[p]['name']))
            up = e.get('uiParent')
            if up and up not in items:
                add('parent-exists', 'medium', f, sid, name, 'uiParent id not in anatomy_item.txt', up)

            # ---- system
            if e.get('system') not in ALLOWED_SYSTEMS:
                add('system', 'high', f, sid, name, 'system value outside the allowed list',
                    repr(e.get('system')), 'one of %s' % sorted(ALLOWED_SYSTEMS))

            # ---- apFraction
            apf = sp.get('apFraction')
            def check_ap(val, label):
                if not (isinstance(val, list) and len(val) == 2):
                    add('apFraction', 'high', f, sid, name, '%s is not a 2-element list' % label, repr(val))
                    return
                a, b = val
                try:
                    a, b = float(a), float(b)
                except (TypeError, ValueError):
                    add('apFraction', 'high', f, sid, name, '%s not numeric' % label, repr(val))
                    return
                if not (0.0 <= a <= 1.0 and 0.0 <= b <= 1.0):
                    add('apFraction', 'high', f, sid, name, '%s outside 0..1' % label, repr(val))
                if a > b:
                    add('apFraction', 'high', f, sid, name, '%s inverted (start > end)' % label, repr(val))
            check_ap(apf, 'apFraction')
            abs_ = sp.get('apFractionByStage')
            if abs_ is not None:
                if isinstance(abs_, dict):
                    for k, v in abs_.items():
                        check_ap(v, 'apFractionByStage[%s]' % k)
                elif isinstance(abs_, list):
                    for i, v in enumerate(abs_):
                        rng = v.get('apFraction') if isinstance(v, dict) else v
                        check_ap(rng, 'apFractionByStage[%d]' % i)

            # ---- sizes at checkpoints
            sizes = e.get('sizes') or []
            eff_start = float(vf) if vf is not None else float(e.get('startHpf') or 0)
            eff_end = float(me) if me is not None else float(e.get('endHpf') or 0)
            zfin_start = stages[ds]['start'] if ds in stages else eff_start
            zfin_end = stages[de]['end'] if de in stages else eff_end
            render = sh.get('primitive') != 'custom' or 'grouping' not in (sh.get('notes') or '').lower()
            is_group = ('group' in (sh.get('notes') or '').lower() and 'no geometry' in (sh.get('notes') or '').lower()) \
                or ('do not render' in (sh.get('notes') or '').lower()) or ('draw no geometry' in (sh.get('notes') or '').lower())
            hpfs = []
            for s in sizes:
                try:
                    hpfs.append(float(s.get('hpf')))
                except (TypeError, ValueError):
                    add('sizes', 'medium', f, sid, name, 'size keyframe without numeric hpf', json.dumps(s)[:200])
                if not s.get('dims_um'):
                    add('sizes', 'medium', f, sid, name, 'size keyframe with empty dims_um', json.dumps(s)[:200])
                if not s.get('source'):
                    add('sizes', 'low', f, sid, name, 'size keyframe without source', json.dumps(s)[:200])
            if not sizes and not is_group:
                add('sizes-empty', 'high', f, sid, name, 'sizes list is empty for a rendered structure',
                    'exists %s-%s hpf' % (eff_start, eff_end))
            for label, t, (lo, hi) in CHECKPOINTS:
                exists_model = eff_start - HPF_TOL <= t <= eff_end + HPF_TOL
                exists_zfin = zfin_start - HPF_TOL <= t <= zfin_end + HPF_TOL
                if not exists_model:
                    continue
                if is_group:
                    continue
                if not any(lo - HPF_TOL <= h <= hi + HPF_TOL for h in hpfs):
                    sev = 'medium' if sizes else 'high'
                    add('sizes-checkpoint', sev, f, sid, name,
                        'structure exists at %s but has no size keyframe in the window %s-%s hpf' % (label, lo, hi if hi < 1e8 else 'inf'),
                        'keyframes at hpf: %s; exists %s-%s hpf%s' % (
                            sorted(hpfs), eff_start, eff_end,
                            '' if exists_zfin else ' (model override; ZFIN %s-%s)' % (zfin_start, zfin_end)),
                        'add a %s keyframe' % label)
            # keyframes outside the existence range
            for h in hpfs:
                if h < eff_start - 0.5 or h > eff_end + 0.5:
                    add('sizes-range', 'low', f, sid, name, 'size keyframe outside the structure\'s existence range',
                        'keyframe %s hpf; exists %s-%s hpf' % (h, eff_start, eff_end))
            # events outside the range (informational)
            for ev in (e.get('events') or []):
                try:
                    h = float(ev.get('hpf'))
                except (TypeError, ValueError):
                    add('events', 'low', f, sid, name, 'event without numeric hpf', json.dumps(ev)[:200])
                    continue
                if h < min(eff_start, zfin_start) - 0.5 or h > max(eff_end, zfin_end) + 0.5:
                    add('events-range', 'info', f, sid, name, 'event outside the existence range',
                        '%s hpf: %s' % (h, ev.get('event', '')[:120]))

    # ---- summary
    sev_order = {'high': 0, 'medium': 1, 'low': 2, 'info': 3}
    findings.sort(key=lambda x: (sev_order.get(x['severity'], 9), x['check'], x['file'], str(x['id'])))
    counts = collections.Counter((x['severity'], x['check']) for x in findings)
    out_json = args.out + '.json'
    with open(out_json, 'w') as fh:
        json.dump(dict(allowedSystems=sorted(ALLOWED_SYSTEMS), briefSystems=sorted(BRIEF_SYSTEMS),
                       nRecords={os.path.basename(k): len(v) for k, v in drafts.items()},
                       counts={'%s/%s' % k: v for k, v in sorted(counts.items())},
                       findings=findings), fh, indent=1)
    lines = ['# Automated check of the anatomy drafts', '',
             'Script: `03-anatomy-factcheck.py`. Inputs: five `03*.draft.json` files and the ZFIN downloads.', '',
             '## Counts', '', '| severity | check | n |', '|---|---|---|']
    for (sev, chk), n in sorted(counts.items(), key=lambda kv: (sev_order[kv[0][0]], kv[0][1])):
        lines.append('| %s | %s | %d |' % (sev, chk, n))
    lines += ['', '## Findings (high, medium, low)', '', '| severity | check | file | id | name | issue | evidence | correct value |', '|---|---|---|---|---|---|---|---|']
    for x in findings:
        if x['severity'] == 'info':
            continue
        lines.append('| %s | %s | %s | %s | %s | %s | %s | %s |' % tuple(
            str(x[k] if x[k] is not None else '').replace('|', '\\|').replace('\n', ' ')
            for k in ('severity', 'check', 'file', 'id', 'name', 'issue', 'evidence', 'correct')))
    info = [x for x in findings if x['severity'] == 'info']
    lines += ['', '## Informational (%d)' % len(info), '']
    for x in info:
        lines.append('- %s %s %s (%s): %s: %s' % (x['check'], x['file'], x['id'], x['name'], x['issue'], x['evidence']))
    with open(args.out + '.md', 'w') as fh:
        fh.write('\n'.join(lines) + '\n')
    print('records:', {os.path.basename(k): len(v) for k, v in drafts.items()})
    for (sev, chk), n in sorted(counts.items(), key=lambda kv: (sev_order[kv[0][0]], kv[0][1])):
        print('%-7s %-18s %d' % (sev, chk, n))
    print('wrote', out_json, 'and', args.out + '.md')
    return 0


if __name__ == '__main__':
    sys.exit(main())
