import { ChamberTitle, Marginalia, Gallery, HeroArt, PullStat } from './shared';
import { CONTACT } from '../content/nodes';
import s from './Luven.module.css';

/* Layout language: "LUVEN / ledger" — an editorial spread on a 12-column grid (§3).
   Pull-stat high in the upper right, narrow prose hanging lower left, one hairline
   table set like a term sheet. Letterhead rules top and bottom keep the one-pager
   identity. The live planet owns the left third of the viewport. */

interface LedgerCol {
  head: string;
  value: string;
  notes: readonly string[];
}

const TABLE: readonly LedgerCol[] = [
  {
    head: 'product',
    value: 'AI voice receptionist',
    notes: ['GHL-native · 24/7', 'answers · qualifies · books'],
  },
  { head: 'first sale', value: '$994', notes: ['closed March 2026'] },
  { head: 'workflows', value: '9', notes: ['in production · 770+ nodes'] },
];

export default function Luven() {
  return (
    <div className={s.root}>
      <div className={s.docRule} data-rule aria-hidden="true" />
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

      {/* opening spread — stat dominates upper right, prose hangs lower left */}
      <div className={s.spread}>
        <div className={s.spreadStat}>
          <PullStat value={994} prefix="$" caption="first production sale — closed March 2026" />
        </div>
        <div className={s.spreadProse}>
          <p className={s.mark}>
            <span className={s.markIndex}>01</span>
            the product
          </p>
          <div className={`prose ${s.spreadCopy}`}>
            <p>
              I founded Luven: an AI voice receptionist for trades and home-services. It answers,
              qualifies, and books. 24/7.
            </p>
          </div>
        </div>
      </div>

      <section className={s.section}>
        <p className={s.mark}>after hours</p>
        <div className={s.heroBody}>
          <HeroArt id="luven" alt="A workshop phone glowing at night" />
        </div>
      </section>

      <section className={s.section}>
        <p className={s.mark}>
          <span className={s.markIndex}>02</span>
          the ledger
        </p>
        <div className={s.table} role="group" aria-label="Luven, in numbers">
          <span className="ch-rule" data-rule aria-hidden="true" />
          <div className={s.cols}>
            {TABLE.map((col) => (
              <div key={col.head} className={s.col}>
                <span className={s.th}>{col.head}</span>
                <span className="ch-rule" data-rule aria-hidden="true" />
                <span className={s.td}>{col.value}</span>
                {col.notes.map((note) => (
                  <span key={note} className={s.tdNote}>
                    {note}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <span className="ch-rule" data-rule aria-hidden="true" />
        </div>
      </section>

      <section className={s.section}>
        <p className={s.mark}>
          <span className={s.markIndex}>03</span>
          the work
        </p>
        <div className={`prose ${s.workBody}`}>
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
      </section>

      <section className={s.section}>
        <p className={s.mark}>
          <span className={s.markIndex}>04</span>
          evidence
        </p>
        <div className={s.galleryBody}>
          <Gallery
            id="luven"
            captions={['workflow canvas — nine flows in n8n', 'live call — qualification transcript', 'booking flow — GHL calendar']}
          />
        </div>
      </section>

      <footer className={s.foot}>
        <span className={s.footRule} data-rule aria-hidden="true" />
        <div className={s.footLine}>
          <Marginalia>Luven Technologies LLC</Marginalia>
          <Marginalia>prepared by {CONTACT.name} — founder</Marginalia>
        </div>
      </footer>
    </div>
  );
}
