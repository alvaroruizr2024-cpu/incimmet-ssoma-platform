import { describe, expect, it } from 'vitest';
import { celdaCSV, crearCSV, nombreArchivo } from '@/lib/domain/exportacion';
import { filasDifusion, textoLeccion } from '@/lib/domain/lecciones';
import { base } from './fixtures';
describe('Exportaciones sin pérdida documental', () => {
  it.each(['=HYPERLINK("x")', '+cmd', '-cmd', '@SUM(A1)', ' \t=1+1'])('neutraliza %s', (s) =>
    expect(celdaCSV(s)).toBe(`"'${s.replace(/"/g, '""')}"`),
  );
  it('conserva números negativos, null, comillas y saltos', () => {
    expect(celdaCSV(-3)).toBe('"-3"');
    expect(celdaCSV(null)).toBe('"No consta"');
    expect(celdaCSV('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(crearCSV(['Campo'], [[null]], ['Corte documental'])).toBe(
      '\ufeff"Corte documental"\r\n"Campo"\r\n"No consta"',
    );
  });
  it('nombre de descarga no contiene separadores de ruta ni instrucciones', () =>
    expect(nombreArchivo('../../Estadística?*')).toBe('-Estadistica-'));
  it('todas las lecciones exportan causas, cinco niveles y fuentes completas', () => {
    for (const l of base.lecciones) {
      const filas = filasDifusion(l);
      expect(filas).toHaveLength(12);
      expect(filas[0]?.texto).toBe(l.quePaso);
      expect(filas.some((f) => f.titulo === 'SUSTITUCIÓN')).toBe(true);
      expect(filas.at(-1)?.texto).toBe(l.fuentes.join('\n'));
      expect(textoLeccion(l)).toContain(l.id.toLowerCase());
    }
  });
});
