import type * as THREE from 'three';

/* Imperative bridge between GSAP timelines and the live scene.
   Components register uniforms/objects here; the ascent timeline tweens them directly.
   Shared uniform objects (seam, nearBright) are tweened once, applied to every layer. */
interface SceneHandles {
  camera: THREE.PerspectiveCamera | null;
  seam: { value: number };
  blade: { value: number };
  nearBright: { value: number };
  thresholdFade: { value: number };
  /* S1 — the climb: 0→1 intensity of the star/fog rush during the ascent */
  ascent: { value: number };
  /* +1 rising (forward), −1 descending (reverse) — streak direction */
  ascentDir: { value: number };
  /* threshold starfield fade — stars persist past the terrain, then hand off to the cosmos */
  starFade: { value: number };
  /* pressure-wave shimmer at the moment of clearing the peaks (grade pass, 0→1 pulse) */
  shimmer: { value: number };
  bloomIntensity: { value: number };
  chromaOffset: { value: number };
  /* reduced-motion ink veil (grade pass) — the sanctioned 250ms crossfade */
  veil: { value: number };
  hubReveal: { value: number };
}

export const handles: SceneHandles = {
  camera: null,
  seam: { value: 0 },
  blade: { value: 0 },
  nearBright: { value: 0 },
  thresholdFade: { value: 1 },
  ascent: { value: 0 },
  ascentDir: { value: 1 },
  starFade: { value: 1 },
  shimmer: { value: 0 },
  bloomIntensity: { value: 0.85 },
  chromaOffset: { value: 0 },
  veil: { value: 0 },
  hubReveal: { value: 0 },
};

/* Hub → DOM bridge: HubWorld projects node/core positions into screen space each frame;
   the DOM overlay reads them in its own rAF. Mutated in place — never reallocated. */
export interface ScreenAnchor {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
  reveal: number;
}

export const nodeScreens: Record<string, ScreenAnchor> = {};
export const coreScreen: ScreenAnchor = { x: 0, y: 0, scale: 1, visible: false, reveal: 0 };

/* Live planet world positions + visual radii (R3 flight targets) — written by HubWorld
   every frame, read by the camera rig. Mutated in place, never reallocated. */
export const nodeWorld: Record<string, THREE.Vector3> = {};
export const nodeRadius: Record<string, number> = {};

/* World layout (S1). The hub system hangs DIRECTLY ABOVE the mountains in the same
   world space — the ascent is one physically continuous camera move from the threshold
   home, up through the opening ridge, to the system. No pockets, no teleports, no wraps:
   the system was above the mountains all along. */
export const HUB_Y = 64;

export const AMBER = '#E8A23D';
export const JADE = '#38D9A9';
export const BONE = '#EDE8DF';
export const INK = '#0A0A0C';
