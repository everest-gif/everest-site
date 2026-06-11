import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { useStore, type NodeId } from '../state/store';
import { NODES, NODE_MAP } from '../content/nodes';
import { nodeScreens, handles } from '../scene/handles';
import { beginFlight, endFlight, FLY_IN_S, FLY_HOP_S, HOP_REVEAL_S } from '../scene/flight';
import { chamberControl } from '../chambers/control';
import { GhostNumeral } from '../chambers/shared';
import { initChamberReveals } from '../chambers/reveal';
import { NodeGlyph } from './glyphs';
import type { NodeDef } from '../content/nodes';
import Jarvis from '../chambers/Jarvis';
import Luven from '../chambers/Luven';
import Emerge from '../chambers/Emerge';
import Dolomite from '../chambers/Dolomite';
import Everclash from '../chambers/Everclash';
import Voxhalla from '../chambers/Voxhalla';
import Bigback from '../chambers/Bigback';
import Beyond from '../chambers/Beyond';

const CHAMBERS: Record<NodeId, ComponentType> = {
  jarvis: Jarvis,
  luven: Luven,
  emerge: Emerge,
  dolomite: Dolomite,
  everclash: Everclash,
  voxhalla: Voxhalla,
  bigback: Bigback,
  beyond: Beyond,
};

/* R3/S4 — travel, not page swaps. Click → camera flight (~0.95s) → content materializes
   beside the live planet. Hops are ONE direct dolly arc between planets (~1.1s): the
   outgoing content de-rezzes during the first 0.3s OF the flight, the incoming chamber
   materializes over the final 0.4s as the new planet docks. The planet IS the hero:
   the canvas keeps rendering for the whole visit — no scrim, no blurred backdrop. */
export default function ChamberLayer() {
  const act = useStore((s) => s.act);
  const chamber = useStore((s) => s.chamber);
  const [shown, setShown] = useState<NodeId | null>(null);
  const [open, setOpen] = useState(false);
  const lastAct = useRef(act);
  const busy = useRef(false);
  /* persist across setShown re-renders — effect cleanup must NOT clear them mid-flight */
  const timer = useRef<number | null>(null);
  const swapTimer = useRef<number | null>(null);

  useEffect(() => {
    const prevAct = lastAct.current;
    lastAct.current = act;

    if (act !== 'chamber' || !chamber) {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      if (swapTimer.current !== null) {
        window.clearTimeout(swapTimer.current);
        swapTimer.current = null;
      }
      setShown(null);
      setOpen(false);
      busy.current = false;
      endFlight();
      return;
    }

    const reduced = useStore.getState().reducedMotion;
    const land = () => {
      timer.current = null;
      setOpen(true);
      busy.current = false;
    };

    if (!shown) {
      /* entering — from the hub (fly) or a deep link (camera is already being homed) */
      setShown(chamber);
      if (reduced || prevAct !== 'hub' || !handles.camera) {
        setOpen(true);
        return;
      }
      busy.current = true;
      beginFlight('in', handles.camera);
      timer.current = window.setTimeout(land, FLY_IN_S * 1000 + 40);
      return;
    }

    if (chamber !== shown && !busy.current) {
      /* S4 — planet-to-planet: ONE direct arc. Reduced motion: 200ms crossfade. */
      busy.current = true;
      if (reduced || !handles.camera) {
        const swap = () => {
          setShown(chamber);
          busy.current = false;
        };
        if (chamberControl.derez) chamberControl.derez(swap);
        else swap();
        return;
      }
      /* flight and de-rez run CONCURRENTLY; the next chamber materializes over
         the arc's final beat as its planet docks into the hero position */
      beginFlight('hop', handles.camera, chamber);
      chamberControl.derez?.(() => setOpen(false));
      swapTimer.current = window.setTimeout(() => {
        swapTimer.current = null;
        setShown(chamber);
        setOpen(true);
      }, (FLY_HOP_S - HOP_REVEAL_S) * 1000);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        busy.current = false;
      }, FLY_HOP_S * 1000 + 40);
    }
  }, [act, chamber, shown]);

  /* Esc mid-flight (no stage mounted yet) aborts to the hub */
  useEffect(() => {
    if (act !== 'chamber' || open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || useStore.getState().indexOpen) return;
      endFlight();
      useStore.getState().closeChamber();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, open]);

  if (act !== 'chamber' || !shown || !open) return null;
  return <ChamberStage key={shown} id={shown} />;
}

/* M6 — EXPLORE chip: destination glyph + mono name + EXPLORE arrow, hairline
   border, ring-charge sweep on hover, magnetic pull. Obviously clickable. */
function ExploreChip({ dir, node }: { dir: 'prev' | 'next'; node: NodeDef }) {
  const ref = useRef<HTMLButtonElement>(null);

  /* magnetic pull — same family as the ENTER ring (≤6px, springs back) */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (useStore.getState().reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'expo.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'expo.out' });
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + 48;
      if (d < reach && d > 0.01) {
        const pull = (1 - d / reach) * 6;
        xTo((dx / d) * pull);
        yTo((dy / d) * pull);
      } else {
        xTo(0);
        yTo(0);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <button
      type="button"
      ref={ref}
      className={`explore-chip chip-${dir}`}
      data-cursor="node"
      onClick={() => useStore.getState().hopChamber(node.id)}
      aria-label={`Travel to ${node.label} — ${node.role}`}
    >
      <svg className="chip-charge" aria-hidden="true">
        <rect pathLength={100} />
      </svg>
      <span className="chip-glyph">
        <NodeGlyph id={node.id} size={15} />
      </span>
      <span className="chip-body">
        <span className="chip-name">{node.label}</span>
        <span className="chip-explore">{dir === 'prev' ? '← EXPLORE' : 'EXPLORE →'}</span>
      </span>
    </button>
  );
}

/* S7 — orbital rail: all eight planet glyphs in orbit order, bottom-center.
   The current chamber is ringed in amber with `0n / NAME` beside the rail;
   any glyph is one click (S4 direct flight) away. Hover names each stop. */
function OrbitalRail({ current }: { current: NodeId }) {
  const idx = NODES.findIndex((n) => n.id === current);
  return (
    <nav className="orbital-rail" aria-label="All chambers in orbit order">
      <ol className="rail-stops">
        {NODES.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className={`rail-stop${n.id === current ? ' is-current' : ''}`}
              data-cursor="node"
              aria-label={`Travel to ${n.label} — ${n.role}`}
              aria-current={n.id === current ? 'true' : undefined}
              onClick={() => useStore.getState().hopChamber(n.id)}
            >
              <NodeGlyph id={n.id} size={13} />
              <span className="rail-name" aria-hidden="true">
                {n.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <span className="rail-pos" aria-hidden="true">
        <span className="rail-pos-num">{String(idx + 1).padStart(2, '0')}</span> / {NODE_MAP[current].label}
      </span>
    </nav>
  );
}

function ChamberStage({ id }: { id: NodeId }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const Content = CHAMBERS[id];

  /* the scan-line reveal originates at the planet's limb — it sits at the left third now */
  const origin = useMemo(() => {
    const a = nodeScreens[id];
    const valid = a && a.visible && a.reveal > 0.2;
    const y = valid ? a.y : window.innerHeight / 2;
    return { pct: (y / window.innerHeight) * 100 };
  }, [id]);

  useEffect(() => {
    const st = useStore.getState();
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const reduced = st.reducedMotion;
    const beams = root.querySelectorAll<HTMLElement>('.chamber-beam');
    const scan = root.querySelector<HTMLElement>('.chamber-scanlines');

    if (reduced) {
      /* S4 — half of the 200ms crossfade (de-rez fades the outgoing half) */
      gsap.set(panel, { clipPath: 'inset(0% 0 0% 0)' });
      gsap.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, ease: 'none' });
      panel.focus({ preventScroll: true });
      return;
    }

    const topPct = origin.pct;
    const tl = gsap.timeline();
    tl.set(panel, { autoAlpha: 1 }, 0.04)
      .fromTo(
        panel,
        { clipPath: `inset(${topPct}% 0 ${100 - topPct}% 0)` },
        { clipPath: 'inset(0% 0 0% 0)', duration: 0.42, ease: 'power3.out' },
        0.06,
      )
      .fromTo(beams[0], { top: `${topPct}%`, autoAlpha: 1 }, { top: '0%', duration: 0.42, ease: 'power3.out' }, 0.06)
      .fromTo(beams[1], { top: `${topPct}%`, autoAlpha: 1 }, { top: '100%', duration: 0.42, ease: 'power3.out' }, 0.06)
      .to(beams, { autoAlpha: 0, duration: 0.18 }, 0.48)
      .fromTo(scan, { autoAlpha: 0.45 }, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 0.36)
      .add(() => {
        panel.classList.add('is-flick');
        gsap.delayedCall(0.08, () => panel.classList.remove('is-flick'));
      }, 0.44)
      .add(() => {
        panel.focus({ preventScroll: true });
      }, 0.5);

    return () => {
      tl.kill();
    };
  }, [id, origin]);

  /* Lenis-smoothed internal scroll, driven by the GSAP ticker (§8) */
  useEffect(() => {
    const wrapper = scrollRef.current;
    if (!wrapper) return;
    const content = wrapper.firstElementChild as HTMLElement | null;
    if (!content) return;
    const lenis = new Lenis({ wrapper, content, smoothWheel: true, duration: 1.05 });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [id]);

  /* M1 kinetic type — prose lines, hairline rules, stat tickers reveal as they enter.
     Armed at ~0.45s so the first viewport's reveals land just as the scan completes. */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let cleanup: (() => void) | null = null;
    const t = window.setTimeout(() => {
      cleanup = initChamberReveals(panel);
    }, 450);
    return () => {
      window.clearTimeout(t);
      cleanup?.();
    };
  }, [id]);

  /* de-rez (shared by close and hop): content collapses back toward the planet's limb */
  useEffect(() => {
    const derez = (onDone: () => void) => {
      const st = useStore.getState();
      const panel = panelRef.current;
      const root = rootRef.current;
      if (st.reducedMotion && panel) {
        /* the outgoing half of the 200ms crossfade */
        gsap.to(panel, { autoAlpha: 0, duration: 0.1, ease: 'none', onComplete: onDone });
        return;
      }
      if (!panel || !root) {
        onDone();
        return;
      }
      const topPct = origin.pct;
      const beams = root.querySelectorAll<HTMLElement>('.chamber-beam');
      gsap
        .timeline({ onComplete: onDone })
        .set(beams, { autoAlpha: 1 }, 0)
        .to(beams[0], { top: `${topPct}%`, duration: 0.32, ease: 'power3.in' }, 0)
        .to(beams[1], { top: `${topPct}%`, duration: 0.32, ease: 'power3.in' }, 0)
        .to(panel, { clipPath: `inset(${topPct}% 0 ${100 - topPct}% 0)`, duration: 0.32, ease: 'power3.in' }, 0)
        .to(panel, { autoAlpha: 0, duration: 0.08 }, 0.32)
        .to(beams, { autoAlpha: 0, duration: 0.12 }, 0.34);
    };

    const close = () => {
      if (closing) return;
      setClosing(true);
      derez(() => useStore.getState().closeChamber());
    };

    chamberControl.close = close;
    chamberControl.derez = derez;
    const onKey = (e: KeyboardEvent) => {
      if (useStore.getState().indexOpen) return; /* the INDEX owns keys while open */
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      chamberControl.close = null;
      chamberControl.derez = null;
    };
  }, [closing, origin]);

  /* M6 — arrow keys hop planets */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useStore.getState().indexOpen) return;
      const idx2 = NODES.findIndex((n) => n.id === id);
      if (e.key === 'ArrowLeft') useStore.getState().hopChamber(NODES[(idx2 + NODES.length - 1) % NODES.length].id);
      else if (e.key === 'ArrowRight') useStore.getState().hopChamber(NODES[(idx2 + 1) % NODES.length].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id]);

  const node = NODE_MAP[id];
  const idx = NODES.findIndex((n) => n.id === id);
  const prev = NODES[(idx + NODES.length - 1) % NODES.length];
  const next = NODES[(idx + 1) % NODES.length];

  return (
    <div className="chamber" ref={rootRef} data-chamber={id}>
      <div
        className="chamber-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${node.label} — ${node.role}`}
        tabIndex={-1}
      >
        <GhostNumeral index={idx + 1} />
        {/* M2 — the planet's amber wash grazing the panel's near edge */}
        <div className="chamber-glow" aria-hidden="true" style={{ top: `${origin.pct}%` }} />
        <div className="chamber-scroll" ref={scrollRef}>
          <div className="chamber-content">
            <Content />
            <div className="chamber-foot">
              <button type="button" className="chamber-return" data-cursor="back" onClick={() => chamberControl.close?.()}>
                [ ← return to hub ]
              </button>
            </div>
          </div>
        </div>
        <div className="chamber-scanlines" aria-hidden="true" />
        {/* M6 — EXPLORE chips: obviously clickable travel to the neighbours */}
        <nav className="chamber-chips" aria-label="Neighbouring chambers">
          <ExploreChip dir="prev" node={prev} />
          <ExploreChip dir="next" node={next} />
        </nav>
        <OrbitalRail current={id} />
      </div>
      <div className="chamber-beam" aria-hidden="true" />
      <div className="chamber-beam" aria-hidden="true" />
    </div>
  );
}
