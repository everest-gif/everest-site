import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await page.goto('http://localhost:4173/?po#/hub/jarvis');
await page.waitForTimeout(4200);
const wide = await page.evaluate(() => {
  const sc = document.querySelector('.chamber-scroll');
  const out = [];
  sc.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > 391 && r.width > 30) out.push({ cls: String(el.className).slice(0, 60), right: Math.round(r.right), w: Math.round(r.width), tag: el.tagName });
  });
  return out.slice(0, 12);
});
console.log(JSON.stringify(wide, null, 1));
await browser.close();
