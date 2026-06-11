/* M10.3 — type audit: one 1440w capture per chamber proving scale courage.
   Asserts: headline ≥60% of its column, ghost numeral present, pull-stat present. */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
mkdirSync('verification/gorgeous/type-audit', { recursive: true });
const ids = ['jarvis', 'luven', 'emerge', 'dolomite', 'everclash', 'voxhalla', 'bigback', 'beyond'];

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const issues = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') issues.push(m.text());
});

const rows = [];
for (const id of ids) {
  await page.goto(`${BASE}/?ta-${id}#/hub/${id}`);
  await page.waitForFunction(() => !!document.querySelector('.ch-title'), null, { timeout: 12000 });
  await page.waitForTimeout(2600);
  const m = await page.evaluate(() => {
    const title = document.querySelector('.ch-title');
    const tw = title?.getBoundingClientRect().width ?? 0;
    /* the column = the title's nearest sized ancestor below chamber-content */
    let col = title?.parentElement;
    while (col && col.getBoundingClientRect().width < 200) col = col.parentElement;
    const cw = col?.getBoundingClientRect().width ?? 1;
    return {
      titlePct: +((tw / cw) * 100).toFixed(1),
      fontPx: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
      ghost: !!document.querySelector('.ch-ghost'),
      ghostText: document.querySelector('.ch-ghost')?.textContent ?? '',
      pull: !!document.querySelector('.ch-pull'),
    };
  });
  const pass = m.titlePct >= 60 && m.ghost && m.pull;
  rows.push({ id, ...m, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id} — headline ${m.titlePct}% of column @${m.fontPx}px · ghost ${m.ghostText} · pull-stat ${m.pull}`);
  await page.screenshot({ path: `verification/gorgeous/type-audit/${id}.png` });
}
writeFileSync('verification/gorgeous/type-audit/RESULTS.json', JSON.stringify(rows, null, 2));
console.log(issues.length ? 'CONSOLE:\n' + [...new Set(issues)].join('\n') : 'console clean');
await browser.close();
if (rows.some((r) => !r.pass)) process.exit(1);
