/* OG card (1200×630) — the real threshold scene, captured live. */
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('http://localhost:4173/?og');
await page.waitForTimeout(5200); /* boot + full lockup reveal */
/* hide HUD chrome for a clean card */
await page.addStyleTag({ content: '.hud{display:none!important}.cursor-dot,.cursor-ring{display:none!important}' });
await page.waitForTimeout(300);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('og.png written');
