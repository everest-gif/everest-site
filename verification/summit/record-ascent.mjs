/* S1/S8 — record the ascent (or descent), extract 12fps no-cut frames + 6 poster frames,
   sample rAF gaps. Usage: node record-ascent.mjs <fwd|rev> [outdir] [base] */
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const MODE = process.argv[2] ?? 'fwd';
const OUT = process.argv[3] ?? 'verification/summit/motion';
const BASE = process.argv[4] ?? 'http://localhost:4173';
const name = MODE === 'fwd' ? 'ascent' : 'descent';
mkdirSync(`${OUT}/${name}-frames`, { recursive: true });

const browser = await chromium.launch({ headless: false });
/* deviceScaleFactor pinned to 1: a PerformanceMonitor dpr step mid-flight resizes the
   canvas and stalls Chromium's screencast — the page stays healthy but the video
   freezes. Perf numbers come from the rAF sampler, not the video. */
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
});
const t0 = Date.now();
if (MODE === 'fwd') {
  await page.goto(BASE + '/');
  await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
} else {
  await page.goto(BASE + '/#/hub');
  await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 20000 });
}
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.__gaps = [];
  window.__gapT0 = performance.now();
  let last = performance.now();
  const loop = (t) => {
    window.__gaps.push([t - window.__gapT0, t - last]);
    last = t;
    if (window.__gaps.length < 600) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
await page.mouse.move(4, 4);
const tKey = (Date.now() - t0) / 1000;
if (MODE === 'fwd') await page.keyboard.press('Enter');
else await page.keyboard.press('Escape');
await page.waitForTimeout(MODE === 'fwd' ? 3400 : 2800);
const gaps = await page.evaluate(() => window.__gaps.slice(5));
const video = page.video();
await ctx.close();
await browser.close();
const path = await video.path();
renameSync(path, `${OUT}/${name}.webm`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/${name}.webm`, '-vf', 'fps=12', `${OUT}/${name}-frames/f_%03d.png`]);

const vals = gaps.map((g) => g[1]);
const worst = Math.max(...vals);
const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
const over = gaps.filter((g) => g[1] > 1000 / 60 + 8);
console.log(`${name}: key at ~${tKey.toFixed(2)}s into video`);
console.log(`rAF gaps: avg ${avg.toFixed(1)}ms worst ${worst.toFixed(1)}ms; >frame+8ms: ${over.length}`);
for (const [t, g] of over.slice(0, 8)) console.log(`  hitch ${g.toFixed(1)}ms at +${(t / 1000).toFixed(2)}s`);
console.log(`console errors/warnings: ${errors.length}`, errors.slice(0, 5));
