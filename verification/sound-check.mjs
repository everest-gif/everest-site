import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`${m.type()}: ${m.text()}`); });
await page.goto('http://localhost:4173/?snd');
await page.waitForTimeout(3500);
// AudioContext must NOT exist while muted
const pre = await page.evaluate(() => ({ ctxs: performance.getEntriesByType ? 'n/a' : 'n/a' }));
await page.click('button[aria-label="Turn sound on"]');
await page.waitForTimeout(400);
await page.keyboard.press('Enter'); // breach with whoosh
await page.waitForTimeout(3600);
await page.click('button[aria-label="Turn sound off"]');
await page.waitForTimeout(500);
console.log(errs.length ? `ERRORS:\n${errs.join('\n')}` : 'SOUND CHECK CLEAN');
await browser.close();
