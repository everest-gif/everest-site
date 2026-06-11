import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ChamberTitle, Marginalia, Gallery } from './shared';
import { useStore } from '../state/store';
import s from './Voxhalla.module.css';

/* Layout language: spec-sheet brutalism — the project rendered as an engineering datasheet. */

const SPEC: ReadonlyArray<readonly [field: string, value: string, note: string]> = [
  ['engine', 'none', 'raw three.js — scene graph, game loop, collision, all hand-rolled'],
  ['renderer', 'three.js / webgl', 'voxel geometry in the browser — runs from a URL, zero installs'],
  ['mode', '6v6', 'hero shooter — two teams, ability-driven fights'],
  ['netcode', 'browser multiplayer', 'twelve clients, one arena'],
  ['champions', '10', 'AI-generated 3D models · full ability kits, designed and legally vetted'],
  ['post pipeline', 'bloom · fxaa · vignette', 'custom post-processing chain, composited every frame'],
  ['status', 'parked', 'see 1.0 — parked on purpose, not abandoned'],
];

const ROSTER = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Voxhalla() {
  const reduced = useStore((st) => st.reducedMotion);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const el = tableRef.current;
    if (!el) return;
    const tw = gsap.fromTo(
      el.children,
      { autoAlpha: 0, x: -10 },
      { autoAlpha: 1, x: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out', delay: 0.4 },
    );
    return () => {
      tw.kill();
    };
  }, [reduced]);

  return (
    <div className={s.root}>
      <header className={s.head}>
        <ChamberTitle kicker="VOXHALLA — VOXEL HERO SHOOTER">Every triangle accounted for.</ChamberTitle>
        <div className={s.docMeta}>
          <Marginalia>datasheet vx-001</Marginalia>
          <Marginalia>rev 0 · sheet 1 of 1</Marginalia>
          <Marginalia>issued for reference</Marginalia>
        </div>
      </header>

      <div className={s.sheet}>
        <div className={s.statusBand}>
          <span className={s.statusSec}>1.0</span>
          <span className={s.statusKey}>status</span>
          <span className={s.statusVal}>
            <i className={s.tick} aria-hidden="true" />
            parked — shipping discipline
          </span>
          <span className={s.statusNote}>one project ships at a time · jarvis first</span>
        </div>

        <section>
          <h3 className={s.secHead}>
            <span>2.0</span>specification
          </h3>
          <div className={s.table} ref={tableRef} role="table" aria-label="Voxhalla specification">
            {SPEC.map(([field, value, note], i) => (
              <div
                key={field}
                className={field === 'status' ? `${s.row} ${s.rowStatus}` : s.row}
                role="row"
              >
                <span className={s.cellIdx} role="cell">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={s.cellField} role="rowheader">
                  {field}
                </span>
                <span className={s.cellSpec} role="cell">
                  {value}
                </span>
                <span className={s.cellNote} role="cell">
                  {note}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className={s.split}>
          <section className={s.rosterSec}>
            <h3 className={s.secHead}>
              <span>3.0</span>champion roster — 10 / 10
            </h3>
            <div className={s.roster} aria-label="Ten champions, all modeled, all kits complete">
              {ROSTER.map((n) => (
                <div key={n} className={s.champ}>
                  <span className={s.champIdx}>{String(n).padStart(2, '0')}</span>
                  <span className={s.champTicks}>
                    <span className={s.tickDone}>mdl</span>
                    <span className={s.tickDone}>kit</span>
                  </span>
                </div>
              ))}
            </div>
            <p className={s.legend}>mdl = 3d model, ai-generated · kit = ability kit, designed + legally vetted</p>
          </section>

          <section className={s.notesSec}>
            <h3 className={s.secHead}>
              <span>4.0</span>notes
            </h3>
            <div className={`prose ${s.notes}`}>
              <p>
                Voxhalla is a six-versus-six voxel hero shooter that runs in the browser on raw
                three.js. No Unity, no Unreal, no engine layer at all — scene graph, game loop,
                voxel meshing, and the post chain are hand-built, because the point was to know
                exactly what every frame costs.
              </p>
              <p>
                Ten champions exist: AI-generated 3D models carrying full ability kits, each one
                designed and legally vetted. Then I parked the whole thing. Jarvis ships first —
                one finished system is worth more than two ambitious branches. The repo waits,
                intact, for its turn.
              </p>
            </div>
          </section>
        </div>

        <section>
          <h3 className={s.secHead}>
            <span>5.0</span>figures
          </h3>
          <div className={s.figuresBody}>
            <Gallery
              id="voxhalla"
              captions={['arena — voxel terrain', 'champion — ai-generated model', 'post chain — bloom · fxaa · vignette']}
            />
          </div>
        </section>

        <div className={s.endRow}>
          <Marginalia>vx-001 · end of sheet</Marginalia>
        </div>
      </div>
    </div>
  );
}
