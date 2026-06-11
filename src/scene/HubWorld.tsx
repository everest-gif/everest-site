import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useStore, type NodeId } from '../state/store';
import { NODES, SECTORS } from '../content/nodes';
import { nodeScreens, coreScreen, HUB_Y, AMBER, JADE } from './handles';
import { coreVert, coreFrag, coronaVert, coronaFrag, pulseTrafficVert, pulseTrafficFrag } from './shaders/hub';
import type { PlanetBuild } from './planets/types';
import { makePlanet as makeJarvis } from './planets/jarvis';
import { makePlanet as makeLuven } from './planets/luven';
import { makePlanet as makeEmerge } from './planets/emerge';
import { makePlanet as makeDolomite } from './planets/dolomite';
import { makePlanet as makeEverclash } from './planets/everclash';
import { makePlanet as makeVoxhalla } from './planets/voxhalla';
import { makePlanet as makeBigback } from './planets/bigback';
import { makePlanet as makeBeyond } from './planets/beyond';

const amber = new THREE.Color(AMBER);
const jade = new THREE.Color(JADE);

const PLANET_FACTORY: Record<NodeId, () => PlanetBuild> = {
  jarvis: makeJarvis,
  luven: makeLuven,
  emerge: makeEmerge,
  dolomite: makeDolomite,
  everclash: makeEverclash,
  voxhalla: makeVoxhalla,
  bigback: makeBigback,
  beyond: makeBeyond,
};

/* world radius unit for planets — planet modules are built at local radius ≈1 */
const NODE_R = 0.16;

/* per-node reveal handles — staggered on hub arrival */
const reveals = NODES.map(() => ({ value: 0 }));
const coreReveal = { value: 0 };

/* preallocated scratch */
const _v = new THREE.Vector3();
const _nodePos = NODES.map(() => new THREE.Vector3());

const PULSE_SLOTS = 22;
const TRAIL = 5; /* head + 4 fading trail samples per pulse */

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

  /* ---------- core sun + corona ---------- */
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
    const coronaGeo = new THREE.SphereGeometry(0.85 * 1.3, 48, 32);
    const coronaMat = new THREE.ShaderMaterial({
      vertexShader: coronaVert,
      fragmentShader: coronaFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: amber },
        uReveal: coreReveal,
      },
    });
    return { geo, mat, coronaGeo, coronaMat };
  }, []);

  /* ---------- eight planets (R2.2) ---------- */
  const planets = useMemo(() => NODES.map((n) => PLANET_FACTORY[n.id]()), []);
  const hoverEase = useRef(NODES.map(() => ({ active: 0, dim: 0 })));
  useEffect(() => () => planets.forEach((p) => p.dispose()), [planets]);

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

  /* sector arc-text — canvas textures; glyph orientation flips by hemisphere so the
     bottom string never renders mirrored/inverted (R2.3) */
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
      const chars = text.split('');
      const bottom = Math.sin(centerAngle) < 0;
      /* top hemisphere: traverse clockwise (descending angle), glyph up = outward.
         bottom hemisphere: traverse ascending + flip glyphs, so reading stays left→right upright. */
      const a0 = bottom
        ? centerAngle - ((chars.length - 1) / 2) * spacing
        : centerAngle + ((chars.length - 1) / 2) * spacing;
      chars.forEach((ch, i) => {
        const a = bottom ? a0 + i * spacing : a0 - i * spacing;
        ctx.save();
        ctx.translate(SIZE / 2 + Math.cos(a) * rPx, SIZE / 2 - Math.sin(a) * rPx);
        ctx.rotate(bottom ? -Math.PI / 2 - a : Math.PI / 2 - a);
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

  /* upload the 1024² canvas textures during boot — first hub draw otherwise stalls ~30ms
     inside the arrival light-wrap */
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    for (const p of sectorPlanes) {
      const map = p.m.map;
      if (map) gl.initTexture(map);
    }
  }, [gl, sectorPlanes]);

  /* pulse traffic buffers — heads with fading trails (R2.3) */
  const traffic = useMemo(() => {
    const count = PULSE_SLOTS * TRAIL;
    const positions = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const kinds = new Float32Array(count);
    const heads = new Float32Array(count);
    for (let s = 0; s < PULSE_SLOTS; s++) {
      for (let k = 0; k < TRAIL; k++) heads[s * TRAIL + k] = k === 0 ? 1 : Math.max(0, 0.5 - k * 0.1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
    g.setAttribute('aHead', new THREE.BufferAttribute(heads, 1));
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
  useFrame((state, dt) => {
    const { hovered, reducedMotion } = useStore.getState();
    /* reduced motion: planets render static (R3) — freeze the clock they see */
    const t = reducedMotion ? 7.3 : state.clock.elapsedTime;
    core.mat.uniforms.uTime.value = t;
    core.coronaMat.uniforms.uTime.value = t;

    const hoveredIdx = hovered ? NODES.findIndex((n) => n.id === hovered) : -1;

    /* orbits */
    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i];
      const theta = n.phase + (reducedMotion ? 0 : t * n.speed);
      const ci = Math.cos(n.incline);
      const si = Math.sin(n.incline);
      const x = Math.cos(theta) * n.radius * fit.x;
      const y = Math.sin(theta) * n.radius * 0.94 * ci * fit.y;
      /* deeper z-spread so the drag-orbit lean produces real parallax (R2.3) */
      const z = Math.sin(theta) * n.radius * si * 1.8;
      _nodePos[i].set(x, y, z);

      const ease = hoverEase.current[i];
      ease.active += ((hoveredIdx === i ? 1 : 0) - ease.active) * 0.15;
      ease.dim += ((hoveredIdx !== -1 && hoveredIdx !== i ? 1 : 0) - ease.dim) * 0.15;

      const p = planets[i];
      p.group.position.copy(_nodePos[i]);
      /* hover: planet scales 1.15× (R2.3) */
      const sc = Math.max(0.0001, reveals[i].value) * NODE_R * p.baseScale * (1 + ease.active * 0.15);
      p.group.scale.setScalar(sc);
      p.update(t, dt, ease.active, ease.dim, reveals[i].value);

      /* thread endpoint */
      const tp = threads[i].g.getAttribute('position') as THREE.BufferAttribute;
      tp.setXYZ(1, x, y, z);
      tp.needsUpdate = true;
      const baseOp = hoveredIdx === i ? 0.85 : hoveredIdx !== -1 ? 0.07 : 0.16;
      threads[i].m.opacity += (baseOp * reveals[i].value - threads[i].m.opacity) * 0.18;
    }

    /* pulse traffic — irregular 0.8–4s per thread; trails follow heads (R2.3) */
    const { positions, alphas, kinds, slots, nextFire } = traffic;
    if (reducedMotion) {
      positions.fill(0);
      alphas.fill(0);
      for (let i = 0; i < NODES.length; i++) {
        const s = i * TRAIL; /* head point only, slow opacity tick */
        positions[s * 3] = _nodePos[i].x * 0.5;
        positions[s * 3 + 1] = _nodePos[i].y * 0.5;
        positions[s * 3 + 2] = _nodePos[i].z * 0.5;
        alphas[s] = (0.25 + 0.2 * Math.sin(state.clock.elapsedTime * 0.5 + i * 1.3)) * reveals[i].value;
        kinds[s] = i % 2;
      }
    } else {
      for (let i = 0; i < NODES.length; i++) {
        if (t >= nextFire[i] && reveals[i].value > 0.9) {
          const free = slots.find((sl) => !sl.active);
          if (free) {
            const si = slots.indexOf(free);
            free.active = true;
            free.node = i;
            free.dir = Math.random() < 0.55 ? 1 : -1;
            free.start = t;
            free.dur = 0.55 + Math.random() * 0.6;
            for (let k = 0; k < TRAIL; k++) kinds[si * TRAIL + k] = free.dir === 1 ? 0 : 1;
          }
          nextFire[i] = t + 0.8 + Math.random() * 3.2;
        }
      }
      for (let s = 0; s < PULSE_SLOTS; s++) {
        const sl = slots[s];
        if (!sl.active) {
          for (let k = 0; k < TRAIL; k++) {
            alphas[s * TRAIL + k] = 0;
            positions[(s * TRAIL + k) * 3 + 1] = -999;
          }
          continue;
        }
        const raw = (t - sl.start) / sl.dur;
        if (raw >= 1) {
          sl.active = false;
          for (let k = 0; k < TRAIL; k++) alphas[s * TRAIL + k] = 0;
          continue;
        }
        const np = _nodePos[sl.node];
        const fade = Math.max(0, Math.min(1, Math.min((t - sl.start) / 0.12, (sl.dur - (t - sl.start)) / 0.18)));
        for (let k = 0; k < TRAIL; k++) {
          let prog = raw - k * 0.05; /* trail samples behind the head */
          if (prog < 0) prog = 0;
          if (sl.dir === -1) prog = 1 - prog;
          const idx = s * TRAIL + k;
          positions[idx * 3] = np.x * prog;
          positions[idx * 3 + 1] = np.y * prog;
          positions[idx * 3 + 2] = np.z * prog;
          alphas[idx] = fade * (k === 0 ? 1 : 0.5 - k * 0.1);
        }
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
      <mesh geometry={core.coronaGeo} material={core.coronaMat} scale={fit.core} />
      {planets.map((p, i) => (
        <primitive key={NODES[i].id} object={p.group} />
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
      <points geometry={traffic.g} material={traffic.m} renderOrder={10} />
    </group>
  );
}
