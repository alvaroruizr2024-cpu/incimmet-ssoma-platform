'use client';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { mallaBoveda, pernosBoveda, type Calidad3D, type Tramo } from '@/lib/domain/cinematica';

/** Cada conjunto comparte geometría/material; no hay un draw call por alambre o perno. */
export function SegmentInstances({
  segments,
  radius,
  color,
  name,
}: {
  segments: readonly Tramo[];
  radius: number;
  color: string;
  name: string;
}) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const temp = new Object3D(),
      from = new Vector3(),
      to = new Vector3(),
      direction = new Vector3(),
      up = new Vector3(0, 1, 0);
    segments.forEach((segment, i) => {
      from.set(...segment.desde);
      to.set(...segment.hasta);
      direction.subVectors(to, from);
      temp.position.copy(from).add(to).multiplyScalar(0.5);
      temp.scale.set(1, direction.length(), 1);
      temp.quaternion.setFromUnitVectors(up, direction.normalize());
      temp.updateMatrix();
      target.setMatrixAt(i, temp.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
    target.computeBoundingSphere();
  }, [segments]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, segments.length]} name={name}>
      <cylinderGeometry args={[radius, radius, 1, 5]} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.55} />
    </instancedMesh>
  );
}
function BoltPlates({ bolts }: { bolts: readonly Tramo[] }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const temp = new Object3D(),
      normal = new Vector3(),
      up = new Vector3(0, 1, 0);
    bolts.forEach((bolt, i) => {
      temp.position.set(...bolt.desde);
      normal
        .set(
          bolt.hasta[0] - bolt.desde[0],
          bolt.hasta[1] - bolt.desde[1],
          bolt.hasta[2] - bolt.desde[2],
        )
        .normalize();
      temp.quaternion.setFromUnitVectors(up, normal);
      temp.updateMatrix();
      target.setMatrixAt(i, temp.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
    target.computeBoundingSphere();
  }, [bolts]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, bolts.length]} name="placas-de-pernos">
      <boxGeometry args={[0.19, 0.025, 0.19]} />
      <meshStandardMaterial color="#8895a1" roughness={0.55} metalness={0.7} />
    </instancedMesh>
  );
}
export function InstancedSupport({ quality }: { quality: Calidad3D }) {
  const mesh = useMemo(() => mallaBoveda(quality), [quality]);
  const bolts = useMemo(() => pernosBoveda(), []);
  return (
    <group name="sostenimiento-procedural">
      <SegmentInstances
        segments={mesh}
        radius={0.009}
        color="#78878e"
        name="malla-electrosoldada-instanciada"
      />
      <SegmentInstances
        segments={bolts}
        radius={0.027}
        color="#a1aab2"
        name="pernos-instanciados"
      />
      <BoltPlates bolts={bolts} />
    </group>
  );
}
