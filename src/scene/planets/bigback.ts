import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';

/* BIGBACK — AI fitness on the bench; a rep counter.
   The most restrained body in the system: a dark matte sphere a hair above ink,
   with the slightest bone fresnel. One thin amber arc on a vertical great circle
   fills 0°→360° over ~6s, holds a beat, resets. One rep after another, patiently.
   2 draw calls, ~2800 tris, no particles, no textures. */

const FILL_DURATION = 6.0; // seconds per rep at rest
const HOLD = 0.9; // beat at the top of the rep
const PERIOD = FILL_DURATION + HOLD;
const PULSE_DECAY = 4.5; // 1/s exponential decay of the completion pulse
const MAX_DT = 0.05; // tab-refocus spike guard

const BODY_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal); // uniform scale only (HubWorld contract)
  vV = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const BODY_FRAG = /* glsl */ `
uniform float uActive;
uniform float uDim;
uniform float uReveal;
uniform vec3 uBone;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float ndv = max(dot(n, v), 0.0);
  float fres = 1.0 - ndv;
  fres = fres * fres * fres; // cubic falloff, base clamped >= 0 — no pow
  // soft key from upper left so the matte form reads as a sphere, not a disc
  float form = max(dot(n, normalize(vec3(-0.42, 0.78, 0.46))), 0.0);
  vec3 base = vec3(0.0080, 0.0080, 0.0102); // a hair above ink, same hue
  vec3 col = base * (0.6 + 0.9 * form) + uBone * fres * (0.10 + 0.04 * uActive);
  col *= mix(1.0, 0.4, uDim) * uReveal;
  gl_FragColor = vec4(col, 1.0);
}
`;

const ARC_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* TorusGeometry uv.x runs 0..1 around the great circle (CCW from +X).
   The mesh is rotated +90° about Z so u=0 sits at the top; angle = 1.0 - uv.x
   makes the fill run clockwise from 12 o'clock — a dial, a rep. */
const ARC_FRAG = /* glsl */ `
uniform float uFill;   // 0..1 fill fraction; pushed to 1.02 during the hold to bury the seam
uniform float uPulse;  // completion pulse 0..1
uniform float uActive;
uniform float uDim;
uniform float uReveal;
uniform vec3 uAmber;
uniform vec3 uBone;
varying vec2 vUv;
void main() {
  float a = 1.0 - vUv.x;
  // visible where a <= uFill, soft edge at the front (edges strictly increasing)
  float mask = 1.0 - smoothstep(uFill - 0.004, uFill + 0.004, a);
  // suppress the single-pixel dot at the instant of reset
  float startFade = smoothstep(0.0, 0.02, uFill);
  // fill head: gaussian at the front — symmetric, safe, never NaN
  float d = uFill - a;
  float head = exp(-d * d * 1400.0);
  float intensity = (0.8 + 0.65 * head) * (1.0 + 0.35 * uPulse) * (1.0 + 0.15 * uActive);
  intensity = min(intensity, 1.6); // bloom discipline
  vec3 col = mix(uAmber, uBone, head * 0.35) * intensity;
  float alpha = mask * startFade * mix(1.0, 0.4, uDim) * uReveal;
  gl_FragColor = vec4(col, alpha);
}
`;

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();

  /* body — dark matte sphere, r 0.8 */
  const bodyGeo = new THREE.SphereGeometry(0.8, 36, 24);
  const bodyMat = new THREE.ShaderMaterial({
    vertexShader: BODY_VERT,
    fragmentShader: BODY_FRAG,
    uniforms: {
      uActive: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uBone: { value: new THREE.Color(PALETTE.bone) },
    },
    transparent: false,
    depthWrite: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  /* meridian progress arc — full thin torus, alpha-masked by angle vs uFill */
  /* tube 0.05: at NODE_R×baseScale the 0.018 brief value was sub-pixel — the identity vanished */
  const arcGeo = new THREE.TorusGeometry(0.92, 0.05, 6, 96);
  const arcMat = new THREE.ShaderMaterial({
    vertexShader: ARC_VERT,
    fragmentShader: ARC_FRAG,
    uniforms: {
      uFill: { value: 0 },
      uPulse: { value: 0 },
      uActive: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uAmber: { value: new THREE.Color(PALETTE.amber) },
      uBone: { value: new THREE.Color(PALETTE.bone) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const arc = new THREE.Mesh(arcGeo, arcMat);
  arc.rotation.z = Math.PI / 2; // torus u=0 → 12 o'clock
  group.add(arc);

  /* rep state */
  let phase = 0;
  let pulse = 0;

  const bodyU = bodyMat.uniforms;
  const arcU = arcMat.uniforms;

  const update = (t: number, dt: number, active: number, dim: number, reveal: number): void => {
    const step = Math.min(dt, MAX_DT);
    const prev = phase;
    phase += step * (1.0 + 1.5 * active); // active: ×2.5 rep tempo
    if (phase >= PERIOD) phase -= PERIOD;

    // completion — rep locked out; brief bright pulse (full when active)
    if (prev < FILL_DURATION && phase >= FILL_DURATION) {
      pulse = 0.25 + 0.75 * active;
    }
    pulse *= Math.exp(-step * PULSE_DECAY);

    // linear fill = constant bar speed; held past 1 to bury the seam at 12 o'clock
    const fill = phase >= FILL_DURATION ? 1.02 : phase / FILL_DURATION;

    // slow yaw sway — enough to read as a sphere, never edge-on
    group.rotation.y = Math.sin(t * 0.12) * 0.28;

    arcU.uFill.value = fill;
    arcU.uPulse.value = pulse;
    arcU.uActive.value = active;
    arcU.uDim.value = dim;
    arcU.uReveal.value = reveal;
    bodyU.uActive.value = active;
    bodyU.uDim.value = dim;
    bodyU.uReveal.value = reveal;
  };

  const dispose = (): void => {
    bodyGeo.dispose();
    arcGeo.dispose();
    bodyMat.dispose();
    arcMat.dispose();
  };

  return { group, update, baseScale: 0.8, dispose };
}
