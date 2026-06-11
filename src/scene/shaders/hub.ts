import { GLSL_NOISE } from './noise';

/* Core orb — fresnel rim, internal noise churn, heartbeat at 54bpm (0.9Hz). */
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
  /* slow internal churn — sampled on two axes for pseudo-3D flow */
  float churn = 0.5 + 0.5 * fbm(vPos.xy * 2.6 + vec2(uTime * 0.05, -uTime * 0.04));
  churn *= 0.6 + 0.4 * (0.5 + 0.5 * fbm(vPos.yz * 3.1 - vec2(uTime * 0.03, 0.0)));
  vec3 col = uColor * (0.16 + 0.5 * churn * churn);
  col += uColor * fres * (1.05 + 0.35 * hb);
  col *= 0.9 + 0.12 * hb;
  gl_FragColor = vec4(col * uReveal, 1.0);
}
`;

/* Node orbs — small glowing spheres with fresnel, hover-brightened, dimmable. */
export const nodeVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const nodeFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uActive; /* 1 when hovered/focused */
uniform float uDim;    /* 0.4 when another node is hovered */
uniform float uReveal;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  float fres = pow(clamp(1.0 - dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 1.8);
  float body = 0.5 + 0.5 * fres;
  vec3 col = uColor * body * (0.85 + uActive * 1.1);
  col *= mix(1.0, 0.4, uDim);
  gl_FragColor = vec4(col * uReveal, 1.0);
}
`;

/* Pulse traffic — points travelling core↔node. aKind: 0 = instruction (amber), 1 = report (jade). */
export const pulseTrafficVert = /* glsl */ `
attribute float aAlpha;
attribute float aKind;
varying float vA;
varying float vKind;

void main() {
  vA = aAlpha;
  vKind = aKind;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (1.7 + aAlpha * 1.3) * (38.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`;

export const pulseTrafficFrag = /* glsl */ `
uniform vec3 uAmber;
uniform vec3 uJade;
varying float vA;
varying float vKind;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float disc = 1.0 - smoothstep(0.12, 0.5, length(c));
  float a = vA * disc;
  if (a < 0.01) discard;
  gl_FragColor = vec4(mix(uAmber, uJade, vKind) * 1.6, a);
}
`;
