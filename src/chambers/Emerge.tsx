import { ChamberTitle, Marginalia, Stat, Gallery, HeroArt } from './shared';
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
    body: 'APM & Solutions Engineer. One desk, both sides of it — I scope the agent on the product side, then build it, ship it, and hold it on the engineering side.',
    exhibit: 'role · emerge ai',
    span: s.span2,
  },
  {
    index: '02',
    tag: 'deployed',
    title: 'Four production agents',
    body: 'Four Claude Managed Agents shipped to production — reception and talent pipelines. All of them built for the company’s clients. The headline is literal.',
    exhibit: 'claude managed agents · ×4',
    span: s.span4,
  },
  {
    index: '03',
    tag: 'delivered',
    title: 'The CEO seminar',
    body: 'I led an AI seminar for a room of fifteen chief executives. If I can’t explain an agent to the people who pay for it, I haven’t finished building it.',
    exhibit: 'audience · 15 ceos',
    span: s.span3,
  },
  {
    index: '04',
    tag: 'designed',
    title: 'Pricing & usage architecture',
    body: 'I designed how the platform charges for agents — the pricing and usage architecture under every deployment. The meter the business runs on.',
    exhibit: 'scope · platform-wide',
    span: s.span3,
  },
];

export default function Emerge() {
  const reduced = useStore((st) => st.reducedMotion);
  return (
    <div className={reduced ? s.root : `${s.root} ${s.animate}`}>
      <header className={s.head}>
        <ChamberTitle kicker="EMERGE AI — CLIENT WORK">
          Four agents live. None of them mine.
        </ChamberTitle>
        <div className={s.stamp} aria-hidden="true">
          <span className={s.stampOrg}>Emerge AI</span>
          <span className={s.stampLine}>client record · live</span>
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

      <div className={s.brief}>
        <div className={s.briefText}>
          <div className={`prose ${s.summary}`}>
            <p>
              I hold one seat with two jobs at Emerge AI: scope the agent on the product side,
              build and ship it on the engineering side. Four Claude Managed Agents are live in
              production — every one built for the company&rsquo;s clients, not for me.
            </p>
          </div>
          <div className={s.tally}>
            <Stat value="4" label="agents live in production" />
            <Stat value="0" label="of them mine" />
            <Stat value="15" label="CEOs, one seminar" />
            <Stat value="1" label="pricing architecture, platform-wide" />
          </div>
        </div>
        <div className={s.heroSlot}>
          <HeroArt id="emerge" alt="Dossier paper under raking light" />
          <Marginalia className={s.heroCap}>fig. 00 — dossier, raking light</Marginalia>
        </div>
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
