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
