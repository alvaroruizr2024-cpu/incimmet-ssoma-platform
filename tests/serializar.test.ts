import { describe, expect, it } from 'vitest';
import { serializarEstable } from '@/lib/domain/serializar';
import { puedeCerrarEventoOperativo } from '@/lib/domain/estadoVerificado';
import { base } from './fixtures';
describe('Idempotencia y puerta operativa', () => {
  it('mismo contenido con distinto orden de propiedades tiene la misma huella', () => {
    expect(serializarEstable({ b: 1, a: { y: null, x: 2 } })).toBe(
      serializarEstable({ a: { x: 2, y: null }, b: 1 }),
    );
    expect(serializarEstable([1, 2])).not.toBe(serializarEstable([2, 1]));
    expect(() => serializarEstable(undefined)).toThrow('JSON');
  });
  it('un cierre documental no satisface por sí solo el cierre operativo', () => {
    const historicas = base.acciones.filter((a) => a.estadoImportado === 'Cerrada con evidencia');
    expect(puedeCerrarEventoOperativo(historicas, true, true)).toBe(false);
    expect(
      puedeCerrarEventoOperativo(
        historicas.map((a) => ({ ...a, estadoOperativo: 'Cerrada con evidencia' as const })),
        true,
        true,
      ),
    ).toBe(true);
  });
});
