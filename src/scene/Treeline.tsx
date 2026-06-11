import { useMemo } from 'react';
import * as THREE from 'three';
import { handles, AMBER } from './handles';
import { GLSL_NOISE } from './shaders/noise';
import { GLSL_TERRAIN_COMMON } from './shaders/terrain';
import { seasonU, GLSL_SEASON } from './season';

/* S2 — the treeline: sparse instanced pine silhouettes welded to the front two
   terrain planes. A treeline, not a forest: the shader culls anything above the
   lower slopes, so the crests stay bare wireframe. Same ground math as the
   terrain (shared chunk) — trees and rock can never drift apart. */
const GLSL_GROUND = `${GLSL_TERRAIN_COMMON}\n${GLSL_SEASON}`;

const treeVert = /* glsl */ `
${GLSL_NOISE}
${GLSL_GROUND}
attribute vec2 aBase;
attribute float aScale;
attribute float aSeed;
varying float vY;
varying float vWorldX;
varying float vDist;
varying float vTone;

void main() {
  float h = heightAt(aBase);
  /* the treeline BAND: the lower slopes where the wireframe glows — silhouettes
     need lit lines behind them to cut. Never the flat floor (teepees on a
     parking lot), never the crests (bare wireframe). */
  float hN = clamp(h, 0.0, 1.4) / 1.4;
  float keep = smoothstep(0.1, 0.2, hN) * (1.0 - smoothstep(0.5, 0.64, hN));
  /* base welded to the ground, riding the seam split exactly like the wireframe */
  vec3 base = vec3(aBase.x, h * uAmp, aBase.y);
  base = displaceSeam(base);
  /* tiny per-tree lean — silhouettes, never clip art */
  float lean = (hash11(aSeed * 3.91) - 0.5) * 0.24;
  float sl = sin(lean);
  float cl = cos(lean);
  vec3 off = position * (aScale * keep);
  off = vec3(off.x * cl - off.y * sl, off.x * sl + off.y * cl, off.z);
  vY = position.y;
  vTone = 0.82 + 0.36 * hash11(aSeed * 7.77);
  vec4 world = modelMatrix * vec4(base + off, 1.0);
  vWorldX = world.x;
  vDist = length(world.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const treeFrag = /* glsl */ `
${GLSL_SEASON}
uniform vec3 uColor;
uniform float uFade;
uniform float uLayerFade;
varying float vY;
varying float vWorldX;
varying float vDist;
varying float vTone;

/* TRUE silhouettes: darker than the sky ink, light-absent forms cut into the
   wireframe (sRGB encode lifts linear darks hard — 0.06 linear reads mid-grey) */
vec3 bodyCol(float s, float y) {
  vec3 ink = vec3(0.039, 0.039, 0.047);
  if (s < 0.5) {
    /* NIGHT */
    return ink * 0.55;
  } else if (s < 1.5) {
    /* WINTER — a dusting on the upper cone, never a painted white tree */
    float dust = smoothstep(0.62, 1.0, y);
    return mix(ink * 0.6, vec3(0.14, 0.165, 0.21), dust * 0.5);
  } else if (s < 2.5) {
    /* SPRING — faint jade buds toward the tips */
    float bud = smoothstep(0.6, 1.0, y);
    return mix(ink * 0.55, vec3(0.22, 0.85, 0.66) * 0.16, bud * 0.5);
  }
  /* AUTUMN — warmed rust, still a shadow */
  return mix(ink * 0.55, vec3(0.62, 0.21, 0.07) * 0.35, 0.18);
}

/* the top of each cone catches a hint of the wireframe glow */
vec3 tipCol(float s) {
  if (s < 0.5) return uColor;
  if (s < 1.5) return vec3(0.93, 0.91, 0.875);
  if (s < 2.5) return vec3(0.22, 0.85, 0.66);
  return uColor;
}

void main() {
  float k = seasonCoverage(vWorldX);
  vec3 col = mix(bodyCol(uSeasonFrom, vY), bodyCol(uSeasonTo, vY), k) * vTone;
  float tip = smoothstep(0.88, 1.0, vY);
  col += mix(tipCol(uSeasonFrom), tipCol(uSeasonTo), k) * tip * 0.22;
  col += vec3(0.93, 0.91, 0.875) * seasonShimmer(vWorldX) * 0.2;
  float depthFade = 1.0 - smoothstep(16.0, 56.0, vDist) * 0.45;
  /* melt near the lens like the terrain's near-fade — no giant foreground cones */
  float nearFade = smoothstep(2.4, 6.0, vDist);
  float a = uFade * uLayerFade * depthFade * nearFade;
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}
`;

/* Two stands matching the front two LAYERS in ThresholdWorld — same amp/freq/seed
   so heightAt lands on the exact same ground. Placement slightly inset from the
   plane extents; the shader decides which trees survive. */
const STANDS = [
  { z: -8, amp: 3.4, freq: 0.085, seed: 1.0, count: 150, xMax: 27, zMax: 13, sMin: 0.45, sMax: 0.9, alpha: 0.95 },
  { z: -13.5, amp: 5.0, freq: 0.07, seed: 2.0, count: 100, xMax: 34, zMax: 8.5, sMin: 0.6, sMax: 1.15, alpha: 0.75 },
];

const amberColor = new THREE.Color(AMBER);

function TreeStand({ cfg }: { cfg: (typeof STANDS)[number] }) {
  const { geometry, material } = useMemo(() => {
    const cone = new THREE.ConeGeometry(0.3, 1, 6);
    cone.translate(0, 0.5, 0); /* base at y=0 — the weld point */
    const g = new THREE.InstancedBufferGeometry();
    g.index = cone.index;
    g.setAttribute('position', cone.getAttribute('position'));
    g.instanceCount = cfg.count;
    const base = new Float32Array(cfg.count * 2);
    const scale = new Float32Array(cfg.count);
    const seed = new Float32Array(cfg.count);
    for (let i = 0; i < cfg.count; i++) {
      base[i * 2] = (Math.random() * 2 - 1) * cfg.xMax;
      base[i * 2 + 1] = (Math.random() * 2 - 1) * cfg.zMax;
      scale[i] = cfg.sMin + Math.random() * (cfg.sMax - cfg.sMin);
      seed[i] = Math.random() * 1000;
    }
    g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 2));
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(scale, 1));
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
    /* generous bound — the seam peel pushes trees ±8 in x; culling must never pop them */
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 3, 0), cfg.xMax + 18);
    const m = new THREE.ShaderMaterial({
      vertexShader: treeVert,
      fragmentShader: treeFrag,
      transparent: true,
      depthWrite: true, /* silhouettes occlude the wireframe behind them — not additive */
      uniforms: {
        uAmp: { value: cfg.amp },
        uFreq: { value: cfg.freq },
        uSeed: { value: cfg.seed },
        uSeam: handles.seam,
        uColor: { value: amberColor },
        uFade: handles.thresholdFade,
        uLayerFade: { value: cfg.alpha },
        uSeasonFrom: seasonU.from,
        uSeasonTo: seasonU.to,
        uSeasonFront: seasonU.front,
        uSeasonEdge: seasonU.edge,
      },
    });
    return { geometry: g, material: m };
  }, [cfg]);

  return <mesh geometry={geometry} material={material} position={[0, 0, cfg.z]} />;
}

export default function Treeline() {
  return (
    <>
      {STANDS.map((cfg) => (
        <TreeStand key={cfg.seed} cfg={cfg} />
      ))}
    </>
  );
}
