/* R1 resilience — abort mid-breach, reverse, re-entry, reduced-motion. Console must stay clean. */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const fail = (msg) => {
  console.log('FAIL:', msg);
  process.exitCode = 1;
};

/* 1 — skip intro mid-breach lands on hub with no residue */
await page.goto(BASE + '/');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000); /* mid-split */
const skip = page.locator('text=skip intro');
if (await skip.count()) await skip.click({ timeout: 3000 }).catch(() => fail('skip click'));
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 6000 }).catch(() => fail('abort→hub'));
console.log('1. abort mid-breach → hub ok');

/* 2 — Esc from hub = reverse breach back to threshold */
await page.waitForTimeout(1200);
await page.keyboard.press('Escape');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 8000 }).catch(() => fail('reverse→threshold'));
console.log('2. reverse breach → threshold ok');

/* 3 — re-entry: second full breach still works */
await page.waitForTimeout(900);
await page.keyboard.press('Enter');
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 10000 }).catch(() => fail('re-entry'));
console.log('3. second breach → hub ok');

/* 4 — reduced motion: instant transitions */
await page.goto(BASE + '/?rm=1');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 20000 });
await page.keyboard.press('Enter');
await page.waitForSelector('.hub-node-btn', { state: 'visible', timeout: 3000 }).catch(() => fail('rm breach'));
await page.keyboard.press('Escape');
await page.waitForSelector('.enter-ring', { state: 'visible', timeout: 3000 }).catch(() => fail('rm reverse'));
console.log('4. reduced motion ok');

console.log('console errors:', errors.length, errors.slice(0, 5));
if (errors.length) process.exitCode = 1;
await browser.close();
console.log(process.exitCode ? 'CHECKS FAILED' : 'ALL PATH CHECKS PASS');
