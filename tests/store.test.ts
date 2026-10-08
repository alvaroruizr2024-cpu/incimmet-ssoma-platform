import { describe, expect, it } from 'vitest';
import { crearStoreFiltros } from '@/store/filtros';
import { inicioPorRol, rutaPermitida } from '@/lib/config/navegacion';
describe('Store y navegación demo', () => {
  it('cada instancia mantiene un estado independiente y distingue origen URL', () => {
    const a = crearStoreFiltros();
    const b = crearStoreFiltros();
    a.getState().actualizar({ anios: [2024] });
    expect(a.getState().origen).toBe('usuario');
    expect(b.getState().filtros).toEqual({});
    a.getState().desdeURL({ proyectos: ['CL'] });
    expect(a.getState().origen).toBe('url');
    a.getState().limpiar();
    expect(a.getState().filtros).toEqual({});
  });
  it('restringe módulos y define inicios por rol, sin simular autenticación', () => {
    expect(inicioPorRol('Supervisor de campo')).toBe('/campo');
    expect(inicioPorRol('SSOMA corporativo')).toBe('/analisis');
    expect(inicioPorRol('Gerencia')).toBe('/dashboard');
    expect(rutaPermitida('/analisis', 'Supervisor de campo')).toBe(false);
    expect(rutaPermitida('/configuracion/catalogos', 'Gerencia')).toBe(false);
    expect(rutaPermitida('/eventos/EV-2026-022', 'Supervisor de campo')).toBe(true);
    expect(rutaPermitida('/privacidad', 'Supervisor de campo')).toBe(true);
  });
});
