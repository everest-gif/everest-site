import { useEffect, useRef, useState } from 'react';

type Mode = 'default' | 'enter' | 'node' | 'back' | 'text';

/* Bone dot + trailing amber ring, lerped (§5). Hidden on coarse pointers. */
export default function Cursor() {
  const [fine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  );
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fine) return;
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let dx = tx;
    let dy = ty;
    let rx = tx;
    let ry = ty;
    let raf = 0;
    let hidden = true;
    document.documentElement.classList.add('cursor-hidden');

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (hidden) {
        hidden = false;
        dx = rx = tx;
        dy = ry = ty;
        document.documentElement.classList.remove('cursor-hidden');
      }
    };
    const onLeave = () => {
      hidden = true;
      document.documentElement.classList.add('cursor-hidden');
    };
    const onOver = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (!el || !(el instanceof Element)) return;
      let mode: Mode = 'default';
      const tagged = el.closest('[data-cursor]');
      if (tagged) mode = (tagged.getAttribute('data-cursor') as Mode) || 'default';
      else if (el.closest('.prose')) mode = 'text';
      ring.setAttribute('data-mode', mode);
    };

    /* M8.10 — ring-pulse on successful click of anything interactive */
    let pulseT = 0;
    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (!el?.closest?.('button, a, [role="radio"]')) return;
      ring.classList.remove('is-pulse');
      window.clearTimeout(pulseT);
      void ring.offsetWidth; /* restart the animation */
      ring.classList.add('is-pulse');
      pulseT = window.setTimeout(() => ring.classList.remove('is-pulse'), 340);
    };

    const loop = () => {
      dx += (tx - dx) * 0.6;
      dy += (ty - dy) * 0.6;
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('click', onClick, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(pulseT);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('click', onClick);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.classList.remove('cursor-hidden');
    };
  }, [fine]);

  if (!fine) return null;
  return (
    <>
      <div ref={ringRef} className="cursor-ring" data-mode="default" aria-hidden="true">
        <span className="cursor-glyph">←</span>
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
