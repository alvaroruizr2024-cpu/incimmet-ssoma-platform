import type { Object3D } from 'three';
import type { Vec3 } from '@/lib/domain/cinematica';
import type { ReferenciaDato } from '@/lib/domain/interactivos3d';

/**
 * Registro compartido entre el canvas y el DOM: los objetos 3D que anclan un dato, los botones que
 * lo representan y la última posición de mundo proyectada. Es un módulo plano para que el canvas
 * escriba por frame sin volver a renderizar React.
 */
const objetos = new Map<string, Object3D>();
const elementos = new Map<string, HTMLElement>();
const posiciones = new Map<string, Vec3>();

export const claveAncla = (r: ReferenciaDato) => `${r.tipo}:${r.clave}:${r.escena}`;
export const claveMomento = (indice: number) => `momento:${indice}`;

export function registrarObjeto(clave: string, objeto: Object3D): () => void {
  objetos.set(clave, objeto);
  return () => {
    if (objetos.get(clave) === objeto) {
      objetos.delete(clave);
      posiciones.delete(clave);
    }
  };
}
export function registrarElemento(clave: string, elemento: HTMLElement | null): void {
  if (elemento) elementos.set(clave, elemento);
  else elementos.delete(clave);
}
export const objetosAncla = () => objetos;
export const elementosAncla = () => elementos;
export function fijarPosicionAncla(clave: string, x: number, y: number, z: number): void {
  const previa = posiciones.get(clave);
  if (previa) {
    previa[0] = x;
    previa[1] = y;
    previa[2] = z;
  } else posiciones.set(clave, [x, y, z]);
}
export function posicionAncla(clave: string): Vec3 | null {
  const p = posiciones.get(clave);
  return p ? [p[0], p[1], p[2]] : null;
}
