import { GLSL_NOISE } from './noise';

/* Core sun (R2.1) — domain-warped churn with visible surface detail, sunspot darkening,
   fresnel rim, heartbeat at 54bpm (0.9Hz). It should reward staring. */
export const coreVert = /* glsl */ `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;

void main() {
  float hb = exp(-fract(uTime * 0.9) * 5.0); /* 54bpm — resting HR of an endurance athlete */
  vec3 pos = position * (1.0 + hb * 0.022);
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  vPos = position;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const coreFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform vec3 uColor;
uniform float uReveal;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;

void main() {
  float hb = exp(-fract(uTime * 0.9) * 5.0);
  float fres = pow(clamp(1.0 - dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 2.1);
  /* domain-warped convection — visible churn, not uniform blur */
  vec2 q = vec2(
    fbm(vPos.xy * 2.2 + vec2(uTime * 0.05, 0.0)),
    fbm(vPos.yz * 2.2 - vec2(uTime * 0.04, 0.0))
  );
  float churn = 0.5 + 0.5 * fbm(vPos.xy * 3.0 + q * 1.5 + vec2(uTime * 0.06, -uTime * 0.05));
  float granule = 0.5 + 0.5 * fbm(vPos.xz * 9.0 + vec2(0.0, uTime * 0.12));
  /* slow drifting sunspots — dark continents on the surface */
  float spots = smoothstep(0.6, 0.8, 0.5 + 0.5 * fbm(vPos.yx * 2.3 - vec2(uTime * 0.02, uTime * 0.013)));
  vec3 col = uColor * (0.2 + 0.78 * churn * churn + 0.16 * granule * granule);
  col *= 1.0 - spots * 0.5;
  col += uColor * fres * (0.85 + 0.3 * hb);
  col *= 0.92 + 0.1 * hb;
  gl_FragColor = vec4(col * uReveal, 1.0);
}
`;

/* Thin corona — an additive halo hugging the limb, breathing with the heartbeat. */
export const coronaVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const coronaFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform vec3 uColor;
uniform float uReveal;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  float hb = exp(-fract(uTime * 0.9) * 5.0);
  float d = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
  /* shell radius 1.30× core: the core limb sits at d≈0.64 — halo brightest there, gone at shell edge */
  float ring = smoothstep(0.05, 0.62, d) * (1.0 - smoothstep(0.62, 0.78, d));
  float flame = 0.75 + 0.25 * snoise(vec2(atan(vNormal.y, vNormal.x) * 3.0, uTime * 0.25));
  float a = ring * flame * (0.33 + 0.1 * hb) * uReveal;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * 1.25, a);
}
`;

/* Pulse traffic (R2.3) — bright heads with short fading trails travelling the threads.
   aHead: 1 = head, descending fractions = trail samples. */
export const pulseTrafficVert = /* glsl */ `
attribute float aAlpha;
attribute float aKind;
attribute float aHead;
varying float vA;
varying float vKind;
varying float vHead;

void main() {
  vA = aAlpha;
  vKind = aKind;
  vHead = aHead;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float size = mix(0.9, 1.6, aHead) * (1.0 + aAlpha * 0.4);
  gl_PointSize = size * (38.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`;

export const pulseTrafficFrag = /* glsl */ `
uniform vec3 uAmber;
uniform vec3 uJade;
varying float vA;
varying float vKind;
varying float vHead;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float disc = 1.0 - smoothstep(0.1, 0.5, length(c));
  float a = vA * disc;
  if (a < 0.01) discard;
  vec3 col = mix(uAmber, uJade, vKind) * (1.3 + vHead * 1.0);
  gl_FragColor = vec4(col, a);
}
`;
