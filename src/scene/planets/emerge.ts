import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';

/* EMERGE AI — enterprise agents; dossiers.
   A bone-metal machined instrument: bone driven down to graphite (×0.32), fine
   longitudinal brushed striations, and a faint engraved lat/long dossier grid
   every 20°. One fixed anisotropic specular band sells the metal. No rings —
   the silhouette is a pure machined sphere. Slow dignified rotation; on active
   the grid rulings warm toward amber and brighten, rotation +30%.
   1 draw call · 2,976 tris · no particles · no textures. */

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
  vec3 grid = gridCol * (g * gGain * (0.40 + 0.60 * diff));

  /* single anisotropic specular band, stretched across the brush grain */
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  vec3 aN = normalize(vec3(N.x * 0.35, N.y, N.z));
  float s = clamp(dot(aN, H), 0.0, 1.0);
  float bt = (s - 1.0) * 13.0;
  float band = exp(-bt * bt);
  float grain = 0.78 + 0.22 * (sin((no.x - no.z) * 151.0) * 0.5 + 0.5);
  vec3 spec = uBone * (band * 0.36 * grain);

  vec3 col = body + grid + spec;
  col *= mix(1.0, 0.4, clamp(uDim, 0.0, 1.0));   /* neighbor-hover dimming */
  col *= clamp(uReveal, 0.0, 1.0);               /* arrival fade vs ink bg  */
  gl_FragColor = vec4(col, 1.0);
}
`;

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();

  /* 48×32 sphere = 2,976 triangles — clean limb at 70px, under budget */
  const geometry = new THREE.SphereGeometry(0.95, 48, 32);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uBone: { value: new THREE.Color(PALETTE.bone) },
      uAmber: { value: new THREE.Color(PALETTE.amber) },
      uActive: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
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

  let spin = 0;

  const update = (
    _t: number,
    dt: number,
    active: number,
    dim: number,
    reveal: number,
  ): void => {
    const d = Math.min(Math.max(dt, 0), 0.1);
    spin += d * 0.055 * (1.0 + 0.3 * active); /* dignified; +30% on active */
    mesh.rotation.y = spin;
    material.uniforms.uActive.value = active;
    material.uniforms.uDim.value = dim;
    material.uniforms.uReveal.value = reveal;
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { group, update, baseScale: 0.9, dispose };
}
