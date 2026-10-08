import { afterEach, describe, expect, it, vi } from 'vitest';
import { base } from './fixtures';
import { ReproductorDocumental, secuenciaDocumental } from '@/lib/domain/reproduccion';
afterEach(() => vi.useRealTimers());
describe('Reproducción documental, sin eventos sintéticos', () => {
  it('ordena el año elegido por fecha/hora/ID y elimina duplicados', () => {
    const rows = secuenciaDocumental([...base.eventos].reverse().concat(base.eventos));
    expect(rows).toHaveLength(52);
    expect(rows[0]?.id).toBe('EV-2026-001');
    expect(rows.at(-1)?.id).toBe('EV-2026-052');
  });
  it('pausa, avanza y reanuda sin duplicar los IDs', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const r = new ReproductorDocumental(cb);
    r.iniciar(base.eventos, 2026, 100);
    vi.advanceTimersByTime(200);
    expect(r.snapshot().visibles).toHaveLength(2);
    r.pausar();
    vi.advanceTimersByTime(2000);
    expect(r.snapshot().visibles).toHaveLength(2);
    r.avanzar();
    expect(r.snapshot().visibles).toHaveLength(3);
    r.reanudar();
    vi.advanceTimersByTime(10000);
    expect(r.snapshot().estado).toBe('finalizada');
    expect(new Set(r.snapshot().visibles).size).toBe(52);
    expect(cb.mock.calls.filter(([e]) => Boolean(e))).toHaveLength(52);
    expect(base.eventos).toHaveLength(225);
    r.detener();
    expect(r.snapshot().visibles).toHaveLength(0);
  });
  it('snapshot no expone arrays mutables del reproductor', () => {
    vi.useFakeTimers();
    const r = new ReproductorDocumental(() => {});
    r.iniciar(base.eventos);
    r.pausar();
    r.snapshot().visibles.push('falso');
    expect(r.snapshot().visibles).toEqual([]);
    r.detener();
  });
  it('sin registros finaliza sin temporizador', () => {
    vi.useFakeTimers();
    const r = new ReproductorDocumental(() => {});
    r.iniciar([], 2026);
    expect(r.snapshot().estado).toBe('finalizada');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('reiniciar cancela el temporizador previo', () => {
    vi.useFakeTimers();
    const r = new ReproductorDocumental(() => {});
    r.iniciar(base.eventos);
    r.iniciar(base.eventos);
    expect(vi.getTimerCount()).toBe(1);
    r.detener();
    expect(vi.getTimerCount()).toBe(0);
  });
});
