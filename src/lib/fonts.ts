import { useStore } from '../state/store';

/* Real font-load progress for the boot meter — tied to FontFaceSet, never a timer. */
export function trackFontLoading(): void {
  const specs = [
    'italic 300 1rem "Fraunces Variable"',
    '400 1rem "JetBrains Mono Variable"',
    '400 1rem "Geist Variable"',
  ];
  let done = 0;
  const report = () => useStore.getState().setBootFonts(done / specs.length);
  for (const spec of specs) {
    document.fonts
      .load(spec)
      .catch(() => undefined)
      .then(() => {
        done += 1;
        report();
      });
  }
  /* FontFaceSet.ready settles after the loads above — guarantees the meter completes. */
  document.fonts.ready.then(() => useStore.getState().setBootFonts(1));
}
