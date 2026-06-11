import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { NODES } from '../content/nodes';
import { nodeScreens, coreScreen } from '../scene/handles';

/* DOM layer of the hub — projected node buttons (native keyboard nav + a11y),
   mono labels, stat chips, core label. Positions stream from HubWorld via handles. */

/* R2.3 — collision-resolved label placement: alternate sides around the rings so
   BEYOND/BIGBACK (and any close pass) can never stack label-on-label. */
const LABEL_ABOVE = new Set(['jarvis', 'emerge', 'beyond', 'voxhalla']);
export default function HubOverlay() {
  const act = useStore((s) => s.act);
  const hovered = useStore((s) => s.hovered);
  const setHovered = useStore((s) => s.setHovered);
  const openChamber = useStore((s) => s.openChamber);
  const rootRef = useRef<HTMLDivElement>(null);
  const onStage = act === 'hub';

  /* rAF loop applying projected anchors to DOM transforms.
     Magnetic hover (§5): labels translate toward the cursor, max 8px, spring back. */
  useEffect(() => {
    if (!onStage) return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-node]'));
    const coreEl = root.querySelector<HTMLElement>('.hub-core-label');
    const fine = window.matchMedia('(pointer: fine)').matches;
    const mouse = { x: -9999, y: -9999 };
    const pull = new Map(items.map((el) => [el, { x: 0, y: 0 }]));
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    if (fine) window.addEventListener('mousemove', onMove, { passive: true });

    const loop = () => {
      const reduced = useStore.getState().reducedMotion;
      for (const el of items) {
        const id = el.dataset.node!;
        const a = nodeScreens[id];
        if (!a) continue;
        const p = pull.get(el)!;
        let tx = 0;
        let ty = 0;
        if (fine && !reduced) {
          const dx = mouse.x - a.x;
          const dy = mouse.y - a.y;
          const d = Math.hypot(dx, dy);
          const reach = 84;
          if (d < reach && d > 0.01) {
            const k = (1 - d / reach) * 8; /* max 8px */
            tx = (dx / d) * k;
            ty = (dy / d) * k;
          }
        }
        p.x += (tx - p.x) * 0.16; /* spring toward target / back to rest */
        p.y += (ty - p.y) * 0.16;
        el.style.transform = `translate3d(${a.x + p.x}px, ${a.y + p.y}px, 0) translate(-50%, -50%)`;
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
    return () => {
      cancelAnimationFrame(raf);
      if (fine) window.removeEventListener('mousemove', onMove);
    };
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
        <div key={n.id} className={`hub-node${LABEL_ABOVE.has(n.id) ? ' lab-above' : ''}`} data-node={n.id}>
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
