import { useEffect } from 'react';
import { useStore } from '../state/store';

/* P0 stub — the persistent R3F canvas lands in P1. Reports shader stage ready so boot can complete. */
export default function Scene() {
  useEffect(() => {
    useStore.getState().setBootShaders(1);
  }, []);
  return <div className="scene-root" aria-hidden="true" />;
}
