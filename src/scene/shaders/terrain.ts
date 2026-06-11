import { GLSL_NOISE } from './noise';

/* Shared height-field + seam displacement, used by both the wireframe lines and the pulse points
   so they stay welded together. Seam peel (§2 Act II): vertices part around x≈0 as uSeam rises. */
const GLSL_TERRAIN_COMMON = /* glsl */ `
uniform float uAmp;
uniform float uFreq;
uniform float uSeed;
uniform float uSeam;

float heightAt(vec2 p) {
  vec2 q = p * uFreq + vec2(uSeed * 13.7, uSeed * 7.3);
  float r = ridgedFbm(q);
  /* Flatirons bias (R6): tilted slab strata along one grain — angled ridge planes,
     not generic fractal peaks. Warped by the ridge field so slabs break naturally. */
  float slab = 1.0 - abs(2.0 * fract((q.x * 0.82 + q.y * 0.57) * 1.35 + r * 0.4) - 1.0);
  r = mix(r, r * (0.6 + 0.4 * slab) + slab * 0.18, 0.38);
  /* slab envelope — pointed flatiron masses rising off a long ridge.
     gaussians via t*t, never pow(): pow(x<0, y) is NaN on Metal/ANGLE and
     one NaN pixel poisons the whole bloom mip chain. */
  float g1 = (p.x - 7.5 + uSeed * 3.1) * 0.065;
  float g2 = (p.x + 5.5 - uSeed * 4.3) * 0.055;
  float g3 = (p.x - 16.0 - uSeed * 2.0) * 0.05;
  float env = 0.42
    + 0.50 * exp(-g1 * g1)
    + 0.62 * exp(-g2 * g2)
    + 0.34 * exp(-g3 * g3);
  /* back of each plane rises so the silhouette reads as a ridgeline
     (reversed smoothstep edges are UB in GLSL — invert explicitly) */
  float back = 1.0 - smoothstep(-9.0, 6.0, p.y);
  return r * env * back;
}

vec3 displaceSeam(vec3 pos) {
  /* never 0 — a sign(0)=0 vertex column at x=0 would smear lines across the open gap */
  float s = pos.x >= 0.0 ? 1.0 : -1.0;
  float w = exp(-abs(pos.x) * 0.30);
  /* strata shelves (R1.2): each elevation band slides by its own amount — cut rock layers */
  float band = floor(pos.y * 1.6);
  float strata = 0.72 + 0.28 * hash11(band * 7.31 + uSeed);
  float peel = uSeam * w * strata;
  /* tear jitter — wireframe under tension; peaks mid-split, settles once open */
  float tear = uSeam * (1.0 - uSeam) * w * 4.0;
  pos.x += s * peel * 7.5 + s * tear * snoise(vec2(pos.y * 2.1 + uSeed, pos.x * 0.7)) * 0.4;
  pos.y += peel * 0.6;
  return pos;
}
`;

export const terrainVert = /* glsl */ `
${GLSL_NOISE}
${GLSL_TERRAIN_COMMON}
varying float vH;
varying vec3 vWorld;
varying float vSeamGlow;
varying float vSeamK;

void main() {
  vec3 pos = position; /* plane lies in XY pre-rotation: x across, y depth-ish — geometry is rotated on CPU so here x,z grid, y=0 */
  float h = heightAt(pos.xz);
  pos.y += h * uAmp;
  float w = exp(-abs(pos.x) * 0.30);
  vSeamGlow = uSeam * w;
  vSeamK = uSeam;
  pos = displaceSeam(pos);
  vH = clamp(h, 0.0, 1.4) / 1.4;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const terrainFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uNearBright;
uniform float uFade;
varying float vH;
varying vec3 vWorld;
varying float vSeamGlow;
varying float vSeamK;

void main() {
  float d = length(vWorld - cameraPosition);
  float depthFade = 1.0 - smoothstep(16.0, 56.0, d) * 0.8;
  float nearFade = smoothstep(2.5, 10.0, d); /* kill the in-your-face foreground grid */
  float glow = 0.05 + pow(max(vH, 0.0), 1.6) * 0.85; /* flats nearly black; crests glow */
  glow *= 1.0 + uNearBright * 0.8; /* R0.4: approach warms the rock, never torches it */
  glow += vSeamGlow * 1.6; /* wound edges glow amber — edges, not a fireball */
  vec3 col = uColor * glow;
  /* gap-straddling segments read as tearing threads mid-split, then snap away once open
     (they'd otherwise streak across the tunnel corridor) */
  float snap = smoothstep(0.55, 0.9, vSeamK);
  float bridge = 1.0 - snap * (1.0 - smoothstep(1.0, 3.2, abs(vWorld.x)));
  /* AdditiveBlending uses SrcAlpha — do NOT premultiply or brightness goes alpha² */
  float alpha = uFade * depthFade * nearFade * bridge;
  gl_FragColor = vec4(col, alpha);
}
`;

export const pulseVert = /* glsl */ `
${GLSL_NOISE}
${GLSL_TERRAIN_COMMON}
attribute float aSeed;
uniform float uTime;
varying float vA;

void main() {
  vec3 pos = position;
  pos.y += heightAt(pos.xz) * uAmp;
  pos = displaceSeam(pos);
  float rate = 0.04 + 0.10 * hash11(aSeed * 7.13);
  float cycle = fract(uTime * rate + hash11(aSeed * 3.71));
  /* most of the time dark; occasionally a vertex pops like traffic on a network */
  float pulse = smoothstep(0.0, 0.05, cycle) * (1.0 - smoothstep(0.05, 0.20, cycle));
  vA = pulse * 0.6;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(5.0, (1.1 + 2.0 * pulse) * (90.0 / max(1.0, -mv.z)));
  gl_Position = projectionMatrix * mv;
}
`;

export const pulseFrag = /* glsl */ `
uniform vec3 uColor;
varying float vA;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float disc = 1.0 - smoothstep(0.18, 0.5, r);
  float a = vA * disc;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* The seam light (R1.2): a bone-white hairline BLADE draws downward from the crest,
   then the amber wound light swells in the gap as the halves part. */
export const seamVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const seamFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uSeam;
uniform float uBlade; /* 0→1 draws the hairline from crest to base */
uniform float uFade;  /* thresholdFade — the wound light dies as the camera slips in */
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  /* melt away as the camera arrives — never a wall of light across the lens */
  float near = clamp((length(vWorld - cameraPosition) - 1.6) / 2.6, 0.0, 1.0);
  float x = abs(vUv.x - 0.5);
  float tipY = 1.0 - uBlade;
  /* hairline: a blade, not a glow */
  float hair = exp(-x * x * 5200.0);
  float drawn = smoothstep(tipY, tipY + 0.025, vUv.y) * step(0.001, uBlade);
  float dy = vUv.y - tipY;
  float tip = exp(-dy * dy * 700.0) * uBlade * (1.0 - uBlade) * 4.0;
  float flick = 0.93 + 0.07 * snoise(vec2(vUv.y * 9.0 - uTime * 2.2, uTime * 0.8));
  vec3 bone = vec3(0.93, 0.91, 0.875);
  vec3 col = bone * hair * (drawn * 2.4 + tip * 2.8);
  /* wound light — amber, swells with the split, narrow and restrained */
  float wound = exp(-x * x * 150.0) * uSeam;
  col += uColor * wound * 1.0 * flick;
  float vert = smoothstep(0.0, 0.06, vUv.y);
  float a = clamp(hair * (drawn * 2.0 + tip) + wound * 0.9, 0.0, 1.0) * vert * flick * uFade * near;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}
`;
