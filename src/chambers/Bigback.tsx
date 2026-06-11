import { HeroArt, ChamberTitle } from './shared';
import { useStore } from '../state/store';
import s from './Bigback.module.css';

/* Layout language: a spec plate — one left-aligned column inside a registered card.
   Headline → statement → atmosphere band → numbered spec rows. One rhythm governs
   the stack; the corner ticks read as registration marks, not decoration. */

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
      <section className={s.card} aria-label="Bigback — AI fitness concept, on the bench">
        <span className={`${s.corner} ${s.tl}`} aria-hidden="true" />
        <span className={`${s.corner} ${s.tr}`} aria-hidden="true" />
        <span className={`${s.corner} ${s.bl}`} aria-hidden="true" />
        <span className={`${s.corner} ${s.br}`} aria-hidden="true" />

        <ChamberTitle kicker="BIGBACK · AI FITNESS CONCEPT">Log a meal by saying it.</ChamberTitle>

        <div className={`prose ${s.statement}`}>
          <p>
            An AI fitness app built around one interaction: you talk, it logs. I parked the
            concept on the bench. The paperwork didn’t stop.
          </p>
        </div>

        <div className={s.heroSlot}>
          <HeroArt id="bigback" alt="Chalk dust in one beam of light" />
        </div>

        <dl className={s.rows}>
          {ROWS.map(([n, k, v]) => (
            <div key={k} className={s.row}>
              <dt className={s.key}>
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
      </section>
    </div>
  );
}
