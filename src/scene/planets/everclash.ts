import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';
import { makeAtmosphere, gateHero } from './hero';

/* EVERCLASH — a sphere split into two hemispheres with a hairline energy gap between
   them; quick pugnacious idle wobble. Dark iron surface, amber rim, amber seam.
   S6 hero: the gap leaks drifting energy motes; each half shows machined tooling —
   the top hemisphere battle-gouged, the bottom factory-clean. */

const MOTES = 90;

const hemiVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObj;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  vObj = normal;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const hemiFrag = /* glsl */ `
uniform vec3 uAmber;
uniform float uMul;   /* dim × reveal */
uniform float uActive;
uniform float uHero;
uniform float uWear;  /* 1 = battle-gouged half, 0 = factory-clean half */
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObj;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  vec3 key = normalize(vec3(0.5, 0.65, 0.6));
  float lam = clamp(dot(n, key), 0.0, 1.0);
  float fres = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 2.4);
  /* dark iron body — value, not hue */
  vec3 col = vec3(0.085, 0.085, 0.095) + vec3(0.10, 0.095, 0.09) * lam * lam;
  col += uAmber * fres * (0.34 + uActive * 0.3);

  /* S6 hero — machined tooling: fine latitude grooves + faint panel seams,
     value-only; uWear chews the bands up so one half reads gouged, one clean */
  if (uHero > 0.001) {
    vec3 g = normalize(vObj);
    /* hairline grooves — tight gaussians or the tooling reads as a wireframe ball */
    float lt = fract(g.y * 22.0) - 0.5;
    float groove = exp(-lt * lt * 2400.0);
    float bx = fract(g.x * 6.0) - 0.5;
    float bz = fract(g.z * 6.0) - 0.5;
    float panel = min(exp(-bx * bx * 3000.0) + exp(-bz * bz * 3000.0), 1.0);
    float chew = 0.55 + 0.45 * sin(g.x * 47.0 + g.z * 39.0) * sin(g.y * 53.0 - g.x * 29.0);
    float tool = groove * 0.02 + panel * 0.013;
    col += vec3(tool * mix(1.0, chew, uWear)) * uHero;
  }

  gl_FragColor = vec4(col * uMul, 1.0);
}
`;

const gapVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const gapFrag = /* glsl */ `
uniform vec3 uAmber;
uniform float uMul;
uniform float uActive;
uniform float uTime;
varying vec2 vUv;
void main() {
  /* RingGeometry uv.x runs inner→outer: hottest at the rim where the seam shows edge-on */
  float rim = smoothstep(0.45, 1.0, vUv.x);
  float flick = 0.85 + 0.15 * sin(uTime * 9.0 + vUv.y * 31.0);
  float a = rim * flick * (0.55 + uActive * 0.55) * uMul;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uAmber * 1.25, a);
}
`;

/* S6 hero — gap leakage: motes born in the seam plane, drifting outward and away
   from the gap. Positions are static; all motion lives in the vertex shader off
   aSeed + uTime, life-cycled via fract so motes fade in/out without popping. */
const moteVert = /* glsl */ `
attribute float aSeed;
attribute float aTint;
uniform float uTime;
uniform float uPx;
varying float vEnv;
varying float vTint;
void main() {
  float spd = 0.06 + 0.06 * fract(aSeed * 13.7);
  float life = fract(aSeed * 7.31 + uTime * spd);
  vEnv = life * (1.0 - life) * 4.0; /* zero at birth and death — no pop on wrap */
  vTint = aTint;
  float side = step(0.5, fract(aSeed * 5.13)) * 2.0 - 1.0;
  vec2 dir = position.xz / max(length(position.xz), 1e-4);
  vec3 p = position;
  p.xz += dir * life * 0.18;
  p.y += side * life * (0.12 + 0.10 * fract(aSeed * 3.97));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  /* respect HubWorld's group scaling via the matrix column */
  float sc = length(modelViewMatrix[0].xyz);
  gl_PointSize = clamp((0.018 + 0.016 * fract(aSeed * 9.4)) * uPx * sc / max(0.15, -mv.z), 1.0, 8.0);
  gl_Position = projectionMatrix * mv;
}
`;

const moteFrag = /* glsl */ `
precision highp float;
uniform float uHero;
uniform vec3 uAmber;
uniform vec3 uJade;
varying float vEnv;
varying float vTint;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float m = exp(-dot(q, q) * 18.0); /* soft round mote */
  float a = m * vEnv * uHero * 0.6;
  if (a < 0.004) discard;
  vec3 tint = mix(uAmber * 1.2, uJade, vTint);
  gl_FragColor = vec4(tint * a, a);
}
`;

function buildMotes(): THREE.BufferGeometry {
  const pos = new Float32Array(MOTES * 3);
  const seeds = new Float32Array(MOTES);
  const tints = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 0.48;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    pos[i * 3 + 2] = Math.sin(a) * r;
    seeds[i] = Math.random();
    tints[i] = Math.random() < 0.14 ? 1 : 0; /* mostly seam-amber, a few jade */
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  g.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
  /* covers shader-side drift */
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1.05);
  return g;
}

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = 0.35; /* split axis ~20° off vertical — attitude */
  group.add(tilt);

  const amber = new THREE.Color(PALETTE.amber);
  const hemiGeo = new THREE.SphereGeometry(0.9, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2);
  const makeHemiMat = (wear: number): THREE.ShaderMaterial =>
    new THREE.ShaderMaterial({
      vertexShader: hemiVert,
      fragmentShader: hemiFrag,
      uniforms: {
        uAmber: { value: amber },
        uMul: { value: 1 },
        uActive: { value: 0 },
        uHero: { value: 0 },
        uWear: { value: wear },
      },
    });
  /* same shader text → one program compile; separate uniforms split the character */
  const hemiMatTop = makeHemiMat(1);
  const hemiMatBottom = makeHemiMat(0);
  const hemiMats = [hemiMatTop, hemiMatBottom];
  const top = new THREE.Mesh(hemiGeo, hemiMatTop);
  const bottom = new THREE.Mesh(hemiGeo, hemiMatBottom);
  bottom.rotation.x = Math.PI;
  tilt.add(top, bottom);

  const gapGeo = new THREE.RingGeometry(0.2, 0.89, 48, 1);
  const gapMat = new THREE.ShaderMaterial({
    vertexShader: gapVert,
    fragmentShader: gapFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uAmber: { value: amber },
      uMul: { value: 1 },
      uActive: { value: 0 },
      uTime: { value: 0 },
    },
  });
  const gap = new THREE.Mesh(gapGeo, gapMat);
  gap.rotation.x = -Math.PI / 2; /* equatorial plane of the tilt group */
  tilt.add(gap);

  /* S6 hero — built now so the boot precompiler owns the compiles; gated to zero
     hub draw calls by gateHero */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const uPx = (window.innerHeight / (2 * Math.tan((25 * Math.PI) / 180))) * dpr;
  const moteGeo = buildMotes();
  const moteMat = new THREE.ShaderMaterial({
    vertexShader: moteVert,
    fragmentShader: moteFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uHero: { value: 0 },
      uAmber: { value: amber },
      uJade: { value: new THREE.Color(PALETTE.jade) },
      uPx: { value: uPx },
    },
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.visible = false;
  tilt.add(motes); /* seam-plane local frame — leakage follows the split axis */

  const atmo = makeAtmosphere(0.9, '#C9A06A', 0.75);
  group.add(atmo.mesh);

  const heroObjs = [motes, atmo.mesh];
  const heroMats = [moteMat, atmo.mat];

  const update = (t: number, _dt: number, active: number, dim: number, reveal: number, hero: number) => {
    const mul = (1 - dim * 0.6) * reveal;
    for (const m of hemiMats) {
      m.uniforms.uMul.value = mul;
      m.uniforms.uActive.value = active;
      m.uniforms.uHero.value = hero;
    }
    gapMat.uniforms.uMul.value = mul;
    gapMat.uniforms.uActive.value = active;
    gapMat.uniforms.uTime.value = t;
    moteMat.uniforms.uTime.value = t;
    gateHero(heroObjs, heroMats, hero);
    /* hemispheres part along the split axis; wider when riled */
    const half = 0.03 + active * 0.018 + 0.006 * Math.sin(t * 2.1);
    top.position.y = half;
    bottom.position.y = -half;
    /* pugnacious wobble — quick, springy, small */
    const amp = 0.07 * (1 + active * 0.8);
    group.rotation.x = Math.sin(t * 7.3) * amp;
    group.rotation.z = Math.sin(t * 5.1 + 1.7) * amp * 0.8;
    group.rotation.y = t * 0.18;
  };

  return {
    group,
    update,
    baseScale: 1.05,
    dispose: () => {
      hemiGeo.dispose();
      hemiMatTop.dispose();
      hemiMatBottom.dispose();
      gapGeo.dispose();
      gapMat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      atmo.dispose();
    },
  };
}
