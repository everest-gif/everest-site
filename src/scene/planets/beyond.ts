import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';

/* BEYOND — a tiny dark earth: ink sphere with the faintest landmass mottling, and jade
   route polylines tracing journeys across it, each with a travelling bright head. The
   only planet allowed jade. */

const bodyVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  vPos = position;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const bodyFrag = /* glsl */ `
uniform float uMul;
uniform vec3 uBone;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash3(i);
  float b = hash3(i + vec3(1.0, 0.0, 0.0));
  float c = hash3(i + vec3(0.0, 1.0, 0.0));
  float d = hash3(i + vec3(1.0, 1.0, 0.0));
  float e = hash3(i + vec3(0.0, 0.0, 1.0));
  float g = hash3(i + vec3(1.0, 0.0, 1.0));
  float h = hash3(i + vec3(0.0, 1.0, 1.0));
  float k = hash3(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  /* landmasses: two octaves of value noise, barely above the void */
  float land = vnoise(vPos * 3.1) * 0.6 + vnoise(vPos * 7.4) * 0.4;
  float masses = smoothstep(0.52, 0.72, land);
  float fres = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 2.6);
  vec3 col = vec3(0.045, 0.047, 0.055);
  col += uBone * masses * 0.05;
  col += uBone * fres * 0.07;
  gl_FragColor = vec4(col * uMul, 1.0);
}
`;

/* a great-circle-ish arc: start vector rotated around an axis */
function buildRoute(axis: THREE.Vector3, start: THREE.Vector3, arc: number, points: number): Float32Array {
  const out = new Float32Array(points * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < points; i++) {
    v.copy(start).applyAxisAngle(axis, (i / (points - 1)) * arc);
    v.normalize().multiplyScalar(0.92);
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  return out;
}

const ROUTES = [
  { axis: new THREE.Vector3(0.2, 1, 0.25), start: new THREE.Vector3(0.9, 0.25, 0.35), arc: 2.4, speed: 0.045, phase: 0.0 },
  { axis: new THREE.Vector3(-0.6, 0.8, 0.1), start: new THREE.Vector3(0.2, -0.5, 0.85), arc: 1.9, speed: 0.06, phase: 0.45 },
  { axis: new THREE.Vector3(0.85, 0.3, -0.45), start: new THREE.Vector3(-0.6, 0.6, 0.5), arc: 2.8, speed: 0.035, phase: 0.8 },
];
const PTS = 40;

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();
  const jade = new THREE.Color(PALETTE.jade);
  const bone = new THREE.Color(PALETTE.bone);

  const bodyGeo = new THREE.SphereGeometry(0.9, 40, 26);
  const bodyMat = new THREE.ShaderMaterial({
    vertexShader: bodyVert,
    fragmentShader: bodyFrag,
    uniforms: { uMul: { value: 1 }, uBone: { value: bone } },
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  const routeData = ROUTES.map((r) => buildRoute(r.axis.clone().normalize(), r.start.clone().normalize(), r.arc, PTS));
  const routeMats: THREE.LineBasicMaterial[] = [];
  const routeGeos: THREE.BufferGeometry[] = [];
  for (const data of routeData) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(data, 3));
    const m = new THREE.LineBasicMaterial({
      color: jade,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    routeGeos.push(g);
    routeMats.push(m);
    const line = new THREE.Line(g, m);
    group.add(line);
  }

  /* travelling heads — one Points object, 3 vertices, positions written in update */
  const headPos = new Float32Array(ROUTES.length * 3);
  const headGeo = new THREE.BufferGeometry();
  headGeo.setAttribute('position', new THREE.BufferAttribute(headPos, 3));
  headGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2);
  const headMat = new THREE.PointsMaterial({
    color: jade,
    size: 0.09,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const heads = new THREE.Points(headGeo, headMat);
  group.add(heads);

  const update = (t: number, _dt: number, active: number, dim: number, reveal: number) => {
    const mul = (1 - dim * 0.6) * reveal;
    bodyMat.uniforms.uMul.value = mul;
    const routeOp = (0.35 + active * 0.25) * mul;
    for (const m of routeMats) m.opacity = routeOp;
    headMat.opacity = 0.9 * mul;
    const speedK = 1 + active * 2;
    for (let r = 0; r < ROUTES.length; r++) {
      const rt = ROUTES[r];
      const u = (t * rt.speed * speedK + rt.phase) % 1;
      const f = u * (PTS - 1);
      const i = Math.min(PTS - 2, Math.floor(f));
      const k = f - i;
      const d = routeData[r];
      headPos[r * 3] = d[i * 3] * (1 - k) + d[(i + 1) * 3] * k;
      headPos[r * 3 + 1] = d[i * 3 + 1] * (1 - k) + d[(i + 1) * 3 + 1] * k;
      headPos[r * 3 + 2] = d[i * 3 + 2] * (1 - k) + d[(i + 1) * 3 + 2] * k;
    }
    (headGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    group.rotation.y = t * 0.05;
  };

  return {
    group,
    update,
    baseScale: 0.95,
    dispose: () => {
      bodyGeo.dispose();
      bodyMat.dispose();
      routeGeos.forEach((g) => g.dispose());
      routeMats.forEach((m) => m.dispose());
      headGeo.dispose();
      headMat.dispose();
    },
  };
}
