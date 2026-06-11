import * as THREE from 'three';

/* ============================================================
   M3 — four procedural threshold seasons.
   Terrain/pulse shaders read the front sweep directly (shared uniform
   objects below); sky-level elements (stars, fog, sky glow, particles)
   take JS-mixed values written once per frame by SeasonDriver.
   ============================================================ */

export type Season = 'night' | 'winter' | 'spring' | 'autumn';
export const SEASONS: Season[] = ['night', 'winter', 'spring', 'autumn'];
export const SEASON_IDX: Record<Season, number> = { night: 0, winter: 1, spring: 2, autumn: 3 };

/* world-x extent of the widest terrain layer is ±53 — the front enters and
   exits beyond both edges so the sweep is born and dies off screen */
export const FRONT_X0 = -62;
export const FRONT_X1 = 66;

/* shared uniform objects — referenced by terrain + pulse + particle materials */
export const seasonU = {
  from: { value: 0 },
  to: { value: 0 },
  front: { value: 1 }, /* 0→1 sweep progress; 1 = settled */
  edge: { value: 2.2 }, /* soft front width; huge = reduced-motion crossfade */
};

/* JS-mixed globals (one write per frame, materials share the objects) */
export const seasonGlobals = {
  starSharp: { value: 0 }, /* winter — sharper, brighter, calmer stars */
  starHorizon: { value: 0 }, /* spring — pre-dawn dims stars near the horizon */
  fogTint: { value: new THREE.Color(0.91 * 0.38, 0.63 * 0.38, 0.24 * 0.38) },
  fogMul: { value: 1 },
  skyColor: { value: new THREE.Color(0, 0, 0) },
  skyIntensity: { value: 0 },
};

interface SeasonSpec {
  fogMul: number;
  fogTint: THREE.Color;
  starSharp: number;
  starHorizon: number;
  sky: THREE.Color;
  skyIntensity: number;
}

/* value/temperature shifts within the family — never candy colors */
export const SEASON_SPECS: Record<Season, SeasonSpec> = {
  night: {
    fogMul: 1,
    fogTint: new THREE.Color(0.346, 0.239, 0.091),
    starSharp: 0,
    starHorizon: 0,
    sky: new THREE.Color(0, 0, 0),
    skyIntensity: 0,
  },
  winter: {
    fogMul: 1.7,
    fogTint: new THREE.Color(0.165, 0.186, 0.216),
    starSharp: 1,
    starHorizon: 0,
    sky: new THREE.Color(0.5, 0.58, 0.7),
    skyIntensity: 0.045,
  },
  spring: {
    fogMul: 0.65,
    fogTint: new THREE.Color(0.165, 0.225, 0.186),
    starSharp: 0,
    starHorizon: 1,
    sky: new THREE.Color(0.3, 0.42, 0.36),
    skyIntensity: 0.16,
  },
  autumn: {
    fogMul: 1.3,
    fogTint: new THREE.Color(0.399, 0.231, 0.084),
    starSharp: 0,
    starHorizon: 0,
    sky: new THREE.Color(0.55, 0.3, 0.12),
    skyIntensity: 0.1,
  },
};

const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

/* write all JS-mixed globals for the current from/to/front state */
export function mixSeasonGlobals(): void {
  const g = seasonU.front.value; /* global mix factor for sky-level elements */
  const a = SEASON_SPECS[SEASONS[seasonU.from.value]];
  const b = SEASON_SPECS[SEASONS[seasonU.to.value]];
  seasonGlobals.starSharp.value = a.starSharp + (b.starSharp - a.starSharp) * g;
  seasonGlobals.starHorizon.value = a.starHorizon + (b.starHorizon - a.starHorizon) * g;
  seasonGlobals.fogMul.value = a.fogMul + (b.fogMul - a.fogMul) * g;
  seasonGlobals.fogTint.value.copy(_c1.copy(a.fogTint).lerp(_c2.copy(b.fogTint), g));
  seasonGlobals.skyIntensity.value = a.skyIntensity + (b.skyIntensity - a.skyIntensity) * g;
  seasonGlobals.skyColor.value.copy(_c1.copy(a.sky).lerp(_c2.copy(b.sky), g));
}

/* how present a given season is right now (drives each particle system) */
export function seasonWeight(id: number): number {
  const g = seasonU.front.value;
  let w = 0;
  if (seasonU.from.value === id) w += 1 - g;
  if (seasonU.to.value === id) w += g;
  return Math.min(1, w);
}

const KEY = 'everest-season';

export function loadSeason(): Season {
  try {
    const s = sessionStorage.getItem(KEY);
    if (s && (SEASONS as string[]).includes(s)) return s as Season;
  } catch {
    /* storage unavailable — default */
  }
  return 'night';
}

export function persistSeason(s: Season): void {
  try {
    sessionStorage.setItem(KEY, s);
  } catch {
    /* storage unavailable — session-only */
  }
}

/* GLSL chunk shared by terrain + pulse + particle shaders: front coverage at world x.
   Returns 0 where the OLD season still holds (right of the front), 1 behind it. */
export const GLSL_SEASON = /* glsl */ `
uniform float uSeasonFrom;
uniform float uSeasonTo;
uniform float uSeasonFront;
uniform float uSeasonEdge;

float seasonCoverage(float wx) {
  float fx = mix(${FRONT_X0.toFixed(1)}, ${FRONT_X1.toFixed(1)}, uSeasonFront);
  return 1.0 - smoothstep(fx - uSeasonEdge, fx + uSeasonEdge, wx);
}

/* shimmer band hugging the frontline — only alive mid-transition */
float seasonShimmer(float wx) {
  float fx = mix(${FRONT_X0.toFixed(1)}, ${FRONT_X1.toFixed(1)}, uSeasonFront);
  float transit = smoothstep(0.0, 0.03, uSeasonFront) * (1.0 - smoothstep(0.97, 1.0, uSeasonFront));
  float d = wx - fx;
  return exp(-d * d * 0.55) * transit;
}
`;
