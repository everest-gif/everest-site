import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, HUB_Y } from './handles';
import { chamberFocus } from '../chambers/control';

/* Camera homes per stable act. The breach timelines own the camera during transit. */
const HOMES = {
  threshold: { pos: new THREE.Vector3(0, 2.9, 10.5), look: new THREE.Vector3(0, 2.1, -14), fov: 45 },
  hub: { pos: new THREE.Vector3(0, HUB_Y + 0.6, 8.4), look: new THREE.Vector3(0, HUB_Y, 0), fov: 50 },
};

const MAX_YAW = THREE.MathUtils.degToRad(1.5);
const MAX_PITCH = THREE.MathUtils.degToRad(1.0);

/* preallocated scratch — no per-frame allocation */
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _offset = new THREE.Vector3();

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const target = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const drift = useRef(0);
  const hasPointer = useRef(false);

  useEffect(() => {
    handles.camera = camera;
  }, [camera]);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMouse = (e: MouseEvent) => {
      hasPointer.current = true;
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      hasPointer.current = true;
      target.current.x = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
      target.current.y = THREE.MathUtils.clamp((e.beta - 40) / 30, -1, 1);
    };
    if (fine) window.addEventListener('mousemove', onMouse, { passive: true });
    else if ('DeviceOrientationEvent' in window) window.addEventListener('deviceorientation', onTilt);
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('deviceorientation', onTilt);
    };
  }, []);

  useFrame((_, dt) => {
    const { act, reducedMotion } = useStore.getState();
    if (act === 'breach' || act === 'reverse-breach') return; // timeline owns the camera

    const home = act === 'hub' || act === 'chamber' ? HOMES.hub : HOMES.threshold;

    /* autonomous drift when no pointer signal (touch without tilt) */
    if (!hasPointer.current && !reducedMotion) {
      drift.current += dt;
      target.current.x = Math.sin(drift.current * 0.13) * 0.45;
      target.current.y = Math.cos(drift.current * 0.09) * 0.3;
    }

    const k = 1 - Math.exp(-dt * 3.2);
    const amp = reducedMotion ? 0 : 1;
    cur.current.x += (target.current.x - cur.current.x) * k;
    cur.current.y += (target.current.y - cur.current.y) * k;

    const dist = home.pos.distanceTo(home.look);
    _offset.set(
      Math.sin(cur.current.x * MAX_YAW) * dist * amp,
      -Math.sin(cur.current.y * MAX_PITCH) * dist * amp * 0.7,
      0,
    );
    _pos.copy(home.pos).add(_offset);
    _look.copy(home.look);

    /* chamber handoff (§2 Act IV.2): camera pushes toward the opened node */
    if (act === 'chamber' && chamberFocus.id) {
      _pos.x += chamberFocus.localX * 0.16;
      _pos.y += chamberFocus.localY * 0.16;
      _pos.z -= 1.1;
      _look.x += chamberFocus.localX * 0.3;
      _look.y += chamberFocus.localY * 0.3;
    }

    /* settle toward home (covers act switches without a timeline, e.g. skip intro) */
    const settle = 1 - Math.exp(-dt * 4.5);
    camera.position.lerp(_pos, settle);
    camera.fov += (home.fov - camera.fov) * settle;
    camera.updateProjectionMatrix();
    camera.lookAt(_look);
  });

  return null;
}
