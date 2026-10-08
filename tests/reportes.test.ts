import { describe, expect, it } from 'vitest';
import { validarReporte, validarArchivo, exigirPermisoEscritura } from '@/lib/domain/reportes';
import { data, reporte, supervisor, ahora, archivo } from './fixtures';
describe('Contrato de reporte anónimo', () => {
  it('valida reporte sin inferir false para potencial desconocido', () => {
    const r = reporte();
    expect(() => validarReporte(r, data, supervisor, ahora())).not.toThrow();
    expect(r.altoPotencial).toBeNull();
  });
  it('rechaza identidad extra, proyecto ajeno, fecha futura y foto PDF', () => {
    expect(() =>
      validarReporte(
        { ...reporte(), dni: 'NO GUARDAR' } as ReturnType<typeof reporte>,
        data,
        supervisor,
        ahora(),
      ),
    ).toThrow();
    expect(() =>
      validarReporte({ ...reporte(), proyectoCodigo: 'CL' }, data, supervisor, ahora()),
    ).toThrow();
    expect(() =>
      validarReporte({ ...reporte(), fecha: '2099-01-01' }, data, supervisor, ahora()),
    ).toThrow();
    expect(() =>
      validarReporte({ ...reporte(), fotos: [archivo()] }, data, supervisor, ahora()),
    ).toThrow();
  });
  it('no admite archivos vacíos, tipos ejecutables ni escritura de Gerencia', () => {
    expect(() => validarArchivo(new File([], 'vacio.pdf', { type: 'application/pdf' }))).toThrow();
    expect(() =>
      validarArchivo(new File(['x'], 'x.exe', { type: 'application/x-msdownload' })),
    ).toThrow();
    expect(() => exigirPermisoEscritura({ rol: 'Gerencia' })).toThrow();
    expect(() => validarArchivo(archivo())).not.toThrow();
  });
});
