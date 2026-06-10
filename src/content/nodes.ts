import type { NodeId } from '../state/store';

export interface NodeDef {
  id: NodeId;
  label: string;
  ring: 'inner' | 'outer';
  chip: string;
  role: string;
  /* orbit parameters — unique per node so the system never looks static or symmetric */
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
    radius: 2.3,
    speed: 0.072,
    phase: 0.4,
    incline: 0.10,
  },
  {
    id: 'luven',
    label: 'LUVEN AI',
    ring: 'inner',
    chip: 'FIRST SALE $994 · 770+ WORKFLOW NODES',
    role: 'Founder — AI voice receptionist for the trades',
    radius: 2.55,
    speed: -0.058,
    phase: 1.9,
    incline: -0.14,
  },
  {
    id: 'emerge',
    label: 'EMERGE AI',
    ring: 'inner',
    chip: '4 PRODUCTION AGENTS · AI DIVISION LEAD',
    role: 'Operator — APM & Solutions Engineer',
    radius: 2.42,
    speed: 0.064,
    phase: 3.5,
    incline: 0.07,
  },
  {
    id: 'dolomite',
    label: 'DOLOMITE',
    ring: 'inner',
    chip: 'ALL PROJECTS · ONE COMMAND PLANE',
    role: 'Mission Control',
    radius: 2.68,
    speed: -0.080,
    phase: 5.1,
    incline: -0.09,
  },
  {
    id: 'everclash',
    label: 'EVERCLASH',
    ring: 'outer',
    chip: '10 FIGHTERS · 8-PLAYER FFA · IN BROWSER',
    role: '2D PvP Fighter',
    radius: 4.05,
    speed: 0.042,
    phase: 0.9,
    incline: 0.16,
  },
  {
    id: 'voxhalla',
    label: 'VOXHALLA',
    ring: 'outer',
    chip: '6V6 · 10 CHAMPIONS · NO ENGINE',
    role: 'Voxel Hero Shooter',
    radius: 4.35,
    speed: -0.035,
    phase: 2.4,
    incline: -0.12,
  },
  {
    id: 'bigback',
    label: 'BIGBACK',
    ring: 'outer',
    chip: 'CHAT-FIRST · TRADEMARK FILED · bigback.fit',
    role: 'AI Fitness',
    radius: 3.85,
    speed: 0.050,
    phase: 4.0,
    incline: 0.08,
  },
  {
    id: 'beyond',
    label: 'BEYOND',
    ring: 'outer',
    chip: '70.3 IRONMAN · SEMESTER AT SEA · 1 BETTA FISH',
    role: 'The Person',
    radius: 4.2,
    speed: -0.046,
    phase: 5.6,
    incline: -0.06,
  },
];

export const NODE_MAP: Record<NodeId, NodeDef> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
) as Record<NodeId, NodeDef>;

export const SECTORS = { inner: 'SYSTEMS / VENTURES', outer: 'GAMES / LIFE' } as const;

/* §7 — content placeholders. Values still REPLACE_ME render dimmed with `· pending`. */
export const CONTACT = {
  name: 'Everest Egenhofer',
  email: 'REPLACE_ME@example.com',
  github: 'https://github.com/REPLACE_ME',
  linkedin: 'https://linkedin.com/in/REPLACE_ME',
  x: 'https://x.com/REPLACE_ME',
} as const;

export const isPending = (v: string) => v.includes('REPLACE_ME');
