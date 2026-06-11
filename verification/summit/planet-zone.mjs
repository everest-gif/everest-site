/* S5 — planet zone probe: for each chamber at 1440, assert the planet's visual body
   (center + apparent radius) stays inside the left 38vw, and report the gutter. */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const IDS = ['jarvis', 'luven', 'emerge', 'dolomite', 'everclash', 'voxhalla', 'bigback', 'beyond'];

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/?scrub=1#/hub/jarvis`);
await page.waitForSelector('.chamber-content', { timeout: 20000 });
await page.waitForTimeout(1800);

let fails = 0;
for (const id of IDS) {
  await page.evaluate((t) => {
    location.hash = `#/hub/${t}`;
  }, id);
  await page.waitForTimeout(2400);
  const r = await page.evaluate((t) => {
    const cam = window.__handles.camera;
    const w = window.__nodeWorld[t];
    const rad = window.__nodeRadius[t];
    /* project center */
    const v = { x: w.x - cam.position.x, y: w.y - cam.position.y, z: w.z - cam.position.z };
    const dist = Math.hypot(v.x, v.y, v.z);
    const ndc = new DOMPoint();
    /* use the camera matrices via three objects already on the camera */
    const p = w.clone().project(cam);
    const cx = ((p.x + 1) / 2) * innerWidth;
    const tanV = Math.tan((cam.fov * Math.PI) / 360);
    const tanH = tanV * cam.aspect;
    const rpx = ((rad / dist) / tanH) * (innerWidth / 2);
    return { cx: +cx.toFixed(0), rpx: +rpx.toFixed(0), limbVw: +(((cx + rpx) / innerWidth) * 100).toFixed(1) };
  }, id);
  const ok = r.limbVw <= 38.5;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: center ${r.cx}px r ${r.rpx}px → limb ${r.limbVw}vw (zone ≤38, column 42)`);
}
await browser.close();
process.exit(fails ? 1 : 0);
