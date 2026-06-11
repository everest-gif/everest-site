import { GLSL_NOISE } from './noise';

/* R1.3 — darkness with ribbons. The tube is OPAQUE INK: it occludes the starfield and
   carries only a ghost hex lattice (≤6%) lit where sliding pools of ribbon-light graze it.
   All actual light is geometry: 7 streak ribbons + a dim particle field. */

export const tunnelVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const tunnelFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform float uProgress; /* transit 0..1 — scrolls the light pools past the camera */
uniform float uLight;    /* energy 0..1 */
uniform vec3 uAmber;
varying vec2 vUv;

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, vec2(0.5, 0.8660254)), p.x);
}

float hexGhost(vec2 uv) {
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  float d = hexDist(g);
  return smoothstep(0.44, 0.5, d);
}

void main() {
  float angle = vUv.x;
  float z = vUv.y;
  /* ghost lattice — visible only where a pool of ribbon-light slides across it */
  float hex = hexGhost(vec2(angle * 40.0, z * 80.0));
  float flow = z * 7.0 - uProgress * 9.0 - uTime * 0.22;
  float pool = smoothstep(0.6, 0.97, fbm(vec2(angle * 12.566371, flow)) * 0.5 + 0.5);
  /* M4 — ghost hex lifted to ~7% so the shorter flight never reads empty */
  vec3 col = uAmber * hex * pool * (0.07 * uLight);
  gl_FragColor = vec4(col, 1.0); /* opaque ink — the mountain's interior swallows the sky */
}
`;

/* End cap — sealed far end; a distant point of light that the ribbons converge into. */
export const capFrag = /* glsl */ `
uniform float uLight;
uniform float uConverge;
uniform vec3 uAmber;
varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float r2 = dot(c, c) * 4.0;
  float k = 14.0 - uConverge * 9.0;
  float pt = exp(-r2 * k) * (0.10 + uConverge * 3.2);
  vec3 col = uAmber * pt * uLight;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* Streak ribbons — long-exposure light, flowing past the camera near the wall. */
export const ribbonVert = /* glsl */ `
attribute float aAngle;
attribute float aRadius;
attribute float aLen;
attribute float aSpeed;
attribute float aPhase;
attribute float aJade;
attribute float aSide;  /* −1 / +1 across width */
attribute float aHead;  /* 0 tail, 1 head */
attribute float aWidth;
attribute float aBright;
uniform float uTime;
uniform float uProgress;
uniform float uConverge;
varying float vHead;
varying float vSide;
varying float vJade;
varying float vBright;
varying float vFade;

void main() {
  float span = 88.0;
  float head = mod(aPhase + uTime * 2.0 + uProgress * aSpeed, span);
  float z = -15.0 - head + aHead * aLen;
  /* arrival: ribbons converge to a point AHEAD of the camera's final position (−74) */
  z += uConverge * (-77.0 - z) * 0.85;
  float r = aRadius * (1.0 - uConverge * 0.88);
  vec2 dir = vec2(cos(aAngle), sin(aAngle));
  vec2 perp = vec2(-dir.y, dir.x);
  vec2 xy = dir * r + perp * (aSide * aWidth * 0.5 * (1.0 - uConverge * 0.6));
  /* fade at both tunnel ends so wrap pops never show */
  float fIn = 1.0 - smoothstep(-24.0, -17.0, z);
  float fOut = smoothstep(-78.5, -71.0, z);
  vFade = (fIn * fOut) * (1.0 + uConverge * 1.6); /* converging light gathers brightness */
  vHead = aHead;
  vSide = aSide;
  vJade = aJade;
  vBright = aBright;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(xy.x, xy.y, z, 1.0);
}
`;

export const ribbonFrag = /* glsl */ `
uniform float uLight;
uniform vec3 uAmber;
uniform vec3 uJade;
varying float vHead;
varying float vSide;
varying float vJade;
varying float vBright;
varying float vFade;

void main() {
  float across = exp(-vSide * vSide * 3.2);          /* soft falloff across width */
  float along = exp((vHead - 1.0) * 3.4);            /* bright head, long fading tail */
  float cap = 1.0 - smoothstep(0.965, 1.0, vHead);   /* round the head edge */
  float a = across * along * cap * vFade * vBright * uLight;
  if (a < 0.004) discard;
  vec3 col = mix(uAmber, uJade, vJade);
  gl_FragColor = vec4(col * 2.0, a);
}
`;

/* Star-particle field — dim points of passage, a speed cue, never a light show. */
export const speedlineVert = /* glsl */ `
attribute float aZ0;    /* segment base position along tunnel */
attribute float aEnd;   /* 0 = tail, 1 = head */
attribute float aLen;   /* segment length */
attribute float aSeed;
uniform float uProgress;
uniform float uTime;
uniform float uLight;
varying float vA;

float hash(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  vec3 pos = position; /* x,y on ring; z computed */
  float speed = 36.0 + 22.0 * hash(aSeed);
  float zBase = -16.0 - mod(aZ0 + uProgress * speed + uTime * 2.0, 58.0);
  pos.z = zBase + aEnd * (aLen * (0.5 + uLight * 1.6));
  /* keep the field out of the mouth — stray streaks read as scratches through the wound */
  float fIn = 1.0 - smoothstep(-26.0, -18.0, pos.z);
  float fOut = smoothstep(-78.0, -72.0, pos.z);
  vA = uLight * (0.05 + 0.18 * hash(aSeed * 3.7)) * fIn * fOut;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const speedlineFrag = /* glsl */ `
uniform vec3 uAmber;
varying float vA;
void main() {
  if (vA < 0.01) discard;
  vec3 bone = vec3(0.93, 0.91, 0.875);
  gl_FragColor = vec4(mix(uAmber, bone, 0.55), vA);
}
`;
