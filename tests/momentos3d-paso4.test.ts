import { describe, expect, it } from 'vitest';
import { base } from './fixtures';
import { resumenPresentacion } from '@/lib/domain/presentacion';
import {
  lucesEventos,
  tarjetasEvidencia,
  estacionesProyectos,
  panelesIndicadores,
} from '@/lib/domain/momentos3d';
import {
  ENCUADRES,
  poseCamara,
  puedeMedirRendimiento,
  MENSAJES_FALLBACK,
} from '@/lib/domain/cinematica';
const data = resumenPresentacion(base);
describe('Momentos 3D dirigidos por datos', () => {
  it('cada evento y acción tiene una instancia; exactamente 3 tarjetas verdes', () => {
    expect(lucesEventos(data)).toHaveLength(225);
    expect(new Set(lucesEventos(data).map((x) => x.id)).size).toBe(225);
    const cards = tarjetasEvidencia(data);
    expect(cards).toHaveLength(168);
    expect(cards.filter((c) => c.color === '#00B050')).toHaveLength(3);
    expect(data.tarjetasAcciones.filter((a) => a.cerrada && a.parcial)).toHaveLength(2);
    expect(data.balizas).toHaveLength(6);
    expect(data.ciclo).toHaveLength(6);
  });
  it('cambiar el conjunto cambia la geometría: no hay conteos hardcodeados', () => {
    const altered = resumenPresentacion({
      ...base,
      eventos: base.eventos.slice(0, 9),
      acciones: [],
      lecciones: [],
      proyectos: base.proyectos.slice(0, 2),
    });
    expect(lucesEventos(altered)).toHaveLength(9);
    expect(tarjetasEvidencia(altered)).toHaveLength(0);
    expect(estacionesProyectos(altered)).toHaveLength(2);
  });
  it('Cerro Lindo es la estación mayor y sus rótulos son documentales', () => {
    const ps = estacionesProyectos(data);
    expect(ps).toHaveLength(12);
    expect(ps[0]?.codigo).toBe('CL');
    expect(ps[0]?.eventos).toBe(138);
    expect(ps.every((p) => p.altura <= (ps[0]?.altura ?? 0))).toBe(true);
    expect(panelesIndicadores(data).map((p) => p.valor)).toEqual([2.7098, 283.92, 0.7694]);
  });
  it('instancias reproducibles y finitas', () => {
    expect(lucesEventos(data)).toEqual(lucesEventos(data));
    for (const p of [...lucesEventos(data), ...tarjetasEvidencia(data)])
      expect([...p.posicion, ...p.escala].every(Number.isFinite)).toBe(true);
  });
  it('ocho encuadres diferenciados y pausa sobre el hito', () => {
    expect(ENCUADRES).toHaveLength(8);
    expect(new Set(ENCUADRES.map((e) => e.posicion[2])).size).toBe(8);
    ENCUADRES.forEach((e, i) => expect(poseCamara(i / 7)).toEqual(e));
    expect(poseCamara(-1)).toEqual(ENCUADRES[0]);
    expect(poseCamara(2)).toEqual(ENCUADRES[7]);
  });
  it.each([
    [true, true, true, false],
    [false, false, true, false],
    [true, false, false, false],
    [true, false, true, true],
  ])('warmup %s/%s/%s', (active, warm, moving, expected) => {
    expect(puedeMedirRendimiento(active, warm, moving)).toBe(expected);
  });
  it('rendimiento y pérdida de contexto no se etiquetan como el mismo error', () => {
    expect(MENSAJES_FALLBACK.rendimiento).toContain('Rendimiento insuficiente');
    expect(MENSAJES_FALLBACK.contexto).toContain('contexto');
    expect(MENSAJES_FALLBACK.error).toContain('iniciar');
  });
});
