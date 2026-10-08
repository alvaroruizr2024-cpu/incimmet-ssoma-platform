'use client';
import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { DoubleSide, NoColorSpace } from 'three';
import { GALERIA, perfilCalidad, type Calidad3D, type Tramo } from '@/lib/domain/cinematica';
import { crearBoveda, crearRugosidad } from './geometry';
import { InstancedSupport, SegmentInstances } from './instanced-support';

export function TunnelGeometry({ quality }: { quality: Calidad3D }) {
  const segments = perfilCalidad(quality).segmentosBoveda;
  const vault = useMemo(() => crearBoveda(segments), [segments]);
  const { gl } = useThree();
  const rock = useMemo(() => crearRugosidad(gl.capabilities.getMaxAnisotropy()), [gl]);
  const relief = useMemo(() => {
    const t = rock.clone();
    t.colorSpace = NoColorSpace;
    return t;
  }, [rock]);
  useEffect(() => () => relief.dispose(), [relief]);
  useEffect(() => () => vault.dispose(), [vault]);
  useEffect(() => () => rock.dispose(), [rock]);
  const cables = useMemo<Tramo[]>(
    () =>
      [2.1, 2.3, 2.5].flatMap((y) =>
        Array.from({ length: 34 }, (_, i) => ({
          desde: [3.62, y + Math.sin(i * 0.8) * 0.04, 8 - i * 3] as [number, number, number],
          hasta: [3.62, y + Math.sin((i + 1) * 0.8) * 0.04, 5 - i * 3] as [number, number, number],
        })),
      ),
    [],
  );
  const hangers = useMemo<Tramo[]>(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        desde: [3.75, 2.05, 7 - i * 3],
        hasta: [3.43, 2.05, 7 - i * 3],
      })),
    [],
  );
  const fixtures = useMemo(() => Array.from({ length: 17 }, (_, i) => -i * 6), []);
  return (
    <group name="galeria-minera">
      <mesh geometry={vault} name="boveda-roca">
        <meshStandardMaterial
          color="#879095"
          side={DoubleSide}
          roughness={0.94}
          metalness={0.04}
          map={rock}
          bumpMap={relief}
          roughnessMap={relief}
          bumpScale={0.035}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, -43]} name="piso">
        <planeGeometry args={[GALERIA.radio * 2, 102, 1, 1]} />
        <meshStandardMaterial
          color="#414b54"
          roughness={0.92}
          metalness={0.06}
          bumpMap={relief}
          roughnessMap={relief}
          bumpScale={0.045}
        />
      </mesh>
      <InstancedSupport quality={quality} />
      {[0.58, 0.99].map((height) => (
        <mesh
          key={height}
          rotation={[Math.PI / 2, 0, 0]}
          position={[-3.48, height, -43]}
          name="tuberia-HDPE"
        >
          <cylinderGeometry args={[0.14, 0.14, 102, 12]} />
          <meshStandardMaterial color="#202b36" roughness={0.58} metalness={0.03} />
        </mesh>
      ))}
      <SegmentInstances segments={cables} radius={0.025} color="#252a30" name="cables-protegidos" />
      <SegmentInstances segments={hangers} radius={0.022} color="#84929e" name="soportes-cable" />
      {fixtures.map((z) => (
        <group key={z} position={[2.7, 4.04, z]} rotation={[0, 0, -0.38]} name="lampara-minera">
          <mesh>
            <boxGeometry args={[0.75, 0.13, 0.26]} />
            <meshStandardMaterial color="#354351" metalness={0.65} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.075, 0]}>
            <boxGeometry args={[0.58, 0.025, 0.18]} />
            <meshStandardMaterial
              color="#dcefff"
              emissive="#c6e2f4"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      <group position={[-2.55, 0.78, -38]} name="casco-lampara-sin-persona">
        <mesh>
          <sphereGeometry args={[0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d3c3a3" roughness={0.7} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.025, 22]} />
          <meshStandardMaterial color="#d3c3a3" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.09, -0.19]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color="#e1f1ff" emissive="#c8e6ff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.6, 0.72, 0.55]} />
          <meshStandardMaterial color="#354250" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
