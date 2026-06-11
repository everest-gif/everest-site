import { useEffect, useRef, useState } from 'react';
import { ChamberTitle, Marginalia, Stat, Gallery, HeroArt, PullStat } from './shared';
import { useStore } from '../state/store';
import s from './Jarvis.module.css';

/* Layout language: a live system console (§3). */

const LOG_LINES = [
  ['23:41:07', 'evolver', 'nightly chain started · missions queued'],
  ['23:41:09', 'researcher', 'source scan running · agent eval harnesses'],
  ['23:41:31', 'builder', 'patch applied · tests 220/220 green'],
  ['23:42:02', 'content', 'draft assembled · tone check passed'],
  ['23:42:18', 'core', 'routing: tier-2 → tier-1 (hard reasoning step)'],
  ['23:42:40', 'builder', 'electron dashboard: mission card updated'],
  ['23:43:05', 'evolver', 'self-review: improvements proposed'],
  ['23:43:21', 'core', 'voice loop idle · wake word armed'],
  ['23:43:58', 'researcher', 'summary committed to memory store'],
  ['23:44:12', 'core', 'cost guard: inference cost down ~90%'],
  ['23:44:36', 'builder', 'chain complete · zero intervention'],
  ['23:45:01', 'evolver', 'tomorrow: ship, verify, repeat'],
] as const;

function Console() {
  const reduced = useStore((s2) => s2.reducedMotion);
  const [count, setCount] = useState(reduced ? LOG_LINES.length : 3);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setCount((c) => (c >= LOG_LINES.length ? 3 : c + 1));
    }, 1100);
    return () => window.clearInterval(id);
  }, [reduced]);
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);
  return (
    <div className={s.console} aria-label="Simulated agent activity log (stylized replay)">
      <div className={s.consoleBar}>
        <span className={s.consoleDot} />
        <Marginalia>jarvis · agent activity — stylized replay</Marginalia>
      </div>
      <div className={s.consoleBody} ref={bodyRef}>
        {LOG_LINES.slice(0, count).map(([t, agent, msg]) => (
          <p key={t} className={s.logLine}>
            <span className={s.logTime}>{t}</span>
            <span className={s.logAgent}>{agent}</span>
            <span className={s.logMsg}>{msg}</span>
          </p>
        ))}
        <p className={s.logCursor} aria-hidden="true">
          ▮
        </p>
      </div>
    </div>
  );
}

function Diagram() {
  return (
    <svg className={s.diagram} viewBox="0 0 360 200" role="img" aria-label="Architecture: a central core orchestrating four agents — Researcher, Builder, Content, Evolver">
      <defs>
        <filter id="jglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#jglow)" stroke="#E8A23D" fill="none" strokeWidth="1">
        <circle cx="180" cy="100" r="26" />
        {[
          [60, 30],
          [300, 30],
          [60, 170],
          [300, 170],
        ].map(([x, y]) => (
          <line key={`${x}-${y}`} x1="180" y1="100" x2={x} y2={y} strokeOpacity="0.55" />
        ))}
        {[
          [60, 30],
          [300, 30],
          [60, 170],
          [300, 170],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - 34} y={y - 13} width="68" height="26" strokeOpacity="0.85" />
        ))}
      </g>
      <g fill="#EDE8DF" fontFamily="JetBrains Mono Variable, monospace" fontSize="9" letterSpacing="1.5" textAnchor="middle">
        <text x="180" y="103" fill="#E8A23D">
          CORE
        </text>
        <text x="60" y="33">RESEARCHER</text>
        <text x="300" y="33">BUILDER</text>
        <text x="60" y="173">CONTENT</text>
        <text x="300" y="173">EVOLVER</text>
      </g>
    </svg>
  );
}

export default function Jarvis() {
  return (
    <div className={s.root}>
      <header className={`${s.head} ch-head-overlap`}>
        <ChamberTitle kicker="JARVIS — PERSONAL AI ORCHESTRATOR · LOCAL ON APPLE SILICON">
          Four agents. One operator.
        </ChamberTitle>
        <Marginalia className={s.tagline}>It builds while I sleep.</Marginalia>
      </header>

      <PullStat value={220} caption="tests green at merge — every nightly chain" />

      <section className={s.section}>
        <Marginalia className={s.marker}>01 / telemetry</Marginalia>
        <div className={s.grid}>
          <Console />
          <div className={s.side}>
            <Diagram />
            <div className={s.stats}>
              <Stat value="4" label="agents, one core" />
              <Stat value="220" label="tests green at merge" />
              <Stat value="nightly" label="autonomous build chains" />
              <Stat value="~90%" label="inference cost cut" />
            </div>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <Marginalia className={s.marker}>02 / how it runs</Marginalia>
        <div className={s.grid}>
          <div className="prose">
            <p>
              Jarvis is my personal AI orchestrator, running locally on Apple Silicon. Four agents
              — Researcher, Builder, Content, Evolver — work under one core. Nightly build chains
              run without me. An Electron dashboard is mission control. The voice loop closes it:
              wake word, speech-to-text, tools, speech back.
            </p>
            <p>
              Routing is two-tier — small models take the routine work, hard reasoning goes to the
              large ones. That cut inference cost about ninety percent. At merge, 220 tests were
              green.
            </p>
          </div>
          <div className={s.heroWrap}>
            <HeroArt id="jarvis" alt="Long-exposure light study — a dark control room, one amber monitor glow" />
          </div>
        </div>
      </section>

      <section className={s.section}>
        <Marginalia className={s.marker}>03 / evidence</Marginalia>
        <Gallery
          id="jarvis"
          captions={['mission control — dashboard', 'voice loop — live session', 'nightly chain — run log']}
        />
      </section>
    </div>
  );
}
