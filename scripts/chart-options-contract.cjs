/** Contrato de configuración, no renderizado ECharts. Ejecuta la función real sin cargar el motor. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const modelos = require(path.join(root, '.verification/domain/lib/analytics/modelos.js'));
const { normalizarDocumento } = require(
  path.join(root, '.verification/domain/lib/data/normalizar.js'),
);
const base = normalizarDocumento(
  JSON.parse(fs.readFileSync(path.join(root, 'public/data/data.json'), 'utf8')),
);
const output = ts.transpileModule(
  fs.readFileSync(path.join(root, 'lib/analytics/echarts-options.ts'), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText;
const exportsObject = {};
vm.runInNewContext(output, {
  exports: exportsObject,
  require: (id) => {
    assert.equal(id, './modelos');
    return modelos;
  },
});
const options = exportsObject.opcionesGrafico;
let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('OK', name);
}
check('Proyectos horizontales, nombres completos y filtro CL', () => {
  const m = modelos.modeloProyectos(base.eventos, base.proyectos);
  assert.equal(m.horizontal, true);
  assert.equal(m.puntos[0].etiqueta, 'Cerro Lindo');
  assert.equal(m.puntos[0].filtros.proyectos[0], 'CL');
  assert.equal(options(m).yAxis.axisLabel.interval, 0);
});
check('Conteos enteros y sin patrones por defecto', () => {
  const o = options(modelos.modeloConteo(base.eventos, 'nivelIncimmet', 'Niveles'));
  assert.equal(o.yAxis.minInterval, 1);
  assert.equal(o.aria.decal.show, false);
  assert.equal(o.xAxis.axisLabel.interval, 0);
});
check('Patrones opcionales', () => {
  assert.equal(
    options(modelos.modeloConteo(base.eventos, 'tipoGrupo', 'Grupos'), false, false, false, true)
      .aria.decal.show,
    true,
  );
});
check('Últimos 24 meses y sin slider visible móvil', () => {
  const m = modelos.modeloTendencia(base.eventos, 'mensual');
  assert.equal(options(m).dataZoom[0].startValue, m.categorias.length - 24);
  assert.equal(options(m, false, false, true).dataZoom.length, 1);
  assert.equal(options(m, false, false, true).dataZoom[0].type, 'inside');
});
check('Leyenda plain y cobertura anotada', () => {
  const o = options(modelos.modeloTendencia(base.eventos, 'anual'));
  assert.equal(o.legend.type, 'plain');
  assert.match(JSON.stringify(o.series[0].markArea), /2025 incompleto/);
});
check('Tasas oficiales sin redondeo del intervalo a entero', () => {
  const o = options({
    id: 'ia',
    tipo: 'line',
    titulo: 'IA',
    descripcion: 'Fuente',
    procedencia: 'Oficial',
    puntos: [{ etiqueta: '2024', valor: 0.7694 }],
  });
  assert.equal(o.yAxis.minInterval, undefined);
});
console.log(`${passed} contratos de opciones aprobados. No equivalen a una prueba visual ECharts.`);
