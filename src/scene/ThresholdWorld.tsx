import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, AMBER } from './handles';
import { terrainVert, terrainFrag, pulseVert, pulseFrag, seamVert, seamFrag } from './shaders/terrain';
import { fogVert, fogFrag, starVert, starFrag } from './shaders/atmosphere';

/* Layer recipe: 4 depth planes, each its own seed/amplitude/brightness — far layers dimmer, taller. */
const LAYERS = [
  { z: -8, amp: 3.4, freq: 0.085, seed: 1.0, fade: 0.62, width: 56, segX: 200, segY: 34 },
  { z: -13.5, amp: 5.0, freq: 0.07, seed: 2.0, fade: 0.44, width: 70, segX: 180, segY: 30 },
  { z: -20, amp: 6.6, freq: 0.058, seed: 3.0, fade: 0.3, width: 86, segX: 150, segY: 26 },
  { z: -27.5, amp: 8.4, freq: 0.05, seed: 4.0, fade: 0.2, width: 106, segX: 120, segY: 22 },
];

/* middle sheet sits IN FRONT of the tunnel mouth (z −14.6 vs entrance −15.5) so drifting
   haze veils the tube's dark disc at idle instead of being occluded behind it.
   Drift speeds diverge strongly per depth (R6) — the parallax must be visible. */
const FOGS = [
  { z: -10.5, y: 1.6, w: 64, h: 9, seed: 0.7, opacity: 0.14, drift: 0.024 },
  { z: -14.6, y: 3.2, w: 82, h: 11, seed: 1.9, opacity: 0.12, drift: -0.012 },
  { z: -23.5, y: 3.8, w: 100, h: 13, seed: 3.2, opacity: 0.1, drift: 0.005 },
];

const amberColor = new THREE.Color(AMBER);

function TerrainLayer({ cfg }: { cfg: (typeof LAYERS)[number] }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(cfg.width, 18, cfg.segX, cfg.segY);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [cfg]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: terrainVert,
        fragmentShader: terrainFrag,
        wireframe: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uAmp: { value: cfg.amp },
          uFreq: { value: cfg.freq },
          uSeed: { value: cfg.seed },
          uSeam: handles.seam,
          uColor: { value: amberColor },
          uNearBright: handles.nearBright,
          uFade: { value: cfg.fade },
        },
      }),
    [cfg],
  );

  useFrame(() => {
    material.uniforms.uFade.value = cfg.fade * handles.thresholdFade.value;
  });

  return <mesh geometry={geometry} material={material} position={[0, 0, cfg.z]} />;
}

/* Pulse points ride the front two layers — sampled vertices, shader-recomputed heights. */
function PulsePoints({ cfg, count }: { cfg: (typeof LAYERS)[number]; count: number }) {
  const { geometry, material } = useMemo(() => {
    const src = new THREE.PlaneGeometry(cfg.width, 18, cfg.segX, cfg.segY);
    src.rotateX(-Math.PI / 2);
    const pos = src.getAttribute('position');
    const stride = Math.max(1, Math.floor(pos.count / count));
    const pts: number[] = [];
    const seeds: number[] = [];
    for (let i = 0; i < pos.count; i += stride) {
      pts.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      seeds.push((i % 1000) * 0.137 + cfg.seed);
    }
    src.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: pulseVert,
      fragmentShader: pulseFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAmp: { value: cfg.amp },
        uFreq: { value: cfg.freq },
        uSeed: { value: cfg.seed },
        uSeam: handles.seam,
        uTime: { value: 0 },
        uColor: { value: amberColor },
      },
    });
    return { geometry: g, material: m };
  }, [cfg, count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points geometry={geometry} material={material} position={[0, 0, cfg.z]} />;
}

function FogSheet({ cfg }: { cfg: (typeof FOGS)[number] }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: fogVert,
        fragmentShader: fogFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: cfg.seed },
          uOpacity: { value: cfg.opacity },
          uDrift: { value: cfg.drift },
        },
      }),
    [cfg],
  );
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uOpacity.value = cfg.opacity * handles.thresholdFade.value;
  });
  return (
    <mesh material={material} position={[0, cfg.y, cfg.z]}>
      <planeGeometry args={[cfg.w, cfg.h, 1, 1]} />
    </mesh>
  );
}

function Stars({ count = 700 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const pts = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 2 - 1) * 70;
      const y = 4 + Math.random() * 42;
      const z = -34 - Math.random() * 50;
      pts[i * 3] = x;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = z;
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
        uColor: { value: new THREE.Color('#EDE8DF') },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points geometry={geometry} material={material} />;
}

/* Solid darkness behind the wound — the mountain's interior. Fades in with the split so
   the parted halves reveal ink (and hide the tunnel mouth's hard rim), melts away as the
   camera reaches it. Normal blending: it darkens, never glows. */
const shroudFrag = /* glsl */ `
uniform float uSeam;
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  float edge = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x))
             * smoothstep(0.0, 0.14, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
  float near = clamp((length(vWorld - cameraPosition) - 1.2) / 3.0, 0.0, 1.0);
  float a = uSeam * edge * near * 0.96;
  if (a < 0.01) discard;
  gl_FragColor = vec4(0.039, 0.039, 0.047, a);
}
`;

const shroudVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

function SeamShroud() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shroudVert,
        fragmentShader: shroudFrag,
        transparent: true,
        depthWrite: false,
        uniforms: { uSeam: handles.seam },
      }),
    [],
  );
  return (
    <mesh material={material} position={[0, 3.4, -15.0]}>
      <planeGeometry args={[15, 13, 1, 1]} />
    </mesh>
  );
}

/* Blade of light inside the fissure — dormant (uSeam=0) until the breach. */
function SeamLight() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: seamVert,
        fragmentShader: seamFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uSeam: handles.seam,
          uBlade: handles.blade,
          uFade: handles.thresholdFade,
          uTime: { value: 0 },
          uColor: { value: amberColor },
        },
      }),
    [],
  );
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });
  /* top edge sits just above the crest — the blade ignites there and draws down */
  return (
    <mesh material={material} position={[0, 3.4, -13.4]}>
      <planeGeometry args={[2.4, 9.6, 1, 1]} />
    </mesh>
  );
}

export default function ThresholdWorld() {
  const act = useStore((s) => s.act);
  const visible = act === 'boot' || act === 'threshold' || act === 'breach' || act === 'reverse-breach';

  return (
    <group visible={visible}>
      {LAYERS.map((cfg) => (
        <TerrainLayer key={cfg.seed} cfg={cfg} />
      ))}
      <PulsePoints cfg={LAYERS[0]} count={170} />
      <PulsePoints cfg={LAYERS[1]} count={130} />
      {FOGS.map((cfg) => (
        <FogSheet key={cfg.seed} cfg={cfg} />
      ))}
      <Stars />
      <SeamShroud />
      <SeamLight />
    </group>
  );
}
