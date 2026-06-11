import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { NodeId } from '../state/store';
import { useStore } from '../state/store';
import { countUp, formatNumeric } from './reveal';

gsap.registerPlugin(SplitText);

/* ============================================================
   Shared chamber primitives — every chamber builds from these.
   Design system: §4 tokens, mono labels, Fraunces opsz reveals.
   ============================================================ */

/* Chamber display heading — Fraunces 300 italic, SplitText line-mask reveal with the
   MANDATORY opsz axis sweep (§2 Act IV): each line rises out of its own clip while the
   optical axis travels 9→144 as the headline lands behind the scan.
   `wonk` engages Fraunces' WONK axis — personality moments only (Beyond). */
export function ChamberTitle({
  children,
  kicker,
  wonk = false,
}: {
  children: ReactNode;
  kicker?: string;
  wonk?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useStore((s) => s.reducedMotion);
  useEffect(() => {
    const h = ref.current?.querySelector<HTMLElement>('.ch-title');
    const k = ref.current?.querySelector<HTMLElement>('.ch-kicker');
    if (!h) return;
    const axes = (opsz: number) => `'opsz' ${opsz}${wonk ? ", 'WONK' 1, 'SOFT' 28" : ''}`;
    if (reduced) {
      gsap.set(h, { fontVariationSettings: axes(144), autoAlpha: 1 });
      return;
    }
    const split = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'sp-line' });
    const tl = gsap.timeline({ delay: 0.18 });
    if (k) tl.fromTo(k, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0);
    tl.set(h, { autoAlpha: 1 }, 0)
      .fromTo(
        split.lines,
        { yPercent: 145 },
        { yPercent: 0, duration: 0.85, ease: 'expo.out', stagger: 0.085 },
        0.02,
      )
      .fromTo(
        h,
        { fontVariationSettings: axes(9) },
        { fontVariationSettings: axes(144), duration: 0.95, ease: 'expo.out' },
        0.02,
      );
    return () => {
      tl.kill();
      split.revert();
    };
  }, [reduced, wonk]);
  return (
    <div ref={ref}>
      {kicker && <p className="ch-kicker">{kicker}</p>}
      <h2 className="ch-title">{children}</h2>
    </div>
  );
}

/* M1 — ghost numeral 01–08: Fraunces roman, ~22vh, 3–4% bone, behind content,
   cropped by the viewport edge. Mounted once per chamber by ChamberStage. */
export function GhostNumeral({ index }: { index: number }) {
  return (
    <div className="ch-ghost" aria-hidden="true">
      {String(index).padStart(2, '0')}
    </div>
  );
}

/* M1 — the pull-stat moment: one enormous Fraunces-italic number per chamber,
   hairline rules above/below, mono caption, counts up once on reveal (800ms eased). */
export function PullStat({
  value,
  caption,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number;
  caption: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useStore((s) => s.reducedMotion);
  const parts = { prefix: '', num: value, suffix: '', decimals };
  const final = formatNumeric(parts, value);
  useEffect(() => {
    const root = ref.current;
    const el = root?.querySelector<HTMLElement>('.ch-pull-num');
    if (!root || !el || reduced) return;
    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        tween = countUp(el, parts);
      },
      { threshold: 0.4 },
    );
    el.textContent = formatNumeric(parts, 0);
    io.observe(root);
    return () => {
      io.disconnect();
      tween?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, value, decimals]);
  return (
    <div className="ch-pull" ref={ref}>
      <div className="ch-pull-value">
        {prefix && <span className="ch-pull-unit">{prefix}</span>}
        <span className="ch-pull-num">{final}</span>
        {suffix && <span className="ch-pull-unit">{suffix}</span>}
      </div>
      <p className="ch-pull-cap">{caption}</p>
    </div>
  );
}

/* Mono marginalia — carries the single RGB-split flicker as the chamber locks in. */
export function Marginalia({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={`ch-marginalia${className ? ` ${className}` : ''}`}>{children}</span>;
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="ch-stat">
      <div className="ch-stat-value">{value}</div>
      <div className="ch-stat-label">{label}</div>
    </div>
  );
}

/* ---------- media convention (§3): /public/media/<id>/manifest.json lists images.
   Absent → intentional procedural placeholder frames. Zero code changes to add media. ---------- */
export function useMedia(id: NodeId): string[] | null {
  const [files, setFiles] = useState<string[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/media/${id}/manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m: { images?: string[] } | null) => {
        if (alive && m && Array.isArray(m.images) && m.images.length > 0) {
          setFiles(m.images.map((f) => `/media/${id}/${f}`));
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id]);
  return files;
}

export function Gallery({ id, captions, ratio = '16 / 10' }: { id: NodeId; captions: string[]; ratio?: string }) {
  const files = useMedia(id);
  return (
    <div className="ch-gallery">
      {captions.map((cap, i) =>
        files && files[i] ? (
          <figure key={cap} className="ch-shot" style={{ aspectRatio: ratio }}>
            <img src={files[i]} alt={cap} loading="lazy" decoding="async" />
            <figcaption className="ch-shot-cap">{cap}</figcaption>
          </figure>
        ) : (
          <PlaceholderFrame key={cap} caption={cap} ratio={ratio} index={i} />
        ),
      )}
    </div>
  );
}

/* R4.2 — atmosphere hero art: /public/art/<id>/hero.{avif,webp,jpg}. Palette-locked,
   ATMOSPHERE ONLY — never screenshots, never anything mistakable for evidence.
   Absent files render nothing; darkness is better than slop. */
export function HeroArt({ id, alt }: { id: NodeId; alt: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <figure className="ch-hero" aria-hidden={alt === '' || undefined}>
      <picture>
        <source srcSet={`/art/${id}/hero.avif`} type="image/avif" />
        <source srcSet={`/art/${id}/hero.webp`} type="image/webp" />
        <img
          src={`/art/${id}/hero.jpg`}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setMissing(true)}
        />
      </picture>
    </figure>
  );
}

/* Glowing wireframe placeholder — looks intentional, never a gray box (§3). */
export function PlaceholderFrame({ caption, ratio = '16 / 10', index = 0 }: { caption: string; ratio?: string; index?: number }) {
  return (
    <figure className="ch-ph" style={{ aspectRatio: ratio, animationDelay: `${index * 0.35}s` }}>
      <span className="ch-ph-corner tl" aria-hidden="true" />
      <span className="ch-ph-corner tr" aria-hidden="true" />
      <span className="ch-ph-corner bl" aria-hidden="true" />
      <span className="ch-ph-corner br" aria-hidden="true" />
      <span className="ch-ph-scan" aria-hidden="true" />
      <figcaption className="ch-ph-cap">{caption}</figcaption>
    </figure>
  );
}
