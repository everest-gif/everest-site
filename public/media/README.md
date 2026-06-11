# Media convention (zero code changes)

Each chamber checks `/media/<project-id>/manifest.json` at render time.

To add real screenshots to a chamber:

1. Create the folder: `public/media/<project-id>/` — ids: `jarvis luven emerge dolomite everclash voxhalla bigback beyond`
2. Drop image files in it (any web format).
3. Add `manifest.json` listing them in display order:

```json
{ "images": ["dashboard.png", "voice-session.png", "run-log.png"] }
```

Images map to the chamber's gallery slots in order, lazy-loaded with proper aspect handling.
No manifest (or an empty folder) → the chamber renders its styled procedural placeholder
frames instead. Nothing 404s either way.
