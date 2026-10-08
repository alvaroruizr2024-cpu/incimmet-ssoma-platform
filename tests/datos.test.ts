import { describe, expect, it } from 'vitest';
import { validarDocumento } from '@/lib/data/validarDocumento';
import { normalizarDocumento } from '@/lib/data/normalizar';
import { data } from './fixtures';
describe('Contrato e integridad de data.json', () => {
  it('coincide con meta.conteos y no altera el original', () => {
    const original = JSON.stringify(data);
    const b = normalizarDocumento(data);
    expect(b.eventos).toHaveLength(225);
    expect(b.acciones).toHaveLength(168);
    expect(b.lecciones).toHaveLength(22);
    expect(b.proyectos).toHaveLength(12);
    expect(b.documentosFuente).toHaveLength(33);
    b.eventos[0]!.descripcion = 'mutación de copia para prueba';
    expect(JSON.stringify(data)).toBe(original);
    expect(b.eventos.filter((e) => e.fecha === null)).toHaveLength(1);
  });
  it('no inventa responsables, fechas de carga ni estados históricos', () => {
    const b = normalizarDocumento(data);
    expect(b.eventos.filter((e) => e.estado === null)).toHaveLength(218);
    expect(b.eventos.every((e) => e.creadoEn === null && e.creadoPor === null)).toBe(true);
    expect(b.acciones.filter((a) => a.responsableRol === null)).toHaveLength(151);
    expect(b.lecciones.every((l) => l.publicacion === 'Catalogada')).toBe(true);
  });
  it('rechaza cambios de tipo, IDs repetidos, referencias huérfanas y conteos incompatibles', () => {
    expect(() => validarDocumento({})).toThrow();
    const d1 = structuredClone(data);
    d1.meta.conteos.eventos = 1;
    expect(() => validarDocumento(d1)).toThrow();
    const d2 = structuredClone(data);
    d2.eventos[0]!.id = d2.eventos[1]!.id;
    expect(() => validarDocumento(d2)).toThrow();
    const d3 = structuredClone(data);
    d3.acciones[0]!.evento_id = 'NO';
    expect(() => validarDocumento(d3)).toThrow();
    const d4 = structuredClone(data);
    d4.eventos[0]!.mes = 15;
    expect(() => validarDocumento(d4)).toThrow();
  });
});
