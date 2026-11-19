> **Superseded draft.** The assembled specification
> [`../2026-09-06-zebrafish-3d-atlas-design.md`](../2026-09-06-zebrafish-3d-atlas-design.md)
> is authoritative. This file is the section draft written before reconciliation and it may
> disagree with the assembled specification. Written by AI coding agents (Claude Code) under
> the direction of Yang-Joon Kim, 2026-09-06.

## Body model and geometry

This section defines the body frame, the body model and the keyframe data in `body.json`. It also defines the primitive builders, the interpolation rules, the topology handoffs and the rebuild scheduler. Units are millimetres (mm) and hours post fertilization (hpf); days post fertilization (dpf) convert as hpf = 24 x dpf. Standard length (SL) is the distance from the snout to the posterior end of the notochord. The Zebrafish Anatomy Ontology (ZFA) and the Zebrafish Stage Ontology (ZFS) supply ids and stage windows. Decision D3 fixes the regimes, the body coordinates, and the primitive list. Decision D4 fixes the world axes. Decision D6 fixes the growth track. Research 05 owns every body-scale number below (D11). A value marked "estimate" is a reading of staging images or a derivation from a sourced ratio.

### 4.1 Body frame

#### 4.1.1 Spine

**BG-01.** `bodyModel(t)` builds the spine as a centripetal Catmull-Rom curve (`CatmullRomCurve3`, type `centripetal`, tension 0.5) through the control points of the interpolated keyframe. The keyframe stores at least 9 control points as `[u, x, y]` with `z = 0`. The module samples the curve at 128 stations, `u_i = i / 127`, by arc length (`getPointAt`). Research 06 section 3 gives the reason for the centripetal type: it does not loop when control points are unevenly spaced.

**BG-02.** `u = 0` is the snout tip. `u = 1` is the posterior end of the notochord. The spine lies in the sagittal plane (`z = 0`) in version 1. The world origin is the spine point at `u = 0.4`. The spine tangent there is `+x` and the dorsal normal there is `+y`. D4 fixes `+x` posterior, `+y` dorsal and `+z` left. Section 4.2.6 states how the frame reaches this convention from the egg.

#### 4.1.2 Local frame by parallel transport

**BG-03.** The module computes a rotation-minimizing frame (tangent `T`, dorsal normal `N`, lateral binormal `B`) by parallel transport. It seeds the frame at the station nearest `u = 0.4` and transports it toward both ends. The algorithm:

```
k  = index of the station nearest u = 0.4
T[k] = normalize(P'(u_k))
N[k] = normalize(up - (up . T[k]) T[k])        with up = (0, 1, 0)
B[k] = N[k] x T[k]                              // points to the right side (-z at rest)
for i = k+1 .. 127 (forward) and i = k-1 .. 0 (backward), with j the previous index:
  T[i] = normalize(P'(u_i))
  c    = T[j] x T[i]
  if |c| < 1e-9:  N[i] = N[j]
  else:           N[i] = rotate(N[j], axis = c / |c|, angle = atan2(|c|, T[j] . T[i]))
  B[i] = N[i] x T[i]
```

The seed is safe at `u = 0.4` because the tangent there stays within 72 degrees of `+x` at every time (section 4.2.6). The seed is unsafe at `u = 0`, where the bent head of a 24 hpf embryo points down. Frenet frames (`computeFrenetFrames`) are not used; they flip where the curvature changes sign.

**BG-04.** The unit tests in D13 check that `N[i] . N[i-1] > 0.99` at every station and every hour from 0 to 4320 hpf.

#### 4.1.3 Body coordinates to world position

**BG-05.** A structure position `{u, v, w}` maps to a world point by

```
X(u, v, w) = P(u) + v * h(u, v) * N(u) + w * hW(u) * B(u)
h(u, v)    = hD(u)  if v >= 0
           = hV(u)  if v <  0
```

`hD(u)` is the dorsal half-height, `hV(u)` the ventral half-height, `hW(u)` the half-width. `v = +1` is the dorsal skin and `v = -1` the ventral skin. `w = +1` is the right skin and `w = -1` the left skin (D3). The skin is the superellipse `|v|^n + |w|^n = 1` with `n = 2` unless the profile station carries another exponent. The keyframe stores the profile at 9 stations: `u = 0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0`. The module interpolates them across the 128 stations with a monotone cubic (Fritsch-Carlson). A half-height therefore never overshoots below zero.

**BG-06.** The data validator (D13) rejects `|v| > 1.5` and `|w| > 1.5`. Values between 1 and 1.5 are legal so that a fin bud or the pericardium can sit outside the skin.

#### 4.1.4 Size units

**BG-07.** A size field carries a unit. `mm` is the default. `bodyHeightFraction` resolves at every time step as

```
size_mm = fraction * (hD(u_c) + hV(u_c))
```

where `u_c` is the structure's anchor `u` at that time. The fraction applies to all three radii of a primitive unless the record gives the radii separately. From 72 hpf a size may also carry `sizeRefSl` (D6): the runtime multiplies the size by `SL(t) / sizeRefSl` before interpolation (section 4.7).

#### 4.1.5 Fins past `u = 1`

**BG-08.** For `1 < u <= 1.25` the module extends the spine along the tangent at `u = 1`:

```
P(u) = P(1) + (u - 1) * L * T(1),   frame = frame(1),   hD = hD(1), hV = hV(1), hW = hW(1)
```

`L` is the axis length. The caudal fin sheet uses `u` up to 1.20 (research 03e, caudal fin, "apFraction 0.95 to 1.2"). The notochord flexion (45 degrees at 6.5 mm SL, D8) is a parameter of the notochord structure and of the caudal fin sheet. The spine itself does not bend there. The spine stays smooth through `u = 1` and the caudal fin base lies on the extended tangent.

#### 4.1.6 The `BodyFrame` type

**BG-09.** `src/core/bodyModel.ts` exports:

```ts
export type Vec3 = [number, number, number]
export type Regime = 'R0' | 'R1' | 'R2' | 'R3' | 'R4'

export interface BodyStation {
  u: number; p: Vec3; t: Vec3; n: Vec3; b: Vec3
  hD: number; hV: number; hW: number; exponent: number
}

export interface BodyFrame {
  hpf: number
  regime: Regime
  stations: BodyStation[]                     // 128 entries, u = i / 127
  axisLengthMm: number                        // snout to notochord end
  bodyLengthMm: number                        // growth table value (D6)
  slMm: number | null                         // null before 72 hpf
  headTrunkAngleDeg: number | null            // null before 22 hpf
  notochordFlexionDeg: number
  ventU: number
  epibolyFraction: number
  somiteCount: number
  cellCount: number | null                    // null after 4.66 hpf
  cap: { baseRadiusMm: number; heightMm: number } | null
  shellThicknessMm: number | null
  yolk: {
    ball: { centre: Vec3; radiusMm: number; u: number; depthMm: number } | null
    extension: { u0: number; u1: number; r0Mm: number; r1Mm: number } | null
  } | null
  chorion: { centre: Vec3; radiusMm: number } | null
  frameAt(u: number): { p: Vec3; t: Vec3; n: Vec3; b: Vec3; hD: number; hV: number; hW: number }
  toWorld(u: number, v: number, w: number): Vec3
}

export function bodyModel(hpf: number): BodyFrame
```

**BG-10.** `bodyModel` is a pure function of `hpf` and of the loaded `body.json` and `stages.json`. It touches no DOM and no three.js object. It caches the last frame by `hpf` rounded to 0.001 h.

### 4.2 The five regimes

D3 fixes five regimes. Each regime is a set of equations that the generator script `scripts/gen-body.ts` evaluates at the 32 keyframe times to produce `body.json` (section 4.3). The runtime interpolates `body.json`; it does not evaluate the regime equations. The generator is checked into `scripts/` so that a change to an equation regenerates the table.

#### 4.2.1 R0, blastodisc (0 to 4.66 hpf)

**BG-11.** The yolk is a sphere of radius `Ry` centred at the origin of the yolk-fixed frame, animal pole at `+y`. `Ry = 0.35 mm` at 0 hpf (zygote diameter 0.7 mm, research 05 section 2). The blastodisc is a half superellipsoid with semi-axes `(a, h, a)` and exponent 2 whose base plane sits at `y = sqrt(Ry^2 - a^2)`. The cell count `n(t)` follows the ZFS cleavage stages:

```
n(t) = 2^k,  k = 1 + floor((t - 0.75) / 0.25)     for 0.75 <= t < 3.0 hpf   (2-cell at 0.75, 1k-cell at 3.0)
n(t) = 1                                            for t < 0.75
```

The cap height follows the cell count while cleavage is synchronous, then flattens:

```
h(n) = 0.20 + 0.010 * log2(n)  mm      for t <= 3.0 hpf     (1-cell 0.20, 64-cell 0.26, 1k-cell 0.30)
h(t) falls linearly from 0.30 (3.33 hpf, high) to 0.15 (4.0 hpf, sphere) and 0.10 (4.33 hpf, dome)
```

Research 05 section 16.2 gives 0.20, 0.25, 0.30 and 0.15 mm at 1-cell, 64-cell, high and sphere. Research 03a (blastodisc record) gives a base diameter of 0.5 mm at 128-cell and 0.65 mm at sphere. All cap values are estimates. Research 05 section 2 found no measured cap height per cleavage stage.

| hpf | stage | cellCount | capBaseRadiusMm | capHeightMm | shellThicknessMm | epibolyFraction | yolkRadiusMm | presumptive axis arc (deg) |
|---|---|---|---|---|---|---|---|---|
| 0 | 1-cell | 1 | 0.30 | 0.20 | null | 0 | 0.35 | 59 |
| 0.75 | 2-cell | 2 | 0.29 | 0.21 | null | 0 | 0.35 | 56 |
| 2.25 | 128-cell | 128 | 0.26 | 0.27 | null | 0 | 0.35 | 48 |
| 3.33 | high | 2048 (estimate) | 0.25 | 0.30 | null | 0 | 0.35 | 46 |
| 4.0 | sphere | 4096 (estimate) | 0.30 | 0.15 | 0.12 | 0.15 | 0.35 | 59 |
| 4.33 | dome | 4096 (estimate) | 0.33 | 0.10 | 0.10 | 0.20 | 0.35 | 72 |
| 4.66 | 30%-epiboly | null | null | null | 0.06 | 0.30 | 0.345 | 66 |
| 5.25 | 50%-epiboly | null | null | null | 0.055 | 0.50 | 0.34 | 90 |
| 6 | shield | null | null | null | 0.05 | 0.50 | 0.33 | 90 |
| 8 | 75%-epiboly | null | null | null | 0.045 | 0.75 | 0.33 | 120 |
| 9 | 90%-epiboly | null | null | null | 0.04 | 0.90 | 0.325 | 143 |
| 10 | bud | null | null | null | 0.035 | 1.00 | 0.325 | 180 |

Sources: epiboly fractions from ZFS start times (research 05 section 3). Shell thickness and yolk radius from research 05 section 16.2 and section 2 (estimates). The dome-stage yolk bulge of 0.05 mm toward the animal pole (research 05 section 16.2) is the parameter `yolkDomeMm`. It is 0.05 at 4.33 hpf and 0 at 4.66 hpf.

**BG-12.** Every keyframe carries a spine, so that structures placed in body coordinates before 10 hpf resolve. Before 10 hpf the spine is the presumptive axis. It is an arc on the dorsal meridian (`+x` half of the sagittal plane) from the animal pole to the blastoderm margin. Its radius is `Ry + shellThickness / 2`. Its angular extent is `max(theta_m, theta_cap, 30 degrees)`. `theta_m = acos(1 - 2 f)` is the polar angle of the margin. `theta_cap = asin(a / Ry)` is the half-angle of the cap. The shield (6 hpf) therefore sits at `u = 1`. The tail bud at 10 hpf also sits at `u = 1`, on the vegetal pole, without a jump.

#### 4.2.2 R1, epiboly (4.66 to 10 hpf)

**BG-13.** The blastoderm is a spherical shell with inner radius `Ry` and thickness `shellThicknessMm`. It covers the sphere from the animal pole to the polar angle `theta_m = acos(1 - 2 f)`. `f` is the epiboly fraction, the fraction of the yolk cell surface that the blastoderm covers. `f = 0.5` puts the margin on the equator (germ ring and shield stages, research 05 section 3). Between the ZFS times the module interpolates `f` linearly. From 6 to 10 hpf this gives 12.5 percent per hour. Kimmel reports about 15 percent per hour (research 05 section 3). The germ ring thickening and the shield are structure records placed at `u = 1` on the shell. The shield spans 30 degrees of longitude and is 0.08 mm thick (research 05 section 16.2). The body model does not draw them.

#### 4.2.3 R2, wrapped axis (10 to 19 hpf, blending to 22 hpf)

**BG-14.** The axis is a tube of length `L(t)` whose spine follows a great-circle arc on the yolk sphere in the yolk-fixed frame. The arc starts at the animal pole (`u = 0`, the head) and runs down the dorsal meridian. A contact fraction `c(t)` of the axis lies on the sphere. The remainder is a free tail that leaves the sphere on the tangent and curls ventrally by `thetaTail`.

```
Rs      = Ry + hV_trunk - 0.03 mm                 spine radius; the ventral skin touches the yolk with 0.03 mm overlap
omega   = c * L / Rs                              contact wrap angle in radians
phi(u)  = u * L / Rs                              for u * L <= c * L   (on the sphere)
P(u)    = Rs * (sin phi, cos phi, 0)
free part: start at phi = omega with heading -omega, follow a circular arc of total turn thetaTail over length (1 - c) L
```

| hpf | stage | L (mm) | c | wrap angle (deg) | thetaTail (deg) | trunk hD / hV / hW (mm) | head hD / hV / hW (mm) | source |
|---|---|---|---|---|---|---|---|---|
| 10 | bud | 1.02 | 1.0 | 180 | 0 | 0.05 / 0.03 / 0.12 | 0.08 / 0.03 / 0.10 | wrap from research 05 section 15; L derived |
| 12 | 5-9 somites | 1.15 | 1.0 | 204 | 0 | 0.07 / 0.04 / 0.11 | 0.11 / 0.04 / 0.12 | wrap about 200 (research 05 section 15) |
| 14 | 10-13 somites | 1.26 | 1.0 | 225 | 0 | 0.08 / 0.05 / 0.11 | 0.14 / 0.06 / 0.14 | interpolated |
| 16 | 14-19 somites | 1.38 | 1.0 | 240 | 0 | 0.10 / 0.06 / 0.10 | 0.16 / 0.08 / 0.16 | wrap about 240 (research 05 section 15) |
| 18 | 14-19 somites | 1.66 | 0.7 | 199 | 20 | 0.11 / 0.07 / 0.10 | 0.17 / 0.09 / 0.17 | estimate |
| 19 | 20-25 somites | 1.80 | 0.5 | 152 | 40 | 0.12 / 0.07 / 0.10 | 0.18 / 0.10 / 0.18 | L from research 05 section 16.3; tail free at 19 hpf (research 05 section 15) |

Research 05 section 16.3 lists axis lengths of 1.0, 1.2, 1.5 and 1.8 mm at 10, 11.66, 16 and 19 hpf. Section 15 lists wrap angles of 180, 200 and 240 degrees at 10, 11.66 and 16 hpf. Both series are estimates and they do not agree. A 240 degree wrap on a 0.60 mm yolk ball, with the spine 0.03 mm above the skin, gives 1.38 mm. Research 05 gives 1.5 mm. The wrap angle is the visible feature in the staging images, so the generator keeps the wrap angle and derives `L`. The head radii come from research 05 section 16.3 (0.20 x 0.18 mm at 16 hpf, 0.25 x 0.22 mm at 22 hpf, estimates). The head's ventral half-height is smaller because the head lies flat on the yolk.

**BG-15.** From 14 hpf the yolk is a ball plus an extension in body coordinates (section 4.2.4 gives the equations). In R2 the ball centre is the yolk centre (`u = 0.4`, depth `Rs`). The extension starts at the ball's posterior pole and follows the spine. The extension appears at 16 hpf with length 0.42 x ball diameter (kidney-bean stage, research 05 sections 7 and 15). It reaches 0.60 x ball diameter at 19 hpf ("more than half", Kimmel via research 05 section 7).

#### 4.2.4 R3, straightening (19 to 72 hpf)

**BG-16.** From 22 hpf the spine is built in the body-fixed frame from four pieces:

```
trunk:  straight along +x from u_b = 0.32 to u = 0.7
tail:   from u = 0.7 to 1.0, a circular arc of total ventral turn thetaTail
head:   from u_a = 0.06 to u_b, a circular arc of total ventral turn beta = HTA - 20 degrees
snout:  from u = 0 to u_a, straight along the head's final direction
then translate so that P(0.4) = origin
```

The head-trunk angle (HTA) is the angle between the ear-eye line and the trunk notochord (Kimmel). A straight larva has an HTA near 20 degrees because the eye sits ventral to the ear. The spine bend is therefore `HTA - 20` (research 05 section 16.5). The series is 120, 95, 75, 55, 45, 35, 25 degrees at 24, 30, 36, 42, 48, 60, 72 hpf (research 05 section 15). The 60 hpf value of 35 comes from D8. The ZFIN page value of 55 is unused. The generator uses 125 degrees at 22 hpf (estimate) and 22, 20 degrees at 96 and 120 hpf (research 05 section 15, estimate). `thetaTail` is 45, 20, 8, 0 degrees at 22, 24, 30, 36 hpf (estimates from the 26+ somite and prim-5 images, research 05 section 15).

**BG-17.** The axis length `L` is 1.95, 2.05, 2.45, 2.65, 2.80, 2.90, 3.10, 3.25 mm at 22, 24, 30, 36, 42, 48, 60, 72 hpf. Research 05 section 16.4 sets 2.0 mm at 24 hpf (embryo length 1.9 mm, curled). It sets 3.1 mm at 48 hpf and 3.5 mm at 72 hpf. The generator subtracts the caudal fin fold beyond the notochord tip from the 48 and 72 hpf values. The fold is 0.2 and 0.25 mm (research 03e caudal fin record). `L` then equals SL at 72 hpf and grows monotonically into R4. The 48 hpf value 2.90 mm matches the SL that research 03c used for the 48 hpf heart.

**BG-18.** Yolk ball and extension. The sourced rules are ratios (Kimmel via research 05 section 7 and 15); the one free scalar is the ball radius `R(t)`:

```
R(t)      = 0.300, 0.290, 0.280, 0.275, 0.260, 0.240, 0.230, 0.220, 0.200, 0.175, 0.150, 0.125, 0  mm
            at   14,   19,    22,    24,    30,    36,    42,    48,    60,    72,    96,   120, 168 hpf   (research 05 section 7, estimates)
k(t)      = extension length / ball diameter
          = 0.42, 0.60, 0.90, 1.00, 1.10, 1.35, 1.50, 1.48, 1.30, 1.14, 1.17, 0
            at 16,   19,   22,   24,   30,   36,   42,   48,   60,   72,   96, 120 hpf   (Kimmel rules: equal at 24, 1.5 x at 42, cone by 48)
ball centre: u_c = smallest u >= 0.30 such that every head station u_h < u_b satisfies |P(u_h) - C| >= R + 0.6 hV(u_h)
             depth below the spine at u_c = hV(u_c) + R - 0.03
extension:   tube under the ventral skin from u_e0 = u_c + R / L over length k * 2R, centreline depth hV(u) + r(u) - 0.02
             radius r0 at the ball end, r1 at the vent end (table in section 4.3.4); r1 = 0.7 r0 to 42 hpf, then a cone
vent:        ventU = u_e1 to 48 hpf, then 0.60 (60 hpf) rising to 0.62 (120 hpf), 0.61 (336 hpf), 0.60 from 504 hpf
```

The clearance rule places the ball at `u = 0.36` at 24 hpf and `u = 0.30` from 36 hpf. Research 05 section 16.4 estimated 0.30 and 0.27. The 0.6 factor lets the yolk overlap the flattened ventral head, where the pericardium lies between head and yolk. At 48 hpf the extension is 1.48 x the ball diameter. This answers finding 2 of the fact-check report (research 03, "at 42 to 48 hpf extension about 1.5 x ball diameter").

**BG-19.** Chorion. To 19 hpf the chorion is a sphere of radius 0.60 mm centred on the yolk (research 05 section 16.2, estimate). Research 03a gives an inner diameter of 1.2 mm: a measured embryo radius of 397 um plus a 210 um perivitelline space. From 22 hpf the R3 posture is the dechorionated posture of the Kimmel figures, which does not fit inside 1.2 mm. The generator then sets the chorion radius to the smallest sphere that encloses the spine plus 0.15 mm, centred on the spine's bounding box. The chorion fades from 48 to 72 hpf (D8). The open question at the end of this section records the alternative.

#### 4.2.5 R4, free-swimming (72 to 4320 hpf)

**BG-20.** The spine is straight with `L = SL` from the growth table (section 4.4). The head bend is `HTA - 20`, so 5 degrees at 72 hpf, 2 at 96 and 0 from 120 hpf. The profile comes from the four outline templates of research 05 section 16.4. The templates are day 5 at SL 3.6 mm, and SL 6.2, 10 and 28 mm. For a given SL the generator takes the two bracketing templates. It scales each by `(SL / SL_template)^0.9` for `hD` and `hV` and by `(SL / SL_template)^0.8` for `hW` (research 05 section 16.6). It interpolates the two linearly in SL. It then rescales `hD` and `hV` by one factor `g`. After that step the total height at `u = 0.6` equals the height at the anterior of the anal fin (HAA):

```
HAA(SL) = (SL - 4.4) / 3.56  mm        for 6 <= SL <= 18   (Parichy 2009 regression, R^2 0.98, research 05 section 8)
HAA(SL) = 3.82 * SL / 18     mm        for SL > 18         (isometric after maturity, estimate)
g       = HAA(SL) / H_template(0.6);   g = 1 for SL < 6
```

The regression is allometric: HAA grows 2.4 x while SL grows 1.8 x between 10 and 18 mm. A fixed power law cannot reproduce that, so the generator makes the regression the constraint. The generator deepens the posterior half of the SL 10 and SL 28 templates by 10 to 20 percent. HAA is then 0.85 to 0.90 of the maximum depth. The regression requires that ratio at 18 mm SL, where P09 measured 3.64 to 3.95 mm at maturity. The resulting adult proportions at SL 25 mm follow, each against the estimate of research 05 section 13. Maximum depth 6.3 mm (0.25 SL; estimate 0.23). Maximum width 3.2 mm (0.13 SL; estimate 0.13). Head to `u = 0.25` (0.25 SL; estimate 0.25). Total length 1.2 SL (estimate 1.2). Fineness ratio SL / depth: 6.5 at 6.5 mm SL, 4.6 at 12 mm, 3.9 at 18 and 25 mm.

**BG-21.** The yolk ball shrinks to radius 0.125 mm at 120 hpf and fades out by 168 hpf (D8, "yolk exhausted 168 hpf, inferred"). The extension is gone at 120 hpf (research 05 section 7). No yolk exists after 168 hpf. The notochord flexion parameter rises linearly from 0 at 4.5 mm SL to 45 degrees at 6.5 mm SL (research 05 section 8; D8). The growth table places these at 224 and 504 hpf.

#### 4.2.6 Frame convention and blending across regime boundaries

**BG-22.** The generator computes R0 to R2 in the yolk-fixed frame: yolk centre at the origin, animal pole `+y`, dorsal meridian `+x`. It computes R3 and R4 in the body-fixed frame: spine point `u = 0.4` at the origin, tangent `+x`, dorsal normal `+y`. It blends the two frames with one rigid motion whose angle and translation scale by `s = smoothstep((t - 10) / 12)`. `s` is 0 up to 10 hpf and 1 from 22 hpf. The stored control points are world coordinates after this motion. The tangent at `u = 0.4` therefore turns from 72 degrees below `+x` at 10 hpf to `+x` at 22 hpf. The rate is at most 10 degrees per hour. The yolk centre stays inside a 0.4 mm box around the origin from 10 to 120 hpf (generator check). The zygote at 0 hpf shows the blastodisc on top, as in the ZFIN figures.

**BG-23.** Regime boundaries are keyframe pairs; the runtime never evaluates two regimes at once. The parameters that change across each boundary and the window over which the keyframes carry them:

| Boundary | Window (hpf) | Parameters that crossfade | Parameters that appear or vanish |
|---|---|---|---|
| R0 to R1 | 4.0 to 4.66 | cap height 0.15 to shell thickness 0.06 (cap and shell both present, opacity by the structure records); epiboly 0.15 to 0.30; yolk radius | cap becomes null at 4.66; cellCount becomes null at 4.66 |
| R1 to R2 | 9 to 10.33 | epiboly 0.90 to 1.0; shell thickness 0.04 to 0.035; presumptive arc 143 to 180 degrees; trunk profile from shell thickness to 0.05 / 0.03 / 0.12 | shell becomes null at 12; somiteCount starts at 10.33 |
| R2 to R3 | 19 to 24 | spine control points (wrapped to spline); frame motion `s` 0.84 to 1.0 (complete at 22); ball centre from `u = 0.4` to `u = 0.36`; extension ratio 0.60 to 1.00; tail curl 40 to 20 degrees; chorion radius 0.60 to 1.00 | HTA starts at 22 (125 degrees); wrap angle ends at 19 |
| R3 to R4 | 60 to 72 | HTA 35 to 25; extension ratio 1.30 to 1.14; chorion opacity (D8 fade 48 to 72) | chorion null at 72; slMm starts at 72 |

The body model tests (D13) sample every hour. They assert that no station moves more than 0.6 mm per hour of model time and that no value is NaN. The largest measured step is the free tail between 18 and 19 hpf (0.55 mm).

### 4.3 The `body.json` keyframe table

#### 4.3.1 Schema

**BG-24.** `src/data/body.json` holds 32 keyframes. Their times are the 32 values in the first column of the table in section 4.3.2. The zod schema in `src/core/schema.ts`:

```ts
export const BodyKeyframe = z.object({
  hpf: z.number().min(0).max(4320),
  stage: z.string(),                                   // ZFS short label, informational
  regime: z.enum(['R0', 'R1', 'R2', 'R3', 'R4']),
  bodyLengthMm: z.number().positive(),                 // growth table value (D6)
  slMm: z.number().positive().nullable(),              // null before 72 hpf
  axisLengthMm: z.number().positive().nullable(),      // null before 10 hpf
  headTrunkAngleDeg: z.number().nullable(),
  notochordFlexionDeg: z.number().min(0).max(45),
  ventU: z.number().min(0).max(1),
  epibolyFraction: z.number().min(0).max(1),
  somiteCount: z.number().int().min(0).max(34),
  cellCount: z.number().int().nullable(),
  cap: z.object({ baseRadiusMm: z.number(), heightMm: z.number() }).nullable(),
  shellThicknessMm: z.number().nullable(),
  yolkRadiusMm: z.number().nullable(),                 // R0 to R2 sphere; equals ball radius from 14 hpf
  yolkDomeMm: z.number().default(0),
  yolkBall: z.object({ u: z.number(), depthMm: z.number(), radiusMm: z.number() }).nullable(),
  yolkExtension: z.object({ u0: z.number(), u1: z.number(), r0Mm: z.number(), r1Mm: z.number() }).nullable(),
  chorion: z.object({ centre: z.tuple([z.number(), z.number(), z.number()]), radiusMm: z.number() }).nullable(),
  spine: z.array(z.tuple([z.number(), z.number(), z.number()])).min(7),      // [u, x, y] in mm, u ascending, z = 0
  profile: z.array(z.object({
    u: z.number(), hD: z.number(), hV: z.number(), hW: z.number(), exponent: z.number().default(2),
  })).length(9),
  estimate: z.array(z.string()).default([]),           // names of fields that are estimates
  sources: z.array(z.string()),
})
export const BodyFile = z.object({ generatedBy: z.string(), keyframes: z.array(BodyKeyframe).min(24) })
```

**BG-25.** The validator (D13) checks five properties. `hpf` is strictly ascending. `spine[i].u` is strictly ascending from 0 to 1 in every keyframe. `axisLengthMm` and `bodyLengthMm` never decrease after 10 hpf. `profile` has the 9 fixed `u` stations. Every `hD`, `hV` and `hW` is positive. It re-runs `scripts/gen-body.ts` and fails if the regenerated file differs from the checked-in file.

#### 4.3.2 Scalar values per keyframe

The tables below are the generator output. Every value in the yolk, chorion and profile columns is an estimate unless section 4.2 or 4.4 names a source. Body length and SL carry their sources in section 4.4. HTA carries research 05 section 15 and D8.

| hpf | stage | bodyLengthMm | slMm | axisLengthMm | htaDeg | yolkBallDiaMm | yolkExtLenMm | chorionRadiusMm | epibolyFraction | somiteCount | flexionDeg |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1-cell | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 0.75 | 2-cell | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 2.25 | 128-cell | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 3.33 | high | 0.70 | null | null | null | 0.70 | null | 0.60 | 0.00 | 0 | 0 |
| 4.33 | dome | 0.70 | null | null | null | 0.69 | null | 0.60 | 0.20 | 0 | 0 |
| 5.25 | 50%-epiboly | 0.70 | null | null | null | 0.68 | null | 0.60 | 0.50 | 0 | 0 |
| 6 | shield | 0.70 | null | null | null | 0.66 | null | 0.60 | 0.50 | 0 | 0 |
| 8 | 75%-epiboly | 0.70 | null | null | null | 0.66 | null | 0.60 | 0.75 | 0 | 0 |
| 9 | 90%-epiboly | 0.70 | null | null | null | 0.65 | null | 0.60 | 0.90 | 0 | 0 |
| 10 | bud | 0.70 | null | 1.02 | null | 0.65 | null | 0.60 | 1.00 | 0 | 0 |
| 12 | 5-9 somites | 0.80 | null | 1.15 | null | 0.62 | null | 0.60 | 1.00 | 5 | 0 |
| 14 | 10-13 somites | 0.85 | null | 1.26 | null | 0.60 | null | 0.60 | 1.00 | 9 | 0 |
| 16 | 14-19 somites | 0.90 | null | 1.38 | null | 0.60 | 0.25 | 0.60 | 1.00 | 13 | 0 |
| 18 | 14-19 somites | 1.20 | null | 1.66 | null | 0.59 | 0.29 | 0.60 | 1.00 | 17 | 0 |
| 19 | 20-25 somites | 1.40 | null | 1.80 | null | 0.58 | 0.35 | 0.60 | 1.00 | 19 | 0 |
| 22 | 26+ somites | 1.60 | null | 1.95 | 125 | 0.56 | 0.50 | 0.92 | 1.00 | 25 | 0 |
| 24 | prim-5 | 1.90 | null | 2.05 | 120 | 0.55 | 0.55 | 1.00 | 1.00 | 29 | 0 |
| 30 | prim-15 | 2.50 | null | 2.45 | 95 | 0.52 | 0.57 | 1.26 | 1.00 | 31 | 0 |
| 36 | prim-25 | 2.70 | null | 2.65 | 75 | 0.48 | 0.65 | 1.41 | 1.00 | 31 | 0 |
| 42 | high-pec | 2.90 | null | 2.80 | 55 | 0.46 | 0.69 | 1.52 | 1.00 | 31 | 0 |
| 48 | long-pec | 3.10 | null | 2.90 | 45 | 0.44 | 0.65 | 1.58 | 1.00 | 31 | 0 |
| 60 | pec-fin | 3.30 | null | 3.10 | 35 | 0.40 | 0.52 | 1.69 | 1.00 | 31 | 0 |
| 72 | protruding-mouth | 3.50 | 3.25 | 3.25 | 25 | 0.35 | 0.40 | null | 1.00 | 31 | 0 |
| 96 | day 4 | 3.70 | 3.40 | 3.40 | 22 | 0.30 | 0.35 | null | 1.00 | 31 | 0 |
| 120 | day 5 | 3.90 | 3.60 | 3.60 | 20 | 0.25 | 0.00 | null | 1.00 | 31 | 0 |
| 168 | day 7 | 4.50 | 4.10 | 4.10 | 20 | null | null | null | 1.00 | 31 | 0 |
| 336 | day 14 | 6.20 | 5.30 | 5.30 | 20 | null | null | null | 1.00 | 31 | 18 |
| 504 | day 21 | 7.80 | 6.50 | 6.50 | 20 | null | null | null | 1.00 | 31 | 45 |
| 720 | day 30 | 10.00 | 8.20 | 8.20 | 20 | null | null | null | 1.00 | 31 | 45 |
| 1080 | day 45 | 14.00 | 12.00 | 12.00 | 20 | null | null | null | 1.00 | 31 | 45 |
| 2160 | day 90 | 21.60 | 18.00 | 18.00 | 20 | null | null | null | 1.00 | 31 | 45 |
| 4320 | day 180 | 30.00 | 25.00 | 25.00 | 20 | null | null | null | 1.00 | 31 | 45 |

#### 4.3.3 Spine control points

Nine control points per keyframe as `x, y` in mm at `u = 0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0` (`z = 0`). World frame per BG-22. The runtime may use these nine points directly as the Catmull-Rom control points (BG-01).

| hpf | u=0 | 0.1 | 0.2 | 0.35 | 0.5 | 0.65 | 0.8 | 0.9 | 1.0 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.00, 0.45 | 0.05, 0.45 | 0.09, 0.44 | 0.16, 0.42 | 0.22, 0.39 | 0.28, 0.35 | 0.33, 0.31 | 0.36, 0.27 | 0.39, 0.23 |
| 0.75 | 0.00, 0.45 | 0.04, 0.45 | 0.09, 0.45 | 0.15, 0.43 | 0.21, 0.40 | 0.27, 0.37 | 0.32, 0.32 | 0.35, 0.29 | 0.38, 0.25 |
| 2.25 | 0.00, 0.48 | 0.04, 0.48 | 0.08, 0.48 | 0.14, 0.46 | 0.20, 0.44 | 0.25, 0.41 | 0.30, 0.38 | 0.33, 0.35 | 0.36, 0.32 |
| 3.33 | 0.00, 0.50 | 0.04, 0.50 | 0.08, 0.49 | 0.14, 0.48 | 0.19, 0.46 | 0.25, 0.43 | 0.30, 0.40 | 0.33, 0.38 | 0.36, 0.35 |
| 4.33 | 0.00, 0.40 | 0.05, 0.39 | 0.10, 0.38 | 0.17, 0.36 | 0.23, 0.32 | 0.29, 0.27 | 0.34, 0.21 | 0.36, 0.17 | 0.38, 0.12 |
| 5.25 | 0.00, 0.37 | 0.06, 0.36 | 0.11, 0.35 | 0.19, 0.31 | 0.26, 0.26 | 0.31, 0.19 | 0.35, 0.11 | 0.36, 0.06 | 0.37, 0.00 |
| 6 | 0.00, 0.36 | 0.06, 0.35 | 0.11, 0.34 | 0.19, 0.30 | 0.25, 0.25 | 0.30, 0.19 | 0.34, 0.11 | 0.35, 0.06 | 0.36, 0.00 |
| 8 | 0.00, 0.35 | 0.07, 0.34 | 0.14, 0.32 | 0.23, 0.26 | 0.30, 0.17 | 0.34, 0.07 | 0.35, -0.04 | 0.33, -0.11 | 0.30, -0.18 |
| 9 | 0.00, 0.35 | 0.09, 0.34 | 0.17, 0.30 | 0.27, 0.22 | 0.33, 0.11 | 0.35, -0.02 | 0.32, -0.14 | 0.27, -0.22 | 0.21, -0.28 |
| 10 | 0.00, 0.32 | 0.10, 0.31 | 0.19, 0.26 | 0.29, 0.15 | 0.32, 0.00 | 0.29, -0.15 | 0.19, -0.26 | 0.10, -0.31 | 0.00, -0.32 |
| 12 | -0.05, 0.28 | 0.06, 0.28 | 0.17, 0.23 | 0.28, 0.10 | 0.30, -0.07 | 0.24, -0.23 | 0.11, -0.33 | -0.00, -0.36 | -0.12, -0.34 |
| 14 | -0.18, 0.17 | -0.06, 0.19 | 0.06, 0.17 | 0.21, 0.05 | 0.26, -0.12 | 0.21, -0.30 | 0.07, -0.42 | -0.06, -0.45 | -0.18, -0.42 |
| 16 | -0.33, -0.02 | -0.21, 0.06 | -0.08, 0.09 | 0.11, 0.03 | 0.23, -0.14 | 0.23, -0.34 | 0.11, -0.50 | -0.01, -0.56 | -0.15, -0.56 |
| 18 | -0.42, -0.29 | -0.36, -0.14 | -0.24, -0.03 | 0.00, -0.00 | 0.20, -0.15 | 0.25, -0.39 | 0.15, -0.61 | 0.05, -0.75 | -0.05, -0.88 |
| 19 | -0.40, -0.42 | -0.39, -0.24 | -0.29, -0.10 | -0.04, -0.01 | 0.19, -0.13 | 0.35, -0.35 | 0.45, -0.60 | 0.49, -0.77 | 0.50, -0.95 |
| 22 | -0.39, -0.46 | -0.43, -0.27 | -0.36, -0.09 | -0.10, 0.00 | 0.19, 0.00 | 0.49, 0.00 | 0.78, -0.03 | 0.96, -0.10 | 1.11, -0.22 |
| 24 | -0.44, -0.48 | -0.47, -0.28 | -0.38, -0.09 | -0.10, 0.00 | 0.20, 0.00 | 0.51, 0.00 | 0.82, -0.01 | 1.02, -0.05 | 1.22, -0.11 |
| 30 | -0.70, -0.50 | -0.63, -0.27 | -0.47, -0.09 | -0.12, 0.00 | 0.24, 0.00 | 0.61, 0.00 | 0.98, -0.01 | 1.22, -0.02 | 1.47, -0.05 |
| 36 | -0.89, -0.44 | -0.73, -0.22 | -0.52, -0.07 | -0.13, 0.00 | 0.26, 0.00 | 0.66, 0.00 | 1.06, 0.00 | 1.33, 0.00 | 1.59, 0.00 |
| 42 | -1.05, -0.31 | -0.81, -0.16 | -0.56, -0.05 | -0.14, 0.00 | 0.28, 0.00 | 0.70, 0.00 | 1.12, 0.00 | 1.40, 0.00 | 1.68, 0.00 |
| 48 | -1.12, -0.24 | -0.86, -0.12 | -0.58, -0.03 | -0.15, 0.00 | 0.29, 0.00 | 0.72, 0.00 | 1.16, 0.00 | 1.45, 0.00 | 1.74, 0.00 |
| 60 | -1.22, -0.15 | -0.92, -0.08 | -0.62, -0.02 | -0.16, 0.00 | 0.31, 0.00 | 0.78, 0.00 | 1.24, 0.00 | 1.55, 0.00 | 1.86, 0.00 |
| 72 | -1.30, -0.05 | -0.97, -0.03 | -0.65, -0.01 | -0.16, 0.00 | 0.32, 0.00 | 0.81, 0.00 | 1.30, 0.00 | 1.63, 0.00 | 1.95, 0.00 |
| 96 | -1.36, -0.02 | -1.02, -0.01 | -0.68, -0.00 | -0.17, 0.00 | 0.34, 0.00 | 0.85, 0.00 | 1.36, 0.00 | 1.70, 0.00 | 2.04, 0.00 |
| 120 | -1.44, 0.00 | -1.08, 0.00 | -0.72, 0.00 | -0.18, 0.00 | 0.36, 0.00 | 0.90, 0.00 | 1.44, 0.00 | 1.80, 0.00 | 2.16, 0.00 |
| 168 | -1.64, 0.00 | -1.23, 0.00 | -0.82, 0.00 | -0.21, 0.00 | 0.41, 0.00 | 1.02, 0.00 | 1.64, 0.00 | 2.05, 0.00 | 2.46, 0.00 |
| 336 | -2.12, 0.00 | -1.59, 0.00 | -1.06, 0.00 | -0.27, 0.00 | 0.53, 0.00 | 1.33, 0.00 | 2.12, 0.00 | 2.65, 0.00 | 3.18, 0.00 |
| 504 | -2.60, 0.00 | -1.95, 0.00 | -1.30, 0.00 | -0.33, 0.00 | 0.65, 0.00 | 1.62, 0.00 | 2.60, 0.00 | 3.25, 0.00 | 3.90, 0.00 |
| 720 | -3.28, 0.00 | -2.46, 0.00 | -1.64, 0.00 | -0.41, 0.00 | 0.82, 0.00 | 2.05, 0.00 | 3.28, 0.00 | 4.10, 0.00 | 4.92, 0.00 |
| 1080 | -4.80, 0.00 | -3.60, 0.00 | -2.40, 0.00 | -0.60, 0.00 | 1.20, 0.00 | 3.00, 0.00 | 4.80, 0.00 | 6.00, 0.00 | 7.20, 0.00 |
| 2160 | -7.20, 0.00 | -5.40, 0.00 | -3.60, 0.00 | -0.90, 0.00 | 1.80, 0.00 | 4.50, 0.00 | 7.20, 0.00 | 9.00, 0.00 | 10.80, 0.00 |
| 4320 | -10.00, 0.00 | -7.50, 0.00 | -5.00, 0.00 | -1.25, 0.00 | 2.50, 0.00 | 6.25, 0.00 | 10.00, 0.00 | 12.50, 0.00 | 15.00, 0.00 |

#### 4.3.4 Profile values

`hD / hV / hW` in mm at the nine stations. Before 22 hpf the values are the R2 tube (BG-14). From 22 to 120 hpf they interpolate the research 05 section 16.4 outline tables; from 168 hpf they follow BG-20.

| hpf | u=0 | 0.1 | 0.2 | 0.35 | 0.5 | 0.65 | 0.8 | 0.9 | 1.0 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 0.75 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 2.25 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 3.33 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 4.33 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 5.25 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 6 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 8 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 9 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 10 | 0.03/0.03/0.03 | 0.08/0.03/0.10 | 0.06/0.03/0.11 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.05/0.03/0.12 | 0.04/0.03/0.10 | 0.05/0.05/0.05 |
| 12 | 0.03/0.03/0.03 | 0.11/0.04/0.12 | 0.08/0.04/0.12 | 0.07/0.04/0.11 | 0.07/0.04/0.11 | 0.07/0.04/0.11 | 0.07/0.04/0.11 | 0.06/0.03/0.10 | 0.05/0.05/0.05 |
| 14 | 0.03/0.03/0.03 | 0.14/0.06/0.14 | 0.10/0.05/0.12 | 0.08/0.05/0.11 | 0.08/0.05/0.11 | 0.08/0.05/0.11 | 0.08/0.05/0.11 | 0.07/0.04/0.09 | 0.05/0.05/0.05 |
| 16 | 0.03/0.03/0.03 | 0.16/0.08/0.16 | 0.12/0.07/0.12 | 0.10/0.06/0.10 | 0.10/0.06/0.10 | 0.10/0.06/0.10 | 0.10/0.06/0.10 | 0.09/0.05/0.09 | 0.05/0.05/0.05 |
| 18 | 0.03/0.03/0.03 | 0.17/0.09/0.17 | 0.14/0.08/0.13 | 0.11/0.07/0.10 | 0.11/0.07/0.10 | 0.11/0.07/0.10 | 0.11/0.07/0.10 | 0.10/0.06/0.09 | 0.05/0.05/0.05 |
| 19 | 0.03/0.03/0.03 | 0.18/0.10/0.18 | 0.14/0.08/0.13 | 0.12/0.07/0.10 | 0.12/0.07/0.10 | 0.12/0.07/0.10 | 0.12/0.07/0.10 | 0.10/0.06/0.09 | 0.05/0.05/0.05 |
| 22 | 0.05/0.05/0.05 | 0.18/0.16/0.18 | 0.20/0.15/0.17 | 0.13/0.10/0.09 | 0.11/0.08/0.07 | 0.10/0.07/0.05 | 0.08/0.06/0.04 | 0.06/0.05/0.03 | 0.02/0.02/0.01 |
| 24 | 0.05/0.05/0.05 | 0.18/0.16/0.18 | 0.20/0.15/0.17 | 0.13/0.10/0.09 | 0.11/0.08/0.07 | 0.10/0.07/0.05 | 0.08/0.06/0.04 | 0.06/0.05/0.03 | 0.02/0.02/0.01 |
| 30 | 0.05/0.05/0.05 | 0.19/0.17/0.19 | 0.21/0.16/0.18 | 0.14/0.10/0.09 | 0.12/0.09/0.07 | 0.10/0.08/0.06 | 0.08/0.07/0.04 | 0.06/0.05/0.03 | 0.02/0.02/0.01 |
| 36 | 0.06/0.06/0.06 | 0.20/0.18/0.20 | 0.22/0.16/0.18 | 0.14/0.11/0.10 | 0.12/0.09/0.08 | 0.10/0.08/0.06 | 0.08/0.07/0.04 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 42 | 0.06/0.06/0.06 | 0.21/0.19/0.21 | 0.23/0.17/0.19 | 0.15/0.11/0.10 | 0.12/0.10/0.08 | 0.11/0.09/0.06 | 0.09/0.07/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 48 | 0.06/0.06/0.06 | 0.22/0.20/0.22 | 0.24/0.18/0.20 | 0.15/0.12/0.10 | 0.13/0.10/0.08 | 0.11/0.10/0.07 | 0.09/0.08/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 60 | 0.07/0.07/0.07 | 0.23/0.21/0.23 | 0.25/0.19/0.21 | 0.16/0.12/0.11 | 0.14/0.11/0.08 | 0.12/0.10/0.07 | 0.10/0.08/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 72 | 0.08/0.08/0.07 | 0.24/0.22/0.24 | 0.26/0.20/0.21 | 0.16/0.14/0.11 | 0.14/0.11/0.09 | 0.12/0.10/0.07 | 0.10/0.08/0.05 | 0.07/0.06/0.03 | 0.02/0.02/0.01 |
| 96 | 0.09/0.09/0.08 | 0.25/0.23/0.25 | 0.27/0.21/0.21 | 0.17/0.15/0.12 | 0.15/0.12/0.10 | 0.13/0.10/0.07 | 0.11/0.08/0.05 | 0.08/0.06/0.03 | 0.02/0.02/0.01 |
| 120 | 0.10/0.10/0.08 | 0.26/0.24/0.26 | 0.28/0.22/0.22 | 0.18/0.15/0.12 | 0.16/0.13/0.10 | 0.14/0.10/0.07 | 0.11/0.08/0.05 | 0.08/0.06/0.03 | 0.02/0.02/0.01 |
| 168 | 0.11/0.11/0.09 | 0.30/0.27/0.29 | 0.32/0.26/0.25 | 0.22/0.19/0.15 | 0.19/0.16/0.12 | 0.16/0.12/0.09 | 0.13/0.09/0.06 | 0.09/0.07/0.04 | 0.02/0.02/0.01 |
| 336 | 0.13/0.13/0.11 | 0.38/0.34/0.35 | 0.42/0.35/0.32 | 0.32/0.29/0.22 | 0.27/0.23/0.17 | 0.22/0.16/0.13 | 0.17/0.12/0.08 | 0.12/0.09/0.05 | 0.04/0.04/0.02 |
| 504 | 0.16/0.16/0.13 | 0.48/0.43/0.42 | 0.54/0.46/0.40 | 0.44/0.42/0.30 | 0.38/0.33/0.24 | 0.31/0.22/0.17 | 0.22/0.16/0.11 | 0.17/0.12/0.07 | 0.05/0.05/0.02 |
| 720 | 0.22/0.22/0.16 | 0.69/0.63/0.53 | 0.80/0.69/0.52 | 0.72/0.68/0.42 | 0.66/0.56/0.35 | 0.56/0.42/0.25 | 0.38/0.28/0.16 | 0.27/0.22/0.10 | 0.08/0.08/0.03 |
| 1080 | 0.34/0.34/0.23 | 1.12/1.05/0.76 | 1.34/1.21/0.77 | 1.33/1.26/0.69 | 1.30/1.08/0.58 | 1.13/0.88/0.42 | 0.71/0.55/0.27 | 0.50/0.43/0.17 | 0.15/0.15/0.06 |
| 2160 | 0.53/0.53/0.33 | 1.86/1.73/1.08 | 2.27/2.07/1.14 | 2.35/2.24/1.06 | 2.32/1.95/0.89 | 2.00/1.60/0.64 | 1.24/0.98/0.41 | 0.87/0.77/0.28 | 0.27/0.27/0.11 |
| 4320 | 0.62/0.62/0.45 | 2.41/2.21/1.44 | 2.99/2.77/1.60 | 3.23/3.08/1.53 | 3.22/2.73/1.31 | 2.74/2.24/0.92 | 1.68/1.37/0.61 | 1.18/1.07/0.43 | 0.39/0.39/0.17 |

#### 4.3.5 Yolk placement in body coordinates

`ballU` and `ballDepthMm` place the ball centre below the spine; `extU0` to `extU1` is the extension range; `ventU` is the vent (BG-18). Before 22 hpf the extension follows the wrapped spine.

| hpf | ballU | ballDepthMm | ballRadiusMm | extU0 | extU1 | extR0Mm | extR1Mm | ventU |
|---|---|---|---|---|---|---|---|---|
| 14 | 0.40 | 0.32 | 0.300 | null | null | null | null | null |
| 16 | 0.40 | 0.33 | 0.300 | 0.62 | 0.80 | 0.110 | 0.080 | null |
| 18 | 0.40 | 0.33 | 0.295 | 0.58 | 0.76 | 0.110 | 0.078 | null |
| 19 | 0.40 | 0.33 | 0.290 | 0.56 | 0.75 | 0.110 | 0.077 | null |
| 22 | 0.37 | 0.34 | 0.280 | 0.51 | 0.77 | 0.110 | 0.073 | 0.77 |
| 24 | 0.36 | 0.34 | 0.275 | 0.49 | 0.76 | 0.100 | 0.071 | 0.76 |
| 30 | 0.31 | 0.35 | 0.260 | 0.42 | 0.65 | 0.090 | 0.064 | 0.65 |
| 36 | 0.30 | 0.33 | 0.240 | 0.39 | 0.64 | 0.080 | 0.057 | 0.64 |
| 42 | 0.30 | 0.33 | 0.230 | 0.38 | 0.63 | 0.070 | 0.050 | 0.63 |
| 48 | 0.30 | 0.33 | 0.220 | 0.38 | 0.60 | 0.070 | 0.020 | 0.60 |
| 60 | 0.30 | 0.32 | 0.200 | 0.36 | 0.53 | 0.050 | 0.015 | 0.60 |
| 72 | 0.30 | 0.30 | 0.175 | 0.35 | 0.48 | 0.040 | 0.010 | 0.61 |
| 96 | 0.30 | 0.29 | 0.150 | 0.34 | 0.45 | 0.025 | 0.010 | 0.61 |
| 120 | 0.30 | 0.27 | 0.125 | null | null | null | null | 0.62 |

### 4.4 The growth table (D6)

**BG-26.** `stages.json` holds one table `growth` with rows `{hpf, bodyLengthMm, measure, slMm, source}` at the 32 keyframe times. `bodyLengthMm` is the Kimmel embryo length (EL, greatest linear dimension of the fixed embryo) to 60 hpf. It is the ZFIN total length (TL) from 72 to 720 hpf. It is `1.2 x SL` from 1080 hpf, because adult TL is SL plus a 6 mm caudal fin (research 05 section 13). `slMm` is null before 72 hpf. From 72 to 720 hpf it is TL minus the caudal extent beyond the notochord end. That extent is 0.25, 0.30, 0.30, 0.40, 0.9, 1.3, 1.8 mm at 72, 96, 120, 168, 336, 504, 720 hpf. Sources: research 03e caudal fin record and research 05 section 16.4 (estimates). From 1080 hpf it is the Singleman and Holtzman threshold (D6). The runtime interpolates the table linearly in hpf. Every SL-defined event and every `sizeRefSl` rescale reads SL from this one table. The table owns the placement of SL-defined events.

| hpf | stage | bodyLengthMm | measure | slMm | source |
|---|---|---|---|---|---|
| 0 | 1-cell | 0.7 | egg diameter | null | ZFIN zygote page (research 05 section 2) |
| 0.75 | 2-cell | 0.7 | egg diameter | null | same |
| 2.25 | 128-cell | 0.7 | egg diameter | null | same |
| 3.33 | high | 0.7 | egg diameter | null | same |
| 4.33 | dome | 0.7 | egg diameter | null | same |
| 5.25 | 50%-epiboly | 0.7 | egg diameter | null | same |
| 6 | shield | 0.7 | egg diameter | null | same |
| 8 | 75%-epiboly | 0.7 | egg diameter | null | same |
| 9 | 90%-epiboly | 0.7 | egg diameter | null | same |
| 10 | bud | 0.7 | egg diameter | null | same |
| 12 | 5-9 somites | 0.8 | EL | null | Kimmel, "same as the zygote" (research 05 section 5.1) |
| 14 | 10-13 somites | 0.85 | EL | null | estimate between 0.8 and 0.9 |
| 16 | 14-19 somites | 0.9 | EL | null | Kimmel Table 1 (research 05 section 5.1) |
| 18 | 14-19 somites | 1.2 | EL | null | estimate between 0.9 and 1.4 |
| 19 | 20-25 somites | 1.4 | EL | null | Kimmel Table 1 |
| 22 | 26+ somites | 1.6 | EL | null | Kimmel Table 1 |
| 24 | prim-5 | 1.9 | EL | null | Kimmel Table 1 |
| 30 | prim-15 | 2.5 | EL | null | Kimmel Table 1 |
| 36 | prim-25 | 2.7 | EL | null | Kimmel Table 1 |
| 42 | high-pec | 2.9 | EL | null | Kimmel Table 1 |
| 48 | long-pec | 3.1 | EL | null | Kimmel Table 1 |
| 60 | pec-fin | 3.3 | EL | null | Kimmel Table 1 |
| 72 | protruding-mouth | 3.5 | TL | 3.25 | ZFIN index page (research 05 section 5.1); SL derived |
| 96 | day 4 | 3.7 | TL | 3.40 | ZFIN index page; SL derived |
| 120 | day 5 | 3.9 | TL | 3.60 | ZFIN index page; T25 mean 3.90 mm; SL derived (research 05 section 16.4 estimates 3.6) |
| 168 | day 7 | 4.5 | TL | 4.10 | ZFIN index page; SL derived |
| 336 | day 14 | 6.2 | TL | 5.30 | ZFIN index page; SL derived |
| 504 | day 21 | 7.8 | TL | 6.50 | ZFIN index page; SL derived; matches the L1 to L2 transition near 6.5 mm SL at 21 dpf (SH14 via research 02 section 3.2) |
| 720 | day 30 | 10.0 | TL | 8.20 | ZFIN index page; SL derived |
| 1080 | day 45 | 14.4 | 1.2 x SL | 12.0 | SH14 juvenile threshold (D6); ZFIN TL 14 mm |
| 2160 | day 90 | 21.6 | 1.2 x SL | 18.0 | SH14 adult threshold (D6) |
| 4320 | day 180 | 30.0 | 1.2 x SL | 25.0 | SH14 180 dpf value (D6) |

**BG-27.** The SL-defined events of D8 and D9 resolve through this table by linear interpolation:

| event | SL (mm) | hpf |
|---|---|---|
| notochord flexion starts | 4.5 | 224 |
| caudal fin rays | 4.9 | 280 |
| median fin fold handoff | 5.2 to 6.6 | 322 to 517 |
| metamorphic melanophores | 5.9 | 420 |
| notochord flexion complete | 6.5 | 504 |
| pelvic fin bud | 7.2 | 593 |
| squamation onset | 8.6 | 758 |
| adult stripes complete | 9.6 | 853 |
| juvenile | 11.0 | 985 |
 Research 02 section 3.1 places the juvenile milestone at 28 to 45 dpf (672 to 1080 hpf); 985 hpf falls inside that window. The validator prints this list so that a change to the table is visible in review.

### 4.5 Primitive catalogue

**BG-29.** Every primitive builder implements one interface in `src/core/primitives/`:

```ts
export type Lod = 'interactive' | 'final'

export interface PrimitiveBuilder<P> {
  readonly kind: string
  build(params: P, frame: BodyFrame, lod: Lod): BufferGeometry   // positions, normals, uv, index
  vertexCount(lod: Lod, params: P): number                       // exact, for the budget check
}

export interface Placement { u: number; v: number; w: number; yawDeg?: number; pitchDeg?: number; rollDeg?: number }
export type Size = number | { value: number; unit: 'mm' | 'bodyHeightFraction'; sizeRefSl?: number }
```

Every builder writes a `normal` attribute from a closed form and never calls `computeVertexNormals()` (D3). Every builder writes a `uv` attribute (`u` along the primitive's long axis, `v` around it) for stripes and gradients. Row and radial counts depend only on `kind` and `lod`, never on the parameters. A structure therefore keeps its vertex count across time (research 06 section 3). Vertex counts below are `(rows + 1) x (radial + 1)`; the seam column is duplicated for the uv wrap.

| kind | parameters | interactive rows x radial | final rows x radial | vertices interactive / final | analytic normal |
|---|---|---|---|---|---|
| ellipsoid | `placement`, `radii: [Size, Size, Size]` | 12 x 16 | 24 x 32 | 221 / 825 | `normalize(x / a^2, y / b^2, z / c^2)` in the local frame, then rotated |
| superellipsoid | as ellipsoid plus `e1`, `e2` (north-south and east-west exponents, 0.3 to 2.5) | 12 x 16 | 24 x 32 | 221 / 825 | Barr form: `n = (c(eta, 2 - e1) c(omega, 2 - e2) / a, s(eta, 2 - e1) / b, c(eta, 2 - e1) s(omega, 2 - e2) / c)`, with `c(x, e) = sign(cos x) abs(cos x)^e` |
| tube | `path`: `{type: 'spine', uStart, uEnd, v, w}` or `{type: 'spline', points: Placement[]}`; `radius`: `Size`, `{r0, r1}` linear, or `'body'` (uses `hD`, `hV`, `hW`); `ellipticity`; `caps: 'none' | 'round' | 'flat'` | 24 x 8 | 48 x 12 | 225 / 637 plus 2 cap vertices | cross product of the partials: `dP/dtheta = r (-sin N + cos B)`, `dP/ds = T (1 - r kappa cos theta) + r' (cos N + sin B)` |
| lathe | `placement`, `profile: [r, y][]` (6 to 10 points, 2D Catmull-Rom), `phiLengthDeg` (default 360), `axis` (local `y`) | 16 x 12 | 32 x 24 | 221 / 825 | `(cos phi dy, -dr, sin phi dy)` normalized, from the profile derivative `(dr, dy)` |
| segmentArray | `template` (any kind above), `uStart`, `uEnd`, `count: Size` (interpolation type `count`), `mirror: boolean`, `perIndex: {scale, offsetV, chevronDeg}` | template counts | template counts | `count x template` | template normal, rotated by the instance matrix; one `InstancedMesh` per array |
| sheet | `base`: `{uStart, uEnd, side: 'dorsal' | 'ventral' | 'lateral', w}`; `outline: [chord, span][]` closed 2D spline; `thicknessBaseMm`, `thicknessEdgeMm` (floor 0.004); `rakeDeg` | 12 x 6, two faces plus rim | 24 x 8, two faces plus rim | 254 / 578 | face normal = normalized cross product of the ruled-surface partials, `+` for one face and `-` for the other; rim normal in the outline plane |
| shell | `centre`, `innerRadiusMm`, `thicknessMm`, `polarDeg` (coverage from the pole), `azimuthDeg` (default 360) | 12 x 24, two surfaces plus rim | 24 x 48, two surfaces plus rim | 700 / 2548 | radial `+r` outside, `-r` inside; rim normal along `-theta` |

**BG-30.** The `tube` builder with `radius: 'body'` sweeps the body's own cross-section (`hD`, `hV`, `hW`, superellipse exponent). It builds the whole-organism skin, the trunk and the tail regions. Its rows are 64 (interactive) and 128 (final) and its radial count 24 and 32; 1625 and 4257 vertices. Research 06 section 4 measured 0.40 ms for a 64 x 24 sweep with face normals. Analytic normals remove the `computeVertexNormals` cost, which was 65 percent of that time.

**BG-31.** The tube radius never reaches zero. The builder clamps the radius to 0.004 mm. It closes each end with one cap vertex whose normal is `+T` or `-T` (research 06 section 3, "do not taper to zero").

**BG-32.** The `segmentArray` builder places instance `i` at `u_i = uStart + (i + 0.5) (uEnd - uStart) / count` and orients it by `frameAt(u_i)`. When `mirror` is true it places two instances per index, mirrored across `w`. The visible instance count is `ceil(count)`; the last instance scales by `count - floor(count)` (section 4.7).

**BG-33.** A `lathe` with `phiLengthDeg = 360` and the yolk profile (bulge plus tail) builds the yolk ball and extension as one mesh. Research 06 section 3 gives the reason: a sphere-tube junction shows a crease under transparency. The yolk builder reads `frame.yolk` and needs no keyframes of its own.

### 4.6 Custom builders

Custom builders share the `PrimitiveBuilder` interface and live in `src/core/primitives/custom/`. Each returns one `BufferGeometry` with the same attribute set as the primitives. Sizes are in mm at the reference SL of the keyframe.

**BG-34.** `heartLoop`. Parameters:

```ts
interface HeartLoopParams {
  placement: Placement                           // venous pole anchor, u 0.16 to 0.27, v about -0.7
  stage: 'cone' | 'tube' | 'C' | 'S' | 'chambers' // step type; drives the info-card alias only
  coneBaseRadiusMm: Size; coneHeightMm: Size     // stage cone: a shallow cone on the midline, apex ventral
  tubeLengthMm: Size                              // straight length venous pole to arterial pole
  headingDeg: number                              // yaw of the tube from +x toward the left, 15 at 24 hpf
  bendDeg: number                                 // turn at the atrioventricular canal: 0 (straight), 90 (C), 130 to 140 (S)
  twistDeg: number                                // dextral twist of the ventricle limb, 0 to 30
  segments: {                                      // fractions of the centreline and radii per chamber
    sinusVenosus: { s0: number; s1: number; rMm: Size }
    atrium:       { s0: number; s1: number; rMm: Size; rAcrossMm: Size }
    avCanal:      { s0: number; s1: number; rMm: Size }
    ventricle:    { s0: number; s1: number; rMm: Size; rAcrossMm: Size; exponent: number }   // exponent 0.7 boxy larva, 1.0 round adult
    bulbus:       { s0: number; s1: number; rBaseMm: Size; rNeckMm: Size; tiltDeg: number }  // pear, tilt 30 to 35 anterior-dorsal
  }
  atriumOffset: { v: number; w: number }           // atrium left-dorsal at 48 hpf (w -0.3), posterior-dorsal from 120 hpf
}
```

The builder computes five centreline points: venous pole, atrium centre, AV canal, ventricle centre and outflow. It derives them from `tubeLengthMm`, `headingDeg`, `bendDeg`, `twistDeg` and `atriumOffset`. It fits a Catmull-Rom through them and sweeps a tube (24 x 12 interactive, 48 x 16 final). The radius per `s` is the piecewise-linear blend of the chamber radii. It exposes `segmentRange(chamber)` so that a chamber record (`kind: 'heartChamber'`, `sourceId`, `chamber`) builds only its `s` range from the same parameters (D9). Looping starts at 30 hpf (D8); `bendDeg` stays 0 before that (fact-check finding 4, research 03).

**BG-35.** `gutSpline`. Parameters:

- `path`: points from the mouth (`u` 0.12) to the vent (`ventU`).
- `radius` per segment (`esophagus`, `intestinalBulb`, `midIntestine`, `posteriorIntestine`), each with an `s` range.
- `bulbOffsetW`: the bulb sits to the left in the larva.
- `loops`: 0 in the larva, 1 from 504 hpf, 3 in the adult (research 03d intestine record).
- `attachments`: named faces on the tube surface at a given `s` and `thetaDeg`. The liver uses the left face at `s` 0.25 to 0.36. The pancreas uses the right-dorsal face at `s` 0.30 to 0.45. The gall bladder uses the right-ventral face.

An attachment returns a `Placement` on the gut surface at time `t`. The liver and pancreas records place their ellipsoids at that placement plus their own offset. The organs therefore follow the gut when it loops. Tessellation as the tube.

**BG-36.** `eyeCup`. Parameters:

- `placement`: `u` 0.10, `w` +-0.8.
- `outerDiameterMm`, `depthMm`, `stage: 'vesicle' | 'cup' | 'eye'`.
- `fissureDeg`: the choroid fissure width; it closes by 48 hpf.
- `lensDiameterMm`, `lensProtrusion` (0 to 0.4 of the lens radius beyond the cup rim).
- `rpeThicknessMm`, `retinaThicknessMm`.

The builder returns three sub-ranges that the lens, retina and retinal pigment epithelium (RPE) records address by `part`. The RPE is a thin outer lathe shell, the retina a thick inner shell, the lens a sphere. Sizes come from the research 03b eye and lens records. Cup 0.17 mm at 24 hpf; eye 0.23 at 48, 0.30 at 120 hpf, 2.5 mm adult. Lens 0.063 at 24, 0.10 at 120 hpf, 0.16 at 15 dpf, 0.9 mm adult. RPE opacity 0 at 22 hpf to 1 at 36 hpf is a material parameter set by the record.

**BG-37.** `earVesicle`. Parameters:

- `placement`: `u` 0.22 at 24 hpf, 0.21 at 48 hpf.
- `lengthMm`, `widthMm`, `heightMm`, `wallMm`.
- `otoliths: [{diameterMm, pole: 'anterior' | 'posterior'}]`.
- `pillarLength`: 0 to 1; the projections grow from 45 to 72 hpf.
- `canals: {loopDiameterMm, tubeDiameterMm, present: boolean}`: three orthogonal tori on the dorsal vestibule.

Sizes come from research 03b. The otic vesicle is 0.07 x 0.045 x 0.055 mm at 24 hpf and 0.13 x 0.09 x 0.11 mm at 48 hpf. The canal loop is 0.09 mm at 72 hpf. The adult ear is 2.3 mm long. The otoliths are white (D10).

**BG-38.** `somiteChevron`. The template of the somite and myotome arrays. Parameters:

- `lengthMm` along `u`; `widthMm`.
- `heightFraction`: body height fraction, 1.0 for myotomes.
- `chevronDeg`: 0 (cuboid) at formation, 40 for segments 8 to 15 by 26 hpf (research 03a somite record).
- `wFold`: 0 in the larva, 1 for the adult W-shape.
- `apexU`: the apex points anteriorly.

The builder returns a prism with the chevron cut on the anterior and posterior faces (8 x 8, 81 vertices, research 06 section 3). The array gives segment `i` a `chevronDeg` that ramps over 2 h, starting 4 h after the segment formed. Segments 1 and 2 stay straight.

**BG-39.** `finSheet`. A `sheet` with fin-specific parameters:

- `base` on the body: `uStart`, `uEnd`, side.
- `outline` as `[chord, span]` points; chord runs along the base, span outward.
- `rakeDeg`: the pectoral fin swings from lateral at 30 hpf to posterior at 60 hpf.
- `rays: {count, lengthFraction, thicknessMm}`: a `segmentArray` of tapered rods inside the sheet from the base to the margin. No rays exist before 4.9 mm SL.
- `forkDepthFraction`: caudal fin only, 0 to 0.05 SL from 6.4 mm SL.
- `lobes: 1 | 2`.

The median fin fold is one `finSheet`. Its base runs from `u = 0.27` (somite 8) over the tail tip to the vent on the ventral side. Its height profile comes from the research 03a median fin fold record. The maximum height is 0.06 mm at 24 hpf, 0.20 mm at 48 hpf and 0.25 mm at 120 hpf.

**BG-40.** `primordiumMover`. Parameters:

- `placement` at `u(t)` on the horizontal myoseptum (`v = 0`, `w = +-1`).
- `lengthMm 0.10`, `widthMm 0.04`, `heightMm 0.02`.
- `speedMmPerHour 0.1`, `startHpf 20`, `startU 0.30`.
- `deposits: {everySomites: 6, neuromastDiameterMm: 0.05}`.

The builder returns a flattened teardrop superellipsoid. The record's keyframes give `u` at 20, 24, 30, 36 and 42 hpf. Those match myotome 3, 5, 15, 25 and the tail tip (research 03b posterior lateral line primordium record). Deposited neuromasts are a separate `segmentArray` whose `count` steps up as the primordium passes each deposit point.

### 4.7 Interpolation rules

**BG-41.** For a structure at time `t`, the runtime finds the bracketing keyframes `a` and `b` with `a.hpf <= t <= b.hpf`. It computes `s = smoothstep((t - a.hpf) / (b.hpf - a.hpf))` with `smoothstep(x) = x^2 (3 - 2x)` on `[0, 1]` (D3). Before the first keyframe the first keyframe applies; after the last the last applies. A parameter missing from keyframe `b` inherits its value from the nearest earlier keyframe that has it, so a keyframe lists only what changes.

**BG-42.** Each parameter has an interpolation type, fixed by the schema:

| type | rule | examples |
|---|---|---|
| number | `lerp(a, b, s)` after `sizeRefSl` rescale (BG-43) | radii, lengths, offsets, `u`, `v`, `w`, fractions |
| angle | `lerp` on the shortest signed difference in degrees, then wrap to `(-180, 180]` | `bendDeg`, `headingDeg`, `chevronDeg`, `rakeDeg` |
| count | `c = lerp(a, b, s)`; instances `floor(c)` at full scale; one more instance at scale `c - floor(c)` | `count` of a `segmentArray`, neuromast count |
| boolean | the earlier keyframe's value until `t` reaches `b.hpf` | `segmented`, `present` |
| enum | as boolean | `stage` of the heart loop, `side` |
| vector | component-wise number | `radii`, `centre`, `atriumOffset` |
| array (fixed length) | element-wise number | outline points, profile stations |

**BG-43.** `sizeRefSl` rescale (D6). When keyframe `a` carries `sizeRefSl`, the runtime replaces each of its sizes by `size x SL(t) / a.sizeRefSl` before the `lerp`, and likewise for `b`. `SL(t)` comes from the growth table by linear interpolation (BG-26). A keyframe at or after 72 hpf must carry `sizeRefSl`; the validator rejects a post-embryonic keyframe without it.

**BG-44.** Presence and fade. A structure exists from `visibleFromHpf` to `modelEndHpf` (D3 defaults: the ZFIN start and end stages). It fades in over `fadeInHpf` and out over `fadeOutHpf`. The default for both is 5 percent of the duration of the structure's first ZFS stage (D3). The fade drives material opacity from 0 to 1 and scale about the structure's centroid from 0.7 to 1.0 (research 06 section 4). `material.transparent` is true only inside a fade window. The default per period, from the ZFS stage lengths in `stages.json`:

| period | first-stage lengths (h) | default fade window (h) |
|---|---|---|
| zygote | 0.75 | 0.04 |
| cleavage | 0.25 | 0.0125 |
| blastula | 0.25 to 0.33 | 0.0125 to 0.017 |
| gastrula | 0.33 to 2.0 | 0.017 to 0.10 |
| segmentation | 1.33 to 3.0 | 0.067 to 0.15 |
| pharyngula | 6 | 0.30 |
| hatching | 12 | 0.60 |
| larval | 24 to 216 | 1.2 to 10.8 |
| juvenile | 360 to 1080 | 18 to 54 |
| adult | 2160 to 4320 on the axis | clamped so that the fade ends before 4320 |

A record may set `fadeInHpf` and `fadeOutHpf` explicitly. The chorion does (fade out 48 to 72 hpf, D8). The swim bladder posterior chamber does (fade in 96 to 120 hpf, D8).

**BG-45.** `segmentArray` count changes. New segments scale in from 0 (BG-42, type `count`). The scale-in is about the segment's own centroid at its station, so a somite grows in place at the tail bud. When a count falls (the fin fold rays do not; the yolk stripes do), the last instance scales out the same way.

**BG-46.** The 300 ms UI transition (D3; research 07 UX-IN-21). When `t` crosses `visibleFromHpf` or `modelEndHpf` during a scrub, a click-move or playback, the viewer runs a transition on top of the data fade. On appearance the structure scales from 0.6 to 1.0 about its centroid. Its opacity rises from 0 to 1 over the same 300 ms. The easing is `cubic-bezier(0.2, 0, 0, 1)`. On disappearance the reverse runs over 200 ms. When the timeline thumb moves faster than 3 stages per second the transition is skipped. With `prefers-reduced-motion: reduce` the transition is opacity only over 150 ms. The transition runs in the viewer and never changes the data fade in BG-44.

**BG-47.** Interpolation code lives in `src/core/interpolation.ts` and has no three.js import. It exports `bracket(keyframes, t)` and `interpolateParams(spec, keyframes, t, sl)`. `ParamSpec` maps each field to its type from BG-42. The zod schema derives it, so a field cannot lack a type.

### 4.8 Topology handoffs (D9)

**BG-48.** `src/data/handoffs.json` holds one row per D9 handoff. Schema:

```ts
export const Handoff = z.object({
  id: z.string(),
  from: z.array(ZfaId).min(1),
  to: z.array(ZfaId).min(1),
  window: z.union([
    z.object({ startHpf: z.number(), endHpf: z.number() }),
    z.object({ startSl: z.number(), endSl: z.number() }),        // resolved through the growth table at load
  ]),
  perSegment: z.object({ delayHpf: z.number(), lengthHpf: z.number() }).optional(),
  driver: ZfaId,                                                 // the structure whose geometry seeds the targets
  seed: z.enum(['copyPlacement', 'subRange', 'outlineSegment', 'sexToggle']),
  withinRecord: z.boolean().default(false),                      // true when source and target share one record
  note: z.string(),
})
```

The viewer cross-fades the `from` structures out and the `to` structures in over the window, with the fade of BG-44 (opacity and scale). When the ZFIN stages disagree with the window, it clamps the `from` structures' `modelEndHpf` and the `to` structures' `visibleFromHpf` to the window. The validator checks that every id resolves and that each `to` structure's first keyframe lies inside the window.

**BG-49.** The develops_from rule comes from research 01 section 7.4. At the window start, the `to` structure's first keyframe derives from the `driver`'s geometry at that time. The mesh then changes shape continuously. The `seed` field names the derivation:

| id | from | to | window | driver and seed | derived first keyframe |
|---|---|---|---|---|---|
| neural_plate_keel | neural plate ZFA:0000132 | neural keel ZFA:0000131 | 10 to 11 hpf | plate, `copyPlacement` | keel tube: `uStart`, `uEnd` from the plate sheet; `ry = 1.5 x plate thickness`, `rz = plate half-width / 2` |
| neural_keel_rod | neural keel | neural rod ZFA:0000133 | 11.7 to 13 hpf | keel, `copyPlacement` | rod tube: same `u` range; `r = sqrt(ry rz)` of the keel |
| neural_rod_tube | neural rod | neural tube ZFA:0001135 | 14 to 16 hpf | rod, `copyPlacement` | tube: same `u` range and radius; lumen radius 0.3 r |
| neural_tube_brain | neural tube | forebrain, midbrain, hindbrain, spinal cord | 22 to 24 hpf | tube, `subRange` | each region takes its `u` sub-range of the tube; the vesicles start as ellipsoids of the tube radius; the spinal cord keeps the tube radius from the hindbrain end to `u = 1` |
| heart_cone_tube | heart (stage cone) | heart (stage tube) | 22 to 24 hpf | heart ZFA:0000114, `withinRecord` | the heart loop's `stage` steps and `tubeLengthMm` grows from `coneHeightMm`; the info card alias changes (heart rudiment to heart tube) |
| heart_tube_chambers | heart loop mesh | atrium ZFA:0000471, ventricle ZFA:0000009, bulbus arteriosus ZFA:0000173, sinus venosus ZFA:0000154 | 42 to 48 hpf | heart, `subRange` | each chamber builds `segmentRange(chamber)` of the same loop parameters (BG-34); the heart record's own mesh fades out and the record becomes the group node |
| optic_vesicle_cup | optic vesicle ZFA:0000050 | optic cup ZFA:0001202 | 16 to 24 hpf | vesicle, `copyPlacement` | cup `outerDiameterMm` = vesicle diameter, `depthMm` = 0.6 x diameter |
| optic_cup_parts | optic cup | retina ZFA:0000152, lens ZFA:0000035, retinal pigment epithelium ZFA:0000144 | 24 to 30 hpf | cup, `subRange` | parts by `part` of `eyeCup` (BG-36); lens volume 10 percent of the cup volume at 24 hpf (research 03b) |
| otic_vesicle_ear | otic vesicle ZFA:0000051 | inner ear ZFA:0000217 | 66 to 72 hpf | vesicle, `copyPlacement` | `earVesicle` with `canals.present` true, loop diameter from the pillar length at 66 hpf |
| somites_myotomes | somite ZFA:0000155 | myotome ZFA:0001056 | 14 to 24 hpf, per segment | somite array, `subRange` | segment `i` of the myotome array copies segment `i` of the somite array (length, height, `chevronDeg`); `perSegment: {delayHpf: 2, lengthHpf: 2}` from each segment's formation time (conflict item 1 at the end of this section covers the tail segments) |
| fin_fold_fins | median fin fold ZFA:0000040 | dorsal fin ZFA:0001173, anal fin ZFA:0001162, caudal fin ZFA:0001058 | 5.2 to 6.6 mm SL (322 to 517 hpf) | fold sheet, `outlineSegment` | each fin's first outline is the fold's outline over the fin's base `u` range (dorsal 0.58 to 0.72, anal 0.60 to 0.80, caudal 0.95 to 1.2; research 03e); the fold between the fins fades out |
| pronephros_mesonephros | pronephros ZFA:0000151 | mesonephros (kidney ZFA:0000529) | 12 to 14 dpf (288 to 336 hpf) | pronephros, `copyPlacement` | kidney lathe along the same `u` range under the dorsal aorta; radius from the pronephric duct pair |
| gonad_sex | gonad ZFA:0000413 primordium | ovary ZFA:0000403 or testis ZFA:0000598 | 25 to 30 dpf (600 to 720 hpf) | gonad, `sexToggle` | the toggled target copies the primordium's placement and radii; the other target has `present: false` |
| larval_adult_stripes | larval melanophore stripes | adult stripes 1D, 1V | 5.9 to 9.6 mm SL (420 to 853 hpf) | lateral larval stripe, `copyPlacement` | adult stripe sheets take the lateral stripe's `u` range and `v`; metamorphic melanophores appear as a new array at 5.9 mm SL |

**BG-50.** The driver's geometry at the window start is the exact source. The runtime evaluates the driver's interpolated parameters at `window.start` once. It converts them by the `seed` rule and writes the result as the target's first keyframe in memory. `structures.json` therefore stores the target's later keyframes only, plus the id of the handoff that seeds it. The validator runs the same conversion and reports the seeded values.

### 4.9 Rebuild scheduling

**BG-51.** Two tessellation levels exist (D3): `interactive` while `t` changes (scrub, playback, click-move, bookmark step) and `final` once `t` has been stable for 120 ms. The scheduler in `src/viewer/rebuild.ts` keeps one state per present structure: `idle`, `dirty`, `building`, `built(lod)`.

**BG-52.** On every change of `t`, the scheduler marks every present structure `dirty`, cancels the settle timer, and starts a new 120 ms timer. In the next `useFrame` callback it drains the queue at the interactive level until 8 ms of build time have elapsed in that frame (D3). Structures that the budget did not reach keep their previous geometry for that frame and stay `dirty`. The next frame continues from the head of the queue. This is the time slicing of D3. When the settle timer fires, the scheduler marks every present structure `dirty` at the final level. It drains the queue with the same 8 ms budget per frame. `frameloop="demand"` stays on; the scheduler calls `invalidate()` while the queue is non-empty (research 06 section 8).

**BG-53.** Queue priority, highest first: the selected structure and its ancestors, then the hovered structure. Then structures inside the camera frustum sorted by projected screen size, largest first. Last, structures outside the frustum. The body skin (`tube` with `radius: 'body'`) sorts first among the visible structures because every other structure is read against it. The priority is recomputed when the queue is refilled, not per frame.

**BG-54.** Cache. The scheduler keeps a `Map<structureId, {lod, paramHash, geometry}>` with at most two entries per structure (one per level). `paramHash` hashes the interpolated parameters quantized to 0.0001 mm, 0.1 degree and 0.001 for fractions. It includes the body-frame hash (`hpf` rounded to 0.001 h). A build whose hash matches the cached entry is skipped. During playback at 1x (60 s for the whole track, D7) most embryonic structures change every frame. In a paused state the final level is built once.

**BG-55.** Disposal. After the scheduler assigns a new geometry to the mesh, it disposes the replaced geometry (`geometry.dispose()`). Disposal runs at the end of the same frame, after the render call. It keeps the replaced geometry only when that geometry is the other level's cache entry. When a structure leaves its presence window, its two cache entries are disposed 500 ms after the fade and the UI transition (BG-46) end. Materials are shared per system (research 06 section 8) and are never disposed by the scheduler.

**BG-56.** Budget evidence. Research 06 section 4 measured 0.40 ms per 64 x 24 body sweep with face normals on one server core. The analytic-normal builders of BG-29 avoid the 65 percent of that time spent in `computeVertexNormals`. At 220 structures with the interactive counts of BG-29 the model holds about 60,000 vertices. An interactive rebuild of every structure then fits inside two or three 8 ms slices, and a final rebuild inside about ten. The Playwright performance test (D13) scrubs 10 s and asserts a p95 frame time under 20 ms on the presenter's laptop. Morph-target baking (research 06 section 4, strategy 2) is the fallback if that test fails. It stays out of version 1 (D3).

### 4.10 Worked example: notochord and heart

**BG-57.** The two records below are the reference for record authors. Sizes before 72 hpf are mm; from 168 hpf they carry `sizeRefSl`. Keyframes list only what changes (BG-41). ZFA ids and stage windows come from `anatomy_item.txt` (notochord ZFA:0000135, bud to adult; heart ZFA:0000114, high-pec to adult, with the alias chain of D9).

```json
{
  "id": "ZFA:0000135",
  "name": "notochord",
  "system": "axial",
  "visibleFromHpf": 10,
  "modelEndHpf": 4320,
  "fadeInHpf": 0.5,
  "geometry": {
    "kind": "tube",
    "path": { "type": "spine", "uStart": 0.15, "uEnd": 1.0, "v": 0, "w": 0 },
    "caps": "round",
    "keyframes": [
      { "hpf": 10,   "radius": { "r0": 0.0225, "r1": 0.015 }, "taperFromU": 0.90, "flexionDeg": 0, "flexionFromU": 0.92, "segmented": false },
      { "hpf": 16,   "segmented": true },
      { "hpf": 24,   "path": { "uStart": 0.12 }, "radius": { "r0": 0.020, "r1": 0.010 } },
      { "hpf": 48,   "radius": { "r0": 0.0275, "r1": 0.010 } },
      { "hpf": 120,  "radius": { "r0": 0.0325, "r1": 0.010 } },
      { "hpf": 168,  "sizeRefSl": 4.1,  "radius": { "r0": 0.034, "r1": 0.010 }, "flexionDeg": 0 },
      { "hpf": 224,  "sizeRefSl": 4.5,  "flexionDeg": 0 },
      { "hpf": 336,  "sizeRefSl": 5.3,  "radius": { "r0": 0.040, "r1": 0.012 }, "flexionDeg": 18 },
      { "hpf": 504,  "sizeRefSl": 6.5,  "radius": { "r0": 0.045, "r1": 0.012 }, "flexionDeg": 45 },
      { "hpf": 720,  "sizeRefSl": 8.2,  "radius": { "r0": 0.050, "r1": 0.014 } },
      { "hpf": 1080, "sizeRefSl": 12.0, "radius": { "r0": 0.070, "r1": 0.018 } },
      { "hpf": 2160, "sizeRefSl": 18.0, "radius": { "r0": 0.100, "r1": 0.025 } },
      { "hpf": 4320, "sizeRefSl": 25.0, "radius": { "r0": 0.130, "r1": 0.030 } }
    ],
    "estimate": ["radius", "taperFromU"],
    "sources": ["research 03a notochord record", "research 05 section 8", "D8 flexion 6.5 mm SL"]
  }
}
```

Diameters: 45 um at bud, 40 um at 24 hpf, 55 um at 48 hpf, 65 um at 120 hpf. Sources: research 03a and research 05 section 8 (estimates). `flexionDeg` bends the last 8 percent of the tube dorsally (research 03a). `segmented` is a boolean that steps at 16 hpf (stack-of-pennies appearance, research 03a) and drives a stripe in the material, not the geometry. Post-embryonic radii are estimates for the vertebral core; the vertebrae (skeletal) cover the notochord from 6 dpf.

```json
{
  "id": "ZFA:0000114",
  "name": "heart",
  "system": "cardiovascular",
  "visibleFromHpf": 19,
  "modelEndHpf": 4320,
  "aliasChain": [
    { "fromHpf": 19, "id": "ZFA:0000115", "name": "heart rudiment" },
    { "fromHpf": 22, "id": "ZFA:0000149", "name": "primitive heart tube" },
    { "fromHpf": 24, "id": "ZFA:0000360", "name": "heart tube" },
    { "fromHpf": 42, "id": "ZFA:0000114", "name": "heart" }
  ],
  "geometry": {
    "kind": "heartLoop",
    "geometryEndHpf": 48,
    "handoffOut": "heart_tube_chambers",
    "keyframes": [
      { "hpf": 19,  "placement": { "u": 0.21, "v": -0.7, "w": 0 }, "stage": "cone", "coneBaseRadiusMm": 0.06, "coneHeightMm": 0.03,
        "tubeLengthMm": 0.0, "headingDeg": 0, "bendDeg": 0, "twistDeg": 0,
        "segments": { "sinusVenosus": { "s0": 0.0, "s1": 0.1, "rMm": 0.025 }, "atrium": { "s0": 0.1, "s1": 0.45, "rMm": 0.025, "rAcrossMm": 0.025 },
                      "avCanal": { "s0": 0.45, "s1": 0.55, "rMm": 0.022 }, "ventricle": { "s0": 0.55, "s1": 0.9, "rMm": 0.025, "rAcrossMm": 0.025, "exponent": 0.7 },
                      "bulbus": { "s0": 0.9, "s1": 1.0, "rBaseMm": 0.02, "rNeckMm": 0.015, "tiltDeg": 0 } },
        "atriumOffset": { "v": 0, "w": 0 } },
      { "hpf": 22,  "stage": "tube", "tubeLengthMm": 0.18, "headingDeg": 15 },
      { "hpf": 24,  "tubeLengthMm": 0.20 },
      { "hpf": 30,  "tubeLengthMm": 0.25, "segments": { "atrium": { "rMm": 0.0275, "rAcrossMm": 0.0275 }, "ventricle": { "rMm": 0.0275, "rAcrossMm": 0.0275 } } },
      { "hpf": 36,  "stage": "C", "tubeLengthMm": 0.28, "bendDeg": 90, "segments": { "atrium": { "rMm": 0.040, "rAcrossMm": 0.040 }, "ventricle": { "rMm": 0.035, "rAcrossMm": 0.035 } } },
      { "hpf": 42,  "stage": "chambers", "bendDeg": 120, "twistDeg": 15,
        "segments": { "sinusVenosus": { "rMm": 0.022 }, "atrium": { "rMm": 0.050, "rAcrossMm": 0.040 }, "ventricle": { "rMm": 0.055, "rAcrossMm": 0.045 },
                      "bulbus": { "rBaseMm": 0.017, "rNeckMm": 0.012, "tiltDeg": 20 } }, "atriumOffset": { "v": 0.2, "w": -0.3 } },
      { "hpf": 48,  "stage": "S", "bendDeg": 140, "twistDeg": 30,
        "segments": { "sinusVenosus": { "rMm": 0.0225 }, "atrium": { "rMm": 0.055, "rAcrossMm": 0.045 }, "ventricle": { "rMm": 0.0625, "rAcrossMm": 0.0525 },
                      "bulbus": { "rBaseMm": 0.0175, "rNeckMm": 0.012, "tiltDeg": 30 } } },
      { "hpf": 120, "placement": { "u": 0.21 }, "segments": { "sinusVenosus": { "rMm": 0.030 }, "atrium": { "rMm": 0.070, "rAcrossMm": 0.055 },
                      "ventricle": { "rMm": 0.075, "rAcrossMm": 0.0625, "exponent": 0.7 }, "bulbus": { "rBaseMm": 0.0275, "rNeckMm": 0.018, "tiltDeg": 30 } },
        "atriumOffset": { "v": 0.3, "w": -0.1 } },
      { "hpf": 168,  "sizeRefSl": 25.0, "segments": { "sinusVenosus": { "rMm": 0.20 }, "atrium": { "rMm": 0.50, "rAcrossMm": 0.45 },
                      "ventricle": { "rMm": 0.535, "rAcrossMm": 0.445, "exponent": 0.8 }, "bulbus": { "rBaseMm": 0.20, "rNeckMm": 0.12, "tiltDeg": 35 } } },
      { "hpf": 2160, "sizeRefSl": 25.0, "placement": { "u": 0.205 }, "segments": { "ventricle": { "exponent": 1.0 } } },
      { "hpf": 4320, "sizeRefSl": 25.0 }
    ],
    "estimate": ["tubeLengthMm", "headingDeg", "bendDeg", "twistDeg", "atriumOffset", "segments.sinusVenosus", "segments.bulbus at 48 hpf"],
    "sources": ["research 03c heart, heart tube, atrium, ventricle, bulbus, sinus venosus records", "D8 looping onset 30 hpf", "Singleman and Holtzman 2012 ventricle 4.28 percent of SL"]
  }
}
```

Radii are half the research 03c dimensions. At 24 to 30 hpf the tube is 50 um across. At 48 hpf: atrium 110 x 90 um, ventricle 125 x 105 um, bulbus 45 x 35 um, sinus venosus 40 x 45 um. At 120 hpf: atrium 140 x 110, ventricle 150 x 125, bulbus 85 x 55 um. At 25 mm SL: ventricle 1070 x 890, atrium 1000 x 900, bulbus 600 x 400 um. The 168 hpf keyframe already uses the 25 mm SL values with `sizeRefSl: 25`. At SL 4.1 mm that gives a ventricle radius of 0.088 mm, continuous with 0.075 mm at 120 hpf. The chamber records (atrium, ventricle, bulbus arteriosus, sinus venosus) carry `geometry: {kind: 'heartChamber', sourceId: 'ZFA:0000114', chamber: ...}` and no keyframes of their own (BG-34, BG-49). The heart record's mesh ends at 48 hpf (`geometryEndHpf`) and the record continues as the selectable group node of the four heart parts. The zebrafish heart has two chambers, the atrium and the ventricle; the sinus venosus and the bulbus arteriosus are the inflow and outflow segments.

### Conflicts with the decision record

1. D9 gives the somite to myotome handoff as "14 to 24 hpf (per segment)". Segments 27 to 31 form between 22.5 and 24.7 hpf (K95 rates, research 05 section 4). A per-segment window that starts 2 h after formation and lasts 2 h ends at 28.7 hpf for the last segment. This section encodes `perSegment: {delayHpf: 2, lengthHpf: 2}` with the first window starting at 14 hpf; the last windows end after 24 hpf. Either the 24 hpf bound in D9 applies to the trunk segments only, or the delay for tail segments drops to 0. The second option contradicts research 03a (chevron formation over 2 h, several hours after formation).

2. D3 places the yolk in the body model and D8 fades the chorion from 48 to 72 hpf. D3 also describes R3 as the Kimmel posture, with a 120 to 25 degree head-trunk angle and a spline body. The Kimmel figures show dechorionated embryos. An embryo of 2.0 to 3.1 mm axis length in that posture does not fit inside a 1.2 mm chorion (research 03a). This section keeps the R3 posture and enlarges the chorion sphere to enclose the body (BG-19). The alternative is a tail curled about 180 degrees inside a 1.2 mm chorion until hatching. It changes the prim-5 to long-pec screenshots of D13 and needs a decision.

3. D6 states the growth table in body length and D3 states smoothstep interpolation for parameters. SL-defined events need a monotone, invertible SL(t). This section therefore makes the growth table linear in hpf and reads SL from it (BG-26, BG-43). Shape parameters keep the smoothstep. No decision is contradicted, but D3 readers may expect the smoothstep to apply to SL too.
