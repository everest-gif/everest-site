import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';
import { makeAtmosphere, gateHero } from './hero';

/* JARVIS — personal AI orchestrator.
   A near-black obsidian sphere: polished volcanic glass revealed only by a cold
   fresnel rim and a slowly drifting specular glint. Around it, two thin
   counter-rotating rings of tiny mono-glyphs — an orchestrator with satellites.

   Budget: body sphere ~1,536 tris · 156 glyph points · 3 draw calls. */

const BODY_R = 0.55;
const RING_A = { radius: 0.78, count: 72, speed: 0.16 }; /* rad/s, inner, prograde */
const RING_B = { radius: 0.95, count: 84, speed: -0.11 }; /* outer, retrograde */
const ACTIVE_SPEED_GAIN = 1.5; /* drive = 1 + 1.5·active → ×2.5 at full hover */

const GLYPHS = ['{', '}', '<', '>', '/', ';', '0', '1', '[', ']', '(', ')', '*', ':', '=', '#'];
const ATLAS = 256; /* 4×4 cells of 64px */

/* ---------- shaders ---------- */

const bodyVert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const bodyFrag = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uActive;
uniform float uDim;
uniform float uReveal;
uniform float uHero;
uniform vec3 uInk;
uniform vec3 uBone;
uniform vec3 uAmber;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);

  /* obsidian base — barely lifted off the void, slightly cool (scaled ink) */
  vec3 col = uInk * 1.7;

  /* cold fresnel rim — the silhouette carrier at 28px */
  float p = 1.0 - ndv;
  float rim = p * p * p;
  col += uBone * rim * (0.62 + 0.48 * uActive);

  /* glassy sheen — a tight glint that drifts slowly across the surface */
  float a = uTime * 0.12;
  vec3 l = normalize(vec3(cos(a) * 0.55, 0.62, 0.55 + sin(a) * 0.25));
  vec3 h = normalize(l + v);
  float q = 1.0 - clamp(dot(n, h), 0.0, 1.0);
  float glint = exp(-q * q * 900.0);        /* hard specular point */
  float satin = exp(-q * q * 28.0) * 0.10;  /* broad faint sheen */
  col += uBone * (glint * 0.85 + satin) * (0.7 + 0.3 * uActive);

  /* whisper of form light, kept inky so the body stays near-black */
  float ndl = clamp(dot(n, l), 0.0, 1.0);
  col += uInk * (ndl * ndl) * 1.1;

  /* S6 hero — faint subsurface circuit glints: a rectilinear trace lattice under
     the glass, only where the slow glint light grazes, only at chamber range */
  if (uHero > 0.001) {
    vec3 g = normalize(vN);
    /* rectilinear traces from the surface direction — manhattan bands */
    float tx = abs(fract(g.x * 9.0 + uTime * 0.015) - 0.5);
    float ty = abs(fract(g.y * 9.0 - uTime * 0.011) - 0.5);
    float trace = exp(-tx * tx * 340.0) + exp(-ty * ty * 340.0);
    /* junction pulses travelling the lattice */
    float pulse = 0.6 + 0.4 * sin(uTime * 1.7 + g.x * 21.0 + g.y * 17.0);
    float depthMask = pow(ndv, 1.6); /* glints live under the face, die at the limb */
    col += uAmber * trace * pulse * depthMask * 0.085 * uHero;
  }

  col *= mix(1.0, 0.4, uDim) * uReveal;
  gl_FragColor = vec4(col, 1.0);
}
`;

const glyphVert = /* glsl */ `
attribute vec2 aCell;
attribute float aSize;
attribute float aSeed;
uniform float uPx;
varying vec2 vCell;
varying float vSeed;
void main() {
  vCell = aCell;
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  /* respect HubWorld's group scaling (reveal × hover) via the matrix column */
  float sc = length(modelViewMatrix[0].xyz);
  gl_PointSize = clamp(aSize * uPx * sc / max(0.15, -mv.z), 1.0, 22.0);
  gl_Position = projectionMatrix * mv;
}
`;

const glyphFrag = /* glsl */ `
precision highp float;
uniform sampler2D uAtlas;
uniform vec3 uTint;
uniform float uGlow;
uniform float uTime;
varying vec2 vCell;
varying float vSeed;
void main() {
  /* aCell is the cell's lower-left UV; flip point-coord y into texture space */
  vec2 uv = vCell + vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y) * 0.25;
  float m = texture2D(uAtlas, uv).a;
  float tw = 0.78 + 0.22 * sin(uTime * 1.4 + vSeed * 6.2831);
  float a = m * uGlow * tw;
  gl_FragColor = vec4(uTint * a, a);
}
`;

/* ---------- helpers ---------- */

function drawAtlas(ctx: CanvasRenderingContext2D): void {
  const cell = ATLAS / 4;
  ctx.clearRect(0, 0, ATLAS, ATLAS);
  ctx.fillStyle = PALETTE.bone;
  ctx.font = '500 44px "JetBrains Mono Variable", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < GLYPHS.length; i++) {
    const cx = (i % 4) * cell + cell / 2;
    const cy = Math.floor(i / 4) * cell + cell / 2;
    ctx.fillText(GLYPHS[i], cx, cy);
  }
}

function buildRing(radius: number, count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const cells = new Float32Array(count * 2);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const step = (Math.PI * 2) / count;
  for (let i = 0; i < count; i++) {
    const a = i * step + (Math.random() - 0.5) * step * 0.7;
    const r = radius + (Math.random() - 0.5) * 0.035;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
    positions[i * 3 + 2] = Math.sin(a) * r;
    const cellIdx = Math.floor(Math.random() * 16);
    const col = cellIdx % 4;
    const row = Math.floor(cellIdx / 4);
    /* CanvasTexture flips Y: cell lower-left in UV space */
    cells[i * 2] = col * 0.25;
    cells[i * 2 + 1] = 1 - (row + 1) * 0.25;
    sizes[i] = 0.07 + Math.random() * 0.05;
    seeds[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('aCell', new THREE.BufferAttribute(cells, 2));
  g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius + 0.15);
  return g;
}

/* ---------- factory ---------- */

export function makePlanet(): PlanetBuild {
  const group = new THREE.Group();

  /* obsidian body — opaque, depth-writing solid */
  const bodyGeo = new THREE.SphereGeometry(BODY_R, 32, 24);
  const bodyMat = new THREE.ShaderMaterial({
    vertexShader: bodyVert,
    fragmentShader: bodyFrag,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uHero: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink) },
      uBone: { value: new THREE.Color(PALETTE.bone) },
      uAmber: { value: new THREE.Color(PALETTE.amber) },
    },
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  /* S6 hero — cold obsidian atmosphere, barely warm at the limb */
  const atmo = makeAtmosphere(BODY_R, '#B49B72', 0.7);
  group.add(atmo.mesh);

  /* glyph atlas — the one CanvasTexture the brief allows */
  const cv = document.createElement('canvas');
  cv.width = ATLAS;
  cv.height = ATLAS;
  const ctx = cv.getContext('2d')!;
  drawAtlas(ctx);
  const atlas = new THREE.CanvasTexture(cv);
  atlas.anisotropy = 2;
  let disposed = false;
  /* redraw once the mono variable font is actually loaded */
  try {
    document.fonts.ready
      .then(() => {
        if (disposed) return;
        drawAtlas(ctx);
        atlas.needsUpdate = true;
      })
      .catch(() => {});
  } catch {
    /* no FontFaceSet — fallback monospace atlas stands */
  }

  /* world-size → pixel-size factor for gl_PointSize (hub camera fov 50°) */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const uPx = (window.innerHeight / (2 * Math.tan((25 * Math.PI) / 180))) * dpr;

  const glyphMat = new THREE.ShaderMaterial({
    vertexShader: glyphVert,
    fragmentShader: glyphFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTint: { value: new THREE.Color(PALETTE.amber).lerp(new THREE.Color(PALETTE.bone), 0.45) },
      uGlow: { value: 0 },
      uTime: { value: 0 },
      uPx: { value: uPx },
    },
  });

  /* two rings: static tilt parents, spinning point clouds inside */
  const ringGeoA = buildRing(RING_A.radius, RING_A.count);
  const ringGeoB = buildRing(RING_B.radius, RING_B.count);
  const spinA = new THREE.Points(ringGeoA, glyphMat);
  const spinB = new THREE.Points(ringGeoB, glyphMat);
  const tiltA = new THREE.Group();
  const tiltB = new THREE.Group();
  tiltA.rotation.set(0.44, 0, 0.2);
  tiltB.rotation.set(-0.32, 0, -0.14);
  tiltA.add(spinA);
  tiltB.add(spinB);
  group.add(tiltA, tiltB);

  let angA = Math.random() * Math.PI * 2;
  let angB = Math.random() * Math.PI * 2;

  const update = (t: number, dt: number, active: number, dim: number, reveal: number, hero: number): void => {
    const d = Math.min(dt, 0.05);
    /* hero: the rings slow to a readable drift — micro-glyphs resolve legible */
    const drive = (1 + ACTIVE_SPEED_GAIN * active) * (1 - hero * 0.62);
    angA += d * RING_A.speed * drive;
    angB += d * RING_B.speed * drive;
    spinA.rotation.y = angA;
    spinB.rotation.y = angB;

    bodyMat.uniforms.uTime.value = t;
    bodyMat.uniforms.uActive.value = active;
    bodyMat.uniforms.uDim.value = dim;
    bodyMat.uniforms.uReveal.value = reveal;
    bodyMat.uniforms.uHero.value = hero;

    glyphMat.uniforms.uTime.value = t;
    /* base alpha 0.5 · ×1.5 brighter on active · toward 0.4 on dim · arrival fade;
       hero range brightens the glyphs into legibility */
    glyphMat.uniforms.uGlow.value = 0.5 * (1 + 0.5 * active + 0.5 * hero) * (1 - 0.6 * dim) * reveal;

    gateHero([atmo.mesh], [atmo.mat], hero);
  };

  const dispose = (): void => {
    disposed = true;
    bodyGeo.dispose();
    bodyMat.dispose();
    ringGeoA.dispose();
    ringGeoB.dispose();
    glyphMat.dispose();
    atlas.dispose();
    atmo.dispose();
  };

  return { group, update, baseScale: 1.15, dispose };
}
