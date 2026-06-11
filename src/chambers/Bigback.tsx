import { HeroArt, ChamberTitle, PullStat } from './shared';
import { useStore } from '../state/store';
import s from './Bigback.module.css';

/* Layout language: the teaser — quietest, emptiest spread in the set. One narrow
   centered column floats in vast vertical air (the camera holds the planet small
   and far; the emptiness is intentional). Headline → statement → the one loud
   moment ("1") → atmosphere band → numbered spec rows. One oversized gap governs
   the whole stack. */

const ROWS = [
  ['01', 'state', 'on the bench'],
  ['02', 'stack', 'react native · supabase · claude api'],
  ['03', 'mark', 'trademark filing — in progress'],
  ['04', 'domain', 'bigback.fit · secured'],
] as const;

export default function Bigback() {
  const reduced = useStore((st) => st.reducedMotion);
  return (
    <div className={`${s.root}${reduced ? ` ${s.still}` : ''}`}>
      <section className={s.column} aria-label="Bigback — AI fitness concept, on the bench">
        <ChamberTitle kicker="BIGBACK · AI FITNESS CONCEPT">Log a meal by saying it.</ChamberTitle>

        {/* the statement — reveal engine owns .prose p */}
        <div className="prose">
          <p>
            An AI fitness app built around one interaction: you talk, it logs. I parked the
            concept on the bench. The paperwork didn’t stop.
          </p>
        </div>

        <div className={s.statMoment}>
          <PullStat value={1} caption="interaction — you talk, it logs" />
        </div>

        <div className={s.heroSlot}>
          <HeroArt id="bigback" alt="Chalk dust in one beam of light" />
        </div>

        <div>
          <dl className={s.rows}>
            {ROWS.map(([n, k, v]) => (
              <div key={k} className={s.row}>
                <dt className={s.key}>
                  <span className={`ch-rule ${s.rowRule}`} data-rule aria-hidden="true" />
                  <span className={s.idx}>{n}</span>
                  {k}
                </dt>
                <dd className={s.val}>
                  {k === 'mark' && <span className={s.tick} aria-hidden="true" />}
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <span className="ch-rule" data-rule aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
