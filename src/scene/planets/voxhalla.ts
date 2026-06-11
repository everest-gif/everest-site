import * as THREE from 'three';
import type { PlanetBuild } from './types';
import { PALETTE } from './types';
import { makeAtmosphere, gateHero } from './hero';

/* VOXHALLA — voxel hero shooter, no engine.
   Identity: a sphere voxelized into grid-snapped cubes — proudly blocky.
   One InstancedMesh (~240 cubes, 2880 tris, 1 draw call). Per-instance value
   carries the read: ink-to-graphite mass, a scattering of dim amber, 2–3
   bone-bright. Face shading is baked into the box's vertex colors (no lights
   needed). Slow single-body rotation; a precomputed schedule fires single-cube
   glints that flash and gaussian-decay. active: rotation +60%, glint rate ×3,
   amber cubes brighten toward full amber.

   S6 hero — lightest touch of the eight: per-voxel AO + sparse seam glow ticks
   injected into the same voxel shader (zero extra draw calls), one dusty
   atmosphere shell. 2 draw calls at hero, 1 in the hub. */

const CUBE = 0.165; //  cube edge, local units
const STEP = 0.175; //  voxel grid pitch
const SHELL_R = 0.85; // sphere radius the grid is carved against
const MAX_CUBES = 240; // 240 × 12 tris = 2880 ≤ 3000
const INTERIOR_P = 0.1; // interior sprinkle so silhouette gaps still read solid
const AMBER_P = 0.12;
const BRIGHT_N = 3;
const GLINT_EVERY = 1.5; // mean seconds between glints at rest
const GLINT_LIFE = 0.55; // seconds of decay
const MAX_GLINTS = 4;
const SCHED_N = 64;
const FLASH_R = 1.5,
  FLASH_G = 1.42,
  FLASH_B = 1.22; // glint peak (×face shade ≤1 → ≤1.5, under bloom-smear ceiling)

/* ---- S6 hero chunks, spliced into the voxel shader via onBeforeCompile ---- */

const heroVertPars = /* glsl */ `
varying vec3 vVox;
varying vec3 vLoc;
varying vec3 vNrm;
varying float vAO;
`;

const heroVertMain = /* glsl */ `
  vVox = vec3(instanceMatrix[3]);
  vLoc = position;
  vNrm = normal;
  /* radial depth + orientation: deep voxels and inward/down faces sit in shadow */
  float rad = length(vVox);
  vec3 outv = vVox / max(rad, 1e-4);
  float core = 1.0 - smoothstep(0.3, 1.0, rad * ${(1 / SHELL_R).toFixed(4)});
  float facing = 0.5 - 0.5 * dot(normal, outv);
  float down = 0.5 - 0.5 * normal.y;
  vAO = clamp(core * 0.55 + facing * 0.3 + down * 0.2, 0.0, 1.0);
`;

const heroFragPars = /* glsl */ `
uniform float uHero;
uniform float uTime;
uniform vec3 uAmber;
varying vec3 vVox;
varying vec3 vLoc;
varying vec3 vNrm;
varying float vAO;
`;

const heroFragMain = /* glsl */ `
  if (uHero > 0.001) {
    /* per-voxel AO — value only, ≤25% darkening */
    outgoingLight *= 1.0 - 0.25 * vAO * uHero;
    /* seam ticks: a hash off the voxel coords picks a sparse set; each glows up
       and dies over ~2s of its own slow cycle — a few alight at once, no strobe */
    float h = fract(sin(dot(vVox, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    if (h > 0.94) {
      float cyc = fract(uTime * 0.107 + h * 23.7);
      float gx = (cyc - 0.5) * 20.0;
      float env = exp(-gx * gx);
      vec3 q = abs(vLoc) * ${(2 / CUBE).toFixed(4)};
      q *= 1.0 - abs(vNrm); /* drop the face-normal axis, keep the two seam axes */
      float seam = smoothstep(0.82, 0.985, max(q.x, max(q.y, q.z)));
      /* diffuse.r carries dim·reveal — seams obey the same fades */
      outgoingLight += uAmber * (seam * env * 0.12 * uHero * diffuse.r);
    }
  }
`;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makePlanet(): PlanetBuild {
  const rng = mulberry32(0x70c5a11a);

  /* ---- carve the voxel shell on a fixed grid ---- */
  const cells: { x: number; y: number; z: number; shell: boolean }[] = [];
  const n = Math.ceil(SHELL_R / STEP);
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      for (let k = -n; k <= n; k++) {
        const x = i * STEP;
        const y = j * STEP;
        const z = k * STEP;
        const d = Math.sqrt(x * x + y * y + z * z);
        if (d > SHELL_R) continue;
        const shell = d > SHELL_R - STEP * 1.05;
        if (shell || rng() < INTERIOR_P) cells.push({ x, y, z, shell });
      }
    }
  }
  /* seeded Fisher–Yates, then take the budget — unbiased thinning */
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }
  const count = Math.min(cells.length, MAX_CUBES);

  /* ---- box with baked face shading (vertex colors), so cubes facet without lights ---- */
  const geometry = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  {
    const lx = 0.42,
      ly = 0.8,
      lz = 0.43; // normalized-ish key direction, baked
    const nrm = geometry.getAttribute('normal');
    const shadeArr = new Float32Array(nrm.count * 3);
    for (let v = 0; v < nrm.count; v++) {
      const dot = nrm.getX(v) * lx + nrm.getY(v) * ly + nrm.getZ(v) * lz;
      const s = 0.42 + 0.58 * Math.max(dot, 0);
      shadeArr[v * 3] = s;
      shadeArr[v * 3 + 1] = s;
      shadeArr[v * 3 + 2] = s;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(shadeArr, 3));
  }

  const material = new THREE.MeshBasicMaterial({ vertexColors: true });

  /* S6 hero lives inside the one voxel shader — dead branch until uHero rises,
     so the hub pays nothing and the boot precompiler owns the compile */
  const heroU = {
    uHero: { value: 0 },
    uTime: { value: 0 },
    uAmber: { value: new THREE.Color(PALETTE.amber) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, heroU);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>' + heroVertPars)
      .replace('#include <project_vertex>', '#include <project_vertex>' + heroVertMain);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>' + heroFragPars)
      .replace('#include <opaque_fragment>', heroFragMain + '#include <opaque_fragment>');
  };

  const mesh = new THREE.InstancedMesh(geometry, material, count);

  /* ---- place + color instances ---- */
  const bone = new THREE.Color(PALETTE.bone);
  const amber = new THREE.Color(PALETTE.amber);
  const m4 = new THREE.Matrix4();
  const c = new THREE.Color();
  const baseColors = new Float32Array(count * 3);
  const isAmber = new Uint8Array(count);
  const amberIdx: number[] = [];
  const shellIdx: number[] = [];

  let brightLeft = BRIGHT_N;
  for (let i = 0; i < count; i++) {
    const cell = cells[i];
    m4.makeTranslation(cell.x, cell.y, cell.z);
    mesh.setMatrixAt(i, m4);
    if (cell.shell) shellIdx.push(i);

    if (brightLeft > 0 && cell.shell && rng() < 0.025) {
      /* bone-bright beacon cube */
      brightLeft--;
      c.copy(bone).multiplyScalar(1.08);
    } else if (rng() < AMBER_P) {
      isAmber[i] = 1;
      amberIdx.push(i);
      c.copy(amber).multiplyScalar(0.5); // dim amber at rest
    } else {
      /* ink-to-graphite, skewed dark, faint bone warmth */
      const r = rng();
      c.copy(bone).multiplyScalar(0.07 + 0.24 * r * r);
    }
    baseColors[i * 3] = c.r;
    baseColors[i * 3 + 1] = c.g;
    baseColors[i * 3 + 2] = c.b;
    mesh.setColorAt(i, c);
  }
  mesh.instanceMatrix.needsUpdate = true;
  const instColor = mesh.instanceColor as THREE.InstancedBufferAttribute;
  instColor.setUsage(THREE.DynamicDrawUsage);
  const colorArr = instColor.array as Float32Array;

  /* ---- precomputed glint schedule (shell cubes only — always visible) ---- */
  const schedIdx = new Uint16Array(SCHED_N);
  const schedGap = new Float32Array(SCHED_N);
  for (let s = 0; s < SCHED_N; s++) {
    schedIdx[s] = shellIdx[Math.floor(rng() * shellIdx.length)];
    schedGap[s] = GLINT_EVERY * (0.6 + 0.8 * rng());
  }
  const glintAt = new Int32Array(MAX_GLINTS).fill(-1);
  const glintAge = new Float32Array(MAX_GLINTS);

  const group = new THREE.Group();
  const spin = new THREE.Group();
  spin.rotation.set(0.14, rng() * Math.PI * 2, 0.3); // tilted axis, character
  spin.scale.setScalar(1.06); // outer reach ≈ 1.0 incl. cube corners
  spin.add(mesh);
  group.add(spin);

  /* S6 hero — dusty bone atmosphere wrapping the blocky silhouette */
  const atmo = makeAtmosphere(0.95, '#C8B894', 0.7);
  group.add(atmo.mesh);
  const heroObjs = [atmo.mesh];
  const heroMats = [atmo.mat];

  /* ---- allocation-free update state ---- */
  let timer = 0;
  let schedPtr = 0;
  let lastActive = -1;
  let activeCur = 0;

  /* current target color of instance i (base × amber-boost), written in place */
  function writeEffective(i: number, env: number): void {
    const boost = isAmber[i] === 1 ? 1 + 0.9 * activeCur : 1;
    const i3 = i * 3;
    const r = baseColors[i3] * boost;
    const g = baseColors[i3 + 1] * boost;
    const b = baseColors[i3 + 2] * boost;
    colorArr[i3] = r + (FLASH_R - r) * env;
    colorArr[i3 + 1] = g + (FLASH_G - g) * env;
    colorArr[i3 + 2] = b + (FLASH_B - b) * env;
  }

  function update(t: number, dt: number, active: number, dim: number, reveal: number, hero: number): void {
    const step = Math.min(dt, 0.1);
    activeCur = active;

    /* one rigid body, slow spin, +60% when approached */
    spin.rotation.y += step * 0.12 * (1 + 0.6 * active);

    /* global value: dim → 40% of normal, reveal → arrival fade */
    material.color.setScalar((1 - 0.6 * dim) * reveal);

    let touched = false;

    /* amber cubes brighten with active — rewrite only while active is moving */
    if (Math.abs(active - lastActive) > 0.0015) {
      lastActive = active;
      for (let a = 0; a < amberIdx.length; a++) writeEffective(amberIdx[a], 0);
      touched = true;
    }

    /* spawn glints from the schedule; rate ×3 at full active */
    timer += step;
    if (timer >= schedGap[schedPtr] / (1 + 2 * active)) {
      timer = 0;
      const idx = schedIdx[schedPtr];
      schedPtr = (schedPtr + 1) % SCHED_N;
      let slot = -1;
      let dup = false;
      for (let s = 0; s < MAX_GLINTS; s++) {
        if (glintAt[s] === idx) dup = true;
        else if (glintAt[s] < 0) slot = s;
      }
      if (!dup && slot >= 0) {
        glintAt[slot] = idx;
        glintAge[slot] = 0;
      }
    }

    /* decay live glints — touches at most MAX_GLINTS instances per frame */
    for (let s = 0; s < MAX_GLINTS; s++) {
      const idx = glintAt[s];
      if (idx < 0) continue;
      glintAge[s] += step;
      const x = glintAge[s] / GLINT_LIFE;
      if (x > 1.15) {
        writeEffective(idx, 0);
        glintAt[s] = -1;
      } else {
        writeEffective(idx, Math.exp(-x * x * 4.5));
      }
      touched = true;
    }

    if (touched) instColor.needsUpdate = true;

    heroU.uTime.value = t;
    heroU.uHero.value = hero;
    gateHero(heroObjs, heroMats, hero);
  }

  function dispose(): void {
    geometry.dispose();
    material.dispose();
    mesh.dispose();
    atmo.dispose();
  }

  return { group, update, baseScale: 1, dispose };
}
