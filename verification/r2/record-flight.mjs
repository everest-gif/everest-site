/* R7.1 — record hub→planet flight + planet→planet hop. */
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = 'verification/r2/after';
mkdirSync(`${OUT}/flight-frames`, { recursive: true });

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.goto('http://localhost:4173/#/hub');
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(2200);

/* click jarvis (track the orbiting button, then click) */
const loc = page.locator('[data-node="jarvis"] .hub-node-btn');
let bx = null;
for (let k = 0; k < 6; k++) {
  bx = await loc.boundingBox();
  if (bx) await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2);
  await page.waitForTimeout(110);
}
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(2300); /* flight + materialize */
await page.screenshot({ path: `${OUT}/chamber-jarvis-r3.png` });

/* hop to the next planet via the rail */
await page.click('.chamber-rail button:last-child', { timeout: 5000 });
await page.waitForTimeout(2600);
await page.screenshot({ path: `${OUT}/chamber-hop-r3.png` });

/* hop back the other way */
await page.click('.chamber-rail button:first-child', { timeout: 5000 });
await page.waitForTimeout(2600);

/* esc → fly back out */
await page.keyboard.press('Escape');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/hub-after-return.png` });

const video = page.video();
await ctx.close();
await browser.close();
const path = await video.path();
renameSync(path, `${OUT}/flight.webm`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/flight.webm`, '-vf', 'fps=4', `${OUT}/flight-frames/f_%03d.png`]);
console.log('flight recorded; console errors:', errors.length, errors.slice(0, 4));
