'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Object3D } from 'three';
import {
  ESCENAS,
  MAX_ANCLAS,
  anclasVisibles,
  distribuirAnclas,
  type AnclaProyectada,
  type CajaAncla,
  type CajaOcupada,
} from '@/lib/domain/cinematica';
import { elementosAncla, fijarPosicionAncla, objetosAncla } from './anclas';

const mundo = new Vector3();
const TAMANO_ESTIMADO: readonly [number, number] = [150, 36];
function visibleEnArbol(objeto: Object3D): boolean {
  let actual: Object3D | null = objeto;
  while (actual) {
    if (!actual.visible) return false;
    actual = actual.parent;
  }
  return true;
}
/**
 * Proyecta por frame las instalaciones ancladas a pantalla y coloca sus botones DOM sin solaparlos.
 * Solo se mueven los elementos registrados por la capa DOM (la escena activa) y nunca pasa por React.
 */
export function AnclasProyectadas({ escena }: { escena: number }) {
  const visibles = useRef(new Set<string>());
  const texto = useRef<{ frame: number; escena: number; cajas: CajaOcupada[] }>({
    frame: 0,
    escena: -1,
    cajas: [],
  });
  const colocadas = useRef(new Map<string, string>());
  const opciones = useRef(new Map<string, number>());
  const tamanos = useRef(new Map<string, [number, number]>());
  useFrame(({ camera, size }) => {
    const elementos = elementosAncla();
    if (!elementos.size && !visibles.current.size) return;
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const proyectadas: AnclaProyectada[] = [];
    for (const [clave, objeto] of objetosAncla()) {
      if (!elementos.has(clave) || !visibleEnArbol(objeto)) continue;
      objeto.updateWorldMatrix(true, false);
      mundo.setFromMatrixPosition(objeto.matrixWorld);
      fijarPosicionAncla(clave, mundo.x, mundo.y, mundo.z);
      mundo.project(camera);
      proyectadas.push({
        clave,
        x: (mundo.x + 1) / 2,
        y: (1 - mundo.y) / 2,
        profundidad: mundo.z,
        delante: mundo.z > -1 && mundo.z < 1,
      });
    }
    const cajas: CajaAncla[] = anclasVisibles(proyectadas, size.width <= 900 ? 5 : MAX_ANCLAS).map(
      (a) => {
        const [ancho, alto] = tamanos.current.get(a.clave) ?? TAMANO_ESTIMADO;
        return {
          clave: a.clave,
          x: a.x * size.width,
          y: a.y * size.height,
          ancho,
          alto,
          preferida: opciones.current.get(a.clave),
        };
      },
    );
    // El bloque de texto de la escena activa queda reservado: los rótulos no tapan la lectura.
    const t = texto.current;
    t.frame += 1;
    if (t.escena !== escena || t.frame % 20 === 0) {
      t.escena = escena;
      const id = ESCENAS[escena]?.id;
      const bloque = id ? document.getElementById(id)?.querySelector('.intro-scene-content') : null;
      const r = bloque?.getBoundingClientRect();
      t.cajas =
        r && r.width > 0 && r.bottom > 0 && r.top < size.height
          ? [{ x: r.left, y: r.top, ancho: r.width, alto: r.height }]
          : [];
    }
    const reparto = distribuirAnclas(cajas, size.width, size.height, 6, t.cajas);
    const ahora = new Set<string>();
    for (const [clave, sitio] of reparto) {
      const el = elementos.get(clave);
      if (!el) continue;
      ahora.add(clave);
      opciones.current.set(clave, sitio.opcion);
      // Píxeles enteros y escritura solo al cambiar: sin temblor subpíxel ni trabajo de estilo por frame.
      const transform = `translate3d(${Math.round(sitio.x)}px, ${Math.round(sitio.y)}px, 0)`;
      if (colocadas.current.get(clave) !== transform) {
        colocadas.current.set(clave, transform);
        el.style.transform = transform;
      }
      if (el.dataset.visible !== 'yes') el.dataset.visible = 'yes';
      else if (!tamanos.current.has(clave)) {
        // Ya pintado: se mide una sola vez el tamaño real del rótulo para el reparto siguiente.
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) tamanos.current.set(clave, [r.width, r.height]);
      }
    }
    for (const clave of visibles.current) {
      if (ahora.has(clave)) continue;
      const el = elementos.get(clave);
      if (el) el.dataset.visible = 'no';
    }
    visibles.current = ahora;
  });
  return null;
}
