import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { useStore, type NodeId } from '../state/store';
import { NODE_MAP } from '../content/nodes';
import { nodeScreens } from '../scene/handles';
import { chamberControl, chamberFocus } from '../chambers/control';
import MiniOrchestrator from './MiniOrchestrator';
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

export default function ChamberLayer() {
  const act = useStore((s) => s.act);
  const chamber = useStore((s) => s.chamber);
  if (act !== 'chamber' || !chamber) return null;
  return <ChamberStage key={chamber} id={chamber} />;
}

function ChamberStage({ id }: { id: NodeId }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const Content = CHAMBERS[id];

  /* snapshot the node's screen position once — the scan-line origin (§2 Act IV.3) */
  const origin = useMemo(() => {
    const a = nodeScreens[id];
    const valid = a && a.visible && a.reveal > 0.2;
    const x = valid ? a.x : window.innerWidth / 2;
    const y = valid ? a.y : window.innerHeight / 2;
    const n = NODE_MAP[id];
    chamberFocus.id = id;
    chamberFocus.screenX = x;
    chamberFocus.screenY = y;
    chamberFocus.localX = Math.cos(n.phase) * n.radius;
    chamberFocus.localY = Math.sin(n.phase) * n.radius * 0.6;
    chamberFocus.localZ = 0;
    return { x, y, pct: (y / window.innerHeight) * 100 };
  }, [id]);

  /* open sequence: isolation (0.3) → handoff (0.4) → materialization (0.4) */
  useEffect(() => {
    const st = useStore.getState();
    st.setHovered(id); /* isolation: chosen node + thread surge, others dim */
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const reduced = st.reducedMotion;
    const beams = root.querySelectorAll<HTMLElement>('.chamber-beam');
    const scan = root.querySelector<HTMLElement>('.chamber-scanlines');
    const widget = root.querySelector<HTMLElement>('.mini-orch');

    if (reduced) {
      gsap.set(panel, { clipPath: 'inset(0% 0 0% 0)', autoAlpha: 1 });
      gsap.set(root.querySelector('.chamber-scrim'), { autoAlpha: 1 });
      if (widget) gsap.set(widget, { autoAlpha: 1, scale: 1, x: 0, y: 0 });
      useStore.getState().setCanvasCovered(true);
      panel.focus({ preventScroll: true });
      return () => {
        useStore.getState().setCanvasCovered(false);
        useStore.getState().setHovered(null);
      };
    }

    const topPct = origin.pct;
    const tl = gsap.timeline();
    /* phase 1 — isolation: the scene itself dims via hub hover logic; scrim eases in */
    tl.fromTo(root.querySelector('.chamber-scrim'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.42, ease: 'power2.inOut' }, 0)
      /* phase 2 — handoff: orchestrator collapses into the dock widget */
      .fromTo(
        widget,
        { autoAlpha: 0, scale: 2.6, x: () => window.innerWidth / 2 - 100, y: () => -window.innerHeight / 2 + 130 },
        { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.45, ease: 'power3.inOut' },
        0.28,
      )
      /* phase 3 — materialization: CRT scan from the node's y — never a slide-up fade */
      .set(panel, { autoAlpha: 1 }, 0.68)
      .fromTo(
        panel,
        { clipPath: `inset(${topPct}% 0 ${100 - topPct}% 0)` },
        { clipPath: 'inset(0% 0 0% 0)', duration: 0.42, ease: 'power3.out' },
        0.7,
      )
      .fromTo(beams[0], { top: `${topPct}%`, autoAlpha: 1 }, { top: '0%', duration: 0.42, ease: 'power3.out' }, 0.7)
      .fromTo(beams[1], { top: `${topPct}%`, autoAlpha: 1 }, { top: '100%', duration: 0.42, ease: 'power3.out' }, 0.7)
      .to(beams, { autoAlpha: 0, duration: 0.18 }, 1.12)
      .fromTo(scan, { autoAlpha: 0.45 }, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 1.0)
      .add(() => {
        /* single RGB-split flicker on the marginalia as the chamber locks in (≤80ms) */
        panel.classList.add('is-flick');
        gsap.delayedCall(0.08, () => panel.classList.remove('is-flick'));
      }, 1.08)
      .add(() => {
        useStore.getState().setCanvasCovered(true);
        panel.focus({ preventScroll: true });
      }, 1.12);

    return () => {
      tl.kill();
      useStore.getState().setCanvasCovered(false);
      useStore.getState().setHovered(null);
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

  /* close = de-rez back into the node, then hand the act back to the hub */
  useEffect(() => {
    const close = () => {
      if (closing) return;
      setClosing(true);
      const st = useStore.getState();
      st.setCanvasCovered(false); /* hub resumes behind the de-rez */
      const panel = panelRef.current;
      const root = rootRef.current;
      if (st.reducedMotion || !panel || !root) {
        st.closeChamber();
        return;
      }
      const topPct = origin.pct;
      const beams = root.querySelectorAll<HTMLElement>('.chamber-beam');
      gsap
        .timeline({ onComplete: () => useStore.getState().closeChamber() })
        .set(beams, { autoAlpha: 1 }, 0)
        .to(beams[0], { top: `${topPct}%`, duration: 0.34, ease: 'power3.in' }, 0)
        .to(beams[1], { top: `${topPct}%`, duration: 0.34, ease: 'power3.in' }, 0)
        .to(panel, { clipPath: `inset(${topPct}% 0 ${100 - topPct}% 0)`, duration: 0.34, ease: 'power3.in' }, 0)
        .to(panel, { autoAlpha: 0, duration: 0.08 }, 0.34)
        .to(beams, { autoAlpha: 0, duration: 0.12 }, 0.36)
        .to(root.querySelector('.chamber-scrim'), { autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, 0.3)
        .to(root.querySelector('.mini-orch'), { autoAlpha: 0, scale: 1.6, duration: 0.3, ease: 'power2.in' }, 0.2);
    };
    chamberControl.close = close;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      chamberControl.close = null;
      chamberFocus.id = null;
    };
  }, [closing, origin]);

  const node = NODE_MAP[id];

  return (
    <div className="chamber" ref={rootRef} data-chamber={id}>
      <div className="chamber-scrim" aria-hidden="true" />
      <div
        className="chamber-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${node.label} — ${node.role}`}
        tabIndex={-1}
      >
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
      </div>
      <div className="chamber-beam" aria-hidden="true" />
      <div className="chamber-beam" aria-hidden="true" />
      <MiniOrchestrator active={id} />
    </div>
  );
}
