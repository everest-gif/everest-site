import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useStore, type NodeId } from '../state/store';
import { NODES } from '../content/nodes';
import { nodeScreens, coreScreen, nodeWorld, nodeRadius, HUB_Y, AMBER, JADE } from './handles';
import {
  coreVert,
  coreFrag,
  coronaVert,
  coronaFrag,
  pulseTrafficVert,
  pulseTrafficFrag,
  rimVert,
  rimFrag,
  nebulaVert,
  nebulaFrag,
} from './shaders/hub';
import { starVert, starFrag } from './shaders/atmosphere';
import { createDriftState, stepDrift, driftAudit } from './orbits';
import type { PlanetBuild } from './planets/types';
import { makePlanet as makeJarvis } from './planets/jarvis';
import { makePlanet as makeLuven } from './planets/luven';
import { makePlanet as makeEmerge } from './planets/emerge';
import { makePlanet as makeDolomite } from './planets/dolomite';
import { makePlanet as makeEverclash } from './planets/everclash';
import { makePlanet as makeVoxhalla } from './planets/voxhalla';
import { makePlanet as makeBigback } from './planets/bigback';
import { makePlanet as makeBeyond } from './planets/beyond';
import MilkyWay from './MilkyWay';

const amber = new THREE.Color(AMBER);
const jade = new THREE.Color(JADE);
const warmAmber = new THREE.Color('#F5C97E'); /* M5 — pulse-warmed thread tint */

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

/* world radius unit for planets — planet modules are built at local radius ≈1.
   M5: +19% so identity reads at rest distance. */
const NODE_R = 0.19;

/* minimum projected center separation (world units at rest camera) — 56px hit floor */
const MIN_HIT_SEP = 0.5;

/* per-node reveal handles — staggered on hub arrival */
const reveals = NODES.map(() => ({ value: 0 }));
const coreReveal = { value: 0 };
let revealStarted = false;

/* S1 — the system resolves DURING the ascent's arrival beat: the timeline calls this
   as the climb eases (sun fades up ahead, planets stagger into their orbits). The
   component's own effect calls it too (deep links, skip-intro) — idempotent. */
export function beginHubReveal(): void {
  if (revealStarted) return;
  revealStarted = true;
  if (useStore.getState().reducedMotion) {
    coreReveal.value = 1;
    reveals.forEach((r) => (r.value = 1));
    return;
  }
  gsap.to(coreReveal, { value: 1, duration: 0.35, ease: 'power2.out' });
  gsap.to(reveals, { value: 1, duration: 0.4, ease: 'power2.out', stagger: 0.055, delay: 0.12 });
}

function resetHubReveal(): void {
  revealStarted = false;
  gsap.killTweensOf(coreReveal);
  reveals.forEach((r) => gsap.killTweensOf(r));
  coreReveal.value = 0;
  reveals.forEach((r) => (r.value = 0));
}

/* S1 — mid-climb the sun is already a faint warm point far overhead: the destination
   exists before it resolves. beginHubReveal later completes the fade from here. */
export function hubPreGlow(value: number, duration: number): void {
  if (revealStarted) return;
  gsap.to(coreReveal, { value, duration, ease: 'power1.inOut', overwrite: true });
}

/* preallocated scratch */
const _v = new THREE.Vector3();
const _nodePos = NODES.map(() => new THREE.Vector3());

const PULSE_SLOTS = 22;
const TRAIL = 9; /* head + 8 fading trail samples — a comet you can follow (M5) */

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
    const maxR = 4.42;
    const xFit = Math.min(1, (halfW * 0.8) / (maxR + 0.7));
    const yFit = Math.min(1, (halfH * 0.8) / (maxR + 0.55));
    const coreScale = Math.min(1, Math.max(0.45, (xFit + yFit) * 0.62));
    return { x: xFit, y: yFit, core: coreScale };
  }, [size]);

  /* ---------- core sun + billboard corona (M5 — zero banding) ---------- */
  const coreMeshRef = useRef<THREE.Mesh>(null);
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
    /* coreR 0.40 in billboard units → plane half-width 0.85/0.40 */
    const coronaGeo = new THREE.PlaneGeometry((0.85 / 0.4) * 2, (0.85 / 0.4) * 2);
    const coronaMat = new THREE.ShaderMaterial({
      vertexShader: coronaVert,
      fragmentShader: coronaFrag,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: amber },
        uReveal: coreReveal,
      },
    });
    return { geo, mat, coronaGeo, coronaMat };
  }, []);
  const coronaRef = useRef<THREE.Mesh>(null);

  /* ---------- universe backdrop: starfield + FBM nebula (M5) ---------- */
  const backdrop = useMemo(() => {
    const count = 620;
    const pts = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      /* shell distribution surrounding the system — parallax comes free with drag-orbit */
      const r = 26 + Math.random() * 44;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      pts[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pts[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
      pts[i * 3 + 2] = -Math.abs(r * Math.cos(ph)) - 4; /* behind the system */
      seeds[i] = Math.random() * 1000;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    starGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const starMat = new THREE.ShaderMaterial({
      vertexShader: starVert,
      fragmentShader: starFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#EDE8DF') },
        uSharp: { value: 0 },
        uHorizon: { value: 0 },
        /* S1 — the cosmos fades in with the system as the climb tops out */
        uFade: coreReveal,
      },
    });
    const nebMat = new THREE.ShaderMaterial({
      vertexShader: nebulaVert,
      fragmentShader: nebulaFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAmber: { value: amber },
        uJade: { value: jade },
        uReveal: coreReveal,
      },
    });
    return { starGeo, starMat, nebMat };
  }, []);

  /* ---------- eight planets (R2.2) ---------- */
  const planets = useMemo(() => NODES.map((n) => PLANET_FACTORY[n.id]()), []);
  const hoverEase = useRef(NODES.map(() => ({ active: 0, dim: 0, hero: 0 })));
  useEffect(() => () => planets.forEach((p) => p.dispose()), [planets]);

  /* M5 — sunward rim light: one additive shell per planet, child of its group */
  const rims = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.16, 32, 24);
    return NODES.map(() => {
      const m = new THREE.ShaderMaterial({
        vertexShader: rimVert,
        fragmentShader: rimFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: amber },
          uSunDir: { value: new THREE.Vector3(1, 0, 0) },
          uReveal: { value: 0 },
          uBoost: { value: 0 },
        },
      });
      return { mesh: new THREE.Mesh(geo, m), m };
    });
  }, []);
  useEffect(() => {
    for (let i = 0; i < NODES.length; i++) planets[i].group.add(rims[i].mesh);
    return () => {
      for (let i = 0; i < NODES.length; i++) planets[i].group.remove(rims[i].mesh);
    };
  }, [planets, rims]);

  /* threads — one Line per node; a vertex-color gradient keeps them brightest
     near the core (M2 "sun light touches threads"), end updated per frame */
  const threads = useMemo(
    () =>
      NODES.map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0.32, 0.32, 0.32]), 3));
        const m = new THREE.LineBasicMaterial({
          color: amber,
          vertexColors: true,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        });
        const line = new THREE.Line(g, m);
        line.frustumCulled = false;
        return { g, m, line, warm: 0 };
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
    return [mk(2.52), mk(4.26)];
  }, []);

  /* M5 — orbit arc-text DELETED: the grouping moved to the INDEX overlay, and the
     canvas-texture glyphs were bleeding into chamber views. */

  /* pulse traffic buffers — 3px comet heads with long fading trails (M5) */
  const traffic = useMemo(() => {
    const count = PULSE_SLOTS * TRAIL;
    const positions = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const kinds = new Float32Array(count);
    const heads = new Float32Array(count);
    for (let s = 0; s < PULSE_SLOTS; s++) {
      for (let k = 0; k < TRAIL; k++) heads[s * TRAIL + k] = k === 0 ? 1 : Math.max(0, 0.62 - k * 0.075);
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

  /* reveal stagger on arrival — nodes materialize outward from the core (§2 Act II.4).
     During the ascent the timeline starts this early (the system resolves up ahead);
     this effect covers deep links and skip-intro, and resets once back on the ground. */
  useEffect(() => {
    if (onStage) beginHubReveal();
    else if (act === 'threshold') resetHubReveal();
  }, [onStage, act]);

  /* M5 anti-overlap — the solver owns the angles; offsets ease apart on close passes */
  const drift = useRef(createDriftState());
  const driftThetas = useRef(NODES.map(() => 0));
  const driftSettled = useRef(false);
  const visRadii = useMemo(() => planets.map((p) => NODE_R * p.baseScale * 1.1), [planets]);

  useEffect(() => {
    if (import.meta.env.DEV || window.location.search.includes('scrub')) {
      (window as unknown as Record<string, unknown>).__driftAudit = (seconds = 300) =>
        driftAudit(fit, visRadii, MIN_HIT_SEP, seconds);
    }
  }, [fit, visRadii]);

  /* ---------- per-frame simulation ---------- */
  useFrame((state, dt) => {
    const { hovered, reducedMotion, chamber, act: actNow } = useStore.getState();
    /* reduced motion: planets render static (R3) — freeze the clock they see */
    const t = reducedMotion ? 7.3 : state.clock.elapsedTime;
    core.mat.uniforms.uTime.value = t;
    core.coronaMat.uniforms.uTime.value = t;
    backdrop.starMat.uniforms.uTime.value = t;
    backdrop.nebMat.uniforms.uTime.value = t;
    /* billboard corona — always faces the lens (no shell geometry to band) */
    if (coronaRef.current) coronaRef.current.quaternion.copy(camera.quaternion);
    /* S1 — pre-reveal the opaque sun would read as a black disc occluding stars
       during the climb; rings ride the same reveal */
    if (coreMeshRef.current) coreMeshRef.current.visible = coreReveal.value > 0.002;
    for (const r of rings) r.m.opacity = 0.07 * coreReveal.value;

    /* hover targets the hovered node; an open chamber keeps its planet fully lit + lively */
    const focusId = actNow === 'chamber' ? chamber : hovered;
    const hoveredIdx = focusId ? NODES.findIndex((n) => n.id === focusId) : -1;

    /* orbit angles via the anti-overlap solver; reduced motion settles once, statically */
    if (reducedMotion) {
      if (!driftSettled.current) {
        driftSettled.current = true;
        for (let k = 0; k < 240; k++)
          stepDrift(drift.current, 7.3, 1 / 60, fit, visRadii, MIN_HIT_SEP, driftThetas.current);
      }
      stepDrift(drift.current, 7.3, 0, fit, visRadii, MIN_HIT_SEP, driftThetas.current);
    } else {
      stepDrift(drift.current, t, Math.min(dt, 0.05), fit, visRadii, MIN_HIT_SEP, driftThetas.current);
    }

    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i];
      const theta = driftThetas.current[i];
      const ci = Math.cos(n.incline);
      const si = Math.sin(n.incline);
      const x = Math.cos(theta) * n.radius * fit.x;
      const y = Math.sin(theta) * n.radius * 0.94 * ci * fit.y;
      /* deeper z-spread so the drag-orbit lean produces real parallax (R2.3) */
      const z = Math.sin(theta) * n.radius * si * 1.8;
      _nodePos[i].set(x, y, z);

      const ease = hoverEase.current[i];
      /* chamber hero stays lively but not maxed — close range amplifies everything */
      const activeTarget = hoveredIdx === i ? (actNow === 'chamber' ? 0.7 : 1) : 0;
      ease.active += (activeTarget - ease.active) * 0.15;
      ease.dim += ((hoveredIdx !== -1 && hoveredIdx !== i ? 1 : 0) - ease.dim) * 0.15;
      /* S6 — hero LOD eases in as the chamber dolly lands (≈0.4s), out on leave */
      const heroTarget = actNow === 'chamber' && chamber === NODES[i].id ? 1 : 0;
      ease.hero += (heroTarget - ease.hero) * Math.min(1, dt * 6);

      const p = planets[i];
      p.group.position.copy(_nodePos[i]);
      /* hover: planet scales 1.15× (R2.3) — not while it is the chamber hero */
      const hoverScale = actNow === 'chamber' ? 1 : 1 + ease.active * 0.15;
      const sc = Math.max(0.0001, reveals[i].value) * NODE_R * p.baseScale * hoverScale;
      p.group.scale.setScalar(sc);
      p.update(t, dt, ease.active, ease.dim, reveals[i].value, ease.hero);
      /* M5 — sunward rim: light arrives from the core (local origin) */
      const rim = rims[i];
      (rim.m.uniforms.uSunDir.value as THREE.Vector3).copy(_nodePos[i]).multiplyScalar(-1).normalize();
      rim.m.uniforms.uReveal.value = reveals[i].value * (1 - ease.dim * 0.6);
      rim.m.uniforms.uBoost.value = ease.active;
      /* live world position for the flight rig (R3) */
      const nw = nodeWorld[NODES[i].id];
      if (nw && groupRef.current) {
        nw.copy(_nodePos[i]);
        groupRef.current.localToWorld(nw);
      }

      /* thread endpoint */
      const tp = threads[i].g.getAttribute('position') as THREE.BufferAttribute;
      tp.setXYZ(1, x, y, z);
      tp.needsUpdate = true;
      /* in a chamber the bright thread would slice the hero shot — keep it a whisper */
      const hotOp = actNow === 'chamber' ? 0.22 : 0.85;
      const baseOp = hoveredIdx === i ? hotOp : hoveredIdx !== -1 ? 0.07 : 0.16;
      /* M5 — the thread warms as a pulse passes, cools after */
      const th = threads[i];
      th.warm *= Math.exp(-dt * 2.2);
      th.m.opacity += ((baseOp + th.warm * 0.4) * reveals[i].value - th.m.opacity) * 0.18;
      th.m.color.copy(amber).lerp(warmAmber, Math.min(1, th.warm));
    }

    /* pulse traffic — slow enough to follow with the eyes (M5: 1.4–2.2s per run) */
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
            free.dur = 1.4 + Math.random() * 0.8;
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
        const fade = Math.max(0, Math.min(1, Math.min((t - sl.start) / 0.16, (sl.dur - (t - sl.start)) / 0.22)));
        /* ease-in-out along the thread (M5) — a traveler, not a tracer round */
        const eased = raw * raw * (3 - 2 * raw);
        threads[sl.node].warm = Math.max(threads[sl.node].warm, fade * 0.9);
        for (let k = 0; k < TRAIL; k++) {
          let prog = eased - k * 0.019; /* tight trail samples — a comet, not a dashed line */
          if (prog < 0) prog = 0;
          if (sl.dir === -1) prog = 1 - prog;
          const idx = s * TRAIL + k;
          positions[idx * 3] = np.x * prog;
          positions[idx * 3 + 1] = np.y * prog;
          positions[idx * 3 + 2] = np.z * prog;
          alphas[idx] = fade * (k === 0 ? 1 : 0.55 - k * 0.06);
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

  /* register anchors + flight bridges once */
  useEffect(() => {
    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i];
      nodeScreens[n.id] = nodeScreens[n.id] ?? { x: 0, y: 0, scale: 1, visible: false, reveal: 0 };
      nodeWorld[n.id] = nodeWorld[n.id] ?? new THREE.Vector3();
      nodeRadius[n.id] = NODE_R * planets[i].baseScale;
    }
  }, [planets]);

  return (
    <group ref={groupRef} position={[0, HUB_Y, 0]} visible={visible}>
      {/* universe backdrop — the system floats somewhere, not in void (M5/S3) */}
      <MilkyWay reveal={coreReveal} />
      <points geometry={backdrop.starGeo} material={backdrop.starMat} renderOrder={-2} frustumCulled={false} />
      <mesh material={backdrop.nebMat} position={[0, 0, -34]} renderOrder={-1}>
        <planeGeometry args={[150, 90, 1, 1]} />
      </mesh>
      <mesh ref={coreMeshRef} geometry={core.geo} material={core.mat} scale={fit.core} />
      <mesh ref={coronaRef} geometry={core.coronaGeo} material={core.coronaMat} scale={fit.core} renderOrder={5} />
      {planets.map((p, i) => (
        <primitive key={NODES[i].id} object={p.group} />
      ))}
      {threads.map((th, i) => (
        <primitive key={NODES[i].id} object={th.line} />
      ))}
      {rings.map((r, i) => (
        <lineLoop key={i} geometry={r.g} material={r.m} scale={[fit.x, fit.y * 0.94, 1]} />
      ))}
      <points geometry={traffic.g} material={traffic.m} renderOrder={10} />
    </group>
  );
}
