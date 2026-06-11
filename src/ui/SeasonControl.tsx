import { useState } from 'react';
import { useStore } from '../state/store';
import { SEASONS, type Season } from '../scene/season';

/* M3 — season control: four drawn glyph-dots, bottom-left of the threshold.
   Active glyph is ringed amber, breathing at 54bpm; hover names the season in
   mono; full radio-group keyboard semantics; choice persists for the session. */

function Glyph({ s }: { s: Season }) {
  switch (s) {
    case 'night':
      return (
        <svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true">
          <path
            d="M9.6 2.3A4.75 4.75 0 1 0 10 8.9 5.4 5.4 0 0 1 9.6 2.3z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case 'winter':
      return (
        <svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          <path d="M6 1.2v9.6M1.8 3.6l8.4 4.8M10.2 3.6L1.8 8.4" />
        </svg>
      );
    case 'spring':
      return (
        <svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 11V5.8M6 5.8c0-2.3 1.7-3.7 4.2-3.7 0 2.5-1.7 3.7-4.2 3.7zM6 7.6c0-1.9-1.4-3-3.6-3 0 2.1 1.4 3 3.6 3z" />
        </svg>
      );
    case 'autumn':
      return (
        <svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.4 1.6C5.4 2 2.2 4.8 1.6 10.4 6.6 10 9.8 7.2 10.4 1.6zM3.4 8.6l5.2-5.2" />
        </svg>
      );
  }
}

export default function SeasonControl() {
  const act = useStore((s) => s.act);
  const season = useStore((s) => s.season);
  const setSeason = useStore((s) => s.setSeason);
  const [named, setNamed] = useState<Season | null>(null);
  const on = act === 'threshold';

  const onKeyDown = (e: React.KeyboardEvent) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = SEASONS[(SEASONS.indexOf(season) + dir + SEASONS.length) % SEASONS.length];
    setSeason(next);
    const btn = (e.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(`[data-season="${next}"]`);
    btn?.focus();
  };

  return (
    <div
      className={`hud-seasons${on ? ' is-on' : ''}`}
      role="radiogroup"
      aria-label="Threshold season"
      onKeyDown={onKeyDown}
    >
      {SEASONS.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={season === s}
          aria-label={`Season: ${s}`}
          data-season={s}
          tabIndex={!on ? -1 : season === s ? 0 : -1}
          className={`season-dot${season === s ? ' is-active' : ''}`}
          onClick={() => setSeason(s)}
          onMouseEnter={() => setNamed(s)}
          onMouseLeave={() => setNamed(null)}
          onFocus={() => setNamed(s)}
          onBlur={() => setNamed(null)}
        >
          <Glyph s={s} />
        </button>
      ))}
      <span className="season-name" aria-hidden="true">
        {named ?? ''}
      </span>
    </div>
  );
}
