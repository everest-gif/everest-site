/* R2 §R0.2/§R7.2 — BEFORE evidence: current breach video, hub overview, node close-ups, chambers. */
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = 'verification/r2/before';
mkdirSync(OUT, { recursive: true });
mkdirSync(`${OUT}/breach-frames`, { recursive: true });

const browser = await chromium.launch({ headless: false });

/* ---- 1. breach video ---- */
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(BASE + '/');
  await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(1500);
  const tClick = (Date.now() - t0) / 1000;
  console.log('click at ~', tClick.toFixed(2), 's into video');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5200);
  const video = page.video();
  await ctx.close();
  const path = await video.path();
  renameSync(path, `${OUT}/breach.webm`);
  /* extract 6fps frames across the whole video — pick the breach window by eye */
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/breach.webm`, '-vf', 'fps=6', `${OUT}/breach-frames/f_%03d.png`]);
  console.log('breach video + frames saved');
}

/* ---- 2. hub overview + node close-ups ---- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/#/hub');
  await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/hub-overview.png` });
  const ids = ['jarvis', 'luven', 'emerge', 'dolomite', 'everclash', 'voxhalla', 'bigback', 'beyond'];
  for (const id of ids) {
    /* nodes orbit continuously — track the element with the raw mouse instead of hover() */
    const loc = page.locator(`[data-node="${id}"] .hub-node-btn`);
    for (let k = 0; k < 7; k++) {
      const b = await loc.boundingBox();
      if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(130);
    }
    await page.screenshot({ path: `${OUT}/node-${id}.png` });
  }
  await page.close();
  console.log('hub + nodes saved');
}

/* ---- 3. two chambers ---- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const id of ['jarvis', 'everclash']) {
    await page.goto(`${BASE}/?shot=${id}#/hub/${id}`);
    await page.waitForTimeout(4500);
    await page.screenshot({ path: `${OUT}/chamber-${id}.png` });
  }
  await page.close();
  console.log('chambers saved');
}

await browser.close();
console.log('BEFORE capture complete');
