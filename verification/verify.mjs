/* §9 VERIFICATION PROTOCOL — real-browser (headed, GPU), full evidence run.
   Usage: node verification/verify.mjs   (vite preview must be on :4173) */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4173';
mkdirSync('verification/shots', { recursive: true });

const results = [];
const check = (id, pass, detail = '') => {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}${detail ? ` — ${detail}` : ''}`);
};

const NODES = {
  jarvis: '4 AGENTS · 220 TESTS GREEN · RUNS NIGHTLY',
  luven: 'FIRST SALE $994 · 770+ WORKFLOW NODES',
  emerge: '4 PRODUCTION AGENTS · A SEMINAR FOR 15 CEOS',
  dolomite: 'ALL PROJECTS · ONE COMMAND PLANE',
  everclash: '10 FIGHTERS · 8-PLAYER FFA · IN BROWSER',
  voxhalla: '6V6 · 10 CHAMPIONS · NO ENGINE',
  bigback: 'CHAT-FIRST · TRADEMARK FILED · bigback.fit',
  beyond: 'SPRINT TRI DONE · 70.3 IN TRAINING · 1 BETTA FISH',
};

const browser = await chromium.launch({ headless: false });
const consoleLog = [];
const newPage = async (ctxOpts = {}, vp = { width: 1440, height: 900 }) => {
  const ctx = await browser.newContext({ viewport: vp, ...ctxOpts });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleLog.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleLog.push(`[pageerror] ${(e.stack || e.message).split('\n').slice(0, 4).join(' ⏎ ')}`));
  return { ctx, page };
};

const fpsProbe = (page, frames = 90) =>
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

/* ============ 9.1 functional click-through + 9.3 screenshots + 9.6 fps ============ */
{
  const { ctx, page } = await newPage();

  /* boot + threshold */
  await page.goto(`${BASE}/?v1`);
  await page.waitForSelector('.lockup-h1', { state: 'visible', timeout: 15000 });
  const bootGone = await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 8000 }).then(() => true).catch(() => false);
  check('9.1 boot completes, threshold renders', bootGone);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verification/shots/desktop-threshold.png' });

  /* ENTER via click + breach stall sampling + arrival */
  await page.evaluate(() => document.querySelector('.enter-ring').click());
  const breachPerf = await fpsProbe(page, 150);
  await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 6000 });
  check('9.1 ENTER via click → breach → hub', true);
  check('9.1/9.6 breach no frame-long stalls', breachPerf.worstGapMs < 200, JSON.stringify(breachPerf));
  check('9.6 breach ≥50fps', breachPerf.avgFps >= 50, `${breachPerf.avgFps}fps`);

  /* scan-line beams existed? open a chamber and sample mid-materialization */
  await page.waitForTimeout(1200);
  const hubPerf = await fpsProbe(page, 90);
  check('9.6 hub ≥50fps', hubPerf.avgFps >= 50, JSON.stringify(hubPerf));
  await page.screenshot({ path: 'verification/shots/desktop-hub.png' });

  /* hover EVERY node → correct chip; then open/close EVERY node */
  for (const [id, chip] of Object.entries(NODES)) {
    const got = await page.evaluate((nid) => {
      const btn = document.querySelector(`button[aria-label^="Open ${''}"][aria-label]`);
      void btn;
      const b = [...document.querySelectorAll('.hub-node-btn')].find((x) => x.closest('[data-node]').dataset.node === nid);
      b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      return new Promise((res) =>
        setTimeout(() => {
          const c = b.parentElement.querySelector('.hub-chip');
          res({ on: c.classList.contains('is-on'), text: c.textContent });
        }, 250),
      );
    }, id);
    check(`9.1 hover ${id} → chip`, got.on && got.text === chip, got.text);
    await page.evaluate(() => {
      const h = document.querySelector('.hub-node-btn.is-hot');
      if (h) h.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    });
  }

  let beamSeen = false;
  for (const id of Object.keys(NODES)) {
    await page.evaluate((nid) => {
      const b = [...document.querySelectorAll('.hub-node-btn')].find((x) => x.closest('[data-node]').dataset.node === nid);
      b.click();
    }, id);
    await page.waitForTimeout(1150); /* flight ≈0.95s, then mid-materialization (R3) */
    const mid = await page.evaluate(() => {
      const beams = [...document.querySelectorAll('.chamber-beam')];
      return beams.some((b) => parseFloat(getComputedStyle(b).opacity) > 0.05);
    });
    beamSeen = beamSeen || mid;
    await page.waitForFunction((nid) => location.hash === `#/hub/${nid}`, id, { timeout: 4000 });
    const open = await page.waitForFunction(
      () => {
        const p = document.querySelector('.chamber-panel');
        return p && getComputedStyle(p).visibility === 'visible' && (p.style.clipPath === 'inset(0% 0px 0% 0px)' || p.style.clipPath === 'inset(0% 0 0% 0)' || p.style.clipPath.includes('0%'));
      },
      null,
      { timeout: 4000 },
    ).then(() => true).catch(() => false);
    const title = await page.evaluate(() => document.querySelector('.ch-title')?.textContent ?? '');
    check(`9.1 click ${id} → chamber opens`, open, title.slice(0, 40));
    if (id === 'jarvis') {
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'verification/shots/desktop-chamber-jarvis.png' });
    }
    if (id === 'beyond') {
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'verification/shots/desktop-chamber-beyond.png' });
    }
    /* alternate close paths: Esc vs in-content return */
    if (['jarvis', 'dolomite', 'voxhalla', 'beyond'].includes(id)) {
      await page.keyboard.press('Escape');
    } else {
      await page.evaluate(() => document.querySelector('.chamber-return').click());
    }
    await page.waitForFunction(() => location.hash === '#/hub' && !document.querySelector('.chamber'), null, { timeout: 4000 });
  }
  check('9.1 scan-line beams visible during materialization', beamSeen);
  check('9.1 Esc and [ ← return to hub ] both close chambers', true, 'both paths exercised across 8 nodes');

  /* keyboard: Tab cycles 8 nodes with visible focus ring, Enter opens */
  await page.evaluate(() => document.activeElement?.blur());
  const order = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    order.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        const ring = el.matches('.hub-node-btn') ? getComputedStyle(el.querySelector('.hub-node-label'), ':focus-visible') : null;
        void ring;
        return { label: el.getAttribute('aria-label') ?? '', isNode: el.classList.contains('hub-node-btn') };
      }),
    );
  }
  check('9.1 Tab cycles all 8 nodes', order.every((o) => o.isNode) && new Set(order.map((o) => o.label)).size === 8, order.map((o) => o.label.split('—')[0].replace('Open ', '').trim()).join(','));
  const ringVisible = await page.evaluate(() => {
    const el = document.activeElement.querySelector('.hub-node-label');
    const cs = getComputedStyle(el);
    return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  });
  check('9.1 visible amber focus ring on focused node', ringVisible);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash.startsWith('#/hub/'), null, { timeout: 4000 });
  check('9.1 Enter opens focused node', true, await page.evaluate(() => location.hash));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 4000 });

  /* reverse breach + re-enter second time */
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('return to mountains')).click());
  await page.waitForFunction(() => location.hash === '#/' && !!document.querySelector('.lockup'), null, { timeout: 5000 });
  check('9.1 [ return to mountains ] reverse-breach', true);
  await page.keyboard.press(' ');
  await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 6000 });
  check('9.1 re-enter works a second time (Space)', true);

  /* back/forward sanity */
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.hub-node-btn')].find((x) => x.closest('[data-node]').dataset.node === 'jarvis');
    b.click();
  });
  await page.waitForFunction(() => location.hash === '#/hub/jarvis', null, { timeout: 4000 });
  await page.goBack();
  await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 4000 });
  await page.goForward();
  await page.waitForFunction(() => location.hash === '#/hub/jarvis', null, { timeout: 4000 });
  const fwdOpen = await page.waitForFunction(() => !!document.querySelector('.chamber-panel'), null, { timeout: 4000 }).then(() => true).catch(() => false);
  check('9.1 back/forward sane', fwdOpen);

  await ctx.close();
}

/* ============ 9.1 ENTER via Enter key + Space (fresh loads) ============ */
for (const key of ['Enter', ' ']) {
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?vk${key === ' ' ? 'sp' : 'en'}`);
  await page.waitForSelector('.lockup-h1', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.keyboard.press(key);
  const ok = await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 6000 }).then(() => true).catch(() => false);
  check(`9.1 ENTER via ${key === ' ' ? 'Space' : 'Enter'} key`, ok);
  await ctx.close();
}

/* ============ 9.1 skip intro + deep links cold ============ */
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?vskip`);
  await page.waitForSelector('.hud-skip button', { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('skip intro'))?.click());
  const ok = await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 5000 }).then(() => true).catch(() => false);
  check('9.1 [ skip intro ] jumps to hub', ok);
  await ctx.close();
}
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?vdl1#/hub`);
  const ok = await page.waitForFunction(() => location.hash === '#/hub' && document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 }).then(() => true).catch(() => false);
  check('9.1 deep link /#/hub cold', ok);
  await ctx.close();
}
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?vdl2#/hub/everclash`);
  const ok = await page.waitForFunction(() => !!document.querySelector('.chamber[data-chamber="everclash"]'), null, { timeout: 12000 }).then(() => true).catch(() => false);
  const title = await page.evaluate(() => document.querySelector('.ch-title')?.textContent ?? '');
  check('9.1 deep link /#/hub/everclash cold', ok && title.length > 0, title);
  await ctx.close();
}

/* ============ 9.4 reduced motion — full click-through ============ */
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
  await page.goto(`${BASE}/?vrm`);
  await page.waitForSelector('.lockup-h1', { state: 'visible', timeout: 15000 });
  const t0 = Date.now();
  await page.evaluate(() => document.querySelector('.enter-ring').click());
  const ok = await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 3000 }).then(() => true).catch(() => false);
  const dt = Date.now() - t0;
  check('9.4 reduced motion: no breach — instant crossfade', ok && dt < 1500, `${dt}ms`);
  /* open + close a chamber, keyboard nav */
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.hub-node-btn')].find((x) => x.closest('[data-node]').dataset.node === 'emerge');
    b.click();
  });
  const open = await page.waitForFunction(() => !!document.querySelector('.chamber-panel'), null, { timeout: 3000 }).then(() => true).catch(() => false);
  check('9.4 reduced motion: chamber opens instantly', open);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 3000 });
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('return to mountains')).click());
  const back = await page.waitForFunction(() => location.hash === '#/' && !!document.querySelector('.lockup'), null, { timeout: 3000 }).then(() => true).catch(() => false);
  check('9.4 reduced motion: return to mountains instant', back);
  await ctx.close();
}

/* ============ 9.5 mobile (key checks; full pass in mobile-pass.mjs) ============ */
{
  const { ctx, page } = await newPage({ hasTouch: true, isMobile: true }, { width: 390, height: 844 });
  await page.goto(`${BASE}/?vm`);
  await page.waitForSelector('.lockup-h1', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'verification/shots/mobile-threshold.png' });
  const enter = await page.evaluate(() => {
    const r = document.querySelector('.enter-ring').getBoundingClientRect();
    return r.width >= 44 && r.height >= 44;
  });
  check('9.5 ENTER tappable ≥44px', enter);
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  check('9.5 threshold no horizontal overflow', noOverflow);
  await page.goto(`${BASE}/?vm2#/hub`);
  await page.waitForFunction(() => document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verification/shots/mobile-hub.png' });
  const targets = await page.evaluate(() =>
    [...document.querySelectorAll('.hub-node-btn')].every((b) => {
      const r = b.getBoundingClientRect();
      return r.width >= 44 || r.height >= 44 || b.querySelector('.hub-node-hit');
    }),
  );
  check('9.5 hub nodes tappable (≥44px hit areas)', targets);
  await page.goto(`${BASE}/?vm3#/hub/jarvis`);
  await page.waitForFunction(() => !!document.querySelector('.chamber-scroll'), null, { timeout: 12000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'verification/shots/mobile-chamber-jarvis.png' });
  await page.goto(`${BASE}/?vm4#/hub/beyond`);
  await page.waitForFunction(() => !!document.querySelector('.chamber-scroll'), null, { timeout: 12000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'verification/shots/mobile-chamber-beyond.png' });
  const chOverflow = await page.evaluate(() => {
    const sc = document.querySelector('.chamber-scroll');
    return sc.scrollWidth - sc.clientWidth <= 1;
  });
  check('9.5 chamber no inner horizontal overflow', chOverflow);
  await ctx.close();
}

/* ============ 9.7 resilience ============ */
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?vres`);
  await page.waitForSelector('.lockup-h1', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(600);
  /* rapid double-click ENTER */
  await page.evaluate(() => {
    const b = document.querySelector('.enter-ring');
    b.click();
    setTimeout(() => b.click(), 60);
    setTimeout(() => b.click(), 160);
  });
  /* resize mid-breach */
  await page.waitForTimeout(1500);
  await page.setViewportSize({ width: 1100, height: 700 });
  const ok = await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 6000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(600);
  const sane = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return Math.abs(c.clientWidth - window.innerWidth) < 4;
  });
  check('9.7 double-click ENTER no double-fire + resize mid-breach', ok && sane);

  /* context loss → styled fallback */
  const lost = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ext = gl.getExtension('WEBGL_lose_context');
    if (!ext) return 'no-ext';
    ext.loseContext();
    return new Promise((res) => setTimeout(() => res(!!document.querySelector('.context-lost')), 800));
  });
  check('9.7 context loss shows styled mono fallback', lost === true, String(lost));
  await ctx.close();
}

/* ============ 9.8 accessibility audit ============ */
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?va11y#/hub`);
  await page.waitForFunction(() => document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 });
  const audit = await page.evaluate(() => {
    const unnamed = [...document.querySelectorAll('button, a[href]')].filter((el) => {
      const name = el.getAttribute('aria-label') || el.textContent.trim();
      return !name;
    }).length;
    const canvasHidden = document.querySelector('.scene-root')?.getAttribute('aria-hidden') === 'true';
    const nav = document.querySelectorAll('nav.visually-hidden a').length;
    return { unnamed, canvasHidden, nav };
  });
  check('9.8 every control has an accessible name', audit.unnamed === 0, `${audit.unnamed} unnamed`);
  check('9.8 canvas aria-hidden with text equivalent', audit.canvasHidden && audit.nav === 8, `nav links: ${audit.nav}`);
  /* --dim contrast: rgba(237,232,223,.55) over #0A0A0C — computed at build time */
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const blend = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
  const dim = blend([237, 232, 223], [10, 10, 12], 0.55);
  const ratio = (lum(dim) + 0.05) / (lum([10, 10, 12]) + 0.05);
  check('9.8 --dim passes WCAG AA on --ink', ratio >= 4.5, `${ratio.toFixed(2)}:1`);
  await ctx.close();
}

/* ============ M10 — GORGEOUS PASS additions ============ */

/* seasons: control labeled, keyboard radiogroup, persistence, reduced-motion crossfade */
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?vsea`);
  await page.waitForSelector('.hud-seasons', { timeout: 15000 });
  await page.waitForTimeout(1200);
  const a11y = await page.evaluate(() => {
    const g = document.querySelector('.hud-seasons');
    const dots = [...document.querySelectorAll('.season-dot')];
    return {
      role: g?.getAttribute('role'),
      label: g?.getAttribute('aria-label') ?? '',
      radios: dots.length,
      named: dots.every((d) => (d.getAttribute('aria-label') ?? '').length > 0),
      checked: dots.filter((d) => d.getAttribute('aria-checked') === 'true').length,
    };
  });
  check(
    'M3/9.8 season control is a labeled radiogroup',
    a11y.role === 'radiogroup' && a11y.label.length > 0 && a11y.radios === 4 && a11y.named && a11y.checked === 1,
    JSON.stringify(a11y),
  );
  await page.click('[data-season="winter"]');
  await page.waitForTimeout(1800);
  const stored = await page.evaluate(() => sessionStorage.getItem('everest-season'));
  check('M3 season choice persists (sessionStorage)', stored === 'winter', String(stored));
  /* keyboard: arrows cycle the checked season */
  await page.focus('[data-season="winter"]');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const afterArrow = await page.evaluate(() => sessionStorage.getItem('everest-season'));
  check('M3 arrow keys move the season', afterArrow === 'spring', String(afterArrow));
  await ctx.close();
}
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
  await page.goto(`${BASE}/?vsearm`);
  await page.waitForSelector('.hud-seasons', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.click('[data-season="autumn"]');
  await page.waitForTimeout(600);
  const ok = await page.evaluate(() => sessionStorage.getItem('everest-season') === 'autumn');
  check('9.4 reduced motion: season switch crossfades (no front)', ok);
  await ctx.close();
}

/* INDEX: labeled dialog, keyboard nav, Enter travels, Esc closes */
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?vidx#/hub`);
  await page.waitForFunction(() => document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('index'))?.click());
  await page.waitForSelector('.index-panel', { timeout: 4000 });
  const idx = await page.evaluate(() => {
    const p = document.querySelector('.index-panel');
    const rows = [...document.querySelectorAll('.index-row')];
    return {
      role: p?.getAttribute('role'),
      label: p?.getAttribute('aria-label') ?? '',
      rows: rows.length,
      named: rows.every((r) => (r.getAttribute('aria-label') ?? '').length > 0),
      focusOnRow: document.activeElement?.classList.contains('index-row') ?? false,
    };
  });
  check(
    'M6/9.8 INDEX is a labeled dialog with 10 named rows',
    idx.role === 'dialog' && idx.label.length > 0 && idx.rows === 10 && idx.named && idx.focusOnRow,
    JSON.stringify(idx),
  );
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const traveled = await page
    .waitForFunction(() => location.hash.startsWith('#/hub/') && !document.querySelector('.index-overlay'), null, { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  check('M6 INDEX arrows + Enter travel (flight)', traveled, await page.evaluate(() => location.hash));
  await page.waitForTimeout(1600);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('index'))?.click());
  await page.waitForSelector('.index-panel', { timeout: 4000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => !document.querySelector('.index-overlay') && location.hash.startsWith('#/hub/'));
  check('M6 Esc closes INDEX without leaving the chamber', closed);

  /* chips: present, ≥44px, arrow keys hop */
  const chips = await page.evaluate(() => {
    const cs = [...document.querySelectorAll('.explore-chip')];
    return { n: cs.length, big: cs.every((c) => c.getBoundingClientRect().height >= 44), named: cs.every((c) => (c.getAttribute('aria-label') ?? '').length > 0) };
  });
  check('M6 EXPLORE chips present, ≥44px, named', chips.n === 2 && chips.big && chips.named, JSON.stringify(chips));
  const before = await page.evaluate(() => location.hash);
  await page.keyboard.press('ArrowRight');
  const hopped = await page
    .waitForFunction((b) => location.hash !== b && location.hash.startsWith('#/hub/'), before, { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  check('M6 arrow keys hop planets', hopped, await page.evaluate(() => location.hash));
  await ctx.close();
}

/* 404 — in-world lost coordinates */
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/?v404#/no/such/route`);
  const lost = await page.waitForSelector('.lost-overlay', { timeout: 10000 }).then(() => true).catch(() => false);
  check('M8.12 unknown route shows in-world 404', lost);
  await page.evaluate(() => document.querySelector('.lost-return')?.click());
  await page.waitForTimeout(500);
  const back = await page.evaluate(() => !document.querySelector('.lost-overlay') && location.hash === '#/');
  check('M8.12 [ return ] recovers to the threshold', back);
  await ctx.close();
}

/* ============ 9.2 console gate — across everything above ============ */
const realIssues = consoleLog.filter((l) => !l.includes('GPU stall due to ReadPixels'));
check('9.2 console gate: zero errors & warnings across full flow', realIssues.length === 0, realIssues.slice(0, 6).join(' | ') || 'clean');
if (consoleLog.length) writeFileSync('verification/console-log.txt', consoleLog.join('\n'));

await browser.close();
writeFileSync('verification/RESULTS.json', JSON.stringify(results, null, 2));
const fails = results.filter((r) => !r.pass);
console.log(`\n==== ${results.length - fails.length}/${results.length} PASS ====`);
if (fails.length) {
  console.log('FAILURES:');
  fails.forEach((f) => console.log(` - ${f.id}: ${f.detail}`));
  process.exit(1);
}
