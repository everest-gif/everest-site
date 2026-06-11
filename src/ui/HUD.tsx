import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { NODE_MAP } from '../content/nodes';
import SeasonControl from './SeasonControl';

/* M8.8 — live footer readouts: scene · bodies · real fps (tiny mono) */
function Readouts() {
  const act = useStore((s) => s.act);
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = (t: number) => {
      frames += 1;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span aria-hidden="true">
      scene:{act} · bodies:08 · {String(fps).padStart(3, '0')}fps
    </span>
  );
}

function BoulderClock() {
  const [now, setNow] = useState('');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <time aria-label={`Local Boulder time ${now}`}>BOULDER {now}</time>;
}

export default function HUD() {
  const act = useStore((s) => s.act);
  const chamber = useStore((s) => s.chamber);
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = useStore((s) => s.toggleSound);
  const skipToHub = useStore((s) => s.skipToHub);
  const beginReverseBreach = useStore((s) => s.beginReverseBreach);
  const closeChamber = useStore((s) => s.closeChamber);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const intro = act === 'boot' || act === 'threshold' || act === 'breach';
  const onHud = act === 'hub' || act === 'chamber' || act === 'reverse-breach';

  return (
    <div className="hud" aria-label="Heads-up display">
      <div className={`hud-tl${onHud ? ' is-on' : ''}`}>everest.os v1.0</div>

      <div className={`hud-tr${onHud ? ' is-on' : ''}`}>
        {(act === 'hub' || act === 'chamber') && (
          <button
            type="button"
            onClick={() => useStore.getState().setIndexOpen(true)}
            aria-haspopup="dialog"
            aria-label="Open the index — every destination in the system"
          >
            [ index ]
          </button>
        )}
        {onHud && <BoulderClock />}
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
          tabIndex={onHud ? 0 : -1}
        >
          [ sound: {soundOn ? 'on' : 'off'} ]
        </button>
      </div>

      <nav className={`hud-bl${onHud ? ' is-on' : ''}`} aria-label="Breadcrumb">
        {act === 'chamber' && chamber ? (
          <span>
            HUB / <span className="crumb-live">{NODE_MAP[chamber].label}</span>
          </span>
        ) : (
          <span className="crumb-live">HUB</span>
        )}
      </nav>

      <div className={`hud-bc${onHud ? ' is-on' : ''}`}>{onHud && <Readouts />}</div>

      {/* M3 — seasons own bottom-left; skip-intro moved opposite (bottom-right) */}
      <SeasonControl />
      <div className={`hud-skip${intro ? ' is-on' : ''}`}>
        {intro && (
          <button type="button" onClick={skipToHub} aria-label="Skip the intro and go to the hub">
            [ skip intro ]
          </button>
        )}
      </div>

      <div className={`hud-br${onHud ? ' is-on' : ''}`}>
        {act === 'hub' && (
          <button
            type="button"
            data-cursor="back"
            onClick={() => (reducedMotion ? useStore.getState().gotoThreshold() : beginReverseBreach())}
            aria-label="Return to the mountains"
          >
            [ return to mountains ]
          </button>
        )}
        {act === 'chamber' && (
          <button type="button" data-cursor="back" onClick={closeChamber} aria-label="Return to hub">
            [ ← return to hub ]
          </button>
        )}
      </div>
    </div>
  );
}
