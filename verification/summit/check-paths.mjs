/* S1 — resilience: reduced-motion veil crossfade, mid-ascent abort via skip intro,
   re-entry (threshold → hub → threshold → hub). Console must stay silent. */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
let pass = 0;
let fail = 0;
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  ok ? pass++ : fail++;
};

/* 1 — reduced motion: Enter crossfades through the ink veil to the hub, ~250ms */
await page.goto(BASE + '/?rm=1&scrub=1');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(800);
const t0 = Date.now();
await page.keyboard.press('Enter');
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 5000 });
const swapMs = Date.now() - t0;
check(`reduced-motion swap lands on hub (${swapMs}ms)`, swapMs < 1500);
await page.waitForTimeout(500);
const veil = await page.evaluate(() => window.__handles.veil.value);
check(`veil fully cleared after rm swap (${veil})`, veil < 0.01);
/* rm Esc → back to threshold */
await page.keyboard.press('Escape');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 5000 });
check('reduced-motion Esc returns to threshold', true);

/* 2 — abort mid-ascent via skip intro */
await page.goto(BASE + '/?scrub=1');
await page.reload();
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
await page.waitForTimeout(900); /* mid-rise */
await page.click('.hud-skip');
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 5000 });
await page.waitForTimeout(700);
const h = await page.evaluate(() => {
  const hh = window.__handles;
  return { seam: hh.seam.value, ascent: hh.ascent.value, tFade: hh.thresholdFade.value, cam: hh.camera.position.y };
});
check(`abort mid-ascent → hub, no transit residue (seam=${h.seam} ascent=${h.ascent})`, h.seam === 0 && h.ascent === 0);
check(`abort camera settles to hub altitude (y=${h.cam.toFixed(1)})`, Math.abs(h.cam - 64.6) < 4);

/* 3 — re-entry: Esc → threshold → Enter again → hub */
await page.keyboard.press('Escape');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 6000 });
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 6000 });
const cam2 = await page.evaluate(() => window.__handles.camera.position.y);
check(`second ascent docks (camY=${cam2.toFixed(1)})`, Math.abs(cam2 - 64.6) < 4);

check(`console silent (${errors.length})`, errors.length === 0);
if (errors.length) console.log(errors.slice(0, 6));
await browser.close();
console.log(`${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
