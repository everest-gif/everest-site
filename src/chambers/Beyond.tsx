import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ChamberTitle, Marginalia, Stat, Gallery, HeroArt } from './shared';
import { useStore } from '../state/store';
import { CONTACT, isPending } from '../content/nodes';
import s from './Beyond.module.css';

/* Layout language: an editorial timeline / map hybrid — the human chamber.
   Warmest type, most whitespace, longest scroll. One shared rail (--rail in the
   module) aligns every list in the chamber. Three threads, then contact. */

/* ---------- 01 · athlete ---------- */

const RACES: ReadonlyArray<readonly [string, string, string]> = [
  ['DONE', 'BOLDER BOULDER 10K', 'The local 10K. I ran it.'],
  ['MAY 2026', 'SPRINT TRIATHLON', 'Swim, bike, run, one morning. I finished.'],
  ['IN TRAINING', 'IRONMAN 70.3', 'The splits below are the assignment.'],
];

/* ---------- 02 · the route ---------- */

const BOULDER = { x: 488, y: 120 };

interface Waypoint {
  x: number;
  y: number;
  label: string;
  labelY: number;
  sub?: { text: string; y: number };
  current?: boolean;
}

const PAST: Waypoint[] = [
  { x: 46, y: 56, label: 'ROCHESTER, NY', labelY: 30, sub: { text: 'ORIGIN', y: 42 } },
  { x: 148, y: 98, label: 'MONROE CC', labelY: 124 },
  { x: 270, y: 188, label: 'SEMESTER AT SEA', labelY: 214 },
  { x: 402, y: 72, label: 'COLORADO STATE', labelY: 34, sub: { text: 'B.S. · MARKETING · DEC 2025', y: 48 } },
  { x: BOULDER.x, y: BOULDER.y, label: 'BOULDER, CO', labelY: 146, sub: { text: 'CURRENT', y: 160 }, current: true },
];

const FUTURE: Waypoint[] = [
  { x: 628, y: 46, label: 'CRETE', labelY: 30 },
  { x: 676, y: 128, label: 'VALENCIA', labelY: 154 },
  { x: 604, y: 208, label: 'COSTA RICA', labelY: 234 },
];

const MANIFEST: ReadonlyArray<readonly [string, string, string]> = [
  ['01', 'ROCHESTER, NY', 'where I started.'],
  ['02', 'MONROE CC', 'first leg of the degree.'],
  ['03', 'SEMESTER AT SEA', 'a campus that moved.'],
  ['04', 'COLORADO STATE', 'B.S. Business Administration, Marketing — December 2025.'],
  ['05', 'BOULDER, CO', 'current coordinates.'],
  ['06', 'COSTA RICA · CRETE · VALENCIA', 'next coordinates, under evaluation.'],
];

function RouteMap() {
  const reduced = useStore((st) => st.reducedMotion);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const line = svg.querySelector<SVGPolylineElement>('[data-anim="line"]');
    const marks = Array.from(svg.querySelectorAll<SVGGElement>('[data-anim="mark"]'));
    const futures = Array.from(svg.querySelectorAll<SVGElement>('[data-anim="future"]'));
    if (!line) return;

    if (reduced) {
      gsap.set([line, ...marks, ...futures], { autoAlpha: 1 });
      return;
    }

    const len = line.getTotalLength();
    const tl = gsap.timeline({ delay: 0.4, defaults: { ease: 'power2.out' } });
    tl.set(line, { autoAlpha: 1, strokeDasharray: len, strokeDashoffset: len })
      .to(line, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' })
      .to(marks, { autoAlpha: 1, duration: 0.4, stagger: 0.07 }, '-=0.8')
      .to(futures, { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, '-=0.15');
    return () => {
      tl.kill();
    };
  }, [reduced]);

  return (
    <figure className={s.map}>
      <svg
        ref={svgRef}
        className={s.routeSvg}
        viewBox="0 0 720 248"
        role="img"
        aria-label="Route map: Rochester NY, Monroe Community College, Semester at Sea, Colorado State, Boulder Colorado — current. Dashed future legs under evaluation: Crete, Valencia, Costa Rica."
      >
        <defs>
          <filter id="beyond-route-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <polyline
          data-anim="line"
          className={`${s.routePast} ${s.anim}`}
          points={PAST.map((w) => `${w.x},${w.y}`).join(' ')}
          filter="url(#beyond-route-glow)"
        />

        {FUTURE.map((w) => (
          <line
            key={`leg-${w.label}`}
            data-anim="future"
            className={`${s.routeFuture} ${s.anim}`}
            x1={BOULDER.x}
            y1={BOULDER.y}
            x2={w.x}
            y2={w.y}
          />
        ))}

        {PAST.map((w) => (
          <g key={w.label} data-anim="mark" className={s.anim}>
            {w.current ? (
              <>
                <circle className={s.dotRing} cx={w.x} cy={w.y} r={4.5} />
                <circle className={s.dotLive} cx={w.x} cy={w.y} r={2} />
              </>
            ) : (
              <circle className={s.dotPast} cx={w.x} cy={w.y} r={3} />
            )}
            <text className={s.lbl} x={w.x} y={w.labelY}>
              {w.label}
            </text>
            {w.sub && (
              <text className={s.sub} x={w.x} y={w.sub.y}>
                {w.sub.text}
              </text>
            )}
          </g>
        ))}

        {FUTURE.map((w) => (
          <g key={w.label} data-anim="future" className={s.anim}>
            <circle className={s.dotFuture} cx={w.x} cy={w.y} r={3} />
            <text className={`${s.lbl} ${s.lblFuture}`} x={w.x} y={w.labelY}>
              {w.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className={s.mapCap}>solid — traveled · dashed — under evaluation · not to scale</figcaption>
    </figure>
  );
}

/* ---------- 03 · everything else ---------- */

const REST: ReadonlyArray<readonly [string, string]> = [
  ['GUITAR', 'No log, no splits. I just play.'],
  ["'19 IMPREZA", 'My corner of car culture.'],
  ['SCORCHED SMP', 'A custom Minecraft server I run for friends.'],
  ['ONE BETTA FISH', 'Supervises the desk.'],
];

/* ---------- contact ---------- */

const CONTACT_ROWS: ReadonlyArray<{ label: string; value: string; href: string }> = [
  { label: 'EMAIL', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: 'GITHUB', value: CONTACT.github, href: CONTACT.github },
  { label: 'LINKEDIN', value: CONTACT.linkedin, href: CONTACT.linkedin },
];

function ContactRow({ label, value, href }: { label: string; value: string; href: string }) {
  if (isPending(value)) {
    return (
      <li className={s.cRow}>
        <span className={s.cPending}>{label} · pending</span>
      </li>
    );
  }
  return (
    <li className={s.cRow}>
      <span className={s.cLabel}>{label}</span>
      <a className={s.cLink} href={href} target="_blank" rel="noreferrer">
        {value.replace(/^https?:\/\//, '')}
      </a>
    </li>
  );
}

function ThreadHead({ num, label }: { num: string; label: string }) {
  return (
    <div className={s.threadHead}>
      <span className={s.threadNum}>
        {num}
        <span aria-hidden="true"> /</span>
      </span>
      <span className={s.threadLabel}>{label}</span>
      <span className={s.threadRule} aria-hidden="true" />
    </div>
  );
}

export default function Beyond() {
  return (
    <div className={s.root}>
      <header className={s.head}>
        <ChamberTitle kicker="NODE 08 — THE PERSON">The coordinates keep changing.</ChamberTitle>
        <Marginalia className={s.tagline}>athlete · the route · everything else</Marginalia>
      </header>

      <div className={`prose ${s.intro}`}>
        <p>
          Seven nodes in this system are work. This one is me. Three threads run underneath: a
          body in training, a route still being drawn, and a few small things I keep running
          because they make the days better.
        </p>
      </div>

      <section className={s.thread}>
        <ThreadHead num="01" label="ATHLETE" />
        <div className="prose">
          <p>
            Endurance is the simplest contract I keep — log the work, let race day grade it. The
            sprint distance is done. The 70.3 is next.
          </p>
        </div>
        <ol className={s.races}>
          {RACES.map(([tag, name, note]) => (
            <li key={name} className={s.race}>
              <span className={s.raceTag}>{tag}</span>
              <div className={s.raceBody}>
                <span className={s.raceName}>{name}</span>
                <span className={s.raceNote}>{note}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className={s.stats}>
          <Stat value="1.2" label="mi swim / 70.3" />
          <Stat value="56" label="mi bike / 70.3" />
          <Stat value="13.1" label="mi run / 70.3" />
        </div>
      </section>

      <section className={s.thread}>
        <ThreadHead num="02" label="THE ROUTE" />
        <div className="prose">
          <p>
            I started in Rochester, New York. Monroe Community College, then Semester at Sea, then
            Colorado State — B.S. in Business Administration, Marketing, December 2025. Boulder
            holds the pin now. The dashed legs — Costa Rica, Crete, Valencia — are under
            evaluation, not decoration.
          </p>
        </div>
        <div className={s.heroCrop}>
          <HeroArt id="beyond" alt="A ridgeline at night, one jade route tracing it" />
        </div>
        <RouteMap />
        <ol className={s.manifest}>
          {MANIFEST.map(([n, place, note]) => (
            <li key={n} className={s.mRow}>
              <span className={s.mIdx}>{n}</span>
              <span className={s.mPlace}>{place}</span>
              <span className={s.mNote}>{note}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.thread}>
        <ThreadHead num="03" label="EVERYTHING ELSE" />
        <div className="prose">
          <p>No finish lines in this thread, no degrees. I keep it running anyway.</p>
        </div>
        <ul className={s.joys}>
          {REST.map(([key, note]) => (
            <li key={key} className={s.joy}>
              <span className={s.joyKey}>{key}</span>
              <span className={s.joyNote}>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <Gallery
        id="beyond"
        captions={['finish chute — sprint tri', 'port day — semester at sea', 'scorched smp — spawn']}
      />

      <footer className={s.contact}>
        <Marginalia className={s.contactKicker}>last waypoint — write to me</Marginalia>
        <p className={s.cName}>{CONTACT.name}</p>
        <ul className={s.cRows}>
          {CONTACT_ROWS.map((r) => (
            <ContactRow key={r.label} label={r.label} value={r.value} href={r.href} />
          ))}
        </ul>
      </footer>
    </div>
  );
}
