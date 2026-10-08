import { describe, expect, it } from 'vitest';
import { base } from './fixtures';
import {
  avisosCalidad,
  resumenKPIs,
  contarEventos,
  matrizSeveridad,
  coberturaAnual,
  cumplimientoComparado,
  calidadCampos,
  seleccionarMarca,
  eventHref,
} from '@/lib/domain/analitica';
import { seleccionarCruzado } from '@/lib/domain/filtros';
import {
  modeloTendencia,
  modeloPareto,
  modeloCalor,
  modeloMatriz,
  modeloCumplimiento,
  modeloComparado,
  modeloCobertura,
  modeloConteo,
} from '@/lib/analytics/modelos';

describe('Paso 4: agregaciones y modelos analíticos', () => {
  it('KPIs preservan denominadores y coberturas', () => {
    const k = resumenKPIs(base.eventos, base.acciones);
    expect(k.eventos).toBe(225);
    expect(k.accidentes).toBe(55);
    expect(k.hpri).toBe(6);
    expect(k.porNivel.reduce((s, r) => s + r.cantidad, 0)).toBe(55);
    expect(k.porNivel.at(-1)?.etiqueta).toBe('No consta');
    expect(k.diasPerdidos).toMatchObject({ valor: 189, conDato: 6, sinDato: 219 });
    expect(k.cumplimiento).toMatchObject({
      total: 168,
      cerradas: 3,
      cierresImportadosParciales: 2,
    });
    expect(k.cumplimiento.estados.Vencida).toBe(11);
  });
  it('no transforma filtro de cierres en cumplimiento 100%', () => {
    const s = seleccionarCruzado(base.eventos, base.acciones, base.lecciones, {
      estadosAccion: ['Cerrada con evidencia'],
    });
    expect(s.acciones).toHaveLength(3);
    const k = resumenKPIs(s.eventos, s.cohorteAcciones);
    expect(k.cumplimiento.porcentajeCierre).toBeCloseTo((3 / 168) * 100);
  });
  it('no suma identificadores repetidos', () => {
    expect(
      resumenKPIs([...base.eventos, ...base.eventos], [...base.acciones, ...base.acciones]).eventos,
    ).toBe(225);
    expect(contarEventos(base.eventos, 'proyectoCodigo')[0]).toMatchObject({
      clave: 'CL',
      cantidad: 138,
    });
  });
  it('matriz incluye faltantes sin ubicarlos en nivel cero', () => {
    const m = matrizSeveridad(base.eventos);
    expect(m.completos).toBe(179);
    expect(m.faltantes).toBe(46);
    expect(m.filas).toHaveLength(64);
    expect(m.filas.reduce((s, r) => s + (r.cantidad ?? 0), 0)).toBe(225);
    expect(
      modeloMatriz(base.eventos).puntos.find((p) => p.x === 'No consta' && p.y === 'No consta')
        ?.filtros,
    ).toEqual({ niveles: [null], potenciales: [null] });
  });
  it('cobertura anual conserva años sin filas como null', () => {
    const c = coberturaAnual(
      base.eventos,
      base.proyectos.map((p) => p.codigo),
    );
    expect(c).toHaveLength(18 * 12);
    expect(c.find((r) => r.anio === 2025 && r.proyecto === 'EP')?.cantidad).toBeNull();
    expect(c.filter((r) => r.anio === 2025).reduce((s, r) => s + (r.cantidad ?? 0), 0)).toBe(3);
    expect(modeloCobertura(base).puntos).toHaveLength(216);
  });
  it.each(['tipo', 'riesgoCritico', 'actividad', 'equipo'] as const)(
    'Pareto %s completa 100% y vincula filas reales',
    (campo) => {
      const m = modeloPareto(base.eventos, campo, campo);
      expect(m.tipo).toBe('pareto');
      expect(m.puntos.at(-1)?.acumulado).toBe(100);
      expect(
        m.puntos.every((p) =>
          p.filtros?.eventoIds?.every((id) => base.eventos.some((e) => e.id === id)),
        ),
      ).toBe(true);
      expect(m.descripcion).toContain('80%');
    },
  );
  it('tendencia anual 2024=155 y mensual excluye un mes no documentado', () => {
    const anual = modeloTendencia(base.eventos, 'anual');
    expect(
      anual.puntos.filter((p) => p.etiqueta === '2024').reduce((s, p) => s + (p.valor ?? 0), 0),
    ).toBe(155);
    expect(
      modeloTendencia(base.eventos, 'mensual').puntos.reduce((s, p) => s + (p.valor ?? 0), 0),
    ).toBe(224);
    expect(anual.puntos.filter((p) => p.etiqueta === '2020').every((p) => p.valor === null)).toBe(
      true,
    );
  });
  it('mapa 2026 muestra 52 y cruza proyecto/año/mes', () => {
    const m = modeloCalor(
      base.eventos,
      base.proyectos.map((p) => p.codigo),
      2026,
    );
    expect(m.puntos).toHaveLength(144);
    expect(m.puntos.reduce((s, p) => s + (p.valor ?? 0), 0)).toBe(52);
    expect(m.puntos[0]?.filtros?.anios).toEqual([2026]);
  });
  it.each(['proyecto', 'evento'] as const)('cumplimiento por %s conserva total único', (por) => {
    const m = modeloCumplimiento(base.acciones, por);
    expect(m.puntos.reduce((s, p) => s + (p.valor ?? 0), 0)).toBe(168);
    expect(
      m.puntos
        .filter((p) => p.serie === 'Cerrada con evidencia')
        .reduce((s, p) => s + (p.valor ?? 0), 0),
    ).toBe(3);
  });
  it('declarado y verificado no se suman', () => {
    expect(cumplimientoComparado(base.acciones).reduce((s, p) => s + p.declaradas, 0)).toBe(13);
    expect(
      cumplimientoComparado(base.acciones, ['SM']).find((p) => p.proyecto === 'SM')
        ?.porcentajeCierre,
    ).toBeNull();
    expect(modeloComparado(base.acciones).descripcion).toContain('no se suman');
  });
  it('calidad separa null, vacío y desconocido textual', () => {
    expect(calidadCampos(base, 'eventos').find((r) => r.campo === 'dias_perdidos')).toMatchObject({
      nulos: 219,
      total: 225,
    });
    expect(calidadCampos(base, 'acciones').find((r) => r.campo === 'evidencias')).toMatchObject({
      nulos: 0,
      vacios: 164,
      total: 168,
    });
    expect(
      calidadCampos(base, 'acciones').find((r) => r.campo === 'responsable_rol'),
    ).toMatchObject({ nulos: 151, noConsta: 3 });
    expect(
      calidadCampos(base, 'lecciones').find((r) => r.campo === 'controles.sustitucion')?.nulos,
    ).toBe(16);
  });
  it('avisos se derivan de datos modificados y no de textos fijos', () => {
    const modified = {
      ...base,
      eventos: base.eventos.filter((e) => e.anio !== 2025),
      acciones: [],
    };
    expect(avisosCalidad(modified).some((s) => s.includes('0 registros recuperados'))).toBe(true);
    expect(avisosCalidad(modified).some((s) => s.includes('AC-145'))).toBe(false);
  });
  it('marca cruzada es una tupla atómica y se quita al repetir', () => {
    const f = { anios: [2024], proyectos: ['CL'] };
    expect(seleccionarMarca(f, { anios: [2024], proyectos: ['CL'] })).toEqual({});
    expect(seleccionarMarca(f, { grupos: ['Incidente'] })).toEqual({ ...f, grupos: ['Incidente'] });
    expect(seleccionarMarca(f, {})).toEqual(f);
    expect(eventHref('EV-X/Y?')).toBe('/eventos/EV-X%2FY%3F');
    expect(eventHref('LOCAL-a')).toBe('/eventos/local?id=LOCAL-a');
  });
  it('conjunto vacío: no porcentajes inventados ni NaN', () => {
    expect(resumenKPIs([], []).cumplimiento.porcentajeCierre).toBeNull();
    expect(modeloConteo([], 'tipo', 'Vacío').puntos).toEqual([]);
    expect(modeloPareto([], 'tipo', 'Vacío').puntos).toEqual([]);
  });
});
