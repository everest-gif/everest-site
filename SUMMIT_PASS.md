# THE SUMMIT PASS — directive R5
The site is close. This pass replaces the breach with something worthy of the work, brings the threshold to life, deepens the cosmos, and fixes every chamber-scale flaw.

## S0. CONTRACT
Autonomous; fix-loop until green; PLAN.md/DECISIONS.md current; commit per phase; subagents ≤3 parallel. Motion evidence for everything touched: record, extract 6 frames, **poster test** (every frame works as a standalone poster). Evidence + before/afters → `verification/summit/`. Restraint remains the style — these additions are accents, never clutter.

## S1. DELETE THE WORMHOLE. BUILD THE ASCENT.
The tunnel is retired — remove the tunnel scene, its shaders, and all references (code, copy, comments). The new transition, ≤1.8s, one continuous camera move, zero cuts:
1. **The open (0.7s):** unchanged in spirit — hairline blade draws down the central ridge, terrain splits with strata layering and glowing seam edges.
2. **The rise (0.8s):** instead of plunging in, the camera **ascends through the opening** — pitching up as it threads the gap, the mountain range falling away below and shrinking, fog layers streaking downward past the lens, stars brightening and gently rushing as altitude builds. A faint pressure-wave shimmer at the moment of clearing the peaks.
3. **The arrival (0.3s):** the climb eases; the hub's sun fades up ahead with planets resolving into their orbits around the camera's destination — the system was above the mountains all along. No whiteout needed; if a wrap is required technically, ≤90ms amber light-wrap maximum.
Metaphor for DECISIONS.md: enter the mountains → reach the summit → see the whole system. Reverse (return to mountains) is the descent, compressed to 1.2s. Reduced-motion: 250ms crossfade. Re-run the no-cut frame-step audit; scrub stills must pass the poster test.

## S2. THE THRESHOLD LIVES
- **Trees:** sparse instanced pine silhouettes on the lower slopes and valley edges — simple dark cone/cluster forms catching faint wireframe glow at their tips, density low (a treeline, not a forest), season-aware: snow-dusted in WINTER, faint jade buds in SPRING, rust-tinged in AUTUMN, near-black in NIGHT. They must read as quiet depth, never clip art.
- **Ambient life events:** every 8–20 seconds, one subtle silhouette event, season-matched, always shadow-forms at low contrast: NIGHT — an occasional shooting star or a slow owl glide; WINTER — a hawk circling high; SPRING — a small bird flock crossing mid-frame; AUTUMN — a geese V tracking across the sky. Rare (≤1 per 45s): a deer/elk silhouette walking a far ridgeline, 6–8s traverse. All procedural sprites/paths, eased, never looping visibly, never cartoonish. Reduced-motion: events disabled.
- Both layers respect the existing parallax and the seasons' weather-front transition (trees re-tint as the front passes).

## S3. THE COSMOS — DREAMY, NOT BLACK
- Build a **milky-way band**: a diagonal galactic structure behind the hub — layered star-density gradients, soft dust lanes, slow drift, parallax with drag-orbit.
- **Palette allowance, deep space only:** the band and nebula may carry desaturated violet-indigo alongside the amber dust (Project Hail Mary register: dreamy, dark, quiet). Opacity envelope 6–12%. Planets, threads, pulses, UI, and type remain strictly amber/jade/bone — the violet lives only in the sky. Record the allowance in DECISIONS.md.
- The band must sit behind everything and never compete with the system; if a poster still reads "purple website," dial it back.

## S4. DIRECT PLANET-TO-PLANET FLIGHT
Current hop flies out to the hub overview and back in — replace with a **single dolly arc** directly between planets (~1.0–1.2s): outgoing chamber content de-rezzes during the first 0.3s, the camera arcs through space (the system visible in passing), incoming content materializes in the final 0.4s as the new planet docks into its hero position. No intermediate zoom-out state. Applies to EXPLORE chips, INDEX selections, and arrow keys. Reduced-motion: 200ms crossfade.

## S5. CHAMBER GRID & COLLISION FIXES
- **Fixed zones:** the planet hero occupies the left 33–38vw with a hard gutter of ≥6vw before the content column. Content never enters the gutter; the planet never crowds the text.
- **Overlap law amended:** a headline may overlap the *planet's limb* only — never another text block, metadata row, media frame, or control. The Everclash chamber is rebuilt to comply: the meta rows (top-right) clear the headline entirely; the roster grid gets its own band below the headline with clean margins.
- **Automated collision audit:** at 1440, 1280, and mobile widths, programmatically assert zero intersecting text/interactive bounding boxes across all 8 chambers (planet limb overlap exempted). Log results; any intersection is a FAIL.

## S6. PLANETS BREATHTAKING UP CLOSE (LOD)
When a planet is the chamber hero, swap to a **high-detail variant** (chamber-only LOD so hub perf is untouched): all gain an atmosphere/fresnel rim and surface micro-detail; per identity —
- BEYOND becomes a miniature living earth: noise-grown landmasses, a soft drifting cloud layer, atmospheric rim, the jade route arcs animated across it.
- JARVIS: obsidian with faint subsurface circuit glints; glyph rings resolve into legible orbiting micro-glyphs.
- LUVEN: brushed warm surface with the radar sweep leaving a slow light trace across it.
- EMERGE: etched bone-metal with raking light revealing the dossier grid in relief.
- DOLOMITE: crystal with internal refraction and edge glints.
- EVERCLASH: the hemisphere gap leaks drifting energy particles; each half gets subtle surface tooling.
- VOXHALLA: already strong — add per-voxel ambient occlusion and occasional seam glow ticks.
- BIGBACK: matte carbon texture; the meridian arc burns with a soft heat shimmer.
Every close-up must pass the poster test on its own.

## S7. CHAMBER NAV — KNOW WHERE YOU ARE
Bottom-center of every chamber: an **orbital rail** — all 8 planet glyphs in orbit order, the current one ringed in amber with `0n / NAME` beside it; click any glyph to fly directly there (S4 flight). Keep the EXPLORE chips at the corners; arrow keys unchanged. Hover names each glyph in mono. Keyboard reachable; ≥44px targets on mobile.

## S8. VERIFICATION & SHIP
1. Motion evidence (recorded + poster test): the ascent, the descent, one direct planet hop, one ambient life event, one season front with trees re-tinting.
2. No-cut audit on ascent and descent; collision audit logs for all chambers at three widths; overlap drift audit re-run.
3. Poster stills: threshold per season (with trees), ascent scrub set, cosmos-backed hub, every planet close-up.
4. Full §9 protocol re-run (console gate zero errors/warnings, keyboard, reduced-motion, mobile, resilience, a11y for the orbital rail).
5. Grep the repo for "wormhole/tunnel" remnants — zero live references.
6. Build; push; deploy `vercel --prod --archive=tgz`; production smoke including ascent, direct hops, and the rail.

## S9. ACCEPTANCE (binary)
1. Tunnel fully deleted; the ascent is live, ≤1.8s, continuous, no-cut clean, poster-passed; descent reversed at 1.2s.
2. Treeline + season-aware ambient life events live, subtle, procedural; disabled under reduced motion.
3. Milky-way band live with the deep-space-only violet allowance; UI/planets remain amber-family; no still reads "purple website."
4. Planet-to-planet is a single direct arc from chips, INDEX, and arrow keys — no zoom-out intermediate.
5. Chamber gutter law enforced; Everclash rebuilt; collision audit zero-intersections at all three widths.
6. All 8 chamber close-ups upgraded per S6 and poster-passed; hub framerate unaffected (LOD verified).
7. Orbital rail live in every chamber with current-position indicator; all targets ≥44px on mobile.
8. Evidence complete in verification/summit/; deployed; production smoke green.

Sequence: S1 → S5 → S6 → S4 → S7 → S2 → S3 → S8. Begin.
