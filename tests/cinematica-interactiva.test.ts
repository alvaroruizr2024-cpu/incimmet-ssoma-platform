import { describe, expect, it } from 'vitest';
import { base } from './fixtures';
import { resumenPresentacion } from '@/lib/domain/presentacion';
import {
  ACENTOS_ESCENA,
  APERTURA,
  ENCUADRES,
  ESCENAS,
  GIRO,
  MAX_ANCLAS,
  MIRADA_LIBRE,
  OPTICA,
  RECORRIDO,
  RESPIRACION,
  VENTANA_MOMENTO,
  acentoEscena,
  anclasVisibles,
  aperturaCamara,
  desplazamientoMirada,
  distribuirAnclas,
  giroDesdeArrastre,
  giroHaciaReposo,
  opticaCamara,
  posicionRecorrido,
  presenciaMomento,
  pulsoMarcador,
  realceLlegada,
  respiracionCamara,
  velocidadNarrativa,
  type AnclaProyectada,
  type CajaAncla,
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

describe('Apertura, reposo, gestos y recorrido automático', () => {
  it('la apertura parte desde atrás y en negro, y termina en el encuadre con exposición plena', () => {
    const inicio = aperturaCamara(0);
    expect(inicio.retroceso).toBe(APERTURA.retroceso);
    expect(inicio.descenso).toBe(APERTURA.descenso);
    expect(inicio.exposicion).toBe(0);
    expect(inicio.terminada).toBe(false);
    const fin = aperturaCamara(APERTURA.duracion);
    expect(fin).toEqual({ retroceso: 0, descenso: 0, fovExtra: 0, exposicion: 1, terminada: true });
    expect(aperturaCamara(99)).toEqual(fin);
    let previo = aperturaCamara(0);
    for (let i = 1; i <= 100; i++) {
      const actual = aperturaCamara((i / 100) * APERTURA.duracion);
      expect(actual.retroceso).toBeLessThanOrEqual(previo.retroceso + 1e-9);
      expect(actual.exposicion).toBeGreaterThanOrEqual(previo.exposicion - 1e-9);
      previo = actual;
    }
    expect(aperturaCamara(NaN).exposicion).toBe(0);
  });
  it('la respiración en reposo queda dentro de milímetros y no propaga NaN', () => {
    for (let t = 0; t < 60; t += 0.37) {
      const r = respiracionCamara(t);
      expect(Math.abs(r.x)).toBeLessThanOrEqual(RESPIRACION.x);
      expect(Math.abs(r.y)).toBeLessThanOrEqual(RESPIRACION.y);
      expect(Math.abs(r.giro)).toBeLessThanOrEqual(RESPIRACION.giro);
    }
    expect(respiracionCamara(NaN)).toEqual(respiracionCamara(0));
  });
  it('el giro por arrastre está acotado, ignora valores no finitos y vuelve al reposo', () => {
    const quieto = { yaw: 0, pitch: 0 };
    const hacia = giroDesdeArrastre(quieto, 100, 0, 1000);
    expect(hacia.yaw).toBeCloseTo(-0.17, 6);
    expect(hacia.pitch).toBe(0);
    const tope = giroDesdeArrastre(quieto, -100000, 100000, 1000);
    expect(tope).toEqual({ yaw: GIRO.maxYaw, pitch: GIRO.maxPitch });
    expect(giroDesdeArrastre(quieto, NaN, Infinity, 0)).toEqual(quieto);
    const relajado = giroHaciaReposo({ yaw: 0.5, pitch: -0.2 }, 1);
    expect(Math.abs(relajado.yaw)).toBeLessThan(0.5);
    expect(Math.abs(relajado.pitch)).toBeLessThan(0.2);
    expect(Math.sign(relajado.yaw)).toBe(1);
    expect(giroHaciaReposo({ yaw: NaN, pitch: 0.1 }, 10).yaw).toBe(0);
  });
  it('el realce de llegada es nulo en las pausas y se enciende al asentarse la cámara', () => {
    for (let i = 0; i < ENCUADRES.length; i++) expect(realceLlegada(i / 7)).toBe(0);
    expect(realceLlegada(0.86 / 7)).toBeCloseTo(1, 9);
    expect(realceLlegada(0.5 / 7)).toBe(0);
    for (let i = 0; i <= 500; i++) {
      const r = realceLlegada(i / 500);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
    expect(realceLlegada(NaN)).toBe(0);
  });
  it('el recorrido viaja, hace pausa y termina en la última escena', () => {
    const ciclo = RECORRIDO.viaje + RECORRIDO.pausa;
    expect(posicionRecorrido(0, 8)).toEqual({ desde: 0, hasta: 1, mezcla: 0, fin: false });
    const medio = posicionRecorrido(RECORRIDO.viaje / 2, 8);
    expect(medio.desde).toBe(0);
    expect(medio.hasta).toBe(1);
    expect(medio.mezcla).toBeCloseTo(0.5, 6);
    expect(posicionRecorrido(RECORRIDO.viaje + 1, 8).mezcla).toBe(1);
    expect(posicionRecorrido(ciclo * 3 + 0.1, 8).desde).toBe(3);
    expect(posicionRecorrido(ciclo * 7, 8)).toEqual({ desde: 7, hasta: 7, mezcla: 1, fin: true });
    expect(posicionRecorrido(0, 8, 7).fin).toBe(true);
    expect(posicionRecorrido(0, 8, 5).desde).toBe(5);
    expect(posicionRecorrido(NaN, NaN).fin).toBe(true);
  });
  it('las anclas visibles están delante y dentro del encuadre, cercanas primero y acotadas', () => {
    const anclas: AnclaProyectada[] = [
      { clave: 'lejos', x: 0.5, y: 0.5, profundidad: 0.9, delante: true },
      { clave: 'cerca', x: 0.2, y: 0.4, profundidad: 0.1, delante: true },
      { clave: 'fuera', x: 1.4, y: 0.5, profundidad: 0.2, delante: true },
      { clave: 'detras', x: 0.5, y: 0.5, profundidad: 1.2, delante: false },
      { clave: 'nan', x: NaN, y: 0.5, profundidad: 0.2, delante: true },
    ];
    expect(anclasVisibles(anclas).map((a) => a.clave)).toEqual(['cerca', 'lejos']);
    expect(anclasVisibles(anclas, 1).map((a) => a.clave)).toEqual(['cerca']);
    const muchas = Array.from({ length: 30 }, (_, i) => ({
      clave: String(i),
      x: 0.5,
      y: 0.5,
      profundidad: i / 30,
      delante: true,
    }));
    expect(anclasVisibles(muchas)).toHaveLength(MAX_ANCLAS);
    expect(anclasVisibles([], 0)).toEqual([]);
  });
  it('los rótulos se reparten sin solaparse ni salir del encuadre y la más cercana conserva su sitio', () => {
    const caja = (clave: string, x: number, y: number, preferida?: number): CajaAncla => ({
      clave,
      x,
      y,
      ancho: 150,
      alto: 36,
      preferida,
    });
    const reparto = distribuirAnclas(
      [caja('a', 400, 300), caja('b', 410, 305), caja('c', 420, 310), caja('d', 900, 600)],
      1440,
      900,
    );
    expect(reparto.get('a')).toEqual({ x: 400, y: 300, opcion: 0 });
    expect(reparto.get('d')).toEqual({ x: 900, y: 600, opcion: 0 });
    expect(reparto.size).toBe(4);
    const cajasColocadas = [...reparto.values()].map((s) => ({
      x: s.x - 16,
      y: s.y - 18,
      ancho: 150,
      alto: 36,
    }));
    for (let i = 0; i < cajasColocadas.length; i++)
      for (let j = i + 1; j < cajasColocadas.length; j++) {
        const p = cajasColocadas[i]!,
          q = cajasColocadas[j]!;
        const separadas =
          p.x + p.ancho <= q.x ||
          q.x + q.ancho <= p.x ||
          p.y + p.alto <= q.y ||
          q.y + q.alto <= p.y;
        expect(separadas).toBe(true);
      }
    // Una caja ocupada (el texto de la escena) desplaza el rótulo o lo omite si no cabe.
    const texto = { x: 0, y: 0, ancho: 700, alto: 900 };
    expect(distribuirAnclas([caja('t', 400, 300)], 1440, 900, 6, [texto]).size).toBe(0);
    const junto = distribuirAnclas([caja('u', 712, 300)], 1440, 900, 6, [texto]).get('u');
    expect(junto?.opcion).toBe(4);
    // Sin hueco en un encuadre minúsculo, el rótulo se omite en vez de salirse.
    expect(distribuirAnclas([caja('x', 5, 5)], 120, 60).size).toBe(0);
    // La opción recordada se conserva mientras siga libre.
    expect(distribuirAnclas([caja('p', 400, 300, 2)], 1440, 900).get('p')?.opcion).toBe(2);
    expect(distribuirAnclas([caja('n', NaN, 300)], 1440, 900).size).toBe(0);
  });
  it('el marcador pulsa dentro de límites y crece al señalar o fijar', () => {
    for (let t = 0; t < 10; t += 0.1) {
      const quieto = pulsoMarcador(t, 2, 0);
      expect(quieto.escala).toBeGreaterThanOrEqual(1);
      expect(quieto.escala).toBeLessThanOrEqual(1.18 + 1e-9);
      expect(quieto.opacidad).toBeLessThanOrEqual(0.7 + 1e-9);
      const fijado = pulsoMarcador(t, 2, 1);
      expect(fijado.escala).toBeGreaterThan(quieto.escala);
      expect(fijado.opacidad).toBeLessThanOrEqual(1);
    }
    expect(pulsoMarcador(NaN, NaN, NaN).opacidad).toBeGreaterThan(0);
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
