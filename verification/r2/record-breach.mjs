/* R1.4/R7.1 — record the breach, extract frames, sample rAF gaps. Usage: node record-breach.mjs <outdir> */
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = process.argv[2] ?? 'verification/r2/after';
const BASE = process.argv[3] ?? 'http://localhost:4173';
mkdirSync(`${OUT}/breach-frames`, { recursive: true });

const NOVIDEO = process.env.NOVIDEO === '1';
const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  ...(NOVIDEO ? {} : { recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } }),
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const t0 = Date.now();
await page.goto(BASE + '/');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(1500);
/* rAF gap sampler — first-play frame-gap budget ≤8ms…ish (display-dependent) */
await page.evaluate(() => {
  window.__gaps = [];
  window.__gapT0 = performance.now();
  let last = performance.now();
  const loop = (t) => {
    window.__gaps.push([t - window.__gapT0, t - last]);
    last = t;
    if (window.__gaps.length < 700) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
await page.mouse.move(4, 4); /* park the cursor ring out of frame */
const tClick = (Date.now() - t0) / 1000;
await page.keyboard.press('Enter');
await page.waitForTimeout(5600);
const gaps = await page.evaluate(() => window.__gaps.slice(5));
const video = NOVIDEO ? null : page.video();
await ctx.close();
await browser.close();
if (video) {
  const path = await video.path();
  renameSync(path, `${OUT}/breach.webm`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/breach.webm`, '-vf', 'fps=6', `${OUT}/breach-frames/f_%03d.png`]);
}

const vals = gaps.map((g) => g[1]);
const worst = Math.max(...vals);
const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
const over = gaps.filter((g) => g[1] > 1000 / 60 + 8);
console.log(`enter at ~${tClick.toFixed(2)}s into video`);
console.log(`rAF gaps: avg ${avg.toFixed(1)}ms worst ${worst.toFixed(1)}ms; >frame+8ms: ${over.length}`);
for (const [t, g] of over.slice(0, 8)) console.log(`  hitch ${g.toFixed(1)}ms at +${(t / 1000).toFixed(2)}s after sampler start`);
console.log(`console errors: ${errors.length}`, errors.slice(0, 5));
