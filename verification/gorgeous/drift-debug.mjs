/* OFFLINE tuning harness for the M5 anti-overlap solver — mirrors orbits.ts math.
   The SHIPPED verification is window.__driftAudit (runs the real bundle); this file
   exists only to iterate orbit constants fast. Keep the math in sync with orbits.ts. */

const NODES = [
  { id: 'jarvis', radius: 2.2, speed: 0.072, phase: 0.4, incline: 0.05 },
  { id: 'luven', radius: 2.4, speed: 0.058, phase: 1.9, incline: -0.04 },
  { id: 'emerge', radius: 2.62, speed: 0.064, phase: 3.5, incline: 0.04 },
  { id: 'dolomite', radius: 2.85, speed: 0.08, phase: 5.1, incline: -0.04 },
  { id: 'everclash', radius: 4.1, speed: 0.042, phase: 0.9, incline: 0.07 },
  { id: 'voxhalla', radius: 4.42, speed: 0.035, phase: 2.4, incline: -0.06 },
  { id: 'bigback', radius: 4.14, speed: 0.05, phase: 4.0, incline: 0.05 },
  { id: 'beyond', radius: 4.28, speed: 0.046, phase: 5.6, incline: -0.045 },
];

/* baseScales from planet modules (approx; jewelry-pass values) */
const BASE = [1.15, 1.0, 0.9, 0.85, 1.05, 1.0, 0.8, 0.95];
const NODE_R = 0.19;
const vis = BASE.map((b) => NODE_R * b * 1.1);
const CAM = 8.4;
const fit = { x: 0.993, y: 0.639 }; /* 1440×900 */
const MIN_HIT = 0.55;

const posFor = (i, th, out) => {
  const n = NODES[i];
  out.x = Math.cos(th) * n.radius * fit.x;
  out.y = Math.sin(th) * n.radius * 0.94 * Math.cos(n.incline) * fit.y;
  out.z = Math.sin(th) * n.radius * Math.sin(n.incline) * 1.8;
};

const P = NODES.map(() => ({ x: 0, y: 0, z: 0 }));
const off = new Float64Array(NODES.length);
const thetas = new Array(NODES.length).fill(0);

function step(t, dt) {
  for (let i = 0; i < NODES.length; i++) {
    thetas[i] = NODES[i].phase + t * NODES[i].speed + off[i];
    posFor(i, thetas[i], P[i]);
  }
  const wrapPi = (a) => ((a % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  const sameRing = (i, j) => (NODES[i].radius < 3) === (NODES[j].radius < 3);
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const minD = Math.max(vis[i] + vis[j] + 0.12, MIN_HIT);
      if (sameRing(i, j)) {
        /* co-rotating ring-mates: hold a minimum ANGULAR spacing */
        const bMin = Math.min(fit.x, fit.y * 0.94) * Math.min(NODES[i].radius, NODES[j].radius);
        const need = (minD / bMin) * 1.28;
        const dAng = wrapPi(thetas[i] - thetas[j]);
        if (Math.abs(dAng) < need) {
          const push = (need - Math.abs(dAng)) * 1.6 * dt;
          const sg = dAng >= 0 ? 1 : -1;
          off[i] += sg * push;
          off[j] -= sg * push;
        }
        continue;
      }
      /* cross-ring backstop on projected proximity */
      const ki = CAM / (CAM - P[i].z);
      const kj = CAM / (CAM - P[j].z);
      const dx = P[i].x * ki - P[j].x * kj;
      const dy = P[i].y * ki - P[j].y * kj;
      const d = Math.hypot(dx, dy);
      const detect = minD * 1.8;
      if (d >= detect) continue;
      const prox = 1 - d / detect;
      const hard = d < minD ? minD - d : 0;
      for (const [a, b] of [[i, j], [j, i]]) {
        const ownDir = NODES[a].speed >= 0 ? 1 : -1;
        const fasterA = Math.abs(NODES[a].speed) >= Math.abs(NODES[b].speed);
        const shear = fasterA ? ownDir : -ownDir;
        off[a] += shear * (prox * prox * 1.2 + hard * 3.0) * dt;
      }
    }
  }
  for (let i = 0; i < NODES.length; i++) {
    const o = off[i];
    const rate = Math.min(0.1 * Math.abs(o), 0.05); /* bounded spring-back */
    off[i] -= Math.sign(o) * rate * dt;
  }
}

let minGap = Infinity;
let minSep = Infinity;
let worst = '';
let maxOff = 0;
const dt = 1 / 60;
for (let s = 0; s < 900 * 60; s++) {
  const t = s * dt;
  step(t, dt);
  for (const o of off) maxOff = Math.max(maxOff, Math.abs(o));
  if (t < 3) continue;
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const ki = CAM / (CAM - P[i].z);
      const kj = CAM / (CAM - P[j].z);
      const d = Math.hypot(P[i].x * ki - P[j].x * kj, P[i].y * ki - P[j].y * kj);
      const gap = d - (vis[i] * ki + vis[j] * kj);
      if (gap < minGap) {
        minGap = gap;
        worst = `${NODES[i].id}·${NODES[j].id}@${t.toFixed(1)}s`;
      }
      if (d < minSep) minSep = d;
    }
  }
}
console.log(
  JSON.stringify({ minGap: +minGap.toFixed(3), minSep: +minSep.toFixed(3), worst, maxOff: +maxOff.toFixed(3) }),
);
