import { useStore } from '../state/store';

/* M8.12 — lost coordinates: the 404, styled in-world. Mono, coordinates,
   one [ return ]. The threshold keeps breathing underneath. */
export default function Lost() {
  const lost = useStore((s) => s.lost);
  if (!lost) return null;
  return (
    <div className="lost-overlay" role="alertdialog" aria-label="Route not found">
      <p className="lost-code" aria-hidden="true">
        404
      </p>
      <p className="lost-line">no such coordinates on this map</p>
      <p className="lost-coords">40.0150° N · 105.2705° W — last known good fix</p>
      <button
        type="button"
        className="lost-return"
        onClick={() => {
          useStore.getState().setLost(false);
          window.location.hash = '#/';
        }}
      >
        [ return ]
      </button>
    </div>
  );
}
