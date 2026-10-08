'use client';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  PointsMaterial,
  ShaderMaterial,
} from 'three';
import { aleatorioSemilla, perfilCalidad, type Calidad3D } from '@/lib/domain/cinematica';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment = `
  varying vec2 vUv; uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p), f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
  void main(){
    vec2 uv=vUv; float edge=smoothstep(0.0,0.18,uv.x)*(1.0-smoothstep(0.82,1.0,uv.x))*smoothstep(0.0,0.22,uv.y)*(1.0-smoothstep(0.75,1.0,uv.y));
    float density=noise(uv*4.0+vec2(uTime*0.018,0.0))*0.65+noise(uv*9.0-vec2(0.0,uTime*0.012))*0.35;
    gl_FragColor=vec4(uColor,density*edge*uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** Niebla local por capas volumétricas: sin raymarching ni postprocesado de pantalla completa. */

function MistLayer({
  z,
  opacity,
  moving,
  velocidadRef,
}: {
  z: number;
  opacity: number;
  moving: boolean;
  velocidadRef: RefObject<number>;
}) {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uColor: { value: new Color('#9cb6ce') },
    }),
    [opacity],
  );
  useFrame((_state, delta) => {
    const m = matRef.current;
    // La niebla fluye más deprisa cuanto más rápido avanza el recorrido.
    if (moving && m?.uniforms.uTime)
      m.uniforms.uTime.value += Math.min(delta, 0.05) * (1 + velocidadRef.current * 3);
  });
  return (
    <mesh position={[0, 2.6, z]}>
      <planeGeometry args={[7.4, 4.7]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </mesh>
  );
}
function Mist({
  layers,
  moving,
  velocidadRef,
}: {
  layers: number;
  moving: boolean;
  velocidadRef: RefObject<number>;
}) {
  return (
    <group name="niebla-volumetrica-por-capas">
      {Array.from({ length: layers }, (_, i) => (
        <MistLayer
          key={i}
          z={-10 - i * 12}
          opacity={0.035 + i * 0.006}
          moving={moving}
          velocidadRef={velocidadRef}
        />
      ))}
    </group>
  );
}
function Dust({
  count,
  moving,
  velocidadRef,
}: {
  count: number;
  moving: boolean;
  velocidadRef: RefObject<number>;
}) {
  const group = useRef<Group>(null);
  const material = useRef<PointsMaterial>(null);
  const time = useRef(0);
  const geometry = useMemo(() => {
    const random = aleatorioSemilla(1820),
      positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++)
      positions.set([(random() - 0.5) * 6.5, 0.5 + random() * 4, 7 - random() * 101], i * 3);
    const buffer = new BufferGeometry();
    buffer.setAttribute('position', new BufferAttribute(positions, 3));
    buffer.computeBoundingSphere();
    return buffer;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_state, delta) => {
    if (!moving || !group.current) return;
    time.current += Math.min(delta, 0.05);
    group.current.position.y = Math.sin(time.current * 0.15) * 0.09;
    group.current.position.x = Math.sin(time.current * 0.1) * 0.06;
    // Las motas se alargan y aclaran con la velocidadRef: sensación de avance sin estelas costosas.
    const v = velocidadRef.current,
      m = material.current;
    if (m) {
      m.size = 0.035 + v * 0.07;
      m.opacity = 0.4 + v * 0.3;
    }
  });
  return (
    <group ref={group} name="polvo-en-suspension">
      <points geometry={geometry}>
        <pointsMaterial
          ref={material}
          color="#bbccdb"
          size={0.035}
          transparent
          opacity={0.4}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
export function Atmosphere({
  quality,
  moving,
  velocidadRef,
}: {
  quality: Calidad3D;
  moving: boolean;
  velocidadRef: RefObject<number>;
}) {
  const profile = perfilCalidad(quality);
  return (
    <>
      {profile.capasNiebla > 0 && (
        <Mist layers={profile.capasNiebla} moving={moving} velocidadRef={velocidadRef} />
      )}
      {profile.polvo > 0 && (
        <Dust count={profile.polvo} moving={moving} velocidadRef={velocidadRef} />
      )}
    </>
  );
}
