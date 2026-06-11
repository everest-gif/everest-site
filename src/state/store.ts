import { create } from 'zustand';
import { loadSeason, persistSeason, type Season } from '../scene/season';

export type NodeId =
  | 'jarvis'
  | 'luven'
  | 'emerge'
  | 'dolomite'
  | 'everclash'
  | 'voxhalla'
  | 'bigback'
  | 'beyond';

export type Act = 'boot' | 'threshold' | 'breach' | 'hub' | 'reverse-breach' | 'chamber';

export const NODE_IDS: NodeId[] = [
  'jarvis',
  'luven',
  'emerge',
  'dolomite',
  'everclash',
  'voxhalla',
  'bigback',
  'beyond',
];

export function isNodeId(s: string): s is NodeId {
  return (NODE_IDS as string[]).includes(s);
}

interface Entry {
  target: 'threshold' | 'hub';
  chamber: NodeId | null;
}

interface AppState {
  act: Act;
  chamber: NodeId | null;
  hovered: NodeId | null;
  /* M3 — threshold season; persists for the session */
  season: Season;
  /* M6 — the INDEX overlay (ship's manifest) */
  indexOpen: boolean;
  soundOn: boolean;
  reducedMotion: boolean;
  contextLost: boolean;
  /* true once a chamber fully covers the canvas — the RAF loop pauses (§8 perf budget) */
  canvasCovered: boolean;
  entry: Entry;
  bootFonts: number;
  bootShaders: number;
  bootProgress: number;
  bootDone: boolean;

  setEntry: (e: Entry) => void;
  setBootFonts: (n: number) => void;
  setBootShaders: (n: number) => void;
  completeBoot: () => void;
  beginBreach: () => void;
  arriveHub: () => void;
  beginReverseBreach: () => void;
  arriveThreshold: () => void;
  openChamber: (id: NodeId) => void;
  hopChamber: (id: NodeId) => void;
  closeChamber: () => void;
  skipToHub: () => void;
  gotoThreshold: () => void;
  setHovered: (id: NodeId | null) => void;
  setSeason: (s: Season) => void;
  setIndexOpen: (v: boolean) => void;
  toggleSound: () => void;
  setReducedMotion: (v: boolean) => void;
  setContextLost: (v: boolean) => void;
  setCanvasCovered: (v: boolean) => void;
}

function combineBoot(fonts: number, shaders: number, prev: number): number {
  const p = fonts * 0.6 + shaders * 0.4;
  return Math.max(prev, Math.min(1, p));
}

export const useStore = create<AppState>((set, get) => ({
  act: 'boot',
  chamber: null,
  hovered: null,
  season: loadSeason(),
  indexOpen: false,
  soundOn: false,
  reducedMotion: false,
  contextLost: false,
  canvasCovered: false,
  entry: { target: 'threshold', chamber: null },
  bootFonts: 0,
  bootShaders: 0,
  bootProgress: 0,
  bootDone: false,

  setEntry: (entry) => set({ entry }),
  setBootFonts: (n) =>
    set((s) => ({ bootFonts: n, bootProgress: combineBoot(n, s.bootShaders, s.bootProgress) })),
  setBootShaders: (n) =>
    set((s) => ({ bootShaders: n, bootProgress: combineBoot(s.bootFonts, n, s.bootProgress) })),
  completeBoot: () => {
    const { act, entry } = get();
    if (act !== 'boot') return;
    if (entry.target === 'hub') {
      set({ bootDone: true, act: entry.chamber ? 'chamber' : 'hub', chamber: entry.chamber });
    } else {
      set({ bootDone: true, act: 'threshold' });
    }
  },
  beginBreach: () => {
    if (get().act !== 'threshold') return;
    set({ act: 'breach' });
  },
  arriveHub: () => {
    const a = get().act;
    if (a !== 'breach' && a !== 'reverse-breach') return;
    set({ act: 'hub', chamber: null });
  },
  beginReverseBreach: () => {
    if (get().act !== 'hub') return;
    set({ act: 'reverse-breach' });
  },
  arriveThreshold: () => {
    if (get().act !== 'reverse-breach') return;
    set({ act: 'threshold', chamber: null });
  },
  openChamber: (id) => {
    if (get().act !== 'hub') return;
    set({ act: 'chamber', chamber: id, hovered: null });
  },
  hopChamber: (id) => {
    if (get().act !== 'chamber' || get().chamber === id) return;
    set({ chamber: id, hovered: null });
  },
  closeChamber: () => {
    if (get().act !== 'chamber') return;
    set({ act: 'hub', chamber: null });
  },
  skipToHub: () => {
    const a = get().act;
    if (a === 'hub' || a === 'chamber') return;
    set({ act: 'hub', chamber: null, bootDone: true });
  },
  gotoThreshold: () => {
    const a = get().act;
    if (a === 'threshold' || a === 'boot') return;
    set({ act: 'threshold', chamber: null });
  },
  setHovered: (hovered) => set({ hovered }),
  setSeason: (season) => {
    persistSeason(season);
    set({ season });
  },
  setIndexOpen: (indexOpen) => set({ indexOpen }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setContextLost: (contextLost) => set({ contextLost }),
  setCanvasCovered: (canvasCovered) => set({ canvasCovered }),
}));
