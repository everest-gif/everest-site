import * as THREE from 'three';

/* S6 — shared chamber-hero atmosphere: a back-side fresnel shell that exists only
   while uHero > 0. Built at factory time so the boot precompiler owns the shader
   compile (a mid-flight compile would hitch the dolly); HubWorld's heroK drives
   visibility, so the hub pays zero draw calls for it. */

const atmoVert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const atmoFrag = /* glsl */ `
precision highp float;
uniform vec3 uTint;
uniform float uHero;
uniform float uIntensity;
varying vec3 vN;
varying vec3 vV;
void main() {
  /* back-side shell: the limb is where the normal grazes the view ray */
  float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  float limb = 1.0 - ndv;
  float band = limb * limb * limb;
  float a = band * 0.55 * uIntensity * uHero;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uTint, a);
}
`;

export interface HeroAtmosphere {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  dispose: () => void;
}

export function makeAtmosphere(radius: number, tint: string, intensity = 1): HeroAtmosphere {
  const geo = new THREE.SphereGeometry(radius * 1.075, 48, 32);
  const mat = new THREE.ShaderMaterial({
    vertexShader: atmoVert,
    fragmentShader: atmoFrag,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTint: { value: new THREE.Color(tint) },
      uHero: { value: 0 },
      uIntensity: { value: intensity },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  return {
    mesh,
    mat,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

/* standard hero gate: show the LOD layer only while the ease is alive */
export function gateHero(objects: THREE.Object3D[], mats: THREE.ShaderMaterial[], hero: number): void {
  const on = hero > 0.012;
  for (const o of objects) o.visible = on;
  if (!on) return;
  for (const m of mats) {
    const u = m.uniforms.uHero;
    if (u) u.value = hero;
  }
}
