## 8. Adversarial UX review

This section reviews the design specification from two seats: a scientist who projects the atlas in a seminar room, and a designer who checks the layout, the keyboard and the colour rules. The decision record (D1 to D15) is binding; no finding asks to reopen a decision. Every finding quotes the spec text it objects to, states the failure as an input and a wrong result, and proposes one fix. Severity: high means the item blocks version 1 or embarrasses the presenter; medium means the item should change before implementation starts; low means polish.

Requirement ids in this section carry the prefix `UXR`. Numbers below come from the research 07 check script (`docs/research/07-design-brief-checks.py`) run over the spec's colour tables, from the D7 anchor table, from the growth table of BG-26, and from the ZFIN stage file. The projector arithmetic assumes a 1920 px image that is 3.0 m wide (1 px is 1.56 mm) and a comfortable reading limit of one cap height per 250 mm of viewing distance; I did not measure a real room.

### 8.1 Method

I read the decision record, the full spec and research 07. I recomputed the tick spacing, the label overlap, the playback durations per segment, the body-length change per ZFS stage, the WCAG contrast of every token pair the spec uses, and the CIE76 distance between every pair of the 15 system hues and the 11 D10 exception hues, under normal vision and under the three simulated deficiencies of the research 07 script. I then walked the four moments of use of section 1.2 (talk, poster phone, lab desktop, slide author) through the spec as written and recorded each place where the spec produces a wrong screen.

### 8.2 Findings

#### UXR-01 (high) Presentation text is sized for the presenter, not for the audience

Spec text. AR-59: "the readout chip uses 20 px text". UX-TL-23: "Font 14 px on desktop, 20 px in presentation mode". Section 5.1.5 wireframe: "(28 px readout chip)". Section 5.8.3: "Display 32 px ... Presentation stage name". UI-02: "The readout, the period labels and the info card text scale by 1.25". Section 5.2.1: presentation period labels "20 px, 14 px text". Section 5.2.5: headline labels "10 px". UX-VS-19 (through AR-37): 3D labels 12 px, and UI-02 does not scale them.

Failure. The spec gives four different sizes for the one readout (20, 25, 28, 32 px). At 20 px, a 1080p image 3 m wide gives a cap height of 22 mm. That height is readable to about 5.6 m. M1 places the audience at 5 to 20 m. The presenter says "at 24 hpf the heart starts to beat" and the back half of the room cannot read "24 hpf". The 14 px period labels reach about 3.9 m. The 10 px headline labels reach about 2.8 m and add nothing on a projector. A 3D label at 12 px reaches 3.4 m. The 320 px info card shows the structure name at 25 px, so the audience cannot read what the yellow outline marks.

Fix. Replace the four numbers by one presentation type scale, owned by research 07 section 4.5 and copied into UI-02: time value 48 px, stage name 40 px, body length 32 px, period labels 20 px, info card name 40 px, info card stage window 24 px, 3D labels 20 px with a 2 px leader. Drop the definition text from the presentation info card by default; the presenter can expand it. Add a setting "Projector scale" with values 1x, 1.5x and 2x that multiplies this scale, stored in `localStorage` and in the URL as `ps=1.5`, so a presenter who knows the room is deep can set it once. Remove headline labels from the presentation strip; the period labels and the readout carry the position.

#### UXR-02 (high) The timeline strip hides while the fish is playing

Spec text. OV-04 and UI-02: "The strip appears on pointer movement or key press and hides after 3 s of idle." AR-59: "The timeline bar shrinks to a 64 px strip that auto-hides."

Failure. The presenter presses `Space` and lets the 60 s playback run while talking. After 3 s the strip hides. For the remaining 57 s the audience sees a fish that changes shape with no moving thumb and no period band, and the only time reference is the 20 px chip of UXR-01. The same happens between two arrow presses: the presenter talks for 20 s about the 24 hpf embryo and the timeline is gone. The time axis is the product's one idea, and presentation mode removes it from the screen for most of the talk.

Fix. Add to UI-02: the strip stays visible while `playing` is true and for 3 s after playback stops. Add a pin toggle (`Shift+P` and a pin icon on the strip) that keeps the strip visible; the URL carries it as `pin=1`. Keep the readout chip visible at all times in presentation mode; only the transport strip auto-hides. Offer "Strip position: bottom or top" in settings, because the bottom 64 px of a projected image is the first part that heads in the front row block. State that on entry through `present=1` the strip shows for 3 s and then hides.

#### UXR-03 (high) The slide kit has keys and store fields but no user interface

Spec text. UI-33: "`B` adds a bookmark and `Shift+B` opens the slide kit list". AR-45: `kit` parameter. AR-60: bookmark stepping. Section 2.2.5 lists every UI component; none is a kit sheet. Section 6.8 assigns no work package to the kit. Research 07 UX-EX-12 (kit panel with 96 px thumbnails), UX-EX-13 (bookmark diamonds on the strip), UX-EX-15 (kit export as JSON and a ZIP of PNGs, the 2 KB URL threshold) and UX-EX-16 (two starter kits) do not appear in the spec, and section 1.6 does not list them as dropped.

Failure. The presenter presses `B` five times while rehearsing, then presses `Shift+B`. No component exists to render the list, so nothing opens, or a placeholder opens with five rows that cannot be named, reordered or deleted. On stage the presenter presses `ArrowRight`, and the step goes to bookmark 2 instead of the next stage, because a kit is loaded. The presenter has no way to see which bookmark is next. OV-04 promises that "the keyboard alone drives time, view presets, and bookmarks" and OV-38 checks it, but nothing builds the bookmark side.

Fix. Either build it or defer it, and say which. To build: add `src/ui/KitSheet.tsx` (a 320 px sheet: rows with name, time, a 96 px thumbnail captured with the export pipeline at 1x, rename, delete, drag to reorder, "Export kit" as JSON and as a ZIP of 2x PNGs) and `src/ui/KitMarkers.tsx` (8 px diamonds in `--focus` above the strip, the next bookmark filled); add work package WP-I5 that owns them and a smoke assertion for `B`, `Shift+B` and the bookmark step; ship the two starter kits of UX-EX-16 with the times taken from `stages.json`. To defer: remove `B`, `Shift+B`, `kit`, `SlideKit` and AR-60 from version 1, change OV-04 to "time and view presets", and list UX-EX-12 to UX-EX-16 in the section 1.6 override table.

#### UXR-04 (high) "Jump to first appearance" lands on an invisible structure

Spec text. UI-20: "It moves `t` to `visibleFromHpf`". BG-44: "A structure exists from `visibleFromHpf` ... It fades in over `fadeInHpf` ... The fade drives material opacity from 0 to 1 and scale ... from 0.7 to 1.0", with defaults from 0.3 h (pharyngula) to 54 h (juvenile). QP-35 step 8 asserts "`t` equals the heart record's `visibleFromHpf`".

Failure. The presenter selects the swim bladder at 48 hpf and presses "Jump to Day 4 (96 hpf)". The fade of the posterior chamber runs from 96 to 120 hpf (DM-22), so at 96 hpf the chamber has opacity 0 and scale 0.7. The card says "Present", the outline surrounds nothing, and the audience sees no swim bladder. The same happens for every structure: a juvenile structure with the default 18 h fade needs 18 h of scrubbing (3 px of track) before it is visible. The smoke test locks this behaviour in.

Fix. Define the jump target as the first time the structure is fully visible: `visibleFromHpf + fadeInHpf`, snapped to the containing stage start when snap is on and the start lies inside the fade. Label the button with that time ("Jump to 120 hpf (Day 5)"). Change QP-35 step 8 to assert `t` equals `visibleFromHpf + fadeInHpf`. Keep `visibleFromHpf` as the data field and the presence boundary; only the jump target changes.

#### UXR-05 (high) The first click selects the skin, and the default skin veil washes out every organ

Spec text. AR-32: "The x-ray value maps 0 to 100 onto skin opacity 0.60 to 0.00 ... The default 25 gives skin opacity 0.45." AR-34: "A mesh enables layer 1 only when its opacity is 0.3 or more". UX-ST-11: first-run chip "Click a structure" with an arrow toward the head. The spec never says whether "skin" is the body tube of `Body.tsx` or the periderm and epidermis records of `integument_pigment`, or whether the body tube is selectable.

Failure. A new user opens the atlas at 24 hpf and clicks the head as the chip suggests. The skin shell has opacity 0.45, above the 0.3 pick threshold, so the click selects the periderm (or the body tube, which has no ZFA id). The info card shows "periderm" and the user concludes that the eye cannot be selected. To reach any organ the user must find the x-ray slider and move it past 50. The veil also damages the colours the whole product depends on: seen through skin at 0.45, the cardiovascular red `#E4483C` becomes `#D69598` (chroma drops from 72 to 26), the smallest distance between two system hues drops from ΔE 24 to 11, and under simulated deuteranopia from 8.4 to 2.3 (digestive against axial). On a projector, which compresses contrast further, the organs read as pink and grey shapes.

Fix. Add a boolean `pickable` to `StructureRecord`, default true, set false for the periderm, the epidermis, the enveloping layer and the chorion; state that the body tube is never in the raycast layer. These structures stay selectable from the tree and search. Set the default x-ray to 60, which gives skin opacity 0.24 and muscular opacity 0.85, and make presentation mode start at 60 as well. State in AR-32 that "skin" means the `integument_pigment` sheet records; the body tube uses the same opacity. Research 07 UX-VS-16 already asks the team to tune these two values, so this change stays inside D11.

#### UXR-06 (high) The selection outline vanishes on yellow structures

Spec text. AR-35: "Selection draws a drei `Outlines` child ... colour `--focus`" with `--focus` `#FFD166`. Section 3.6: yolk `#F2C94C`, xanthophore `#F2C14E`; section 5.8.2: excretory `#C6D34A`, early embryo `#D9C79A`.

Failure. The presenter clicks the yolk at 24 hpf, the largest object on screen for the first three days of the axis. The outline colour differs from the yolk by ΔE 8.4 (7.3 under deuteranopia, 4.3 under tritanopia). Nothing visible marks the selection; the presenter clicks again and the audience watches nothing happen. The same holds for xanthophores (ΔE 7.1), and under deuteranopia for the pronephros and the whole excretory system (ΔE 6.6).

Fix. Draw a two-tone outline: a 1 px ring in `--bg` outside the 2 px `--focus` ring, in both the drei path (two `Outlines` children, thickness 3 in `--bg` under thickness 2 in `--focus`) and the post-processing path (a second `Outline` pass or a wider `hiddenEdgeColor` ring). D10 still holds: the selection is an outline in the focus colour and no fill changes. Add the pair check of UXR-11 for `--focus` against every structure colour.

#### UXR-07 (high) Transparent export writes white text and a white scale bar

Spec text. AR-56: "Text sizes and line widths use the theme tokens scaled by the export scale." UX-EX-01 defaults: "transparent off, ... scale bar on, readout on". UX-VS-22 (through AR-56): scale bar "1.5 px thick" with the length in Caption type.

Failure. The slide author uses the default dark theme, ticks "Transparent background", keeps the default scale bar and readout, exports at 2x, and drops the PNG onto a white slide. The readout text is `--text` `#E7EAEE` and the scale bar is a 3 px line of the same colour: both are near white on white. The label chips keep their dark 85 percent `--surface` background and appear as black boxes. The author sees the missing scale bar only during the talk, if at all. OV-40 checks only the fringe, not the overlays.

Fix. In the export dialog add "Overlay colour: auto, dark, light" with `auto` meaning the theme colour when the background is opaque and dark when the background is transparent. Draw exported overlay text and lines with a 2 px halo in the opposite colour at 60 percent opacity, so they read on any slide. Draw the exported scale bar at 2 px times the export scale and give it end caps. Add to OV-40: "the exported overlays are legible on a white and on a black slide". Add a checkbox "Include selection outline", default on, so a figure can omit the yellow ring.

#### UXR-08 (medium) Two camera-follow rules contradict each other and both pump the camera

Spec text. AR-41: "Fit runs on first load, on `F`, on a preset change, and on a stage change while `followGrowth` is true ... Fit never runs on a scrub inside one stage." UX-IN-12: "'Follow growth' (default on) moves the controls target to the body centroid on each `t` change. It scales the camera distance with body length over 200 ms."

Failure. Under AR-41 the body grows inside a stage with no camera change and the camera jumps out at the boundary. From the growth table, the body grows by a factor of 1.56 inside 14-19 somites, 1.38 inside Days 7-13, 1.44 inside Juvenile 30-44 and 1.50 inside Juvenile 45-89. During a 1x playback the audience sees the fish swell until it touches the strip and then shrink in 200 ms, eleven times. Under UX-IN-12 the camera follows every frame and the fish stays the same size on screen, but the growth rate per second of playback jumps at each D7 anchor: by a factor of 4.4 at 72 hpf, 3.6 at 168 hpf and 3.0 at 720 hpf (the 1x rate goes from 3.6 to 16 to 57 hpf per second). The implementer cannot satisfy both rules.

Fix. Keep UX-IN-12 and delete the stage-change clause from AR-41: with follow growth on, the target is the body centroid and the distance is `k x bodyLength(t)` on every frame, with a critically damped approach of 200 ms; `F`, a preset change and first load run the full fit. This still frames the body on every stage change, as D4 requires. Smooth the anchor kinks in the playback path only: `playback.ts` may ease the track speed over the 1 s before and after each anchor (the mapping of D7 does not change; only the speed profile of the clock does), and OV-23 still holds because the eased profile keeps 60 s per full track. Add a test: during a 1x playback the screen-space body length changes by at most 2 percent per second.

#### UXR-09 (medium) Export offers no aspect ratio, so slide figures come out near square

Spec text. AR-52: "Output size is the canvas CSS size times the scale (1, 2, or 4), independent of the device pixel ratio." UX-EX-01: "scale 1x, 2x or 4x of the current viewport".

Failure. On the 1440 by 900 reference laptop with both panels docked, the canvas measures about 820 by 740 px. The default 2x export is 1640 by 1480 px, an aspect of 1.1:1, framed for that shape. On a 16:9 slide the figure fills 62 percent of the width or gets cropped. To get a 16:9 figure the author must collapse both panels and resize the browser window by hand, and the framing changes every time. A 4K slide (3840 by 2160) needs a 4x export from a window the author cannot size exactly.

Fix. Add "Frame: viewport, 16:9, 4:3, 1:1" and "Size: 1x, 2x, 4x, 1920 by 1080, 3840 by 2160" to the export dialog. Render a non-viewport frame by setting the camera aspect to the frame, running the fit of AR-41 for that aspect, and using the same tile pipeline; the on-screen camera does not move. Put the pixel size in the file name after the scale token. D1 asks for 1x, 2x and 4x with a transparent option; this adds choices and removes none.

#### UXR-10 (medium) A slide link does not carry the theme or the camera unless the author knows to ask

Spec text. UI-34: "Two checkboxes: 'Include camera' ... and 'Include theme'", with no defaults. AR-49: "`theme` appears only when 'Copy link' runs." AR-48: the address bar URL never contains `theme`. UX-ST-11: the first-run chips appear on "the first visit (no `localStorage` key, not presentation mode)".

Failure. The author builds the talk on a dark laptop, copies the URL from the address bar (most people do), and pastes it into the slide. On the seminar laptop, which has never opened the atlas and prefers a light colour scheme, the link opens in the light theme: a white viewer flashes onto the projector between dark slides. If the author orbited the camera a little before copying, the address bar carries `cam`, but a copied share link with "Include camera" off restores the nearest preset and the figure the audience saw on the previous slide does not match. On a fresh browser the three first-run chips also appear over the fish for 6 s, because a deep link is still a first visit.

Fix. Default both checkboxes on. Write `theme` into the address bar URL whenever the user has chosen a theme explicitly, and always into a `present=1` link. Suppress the first-run chips when the URL carries any state parameter other than `theme`; a deep link means someone sent the visitor to a specific view. Add to OV-37: "opened on a browser with the opposite `prefers-color-scheme`, the link restores the author's theme".

#### UXR-11 (medium) Presentation mode leaves several surprise pop-ups and no path to fullscreen

Spec text. AR-59: "Fullscreen uses the Fullscreen API only from a user gesture, never from the URL alone." The keyboard map has no fullscreen key. UX-US-07: "No action opens a modal dialog in presentation mode except the export dialog." The map keeps `?` (shortcut sheet), `,` (settings sheet), `Shift+C` (share dialog) and `Shift+B` (kit list) active in every mode. UX-IN-05: right-click or long press opens a context menu. UX-ST-13: toasts appear bottom centre. UX-TL-21: "Arrow keys always step by stage", with no statement of whether a step cuts or glides.

Failure. The presenter opens `present=1` from a slide. The browser window opens with tabs and an address bar; nothing in the atlas offers fullscreen, so the presenter hunts for the browser's own key while the audience waits. During the talk a two-finger tap on the trackpad (a right-click) opens a six-item context menu over the fish; `Shift+/` typed by accident opens the shortcut sheet; a `sel` id that changed between versions raises a "Structure ZFA:0000123 is not in this atlas" toast on the projector. An `ArrowRight` from 168 to 336 hpf either pops the fish from 4.5 to 6.2 mm with no transition or glides; the spec does not say, and the two feel different on stage.

Fix. Add `Enter` (in presentation mode) and `Shift+F` (everywhere) as the fullscreen toggle, and show a one-line chip "Press Enter for fullscreen" for 5 s when presentation mode starts from a URL; that key press is the gesture the Fullscreen API needs. In presentation mode: disable the context menu; keep `?` and `Shift+B` as non-modal popovers that close on any navigation key; ignore `,` and `Shift+C`; show only error toasts, and show them in the strip area so they never cover the fish. State that a stage step glides over 200 ms in track distance (the UX-TL-16 motion) and cuts under reduced motion or when steps arrive faster than 3 per second.

#### UXR-12 (medium) The keyboard map fights presenter clickers, browsers and focused controls

Spec text. Section 5.9.1: "`PageUp` / `PageDown`: Previous or next period"; "`B` adds a bookmark"; "`Alt+Arrow`: Orbit by 15 degrees"; "`Alt+Plus` / `Alt+Minus`: Zoom by 10 percent"; "Shortcuts are single keys without modifiers except where listed, so a presenter's clicker mapped to arrow keys works. Shortcuts are suppressed while focus is in a text field."

Failure. Most presenter remotes send `PageDown` and `PageUp` for next and previous, and `b` or `.` for "blank screen". With this map the clicker steps by period (ten stops for the whole axis) instead of by stage, and its blank button silently adds a bookmark each time. On Windows and Linux, `Alt+Left` is the browser's back command; if the handler does not call `preventDefault`, the atlas leaves the screen mid-talk. `Alt+Minus` on macOS produces an en dash, so a handler keyed on `event.key` never sees it. After the presenter clicks the Play button with the mouse, focus stays on that button; the next `Space` fires the button's native click and the global shortcut, so playback toggles twice and appears dead. The same double step happens for `ArrowRight` while the track slider has focus.

Fix. In presentation mode treat `PageDown` and `PageUp` as `ArrowRight` and `ArrowLeft` (bookmark step when a kit is loaded, stage step otherwise) and move the period step to `Shift+PageDown` and `Shift+PageUp`. Make `B` and `.` toggle a black screen in presentation mode, the action a presenter expects from that button, and move "add bookmark" to `Ctrl+B`. Key every shortcut on `event.code`, call `preventDefault` on every handled combination, and route all keys through one dispatcher in `shortcuts.ts` that ignores an event whose `defaultPrevented` is set or whose target is a button, slider, listbox or tree that handles the key itself. Transport buttons blur after a pointer click. Add these cases to the WP-I4 smoke assertions.

#### UXR-13 (medium) The exception colours and the accent collide with system hues

Spec text. Section 5.8.1: `--accent` `#7FD3F5`. Section 5.8.2: S02 sensory `#7FD3F5`. Section 3.6: chorion `#C8D0D8`, iridophore `#C9D6DF`, otolith `#F5F5F5`, xanthophore `#F2C14E`, yolk `#F2C94C`, cartilage `#8FC1E3`, bone `#E9DFC4`, with the note that the check "must confirm 3:1 contrast" but no separation check. AR-33: isolate ghosts at "opacity 0.06 in `--text-muted`".

Failure. The accent and the sensory hue are the same hex, so the rail's active states, links, the hovered-time marker and the section rectangle all look like "sensory". Measured pairs under normal vision: chorion against skin ΔE 2.1, iridophore against chorion 2.5, iridophore against skin 4.4, otolith against skeletal 5.5, xanthophore against yolk 5.5, cartilage against sensory 10.1, bone against skeletal 10.9. Under simulated deuteranopia xanthophore against excretory is 1.4 and yolk against excretory 4.5; the pronephros lies on top of the yolk from 24 to 168 hpf, so a deuteranopic viewer sees one yellow mass. A projector in a lit room compresses the dark end: the isolate ghost `#2A2E33` on `#0E1116` is about 1.3:1 and disappears, so an isolated heart floats with no body around it.

Fix. Extend `07-design-brief-checks.py` to the 15 system hues plus the 11 exception hues plus `--focus` and `--accent`, and set a floor of ΔE 12 (normal) and 6 (each deficiency) for every pair that can appear on screen at the same time; record the result table in section 3.6. Move `--accent` off the sensory hue (a value such as `#5FB8E8` keeps 8.6:1 on the dark background). Give the xanthophore a more orange yellow and the yolk a paler one so they clear the floor. Raise the isolate ghost to 0.14 in presentation mode. Research 07 owns these values (D11); the change goes through research 07 section 4 before `systems.json` freezes in WP-02.

#### UXR-14 (medium) The desktop rail leaves no room for the tree at the reference height

Spec text. Section 5.1.2 (1440 by 900 reference): the rail holds a header, 15 system rows of 36 px (UX-LY-04), a presets row, an x-ray slider, a section control and then "TREE". UX-LY-05: "The tree fills the remaining rail height".

Failure. Between the 48 px top bar and the 112 px timeline bar the rail has 740 px. The header, 15 rows, presets, x-ray and section control use about 716 px. The tree gets about 24 px: less than one 28 px row. The lab member (M3) who opens the atlas on a 1440 by 900 laptop to browse the ZFA hierarchy sees a tree header and no tree.

Fix. Make the systems list collapsible to a 3 by 5 swatch grid of 44 px cells (132 px) with the name and count in a tooltip and in the tree's system rows; the grid is the default below 1000 px of viewport height. Alternatively tab the rail into "Systems" and "Tree". Add a check to QP-35 at 1440 by 900: the tree shows at least eight rows with the default layout.

#### UXR-15 (medium) The tests never open presentation mode or the projector size

Spec text. QP-30: "The desktop viewport is 1600 by 900 CSS px". QP-32: screenshots use `embed=1`. QP-35 and QP-36 test desktop and phone. WP-I4: "Done when: the phone check passes and every shortcut of research 07, section 3.10 has a smoke assertion". No test opens `present=1`, and nothing renders the strip at 1856 px.

Failure. Every high finding above about the talk (UXR-01, UXR-02, UXR-11, UXR-12) can regress with all gates green. The tick and label tables of section 5.2 were computed at 1392 and 1856 px, but the only desktop test runs at 1600 px and never looks at the bar.

Fix. Add a `presentation` Playwright project at 1920 by 1080. Capture the 18 headline stages with `present=1&sel=<one structure>` for human review next to the embed screenshots. Assert: the strip is visible while `playing` is true; the readout font size equals the UXR-01 scale; no element other than the canvas, the strip, the readout and the info card is visible; the context menu does not open on right-click. Move the desktop project to 1440 by 900 so it matches the reference layout of section 5.1.2.

#### UXR-16 (medium) The phone layout needs a dynamic viewport height and readable band labels

Spec text. Section 5.1.4: "info card peek 96 px", "band strip 32 px", "transport 44 px (88 px total) + safe area", and "labels inside bands, 10 px, abbreviated" in `--text`. UX-TL-03: band fill "55 percent in the dark theme". Section 5.1.4: "The `[=]` button opens the Layers sheet ... from the bottom at the half detent." QP-36 asserts only `scrollWidth`. The wireframe shows a "[3/4]" preset cycler.

Failure. iOS Safari changes the viewport height when its toolbar collapses; a root sized with `100vh` leaves the timeline bar under the toolbar and the page scrolls vertically, and QP-36 does not catch it. The 10 px labels in `--text` over the 55 percent band fills measure 2.9:1 on Larval, 2.5:1 on Juvenile and 2.2:1 on Adult, below the 4.5:1 of OV-02. The Layers sheet at 50 dvh covers the timeline bar, so a visitor cannot scrub while choosing systems. The cycler shows "3/4" although the default preset is lateral (UI-01).

Fix. Size the app root at `100dvh` with `overflow: hidden` and `env(safe-area-inset-bottom)` padding on the transport row; add `scrollHeight <= innerHeight` to QP-36. On the phone, pick the band label colour per band: `--bg` on bands with L* above 60 and `--text` below, or move the labels to a 14 px row above the strip and grow the bar to 102 px. Let the Layers sheet stop above the timeline bar. Show the current preset's short name on the cycler.

#### UXR-17 (medium) The info card both collapses and shows the stage card when nothing is selected

Spec text. Section 5.1.1: desktop info card "collapses when nothing is selected and no stage card is pinned". UX-LY-08: "When no structure is selected, the info card shows the current stage: name, ZFS id, period, hpf range, landmark sentences, body length from the growth table, and the list of structures that first appear in this stage."

Failure. The two rules cover the same state and prescribe different screens. If the implementer picks the collapse, the first screen a new user sees has no text that explains what "Prim-5" is or what to click; the stage card is the best first-run explanation the spec has, and it is hidden until the user finds the pin.

Fix. Delete the collapse clause. The card shows the stage card whenever nothing is selected; the user collapses the card by hand and the width persists (UX-LY-10). Presentation mode keeps its rule of showing the floating card only with a selection.

#### UXR-18 (low) Playback cannot be replayed with one key

Spec text. UX-TL-17: "Playback stops at 4320 hpf and the button returns to play."

Failure. At the end of a run the presenter presses `Space` to play again; the clock computes `min(next, 1)` and `t` stays at 4320. Nothing moves.

Fix. When `play()` is called with `t` at the axis end, set `t` to the time at which the last playback started (or 0 when there was none) and then play.

#### UXR-19 (low) The alias chain and the presence badge contradict each other before 19 hpf

Spec text. DM-24: alias windows "11.66 to 19, 19 to 22, 22 to 24 and 24 to 42 hpf ... The heart record gets `visibleFromHpf` 19 ... The heart primordium alias precedes the geometry and appears on the info card only." UI-24: "ZFIN term now: heart tube (ZFA:0000360), 24 to 42 hpf". UX-IN-23: badge "Not present at 26 hpf".

Failure. A biologist selects the heart from search at 15 hpf. The card shows "ZFIN term now: heart primordium (ZFA:0000028), 11.66 to 19 hpf" and, directly under it, "Not present at 15 hpf". The two lines contradict each other on a projected card.

Fix. When `t` falls inside an alias window that precedes `visibleFromHpf`, the badge reads "ZFIN describes the heart primordium at 15 hpf; the model draws the heart from 19 hpf", and the jump button targets 19 hpf plus the fade of UXR-04.

#### UXR-20 (low) The "Unknown" stage row can leak into ticks, steps and the readout

Spec text. UI-05: "Tick candidates are the 44 stage starts and the axis end." Section 1.4: "stage: One of the 44 ZFS stages."

Failure. The ZFIN stage file has 44 rows, and one of them is `ZFS:0000000 Unknown`, 0 to 17520 hpf. If it enters `stages.json` as a stage, `stageAt(t)` can return "Unknown" for any `t`, `ArrowRight` from 0 hpf can stop on a stage that starts at 0, and the tick table double counts the 0 hpf position. The `StageRecord` schema also requires a `period`, which Unknown lacks.

Fix. State that `stages.json` holds the 43 named stages. The validator rejects `ZFS:0000000`. Change "44" to "43" in section 1.4, UI-05 and the tick tables (candidates become 44: 43 starts plus the axis end).

### 8.3 What the spec gets right

- The 1x pacing across the D7 axis is sound. The first 10 hpf take 10.8 s, segmentation 7.2 s, 24 to 72 hpf 13.2 s, the larva 15.6 s, the juvenile 8.4 s and the adult 4.8 s. Somites appear at about four per second and read as growth, not as flicker. Cleavage stages pass at 0.27 s each; they look alike, so the speed is acceptable. Only the rate steps at the anchors (UXR-08) need work.
- The 8 px tick rule and the label overlap estimates of section 5.2.4 and 5.2.5 check out at 1392 and 1856 px; every cleavage tick draws at 1856 px and every second one at 1392 px, as stated.
- The token contrast table is correct: `--text-muted` on `--bg` is 7.40:1 in the dark theme and stays at 6.0:1 on `--surface-2`.
- Defining the play speed in track distance (D7) and the URL parser as per-key `safeParse` with warnings (AR-46) are the right calls for a talk; a bad `sel` never blanks the view.
- The two-layer raycast (AR-34) is the right mechanism; only its threshold and the default x-ray are wrong (UXR-05).

### 8.4 Conflicts with the decision record

None of the findings needs a decision reopened. One statement in D7 does not match the data: D7 says `stages.json` "holds the 44 ZFS stages", and the ZFIN stage file has 43 named stages plus the `Unknown` row (UXR-20). The spec can hold the 43 named stages and still comply with the intent of D7; the owner may correct the number in D7 when convenient.
