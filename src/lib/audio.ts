import { useStore } from '../state/store';

/* §6 — synthesized sound layer. Everything generated in code, no audio files.
   AudioContext is lazy-created on first enable: zero console warnings while muted.
   Master gain ≈ −19dB, instantly killable. */

const MASTER = 0.11;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private humNodes: { gain: GainNode; stops: (() => void)[] } | null = null;
  private noiseBuf: AudioBuffer | null = null;

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private noise(): AudioBuffer {
    const ctx = this.ensure();
    if (!this.noiseBuf) {
      const len = ctx.sampleRate * 2;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuf;
  }

  setEnabled(on: boolean): void {
    if (!on) {
      /* instant kill */
      if (this.master && this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      }
      this.stopHum();
      return;
    }
    const ctx = this.ensure();
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(MASTER, ctx.currentTime, 0.05);
    const act = useStore.getState().act;
    if (act === 'hub' || act === 'chamber') this.startHum();
  }

  /* low ambient hum on the hub — detuned oscillator pair + filtered noise bed */
  startHum(): void {
    if (!useStore.getState().soundOn || this.humNodes) return;
    const ctx = this.ensure();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.5, ctx.currentTime, 1.2);
    gain.connect(this.master!);

    const stops: (() => void)[] = [];
    for (const [freq, type, g] of [
      [54, 'sine', 0.5],
      [54.6, 'sine', 0.35],
      [108.2, 'triangle', 0.08],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const og = ctx.createGain();
      og.gain.value = g;
      osc.connect(og).connect(gain);
      osc.start();
      stops.push(() => osc.stop());
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 160;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    src.connect(lp).connect(ng).connect(gain);
    src.start();
    stops.push(() => src.stop());

    this.humNodes = { gain, stops };
  }

  stopHum(): void {
    if (!this.humNodes || !this.ctx) return;
    const { gain, stops } = this.humNodes;
    this.humNodes = null;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    window.setTimeout(() => {
      stops.forEach((s) => s());
      gain.disconnect();
    }, 900);
  }

  /* rising whoosh synthesized for the breach */
  whoosh(duration: number, reverse = false): void {
    if (!useStore.getState().soundOn) return;
    const ctx = this.ensure();
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.1;
    const t0 = ctx.currentTime;
    const f0 = reverse ? 1800 : 160;
    const f1 = reverse ? 160 : 2200;
    bp.frequency.setValueAtTime(f0, t0);
    bp.frequency.exponentialRampToValueAtTime(f1, t0 + duration * 0.82);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.55, t0 + duration * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t0);
    src.stop(t0 + duration + 0.1);
  }

  /* sub-audible tick on node hover */
  tick(): void {
    if (!useStore.getState().soundOn) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 660;
    const g = ctx.createGain();
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
    osc.connect(g).connect(this.master!);
    osc.start(t0);
    osc.stop(t0 + 0.06);
  }
}

export const audio = new AudioEngine();

/* store-driven wiring — module-level, called once from main.tsx */
export function initAudio(): void {
  useStore.subscribe((s, prev) => {
    if (s.soundOn !== prev.soundOn) audio.setEnabled(s.soundOn);
    if (!s.soundOn) return;
    if (s.act !== prev.act) {
      if (s.act === 'breach') audio.whoosh(2.2);
      if (s.act === 'reverse-breach') audio.whoosh(1.4, true);
      if (s.act === 'hub' || s.act === 'chamber') audio.startHum();
      else audio.stopHum();
    }
    if (s.hovered && s.hovered !== prev.hovered && (s.act === 'hub' || s.act === 'chamber')) {
      audio.tick();
    }
  });
}
