/* M1 smoke — threshold headline scale, chamber type system, font payload, console gate. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
mkdirSync('verification/gorgeous/m1', { recursive: true });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleMsgs = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(`[${m.type()}] ${m.text()}`);
});
const fonts = new Map();
page.on('response', async (r) => {
  if (r.url().endsWith('.woff2')) {
    const b = await r.body().catch(() => null);
    if (b) fonts.set(r.url().split('/').pop(), b.length);
  }
});

/* threshold */
await page.goto(`${BASE}/#/`);
await page.waitForTimeout(4200);
await page.screenshot({ path: 'verification/gorgeous/m1/threshold.png' });

/* jarvis chamber — headline + ghost numeral, then scroll to the pull-stat mid-count */
await page.goto(`${BASE}/#/hub/jarvis`);
await page.waitForTimeout(3500);
await page.screenshot({ path: 'verification/gorgeous/m1/jarvis-top.png' });
await page.mouse.move(900, 450);
await page.mouse.wheel(0, 420);
await page.waitForTimeout(500);
await page.screenshot({ path: 'verification/gorgeous/m1/jarvis-pull-mid.png' });
await page.waitForTimeout(900);
await page.screenshot({ path: 'verification/gorgeous/m1/jarvis-pull-done.png' });

/* luven — $994 pull-stat + prose measure */
await page.goto(`${BASE}/#/hub/luven`);
await page.waitForTimeout(3500);
await page.screenshot({ path: 'verification/gorgeous/m1/luven-top.png' });
await page.mouse.wheel(0, 700);
await page.waitForTimeout(1300);
await page.screenshot({ path: 'verification/gorgeous/m1/luven-scrolled.png' });

/* measurements */
const metrics = await page.evaluate(() => {
  const cs = (sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el) : null;
  };
  const prose = cs('.prose p');
  const title = document.querySelector('.ch-title');
  const scroll = document.querySelector('.chamber-scroll');
  return {
    proseFont: prose ? `${prose.fontFamily.split(',')[0]} ${prose.fontSize}/${prose.lineHeight}` : null,
    proseWidth: document.querySelector('.prose')?.getBoundingClientRect().width ?? null,
    titleWidth: title?.getBoundingClientRect().width ?? null,
    titleLeft: title?.getBoundingClientRect().left ?? null,
    columnLeft: scroll?.getBoundingClientRect().left ?? null,
    columnWidth: scroll?.getBoundingClientRect().width ?? null,
    ghost: !!document.querySelector('.ch-ghost'),
  };
});

let total = 0;
for (const [name, size] of fonts) {
  console.log(`font ${name}: ${(size / 1024).toFixed(1)}KB`);
  total += size;
}
console.log(`FONT PAYLOAD TOTAL: ${(total / 1024).toFixed(1)}KB (budget 280KB)`);
console.log('metrics:', JSON.stringify(metrics, null, 1));
console.log(consoleMsgs.length ? `CONSOLE ISSUES:\n${consoleMsgs.join('\n')}` : 'console clean');
await browser.close();
