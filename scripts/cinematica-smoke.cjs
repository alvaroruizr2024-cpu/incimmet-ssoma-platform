/* Verificación real del dominio compilado; no simula una ejecución de React/WebGL. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = (p) => require(path.join(root, '.verification/domain/lib', p));
const { normalizarDocumento } = load('data/normalizar.js');
const { validarDocumento } = load('data/validarDocumento.js');
const { resumenPresentacion, formatoNarrativo } = load('domain/presentacion.js');
const c = load('domain/cinematica.js');
const ix = load('domain/interactivos3d.js');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'public/data/data.json'), 'utf8'));
const base = normalizarDocumento(validarDocumento(raw));
let passed = 0,
  failed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(name, e.message);
  }
};
const s = resumenPresentacion(base);
for (const [key, value] of Object.entries({
  eventos: 225,
  acciones: 168,
  proyectos: 12,
  lecciones: 22,
  altoPotencial: 6,
  cerradas: 3,
  cierresParciales: 2,
  sinInformacion: 127,
  anioDesde: 2009,
  anioHasta: 2026,
}))
  test(key, () => assert.equal(s[key], value));
test('cierre', () => assert.equal(formatoNarrativo(s.porcentajeCierre, 1), '1.8'));
test('sin información', () =>
  assert.equal(formatoNarrativo(s.porcentajeSinInformacion, 1), '75.6'));
for (const [key, value] of Object.entries({ if: 2.7098, is: 283.92, ia: 0.7694 }))
  test(`oficial ${key}`, () => assert.equal(s.indicadores[key], value));
test('fuente', () => assert.ok(s.indicadores.fuente));
test('proyectos desde detalle', () =>
  assert.deepEqual(
    s.proyectosDetalle.slice(0, 3).map((p) => p.eventos),
    [138, 25, 23],
  ));
test('no alteración', () => {
  const before = JSON.stringify(base);
  resumenPresentacion(base);
  assert.equal(JSON.stringify(base), before);
});
test('metaconteo no sustituye filas', () => {
  const copy = structuredClone(base);
  copy.meta.conteos.eventos = 9999;
  assert.equal(resumenPresentacion(copy).eventos, 225);
});
test('sin local', () => {
  const copy = structuredClone(base);
  copy.eventos.push({ ...copy.eventos[0], id: 'SOLO-PRUEBA', origen: 'local' });
  assert.equal(resumenPresentacion(copy).eventos, 225);
});
test('corte original', () => {
  const copy = structuredClone(base);
  copy.acciones.forEach((a) => (a.estadoVerificado = 'Cerrada con evidencia'));
  assert.equal(resumenPresentacion(copy).cerradas, 3);
});
test('sin denominador', () =>
  assert.equal(resumenPresentacion({ ...base, acciones: [] }).porcentajeCierre, null));
test('no oficial ausente', () =>
  assert.equal(resumenPresentacion(base, { anio: 2099, ambito: 'PERU' }).indicadores.if, null));
test('versión ambigua', () => {
  const copy = structuredClone(base);
  copy.indicadores.anual_por_ambito.push({
    ...copy.indicadores.anual_por_ambito.find((i) => i.anio === 2024 && i.ambito === 'PERU'),
  });
  assert.equal(resumenPresentacion(copy).indicadores.if, null);
});
test('null != cero', () => {
  assert.equal(formatoNarrativo(null), 'No consta');
  assert.equal(formatoNarrativo(0), '0');
});
test('8 escenas', () => assert.equal(new Set(c.ESCENAS.map((e) => e.id)).size, 8));
test('reduced', () => assert.equal(c.modoInicial({ webgl: true, reducido: true }), '2d'));
test('no WebGL', () => assert.equal(c.modoInicial({ webgl: false, reducido: false }), '2d'));
test('memoria desconocida', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false }), 'alta'));
test('memoria baja', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false, memoria: 2 }), '2d'));
test('ahorro', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false, ahorro: true }), '2d'));
test('móvil', () =>
  assert.equal(c.modoInicial({ webgl: true, reducido: false, movil: true }), 'equilibrada'));
test('degradación', () =>
  assert.deepEqual(['alta', 'equilibrada', 'baja', '2d'].map(c.degradarCalidad), [
    'equilibrada',
    'baja',
    '2d',
    '2d',
  ]));
test('DPR <= 1.5', () =>
  ['alta', 'equilibrada', 'baja'].forEach((q) => assert.ok(c.perfilCalidad(q).dprMax <= 1.5)));
test('baja sin efectos', () => {
  assert.equal(c.perfilCalidad('baja').polvo, 0);
  assert.equal(c.perfilCalidad('baja').capasNiebla, 0);
});
test('altura variable', () => assert.equal(c.progresoNarrativo(225, [0, 100, 350]), 0.75));
test('recorrido finito y monótono', () => {
  let z = Infinity;
  for (let i = 0; i <= 1000; i++) {
    const p = c.poseCamara(i / 1000);
    assert.ok(p.posicion.every(Number.isFinite));
    assert.ok(p.posicion[2] <= z);
    assert.ok(p.mirada[2] < p.posicion[2]);
    z = p.posicion[2];
  }
});
test('geometría determinista', () =>
  assert.deepEqual(c.mallaBoveda('baja'), c.mallaBoveda('baja')));
test('segmentos válidos', () =>
  [...c.mallaBoveda('alta'), ...c.pernosBoveda()].forEach((t) => {
    assert.ok([...t.desde, ...t.hasta].every(Number.isFinite));
    assert.ok(t.desde.some((n, i) => n !== t.hasta[i]));
  }));
test('menos geometría en baja', () =>
  assert.ok(c.mallaBoveda('baja').length < c.mallaBoveda('alta').length));
test('semilla repetible', () => {
  const a = c.aleatorioSemilla(5),
    b = c.aleatorioSemilla(5);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});
test('óptica acotada', () => {
  for (let i = 0; i <= 200; i++) {
    const o = c.opticaCamara(i / 200);
    assert.ok(o.fov >= c.OPTICA.fovPausa - 1e-9 && o.fov <= c.OPTICA.fovSalida + 1e-9);
    assert.ok(Math.abs(o.balanceo) <= c.OPTICA.balanceoMax);
  }
});
test('presencia plena en pausa y nula lejos', () => {
  assert.equal(c.presenciaMomento(0, 0), 1);
  assert.equal(c.presenciaMomento(4, 0), 0);
});
test('acentos por escena', () => assert.equal(c.ACENTOS_ESCENA.length, c.ESCENAS.length));
test('apertura termina en el encuadre', () =>
  assert.deepEqual(c.aperturaCamara(c.APERTURA.duracion), {
    retroceso: 0,
    descenso: 0,
    fovExtra: 0,
    exposicion: 1,
    terminada: true,
  }));
test('giro acotado', () =>
  assert.deepEqual(c.giroDesdeArrastre({ yaw: 0, pitch: 0 }, -1e6, 1e6, 1000), {
    yaw: c.GIRO.maxYaw,
    pitch: c.GIRO.maxPitch,
  }));
test('recorrido termina', () => assert.equal(c.posicionRecorrido(1e6, 8).fin, true));
test('anclas acotadas', () =>
  assert.equal(
    c.anclasVisibles(
      Array.from({ length: 20 }, (_, i) => ({
        clave: String(i),
        x: 0.5,
        y: 0.5,
        profundidad: i / 20,
        delante: true,
      })),
    ).length,
    c.MAX_ANCLAS,
  ));
test('catálogo interactivo', () => {
  const cat = ix.catalogoInteractivo(s);
  assert.equal(cat.filter((d) => d.tipo === 'evento').length, 225);
  assert.equal(cat.filter((d) => d.tipo === 'accion').length, 168);
  assert.equal(cat.filter((d) => d.tipo === 'proyecto').length, 12);
  assert.ok(cat.every((d) => d.href.startsWith('/') && d.lineas.length > 0));
});
console.log(
  `PASO 3 — pruebas portables: ${passed}/${passed + failed} aprobadas; ${failed} fallos.`,
);
console.log(
  `Node ${process.version}. No incluye renderizado Next.js, React, WebGL, Vitest ni navegador.`,
);
process.exitCode = failed ? 1 : 0;
