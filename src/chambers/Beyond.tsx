import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ChamberTitle, Marginalia, Stat, Gallery } from './shared';
import { useStore } from '../state/store';
import { CONTACT, isPending } from '../content/nodes';
import s from './Beyond.module.css';

/* Layout language: an editorial timeline / map hybrid — the human chamber.
   Warmest type, most whitespace, longest scroll. Three threads, then contact. */

/* ---------- 01 · athlete ---------- */

const RACES: ReadonlyArray<readonly [string, string, string]> = [
  ['RUN', 'BOLDER BOULDER 10K', 'the Boulder rite of passage. finish line inside Folsom Field.'],
  ['MAY 2026', 'SPRINT TRIATHLON', 'first start line with all three disciplines. crossed it a finisher.'],
  ['AHEAD', 'IRONMAN 70.3', 'in training now. the splits below are the assignment.'],
];

/* ---------- 02 · voyager — the route ---------- */

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
  ['01', 'ROCHESTER, NY', 'where it started.'],
  ['02', 'MONROE CC', 'first miles of the degree.'],
  ['03', 'SEMESTER AT SEA', 'one voyage, most of a world.'],
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

/* ---------- 03 · operator of small joys ---------- */

const JOYS: ReadonlyArray<readonly [string, string]> = [
  ['GUITAR', 'the one practice with no metrics attached. it has survived every move so far.'],
  ["'19 IMPREZA", 'the current chapter of a long car habit — torque specs, careful washes, too many forum tabs.'],
  ['SCORCHED SMP', 'a Minecraft server I run for friends, with custom raid and claims plugin systems I built myself.'],
  ['ONE BETTA FISH', 'supervises the desk. remains unimpressed by all of the above.'],
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
      <span className={s.threadNum}>{num}</span>
      <span className={s.threadLabel}>{label}</span>
      <span className={s.threadRule} aria-hidden="true" />
    </div>
  );
}

export default function Beyond() {
  return (
    <div className={s.root}>
      <header className={s.head}>
        <ChamberTitle kicker="BEYOND — THE PERSON">The rest of the map.</ChamberTitle>
        <Marginalia className={s.tagline}>athlete · voyager · operator of small joys</Marginalia>
      </header>

      <div className={`prose ${s.intro}`}>
        <p>
          Eight nodes in the system. Seven are work. This one is the operator — three threads
          running underneath everything else: a body in training, a route still being drawn, and a
          handful of small systems kept alive because they make the days better.
        </p>
      </div>

      <section className={s.thread}>
        <ThreadHead num="01" label="ATHLETE" />
        <div className="prose">
          <p>
            Endurance sport is the cleanest feedback loop I know — log the work, race the proof.
            The sprint triathlon settled whether I could stack three disciplines in one morning.
            The 70.3 asks the same question at more than four times the distance.
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
          <Stat value="1.2" label="mi swim — 70.3 split" />
          <Stat value="56" label="mi bike — 70.3 split" />
          <Stat value="13.1" label="mi run — 70.3 split" />
        </div>
      </section>

      <section className={s.thread}>
        <ThreadHead num="02" label="VOYAGER" />
        <div className="prose">
          <p>
            No straight lines here. Rochester to Monroe Community College, a semester circling the
            planet with Semester at Sea, then out to Colorado State — B.S. in Business
            Administration, Marketing, December 2025. Boulder holds the current pin. The dashed
            legs are live candidates, not decoration.
          </p>
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
        <ThreadHead num="03" label="OPERATOR OF SMALL JOYS" />
        <div className="prose">
          <p>The third thread has no finish lines and no degrees. It runs anyway.</p>
        </div>
        <ul className={s.joys}>
          {JOYS.map(([key, note]) => (
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
        <Marginalia className={s.contactKicker}>final waypoint — say hello</Marginalia>
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
