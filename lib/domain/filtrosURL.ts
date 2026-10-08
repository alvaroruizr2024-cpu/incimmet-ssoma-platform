import type {
  Filtros,
  GrupoEvento,
  EstadoVerificado,
  JerarquiaControl,
  EmpresaTipoJson,
} from '../types';
import { esFechaISO } from './fechas';
import { ESTADOS_VERIFICADOS } from './estadoVerificado';
const camposTexto = [
  'proyectos',
  'clientes',
  'tipos',
  'riesgos',
  'actividades',
  'equipos',
  'niveles',
  'potenciales',
  'empresas',
  'eventoIds',
  'estadosAccion',
  'jerarquias',
  'responsables',
  'grupos',
] as const;
const camposFecha = ['desde', 'hasta', 'compromisoDesde', 'compromisoHasta'] as const;
const claves = [
  ...camposTexto,
  ...camposFecha,
  'anios',
  'meses',
  'altoPotencial',
  'busqueda',
  'contexto',
];
const grupos: readonly GrupoEvento[] = [
  'Accidente',
  'Incidente',
  'Daño a la propiedad',
  'Desvío',
  'Ambiental',
  'En investigación',
];
const jerarquias: readonly JerarquiaControl[] = [
  'Eliminación',
  'Sustitución',
  'Ingeniería',
  'Administrativo',
  'EPP',
];
const empresas: readonly EmpresaTipoJson[] = [
  'INCIMMET',
  'Subcontrata',
  'Tercero',
  'Mixto (INCIMMET + tercero)',
  'No consta',
];
/** Valores repetidos en la URL; JSON escalar preserva comas, acentos y null sin colisiones. */
export function filtrosAParametros(
  f: Filtros,
  actuales: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  const p = new URLSearchParams(actuales);
  for (const clave of claves) p.delete(clave);
  for (const campo of [...camposTexto, 'anios', 'meses'] as const) {
    for (const valor of f[campo] ?? []) p.append(campo, JSON.stringify(valor));
  }
  for (const campo of camposFecha) if (f[campo]) p.set(campo, f[campo]);
  if (f.altoPotencial !== undefined) p.set('altoPotencial', JSON.stringify(f.altoPotencial));
  if (f.busqueda) p.set('busqueda', f.busqueda.slice(0, 200));
  if (f.contexto === 'base+local' || f.contexto === 'reproduccion') p.set('contexto', f.contexto);
  return p;
}
export function parametrosAFiltros(p: URLSearchParams): Filtros {
  const f: Filtros = {};
  const valores = (campo: string): unknown[] =>
    p
      .getAll(campo)
      .slice(0, campo === 'eventoIds' ? 5000 : 100)
      .flatMap((v) => {
        try {
          return [JSON.parse(v) as unknown];
        } catch {
          return [];
        }
      });
  const textos = (campo: string) => [
    ...new Set(valores(campo).filter((v): v is string => typeof v === 'string' && v.length <= 500)),
  ];
  const nullable = (campo: string) => [
    ...new Set(
      valores(campo).filter(
        (v): v is string | null => v === null || (typeof v === 'string' && v.length <= 500),
      ),
    ),
  ];
  for (const campo of ['proyectos', 'clientes', 'tipos', 'eventoIds'] as const)
    if (p.has(campo)) f[campo] = textos(campo);
  for (const campo of [
    'riesgos',
    'actividades',
    'equipos',
    'niveles',
    'potenciales',
    'responsables',
  ] as const)
    if (p.has(campo)) f[campo] = nullable(campo);
  if (p.has('grupos'))
    f.grupos = textos('grupos').filter((v): v is GrupoEvento => grupos.includes(v as GrupoEvento));
  if (p.has('estadosAccion'))
    f.estadosAccion = textos('estadosAccion').filter((v): v is EstadoVerificado =>
      ESTADOS_VERIFICADOS.includes(v as EstadoVerificado),
    );
  if (p.has('jerarquias'))
    f.jerarquias = textos('jerarquias').filter((v): v is JerarquiaControl =>
      jerarquias.includes(v as JerarquiaControl),
    );
  if (p.has('empresas'))
    f.empresas = textos('empresas').filter((v): v is EmpresaTipoJson =>
      empresas.includes(v as EmpresaTipoJson),
    );
  if (p.has('anios'))
    f.anios = [
      ...new Set(
        valores('anios').filter(
          (v): v is number =>
            typeof v === 'number' && Number.isInteger(v) && v >= 1900 && v <= 2200,
        ),
      ),
    ];
  if (p.has('meses'))
    f.meses = [
      ...new Set(
        valores('meses').filter(
          (v): v is number | null =>
            v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 12),
        ),
      ),
    ];
  const potencial = p.get('altoPotencial');
  if (potencial === 'true') f.altoPotencial = true;
  if (potencial === 'false') f.altoPotencial = false;
  if (potencial === 'null') f.altoPotencial = null;
  for (const campo of camposFecha) {
    const v = p.get(campo);
    if (esFechaISO(v)) f[campo] = v;
  }
  if (f.desde && f.hasta && f.desde > f.hasta) {
    delete f.desde;
    delete f.hasta;
  }
  if (f.compromisoDesde && f.compromisoHasta && f.compromisoDesde > f.compromisoHasta) {
    delete f.compromisoDesde;
    delete f.compromisoHasta;
  }
  const q = p.get('busqueda');
  if (q) f.busqueda = q.slice(0, 200);
  if (p.get('contexto') === 'base+local') f.contexto = 'base+local';
  if (p.get('contexto') === 'reproduccion') f.contexto = 'reproduccion';
  return f;
}
