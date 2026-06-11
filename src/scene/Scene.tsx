import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { useStore } from '../state/store';
import CameraRig from './CameraRig';
import ThresholdWorld from './ThresholdWorld';
import TunnelWorld from './TunnelWorld';
import HubWorld from './HubWorld';
import BreachTimeline from './BreachTimeline';
import PostFX from './PostFX';

/* Compile every shader during Act 0 so the breach plays with zero first-frame jank. */
function Precompiler() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) useStore.getState().setBootShaders(1);
    };
    /* compileAsync needs KHR_parallel_shader_compile — fall back silently where absent */
    if (gl.getContext().getExtension('KHR_parallel_shader_compile')) {
      gl.compileAsync(scene, camera).then(done, done);
    } else {
      gl.compile(scene, camera);
      done();
    }
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);
  return null;
}

/* Pause the RAF loop when the tab is hidden or a chamber fully covers the canvas (§8 budget). */
function FrameloopGovernor() {
  const set = useThree((s) => s.set);
  const covered = useStore((s) => s.canvasCovered);
  useEffect(() => {
    const update = () => {
      const run = !document.hidden && !useStore.getState().canvasCovered;
      set({ frameloop: run ? 'always' : 'never' });
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [set, covered]);
  return null;
}

function ContextLossWatch() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      useStore.getState().setContextLost(true);
    };
    el.addEventListener('webglcontextlost', onLost);
    return () => el.removeEventListener('webglcontextlost', onLost);
  }, [gl]);
  return null;
}

export default function Scene() {
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 2));

  return (
    <div className="scene-root" aria-hidden="true">
      <Canvas
        flat
        dpr={dpr}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
        }}
        camera={{ fov: 45, near: 0.1, far: 160, position: [0, 2.7, 10.5] }}
      >
        <color attach="background" args={['#0A0A0C']} />
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, +(d - 0.25).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(Math.min(window.devicePixelRatio || 1, 2), +(d + 0.25).toFixed(2)))}
        />
        <CameraRig />
        <BreachTimeline />
        <ThresholdWorld />
        <TunnelWorld />
        <HubWorld />
        <PostFX />
        <Precompiler />
        <FrameloopGovernor />
        <ContextLossWatch />
      </Canvas>
    </div>
  );
}
