# VERIFICATION REPORT — GORGEOUS PASS (GORGEOUS_PASS.md)

Production: https://everest-site-azure.vercel.app · verified 2026-06-11
(The R8 report this replaces is preserved in git history at 24b9d50.)

## M11 acceptance — all 9 binary criteria MET

1. **Type system live.** Newsreader carries all prose (17–19px/1.65/38ch; Geist retired);
   threshold headline `clamp(4.5rem, 11vw, 11rem)`; every chamber: headline fills 100% of its
   column at 95px (type-audit/RESULTS.json — floor was 60%), ghost numeral `01`–`08` (Fraunces
   roman, 22vh, cropped by the edge), counting pull-stat (220 · $994 · 4 · 7 · 10 · 6v6 · 1 ·
   70.3, 800ms eased, once), limb-overlap headlines via chamber camera framing. SplitText
   line-mask + opsz 9→144 on every headline; prose reveals in 60ms-staggered lines. Font
   payload **278.2KB on the production wire** (≤280KB).
2. **Light touches things.** Three darks (--ink/--ink-2/--ink-3) + 8/10% hairlines; the live
   planet's amber wash grazes each panel's near edge (anchored to its projected screen-Y);
   planets rim-lit sunward (per-planet shells, uSunDir from the core); threads brightest at
   the core (vertex-color gradient) and warm as pulses pass; INDEX opens with a backlit glow;
   0.5 corner vignette + corner-only chromatic fringe in the grade pass.
3. **Threshold full-bleed + seasonal.** Terrain meets the bottom edge (no dead band; 100dvh,
   zero scroll — checks in m3 smoke); tunnel dome invisible until the seam parts (handle-gated,
   masked by the SeamShroud); four seasons live (night/winter/spring/autumn — m3/*.png) with
   the 1.4s left→right weather front (frontline shimmer + spatial re-tint, probe-front05.png,
   motion/frames-season-front); reduced-motion = 250ms crossfade (protocol PASS); control is
   four drawn glyphs bottom-left, 54bpm amber ring, labeled radiogroup with arrow keys,
   sessionStorage persistence (protocol + live smoke PASS).
4. **Breach ≤2.2s, continuous.** R1 spline waypoints remapped onto a 2.2s clock (open 0.8 →
   tunnel 1.1 → arrival 0.3); 10 ribbons (one jade), ghost hex 7%. No-cut audit: 15 frames at
   12fps across seam entry, zero cuts (motion/nocut/). Production breach: 121fps avg, worst
   frame gap 16ms.
5. **Hub floats in space.** Starfield shell + desaturated FBM nebula wisps (≤3% — the 6%
   ceiling read as soup over near-black; see DECISIONS #47); corona rebuilt as a camera-facing
   billboard with exponential falloff + IGN dither — zero geometry banding; core is a molten
   limb-darkened plasma ramp; planets +19% with identity rims at rest distance (m5-hub3.png);
   pulses 1.4–2.2s ease-in-out with 3px comet heads and tight 9-sample tails — followable
   (motion/frames-pulse-follow); orbit arc-text deleted, zero stray glyphs in chambers.
6. **Zero planet overlap.** Orbits rebuilt co-rotating with annular ring separation; solver =
   per-ring angular-spacing controller + cross-ring time-shift backstop + rate-bounded spring
   (orbits.ts; the geometric impossibility of the old counter-rotating layout is DECISIONS #45).
   Official audit (shipped solver, 300s @60Hz): **minDiscGap +0.227** (discs never touch),
   **minCenterSep 0.635 ≈ 73px** (≥56px hit floor); 900s headroom +0.119/0.535
   (drift-audit.log). Hit areas 56px.
7. **Navigation obvious.** INDEX in the HUD top bar → full-viewport manifest (groups
   SYSTEMS/VENTURES/GAMES/LIFE + THE MOUNTAINS/HUB, drawn glyphs, descriptors, honest
   statuses, scan-line reveal, backlit glow); hover warms rows; click flies (hub→open,
   chamber→hop, mountains→close-then-reverse); Esc closes; full keyboard nav (labeled dialog,
   10 named rows — protocol PASS). EXPLORE chips: destination glyph + mono name + EXPLORE
   arrow, hairline border, ring-charge sweep, magnetic hover, ≥44px. Arrow keys hop planets.
   All verified on production (live smoke 21/21).
8. **Jewelry 12/12 + eight distinct spreads.** Draw-on underlines · scaleX hairline reveals ·
   counting stat tickers · corner brackets + FIG. 0n marks · amber/ink selection · 2px amber
   chamber scrollbar · amber focus rings · live HUD readouts (scene · bodies:08 · real fps) ·
   systemized ring-charge (.chip-charge) · cursor ring-pulse on click · 54bpm season glyph ·
   in-world 404 (mono + coordinates + [ return ]). Chambers: console-rail cantilever / ledger
   / dossier / sparse radar / arcade roster-mass / brutalist spec-sheet / max-air teaser /
   atlas band with the WONK headline — no two alike, none symmetric, 12-col grids, copy
   preserved verbatim. Mobile: planet medallion header (~30vh), 12vh ghost numerals, 44px chips.
9. **Evidence complete; deployed; smoke green.** Protocol `verify.mjs`: **58/58 PASS** (§9 +
   M10 additions — console gate zero errors AND warnings, keyboard, reduced-motion incl.
   season crossfade, mobile, resilience, a11y incl. season control + INDEX labels). Motion
   evidence + 6-frame poster sets for season front, breach, pulse follow, INDEX open/close,
   chamber flight (verification/gorgeous/motion/). Type audit 8/8. Before/after map
   (BEFORE-AFTER.md). Deployed `vercel --prod --archive=tgz`; live smoke **21/21 PASS**
   including every new interaction.

## Environment

Headed Chromium + GPU via @playwright/test (DECISIONS #22). Type audit + protocol at
1440×900; motion at 1280×720; mobile at 390×844. Network quirk: pushes/deploys on this
network need HTTP/1.1 (git) / `NODE_OPTIONS=--tls-max-v1.2` (vercel) to dodge SSL
bad-record-mac on bulk uploads.
