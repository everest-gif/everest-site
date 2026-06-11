import type * as THREE from 'three';

/* Imperative bridge between GSAP timelines and the live scene.
   Components register uniforms/objects here; the breach timeline tweens them directly.
   Shared uniform objects (seam, nearBright) are tweened once, applied to every layer. */
interface SceneHandles {
  camera: THREE.PerspectiveCamera | null;
  seam: { value: number };
  blade: { value: number };
  nearBright: { value: number };
  thresholdFade: { value: number };
  tunnelProgress: { value: number };
  tunnelLight: { value: number };
  converge: { value: number };
  bloomIntensity: { value: number };
  chromaOffset: { value: number };
  whiteout: { value: number };
  wrapRadius: { value: number };
  hubReveal: { value: number };
}

export const handles: SceneHandles = {
  camera: null,
  seam: { value: 0 },
  blade: { value: 0 },
  nearBright: { value: 0 },
  thresholdFade: { value: 1 },
  tunnelProgress: { value: 0 },
  tunnelLight: { value: 0 },
  converge: { value: 0 },
  bloomIntensity: { value: 0.85 },
  chromaOffset: { value: 0 },
  whiteout: { value: 0 },
  /* radial extent of the whiteout (grade pass): 1.1 floods the frame, 0 = gone.
     Tweened 1.1 → 0 on arrival so the light visibly contracts into the hub core. */
  wrapRadius: { value: 1.1 },
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

/* World layout. The tunnel lives in THRESHOLD space, bored into the mountain behind the
   ridge seam — the breach camera physically flies into it (R1.1: one unbroken shot).
   Only the hub remains a separate pocket, reached inside the 120ms arrival light-wrap. */
export const HUB_Y = 600;
export const TUNNEL_CY = 3.4; /* tube axis height ≈ camera path through the seam */
export const TUNNEL_R = 2.6; /* small enough to hide behind the ridge silhouette at idle */
export const TUNNEL_Z0 = -15.5; /* entrance, just behind the ridge planes at z −8 / −13.5 */
export const TUNNEL_LEN = 64;

export const AMBER = '#E8A23D';
export const JADE = '#38D9A9';
export const BONE = '#EDE8DF';
export const INK = '#0A0A0C';
