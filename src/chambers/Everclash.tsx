import { useEffect, useState, type ReactNode } from 'react';
import { ChamberTitle, Marginalia, Stat, Gallery, HeroArt } from './shared';
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

/* Numbered mono marker on a shared hairline — every section hangs from the same rule. */
function SecBar({ num, label, right }: { num: string; label: string; right?: ReactNode }) {
  return (
    <div className={s.secBar}>
      <span className={s.secMark}>
        <span className={s.secNum}>{num} /</span> {label}
      </span>
      {right}
    </div>
  );
}

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
      <SecBar
        num="01"
        label="select your fighter"
        right={
          <span className={s.timer} aria-hidden="true">
            T-{String(timer).padStart(2, '0')}
          </span>
        }
      />
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
  ['shell', 'React'],
  ['netcode', 'Colyseus'],
  ['language', 'TypeScript'],
] as const;

export default function Everclash() {
  return (
    <div className={s.root}>
      <header className={s.head}>
        <ChamberTitle kicker="EVERCLASH — 2D PVP FIGHTER">
          Ten fighters. Eight players. One browser.
        </ChamberTitle>
        <div className={s.lobby}>
          <p className={s.lobbyLive}>
            <span className={s.tick} aria-hidden="true" />
            8-player free-for-all · real-time netcode
          </p>
          <p className={s.lobbyMeta}>no install · no launcher · runs in the tab</p>
        </div>
      </header>

      <Roster />

      <div className={s.heroBand}>
        <div className={s.heroRail}>
          <span className={s.secMark}>
            <span className={s.secNum}>02 /</span> impact
          </span>
          <Marginalia className={s.heroCap}>fig. 01 — two forms, mid-collision</Marginalia>
        </div>
        <HeroArt id="everclash" alt="Two energy forms mid-collision" />
      </div>

      <section aria-label="Stack and write-up">
        <SecBar num="03" label="how it runs" />
        <div className={s.secBody}>
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
                Everclash is a 2D PvP fighter that lives in a browser tab. No install, no
                launcher — open the URL, pick a fighter, and trade hits with up to seven other
                people in real time. Phaser 3 runs the fight, Colyseus carries the netcode,
                React wraps the shell. TypeScript end to end.
              </p>
              <p>
                Ten fighters means ten sets of art. The roster comes out of a custom
                AI-assisted pipeline I built — one system in place of an art team.
              </p>
            </div>
            <div className={s.stats}>
              <Stat value="10" label="fighters on the roster" />
              <Stat value="8" label="players, one free-for-all" />
              <Stat value="0" label="installs — browser only" />
              <Stat value="100%" label="TypeScript" />
            </div>
          </div>
        </div>
      </section>

      <Gallery
        id="everclash"
        captions={[
          'character select — full roster',
          'mid-round — 8-player free-for-all',
          'victory pose — animation suite',
        ]}
      />

      <section aria-label="Currently in the lab">
        <SecBar num="04" label="meanwhile" />
        <div className="prose">
          <p className={s.labLine}>
            Currently in the lab — <span className={s.labName}>AGARVOICE</span>, an Agar.io
            rebuild with proximity voice chat and 22 tiered skins.
          </p>
        </div>
      </section>
    </div>
  );
}
