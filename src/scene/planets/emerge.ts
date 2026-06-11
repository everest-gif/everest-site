import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';
import { makeAtmosphere, gateHero } from './hero';

/* EMERGE AI — enterprise agents; dossiers.
   A bone-metal machined instrument: bone driven down to graphite (×0.32), fine
   longitudinal brushed striations, and a faint engraved lat/long dossier grid
   every 20°. One fixed anisotropic specular band sells the metal. No rings —
   the silhouette is a pure machined sphere. Slow dignified rotation; on active
   the grid rulings warm toward amber and brighten, rotation +30%.
   1 draw call · 2,976 tris · no particles · no textures.
   S6 hero: the dossier grid at chamber range — fine rules incised every 1/6
   cell, the 20° section rules heavier, all read in relief by a raking lamp
   orbiting low. Plus a neutral bone atmosphere shell. +1 draw call, hero only. */

const BODY_R = 0.95;

const VERT = /* glsl */ `
varying vec3 vObjN;
varying vec3 vViewN;

void main() {
  vObjN = normal;
  vViewN = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform vec3 uBone;
uniform vec3 uAmber;
uniform float uActive;
uniform float uDim;
uniform float uReveal;
uniform float uTime;
uniform float uHero;

varying vec3 vObjN;
varying vec3 vViewN;

/* Anti-aliased engraved ruling. p in cell units, lines at integer crossings.
   Gaussian profile (never pow), and the line amplitude fades as cells go
   sub-pixel so the grid resolves cleanly at 70px and melts away at 28px
   instead of aliasing into noise. */
float etch(float p) {
  float w = max(fwidth(p), 1e-4);
  float d = abs(fract(p + 0.5) - 0.5);
  float t = d / (w + 0.045);
  float aa = clamp(0.11 / w, 0.0, 1.0);
  return exp(-t * t) * aa;
}

/* S6 — signed engraving for the hero grid: a gaussian groove (w0 wide, cell
   units) whose edge facing the raking lamp lifts and whose far edge sinks.
   rak is the lamp's component along the grid axis; everything is clamp-based,
   never pow, and the groove melts away as it goes sub-pixel. */
float relief(float p, float w0, float rak) {
  float w = max(fwidth(p), 1e-4);
  float s = fract(p + 0.5) - 0.5;
  float t = s / w0;
  float aa = clamp(w0 * 1.4 / w, 0.0, 1.0);
  return exp(-t * t) * clamp(s / w0, -1.0, 1.0) * rak * aa;
}

void main() {
  vec3 no = normalize(vObjN);
  vec3 N = normalize(vViewN);

  /* fixed instrument light, view space — terminator gives the 28px silhouette */
  vec3 L = normalize(vec3(-0.46, 0.72, 0.52));
  float lam = clamp(dot(N, L), 0.0, 1.0);
  float diff = 0.16 + 0.84 * lam;

  /* fine brushed striations, longitudinal grain — built from normal components
     so the field is continuous everywhere (no atan seam in the brushing) */
  float brush = sin(no.x * 68.0) * 0.55
              + sin(no.z * 71.0 + no.x * 29.0) * 0.40
              + sin((no.x - no.z) * 151.0) * 0.30;

  /* graphite body: bone multiplied way down — cold metal against ink */
  vec3 body = uBone * 0.32 * diff * (1.0 + brush * 0.055);

  /* dossier grid: engraved lat/long rulings every 20°, fixed to the surface */
  float eqLen = length(no.xz);
  float lon = atan(no.z, no.x + step(eqLen, 1e-5)); /* pole-safe: atan(0,1)=0 */
  float lat = asin(clamp(no.y, -1.0, 1.0));
  const float CELL = 0.3490658504; /* 20° in radians */
  float g = clamp(etch(lon / CELL) + etch(lat / CELL), 0.0, 1.0);
  vec3 gridCol = mix(uBone, uAmber, uActive * 0.85);
  float gGain = 0.16 + 0.30 * uActive;
  /* at chamber range the PAINTED grid yields to the raking-light relief below —
     a bright wire grid at 400px reads as a demo sphere, not etched bone-metal */
  vec3 grid = gridCol * (g * gGain * (0.40 + 0.60 * diff)) * (1.0 - uHero * 0.78);

  /* single anisotropic specular band, stretched across the brush grain */
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  vec3 aN = normalize(vec3(N.x * 0.35, N.y, N.z));
  float s = clamp(dot(aN, H), 0.0, 1.0);
  float bt = (s - 1.0) * 13.0;
  float band = exp(-bt * bt);
  float grain = 0.78 + 0.22 * (sin((no.x - no.z) * 151.0) * 0.5 + 0.5);
  vec3 spec = uBone * (band * 0.36 * grain);

  /* S6 hero — the dossier grid in relief. A lamp orbits low in object space;
     where its light grazes the surface, fine incised rules (every 1/6 cell,
     section rules heavier on the 20° lines) catch it: the groove edge facing
     the lamp lifts, the far edge sinks. Value-only bone, ≤0.1, hero gated. */
  vec3 heroCol = vec3(0.0);
  if (uHero > 0.001) {
    float ra = uTime * 0.20;
    vec3 rl = normalize(vec3(cos(ra), 0.30, sin(ra)));
    float gz = dot(no, rl);
    float graze = exp(-gz * gz * 5.5); /* reveal lives at grazing incidence */

    /* local east/north tangents — degenerate to zero at the poles, never NaN */
    vec3 te = vec3(-no.z, 0.0, no.x);
    te /= max(length(te), 1e-4);
    vec3 tn = cross(te, no);
    float rakE = clamp(dot(rl, te) * 1.7, -1.0, 1.0);
    float rakN = clamp(dot(rl, tn) * 1.7, -1.0, 1.0);

    float pLo = lon / CELL;
    float pLa = lat / CELL;
    float fine = relief(pLo * 6.0, 0.10, rakE) + relief(pLa * 6.0, 0.10, rakN);
    float sect = relief(pLo, 0.030, rakE) + relief(pLa, 0.030, rakN);
    /* asymmetric clamp: shadows sink less than the body floor (≈0.048·bone) */
    float emboss = clamp(fine * 0.55 + sect, -0.4, 1.0);
    heroCol = uBone * emboss * graze * 0.10 * uHero;
  }

  vec3 col = body + grid + spec + heroCol;
  col *= mix(1.0, 0.4, clamp(uDim, 0.0, 1.0));   /* neighbor-hover dimming */
  col *= clamp(uReveal, 0.0, 1.0);               /* arrival fade vs ink bg  */
  gl_FragColor = vec4(col, 1.0);
}
`;

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();

  /* 48×32 sphere = 2,976 triangles — clean limb at 70px, under budget */
  const geometry = new THREE.SphereGeometry(BODY_R, 48, 32);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uBone: { value: new THREE.Color(PALETTE.bone) },
      uAmber: { value: new THREE.Color(PALETTE.amber) },
      uActive: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uTime: { value: 0 },
      uHero: { value: 0 },
    },
    transparent: false,
    depthWrite: true,
    depthTest: true,
  });

  const mesh = new THREE.Mesh(geometry, material);

  /* slight machined-axis tilt; spin applied on the inner mesh only */
  const tilt = new THREE.Group();
  tilt.rotation.z = 0.16;
  tilt.add(mesh);
  group.add(tilt);

  /* S6 hero — neutral bone halo around the instrument */
  const atmo = makeAtmosphere(BODY_R, '#D5CDBC', 0.8);
  group.add(atmo.mesh);
  const heroObjs = [atmo.mesh];
  const heroMats = [atmo.mat];

  let spin = 0;

  const update = (
    t: number,
    dt: number,
    active: number,
    dim: number,
    reveal: number,
    hero: number,
  ): void => {
    const d = Math.min(Math.max(dt, 0), 0.1);
    spin += d * 0.055 * (1.0 + 0.3 * active); /* dignified; +30% on active */
    mesh.rotation.y = spin;
    material.uniforms.uActive.value = active;
    material.uniforms.uDim.value = dim;
    material.uniforms.uReveal.value = reveal;
    material.uniforms.uTime.value = t;
    material.uniforms.uHero.value = hero;
    gateHero(heroObjs, heroMats, hero);
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
    atmo.dispose();
  };

  return { group, update, baseScale: 0.9, dispose };
}
