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
  float ndv = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
  /* M5 — slow domain-warped plasma flow: molten, not clay */
  vec2 q = vec2(
    fbm(vPos.xy * 2.2 + vec2(uTime * 0.035, 0.0)),
    fbm(vPos.yz * 2.2 - vec2(uTime * 0.028, 0.0))
  );
  float churn = 0.5 + 0.5 * fbm(vPos.xy * 3.0 + q * 1.7 + vec2(uTime * 0.04, -uTime * 0.034));
  float granule = 0.5 + 0.5 * fbm(vPos.xz * 9.0 + q * 0.8 + vec2(0.0, uTime * 0.08));
  /* slow drifting sunspots — dark continents on the surface */
  float spots = smoothstep(0.6, 0.8, 0.5 + 0.5 * fbm(vPos.yx * 2.3 - vec2(uTime * 0.014, uTime * 0.009)));
  /* hotter core-to-edge ramp + physical limb darkening (M5) — molten, not clay */
  vec3 hot = vec3(1.0, 0.82, 0.5); /* furnace center, firmly amber family */
  vec3 base = mix(uColor * 0.95, hot, pow(ndv, 1.5) * 0.8);
  vec3 col = base * (0.52 + 0.58 * churn * churn + 0.16 * granule * granule);
  col *= 1.0 - spots * 0.42;
  col *= mix(0.5, 1.0, ndv); /* limb darkening */
  col *= 0.94 + 0.09 * hb;
  gl_FragColor = vec4(col * uReveal, 1.0);
}
`;

/* M5 — corona rebuilt as a camera-facing billboard with a pure radial falloff:
   zero geometry banding/scalloping. Interleaved gradient noise dithers the
   8-bit gradient; fbm flames modulate the outer halo. */
export const coronaVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const coronaFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform vec3 uColor;
uniform float uReveal;
varying vec2 vUv;

void main() {
  vec2 c = (vUv - 0.5) * 2.0; /* plane spans ±1; core disc radius = uCoreR in plane units */
  float r = length(c);
  float coreR = 0.40; /* core sphere edge in billboard units (plane 2.5R wide → 1/2.5) */
  float hb = exp(-fract(uTime * 0.9) * 5.0);
  float ang = atan(c.y, c.x);
  /* smooth exponential falloff from the limb outward — no rings, no shells */
  float halo = exp(-(r - coreR) * 7.5);
  /* flame structure: slow fbm lobes riding the angle, fading with radius */
  float flame = 0.72 + 0.28 * fbm(vec2(ang * 2.2, r * 3.0 - uTime * 0.12));
  float a = halo * flame * (0.5 + 0.14 * hb);
  a *= smoothstep(coreR - 0.06, coreR + 0.02, r); /* nothing inside the disc */
  a *= 1.0 - smoothstep(0.78, 1.0, r); /* die before the plane edge */
  /* interleaved-gradient dither kills 8-bit banding in the long falloff */
  float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  a += (dither - 0.5) * 0.012;
  a = max(a, 0.0) * uReveal;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor * 1.2, a);
}
`;

/* M5 — sunward rim light: an additive shell that brightens the limb facing the
   core. sunDir is the world-space direction from the planet toward the sun. */
export const rimVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const rimFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uSunDir;
uniform float uReveal;
uniform float uBoost;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNormal);
  float fres = pow(clamp(1.0 - abs(dot(n, normalize(vView))), 0.0, 1.0), 2.6);
  float sun = clamp(dot(n, normalize(uSunDir)), 0.0, 1.0);
  float a = fres * (0.12 + sun * 0.5) * uReveal * (1.0 + uBoost * 0.5);
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* M5 — ultra-subtle FBM nebula behind the system: amber-to-jade, ≤6% opacity,
   slow drift. The system floats somewhere, not in void. */
export const nebulaVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const nebulaFrag = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform vec3 uAmber;
uniform vec3 uJade;
uniform float uReveal;
varying vec2 vUv;

void main() {
  vec2 p = (vUv - 0.5) * 5.0;
  vec2 q = vec2(fbm(p * 0.55 + vec2(uTime * 0.004, 0.0)), fbm(p * 0.55 - vec2(0.0, uTime * 0.003)));
  float n = fbm(p * 0.8 + q * 1.6);
  /* only the densest wisps surface — texture, not a backdrop painting */
  float body = smoothstep(0.34, 0.95, n);
  /* hue split lives INSIDE the WebGL scene (sanctioned): amber lobes one side, jade the other —
     desaturated hard toward ink so it reads as deep space dust, never soup */
  float mixK = clamp(0.5 + 0.5 * fbm(p * 0.4 + 3.7), 0.0, 1.0);
  vec3 col = mix(uAmber, uJade, mixK) * 0.5 + vec3(0.05);
  float edge = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x))
             * smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
  float a = body * edge * 0.03 * uReveal;
  if (a < 0.002) discard;
  gl_FragColor = vec4(col, a);
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
  /* M5 — 3px comet head, slimmer fading tail */
  float size = mix(0.8, 2.5, aHead) * (1.0 + aAlpha * 0.3);
  gl_PointSize = size * (40.0 / max(1.0, -mv.z));
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
