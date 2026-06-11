import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GLSL_NOISE } from './shaders/noise';
import { starVert, starFrag } from './shaders/atmosphere';

/* S3 — the milky-way band: a diagonal galactic structure behind the hub. Layered
   star-density gradients, soft dust lanes, slow drift. DEEP-SPACE-ONLY palette
   allowance (DECISIONS #53): desaturated violet-indigo lives here and nowhere
   else — planets, threads, pulses, UI and type stay amber/jade/bone. Opacity
   envelope 6–12%; behind everything, competing with nothing. */

const TILT = -0.42; /* ≈24° — the band runs lower-left → upper-right */

const bandVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const bandFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform float uReveal;
uniform vec3 uIndigo;
uniform vec3 uAmber;
varying vec2 vUv;

void main() {
  /* band-space: x runs along the structure, y across it */
  vec2 p = (vUv - 0.5) * vec2(9.0, 5.4);
  float across = p.y;
  /* the galactic profile — a soft gaussian spine with ragged fbm edges */
  vec2 q = vec2(fbm(p * 0.5 + vec2(uTime * 0.0035, 0.0)), fbm(p * 0.5 - vec2(0.0, uTime * 0.0028)));
  float edge = fbm(p * 0.85 + q * 1.3);
  /* tight profile — the camera frames only the plane's center, so the gaussian
     must fall off INSIDE that window or the band reads as all-over mottling */
  float spine = exp(-across * across * (6.5 + edge * 3.5));
  /* dust lanes — dark filaments threading the spine, the structure's signature */
  float lane = fbm(vec2(p.x * 0.6, p.y * 2.2) + q * 1.7 + vec2(uTime * 0.002, 0.0));
  float dust = smoothstep(0.18, 0.62, lane);
  float body = spine * (1.0 - dust * 0.72);
  /* granulation — unresolved star-density, not a smooth wash */
  float gr = fbm(p * 6.5 + q * 0.6);
  float grains = smoothstep(0.25, 0.85, gr) * 0.55 + 0.45;
  /* hue: indigo core dust warmed by amber lobes, everything pulled toward ink */
  float warm = clamp(0.5 + 0.5 * fbm(p * 0.42 + 2.9), 0.0, 1.0);
  vec3 col = mix(uIndigo, uAmber, warm * 0.36) * 0.62 + vec3(0.04);
  /* die before the plane edge — never a rectangle */
  float mask = smoothstep(0.02, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 0.98, vUv.x))
             * smoothstep(0.02, 0.18, vUv.y) * (1.0 - smoothstep(0.82, 0.98, vUv.y));
  /* envelope ≤0.105 — inside the directive's 6–12% allowance, additive-aware */
  float a = body * grains * mask * 0.105 * uReveal;
  if (a < 0.002) discard;
  gl_FragColor = vec4(col, a);
}
`;

export default function MilkyWay({ reveal }: { reveal: { value: number } }) {
  const band = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: bandVert,
      fragmentShader: bandFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uReveal: reveal,
        uIndigo: { value: new THREE.Color('#7A6FA8') }, /* desaturated violet-indigo — sky only */
        uAmber: { value: new THREE.Color('#E8A23D') },
      },
    });
    return mat;
  }, [reveal]);

  /* band-aligned star cloud — real 3D depth, so the drag-orbit lean parallaxes
     the density gradient against the wash behind it */
  const cloud = useMemo(() => {
    const count = 380;
    const pts = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const ca = Math.cos(TILT);
    const sa = Math.sin(TILT);
    for (let i = 0; i < count; i++) {
      const along = (Math.random() * 2 - 1) * 85;
      /* gaussian across the band via sum of randoms */
      const acr = (Math.random() + Math.random() + Math.random() - 1.5) * 7.5;
      pts[i * 3] = along * ca - acr * sa;
      pts[i * 3 + 1] = along * sa + acr * ca;
      pts[i * 3 + 2] = -26 - Math.random() * 34;
      seeds[i] = Math.random() * 1000;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: starVert,
      fragmentShader: starFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#D9D3CB') },
        uSharp: { value: 0 },
        uHorizon: { value: 0 },
        uFade: reveal,
      },
    });
    return { g, m };
  }, [reveal]);

  useFrame((state) => {
    band.uniforms.uTime.value = state.clock.elapsedTime;
    cloud.m.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group>
      <mesh material={band} position={[0, 0, -42]} rotation={[0, 0, TILT]} renderOrder={-3}>
        <planeGeometry args={[200, 120, 1, 1]} />
      </mesh>
      <points geometry={cloud.g} material={cloud.m} renderOrder={-2} frustumCulled={false} />
    </group>
  );
}
