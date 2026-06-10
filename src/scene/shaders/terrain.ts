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
  float w = exp(-abs(pos.x) * 0.30);
  float peel = uSeam * w;
  pos.x += sign(pos.x) * peel * 7.0;
  pos.y += peel * 2.2;
  return pos;
}
`;

export const terrainVert = /* glsl */ `
${GLSL_NOISE}
${GLSL_TERRAIN_COMMON}
varying float vH;
varying vec3 vWorld;
varying float vSeamGlow;

void main() {
  vec3 pos = position; /* plane lies in XY pre-rotation: x across, y depth-ish — geometry is rotated on CPU so here x,z grid, y=0 */
  float h = heightAt(pos.xz);
  pos.y += h * uAmp;
  float w = exp(-abs(pos.x) * 0.30);
  vSeamGlow = uSeam * w;
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

void main() {
  float d = length(vWorld - cameraPosition);
  float depthFade = 1.0 - smoothstep(16.0, 56.0, d) * 0.8;
  float nearFade = smoothstep(2.5, 10.0, d); /* kill the in-your-face foreground grid */
  float glow = 0.05 + pow(max(vH, 0.0), 1.6) * 0.85; /* flats nearly black; crests glow */
  glow *= 1.0 + uNearBright * 1.9;
  glow += vSeamGlow * 3.2;
  vec3 col = uColor * glow;
  /* AdditiveBlending uses SrcAlpha — do NOT premultiply or brightness goes alpha² */
  float alpha = uFade * depthFade * nearFade;
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

/* The seam light — a thin vertical blade of light inside the fissure, dormant until the breach. */
export const seamVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const seamFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uSeam;
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float c0 = max(0.0, 1.0 - abs(vUv.x - 0.5) * 2.0);
  float core = c0 * c0 * c0;
  float flicker = 0.85 + 0.15 * snoise(vec2(vUv.y * 6.0 - uTime * 1.4, uTime * 0.6));
  float vert = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
  float a = core * vert * uSeam * flicker;
  gl_FragColor = vec4(uColor * 2.4, a);
}
`;
