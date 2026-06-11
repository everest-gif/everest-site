import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';

/* DOLOMITE — mission control named for rock.
   A faceted low-poly crystal (icosahedron detail 1, non-indexed → flat facets),
   near-ink surface lit by a single fixed amber key light. The crystal slowly
   tumbles on two axes; facets swing from near-black through warm amber, with
   tight bone-warm glints where a facet turns edge-on to the key.
   1 draw call · 80 triangles · no textures · no particles. */

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

  /* tumble state — integrated so speed changes stay continuous */
  let ax = 0.7;
  let ay = 2.1;

  const update = (_t: number, dt: number, active: number, dim: number, reveal: number): void => {
    const d = Math.min(dt, 0.05);
    const speed = 1.0 + 1.2 * active; /* ×2.2 at full active */
    ax += d * 0.1 * speed;
    ay += d * 0.16 * speed;
    mesh.rotation.x = ax;
    mesh.rotation.y = ay;

    uniforms.uGlint.value = 0.8 + 0.6 * active; /* glints brighten on approach */
    uniforms.uDimK.value = 1.0 - 0.6 * dim; /* toward 0.4 when another node hovered */
    uniforms.uReveal.value = Math.min(Math.max(reveal, 0.0), 1.0);
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { group, update, baseScale: 0.85, dispose };
}
