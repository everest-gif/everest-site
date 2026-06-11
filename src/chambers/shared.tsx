import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import type { NodeId } from '../state/store';
import { useStore } from '../state/store';

/* ============================================================
   Shared chamber primitives — every chamber builds from these.
   Design system: §4 tokens, mono labels, Fraunces opsz reveals.
   ============================================================ */

/* Chamber display heading — Fraunces 300 italic with the MANDATORY opsz axis sweep (§2 Act IV).
   The chamber panel stays clip-hidden until ~0.7s into the open timeline (ChamberLayer), so the
   sweep starts at 0.78s: the axis visibly travels 9→144 as the headline lands behind the scan. */
export function ChamberTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useStore((s) => s.reducedMotion);
  useEffect(() => {
    const h = ref.current?.querySelector('.ch-title');
    if (!h) return;
    if (reduced) {
      gsap.set(h, { fontVariationSettings: "'opsz' 144", autoAlpha: 1, y: 0 });
      return;
    }
    const tw = gsap.fromTo(
      h,
      { fontVariationSettings: "'opsz' 9", autoAlpha: 0, y: 18 },
      { fontVariationSettings: "'opsz' 144", autoAlpha: 1, y: 0, duration: 0.95, ease: 'expo.out', delay: 0.78 },
    );
    return () => {
      tw.kill();
    };
  }, [reduced]);
  return (
    <div ref={ref}>
      {kicker && <p className="ch-kicker">{kicker}</p>}
      <h2 className="ch-title">{children}</h2>
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
