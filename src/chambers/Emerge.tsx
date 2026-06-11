import { ChamberTitle, Marginalia, Stat, Gallery } from './shared';
import { useStore } from '../state/store';
import s from './Emerge.module.css';

/* Layout language: an operator dossier — numbered case files on a hairline-ruled grid. */

interface CaseFile {
  index: string;
  tag: string;
  title: string;
  body: string;
  exhibit: string;
  span: string;
}

const FILES: CaseFile[] = [
  {
    index: '01',
    tag: 'active',
    title: 'Appointment',
    body: 'APM & Solutions Engineer. One desk, both sides of it — scope the agent on the product side, then build it, ship it, and hold it on the engineering side.',
    exhibit: 'role · emerge ai',
    span: s.span2,
  },
  {
    index: '02',
    tag: 'deployed',
    title: 'Four production agents',
    body: 'Claude Managed Agents built and shipped to production — reception, talent pre-screening, and the talent interview pipelines. Scoped, deployed, and kept in service.',
    exhibit: 'claude managed agents · ×4',
    span: s.span4,
  },
  {
    index: '03',
    tag: 'delivered',
    title: 'The YPO seminar',
    body: 'Led an AI seminar for a room of fifteen chief executives. Translating agent systems for the people who sign for them is its own engineering discipline.',
    exhibit: 'audience · 15 ceos',
    span: s.span3,
  },
  {
    index: '04',
    tag: 'adopted',
    title: 'Pricing & usage architecture',
    body: 'Designed how the platform charges for agents — the pricing and usage architecture under every deployment. The meter the business runs on.',
    exhibit: 'scope · platform-wide',
    span: s.span3,
  },
];

export default function Emerge() {
  const reduced = useStore((st) => st.reducedMotion);
  return (
    <div className={reduced ? s.root : `${s.root} ${s.animate}`}>
      <header className={s.head}>
        <ChamberTitle kicker="EMERGE AI — OPERATOR">Matters of record.</ChamberTitle>
        <div className={s.stamp} aria-hidden="true">
          <span className={s.stampOrg}>Emerge AI</span>
          <span className={s.stampLine}>record · in service</span>
        </div>
      </header>

      <ul className={s.meta}>
        <li className={s.metaItem}>
          <span className={s.metaKey}>role</span>APM &amp; Solutions Engineer
        </li>
        <li className={s.metaItem}>
          <span className={s.metaKey}>org</span>Emerge AI
        </li>
        <li className={s.metaItem}>
          <span className={s.metaKey}>status</span>
          <span className={s.tick} aria-hidden="true" />
          Active
        </li>
      </ul>

      <div className={`prose ${s.summary}`}>
        <p>
          The seat is half product, half deployment: scope an agent, then build it, ship it, and
          hold it in production. Four entries on file. All of them shipped.
        </p>
      </div>

      <div className={s.tally}>
        <Stat value="4" label="production agents shipped" />
        <Stat value="3" label="agent pipelines in service" />
        <Stat value="15" label="CEOs, one seminar" />
        <Stat value="1" label="platform pricing architecture" />
      </div>

      <section className={s.files} aria-label="Case files">
        {FILES.map((f) => (
          <article key={f.index} className={`${s.file} ${f.span}`}>
            <div className={s.fileHead}>
              <span className={s.fileIndex}>file {f.index}</span>
              <span className={s.leader} aria-hidden="true" />
              <span className={s.fileTag}>{f.tag}</span>
            </div>
            <h3 className={s.fileTitle}>{f.title}</h3>
            <div className={`prose ${s.fileBody}`}>
              <p>{f.body}</p>
            </div>
            <p className={s.exhibit}>
              <span className={s.exhibitMark} aria-hidden="true" />
              {f.exhibit}
            </p>
          </article>
        ))}
      </section>

      <section className={s.media}>
        <Marginalia>attached exhibits — media</Marginalia>
        <Gallery
          id="emerge"
          captions={[
            'exhibit a — reception agent, live',
            'exhibit b — interview pipeline, run view',
            'exhibit c — ypo seminar, the room',
          ]}
        />
      </section>

      <footer className={s.eof}>
        <span className={s.eofRule} aria-hidden="true" />
        <Marginalia>end of file · 04 entries · emerge ai</Marginalia>
        <span className={s.eofRule} aria-hidden="true" />
      </footer>
    </div>
  );
}
