import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { handles, TUNNEL_CY, TUNNEL_R, TUNNEL_Z0, TUNNEL_LEN, AMBER, JADE } from './handles';
import {
  tunnelVert,
  tunnelFrag,
  capFrag,
  ribbonVert,
  ribbonFrag,
  speedlineVert,
  speedlineFrag,
} from './shaders/tunnel';

/* R1.1 — the tunnel is bored into the mountain in THRESHOLD space, directly behind the
   ridge seam. The breach camera physically flies into it; nothing mounts or unmounts.
   The tube is opaque ink (occludes stars + outer terrain once inside); all light is
   ribbon geometry. Always mounted, always visible — beyond the far plane from the hub. */

const amber = new THREE.Color(AMBER);
const jade = new THREE.Color(JADE);

function TunnelTube() {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.CylinderGeometry(TUNNEL_R, TUNNEL_R, TUNNEL_LEN, 64, 1, true);
    g.rotateX(Math.PI / 2); /* axis along Z */
    const m = new THREE.ShaderMaterial({
      vertexShader: tunnelVert,
      fragmentShader: tunnelFrag,
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uProgress: handles.tunnelProgress,
        uLight: handles.tunnelLight,
        uAmber: { value: amber },
      },
    });
    return { geometry: g, material: m };
  }, []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <mesh geometry={geometry} material={material} position={[0, 0, TUNNEL_Z0 - TUNNEL_LEN / 2]} />;
}

/* Sealed far end — the distant point the ribbons converge into at arrival. */
function EndCap() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: tunnelVert,
        fragmentShader: capFrag,
        uniforms: {
          uLight: handles.tunnelLight,
          uConverge: handles.converge,
          uAmber: { value: amber },
        },
      }),
    [],
  );
  return (
    <mesh material={material} position={[0, 0, TUNNEL_Z0 - TUNNEL_LEN + 0.2]}>
      <circleGeometry args={[TUNNEL_R + 0.05, 48]} />
    </mesh>
  );
}

/* 10 streak ribbons — amber dominant, exactly one jade (R1.3; densified for the
   shorter M4 flight so 1.1s in the dark never reads empty). */
const RIBBONS = [
  { angle: 0.6, radius: 2.2, width: 0.1, len: 16, speed: 30, phase: 5, jade: 0, bright: 1.0 },
  { angle: 1.9, radius: 2.38, width: 0.06, len: 22, speed: 38, phase: 30, jade: 0, bright: 0.8 },
  { angle: 2.7, radius: 2.05, width: 0.13, len: 11, speed: 26, phase: 55, jade: 0, bright: 0.65 },
  { angle: 3.6, radius: 2.3, width: 0.05, len: 19, speed: 44, phase: 12, jade: 1, bright: 0.75 },
  { angle: 4.4, radius: 2.42, width: 0.09, len: 14, speed: 33, phase: 70, jade: 0, bright: 0.9 },
  { angle: 5.3, radius: 2.15, width: 0.07, len: 24, speed: 50, phase: 42, jade: 0, bright: 0.7 },
  { angle: 0.15, radius: 2.34, width: 0.11, len: 9, speed: 22, phase: 82, jade: 0, bright: 0.55 },
  { angle: 1.25, radius: 2.26, width: 0.08, len: 18, speed: 36, phase: 64, jade: 0, bright: 0.85 },
  { angle: 3.1, radius: 2.45, width: 0.05, len: 26, speed: 47, phase: 22, jade: 0, bright: 0.6 },
  { angle: 4.9, radius: 2.1, width: 0.12, len: 12, speed: 28, phase: 90, jade: 0, bright: 0.95 },
];

function Ribbons() {
  const { geometry, material } = useMemo(() => {
    const n = RIBBONS.length;
    const attr = {
      angle: new Float32Array(n * 4),
      radius: new Float32Array(n * 4),
      len: new Float32Array(n * 4),
      speed: new Float32Array(n * 4),
      phase: new Float32Array(n * 4),
      jade: new Float32Array(n * 4),
      side: new Float32Array(n * 4),
      head: new Float32Array(n * 4),
      width: new Float32Array(n * 4),
      bright: new Float32Array(n * 4),
    };
    const index: number[] = [];
    RIBBONS.forEach((r, i) => {
      /* 4 verts per ribbon: (tail,−1) (tail,+1) (head,−1) (head,+1) */
      for (let v = 0; v < 4; v++) {
        const k = i * 4 + v;
        attr.angle[k] = r.angle;
        attr.radius[k] = r.radius;
        attr.len[k] = r.len;
        attr.speed[k] = r.speed;
        attr.phase[k] = r.phase;
        attr.jade[k] = r.jade;
        attr.side[k] = v % 2 === 0 ? -1 : 1;
        attr.head[k] = v < 2 ? 0 : 1;
        attr.width[k] = r.width;
        attr.bright[k] = r.bright;
      }
      const b = i * 4;
      index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    });
    const g = new THREE.BufferGeometry();
    /* positions are shader-computed; placeholder attribute keeps three happy */
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 4 * 3), 3));
    g.setAttribute('aAngle', new THREE.BufferAttribute(attr.angle, 1));
    g.setAttribute('aRadius', new THREE.BufferAttribute(attr.radius, 1));
    g.setAttribute('aLen', new THREE.BufferAttribute(attr.len, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(attr.speed, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(attr.phase, 1));
    g.setAttribute('aJade', new THREE.BufferAttribute(attr.jade, 1));
    g.setAttribute('aSide', new THREE.BufferAttribute(attr.side, 1));
    g.setAttribute('aHead', new THREE.BufferAttribute(attr.head, 1));
    g.setAttribute('aWidth', new THREE.BufferAttribute(attr.width, 1));
    g.setAttribute('aBright', new THREE.BufferAttribute(attr.bright, 1));
    g.setIndex(index);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, TUNNEL_Z0 - TUNNEL_LEN / 2), 50);
    const m = new THREE.ShaderMaterial({
      vertexShader: ribbonVert,
      fragmentShader: ribbonFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uProgress: handles.tunnelProgress,
        uConverge: handles.converge,
        uLight: handles.tunnelLight,
        uAmber: { value: amber },
        uJade: { value: jade },
      },
    });
    return { geometry: g, material: m };
  }, []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

function SpeedLines({ count = 420 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 2 * 3);
    const z0 = new Float32Array(count * 2);
    const end = new Float32Array(count * 2);
    const len = new Float32Array(count * 2);
    const seed = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 1.4;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      const zb = Math.random() * 58;
      const ln = 0.5 + Math.random() * 1.4;
      const sd = Math.random() * 100;
      for (let e = 0; e < 2; e++) {
        const v = i * 2 + e;
        pos[v * 3] = x;
        pos[v * 3 + 1] = y;
        pos[v * 3 + 2] = 0;
        z0[v] = zb;
        end[v] = e;
        len[v] = ln;
        seed[v] = sd;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aZ0', new THREE.BufferAttribute(z0, 1));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    g.setAttribute('aLen', new THREE.BufferAttribute(len, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    /* the shader computes z; keep the default bounding sphere from spanning origin */
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, TUNNEL_Z0 - TUNNEL_LEN / 2), 44);
    const m = new THREE.ShaderMaterial({
      vertexShader: speedlineVert,
      fragmentShader: speedlineFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: handles.tunnelProgress,
        uTime: { value: 0 },
        uLight: handles.tunnelLight,
        uAmber: { value: amber },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}

export default function TunnelWorld() {
  const groupRef = useRef<THREE.Group>(null);

  /* M3 — the pre-staged tunnel is INVISIBLE until the mountain actually opens:
     at idle the opaque tube read as a dark dome occluding stars behind the peak.
     It mounts into visibility only once the seam parts (masked by the SeamShroud)
     or a transit is underway, so nothing ever pops on screen. */
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.visible =
      handles.seam.value > 0.001 || handles.tunnelLight.value > 0.001 || handles.tunnelProgress.value > 0.001;
  });

  return (
    <group ref={groupRef} position={[0, TUNNEL_CY, 0]} visible={false}>
      <TunnelTube />
      <EndCap />
      <Ribbons />
      <SpeedLines />
    </group>
  );
}
