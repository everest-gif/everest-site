import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useStore } from '../state/store';
import { handles, AMBER } from './handles';
import { terrainVert, terrainFrag, pulseVert, pulseFrag, seamVert, seamFrag } from './shaders/terrain';
import { fogVert, fogFrag, starVert, starFrag, skyVert, skyFrag } from './shaders/atmosphere';
import { seasonU, seasonGlobals, mixSeasonGlobals, SEASON_IDX } from './season';
import SeasonParticles from './SeasonParticles';
import AscentField from './AscentField';

/* Layer recipe: 4 depth planes, each its own seed/amplitude/brightness — far layers dimmer, taller.
   The front layer runs past the camera's bottom ray (M3 full-bleed: no dead band). */
const LAYERS = [
  { z: -8, amp: 3.4, freq: 0.085, seed: 1.0, fade: 0.62, width: 56, segX: 200, segY: 46, depth: 27 },
  { z: -13.5, amp: 5.0, freq: 0.07, seed: 2.0, fade: 0.44, width: 70, segX: 180, segY: 30, depth: 18 },
  { z: -20, amp: 6.6, freq: 0.058, seed: 3.0, fade: 0.3, width: 86, segX: 150, segY: 26, depth: 18 },
  { z: -27.5, amp: 8.4, freq: 0.05, seed: 4.0, fade: 0.2, width: 106, segX: 120, segY: 22, depth: 18 },
];

const seasonShaderU = () => ({
  uSeasonFrom: seasonU.from,
  uSeasonTo: seasonU.to,
  uSeasonFront: seasonU.front,
  uSeasonEdge: seasonU.edge,
});

/* Drift speeds diverge strongly per depth (R6) — the parallax must be visible. */
const FOGS = [
  { z: -10.5, y: 1.6, w: 64, h: 9, seed: 0.7, opacity: 0.14, drift: 0.024 },
  { z: -14.6, y: 3.2, w: 82, h: 11, seed: 1.9, opacity: 0.12, drift: -0.012 },
  { z: -23.5, y: 3.8, w: 100, h: 13, seed: 3.2, opacity: 0.1, drift: 0.005 },
];

const amberColor = new THREE.Color(AMBER);

function TerrainLayer({ cfg }: { cfg: (typeof LAYERS)[number] }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(cfg.width, cfg.depth, cfg.segX, cfg.segY);
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
          ...seasonShaderU(),
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
    const src = new THREE.PlaneGeometry(cfg.width, cfg.depth, cfg.segX, cfg.segY);
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
        uFade: handles.thresholdFade,
        ...seasonShaderU(),
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
          uTint: seasonGlobals.fogTint,
        },
      }),
    [cfg],
  );
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    /* season density: winter thickens the haze, spring thins it (M3) */
    material.uniforms.uOpacity.value = cfg.opacity * handles.thresholdFade.value * seasonGlobals.fogMul.value;
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
        uSharp: seasonGlobals.starSharp,
        uHorizon: seasonGlobals.starHorizon,
        uFade: handles.starFade,
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points geometry={geometry} material={material} />;
}

/* S1 — no shroud behind the wound: the split opens onto SKY. Through the parted
   halves you see stars — the system you are about to climb to was there all along. */

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

/* M3 — faint horizon glow behind the back ridge (spring pre-dawn / autumn haze / winter cast) */
function SkyGlow() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: seasonGlobals.skyColor,
          uIntensity: { value: 0 },
        },
      }),
    [],
  );
  useFrame(() => {
    material.uniforms.uIntensity.value = seasonGlobals.skyIntensity.value * handles.thresholdFade.value;
  });
  return (
    <mesh material={material} position={[0, 12, -33.2]}>
      <planeGeometry args={[130, 30, 1, 1]} />
    </mesh>
  );
}

/* M3 — the reconstruction transition: a season change sweeps a soft-edged weather
   front across the terrain left→right over ~1.4s. Reduced motion: the same uniform
   path with an enormous edge width reads as a plain 250ms crossfade. */
function SeasonDriver() {
  const season = useStore((s) => s.season);
  const prev = useRef(season);

  useEffect(() => {
    if (import.meta.env.DEV || window.location.search.includes('scrub')) {
      (window as unknown as Record<string, unknown>).__seasonU = seasonU;
    }
  }, []);

  useEffect(() => {
    if (prev.current === season) {
      /* initial mount — settle directly into the persisted season */
      seasonU.from.value = seasonU.to.value = SEASON_IDX[season];
      seasonU.front.value = 1;
      mixSeasonGlobals();
      return;
    }
    const reduced = useStore.getState().reducedMotion;
    gsap.killTweensOf(seasonU.front);
    seasonU.from.value = SEASON_IDX[prev.current];
    seasonU.to.value = SEASON_IDX[season];
    seasonU.edge.value = reduced ? 400 : 2.2;
    seasonU.front.value = 0;
    gsap.to(seasonU.front, {
      value: 1,
      duration: reduced ? 0.25 : 1.4,
      ease: reduced ? 'none' : 'power2.inOut',
      onComplete: () => {
        seasonU.from.value = SEASON_IDX[season];
      },
    });
    prev.current = season;
  }, [season]);

  useFrame(() => {
    mixSeasonGlobals();
  });

  return null;
}

export default function ThresholdWorld() {
  const act = useStore((s) => s.act);
  const visible = act === 'boot' || act === 'threshold' || act === 'breach' || act === 'reverse-breach';

  return (
    <group visible={visible}>
      {LAYERS.map((cfg) => (
        <TerrainLayer key={cfg.seed} cfg={cfg} />
      ))}
      <PulsePoints cfg={LAYERS[0]} count={200} />
      <PulsePoints cfg={LAYERS[1]} count={130} />
      {FOGS.map((cfg) => (
        <FogSheet key={cfg.seed} cfg={cfg} />
      ))}
      <Stars />
      <SkyGlow />
      <SeasonParticles />
      <SeasonDriver />
      <SeamLight />
      <AscentField />
    </group>
  );
}
