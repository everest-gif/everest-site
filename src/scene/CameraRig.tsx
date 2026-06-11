import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, HUB_Y } from './handles';
import { flightState, chamberCam, quadBez } from './flight';

/* Camera homes per stable act. The breach timelines own the camera during transit. */
const HOMES = {
  threshold: { pos: new THREE.Vector3(0, 2.9, 10.5), look: new THREE.Vector3(0, 2.1, -14), fov: 45 },
  hub: { pos: new THREE.Vector3(0, HUB_Y + 0.6, 8.4), look: new THREE.Vector3(0, HUB_Y, 0), fov: 50 },
};

const MAX_YAW = THREE.MathUtils.degToRad(1.5);
const MAX_PITCH = THREE.MathUtils.degToRad(1.0);
/* R2.3 explorability — drag orbits the system ±12°, springs back slowly */
const MAX_ORBIT = THREE.MathUtils.degToRad(12);

/* preallocated scratch — no per-frame allocation */
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _center = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _xAxis = new THREE.Vector3(1, 0, 0);
const _cPos = new THREE.Vector3();
const _cLook = new THREE.Vector3();
const _curLook = new THREE.Vector3(0, HUB_Y, 0);

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const target = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const drift = useRef(0);
  const hasPointer = useRef(false);
  const orbit = useRef({ yaw: 0, pitch: 0, tYaw: 0, tPitch: 0, dragging: false, lastX: 0, lastY: 0 });
  useEffect(() => {
    if (import.meta.env.DEV || window.location.search.includes('scrub')) {
      (window as unknown as Record<string, unknown>).__orbit = orbit.current;
    }
  }, []);

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

  /* drag-orbit — hub only, inert for reduced motion; lean around the system */
  useEffect(() => {
    const down = (e: PointerEvent) => {
      const st = useStore.getState();
      if (st.act !== 'hub' || st.reducedMotion) return;
      if ((e.target as HTMLElement).closest('button, a')) return;
      orbit.current.dragging = true;
      orbit.current.lastX = e.clientX;
      orbit.current.lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      const o = orbit.current;
      if (!o.dragging) return;
      o.tYaw = THREE.MathUtils.clamp(o.tYaw + (e.clientX - o.lastX) * 0.0016, -MAX_ORBIT, MAX_ORBIT);
      o.tPitch = THREE.MathUtils.clamp(o.tPitch + (e.clientY - o.lastY) * 0.0014, -MAX_ORBIT * 0.85, MAX_ORBIT * 0.85);
      o.lastX = e.clientX;
      o.lastY = e.clientY;
    };
    const up = () => {
      orbit.current.dragging = false;
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  useFrame((_, dt) => {
    const { act, chamber, reducedMotion } = useStore.getState();
    if (act === 'breach' || act === 'reverse-breach') return; // timeline owns the camera

    /* R3 — chamber: the camera flies to and then tracks the live planet */
    if (act === 'chamber' && chamber && chamberCam(chamber, camera, _cPos, _cLook)) {
      if (flightState.mode === 'fly' && !reducedMotion) {
        quadBez(flightState.from, flightState.ctrl, _cPos, flightState.u, _pos);
        _look.lerpVectors(flightState.fromLook, _cLook, flightState.u);
        /* S4 — direct hops breathe the lens only slightly: travel, never zoom-out */
        const widen = flightState.kind === 'hop' ? 5 : 4;
        camera.fov = HOMES.hub.fov + Math.sin(flightState.u * Math.PI) * widen;
      } else {
        const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 6);
        _pos.copy(camera.position).lerp(_cPos, k);
        _look.copy(_curLook).lerp(_cLook, k);
        camera.fov += (HOMES.hub.fov - camera.fov) * k;
      }
      camera.position.copy(_pos);
      _curLook.copy(_look);
      camera.lookAt(_look);
      camera.updateProjectionMatrix();
      return;
    }

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

    /* drag-orbit around the hub center — eased while dragging, slow spring back at rest */
    const o = orbit.current;
    if (!o.dragging) {
      const back = 1 - Math.exp(-dt * 1.1);
      o.tYaw += (0 - o.tYaw) * back;
      o.tPitch += (0 - o.tPitch) * back;
    }
    const ok = 1 - Math.exp(-dt * 9);
    o.yaw += (o.tYaw - o.yaw) * ok;
    o.pitch += (o.tPitch - o.pitch) * ok;
    if (act === 'hub' && Math.abs(o.yaw) + Math.abs(o.pitch) > 0.0001) {
      _center.copy(home.look);
      _pos.sub(_center).applyAxisAngle(_yAxis, o.yaw).applyAxisAngle(_xAxis, o.pitch).add(_center);
    }

    /* settle toward home (covers act switches without a timeline, e.g. skip intro,
       and the fly-back-out after a chamber closes) */
    const settle = 1 - Math.exp(-dt * 4.5);
    camera.position.lerp(_pos, settle);
    camera.fov += (home.fov - camera.fov) * settle;
    camera.updateProjectionMatrix();
    _curLook.lerp(_look, settle);
    camera.lookAt(act === 'hub' ? _curLook : _look);
  });

  return null;
}
