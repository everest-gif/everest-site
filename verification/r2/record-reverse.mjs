/* R1 — record the reverse breach (hub → threshold) and extract frames. */
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = process.argv[2] ?? 'verification/r2/after';
const BASE = process.argv[3] ?? 'http://localhost:4173';
mkdirSync(`${OUT}/reverse-frames`, { recursive: true });

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
await page.goto(BASE + '/#/hub');
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(2200);
await page.mouse.move(4, 4);
await page.keyboard.press('Escape');
await page.waitForTimeout(3000);
const video = page.video();
await ctx.close();
await browser.close();
const path = await video.path();
renameSync(path, `${OUT}/reverse.webm`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/reverse.webm`, '-vf', 'fps=8', `${OUT}/reverse-frames/f_%03d.png`]);
console.log('reverse recorded; console errors:', errors.length, errors.slice(0, 3));
