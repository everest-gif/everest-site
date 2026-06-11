import { ChamberTitle, Marginalia, Gallery, HeroArt, PullStat } from './shared';
import s from './Voxhalla.module.css';

/* Layout language: spec-sheet brutalism — the project rendered as an engineering datasheet.
   Two fat columns of spec cells, each dominated by an oversized Fraunces value; section
   numerals set big — oversized numerals are the design language of this sheet. The reveal
   engine draws each cell's hairline ([data-rule]) and fades the values in (.ch-stat-value). */

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
          <span className={s.secNum}>1.0</span>
          <span className={s.statusKey}>status</span>
          <span className={s.statusVal}>
            <i className={s.tick} aria-hidden="true" />
            parked — deliberate
          </span>
          <span className={s.statusNote}>jarvis ships first · voxhalla waits</span>
        </div>

        <div className={s.pullRow}>
          <PullStat value={6} suffix="v6" caption="two teams of six — hero shooter" />
        </div>

        <div className={s.plate}>
          <HeroArt id="voxhalla" alt="Voxel cloudscape" />
          <p className={s.plateCap}>plate i — voxel cloudscape</p>
        </div>

        <section>
          <h3 className={s.secHead}>
            <span className={s.secNum}>2.0</span>
            <span className={s.secLabel}>specification</span>
          </h3>
          <div className={s.specGrid} role="table" aria-label="Voxhalla specification">
            {SPEC.map(([field, value, note], i) => (
              <div
                key={field}
                className={field === 'status' ? `${s.spec} ${s.specStatus}` : s.spec}
                role="row"
              >
                <span className={s.specField} role="rowheader">
                  {field}
                </span>
                <span className={s.specIdx} role="cell">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={s.specRule} data-rule aria-hidden="true" />
                <span className={`ch-stat-value ${s.specValue}`} role="cell">
                  {value}
                </span>
                <span className={s.specNote} role="cell">
                  {note}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className={s.split}>
          <section className={s.rosterSec}>
            <h3 className={s.secHead}>
              <span className={s.secNum}>3.0</span>
              <span className={s.secLabel}>champion roster — 10 / 10</span>
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
              <span className={s.secNum}>4.0</span>
              <span className={s.secLabel}>notes</span>
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
            <span className={s.secNum}>5.0</span>
            <span className={s.secLabel}>figures</span>
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
