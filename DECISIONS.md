# DECISIONS — judgment calls (spec: ENTER_THE_MOUNTAINS.md)

1. **`--dim` brightened 0.45 → 0.55 alpha.** Spec §4 sets `rgba(237,232,223,0.45)`; computed contrast on
   `--ink` is 3.9:1 — fails WCAG AA (4.5:1). §9.8 instructs "brighten the token, don't shrink the claim."
   0.55 alpha ⇒ ≈5.4:1. PASS.
2. **three pinned to 0.170.0.** drei 9.x / fiber 8.x peer ranges allow ≥0.137; 0.170 is the newest line
   battle-tested against drei 9.122 + three-stdlib. three latest (0.184) is outside drei 9's tested matrix.
3. **Vite 5.4 (not 6/7).** Most stable plugin ecosystem for this stack; spec locks "Vite" without version.
4. **Inline GLSL template strings, no vite-plugin-glsl.** Spec allows either; one fewer dependency.
5. **Fraunces loaded as `opsz-italic` variant only.** Spec uses 300-italic display with animated `opsz`;
   this file carries wght 100–900 + opsz axes. SOFT/WONK variants unused → smaller font payload.
6. **No router library.** Hash routing is ~70 lines hand-rolled (`src/state/router.ts`); spec's locked
   dependency list contains no router, and the state machine is the real source of truth.
7. **Boot pacing floor 450ms.** Progress is real (FontFaceSet + shader compile), but if everything is
   cached the 100% glitch frame would be invisible; floor keeps Act 0 perceivable, total still ≪2.5s.
8. **`[ ← return to hub ]` also lives in HUD bottom-right while a chamber is open.** Spec puts it at the
   end of chamber content (kept) — duplicating it in the HUD means escape is always one click away
   without scrolling. Breadcrumb still reads `HUB / <NODE>`.
9. **Reduced-motion override `?rm=1`** — test hook for §9.4 in case browser-level emulation is
   unavailable; also useful for users who want the static experience explicitly.
10. **Boot progress weights: fonts 0.6 / shader-compile 0.4** — both real signals; fonts dominate
    wall-time on broadband, shader compile dominates on first GPU warm-up.
11. **Dropped `@react-three/postprocessing`; post chain is three's own composer**
    (`UnrealBloomPass` + one custom grade ShaderPass + `OutputPass`, all from `three/examples/jsm` —
    zero added dependencies). Root cause that broke BOTH libraries identically: terrain shaders emitted
    NaN fragments (`pow(x<0, y)` is undefined in GLSL → NaN on Metal/ANGLE); bloom's mip blur chain
    smeared NaN across the entire frame and `base + NaN = NaN` blacked out the canvas. Direct rendering
    masked it. Fixed by writing gaussians as `exp(-t*t)` and clamping every pow base. Kept the
    three-native chain anyway: one custom grade pass = chromatic aberration + amber whiteout + fisheye
    in a single fragment — fewer passes than the drei equivalent and exact control for the breach.
12. **Shader NaN discipline (project rule):** no `pow` with a possibly-negative base, no reversed
    smoothstep edges, no division that can hit 0 — one NaN pixel destroys the whole bloom chain.
13. **Lockup legibility scrim** — neutral black-alpha radial behind the type block (not a hue gradient;
    anti-slop rules ban hue gradients outside WebGL, black alpha is fine).
14. **54bpm heartbeat easter egg** — the hub core pulses at 0.9Hz (`exp(-fract(t*0.9)*5)`): 54bpm,
    the resting heart rate of an endurance athlete (spec §2 Act III).
15. **Hub nodes are DOM buttons projected over the canvas** (not canvas hit-testing): native Tab order,
    real focus, aria-labels for free; positions stream from the render loop through a module-level
    bridge (`nodeScreens`), no React re-renders per frame.
16. **Esc on the hub triggers the reverse breach.** Spec defines Esc for closing chambers; on the hub
    it mirrors `[ return to mountains ]` — consistent "step back" semantics.
17. **Pulse-traffic colors:** core→node instructions amber, node→core reports jade — makes the
    orchestration metaphor legible without labels.
18. **Sector arc-text drawn into CanvasTextures** with the bundled JetBrains Mono (no troika/external
    font fetch); characters traversed clockwise (descending angle) or the text mirrors.
19. **Chambers use CSS Modules** (spec allows "CSS Modules or a single global stylesheet"): eight
    parallel agents each own exactly `<Name>.tsx` + `<Name>.module.css` — zero merge conflicts.
    System-level styles stay in the global sheet.
20. **Mini-orchestrator is a 2D canvas, not a second WebGL view.** While a chamber covers the main
    canvas the RAF loop pauses (§8); the widget keeps pulses firing at ~30fps for almost nothing,
    doubles as a click-to-return control, and reads as deliberate instrument design.
21. **Media manifest:** static hosting can't list directories, so the §3 media convention is
    `/public/media/<id>/manifest.json` (`{"images":[...]}`); dropping files + manifest needs zero
    code changes. Documented in public/media/README.md.
22. **Verification environment:** Playwright installed as devDependency (spec-sanctioned fallback).
    The Playwright MCP drives the user's desktop Chrome — when that window is occluded, Chromium
    throttles rAF to 1fps; headless SwiftShader turns GSAP timelines glacial (lagSmoothing caps
    deltas at 33ms against ~1000ms frames). §9 runs use a freshly-launched HEADED chromium with GPU.
23. **Beyond chamber:** built by its workflow agent up to Beyond.tsx, then the agent died on an API
    spend limit before writing Beyond.module.css — stylesheet completed by the main session in the
    same layout language. (TS passed even with the CSS missing — ambient vite types don't resolve
    css-module files; the build catches it. Worth knowing.)
24. **HUD `everest.os v1.0` hidden ≤640px** — at 390px it collided with the Boulder clock; the
    clock + sound toggle own the top edge on phones. Breadcrumb and returns unaffected.
25. **Chamber opsz sweep delayed to 0.78s** (was 0.15s) — the panel is clip-hidden until ~0.7s of
    the open timeline, so the earlier sweep finished invisibly (caught by the §0.8 fresh-agent
    review with a frame probe). The axis now travels 9→144 entirely on screen as the headline lands.
26. **Hub magnetic reach 84px / max 8px** — §5 fixes the 8px cap; reach tuned so drifting labels
    don't snag the cursor from across the ring. Composed into the projection rAF (no extra loop),
    inert on touch + reduced motion.
27. **Empty media manifests pre-seeded for all 8 chambers** (`{ "images": [] }`) — Vercel static
    hosting returns real 404s for missing files, and Chrome logs network 404s as console errors,
    which broke the §9.2 zero-console gate on the live production smoke (vite preview had masked
    this: its SPA fallback answers any path with 200 + index.html). `useMedia` already treats an
    empty list as "no media" → placeholder frames, so 200 + empty manifest restores the README's
    "nothing 404s" guarantee with zero code changes.
28. **R1 breach: tunnel relocated into threshold world space** (entrance z −15.5 behind the ridge
    seam, axis y 3.4) so the camera physically flies through the opening mountain — the old
    whiteout-masked teleport between y-pockets was the "perceptible cut" R1.1 bans. Duration grew
    ~3.2s → ~4.4s to fit R1.2's blade/split/thread sequence, which the original spec never had.
    Hub remains a pocket, reached inside the sanctioned ≤120ms amber wrap; the wrap then
    CONTRACTS into the core via a radial mask (uWrapR) in the grade pass.
29. **Camera rides Fritsch–Carlson monotone cubic splines** (z / y / FOV) across the whole
    breach — C1-continuous velocity, so no tween-boundary is perceptible (R1.4). Look-target and
    roll are conventional tweens; micro-shake ≤0.3px is two incommensurate sines on rotation.
30. **Mountain interior darkness is geometry, not grading**: the tube is OPAQUE ink (occludes
    stars), a SeamShroud plane behind the wound fades in with uSeam (so the split reveals black,
    and the tube's rim never silhouettes), and one fog sheet moved in front of the mouth to veil
    the disc at idle. Gap-straddling wireframe segments read as tearing threads mid-split, then
    alpha-snap once uSeam > 0.55 (they'd otherwise streak across the corridor).
31. **Lockup "motion blur" is transform stretch, not CSS filter blur** — filter blur on the
    falling lockup cost 25–275ms raster stalls (traced); scaleY 1.18 + fall + fade reads the
    same at speed. Lockup unmount deferred until arrival (a ~50ms teardown recalc otherwise
    landed exactly on the blade beat).
32. **Scrub/verification tooling**: `?scrub=1` exposes __breachTl + __handles on production
    builds; the scrub stepper runs INSIDE the page on a fixed clock (post-Enter CDP evaluates
    proved flaky) and node screenshots on absolute deadlines (relative waits drifted a full step
    by stop 4). Occluded headed windows throttle the compositor — bringToFront before captures.
33. **R3 chamber camera approaches from core-side + viewer-side, looking OUTWARD** — the rest
    of the system ends up behind the lens, so the content column sits over empty space and the
    sun can never glow behind text. The camera TRACKS the planet live (it keeps orbiting);
    chamber framing is therefore a moving target the rig chases, not a fixed pose.
34. **Mini-orchestrator widget deleted (R3 judgment call).** Its job was keeping the system
    visibly alive while the canvas was paused under an opaque chamber. The chamber now renders
    the live planet + system the whole visit, so the widget was a competing, redundant
    miniature. With it goes the §8 RAF pause: canvasCovered is no longer set by chambers
    (hub held ~145fps, the budget survives).
35. **Chamber content legibility comes from a clean ink gradient, not blur** — the banned
    blurred-hub backdrop is fully deleted; `.chamber-panel::before` darkens the right column
    only (transparent over the planet's left third).
