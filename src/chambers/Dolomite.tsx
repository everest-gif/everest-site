import { useEffect, useState } from 'react';
import { ChamberTitle, Marginalia, Stat, Gallery } from './shared';
import { useStore } from '../state/store';
import s from './Dolomite.module.css';

/* Layout language: a radar / ops board — dark, instrument-like, sparse (§3). */

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

type MissionStatus = 'running' | 'complete' | 'scheduled' | 'continuous';

const MISSIONS: ReadonlyArray<{
  id: string;
  verb: string;
  desc: string;
  status: MissionStatus;
}> = [
  { id: 'M-01', verb: 'dispatch', desc: 'missions handed to claude code', status: 'running' },
  { id: 'M-02', verb: 'consolidate', desc: 'stray repos, one tree', status: 'complete' },
  { id: 'M-03', verb: 'audit', desc: 'credentials swept, rotated', status: 'scheduled' },
  { id: 'M-04', verb: 'observe', desc: 'every node on this map', status: 'continuous' },
];

const STATUS_UI: Record<MissionStatus, { dot: string; text: string; label: string }> = {
  running: { dot: s.dotRunning, text: s.stRunning, label: 'running' },
  complete: { dot: s.dotComplete, text: s.stComplete, label: 'complete' },
  scheduled: { dot: s.dotScheduled, text: s.stScheduled, label: 'scheduled' },
  continuous: { dot: s.dotContinuous, text: s.stContinuous, label: 'continuous' },
};

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

function Radar() {
  return (
    <div className={s.radarPanel}>
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
    </div>
  );
}

export default function Dolomite() {
  return (
    <div className={s.root}>
      <header className={s.head}>
        <div className={s.headLeft}>
          <ChamberTitle kicker="DOLOMITE — MISSION CONTROL">It runs the rest.</ChamberTitle>
          <Marginalia>The tool the other tools report to.</Marginalia>
        </div>
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
      </header>

      <div className={s.board}>
        <Radar />
        <section className={s.missions} aria-label="Mission board">
          <div className={s.boardHead}>
            <Marginalia>mission board</Marginalia>
            <Marginalia>status</Marginalia>
          </div>
          <ul className={s.missionList}>
            {MISSIONS.map((m) => {
              const ui = STATUS_UI[m.status];
              return (
                <li key={m.id} className={s.mission}>
                  <span className={s.mId}>{m.id}</span>
                  <span className={s.mVerb}>{m.verb}</span>
                  <span className={s.mDesc}>{m.desc}</span>
                  <span className={`${s.mStatus} ${ui.text}`}>
                    <span className={`${s.dot} ${ui.dot}`} aria-hidden="true" />
                    {ui.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className={s.stats}>
        <Stat value="every" label="project · one plane" />
        <Stat value="1" label="operator" />
        <Stat value="0" label="left unwatched" />
      </div>

      <div className="prose">
        <p>
          A local command plane over every personal project. Missions dispatch through Claude Code
          — repos consolidated, credentials audited, nothing unwatched. Semi-autonomous: it asks
          before it acts. I built the tools. This one runs them.
        </p>
      </div>

      <Gallery id="dolomite" captions={['ops board — live missions', 'dispatch — claude code uplink']} />
    </div>
  );
}
