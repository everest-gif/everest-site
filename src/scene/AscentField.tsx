import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { handles, HUB_Y, BONE } from './handles';

/* S1 — the climb corridor. Two layers that exist only while the ascent handle is hot:
   star-rush streaks (the sky pouring past as altitude builds) and fog streaks (the
   last haze layers whipping down across the lens). Both are static geometry — the
   motion is REAL camera travel; the shaders only stretch each sprite along the
   direction of apparent flow. uDir flips for the descent. */

const STREAKS = 800;
const FOG_STREAKS = 18;

const streakVert = /* glsl */ `
attribute float aEnd;
attribute float aSeed;
uniform float uAscent;
uniform float uDir;
varying float vA;

float hashs(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  vec3 pos = position;
  /* fast attack — the rush must exist the moment the peaks are cleared */
  float ua = sqrt(clamp(uAscent, 0.0, 1.0));
  float len = (0.5 + 2.1 * hashs(aSeed)) * ua;
  /* the trail extends where the star JUST WAS — above when rising, below when diving */
  pos.y += aEnd * len * uDir;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float depth = clamp(1.0 - (-mv.z - 6.0) / 52.0, 0.2, 1.0);
  /* head bright, tail dies; whole streak rides the ascent envelope */
  vA = ua * depth * (0.4 + 0.6 * hashs(aSeed * 3.7)) * (1.0 - aEnd * 0.85);
  gl_Position = projectionMatrix * mv;
}
`;

const streakFrag = /* glsl */ `
uniform vec3 uColor;
varying float vA;

void main() {
  if (vA < 0.012) discard;
  gl_FragColor = vec4(uColor, vA);
}
`;

const fogStreakVert = /* glsl */ `
attribute float aSeed;
uniform float uAscent;
varying float vA;
varying float vSeed;

float hashs(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  /* veils die both far away AND right at the lens — a sprite grazing the camera
     would balloon into a grey blob */
  float near = clamp(1.0 - (-mv.z - 3.0) / 30.0, 0.0, 1.0) * smoothstep(1.5, 4.5, -mv.z);
  vA = uAscent * near * (0.07 + 0.09 * hashs(aSeed * 5.1));
  gl_PointSize = (140.0 + 160.0 * hashs(aSeed * 7.7)) * (16.0 / max(2.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`;

const fogStreakFrag = /* glsl */ `
varying float vA;
varying float vSeed;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  /* soft vertical veil inside the sprite — haze stretched by speed, never a pill */
  float body = (1.0 - smoothstep(0.0, 0.3, abs(c.x))) * (1.0 - smoothstep(0.05, 0.48, abs(c.y)));
  float a = vA * body * body;
  if (a < 0.006) discard;
  gl_FragColor = vec4(vec3(0.42, 0.4, 0.37), a);
}
`;

export default function AscentField() {
  const groupRef = useRef<THREE.Group>(null);

  const stars = useMemo(() => {
    const pos = new Float32Array(STREAKS * 2 * 3);
    const end = new Float32Array(STREAKS * 2);
    const seed = new Float32Array(STREAKS * 2);
    for (let i = 0; i < STREAKS; i++) {
      /* a tall shaft around the climb corridor, biased close, clear of the path */
      let x = 0;
      let z = 0;
      do {
        const r = 3 + Math.pow(Math.random(), 1.6) * 30;
        const a = Math.random() * Math.PI * 2;
        x = Math.cos(a) * r;
        z = -6 + Math.sin(a) * r;
      } while (Math.abs(x) < 2.5 && z > -16 && z < 12);
      const y = 4 + Math.random() * (HUB_Y + 10);
      const sd = Math.random() * 1000;
      for (let e = 0; e < 2; e++) {
        const v = i * 2 + e;
        pos[v * 3] = x;
        pos[v * 3 + 1] = y;
        pos[v * 3 + 2] = z;
        end[v] = e;
        seed[v] = sd;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, HUB_Y / 2, -10), HUB_Y);
    const m = new THREE.ShaderMaterial({
      vertexShader: streakVert,
      fragmentShader: streakFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAscent: handles.ascent,
        uDir: handles.ascentDir,
        uColor: { value: new THREE.Color(BONE) },
      },
    });
    return { g, m };
  }, []);

  const fog = useMemo(() => {
    const pos = new Float32Array(FOG_STREAKS * 3);
    const seed = new Float32Array(FOG_STREAKS);
    for (let i = 0; i < FOG_STREAKS; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 18;
      pos[i * 3 + 1] = 5 + Math.random() * 46;
      pos[i * 3 + 2] = -12 + (Math.random() * 2 - 1) * 18;
      seed[i] = Math.random() * 1000;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 28, -10), 60);
    const m = new THREE.ShaderMaterial({
      vertexShader: fogStreakVert,
      fragmentShader: fogStreakFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uAscent: handles.ascent },
    });
    return { g, m };
  }, []);

  /* render only while the climb is hot — zero cost at rest, on the hub, in chambers */
  useFrame(() => {
    const g = groupRef.current;
    if (g) g.visible = handles.ascent.value > 0.002;
  });

  return (
    <group ref={groupRef} visible={false}>
      <lineSegments geometry={stars.g} material={stars.m} frustumCulled={false} />
      <points geometry={fog.g} material={fog.m} frustumCulled={false} />
    </group>
  );
}
