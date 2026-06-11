/* R1.4 scrub test — stills at 0/20/40/60/80/100% of the breach timeline.
   The page itself pauses and steps the timeline on a fixed schedule (armed BEFORE Enter);
   the node side only takes screenshots on the same clock. No post-Enter evaluates —
   those proved flaky against the running breach. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
mkdirSync('verification/r2/scrub', { recursive: true });
const STOPS = [0.01, 0.79, 1.58, 2.36, 3.15, 3.8];
const STEP_MS = 1700;

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(BASE + '/?scrub=1');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(1500);
await page.mouse.move(4, 4);
/* arm the in-page stepper before the breach exists */
await page.evaluate(
  ({ stops, stepMs }) => {
    const arm = () => {
      const tl = window.__breachTl;
      if (!tl) {
        setTimeout(arm, 16);
        return;
      }
      tl.pause();
      let i = 0;
      tl.time(stops[0]);
      const iv = setInterval(() => {
        i += 1;
        if (i >= stops.length) {
          clearInterval(iv);
          return;
        }
        tl.time(stops[i]);
      }, stepMs);
    };
    arm();
  },
  { stops: STOPS, stepMs: STEP_MS },
);
const t0 = Date.now();
await page.keyboard.press('Enter');
/* screenshot mid-window of each step — ABSOLUTE deadlines (screenshot latency drifted
   a relative schedule into the wrong steps) */
for (let i = 0; i < STOPS.length; i++) {
  const target = t0 + STEP_MS * i + STEP_MS * 0.62;
  const wait = target - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `verification/r2/scrub/scrub-${i * 20}.png`, timeout: 15000 });
  console.log(`scrub ${i * 20}% (t=${STOPS[i]}) captured`);
}
console.log('scrub complete');
await browser.close();
