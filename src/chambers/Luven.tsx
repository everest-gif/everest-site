import type { ReactNode } from 'react';
import { ChamberTitle, Marginalia, Gallery, HeroArt, PullStat } from './shared';
import { CONTACT } from '../content/nodes';
import s from './Luven.module.css';

/* Layout language: a business one-pager with editorial weight (§3).
   One grid: 148px marginalia gutter + content column. The hero band sits
   directly under the headline — atmosphere up top, evidence at the bottom. */

interface LedgerRow {
  label: string;
  value: string;
  note: string;
  star?: boolean;
}

const LEDGER: readonly LedgerRow[] = [
  { label: 'first production sale', value: '$994', note: 'closed March 2026', star: true },
  { label: 'workflows', value: '9', note: 'in production' },
  { label: 'nodes', value: '770+', note: 'across nine workflows' },
  { label: 'delivery', value: 'GHL-native', note: "inside the client's CRM" },
  { label: 'coverage', value: '24/7', note: 'answers · qualifies · books' },
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

      <header className={`${s.head} ch-head-overlap`}>
        <ChamberTitle kicker="FOUNDER · LUVEN TECHNOLOGIES LLC">
          Every missed call is a missed job.
        </ChamberTitle>
      </header>

      <PullStat value={994} prefix="$" caption="first production sale — closed March 2026" />

      <div className={s.heroBand}>
        <p className={s.secLabel}>after hours</p>
        <HeroArt id="luven" alt="A workshop phone glowing at night" />
      </div>

      <Section index="01" label="the product">
        <div className={`prose ${s.lede}`}>
          <p>
            I founded Luven: an AI voice receptionist for trades and home-services. It answers,
            qualifies, and books. 24/7.
          </p>
        </div>
      </Section>

      <Section index="02" label="the numbers">
        <div className={s.ledger} role="group" aria-label="Luven, in numbers">
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

      <Section index="03" label="the work">
        <div className="prose">
          <p>
            Trades and home-services run on the phone, and the owner is rarely next to it. Luven
            picks up — day or night — qualifies the caller, and books the job.
          </p>
          <p>
            I built nine production workflows, 770-plus nodes between them, and delivered the
            system GHL-native: it lives inside the CRM the client already uses.
          </p>
          <p>
            First production sale closed March 2026. $994. I run the company as Luven Technologies
            LLC, and it is in production today.
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
