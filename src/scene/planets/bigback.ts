import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';
import { makeAtmosphere, gateHero } from './hero';

/* BIGBACK — AI fitness on the bench; a rep counter.
   The most restrained body in the system: a dark matte sphere a hair above ink,
   with the slightest bone fresnel. One thin amber arc on a vertical great circle
   fills 0°→360° over ~6s, holds a beat, resets. One rep after another, patiently.
   2 draw calls in the hub, +2 at hero (atmosphere, heat shimmer); no particles, no textures. */

const FILL_DURATION = 6.0; // seconds per rep at rest
const HOLD = 0.9; // beat at the top of the rep
const PERIOD = FILL_DURATION + HOLD;
const PULSE_DECAY = 4.5; // 1/s exponential decay of the completion pulse
const MAX_DT = 0.05; // tab-refocus spike guard

const BODY_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vO; // object-space normal — the weave is bonded to the surface, not the view
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal); // uniform scale only (HubWorld contract)
  vV = cameraPosition - wp.xyz;
  vO = normal;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const BODY_FRAG = /* glsl */ `
uniform float uActive;
uniform float uDim;
uniform float uReveal;
uniform float uHero;
uniform vec3 uBone;
varying vec3 vN;
varying vec3 vV;
varying vec3 vO;
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

  /* S6 hero — fine carbon twill: two crossing diagonal micro-band sets on skewed
     surface coordinates, tow value alternating like a weave; reads on the face,
     fades at the limb where the bands would alias */
  if (uHero > 0.001) {
    vec3 o = normalize(vO);
    float c1 = (o.x + o.y) * 14.0;
    float c2 = (o.x - o.y) * 14.0;
    float t1 = fract(c1) - 0.5;
    float t2 = fract(c2) - 0.5;
    float w1 = exp(-t1 * t1 * 110.0) * mix(0.45, 1.0, step(0.5, fract(c2 * 0.5)));
    float w2 = exp(-t2 * t2 * 110.0) * mix(0.45, 1.0, step(0.5, fract(c1 * 0.5)));
    float face = ndv * ndv;
    col += uBone * (w1 + w2) * face * 0.020 * uHero;
    // broad satin sheen tracking the view angle — matte, never a glint
    float s = 1.0 - ndv;
    col += uBone * exp(-s * s * 5.0) * 0.035 * uHero;
  }

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
uniform float uHero;
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
  intensity *= 1.0 + 0.6 * uHero; // S6 — the arc burns hotter at chamber range
  vec3 col = mix(uAmber, uBone, head * 0.35) * intensity;
  float alpha = mask * startFade * mix(1.0, 0.4, uDim) * uReveal;
  gl_FragColor = vec4(col, alpha);
}
`;

/* S6 hero — heat shimmer: a wider torus shell hugging the arc, additive and faint.
   A thin band at the outer rim of the tube flickers with slow value-noise turbulence
   drifting off the arc — refraction haze, never a sin strobe. Hero-gated: invisible
   (zero draw calls) in the hub. */
const SHIMMER_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SHIMMER_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFill;
uniform float uHero;
uniform float uDim;
uniform float uReveal;
uniform vec3 uAmber;
uniform vec3 uBone;
varying vec2 vUv;
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  float a = 1.0 - vUv.x;
  // shimmer only over the burning span of the arc
  float mask = 1.0 - smoothstep(uFill - 0.01, uFill + 0.01, a);
  float startFade = smoothstep(0.0, 0.04, uFill);
  // thin band at the outer rim of the tube — heat sits just above the arc
  float d = min(vUv.y, 1.0 - vUv.y);
  float band = exp(-d * d * 70.0);
  // fine striations along the arc, slow turbulence rising off the rim
  float n = vnoise(vec2(vUv.x * 56.0, d * 6.0 + uTime * 0.5));
  n = 0.62 * n + 0.38 * vnoise(vec2(vUv.x * 113.0 + 7.3, d * 11.0 + uTime * 0.85));
  float flicker = smoothstep(0.34, 0.86, n);
  float alpha = band * mask * startFade * flicker * 0.24 * uHero
    * mix(1.0, 0.4, uDim) * uReveal;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(mix(uAmber, uBone, 0.2), alpha);
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
      uHero: { value: 0 },
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
      uHero: { value: 0 },
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

  /* S6 hero — heat-shimmer shell on the same great circle, tube wide enough to
     hold haze above the arc; built now so the boot precompiler owns the compile */
  const shimmerGeo = new THREE.TorusGeometry(0.92, 0.1, 8, 96);
  const shimmerMat = new THREE.ShaderMaterial({
    vertexShader: SHIMMER_VERT,
    fragmentShader: SHIMMER_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uFill: { value: 0 },
      uHero: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uAmber: { value: new THREE.Color(PALETTE.amber) },
      uBone: { value: new THREE.Color(PALETTE.bone) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shimmer = new THREE.Mesh(shimmerGeo, shimmerMat);
  shimmer.rotation.z = Math.PI / 2; // align with the arc's dial
  shimmer.visible = false;
  group.add(shimmer);

  /* S6 hero — the quietest halo in the system; BIGBACK is on the bench */
  const atmo = makeAtmosphere(0.8, '#A88D68', 0.6);
  group.add(atmo.mesh);

  /* rep state */
  let phase = 0;
  let pulse = 0;

  const bodyU = bodyMat.uniforms;
  const arcU = arcMat.uniforms;
  const shimU = shimmerMat.uniforms;
  const heroObjs = [shimmer, atmo.mesh];
  const heroMats = [shimmerMat, atmo.mat];

  const update = (t: number, dt: number, active: number, dim: number, reveal: number, hero: number): void => {
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
    arcU.uHero.value = hero;
    bodyU.uActive.value = active;
    bodyU.uDim.value = dim;
    bodyU.uReveal.value = reveal;
    bodyU.uHero.value = hero;

    // shimmer tracks the arc fill; gateHero drives its uHero and visibility
    shimU.uTime.value = t;
    shimU.uFill.value = fill;
    shimU.uDim.value = dim;
    shimU.uReveal.value = reveal;
    gateHero(heroObjs, heroMats, hero);
  };

  const dispose = (): void => {
    bodyGeo.dispose();
    arcGeo.dispose();
    shimmerGeo.dispose();
    bodyMat.dispose();
    arcMat.dispose();
    shimmerMat.dispose();
    atmo.dispose();
  };

  return { group, update, baseScale: 0.8, dispose };
}
