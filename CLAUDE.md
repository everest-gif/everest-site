# everest-site — project conventions (survive context compaction)

Full spec: `ENTER_THE_MOUNTAINS.md` (load-bearing — build the spec, not the spirit).
Live state: `PLAN.md` (phase checklist). Judgment calls: `DECISIONS.md`.

## Locked stack — no additions without a DECISIONS.md entry
Vite 5 + React 18 + TS strict · three 0.170 + @react-three/fiber 8 + drei 9 + @react-three/postprocessing 2
· inline GLSL strings · GSAP 3.15 (+SplitText, free) + @gsap/react · Lenis · zustand · bespoke global CSS
(no Tailwind, no router lib — hash routing is hand-rolled in `src/state/router.ts`).
Static output; must run from `vite preview` with zero servers/env vars. WebGL2 only.

## Design tokens (exact, in `src/styles/global.css`)
`--ink #0A0A0C` · `--ink-2 #111114` · `--bone #EDE8DF` · `--amber #E8A23D` · `--jade #38D9A9`
· `--dim rgba(237,232,223,.55)` (brightened from spec's .45 for WCAG AA per §9.8) · hairlines 8% bone
· red `#E04438` for live-status ticks ONLY. No other hues; gradients between hues only inside WebGL shaders.

Type: Fraunces Variable (300 italic, animate `opsz` axis on headline reveals — mandatory), JetBrains Mono
Variable (labels/HUD, 11–13px, 0.08–0.14em tracking, uppercase), Geist Variable (body). All self-hosted
via @fontsource-variable. Display scale clamps fluidly.

## Anti-slop bans (hard)
Inter/Roboto/system-ui visible · purple/blue-violet gradients · glassmorphism · generic SaaS hero ·
emoji · lorem ipsum · stock photos · About/Skills/Contact navbar · default cursor on desktop ·
shadows >24px blur · border-radius >6px (exceptions: ENTER ring, node orbs, cursor ring).

## Motion
UI eases `cubic-bezier(0.22,1,0.36,1)`; camera on custom GSAP eases; never linear/bounce/elastic.
Micro 150–250ms, reveals 400–700ms; the Breach (~3.2s) is the only multi-second sequence.
Chamber reveals = CRT scan-line wipe from the node position (never slide-up/fade panels).

## State machine
`boot → threshold → breach → hub → chamber:<id>` + `reverse-breach`. zustand store in
`src/state/store.ts`; transitions are guarded actions. Hash routes: `#/` `#/hub` `#/hub/<node-id>`.
Node ids: jarvis luven emerge dolomite everclash voxhalla bigback beyond.

## Phase exit ritual (every phase, no exceptions)
`npm run typecheck` clean → `npm run build` clean → browser smoke-test → update PLAN.md → git commit.
Performance: 60fps target hub+breach, dpr clamp [1,2], JS <900KB gzip, no per-frame allocations,
pause RAF when hidden/covered.
