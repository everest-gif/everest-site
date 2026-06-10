import { useStore } from '../state/store';

/* Styled mono fallback if the WebGL context is lost (§9.7) — never a white screen. */
export default function ContextLost() {
  const lost = useStore((s) => s.contextLost);
  if (!lost) return null;
  return (
    <div className="context-lost" role="alert">
      <p className="cl-amber">[ signal lost ]</p>
      <p>everest.os — the WebGL context was interrupted.</p>
      <p className="cl-dim">reload the page to re-establish the link.</p>
    </div>
  );
}
