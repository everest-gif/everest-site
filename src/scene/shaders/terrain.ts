import { GLSL_NOISE } from './noise';
import { GLSL_SEASON } from '../season';

/* Shared height-field + seam displacement, used by the wireframe lines, the pulse points,
   the treeline, and the elk walker so they stay welded together. Seam peel (§2 Act II):
   vertices part around x≈0 as uSeam rises. Consumers supply uAmp/uFreq/uSeed/uSeam. */
export const GLSL_TERRAIN_COMMON = /* glsl */ `
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
${GLSL_SEASON}
varying float vH;
varying vec3 vWorld;
varying float vSeamGlow;
varying float vSeamK;
varying float vSlope;

void main() {
  vec3 pos = position; /* plane lies in XY pre-rotation: x across, y depth-ish — geometry is rotated on CPU so here x,z grid, y=0 */
  float h = heightAt(pos.xz);
  pos.y += h * uAmp;
  /* slope from central differences — winter snow settles on up-facing ground (M3) */
  float e = 0.7;
  float hx = heightAt(pos.xz + vec2(e, 0.0)) - heightAt(pos.xz - vec2(e, 0.0));
  float hz = heightAt(pos.xz + vec2(0.0, e)) - heightAt(pos.xz - vec2(0.0, e));
  vSlope = length(vec2(hx, hz)) * uAmp / (2.0 * e);
  float w = exp(-abs(pos.x) * 0.30);
  vSeamGlow = uSeam * w;
  vSeamK = uSeam;
  pos = displaceSeam(pos);
  /* 1-vertex shimmer riding the weather front (M3 reconstruction transition) */
  float shim = seasonShimmer(pos.x);
  pos.y += shim * snoise(vec2(pos.x * 2.7, pos.z * 3.3)) * 0.16;
  vH = clamp(h, 0.0, 1.4) / 1.4;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const terrainFrag = /* glsl */ `
${GLSL_SEASON}
uniform vec3 uColor;
uniform float uNearBright;
uniform float uFade;
varying float vH;
varying vec3 vWorld;
varying float vSeamGlow;
varying float vSeamK;
varying float vSlope;

/* M3 — season palettes: value/temperature shifts within the family, never candy */
vec3 seasonCol(float s, float glow, float h, float slope) {
  if (s < 0.5) {
    /* NIGHT — the original amber study */
    return uColor * glow;
  } else if (s < 1.5) {
    /* WINTER — cold bone; snow settles on upper, up-facing ground */
    float snow = smoothstep(0.28, 0.85, h) * (1.0 - smoothstep(0.45, 1.5, slope));
    vec3 cold = mix(vec3(0.20, 0.25, 0.34), vec3(0.74, 0.80, 0.92), snow);
    return cold * (glow * 0.8 + 0.10);
  } else if (s < 2.5) {
    /* SPRING — jade rising through the valley floors */
    float valley = 1.0 - smoothstep(0.10, 0.48, h);
    vec3 jade = vec3(0.16, 0.72, 0.55);
    return mix(uColor * glow, jade * (glow * 0.75 + 0.05), valley * 0.82);
  }
  /* AUTUMN — rust-amber elevation banding */
  float band = abs(2.0 * fract(h * 4.0) - 1.0);
  vec3 rust = vec3(0.62, 0.21, 0.07);
  return mix(rust * (glow * 0.9 + 0.03), uColor * glow * 1.08, smoothstep(0.32, 0.7, band));
}

void main() {
  float d = length(vWorld - cameraPosition);
  float depthFade = 1.0 - smoothstep(16.0, 56.0, d) * 0.8;
  /* M3 full-bleed at rest; during the breach approach (uNearBright ramps) the old
     wide near-fade returns — otherwise the fly-through drowns the lens in additive lines */
  float bk = clamp(uNearBright * 2.86, 0.0, 1.0);
  float nearFade = smoothstep(mix(1.2, 2.8, bk), mix(4.5, 10.0, bk), d);
  float glow = 0.05 + pow(max(vH, 0.0), 1.6) * 0.85; /* flats nearly black; crests glow */
  /* near valley floor keeps a faint presence — no dead band under the lockup */
  glow += (1.0 - smoothstep(3.0, 15.0, d)) * 0.085 * (1.0 - bk);
  glow *= 1.0 + uNearBright * 0.8; /* R0.4: approach warms the rock, never torches it */
  float k = seasonCoverage(vWorld.x);
  float shim = seasonShimmer(vWorld.x);
  vec3 col = mix(seasonCol(uSeasonFrom, glow, vH, vSlope), seasonCol(uSeasonTo, glow, vH, vSlope), k);
  col += vec3(0.93, 0.91, 0.875) * shim * 0.5; /* frontline shimmer */
  col += uColor * vSeamGlow * 1.6; /* wound edges glow amber — edges, not a fireball */
  /* gap-straddling segments read as tearing threads mid-split, then snap away once open
     (they'd otherwise streak across the climb corridor) */
  float snap = smoothstep(0.55, 0.9, vSeamK);
  float bridge = 1.0 - snap * (1.0 - smoothstep(1.0, 3.2, abs(vWorld.x)));
  /* AdditiveBlending uses SrcAlpha — do NOT premultiply or brightness goes alpha² */
  float alpha = clamp(uFade * depthFade * nearFade * bridge + shim * 0.25 * uFade, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

export const pulseVert = /* glsl */ `
${GLSL_NOISE}
${GLSL_TERRAIN_COMMON}
attribute float aSeed;
uniform float uTime;
varying float vA;
varying float vX;

void main() {
  vec3 pos = position;
  pos.y += heightAt(pos.xz) * uAmp;
  pos = displaceSeam(pos);
  float rate = 0.04 + 0.10 * hash11(aSeed * 7.13);
  float cycle = fract(uTime * rate + hash11(aSeed * 3.71));
  /* most of the time dark; occasionally a vertex pops like traffic on a network */
  float pulse = smoothstep(0.0, 0.05, cycle) * (1.0 - smoothstep(0.05, 0.20, cycle));
  vA = pulse * 0.6;
  vX = pos.x;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(5.0, (1.1 + 2.0 * pulse) * (90.0 / max(1.0, -mv.z)));
  gl_Position = projectionMatrix * mv;
}
`;

export const pulseFrag = /* glsl */ `
${GLSL_SEASON}
uniform vec3 uColor;
uniform float uFade; /* S1 — network pulses die with the terrain as altitude builds */
varying float vA;
varying float vX;

/* season-tinted network traffic (M3) — amber / cold bone / jade / warm rust */
vec3 pulseCol(float s) {
  if (s < 0.5) return uColor;
  if (s < 1.5) return vec3(0.72, 0.78, 0.9);
  if (s < 2.5) return vec3(0.25, 0.78, 0.6);
  return vec3(0.85, 0.42, 0.14);
}

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float disc = 1.0 - smoothstep(0.18, 0.5, r);
  float a = vA * disc * uFade;
  if (a < 0.01) discard;
  vec3 col = mix(pulseCol(uSeasonFrom), pulseCol(uSeasonTo), seasonCoverage(vX));
  gl_FragColor = vec4(col, a);
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
