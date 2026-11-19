#!/usr/bin/env python3
"""Ranks the candidate tissues by how far apart they read in a lateral frame.

    python3 scripts/movies/selection/rank.py SHOTS_DIR --pool a,b,c --k 8 [--hours 24,48]

SHOTS_DIR is the directory measure.py wrote masks.npz and measured.json into. The report comes in
two stages.

Stage one, territory. For every tissue of the pool this prints the peak lit area, the hours it was
shot at, and its highest overlap against any other tissue of the pool at a shared hour. Overlap is
the intersection of two masks over their union. The stage-one order puts a low overlap first and a
large area second.

Stage two, the chosen set. Five numbers describe a mask at the reference hour, the last of
--hours: the area, the fill inside the bounding box, the aspect ratio of that box, the number of
connected pieces, and the perimeter over the area. The centroid is left out here, so a position
never stands in for a shape. The numbers are standardised over the pool, and the form distance of
a pair is their Euclidean distance. Separability of a pair is the form distance, scaled to the
largest in the pool, times one minus the overlap: a pair must differ in shape and in territory.
Every subset of k is searched and the one whose weakest pair is strongest wins. The k are then
printed in rank order, each with the closest competitor inside the set, and the tissues that
missed the set are printed with what crowded them out.

rank.json carries every number of both stages.

Needs numpy and scipy, which the login node carries.
"""
from __future__ import print_function

import argparse
import itertools
import json
import os

import numpy as np
from scipy import ndimage

# A mask below this many pixels is ignored when two territories are compared.
MIN_PAIR_PX = 100
# A tissue whose mask at the reference hour is below this is left out of the search.
MIN_SEARCH_PX = 300
# A mask below this many pixels has no readable form.
MIN_FORM_PX = 50
# The most subsets the search will walk before it gives up.
MAX_SUBSETS = 2000000


def load_masks(shots):
    """The masks of masks.npz, unpacked to bool arrays, keyed on (slug, hour)."""
    z = np.load(os.path.join(shots, 'masks.npz'))
    if 'shape' not in z.files:
        raise SystemExit('rank: %s/masks.npz carries no shape' % shots)
    h, w = [int(v) for v in z['shape']]
    masks = {}
    for key in z.files:
        if key == 'shape':
            continue
        slug, _, hour = key.rpartition('@')
        t = float(hour)
        if t == int(t):
            t = int(t)
        masks[(slug, t)] = np.unpackbits(z[key])[:h * w].reshape(h, w).astype(bool)
    return masks


def iou(a, b):
    u = (a | b).sum()
    return 0.0 if u == 0 else float((a & b).sum()) / float(u)


def parts_of(m):
    _, k = ndimage.label(m)
    return int(k)


def perimeter_of(m):
    return int((m & ~ndimage.binary_erosion(m)).sum())


def form_descriptor(m, shape, with_centroid):
    """The form of one mask. Five numbers, or seven with the centroid."""
    n = int(m.sum())
    if n < MIN_FORM_PX:
        return None
    h, w = shape
    ys, xs = np.nonzero(m)
    bw = xs.max() - xs.min() + 1
    bh = ys.max() - ys.min() + 1
    k = parts_of(m)
    per = perimeter_of(m)
    out = [np.log10(n), n / float(bw * bh), np.log2(max(bw, bh) / float(max(1, min(bw, bh)))),
           np.log2(max(1, k)), per / float(n)]
    if with_centroid:
        out += [xs.mean() / float(w), ys.mean() / float(h)]
    return np.array(out)


def pairwise_form_distance(rows):
    """Euclidean distance between standardised descriptors, and the same scaled to its largest."""
    m = np.array(rows)
    sd = m.std(axis=0)
    sd[sd == 0] = 1
    z = (m - m.mean(axis=0)) / sd
    d = np.sqrt(((z[:, None, :] - z[None, :, :]) ** 2).sum(axis=2))
    return d


def territory_stage(masks, pool, stat):
    """Peak area, hours and highest overlap per tissue, and the stage-one order."""
    times = {}
    for s in pool:
        times[s] = sorted(t for (slug, t) in masks if slug == s)

    print('peak strong-lit pixels and the timepoint of the peak')
    peak = {}
    for s in pool:
        best = max(((stat.get((s, t), {}).get('px', 0), t) for t in times[s]))
        faint = max(stat.get((s, t), {}).get('faintPx', 0) for t in times[s])
        peak[s] = best
        print('  %-24s peak px=%6d at t=%-4s peak faint=%6d timepoints=%s'
              % (s, best[0], best[1], faint, times[s]))

    print('\nmax IoU of each tissue against any other of the pool (over shared timepoints)')
    worst = {}
    for a in pool:
        top, who, when = 0.0, None, None
        for b in pool:
            if a == b:
                continue
            for t in sorted(set(times[a]) & set(times[b])):
                if masks[(a, t)].sum() < MIN_PAIR_PX or masks[(b, t)].sum() < MIN_PAIR_PX:
                    continue
                v = iou(masks[(a, t)], masks[(b, t)])
                if v > top:
                    top, who, when = v, b, t
        worst[a] = (top, who, when)
        print('  %-24s maxIoU=%.2f  vs %-24s at t=%s' % (a, top, str(who), when))

    print('\nranked by distinctness: low max IoU first, then large peak size')
    order = sorted(pool, key=lambda s: (round(worst[s][0], 2), -peak[s][0]))
    for i, s in enumerate(order, 1):
        print('  %2d. %-24s maxIoU=%.2f peak=%6d' % (i, s, worst[s][0], peak[s][0]))
    return peak, worst, order


def form_stage(masks, pool, shape, worst):
    """The seven-number descriptor at each tissue's clearest frame, and the nearest other form."""
    best = {}
    for s in pool:
        ts = [t for (slug, t) in masks if slug == s]
        pick = max(ts, key=lambda t: masks[(s, t)].sum())
        best[s] = (pick, form_descriptor(masks[(s, pick)], shape, True))
    rows = [(s, t, d) for s, (t, d) in sorted(best.items()) if d is not None]
    if not rows:
        return {}, {}

    print("\nform descriptors at each tissue's clearest frame")
    print('%-24s %4s %8s %6s %10s %9s %8s' % ('tissue', 't', 'log10px', 'fill', 'log2aspect', 'log2parts', 'perim/px'))
    for s, t, d in rows:
        print('%-24s %4s %8.2f %6.3f %10.2f %9.2f %8.3f  parts=%d'
              % (s, t, d[0], d[1], d[2], d[3], d[4], parts_of(masks[(s, t)])))

    names = [s for s, _, _ in rows]
    d = pairwise_form_distance([row[2] for row in rows])
    np.fill_diagonal(d, np.inf)
    print('\nform distance to the nearest other tissue (bigger = more singular form)')
    nearest = {}
    nearest_who = {}
    for i in np.argsort(-d.min(axis=1)):
        j = int(np.argmin(d[i]))
        nearest[names[i]] = float(d[i].min())
        nearest_who[names[i]] = names[j]
        mx = worst[names[i]]
        print('  %-24s nearestForm=%5.2f (%-22s)  maxIoU=%.2f vs %s'
              % (names[i], d[i].min(), names[j], mx[0], mx[1]))
    return nearest, nearest_who


def search_stage(masks, pool, shape, hours, k):
    """The k tissues whose weakest pair is the most separable, at the reference hour."""
    ref = hours[-1]
    names = [a for a in pool if (a, ref) in masks and masks[(a, ref)].sum() >= MIN_SEARCH_PX]
    if len(names) < k:
        raise SystemExit('rank: only %d of the pool reach %d pixels at t=%s, fewer than --k %d'
                         % (len(names), MIN_SEARCH_PX, ref, k))
    total = len(list(itertools.combinations(range(len(names)), k)))
    if total > MAX_SUBSETS:
        raise SystemExit('rank: %d subsets of %d from %d is too many; narrow --pool or lower --k'
                         % (total, k, len(names)))

    fd = pairwise_form_distance([form_descriptor(masks[(a, ref)], shape, False) for a in names])
    fdn = fd / fd.max()
    n = len(names)
    io = np.zeros((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            v = 0.0
            for t in hours:
                ka, kb = (names[i], t), (names[j], t)
                if ka in masks and kb in masks and masks[ka].sum() >= MIN_SEARCH_PX and masks[kb].sum() >= MIN_SEARCH_PX:
                    v = max(v, iou(masks[ka], masks[kb]))
            io[i, j] = io[j, i] = v

    # Separability of a pair: different form AND separate territory. Both must hold.
    sep = fdn * (1.0 - io)
    np.fill_diagonal(sep, np.inf)

    best, bestval = None, -1.0
    for comb in itertools.combinations(range(n), k):
        v = sep[np.ix_(comb, comb)].min()
        if v > bestval:
            bestval, best = v, comb

    chosen = [names[i] for i in best]
    print('\n%d subset%s searched at t=%s; best min pairwise separability = %.4f\n'
          % (total, '' if total == 1 else 's', ref, bestval))
    sub = sep[np.ix_(best, best)]
    minsep = dict((chosen[i], float(sub[i].min())) for i in range(k))
    order = sorted(chosen, key=lambda s: -minsep[s])
    print('the %d, rank 1 = most distinct from the rest of the set:' % k)
    for i, s in enumerate(order, 1):
        c = chosen.index(s)
        j = int(np.argmin(sub[c]))
        gi, gj = names.index(s), names.index(chosen[j])
        print('  %d. %-24s minSep=%.3f (closest: %-22s formDist=%.2f IoU=%.2f)'
              % (i, s, minsep[s], chosen[j], fd[gi, gj], io[gi, gj]))

    print('\nnot chosen, and what crowded them out:')
    if len(chosen) == len(names):
        print('  none, every tissue of the pool is in the set')
    for i, s in enumerate(names):
        if s in chosen:
            continue
        d = sorted((sep[i, names.index(c)], c) for c in chosen)
        print('  %-24s closest chosen: %-22s sep=%.3f (formDist=%.2f IoU=%.2f)'
              % (s, d[0][1], d[0][0], fd[i, names.index(d[0][1])], io[i, names.index(d[0][1])]))
    return dict(chosen=order, minSep=minsep, bestval=float(bestval), names=names,
                referenceHpf=ref, iou=io.tolist(), formDist=fd.tolist())


def number_list(raw, key):
    out = []
    for part in raw.split(','):
        part = part.strip()
        if not part:
            continue
        v = float(part)
        out.append(int(v) if v == int(v) else v)
    if not out:
        raise SystemExit('rank: --%s needs a comma-separated list of numbers' % key)
    return out


def main():
    ap = argparse.ArgumentParser(description='Rank the candidate tissues by territory and form.')
    ap.add_argument('shots', metavar='SHOTS_DIR', help='the directory measure.py wrote masks.npz into')
    ap.add_argument('--pool', help='the tissues to rank, comma separated; every measured tissue by default')
    ap.add_argument('--k', type=int, default=8, help='how many tissues the chosen set holds (default 8)')
    ap.add_argument('--hours', default='24,48', help='the hours the search compares, last one is the reference (default 24,48)')
    args = ap.parse_args()

    masks = load_masks(args.shots)
    shape = next(iter(masks.values())).shape
    measured = json.load(open(os.path.join(args.shots, 'measured.json')))
    stat = {}
    for row in measured:
        st = dict(row['stats'] or {})
        st['faintPx'] = row.get('faintPx', 0)
        stat[(row['slug'], row['t'])] = st

    present = sorted(set(slug for (slug, _) in masks))
    pool = [s.strip() for s in args.pool.split(',') if s.strip()] if args.pool else present
    missing = [s for s in pool if s not in present]
    if missing:
        raise SystemExit('rank: no mask for %s' % ', '.join(missing))
    if args.k < 2 or args.k > len(pool):
        raise SystemExit('rank: --k must lie in 2 to the pool size (%d)' % len(pool))
    hours = number_list(args.hours, 'hours')

    peak, worst, order = territory_stage(masks, pool, stat)
    nearest, nearest_who = form_stage(masks, pool, shape, worst)
    chosen = search_stage(masks, pool, shape, hours, args.k)

    out = dict(pool=pool, hours=hours,
               peak=dict((k, list(v)) for k, v in peak.items()),
               worst=dict((k, [v[0], v[1], v[2]]) for k, v in worst.items()),
               territoryOrder=order, nearestForm=nearest, nearestFormWho=nearest_who)
    out.update(chosen)
    path = os.path.join(args.shots, 'rank.json')
    json.dump(out, open(path, 'w'), indent=1)
    print('\nwrote %s' % path)


if __name__ == '__main__':
    main()
