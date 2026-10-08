import { describe, expect, it } from 'vitest';
import { opcionesGrafico } from '@/lib/analytics/echarts-options';
import { modeloConteo, modeloProyectos, modeloTendencia } from '@/lib/analytics/modelos';
import { ruidoRoca } from '@/lib/domain/roca';
import { base } from './fixtures';
describe('Correcciones finales de gráficos', () => {
  it('proyectos ordenados y con nombre completo, sin perder el filtro CL', () => {
    const m = modeloProyectos(base.eventos, base.proyectos);
    expect(m.horizontal).toBe(true);
    expect(m.puntos[0]?.etiqueta).toBe('Cerro Lindo');
    expect(m.puntos[0]?.filtros?.proyectos).toEqual(['CL']);
    expect(m.puntos[0]?.valor).toBe(138);
  });
  it('conteos sin tramas por defecto y eje con intervalo entero', () => {
    const m = modeloConteo(base.eventos, 'nivelIncimmet', 'Niveles');
    const o = opcionesGrafico(m);
    expect(o.aria).toMatchObject({ decal: { show: false } });
    expect(o.yAxis).toMatchObject({ minInterval: 1 });
    expect(o.xAxis).toMatchObject({ axisLabel: { interval: 0 } });
    expect(o.dataZoom).toBeUndefined();
    expect(opcionesGrafico(m, false, false, false, true).aria).toMatchObject({
      decal: { show: true },
    });
  });
  it('tendencia abre los últimos 24 meses y sin slider en móvil', () => {
    const m = modeloTendencia(base.eventos, 'mensual');
    const count = m.categorias!.length;
    expect(opcionesGrafico(m).dataZoom).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'slider', startValue: count - 24, endValue: count - 1 }),
      ]),
    );
    expect(opcionesGrafico(m, false, false, true).dataZoom).toEqual([
      expect.objectContaining({ type: 'inside' }),
    ]);
  });
  it('los oficiales no heredan intervalo mínimo entero', () => {
    const o = opcionesGrafico({
      id: 'oficial-ia',
      tipo: 'line',
      titulo: 'IA',
      descripcion: 'Fuente',
      procedencia: 'Oficial (documento fuente)',
      puntos: [{ etiqueta: '2024', valor: 0.7694 }],
    });
    expect(o.yAxis).not.toMatchObject({ minInterval: 1 });
  });
});
describe('Roca procedural suave', () => {
  it('ruido determinista, no blanco independiente por píxel', () => {
    const a = ruidoRoca(256);
    expect(a).toEqual(ruidoRoca(256));
    expect(a.length).toBe(256 * 256);
    let maximum = 0;
    for (let i = 1; i < a.length; i++) {
      if (i % 256) maximum = Math.max(maximum, Math.abs(a[i]! - a[i - 1]!));
    }
    expect(maximum).toBeLessThan(12);
  });
  it('borde periódico sin salto de mosaico', () => {
    const a = ruidoRoca(256);
    for (let y = 0; y < 256; y++)
      expect(Math.abs(a[y * 256]! - a[y * 256 + 255]!)).toBeLessThan(12);
  });
});
