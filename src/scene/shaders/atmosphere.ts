import { GLSL_NOISE } from './noise';

/* Drifting fog sheets between terrain layers — big quads, cheap fbm alpha. */
export const fogVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fogFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
uniform float uDrift;
uniform vec3 uTint; /* M3 — season temperature lives in the haze */
varying vec2 vUv;

void main() {
  vec2 p = vUv * vec2(3.4, 1.3) + vec2(uTime * uDrift, uSeed * 11.0);
  float n = fbm(p) * 0.5 + 0.5;
  float body = smoothstep(0.42, 0.86, n);
  /* fade the quad edges so sheets never read as rectangles */
  float mask = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x))
             * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  float a = body * mask * uOpacity;
  vec3 col = mix(vec3(0.055, 0.055, 0.062), uTint, body * 0.45);
  gl_FragColor = vec4(col, a);
}
`;

/* M3 — faint horizon glow: spring pre-dawn / autumn warm haze / winter cold cast.
   A wide quad behind the back ridge; vertical falloff only, value-shift restraint. */
export const skyVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const skyFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  float horizon = 1.0 - smoothstep(0.0, 0.62, vUv.y);
  float sideMask = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
  float a = horizon * horizon * sideMask * uIntensity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* Sparse starfield with sub-pixel twinkle.
   M3: uSharp (winter) calms the twinkle and brightens; uHorizon (spring pre-dawn)
   dims stars near the skyline. */
export const starVert = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSharp;
uniform float uHorizon;
uniform float uFade; /* S1 — star fields hand off mid-climb: threshold out, cosmos in */
varying float vA;

float hash(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  float amp = mix(0.45, 0.14, uSharp);
  float tw = (1.0 - amp) + amp * sin(uTime * (0.4 + hash(aSeed) * 1.6) + aSeed * 17.0);
  vA = tw * (0.35 + 0.65 * hash(aSeed * 3.3)) * mix(1.0, 1.4, uSharp) * uFade;
  vA *= 1.0 - uHorizon * (1.0 - smoothstep(6.0, 28.0, position.y)) * 0.75;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (1.0 + 1.4 * hash(aSeed * 9.1) * tw) * (1.0 + 0.45 * uSharp);
  gl_Position = projectionMatrix * mv;
}
`;

export const starFrag = /* glsl */ `
uniform vec3 uColor;
varying float vA;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float disc = 1.0 - smoothstep(0.1, 0.5, length(c));
  float a = vA * disc;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`;
