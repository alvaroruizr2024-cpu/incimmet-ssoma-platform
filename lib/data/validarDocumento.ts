import type { DataJson } from '../types';
import { esFechaISO } from '../domain/fechas';
import { ESTADOS_VERIFICADOS } from '../domain/estadoVerificado';
type Regla = (valor: unknown, ruta: string) => void;
const falla = (ruta: string): never => {
  throw new Error(`JSON inválido en ${ruta}`);
};
const texto: Regla = (v, p) => {
  if (typeof v !== 'string') falla(p);
};
const numero: Regla = (v, p) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) falla(p);
};
const booleano: Regla = (v, p) => {
  if (typeof v !== 'boolean') falla(p);
};
const fecha: Regla = (v, p) => {
  if (!esFechaISO(v)) falla(p);
};
const nullable =
  (regla: Regla): Regla =>
  (v, p) => {
    if (v !== null) regla(v, p);
  };
const opcional =
  (regla: Regla): Regla =>
  (v, p) => {
    if (v !== undefined) regla(v, p);
  };
const enumerado =
  (valores: readonly string[]): Regla =>
  (v, p) => {
    if (typeof v !== 'string' || !valores.includes(v)) falla(p);
  };
const lista =
  (regla: Regla): Regla =>
  (v, p) => {
    if (!Array.isArray(v)) falla(p);
    (v as unknown[]).forEach((x, i) => regla(x, `${p}[${i}]`));
  };
const objeto =
  (reglas: Record<string, Regla>): Regla =>
  (v, p) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) falla(p);
    for (const [clave, regla] of Object.entries(reglas))
      regla((v as Record<string, unknown>)[clave], `${p}.${clave}`);
  };
const nTexto = nullable(texto);
const nNumero = nullable(numero);
const grupos = [
  'Accidente',
  'Incidente',
  'Daño a la propiedad',
  'Desvío',
  'Ambiental',
  'En investigación',
];
const jerarquias = ['Eliminación', 'Sustitución', 'Ingeniería', 'Administrativo', 'EPP'];
const registro = objeto({
  periodo: texto,
  ambito: texto,
  indicador: texto,
  valor: (v, p) => (typeof v === 'number' ? numero(v, p) : texto(v, p)),
  nota: nTexto,
  fuente: texto,
});
const anual: Record<string, Regla> = {
  anio: numero,
  ambito: texto,
  ambito_nombre: texto,
  fuente: texto,
};
for (const k of [
  'hht',
  'dias_perdidos',
  'acc_nv1',
  'acc_nv2',
  'acc_nv3',
  'acc_nv4',
  'acc_nv5_6',
  'danos_propiedad',
  'eventos_investigados',
  'costo_propiedad_usd',
  'trifr',
  'if',
  'is',
  'ia',
])
  anual[k] = opcional(numero);
const estructura = objeto({
  meta: objeto({
    generado: fecha,
    zona_horaria: texto,
    version: texto,
    fecha_corte_estados: fecha,
    conteos: objeto({
      eventos: numero,
      acciones: numero,
      lecciones: numero,
      proyectos: numero,
      documentos_fuente: numero,
    }),
    rango_fechas: lista(fecha),
    privacidad: texto,
    advertencias: lista(texto),
  }),
  catalogos: objeto({
    tipos_evento: lista(texto),
    grupos_tipo: lista(texto),
    estados_verificados: lista(texto),
    jerarquia_control: lista(texto),
    escala_severidad_incimmet: objeto({
      '0': texto,
      I: texto,
      II: texto,
      III: texto,
      IV: texto,
      V: texto,
      VI: texto,
    }),
  }),
  proyectos: lista(
    objeto({
      codigo: texto,
      nombre: texto,
      cliente: texto,
      n_eventos: numero,
      anios_con_eventos: lista(numero),
      meta_trifr_2026: nNumero,
    }),
  ),
  eventos: lista(
    objeto({
      id: texto,
      fecha: nullable(fecha),
      fecha_texto: nTexto,
      anio: numero,
      mes: nNumero,
      hora: nTexto,
      proyecto: texto,
      cliente: texto,
      area: nTexto,
      actividad: nTexto,
      puesto_rol: nTexto,
      equipo: nTexto,
      tipo: texto,
      tipo_grupo: enumerado(grupos),
      clasificacion_fuente: nTexto,
      nivel_incimmet: nTexto,
      pg_incimmet: nTexto,
      nivel_cliente: nTexto,
      pg_cliente: nTexto,
      severidad_texto: nTexto,
      alto_potencial: booleano,
      riesgo_critico: nTexto,
      zona_cuerpo: nTexto,
      descripcion: texto,
      causas_inmediatas: nTexto,
      causas_basicas: nTexto,
      dias_perdidos: nNumero,
      costo: nNumero,
      costo_texto: nTexto,
      penalidad: nTexto,
      empresa_tipo: enumerado([
        'INCIMMET',
        'Subcontrata',
        'Tercero',
        'Mixto (INCIMMET + tercero)',
        'No consta',
      ]),
      empresa_detalle: texto,
      estado: nTexto,
      n_acciones: numero,
      lecciones: lista(texto),
      fuentes: lista(texto),
      confianza: texto,
      observaciones: nTexto,
    }),
  ),
  acciones: lista(
    objeto({
      id: texto,
      evento_id: texto,
      proyecto: texto,
      descripcion: texto,
      tipo: texto,
      jerarquia_control: enumerado(jerarquias),
      alcance: texto,
      responsable_rol: nTexto,
      fecha_compromiso: nullable(fecha),
      estado_declarado: nTexto,
      fecha_estado_declarado: nullable(fecha),
      estado_verificado: enumerado(ESTADOS_VERIFICADOS),
      evidencias: lista(texto),
      observaciones: nTexto,
      fuente: texto,
    }),
  ),
  lecciones: lista(
    objeto({
      id: texto,
      eventos: lista(texto),
      proyectos: lista(texto),
      que_paso: texto,
      por_que: texto,
      leccion: texto,
      controles: objeto({
        eliminacion: nTexto,
        sustitucion: nTexto,
        ingenieria: nTexto,
        administrativos: nTexto,
        epp: nTexto,
      }),
      actividad_critica: texto,
      riesgo_critico: texto,
      aplicabilidad: texto,
      fuentes: lista(texto),
    }),
  ),
  indicadores: objeto({
    definiciones: objeto({ IF: texto, IS: texto, IA: texto, TRIFR: texto }),
    anual_por_ambito: lista(objeto(anual)),
    metas_2026: lista(registro),
    doce_meses_feb_2026: lista(registro),
    registros_oficiales: lista(registro),
    hh_semanal_pbix_resumen: lista(
      objeto({
        anio: numero,
        proyecto: texto,
        tabla: texto,
        semanas: numero,
        desde: fecha,
        hasta: fecha,
        hht: numero,
        dias_perdidos: nNumero,
        acc_nv2_6: nNumero,
        acc_nv1_3: nNumero,
        fuente: texto,
        nota: texto,
      }),
    ),
  }),
  documentos_fuente: lista(objeto({ codigo: texto, descripcion: texto, tipo: texto })),
});
export function validarDocumento(valor: unknown): DataJson {
  estructura(valor, 'data');
  const d = valor as DataJson;
  if (d.meta.rango_fechas.length !== 2) falla('meta.rango_fechas');
  for (const clave of [
    'eventos',
    'acciones',
    'lecciones',
    'proyectos',
    'documentos_fuente',
  ] as const) {
    if (d[clave].length !== d.meta.conteos[clave]) falla(`meta.conteos.${clave}`);
  }
  const ids = (filas: readonly string[], ruta: string) => {
    if (new Set(filas).size !== filas.length) falla(ruta);
    return new Set(filas);
  };
  const eventos = ids(
    d.eventos.map((e) => e.id),
    'eventos.id',
  );
  const proyectos = ids(
    d.proyectos.map((p) => p.codigo),
    'proyectos.codigo',
  );
  const lecciones = ids(
    d.lecciones.map((l) => l.id),
    'lecciones.id',
  );
  ids(
    d.acciones.map((a) => a.id),
    'acciones.id',
  );
  ids(
    d.documentos_fuente.map((x) => x.codigo),
    'documentos_fuente.codigo',
  );
  for (const e of d.eventos) {
    if (!proyectos.has(e.proyecto) || e.lecciones.some((id) => !lecciones.has(id))) falla(e.id);
    if (
      !Number.isInteger(e.anio) ||
      (e.mes !== null && (!Number.isInteger(e.mes) || e.mes < 1 || e.mes > 12))
    )
      falla(`${e.id}.fecha`);
    if (
      e.fecha &&
      (Number(e.fecha.slice(0, 4)) !== e.anio || Number(e.fecha.slice(5, 7)) !== e.mes)
    )
      falla(`${e.id}.fecha`);
  }
  for (const a of d.acciones)
    if (
      !eventos.has(a.evento_id) ||
      !proyectos.has(a.proyecto) ||
      d.eventos.find((e) => e.id === a.evento_id)?.proyecto !== a.proyecto
    )
      falla(a.id);
  for (const l of d.lecciones)
    if (l.eventos.some((id) => !eventos.has(id)) || l.proyectos.some((p) => !proyectos.has(p)))
      falla(l.id);
  return d;
}
