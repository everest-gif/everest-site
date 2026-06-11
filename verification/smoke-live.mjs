/* LIVE production smoke — boot → breach → hub → two chambers → console gate.
   Usage: node verification/smoke-live.mjs https://everest-site-azure.vercel.app */
import { chromium } from '@playwright/test';

const BASE = process.argv[2]?.replace(/\/$/, '');
if (!BASE) {
  console.error('usage: node verification/smoke-live.mjs <production-url>');
  process.exit(2);
}

const results = [];
const check = (id, pass, detail = '') => {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleLog = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') consoleLog.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => consoleLog.push(`[pageerror] ${e.message}`));

const fpsProbe = (frames) =>
  page.evaluate(
    (n) =>
      new Promise((res) => {
        const gaps = [];
        let last = performance.now();
        let i = 0;
        const tick = () => {
          const now = performance.now();
          gaps.push(now - last);
          last = now;
          if (++i < n) requestAnimationFrame(tick);
          else {
            const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
            res({ avgFps: Math.round(1000 / avg), worstGapMs: Math.round(Math.max(...gaps)) });
          }
        };
        requestAnimationFrame(tick);
      }),
    frames,
  );

/* boot + threshold */
await page.goto(`${BASE}/?live1`);
await page.waitForSelector('.lockup-h1', { state: 'visible', timeout: 20000 });
const bootGone = await page
  .waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 10000 })
  .then(() => true)
  .catch(() => false);
check('boot completes, threshold renders', bootGone);

/* ENTER → breach → hub */
await page.waitForTimeout(1200);
await page.evaluate(() => document.querySelector('.enter-ring').click());
const breachPerf = await fpsProbe(150);
await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 8000 });
check('ENTER → breach → hub arrival', true, JSON.stringify(breachPerf));
check('breach no frame-long stalls', breachPerf.worstGapMs < 200, `worst gap ${breachPerf.worstGapMs}ms`);

await page.waitForTimeout(1200);
const hubPerf = await fpsProbe(90);
check('hub renders, ≥50fps', hubPerf.avgFps >= 50, JSON.stringify(hubPerf));

/* chamber helper */
const openChamber = async (id) => {
  await page.evaluate((nid) => {
    const b = [...document.querySelectorAll('.hub-node-btn')].find(
      (x) => x.closest('[data-node]').dataset.node === nid,
    );
    b.click();
  }, id);
  await page.waitForFunction((nid) => location.hash === `#/hub/${nid}`, id, { timeout: 5000 });
  const open = await page
    .waitForFunction(
      () => {
        const p = document.querySelector('.chamber-panel');
        return p && getComputedStyle(p).visibility === 'visible' && p.style.clipPath.includes('0%');
      },
      null,
      { timeout: 5000 },
    )
    .then(() => true)
    .catch(() => false);
  const title = await page.evaluate(() => document.querySelector('.ch-title')?.textContent ?? '');
  return { open, title };
};

/* chamber 1: jarvis */
const j = await openChamber('jarvis');
check('chamber jarvis opens via scan-line', j.open, j.title.slice(0, 40));
await page.keyboard.press('Escape');
await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 5000 });
check('Esc closes jarvis → hub', true);

/* chamber 2: beyond — also proves the new §7 contact values live */
await page.waitForTimeout(600);
const b = await openChamber('beyond');
check('chamber beyond opens via scan-line', b.open, b.title.slice(0, 40));
const contact = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.chamber-panel a')].map((a) => a.href);
  return {
    email: links.some((h) => h === 'mailto:everest@luven.ai'),
    github: links.some((h) => h.includes('github.com/everest-gif')),
    linkedin: links.some((h) => h.includes('linkedin.com/in/everest-egenhofer')),
    noX: !links.some((h) => h.includes('x.com')),
    noPending: !document.querySelector('.chamber-panel').textContent.includes('pending'),
  };
});
check('beyond contact: email live', contact.email);
check('beyond contact: github live', contact.github);
check('beyond contact: linkedin live', contact.linkedin);
check('beyond contact: X dropped, nothing pending', contact.noX && contact.noPending);

/* ============ GORGEOUS PASS interactions (M10.7) ============ */

/* INDEX: open → arrow → Enter travels → Esc closes */
await page.keyboard.press('Escape');
await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 5000 });
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.includes('index'))?.click());
const idxOpen = await page.waitForSelector('.index-panel', { timeout: 5000 }).then(() => true).catch(() => false);
check('INDEX opens from HUD', idxOpen);
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
const idxTravel = await page
  .waitForFunction(() => location.hash.startsWith('#/hub/') && !document.querySelector('.index-overlay'), null, { timeout: 6000 })
  .then(() => true)
  .catch(() => false);
check('INDEX row travels (flight)', idxTravel, await page.evaluate(() => location.hash));
await page.waitForTimeout(1500);

/* EXPLORE chips + arrow-key hop */
const chips = await page.evaluate(() => document.querySelectorAll('.explore-chip').length);
check('EXPLORE chips present in chamber', chips === 2);
const hashBefore = await page.evaluate(() => location.hash);
await page.keyboard.press('ArrowRight');
const hopped = await page
  .waitForFunction((h) => location.hash !== h && location.hash.startsWith('#/hub/'), hashBefore, { timeout: 6000 })
  .then(() => true)
  .catch(() => false);
check('arrow-key hop works', hopped, await page.evaluate(() => location.hash));

/* ============ SUMMIT PASS — orbital rail + direct rail hop ============ */
await page.waitForTimeout(1400);
const rail = await page.evaluate(() => {
  const stops = [...document.querySelectorAll('.rail-stop')];
  return {
    n: stops.length,
    current: document.querySelectorAll('.rail-stop[aria-current="true"]').length,
    pos: document.querySelector('.rail-pos')?.textContent ?? '',
  };
});
check('orbital rail: 8 stops, one current, position label', rail.n === 8 && rail.current === 1 && /\d{2}/.test(rail.pos), JSON.stringify(rail));
await page.evaluate(() => [...document.querySelectorAll('.rail-stop')][7].click());
const railHop = await page
  .waitForFunction(() => location.hash === '#/hub/beyond' && !!document.querySelector('.chamber-panel'), null, { timeout: 6000 })
  .then(() => true)
  .catch(() => false);
check('rail click → direct flight to beyond', railHop);
await page.keyboard.press('Escape');
await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 5000 });

/* seasons: switch persists; terrain seasonalizes */
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.includes('return to mountains'))?.click());
await page.waitForSelector('.hud-seasons', { timeout: 8000 });
await page.waitForTimeout(2200);
await page.click('[data-season="winter"]');
await page.waitForTimeout(1800);
const season = await page.evaluate(() => sessionStorage.getItem('everest-season'));
check('season switch + persist (winter)', season === 'winter', String(season));

/* in-world 404 */
await page.goto(`${BASE}/?live404#/no/such`);
const lost = await page.waitForSelector('.lost-overlay', { timeout: 8000 }).then(() => true).catch(() => false);
check('unknown route → in-world 404', lost);

/* font payload ≤280KB (M1) */
const fontBytes = await page.evaluate(() =>
  performance
    .getEntriesByType('resource')
    .filter((r) => r.name.endsWith('.woff2'))
    .reduce((s, r) => s + (r.encodedBodySize || r.transferSize || 0), 0),
);
check('font payload ≤280KB', fontBytes > 0 && fontBytes <= 280 * 1024, `${(fontBytes / 1024).toFixed(1)}KB`);

/* og tags on the served document */
const og = await page.evaluate(() => ({
  url: document.querySelector('meta[property="og:url"]')?.content ?? '',
  image: document.querySelector('meta[property="og:image"]')?.content ?? '',
}));
check('og:url absolute', og.url.startsWith('https://'), og.url);
check('og:image absolute', og.image.startsWith('https://'), og.image);

/* console gate */
check('console gate: zero errors/warnings', consoleLog.length === 0, consoleLog.join(' | ').slice(0, 200));

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
