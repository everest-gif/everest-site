# PLAN — everest-site build state

> Source spec: `ENTER_THE_MOUNTAINS.md` + refinement directive `ENTER_THE_MOUNTAINS_R2.md` (R2 overrides on conflict).
> This file always reflects exact current state.
> A fresh session resumes from here: read CLAUDE.md → this file → DECISIONS.md, then continue at the first unchecked item.

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
