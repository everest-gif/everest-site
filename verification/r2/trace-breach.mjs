/* Find the long main-thread task during the breach via Chrome tracing. */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(BASE + '/');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(1500);
await browser.startTracing(page, {
  path: 'verification/r2/trace.json',
  categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing'],
});
await page.keyboard.press('Enter');
await page.waitForTimeout(5200);
await browser.stopTracing();
await browser.close();

const trace = JSON.parse(readFileSync('verification/r2/trace.json', 'utf8'));
const events = trace.traceEvents.filter((e) => e.dur && e.dur > 30000);
events.sort((a, b) => b.dur - a.dur);
const t0 = Math.min(...trace.traceEvents.filter((e) => e.ts).map((e) => e.ts));
for (const e of events.slice(0, 15)) {
  const args = e.args?.data ? JSON.stringify(e.args.data).slice(0, 140) : '';
  console.log(`${(e.dur / 1000).toFixed(1)}ms  +${((e.ts - t0) / 1e6).toFixed(2)}s  ${e.name}  ${args}`);
}
