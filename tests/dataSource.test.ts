import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StaticJsonDataSource } from '@/lib/data/StaticJsonDataSource';
import { SupabaseDataSource } from '@/lib/data/SupabaseDataSource';
import { crearDataSource } from '@/lib/data';
import { AlmacenLocal } from '@/lib/data/indexedDB';
import { data, reporte, supervisor, ssoma, ahora, archivo } from './fixtures';
let almacen: AlmacenLocal;
let source: StaticJsonDataSource;
beforeEach(() => {
  almacen = new AlmacenLocal(`test-${crypto.randomUUID()}`);
  source = new StaticJsonDataSource({
    almacen,
    ahora,
    fetcher: vi.fn(async () => new Response(JSON.stringify(data))),
  });
});
afterEach(async () => {
  await almacen.cerrar();
});
describe('StaticJsonDataSource y persistencia IndexedDB', () => {
  it('fetch y normalización preservan conteos, vínculos y valores oficiales', async () => {
    expect(await source.getEventos()).toHaveLength(225);
    expect(await source.getAcciones()).toHaveLength(168);
    expect(await source.getLecciones()).toHaveLength(22);
    expect(await source.getEventos({ anios: [2024] })).toHaveLength(155);
    expect(
      (await source.getIndicadores()).anual_por_ambito.find(
        (i) => i.anio === 2024 && i.ambito === 'PERU',
      )?.if,
    ).toBe(2.7098);
  });
  it('guarda y recupera un reporte con idempotencia, sin acuse de servidor', async () => {
    const r = reporte();
    const [a, b] = await Promise.all([
      source.crearReporte(r, supervisor),
      source.crearReporte(r, supervisor),
    ]);
    expect(a.id).toBe(b.id);
    expect(await source.getReportesLocales()).toHaveLength(1);
    expect((await source.getReportesLocales())[0]?.estadoCola).toBe('pendiente');
    expect(await source.getEventos({ contexto: 'base+local' })).toHaveLength(225);
    const resultado = await source.procesarColaLocal(supervisor);
    expect(resultado).toEqual({ registrados: 1, envioServidor: false });
    const locales = await source.getEventos({ contexto: 'base+local' });
    expect(locales).toHaveLength(226);
    expect(locales.find((e) => e.id === a.id)?.altoPotencial).toBeNull();
    expect(await source.procesarColaLocal(supervisor)).toEqual({
      registrados: 0,
      envioServidor: false,
    });
    expect(await source.getEventos()).toHaveLength(225);
  });
  it('un conflicto no sobrescribe el reporte anterior', async () => {
    await source.crearReporte(reporte(), supervisor);
    await expect(
      source.crearReporte({ ...reporte(), descripcion: 'Otro contenido de prueba' }, supervisor),
    ).rejects.toThrow('Conflicto');
    expect((await source.getReportesLocales())[0]?.payload.descripcion).toBe(reporte().descripcion);
  });
  it('recupera desde IndexedDB al crear un adaptador sin red', async () => {
    await source.getBase();
    await source.crearReporte(reporte(), supervisor);
    const offline = new StaticJsonDataSource({
      almacen,
      ahora,
      fetcher: vi.fn(async () => {
        throw new TypeError('Sin red');
      }),
    });
    expect(await offline.getEventos()).toHaveLength(225);
    expect(await offline.getReportesLocales()).toHaveLength(1);
    expect(offline.getAvisoPersistencia()).toContain('caché');
  });
  it('adjuntar no cierra; solo SSOMA distinto y alcance completo permiten cerrar', async () => {
    const a = await source.adjuntarEvidencia('AC-166', archivo(), supervisor);
    expect(
      (await source.getAcciones({ contexto: 'base+local' })).find((x) => x.id === 'AC-166')
        ?.estadoVerificado,
    ).toBe('Vencida');
    const validacion = {
      aceptada: true,
      motivo: 'Prueba sintética',
      alcanceCompleto: true,
      proyectosCubiertos: data.proyectos.map((p) => p.codigo),
    };
    await expect(source.validarEvidencia(a.id, validacion, supervisor)).rejects.toThrow('SSOMA');
    await expect(
      source.validarEvidencia(a.id, { ...validacion, proyectosCubiertos: ['EP'] }, ssoma),
    ).rejects.toThrow('alcance');
    await source.validarEvidencia(a.id, validacion, ssoma);
    expect(
      (await source.getAcciones({ contexto: 'base+local' })).find((x) => x.id === 'AC-166')
        ?.estadoVerificado,
    ).toBe('Cerrada con evidencia');
    expect((await source.getAcciones()).find((x) => x.id === 'AC-166')?.estadoVerificado).toBe(
      'Vencida',
    );
    expect(await source.getHistorial('AC-166')).toHaveLength(2);
    await expect(source.validarEvidencia(a.id, validacion, ssoma)).rejects.toThrow('ya tiene');
  });
  it('deduplica archivo reintentado y no trata EVD histórico como archivo local', async () => {
    const a = await source.adjuntarEvidencia('AC-166', archivo(), supervisor);
    const b = await source.adjuntarEvidencia('AC-166', archivo(), supervisor);
    expect(a.id).toBe(b.id);
    expect(await source.getEvidencias('AC-166')).toHaveLength(1);
    expect(await source.getEvidencias('AC-143')).toEqual([]);
  });
  it('rechaza auto-validación por el mismo rol y conserva un rechazo', async () => {
    const s = await source.adjuntarEvidencia('AC-143', archivo(), ssoma);
    await expect(
      source.validarEvidencia(
        s.id,
        { aceptada: true, motivo: 'Prueba', alcanceCompleto: true, proyectosCubiertos: ['UC'] },
        ssoma,
      ),
    ).rejects.toThrow('roles distintos');
    const a = await source.adjuntarEvidencia('AC-166', archivo(), supervisor);
    await source.validarEvidencia(
      a.id,
      { aceptada: false, motivo: 'Insuficiente', alcanceCompleto: false, proyectosCubiertos: [] },
      ssoma,
    );
    expect((await source.getEvidencias('AC-166'))[0]?.validacion?.aceptada).toBe(false);
  });
  it('no asigna acciones sin responsable al supervisor y no inventa éxitos sin almacenamiento', async () => {
    await expect(source.adjuntarEvidencia('AC-145', archivo(), supervisor)).rejects.toThrow(
      'función',
    );
    const sinAlmacen = new AlmacenLocal('error');
    vi.spyOn(sinAlmacen, 'abrir').mockRejectedValue(new Error('Cuota agotada'));
    const falla = new StaticJsonDataSource({
      almacen: sinAlmacen,
      ahora,
      fetcher: vi.fn(async () => new Response(JSON.stringify(data))),
    });
    await expect(falla.crearReporte(reporte(), supervisor)).rejects.toThrow('Cuota');
  });
  it('suscribe después de guardar y exige confirmar el restablecimiento', async () => {
    const cb = vi.fn();
    const unsubscribe = source.subscribe(cb);
    await source.crearReporte(reporte(), supervisor);
    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
    await source.procesarColaLocal(supervisor);
    expect(cb).toHaveBeenCalledTimes(1);
    await expect(source.restablecerCambiosLocales(false)).rejects.toThrow('Confirme');
    await source.restablecerCambiosLocales(true);
    expect(await source.getReportesLocales()).toEqual([]);
    expect(await source.getEventos()).toHaveLength(225);
  });
  it('stub Supabase y selector de entorno fallan explícitamente', async () => {
    expect(crearDataSource('static')).toBeInstanceOf(StaticJsonDataSource);
    expect(crearDataSource('supabase')).toBeInstanceOf(SupabaseDataSource);
    expect(() => crearDataSource('otro')).toThrow();
    await expect(new SupabaseDataSource().getEventos()).rejects.toThrow('no está conectado');
  });
});
