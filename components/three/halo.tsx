'use client';
import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, ShaderMaterial } from 'three';
import type { Vec3 } from '@/lib/domain/cinematica';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment = `
  varying vec2 vUv; uniform vec3 uColor; uniform float uOpacity;
  void main(){
    vec2 p = vUv * 2.0 - 1.0;
    vec2 q = abs(p) - vec2(0.74);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.16;
    float contorno = 1.0 - smoothstep(0.0, 0.045, abs(sd));
    float dentro = 1.0 - step(0.0, sd);
    float relleno = dentro * (0.05 + 0.09 * smoothstep(-0.6, 0.0, sd));
    float halo = (1.0 - dentro) * (1.0 - smoothstep(0.0, 0.3, sd)) * 0.2;
    float alpha = (contorno * 0.85 + relleno + halo) * uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }`;

/** Realce sobrio de una instalación: contorno fino y luz suave, sin destellos; el padre anima el nivel 0–1. */
export function Halo({
  ancho,
  alto,
  posicion,
  color = '#62cdff',
  nivel,
}: {
  ancho: number;
  alto: number;
  posicion: Vec3;
  color?: string;
  nivel: RefObject<number>;
}) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uColor: { value: new Color(color) }, uOpacity: { value: 0 } }),
    [color],
  );
  useFrame(() => {
    const m = material.current;
    if (m?.uniforms.uOpacity && m.uniforms.uOpacity.value !== nivel.current)
      m.uniforms.uOpacity.value = nivel.current;
  });
  return (
    <mesh position={posicion} name="realce-de-dato">
      <planeGeometry args={[ancho, alto]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        side={DoubleSide}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </mesh>
  );
}
