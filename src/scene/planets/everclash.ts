import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';

/* EVERCLASH — a sphere split into two hemispheres with a hairline energy gap between
   them; quick pugnacious idle wobble. Dark iron surface, amber rim, amber seam. */

const hemiVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const hemiFrag = /* glsl */ `
uniform vec3 uAmber;
uniform float uMul;   /* dim × reveal */
uniform float uActive;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  vec3 key = normalize(vec3(0.5, 0.65, 0.6));
  float lam = clamp(dot(n, key), 0.0, 1.0);
  float fres = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 2.4);
  /* dark iron body — value, not hue */
  vec3 col = vec3(0.085, 0.085, 0.095) + vec3(0.10, 0.095, 0.09) * lam * lam;
  col += uAmber * fres * (0.34 + uActive * 0.3);
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

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = 0.35; /* split axis ~20° off vertical — attitude */
  group.add(tilt);

  const amber = new THREE.Color(PALETTE.amber);
  const hemiGeo = new THREE.SphereGeometry(0.9, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2);
  const hemiMat = new THREE.ShaderMaterial({
    vertexShader: hemiVert,
    fragmentShader: hemiFrag,
    uniforms: {
      uAmber: { value: amber },
      uMul: { value: 1 },
      uActive: { value: 0 },
    },
  });
  const top = new THREE.Mesh(hemiGeo, hemiMat);
  const bottom = new THREE.Mesh(hemiGeo, hemiMat);
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

  const update = (t: number, _dt: number, active: number, dim: number, reveal: number) => {
    const mul = (1 - dim * 0.6) * reveal;
    hemiMat.uniforms.uMul.value = mul;
    hemiMat.uniforms.uActive.value = active;
    gapMat.uniforms.uMul.value = mul;
    gapMat.uniforms.uActive.value = active;
    gapMat.uniforms.uTime.value = t;
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
      hemiMat.dispose();
      gapGeo.dispose();
      gapMat.dispose();
    },
  };
}
