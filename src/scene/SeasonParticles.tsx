import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles } from './handles';
import { GLSL_SEASON, seasonU } from './season';

/* ============================================================
   M3 — season weather. Three always-mounted systems; each knows which
   season owns it (uOwnId) and computes its own visibility from the
   weather-front coverage: old-season particles die at the front,
   new ones are born behind it. Reduced motion: particles stay dark
   (a frozen blizzard hanging mid-air is worse than none).
   ============================================================ */

const GLSL_HASH = /* glsl */ `
float hashp(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
`;

const GLSL_VIS = /* glsl */ `
uniform float uOwnId;
uniform float uFade;

float ownVis(float wx) {
  float cov = seasonCoverage(wx);
  float ownA = 1.0 - min(abs(uSeasonFrom - uOwnId), 1.0);
  float ownB = 1.0 - min(abs(uSeasonTo - uOwnId), 1.0);
  return (ownA * (1.0 - cov) + ownB * cov) * uFade;
}
`;

/* ---------- snow + petals share the points skeleton; behavior differs by uniforms ---------- */
const driftVert = /* glsl */ `
${GLSL_SEASON}
${GLSL_HASH}
${GLSL_VIS}
attribute float aSeed;
uniform float uTime;
uniform float uRate;    /* fall cycles per second */
uniform float uWander;  /* horizontal drift amplitude */
uniform float uSize;
varying float vA;

void main() {
  float spd = 0.6 + 0.8 * hashp(aSeed);
  float fall = fract(uTime * uRate * spd + hashp(aSeed * 3.7));
  float y = mix(14.5, -0.6, fall);
  float x = position.x
    + sin(uTime * (0.22 + hashp(aSeed * 5.0) * 0.3) + aSeed) * uWander
    + sin(uTime * 0.13 + aSeed * 2.7) * uWander * 0.5;
  float z = position.z + cos(uTime * 0.17 + aSeed * 2.0) * 0.8;
  float life = smoothstep(0.0, 0.06, fall) * (1.0 - smoothstep(0.92, 1.0, fall));
  vA = ownVis(x) * life * (0.3 + 0.45 * hashp(aSeed * 9.1));
  vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
  gl_PointSize = (1.0 + 1.4 * hashp(aSeed * 7.7)) * uSize * (26.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`;

const driftFrag = /* glsl */ `
uniform vec3 uColor;
varying float vA;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float disc = 1.0 - smoothstep(0.12, 0.5, length(c));
  float a = vA * disc;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* ---------- autumn leaves — instanced tumbling quads ---------- */
const leafVert = /* glsl */ `
${GLSL_SEASON}
${GLSL_HASH}
${GLSL_VIS}
attribute float iSeed;
attribute vec3 iBase;
uniform float uTime;
varying float vA;
varying vec2 vUv;
varying float vTint;

void main() {
  vUv = uv;
  vTint = hashp(iSeed * 13.0);
  float fall = fract(uTime * (0.035 + 0.03 * hashp(iSeed)) + hashp(iSeed * 3.1));
  float y = mix(12.5, -0.4, fall);
  float x = iBase.x + sin(uTime * 0.35 + iSeed) * 2.2 + sin(fall * 22.0 + iSeed) * 0.55;
  float z = iBase.z;
  float a1 = uTime * (1.1 + hashp(iSeed * 7.0)) + iSeed;
  float a2 = uTime * (0.8 + hashp(iSeed * 4.0) * 0.8) + iSeed * 2.0;
  float c1 = cos(a1); float s1 = sin(a1);
  float c2 = cos(a2); float s2 = sin(a2);
  vec3 corner = vec3(position.xy * (0.7 + 0.6 * hashp(iSeed * 11.0)), 0.0);
  corner = vec3(corner.x, corner.y * c1 - corner.z * s1, corner.y * s1 + corner.z * c1);
  corner = vec3(corner.x * c2 + corner.z * s2, corner.y, -corner.x * s2 + corner.z * c2);
  float life = smoothstep(0.0, 0.05, fall) * (1.0 - smoothstep(0.93, 1.0, fall));
  vA = ownVis(x) * life * 0.85;
  vec4 mv = modelViewMatrix * vec4(vec3(x, y, z) + corner, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const leafFrag = /* glsl */ `
varying float vA;
varying vec2 vUv;
varying float vTint;

void main() {
  vec2 d = vUv - 0.5;
  /* almond silhouette + darker midrib — a leaf, not a confetti square */
  float shape = 1.0 - smoothstep(0.32, 0.5, length(d * vec2(1.0, 1.7)));
  float rib = 1.0 - 0.35 * exp(-d.y * d.y * 220.0);
  float a = vA * shape;
  if (a < 0.012) discard;
  vec3 rust = vec3(0.55, 0.19, 0.06);
  vec3 warm = vec3(0.83, 0.5, 0.16);
  gl_FragColor = vec4(mix(rust, warm, vTint) * rib, a);
}
`;

const seasonUniforms = () => ({
  uSeasonFrom: seasonU.from,
  uSeasonTo: seasonU.to,
  uSeasonFront: seasonU.front,
  uSeasonEdge: seasonU.edge,
});

function DriftPoints({
  ownId,
  count,
  rate,
  wander,
  size,
  color,
}: {
  ownId: number;
  count: number;
  rate: number;
  wander: number;
  size: number;
  color: string;
}) {
  const { geometry, material } = useMemo(() => {
    const pts = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pts[i * 3] = (Math.random() * 2 - 1) * 34;
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = -2.5 - Math.random() * 24;
      seeds[i] = Math.random() * 1000;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 7, -14), 48);
    const m = new THREE.ShaderMaterial({
      vertexShader: driftVert,
      fragmentShader: driftFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        ...seasonUniforms(),
        uOwnId: { value: ownId },
        uFade: { value: 0 },
        uTime: { value: 0 },
        uRate: { value: rate },
        uWander: { value: wander },
        uSize: { value: size },
        uColor: { value: new THREE.Color(color) },
      },
    });
    return { geometry: g, material: m };
  }, [ownId, count, rate, wander, size, color]);

  useFrame((state) => {
    const reduced = useStore.getState().reducedMotion;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uFade.value = reduced ? 0 : handles.thresholdFade.value;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function Leaves({ count = 130 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const base = new THREE.PlaneGeometry(0.16, 0.11);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    const seeds = new Float32Array(count);
    const bases = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random() * 1000;
      bases[i * 3] = (Math.random() * 2 - 1) * 34;
      bases[i * 3 + 1] = 0;
      bases[i * 3 + 2] = -2.5 - Math.random() * 22;
    }
    g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    g.setAttribute('iBase', new THREE.InstancedBufferAttribute(bases, 3));
    g.instanceCount = count;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, -13), 48);
    const m = new THREE.ShaderMaterial({
      vertexShader: leafVert,
      fragmentShader: leafFrag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        ...seasonUniforms(),
        uOwnId: { value: 3 },
        uFade: { value: 0 },
        uTime: { value: 0 },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    const reduced = useStore.getState().reducedMotion;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uFade.value = reduced ? 0 : handles.thresholdFade.value;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

export default function SeasonParticles() {
  return (
    <group>
      {/* winter snow — steady, dense, cold */}
      <DriftPoints ownId={1} count={650} rate={0.055} wander={1.5} size={1.05} color="#cdd6e4" />
      {/* spring petal motes — sparse, slow, lifted */}
      <DriftPoints ownId={2} count={210} rate={0.03} wander={2.6} size={1.35} color="#a8c4a0" />
      {/* autumn leaves — sparse tumbling quads */}
      <Leaves />
    </group>
  );
}
