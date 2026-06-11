import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { useStore, type NodeId } from '../state/store';
import { NODES, NODE_MAP } from '../content/nodes';
import { nodeScreens, handles } from '../scene/handles';
import { beginFlight, endFlight, FLY_IN_S, FLY_HOP_S } from '../scene/flight';
import { chamberControl } from '../chambers/control';
import { GhostNumeral } from '../chambers/shared';
import { initChamberReveals } from '../chambers/reveal';
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

/* R3 — travel, not page swaps. Click → camera flight (~0.95s) → content materializes
   beside the live planet. Hops de-rez the content, arc the camera across the system
   (~1.15s, past the core), then materialize the next chamber. The planet IS the hero:
   the canvas keeps rendering for the whole visit — no scrim, no blurred backdrop. */
export default function ChamberLayer() {
  const act = useStore((s) => s.act);
  const chamber = useStore((s) => s.chamber);
  const [shown, setShown] = useState<NodeId | null>(null);
  const [open, setOpen] = useState(false);
  const lastAct = useRef(act);
  const busy = useRef(false);
  /* persists across setShown re-renders — effect cleanup must NOT clear it mid-flight */
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const prevAct = lastAct.current;
    lastAct.current = act;

    if (act !== 'chamber' || !chamber) {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
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
      /* planet-to-planet hop */
      busy.current = true;
      const fly = () => {
        setOpen(false);
        setShown(chamber);
        if (reduced || !handles.camera) {
          setOpen(true);
          busy.current = false;
          return;
        }
        beginFlight('hop', handles.camera);
        timer.current = window.setTimeout(land, FLY_HOP_S * 1000 + 40);
      };
      if (!reduced && chamberControl.derez) chamberControl.derez(fly);
      else fly();
    }
  }, [act, chamber, shown]);

  /* Esc mid-flight (no stage mounted yet) aborts to the hub */
  useEffect(() => {
    if (act !== 'chamber' || open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      endFlight();
      useStore.getState().closeChamber();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, open]);

  if (act !== 'chamber' || !shown || !open) return null;
  return <ChamberStage key={shown} id={shown} />;
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
      gsap.set(panel, { clipPath: 'inset(0% 0 0% 0)', autoAlpha: 1 });
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
      if (st.reducedMotion || !panel || !root) {
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
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      chamberControl.close = null;
      chamberControl.derez = null;
    };
  }, [closing, origin]);

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
        {/* planet-to-planet rail — exploration without returning to the overview (R3) */}
        <nav className="chamber-rail" aria-label="Neighbouring chambers">
          <button
            type="button"
            data-cursor="node"
            onClick={() => useStore.getState().hopChamber(prev.id)}
            aria-label={`Travel to ${prev.label}`}
          >
            ← <span className="rail-glyph" aria-hidden="true" /> {prev.label}
          </button>
          <span className="rail-sep" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            data-cursor="node"
            onClick={() => useStore.getState().hopChamber(next.id)}
            aria-label={`Travel to ${next.label}`}
          >
            {next.label} <span className="rail-glyph" aria-hidden="true" /> →
          </button>
        </nav>
      </div>
      <div className="chamber-beam" aria-hidden="true" />
      <div className="chamber-beam" aria-hidden="true" />
    </div>
  );
}
