import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import gsap from 'gsap';
import { useThree } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, HUB_Y, TUNNEL_CY } from './handles';

/* Act II (R1) — ONE unbroken shot. The camera flies from the threshold home, through the
   opening mountain, into the tunnel bored behind the seam, and out the far end. The only
   discontinuity is the sanctioned ≤120ms amber light-wrap at hub arrival (R1.1/R1.3).
   Camera position/FOV ride single monotone-cubic splines — C1-continuous, so no tween
   boundary is ever perceptible (R1.4). */

const SEAM = { x: 0, y: 4.2, z: -13.4 };
const ROLL_MAX = 0.055; /* ≈3.2° — restraint */

/* Fritsch–Carlson monotone cubic — smooth velocity through waypoints, no overshoot. */
function monotoneCubic(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i];
    m[i] = (ys[i + 1] - ys[i]) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
    }
  }
  t[n - 1] = m[n - 2];
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = n - 2;
    for (let k = 0; k < n - 1; k++)
      if (x < xs[k + 1]) {
        i = k;
        break;
      }
    const s = (x - xs[i]) / dx[i];
    const s1 = 1 - s;
    const h00 = (1 + 2 * s) * s1 * s1;
    const h10 = s * s1 * s1;
    const h01 = s * s * (3 - 2 * s);
    const h11 = s * s * (s - 1);
    return h00 * ys[i] + h10 * dx[i] * t[i] + h01 * ys[i + 1] + h11 * dx[i] * t[i + 1];
  };
}

/* forward flight (M4 — total 2.2s: open 0.8 → tunnel 1.1 → arrival 0.3):
   home → through the seam → down the tunnel (teleport at 2.2 inside the wrap).
   Same waypoints as the verified R1 path, remapped onto the compressed clock. */
const fwdZ = monotoneCubic([0, 0.42, 0.56, 0.8, 1.01, 1.9, 2.2], [10.5, 5.6, 3.4, -1.5, -17, -66, -74]);
const fwdY = monotoneCubic([0, 0.42, 0.8, 1.01, 2.2], [2.9, 3.3, 3.55, TUNNEL_CY, TUNNEL_CY]);
const fwdF = monotoneCubic([0, 0.42, 0.56, 0.8, 1.01, 1.75, 2.2], [45, 50, 52, 62, 70, 95, 95]);

/* reverse: light-wrap out of the hub → backing out of the tunnel → seam closes */
const revZ = monotoneCubic([0.16, 1.0, 1.45, 1.7], [-58, -8, 7, 10.5]);
const revY = monotoneCubic([0.16, 1.0, 1.7], [TUNNEL_CY, 3.4, 2.9]);
const revF = monotoneCubic([0.16, 1.0, 1.7], [88, 62, 45]);

function resetTransitHandles() {
  handles.seam.value = 0;
  handles.blade.value = 0;
  handles.nearBright.value = 0;
  handles.tunnelProgress.value = 0;
  handles.tunnelLight.value = 0;
  handles.converge.value = 0;
  handles.chromaOffset.value = 0;
  handles.thresholdFade.value = 1;
}

export default function BreachTimeline() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const act = useStore((s) => s.act);
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (act !== 'breach' && act !== 'reverse-breach') return;
    const store = useStore.getState();

    /* §9.4 — reduced motion: no breach, instant crossfade */
    if (store.reducedMotion) {
      resetTransitHandles();
      handles.whiteout.value = 0;
      handles.wrapRadius.value = 1.1;
      if (act === 'breach') store.arriveHub();
      else store.arriveThreshold();
      return;
    }

    arrivedRef.current = false;
    const fwd = act === 'breach';
    const look = fwd
      ? { x: 0, y: 2.1, z: -14 }
      : { x: 0, y: TUNNEL_CY, z: -120 };
    const rig = { roll: 0, teleported: false };

    const apply = () => {
      const t = tl.time();
      if (rig.teleported) return; /* hub home set in the arrival call; contraction owns the frame */
      if (fwd) {
        camera.position.set(0, fwdY(t), fwdZ(t));
        camera.fov = fwdF(t);
      } else {
        if (t < 0.16) return; /* camera holds the hub frame until the wrap floods */
        camera.position.set(0, revY(t), revZ(t));
        camera.fov = revF(t);
      }
      camera.lookAt(look.x, look.y, look.z);
      camera.rotateZ(rig.roll);
      /* micro shake ≤0.3px at peak — speed you can feel, never see (R1.3) */
      const p = handles.tunnelProgress.value * handles.tunnelLight.value * (1 - handles.converge.value);
      if (p > 0.01) {
        const a = 0.00045 * p;
        camera.rotateX(Math.sin(t * 61.7) * a);
        camera.rotateY(Math.sin(t * 47.3 + 1.7) * a);
      }
      camera.updateProjectionMatrix();
    };

    const tl = gsap.timeline({ onUpdate: apply, paused: false });

    if (fwd) {
      /* A — approach (0–0.42): drift toward the ridge, gaze lifts to the crest */
      tl.to(look, { y: SEAM.y, z: SEAM.z, duration: 0.42, ease: 'power2.out' }, 0)
        .to(handles.nearBright, { value: 0.35, duration: 0.42, ease: 'power2.inOut' }, 0)
        /* B — the blade (0.42–0.56): a bone hairline draws down the crest */
        .to(handles.blade, { value: 1, duration: 0.14, ease: 'power2.in' }, 0.42)
        /* C — the split (0.56–0.8): the mountain opens; strata part, wound burns amber */
        .to(handles.seam, { value: 1, duration: 0.24, ease: 'power2.inOut' }, 0.56)
        .to(handles.blade, { value: 0, duration: 0.16, ease: 'power1.out' }, 0.73)
        .to(handles.bloomIntensity, { value: 0.75, duration: 0.21, ease: 'power2.in' }, 0.56)
        /* D — threading the gap (0.71–1.04): into the wound while it is still opening */
        .to(look, { y: TUNNEL_CY, z: -70, duration: 0.31, ease: 'power2.inOut' }, 0.71)
        .to(handles.chromaOffset, { value: 0.0035, duration: 0.13, ease: 'power2.in' }, 0.83)
        .to(handles.chromaOffset, { value: 0, duration: 0.18, ease: 'power2.out' }, 1.01)
        .to(handles.tunnelLight, { value: 1, duration: 0.21, ease: 'power1.inOut' }, 0.86)
        .to(handles.thresholdFade, { value: 0, duration: 0.26, ease: 'power1.inOut' }, 0.8)
        .to(handles.bloomIntensity, { value: 0.6, duration: 0.27, ease: 'power1.out' }, 0.92)
        /* E — the flight (1.0–1.9): darkness with ribbons; speed from streaks + FOV */
        .to(handles.tunnelProgress, { value: 1, duration: 0.92, ease: 'power1.inOut' }, 0.98)
        .to(rig, { roll: ROLL_MAX, duration: 0.9, ease: 'sine.inOut' }, 0.92)
        /* F — arrival (1.84–2.2): ribbons converge → 120ms amber wrap → hub */
        .to(handles.converge, { value: 1, duration: 0.29, ease: 'power2.in' }, 1.84)
        .to(handles.chromaOffset, { value: 0.003, duration: 0.25, ease: 'power2.in' }, 1.87)
        .set(handles.wrapRadius, { value: 1.1 }, 2.06)
        .to(handles.whiteout, { value: 1, duration: 0.12, ease: 'power2.in' }, 2.08)
        .call(
          () => {
            arrivedRef.current = true;
            rig.teleported = true;
            camera.position.set(0, HUB_Y + 0.6, 8.4);
            camera.lookAt(0, HUB_Y, 0);
            camera.fov = 50;
            camera.updateProjectionMatrix();
            resetTransitHandles();
            /* detached resolve — the flood CONTRACTS into the hub core (R1.3) */
            gsap.timeline()
              .to(handles.wrapRadius, { value: 0, duration: 0.45, ease: 'power2.in' }, 0.04)
              .set(handles.whiteout, { value: 0 })
              .set(handles.wrapRadius, { value: 1.1 })
              .to(handles.bloomIntensity, { value: 0.55, duration: 0.45, ease: 'power1.out' }, 0);
            useStore.getState().arriveHub();
          },
          [],
          2.2,
        );
    } else {
      /* reverse — the wrap blooms OUT of the core, then we back out of the mountain */
      tl.set(handles.wrapRadius, { value: 0 }, 0)
        .set(handles.whiteout, { value: 1 }, 0)
        .to(handles.wrapRadius, { value: 1.1, duration: 0.14, ease: 'power2.in' }, 0)
        .call(
          () => {
            handles.tunnelLight.value = 1;
            handles.tunnelProgress.value = 1;
            handles.thresholdFade.value = 0;
            handles.seam.value = 1;
            handles.nearBright.value = 0.55;
            handles.bloomIntensity.value = 0.6;
            rig.roll = -ROLL_MAX * 0.5;
          },
          [],
          0.14,
        )
        .to(handles.whiteout, { value: 0, duration: 0.2, ease: 'power2.out' }, 0.16)
        .to(handles.tunnelProgress, { value: 0, duration: 0.84, ease: 'power1.inOut' }, 0.16)
        .to(rig, { roll: 0, duration: 0.6, ease: 'sine.inOut' }, 0.3)
        .to(handles.thresholdFade, { value: 1, duration: 0.3, ease: 'power1.out' }, 0.7)
        .to(handles.tunnelLight, { value: 0, duration: 0.3, ease: 'power1.out' }, 0.85)
        .to(look, { y: 2.1, z: -14, duration: 0.55, ease: 'power2.inOut' }, 0.9)
        /* the mountain closes behind us */
        .to(handles.seam, { value: 0, duration: 0.45, ease: 'power2.inOut' }, 1.15)
        .to(handles.nearBright, { value: 0, duration: 0.45, ease: 'power1.out' }, 1.15)
        .to(handles.bloomIntensity, { value: 0.85, duration: 0.5, ease: 'power1.inOut' }, 1.2)
        .call(
          () => {
            arrivedRef.current = true;
            useStore.getState().arriveThreshold();
          },
          [],
          1.7,
        );
    }

    if (import.meta.env.DEV || window.location.search.includes('scrub')) {
      (window as unknown as Record<string, unknown>).__breachTl = tl;
      (window as unknown as Record<string, unknown>).__handles = handles;
    }

    return () => {
      tl.kill();
      if (!arrivedRef.current) {
        /* aborted mid-flight (skip intro / history nav) — leave no transit residue */
        resetTransitHandles();
        handles.wrapRadius.value = 1.1;
        handles.bloomIntensity.value = useStore.getState().act === 'threshold' ? 0.85 : 0.55;
        gsap.to(handles.whiteout, { value: 0, duration: 0.3, ease: 'power2.out', overwrite: true });
      }
    };
  }, [act, camera]);

  return null;
}
