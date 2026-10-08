import { describe, expect, it } from 'vitest';
import {
  calcularEstadoVerificado,
  declaracionCerrada,
  evidenciaSuficiente,
  puedeCerrarEvento,
  semaforoFecha,
} from '@/lib/domain/estadoVerificado';
import { base, corte, evidenciaValida } from './fixtures';
describe('Estado importado y estado operativo', () => {
  it('preserva los 3 cierres documentales y los 2 con alcance parcial', () => {
    expect(
      base.acciones.filter((a) => a.estadoVerificado === 'Cerrada con evidencia'),
    ).toHaveLength(3);
    expect(
      base.acciones.filter(
        (a) => a.estadoImportado === 'Cerrada con evidencia' && a.coberturaParcial,
      ),
    ).toHaveLength(2);
    expect(base.acciones.every((a) => a.estadoOperativo === null)).toBe(true);
  });
  it.each(base.acciones.filter((a) => a.estadoImportado !== 'Cerrada con evidencia'))(
    'reproduce regla sin evidencia local para $id',
    (a) => {
      expect(
        calcularEstadoVerificado({ ...a, proyectosRequeridos: [a.proyectoCodigo] }, corte),
      ).toBe(a.estadoImportado);
    },
  );
  it('cierra solo con archivo y decisión suficiente de un rol distinto', () => {
    const e = evidenciaValida();
    const entrada = { fechaCompromiso: '2026-09-22', proyectosRequeridos: ['EP'], evidencias: [e] };
    expect(calcularEstadoVerificado(entrada, corte)).toBe('Cerrada con evidencia');
    expect(evidenciaSuficiente({ ...e, validacion: null }, corte, ['EP'])).toBe(false);
    expect(
      evidenciaSuficiente({ ...e, archivo: { ...e.archivo, blob: new Blob([]) } }, corte, ['EP']),
    ).toBe(false);
    expect(evidenciaSuficiente({ ...e, subidoPorRol: 'SSOMA corporativo' }, corte, ['EP'])).toBe(
      false,
    );
    expect(evidenciaSuficiente(e, corte, [])).toBe(false);
    expect(calcularEstadoVerificado({ ...entrada, evidencias: [] }, corte)).toBe('Vencida');
  });
  it('no acepta evidencia futura, parcial o rechazada', () => {
    const e = evidenciaValida();
    const v = e.validacion!;
    expect(
      evidenciaSuficiente(
        { ...e, validacion: { ...v, fecha: '2026-10-08T10:00:00-05:00' } },
        corte,
        ['EP'],
      ),
    ).toBe(false);
    expect(
      evidenciaSuficiente({ ...e, validacion: { ...v, alcanceCompleto: false } }, corte, ['EP']),
    ).toBe(false);
    expect(
      evidenciaSuficiente({ ...e, validacion: { ...v, aceptada: false } }, corte, ['EP']),
    ).toBe(false);
    expect(
      evidenciaSuficiente({ ...e, validacion: { ...v, proyectosCubiertos: ['TA'] } }, corte, [
        'EP',
      ]),
    ).toBe(false);
  });
  it('no confunde Realizada con el estado global En proceso', () => {
    expect(declaracionCerrada('Realizada (estado global: En proceso 80%)')).toBe(true);
    expect(declaracionCerrada('No realizada')).toBe(false);
    expect(declaracionCerrada('En proceso (80%)')).toBe(false);
    expect(
      calcularEstadoVerificado(
        { proyectosRequeridos: [], estadoDeclarado: 'Realizada', fechaCompromiso: '2026-01-01' },
        corte,
      ),
    ).toBe('Declarada cerrada sin evidencia');
  });
  it('un compromiso de hoy permanece abierto hasta terminar el día local', () => {
    expect(
      calcularEstadoVerificado({ fechaCompromiso: corte, proyectosRequeridos: [] }, corte),
    ).toBe('Abierta');
    expect(semaforoFecha(corte, corte).estado).toBe('hoy');
    expect(semaforoFecha('2026-10-14', corte).estado).toBe('proxima');
    expect(semaforoFecha('2026-10-15', corte).estado).toBe('en_plazo');
    expect(semaforoFecha('2026-10-06', corte).dias).toBe(-1);
    expect(semaforoFecha(null, corte).dias).toBeNull();
    expect(() => semaforoFecha(corte, corte, -1)).toThrow();
  });
  it('ignora declaraciones posteriores al corte y rechaza fechas inválidas', () => {
    expect(
      calcularEstadoVerificado(
        {
          estadoDeclarado: 'Realizada',
          fechaEstadoDeclarado: '2026-10-08',
          proyectosRequeridos: [],
        },
        corte,
      ),
    ).toBe('Sin información');
    expect(() => calcularEstadoVerificado({ proyectosRequeridos: [] }, '2026-02-30')).toThrow();
  });
  it('evita cerrar por vacuidad o sin investigación obligatoria', () => {
    expect(puedeCerrarEvento([], true, false)).toBe(false);
    expect(puedeCerrarEvento([], false, true)).toBe(false);
    expect(puedeCerrarEvento([], true, true, true)).toBe(true);
    expect(puedeCerrarEvento(['Abierta'], false, true)).toBe(false);
    expect(puedeCerrarEvento(['Cerrada con evidencia'], true, true)).toBe(true);
  });
});
