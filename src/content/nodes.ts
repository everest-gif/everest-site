import type { NodeId } from '../state/store';

export interface NodeDef {
  id: NodeId;
  label: string;
  ring: 'inner' | 'outer';
  chip: string;
  role: string;
  /* orbit parameters — unique per node so the system never looks static or symmetric.
     M5: all prograde (co-rotating) with annular ring separation — counter-rotating
     bodies on nested ellipses MUST eventually co-locate, which no soft repulsion can
     prevent (see DECISIONS). Speeds vary so the system still drifts organically. */
  radius: number;
  speed: number;
  phase: number;
  incline: number;
}

export const NODES: NodeDef[] = [
  {
    id: 'jarvis',
    label: 'JARVIS',
    ring: 'inner',
    chip: '4 AGENTS · 220 TESTS GREEN · RUNS NIGHTLY',
    role: 'Personal AI Orchestrator',
    radius: 2.2,
    speed: 0.072,
    phase: 0.4,
    incline: 0.05,
  },
  {
    id: 'luven',
    label: 'LUVEN AI',
    ring: 'inner',
    chip: 'FIRST SALE $994 · 770+ WORKFLOW NODES',
    role: 'Founder — AI voice receptionist for the trades',
    radius: 2.4,
    speed: 0.058,
    phase: 1.9,
    incline: -0.04,
  },
  {
    id: 'emerge',
    label: 'EMERGE AI',
    ring: 'inner',
    chip: '4 PRODUCTION AGENTS · A SEMINAR FOR 15 CEOS',
    role: 'APM & Solutions Engineer',
    radius: 2.62,
    speed: 0.064,
    phase: 3.5,
    incline: 0.04,
  },
  {
    id: 'dolomite',
    label: 'DOLOMITE',
    ring: 'inner',
    chip: 'ALL PROJECTS · ONE COMMAND PLANE',
    role: 'Mission Control',
    radius: 2.85,
    speed: 0.08,
    phase: 5.1,
    incline: -0.04,
  },
  {
    id: 'everclash',
    label: 'EVERCLASH',
    ring: 'outer',
    chip: '10 FIGHTERS · 8-PLAYER FFA · IN BROWSER',
    role: '2D PvP Fighter',
    radius: 4.1,
    speed: 0.042,
    phase: 0.9,
    incline: 0.07,
  },
  {
    id: 'voxhalla',
    label: 'VOXHALLA',
    ring: 'outer',
    chip: '6V6 · 10 CHAMPIONS · NO ENGINE',
    role: 'Voxel Hero Shooter',
    radius: 4.42,
    speed: 0.035,
    phase: 2.4,
    incline: -0.06,
  },
  {
    id: 'bigback',
    label: 'BIGBACK',
    ring: 'outer',
    chip: 'CHAT-FIRST · TRADEMARK FILED · bigback.fit',
    role: 'AI Fitness',
    radius: 4.14,
    speed: 0.05,
    phase: 4.0,
    incline: 0.05,
  },
  {
    id: 'beyond',
    label: 'BEYOND',
    ring: 'outer',
    chip: 'SPRINT TRI DONE · 70.3 IN TRAINING · 1 BETTA FISH',
    role: 'The Person',
    radius: 4.28,
    speed: 0.046,
    phase: 5.6,
    incline: -0.045,
  },
];

export const NODE_MAP: Record<NodeId, NodeDef> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
) as Record<NodeId, NodeDef>;

export const SECTORS = { inner: 'SYSTEMS / VENTURES', outer: 'GAMES / LIFE' } as const;

/* §7 — content placeholders. Values still REPLACE_ME render dimmed with `· pending`. */
export const CONTACT = {
  name: 'Everest Egenhofer',
  email: 'everest@luven.ai',
  github: 'https://github.com/everest-gif',
  linkedin: 'https://www.linkedin.com/in/everest-egenhofer-53a02a234/',
} as const;

export const isPending = (v: string) => v.includes('REPLACE_ME');
