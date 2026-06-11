import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4173/?j2#/hub/jarvis');
await page.waitForTimeout(5000);
const title = await page.evaluate(() => {
  const t = document.querySelector('.ch-title');
  return t ? { text: t.textContent, vis: getComputedStyle(t).visibility, op: getComputedStyle(t).opacity, fvs: getComputedStyle(t).fontVariationSettings } : null;
});
console.log(JSON.stringify(title));
await page.screenshot({ path: 'verification/shots/ch-jarvis-2.png' });
await browser.close();
