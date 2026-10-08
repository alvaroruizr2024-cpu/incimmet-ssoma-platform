'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVista } from '@/lib/hooks/use-base';
import { FiltrosPanel } from '@/components/shell/filtros-panel';
import { ChartCard } from '@/components/charts/chart-card';
import { Tabs } from '@/components/ui/tabs';
import { IndicadoresPanel } from '@/components/analytics/indicadores-panel';
import {
  modeloTendencia,
  modeloPareto,
  modeloCalor,
  modeloMatriz,
  modeloConteo,
  modeloCumplimiento,
  modeloComparado,
  modeloCobertura,
  type ModeloGrafico,
} from '@/lib/analytics/modelos';
import { calidadCampos, avisosCalidad, type EntidadCalidad } from '@/lib/domain/analitica';
import { Titulo, EstadoConsulta, Tabla, LinkContexto } from './shared';
const tabs = [
  { id: 'tendencias', label: 'Tendencias' },
  { id: 'pareto', label: 'Pareto' },
  { id: 'severidad', label: 'Severidad / HPRI' },
  { id: 'indicadores', label: 'Indicadores oficiales' },
  { id: 'cumplimiento', label: 'Cumplimiento' },
  { id: 'calidad', label: 'Calidad de datos' },
];
export function Analisis() {
  const v = useVista();
  const search = useSearchParams();
  const vista = search.get('vista');
  const tab = tabs.some((t) => t.id === vista) ? vista! : 'tendencias';
  const setTab = (value: string) => {
    const query = new URLSearchParams(window.location.search);
    query.set('vista', value);
    window.history.pushState(null, '', `${window.location.pathname}?${query}`);
  };
  const [anio, setAnio] = useState(2026);
  const [entidad, setEntidad] = useState<EntidadCalidad>('eventos');
  if (!v.base || !v.seleccion)
    return (
      <EstadoConsulta
        loading={v.isPending}
        error={v.error}
        retry={() => {
          void v.refetch();
        }}
      />
    );
  const b = v.base,
    s = v.seleccion,
    corte = b.meta.fecha_corte_estados;
  const hpri = s.eventos.filter((e) => e.altoPotencial === true);
  const calidad = calidadCampos(
    { ...b, eventos: s.eventos, acciones: s.acciones, lecciones: s.lecciones },
    entidad,
  );
  const modeloNulos: ModeloGrafico = {
    id: `nulos-${entidad}`,
    titulo: `Nulos literales por campo · ${entidad}`,
    tipo: 'bar',
    unidad: '% nulos',
    descripcion:
      'Nulos, vacíos, «No consta» textual y claves ausentes se informan por separado en la tabla. Los campos auxiliares y no aplicables no implican incumplimiento.',
    puntos: calidad.map((f) => ({
      etiqueta: f.campo,
      valor: f.porcentajeNulos,
      filtros: f.eventoIdsNulos.length ? { eventoIds: f.eventoIdsNulos } : undefined,
      detalle: `${f.nulos}/${f.total} null; ${f.vacios} vacíos; ${f.noConsta} No consta; ${f.ausentes} claves ausentes`,
    })),
  };
  let contenido;
  if (tab === 'tendencias')
    contenido = (
      <>
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <label className="grid gap-2 text-sm">
            Año del mapa de calor
            <select
              className="w-full min-w-0"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            >
              {[...new Set(b.eventos.map((e) => e.anio))]
                .sort((a, c) => c - a)
                .map((a) => (
                  <option key={a}>{a}</option>
                ))}
            </select>
          </label>
          <span className="text-xs text-secondary">
            Además se aplican los filtros globales. Una selección incompatible deja celdas sin
            registros.
          </span>
        </div>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          {[modeloTendencia(s.eventos, 'anual'), modeloTendencia(s.eventos, 'mensual')].map((m) => (
            <ChartCard key={m.id} modelo={m} corte={corte} />
          ))}
        </div>
        <div className="mt-6">
          <ChartCard
            modelo={modeloCalor(
              s.eventos,
              b.proyectos.map((p) => p.codigo),
              anio,
            )}
            corte={corte}
          />
        </div>
      </>
    );
  else if (tab === 'pareto')
    contenido = (
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {(
          [
            ['tipo', 'Tipos de evento'],
            ['riesgoCritico', 'Riesgos críticos'],
            ['actividad', 'Actividades'],
            ['equipo', 'Equipos'],
            ['causasInmediatas', 'Textos de causas inmediatas'],
            ['causasBasicas', 'Textos de causas básicas'],
          ] as const
        ).map(([campo, titulo]) => (
          <ChartCard
            key={campo}
            modelo={modeloPareto(s.eventos, campo, `Pareto · ${titulo}`)}
            corte={corte}
          />
        ))}
      </div>
    );
  else if (tab === 'severidad')
    contenido = (
      <>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <ChartCard modelo={modeloMatriz(s.eventos)} corte={corte} />
          <ChartCard
            modelo={{
              ...modeloConteo(hpri, 'proyectoCodigo', 'HPRI por proyecto'),
              puntos: modeloConteo(hpri, 'proyectoCodigo', '').puntos.map((p) => ({
                ...p,
                filtros: { ...p.filtros, altoPotencial: true },
              })),
            }}
            corte={corte}
          />
          <ChartCard
            modelo={{
              ...modeloConteo(hpri, 'riesgoCritico', 'HPRI por riesgo'),
              puntos: modeloConteo(hpri, 'riesgoCritico', '').puntos.map((p) => ({
                ...p,
                filtros: { ...p.filtros, altoPotencial: true },
              })),
            }}
            corte={corte}
          />
        </div>
        <p className="mt-4 text-sm">
          {hpri.length} registros con bandera de alto potencial.{' '}
          <LinkContexto href="/eventos">Consultar eventos</LinkContexto>
        </p>
      </>
    );
  else if (tab === 'indicadores') contenido = <IndicadoresPanel base={b} />;
  else if (tab === 'cumplimiento')
    contenido = (
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {[
          modeloCumplimiento(s.acciones, 'proyecto'),
          modeloCumplimiento(s.acciones, 'evento'),
          modeloComparado(s.cohorteAcciones),
        ].map((m) => (
          <ChartCard key={m.id} modelo={m} corte={corte} />
        ))}
      </div>
    );
  else
    contenido = (
      <>
        <div className="mb-5 rounded border border-amber-400 bg-amber-50 p-4 text-sm text-slate-900">
          <h2 className="font-semibold">Brechas documentales</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {avisosCalidad(b).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <ChartCard modelo={modeloCobertura({ ...b, eventos: s.eventos })} corte={corte} />
        <label className="my-5 grid max-w-sm gap-2 text-sm">
          Entidad de calidad
          <select
            className="w-full min-w-0"
            value={entidad}
            onChange={(e) => setEntidad(e.target.value as EntidadCalidad)}
          >
            {(['eventos', 'acciones', 'lecciones', 'proyectos'] as const).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <ChartCard modelo={modeloNulos} corte={corte} />
        <Tabla titulo="Ausencias por campo">
          <thead>
            <tr>
              <th>Campo</th>
              <th>Total</th>
              <th>Nulos</th>
              <th>% nulos</th>
              <th>Vacíos</th>
              <th>No consta textual</th>
              <th>Claves ausentes</th>
            </tr>
          </thead>
          <tbody>
            {calidad.map((r) => (
              <tr key={r.campo}>
                <td>{r.campo}</td>
                <td>{r.total}</td>
                <td>{r.nulos}</td>
                <td>{r.porcentajeNulos?.toFixed(2) ?? 'No calculable'}</td>
                <td>{r.vacios}</td>
                <td>{r.noConsta}</td>
                <td>{r.ausentes}</td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </>
    );
  return (
    <>
      <Titulo
        titulo="Análisis avanzado"
        subtitulo={`${s.eventos.length} registros en el contexto. Gráficos enlazados, tablas accesibles y exportaciones con procedencia.`}
      />
      <FiltrosPanel />
      <Tabs tabs={tabs} value={tab} onChange={setTab}>
        {contenido}
      </Tabs>
    </>
  );
}
