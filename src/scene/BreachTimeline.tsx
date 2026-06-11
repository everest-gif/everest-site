import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import gsap from 'gsap';
import { useThree } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, HUB_Y, TUNNEL_Y } from './handles';

/* Act II — one master timeline drives camera + uniforms. No setTimeout chains (§2). */

const SEAM = { x: 0, y: 4.2, z: -13.4 };
const ROLL_MAX = 0.105; /* ≈6° */

interface Rig {
  px: number;
  py: number;
  pz: number;
  lx: number;
  ly: number;
  lz: number;
  fov: number;
  roll: number;
}

function resetTransitHandles() {
  handles.seam.value = 0;
  handles.nearBright.value = 0;
  handles.tunnelProgress.value = 0;
  handles.tunnelLight.value = 0;
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
      if (act === 'breach') store.arriveHub();
      else store.arriveThreshold();
      return;
    }

    arrivedRef.current = false;
    const rig: Rig = {
      px: camera.position.x,
      py: camera.position.y,
      pz: camera.position.z,
      lx: 0,
      ly: act === 'breach' ? 3.2 : HUB_Y,
      lz: act === 'breach' ? -14 : 0,
      fov: camera.fov,
      roll: 0,
    };
    const apply = () => {
      camera.position.set(rig.px, rig.py, rig.pz);
      camera.lookAt(rig.lx, rig.ly, rig.lz);
      camera.rotateZ(rig.roll);
      camera.fov = rig.fov;
      camera.updateProjectionMatrix();
    };

    const tl = gsap.timeline({ onUpdate: apply, paused: false });

    if (act === 'breach') {
      /* 1 — approach (0–0.8s): accelerate at the ridgeline, FOV 45→70, walls brighten */
      tl.to(rig, { pz: -7.2, py: 3.5, duration: 0.8, ease: 'power3.in' }, 0)
        .to(rig, { lx: SEAM.x, ly: SEAM.y, lz: SEAM.z, duration: 0.8, ease: 'power2.out' }, 0)
        .to(rig, { fov: 70, duration: 0.8, ease: 'power2.in' }, 0)
        .to(handles.nearBright, { value: 1, duration: 0.75, ease: 'power2.in' }, 0)
        /* 2 — the seam (0.8–1.3s): the mountain opens */
        .to(handles.seam, { value: 1, duration: 0.5, ease: 'power3.in' }, 0.8)
        .to(handles.bloomIntensity, { value: 1.15, duration: 0.5, ease: 'power2.in' }, 0.8)
        .to(rig, { pz: -11.4, py: 4.0, duration: 0.5, ease: 'power2.in' }, 0.8)
        /* flash masks the cut into the tunnel */
        .to(handles.whiteout, { value: 0.6, duration: 0.13, ease: 'power3.in' }, 1.17)
        .set(rig, { px: 0, py: TUNNEL_Y, pz: 6.5, lx: 0, ly: TUNNEL_Y, lz: -40, fov: 70, roll: 0 }, 1.3)
        .to(handles.whiteout, { value: 0, duration: 0.25, ease: 'power2.out' }, 1.32)
        /* 3 — the wormhole (1.3–2.7s): transmitted, not falling */
        .to(handles.tunnelLight, { value: 1, duration: 0.35, ease: 'power1.out' }, 1.3)
        .to(handles.tunnelProgress, { value: 1, duration: 1.4, ease: 'power1.in' }, 1.3)
        .to(rig, { pz: -42, duration: 1.42, ease: 'power2.in' }, 1.3)
        .to(rig, { fov: 95, duration: 1.2, ease: 'power1.inOut' }, 1.42)
        .to(rig, { roll: ROLL_MAX, duration: 1.35, ease: 'sine.inOut' }, 1.32)
        .to(handles.chromaOffset, { value: 0.011, duration: 1.2, ease: 'power2.in' }, 1.45)
        .to(handles.bloomIntensity, { value: 1.5, duration: 1.2, ease: 'power1.in' }, 1.45)
        /* 4 — arrival (2.7–3.2s): light converges → amber whiteout → contracts into the hub core */
        .to(handles.whiteout, { value: 1, duration: 0.3, ease: 'power3.in' }, 2.68)
        .call(
          () => {
            arrivedRef.current = true;
            camera.position.set(0, HUB_Y + 0.6, 8.4);
            camera.lookAt(0, HUB_Y, 0);
            camera.fov = 50;
            camera.updateProjectionMatrix();
            resetTransitHandles();
            /* detached arrival fade — survives this timeline's teardown */
            gsap.timeline()
              .to(handles.whiteout, { value: 0, duration: 0.5, ease: 'power2.out' }, 0.04)
              .to(handles.bloomIntensity, { value: 0.55, duration: 0.5, ease: 'power1.out' }, 0);
            useStore.getState().arriveHub();
          },
          [],
          3.0,
        );
    } else {
      /* reverse breach — 1.4s compressed: back out through the seam */
      tl.to(handles.whiteout, { value: 0.85, duration: 0.15, ease: 'power3.in' }, 0)
        .set(rig, { px: 0, py: TUNNEL_Y, pz: -42, lx: 0, ly: TUNNEL_Y, lz: -90, fov: 92, roll: -ROLL_MAX * 0.6 }, 0.15)
        .set(handles.tunnelProgress, { value: 1 }, 0.15)
        .set(handles.tunnelLight, { value: 1 }, 0.15)
        .to(handles.whiteout, { value: 0, duration: 0.2, ease: 'power2.out' }, 0.17)
        .to(handles.chromaOffset, { value: 0.008, duration: 0.2 }, 0.17)
        .to(rig, { pz: 6.5, duration: 0.7, ease: 'power2.inOut' }, 0.15)
        .to(handles.tunnelProgress, { value: 0, duration: 0.7, ease: 'power1.out' }, 0.15)
        .to(rig, { fov: 70, duration: 0.7, ease: 'power1.out' }, 0.15)
        .to(rig, { roll: 0, duration: 0.6 }, 0.2)
        .to(handles.whiteout, { value: 0.6, duration: 0.1, ease: 'power3.in' }, 0.85)
        .set(rig, { px: 0, py: 4.0, pz: -11.4, lx: SEAM.x, ly: SEAM.y, lz: SEAM.z, fov: 70, roll: 0 }, 0.95)
        .set(handles.seam, { value: 1 }, 0.95)
        .set(handles.nearBright, { value: 1 }, 0.95)
        .set(handles.tunnelLight, { value: 0 }, 0.95)
        .set(handles.chromaOffset, { value: 0 }, 0.95)
        .to(handles.whiteout, { value: 0, duration: 0.2, ease: 'power2.out' }, 0.97)
        .to(rig, { px: 0, py: 2.9, pz: 10.5, duration: 0.45, ease: 'power2.out' }, 0.95)
        .to(rig, { lx: 0, ly: 2.1, lz: -14, duration: 0.45, ease: 'power2.out' }, 0.95)
        .to(rig, { fov: 45, duration: 0.45, ease: 'power2.out' }, 0.95)
        .to(handles.seam, { value: 0, duration: 0.4, ease: 'power2.out' }, 1.0)
        .to(handles.nearBright, { value: 0, duration: 0.4 }, 1.0)
        .call(
          () => {
            arrivedRef.current = true;
            useStore.getState().arriveThreshold();
          },
          [],
          1.4,
        );
    }

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__breachTl = tl;
    }

    return () => {
      tl.kill();
      if (!arrivedRef.current) {
        /* aborted mid-flight (skip intro / history nav) — leave no transit residue */
        resetTransitHandles();
        handles.bloomIntensity.value = 0.55;
        gsap.to(handles.whiteout, { value: 0, duration: 0.3, ease: 'power2.out', overwrite: true });
      }
    };
  }, [act, camera]);

  return null;
}
