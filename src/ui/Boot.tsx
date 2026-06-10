import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';

const MIN_BOOT_MS = 450; // pacing floor so the glitch frame is perceivable; progress itself is real

export default function Boot() {
  const progress = useStore((s) => s.bootProgress);
  const act = useStore((s) => s.act);
  const [glitching, setGlitching] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const firedRef = useRef(false);
  const mountedAt = useRef(performance.now());

  useEffect(() => {
    if (act !== 'boot' && !firedRef.current) {
      /* [ skip intro ] pressed during boot — drop the overlay immediately */
      firedRef.current = true;
      setGone(true);
      return;
    }
    if (progress < 1 || firedRef.current) return;
    firedRef.current = true;
    const wait = Math.max(0, MIN_BOOT_MS - (performance.now() - mountedAt.current));
    const t1 = window.setTimeout(() => {
      setGlitching(true);
      window.setTimeout(() => setGlitching(false), 80); // single-frame RGB split, ≤80ms
      window.setTimeout(() => {
        setLeaving(true);
        useStore.getState().completeBoot();
        window.setTimeout(() => setGone(true), 550);
      }, 110);
    }, wait);
    return () => window.clearTimeout(t1);
  }, [progress, act]);

  if (gone) return null;

  const pct = Math.round(progress * 100);
  return (
    <div className={`boot${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <p className={`boot-line${glitching ? ' is-glitching' : ''}`}>
        initializing everest.os <span className="boot-pct">{pct}%</span>
      </p>
      <div className="boot-bar" style={{ width: `${pct}%` }} aria-hidden="true" />
    </div>
  );
}
