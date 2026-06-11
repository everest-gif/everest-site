/* S1 debug — fly the ascent, then dump live state + screenshot. */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(BASE + '/?scrub=1');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(1200);
await page.keyboard.press('Enter');

for (const wait of [1000, 1200, 800, 1000]) {
  await page.waitForTimeout(wait);
  const state = await page.evaluate(() => {
    const h = window.__handles;
    const cam = h?.camera;
    return {
      t: performance.now().toFixed(0),
      act: window.__zstate ?? document.querySelector('.hud-readouts span')?.textContent,
      cam: cam ? { x: +cam.position.x.toFixed(2), y: +cam.position.y.toFixed(2), z: +cam.position.z.toFixed(2), fov: +cam.fov.toFixed(1) } : null,
      handles: h
        ? {
            seam: +h.seam.value.toFixed(2),
            ascent: +h.ascent.value.toFixed(2),
            tFade: +h.thresholdFade.value.toFixed(2),
            sFade: +h.starFade.value.toFixed(2),
            veil: +h.veil.value.toFixed(2),
            bloom: +h.bloomIntensity.value.toFixed(2),
          }
        : null,
    };
  });
  console.log(JSON.stringify(state));
}
await page.screenshot({ path: 'verification/summit/probe-arrival.png' });
console.log('logs:', logs.slice(0, 10));
await browser.close();
