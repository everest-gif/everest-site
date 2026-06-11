import type * as THREE from 'three';

/* Imperative bridge between GSAP timelines and the live scene.
   Components register uniforms/objects here; the breach timeline tweens them directly.
   Shared uniform objects (seam, nearBright) are tweened once, applied to every layer. */
interface SceneHandles {
  camera: THREE.PerspectiveCamera | null;
  seam: { value: number };
  nearBright: { value: number };
  thresholdFade: { value: number };
  tunnelProgress: { value: number };
  tunnelLight: { value: number };
  bloomIntensity: { value: number };
  chromaOffset: { value: number };
  whiteout: { value: number };
  hubReveal: { value: number };
}

export const handles: SceneHandles = {
  camera: null,
  seam: { value: 0 },
  nearBright: { value: 0 },
  thresholdFade: { value: 1 },
  tunnelProgress: { value: 0 },
  tunnelLight: { value: 0 },
  bloomIntensity: { value: 0.85 },
  chromaOffset: { value: 0 },
  whiteout: { value: 0 },
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

/* World layout — each act lives in its own pocket of space. */
export const HUB_Y = 600;
export const TUNNEL_Y = 300;
export const TUNNEL_LEN = 64;

export const AMBER = '#E8A23D';
export const JADE = '#38D9A9';
export const BONE = '#EDE8DF';
export const INK = '#0A0A0C';
