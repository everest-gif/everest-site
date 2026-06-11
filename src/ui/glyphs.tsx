import type { NodeId } from '../state/store';

/* M6 — drawn identity glyphs, 16×16, stroke-only, currentColor.
   One per planet identity + THE MOUNTAINS + HUB. No emoji, ever. */

export type GlyphId = NodeId | 'mountains' | 'hub';

export function NodeGlyph({ id, size = 16 }: { id: GlyphId; size?: number }) {
  const common = {
    viewBox: '0 0 16 16',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.1,
    'aria-hidden': true,
  } as const;
  switch (id) {
    case 'jarvis': /* glyph rings — orchestrator core */
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.2" />
          <circle cx="8" cy="8" r="5.8" strokeDasharray="2.4 2.1" />
        </svg>
      );
    case 'luven': /* radar sweep */
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 8L8 2.2A5.8 5.8 0 0 1 12.6 4.6Z" fill="currentColor" stroke="none" opacity="0.55" />
          <circle cx="10.6" cy="9.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'emerge': /* raking grid */
      return (
        <svg {...common}>
          <path d="M2.2 4.5h11.6M2.2 8h11.6M2.2 11.5h11.6M5.5 2.2v11.6M10.5 2.2v11.6" opacity="0.85" />
        </svg>
      );
    case 'dolomite': /* faceted body */
      return (
        <svg {...common}>
          <path d="M8 1.8L13.8 6.2 11.6 13.4H4.4L2.2 6.2Z" />
          <path d="M8 1.8L8 13.4M2.2 6.2L13.8 6.2" opacity="0.5" />
        </svg>
      );
    case 'everclash': /* split hemispheres, energy in the gap */
      return (
        <svg {...common}>
          <path d="M6.8 2.3A6 6 0 0 0 6.8 13.7M9.2 2.3A6 6 0 0 1 9.2 13.7" />
          <path d="M8 5v6" strokeDasharray="1.4 1.3" />
        </svg>
      );
    case 'voxhalla': /* voxel cluster */
      return (
        <svg {...common}>
          <rect x="5.4" y="2.6" width="5.2" height="5.2" />
          <rect x="2.6" y="7.8" width="5.2" height="5.2" />
          <rect x="8.2" y="7.8" width="5.2" height="5.2" />
        </svg>
      );
    case 'bigback': /* meridian arc */
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 2a8.6 8.6 0 0 1 0 12" opacity="0.9" />
        </svg>
      );
    case 'beyond': /* route polyline */
      return (
        <svg {...common}>
          <path d="M2 11.5L5.4 7.4 8.6 9.6 13.8 3.8" />
          <circle cx="13.8" cy="3.8" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="2" cy="11.5" r="0.9" />
        </svg>
      );
    case 'mountains': /* the threshold ridgeline */
      return (
        <svg {...common}>
          <path d="M1.8 12.5L6 5l2.6 4.2L10.4 6l3.8 6.5" strokeLinejoin="round" />
        </svg>
      );
    case 'hub': /* the system overview */
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
          <ellipse cx="8" cy="8" rx="6" ry="3.4" />
        </svg>
      );
  }
}
