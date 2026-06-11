/* R4.2 — chamber atmosphere art, rendered as WebGL fragment shaders (palette-locked,
   film-grained, 80% darkness). Outputs public/art/<id>/hero.{avif,webp,jpg}.
   Regenerate any time: node tools/make-art.mjs [id ...] */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const W = 1600;
const H = 1000;

const COMMON = /* glsl */ `
precision highp float;
uniform vec2 uRes;
const vec3 INK = vec3(0.039, 0.039, 0.047);
const vec3 AMBER = vec3(0.910, 0.635, 0.239);
const vec3 JADE = vec3(0.219, 0.851, 0.663);
const vec3 BONE = vec3(0.929, 0.910, 0.875);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)), c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float n = 0.0, amp = 0.5;
  for (int i = 0; i < 5; i++) { n += amp * vnoise(p); p *= 2.03; amp *= 0.5; }
  return n;
}
float ridged(vec2 p) {
  float n = 0.0, amp = 0.55, fr = 1.0;
  for (int i = 0; i < 5; i++) { n += amp * (1.0 - abs(2.0 * vnoise(p * fr) - 1.0)); fr *= 2.02; amp *= 0.46; }
  return n;
}
vec3 grade(vec3 col, vec2 uv) {
  /* duotone pull toward the palette + film grain + vignette */
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 duo = mix(INK, AMBER, clamp(lum * 1.25, 0.0, 1.0));
  col = mix(col, duo, 0.22);
  float g = hash21(uv * uRes) - 0.5;
  col += g * 0.035;
  vec2 c = uv - 0.5;
  col *= 1.0 - dot(c, c) * 0.85;
  return max(col, 0.0);
}
`;

const ART = {
  /* long-exposure light study of a dark control room, one amber monitor glow */
  jarvis: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 col = INK * 0.55;
    /* the monitor — one amber rectangle of light, lower right, soft spill */
    vec2 m = vec2(0.72, 0.34);
    vec2 d = abs(uv - m) - vec2(0.085, 0.055);
    float box = length(max(d, 0.0));
    float glow = exp(-box * box * 260.0) * 0.85 + exp(-box * 9.0) * 0.30;
    col += AMBER * glow;
    /* its reflection on a desk plane below */
    float desk = exp(-abs(uv.y - 0.22) * 18.0) * exp(-abs(uv.x - 0.72) * 5.0) * 0.10;
    col += AMBER * desk * (0.6 + 0.4 * fbm(uv * 40.0));
    /* long-exposure status-light trails, upper left, thin arcs */
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 cc = vec2(0.18 + fi * 0.05, 1.18 + fi * 0.07);
      float r = length(uv - cc);
      float arc = exp(-abs(r - (0.74 + fi * 0.05)) * (340.0 - fi * 60.0));
      float seg = smoothstep(0.05, 0.3, uv.x) * (1.0 - smoothstep(0.4, 0.62, uv.x));
      col += AMBER * arc * seg * (0.14 - fi * 0.035);
    }
    /* the dark room mass */
    col *= 0.85 + 0.15 * fbm(uv * 3.0);
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,

  /* a workshop landline glowing at night, shallow focus */
  luven: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 col = INK * 0.5;
    /* the phone's warm glow — one soft source, left of center */
    vec2 p = vec2(0.34, 0.46);
    float r = length((uv - p) * vec2(1.0, 1.25));
    col += AMBER * (exp(-r * r * 26.0) * 0.95 + exp(-r * 3.4) * 0.22);
    /* shallow-focus bokeh — out-of-focus shop lights */
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      vec2 b = vec2(0.62 + fi * 0.085, 0.58 + 0.16 * sin(fi * 2.1));
      float br = length(uv - b);
      float disc = (1.0 - smoothstep(0.028 + fi * 0.012, 0.034 + fi * 0.014, br));
      col += AMBER * disc * (0.10 - fi * 0.012);
    }
    float bench = exp(-abs(uv.y - 0.27) * 24.0) * 0.08;
    col += AMBER * bench * fbm(uv * vec2(60.0, 8.0));
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,

  /* abstract dossier paper texture, raking-lit */
  emerge: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    /* paper fibers — anisotropic, lit by a raking light from the right */
    float fiber = fbm(uv * vec2(14.0, 240.0));
    float tooth = fbm(uv * vec2(220.0, 200.0));
    float rake = smoothstep(0.05, 0.95, uv.x);
    rake = rake * rake;
    float lit = (0.16 + fiber * 0.5 + tooth * 0.18) * rake;
    vec3 col = INK * 0.6 + mix(AMBER, BONE, 0.45) * lit * 0.5;
    /* two creases catching the light */
    float cr1 = exp(-abs(uv.y - 0.62 - 0.02 * fbm(uv * 6.0)) * 110.0);
    float cr2 = exp(-abs(uv.y - 0.31 + 0.015 * fbm(uv * 7.0)) * 150.0);
    col += AMBER * (cr1 * 0.16 + cr2 * 0.10) * rake;
    /* deep shadow falling off to the left */
    col *= 0.25 + 0.75 * smoothstep(0.0, 0.7, uv.x);
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,

  /* macro rock strata, amber edge light */
  dolomite: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    /* warped sediment bands */
    float warp = fbm(uv * 3.2) * 0.32;
    float band = uv.y * 9.0 + warp * 3.0;
    float strata = fract(band);
    float layer = floor(band);
    float tone = 0.05 + 0.11 * hash21(vec2(layer, 3.7));
    vec3 col = INK * 0.5 + vec3(tone) * vec3(1.0, 0.92, 0.84) * 0.45;
    /* amber light raking each band's upper edge */
    float edge = exp(-strata * 16.0);
    float keylight = smoothstep(0.15, 0.85, uv.x) * (1.0 - smoothstep(0.6, 1.0, uv.y));
    col += AMBER * edge * keylight * (0.34 + 0.2 * fbm(uv * 22.0));
    /* grain of the rock */
    col *= 0.8 + 0.2 * fbm(uv * vec2(90.0, 30.0));
    col *= 0.4 + 0.6 * smoothstep(1.0, 0.35, uv.y);
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,

  /* two abstract energy forms mid-collision */
  everclash: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 q = uv - 0.5;
    vec3 col = INK * 0.5;
    /* two masses driving at each other — hard-edged fronts, not fog */
    float wob = (fbm(vec2(uv.y * 5.0, 3.1)) - 0.5) * 0.18;
    float frontA = smoothstep(0.02, -0.10, q.x - wob);  /* amber wall from the left */
    float frontB = smoothstep(-0.02, 0.10, q.x + wob);  /* bone wall from the right */
    float coreA = exp(-length(q - vec2(-0.3, 0.04)) * 3.2);
    float coreB = exp(-length(q - vec2(0.32, -0.05)) * 3.4);
    col += AMBER * frontA * coreA * 1.15;
    col += mix(AMBER, BONE, 0.6) * frontB * coreB * 0.8;
    /* the interface — a hot torn seam where they meet */
    float seam = exp(-abs(q.x - wob * 0.5) * 26.0);
    float turb = ridged(uv * vec2(7.0, 16.0));
    col += mix(AMBER, BONE, 0.4) * seam * (0.25 + turb * turb * 0.9);
    /* spray — hot specks thrown off the seam */
    vec2 sg = floor(uv * vec2(220.0, 140.0));
    float sp = step(0.995, hash21(sg)) * exp(-abs(q.x) * 6.0);
    col += BONE * sp * (0.4 + 0.6 * hash21(sg + 5.0));
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,

  /* voxel cloudscape */
  voxhalla: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    /* clouds sampled on a coarse grid — quantized, proudly cubic */
    vec2 cell = floor(uv * vec2(46.0, 29.0));
    vec2 cuv = cell / vec2(46.0, 29.0);
    float cloud = fbm(cuv * vec2(5.0, 7.0) + vec2(0.0, 1.7));
    float height = 1.0 - cuv.y;
    float mass = smoothstep(0.46, 0.72, cloud * (0.55 + height * 0.7));
    /* underlight from below the horizon */
    float under = exp(-(cuv.y) * 2.6);
    vec3 cube = mix(INK * 1.6, AMBER * (0.30 + 0.45 * under), mass);
    /* per-cube value jitter + lit faces (offset sample = fake sun side) */
    cube *= 0.78 + 0.4 * hash21(cell);
    float lit = smoothstep(0.46, 0.72, fbm((cell + vec2(1.0, -1.0)) / vec2(46.0, 29.0) * vec2(5.0, 7.0) + vec2(0.0, 1.7)));
    cube += AMBER * max(0.0, mass - lit) * 0.3;
    /* inner cube border */
    vec2 inner = fract(uv * vec2(46.0, 29.0));
    float bord = smoothstep(0.0, 0.08, inner.x) * smoothstep(0.0, 0.08, inner.y)
               * smoothstep(0.0, 0.08, 1.0 - inner.x) * smoothstep(0.0, 0.08, 1.0 - inner.y);
    cube *= 0.7 + 0.3 * bord;
    vec3 col = INK * 0.45 + cube * mass + AMBER * under * 0.05;
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,

  /* chalk dust drifting through one beam of light */
  bigback: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 col = INK * 0.5;
    /* one volumetric beam, upper-left to lower-right */
    vec2 o = vec2(0.08, 1.05);
    vec2 dir = normalize(vec2(0.62, -0.78));
    vec2 rel = uv - o;
    float along = dot(rel, dir);
    float perp = abs(rel.x * dir.y - rel.y * dir.x);
    float beam = exp(-perp * perp * 90.0) * smoothstep(0.0, 0.25, along) * (1.0 - smoothstep(0.8, 1.45, along));
    col += mix(AMBER, BONE, 0.35) * beam * (0.22 + 0.12 * fbm(uv * 7.0));
    /* chalk motes — dense inside the beam, rare outside */
    vec2 g = floor(uv * vec2(190.0, 120.0));
    float mote = step(0.994, hash21(g));
    float inBeam = exp(-perp * perp * 70.0);
    col += BONE * mote * (0.05 + inBeam * 0.75) * (0.4 + 0.6 * hash21(g + 9.0));
    /* the floor it lands on */
    col += AMBER * exp(-abs(uv.y - 0.12) * 30.0) * beam * 0.5;
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,

  /* alpine ridgeline at night, one jade route-light tracing it */
  beyond: /* glsl */ `
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 col = INK * 0.55;
    /* sparse stars */
    vec2 sg = floor(uv * vec2(160.0, 100.0));
    float star = step(0.997, hash21(sg)) * (0.3 + 0.5 * hash21(sg + 3.0));
    col += BONE * star * smoothstep(0.35, 0.8, uv.y);
    /* the ridgeline */
    float ridge = 0.30 + ridged(vec2(uv.x * 2.6, 0.37)) * 0.18;
    float mountain = 1.0 - smoothstep(ridge - 0.002, ridge + 0.002, uv.y);
    /* faint moonlit faces inside the mass */
    vec3 rock = INK * 1.4 + BONE * fbm(uv * vec2(8.0, 14.0)) * 0.05;
    col = mix(col, rock, mountain);
    /* amber alpenglow breathing just above the crest */
    float glow = exp(-(uv.y - ridge) * (uv.y - ridge) * 800.0) * (1.0 - mountain);
    col += AMBER * glow * 0.18;
    /* ONE jade route-light tracing the crest */
    float route = exp(-abs(uv.y - (ridge + 0.006)) * 480.0);
    float dash = 0.55 + 0.45 * sin(uv.x * 210.0);
    float span = smoothstep(0.12, 0.2, uv.x) * (1.0 - smoothstep(0.78, 0.9, uv.x));
    col += JADE * route * dash * span * 0.5;
    gl_FragColor = vec4(grade(col, uv), 1.0);
  }`,
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ART);

const page_html = `<!doctype html><meta charset="utf-8">
<body style="margin:0"><canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
window.render = (frag) => {
  const gl = document.getElementById('c').getContext('webgl', { preserveDrawingBuffer: true });
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), ${W}, ${H});
  gl.viewport(0, 0, ${W}, ${H});
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const c = document.getElementById('c');
  return {
    png: c.toDataURL('image/png'),
    webp: c.toDataURL('image/webp', 0.82),
    jpg: c.toDataURL('image/jpeg', 0.82),
  };
};
</script></body>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(page_html);
for (const id of ids) {
  if (!ART[id]) {
    console.log('unknown id', id);
    continue;
  }
  const out = await page.evaluate((frag) => window.render(frag), COMMON + ART[id]);
  const buf = (u) => Buffer.from(u.split(',')[1], 'base64');
  mkdirSync(`public/art/${id}`, { recursive: true });
  const tmp = `public/art/${id}/hero-src.png`;
  writeFileSync(tmp, buf(out.png));
  writeFileSync(`public/art/${id}/hero.webp`, buf(out.webp));
  writeFileSync(`public/art/${id}/hero.jpg`, buf(out.jpg));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-c:v', 'libaom-av1', '-crf', '36', '-b:v', '0', `public/art/${id}/hero.avif`]);
  execFileSync('rm', [tmp]);
  console.log('art:', id);
}
await browser.close();
console.log('done');
