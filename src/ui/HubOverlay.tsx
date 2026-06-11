import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { NODES } from '../content/nodes';
import { nodeScreens, coreScreen } from '../scene/handles';

/* DOM layer of the hub — projected node buttons (native keyboard nav + a11y),
   mono labels, stat chips, core label. Positions stream from HubWorld via handles. */
export default function HubOverlay() {
  const act = useStore((s) => s.act);
  const hovered = useStore((s) => s.hovered);
  const setHovered = useStore((s) => s.setHovered);
  const openChamber = useStore((s) => s.openChamber);
  const rootRef = useRef<HTMLDivElement>(null);
  const onStage = act === 'hub';

  /* rAF loop applying projected anchors to DOM transforms */
  useEffect(() => {
    if (!onStage) return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-node]'));
    const coreEl = root.querySelector<HTMLElement>('.hub-core-label');
    const loop = () => {
      for (const el of items) {
        const id = el.dataset.node!;
        const a = nodeScreens[id];
        if (!a) continue;
        el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0) translate(-50%, -50%)`;
        el.style.opacity = String(a.visible ? a.reveal : 0);
        el.style.pointerEvents = a.visible && a.reveal > 0.5 ? 'auto' : 'none';
      }
      if (coreEl) {
        coreEl.style.transform = `translate3d(${coreScreen.x}px, ${coreScreen.y}px, 0) translate(-50%, 0)`;
        coreEl.style.opacity = String(coreScreen.visible ? coreScreen.reveal * 0.9 : 0);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onStage]);

  /* Esc on the hub returns to the mountains (reverse breach) */
  useEffect(() => {
    if (!onStage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const st = useStore.getState();
      if (st.reducedMotion) st.gotoThreshold();
      else st.beginReverseBreach();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStage]);

  if (!onStage) return null;

  return (
    <div className="hub-overlay" ref={rootRef}>
      {NODES.map((n) => (
        <div key={n.id} className="hub-node" data-node={n.id}>
          <button
            type="button"
            className={`hub-node-btn${hovered === n.id ? ' is-hot' : ''}${hovered && hovered !== n.id ? ' is-dim' : ''}`}
            data-cursor="node"
            aria-label={`Open ${n.label} — ${n.role}`}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(n.id)}
            onBlur={() => setHovered(null)}
            onClick={() => openChamber(n.id)}
          >
            <span className="hub-node-hit" aria-hidden="true" />
            <span className="hub-node-label">{n.label}</span>
          </button>
          <div className={`hub-chip${hovered === n.id ? ' is-on' : ''}`} role="status" aria-hidden={hovered !== n.id}>
            {n.chip}
          </div>
        </div>
      ))}
      <div className="hub-core-label" aria-hidden="true">
        everest
      </div>
    </div>
  );
}
