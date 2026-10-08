import { describe, expect, it } from 'vitest';
import {
  esFechaISO,
  exigirFechaISO,
  fechaLima,
  diasEntre,
  formatoFecha,
  instanteHastaCorte,
} from '@/lib/domain/fechas';
import { filtrosAParametros, parametrosAFiltros } from '@/lib/domain/filtrosURL';
import type { Filtros } from '@/lib/types';
describe('Fechas civiles y URL', () => {
  it('valida días reales y conserva DD/MM/AAAA', () => {
    expect(esFechaISO('2024-02-29')).toBe(true);
    expect(esFechaISO('2026-02-29')).toBe(false);
    expect(() => exigirFechaISO('2026-02-30')).toThrow();
    expect(formatoFecha('2026-10-07')).toBe('07/10/2026');
    expect(formatoFecha(null)).toBe('No consta');
    expect(diasEntre('2026-10-07', '2026-10-14')).toBe(7);
  });
  it('el cambio de día usa Lima, no la zona del equipo', () => {
    expect(fechaLima(new Date('2026-10-08T04:59:59Z'))).toBe('2026-10-07');
    expect(fechaLima(new Date('2026-10-08T05:00:00Z'))).toBe('2026-10-08');
    expect(instanteHastaCorte('2026-10-08T04:59:59Z', '2026-10-07')).toBe(true);
    expect(instanteHastaCorte('2026-10-08T05:00:00Z', '2026-10-07')).toBe(false);
    expect(instanteHastaCorte('2026-10-07T12:00:00', '2026-10-07')).toBe(false);
  });
  it('round-trip de comas, null, false y filtros múltiples', () => {
    const f: Filtros = {
      anios: [2024, 2026],
      meses: [1, null],
      riesgos: ['Choque, colisión', null],
      proyectos: ['CL'],
      altoPotencial: false,
      contexto: 'base+local',
      busqueda: 'malla eléctrica',
      estadosAccion: ['Vencida'],
    };
    const p = filtrosAParametros(f, new URLSearchParams('vista=kanban'));
    expect(p.get('vista')).toBe('kanban');
    expect(parametrosAFiltros(p)).toEqual(f);
  });
  it('descarta datos inválidos y no acepta roles desde la URL', () => {
    const f = parametrosAFiltros(
      new URLSearchParams(
        'anios="abc"&meses=15&altoPotencial=bad&desde=2026-02-30&rol=admin&estadosAccion="false"',
      ),
    );
    expect(f).toEqual({ anios: [], meses: [], estadosAccion: [] });
    expect(filtrosAParametros({}, new URLSearchParams('anios=2024&vista=lista')).toString()).toBe(
      'vista=lista',
    );
  });
});
