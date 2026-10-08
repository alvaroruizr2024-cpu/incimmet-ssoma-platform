'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
/** Bloom solo en calidad alta. Umbral HDR selecciona luminarias y emisivos, no toda la roca. */
export default function HighBloom() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  useEffect(() => {
    const pipeline = new EffectComposer(gl);
    const bloom = new UnrealBloomPass(new Vector2(size.width, size.height), 0.36, 0.32, 1.4);
    const output = new OutputPass();
    pipeline.addPass(new RenderPass(scene, camera));
    pipeline.addPass(bloom);
    pipeline.addPass(output);
    pipeline.setPixelRatio(Math.min(gl.getPixelRatio(), 1.5));
    pipeline.setSize(size.width, size.height);
    composer.current = pipeline;
    return () => {
      composer.current = null;
      bloom.dispose();
      output.dispose();
      pipeline.dispose();
    };
  }, [gl, scene, camera, size.width, size.height]);
  useFrame(() => {
    if (composer.current) composer.current.render();
    else gl.render(scene, camera);
  }, 1);
  return null;
}
