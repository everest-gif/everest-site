# VERIFICATION REPORT — everest.os v1.0

Run: 2026-06-10 · `vite preview` @ localhost:4173 · headed Chromium (Playwright 1.60, real GPU)
· full machine-run protocol: `node verification/verify.mjs` → `verification/RESULTS.json` — **47/47 PASS**

## §9.1 Functional click-through — PASS (all)

| Check | Result |
| --- | --- |
| Boot completes (real font+shader progress), threshold renders | PASS |
| ENTER via click / Enter key / Space key (separate cold loads) | PASS / PASS / PASS |
| Breach start→finish without frame-long stalls | PASS — worst frame gap 8ms over 150 frames |
| `[ skip intro ]` jumps straight to hub | PASS |
| Hover every node → correct stat chip (all 8 verified verbatim) | PASS |
| Click every node → correct chamber + scan-line materialization (beams sampled mid-wipe) | PASS — all 8 titles verified |
| Esc AND `[ ← return to hub ]` close chambers (both paths exercised) | PASS |
| `[ return to mountains ]` reverse-breach; re-enter works a second time | PASS |
| Tab cycles all 8 nodes with visible amber focus ring; Enter opens focused node | PASS |
| Deep links `/#/hub` and `/#/hub/everclash` cold; back/forward sane | PASS |

## §9.2 Console gate — PASS
Zero errors AND zero warnings across the entire flow above (every context: desktop, mobile,
reduced-motion, resilience). No React, three.js disposal, or AudioContext warnings.
`verification/console-log.txt` was never written — the log stayed empty.

## §9.3 Visual evidence — PASS (inspected)
1440×900: `verification/shots/desktop-threshold.png`, `desktop-hub.png`,
`desktop-chamber-jarvis.png`, `desktop-chamber-beyond.png`
390×844: `verification/shots/mobile-threshold.png`, `mobile-hub.png`,
`mobile-chamber-jarvis.png`, `mobile-chamber-beyond.png`
(plus all 8 chambers at 1440×900 in `verification/shots/ch-*.png`)
All inspected by the build session — no overlap, clipping, or illegibility.

## §9.4 Reduced motion — PASS
With `prefers-reduced-motion: reduce` emulated: threshold→hub is an instant crossfade (19ms to
state change, no breach), node drift frozen to a static layout, pulse traffic renders as slow
opacity ticks, chambers open/close instantly, full click-through completed.

## §9.5 Mobile (390×844) — PASS
Threshold legible; ENTER target 104×104px (≥44); hub reflows to a tall constellation with 48px
node hit areas, all on-screen; chambers scroll smoothly (Lenis); zero horizontal overflow
(documentElement and chamber-internal, all chambers spot-checked + jarvis/beyond/everclash measured).

## §9.6 Performance — PASS
- Breach: **144fps avg**, worst gap 8ms (Apple Silicon, headed Chromium, 1440×900)
- Hub idle: **145fps avg**, worst gap 8ms
- Bundle: **328.2 KB gzip total JS** (three 265.6 + app 42.3 + gsap 28.2) vs 900 KB budget
- RAF pauses on `visibilitychange` and while a chamber covers the canvas (mini-orchestrator keeps
  the system alive on a 2D canvas at ~30fps)

## §9.7 Resilience — PASS
- Rapid triple-click on ENTER → single breach (store-guarded transitions)
- Viewport resized mid-breach → camera/canvas sane on arrival
- Forced WebGL context loss (`WEBGL_lose_context`) → styled mono fallback panel, never a white screen

## §9.8 Accessibility — PASS
- Every button/link has an accessible name (0 unnamed across the app)
- WebGL canvas container `aria-hidden="true"`; visually-hidden `<nav>` mirrors all 8 nodes as
  real links (crawler + screen-reader path); chamber panels are labelled `role="dialog"`
- `--dim` on `--ink`: **5.32:1** — WCAG AA pass (token brightened from spec's 0.45α to 0.55α per
  §9.8 instruction; recorded in DECISIONS.md #1)

## Pending REPLACE_ME values (§7)
Rendered dimmed with a mono `· pending` suffix — no dead links anywhere:
- `EMAIL` (REPLACE_ME@example.com) · `GITHUB` · `LINKEDIN` · `X/TWITTER`
- `og:image` URL is relative (`/og.png`) — set an absolute URL when a domain exists.

## Media convention (README footer)
Chambers check `/media/<project-id>/manifest.json` at render time
(`{"images":["a.png", ...]}`). Files present → real gallery with lazy-loading; absent →
intentional glowing wireframe placeholder frames. Drop screenshots + manifest into
`public/media/<id>/` with **zero code changes**. See `public/media/README.md`.

## How to run / deploy
```
npm i && npm run dev        # develop
npm run build               # typecheck + build → static dist/
npm run preview             # serve the production build locally
```
Output is a fully static `dist/` — deployable to Vercel / Netlify / Cloudflare Pages as-is.
No servers, no env vars.
