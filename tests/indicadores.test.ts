import { describe, expect, it } from 'vitest';
import {
  calcularIF,
  calcularIS,
  calcularIA,
  calcularTRIFR,
  indicadoresOficiales,
  recalcularResumenPBIX,
} from '@/lib/domain/indicadores';
import { data } from './fixtures';
describe('Indicadores de dominio', () => {
  it('conserva exactamente IF oficial Perú 2024 = 2.7098', () => {
    const oficial = indicadoresOficiales(data.indicadores, 2024, 'PERU')[0]!;
    expect(oficial.if).toBe(2.7098);
    expect(oficial.is).toBe(283.92);
    expect(oficial.ia).toBe(0.7694);
    expect(calcularIF(9, oficial.hht)).toBeCloseTo(2.7097562, 6);
    expect(calcularIF(9, oficial.hht)).not.toBe(oficial.if);
  });
  it.each([calcularIF, calcularIS, calcularTRIFR])(
    'maneja nulos, cero y no finitos sin Infinity',
    (fn) => {
      expect(fn(1, 0)).toBeNull();
      expect(fn(1, null)).toBeNull();
      expect(fn(null, 100)).toBeNull();
      expect(fn(undefined, 100)).toBeNull();
      expect(fn(-1, 100)).toBeNull();
      expect(fn(1, -1)).toBeNull();
      expect(fn(0, 100)).toBe(0);
      expect(fn(1, Infinity)).toBeNull();
      expect(fn(NaN, 100)).toBeNull();
      expect(fn(1, 1_000_000)).toBe(1);
    },
  );
  it('IS, IA y TRIFR emplean sus propios numeradores', () => {
    expect(calcularIS(943, 3321332)).toBeCloseTo(283.9222336, 6);
    expect(calcularIA(2.7098, 283.92)).toBeCloseTo(0.769366416, 9);
    expect(calcularIA(null, 1)).toBeNull();
    expect(calcularIA(0, 0)).toBe(0);
    expect(calcularIA(Infinity, 1)).toBeNull();
    expect(calcularTRIFR(17, 3321332)).toBeCloseTo(5.11842839, 6);
  });
  it('no completa IF/IA con numeradores inexistentes en PBIX', () => {
    const r = data.indicadores.hh_semanal_pbix_resumen.find(
      (x) => x.proyecto === 'CL' && x.anio === 2026,
    )!;
    expect(recalcularResumenPBIX(r)).toMatchObject({ if: null, ia: null, trifr: null });
    expect(recalcularResumenPBIX(r).is).toBeCloseTo(5e6 / r.hht, 8);
    expect(indicadoresOficiales(data.indicadores, 2099, 'PERU')).toEqual([]);
  });
});
