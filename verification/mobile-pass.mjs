/* P5 mobile pass — 390×844: legibility, tap targets, overflow, chamber scroll. */
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const issues = [];
page.on('console', (m) => {
  if (m.type() === 'error') issues.push(`[console:error] ${m.text()}`);
});

const overflow = async (label) => {
  const o = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    bodySw: document.body.scrollWidth,
  }));
  if (o.sw > o.iw || o.bodySw > o.iw) issues.push(`${label}: horizontal overflow ${JSON.stringify(o)}`);
};

/* threshold */
await page.goto('http://localhost:4173/?m1');
await page.waitForTimeout(4500);
await page.screenshot({ path: 'verification/shots/m-threshold.png' });
await overflow('threshold');
const enter = await page.evaluate(() => {
  const b = document.querySelector('.enter-ring');
  const r = b.getBoundingClientRect();
  return { w: r.width, h: r.height };
});
if (enter.w < 44 || enter.h < 44) issues.push(`ENTER target ${enter.w}×${enter.h} < 44px`);

/* hub */
await page.goto('http://localhost:4173/?m2#/hub');
await page.waitForTimeout(4000);
await page.screenshot({ path: 'verification/shots/m-hub.png' });
await overflow('hub');
const nodes = await page.evaluate(() => {
  return [...document.querySelectorAll('.hub-node-btn')].map((b) => {
    const r = b.getBoundingClientRect();
    return { label: b.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
  });
});
for (const n of nodes) {
  if (n.w < 44 || n.h < 44) issues.push(`node target too small: ${JSON.stringify(n)}`);
  if (n.x < -10 || n.x + n.w > 400) issues.push(`node offscreen: ${JSON.stringify(n)}`);
}

/* chambers */
for (const id of ['jarvis', 'beyond', 'everclash']) {
  await page.goto(`http://localhost:4173/?m3${id}#/hub/${id}`);
  await page.waitForTimeout(4200);
  await overflow(`chamber:${id}`);
  const innerOverflow = await page.evaluate(() => {
    const sc = document.querySelector('.chamber-scroll');
    return sc ? sc.scrollWidth - sc.clientWidth : 0;
  });
  if (innerOverflow > 1) issues.push(`chamber:${id} inner horizontal overflow ${innerOverflow}px`);
  /* scroll the chamber */
  await page.evaluate(() => {
    const sc = document.querySelector('.chamber-scroll');
    if (sc) sc.scrollTop = 600;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `verification/shots/m-${id}.png` });
}

console.log(issues.length ? `ISSUES:\n${issues.join('\n')}` : 'MOBILE PASS CLEAN');
await browser.close();
