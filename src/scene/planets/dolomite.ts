import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';
import { makeAtmosphere, gateHero } from './hero';

/* DOLOMITE — mission control named for rock.
   A faceted low-poly crystal (icosahedron detail 1, non-indexed → flat facets),
   near-ink surface lit by a single fixed amber key light. The crystal slowly
   tumbles on two axes; facets swing from near-black through warm amber, with
   tight bone-warm glints where a facet turns edge-on to the key.
   S6 chamber hero: caustic sheets ignite inside the crystal — refraction-style
   bands that jump at facet joins, amber where the view passes deep — and facets
   spark one at a time off a slowly orbiting key under a pale warm halo.
   1 draw call hub · +1 (atmosphere) at hero · 80 triangles · no textures. */

const VERT = /* glsl */ `
varying vec3 vNorm;
varying vec3 vWorld;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNorm = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uLight;
uniform vec3 uAmber;
uniform vec3 uBone;
uniform vec3 uInk;
uniform float uGlint;
uniform float uDimK;
uniform float uReveal;
uniform float uTime;
uniform float uHero;

varying vec3 vNorm;
varying vec3 vWorld;

void main() {
  /* flat facet normal (constant per face — vertices were de-indexed) */
  vec3 n = normalize(vNorm);
  vec3 v = normalize(cameraPosition - vWorld);

  /* lambert on the fixed amber key; squared to push more facets toward black */
  float lam = max(dot(n, uLight), 0.0);
  float lit = lam * lam;

  /* tight glint: gaussian around the key half-vector (no pow, guarded length) */
  vec3 h = uLight + v;
  float hl = max(length(h), 1e-4);
  h /= hl;
  float gt = (1.0 - max(dot(n, h), 0.0)) * 14.0;
  float glint = exp(-gt * gt) * uGlint;

  vec3 col = uInk + uAmber * 0.05          /* near-ink base, faint warm lift */
           + uAmber * (0.72 * lit)         /* key-lit facets, warm amber ~0.7 */
           + mix(uAmber, uBone, 0.65) * glint;

  /* S6 hero — internal refraction: caustic sheets that live INSIDE the crystal.
     Periodic gaussians over view·plane dot products, offset by the facet normal
     so the bands jump at facet joins (the refraction tell); they drift with time
     and read warmest where the view passes deep through the core (high ndv). */
  if (uHero > 0.001) {
    float ndv = max(dot(n, v), 0.0);
    float depth = ndv * ndv;

    float s1 = fract(dot(v, vec3(0.78, 0.21, 0.59)) * 2.6 + n.y * 1.7 + uTime * 0.026) - 0.5;
    float s2 = fract(dot(v, vec3(-0.33, 0.88, 0.34)) * 3.4 - n.x * 1.3 - uTime * 0.017) - 0.5;
    float s3 = fract(ndv * 4.2 + n.z * 2.1 + uTime * 0.011) - 0.5;
    float sheets = exp(-s1 * s1 * 70.0) * 0.55
                 + exp(-s2 * s2 * 110.0) * 0.4
                 + exp(-s3 * s3 * 160.0) * 0.35;

    vec3 inner = mix(uBone, uAmber, 0.35 + 0.65 * depth); /* bone faces → amber core */
    col += inner * sheets * (0.10 + 0.30 * depth) * uHero;

    /* edge glints — a second key orbits slowly; the flat normal hashes each
       facet's flare phase, so facets POP one at a time, never strobing */
    float ga = uTime * 0.09;
    vec3 spl = normalize(vec3(cos(ga), 0.42 + 0.3 * sin(ga * 0.7), sin(ga)));
    vec3 gh = spl + v;
    float ghl = max(length(gh), 1e-4);
    gh /= ghl;
    float gq = 1.0 - max(dot(n, gh), 0.0);
    float spark = exp(-gq * gq * 4200.0);
    float gate = clamp(sin(uTime * 0.8 + dot(n, vec3(5.3, 7.1, 6.4))) * 12.0 - 11.0, 0.0, 1.0);
    col += mix(uAmber, uBone, 0.7) * spark * gate * 1.3 * uHero;
  }

  col *= uDimK * uReveal;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function makePlanet(): PlanetBuild {
  /* PolyhedronGeometry is non-indexed in r170, but follow the brief defensively */
  const raw = new THREE.IcosahedronGeometry(0.95, 1);
  const geometry: THREE.BufferGeometry = raw.index !== null ? raw.toNonIndexed() : raw;
  if (geometry !== raw) raw.dispose();
  geometry.computeVertexNormals(); /* non-indexed → true flat facet normals */

  const uniforms = {
    uLight: { value: new THREE.Vector3(-0.45, 0.62, 0.65).normalize() },
    uAmber: { value: new THREE.Color(PALETTE.amber) },
    uBone: { value: new THREE.Color(PALETTE.bone) },
    uInk: { value: new THREE.Color(PALETTE.ink) },
    uGlint: { value: 0.8 },
    uDimK: { value: 1.0 },
    uReveal: { value: 0.0 },
    uTime: { value: 0.0 },
    uHero: { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: false,
    depthWrite: true,
    depthTest: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);

  /* S6 hero — pale warm crystal halo (built now so the precompiler owns it) */
  const atmo = makeAtmosphere(0.95, '#D8C7A8', 0.8);
  group.add(atmo.mesh);

  /* tumble state — integrated so speed changes stay continuous */
  let ax = 0.7;
  let ay = 2.1;

  /* hoisted so update() never allocates */
  const heroObjs = [atmo.mesh];
  const heroMats = [atmo.mat];

  const update = (t: number, dt: number, active: number, dim: number, reveal: number, hero: number): void => {
    const d = Math.min(dt, 0.05);
    /* hero: the tumble eases to a museum turn — sheets and sparks stay readable */
    const speed = (1.0 + 1.2 * active) * (1.0 - 0.55 * hero); /* ×2.2 at full active */
    ax += d * 0.1 * speed;
    ay += d * 0.16 * speed;
    mesh.rotation.x = ax;
    mesh.rotation.y = ay;

    uniforms.uGlint.value = 0.8 + 0.6 * active; /* glints brighten on approach */
    uniforms.uDimK.value = 1.0 - 0.6 * dim; /* toward 0.4 when another node hovered */
    uniforms.uReveal.value = Math.min(Math.max(reveal, 0.0), 1.0);
    uniforms.uTime.value = t;
    uniforms.uHero.value = hero;

    gateHero(heroObjs, heroMats, hero);
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
    atmo.dispose();
  };

  return { group, update, baseScale: 0.85, dispose };
}
