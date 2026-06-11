import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4173/?fx#/hub');
await page.waitForFunction(() => document.querySelectorAll('.hub-node-btn').length === 8, null, { timeout: 12000 });
await page.waitForTimeout(1200);

/* 1 — opsz sweep visibility: click a node, record (panelVisible, opsz) per frame */
const trace = await page.evaluate(() => new Promise((res) => {
  const b = [...document.querySelectorAll('.hub-node-btn')].find((x) => x.closest('[data-node]').dataset.node === 'voxhalla');
  b.click();
  const t0 = performance.now();
  const frames = [];
  const tick = () => {
    const p = document.querySelector('.chamber-panel');
    const h = document.querySelector('.ch-title');
    if (p && h) {
      const vis = getComputedStyle(p).visibility === 'visible';
      const m = /opsz['"]? (\d+\.?\d*)/.exec(getComputedStyle(h).fontVariationSettings);
      frames.push({ t: Math.round(performance.now() - t0), vis, opsz: m ? +m[1] : null });
    }
    if (performance.now() - t0 < 2400) requestAnimationFrame(tick);
    else res(frames.filter((f, i) => i % 6 === 0 || (i > 0 && frames[i-1] && !frames[i-1].vis && f.vis)));
  };
  requestAnimationFrame(tick);
}));
const firstVisible = trace.find((f) => f.vis && f.opsz !== null);
console.log('first visible frame:', JSON.stringify(firstVisible));
console.log('trace:', JSON.stringify(trace.slice(0, 14)));

/* 2 — magnetic node pull */
await page.keyboard.press('Escape');
await page.waitForFunction(() => location.hash === '#/hub', null, { timeout: 4000 });
await page.waitForTimeout(600);
const mag = await page.evaluate(() => new Promise((res) => {
  const el = document.querySelector('[data-node="jarvis"]');
  const read = () => {
    const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform);
    return { x: +m[1], y: +m[2] };
  };
  // anchor positions stream from the scene; sample rest pose, then move mouse near, sample again
  const rest = [];
  let n = 0;
  const sampleRest = () => {
    rest.push(read());
    if (++n < 5) requestAnimationFrame(sampleRest);
    else {
      const r = el.getBoundingClientRect();
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + r.width / 2 + 30, clientY: r.top + 20 }));
      setTimeout(() => {
        const pulled = read();
        res({ rest: rest[rest.length - 1], pulled });
      }, 450);
    }
  };
  requestAnimationFrame(sampleRest);
}));
console.log('magnetic:', JSON.stringify(mag));
await browser.close();
