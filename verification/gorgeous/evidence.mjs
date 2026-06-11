/* M10.1 — motion evidence: record the five required animations as video.
   Frames are extracted afterwards with ffmpeg (6 evenly spaced per clip). */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4173';
const DIR = 'verification/gorgeous/motion';
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ headless: false });

async function record(name, run) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: DIR, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  const issues = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') issues.push(m.text());
  });
  await run(page);
  const video = page.video();
  await ctx.close();
  await video.saveAs(`${DIR}/${name}.webm`);
  console.log(`recorded ${name}${issues.length ? ` — CONSOLE: ${issues[0]}` : ''}`);
}

/* 1 — season weather front (night → winter) */
await record('season-front', async (page) => {
  await page.goto(`${BASE}/?ev1`);
  await page.waitForSelector('.enter-ring', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.click('[data-season="winter"]');
  await page.waitForTimeout(2100);
});

/* 2 — retimed breach (≤2.2s) */
await record('breach', async (page) => {
  await page.goto(`${BASE}/?ev2`);
  await page.waitForSelector('.enter-ring', { timeout: 15000 });
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3100);
});

/* 3 — one pulse, followable */
await record('pulse-follow', async (page) => {
  await page.goto(`${BASE}/?ev3#/hub`);
  await page.waitForFunction(() => document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 });
  await page.waitForTimeout(6500);
});

/* 4 — INDEX open / close */
await record('index', async (page) => {
  await page.goto(`${BASE}/?ev4#/hub`);
  await page.waitForFunction(() => document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 });
  await page.waitForTimeout(1200);
  await page.click('text=[ index ]');
  await page.waitForTimeout(1600);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
});

/* 5 — chamber flight (hub → planet) + a hop */
await record('flight', async (page) => {
  await page.goto(`${BASE}/?ev5#/hub`);
  await page.waitForFunction(() => document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 });
  await page.waitForTimeout(1400);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.hub-node-btn')].find((x) => x.closest('[data-node]').dataset.node === 'dolomite');
    b.click();
  });
  await page.waitForTimeout(2600);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2400);
});

await browser.close();
console.log('all clips recorded');
