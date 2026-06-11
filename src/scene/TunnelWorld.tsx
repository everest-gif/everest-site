import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, TUNNEL_Y, TUNNEL_LEN, AMBER, JADE } from './handles';
import { tunnelVert, tunnelFrag, speedlineVert, speedlineFrag } from './shaders/tunnel';

const amber = new THREE.Color(AMBER);
const jade = new THREE.Color(JADE);

function TunnelTube() {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.CylinderGeometry(3, 3, TUNNEL_LEN, 48, 1, true);
    g.rotateX(Math.PI / 2); /* axis along Z */
    const m = new THREE.ShaderMaterial({
      vertexShader: tunnelVert,
      fragmentShader: tunnelFrag,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uProgress: handles.tunnelProgress,
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

  /* camera flies +z→−z through the tube; far end (−z) is the arrival point */
  return <mesh geometry={geometry} material={material} position={[0, 0, -TUNNEL_LEN / 2 + 8]} />;
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
      const r = 1.1 + Math.random() * 1.6;
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
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -26), 40);
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
        uJade: { value: jade },
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
  const act = useStore((s) => s.act);
  const visible = act === 'boot' || act === 'breach' || act === 'reverse-breach';
  return (
    <group position={[0, TUNNEL_Y, 0]} visible={visible}>
      <TunnelTube />
      <SpeedLines />
    </group>
  );
}
