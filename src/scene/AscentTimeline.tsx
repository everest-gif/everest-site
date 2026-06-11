import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import gsap from 'gsap';
import { useThree } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, HUB_Y } from './handles';
import { beginHubReveal, hubPreGlow } from './HubWorld';

/* Act II (S1) — THE ASCENT. One unbroken shot, zero cuts, no whiteout: the blade draws
   down the ridge, the mountain opens, and the camera climbs THROUGH the gap — the range
   falling away below, fog streaking past the lens, stars rushing — until the hub's sun
   fades up ahead and the system resolves around the destination. The hub hangs at
   HUB_Y directly above the threshold; the whole flight is real world-space travel.
   Camera position/FOV ride monotone-cubic splines — C1-continuous, no tween boundary
   is ever perceptible. Forward 1.8s (open 0.7 / rise 0.8 / arrival 0.3); descent 1.2s. */

const SEAM = { x: 0, y: 4.2, z: -13.4 };
const ROLL_MAX = 0.05; /* ≈2.9° — restraint */
const HOME = { x: 0, y: 2.9, z: 10.5 };

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

/* forward — the J-path: drift to the ridge, thread the gap, climb out and over,
   dock at hub home from below-behind. The spline ends a breath short of the home
   pose with decaying velocity; the rig's exponential settle absorbs the residue —
   the dock reads as one continuous ease-out, never a stop. */
const fwdZ = monotoneCubic(
  [0, 0.35, 0.72, 0.95, 1.2, 1.45, 1.66, 1.75, 1.8],
  [HOME.z, 8.2, 4.6, -8.5, -11.5, -4.0, 6.0, 7.8, 8.0],
);
const fwdY = monotoneCubic(
  [0, 0.35, 0.72, 0.95, 1.2, 1.45, 1.66, 1.75, 1.8],
  [HOME.y, 3.1, 3.7, 6.5, 22, 44, 56, 62.5, 63.5],
);
const fwdF = monotoneCubic([0, 0.35, 0.72, 1.0, 1.35, 1.8], [45, 47, 52, 60, 56, 50.4]);

/* reverse — the descent (1.2s): pull off station, dive past the range as it rises
   to meet the lens, thread back down through the gap, settle home as the seam closes. */
const revZ = monotoneCubic(
  [0, 0.15, 0.35, 0.6, 0.85, 1.02, 1.13, 1.2],
  [8.4, 7.2, -2.5, -11.0, -7.5, 3.0, 8.6, 10.2],
);
const revY = monotoneCubic(
  [0, 0.15, 0.35, 0.6, 0.85, 1.02, 1.13, 1.2],
  [HUB_Y + 0.6, 62.5, 47, 16, 5.6, 3.4, 3.0, 2.92],
);
const revF = monotoneCubic([0, 0.35, 0.8, 1.2], [50, 57, 52, 45.2]);

/* scrub/verification hook — handles are inspectable on preview builds (?scrub=1) */
if (import.meta.env.DEV || window.location.search.includes('scrub')) {
  (window as unknown as Record<string, unknown>).__handles = handles;
}

function resetTransitHandles() {
  handles.seam.value = 0;
  handles.blade.value = 0;
  handles.nearBright.value = 0;
  handles.ascent.value = 0;
  handles.shimmer.value = 0;
  handles.chromaOffset.value = 0;
  handles.thresholdFade.value = 1;
  handles.starFade.value = 1;
}

export default function AscentTimeline() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const act = useStore((s) => s.act);
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (act !== 'breach' && act !== 'reverse-breach') return;
    const store = useStore.getState();

    /* §9.4 — reduced motion: 250ms ink-veil crossfade, no flight */
    if (store.reducedMotion) {
      gsap
        .timeline()
        .to(handles.veil, { value: 1, duration: 0.12, ease: 'power1.in' })
        .call(() => {
          resetTransitHandles();
          if (useStore.getState().act === 'breach') useStore.getState().arriveHub();
          else useStore.getState().arriveThreshold();
        })
        .to(handles.veil, { value: 0, duration: 0.13, ease: 'power1.out' });
      return;
    }

    arrivedRef.current = false;
    const fwd = act === 'breach';
    const look = fwd ? { x: 0, y: 2.1, z: -14 } : { x: 0, y: HUB_Y, z: 0 };
    /* arrival look-blend: 0 = path gaze, 1 = locked on the core */
    const dock = { k: fwd ? 0 : 1 };
    const rig = { roll: 0 };

    const apply = () => {
      const t = tl.time();
      if (arrivedRef.current) return; /* the rig owns the camera once docked */
      if (fwd) {
        camera.position.set(0, fwdY(t), fwdZ(t));
        camera.fov = fwdF(t);
        camera.lookAt(
          look.x * (1 - dock.k),
          look.y * (1 - dock.k) + HUB_Y * dock.k,
          look.z * (1 - dock.k),
        );
      } else {
        camera.position.set(0, revY(t), revZ(t));
        camera.fov = revF(t);
        camera.lookAt(
          look.x * (1 - dock.k),
          look.y * (1 - dock.k) + HUB_Y * dock.k,
          look.z * (1 - dock.k),
        );
      }
      camera.rotateZ(rig.roll);
      /* micro shake ≤0.3px at peak climb — speed you can feel, never see */
      const p = handles.ascent.value;
      if (p > 0.01) {
        const a = 0.0004 * p;
        camera.rotateX(Math.sin(t * 61.7) * a);
        camera.rotateY(Math.sin(t * 47.3 + 1.7) * a);
      }
      camera.updateProjectionMatrix();
    };

    const tl = gsap.timeline({ onUpdate: apply, paused: false });

    if (fwd) {
      /* A — approach (0–0.35): drift toward the ridge, gaze lifts to the crest */
      tl.to(look, { y: SEAM.y, z: SEAM.z, duration: 0.35, ease: 'power2.out' }, 0)
        .to(handles.nearBright, { value: 0.35, duration: 0.35, ease: 'power2.inOut' }, 0)
        /* B — the blade (0.35–0.48): a bone hairline draws down the crest */
        .to(handles.blade, { value: 1, duration: 0.13, ease: 'power2.in' }, 0.35)
        /* C — the split (0.48–0.72): strata part, the wound's edges burn amber */
        .to(handles.seam, { value: 1, duration: 0.24, ease: 'power2.inOut' }, 0.48)
        .to(handles.blade, { value: 0, duration: 0.15, ease: 'power1.out' }, 0.64)
        .to(handles.bloomIntensity, { value: 0.75, duration: 0.2, ease: 'power2.in' }, 0.5)
        .to(handles.nearBright, { value: 0.55, duration: 0.2, ease: 'power1.inOut' }, 0.6)
        /* D — the rise (0.72–1.5): thread the gap pitching up; the range falls away.
           Gaze runs ahead up the climb corridor — the sky is where we are going */
        .to(look, { y: 80, z: -9, duration: 0.5, ease: 'power2.inOut' }, 0.66)
        .to(handles.chromaOffset, { value: 0.0032, duration: 0.12, ease: 'power2.in' }, 0.82)
        .to(handles.chromaOffset, { value: 0, duration: 0.18, ease: 'power2.out' }, 0.96)
        /* pressure-wave shimmer at the moment of clearing the peaks */
        .fromTo(handles.shimmer, { value: 0 }, { value: 1, duration: 0.42, ease: 'none' }, 0.84)
        .set(handles.shimmer, { value: 0 }, 1.28)
        .to(handles.ascent, { value: 1, duration: 0.5, ease: 'power1.inOut' }, 0.7)
        /* the range dims as it falls away — additive crests would otherwise flood
           the lens when the gaze sweeps up the corridor of stacked layers */
        .to(handles.thresholdFade, { value: 0.45, duration: 0.22, ease: 'power1.inOut' }, 0.64)
        .to(handles.thresholdFade, { value: 0, duration: 0.35, ease: 'power1.inOut' }, 0.92)
        .to(handles.nearBright, { value: 0.3, duration: 0.3, ease: 'power1.out' }, 0.9)
        .to(handles.starFade, { value: 0, duration: 0.3, ease: 'power1.inOut' }, 1.3)
        .to(handles.bloomIntensity, { value: 0.55, duration: 0.3, ease: 'power1.out' }, 0.74)
        .to(rig, { roll: ROLL_MAX, duration: 0.55, ease: 'sine.inOut' }, 0.8)
        .to(rig, { roll: 0, duration: 0.42, ease: 'sine.inOut' }, 1.36)
        /* E — arrival (1.5–1.8): the climb eases; the sun fades up ahead, planets
           resolve into their orbits around the destination. A faint pre-glow puts
           the destination in the sky the moment the peaks are cleared. */
        .call(() => hubPreGlow(0.15, 0.3), [], 1.0)
        .call(() => beginHubReveal(), [], 1.38)
        .to(dock, { k: 1, duration: 0.45, ease: 'power2.inOut' }, 1.32)
        .to(handles.ascent, { value: 0, duration: 0.3, ease: 'power1.out' }, 1.48)
        .call(
          () => {
            arrivedRef.current = true;
            resetTransitHandles();
            useStore.getState().arriveHub();
          },
          [],
          1.8,
        );
    } else {
      /* the descent — pull off station, the range rises to meet the lens */
      handles.ascentDir.value = -1;
      tl.to(dock, { k: 0, duration: 0.4, ease: 'power2.inOut' }, 0.05)
        .to(look, { y: 8, z: -12.5, duration: 0.5, ease: 'power2.inOut' }, 0.2)
        .to(handles.ascent, { value: 1, duration: 0.3, ease: 'power2.in' }, 0.12)
        .to(handles.bloomIntensity, { value: 0.6, duration: 0.3, ease: 'power1.inOut' }, 0.1)
        /* the mountain opens to receive — seam parts before the camera reaches it.
           The range stays dimmed through the dive (stacked additive layers seen from
           above would flood the lens); full strength only as the camera levels home */
        .to(handles.seam, { value: 1, duration: 0.25, ease: 'power2.inOut' }, 0.38)
        .set(handles.nearBright, { value: 0.55 }, 0.3)
        .to(handles.thresholdFade, { value: 0.4, duration: 0.3, ease: 'power1.inOut' }, 0.35)
        .to(handles.thresholdFade, { value: 1, duration: 0.28, ease: 'power1.inOut' }, 0.92)
        .to(handles.starFade, { value: 1, duration: 0.3, ease: 'power1.inOut' }, 0.4)
        .to(handles.ascent, { value: 0, duration: 0.3, ease: 'power1.out' }, 0.72)
        .to(look, { y: 2.1, z: -14, duration: 0.35, ease: 'power2.inOut' }, 0.78)
        .to(rig, { roll: -ROLL_MAX * 0.5, duration: 0.4, ease: 'sine.inOut' }, 0.3)
        .to(rig, { roll: 0, duration: 0.35, ease: 'sine.inOut' }, 0.78)
        /* the mountain closes behind us */
        .to(handles.seam, { value: 0, duration: 0.3, ease: 'power2.inOut' }, 0.9)
        .to(handles.nearBright, { value: 0, duration: 0.3, ease: 'power1.out' }, 0.9)
        .to(handles.bloomIntensity, { value: 0.85, duration: 0.35, ease: 'power1.inOut' }, 0.85)
        .call(
          () => {
            arrivedRef.current = true;
            handles.ascentDir.value = 1;
            useStore.getState().arriveThreshold();
          },
          [],
          1.2,
        );
    }

    if (import.meta.env.DEV || window.location.search.includes('scrub')) {
      (window as unknown as Record<string, unknown>).__ascentTl = tl;
    }

    return () => {
      tl.kill();
      if (!arrivedRef.current) {
        /* aborted mid-flight (skip intro / history nav) — leave no transit residue */
        resetTransitHandles();
        handles.ascentDir.value = 1;
        handles.veil.value = 0;
        handles.bloomIntensity.value = useStore.getState().act === 'threshold' ? 0.85 : 0.55;
      }
    };
  }, [act, camera]);

  return null;
}
