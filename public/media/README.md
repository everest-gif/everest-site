# Media convention (zero code changes)

Each chamber checks `/media/<project-id>/manifest.json` at render time.

To add real screenshots to a chamber:

1. Folders already exist for all ids: `jarvis luven emerge dolomite everclash voxhalla bigback beyond`,
   each shipping an empty `manifest.json` (`{ "images": [] }`).
2. Drop image files into `public/media/<project-id>/` (any web format).
3. List them in that folder's `manifest.json` in display order:

```json
{ "images": ["dashboard.png", "voice-session.png", "run-log.png"] }
```

Images map to the chamber's gallery slots in order, lazy-loaded with proper aspect handling.
An empty `images` list → the chamber renders its styled procedural placeholder frames instead.
Keep the manifests in place even when empty: they make the probe return 200 on static hosts,
where a real 404 would log a console error (vite preview masks missing files with its SPA
fallback; Vercel doesn't). See DECISIONS.md #27.
