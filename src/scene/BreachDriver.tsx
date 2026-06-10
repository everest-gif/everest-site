import { useEffect } from 'react';
import { useStore } from '../state/store';

/* P1 placeholder — P2 replaces this with the master GSAP breach timeline.
   Keeps the state machine traversable so ENTER never strands the act. */
export default function BreachDriver() {
  const act = useStore((s) => s.act);
  useEffect(() => {
    if (act === 'breach') {
      const t = window.setTimeout(() => useStore.getState().arriveHub(), 600);
      return () => window.clearTimeout(t);
    }
    if (act === 'reverse-breach') {
      const t = window.setTimeout(() => useStore.getState().arriveThreshold(), 600);
      return () => window.clearTimeout(t);
    }
  }, [act]);
  return null;
}
