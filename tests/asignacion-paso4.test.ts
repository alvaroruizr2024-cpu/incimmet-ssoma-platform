import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StaticJsonDataSource } from '@/lib/data/StaticJsonDataSource';
import { AlmacenLocal } from '@/lib/data/indexedDB';
import { data, ssoma, ahora, archivo } from './fixtures';
let source: StaticJsonDataSource;
let almacen: AlmacenLocal;
beforeEach(() => {
  almacen = new AlmacenLocal(`paso4-${crypto.randomUUID()}`);
  source = new StaticJsonDataSource({
    almacen,
    ahora,
    fetcher: vi.fn(async () => new Response(JSON.stringify(data))),
  });
});
afterEach(async () => {
  source.detenerSimulacion();
  await almacen.cerrar();
});
describe('Asignación y reproducción mediante DataSource', () => {
  it('asignación explícita modifica solo la proyección local y conserva historial', async () => {
    await source.asignarAccion(
      'AC-001',
      'Supervisor de transporte',
      '2026-10-10',
      'Asignación sintética de prueba',
      ssoma,
    );
    const local = (await source.getBase('base+local')).acciones.find((a) => a.id === 'AC-001');
    expect(local?.responsableRol).toBe('Supervisor de transporte');
    expect(local?.estadoVerificado).toBe('Abierta');
    expect(local?.original.responsable_rol).toBeNull();
    expect(
      (await source.getBase('base')).acciones.find((a) => a.id === 'AC-001')?.responsableRol,
    ).toBeNull();
    expect((await source.getHistorial('AC-001')).some((h) => h.tipo === 'asignacion')).toBe(true);
  });
  it('no acepta roles no autorizados, No consta ni fechas inválidas', async () => {
    await expect(
      source.asignarAccion('AC-001', 'Supervisor', null, 'Prueba', { rol: 'Gerencia' }),
    ).rejects.toThrow('Solo SSOMA');
    await expect(
      source.asignarAccion('AC-001', 'No consta', null, 'Prueba', ssoma),
    ).rejects.toThrow('función');
    await expect(
      source.asignarAccion('AC-001', 'Supervisor', '2026-02-31', 'Prueba', ssoma),
    ).rejects.toThrow();
  });
  it('carga por supervisor y revisión SSOMA cierran localmente, nunca solo por archivo', async () => {
    await source.asignarAccion('AC-001', 'Supervisor de transporte', '2026-10-10', 'Prueba', ssoma);
    const a = await source.adjuntarEvidencia('AC-001', archivo(), {
      rol: 'Supervisor de campo',
      proyectoCodigo: 'CL',
      responsableRol: 'Supervisor de transporte',
    });
    expect(
      (await source.getBase('base+local')).acciones.find((x) => x.id === 'AC-001')
        ?.estadoVerificado,
    ).toBe('Abierta');
    await source.validarEvidencia(
      a.id,
      {
        aceptada: true,
        motivo: 'Solo prueba: archivo pertinente y alcance revisado',
        alcanceCompleto: true,
        proyectosCubiertos: ['CL'],
      },
      ssoma,
    );
    expect(
      (await source.getBase('base+local')).acciones.find((x) => x.id === 'AC-001')
        ?.estadoVerificado,
    ).toBe('Cerrada con evidencia');
    expect(
      (await source.getBase('base')).acciones.filter(
        (x) => x.estadoVerificado === 'Cerrada con evidencia',
      ),
    ).toHaveLength(3);
  });
  it('cambio de fecha guarda la asignación anterior en historial', async () => {
    await source.asignarAccion('AC-001', 'Supervisor', '2026-10-10', 'Primera', ssoma);
    await source.asignarAccion(
      'AC-001',
      'Jefatura',
      '2026-10-20',
      'Reprogramación de prueba',
      ssoma,
    );
    expect((await source.getHistorial('AC-001')).at(-1)?.descripcion).toContain('2026-10-10');
    await source.restablecerCambiosLocales(true);
    expect(
      (await source.getBase('base+local')).acciones.find((a) => a.id === 'AC-001')?.responsableRol,
    ).toBeNull();
  });
  it('subscribe entrega un evento original y getBase(reproduccion) lo proyecta', async () => {
    const cb = vi.fn();
    const unsubscribe = source.subscribe(cb);
    await source.iniciarSimulacion(10000);
    source.pausarSimulacion();
    source.avanzarSimulacion();
    expect(
      cb.mock.calls.some(([c]) => c.tipo === 'simulacion' && c.evento?.id === 'EV-2026-001'),
    ).toBe(true);
    expect((await source.getBase('reproduccion')).eventos).toHaveLength(1);
    expect((await source.getBase('base')).eventos).toHaveLength(225);
    source.detenerSimulacion();
    expect((await source.getBase('reproduccion')).eventos).toHaveLength(0);
    unsubscribe();
  });
});
