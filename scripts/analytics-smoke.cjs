/* Regression tests for actual compiled domain/client helpers; not a replacement for Vitest/Next. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const m = (n) => require(path.join(root, '.verification/domain/lib', n + '.js'));
const raw = JSON.parse(fs.readFileSync(path.join(root, 'public/data/data.json'), 'utf8'));
const base = m('data/normalizar').normalizarDocumento(
  m('data/validarDocumento').validarDocumento(raw),
);
const a = m('domain/analitica'),
  f = m('domain/filtros'),
  charts = m('analytics/modelos'),
  ex = m('domain/exportacion');
const cine = m('domain/cinematica'),
  moments = m('domain/momentos3d'),
  present = m('domain/presentacion'),
  lessons = m('domain/lecciones');
const rp = m('domain/reproduccion'),
  text = m('domain/textoCanvas');
const before = JSON.stringify(base);
let passed = 0,
  failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error('FAIL', name, e.stack);
  }
}
function near(a, b) {
  assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
}
test('KPIs completos y parciales', () => {
  const k = a.resumenKPIs(base.eventos, base.acciones);
  assert.equal(k.eventos, 225);
  assert.equal(k.accidentes, 55);
  assert.equal(k.hpri, 6);
  assert.equal(k.diasPerdidos.valor, 189);
  assert.equal(k.diasPerdidos.conDato, 6);
  assert.equal(k.diasPerdidos.sinDato, 219);
  assert.equal(k.cumplimiento.total, 168);
  assert.equal(k.cumplimiento.cerradas, 3);
  assert.equal(k.cumplimiento.cierresImportadosParciales, 2);
  assert.equal(k.porNivel.at(-1).etiqueta, 'No consta');
});
test('cohorte anterior al estado', () => {
  const s = f.seleccionarCruzado(base.eventos, base.acciones, base.lecciones, {
    estadosAccion: ['Cerrada con evidencia'],
  });
  assert.equal(s.acciones.length, 3);
  near(a.resumenKPIs(s.eventos, s.cohorteAcciones).cumplimiento.porcentajeCierre, (3 / 168) * 100);
});
test('sin duplicados', () =>
  assert.equal(a.resumenKPIs([...base.eventos, ...base.eventos], base.acciones).eventos, 225));
test('matriz completa y faltantes', () => {
  const x = a.matrizSeveridad(base.eventos);
  assert.equal(x.completos, 179);
  assert.equal(x.faltantes, 46);
  assert.equal(x.filas.length, 64);
  assert.equal(
    x.filas.reduce((s, r) => s + (r.cantidad ?? 0), 0),
    225,
  );
});
test('calor 2026', () => {
  const x = charts.modeloCalor(
    base.eventos,
    base.proyectos.map((p) => p.codigo),
    2026,
  );
  assert.equal(x.puntos.length, 144);
  assert.equal(
    x.puntos.reduce((s, r) => s + (r.valor ?? 0), 0),
    52,
  );
});
test('cobertura año proyecto', () => {
  const c = charts.modeloCobertura(base);
  assert.equal(c.puntos.length, 216);
  assert.equal(c.puntos.find((p) => p.x === '2020' && p.y === 'CL').valor, null);
});
for (const campo of [
  'tipo',
  'riesgoCritico',
  'actividad',
  'equipo',
  'causasInmediatas',
  'causasBasicas',
])
  test(`Pareto ${campo}`, () => {
    const x = charts.modeloPareto(base.eventos, campo, campo);
    assert.equal(x.puntos.at(-1)?.acumulado, 100);
    for (const p of x.puntos) assert.equal(p.valor, p.filtros.eventoIds.length);
  });
test('tendencia anual', () => {
  const x = charts.modeloTendencia(base.eventos, 'anual');
  assert.equal(
    x.puntos.filter((p) => p.etiqueta === '2024').reduce((s, p) => s + (p.valor ?? 0), 0),
    155,
  );
});
test('tendencia mensual sin fecha inventada', () =>
  assert.equal(
    charts.modeloTendencia(base.eventos, 'mensual').puntos.reduce((s, p) => s + (p.valor ?? 0), 0),
    224,
  ));
for (const por of ['evento', 'proyecto'])
  test(`cumplimiento ${por}`, () => {
    const x = charts.modeloCumplimiento(base.acciones, por);
    assert.equal(
      x.puntos.reduce((s, p) => s + (p.valor ?? 0), 0),
      168,
    );
    assert.equal(
      x.puntos
        .filter((p) => p.serie === 'Cerrada con evidencia')
        .reduce((s, p) => s + (p.valor ?? 0), 0),
      3,
    );
  });
test('declaraciones explícitas no incluyen cierres sin declaración', () =>
  assert.equal(
    a.cumplimientoComparado(base.acciones).reduce((s, r) => s + r.declaradas, 0),
    13,
  ));
test('proyecto sin acciones no genera porcentaje cero', () =>
  assert.equal(
    a.cumplimientoComparado(base.acciones, ['SM']).find((p) => p.proyecto === 'SM')
      .porcentajeCierre,
    null,
  ));
test('nulos literales eventos', () => {
  const q = a.calidadCampos(base, 'eventos').find((f) => f.campo === 'dias_perdidos');
  assert.equal(q.nulos, 219);
  assert.equal(q.eventoIdsNulos.length, 219);
});
test('listas vacías no son nulos', () => {
  const q = a.calidadCampos(base, 'acciones').find((f) => f.campo === 'evidencias');
  assert.equal(q.vacios, 164);
  assert.equal(q.nulos, 0);
});
test('No consta textual', () => {
  const q = a.calidadCampos(base, 'acciones').find((f) => f.campo === 'responsable_rol');
  assert.equal(q.nulos, 151);
  assert.equal(q.noConsta, 3);
});
test('nulos anidados lecciones', () =>
  assert.equal(
    a.calidadCampos(base, 'lecciones').find((f) => f.campo === 'controles.sustitucion').nulos,
    16,
  ));
test('avisos calculados', () =>
  assert.ok(
    a
      .avisosCalidad({ ...base, eventos: [], acciones: [] })
      .some((s) => s.includes('0 registros recuperados')),
  ));
test('tupla cruzada idempotente al repetir', () =>
  assert.deepEqual(
    a.seleccionarMarca({ anios: [2024], proyectos: ['CL'] }, { anios: [2024], proyectos: ['CL'] }),
    {},
  ));
test('tupla conserva dimensiones no relacionadas', () =>
  assert.deepEqual(a.seleccionarMarca({ anios: [2024] }, { proyectos: ['CL'] }), {
    anios: [2024],
    proyectos: ['CL'],
  }));
test('ID y ruta escapados', () => assert.equal(a.eventHref('EV/1?'), '/eventos/EV%2F1%3F'));
test('ruta local separada del documento', () =>
  assert.equal(a.eventHref('LOCAL-123'), '/eventos/local?id=LOCAL-123'));
test('vacío no genera NaN', () => {
  assert.equal(a.resumenKPIs([], []).cumplimiento.porcentajeCierre, null);
  assert.deepEqual(charts.modeloPareto([], 'tipo', 'Vacío').puntos, []);
});
for (const s of ['=1+1', '+cmd', '-cmd', '@SUM(A1)', ' \t=1'])
  test(`CSV neutralizado ${s}`, () => assert.ok(ex.celdaCSV(s).startsWith('"\'')));
test('CSV número negativo preservado', () => assert.equal(ex.celdaCSV(-3), '"-3"'));
test('CSV nulo y escapado', () => {
  assert.equal(ex.celdaCSV(null), '"No consta"');
  assert.equal(ex.celdaCSV('a,"b"\nc'), '"a,""b""\nc"');
});
test('CSV contexto y BOM', () =>
  assert.equal(
    ex.crearCSV(['Campo'], [[null]], ['Corte']),
    '\ufeff"Corte"\r\n"Campo"\r\n"No consta"',
  ));
test('nombre de fichero seguro', () =>
  assert.equal(ex.nombreArchivo('../../Estadística?*'), '-Estadistica-'));
test('fichas de las 22 lecciones sin cortes de campos', () => {
  for (const l of base.lecciones) {
    const rows = lessons.filasDifusion(l);
    assert.equal(rows.length, 12);
    assert.equal(rows.at(-1).texto, l.fuentes.join('\n'));
    assert.ok(lessons.textoLeccion(l).includes(l.id.toLowerCase()));
  }
});
test('wrap no recorta palabras largas', () =>
  assert.deepEqual(
    text.partirLineas('abcdef gh', 3, (t) => t.length),
    ['abc', 'def', 'gh'],
  ));
test('wrap ancho inválido', () =>
  assert.throws(() => text.partirLineas('texto', 0, (t) => t.length)));
const story = present.resumenPresentacion(base);
test('225 instancias de eventos reproducibles', () => {
  assert.equal(moments.lucesEventos(story).length, 225);
  assert.deepEqual(moments.lucesEventos(story), moments.lucesEventos(story));
});
test('168 tarjetas y 3 verdes', () => {
  const cards = moments.tarjetasEvidencia(story);
  assert.equal(cards.length, 168);
  assert.equal(cards.filter((c) => c.color === '#00B050').length, 3);
});
test('12 estaciones y CL mayor', () => {
  const p = moments.estacionesProyectos(story);
  assert.equal(p.length, 12);
  assert.equal(p[0].codigo, 'CL');
  assert.ok(p.every((x) => x.altura <= p[0].altura));
});
test('indicadores originales usados en 3D', () =>
  assert.deepEqual(
    moments.panelesIndicadores(story).map((p) => p.valor),
    [2.7098, 283.92, 0.7694],
  ));
test('6 HPRI y 6 estaciones de ciclo', () => {
  assert.equal(story.balizas.length, 6);
  assert.equal(story.ciclo.length, 6);
});
test('geometría sigue cambios de datos', () => {
  const x = present.resumenPresentacion({
    ...base,
    eventos: base.eventos.slice(0, 9),
    acciones: [],
    lecciones: [],
    proyectos: base.proyectos.slice(0, 2),
  });
  assert.equal(moments.lucesEventos(x).length, 9);
  assert.equal(moments.tarjetasEvidencia(x).length, 0);
  assert.equal(moments.estacionesProyectos(x).length, 2);
});
test('ocho momentos de cámara únicos', () => {
  assert.equal(new Set(cine.ENCUADRES.map((x) => x.posicion[2])).size, 8);
  cine.ENCUADRES.forEach((e, i) => assert.deepEqual(cine.poseCamara(i / 7), e));
});
for (const [active, warm, moving, out] of [
  [true, true, true, false],
  [false, false, true, false],
  [true, false, false, false],
  [true, false, true, true],
])
  test(`medición ${active}/${warm}/${moving}`, () =>
    assert.equal(cine.puedeMedirRendimiento(active, warm, moving), out));
test('fallos diferenciados y recuperables', () =>
  assert.ok(cine.MENSAJES_FALLBACK.rendimiento.includes('reintentar')));
test('reproducción por IDs originales: 52, sin persistencia ni duplicados', () => {
  const received = [];
  const r = new rp.ReproductorDocumental((e) => {
    if (e) received.push(e.id);
  });
  try {
    r.iniciar(base.eventos, 2026, 10000);
    r.pausar();
    for (let k = 0; k < 53; k++) r.avanzar();
    const state = r.snapshot();
    assert.equal(state.visibles.length, 52);
    assert.equal(new Set(received).size, 52);
    assert.equal(state.estado, 'finalizada');
    state.visibles.push('alteracion');
    assert.equal(r.snapshot().visibles.length, 52);
    r.detener();
    assert.equal(r.snapshot().visibles.length, 0);
  } finally {
    r.detener();
  }
});
test('reproducción vacía finaliza', () => {
  const r = new rp.ReproductorDocumental(() => {});
  r.iniciar([]);
  assert.equal(r.snapshot().estado, 'finalizada');
  r.detener();
});
test('fuente y valores íntegros tras las agregaciones', () =>
  assert.equal(JSON.stringify(base), before));
console.log(`PASO 4 — ${passed}/${passed + failed} pruebas portables aprobadas; ${failed} fallos.`);
console.log(
  `Node ${process.version}; dominio, modelos y utilidades cliente compilados con TypeScript estricto. No equivale a Vitest, Next.js ni WebGL.`,
);
process.exitCode = failed ? 1 : 0;
