import type { ReactNode } from 'react';
import { ChamberTitle, Marginalia, Gallery } from './shared';
import { CONTACT } from '../content/nodes';
import s from './Luven.module.css';

/* Layout language: a business one-pager with editorial weight (§3). */

interface LedgerRow {
  label: string;
  value: string;
  note: string;
  star?: boolean;
}

const LEDGER: readonly LedgerRow[] = [
  { label: 'first production sale', value: '$994', note: 'closed March 2026', star: true },
  { label: 'production workflows', value: '9', note: 'n8n · all live' },
  { label: 'workflow nodes', value: '770+', note: 'across nine flows' },
  { label: 'delivery', value: 'GHL-native', note: "inside the client's CRM" },
  { label: 'coverage', value: '24/7', note: 'nights, weekends, jobsites' },
];

function Section({ index, label, children }: { index: string; label: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <p className={s.secLabel}>
        <span className={s.secIndex}>{index}</span>
        {label}
      </p>
      <div className={s.secBody}>{children}</div>
    </section>
  );
}

export default function Luven() {
  return (
    <div className={s.root}>
      <div className={s.docRule} aria-hidden="true" />
      <div className={s.docline}>
        <Marginalia>Luven AI · one-pager</Marginalia>
        <span className={s.status}>
          <span className={s.tick} aria-hidden="true" />
          <Marginalia>in production</Marginalia>
        </span>
      </div>

      <header className={s.head}>
        <ChamberTitle kicker="LUVEN AI — FOUNDER">Every missed call is a missed job.</ChamberTitle>
      </header>

      <Section index="01" label="the product">
        <div className={`prose ${s.lede}`}>
          <p>
            Luven is an AI voice receptionist for trades and home-services businesses — it answers,
            qualifies, and books. 24/7.
          </p>
        </div>
      </Section>

      <Section index="02" label="the numbers">
        <div className={s.ledger} role="group" aria-label="Luven AI, in numbers">
          {LEDGER.map((row, i) => (
            <div key={row.label} className={s.row} style={{ animationDelay: `${0.2 + i * 0.09}s` }}>
              <span className={s.rowLabel}>{row.label}</span>
              <span className={s.leader} aria-hidden="true" />
              <span className={s.rowEnd}>
                <span className={`${s.rowValue}${row.star ? ` ${s.starValue}` : ''}`}>{row.value}</span>
                <span className={s.rowNote}>{row.note}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section index="03" label="the vertical">
        <div className="prose">
          <p>
            The vertical, plainly: trades and home-services. HVAC, plumbing, electrical, roofing —
            businesses run from a truck, where the owner is on a roof when the phone rings and the
            job goes to whoever picks up. Luven picks up.
          </p>
          <p>
            Nine production n8n workflows — 770-plus nodes between them — delivered native inside
            GoHighLevel. Booked calls land straight on the client&rsquo;s calendar. No new software,
            nothing to learn.
          </p>
          <p>
            First production sale closed March 2026: $994. A small number with the right shape — a
            real business paying real money for calls it used to miss. Operated under Luven
            Technologies LLC.
          </p>
        </div>
      </Section>

      <Section index="04" label="evidence">
        <Gallery
          id="luven"
          captions={['workflow canvas — nine flows in n8n', 'live call — qualification transcript', 'booking flow — GHL calendar']}
        />
      </Section>

      <footer className={s.foot}>
        <span className={s.footRule} aria-hidden="true" />
        <div className={s.footLine}>
          <Marginalia>Luven Technologies LLC</Marginalia>
          <Marginalia>prepared by {CONTACT.name} — founder</Marginalia>
        </div>
      </footer>
    </div>
  );
}
