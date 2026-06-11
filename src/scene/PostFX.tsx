import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { handles } from './handles';

/* Final grade pass — chromatic aberration (gap-threading only, ≤0.0035), the S1
   pressure-wave shimmer (a single expanding refraction ring as the camera clears
   the peaks), and the reduced-motion ink veil. No whiteouts, no wraps: the ascent
   is one continuous shot and the grade never hides anything. */
const AscentFXShader = {
  name: 'AscentFXShader',
  uniforms: {
    tDiffuse: { value: null },
    uChroma: { value: 0 },
    uShimmer: { value: 0 },
    uVeil: { value: 0 },
    uAspect: { value: 16 / 9 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uChroma;
    uniform float uShimmer;
    uniform float uVeil;
    uniform float uAspect;
    varying vec2 vUv;

    void main() {
      vec2 cc = (vUv - 0.5) * vec2(uAspect, 1.0);
      float d = length(cc);
      /* S1 — pressure wave: one refraction ring expands from center; the envelope
         rises and dies inside the pulse so every scrubbed frame stays poster-clean */
      float env = sin(clamp(uShimmer, 0.0, 1.0) * 3.14159);
      float wr = mix(0.08, 1.25, uShimmer);
      float dd = (d - wr) * 8.0;
      float band = exp(-dd * dd) * env;
      vec2 ripple = (cc / max(d, 1e-4)) * band * 0.0045;
      /* M2 — the faintest chromatic fringe at extreme corners only, always on */
      float corner = smoothstep(0.62, 0.95, d);
      vec2 shift = (vUv - 0.5) * (uChroma + corner * 0.0016 + band * 0.0014);
      float rr = texture2D(tDiffuse, vUv + ripple + shift).r;
      float gg = texture2D(tDiffuse, vUv + ripple).g;
      float bb = texture2D(tDiffuse, vUv + ripple - shift).b;
      vec3 col = vec3(rr, gg, bb);
      /* reduced-motion crossfade — a 250ms dip through ink, never a flash */
      col = mix(col, vec3(0.039, 0.039, 0.047), uVeil);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/* three's own composer: predictable color pipeline (OutputPass handles the sRGB encode).
   @react-three/postprocessing's Bloom crushed the base scene in this stack — see DECISIONS.md. */
export default function PostFX() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const { composer, bloom, grade } = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.4, 0.4, 0.8);
    composer.addPass(bloom);
    const grade = new ShaderPass(AscentFXShader);
    composer.addPass(grade);
    composer.addPass(new OutputPass());
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__composer = composer;
    }
    return { composer, bloom, grade };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
    bloom.resolution.set(size.width, size.height);
    grade.uniforms.uAspect.value = size.width / size.height;
  }, [composer, bloom, grade, gl, size]);

  useEffect(() => () => composer.dispose(), [composer]);

  /* priority 1 — replaces R3F's default render */
  useFrame(() => {
    bloom.strength = handles.bloomIntensity.value;
    grade.uniforms.uChroma.value = handles.chromaOffset.value;
    grade.uniforms.uShimmer.value = handles.shimmer.value;
    grade.uniforms.uVeil.value = handles.veil.value;
    composer.render();
  }, 1);

  return null;
}
