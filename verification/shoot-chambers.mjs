/* P4 visual review — screenshot every chamber via deep link. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const ids = ['jarvis', 'luven', 'emerge', 'dolomite', 'everclash', 'voxhalla', 'bigback', 'beyond'];
mkdirSync('verification/shots', { recursive: true });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log(`[console:${m.type()}]`, m.text());
});

for (const id of ids) {
  await page.goto(`http://localhost:4173/?shot=${id}#/hub/${id}`);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `verification/shots/ch-${id}.png` });
  console.log('shot', id);
}
await browser.close();
