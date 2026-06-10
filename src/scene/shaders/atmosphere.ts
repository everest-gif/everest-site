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
varying vec2 vUv;

void main() {
  vec2 p = vUv * vec2(3.4, 1.3) + vec2(uTime * uDrift, uSeed * 11.0);
  float n = fbm(p) * 0.5 + 0.5;
  float body = smoothstep(0.42, 0.86, n);
  /* fade the quad edges so sheets never read as rectangles */
  float mask = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x))
             * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  float a = body * mask * uOpacity;
  vec3 col = mix(vec3(0.055, 0.055, 0.062), vec3(0.91, 0.63, 0.24) * 0.38, body * 0.45);
  gl_FragColor = vec4(col, a);
}
`;

/* Sparse starfield with sub-pixel twinkle. */
export const starVert = /* glsl */ `
attribute float aSeed;
uniform float uTime;
varying float vA;

float hash(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  float tw = 0.55 + 0.45 * sin(uTime * (0.4 + hash(aSeed) * 1.6) + aSeed * 17.0);
  vA = tw * (0.35 + 0.65 * hash(aSeed * 3.3));
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 1.0 + 1.4 * hash(aSeed * 9.1) * tw;
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
