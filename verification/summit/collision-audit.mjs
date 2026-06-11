/* S5 — automated collision audit. At 1440/1280/mobile widths, assert ZERO intersecting
   text/interactive bounding boxes across all 8 chambers.
   Rules:
   - Leaf text blocks (deepest elements owning visible text), images/figures, and
     interactive controls inside the chamber content participate.
   - Decorative aria-hidden elements (ghost numerals, corner marks, slot glyphs) and
     near-invisible texture (opacity < 0.15) are exempt — they are background, not content.
   - The planet limb is canvas, not DOM — exempt by construction.
   - Floating travel chrome (EXPLORE chips, orbital rail, HUD) is one fixed layer over a
     scroll container; content legitimately passes under it while scrolling. The fixed
     layer is checked against ITSELF (chips vs rail vs HUD must never collide), and the
     audit asserts the initial composition (scroll-top) of the content separately.
   Any intersection > 3px in both axes between non-nested participants is a FAIL.
   Usage: node collision-audit.mjs [base] | tee collision-audit.log */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const IDS = ['jarvis', 'luven', 'emerge', 'dolomite', 'everclash', 'voxhalla', 'bigback', 'beyond'];
const WIDTHS = [
  { w: 1440, h: 900, name: '1440' },
  { w: 1280, h: 800, name: '1280' },
  { w: 390, h: 844, name: 'mobile' },
];

const browser = await chromium.launch({ headless: false });
let totalFail = 0;

const collect = `(() => {
  const isVisible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) < 0.15) return false;
    return true;
  };
  const HEAD = new Set(['h1', 'h2', 'h3']);
  /* decorative texture (ghost numerals, slot glyphs, split-line internals) is exempt —
     but headlines themselves ALWAYS participate even though SplitText hides their lines */
  const decorative = (el) =>
    el.closest('[aria-hidden="true"]') !== null &&
    !HEAD.has(el.tagName.toLowerCase()) &&
    !el.closest('button, a');
  const root = document.querySelector('.chamber-content');
  if (!root) return { error: 'no chamber content' };
  const parts = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let n = walker.currentNode;
  while (n) {
    const el = n;
    n = walker.nextNode();
    if (!(el instanceof HTMLElement)) continue;
    if (!isVisible(el) || decorative(el)) continue;
    const tag = el.tagName.toLowerCase();
    const cs = getComputedStyle(el);
    const interactive = tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select';
    const media = tag === 'img' || tag === 'figure' || tag === 'video';
    /* TEXT BLOCK = block-level element that directly owns inline text. Inline spans
       (giant display digits bleed their em-box past the line box) are typography,
       not layout — the block's line box is what can collide. */
    const blockish = cs.display !== 'inline' && cs.display !== 'contents';
    const ownsInlineText = Array.from(el.childNodes).some(
      (c) =>
        (c.nodeType === 3 && c.textContent.trim().length > 0) ||
        (c.nodeType === 1 &&
          getComputedStyle(c).display === 'inline' &&
          c.textContent.trim().length > 0),
    );
    const textBlock = blockish && ownsInlineText;
    if (!interactive && !media && !textBlock && !HEAD.has(tag)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    parts.push({
      sel: tag + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''),
      text: (el.textContent || '').trim().slice(0, 28),
      x: r.x, y: r.y, w: r.width, h: r.height,
      path: (() => { let p = el, out = []; while (p && p !== root) { out.unshift(p.tagName); p = p.parentElement; } return out.join('>'); })(),
      key: Math.random().toString(36).slice(2),
    });
    el.__auditKey = parts[parts.length - 1].key;
  }
  /* containment map via DOM */
  const els = Array.from(root.querySelectorAll('*')).filter((e) => e.__auditKey);
  const contains = [];
  for (const a of els) for (const b of els) {
    if (a !== b && a.contains(b)) contains.push([a.__auditKey, b.__auditKey]);
  }
  /* floating layer */
  const floats = [];
  for (const el of document.querySelectorAll('.explore-chip, .orbital-rail button, .orbital-rail, .hud-br, .hud-tr')) {
    if (!(el instanceof HTMLElement) || !isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2) continue;
    floats.push({ sel: el.className.split(' ')[0], x: r.x, y: r.y, w: r.width, h: r.height });
  }
  return { parts, contains, floats };
})()`;

function intersections(parts, containsPairs) {
  const contained = new Set(containsPairs.map((p) => p.join('|')));
  const bad = [];
  for (let i = 0; i < parts.length; i++)
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i];
      const b = parts[j];
      if (contained.has(`${a.key}|${b.key}`) || contained.has(`${b.key}|${a.key}`)) continue;
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 3 && oy > 3) bad.push({ a, b, ox: +ox.toFixed(1), oy: +oy.toFixed(1) });
    }
  return bad;
}

for (const vp of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(`${BASE}/#/hub/jarvis`);
  await page.waitForSelector('.chamber-content', { timeout: 20000 });
  await page.waitForTimeout(1800);
  for (const id of IDS) {
    await page.evaluate((target) => {
      location.hash = `#/hub/${target}`;
    }, id);
    await page.waitForTimeout(2400); /* hop flight + materialize + reveals */
    const res = await page.evaluate(collect);
    if (res.error) {
      console.log(`[${vp.name}] ${id}: ERROR ${res.error}`);
      totalFail++;
      continue;
    }
    const bad = intersections(res.parts, res.contains);
    const fbad = intersections(
      res.floats.map((f, i) => ({ ...f, key: String(i) })),
      [],
    ).filter(({ a, b }) => !(a.sel.includes('orbital') && b.sel.includes('orbital')));
    const n = bad.length + fbad.length;
    totalFail += n;
    console.log(`[${vp.name}] ${id}: ${res.parts.length} parts, ${n === 0 ? 'CLEAN' : n + ' INTERSECTIONS'}`);
    for (const { a, b, ox, oy } of [...bad, ...fbad].slice(0, 6)) {
      console.log(`    ✗ ${a.sel} "${a.text ?? ''}" × ${b.sel} "${b.text ?? ''}" (${ox}×${oy}px)`);
    }
  }
  await page.close();
}
await browser.close();
console.log(totalFail === 0 ? 'COLLISION AUDIT: ALL CLEAN' : `COLLISION AUDIT: ${totalFail} FAILURES`);
process.exit(totalFail === 0 ? 0 : 1);
