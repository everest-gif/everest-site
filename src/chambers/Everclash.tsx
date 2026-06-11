import { useEffect, useState } from 'react';
import { ChamberTitle, Marginalia, Stat, Gallery } from './shared';
import { useStore } from '../state/store';
import s from './Everclash.module.css';

/* Layout language: arcade character-select energy — built from type and motion only. */

const ROSTER = [
  { name: 'KESTREL', style: 'rushdown' },
  { name: 'VANTA', style: 'zoner' },
  { name: 'CINDER', style: 'grappler' },
  { name: 'ROOK', style: 'bulwark' },
  { name: 'MIRAGE', style: 'mixup' },
  { name: 'THORN', style: 'counter' },
  { name: 'VESPER', style: 'assassin' },
  { name: 'RIPTIDE', style: 'charge' },
  { name: 'SABLE', style: 'all-rounder' },
  { name: 'ZENITH', style: 'anchor' },
] as const;

function Roster() {
  const reduced = useStore((st) => st.reducedMotion);
  const [cursor, setCursor] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timer, setTimer] = useState(99);

  /* attract-mode cursor — the CPU browses the roster until you hover */
  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setCursor((c) => (c + 1) % ROSTER.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  /* select-screen countdown */
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setTimer((t) => (t <= 0 ? 99 : t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section aria-label="Fighter roster — ten slots, portraits pending">
      <div className={s.rosterBar}>
        <Marginalia>select your fighter — 10 slots</Marginalia>
        <span className={s.timer} aria-hidden="true">
          T-{String(timer).padStart(2, '0')}
        </span>
      </div>
      <ul
        className={s.rosterGrid}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {ROSTER.map((f, i) => (
          <li
            key={f.name}
            className={`${s.slot}${!reduced && i === cursor ? ` ${s.live}` : ''}`}
          >
            <span className={s.corner} data-c="tl" aria-hidden="true" />
            <span className={s.corner} data-c="tr" aria-hidden="true" />
            <span className={s.corner} data-c="bl" aria-hidden="true" />
            <span className={s.corner} data-c="br" aria-hidden="true" />
            <span className={s.scan} aria-hidden="true" />
            <div className={s.slotTop}>
              <span className={s.slotNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={s.slotTag} aria-hidden="true">
                P1 · SELECT
              </span>
            </div>
            <div className={s.slotFoot}>
              <span className={s.slotName}>{f.name}</span>
              <span className={s.slotStyle}>{f.style}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STACK = [
  ['engine', 'Phaser 3'],
  ['shell', 'React + Vite'],
  ['netcode', 'Colyseus'],
  ['language', 'TypeScript'],
] as const;

export default function Everclash() {
  return (
    <div className={s.root}>
      <header className={s.head}>
        <ChamberTitle kicker="EVERCLASH — 2D PVP FIGHTER">Choose your fighter.</ChamberTitle>
        <div className={s.lobby}>
          <p className={s.lobbyLive}>
            <span className={s.liveDot} aria-hidden="true" />
            lobby open — 8-player free-for-all
          </p>
          <p className={s.lobbyMeta}>runs in the tab · no install · no launcher</p>
        </div>
      </header>

      <Roster />

      <div className={s.specBar} role="list" aria-label="Stack">
        {STACK.map(([k, v]) => (
          <div key={k} className={s.specCell} role="listitem">
            <span className={s.specKey}>{k}</span>
            <span className={s.specVal}>{v}</span>
          </div>
        ))}
      </div>

      <div className={s.band}>
        <div className="prose">
          <p>
            Everclash is a fighting game that lives in a browser tab. No install, no launcher —
            open the URL, pick a fighter, and trade hits with up to seven other people in real
            time. Colyseus rooms carry the netcode, Phaser 3 runs the fight, React and Vite wrap
            the shell. TypeScript end to end.
          </p>
          <p>
            Every fighter on the roster ships with a full animation suite — idle through victory —
            built on a custom AI-assisted art pipeline. One system keeps ten characters visually
            consistent where a studio would put an art team.
          </p>
        </div>
        <div className={s.stats}>
          <Stat value="10" label="fighters on the roster" />
          <Stat value="8" label="players, one arena" />
          <Stat value="0" label="installs — browser only" />
          <Stat value="100%" label="TypeScript" />
        </div>
      </div>

      <Gallery
        id="everclash"
        captions={[
          'character select — full roster',
          'mid-round — 8-player free-for-all',
          'victory pose — animation suite',
        ]}
      />
    </div>
  );
}
