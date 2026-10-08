import { describe, expect, it } from 'vitest';
import { base } from './fixtures';
import { resumenPresentacion } from '@/lib/domain/presentacion';
import {
  ACENTOS_ESCENA,
  ENCUADRES,
  ESCENAS,
  MIRADA_LIBRE,
  OPTICA,
  VENTANA_MOMENTO,
  acentoEscena,
  desplazamientoMirada,
  opticaCamara,
  presenciaMomento,
  velocidadNarrativa,
} from '@/lib/domain/cinematica';
import {
  buscarDato,
  catalogoInteractivo,
  datosDeEscena,
  mismaReferencia,
  vecinoEnEscena,
  type TipoDato,
} from '@/lib/domain/interactivos3d';
import { useRelato3D } from '@/store/relato3d';

const data = resumenPresentacion(base);
const catalogo = catalogoInteractivo(data);
const porTipo = (tipo: TipoDato) => catalogo.filter((d) => d.tipo === tipo);

describe('Óptica, presencia y acentos derivados del progreso', () => {
  it('cierra la lente en cada pausa y la abre en los tramos y en la salida', () => {
    for (let i = 0; i < ENCUADRES.length - 1; i++)
      expect(opticaCamara(i / 7).fov).toBeCloseTo(OPTICA.fovPausa, 5);
    expect(opticaCamara(1).fov).toBeCloseTo(OPTICA.fovSalida, 5);
    expect(opticaCamara(2.5 / 7).fov).toBeGreaterThan(OPTICA.fovPausa + 5);
    for (let i = 0; i <= 200; i++) {
      const { fov, balanceo } = opticaCamara(i / 200);
      expect(fov).toBeGreaterThanOrEqual(OPTICA.fovPausa - 1e-9);
      expect(fov).toBeLessThanOrEqual(OPTICA.fovSalida + 1e-9);
      expect(Math.abs(balanceo)).toBeLessThanOrEqual(OPTICA.balanceoMax);
    }
    expect(opticaCamara(NaN).fov).toBeCloseTo(OPTICA.fovPausa, 5);
    expect(opticaCamara(0).balanceo).toBe(0);
  });
  it('la presencia es plena en la pausa, nula fuera de la ventana y crece al acercarse', () => {
    expect(presenciaMomento(0, 0)).toBe(1);
    expect(presenciaMomento(3, 3 / 7)).toBe(1);
    expect(presenciaMomento(3, 0)).toBe(0);
    expect(presenciaMomento(2, (2 - VENTANA_MOMENTO) / 7)).toBe(0);
    expect(presenciaMomento(2, 1.6 / 7)).toBeCloseTo(presenciaMomento(2, 2.4 / 7), 6);
    let previa = 0;
    for (let paso = 100; paso <= 200; paso++) {
      const actual = presenciaMomento(2, paso / 100 / 7);
      expect(actual).toBeGreaterThanOrEqual(previa - 1e-9);
      expect(actual).toBeLessThanOrEqual(1);
      previa = actual;
    }
    expect(presenciaMomento(1, NaN)).toBe(presenciaMomento(1, 0));
  });
  it('ocho acentos válidos que se mezclan en el tramo de avance', () => {
    expect(ACENTOS_ESCENA).toHaveLength(ESCENAS.length);
    for (const color of ACENTOS_ESCENA) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(acentoEscena(0)).toEqual({
      desde: ACENTOS_ESCENA[0],
      hasta: ACENTOS_ESCENA[1],
      mezcla: 0,
    });
    expect(acentoEscena(1)).toEqual({
      desde: ACENTOS_ESCENA[7],
      hasta: ACENTOS_ESCENA[7],
      mezcla: 0,
    });
    const medio = acentoEscena(3.5 / 7);
    expect(medio.desde).toBe(ACENTOS_ESCENA[3]);
    expect(medio.hasta).toBe(ACENTOS_ESCENA[4]);
    expect(medio.mezcla).toBeGreaterThan(0.3);
    expect(medio.mezcla).toBeLessThan(0.7);
  });
  it('la mirada libre está acotada, ignora valores no finitos y se anula al desactivarse', () => {
    expect(desplazamientoMirada([0, 0])).toEqual({ objetivo: [0, 0], posicion: [0, 0] });
    expect(desplazamientoMirada([NaN, Infinity])).toEqual({ objetivo: [0, 0], posicion: [0, 0] });
    const extremo = desplazamientoMirada([5, -5]);
    expect(extremo.objetivo).toEqual([MIRADA_LIBRE.objetivoX, -MIRADA_LIBRE.objetivoY]);
    expect(Math.abs(extremo.posicion[0])).toBeLessThan(0.5);
    expect(desplazamientoMirada([1, 1], false)).toEqual({ objetivo: [0, 0], posicion: [0, 0] });
  });
  it('la velocidad narrativa va de 0 a 1 y no propaga NaN', () => {
    expect(velocidadNarrativa(0, 0, 0.016)).toBe(0);
    expect(velocidadNarrativa(0, 1, 0.016)).toBe(1);
    expect(velocidadNarrativa(0.1, 0.1 + 0.35 * 0.5, 0.5)).toBeCloseTo(1, 6);
    expect(velocidadNarrativa(NaN, 0.2, 0.016)).toBe(0);
  });
});

describe('Catálogo interactivo derivado del resumen', () => {
  it('una entrada por evento, proyecto, indicador, baliza, acción y estación', () => {
    expect(porTipo('evento')).toHaveLength(225);
    expect(porTipo('proyecto')).toHaveLength(12);
    expect(porTipo('indicador')).toHaveLength(3);
    expect(porTipo('baliza')).toHaveLength(6);
    expect(porTipo('accion')).toHaveLength(168);
    expect(porTipo('estacion')).toHaveLength(6);
    expect(porTipo('portal')).toHaveLength(1);
    expect(porTipo('leccion')).toHaveLength(1);
    expect(new Set(catalogo.map((d) => `${d.tipo}:${d.clave}`)).size).toBe(catalogo.length);
  });
  it('cada dato nombra su escena, su texto y su destino sin valores nulos', () => {
    for (const d of catalogo) {
      expect(d.escena).toBeGreaterThanOrEqual(0);
      expect(d.escena).toBeLessThan(ESCENAS.length);
      expect(d.titulo.trim()).not.toBe('');
      expect(d.lineas.length).toBeGreaterThan(0);
      expect(d.lineas.join(' ')).not.toMatch(/null|undefined|NaN/);
      expect(d.href.startsWith('/')).toBe(true);
    }
  });
  it('los enlaces abren la ficha o el filtro exacto del dato', () => {
    const evento = buscarDato(catalogo, { tipo: 'evento', clave: 'EV-2026-022', escena: 1 });
    expect(evento?.href).toBe('/eventos/EV-2026-022');
    expect(evento?.enlace).toBe('directo');
    const cerroLindo = catalogo.find((d) => d.tipo === 'proyecto' && d.clave === 'CL');
    expect(cerroLindo?.href).toBe('/eventos?proyectos=%22CL%22');
    expect(cerroLindo?.lineas).toContain('138 registros documentados');
    const indicador = catalogo.find((d) => d.tipo === 'indicador' && d.clave === 'IF');
    expect(indicador?.lineas[0]).toBe('2.71');
    expect(indicador?.enlace).toBe('contexto');
    expect(catalogo.find((d) => d.tipo === 'accion')?.href).toMatch(/^\/acciones\?accion=/);
    expect(buscarDato(catalogo, null)).toBeNull();
  });
  it('el recorrido por escena es circular y empieza por el primer dato', () => {
    const eventos = datosDeEscena(catalogo, 1);
    expect(eventos).toHaveLength(225);
    expect(vecinoEnEscena(catalogo, null, 1, 1)).toEqual(eventos[0]);
    expect(vecinoEnEscena(catalogo, null, 1, -1)).toEqual(eventos[224]);
    expect(vecinoEnEscena(catalogo, eventos[224] ?? null, 1, 1)).toEqual(eventos[0]);
    expect(vecinoEnEscena(catalogo, eventos[0] ?? null, 1, -1)).toEqual(eventos[224]);
    expect(vecinoEnEscena(catalogo, null, 99, 1)).toBeNull();
    const primero = eventos[0]!;
    expect(mismaReferencia(primero, { ...primero, escena: 2 })).toBe(false);
    expect(mismaReferencia(primero, { ...primero })).toBe(true);
  });
  it('cambiar el conjunto cambia el catálogo: no hay conteos fijos', () => {
    const reducido = catalogoInteractivo(
      resumenPresentacion({
        ...base,
        eventos: base.eventos.slice(0, 9),
        acciones: [],
        proyectos: base.proyectos.slice(0, 2),
      }),
    );
    expect(reducido.filter((d) => d.tipo === 'evento')).toHaveLength(9);
    expect(reducido.filter((d) => d.tipo === 'accion')).toHaveLength(0);
    expect(reducido.filter((d) => d.tipo === 'proyecto')).toHaveLength(2);
  });
});

describe('Estado compartido canvas–DOM', () => {
  it('no avisa cuando el hover no cambia; fijar guarda el foco y limpiar lo retira', () => {
    let avisos = 0;
    const baja = useRelato3D.subscribe(() => avisos++);
    const ref = { tipo: 'evento' as const, clave: 'EV-2026-022', escena: 1 };
    const relato = useRelato3D.getState();
    relato.fijarHover(ref);
    relato.fijarHover({ ...ref });
    expect(avisos).toBe(1);
    relato.fijarHover(null);
    relato.fijarHover(null);
    expect(avisos).toBe(2);
    relato.seleccionar(ref, [1, 2, 3]);
    expect(useRelato3D.getState().foco).toEqual([1, 2, 3]);
    expect(useRelato3D.getState().seleccion).toEqual(ref);
    relato.seleccionar(null);
    expect(useRelato3D.getState().foco).toBeNull();
    expect(avisos).toBe(4);
    baja();
  });
});
