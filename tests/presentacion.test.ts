import { describe, expect, it } from 'vitest';
import { base } from './fixtures';
import { formatoNarrativo, resumenPresentacion } from '@/lib/domain/presentacion';

describe('Presentación documental sin cifras hardcodeadas', () => {
  it('resume las colecciones originales y su rango', () => {
    expect(resumenPresentacion(base)).toMatchObject({
      eventos: 225,
      proyectos: 12,
      acciones: 168,
      lecciones: 22,
      altoPotencial: 6,
      desde: '2009-12-29',
      hasta: '2026-09-30',
      anioDesde: 2009,
      anioHasta: 2026,
    });
  });
  it('conserva 3 cierres, 2 parciales y 127 sin información', () => {
    const result = resumenPresentacion(base);
    expect(result).toMatchObject({ cerradas: 3, cierresParciales: 2, sinInformacion: 127 });
    expect(formatoNarrativo(result.porcentajeCierre, 1)).toBe('1.8');
    expect(formatoNarrativo(result.porcentajeSinInformacion, 1)).toBe('75.6');
  });
  it('usa IF/IS/IA oficiales, nunca el detalle como reemplazo', () => {
    const result = resumenPresentacion(base);
    expect(result.indicadores).toMatchObject({
      anio: 2024,
      ambito: 'PERU',
      if: 2.7098,
      is: 283.92,
      ia: 0.7694,
    });
    expect(formatoNarrativo(result.indicadores.if, 2)).toBe('2.71');
    expect(formatoNarrativo(result.indicadores.ia, 3)).toBe('0.769');
    expect(result.indicadores.fuente).toBeTruthy();
  });
  it('deriva proyectos del detalle, no del campo n_eventos', () => {
    const copy = structuredClone(base);
    copy.proyectos.forEach((p) => {
      p.n_eventos = 0;
    });
    expect(
      resumenPresentacion(copy)
        .proyectosDetalle.slice(0, 3)
        .map((p) => p.eventos),
    ).toEqual([138, 25, 23]);
  });
  it('ignora metaconteos alterados en una copia sintética', () => {
    const copy = structuredClone(base);
    copy.meta.conteos.eventos = 9999;
    expect(resumenPresentacion(copy).eventos).toBe(base.eventos.length);
  });
  it('no incorpora reportes locales a la narrativa del corte', () => {
    const copy = structuredClone(base);
    const first = copy.eventos[0];
    if (!first) throw new Error('Falta fixture');
    copy.eventos.push({ ...first, id: 'PRUEBA-LOCAL', origen: 'local' });
    expect(resumenPresentacion(copy).eventos).toBe(base.eventos.length);
  });
  it('no confunde nuevas validaciones locales con el estado importado', () => {
    const copy = structuredClone(base);
    copy.acciones.forEach((a) => {
      a.estadoVerificado = 'Cerrada con evidencia';
    });
    expect(resumenPresentacion(copy).cerradas).toBe(3);
  });
  it('cuenta IDs únicos y conserva el original', () => {
    const before = JSON.stringify(base);
    const copy = structuredClone(base);
    copy.eventos.push(...copy.eventos);
    copy.acciones.push(...copy.acciones);
    expect(resumenPresentacion(copy).eventos).toBe(225);
    expect(resumenPresentacion(copy).acciones).toBe(168);
    expect(JSON.stringify(base)).toBe(before);
  });
  it('un porcentaje sin denominador es nulo', () => {
    const copy = { ...base, acciones: [] };
    expect(resumenPresentacion(copy).porcentajeCierre).toBeNull();
    expect(resumenPresentacion(copy).porcentajeSinInformacion).toBeNull();
  });
  it('un indicador ausente no se presenta como cero', () => {
    expect(resumenPresentacion(base, { anio: 2099, ambito: 'PERU' }).indicadores.if).toBeNull();
  });
  it('no selecciona una versión oficial ambigua', () => {
    const copy = structuredClone(base);
    const official = copy.indicadores.anual_por_ambito.find(
      (i) => i.anio === 2024 && i.ambito === 'PERU',
    );
    if (!official) throw new Error('Falta fixture');
    copy.indicadores.anual_por_ambito.push({ ...official, if: 9, fuente: 'SINTETICA-PRUEBA' });
    expect(resumenPresentacion(copy).indicadores).toMatchObject({ if: null, versiones: 2 });
  });
  it.each([null, undefined, NaN, Infinity])('formatea %s como No consta', (value) => {
    expect(formatoNarrativo(value)).toBe('No consta');
  });
  it('conserva el cero explícito y el punto decimal', () => {
    expect(formatoNarrativo(0, 1)).toBe('0.0');
    expect(formatoNarrativo(283.92, 2)).toBe('283.92');
  });
});
