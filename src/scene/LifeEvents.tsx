import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
import { handles, BONE, INK } from './handles';
import { GLSL_NOISE } from './shaders/noise';
import { GLSL_TERRAIN_COMMON } from './shaders/terrain';

/* ============================================================
   S2 — ambient life. Every 8–20s one subtle silhouette event,
   season-matched, always a shadow-form at low contrast:
   NIGHT shooting star / owl glide · WINTER hawk circling ·
   SPRING bird flock · AUTUMN geese V. Rare (≤1 per 45s): an elk
   walking the far ridgeline, feet welded to the layer-3 height
   field. Three draws, built once — a 7-point bird sprite system,
   one shader-positioned streak, one SDF quad. Every event is a
   one-shot with randomized parameters; nothing visibly loops.
   Reduced motion: no events, nothing rendered.
   ============================================================ */

const FLY_N = 7;
/* layer-3 recipe from ThresholdWorld LAYERS — the elk's ridgeline */
const RIDGE = { z: -20, amp: 6.6, freq: 0.058, seed: 3.0 };
/* depth of the elk quad in layer-local coords; world z = RIDGE.z + this */
const ELK_LOCAL_Z = 2.0;

const K_NONE = 0;
const K_FLOCK = 1;
const K_GEESE = 2;
const K_HAWK = 3;
const K_OWL = 4;
const K_STAR = 5;
const K_ELK = 6;

const TAU = Math.PI * 2;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const cubicInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sm01 = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
/* one-shot envelope — smooth in/out over the first/last k of the event */
const env01 = (p: number, k: number) => sm01(p / k) * sm01((1 - p) / k);

/* ---------- flyers: one Points draw, the sprite is a flapping chevron ---------- */
const flyVert = /* glsl */ `
attribute float aIdx;
uniform float uTime;
uniform float uFlapHz;
uniform float uFlapAmp;
uniform float uDihedral;
uniform float uSize;
uniform float uPx;
varying float vDip;

void main() {
  /* per-bird flap phase from the index — the flock never beats in unison */
  vDip = uDihedral + sin(uTime * uFlapHz * 6.28318 + aIdx * 1.93) * uFlapAmp;
  float h = fract(aIdx * 0.618034);
  gl_PointSize = uSize * uPx * (0.85 + 0.3 * h);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const flyFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vDip;

void main() {
  vec2 p = (gl_PointCoord - 0.5) * vec2(2.0, -2.0); /* y up */
  float u = abs(p.x);
  /* two shallow wing arcs meeting at the body point; dihedral flaps via vDip */
  float wing = vDip * u + 0.42 * u * u;
  float d = abs(p.y - wing) - mix(0.13, 0.04, u);
  d = min(d, length(vec2(p.x * 1.25, p.y - wing * 0.2)) - 0.16); /* small body mass */
  float m = (1.0 - smoothstep(0.0, 0.2, d)) * (1.0 - smoothstep(0.78, 1.0, u));
  float a = m * uAlpha;
  if (a < 0.012) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* ---------- shooting star: verts live on the GPU, CPU only moves the head ---------- */
const starVert = /* glsl */ `
attribute float aT;
uniform vec3 uHead;
uniform vec3 uDir;
uniform float uLen;
varying float vT;

void main() {
  vT = aT;
  vec3 p = uHead - uDir * (aT * uLen);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const starFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vT;

void main() {
  float tail = 1.0 - vT;
  float a = uAlpha * tail * tail;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* ---------- elk: SDF silhouette quad riding the layer-3 height field ---------- */
const elkVert = /* glsl */ `
${GLSL_NOISE}
${GLSL_TERRAIN_COMMON}

uniform float uWalkX;
varying vec2 vP;

void main() {
  vP = position.xy;
  /* feet welded to the ridgeline: ground sampled at the walk x, layer-local depth */
  float g = heightAt(vec2(uWalkX, ${ELK_LOCAL_Z.toFixed(1)})) * uAmp;
  vec3 p = vec3(position.x + uWalkX, position.y + 0.36 + g, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const elkFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uTime;
uniform float uDirX;
varying vec2 vP;

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h);
}
/* approximate ellipse distance — fine for a soft far-field edge */
float sdEll(vec2 p, vec2 c, vec2 r) {
  return (length((p - c) / r) - 1.0) * min(r.x, r.y);
}
float smin2(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  vec2 q = vec2(vP.x * uDirX, vP.y); /* face the walk direction */
  /* walk cycle — diagonal leg pairs in antiphase, ≤8° sweep; body bobs at 2× step */
  float sw = sin(uTime * 9.4) * 0.13;
  vec2 qb = vec2(q.x, q.y - sin(uTime * 18.8) * 0.008);
  /* torso → neck → small head → muzzle, smooth-joined; no eyes, no outline */
  float d = sdEll(qb, vec2(-0.03, 0.05), vec2(0.30, 0.12));
  d = smin2(d, sdSeg(qb, vec2(0.19, 0.10), vec2(0.325, 0.235)) - 0.05, 0.05);
  d = smin2(d, sdEll(qb, vec2(0.345, 0.255), vec2(0.07, 0.045)), 0.03);
  d = smin2(d, sdSeg(qb, vec2(0.37, 0.25), vec2(0.44, 0.225)) - 0.02, 0.025);
  /* two short antler strokes */
  d = min(d, sdSeg(qb, vec2(0.335, 0.29), vec2(0.255, 0.375)) - 0.011);
  d = min(d, sdSeg(qb, vec2(0.355, 0.295), vec2(0.315, 0.385)) - 0.01);
  /* four thin legs to the quad's ground line */
  d = min(d, sdSeg(q, vec2(0.205, -0.05), vec2(0.205 + sw * 0.34, -0.40)) - 0.017);
  d = min(d, sdSeg(q, vec2(0.15, -0.05), vec2(0.15 - sw * 0.34, -0.40)) - 0.015);
  d = min(d, sdSeg(q, vec2(-0.15, -0.05), vec2(-0.15 + sw * 0.34, -0.40)) - 0.017);
  d = min(d, sdSeg(q, vec2(-0.205, -0.05), vec2(-0.205 - sw * 0.34, -0.40)) - 0.015);
  float a = (1.0 - smoothstep(0.0, 0.012, d)) * uAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

export default function LifeEvents() {
  const reduced = useStore((s) => s.reducedMotion);

  const fly = useMemo(() => {
    const pts = new Float32Array(FLY_N * 3);
    const idx = new Float32Array(FLY_N);
    for (let i = 0; i < FLY_N; i++) {
      pts[i * 3 + 1] = -999; /* parked until an event claims them */
      idx[i] = i;
    }
    const g = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(pts, 3);
    pos.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', pos);
    g.setAttribute('aIdx', new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 9, 0), 60);
    const m = new THREE.ShaderMaterial({
      vertexShader: flyVert,
      fragmentShader: flyFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uFlapHz: { value: 3 },
        uFlapAmp: { value: 0.4 },
        uDihedral: { value: 0 },
        uSize: { value: 4.5 },
        uPx: { value: 1 },
        uAlpha: { value: 0 },
        /* near-ink — a shadow against the sky, not a sprite */
        uColor: { value: new THREE.Color(INK).multiplyScalar(2.2) },
      },
    });
    return { geometry: g, material: m, pos };
  }, []);

  const star = useMemo(() => {
    const SEG = 7;
    const pts = new Float32Array(SEG * 2 * 3); /* shader-positioned; stays zero */
    const ts = new Float32Array(SEG * 2);
    for (let i = 0; i < SEG; i++) {
      ts[i * 2] = i / SEG;
      ts[i * 2 + 1] = (i + 1) / SEG;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(ts, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 14, 0), 50);
    const head = new THREE.Vector3(0, -999, 0);
    const dir = new THREE.Vector3(1, 0, 0);
    const m = new THREE.ShaderMaterial({
      vertexShader: starVert,
      fragmentShader: starFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uHead: { value: head },
        uDir: { value: dir },
        uLen: { value: 3.2 },
        uAlpha: { value: 0 },
        uColor: { value: new THREE.Color(BONE) },
      },
    });
    return { geometry: g, material: m, head, dir };
  }, []);

  const elk = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.1, 0.8, 1, 1);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 30);
    const m = new THREE.ShaderMaterial({
      vertexShader: elkVert,
      fragmentShader: elkFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uAmp: { value: RIDGE.amp },
        uFreq: { value: RIDGE.freq },
        uSeed: { value: RIDGE.seed },
        uSeam: handles.seam,
        uWalkX: { value: 0 },
        uTime: { value: 0 },
        uAlpha: { value: 0 },
        uDirX: { value: 1 },
        uColor: { value: new THREE.Color(INK).multiplyScalar(1.2) },
      },
    });
    return { geometry: g, material: m };
  }, []);

  /* per-bird offsets, refilled (never reallocated) at each event start */
  const offs = useMemo(() => new Float32Array(FLY_N * 3), []);

  const S = useRef({
    nextAt: 9,
    elkReadyAt: 30, /* the rare walker holds back for the opening half-minute */
    kind: K_NONE,
    t0: 0,
    dur: 1,
    x0: 0,
    dx: 0,
    y0: 0,
    drift: 0,
    dir: 1,
    phase: 0,
  }).current;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const st = useStore.getState();
    const fU = fly.material.uniforms;
    const sU = star.material.uniforms;
    const eU = elk.material.uniforms;

    if (st.reducedMotion) {
      S.kind = K_NONE;
      S.nextAt = t + 12;
      fU.uAlpha.value = 0;
      sU.uAlpha.value = 0;
      eU.uAlpha.value = 0;
      return;
    }

    fU.uTime.value = t;
    fU.uPx.value = state.gl.getPixelRatio();
    eU.uTime.value = t;
    const fade = handles.thresholdFade.value;

    if (S.kind === K_NONE) {
      if (st.act !== 'threshold') {
        /* scheduler pauses off-threshold; a quiet beat is owed on return */
        S.nextAt = Math.max(S.nextAt, t + 6);
        return;
      }
      if (t < S.nextAt) return;

      /* fire one event */
      S.t0 = t;
      S.nextAt = t + 8 + Math.random() * 12;
      S.dir = Math.random() < 0.5 ? 1 : -1;
      S.phase = Math.random() * TAU;

      if (t >= S.elkReadyAt && Math.random() < 0.35) {
        /* the rare one — takes the slot the sky event would have had */
        S.kind = K_ELK;
        S.elkReadyAt = t + 45;
        S.dur = rnd(6, 8);
        S.x0 = rnd(-9, 9) - S.dir * 3.5;
        S.dx = S.dir * 7;
        eU.uDirX.value = S.dir;
      } else if (st.season === 'night' && Math.random() < 0.6) {
        /* the one bright event — a star, not a shadow; small and quick */
        S.kind = K_STAR;
        S.dur = rnd(0.6, 0.9);
        S.x0 = rnd(-16, 16);
        S.dx = S.dir * rnd(8, 12);
        S.drift = rnd(-2, 2);
        const len = Math.hypot(S.dx, 7);
        star.dir.set(S.dx / len, -7 / len, 0);
        sU.uLen.value = rnd(2.6, 4);
      } else if (st.season === 'night') {
        S.kind = K_OWL;
        S.dur = rnd(7, 9);
        S.y0 = rnd(6.5, 8.5);
        fU.uFlapHz.value = 1.2;
        fU.uFlapAmp.value = 0.58;
        fU.uDihedral.value = 0;
        fU.uSize.value = 8;
        for (let i = 1; i < FLY_N; i++) fly.pos.setXYZ(i, 0, -999, 0);
      } else if (st.season === 'winter') {
        S.kind = K_HAWK;
        S.dur = rnd(10, 12);
        S.x0 = rnd(-8, 8);
        S.y0 = rnd(10.5, 11.8);
        S.drift = S.dir * rnd(2.5, 4.5);
        fU.uFlapHz.value = 0.5; /* wings locked in the soar — a slight rock only */
        fU.uFlapAmp.value = 0.06;
        fU.uDihedral.value = 0.18;
        fU.uSize.value = 4.5;
        for (let i = 1; i < FLY_N; i++) fly.pos.setXYZ(i, 0, -999, 0);
      } else if (st.season === 'spring') {
        S.kind = K_FLOCK;
        S.dur = rnd(6, 9);
        S.y0 = rnd(6, 10);
        for (let i = 0; i < FLY_N; i++) {
          offs[i * 3] = rnd(-1.6, 1.6);
          offs[i * 3 + 1] = rnd(-0.7, 0.7);
          offs[i * 3 + 2] = rnd(-1.2, 1.2);
        }
        fU.uFlapHz.value = 3.1;
        fU.uFlapAmp.value = 0.42;
        fU.uDihedral.value = 0.05;
        fU.uSize.value = 4.5;
      } else {
        S.kind = K_GEESE;
        S.dur = rnd(9, 12);
        S.y0 = rnd(9, 11.5);
        for (let i = 0; i < FLY_N * 3; i++) offs[i] = rnd(-0.08, 0.08);
        fU.uFlapHz.value = 1.5;
        fU.uFlapAmp.value = 0.3;
        fU.uDihedral.value = 0.1;
        fU.uSize.value = 5.2;
      }
      return;
    }

    /* drive the active event — runs to completion even if the act changes
       mid-flight (thresholdFade kills the alpha during the ascent) */
    const te = t - S.t0;
    const p = te / S.dur;
    if (p >= 1) {
      S.kind = K_NONE;
      fU.uAlpha.value = 0;
      sU.uAlpha.value = 0;
      eU.uAlpha.value = 0;
      for (let i = 0; i < FLY_N; i++) fly.pos.setXYZ(i, 0, -999, 0);
      fly.pos.needsUpdate = true;
      S.nextAt = Math.max(S.nextAt, t + 4); /* a quiet beat between events */
      return;
    }

    switch (S.kind) {
      case K_FLOCK: {
        /* loose cluster crossing mid-frame, individual flutter per bird */
        const lead = S.dir * (-30 + 60 * cubicInOut(p));
        for (let i = 0; i < FLY_N; i++) {
          fly.pos.setXYZ(
            i,
            lead + offs[i * 3],
            S.y0 + offs[i * 3 + 1] + Math.sin(t * 2.7 + i * 2.39) * 0.2,
            offs[i * 3 + 2],
          );
        }
        fly.pos.needsUpdate = true;
        fU.uAlpha.value = env01(p, 0.1) * fade * 0.55;
        break;
      }
      case K_GEESE: {
        /* V formation on a steady track — near-linear, gently eased */
        const e = p + (cubicInOut(p) - p) * 0.35;
        const lead = S.dir * (-32 + 64 * e);
        for (let i = 0; i < FLY_N; i++) {
          const row = (i + 1) >> 1;
          const side = i % 2 === 0 ? 1 : -1;
          fly.pos.setXYZ(
            i,
            lead - S.dir * row * 0.55 + offs[i * 3],
            S.y0 - row * 0.06 + side * row * 0.16 + offs[i * 3 + 1] + Math.sin(t * 1.5 + i * 1.7) * 0.05,
            offs[i * 3 + 2],
          );
        }
        fly.pos.needsUpdate = true;
        fU.uAlpha.value = env01(p, 0.08) * fade * 0.55;
        break;
      }
      case K_HAWK: {
        /* 2.5 slow loops high up, drifting laterally across the circle */
        const ang = S.phase + p * 2.5 * TAU;
        const cx = S.x0 + S.drift * (p - 0.5);
        fly.pos.setXYZ(0, cx + Math.cos(ang) * 3, S.y0 + Math.sin(ang) * 0.85, Math.sin(ang + 1.2) * 1.2);
        fly.pos.needsUpdate = true;
        fU.uAlpha.value = env01(p, 0.12) * fade * 0.5;
        break;
      }
      case K_OWL: {
        /* slow glide with a gentle bob synced to the deep flap */
        const e = p + (cubicInOut(p) - p) * 0.5;
        fly.pos.setXYZ(
          0,
          S.dir * (-17 + 34 * e),
          S.y0 + Math.sin(t * 7.54 + S.phase) * 0.12 + Math.sin(t * 0.6) * 0.25,
          0,
        );
        fly.pos.needsUpdate = true;
        fU.uAlpha.value = env01(p, 0.12) * fade * 0.55;
        break;
      }
      case K_STAR: {
        const pe = 1 - (1 - p) * (1 - p) * (1 - p);
        star.head.set(S.x0 + S.dx * pe, 18 - 7 * pe, S.drift);
        sU.uAlpha.value = Math.sin(Math.PI * p) * fade * 0.85;
        break;
      }
      case K_ELK: {
        const e = p + (cubicInOut(p) - p) * 0.3;
        eU.uWalkX.value = S.x0 + S.dx * e;
        eU.uAlpha.value = sm01(te / 0.8) * sm01((S.dur - te) / 0.8) * fade * 0.8;
        break;
      }
    }
  });

  if (reduced) return null;
  return (
    <group>
      {/* flyers ride the parallax band between layers 2 and 3 */}
      <points geometry={fly.geometry} material={fly.material} position={[0, 0, -16]} frustumCulled={false} />
      <lineSegments geometry={star.geometry} material={star.material} position={[0, 0, -31]} frustumCulled={false} />
      {/* far-ridge walker — world z −18 = layer-3 local depth 2.0 */}
      <mesh
        geometry={elk.geometry}
        material={elk.material}
        position={[0, 0, RIDGE.z + ELK_LOCAL_Z]}
        frustumCulled={false}
      />
    </group>
  );
}
