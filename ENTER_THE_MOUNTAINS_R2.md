# ENTER THE MOUNTAINS — R2: FROM SITE TO EXPERIENCE
### Surgical refinement directive. The original spec (ENTER_THE_MOUNTAINS.md) remains law; R2 overrides where they conflict.

---

## R0. CONTRACT

Same autonomy rules as the original §0: don't stop, don't ask, verify everything, fix-loop until green, PLAN.md/DECISIONS.md current at all times, git commit per R-phase. Additions:

1. **This is surgery, not a rebuild.** The threshold scene, design tokens, fonts, state machine, HUD, and chamber content architecture stay. You are reworking cinematography, node identity, navigation, chamber visuals, and copy.
2. **Motion review is now mandatory evidence.** For every animation you touch, record it (Playwright video or equivalent), extract 6 evenly-spaced frames, and judge each frame as a still. If any frame would embarrass a motion designer, iterate. Save before/after pairs to `verification/r2/`.
3. **The grading question for every change:** "Does this look like a studio charged $20,000 for it?" Not "does it pass."
4. **Restraint is the style.** The current failures are all *too much*: too lit, too saturated, too blurred, too busy. When in doubt, remove light, remove elements, add darkness and space.

---

## R1. THE BREACH — TOTAL REWORK (priority one)

The current tunnel reads as a 2010 music visualizer: brown-lit walls, giant glowing hexagons, cyan smears, heavy blur, and a perceptible cut between threshold and tunnel. Rebuild the act around three principles: **continuity, darkness, restraint.**

### R1.1 Continuity — one unbroken shot
- The entire breach is ONE camera move through ONE scene graph. The tunnel is pre-built in world space behind the ridge seam; the camera physically passes from the mountain scene into it. **Zero cuts. Zero crossfades between scenes. Zero unmount/mount swaps mid-flight.** If a swap is technically unavoidable, it happens inside a ≤120ms light-wrap (screen flooded by the seam light), never visibly.
- The type lockup doesn't disappear — it parallax-falls behind the camera with motion blur as the camera accelerates, like signage passing a car window.

### R1.2 The mountain must visibly open (currently missing)
This is the moment the user asked for by name. Sequence, ~1.1s:
- A hairline of bone-white light appears at the central ridge crest and draws downward (0.3s) — a blade, not a glow.
- The terrain SPLITS along it: vertices displace outward along normals with strata-like layering, edges of the wound glowing amber, wireframe tearing like fabric under tension (0.5s). The two halves keep their wireframe identity as they part.
- The camera threads INTO the gap as it's still opening (0.3s overlap) — the viewer slips through a closing window of rock, not after it's politely finished opening.

### R1.3 Tunnel art direction — darkness with ribbons
- **Background: `--ink` near-black.** The current brown ambient wall lighting is deleted. The tube's surface is invisible except where light touches it.
- **Light = 5–9 thin ribbons** of long-exposure streak light flowing past: amber dominant; at most ONE jade ribbon visible at any moment (jade is an accent, not a co-star). Additive blending, soft falloff, varied lengths and speeds. 80%+ of any given frame is dark.
- **Hex lattice demoted to a ghost**: 4–6% opacity line-work, visible only where a ribbon's light grazes it. The current full-brightness oversized hexagons are deleted.
- **Post-processing cut hard:** bloom intensity −60% from current; chromatic aberration only ramps at seam-entry and arrival (peak ≤ 0.0035, zero mid-flight); depth-of-field blur removed entirely — the current frame is smeared soup. Sharpness IS the luxury.
- **Speed is communicated by** streak length, FOV (45→70→95 as specced), micro camera shake (≤0.3px at peak), and the star-particle field density — not by texture busyness.
- Arrival: ribbons converge to a point → 120ms amber light-wrap → resolves by CONTRACTION into the hub core (verify this actually reads on screen; currently it doesn't).
- Reference register: hyperspace as a luxury watch brand would film it. If it would look at home in a media player visualization, it's wrong.

### R1.4 Smoothness engineering
- One master GSAP timeline, custom bezier eases, no perceptible segment boundaries. Pre-compile every shader and pre-warm every material during boot. First-play frame-gap budget: ≤ 8ms worst.
- **Scrub test:** capture stills at 0/20/40/60/80/100% of the breach. Each must be composition-worthy on its own. Iterate until all six pass.

---

## R2. THE HUB — A SOLAR SYSTEM, NOT EIGHT TENNIS BALLS

Current state: core is a uniform fuzzy orange ball; all eight nodes are identical smaller fuzzy orange balls; pulse traffic is invisible; labels collide (BEYOND/BIGBACK overlap); sector arc-text renders mirrored/upside-down. All of this goes.

### R2.1 The core
Rebuild as a small sun with depth: fresnel-rimmed sphere, interior FBM turbulence slowly churning (visible surface detail, not uniform blur), thin corona via shader falloff. The 54bpm pulse stays. It should reward staring.

### R2.2 Eight planets, eight identities
Every node becomes a micro-planet with its own shader/geometry identity and idle motion. **Stay inside the palette** — identity comes from value, surface, geometry, and motion, never new hues. Sizes vary 0.7×–1.3×.

| Node | Identity |
|---|---|
| **JARVIS** | Near-black obsidian sphere with two thin orbiting rings of tiny mono-glyph particles — an orchestrator with its own satellites |
| **LUVEN AI** | Warm amber sphere with one slowly sweeping radar ring; emits a tiny tick-pulse every few seconds — a line that always answers |
| **EMERGE AI** | Bone-metal sphere etched with a faint dossier grid, brushed and matte |
| **DOLOMITE** | Faceted low-poly crystal (it's named for rock) — flat-shaded planes catching amber light as it slowly tumbles |
| **EVERCLASH** | Sphere split into two hemispheres with a hairline energy gap between them; quick pugnacious idle wobble |
| **VOXHALLA** | Voxelized sphere — clustered cubes, obviously and proudly |
| **BIGBACK** | Clean minimal sphere with a single meridian progress arc that fills and resets — a rep counter |
| **BEYOND** | Tiny dark earth: jade route polylines tracing journeys across an ink sphere |

### R2.3 System fixes
- **Pulse traffic must be visible**: 2px bright heads with short fading trails traveling the threads, above-thread render order, irregular 0.8–4s intervals. If a viewer can't notice them within 5 seconds of arriving, they're too subtle.
- **Labels**: collision-resolved placement (per-node fixed offsets tuned by hand; BEYOND and BIGBACK must never overlap at any drift position). 
- **Sector arc-text**: must never render mirrored or inverted — flip glyph orientation by hemisphere or billboard the text path. If it can't be made elegant at all camera angles, delete the arc-text; it's decoration.
- **Explorability**: click-drag (or two-finger drag) orbits the camera ±12° around the system, eased, springs back to rest slowly. The hub should feel like a place you can lean around in, not a locked painting.
- Hover: planet scales 1.15×, its identity motion intensifies, others dim to 40%, stat chip docks. (Chips per original §3.)

---

## R3. NAVIGATION — FLY TO THE PLANET

Clicking a node currently swaps to a page. Replace with travel:

- **Click → flight (≈0.9s):** the camera flies to the chosen planet along a curved path; the planet grows to anchor the left third of the viewport, still rendering live with its identity animation. The chamber content then materializes beside/around it via the existing scan-line reveal, originating at the planet's limb.
- **The planet IS the chamber's hero.** It stays on screen, live, for the whole chamber visit — replacing the blurred-hub backdrop, which is **deleted everywhere** (the orange smudges are a primary source of the "sloppy/AI-generated" read).
- **Planet-to-planet hops:** a mono nav rail in each chamber — `← VOXHALLA · BIGBACK →` with tiny planet glyphs. Selecting one de-rezzes the current content, flies the camera ACROSS the system to the next planet (≈1.1s arc that passes near the core — you should glimpse the whole system mid-flight), and materializes the new chamber. Exploration without ever returning to the overview.
- **Esc / `[ ← hub ]`** flies back out to the overview position. Deep links unchanged; a deep-linked chamber loads with the camera already at that planet.
- The mini-orchestrator widget now competes with the live planet: shrink it to a corner glyph or delete it. Judgment call; record in DECISIONS.md.
- Reduced-motion mode: all flights become ≤200ms crossfades; planets render static.

---

## R4. CHAMBER VISUALS — KILL THE SLOP, ADD ART

### R4.1 De-slop pass
- Delete the blurred-hub backdrop (per R3). Each chamber's right/visual column is now: the live planet + one art-directed hero visual + evidence media slots.
- Tighten every chamber grid: real margins, aligned baselines, the mono `01 / 02` section markers stay (they're good). Empty space is fine when intentional; current chambers read abandoned, not spare.

### R4.2 Higgsfield pipeline — atmosphere only, never evidence
A Higgsfield MCP is available for image generation. Hard policy:
- **Generated imagery is for ATMOSPHERE**: abstract/conceptual hero art that sets a chamber's mood. **Never generate fake screenshots, fake UI, fake gameplay, or anything a viewer could mistake for evidence of the work.** Evidence slots (Everclash roster/gameplay, Voxhalla champions, Jarvis dashboard, Luven product) accept REAL screenshots only, via the existing `/public/media/<id>/` convention. Authenticity is the portfolio's spine.
- Every generation prompt must lock the world: *"…near-black background (#0A0A0C), warm amber (#E8A23D) light, optional muted jade accent, high contrast, cinematic, film grain, no text, no people's faces"* — then the per-chamber subject below. Post-process all outputs through the site's grain overlay and a slight duotone grade toward the palette so they sit in one world. If an output looks like generic AI art, regenerate or go without — darkness is better than slop.
- Per-chamber hero subjects: **JARVIS** — long-exposure light study of a dark control room, one amber monitor glow. **LUVEN** — a workshop landline glowing at night, shallow focus. **EMERGE** — abstract dossier paper texture raking-lit. **DOLOMITE** — macro rock strata, amber edge light. **EVERCLASH** — two abstract energy forms mid-collision. **VOXHALLA** — voxel cloudscape. **BIGBACK** — chalk dust drifting through one beam of light. **BEYOND** — alpine ridgeline at night, one jade route-light tracing it.
- Store generated art in `public/art/<id>/`, referenced by the chamber layout (distinct from the evidence media convention). Sized/compressed for web (≤350KB each, AVIF/WebP with fallback).

---

## R5. COPY — HUMBLE BUT INTELLIGENT

Full tone pass on every headline, body block, chip, and HUD string. Voice rules:
- First person, plain verbs, short sentences. Confidence through specificity, never adjectives. Zero self-superlatives ("passionate," "visionary," "expert" are banned). No exclamation points.
- Numbers and shipped things carry the weight; let them sit unadorned ("First sale closed March 2026. $994.").
- Honest states stay honest: Voxhalla is *parked* and says so; BigBack is *on the bench*; that discipline is part of the story.
- The Luven headline "Every missed call is a missed job." is the register to match: a true sentence that earns its italics. Rewrite every chamber headline to that bar.
- **Verified facts (sole source of truth — do not invent beyond these):**
  - JARVIS: personal AI orchestrator on Apple Silicon; four agents (Researcher, Builder, Content, Evolver); 220 tests green at merge; nightly autonomous build chains; Electron mission-control dashboard; voice loop (wake word → STT → tools → TTS); two-tier model routing cutting inference cost ~90%.
  - LUVEN AI: founder, Luven Technologies LLC; AI voice receptionist for trades/home-services — answers, qualifies, books 24/7; first production sale March 2026, $994; nine production workflows, 770+ nodes; GHL-native delivery.
  - EMERGE AI: APM & Solutions Engineer; four production Claude Managed Agents shipped (reception + talent pipelines); led an AI seminar for a room of 15 CEOs; designed the platform's agent pricing & usage architecture.
  - DOLOMITE: local mission-control that runs his other projects semi-autonomously through coding agents — dispatching missions, consolidating repos, auditing credentials.
  - EVERCLASH: browser 2D PvP fighter; Phaser 3 + React + Colyseus, TypeScript; 10 fighters; 8-player FFA; real-time netcode; custom AI-assisted art pipeline. Add one line: currently in the lab — AGARVOICE, an Agar.io rebuild with proximity voice chat and 22 tiered skins.
  - VOXHALLA: browser 6v6 voxel hero shooter on raw Three.js, no engine; ten champions with full ability kits; custom post pipeline; parked deliberately while Jarvis ships.
  - BIGBACK: AI fitness app concept; React Native + Supabase + Claude API; conversational food logging; trademark filing in progress; bigback.fit secured.
  - BEYOND: sprint triathlon finisher May 2026; Bolder Boulder 10K; training for IRONMAN 70.3. Rochester NY → Monroe CC → Semester at Sea → Colorado State (B.S. Business Admin, Marketing, Dec 2025) → Boulder; next coordinates under evaluation: Costa Rica / Crete / Valencia. Guitar, car culture ('19 Impreza), runs a custom Minecraft server for friends, one betta fish.

---

## R6. THRESHOLD POLISH (light touch — it mostly works)
- Bias the terrain noise toward the Flatirons' signature tilted slabs: angled ridge strata, not generic fractal peaks.
- Fog: thin drifting sheets with visible parallax between layers — not the current static gray smudge.
- Fix `[ skip intro ]` colliding with the custom cursor ring at bottom-right (offset or relocate).
- Raise the type lockup so the sub-line and ENTER ring breathe; ENTER ring behavior is good — keep.

---

## R7. VERIFICATION — R2 PROTOCOL
All of original §9 re-runs (console gate, keyboard, reduced-motion, mobile, resilience, accessibility), PLUS:
1. **Motion evidence:** full breach + one hub→planet flight + one planet→planet hop recorded as video; 6-frame extraction each; every frame passes the still test. Files in `verification/r2/`.
2. **Before/after** screenshot pairs for: tunnel, hub overview, each planet close-up, two chambers.
3. **Identity check:** screenshot all 8 planets at hover scale — a stranger must be able to match planet→project name for at least 6 of 8 from the visual alone.
4. **No-cut audit:** frame-step the breach recording; any visible cut or crossfade between scenes is a FAIL.
5. **Perf:** budgets unchanged (60fps target, ≤8ms worst gap, bundle <900KB gzip — new art assets excluded from JS budget but each ≤350KB).
6. Production smoke against the live Vercel URL after deploy.

## R8. ACCEPTANCE (binary)
1. Breach is one continuous shot; mountain visibly splits; tunnel is dark-with-ribbons; scrub-test stills all pass.
2. Core reads as a sun with surface depth; all 8 planets visually distinct per R2.2; pulse traffic obvious within 5s.
3. Labels never collide; no mirrored/inverted text anywhere; drag-orbit works.
4. Click = flight to planet; planet persists as live chamber hero; planet-to-planet rail works both directions; blurred backdrop fully deleted.
5. Higgsfield art present in all 8 chambers, palette-locked, atmosphere-only; zero fake evidence imagery; evidence slots still honor /public/media.
6. Every line of copy passes the voice rules; facts match R5 exactly.
7. R7 evidence complete; console gate clean; deployed and smoke-passed on production.

Begin with R1. The breach is the experience's signature — earn it first.
