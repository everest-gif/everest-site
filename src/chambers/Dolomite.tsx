import { useEffect, useState } from 'react';
import { ChamberTitle, Marginalia, Stat, PullStat, Gallery, HeroArt } from './shared';
import { useStore } from '../state/store';
import s from './Dolomite.module.css';

/* Layout language: a sparse editorial spread on a 12-col grid (§3).
   One headline, one prose passage, one quiet instrument low/right.
   The enlarged planet owns the left third — whitespace is the design. */

const BLIPS = [
  [204, 96, 'JARVIS'],
  [96, 122, 'LUVEN'],
  [124, 214, 'EMERGE'],
  [232, 192, 'EVERCLASH'],
  [78, 232, 'VOXHALLA'],
  [244, 64, 'BIGBACK'],
  [136, 58, 'BEYOND'],
] as const;

/* 12 bearing ticks on the outer ring, 30° apart. */
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  return {
    x1: +(160 + Math.sin(a) * 138).toFixed(1),
    y1: +(160 - Math.cos(a) * 138).toFixed(1),
    x2: +(160 + Math.sin(a) * 144).toFixed(1),
    y2: +(160 - Math.cos(a) * 144).toFixed(1),
  };
});

/* The three standing missions — exactly what the desk does, nothing speculative. */
const MISSIONS = [
  { id: 'M-01', verb: 'dispatch', desc: 'missions out to coding agents' },
  { id: 'M-02', verb: 'consolidate', desc: 'stray repos into one tree' },
  { id: 'M-03', verb: 'audit', desc: 'credentials, swept' },
] as const;

function MissionClock() {
  const reduced = useStore((st) => st.reducedMotion);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setSec((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, [reduced]);
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const sc = String(sec % 60).padStart(2, '0');
  return (
    <span className={s.clock}>
      T+{h}:{m}:{sc}
    </span>
  );
}

/* The chamber's instrument identity — unboxed, small, quiet. */
function Radar() {
  return (
    <figure className={s.radarFig}>
      <Marginalia className={s.scopeTag}>scope — all projects</Marginalia>
      <svg
        className={s.radar}
        viewBox="0 0 320 320"
        role="img"
        aria-label="Radar scope: seven project blips under a continuous sweep, Dolomite at center"
      >
        <defs>
          <linearGradient id="dolo-sweep" gradientUnits="userSpaceOnUse" x1="160" y1="16" x2="232" y2="35">
            <stop offset="0" className={s.sweepFillStart} />
            <stop offset="1" className={s.sweepFillEnd} />
          </linearGradient>
        </defs>
        <circle className={s.ring} cx="160" cy="160" r="48" />
        <circle className={s.ring} cx="160" cy="160" r="96" />
        <circle className={`${s.ring} ${s.ringOuter}`} cx="160" cy="160" r="144" />
        <line className={s.cross} x1="16" y1="160" x2="304" y2="160" />
        <line className={s.cross} x1="160" y1="16" x2="160" y2="304" />
        {TICKS.map((t) => (
          <line key={`${t.x1}-${t.y1}`} className={s.tick} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
        <g className={s.sweep} aria-hidden="true">
          <path d="M 160 160 L 160 16 A 144 144 0 0 1 232 35.3 Z" fill="url(#dolo-sweep)" />
          <line className={s.sweepLine} x1="160" y1="160" x2="232" y2="35.3" />
        </g>
        {BLIPS.map(([x, y, name]) => (
          <g key={name}>
            <circle className={s.blip} cx={x} cy={y} r="2.6" />
            <text className={s.blipLabel} x={x + 8} y={y + 3}>
              {name}
            </text>
          </g>
        ))}
        <circle className={s.ping} cx="204" cy="96" r="10" aria-hidden="true" />
        <circle className={s.centerRing} cx="160" cy="160" r="8" />
        <circle className={s.center} cx="160" cy="160" r="3.2" />
      </svg>
      <Marginalia className={s.sweepTag}>sweep 7.0s — local</Marginalia>
    </figure>
  );
}

export default function Dolomite() {
  return (
    <div className={s.root}>
      <header className={`${s.head} ch-head-overlap`}>
        <ChamberTitle kicker="DOLOMITE — MISSION CONTROL · LOCAL">
          Every project answers to one desk.
        </ChamberTitle>
        <Marginalia className={s.tagline}>Internal tool. One machine. One operator.</Marginalia>
      </header>

      <div className={s.pull}>
        <PullStat value={7} caption="projects under one sweep" />
      </div>

      <div className={`prose ${s.debrief}`}>
        <p>
          Dolomite is local mission control for my other projects. It dispatches missions
          through coding agents, pulls stray repos into one tree, and audits credentials.
          Semi-autonomous — the agents do the work, and I am still in the chair.
        </p>
        <p>
          There are no users to count and no revenue to report. It is an internal tool: every
          other chamber on this map reports to it. That is the whole job.
        </p>
      </div>

      <section className={s.board} aria-label="Mission board">
        <span className={`ch-rule ${s.boardRule}`} data-rule />
        <div className={s.ops}>
          <div className={s.readout} aria-label="System readout">
            <p className={s.readoutRow}>
              <span className={s.readoutLabel}>operator</span>
              <span className={s.readoutValue}>01</span>
            </p>
            <p className={s.readoutRow}>
              <span className={s.readoutLabel}>uplink</span>
              <span className={s.readoutValue}>local</span>
            </p>
            <p className={s.readoutRow}>
              <span className={s.readoutLabel}>session</span>
              <MissionClock />
            </p>
          </div>
          <ul className={s.missionList}>
            {MISSIONS.map((m) => (
              <li key={m.id} className={s.mission}>
                <span className={s.mId}>{m.id}</span>
                <span className={s.mVerb}>{m.verb}</span>
                <span className={s.mDesc}>{m.desc}</span>
                <span className={s.mMode}>
                  <span className={s.dot} aria-hidden="true" />
                  semi-auto
                </span>
              </li>
            ))}
          </ul>
          <div className={s.stats}>
            <Stat value="3" label="standing missions" />
            <Stat value="1" label="operator" />
            <Stat value="internal" label="no users to count" />
          </div>
        </div>
        <Radar />
      </section>

      <div className={s.heroBand}>
        <HeroArt id="dolomite" alt="Macro rock strata, amber edge light" />
      </div>

      <section className={s.foot} aria-label="Evidence">
        <span className="ch-rule" data-rule />
        <Gallery id="dolomite" captions={['ops board — live missions', 'dispatch — claude code uplink']} />
      </section>
    </div>
  );
}
