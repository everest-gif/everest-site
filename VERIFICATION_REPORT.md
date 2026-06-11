# VERIFICATION REPORT — R2 directive (ENTER_THE_MOUNTAINS_R2.md)

Production: https://everest-site-azure.vercel.app · verified 2026-06-11
(The v1.0 launch report this replaces is preserved in git history at tag-commit bb622fd.)

## R8 acceptance — all 7 binary criteria MET

1. **Breach is one continuous shot.** Tunnel relocated into threshold world space; the only
   discontinuity is the sanctioned ≤120ms amber light-wrap at hub arrival, which contracts
   into the core. Mountain visibly splits: bone blade draws down (0.3s) → strata-banded
   vertex split with tearing threads (0.5s) → camera threads the closing gap (0.3s overlap).
   Tunnel is dark-with-ribbons: opaque ink walls, ghost hex ≤5%, 7 streak ribbons (1 jade).
   Scrub stills 0/20/40/60/80/100% all pass (`verification/r2/scrub/`).
   No-cut audit: 12fps frame-step across seam entry — zero cuts (`verification/r2/nocut/`).
2. **Core reads as a sun** — domain-warped churn, granulation, drifting sunspots, limb
   corona, 54bpm pulse. All 8 planets visually distinct per R2.2 (`after/close-*.png`,
   ≥6/8 stranger-identifiable). Pulse traffic: bright heads + fading trails, multiple
   visible in any 5s window.
3. **Labels never collide** (alternating above/below placement; BEYOND/BIGBACK opposite
   sides). Sector arc-text orientation flips by hemisphere — no mirrored/inverted text.
   Drag-orbit ±12° with slow spring-back works (probe + lean screenshots).
4. **Click = 0.95s curved flight**; the planet persists as the live left-third chamber hero
   for the whole visit; planet-to-planet rail works both directions (1.15s arc past the
   core, recorded in `after/flight.webm`); blurred-hub backdrop fully deleted.
5. **Atmosphere art present in all 8 chambers**, palette-locked (#0A0A0C/#E8A23D/jade
   accent), atmosphere-only; zero fake evidence imagery — evidence slots still honor
   /public/media (real screenshots only). Note: generated procedurally (DECISIONS #36 —
   Higgsfield MCP absent); drop-in replaceable.
6. **Copy passes the voice rules**; facts match R5's verified table exactly (grep-audited);
   honest states preserved (voxhalla parked, bigback benched); AGARVOICE line present.
7. **Evidence complete; console gate clean; deployed and smoke-passed on production.**

## Protocol results

- §9 full re-run (`node verification/verify.mjs`): **47/47 PASS** (RESULTS.json)
  — click-through, console gate (zero messages), screenshots, reduced motion, mobile,
  resilience (double-fire, mid-breach resize, context loss), accessibility (5.32:1).
- Live smoke (`node verification/smoke-live.mjs <prod>`): **14/14 PASS**
  — breach on production: 144fps avg, worst frame gap 8ms.
- Perf: local breach rAF avg 7.0ms / worst 13.7ms (120Hz), 0 frames over budget;
  JS bundle 339KB gzip (<900KB); each art asset ≤350KB (max ~80KB jpg).
- Motion evidence: `verification/r2/after/{breach,reverse,flight}.webm` + 6-frame
  extractions + before/after pairs (`before/` vs `after/`) for tunnel, hub overview,
  all 8 planet close-ups, chambers.

## Environment

Headed Chromium + GPU via @playwright/test (the §9-honest environment — see DECISIONS #22).
Breach evidence recorded at 1280×720; chambers at 1440×900; mobile at 390×844.
