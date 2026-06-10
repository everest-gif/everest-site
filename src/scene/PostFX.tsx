import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { handles } from './handles';

/* Final grade pass — chromatic aberration, amber whiteout, fisheye. All breach-driven, idle at 0. */
const BreachFXShader = {
  name: 'BreachFXShader',
  uniforms: {
    tDiffuse: { value: null },
    uChroma: { value: 0 },
    uWhite: { value: 0 },
    uDistort: { value: 0 },
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
    uniform float uDistort;
    varying vec2 vUv;

    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 uv = 0.5 + c * (1.0 + uDistort * r2);
      vec2 shift = (uv - 0.5) * uChroma;
      float rr = texture2D(tDiffuse, uv + shift).r;
      float gg = texture2D(tDiffuse, uv).g;
      float bb = texture2D(tDiffuse, uv - shift).b;
      vec3 col = vec3(rr, gg, bb);
      col = mix(col, vec3(1.0, 0.84, 0.58), uWhite); /* amber-tinted whiteout, never pure white */
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
    const q = new URLSearchParams(window.location.search);
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.4,
      0.4,
      q.has('bt999') ? 999 : 0.8,
    );
    if (!q.has('nobloom')) composer.addPass(bloom);
    const grade = new ShaderPass(BreachFXShader);
    if (!q.has('nograde')) composer.addPass(grade);
    if (!q.has('noout')) composer.addPass(new OutputPass());
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__composer = composer;
      (window as unknown as Record<string, unknown>).__gl = gl;
      (window as unknown as Record<string, unknown>).__scene = scene;
      (window as unknown as Record<string, unknown>).__camera = camera;
    }
    return { composer, bloom, grade };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
    bloom.resolution.set(size.width, size.height);
  }, [composer, bloom, gl, size]);

  useEffect(() => () => composer.dispose(), [composer]);

  /* priority 1 — replaces R3F's default render */
  useFrame(() => {
    bloom.strength = handles.bloomIntensity.value;
    grade.uniforms.uChroma.value = handles.chromaOffset.value;
    grade.uniforms.uWhite.value = handles.whiteout.value;
    grade.uniforms.uDistort.value = handles.tunnelLight.value * 0.35;
    composer.render();
  }, 1);

  return null;
}
