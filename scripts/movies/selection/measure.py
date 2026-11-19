#!/usr/bin/env python3
"""The lit area of every frame of a capture run.

    python3 scripts/movies/selection/measure.py SHOTS_DIR

SHOTS_DIR is the --out directory of scripts/movies/selection/capture.ts. This reads its
capture.json, measures two masks per frame and writes measured.json and masks.npz next to it.

EGFP draws at #39F579. A pixel is strongly lit when its green channel is above 50 and exceeds the
larger of its red and blue channels by more than 25. A pixel is faintly lit when that green excess
is above 8 alone. The count runs over the top 800 rows only: the stage timeline along the bottom
of the frame carries its own green.

measured.json is capture.json with a stats block and a faint count per row. masks.npz holds one
packed bit array per frame under the key "<slug>@<hour>", with the mask shape under "shape".

Needs numpy, Pillow and scipy, which the login node carries.
"""
from __future__ import print_function

import argparse
import itertools
import json
import os

import numpy as np
from PIL import Image

# The rows the mask covers. The stage timeline sits below them.
MASK_HEIGHT = 800
MASK_WIDTH = 1600
# Strong: reads as lit. Faint: any green tint at all.
STRONG_GREEN = 50
STRONG_EXCESS = 25
FAINT_EXCESS = 8
# A mask below this many pixels is too small for an overlap to mean anything.
MIN_PAIR_PX = 200
# Overlap at or above this is reported as a pair that shares a territory.
PAIR_IOU = 0.30


def masks_of(path):
    """The strong and the faint mask of one frame, over the top MASK_HEIGHT rows."""
    im = np.asarray(Image.open(path).convert('RGB')).astype(int)
    im = im[:MASK_HEIGHT, :MASK_WIDTH]
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    d = g - np.maximum(r, b)
    return (g > STRONG_GREEN) & (d > STRONG_EXCESS), (d > FAINT_EXCESS)


def stats(m):
    """Area, box, fill, centroid and elongation of one mask."""
    n = int(m.sum())
    if n == 0:
        return dict(px=0, bbox=None, w=0, h=0, fill=0.0, cx=None, cy=None, elong=0.0, rows=0, cols=0)
    ys, xs = np.nonzero(m)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    w, h = x1 - x0 + 1, y1 - y0 + 1
    return dict(px=n, bbox=[x0, y0, x1, y1], w=w, h=h, fill=round(n / (w * h), 3),
                cx=int(xs.mean()), cy=int(ys.mean()), elong=round(max(w, h) / max(1, min(w, h)), 2),
                rows=int((m.any(axis=1)).sum()), cols=int((m.any(axis=0)).sum()))


def iou(a, b):
    """Intersection over union of two masks."""
    u = (a | b).sum()
    return 0.0 if u == 0 else float((a & b).sum()) / float(u)


def mask_key(slug, t):
    return '%s@%s' % (slug, t)


def measure(shots):
    """Measures every frame of capture.json and returns the rows and the masks."""
    cap = json.load(open(os.path.join(shots, 'capture.json')))
    masks = {}
    for row in cap:
        f = row['file']
        if not os.path.exists(f):
            row['stats'] = None
            continue
        m, faint = masks_of(f)
        row['stats'] = stats(m)
        row['faintPx'] = int(faint.sum())
        masks[(row['slug'], row['t'])] = m
    return cap, masks


def print_table(cap):
    head = ('%-34s %6s %10s %7s %7s %5s %5s %5s %5s %5s %5s'
            % ('slug', 't', 'litHandles', 'px', 'faint', 'w', 'h', 'fill', 'cx', 'cy', 'elong'))
    print(head)
    for row in cap:
        st = row['stats'] or {}
        print('%-34s %6s %10s %7s %7s %5s %5s %5s %5s %5s %5s' % (
            row['slug'], row['t'], row['litCount'], st.get('px', 0), row.get('faintPx', 0),
            st.get('w', 0), st.get('h', 0), st.get('fill', 0), str(st.get('cx')), str(st.get('cy')),
            st.get('elong', 0)))


def print_pairs(masks):
    """The pairs that share a territory, hour by hour, over every hour two slugs share."""
    hours = sorted(set(t for (_, t) in masks))
    for t in hours:
        keys = sorted(slug for (slug, hour) in masks if hour == t and masks[(slug, hour)].sum() > MIN_PAIR_PX)
        if len(keys) < 2:
            continue
        print('\n### pairs with IoU >= %.2f at t=%s hpf' % (PAIR_IOU, t))
        found = 0
        for a, b in itertools.combinations(keys, 2):
            v = iou(masks[(a, t)], masks[(b, t)])
            if v >= PAIR_IOU:
                found += 1
                print('  %.2f  %s  ~  %s' % (v, a, b))
        if found == 0:
            print('  none of the %d masks at this hour' % len(keys))


def main():
    ap = argparse.ArgumentParser(description='Measure the lit area of every frame of a capture run.')
    ap.add_argument('shots', metavar='SHOTS_DIR', help='the --out directory of capture.ts')
    args = ap.parse_args()
    shots = args.shots
    if not os.path.exists(os.path.join(shots, 'capture.json')):
        raise SystemExit('measure: %s holds no capture.json' % shots)

    cap, masks = measure(shots)
    json.dump(cap, open(os.path.join(shots, 'measured.json'), 'w'), indent=1)
    packed = dict((mask_key(slug, t), np.packbits(m)) for (slug, t), m in masks.items())
    packed['shape'] = np.array([MASK_HEIGHT, MASK_WIDTH], dtype=np.int32)
    np.savez_compressed(os.path.join(shots, 'masks.npz'), **packed)

    print_table(cap)
    print_pairs(masks)
    print('\n%d masks measured, %s and %s written'
          % (len(masks), os.path.join(shots, 'measured.json'), os.path.join(shots, 'masks.npz')))


if __name__ == '__main__':
    main()
