# VERIFICATION REPORT — SUMMIT PASS (directive R5, SUMMIT_PASS.md)

Production: https://everest-site-azure.vercel.app · verified 2026-06-11
(The M11 report this replaces is preserved in git history at 61a8840.)

> Environment: headed Chromium + GPU via @playwright/test (DECISIONS #22); recordings at
> deviceScaleFactor 1 (DECISIONS #54); perf from rAF samplers, never from recorded runs.
> Protocol run: `node verification/verify.mjs` → **63/63 PASS** (verification/RESULTS.json).

## S9 acceptance — all 8 binary criteria MET

1. **Tunnel deleted; the ascent is live.** TunnelWorld.tsx, shaders/tunnel.ts, all tunnel
   handles/constants deleted; live-code grep for "tunnel|wormhole" returns zero (only the
   historical docs record the deletion). The hub moved from a y=600 pocket to y=64 —
   physically above the mountains in one world (DECISIONS #48) — so the ascent is one
   continuous camera move on monotone-cubic splines: no teleport, no whiteout, no wrap.
   Open 0.7s / rise 0.8s / arrival 0.3s; measured Enter→hub **1847ms wall** including
   input latency. No-cut: 12fps frame-step over ascent + descent — zero cuts, zero dead
   frames (summit/nocut-audit.log). Poster: 6-stop scrub set (summit/scrub/) — every
   still composition-worthy. Descent reversed at 1.2s (motion/descent.webm). Reduced
   motion: 250ms ink-veil crossfade, measured 214ms (check-paths.mjs **7/7**: rm veil,
   abort mid-ascent, re-entry, console silent).

2. **Treeline + ambient life live, subtle, procedural, rm-disabled.** 250 instanced pines
   (2 draw calls) welded to the terrain height field via the shared GLSL chunk — they ride
   the seam split and re-tint with the weather front; band-filtered to the glowing lower
   slopes, silhouettes darker than the sky ink (DECISIONS #53). Life events: one per
   8–20s, season-matched (night shooting star/owl, winter hawk, spring flock, autumn
   geese V), elk ridgeline traverse ≥45s apart; reduced motion never schedules. Captured
   live: shooting star + autumn front with trees re-tinting (motion/life.webm, f_040);
   posters per season (summit/threshold-*.png).

3. **Milky-way band live; violet stays in the sky.** Diagonal band (−24°): fbm spine +
   dust lanes + granulated star-density + slow drift, plus a 380-star band-aligned cloud
   parallaxing with drag-orbit. Desaturated violet-indigo #7A6FA8, deep space ONLY,
   alpha envelope ≤0.105 (inside 6–12%) — planets/threads/pulses/UI/type remain strictly
   amber/jade/bone (DECISIONS #52). Posters (cosmos-hub.png, cosmos-hub-lean.png):
   no still reads "purple website."

4. **Planet-to-planet is one direct arc.** 1.1s dolly arc between bodies (midpoint bowed
   outward; adaptive bow clears the corona for near-opposite pairs); de-rez concurrent in
   the first 0.32s, incoming chamber materializes over the final 0.42s as the planet
   docks. Chips, INDEX, and arrow keys all funnel through the same path. No zoom-out:
   protocol asserts FOV 54.7 ≤ 58 mid-arc (was 63 pre-summit). 8-hop ring traversal +
   rapid-fire arrows → console silent. Reduced motion: true 200ms crossfade.

5. **Gutter law enforced; Everclash rebuilt; collision audit zero.** Planet body ≤38vw
   (planet-zone.mjs **8/8**, limbs 33.7–37.5vw), hard gutter, content column from 42vw
   (DECISIONS #50a). Everclash: roster in its own band, meta clears the headline.
   Dolomite board overflow fixed; SplitText margin-collapse fix on all titles.
   collision-audit.mjs (text-block model): **ALL CLEAN** — 8 chambers × 1440/1280/390,
   content + floating layers (chips moved to true corners to clear the rail).

6. **All 8 close-ups upgraded; hub untouched.** Hero LOD per identity — jarvis circuit
   glints + legible glyph rings · luven brushed grain + sweep afterglow · emerge
   raking-light relief grid · dolomite internal caustics + facet sparks · everclash gap
   motes + hairline tooling · voxhalla per-voxel AO + seam ticks · bigback carbon twill +
   arc heat shimmer · beyond living earth (continents, drifting clouds, jade arcs).
   All factory-built and visibility-gated: zero hub draw calls at hero=0. Posters
   (summit/close-*.png ×8) pass. Hub: **120fps** (display-limited), avg 8.35ms,
   worst 10.7ms over 358 frames — LOD verified.

7. **Orbital rail live everywhere.** 8 glyph stops in orbit order, current ringed amber
   with `0n / NAME`, hover names each stop in mono, clicks ride the direct flight,
   native-button keyboard order + aria-current (protocol-verified), mobile targets
   measured 44×44.

8. **Evidence complete; deployed; production smoke green.** verification/summit/ holds
   motion (ascent/descent/hop/life + 12fps frame sets), the scrub poster set, per-season
   thresholds, close-ups ×8, cosmos stills, collision/drift/no-cut/planet-zone logs.
   Drift audit identical to the M10 baseline (+0.227 @300s, +0.119 @900s — zero
   overlaps). §9 protocol 63/63 with a zero-error console gate. Live smoke vs
   production: **see below.**

## Production smoke
`node verification/smoke-live.mjs https://everest-site-azure.vercel.app` — includes the
ascent, INDEX/chip/arrow direct hops, the orbital rail (8 stops + direct rail flight),
seasons, 404, font payload ≤280KB, og tags, console gate. Result recorded in PLAN.md S8.
