import { useEffect, useRef } from 'react';
import { NODES } from '../content/nodes';
import { useStore } from '../state/store';
import { chamberControl } from '../chambers/control';

/* The orchestrator at small scale — a live 2D-canvas mini-widget pinned bottom-left
   while a chamber covers the WebGL canvas (which pauses, per the §8 perf budget).
   Pulses keep firing here, so the system never reads as frozen. */
const SIZE = 148;

export default function MiniOrchestrator({ active }: { active: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = SIZE * dpr;
    cv.height = SIZE * dpr;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const reduced = useStore.getState().reducedMotion;
    const C = SIZE / 2;
    const pulses: { node: number; dir: number; start: number; dur: number }[] = [];
    let nextFire = 0;
    let raf = 0;
    let last = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 33) return; /* ~30fps is plenty at this scale */
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, SIZE, SIZE);

      /* rings */
      ctx.strokeStyle = 'rgba(232,162,61,0.14)';
      ctx.lineWidth = 1;
      for (const r of [26, 50]) {
        ctx.beginPath();
        ctx.ellipse(C, C, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* nodes + threads */
      const pos: [number, number][] = [];
      NODES.forEach((n, i) => {
        const theta = n.phase + (reduced ? 0 : t * n.speed * 2.2);
        const r = n.ring === 'inner' ? 26 : 50;
        const x = C + Math.cos(theta) * r;
        const y = C + Math.sin(theta) * r * 0.62;
        pos.push([x, y]);
        ctx.strokeStyle = n.id === active ? 'rgba(232,162,61,0.65)' : 'rgba(232,162,61,0.18)';
        ctx.beginPath();
        ctx.moveTo(C, C);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = n.id === active ? '#E8A23D' : 'rgba(232,162,61,0.55)';
        ctx.beginPath();
        ctx.arc(x, y, n.id === active ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
        void i;
      });

      /* core with heartbeat */
      const hb = reduced ? 0 : Math.exp(-((t * 0.9) % 1) * 5);
      ctx.fillStyle = '#E8A23D';
      ctx.beginPath();
      ctx.arc(C, C, 6 + hb * 0.9, 0, Math.PI * 2);
      ctx.fill();

      /* pulse traffic */
      if (!reduced) {
        if (t > nextFire) {
          pulses.push({ node: Math.floor(Math.random() * NODES.length), dir: Math.random() < 0.55 ? 1 : -1, start: t, dur: 0.5 + Math.random() * 0.4 });
          nextFire = t + 0.5 + Math.random() * 1.6;
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          let prog = (t - p.start) / p.dur;
          if (prog >= 1) {
            pulses.splice(i, 1);
            continue;
          }
          if (p.dir === -1) prog = 1 - prog;
          const [nx, ny] = pos[p.node];
          ctx.fillStyle = p.dir === 1 ? 'rgba(232,162,61,0.95)' : 'rgba(56,217,169,0.95)';
          ctx.beginPath();
          ctx.arc(C + (nx - C) * prog, C + (ny - C) * prog, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <button
      type="button"
      className="mini-orch"
      data-cursor="back"
      aria-label="Return to hub — live orchestrator map"
      onClick={() => chamberControl.close?.()}
    >
      <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} aria-hidden="true" />
      <span className="mini-orch-label">HUB</span>
    </button>
  );
}
