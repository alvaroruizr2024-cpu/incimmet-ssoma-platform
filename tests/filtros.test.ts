import { describe, expect, it } from 'vitest';
import {
  filtrarEventos,
  filtrarAcciones,
  filtrarLecciones,
  seleccionarCruzado,
  crearSelectorMemoizado,
  textoBusqueda,
  unicosPorId,
} from '@/lib/domain/filtros';
import { base } from './fixtures';
describe('Filtros puros y vínculos', () => {
  it('cuenta 155 eventos en 2024 y 52 en 2026', () => {
    expect(filtrarEventos(base.eventos, { anios: [2024] })).toHaveLength(155);
    expect(filtrarEventos(base.eventos, { anios: [2026] })).toHaveLength(52);
  });
  it('O dentro de una dimensión y Y entre dimensiones', () => {
    expect(filtrarEventos(base.eventos, { anios: [2024, 2026], proyectos: ['CL'] })).toHaveLength(
      135,
    );
    expect(filtrarEventos(base.eventos, { anios: [2024], proyectos: ['TA', 'OR'] })).toHaveLength(
      32,
    );
  });
  it('conserva el evento de 2023 sin mes, sin moverlo a enero', () => {
    expect(filtrarEventos(base.eventos, { anios: [2023] })).toHaveLength(3);
    expect(filtrarEventos(base.eventos, { meses: [null] }).map((e) => e.id)).toEqual([
      'EV-2023-001',
    ]);
    expect(filtrarEventos(base.eventos, { desde: '2023-01-01', hasta: '2023-12-31' })).toHaveLength(
      2,
    );
  });
  it('usa bandera HPRI y no solo tipo', () => {
    expect(filtrarEventos(base.eventos, { altoPotencial: true })).toHaveLength(6);
    expect(filtrarEventos(base.eventos, { tipos: ['Incidente peligroso / HPRI'] })).toHaveLength(4);
  });
  it('busca sin acentos, sin fusionar categorías originales', () => {
    expect(textoBusqueda(' VOLADURA ElÉctrica ')).toBe('voladura electrica');
    expect(filtrarEventos(base.eventos, { busqueda: 'electrica' }).length).toBeGreaterThan(0);
    expect(filtrarLecciones(base.lecciones, base.eventos, {}, 'voladura').length).toBeGreaterThan(
      0,
    );
    expect(filtrarLecciones(base.lecciones, base.eventos, {}, 'malla').length).toBeGreaterThan(0);
  });
  it('no multiplica acciones transversales; aplica compromiso por separado', () => {
    expect(filtrarAcciones(base.acciones, base.eventos, { proyectos: ['EP'] })).toHaveLength(43);
    expect(
      filtrarAcciones(base.acciones, base.eventos, { compromisoDesde: '2026-10-01' }),
    ).toHaveLength(3);
    expect(unicosPorId([...base.acciones, ...base.acciones])).toHaveLength(168);
  });
  it('no convierte el cumplimiento en 100% al seleccionar cerradas', () => {
    const s = seleccionarCruzado(base.eventos, base.acciones, base.lecciones, {
      estadosAccion: ['Cerrada con evidencia'],
    });
    expect(s.acciones).toHaveLength(3);
    expect(s.eventos).toHaveLength(2);
    expect(s.cohorteAcciones).toHaveLength(168);
  });
  it('memoiza sin mutar la base ni aceptar IDs inexistentes', () => {
    const fn = crearSelectorMemoizado();
    const filtros = { anios: [2024] };
    const a = fn(base.eventos, base.acciones, base.lecciones, filtros);
    expect(fn(base.eventos, base.acciones, base.lecciones, { anios: [2024] })).toBe(a);
    expect(fn(base.eventos, base.acciones, base.lecciones, { anios: [2026] })).not.toBe(a);
    expect(filtrarEventos(base.eventos, { eventoIds: ['NO-EXISTE'] })).toEqual([]);
    expect(base.eventos).toHaveLength(225);
  });
});
