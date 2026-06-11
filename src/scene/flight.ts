import * as THREE from 'three';
import gsap from 'gsap';
import type { NodeId } from '../state/store';
import { nodeWorld, nodeRadius, HUB_Y } from './handles';

/* R3/S4 — travel. Click flies the camera to the planet (~0.95s curved path); hops are
   a SINGLE DIRECT DOLLY ARC between bodies (~1.1s) — no zoom-out to the hub overview,
   the system sweeps past in parallax. After landing the rig tracks the planet live
   ('track'), so it keeps orbiting and breathing as the chamber hero. */

export const flightState = {
  mode: 'idle' as 'idle' | 'fly' | 'track',
  kind: 'in' as 'in' | 'hop',
  u: 0,
  from: new THREE.Vector3(),
  fromLook: new THREE.Vector3(),
  ctrl: new THREE.Vector3(),
};

export const FLY_IN_S = 0.95;
export const FLY_HOP_S = 1.1;
/* the incoming chamber materializes over the arc's final beat (S4) */
export const HOP_REVEAL_S = 0.42;

const _core = new THREE.Vector3(0, HUB_Y, 0);
const _out = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _fwd = new THREE.Vector3();

/* chamber framing: camera core-side + viewer-side of the planet looking outward, so the
   system stays behind the lens and the right side is clean space for content.
   S5 gutter law: the planet's visual body stays inside the left 38vw — the look
   offset and distance are tuned so limb ≤ 38vw with the column starting at 42vw. */
/* per-chamber framing distance — dolomite reads "the planet large" (M7 radar spread) */
const DIST_K: Partial<Record<NodeId, number>> = { dolomite: 4.6, bigback: 6.0 };
/* look-right offset ≈ planet center at NDC −K → center ~24vw; larger or laggier
   bodies sit further left so their limb holds inside the zone while the camera
   tracks the live orbit */
const LOOK_K: Partial<Record<NodeId, number>> = { dolomite: 0.56, emerge: 0.58, bigback: 0.58 };
const LOOK_K_DEFAULT = 0.52;

export function chamberCam(
  id: NodeId,
  camera: THREE.PerspectiveCamera,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
): boolean {
  const p = nodeWorld[id];
  if (!p) return false;
  const r = nodeRadius[id] ?? 0.16;
  const portrait = camera.aspect < 0.9;
  const dist = r * (portrait ? 7.2 : DIST_K[id] ?? 5.4);
  _out.copy(p).sub(_core);
  _out.z = 0;
  if (_out.lengthSq() < 1e-6) _out.set(1, 0, 0);
  _out.normalize();
  outPos
    .copy(p)
    .addScaledVector(_out, -dist * 0.42)
    .add(_mid.set(0, dist * 0.16, dist * 0.92));
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  _fwd.copy(p).sub(outPos).normalize();
  if (portrait) {
    /* M7 mobile — the planet is a ~30vh header medallion: top-center */
    outLook.copy(p);
    outLook.y -= tanV * dist * 0.55;
    return true;
  }
  /* push the look right of the planet → planet anchors the left zone (S5: body
     within 33–38vw, a hard ≥6vw gutter before the content column at 42vw) */
  _mid.crossVectors(_fwd, _out.set(0, 1, 0)).normalize(); /* camera-right */
  outLook
    .copy(p)
    .addScaledVector(_mid, tanH * dist * (LOOK_K[id] ?? LOOK_K_DEFAULT))
    .y -= tanV * dist * 0.07;
  return true;
}

let tween: gsap.core.Tween | null = null;
const _bow = new THREE.Vector3();

export function beginFlight(kind: 'in' | 'hop', camera: THREE.PerspectiveCamera, destId?: NodeId) {
  tween?.kill();
  const f = flightState;
  f.kind = kind;
  f.mode = 'fly';
  f.u = 0;
  f.from.copy(camera.position);
  camera.getWorldDirection(_fwd);
  f.fromLook.copy(camera.position).addScaledVector(_fwd, 8);
  if (kind === 'hop' && destId && nodeWorld[destId]) {
    /* S4 — direct dolly arc: midpoint of the two bodies, bowed outward from the
       core and a touch toward the lens. No intermediate hub overview. When the
       two bodies sit near-opposite, the midpoint falls toward the sun — the bow
       grows so the curve always clears the corona. */
    _mid.copy(f.from).add(nodeWorld[destId]).multiplyScalar(0.5);
    _bow.copy(_mid).sub(_core);
    _bow.z = 0;
    const md = _bow.length();
    if (md < 1e-3) _bow.set(1, 0, 0);
    else _bow.divideScalar(md);
    f.ctrl.copy(_mid).addScaledVector(_bow, Math.max(1.3, 3.4 - md)).add(_out.set(0, 0.2, 1.4));
  } else if (kind === 'hop') {
    f.ctrl.copy(_core).add(_mid.set(0, 0.4, 3.1));
  } else {
    f.ctrl.copy(f.from).lerp(_core, 0.45).add(_mid.set(0, 0.5, 1.6));
  }
  tween = gsap.to(f, {
    u: 1,
    duration: kind === 'hop' ? FLY_HOP_S : FLY_IN_S,
    ease: 'power2.inOut',
    onComplete: () => {
      f.mode = 'track';
    },
  });
}

export function endFlight() {
  tween?.kill();
  tween = null;
  flightState.mode = 'idle';
  flightState.u = 0;
}

/* quadratic bezier into out */
export function quadBez(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, u: number, out: THREE.Vector3) {
  const w = 1 - u;
  out.set(
    w * w * a.x + 2 * w * u * c.x + u * u * b.x,
    w * w * a.y + 2 * w * u * c.y + u * u * b.y,
    w * w * a.z + 2 * w * u * c.z + u * u * b.z,
  );
  return out;
}
