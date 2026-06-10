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

## P2 — Act II: Breach  [TODO]
- [ ] Master GSAP timeline (~3.2s): approach (FOV 45→70) → seam split (vertex peel via uniform) → wormhole tunnel (GLSL: amber/jade streaks, polar noise, hex lattice) → arrival whiteout → hub materialize
- [ ] Post chain: bloom, chromatic aberration ramp, vignette; speed-line particles; FOV→95, roll ≤6°
- [ ] No setTimeout chains; shaders precompiled in Act 0; 60fps budget
- [ ] Phase exit ritual

## P3 — Act III: Hub  [TODO]
- [ ] Core amber orb (fresnel, noise churn, 54bpm pulse) + `everest` label
- [ ] 8 nodes, 2 rings, unique drift params; sector arc-labels
- [ ] Threads core↔nodes + irregular traveling light pulses (0.8–4s)
- [ ] Hover: brighten + thread solid + others dim 40% + stat chip; crosshair cursor
- [ ] Keyboard: Tab cycles nodes (amber focus ring), Enter opens, Esc returns
- [ ] Reverse-breach (1.4s compressed) via [ return to mountains ]
- [ ] Phase exit ritual

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
