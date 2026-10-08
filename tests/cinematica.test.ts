import { describe, expect, it } from 'vitest';
import {
  acotar,
  aleatorioSemilla,
  degradarCalidad,
  ESCENAS,
  GALERIA,
  mallaBoveda,
  modoInicial,
  perfilCalidad,
  pernosBoveda,
  poseCamara,
  progresoNarrativo,
} from '@/lib/domain/cinematica';

describe('Narrativa, capacidades y geometría determinista', () => {
  it('define ocho escenas únicas', () => {
    expect(ESCENAS).toHaveLength(8);
    expect(new Set(ESCENAS.map((s) => s.id)).size).toBe(8);
  });
  it('prioriza las preferencias de movimiento y disponibilidad de WebGL', () => {
    expect(modoInicial({ webgl: true, reducido: true })).toBe('2d');
    expect(modoInicial({ webgl: false, reducido: false })).toBe('2d');
    expect(modoInicial({ webgl: true, reducido: false, ahorro: true })).toBe('2d');
  });
  it('usa pistas conservadoras, sin tratar memoria ausente como cero', () => {
    expect(modoInicial({ webgl: true, reducido: false })).toBe('alta');
    expect(modoInicial({ webgl: true, reducido: false, memoria: 2 })).toBe('2d');
    expect(modoInicial({ webgl: true, reducido: false, memoria: 4 })).toBe('baja');
    expect(modoInicial({ webgl: true, reducido: false, movil: true })).toBe('equilibrada');
  });
  it('degrada de forma monotónica y termina en 2D', () => {
    expect(degradarCalidad('alta')).toBe('equilibrada');
    expect(degradarCalidad('equilibrada')).toBe('baja');
    expect(degradarCalidad('baja')).toBe('2d');
    expect(degradarCalidad('2d')).toBe('2d');
  });
  it('respeta el máximo DPR y retira los efectos del nivel bajo', () => {
    for (const quality of ['alta', 'equilibrada', 'baja'] as const)
      expect(perfilCalidad(quality).dprMax).toBeLessThanOrEqual(1.5);
    expect(perfilCalidad('baja')).toMatchObject({ polvo: 0, capasNiebla: 0, dprMax: 1 });
  });
  it('normaliza según posiciones reales, no una altura fija por escena', () => {
    expect(progresoNarrativo(0, [0, 100, 350])).toBe(0);
    expect(progresoNarrativo(100, [0, 100, 350])).toBe(0.5);
    expect(progresoNarrativo(225, [0, 100, 350])).toBe(0.75);
    expect(progresoNarrativo(999, [0, 100, 350])).toBe(1);
    expect(progresoNarrativo(0, [])).toBe(0);
  });
  it('mantiene la cámara dentro de la galería y sin retroceso involuntario', () => {
    let previous = Infinity;
    for (let i = 0; i <= 100; i++) {
      const { posicion, mirada } = poseCamara(i / 100);
      expect(posicion.every(Number.isFinite)).toBe(true);
      expect(Math.abs(posicion[0])).toBeLessThan(GALERIA.radio);
      expect(posicion[2]).toBeLessThanOrEqual(previous);
      expect(mirada[2]).toBeLessThan(posicion[2]);
      previous = posicion[2];
    }
  });
  it('produce malla y pernos finitos sin segmentos vacíos', () => {
    const segments = [...mallaBoveda('alta'), ...pernosBoveda()];
    expect(segments.length).toBeGreaterThan(500);
    expect(segments.every((s) => [...s.desde, ...s.hasta].every(Number.isFinite))).toBe(true);
    expect(segments.every((s) => s.desde.some((n, i) => n !== s.hasta[i]))).toBe(true);
    expect(mallaBoveda('baja').length).toBeLessThan(mallaBoveda('alta').length);
  });
  it('reproduce la semilla sin Math.random durante el render', () => {
    const a = aleatorioSemilla(5),
      b = aleatorioSemilla(5);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
  it('acota entradas no finitas sin propagar NaN', () => {
    expect(acotar(NaN)).toBe(0);
    expect(acotar(2)).toBe(1);
    expect(acotar(-1)).toBe(0);
  });
});
