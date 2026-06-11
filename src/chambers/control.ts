import type { NodeId } from '../state/store';

/* Imperative bridge between the chamber layer, HUD, and camera rig. */
export const chamberControl: {
  /* registered by ChamberLayer while a chamber is open — plays the de-rez close */
  close: (() => void) | null;
} = { close: null };

/* Snapshot of the opened node at click time — scan-line origin + camera push target. */
export const chamberFocus: {
  id: NodeId | null;
  screenX: number;
  screenY: number;
  /* node position local to the hub group (world = local + HUB_Y on y) */
  localX: number;
  localY: number;
  localZ: number;
} = { id: null, screenX: 0, screenY: 0, localX: 0, localY: 0, localZ: 0 };
