# PLAN — everest-site build state

> Source spec: `ENTER_THE_MOUNTAINS.md`. This file always reflects exact current state.
> A fresh session resumes from here: read CLAUDE.md → this file → DECISIONS.md, then continue at the first unchecked item.

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

## P4 — Act IV: Chambers  [TODO]
- [ ] Transition system: isolation (0.3s) → handoff (0.4s, orchestrator → live mini-widget bottom-left) → CRT scan-line materialization from node position
- [ ] Fraunces opsz axis animation on chamber headline reveals (mandatory)
- [ ] 8 chambers, distinct layouts, §3 copy: jarvis (console) / luven (one-pager) / emerge (dossier) / dolomite (radar) / everclash (character select) / voxhalla (spec-sheet) / bigback (teaser) / beyond (timeline+map, contact block §7)
- [ ] Media convention: /public/media/<id>/ manifest check, procedural placeholder frames
- [ ] Lenis chamber scrolling synced to GSAP ticker; Esc + return controls; de-rez close
- [ ] Phase exit ritual

## P5 — Polish  [TODO]
- [ ] Sound layer (Web Audio synth: hub hum, breach whoosh, hover tick; default OFF, lazy AudioContext)
- [ ] Reduced-motion mode (§9.4): no breach (crossfade), static layout, opacity-tick pulses
- [ ] Mobile pass (390×844): tap targets ≥44px, vertical constellation if needed, no horizontal overflow
- [ ] Deep links cold-load; meta/OG tags + dark OG card asset; favicon final
- [ ] Phase exit ritual

## P6 — Verification  [TODO]
- [ ] §9.1 functional click-through (Playwright MCP, evidence recorded)
- [ ] §9.2 console gate: zero errors, zero warnings
- [ ] §9.3 screenshots 1440×900 + 390×844 → verification/ (threshold, hub, jarvis, beyond) — inspected
- [ ] §9.4 reduced-motion full click-through
- [ ] §9.5 mobile checks
- [ ] §9.6 fps probe ≥50fps + bundle budget <900KB gzip
- [ ] §9.7 resilience: double-fire, mid-breach resize, context-loss fallback
- [ ] §9.8 accessibility audit
- [ ] Fresh-subagent review vs §11 → fix gaps → re-verify
- [ ] VERIFICATION_REPORT.md complete
