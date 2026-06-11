import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ChamberTitle, Marginalia, Gallery, HeroArt } from './shared';
import { useStore } from '../state/store';
import s from './Voxhalla.module.css';

/* Layout language: spec-sheet brutalism — the project rendered as an engineering datasheet. */

const SPEC: ReadonlyArray<readonly [field: string, value: string, note: string]> = [
  ['platform', 'browser', 'runs from a url — no install, no launcher'],
  ['renderer', 'raw three.js', 'no unity, no unreal, no engine layer'],
  ['mode', '6v6', 'hero shooter — two teams of six'],
  ['champions', '10', 'full ability kits, all ten'],
  ['post pipeline', 'custom', 'post-processing chain built for this game'],
  ['status', 'parked', 'see 1.0 — deliberate, not abandoned'],
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
        <ChamberTitle kicker="VOXHALLA — BROWSER VOXEL HERO SHOOTER">
          Ten champions, no engine, parked on purpose.
        </ChamberTitle>
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
            parked — deliberate
          </span>
          <span className={s.statusNote}>jarvis ships first · voxhalla waits</span>
        </div>

        <div className={s.plate}>
          <HeroArt id="voxhalla" alt="Voxel cloudscape" />
          <p className={s.plateCap}>plate i — voxel cloudscape</p>
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
            <div className={s.roster} aria-label="Ten champions, each with a full ability kit">
              {ROSTER.map((n) => (
                <div key={n} className={s.champ}>
                  <span className={s.champIdx}>{String(n).padStart(2, '0')}</span>
                  <span className={s.tickDone}>kit</span>
                </div>
              ))}
            </div>
            <p className={s.legend}>kit = full ability kit, complete</p>
          </section>

          <section className={s.notesSec}>
            <h3 className={s.secHead}>
              <span>4.0</span>notes
            </h3>
            <div className={`prose ${s.notes}`}>
              <p>
                Voxhalla is a six-versus-six voxel hero shooter that runs in the browser. No
                Unity, no Unreal, no engine — I wrote it on raw Three.js, with a custom
                post-processing pipeline on top.
              </p>
              <p>
                Ten champions exist, each with a full ability kit. Then I parked it,
                deliberately: Jarvis ships first, and Voxhalla waits its turn. Parked is the
                honest word, so it is the word on the sheet.
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
