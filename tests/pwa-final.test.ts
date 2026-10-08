import { afterEach, describe, expect, it, vi } from 'vitest';
import { revisarPrivacidad, exigirPrivacidad } from '@/lib/domain/privacidad';
import { nuevoFormulario, aReporte, erroresPaso } from '@/lib/pwa/formulario';
import { ColaCampo } from '@/lib/pwa/cola';
import { AlmacenLocal } from '@/lib/data/indexedDB';
import { StaticJsonDataSource } from '@/lib/data/StaticJsonDataSource';
import { data, supervisor, ahora, reporte } from './fixtures';
import type { BorradorCampo, EnvioCampo } from '@/lib/pwa/types';
const stores: AlmacenLocal[] = [];
afterEach(async () => {
  await Promise.all(stores.splice(0).map((s) => s.cerrar()));
});
function context() {
  const almacen = new AlmacenLocal(`pwa-${crypto.randomUUID()}`);
  stores.push(almacen);
  return {
    almacen,
    cola: new ColaCampo(almacen),
    source: new StaticJsonDataSource({
      almacen,
      ahora,
      fetcher: vi.fn(async () => new Response(JSON.stringify(data))),
    }),
  };
}
const draft = (): BorradorCampo => ({
  id: 'reporte-test-0001',
  actor: supervisor,
  formulario: {
    ...nuevoFormulario('EP', ahora()),
    area: 'Taller',
    descripcion: 'Prueba de software. No es un hecho real.',
    personaAfectada: 'no',
    accionesInmediatas: 'Solo prueba.',
    revisionPrivacidad: true,
  },
  paso: 3,
  fotos: [],
  actualizadoEn: ahora().toISOString(),
});
const envio = (): EnvioCampo => ({
  id: 'reporte-test-0001',
  actor: supervisor,
  reporte: reporte(),
  estado: 'pendiente',
  intentos: 0,
  creadoEn: ahora().toISOString(),
  ultimoError: null,
  acuseLocal: null,
});
describe('Privacidad preventiva', () => {
  it.each(['DNI: 12345678', 'persona 87654321', 'DNI 1 2 3 4 5 6 7 8'])('bloquea %s', (text) =>
    expect(revisarPrivacidad([text]).bloqueos.length).toBeGreaterThan(0),
  );
  it.each([
    'Sr. Juan Perez',
    'Juan Perez',
    'diagnóstico confirmado',
    'fractura',
    'historia clínica',
    'ansiedad',
  ])('advierte %s', (text) =>
    expect(revisarPrivacidad([text]).advertencias.length).toBeGreaterThan(0),
  );
  it.each([
    'Rampa 200 – nivel 1800',
    '2026-10-07',
    'Operador de volquete',
    'Bloqueo de equipo',
    'Cerro Lindo',
  ])('no confunde texto técnico %s', (text) =>
    expect(revisarPrivacidad([text])).toEqual({ bloqueos: [], advertencias: [] }),
  );
  it('la comprobación de guardado no depende solo del formulario', () =>
    expect(() => exigirPrivacidad(['DNI 12345678'])).toThrow('DNI'));
});
describe('Formulario de cuatro pasos', () => {
  it('fecha y hora en Lima; potencial por confirmar no se convierte a falso', () => {
    const f = draft().formulario;
    expect(f.fecha).toBe('2026-10-07');
    expect(f.hora).toBe('17:00');
    expect(aReporte(f, [], draft().id, data, supervisor, ahora()).altoPotencial).toBeNull();
  });
  it('exige proyecto, labor, declaración de persona y revisión de privacidad', () => {
    const f = nuevoFormulario('', ahora());
    expect(erroresPaso(f, 0).length).toBeGreaterThan(0);
    expect(erroresPaso(f, 2).length).toBeGreaterThan(0);
    expect(() => aReporte(f, [], draft().id, data, supervisor, ahora())).toThrow();
  });
  it('no elimina desconocidos ni solicita identidad', () => {
    const f = draft().formulario;
    f.personaAfectada = 'si';
    f.personas = [{ rol: 'Operador', zonaCorporal: null }];
    const r = aReporte(f, [], draft().id, data, supervisor, ahora());
    expect(r.personas).toEqual([{ rol: 'Operador', zonaCorporal: null }]);
    expect(Object.keys(r.personas[0]!)).toEqual(['rol', 'zonaCorporal']);
  });
});
describe('Cola transaccional de Campo', () => {
  it('guarda y recupera borradores, sin guardado de datos bloqueados', async () => {
    const { cola } = context();
    await cola.guardarBorrador(draft());
    expect(await cola.borradores(supervisor)).toHaveLength(1);
    const b = draft();
    b.formulario.descripcion = 'DNI 12345678';
    await expect(cola.guardarBorrador(b)).rejects.toThrow();
    expect((await cola.borradores(supervisor))[0]?.formulario.descripcion).toContain('Prueba');
  });
  it('encolar elimina borrador atómicamente; autosave tardío no lo resucita', async () => {
    const { cola } = context();
    await cola.guardarBorrador(draft());
    await cola.encolar(envio());
    await cola.guardarBorrador(draft());
    expect(await cola.borradores(supervisor)).toHaveLength(0);
    expect(await cola.envios(supervisor)).toHaveLength(1);
    await expect(cola.encolar(envio())).rejects.toThrow('ya está');
  });
  it('offline no llama al adaptador; online crea una sola vez incluso con reintentos concurrentes', async () => {
    const { cola, source } = context();
    await cola.encolar(envio());
    const create = vi.spyOn(source, 'crearReporte');
    expect(await cola.sincronizar(source, supervisor, false)).toBe(0);
    expect(create).not.toHaveBeenCalled();
    await Promise.all([
      cola.sincronizar(source, supervisor, true),
      cola.sincronizar(source, supervisor, true),
    ]);
    await cola.sincronizar(source, supervisor, true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(await source.getEventos({ contexto: 'base+local' })).toHaveLength(226);
    expect(await source.getEventos()).toHaveLength(225);
    expect((await cola.envios(supervisor))[0]?.acuseLocal).toBe('LOCAL-reporte-test-0001');
  });
  it('error preserva contenido; reintento conserva el ID', async () => {
    const { cola, source } = context();
    await cola.encolar(envio());
    vi.spyOn(source, 'crearReporte').mockRejectedValueOnce(new Error('Fallo simulado'));
    expect(await cola.sincronizar(source, supervisor, true)).toBe(0);
    expect((await cola.envios(supervisor))[0]?.estado).toBe('error');
    expect(await cola.sincronizar(source, supervisor, true)).toBe(1);
    expect((await cola.envios(supervisor))[0]?.intentos).toBe(2);
  });
  it('filtra el proyecto y restablecer limpia también la nueva cola', async () => {
    const { cola, source } = context();
    await cola.encolar(envio());
    expect(await cola.envios({ ...supervisor, proyectoCodigo: 'CL' })).toEqual([]);
    await source.restablecerCambiosLocales(true);
    expect(await cola.envios(supervisor)).toEqual([]);
  });
  it('cuota agotada no produce éxito', async () => {
    const { cola, almacen } = context();
    vi.spyOn(almacen, 'abrir').mockRejectedValue(new Error('Cuota'));
    await expect(cola.guardarBorrador(draft())).rejects.toThrow('Cuota');
    await expect(cola.encolar(envio())).rejects.toThrow('Cuota');
  });
});
