/* Imperative bridge between the chamber layer, HUD, and the rest of the UI. */
export const chamberControl: {
  /* registered by ChamberStage while open — plays the de-rez close, then closeChamber() */
  close: (() => void) | null;
  /* de-rez the content only (planet-to-planet hop), then hand off to the flight */
  derez: ((onDone: () => void) => void) | null;
} = { close: null, derez: null };
