import { ChamberTitle } from './shared';
import { useStore } from '../state/store';
import s from './Bigback.module.css';

/* Layout language: a product teaser card with lots of air — the restraint is the design. */

const ROWS = [
  ['stack', 'react native · supabase · claude api'],
  ['status', 'trademark filing in progress'],
  ['domain', 'bigback.fit — secured'],
] as const;

export default function Bigback() {
  const reduced = useStore((st) => st.reducedMotion);
  return (
    <div className={`${s.root}${reduced ? ` ${s.still}` : ''}`}>
      <section className={s.card} aria-label="Bigback — product teaser">
        <span className={`${s.corner} ${s.tl}`} aria-hidden="true" />
        <span className={`${s.corner} ${s.tr}`} aria-hidden="true" />
        <span className={`${s.corner} ${s.bl}`} aria-hidden="true" />
        <span className={`${s.corner} ${s.br}`} aria-hidden="true" />

        <ChamberTitle kicker="BIGBACK — AI FITNESS">Next up on the bench.</ChamberTitle>

        <div className={`prose ${s.statement}`}>
          <p>
            A fitness app you talk to. Say what you ate — it logs the macros. It tracks your
            supplement stack and reads restaurant menus, so ordering out doesn’t break the plan.
          </p>
        </div>

        <dl className={s.rows}>
          {ROWS.map(([k, v]) => (
            <div key={k} className={s.row}>
              <dt className={s.key}>{k}</dt>
              <dd className={s.val}>
                {k === 'status' && <span className={s.tick} aria-hidden="true" />}
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
