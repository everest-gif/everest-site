# THE GORGEOUS PASS — master directive

The site works; it does not yet look like $20,000. This pass installs the missing aesthetic systems (type, light, layout, detail) and fixes every known experience flaw, in one program.

## M0. CONTRACT
Work autonomously; never stop to ask. Fix-loop until green. Keep PLAN.md and DECISIONS.md current; commit per phase. Subagents ≤3 parallel. For every animation touched: record it, extract 6 evenly-spaced frames, and judge each against the **poster test** — every frame must work as a standalone poster (composition, hierarchy, light). "Fine" fails. Evidence and before/after pairs → `verification/gorgeous/`. Register to aim at: Stripe Press editorial confidence, watch-brand microsite restraint, top-tier WebGL studio polish. If a choice would fit a dashboard template, it's wrong.

## M1. TYPOGRAPHY — FROM CAPTION TO VOICE (do this first; everything composes around it)
- **Fraunces** — display only, full expression: `opsz` animated on every headline landing; `SOFT`/`WONK` axes sparingly for personality moments (season names, Beyond headline). Italic display lines; roman giant numerals.
- **Newsreader** (add via fontsource, text optical size, latin subset) — ALL chamber prose at 17–19px / 1.65 / max 38ch. Geist retires from prose.
- **JetBrains Mono** — jewelry only: labels, coordinates, captions, stats. 11–12px, 0.12em tracking, uppercase. Never a paragraph.
- Scale courage: threshold headline `clamp(4.5rem, 11vw, 11rem)`. Chamber headlines fill 60–75% of their column and **overlap the planet hero's limb by 4–8%**. Each chamber gets a **ghost numeral** (`01`–`08`, Fraunces roman, ~22vh, 3–4% bone opacity, behind content, cropped by viewport edge) and a **pull-stat moment** ($994 · 220 · 10 · 70.3 — Fraunces italic at 14–18vh, hairline rules, mono caption, counts up once on reveal, 800ms eased).
- Kinetic type everywhere: SplitText line-mask + opsz sweep for headlines; body fades up in 60ms-staggered lines. Nothing simply appears.
- Total font payload ≤ 280KB after subsetting.

## M2. LIGHT & ATMOSPHERE — LIGHT MUST TOUCH THINGS
- Three layered darks: base `--ink`; panels +2–3 lightness (warm-black); raised/hover a third step. Hairlines 8–10% bone. Retire flat-black fills.
- One deliberate key light per scene. In chambers, the live planet casts a soft amber wash that grazes the content panel's near edge — it must look caused, not decorative.
- Sun light reaches: planets rim-lit sunward; threads brighten near the core; INDEX overlay opens with a faint backlit glow.
- Finish: keep grain; add 0.5-strength corner vignette and the faintest chromatic fringe at extreme corners only.

## M3. THRESHOLD — FULL-BLEED, ALIVE, SEASONAL
- Kill the dead black band: terrain runs to the bottom viewport edge, ENTER ring sits within the landscape, page locked to 100dvh, zero scroll.
- Hide the pre-staged tunnel mouth: the dark dome behind the central peak must be invisible until the seam opens.
- **SEASONS** — four procedural states: `NIGHT` (current, default), `WINTER` (snow tinting on upward normals, falling snow drift, thicker fog, sharper stars, cold-bone palette with amber reserved for type/ring), `SPRING` (jade rising through valley floors, drifting petal motes, thinner fog, faint pre-dawn sky), `AUTUMN` (rust-amber elevation banding, sparse tumbling leaf quads, warm haze). Value/temperature shifts within the family — no candy colors.
- **Reconstruction transition:** changing season sweeps a soft-edged weather front across the terrain left→right over ~1.4s — vertices re-tint as it passes, old-season particles die at the front, new ones are born behind it, with a 1-vertex shimmer at the frontline. Eased, continuous, recorded, poster-tested. Reduced-motion: 250ms crossfade.
- **Season control:** bottom-left opposite skip-intro — four small drawn glyph-dots (no emoji), active one ringed amber and breathing at 54bpm; hover names the season in mono; keyboard reachable; choice persists (hash or sessionStorage).

## M4. BREACH — SHORTER, DENSER
- Total ≤2.2s: open 0.8s → tunnel 1.1s → arrival 0.3s. Single continuous spline; the no-cut frame-step audit re-runs after retiming.
- Densify so shorter never reads empty: 9–11 ribbons (one jade max), ghost-hex at 6–8%. Darkness still dominates. Re-record, re-scrub, re-pass.

## M5. HUB — A PLACE IN SPACE, PLANETS AS JEWELRY
- **Universe backdrop:** starfield carried through (parallax with drag-orbit) + ultra-subtle procedural FBM nebula (amber-to-jade, ≤6% opacity, slow drift). The system floats somewhere, not in void.
- **Sun:** corona rebuilt as smooth shader falloff — zero banding/scalloping (dither if needed). Surface: slow domain-warped plasma flow, limb darkening, hotter core-to-edge ramp. Molten, not clay. Keep the 54bpm breath.
- **Planets:** material pass — amber rim-light from sunward, subtle specular, one emissive identity accent each (Jarvis glyph rings glow; Luven radar sweep traces; Dolomite facets glint; Everclash hemisphere gap leaks energy; Voxhalla voxel seams hairline-glow; BigBack meridian arc burns slow; Beyond jade routes pulse; Emerge grid catches raking light). Scale all +15–25%. Identity must read at rest distance.
- **Pulse traffic:** slow to 1.4–2.2s per thread, ease-in-out, 3px comet head, longer fading tail; the thread warms as the pulse passes, cools after. A viewer can follow one with their eyes.
- **Delete the orbit arc-text** (`SYSTEMS / VENTURES`, `GAMES / LIFE`) everywhere — this also kills the stray glyphs bleeding into chamber views. The grouping moves to INDEX.
- **Anti-overlap (critical):** planets never occlude each other or merge hit areas — minimum angular separation with soft repulsion on drift phases, inclination bias so screen-space bounds can't intersect, hit areas ≥56px. Verify with an automated 5-minute drift simulation asserting zero overlaps; log the result.

## M6. NAVIGATION — OBVIOUS, BEAUTIFUL
- **INDEX:** add `[ INDEX ]` to the HUD top bar → full-viewport in-world overlay: ink panel, hairline rules, eight destinations as `glyph · NAME · one-line descriptor · status` in mono, grouped SYSTEMS / VENTURES / GAMES / LIFE, plus THE MOUNTAINS and HUB. Hover warms a row amber; click flies there (reuse the flight system); Esc closes; full keyboard nav; scan-line reveal. A ship's manifest, not a hamburger menu.
- **Chamber next/prev:** replace the tiny text rail with two visible chip buttons at the chamber's bottom edge — small live glyph of the destination planet + mono name + `EXPLORE →` / `← EXPLORE`, hairline border, magnetic hover with the ENTER ring-charge treatment. Obviously clickable within one second. Arrow keys hop planets.

## M7. CHAMBERS — EIGHT EDITORIAL SPREADS (no two alike, none symmetric; 12-col grid)
- JARVIS / console: content cantilevered right of a tall mono activity column; ghost numeral far left.
- LUVEN / ledger: pull-stat dominates upper right; narrow prose lower left; one hairline ledger table (PRODUCT · FIRST SALE · WORKFLOWS).
- EMERGE / dossier: stacked case-file rows, mono tabs, raking-light dividers.
- DOLOMITE / radar: sparse — one huge headline, one paragraph, the planet large.
- EVERCLASH / arcade: the 10-fighter grid is the visual mass; headline overlaps it.
- VOXHALLA / spec-sheet: brutalist two-column spec rows; oversized numbers.
- BIGBACK / teaser: maximum air, centered narrow column, keep the numbered stat list.
- BEYOND / atlas: the route polyline becomes a full-width band the text sits inside; warmest light; WONK-axis headline.
- Media/evidence frames: 1px corner brackets (8px legs), mono captions, tiny `FIG. 0n` marks. Mobile: single column, planet as a ~30vh header medallion, ghost numerals at 12vh, chips tappable ≥44px.

## M8. THE JEWELRY LAYER — implement all twelve
1. Hover underlines draw on left→right (1px amber, 180ms). 2. Hairline rules scaleX in on section reveal. 3. Stat tickers count up once. 4. Media corner brackets + FIG marks. 5. Custom selection: amber bg, ink text. 6. Styled chamber scrollbar (2px bone track, amber thumb). 7. Focus rings: 1px amber offset, never default blue. 8. Live HUD footer readouts: scene · planet count · real fps (tiny mono). 9. Ring-charge conic sweep systemized across all buttons/chips. 10. Cursor ring-pulse on successful click. 11. Season glyph breathes at 54bpm. 12. 404/fallback styled in-world (mono, coordinates, `[ return ]`).

## M9. SOUND (one pass, still default-off)
Soften every attack (5ms → 25ms), low-pass the ambience slightly, add a barely-audible pitch-down whoosh on chamber close.

## M10. VERIFICATION & SHIP
1. Motion evidence (recorded + 6-frame poster test): season front, retimed breach, one pulse follow, INDEX open/close, one chamber flight.
2. No-cut audit on the breach; anti-overlap drift simulation logged.
3. Type audit set: one 1440w capture per chamber proving scale courage (headline ≥60% column, ghost numeral, pull-stat present).
4. Poster-test stills: threshold in each season, breach, hub, all 8 chambers.
5. Full original §9 protocol re-run: console gate (zero errors AND warnings), keyboard nav, reduced-motion (incl. season crossfade), mobile pass, resilience, a11y (season control + INDEX labeled).
6. Before/after pairs per M-section in `verification/gorgeous/`.
7. Build; push; deploy with `vercel --prod --archive=tgz` (plain deploy fails on this network); production smoke of the live URL including the new interactions.

## M11. ACCEPTANCE (binary — all must pass)
1. Newsreader live for all prose; type scales per M1 (11vw threshold headline, ghost numerals, counting pull-stats, limb-overlap headlines).
2. Three-dark layering + light pools; planet light grazes panels; sun light touches threads and planets.
3. Threshold full-bleed (no dead band, no scroll); tunnel dome invisible pre-breach; four seasons live with the weather-front transition; control discoverable, persistent, keyboard-accessible.
4. Breach ≤2.2s, continuous, no-cut clean.
5. Hub floats in starred/nebula'd space; sun corona smooth (zero banding); all 8 planets pass the jewelry bar at rest distance; pulses followable; arc-text deleted; zero stray glyphs.
6. Zero planet overlap across the drift audit; hit areas ≥56px.
7. INDEX overlay live and vibe-matched; EXPLORE chips obviously clickable; arrow-key hops work.
8. All 12 jewelry details present; eight distinct chamber layouts; mobile medallion layout works.
9. All evidence captured; console gate clean; deployed; production smoke green.

Sequence: M1 → M3 → M2+M7 together → M4+M5 → M6 → M8+M9 → M10. Begin.
