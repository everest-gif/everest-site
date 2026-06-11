import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useStore } from '../state/store';
import { NODES, SECTORS } from '../content/nodes';
import { nodeScreens, coreScreen, HUB_Y, AMBER, JADE } from './handles';
import { coreVert, coreFrag, nodeVert, nodeFrag, pulseTrafficVert, pulseTrafficFrag } from './shaders/hub';

const amber = new THREE.Color(AMBER);
const jade = new THREE.Color(JADE);

/* per-node reveal handles — staggered on hub arrival */
const reveals = NODES.map(() => ({ value: 0 }));
const coreReveal = { value: 0 };

/* preallocated scratch */
const _v = new THREE.Vector3();
const _nodePos = NODES.map(() => new THREE.Vector3());

const PULSE_SLOTS = 22;

interface PulseSlot {
  node: number;
  dir: number; /* 1 core→node (instruction/amber), -1 node→core (report/jade) */
  start: number;
  dur: number;
  active: boolean;
}

function projectTo(anchor: { x: number; y: number; scale: number; visible: boolean; reveal: number }, pos: THREE.Vector3, camera: THREE.Camera, w: number, h: number, reveal: number) {
  _v.copy(pos).project(camera);
  anchor.x = (_v.x * 0.5 + 0.5) * w;
  anchor.y = (-_v.y * 0.5 + 0.5) * h;
  anchor.visible = _v.z < 1;
  anchor.reveal = reveal;
}

export default function HubWorld() {
  const act = useStore((s) => s.act);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const groupRef = useRef<THREE.Group>(null);
  const visible = act === 'boot' || act === 'hub' || act === 'chamber' || act === 'reverse-breach' || act === 'breach';
  const onStage = act === 'hub' || act === 'chamber';

  /* viewport fit — mobile reflows to a tall constellation (§9.5) */
  const fit = useMemo(() => {
    const dist = 8.4;
    const halfH = Math.tan(THREE.MathUtils.degToRad(25)) * dist;
    const halfW = halfH * (size.width / size.height);
    const maxR = 4.35;
    const xFit = Math.min(1, (halfW * 0.8) / (maxR + 0.7));
    const yFit = Math.min(1, (halfH * 0.8) / (maxR + 0.55));
    const coreScale = Math.min(1, Math.max(0.45, (xFit + yFit) * 0.62));
    return { x: xFit, y: yFit, core: coreScale };
  }, [size]);

  /* ---------- materials & geometries ---------- */
  const core = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.85, 48, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: coreVert,
      fragmentShader: coreFrag,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: amber },
        uReveal: coreReveal,
      },
    });
    return { geo, mat };
  }, []);

  const nodeMats = useMemo(
    () =>
      NODES.map(
        () =>
          new THREE.ShaderMaterial({
            vertexShader: nodeVert,
            fragmentShader: nodeFrag,
            uniforms: {
              uColor: { value: amber },
              uActive: { value: 0 },
              uDim: { value: 0 },
              uReveal: { value: 0 },
            },
          }),
      ),
    [],
  );
  const nodeGeo = useMemo(() => new THREE.SphereGeometry(0.16, 20, 14), []);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>(NODES.map(() => null));

  /* threads — one Line per node, 2 vertices, end updated per frame */
  const threads = useMemo(
    () =>
      NODES.map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const m = new THREE.LineBasicMaterial({ color: amber, transparent: true, opacity: 0.16, depthWrite: false });
        const line = new THREE.Line(g, m);
        line.frustumCulled = false;
        return { g, m, line };
      }),
    [],
  );

  /* orbit ring guides */
  const rings = useMemo(() => {
    const mk = (r: number) => {
      const pts: number[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(Math.cos(a) * r, Math.sin(a) * r, 0);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const m = new THREE.LineBasicMaterial({ color: amber, transparent: true, opacity: 0.07, depthWrite: false });
      return { g, m };
    };
    return [mk(2.5), mk(4.1)];
  }, []);

  /* sector arc-text — drawn into canvas textures with the self-hosted mono font */
  const sectorPlanes = useMemo(() => {
    const mk = (text: string, ringR: number, centerAngle: number) => {
      const SIZE = 1024;
      const cv = document.createElement('canvas');
      cv.width = SIZE;
      cv.height = SIZE;
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#EDE8DF';
      ctx.font = '500 26px "JetBrains Mono Variable", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const planeWorld = 10.2; /* world units the plane spans */
      const rPx = (ringR / planeWorld) * SIZE;
      const spacing = 0.052; /* radians per character */
      /* reading order runs clockwise — traverse angles descending or the text mirrors */
      const chars = text.split('');
      const a0 = centerAngle + ((chars.length - 1) / 2) * spacing;
      chars.forEach((ch, i) => {
        const a = a0 - i * spacing;
        ctx.save();
        ctx.translate(SIZE / 2 + Math.cos(a) * rPx, SIZE / 2 - Math.sin(a) * rPx);
        ctx.rotate(Math.PI / 2 - a);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.34, depthWrite: false });
      const g = new THREE.PlaneGeometry(planeWorld, planeWorld);
      return { g, m };
    };
    return [mk(SECTORS.inner, 2.5 + 0.22, Math.PI * 0.72), mk(SECTORS.outer, 4.1 + 0.22, Math.PI * 1.78)];
  }, []);

  /* pulse traffic buffers */
  const traffic = useMemo(() => {
    const positions = new Float32Array(PULSE_SLOTS * 3);
    const alphas = new Float32Array(PULSE_SLOTS);
    const kinds = new Float32Array(PULSE_SLOTS);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6);
    const m = new THREE.ShaderMaterial({
      vertexShader: pulseTrafficVert,
      fragmentShader: pulseTrafficFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uAmber: { value: amber }, uJade: { value: jade } },
    });
    const slots: PulseSlot[] = Array.from({ length: PULSE_SLOTS }, () => ({
      node: 0,
      dir: 1,
      start: 0,
      dur: 1,
      active: false,
    }));
    const nextFire = NODES.map((_, i) => 0.6 + i * 0.35 + Math.random() * 1.5);
    return { g, m, positions, alphas, kinds, slots, nextFire };
  }, []);

  /* reveal stagger on hub arrival — nodes materialize outward from the core in 0.6s (§2 Act II.4) */
  const revealed = useRef(false);
  useEffect(() => {
    if (onStage && !revealed.current) {
      revealed.current = true;
      const reduced = useStore.getState().reducedMotion;
      if (reduced) {
        coreReveal.value = 1;
        reveals.forEach((r) => (r.value = 1));
        return;
      }
      gsap.to(coreReveal, { value: 1, duration: 0.35, ease: 'power2.out' });
      gsap.to(reveals, { value: 1, duration: 0.4, ease: 'power2.out', stagger: 0.055, delay: 0.12 });
    } else if (!onStage && act === 'threshold') {
      revealed.current = false;
      coreReveal.value = 0;
      reveals.forEach((r) => (r.value = 0));
    }
  }, [onStage, act]);

  /* ---------- per-frame simulation ---------- */
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { hovered, reducedMotion } = useStore.getState();
    core.mat.uniforms.uTime.value = t;

    const hoveredIdx = hovered ? NODES.findIndex((n) => n.id === hovered) : -1;

    /* orbits */
    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i];
      const theta = n.phase + (reducedMotion ? 0 : t * n.speed);
      const ci = Math.cos(n.incline);
      const si = Math.sin(n.incline);
      const x = Math.cos(theta) * n.radius * fit.x;
      const y = Math.sin(theta) * n.radius * 0.94 * ci * fit.y;
      const z = Math.sin(theta) * n.radius * si * 0.8;
      _nodePos[i].set(x, y, z);
      const mesh = nodeRefs.current[i];
      if (mesh) {
        mesh.position.copy(_nodePos[i]);
        const sc = Math.max(0.0001, reveals[i].value) * (hoveredIdx === i ? 1.25 : 1);
        mesh.scale.setScalar(sc);
      }
      const mat = nodeMats[i];
      mat.uniforms.uActive.value += ((hoveredIdx === i ? 1 : 0) - mat.uniforms.uActive.value) * 0.15;
      mat.uniforms.uDim.value += ((hoveredIdx !== -1 && hoveredIdx !== i ? 1 : 0) - mat.uniforms.uDim.value) * 0.15;
      mat.uniforms.uReveal.value = reveals[i].value;

      /* thread endpoint */
      const tp = threads[i].g.getAttribute('position') as THREE.BufferAttribute;
      tp.setXYZ(1, x, y, z);
      tp.needsUpdate = true;
      const baseOp = hoveredIdx === i ? 0.85 : hoveredIdx !== -1 ? 0.07 : 0.16;
      threads[i].m.opacity += (baseOp * reveals[i].value - threads[i].m.opacity) * 0.18;
    }

    /* pulse traffic — irregular intervals 0.8–4s per thread; reduced motion = slow opacity ticks */
    const { positions, alphas, kinds, slots, nextFire } = traffic;
    if (reducedMotion) {
      for (let s = 0; s < PULSE_SLOTS; s++) {
        const i = s % NODES.length;
        positions[s * 3] = _nodePos[i].x * 0.5;
        positions[s * 3 + 1] = _nodePos[i].y * 0.5;
        positions[s * 3 + 2] = _nodePos[i].z * 0.5;
        alphas[s] = s < NODES.length ? (0.25 + 0.2 * Math.sin(t * 0.5 + i * 1.3)) * reveals[i].value : 0;
        kinds[s] = i % 2;
      }
    } else {
      for (let i = 0; i < NODES.length; i++) {
        if (t >= nextFire[i] && reveals[i].value > 0.9) {
          const free = slots.find((sl) => !sl.active);
          if (free) {
            free.active = true;
            free.node = i;
            free.dir = Math.random() < 0.55 ? 1 : -1;
            free.start = t;
            free.dur = 0.55 + Math.random() * 0.6;
            kinds[slots.indexOf(free)] = free.dir === 1 ? 0 : 1;
          }
          nextFire[i] = t + 0.8 + Math.random() * 3.2;
        }
      }
      for (let s = 0; s < PULSE_SLOTS; s++) {
        const sl = slots[s];
        if (!sl.active) {
          alphas[s] = 0;
          positions[s * 3 + 1] = -999;
          continue;
        }
        let prog = (t - sl.start) / sl.dur;
        if (prog >= 1) {
          sl.active = false;
          alphas[s] = 0;
          continue;
        }
        if (sl.dir === -1) prog = 1 - prog;
        const np = _nodePos[sl.node];
        positions[s * 3] = np.x * prog;
        positions[s * 3 + 1] = np.y * prog;
        positions[s * 3 + 2] = np.z * prog;
        const fade = Math.min(1, Math.min((t - sl.start) / 0.12, (sl.dur - (t - sl.start)) / 0.18));
        alphas[s] = Math.max(0, fade) * 0.95;
      }
    }
    (traffic.g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (traffic.g.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    (traffic.g.getAttribute('aKind') as THREE.BufferAttribute).needsUpdate = true;

    /* project anchors for the DOM overlay */
    if (onStage) {
      const g = groupRef.current;
      if (g) {
        for (let i = 0; i < NODES.length; i++) {
          _v.copy(_nodePos[i]);
          g.localToWorld(_v);
          const anchor = nodeScreens[NODES[i].id];
          if (anchor) projectTo(anchor, _v, camera, size.width, size.height, reveals[i].value);
        }
        _v.set(0, 0, 0);
        g.localToWorld(_v);
        _v.y -= 1.15 * fit.core;
        projectTo(coreScreen, _v, camera, size.width, size.height, coreReveal.value);
        coreScreen.visible = coreScreen.visible && onStage;
      }
    } else {
      coreScreen.visible = false;
      for (const id of Object.keys(nodeScreens)) nodeScreens[id].visible = false;
    }
  });

  /* register anchors once */
  useEffect(() => {
    for (const n of NODES) {
      nodeScreens[n.id] = nodeScreens[n.id] ?? { x: 0, y: 0, scale: 1, visible: false, reveal: 0 };
    }
  }, []);

  return (
    <group ref={groupRef} position={[0, HUB_Y, 0]} visible={visible}>
      <mesh geometry={core.geo} material={core.mat} scale={fit.core} />
      {NODES.map((n, i) => (
        <mesh
          key={n.id}
          geometry={nodeGeo}
          material={nodeMats[i]}
          ref={(m) => {
            nodeRefs.current[i] = m;
          }}
        />
      ))}
      {threads.map((th, i) => (
        <primitive key={NODES[i].id} object={th.line} />
      ))}
      {rings.map((r, i) => (
        <lineLoop key={i} geometry={r.g} material={r.m} scale={[fit.x, fit.y * 0.94, 1]} />
      ))}
      {sectorPlanes.map((p, i) => (
        <mesh key={i} geometry={p.g} material={p.m} scale={[fit.x, fit.y * 0.94, 1]} position={[0, 0, 0.05]} />
      ))}
      <points geometry={traffic.g} material={traffic.m} />
    </group>
  );
}
