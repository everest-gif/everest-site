import { NODES } from '../content/nodes';

/* ============================================================
   M5 anti-overlap — a pure orbital solver with soft repulsion.
   Planets ride their base ellipses; per-planet angular offsets push
   apart whenever two bodies' PERSPECTIVE-PROJECTED discs (camera at
   rest distance) approach, and spring softly back to zero otherwise.
   Pure + deterministic so the 5-minute drift audit steps the exact
   math the hub ships with (window.__driftSim in scrub builds).
   ============================================================ */

export const CAM_DIST = 8.4; /* hub rest camera z */

export interface Fit {
  x: number;
  y: number;
}

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface DriftState {
  off: Float64Array;
}

export function createDriftState(): DriftState {
  return { off: new Float64Array(NODES.length) };
}

export function posFor(i: number, theta: number, fit: Fit, out: Vec3Like): void {
  const n = NODES[i];
  const ci = Math.cos(n.incline);
  const si = Math.sin(n.incline);
  out.x = Math.cos(theta) * n.radius * fit.x;
  out.y = Math.sin(theta) * n.radius * 0.94 * ci * fit.y;
  /* deeper z-spread so the drag-orbit lean produces real parallax (R2.3) */
  out.z = Math.sin(theta) * n.radius * si * 1.8;
}

const _p: Vec3Like[] = NODES.map(() => ({ x: 0, y: 0, z: 0 }));

const wrapPi = (a: number): number => ((a % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

/* one solver step: writes final angles into thetas, positions into out[].
   vis = per-planet visual radius (world units); minHit = minimum projected
   center separation in world units (hit-area guarantee at rest distance). */
export function stepDrift(
  state: DriftState,
  t: number,
  dt: number,
  fit: Fit,
  vis: number[],
  minHit: number,
  thetas: number[],
  out?: Vec3Like[],
): void {
  const n = NODES.length;
  for (let i = 0; i < n; i++) {
    thetas[i] = NODES[i].phase + t * NODES[i].speed + state.off[i];
    posFor(i, thetas[i], fit, _p[i]);
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const minD = Math.max(vis[i] + vis[j] + 0.12, minHit);
      if (NODES[i].ring === NODES[j].ring) {
        /* co-rotating ring-mates: hold a minimum ANGULAR spacing. The metric is
           the ellipse's MINOR axis — at the sides, angle compresses by fit.y·0.94.
           This is the only invariant that survives lapping traffic: the faster
           body simply carries its neighbours ahead of it (snowplow), and the
           bounded spring below can never out-pull the controller. */
        const bMin = Math.min(fit.x, fit.y * 0.94) * Math.min(NODES[i].radius, NODES[j].radius);
        const need = (minD / bMin) * 1.28;
        const dAng = wrapPi(thetas[i] - thetas[j]);
        if (Math.abs(dAng) < need) {
          const push = (need - Math.abs(dAng)) * 1.6 * dt;
          const sg = dAng >= 0 ? 1 : -1;
          state.off[i] += sg * push;
          state.off[j] -= sg * push;
        }
        continue;
      }
      /* cross-ring pairs: the annuli are separated by construction (nodes.ts radii
         + small inclines); a projected-proximity time-shift remains as a backstop —
         the faster body is accelerated through the pass, the slower one braked. */
      const ki = CAM_DIST / (CAM_DIST - _p[i].z);
      const kj = CAM_DIST / (CAM_DIST - _p[j].z);
      const dx = _p[i].x * ki - _p[j].x * kj;
      const dy = _p[i].y * ki - _p[j].y * kj;
      const d = Math.hypot(dx, dy);
      const detect = minD * 1.8;
      if (d >= detect) continue;
      const prox = 1 - d / detect;
      const hard = d < minD ? minD - d : 0;
      for (const [a, b] of [
        [i, j],
        [j, i],
      ] as const) {
        const ownDir = NODES[a].speed >= 0 ? 1 : -1;
        const fasterA = Math.abs(NODES[a].speed) >= Math.abs(NODES[b].speed);
        const shear = fasterA ? ownDir : -ownDir;
        state.off[a] += shear * (prox * prox * 1.2 + hard * 3.0) * dt;
      }
    }
  }
  /* bounded spring back toward the pure orbit — rate-capped so it can never
     overpower the spacing controller and drag bodies through each other */
  for (let i = 0; i < n; i++) {
    const o = state.off[i];
    const rate = Math.min(0.1 * Math.abs(o), 0.05);
    state.off[i] -= Math.sign(o) * rate * dt;
  }
  if (out) {
    for (let i = 0; i < n; i++) {
      thetas[i] = NODES[i].phase + t * NODES[i].speed + state.off[i];
      posFor(i, thetas[i], fit, out[i]);
    }
  }
}

/* the 5-minute audit (M5/M10): step at 60Hz, assert the projected discs never
   intersect and projected centers never close inside the hit floor. */
export function driftAudit(
  fit: Fit,
  vis: number[],
  minHit: number,
  seconds = 300,
  hz = 60,
  warmup = 3,
): {
  minDiscGap: number;
  minCenterSep: number;
  samples: number;
  worstT: number;
  worstPair: string;
} {
  const state = createDriftState();
  const thetas = new Array(NODES.length).fill(0);
  let minDiscGap = Infinity;
  let minCenterSep = Infinity;
  let worstT = 0;
  let worstPair = '';
  const dt = 1 / hz;
  const steps = Math.floor(seconds * hz);
  for (let s = 0; s < steps; s++) {
    const t = s * dt;
    stepDrift(state, t, dt, fit, vis, minHit, thetas);
    if (t < warmup) continue; /* offsets start at zero — let the solver claim the field */
    for (let i = 0; i < NODES.length; i++) posFor(i, thetas[i], fit, _p[i]);
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const ki = CAM_DIST / (CAM_DIST - _p[i].z);
        const kj = CAM_DIST / (CAM_DIST - _p[j].z);
        const d = Math.hypot(_p[i].x * ki - _p[j].x * kj, _p[i].y * ki - _p[j].y * kj);
        const gap = d - (vis[i] * ki + vis[j] * kj);
        if (gap < minDiscGap) {
          minDiscGap = gap;
          worstT = t;
          worstPair = `${NODES[i].id}·${NODES[j].id}`;
        }
        minCenterSep = Math.min(minCenterSep, d);
      }
    }
  }
  return { minDiscGap, minCenterSep, samples: steps, worstT, worstPair };
}
