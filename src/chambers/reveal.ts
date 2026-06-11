import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useStore } from '../state/store';

gsap.registerPlugin(SplitText);

/* ============================================================
   M1 kinetic type + M8 jewelry — one reveal engine per chamber.
   Nothing simply appears:
   - .prose p          → SplitText lines fade up, 60ms stagger
   - [data-rule]       → hairline rules scaleX in (origin left)
   - .ch-stat-value    → numeric values count up once
   Elements animate when they enter the viewport (IntersectionObserver);
   the engine returns a cleanup that reverts splits and kills tweens.
   ============================================================ */

interface NumericParts {
  prefix: string;
  num: number;
  suffix: string;
  decimals: number;
}

/* "$994" / "770+" / "~90%" / "70.3" → countable; "nightly" / "6v6" → null */
export function parseNumeric(text: string): NumericParts | null {
  const m = /^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)([^0-9]*)$/.exec(text.trim());
  if (!m) return null;
  const num = parseFloat(m[2].replace(/,/g, ''));
  if (!isFinite(num)) return null;
  const decimals = m[2].includes('.') ? m[2].split('.')[1].length : 0;
  return { prefix: m[1], num, suffix: m[3], decimals };
}

export function formatNumeric(p: NumericParts, n: number): string {
  let s = n.toFixed(p.decimals);
  if (p.num >= 1000) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: p.decimals });
  return `${p.prefix}${s}${p.suffix}`;
}

/* count-up tween — 800ms eased, fires once (M1 pull-stat / M8.3 stat tickers) */
export function countUp(el: HTMLElement, parts: NumericParts, duration = 0.8): gsap.core.Tween {
  const state = { n: 0 };
  return gsap.to(state, {
    n: parts.num,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = formatNumeric(parts, state.n);
    },
  });
}

export function initChamberReveals(root: HTMLElement): () => void {
  const reduced = useStore.getState().reducedMotion;
  const tweens: gsap.core.Tween[] = [];
  const splits: SplitText[] = [];

  const paras = Array.from(root.querySelectorAll<HTMLElement>('.prose p'));
  const rules = Array.from(root.querySelectorAll<HTMLElement>('[data-rule]'));
  const stats = Array.from(root.querySelectorAll<HTMLElement>('.ch-stat-value'));

  if (reduced) return () => undefined;

  /* prime initial states */
  for (const r of rules) gsap.set(r, { scaleX: 0, transformOrigin: 'left center' });
  for (const p of paras) gsap.set(p, { autoAlpha: 0 });
  const statParts = new Map<HTMLElement, NumericParts | null>();
  for (const s of stats) {
    statParts.set(s, parseNumeric(s.textContent ?? ''));
    gsap.set(s, { autoAlpha: 0 });
  }

  const seen = new WeakSet<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || seen.has(e.target)) continue;
        seen.add(e.target);
        io.unobserve(e.target);
        const el = e.target as HTMLElement;

        if (el.matches('.prose p')) {
          /* line-mask body reveal — split AFTER fonts settle (chambers open post-boot) */
          const split = SplitText.create(el, { type: 'lines', linesClass: 'sp-bline' });
          splits.push(split);
          gsap.set(el, { autoAlpha: 1 });
          tweens.push(
            gsap.fromTo(
              split.lines,
              { autoAlpha: 0, y: 14 },
              { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06 },
            ),
          );
        } else if (el.matches('[data-rule]')) {
          tweens.push(gsap.to(el, { scaleX: 1, duration: 0.7, ease: 'power3.out' }));
        } else if (el.matches('.ch-stat-value')) {
          gsap.set(el, { autoAlpha: 1 });
          const parts = statParts.get(el);
          if (parts) tweens.push(countUp(el, parts));
          else tweens.push(gsap.from(el, { autoAlpha: 0, y: 8, duration: 0.5, ease: 'power3.out' }));
        }
      }
    },
    { threshold: 0.25 },
  );

  for (const el of [...paras, ...rules, ...stats]) io.observe(el);

  return () => {
    io.disconnect();
    tweens.forEach((t) => t.kill());
    splits.forEach((s) => s.revert());
  };
}
