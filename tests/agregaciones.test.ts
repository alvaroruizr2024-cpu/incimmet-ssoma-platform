import { describe, expect, it } from 'vitest';
import {
  pareto,
  mapaCalorProyectoMes,
  tendencias,
  cumplimientoPorEvento,
  cumplimientoPorProyecto,
  resumenCumplimiento,
  sumaConCobertura,
  esNoConsta,
} from '@/lib/domain/agregaciones';
import { base } from './fixtures';
describe('Agregaciones con denominador y cobertura', () => {
  it('Pareto ordenado, acumulado 100%, nulos fuera con contador', () => {
    const p = pareto(base.eventos, 'riesgoCritico');
    expect(p.total).toBe(225);
    expect(p.sinDato).toBe(45);
    expect(p.conDato).toBe(180);
    expect(p.filas.at(-1)?.porcentajeAcumulado).toBe(100);
    expect(p.filas.every((r, i) => !i || r.cantidad <= p.filas[i - 1]!.cantidad)).toBe(true);
    expect(pareto([], 'tipo').filas).toEqual([]);
  });
  it('No consta textual es distinto de N.A.', () => {
    expect(esNoConsta('No consta (en investigación)')).toBe(true);
    expect(esNoConsta('N.A.')).toBe(false);
    expect(esNoConsta(0)).toBe(false);
    expect(pareto(base.eventos, 'causasBasicas').sinDato).toBe(221);
  });
  it('mapa mensual conserva huecos y mes desconocido', () => {
    const mapa = mapaCalorProyectoMes(base.eventos, [2024], ['CL']);
    expect(mapa.filas).toHaveLength(12);
    expect(mapa.filas.reduce((n, r) => n + (r.cantidad ?? 0), 0)).toBe(111);
    expect(mapaCalorProyectoMes(base.eventos, [2023], ['CL']).sinMes).toEqual(['EV-2023-001']);
    expect(
      mapaCalorProyectoMes(base.eventos, [2025], ['EP']).filas.every((r) => r.cantidad === null),
    ).toBe(true);
  });
  it('tendencias no unen huecos como ceros confirmados', () => {
    expect(
      tendencias(base.eventos, 'anual').filas.find((r) => r.periodo === '2024')?.cantidad,
    ).toBe(155);
    expect(
      tendencias(base.eventos, 'anual').filas.find((r) => r.periodo === '2013')?.cantidad,
    ).toBeNull();
    expect(tendencias(base.eventos).sinMes).toEqual(['EV-2023-001']);
    expect(tendencias(base.eventos).filas.reduce((n, r) => n + (r.cantidad ?? 0), 0)).toBe(224);
    expect(tendencias([]).filas).toEqual([]);
  });
  it('cumplimiento por proyecto y por evento conserva las 168 acciones', () => {
    expect(cumplimientoPorProyecto(base.acciones).reduce((n, r) => n + r.total, 0)).toBe(168);
    expect(cumplimientoPorEvento(base.acciones)).toHaveLength(26);
    expect(
      cumplimientoPorProyecto(base.acciones, ['SM']).find((r) => r.clave === 'SM')
        ?.porcentajeCierre,
    ).toBeNull();
    expect(resumenCumplimiento(base.acciones)).toMatchObject({
      total: 168,
      cerradas: 3,
      cierresImportadosParciales: 2,
    });
    expect(resumenCumplimiento(base.acciones).porcentajeCierre).toBeCloseTo(1.78571428, 6);
  });
  it('189 días documentados no significan el total de la empresa', () => {
    expect(sumaConCobertura(base.eventos, 'diasPerdidos')).toMatchObject({
      valor: 189,
      conDato: 6,
      sinDato: 219,
      total: 225,
    });
    expect(sumaConCobertura([], 'diasPerdidos').valor).toBeNull();
  });
});
