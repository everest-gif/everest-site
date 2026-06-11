import type * as THREE from 'three';

/* R2.2 — every node is a micro-planet with its own shader/geometry identity.
   HubWorld owns orbit position, world scale (baseScale × NODE_R × reveal × hover),
   and calls update() once per frame. Identity modules own everything inside the group. */
export interface PlanetBuild {
  /* origin-centered; OUTER VISUAL RADIUS ≈ 1.0 in local units (rings included) */
  group: THREE.Group;
  /* t seconds, dt seconds, active 0..1 (hover eases in — intensify identity motion),
     dim 0..1 (another node hovered — drop emission toward 40%), reveal 0..1 (arrival fade) */
  update: (t: number, dt: number, active: number, dim: number, reveal: number) => void;
  /* 0.7–1.3, applied against the shared NODE_R by HubWorld */
  baseScale: number;
  dispose: () => void;
}

export const PALETTE = {
  amber: '#E8A23D',
  jade: '#38D9A9',
  bone: '#EDE8DF',
  ink: '#0A0A0C',
} as const;
