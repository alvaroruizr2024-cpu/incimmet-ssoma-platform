import { ruidoRoca } from '@/lib/domain/roca';
import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  RGBAFormat,
  RepeatWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
} from 'three';
import { GALERIA, puntoBoveda, type Vec3 } from '@/lib/domain/cinematica';

/** Bóveda extruida con paredes verticales, relieve determinista y normales calculadas. */
export function crearBoveda(segmentos: number) {
  const geometry = new BufferGeometry();
  const cross: Vec3[] = [[GALERIA.radio, 0, 0]];
  for (let i = 0; i <= segmentos; i++) cross.push(puntoBoveda((i / segmentos) * Math.PI, 0));
  cross.push([-GALERIA.radio, 0, 0]);
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const rings = 48;
  for (let j = 0; j <= rings; j++) {
    const z = GALERIA.inicioZ + ((GALERIA.finZ - GALERIA.inicioZ) * j) / rings;
    cross.forEach(([x, y], i) => {
      const grain = Math.sin(i * 17.4 + j * 7.7) * Math.cos(i * 4.2 - j * 2.6) * 0.065;
      positions.push(x + Math.sign(x) * grain, y > 0 ? y + grain : y, z);
      uv.push(i / (cross.length - 1), j / rings);
    });
  }
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < cross.length - 1; i++) {
      const a = j * cross.length + i,
        b = a + cross.length;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
export function crearRugosidad(anisotropy = 1) {
  const size = 256,
    noise = ruidoRoca(size),
    bytes = new Uint8Array(size * size * 4);
  for (let i = 0; i < noise.length; i++) {
    const value = noise[i] ?? 200;
    bytes.set([value, value, value, 255], i * 4);
  }
  const texture = new DataTexture(bytes, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 12);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = anisotropy;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
