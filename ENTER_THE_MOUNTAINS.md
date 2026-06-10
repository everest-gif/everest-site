# ENTER THE MOUNTAINS — One-Shot Build Directive
### Personal portfolio site for Everest · Codename: THE BREACH
### Target quality bar: indistinguishable from a $20,000 custom studio build. Awwwards / Godly-submittable.

---

## 0. AUTONOMY CONTRACT — READ FIRST

You are building this site **end-to-end in this single session**. Operate at maximum effort with deep thinking on every architectural decision.

Rules of engagement:

1. **Do not stop to ask questions.** Every decision you need is in this document. Where judgment is required, choose the option that maximizes craft, then note it in `DECISIONS.md`.
2. **Do not declare victory until the Verification Protocol (§9) passes in full.** A site that "should work" is a failed run. A site you have *watched work in a real browser* is a finished run.
3. **Work in phases (§8). After every phase: typecheck, build, and smoke-test before moving on.** Never stack two broken phases.
4. **If something fails, you fix it and re-verify.** Loop until green. You have permission to refactor your own earlier work.
5. Maintain three living files in the repo root as you work: `PLAN.md` (phase checklist, updated as you go), `DECISIONS.md` (judgment calls), `VERIFICATION_REPORT.md` (final evidence, §10). **PLAN.md must always reflect the exact current state** — precise enough that a fresh session with zero memory could resume mid-build from it alone.
6. **Git discipline:** `git init` in P0. Commit at every phase gate with a clear message (`P2: breach sequence complete — build green`). Never leave a phase uncommitted. This is the rollback net for a long autonomous run.
7. **Subagents & dynamic workflows:** you may fan isolated work (shader prototyping, individual chamber assembly, verification passes) out to subagents — including via ultracode's orchestrated workflows. But the **main session owns the design system**: every merged piece is reviewed against §4–§5 before its phase exits. Visual cohesion outranks parallel speed.
8. Before final handoff, spawn a **fresh subagent** to review the build against §11 Acceptance Criteria. It reports gaps only. Fix every gap. Re-verify. Then ship.
9. Every detail in this document is load-bearing. Do not simplify, summarize, or "interpret the spirit" of the spec. Build the spec.

---

## 1. WHO THIS IS FOR

**Everest** — 24, Boulder, Colorado. Builds autonomous AI agent systems. APM & Solutions Engineer at Emerge AI; founder of Luven AI; ships games, autonomous orchestrators, and businesses concurrently while training for an IRONMAN 70.3. The site is his portfolio, his story, and his **proof-of-craft**: visitors should leave certain that the person who made this site can build anything.

The audience: founders, hiring partners, design-award juries, and collaborators. The site must read as *engineered*, not decorated.

---

## 2. THE EXPERIENCE — FOUR ACTS

One continuous cinematic flow. No traditional scrolling website. The site is a **journey**: threshold → breach → hub → chambers.

### ACT 0 — BOOT (preloader)
- Black screen. JetBrains Mono, small, bone-white: `initializing everest.os` with a real asset-load percentage (tie to actual Three.js/texture/font loading progress, not a fake timer).
- Thin amber progress hairline (1px) across the bottom of the viewport.
- On 100%: the line glitches once (single-frame RGB channel split, ≤80ms) and the scene fades up. Total boot should feel < 2.5s on broadband.

### ACT I — THE THRESHOLD (landing)
Full-viewport WebGL night scene. **Procedurally generated** — zero downloaded 3D models, zero external image dependencies. Everything is code so nothing can 404.

- **The mountains:** a layered ridgeline silhouette of the Boulder Flatirons rendered as **luminous wireframe terrain** — 3–4 depth planes of noise-displaced plane geometry, edges glowing faint amber against near-black, vertices occasionally pulsing like a network under load. This is not a photoreal mountain; it is a mountain rendered the way a machine dreams one. Slow drifting volumetric fog (shader-based, cheap) between layers. Sparse starfield above with sub-pixel twinkle.
- **Parallax:** mouse position subtly shifts camera (±1.5° max, eased, lerped). On touch devices, use device-tilt if available, else gentle autonomous drift.
- **Typography lockup, center-lower third:**
  - Eyebrow (mono, letter-spaced, 11px): `BOULDER, CO · 40.0150° N, 105.2705° W`
  - Headline (Fraunces, 300 italic, large, optical-size axis high): `Enter the Mountains`
  - Sub (Geist, muted): `The portfolio of Everest — builder of autonomous systems.`
  - A single circular **ENTER** affordance: thin amber ring, mono label inside, soft idle breathing (scale 1.0→1.03, 4s loop). Magnetic hover (cursor pulls it within 60px radius). On hover the ring charges — a conic stroke sweeps around it.
- Bottom-right, mono, tiny: `[ skip intro ]` — always visible, always works, jumps straight to the Hub.
- Pressing **Enter / Space / clicking ENTER** triggers Act II.

### ACT II — THE BREACH (the transition — this is the signature moment)
A continuous ~3.2s camera sequence. No cuts. GSAP timeline driving Three.js camera + shader uniforms. Sequence:

1. **Approach (0–0.8s):** camera accelerates toward the ridgeline. FOV eases 45°→70°. The wireframe mountains brighten as you near them; fog streaks past.
2. **The seam (0.8–1.3s):** a vertical fissure of light splits the central ridge — the mountain *opens*. Terrain vertices peel apart along the seam (displace along normals via a uniform-driven shader). Bloom intensity rises.
3. **The wormhole (1.3–2.7s):** camera plunges through the seam into a **shader tunnel** — a long cylinder (or tube geometry on a gentle curve), interior mapped with a custom GLSL fragment shader: flowing longitudinal light streaks in amber and jade, polar-coordinate noise rushing past, faint hexagonal lattice ghosting in the walls. Effects stack: chromatic aberration ramps up, slight fisheye distortion, speed-line particles streaming past camera, FOV pushed to ~95°. Subtle camera roll (≤6°). It should feel like being *transmitted*, not falling.
4. **Arrival (2.7–3.2s):** tunnel light converges to a single point → bloom whiteout (amber-tinted, not pure white) → whiteout resolves by *contracting* into the Hub's core star. FOV settles to 50°. The Hub's nodes materialize outward from the core in a 0.6s stagger.

Implementation notes: drive the entire act from **one master GSAP timeline** updating uniforms + camera; never chain setTimeout. Pre-compile shaders during Act 0 so there is zero jank on first play. The breach must hold 60fps on an M-series laptop; budget accordingly (cap tunnel particle count, use additive blending, no per-frame allocations).

### ACT III — THE HUB (the orchestrator)
The mountain was the threshold. **This is the thesis.** Everest's flagship work is autonomous multi-agent orchestration — so the hub is a living orchestration map.

- **Core:** a luminous amber orb at center labeled `everest` in lowercase mono beneath it. Gentle fresnel glow, slow internal noise churn, soft pulse synced to a ~heartbeat (≈54bpm — resting HR of an endurance athlete; note this in DECISIONS.md as an easter egg).
- **Eight nodes** orbit the core on two rings with slow procedural drift (each node has unique radius, speed, slight inclination so the system never looks static or symmetric):
  - **Inner ring — the machines:** `JARVIS` · `LUVEN AI` · `EMERGE AI` · `DOLOMITE`
  - **Outer ring — the playground & the person:** `EVERCLASH` · `VOXHALLA` · `BIGBACK` · `BEYOND`
- **Signal traffic:** thin threads connect core↔nodes. Pulses of light travel along them irregularly — some core→node (instructions), some node→core (reports), randomized intervals 0.8–4s. This is the detail that sells the metaphor; do not make it a static line with a CSS glow.
- **Sector labels:** faint mono arc-text on the rings: `SYSTEMS / VENTURES` (inner), `GAMES / LIFE` (outer).
- **Hover a node:** it brightens, its thread goes solid, all other nodes dim to 40%, and a small mono **stat chip** docks beside it (see §3 for each node's chip). Cursor becomes a crosshair-ring.
- **Click a node:** Act IV transition.
- **HUD (persistent from here on):** top-left `everest.os v1.0` mono; top-right local Boulder time (live, mono) + a sound toggle (see §6); bottom-left breadcrumb (`HUB` → `HUB / JARVIS` etc.); bottom-right `[ return to mountains ]` which reverses the breach (a 1.4s compressed reverse — fly back out through the seam).
- Hub must be fully **keyboard navigable**: Tab cycles nodes (visible focus ring in amber), Enter opens, Esc returns.

### ACT IV — THE CHAMBERS (project panels)
Clicking a node runs a three-phase transition (≈1.1s total):
1. **Isolation (0.3s):** scene dims except the chosen node and its thread, which surges bright.
2. **Handoff (0.4s):** camera pushes toward the node; the orchestrator scales down into a **live mini-widget** pinned bottom-left of the HUD (still animating — pulses keep firing at small scale). The node becomes the panel's anchor point.
3. **Materialization (0.4s):** chamber content reveals via a **CRT scan-line wipe originating from the node's position** — a horizontal scan beam sweeps the viewport once; content resolves behind it line-by-line. Headlines animate their Fraunces **optical-size variable axis** from low→high as they land (this is mandatory — do not substitute a fade). One single RGB-split flicker (≤80ms) on the chamber's marginalia as it locks in. **Never** use a generic slide-up/fade-in panel. The scan-line origin reveal is the spec.

Each chamber is a full-viewport panel over a dimmed, blurred hub. Chambers share the design system but each has a **distinct internal layout language** — they must not feel templated. Internal scroll allowed within a chamber (Lenis-smoothed). Every chamber ends with a mono `[ ← return to hub ]` plus Esc support; closing reverses the materialization (content de-rezzes into the node, orchestrator widget scales back up).

---

## 3. THE EIGHT CHAMBERS — CONTENT (all real, all verified)

Write copy in a confident, spare, engineer's voice. First person where natural. No marketing fluff, no exclamation points, no buzzword soup. Stats are the stars.

**Media convention:** check `/public/media/<project-id>/` (e.g., `/public/media/everclash/`) at render time. If images exist there, the chamber displays them in its gallery slots with proper lazy-loading and aspect handling; if the folder is empty or absent, render the styled procedural placeholder frames described per chamber. This lets real screenshots be dropped in later with **zero code changes**. Build it, document it in the README footer of VERIFICATION_REPORT.md, and make placeholders look intentional — glowing wireframe frames with mono captions, never gray boxes.

**JARVIS — Personal AI Orchestrator** *(chip: `4 AGENTS · 220 TESTS GREEN · RUNS NIGHTLY`)*
Layout language: a **live system console**. Autonomous multi-agent system running locally on Apple Silicon: four specialized agents (Researcher, Builder, Content, Evolver), nightly autonomous build chains, Electron mission-control dashboard, voice interface (wake word → STT → tool dispatch → TTS), two-tier model routing for 90%+ inference cost reduction. Render a simulated (clearly stylized) agent-activity log streaming in mono, a small architecture diagram drawn in glowing strokes (core → four agents), and stat blocks. Tagline: *"The site you just flew through is shaped like this system."*

**LUVEN AI — Founder** *(chip: `FIRST SALE $994 · 770+ WORKFLOW NODES`)*
Layout language: **a business one-pager with editorial weight** (Stripe-Press energy). AI voice receptionist for trades & home-services businesses — answers, qualifies, and books 24/7. Founded under Luven Technologies LLC. First production sale March 2026. Nine production n8n workflows, 770+ nodes, GHL-native delivery. Show the product in one sentence, the proof in numbers, the vertical focus.

**EMERGE AI — Operator** *(chip: `4 PRODUCTION AGENTS · AI DIVISION LEAD`)*
Layout language: **a clean dossier / case-file grid**. APM & Solutions Engineer. Built and shipped four production Claude Managed Agents (reception, talent pre-screening, talent interview pipelines). Led an AI seminar for a room of 15 CEOs (YPO). Designed agent pricing & usage architecture for the platform.

**DOLOMITE — Mission Control** *(chip: `ALL PROJECTS · ONE COMMAND PLANE`)*
Layout language: **a radar/ops board**. Local mission-control dashboard that manages every personal software project semi-autonomously through Claude Code — dispatching missions, consolidating repos, auditing credentials. The meta-tool that runs the rest. Keep this chamber short and ominous-cool.

**EVERCLASH — 2D PvP Fighter** *(chip: `10 FIGHTERS · 8-PLAYER FFA · IN BROWSER`)*
Layout language: **arcade character-select energy** (restrained — no copyrighted-style assets, build the vibe with type and motion). Browser-based multiplayer fighting game: Phaser 3 + React + Vite + Colyseus, TypeScript throughout. Real-time netcode, full roster with idle/victory animation suites, custom AI-assisted art pipeline. Render the roster as a 10-slot grid of glowing placeholder frames with fighter names.

**VOXHALLA — Voxel Hero Shooter** *(chip: `6V6 · 10 CHAMPIONS · NO ENGINE`)*
Layout language: **spec-sheet brutalism**. Browser 6v6 voxel hero shooter built on raw Three.js — no game engine. Ten champions with AI-generated 3D models, full ability kits designed and legally vetted, custom post-processing pipeline (bloom, FXAA, vignette). Currently parked while Jarvis ships; say so plainly — shipping discipline is part of the story.

**BIGBACK — AI Fitness** *(chip: `CHAT-FIRST · TRADEMARK FILED · bigback.fit`)*
Layout language: **a product teaser card, lots of air**. AI fitness app concept: conversational food logging, supplement tracking, restaurant-order intelligence; React Native + Supabase + Claude API. Trademark filing in progress, domain secured. Frame as "next up on the bench."

**BEYOND — The Person** *(chip: `70.3 IRONMAN · SEMESTER AT SEA · 1 BETTA FISH`)*
Layout language: **an editorial timeline / map hybrid** — the most human chamber, warmest type, most whitespace. Three threads:
- *Athlete:* sprint triathlon finisher (May 2026), Bolder Boulder 10K, training for IRONMAN 70.3.
- *Voyager:* Rochester, NY → Monroe CC → Semester at Sea → Colorado State (B.S. Business Admin, Marketing, Dec 2025) → Boulder → next coordinates under evaluation: Costa Rica / Crete / Valencia. Render as a glowing route polyline.
- *Operator of small joys:* guitar, car culture (current: '19 Impreza), a Minecraft server he runs for friends (Scorched SMP — custom raid/claims plugin systems he built), one betta fish.
- End with contact block (§7).

---

## 4. DESIGN SYSTEM — COMMIT EXACTLY

**Palette (CSS custom properties, used everywhere):**
- `--ink: #0A0A0C` (base) · `--ink-2: #111114` (panels)
- `--bone: #EDE8DF` (primary text)
- `--amber: #E8A23D` (core, primary accent, glow)
- `--jade: #38D9A9` (secondary signal, success, wormhole counter-color)
- `--dim: rgba(237,232,223,0.45)` (muted text) · hairlines at 8% bone.
- Red reserved exclusively for one or two live-status ticks. **No other hues. No gradients between hues except inside WebGL shaders.**

**Typography:**
- Display: **Fraunces** — 300 weight, italic, with the `opsz` variable axis actively animated on reveals. Headlines only.
- Mono: **JetBrains Mono** — labels, HUD, stats, eyebrows, nav.
- Body: **Geist** (or Geist Sans via fontsource) — paragraphs.
- Self-host all three via `@fontsource` packages (variable versions where available). No Google Fonts runtime requests. `font-display: swap` with a styled fallback stack.
- Type scale: display clamps fluidly (e.g., `clamp(2.8rem, 6vw, 5.5rem)`); mono stays small (11–13px) and letter-spaced (0.08–0.14em) and uppercase for labels.

**Anti-slop list (hard bans):** Inter/Roboto/system-ui as a visible face · purple or blue-violet gradients · glassmorphism cards · generic SaaS hero layouts · emoji anywhere · lorem ipsum · stock photos · cookie-cutter "About / Skills / Contact" navbar · default browser cursor on desktop (custom cursor required, §5) · drop shadows heavier than 24px blur · border-radius > 6px except the ENTER ring and node orbs.

**Texture:** a barely-there film grain overlay (animated noise, opacity ≤ 0.04) across the whole app to kill flat digital sterility. One global vignette, subtle.

---

## 5. MOTION LANGUAGE

- **Easings:** UI eases on `cubic-bezier(0.22, 1, 0.36, 1)` (expo-out family). Camera moves on custom GSAP eases — never linear, never bounce/elastic.
- **Durations:** micro-interactions 150–250ms; reveals 400–700ms; the Breach is the only multi-second sequence.
- **Custom cursor:** small bone dot + trailing amber ring (lerped, ~0.12 smoothing). Ring morphs: crosshair over nodes, expands over the ENTER affordance, becomes a left-arrow over return controls. Hidden on touch devices; never break native text-selection cursors inside chamber body copy.
- **Magnetic hover** on ENTER and node labels (translate toward cursor, max 8px, spring back).
- **Text reveals:** GSAP SplitText line-masks for body; Fraunces `opsz` axis sweep for display lines.
- **Idle life:** nothing on screen is ever fully static — node drift, pulse traffic, fog, grain. But total idle motion stays *calm*; this is a system at rest, not a screensaver.

---

## 6. SOUND (optional layer — build it, default OFF)

- A HUD toggle `[ sound: off ]`. When enabled: a low ambient hum on the hub (Web Audio API oscillators/noise — synthesize, do not ship audio files), a soft rising whoosh synthesized during the Breach, sub-audible tick on node hover. Everything generated in code, master gain ≤ −18dB, instantly killable. Respect the toggle across navigation. If muted, zero AudioContext warnings in console (lazy-create on first enable).

---

## 7. CONTENT PLACEHOLDERS — fill from this block only

```
FULL NAME (footer/meta):  Everest Egenhofer
EMAIL:                    REPLACE_ME@example.com
GITHUB:                   https://github.com/REPLACE_ME
LINKEDIN:                 https://linkedin.com/in/REPLACE_ME
X/TWITTER (optional):     https://x.com/REPLACE_ME
```
If a value still says REPLACE_ME at build time, render the label dimmed with a mono `· pending` suffix rather than a dead link. List every pending value in VERIFICATION_REPORT.md.

---

## 8. TECH STACK & BUILD PHASES

**Stack (locked):** Vite + React 18 + TypeScript (strict) · `three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` · custom GLSL shaders (inline or `.glsl` via vite-plugin-glsl) · GSAP (core + ScrollTrigger + SplitText — all free) with `@gsap/react useGSAP` · Lenis for chamber scrolling, synced to GSAP ticker · `zustand` for app state (act/scene/active-node/sound) · plain CSS Modules or a single global stylesheet with custom properties (no Tailwind for this one — bespoke layout deserves bespoke CSS). Static output; must run from `vite preview` with zero servers or env vars. **WebGL2 only — no WebGPU, no Safari-breaking APIs.** No dependencies beyond this list without a recorded justification in `DECISIONS.md`.

**State machine:** `boot → threshold → breach → hub → chamber:<id>`, with `reverse-breach` transitional state. Deep-linking: `/#/hub` and `/#/hub/jarvis` etc. resolve directly (skipping intro) so chambers are shareable. Browser back/forward must behave.

**Performance budget:** 60fps target on the hub and breach (Apple Silicon / modern laptop); adaptive `dpr` clamp `[1, 2]` with drei `PerformanceMonitor` stepping down under load; total JS < 900KB gzip; pause the RAF loop on `visibilitychange` and while a chamber fully covers the canvas; no per-frame object allocation in hot loops; preload + compile all shaders during Act 0.

**Phases (each ends with: `tsc --noEmit` clean → `vite build` clean → quick browser smoke):**
- **P0** Scaffold: `git init` + first commit · write a concise `CLAUDE.md` (locked stack, design tokens, anti-slop bans, "typecheck + build + commit before every phase exit") so conventions survive any context compaction · Vite app, fonts self-hosted, design tokens, state machine, HUD shell, custom cursor, grain overlay, routing.
- **P1** Act I Threshold: terrain shader scene, fog, stars, parallax, type lockup, ENTER affordance, skip control.
- **P2** Act II Breach: master timeline, seam shader, wormhole tunnel shader, post-processing ramp, arrival resolve. Tune until it feels expensive.
- **P3** Act III Hub: core, 8 nodes, threads + pulse traffic, hover/focus states, stat chips, keyboard nav, reverse-breach.
- **P4** Act IV Chambers: transition system (isolation/handoff/materialization), all 8 chambers with distinct layouts and full copy from §3.
- **P5** Sound layer, reduced-motion mode (§9.4), mobile pass, deep links, meta/OG tags (dark OG card with the type lockup, generated as a static asset via canvas or hand-built SVG→PNG), favicon (amber orb).
- **P6** Verification Protocol (§9) → subagent review (§0.6) → fix loop → VERIFICATION_REPORT.md → done.

---

## 9. VERIFICATION PROTOCOL — the build is not done until ALL of this passes

Use the **Playwright MCP** browser tools against `vite preview` (if the Playwright MCP is not connected, install Playwright as a dev dependency and write+run a `verify.spec.ts` that performs the same checks headlessly — either path is acceptable, but real-browser verification is mandatory).

**9.1 Functional click-through (record evidence):**
- Boot completes; threshold renders; ENTER via click, via Enter key, via Space.
- Breach plays start→finish without frame-long stalls; arrives at hub.
- `[ skip intro ]` jumps straight to hub.
- Hover **every** node → correct stat chip appears. Click **every** node → correct chamber opens with scan-line materialization. `Esc` and `[ ← return to hub ]` both close every chamber. `[ return to mountains ]` reverse-breach works, and re-entering works a second time (no stale GSAP timelines, no duplicated event listeners).
- Tab-cycle through all 8 nodes with visible focus ring; Enter opens focused node.
- Deep links `/#/hub` and `/#/hub/everclash` load correctly cold. Back/forward sane.

**9.2 Console gate:** zero errors AND zero warnings in the browser console across the entire flow above (React key warnings, Three.js disposal warnings, and AudioContext warnings all count as failures).

**9.3 Visual evidence:** full-page screenshots at **1440×900** and **390×844** of: threshold, hub, two chambers (Jarvis + Beyond), saved to `verification/`. Inspect them yourself — if anything is overlapping, clipped, illegible, or ugly, fix it and reshoot.

**9.4 Reduced motion:** with `prefers-reduced-motion: reduce` emulated — no breach (instant crossfade threshold→hub), node drift frozen to static layout, pulses become slow opacity ticks, all content reachable. Verify the full click-through again in this mode.

**9.5 Mobile:** at 390×844 — threshold legible, ENTER tappable (≥44px target), hub nodes tappable without mis-hits (enlarge hit areas, allow slight layout reflow to a vertical constellation if needed), chambers scroll smoothly, no horizontal overflow anywhere.

**9.6 Performance:** breach + hub hold ≥50fps in a quick rAF sampling probe on desktop; `vite build` bundle report stays under budget; document numbers.

**9.7 Resilience:** rapid double-clicking ENTER doesn't double-fire the breach; resizing the window mid-breach doesn't corrupt the camera; WebGL context loss shows a styled mono fallback message instead of a white screen.

**9.8 Accessibility audit:** every interactive control (ENTER, nodes, toggles, returns) has an accessible name (`aria-label` where the visual label is canvas-rendered); the WebGL canvas itself is `aria-hidden` with a text equivalent of the hub (visually-hidden nav list of the 8 nodes that screen readers and search crawlers can use); `--dim` text passes WCAG AA contrast on `--ink` — if it doesn't, brighten the token, don't shrink the claim; document results.

---

## 10. VERIFICATION_REPORT.md — final artifact

A checklist of every §9 item with PASS/FAIL, the screenshot paths, bundle size, fps samples, the pending REPLACE_ME values, and a 5-line "how to run / how to deploy" footer (`npm i && npm run dev`, `npm run build`, output is static `dist/` — deployable to Vercel/Netlify/Cloudflare Pages as-is).

## 11. ACCEPTANCE CRITERIA (binary — subagent reviews against these)

1. The four-act flow exists exactly as specified, including the seam-split and wormhole shader breach.
2. Hub has a living pulse-traffic orchestration system — core, 8 correct nodes, 2 rings, irregular signal pulses.
3. All 8 chambers exist with the §3 content, distinct layouts, and the scan-line-from-node materialization (no slide-up fades).
4. Fraunces `opsz` axis animation present on chamber headline reveals.
5. Design tokens, fonts, and anti-slop bans honored everywhere.
6. Custom cursor, magnetic hover, HUD, breadcrumb, Boulder clock, sound toggle all functional.
7. Keyboard navigation + reduced-motion mode fully usable.
8. §9 protocol executed with evidence; console gate clean; VERIFICATION_REPORT.md complete.
9. Zero placeholder lorem text; zero dead links (pending links rendered dimmed per §7).
10. `npm run build` succeeds; `vite preview` serves the full experience with no env vars.

Build it like the studio's reputation depends on it. Begin with P0.
