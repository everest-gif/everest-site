import { GLSL_NOISE } from './noise';

/* Wormhole interior — flowing longitudinal streaks (amber + jade), polar noise rush,
   faint hexagonal lattice ghosting in the walls. Mapped on an open cylinder, BackSide. */
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
uniform float uProgress; /* transit 0..1 — scrolls the texture field past the camera */
uniform float uLight;    /* energy 0..1 */
uniform vec3 uAmber;
uniform vec3 uJade;
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
  float z = vUv.y * 9.0 - uProgress * 16.0 - uTime * 0.18;

  /* longitudinal light streaks — two scales, racing past */
  float s1 = smoothstep(0.58, 0.96, snoise(vec2(angle * 22.0, z * 0.55)));
  float s2 = smoothstep(0.5, 0.95, snoise(vec2(angle * 9.0 + 7.0, z * 0.32)));
  float sJade = smoothstep(0.6, 0.97, snoise(vec2(angle * 14.0 - 3.0, z * 0.45 + 11.0)));

  /* polar-coordinate noise rushing past */
  float rush = 0.5 + 0.5 * fbm(vec2(angle * 6.2831853, z * 1.3));

  /* faint hex lattice in the walls, drifting */
  float hex = hexGhost(vec2(angle * 64.0, vUv.y * 128.0 + uProgress * 64.0));

  vec3 col = uAmber * (s1 * 1.5 + s2 * 0.8);
  col += uJade * sJade * 1.1;
  col += uAmber * 0.18 * rush;
  col += mix(uAmber, uJade, 0.5) * hex * 0.05;

  /* darkness ahead — the far end converges to a point of light at arrival */
  float depthGlow = smoothstep(0.15, 0.85, vUv.y);
  col *= uLight * (0.25 + 0.75 * depthGlow);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* Speed-lines — line segments racing past the camera, wrapped along the tunnel. */
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
  vec3 pos = position; /* x,y on ring; z unused */
  float speed = 36.0 + 22.0 * hash(aSeed);
  float zBase = mod(aZ0 + uProgress * speed + uTime * 2.0, 58.0) - 53.0;
  pos.z = zBase + aEnd * (aLen * (0.6 + uLight * 1.8));
  vA = uLight * (0.3 + 0.7 * hash(aSeed * 3.7));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const speedlineFrag = /* glsl */ `
uniform vec3 uAmber;
uniform vec3 uJade;
varying float vA;
void main() {
  if (vA < 0.02) discard;
  gl_FragColor = vec4(mix(uAmber, uJade, 0.35), vA);
}
`;
