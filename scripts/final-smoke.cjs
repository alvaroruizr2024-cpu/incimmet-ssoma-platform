const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  revisarPrivacidad,
  exigirPrivacidad,
} = require('../.verification/domain/lib/domain/privacidad');
const {
  nuevoFormulario,
  aReporte,
  erroresPaso,
} = require('../.verification/domain/lib/pwa/formulario');
const { ruidoRoca } = require('../.verification/domain/lib/domain/roca');
const { validarDocumento } = require('../.verification/domain/lib/data/validarDocumento');
const { normalizarDocumento } = require('../.verification/domain/lib/data/normalizar');
const { modeloProyectos } = require('../.verification/domain/lib/analytics/modelos');
const data = validarDocumento(JSON.parse(fs.readFileSync('public/data/data.json', 'utf8'))),
  base = normalizarDocumento(data);
let total = 0,
  failed = 0;
function check(name, fn) {
  total++;
  try {
    fn();
  } catch (e) {
    failed++;
    console.error(name, e.message);
  }
}
for (const t of ['DNI: 12345678', 'persona 87654321', 'DNI 1 2 3 4 5 6 7 8'])
  check(`Bloqueo ${t}`, () => assert(revisarPrivacidad([t]).bloqueos.length));
for (const t of [
  'Sr. Juan Perez',
  'Juan Perez',
  'diagnóstico',
  'fractura',
  'historia clínica',
  'ansiedad',
])
  check(`Aviso ${t}`, () => assert(revisarPrivacidad([t]).advertencias.length));
for (const t of [
  'Rampa 200 – nivel 1800',
  '2026-10-07',
  'Operador de volquete',
  'Bloqueo de equipo',
  'Cerro Lindo',
])
  check(`Técnico ${t}`, () =>
    assert.deepEqual(revisarPrivacidad([t]), { bloqueos: [], advertencias: [] }),
  );
check('Guardado directo', () => assert.throws(() => exigirPrivacidad(['DNI 12345678'])));
const now = new Date('2026-10-07T22:00:00Z'),
  actor = { rol: 'Supervisor de campo', proyectoCodigo: 'EP' };
const f = {
  ...nuevoFormulario('EP', now),
  area: 'Taller',
  descripcion: 'Prueba no real.',
  personaAfectada: 'no',
  accionesInmediatas: 'Prueba sin acción real.',
  revisionPrivacidad: true,
};
check('Fecha Lima', () => assert.equal(f.fecha, '2026-10-07'));
check('Hora Lima', () => assert.equal(f.hora, '17:00'));
check('Desconocido no es false', () =>
  assert.equal(aReporte(f, [], 'prueba-0001', data, actor, now).altoPotencial, null),
);
for (const p of [0, 1, 2, 3]) check(`Paso ${p}`, () => assert.deepEqual(erroresPaso(f, p), []));
check('Obligatorios', () => assert(erroresPaso(nuevoFormulario('', now), 0).length));
check('Sin identidad', () =>
  assert.deepEqual(
    aReporte(
      { ...f, personaAfectada: 'si', personas: [{ rol: 'Operador', zonaCorporal: null }] },
      [],
      'prueba-0001',
      data,
      actor,
      now,
    ).personas,
    [{ rol: 'Operador', zonaCorporal: null }],
  ),
);
check('No futuro', () =>
  assert.throws(() => aReporte({ ...f, fecha: '2099-01-01' }, [], 'prueba-0001', data, actor, now)),
);
check('DNI en descripción', () =>
  assert.throws(() =>
    aReporte({ ...f, descripcion: '12345678' }, [], 'prueba-0001', data, actor, now),
  ),
);
const noise = ruidoRoca(256);
check('Roca determinista', () => assert.deepEqual(noise, ruidoRoca(256)));
check('Tamaño textura', () => assert.equal(noise.length, 65536));
check('Roca suave y periódica', () => {
  let max = 0;
  for (let i = 0; i < noise.length; i++)
    max = Math.max(max, Math.abs(noise[i] - noise[Math.floor(i / 256) * 256 + ((i + 1) % 256)]));
  assert(max < 12);
});
const m = modeloProyectos(base.eventos, base.proyectos);
check('Proyectos horizontales', () => assert.equal(m.horizontal, true));
check('Proyecto líder', () => assert.equal(m.puntos[0].etiqueta, 'Cerro Lindo'));
check('Conteo líder', () => assert.equal(m.puntos[0].valor, 138));
check('Filtro conservado', () => assert.deepEqual(m.puntos[0].filtros, { proyectos: ['CL'] }));
console.log(
  `PASO 5 — ${total - failed}/${total} comprobaciones portables aprobadas. No incluye React, Workbox, IndexedDB ni Next.js.`,
);
process.exitCode = failed ? 1 : 0;
