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
36. **Chamber hero art is procedural, not diffusion-generated.** R4.2 assumed a Higgsfield MCP;
    none was connected at execution time. Rather than skip (R8.5 requires art in all 8) the
    heroes are WebGL fragment-shader compositions (tools/make-art.mjs) — palette-locked by
    construction, deterministic, regenerable, graded with grain + duotone. The
    public/art/<id>/hero.* convention means diffusion outputs can replace them later with
    zero code changes. R4's own rule decided it: darkness is better than slop.
37. **Geist retired entirely (M1).** Newsreader's wght variant carries all prose — its default
    opsz (16) IS the text optical size; the opsz-axis file would cost 132KB vs 58KB for zero
    visible gain at body sizes. Measured load payload 278.2KB ≤ 280KB budget: Fraunces
    full-italic 146.2 (buys SOFT/WONK personality axes) + Fraunces roman wght 35.8 (ghost
    numerals) + JetBrains Mono 39.5 + Newsreader 56.7.
38. **Limb-overlap headlines come from camera framing, not negative margins.** The chamber
    scroll container needs overflow-y:auto, which forces overflow-x to clip — any text pulled
    past its left edge is cut. So the planet moved right instead (look offset 0.44→0.37 ≈
    NDC −0.38): the limb tucks under the column and headlines cross it inside their own box.
    Headline pull capped at −3.2vw, within the column padding.
39. **SplitText masks padded ±0.24em horizontally** (+0.2/0.24em vertically) with compensating
    negative margins: Fraunces at opsz 144 italic paints far outside its em box, and the
    masks' overflow:clip cut swashes/descenders at rest. Lines start at yPercent 145 so the
    extended clip window still hides them fully before the rise.
40. **Tunnel dome hidden by handle-gating, not art (M3).** The opaque tube read as a dark dome
    occluding stars behind the peak. Its group is now visible only while seam/tunnelLight/
    tunnelProgress > 0 — it enters visibility during the split, fully masked by the SeamShroud,
    so the no-cut audit never sees a pop. Precompile still covers it (gl.compile traverses
    invisible nodes).
41. **Full-bleed near terrain is rest-state only.** nearFade tightened to (1.2→4.5) and a faint
    valley-floor glow added so terrain meets the bottom edge — but during the breach the camera
    flies THROUGH that geometry and the additive lines flooded the lens. The fade window now
    widens back to (2.8→10) as uNearBright ramps, restoring the verified R1 in-flight look.
    Confirmed against r2/scrub-40 ground truth.
42. **Sky-level season elements (fog density/tint, star sharpness, sky glow) mix globally**
    over the same 1.4s window, while terrain, pulse dots and particles split spatially at the
    front. Weather lives on the ground; the sky has no frontline to read, and a hard star-field
    seam would look like a rendering bug. Reduced motion reuses the identical uniform path with
    edge width 400 — the front degenerates into a 250ms crossfade, one code path.
43. **Season particles go dark under reduced motion** rather than freezing mid-air — a blizzard
    suspended between sky and ground reads as a glitch, not a still.
44. **Skip-intro returned to bottom-right; the season control owns bottom-left.** GORGEOUS_PASS
    M3 sites the seasons "bottom-left opposite skip-intro"; smoke screenshots show no cursor
    collision at br (the R6 worry) now that the control there is plain text.
45. **Hub orbits rebuilt co-rotating with annular ring separation (M5).** The old mix of
    prograde/retrograde planets on nested ellipses is geometrically un-fixable: counter-rotating
    bodies whose projected orbits sit closer than the required separation at EVERY angle must
    eventually co-locate — no soft repulsion can manufacture radial room from angular offsets
    (jarvis·luven hit disc-gap −0.43 in the first audit). New data: all speeds prograde, inner
    ring 2.2–2.85 / outer 4.1–4.42 with small inclines so the projected annuli clear each other,
    plus a solver (orbits.ts): per-ring minimum ANGULAR spacing on the ellipse's minor-axis
    metric, cross-ring projected-proximity time-shift backstop, and a rate-capped spring-back —
    a proportional decay grew with the offsets until it dragged planets back through each other
    at t≈800s (the "snowplow" failure). Audit: 300s/60Hz minDiscGap +0.227, 900s +0.119.
46. **Drag-orbit z-parallax now comes mostly from the backdrop starfield** — the flatter
    inclines that guarantee ring separation reduced planet z-spread; the new 26–70-unit star
    shell restores depth on the lean.
47. **Nebula is texture, not backdrop** — 6% additive over near-black ink reads as double the
    background luminance; shipped at 3% with high-threshold wisps and colors pulled half-way
    to ink. The directive's "≤6%" is honored as a ceiling, not a target.
48. **S1 — the ascent: the hub moved from a y=600 pocket to y=64, directly above the
    mountains in the same world space.** Metaphor: enter the mountains → reach the summit →
    see the whole system. Because both worlds share one scene graph and the hub is within
    real flying distance, the transition is one physically continuous camera move — no
    teleport, no whiteout, no wrap, nothing to hide. The tunnel (scene, shaders, handles,
    end-cap, ribbons, speed-lines) is deleted; the SeamShroud too: the split now opens onto
    SKY, foreshadowing the destination. Forward 1.8s (open 0.7 / rise 0.8 / arrival 0.3),
    descent 1.2s. The spline ends a breath short of the hub home pose with decaying
    velocity; the camera rig's exponential settle absorbs the residue, so the dock reads
    as a single ease-out. Reduced motion: a 250ms dip through an ink veil in the grade
    pass (veil up 120ms → act swap → down 130ms) — one code path, no flight.
49. **Star fields hand off mid-climb.** Threshold stars carry the first half of the rise,
    the AscentField streak shaft carries the middle, and the hub's cosmos (gated by
    coreReveal — sun, rings, backdrop stars all ride it) fades up as the climb tops out;
    a faint hubPreGlow at t≈1.0 puts the destination in the sky the moment the peaks are
    cleared. The range itself dims to 45% as the gaze sweeps up the corridor — four
    additive wireframe layers viewed edge-on would otherwise flood the lens (same fix,
    held at 40%, protects the descent dive).
50a. **S5 — the gutter law retires the limb-overlap headline on desktop.** With the planet
    body capped at 38vw and a mandated ≥6vw gutter before the 42vw column, a headline can
    no longer reach the limb without crossing the gutter ("content never enters the
    gutter" wins — the overlap allowance is a MAY, not a MUST). ch-head-overlap keeps its
    small in-column pull for edge tension. The collision audit models TEXT BLOCKS (not
    inline spans — giant display digits bleed their em-box past the line box, which is
    typography, not layout), exempts aria-hidden decoration except headlines themselves,
    and checks the floating travel chrome as its own layer.
51. **Recording tooling: deviceScaleFactor pinned to 1.** A PerformanceMonitor dpr step
    mid-flight resizes the canvas and stalls Chromium's screencast — the page stays
    healthy (rAF sampler + live probe proved it) while the video freezes on its last
    frame. Pinning dsf=1 sidesteps the decline. Perf evidence comes from the rAF
    sampler and NOVIDEO runs, never from recorded-run hitch counts.
