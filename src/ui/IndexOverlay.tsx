import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStore, type NodeId } from '../state/store';
import { NODE_MAP, INDEX_GROUPS, NODE_STATUS } from '../content/nodes';
import { chamberControl } from '../chambers/control';
import { NodeGlyph, type GlyphId } from './glyphs';

/* M6 — INDEX: a ship's manifest, not a hamburger menu. Full-viewport in-world
   overlay: ink panel, hairline rules, faint backlit glow, scan-line reveal.
   Click flies there (the existing flight system does the travel); Esc closes;
   full keyboard nav (arrows move, Enter activates). */

interface RowDef {
  id: GlyphId;
  name: string;
  desc: string;
  status: string;
}

function rowsFor(group: { label: string; ids: NodeId[] }): RowDef[] {
  return group.ids.map((id) => ({
    id,
    name: NODE_MAP[id].label,
    desc: NODE_MAP[id].role,
    status: NODE_STATUS[id],
  }));
}

const PLACES: RowDef[] = [
  { id: 'mountains', name: 'THE MOUNTAINS', desc: 'The threshold — where you came in', status: 'always open' },
  { id: 'hub', name: 'HUB', desc: 'The system overview', status: 'home' },
];

export default function IndexOverlay() {
  const open = useStore((s) => s.indexOpen);
  const act = useStore((s) => s.act);
  const rootRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  /* close if we leave hub/chamber (breach, threshold…) */
  useEffect(() => {
    if (open && act !== 'hub' && act !== 'chamber') useStore.getState().setIndexOpen(false);
  }, [open, act]);

  /* scan-line reveal in; focus management */
  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const reduced = useStore.getState().reducedMotion;
    const panel = root.querySelector<HTMLElement>('.index-panel');
    const beam = root.querySelector<HTMLElement>('.index-beam');
    const rows = root.querySelectorAll<HTMLElement>('.index-row, .index-ghead');
    if (panel) {
      /* visible NOW (synchronously) — the first row must be focusable immediately */
      gsap.set(panel, { autoAlpha: 1 });
      if (reduced) {
        gsap.set(panel, { clipPath: 'inset(0% 0 0% 0)' });
      } else {
        gsap
          .timeline()
          .fromTo(
            panel,
            { clipPath: 'inset(50% 0 50% 0)' },
            { clipPath: 'inset(0% 0 0% 0)', duration: 0.38, ease: 'power3.out' },
            0,
          )
          .fromTo(beam, { autoAlpha: 1, top: '50%' }, { top: '0%', duration: 0.38, ease: 'power3.out' }, 0)
          .to(beam, { autoAlpha: 0, duration: 0.16 }, 0.36)
          /* opacity only — rows must stay focusable from frame one (keyboard nav) */
          .fromTo(rows, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.022 }, 0.12);
      }
    }
    root.querySelector<HTMLElement>('.index-row')?.focus();
    return () => {
      returnFocus.current?.focus?.();
    };
  }, [open]);

  /* keyboard: Esc closes (captures before hub/chamber Esc), arrows walk rows */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        useStore.getState().setIndexOpen(false);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const rows = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.index-row') ?? []);
        const i = rows.indexOf(document.activeElement as HTMLElement);
        const next = rows[(i + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length];
        next?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true); /* capture — wins over scene Esc handlers */
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  if (!open) return null;

  const go = (id: GlyphId) => {
    const st = useStore.getState();
    st.setIndexOpen(false);
    if (id === 'hub') {
      if (st.act === 'chamber') chamberControl.close?.();
      return;
    }
    if (id === 'mountains') {
      if (st.act === 'hub') {
        if (st.reducedMotion) st.gotoThreshold();
        else st.beginReverseBreach();
      } else if (st.act === 'chamber') {
        /* close the chamber first; reverse-breach once the hub is restored */
        chamberControl.close?.();
        const t0 = performance.now();
        const tick = window.setInterval(() => {
          const s = useStore.getState();
          if (s.act === 'hub') {
            window.clearInterval(tick);
            if (s.reducedMotion) s.gotoThreshold();
            else s.beginReverseBreach();
          } else if (s.act !== 'chamber' || performance.now() - t0 > 3000) {
            window.clearInterval(tick); /* user navigated elsewhere — stand down */
          }
        }, 80);
      }
      return;
    }
    if (st.act === 'hub') st.openChamber(id);
    else if (st.act === 'chamber') st.hopChamber(id);
  };

  return (
    <div className="index-overlay" ref={rootRef}>
      <div
        className="index-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Index — every destination in the system"
      >
        <div className="index-glow" aria-hidden="true" />
        <header className="index-head">
          <span className="index-title">INDEX</span>
          <span className="index-sub">every destination · arrows move · enter travels</span>
          <button type="button" className="index-close" onClick={() => useStore.getState().setIndexOpen(false)}>
            [ esc ]
          </button>
        </header>
        <div className="index-cols">
          {INDEX_GROUPS.map((g) => (
            <section key={g.label} className="index-group" aria-label={g.label}>
              <h3 className="index-ghead">
                {g.label}
                <span className="ch-rule" aria-hidden="true" />
              </h3>
              {rowsFor(g).map((r) => (
                <IndexRow key={r.name} row={r} onGo={go} />
              ))}
            </section>
          ))}
          <section className="index-group index-places" aria-label="Places">
            <h3 className="index-ghead">
              PLACES
              <span className="ch-rule" aria-hidden="true" />
            </h3>
            {PLACES.map((r) => (
              <IndexRow key={r.name} row={r} onGo={go} />
            ))}
          </section>
        </div>
      </div>
      <div className="index-beam" aria-hidden="true" />
    </div>
  );
}

function IndexRow({ row, onGo }: { row: RowDef; onGo: (id: GlyphId) => void }) {
  return (
    <button type="button" className="index-row" onClick={() => onGo(row.id)} aria-label={`Travel to ${row.name} — ${row.desc}`}>
      <span className="index-glyph">
        <NodeGlyph id={row.id} size={15} />
      </span>
      <span className="index-name">{row.name}</span>
      <span className="index-desc">{row.desc}</span>
      <span className="index-status">{row.status}</span>
    </button>
  );
}
