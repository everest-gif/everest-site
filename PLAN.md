# PLAN — everest-site build state

> Source spec: `ENTER_THE_MOUNTAINS.md` + `ENTER_THE_MOUNTAINS_R2.md` + `GORGEOUS_PASS.md` + `SUMMIT_PASS.md` (latest overrides on conflict).
> This file always reflects exact current state.
> A fresh session resumes from here: read CLAUDE.md → this file → DECISIONS.md, then continue at the first unchecked item.

## SUMMIT PASS (sequence: S1 → S5 → S6 → S4 → S7 → S2 → S3 → S8)
- [x] S1 The Ascent: tunnel fully deleted (TunnelWorld + shaders/tunnel + handles + SeamShroud);
      hub lowered y=600→64 — one continuous camera move, zero teleports/whiteouts (DECISIONS
      #48–50). Forward 1.8s, descent 1.2s, rm = 250ms ink veil. AscentField (800 streaks +
      18 fog veils, lens-proximity faded), hubPreGlow destination point, star-field handoff,
      range dims to 45%/40% in transit (additive-stack flood fix), pressure-wave shimmer +
      ripple chroma in grade pass. Motion evidence recorded fwd+rev (motion/), arrival probe
      clean, check-paths 7/7 (rm veil, abort mid-ascent, re-entry), console silent.
      Recorder pins deviceScaleFactor=1 (dpr-step screencast stall).
- [x] S5 Chamber grid: gutter law live — planet limb ≤38vw (LOOK_K/DIST_K retuned, verified
      8/8 by planet-zone.mjs), column from 42vw, scrim/chips moved, title scale 6.6→5.8vw
      (ratio to new measure). Everclash rebuilt (roster in own band, meta clears headline).
      Dolomite board overflow fixed (full-width grid). SplitText margin-collapse fix
      (padding-top blocks the negative-mask collapse). collision-audit.mjs (text-block
      model, decorative exempt, floating layer separate): ALL CLEAN ×24 (8 chambers ×
      1440/1280/390). Logs in verification/summit/.
- [x] S6 Planet LOD: PlanetBuild gains hero param (eased dt·6 by HubWorld); shared
      makeAtmosphere/gateHero (planets/hero.ts); all content factory-built (precompiler
      owns shader compile — no dolly hitch), visible-gated → 0 hub draw calls. All 8 per
      identity: jarvis circuit glints + legible slowed glyph rings · luven brushed grain
      + sweep afterglow · emerge raking-light relief grid (painted grid yields ×0.22 at
      hero) · dolomite internal caustics + facet pops · everclash gap motes + hairline
      tooling · voxhalla per-voxel AO + seam ticks · bigback carbon twill + arc heat
      shimmer · beyond living earth (continents/clouds/jade arcs). 7 by parallel agents
      (waves ≤3), jarvis reference by main session; 2 tuning fixes from poster review
      (emerge/everclash wireframe-ball reads). close-*.png poster-passed ×8; hub 120fps
      (avg 8.35ms, worst 10.7ms) — LOD verified.
- [x] S4 Direct planet-to-planet flight: single 1.1s dolly arc (midpoint bowed outward,
      adaptive bow clears the corona for near-opposite pairs), FOV breathe 5 (was 13 —
      no zoom-out read), de-rez concurrent with flight (first 0.32s), incoming chamber
      materializes over final 0.42s as the planet docks. All entry points funnel through
      hopChamber → one path (chips/INDEX/arrows). Reduced motion: true 200ms crossfade
      (0.1s out + 0.1s in). Evidence: motion/hop.webm + frames; 8-hop ring traversal +
      rapid-fire abuse → console silent.
- [x] S7 Orbital rail: bottom-center nav in every chamber — 8 NodeGlyphs in orbit order,
      current ringed amber + `0n / NAME` beside, hover names each stop in mono, clicks
      ride the S4 direct flight, native-button keyboard order, aria-current; mobile: own
      band above the chips, 44×44 targets (probe-verified), tooltip yields to the label.
- [ ] S2 Threshold lives: season-aware instanced treeline (shader-welded to terrain heightAt)
      + ambient life events (8–20s cadence, season-matched silhouettes, rare ridgeline elk);
      reduced-motion disabled
- [ ] S3 Cosmos: milky-way band behind hub, deep-space violet-indigo allowance 6–12%
      (sky only), drift + parallax; DECISIONS entry
- [ ] S8 Verification & ship: motion evidence ×5 + poster tests, no-cut audits, collision logs,
      §9 protocol re-run, tunnel-remnant grep = zero, deploy + production smoke

## GORGEOUS PASS (sequence: M1 → M3 → M2+M7 → M4+M5 → M6 → M8+M9 → M10)
- [x] M1 Typography: Newsreader prose (17–19px/1.65/38ch), Geist retired, Fraunces full-italic
      (opsz+SOFT+WONK) + roman numerals; threshold headline 11vw; chamber titles 6.6vw w/
      SplitText line-mask + opsz sweep; ghost numerals (auto, 01–08, 22vh/12vh mobile);
      PullStat component (counts up once, 800ms); reveal engine (prose line-stagger 60ms,
      [data-rule] scaleX, .ch-stat-value tickers); limb overlap via chamber camera (NDC −0.38)
      + in-padding margin pull. Payload 278.2KB ≤ 280KB. Reference pull-stats in jarvis/luven;
      remaining six land with M7.
- [x] M3 Threshold: front layer extended past the camera's bottom ray (full-bleed, zero dead
      band, 100dvh lock); tunnel tube+cap gated invisible until the seam parts; 4 seasons
      (night/winter/spring/autumn) as terrain-shader palettes + seasonal fog/stars/sky-glow +
      3 particle systems (snow/petals/tumbling leaves); weather-front sweep 1.4s L→R w/
      frontline shimmer + spatial re-tint (probe-front05.png), reduced-motion = 250ms
      crossfade via giant edge width; season control bottom-left (drawn glyphs, 54bpm ring,
      radiogroup keyboard, sessionStorage persist); skip-intro → bottom-right; breach
      near-fade regression caught + fixed (uNearBright-driven fade window)
- [x] M2+M7 Light: --ink-3 third dark + --hairline-2, vignette 0.5, corner-only chromatic
      fringe in grade pass, planet amber wash (.chamber-glow anchored to planet screen-Y),
      evidence frames (Brackets + FIG. 0n on gallery/placeholders). Eight editorial spreads
      (no two alike, 12-col, asymmetric): jarvis console-rail cantilever (main session) ·
      luven ledger w/ PRODUCT·FIRST SALE·WORKFLOWS table (agent) · emerge stacked case-files
      w/ mono tabs + raking dividers (agent) · dolomite sparse radar, planet enlarged via
      DIST_K (agent) · everclash roster-mass w/ overlapping headline (agent) · voxhalla
      brutalist sheet w/ oversized numerals (agent) · bigback max-air teaser, camera pulled
      back (agent) · beyond atlas band w/ WONK headline (main session). Pull-stats in all 8
      (220 · $994 · 4 · 7 · 10 · 6v6 · 1 · 70.3). Mobile medallion framing (portrait
      chamberCam top-center + 30vh scrim window). All copy preserved verbatim.
- [x] M4+M5 Breach: same R1 spline waypoints remapped to 2.2s (open 0.8 / tunnel 1.1 /
      arrival 0.3, measured 2.26s wall incl. input latency), 10 ribbons (1 jade), ghost hex
      7%, lockup fall 0.5s, whoosh 2.2s. Hub: starfield shell + desaturated FBM nebula
      wisps ≤3%; corona rebuilt as camera-facing billboard w/ exp falloff + IGN dither
      (zero banding); core limb-darkened molten ramp; planets +19% (NODE_R 0.19) w/
      per-planet sunward rim shells; threads vertex-color gradient (bright at core) +
      pulse-warming; pulses 1.4–2.2s ease-in-out, 9-sample tight comet trails, 3px heads;
      arc-text DELETED. Anti-overlap: orbits rebuilt co-rotating w/ annular ring
      separation (nodes.ts), per-ring angular-spacing controller + cross-ring time-shift
      backstop + rate-bounded spring (orbits.ts); hit areas 56px. OFFICIAL drift audit
      (shipped solver, 300s@60Hz): minDiscGap +0.227, minCenterSep 0.635 (≈73px) — zero
      overlaps; 900s headroom +0.119/0.535 (verification/gorgeous/drift-audit.log)
- [x] M6 INDEX manifest (groups SYSTEMS/VENTURES/GAMES/LIFE + PLACES, drawn glyphs
      [ui/glyphs.tsx], descriptors + honest statuses, scan-line reveal + backlit glow, arrows
      walk rows / Enter travels / Esc closes via capture handler, focus restore); travel
      reuses flights (hub→open, chamber→hop, mountains→close-then-reverse via guarded poll);
      EXPLORE chips (glyph + name + EXPLORE arrow, charge-rect sweep, magnetic ≤6px, z5
      above spread stacking, clear of hud-br); ArrowLeft/Right hop planets. Esc guards so
      the INDEX owns keys while open.
- [x] M8+M9 Jewelry 12/12: draw-on underlines (.prose/.chamber-content a), [data-rule]
      scaleX engine, stat tickers, brackets+FIG, amber/ink selection, 2px chamber scrollbar,
      amber focus rings (pre-existing), HUD readouts scene·bodies·fps (real rAF), charge
      sweep systemized (.chip-charge), cursor ring-pulse on click, 54bpm season glyph,
      in-world 404 (router→lost flag, Fraunces 404 over live threshold, [ return ]).
      M9: tick attack 25ms, ambience LP 130Hz, 0.5s pitch-down close-whoosh (chamber→hub).
- [x] M10 Protocol 58/58 (verify.mjs §9 + M-checks, console gate clean); motion evidence ×5
      recorded + 6-frame poster sets (motion/); no-cut 15 frames @12fps zero cuts; type audit
      8/8 (headline 100% col, ghosts, pull-stats); drift audit logged; BEFORE-AFTER.md;
      deployed (vercel --prod --archive=tgz + NODE_OPTIONS=--tls-max-v1.2 for this network's
      SSL bad-record-mac; git push needs http.version=HTTP/1.1) → LIVE SMOKE 21/21 incl.
      INDEX/chips/arrows/seasons/404/font-payload. All 9 M11 criteria MET —
      VERIFICATION_REPORT.md rewritten.

## GORGEOUS PASS COMPLETE — all M11 criteria met, production verified

## R1 — Breach total rework  [IN PROGRESS]
- [x] BEFORE evidence captured (verification/r2/before/: breach video+frames, hub, 8 nodes, 2 chambers)
- [x] Continuity: tunnel moved from y=300 pocket into threshold space behind the seam (TUNNEL_CY/Z0 in handles); camera flies one monotone-cubic C1 spline (z/y/FOV) home→seam→tunnel; entry teleport DELETED; only the sanctioned ≤120ms amber wrap at hub arrival remains
- [x] Mountain opens (R1.2): bone blade draws down crest (0.3s) → strata-banded split w/ tear jitter + snapping gap-bridge threads (0.5s) → camera threads in during final 0.3s; SeamShroud = solid interior darkness behind the wound
- [x] Tunnel art direction (R1.3): opaque-ink tube (occludes stars), ghost hex ≤5% lit by sliding pools, 7 streak ribbons (1 jade), dim particle field, sealed end cap w/ convergence point; brown ambient + giant hexes + DoF/fisheye deleted; bloom 0.6 in-flight; chroma only at seam-entry/arrival ≤0.0035
- [x] Arrival: ribbons converge → 120ms amber wrap → wrap-radius CONTRACTION into hub core (radial mask in grade pass)
- [x] Lockup parallax-falls behind camera (transform stretch, not filter blur — blur cost 25–275ms raster stalls)
- [x] Perf: in-flight rAF gaps clean (avg 8.4ms @120Hz, worst 16.7ms, 0 over frame+8ms); hub canvas textures pre-uploaded at boot; lockup unmount deferred into arrival wrap
- [x] Reverse breach rebuilt: wrap expands from core → backing out of tunnel → terrain fades in → seam closes
- [x] Scrub test 0/20/40/60/80/100% all composition-worthy (verification/r2/scrub/; ?scrub=1 exposes __breachTl on preview builds; convergence point moved AHEAD of final camera after 100% still failed)
- [x] Reverse breach + abort paths verified (check-paths.mjs: abort mid-breach→hub, Esc→reverse→threshold, re-entry, ?rm=1 — all pass, console clean)
- [x] Phase exit ritual (typecheck ✓ build ✓ recordings clean ✓ commit)
- NOTE: arrival teleport carries a ~30–50ms task (lockup unmount + HubOverlay mount) fully inside the amber wrap — invisible; in-flight is 0 frames over budget.

## R2 — Hub solar system  [DONE]
- [x] Core sun: domain-warped churn + granulation + sunspots + limb corona (54bpm kept)
- [x] 8 planet identity modules (src/scene/planets/, shared PlanetBuild contract) — 6 by parallel agents, everclash+beyond by main session (agents died on spend limit); bigback arc tube was sub-pixel → 0.05
- [x] Pulse traffic heads+trails; labels alternate above/below (lab-above); arc-text hemisphere flip (no mirrored text); drag-orbit ±12° w/ slow spring-back (z-spread deepened or the lean read as nothing)
- [x] Identity check ≥6/8 from visuals (verification/r2/after/close-*.png)

## R3 — Fly to the planet  [DONE]
- [x] Click → 0.95s curved flight (scene/flight.ts quad-bezier, live target — planet keeps orbiting; camera then TRACKS it); content scan-line reveal after landing
- [x] Planet = live chamber hero, left third; content right 2/3 over clean ink gradient; .chamber-scrim (blurred-hub backdrop) DELETED
- [x] Planet-to-planet rail (← prev · next →): de-rez → 1.15s arc past the core (FOV widens — whole-system glimpse) → materialize; both directions; hash stays synced via router
- [x] Esc / [← hub] flies back out (settle path); Esc mid-flight aborts clean; deep links open at the planet (no flight)
- [x] Mini-orchestrator DELETED (judgment call → DECISIONS #34); canvasCovered no longer set (planet renders all visit)
- [x] Reduced motion: no flights, instant swaps, static planets

## R4 — Chamber visuals  [DONE]
- [x] Blurred-hub backdrop deleted everywhere; clean ink gradient for legibility
- [x] Atmosphere hero art in all 8 chambers — generated procedurally (tools/make-art.mjs, WebGL frag compositions, palette-locked, grain+duotone, ≤350KB each as avif/webp/jpg in public/art/<id>/). Higgsfield MCP was NOT available at execution → DECISIONS #36; assets are drop-in replaceable
- [x] HeroArt component (graceful absence); evidence Gallery/media convention untouched (real screenshots only)
- [x] Grids tightened by 8 parallel agents (waves of ≤3); section markers kept

## R5 — Copy  [DONE]
- [x] Every headline/kicker/body/chip rewritten to voice rules from the verified-facts table; invented P4-era claims stripped; AGARVOICE line added; voxhalla "parked on purpose", bigback "on the bench"
- [x] Audited: zero banned words, zero exclamation points, facts grep-verified in place

## R6 — Threshold polish  [DONE]
- [x] Flatirons tilted-slab bias in heightAt; fog drift contrast ×2 for visible parallax; [ skip intro ] → bottom-left (.hud-skip); lockup raised to 12.5vh

## R7 — Verification  [DONE]
- [x] §9 re-run: verify.mjs updated for R2/R3 (chips, flight timing, hud-skip) → **47/47 PASS**
- [x] Motion evidence: breach.webm + flight.webm (hub→planet, hop both directions, esc-out) + frame extractions + scrub stills in verification/r2/
- [x] No-cut audit: 12fps frame-step across seam entry — continuous, zero cuts (verification/r2/nocut/)
- [x] Identity check: close-*.png — ≥6/8 planets identifiable
- [x] Perf: breach avg 7.0ms/worst 13.7ms local; **144fps avg, 8ms worst gap on production**; JS 339KB gzip (<900KB); art ≤350KB each
- [x] Deployed (vercel --prod --archive=tgz; plain deploy hit SSL bad-record-mac on bulk upload) → smoke-live **14/14 PASS** vs https://everest-site-azure.vercel.app

## R8 — Acceptance: all 7 binary criteria MET (see VERIFICATION_REPORT.md)

## P0 — Scaffold  [IN PROGRESS]
- [x] git init (branch `main`)
- [x] package.json — locked stack, versions verified against registry (fiber 8.18 / drei 9.122 / three 0.170 / gsap 3.15)
- [x] tsconfig (strict) + vite.config (manual chunks: three/gsap)
- [x] npm install clean
- [x] index.html shell + favicon.svg (amber orb)
- [x] CLAUDE.md (conventions)
- [x] Design tokens + global stylesheet (`src/styles/global.css`)
- [x] zustand state machine (`src/state/store.ts`) — boot/threshold/breach/hub/reverse-breach/chamber + guards
- [x] Hash router (`src/state/router.ts`) — `#/` `#/hub` `#/hub/<id>`, back/forward, deep-link entry
- [x] Font self-hosting (fontsource variable: fraunces opsz-italic / jetbrains-mono / geist) + real load tracking (`src/lib/fonts.ts`)
- [x] Boot overlay (Act 0): real progress %, amber hairline, RGB-split glitch at 100%
- [x] HUD shell: everest.os v1.0, Boulder clock, sound toggle, breadcrumb, skip intro / return controls
- [x] Custom cursor (dot + lerped amber ring, mode morphs: enter/node/back/text)
- [x] Grain + vignette overlays
- [x] A11y nav (hidden text equivalent of hub) + WebGL context-loss fallback component
- [x] typecheck + build green → smoke test → commit `P0`

## P1 — Act I: Threshold  [DONE]
- [x] Persistent R3F Canvas (dpr clamp [1,2], PerformanceMonitor, RAF pause on visibilitychange)
- [x] Wireframe ridgeline terrain — 4 depth planes, noise displacement, amber edge glow, vertex pulses
- [x] Fog sheets (shader) + starfield with sub-pixel twinkle
- [x] Mouse parallax (±1.5°, lerped); device-tilt or drift on touch
- [x] Type lockup (eyebrow / Fraunces italic headline / Geist sub) + ENTER affordance (breathing ring, magnetic hover, conic charge on hover)
- [x] Enter via click, Enter key, Space — double-fire guarded in store action
- [x] Shader precompile (gl.compileAsync) wired to boot progress
- [x] PostFX: three-native composer (UnrealBloom + custom grade pass + OutputPass) — see DECISIONS #11/#12
- [x] Phase exit ritual (typecheck ✓ build ✓ browser smoke ✓ console clean on preview ✓)
- NOTE: BreachDriver is a 600ms placeholder — replaced by the real master timeline in P2.
- NOTE: PostFX.tsx still carries dev-only A/B query switches (nobloom/nograde/noout/bt999) + window.__composer debug exposure — strip in P2.

## P2 — Act II: Breach  [DONE]
- [x] Master GSAP timeline (3.2s, `src/scene/BreachTimeline.tsx`): approach (FOV 45→70, nearBright) → seam split (shared uSeam uniform peels vertices + seam light blade) → whiteout-masked teleport into tunnel pocket (y=300) → wormhole (amber/jade streak shader, polar rush, faint hex lattice, speed-line LineSegments, FOV→95, roll 6°, chroma ramp) → arrival whiteout → teleport to hub home + detached arrival fade
- [x] Reverse breach (1.4s compressed) — hub → tunnel backward → seam → threshold
- [x] Abort-safe cleanup (skip intro / history nav mid-flight resets all transit uniforms)
- [x] Frame sampling during breach: avg 8.3ms, worst 11.2ms (120Hz display) — no stalls
- [x] Re-entry verified (second breach after reverse works; no stale timelines)
- [x] Phase exit ritual (typecheck ✓ build ✓ preview console clean ✓)

## P3 — Act III: Hub  [DONE]
- [x] Core amber orb (fresnel, churn, 54bpm heartbeat in shader) + `everest` label (projected DOM)
- [x] 8 nodes (XY-plane orbits facing camera, unique radius/speed/phase/incline), 2 ring guides, sector arc-text (canvas-texture, self-hosted mono font, clockwise traverse)
- [x] Threads (per-node THREE.Line, endpoint updated per frame) + pulse traffic (22-slot pool, 0.8–4s irregular, amber=instruction core→node, jade=report node→core)
- [x] Hover/focus: node brightens ×1.25, thread solid, others dim 40%, stat chip docks; crosshair cursor via data-cursor
- [x] DOM overlay buttons projected from 3D (native Tab cycling, aria-labels, focus ring); Enter opens; Esc on hub = reverse breach
- [x] Mobile fit factors (xFit/yFit) reflow to tall constellation; core scales down
- [x] Reveal stagger on arrival (core 0.35s + nodes 0.4s × 0.055 stagger)
- [x] Reduced motion: drift frozen, pulses become slow opacity ticks
- [x] Phase exit ritual (typecheck ✓ build ✓ hover/keyboard/Esc verified in browser ✓ console clean ✓)
- LESSON: hard-reload (cache-bust ?cb=) when verifying preview builds — a stale cached index.html cost a debugging detour.

## P4 — Act IV: Chambers  [DONE]
- [x] Transition system (`src/ui/ChamberLayer.tsx`): isolation (scrim + node surge via hover state) → handoff (camera push via chamberFocus + orchestrator collapses into live 2D-canvas mini-widget) → CRT scan-line materialization (twin beams from node screen-Y + clip-path reveal + scanline texture + single ≤80ms RGB flicker on marginalia). De-rez close reverses into the node. Esc + HUD + in-content + widget all close.
- [x] Fraunces opsz 9→144 sweep on every chamber headline (shared ChamberTitle — mandatory §11.4)
- [x] 8 chambers, distinct layouts, full §3 copy — 6 built by parallel workflow agents, Beyond.tsx by agent (died mid-run on API spend limit; its missing module.css written by main session), Jarvis by main session as reference. All reviewed against §4/§5 by main session, all verified visually at 1440×900.
- [x] Media convention: fetch /media/<id>/manifest.json → gallery; absent → glowing wireframe placeholder frames (public/media/README.md documents it)
- [x] Lenis on chamber scroll container, driven by gsap.ticker; destroyed on close
- [x] RAF pause while chamber covers canvas (canvasCovered → frameloop 'never'); mini-widget keeps the system visibly alive
- [x] compileAsync guarded behind KHR_parallel_shader_compile check (kills three.js warning on SwiftShader)
- [x] Phase exit ritual (typecheck ✓ build ✓ all 8 chambers shot + inspected headed ✓ console clean ✓)
- NOTE: verification runs use a controlled Playwright (devDep) headed browser — the MCP browser (user's Chrome) suffers 1fps rAF throttle when occluded; headless SwiftShader makes GSAP timelines crawl via lagSmoothing. Headed + GPU is the honest §9 environment.

## P5 — Polish  [DONE]
- [x] Sound layer (`src/lib/audio.ts`): 54Hz detuned hum + noise bed on hub, bandpass whoosh on breach (reversed for return), hover tick. Default OFF, AudioContext lazy on first enable, master ≈ −19dB. Sound-check script clean.
- [x] Reduced-motion mode wired through every act (verified in P6)
- [x] Mobile pass (`verification/mobile-pass.mjs`): CLEAN — jarvis console overflow fixed (minmax(0,1fr)), HUD version label hidden ≤640px
- [x] Deep links cold-load; meta/OG/twitter tags; og.png (1200×630, captured from the live threshold); favicon.svg + apple-touch-icon.png
- [x] Phase exit ritual

## P6 — Verification  [DONE]
- [x] Full §9 protocol scripted: `node verification/verify.mjs` → **47/47 PASS** (results in verification/RESULTS.json)
- [x] §9.1 click-through · §9.2 console gate (zero messages) · §9.3 screenshots inspected · §9.4 reduced motion · §9.5 mobile · §9.6 perf (144fps breach / 145fps hub / 328KB gzip) · §9.7 resilience · §9.8 a11y (5.32:1)
- [x] VERIFICATION_REPORT.md complete
- [x] Fresh-subagent review vs §11 → 2 gaps found (chamber opsz sweep hidden behind clip; magnetic hover missing on node labels) → both fixed + probe-verified → full §9 re-run 47/47 PASS → final commit

## BUILD COMPLETE — all phases done, all §11 criteria met, evidence in VERIFICATION_REPORT.md

## P7 — Launch  [DONE]
- [x] §7 contact values filled: email everest@luven.ai · github.com/everest-gif · linkedin (X entry dropped — key removed from CONTACT, row removed in Beyond.tsx)
- [x] GitHub repo everest-gif/everest-site (public): created, origin added, main pushed
- [x] Vercel production deploy → https://everest-site-azure.vercel.app (project everest-site, scope everest-2906, framework preset vite)
- [x] og:image + og:url (+ twitter:image, same relative-URL issue) absolute on the production alias → rebuilt, redeployed
- [x] Playwright smoke vs LIVE https://everest-site-azure.vercel.app — **14/14 PASS** (`node verification/smoke-live.mjs <url>`, headed). First run 13/14: media-manifest probes 404 on Vercel (vite preview had SPA-masked them) → empty manifests pre-seeded for all 8 chambers (DECISIONS #27) → re-run clean. Contact rows, og tags, console gate all verified on production.
