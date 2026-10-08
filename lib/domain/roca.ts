/** Ruido de valor periódico y reproducible, con interpolación suave entre celdas. */
export function ruidoRoca(size = 256): Uint8Array {
  const result = new Uint8Array(size * size);
  const hash = (x: number, y: number) => {
    let n = Math.imul(x + 1407, 374761393) ^ Math.imul(y + 871, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let total = 0,
        weight = 0;
      for (let o = 0; o < 5; o++) {
        const period = 4 << o,
          a = 1 / (1 << o);
        const u = (x / size) * period,
          v = (y / size) * period;
        const ix = Math.floor(u),
          iy = Math.floor(v);
        const h = (dx: number, dy: number) => hash((ix + dx) % period, (iy + dy) % period);
        total +=
          mix(
            mix(h(0, 0), h(1, 0), smooth(u - ix)),
            mix(h(0, 1), h(1, 1), smooth(u - ix)),
            smooth(v - iy),
          ) * a;
        weight += a;
      }
      result[y * size + x] = Math.round(180 + (total / weight) * 52);
    }
  return result;
}
