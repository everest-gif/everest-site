/* M3 smoke — four seasons, weather-front sweep frames, full-bleed, dome hidden. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
mkdirSync('verification/gorgeous/m3', { recursive: true });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleMsgs = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(`[${m.type()}] ${m.text()}`);
});

await page.goto(`${BASE}/#/`);
await page.waitForTimeout(4500);
await page.screenshot({ path: 'verification/gorgeous/m3/night.png' });

/* winter — capture the front mid-sweep at ~0.35s/0.8s, then settled */
await page.click('[data-season="winter"]');
await page.waitForTimeout(350);
await page.screenshot({ path: 'verification/gorgeous/m3/front-a.png' });
await page.waitForTimeout(450);
await page.screenshot({ path: 'verification/gorgeous/m3/front-b.png' });
await page.waitForTimeout(2200);
await page.screenshot({ path: 'verification/gorgeous/m3/winter.png' });

await page.click('[data-season="spring"]');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'verification/gorgeous/m3/spring.png' });

await page.click('[data-season="autumn"]');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'verification/gorgeous/m3/autumn.png' });

/* hover names the season */
await page.hover('[data-season="night"]');
await page.waitForTimeout(300);
await page.screenshot({ path: 'verification/gorgeous/m3/hover-name.png', clip: { x: 0, y: 760, width: 540, height: 140 } });

/* keyboard + persistence + scroll lock */
const checks = await page.evaluate(() => ({
  stored: sessionStorage.getItem('everest-season'),
  scrollable: document.documentElement.scrollHeight > window.innerHeight || document.body.scrollHeight > window.innerHeight,
}));
console.log('checks:', JSON.stringify(checks));
console.log(consoleMsgs.length ? `CONSOLE ISSUES:\n${consoleMsgs.join('\n')}` : 'console clean');
await browser.close();
