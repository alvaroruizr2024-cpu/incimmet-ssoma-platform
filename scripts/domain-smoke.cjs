/* Pruebas sin dependencias de ejecución: usar después de tsc -p tsconfig.domain.json. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const compiled = (name) => require(path.join(root, '.verification/domain/lib', name));
const { validarDocumento } = compiled('data/validarDocumento.js');
const { normalizarDocumento } = compiled('data/normalizar.js');
const i = compiled('domain/indicadores.js');
const e = compiled('domain/estadoVerificado.js');
const f = compiled('domain/filtros.js');
const a = compiled('domain/agregaciones.js');
const u = compiled('domain/filtrosURL.js');
const d = compiled('domain/fechas.js');
const r = compiled('domain/reportes.js');
const { serializarEstable } = compiled('domain/serializar.js');
let pruebas = 0,
  fallos = 0;
function test(nombre, fn) {
  pruebas++;
  try {
    fn();
  } catch (error) {
    fallos++;
    console.error(`FALLO ${nombre}: ${error.message}`);
  }
}
function cerca(real, esperado, tolerancia = 1e-8) {
  assert.ok(Math.abs(real - esperado) <= tolerancia, `${real} != ${esperado}`);
}
const raw = JSON.parse(fs.readFileSync(path.join(root, 'public/data/data.json'), 'utf8'));
const antes = JSON.stringify(raw);
const data = validarDocumento(raw),
  base = normalizarDocumento(data),
  corte = data.meta.fecha_corte_estados;
test('no mutación de origen', () => assert.equal(JSON.stringify(raw), antes));
for (const [key, n] of Object.entries(data.meta.conteos))
  test(`conteo ${key}`, () => assert.equal(data[key].length, n));
test('IF oficial exacto', () =>
  assert.equal(i.indicadoresOficiales(data.indicadores, 2024, 'PERU')[0].if, 2.7098));
test('IF recalculado independiente', () => {
  cerca(i.calcularIF(9, 3321332), 2.7097562, 1e-7);
  assert.notEqual(i.calcularIF(9, 3321332), 2.7098);
});
test('IS propio numerador', () => cerca(i.calcularIS(943, 3321332), 283.922233609889));
test('IA producto', () => cerca(i.calcularIA(2.7098, 283.92), 0.769366416));
test('TRIFR propio numerador', () => cerca(i.calcularTRIFR(17, 3321332), 5.118428389573822));
for (const name of ['calcularIF', 'calcularIS', 'calcularTRIFR']) {
  for (const [n, h, res] of [
    [1, 0, null],
    [1, null, null],
    [null, 1, null],
    [undefined, 1, null],
    [-1, 1, null],
    [1, -1, null],
    [NaN, 1, null],
    [1, Infinity, null],
    [0, 100, 0],
    [1, 1e6, 1],
  ])
    test(`${name}(${n},${h})`, () => assert.equal(i[name](n, h), res));
}
for (const reg of data.indicadores.hh_semanal_pbix_resumen)
  test(`PBIX ${reg.tabla}`, () => {
    const v = i.recalcularResumenPBIX(reg);
    assert.equal(v.if, null);
    assert.equal(v.ia, null);
    assert.match(v.etiqueta, /no oficial/);
  });
for (const action of data.acciones.filter((x) => x.estado_verificado !== 'Cerrada con evidencia'))
  test(`estado calculable ${action.id}`, () =>
    assert.equal(
      e.calcularEstadoVerificado(
        {
          fechaCompromiso: action.fecha_compromiso,
          estadoDeclarado: action.estado_declarado,
          fechaEstadoDeclarado: action.fecha_estado_declarado,
          proyectosRequeridos: [action.proyecto],
        },
        corte,
      ),
      action.estado_verificado,
    ));
test('3 cierres importados; 2 parciales', () => {
  assert.equal(
    base.acciones.filter((x) => x.estadoImportado === 'Cerrada con evidencia').length,
    3,
  );
  assert.equal(a.resumenCumplimiento(base.acciones).cierresImportadosParciales, 2);
});
test('cierre documental no aprueba cierre operativo', () =>
  assert.equal(
    e.puedeCerrarEventoOperativo(
      base.acciones.filter((x) => x.estadoImportado === 'Cerrada con evidencia'),
      true,
      true,
    ),
    false,
  ));
const blob = new Blob(['Prueba de dominio. No es evidencia real.'], { type: 'application/pdf' });
const evidencia = {
  id: 'TEST-EVD',
  accionId: 'AC-166',
  creadoEn: '2026-10-07T10:00:00-05:00',
  subidoPorRol: 'Supervisor de campo',
  archivo: { nombre: 'prueba.pdf', mime: blob.type, bytes: blob.size, blob, huella: 'test' },
  validacion: {
    aceptada: true,
    rol: 'SSOMA corporativo',
    fecha: '2026-10-07T11:00:00-05:00',
    motivo: 'Prueba',
    alcanceCompleto: true,
    proyectosCubiertos: ['EP'],
  },
};
test('archivo validado y completo cierra', () =>
  assert.equal(
    e.calcularEstadoVerificado({ proyectosRequeridos: ['EP'], evidencias: [evidencia] }, corte),
    'Cerrada con evidencia',
  ));
for (const [nombre, ev] of [
  ['sin validador', { ...evidencia, validacion: null }],
  ['mismo rol', { ...evidencia, subidoPorRol: 'SSOMA corporativo' }],
  [
    'alcance parcial',
    { ...evidencia, validacion: { ...evidencia.validacion, alcanceCompleto: false } },
  ],
  [
    'fuera de corte',
    { ...evidencia, validacion: { ...evidencia.validacion, fecha: '2026-10-08T11:00:00-05:00' } },
  ],
  ['rechazado', { ...evidencia, validacion: { ...evidencia.validacion, aceptada: false } }],
  [
    'cobertura vacía',
    { ...evidencia, validacion: { ...evidencia.validacion, proyectosCubiertos: [] } },
  ],
  [
    'archivo vacío',
    { ...evidencia, archivo: { ...evidencia.archivo, blob: new Blob([]), bytes: 0 } },
  ],
])
  test(nombre + ' no cierra', () =>
    assert.equal(
      e.calcularEstadoVerificado({ proyectosRequeridos: ['EP'], evidencias: [ev] }, corte),
      'Sin información',
    ),
  );
test('vence hoy abierto', () =>
  assert.equal(
    e.calcularEstadoVerificado({ fechaCompromiso: corte, proyectosRequeridos: ['EP'] }, corte),
    'Abierta',
  ));
test('declaración cerrada antes que compromiso vencido', () =>
  assert.equal(
    e.calcularEstadoVerificado(
      {
        estadoDeclarado: 'Realizada (estado global En proceso 80%)',
        fechaCompromiso: '2026-01-01',
        proyectosRequeridos: ['EP'],
      },
      corte,
    ),
    'Declarada cerrada sin evidencia',
  ));
test('no declarar cerrado por negación', () =>
  assert.equal(e.declaracionCerrada('No realizada'), false));
test('no cierre automático sin acciones', () =>
  assert.equal(e.puedeCerrarEvento([], true, true), false));
test('no cierre sin investigación', () =>
  assert.equal(e.puedeCerrarEvento(['Cerrada con evidencia'], true, false), false));
for (const [fecha, estado] of [
  [null, 'sin_fecha'],
  ['2026-10-06', 'vencida'],
  [corte, 'hoy'],
  ['2026-10-14', 'proxima'],
  ['2026-10-15', 'en_plazo'],
])
  test(`semáforo ${fecha}`, () => assert.equal(e.semaforoFecha(fecha, corte).estado, estado));
for (const [filter, n] of [
  [{ anios: [2024] }, 155],
  [{ anios: [2026] }, 52],
  [{ anios: [2025] }, 3],
  [{ proyectos: ['CL'] }, 138],
  [{ proyectos: ['TA', 'OR'], anios: [2024] }, 32],
  [{ altoPotencial: true }, 6],
  [{ tipos: ['Incidente peligroso / HPRI'] }, 4],
  [{ anios: [2023] }, 3],
  [{ anios: [2023], meses: [null] }, 1],
])
  test(`filtro ${JSON.stringify(filter)}`, () =>
    assert.equal(f.filtrarEventos(base.eventos, filter).length, n));
test('filtro vacío mantiene225', () =>
  assert.equal(f.filtrarEventos(base.eventos, {}).length, 225));
test('cohorte previa a estado evita 100%', () => {
  const s = f.seleccionarCruzado(base.eventos, base.acciones, base.lecciones, {
    estadosAccion: ['Cerrada con evidencia'],
  });
  assert.equal(s.acciones.length, 3);
  assert.equal(s.cohorteAcciones.length, 168);
  cerca(a.resumenCumplimiento(s.cohorteAcciones).porcentajeCierre, (3 / 168) * 100);
});
test('acciones EP43', () =>
  assert.equal(f.filtrarAcciones(base.acciones, base.eventos, { proyectos: ['EP'] }).length, 43));
test('búsqueda sin acentos', () => assert.equal(f.textoBusqueda('  VOLADÚRA  '), 'voladura'));
test('vínculos de lecciones completos', () =>
  assert.equal(
    f.seleccionarCruzado(base.eventos, base.acciones, base.lecciones, {}).lecciones.length,
    22,
  ));
for (const dimension of [
  'tipo',
  'tipoGrupo',
  'riesgoCritico',
  'actividad',
  'equipo',
  'causasInmediatas',
  'causasBasicas',
])
  test(`pareto ${dimension}`, () => {
    const p = a.pareto(base.eventos, dimension);
    assert.equal(p.total, 225);
    assert.equal(p.conDato + p.sinDato, 225);
    assert.equal(
      p.filas.reduce((s, x) => s + x.cantidad, 0),
      p.conDato,
    );
    if (p.filas.length) cerca(p.filas.at(-1).porcentajeAcumulado, 100);
  });
test('riesgos45 sin dato', () => assert.equal(a.pareto(base.eventos, 'riesgoCritico').sinDato, 45));
test('calor CL2024 suma111', () =>
  assert.equal(
    a
      .mapaCalorProyectoMes(base.eventos, [2024], ['CL'])
      .filas.reduce((s, x) => s + (x.cantidad ?? 0), 0),
    111,
  ));
test('calor ausencia no cero', () =>
  assert.equal(a.mapaCalorProyectoMes(base.eventos, [2025], ['EP']).filas[0].cantidad, null));
test('calor mes desconocido', () =>
  assert.deepEqual(a.mapaCalorProyectoMes(base.eventos, [2023], ['CL']).sinMes, ['EV-2023-001']));
test('tendencia anual conserva 225', () =>
  assert.equal(
    a.tendencias(base.eventos, 'anual').filas.reduce((s, x) => s + (x.cantidad ?? 0), 0),
    225,
  ));
test('tendencia mensual 224 +1 sin mes', () => {
  const t = a.tendencias(base.eventos, 'mensual');
  assert.equal(
    t.filas.reduce((s, x) => s + (x.cantidad ?? 0), 0),
    224,
  );
  assert.equal(t.sinMes.length, 1);
});
test('cumplimiento suma168', () =>
  assert.equal(
    a.cumplimientoPorProyecto(base.acciones).reduce((s, x) => s + x.total, 0),
    168,
  ));
test('cumplimiento por26 eventos', () =>
  assert.equal(a.cumplimientoPorEvento(base.acciones).length, 26));
test('denominador0 sin porcentaje', () =>
  assert.equal(a.resumenCumplimiento([]).porcentajeCierre, null));
test('días perdidos consignados', () => {
  const s = a.sumaConCobertura(base.eventos, 'diasPerdidos');
  assert.equal(s.valor, 189);
  assert.equal(s.conDato, 6);
  assert.equal(s.sinDato, 219);
});
test('suma sin datos no cero', () =>
  assert.equal(a.sumaConCobertura([], 'diasPerdidos').valor, null));
test('fecha de Lima en cambio de díaUTC', () =>
  assert.equal(d.fechaLima(new Date('2026-10-08T04:59:00Z')), '2026-10-07'));
test('fecha inválida', () => assert.equal(d.esFechaISO('2026-02-30'), false));
test('bisiesto', () => assert.equal(d.esFechaISO('2024-02-29'), true));
test('formato de fuente', () => assert.equal(d.formatoFecha('2026-10-07'), '07/10/2026'));
test('URL conserva null comasfalse y contexto', () => {
  const filter = {
    anios: [2024, 2026],
    meses: [null, 3],
    riesgos: ['a,b'],
    altoPotencial: false,
    contexto: 'base+local',
  };
  assert.deepEqual(u.parametrosAFiltros(u.filtrosAParametros(filter)), filter);
});
test('URL conserva parámetros ajenos', () =>
  assert.equal(
    u.filtrosAParametros({ anios: [2024] }, new URLSearchParams('vista=tabla')).get('vista'),
    'tabla',
  ));
test('URL no acepta año inválido ni mes13', () => {
  const filter = u.parametrosAFiltros(new URLSearchParams('anios=9999&meses=13'));
  assert.deepEqual(filter.anios, []);
  assert.deepEqual(filter.meses, []);
});
test('serialización canónica', () =>
  assert.equal(
    serializarEstable({ b: 1, a: { y: null, x: 2 } }),
    serializarEstable({ a: { x: 2, y: null }, b: 1 }),
  ));
test('orden array significativo', () =>
  assert.notEqual(serializarEstable([1, 2]), serializarEstable([2, 1])));
const reporte = {
  idempotencia: 'smoke-reporte-0001',
  proyectoCodigo: 'EP',
  fecha: '2026-09-11',
  hora: '10:00',
  area: 'Prueba automatizada',
  tipo: 'En investigación',
  tipoGrupo: 'En investigación',
  actividad: null,
  equipo: null,
  riesgoCritico: null,
  altoPotencial: null,
  descripcion: 'Prueba sintética, no es un evento real.',
  personas: [],
  accionesInmediatas: 'Prueba; sin ejecución real.',
  revisionPrivacidad: true,
  fotos: [],
};
const actor = { rol: 'Supervisor de campo', proyectoCodigo: 'EP' };
test('reporte válido, no mutación', () =>
  r.validarReporte(reporte, data, actor, new Date('2026-10-07T12:00:00-05:00')));
test('reporte DNI rechazado', () =>
  assert.throws(() =>
    r.validarReporte(
      { ...reporte, dni: 'NO-REAL' },
      data,
      actor,
      new Date('2026-10-07T12:00:00-05:00'),
    ),
  ));
test('Gerencia solo lectura', () =>
  assert.throws(() => r.exigirPermisoEscritura({ rol: 'Gerencia' })));
test('reporte fecha futura rechazado', () =>
  assert.throws(() =>
    r.validarReporte(
      { ...reporte, fecha: '2027-01-01' },
      data,
      actor,
      new Date('2026-10-07T12:00:00-05:00'),
    ),
  ));
test('reporte sin revisión privacidad rechazado', () =>
  assert.throws(() =>
    r.validarReporte(
      { ...reporte, revisionPrivacidad: false },
      data,
      actor,
      new Date('2026-10-07T12:00:00-05:00'),
    ),
  ));
test('archivo binario permitido', () =>
  r.validarArchivo(new File(['TEST'], 'test.pdf', { type: 'application/pdf' })));
test('archivo vacío rechazado', () =>
  assert.throws(() => r.validarArchivo(new File([], 'empty.pdf', { type: 'application/pdf' }))));
test('foto no acepta PDF', () =>
  assert.throws(() =>
    r.validarArchivo(new File(['TEST'], 'test.pdf', { type: 'application/pdf' }), true),
  ));
test('no se modificó el JSON en todas las pruebas', () => assert.equal(JSON.stringify(raw), antes));
console.log(
  `Pruebas portables de dominio: ${pruebas - fallos}/${pruebas} aprobadas; ${fallos} fallos.`,
);
console.log(
  `Entorno: Node ${process.version}. No incluye Next.js, React, Vitest ni IndexedDB real.`,
);
process.exitCode = fallos ? 1 : 0;
