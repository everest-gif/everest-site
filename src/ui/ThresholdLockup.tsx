import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import { useStore } from '../state/store';

gsap.registerPlugin(useGSAP, SplitText);

/* Act I type lockup + ENTER affordance. Magnetic hover per §5 (≤8px translate, spring back). */
export default function ThresholdLockup() {
  const act = useStore((s) => s.act);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<SplitText | null>(null);
  const visible = act === 'threshold';

  /* revert the headline split when the lockup unmounts */
  useEffect(() => {
    if (!mounted) {
      splitRef.current?.revert();
      splitRef.current = null;
    }
  }, [mounted]);

  /* falls behind the camera during the breach; unmounting mid-flight cost a ~57ms style
     recalc right at the blade moment — defer teardown into the arrival light-wrap */
  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    if (!mounted || act === 'breach') return;
    const t = window.setTimeout(() => setMounted(false), 80);
    return () => window.clearTimeout(t);
  }, [visible, mounted, act]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      if (visible && mounted) {
        if (reducedMotion) {
          gsap.set(root, { autoAlpha: 1 });
          gsap.set(root.querySelectorAll('.lk-item'), { autoAlpha: 1, y: 0 });
          gsap.set('.lockup-h1', { fontVariationSettings: "'opsz' 144" });
          return;
        }
        gsap.set(root, { autoAlpha: 1 });
        gsap.set(root.querySelectorAll('.lk-item'), { scaleX: 1, scaleY: 1 });
        /* M1 kinetic type — the headline rises out of per-line masks while opsz sweeps */
        splitRef.current?.revert();
        const h = root.querySelector<HTMLElement>('.lockup-h1');
        const split = h ? SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'sp-line' }) : null;
        splitRef.current = split;
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.fromTo(
          '.lockup-eyebrow',
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.7 },
          0.1,
        );
        if (h && split) {
          tl.set(h, { autoAlpha: 1, y: 0 }, 0.25)
            .fromTo(split.lines, { yPercent: 145 }, { yPercent: 0, duration: 1.05, stagger: 0.09 }, 0.25)
            .fromTo(
              h,
              { fontVariationSettings: "'opsz' 9" },
              { fontVariationSettings: "'opsz' 144", duration: 1.15 },
              0.25,
            );
        }
        tl.fromTo('.lockup-sub', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.55)
          .fromTo('.enter-wrap', { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.8 }, 0.75);
      } else if (useStore.getState().act === 'breach' && !reducedMotion) {
        /* R1.1 — signage passing a car window: falls behind the camera with motion blur.
           Animate the small text items, not the full-viewport root — blur on a huge
           layer caused 25–50ms raster hitches. */
        /* vertical stretch instead of filter blur — same motion-smear read, none of the
           25–275ms filter raster stalls the real blur caused */
        gsap.to(root.querySelectorAll('.lk-item'), {
          y: '+=210',
          scaleY: 1.18,
          scaleX: 1.02,
          autoAlpha: 0,
          duration: 0.85,
          ease: 'power3.in',
        });
        gsap.to(root, { autoAlpha: 0, duration: 0.2, delay: 0.75 });
      } else {
        gsap.to(root, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' });
      }
    },
    { scope: rootRef, dependencies: [visible, mounted, reducedMotion] },
  );

  /* magnetic pull within 60px of the ring edge */
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const xTo = gsap.quickTo(wrap, 'x', { duration: 0.5, ease: 'expo.out' });
    const yTo = gsap.quickTo(wrap, 'y', { duration: 0.5, ease: 'expo.out' });
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      const reach = r.width / 2 + 60;
      if (d < reach && d > 0.01) {
        const pull = (1 - d / reach) * 8; /* §5: max 8px */
        xTo((dx / d) * pull);
        yTo((dy / d) * pull);
      } else {
        xTo(0);
        yTo(0);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [mounted, reducedMotion]);

  /* Enter / Space trigger — guarded in the store against double-fire */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        useStore.getState().beginBreach();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div className="lockup" ref={rootRef}>
      <p className="lockup-eyebrow lk-item">BOULDER, CO · 40.0150° N, 105.2705° W</p>
      <h1 className="lockup-h1 lk-item">Enter the Mountains</h1>
      <p className="lockup-sub lk-item">The portfolio of Everest — builder of autonomous systems.</p>
      <div className="enter-wrap lk-item" ref={wrapRef}>
        <button
          type="button"
          className="enter-ring"
          data-cursor="enter"
          aria-label="Enter the mountains — begin the journey to the hub"
          onClick={() => useStore.getState().beginBreach()}
        >
          <svg className="enter-charge" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="48.5" />
          </svg>
          <span className="enter-label">ENTER</span>
        </button>
      </div>
    </div>
  );
}
