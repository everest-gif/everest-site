import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { handles } from './handles';

/* Final grade pass — chromatic aberration (seam-entry/arrival only, ≤0.0035) and the
   amber light-wrap with a radial extent so arrival visibly CONTRACTS into the hub core.
   The R1 fisheye/DoF smear is gone: sharpness is the luxury. */
const BreachFXShader = {
  name: 'BreachFXShader',
  uniforms: {
    tDiffuse: { value: null },
    uChroma: { value: 0 },
    uWhite: { value: 0 },
    uWrapR: { value: 1.1 },
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
    uniform float uWhite;
    uniform float uWrapR;
    uniform float uAspect;
    varying vec2 vUv;

    void main() {
      /* M2 — the faintest chromatic fringe at extreme corners only, always on */
      vec2 cc = (vUv - 0.5) * vec2(uAspect, 1.0);
      float corner = smoothstep(0.62, 0.95, length(cc));
      vec2 shift = (vUv - 0.5) * (uChroma + corner * 0.0016);
      float rr = texture2D(tDiffuse, vUv + shift).r;
      float gg = texture2D(tDiffuse, vUv).g;
      float bb = texture2D(tDiffuse, vUv - shift).b;
      vec3 col = vec3(rr, gg, bb);
      /* radial light-wrap: uWrapR 1.1 floods the frame; →0 contracts into screen center */
      float d = length((vUv - 0.5) * vec2(uAspect, 1.0));
      float wrap = 1.0 - smoothstep(uWrapR - 0.22, uWrapR + 0.02, d);
      col = mix(col, vec3(1.0, 0.82, 0.52), uWhite * wrap); /* amber, never pure white */
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
    const grade = new ShaderPass(BreachFXShader);
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
    grade.uniforms.uWhite.value = handles.whiteout.value;
    grade.uniforms.uWrapR.value = handles.wrapRadius.value;
    composer.render();
  }, 1);

  return null;
}
