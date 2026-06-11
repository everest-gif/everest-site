import * as THREE from 'three';
import type { PlanetBuild } from './types';

/* LUVEN AI — "a line that always answers."
   Warm amber sphere (soft wrap-lambert + gentle fresnel) — the warmest body in
   the system — with one slowly sweeping radar ring in the equatorial plane and
   a periodic tick-pulse: a thin ring expanding from the surface, a call answered.

   Budget: sphere 32×20 (1280 tris) + annulus 96×1 (192 tris) = 2 draw calls. */

const TWO_PI = Math.PI * 2;

const SPHERE_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const SPHERE_FRAG = /* glsl */ `
uniform float uBright;
varying vec3 vN;
varying vec3 vV;
const vec3 AMBER = vec3(0.910, 0.635, 0.239);
const vec3 BONE  = vec3(0.929, 0.910, 0.875);
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  /* fixed view-space key light: lit face always reads toward the camera */
  vec3 l = normalize(vec3(0.55, 0.62, 0.56));
  float w = clamp(dot(n, l) * 0.62 + 0.38, 0.0, 1.0); /* soft wrap lambert */
  float hot = w * w;
  vec3 lit = mix(AMBER * 0.92, mix(AMBER, BONE, 0.30) * 1.16, hot);
  vec3 col = mix(AMBER * 0.05, lit, w);
  float f = 1.0 - clamp(dot(n, v), 0.0, 1.0);
  col += AMBER * (f * f * 0.42); /* gentle fresnel rim */
  col *= uBright;
  gl_FragColor = vec4(col, 1.0);
}
`;

const RING_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RING_FRAG = /* glsl */ `
uniform float uSweep;
uniform float uTickR;
uniform float uTickA;
uniform float uEnergy;
uniform float uBeam;
varying vec2 vP;
const vec3 AMBER = vec3(0.910, 0.635, 0.239);
const vec3 BONE  = vec3(0.929, 0.910, 0.875);
const float TWO_PI = 6.28318530718;
void main() {
  float r = length(vP); /* geometry inner radius 0.58 — r never 0 */
  float ang = atan(vP.y, vP.x);

  /* faint full-circle hairline at r = 0.95 */
  float dh = (r - 0.95) / 0.014;
  float hair = exp(-dh * dh) * 0.16;

  /* radar beam: bright head at uSweep, soft exponential trail behind (~30deg) */
  float delta = mod(uSweep - ang, TWO_PI); /* 0 at head, grows behind */
  float trail = exp(-delta * 5.2);
  float head  = exp(-delta * delta * 60.0);
  float db = (r - 0.95) / 0.05;
  float band = exp(-db * db);
  float beam = band * (trail * 0.6 + head * 0.7) * uBeam;

  /* tick-pulse: thin ring expanding from the surface — a call answered */
  float dtk = (r - uTickR) / 0.022;
  float tick = exp(-dtk * dtk) * uTickA * 0.9;

  float e = (hair + beam + tick) * uEnergy;
  vec3 col = mix(AMBER, BONE, clamp(head * 0.55 + tick * 0.25, 0.0, 1.0));
  gl_FragColor = vec4(col * e, clamp(e, 0.0, 1.0));
}
`;

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();

  /* tilted assembly so the equatorial ring reads as an ellipse, not a line */
  const tilt = new THREE.Group();
  tilt.rotation.set(0.5, 0, 0.15);
  group.add(tilt);

  const sphereUniforms = {
    uBright: { value: 1 },
  };
  const sphereGeo = new THREE.SphereGeometry(0.62, 32, 20);
  const sphereMat = new THREE.ShaderMaterial({
    vertexShader: SPHERE_VERT,
    fragmentShader: SPHERE_FRAG,
    uniforms: sphereUniforms,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  tilt.add(sphere);

  const ringUniforms = {
    uSweep: { value: 0 },
    uTickR: { value: 0.64 },
    uTickA: { value: 0 },
    uEnergy: { value: 1 },
    uBeam: { value: 0.8 },
  };
  const ringGeo = new THREE.RingGeometry(0.58, 1.0, 96, 1);
  const ringMat = new THREE.ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    uniforms: ringUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2; /* into the equatorial plane */
  tilt.add(ring);

  let sweep = 0;
  let tickTimer = 0;

  const update = (
    _t: number,
    dt: number,
    active: number,
    dim: number,
    reveal: number,
  ): void => {
    const step = Math.min(Math.max(dt, 0), 0.1); /* guard tab-switch spikes */

    /* sweep: slow at rest, x3 when active */
    sweep += step * 0.55 * (1 + 2 * active);
    if (sweep > TWO_PI) sweep -= TWO_PI;
    ringUniforms.uSweep.value = sweep;

    /* tick-pulse: every ~3.5s at rest, ~1.2s when active */
    const period = 3.5 - 2.3 * active;
    tickTimer += step;
    if (tickTimer >= period) tickTimer %= period;
    const dur = 1.05 - 0.5 * active;
    const p = Math.min(tickTimer / dur, 1);
    const inv = 1 - p;
    const ease = 1 - inv * inv * inv; /* easeOutCubic */
    ringUniforms.uTickR.value = 0.64 + 0.36 * ease;
    ringUniforms.uTickA.value = inv * inv;

    const dimF = 1 - 0.6 * dim; /* toward 40% when another node is hovered */
    const energy = dimF * reveal;
    ringUniforms.uEnergy.value = energy;
    ringUniforms.uBeam.value = 0.8 + 0.35 * active;
    sphereUniforms.uBright.value = (1 + 0.16 * active) * energy;
  };

  const dispose = (): void => {
    sphereGeo.dispose();
    sphereMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
  };

  return { group, update, baseScale: 1, dispose };
}
