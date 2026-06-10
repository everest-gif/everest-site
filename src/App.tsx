import { useEffect } from 'react';
import { useStore } from './state/store';
import Scene from './scene/Scene';
import BreachDriver from './scene/BreachDriver';
import Boot from './ui/Boot';
import ThresholdLockup from './ui/ThresholdLockup';
import HUD from './ui/HUD';
import Cursor from './ui/Cursor';
import Grain from './ui/Grain';
import A11yNav from './ui/A11yNav';
import ContextLost from './ui/ContextLost';

export default function App() {
  const setReducedMotion = useStore((s) => s.setReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forced = new URLSearchParams(window.location.search).has('rm');
    const apply = () => setReducedMotion(forced || mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [setReducedMotion]);

  return (
    <>
      <Scene />
      <BreachDriver />
      <ThresholdLockup />
      <A11yNav />
      <HUD />
      <Boot />
      <Grain />
      <ContextLost />
      <Cursor />
    </>
  );
}
