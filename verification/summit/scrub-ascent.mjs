/* S8 — ascent scrub set: pause the timeline at fixed stops, every still must pass
   the poster test. ?scrub=1 exposes __ascentTl; pause + seek happen inside single
   evaluates on fixed waits (waitForFunction proved flaky against this page). */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = 'verification/summit/scrub';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/?scrub=1');
  await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(1200);
  console.log('threshold ready');
  await page.mouse.move(4, 4);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const paused = await page.evaluate(() => {
    const tl = window.__ascentTl;
    if (!tl) return false;
    tl.pause();
    return true;
  });
  console.log('paused:', paused);
  if (!paused) throw new Error('__ascentTl missing after Enter');

  for (const pct of [0, 20, 40, 60, 80, 100]) {
    await page.evaluate((p) => {
      const tl = window.__ascentTl;
      tl.time(Math.min(tl.duration() * (p / 100), tl.duration() - 0.016), false);
    }, pct);
    await page.waitForTimeout(260);
    await page.screenshot({ path: `${OUT}/ascent-${String(pct).padStart(3, '0')}.png` });
    console.log(`scrub ${pct}%`);
  }
} finally {
  await browser.close();
}
console.log('scrub set complete');
