'use client';
import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Vector3, type Mesh, type PerspectiveCamera, type ShaderMaterial } from 'three';
import { pulsoMarcador, type Vec3 } from '@/lib/domain/cinematica';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment = `
  varying vec2 vUv; uniform vec3 uColor; uniform float uOpacity;
  void main(){
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float anillo = 1.0 - smoothstep(0.0, 0.14, abs(r - 0.66));
    float punto = 1.0 - smoothstep(0.16, 0.26, r);
    float alpha = (anillo * 0.9 + punto) * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }`;
const mundo = new Vector3();

/** Marcador de un dato interactivo: anillo y punto de tamaño constante en pantalla, con pulso lento. */
export function Marcador({
  posicion,
  color = '#62cdff',
  indice = 0,
  nivelRef,
  pixeles = 18,
}: {
  posicion: Vec3;
  color?: string;
  indice?: number;
  nivelRef: RefObject<number>;
  pixeles?: number;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uColor: { value: new Color(color) }, uOpacity: { value: 0 } }),
    [color],
  );
  useFrame(({ camera, clock, size }) => {
    const m = mesh.current;
    if (!m) return;
    m.quaternion.copy(camera.quaternion);
    const pulso = pulsoMarcador(clock.elapsedTime, indice, nivelRef.current);
    // Tamaño constante en pantalla: la escala compensa la distancia y la apertura vertical de la lente.
    const lente = camera as PerspectiveCamera;
    const fov = lente.isPerspectiveCamera ? lente.fov : 60;
    m.getWorldPosition(mundo);
    const distancia = Math.max(0.1, mundo.distanceTo(camera.position));
    const altoMundo = 2 * distancia * Math.tan((fov * Math.PI) / 360);
    m.scale.setScalar(((altoMundo * pixeles) / Math.max(1, size.height)) * pulso.escala);
    if (material.current) material.current.uniforms.uOpacity!.value = pulso.opacidad;
  });
  return (
    <mesh ref={mesh} position={posicion} name="marcador-de-dato" renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </mesh>
  );
}
