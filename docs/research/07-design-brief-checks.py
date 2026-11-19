"""Checks for docs/research/07-design-brief.md.

Run: python3 07-design-brief-checks.py
Prints: timeline anchor mapping and per-stage track widths, system palette
contrast ratios (WCAG 2.x relative luminance), CIE76 distances between
palette colours under simulated colour vision deficiency (Machado et al.
2009 matrices, severity 1.0, transcribed; verify against the paper), and
the stage period ramp.
Requires numpy. Written for Python 3.6+.
"""
import itertools
import math

import numpy as np

STAGE_FILE = None  # set to the ZFIN stage_ontology.txt path to print per-stage widths

# --- timeline ---------------------------------------------------------------
ANCHORS = [(0, 0.00), (0.75, 0.02), (2.25, 0.08), (5.25, 0.17), (10.33, 0.27),
           (24, 0.38), (48, 0.50), (72, 0.57), (168, 0.67), (720, 0.81),
           (1080, 0.86), (2160, 0.92), (4320, 1.00)]


def track_fraction(hpf):
    """Piecewise-linear map from hpf to fraction of track width."""
    hpf = min(max(hpf, 0), ANCHORS[-1][0])
    for (t0, f0), (t1, f1) in zip(ANCHORS, ANCHORS[1:]):
        if hpf <= t1:
            return f0 + (f1 - f0) * (hpf - t0) / (t1 - t0)
    return 1.0


def hpf_from_fraction(f):
    """Inverse of track_fraction."""
    f = min(max(f, 0), 1)
    for (t0, f0), (t1, f1) in zip(ANCHORS, ANCHORS[1:]):
        if f <= f1:
            return t0 + (t1 - t0) * (f - f0) / (f1 - f0)
    return ANCHORS[-1][0]


# --- colour -----------------------------------------------------------------
def hex2rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def rgb2hex(c):
    c = np.clip(c, 0, 1)
    return '#%02X%02X%02X' % tuple(int(round(v * 255)) for v in c)


def lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def delin(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def luminance(h):
    r, g, b = lin(hex2rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
MI = np.linalg.inv(M)
WHITE = np.array([0.95047, 1.0, 1.08883])


def xyz2lab(xyz):
    t = xyz / WHITE
    f = np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


def lab2xyz(lab):
    L, a, b = lab
    fy = (L + 16) / 116
    f = np.array([fy + a / 500, fy, fy - b / 200])
    t = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787)
    return t * WHITE


def lab(h):
    return xyz2lab(M @ lin(hex2rgb(h)))


def lch2hex(L, C, hdeg):
    """LCh to sRGB hex; reduces chroma until the colour is in gamut."""
    for c in np.arange(C, -1, -1.0):
        a = c * math.cos(math.radians(hdeg))
        b = c * math.sin(math.radians(hdeg))
        rgb = MI @ lab2xyz(np.array([L, a, b]))
        if np.all((rgb > -0.002) & (rgb < 1.002)):
            return rgb2hex(delin(rgb))
    return rgb2hex(delin(MI @ lab2xyz(np.array([L, 0, 0]))))


def set_lightness(h, L_new):
    l = lab(h)
    C = math.hypot(l[1], l[2])
    hue = math.degrees(math.atan2(l[2], l[1]))
    return lch2hex(L_new, C, hue)


# Machado, Oliveira, Fernandes 2009, IEEE TVCG 15(6), severity 1.0, linear RGB.
CVD = {
    'protan': np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]),
    'deutan': np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]),
    'tritan': np.array([[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]),
}


def simulate(h, kind):
    return rgb2hex(delin(CVD[kind] @ lin(hex2rgb(h))))


def delta_e(h1, h2):
    return float(np.linalg.norm(lab(h1) - lab(h2)))


DARK_BG, LIGHT_BG = '#0E1116', '#F5F6F7'

SYSTEMS_DARK = [
    ('S01 nervous', '#5B8DEF'), ('S02 sensory', '#7FD3F5'), ('S03 cardiovascular', '#E4483C'),
    ('S04 hematopoietic', '#F28FA0'), ('S05 musculature', '#F08A3C'), ('S06 skeletal', '#F0EDE4'),
    ('S07 integument', '#C3CAD2'), ('S08 digestive', '#A9713B'), ('S09 respiratory', '#66D1C2'),
    ('S10 renal', '#C6D34A'), ('S11 reproductive', '#B067D6'), ('S12 endocrine', '#D34FA7'),
    ('S13 immune', '#3E9B4F'), ('S14 fins', '#A9AFF2'), ('S15 yolk', '#D9C79A'),
]
SYSTEMS_LIGHT = [(n, set_lightness(h, 38 + (lab(h)[0] - 50) * 0.5)) for n, h in SYSTEMS_DARK]

OKABE_ITO_GROUPS = [
    ('G1 nervous+sensory', '#0072B2'), ('G2 cardiovascular+hematopoietic', '#D55E00'),
    ('G3 musculature', '#E69F00'), ('G4 skeletal+fins', '#F0E442'),
    ('G5 digestive+respiratory+renal', '#009E73'), ('G6 reproductive+endocrine+immune', '#CC79A7'),
    ('G7 integument', '#56B4E9'), ('G8 yolk', '#999999'),
]

PERIODS = ['Zygote', 'Cleavage', 'Blastula', 'Gastrula', 'Segmentation',
           'Pharyngula', 'Hatching', 'Larval', 'Juvenile', 'Adult']
PERIOD_RAMP = [(n, lch2hex(38 + 5 * i, 38, 290 - 230 * i / 9)) for i, n in enumerate(PERIODS)]


def report(title, palette):
    print('===', title)
    for n, h in palette:
        print('%-34s %s L*=%5.1f  dark %5.2f:1  light %5.2f:1' % (n, h, lab(h)[0], contrast(h, DARK_BG), contrast(h, LIGHT_BG)))
    for kind in ('normal', 'protan', 'deutan', 'tritan'):
        pairs = []
        for (n1, h1), (n2, h2) in itertools.combinations(palette, 2):
            a, b = (h1, h2) if kind == 'normal' else (simulate(h1, kind), simulate(h2, kind))
            pairs.append((round(delta_e(a, b), 1), n1[:3], n2[:3]))
        pairs.sort()
        print('  %-7s weakest pairs:' % kind, pairs[:4])


if __name__ == '__main__':
    print('track fraction at 72 hpf: %.3f, 720 hpf: %.3f, 2160 hpf: %.3f' % (track_fraction(72), track_fraction(720), track_fraction(2160)))
    log = lambda t: math.log10(1 + t) / math.log10(1 + 4320)
    print('log10(1+t) alternative at 2.25 h: %.3f, 72 h: %.3f, 720 h: %.3f' % (log(2.25), log(72), log(720)))
    print('linear alternative at 72 h: %.4f' % (72 / 4320))
    if STAGE_FILE:
        rows = [l.rstrip('\n').split('\t') for l in open(STAGE_FILE) if 'Unknown' not in l]
        for width in (1200, 700, 358):
            widths = [(name, (track_fraction(min(float(b), 4320)) - track_fraction(float(a))) * width) for _, _, name, a, b in rows]
            print('track %d px: narrowest stage %s = %.1f px' % ((width,) + min(widths, key=lambda x: x[1])[::-1]))
    report('system palette, dark theme', SYSTEMS_DARK)
    report('system palette, light theme', SYSTEMS_LIGHT)
    report('Okabe-Ito reduced mode (8 groups)', OKABE_ITO_GROUPS)
    print('=== period ramp')
    for n, h in PERIOD_RAMP:
        print('%-13s %s L*=%4.1f dark %4.1f:1 light %4.1f:1' % (n, h, lab(h)[0], contrast(h, DARK_BG), contrast(h, LIGHT_BG)))
    for kind in ('normal', 'protan', 'deutan', 'tritan'):
        ds = []
        for (n1, h1), (n2, h2) in zip(PERIOD_RAMP, PERIOD_RAMP[1:]):
            a, b = (h1, h2) if kind == 'normal' else (simulate(h1, kind), simulate(h2, kind))
            ds.append(round(delta_e(a, b), 1))
        print('  %-7s neighbour dE:' % kind, ds, 'min', min(ds))
    for name, fg, bg in [('dark text', '#E7EAEE', DARK_BG), ('dark muted', '#9AA3AD', DARK_BG), ('dark focus', '#FFD166', DARK_BG),
                         ('dark accent', '#7FD3F5', DARK_BG), ('light text', '#1B1F24', LIGHT_BG), ('light muted', '#5B6470', LIGHT_BG),
                         ('light focus', '#B45309', LIGHT_BG), ('light accent', '#0B6E99', LIGHT_BG)]:
        print('%-12s %s on %s: %.2f:1' % (name, fg, bg, contrast(fg, bg)))
