#!/usr/bin/env python3
"""Contact sheets of a capture run, six panels a sheet, so every frame gets read.

    python3 scripts/movies/selection/sheets.py SHOTS_DIR [--only slug@t,slug]

SHOTS_DIR is the directory measure.py wrote measured.json into. Each panel carries the slug, the
hour, the lit area and the size of the bounding box. --only keeps the named frames: a bare slug
keeps every hour of that slug, and "slug@24" keeps that one hour.

The sheets go to SHOTS_DIR/sheets/sheet-NN.png. The crop is the region the embryo occupies in a
lateral frame of the viewer at 1600 by 900.

Needs Pillow, which the login node carries.
"""
from __future__ import print_function

import argparse
import json
import os

from PIL import Image, ImageDraw

# The region the embryo occupies in every lateral view, as left, top, right, bottom.
CROP = (330, 40, 1470, 760)
COLS, ROWS = 3, 2
# Each panel is the crop at this reduction, with a label strip above it.
SCALE = 2.4
LABEL_H = 22
GROUND = (6, 12, 20)
LABEL_FILL = (220, 230, 240)
BORDER = (60, 72, 90)


def panels_of(rows, only):
    """The rows a sheet run covers, in slug then hour order."""
    if only is None:
        keep = list(rows)
    else:
        keep = [r for r in rows if ('%s@%s' % (r['slug'], r['t'])) in only or r['slug'] in only]
    keep.sort(key=lambda r: (r['slug'], r['t']))
    return keep


def label_of(row):
    st = row['stats'] or {}
    return '%s  t=%s  px=%s %sx%s' % (row['slug'], row['t'], st.get('px', 0), st.get('w', 0), st.get('h', 0))


def write_sheets(shots, panels):
    out = os.path.join(shots, 'sheets')
    if not os.path.isdir(out):
        os.makedirs(out)
    pw = int((CROP[2] - CROP[0]) / SCALE)
    ph = int((CROP[3] - CROP[1]) / SCALE)
    n = 0
    for i in range(0, len(panels), COLS * ROWS):
        chunk = panels[i:i + COLS * ROWS]
        sheet = Image.new('RGB', (COLS * pw, ROWS * (ph + LABEL_H)), GROUND)
        d = ImageDraw.Draw(sheet)
        for j, row in enumerate(chunk):
            im = Image.open(row['file']).convert('RGB').crop(CROP).resize((pw, ph), Image.LANCZOS)
            cx, cy = (j % COLS) * pw, (j // COLS) * (ph + LABEL_H)
            sheet.paste(im, (cx, cy + LABEL_H))
            d.text((cx + 6, cy + 5), label_of(row), fill=LABEL_FILL)
            d.rectangle([cx, cy, cx + pw - 1, cy + ph + LABEL_H - 1], outline=BORDER)
        path = os.path.join(out, 'sheet-%02d.png' % n)
        sheet.save(path)
        n += 1
        print(path, ['%s@%s' % (r['slug'], r['t']) for r in chunk])
    return n


def main():
    ap = argparse.ArgumentParser(description='Contact sheets of a capture run.')
    ap.add_argument('shots', metavar='SHOTS_DIR', help='the directory measure.py wrote measured.json into')
    ap.add_argument('--only', help='keep these frames: slug or slug@hour, comma separated')
    args = ap.parse_args()
    measured = os.path.join(args.shots, 'measured.json')
    if not os.path.exists(measured):
        raise SystemExit('sheets: %s is missing; run measure.py first' % measured)
    only = set(s.strip() for s in args.only.split(',') if s.strip()) if args.only else None
    panels = panels_of(json.load(open(measured)), only)
    if not panels:
        raise SystemExit('sheets: no frame matched --only')
    print('%d sheets' % write_sheets(args.shots, panels))


if __name__ == '__main__':
    main()
